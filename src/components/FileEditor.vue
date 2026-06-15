<template>
  <div class="file-editor-wrap">
    <!-- 标签栏 -->
    <div class="file-editor-tabs">
      <div class="tabs-scroll">
        <div
          v-for="tab in workspaceStore.openTabs"
          :key="tab.path"
          class="file-tab"
          :class="{ active: tab.path === workspaceStore.activeTabPath }"
          @click="workspaceStore.switchTab(tab.path)"
        >
          <span class="file-tab-icon">{{ getFileIcon(tab.path) }}</span>
          <span class="file-tab-name" :class="{ modified: modifiedTabs.has(tab.path) }">{{ getFileName(tab.path) }}</span>
          <span v-if="modifiedTabs.has(tab.path)" class="modified-dot" title="未保存">●</span>
          <button class="file-tab-close" @click.stop="handleCloseTab(tab.path)" title="关闭">✕</button>
        </div>
      </div>
      <div class="tab-actions">
        <button
          v-if="currentTabModified"
          class="save-btn"
          @click="saveFile"
          :disabled="saving"
          title="保存 (Ctrl+S)"
        >
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <span v-if="saveMsg" class="save-msg" :class="saveMsgType">{{ saveMsg }}</span>
      </div>
    </div>

    <!-- 编辑器容器 -->
    <div class="file-editor-body">
      <div v-if="workspaceStore.selectedFileLoading" class="editor-loading">加载中...</div>
      <div v-else ref="editorContainer" class="editor-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { useSettingsStore } from '@/stores/settings';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput } from '@codemirror/language';
import { atomOneDark } from '@/utils/editorTheme';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { rust } from '@codemirror/lang-rust';
import { python } from '@codemirror/lang-python';
import { vue } from '@codemirror/lang-vue';

const workspaceStore = useWorkspaceStore();
const settingsStore = useSettingsStore();

const editorContainer = ref<HTMLDivElement | null>(null);
const saving = ref(false);
const saveMsg = ref('');
const saveMsgType = ref<'success' | 'error'>('success');

// 每个 tab 的修改状态
const modifiedTabs = ref(new Set<string>());

let editorView: EditorView | null = null;
let saveMsgTimer: ReturnType<typeof setTimeout> | null = null;

// 缓存每个 tab 的编辑器内容（未保存的修改）
const tabContentCache = new Map<string, string>();

function getFileName(filePath: string): string {
  const p = filePath.replace(/\\/g, '/');
  return p.split('/').pop() ?? p;
}

function getFileIcon(filePath: string): string {
  const name = getFileName(filePath).toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop()! : '';
  const iconMap: Record<string, string> = {
    html: '🌐', htm: '🌐',
    css: '🎨', scss: '🎨', less: '🎨',
    js: '📜', ts: '📜', jsx: '⚛', tsx: '⚛',
    json: '📋', md: '📝', py: '🐍', rs: '🦀',
    go: '🔷', java: '☕', vue: '💚',
    svg: '🖼', png: '🖼', jpg: '🖼', jpeg: '🖼',
    txt: '📄', yaml: '⚙', yml: '⚙', toml: '⚙',
    sh: '🔧', sql: '🗃', lock: '🔒',
  };
  if (name === 'dockerfile') return '🐳';
  if (name === '.gitignore') return '🙈';
  return iconMap[ext] || '📄';
}

function getFileExt(): string {
  const name = getFileName(workspaceStore.activeTabPath).toLowerCase();
  return name.includes('.') ? name.split('.').pop()! : '';
}

function getLanguageExtension() {
  const ext = getFileExt();
  switch (ext) {
    case 'js': case 'jsx': return javascript({ jsx: true });
    case 'ts': case 'tsx': return javascript({ typescript: true, jsx: ext === 'tsx' });
    case 'css': case 'scss': case 'less': return css();
    case 'html': case 'htm': return html();
    case 'json': return json();
    case 'md': case 'markdown': return markdown();
    case 'rs': return rust();
    case 'py': return python();
    case 'vue': return vue();
    default: return [];
  }
}

function isDarkTheme() {
  return settingsStore.settings.theme === 'dark';
}

function buildExtensions() {
  const langExt = getLanguageExtension();
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    history(),
    drawSelection(),
    indentOnInput(),
    bracketMatching(),
    foldGutter(),
    ...(isDarkTheme() ? atomOneDark : [syntaxHighlighting(defaultHighlightStyle)]),
    ...(Array.isArray(langExt) ? langExt : [langExt]),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      indentWithTab,
      { key: 'Ctrl-s', run: () => { saveFile(); return true; } },
      { key: 'Mod-s', run: () => { saveFile(); return true; } },
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        modifiedTabs.value.add(workspaceStore.activeTabPath);
        // 触发响应式更新
        modifiedTabs.value = new Set(modifiedTabs.value);
      }
    }),
    EditorView.theme({
      '&': { height: '100%', fontSize: '13px' },
      '.cm-scroller': { overflow: 'auto', fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace" },
      '.cm-content': { padding: '8px 0' },
    }),
  ];
}

function initEditor(content: string) {
  if (!editorContainer.value) return;

  if (editorView) {
    editorView.destroy();
    editorView = null;
  }

  const state = EditorState.create({
    doc: content,
    extensions: buildExtensions(),
  });

  editorView = new EditorView({
    state,
    parent: editorContainer.value,
  });
}

async function saveFile() {
  if (!editorView || saving.value) return;
  const filePath = workspaceStore.activeTabPath;
  const content = editorView.state.doc.toString();
  saving.value = true;
  if (saveMsgTimer) clearTimeout(saveMsgTimer);
  try {
    await workspaceStore.saveFile(filePath, content);
    modifiedTabs.value.delete(filePath);
    modifiedTabs.value = new Set(modifiedTabs.value);
    tabContentCache.delete(filePath);
    saveMsg.value = '✓ 已保存';
    saveMsgType.value = 'success';
  } catch (err) {
    saveMsg.value = `✗ 保存失败`;
    saveMsgType.value = 'error';
  } finally {
    saving.value = false;
    saveMsgTimer = setTimeout(() => { saveMsg.value = ''; }, 2500);
  }
}

function handleCloseTab(filePath: string) {
  // 保存当前编辑器内容到缓存
  if (editorView && filePath === workspaceStore.activeTabPath) {
    tabContentCache.set(filePath, editorView.state.doc.toString());
  }
  workspaceStore.closeTab(filePath);
}

// 当前 tab 是否有未保存修改
const currentTabModified = computed(() => modifiedTabs.value.has(workspaceStore.activeTabPath));

// 当活跃 tab 变化时，保存旧 tab 内容并加载新 tab 内容
watch(
  () => workspaceStore.activeTabPath,
  async (newPath, oldPath) => {
    // 保存旧 tab 的编辑器内容
    if (oldPath && editorView) {
      tabContentCache.set(oldPath, editorView.state.doc.toString());
    }
    // 加载新 tab 内容
    if (newPath) {
      await nextTick();
      const tab = workspaceStore.openTabs.find(t => t.path === newPath);
      if (tab && !tab.loading) {
        const content = tabContentCache.has(newPath) ? tabContentCache.get(newPath)! : tab.content;
        initEditor(content);
      }
    }
  },
);

// 当新 tab 内容加载完成时，初始化编辑器
watch(
  () => workspaceStore.selectedFileLoading,
  async (loading) => {
    if (loading || !workspaceStore.activeTabPath) return;
    // 仅在编辑器未初始化时（新打开的 tab 内容刚加载完）
    const tab = workspaceStore.openTabs.find(t => t.path === workspaceStore.activeTabPath);
    if (tab) {
      await nextTick();
      const content = tabContentCache.has(tab.path) ? tabContentCache.get(tab.path)! : tab.content;
      initEditor(content);
    }
  },
);

// 监听主题切换，重建编辑器
watch(
  () => settingsStore.settings.theme,
  async () => {
    if (workspaceStore.selectedFileLoading || !editorView) return;
    const currentContent = editorView.state.doc.toString();
    await nextTick();
    initEditor(currentContent);
  },
);

onMounted(async () => {
  const tab = workspaceStore.openTabs.find(t => t.path === workspaceStore.activeTabPath);
  if (tab && !tab.loading) {
    await nextTick();
    initEditor(tab.content);
  }
});

onBeforeUnmount(() => {
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
  if (saveMsgTimer) clearTimeout(saveMsgTimer);
});

// 暴露 saveFile 供外部调用
defineExpose({ saveFile });
</script>

<style scoped>
.file-editor-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* 标签栏 */
.file-editor-tabs {
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  min-height: 36px;
  flex-shrink: 0;
  gap: 0;
}

.tabs-scroll {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.tabs-scroll::-webkit-scrollbar {
  display: none;
}

.file-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.file-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.file-tab.active {
  color: var(--text-primary);
  border-bottom-color: var(--accent);
  background: var(--bg-primary);
}

.file-tab-icon {
  font-size: 13px;
}

.file-tab-name {
  font-family: monospace;
  font-size: 13px;
}

.file-tab-name.modified {
  font-style: italic;
}

.modified-dot {
  color: #e5a50a;
  font-size: 12px;
  line-height: 1;
}

.file-tab-close {
  margin-left: 2px;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0.5;
  transition: all 0.15s;
}

.file-tab-close:hover {
  opacity: 1;
  background: var(--bg-hover);
  color: var(--danger);
}

.tab-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding: 0 8px;
  flex-shrink: 0;
}

.save-btn {
  padding: 3px 12px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 500;
  background: var(--accent);
  color: white;
  transition: all 0.15s;
}

.save-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-msg {
  font-size: 12px;
  font-weight: 500;
}

.save-msg.success {
  color: #4caf50;
}

.save-msg.error {
  color: var(--danger);
}

/* 编辑器主体 */
.file-editor-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-loading {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.editor-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* CodeMirror 全局覆盖 */
.editor-container :deep(.cm-editor) {
  height: 100%;
}

.editor-container :deep(.cm-editor.cm-focused) {
  outline: none;
}

.editor-container :deep(.cm-scroller) {
  height: 100%;
}
</style>
