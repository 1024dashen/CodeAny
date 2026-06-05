<template>
  <div class="chat-input">
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        placeholder="输入消息... (Shift+Enter 换行, Enter 发送)"
        rows="1"
        @input="autoResize"
        @keydown="handleKeydown"
      />
      <div class="input-actions">
        <button
          v-if="chatStore.isStreaming"
          class="stop-btn"
          @click="chatStore.stopStreaming()"
          title="停止生成"
        >
          ■ 停止
        </button>
        <button
          v-else
          class="send-btn"
          :disabled="!inputText.trim() || !chatStore.canSendMessage"
          @click="handleSend"
          title="发送"
        >
          ➤
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useWorkspaceStore } from '@/stores/workspace';

const chatStore = useChatStore();
const workspaceStore = useWorkspaceStore();
const inputText = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function autoResize() {
  const el = textareaRef.value;
  if (el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

async function handleSend() {
  const text = inputText.value.trim();
  if (!text || !chatStore.canSendMessage) return;

  inputText.value = '';
  await nextTick();
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
  }

  await workspaceStore.ensureWorkspaceRoot();
  await chatStore.sendMessage(text);
}
</script>

<style scoped>
.chat-input {
  padding: 12px 20px 16px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 8px 12px;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--accent);
}

textarea {
  flex: 1;
  border: none;
  background: transparent;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  max-height: 200px;
  padding: 4px 0;
  color: var(--text-primary);
}

textarea:focus {
  outline: none;
}

textarea::placeholder {
  color: var(--text-muted);
}

.input-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stop-btn {
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--danger);
  color: white;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.stop-btn:hover {
  opacity: 0.85;
}
</style>