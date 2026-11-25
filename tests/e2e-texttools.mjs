/**
 * 文本类工具端到端测试
 * Base64 转图片 / 时间戳转换 / JSON 格式化排序
 */

import puppeteer from 'puppeteer-core';
import { BASE, LAUNCH, CACHE, log, ok } from './env.mjs';
import path from 'path';

const browser = await puppeteer.launch(LAUNCH);
const errors = [];

async function newPage() {
  const page = await browser.newPage();
  // 固定中文，避免语言自动判定影响断言
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('pixkit.lang', 'zh'); } catch { /* ignore */ }
  });
  await page.setViewport({ width: 1280, height: 900 });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });
  return page;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function typeInto(page, sel, value) {
  await page.$eval(sel, (el, v) => {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

const text = (page, sel) => page.$eval(sel, el => el.textContent.replace(/\s+/g, ' ').trim());
const rawText = (page, sel) => page.$eval(sel, el => el.textContent);
const hidden = (page, sel) => page.$eval(sel, el => el.classList.contains('hidden'));

try {
  /* ============================================================
     1. Base64 转图片
     ============================================================ */
  log('\n[1] Base64 转图片');
  let page = await newPage();
  await page.goto(`${BASE}/tools/b64img/`, { waitUntil: 'networkidle0' });

  // 示例图：105 字节的 32×32 PNG
  await page.click('#sampleBtn');
  await sleep(500);

  const dim = await page.$eval('#thumb', el => ({ w: el.naturalWidth, h: el.naturalHeight }));
  ok(dim.w === 32 && dim.h === 32, `示例图尺寸 ${dim.w}×${dim.h}`);
  ok(!(await hidden(page, '#out')), '结果区已显示');
  ok(await hidden(page, '#err'), '没有报错');

  const meta = await text(page, '#meta');
  ok(/PNG/.test(meta) && /32 × 32/.test(meta) && /105 B/.test(meta), `元信息: ${meta}`);

  // data URI 换成页面自己编码的 JPEG，验证真实格式识别
  const jpegInfo = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 48;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(0, 0, 64, 48);
    const uri = c.toDataURL('image/jpeg', 0.92);
    const ta = document.getElementById('input');
    ta.value = uri;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return { head: uri.slice(0, 30) };
  });
  await sleep(600);

  const jdim = await page.$eval('#thumb', el => ({ w: el.naturalWidth, h: el.naturalHeight }));
  ok(jdim.w === 64 && jdim.h === 48, `JPEG 尺寸 ${jdim.w}×${jdim.h}`);
  ok(/JPG/.test(await text(page, '#meta')), '识别为 JPG');

  // 纯 Base64（去掉 data: 前缀）也必须能解
  await page.evaluate(() => {
    const ta = document.getElementById('input');
    ta.value = ta.value.replace(/^data:[^,]*,/, '');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await sleep(600);
  ok(!(await hidden(page, '#out')), '纯 Base64 也能解码');

  // 非法字符
  await typeInto(page, '#input', 'hello world!!!');
  await sleep(400);
  ok(!(await hidden(page, '#err')), '非法内容会报错');
  ok((await text(page, '#err')).includes('Base64'), `报错内容: ${await text(page, '#err')}`);

  // 下载文件名
  await page.evaluate(() => {
    window.__dl = [];
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) { window.__dl.push(this.download); return; }
      return orig.apply(this, arguments);
    };
  });
  await page.click('#sampleBtn');
  await sleep(400);
  await page.click('#dlBtn');
  await sleep(300);
  const dls = await page.evaluate(() => window.__dl);
  ok(dls.length === 1 && dls[0] === 'base64-image.png', `下载文件名: ${dls.join(',')}`);

  await page.screenshot({ path: path.join(CACHE, 'text-b64img.png') });
  await page.close();

  /* ============================================================
     2. 时间戳转换
     ============================================================ */
  log('\n[2] 时间戳转换');
  page = await newPage();
  await page.goto(`${BASE}/tools/timestamp/`, { waitUntil: 'networkidle0' });

  await typeInto(page, '#tsIn', '1700000000');
  await sleep(200);

  const rows = await page.$$eval('#tsKv .kv__row', rs =>
    rs.map(r => [
      r.querySelector('.kv__k').textContent.trim(),
      r.querySelector('.kv__v').textContent.trim(),
    ])
  );
  const get = k => (rows.find(([a]) => a === k) || [])[1];

  const expected = new Date(1700000000 * 1000);
  const pad = n => String(n).padStart(2, '0');
  const localStr = `${expected.getFullYear()}-${pad(expected.getMonth() + 1)}-${pad(expected.getDate())} ` +
                   `${pad(expected.getHours())}:${pad(expected.getMinutes())}:${pad(expected.getSeconds())}`;

  ok(get('本地时间') === localStr, `本地时间 ${get('本地时间')}`);
  ok(get('UTC') === '2023-11-14 22:13:20 UTC', `UTC ${get('UTC')}`);
  ok(get('ISO 8601') === '2023-11-14T22:13:20.000Z', `ISO ${get('ISO 8601')}`);
  ok(get('星期') === '星期三', `星期 ${get('星期')}`);
  ok(get('识别单位') === '秒 · 10 位数字', `识别单位 ${get('识别单位')}`);

  // 13 位毫秒
  await typeInto(page, '#tsIn', '1700000000000');
  await sleep(200);
  const unitMs = await page.$eval('#tsKv .kv__row:last-child .kv__v', el => el.textContent.trim());
  ok(unitMs === '毫秒 · 13 位数字', `13 位识别为 ${unitMs}`);

  // 手动指定单位：13 位强行当秒解
  await typeInto(page, '#tsIn', '1700000000000');
  await page.click('[data-unit="s"]');
  await sleep(200);
  const manualS = await page.$eval('#tsKv .kv__row:last-child .kv__v', el => el.textContent.trim());
  ok(manualS === '秒 · 手动指定', `手动指定秒: ${manualS}`);
  const isoFar = await page.$$eval('#tsKv .kv__v', els => els[2].textContent.trim());
  ok(/^\+0\d{5}-/.test(isoFar), `13 位当秒解得到远期年份: ${isoFar}`);

  // 反过来：10 位当毫秒
  await typeInto(page, '#tsIn', '1700000000');
  await page.click('[data-unit="ms"]');
  await sleep(200);
  const isoMs = await page.$$eval('#tsKv .kv__v', els => els[2].textContent.trim());
  ok(isoMs === '1970-01-20T16:13:20.000Z', `10 位当毫秒解: ${isoMs}`);
  const manualMs = await page.$eval('#tsKv .kv__row:last-child .kv__v', el => el.textContent.trim());
  ok(manualMs === '毫秒 · 手动指定', `手动指定毫秒: ${manualMs}`);

  // 切回自动
  await page.click('[data-unit="auto"]');
  await sleep(200);
  const backAuto = await page.$eval('#tsKv .kv__row:last-child .kv__v', el => el.textContent.trim());
  ok(backAuto === '秒 · 10 位数字', `切回自动: ${backAuto}`);

  // 负数
  await typeInto(page, '#tsIn', '-86400');
  await sleep(200);
  const isoNeg = await page.$$eval('#tsKv .kv__v', els => els[2].textContent.trim());
  ok(isoNeg === '1969-12-31T00:00:00.000Z', `负数时间戳 ${isoNeg}`);

  // 非法输入
  await typeInto(page, '#tsIn', 'abc');
  await sleep(200);
  ok(!(await hidden(page, '#tsErr')), '非数字会报错');

  // 日期 → 时间戳
  await typeInto(page, '#dateIn', '2026-11-25T17:18:00');
  await sleep(200);
  const dRows = await page.$$eval('#dateKv .kv__row', rs =>
    rs.map(r => [
      r.querySelector('.kv__k').textContent.trim(),
      r.querySelector('.kv__v').textContent.trim(),
    ])
  );
  const expectSec = String(Math.floor(new Date('2026-11-25T17:18:00').getTime() / 1000));
  const gotSec = (dRows.find(([k]) => k === '秒级') || [])[1];
  ok(gotSec === expectSec, `日期转时间戳 ${gotSec} (期望 ${expectSec})`);

  // 快捷按钮
  await page.click('[data-ts="today"]');
  await sleep(150);
  const todaySec = await page.$eval('#tsIn', el => el.value);
  ok(/^\d{10}$/.test(todaySec), `今天 0 点是 10 位: ${todaySec}`);

  await page.screenshot({ path: path.join(CACHE, 'text-timestamp.png') });
  await page.close();

  /* ============================================================
     3. JSON 格式化 / 排序
     ============================================================ */
  log('\n[3] JSON 格式化与排序');
  page = await newPage();
  await page.goto(`${BASE}/tools/json/`, { waitUntil: 'networkidle0' });

  const SRC = '{"name":"PixKit","z":1,"nested":{"d":4,"c":3},"list":[{"b":2,"a":1}]}';
  await typeInto(page, '#input', SRC);
  await sleep(400);

  let out = await rawText(page, '#output');
  ok(out.startsWith('{\n  "name"'), '格式化后有缩进');
  ok(out.indexOf('"name"') < out.indexOf('"z"'), '不排序时保持原顺序');

  await page.select('#sortSel', 'asc');
  await sleep(300);
  out = await text(page, '#output');
  const order = [...out.matchAll(/"(\w+)":/g)].map(m => m[1]);
  ok(order.slice(0, 6).join(',') === 'list,name,nested,z,d,c' || order[0] === 'list',
     `A→Z 排序: ${order.join(',')}`);

  // 嵌套对象和数组内的对象也要排
  ok(/\{\s*"a": 1,\s*"b": 2\s*\}/.test(out), '数组内的对象也按 A→Z 排');

  await page.select('#sortSel', 'desc');
  await sleep(300);
  out = await text(page, '#output');
  ok(out.indexOf('"z"') < out.indexOf('"name"'), 'Z→A 排序生效');

  // 压缩
  await page.click('#modeTabs .fmt-tab[data-mode="minify"]');
  await sleep(300);
  out = await text(page, '#output');
  ok(!/\n/.test(out) && out.length < SRC.length + 20, `压缩为单行 (${out.length} 字符)`);

  // 语法错误定位
  await page.click('#modeTabs .fmt-tab[data-mode="pretty"]');
  await typeInto(page, '#input', '{\n  "a": 1,\n  "b": 2,\n}');
  await sleep(400);
  ok(!(await hidden(page, '#err')), '尾逗号会报错');
  const errText = await text(page, '#err');
  ok(/第 4 行/.test(errText), `错误定位: ${errText.slice(0, 60)}`);
  ok(errText.includes('尾逗号'), '提示尾逗号问题');

  // 注释
  await typeInto(page, '#input', '{"a": 1 /* note */}');
  await sleep(400);
  ok((await text(page, '#err')).includes('注释'), '提示不支持注释');

  // 单引号
  await typeInto(page, '#input', "{'a': 1}");
  await sleep(400);
  ok((await text(page, '#err')).includes('单引号'), '提示单引号问题');

  // 大整数精度
  await typeInto(page, '#input', '{"id": 12345678901234567890}');
  await sleep(400);
  ok(!(await hidden(page, '#warn')), '大整数会警告');
  const warnText = await text(page, '#warn');
  ok(/12345678901234567890/.test(warnText), `警告内容: ${warnText.slice(0, 80)}`);

  // 统计
  await typeInto(page, '#input', SRC);
  await sleep(400);
  const st = await text(page, '#stats');
  ok(/键/.test(st) && /层级/.test(st), `统计: ${st}`);

  // 下载
  await page.evaluate(() => {
    window.__dl = [];
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) { window.__dl.push(this.download); return; }
      return orig.apply(this, arguments);
    };
  });
  await page.click('#dlBtn');
  await sleep(300);
  const jsonDl = await page.evaluate(() => window.__dl);
  ok(jsonDl[0] === 'formatted.json', `下载文件名: ${jsonDl.join(',')}`);

  await page.screenshot({ path: path.join(CACHE, 'text-json.png') });
  await page.close();

  /* ---------- 4. 控制台错误 ---------- */
  log('\n[4] 控制台错误');
  ok(errors.length === 0, errors.length ? errors.slice(0, 5).join(' | ') : '三个页面均无 JS 报错');

} finally {
  await browser.close();
}
