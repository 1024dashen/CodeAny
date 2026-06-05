import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ChatSession, ChatMessage } from '@/types';
import { useSettingsStore } from './settings';
import { streamChat } from '@/utils/llm';

const STORAGE_KEY = 'codeany-sessions';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadActiveSessionId(saved: ChatSession[]): string {
  if (saved.length === 0) return '';
  return [...saved].sort((a, b) => b.updatedAt - a.updatedAt)[0].id;
}

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>(loadSessions());
  const activeSessionId = ref<string>(loadActiveSessionId(loadSessions()));
  const isStreaming = ref(false);
  let abortController: AbortController | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const activeSession = computed(() =>
    sessions.value.find(s => s.id === activeSessionId.value)
  );

  const sortedSessions = computed(() =>
    [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt)
  );

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.value));
  }

  function saveDebounced() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      save();
      saveTimer = null;
    }, 300);
  }

  function flushSave() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    save();
  }

  function updateAssistantMessage(
    sessionId: string,
    messageId: string,
    patch: Partial<ChatMessage>,
  ) {
    const session = sessions.value.find(s => s.id === sessionId);
    if (!session) return;
    const index = session.messages.findIndex(m => m.id === messageId);
    if (index < 0) return;
    session.messages[index] = { ...session.messages[index], ...patch };
  }

  function appendAssistantContent(sessionId: string, messageId: string, chunk: string) {
    const session = sessions.value.find(s => s.id === sessionId);
    if (!session) return;
    const index = session.messages.findIndex(m => m.id === messageId);
    if (index < 0) return;
    const msg = session.messages[index];
    session.messages[index] = { ...msg, content: msg.content + chunk };
  }

  function createSession(): string {
    const settings = useSettingsStore();
    const session: ChatSession = {
      id: generateId(),
      title: '新对话',
      messages: [],
      modelId: settings.settings.activeModelId,
      providerId: settings.settings.activeProviderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    sessions.value.push(session);
    activeSessionId.value = session.id;
    save();
    return session.id;
  }

  function deleteSession(sessionId: string) {
    sessions.value = sessions.value.filter(s => s.id !== sessionId);
    if (activeSessionId.value === sessionId) {
      activeSessionId.value = sessions.value[0]?.id || '';
    }
    save();
  }

  function switchSession(sessionId: string) {
    activeSessionId.value = sessionId;
  }

  async function sendMessage(content: string) {
    const settings = useSettingsStore();
    if (!content.trim() || isStreaming.value) return;

    let sessionId = activeSessionId.value;
    if (!sessionId) {
      sessionId = createSession();
    }

    const session = sessions.value.find(s => s.id === sessionId);
    if (!session) return;

    // 使用当前设置中的模型，避免会话缓存旧配置
    session.providerId = settings.settings.activeProviderId;
    session.modelId = settings.settings.activeModelId;

    isStreaming.value = true;

    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };
    session.messages.push(userMsg);

    // Auto title from first message
    if (session.messages.filter(m => m.role === 'user').length === 1) {
      session.title = content.trim().slice(0, 30) + (content.trim().length > 30 ? '...' : '');
    }

    // Add assistant placeholder
    const assistantMsgId = generateId();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: settings.activeModel?.name || session.modelId,
      isLoading: true,
    };
    session.messages.push(assistantMsg);
    session.updatedAt = Date.now();
    flushSave();

    // Find provider
    const provider = settings.settings.providers.find(p => p.id === session.providerId);
    if (!provider) {
      updateAssistantMessage(sessionId, assistantMsgId, {
        isLoading: false,
        error: '未找到模型提供商，请在设置中配置',
      });
      isStreaming.value = false;
      flushSave();
      return;
    }
    if (!provider.apiKey) {
      updateAssistantMessage(sessionId, assistantMsgId, {
        isLoading: false,
        error: `请先在设置中配置 ${provider.name} 的 API Key`,
      });
      isStreaming.value = false;
      flushSave();
      return;
    }

    abortController = new AbortController();

    try {
      const stream = streamChat(
        provider,
        session.modelId,
        session.messages.filter(m => !m.isLoading),
        settings.settings.systemPrompt,
        abortController.signal,
      );

      for await (const chunk of stream) {
        appendAssistantContent(sessionId, assistantMsgId, chunk);
        saveDebounced();
      }

      const finalMsg = sessions.value
        .find(s => s.id === sessionId)
        ?.messages.find(m => m.id === assistantMsgId);

      if (finalMsg && !finalMsg.content && !finalMsg.error) {
        updateAssistantMessage(sessionId, assistantMsgId, {
          isLoading: false,
          error: '模型未返回任何内容，请检查 API Key、模型名称和网络连接',
        });
      } else {
        updateAssistantMessage(sessionId, assistantMsgId, { isLoading: false });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        updateAssistantMessage(sessionId, assistantMsgId, {
          isLoading: false,
          content: (sessions.value
            .find(s => s.id === sessionId)
            ?.messages.find(m => m.id === assistantMsgId)?.content || '') + '\n\n[已停止生成]',
        });
      } else {
        updateAssistantMessage(sessionId, assistantMsgId, {
          isLoading: false,
          error: err instanceof Error ? err.message : '未知错误',
        });
      }
    } finally {
      isStreaming.value = false;
      abortController = null;
      session.updatedAt = Date.now();
      flushSave();
    }
  }

  function stopStreaming() {
    abortController?.abort();
  }

  function clearMessages(sessionId: string) {
    const session = sessions.value.find(s => s.id === sessionId);
    if (session) {
      session.messages = [];
      session.title = '新对话';
      session.updatedAt = Date.now();
      save();
    }
  }

  return {
    sessions,
    activeSessionId,
    activeSession,
    sortedSessions,
    isStreaming,
    createSession,
    deleteSession,
    switchSession,
    sendMessage,
    stopStreaming,
    clearMessages,
  };
});