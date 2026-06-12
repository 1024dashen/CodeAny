<template>
  <div class="settings-page">
    <div class="settings-header">
      <button class="back-btn" @click="$router.push('/')">← {{ t('common.back') }}</button>
      <h2>{{ t('settings.title') }}</h2>
    </div>

    <div class="settings-layout">
      <nav class="settings-nav">
        <button
          v-for="item in menuItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: activeTab === item.id }"
          @click="switchTab(item.id)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </nav>

      <main class="settings-content">
        <SettingsProfilePanel v-if="activeTab === 'profile'" />
        <SettingsModelPanel v-else-if="activeTab === 'model'" />
        <SettingsEditorPanel v-else-if="activeTab === 'editor'" />
        <SettingsExtensionPanel v-else-if="activeTab === 'extension'" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import SettingsProfilePanel from '@/components/settings/SettingsProfilePanel.vue';
import SettingsModelPanel from '@/components/settings/SettingsModelPanel.vue';
import SettingsEditorPanel from '@/components/settings/SettingsEditorPanel.vue';
import SettingsExtensionPanel from '@/components/settings/SettingsExtensionPanel.vue';

type SettingsTab = 'profile' | 'model' | 'editor' | 'extension';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const activeTab = ref<SettingsTab>('profile');

const menuItems = computed(() => [
  { id: 'profile' as SettingsTab, label: t('settings.tabs.profile'), icon: '👤' },
  { id: 'model' as SettingsTab, label: t('settings.tabs.model'), icon: '🤖' },
  { id: 'editor' as SettingsTab, label: t('settings.tabs.editor'), icon: '📝' },
  { id: 'extension' as SettingsTab, label: t('settings.tabs.extension'), icon: '🧩' },
]);

const validTabs = new Set<SettingsTab>(['profile', 'model', 'editor', 'extension']);

function resolveTab(tab: unknown): SettingsTab {
  return typeof tab === 'string' && validTabs.has(tab as SettingsTab)
    ? (tab as SettingsTab)
    : 'profile';
}

function switchTab(tab: SettingsTab) {
  activeTab.value = tab;
  router.replace({ query: { tab } });
}

onMounted(() => {
  activeTab.value = resolveTab(route.query.tab);
});

watch(
  () => route.query.tab,
  tab => {
    activeTab.value = resolveTab(tab);
  },
);
</script>

<style scoped>
.settings-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.settings-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.back-btn {
  padding: 6px 12px;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 14px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
}

.settings-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.settings-nav {
  width: 260px;
  min-width: 260px;
  padding: 16px 12px;
  border-right: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  text-align: left;
  transition: all 0.15s;
  width: 100%;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--bg-active);
  color: var(--accent);
  font-weight: 500;
}

.nav-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.nav-label {
  white-space: nowrap;
}

.settings-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 28px 36px;
}
</style>
