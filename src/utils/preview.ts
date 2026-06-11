import { invoke } from '@tauri-apps/api/core';
import { LogicalSize } from '@tauri-apps/api/dpi';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { open } from '@tauri-apps/plugin-shell';
import { isTauriEnv } from '@/utils/store';
import { t } from '@/i18n';

export type PreviewMode = 'phone' | 'ipad' | 'desktop' | 'browser';

const PREVIEW_SIZES: Record<Exclude<PreviewMode, 'browser'>, { width: number; height: number }> = {
  phone: { width: 390, height: 844 },
  ipad: { width: 1180, height: 820 },
  desktop: { width: 1280, height: 800 },
};

const activePreviewPorts = new Map<string, number>();

function stopPreviewServer(sessionId: string): void {
  const port = activePreviewPorts.get(sessionId);
  if (port === undefined) return;

  activePreviewPorts.delete(sessionId);
  invoke('stop_preview_server', { port }).catch(() => {
    // ignore stale server
  });
}

async function ensurePreviewServer(sessionId: string, projectDir: string): Promise<number> {
  const existing = activePreviewPorts.get(sessionId);
  if (existing !== undefined) return existing;

  const port = await invoke<number>('start_preview_server', { projectDir });
  activePreviewPorts.set(sessionId, port);
  return port;
}

function previewWindowLabel(sessionId: string): string {
  return `preview-${sessionId}`;
}

async function openPreviewWindow(
  sessionId: string,
  sessionTitle: string,
  url: string,
  mode: Exclude<PreviewMode, 'browser'>,
): Promise<void> {
  const label = previewWindowLabel(sessionId);
  const { width, height } = PREVIEW_SIZES[mode];
  const existingWin = await WebviewWindow.getByLabel(label);

  if (existingWin) {
    await existingWin.setSize(new LogicalSize(width, height));
    await existingWin.center();
    await existingWin.setFocus();
    return;
  }

  const previewWin = new WebviewWindow(label, {
    url,
    title: t('preview.windowTitle', { title: sessionTitle }),
    width,
    height,
    center: true,
    resizable: true,
  });

  previewWin.once('tauri://destroyed', () => {
    stopPreviewServer(sessionId);
  });
}

export async function openProjectPreview(
  mode: PreviewMode,
  sessionId: string,
  sessionTitle: string,
  projectDir: string,
): Promise<void> {
  if (!isTauriEnv()) {
    throw new Error(t('preview.tauriOnly'));
  }

  const port = await ensurePreviewServer(sessionId, projectDir);
  const url = `http://127.0.0.1:${port}/`;

  if (mode === 'browser') {
    await open(url);
    return;
  }

  await openPreviewWindow(sessionId, sessionTitle, url, mode);
}

export async function writeProjectFilesToDisk(
  projectDir: string,
  files: Array<{ path: string; content: string }>,
): Promise<void> {
  if (!isTauriEnv()) return;
  await invoke('write_project_files', { dir: projectDir, files });
}
