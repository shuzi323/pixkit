# PixKit — 纯前端工具站（图片 + 开发者）

一个零成本运行的在线工具站。所有处理都在用户浏览器里完成，服务器只负责发静态文件。

## 现在有什么

| 工具 | 路径 | 说明 |
|---|---|---|
| 图片批量压缩 | `/tools/compress/` | 支持「按目标大小」精确压缩（二分查找质量），批量处理，打包下载 |
| 证件照制作 | `/tools/idphoto/` | 一寸/二寸/护照/美签等标准规格裁剪，一键排版 6 寸相纸 |
| 格式转换 | `/tools/convert/` | JPG/PNG/WebP/AVIF/GIF/BMP 互转 |
| 批量改尺寸 | `/tools/resize/` | 最大边长等比缩放 |
| 图片转 Base64 | `/tools/base64/` | Data URI / CSS / HTML / Markdown 四种格式输出 |
| 图片取色器 | `/tools/picker/` | 像素放大镜取色，HEX/RGB/HSL 复制，自动提取主色板 |
| 清除照片 EXIF | `/tools/exif/` | 解析 GPS/设备/时间信息，无损删除（不重新编码） |
| Base64 转图片 | `/tools/b64img/` | 靠字节魔数识别真实格式，纯 Base64 也能解，直接下载 |
| 时间戳转换 | `/tools/timestamp/` | 秒/毫秒/微秒自动识别 + 手动指定，同时给本地/UTC/ISO/相对时间 |
| JSON 格式化与排序 | `/tools/json/` | 美化、压缩、键名递归排序，报错定位到行列并给出修改建议 |

## 技术特点

- **零构建**：纯 HTML + 原生 ES Module，没有 webpack/vite，改完刷新就生效
- **零运行时依赖**：不用 React、不用任何 npm 包，全部手写
- **手写 ZIP 打包**：`assets/js/common.js` 里 100 行实现的 store 模式 ZIP，不引入 JSZip
- **架构即隐私**：服务器上没有接收图片的接口，用户想验证也验证不出东西来
- **中英双语**：中文是唯一源码，英文运行时替换，切换不刷新、选择会记住
- **能装到桌面、断网可用**：manifest + Service Worker，装上之后连网络都不需要
- **文本工具无依赖**：JSON / 时间戳 / Base64 解码全部手写，连格式化库都没引

### 文件结构

```
/
├── index.html                    首页（带工具搜索与分类筛选）
├── 404.html                      错误页（需在 nginx 里配置）
├── manifest.webmanifest          PWA 清单
├── sw.js                         Service Worker（离线缓存策略）
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── css/style.css             全站样式
│   ├── icons/                    PWA 图标（192 / 512 / 512-maskable / 180）
│   └── js/
│       ├── common.js             ZIP 打包 / 图片解码 / 格式检测 / 剪贴板
│       ├── i18n.js               语言判定、DOM 翻译、切换器
│       ├── i18n.en.js            英文词典（站点 UI + 动态文案规则）
│       ├── i18n.tools.js         英文词典（四个图片工具页 + EXIF 字段名）
│       ├── i18n.text.js          英文词典（三个文本工具页）
│       ├── pwa.js                Service Worker 注册 + 安装引导
│       ├── home.js               首页搜索与分类筛选
│       ├── compare.js            压缩前后对比（可拖动分割线）
│       ├── compress.js           压缩引擎（convert / resize 也复用这个）
│       ├── idphoto.js            证件照
│       ├── base64.js             图片转 Base64
│       ├── picker.js             取色器
│       ├── exif.js               EXIF 解析与无损清除
│       ├── b64img.js             Base64 转图片（魔数嗅探）
│       ├── timestamp.js          时间戳换算
│       └── json.js               JSON 格式化 / 排序 / 错误定位
└── tools/
    ├── compress/index.html
    ├── idphoto/index.html
    ├── convert/index.html
    ├── resize/index.html
    ├── base64/index.html
    ├── picker/index.html
    ├── exif/index.html
    ├── b64img/index.html
    ├── timestamp/index.html
    └── json/index.html
```

## 中英切换

### 行为

| 场景 | 结果 |
|---|---|
| 浏览器首选语言是 `zh-*` | 中文 |
| 其它语言（en / ja / fr…） | 英文（默认兜底） |
| 用户点过切换器 | 记住选择，写进 `localStorage['pixkit.lang']`，之后永远优先 |
| 切换时 | 不刷新页面，`<html lang>`、`<title>`、meta 描述同步更新 |

### 实现方式：中文原文即键

没有往 HTML 里塞 `data-i18n` 标记，而是：

1. 首次翻译时把每个文本节点的**中文原文存进 WeakMap**
2. 切英文时按词典替换；词典里查不到就保留中文（不会变成空白或 key）
3. 切回中文时直接写回 WeakMap 里的原文 —— 零损耗，不怕漏

这样 HTML 保持中文单一源。新增文案时忘了翻译，最坏结果是「英文界面里露出一句中文」，不会被标记错位搞成半中半英。

动态插入的内容（结果列表、toast）由 `MutationObserver` 兜底；带数字的文案（`共 3 张`、`已消除 12%`）用 `i18n.en.js` 里的 `RULES` 正则处理。

**在 JS 里用 `t()` 渲染的内容要自己重渲染。** 因为 `t()` 输出的是「当前语言」的结果，不归 WeakMap 管，切换语言时不会自动变。监听 `pixkit:langchange` 重新渲染即可，参考 `compress.js` 里的 `updateSummary()`。

### 新增或修改文案

```bash
# 1. 直接在 HTML 里写中文，不用加任何标记
# 2. 跑测试，它会列出还没翻译的句子
npm run test:i18n

# 3. 把缺的句子补进 assets/js/i18n.en.js / i18n.tools.js / i18n.text.js
```

测试会输出「剩余中文 N 处」和「词典缺失 xxx」，按提示补即可，不会漏。

### 已知限制：英文内容不进搜索引擎

英文是运行时替换的，爬虫拿到的 HTML 仍是中文。对中文站没影响，但如果要做英文 SEO，需要给英文独立路径（`/en/tools/compress/`）静态输出，或者用 Cloudflare 的 Transform Rules 按 `Accept-Language` 做边缘改写。现在没做，因为英文流量还没到需要它的量级。

### 已知限制：词典随每个页面加载

三个词典文件（`i18n.en.js` / `i18n.tools.js` / `i18n.text.js`）合计约 35KB（gzip），由 `i18n.js` 静态 import —— 中文访客也要下载。换来的是零闪烁：语言在首屏渲染前就定了，不会先闪一下中文再变英文。如果以后英文流量很低、又在意首屏，可以改成 `lang === 'en'` 时动态 `import()`，代价是英文访客会看到一瞬中文。


## 离线可用（PWA）

这个站跟 PWA 是天然契合的：**所有计算本来就在本地，唯一需要网络的是「把代码下载下来」这一步。** 装上之后，压缩、转格式、做证件照、格式化 JSON 全都不需要联网 —— 不是"降级体验"，功能一个不少。

### 用户怎么用上

| 场景 | 表现 |
|---|---|
| Chrome / Edge / Android | 右下角出现「安装到桌面」胶囊，点一下装成独立窗口应用 |
| iOS Safari | 同一位置出现按钮，点开是手动指引（Safari 不支持自动安装事件）|
| 点过胶囊上的「×」 | 记进 `localStorage['pixkit.installDismissed']`，之后不再打扰 |
| 什么都不做 | 普通浏览器里照样用，只是没有离线能力 |

### 缓存策略

| 请求类型 | 策略 | 原因 |
|---|---|---|
| 页面导航 | network-first + 3 秒超时回退缓存 | 在线时永远是最新版，弱网或断网才用缓存 |
| 静态资源（JS / CSS / 图） | stale-while-revalidate | 先给缓存秒开，后台再取新版 |
| 预缓存 | install 时主动拉 CSS + 核心 JS | 保证「刚装完就断网」也能打开 |

**页面导航故意不用 cache-first。** 工具站改版频繁，HTML 一旦缓存优先，用户会长期看到旧版，而且没有任何手段能通知他刷新。

离线打开一个从没访问过的页面时，SW 返回一个自制的提示页（说明还没缓存、给个回首页的链接），而不是让浏览器弹「网络连接已断开」。

### 改缓存策略时

`sw.js` 顶部有 `const VERSION = 'v1'`，**改策略就 +1**，旧缓存在 `activate` 时会被清掉：

```js
const VERSION = 'v2';
```

只改 HTML / JS 不用动它 —— `sw.js` 自己的字节变了，浏览器就会装新版 SW，页面缓存保留。

### 两个必须知道的坑

1. **`sw.js` 绝对不能被缓存。** `_headers` 里已经写了 `no-store`。哪天换回 nginx 部署，记得加：
   ```nginx
   location = /sw.js {
       add_header Cache-Control "no-cache, no-store, must-revalidate";
   }
   ```
   否则 SW 自己被缓存住，用户永远拿不到新策略，线上改什么都「不生效」。

2. **本地必须走 https 或 localhost。** 用 `http://192.168.x.x:8899` 打开时 SW 不注册 —— 浏览器规定，不是 bug。

### 图标

`assets/icons/` 下四个文件由 `scripts/make-icons.mjs` 用本机 Chrome 渲染 SVG 再截图生成，不引图像库：

```bash
npm run icons
```

改了品牌色或 logo 就重跑一次。`192` / `512` 是普通图标，`512-maskable` 的图形缩在中心安全区内（Android 会按圆形、方圆形等各种形状裁切），`180` 给 iOS 用，必须是满幅不透明。

## 本地预览

```bash
cd E:/code/ai/forFun
python -m http.server 8899
# 打开 http://localhost:8899
```

必须用 HTTP 服务打开，直接双击 `index.html` 会因为 ES Module 的 CORS 限制而失败。

## 部署

### 方案一：Nginx（你自己的服务器）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/pixkit;
    index index.html;

    # 目录自动补 index.html
    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }

    error_page 404 /404.html;

    # 静态资源长缓存（文件名带版本号时可设为 1y）
    location /assets/ {
        expires 7d;
        add_header Cache-Control "public";
    }

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/json;
    gzip_min_length 1024;
}
```

上传：`rsync -avz --exclude node_modules --exclude tests ./ user@server:/var/www/pixkit/`

### 方案二：Cloudflare Workers 静态资源（当前方案）

**先回答最常问的：不需要域名。** 部署完会送你一个 `项目名.账号ID.workers.dev`，可以直接用。当前线上地址是 `https://pixkit.1573834694.workers.dev`。

但有两个现实问题要提前知道：

1. **`*.workers.dev` 在国内不稳定**。这类域名常遭 DNS 污染，部分运营商/时段会解析到 `127.0.0.1`。绑定自己的域名能明显改善。
2. **Cloudflare 在中国大陆没有节点**。即使绑了域名，大陆访客仍然走境外节点，延迟在 200–300ms。能用，但不是"快"。

所以判断标准很简单：**先上线验证就用 Workers（免费、5 分钟搞定）；如果后面确认流量主要来自国内且在乎体验，再迁回自己的服务器**。纯静态站迁移成本几乎为零。

#### 必须有的 `wrangler.jsonc`

Workers 和 Pages 有一处关键区别：**Pages 会自动把 `404.html` 当错误页、自动只发构建产物；Workers 不会，什么都得显式声明。**

项目根目录的 `wrangler.jsonc` 就干这件事：

```jsonc
{
  "name": "pixkit",
  "compatibility_date": "2025-11-01",
  "assets": {
    "directory": "./dist",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"
  }
}
```

漏掉这两项会出什么问题（都是在线上真实踩到的）：

| 漏掉什么 | 后果 |
|---|---|
| `directory: ./dist` | 部署成了**整个仓库根目录**，`/tests/e2e-compress.mjs`、`/package.json`、`/.gitignore`、`/README.md` 全部返回 200，可以直接下载。测试代码和构建脚本一起公开。 |
| `not_found_handling: 404-page` | 访问不存在的地址返回**正文 0 字节的空 404**，`404.html` 根本不生效。 |

改完可以这样自查（两项都应该是 404）：

```bash
curl -o /dev/null -w "%{http_code}\n" https://你的域名/tests/e2e-compress.mjs
curl -o /dev/null -w "%{http_code}\n" https://你的域名/package.json
```

#### 方式 A：Git 集成（推荐）

Cloudflare 拉 GitHub 仓库 → 自己跑构建 → 自动上线。push 一次更新一次，不用本地打包。

Dashboard → **Workers & Pages** → **Create** → **Import a repository**，配置：

| 项 | 值 |
|---|---|
| Build command | `node scripts/build-dist.mjs` |
| Deploy command | `npx wrangler deploy` |
| 环境变量（建议） | `NODE_VERSION=22` |

**Build command 必须填。** 这个站「零构建」说的是运行时没有打包步骤，但 `dist/` 是 `npm run dist` 从仓库里筛出来的干净子集 —— 没有 `tests/`、`scripts/`、`package.json`。

`scripts/build-dist.mjs` 用 `import.meta.url` 反推项目根目录，不是写死的绝对路径。这点很关键：上一版写死了 `E:/code/ai/forFun`，在 Linux 构建机上必然 `ENOENT`。

构建流程上的几个要点：

- Cloudflare 检测到 `package.json` 会先自动跑 `npm install`。`puppeteer-core` 只在测试里用，不下载 Chromium，装起来很快
- `dist/` 在 `.gitignore` 里，正常 —— 每次构建现生成
- `_headers`、`404.html`、`robots.txt`、`sitemap.xml` 都随 `dist` 发布，Workers 静态资源同样识别 `_headers`
- 构建失败时会继续用上一次成功的版本对外服务，站点不会挂

#### 方式 B：命令行手动部署（应急用）

```bash
npm run dist          # 生成干净的 dist/ 目录
npm run deploy        # 等价于 build-dist + wrangler deploy，读 wrangler.jsonc
```

首次使用需要 `npx wrangler login`。适合改完想立刻看线上效果、不想等 Cloudflare 构建的时候。

想先看会发哪些文件、不发出去：

```bash
npm run deploy:dry
```

#### 顺序很关键：先修配置，再推代码

`wrangler.jsonc` 是「发什么」的开关。如果先推代码、后加配置，中间这一版仍然会把整个仓库暴露出去。所以顺序是：

1. 本地确认 `wrangler.jsonc` 已在仓库里
2. push
3. 等构建完，用上面那两条 `curl` 自查是不是 404
4. 如果仍是 200，说明 Dashboard 里配的 assets 目录没被 `wrangler.jsonc` 覆盖 —— 去项目 Settings → Build 里检查 build/deploy command 是否按上表填的

#### 绑定自己的域名

1. Worker 项目 → **Settings → Domains & Routes → Add → Custom domain**
2. 如果域名已经托管在 Cloudflare：自动加 CNAME，通常几十秒生效
3. 如果域名在别处（阿里云/腾讯云）：它会给你一个 CNAME 目标，去原服务商加一条解析

**两个必踩的坑：**

- **一定要先在 Cloudflare 后台添加域名，再去配 DNS**。反过来操作会得到 522 错误。
- 如果域名配了 CAA 记录，要放行 Cloudflare 的证书机构，否则 HTTPS 证书签不下来。需要放行：`letsencrypt.org`、`pki.goog`、`ssl.com`。
- 根域名（裸域）接入要求把 NS 服务器整体切到 Cloudflare；只想用子域名（`tools.your-domain.com`）则 CNAME 即可。

#### `_headers` 文件

项目根目录已经有 `_headers`，构建时会进 `dist/`，Workers 静态资源会自动读取并应用（线上已验证生效）。当前配置：

- HTML 不缓存（改了内容用户立刻能看到）
- `/assets/*` 缓存 1 天（文件名没有 hash，不能设更长）
- `/sw.js` 用 `no-store`、`/manifest.webmanifest` 用 1 小时 —— 规则要写在 `/*` 前面，按从上到下的顺序匹配
- 加了 `X-Content-Type-Options`、`Referrer-Policy` 等基础安全头

没有配 CSP —— 页面里用了内联样式和 `data:` URI 图标，CSP 配不好会直接把站点搞坏，收益不大。

> 想换回 Cloudflare Pages 也可以：删掉 `wrangler.jsonc`，把 `npm run deploy` 改回 `wrangler pages deploy dist --project-name=pixkit`，其余文件完全不用动。

### 方案三：其它平台

Vercel、Netlify 也都能拖 `dist` 上去，配置方式类似。国内访问都不如自建服务器，就不再展开。

## ⚠️ 上线前必做

1. **确认域名**：站内 `canonical`、`og:url`、`robots.txt`、`sitemap.xml` 现在统一指向 `https://pixkit.1573834694.workers.dev`（13 个文件、23 处）。以后换域名时全局搜一遍：

   ```bash
   grep -rl "pixkit.1573834694.workers.dev" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=tests
   ```

   改完记得重新 `npm run dist`，`dist/` 是生成物，不要直接改。

   注意：一旦绑定了自定义域名，这里要改成**自定义域名**而不是 `pixkit.1573834694.workers.dev`，否则搜索引擎把权重记到 workers.dev 上，换域名时全部白费。

2. **部署配置自查**：确认仓库里有 `wrangler.jsonc`，且线上 `/tests/e2e-compress.mjs`、`/package.json` 都是 404。这两条只要有一条不满足，说明静态资源目录还指在仓库根。

3. **备案**：服务器在国内必须备案，否则 80/443 端口会被拦截。Cloudflare Workers、Vercel 这类境外托管不需要备案 —— 但反过来说，它们也无法享受国内节点的加速。

4. **HTTPS**：浏览器要求，且 AdSense 也要求。Cloudflare 会自动签发；自建服务器用 certbot。

5. **提交 sitemap**：在百度搜索资源平台、Google Search Console 里提交 `sitemap.xml`，然后手动提交几个核心页面的 URL 加速收录。

6. **验证 SW 不被缓存**（PWA 最容易出问题的点）：

   ```bash
   curl -I https://pixkit.1573834694.workers.dev/sw.js | grep -i cache-control
   # 期望：no-cache, no-store, must-revalidate
   ```

   拿到别的值就说明 `_headers` 没生效 —— 那样线上改动会推不下去，用户永远停在旧版本。顺便用 Lighthouse 跑一遍，Application 面板里 SW 和 manifest 都应该是绿的。

## 怎么赚钱 — 现实版

先说结论：**这个项目不是"躺着收钱"的东西。** 工具站的收入完全取决于流量，而流量需要几个月的内容积累和 SEO。任何告诉你"做完就自动赚钱"的人都在骗你。

下面是真实可行的路径，按投入产出排序：

### 阶段一：先把流量做起来（0–3 个月，零收入）

没有流量之前谈变现都是空话。具体动作：

- **SEO 是唯一主渠道**。工具站 90% 的流量来自搜索。每个工具页要有独立的、有实质内容的说明文字（现在已经写了），不要写成关键词堆砌。
- **抢长尾词**。「图片压缩到200kb」「一寸照片尺寸多少像素」这类问题型搜索，竞争小、意图明确、转化高。每个长尾词可以单独做一个落地页。
- **提交到工具导航站**：WebStack、Tool.lu 之类的收录站，能带来初始外链和权重。
- **在知乎/小红书回答问题**。搜索「怎么把图片变小」这类问题，认真写一个回答，最后附上工具链接。这是冷启动最快的方式，但要注意平台对导流的限制。

**现实预期**：3 个月做到日均 500–2000 UV 是比较合理的。

### 阶段二：广告（有流量之后）

- **Google AdSense**：门槛低，单价高（技术类流量 $2–8 RPM）。但需要网站有实质内容，纯工具页容易被拒。建议先写 10 篇左右的使用教程/技术文章再申请。
- **百度联盟**：国内流量单价低（约 3–10 元 RPM），需要备案。作为补充。
- 别在首屏放广告，会严重伤害工具的使用体验，得不偿失。放在说明文字之后、页脚之前。

**现实预期**：1 万 PV/月 ≈ 几十到一两百元；10 万 PV/月 ≈ 几百到两千元。

### 阶段三：付费功能（真正的利润点）

广告是被动收入，付费是主动收入。这个工具的付费点设计：

- **免费**：单次 ≤ 20 张，单张 ≤ 10MB
- **付费（¥9.9/月 或 ¥29/年）**：批量解锁、超大图、目标大小精确压缩、无水印
- **一次性买断（¥19.9）**：单次大批量处理

技术实现需要一个后端（用户系统 + 支付）。国内个人接微信支付需要个体工商户或企业资质，这是主要障碍。折中方案：

- 用「爱发电」「Ko-fi」做打赏，零门槛
- 或提供「企业版 API」按调用量收费，走对公转账

**现实预期**：如果月流量 5 万 PV、转化率 0.5%，付费用户约 250 人，按 ¥20/年 ARPU 算，月收入约 400 元。

### 阶段四：导流变现（天花板最高）

工具本身不赚钱，但它筛出了一批精准人群：

- 证件照工具的用户 → 有打印需求 → 可以接入线上冲印服务做 CPS 分成（每单 5–15 元）
- 压缩工具的用户 → 电商卖家、设计师 → 可以推云存储、图床、设计素材站的 Affiliate

**这条路的天花板远高于广告，但需要商务资源。**

## 后续可以做什么

按性价比排序：

1. **长尾工具页**：二维码生成、图片加水印、图片拼接。每个都是独立的搜索入口，共享现有引擎，做一个 1 小时。
2. **英文独立路径**：现在英文是运行时切换，爬虫拿不到。要做英文 SEO 得静态输出 `/en/` 目录，AdSense 单价高 5–10 倍。
3. **使用教程内容**：10–20 篇「怎么把照片压到 200KB 以内」这类文章，既养 AdSense 审核，又吃长尾搜索。
4. **证件照换背景**：需要引入人像分割模型（约 2–3MB），是最大的功能缺口，也是最强的付费点。

## 开发说明

```bash
npm install                    # 只装 puppeteer-core，用于端到端测试
npm test                       # 跑全部测试（功能 + 中英切换 + 离线）
npm run test:compress          # 只测压缩
npm run test:idphoto           # 只测证件照
npm run test:i18n              # 只测中英切换，含全站漏译扫描
npm run test:text              # 只测 JSON / 时间戳 / Base64 解码
npm run test:pwa               # 只测离线能力（自己起服务器，测完关掉）
npm run icons                  # 重新生成 PWA 图标
```

测试会启动本机 Chrome 跑完整链路（真实生成图片 → 上传 → 压缩 → 校验输出尺寸；时间戳会跟 Node 算出的结果对账），截图输出到 `tests/.cache/`。

`test:pwa` 有个特别的地方：它**不能**用 `page.setOfflineMode` 来模拟断网。那个开关只作用于页面 target，而 Service Worker 跑在独立的 worker target 里，照样能联网 —— 于是「离线测试」全是假阳性。所以它自己在随机端口起一个静态服务器，测到一半真的 `server.close()` 掉，再验证缓存是否生效。

改完代码记得跑一遍，特别是 `common.js` 里的 ZIP 打包和格式检测 —— 这两块出问题不会报错，只会让下载的文件打不开。

改了文案也要跑 `npm run test:i18n`，它会逐页扫描英文模式下残留的中文，以及词典里查不到的句子。
