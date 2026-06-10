<template>
  <div class="settings-panel">
    <h3 class="panel-title">个人中心</h3>

    <section class="profile-card">
      <div class="avatar-section">
        <div class="avatar-large">{{ authStore.userNickname.charAt(0).toUpperCase() }}</div>
        <div class="basic-info">
          <span class="nickname">{{ authStore.userNickname }}</span>
          <span class="email">{{ authStore.userEmail }}</span>
          <span class="join-date">注册于 {{ formatDate(authStore.user?.createdAt) }}</span>
        </div>
      </div>
    </section>

    <section class="profile-section">
      <h4>修改昵称</h4>
      <div class="form-row">
        <input v-model="nicknameForm" type="text" placeholder="输入新昵称" />
        <button class="save-btn" :disabled="!nicknameForm.trim() || saving" @click="saveNickname">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </section>

    <section class="profile-section">
      <h4>修改密码</h4>
      <div class="form-group">
        <label>当前密码</label>
        <input v-model="pwdForm.oldPassword" type="password" placeholder="输入当前密码" />
      </div>
      <div class="form-group">
        <label>新密码</label>
        <input v-model="pwdForm.newPassword" type="password" placeholder="至少 6 个字符" />
      </div>
      <div class="form-group">
        <label>确认新密码</label>
        <input v-model="pwdForm.confirmPassword" type="password" placeholder="再次输入新密码" />
      </div>
      <div v-if="pwdError" class="form-error">{{ pwdError }}</div>
      <div v-if="pwdSuccess" class="form-success">{{ pwdSuccess }}</div>
      <button class="save-btn" :disabled="!canChangePwd || saving" @click="savePassword">
        {{ saving ? '保存中...' : '修改密码' }}
      </button>
    </section>

    <section class="profile-section">
      <h4>账户信息</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">用户 ID</span>
          <span class="info-value">{{ authStore.user?.id }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">邮箱</span>
          <span class="info-value">{{ authStore.userEmail }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">昵称</span>
          <span class="info-value">{{ authStore.userNickname }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">注册时间</span>
          <span class="info-value">{{ formatDate(authStore.user?.createdAt) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const saving = ref(false);
const pwdError = ref('');
const pwdSuccess = ref('');
const nicknameForm = ref(authStore.userNickname);

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const canChangePwd = computed(
  () => pwdForm.oldPassword && pwdForm.newPassword.length >= 6 && pwdForm.newPassword === pwdForm.confirmPassword,
);

async function saveNickname() {
  if (!nicknameForm.value.trim()) return;
  saving.value = true;
  try {
    await authStore.updateProfile({ nickname: nicknameForm.value.trim() });
  } catch {
    // ignore
  } finally {
    saving.value = false;
  }
}

async function savePassword() {
  pwdError.value = '';
  pwdSuccess.value = '';

  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    pwdError.value = '两次输入的新密码不一致';
    return;
  }

  if (pwdForm.newPassword.length < 6) {
    pwdError.value = '新密码至少需要 6 个字符';
    return;
  }

  saving.value = true;
  try {
    await authStore.changePassword(pwdForm.oldPassword, pwdForm.newPassword);
    pwdSuccess.value = '密码修改成功';
    pwdForm.oldPassword = '';
    pwdForm.newPassword = '';
    pwdForm.confirmPassword = '';
  } catch (err: unknown) {
    pwdError.value = err instanceof Error ? err.message : '密码修改失败';
  } finally {
    saving.value = false;
  }
}

function formatDate(ts?: number): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

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

.profile-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  flex-shrink: 0;
}

.basic-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nickname {
  font-size: 20px;
  font-weight: 600;
}

.email {
  font-size: 14px;
  color: var(--text-secondary);
}

.join-date {
  font-size: 12px;
  color: var(--text-muted);
}

.profile-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px 24px;
}

.profile-section h4 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.form-row input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  outline: none;
}

.form-row input:focus {
  border-color: var(--accent);
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  outline: none;
}

.form-group input:focus {
  border-color: var(--accent);
}

.form-error {
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 74, 106, 0.1);
  color: var(--danger);
  font-size: 13px;
  margin-bottom: 12px;
}

.form-success {
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(74, 255, 138, 0.1);
  color: var(--success);
  font-size: 13px;
  margin-bottom: 12px;
}

.save-btn {
  padding: 10px 24px;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.info-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px 16px;
  align-items: center;
}

.info-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-family: monospace;
  color: var(--text-primary);
  word-break: break-all;
}
</style>
