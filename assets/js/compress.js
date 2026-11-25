/* ============================================================
   图片批量压缩
   ============================================================ */

import {
  formatBytes, toast, download, esc, baseName, extName, uniqueName,
  ZipWriter, decodeImage, makeCanvas, canvasToBlob, canEncode
} from './common.js';
import { t } from './i18n.js';

/* ---------------- 元素 ---------------- */

const $ = id => document.getElementById(id);

const dropzone = $('dropzone');
const fileInput = $('fileInput');
const panel = $('panel');
const results = $('results');
const fileList = $('fileList');
const summary = $('summary');
const zipBtn = $('zipBtn');
const clearBtn = $('clearBtn');

const modeSel = $('mode');
const qualityField = $('qualityField');
const qualityInput = $('quality');
const qualityVal = $('qualityVal');
const targetField = $('targetField');
const targetInput = $('targetSize');
const targetChips = $('targetChips');
const formatSel = $('format');
const edgeInput = $('maxEdge');
const edgeVal = $('edgeVal');

/* ---------------- 状态 ---------------- */

let uid = 0;

const state = {
  items: [],          // { id, file, name, size, status, bitmap, result, url, el, error }
  // 初始值从页面控件读取，这样同一个引擎可以用在不同工具页
  mode: modeSel.value,
  quality: +qualityInput.value,
  targetKB: +targetInput.value,
  format: formatSel.value,
  maxEdge: +edgeInput.value,
  running: false,
  dirty: false,       // 处理中参数又变了
};

const MAX_BITMAP_CACHE = 40;   // 最多缓存多少张解码后的位图
const CONCURRENCY = 3;

/* ---------------- 尺寸计算 ---------------- */

function fitSize(w, h, maxEdge) {
  if (!maxEdge || (w <= maxEdge && h <= maxEdge)) return { w, h };
  const s = maxEdge / Math.max(w, h);
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
}

/* ---------------- 输出格式选择 ---------------- */

async function pickType(item) {
  const f = state.format;
  if (f !== 'auto') return f;

  const src = (extName(item.file.name) || '').toLowerCase();
  const hasAlphaLike = ['png', 'gif', 'webp'].includes(src) || item.file.type === 'image/png';
  if (hasAlphaLike) {
    return (await canEncode('image/webp')) ? 'image/webp' : 'image/png';
  }
  return 'image/jpeg';
}

function extForType(type) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }[type] || 'jpg';
}

/* ---------------- 压缩单张 ---------------- */

async function compressToTarget(canvas, type, targetBytes) {
  // 无损格式无法通过质量调节体积
  if (type === 'image/png') {
    const blob = await canvasToBlob(canvas, type);
    return { blob, quality: 1 };
  }

  // 快速路径：最高质量已经达标，直接返回
  const top = await canvasToBlob(canvas, type, 0.95);
  if (top.size <= targetBytes) return { blob: top, quality: 0.95 };

  let lo = 0.02, hi = 0.95, best = null;
  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2;
    const blob = await canvasToBlob(canvas, type, mid);
    if (blob.size <= targetBytes) {
      best = { blob, quality: mid };
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo < 0.03) break;
  }

  if (!best) {
    // 最低画质仍超标 —— 返回最低画质结果并标记
    const blob = await canvasToBlob(canvas, type, 0.02);
    return { blob, quality: 0.02, overflow: true };
  }
  return best;
}

async function renderOne(item) {
  const bmp = item.bitmap;
  const { w, h } = fitSize(bmp.width, bmp.height, state.maxEdge);
  const type = await pickType(item);

  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d', { alpha: type !== 'image/jpeg' });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // JPEG 不支持透明，先铺白底，否则透明区域会变黑
  if (type === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.drawImage(bmp, 0, 0, w, h);

  let out;
  if (state.mode === 'target') {
    out = await compressToTarget(canvas, type, state.targetKB * 1024);
  } else {
    const q = state.quality / 100;
    out = { blob: await canvasToBlob(canvas, type, q), quality: q };
  }

  canvas.width = 0;
  canvas.height = 0;

  let blob = out.blob;

  // 重新编码反而更大时：格式没变、或用户选了「自动」，都退回原文件
  const autoMode = state.format === 'auto';
  const sameType = type === item.file.type ||
    (type === 'image/jpeg' && /jpe?g/.test(item.file.type));
  const unchangedSize = w === bmp.width && h === bmp.height;
  if (blob.size >= item.file.size && unchangedSize && (sameType || autoMode)) {
    blob = item.file;
    out.quality = 1;
    out.keptOriginal = true;
  }

  return {
    blob,
    width: w,
    height: h,
    quality: out.quality,
    overflow: out.overflow,
    keptOriginal: out.keptOriginal,
    type: blob.type || type,
  };
}

async function processItem(item) {
  if (item.status === 'working') return;
  item.status = 'working';
  item.error = null;
  paintRow(item);

  try {
    if (!item.bitmap) {
      item.bitmap = await decodeImage(item.file);
      trimBitmapCache();
    }
    item.result = await renderOne(item);

    if (item.url) URL.revokeObjectURL(item.url);
    item.url = URL.createObjectURL(item.result.blob);
    item.status = 'done';
  } catch (e) {
    item.status = 'error';
    item.error = e.message === 'HEIC_UNSUPPORTED'
      ? 'HEIC 格式暂不支持，请先转换为 JPG'
      : e.message === 'NOT_IMAGE'
        ? '不是有效的图片文件'
        : '处理失败';
  }
  paintRow(item);
}

/* 控制内存：位图缓存超限时释放较早的 */
function trimBitmapCache() {
  const withBitmap = state.items.filter(i => i.bitmap);
  while (withBitmap.length > MAX_BITMAP_CACHE) {
    const victim = withBitmap.shift();
    victim.bitmap.close?.();
    victim.bitmap = null;
  }
}

/* ---------------- 队列 ---------------- */

async function runPool(tasks, limit, fn) {
  let idx = 0;
  const worker = async () => {
    while (idx < tasks.length) {
      const t = tasks[idx++];
      await fn(t);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker)
  );
}

async function processAll() {
  if (state.running) { state.dirty = true; return; }
  state.running = true;

  do {
    state.dirty = false;
    const todo = state.items.filter(i => i.status === 'pending');
    if (todo.length) await runPool(todo, CONCURRENCY, processItem);
    updateSummary();
  } while (state.dirty || state.items.some(i => i.status === 'pending'));

  state.running = false;
  updateSummary();
}

/* 参数改变后重新处理全部 */
async function reprocessAll() {
  if (!state.items.length) return;
  for (const i of state.items) {
    if (i.status === 'done' || i.status === 'error') i.status = 'pending';
  }
  await processAll();
}

/* ---------------- 添加文件 ---------------- */

function addFiles(fileListLike) {
  const files = Array.from(fileListLike).filter(f =>
    f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(f.name)
  );

  if (!files.length) {
    toast('没有找到可识别的图片');
    return;
  }

  const used = new Set(state.items.map(i => i.name));
  for (const file of files) {
    const item = {
      id: ++uid,
      file,
      name: uniqueName(used, file.name),
      size: file.size,
      status: 'pending',
      bitmap: null,
      result: null,
      url: null,
      error: null,
      el: null,
    };
    state.items.push(item);
    mountRow(item);
  }

  panel.classList.remove('hidden');
  results.classList.remove('hidden');
  updateSummary();
  processAll();
}

/* ---------------- 渲染 ---------------- */

function mountRow(item) {
  const row = document.createElement('div');
  row.className = 'file-row';
  row.dataset.id = item.id;
  fileList.appendChild(row);
  item.el = row;
  paintRow(item);
}

function paintRow(item) {
  const row = item.el;
  if (!row) return;

  const thumbSrc = item.url || '';
  const status = item.status;

  let metaHtml;
  if (status === 'done' && item.result) {
    const r = item.result;
    const saved = item.size - r.blob.size;
    const pct = item.size > 0 ? Math.round((saved / item.size) * 100) : 0;
    const saveText = saved > 0
      ? `<span class="badge-save">−${pct}%</span>`
      : `<span style="color:var(--warn)">+${Math.abs(pct)}%</span>`;
    metaHtml = `
      <span class="dim">${formatBytes(item.size)}</span>
      <span class="arrow">→</span>
      <span class="new">${formatBytes(r.blob.size)}</span>
      ${saveText}
      <span class="dim">${r.width}×${r.height}</span>
      ${r.keptOriginal ? '<span class="dim">· 保留原图</span>' : ''}
      ${r.overflow ? '<span style="color:var(--warn)">· 未达目标</span>' : ''}
    `;
  } else if (status === 'error') {
    metaHtml = `<span style="color:var(--danger)">${esc(item.error || '失败')}</span>`;
  } else if (status === 'working') {
    metaHtml = `<span class="spinner"></span> <span>处理中…</span>`;
  } else {
    metaHtml = `<span class="dim">${formatBytes(item.size)}</span><span class="dim">排队中</span>`;
  }

  row.innerHTML = `
    ${thumbSrc
      ? `<img class="file-row__thumb" src="${thumbSrc}" alt="">`
      : `<div class="file-row__thumb"></div>`}
    <div class="file-row__main">
      <div class="file-row__name">${esc(item.name)}</div>
      <div class="file-row__meta">${metaHtml}</div>
    </div>
    <div class="results__actions">
      <button class="btn btn--ghost btn--sm" data-act="dl" ${status !== 'done' ? 'disabled' : ''}>下载</button>
    </div>
  `;

  row.querySelector('[data-act="dl"]')?.addEventListener('click', () => {
    if (!item.result) return;
    const ext = extForType(item.result.type);
    const outName = extName(item.name) === ext
      ? item.name
      : `${baseName(item.name)}.${ext}`;
    download(item.result.blob, outName);
  });
}

function updateSummary() {
  const done = state.items.filter(i => i.status === 'done');
  const working = state.items.filter(i => i.status === 'working').length;
  const pending = state.items.filter(i => i.status === 'pending').length;

  if (!done.length) {
    summary.innerHTML = (working || pending)
      ? t('共 {n} 张 · 处理中…', { n: state.items.length })
      : t('共 {n} 张', { n: state.items.length });
    zipBtn.disabled = true;
    return;
  }

  const before = done.reduce((s, i) => s + i.size, 0);
  const after = done.reduce((s, i) => s + i.result.blob.size, 0);
  const savedPct = before > 0 ? Math.round(((before - after) / before) * 100) : 0;

  const busy = working || pending;
  summary.innerHTML = t(
    '已处理 <strong>{d}</strong> / {n} 张 · {b} → <strong>{a}</strong> <span class="save">节省 {p}%</span>',
    {
      d: done.length,
      n: state.items.length,
      b: formatBytes(before),
      a: formatBytes(after),
      p: savedPct,
    }
  ) + (busy ? ' · <span class="spinner"></span>' : '');
  zipBtn.disabled = !!busy || !done.length;
}

// t() 渲染出来的文案是「当前语言」的产物，不归 i18n 的 WeakMap 管，
// 所以切换语言时得自己重渲染一次，否则会停在旧语言上。
window.addEventListener('pixkit:langchange', () => {
  if (state.items.length) updateSummary();
});

/* ---------------- 打包下载 ---------------- */

async function downloadAll() {
  const done = state.items.filter(i => i.status === 'done');
  if (!done.length) return;

  zipBtn.disabled = true;
  zipBtn.textContent = '打包中…';

  try {
    const zip = new ZipWriter();
    const used = new Set();

    for (const item of done) {
      const ext = extForType(item.result.type);
      const name = uniqueName(used, `${baseName(item.name)}.${ext}`);
      const buf = new Uint8Array(await item.result.blob.arrayBuffer());
      zip.add(name, buf);
    }

    download(zip.build(), `pixkit-${new Date().toISOString().slice(0, 10)}.zip`);
    toast(`已打包 ${done.length} 张图片`);
  } catch (e) {
    console.error(e);
    toast('打包失败，请分批下载');
  } finally {
    zipBtn.disabled = false;
    zipBtn.textContent = '全部下载 (.zip)';
    updateSummary();
  }
}

/* ---------------- 清空 ---------------- */

function clearAll() {
  for (const i of state.items) {
    if (i.url) URL.revokeObjectURL(i.url);
    if (i.bitmap) i.bitmap.close?.();
  }
  state.items = [];
  fileList.innerHTML = '';
  results.classList.add('hidden');
  panel.classList.add('hidden');
  fileInput.value = '';
}

/* ---------------- 事件绑定 ---------------- */

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files?.length) addFiles(fileInput.files);
});

['dragenter', 'dragover'].forEach(ev =>
  dropzone.addEventListener(ev, e => {
    e.preventDefault();
    dropzone.classList.add('is-over');
  })
);

['dragleave', 'drop'].forEach(ev =>
  dropzone.addEventListener(ev, e => {
    e.preventDefault();
    dropzone.classList.remove('is-over');
  })
);

dropzone.addEventListener('drop', e => {
  const files = e.dataTransfer?.files;
  if (files?.length) addFiles(files);
});

// 整页拖放（防止浏览器直接打开图片）
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => {
  e.preventDefault();
  if (e.target.closest('#dropzone')) return;
  const files = e.dataTransfer?.files;
  if (files?.length) addFiles(files);
});

// 粘贴
document.addEventListener('paste', e => {
  const items = e.clipboardData?.items;
  if (!items) return;
  const files = [];
  for (const it of items) {
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      const f = it.getAsFile();
      if (f) files.push(f);
    }
  }
  if (files.length) {
    e.preventDefault();
    addFiles(files);
  }
});

/* 参数控件 */

/* 让滑块显示已填充进度 */
function paintRange(el) {
  const min = +el.min || 0;
  const max = +el.max || 100;
  const pct = max > min ? ((+el.value - min) / (max - min)) * 100 : 0;
  el.style.setProperty('--pct', pct + '%');
}

[qualityInput, edgeInput].forEach(el => {
  paintRange(el);
  el.addEventListener('input', () => paintRange(el));
});

let reprocessTimer = null;
function scheduleReprocess() {
  clearTimeout(reprocessTimer);
  reprocessTimer = setTimeout(reprocessAll, 260);
}

modeSel.addEventListener('change', () => {
  state.mode = modeSel.value;
  qualityField.classList.toggle('hidden', state.mode !== 'quality');
  targetField.classList.toggle('hidden', state.mode !== 'target');
  scheduleReprocess();
});

qualityInput.addEventListener('input', () => {
  state.quality = +qualityInput.value;
  qualityVal.textContent = state.quality;
  scheduleReprocess();
});

targetInput.addEventListener('input', () => {
  const v = Math.round(+targetInput.value);
  if (!Number.isFinite(v) || v < 10) return;
  state.targetKB = Math.min(v, 20000);
  scheduleReprocess();
});

targetInput.addEventListener('blur', () => {
  const v = Math.max(10, Math.min(20000, Math.round(+targetInput.value) || 200));
  targetInput.value = v;
  state.targetKB = v;
});

targetChips.addEventListener('click', e => {
  const btn = e.target.closest('button[data-kb]');
  if (!btn) return;
  const kb = +btn.dataset.kb;
  targetInput.value = kb;
  state.targetKB = kb;
  scheduleReprocess();
});

formatSel.addEventListener('change', () => {
  state.format = formatSel.value;
  if (state.format === 'image/png' && state.mode === 'target') {
    toast('PNG 是无损格式，无法按目标大小控制体积，建议改用 JPG 或 WebP', 3200);
  }
  scheduleReprocess();
});

edgeInput.addEventListener('input', () => {
  state.maxEdge = +edgeInput.value;
  edgeVal.textContent = state.maxEdge === 0 ? '不限' : `${state.maxEdge} px`;
  scheduleReprocess();
});

zipBtn.addEventListener('click', downloadAll);
clearBtn.addEventListener('click', clearAll);

/* 防止处理中误关页面 */
window.addEventListener('beforeunload', e => {
  if (state.items.some(i => i.status === 'working' || i.status === 'pending')) {
    e.preventDefault();
    e.returnValue = '';
  }
});
