/**
 * 英文模式下的「运行时」检查：
 * 静态文案由 e2e-i18n.mjs 覆盖，这里专门跑真实的工具流程，
 * 看结果列表、状态提示、toast 这些 JS 生成的内容有没有漏翻。
 */

import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'fs';
import path from 'path';
import { BASE, CACHE, LAUNCH, log, ok } from './env.mjs';

const browser = await puppeteer.launch(LAUNCH);

async function enPage(pathname) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'language', { get: () => 'en-US' });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US'] });
  });
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}${pathname}`, { waitUntil: 'networkidle0' });
  return page;
}

async function cjkOn(page) {
  return page.evaluate(() => {
    const out = new Set();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const n = w.currentNode;
      const p = n.parentElement;
      if (!p || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(p.tagName)) continue;
      if (p.closest('.langswitch')) continue;
      const t = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (/[\u4e00-\u9fa5]/.test(t)) out.add(t.slice(0, 70));
    }
    return [...out];
  });
}

/* 造一张有真实细节的 JPEG，避免「纯色图压缩后变大」干扰流程 */
async function makeJpeg(page, name = 'test.jpg') {
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 1400; c.height = 1000;
    const x = c.getContext('2d');
    for (let i = 0; i < 160; i++) {
      x.fillStyle = `hsla(${Math.random() * 360},70%,60%,.35)`;
      x.beginPath();
      x.arc(Math.random() * c.width, Math.random() * c.height, 40 + Math.random() * 160, 0, 7);
      x.fill();
    }
    const d = x.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < d.data.length; i += 4) {
      const n = (Math.random() - .5) * 30;
      d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n;
    }
    x.putImageData(d, 0, 0);
    return c.toDataURL('image/jpeg', .95);
  });
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  const p = path.join(CACHE, name);
  writeFileSync(p, buf);
  return p;
}

async function report(label, page) {
  const cjk = await cjkOn(page);
  const miss = await page.evaluate(() => (window.__i18n ? [...window.__i18n.missing] : []));
  ok(cjk.length === 0, `${label}：剩余中文 ${cjk.length} 处`);
  cjk.slice(0, 10).forEach(s => log(`      · ${s}`));
  if (miss.length) log(`      词典缺失：${miss.slice(0, 8).join(' / ')}`);
}

try {
  /* ---- 压缩：跑完整条链路 ---- */
  log('\n[1] 压缩工具（上传 2 张 → 输出结果行）');
  let page = await enPage('/tools/compress/');
  const f1 = await makeJpeg(page, 'en-a.jpg');
  const f2 = await makeJpeg(page, 'en-b.jpg');
  let input = await page.$('#fileInput');
  await input.uploadFile(f1, f2);
  await page.waitForFunction(() => /Processed/.test(document.getElementById('summary')?.innerHTML || ''), { timeout: 20000 });
  await report('压缩结果区', page);
  await page.screenshot({ path: path.join(CACHE, 'i18n-run-compress.png') });

  /* ---- 证件照 ---- */
  log('\n[2] 证件照（上传 → 规格按钮 → 导出区）');
  page = await enPage('/tools/idphoto/');
  input = await page.$('#fileInput');
  await input.uploadFile(f1);
  await page.waitForSelector('#canvasWrap:not(.hidden)', { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 600));
  await report('证件照', page);
  await page.screenshot({ path: path.join(CACHE, 'i18n-run-idphoto.png') });

  /* ---- EXIF ---- */
  log('\n[3] EXIF（解析 → 分组标签）');
  page = await enPage('/tools/exif/');
  input = await page.$('#fileInput');
  await input.uploadFile(f2);
  await new Promise(r => setTimeout(r, 900));
  await report('EXIF', page);

  /* ---- Base64 ---- */
  log('\n[4] Base64（上传 → 字符数提示）');
  page = await enPage('/tools/base64/');
  input = await page.$('#fileInput');
  await input.uploadFile(f2);
  await new Promise(r => setTimeout(r, 900));
  await report('Base64', page);

  /* ---- 取色器 ---- */
  log('\n[5] 取色器（上传 → 主色板）');
  page = await enPage('/tools/picker/');
  input = await page.$('#fileInput');
  await input.uploadFile(f2);
  await new Promise(r => setTimeout(r, 1200));
  await report('取色器', page);

  /* ---- 结果已渲染后再切换语言 ---- */
  log('\n[6] 已有结果时来回切换（英文 → 中文 → 英文）');
  page = await enPage('/tools/compress/');
  input = await page.$('#fileInput');
  await input.uploadFile(f1);
  await page.waitForFunction(
    () => /Processed/.test(document.getElementById('summary')?.innerHTML || ''),
    { timeout: 20000 }
  );

  await page.click('.langswitch button[data-lang="zh"]');
  await new Promise(r => setTimeout(r, 200));
  const zhSummary = await page.$eval('#summary', el => el.textContent.replace(/\s+/g, ' ').trim());
  ok(/已处理/.test(zhSummary), `切中文后摘要 = "${zhSummary}"`);

  await page.click('.langswitch button[data-lang="en"]');
  await new Promise(r => setTimeout(r, 200));
  const enSummary = await page.$eval('#summary', el => el.textContent.replace(/\s+/g, ' ').trim());
  ok(/Processed/.test(enSummary), `切回英文后摘要 = "${enSummary}"`);
  await report('切换后的结果区', page);

} finally {
  await browser.close();
}
