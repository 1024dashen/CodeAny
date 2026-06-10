import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginParams, RegisterParams } from '@/types';
import {
  loginWithEmail,
  registerWithEmail,
  logout as authLogout,
  getCurrentUser,
  updateProfile as authUpdateProfile,
  changePassword as authChangePassword,
} from '@/utils/auth';
import { t } from '@/i18n';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isLoggedIn = computed(() => !!user.value);
  const userEmail = computed(() => user.value?.email || '');
  const userNickname = computed(() => user.value?.nickname || '');
  const userAvatar = computed(() => user.value?.avatar || '');

  async function init() {
    loading.value = true;
    try {
      user.value = await getCurrentUser();
    } catch {
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function login(params: LoginParams) {
    loading.value = true;
    error.value = null;
    try {
      const result = await loginWithEmail(params);
      user.value = result.user;
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.loginFailed');
      error.value = msg;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function register(params: RegisterParams) {
    loading.value = true;
    error.value = null;
    try {
      const result = await registerWithEmail(params);
      user.value = result.user;
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.registerFailed');
      error.value = msg;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    await authLogout();
    user.value = null;
  }

  async function updateProfile(data: { nickname?: string; avatar?: string }) {
    const updated = await authUpdateProfile(data);
    user.value = updated;
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    await authChangePassword(oldPassword, newPassword);
  }

  function clearError() {
    error.value = null;
  }

  return {
    user,
    loading,
    error,
    isLoggedIn,
    userEmail,
    userNickname,
    userAvatar,
    init,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
  };
});