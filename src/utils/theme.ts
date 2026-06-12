import { setTheme } from '@tauri-apps/api/app';
import { isTauri } from '@tauri-apps/api/core';

export function syncTauriTheme(theme: 'light' | 'dark'): void {
  console.log("syncTauriTheme", theme);
  if (!isTauri()) return;
  setTheme(theme === "dark" ? "dark" : "light")
}
