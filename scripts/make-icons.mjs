/**
 * 生成 PWA 图标（192 / 512 / 512 maskable / 180 apple-touch）
 *
 * 用已装好的 Chrome 渲染内联 SVG 再截图，避免为了几个 PNG 引入图像处理依赖。
 * 品牌色与站点 favicon 保持一致，图形复用同一个 P 字路径。
 */

import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { LAUNCH, ROOT } from '../tests/env.mjs';

const OUT = join(ROOT, 'assets', 'icons');
mkdirSync(OUT, { recursive: true });

const BRAND = '#4f46e5';

/**
 * @param {number} size   画布边长
 * @param {object} opt
 * @param {boolean} opt.rounded  是否要圆角（普通图标要，maskable/apple 要满幅）
 * @param {number} opt.scale     logo 在 512 坐标系里的放大倍数
 * @param {number} opt.radius    圆角半径
 */
function svgDoc(size, { rounded = true, scale = 13, radius = 112 } = {}) {
  return `<!DOCTYPE html>
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  svg { display: block; }
</style>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" ${rounded ? `rx="${radius}"` : ''} fill="${BRAND}"/>
  <g transform="translate(256 256) scale(${scale}) translate(-16 -16)">
    <path d="M10 22V10h5.5a3.5 3.5 0 010 7H12"
          stroke="#ffffff" stroke-width="2.4" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

const TARGETS = [
  { file: 'icon-192.png', size: 192, opt: { rounded: true, scale: 13, radius: 42 } },
  { file: 'icon-512.png', size: 512, opt: { rounded: true, scale: 13, radius: 112 } },
  // maskable：logo 收进中心安全区（直径 80% 的圆），边角随便裁都不切到图形
  { file: 'icon-512-maskable.png', size: 512, opt: { rounded: false, scale: 9 } },
  // iOS 自己会加圆角，这里必须是满幅不透明
  { file: 'icon-180.png', size: 180, opt: { rounded: false, scale: 9.5 } },
];

const browser = await puppeteer.launch(LAUNCH);
try {
  for (const t of TARGETS) {
    const page = await browser.newPage();
    await page.setViewport({ width: t.size, height: t.size, deviceScaleFactor: 1 });
    await page.setContent(svgDoc(t.size, t.opt), { waitUntil: 'load' });
    await page.screenshot({
      path: join(OUT, t.file),
      omitBackground: true,
      clip: { x: 0, y: 0, width: t.size, height: t.size },
    });
    await page.close();
    console.log(`  ✓ ${t.file}  ${t.size}×${t.size}`);
  }
} finally {
  await browser.close();
}

console.log(`\n图标已输出到 assets/icons/`);
