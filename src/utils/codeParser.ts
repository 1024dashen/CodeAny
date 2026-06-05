import type { ProjectFile } from '@/types';

const FILE_BLOCK_RE = /```file:([^\n\r]+)\r?\n([\s\S]*?)```/g;

const FALLBACK_BLOCK_RE = /```(html|css|javascript|js)\r?\n([\s\S]*?)```/g;

const FALLBACK_NAMES: Record<string, string> = {
  html: 'index.html',
  css: 'styles.css',
  javascript: 'app.js',
  js: 'app.js',
};

export function parseProjectFiles(content: string): ProjectFile[] {
  const files: ProjectFile[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  FILE_BLOCK_RE.lastIndex = 0;
  while ((match = FILE_BLOCK_RE.exec(content)) !== null) {
    const path = match[1].trim().replace(/^\/+/, '');
    const fileContent = match[2].replace(/\n$/, '');
    if (path && !seen.has(path)) {
      files.push({ path, content: fileContent });
      seen.add(path);
    }
  }

  if (files.length === 0) {
    FALLBACK_BLOCK_RE.lastIndex = 0;
    while ((match = FALLBACK_BLOCK_RE.exec(content)) !== null) {
      const lang = match[1].toLowerCase();
      const path = FALLBACK_NAMES[lang] || `file.${lang}`;
      const fileContent = match[2].replace(/\n$/, '');
      if (!seen.has(path)) {
        files.push({ path, content: fileContent });
        seen.add(path);
      }
    }
  }

  return files;
}

export function validateProjectFiles(files: ProjectFile[]): string | null {
  if (files.length === 0) {
    return '未能从 AI 回复中解析出任何文件，请重试';
  }
  const hasIndex = files.some(
    f => f.path === 'index.html' || f.path.endsWith('/index.html'),
  );
  if (!hasIndex) {
    return '生成的文件中缺少 index.html，请重试';
  }
  return null;
}

export function extractPlanContent(content: string): string {
  return content.trim();
}
