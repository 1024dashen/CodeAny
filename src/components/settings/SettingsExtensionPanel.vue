<template>
  <div class="settings-panel">
    <h3 class="panel-title">拓展配置</h3>
    <p class="panel-desc">配置第三方服务商 Token，供后续部署、托管、DNS 等操作调用对应 API。</p>

    <section
      v-for="provider in SERVICE_PROVIDERS"
      :key="provider.id"
      class="provider-card"
    >
      <div class="provider-header">
        <div class="provider-title">
          <span class="provider-name">{{ provider.name }}</span>
          <span
            class="provider-status"
            :class="{ configured: hasToken(provider.id) }"
          >
            {{ hasToken(provider.id) ? '已配置' : '未配置' }}
          </span>
        </div>
        <a
          class="docs-link"
          :href="provider.docsUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          获取 Token →
        </a>
      </div>

      <p class="provider-desc">{{ provider.description }}</p>

      <div class="token-row">
        <div class="token-input">
          <input
            :type="showKeys[provider.id] ? 'text' : 'password'"
            :value="settingsStore.settings.serviceTokens[provider.id]"
            :placeholder="provider.placeholder"
            @change="settingsStore.setServiceToken(provider.id, ($event.target as HTMLInputElement).value)"
          />
          <button class="toggle-key" @click="toggleKey(provider.id)">
            {{ showKeys[provider.id] ? '隐藏' : '显示' }}
          </button>
        </div>
        <button
          v-if="hasToken(provider.id)"
          class="clear-btn"
          @click="clearToken(provider.id, provider.name)"
        >
          清除
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { SERVICE_PROVIDERS } from '@/utils/serviceProviders';
import type { ServiceProviderId } from '@/types';

const settingsStore = useSettingsStore();
const showKeys = ref<Record<string, boolean>>({});

function hasToken(providerId: ServiceProviderId): boolean {
  return settingsStore.settings.serviceTokens[providerId].trim().length > 0;
}

function toggleKey(providerId: ServiceProviderId) {
  showKeys.value[providerId] = !showKeys.value[providerId];
}

function clearToken(providerId: ServiceProviderId, providerName: string) {
  if (confirm(`确定要清除 ${providerName} Token 吗？`)) {
    settingsStore.clearServiceToken(providerId);
  }
}
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
}

.panel-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: -8px;
  margin-bottom: 8px;
}

.provider-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px 24px;
}

.provider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.provider-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.provider-name {
  font-size: 15px;
  font-weight: 600;
}

.provider-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-hover);
  color: var(--text-muted);
}

.provider-status.configured {
  background: rgba(74, 255, 138, 0.1);
  color: var(--success);
}

.docs-link {
  font-size: 13px;
  color: var(--accent);
  white-space: nowrap;
  transition: opacity 0.15s;
}

.docs-link:hover {
  opacity: 0.8;
}

.provider-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 14px;
}

.token-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.token-input {
  display: flex;
  flex: 1;
  gap: 8px;
}

.token-input input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  outline: none;
  font-family: monospace;
}

.token-input input:focus {
  border-color: var(--accent);
}

.toggle-key {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-hover);
  white-space: nowrap;
  transition: all 0.15s;
}

.toggle-key:hover {
  color: var(--accent);
}

.clear-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-muted);
  background: var(--bg-hover);
  white-space: nowrap;
  transition: all 0.15s;
}

.clear-btn:hover {
  color: var(--danger);
  background: rgba(255, 74, 106, 0.1);
}
</style>
