<template>
  <div class="settings-panel">
    <h3 class="panel-title">{{ t('profile.title') }}</h3>

    <section class="profile-card">
      <div class="avatar-section">
        <div class="avatar-large">{{ authStore.userNickname.charAt(0).toUpperCase() }}</div>
        <div class="basic-info">
          <span class="nickname">{{ authStore.userNickname }}</span>
          <span class="email">{{ authStore.userEmail }}</span>
          <span class="join-date">{{ t('profile.joinedAt', { date: formatDate(authStore.user?.createdAt) }) }}</span>
        </div>
      </div>
    </section>

    <section class="profile-section">
      <h4>{{ t('profile.changeNickname') }}</h4>
      <div class="form-row">
        <input v-model="nicknameForm" type="text" :placeholder="t('profile.nicknamePlaceholder')" />
        <button class="save-btn" :disabled="!nicknameForm.trim() || saving" @click="saveNickname">
          {{ saving ? t('common.saving') : t('common.save') }}
        </button>
      </div>
    </section>

    <section class="profile-section">
      <h4>{{ t('profile.changePassword') }}</h4>
      <div class="form-group">
        <label>{{ t('profile.currentPassword') }}</label>
        <input v-model="pwdForm.oldPassword" type="password" :placeholder="t('profile.currentPasswordPlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ t('profile.newPassword') }}</label>
        <input v-model="pwdForm.newPassword" type="password" :placeholder="t('profile.newPasswordPlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ t('profile.confirmNewPassword') }}</label>
        <input v-model="pwdForm.confirmPassword" type="password" :placeholder="t('profile.confirmNewPasswordPlaceholder')" />
      </div>
      <div v-if="pwdError" class="form-error">{{ pwdError }}</div>
      <div v-if="pwdSuccess" class="form-success">{{ pwdSuccess }}</div>
      <button class="save-btn" :disabled="!canChangePwd || saving" @click="savePassword">
        {{ saving ? t('common.saving') : t('profile.changePasswordBtn') }}
      </button>
    </section>

    <section class="profile-section">
      <h4>{{ t('profile.accountInfo') }}</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">{{ t('profile.userId') }}</span>
          <span class="info-value">{{ authStore.user?.id }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t('profile.email') }}</span>
          <span class="info-value">{{ authStore.userEmail }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t('profile.nickname') }}</span>
          <span class="info-value">{{ authStore.userNickname }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t('profile.registeredAt') }}</span>
          <span class="info-value">{{ formatDate(authStore.user?.createdAt) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';

const { t, locale } = useI18n();
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
    pwdError.value = t('profile.passwordMismatch');
    return;
  }

  if (pwdForm.newPassword.length < 6) {
    pwdError.value = t('profile.passwordMin');
    return;
  }

  saving.value = true;
  try {
    await authStore.changePassword(pwdForm.oldPassword, pwdForm.newPassword);
    pwdSuccess.value = t('profile.passwordChanged');
    pwdForm.oldPassword = '';
    pwdForm.newPassword = '';
    pwdForm.confirmPassword = '';
  } catch (err: unknown) {
    pwdError.value = err instanceof Error ? err.message : t('profile.passwordChangeFailed');
  } finally {
    saving.value = false;
  }
}

function formatDate(ts?: number): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString(locale.value, {
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
