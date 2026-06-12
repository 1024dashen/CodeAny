<template>
  <div class="preview-selector">
    <span class="preview-label">{{ t('preview.label') }}</span>
    <div class="preview-modes">
      <button
        v-for="mode in previewModes"
        :key="mode.id"
        class="preview-mode-btn"
        :class="{ active: activeMode === mode.id }"
        :disabled="loading"
        :title="mode.label"
        @click="handlePreview(mode.id)"
      >
        <svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path v-if="mode.id === 'phone'" d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M11 18h2" />
          <path v-else-if="mode.id === 'ipad'" d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M11 17h2" />
          <template v-else-if="mode.id === 'desktop'">
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8 M12 16v4" />
          </template>
          <template v-else>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18" />
          </template>
        </svg>
        <!-- <span class="mode-text">{{ mode.shortLabel }}</span> -->
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useChatStore } from '@/stores/chat';
import { openProjectPreview, type PreviewMode } from '@/utils/preview';

const { t } = useI18n();
const chatStore = useChatStore();
const loading = ref(false);
const activeMode = ref<PreviewMode | null>(null);

const previewModes = computed(() => [
  { id: 'phone' as PreviewMode, label: t('preview.phoneTitle'), shortLabel: t('preview.phone') },
  { id: 'ipad' as PreviewMode, label: t('preview.ipadTitle'), shortLabel: t('preview.ipad') },
  { id: 'desktop' as PreviewMode, label: t('preview.desktopTitle'), shortLabel: t('preview.desktop') },
  { id: 'browser' as PreviewMode, label: t('preview.browserTitle'), shortLabel: t('preview.browser') },
]);

async function handlePreview(mode: PreviewMode) {
  const session = chatStore.activeSession;
  if (!session?.projectDir || loading.value) return;

  loading.value = true;
  try {
    await openProjectPreview(mode, session.id, session.title, session.projectDir);
    activeMode.value = mode;
  } catch (err) {
    const message = err instanceof Error ? err.message : t('preview.failed');
    alert(message);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.preview-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: 8px;
  background: var(--bg-hover);
}

.preview-label {
  font-size: 12px;
  color: var(--text-secondary);
  padding-left: 6px;
  white-space: nowrap;
}

.preview-modes {
  display: flex;
  align-items: center;
  gap: 2px;
}

.preview-mode-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.preview-mode-btn:hover:not(:disabled),
.preview-mode-btn.active {
  background: var(--accent);
  color: white;
  opacity: 1;
}

.preview-mode-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mode-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.mode-text {
  white-space: nowrap;
}
</style>
