/**
 * 压缩前后对比
 *
 * 两张图叠在一起，用 clip-path 裁掉上层右半边，中间一根可拖的分割线。
 * 上下层都铺满同一个容器，所以分辨率不同也能像素级对齐（压缩是等比缩放）。
 *
 * 交互：鼠标/触摸拖动、左右方向键微调、Esc 或点背景关闭。
 */

let dialog = null;

function build() {
  const el = document.createElement('div');
  el.className = 'cmp';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `
    <div class="cmp__bar">
      <div class="cmp__info">
        <strong class="cmp__title">压缩前后对比</strong>
        <span class="cmp__meta"></span>
      </div>
      <button type="button" class="cmp__close" aria-label="关闭">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
    <div class="cmp__stage">
      <img class="cmp__img" data-role="after" alt="压缩后" draggable="false">
      <div class="cmp__before">
        <img class="cmp__img" data-role="before" alt="原图" draggable="false">
      </div>
      <span class="cmp__tag cmp__tag--l">原图</span>
      <span class="cmp__tag cmp__tag--r">压缩后</span>
      <div class="cmp__handle">
        <span class="cmp__grip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 6l-5 6 5 6"/><path d="M15 6l5 6-5 6"/>
          </svg>
        </span>
      </div>
    </div>
  `;
  return el;
}

/** @param {{ before: string, after: string, meta?: string, onClose?: () => void }} opts */
export function openCompare({ before, after, meta, onClose }) {
  close();

  const el = build();
  const stage = el.querySelector('.cmp__stage');
  const layer = el.querySelector('.cmp__before');
  const handle = el.querySelector('.cmp__handle');
  const imgBefore = el.querySelector('[data-role="before"]');
  const imgAfter = el.querySelector('[data-role="after"]');

  imgBefore.src = before;
  imgAfter.src = after;
  el.querySelector('.cmp__meta').textContent = meta || '';

  let pos = 50;
  const paint = () => {
    layer.style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
    handle.style.left = `${pos}%`;
  };
  paint();

  /* ---- 拖动 ---- */

  let dragging = false;

  const moveTo = clientX => {
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    pos = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
    paint();
  };

  stage.addEventListener('pointerdown', e => {
    dragging = true;
    stage.setPointerCapture?.(e.pointerId);
    stage.classList.add('is-dragging');
    moveTo(e.clientX);
  });

  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    e.preventDefault();
    moveTo(e.clientX);
  });

  const stop = () => {
    dragging = false;
    stage.classList.remove('is-dragging');
  };
  stage.addEventListener('pointerup', stop);
  stage.addEventListener('pointercancel', stop);

  /* ---- 键盘 ---- */

  const onKey = e => {
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      pos = Math.min(100, Math.max(0, pos + (e.key === 'ArrowLeft' ? -2 : 2)));
      paint();
    }
  };

  /* ---- 关闭 ---- */

  el.querySelector('.cmp__close').addEventListener('click', close);

  el.addEventListener('click', e => {
    // 点舞台以外的地方关掉（点图是为了拖，不关）
    if (!e.target.closest('.cmp__stage')) close();
  });

  document.body.appendChild(el);
  document.body.classList.add('is-locked');
  document.addEventListener('keydown', onKey);

  // 打开动画
  requestAnimationFrame(() => el.classList.add('is-open'));

  dialog = { el, onKey, onClose };
}

export function close() {
  if (!dialog) return;

  const { el, onKey, onClose } = dialog;
  dialog = null;

  document.removeEventListener('keydown', onKey);
  document.body.classList.remove('is-locked');
  el.remove();

  // blob URL 由调用方负责回收 —— 结果缩略图还在用同一个 URL，这里不能乱 revoke
  try { onClose?.(); } catch (_) { /* 忽略 */ }
}

export const isOpen = () => !!dialog;
