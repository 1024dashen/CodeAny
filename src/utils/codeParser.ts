import type { ProjectFile } from '@/types';

// ```file:path 或 ```file: path（允许冒号后空格）
const FILE_BLOCK_RE = /```file:\s*([^\n\r`]+)\r?\n([\s\S]*?)```/gi;

const LANG_BLOCK_RE = /```(html|css|javascript|js)\r?\n([\s\S]*?)```/gi;

const LANG_TO_PATH: Record<string, string> = {
  html: 'index.html',
  css: 'styles.css',
  javascript: 'app.js',
  js: 'app.js',
};

function normalizePath(raw: string): string {
  return raw.trim().replace(/^\/+/, '').replace(/\\/g, '/');
}

function isHtmlPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith('.html') || lower.endsWith('.htm');
}

function addFile(
  files: Map<string, string>,
  path: string,
  content: string,
  preferExisting = false,
): void {
  const normalized = normalizePath(path);
  if (!normalized) return;
  const trimmedContent = content.replace(/\n$/, '');
  if (preferExisting && files.has(normalized)) return;
  files.set(normalized, trimmedContent);
}

export function parseProjectFiles(content: string): ProjectFile[] {
  const fileMap = new Map<string, string>();

  let match: RegExpExecArray | null;

  FILE_BLOCK_RE.lastIndex = 0;
  while ((match = FILE_BLOCK_RE.exec(content)) !== null) {
    addFile(fileMap, match[1], match[2]);
  }

  LANG_BLOCK_RE.lastIndex = 0;
  while ((match = LANG_BLOCK_RE.exec(content)) !== null) {
    const lang = match[1].toLowerCase();
    const path = LANG_TO_PATH[lang] || `file.${lang}`;
    addFile(fileMap, path, match[2], true);
  }

  return Array.from(fileMap.entries()).map(([path, fileContent]) => ({
    path,
    content: fileContent,
  }));
}

export function validateProjectFiles(files: ProjectFile[]): string | null {
  if (files.length === 0) {
    return '未能从 AI 回复中解析出任何文件，请重试';
  }

  const htmlFiles = files.filter(f => isHtmlPath(normalizePath(f.path)));
  if (htmlFiles.length === 0) {
    return '生成的文件中缺少 HTML 页面，请重试';
  }

  for (const htmlFile of htmlFiles) {
    if (hasInlineAssets(htmlFile.content)) {
      return `${htmlFile.path} 中检测到内联 <style> 或 <script>，请将样式和脚本拆分到独立文件后重试`;
    }
  }

  return null;
}

function hasInlineAssets(html: string): boolean {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const hasInlineStyle = /<style[\s>]/i.test(withoutComments);
  const hasInlineScript = /<script(?![^>]*\bsrc\s*=)[^>]*>[\s\S]*?<\/script>/i.test(
    withoutComments,
  );
  return hasInlineStyle || hasInlineScript;
}

export function extractPlanContent(content: string): string {
  return content.trim();
}
