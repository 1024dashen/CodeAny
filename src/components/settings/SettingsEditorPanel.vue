<template>
  <div class="settings-panel">
    <h3 class="panel-title">{{ t('editor.title') }}</h3>

    <section class="settings-section">
      <h4>{{ t('editor.appearance') }}</h4>
      <div class="setting-row">
        <label>{{ t('editor.theme') }}</label>
        <NSelect
          class="setting-select"
          :value="settingsStore.settings.theme"
          :options="themeOptions"
          @update:value="settingsStore.setTheme"
        />
      </div>
      <div class="setting-row">
        <label>{{ t('lang.label') }}</label>
        <LanguageSwitcher block />
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
        <NSelect
          class="setting-select"
          :value="settingsStore.settings.fontSize"
          :options="fontSizeOptions"
          @update:value="settingsStore.setFontSize"
        />
      </div>
      <div class="setting-row switch-row">
        <label>{{ t('editor.enterSend') }}</label>
        <NSwitch
          :value="settingsStore.settings.sendOnEnter"
          @update:value="settingsStore.setSendOnEnter"
        />
      </div>
      <p class="section-hint">
        {{ settingsStore.settings.sendOnEnter ? t('editor.enterSendHint') : t('editor.enterNewlineHint') }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NSelect, NSwitch, type SelectOption } from 'naive-ui';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspaceStore } from '@/stores/workspace';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const workspaceStore = useWorkspaceStore();

const themeOptions = computed<SelectOption[]>(() => [
  { label: t('editor.themeDark'), value: 'dark' },
  { label: t('editor.themeLight'), value: 'light' },
]);

const fontSizeOptions = computed<SelectOption[]>(() =>
  [12, 14, 16, 18].map(size => ({
    label: `${size}px`,
    value: size,
  })),
);
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
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

.setting-row input {
  flex: 1;
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

.setting-select {
  flex: 1;
}

.switch-row {
  justify-content: space-between;
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
