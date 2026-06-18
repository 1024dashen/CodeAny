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

export interface DesktopAppConfig {
  name: string;
  url: string;
  icon: string;
  id: string;
  version: string;
  keepWindow: boolean;
  debugMode: boolean;
  windowWidth: number;
  windowHeight: number;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  userAgent: string;
}

export interface MobileAppConfig {
  name: string;
  url: string;
  icon: string;
  id: string;
  version: string;
  networkAccess: boolean;
  downloadFiles: boolean;
  locationPermission: boolean;
  cameraPermission: boolean;
}

export interface PwaConfig {
  enabled: boolean;
  shortName: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'any' | 'natural' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';
}

export interface WebAppConfig {
  domain: string;
  icon: string;
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  pwa: PwaConfig;
}

export interface GeneratedAppConfig {
  desktop: DesktopAppConfig;
  mobile: MobileAppConfig;
  web: WebAppConfig;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: string;
  providerId: string;
  createdAt: number;
  updatedAt: number;
  generationPhase: GenerationPhase;
  planContent?: string;
  projectFiles?: ProjectFile[];
  projectDir?: string;
  icon?: string;
  appConfig?: GeneratedAppConfig;
}

export type GenerationPhase =
  | 'idle'
  | 'planning'
  | 'plan_ready'
  | 'generating'
  | 'done'
  | 'error';

export interface ProjectFile {
  path: string;
  content: string;
}

export type AppLocale = 'zh-CN' | 'en' | 'ja' | 'ko' | 'zh-TW';

export type ServiceProviderId = 'github' | 'cloudflare' | 'netlify' | 'vercel' | 'supabase';

export interface ServiceTokens {
  github: string;
  cloudflare: string;
  netlify: string;
  vercel: string;
  supabase: string;
}

export interface SshConfig {
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'key';
  password: string;
  privateKey: string;
  name: string;
}

export interface AppSettings {
  providers: ModelProvider[];
  activeProviderId: string;
  activeModelId: string;
  theme: 'light' | 'dark';
  locale: AppLocale;
  fontSize: number;
  sendOnEnter: boolean;
  systemPrompt: string;
  generationPrompt: string;
  serviceTokens: ServiceTokens;
  sshServers: SshConfig[];
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  createdAt: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  confirmPassword: string;
  nickname?: string;
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
