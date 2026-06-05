<template>
  <div class="chat-layout">
    <Sidebar :collapsed="sidebarCollapsed" />
    <div class="chat-main">
      <div class="chat-header">
        <div class="header-left">
          <button
            class="collapse-btn"
            @click="sidebarCollapsed = !sidebarCollapsed"
            :title="sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'"
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
            title="更改工作区目录"
          >
            工作区
          </button>
          <button
            v-if="chatStore.canPreview"
            class="preview-btn"
            :disabled="previewLoading"
            @click="handlePreview"
            title="预览应用"
          >
            {{ previewLoading ? '启动中...' : '▶ 预览' }}
          </button>
          <button
            class="theme-btn"
            @click="settingsStore.setTheme(isDark ? 'light' : 'dark')"
            :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
          >
            {{ isDark ? '☀' : '🌙' }}
          </button>
          <button
            v-if="chatStore.activeSession"
            class="clear-btn"
            @click="chatStore.clearMessages(chatStore.activeSessionId)"
            title="清空对话"
          >
            🗑 清空
          </button>
        </div>
      </div>

      <div ref="messagesRef" class="chat-messages">
        <div v-if="!chatStore.activeSession || chatStore.activeSession.messages.length === 0" class="empty-state">
          <div class="empty-icon">🎨</div>
          <h2>CodeAny</h2>
          <p>描述你想要的应用，AI 将先生成计划，再生成 HTML 文件</p>
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

      <div v-if="!chatStore.canSendMessage && chatStore.activeSession?.generationPhase === 'plan_ready'" class="input-hint">
        请先确认上方的开发计划，或等待生成完成
      </div>
      <ChatInput />
    </div>
    <WorkspaceSetup />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspaceStore } from '@/stores/workspace';
import { openProjectPreview } from '@/utils/preview';
import type { ChatMessage } from '@/types';
import Sidebar from '@/components/Sidebar.vue';
import ModelSelector from '@/components/ModelSelector.vue';
import MessageBubble from '@/components/MessageBubble.vue';
import ChatInput from '@/components/ChatInput.vue';
import WorkspaceSetup from '@/components/WorkspaceSetup.vue';

const chatStore = useChatStore();
const settingsStore = useSettingsStore();
const workspaceStore = useWorkspaceStore();
const messagesRef = ref<HTMLDivElement | null>(null);
const sidebarCollapsed = ref(false);
const previewLoading = ref(false);
const previewError = ref('');

const isDark = computed(() => settingsStore.settings.theme === 'dark');

const shortWorkspacePath = computed(() => {
  const path = workspaceStore.workspaceRoot;
  if (path.length <= 30) return path;
  return '...' + path.slice(-27);
});

const tips = [
  '做一个响应式待办清单页面',
  '生成一个深色主题的计算器',
  '创建一个个人作品集展示页',
  '做一个移动端友好的天气卡片 UI',
];

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

async function handlePreview() {
  const session = chatStore.activeSession;
  if (!session?.projectDir) return;

  previewLoading.value = true;
  previewError.value = '';
  try {
    await openProjectPreview(session.id, session.title, session.projectDir);
  } catch (err) {
    previewError.value = err instanceof Error ? err.message : '预览启动失败';
    alert(previewError.value);
  } finally {
    previewLoading.value = false;
  }
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
  padding: 10px 20px;
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
.preview-btn,
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

.preview-btn {
  background: var(--accent);
  color: white;
}

.preview-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.preview-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  background: rgba(74, 158, 255, 0.08);
}
</style>
