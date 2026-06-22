import type { ChatSession, DesktopAppConfig, GeneratedAppConfig, MobileAppConfig, WebAppConfig, PwaConfig } from '@/types';
import { getSessionIcon } from '@/utils/sessionIcon';

export function defaultDesktopAppConfig(session: ChatSession): DesktopAppConfig {
  return {
    name: session.title,
    url: 'index.html',
    icon: getSessionIcon(session),
    id: session.id,
    version: '1.0.0',
    keepWindow: false,
    debugMode: false,
    windowWidth: 1280,
    windowHeight: 800,
    minWidth: 800,
    minHeight: 600,
    maxWidth: 1920,
    maxHeight: 1080,
    userAgent: '',
  };
}

export function defaultMobileAppConfig(session: ChatSession): MobileAppConfig {
  return {
    name: session.title,
    url: 'index.html',
    icon: getSessionIcon(session),
    id: session.id,
    version: '1.0.0',
    networkAccess: true,
    downloadFiles: false,
    locationPermission: false,
    cameraPermission: false,
  };
}

export function defaultPwaConfig(): PwaConfig {
  return {
    enabled: false,
    shortName: '',
    themeColor: '#1976d2',
    backgroundColor: '#ffffff',
    display: 'standalone',
    orientation: 'any',
  };
}

export function defaultWebAppConfig(session: ChatSession): WebAppConfig {
  return {
    domain: '',
    icon: '',
    title: session.title,
    description: '',
    keywords: '',
    ogImage: '',
    pwa: defaultPwaConfig(),
  };
}

export function defaultGeneratedAppConfig(session: ChatSession): GeneratedAppConfig {
  return {
    desktop: defaultDesktopAppConfig(session),
    mobile: defaultMobileAppConfig(session),
    web: defaultWebAppConfig(session),
  };
}

export function ensureAppConfig(session: ChatSession): GeneratedAppConfig {
  const defaults = defaultGeneratedAppConfig(session);
  if (!session.appConfig) {
    return defaults;
  }
  return {
    desktop: { ...defaults.desktop, ...session.appConfig.desktop },
    mobile: { ...defaults.mobile, ...session.appConfig.mobile },
    web: session.appConfig.web ? { ...defaults.web, ...session.appConfig.web } : defaults.web,
  };
}
