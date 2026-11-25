/**
 * 生成干净的部署目录 dist/ 并做三件构建期的事：
 *
 * 1. 白名单拷贝：只放行 index.html / 404.html / robots.txt / sitemap.xml /
 *    _headers / manifest.webmanifest / sw.js / assets / tools。
 *    Cloudflare 的构建机上没有 dist，所以这一步必须由构建命令现场跑。
 *
 * 2. 资源指纹：按 assets 的真实内容算一个短哈希，追加到 HTML 里的 css/js 引用、
 *    JS 模块之间的相对 import、以及 sw.js 的预缓存列表上。
 *    这样 /assets/* 才能设一年 immutable —— 内容一变 URL 就变，不存在拿旧文件的可能。
 *
 * 3. FAQ 结构化数据：从每页可见的「常见问题」区块抽取，注入 FAQPage JSON-LD。
 *    内容改了就重建，schema 自动跟着变，不会出现"页面说 A、schema 说 B"。
 */

import {
  rmSync, mkdirSync, cpSync, readdirSync, statSync, existsSync,
  readFileSync, writeFileSync,
} from 'fs';
import { join, dirname, resolve, relative, sep } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { injectFaq } from './faq.mjs';

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

/* ---------------- 工具函数 ---------------- */

/** 递归列出所有文件的绝对路径，顺序稳定（影响哈希结果） */
function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

/** 把绝对路径转成站内 URL 路径，Windows 的反斜杠换成 / */
function toUrlPath(file) {
  return '/' + relative(DIST, file).split(sep).join('/');
}

/** 目录页 → /tools/json/，普通页 → /404.html */
function pageUrl(file) {
  const url = toUrlPath(file);
  return url.endsWith('/index.html') ? url.slice(0, -'index.html'.length) : url;
}

/* ---------------- 1. 算资源指纹 ---------------- */

const assetFiles = listFiles(join(DIST, 'assets'));
const hash = createHash('sha256');
for (const f of assetFiles) {
  hash.update(toUrlPath(f));            // 文件名也参与，改名也算变更
  hash.update(readFileSync(f));
}
// 10 位足够：1/36^10 的碰撞概率，且文件名短一点好读
const V = hash.digest('hex').slice(0, 10);

/* ---------------- 2. 改写引用 ---------------- */

/** HTML：只给 css/js 加版本号，图标不加（manifest 里写的是固定路径） */
function versionHtml(html) {
  return html.replace(
    /((?:href|src)=")(\/assets\/(?:css|js)\/[^"?]+)(")/g,
    (_, a, url, b) => `${a}${url}?v=${V}${b}`
  );
}

/** 模块之间的相对 import 也要带版本号，否则入口更新了、依赖还是旧的 */
function versionImports(js) {
  return js.replace(
    /(\bfrom\s*['"])(\.{1,2}\/[^'"?]+\.js)(['"])/g,
    (_, a, spec, b) => `${a}${spec}?v=${V}${b}`
  );
}

/** sw.js：预缓存列表带上版本号，缓存版本号也跟着走 —— 每次发布自动换一代缓存 */
function versionSw(js) {
  return js
    .replace(/const VERSION = 'v1'/, `const VERSION = 'v1-${V}'`)
    .replace(/(['"])(\/assets\/(?:css|js)\/[^'"?]+)(['"])/g, (_, a, url, b) => `${a}${url}?v=${V}${b}`);
}

const htmlFiles = listFiles(DIST).filter(f => f.endsWith('.html'));
const jsFiles = assetFiles.filter(f => f.endsWith('.js'));

for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  writeFileSync(f, injectFaq(versionHtml(html), pageUrl(f)));
}

for (const f of jsFiles) {
  writeFileSync(f, versionImports(readFileSync(f, 'utf8')));
}

const swFile = join(DIST, 'sw.js');
writeFileSync(swFile, versionSw(readFileSync(swFile, 'utf8')));

/* ---------------- 统计 ---------------- */

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

// 构建后自检：路径写错时立刻炸掉，不要等线上白屏
const mustExist = ['index.html', '404.html', 'sw.js', 'manifest.webmanifest', '_headers'];
for (const f of mustExist) {
  if (!existsSync(join(DIST, f))) {
    console.error(`\n✗ 构建产物缺少 ${f}，检查 INCLUDE 列表\n`);
    process.exit(1);
  }
}

console.log(`\n✓ dist 已生成`);
console.log(`  文件数：${files}`);
console.log(`  总体积：${(bytes / 1024).toFixed(0)} KB`);
console.log(`  资源版本：${V}`);
console.log(`  FAQ 结构化数据：${htmlFiles.length} 个页面已处理`);
console.log(`\n下一步：`);
console.log(`  自动部署 → 推送到 GitHub，Cloudflare Workers 会按 build command 自动构建`);
console.log(`  命令行   → npm run deploy（读 wrangler.jsonc，上传 dist）`);
console.log(`  只预演   → npm run deploy:dry\n`);
