import type { ModelProvider, ModelInfo } from '@/types';

export const DEFAULT_PROVIDERS: ModelProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    apiBase: 'https://api.openai.com/v1',
    apiKey: '',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', providerId: 'openai' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', providerId: 'openai' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', providerId: 'openai' },
      { id: 'o1', name: 'o1', providerId: 'openai' },
      { id: 'o3-mini', name: 'o3-mini', providerId: 'openai' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    apiBase: 'https://api.anthropic.com/v1',
    apiKey: '',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', providerId: 'anthropic' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', providerId: 'anthropic' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', providerId: 'anthropic' },
    ],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    apiBase: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: '',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', providerId: 'google' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', providerId: 'google' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', providerId: 'google' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiBase: 'https://api.deepseek.com/v1',
    apiKey: '',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', providerId: 'deepseek' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', providerId: 'deepseek' },
    ],
  },
  {
    id: 'qwen',
    name: '通义千问',
    apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
    models: [
      { id: 'qwen-max', name: 'Qwen Max', providerId: 'qwen' },
      { id: 'qwen-plus', name: 'Qwen Plus', providerId: 'qwen' },
      { id: 'qwen-turbo', name: 'Qwen Turbo', providerId: 'qwen' },
    ],
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    apiBase: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: '',
    models: [
      { id: 'glm-4-plus', name: 'GLM-4 Plus', providerId: 'zhipu' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash', providerId: 'zhipu' },
      { id: 'glm-4-air', name: 'GLM-4 Air', providerId: 'zhipu' },
    ],
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    apiBase: 'https://api.moonshot.cn/v1',
    apiKey: '',
    models: [
      { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K', providerId: 'moonshot' },
      { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', providerId: 'moonshot' },
      { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K', providerId: 'moonshot' },
    ],
  },
];

export function findModel(providers: ModelProvider[], providerId: string, modelId: string): ModelInfo | undefined {
  const provider = providers.find(p => p.id === providerId);
  return provider?.models.find(m => m.id === modelId);
}

export function getProviderModels(providers: ModelProvider[], providerId: string): ModelInfo[] {
  return providers.find(p => p.id === providerId)?.models || [];
}
