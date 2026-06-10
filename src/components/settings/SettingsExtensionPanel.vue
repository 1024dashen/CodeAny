<template>
  <div class="settings-panel">
    <h3 class="panel-title">拓展配置</h3>

    <div class="empty-state">
      <span class="empty-icon">🧩</span>
      <p class="empty-title">暂无拓展配置</p>
      <p class="empty-desc">拓展功能即将上线，届时可在此管理插件与集成服务。</p>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  background: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-muted);
  max-width: 360px;
}
</style>
