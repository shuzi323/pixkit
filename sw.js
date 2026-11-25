/* ============================================================
   PixKit Service Worker

   目标不是"离线看页面"，而是让这个工具站真的能脱离网络使用 ——
   所有计算本来就在本地，只要代码在缓存里，断网照样压缩、转换、格式化。

   策略：
   - 页面导航 → network-first（保证在线永远是最新版），断网/超时回退缓存
   - 静态资源 → stale-while-revalidate（先给缓存秒开，后台悄悄更新）
   - 只处理同源 GET，别的一律放行

   改缓存策略时把下面的版本号 +1，旧缓存会在 activate 时清掉。
   ============================================================ */

const VERSION = 'v1';
const STATIC_CACHE = `pixkit-static-${VERSION}`;
const PAGE_CACHE = `pixkit-pages-${VERSION}`;

/* 首屏必需资源。首次安装时主动拉一遍，这样"装完就断网"也能打开首页 */
const SHELL = [
  '/assets/css/style.css',
  '/assets/icons/icon-192.png',
  '/assets/js/common.js',
  '/assets/js/i18n.js',
  '/assets/js/i18n.en.js',
  '/assets/js/i18n.tools.js',
  '/assets/js/i18n.text.js',
  '/assets/js/i18n.presets.js',
];

/* 页面导航最多等这么久，超过就用缓存 —— 弱网下不至于白屏 */
const NAV_TIMEOUT = 3000;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    // 逐个 add，单个文件 404 不该让整个安装失败
    await Promise.all(SHELL.map(async url => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (_) { /* 缺文件就跳过 */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k.startsWith('pixkit-') && k !== STATIC_CACHE && k !== PAGE_CACHE)
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/** 离线且这个页面从没被打开过时给的兜底页 —— 比浏览器错误页有用 */
const OFFLINE_PAGE = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>离线 · Offline</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;
       font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
       background:#f8fafc;color:#0f172a;text-align:center}
  h1{font-size:18px;margin:0 0 10px}
  p{color:#475569;font-size:14px;line-height:1.75;margin:0 0 20px}
  a{display:inline-block;padding:10px 22px;border-radius:999px;background:#4f46e5;
    color:#fff;text-decoration:none;font-size:14px}
</style></head>
<body><div>
  <h1>这个页面还没有缓存</h1>
  <p>当前处于离线状态，而这个页面还没被打开过。<br>联网后刷新即可，或者先回首页用其它工具。</p>
  <a href="/">回首页</a>
</div></body></html>`;

/** 带超时的网络请求，超时返回 null 交给缓存兜底 */
async function netFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NAV_TIMEOUT)),
    ]);
    // 只缓存成功的同源响应（opaque 的跨域响应没有意义）
    if (res && res.ok && res.type !== 'opaque') {
      cache.put(request, res.clone());
    }
    return res;
  } catch (_) {
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    return new Response(OFFLINE_PAGE, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

/** 先返回缓存，同时后台更新 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then(res => {
      if (res && res.ok && res.type !== 'opaque') cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return hit || (await network) || Response.error();
}

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(netFirst(request, PAGE_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});
