/**
 * 构建产物检查（不需要浏览器，秒级）
 *
 * 这里验的是"部署出去的东西对不对"，不是页面功能：
 *   - 仓库源码有没有漏进 dist（之前真出过，/package.json 能直接下载）
 *   - 资源版本号有没有打上（打不上就等于长缓存会发旧文件）
 *   - FAQ 结构化数据跟页面可见内容是否一致
 *   - sw.js 的缓存版本和预缓存列表有没有跟着指纹走
 */

import { execFileSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, relative, sep } from 'path';
import { fileURLToPath } from 'url';
import { readFaq } from '../scripts/faq.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

let pass = 0;
let fail = 0;
export const ok = (cond, msg) => {
  cond ? pass++ : fail++;
  console.log(`  ${cond ? '✓' : '✗'} ${msg}`);
};

/* ---------- 先构建 ---------- */
console.log('\n[构建] 生成 dist');
const out = execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-dist.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
const m = out.match(/资源版本：([a-f0-9]+)/);
ok(!!m, '构建输出里带资源版本号');
const V = m ? m[1] : '';

/* ---------- 1. 不该发布的文件 ---------- */
console.log('\n[白名单] 源码不能进部署目录');
for (const bad of ['tests', 'scripts', 'package.json', 'package-lock.json', 'README.md', 'wrangler.jsonc', '.gitignore', 'node_modules']) {
  ok(!existsSync(join(DIST, bad)), `dist 不含 ${bad}`);
}

/* ---------- 2. 必需文件 ---------- */
console.log('\n[必需文件]');
for (const f of ['index.html', '404.html', 'robots.txt', 'sitemap.xml', '_headers', 'sw.js', 'manifest.webmanifest']) {
  ok(existsSync(join(DIST, f)), `${f} 存在`);
}

/* ---------- 3. 遍历页面 ---------- */
function list(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...list(p));
    else out.push(p);
  }
  return out;
}

const pages = list(DIST).filter(f => f.endsWith('.html'));
const rel = f => relative(DIST, f).split(sep).join('/');
const srcOf = f => join(ROOT, rel(f));   // 对应的源文件，用来比对可见 FAQ

console.log(`\n[页面] 共 ${pages.length} 个`);

let unversioned = 0;
let faqPages = 0;
let mismatch = 0;

for (const f of pages) {
  const html = readFileSync(f, 'utf8');

  // 3.1 所有 css/js 引用都要带当前版本号
  const refs = [...html.matchAll(/(?:href|src)="(\/assets\/(?:css|js)\/[^"]+)"/g)];
  const bad = refs.filter(r => !r[1].endsWith(`?v=${V}`));
  if (bad.length) {
    unversioned++;
    console.log(`     ${rel(f)}: ${bad.map(b => b[1]).join(', ')}`);
  }

  // 3.2 FAQ：条数必须与源页面可见问答一致
  //     预设页是构建期生成的，源仓库里没有对应文件 —— 这类页面直接拿 dist 自己的内容对账
  const generated = !existsSync(srcOf(f));
  const src = generated ? html : readFileSync(srcOf(f), 'utf8');
  const visible = readFaq(src);

  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ld) {
    if (visible.length >= 2) { mismatch++; console.log(`     ${rel(f)}: 有 ${visible.length} 条问答但没生成 schema`); }
    continue;
  }

  faqPages++;
  let json = null;
  try { json = JSON.parse(ld[1]); } catch { mismatch++; console.log(`     ${rel(f)}: JSON 解析失败`); continue; }

  if (json['@type'] !== 'FAQPage') { mismatch++; console.log(`     ${rel(f)}: @type 不是 FAQPage`); continue; }
  const qs = json.mainEntity || [];
  if (qs.length !== visible.length) {
    mismatch++;
    console.log(`     ${rel(f)}: schema ${qs.length} 条 vs 页面 ${visible.length} 条`);
    continue;
  }
  // 3.3 文字要真的来自页面，不能是编的
  for (let i = 0; i < qs.length; i++) {
    if (qs[i].name !== visible[i].q || qs[i].acceptedAnswer.text !== visible[i].a) {
      mismatch++;
      console.log(`     ${rel(f)}: 第 ${i + 1} 条与页面文字不一致`);
      break;
    }
  }
}

ok(unversioned === 0, '所有页面引用的 css/js 都带版本号');
ok(faqPages >= 11, `FAQPage 覆盖 ${faqPages} 个页面（首页 + 工具页 + 预设页）`);
ok(mismatch === 0, 'FAQ 结构化数据与页面可见内容完全一致');

/* ---------- 4. 模块依赖也带版本 ---------- */
console.log('\n[模块] JS 之间的 import');
const jsDir = join(DIST, 'assets', 'js');
const jsFiles = readdirSync(jsDir).filter(n => n.endsWith('.js'));
let plainImports = 0;
for (const n of jsFiles) {
  const code = readFileSync(join(jsDir, n), 'utf8');
  for (const im of code.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
    if (!im[1].includes('?v=')) { plainImports++; console.log(`     ${n}: ${im[1]}`); }
  }
}
ok(plainImports === 0, '模块间的相对 import 都带版本号');

/* ---------- 5. sw.js ---------- */
console.log('\n[Service Worker]');
const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
ok(sw.includes(`'v1-${V}'`), '缓存版本号跟资源指纹绑定（发布即换缓存）');
const shell = sw.match(/const SHELL = \[([\s\S]*?)\];/)?.[1] || '';
const shellAssets = [...shell.matchAll(/['"](\/assets\/[^'"]+)['"]/g)].map(x => x[1]);
// 图标不加版本号：manifest 里写的是固定路径，加了反而对不上
const versioned = shellAssets.filter(u => /\/(css|js)\//.test(u));
const plainShell = versioned.filter(u => !u.includes('?v='));
ok(versioned.length > 0 && plainShell.length === 0, `预缓存里的 css/js 全部带版本号（${versioned.length} 项）`);

/* ---------- 6. _headers ---------- */
console.log('\n[缓存策略]');
const headers = readFileSync(join(DIST, '_headers'), 'utf8');
ok(/\/assets\/css\/\*[\s\S]*?max-age=31536000/.test(headers), 'css 一年 immutable');
ok(/\/assets\/js\/\*[\s\S]*?max-age=31536000/.test(headers), 'js 一年 immutable');
ok(/\/assets\/icons\/\*[\s\S]*?max-age=86400/.test(headers), '图标只缓存 1 天（路径固定，不能 immutable）');
ok(/\/sw\.js[\s\S]*?no-store/.test(headers), 'sw.js 不缓存');

/* ---------- 7. 域名一致性 ---------- */
console.log('\n[域名]');
const DOMAIN = 'pixkit.1573834694.workers.dev';
for (const f of ['index.html', 'sitemap.xml', 'robots.txt']) {
  const txt = readFileSync(join(DIST, f), 'utf8');
  ok(txt.includes(DOMAIN), `${f} 指向 ${DOMAIN}`);
}
const allText = pages.map(f => readFileSync(f, 'utf8')).join('\n');
ok(!allText.includes('example.com') && !allText.includes('pages.dev'), '页面里没有残留的旧占位域名');

/* ---------- 结果 ---------- */
console.log(`\n${fail === 0 ? '✓ 构建检查通过' : '✗ 构建检查未通过'}：${pass} 项通过，${fail} 项失败\n`);
process.exit(fail === 0 ? 0 : 1);
