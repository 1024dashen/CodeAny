import type { ChatMessage, ModelProvider, StreamChunk } from '@/types';

/**
 * Anthropic API 流式请求（使用 SSE，但格式与 OpenAI 不同）
 */
async function* streamAnthropic(
  provider: ModelProvider,
  modelId: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const body: Record<string, unknown> = {
    model: modelId,
    max_tokens: 8192,
    messages,
    stream: true,
  };
  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const resp = await fetch(`${provider.apiBase}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic API Error (${resp.status}): ${err}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            yield parsed.delta.text;
          }
        } catch {
          // skip non-JSON lines
        }
      }
    }
  }
}

/**
 * Google Gemini API 流式请求
 */
async function* streamGemini(
  provider: ModelProvider,
  modelId: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  signal: AbortSignal,
): AsyncGenerator<string> {
  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: 8192,
    },
  };
  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const url = `${provider.apiBase}/models/${modelId}:streamGenerateContent?alt=sse&key=${provider.apiKey}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API Error (${resp.status}): ${err}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch {
          // skip
        }
      }
    }
  }
}

/**
 * OpenAI 兼容 API 流式请求（适用于 OpenAI、DeepSeek、Qwen、Zhipu、Moonshot 等兼容接口）
 */
async function* streamOpenAICompatible(
  provider: ModelProvider,
  modelId: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const allMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const resp = await fetch(`${provider.apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: allMessages,
      stream: true,
    }),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`API Error (${resp.status}): ${err}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed: StreamChunk = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // skip non-JSON lines
        }
      }
    }
  }
}

/**
 * 统一的流式聊天入口
 */
export async function* streamChat(
  provider: ModelProvider,
  modelId: string,
  messages: ChatMessage[],
  systemPrompt: string,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const apiMessages = messages
    .filter(m => m.role !== 'system' && !m.isLoading)
    .map(m => ({ role: m.role, content: m.content }));

  switch (provider.id) {
    case 'anthropic':
      yield* streamAnthropic(provider, modelId, apiMessages, systemPrompt, signal);
      break;
    case 'google':
      yield* streamGemini(provider, modelId, apiMessages, systemPrompt, signal);
      break;
    default:
      // OpenAI 兼容接口 (openai, deepseek, qwen, zhipu, moonshot, etc.)
      yield* streamOpenAICompatible(provider, modelId, apiMessages, systemPrompt, signal);
      break;
  }
}
