/**
 * PWA / 离线可用性测试
 *
 * 这里不能用 page.setOfflineMode —— 它只作用于页面 target，
 * Service Worker 跑在独立的 worker target 里，照样能联网，
 * 于是"离线测试"会假阳性。真正可靠的办法是把静态服务器关掉。
 *
 * 所以这个脚本自己在随机端口起一个服务器，测完就关。
 * 不依赖 npm run dev 起的那个 8899。
 */

import puppeteer from 'puppeteer-core';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { ROOT, LAUNCH, log, ok } from './env.mjs';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const target = normalize(join(ROOT, pathname.endsWith('/') ? pathname + 'index.html' : pathname));

  if (!target.startsWith(ROOT)) {
    res.writeHead(403).end();
    return;
  }

  for (const candidate of [target, join(target, 'index.html')]) {
    try {
      const buf = await readFile(candidate);
      res.writeHead(200, { 'Content-Type': MIME[extname(candidate)] || 'application/octet-stream' });
      res.end(buf);
      return;
    } catch { /* 试下一个 */ }
  }

  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html><title>404</title><h1>404</h1>');
});

await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
log(`测试服务器 ${BASE}`);

let failed = 0;
const check = (cond, msg) => { if (!cond) failed++; ok(cond, msg); };

const browser = await puppeteer.launch(LAUNCH);

try {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('pixkit.lang', 'zh'); } catch { /* 忽略 */ }
  });

  /* ---------- 1. 注册与清单 ---------- */

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });

  const reg = await page.evaluate(async () => {
    const r = await navigator.serviceWorker.ready;
    return { scope: r.scope, active: !!r.active };
  });
  check(reg.active, `Service Worker 已激活（scope ${reg.scope}）`);

  const mf = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) return null;
    const res = await fetch(link.href);
    const j = await res.json();
    return { ok: res.ok, name: j.name, icons: (j.icons || []).length, maskable: (j.icons || []).some(i => i.purpose === 'maskable') };
  });
  check(!!mf?.ok, 'manifest 可被解析');
  check(mf?.icons >= 2, `manifest 图标 ${mf?.icons} 个`);
  check(!!mf?.maskable, 'manifest 含 maskable 图标');

  const iconsOk = await page.evaluate(async () => {
    const j = await (await fetch('/manifest.webmanifest')).json();
    const results = await Promise.all(j.icons.map(async i => (await fetch(i.src)).ok));
    return results.every(Boolean);
  });
  check(iconsOk, '所有图标文件都能取到');

  /* ---------- 2. 预缓存的核心资源 ---------- */

  // 第一次导航时 SW 还没接管，刷新一次让页面进入 controller
  await page.reload({ waitUntil: 'networkidle0' });
  const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller);
  check(controlled, '页面已被 Service Worker 接管');

  const shellCached = await page.evaluate(async () => {
    const cache = await caches.open('pixkit-static-v1');
    const keys = await cache.keys();
    return keys.map(k => new URL(k.url).pathname);
  });
  check(shellCached.includes('/assets/css/style.css'), `CSS 已进入预缓存（共 ${shellCached.length} 项）`);

  /* ---------- 3. 在线访问一个工具页，让它进页面缓存 ---------- */

  await page.goto(`${BASE}/tools/json/`, { waitUntil: 'networkidle0' });
  check((await page.title()).includes('JSON'), '在线访问 JSON 工具正常');

  /* ---------- 4. 关掉服务器，模拟真正断网 ---------- */

  // Chrome 会留着 keep-alive 连接，不主动踢掉的话 close() 会一直挂着
  server.closeAllConnections?.();
  await new Promise(r => {
    server.close(r);
    setTimeout(r, 500);
  });
  log('服务器已关闭，开始离线测试\n');

  // 4.1 访问过的页面还能打开
  const cachedRes = await page.goto(`${BASE}/tools/json/`, { waitUntil: 'domcontentloaded' });
  const cachedTitle = await page.title();
  check(cachedRes.status() === 200 && cachedTitle.includes('JSON'), `离线打开访问过的页面：${cachedTitle}`);

  // 4.2 静态资源还能加载（说明缓存真生效，不是页面残留）
  const cssOk = await page.evaluate(async () => {
    const res = await fetch('/assets/css/style.css');
    return res.ok && (await res.text()).length > 1000;
  });
  check(cssOk, '离线时 CSS 仍从缓存返回');

  // 4.3 从没打开过的页面 → 给出离线提示，而不是浏览器错误页
  const offRes = await page.goto(`${BASE}/tools/idphoto/`, { waitUntil: 'domcontentloaded' });
  const offText = await page.evaluate(() => document.body.innerText);
  check(offRes.status() === 200 && offText.includes('还没有缓存'), '离线打开未缓存的页面 → 显示离线提示页');

  // 4.4 离线时 JS 模块依然能加载并执行 —— 工具能用的根本前提
  const stillWorks = await page.evaluate(async () => {
    const m = await import('/assets/js/common.js');
    return m.formatBytes(1536) === '1.5 KB';
  });
  check(stillWorks, '离线状态下 JS 模块可从缓存加载并执行');
} finally {
  await browser.close();
  try { server.close(); } catch { /* 已关闭 */ }
}

log(failed ? `\n✗ ${failed} 项未通过` : '\n✓ 全部通过');
process.exit(failed ? 1 : 0);
