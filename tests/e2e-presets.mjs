/**
 * 长尾预设页测试
 *
 * 这类页面最容易出的问题是：页面生成了、标题也改了，但引擎没吃到参数 ——
 * 用户点进来看到的还是默认设置，那这个页面就只是换了个 h1 的重复内容。
 *
 * 所以这里逐个页面检查控件的实际状态，不只看文案。
 * 服务的是 dist（预设页只存在于构建产物里），所以跑之前先 build。
 */

import puppeteer from 'puppeteer-core';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { LAUNCH, log, ok } from './env.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const target = normalize(join(DIST, pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  for (const candidate of [target, join(target, 'index.html')]) {
    try {
      const buf = await readFile(candidate);
      res.writeHead(200, { 'Content-Type': MIME[extname(candidate)] || 'application/octet-stream' }).end(buf);
      return;
    } catch { /* 试下一个 */ }
  }
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end('404');
});

await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
log(`dist 服务器 ${BASE}\n`);

let failed = 0;
const check = (cond, msg) => { if (!cond) failed++; ok(cond, msg); };

const browser = await puppeteer.launch(LAUNCH);

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  /* ---------- 1. 压缩：三个预设 ---------- */

  const compressCases = [
    { path: '/tools/compress/200kb/', mode: 'target', kb: '200', h1: '图片压缩到 200KB' },
    { path: '/tools/compress/1mb/', mode: 'target', kb: '1024', h1: '图片压缩到 1MB' },
    { path: '/tools/compress/webp/', mode: 'quality', format: 'image/webp', h1: '图片转 WebP' },
  ];

  log('[压缩] 预设页要真的套上参数');
  for (const c of compressCases) {
    await page.goto(BASE + c.path, { waitUntil: 'networkidle2' });
    const got = await page.evaluate(() => ({
      h1: document.querySelector('h1').textContent.trim(),
      mode: document.getElementById('mode').value,
      kb: document.getElementById('targetSize').value,
      format: document.getElementById('format').value,
      targetVisible: !document.getElementById('targetField').classList.contains('hidden'),
      qualityVisible: !document.getElementById('qualityField').classList.contains('hidden'),
      canonical: document.querySelector('link[rel=canonical]').href,
    }));

    check(got.h1 === c.h1, `${c.path} — h1 = ${got.h1}`);
    check(got.mode === c.mode, `${c.path} — 模式 = ${got.mode}`);
    if (c.kb) check(got.kb === c.kb, `${c.path} — 目标 ${got.kb}KB`);
    if (c.format) check(got.format === c.format, `${c.path} — 输出格式 = ${got.format}`);
    check(got.mode === 'target' ? got.targetVisible : got.qualityVisible, `${c.path} — 对应的输入框可见`);
    check(got.canonical.endsWith(c.path), `${c.path} — canonical 指向自己`);
  }

  /* ---------- 2. 证件照 ---------- */

  log('\n[证件照] 规格要预先选中');
  for (const c of [
    { path: '/tools/idphoto/one-inch/', id: 'one', badge: '25×35' },
    { path: '/tools/idphoto/two-inch/', id: 'two', badge: '35×49' },
  ]) {
    await page.goto(BASE + c.path, { waitUntil: 'networkidle2' });
    const got = await page.evaluate(() => ({
      active: document.querySelector('.spec-item.is-active')?.dataset.id,
      badge: document.getElementById('sizeBadge').textContent.trim(),
    }));
    check(got.active === c.id, `${c.path} — 选中规格 = ${got.active}`);
    check(got.badge.includes(c.badge), `${c.path} — 尺寸标注 ${got.badge}`);
  }

  /* ---------- 3. PDF ---------- */

  log('\n[PDF] 页面尺寸与边距要预设');
  await page.goto(BASE + '/tools/pdf/merge/', { waitUntil: 'networkidle2' });
  const pdf = await page.evaluate(() => ({
    size: document.getElementById('pageSize').value,
    margin: document.getElementById('margin').value,
    h1: document.querySelector('h1').textContent.trim(),
  }));
  check(pdf.size === 'a4p', `PDF 合并页 — 页面尺寸 = ${pdf.size}`);
  check(pdf.margin === 'normal', `PDF 合并页 — 边距 = ${pdf.margin}`);
  check(pdf.h1.includes('合并'), `PDF 合并页 — h1 = ${pdf.h1}`);

  /* ---------- 4. SEO 要素：不能是同一页换标题 ---------- */

  log('\n[SEO] 每页标题、描述、FAQ 必须独立');
  const all = [
    '/tools/compress/200kb/', '/tools/compress/1mb/', '/tools/compress/webp/',
    '/tools/idphoto/one-inch/', '/tools/idphoto/two-inch/', '/tools/pdf/merge/',
  ];

  const metas = [];
  for (const path of all) {
    await page.goto(BASE + path, { waitUntil: 'networkidle2' });
    const m = await page.evaluate(() => {
      const ld = document.querySelector('script[type="application/ld+json"]');
      let faq = null;
      try { faq = JSON.parse(ld.textContent); } catch { /* 下面会判定 */ }
      return {
        title: document.title,
        desc: document.querySelector('meta[name=description]')?.content || '',
        faqType: faq?.['@type'],
        faqCount: faq?.mainEntity?.length || 0,
        visibleFaq: document.querySelectorAll('.faq details').length,
      };
    });
    metas.push({ path, ...m });
    check(m.faqType === 'FAQPage', `${path} — 有 FAQPage 结构化数据`);
    check(m.faqCount === m.visibleFaq && m.faqCount >= 3, `${path} — schema ${m.faqCount} 条 / 页面 ${m.visibleFaq} 条`);
  }

  const titles = new Set(metas.map(m => m.title));
  const descs = new Set(metas.map(m => m.desc));
  check(titles.size === all.length, `6 个页面标题各不相同（${titles.size} 个）`);
  check(descs.size === all.length, `6 个页面描述各不相同（${descs.size} 个）`);
  // 中文信息密度高，45 个汉字已经接近常见英文描述的 100 词；这里只防"空描述/一句话敷衍"
  check(metas.every(m => m.desc.length >= 45), `每页描述都有实质内容（最短 ${Math.min(...metas.map(m => m.desc.length))} 字）`);

  /* ---------- 5. 内链 ---------- */

  log('\n[内链] 基础页能进到预设页，预设页能回到基础页');
  await page.goto(BASE + '/tools/compress/', { waitUntil: 'networkidle2' });
  const chips = await page.$$eval('.preset-links a', els => els.map(a => a.getAttribute('href')));
  check(chips.length === 3, `压缩页有 ${chips.length} 个场景入口`);
  check(chips.includes('/tools/compress/200kb/'), '压缩页链到 /200kb/');

  await page.goto(BASE + '/tools/compress/200kb/', { waitUntil: 'networkidle2' });
  const backLink = await page.$eval('.tool-head__crumb a[href="/tools/compress/"]', el => el.getAttribute('href')).catch(() => null);
  check(backLink === '/tools/compress/', '预设页面包屑回到基础工具页');

  /* ---------- 6. sitemap ---------- */

  log('\n[sitemap]');
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const missing = all.filter(p => !sitemap.includes(p));
  check(missing.length === 0, `6 个预设页都在 sitemap 里${missing.length ? '，缺：' + missing.join(', ') : ''}`);

  check(errors.length === 0, errors.length ? `控制台错误：${errors.slice(0, 3).join(' | ')}` : '控制台无错误');

  /* ---------- 7. 英文模式不能露出中文 ---------- */
  // 预设页只存在于 dist，所以漏译检查放在这里，而不是共用的 e2e-i18n

  log('\n[英文] 预设页逐页扫描残留中文');
  for (const path of all) {
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    await p.evaluateOnNewDocument(() => localStorage.setItem('pixkit.lang', 'en'));
    await p.goto(BASE + path, { waitUntil: 'networkidle2' });

    const left = await p.evaluate(() => {
      const out = new Set();
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const n = w.currentNode;
        const el = n.parentElement;
        if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
        if (el.closest('.langswitch')) continue;
        const t = n.nodeValue.replace(/\s+/g, ' ').trim();
        if (/[\u4e00-\u9fa5]/.test(t)) out.add(t.slice(0, 50));
      }
      return [...out];
    });

    check(left.length === 0, `${path} — 残留中文 ${left.length} 处${left.length ? '：' + left.slice(0, 2).join(' / ') : ''}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}

log(`\n${failed === 0 ? '✓ 预设页测试全部通过' : '✗ 有失败项'}：${failed} 项失败\n`);
process.exit(failed === 0 ? 0 : 1);
