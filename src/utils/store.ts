import { LazyStore } from '@tauri-apps/plugin-store';

const STORE_FILE = 'app-data.json';
const MIGRATION_FLAG = 'codeany-store-migrated';

const LEGACY_KEYS = {
  sessions: 'codeany-sessions',
  settings: 'codeany-settings',
} as const;

export function isTauriEnv(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

let store: LazyStore | null = null;

function getStore(): LazyStore {
  if (!store) {
    store = new LazyStore(STORE_FILE);
  }
  return store;
}

async function getFromLocalStorage<T>(key: string): Promise<T | null> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function migrateLegacyStorage(): Promise<void> {
  if (!isTauriEnv()) return;
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  const appStore = getStore();

  const legacySessions = await getFromLocalStorage<unknown>(LEGACY_KEYS.sessions);
  if (legacySessions !== null && (await appStore.get('sessions')) === undefined) {
    await appStore.set('sessions', legacySessions);
  }

  const legacySettings = await getFromLocalStorage<unknown>(LEGACY_KEYS.settings);
  if (legacySettings !== null && (await appStore.get('settings')) === undefined) {
    await appStore.set('settings', legacySettings);
  }

  await appStore.save();
  localStorage.setItem(MIGRATION_FLAG, '1');
}

export async function loadStorageValue<T>(key: string, fallback: T): Promise<T> {
  if (isTauriEnv()) {
    await migrateLegacyStorage();
    const value = await getStore().get<T>(key);
    return value ?? fallback;
  }

  const legacy = await getFromLocalStorage<T>(key);
  return legacy ?? fallback;
}

export async function saveStorageValue<T>(key: string, value: T): Promise<void> {
  if (isTauriEnv()) {
    const appStore = getStore();
    await appStore.set(key, value);
    await appStore.save();
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export async function loadWorkspaceRoot(): Promise<string> {
  return loadStorageValue('workspaceRoot', '');
}

export async function saveWorkspaceRoot(path: string): Promise<void> {
  await saveStorageValue('workspaceRoot', path);
}
