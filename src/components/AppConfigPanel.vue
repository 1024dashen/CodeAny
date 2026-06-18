<template>
  <div class="app-config-panel">
    <!-- <div class="panel-header">
      <h3 class="panel-title">{{ t('appConfig.title') }}</h3>
      <button type="button" class="back-btn" @click="chatStore.closeAppConfigPanel()">
        {{ t('common.back') }}
      </button>
    </div> -->

    <div class="config-tabs" :data-active="activeTab">
      <span class="config-tab-indicator" aria-hidden="true" />
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
      <button
        type="button"
        class="config-tab"
        :class="{ active: activeTab === 'web' }"
        @click="activeTab = 'web'"
      >
        {{ t('appConfig.web') }}
      </button>
    </div>

    <div v-if="config" class="config-body">
      <Transition name="config-tab" mode="out-in">
      <section v-if="activeTab === 'desktop'" key="desktop" class="config-section">
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
        <div class="setting-row switch-row">
          <label>{{ t('appConfig.keepWindow') }}</label>
          <NSwitch v-model:value="config.desktop.keepWindow" />
        </div>
        <div class="setting-row switch-row">
          <label>{{ t('appConfig.debugMode') }}</label>
          <NSwitch v-model:value="config.desktop.debugMode" />
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

      <section v-else-if="activeTab === 'mobile'" key="mobile" class="config-section">
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
        <div class="setting-row switch-row">
          <label>{{ t('appConfig.networkAccess') }}</label>
          <NSwitch v-model:value="config.mobile.networkAccess" />
        </div>
        <div class="setting-row switch-row">
          <label>{{ t('appConfig.downloadFiles') }}</label>
          <NSwitch v-model:value="config.mobile.downloadFiles" />
        </div>
        <div class="setting-row switch-row">
          <label>{{ t('appConfig.locationPermission') }}</label>
          <NSwitch v-model:value="config.mobile.locationPermission" />
        </div>
        <div class="setting-row switch-row">
          <label>{{ t('appConfig.cameraPermission') }}</label>
          <NSwitch v-model:value="config.mobile.cameraPermission" />
        </div>
      </section>

      <section v-else-if="activeTab === 'web'" key="web" class="config-section">
        <div class="setting-row">
          <label>{{ t('web.domain') }}</label>
          <input v-model="config.web.domain" type="text" :placeholder="t('web.domainPlaceholder')" />
        </div>
        <div class="setting-row">
          <label>{{ t('web.icon') }}</label>
          <input v-model="config.web.icon" type="text" :placeholder="t('web.iconPlaceholder')" />
        </div>
        <div class="setting-row">
          <label>{{ t('web.siteTitle') }}</label>
          <input v-model="config.web.title" type="text" :placeholder="t('web.siteTitlePlaceholder')" />
        </div>
        <div class="setting-row">
          <label>{{ t('web.description') }}</label>
          <input v-model="config.web.description" type="text" :placeholder="t('web.descriptionPlaceholder')" />
        </div>
        <div class="setting-row">
          <label>{{ t('web.keywords') }}</label>
          <input v-model="config.web.keywords" type="text" :placeholder="t('web.keywordsPlaceholder')" />
        </div>
        <div class="setting-row">
          <label>{{ t('web.ogImage') }}</label>
          <input v-model="config.web.ogImage" type="text" :placeholder="t('web.ogImagePlaceholder')" />
        </div>
        <div class="setting-row switch-row">
          <label>{{ t('web.pwaEnabled') }}</label>
          <NSwitch v-model:value="config.web.pwa.enabled" />
        </div>
        <template v-if="config.web.pwa.enabled">
          <div class="setting-row">
            <label>{{ t('web.shortName') }}</label>
            <input v-model="config.web.pwa.shortName" type="text" :placeholder="t('web.shortNamePlaceholder')" />
          </div>
          <div class="setting-row">
            <label>{{ t('web.themeColor') }}</label>
            <input v-model="config.web.pwa.themeColor" type="text" :placeholder="t('web.themeColorPlaceholder')" />
          </div>
          <div class="setting-row">
            <label>{{ t('web.backgroundColor') }}</label>
            <input v-model="config.web.pwa.backgroundColor" type="text" :placeholder="t('web.backgroundColorPlaceholder')" />
          </div>
          <div class="setting-row">
            <label>{{ t('web.display') }}</label>
            <NSelect
              class="setting-select"
              v-model:value="config.web.pwa.display"
              :options="displayOptions"
            />
          </div>
          <div class="setting-row">
            <label>{{ t('web.orientation') }}</label>
            <NSelect
              class="setting-select"
              v-model:value="config.web.pwa.orientation"
              :options="orientationOptions"
            />
          </div>
        </template>
      </section>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NSwitch, NSelect, type SelectOption } from 'naive-ui';
import { useChatStore } from '@/stores/chat';
import type { GeneratedAppConfig } from '@/types';

const { t } = useI18n();
const chatStore = useChatStore();
const activeTab = ref<'desktop' | 'mobile' | 'web'>('desktop');
const config = ref<GeneratedAppConfig | null>(null);

const displayOptions = computed<SelectOption[]>(() => [
  { label: t('web.displayStandalone'), value: 'standalone' },
  { label: t('web.displayFullscreen'), value: 'fullscreen' },
  { label: t('web.displayMinimalUi'), value: 'minimal-ui' },
  { label: t('web.displayBrowser'), value: 'browser' },
]);

const orientationOptions = computed<SelectOption[]>(() => [
  { label: t('web.orientationAny'), value: 'any' },
  { label: t('web.orientationNatural'), value: 'natural' },
  { label: t('web.orientationLandscape'), value: 'landscape' },
  { label: t('web.orientationPortrait'), value: 'portrait' },
]);

watch(
  () => chatStore.getActiveAppConfig(),
  (value) => {
    if (value) {
      const cloned = structuredClone(value);
      // Ensure web config exists with default values
      if (!cloned.web) {
        cloned.web = {
          domain: '',
          icon: '',
          title: '',
          description: '',
          keywords: '',
          ogImage: '',
          pwa: {
            enabled: false,
            shortName: '',
            themeColor: '#1976d2',
            backgroundColor: '#ffffff',
            display: 'standalone',
            orientation: 'any',
          },
        };
      }
      config.value = cloned;
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
  padding: 10px;
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
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
  padding: 4px;
  margin-bottom: 10px;
  border-radius: 8px;
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
}

.config-tab-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc((100% - 8px - 8px) / 3);
  border-radius: 6px;
  background: var(--accent);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--accent) 35%, transparent);
  transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.config-tabs[data-active='mobile'] .config-tab-indicator {
  left: calc(4px + (100% - 8px - 8px) / 3 + 4px);
}

.config-tabs[data-active='web'] .config-tab-indicator {
  left: calc(4px + ((100% - 8px - 8px) / 3) * 2 + 8px);
}

.config-tab {
  position: relative;
  z-index: 1;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.25s ease;
}

.config-tab:hover:not(.active) {
  color: var(--text-primary);
}

.config-tab.active {
  color: white;
}

.config-tab-enter-active,
.config-tab-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.config-tab-enter-from,
.config-tab-leave-to {
  opacity: 0;
  transform: translateY(6px);
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
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  outline: none;
  transition: all 0.15s;
}

.setting-row input[type='text']:focus,
.setting-row input[type='number']:focus {
  border-color: var(--accent);
  background: var(--bg-input);
}

.setting-select {
  flex: 1;
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

.switch-row {
  justify-content: space-between;
}
</style>
