<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <button class="new-chat-btn" @click="chatStore.createSession()">
        <span class="icon">+</span>
        <span>新对话</span>
      </button>
    </div>

    <div class="session-list">
      <div
        v-for="session in chatStore.sortedSessions"
        :key="session.id"
        class="session-item"
        :class="{ active: session.id === chatStore.activeSessionId }"
        @click="chatStore.switchSession(session.id)"
      >
        <div class="session-info">
          <span class="session-icon">💬</span>
          <span class="session-title">{{ session.title }}</span>
        </div>
        <button class="session-delete" @click.stop="chatStore.deleteSession(session.id)" title="删除对话">
          ✕
        </button>
      </div>
    </div>

    <div class="sidebar-footer">
      <button class="settings-btn" @click="$router.push('/settings')">
        <span class="icon">⚙</span>
        <span>设置</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '@/stores/chat';

const chatStore = useChatStore();
</script>

<style scoped>
.sidebar {
  width: 260px;
  min-width: 260px;
  height: 100%;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  user-select: none;
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

.new-chat-btn {
  width: 100%;
  padding: 10px 16px;
  background: var(--accent);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  transition: background 0.2s;
}

.new-chat-btn:hover {
  background: var(--accent-hover);
}

.new-chat-btn .icon {
  font-size: 18px;
  font-weight: bold;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}

.session-item:hover {
  background: var(--bg-hover);
}

.session-item.active {
  background: var(--bg-active);
}

.session-info {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  flex: 1;
}

.session-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.session-title {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-delete {
  opacity: 0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all 0.15s;
}

.session-item:hover .session-delete {
  opacity: 1;
}

.session-delete:hover {
  color: var(--danger);
  background: var(--bg-hover);
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--border-color);
}

.settings-btn {
  width: 100%;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.settings-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>