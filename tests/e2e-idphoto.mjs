import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import { BASE, CACHE, LAUNCH, log } from './env.mjs';

const OUT = CACHE;
const DL = path.join(CACHE, 'dl');
mkdirSync(DL, { recursive: true });

const browser = await puppeteer.launch(LAUNCH);

try {
  const page = await browser.newPage();
  // 固定中文，避免断言被语言自动判定影响
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('pixkit.lang', 'zh'); } catch {} });
  await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 1 });

  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  const bclient = await browser.target().createCDPSession();
  try {
    await bclient.send('Browser.setDownloadBehavior', {
      behavior: 'allow', downloadPath: DL, eventsEnabled: true,
    });
  } catch (e) {
    const client = await page.createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
  }

  await page.goto(`${BASE}/tools/idphoto/`, { waitUntil: 'networkidle0' });
  log('页面已加载');

  /* 生成一张模拟人像照：浅灰背景 + 头肩剪影 */
  const dataUrl = await page.evaluate(() => {
    const w = 1200, h = 1600;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');

    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#e8ecf1');
    g.addColorStop(1, '#d3dae2');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);

    // 肩膀
    x.beginPath();
    x.ellipse(w / 2, h * 1.02, w * 0.46, h * 0.30, 0, 0, Math.PI * 2);
    x.fillStyle = '#3b4a5e';
    x.fill();

    // 脖子
    x.fillStyle = '#e0b18d';
    x.fillRect(w / 2 - 70, h * 0.62, 140, h * 0.14);

    // 头
    x.beginPath();
    x.ellipse(w / 2, h * 0.48, 185, 235, 0, 0, Math.PI * 2);
    x.fillStyle = '#f0c4a0';
    x.fill();

    // 头发
    x.beginPath();
    x.ellipse(w / 2, h * 0.395, 190, 130, 0, Math.PI, Math.PI * 2);
    x.fillStyle = '#2b2118';
    x.fill();

    // 眼睛
    x.fillStyle = '#2b2118';
    [-70, 70].forEach(dx => {
      x.beginPath();
      x.ellipse(w / 2 + dx, h * 0.475, 20, 12, 0, 0, Math.PI * 2);
      x.fill();
    });

    return c.toDataURL('image/jpeg', 0.92);
  });

  const srcPath = path.join(OUT, 'idphoto-src.jpg');
  writeFileSync(srcPath, Buffer.from(dataUrl.split(',')[1], 'base64'));
  log('生成模拟人像图');

  /* 上传 */
  const input = await page.$('#fileInput');
  await input.uploadFile(srcPath);
  await page.waitForSelector('#editor:not(.hidden)', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 600));

  const dim = await page.$eval('#preview', c => ({ w: c.width, h: c.height }));
  log(`预览画布：${dim.w}×${dim.h}（一寸应为 295×413 的 2 倍 = 590×826）`);

  const badge = await page.$eval('#sizeBadge', el => el.textContent);
  log('规格标注：' + badge);

  await page.click('#centerBtn');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, 'idphoto.png') });

  /* 切换二寸 */
  await page.click('.spec-item[data-id="two"]');
  await new Promise(r => setTimeout(r, 400));
  const dim2 = await page.$eval('#preview', c => ({ w: c.width, h: c.height }));
  log(`切到二寸后画布：${dim2.w}×${dim2.h}（应为 826×1158）`);

  /* 拦截下载，直接拿到生成的图片数据 */
  await page.evaluate(() => {
    window.__dl = [];
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) {
        window.__dl.push({ name: this.download, href: this.href });
        return;
      }
      return orig.apply(this, arguments);
    };
  });

  await page.click('#dlSingle');
  await new Promise(r => setTimeout(r, 900));
  await page.click('#dlSheet');
  await new Promise(r => setTimeout(r, 1600));

  const results = await page.evaluate(async () => {
    const out = [];
    for (const d of window.__dl) {
      const blob = await (await fetch(d.href)).blob();
      const dataUrl = await new Promise(res => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.readAsDataURL(blob);
      });
      // 读回图片真实像素尺寸
      const dim = await new Promise(res => {
        const im = new Image();
        im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight });
        im.src = dataUrl;
      });
      out.push({ name: d.name, bytes: blob.size, ...dim, dataUrl });
    }
    return out;
  });

  log('\n导出结果：');
  for (const r of results) {
    log(`  · ${r.name}`);
    log(`    ${r.w}×${r.h}px, ${(r.bytes / 1024).toFixed(0)} KB`);
    writeFileSync(path.join(OUT, 'out-' + r.name), Buffer.from(r.dataUrl.split(',')[1], 'base64'));
  }

  /* 移动端 */
  await page.setViewport({ width: 390, height: 900, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT, 'idphoto-mobile.png') });

  log('\n页面错误：' + (errors.length ? '\n' + errors.join('\n') : '无'));

} finally {
  await browser.close();
}
