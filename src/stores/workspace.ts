import { defineStore } from 'pinia';
import { ref } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { loadWorkspaceRoot, saveWorkspaceRoot, isTauriEnv } from '@/utils/store';

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaceRoot = ref('');
  const isReady = ref(false);
  const error = ref('');

  async function hydrate() {
    workspaceRoot.value = await loadWorkspaceRoot();
    isReady.value = true;
  }

  async function pickWorkspaceRoot(): Promise<string | null> {
    if (!isTauriEnv()) {
      error.value = '请在 Tauri 桌面应用中运行以选择工作区目录';
      return null;
    }

    const selected = await open({
      directory: true,
      multiple: false,
      title: '选择工作区根目录',
    });

    if (!selected) return null;

    const path = Array.isArray(selected) ? selected[0] : selected;
    if (!path) return null;
    workspaceRoot.value = path;
    await saveWorkspaceRoot(path);
    error.value = '';
    return path;
  }

  async function ensureWorkspaceRoot(): Promise<string | null> {
    if (!workspaceRoot.value) {
      await hydrate();
    }
    if (workspaceRoot.value) return workspaceRoot.value;
    return pickWorkspaceRoot();
  }

  async function initSessionProjectDir(sessionId: string): Promise<string | null> {
    const root = await ensureWorkspaceRoot();
    if (!root) return null;

    if (!isTauriEnv()) {
      return `${root}/${sessionId}`;
    }

    try {
      const projectDir = await invoke<string>('init_project_dir', {
        workspaceRoot: root,
        sessionId,
      });
      return projectDir;
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      return null;
    }
  }

  return {
    workspaceRoot,
    isReady,
    error,
    hydrate,
    pickWorkspaceRoot,
    ensureWorkspaceRoot,
    initSessionProjectDir,
  };
});
