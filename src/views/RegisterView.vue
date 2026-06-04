<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">🤖</div>
      <h1 class="auth-title">CodeAny</h1>
      <p class="auth-subtitle">创建新账户</p>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="请输入邮箱"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label for="nickname">昵称（可选）</label>
          <input
            id="nickname"
            v-model="nickname"
            type="text"
            placeholder="给自己取个名字"
            autocomplete="nickname"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="至少 6 个字符"
              autocomplete="new-password"
              required
            />
            <button type="button" class="toggle-pwd" @click="showPassword = !showPassword">
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="再次输入密码"
            autocomplete="new-password"
            required
          />
        </div>

        <div v-if="authStore.error" class="auth-error">
          {{ authStore.error }}
        </div>

        <button type="submit" class="auth-submit" :disabled="authStore.loading">
          {{ authStore.loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>已有账户？</span>
        <router-link to="/login" class="auth-link" @click="authStore.clearError()">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const nickname = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);

async function handleRegister() {
  try {
    await authStore.register({
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
      nickname: nickname.value || undefined,
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