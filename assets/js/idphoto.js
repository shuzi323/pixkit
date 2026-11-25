/* ============================================================
   证件照：精确裁剪 + 排版打印
   ============================================================ */

import { toast, download, decodeImage } from './common.js';

const DPI = 300;
const mm2px = mm => Math.round((mm * DPI) / 25.4);

/* 6 寸相纸 152×102mm */
const SHEET = { w: mm2px(152), h: mm2px(102) };
const GAP = mm2px(3);

const SPECS = [
  { id: 'one',    name: '一寸',   w: 25, h: 35, note: '简历 / 报名' },
  { id: 'two',    name: '二寸',   w: 35, h: 49, note: '毕业证 / 职称' },
  { id: 'small1', name: '小一寸', w: 22, h: 32, note: '驾驶证' },
  { id: 'big1',   name: '大一寸', w: 33, h: 48, note: '护照 / 港澳' },
  { id: 'small2', name: '小二寸', w: 35, h: 45, note: '部分签证' },
  { id: 'visa',   name: '美签',   w: 51, h: 51, note: '美国签证' },
];

const $ = id => document.getElementById(id);

const dropzone = $('dropzone');
const fileInput = $('fileInput');
const editor = $('editor');
const stage = $('stage');
const wrap = $('canvasWrap');
const canvas = $('preview');
const specList = $('specList');
const sizeBadge = $('sizeBadge');
const zoomInput = $('zoom');
const zoomVal = $('zoomVal');

const state = {
  img: null,
  spec: SPECS[0],
  zoom: 1,
  offX: 0,
  offY: 0,
};

const PREVIEW_SCALE = 2;   // 预览用 2 倍像素，保证清晰

/* ---------------- 尺寸 ---------------- */

function targetPx(spec = state.spec) {
  return { w: mm2px(spec.w), h: mm2px(spec.h) };
}

/* ---------------- 绘制 ---------------- */

function draw() {
  const { w, h } = targetPx();

  if (canvas.width !== w * PREVIEW_SCALE || canvas.height !== h * PREVIEW_SCALE) {
    canvas.width = w * PREVIEW_SCALE;
    canvas.height = h * PREVIEW_SCALE;
  }

  const ctx = canvas.getContext('2d');
  ctx.setTransform(PREVIEW_SCALE, 0, 0, PREVIEW_SCALE, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  if (!state.img) return;

  const img = state.img;
  const base = Math.max(w / img.width, h / img.height);
  const scale = base * state.zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (w - dw) / 2 + state.offX;
  const dy = (h - dh) / 2 + state.offY;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, dx, dy, dw, dh);
}

/* ---------------- 规格 UI ---------------- */

function renderSpecs() {
  specList.innerHTML = SPECS.map(s => {
    const px = targetPx(s);
    return `<button type="button" class="spec-item${s.id === state.spec.id ? ' is-active' : ''}" data-id="${s.id}">
      <b>${s.name}</b>
      <small>${px.w}×${px.h}</small>
    </button>`;
  }).join('');

  const px = targetPx();
  sizeBadge.textContent = `${state.spec.w}×${state.spec.h} mm · ${px.w}×${px.h} px · 300dpi`;
}

specList.addEventListener('click', e => {
  const btn = e.target.closest('.spec-item');
  if (!btn) return;
  const spec = SPECS.find(s => s.id === btn.dataset.id);
  if (!spec || spec.id === state.spec.id) return;

  state.spec = spec;
  state.zoom = 1;
  state.offX = 0;
  state.offY = 0;
  zoomInput.value = 100;
  zoomVal.textContent = '100%';

  renderSpecs();
  draw();
});

/* ---------------- 缩放 ---------------- */

function setZoom(z) {
  state.zoom = Math.min(3, Math.max(0.5, z));
  zoomInput.value = Math.round(state.zoom * 100);
  zoomVal.textContent = Math.round(state.zoom * 100) + '%';
  draw();
}

zoomInput.addEventListener('input', () => {
  state.zoom = zoomInput.value / 100;
  zoomVal.textContent = zoomInput.value + '%';
  draw();
});

/* ---------------- 拖动 ---------------- */

let dragging = false;
let last = { x: 0, y: 0 };

function displayScale() {
  const { w } = targetPx();
  const cw = canvas.clientWidth || w;
  return cw / w;
}

wrap.addEventListener('pointerdown', e => {
  if (!state.img) return;
  dragging = true;
  last = { x: e.clientX, y: e.clientY };
  wrap.setPointerCapture(e.pointerId);
});

wrap.addEventListener('pointermove', e => {
  if (!dragging) return;
  const s = displayScale() || 1;
  state.offX += (e.clientX - last.x) / s;
  state.offY += (e.clientY - last.y) / s;
  last = { x: e.clientX, y: e.clientY };
  draw();
});

['pointerup', 'pointercancel'].forEach(ev =>
  wrap.addEventListener(ev, () => { dragging = false; })
);

wrap.addEventListener('wheel', e => {
  if (!state.img) return;
  e.preventDefault();
  const f = e.deltaY > 0 ? 0.94 : 1.06;
  setZoom(state.zoom * f);
}, { passive: false });

/* 触摸双指缩放 */
let pinchStart = null;
wrap.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    const [a, b] = e.touches;
    pinchStart = {
      dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
      zoom: state.zoom,
    };
  }
}, { passive: true });

wrap.addEventListener('touchmove', e => {
  if (e.touches.length === 2 && pinchStart) {
    e.preventDefault();
    const [a, b] = e.touches;
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    setZoom(pinchStart.zoom * (d / pinchStart.dist));
  }
}, { passive: false });

wrap.addEventListener('touchend', () => { pinchStart = null; });

/* ---------------- 上传 ---------------- */

async function loadFile(file) {
  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    toast('请上传 JPG、PNG 或 WebP 图片');
    return;
  }

  try {
    const bmp = await decodeImage(file);
    if (state.img) state.img.close?.();
    state.img = bmp;
    state.zoom = 1;
    state.offX = 0;
    state.offY = 0;
    zoomInput.value = 100;
    zoomVal.textContent = '100%';

    dropzone.classList.add('hidden');
    editor.classList.remove('hidden');

    renderSpecs();
    draw();
  } catch (e) {
    toast(e.message === 'HEIC_UNSUPPORTED'
      ? 'HEIC 格式暂不支持，请先转换成 JPG'
      : '图片读取失败，请换一张试试');
  }
}

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});
fileInput.addEventListener('change', () => {
  if (fileInput.files?.[0]) loadFile(fileInput.files[0]);
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
  const f = e.dataTransfer?.files?.[0];
  if (f) loadFile(f);
});

/* ---------------- 导出 ---------------- */

/** 在给定的目标尺寸画布上绘制照片（不带预览缩放） */
function paintTo(ctx, w, h, spec) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const img = state.img;
  if (!img) return;

  const base = Math.max(w / img.width, h / img.height);
  const scale = base * state.zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;

  // 偏移量是按当前预览规格算的，换规格时需要按比例换算
  const cur = targetPx();
  const ratio = w / cur.w;
  const dx = (w - dw) / 2 + state.offX * ratio;
  const dy = (h - dh) / 2 + state.offY * ratio;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, dx, dy, dw, dh);
}

function toBlob(c, quality = 0.95) {
  return new Promise((res, rej) =>
    c.toBlob(b => b ? res(b) : rej(new Error('encode failed')), 'image/jpeg', quality)
  );
}

async function downloadSingle() {
  if (!state.img) return;
  const { w, h } = targetPx();
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paintTo(c.getContext('2d'), w, h, state.spec);

  const blob = await toBlob(c);
  download(blob, `证件照_${state.spec.name}_${w}x${h}.jpg`);
  toast('已下载电子版');
}

async function downloadSheet() {
  if (!state.img) return;
  const { w, h } = targetPx();

  const cols = Math.floor((SHEET.w + GAP) / (w + GAP));
  const rows = Math.floor((SHEET.h + GAP) / (h + GAP));

  if (cols < 1 || rows < 1) {
    toast('这个规格太大了，6 寸相纸放不下');
    return;
  }

  const sheet = document.createElement('canvas');
  sheet.width = SHEET.w;
  sheet.height = SHEET.h;
  const sctx = sheet.getContext('2d');
  sctx.fillStyle = '#ffffff';
  sctx.fillRect(0, 0, SHEET.w, SHEET.h);

  // 单张照片先渲染一次，重复贴图以保证效率
  const photo = document.createElement('canvas');
  photo.width = w;
  photo.height = h;
  paintTo(photo.getContext('2d'), w, h, state.spec);

  const totalW = cols * w + (cols - 1) * GAP;
  const totalH = rows * h + (rows - 1) * GAP;
  const startX = Math.round((SHEET.w - totalW) / 2);
  const startY = Math.round((SHEET.h - totalH) / 2);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      sctx.drawImage(photo, startX + c * (w + GAP), startY + r * (h + GAP));
    }
  }

  const blob = await toBlob(sheet, 0.96);
  download(blob, `证件照排版_${state.spec.name}_${cols * rows}张_6寸.jpg`);
  toast(`已生成 ${cols * rows} 张排版（${cols}×${rows}）`);
}

$('dlSingle').addEventListener('click', downloadSingle);
$('dlSheet').addEventListener('click', downloadSheet);

$('resetBtn').addEventListener('click', () => {
  state.zoom = 1;
  state.offX = 0;
  state.offY = 0;
  zoomInput.value = 100;
  zoomVal.textContent = '100%';
  draw();
});

$('centerBtn').addEventListener('click', () => {
  // 没有内置人脸检测，这里用「经验构图」：
  // 先留出一定的缩放余量（否则竖图没有上移空间），再把画面向上推，
  // 让头部落在上方参考线附近——大多数半身人像照这样处理都接近合规
  const { w, h } = targetPx();
  const img = state.img;

  if (!img) return;

  state.offX = 0;
  state.zoom = 1.12;

  const base = Math.max(w / img.width, h / img.height);
  const dh = img.height * base * state.zoom;
  const overflowY = dh - h;
  state.offY = overflowY > 0 ? -overflowY * 0.8 : 0;

  zoomInput.value = Math.round(state.zoom * 100);
  zoomVal.textContent = Math.round(state.zoom * 100) + '%';
  draw();
});

/* 初始化 */
renderSpecs();

/* 窗口尺寸变化时重绘（canvas 显示尺寸变了，偏移换算依赖它） */
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(draw, 150);
});
