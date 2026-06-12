<template>
  <div class="app-config-panel">
    <!-- <div class="panel-header">
      <h3 class="panel-title">{{ t('appConfig.title') }}</h3>
      <button type="button" class="back-btn" @click="chatStore.closeAppConfigPanel()">
        {{ t('common.back') }}
      </button>
    </div> -->

    <div class="config-tabs">
      <button
        type="button"
        class="config-tab"
        :class="{ active: activeTab === 'desktop' }"
        @click="activeTab = 'desktop'"
      >
        {{ t('appConfig.desktop') }}
      </button>
      <button
        type="button"
        class="config-tab"
        :class="{ active: activeTab === 'mobile' }"
        @click="activeTab = 'mobile'"
      >
        {{ t('appConfig.mobile') }}
      </button>
    </div>

    <div v-if="config" class="config-body">
      <section v-show="activeTab === 'desktop'" class="config-section">
        <div class="setting-row">
          <label>{{ t('appConfig.name') }}</label>
          <input v-model="config.desktop.name" type="text" />
        </div>
        <div class="setting-row">
          <label>{{ t('appConfig.url') }}</label>
          <input v-model="config.desktop.url" type="text" :placeholder="t('appConfig.urlPlaceholder')" />
        </div>
        <div class="setting-row">
          <label>{{ t('appConfig.icon') }}</label>
          <input v-model="config.desktop.icon" type="text" />
        </div>
        <div class="setting-row">
          <label>{{ t('appConfig.id') }}</label>
          <input v-model="config.desktop.id" type="text" />
        </div>
        <div class="setting-row">
          <label>{{ t('appConfig.version') }}</label>
          <input v-model="config.desktop.version" type="text" />
        </div>
        <div class="setting-row checkbox-row">
          <label>{{ t('appConfig.keepWindow') }}</label>
          <label class="toggle-switch">
            <input v-model="config.desktop.keepWindow" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-row checkbox-row">
          <label>{{ t('appConfig.debugMode') }}</label>
          <label class="toggle-switch">
            <input v-model="config.desktop.debugMode" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-row">
          <label>{{ t('appConfig.windowSize') }}</label>
          <div class="size-inputs">
            <input v-model.number="config.desktop.windowWidth" type="number" min="1" />
            <span class="size-sep">×</span>
            <input v-model.number="config.desktop.windowHeight" type="number" min="1" />
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('appConfig.minSize') }}</label>
          <div class="size-inputs">
            <input v-model.number="config.desktop.minWidth" type="number" min="1" />
            <span class="size-sep">×</span>
            <input v-model.number="config.desktop.minHeight" type="number" min="1" />
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('appConfig.maxSize') }}</label>
          <div class="size-inputs">
            <input v-model.number="config.desktop.maxWidth" type="number" min="1" />
            <span class="size-sep">×</span>
            <input v-model.number="config.desktop.maxHeight" type="number" min="1" />
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('appConfig.userAgent') }}</label>
          <input v-model="config.desktop.userAgent" type="text" :placeholder="t('appConfig.userAgentPlaceholder')" />
        </div>
      </section>

      <section v-show="activeTab === 'mobile'" class="config-section">
        <div class="setting-row">
          <label>{{ t('appConfig.name') }}</label>
          <input v-model="config.mobile.name" type="text" />
        </div>
        <div class="setting-row">
          <label>{{ t('appConfig.url') }}</label>
          <input v-model="config.mobile.url" type="text" :placeholder="t('appConfig.urlPlaceholder')" />
        </div>
        <div class="setting-row">
          <label>{{ t('appConfig.icon') }}</label>
          <input v-model="config.mobile.icon" type="text" />
        </div>
        <div class="setting-row">
          <label>{{ t('appConfig.id') }}</label>
          <input v-model="config.mobile.id" type="text" />
        </div>
        <div class="setting-row">
          <label>{{ t('appConfig.version') }}</label>
          <input v-model="config.mobile.version" type="text" />
        </div>
        <div class="setting-row checkbox-row">
          <label>{{ t('appConfig.networkAccess') }}</label>
          <label class="toggle-switch">
            <input v-model="config.mobile.networkAccess" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-row checkbox-row">
          <label>{{ t('appConfig.downloadFiles') }}</label>
          <label class="toggle-switch">
            <input v-model="config.mobile.downloadFiles" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-row checkbox-row">
          <label>{{ t('appConfig.locationPermission') }}</label>
          <label class="toggle-switch">
            <input v-model="config.mobile.locationPermission" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-row checkbox-row">
          <label>{{ t('appConfig.cameraPermission') }}</label>
          <label class="toggle-switch">
            <input v-model="config.mobile.cameraPermission" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useChatStore } from '@/stores/chat';
import type { GeneratedAppConfig } from '@/types';

const { t } = useI18n();
const chatStore = useChatStore();
const activeTab = ref<'desktop' | 'mobile'>('desktop');
const config = ref<GeneratedAppConfig | null>(null);

watch(
  () => chatStore.getActiveAppConfig(),
  (value) => {
    if (value) {
      config.value = structuredClone(value);
    } else {
      config.value = null;
    }
  },
  { immediate: true },
);

watch(
  config,
  (value) => {
    if (value) {
      chatStore.updateAppConfig(value);
    }
  },
  { deep: true },
);
</script>

<style scoped>
.app-config-panel {
  /* max-width: 720px; */
  margin: 0 auto;
  padding: 24px 20px 32px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
}

.back-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.config-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 24px;
  border-radius: 8px;
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
}

.config-tab {
  flex: 1;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.config-tab:hover {
  color: var(--text-primary);
}

.config-tab.active {
  background: var(--accent);
  color: white;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.setting-row label {
  min-width: 120px;
  font-size: 13px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.setting-row input[type='text'],
.setting-row input[type='number'] {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  outline: none;
}

.setting-row input:focus {
  border-color: var(--accent);
}

.size-inputs {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-inputs input {
  flex: 1;
  min-width: 0;
}

.size-sep {
  color: var(--text-muted);
  flex-shrink: 0;
}

.checkbox-row {
  justify-content: space-between;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  transition: background 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--accent);
  border-color: var(--accent);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}
</style>
