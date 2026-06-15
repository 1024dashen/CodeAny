import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
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

export interface OpenFileTab {
  path: string;
  content: string;
  loading: boolean;
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaceRoot = ref('');
  const isReady = ref(false);
  const error = ref('');
  const fileTree = ref<FileTreeNode[]>([]);
  const fileTreeRoot = ref('');
  const fileTreeLoading = ref(false);
  const openTabs = ref<OpenFileTab[]>([]);
  const activeTabPath = ref('');

  // 向后兼容的计算属性
  const selectedFilePath = computed(() => activeTabPath.value);
  const selectedFileContent = computed(() => openTabs.value.find(t => t.path === activeTabPath.value)?.content ?? '');
  const selectedFileLoading = computed(() => openTabs.value.find(t => t.path === activeTabPath.value)?.loading ?? false);
  const hasOpenTabs = computed(() => openTabs.value.length > 0);

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
    openTabs.value = [];
    activeTabPath.value = '';
  }

  async function refreshFileTree(): Promise<void> {
    if (fileTreeRoot.value) {
      await loadFileTree(fileTreeRoot.value);
    }
  }

  async function selectFile(filePath: string): Promise<void> {
    if (!isTauri()) return;
    // 已打开则切换到该 tab
    const existing = openTabs.value.find(t => t.path === filePath);
    if (existing) {
      activeTabPath.value = filePath;
      return;
    }
    // 新增 tab
    const tab: OpenFileTab = { path: filePath, content: '', loading: true };
    openTabs.value.push(tab);
    activeTabPath.value = filePath;
    try {
      tab.content = await invoke<string>('read_file_content', { filePath });
    } catch (err) {
      tab.content = `// 无法读取文件: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      tab.loading = false;
    }
  }

  function switchTab(filePath: string) {
    if (openTabs.value.some(t => t.path === filePath)) {
      activeTabPath.value = filePath;
    }
  }

  function closeTab(filePath: string) {
    const idx = openTabs.value.findIndex(t => t.path === filePath);
    if (idx < 0) return;
    openTabs.value.splice(idx, 1);
    // 如果关闭的是当前活跃 tab，切换到相邻 tab
    if (activeTabPath.value === filePath) {
      const next = openTabs.value[Math.min(idx, openTabs.value.length - 1)];
      activeTabPath.value = next?.path ?? '';
    }
  }

  async function saveFile(filePath: string, content: string): Promise<void> {
    if (!isTauri()) return;
    await invoke('write_file_content', { filePath, content });
    const tab = openTabs.value.find(t => t.path === filePath);
    if (tab) {
      tab.content = content;
    }
  }

  function clearSelectedFile() {
    openTabs.value = [];
    activeTabPath.value = '';
  }

  return {
    workspaceRoot,
    isReady,
    error,
    fileTree,
    fileTreeRoot,
    fileTreeLoading,
    openTabs,
    activeTabPath,
    selectedFilePath,
    selectedFileContent,
    selectedFileLoading,
    hasOpenTabs,
    hydrate,
    pickWorkspaceRoot,
    ensureWorkspaceRoot,
    initSessionProjectDir,
    loadFileTree,
    clearFileTree,
    refreshFileTree,
    selectFile,
    switchTab,
    closeTab,
    clearSelectedFile,
    saveFile,
  };
});
