/* ============================================================
   图片转 Base64
   ============================================================ */

import { formatBytes, toast, copyText } from './common.js';

const $ = id => document.getElementById(id);

const dropzone = $('dropzone');
const fileInput = $('fileInput');
const result = $('result');
const thumb = $('thumb');
const meta = $('meta');
const tabs = $('tabs');
const output = $('output');
const fmtLabel = $('fmtLabel');
const charCount = $('charCount');
const copyBtn = $('copyBtn');

const FMT_LABEL = {
  uri: 'Data URI',
  raw: '纯 Base64',
  css: 'CSS',
  html: 'HTML',
  md: 'Markdown',
};

const state = {
  dataUrl: '',
  fmt: 'uri',
  fileSize: 0,
  width: 0,
  height: 0,
};

/* ---------------- 格式化输出 ---------------- */

function formatted() {
  const uri = state.dataUrl;
  const raw = uri.slice(uri.indexOf(',') + 1);

  switch (state.fmt) {
    case 'raw':
      return raw;
    case 'css':
      return `background-image: url("${uri}");`;
    case 'html':
      return `<img src="${uri}" alt="">`;
    case 'md':
      return `![](${uri})`;
    default:
      return uri;
  }
}

function render() {
  const text = formatted();
  output.textContent = text;
  fmtLabel.textContent = FMT_LABEL[state.fmt];
  charCount.textContent = `${text.length.toLocaleString()} 字符`;

  document.querySelectorAll('.fmt-tab').forEach(t => {
    t.classList.toggle('is-active', t.dataset.fmt === state.fmt);
  });
}

function renderMeta() {
  const uriLen = state.dataUrl.length;
  const grow = state.fileSize > 0
    ? ((uriLen - state.fileSize) / state.fileSize) * 100
    : 0;

  const dim = state.width && state.height
    ? `${state.width} × ${state.height}px · `
    : '';

  meta.innerHTML = `
    ${dim}原始 ${formatBytes(state.fileSize)}<br>
    Base64 后 ${(uriLen / 1024).toFixed(1)} KB
    <span class="grow">+${Math.round(grow)}%</span>
  `;
}

/* ---------------- 处理文件 ---------------- */

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    toast('请选择图片文件');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast('图片超过 5MB，转成 Base64 会非常长，建议先压缩', 3200);
  }

  const reader = new FileReader();

  reader.onload = () => {
    state.dataUrl = reader.result;
    state.fileSize = file.size;
    state.fmt = 'uri';

    thumb.src = state.dataUrl;
    thumb.onload = () => {
      state.width = thumb.naturalWidth;
      state.height = thumb.naturalHeight;
      renderMeta();
    };

    result.classList.remove('hidden');
    dropzone.classList.add('hidden');
    render();
    renderMeta();

    // 大图上给个明确提示
    if (file.size > 50 * 1024) {
      toast('这张图超过 50KB，内嵌到 CSS/HTML 会明显拖慢加载', 3600);
    }
  };

  reader.onerror = () => toast('读取失败，请换一张图片');
  reader.readAsDataURL(file);
}

/* ---------------- 复制 ---------------- */

copyBtn.addEventListener('click', async () => {
  const text = formatted();
  if (!text) return;
  const ok = await copyText(text);
  if (ok) {
    copyBtn.textContent = '已复制';
    copyBtn.classList.add('is-done');
    setTimeout(() => {
      copyBtn.textContent = '复制';
      copyBtn.classList.remove('is-done');
    }, 1500);
  } else {
    toast('复制失败，请手动全选文本');
  }
});

/* ---------------- 格式切换 ---------------- */

tabs.addEventListener('click', e => {
  const tab = e.target.closest('.fmt-tab');
  if (!tab) return;
  state.fmt = tab.dataset.fmt;
  render();
});

/* ---------------- 换一张 ---------------- */

$('resetBtn').addEventListener('click', () => {
  result.classList.add('hidden');
  dropzone.classList.remove('hidden');
  fileInput.value = '';
  thumb.src = '';
  state.dataUrl = '';
  state.fileSize = 0;
});

/* ---------------- 上传交互 ---------------- */

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files?.[0]) handleFile(fileInput.files[0]);
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
  if (f) handleFile(f);
});

/* 整页拖放 */
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => {
  e.preventDefault();
  if (e.target.closest('#dropzone')) return;
  const f = e.dataTransfer?.files?.[0];
  if (f) handleFile(f);
});

/* 粘贴 */
document.addEventListener('paste', e => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const it of items) {
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      const f = it.getAsFile();
      if (f) { e.preventDefault(); handleFile(f); return; }
    }
  }
});
