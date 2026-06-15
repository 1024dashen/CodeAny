import { defineStore } from 'pinia';
import { ref } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { loadWorkspaceRoot, saveWorkspaceRoot } from '@/utils/store';
import { t } from '@/i18n';

export interface FileTreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileTreeNode[];
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaceRoot = ref('');
  const isReady = ref(false);
  const error = ref('');
  const fileTree = ref<FileTreeNode[]>([]);
  const fileTreeRoot = ref('');
  const fileTreeLoading = ref(false);

  async function hydrate() {
    workspaceRoot.value = await loadWorkspaceRoot();
    isReady.value = true;
  }

  async function pickWorkspaceRoot(): Promise<string | null> {
    if (!isTauri()) {
      error.value = t('workspace.tauriOnly');
      return null;
    }

    const selected = await open({
      directory: true,
      multiple: false,
      title: t('workspace.dialogTitle'),
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

    if (!isTauri()) {
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

  async function loadFileTree(dirPath: string): Promise<void> {
    if (!isTauri()) return;
    fileTreeLoading.value = true;
    fileTreeRoot.value = dirPath;
    try {
      fileTree.value = await invoke<FileTreeNode[]>('read_dir_tree', { dirPath });
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      fileTree.value = [];
    } finally {
      fileTreeLoading.value = false;
    }
  }

  function clearFileTree() {
    fileTree.value = [];
    fileTreeRoot.value = '';
  }

  async function refreshFileTree(): Promise<void> {
    if (fileTreeRoot.value) {
      await loadFileTree(fileTreeRoot.value);
    }
  }

  return {
    workspaceRoot,
    isReady,
    error,
    fileTree,
    fileTreeRoot,
    fileTreeLoading,
    hydrate,
    pickWorkspaceRoot,
    ensureWorkspaceRoot,
    initSessionProjectDir,
    loadFileTree,
    clearFileTree,
    refreshFileTree,
  };
});
