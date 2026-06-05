<template>
  <div class="settings-page">
    <div class="settings-header">
      <button class="back-btn" @click="$router.push('/')">← 返回</button>
      <h2>设置</h2>
    </div>

    <div class="settings-body">
      <!-- Theme -->
      <section class="settings-section">
        <h3>外观</h3>
        <div class="setting-row">
          <label>主题</label>
          <select :value="settingsStore.settings.theme" @change="settingsStore.setTheme(($event.target as HTMLSelectElement).value as 'light' | 'dark')">
            <option value="dark">深色</option>
            <option value="light">浅色</option>
          </select>
        </div>
      </section>

      <!-- Workspace -->
      <section class="settings-section">
        <h3>工作区</h3>
        <div class="setting-row">
          <label>根目录</label>
          <input
            type="text"
            :value="workspaceStore.workspaceRoot"
            readonly
            placeholder="尚未选择工作区目录"
          />
        </div>
        <button class="add-btn" @click="workspaceStore.pickWorkspaceRoot()">更改目录</button>
        <p class="section-hint">每个对话的应用文件将保存在该目录下的独立子文件夹中</p>
      </section>

      <!-- Generation Prompt -->
      <section class="settings-section">
        <h3>HTML 生成提示词</h3>
        <textarea
          class="system-prompt-input"
          :value="settingsStore.settings.generationPrompt"
          @input="settingsStore.setGenerationPrompt(($event.target as HTMLTextAreaElement).value)"
          placeholder="设置 HTML 文件生成时的额外要求（可选）"
          rows="3"
        />
      </section>

      <!-- System Prompt -->
      <section class="settings-section">
        <h3>系统提示词</h3>
        <textarea
          class="system-prompt-input"
          :value="settingsStore.settings.systemPrompt"
          @input="settingsStore.setSystemPrompt(($event.target as HTMLTextAreaElement).value)"
          placeholder="设置全局系统提示词（可选）"
          rows="3"
        />
      </section>

      <!-- Providers -->
      <section class="settings-section">
        <h3>模型提供商</h3>
        <div
          v-for="provider in settingsStore.allProviders"
          :key="provider.id"
          class="provider-card"
        >
          <div class="provider-header">
            <span class="provider-name">{{ provider.name }}</span>
            <div class="provider-header-right">
              <span class="provider-id">{{ provider.id }}</span>
              <button class="provider-delete" @click="removeProvider(provider.id, provider.name)" title="删除提供商">删除</button>
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
                  placeholder="输入 API Key"
                />
                <button class="toggle-key" @click="toggleKey(provider.id)">
                  {{ showKeys[provider.id] ? '隐藏' : '显示' }}
                </button>
              </div>
            </div>
            <div class="provider-models">
              <span class="models-label">可用模型:</span>
              <div
                v-for="model in provider.models"
                :key="model.id"
                class="model-tag"
              >
                <span>{{ model.name }}</span>
                <button class="model-remove" @click="settingsStore.removeModel(provider.id, model.id)" title="移除模型">✕</button>
              </div>
              <div class="add-model-row">
                <input
                  v-model="newModelIds[provider.id]"
                  class="add-model-input"
                  placeholder="模型 ID"
                  @keydown.enter="addModel(provider.id)"
                />
                <button class="add-model-btn" @click="addModel(provider.id)">+</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Add Custom Provider -->
      <section class="settings-section">
        <h3>添加自定义提供商 (OpenAI 兼容)</h3>
        <div class="add-provider-form">
          <div class="setting-row">
            <label>名称</label>
            <input v-model="newProvider.name" placeholder="提供商名称" />
          </div>
          <div class="setting-row">
            <label>API Base</label>
            <input v-model="newProvider.apiBase" placeholder="https://api.example.com/v1" />
          </div>
          <div class="setting-row">
            <label>API Key</label>
            <input v-model="newProvider.apiKey" type="password" placeholder="API Key" />
          </div>
          <div class="setting-row">
            <label>模型 ID</label>
            <input v-model="newProvider.modelId" placeholder="model-id (逗号分隔多个)" />
          </div>
          <button class="add-btn" @click="addCustomProvider">添加提供商</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspaceStore } from '@/stores/workspace';

const settingsStore = useSettingsStore();
const workspaceStore = useWorkspaceStore();
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
  if (confirm(`确定要删除提供商「${providerName}」吗？删除后不可恢复。`)) {
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
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
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

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-section h3 {
  font-size: 16px;
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

.section-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-muted);
}
</style>