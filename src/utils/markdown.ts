import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

const AUTO_DETECT_LANGS = [
  'html',
  'css',
  'javascript',
  'typescript',
  'json',
  'xml',
  'markdown',
  'python',
  'bash',
];

const EXT_TO_LANG: Record<string, string> = {
  html: 'html',
  htm: 'html',
  css: 'css',
  js: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  json: 'json',
  md: 'markdown',
  vue: 'xml',
};

function normalizeLang(lang: string): { hljsLang: string; label: string } {
  const raw = lang.trim();
  const lower = raw.toLowerCase();

  if (lower.startsWith('file:')) {
    const filename = raw.slice(5).trim();
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return {
      hljsLang: EXT_TO_LANG[ext] || '',
      label: filename || raw,
    };
  }

  return { hljsLang: lower, label: raw };
}

function highlightCode(str: string, lang: string): { html: string; label: string } {
  const { hljsLang, label } = normalizeLang(lang);

  if (hljsLang && hljs.getLanguage(hljsLang)) {
    const html = hljs.highlight(str, { language: hljsLang, ignoreIllegals: true }).value;
    return { html, label: label || hljsLang };
  }

  const auto = hljs.highlightAuto(str, AUTO_DETECT_LANGS);
  return {
    html: auto.value,
    label: auto.language || label || 'code',
  };
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string) {
    try {
      const { html, label } = highlightCode(str, lang);
      return `<div class="code-block-header"><span>${label}</span><button class="copy-btn" onclick="navigator.clipboard.writeText(this.closest('pre').querySelector('code').textContent)">复制</button></div><pre class="hljs"><code class="hljs">${html}</code></pre>`;
    } catch {
      const escaped = md.utils.escapeHtml(str);
      return `<pre class="hljs"><code class="hljs">${escaped}</code></pre>`;
    }
  },
});

export function renderMarkdown(content: string): string {
  return md.render(content);
}
