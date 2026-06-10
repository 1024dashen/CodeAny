<template>
  <div class="plan-card">
    <div class="plan-card-header">
      <span class="plan-icon">📋</span>
      <span class="plan-title">{{ t('plan.title') }}</span>
    </div>
    <p class="plan-hint">
      {{ t('plan.hint') }}
    </p>
    <button
      class="confirm-btn"
      :disabled="disabled"
      @click="$emit('confirm')"
    >
      {{ disabled ? t('plan.generating') : t('plan.confirm') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  disabled?: boolean;
}>();

defineEmits<{
  confirm: [];
}>();
</script>

<style scoped>
.plan-card {
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px solid var(--accent);
  border-radius: 10px;
  background: rgba(74, 158, 255, 0.06);
  max-width: 100%;
  min-width: 0;
}

.plan-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.plan-icon {
  font-size: 18px;
}

.plan-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.plan-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.confirm-btn {
  padding: 8px 18px;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
