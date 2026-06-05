<template>
  <div v-if="show" class="workspace-setup">
    <div class="setup-content">
      <div class="setup-icon">📂</div>
      <h3>选择工作区根目录</h3>
      <p>每个对话的应用文件将保存在该目录下的独立子文件夹中</p>
      <button class="setup-btn" @click="handlePick">选择文件夹</button>
      <p v-if="workspaceStore.error" class="setup-error">{{ workspaceStore.error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';

const workspaceStore = useWorkspaceStore();

const show = computed(
  () => workspaceStore.isReady && !workspaceStore.workspaceRoot,
);

async function handlePick() {
  await workspaceStore.pickWorkspaceRoot();
}
</script>

<style scoped>
.workspace-setup {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.setup-content {
  width: min(420px, 90vw);
  padding: 32px 28px;
  border-radius: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  text-align: center;
}

.setup-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.setup-content h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.setup-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.setup-btn {
  padding: 10px 24px;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.setup-btn:hover {
  background: var(--accent-hover);
}

.setup-error {
  margin-top: 12px;
  font-size: 13px;
  color: var(--danger);
}
</style>
