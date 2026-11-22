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
    // [mã, Việt, Anh, màu mặc định, mặt (front / back / straps — trình thiết kế xoay hình 3D tới mặt đó)]
    zones: [
      ['left', 'Nửa trái (thân + cup)', 'Left half (panel + cup)', 'black', 'front'], ['right', 'Nửa phải (thân + cup)', 'Right half (panel + cup)', 'black', 'front'],
      ['belt', 'Viền cuộn mép trên', 'Rolled top rim', 'black', 'front'], ['panel', 'Miếng logo', 'Logo patch', 'white', 'front'],
      ['trim', 'Viền bọc mép', 'Edge piping', 'red', 'front'], ['thread', 'Chỉ may', 'Stitching thread', 'red', 'front'],
      ['elastic', 'Đai thun lưng', 'Elastic waistband', 'black', 'back'], ['side', 'Ốp hông 2 bên', 'Side panels', 'black', 'back'],
      ['lacepanel', 'Bản xỏ dây / bản khóa', 'Lacing / closure panel', 'red', 'back'], ['lace', 'Dây buộc', 'Laces', 'white', 'back'],
      ['eyelet', 'Khoen xỏ dây & khóa kim loại', 'Eyelets & metal hardware', 'silver', 'back'], ['lining', 'Lót trong', 'Inner lining', 'black', 'back'],
      ['strap', 'Dây thun đùi', 'Leg straps', 'black', 'straps'], ['tab', 'Miếng nối dây đùi', 'Strap joining tab', 'red', 'straps']],
    spots: [['cup', 'Miếng logo giữa', 'Centre patch'], ['belt', 'Viền đai trên', 'Top band'], ['left', 'Thân trái', 'Left panel'], ['right', 'Thân phải', 'Right panel'],
      ['tip', 'Giữa cup', 'Cup'], ['backL', 'Đai sau – bên trái', 'Back band – left'], ['backR', 'Đai sau – bên phải', 'Back band – right']],
  },
  gloves: {
    vi: 'Găng tay', en: 'Gloves',
    zones: [['top', 'Mu bàn tay', 'Back of hand', 'black'], ['palm', 'Lòng bàn tay', 'Palm', 'black'], ['thumb', 'Ngón cái', 'Thumb', 'black'],
      ['cuff', 'Cổ tay', 'Cuff', 'black'], ['trim', 'Viền', 'Trim', 'red'], ['lace', 'Dây buộc / khóa', 'Laces / strap', 'white']],
    spots: [['top', 'Mu bàn tay', 'Back of hand'], ['cuff', 'Cổ tay', 'Cuff'], ['thumb', 'Ngón cái', 'Thumb']],
  },
  // dây dán chuyển đổi cho găng buộc dây (kiểu Lace N Loop): loop có khoen giữ đầu dây → đoạn thun → hook → tab kéo
  strap: {
    vi: 'Dây dán găng (Lace N Loop)', en: 'Lace-up glove strap (Lace N Loop)',
    zones: [
      ['hook', 'Đầu dán + mặt in logo', 'Hook end (print side)', 'black', 'outer'], ['loop', 'Thân dây (mặt loop)', 'Loop body', 'black', 'outer'],
      ['elastic', 'Đoạn thun co giãn', 'Stretch section', 'black', 'outer'], ['grip', 'Tab kéo', 'Pull tab', 'red', 'outer'],
      ['edge', 'Viền mép', 'Edge binding', 'black', 'outer'], ['thread', 'Chỉ may', 'Stitching', 'white', 'outer'],
      ['cover', 'Lót êm mặt trong', 'Soft inner cover', 'black', 'inner'], ['eyelet', 'Khoen kim loại', 'Metal eyelet', 'silver', 'inner']],
    spots: [['hook', 'Đầu dán (mặt ngoài)', 'Hook end'], ['loop', 'Thân dây', 'Strap body'], ['grip', 'Tab kéo', 'Pull tab']],
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
    fee: 0, lead: template === 'strap' ? { vi: '2–3 tuần (làm theo đơn)', en: '2–3 weeks (made to order)' } : { vi: '4–6 tuần (làm thủ công theo đơn)', en: '4–6 weeks (handmade to order)' },
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
    ] : template === 'strap' ? [
      { id: 'length', name: { vi: 'Độ dài', en: 'Length' }, multi: false, required: true, choices: [
        { id: 'std', name: { vi: 'Tiêu chuẩn (găng 8–14oz)', en: 'Standard (8–14oz gloves)' }, fee: 0 },
        { id: 'long', name: { vi: 'Dài (găng 16oz trở lên)', en: 'Long (16oz+ gloves)' }, fee: 20000 }] },
      { id: 'width', name: { vi: 'Bản dây', en: 'Width' }, multi: false, required: true, choices: [
        { id: 'w32', name: { vi: '3,2 cm (tiêu chuẩn)', en: '3.2 cm (standard)' }, fee: 0 },
        { id: 'w38', name: { vi: '3,8 cm (bản to, ôm chắc)', en: '3.8 cm (wide grip)' }, fee: 30000 }] },
      { id: 'extra', name: { vi: 'Thêm', en: 'Extras' }, multi: true, required: false, choices: [
        { id: 'laces', name: { vi: '1 đôi dây buộc găng cùng màu', en: 'Matching glove laces (pair)' }, fee: 60000 },
        { id: 'reflect', name: { vi: 'Chỉ phản quang', en: 'Reflective stitching' }, fee: 40000 },
        { id: 'pouch', name: { vi: 'Túi đựng nhỏ', en: 'Carry pouch' }, fee: 50000 }] },
    ] : template === 'gloves' ? [
      { id: 'closure', name: { vi: 'Kiểu quai', en: 'Closure' }, multi: false, required: true, choices: [
        { id: 'lace', name: { vi: 'Dây buộc (Lace-up)', en: 'Lace-up' }, fee: 0 },
        { id: 'loop', name: { vi: 'Quai dán (Hook & Loop)', en: 'Hook & Loop' }, fee: 0 }] },
      { id: 'material', name: { vi: 'Chất liệu', en: 'Material' }, multi: false, required: true, choices: [
        { id: 'pu', name: { vi: 'Da PU cao cấp', en: 'Premium PU leather' }, fee: 0 },
        { id: 'micro', name: { vi: 'Da microfiber', en: 'Microfiber leather' }, fee: 300000 },
        { id: 'cow', name: { vi: 'Da bò thật', en: 'Genuine cowhide' }, fee: 700000 }] },
      { id: 'pad', name: { vi: 'Đệm', en: 'Padding' }, multi: false, required: true, choices: [
        { id: 'std', name: { vi: 'Tiêu chuẩn (tập luyện)', en: 'Standard (training)' }, fee: 0 },
        { id: 'spar', name: { vi: 'Dày (sparring)', en: 'Thick (sparring)' }, fee: 150000 },
        { id: 'fight', name: { vi: 'Mỏng chắc (thi đấu)', en: 'Compact (fight)' }, fee: 150000 }] },
      { id: 'finish', name: { vi: 'Bề mặt', en: 'Finish' }, multi: false, required: true, choices: [
        { id: 'gloss', name: { vi: 'Bóng', en: 'Gloss' }, fee: 0 },
        { id: 'matte', name: { vi: 'Mờ', en: 'Matte' }, fee: 0 }] },
      { id: 'extra', name: { vi: 'Thêm', en: 'Extras' }, multi: true, required: false, choices: [
        { id: 'stitch', name: { vi: 'Chỉ may màu tương phản', en: 'Contrast stitching' }, fee: 50000 },
        { id: 'flag', name: { vi: 'Thêu cờ Việt Nam', en: 'Vietnam flag patch' }, fee: 80000 },
        { id: 'bag', name: { vi: 'Túi đựng găng', en: 'Glove bag' }, fee: 150000 }] },
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
  const model = cleanModel(raw.model);
  return {
    on: !!raw.on, template, fee: int(raw.fee, 0, 1e8),
    lead: pair(raw.lead || d.lead, 80),
    zones: zones.length ? zones : d.zones, palette: palette.length >= 2 ? palette : d.palette,
    text: { on: tx.on !== false, max: int(tx.max, 1, 30, 14), fee: int(tx.fee, 0, 1e8), embroid: int(tx.embroid, 0, 1e8), fonts: fonts.length ? fonts : d.text.fonts },
    logo: { on: lg.on !== false, fee: int(lg.fee, 0, 1e8), embroid: int(lg.embroid, 0, 1e8) },
    groups, terms: pair(raw.terms || d.terms, 600),
    ...(model ? { model } : {}),
  };
}
// mô hình 3D thật (.glb tải lên ở /admin) làm mockup: đường dẫn + chỉnh hướng / vị trí dây
const MODEL_URL = /^\/assets\/uploads\/[a-f0-9]{16}\.glb$/;
function cleanModel(m) {
  if (!m || typeof m !== 'object' || !MODEL_URL.test(String(m.url || ''))) return null;
  const rot = v => [0, 90, 180, 270].includes(Number(v)) ? Number(v) : 0;
  const num = (v, a, b, dflt) => { const n = Number(v); return Number.isFinite(n) ? Math.min(b, Math.max(a, Math.round(n * 1000) / 1000)) : dflt; };
  return { url: String(m.url), rx: rot(m.rx), ry: rot(m.ry), rz: rot(m.rz), flip: !!m.flip, y: num(m.y, 0.02, 0.6, 0.22), fit: num(m.fit, 0.8, 1.4, 1), turn: num(m.turn, -180, 180, 0), tint: !!m.tint };
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

module.exports = { cleanModel, PALETTE, TEMPLATES, FONTS, METHODS, LOGO_URL, defaults, cleanConfig, priceSpec, publicDefs };
