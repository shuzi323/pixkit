/* ============================================================
   图片取色器
   ============================================================ */

import { toast, copyText, decodeImage, bindFilePicker } from './common.js';

const $ = id => document.getElementById(id);

const dropzone = $('dropzone');
const fileInput = $('fileInput');
const workspace = $('workspace');
const stage = $('stage');
const canvas = $('pickerCanvas');
const magnifier = $('magnifier');
const magCanvas = $('magCanvas');

const swatchBig = $('swatchBig');
const valHex = $('valHex');
const valRgb = $('valRgb');
const valHsl = $('valHsl');
const paletteEl = $('palette');
const historyEl = $('history');

const MAX_EDGE = 2000;   // 超过这个尺寸的图先缩小，避免内存和取色卡顿
const MAG_ZOOM = 9;      // 放大镜取样区域边长（像素）

const state = {
  imageData: null,       // 整张图的像素缓存
  cur: null,             // 当前颜色 [r,g,b]
  history: [],
};

/* ---------------- 颜色工具 ---------------- */

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function luminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function colorDist(a, b) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
}

/* ---------------- 主色提取 ---------------- */

function extractPalette(data, w, h, count = 8) {
  const total = w * h;
  const step = Math.max(1, Math.floor(total / 30000));   // 采样约 3 万个点
  const map = new Map();

  for (let p = 0; p < total; p += step) {
    const i = p * 4;
    if (data[i + 3] < 128) continue;   // 跳过透明像素

    const r = data[i], g = data[i + 1], b = data[i + 2];
    // 量化到 5 bit/通道做分桶
    const key = ((r & 0xF8) << 16) | ((g & 0xF8) << 8) | (b & 0xF8);

    const cur = map.get(key);
    if (cur) {
      cur.n++; cur.r += r; cur.g += g; cur.b += b;
    } else {
      map.set(key, { n: 1, r, g, b });
    }
  }

  const buckets = [...map.values()].sort((a, b) => b.n - a.n);
  const out = [];

  for (const c of buckets) {
    if (out.length >= count) break;
    const col = [
      Math.round(c.r / c.n),
      Math.round(c.g / c.n),
      Math.round(c.b / c.n),
    ];
    // 合并过于接近的颜色，保证色板有区分度
    if (out.some(o => colorDist(o, col) < 42)) continue;
    out.push(col);
  }

  return out;
}

/* ---------------- 渲染 ---------------- */

function paintSwatch(rgb) {
  const [r, g, b] = rgb;
  const hex = rgbToHex(r, g, b);
  const [h, s, l] = rgbToHsl(r, g, b);

  swatchBig.style.background = hex;
  swatchBig.style.color = luminance(r, g, b) > 0.62 ? '#0f172a' : '#ffffff';
  swatchBig.textContent = hex;

  valHex.textContent = hex;
  valRgb.textContent = `${r}, ${g}, ${b}`;
  valHsl.textContent = `${h}°, ${s}%, ${l}%`;

  state.cur = rgb;
}

function renderPalette(colors) {
  if (!colors.length) {
    paletteEl.innerHTML = '<p class="pk-empty">没能提取到颜色</p>';
    return;
  }

  paletteEl.innerHTML = colors.map(c => {
    const hex = rgbToHex(...c);
    const lum = luminance(...c);
    return `<button class="palette-item" style="background:${hex}" data-hex="${hex}" title="${hex}">
      <span style="color:${lum > 0.6 ? '#0f172a' : '#0f172a'}">${hex.slice(1)}</span>
    </button>`;
  }).join('');
}

function renderHistory() {
  if (!state.history.length) {
    historyEl.innerHTML = '<p class="pk-empty">点击图片开始取色</p>';
    return;
  }
  historyEl.innerHTML = state.history.map(hex =>
    `<span style="background:${hex}" data-hex="${hex}" title="${hex}"></span>`
  ).join('');
}

function addToHistory(hex) {
  if (state.history[0] === hex) return;
  state.history.unshift(hex);
  if (state.history.length > 12) state.history.pop();
  renderHistory();
}

/* ---------------- 取色 ---------------- */

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
  const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
  return {
    x: Math.max(0, Math.min(canvas.width - 1, x)),
    y: Math.max(0, Math.min(canvas.height - 1, y)),
  };
}

function colorAt(x, y) {
  const d = state.imageData.data;
  const i = (y * canvas.width + x) * 4;
  // 透明区域当作白色处理，否则取出来是黑的
  const a = d[i + 3];
  if (a < 8) return [255, 255, 255];
  return [d[i], d[i + 1], d[i + 2]];
}

function updateMagnifier(e, x, y) {
  const half = Math.floor(MAG_ZOOM / 2);
  const sx = Math.max(0, Math.min(canvas.width - MAG_ZOOM, x - half));
  const sy = Math.max(0, Math.min(canvas.height - MAG_ZOOM, y - half));

  const ctx = magCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, magCanvas.width, magCanvas.height);
  ctx.drawImage(
    canvas,
    sx, sy, MAG_ZOOM, MAG_ZOOM,
    0, 0, magCanvas.width, magCanvas.height
  );

  const stageRect = stage.getBoundingClientRect();
  let left = e.clientX - stageRect.left + 22;
  let top = e.clientY - stageRect.top - 128;

  if (left + 110 > stageRect.width) left = e.clientX - stageRect.left - 126;
  if (top < 0) top = e.clientY - stageRect.top + 22;

  magnifier.style.left = left + 'px';
  magnifier.style.top = top + 'px';
  magnifier.classList.add('is-on');
}

canvas.addEventListener('pointermove', e => {
  if (!state.imageData) return;
  const { x, y } = canvasPoint(e);
  paintSwatch(colorAt(x, y));
  updateMagnifier(e, x, y);
});

canvas.addEventListener('pointerleave', () => {
  magnifier.classList.remove('is-on');
});

canvas.addEventListener('pointerdown', e => {
  if (!state.imageData) return;
  const { x, y } = canvasPoint(e);
  const rgb = colorAt(x, y);
  paintSwatch(rgb);
  addToHistory(rgbToHex(...rgb));
});

/* ---------------- 复制 ---------------- */

async function doCopy(text) {
  const ok = await copyText(text);
  toast(ok ? `已复制 ${text}` : '复制失败，请手动选择');
}

document.querySelectorAll('.val-row').forEach(row => {
  row.addEventListener('click', () => {
    if (!state.cur) return;
    const [r, g, b] = state.cur;
    const kind = row.dataset.copy;
    if (kind === 'hex') doCopy(rgbToHex(r, g, b));
    else if (kind === 'rgb') doCopy(`rgb(${r}, ${g}, ${b})`);
    else doCopy(`hsl(${rgbToHsl(r, g, b).join(', ')})`);
  });
});

paletteEl.addEventListener('click', e => {
  const item = e.target.closest('.palette-item');
  if (item) doCopy(item.dataset.hex);
});

historyEl.addEventListener('click', e => {
  const item = e.target.closest('span[data-hex]');
  if (item) doCopy(item.dataset.hex);
});

/* ---------------- 换一张 ---------------- */

$('resetBtn').addEventListener('click', () => {
  workspace.classList.add('hidden');
  dropzone.classList.remove('hidden');
  fileInput.value = '';
  state.imageData = null;
  state.cur = null;
  state.history = [];
  swatchBig.style.background = '#ffffff';
  swatchBig.style.color = '#94a3b8';
  swatchBig.textContent = '—';
  valHex.textContent = '—';
  valRgb.textContent = '—';
  valHsl.textContent = '—';
});

/* ---------------- 上传 ---------------- */

async function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    toast('请选择图片文件');
    return;
  }

  try {
    const bmp = await decodeImage(file);

    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();

    state.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    state.history = [];

    workspace.classList.remove('hidden');
    dropzone.classList.add('hidden');

    const colors = extractPalette(state.imageData.data, canvas.width, canvas.height);
    renderPalette(colors);
    renderHistory();

    if (colors.length) paintSwatch(colors[0]);

    if (scale < 1) {
      toast(`图片较大，已缩放到 ${canvas.width}×${canvas.height} 显示`, 2600);
    }
  } catch (e) {
    toast(e.message === 'HEIC_UNSUPPORTED' ? 'HEIC 格式暂不支持，请先转成 JPG' : '图片读取失败');
  }
}

bindFilePicker({
  zone: dropzone,
  input: fileInput,
  onFiles: files => handleFile(files[0]),
});
