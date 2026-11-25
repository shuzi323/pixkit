# PixKit — 纯前端图片工具站

一个零成本运行的在线图片工具站。所有图片处理都在用户浏览器里完成，服务器只负责发静态文件。

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

## 技术特点

- **零构建**：纯 HTML + 原生 ES Module，没有 webpack/vite，改完刷新就生效
- **零运行时依赖**：不用 React、不用任何 npm 包，全部手写
- **手写 ZIP 打包**：`assets/js/common.js` 里 100 行实现的 store 模式 ZIP，不引入 JSZip
- **架构即隐私**：服务器上没有接收图片的接口，用户想验证也验证不出东西来

### 文件结构

```
/
├── index.html                    首页
├── 404.html                      错误页（需在 nginx 里配置）
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── css/style.css             全站样式
│   └── js/
│       ├── common.js             ZIP 打包 / 图片解码 / 格式检测 / 剪贴板
│       ├── compress.js           压缩引擎（convert / resize 也复用这个）
│       ├── idphoto.js            证件照
│       ├── base64.js             图片转 Base64
│       ├── picker.js             取色器
│       └── exif.js               EXIF 解析与无损清除
└── tools/
    ├── compress/index.html
    ├── idphoto/index.html
    ├── convert/index.html
    ├── resize/index.html
    ├── base64/index.html
    ├── picker/index.html
    └── exif/index.html
```

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

### 方案二：Cloudflare Pages（推荐，免费、无限带宽）

**先回答最常问的：不需要域名。** 部署完会免费送你一个 `你的项目名.pages.dev`，可以直接用。

但有两个现实问题要提前知道：

1. **`*.pages.dev` 在国内不稳定**。这个域名从 2022 年起常遭 DNS 污染，部分运营商/时段会解析到 `127.0.0.1`。绑定自己的域名能明显改善（绕开了 pages.dev 这一层）。
2. **Cloudflare 在中国大陆没有节点**。即使绑了域名，大陆访客仍然走境外节点，延迟在 200–300ms。能用，但不是"快"。

所以判断标准很简单：**先上线验证就选 Pages（免费、5 分钟搞定）；如果后面确认流量主要来自国内且在乎体验，再迁回自己的服务器**。纯静态站迁移成本几乎为零。

> **已经用拖拽上传建好项目了？** 直接看 **方式 B**。Cloudflare 不允许给这类项目补 Git 集成，得用 GitHub Actions 推到同一个项目 —— 域名和 `pages.dev` 都不用动。

#### 方式 A：拖拽上传（最快，不用 Git）

```bash
npm run dist          # 生成干净的 dist/ 目录（19 个文件，约 172 KB）
```

然后：

1. 登录 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 左侧 **Workers & Pages** → **Create** → **Pages** → **Upload assets**
3. 项目名填 `pixkit`（这会决定你的 `pixkit.pages.dev`）
4. 把 `dist` 文件夹整个拖进去 → **Deploy site**

> 一定要拖 `dist` 而不是项目根目录。根目录里有 `node_modules`（几十 MB）和 `tests`，传上去纯属浪费，还可能超出单站 2 万个文件的限制。

#### 方式 B：GitHub Actions 推送到「已有项目」（推荐，Direct Upload 项目只能走这条）

**先说要命的一点：Cloudflare 不允许给 Direct Upload 项目补 Git 集成。**

官方文档写的是两条互斥规则 —— Git 项目不能改成拖拽上传，拖拽上传的项目也不能事后接 Git。
所以「让 GitHub 的 push 直接落到那个已经存在的项目里」，只有一条路：
**用 GitHub Actions 跑 wrangler，上传到同一个项目名**。

好处是复用现有项目：`xxx.pages.dev` 和已绑的域名全都不动，DNS 也不用改。

`.github/workflows/deploy.yml` 已经写好了，你要配三个值。

**1. 确认项目名**

Dashboard → Workers & Pages → 点进你的项目，标题下方就是项目名。或者：

```bash
npx wrangler login
npx wrangler pages project list
```

如果名字不是 `pixkit`，改 `deploy.yml` 里这行（或者不改文件，在仓库 Settings → Variables 里加 `CLOUDFLARE_PAGES_PROJECT`，前者优先级更高）：

```yaml
PAGES_PROJECT: ${{ vars.CLOUDFLARE_PAGES_PROJECT || 'pixkit' }}
```

**2. 建 API Token**

Cloudflare 右上角头像 → **My Profile** → **API Tokens** → **Create Token** → **Custom token**：

- Permissions：`Account` → `Cloudflare Pages` → `Edit`
- Account Resources：选你自己那个账号

不要用 Global API Key —— 那是账号级万能钥匙，泄露等于账号被接管。

**3. 加两个 GitHub Secret**

仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**：

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | 上一步生成的 token |
| `CLOUDFLARE_ACCOUNT_ID` | 域名概览页右侧栏的 Account ID，或 `npx wrangler whoami` 输出里那串 |

配完 push 一次，Actions 里就能看到 `test` → `deploy` 两个 job 依次跑。之后每次 push 到 `main` 自动上线，**测试挂了就不会部署**。

几个细节：

- 走的是「直接上传」，所以 `_headers`、`404.html` 必须在 `dist/` 里 —— `npm run dist` 已经处理好了
- 项目名写错时 wrangler 会直接报项目不存在，**不会**自动新建（CI 里没有交互），正好防止手滑多出一个项目
- Pages 会保留历史部署，在后台可以一键回滚到任意一次
- API Token 有效期建议设 1 年，到期提前换，换的时候只改 GitHub Secret，不用动代码

#### 方式 C：新建一个 Git 集成项目（想用 Cloudflare 原生流程）

如果你更想要「push 完什么都不用管、预览部署也由 Cloudflare 管」，那就得新建项目，再把域名搬过去：

1. Pages → **Create** → **Connect to Git** → 选 `shuzi323/pixkit`
2. 项目名换一个，比如 `pixkit-git`（不能和现有项目重名）
3. Framework preset `None`，Build command `node scripts/build-dist.mjs`，Output `dist`
4. 等 `pixkit-git.pages.dev` 能正常打开后，去**旧项目**的 Custom domains 里把域名 **Remove**
5. 到**新项目**的 Custom domains 里添加同一个域名
6. 确认新站正常，再删掉旧项目

顺序别搞反：**先在新项目验证能跑，再挪域名**。反过来会有一段时间域名指向空白页。域名如果本来就托管在 Cloudflare，挪动时 DNS 记录会自动改指向，不用手改，但要等几分钟生效。

#### 方式 D：命令行手动部署

```bash
npm i -D wrangler
npx wrangler login
npm run deploy        # 等价于 build-dist + wrangler pages deploy dist --project-name=pixkit
```

适合临时发一版、不想等 CI 的时候。

#### 绑定自己的域名

1. Pages 项目 → **Custom domains** → **Set up a custom domain** → 输入 `你的域名`
2. 如果域名已经托管在 Cloudflare：自动加 CNAME，通常几十秒生效
3. 如果域名在别处（阿里云/腾讯云）：它会给你一个 CNAME 目标，去原服务商加一条解析

**两个必踩的坑：**

- **一定要先在 Pages 后台添加域名，再去配 DNS**。反过来操作会得到 522 错误。
- 如果域名配了 CAA 记录，要放行 Cloudflare 的证书机构，否则 HTTPS 证书签不下来。需要放行：`letsencrypt.org`、`pki.goog`、`ssl.com`。
- 根域名（裸域 `example.com`）接入要求把 NS 服务器整体切到 Cloudflare；只想用子域名（`tools.example.com`）则 CNAME 即可。

#### `_headers` 文件

项目根目录已经有 `_headers`，Cloudflare Pages 会自动读取并应用。当前配置：

- HTML 不缓存（改了内容用户立刻能看到）
- `/assets/*` 缓存 1 天（文件名没有 hash，不能设更长）
- 加了 `X-Content-Type-Options`、`Referrer-Policy` 等基础安全头

没有配 CSP —— 页面里用了内联样式和 `data:` URI 图标，CSP 配不好会直接把站点搞坏，收益不大。

### 方案三：其它平台

Vercel、Netlify 也都能拖 `dist` 上去，配置方式和 Pages 类似。国内访问都不如自建服务器，就不再展开。

## ⚠️ 上线前必做

1. **替换域名**：全局搜索 `example.com`，换成你的域名。涉及每个页面的 `canonical`、`og:url`、`robots.txt`、`sitemap.xml`。

   ```bash
   grep -rl "example.com" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=tests
   ```

   改完记得重新 `npm run dist`，`dist/` 是生成物，不要直接改。

   注意：如果你用 Cloudflare Pages 并绑定了自定义域名，这里要填**自定义域名**而不是 `pixkit.pages.dev`，否则搜索引擎会把权重记到 pages.dev 上。

2. **备案**：服务器在国内必须备案，否则 80/443 端口会被拦截。Cloudflare Pages、Vercel 这类境外托管不需要备案 —— 但反过来说，它们也无法享受国内节点的加速。

3. **HTTPS**：浏览器要求，且 AdSense 也要求。用 certbot 申请免费证书。

4. **提交 sitemap**：在百度搜索资源平台、Google Search Console 里提交 `sitemap.xml`，然后手动提交几个核心页面的 URL 加速收录。

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

1. **长尾工具页**：图片转 Base64、二维码生成、图片加水印、图片拼接。每个都是独立的搜索入口，共享现有引擎，做一个 1 小时。
2. **英文版**：同样的工具做成英文站，AdSense 单价高 5–10 倍。工作量主要是文案翻译。
3. **使用教程内容**：10–20 篇「怎么把照片压到 200KB 以内」这类文章，既养 AdSense 审核，又吃长尾搜索。
4. **证件照换背景**：需要引入人像分割模型（约 2–3MB），是最大的功能缺口，也是最强的付费点。

## 开发说明

```bash
npm install                    # 只装 puppeteer-core，用于端到端测试
npm test                       # 跑全部测试
npm run test:compress          # 只测压缩
npm run test:idphoto           # 只测证件照
```

测试会启动本机 Chrome 跑完整链路（包括真实生成图片 → 上传 → 压缩 → 校验输出尺寸），截图输出到 `tests/.cache/`。

改完代码记得跑一遍，特别是 `common.js` 里的 ZIP 打包和格式检测 —— 这两块出问题不会报错，只会让下载的文件打不开。
