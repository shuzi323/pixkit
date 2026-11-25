/**
 * 从工具页可见的「常见问题」区块生成 FAQPage 结构化数据。
 *
 * 为什么不在 HTML 里手写 schema：
 *   内容一旦改文案，schema 就悄悄跟内容对不上了 —— 搜索引擎会判定结构化数据
 *   与页面内容不符，比没有 schema 更糟。这里以页面可见文本为唯一来源，
 *   构建时抽取，永远同步。
 *
 * 说明：Google 从 2023 年起把 FAQ 富摘要收窄到政府/医疗等权威站点，
 * 普通站点基本不会再出折叠问答。保留这份数据仍然值得 —— 它帮搜索引擎
 * 准确理解页面在回答什么问题，且 Bing 等引擎仍在使用。但别指望点击率暴涨。
 */

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

function decode(s) {
  return s.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/g, m => ENTITIES[m] ?? m);
}

/** 去掉标签、解码实体、压平空白 —— JSON-LD 里要的是纯文本 */
function toText(html) {
  return decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** 找到 <div class="faq"> 的内容区间，按 div 配对而不是正则硬截 */
function faqBlock(html) {
  const START = '<div class="faq">';
  const at = html.indexOf(START);
  if (at === -1) return null;

  const from = at + START.length;
  const re = /<div\b[^>]*>|<\/div>/g;
  re.lastIndex = from;

  let depth = 1;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) return { from, to: m.index };
  }
  return null;
}

const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 把整块问答换成给定的条目（预设页用：每页有自己的 FAQ，不能复用基础页的） */
export function replaceFaq(html, items) {
  const box = faqBlock(html);
  if (!box || !items?.length) return html;

  const body = items.map(({ q, a }) => `        <details>
          <summary>${escHtml(q)}</summary>
          <div class="faq__body"><p>${escHtml(a)}</p></div>
        </details>`).join('\n');

  return html.slice(0, box.from) + '\n' + body + '\n      ' + html.slice(box.to);
}

/** @returns {{ q: string, a: string }[]} */
export function readFaq(html) {
  const box = faqBlock(html);
  if (!box) return [];
  const block = html.slice(box.from, box.to);

  const items = [];
  const re = /<details\b[^>]*>([\s\S]*?)<\/details>/g;
  let m;
  while ((m = re.exec(block))) {
    const inner = m[1];
    const sm = inner.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/);
    if (!sm) continue;

    const q = toText(sm[1]);
    const a = toText(inner.slice(sm.index + sm[0].length));
    // 太短的答案没有信息量，放进 schema 反而是负面信号
    if (q.length >= 4 && a.length >= 12) items.push({ q, a });
  }
  return items;
}

export function buildFaqLd(items, pageUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'zh-CN',
    ...(pageUrl ? { url: pageUrl } : {}),
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/**
 * 把 FAQPage 注入 </head> 前。
 * 少于 2 条就不注入 —— 一条问答撑不起 FAQPage，容易被判为凑数。
 */
export function injectFaq(html, pageUrl) {
  if (html.includes('"FAQPage"')) return html;

  const items = readFaq(html);
  if (items.length < 2) return html;

  // </script> 出现在字符串里会提前闭合标签，把 < 转义掉最省事
  const json = JSON.stringify(buildFaqLd(items, pageUrl)).replace(/</g, '\\u003c');
  const tag = `  <script type="application/ld+json">${json}</script>\n`;

  const head = html.lastIndexOf('</head>');
  if (head === -1) return html;
  return html.slice(0, head) + tag + html.slice(head);
}
