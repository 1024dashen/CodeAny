import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ChatSession, ChatMessage, ProjectFile } from '@/types';
import { useSettingsStore } from './settings';
import { useWorkspaceStore } from './workspace';
import { streamChat } from '@/utils/llm';
import { loadStorageValue, saveStorageValue } from '@/utils/store';
import {
  PLAN_SYSTEM_PROMPT,
  PLAN_REVISE_SYSTEM_PROMPT,
  buildGenerationSystemPrompt,
  buildGenerationUserPrompt,
} from '@/utils/generationPrompts';
import {
  parseProjectFiles,
  validateProjectFiles,
  extractPlanContent,
  isValidPlanContent,
} from '@/utils/codeParser';
import { writeProjectFilesToDisk } from '@/utils/preview';
import { applyGeneratedAppDefaults } from '@/utils/generatedAppDefaults';
import { ensureSessionIcon, pickRandomAppIcon } from '@/utils/sessionIcon';
import { t } from '@/i18n';

const STORAGE_KEY = 'sessions';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function defaultSession(
  settings: ReturnType<typeof useSettingsStore>['settings'],
  projectDir?: string,
): ChatSession {
  return {
    id: generateId(),
    title: t('sidebar.newApp'),
    messages: [],
    modelId: settings.activeModelId,
    providerId: settings.activeProviderId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    generationPhase: 'idle',
    projectDir,
  };
}

function normalizeSession(session: ChatSession): ChatSession {
  return ensureSessionIcon({
    ...session,
    generationPhase: session.generationPhase ?? 'idle',
  });
}

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>([]);
  const activeSessionId = ref('');
  const isStreaming = ref(false);
  const isHydrated = ref(false);
  let abortController: AbortController | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const activeSession = computed(() =>
    sessions.value.find(s => s.id === activeSessionId.value),
  );

  const sortedSessions = computed(() =>
    [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt),
  );

  const canSendMessage = computed(() => {
    const session = activeSession.value;
    if (!session || isStreaming.value) return false;
    const phase = session.generationPhase;
    return phase === 'idle' || phase === 'plan_ready' || phase === 'done' || phase === 'error';
  });

  const isPlanRevisionMode = computed(() => {
    const session = activeSession.value;
    return (
      session?.generationPhase === 'plan_ready'
      && !!session.planContent
      && isValidPlanContent(session.planContent)
    );
  });

  const canPreview = computed(() => {
    const session = activeSession.value;
    if (!session?.projectDir) return false;
    return session.generationPhase === 'done' && !!session.projectFiles?.length;
  });

  async function hydrate() {
    const saved = await loadStorageValue<ChatSession[]>(STORAGE_KEY, []);
    sessions.value = saved.map(normalizeSession);
    if (sessions.value.length > 0) {
      activeSessionId.value = [...sessions.value].sort(
        (a, b) => b.updatedAt - a.updatedAt,
      )[0].id;
    }
    isHydrated.value = true;
  }

  function save() {
    saveStorageValue(STORAGE_KEY, sessions.value);
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

  async function createSession(): Promise<string> {
    const settings = useSettingsStore();
    const workspace = useWorkspaceStore();

    const sessionId = generateId();
    const projectDir = await workspace.initSessionProjectDir(sessionId);

    const session = defaultSession(settings.settings, projectDir ?? undefined);
    session.id = sessionId;

    sessions.value.push(session);
    activeSessionId.value = session.id;
    flushSave();
    return session.id;
  }

  function deleteSession(sessionId: string) {
    sessions.value = sessions.value.filter(s => s.id !== sessionId);
    if (activeSessionId.value === sessionId) {
      activeSessionId.value = sessions.value[0]?.id || '';
    }
    flushSave();
  }

  function switchSession(sessionId: string) {
    activeSessionId.value = sessionId;
  }

  function getAllUserRequirements(session: ChatSession): string {
    const requirements = session.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');
    return requirements || session.title;
  }

  async function runStream(
    sessionId: string,
    assistantMsgId: string,
    systemPrompt: string,
    messages: ChatMessage[],
  ): Promise<string> {
    const settings = useSettingsStore();
    const session = sessions.value.find(s => s.id === sessionId);
    if (!session) return '';

    const provider = settings.settings.providers.find(p => p.id === session.providerId);
    if (!provider) {
      updateAssistantMessage(sessionId, assistantMsgId, {
        isLoading: false,
        error: '未找到模型提供商，请在设置中配置',
      });
      return '';
    }
    if (!provider.apiKey) {
      updateAssistantMessage(sessionId, assistantMsgId, {
        isLoading: false,
        error: `请先在设置中配置 ${provider.name} 的 API Key`,
      });
      return '';
    }

    abortController = new AbortController();

    try {
      const stream = streamChat(
        provider,
        session.modelId,
        messages,
        systemPrompt,
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
        return '';
      }

      updateAssistantMessage(sessionId, assistantMsgId, { isLoading: false });
      return finalMsg?.content ?? '';
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        updateAssistantMessage(sessionId, assistantMsgId, {
          isLoading: false,
          content:
            (sessions.value
              .find(s => s.id === sessionId)
              ?.messages.find(m => m.id === assistantMsgId)?.content || '') +
            '\n\n[已停止生成]',
        });
      } else {
        updateAssistantMessage(sessionId, assistantMsgId, {
          isLoading: false,
          error: err instanceof Error ? err.message : '未知错误',
        });
      }
      return '';
    } finally {
      abortController = null;
    }
  }

  async function sendMessage(content: string) {
    const settings = useSettingsStore();
    if (!content.trim() || !canSendMessage.value) return;

    let sessionId = activeSessionId.value;
    if (!sessionId) {
      sessionId = await createSession();
    }

    const session = sessions.value.find(s => s.id === sessionId);
    if (!session || session.generationPhase === 'plan_ready') return;

    if (!session.projectDir) {
      const workspace = useWorkspaceStore();
      session.projectDir =
        (await workspace.initSessionProjectDir(session.id)) ?? undefined;
    }

    session.providerId = settings.settings.activeProviderId;
    session.modelId = settings.settings.activeModelId;
    session.generationPhase = 'planning';

    isStreaming.value = true;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };
    session.messages.push(userMsg);

    if (session.messages.filter(m => m.role === 'user').length === 1) {
      session.title =
        content.trim().slice(0, 30) + (content.trim().length > 30 ? '...' : '');
    }

    const assistantMsgId = generateId();
    session.messages.push({
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: settings.activeModel?.name || session.modelId,
      isLoading: true,
    });
    session.updatedAt = Date.now();
    flushSave();

    const planSystemPrompt = [settings.settings.systemPrompt, PLAN_SYSTEM_PROMPT]
      .filter(Boolean)
      .join('\n\n');

    const contentResult = await runStream(
      sessionId,
      assistantMsgId,
      planSystemPrompt,
      session.messages.filter(m => !m.isLoading),
    );

    if (contentResult) {
      if (isValidPlanContent(contentResult)) {
        session.planContent = extractPlanContent(contentResult);
        session.generationPhase = 'plan_ready';
      } else {
        session.planContent = undefined;
        session.generationPhase = 'idle';
      }
    } else if (!session.messages.find(m => m.id === assistantMsgId)?.error) {
      session.generationPhase = 'error';
    } else {
      session.generationPhase = 'error';
    }

    isStreaming.value = false;
    session.updatedAt = Date.now();
    flushSave();
  }

  async function revisePlan(feedback: string) {
    const settings = useSettingsStore();
    const session = activeSession.value;
    if (!feedback.trim() || !session || session.generationPhase !== 'plan_ready' || isStreaming.value) {
      return;
    }

    const sessionId = session.id;
    session.providerId = settings.settings.activeProviderId;
    session.modelId = settings.settings.activeModelId;
    session.generationPhase = 'planning';
    isStreaming.value = true;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: feedback.trim(),
      timestamp: Date.now(),
    };
    session.messages.push(userMsg);

    const assistantMsgId = generateId();
    session.messages.push({
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: settings.activeModel?.name || session.modelId,
      isLoading: true,
    });
    session.updatedAt = Date.now();
    flushSave();

    const reviseSystemPrompt = [settings.settings.systemPrompt, PLAN_REVISE_SYSTEM_PROMPT]
      .filter(Boolean)
      .join('\n\n');

    const contentResult = await runStream(
      sessionId,
      assistantMsgId,
      reviseSystemPrompt,
      session.messages.filter(m => !m.isLoading),
    );

    if (contentResult) {
      if (isValidPlanContent(contentResult)) {
        session.planContent = extractPlanContent(contentResult);
        session.generationPhase = 'plan_ready';
      } else {
        session.planContent = undefined;
        session.generationPhase = 'idle';
      }
    } else if (!session.messages.find(m => m.id === assistantMsgId)?.error) {
      session.generationPhase = 'error';
    } else {
      session.generationPhase = 'error';
    }

    isStreaming.value = false;
    session.updatedAt = Date.now();
    flushSave();
  }

  async function confirmAndGenerate() {
    const session = activeSession.value;
    if (!session || session.generationPhase !== 'plan_ready' || isStreaming.value) return;
    if (!session.planContent) return;

    const settings = useSettingsStore();
    isStreaming.value = true;
    session.generationPhase = 'generating';

    const assistantMsgId = generateId();
    session.messages.push({
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: settings.activeModel?.name || session.modelId,
      isLoading: true,
    });
    session.updatedAt = Date.now();
    flushSave();

    const generationSystemPrompt = buildGenerationSystemPrompt(
      settings.settings.generationPrompt,
    );
    const userPrompt = buildGenerationUserPrompt(
      session.planContent,
      getAllUserRequirements(session),
    );

    const generationUserMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: userPrompt,
      timestamp: Date.now(),
    };

    const contentResult = await runStream(session.id, assistantMsgId, generationSystemPrompt, [
      generationUserMsg,
    ]);

    if (contentResult) {
      const files = parseProjectFiles(contentResult);
      const validationError = validateProjectFiles(files);

      if (validationError) {
        updateAssistantMessage(session.id, assistantMsgId, {
          error: validationError,
        });
        session.generationPhase = 'plan_ready';
      } else if (session.projectDir) {
        try {
          const filesWithDefaults = applyGeneratedAppDefaults(
            files as ProjectFile[],
            getAllUserRequirements(session),
          );
          await writeProjectFilesToDisk(session.projectDir, filesWithDefaults);
          session.projectFiles = filesWithDefaults;
          session.generationPhase = 'done';
          if (!session.icon) session.icon = pickRandomAppIcon();
        } catch (err) {
          updateAssistantMessage(session.id, assistantMsgId, {
            error: err instanceof Error ? err.message : '写入文件失败',
          });
          session.generationPhase = 'error';
        }
      } else {
        const filesWithDefaults = applyGeneratedAppDefaults(
          files as ProjectFile[],
          getAllUserRequirements(session),
        );
        session.projectFiles = filesWithDefaults;
        session.generationPhase = 'done';
        if (!session.icon) session.icon = pickRandomAppIcon();
        updateAssistantMessage(session.id, assistantMsgId, {
          error: '未设置工作区目录，文件仅保存在内存中',
        });
      }
    } else {
      session.generationPhase = 'error';
    }

    isStreaming.value = false;
    session.updatedAt = Date.now();
    flushSave();
  }

  function stopStreaming() {
    abortController?.abort();
    isStreaming.value = false;
  }

  function clearMessages(sessionId: string) {
    const session = sessions.value.find(s => s.id === sessionId);
    if (session) {
      session.messages = [];
      session.title = t('sidebar.newApp');
      session.generationPhase = 'idle';
      session.planContent = undefined;
      session.projectFiles = undefined;
      session.icon = undefined;
      session.updatedAt = Date.now();
      flushSave();
    }
  }

  return {
    sessions,
    activeSessionId,
    activeSession,
    sortedSessions,
    isStreaming,
    isHydrated,
    canSendMessage,
    isPlanRevisionMode,
    canPreview,
    hydrate,
    createSession,
    deleteSession,
    switchSession,
    sendMessage,
    revisePlan,
    confirmAndGenerate,
    stopStreaming,
    clearMessages,
  };
});
