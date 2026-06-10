<template>
  <NaiveProvider>
    <router-view v-if="isReady" />
    <div v-else class="app-loading">{{ $t('common.loading') }}</div>
  </NaiveProvider>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspaceStore } from '@/stores/workspace';
import NaiveProvider from '@/components/NaiveProvider.vue';

const isReady = ref(false);

onMounted(async () => {
  const settingsStore = useSettingsStore();
  const chatStore = useChatStore();
  const workspaceStore = useWorkspaceStore();

  await Promise.all([
    settingsStore.hydrate(),
    chatStore.hydrate(),
    workspaceStore.hydrate(),
  ]);

  isReady.value = true;
});
</script>

<style scoped>
.app-loading {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}
</style>
