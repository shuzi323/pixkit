/**
 * 生成干净的部署目录 dist/
 * 排除 node_modules、tests、.workbuddy 等无关文件，
 * 避免直接拖整个项目到 Cloudflare Pages 时上传一堆垃圾。
 */

import { rmSync, mkdirSync, cpSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// 用脚本自身位置推项目根目录，而不是写死绝对路径。
// 否则云端构建机（Linux）上 E:/code/ai/forFun 根本不存在，构建必挂。
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const INCLUDE = [
  'index.html',
  '404.html',
  'robots.txt',
  'sitemap.xml',
  '_headers',
  'manifest.webmanifest',
  'sw.js',
  'assets',
  'tools',
];

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

for (const item of INCLUDE) {
  const src = join(ROOT, item);
  if (!existsSync(src)) {
    console.warn(`  ! 跳过（不存在）: ${item}`);
    continue;
  }
  cpSync(src, join(DIST, item), { recursive: true });
}

/* 统计 */
function walk(dir) {
  let files = 0, bytes = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      const sub = walk(p);
      files += sub.files; bytes += sub.bytes;
    } else {
      files++; bytes += st.size;
    }
  }
  return { files, bytes };
}

const { files, bytes } = walk(DIST);

console.log(`\n✓ dist 已生成`);
console.log(`  文件数：${files}`);
console.log(`  总体积：${(bytes / 1024).toFixed(0)} KB`);
console.log(`\n下一步：`);
console.log(`  自动部署 → 推送到 GitHub，Cloudflare Workers 会按 build command 自动构建`);
console.log(`  命令行   → npm run deploy（读 wrangler.jsonc，上传 dist）`);
console.log(`  只预演   → npm run deploy:dry\n`);
