/**
 * PWA —— 注册 Service Worker + 安装引导
 *
 * 这个站的全部计算本来就在本地，装上之后断网也能用，
 * 所以"装到桌面"对它是实打实的体验升级，不只是加个图标。
 *
 * 说明：
 * - 只在 https / localhost 注册（http 的局域网 IP 不支持 SW）
 * - Chrome/Edge/Android 走 beforeinstallprompt
 * - iOS Safari 没有这个事件，得手动教用户「分享 → 添加到主屏幕」
 */

const SW_URL = '/sw.js';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* ---------------- 注册 ---------------- */

const canRegister =
  'serviceWorker' in navigator &&
  (location.protocol === 'https:' ||
    ['localhost', '127.0.0.1'].includes(location.hostname));

if (canRegister) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SW_URL, { scope: '/' }).catch(() => {
      /* 注册失败不影响使用，静默即可 */
    });
  });
}

/* ---------------- 安装按钮 ---------------- */

const DISMISS_KEY = 'pixkit.installDismissed';

let deferredPrompt = null;
let wrap = null;
let iosTip = null;

function dismissed() {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
}

function mountButton() {
  if (wrap || isStandalone() || dismissed()) return;

  wrap = document.createElement('div');
  wrap.className = 'install-wrap';
  wrap.innerHTML =
    '<button type="button" class="install-main">' +
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>' +
    '<span>安装到桌面</span>' +
    '</button>' +
    '<button type="button" class="install-x" aria-label="关闭">×</button>';

  wrap.querySelector('.install-main').addEventListener('click', onInstallClick);
  wrap.querySelector('.install-x').addEventListener('click', () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* 隐私模式忽略 */ }
    dismissButton();
  });

  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('is-in'));
}

async function onInstallClick() {
  // iOS：没有 prompt，给一段操作说明
  if (!deferredPrompt && isIOS()) {
    showIOSTip();
    return;
  }
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (outcome === 'accepted') dismissButton();
}

function showIOSTip() {
  if (iosTip) { iosTip.remove(); iosTip = null; return; }

  iosTip = document.createElement('div');
  iosTip.className = 'install-tip';
  iosTip.innerHTML =
    '点击 Safari 底部的「分享」按钮，然后选择「添加到主屏幕」。' +
    '<br>装好之后断网也能继续用。';
  wrap.before(iosTip);
}

function dismissButton() {
  wrap?.remove();
  iosTip?.remove();
  wrap = null;
  iosTip = null;
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  mountButton();
});

window.addEventListener('appinstalled', dismissButton);

/* iOS 不会派发 beforeinstallprompt，进入页面就直接给个入口 */
if (isIOS() && !isStandalone() && canRegister) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountButton, { once: true });
  } else {
    mountButton();
  }
}
