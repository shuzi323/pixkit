/**
 * 英文词典（文本类工具）：Base64 转图片 / 时间戳转换 / JSON 格式化
 * 键是中文原文，与页面里写的完全一致。
 */

export const TEXT = {
  /* ============================================================
     Base64 转图片
     ============================================================ */
  "Base64 转图片 — 在线解码还原成图片，本地处理 | PixKit":
    "Base64 to Image — Decode Base64 into an image, locally | PixKit",
  "/ Base64 转图片": "/ Base64 to Image",
  "Base64 转图片": "Base64 to image",
  "把 Base64 字符串还原成真正的图片文件。粘贴 Data URI 或纯 Base64 都行，格式自动识别，解完直接下载。":
    "Turn a Base64 string back into a real image file. Paste a Data URI or raw Base64 — the format is detected automatically and you can download it right away.",
  "本地解码：字符串不会上传，适合处理内部系统导出的图片数据。":
    "Decoded locally: the string is never uploaded, so it's safe for image data exported from internal systems.",
  "Base64 字符串": "Base64 string",
  "载入示例": "Load sample",
  "解码结果": "Decoded image",
  "粘贴 Base64 后，这里会显示图片": "Paste Base64 and the image shows up here",
  "下载图片": "Download image",

  "Base64 转图片到底做了什么": "What decoding actually does",
  "Base64 是一串纯文本，本身不是图片。它内部装着图片的二进制字节，只是用 64 个可打印字符表示出来。 「解码」要做的就是把文本还原成字节，再交给浏览器还原成画面 —— 这一步不需要联网，也不需要服务器。":
    "Base64 is plain text, not an image. It holds the image's binary bytes, expressed with 64 printable characters. Decoding means turning that text back into bytes and letting the browser draw them — no network, no server.",
  "所以这个工具做的事情很简单：解析字符串 → 还原字节 → 推测格式 → 生成可下载的文件。 你看到的那张预览图和最后下载的文件，是同一份数据。":
    "So the work here is simple: parse the string, restore the bytes, infer the format, produce a downloadable file. The preview you see and the file you download are the same data.",

  "不写": "Even without the",
  "前缀也能识别": "prefix it still works",
  "很多工具要求你必须粘贴完整的": "Most tools insist on the full",
  "，少一段就报错。 这里换了个办法：直接读字节头部的「魔数」（magic number），也就是每种图片格式固定的开头几个字节。":
    " and fail if a piece is missing. This one takes a different route: it reads the magic number at the head of the bytes — the fixed opening bytes each image format uses.",
  "常见格式的魔数：": "Magic numbers of common formats:",
  "PNG 是": "PNG is",
  "，JPEG 是": ", JPEG is",
  "， GIF 是": ", GIF is",
  "，WebP 是": ", WebP is",
  "，BMP 是": ", BMP is",
  "， SVG 则是文本形式的": ", and SVG is plain text beginning with",
  "开头。": ".",
  "这样做的好处是两个：一是纯 Base64 字符串能直接用，二是当有人把 PNG 的数据错标成":
    "That buys two things: raw Base64 works directly, and when PNG data is mislabeled as",
  "时， 你拿到的仍然是正确的": ", you still get a correct",
  "文件，而不是一个改错扩展名、某些软件打不开的文件。":
    " file instead of one with a wrong extension that some apps refuse to open.",

  "为什么有时候解不出来": "Why it sometimes fails",
  "字符串被截断了": "The string was truncated",
  "：Base64 的长度必须是 4 的倍数，少几个字符就解不出来。常见于从聊天窗口复制长文本时被折叠。":
    ": Base64 length must be a multiple of 4; a few missing characters break it. Usually happens when a chat window collapses a long copy.",
  "混进了别的字符": "Stray characters slipped in",
  "：换行和空格会自动忽略，但引号、HTML 标签、Markdown 包裹符号不会 —— 粘贴前记得去掉。":
    ": newlines and spaces are ignored, but quotes, HTML tags and Markdown wrappers are not — strip them before pasting.",
  "本来就是加密过的内容": "It was never plain image data",
  "：Base64 是编码不是加密，但它经常被用来包一层加密后的数据。那种数据解出来是乱码，不是图片。":
    ": Base64 is encoding, not encryption, but it's often used to wrap already-encrypted data. That decodes to garbage, not an image.",

  "支持多大的图片": "How large can the image be?",
  "浏览器内存允许就能解，实测几十 MB 的 Base64 也能处理。不过文本越大，输入框响应越慢，超过 5MB 的字符串建议直接用代码处理。":
    "As large as browser memory allows — tens of MB has been tested. But the bigger the text, the slower the box responds, so beyond 5MB handle it in code.",
  "能把图片转回 Base64 吗": "Can I convert an image to Base64?",
  "可以，用同站的": "Yes, with the",
  "：上传图片，生成 Data URI、CSS、HTML 或 Markdown 格式的引用。两个工具用的是同一套编码规则。":
    " tool: upload an image and get a Data URI, CSS, HTML or Markdown reference. Both tools share the same encoding rules.",
  "下载的文件名是什么": "What's the downloaded filename?",
  "统一叫": "Always",
  "（扩展名按实际格式变）。Base64 数据里不包含文件名信息，所以没法还原成原始名字。":
    " (the extension follows the real format). Base64 carries no filename, so the original name can't be recovered.",
  "SVG 也能解吗": "Does SVG work?",
  "能。SVG 的 Data URI 有两种写法：": "Yes. SVG data URIs come in two forms:",
  "编码的，和直接内联 XML 的（URL 编码）。两种都能识别，解出来是":
    "-encoded, and inline XML (URL-encoded). Both are recognized and decode to an",
  "文件。": " file.",

  "粘贴 data:image/png;base64,iVBORw0KGgo... 或者只有纯 Base64 内容":
    "Paste data:image/png;base64,iVBORw0KGgo... or just the raw Base64",
  "解码结果预览": "Decoded image preview",
  "免费在线 Base64 转图片工具。粘贴 Data URI 或纯 Base64 字符串，自动识别 PNG / JPG / GIF / WebP / SVG 格式并还原成图片下载。全程在浏览器本地解码，不上传。":
    "Free online Base64 to image converter. Paste a Data URI or raw Base64 and it detects PNG / JPG / GIF / WebP / SVG automatically, then restores a downloadable image. Decoding happens entirely in your browser.",
  "Base64 转图片 — 在线解码还原":
    "Base64 to Image — decode online",

  /* ---- b64img 运行时文案 ---- */
  "长度不合法": "Invalid length",
  "Base64 的字符数必须是 4 的倍数，这段字符串可能被截断了。":
    "Base64 length must be a multiple of 4 — the string is probably truncated.",
  "不是有效的 Base64": "Not valid Base64",
  "内容里含有 Base64 字符集以外的符号。如果外面包了引号或 HTML 标签，先去掉。":
    "It contains characters outside the Base64 alphabet. If it's wrapped in quotes or HTML tags, strip those first.",
  "内容是空的": "Nothing to decode",
  "解码出来是 0 字节，检查一下有没有粘全。":
    "It decodes to 0 bytes — check that the whole string was pasted.",
  "解出来了，但不是图片": "Decoded, but not an image",
  "字节还原成功，但浏览器无法识别它的图片格式。可能这段数据本身不是图片，或者格式太冷门。":
    "The bytes restored fine, but the browser can't recognize the image format. The data may not be an image at all, or the format is too obscure.",
  "格式": "Format",
  "尺寸": "Dimensions",
  "文件大小": "File size",
  "字符串长度": "String length",
  "字符": "characters",
  "剪贴板是空的": "Clipboard is empty",
  "浏览器没给剪贴板权限，请手动 Ctrl+V 粘贴":
    "The browser blocked clipboard access — paste with Ctrl+V instead",
  "文件超过 8MB，建议拆小一点再试": "That file is over 8MB — split it up and try again",

  /* ============================================================
     时间戳转换
     ============================================================ */
  "时间戳转换 — Unix 时间戳与日期互转，本地计算 | PixKit":
    "Timestamp Converter — Unix timestamp and date, computed locally | PixKit",
  "/ 时间戳转换": "/ Timestamp Converter",
  "时间戳转换": "Timestamp converter",
  "Unix 时间戳和日期时间互转。默认按位数自动识别秒 / 毫秒 / 微秒，也可以手动锁定单位。一次给出本地时间、UTC、ISO 8601 和相对时间。":
    "Convert between Unix timestamps and dates. Seconds, milliseconds and microseconds are detected from the digit count by default, or you can pin the unit yourself. You get local time, UTC, ISO 8601 and a relative time at once.",
  "单位": "Unit",
  "自动识别": "Auto-detect",
  "秒": "s",
  "毫秒": "ms",
  "手动指定": "manual",
  "自动判断不是万能的。如果一个值只有 10 位，但它其实是「毫秒」（有些系统从某个纪元点开始计时， 或者只是被截断过），按秒来解会差出几十年。输入框下面有单位切换 —— 选「秒」或「毫秒」之后就不再按位数猜，完全按你指定的来。":
    "Detection isn't foolproof. A 10-digit value that is actually milliseconds (some systems count from a different epoch, or it was truncated) read as seconds lands decades away. Use the unit switch under the input: pick seconds or milliseconds and nothing is guessed any more — the value is read exactly as you specify.",
  "本地计算：换算用的是你系统自带的时区数据，不经过任何服务器。":
    "Computed locally: conversion uses your system's own timezone data, with no server involved.",
  "当前时间": "Current time",
  "当前时间戳": "Current timestamp",
  "时间戳 → 日期时间": "Timestamp → date",
  "日期时间 → 时间戳": "Date → timestamp",
  "现在": "Now",
  "今天 0 点": "Today 00:00",
  "昨天 0 点": "Yesterday 00:00",
  "明天 0 点": "Tomorrow 00:00",

  "时间戳是什么": "What a Unix timestamp is",
  "Unix 时间戳是「从 1970 年 1 月 1 日 00:00:00 UTC 起，过去了多少秒」。它是一个绝对的时间点， 不带时区信息 —— 所以同一个时间戳，在北京显示为下午 5 点，在伦敦显示为上午 9 点，值的本身没有变。":
    "A Unix timestamp counts seconds since 1970-01-01 00:00:00 UTC. It is an absolute instant with no timezone attached — the same value reads as 5pm in Beijing and 9am in London; the value itself never changes.",
  "这也是为什么接口之间传时间都用时间戳：字符串":
    "That's why APIs pass timestamps around: the string",
  "少了时区就没法确定指哪一刻， 而":
    " without a timezone doesn't pin down a moment, while",
  "在世界任何地方都指同一瞬间。":
    " means the same instant anywhere on earth.",

  "秒、毫秒、微秒怎么区分": "Telling seconds from milliseconds",
  "这个工具按位数自动判断，判断规则和主流系统一致：":
    "This tool decides by digit count, matching what mainstream systems do:",
  "≤ 11 位": "≤ 11 digits",
  "→ 秒。现在的时间戳是 10 位，11 位要到 2286 年以后才会出现。":
    " → seconds. Current timestamps have 10 digits; 11 digits won't appear before 2286.",
  "12–14 位": "12–14 digits",
  "→ 毫秒。JavaScript 的": " → milliseconds. JavaScript's",
  "、Java 的": " and Java's",
  "都是这个。": " both work this way.",
  "15 位以上": "15+ digits",
  "→ 微秒。Go 的": " → microseconds. Go's",
  "、部分数据库的时间精度会给出这个。":
    ", and some databases' time precision, produce this.",
  "踩坑提醒：": "Watch out:",
  "单位搞错会让年份差出几十年。把 13 位毫秒当成秒来解，会得到公元 57000 多年 —— 如果你看到这种离谱的年份，先检查位数。":
    "A wrong unit shifts the year by decades. Read a 13-digit millisecond value as seconds and you land past the year 57000 — if a year looks that absurd, check the digit count first.",

  "时区是怎么处理的": "How timezones are handled",
  "页面显示的「本地时间」用的是你操作系统里的时区设置，转换全在浏览器里完成，没有任何网络请求。 换台电脑、换个城市，同一时间戳显示出的本地时间会跟着变，但 UTC 那一行永远不变。":
    "The local time shown comes from your operating system's timezone, and the conversion runs entirely in the browser with no network requests. Move to another machine or city and the local line shifts, while the UTC line never does.",
  "如果你要提交给后端，建议直接用":
    "If you're sending this to a backend, use the",
  "那一行的值（": " line (",
  "）， 它带": "), which carries the",
  "后缀，明确表示是 UTC，不会有歧义。":
    " suffix — unambiguously UTC, no room for confusion.",

  "为什么显示的时间和我预期差了几个小时": "Why is the time a few hours off?",
  "大概率是时区问题。时间戳本身不含时区，展示时才套上本地时区。看「UTC」那一行做对照 —— 如果你期望的是 UTC 时间，用那一行就不会有偏差。":
    "Almost always a timezone issue. A timestamp carries no timezone; one is applied only for display. Compare against the UTC line — if you expected UTC, that line will match.",
  "2038 年之后还能用吗": "Does it still work after 2038?",
  "能。2038 问题出在用 32 位有符号整数存秒的旧系统上，浏览器用的是 64 位双精度浮点，能表示到公元 27 万年左右，日常使用不会遇到上限。":
    "Yes. The 2038 problem affects old systems storing seconds in a signed 32-bit integer. Browsers use 64-bit doubles, good to roughly the year 270000 — you won't hit a limit in practice.",
  "负数时间戳是什么": "What's a negative timestamp?",
  "1970 年之前的时间。比如": "A moment before 1970. For instance",
  "是 1969 年 12 月 31 日。这个工具支持负数，直接输入即可。":
    " is December 31, 1969. Negative values are supported — just type them in.",
  "能批量转换吗": "Can it convert a whole column?",
  "这个页面是单条换算。如果有一整列要转，用 Excel 公式更快：秒级时间戳":
    "This page handles one value at a time. For a column, Excel is faster: for a seconds timestamp use",
  "然后设成日期格式；反过来用":
    " then format the cell as a date; the other way, use",

  "1764062400 或 1764062400000": "1764062400 or 1764062400000",
  "免费在线 Unix 时间戳转换工具。秒 / 毫秒 / 微秒自动识别，时间戳转日期、日期转时间戳，同时显示本地时间、UTC、ISO 8601 和相对时间。纯浏览器计算。":
    "Free online Unix timestamp converter. Detects seconds, milliseconds and microseconds, converts both ways, and shows local time, UTC, ISO 8601 and a relative time. Everything runs in the browser.",
  "时间戳转换 — Unix 时间戳与日期互转":
    "Timestamp Converter — Unix time and date, both ways",

  /* ---- timestamp 运行时文案 ---- */
  "本地时间": "Local time",
  "秒级": "Seconds",
  "毫秒级": "Milliseconds",
  "这不是一个时间戳": "That's not a timestamp",
  "只能填纯数字，可以带负号或小数。日期字符串请用右边的输入框。":
    "Digits only — a minus sign or decimals are fine. For a date string, use the box on the right.",
  "超出可表示的时间范围": "Out of the representable range",
  "这个数值换算后超过公元 27 万年，检查一下是不是把单位搞错了。":
    "Converted, this lands past the year 270000 — check whether the unit is wrong.",
  "星期": "Weekday",
  "UTC": "UTC",
  "ISO 8601": "ISO 8601",
  "相对时间": "Relative",
  "时区": "Timezone",
  "识别单位": "Detected unit",
  "{n} 位数字": "{n} digits",
  "复制失败，请手动选中复制": "Copy failed — select it manually",

  /* ============================================================
     JSON 格式化与排序
     ============================================================ */
  "JSON 格式化与排序 — 在线美化、压缩、键名排序 | PixKit":
    "JSON Formatter & Sorter — Beautify, minify, sort keys | PixKit",
  "/ JSON 格式化与排序": "/ JSON Formatter",
  "JSON 格式化与排序": "JSON formatter & sorter",
  "JSON 格式化": "JSON formatter",
  "粘贴 JSON，实时美化缩进或压缩成单行，可以按键名递归排序。语法错误会指到具体行列，并告诉你错在哪。":
    "Paste JSON and it beautifies or minifies as you type, with optional recursive key sorting. Syntax errors point at the exact line and column, with a hint about what's wrong.",
  "本地处理：接口返回的数据经常带密钥和用户信息，这里一个字都不会发出去。":
    "Processed locally: API responses often carry keys and user data, and not a single character leaves this page.",
  "输出模式": "Output",
  "格式化": "Formatted",
  "压缩成一行": "Minified",
  "缩进": "Indent",
  "2 个空格": "2 spaces",
  "4 个空格": "4 spaces",
  "键名排序": "Sort keys",
  "保持原顺序": "Keep original order",
  "键名 A → Z": "Keys A → Z",
  "键名 Z → A": "Keys Z → A",
  "JSON 输入": "JSON input",
  "示例": "Sample",
  "粘贴": "Paste",
  "清空": "Clear",

  "格式化到底做了什么": "What formatting actually does",
  "解析 → 重新序列化。这里没有做任何「猜测式修复」：只要":
    "Parse, then re-serialize. There is no guesswork repair here: as long as",
  "能通过， 输出就是合法的 JSON；解析不通过，就直接报错而不是硬掰一个结果出来。":
    " succeeds, the output is valid JSON; if it fails you get an error instead of a forced result.",
  "这一点很重要。有些工具会把单引号自动改成双引号、把尾逗号删掉，看起来「很智能」—— 但它也可能悄悄改掉你数据里的一个字符，而你不会发现。这里宁可报错。":
    "That matters. Some tools rewrite single quotes into double quotes or drop trailing commas and look clever — but they can also change a character in your data without you noticing. Reporting an error is the safer choice.",

  "键名排序是怎么排的": "How key sorting works",
  "排序是递归的：对象里的每一层都会按键名重排，数组本身保持原有顺序（数组的顺序是数据的一部分，不能动）， 但数组里的对象照样会排。比较用的是 Unicode 码位，不是「人类语言习惯」—— 所以大写字母排在小写字母前面，数字排在最前。":
    "Sorting is recursive: every object at every depth is reordered, arrays keep their own order (array order is part of the data and must not change), and objects inside arrays are sorted too. Comparison uses Unicode code points rather than human-language rules, so uppercase sorts before lowercase and digits come first.",
  "一个容易被当成 bug 的现象：": "One thing that looks like a bug:",
  "如果键名是纯数字（比如": "if the keys are numeric strings (such as",
  "）， 即使选了 Z → A 也永远按升序输出。这不是没生效 —— JavaScript 规定对象的整数键必须按数值升序枚举， 任何":
    "), picking Z → A still outputs ascending order. It isn't broken — JavaScript requires integer keys to enumerate in ascending numeric order, and every",
  "都会遵守这条规则。": " obeys that rule.",

  "大数字会丢精度，这不是本工具的问题":
    "Big integers lose precision — and that isn't this tool's fault",
  "JavaScript 的数字是双精度浮点，能精确表示的整数上限是 2":
    "JavaScript numbers are double-precision floats; the largest exactly representable integer is 2",
  "-1（9007199254740991，16 位）。 超过这个长度的整数，":
    "−1 (9007199254740991, 16 digits). Integers longer than that are",
  "在解析那一刻就已经把它四舍五入了。":
    " already rounded at the moment of parsing.",
  "所以像雪花算法生成的 19 位 ID、数据库 bigint 主键，进到这个页面再出去就会变成别的数字。 如果你看到页面上出现黄色警告，说明数据里有这种值 —— 这类数据不要用任何基于 JS 的工具处理， 或者让后端把长整型序列化成字符串。":
    "So a 19-digit snowflake ID or a bigint primary key goes in and comes out as a different number. A yellow warning means such a value is present — don't run that data through any JS-based tool, or have the backend serialize long integers as strings.",

  "为什么报错说「有多余的尾逗号」": "Why does it complain about a trailing comma?",
  "JS 对象字面量允许": "A JS object literal allows",
  "这样写，JSON 不允许。最后一个成员后面不能有逗号，这是最常见的差别。":
    ", JSON does not. No comma after the last member — the most common difference of all.",
  "能处理带注释的 JSON 吗": "Can it handle JSON with comments?",
  "不能，标准 JSON 不支持注释。如果你在用 JSON5 / JSONC（VS Code 配置文件那种），需要先把注释去掉 —— 页面会提示你注释在哪一行。":
    "No — standard JSON has no comments. If you're working with JSON5 / JSONC (the VS Code config style), strip the comments first; the page tells you which line they're on.",
  "数据量有上限吗": "Is there a size limit?",
  "没有硬限制，取决于浏览器内存。几十 MB 的 JSON 也能处理，但输入框会明显变卡，建议超过 5MB 的直接用代码处理。":
    "No hard limit; it depends on browser memory. Tens of MB works, but the input box gets noticeably laggy, so past 5MB handle it in code.",
  "排序会改变数据含义吗": "Does sorting change the meaning?",
  "不会。对象的键顺序不影响语义，任何解析器都不应该依赖它。但如果有代码在遍历键时依赖顺序（比如生成签名串），那要注意 —— 这种情况本来就不该依赖顺序。":
    "No. Key order doesn't affect semantics, and no parser should depend on it. But if some code iterates keys in a specific order (signature strings, say), be careful — that code shouldn't rely on order in the first place.",

  "免费在线 JSON 格式化工具。一键美化缩进、压缩成单行、按键名递归排序，语法错误精确提示到行号和列号并给出修改建议。所有处理在浏览器本地完成。":
    "Free online JSON formatter. Beautify indentation, minify to a single line, sort keys recursively, and get syntax errors pinpointed to the exact line and column with a suggested fix. Everything runs in your browser.",
  "JSON 格式化与排序 — 在线美化、压缩":
    "JSON Formatter & Sorter — beautify and minify online",

  /* ---- JSON 运行时文案 ---- */
  "格式化结果": "Formatted",
  "压缩结果": "Minified",
  "已复制": "Copied",
  "JSON 语法错误": "Invalid JSON",
  "第 {line} 行 第 {col} 列": "line {line}, column {col}",
  "输入": "Input",
  "输出": "Output",
  "体积变化": "Size change",
  "层级": "Depth",
  "键": "Keys",
  "数组元素": "Array items",
  "大整数精度警告": "Precision warning",
  "检测到 {n} 个超过 15 位的整数，JSON.parse 会丢精度：{a} 会变成 {b}。这类数据建议让后端以字符串返回。":
    "Found {n} integers longer than 15 digits; JSON.parse loses precision: {a} becomes {b}. Have the backend return these as strings.",
  "内容意外结束了：可能有括号没闭合，或者复制时被截断了。":
    "The content ended unexpectedly — a bracket may be unclosed, or the copy was truncated.",
  "这里应该是带双引号的键名。": "A double-quoted key name belongs here.",
  "这里应该是一个键名，或者右花括号。":
    "A key name, or a closing brace, belongs here.",
  "这里缺少逗号，或者多了不该有的符号。":
    "A comma is missing here, or there's an unexpected symbol.",
  "出现了意料之外的符号 {token}。": "Unexpected {token}.",
  "合法 JSON 已经结束了，后面还有多余内容。":
    "The JSON already ended; there's extra content after it.",

  /* ---- JSON 常见错误建议 ---- */
  "JSON 不支持注释": "JSON has no comments",
  "删掉 // 和 /* */ 部分，JSON 只认纯数据。":
    "Remove the // and /* */ parts — JSON is pure data only.",
  "有多余的尾逗号": "Trailing comma",
  "最后一个成员后面不能加逗号，这是 JS 对象和 JSON 最常见的差别。":
    "No comma after the last member — the most common JS-versus-JSON difference.",
  "键名用了单引号": "Single-quoted key",
  "JSON 的键和字符串都必须用双引号。":
    "Keys and strings in JSON must use double quotes.",
  "键名没有加引号": "Unquoted key",
  "JSON 的键必须用双引号包起来。": "JSON keys must be wrapped in double quotes.",
  "用了中文引号": "Chinese quotation marks",
  "把 “ ” 或 ‘ ’ 换成英文的双引号 \"。":
    "Replace “ ” and ‘ ’ with a straight double quote \".",
  "还没有可以复制的内容": "Nothing to copy yet",
  "还没有可以下载的内容": "Nothing to download yet",

  /* ============================================================
     首页新增卡片
     ============================================================ */
  "粘贴 Data URI 或纯 Base64，靠字节头自动识别真实格式，还原成图片直接下载。":
    "Paste a Data URI or raw Base64 and it sniffs the real format from the byte header, then restores a downloadable image.",
  "Unix 时间戳与日期互转，秒 / 毫秒 / 微秒自动识别，同时给出 UTC 和 ISO 8601。":
    "Convert Unix timestamps to dates and back, with automatic seconds / milliseconds / microseconds detection plus UTC and ISO 8601.",
  "美化缩进、压缩成单行、键名递归排序。语法错误指到具体行列，还告诉你错在哪。":
    "Beautify, minify, or sort keys recursively. Syntax errors point to the exact line and column, with a hint about the cause.",
  "批量加水印、图片拼图、图片转 PDF 正在开发中 —— 有想加的可以直接提。":
    "Batch watermarking, photo stitching and image-to-PDF are in progress — tell us what else you need.",
};
