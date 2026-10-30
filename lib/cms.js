/*
 * Nội dung tùy chỉnh từ trang quản trị (lưu ở data/cms.json):
 *   chữ (VI/EN) · ảnh/video (+ chữ thay thế alt) · màu thương hiệu + bảng màu đầy đủ · phông chữ · liên hệ · tài khoản nhận tiền
 *   bố cục trang (ẩn / đổi thứ tự khu vực) · danh sách (thêm / nhân bản / bớt / sắp xếp mục) · ẩn từng chữ, ảnh, nút
 *   icon · đường dẫn của nút / link · mã tùy chỉnh (CSS, mã gắn vào <head> / cuối trang)
 *   - danh mục mặc định: data/seed/cms-catalog.json (tools/cms-build.js + tools/cms-structure.js)
 * Khi phục vụ trang, server áp phần đã sửa vào HTML/CSS/JS; phần chạy trong JS (chữ EN, danh sách / icon do JS vẽ)
 * lấy qua window.__CMS (/assets/data/cms.js) bằng DC.x / DC.m / DC.i / DC.list.
 * Mục thêm mới trong danh sách: khóa bên trong có đuôi "@<mã mục>" (vd course.faq.q1@a3).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const settings = require('./settings');
const html = require('./cms-html');

const { DATA_DIR, SEED_DIR } = require('./paths');
const CATALOG = path.join(SEED_DIR, 'cms-catalog.json');   // danh mục gốc đi kèm mã nguồn
const STORE = path.join(DATA_DIR, 'cms.json');              // phần đã sửa trong /admin (DC_DATA_DIR)

const COLORS = [
  { key: 'accent', label: 'Màu nhấn — nút chính, chữ nhấn, gạch đỏ', def: '#D4372E' },
  { key: 'accentHover', label: 'Màu nhấn khi rê chuột / nhấn giữ', def: '#B82E26' },
  { key: 'dark', label: 'Màu đen chủ đạo — nền tối, chữ chính', def: '#0B0B0B' },
  { key: 'light', label: 'Màu nền xám nhạt — các khối nền sáng', def: '#F2F2F2' },
];
const MAPS = 'https://www.google.com/maps/dir/?api=1&destination=30%20%C4%90%C6%B0%E1%BB%9Dng%20128%2C%20Ph%C6%B0%E1%BB%9Bc%20Long%2C%20Th%E1%BB%A7%20%C4%90%E1%BB%A9c%2C%20TP.%20H%E1%BB%93%20Ch%C3%AD%20Minh';
const CONTACT = [
  { key: 'phone', label: 'Hotline (hiển thị trên web, vd 0909 123 456)', def: '0909 xxx xxx', type: 'phone' },
  { key: 'zalo', label: 'Link Zalo', def: 'https://zalo.me/dappercombat', type: 'url' },
  { key: 'facebook', label: 'Link Facebook / Messenger', def: 'https://facebook.com/dappercombat', type: 'url' },
  { key: 'instagram', label: 'Link Instagram', def: 'https://instagram.com/dappercombat', type: 'url' },
  { key: 'youtube', label: 'Link YouTube', def: 'https://youtube.com/@dappercombat', type: 'url' },
  { key: 'addr1', label: 'Địa chỉ — dòng 1 (số nhà, đường, phường)', def: '30 Đường 128, Phước Long', type: 'text' },
  { key: 'addr2', label: 'Địa chỉ — dòng 2 (quận/TP, tỉnh)', def: 'TP. Thủ Đức, TP. Hồ Chí Minh', type: 'text' },
  { key: 'maps', label: 'Link chỉ đường Google Maps', def: MAPS, type: 'url' },
  { key: 'hoursDays', label: 'Ngày mở cửa (để tính trạng thái "Đang mở cửa" ở Trang chủ)', def: '1-6', type: 'select',
    options: [{ v: '1-6', l: 'Thứ 2 – Thứ 7' }, { v: '0-6', l: 'Cả tuần (Thứ 2 – Chủ nhật)' }, { v: '1-5', l: 'Thứ 2 – Thứ 6' }, { v: '1-6,0', l: 'Thứ 2 – Chủ nhật (trừ ngày lễ)' }] },
  { key: 'hoursOpen', label: 'Giờ mở cửa', def: '06:00', type: 'time' },
  { key: 'hoursClose', label: 'Giờ đóng cửa', def: '21:30', type: 'time' },
  // thông tin doanh nghiệp ở chân trang (luật thương mại điện tử) + dữ liệu cho Google
  { key: 'company', label: 'Tên doanh nghiệp / hộ kinh doanh (hiện ở chân trang)', def: '', type: 'text' },
  { key: 'taxId', label: 'Mã số thuế / số đăng ký kinh doanh', def: '', type: 'text' },
  { key: 'email', label: 'Email liên hệ (hiện ở chân trang)', def: '', type: 'email' },
];
// tài khoản nhận chuyển khoản → mã VietQR thật (có sẵn số tiền + nội dung) ở màn đặt hàng thành công và form đăng ký khóa học
const BANKS = [['970436', 'Vietcombank'], ['970415', 'VietinBank'], ['970418', 'BIDV'], ['970405', 'Agribank'], ['970407', 'Techcombank'], ['970422', 'MBBank'],
  ['970416', 'ACB'], ['970432', 'VPBank'], ['970423', 'TPBank'], ['970403', 'Sacombank'], ['970441', 'VIB'], ['970443', 'SHB'], ['970437', 'HDBank'],
  ['970448', 'OCB'], ['970426', 'MSB'], ['970440', 'SeABank'], ['970431', 'Eximbank'], ['970449', 'LPBank'], ['970428', 'Nam A Bank'], ['970409', 'Bac A Bank'],
  ['970454', 'Viet Capital Bank'], ['970429', 'SCB'], ['970412', 'PVcomBank'], ['970419', 'NCB'], ['970425', 'ABBANK'], ['970427', 'VietABank'], ['970430', 'PGBank'],
  ['970438', 'BaoViet Bank'], ['970452', 'KienLongBank'], ['970400', 'Saigonbank'], ['970458', 'UOB'], ['970421', 'VRB'], ['546034', 'CAKE by VPBank'], ['963388', 'Timo']];
const PAYMENT = [
  { key: 'bankBin', label: 'Ngân hàng nhận chuyển khoản', def: '', type: 'select', options: BANKS.map(([v, l]) => ({ v, l })) },
  { key: 'bankAccount', label: 'Số tài khoản', def: '', type: 'text' },
  { key: 'bankHolder', label: 'Tên chủ tài khoản (viết hoa, không dấu — đúng như trên app ngân hàng)', def: '', type: 'text' },
];

/* ─── Phông chữ ──────────────────────────────────────────────────────────── */
// 4 vai trò chữ trên trang (theo biến CSS --f-display / --f-head / --f-body / --f-mono)
const FONT_ROLES = [
  { key: 'display', label: 'Chữ tiêu đề lớn, nút, số liệu (chữ đứng hẹp)', def: 'Barlow Condensed' },
  { key: 'head', label: 'Chữ tiêu đề kiểu thanh mảnh (trang Khóa học, Dịch vụ)', def: 'Ysabeau' },
  { key: 'body', label: 'Chữ đoạn văn, tiêu đề chính Trang chủ', def: 'Inter' },
  { key: 'mono', label: 'Chữ nhãn nhỏ, menu, giá (chữ đều kiểu máy đánh)', def: 'Roboto Mono' },
];
// Google Fonts có bộ chữ tiếng Việt; axis = phần sau dấu ":" trong link Google Fonts
const FONTS = [
  ['Barlow Condensed', 'wght@400;500;600;700;800;900', 'display'], ['Barlow Semi Condensed', 'wght@400;500;600;700;800;900', 'display'],
  ['Oswald', 'wght@300..700', 'display'], ['Roboto Condensed', 'wght@300..900', 'display'], ['Saira Condensed', 'wght@400;500;600;700;800;900', 'display'],
  ['Big Shoulders Display', 'wght@300..900', 'display'], ['Archivo Narrow', 'wght@400..700', 'display'], ['Encode Sans Condensed', 'wght@400;500;600;700;800;900', 'display'],
  ['Alumni Sans', 'wght@300..900', 'display'], ['Anton', '', 'display'], ['Fjalla One', '', 'display'],
  ['Inter', 'wght@300..900', 'sans'], ['Ysabeau', 'wght@300..900', 'sans'], ['Be Vietnam Pro', 'wght@300;400;500;600;700;800;900', 'sans'],
  ['Montserrat', 'wght@300..900', 'sans'], ['Roboto', 'wght@300..900', 'sans'], ['Open Sans', 'wght@300..800', 'sans'], ['Lexend', 'wght@300..900', 'sans'],
  ['Plus Jakarta Sans', 'wght@300..800', 'sans'], ['Work Sans', 'wght@300..900', 'sans'], ['Nunito Sans', 'wght@300..900', 'sans'],
  ['Manrope', 'wght@300..800', 'sans'], ['Space Grotesk', 'wght@300..700', 'sans'], ['Source Sans 3', 'wght@300..900', 'sans'],
  ['Mulish', 'wght@300..900', 'sans'], ['Josefin Sans', 'wght@300..700', 'sans'], ['Noto Sans', 'wght@300..900', 'sans'],
  ['Playfair Display', 'wght@400..900', 'serif'], ['Lora', 'wght@400..700', 'serif'],
  ['Roboto Mono', 'wght@300..700', 'mono'], ['JetBrains Mono', 'wght@300..800', 'mono'], ['IBM Plex Mono', 'wght@300;400;500;600;700', 'mono'],
  ['Space Mono', 'wght@400;700', 'mono'], ['Source Code Pro', 'wght@300..900', 'mono'],
].map(([name, axis, group]) => ({ name, axis, group }));
const gfParam = f => 'family=' + f.name.replace(/ /g, '+') + (f.axis ? ':' + f.axis : '');

/* ─── Đọc / ghi ──────────────────────────────────────────────────────────── */
const GROUPS = ['text', 'media', 'alt', 'colors', 'palette', 'fonts', 'contact', 'payment', 'icons', 'links', 'hide', 'lists', 'layout', 'code'];
let cat = null, catMtime = 0, store = null, storeMtime = -1;
function catalog() {
  const m = fs.existsSync(CATALOG) ? fs.statSync(CATALOG).mtimeMs : 0;
  if (!cat || m !== catMtime) {
    cat = m ? JSON.parse(fs.readFileSync(CATALOG, 'utf8')) : { pages: [], sections: [], fields: [], media: [] };
    catMtime = m;
    cat._byKey = new Map(cat.fields.map(f => [f.key, f]));
    cat._media = new Map((cat.media || []).map(x => [x.key, x]));
    cat._icons = new Map((cat.icons || []).map(x => [x.key, x]));
    cat._links = new Map((cat.links || []).map(x => [x.key, x]));
    cat._lists = new Map((cat.lists || []).map(x => [x.key, x]));
    cat._palette = new Map((cat.palette || []).map(x => [x.hex, x]));
    cat._fixed = {};
    for (const [pg, bl] of Object.entries(cat.blocks || {})) cat._fixed[pg] = new Set(bl.filter(b => b.fixed).map(b => b.id));
  }
  return cat;
}
function data() {
  const m = fs.existsSync(STORE) ? fs.statSync(STORE).mtimeMs : 0;
  if (!store || m !== storeMtime) {
    try { store = m ? JSON.parse(fs.readFileSync(STORE, 'utf8')) : {}; } catch (e) {
      // file hỏng (thường do sửa tay): cất sang bên cạnh, trang dùng nội dung gốc thay vì lỗi toàn bộ
      const bad = STORE + '.hong-' + Date.now();
      try { fs.renameSync(STORE, bad); } catch { /* bỏ qua */ }
      console.error(`[nội dung] cms.json bị hỏng (${e.message}) — đã cất ở ${path.basename(bad)}, tạm dùng nội dung gốc`);
      store = {};
    }
    storeMtime = m;
    for (const k of GROUPS) store[k] = store[k] || {};
  }
  return store;
}
function version() { data(); catalog(); return crypto.createHash('sha1').update(String(storeMtime) + ':' + catMtime + ':' + settings.stamp() + ':' + require('./pages').stamp()).digest('hex').slice(0, 10); }
// liên hệ / giờ mở cửa đang dùng (đã điền mặc định)
function contactConfig() { const d = data(), cfg = {}; for (const x of CONTACT) cfg[x.key] = d.contact[x.key] || x.def; return cfg; }
// slug các trang phụ đang hiển thị
const livePages = () => require('./pages').index().filter(p => p.published).map(p => p.slug);
function write(next) {
  const tmp = STORE + '.tmp';
  next.updatedAt = Date.now();
  fs.writeFileSync(tmp, JSON.stringify(next, null, 1));
  fs.renameSync(tmp, STORE);
  cache.clear();
}

/* ─── Khóa của mục thêm mới: "<khóa gốc>@<mã>[@<mã>…]" ───────────────────── */
const SUFFIX = /^[a-z][a-z0-9]{0,11}$/;
function splitKey(key) {
  const parts = String(key).split('@');
  return { base: parts[0], ids: parts.slice(1) };
}
const okKey = (key, has) => { const { base, ids } = splitKey(key); return has(base) && ids.every(i => SUFFIX.test(i)); };

/* ─── Làm sạch dữ liệu nhập ──────────────────────────────────────────────── */
const ALLOWED = /^(em|b|strong|i|br|small|u|s|span)$/i;
// chỉ giữ vài thẻ định dạng (<em> nhấn màu, <br> xuống dòng…), bỏ mọi thẻ khác và thuộc tính
function clean(v) {
  if (v == null) return null;
  return String(v).slice(0, 5000).replace(/<\s*(\/?)\s*([a-z0-9]+)[^>]*>/gi, (m, close, tag) => ALLOWED.test(tag) ? `<${close}${tag.toLowerCase()}>` : '').replace(/<(?![/a-z])/gi, '‹');
}
const toHtml = v => v.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;');
const attrEsc = v => v.replace(/<[^>]*>/g, '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const HREF = /^(\/[^\s"<>]*|#[\w-]*|https?:\/\/[^\s"<>]+|tel:[+\d\s().-]{3,20}|mailto:[^\s"<>@]+@[^\s"<>]+|zalo:\/\/[^\s"<>]+)$/;
const MEDIA_URL = /^(\/assets\/(uploads|media)\/[\w.-]+|https:\/\/[^\s"'<>]+)$/;
const HEX = /^#[0-9a-f]{6}$/i;

function update(patch) {
  const cur = JSON.parse(JSON.stringify(data()));
  const c = catalog();
  const isField = k => c._byKey.has(k), isMedia = k => c._media.has(k), isIcon = k => c._icons.has(k), isLink = k => c._links.has(k) || (c._byKey.get(k) || {}).type === 'link';
  const redo = [];   // chữ tiếng Việt vừa đổi → AI dịch lại tiếng Anh
  for (const [key, val] of Object.entries(patch.text || {})) {
    if (!okKey(key, isField)) continue;
    if (val === null) { delete cur.text[key]; continue; }
    const o = { ...(cur.text[key] || {}) }, viBefore = o.vi;
    for (const side of ['vi', 'en']) if (val[side] !== undefined) { const v = clean(val[side]); if (v === null || v === '') delete o[side]; else o[side] = v; }
    // đổi tiếng Việt mà không sửa tay tiếng Anh → bản tiếng Anh cũ không còn đúng
    if (o.vi && o.vi !== viBefore && val.en === undefined && translatable(key)) { delete o.en; redo.push(key); }
    if (Object.keys(o).length) cur.text[key] = o; else delete cur.text[key];
  }
  for (const [key, url] of Object.entries(patch.media || {})) {
    if (!okKey(key, isMedia)) continue;
    if (url === null || url === '') delete cur.media[key];
    else if (MEDIA_URL.test(url)) cur.media[key] = url;
  }
  for (const [key, v] of Object.entries(patch.alt || {})) {
    if (!okKey(key, isMedia)) continue;
    if (v === null) delete cur.alt[key]; else cur.alt[key] = String(v).replace(/[<>"]/g, '').slice(0, 200);
  }
  for (const [key, val] of Object.entries(patch.colors || {})) {
    if (!COLORS.find(x => x.key === key)) continue;
    if (val === null || val === '') delete cur.colors[key];
    else if (HEX.test(val)) cur.colors[key] = val.toUpperCase();
  }
  for (const [hex, val] of Object.entries(patch.palette || {})) {
    const k = hex.toUpperCase();
    if (!c._palette.has(k)) continue;
    if (val === null || val === '' || String(val).toUpperCase() === k) delete cur.palette[k];
    else if (HEX.test(val)) cur.palette[k] = val.toUpperCase();
  }
  for (const [role, val] of Object.entries(patch.fonts || {})) {
    const r = FONT_ROLES.find(x => x.key === role);
    if (!r) continue;
    if (val === null || val === '' || (val && val.name === r.def && !val.url)) { delete cur.fonts[role]; continue; }
    const name = String(val.name || '').trim().slice(0, 60);
    if (val.url) { // phông tải lên (woff2 / woff / ttf / otf)
      if (!/^[\p{L}\p{N} _-]{2,60}$/u.test(name) || !/^\/assets\/uploads\/[\w.-]+\.(woff2|woff|ttf|otf)$/.test(val.url)) continue;
      cur.fonts[role] = { name, url: val.url };
    } else if (FONTS.some(f => f.name === name)) cur.fonts[role] = { name };
  }
  for (const [group, defs] of [['contact', CONTACT], ['payment', PAYMENT]]) {
    for (const [key, val] of Object.entries(patch[group] || {})) {
      const def = defs.find(x => x.key === key);
      if (!def) continue;
      if (val === null || val === '') { delete cur[group][key]; continue; }
      const v = String(val).trim().slice(0, 300);
      if (def.type === 'url' && !/^https:\/\/[^\s"'<>]+$/.test(v)) continue;
      if (def.type === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) continue;
      if (def.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) continue;
      if (def.type === 'select' && !def.options.some(o => o.v === v)) continue;
      if (key === 'bankAccount' && !/^[0-9A-Za-z]{4,25}$/.test(v)) continue;
      if (/[<>"]/.test(v)) continue;
      cur[group][key] = key === 'bankHolder' ? v.toUpperCase() : v;
    }
  }
  for (const [key, val] of Object.entries(patch.icons || {})) {
    if (!okKey(key, isIcon)) continue;
    if (val === null) { delete cur.icons[key]; continue; }
    if (val && val.svg) { const s = html.cleanSvg(val.svg); if (s) cur.icons[key] = s; }
    else if (val && val.url && MEDIA_URL.test(val.url)) cur.icons[key] = { url: val.url };
  }
  for (const [key, val] of Object.entries(patch.links || {})) {
    if (!okKey(key, isLink)) continue;
    if (val === null) { delete cur.links[key]; continue; }
    const v = String(val).trim();
    if (HREF.test(v)) cur.links[key] = v;
  }
  for (const [key, val] of Object.entries(patch.hide || {})) {
    if (!okKey(key, k => (isField(k) && c._byKey.get(k).type !== 'link') || isMedia(k) || isIcon(k) || c._links.has(k))) continue;
    if (val) cur.hide[key] = true; else delete cur.hide[key];
  }
  for (const [key, val] of Object.entries(patch.lists || {})) {
    if (!okKey(key, k => c._lists.has(k))) continue;
    if (val === null) { delete cur.lists[key]; continue; }
    const def = c._lists.get(splitKey(key).base), orig = new Set(def.items.map(i => i.id));
    const add = {};
    for (const [id, a] of Object.entries((val && val.add) || {})) if (SUFFIX.test(id) && a && orig.has(String(a.from))) add[id] = { from: String(a.from) };
    const order = [...new Set((Array.isArray(val.order) ? val.order : []).map(String))].filter(id => orig.has(id) || add[id]).slice(0, 80);
    for (const id of Object.keys(add)) if (!order.includes(id)) delete add[id];
    cur.lists[key] = { order, add };
  }
  for (const [page, val] of Object.entries(patch.layout || {})) {
    const blocks = (c.blocks || {})[page];
    if (!blocks) continue;
    if (val === null) { delete cur.layout[page]; continue; }
    const ids = new Set(blocks.map(b => b.id)), nav = new Set(blocks.filter(b => /\.nav$/.test(b.sec)).map(b => b.id));
    const hide = {};
    for (const [id, on] of Object.entries(val.hide || {})) if (on && ids.has(id) && !nav.has(id)) hide[id] = true;
    const order = (Array.isArray(val.order) ? val.order : []).filter(id => ids.has(id));
    cur.layout[page] = { order, hide };
  }
  for (const k of ['css', 'head', 'body']) {
    if (!patch.code || patch.code[k] === undefined) continue;
    const v = patch.code[k] == null ? '' : String(patch.code[k]).slice(0, 60000);
    if (v.trim()) cur.code[k] = v; else delete cur.code[k];
  }
  gc(cur);
  write(cur);
  if (redo.length) require('./translate').queue('cms', redo);
  return cur;
}

/* ─── Tiếng Anh tự dịch (lib/translate.js) ───────────────────────────────────── */
// chữ cần dịch: không phải đường dẫn, không phải ô dùng chung cho 2 ngôn ngữ (mã size, số liệu…)
// chữ tiếng Việt đang dùng của 1 ô (bản sửa trong /admin, chưa sửa thì def) — tiêu đề tab / mô tả Google server tự ghi vào trang dựng bằng JS
function textVi(key, def) { const v = String((data().text[key] || {}).vi || '').replace(/<[^>]*>/g, '').trim(); return v || def; }
function translatable(key) { const f = catalog()._byKey.get(splitKey(key).base); return !!f && !f.mono && f.type !== 'link'; }
require('./translate').register('cms', {
  // chữ tiếng Việt đã sửa trong /admin mà chưa có tiếng Anh
  collect(refs) {
    const d = data(), c = catalog(), keys = refs || Object.keys(d.text);
    return keys.filter(k => d.text[k] && d.text[k].vi && !d.text[k].en && translatable(k))
      .map(k => ({ ref: k, vi: d.text[k].vi, html: !!(c._byKey.get(splitKey(k).base) || {}).html }));
  },
  apply(results) {
    const cur = JSON.parse(JSON.stringify(data()));
    let n = 0;
    for (const r of results) {
      const o = cur.text[r.ref];
      if (!o || o.vi !== r.vi || o.en) continue;   // đã đổi trong lúc dịch / đã có bản tay
      const v = clean(r.en);
      if (v) { o.en = v; n++; }
    }
    if (n) write(cur);
  },
});
// bỏ phần đã sửa của mục đã xóa khỏi danh sách (khóa "…@mã" không còn mục nào dùng)
function gc(d) {
  const live = new Set();
  for (const o of Object.values(d.lists)) for (const id of Object.keys(o.add || {})) live.add(id);
  for (const g of ['text', 'media', 'alt', 'icons', 'links', 'hide', 'lists']) {
    for (const key of Object.keys(d[g])) if (splitKey(key).ids.some(id => !live.has(id))) delete d[g][key];
  }
}

/* ─── Áp nội dung vào file khi phục vụ ───────────────────────────────────── */
const PAGE_OF = [
  [/^index\.html$|^assets\/css\/home\.css$|^assets\/js\/home-/, 'home'],
  [/^shop\.html$|^assets\/css\/shop\.css$|^assets\/js\/shop-/, 'shop'],
  [/^khoa-hoc\.html$|^assets\/css\/course\.css$|^assets\/js\/course-/, 'course'],
  [/^dich-vu-setup\.html$|^assets\/css\/services\.css$|^assets\/js\/services-/, 'services'],
];
function pageOf(rel) { const m = PAGE_OF.find(([re]) => re.test(rel)); return m ? m[1] : null; }
// file được áp nội dung tùy chỉnh (trang công khai, không gồm trang quản trị)
function transformable(rel) { return !!pageOf(rel) || /^assets\/(css|js)\/site\.(css|js)$|^404\.html$|^phieu\.html$|^trang\/[\w-]+\.html$/.test(rel); }

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
// màu khi rê chuột: nếu chưa chọn riêng thì lấy màu nhấn tối đi ~13%
function effectiveColors(c) {
  const out = { ...c };
  if (c.accent && !c.accentHover) out.accentHover = '#' + hex(c.accent).map(x => Math.round(x * 0.87).toString(16).padStart(2, '0')).join('').toUpperCase();
  return out;
}
function replaceAll(s, a, b) { return a && a !== b ? s.split(a).join(b) : s; }
// đổi màu: mã màu cũ → mới (cả dạng #abc, #aabbcc, rgb(), rgba()); qua mã tạm để các màu không đè lên nhau
function recolor(s, pairs) {
  pairs.forEach(([from], i) => {
    const [r, g, b] = hex(from), short = from[1] === from[2] && from[3] === from[4] && from[5] === from[6] ? '#' + from[1] + from[3] + from[5] : null;
    s = s.replace(new RegExp(`${from}(?![0-9a-z_-])`, 'gi'), `\u0000C${i}H\u0000`);
    if (short) s = s.replace(new RegExp(`([:\\s(,'"])${short}(?![0-9a-z_-])`, 'gi'), `$1\u0000C${i}H\u0000`);
    s = s.replace(new RegExp(`rgba?\\(\\s*${r}\\s*,\\s*${g}\\s*,\\s*${b}\\s*([,)])`, 'g'), (m, end) => `\u0000C${i}${m.startsWith('rgba') ? 'A' : 'R'}${end}\u0000`);
  });
  pairs.forEach(([, to], i) => {
    const [r, g, b] = hex(to);
    s = s.split(`\u0000C${i}H\u0000`).join(to);
    s = s.replace(new RegExp(`\u0000C${i}([AR])([,)])\u0000`, 'g'), (m, k, end) => (k === 'A' ? 'rgba(' : 'rgb(') + `${r},${g},${b}${end}`);
  });
  return s;
}
// đổi phông: tên phông cũ (trong dấu nháy) → mới
function refont(s, fonts) {
  const todo = FONT_ROLES.filter(r => fonts[r.key]);
  todo.forEach((r, i) => { s = s.replace(new RegExp(`(['"])${r.def}\\1`, 'g'), `$1\u0000F${i}\u0000$1`); });
  todo.forEach((r, i) => { s = s.split(`\u0000F${i}\u0000`).join(fonts[r.key].name.replace(/['"\\]/g, '')); });
  return s;
}
// link Google Fonts: bỏ phông đã thay, thêm phông mới; phông tải lên → @font-face
function fontLinks(s, fonts) {
  const todo = FONT_ROLES.filter(r => fonts[r.key]);
  if (!todo.length) return s;
  s = s.replace(/(<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?)([^"]*)(">)/, (m, a, q, b) => {
    let parts = q.split('&').filter(p => !(p.startsWith('family=') && todo.some(r => p.startsWith('family=' + r.def.replace(/ /g, '+') + ':') || p === 'family=' + r.def.replace(/ /g, '+'))));
    const add = [...new Set(todo.filter(r => !fonts[r.key].url).map(r => FONTS.find(f => f.name === fonts[r.key].name)).filter(Boolean))].map(gfParam);
    parts = parts.filter(p => p.startsWith('family=')).concat(add).concat(['display=swap']);
    return a + parts.join('&') + b;
  });
  const faces = todo.filter(r => fonts[r.key].url).map(r => `@font-face{font-family:'${fonts[r.key].name.replace(/['"\\]/g, '')}';src:url('${fonts[r.key].url}');font-display:swap;font-weight:100 900;}`);
  if (faces.length) s = s.replace('</head>', `<style id="dc-fonts">${faces.join('')}</style>\n</head>`);
  return s;
}

// thay phần bên trong (hoặc thuộc tính) của mọi phần tử có data-cms="key"
function setHtml(src, key, value) {
  const needle = `data-cms="${key}"`;
  let out = '', i = 0;
  for (;;) {
    const at = src.indexOf(needle, i);
    if (at < 0) break;
    const lt = src.lastIndexOf('<', at);
    const name = (src.slice(lt + 1).match(/^[a-zA-Z0-9]+/) || [''])[0];
    const gt = src.indexOf('>', at);
    const startTag = src.slice(lt, gt + 1);
    const attr = (startTag.match(/data-cms-attr="([a-z-]+)"/) || [])[1];
    if (attr) {
      const re = new RegExp(`(\\s${attr}=")[^"]*(")`);
      out += src.slice(i, lt) + startTag.replace(re, (m, p1, p2) => p1 + attrEsc(value) + p2);
      i = gt + 1; continue;
    }
    // tìm thẻ đóng tương ứng (đếm thẻ cùng tên lồng nhau)
    const tagRe = new RegExp(`<(/?)${name}\\b[^>]*>`, 'gi');
    tagRe.lastIndex = gt + 1;
    let depth = 1, m, end = -1;
    while ((m = tagRe.exec(src))) { depth += m[1] ? -1 : 1; if (depth === 0) { end = m.index; break; } }
    if (end < 0) break;
    out += src.slice(i, gt + 1) + (name.toLowerCase() === 'title' ? attrEsc(value) : toHtml(value));
    i = end;
  }
  return out + src.slice(i);
}

// đổi 1 thuộc tính (src/poster) của mọi thẻ có dấu `marker`
function setAttrAt(src, marker, attr, value) {
  let i = 0;
  for (;;) {
    const at = src.indexOf(marker, i);
    if (at < 0) return src;
    const lt = src.lastIndexOf('<', at), gt = src.indexOf('>', at);
    const tag = src.slice(lt, gt + 1).replace(new RegExp(`(\\s${attr}=")[^"]*(")`), (m, a, b) => a + attrEsc(value) + b);
    src = src.slice(0, lt) + tag + src.slice(gt + 1);
    i = lt + tag.length;
  }
}

const cache = new Map();
function transform(rel, content) {
  const ver = version();
  const ck = rel + '|' + ver + '|' + crypto.createHash('sha1').update(content).digest('base64');
  if (cache.has(ck)) return cache.get(ck);
  const d = data(), c = catalog(), page = pageOf(rel), isHtml = /\.html$/.test(rel);
  let s = content;
  // cấu trúc: bố cục → danh sách → số thứ tự → ẩn / icon / link / alt
  if (isHtml) {
    if (page && d.layout[page]) s = html.layout(s, d.layout[page], c._fixed[page] || new Set());
    s = html.lists(s, d.lists);
    if (Object.keys(d.lists).length) s = html.renumber(s);
    if (Object.keys(d.hide).length + Object.keys(d.icons).length + Object.keys(d.links).length + Object.keys(d.alt).length) s = html.marks(s, d.hide, d.icons, d.links, d.alt);
    // link tới trang phụ chưa đăng (vd chính sách còn là bản nháp) → bỏ link (bỏ cả mục danh sách nếu mục chỉ có link đó)
    if (s.includes('href="/trang/')) {
      const live = new Set(livePages());
      s = s.replace(/<(li|div|span|p)\b([^>]*\bdata-cms-item\b[^>]*)>\s*<a\b[^>]*\bhref="\/trang\/([\w-]+)[^"]*"[^>]*>[\s\S]*?<\/a>\s*<\/\1>/g, (m, tag, attrs, slug) => (live.has(slug) ? m : ''))
        .replace(/<a\b[^>]*\bhref="\/trang\/([\w-]+)[^"]*"[^>]*>[\s\S]*?<\/a>/g, (m, slug) => (live.has(slug) ? m : ''));
    }
  }
  // liên hệ
  const ct = d.contact;
  if (ct.phone) { s = replaceAll(s, '0909 xxx xxx', ct.phone); s = replaceAll(s, 'tel:0909000000', 'tel:' + ct.phone.replace(/[^\d+]/g, '')); }
  for (const k of ['zalo', 'facebook', 'instagram', 'youtube', 'addr1', 'addr2']) if (ct[k]) s = replaceAll(s, CONTACT.find(x => x.key === k).def, ct[k]);
  if (ct.maps) { s = replaceAll(s, MAPS.replace(/&/g, '&amp;'), ct.maps.replace(/&/g, '&amp;')); s = replaceAll(s, MAPS, ct.maps); }
  // màu thương hiệu + bảng màu
  const cols = effectiveColors(d.colors);
  const pairs = COLORS.filter(col => cols[col.key] && cols[col.key].toUpperCase() !== col.def.toUpperCase()).map(col => [col.def, cols[col.key]])
    .concat(Object.entries(d.palette));
  if (pairs.length) s = recolor(s, pairs);
  if (Object.keys(d.fonts).length) s = refont(s, d.fonts);
  if (isHtml) {
    // ảnh / video: thay đúng vị trí có data-cms-media / data-cms-poster
    for (const [key, url] of Object.entries(d.media)) {
      const m = c._media.get(splitKey(key).base);
      if (!m || m.src !== 'html') continue;
      s = setAttrAt(s, `${m.poster ? 'data-cms-poster' : 'data-cms-media'}="${key}"`, m.poster ? 'poster' : (m.attr === 'content' ? 'content' : 'src'), url);
    }
    // ảnh chia sẻ (og:image) cần đường dẫn đầy đủ: thêm địa chỉ web (Thiết lập → Thông báo → địa chỉ website, hoặc SITE_URL)
    const site = (settings.all().notify.siteUrl || process.env.SITE_URL || '').replace(/\/+$/, '');
    if (site) s = s.replace(/(<meta [^>]*property="og:image" content=")(\/[^"]*")/g, `$1${attrEsc(site)}$2`);
    // chữ tiếng Việt
    if (s.includes('data-cms=')) for (const [key, val] of Object.entries(d.text)) if (val.vi != null && s.includes(`data-cms="${key}"`)) s = setHtml(s, key, val.vi);
    s = settings.fillTokens(s, 'vi');                                   // biến giá {found.price}… theo mục Thiết lập
    const fav = settings.all().brand.favicon;
    if (fav) s = s.replace(/<link rel="icon" href="[^"]*" type="image\/svg\+xml">/, `<link rel="icon" href="${attrEsc(fav)}">`);
    s = fontLinks(s, d.fonts);
    // mã tùy chỉnh
    if (d.code.css) s = s.replace('</head>', `<style id="dc-custom-css">\n${d.code.css.replace(/<\/style/gi, '<\\/style')}\n</style>\n</head>`);
    if (d.code.head) s = s.replace('</head>', d.code.head + '\n</head>');
    if (d.code.body) s = s.replace(/<\/body>(?![\s\S]*<\/body>)/, d.code.body + '\n</body>');
  }
  if (cache.size > 200) cache.clear();
  cache.set(ck, s);
  return s;
}

// window.__CMS cho trang: t = chữ [vi, en] · m = ảnh trong JS · i = icon trong JS · l = danh sách · h = phần đã ẩn
//   c = liên hệ · p = tài khoản nhận tiền · s = thiết lập công khai
function clientScript() {
  const d = data(), c = catalog(), t = {};
  const fieldOf = k => c._byKey.get(splitKey(k).base);
  // chữ trong HTML có biến giá: luôn gửi kèm để đổi ngôn ngữ vẫn điền đúng giá (Trang chủ dịch theo câu)
  for (const f of c.fields) if (f.src === 'html' && settings.TOKEN_RE.test((f.vi || '') + (f.en || ''))) { settings.TOKEN_RE.lastIndex = 0; t[f.key] = [f.vi, f.en != null ? f.en : f.vi]; }
  settings.TOKEN_RE.lastIndex = 0;
  // mục thêm mới trong danh sách HTML: gửi đủ 2 thứ tiếng để đổi ngôn ngữ đúng
  const cloneKeys = (it, sfx) => {                   // chữ của mục mẫu + các mục con gốc bên trong nó
    if (!it) return;
    for (const k of it.fields) { const f = c._byKey.get(k); if (f) t[k + sfx] = [f.vi, f.en != null ? f.en : f.vi]; }
    for (const lk of it.lists || []) for (const sub of (c._lists.get(lk) || { items: [] }).items) cloneKeys(sub, sfx);
  };
  for (const [lk, o] of Object.entries(d.lists)) {
    const { base, ids } = splitKey(lk), L = c._lists.get(base);
    if (!L || L.src !== 'html') continue;
    for (const [id, a] of Object.entries(o.add || {})) cloneKeys(L.items.find(x => x.id === a.from), ids.map(x => '@' + x).join('') + '@' + id);
  }
  for (const [key, val] of Object.entries(d.text)) {
    const f = fieldOf(key);
    if (!f) continue;
    const isHtml = f.src === 'html', prev = t[key] || [];
    // tiếng Anh: bản AI dịch; chưa dịch xong (hoặc chưa cài khóa AI) mà tiếng Việt đã sửa → tạm dùng chữ tiếng Việt mới, không hiện chữ tiếng Anh cũ đã sai nội dung
    t[key] = [val.vi != null ? val.vi : (isHtml ? (prev[0] != null ? prev[0] : f.vi) : null),
      val.en != null ? val.en : val.vi != null && !f.mono ? val.vi : (isHtml ? (prev[1] != null ? prev[1] : (f.en != null ? f.en : f.vi)) : null)];
  }
  const m = {};
  for (const [key, url] of Object.entries(d.media)) { const e = c._media.get(splitKey(key).base); if (e && e.src === 'js') m[key] = url; }
  const i = {};
  for (const [key, ov] of Object.entries(d.icons)) { const e = c._icons.get(splitKey(key).base); if (e && e.src === 'js') i[key] = html.mergeSvg(e.svg, ov); }
  // link do JavaScript dựng (vd menu điện thoại): DC.x đọc __CMS.ln trước
  const ln = {};
  for (const [key, url] of Object.entries(d.links)) { const f = fieldOf(key); if (f && f.src === 'js') ln[key] = url; }
  // cấu hình công khai: liên hệ / giờ mở cửa, tài khoản nhận tiền (để tạo mã VietQR)
  const cfg = contactConfig();
  const pay = d.payment || {};
  const p = pay.bankBin && pay.bankAccount ? { bin: pay.bankBin, bank: (BANKS.find(b => b[0] === pay.bankBin) || [])[1] || '', acc: pay.bankAccount, holder: pay.bankHolder || '' } : null;
  // pg = trang phụ đang hiển thị (link tới trang chưa đăng thì ẩn)
  return 'window.__CMS=' + JSON.stringify({ v: version(), t, m, i, ln, l: d.lists, h: d.hide, c: cfg, p, pg: livePages(), s: settings.forPublic() }).replace(/</g, '\\u003c') + ';';
}

function publicCatalog() {
  const c = catalog();
  const out = {};
  for (const [k, v] of Object.entries(c)) if (!k.startsWith('_')) out[k] = v;
  return { ...out, colors: COLORS, contact: CONTACT, payment: PAYMENT, fontRoles: FONT_ROLES, fonts: FONTS.map(f => ({ ...f, css: 'https://fonts.googleapis.com/css2?' + gfParam(f) + '&display=swap' })) };
}

// cập nhật mặc định (chữ đang hiển thị, kích thước ảnh đo trên trang) — dùng khi dựng lại danh mục
function mergeCapture(body) {
  const c = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  const byKey = new Map(c.fields.map(f => [f.key, f]));
  let nf = 0, nm = 0;
  for (const [key, v] of Object.entries(body.fields || {})) {
    const f = byKey.get(key);
    if (!f) continue;
    if (typeof v.vi === 'string') f.vi = v.vi;
    if (typeof v.en === 'string' && v.en !== f.vi) f.en = v.en;
    if (v.vis === false) f.hidden = true; else delete f.hidden;
    nf++;
  }
  if (Array.isArray(body.media)) {
    c.media = c.media || [];
    for (const m of body.media) {
      const i = c.media.findIndex(x => x.key === m.key);
      if (i < 0) continue;
      c.media[i] = { ...c.media[i], ...m, section: m.section || c.media[i].section };
      nm++;
    }
    // nhãn: "Ảnh 2", "Video", "Ảnh chờ của video", "Ảnh nền" … đánh số trong từng khu vực
    const n = {};
    c.media.sort((a, b) => (a.order || 0) - (b.order || 0));
    for (const m of c.media) {
      const kind = m.poster ? 'Ảnh chờ của video' : m.kind === 'video' ? 'Video' : (m.rec && m.rec.cover ? 'Ảnh nền' : 'Ảnh');
      const k = (m.section || '') + '|' + kind;
      n[k] = (n[k] || 0) + 1;
      m._n = n[k]; m._k = k; m._kind = kind;
    }
    for (const m of c.media) { m.label = m._kind + (n[m._k] > 1 ? ' ' + m._n : '') + (m.alt ? ' — ' + m.alt : ''); delete m._n; delete m._k; delete m._kind; }
  }
  fs.writeFileSync(CATALOG, JSON.stringify(c, null, 1));
  cache.clear();
  return { fields: nf, media: nm };
}

module.exports = { catalog: publicCatalog, data, update, transform, transformable, clientScript, mergeCapture, version, pageOf, contactConfig, livePages, textVi, banks: BANKS };
