/* ============================================================
   Base64 转图片
   核心能力：不依赖 data: 前缀，靠字节魔数识别真实格式
   ============================================================ */

import { formatBytes, toast, download } from './common.js';
import { t } from './i18n.js';

const $ = id => document.getElementById(id);

const input = $('input');
const errBox = $('err');
const stats = $('stats');
const empty = $('empty');
const out = $('out');
const thumb = $('thumb');
const meta = $('meta');
const dlBtn = $('dlBtn');

/* 32×32 的示例图（105 字节），用来让用户先看到效果 */
const SAMPLE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAMElEQVR42mP4T2PAMIws8Hd7SkU0asGoBaMWjFowasGoBaMWjFowasHAWTDa+MUBAC1T9n41EJbwAAAAAElFTkSuQmCC';

const EXT_BY_MIME = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
  'image/webp': 'webp', 'image/bmp': 'bmp', 'image/avif': 'avif',
  'image/heic': 'heic', 'image/svg+xml': 'svg', 'image/x-icon': 'ico',
};

let state = {
  blob: null,
  url: '',
  ext: '',
  mime: '',
  bytes: 0,
  chars: 0,
  w: 0,
  h: 0,
};

let seq = 0;          // 防止慢加载的旧结果覆盖新结果
let timer = null;

/* ---------------- 解码 ---------------- */

/** 把一段字符串还原成字节 + 声明的 MIME */
function decodeInput(raw) {
  // 去掉包裹它们的引号 / 反引号，这在从代码里复制时很常见
  let s = raw.trim().replace(/^[`'"]+|[`'"]+$/g, '').trim();

  let declared = '';
  let base64 = true;

  const m = /^data:([^,]*),([\s\S]*)$/i.exec(s);
  if (m) {
    const head = m[1];
    declared = (head.split(';')[0] || '').trim().toLowerCase();
    base64 = /;\s*base64/i.test(head);
    s = m[2];
  }

  // data:image/svg+xml,<svg ...> 这种是 URL 编码的文本，不是 Base64
  if (!base64) {
    let body = s;
    try { body = decodeURIComponent(s); } catch { /* 保持原样 */ }
    return { bytes: new TextEncoder().encode(body), declared };
  }

  s = s.replace(/\s+/g, '');
  // URL-safe 变体（JWT、部分后端 SDK 会输出 - 和 _）
  s = s.replace(/-/g, '+').replace(/_/g, '/');

  const rem = s.length % 4;
  if (rem === 1) throw new Error('LENGTH');
  if (rem) s += '='.repeat(4 - rem);

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(s)) throw new Error('CHARS');

  let bin;
  try { bin = atob(s); } catch { throw new Error('CHARS'); }
  if (!bin.length) throw new Error('EMPTY');

  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, declared };
}

/** 读字节头判断真实格式。识别不出返回 null。 */
function sniff(bytes) {
  const b = bytes;

  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) {
    return { ext: 'gif', mime: 'image/gif' };
  }
  if (b.length >= 12 &&
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d) {
    return { ext: 'bmp', mime: 'image/bmp' };
  }
  if (b.length >= 4 && b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) {
    return { ext: 'ico', mime: 'image/x-icon' };
  }
  // AVIF / HEIC：第 4 字节起是 ftyp，跟着 4 字节 brand
  if (b.length >= 12 &&
      b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (/^avi[fs]$/.test(brand)) return { ext: 'avif', mime: 'image/avif' };
    if (/^(heic|heix|hevc|mif1|msf1)$/.test(brand)) return { ext: 'heic', mime: 'image/heic' };
  }
  // SVG 是文本，看开头
  const head = new TextDecoder().decode(b.slice(0, 400)).trim().toLowerCase();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
    return { ext: 'svg', mime: 'image/svg+xml' };
  }

  return null;
}

/* ---------------- 渲染 ---------------- */

function clearResult() {
  if (state.url) URL.revokeObjectURL(state.url);
  state.blob = null;
  state.url = '';
  out.classList.add('hidden');
  empty.classList.remove('hidden');
  thumb.removeAttribute('src');
  stats.innerHTML = '';
  meta.innerHTML = '';
}

function showError(code) {
  clearResult();

  const MSG = {
    LENGTH: ['长度不合法', 'Base64 的字符数必须是 4 的倍数，这段字符串可能被截断了。'],
    CHARS: ['不是有效的 Base64', '内容里含有 Base64 字符集以外的符号。如果外面包了引号或 HTML 标签，先去掉。'],
    EMPTY: ['内容是空的', '解码出来是 0 字节，检查一下有没有粘全。'],
    NOT_IMAGE: ['解出来了，但不是图片', '字节还原成功，但浏览器无法识别它的图片格式。可能这段数据本身不是图片，或者格式太冷门。'],
  };
  const [title, hint] = MSG[code] || MSG.CHARS;

  errBox.innerHTML =
    `<span class="err-box__title">${t(title)}</span>` +
    `<span>${t(hint)}</span>`;
  errBox.classList.remove('hidden');
}

function renderMeta() {
  const dim = state.w && state.h ? `${state.w} × ${state.h}` : '—';
  const rows = [
    [t('格式'), state.ext ? state.ext.toUpperCase() : '—'],
    [t('尺寸'), dim],
    [t('文件大小'), formatBytes(state.bytes)],
    [t('字符串长度'), state.chars.toLocaleString()],
  ];
  meta.innerHTML = rows
    .map(([k, v]) => `<div class="stat">${k} <strong>${v}</strong></div>`)
    .join('');
}

function run() {
  const raw = input.value.trim();
  errBox.classList.add('hidden');

  if (!raw) {
    clearResult();
    return;
  }

  let bytes, declared;
  try {
    ({ bytes, declared } = decodeInput(raw));
  } catch (e) {
    showError(e.message);
    return;
  }

  const info = sniff(bytes) || (declared && EXT_BY_MIME[declared]
    ? { ext: EXT_BY_MIME[declared], mime: declared }
    : null);

  if (!info) {
    showError('NOT_IMAGE');
    return;
  }

  const my = ++seq;
  const blob = new Blob([bytes], { type: info.mime });
  const url = URL.createObjectURL(blob);

  thumb.onload = () => {
    if (my !== seq) { URL.revokeObjectURL(url); return; }
    if (state.url) URL.revokeObjectURL(state.url);
    state = {
      blob, url, ext: info.ext, mime: info.mime,
      bytes: bytes.length, chars: raw.replace(/\s+/g, '').length,
      w: thumb.naturalWidth, h: thumb.naturalHeight,
    };
    empty.classList.add('hidden');
    out.classList.remove('hidden');
    renderMeta();
  };

  thumb.onerror = () => {
    if (my !== seq) { URL.revokeObjectURL(url); return; }
    URL.revokeObjectURL(url);
    showError('NOT_IMAGE');
  };

  thumb.src = url;
}

/* ---------------- 交互 ---------------- */

input.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(run, 240);
});

$('sampleBtn').addEventListener('click', () => {
  input.value = SAMPLE;
  run();
});

$('pasteBtn').addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) { toast('剪贴板是空的'); return; }
    input.value = text;
    run();
  } catch {
    toast('浏览器没给剪贴板权限，请手动 Ctrl+V 粘贴');
  }
});

$('clearBtn').addEventListener('click', () => {
  input.value = '';
  errBox.classList.add('hidden');
  clearResult();
  input.focus();
});

dlBtn.addEventListener('click', () => {
  if (!state.blob) return;
  download(state.blob, `base64-image.${state.ext || 'bin'}`);
});

/* 把文本文件拖进来也能用（很多后台导出的就是 .txt） */
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', async e => {
  const f = e.dataTransfer?.files?.[0];
  if (!f) return;
  e.preventDefault();
  if (f.size > 8 * 1024 * 1024) { toast('文件超过 8MB，建议拆小一点再试'); return; }
  input.value = await f.text();
  run();
});
