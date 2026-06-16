<template>
  <div class="model-selector">
    <!-- 提供商选择 -->
    <div class="selector-wrapper" @click.stop="toggleProviderMenu">
      <button class="selector-btn provider-btn" :class="{ active: showProviderMenu }">
        <span class="selector-text">{{ activeProviderName }}</span>
        <svg class="selector-arrow" :class="{ open: showProviderMenu }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <Transition name="dropdown">
        <div v-if="showProviderMenu" class="selector-dropdown provider-dropdown">
          <div
            v-for="provider in settingsStore.allProviders"
            :key="provider.id"
            class="dropdown-item"
            :class="{ selected: provider.id === settingsStore.settings.activeProviderId }"
            @click.stop="selectProvider(provider.id)"
          >
            <span class="item-check">{{ provider.id === settingsStore.settings.activeProviderId ? '✓' : '' }}</span>
            <span class="item-name">{{ provider.name }}</span>
            <span v-if="provider.apiKey" class="item-badge connected">{{ t('modelSelector.connected') }}</span>
            <span v-else class="item-badge">{{ t('modelSelector.notConfigured') }}</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 模型选择 -->
    <div class="selector-wrapper" @click.stop="toggleModelMenu">
      <button class="selector-btn model-btn" :class="{ active: showModelMenu }">
        <span class="selector-text">{{ activeModelName }}</span>
        <svg class="selector-arrow" :class="{ open: showModelMenu }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <Transition name="dropdown">
        <div v-if="showModelMenu" class="selector-dropdown model-dropdown">
          <div
            v-for="model in currentModels"
            :key="model.id"
            class="dropdown-item"
            :class="{ selected: model.id === settingsStore.settings.activeModelId }"
            @click.stop="selectModel(model.id)"
          >
            <span class="item-check">{{ model.id === settingsStore.settings.activeModelId ? '✓' : '' }}</span>
            <span class="item-name">{{ model.name }}</span>
          </div>
          <div v-if="currentModels.length === 0" class="dropdown-empty">
            {{ t('modelSelector.noModels') }}
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const showProviderMenu = ref(false);
const showModelMenu = ref(false);

const activeProviderName = computed(() => {
  return settingsStore.activeProvider?.name || t('modelSelector.selectProvider');
});

const activeModelName = computed(() => {
  return settingsStore.activeModel?.name || t('modelSelector.selectModel');
});

const currentModels = computed(() => {
  return settingsStore.activeProvider?.models || [];
});

function toggleProviderMenu() {
  showModelMenu.value = false;
  showProviderMenu.value = !showProviderMenu.value;
}

function toggleModelMenu() {
  showProviderMenu.value = false;
  showModelMenu.value = !showModelMenu.value;
}

function selectProvider(id: string) {
  settingsStore.setActiveProvider(id);
  showProviderMenu.value = false;
}

function selectModel(id: string) {
  settingsStore.setActiveModel(id);
  showModelMenu.value = false;
}

function closeMenus() {
  showProviderMenu.value = false;
  showModelMenu.value = false;
}

onMounted(() => {
  document.addEventListener('click', closeMenus);
});

onUnmounted(() => {
  document.removeEventListener('click', closeMenus);
});
</script>

<style scoped>
.model-selector {
  display: flex;
  gap: 6px;
  align-items: center;
}

.selector-wrapper {
  position: relative;
}

.selector-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.selector-btn:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
}

.selector-btn.active {
  border-color: var(--accent);
  background: var(--bg-hover);
}

.provider-btn {
  min-width: 110px;
}

.model-btn {
  min-width: 140px;
}

.selector-text {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selector-arrow {
  color: var(--text-muted);
  transition: transform 0.2s;
  flex-shrink: 0;
  display: inline-block;
}

.selector-arrow.open {
  transform: rotate(180deg);
}

.selector-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 4px;
  box-shadow: var(--shadow);
  z-index: 200;
  max-height: 320px;
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.dropdown-item.selected {
  background: var(--bg-active);
}

.item-check {
  width: 14px;
  font-size: 12px;
  color: var(--accent);
  flex-shrink: 0;
  text-align: center;
}

.item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--bg-hover);
  color: var(--text-muted);
  flex-shrink: 0;
}

.item-badge.connected {
  background: rgba(74, 255, 138, 0.12);
  color: var(--success);
}

.dropdown-empty {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>