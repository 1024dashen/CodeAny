import type { ProjectFile } from '@/types';

export const SCROLLBAR_STYLE_MARKER = '/* CodeAny 默认滚动条样式 */';

/** Element Plus 风格滚动条，用于生成的应用（用户未特别说明时） */
export const DEFAULT_SCROLLBAR_CSS = `::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

::-webkit-scrollbar-corner {
  background: transparent;
}

.dark ::-webkit-scrollbar-track {
  background: transparent;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4e4e52;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #6d6d70;
}

@media (prefers-color-scheme: dark) {
  ::-webkit-scrollbar-thumb {
    background: #4e4e52;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #6d6d70;
  }
}`;

/** 用户是否在需求中特别说明了滚动条 */
export function userSpecifiedScrollbar(originalRequest: string): boolean {
  return /(滚动条|scrollbar)/i.test(originalRequest);
}

export function applyGeneratedAppDefaults(
  files: ProjectFile[],
  originalRequest: string,
): ProjectFile[] {
  if (userSpecifiedScrollbar(originalRequest)) {
    return files;
  }

  return files.map(file => {
    const path = file.path.replace(/^\/+/, '');
    if (!path.endsWith('.css')) {
      return file;
    }

    if (file.content.includes(SCROLLBAR_STYLE_MARKER)) {
      return file;
    }

    const trimmed = file.content.trimEnd();
    return {
      ...file,
      content: `${trimmed}\n\n${SCROLLBAR_STYLE_MARKER}\n${DEFAULT_SCROLLBAR_CSS}\n`,
    };
  });
}
