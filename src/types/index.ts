export interface ModelProvider {
  id: string;
  name: string;
  apiBase: string;
  apiKey: string;
  models: ModelInfo[];
}

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
  isLoading?: boolean;
  error?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: string;
  providerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  providers: ModelProvider[];
  activeProviderId: string;
  activeModelId: string;
  theme: 'light' | 'dark';
  fontSize: number;
  sendOnEnter: boolean;
  systemPrompt: string;
}

export interface StreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    finish_reason?: string | null;
  }>;
  error?: {
    message: string;
  };
}
