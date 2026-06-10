import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AppSettings, ModelProvider, ServiceProviderId } from '@/types';
import { DEFAULT_PROVIDERS } from '@/utils/providers';
import { defaultServiceTokens } from '@/utils/serviceProviders';
import { loadStorageValue, saveStorageValue } from '@/utils/store';
import { setAppLocale, DEFAULT_LOCALE } from '@/i18n';
import type { AppLocale } from '@/types';

const STORAGE_KEY = 'settings';

function mergeSettings(saved: AppSettings): AppSettings {
  const mergedProviders = DEFAULT_PROVIDERS.map(dp => {
    const savedP = saved.providers.find(sp => sp.id === dp.id);
    if (savedP) {
      const defaultModelIds = new Set(dp.models.map(m => m.id));
      const userModels = savedP.models.filter(m => !defaultModelIds.has(m.id));
      return { ...dp, apiKey: savedP.apiKey, models: [...dp.models, ...userModels] };
    }
    return dp;
  });
  const customProviders = saved.providers.filter(
    sp => !DEFAULT_PROVIDERS.some(dp => dp.id === sp.id),
  );
  return {
    ...saved,
    generationPrompt: saved.generationPrompt ?? '',
    locale: saved.locale ?? DEFAULT_LOCALE,
    serviceTokens: { ...defaultServiceTokens(), ...saved.serviceTokens },
    providers: [...mergedProviders, ...customProviders],
  };
}

function defaultSettings(): AppSettings {
  return {
    providers: DEFAULT_PROVIDERS,
    activeProviderId: 'openai',
    activeModelId: 'gpt-4o',
    theme: 'dark',
    locale: DEFAULT_LOCALE,
    fontSize: 14,
    sendOnEnter: true,
    systemPrompt: '',
    generationPrompt: '',
    serviceTokens: defaultServiceTokens(),
  };
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(defaultSettings());
  const isHydrated = ref(false);

  const activeProvider = computed(() =>
    settings.value.providers.find(p => p.id === settings.value.activeProviderId),
  );

  const activeModel = computed(() =>
    activeProvider.value?.models.find(m => m.id === settings.value.activeModelId),
  );

  const allProviders = computed(() => settings.value.providers);

  async function hydrate() {
    const saved = await loadStorageValue<AppSettings | null>(STORAGE_KEY, null);
    settings.value = saved ? mergeSettings(saved) : defaultSettings();
    document.documentElement.setAttribute('data-theme', settings.value.theme);
    setAppLocale(settings.value.locale);
    isHydrated.value = true;
  }

  function save() {
    saveStorageValue(STORAGE_KEY, settings.value);
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

  function addModel(providerId: string, modelId: string, modelName?: string) {
    const provider = settings.value.providers.find(p => p.id === providerId);
    if (!provider) return;
    if (provider.models.some(m => m.id === modelId)) return;
    provider.models.push({
      id: modelId,
      name: modelName || modelId,
      providerId,
    });
    save();
  }

  function removeModel(providerId: string, modelId: string) {
    const provider = settings.value.providers.find(p => p.id === providerId);
    if (!provider) return;
    provider.models = provider.models.filter(m => m.id !== modelId);
    if (settings.value.activeModelId === modelId) {
      settings.value.activeModelId = provider.models[0]?.id || '';
    }
    save();
  }

  function setTheme(theme: 'light' | 'dark') {
    settings.value.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    save();
  }

  function setLocale(locale: AppLocale) {
    settings.value.locale = locale;
    setAppLocale(locale);
    save();
  }

  function setSystemPrompt(prompt: string) {
    settings.value.systemPrompt = prompt;
    save();
  }

  function setGenerationPrompt(prompt: string) {
    settings.value.generationPrompt = prompt;
    save();
  }

  function setFontSize(fontSize: number) {
    settings.value.fontSize = fontSize;
    save();
  }

  function setSendOnEnter(sendOnEnter: boolean) {
    settings.value.sendOnEnter = sendOnEnter;
    save();
  }

  function setServiceToken(providerId: ServiceProviderId, token: string) {
    settings.value.serviceTokens[providerId] = token;
    save();
  }

  function clearServiceToken(providerId: ServiceProviderId) {
    settings.value.serviceTokens[providerId] = '';
    save();
  }

  return {
    settings,
    isHydrated,
    activeProvider,
    activeModel,
    allProviders,
    hydrate,
    setActiveProvider,
    setActiveModel,
    updateApiKey,
    updateProvider,
    addProvider,
    removeProvider,
    addModel,
    removeModel,
    setTheme,
    setLocale,
    setSystemPrompt,
    setGenerationPrompt,
    setFontSize,
    setSendOnEnter,
    setServiceToken,
    clearServiceToken,
    save,
  };
});
