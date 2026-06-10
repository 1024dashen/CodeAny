<template>
  <div class="settings-panel">
    <h3 class="panel-title">{{ t('editor.title') }}</h3>

    <section class="settings-section">
      <h4>{{ t('editor.appearance') }}</h4>
      <div class="setting-row">
        <label>{{ t('editor.theme') }}</label>
        <select :value="settingsStore.settings.theme" @change="settingsStore.setTheme(($event.target as HTMLSelectElement).value as 'light' | 'dark')">
          <option value="dark">{{ t('editor.themeDark') }}</option>
          <option value="light">{{ t('editor.themeLight') }}</option>
        </select>
      </div>
      <div class="setting-row">
        <label>{{ t('lang.label') }}</label>
        <select
          :value="settingsStore.settings.locale"
          @change="settingsStore.setLocale(($event.target as HTMLSelectElement).value as AppLocale)"
        >
          <option v-for="loc in SUPPORTED_LOCALES" :key="loc" :value="loc">
            {{ t(`lang.${loc}`) }}
          </option>
        </select>
      </div>
    </section>

    <section class="settings-section">
      <h4>{{ t('editor.workspace') }}</h4>
      <div class="setting-row">
        <label>{{ t('editor.rootDir') }}</label>
        <input
          type="text"
          :value="workspaceStore.workspaceRoot"
          readonly
          :placeholder="t('editor.noWorkspace')"
        />
      </div>
      <button class="add-btn" @click="workspaceStore.pickWorkspaceRoot()">{{ t('editor.changeDir') }}</button>
      <p class="section-hint">{{ t('editor.workspaceHint') }}</p>
    </section>

    <section class="settings-section">
      <h4>{{ t('editor.inputBehavior') }}</h4>
      <div class="setting-row">
        <label>{{ t('editor.fontSize') }}</label>
        <select
          :value="settingsStore.settings.fontSize"
          @change="settingsStore.setFontSize(Number(($event.target as HTMLSelectElement).value))"
        >
          <option :value="12">12px</option>
          <option :value="14">14px</option>
          <option :value="16">16px</option>
          <option :value="18">18px</option>
        </select>
      </div>
      <div class="setting-row checkbox-row">
        <label>{{ t('editor.enterSend') }}</label>
        <label class="toggle-switch">
          <input
            type="checkbox"
            :checked="settingsStore.settings.sendOnEnter"
            @change="settingsStore.setSendOnEnter(($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <p class="section-hint">
        {{ settingsStore.settings.sendOnEnter ? t('editor.enterSendHint') : t('editor.enterNewlineHint') }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspaceStore } from '@/stores/workspace';
import { SUPPORTED_LOCALES } from '@/i18n';
import type { AppLocale } from '@/types';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const workspaceStore = useWorkspaceStore();
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.settings-section h4 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.setting-row label {
  min-width: 100px;
  font-size: 13px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.setting-row input,
.setting-row select {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  outline: none;
}

.setting-row input:focus,
.setting-row select:focus {
  border-color: var(--accent);
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

.add-btn {
  padding: 8px 20px;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin-top: 4px;
  transition: background 0.2s;
}

.add-btn:hover {
  background: var(--accent-hover);
}

.section-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
