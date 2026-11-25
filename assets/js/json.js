/* ============================================================
   JSON 格式化 / 压缩 / 键名排序
   不做「猜测式修复」：解析不过就报错，不硬掰结果
   ============================================================ */

import { toast, copyText, download, esc } from './common.js';
import { t } from './i18n.js';

const $ = id => document.getElementById(id);

const input = $('input');
const output = $('output');
const outLabel = $('outLabel');
const errBox = $('err');
const warnBox = $('warn');
const stats = $('stats');

const SAMPLE = '{"name":"PixKit","version":"1.0.0","tags":["json","formatter"],"config":{"theme":"light","autoSave":true,"maxSize":2048},"users":[{"id":1,"name":"Ada"},{"id":2,"name":"Linus"}]}';

const state = { mode: 'pretty', indent: '2', sort: 'none', text: '' };

let timer = null;

/* ---------------- 排序 ---------------- */

function cmp(a, b, dir) {
  if (a === b) return 0;
  const r = a < b ? -1 : 1;
  return dir === 'desc' ? -r : r;
}

function sortDeep(v, dir) {
  if (Array.isArray(v)) return v.map(x => sortDeep(x, dir));
  if (v && typeof v === 'object') {
    const keys = Object.keys(v).sort((a, b) => cmp(a, b, dir));
    const out = {};
    for (const k of keys) out[k] = sortDeep(v[k], dir);
    return out;
  }
  return v;
}

/* ---------------- 结构统计 ---------------- */

function survey(root) {
  let keys = 0;
  let items = 0;
  let depth = 0;

  const walk = (n, d) => {
    if (d > depth) depth = d;
    if (Array.isArray(n)) {
      items += n.length;
      for (const x of n) walk(x, d + 1);
    } else if (n && typeof n === 'object') {
      const ks = Object.keys(n);
      keys += ks.length;
      for (const k of ks) walk(n[k], d + 1);
    }
  };

  walk(root, 1);
  return { keys, items, depth };
}

/* ---------------- 大整数精度检测 ---------------- */

/**
 * 扫描源码，找出不在字符串里的超长整数。
 * 为什么要自己扫：JSON.parse 之后数字已经被四舍五入，从结果里看不出来了。
 */
function findLongNumbers(text) {
  const hits = [];
  let inStr = false;
  let esc = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];

    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      i++;
      continue;
    }

    if (c === '"') { inStr = true; i++; continue; }

    if (c === '-' || (c >= '0' && c <= '9')) {
      const start = i;
      let j = i + (c === '-' ? 1 : 0);
      let digits = 0;
      while (j < text.length && text[j] >= '0' && text[j] <= '9') { digits++; j++; }
      if (digits > 15) hits.push(text.slice(start, j));
      i = j;
      continue;
    }

    i++;
  }

  return hits;
}

/* ---------------- 错误定位 ---------------- */

function locate(e, text) {
  const msg = String(e.message || '');
  const m = /position\s+(\d+)/i.exec(msg);
  if (!m) return { message: msg, line: 0, col: 0, snippet: '', caret: 0 };

  const pos = Math.min(+m[1], text.length);
  const upTo = text.slice(0, pos);
  const line = upTo.split('\n').length;
  const lineStart = upTo.lastIndexOf('\n') + 1;
  const col = pos - lineStart + 1;

  const end = text.indexOf('\n', pos);
  const full = text.slice(lineStart, end === -1 ? text.length : end);

  let snippet = full;
  let caret = col - 1;
  const MAX = 92;

  if (full.length > MAX) {
    const start = Math.max(0, caret - 40);
    snippet = (start > 0 ? '…' : '') + full.slice(start, start + MAX);
    caret = caret - start + (start > 0 ? 1 : 0);
  }

  return { message: msg, line, col, snippet, caret };
}

/** 把 V8 的英文报错压成一句人话；没命中就原样返回 */
function brief(msg) {
  if (/Unexpected end of JSON input/i.test(msg)) return t('内容意外结束了：可能有括号没闭合，或者复制时被截断了。');
  if (/Expected double-quoted property name/i.test(msg)) return t('这里应该是带双引号的键名。');
  if (/Expected property name or '\}'/i.test(msg)) return t('这里应该是一个键名，或者右花括号。');
  if (/Expected ',' or '\}'/i.test(msg)) return t('这里缺少逗号，或者多了不该有的符号。');
  if (/Expected ',' or '\]'/i.test(msg)) return t('这里缺少逗号，或者多了不该有的符号。');
  const tok = /Unexpected token '?([^'\s]+)'?/i.exec(msg);
  if (tok) return t('出现了意料之外的符号 {token}。', { token: `"${tok[1]}"` });
  if (/Unexpected non-whitespace character after JSON/i.test(msg)) {
    return t('合法 JSON 已经结束了，后面还有多余内容。');
  }
  return msg;
}

/** 常见手写错误的具体建议 */
function hints(text) {
  const out = [];

  if (/\/\/[^\n]*/.test(text) || /\/\*/.test(text)) {
    out.push(['JSON 不支持注释', '删掉 // 和 /* */ 部分，JSON 只认纯数据。']);
  }
  if (/,\s*[}\]]/.test(text)) {
    out.push(['有多余的尾逗号', '最后一个成员后面不能加逗号，这是 JS 对象和 JSON 最常见的差别。']);
  }
  if (/(^|[{,]\s*)'[^'\n]*'\s*:/.test(text)) {
    out.push(['键名用了单引号', 'JSON 的键和字符串都必须用双引号。']);
  }
  if (/(^|[{,]\s*)[A-Za-z_$][\w$]*\s*:/.test(text)) {
    out.push(['键名没有加引号', 'JSON 的键必须用双引号包起来。']);
  }
  if (/[\u2018\u2019\u201c\u201d]/.test(text)) {
    out.push(['用了中文引号', '把 “ ” 或 ‘ ’ 换成英文的双引号 "。']);
  }

  return out.slice(0, 2);
}

/* ---------------- 渲染 ---------------- */

function clearPane() {
  output.textContent = '';
  state.text = '';
  stats.innerHTML = '';
  outLabel.textContent = state.mode === 'minify' ? t('压缩结果') : t('格式化结果');
}

function showError(e, text) {
  const info = locate(e, text);
  const hs = hints(text);

  const where = info.line
    ? ` · ${t('第 {line} 行 第 {col} 列', { line: info.line, col: info.col })}`
    : '';

  errBox.innerHTML =
    `<span class="err-box__title">${t('JSON 语法错误')}${where}</span>` +
    (info.snippet
      ? `<pre class="err-snip">${esc(info.snippet)}\n${' '.repeat(Math.max(0, info.caret))}^</pre>`
      : '') +
    `<div style="margin-top:8px">${esc(brief(info.message))}</div>` +
    hs.map(([title, hint]) =>
      `<div class="err-box__hint"><strong>${esc(t(title))}</strong> ${esc(t(hint))}</div>`
    ).join('');

  errBox.classList.remove('hidden');
}

function render() {
  const raw = input.value;
  errBox.classList.add('hidden');
  warnBox.classList.add('hidden');

  if (!raw.trim()) { clearPane(); return; }

  let value;
  try {
    value = JSON.parse(raw);
  } catch (e) {
    clearPane();
    showError(e, raw);
    return;
  }

  const data = state.sort === 'none' ? value : sortDeep(value, state.sort);
  const indent = state.mode === 'minify'
    ? 0
    : (state.indent === 'tab' ? '\t' : Number(state.indent));

  const text = JSON.stringify(data, null, indent);
  output.textContent = text;
  state.text = text;
  outLabel.textContent = state.mode === 'minify' ? t('压缩结果') : t('格式化结果');

  const s = survey(data);
  const inLen = raw.length;
  const outLen = text.length;
  const delta = inLen > 0 ? Math.round(((outLen - inLen) / inLen) * 100) : 0;

  const cells = [
    [t('输入'), `${inLen.toLocaleString()}`],
    [t('输出'), `${outLen.toLocaleString()}`],
    [t('体积变化'), `${delta > 0 ? '+' : ''}${delta}%`],
    [t('层级'), `${s.depth}`],
    [t('键'), `${s.keys}`],
    [t('数组元素'), `${s.items}`],
  ];

  stats.innerHTML = cells
    .map(([k, v]) => `<div class="stat">${esc(k)} <strong>${esc(v)}</strong></div>`)
    .join('');

  const longs = findLongNumbers(raw);
  if (longs.length) {
    const sample = longs[0];
    let rounded = sample;
    try { rounded = String(JSON.parse(sample)); } catch { /* 保持原样 */ }
    warnBox.innerHTML =
      `<strong>${t('大整数精度警告')}</strong> ` +
      esc(t('检测到 {n} 个超过 15 位的整数，JSON.parse 会丢精度：{a} 会变成 {b}。这类数据建议让后端以字符串返回。', {
        n: longs.length, a: sample, b: rounded,
      }));
    warnBox.classList.remove('hidden');
  }
}

function scheduleRender() {
  clearTimeout(timer);
  timer = setTimeout(render, 240);
}

/* ---------------- 选项 ---------------- */

$('modeTabs').addEventListener('click', e => {
  const tab = e.target.closest('.fmt-tab');
  if (!tab) return;
  state.mode = tab.dataset.mode;
  document.querySelectorAll('#modeTabs .fmt-tab').forEach(b => {
    b.classList.toggle('is-active', b.dataset.mode === state.mode);
  });
  render();
});

$('indentSel').addEventListener('change', e => {
  state.indent = e.target.value;
  render();
});

$('sortSel').addEventListener('change', e => {
  state.sort = e.target.value;
  render();
});

/* ---------------- 输入框操作 ---------------- */

input.addEventListener('input', scheduleRender);

$('sampleBtn').addEventListener('click', () => {
  input.value = SAMPLE;
  render();
});

$('pasteBtn').addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) { toast('剪贴板是空的'); return; }
    input.value = text;
    render();
  } catch {
    toast('浏览器没给剪贴板权限，请手动 Ctrl+V 粘贴');
  }
});

$('clearBtn').addEventListener('click', () => {
  input.value = '';
  errBox.classList.add('hidden');
  warnBox.classList.add('hidden');
  clearPane();
  input.focus();
});

/* ---------------- 输出操作 ---------------- */

$('copyBtn').addEventListener('click', async () => {
  if (!state.text) { toast('还没有可以复制的内容'); return; }
  const ok = await copyText(state.text);
  const btn = $('copyBtn');
  if (!ok) { toast('复制失败，请手动选中复制'); return; }
  btn.textContent = t('已复制');
  btn.classList.add('is-done');
  setTimeout(() => {
    btn.textContent = t('复制');
    btn.classList.remove('is-done');
  }, 1400);
});

$('dlBtn').addEventListener('click', () => {
  if (!state.text) { toast('还没有可以下载的内容'); return; }
  const name = state.mode === 'minify' ? 'minified.json' : 'formatted.json';
  download(new Blob([state.text], { type: 'application/json;charset=utf-8' }), name);
});

/* 切语言后标签要跟着变 */
window.addEventListener('pixkit:langchange', () => {
  if (input.value.trim()) render();
  else clearPane();
});
