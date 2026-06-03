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

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>(loadSessions());
  const activeSessionId = ref<string>('');
  const isStreaming = ref(false);
  let abortController: AbortController | null = null;

  const activeSession = computed(() =>
    sessions.value.find(s => s.id === activeSessionId.value)
  );

  const sortedSessions = computed(() =>
    [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt)
  );

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.value));
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
    if (!content.trim()) return;

    let sessionId = activeSessionId.value;
    if (!sessionId) {
      sessionId = createSession();
    }

    const session = sessions.value.find(s => s.id === sessionId);
    if (!session) return;

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
    const assistantMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: settings.activeModel?.name || session.modelId,
      isLoading: true,
    };
    session.messages.push(assistantMsg);
    session.updatedAt = Date.now();
    save();

    // Find provider
    const provider = settings.settings.providers.find(p => p.id === session.providerId);
    if (!provider) {
      assistantMsg.isLoading = false;
      assistantMsg.error = '未找到模型提供商，请在设置中配置';
      save();
      return;
    }
    if (!provider.apiKey) {
      assistantMsg.isLoading = false;
      assistantMsg.error = `请先在设置中配置 ${provider.name} 的 API Key`;
      save();
      return;
    }

    // Stream response
    isStreaming.value = true;
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
        assistantMsg.content += chunk;
        save();
      }

      assistantMsg.isLoading = false;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        assistantMsg.content += '\n\n[已停止生成]';
      } else {
        assistantMsg.error = err instanceof Error ? err.message : '未知错误';
      }
      assistantMsg.isLoading = false;
    } finally {
      isStreaming.value = false;
      abortController = null;
      session.updatedAt = Date.now();
      save();
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