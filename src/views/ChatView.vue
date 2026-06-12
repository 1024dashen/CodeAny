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
          <button
            v-if="activeProjectDir"
            type="button"
            class="project-folder-btn"
            :title="projectFolderTitle"
            @click="openProjectFolder"
          >
            📂 {{ shortProjectFolderName }}
          </button>
        </div>
        <div class="header-actions">
          <button
            class="workspace-btn"
            @click="workspaceStore.pickWorkspaceRoot()"
            :title="t('chat.changeWorkspace')"
          >
            {{ t('chat.workspace') }}
          </button>
          <button
            v-if="chatStore.canPreview"
            type="button"
            class="app-settings-btn"
            :class="{ active: chatStore.showAppConfigPanel }"
            :title="t('appConfig.title')"
            @click="chatStore.toggleAppConfigPanel()"
          >
            {{ t('appConfig.settingsShort') }}
          </button>
          <PreviewSelector v-if="chatStore.canPreview" />
          <button
            v-if="chatStore.canPreview"
            type="button"
            class="publish-btn"
            :title="t('publish.title')"
            @click="showPublishDialog = true"
          >
            {{ t('publish.button') }}
          </button>
          <PublishDialog v-model:show="showPublishDialog" />
          <!-- <button
            v-if="chatStore.activeSession"
            class="clear-btn"
            @click="chatStore.clearMessages(chatStore.activeSessionId)"
            :title="t('chat.clearChat')"
          >
            🗑 {{ t('chat.clearChat') }}
          </button> -->
        </div>
      </div>

      <div ref="messagesRef" class="chat-messages">
        <AppConfigPanel v-if="chatStore.showAppConfigPanel && chatStore.canPreview" />
        <template v-else>
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
        </template>
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
import { useWorkspaceStore } from '@/stores/workspace';
import type { ChatMessage } from '@/types';
import { isValidPlanContent } from '@/utils/codeParser';
import { invoke, isTauri } from '@tauri-apps/api/core';
import Sidebar from '@/components/Sidebar.vue';
import ModelSelector from '@/components/ModelSelector.vue';
import PreviewSelector from '@/components/PreviewSelector.vue';
import PublishDialog from '@/components/PublishDialog.vue';
import AppConfigPanel from '@/components/AppConfigPanel.vue';
import MessageBubble from '@/components/MessageBubble.vue';
import ChatInput from '@/components/ChatInput.vue';
import WorkspaceSetup from '@/components/WorkspaceSetup.vue';

const { t } = useI18n();
const chatStore = useChatStore();
const workspaceStore = useWorkspaceStore();
const messagesRef = ref<HTMLDivElement | null>(null);
const sidebarCollapsed = ref(false);
const showPublishDialog = ref(false);

const activeProjectDir = computed(() => chatStore.activeSession?.projectDir ?? '');

const projectFolderName = computed(() => {
  const dir = activeProjectDir.value;
  if (!dir) return '';
  const normalized = dir.replace(/\\/g, '/');
  return normalized.split('/').filter(Boolean).pop() ?? dir;
});

const shortProjectFolderName = computed(() => projectFolderName.value.slice(0, 6));

const projectFolderTitle = computed(() => {
  if (!activeProjectDir.value) return '';
  return `${activeProjectDir.value}`;
});

async function openProjectFolder() {
  const dir = activeProjectDir.value;
  if (!dir || !isTauri()) return;
  try {
    await invoke('open_folder', { path: dir });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    alert(message);
  }
}

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
  if (!session.planContent || !isValidPlanContent(session.planContent)) return false;
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

.project-folder-btn {
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: 6px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.2s;
}

.project-folder-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
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
.clear-btn,
.app-settings-btn,
.publish-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.publish-btn {
  background: var(--accent);
  color: white;
  font-weight: 500;
}

.publish-btn:hover {
  background: var(--accent-hover);
  color: white;
}

.app-settings-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-hover);
}

.app-settings-btn:hover,
.app-settings-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.settings-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.workspace-btn:hover,
.clear-btn:hover {
  background: var(--bg-hover);
}

.clear-btn:hover {
  color: var(--danger);
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
