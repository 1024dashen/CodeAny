<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">🤖</div>
      <h1 class="auth-title">CodeAny</h1>
      <p class="auth-subtitle">{{ t('auth.loginTitle') }}</p>

      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">{{ t('auth.email') }}</label>
          <input
            id="email"
            v-model="email"
            type="email"
            :placeholder="t('auth.emailPlaceholder')"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">{{ t('auth.password') }}</label>
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('auth.passwordPlaceholder')"
              autocomplete="current-password"
              required
            />
            <button type="button" class="toggle-pwd" @click="showPassword = !showPassword">
              {{ showPassword ? t('common.hide') : t('common.show') }}
            </button>
          </div>
        </div>

        <div v-if="authStore.error" class="auth-error">
          {{ authStore.error }}
        </div>

        <button type="submit" class="auth-submit" :disabled="authStore.loading">
          {{ authStore.loading ? t('auth.loggingIn') : t('auth.login') }}
        </button>
      </form>

      <div class="auth-footer">
        <span>{{ t('auth.noAccount') }}</span>
        <router-link to="/register" class="auth-link" @click="authStore.clearError()">{{ t('auth.registerLink') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false);

async function handleLogin() {
  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    });
    router.push('/');
  } catch {
    // error is already set in store
  }
}
</script>

<style scoped>
.auth-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
}

.auth-card {
  width: 400px;
  max-width: 90vw;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: var(--shadow);
}

.auth-logo {
  font-size: 48px;
  text-align: center;
  margin-bottom: 8px;
}

.auth-title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.auth-subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 32px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: var(--accent);
}

.password-input {
  display: flex;
  gap: 8px;
}

.password-input input {
  flex: 1;
}

.toggle-pwd {
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-hover);
  white-space: nowrap;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.toggle-pwd:hover {
  color: var(--accent);
}

.auth-error {
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 74, 106, 0.1);
  color: var(--danger);
  font-size: 13px;
  text-align: center;
}

.auth-submit {
  padding: 12px;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font-size: 15px;
  font-weight: 600;
  transition: background 0.2s;
  margin-top: 8px;
}

.auth-submit:hover:not(:disabled) {
  background: var(--accent-hover);
}

.auth-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: var(--text-secondary);
}

.auth-link {
  color: var(--accent);
  font-weight: 500;
  margin-left: 4px;
}

.auth-link:hover {
  color: var(--accent-hover);
}
</style>
