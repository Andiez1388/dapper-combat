/*
 * Sản phẩm tự thiết kế (custom) — Boxing Equipment.
 * Mỗi sản phẩm có thể bật "Cho khách tự thiết kế" (/admin → Sản phẩm → mục Thiết kế riêng):
 *   - mẫu hình xem trước (groin guard / găng / headgear) → các phần tô màu (vùng)
 *   - bảng màu cho phép, phụ phí thiết kế, thời gian làm
 *   - tên / chữ (font, in hay thêu, vị trí), logo của khách (in hay thêu, vị trí)
 *   - nhóm tùy chọn thêm do chủ shop đặt (chất liệu, độ dày đệm, kiểu khóa…), mỗi lựa chọn có phụ phí
 * Giá luôn do máy chủ tính lại từ cấu hình (không tin số trình duyệt gửi lên).
 * Trang Shop dùng cùng các định nghĩa qua /assets/data/cms.js (window.__CMS.cx).
 */

// bảng màu chung: [mã, HEX, tên Việt, tên Anh]
const PALETTE = [
  ['black', '#111111', 'Đen', 'Black'], ['white', '#f3f2ee', 'Trắng', 'White'], ['red', '#c8102e', 'Đỏ', 'Red'],
  ['wine', '#6d1324', 'Đỏ rượu', 'Wine'], ['navy', '#18264a', 'Xanh navy', 'Navy'], ['royal', '#1f4fbf', 'Xanh hoàng gia', 'Royal blue'],
  ['sky', '#6db3e8', 'Xanh da trời', 'Sky blue'], ['green', '#1f7a4d', 'Xanh lá', 'Green'], ['olive', '#5d6b3a', 'Xanh rêu', 'Olive'],
  ['gold', '#c9a227', 'Vàng gold', 'Gold'], ['yellow', '#f2c12e', 'Vàng', 'Yellow'], ['orange', '#e8692a', 'Cam', 'Orange'],
  ['pink', '#e9799f', 'Hồng', 'Pink'], ['purple', '#5b3a8c', 'Tím', 'Purple'], ['brown', '#6b4226', 'Nâu', 'Brown'],
  ['grey', '#8a8d91', 'Xám', 'Grey'], ['silver', '#c3c6ca', 'Bạc', 'Silver'], ['camo', '#4b5320', 'Rằn ri', 'Camo'],
];
// mẫu hình xem trước: vùng tô màu [mã, Việt, Anh, màu mặc định] + vị trí đặt chữ / logo [mã, Việt, Anh]
const TEMPLATES = {
  groin: {
    vi: 'Bảo vệ hạ bộ (groin guard)', en: 'Groin guard',
    zones: [['cup', 'Phần bảo vệ chính', 'Main cup', 'black'], ['left', 'Cánh trái', 'Left wing', 'black'], ['right', 'Cánh phải', 'Right wing', 'black'],
      ['belt', 'Đai lưng', 'Waist belt', 'black'], ['trim', 'Viền', 'Trim', 'red'], ['panel', 'Nền logo', 'Logo panel', 'red']],
    spots: [['belt', 'Đai lưng', 'Waist belt'], ['cup', 'Giữa mặt trước', 'Front centre'], ['left', 'Cánh trái', 'Left wing'], ['right', 'Cánh phải', 'Right wing']],
  },
  gloves: {
    vi: 'Găng tay', en: 'Gloves',
    zones: [['top', 'Mu bàn tay', 'Back of hand', 'black'], ['palm', 'Lòng bàn tay', 'Palm', 'black'], ['thumb', 'Ngón cái', 'Thumb', 'black'],
      ['cuff', 'Cổ tay', 'Cuff', 'black'], ['trim', 'Viền', 'Trim', 'red'], ['lace', 'Dây buộc / khóa', 'Laces / strap', 'white']],
    spots: [['top', 'Mu bàn tay', 'Back of hand'], ['cuff', 'Cổ tay', 'Cuff'], ['thumb', 'Ngón cái', 'Thumb']],
  },
  headgear: {
    vi: 'Mũ bảo hộ (headgear)', en: 'Headgear',
    zones: [['crown', 'Đỉnh đầu', 'Crown', 'black'], ['cheek', 'Hai má', 'Cheeks', 'black'], ['ear', 'Tai', 'Ear cups', 'black'],
      ['chin', 'Cằm', 'Chin', 'black'], ['bar', 'Thanh chắn mặt', 'Face bar', 'black'], ['trim', 'Viền', 'Trim', 'red']],
    spots: [['front', 'Trán', 'Forehead'], ['cheek', 'Má', 'Cheek'], ['back', 'Sau gáy', 'Back']],
  },
};
// font cho tên / chữ (font có sẵn trên máy khách — xem trước gần đúng, thợ làm theo tên font)
const FONTS = [
  ['block', 'Block đậm', 'Bold block', "Impact, 'Arial Black', sans-serif"],
  ['classic', 'Cổ điển (có chân)', 'Classic serif', "Georgia, 'Times New Roman', serif"],
  ['script', 'Chữ ký', 'Script', "'Brush Script MT', 'Segoe Script', cursive"],
  ['college', 'Thể thao (college)', 'College', "'Rockwell', 'Courier New', serif"],
  ['modern', 'Hiện đại', 'Modern', "'Helvetica Neue', Arial, sans-serif"],
  ['mono', 'Kỹ thuật (mono)', 'Mono', "'Courier New', monospace"],
];
const METHODS = [['print', 'In', 'Print'], ['embroid', 'Thêu', 'Embroidered']];

const pick = (list, id) => list.find(x => x[0] === id);
const int = (v, min, max, d = 0) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };
const txt = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const pair = (o, n) => ({ vi: txt(o && o.vi, n), en: txt(o && o.en, n) });
const slug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
const LOGO_URL = /^\/assets\/uploads\/custom\/[a-f0-9]{16,40}\.(png|jpe?g|webp)$/;

// cấu hình mặc định khi chủ shop bật custom cho một sản phẩm
function defaults(template = 'groin') {
  const t = TEMPLATES[template] || TEMPLATES.groin;
  return {
    on: false, template: TEMPLATES[template] ? template : 'groin',
    fee: 0, lead: { vi: '4–6 tuần (làm thủ công theo đơn)', en: '4–6 weeks (handmade to order)' },
    zones: t.zones.map(z => z[0]), palette: PALETTE.map(c => c[0]),
    text: { on: true, max: 14, fee: 0, embroid: 100000, fonts: FONTS.map(f => f[0]) },
    logo: { on: true, fee: 150000, embroid: 100000 },
    groups: template === 'groin' ? [
      { id: 'material', name: { vi: 'Chất liệu', en: 'Material' }, multi: false, required: true, choices: [
        { id: 'pu', name: { vi: 'Da PU cao cấp', en: 'Premium PU leather' }, fee: 0 },
        { id: 'micro', name: { vi: 'Da microfiber', en: 'Microfiber leather' }, fee: 250000 },
        { id: 'cow', name: { vi: 'Da bò thật', en: 'Genuine cowhide' }, fee: 600000 }] },
      { id: 'pad', name: { vi: 'Độ dày đệm', en: 'Padding' }, multi: false, required: true, choices: [
        { id: 'std', name: { vi: 'Tiêu chuẩn', en: 'Standard' }, fee: 0 },
        { id: 'thick', name: { vi: 'Dày (thi đấu)', en: 'Thick (competition)' }, fee: 150000 }] },
      { id: 'closure', name: { vi: 'Kiểu khóa', en: 'Closure' }, multi: false, required: true, choices: [
        { id: 'lace', name: { vi: 'Dây buộc (lace-up)', en: 'Lace-up' }, fee: 0 },
        { id: 'velcro', name: { vi: 'Khóa dán (velcro)', en: 'Velcro' }, fee: 0 },
        { id: 'buckle', name: { vi: 'Khóa cài', en: 'Buckle' }, fee: 80000 }] },
      { id: 'finish', name: { vi: 'Bề mặt', en: 'Finish' }, multi: false, required: true, choices: [
        { id: 'gloss', name: { vi: 'Bóng', en: 'Gloss' }, fee: 0 },
        { id: 'matte', name: { vi: 'Mờ', en: 'Matte' }, fee: 0 }] },
      { id: 'extra', name: { vi: 'Thêm', en: 'Extras' }, multi: true, required: false, choices: [
        { id: 'stitch', name: { vi: 'Chỉ may màu tương phản', en: 'Contrast stitching' }, fee: 50000 },
        { id: 'flag', name: { vi: 'Thêu cờ Việt Nam', en: 'Vietnam flag patch' }, fee: 80000 },
        { id: 'bag', name: { vi: 'Túi đựng riêng', en: 'Carry bag' }, fee: 120000 }] },
    ] : [],
    terms: { vi: 'Sản phẩm thiết kế riêng được làm thủ công theo yêu cầu nên không đổi trả vì lý do cá nhân (vẫn bảo hành lỗi sản xuất). Dapper Combat sẽ gửi bản phác thảo để bạn duyệt trước khi sản xuất.',
      en: 'Custom items are handmade to order, so they cannot be returned for personal reasons (manufacturing defects are still covered). Dapper Combat will send you a mockup to approve before production.' },
  };
}

// làm sạch cấu hình do chủ shop nhập (/admin → Sản phẩm)
function cleanConfig(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const template = TEMPLATES[raw.template] ? raw.template : 'groin', t = TEMPLATES[template], d = defaults(template);
  const tx = raw.text || {}, lg = raw.logo || {};
  const groups = [], seenG = new Set();
  for (const g of (Array.isArray(raw.groups) ? raw.groups : []).slice(0, 10)) {
    const name = pair(g && g.name, 40); if (!name.vi) continue;
    let id = slug(g.id || name.vi) || 'g'; while (seenG.has(id)) id += 'x'; seenG.add(id);
    const seenC = new Set(), choices = [];
    for (const c of (Array.isArray(g.choices) ? g.choices : []).slice(0, 16)) {
      const cn = pair(c && c.name, 60); if (!cn.vi) continue;
      let cid = slug(c.id || cn.vi) || 'c'; while (seenC.has(cid)) cid += 'x'; seenC.add(cid);
      choices.push({ id: cid, name: cn, fee: int(c.fee, 0, 1e8) });
    }
    if (choices.length) groups.push({ id, name, multi: !!g.multi, required: !g.multi && g.required !== false, choices });
  }
  const zones = (Array.isArray(raw.zones) ? raw.zones : d.zones).filter(z => pick(t.zones, z));
  const palette = (Array.isArray(raw.palette) ? raw.palette : d.palette).filter(c => pick(PALETTE, c));
  const fonts = (Array.isArray(tx.fonts) ? tx.fonts : d.text.fonts).filter(f => pick(FONTS, f));
  return {
    on: !!raw.on, template, fee: int(raw.fee, 0, 1e8),
    lead: pair(raw.lead || d.lead, 80),
    zones: zones.length ? zones : d.zones, palette: palette.length >= 2 ? palette : d.palette,
    text: { on: tx.on !== false, max: int(tx.max, 1, 30, 14), fee: int(tx.fee, 0, 1e8), embroid: int(tx.embroid, 0, 1e8), fonts: fonts.length ? fonts : d.text.fonts },
    logo: { on: lg.on !== false, fee: int(lg.fee, 0, 1e8), embroid: int(lg.embroid, 0, 1e8) },
    groups, terms: pair(raw.terms || d.terms, 600),
  };
}

/**
 * Kiểm tra bản thiết kế khách gửi + tính phụ phí (cộng vào giá sản phẩm).
 * raw = { zones: { <vùng>: <màu> }, text: { value, font, method, spot }, logo: { url, method, spot }, groups: { <nhóm>: <lựa chọn> | [<lựa chọn>…] }, note }
 * → { fee, spec (đã làm sạch), lines: [[nhãn, giá trị, phụ phí]] (tiếng Việt, cho đơn hàng / thông báo) } hoặc { error: [vi, en] }
 */
function priceSpec(cfg, raw) {
  if (!cfg || !cfg.on) return { error: ['Sản phẩm này không nhận thiết kế riêng.', 'This product cannot be customised.'] };
  raw = raw && typeof raw === 'object' ? raw : {};
  const t = TEMPLATES[cfg.template] || TEMPLATES.groin;
  const spec = { zones: {}, groups: {} }, lines = [];
  let fee = cfg.fee;
  if (cfg.fee) lines.push(['Phí thiết kế riêng', '', cfg.fee]);
  // màu từng phần: phải thuộc bảng màu cho phép; thiếu → màu mặc định của mẫu (nếu được phép) hoặc màu đầu bảng
  for (const zid of cfg.zones) {
    const z = pick(t.zones, zid), want = String((raw.zones || {})[zid] || '');
    const col = cfg.palette.includes(want) ? want : cfg.palette.includes(z[3]) ? z[3] : cfg.palette[0];
    spec.zones[zid] = col;
    lines.push([z[1], pick(PALETTE, col)[2], 0]);
  }
  // tên / chữ
  const tr = raw.text || {}, value = txt(tr.value, 200);
  // không tự cắt chữ của khách (in sai tên) — báo để khách sửa
  if ([...value].length > cfg.text.max) return { error: ['Chữ in tối đa ' + cfg.text.max + ' ký tự.', 'Text can be at most ' + cfg.text.max + ' characters.'] };
  if (value) {
    if (!cfg.text.on) return { error: ['Sản phẩm này không in / thêu chữ.', 'Text is not available for this product.'] };
    const font = cfg.text.fonts.includes(tr.font) ? tr.font : cfg.text.fonts[0];
    const method = tr.method === 'embroid' ? 'embroid' : 'print', spot = pick(t.spots, tr.spot) ? tr.spot : t.spots[0][0];
    const f = cfg.text.fee + (method === 'embroid' ? cfg.text.embroid : 0);
    spec.text = { value, font, method, spot };
    fee += f;
    lines.push(['Chữ', `“${value}” · ${pick(FONTS, font)[1]} · ${pick(METHODS, method)[1]} · ${pick(t.spots, spot)[1]}`, f]);
  }
  // logo của khách (đã tải lên qua /api/custom/logo)
  const lr = raw.logo || {};
  if (lr.url) {
    if (!cfg.logo.on) return { error: ['Sản phẩm này không nhận logo riêng.', 'Logos are not available for this product.'] };
    if (!LOGO_URL.test(String(lr.url))) return { error: ['Logo chưa tải lên đúng. Vui lòng tải lại logo.', 'The logo upload is invalid. Please upload it again.'] };
    const method = lr.method === 'embroid' ? 'embroid' : 'print', spot = pick(t.spots, lr.spot) ? lr.spot : t.spots[0][0];
    const f = cfg.logo.fee + (method === 'embroid' ? cfg.logo.embroid : 0);
    spec.logo = { url: String(lr.url), method, spot };
    fee += f;
    lines.push(['Logo', `${pick(METHODS, method)[1]} · ${pick(t.spots, spot)[1]} · ${lr.url}`, f]);
  }
  // nhóm tùy chọn thêm
  for (const g of cfg.groups) {
    const want = (raw.groups || {})[g.id];
    const ids = (g.multi ? (Array.isArray(want) ? want : []) : [want]).map(String).filter(id => g.choices.some(c => c.id === id));
    const chosen = [...new Set(ids)];
    if (!chosen.length && g.required) chosen.push(g.choices[0].id);   // nhóm bắt buộc chưa chọn → lựa chọn đầu (thường là tiêu chuẩn, 0đ)
    if (!chosen.length) continue;
    spec.groups[g.id] = g.multi ? chosen : chosen[0];
    for (const id of chosen) { const c = g.choices.find(x => x.id === id); fee += c.fee; lines.push([g.name.vi, c.name.vi, c.fee]); }
  }
  const note = txt(raw.note, 300);
  if (note) { spec.note = note; lines.push(['Ghi chú cho thợ', note, 0]); }
  spec.template = cfg.template;
  return { fee, spec, lines };
}

// cho trang Shop (window.__CMS.cx): định nghĩa dùng chung để vẽ trình thiết kế
function publicDefs() {
  return { palette: PALETTE, templates: TEMPLATES, fonts: FONTS, methods: METHODS };
}

module.exports = { PALETTE, TEMPLATES, FONTS, METHODS, LOGO_URL, defaults, cleanConfig, priceSpec, publicDefs };
