/* ============================================================
   EXIF 查看与清除（无损：直接操作字节流，不重新编码）
   ============================================================ */

import { formatBytes, toast, download, baseName } from './common.js';

const $ = id => document.getElementById(id);

const dropzone = $('dropzone');
const fileInput = $('fileInput');
const workspace = $('workspace');
const thumb = $('thumb');
const fileInfo = $('fileInfo');
const metaArea = $('metaArea');
const actions = $('actions');
const cleanBtn = $('cleanBtn');
const actionHint = $('actionHint');

const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

/* 常用 tag 的中文名 */
const TAG_NAME = {
  0x0100: '图像宽度',
  0x0101: '图像高度',
  0x010E: '图像描述',
  0x010F: '相机厂商',
  0x0110: '相机型号',
  0x0112: '方向',
  0x011A: '水平分辨率',
  0x011B: '垂直分辨率',
  0x0128: '分辨率单位',
  0x0131: '处理软件',
  0x0132: '文件修改时间',
  0x013B: '作者',
  0x8298: '版权',
  0x829A: '曝光时间',
  0x829D: '光圈',
  0x8822: '曝光模式',
  0x8827: 'ISO',
  0x9201: '快门速度',
  0x9202: '光圈值',
  0x9207: '测光模式',
  0x9209: '闪光灯',
  0x920A: '焦距',
  0x927C: '厂商注释',
  0x9286: '用户注释',
  0x9290: '秒以下时间',
  0x9291: '原始秒以下时间',
  0x9292: '数字化秒以下时间',
  0xA002: '像素宽度',
  0xA003: '像素高度',
  0xA402: '曝光补偿',
  0xA403: '白平衡',
  0xA406: '场景模式',
  0xA430: '相机所有者',
  0xA431: '机身序列号',
  0xA432: '镜头规格',
  0xA433: '镜头厂商',
  0xA434: '镜头型号',
  0xA435: '镜头序列号',
};

const ORIENTATION = {
  1: '正常', 2: '水平翻转', 3: '旋转 180°', 4: '垂直翻转',
  5: '顺时针 90° + 翻转', 6: '顺时针 90°', 7: '逆时针 90° + 翻转', 8: '逆时针 90°',
};

/* ---------------- JPEG 段解析 ---------------- */

function parseJpegSegments(buf) {
  if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null;

  const segs = [];
  let i = 2;

  while (i < buf.length - 1) {
    if (buf[i] !== 0xFF) break;

    let m = buf[i + 1];
    if (m === 0xFF) { i++; continue; }                    // 填充字节
    if (m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }  // 无长度的标记
    if (m === 0xD9) break;                                // EOI

    const len = (buf[i + 2] << 8) | buf[i + 3];
    if (len < 2) break;

    const end = i + 2 + len;
    segs.push({ marker: m, start: i, end, dataStart: i + 4 });

    if (m === 0xDA) break;   // SOS，后面是压缩图像数据
    i = end;
  }
  return segs;
}

/* ---------------- TIFF / IFD 解析 ---------------- */

function parseTiff(buf, seg) {
  const p = seg.dataStart;

  // "Exif\0\0"
  if (buf[p] !== 0x45 || buf[p + 1] !== 0x78 || buf[p + 2] !== 0x69 || buf[p + 3] !== 0x66) {
    return null;
  }

  const tiffStart = p + 6;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

  const order = view.getUint16(tiffStart);
  if (order !== 0x4949 && order !== 0x4D4D) return null;
  const little = order === 0x4949;

  if (view.getUint16(tiffStart + 2, little) !== 42) return null;

  const ifd0 = tiffStart + view.getUint32(tiffStart + 4, little);
  return { view, tiffStart, little, ifd0 };
}

function readIfd(t, offset) {
  const { view, little } = t;
  if (offset + 2 > view.byteLength) return [];

  const count = view.getUint16(offset, little);
  const entries = [];

  for (let i = 0; i < count; i++) {
    const e = offset + 2 + i * 12;
    if (e + 12 > view.byteLength) break;
    entries.push({
      tag: view.getUint16(e, little),
      type: view.getUint16(e + 2, little),
      count: view.getUint32(e + 4, little),
      valueOffset: e + 8,
    });
  }
  return entries;
}

function valueBase(t, entry) {
  const size = (TYPE_SIZE[entry.type] || 1) * entry.count;
  return size <= 4
    ? entry.valueOffset
    : t.tiffStart + t.view.getUint32(entry.valueOffset, t.little);
}

function readValue(t, entry) {
  const { view, little } = t;
  const base = valueBase(t, entry);

  switch (entry.type) {
    case 1: case 7:
      return view.getUint8(base);

    case 2: {
      const bytes = new Uint8Array(view.buffer, view.byteOffset + base, Math.min(entry.count, 512));
      const zero = bytes.indexOf(0);
      const slice = zero >= 0 ? bytes.subarray(0, zero) : bytes;
      return new TextDecoder('utf-8', { fatal: false }).decode(slice).trim();
    }

    case 3:
      return view.getUint16(base, little);

    case 4:
      return view.getUint32(base, little);

    case 5: {
      const n = view.getUint32(base, little);
      const d = view.getUint32(base + 4, little);
      return d ? +(n / d).toFixed(4) : 0;
    }

    case 9:
      return view.getInt32(base, little);

    case 10: {
      const n = view.getInt32(base, little);
      const d = view.getInt32(base + 4, little);
      return d ? +(n / d).toFixed(4) : 0;
    }

    default:
      return null;
  }
}

function readRationals(t, entry, n) {
  const { view, little } = t;
  const base = valueBase(t, entry);
  const out = [];
  for (let i = 0; i < Math.min(n, entry.count); i++) {
    const num = view.getUint32(base + i * 8, little);
    const den = view.getUint32(base + i * 8 + 4, little);
    out.push(den ? num / den : 0);
  }
  return out;
}

/* ---------------- GPS ---------------- */

function dmsToDeg(dms) {
  if (!dms || dms.length < 3) return null;
  return dms[0] + dms[1] / 60 + dms[2] / 3600;
}

function readGps(t, gpsOffset) {
  const entries = readIfd(t, gpsOffset);
  if (!entries.length) return null;

  const find = tag => entries.find(e => e.tag === tag);

  const latE = find(0x0002);
  const lonE = find(0x0004);
  if (!latE || !lonE) return null;

  const latRef = find(0x0001);
  const lonRef = find(0x0003);

  const lat = dmsToDeg(readRationals(t, latE, 3));
  const lon = dmsToDeg(readRationals(t, lonE, 3));
  if (lat === null || lon === null) return null;

  const latSign = latRef && String(readValue(t, latRef)).toUpperCase() === 'S' ? -1 : 1;
  const lonSign = lonRef && String(readValue(t, lonRef)).toUpperCase() === 'W' ? -1 : 1;

  const altitude = find(0x0006);
  const altRef = find(0x0005);

  return {
    lat: lat * latSign,
    lon: lon * lonSign,
    altitude: altitude ? readValue(t, altitude) : null,
    altitudeRef: altRef ? readValue(t, altRef) : null,
  };
}

/* ---------------- 提取元数据 ---------------- */

function extractMeta(buf) {
  const segs = parseJpegSegments(buf);
  if (!segs) return null;

  const app1 = segs.find(s => s.marker === 0xE1 &&
    buf[s.dataStart] === 0x45 && buf[s.dataStart + 1] === 0x78);

  const segments = {
    total: segs.length,
    hasExif: !!app1,
    hasXmp: segs.some(s => s.marker === 0xE1 && buf[s.dataStart] === 0x3C),
    hasIptc: segs.some(s => s.marker === 0xED),
    hasComment: segs.some(s => s.marker === 0xFE),
  };

  if (!app1) return { segments, groups: [] };

  const t = parseTiff(buf, app1);
  if (!t) return { segments, groups: [] };

  const ifd0 = readIfd(t, t.ifd0);
  const raw = {};
  const riskTags = new Set([0xA431, 0xA430, 0xA435]);

  for (const e of ifd0) {
    const name = TAG_NAME[e.tag];
    if (!name) continue;
    if (e.tag === 0x0112) {
      raw[name] = ORIENTATION[readValue(t, e)] || readValue(t, e);
      continue;
    }
    const v = readValue(t, e);
    if (v !== null && v !== '') raw[name] = v;
  }

  // Exif 子 IFD
  const exifPtr = ifd0.find(e => e.tag === 0x8769);
  if (exifPtr) {
    const exifIfd = readIfd(t, t.tiffStart + t.view.getUint32(exifPtr.valueOffset, t.little));
    for (const e of exifIfd) {
      const name = TAG_NAME[e.tag];
      if (!name) continue;
      let v = readValue(t, e);
      if (v === null || v === '') continue;

      if (e.tag === 0x829A && typeof v === 'number') v = v >= 1 ? `${v}s` : `1/${Math.round(1 / v)}s`;
      else if (e.tag === 0x829D && typeof v === 'number') v = `f/${v}`;
      else if (e.tag === 0x920A && typeof v === 'number') v = `${v}mm`;
      else if (e.tag === 0x9286) v = '（含用户注释）';

      raw[name] = v;
    }
  }

  // GPS 子 IFD
  const gpsPtr = ifd0.find(e => e.tag === 0x8825);
  let gps = null;
  if (gpsPtr) {
    gps = readGps(t, t.tiffStart + t.view.getUint32(gpsPtr.valueOffset, t.little));
  }

  /* 分组 */
  const groups = [];

  if (gps) {
    const rows = [
      { k: '纬度', v: gps.lat.toFixed(6) },
      { k: '经度', v: gps.lon.toFixed(6) },
    ];
    if (gps.altitude !== null) {
      rows.push({ k: '海拔', v: `${gps.altitude.toFixed(1)} 米` });
    }
    groups.push({ title: '位置信息', risk: true, rows });
  }

  const deviceKeys = ['相机厂商', '相机型号', '镜头厂商', '镜头型号', '机身序列号', '镜头序列号', '相机所有者'];
  const deviceRows = deviceKeys
    .filter(k => raw[k] !== undefined)
    .map(k => ({ k, v: raw[k], risk: riskTags.has(k) || k.includes('序列号') || k.includes('所有者') }));
  if (deviceRows.length) groups.push({ title: '设备信息', risk: true, rows: deviceRows });

  const timeKeys = ['拍摄时间', '原始秒以下时间', '文件修改时间', '数字化秒以下时间'];
  const timeRows = timeKeys.filter(k => raw[k] !== undefined).map(k => ({ k, v: raw[k] }));
  if (timeRows.length) groups.push({ title: '时间', risk: false, rows: timeRows });

  const shotKeys = ['曝光时间', '光圈', 'ISO', '焦距', '曝光模式', '测光模式', '闪光灯', '白平衡', '曝光补偿'];
  const shotRows = shotKeys.filter(k => raw[k] !== undefined).map(k => ({ k, v: raw[k] }));
  if (shotRows.length) groups.push({ title: '拍摄参数', risk: false, rows: shotRows });

  const used = new Set([...deviceKeys, ...timeKeys, ...shotKeys]);
  const otherRows = Object.keys(raw)
    .filter(k => !used.has(k))
    .map(k => ({ k, v: String(raw[k]) }));
  if (otherRows.length) groups.push({ title: '其它', risk: false, rows: otherRows });

  return { segments, groups, raw };
}

/* ---------------- 清除元数据 ---------------- */

function stripMetadata(buf) {
  const segs = parseJpegSegments(buf);
  if (!segs) return null;

  const parts = [buf.subarray(0, 2)];   // SOI
  let cursor = 2;

  for (const s of segs) {
    if (s.start > cursor) parts.push(buf.subarray(cursor, s.start));

    // 删除：APP1（Exif / XMP）、APP13（IPTC）、COM（注释）
    const drop = s.marker === 0xE1 || s.marker === 0xED || s.marker === 0xFE;
    if (!drop) parts.push(buf.subarray(s.start, s.end));

    cursor = s.end;
    if (s.marker === 0xDA) break;
  }

  if (cursor < buf.length) parts.push(buf.subarray(cursor));

  return new Blob(parts, { type: 'image/jpeg' });
}

/* ---------------- 渲染 ---------------- */

const state = {
  file: null,
  buf: null,
  info: null,
};

function renderMeta(info) {
  const { groups, segments } = info;

  const flags = [];
  if (segments.hasExif) flags.push('EXIF');
  if (segments.hasXmp) flags.push('XMP');
  if (segments.hasIptc) flags.push('IPTC');
  if (segments.hasComment) flags.push('注释');

  if (!groups.length) {
    metaArea.innerHTML = `
      <div class="clean-state">
        <h3>这张照片是干净的</h3>
        <p>没有检测到 EXIF${flags.length ? '（但发现 ' + flags.join('、') + ' 段）' : ''}，可以放心发布。</p>
      </div>`;
    cleanBtn.disabled = true;
    actionHint.textContent = '无需处理';
    return;
  }

  metaArea.innerHTML = groups.map(g => `
    <div class="meta-group${g.risk ? ' is-risk' : ''}">
      <div class="meta-group__head">
        <span class="dot"></span>${g.title}
      </div>
      <dl style="margin:0">
        ${g.rows.map(r => `
          <div class="meta-row${r.risk ? ' is-risk' : ''}">
            <dt>${r.k}</dt>
            <dd>${escapeHtml(String(r.v))}</dd>
          </div>`).join('')}
      </dl>
    </div>
  `).join('');

  cleanBtn.disabled = false;
  actionHint.textContent = `共 ${groups.reduce((s, g) => s + g.rows.length, 0)} 项元数据`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------------- 处理文件 ---------------- */

async function handleFile(file) {
  if (!/jpe?g$/i.test(file.name) && file.type !== 'image/jpeg') {
    toast('目前只支持 JPEG 格式（.jpg / .jpeg）', 3000);
    return;
  }

  const buf = new Uint8Array(await file.arrayBuffer());

  const info = extractMeta(buf);
  if (!info) {
    toast('这不是有效的 JPEG 文件');
    return;
  }

  state.file = file;
  state.buf = buf;
  state.info = info;

  const url = URL.createObjectURL(file);
  thumb.src = url;
  thumb.onload = () => {
    fileInfo.innerHTML = `
      <b>${formatBytes(file.size)}</b><br>
      ${thumb.naturalWidth} × ${thumb.naturalHeight} px<br>
      ${info.segments.total} 个数据段
    `;
  };

  workspace.classList.remove('hidden');
  actions.classList.remove('hidden');
  dropzone.classList.add('hidden');

  renderMeta(info);
}

/* ---------------- 清除并下载 ---------------- */

cleanBtn.addEventListener('click', () => {
  if (!state.buf) return;

  const blob = stripMetadata(state.buf);
  if (!blob) {
    toast('处理失败');
    return;
  }

  const saved = state.buf.length - blob.size;
  download(blob, `${baseName(state.file.name)}-已清除元数据.jpg`);
  toast(`已清除，减少 ${formatBytes(Math.max(0, saved))}`, 3000);

  state.buf = new Uint8Array(0);   // 防止重复点击
  cleanBtn.disabled = true;
  actionHint.textContent = '已下载';
});

/* ---------------- 换一张 ---------------- */

$('resetBtn').addEventListener('click', () => {
  workspace.classList.add('hidden');
  actions.classList.add('hidden');
  dropzone.classList.remove('hidden');
  fileInput.value = '';
  state.file = null;
  state.buf = null;
  state.info = null;
  cleanBtn.disabled = false;
  actionHint.textContent = '';
});

/* ---------------- 上传交互 ---------------- */

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});
fileInput.addEventListener('change', () => {
  if (fileInput.files?.[0]) handleFile(fileInput.files[0]);
});

['dragenter', 'dragover'].forEach(ev =>
  dropzone.addEventListener(ev, e => {
    e.preventDefault();
    dropzone.classList.add('is-over');
  })
);
['dragleave', 'drop'].forEach(ev =>
  dropzone.addEventListener(ev, e => {
    e.preventDefault();
    dropzone.classList.remove('is-over');
  })
);
dropzone.addEventListener('drop', e => {
  const f = e.dataTransfer?.files?.[0];
  if (f) handleFile(f);
});

document.addEventListener('paste', e => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const it of items) {
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      const f = it.getAsFile();
      if (f) { e.preventDefault(); handleFile(f); return; }
    }
  }
});
