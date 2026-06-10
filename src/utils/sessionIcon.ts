import type { ChatSession } from '@/types';

const APP_ICONS = [
  '🎨', '🚀', '⚡', '🎯', '🌈', '🔮', '💎', '🎪', '🎭', '🎬',
  '🎮', '🎲', '🧩', '🛠️', '📱', '💻', '🌐', '🔥', '✨', '🦋',
  '🌸', '🍀', '🎵', '📊', '🗂️', '🏠', '🚗', '✈️', '🎁', '🔔',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function isGeneratedApp(session: ChatSession): boolean {
  return session.generationPhase === 'done' && !!session.projectFiles?.length;
}

export function pickAppIconForSession(sessionId: string): string {
  return APP_ICONS[hashString(sessionId) % APP_ICONS.length];
}

export function pickRandomAppIcon(): string {
  return APP_ICONS[Math.floor(Math.random() * APP_ICONS.length)];
}

export function getSessionIcon(session: ChatSession): string {
  if (isGeneratedApp(session)) {
    return session.icon || pickAppIconForSession(session.id);
  }
  return '💬';
}

export function ensureSessionIcon(session: ChatSession): ChatSession {
  if (isGeneratedApp(session) && !session.icon) {
    return { ...session, icon: pickAppIconForSession(session.id) };
  }
  return session;
}
