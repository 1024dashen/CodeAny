<template>
  <div class="model-selector">
    <select
      class="provider-select"
      :value="settingsStore.settings.activeProviderId"
      @change="settingsStore.setActiveProvider(($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="provider in settingsStore.allProviders"
        :key="provider.id"
        :value="provider.id"
      >
        {{ provider.name }}
      </option>
    </select>
    <select
      class="model-select"
      :value="settingsStore.settings.activeModelId"
      @change="settingsStore.setActiveModel(($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="model in currentModels"
        :key="model.id"
        :value="model.id"
      >
        {{ model.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore();

const currentModels = computed(() => {
  const provider = settingsStore.activeProvider;
  return provider?.models || [];
});
</script>

<style scoped>
.model-selector {
  display: flex;
  gap: 8px;
  align-items: center;
}

.provider-select,
.model-select {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  cursor: pointer;
  outline: none;
}

.provider-select:focus,
.model-select:focus {
  border-color: var(--accent);
}

.provider-select {
  min-width: 120px;
}

.model-select {
  min-width: 160px;
}
</style>