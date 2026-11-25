/**
 * 英文词典：键是中文原文（页面里怎么写的，这里就怎么抄），值是英文。
 * 切回中文时不查这张表 —— i18n.js 会直接写回缓存的原文，所以这里只需要英文。
 *
 * 动态文案（带数字的）不放进来的话会漏翻，统一交给 RULES 处理。
 */

import { TOOLS } from './i18n.tools.js';
import { TEXT } from './i18n.text.js';

const UI = {
  /* ---------- 站点通用 ---------- */
  "PixKit — 免费在线图片与开发者工具，本地处理不上传": "PixKit — Free online image and developer tools, processed locally",
  "免费在线图片压缩、证件照、格式转换，以及 JSON 格式化、时间戳转换、Base64 编解码等开发者工具。所有处理都在浏览器本地完成，文件不上传，无数量限制。":
    "Free online tools for image compression, ID photos and format conversion, plus developer utilities: JSON formatting, timestamp conversion and Base64 encoding. Everything runs in your browser — no uploads, no limits.",
  "图片压缩、证件照、格式转换，以及 JSON、时间戳、Base64 等开发者工具。全部在浏览器本地完成，不上传、不限量。":
    "Image compression, ID photos and format conversion, plus JSON, timestamp and Base64 tools. All processed locally, no uploads, no limits.",
  "图片压缩": "Compress",
  "证件照": "ID Photo",
  "全部工具": "All tools",
  "首页": "Home",
  "为什么选我们": "Why us",
  "常见问题": "FAQ",
  "回到首页": "Back to home",
  "更多工具": "More tools",

  /* ---------- 首页工具栏（搜索 + 分类） ---------- */
  "全部": "All",
  "图片工具": "Image tools",
  "开发者工具": "Dev tools",
  "搜索工具，比如「压缩」「JSON」": "Search tools, e.g. \"compress\" or \"JSON\"",
  "搜索工具": "Search tools",
  "清空搜索": "Clear search",
  "工具分类": "Tool categories",
  "没有找到匹配的工具，换个关键词试试。": "No tool matched that. Try a different keyword.",
  "直接开始压缩图片": "Start compressing images",

  /* ---------- 通用组件（对比面板 / 安装引导） ---------- */
  "压缩前后对比": "Before & after",
  "原图": "Original",
  "压缩后": "Compressed",
  "对比": "Compare",
  "关闭": "Close",
  "安装到桌面": "Install app",
  "点击 Safari 底部的「分享」按钮，然后选择「添加到主屏幕」。": "Tap Share at the bottom of Safari, then choose \"Add to Home Screen\".",
  "装好之后断网也能继续用。": "Once installed, it keeps working with no connection.",
  "开发者": "Developer",
  "最常用": "Most used",
  "所有处理在你的浏览器本地完成。": "Everything runs locally in your browser.",
  "/": "/",
  "复制": "Copy",
  "下载": "Download",
  "预览": "Preview",
  "取色器": "Color picker",
  "清除 EXIF": "Strip EXIF",
  "选择图片": "Choose image",
  "选择照片": "Choose photo",
  "选择或拖入图片": "Choose or drop an image",
  "选择证件照原图": "Choose the original photo",

  /* ---------- 404 ---------- */
  "页面不存在 | PixKit": "Page not found | PixKit",
  "这个页面找不到了": "This page doesn't exist",
  "链接可能已经失效，或者地址打错了。": "The link may have expired, or the address has a typo.",

  /* ---------- 首页 ---------- */
  "图片处理，": "Image editing, ",
  "不出你的浏览器": "without leaving your browser",
  "压缩、裁剪、转格式、做证件照 —— 全部在你的电脑本地完成。 没有上传、没有排队、没有数量限制，也没有水印。":
    "Compress, crop, convert, make ID photos — all on your own machine. No uploads, no queues, no limits, no watermarks.",
  "开始压缩图片": "Start compressing",
  "制作证件照": "Make an ID photo",
  "无需注册 · 无需安装 · 完全免费": "No sign-up · nothing to install · completely free",
  "每个工具都在本地运行，随开随用": "Every tool runs locally, ready when you open it",
  "图片批量压缩": "Batch image compression",
  "把图片体积压到原来的 1/5 而肉眼看不出差别。支持批量、支持指定目标大小。":
    "Shrink a photo to a fifth of its size with no visible difference. Batch mode, or hit an exact target size.",
  "证件照制作": "ID photo maker",
  "一寸、二寸、护照、签证标准规格精确裁剪，一键排版到 6 寸相纸直接打印。":
    "Crop to standard 1-inch, 2-inch, passport and visa sizes, then lay them out on a 6-inch sheet for printing.",
  "格式转换": "Format converter",
  "HEIC、WebP、PNG、JPG、AVIF 互相转换。iPhone 拍的照片也能直接转。":
    "Convert between HEIC, WebP, PNG, JPG and AVIF — including photos straight from an iPhone.",
  "批量改尺寸": "Batch resize",
  "按像素或百分比批量调整尺寸，等比缩放不会变形。适合电商主图和素材库。":
    "Resize by pixels or percentage, keeping the aspect ratio intact. Good for product shots and asset libraries.",
  "图片转 Base64": "Image to Base64",
  "生成 Data URI、CSS、HTML、Markdown 四种格式，一键复制，省掉一次 HTTP 请求。":
    "Output Data URI, CSS, HTML or Markdown and copy it in one click — saving an HTTP request.",
  "图片取色器": "Color picker",
  "像素放大镜实时取色，HEX / RGB / HSL 一键复制，自动提取整张图的主色板。":
    "Pick colors with a pixel magnifier, copy HEX / RGB / HSL instantly, and pull the image's dominant palette.",
  "清除照片 EXIF": "Strip photo EXIF",
  "看清照片里的 GPS 定位和相机型号，一键删掉。无损处理，不重新编码，画质不变。":
    "See the GPS location and camera model hidden in a photo, then delete them without re-encoding — image data untouched.",
  "批量加水印、图片拼图正在开发中。": "Batch watermarking and photo stitching are in the works.",
  "批量加水印、图片拼图正在开发中 —— 有想加的可以直接提。":
    "Batch watermarking and photo stitching are in the works — tell us what else you need.",
  "图片": "Image",
  "多张图片合成一个 PDF，可调纸张尺寸与页边距。报名、报销这类只收 PDF 的场合直接用。":
    "Combine several images into one PDF with adjustable page size and margins — handy for applications and expense reports that only take PDF.",
  "为什么是「本地处理」": "Why local processing",
  "这不是营销话术，是技术架构决定的": "Not a marketing line — it's how the site is built",
  "01 / 隐私": "01 / Privacy",
  "图片从不离开你的电脑": "Your images never leave your computer",
  "传统在线工具会把你的文件先上传到服务器，处理完再传回来。你的照片、证件、合同在别人的硬盘上存过一遍。我们用的是浏览器自带的计算能力，文件压根没有出过你的机器。":
    "Typical online tools upload your file first, process it on a server, then send it back — your photos, IDs and contracts sit on someone else's disk. This site uses the browser's own compute; the file never leaves your machine.",
  "02 / 速度": "02 / Speed",
  "省掉上传和下载的时间": "No upload, no download",
  "一张 10MB 的图，上传要几秒，下载又要几秒。本地处理是瞬间的 —— 瓶颈只剩下你自己电脑的 CPU。":
    "A 10MB image takes seconds to upload and seconds to download. Local processing is instant — the only limit is your own CPU.",
  "03 / 不限量": "03 / No limits",
  "没有「免费额度」这回事": "There is no free quota",
  "大部分免费工具限制单次 5 张、单张 5MB，超过就要付费。因为服务器成本压在它们身上。我们没有这个成本，所以也没有这个限制。":
    "Most free tools cap you at five files of 5MB because servers cost them money. We have no server cost, so we have no cap.",
  "真的完全不上传吗？怎么证明？": "Is it really never uploaded? How can I check?",
  "你可以打开浏览器开发者工具（F12）的 Network 面板，然后拖一张图进来处理 —— 你会看到没有任何图片数据被发出。整个页面加载完之后，断网也能继续用；装到桌面之后更是连网络都不需要。":
    "Open DevTools (F12), go to the Network panel, then drop an image in. No image data is ever sent. Once the page has loaded you can even go offline and keep working — and once installed, it doesn't need a network at all.",
  "这是架构层面的保证，不是承诺：处理逻辑全部写在前端 JavaScript 里，服务器上根本没有接收图片的接口。":
    "This is structural, not a promise: all processing lives in front-end JavaScript, and the server has no endpoint that accepts images.",
  "压缩会损失画质吗？": "Does compression hurt quality?",
  "会，但通常看不出来。JPEG 和 WebP 都是有损压缩格式，我们做的是「用最少的视觉损失换最大的体积下降」。默认设置在绝大多数场景下肉眼无法分辨。":
    "Yes, but you usually can't tell. JPEG and WebP are lossy; we trade the least visible detail for the biggest size drop. At the default settings the difference is invisible in almost every case.",
  "如果你需要绝对无损，可以选择 PNG 输出或把质量调到 100。":
    "If you need it truly lossless, output PNG or set quality to 100.",
  "支持多大的图片？一次能处理多少张？": "How large can images be, and how many at once?",
  "单张建议不超过 50MB、总像素不超过 1 亿（例如 10000×10000）。数量上没有限制，但一次处理几百张会占用较多内存，建议分批进行。":
    "Keep each file under 50MB and under 100 megapixels (e.g. 10000×10000). There is no count limit, but hundreds at once will eat memory — batch it.",
  "支持哪些格式？": "Which formats are supported?",
  "输入支持 JPG、PNG、WebP、GIF（取第一帧）、BMP、AVIF。输出支持 JPG、PNG、WebP、AVIF。":
    "Input: JPG, PNG, WebP, GIF (first frame), BMP, AVIF. Output: JPG, PNG, WebP, AVIF.",
  "iPhone 的 HEIC 格式受浏览器限制：Safari 可以处理，Chrome 和 Edge 目前无法解码。如果你在 Chrome 里遇到提示，用 Safari 打开即可。":
    "HEIC depends on the browser: Safari can decode it, Chrome and Edge cannot. If Chrome warns you, open the page in Safari.",
  "手机上能用吗？": "Does it work on a phone?",
  "可以，页面做了移动端适配。不过处理大量图片时手机内存有限，建议少量多次。":
    "Yes, the layout is mobile-friendly. Phone memory is limited though, so process in small batches.",

  /* ---------- 压缩页 ---------- */
  "在线图片批量压缩 — 压到指定大小，不上传服务器 | PixKit": "Batch Image Compressor — hit an exact file size, nothing uploaded | PixKit",
  "/ 图片压缩": "/ Compress",
  "在线图片批量压缩": "Batch image compression",
  "支持指定目标文件大小，一次处理任意数量的图片。所有处理都在你的浏览器内完成，图片不会上传到任何服务器。":
    "Set a target file size and process any number of images. Everything runs in your browser — no image is ever uploaded.",
  "本地处理：图片不会离开你的设备。可以按 F12 打开网络面板自行验证。":
    "Local processing: files never leave your device. Press F12 and watch the Network panel to confirm.",
  "拖入图片，或点击选择": "Drop images here, or click to choose",
  "支持 JPG / PNG / WebP / GIF / BMP / AVIF · 也可以直接": "JPG / PNG / WebP / GIF / BMP / AVIF · or just",
  "粘贴": "paste",
  "压缩设置": "Compression settings",
  "压缩方式": "Mode",
  "按质量（推荐）": "By quality (recommended)",
  "按目标大小": "Target file size",
  "画质": "Quality",
  "目标大小": "Target size",
  "输出格式": "Output format",
  "自动（智能选择）": "Auto (smart)",
  "WebP（体积最小）": "WebP (smallest)",
  "PNG（无损）": "PNG (lossless)",
  "最大边长": "Max edge",
  "不限": "No limit",
  "清空": "Clear",
  "全部下载 (.zip)": "Download all (.zip)",
  "怎么把图片压到 200KB 以内": "How to get an image under 200KB",
  "很多网站对上传图片有大小限制 —— 报名系统要求证件照小于 200KB，电商平台限制主图 500KB 以内， 邮箱附件有 25MB 上限。这个工具可以直接把「目标大小」作为条件：它会自动试算不同的压缩强度， 找到「刚好不超过你设定值」的最高画质。":
    "Plenty of sites cap uploads: application forms want ID photos under 200KB, marketplaces keep product images under 500KB, email attachments top out at 25MB. Here the target size is the input — the tool tries a range of compression levels and keeps the highest quality that still fits.",
  "原理是二分查找：先在质量区间里取中点编码一次，看结果大小；超了就调低，没超就调高， 反复几次就能逼近目标值。整个过程通常不到一秒。":
    "It's a binary search: encode at the midpoint of the quality range, check the size, then move the bound up or down and repeat. It usually converges in under a second.",
  "压缩到多小才合适": "How small should I go?",
  "网页配图": "Web images",
  "：宽度 1200px、质量 75 左右，通常能压到 100–200KB，屏幕上看不出差别": ": 1200px wide at quality 75 usually lands at 100–200KB with no visible difference",
  "证件照 / 报名系统": "ID photos / application forms",
  "：用「按目标大小」模式，直接填系统要求的上限": ": use target-size mode and enter the site's limit",
  "微信发送": "Sending on WeChat",
  "：质量 70 足够，微信自己还会再压一次": ": quality 70 is plenty — WeChat compresses again anyway",
  "电商主图": "Marketplace product images",
  "：多数平台要求 800×800 以上，质量 85，保留清晰度": ": most require 800×800 or larger; quality 85 keeps things sharp",
  "需要印刷或后期处理": "Print or further editing",
  "：别压，用 PNG 或质量 95 以上": ": don't compress — use PNG, or quality 95+",
  "为什么 WebP 比 JPG 更小": "Why WebP is smaller than JPG",
  "同等画质下，WebP 的文件体积通常比 JPG 小 25%–35%。这是因为它用了更先进的压缩算法， 并且在编码时会参考周围的像素预测当前块的内容。缺点是极老的软件（比如 Office 2007）打不开， 但在浏览器、微信、手机相册里都没有问题。":
    "At the same visual quality, WebP is typically 25–35% smaller than JPG thanks to a newer compression algorithm that predicts each block from its neighbours. The catch is ancient software (Office 2007, for instance) can't open it — browsers, WeChat and phone galleries are fine.",
  "不确定选哪个？": "Not sure which to pick?",
  "保持默认的「自动」就行 —— 它会根据图片有没有透明通道自动决定输出格式。":
    "Leave it on Auto — it picks the output format based on whether the image has transparency.",
  "压缩后画质变差很多怎么办": "The result looks much worse — what now?",
  "把质量滑块调高，或者改用「按目标大小」模式并给一个宽容一点的值。另外注意「最大边长」如果设得太小，图会被缩得模糊。":
    "Raise the quality slider, or switch to target-size mode with a more generous limit. Also check Max edge — set too low, it resizes the image into mush.",
  "为什么压缩 PNG 后体积反而变大了": "Why did my PNG get bigger?",
  "PNG 是无损格式，浏览器重新编码时不一定能达到原文件的压缩率（原文件可能经过专门的优化工具处理）。如果图片没有透明区域，换成 JPG 或 WebP 会小很多。":
    "PNG is lossless, and the browser's encoder may not match the original's compression (which was likely produced by a dedicated optimizer). If the image has no transparency, JPG or WebP will be much smaller.",
  "一次处理几百张会不会卡死": "Will hundreds of files freeze the tab?",
  "会占用较多内存。建议每次不超过 100 张，或者分几批处理。处理过程中不要关闭页面。":
    "It will use a lot of memory. Keep batches under 100 files, and don't close the tab while it runs.",

  /* 压缩页运行时动态文案 */
  "共 {n} 张": "{n} files",
  "共 {n} 张 · 处理中…": "{n} files · processing…",
  "已处理 <strong>{d}</strong> / {n} 张 · {b} → <strong>{a}</strong> <span class=\"save\">节省 {p}%</span>":
    "Processed <strong>{d}</strong> / {n} · {b} → <strong>{a}</strong> <span class=\"save\">saved {p}%</span>",
  "处理中…": "Processing…",
  "排队中": "Queued",
  "· 保留原图": "· original kept",
  "· 未达目标": "· target missed",
  "打包中…": "Zipping…",
  "打包失败，请分批下载": "ZIP failed — download in smaller batches",
  "处理失败": "Failed",
  "不是有效的图片文件": "Not a valid image file",
  "没有找到可识别的图片": "No readable image found",
  "PNG 是无损格式，无法按目标大小控制体积，建议改用 JPG 或 WebP":
    "PNG is lossless, so its size can't be driven to a target — try JPG or WebP",

  /* ---------- 格式转换页 ---------- */
  "在线图片格式转换 — HEIC/WebP/PNG/JPG 互转，不上传 | PixKit": "Image Format Converter — HEIC, WebP, PNG, JPG | PixKit",
  "/ 格式转换": "/ Convert",
  "在线图片格式转换": "Image format converter",
  "JPG、PNG、WebP、AVIF、GIF、BMP 互相转换，支持批量处理。转换在你的浏览器内完成，图片不会上传到任何服务器。":
    "Convert between JPG, PNG, WebP, AVIF, GIF and BMP in batches. Everything runs in your browser — nothing is uploaded.",
  "不同图片格式适合什么场景": "Which format fits which job",
  "选错格式是图片体积虚高的最常见原因。一张该用 WebP 的照片存成 PNG，体积可能是前者的十倍以上。 下面这张表可以直接照着用：":
    "Picking the wrong format is the most common reason files are needlessly huge — a photo saved as PNG can be ten times the size it needs to be. Use this table:",
  "格式": "Format",
  "适合": "Good for",
  "不适合": "Avoid for",
  "照片、人像、风景": "Photos, portraits, landscapes",
  "需要透明背景、纯色图标": "Transparency, flat-color icons",
  "图标、截图、需要透明的图": "Icons, screenshots, transparency",
  "大尺寸照片，体积会失控": "Large photos — file size explodes",
  "网页配图，兼顾体积和画质": "Web images — best size/quality balance",
  "发给老版本 Office / 旧电脑": "Old Office versions and old machines",
  "极致压缩，比 WebP 再小 20%": "Maximum compression — another 20% under WebP",
  "兼容性一般，编码也慢": "Patchy compatibility, slow to encode",
  "iPhone 的 HEIC 怎么办": "What about iPhone HEIC files?",
  "iPhone 默认用 HEIC 格式拍照，体积比 JPG 小一半，但很多 Windows 软件和网站打不开。 多数情况下的解决办法是转成 JPG。转换后会略微变大，这是正常的 —— JPG 的压缩效率确实不如 HEIC。":
    "iPhones shoot HEIC by default — half the size of JPG, but many Windows apps and websites can't open it. Converting to JPG is the usual fix; the file gets a bit larger, which is expected since JPG compresses less efficiently.",
  "注意：": "Note:",
  "本工具直接调用浏览器的解码能力，Safari 可以处理 HEIC，Chrome 暂不支持。 如果你在 Chrome 里遇到 HEIC 无法识别，请用 Safari 打开，或先在手机端「设置 → 相机 → 格式」改为「兼容性最佳」。":
    "This tool relies on the browser's own decoder: Safari handles HEIC, Chrome doesn't yet. If Chrome can't read your file, open the page in Safari — or set Settings → Camera → Formats to \"Most Compatible\" on the phone.",
  "转换会损失画质吗": "Does converting lose quality?",
  "转成有损格式（JPG、WebP、AVIF）会，但把质量设在 90 以上时，损失通常无法用肉眼分辨。 转成 PNG 是无损的，但体积会明显变大。反过来，PNG 转 JPG 或 WebP 一定会损失透明通道 —— 透明区域会变成白色。":
    "Converting to a lossy format (JPG, WebP, AVIF) does — though above quality 90 it's invisible. PNG output is lossless but much larger. Going the other way, PNG to JPG or WebP always loses the alpha channel: transparent areas turn white.",
  "批量转换会不会很慢": "Is batch conversion slow?",
  "转换速度取决于你的电脑。一般一张 2000 万像素的照片需要 0.2–0.5 秒，100 张大约半分钟。转换期间不要关闭页面。":
    "It depends on your machine. A 20-megapixel photo takes 0.2–0.5s, so 100 of them is about half a minute. Don't close the tab while it runs.",
  "转换后文件名会变吗": "Will file names change?",
  "会保留原文件名，只把扩展名换成新格式。打包下载时如果重名会自动加序号。":
    "Names are kept; only the extension changes. Duplicates in the ZIP get a number appended.",
  "支持 RAW 格式吗": "Is RAW supported?",
  "目前不支持 CR2、NEF、ARW 等相机 RAW 格式，浏览器没有内置解码器。需要先导出成 JPG 或 TIFF。":
    "Not yet — browsers don't ship decoders for CR2, NEF, ARW or other RAW formats. Export to JPG or TIFF first.",

  /* ---------- 批量改尺寸页 ---------- */
  "在线批量修改图片尺寸 — 按像素等比缩放，不上传 | PixKit": "Batch Image Resizer — proportional scaling | PixKit",
  "/ 批量改尺寸": "/ Resize",
  "在线批量修改图片尺寸": "Batch image resizer",
  "设置最大边长，所有图片按比例缩放，不会变形。支持批量处理和打包下载，全部在本地完成。":
    "Set a maximum edge and every image scales proportionally without distortion. Batch processing and ZIP download, all local.",
  "常见场景该用多大尺寸": "Recommended sizes by use case",
  "尺寸设太大浪费空间，设太小会糊。下面是几个高频场景的推荐值：":
    "Too large wastes bandwidth, too small looks soft. Common presets:",
  "微信公众号封面": "WeChat article cover",
  "：900 × 383，正文配图宽度 1080 足够": ": 900 × 383; 1080 wide is enough for inline images",
  "小红书 / 抖音": "Xiaohongshu / Douyin",
  "：竖图 1080 × 1440": ": portrait 1080 × 1440",
  "淘宝 / 京东主图": "Taobao / JD product image",
  "：800 × 800 起，部分类目要求 1200 × 1200": ": from 800 × 800; some categories require 1200 × 1200",
  "：宽度 1200–1600，配合 WebP 格式": ": 1200–1600 wide, paired with WebP",
  "邮件附件 / 微信发送": "Email attachments / WeChat",
  "：长边 1600 以内，肉眼几乎无损": ": long edge under 1600 — visually lossless",
  "打印 A4": "A4 print",
  "：300dpi 下需要 2480 × 3508": ": 2480 × 3508 at 300dpi",
  "「最大边长」是什么意思": "What does \"max edge\" mean?",
  "它是长和宽中较长的那条边。比如一张 4000 × 3000 的横图，设最大边长 1200， 会缩成 1200 × 900 —— 按比例缩，不会拉扁。":
    "It's the longer of width and height. A 4000 × 3000 landscape with max edge 1200 becomes 1200 × 900 — scaled, never squashed.",
  "小于这个值的图片": "Images already smaller than that",
  "不会被放大": "are never upscaled",
  "。放大只会变模糊，没有意义，所以工具会自动跳过。": ". Upscaling only blurs, so those files are skipped.",
  "为什么不能单独设宽和高": "Why can't I set width and height separately?",
  "因为同时指定宽和高就一定会变形 —— 除非恰好等于原图比例。真要做非等比拉伸（比如把方形拉成宽幅）， 那属于「裁剪」范畴，不是缩放。这个工具故意只提供等比缩放，避免你一不小心把照片压扁了。":
    "Because fixing both dimensions always distorts the image unless they match the original ratio. Deliberate stretching is a crop job, not a resize. This tool only does proportional scaling so a photo can't end up squashed.",
  "缩小尺寸会损失画质吗": "Does downscaling lose quality?",
  "会重采样，但视觉上通常更好看 —— 缩小能抹掉噪点和细节瑕疵。真正会糊的是放大。":
    "It resamples, but the result usually looks better: shrinking hides noise and small flaws. Upscaling is what makes images mushy.",
  "一次能改多少张": "How many files at once?",
  "数量不限，但受限于电脑内存。建议单批不超过 100 张，或分几次处理。":
    "No count limit, but memory-bound. Keep batches under 100 files or split them up.",
  "能只改宽度不管高度吗": "Can I change only the width?",
  "当图片是竖图时，设最大边长等于你想要的宽度，效果就是「宽度固定、高度按比例」。横图则相反。这是等比缩放的必然结果。":
    "For a portrait image, set max edge to your target width and you get a fixed width with proportional height. For landscape it's the reverse — that's just how proportional scaling works.",
};

/* 动态文案：数字、文件名这类没法逐字进词典的，用正则处理 */
export const RULES = [
  [/^共 (\d+) 张$/, (m) => `${m[1]} files`],
  [/^共 (\d+) 张 · 处理中…$/, (m) => `${m[1]} files · processing…`],
  [/^已打包 (\d+) 张图片$/, (m) => `Zipped ${m[1]} files`],
  [/^已复制 (.+)$/, (m) => `Copied ${m[1]}`],
  [/^共 (\d+) 项元数据$/, (m) => `${m[1]} metadata fields`],
  [/^([\d,]+) 字符$/, (m) => `${m[1]} characters`],
  [/^图片较大，已缩放到 (\d+)×(\d+) 显示$/, (m) => `Large image, scaled to ${m[1]}×${m[2]} for display`],
  [/^已生成 (\d+) 张排版（(\d+)×(\d+)）$/, (m) => `Layout created: ${m[1]} photos (${m[2]}×${m[3]})`],
  [/^(\d+) 张$/, (m) => `${m[1]} photos`],
  [/^节省 (\d+)%$/, (m) => `Saved ${m[1]}%`],
  [/^([\d.]+) 米$/, (m) => `${m[1]} m`],
  [/^已清除，减少 (.+)$/, (m) => `Stripped — saved ${m[1]}`],
  [/^(\d+) 个数据段$/, (m) => `${m[1]} segments`],
  [/^原始 (.+)$/, (m) => `Original ${m[1]}`],
  [/^Base64 后 (.+)$/, (m) => `${m[1]} as Base64`],
];

export const EN = Object.assign({}, UI, TOOLS, TEXT);
