/**
 * 工具页的英文词典：证件照 / Base64 / 取色器 / EXIF
 * 键仍然是中文原文，和页面里写的完全一致。
 */

export const TOOLS = {

  /* ---------- 证件照 ---------- */
  "证件照制作 — 一寸二寸精确裁剪，一键排版打印 | PixKit": "ID Photo Maker — precise 1-inch / 2-inch crops, print layout | PixKit",
  "/ 证件照": "/ ID Photo",
  "选择规格，拖动照片对齐构图，导出标准尺寸的电子版，或一键排版到 6 寸相纸直接打印。照片保持原有背景，不上传服务器。":
    "Pick a spec, drag the photo into frame, then export a correctly sized digital copy or lay it out on a 6-inch sheet for printing. Background untouched, nothing uploaded.",
  "本地处理：照片不会离开你的设备，可用于证件等敏感场景。":
    "Local processing: the photo never leaves your device, so it's safe for IDs and other sensitive images.",
  "上传一张正面照片": "Upload a front-facing photo",
  "建议光线均匀、背景干净的半身照 · 支持 JPG / PNG / WebP": "Even lighting and a plain background work best · JPG / PNG / WebP",
  "头顶线": "Head top",
  "下巴线": "Chin",
  "拖动照片调整位置 · 滚轮或滑块缩放 · 让头顶接近上方虚线、下巴接近下方虚线":
    "Drag to reposition · scroll or use the slider to zoom · line the head top up with the upper guide and the chin with the lower one",
  "规格": "Spec",
  "调整": "Adjust",
  "缩放": "Zoom",
  "自动居中": "Auto-center",
  "重置": "Reset",
  "导出": "Export",
  "下载单张（电子版）": "Download single photo",
  "下载 6 寸排版（打印用）": "Download 6-inch sheet (for printing)",
  "排版版按 300dpi、6 寸相纸（152×102mm）生成，拿去照相馆或自助机按「6 寸光面相纸」打印即可。":
    "The sheet is generated at 300dpi on 6-inch paper (152×102mm) — print it at a photo shop or kiosk as a 6-inch glossy photo.",
  "证件照的尺寸到底是多少": "What size is an ID photo, exactly?",
  "中国证件照规格比较混乱，同样叫「一寸」，不同机构要求的像素值可能不同。下面是常用规格的换算（按 300dpi）：":
    "Chinese ID photo specs are messy: the same \"1-inch\" label can mean different pixel sizes depending on the issuer. Common conversions at 300dpi:",
  "一寸": "1 inch",
  "二寸": "2 inch",
  "小一寸": "Small 1 inch",
  "大一寸": "Large 1 inch",
  "小二寸": "Small 2 inch",
  "美签": "US visa",
  "：25 × 35 mm，295 × 413 px — 简历、学生证、各类报名表": ": 25 × 35 mm, 295 × 413 px — résumés, student IDs, application forms",
  "：35 × 49 mm，413 × 579 px — 毕业证、职称证、部分签证": ": 35 × 49 mm, 413 × 579 px — diplomas, professional certificates, some visas",
  "：22 × 32 mm，260 × 378 px — 驾驶证、部分工作证": ": 22 × 32 mm, 260 × 378 px — driving licences, some work IDs",
  "：33 × 48 mm，390 × 567 px — 护照、港澳通行证、部分签证": ": 33 × 48 mm, 390 × 567 px — passports, HK/Macao permits, some visas",
  "：35 × 45 mm，413 × 531 px — 部分国家签证": ": 35 × 45 mm, 413 × 531 px — some country visas",
  "：51 × 51 mm，600 × 600 px — 美国签证专用方图": ": 51 × 51 mm, 600 × 600 px — the square photo US visas require",
  "报不上名怎么办？": "Application rejected?",
  "系统如果提示「尺寸不符」，先看它要求的是": "If the system says the size is wrong, check whether it wants",
  "像素": "pixels",
  "还是": "or",
  "毫米": "millimetres",
  "。 绝大多数报名系统卡的是像素。用「最大边长」那一栏调不出精确值的话，选对应规格导出，再微调到系统要求的像素数。":
    ". Most systems enforce pixels. If Max edge can't hit the exact number, export with the closest spec and fine-tune to the required pixel count.",
  "构图怎么才算标准": "What counts as proper framing?",
  "证件照的构图有通行规则：头顶到照片上沿留出约 8%–12% 的空隙，头部（头顶到下巴）占画面高度的 60%–70%， 肩膀露出一点，面部居中。页面上的两条虚线就是给这个用的，把头顶对齐上面那条、下巴对齐下面那条，基本就合规了。":
    "The usual rule: leave 8–12% of the frame empty above the head, the head (crown to chin) should fill 60–70% of the height, shoulders just visible, face centered. The two guide lines are there for exactly this — align crown and chin and you're compliant.",
  "关于换背景": "About changing the background",
  "这个工具": "This tool does",
  "不改变照片背景": "not change the background",
  "，只做精确裁剪和排版。原因是自动抠图对人像边缘（尤其是碎发）的处理很难做到无痕， 而证件照对边缘瑕疵的容忍度极低 —— 与其给你一个「看着还行但一放大就露馅」的结果，不如明确说明。":
    ", it only crops and arranges. Automatic matting struggles with hair edges, and ID photos have zero tolerance for edge artifacts — better to say so than to hand you something that looks fine until it's zoomed.",
  "如果你需要换背景：建议在纯色墙面（白墙最好）前、光线均匀的条件下重拍一张，效果远好于任何后期抠图。 实在需要改底色，请使用专门的抠图服务，再拿抠好的透明底 PNG 回到这里裁剪排版。":
    "If you need a different background, reshoot against a plain wall in even light — it beats any post-processing. Otherwise use a dedicated cutout service, then bring the transparent PNG back here to crop and lay out.",
  "排版版有多少张": "How many photos fit on a sheet?",
  "取决于规格。一寸照在 6 寸相纸上通常能排 10–12 张，二寸能排 6–8 张。生成时按实际尺寸自动计算，不会重叠。":
    "It depends on the spec: 10–12 one-inch photos fit on a 6-inch sheet, 6–8 two-inch ones. The layout is computed from actual dimensions so nothing overlaps.",
  "拿去打印要注意什么": "Anything to watch out for when printing?",
  "告诉店家「6 寸光面相纸，原尺寸输出，不要缩放」。文件本身已经按 300dpi 做好，任何二次缩放都会影响清晰度。":
    "Tell the shop: 6-inch glossy paper, print at original size, no scaling. The file is already built for 300dpi; any rescaling softens it.",
  "原照片不够清晰怎么办": "My source photo isn't sharp enough",
  "裁剪会放大原图的局部，如果原照片分辨率不够，输出会糊。建议原图的长边至少是目标像素的 3 倍以上。手机后置摄像头拍的照片通常够用。":
    "Cropping magnifies part of the source, so low-resolution input comes out soft. Aim for a long edge at least 3× the target pixels; a modern phone's rear camera is usually enough.",
  "照片会不会被保存": "Is my photo stored anywhere?",
  "不会。整个处理过程在你的浏览器里完成，服务器上没有任何接收图片的接口。你可以断网后继续操作来验证。":
    "No. Everything happens in your browser, and the server has no endpoint that accepts images. Disconnect from the network and keep working to prove it.",

  /* 证件照 JS 动态 */
  "简历 / 报名": "Résumé / application",
  "毕业证 / 职称": "Diploma / certificate",
  "驾驶证": "Driving licence",
  "护照 / 港澳": "Passport / HK-Macao",
  "部分签证": "Some visas",
  "美国签证": "US visa",
  "请上传 JPG、PNG 或 WebP 图片": "Please upload a JPG, PNG or WebP image",
  "HEIC 格式暂不支持，请先转换成 JPG": "HEIC isn't supported yet — convert it to JPG first",
  "图片读取失败，请换一张试试": "Couldn't read that image, try another one",
  "已下载电子版": "Digital copy downloaded",
  "这个规格太大了，6 寸相纸放不下": "That spec is too large for a 6-inch sheet",

  /* ---------- Base64 ---------- */
  "图片转 Base64 — 在线生成 Data URI，本地转换 | PixKit": "Image to Base64 — generate Data URIs locally | PixKit",
  "/ 图片转 Base64": "/ Image to Base64",
  "把图片转成 Base64 编码或 Data URI，可直接内嵌到 CSS、HTML、Markdown 里，省掉一次 HTTP 请求。转换在你的浏览器里完成。":
    "Turn an image into Base64 or a Data URI you can inline in CSS, HTML or Markdown, saving one HTTP request. Conversion happens in your browser.",
  "本地转换：图片不会上传，适合处理未公开的设计稿和素材。":
    "Local conversion: nothing is uploaded, safe for unreleased designs and assets.",
  "建议用于 10KB 以内的小图标 · 也可以": "Best for icons under 10KB · or",
  "纯 Base64": "Raw Base64",
  "Base64 是什么，为什么要把图片塞进去": "What Base64 is, and why inline images at all",
  "Base64 是一种把二进制数据编码成纯文本的方案。图片本身是二进制，浏览器只认二进制， 但 CSS、HTML、JSON 这些地方只能放文本 —— Base64 解决的正是这个问题：把图片变成一串能用文本表示的字符。":
    "Base64 encodes binary data as plain text. Images are binary and browsers want binary, but CSS, HTML and JSON can only hold text — Base64 bridges that gap by turning an image into a string of characters.",
  "最典型的用法是把小图标直接写进 CSS：": "The classic use is putting a small icon straight into CSS:",
  "这样做的好处是省掉一次图片请求。图标很小的时候，建立连接的开销（DNS、TCP、TLS）比传输数据本身还大， 内嵌反而更快。":
    "The benefit is skipping a request. For a tiny icon, the connection overhead (DNS, TCP, TLS) outweighs the payload, so inlining is actually faster.",
  "什么时候不该用": "When not to use it",
  "别把大图转 Base64。": "Don't inline large images.",
  "Base64 会让体积膨胀约 33%，而且这部分数据无法被浏览器单独缓存 —— 图片更新时整个 CSS/HTML 文件都要重新下载。超过 10KB 就该用独立文件。":
    "Base64 inflates size by about 33%, and that data can't be cached separately — change the image and the whole CSS/HTML file must be re-downloaded. Past 10KB, use a separate file.",
  "：1–5KB 的图标、logo、加载动画、邮件模板里的图片（很多邮件客户端会拦截外链图片）":
    ": icons of 1–5KB, logos, loading spinners, images in email templates (many clients block external images)",
  "：照片、大尺寸 banner、会被复用的素材": ": photos, large banners, assets reused across pages",
  "性能提示": "Performance tip",
  "：如果图标是单色的，用内联 SVG 比 Base64 编码的 PNG 小得多，而且可以改颜色":
    ": for a single-color icon, inline SVG is far smaller than a Base64 PNG and you can recolor it",
  "体积怎么算的": "How the size math works",
  "每 3 个字节编成 4 个字符，所以理论膨胀率是 4/3 ≈ 133%。如果再加上":
    "Every 3 bytes become 4 characters, so the theoretical inflation is 4/3 ≈ 133%. Add the",
  "这样的前缀，实际增长会略高一点。页面上的「膨胀」百分比就是按这个算的。":
    "prefix and the real increase is slightly higher. The inflation percentage shown here accounts for that.",
  "转换后的文字可以直接粘到项目里吗": "Can I paste the output straight into my project?",
  "可以。上面的格式标签会自动套好语法 —— 选 CSS 就直接给你": "Yes. The format tabs wrap it for you — CSS gives you",
  "，选 HTML 就是完整的": ", HTML gives you a complete",
  "标签。复制粘贴即可。": "tag. Copy and paste.",
  "为什么我的图片转出来特别长": "Why is my output so long?",
  "Base64 是原文的 1.33 倍，一张 100KB 的图片会变成 13 万字符。如果觉得太长，先用压缩工具把图片压小，再回来转。":
    "Base64 is 1.33× the original — a 100KB image becomes about 130,000 characters. If that's too much, compress the image first, then come back.",
  "SVG 也能转吗": "Can I convert SVG?",
  "能，但没必要。SVG 本身就是文本格式，直接内联进 HTML 更好 —— 体积更小，还能用 CSS 控制颜色。只有当你必须把它当作图片资源引用时，才需要 Base64。":
    "You can, but there's no point — SVG is already text. Inline it into the HTML instead: smaller, and CSS can recolor it. Base64 only makes sense when it must be referenced as an image asset.",
  "支持 WebP 和 AVIF 吗": "Does it support WebP and AVIF?",
  "支持。Data URI 里的 MIME 类型会跟着原文件走，浏览器的解码能力和普通图片请求一致。":
    "Yes. The Data URI keeps the original MIME type, and the browser decodes it exactly as it would a normal image request.",
  "请选择图片文件": "Please choose an image file",
  "图片超过 5MB，转成 Base64 会非常长，建议先压缩": "Over 5MB — the Base64 output will be enormous. Compress it first.",
  "这张图超过 50KB，内嵌到 CSS/HTML 会明显拖慢加载": "This image is over 50KB; inlining it will noticeably slow page loads",
  "读取失败，请换一张图片": "Couldn't read that file, try another image",
  "已复制": "Copied",
  "复制失败，请手动全选文本": "Copy failed — select the text manually",

  /* ---------- 取色器 ---------- */
  "图片取色器 — 吸取颜色，提取主色板，生成 HEX/RGB | PixKit": "Color Picker — pick colors, extract palettes, get HEX/RGB | PixKit",
  "/ 图片取色器": "/ Color Picker",
  "鼠标移到图片上即可实时取色，带像素放大镜。点击拾取颜色，自动提取整张图的主色调色板。":
    "Hover the image to sample colors with a pixel magnifier, click to keep one, and get the image's dominant palette automatically.",
  "本地处理：图片不会上传，可以放心取色未发布的设计稿。":
    "Local processing: nothing is uploaded, safe for unreleased designs.",
  "支持 JPG / PNG / WebP · 也可以": "JPG / PNG / WebP · or",
  "当前颜色": "Current color",
  "主色调色板": "Dominant palette",
  "加载图片后自动提取": "Extracted automatically once an image loads",
  "取色记录": "Picked colors",
  "点击图片开始取色": "Click the image to start picking",
  "换一张图片": "Choose another image",
  "怎么用": "How to use it",
  "悬停取色": "Hover to sample",
  "：鼠标在图片上移动，右上角放大镜显示周围 9×9 像素的放大效果，中央小方框就是取样点":
    ": move the cursor over the image; the magnifier shows a 9×9 pixel area and the center box is the sample point",
  "点击固定": "Click to keep",
  "：点击图片把当前颜色记下来，会出现在下方「取色记录」里":
    ": click to record the current color — it shows up under Picked colors",
  "一键复制": "Copy in one click",
  "：点 HEX / RGB / HSL 任意一行就复制对应格式": ": click any HEX / RGB / HSL row to copy that format",
  "提取主色": "Extract palette",
  "：图片加载完成自动分析，给出这张图最常用的 8 个颜色":
    ": analyzed automatically on load, showing the image's 8 most common colors",
  "HEX、RGB、HSL 该用哪个": "HEX, RGB or HSL?",
  "三个都是同一个颜色的不同写法，用哪个取决于场景：": "All three describe the same color; pick by situation:",
  "：写 CSS、做设计稿标注最常用，紧凑好记": ": most common in CSS and design annotations — compact and easy to remember",
  "：需要程序化计算时用，比如做颜色混合、调透明度":
    ": use when computing, e.g. blending colors or changing opacity",
  "：调色时最直观 —— 想调亮就改 L，想调鲜艳就改 S，想换色相只改 H。做配色方案时比 HEX 好用得多":
    ": the most intuitive for tweaking — raise L to lighten, S to saturate, H to shift hue. Far easier than HEX for building palettes",
  "一个实用技巧：": "One practical trick:",
  "取到主色后，把 HSL 的 L（亮度）每次加减 10%，就能快速得到一组同色系的深浅色， 比手动调 HEX 准得多。":
    "Once you have a base color, step HSL lightness up or down by 10% to get a consistent set of shades — far more reliable than guessing at HEX values.",
  "主色板是怎么算的": "How is the palette computed?",
  "把图片缩小采样后，按颜色分桶统计出现频率，再合并过于接近的颜色，取占比最高的几个。 这是「这张图主要是什么颜色」，不是「设计上最该用哪个颜色」—— 后者需要人判断。":
    "The image is downsampled, colors are bucketed by frequency, near-identical buckets merged, and the top few returned. That answers \"what colors dominate this image\", not \"which color should the design use\" — that needs a human.",
  "所以如果图片有大片白色背景，白色通常排第一。想拿到真正的主体色，建议先裁掉背景再来取色。":
    "So a large white background will usually rank first. Crop the background away first if you want the subject's color.",
  "取到的颜色和被压缩过的原图不一样": "The color doesn't match the original",
  "JPEG 是有损压缩，相邻像素之间会互相影响，同一个\"纯色\"区域里每个像素的值可能都略有不同。放大镜就是为这个设计的 —— 多取几个点，看哪个值最稳定。":
    "JPEG is lossy and neighbouring pixels affect each other, so a \"flat\" area can hold slightly different values. That's what the magnifier is for — sample a few points and take the steadiest one.",
  "支持手机吗": "Does it work on mobile?",
  "支持，手指按住拖动即可取色，放大镜会跟着移动。不过小屏幕上精确定位比较难，建议把图片放大后再取。":
    "Yes — press and drag to sample, the magnifier follows. Precise positioning is fiddly on a small screen, so zoom the image in first.",
  "能导出成 ASE 或 CLR 调色板文件吗": "Can I export an ASE or CLR palette?",
  "目前不支持。如果你需要，可以先复制 HEX 值，在设计软件里手动建色板 —— 一般也就 8 个颜色，比导入文件快。":
    "Not currently. Copy the HEX values and build the swatches by hand — with only 8 colors it's faster than importing a file anyway.",
  "没能提取到颜色": "Couldn't extract any colors",
  "复制失败，请手动选择": "Copy failed, please select manually",

  /* ---------- EXIF ---------- */
  "清除照片 EXIF 信息 — 删除 GPS 定位，无损不上传 | PixKit": "Strip Photo EXIF — remove GPS data, lossless | PixKit",
  "/ 清除 EXIF": "/ Strip EXIF",
  "清除照片 EXIF 信息": "Strip photo EXIF data",
  "先看清楚照片里藏了什么 —— 拍摄地点、设备型号、精确时间，然后一键删掉。直接修改文件字节，不重新编码，画质零损失。":
    "See what a photo is carrying — location, device model, exact time — then delete it. The file's bytes are edited directly, never re-encoded, so quality is untouched.",
  "本地处理：这正是这个工具存在的意义 —— 你不该把带定位信息的照片上传给任何服务器。":
    "Local processing: that's the whole point — you shouldn't upload a location-tagged photo to anyone's server.",
  "拖入一张照片，看看它暴露了多少信息": "Drop a photo in and see how much it reveals",
  "支持 JPG / JPEG · 手机拍的、相机拍的都行": "JPG / JPEG · phone or camera, either works",
  "换一张照片": "Choose another photo",
  "清除全部元数据并下载": "Strip all metadata and download",
  "照片里到底藏了什么": "What's actually hidden in a photo",
  "用手机拍一张照片，除了画面本身，设备还会写入一段叫 EXIF 的附加信息。大部分人不知道它的存在， 但里面通常包含：":
    "A phone photo carries more than pixels: the device writes an extra block called EXIF. Most people never see it, but it usually contains:",
  "GPS 坐标": "GPS coordinates",
  "：精确到米。很多人就是靠这个被定位到住址": ": accurate to the metre — this is how people get traced to their home",
  "设备型号": "Device model",
  "：甚至包括机身序列号（专业相机）": ": professional cameras even record the body serial number",
  "拍摄时间": "Capture time",
  "：精确到秒，能推断作息规律": ": down to the second, enough to infer daily routines",
  "后期软件": "Editing software",
  "：暴露你用什么工具编辑过": ": shows which tool you edited with",
  "方向、光圈、快门、ISO": "Orientation, aperture, shutter, ISO",
  "：这些相对无害，但也能拼出设备指纹": ": fairly harmless alone, but they add up to a device fingerprint",
  "真实场景：": "A real scenario:",
  "在二手交易平台发自家的物品照片，原图带着 GPS 坐标 —— 等于把家庭住址公开挂在网上。 这类事情每年都在发生。":
    "Posting photos of your furniture on a second-hand marketplace, original GPS intact, publishes your home address. This happens every year.",
  "「无损」是什么意思": "What does \"lossless\" mean here?",
  "大部分在线工具的做法是把图片重新用 canvas 编码一遍，元数据自然就没了 —— 但这也意味着":
    "Most online tools re-encode the image through a canvas, which drops metadata — but it also means",
  "画质被重新压缩了一次": "the image gets compressed a second time",
  "， 尤其是 JPEG，每编码一次都会损失一点。": ", and JPEG loses a little with every pass.",
  "这个工具不碰图像数据。JPEG 文件是由一段段「段」拼起来的：":
    "This tool never touches the image data. A JPEG is a chain of segments:",
  "标记的段装元数据，": "segments carry metadata, and",
  "之后才是真正的压缩图像。我们要做的只是把前者摘掉，后面的字节原封不动搬过去 —— 文件变小了，画面一个像素都没变。":
    "is where the compressed image starts. We remove the former and copy the latter byte for byte — smaller file, identical pixels.",
  "微信、微博发图会自动清除吗": "Do WeChat and Weibo strip it automatically?",
  "大部分主流平台在压缩图片时会顺带丢掉元数据，所以你在微信里发的图通常是安全的。 但要注意两点：":
    "Most major platforms drop metadata while compressing, so images sent through WeChat are usually safe. Two caveats:",
  "「原图」发送": "Sending as \"original\"",
  "有可能会保留完整信息，取决于平台版本": "may preserve everything, depending on the app version",
  "邮件附件、网盘、论坛直传、二手平台": "Email attachments, cloud drives, forum uploads, marketplaces",
  "基本不会处理，原样保留 EXIF": "usually untouched — EXIF stays intact",
  "所以最稳妥的做法是：凡是公开发布的照片，发之前先过一遍这个工具。":
    "So the safe habit: run any photo through this tool before publishing it.",
  "支持 PNG 和 HEIC 吗": "Does it support PNG and HEIC?",
  "目前只处理 JPEG。PNG 的元数据存放在另一种结构里（tEXt/iTXt 块），且手机拍照几乎都是 JPEG，所以优先级不高。HEIC 格式在 Chrome 里无法解码，暂不支持。":
    "Only JPEG for now. PNG stores metadata in a different structure (tEXt/iTXt chunks), and phone photos are almost always JPEG, so it's lower priority. HEIC can't be decoded in Chrome at all.",
  "清除后照片会变小吗": "Does the file get smaller?",
  "会，但幅度不大 —— 只减掉了元数据那部分。一张带 GPS 和缩略图的手机照片，通常能减掉 5–20KB。":
    "Yes, modestly — only the metadata goes. A phone photo with GPS and a thumbnail typically drops 5–20KB.",
  "清除后还能恢复吗": "Can it be undone?",
  "不能。处理结果是一个新文件，原始文件在你电脑上没被动过 —— 所以如果清错了，重新上传原图即可。":
    "No — the output is a new file, and your original is untouched. If you strip the wrong one, just upload the original again.",
  "为什么有些照片显示「没有元数据」": "Why does a photo show \"no metadata\"?",
  "说明这张图已经被处理过了（比如从微信保存下来的图），或者本来就是截图。没有元数据本身是好事。":
    "It has already been processed (a WeChat-saved image, for instance) or was a screenshot to begin with. No metadata is good news.",
  "无需处理": "Nothing to strip",
  "已下载": "Downloaded",
  "这张照片是干净的": "This photo is clean",
  "没有检测到 EXIF，可以放心发布。": "No EXIF found — safe to publish.",
  "没有检测到 EXIF（但发现 ": "No EXIF found (but found ",
  " 段），可以放心发布。": " segments) — safe to publish.",
  "目前只支持 JPEG 格式（.jpg / .jpeg）": "Only JPEG is supported (.jpg / .jpeg)",
  "这不是有效的 JPEG 文件": "That isn't a valid JPEG file",
  "（但发现 ": " (but found ",
  " 段）": " segments)",
  "（含用户注释）": " (includes user comment)",

  /* EXIF 字段名 */
  "图像宽度": "Image width",
  "图像高度": "Image height",
  "图像描述": "Image description",
  "相机厂商": "Camera make",
  "相机型号": "Camera model",
  "方向": "Orientation",
  "水平分辨率": "Horizontal resolution",
  "垂直分辨率": "Vertical resolution",
  "分辨率单位": "Resolution unit",
  "处理软件": "Software",
  "文件修改时间": "File modified",
  "作者": "Author",
  "版权": "Copyright",
  "曝光时间": "Exposure time",
  "光圈": "Aperture",
  "曝光模式": "Exposure mode",
  "快门速度": "Shutter speed",
  "光圈值": "Aperture value",
  "测光模式": "Metering mode",
  "闪光灯": "Flash",
  "焦距": "Focal length",
  "厂商注释": "Maker note",
  "用户注释": "User comment",
  "秒以下时间": "Subsec time",
  "原始秒以下时间": "Subsec time original",
  "数字化秒以下时间": "Subsec time digitized",
  "像素宽度": "Pixel width",
  "像素高度": "Pixel height",
  "曝光补偿": "Exposure bias",
  "白平衡": "White balance",
  "场景模式": "Scene mode",
  "相机所有者": "Camera owner",
  "机身序列号": "Body serial number",
  "镜头规格": "Lens specification",
  "镜头厂商": "Lens make",
  "镜头型号": "Lens model",
  "镜头序列号": "Lens serial number",
  "正常": "Normal",
  "水平翻转": "Mirrored horizontally",
  "旋转 180°": "Rotated 180°",
  "垂直翻转": "Mirrored vertically",
  "顺时针 90° + 翻转": "90° clockwise + mirrored",
  "顺时针 90°": "90° clockwise",
  "逆时针 90° + 翻转": "90° counter-clockwise + mirrored",
  "逆时针 90°": "90° counter-clockwise",
  "纬度": "Latitude",
  "经度": "Longitude",
  "海拔": "Altitude",
  "位置信息": "Location",
  "序列号": "Serial number",
  "所有者": "Owner",
  "设备信息": "Device",
  "时间": "Time",
  "拍摄参数": "Capture settings",
  "其它": "Other",
  "注释": "Comments",
};
