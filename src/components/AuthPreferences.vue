<template>
  <div class="auth-preferences">
    <LanguageSwitcher icon-only />
    <button
      type="button"
      class="icon-btn"
      :title="isDark ? t('chat.switchToLight') : t('chat.switchToDark')"
      @click="settingsStore.setTheme(isDark ? 'light' : 'dark')"
    >
      <svg
        v-if="isDark"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41"
          stroke-linecap="round"
        />
      </svg>
      <svg
        v-else
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        aria-hidden="true"
      >
        <path
          d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';

const { t } = useI18n();
const settingsStore = useSettingsStore();

const isDark = computed(() => settingsStore.settings.theme === 'dark');
</script>

<style scoped>
.auth-preferences {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.icon-btn:hover {
  color: var(--text-primary);
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}
</style>
