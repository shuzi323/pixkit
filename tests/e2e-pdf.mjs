/**
 * 图片转 PDF 的端到端测试
 *
 * 手写 PDF 结构最容易错的是 xref 偏移量表 —— 错一个字节，Acrobat 就打不开，
 * 但浏览器预览器可能照样显示。所以这里不只检查"文件像不像 PDF"，
 * 而是真的把 xref 读出来，逐个验证偏移量指向正确的对象。
 */

import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { BASE, CACHE as OUT, LAUNCH, log } from './env.mjs';

mkdirSync(OUT, { recursive: true });

let pass = 0;
let fail = 0;
const ok = (cond, msg) => { cond ? pass++ : fail++; console.log(`  ${cond ? '✓' : '✗'} ${msg}`); };

const browser = await puppeteer.launch(LAUNCH);

try {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('pixkit.lang', 'zh'); } catch {} });
  await page.setViewport({ width: 1280, height: 1100 });

  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  log('\n[1] 页面加载');
  await page.goto(`${BASE}/tools/pdf/`, { waitUntil: 'networkidle0' });
  ok((await page.title()).includes('图片转 PDF'), '标题正确');

  /* ---------- 造两张不同比例的图 ---------- */
  const made = await page.evaluate(async () => {
    const mk = async (w, h, color) => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.fillStyle = color; x.fillRect(0, 0, w, h);
      x.fillStyle = '#fff'; x.font = 'bold 64px sans-serif';
      x.fillText(`${w}×${h}`, 40, 100);
      return new Promise(r => c.toBlob(b => r(b), 'image/png'));
    };
    const out = [];
    for (const [w, h, color, name] of [[2400, 1800, '#1e3a8a', '横向照片.png'], [900, 1600, '#7c2d12', '竖图.png']]) {
      const blob = await mk(w, h, color);
      const buf = new Uint8Array(await blob.arrayBuffer());
      out.push({ name, bytes: [...buf] });
    }
    return out;
  });

  const files = made.map(m => {
    // 放在子目录里但保留原文件名 —— 上传后页面显示的应该是原名
    const dir = path.join(OUT, 'pdf-in');
    mkdirSync(dir, { recursive: true });
    const p = path.join(dir, m.name);
    writeFileSync(p, Buffer.from(m.bytes));
    return p;
  });

  log('\n[2] 添加图片');
  await (await page.$('#fileInput')).uploadFile(...files);
  await page.waitForFunction(
    () => document.querySelectorAll('#fileList .file-row').length === 2 &&
          /2400 × 1800/.test(document.getElementById('fileList').textContent),
    { timeout: 8000 }
  );

  const rows = await page.$$eval('#fileList .file-row', els => els.map(el => ({
    name: el.querySelector('.file-row__name').textContent.trim(),
    index: el.querySelector('.file-row__index').textContent.trim(),
    meta: el.querySelector('.file-row__meta').textContent.replace(/\s+/g, ' ').trim(),
  })));
  ok(rows.length === 2, `列表 ${rows.length} 行`);
  ok(rows[0].index === '1' && rows[1].index === '2', '序号 1 / 2');
  ok(rows[0].name === '横向照片.png', `第一行 = ${rows[0].name}`);
  ok(/2400 × 1800/.test(rows[0].meta), `尺寸读出来了：${rows[0].meta}`);

  const summary = await page.$eval('#summary', el => el.textContent.replace(/\s+/g, ' ').trim());
  ok(/2 张图片/.test(summary) && /共 2 页/.test(summary), `摘要：${summary}`);

  log('\n[3] 调整顺序');
  await page.$$eval('#fileList .file-row', els => {
    els[1].querySelector('button[data-act="up"]').click();
  });
  await page.waitForFunction(() => {
    const first = document.querySelector('#fileList .file-row .file-row__name');
    return first && first.textContent.trim() === '竖图.png';
  }, { timeout: 4000 });
  ok(true, '下移后第二张变第一张');

  const disabled = await page.$eval('#fileList .file-row button[data-act="up"]', b => b.disabled);
  ok(disabled, '第一行的上移按钮已禁用');

  /* ---------- 捕获下载的 PDF ---------- */
  await page.evaluate(() => {
    window.__dl = [];
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) { window.__dl.push({ name: this.download, href: this.href }); return; }
      return orig.apply(this, arguments);
    };
  });

  const grab = async () => page.evaluate(async () => {
    const d = window.__dl[window.__dl.length - 1];
    if (!d) return null;
    const buf = new Uint8Array(await (await fetch(d.href)).arrayBuffer());
    // PDF 结构是 ASCII，内容里的 JPEG 是二进制；按 latin1 逐字节转成字符串便于做结构断言
    let s = '';
    for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
    return { name: d.name, size: buf.length, text: s };
  });

  log('\n[4] 生成 A4 纵向');
  await page.click('#makeBtn');
  await page.waitForFunction(() => !document.getElementById('output').classList.contains('hidden'), { timeout: 20000 });
  const outStat = await page.$eval('#outStat', el => el.textContent.replace(/\s+/g, ' ').trim());
  ok(/2 页/.test(outStat), `输出信息：${outStat}`);

  await page.click('#dlBtn');
  await new Promise(r => setTimeout(r, 800));
  const a4 = await grab();

  ok(!!a4, '拿到下载文件');
  ok(a4 && a4.name.endsWith('.pdf'), `文件名：${a4?.name}`);
  ok(a4 && a4.text.startsWith('%PDF-1.4'), '文件头是 %PDF-1.4');
  ok(a4 && a4.text.trimEnd().endsWith('%%EOF'), '文件尾是 %%EOF');

  const count = a4?.text.match(/\/Type \/Pages[^>]*\/Count (\d+)/)?.[1];
  ok(count === '2', `/Count = ${count}`);
  ok((a4?.text.match(/\/Type \/Page[^s]/g) || []).length === 2, '/Type /Page 出现 2 次');
  ok((a4?.text.match(/\/Filter \/DCTDecode/g) || []).length === 2, '2 张图都按 JPEG 内嵌');
  ok(/\/MediaBox \[0 0 595\.28 841\.89\]/.test(a4?.text), 'MediaBox 是 A4 纵向 595.28 × 841.89');

  /* xref 偏移量：每个都该指向 "N 0 obj" */
  const xrefCheck = (() => {
    const s = a4?.text || '';
    const m = s.match(/startxref\s+(\d+)/);
    if (!m) return { ok: false, why: '没有 startxref' };
    const at = +m[1];
    if (s.slice(at, at + 4) !== 'xref') return { ok: false, why: `startxref 指向的不是 xref：${s.slice(at, at + 10)}` };

    const lines = s.slice(at).split('\n');
    const total = +lines[1].split(' ')[1];
    for (let i = 1; i < total; i++) {
      const off = +lines[2 + i].slice(0, 10);
      const expect = `${i} 0 obj`;
      if (s.slice(off, off + expect.length) !== expect) {
        return { ok: false, why: `对象 ${i} 偏移 ${off} 指向 "${s.slice(off, off + 12)}"` };
      }
    }
    return { ok: true, total: total - 1 };
  })();
  ok(xrefCheck.ok, `xref 偏移量全部正确（${xrefCheck.total ?? '?'} 个对象）${xrefCheck.ok ? '' : ' — ' + xrefCheck.why}`);

  /* /Length 必须和流的实际字节数一致，否则阅读器会截断图片 */
  const lenCheck = (() => {
    const s = a4?.text || '';
    const re = /\/Length (\d+) >>\nstream\n/g;
    let m; let n = 0;
    while ((m = re.exec(s))) {
      const len = +m[1];
      const start = m.index + m[0].length;
      if (s.slice(start + len, start + len + 10) !== '\nendstream') {
        return { ok: false, why: `第 ${n + 1} 个流声明 ${len} 字节，实际边界对不上` };
      }
      n++;
    }
    return { ok: n >= 3, n };
  })();
  ok(lenCheck.ok, `/Length 与实际字节数一致（${lenCheck.n ?? '?'} 个流）${lenCheck.ok ? '' : ' — ' + lenCheck.why}`);

  /* 内嵌的确实是完整 JPEG：FFD8 开头、FFD9 结尾 */
  const jpegCheck = (() => {
    const s = a4?.text || '';
    const re = /\/Filter \/DCTDecode \/Length (\d+) >>\nstream\n/g;
    let m; let n = 0;
    while ((m = re.exec(s))) {
      const len = +m[1];
      const start = m.index + m[0].length;
      const head = s.slice(start, start + 3);
      const tail = s.slice(start + len - 2, start + len);
      if (head !== '\xff\xd8\xff' || tail !== '\xff\xd9') {
        return { ok: false, why: `第 ${n + 1} 张图不是完整 JPEG（头 ${[...head].map(c => c.charCodeAt(0).toString(16))}）` };
      }
      n++;
    }
    return { ok: n === 2, n };
  })();
  ok(jpegCheck.ok, `两张图都是完整 JPEG（FFD8…FFD9，共 ${jpegCheck.n} 张）${jpegCheck.ok ? '' : ' — ' + jpegCheck.why}`);

  /* 图片比例：两张原图分别是 900×1600 和 2400×1800，都要保持原比例 */
  const cms = [...(a4?.text || '').matchAll(/([\d.]+) 0 0 ([\d.]+) ([\d.]+) ([\d.]+) cm/g)];
  const ratios = cms.map(m => +m[1] / +m[2]);
  const near = (a, b) => Math.abs(a - b) < 0.005;
  ok(ratios.length === 2, `两页各有一处图片绘制指令（${ratios.length}）`);
  ok(near(ratios[0], 900 / 1600), `第 1 页是竖图 900:1600（实测 ${ratios[0].toFixed(3)}）`);
  ok(near(ratios[1], 2400 / 1800), `第 2 页是照片 2400:1800（实测 ${ratios[1].toFixed(3)}）`);
  ok(cms.every(m => +m[1] < 595.28 && +m[2] < 841.89), '每张图都完整落在页面内（没有被裁切）');
  ok(cms.every(m => +m[3] > 0 && +m[4] > 0), '图片位置为正数（没有画到纸外面）');

  log('\n[5] 切换 A4 横向');
  await page.select('#pageSize', 'a4l');
  const hiddenAfterChange = await page.$eval('#output', el => el.classList.contains('hidden'));
  ok(hiddenAfterChange, '改设置后旧的生成结果自动隐藏（避免下到过期文件）');

  await page.click('#makeBtn');
  await page.waitForFunction(() => !document.getElementById('output').classList.contains('hidden'), { timeout: 20000 });
  await page.click('#dlBtn');
  await new Promise(r => setTimeout(r, 800));
  const a4l = await grab();
  ok(/\/MediaBox \[0 0 841\.89 595\.28\]/.test(a4l?.text), '横向 MediaBox 841.89 × 595.28');

  log('\n[6] 跟随图片尺寸');
  await page.select('#pageSize', 'auto');
  await page.click('#makeBtn');
  await page.waitForFunction(() => !document.getElementById('output').classList.contains('hidden'), { timeout: 20000 });
  await page.click('#dlBtn');
  await new Promise(r => setTimeout(r, 800));
  const auto = await grab();
  // 900×1600 在 96dpi 下换算 675×1200，加两侧 36pt 边距 → 747 × 1272
  ok(/\/MediaBox \[0 0 747 1272\]/.test(auto?.text), `跟随图片：MediaBox 747 × 1272（${auto?.text.match(/\/MediaBox \[[^\]]+\]/)?.[0]}）`);
  ok((auto?.text.match(/\/Type \/Page[^s]/g) || []).length === 2, '仍是 2 页（两张图比例不同，各占一页）');

  log('\n[7] 清空');
  await page.click('#clearBtn');
  const cleared = await page.evaluate(() => ({
    rows: document.querySelectorAll('#fileList .file-row').length,
    results: document.getElementById('results').classList.contains('hidden'),
    output: document.getElementById('output').classList.contains('hidden'),
  }));
  ok(cleared.rows === 0, '列表已清空');
  ok(cleared.results && cleared.output, '设置面板与输出区都收起来了');

  ok(errors.length === 0, errors.length ? `控制台有错误：${errors.slice(0, 3).join(' | ')}` : '控制台无错误');
} finally {
  await browser.close();
}

log(`\n${fail === 0 ? '✓ PDF 测试全部通过' : '✗ 有失败项'}：${pass} 项通过，${fail} 项失败\n`);
process.exit(fail === 0 ? 0 : 1);
