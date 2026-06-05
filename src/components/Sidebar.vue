<template>
  <div class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <button class="new-chat-btn" @click="handleNewSession" :title="collapsed ? '新应用' : ''">
        <span class="icon">+</span>
        <span v-if="!collapsed" class="btn-text">新应用</span>
      </button>
    </div>

    <div class="session-list">
      <div
        v-for="session in chatStore.sortedSessions"
        :key="session.id"
        class="session-item"
        :class="{ active: session.id === chatStore.activeSessionId }"
        @click="chatStore.switchSession(session.id)"
        :title="collapsed ? session.title : ''"
      >
        <div class="session-info">
          <span class="session-icon">💬</span>
          <span v-if="!collapsed" class="session-title">{{ session.title }}</span>
        </div>
        <button v-if="!collapsed" class="session-delete" @click.stop="chatStore.deleteSession(session.id)" title="删除对话">
          ✕
        </button>
      </div>
    </div>

    <div class="sidebar-footer">
      <div class="user-menu-wrapper" @click.stop>
        <button class="user-trigger" :class="{ active: showUserMenu }" @click="toggleUserMenu">
          <div class="user-trigger-left">
            <div class="user-avatar">{{ authStore.userNickname.charAt(0).toUpperCase() }}</div>
            <div v-if="!collapsed" class="user-detail">
              <span class="user-name">{{ authStore.userNickname }}</span>
              <span class="user-email">{{ authStore.userEmail }}</span>
            </div>
          </div>
          <span v-if="!collapsed" class="user-chevron" :class="{ open: showUserMenu }">›</span>
        </button>

        <Transition name="menu">
          <div v-if="showUserMenu" class="user-dropdown" :class="{ 'dropdown-collapsed': collapsed }">
            <button class="dropdown-item" @click="goProfile">
              <span class="dropdown-icon">👤</span>
              <span v-if="collapsed">个人</span>
              <span v-else>个人中心</span>
            </button>
            <button class="dropdown-item" @click="goSettings">
              <span class="dropdown-icon">⚙</span>
              <span v-if="collapsed">设置</span>
              <span v-else>系统设置</span>
            </button>
            <button class="dropdown-item" @click="toggleTheme">
              <span class="dropdown-icon">{{ isDark ? '☀' : '🌙' }}</span>
              <span v-if="collapsed">{{ isDark ? '浅色' : '深色' }}</span>
              <span v-else>{{ isDark ? '浅色模式' : '深色模式' }}</span>
            </button>
            <button class="dropdown-item" @click="openHelp">
              <span class="dropdown-icon">📖</span>
              <span v-if="collapsed">帮助</span>
              <span v-else>帮助文档</span>
            </button>
            <button class="dropdown-item" @click="openAbout">
              <span class="dropdown-icon">ℹ️</span>
              <span v-if="collapsed">关于</span>
              <span v-else>关于我们</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item danger" @click="handleLogout">
              <span class="dropdown-icon">⏻</span>
              <span v-if="collapsed">退出</span>
              <span v-else>退出登录</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspaceStore } from '@/stores/workspace';
import { useRouter } from 'vue-router';

defineProps<{
  collapsed: boolean;
}>();

const chatStore = useChatStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const workspaceStore = useWorkspaceStore();
const router = useRouter();
const showUserMenu = ref(false);

const isDark = computed(() => settingsStore.settings.theme === 'dark');

function toggleTheme() {
  closeUserMenu();
  settingsStore.setTheme(isDark.value ? 'light' : 'dark');
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value;
}

async function handleNewSession() {
  await workspaceStore.ensureWorkspaceRoot();
  await chatStore.createSession();
}

function closeUserMenu() {
  showUserMenu.value = false;
}

function goProfile() {
  closeUserMenu();
  router.push('/profile');
}

function goSettings() {
  closeUserMenu();
  router.push('/settings');
}

function openHelp() {
  closeUserMenu();
  window.open('https://github.com/codeany/docs', '_blank');
}

function openAbout() {
  closeUserMenu();
  alert('CodeAny v0.1.0\nAI 智能对话助手，支持多种大语言模型');
}

async function handleLogout() {
  closeUserMenu();
  await authStore.logout();
  router.push('/login');
}

// 点击外部关闭菜单
function handleClickOutside() {
  closeUserMenu();
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
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
  transition: width 0.25s ease, min-width 0.25s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 60px;
  min-width: 60px;
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
  overflow: hidden;
  white-space: nowrap;
}

.collapsed .new-chat-btn {
  padding: 10px 0;
}

.new-chat-btn:hover {
  background: var(--accent-hover);
}

.new-chat-btn .icon {
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
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

.collapsed .session-item {
  justify-content: center;
  padding: 10px 0;
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

.collapsed .session-info {
  justify-content: center;
  flex: 0;
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

.collapsed .sidebar-footer {
  padding: 8px 6px;
}

.user-menu-wrapper {
  position: relative;
}

.user-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 0.15s;
  cursor: pointer;
}

.collapsed .user-trigger {
  justify-content: center;
  padding: 8px 0;
}

.user-trigger:hover {
  background: var(--bg-hover);
}

.user-trigger.active {
  background: var(--bg-active);
}

.user-trigger-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.collapsed .user-trigger-left {
  flex: 0;
  justify-content: center;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.user-email {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.user-chevron {
  font-size: 18px;
  color: var(--text-muted);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.user-chevron.open {
  transform: rotate(90deg);
}

.user-dropdown {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 12px;
  right: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 6px;
  box-shadow: var(--shadow);
  z-index: 100;
}

.user-dropdown.dropdown-collapsed {
  left: -4px;
  right: -4px;
  min-width: 140px;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-primary);
  transition: background 0.15s;
  text-align: left;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.dropdown-item.danger {
  color: var(--danger);
}

.dropdown-item.danger:hover {
  background: rgba(255, 74, 106, 0.1);
}

.dropdown-icon {
  width: 18px;
  text-align: center;
  font-size: 14px;
  flex-shrink: 0;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 8px;
}

/* 下拉菜单动画 */
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>