import type { ChatMessage, ModelProvider, StreamChunk } from '@/types';
import { isTauri } from '@tauri-apps/api/core';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

/**
 * 通用 fetch：Tauri 环境用插件 fetch（绕过 CORS），浏览器环境降级为原生 fetch
 */
async function smartFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  if (isTauri()) {
    return tauriFetch(url, init);
  }
  return fetch(url, init);
}

function parseSSEDataLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const data = trimmed.slice(5).trimStart();
  if (!data || data === '[DONE]') return data === '[DONE]' ? '[DONE]' : null;
  return data;
}

function* yieldFromSSEBuffer(
  buffer: string,
  onLine: (data: string) => string | null,
): Generator<string, { remaining: string; done: boolean }> {
  const lines = buffer.split('\n');
  const remaining = lines.pop() || '';

  for (const rawLine of lines) {
    const data = parseSSEDataLine(rawLine);
    if (data === '[DONE]') return { remaining: '', done: true };
    if (!data) continue;
    const result = onLine(data);
    if (result) yield result;
  }

  return { remaining, done: false };
}

/**
 * 通用 SSE 流式读取器
 */
async function* readSSEStream(
  resp: Response,
  onLine: (data: string) => string | null,
): AsyncGenerator<string> {
  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const parsed = yield* yieldFromSSEBuffer(buffer, onLine);
        if (parsed.done) return;
        buffer = parsed.remaining;
      }
      if (done) break;
    }

    // 处理流结束时 buffer 中剩余的数据
    if (buffer.trim()) {
      const data = parseSSEDataLine(buffer);
      if (data === '[DONE]') return;
      if (data) {
        const result = onLine(data);
        if (result) yield result;
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // ignore cancel errors
    }
  }
}

function extractOpenAIChunk(parsed: StreamChunk & { error?: { message?: string } }): string | null {
  if (parsed.error?.message) {
    throw new Error(parsed.error.message);
  }
  const delta = parsed.choices?.[0]?.delta as { content?: string; reasoning_content?: string } | undefined;
  if (!delta) return null;
  return delta.content ?? delta.reasoning_content ?? null;
}

/**
 * Anthropic API 流式请求
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

  const resp = await smartFetch(`${provider.apiBase}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic API Error (${resp.status}): ${err}`);
  }

  yield* readSSEStream(resp, (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
        return parsed.delta.text;
      }
    } catch { /* skip */ }
    return null;
  });
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

  const resp = await smartFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API Error (${resp.status}): ${err}`);
  }

  let prevGeminiText = '';
  yield* readSSEStream(resp, (data) => {
    try {
      const parsed = JSON.parse(data);
      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
      if (!text) return null;
      const delta = text.startsWith(prevGeminiText)
        ? text.slice(prevGeminiText.length)
        : text;
      prevGeminiText = text;
      return delta || null;
    } catch { /* skip */ }
    return null;
  });
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

  const resp = await smartFetch(`${provider.apiBase}/chat/completions`, {
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

  yield* readSSEStream(resp, (data) => {
    try {
      const parsed = JSON.parse(data) as StreamChunk & { error?: { message?: string } };
      return extractOpenAIChunk(parsed);
    } catch { /* skip */ }
    return null;
  });
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