<template>
  <div class="tree-item">
    <div
      class="tree-row"
      :style="{ paddingLeft: `${depth * 14 + 6}px` }"
      :class="{ 'selected': !node.isDir && workspaceStore.activeTabPath === node.path }"
      @click="handleClick"
    >
      <span v-if="node.isDir" class="tree-chevron" :class="{ expanded }">▶</span>
      <span v-else class="tree-chevron-placeholder"></span>
      <span class="tree-icon">{{ node.isDir ? (expanded ? '📂' : '📁') : fileIcon }}</span>
      <span class="tree-name" :title="node.path">{{ node.name }}</span>
    </div>
    <template v-if="node.isDir && expanded && node.children">
      <FileTreeItem
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import type { FileTreeNode } from '@/stores/workspace';

const props = defineProps<{
  node: FileTreeNode;
  depth: number;
}>();

const workspaceStore = useWorkspaceStore();
const expanded = ref(false);

function handleClick() {
  if (props.node.isDir) {
    expanded.value = !expanded.value;
  } else {
    workspaceStore.selectFile(props.node.path);
  }
}

const fileIcon = computed(() => {
  const name = props.node.name.toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop()! : '';
  const iconMap: Record<string, string> = {
    html: '🌐', htm: '🌐',
    css: '🎨', scss: '🎨', less: '🎨',
    js: '📜', ts: '📜', jsx: '⚛', tsx: '⚛',
    json: '📋',
    md: '📝',
    py: '🐍',
    rs: '🦀',
    go: '🔷',
    java: '☕',
    vue: '💚',
    svg: '🖼', png: '🖼', jpg: '🖼', jpeg: '🖼', gif: '🖼', ico: '🖼', webp: '🖼',
    txt: '📄',
    yaml: '⚙', yml: '⚙', toml: '⚙',
    sh: '🔧', bash: '🔧',
    sql: '🗃',
    lock: '🔒',
  };
  if (name === 'dockerfile') return '🐳';
  if (name === 'makefile') return '🔧';
  if (name === '.gitignore') return '🙈';
  if (name === '.env') return '🔐';
  if (name.startsWith('.env.')) return '🔐';
  return iconMap[ext] || '📄';
});
</script>

<style scoped>
.tree-item {
  user-select: none;
}

.tree-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s;
  min-height: 24px;
}

.tree-row:hover {
  background: var(--bg-hover);
}

.tree-row.selected {
  background: var(--bg-active);
  color: var(--accent);
}

.tree-row.selected .tree-name {
  color: var(--accent);
}

.tree-chevron {
  font-size: 8px;
  color: var(--text-muted);
  width: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.15s;
}

.tree-chevron.expanded {
  transform: rotate(90deg);
}

.tree-chevron-placeholder {
  width: 14px;
  flex-shrink: 0;
}

.tree-icon {
  font-size: 13px;
  flex-shrink: 0;
  width: 18px;
  text-align: center;
}

.tree-name {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
</style>
