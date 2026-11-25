/**
 * 首页：工具搜索 + 分类筛选
 *
 * 卡片上带 data-cat（可多个，空格分隔）和 data-kw（同义词、英文名、别名），
 * 匹配范围是「标题 + 简介 + 标签 + 关键词 + URL」，中文直接 includes，不做分词。
 *
 * 「更多工具」那张卡是补位用的，只在「全部 + 无搜索词」时出现，
 * 否则筛选出 7 张图时它会把三列挤成两列。
 */

const grid = document.getElementById('toolsGrid');
const input = document.getElementById('toolSearch');
const clearBtn = document.getElementById('toolSearchClear');
const tabs = document.getElementById('toolTabs');
const emptyEl = document.getElementById('toolEmpty');

if (grid && input && tabs) {
  const cards = Array.from(grid.children).filter(el => el.classList.contains('card'));
  let cat = 'all';

  const isSoon = el => el.classList.contains('card--soon');

  // 每次现算，不在启动时缓存 —— 否则切换语言后匹配的还是旧语言的文字
  const hay = el =>
    `${el.dataset.kw || ''} ${el.textContent || ''} ${el.getAttribute('href') || ''}`.toLowerCase();

  function apply() {
    const q = input.value.trim().toLowerCase();
    let shown = 0;

    for (const el of cards) {
      if (isSoon(el)) {
        el.classList.toggle('hidden', !(cat === 'all' && !q));
        continue;
      }

      const inCat = cat === 'all' || (el.dataset.cat || '').split(' ').includes(cat);
      const ok = inCat && (!q || hay(el).includes(q));
      el.classList.toggle('hidden', !ok);
      if (ok) shown++;
    }

    emptyEl?.classList.toggle('hidden', shown > 0);
    clearBtn?.classList.toggle('hidden', !q);
  }

  function setCat(next) {
    cat = next;
    for (const b of tabs.querySelectorAll('button')) {
      const on = b.dataset.cat === next;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    apply();
  }

  input.addEventListener('input', apply);

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      apply();
    }
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    input.focus();
    apply();
  });

  tabs.addEventListener('click', e => {
    const btn = e.target.closest('button[data-cat]');
    if (btn && btn.dataset.cat !== cat) setCat(btn.dataset.cat);
  });

  // 按 / 直接跳到搜索框，跟 GitHub 一个习惯
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  apply();
}
