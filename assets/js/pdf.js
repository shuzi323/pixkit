/* ============================================================
   图片转 PDF

   两件事：
   1. 把每张图重新编码成 JPEG（PDF 内嵌图片用的就是这个格式）
   2. 手写 PDF 文件结构：Catalog / Pages / 每页一个 Page + 一个 Image XObject

   为什么不引 jsPDF（约 350KB）：我们只需要"往页面里放一张 JPEG"这一个能力，
   而 PDF 的这块结构简单到可以直接拼字符串。JPEG 本身就是 DCT 压缩的数据，
   用 /DCTDecode 原样塞进去即可，不用在 JS 里再编码一次。

   顺带一个好处：整个 PDF 在本地生成，字节流不经过任何服务器。
   ============================================================ */

import {
  formatBytes, toast, download, esc, baseName, decodeImage,
  makeCanvas, canvasToBlob, bindFilePicker
} from './common.js';
import { t } from './i18n.js';

const $ = id => document.getElementById(id);

const dropzone = $('dropzone');
const fileInput = $('fileInput');
const panel = $('panel');
const results = $('results');
const fileList = $('fileList');
const summary = $('summary');
const output = $('output');
const outStat = $('outStat');

const pageSizeSel = $('pageSize');
const marginSel = $('margin');
const qualityInput = $('quality');
const qualityVal = $('qualityVal');

/* 长尾预设页：<body data-preset='{"pageSize":"a4l","margin":"none"}'> */
(function applyPreset() {
  const raw = document.body.dataset.preset;
  if (!raw) return;
  let p;
  try { p = JSON.parse(raw); } catch { return; }

  if (p.pageSize) pageSizeSel.value = p.pageSize;
  if (p.margin) marginSel.value = p.margin;
  if (p.quality) {
    qualityInput.value = p.quality;
    qualityVal.textContent = p.quality;
  }
})();

/* 单位是 PDF 的 pt（1pt = 1/72 英寸） */
const A4 = { w: 595.28, h: 841.89 };
const MARGINS = { none: 0, normal: 36, wide: 54 };

/** 96dpi 像素换算成 pt：PDF 默认 72dpi，所以乘 0.75 */
const PX_TO_PT = 0.75;

let state = { items: [], pdf: null };
let seq = 0;

/* ============================================================
   PDF 组装
   ============================================================ */

/** 去掉多余的小数位，PDF 里数字越短文件越小 */
function num(n) {
  const s = n.toFixed(2);
  return s.endsWith('.00') ? s.slice(0, -3) : s.replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * @param {{ jpeg: Uint8Array, pxW: number, pxH: number,
 *           pageW: number, pageH: number,
 *           drawW: number, drawH: number, x: number, y: number }[]} pages
 * @returns {Blob}
 */
export function buildPdf(pages) {
  const enc = new TextEncoder();
  const objs = [];                       // 下标 + 1 就是对象号
  const add = parts => { objs.push(parts); return objs.length; };

  const catalogNo = add(['<< /Type /Catalog /Pages 2 0 R >>']);
  const pagesNo = add(['']);             // 占位，最后回填 Kids

  const kids = [];
  for (const p of pages) {
    const imgNo = add([
      `<< /Type /XObject /Subtype /Image /Width ${p.pxW} /Height ${p.pxH} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
      p.jpeg,
      '\nendstream',
    ]);

    // cm 的六个参数：宽 0 0 高 x y，把图片放到页面的指定位置
    const content = `q\n${num(p.drawW)} 0 0 ${num(p.drawH)} ${num(p.x)} ${num(p.y)} cm\n/Im0 Do\nQ`;
    const contentNo = add([
      `<< /Length ${enc.encode(content).length} >>\nstream\n${content}\nendstream`,
    ]);

    kids.push(add([
      `<< /Type /Page /Parent ${pagesNo} 0 R ` +
      `/MediaBox [0 0 ${num(p.pageW)} ${num(p.pageH)}] ` +
      `/Resources << /XObject << /Im0 ${imgNo} 0 R >> >> ` +
      `/Contents ${contentNo} 0 R >>`,
    ]));
  }

  objs[pagesNo - 1] = [
    `<< /Type /Pages /Kids [${kids.map(n => `${n} 0 R`).join(' ')}] /Count ${kids.length} >>`,
  ];

  /* 序列化：一边写一边记每个对象的字节偏移，xref 表要用 */
  const parts = [];
  let pos = 0;
  const write = chunk => {
    const bytes = typeof chunk === 'string' ? enc.encode(chunk) : chunk;
    parts.push(bytes);
    pos += bytes.length;
  };

  // 第二行是二进制标记。有些工具靠它判定"这是二进制文件，别当文本处理"
  write(new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, // %PDF-1.4\n
    0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a,                   // %âãÏÓ\n
  ]));

  const offsets = [0];
  objs.forEach((chunks, i) => {
    offsets.push(pos);
    write(`${i + 1} 0 obj\n`);
    for (const c of chunks) write(c);
    write('\nendobj\n');
  });

  const startxref = pos;
  let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  xref +=
    `trailer\n<< /Size ${objs.length + 1} /Root ${catalogNo} 0 R >>\n` +
    `startxref\n${startxref}\n%%EOF\n`;
  write(xref);

  return new Blob(parts, { type: 'application/pdf' });
}

/* ============================================================
   页面布局
   ============================================================ */

/** 算出这一页的纸张尺寸和图片摆放位置 */
function layout(pxW, pxH, sizeMode, margin) {
  let pageW, pageH;

  if (sizeMode === 'auto') {
    // 跟随图片：纸张就等于图 + 四周留白，所以图永远是原始比例、不缩放
    pageW = pxW * PX_TO_PT + margin * 2;
    pageH = pxH * PX_TO_PT + margin * 2;
  } else if (sizeMode === 'a4l') {
    pageW = A4.h;
    pageH = A4.w;
  } else {
    pageW = A4.w;
    pageH = A4.h;
  }

  const availW = Math.max(1, pageW - margin * 2);
  const availH = Math.max(1, pageH - margin * 2);
  const scale = Math.min(availW / pxW, availH / pxH);

  const drawW = pxW * scale;
  const drawH = pxH * scale;

  return {
    pageW,
    pageH,
    drawW,
    drawH,
    x: (pageW - drawW) / 2,
    y: (pageH - drawH) / 2,
  };
}

/* ============================================================
   文件列表
   ============================================================ */

function addFiles(files) {
  const added = [];
  for (const file of files) {
    const item = { id: ++seq, file, url: URL.createObjectURL(file), w: 0, h: 0 };
    state.items.push(item);
    added.push(item);
  }
  if (!added.length) return;

  hideOutput();
  render();

  // 尺寸靠解码拿，解码失败就当破图，直接从列表里去掉
  Promise.all(added.map(async it => {
    try {
      const bmp = await decodeImage(it.file);
      it.w = bmp.width;
      it.h = bmp.height;
      bmp.close?.();
    } catch {
      removeItem(it.id);
      toast(/HEIC/.test(it.file.name) || /heic|heif/.test(it.file.type)
        ? t('HEIC 格式暂不支持，请先转成 JPG')
        : t('有图片读不出来，已跳过'));
    }
  })).then(render);
}

function removeItem(id) {
  const i = state.items.findIndex(x => x.id === id);
  if (i === -1) return;
  URL.revokeObjectURL(state.items[i].url);
  state.items.splice(i, 1);
  hideOutput();
  render();
}

function move(id, dir) {
  const i = state.items.findIndex(x => x.id === id);
  const j = i + dir;
  if (i === -1 || j < 0 || j >= state.items.length) return;
  [state.items[i], state.items[j]] = [state.items[j], state.items[i]];
  hideOutput();
  render();
}

function clearAll() {
  for (const it of state.items) URL.revokeObjectURL(it.url);
  state.items = [];
  state.pdf = null;
  fileInput.value = '';
  hideOutput();
  render();
}

function render() {
  const n = state.items.length;

  panel.classList.toggle('hidden', n === 0);
  results.classList.toggle('hidden', n === 0);
  dropzone.classList.toggle('dropzone--compact', n > 0);

  if (n === 0) {
    fileList.innerHTML = '';
    return;
  }

  const total = state.items.reduce((s, it) => s + it.file.size, 0);
  summary.innerHTML =
    `<strong>${n}</strong> ${t('张图片')} · ${formatBytes(total)} · ` +
    `${t('共 {n} 页', { n })}`;

  fileList.innerHTML = state.items.map((it, i) => {
    const dim = it.w ? `${it.w} × ${it.h}` : t('读取中…');
    return `
      <div class="file-row" data-id="${it.id}">
        <div class="file-row__index">${i + 1}</div>
        <img class="file-row__thumb" src="${it.url}" alt="">
        <div class="file-row__main">
          <div class="file-row__name">${esc(it.file.name)}</div>
          <div class="file-row__meta">
            <span>${formatBytes(it.file.size)}</span>
            <span class="dim">${dim}</span>
          </div>
        </div>
        <div class="file-row__ops">
          <button class="icon-btn" data-act="up" title="${t('上移')}" aria-label="${t('上移')}" ${i === 0 ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
          </button>
          <button class="icon-btn" data-act="down" title="${t('下移')}" aria-label="${t('下移')}" ${i === n - 1 ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>
          </button>
          <button class="icon-btn" data-act="del" title="${t('删除')}" aria-label="${t('删除')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   生成
   ============================================================ */

function hideOutput() {
  state.pdf = null;
  output.classList.add('hidden');
}

async function makePdf() {
  const items = state.items.filter(it => it.w && it.h);
  if (!items.length) {
    toast(t('还有图片没读取完，稍等一下'));
    return;
  }

  const sizeMode = pageSizeSel.value;
  const margin = MARGINS[marginSel.value] ?? 0;
  const quality = +qualityInput.value / 100;
  const btn = $('makeBtn');

  btn.disabled = true;
  hideOutput();

  const pages = [];
  try {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      summary.innerHTML = `${t('正在生成…')} ${i + 1}/${items.length}`;
      // 让浏览器有机会把进度画出来，否则大图会卡住不刷新
      await new Promise(r => setTimeout(r, 0));

      const bmp = await decodeImage(it.file);
      const w = bmp.width || it.w;
      const h = bmp.height || it.h;
      const cv = makeCanvas(w, h);
      const ctx = cv.getContext('2d');
      // JPEG 没有透明通道，不先铺白底的话透明区域会变成黑色
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(bmp, 0, 0);
      bmp.close?.();

      const blob = await canvasToBlob(cv, 'image/jpeg', quality);
      cv.width = 0;
      cv.height = 0;
      if (!blob) throw new Error('ENCODE_FAILED');

      const jpeg = new Uint8Array(await blob.arrayBuffer());
      pages.push({
        jpeg,
        pxW: w,
        pxH: h,
        ...layout(it.w, it.h, sizeMode, margin),
      });
    }

    const pdf = buildPdf(pages);
    state.pdf = pdf;

    output.classList.remove('hidden');
    outStat.innerHTML =
      `<strong>${pages.length}</strong> ${t('页')} · ${formatBytes(pdf.size)} · ` +
      `${t('已在本地生成，未上传')}`;
  } catch (e) {
    toast(e.message === 'ENCODE_FAILED' ? t('图片编码失败，换一张试试') : t('生成失败，请重试'));
  } finally {
    btn.disabled = false;
    render();
  }
}

/* ============================================================
   事件
   ============================================================ */

bindFilePicker({ zone: dropzone, input: fileInput, multiple: true, onFiles: addFiles });

fileList.addEventListener('click', e => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const row = btn.closest('.file-row');
  const id = +row.dataset.id;
  if (btn.dataset.act === 'del') removeItem(id);
  else move(id, btn.dataset.act === 'up' ? -1 : 1);
});

$('clearBtn').addEventListener('click', clearAll);
$('makeBtn').addEventListener('click', makePdf);

$('dlBtn').addEventListener('click', () => {
  if (!state.pdf) return;
  const name = baseName(state.items[0]?.file.name || 'images') || 'images';
  download(state.pdf, state.items.length > 1 ? `${name}-等${state.items.length}张.pdf` : `${name}.pdf`);
});

qualityInput.addEventListener('input', () => {
  qualityVal.textContent = qualityInput.value;
});
[pageSizeSel, marginSel, qualityInput].forEach(el =>
  el.addEventListener('change', hideOutput)
);
