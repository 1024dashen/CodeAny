<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="t('publish.title')"
    class="publish-dialog"
    :style="{ width: '520px', maxWidth: '92vw', height: '380px' }"
    :mask-closable="false"
    @after-leave="resetForm"
  >
    <div class="publish-form">
      <div class="form-row">
        <label>{{ t('publish.method') }}</label>
        <NSelect
          v-model:value="form.method"
          :options="methodOptions"
          :placeholder="t('publish.method')"
        />
      </div>

      <div v-if="showPlatforms" class="form-row">
        <label>{{ t('publish.platform') }}</label>
        <NTreeSelect
          v-model:value="form.platforms"
          multiple
          cascade
          checkable
          check-strategy="child"
          :options="platformOptions"
          :placeholder="t('publish.platformPlaceholder')"
          max-tag-count="responsive"
        />
      </div>

      <div class="form-row">
        <label>{{ t('publish.debugMode') }}</label>
        <NSelect
          v-model:value="form.debugMode"
          :options="debugOptions"
        />
      </div>

      <div class="form-row form-row-top">
        <label>{{ t('publish.notes') }}</label>
        <NInput
          v-model:value="form.notes"
          type="textarea"
          :placeholder="t('publish.notesPlaceholder')"
          :autosize="{ minRows: 3, maxRows: 6 }"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <NButton @click="visible = false">{{ t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleConfirm">{{ t('common.confirm') }}</NButton>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  NModal,
  NSelect,
  NTreeSelect,
  NInput,
  NButton,
  type SelectOption,
  type TreeSelectOption,
} from 'naive-ui';

export type PublishMethod =
  | 'web'
  | 'desktop'
  | 'electron'
  | 'android'
  | 'ios'
  | 'ios-unsigned';

export type PublishDebugMode = 'off' | 'on';

export interface PublishFormData {
  method: PublishMethod | null;
  platforms: string[];
  debugMode: PublishDebugMode;
  notes: string;
}

const visible = defineModel<boolean>('show', { default: false });

const emit = defineEmits<{
  confirm: [data: PublishFormData];
}>();

const { t } = useI18n();

const defaultForm = (): PublishFormData => ({
  method: 'desktop',
  platforms: ['windows-x64'],
  debugMode: 'off',
  notes: '',
});

const form = reactive<PublishFormData>(defaultForm());

const methodOptions = computed<SelectOption[]>(() => [
  { label: t('publish.methods.web'), value: 'web' },
  { label: t('publish.methods.desktop'), value: 'desktop' },
  { label: t('publish.methods.electron'), value: 'electron' },
  { label: t('publish.methods.android'), value: 'android' },
  { label: t('publish.methods.ios'), value: 'ios' },
  { label: t('publish.methods.iosUnsigned'), value: 'ios-unsigned' },
]);

const debugOptions = computed<SelectOption[]>(() => [
  { label: t('publish.debugOff'), value: 'off' },
  { label: t('publish.debugOn'), value: 'on' },
]);

const platformOptions = computed<TreeSelectOption[]>(() => [
  {
    label: t('publish.platforms.windows'),
    key: 'windows',
    children: [
      { label: t('publish.platforms.x64'), key: 'windows-x64' },
      { label: t('publish.platforms.arm64'), key: 'windows-arm64' },
    ],
  },
  {
    label: t('publish.platforms.macos'),
    key: 'macos',
    children: [
      { label: t('publish.platforms.x64'), key: 'macos-x64' },
      { label: t('publish.platforms.arm64'), key: 'macos-arm64' },
    ],
  },
  {
    label: t('publish.platforms.linux'),
    key: 'linux',
    children: [
      { label: t('publish.platforms.x64'), key: 'linux-x64' },
      { label: t('publish.platforms.arm64'), key: 'linux-arm64' },
    ],
  },
]);

const showPlatforms = computed(
  () => form.method === 'desktop' || form.method === 'electron',
);

watch(
  () => form.method,
  (method) => {
    if (method !== 'desktop' && method !== 'electron') {
      form.platforms = [];
    } else if (form.platforms.length === 0) {
      form.platforms = ['windows-x64'];
    }
  },
);

function resetForm() {
  Object.assign(form, defaultForm());
}

function handleConfirm() {
  emit('confirm', {
    method: form.method,
    platforms: [...form.platforms],
    debugMode: form.debugMode,
    notes: form.notes,
  });
  visible.value = false;
}
</script>

<style scoped>
.publish-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-row-top {
  align-items: flex-start;
}

.form-row label {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--text-secondary);
  padding-top: 6px;
}

.form-row-top label {
  padding-top: 8px;
}

.form-row :deep(.n-select),
.form-row :deep(.n-tree-select),
.form-row :deep(.n-input) {
  flex: 1;
  min-width: 0;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  /* border-top: 1px solid var(--border-color); */
}
</style>

<style>
.publish-dialog .n-card-header {
  position: relative;
  justify-content: center;
}

.publish-dialog .n-card-header__main {
  flex: none;
  text-align: center;
}

.publish-dialog .n-card-header__close {
  position: absolute;
  right: 16px;
}
</style>
