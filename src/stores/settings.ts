import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AppSettings, ModelProvider } from '@/types';
import { DEFAULT_PROVIDERS } from '@/utils/providers';

const STORAGE_KEY = 'codeany-settings';

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as AppSettings;
      // Merge saved with defaults to pick up new providers
      const mergedProviders = DEFAULT_PROVIDERS.map(dp => {
        const savedP = saved.providers.find(sp => sp.id === dp.id);
        if (savedP) {
          return { ...dp, apiKey: savedP.apiKey, models: dp.models };
        }
        return dp;
      });
      // Also keep any custom providers that were added
      const customProviders = saved.providers.filter(
        sp => !DEFAULT_PROVIDERS.some(dp => dp.id === sp.id)
      );
      return {
        ...saved,
        providers: [...mergedProviders, ...customProviders],
      };
    }
  } catch {
    // ignore
  }
  return {
    providers: DEFAULT_PROVIDERS,
    activeProviderId: 'openai',
    activeModelId: 'gpt-4o',
    theme: 'dark',
    fontSize: 14,
    sendOnEnter: true,
    systemPrompt: '',
  };
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(loadSettings());

  const activeProvider = computed(() =>
    settings.value.providers.find(p => p.id === settings.value.activeProviderId)
  );

  const activeModel = computed(() =>
    activeProvider.value?.models.find(m => m.id === settings.value.activeModelId)
  );

  const allProviders = computed(() => settings.value.providers);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
  }

  function setActiveProvider(providerId: string) {
    settings.value.activeProviderId = providerId;
    const provider = settings.value.providers.find(p => p.id === providerId);
    if (provider && provider.models.length > 0) {
      settings.value.activeModelId = provider.models[0].id;
    }
    save();
  }

  function setActiveModel(modelId: string) {
    settings.value.activeModelId = modelId;
    save();
  }

  function updateApiKey(providerId: string, apiKey: string) {
    const provider = settings.value.providers.find(p => p.id === providerId);
    if (provider) {
      provider.apiKey = apiKey;
      save();
    }
  }

  function updateProvider(providerId: string, data: Partial<ModelProvider>) {
    const idx = settings.value.providers.findIndex(p => p.id === providerId);
    if (idx >= 0) {
      settings.value.providers[idx] = { ...settings.value.providers[idx], ...data };
      save();
    }
  }

  function addProvider(provider: ModelProvider) {
    settings.value.providers.push(provider);
    save();
  }

  function removeProvider(providerId: string) {
    settings.value.providers = settings.value.providers.filter(p => p.id !== providerId);
    if (settings.value.activeProviderId === providerId) {
      settings.value.activeProviderId = settings.value.providers[0]?.id || '';
      const p = settings.value.providers[0];
      settings.value.activeModelId = p?.models[0]?.id || '';
    }
    save();
  }

  function setTheme(theme: 'light' | 'dark') {
    settings.value.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    save();
  }

  function setSystemPrompt(prompt: string) {
    settings.value.systemPrompt = prompt;
    save();
  }

  // Init theme
  document.documentElement.setAttribute('data-theme', settings.value.theme);

  return {
    settings,
    activeProvider,
    activeModel,
    allProviders,
    setActiveProvider,
    setActiveModel,
    updateApiKey,
    updateProvider,
    addProvider,
    removeProvider,
    setTheme,
    setSystemPrompt,
    save,
  };
});