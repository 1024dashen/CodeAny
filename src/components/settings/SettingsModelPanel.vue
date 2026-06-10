<template>
  <div class="settings-panel">
    <h3 class="panel-title">{{ t('model.title') }}</h3>

    <section class="settings-section">
      <h4>{{ t('model.generationPrompt') }}</h4>
      <textarea
        class="system-prompt-input"
        :value="settingsStore.settings.generationPrompt"
        @input="settingsStore.setGenerationPrompt(($event.target as HTMLTextAreaElement).value)"
        :placeholder="t('model.generationPlaceholder')"
        rows="3"
      />
    </section>

    <section class="settings-section">
      <h4>{{ t('model.systemPrompt') }}</h4>
      <textarea
        class="system-prompt-input"
        :value="settingsStore.settings.systemPrompt"
        @input="settingsStore.setSystemPrompt(($event.target as HTMLTextAreaElement).value)"
        :placeholder="t('model.systemPlaceholder')"
        rows="3"
      />
    </section>

    <section class="settings-section">
      <h4>{{ t('model.providers') }}</h4>
      <div
        v-for="provider in settingsStore.allProviders"
        :key="provider.id"
        class="provider-card"
      >
        <div class="provider-header">
          <span class="provider-name">{{ provider.name }}</span>
          <div class="provider-header-right">
            <span class="provider-id">{{ provider.id }}</span>
            <button class="provider-delete" @click="removeProvider(provider.id, provider.name)" :title="t('model.deleteProvider')">{{ t('model.delete') }}</button>
          </div>
        </div>
        <div class="provider-body">
          <div class="setting-row">
            <label>API Base</label>
            <input
              type="text"
              :value="provider.apiBase"
              @change="settingsStore.updateProvider(provider.id, { apiBase: ($event.target as HTMLInputElement).value })"
              placeholder="API Base URL"
            />
          </div>
          <div class="setting-row">
            <label>API Key</label>
            <div class="api-key-input">
              <input
                :type="showKeys[provider.id] ? 'text' : 'password'"
                :value="provider.apiKey"
                @change="settingsStore.updateApiKey(provider.id, ($event.target as HTMLInputElement).value)"
                :placeholder="t('model.apiKeyPlaceholder')"
              />
              <button class="toggle-key" @click="toggleKey(provider.id)">
                {{ showKeys[provider.id] ? t('common.hide') : t('common.show') }}
              </button>
            </div>
          </div>
          <div class="provider-models">
            <span class="models-label">{{ t('model.availableModels') }}</span>
            <div
              v-for="model in provider.models"
              :key="model.id"
              class="model-tag"
            >
              <span>{{ model.name }}</span>
              <button class="model-remove" @click="settingsStore.removeModel(provider.id, model.id)" :title="t('model.removeModel')">✕</button>
            </div>
            <div class="add-model-row">
              <input
                v-model="newModelIds[provider.id]"
                class="add-model-input"
                :placeholder="t('model.modelId')"
                @keydown.enter="addModel(provider.id)"
              />
              <button class="add-model-btn" @click="addModel(provider.id)">+</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="settings-section">
      <h4>{{ t('model.addProvider') }}</h4>
      <div class="add-provider-form">
        <div class="setting-row">
          <label>{{ t('model.name') }}</label>
          <input v-model="newProvider.name" :placeholder="t('model.namePlaceholder')" />
        </div>
        <div class="setting-row">
          <label>API Base</label>
          <input v-model="newProvider.apiBase" :placeholder="t('model.apiBasePlaceholder')" />
        </div>
        <div class="setting-row">
          <label>API Key</label>
          <input v-model="newProvider.apiKey" type="password" placeholder="API Key" />
        </div>
        <div class="setting-row">
          <label>{{ t('model.modelId') }}</label>
          <input v-model="newProvider.modelId" :placeholder="t('model.modelIdPlaceholder')" />
        </div>
        <button class="add-btn" @click="addCustomProvider">{{ t('model.addProviderBtn') }}</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const showKeys = ref<Record<string, boolean>>({});
const newModelIds = reactive<Record<string, string>>({});

const newProvider = reactive({
  name: '',
  apiBase: '',
  apiKey: '',
  modelId: '',
});

function toggleKey(providerId: string) {
  showKeys.value[providerId] = !showKeys.value[providerId];
}

function addModel(providerId: string) {
  const modelId = newModelIds[providerId]?.trim();
  if (!modelId) return;
  settingsStore.addModel(providerId, modelId);
  newModelIds[providerId] = '';
}

function removeProvider(providerId: string, providerName: string) {
  if (confirm(t('model.deleteProviderConfirm', { name: providerName }))) {
    settingsStore.removeProvider(providerId);
  }
}

function addCustomProvider() {
  if (!newProvider.name || !newProvider.apiBase || !newProvider.modelId) return;

  const id = 'custom-' + Date.now().toString(36);
  const modelIds = newProvider.modelId.split(',').map(s => s.trim()).filter(Boolean);

  settingsStore.addProvider({
    id,
    name: newProvider.name,
    apiBase: newProvider.apiBase,
    apiKey: newProvider.apiKey,
    models: modelIds.map(mid => ({
      id: mid,
      name: mid,
      providerId: id,
    })),
  });

  newProvider.name = '';
  newProvider.apiBase = '';
  newProvider.apiKey = '';
  newProvider.modelId = '';
}
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
  min-width: 80px;
  font-size: 13px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.setting-row input,
.setting-row select {
  flex: 1;
}

.system-prompt-input {
  width: 100%;
  min-height: 80px;
  resize: vertical;
  padding: 10px 12px;
  font-size: 14px;
  border-radius: 8px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  outline: none;
}

.system-prompt-input:focus {
  border-color: var(--accent);
}

.provider-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
}

.provider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-hover);
}

.provider-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.provider-delete {
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-muted);
  transition: all 0.15s;
}

.provider-delete:hover {
  color: var(--danger);
  background: rgba(255, 74, 106, 0.1);
}

.provider-name {
  font-weight: 600;
  font-size: 14px;
}

.provider-id {
  font-size: 12px;
  color: var(--text-muted);
  font-family: monospace;
}

.provider-body {
  padding: 16px;
}

.api-key-input {
  display: flex;
  flex: 1;
  gap: 8px;
}

.api-key-input input {
  flex: 1;
}

.toggle-key {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-hover);
  white-space: nowrap;
}

.toggle-key:hover {
  color: var(--accent);
}

.provider-models {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.models-label {
  font-size: 12px;
  color: var(--text-muted);
}

.model-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.model-remove {
  font-size: 10px;
  color: var(--text-muted);
  padding: 0 2px;
  border-radius: 2px;
  line-height: 1;
}

.model-remove:hover {
  color: var(--danger);
}

.add-model-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.add-model-input {
  width: 120px;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
}

.add-model-input:focus {
  border-color: var(--accent);
}

.add-model-btn {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  background: var(--accent);
  color: white;
  line-height: 1;
}

.add-model-btn:hover {
  background: var(--accent-hover);
}

.add-provider-form {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
}

.add-btn {
  padding: 8px 20px;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
  transition: background 0.2s;
}

.add-btn:hover {
  background: var(--accent-hover);
}
</style>
