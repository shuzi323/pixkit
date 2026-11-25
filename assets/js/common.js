/* ============================================================
   PixKit — 公共工具库（零依赖）
   ============================================================ */

/* ---------- 字节格式化 ---------- */

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return v.toFixed(v < 10 ? 1 : 0) + ' ' + units[i];
}

/* ---------- Toast ---------- */

let toastEl = null;
let toastTimer = null;

export function toast(msg, ms = 2200) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), ms);
}

/* ---------- 下载 ---------- */

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- 复制到剪贴板 ---------- */

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 非 HTTPS 环境或旧浏览器兜底
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

/* ---------- HTML 转义 ---------- */

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ---------- 文件名处理 ---------- */

export function baseName(name) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(0, i) : name;
}

export function extName(name) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toLowerCase() : '';
}

/** 生成不重复的文件名 */
export function uniqueName(used, name) {
  if (!used.has(name)) { used.add(name); return name; }
  const base = baseName(name);
  const ext = extName(name);
  let n = 2;
  let candidate;
  do {
    candidate = `${base} (${n})${ext ? '.' + ext : ''}`;
    n++;
  } while (used.has(candidate));
  used.add(candidate);
  return candidate;
}

/* ============================================================
   ZipWriter — 极简 ZIP 打包（store 模式，无压缩）
   图片本身已是压缩格式，再做 deflate 收益接近零，
   直接用 store 模式可以做到瞬间完成，且零依赖。
   ============================================================ */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function dosDateTime(d = new Date()) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = (((d.getFullYear() - 1980) & 0x7F) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

export class ZipWriter {
  constructor() {
    this.entries = [];
  }

  /** @param {string} name @param {Uint8Array} data */
  add(name, data) {
    this.entries.push({ name, data });
  }

  get count() { return this.entries.length; }

  build() {
    const enc = new TextEncoder();
    const { time, date } = dosDateTime();
    const parts = [];
    const central = [];
    let offset = 0;

    for (const { name, data } of this.entries) {
      const nameBytes = enc.encode(name);
      const crc = crc32(data);

      const lh = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true);   // local file header signature
      lv.setUint16(4, 20, true);           // version needed
      lv.setUint16(6, 0x0800, true);       // flags: UTF-8 filename
      lv.setUint16(8, 0, true);            // method: store
      lv.setUint16(10, time, true);
      lv.setUint16(12, date, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.length, true); // compressed size
      lv.setUint32(22, data.length, true); // uncompressed size
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      lh.set(nameBytes, 30);

      parts.push(lh, data);

      const ch = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true);   // central dir signature
      cv.setUint16(4, 20, true);           // version made by
      cv.setUint16(6, 20, true);           // version needed
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, time, true);
      cv.setUint16(14, date, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);           // extra len
      cv.setUint16(32, 0, true);           // comment len
      cv.setUint16(34, 0, true);           // disk number
      cv.setUint16(36, 0, true);           // internal attrs
      cv.setUint32(38, 0, true);           // external attrs
      cv.setUint32(42, offset, true);      // local header offset
      ch.set(nameBytes, 46);

      central.push(ch);
      offset += lh.length + data.length;
    }

    const centralSize = central.reduce((s, c) => s + c.length, 0);

    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, this.entries.length, true);
    ev.setUint16(10, this.entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    return new Blob([...parts, ...central, eocd], { type: 'application/zip' });
  }
}

/* ---------- 图片解码 ---------- */

const HEIC_EXT = ['heic', 'heif'];
const DECODABLE = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'ico'];

/**
 * 解码图片文件为 ImageBitmap
 * @returns {Promise<ImageBitmap>}
 */
export async function decodeImage(file) {
  const ext = extName(file.name) || extName(file.type.replace('/', '.'));
  if (HEIC_EXT.includes(ext)) {
    throw new Error('HEIC_UNSUPPORTED');
  }
  if (!DECODABLE.includes(ext) && !file.type.startsWith('image/')) {
    throw new Error('NOT_IMAGE');
  }
  try {
    return await createImageBitmap(file);
  } catch (e) {
    // 兜底：用 <img> 解码（某些旧浏览器对某些格式支持不同）
    return await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        createImageBitmap(img).then(resolve, reject);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('DECODE_FAILED'));
      };
      img.src = url;
    });
  }
}

/* ---------- Canvas 编码 ---------- */

export function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(w, h);
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function canvasToBlob(canvas, type, quality) {
  if (canvas.convertToBlob) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('ENCODE_FAILED')), type, quality);
  });
}

/** 检测浏览器是否支持某种输出格式 */
const supportCache = new Map();
export async function canEncode(mime) {
  if (supportCache.has(mime)) return supportCache.get(mime);
  let ok = false;
  try {
    const c = makeCanvas(2, 2);
    // OffscreenCanvas 需要先有渲染上下文才能 convertToBlob
    const ctx = c.getContext('2d');
    if (ctx) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 2, 2); }
    const blob = await canvasToBlob(c, mime, 0.9);
    ok = !!blob && blob.type === mime;
    c.width = 0; c.height = 0;
  } catch { ok = false; }
  supportCache.set(mime, ok);
  return ok;
}
