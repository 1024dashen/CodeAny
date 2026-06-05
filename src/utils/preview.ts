import { invoke } from '@tauri-apps/api/core';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { isTauriEnv } from '@/utils/store';

const activePreviewPorts = new Map<string, number>();

export async function openProjectPreview(
  sessionId: string,
  sessionTitle: string,
  projectDir: string,
): Promise<void> {
  if (!isTauriEnv()) {
    throw new Error('预览功能仅在 Tauri 桌面应用中可用');
  }

  const existingPort = activePreviewPorts.get(sessionId);
  if (existingPort !== undefined) {
    try {
      await invoke('stop_preview_server', { port: existingPort });
    } catch {
      // ignore stale server
    }
    activePreviewPorts.delete(sessionId);

    const existingLabel = `preview-${sessionId}`;
    const existingWin = await WebviewWindow.getByLabel(existingLabel);
    if (existingWin) {
      await existingWin.close();
    }
  }

  const port = await invoke<number>('start_preview_server', { projectDir });
  activePreviewPorts.set(sessionId, port);

  const label = `preview-${sessionId}`;
  const previewWin = new WebviewWindow(label, {
    url: `http://127.0.0.1:${port}/`,
    title: `预览 - ${sessionTitle}`,
    width: 960,
    height: 720,
    center: true,
    resizable: true,
  });

  previewWin.onCloseRequested(async () => {
    const currentPort = activePreviewPorts.get(sessionId);
    if (currentPort !== undefined) {
      try {
        await invoke('stop_preview_server', { port: currentPort });
      } catch {
        // ignore
      }
      activePreviewPorts.delete(sessionId);
    }
  });
}

export async function writeProjectFilesToDisk(
  projectDir: string,
  files: Array<{ path: string; content: string }>,
): Promise<void> {
  if (!isTauriEnv()) return;
  await invoke('write_project_files', { dir: projectDir, files });
}
