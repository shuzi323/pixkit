import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:8899';
const OUT = 'E:/code/ai/forFun/tests/.cache';
mkdirSync(OUT, { recursive: true });

const log = (...a) => console.log(...a);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--disable-gpu', '--hide-scrollbars'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1100, deviceScaleFactor: 1 });

  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error') errors.push('CONSOLE: ' + m.text());
  });

  await page.goto(`${BASE}/tools/compress/`, { waitUntil: 'networkidle0' });
  log('页面已加载');

  /* ---- 在页面内生成真实测试图 ---- */
  const dataUrls = await page.evaluate(async () => {
    function make(w, h, hue) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');

      const g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, `hsl(${hue}, 70%, 22%)`);
      g.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 65%, 45%)`);
      g.addColorStop(1, `hsl(${(hue + 130) % 360}, 80%, 62%)`);
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);

      for (let i = 0; i < 700; i++) {
        x.beginPath();
        x.arc(Math.random() * w, Math.random() * h, Math.random() * (w / 22), 0, Math.PI * 2);
        x.fillStyle = `hsla(${Math.random() * 360}, 75%, 60%, ${Math.random() * 0.4})`;
        x.fill();
      }

      // 叠加噪点，模拟真实照片的高频细节
      const d = x.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 26;
        d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n;
      }
      x.putImageData(d, 0, 0);

      return c.toDataURL('image/jpeg', 0.95);
    }
    return [
      { name: '日落风景_大图.jpg', data: make(2400, 1800, 200) },
      { name: '产品主图.jpg', data: make(1600, 1200, 30) },
      { name: 'avatar.png', data: make(900, 900, 280) },
    ].map(o => ({ ...o, data: o.data }));
  });

  const files = [];
  for (const { name, data } of dataUrls) {
    const buf = Buffer.from(data.split(',')[1], 'base64');
    const p = path.join(OUT, name);
    writeFileSync(p, buf);
    files.push(p);
    log(`生成测试图 ${name} — ${(buf.length / 1024).toFixed(0)} KB`);
  }

  /* ---- 上传 ---- */
  const input = await page.$('#fileInput');
  await input.uploadFile(...files);

  /* ---- 等待处理完成 ---- */
  await page.waitForFunction(
    () => {
      const st = document.getElementById('summary');
      return st && /已处理\s*<strong>3<\/strong>/.test(st.innerHTML);
    },
    { timeout: 30000 }
  );

  const summary1 = await page.$eval('#summary', el => el.textContent.replace(/\s+/g, ' ').trim());
  log('\n[质量 80% 模式] ' + summary1);

  const rows = await page.$$eval('.file-row', els => els.map(el => ({
    name: el.querySelector('.file-row__name').textContent,
    meta: el.querySelector('.file-row__meta').textContent.replace(/\s+/g, ' ').trim(),
  })));
  rows.forEach(r => log(`  · ${r.name} → ${r.meta}`));

  await page.screenshot({ path: path.join(OUT, 'compress-result.png'), fullPage: false });

  /* ---- 切到「按目标大小 200KB」 ---- */
  await page.select('#mode', 'target');
  await page.evaluate(() => {
    const t = document.getElementById('targetSize');
    t.value = 200;
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.waitForFunction(
    () => {
      const st = document.getElementById('summary');
      return st && /已处理\s*<strong>3<\/strong>/.test(st.innerHTML)
        && !document.querySelector('.spinner');
    },
    { timeout: 40000 }
  );
  await new Promise(r => setTimeout(r, 1200));

  const targetMeta = await page.$$eval('.file-row__meta', els =>
    els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  log('\n[按目标大小 200KB 模式]');
  targetMeta.forEach(m => log('  · ' + m));

  await page.screenshot({ path: path.join(OUT, 'compress-target.png') });

  /* ---- 手机端 ---- */
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, 'compress-mobile.png') });

  log('\n页面错误：' + (errors.length ? '\n' + errors.join('\n') : '无'));

} finally {
  await browser.close();
}
