/**
 * 运行时中英切换
 *
 * 设计取舍：不往 HTML 里塞 data-i18n 标记，而是「中文原文即键」——
 *   1. 首次翻译时把每个文本节点的原文存进 WeakMap
 *   2. 切到英文：按 EN 词典替换；词典里没有的保留中文（测试会报出来）
 *   3. 切回中文：直接写回 WeakMap 里的原文，零损耗、零遗漏
 *
 * 这样 HTML 保持中文单一源，新增文案忘了翻译最多是「显示中文」，
 * 不会出现标记错位导致的半中半英。
 */

import { EN, RULES } from './i18n.en.js';

const KEY = 'pixkit.lang';
const CJK = /[\u4e00-\u9fa5]/;
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

// 句子里用 <code> 断开后，标点会单独成一个文本节点。
// 它不含汉字，靠 CJK 判定永远轮不到它 —— 英文界面就会留一个中文句号。
const PUNCT = /^[。，、；：！？（）「」『』“”‘’…—-]+$/;
const PUNCT_MAP = {
  '。': '.', '，': ',', '、': ',', '；': ';', '：': ':', '！': '!', '？': '?',
  '（': '(', '）': ')', '「': '"', '」': '"', '『': "'", '』': "'",
  '“': '"', '”': '"', '‘': "'", '’': "'", '…': '…', '—': '—', '-': '-',
};

let lang = detectLang();

const origText = new WeakMap();   // Text -> 中文原文
const origAttr = new WeakMap();   // Element -> { attr: 中文原文 }
let headOrig = null;              // { title, desc, ogTitle, ogDesc }
const missing = new Set();

/* ---------------- 语言判定 ---------------- */

function stored() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function detectLang() {
  const saved = stored();
  if (saved === 'zh' || saved === 'en') return saved;

  // 用户没选过：看浏览器语言偏好。中文环境 → 中文，其余一律英文
  const list = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ''];
  return list.some(l => /^zh(-|$)/i.test(l || '')) ? 'zh' : 'en';
}

/* ---------------- 翻译 ---------------- */

function lookup(key) {
  const hit = EN[key];
  if (hit != null) return hit;
  if (PUNCT.test(key)) return [...key].map(c => PUNCT_MAP[c] ?? c).join('');
  for (const [re, fn] of RULES) {
    const m = key.match(re);
    if (m) return fn(m);
  }
  return null;
}

function translateWithSpace(raw) {
  const key = raw.replace(/\s+/g, ' ').trim();
  if (!key) return raw;

  const out = lookup(key);
  if (out == null) {
    missing.add(key);
    return raw;
  }
  // 保留原文首尾空白，否则行内元素之间会粘在一起
  const lead = raw.match(/^\s*/)[0];
  const trail = raw.match(/\s*$/)[0];
  return lead + out + trail;
}

/* ---------------- DOM 遍历 ---------------- */

function translatableTextNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      // 注意：不能只看「当前文本含中文」。切回中文时页面已经是英文，
      // 必须靠 origText 里有没有记录来决定是否处理，否则永远还原不回去。
      const v = n.nodeValue || '';
      const t = v.trim();
      if (!origText.has(n) && !CJK.test(v) && !(t && PUNCT.test(t))) {
        return NodeFilter.FILTER_REJECT;
      }
      const p = n.parentElement;
      if (!p || SKIP_TAGS.has(p.tagName) || p.closest('[data-i18n-skip]')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

/** 翻译 root 子树。lang=zh 时是还原原文。 */
export function apply(root = document.body) {
  if (!root) return;

  for (const node of translatableTextNodes(root)) {
    if (!origText.has(node)) origText.set(node, node.nodeValue);
    const base = origText.get(node);
    node.nodeValue = lang === 'zh' ? base : translateWithSpace(base);
  }

  const els = root.querySelectorAll ? root.querySelectorAll(ATTRS.map(a => `[${a}]`).join(',')) : [];
  for (const el of els) {
    let store = origAttr.get(el);
    for (const attr of ATTRS) {
      if (!el.hasAttribute(attr)) continue;
      if (!store) { store = {}; origAttr.set(el, store); }
      if (!(attr in store)) store[attr] = el.getAttribute(attr);
      const base = store[attr];
      if (!CJK.test(base)) continue;
      el.setAttribute(attr, lang === 'zh' ? base : translateWithSpace(base).trim());
    }
  }
}

/* ---------------- head 里的 title / meta ---------------- */

function applyHead() {
  if (!headOrig) {
    const desc = document.querySelector('meta[name="description"]');
    const ogT = document.querySelector('meta[property="og:title"]');
    const ogD = document.querySelector('meta[property="og:description"]');
    headOrig = {
      title: document.title,
      desc: desc && desc.getAttribute('content'),
      ogTitle: ogT && ogT.getAttribute('content'),
      ogDesc: ogD && ogD.getAttribute('content'),
    };
  }

  const pick = (s) => (s == null ? null : lang === 'zh' ? s : (EN[s] ?? s));
  document.title = pick(headOrig.title);

  const setMeta = (sel, val) => {
    const el = document.querySelector(sel);
    if (el && val != null) el.setAttribute('content', val);
  };
  setMeta('meta[name="description"]', pick(headOrig.desc));
  setMeta('meta[property="og:title"]', pick(headOrig.ogTitle));
  setMeta('meta[property="og:description"]', pick(headOrig.ogDesc));
}

/* ---------------- 语言切换器 ---------------- */

function syncSwitcher() {
  const el = document.querySelector('.langswitch');
  if (!el) return;
  el.dataset.active = lang;
  el.setAttribute('aria-label', lang === 'zh' ? '语言' : 'Language');
  for (const b of el.querySelectorAll('button')) {
    const on = b.dataset.lang === lang;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  }
}

function mountSwitcher() {
  const host = document.querySelector('.topbar__inner');
  if (!host || host.querySelector('.langswitch')) return;

  const el = document.createElement('div');
  el.className = 'langswitch';
  el.setAttribute('data-i18n-skip', '');
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', lang === 'zh' ? '语言' : 'Language');
  el.innerHTML =
    '<button type="button" data-lang="zh" lang="zh-CN">中文</button>' +
    '<button type="button" data-lang="en" lang="en">EN</button>';

  el.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn && btn.dataset.lang !== lang) setLang(btn.dataset.lang);
  });

  host.appendChild(el);
}

/* ---------------- 对外接口 ---------------- */

export function getLang() {
  return lang;
}

/**
 * 翻译一段文案，支持 {name} 占位符。给 JS 里拼接的字符串用。
 * 中文模式下原样返回；英文模式下查词典，查不到就返回原文（不静默吞掉）。
 */
export function t(text, vars) {
  let out = text;
  if (lang !== 'zh') {
    const hit = lookup(text.replace(/\s+/g, ' ').trim());
    if (hit == null) missing.add(text);
    else out = hit;
  }
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
  return out;
}

export function setLang(next) {
  if (next !== 'zh' && next !== 'en') return;
  lang = next;

  try { localStorage.setItem(KEY, next); } catch { /* 隐私模式下写不进去，忽略 */ }

  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  document.documentElement.dataset.lang = next;

  // 先让各工具页按新语言重渲染自己那部分（t() 生成的内容不归 WeakMap 管），
  // 再统一走 DOM 翻译，避免先把中文碎片翻一遍又被打断。
  window.dispatchEvent(new CustomEvent('pixkit:langchange', { detail: { lang: next } }));

  apply(document.body);
  applyHead();
  syncSwitcher();
}

/* ---------------- 初始化 ---------------- */

function init() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.documentElement.dataset.lang = lang;

  mountSwitcher();
  apply(document.body);
  applyHead();
  syncSwitcher();

  // 工具页的结果列表、toast 都是运行时插入的，插进来就翻
  new MutationObserver((records) => {
    if (lang === 'zh') return;
    for (const r of records) {
      for (const n of r.addedNodes) {
        if (n.nodeType === 1) apply(n);
        else if (n.nodeType === 3 && n.parentElement) apply(n.parentElement);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  // 供测试用：看还有哪些中文没翻
  window.__i18n = { get lang() { return lang; }, setLang, apply, missing };
}

init();
