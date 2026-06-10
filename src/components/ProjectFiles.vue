<template>
  <div class="project-files">
    <div class="files-header">
      <span class="files-icon">📁</span>
      <span class="files-title">{{ t('project.filesGenerated', { count: files.length }) }}</span>
    </div>
    <ul class="files-list">
      <li
        v-for="file in files"
        :key="file.path"
        class="file-item"
        :class="{ active: selectedPath === file.path }"
        @click="selectedPath = file.path"
      >
        {{ file.path }}
      </li>
    </ul>
    <pre v-if="selectedFile" class="file-preview">{{ selectedFile.content }}</pre>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ProjectFile } from '@/types';

const { t } = useI18n();

const props = defineProps<{
  files: ProjectFile[];
}>();

const selectedPath = ref(props.files[0]?.path ?? '');

const selectedFile = computed(() =>
  props.files.find(f => f.path === selectedPath.value),
);
</script>

<style scoped>
.project-files {
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-secondary);
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.files-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.files-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.files-list {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.file-item {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-family: monospace;
  background: var(--bg-hover);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.file-item:hover,
.file-item.active {
  background: var(--accent);
  color: white;
}

.file-preview {
  max-height: 200px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--code-bg);
  border: 1px solid var(--code-border);
  color: var(--code-text);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--code-scrollbar-thumb) 85%, transparent) transparent;
}
</style>
