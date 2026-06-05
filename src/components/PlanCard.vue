<template>
  <div class="plan-card">
    <div class="plan-card-header">
      <span class="plan-icon">📋</span>
      <span class="plan-title">开发计划已就绪</span>
    </div>
    <p class="plan-hint">
      确认后将开始生成 HTML/CSS/JS 文件并保存到本地工作区。也可在下方输入修改意见，让 AI 重新修订计划。
    </p>
    <button
      class="confirm-btn"
      :disabled="disabled"
      @click="$emit('confirm')"
    >
      {{ disabled ? '生成中...' : '确认并生成' }}
    </button>
  </div>
</template>

<script setup lang="ts">
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
