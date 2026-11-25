/**
 * 三个开发者工具的端到端测试
 * - 图片转 Base64
 * - 图片取色器
 * - EXIF 查看与清除（需要构造带 GPS 的真实 JPEG）
 */

import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:8899';
const OUT = 'E:/code/ai/forFun/tests/.cache';
mkdirSync(OUT, { recursive: true });

const log = (...a) => console.log(...a);
const ok = (cond, msg) => log(`  ${cond ? '✓' : '✗'} ${msg}`);

/* ---------------- 构造带 EXIF 的 JPEG ---------------- */

function buildExifApp1() {
  const tiff = Buffer.alloc(220);

  tiff.write('II', 0, 'ascii');          // little-endian
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4);              // IFD0 偏移

  const ifd0 = 8;
  tiff.writeUInt16LE(4, ifd0);           // 4 个条目
  let e = ifd0 + 2;

  // Make = "APP" (内联 4 字节)
  tiff.writeUInt16LE(0x010F, e);
  tiff.writeUInt16LE(2, e + 2);
  tiff.writeUInt32LE(4, e + 4);
  tiff.write('APP\0', e + 8, 'ascii');
  e += 12;

  // Model = "X1" (内联 3 字节)
  tiff.writeUInt16LE(0x0110, e);
  tiff.writeUInt16LE(2, e + 2);
  tiff.writeUInt32LE(3, e + 4);
  tiff.write('X1\0', e + 8, 'ascii');
  e += 12;

  // DateTime（20 字节，走偏移）
  tiff.writeUInt16LE(0x0132, e);
  tiff.writeUInt16LE(2, e + 2);
  tiff.writeUInt32LE(20, e + 4);
  tiff.writeUInt32LE(62, e + 8);
  e += 12;

  // GPSInfo 指针 -> 82
  tiff.writeUInt16LE(0x8825, e);
  tiff.writeUInt16LE(4, e + 2);
  tiff.writeUInt32LE(1, e + 4);
  tiff.writeUInt32LE(82, e + 8);
  e += 12;

  tiff.writeUInt32LE(0, e);              // 下一个 IFD = 0

  tiff.write('2024:01:15 10:30:00\0', 62, 'ascii');

  // GPS IFD @ 82（4 个条目：纬度引用/纬度/经度引用/经度）
  const gps = 82;
  tiff.writeUInt16LE(4, gps);
  let g = gps + 2;

  // GPSLatitudeRef = "N"
  tiff.writeUInt16LE(0x0001, g);
  tiff.writeUInt16LE(2, g + 2);
  tiff.writeUInt32LE(2, g + 4);
  tiff.write('N\0', g + 8, 'ascii');
  g += 12;

  // GPSLatitude -> 136
  tiff.writeUInt16LE(0x0002, g);
  tiff.writeUInt16LE(5, g + 2);
  tiff.writeUInt32LE(3, g + 4);
  tiff.writeUInt32LE(136, g + 8);
  g += 12;

  // GPSLongitudeRef = "E"
  tiff.writeUInt16LE(0x0003, g);
  tiff.writeUInt16LE(2, g + 2);
  tiff.writeUInt32LE(2, g + 4);
  tiff.write('E\0', g + 8, 'ascii');
  g += 12;

  // GPSLongitude -> 160
  tiff.writeUInt16LE(0x0004, g);
  tiff.writeUInt16LE(5, g + 2);
  tiff.writeUInt32LE(3, g + 4);
  tiff.writeUInt32LE(160, g + 8);
  g += 12;

  tiff.writeUInt32LE(0, g);

  // 39° 54' 27" = 39.9075
  [[39, 1], [54, 1], [27, 1]].forEach(([n, d], i) => {
    tiff.writeUInt32LE(n, 136 + i * 8);
    tiff.writeUInt32LE(d, 136 + i * 8 + 4);
  });

  // 116° 24' 26" = 116.4072
  [[116, 1], [24, 1], [26, 1]].forEach(([n, d], i) => {
    tiff.writeUInt32LE(n, 160 + i * 8);
    tiff.writeUInt32LE(d, 160 + i * 8 + 4);
  });

  const tiffBuf = tiff.subarray(0, 184);
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), tiffBuf]);

  const app1 = Buffer.alloc(4 + payload.length);
  app1[0] = 0xFF;
  app1[1] = 0xE1;
  app1.writeUInt16BE(payload.length + 2, 2);
  payload.copy(app1, 4);
  return app1;
}

/* ---------------- 主流程 ---------------- */

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--disable-gpu', '--hide-scrollbars'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });

  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  /* ---------- 生成测试图 ---------- */
  await page.goto(`${BASE}/tools/base64/`, { waitUntil: 'networkidle0' });

  const dataUrl = await page.evaluate(() => {
    const w = 640, h = 480;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');

    // 四个色块，方便验证取色和主色提取
    const colors = ['#e11d48', '#0ea5e9', '#22c55e', '#f59e0b'];
    colors.forEach((col, i) => {
      x.fillStyle = col;
      x.fillRect((i % 2) * w / 2, Math.floor(i / 2) * h / 2, w / 2, h / 2);
    });

    return c.toDataURL('image/jpeg', 0.9);
  });

  const plainJpg = path.join(OUT, 'plain.jpg');
  writeFileSync(plainJpg, Buffer.from(dataUrl.split(',')[1], 'base64'));

  /* ---------- 1. Base64 ---------- */
  log('\n[1] 图片转 Base64');
  let input = await page.$('#fileInput');
  await input.uploadFile(plainJpg);
  await page.waitForSelector('#result:not(.hidden)', { timeout: 8000 });
  await new Promise(r => setTimeout(r, 400));

  const uriText = await page.$eval('#output', el => el.textContent);
  ok(uriText.startsWith('data:image/jpeg;base64,'), '输出是合法的 Data URI');
  ok(uriText.length > 1000, `Base64 长度 ${uriText.length} 字符`);

  await page.click('.fmt-tab[data-fmt="css"]');
  await new Promise(r => setTimeout(r, 200));
  const cssText = await page.$eval('#output', el => el.textContent);
  ok(cssText.startsWith('background-image: url("data:image/jpeg'), 'CSS 格式正确');

  await page.click('.fmt-tab[data-fmt="html"]');
  await new Promise(r => setTimeout(r, 200));
  const htmlText = await page.$eval('#output', el => el.textContent);
  ok(htmlText.startsWith('<img src="data:'), 'HTML 格式正确');

  const metaTxt = await page.$eval('#meta', el => el.textContent.replace(/\s+/g, ' '));
  ok(/\+\d+%/.test(metaTxt), `体积膨胀提示：${metaTxt.trim()}`);

  await page.screenshot({ path: path.join(OUT, 'dev-base64.png') });

  /* ---------- 2. 取色器 ---------- */
  log('\n[2] 图片取色器');
  await page.goto(`${BASE}/tools/picker/`, { waitUntil: 'networkidle0' });
  input = await page.$('#fileInput');
  await input.uploadFile(plainJpg);
  await page.waitForSelector('#workspace:not(.hidden)', { timeout: 8000 });
  await new Promise(r => setTimeout(r, 600));

  const paletteCount = await page.$$eval('.palette-item', els => els.length);
  ok(paletteCount >= 3, `提取到 ${paletteCount} 个主色`);

  const paletteHex = await page.$$eval('.palette-item', els => els.map(e => e.dataset.hex));
  log('    色板：' + paletteHex.join(' '));

  // 移动到左上角红色块中心
  const box = await page.$eval('#pickerCanvas', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });

  await page.mouse.move(box.x + box.w * 0.25, box.y + box.h * 0.25);
  await new Promise(r => setTimeout(r, 250));

  const hexAtRed = await page.$eval('#valHex', el => el.textContent);
  ok(hexAtRed !== '—', `左上角取色 = ${hexAtRed}`);

  // 放大镜是否出现
  const magOn = await page.$eval('#magnifier', el => el.classList.contains('is-on'));
  ok(magOn, '放大镜已激活');

  // 点右下角橙色块
  await page.mouse.click(box.x + box.w * 0.75, box.y + box.h * 0.75);
  await new Promise(r => setTimeout(r, 300));
  const hexAtOrange = await page.$eval('#valHex', el => el.textContent);
  ok(hexAtOrange !== hexAtRed, `右下角取色 = ${hexAtOrange}（与左上不同）`);

  const historyCount = await page.$$eval('#history span', els => els.length);
  ok(historyCount >= 1, `取色记录 ${historyCount} 条`);

  await page.screenshot({ path: path.join(OUT, 'dev-picker.png') });

  /* ---------- 3. EXIF ---------- */
  log('\n[3] EXIF 查看与清除');

  const jpegBuf = Buffer.from(dataUrl.split(',')[1], 'base64');
  const withExif = Buffer.concat([jpegBuf.subarray(0, 2), buildExifApp1(), jpegBuf.subarray(2)]);
  const exifPath = path.join(OUT, 'with-exif.jpg');
  writeFileSync(exifPath, withExif);
  log(`    构造带 EXIF 的 JPEG：${withExif.length} 字节（原 ${jpegBuf.length}）`);

  await page.goto(`${BASE}/tools/exif/`, { waitUntil: 'networkidle0' });
  input = await page.$('#fileInput');
  await input.uploadFile(exifPath);
  await page.waitForSelector('#workspace:not(.hidden)', { timeout: 8000 });
  await new Promise(r => setTimeout(r, 500));

  const metaText = await page.$eval('#metaArea', el => el.textContent.replace(/\s+/g, ' '));
  ok(metaText.includes('位置信息'), '识别出 GPS 分组');
  ok(metaText.includes('39.907500'), '纬度解析正确 (39.907500)');
  ok(metaText.includes('APP'), '相机厂商解析正确');
  ok(metaText.includes('2024:01:15'), '拍摄时间解析正确');

  const groupCount = await page.$$eval('.meta-group', els => els.length);
  ok(groupCount >= 3, `共 ${groupCount} 个元数据分组`);

  await page.screenshot({ path: path.join(OUT, 'dev-exif.png') });

  /* 拦截下载，验证清除结果 */
  await page.evaluate(() => {
    window.__dl = [];
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) { window.__dl.push({ name: this.download, href: this.href }); return; }
      return orig.apply(this, arguments);
    };
  });

  await page.click('#cleanBtn');
  await new Promise(r => setTimeout(r, 1200));

  const cleaned = await page.evaluate(async () => {
    if (!window.__dl.length) return null;
    const blob = await (await fetch(window.__dl[0].href)).blob();
    const buf = new Uint8Array(await blob.arrayBuffer());
    // 检查字节里是否还有 Exif 标记
    let hasExif = false;
    for (let i = 0; i < buf.length - 6; i++) {
      if (buf[i] === 0x45 && buf[i + 1] === 0x78 && buf[i + 2] === 0x69
          && buf[i + 3] === 0x66 && buf[i + 4] === 0x00) { hasExif = true; break; }
    }
    const dataUrl = await new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(blob);
    });
    return { name: window.__dl[0].name, size: blob.size, hasExif, dataUrl };
  });

  if (!cleaned) {
    ok(false, '下载未触发');
  } else {
    ok(!cleaned.hasExif, '输出文件已不含 EXIF 标记');
    ok(cleaned.size < withExif.length, `体积 ${withExif.length} → ${cleaned.size} 字节`);

    // 关键：验证图像数据本身没被重编码（逐字节比对 SOI 之后的图像部分）
    const cleanedBuf = Buffer.from(cleaned.dataUrl.split(',')[1], 'base64');
    writeFileSync(path.join(OUT, 'cleaned.jpg'), cleanedBuf);

    const tailLen = 20000;
    const origTail = jpegBuf.subarray(jpegBuf.length - tailLen);
    const cleanTail = cleanedBuf.subarray(cleanedBuf.length - tailLen);
    ok(origTail.equals(cleanTail), `图像数据尾部 ${tailLen} 字节完全一致（未重新编码）`);
  }

  log('\n页面错误：' + (errors.length ? '\n' + errors.join('\n') : '无'));

} finally {
  await browser.close();
}
