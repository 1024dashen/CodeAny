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
        <div class="message-bubble">
          <div v-if="message.error" class="message-error">
            ⚠️ {{ message.error }}
          </div>
          <div v-else-if="message.isLoading && !message.content" class="message-loading-dots">
            <span></span><span></span><span></span>
          </div>
          <div v-else class="markdown-body" v-html="renderedContent"></div>
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
        <div class="message-bubble is-user">
          <div v-if="message.error" class="message-error">
            ⚠️ {{ message.error }}
          </div>
          <div v-else class="message-text">{{ message.content }}</div>
        </div>
      </div>
      <div class="message-avatar">
        <span>👤</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ChatMessage } from '@/types';
import { renderMarkdown } from '@/utils/markdown';

const props = defineProps<{
  message: ChatMessage;
}>();

const renderedContent = computed(() => {
  if (!props.message.content) return '';
  try {
    return renderMarkdown(props.message.content);
  } catch {
    return props.message.content;
  }
});

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.message {
  display: flex;
  gap: 10px;
  padding: 12px 20px;
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
  max-width: 70%;
  min-width: 0;
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