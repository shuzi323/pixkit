/**
 * 中英切换的端到端测试
 * 覆盖：自动判定（zh / en / 其他语言）、手动切换、刷新后保持、全站漏译检查
 */

import puppeteer from 'puppeteer-core';
import { BASE, LAUNCH, log, ok } from './env.mjs';

const PAGES = [
  '/', '/tools/compress/', '/tools/idphoto/', '/tools/convert/',
  '/tools/resize/', '/tools/base64/', '/tools/picker/', '/tools/exif/',
];

const browser = await puppeteer.launch(LAUNCH);

async function newPage(locale, storage) {
  // 每个场景用独立的匿名上下文，否则 localStorage 会串味
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': locale });
  await page.evaluateOnNewDocument((loc, st) => {
    Object.defineProperty(navigator, 'language', { get: () => loc });
    Object.defineProperty(navigator, 'languages', { get: () => [loc] });
    if (st) localStorage.setItem('pixkit.lang', st);
  }, locale, storage || '');
  await page.setViewport({ width: 1280, height: 900 });
  return page;
}

/* 统计页面可见中文（排除脚本、样式、语言切换器） */
async function remainingCJK(page) {
  return page.evaluate(() => {
    const out = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      const p = n.parentElement;
      if (!p || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(p.tagName)) continue;
      if (p.closest('.langswitch')) continue;
      const t = n.nodeValue.trim();
      if (/[\u4e00-\u9fa5]/.test(t)) out.add(t.slice(0, 60));
    }
    return [...out];
  });
}

try {
  /* ---------- 1. 浏览器语言是英文 ---------- */
  log('\n[1] en-US 首次访问');
  let page = await newPage('en-US');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  ok(htmlLang === 'en', `html lang = ${htmlLang}`);

  const h1 = await page.$eval('h1', el => el.textContent.replace(/\s+/g, ' ').trim());
  ok(/Image editing/i.test(h1), `h1 = "${h1}"`);

  const navText = await page.$$eval('.nav a', els => els.map(e => e.textContent.trim()));
  ok(navText.every(t => !/[\u4e00-\u9fa5]/.test(t)), `导航 = ${navText.join(' | ')}`);

  const title = await page.title();
  ok(!/[\u4e00-\u9fa5]/.test(title), `title = "${title}"`);

  /* ---------- 2. 切回中文 → 原文完整还原 ---------- */
  log('\n[2] 点击「中文」');
  await page.click('.langswitch button[data-lang="zh"]');
  await new Promise(r => setTimeout(r, 150));
  const h1zh = await page.$eval('h1', el => el.textContent.replace(/\s+/g, ' ').trim());
  ok(h1zh === '图片处理，不出你的浏览器', `h1 还原 = "${h1zh}"`);
  const stored = await page.evaluate(() => localStorage.getItem('pixkit.lang'));
  ok(stored === 'zh', `localStorage = ${stored}`);

  /* ---------- 3. 刷新后保持中文（即使浏览器是英文） ---------- */
  log('\n[3] 刷新（浏览器仍为 en-US）');
  await page.reload({ waitUntil: 'networkidle0' });
  const lang3 = await page.evaluate(() => document.documentElement.lang);
  const h1after = await page.$eval('h1', el => el.textContent.replace(/\s+/g, ' ').trim());
  ok(lang3 === 'zh-CN' && h1after.startsWith('图片处理'), `刷新后 lang=${lang3}, h1="${h1after}"`);
  await page.close();

  /* ---------- 4. 浏览器中文 → 自动中文 ---------- */
  log('\n[4] zh-CN 首次访问');
  page = await newPage('zh-CN');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  ok(await page.evaluate(() => document.documentElement.lang) === 'zh-CN', 'html lang = zh-CN');
  ok((await page.$eval('h1', el => el.textContent)).includes('图片处理'), 'h1 是中文');
  await page.close();

  /* ---------- 5. 其他语言 → 回落到英文 ---------- */
  log('\n[5] fr-FR 首次访问');
  page = await newPage('fr-FR');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  ok(await page.evaluate(() => document.documentElement.lang) === 'en', 'html lang = en');
  const h1fr = await page.$eval('h1', el => el.textContent.replace(/\s+/g, ' ').trim());
  ok(/Image editing/i.test(h1fr), `h1 = "${h1fr}"`);

  /* ---------- 6. 全站漏译扫描 ---------- */
  log('\n[6] 英文模式下逐页检查漏译');
  let totalMissing = 0;
  for (const path of PAGES) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 250));
    const cjk = await remainingCJK(page);
    const miss = await page.evaluate(() => (window.__i18n ? [...window.__i18n.missing] : []));
    totalMissing += cjk.length;
    log(`  ${cjk.length === 0 ? '✓' : '✗'} ${path}${cjk.length ? ` — ${cjk.length} 处未翻` : ''}`);
    cjk.slice(0, 12).forEach(s => log(`      · ${s}`));
    if (miss.length) log(`      词典缺失 ${miss.length} 条: ${miss.slice(0, 8).join(' / ')}`);
  }
  ok(totalMissing === 0, `全站剩余中文 ${totalMissing} 处`);

  /* ---------- 7. 截图 ---------- */
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'tests/.cache/i18n-home-en.png' });
  await page.goto(`${BASE}/tools/compress/`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'tests/.cache/i18n-compress-en.png' });
  await page.goto(`${BASE}/tools/idphoto/`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'tests/.cache/i18n-idphoto-en.png' });

} finally {
  await browser.close();
}
