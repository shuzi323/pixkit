/**
 * 长尾预设页的英文词典
 *
 * 单独成文件的原因：这些页面是"同一个工具的不同用法"，文案量大且彼此独立，
 * 塞进 i18n.tools.js 会让那个文件变成一锅粥。构建时它们只存在于 dist，
 * 但文案源头是 scripts/presets.mjs —— 改那边记得同步这里，
 * 漏了的话 npm run test:i18n 会逐页扫出来。
 */

export const PRESETS_EN = {

  /* ---------- 公用的场景入口 ---------- */
  "按用途进入：": "By use case:",
  "压缩到 200KB": "Compress to 200KB",
  "压缩到 1MB": "Compress to 1MB",
  "转成 WebP": "Convert to WebP",
  "一寸照片": "1-inch photo",
  "二寸照片": "2-inch photo",
  "多图合并成一个 PDF": "Merge several images into one PDF",

  /* ---------- 压缩到 200KB ---------- */
  "/ 压缩到 200KB": "/ Compress to 200KB",
  "图片压缩到 200KB": "Compress an image to 200KB",
  "切换到「按目标大小」并填入 200，每张图会被压到 200KB 以内 —— 接近上限但不超，适合有硬性大小限制的提交系统。":
    "Switches to target-size mode with 200 filled in. Each image lands under 200KB — close to the cap but never over, for submission systems with hard limits.",
  "为什么偏偏是 200KB": "Why 200KB exactly?",
  "人事考试报名、事业单位招聘、学校教务系统、部分政务平台，上传的证件照和证明材料普遍限制在 200KB 以内。 邮箱附件和不少论坛的上限也在这个量级。这不是随便定的数字，而是这类系统的历史配置，短期内不会变。":
    "Civil-service exams, school systems and many government portals cap uploads at 200KB, and email attachments plus plenty of forums sit in the same range. It isn't an arbitrary number — it's the historical configuration of those systems, and it won't change soon.",
  "这个模式下，工具会逐张二分查找质量参数，输出落在 200KB 以内但尽量接近的位置。 参数是整数步进，不可能精确命中某个数值，所以宁可略低一点 —— 刚好压线然后被系统拒收，是最冤的一种失败。":
    "In this mode the tool binary-searches the quality setting per image and lands just under 200KB. Quality steps in whole numbers, so an exact size is impossible — it errs low on purpose, since being rejected for overshooting is the worst outcome.",
  "压完还是超了？": "Still over the limit?",
  "说明图片本身边长太大。把「最大边长」设成 1200 再压一次，手机照片和文档扫描件基本都能下来。 原图不会被改动，压缩结果是单独的文件。":
    "Then the image itself is too large. Set the longest edge to 1200 and compress again — phone photos and scanned documents usually come down easily. Your originals are never modified.",
  "压出来会不会刚好卡在 200KB 超一点": "Could the result end up a hair over 200KB?",
  "不会。工具会保证结果在 200KB 以内，通常落在 170–199KB 之间。宁可略小一点，也不会压到超出上限被系统拒收。":
    "No. Output stays under 200KB, usually between 170 and 199KB. It errs slightly small rather than risk being rejected.",
  "压缩后还是超过 200KB 怎么办": "What if it's still over 200KB afterwards?",
  "先用「最大边长」限制尺寸再压一次。比如 4000 像素宽的手机照片先缩到 1200 像素，体积会降到原来的十分之一左右，再按 200KB 压就很轻松。":
    "Limit the size first, then compress again. A 4000px phone photo scaled to 1200px drops to roughly a tenth, which makes 200KB easy.",
  "一次能压多少张": "How many images at once?",
  "建议一次不超过 100 张。处理在本机内存里跑，张数太多会明显变慢，处理过程中不要关闭页面。":
    "Aim for 100 or fewer per batch. Everything runs in local memory; too many files slows it down noticeably, so don't close the page mid-run.",

  /* ---------- 压缩到 1MB ---------- */
  "/ 压缩到 1MB": "/ Compress to 1MB",
  "图片压缩到 1MB": "Compress an image to 1MB",
  "目标设成 1024KB。这个额度相对宽松，画质可以给到 90 以上 —— 手机屏和电脑屏上看和原图没区别，打印 A4 也够用。":
    "Targets 1024KB. That's a generous budget, so quality stays above 90 — indistinguishable from the original on screen, and good enough for A4 printing.",
  "1MB 是个什么概念": "How big is 1MB, really?",
  "手机直出的照片通常 3–5MB，4800 万像素的机型能到 10MB 以上；而微信聊天里发原图、多数邮箱的单个附件、 不少后台的上传限制，都卡在 1MB 这一档。差的那几 MB，压掉的基本都是肉眼看不出的人眼不敏感细节。":
    "Phone photos are usually 3–5MB, and 48MP models reach 10MB or more — while sending originals in chat, most email attachment limits and plenty of upload forms stop at 1MB. What gets dropped is mostly detail the eye doesn't register.",
  "1MB 的目标值比较宽松，质量参数通常落在 85–92 之间。这个区间里照片的锐度和色彩都很稳， 不像压到 100KB 以下那样会出现明显的色块和糊边。":
    "At 1MB the quality setting usually lands between 85 and 92. Sharpness and colour hold up well there — unlike the visible banding you get below 100KB.",
  "要进公众号？": "Publishing to WeChat?",
  "后台会再压一次。先自己压到 1MB 以内再上传，比让它二次压缩的效果好 —— 你至少还能控制压缩发生在画质最好的那一次。":
    "The platform compresses again. Shrinking to 1MB yourself first gives a better result than letting it re-compress — you at least control the pass that happens at the highest quality.",
  "压到 1MB 画质会明显变差吗": "Does compressing to 1MB hurt quality?",
  "不会。1MB 对一张 1200 万像素的照片仍然宽裕，质量参数在 85 以上，手机和电脑屏幕上基本看不出差别。真正让画质崩掉的是把目标设到 100KB 以下。":
    "No. 1MB is still roomy for a 12MP photo, with quality above 85 — on phone and desktop screens you won't see a difference. Quality only collapses below 100KB.",
  "为什么 PNG 截图压不到 1MB 以下": "Why won't a PNG screenshot drop below 1MB?",
  "PNG 是无损格式，可压缩空间本来就小。截图这类图建议把输出格式改成 WebP 或 JPG，体积能掉一个数量级，肉眼几乎无差。":
    "PNG is lossless, so there's little to squeeze. For screenshots, switch the output format to WebP or JPG — the file shrinks by an order of magnitude with no visible difference.",
  "手机拍的一张照片大概多大": "How large is a phone photo?",
  "1200 万像素约 3–5MB，4800 万像素约 8–15MB。所以手机照片基本都需要压一次才方便发送，这是正常的。":
    "About 3–5MB at 12MP and 8–15MB at 48MP, so phone photos almost always need a pass before sending. That's normal.",

  /* ---------- 转 WebP ---------- */
  "/ 转成 WebP": "/ Convert to WebP",
  "图片转 WebP": "Convert an image to WebP",
  "默认输出 WebP、质量 82。同等观感下体积通常比 JPG 小 25%–35%，是给网页配图最省事的一档设置。":
    "Outputs WebP at quality 82 by default — usually 25%–35% smaller than JPG at the same perceived quality, the easiest setting for web images.",
  "WebP 到底省多少": "How much does WebP actually save?",
  "同等画质下，WebP 比 JPG 小 25%–35%，比 PNG 小得更多 —— 尤其是有大片纯色的图标、图表和截图。 它还会参考周围像素来预测当前块的内容，所以渐变和纹理的过渡比 JPG 更干净。":
    "At equal quality, WebP is 25%–35% smaller than JPG and far smaller than PNG — especially for icons, charts and screenshots with large flat areas. It also predicts each block from neighbouring pixels, so gradients and textures transition more cleanly than JPG.",
  "代价是兼容性：2020 年之后的浏览器、微信、手机相册都没问题，但 Office 2007 这类老软件打不开。 给网页用可以直接换；当附件发给不确定的对象，先问一句或者干脆用 JPG。":
    "The cost is compatibility: browsers, WeChat and phone galleries since 2020 handle it, but Office 2007 and similar old software can't open it. Fine for the web; if you're emailing someone who might be on old software, ask first or just use JPG.",
  "需要透明背景？": "Need transparency?",
  "WebP 支持透明通道，PNG 转 WebP 能同时保住透明和更小的体积 —— 这是它相对 JPG 最实用的一个优势。":
    "WebP supports an alpha channel, so PNG to WebP keeps transparency and still gets smaller — its most practical edge over JPG.",
  "WebP 兼容性怎么样": "How good is WebP support?",
  "Chrome、Edge、Firefox、Safari 14+ 都支持，微信和手机相册也能正常显示。真正会打不开的是 2015 年前的旧软件和 Office 2007 这类老程序。":
    "Chrome, Edge, Firefox and Safari 14+ all handle it, as do WeChat and phone galleries. What breaks is software from before 2015 and old apps like Office 2007.",
  "PNG 转 WebP 会丢透明吗": "Does PNG to WebP lose transparency?",
  "不会。WebP 有透明通道，透明区域会原样保留。这一点和转 JPG 完全不同 —— 转 JPG 时透明区域会变成白色。":
    "No. WebP has an alpha channel and transparent areas are preserved — the opposite of converting to JPG, where they turn white.",
  "WebP 和 AVIF 该选哪个": "WebP or AVIF?",
  "AVIF 更小，同等画质下还能再省 20% 左右，但编码慢、兼容性差一些。给网页配图用 WebP 更稳，追求极致体积再考虑 AVIF。":
    "AVIF is smaller — roughly another 20% at equal quality — but slower to encode and less compatible. WebP is the safer pick for web images; choose AVIF only when you need the last few percent.",

  /* ---------- 一寸照 ---------- */
  "/ 一寸照片": "/ 1-inch photo",
  "一寸照片制作": "Make a 1-inch ID photo",
  "已切到一寸规格：25×35 毫米，300dpi 下 295×413 像素。简历、工作证、多数考试报名都用这个尺寸。":
    "Switched to the 1-inch preset: 25×35mm, 295×413 pixels at 300dpi. The size used for résumés, work badges and most exam registrations.",
  "一寸照的标准参数": "The standard 1-inch specs",
  "国内通行的「一寸」是 25×35 毫米，300dpi 换算过来就是 295×413 像素。 报名系统里可能写成「295×413」「2.5×3.5cm」或「25×35mm」，说的都是同一件事。":
    "The common 1-inch size in China is 25×35mm, which is 295×413 pixels at 300dpi. Registration systems may write it as 295×413, 2.5×3.5cm or 25×35mm — all the same thing.",
  "构图有通行规则：头顶到照片上沿留 8%–12% 的空隙，头部（头顶到下巴）占画面高度的 60%–70%， 肩膀露出一点。页面上的两条虚线就是给这个用的，头顶对齐上面那条、下巴对齐下面那条，基本就合规。":
    "Composition follows a convention: 8%–12% of headroom above the crown, the head (crown to chin) taking 60%–70% of the frame height, shoulders just visible. The two guide lines on the canvas are for exactly this — crown on the upper one, chin on the lower one, and you're compliant.",
  "要打印？": "Printing it?",
  "切到排版模式，会把裁好的照片按 6 寸相纸（152×102mm）自动排列，一寸能排 12 张。 去照相馆或自助机按「6 寸冲印」下单即可。":
    "Switch to layout mode and the cropped photo is arranged on 6-inch paper (152×102mm) automatically — twelve per sheet for 1-inch. Order a 6-inch print at any photo shop or kiosk.",
  "一寸照片是多少像素": "How many pixels is a 1-inch photo?",
  "300dpi 下是 295×413 像素，对应 25×35 毫米。如果平台按 350dpi 要求，会是 344×482 像素 —— 以报名页面写明的数字为准。":
    "295×413 at 300dpi, which is 25×35mm. At 350dpi it becomes 344×482 — go with whatever number the registration page states.",
  "白底、蓝底还是红底": "White, blue or red background?",
  "报名系统通常会写明。没写就用白底，最通用；蓝底多用于工作证和社保类材料，红底多用于证件和部分考试。":
    "The system usually specifies. If not, white is the safest default; blue is common for work badges and social-security paperwork, red for certificates and some exams.",
  "手机拍的照片能直接做证件照吗": "Can I use a phone photo?",
  "可以，但要满足三点：正面、光线均匀、背景是纯色墙面。前置摄像头会让脸型失真，能用后置就用后置，找人帮忙拍。":
    "Yes, if three things hold: facing forward, even lighting, plain wall behind. Front cameras distort facial proportions — use the rear camera and have someone else take the shot.",

  /* ---------- 二寸照 ---------- */
  "/ 二寸照片": "/ 2-inch photo",
  "二寸照片制作": "Make a 2-inch ID photo",
  "已切到二寸规格：35×49 毫米，300dpi 下 413×579 像素。毕业证、职称评审、部分资格证书用这个尺寸。":
    "Switched to the 2-inch preset: 35×49mm, 413×579 pixels at 300dpi. Used for diplomas, professional-title reviews and some qualification certificates.",
  "二寸和一寸差在哪": "How is 2-inch different from 1-inch?",
  "二寸是 35×49 毫米，300dpi 下 413×579 像素，比一寸（25×35mm）整整大一圈。 毕业证、学位证采集、职称评审、部分资格证报名用二寸，简历和普通考试报名多用一寸。":
    "2-inch is 35×49mm — 413×579 pixels at 300dpi — a full size up from 1-inch (25×35mm). Diplomas, degree-photo capture, title reviews and some certificate sign-ups use 2-inch; résumés and ordinary exam registrations mostly use 1-inch.",
  "尺寸搞错是证件照被打回最常见的原因。25×35 和 35×49 打印出来看着差不多， 但在报名系统里会被直接判为不合格 —— 提交前一定核对通知里写的毫米数或像素数。":
    "Wrong dimensions are the most common reason a photo gets rejected. 25×35 and 35×49 look similar in print, but the system refuses it outright — check the millimetres or pixels in the notice before submitting.",
  "6 寸相纸能排几张？": "How many fit on 6-inch paper?",
  "二寸能排 8 张。排版模式自动计算行列并居中， 冲印时按 6 寸下单，剪开就是标准尺寸。":
    "Eight for 2-inch. Layout mode works out the rows and columns and centres them; order a 6-inch print and cut them apart.",
  "二寸照片的像素是多少": "How many pixels is a 2-inch photo?",
  "35×49 毫米，300dpi 下是 413×579 像素。有些系统会要求 412×579 或 413×626，以报名页面给出的数字为准。":
    "35×49mm, which is 413×579 pixels at 300dpi. Some systems ask for 412×579 or 413×626 — follow the registration page.",
  "毕业证用几寸": "Which size do diplomas use?",
  "多数高校的毕业证、学位证图像采集用二寸（35×49mm），部分学校指定蓝底。具体以学校通知为准，通知里通常写明了尺寸和底色。":
    "Most universities capture diploma and degree photos at 2-inch (35×49mm); some specify a blue background. Follow your school's notice, which usually states both size and background.",
  "一寸和二寸能互相替代吗": "Can 1-inch and 2-inch be swapped?",
  "不能。两者比例不同：一寸放大到二寸会模糊，二寸裁成一寸会切掉肩膀。要哪个规格就按哪个裁。":
    "No. The proportions differ: enlarging a 1-inch blurs it, and cropping a 2-inch down cuts off the shoulders. Crop for the size you actually need.",

  /* ---------- 多图合并 PDF ---------- */
  "/ 多图合并": "/ Merge images",
  "多张图片合并成 PDF": "Merge several images into one PDF",
  "默认 A4 纵向 + 适中页边距，适合打印和正式提交。列表顺序就是页序，用每行右侧的箭头调整。":
    "Defaults to A4 portrait with normal margins — right for printing and formal submissions. List order is page order; use the arrows on each row.",
  "合并前先想清楚三件事": "Three things to settle before merging",
  "顺序。": "Order.",
  "报销单据按时间排，报名材料按通知里列的顺序排 —— 审核的人按顺序看，顺序乱了要多花时间找。 列表顺序就是页序，第一张就是第一页。":
    "Sort receipts by date, and application materials in the order the notice lists them — reviewers read top to bottom, and a scrambled order wastes their time. List order is page order; the first image is page one.",
  "纸张。": "Paper.",
  "要打印就选 A4 纵向，图片会等比缩放到页面内并居中，绝不裁掉内容； 只在电脑上看，选「跟随图片」更省体积。":
    "For printing, choose A4 portrait: images scale proportionally and centre, never cropped. Screen-only? Match-the-image saves size.",
  "清晰度。": "Sharpness.",
  "质量低于 80 时打印出来能看到块状噪点。要打印就设 92 以上，文件大一点也值得。":
    "Below quality 80 you can see blocky artefacts in print. Use 92 or higher if it's going on paper — a slightly larger file is worth it.",
  "不同尺寸的图能混在一个 PDF 里吗": "Can mixed sizes go into one PDF?",
  "能。每张图各自等比缩放并居中，横图和竖图可以放在同一个文件里，页序按列表顺序。":
    "Yes. Each image is scaled proportionally and centred, so landscape and portrait can share one file — page order follows the list.",
  "合并后文件太大怎么办": "What if the merged PDF is too large?",
  "降低质量滑块（打印用 92，屏幕看 80 就够），或者把页面尺寸改成「跟随图片」——A4 页面为了填满纸张会放大图片，反而更占体积。":
    "Lower the quality slider (92 for printing, 80 for screen), or switch the page size to match-the-image — A4 enlarges images to fill the sheet, which actually costs more.",
  "能在手机上操作吗": "Does it work on a phone?",
  "可以。从相册选图就能合并，生成的 PDF 存到下载目录；iOS 上会存进「文件」App。":
    "Yes. Pick photos from the gallery and merge; the PDF lands in Downloads, or in Files on iOS.",
};
