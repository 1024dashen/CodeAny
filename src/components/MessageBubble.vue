<template>
  <div class="message" :class="[`message-${message.role}`, { 'message-loading': message.isLoading }]">
    <!-- 助手消息：左对齐，头像在左 -->
    <template v-if="message.role === 'assistant'">
      <div class="message-avatar">
        <span>🤖</span>
      </div>
      <div class="message-body">
        <div class="message-header">
          <span class="message-role">助手</span>
          <span v-if="message.model" class="message-model">{{ message.model }}</span>
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>
        <div class="message-content-column">
          <div class="message-bubble-block">
            <div class="message-bubble">
              <div v-if="message.error" class="message-error">
                ⚠️ {{ message.error }}
              </div>
              <div v-else-if="message.isLoading && !message.content" class="message-loading-dots">
                <span></span><span></span><span></span>
              </div>
              <div v-else class="markdown-body" v-html="renderedContent"></div>
            </div>
            <div v-if="showMessageActions" class="message-actions">
              <button class="action-btn" :title="copied ? '已复制' : '复制'" @click="copyMessage">
                {{ copied ? '✓' : '📋' }}
              </button>
              <span class="action-btn action-btn-display" title="删除">🗑</span>
              <span class="action-btn action-btn-display" title="点赞">👍</span>
              <span class="action-btn action-btn-display" title="收藏">⭐</span>
            </div>
          </div>
          <PlanCard
            v-if="showPlanCard"
            :disabled="isGenerating"
            @confirm="$emit('confirm-plan')"
          />
          <ProjectFiles
            v-if="showProjectFiles && projectFiles?.length"
            :files="projectFiles"
          />
        </div>
      </div>
    </template>

    <!-- 用户消息：右对齐，头像在右 -->
    <template v-else>
      <div class="message-body">
        <div class="message-header is-right">
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          <span class="message-role">你</span>
        </div>
        <div class="message-bubble-block is-right">
          <div class="message-bubble is-user">
            <div v-if="message.error" class="message-error">
              ⚠️ {{ message.error }}
            </div>
            <div v-else class="message-text">{{ message.content }}</div>
          </div>
          <div v-if="showMessageActions" class="message-actions is-right">
            <button class="action-btn" :title="copied ? '已复制' : '复制'" @click="copyMessage">
              {{ copied ? '✓' : '📋' }}
            </button>
            <span class="action-btn action-btn-display" title="删除">🗑</span>
            <span class="action-btn action-btn-display" title="点赞">👍</span>
            <span class="action-btn action-btn-display" title="收藏">⭐</span>
          </div>
        </div>
      </div>
      <div class="message-avatar">
        <span>👤</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ChatMessage, ProjectFile } from '@/types';
import { renderMarkdown } from '@/utils/markdown';
import PlanCard from '@/components/PlanCard.vue';
import ProjectFiles from '@/components/ProjectFiles.vue';

const props = defineProps<{
  message: ChatMessage;
  showPlanCard?: boolean;
  showProjectFiles?: boolean;
  projectFiles?: ProjectFile[];
  isGenerating?: boolean;
}>();

defineEmits<{
  'confirm-plan': [];
}>();

const copied = ref(false);

const renderedContent = computed(() => {
  if (!props.message.content) return '';
  try {
    return renderMarkdown(props.message.content);
  } catch {
    return props.message.content;
  }
});

const showMessageActions = computed(
  () => !!props.message.content && !props.message.isLoading && !props.message.error,
);

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

async function copyMessage() {
  if (!props.message.content) return;
  try {
    await navigator.clipboard.writeText(props.message.content);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 1500);
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = props.message.content;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 1500);
  }
}
</script>

<style scoped>
.message {
  display: flex;
  gap: 10px;
  padding: 12px 20px;
  min-width: 0;
  max-width: 100%;
}

/* 用户消息：整行右对齐 */
.message-user {
  flex-direction: row;
  justify-content: flex-end;
}

/* 助手消息：整行左对齐（默认） */
.message-assistant {
  flex-direction: row;
  justify-content: flex-start;
}

.message-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: var(--bg-hover);
}

.message-body {
  max-width: 100%;
  min-width: 0;
}

.message-content-column {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  max-width: 100%;
  min-width: 0;
}

.message-content-column > :deep(.plan-card),
.message-content-column > :deep(.project-files) {
  width: 100%;
  box-sizing: border-box;
}

.message-bubble-block {
  width: fit-content;
  max-width: 100%;
  min-width: 0;
}

.message-bubble-block.is-right {
  align-self: flex-end;
}

.message-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
  padding: 0 2px;
}

.message-actions.is-right {
  justify-content: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  padding: 0 2px;
}

.message-header.is-right {
  justify-content: flex-end;
}

.message-role {
  font-weight: 600;
  font-size: 12px;
  color: var(--text-secondary);
}

.message-model {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--accent);
  color: white;
  opacity: 0.8;
}

.message-time {
  font-size: 11px;
  color: var(--text-muted);
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--bg-message-assistant);
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: hidden;
}

.message-bubble :deep(.markdown-body) {
  max-width: 100%;
  overflow-wrap: anywhere;
}

.message-bubble :deep(.markdown-body pre) {
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--code-scrollbar-thumb) 85%, transparent) transparent;
  background: var(--code-bg);
  border: 1px solid var(--code-border);
}

.message-bubble :deep(.markdown-body pre::-webkit-scrollbar) {
  height: 4px;
}

.message-bubble :deep(.markdown-body pre::-webkit-scrollbar-track) {
  background: transparent;
  margin: 0 2px 2px;
}

.message-bubble :deep(.markdown-body pre::-webkit-scrollbar-thumb) {
  background: color-mix(in srgb, var(--code-scrollbar-thumb) 85%, transparent);
  border-radius: 999px;
}

.message-bubble :deep(.markdown-body pre::-webkit-scrollbar-thumb:hover) {
  background: var(--accent);
}

.message-bubble :deep(.markdown-body pre code) {
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

.message-bubble :deep(.markdown-body table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--scrollbar-thumb) 70%, transparent) transparent;
}

.message-bubble :deep(.markdown-body table::-webkit-scrollbar) {
  height: 4px;
}

.message-bubble.is-user {
  background: var(--accent);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-assistant .message-bubble {
  border-bottom-left-radius: 4px;
}

.message-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.action-btn {
  width: 28px;
  height: 24px;
  border-radius: 6px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: transparent;
  transition: all 0.15s;
  cursor: pointer;
  border: none;
  padding: 0;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
}

.action-btn:active {
  transform: scale(0.9);
}

.action-btn-display {
  cursor: default;
  pointer-events: none;
  opacity: 0.7;
}

.message-error {
  color: var(--danger);
  padding: 4px 0;
  font-size: 13px;
}

.message-loading-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.message-loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 1.4s infinite ease-in-out;
}

.message-loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.message-loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>