<template>
  <div class="chat-layout">
    <Sidebar />
    <div class="chat-main">
      <div class="chat-header">
        <ModelSelector />
        <div class="header-actions">
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
          <div class="empty-icon">🤖</div>
          <h2>CodeAny</h2>
          <p>选择模型，开始对话</p>
          <div class="quick-tips">
            <div class="tip" v-for="tip in tips" :key="tip" @click="quickSend(tip)">
              {{ tip }}
            </div>
          </div>
        </div>
        <MessageBubble
          v-for="msg in chatStore.activeSession?.messages"
          :key="msg.id"
          :message="msg"
        />
      </div>

      <ChatInput />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useSettingsStore } from '@/stores/settings';
import Sidebar from '@/components/Sidebar.vue';
import ModelSelector from '@/components/ModelSelector.vue';
import MessageBubble from '@/components/MessageBubble.vue';
import ChatInput from '@/components/ChatInput.vue';

const chatStore = useChatStore();
const settingsStore = useSettingsStore();
const messagesRef = ref<HTMLDivElement | null>(null);

const isDark = computed(() => settingsStore.settings.theme === 'dark');

const tips = [
  '帮我写一段 Python 快速排序',
  '解释一下 Transformer 架构',
  '用 Vue3 写一个待办清单',
  '推荐一些好用的 VSCode 插件',
];

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}

function quickSend(text: string) {
  chatStore.sendMessage(text);
}

// Auto-scroll on new messages
watch(
  () => chatStore.activeSession?.messages?.length,
  () => scrollToBottom(),
);

watch(
  () => chatStore.activeSession?.messages?.[chatStore.activeSession.messages.length - 1]?.content,
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

.header-actions {
  display: flex;
  gap: 8px;
}

.clear-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.clear-btn:hover {
  background: var(--bg-hover);
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
  scroll-behavior: smooth;
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