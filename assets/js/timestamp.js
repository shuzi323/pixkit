/* ============================================================
   时间戳转换
   换算全部在本地完成，时区取自系统
   ============================================================ */

import { toast, copyText, esc } from './common.js';
import { getLang, t } from './i18n.js';

const $ = id => document.getElementById(id);

const WEEK = {
  zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const MAX_MS = 8.64e15;   // Date 能表示的上限

const pad = (n, w = 2) => String(n).padStart(w, '0');
const lang = () => getLang();

/* ---------------- 格式化 ---------------- */

function fmtLocal(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fmtUTC(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

function tzOffset(d) {
  const total = -d.getTimezoneOffset();          // 分钟，东为正
  const sign = total >= 0 ? '+' : '-';
  const h = Math.floor(Math.abs(total) / 60);
  const m = Math.abs(total) % 60;
  return `UTC${sign}${pad(h)}:${pad(m)}`;
}

function weekday(d) {
  return WEEK[lang() === 'en' ? 'en' : 'zh'][d.getDay()];
}

function relTime(ms, now = Date.now()) {
  const diff = ms - now;
  const abs = Math.abs(diff);
  const en = lang() === 'en';

  if (abs < 3000) return en ? 'just now' : '刚刚';

  const units = [
    [31536000000, '年', 'year'],
    [2592000000, '个月', 'month'],
    [86400000, '天', 'day'],
    [3600000, '小时', 'hour'],
    [60000, '分钟', 'minute'],
    [1000, '秒', 'second'],
  ];

  for (const [step, zh, enu] of units) {
    if (abs >= step) {
      const n = Math.floor(abs / step);
      if (en) return `${n} ${enu}${n > 1 ? 's' : ''} ${diff > 0 ? 'from now' : 'ago'}`;
      return `${n} ${zh}${diff > 0 ? '后' : '前'}`;
    }
  }
  return en ? 'just now' : '刚刚';
}

/* ---------------- 结果表 ---------------- */

function renderRows(host, list) {
  host.innerHTML = list.map(([k, v]) => {
    const val = v == null || v === '' ? '—' : String(v);
    const copy = val === '—' ? '' :
      `<button class="mini-btn kv__copy" type="button" data-val="${esc(val)}">${t('复制')}</button>`;
    return `<div class="kv__row">` +
      `<span class="kv__k">${esc(k)}</span>` +
      `<span class="kv__v">${esc(val)}</span>${copy}</div>`;
  }).join('');
}

/* ---------------- 时间戳解析 ---------------- */

let unitMode = 'auto';          // auto | s | ms，用户手动指定后不再按位数猜

function parseStamp(raw, mode = unitMode) {
  const s = raw.trim().replace(/[\s,_]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;

  const intPart = s.replace(/^-/, '').split('.')[0];
  const digits = intPart.length;

  let unit;
  if (mode === 's' || mode === 'ms') {
    unit = mode;
  } else {
    unit = digits <= 11 ? 's' : digits <= 14 ? 'ms' : 'us';
  }

  const num = parseFloat(s);
  const ms = unit === 's' ? num * 1000 : unit === 'ms' ? num : num / 1000;

  return { ms, unit, digits, manual: mode !== 'auto' };
}

const UNIT_LABEL = {
  zh: { s: '秒', ms: '毫秒', us: '微秒' },
  en: { s: 'seconds', ms: 'milliseconds', us: 'microseconds' },
};

/* ---------------- 时间戳 → 日期 ---------------- */

function renderStamp() {
  const raw = $('tsIn').value;
  const err = $('tsErr');
  const host = $('tsKv');
  err.classList.add('hidden');

  if (!raw.trim()) { host.innerHTML = ''; return; }

  const parsed = parseStamp(raw);
  if (!parsed) {
    host.innerHTML = '';
    err.innerHTML =
      `<span class="err-box__title">${t('这不是一个时间戳')}</span>` +
      `<span>${t('只能填纯数字，可以带负号或小数。日期字符串请用右边的输入框。')}</span>`;
    err.classList.remove('hidden');
    return;
  }

  if (Math.abs(parsed.ms) > MAX_MS) {
    host.innerHTML = '';
    err.innerHTML =
      `<span class="err-box__title">${t('超出可表示的时间范围')}</span>` +
      `<span>${t('这个数值换算后超过公元 27 万年，检查一下是不是把单位搞错了。')}</span>`;
    err.classList.remove('hidden');
    return;
  }

  const d = new Date(parsed.ms);
  const unitName = UNIT_LABEL[lang() === 'en' ? 'en' : 'zh'][parsed.unit];

  renderRows(host, [
    [t('本地时间'), fmtLocal(d)],
    [t('UTC'), fmtUTC(d)],
    [t('ISO 8601'), d.toISOString()],
    [t('星期'), weekday(d)],
    [t('相对时间'), relTime(parsed.ms)],
    [t('时区'), tzOffset(d)],
    [t('识别单位'), parsed.manual
      ? `${unitName} · ${t('手动指定')}`
      : `${unitName} · ${t('{n} 位数字', { n: parsed.digits })}`],
  ]);
}

/* ---------------- 日期 → 时间戳 ---------------- */

function renderDate() {
  const v = $('dateIn').value;
  const host = $('dateKv');

  if (!v) { host.innerHTML = ''; return; }

  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    host.innerHTML = '';
    return;
  }

  const ms = d.getTime();
  renderRows(host, [
    [t('秒级'), String(Math.floor(ms / 1000))],
    [t('毫秒级'), String(ms)],
    [t('ISO 8601'), d.toISOString()],
    [t('本地时间'), fmtLocal(d)],
    [t('相对时间'), relTime(ms)],
  ]);
}

/* ---------------- 当前时间 ---------------- */

function tick() {
  const now = new Date();
  $('nowClock').textContent =
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  $('nowDate').textContent =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${weekday(now)}`;
  $('nowSec').textContent = String(Math.floor(now.getTime() / 1000));
  $('nowMs').textContent = String(now.getTime());
}

$('unitTabs').addEventListener('click', e => {
  const tab = e.target.closest('.fmt-tab');
  if (!tab || tab.dataset.unit === unitMode) return;
  unitMode = tab.dataset.unit;
  document.querySelectorAll('#unitTabs .fmt-tab').forEach(b => {
    b.classList.toggle('is-active', b.dataset.unit === unitMode);
  });
  renderStamp();
});

/* ---------------- 快捷按钮 ---------------- */

function toLocalInput(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
         `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function startOfToday(offsetDays = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

document.querySelectorAll('[data-ts]').forEach(btn => {
  btn.addEventListener('click', () => {
    const k = btn.dataset.ts;
    if (k === 'clear') { $('tsIn').value = ''; renderStamp(); return; }
    if (k === 'now') $('tsIn').value = String(Math.floor(Date.now() / 1000));
    if (k === 'today') $('tsIn').value = String(Math.floor(startOfToday(0).getTime() / 1000));
    if (k === 'yesterday') $('tsIn').value = String(Math.floor(startOfToday(-1).getTime() / 1000));
    renderStamp();
  });
});

document.querySelectorAll('[data-date]').forEach(btn => {
  btn.addEventListener('click', () => {
    const k = btn.dataset.date;
    if (k === 'now') $('dateIn').value = toLocalInput(new Date());
    if (k === 'today') $('dateIn').value = toLocalInput(startOfToday(0));
    if (k === 'tomorrow') $('dateIn').value = toLocalInput(startOfToday(1));
    renderDate();
  });
});

/* ---------------- 复制 ---------------- */

document.addEventListener('click', async e => {
  const btn = e.target.closest('.kv__copy');
  if (!btn) return;

  let val = btn.dataset.val;
  if (btn.dataset.copy) {
    const el = $(btn.dataset.copy);
    val = el ? el.textContent.trim() : '';
  }
  if (!val || val === '—') return;

  const ok = await copyText(val);
  if (!ok) { toast('复制失败，请手动选中复制'); return; }

  const old = btn.textContent;
  btn.textContent = t('已复制');
  btn.classList.add('is-done');
  setTimeout(() => {
    btn.textContent = old;
    btn.classList.remove('is-done');
  }, 1200);
});

/* ---------------- 初始化 ---------------- */

$('tzLabel').textContent = tzOffset(new Date());
tick();
setInterval(tick, 250);

$('tsIn').value = String(Math.floor(Date.now() / 1000));
$('dateIn').value = toLocalInput(new Date());
renderStamp();
renderDate();

$('tsIn').addEventListener('input', renderStamp);
$('dateIn').addEventListener('input', renderDate);

// 切语言后，星期 / 相对时间 / 单位都得按新语言重算
window.addEventListener('pixkit:langchange', () => {
  $('tzLabel').textContent = tzOffset(new Date());
  tick();
  renderStamp();
  renderDate();
});
