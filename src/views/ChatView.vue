<template>
  <div class="chat-layout">
    <Sidebar :collapsed="sidebarCollapsed" />
    <div class="chat-main">
      <div class="chat-header">
        <div class="header-left">
          <button
            class="collapse-btn"
            @click="sidebarCollapsed = !sidebarCollapsed"
            :title="sidebarCollapsed ? t('chat.expandSidebar') : t('chat.collapseSidebar')"
          >
            {{ sidebarCollapsed ? '☰' : '◁' }}
          </button>
          <ModelSelector />
          <span v-if="workspaceStore.workspaceRoot" class="workspace-path" :title="workspaceStore.workspaceRoot">
            📂 {{ shortWorkspacePath }}
          </span>
        </div>
        <div class="header-actions">
          <button
            class="workspace-btn"
            @click="workspaceStore.pickWorkspaceRoot()"
            :title="t('chat.changeWorkspace')"
          >
            {{ t('chat.workspace') }}
          </button>
          <PreviewSelector v-if="chatStore.canPreview" />
          <button
            class="theme-btn"
            @click="settingsStore.setTheme(isDark ? 'light' : 'dark')"
            :title="isDark ? t('chat.switchToLight') : t('chat.switchToDark')"
          >
            {{ isDark ? '☀' : '🌙' }}
          </button>
          <button
            v-if="chatStore.activeSession"
            class="clear-btn"
            @click="chatStore.clearMessages(chatStore.activeSessionId)"
            :title="t('chat.clearChat')"
          >
            🗑 {{ t('chat.clearChat') }}
          </button>
        </div>
      </div>

      <div ref="messagesRef" class="chat-messages">
        <div v-if="!chatStore.activeSession || chatStore.activeSession.messages.length === 0" class="empty-state">
          <div class="empty-icon">🎨</div>
          <h2>CodeAny</h2>
          <p>{{ t('chat.emptyDesc') }}</p>
          <div class="quick-tips">
            <div class="tip" v-for="tip in tips" :key="tip" @click="quickSend(tip)">
              {{ tip }}
            </div>
          </div>
        </div>
        <MessageBubble
          v-for="(msg, index) in chatStore.activeSession?.messages"
          :key="msg.id"
          :message="msg"
          :show-plan-card="shouldShowPlanCard(msg, index)"
          :show-project-files="shouldShowProjectFiles(msg, index)"
          :project-files="chatStore.activeSession?.projectFiles"
          :is-generating="chatStore.isStreaming"
          @confirm-plan="chatStore.confirmAndGenerate()"
        />
      </div>

      <div v-if="chatStore.isPlanRevisionMode" class="input-hint">
        {{ t('chat.planRevisionHint') }}
      </div>
      <div
        v-else-if="!chatStore.canSendMessage && chatStore.activeSession"
        class="input-hint"
      >
        {{ t('chat.waitGenerating') }}
      </div>
      <ChatInput />
    </div>
    <WorkspaceSetup />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useChatStore } from '@/stores/chat';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspaceStore } from '@/stores/workspace';
import type { ChatMessage } from '@/types';
import Sidebar from '@/components/Sidebar.vue';
import ModelSelector from '@/components/ModelSelector.vue';
import PreviewSelector from '@/components/PreviewSelector.vue';
import MessageBubble from '@/components/MessageBubble.vue';
import ChatInput from '@/components/ChatInput.vue';
import WorkspaceSetup from '@/components/WorkspaceSetup.vue';

const { t } = useI18n();
const chatStore = useChatStore();
const settingsStore = useSettingsStore();
const workspaceStore = useWorkspaceStore();
const messagesRef = ref<HTMLDivElement | null>(null);
const sidebarCollapsed = ref(false);
const isDark = computed(() => settingsStore.settings.theme === 'dark');

const shortWorkspacePath = computed(() => {
  const path = workspaceStore.workspaceRoot;
  if (path.length <= 30) return path;
  return '...' + path.slice(-27);
});

const tips = computed(() => [
  t('chat.tips.todo'),
  t('chat.tips.calculator'),
  t('chat.tips.portfolio'),
  t('chat.tips.weather'),
]);

function shouldShowPlanCard(msg: ChatMessage, index: number): boolean {
  const session = chatStore.activeSession;
  if (!session || msg.role !== 'assistant') return false;
  if (session.generationPhase !== 'plan_ready') return false;
  const messages = session.messages;
  const lastAssistantIndex = [...messages]
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.role === 'assistant' && !m.isLoading)
    .pop()?.i;
  return index === lastAssistantIndex;
}

function shouldShowProjectFiles(msg: ChatMessage, index: number): boolean {
  const session = chatStore.activeSession;
  if (!session || msg.role !== 'assistant') return false;
  if (session.generationPhase !== 'done') return false;
  const messages = session.messages;
  const lastAssistantIndex = messages.length - 1;
  return index === lastAssistantIndex && !!session.projectFiles?.length;
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}

async function quickSend(text: string) {
  await workspaceStore.ensureWorkspaceRoot();
  await chatStore.sendMessage(text);
}

watch(
  () => chatStore.activeSession?.messages?.length,
  () => scrollToBottom(),
);

watch(
  () => chatStore.activeSession?.messages?.[chatStore.activeSession!.messages.length - 1]?.content,
  () => scrollToBottom(),
);
</script>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-primary);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.workspace-path {
  font-size: 12px;
  color: var(--text-muted);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collapse-btn {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 16px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.workspace-btn,
.clear-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.workspace-btn:hover,
.clear-btn:hover {
  background: var(--bg-hover);
}

.clear-btn:hover {
  color: var(--danger);
}

.theme-btn {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 16px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.theme-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.input-hint {
  padding: 8px 20px 0;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  gap: 12px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 8px;
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state p {
  font-size: 15px;
}

.quick-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  max-width: 600px;
  justify-content: center;
}

.tip {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tip:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
</style>
