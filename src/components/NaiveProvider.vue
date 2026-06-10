<template>
  <NConfigProvider
    :theme="naiveTheme"
    :locale="naiveLocale"
    :theme-overrides="themeOverrides"
  >
    <slot />
  </NConfigProvider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  NConfigProvider,
  darkTheme,
  zhCN,
  enUS,
  jaJP,
  koKR,
  zhTW,
  type GlobalThemeOverrides,
} from 'naive-ui';
import { useSettingsStore } from '@/stores/settings';
import type { AppLocale } from '@/types';

const settingsStore = useSettingsStore();

const NAIVE_LOCALES: Record<AppLocale, typeof zhCN> = {
  'zh-CN': zhCN,
  en: enUS,
  ja: jaJP,
  ko: koKR,
  'zh-TW': zhTW,
};

const naiveTheme = computed(() =>
  settingsStore.settings.theme === 'dark' ? darkTheme : null,
);

const naiveLocale = computed(
  () => NAIVE_LOCALES[settingsStore.settings.locale] ?? zhCN,
);

const themeOverrides = computed<GlobalThemeOverrides>(() => {
  const isDark = settingsStore.settings.theme === 'dark';
  return {
    common: {
      primaryColor: isDark ? '#4a9eff' : '#1976d2',
      primaryColorHover: isDark ? '#6ab0ff' : '#1565c0',
      primaryColorPressed: isDark ? '#3a8eef' : '#0d47a1',
      borderRadius: '10px',
      borderRadiusSmall: '8px',
    },
    Select: {
      peers: {
        InternalSelection: {
          borderRadius: '10px',
        },
      },
    },
  };
});
</script>
