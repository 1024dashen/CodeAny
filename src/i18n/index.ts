import { createI18n } from 'vue-i18n';
import type { AppLocale } from '@/types';
import zhCN from './locales/zh-CN';
import en from './locales/en';
import ja from './locales/ja';
import ko from './locales/ko';
import zhTW from './locales/zh-TW';

export const SUPPORTED_LOCALES: AppLocale[] = ['zh-CN', 'en', 'ja', 'ko', 'zh-TW'];

export const DEFAULT_LOCALE: AppLocale = 'zh-CN';

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    'zh-CN': zhCN,
    en,
    ja,
    ko,
    'zh-TW': zhTW,
  },
});

export function setAppLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale;
  document.documentElement.setAttribute('lang', locale);
}

export function t(key: string, params?: Record<string, unknown>): string {
  return i18n.global.t(key, params ?? {});
}
