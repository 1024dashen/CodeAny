<template>
  <div class="settings-panel">
    <h3 class="panel-title">{{ t('extension.title') }}</h3>
    <p class="panel-desc">{{ t('extension.desc') }}</p>

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
            {{ hasToken(provider.id) ? t('common.configured') : t('common.notConfigured') }}
          </span>
        </div>
        <a
          class="docs-link"
          :href="provider.docsUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('common.getToken') }}
        </a>
      </div>

      <p class="provider-desc">{{ t(`extension.providers.${provider.id}.desc`) }}</p>

      <div class="token-row">
        <div class="token-input">
          <input
            :type="showKeys[provider.id] ? 'text' : 'password'"
            :value="settingsStore.settings.serviceTokens[provider.id]"
            :placeholder="provider.placeholder"
            @change="settingsStore.setServiceToken(provider.id, ($event.target as HTMLInputElement).value)"
          />
          <button class="toggle-key" @click="toggleKey(provider.id)">
            {{ showKeys[provider.id] ? t('common.hide') : t('common.show') }}
          </button>
        </div>
        <button
          v-if="hasToken(provider.id)"
          class="clear-btn"
          @click="clearToken(provider.id, provider.name)"
        >
          {{ t('common.clear') }}
        </button>
      </div>
    </section>

    <!-- SSH 服务器配置 -->
    <section class="ssh-section">
      <div class="ssh-header">
        <h4 class="ssh-title">{{ t('extension.ssh.title') }}</h4>
        <button class="add-ssh-btn" @click="addSshServer">
          + {{ t('extension.ssh.add') }}
        </button>
      </div>
      <p class="ssh-desc">{{ t('extension.ssh.desc') }}</p>

      <div v-if="sshServers.length === 0" class="ssh-empty">
        {{ t('extension.ssh.empty') }}
      </div>

      <div
        v-for="(server, index) in sshServers"
        :key="index"
        class="ssh-card"
      >
        <div class="ssh-card-header">
          <span class="ssh-card-name">{{ server.name || server.host || t('extension.ssh.untitled') }}</span>
          <div class="ssh-card-actions">
            <span
              class="provider-status"
              :class="{ configured: isSshConfigured(server) }"
            >
              {{ isSshConfigured(server) ? t('common.configured') : t('common.notConfigured') }}
            </span>
            <button class="ssh-delete-btn" @click="removeSshServer(index)">
              {{ t('common.delete') }}
            </button>
          </div>
        </div>

        <div class="ssh-form">
          <div class="ssh-form-row">
            <div class="ssh-form-field">
              <label>{{ t('extension.ssh.name') }}</label>
              <input
                type="text"
                :value="server.name"
                :placeholder="t('extension.ssh.namePlaceholder')"
                @change="updateSshField(index, 'name', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div class="ssh-form-row">
            <div class="ssh-form-field ssh-form-host">
              <label>{{ t('extension.ssh.host') }}</label>
              <input
                type="text"
                :value="server.host"
                :placeholder="t('extension.ssh.hostPlaceholder')"
                @change="updateSshField(index, 'host', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="ssh-form-field ssh-form-port">
              <label>{{ t('extension.ssh.port') }}</label>
              <input
                type="number"
                :value="server.port"
                min="1"
                max="65535"
                @change="updateSshField(index, 'port', Number(($event.target as HTMLInputElement).value) || 22)"
              />
            </div>
          </div>
          <div class="ssh-form-row">
            <div class="ssh-form-field">
              <label>{{ t('extension.ssh.username') }}</label>
              <input
                type="text"
                :value="server.username"
                :placeholder="t('extension.ssh.usernamePlaceholder')"
                @change="updateSshField(index, 'username', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div class="ssh-form-row">
            <div class="ssh-form-field">
              <label>{{ t('extension.ssh.authType') }}</label>
              <div class="auth-type-switch">
                <button
                  class="auth-type-btn"
                  :class="{ active: server.authType === 'password' }"
                  @click="updateSshField(index, 'authType', 'password')"
                >
                  {{ t('extension.ssh.passwordAuth') }}
                </button>
                <button
                  class="auth-type-btn"
                  :class="{ active: server.authType === 'key' }"
                  @click="updateSshField(index, 'authType', 'key')"
                >
                  {{ t('extension.ssh.keyAuth') }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="server.authType === 'password'" class="ssh-form-row">
            <div class="ssh-form-field">
              <label>{{ t('extension.ssh.password') }}</label>
              <div class="token-input">
                <input
                  :type="showSshPassword[index] ? 'text' : 'password'"
                  :value="server.password"
                  :placeholder="t('extension.ssh.passwordPlaceholder')"
                  @change="updateSshField(index, 'password', ($event.target as HTMLInputElement).value)"
                />
                <button class="toggle-key" @click="toggleSshPassword(index)">
                  {{ showSshPassword[index] ? t('common.hide') : t('common.show') }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="server.authType === 'key'" class="ssh-form-row">
            <div class="ssh-form-field">
              <label>{{ t('extension.ssh.privateKey') }}</label>
              <textarea
                :value="server.privateKey"
                :placeholder="t('extension.ssh.privateKeyPlaceholder')"
                rows="4"
                @change="updateSshField(index, 'privateKey', ($event.target as HTMLTextAreaElement).value)"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';
import { SERVICE_PROVIDERS } from '@/utils/serviceProviders';
import type { ServiceProviderId, SshConfig } from '@/types';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const showKeys = ref<Record<string, boolean>>({});
const showSshPassword = ref<Record<number, boolean>>({});

const sshServers = computed(() => settingsStore.settings.sshServers);

function hasToken(providerId: ServiceProviderId): boolean {
  return settingsStore.settings.serviceTokens[providerId].trim().length > 0;
}

function toggleKey(providerId: ServiceProviderId) {
  showKeys.value[providerId] = !showKeys.value[providerId];
}

function clearToken(providerId: ServiceProviderId, providerName: string) {
  if (confirm(t('extension.clearConfirm', { name: providerName }))) {
    settingsStore.clearServiceToken(providerId);
  }
}

function isSshConfigured(server: SshConfig): boolean {
  if (!server.host.trim()) return false;
  if (!server.username.trim()) return false;
  if (server.authType === 'password') return server.password.trim().length > 0;
  if (server.authType === 'key') return server.privateKey.trim().length > 0;
  return false;
}

function addSshServer() {
  settingsStore.addSshServer({
    name: '',
    host: '',
    port: 22,
    username: '',
    authType: 'password',
    password: '',
    privateKey: '',
  });
}

function updateSshField(index: number, field: keyof SshConfig, value: string | number) {
  settingsStore.updateSshServer(index, { [field]: value });
}

function removeSshServer(index: number) {
  if (confirm(t('extension.ssh.deleteConfirm', { name: sshServers.value[index]?.name || sshServers.value[index]?.host || '' }))) {
    settingsStore.removeSshServer(index);
  }
}

function toggleSshPassword(index: number) {
  showSshPassword.value[index] = !showSshPassword.value[index];
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

/* SSH Section */
.ssh-section {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ssh-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ssh-title {
  font-size: 16px;
  font-weight: 600;
}

.ssh-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: -4px;
}

.ssh-empty {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  padding: 24px;
  background: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: 12px;
}

.add-ssh-btn {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--accent);
  background: var(--bg-hover);
  transition: all 0.15s;
}

.add-ssh-btn:hover {
  background: rgba(99, 102, 241, 0.15);
}

.ssh-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px 24px;
}

.ssh-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.ssh-card-name {
  font-size: 15px;
  font-weight: 600;
}

.ssh-card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ssh-delete-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-hover);
  transition: all 0.15s;
}

.ssh-delete-btn:hover {
  color: var(--danger);
  background: rgba(255, 74, 106, 0.1);
}

.ssh-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ssh-form-row {
  display: flex;
  gap: 12px;
}

.ssh-form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.ssh-form-field.ssh-form-host {
  flex: 3;
}

.ssh-form-field.ssh-form-port {
  flex: 1;
}

.ssh-form-field label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.ssh-form-field input,
.ssh-form-field textarea {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  outline: none;
  font-family: inherit;
}

.ssh-form-field input:focus,
.ssh-form-field textarea:focus {
  border-color: var(--accent);
}

.ssh-form-field textarea {
  resize: vertical;
  min-height: 80px;
  font-family: monospace;
  font-size: 13px;
}

.ssh-form-field input[type="number"] {
  -moz-appearance: textfield;
}

.ssh-form-field input[type="number"]::-webkit-inner-spin-button,
.ssh-form-field input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.auth-type-switch {
  display: flex;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.auth-type-btn {
  padding: 8px 16px;
  font-size: 13px;
  background: var(--bg-input);
  color: var(--text-secondary);
  transition: all 0.15s;
}

.auth-type-btn.active {
  background: var(--accent);
  color: #fff;
}

.auth-type-btn:not(.active):hover {
  background: var(--bg-hover);
}
</style>
