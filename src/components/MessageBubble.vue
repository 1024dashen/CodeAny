<template>
  <div class="message" :class="[`message-${message.role}`, { 'message-loading': message.isLoading }]">
    <div class="message-avatar">
      <span v-if="message.role === 'user'">👤</span>
      <span v-else>🤖</span>
    </div>
    <div class="message-body">
      <div class="message-header">
        <span class="message-role">{{ message.role === 'user' ? '你' : '助手' }}</span>
        <span v-if="message.model" class="message-model">{{ message.model }}</span>
        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
      </div>
      <div class="message-content">
        <div v-if="message.error" class="message-error">
          ⚠️ {{ message.error }}
        </div>
        <div v-else-if="message.isLoading && !message.content" class="message-loading-dots">
          <span></span><span></span><span></span>
        </div>
        <div v-else class="markdown-body" v-html="renderedContent"></div>
      </div>
    </div>
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
  gap: 12px;
  padding: 16px 20px;
  transition: background 0.15s;
}

.message-user {
  background: var(--bg-message-user);
}

.message-assistant {
  background: var(--bg-message-assistant);
}

.message-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: var(--bg-hover);
}

.message-body {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.message-role {
  font-weight: 600;
  font-size: 13px;
}

.message-model {
  font-size: 11px;
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

.message-content {
  font-size: 14px;
  line-height: 1.7;
}

.message-error {
  color: var(--danger);
  padding: 8px 12px;
  background: rgba(255, 74, 106, 0.1);
  border-radius: 8px;
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