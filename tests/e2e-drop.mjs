/**
 * 拖拽与粘贴的统一行为测试
 *
 * 背景：以前六个图片工具各写一套取文件逻辑，行为不一致 ——
 * 有的必须把图精确丢进虚线框，丢到页面空白处浏览器会直接打开这张图，
 * 当前页面就没了。现在统一走 common.js 的 bindFilePicker。
 *
 * 这里验证的是"丢在页面任意位置都算数"，以及粘贴同样生效。
 * 自己起服务器，不依赖 npm run dev。
 */

import puppeteer from 'puppeteer-core';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { ROOT, LAUNCH, log, ok } from './env.mjs';

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
  const target = normalize(join(ROOT, pathname.endsWith('/') ? pathname + 'index.html' : pathname));
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
log(`测试服务器 ${BASE}\n`);

let failed = 0;
const check = (cond, msg) => { if (!cond) failed++; ok(cond, msg); };

const browser = await puppeteer.launch(LAUNCH);

/** 在页面里造一张图，然后按指定方式投递 */
async function feed(page, how, mime = 'image/png') {
  return page.evaluate(async ({ mode, mime }) => {
    const c = document.createElement('canvas');
    c.width = 240; c.height = 160;
    const x = c.getContext('2d');
    x.fillStyle = '#e11d48';
    x.fillRect(0, 0, 240, 160);
    const blob = await new Promise(r => c.toBlob(r, mime, 0.9));
    const ext = mime === 'image/jpeg' ? 'jpg' : 'png';
    const file = new File([blob], `drop-test.${ext}`, { type: mime });
    const dt = new DataTransfer();
    dt.items.add(file);

    const target = mode === 'zone'
      ? document.getElementById('dropzone')
      : document.body;

    if (mode === 'paste') {
      document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    } else {
      target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    }
    return blob.size;
  }, { mode: how, mime });
}

try {
  const page = await browser.newPage();
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- 1. 丢在页面空白处也要生效 ---------- */

  log('[丢在空白处] 不要求对准虚线框');

  const cases = [
    {
      slug: 'compress',
      name: '压缩',
      // 文件名出现在待处理列表里
      done: () => /drop-test\.png/.test(document.body.innerText),
    },
    {
      slug: 'idphoto',
      name: '证件照',
      // 编辑器从隐藏切到显示
      done: () => !document.getElementById('editor').classList.contains('hidden'),
    },
    {
      slug: 'picker',
      name: '取色器',
      done: () => /^#[0-9a-f]{6}$/i.test(document.getElementById('valHex').textContent.trim()),
    },
    {
      slug: 'exif',
      name: 'EXIF',
      mime: 'image/jpeg',
      // 文件信息里的尺寸/段数是 onload 之后才填的，用 textContent 判断（innerText 受可见性影响）
      done: () => document.getElementById('fileInfo').textContent.trim().length > 0,
    },
    {
      slug: 'convert',
      name: '格式转换',
      done: () => /drop-test\.png/.test(document.body.innerText),
    },
    {
      slug: 'resize',
      name: '改尺寸',
      done: () => /drop-test\.png/.test(document.body.innerText),
    },
  ];

  for (const c of cases) {
    await page.goto(`${BASE}/tools/${c.slug}/`, { waitUntil: 'networkidle2' });
    const before = page.url();
    // EXIF 只解析 JPEG，喂 PNG 会被它正确拒绝
    const size = await feed(page, 'body', c.mime);

    await page.waitForFunction(c.done, { timeout: 6000 }).catch(() => {});
    const worked = await page.evaluate(c.done);
    const stayed = page.url() === before;

    check(worked, `${c.name}：丢在页面空白处也能载入（${size}B）`);
    check(stayed, `${c.name}：没有跳走（drop 的默认行为被拦住）`);

    const stuck = await page.evaluate(() =>
      !!document.querySelector('.is-over')
    );
    check(!stuck, `${c.name}：高亮状态没有卡住`);
  }

  /* ---------- 2. 丢进虚线框仍然正常 ---------- */

  log('\n[丢进虚线框] 原来的方式不能坏');
  await page.goto(`${BASE}/tools/compress/`, { waitUntil: 'networkidle2' });
  await feed(page, 'zone');
  await page.waitForFunction(() => /drop-test\.png/.test(document.body.innerText), { timeout: 6000 }).catch(() => {});
  check(await page.evaluate(() => /drop-test\.png/.test(document.body.innerText)), '压缩：拖进虚线框生效');

  /* ---------- 3. Ctrl+V 粘贴 ---------- */

  log('\n[粘贴] 剪贴板里的图能直接进来');
  await page.goto(`${BASE}/tools/picker/`, { waitUntil: 'networkidle2' });
  await feed(page, 'paste');
  await page.waitForFunction(
    () => /^#[0-9a-f]{6}$/i.test(document.getElementById('valHex').textContent.trim()),
    { timeout: 6000 }
  ).catch(() => {});
  check(
    await page.evaluate(() => /^#[0-9a-f]{6}$/i.test(document.getElementById('valHex').textContent.trim())),
    '取色器：粘贴图片后取到颜色'
  );

  /* ---------- 4. 非图片文件不该被吃进去 ---------- */

  log('\n[过滤] 丢一个 txt 进去应该没反应');
  await page.goto(`${BASE}/tools/compress/`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(['hello'], 'note.txt', { type: 'text/plain' }));
    document.body.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  });
  await wait(600);
  check(
    await page.evaluate(() => !/note\.txt/.test(document.body.innerText)),
    '压缩：txt 文件被忽略'
  );
} finally {
  await browser.close();
  server.close();
}

console.log(`\n${failed === 0 ? '✓ 拖拽粘贴全部通过' : '✗ 有失败项'}：${failed} 项失败\n`);
process.exit(failed === 0 ? 0 : 1);
