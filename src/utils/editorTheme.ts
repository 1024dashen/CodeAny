/**
 * CodeMirror 6 - Atom One Dark 主题
 * 配色与聊天框中 highlight.js atom-one-dark 保持一致
 *
 * base:    #282c34
 * mono-1:  #abb2bf  (默认文字)
 * mono-2:  #818896
 * mono-3:  #5c6370  (注释)
 * hue-1:   #56b6c2  (literal / cyan)
 * hue-2:   #61aeee  (link / blue)
 * hue-3:   #c678dd  (keyword / purple)
 * hue-4:   #98c379  (string / green)
 * hue-5:   #e06c75  (name / red)
 * hue-5-2: #be5046
 * hue-6:   #d19a66  (number / orange)
 * hue-6-2: #e6c07b  (built_in / yellow)
 */

import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// ── 编辑器 UI 主题 ────────────────────────────────────────────────────────────
export const atomOneDarkTheme = EditorView.theme(
  {
    '&': {
      color: '#abb2bf',
      backgroundColor: '#282c34',
    },
    '.cm-content': {
      caretColor: '#528bff',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#528bff',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: '#3e4451',
    },
    '.cm-panels': {
      backgroundColor: '#21252b',
      color: '#abb2bf',
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: '2px solid #181a1f',
    },
    '.cm-panels.cm-panels-bottom': {
      borderTop: '2px solid #181a1f',
    },
    '.cm-searchMatch': {
      backgroundColor: '#72a1ff59',
      outline: '1px solid #457dff',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#6199ff2f',
    },
    '.cm-activeLine': {
      backgroundColor: '#2c313c',
    },
    '.cm-selectionMatch': {
      backgroundColor: '#aafe661a',
    },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: '#bad0f847',
    },
    '.cm-gutters': {
      backgroundColor: '#282c34',
      color: '#4b5263',
      border: 'none',
      borderRight: '1px solid #3e4451',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#2c313c',
      color: '#abb2bf',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#ddd',
    },
    '.cm-tooltip': {
      border: 'none',
      backgroundColor: '#21252b',
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: '#21252b',
      borderBottomColor: '#21252b',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#2c313c',
        color: '#abb2bf',
      },
    },
  },
  { dark: true },
);

// ── 语法高亮配色（与 hljs atom-one-dark 对齐）────────────────────────────────
export const atomOneDarkHighlightStyle = HighlightStyle.define([
  // 注释
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#5c6370', fontStyle: 'italic' },

  // 关键字 / 修饰符
  { tag: [t.keyword, t.modifier, t.operatorKeyword, t.definitionKeyword], color: '#c678dd' },

  // 字符串 / 正则 / 属性值
  { tag: [t.string, t.regexp, t.special(t.string)], color: '#98c379' },

  // 数字 / 布尔 / null / 变量 / 模板变量 / 类型名
  { tag: [t.number, t.bool, t.null, t.variableName, t.typeName, t.className], color: '#d19a66' },

  // 内置 / 标准类名
  { tag: [t.standard(t.name), t.standard(t.variableName)], color: '#e6c07b' },

  // 函数名 / 宏名
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName], color: '#61aeee' },

  // 属性名
  { tag: [t.propertyName, t.attributeName], color: '#d19a66' },

  // 标签名（HTML/XML）
  { tag: [t.tagName, t.angleBracket], color: '#e06c75' },

  // 操作符
  { tag: [t.operator, t.punctuation, t.separator], color: '#abb2bf' },

  // 字面量（true/false/null 等）
  { tag: t.literal, color: '#56b6c2' },

  // URL / 链接
  { tag: [t.url, t.link], color: '#61aeee', textDecoration: 'underline' },

  // 标题
  { tag: t.heading, color: '#e06c75', fontWeight: 'bold' },

  // 强调 / 加粗
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },

  // 删除 / 插入
  { tag: t.deleted, color: '#e06c75' },
  { tag: t.inserted, color: '#98c379' },

  // 元信息（import/export 等）
  { tag: t.meta, color: '#61aeee' },

  // 无效语法
  { tag: t.invalid, color: '#ffffff', backgroundColor: '#e06c75' },
]);

// ── 导出组合好的扩展数组 ─────────────────────────────────────────────────────
export const atomOneDark = [
  atomOneDarkTheme,
  syntaxHighlighting(atomOneDarkHighlightStyle),
];
