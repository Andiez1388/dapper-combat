/*
 * Thiết lập kinh doanh sửa trong /admin → Thiết lập (lưu ở data/settings.json):
 *   shop    — phí giao hàng, mã giảm giá, sản phẩm ở Trang chủ, nhãn "Mới", bảo hành
 *   course  — học phí (dùng cho form đăng ký + mã QR), lịch tập
 *   brand   — logo, favicon, bản đồ, mục nào hiện trên menu
 *   notify  — kênh báo đơn mới (Telegram / email); mật khẩu chỉ ghi, không bao giờ trả về trình duyệt
 */
const fs = require('fs');
const path = require('path');

const { DATA_DIR } = require('./paths');
const FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULTS = {
  shop: {
    freeShip: 1000000, shipFee: 30000, expressFee: 35000, expressEnabled: true,
    expressHcmOnly: true,   // giao hỏa tốc chỉ nhận địa chỉ TP.HCM
    // thời gian giao (ngày làm việc): tiêu chuẩn stdMin–stdMax, hỏa tốc exp; đặt trước cutoff giờ thì tính từ hôm nay → biến {ship.eta}
    eta: { stdMin: 2, stdMax: 4, exp: 1, cutoff: 15 },
    lowStock: 10,           // còn ≤ số này: admin cảnh báo sắp hết, trang sản phẩm hiện "Chỉ còn X"
    promos: [
      { code: 'DAPPER10', type: 'pct', value: 10, active: true },
      { code: 'GIAM100', type: 'fixed', value: 100000, active: true },
      { code: 'FREESHIP', type: 'freeship', value: 0, active: true },
    ],
    homeProducts: ['p1', 'p3', 'p4', 'p6', 'p7', 'p8'],
    warranty: { gang: 12, ao: 3, phukien: 6, dotap: 3 },   // (cũ) giữ đồng bộ với bảo hành trong categories
    // danh mục sản phẩm theo thứ tự hiện trên Shop; guide = bảng size dùng cho danh mục (ao | dotap | gang | free = không cần bảng size)
    categories: [
      { id: 'gang', name: { vi: 'Găng tay', en: 'Gloves' }, desc: { vi: 'Găng tay tập luyện & thi đấu, đệm nhiều lớp bảo vệ khớp tay.', en: 'Training and fight gloves with multi-layer padding to protect your hands.' },
        material: { vi: 'Da PU / da thật, mút IMF', en: 'PU / genuine leather, IMF foam' }, weight: '~420g', warranty: 12, guide: 'gang', hidden: false },
      { id: 'ao', name: { vi: 'Áo & Hoodie', en: 'Apparel' }, desc: { vi: 'Áo thun, hoodie và tank top cho buổi tập lẫn đời thường.', en: 'Tees, hoodies and tanks for training days and everyday wear.' },
        material: { vi: 'Cotton 100% / vải kỹ thuật', en: '100% cotton / technical fabric' }, weight: '~250g', warranty: 3, guide: 'ao', hidden: false },
      { id: 'phukien', name: { vi: 'Phụ kiện', en: 'Accessories' }, desc: { vi: 'Nón, balo và phụ kiện cho người tập võ.', en: 'Caps, bags and accessories for fighters.' },
        material: { vi: 'Vải bố chống nước / lưới', en: 'Water-resistant canvas / mesh' }, weight: '~300g', warranty: 6, guide: 'free', hidden: false },
      { id: 'dotap', name: { vi: 'Đồ tập', en: 'Training' }, desc: { vi: 'Đồ tập co giãn, thấm hút — tối ưu cho conditioning.', en: 'Stretchy, sweat-wicking training wear built for conditioning.' },
        material: { vi: 'Poly-spandex co giãn 4 chiều', en: '4-way stretch poly-spandex' }, weight: '~200g', warranty: 3, guide: 'dotap', hidden: false },
    ],
    // ô ảnh dẫn tới danh mục, hiện dưới lưới sản phẩm (trang Shop, khi chưa lọc)
    tiles: [
      { cat: 'gang', img: '/assets/media/3ce28cc822e3.jpg', title: { vi: 'Găng tay thi đấu', en: 'Fight gloves' } },
      { cat: 'ao', img: '/assets/media/004df67b4e85.jpg', title: { vi: 'Áo & hoodie tập luyện', en: 'Training tees & hoodies' } },
    ],
    // trang thanh toán: phương thức thanh toán đang nhận; ô email / phường xã / ghi chú: optional | required | hidden
    //   bank / momo / zalopay: quét cùng mã VietQR (app ngân hàng, MoMo, ZaloPay) — SePay tự xác nhận; vnpay: thẻ; installment: trả góp VNPay
    //   (vnpay / installment chỉ hiện khi đã cài ở Thanh toán online)
    checkout: { pay: { bank: true, momo: true, zalopay: true, vnpay: true, installment: true }, email: 'optional', ward: 'optional', note: 'optional' },
    // các phần của trang chi tiết sản phẩm (false = ẩn)
    pdp: { videos: true, trust: true, pay: true, fit: true, stock: true, ship: true, feats: true, set: true, faq: true, article: true, reviews: false, related: true, seen: true, news: true },
  },
  course: {
    foundPrice: 8900000, foundDeposit: 1000000,
    foundStart: '2026-01-02',   // ngày khai giảng Foundation kế tiếp → biến {found.start}
    gt1: 1500000, gt3: 3900000, gt6: 6900000, gt12: 12000000,   // (cũ) giữ đồng bộ với gtPackages cho biến {gt.1}…
    // gói Group Training: số tháng là mã gói; label trống = tự ghi "03 THÁNG" / "3 MONTHS"; best = nhãn "Hời nhất"
    gtPackages: [
      { months: 1, price: 1500000, note: { vi: '3 buổi/tuần', en: '3 sessions/week' }, label: { vi: '', en: '' }, best: false },
      { months: 3, price: 3900000, note: { vi: '3 buổi/tuần', en: '3 sessions/week' }, label: { vi: '', en: '' }, best: false },
      { months: 6, price: 6900000, note: { vi: 'Không giới hạn buổi tập', en: 'Unlimited sessions' }, label: { vi: '', en: '' }, best: false },
      { months: 12, price: 12000000, note: { vi: 'Không giới hạn buổi tập', en: 'Unlimited sessions' }, label: { vi: '', en: '' }, best: true },
    ],
    hssvMonth: 800000, hssvMonths: 3, memMonth: 800000,
    // lịch tập: mỗi hàng = 1 lớp; kind = màu (group | hssv | found | other); days = T2 … CN (1 = có lớp)
    // prog / opt = bấm vào hàng mở form đăng ký chương trình nào (gt | hssv | found | mem | pt | trial | '' = không mở), lớp / khung giờ nào
    scheduleRows: [
      { time: '06:00 – 07:30', name: { vi: 'Group Training', en: 'Group Training' }, sub: { vi: 'Cộng đồng', en: 'Community' }, kind: 'group', days: [1, 1, 1, 1, 1, 1, 0], prog: 'gt', opt: 'am' },
      { time: '17:00 – 18:30', name: { vi: 'HSSV', en: 'Student' }, sub: { vi: 'Học sinh – Sinh viên', en: 'Students' }, kind: 'hssv', days: [0, 1, 0, 1, 0, 1, 0], prog: 'hssv', opt: '' },
      { time: '18:30 – 20:00', name: { vi: 'Group Training', en: 'Group Training' }, sub: { vi: 'Cộng đồng', en: 'Community' }, kind: 'group', days: [1, 1, 1, 1, 1, 1, 0], prog: 'gt', opt: 'pm' },
      { time: '20:00 – 21:30', name: { vi: 'Foundation 01 – A', en: 'Foundation 01 – A' }, sub: { vi: 'T2 · T4 · T6', en: 'Mon · Wed · Fri' }, kind: 'found', days: [1, 0, 1, 0, 1, 0, 0], prog: 'found', opt: 'A' },
      { time: '20:00 – 21:30', name: { vi: 'Foundation 01 – B', en: 'Foundation 01 – B' }, sub: { vi: 'T3 · T5 · T7', en: 'Tue · Thu · Sat' }, kind: 'found', days: [0, 1, 0, 1, 0, 1, 0], prog: 'found', opt: 'B' },
    ],
  },
  // nav: mục nào hiện trên menu trên cùng + menu điện thoại (tắt = ẩn mục đó, trang vẫn còn)
  brand: { logo: '', favicon: '', mapQuery: '', nav: { home: true, shop: true, course: true, services: false } },
  notify: {
    siteUrl: '', telegramToken: '', telegramChat: '', smtpHost: '', smtpPort: 465, smtpSecure: true, smtpUser: '', smtpPass: '', mailFrom: '', notifyEmail: '',
    // mẫu tin báo cho chủ shop: {biến} được điền khi gửi; dòng có biến trống bị bỏ; "Nhãn: {biến}" → nhãn thường, giá trị in đậm
    templates: {
      order: { on: true, title: '🥊 Đơn hàng mới {code} — {total}', body: 'Khách: {name}\nSĐT: {phone}\nEmail: {email}\nĐịa chỉ: {address}\nSản phẩm: {items}\nTạm tính: {subtotal}\nGiảm giá: {discount}\nPhí giao: {shipping}\nThanh toán: {pay}\nGiao hàng: {ship}\nGhi chú: {note}' },
      registration: { on: true, title: '📋 Đăng ký khóa học {code}', body: 'Học viên: {name}\nSĐT: {phone}\nEmail: {email}\nChương trình: {program}\nChi tiết: {detail}\nHọc phí: {total}\nThanh toán: {pay}\nNgày muốn bắt đầu: {date}\nGhi chú: {note}' },
      consult: { on: true, title: '🏗️ Yêu cầu tư vấn setup {code}', body: 'Khách: {name}\nSĐT: {phone}\nTỉnh/TP: {city}\nLoại hình: {type}\nDiện tích: {area}\nDịch vụ: {services}\nNgân sách: {budget}\nGhi chú: {note}' },
    },
    // email xác nhận gửi cho khách (khi khách có nhập email và đã cài SMTP)
    customer: {
      order: { on: false, subject: 'Dapper Combat đã nhận đơn hàng {code}', body: 'Chào {name},\n\nCảm ơn bạn đã đặt hàng tại Dapper Combat. Đơn {code} đã được ghi nhận, chúng tôi sẽ gọi số {phone} để xác nhận trong giờ làm việc.\n\nSản phẩm: {items}\nTổng cộng: {total}\nThanh toán: {pay}\nGiao đến: {address}\nXem / tải phiếu xác nhận: {slip}\n\nDapper Combat',
        // khách đặt bằng tiếng Anh nhận bản này (AI dịch lại khi mẫu tiếng Việt đổi)
        subjectEn: 'Dapper Combat received your order {code}', bodyEn: 'Hi {name},\n\nThank you for shopping at Dapper Combat. Your order {code} has been received — we will call {phone} to confirm it during business hours.\n\nItems: {items}\nTotal: {total}\nPayment: {pay}\nDeliver to: {address}\nView / download your confirmation: {slip}\n\nDapper Combat' },
      registration: { on: false, subject: 'Dapper Combat đã nhận đăng ký {code}', body: 'Chào {name},\n\nCảm ơn bạn đã đăng ký {program}. Mã đăng ký của bạn là {code}. Huấn luyện viên sẽ liên hệ số {phone} để xác nhận lịch học.\n\nHọc phí: {total}\nThanh toán: {pay}\nXem / tải phiếu xác nhận: {slip}\n\nDapper Combat',
        subjectEn: 'Dapper Combat received your registration {code}', bodyEn: 'Hi {name},\n\nThank you for registering for {program}. Your registration code is {code}. Our coach will contact you at {phone} to confirm your schedule.\n\nFee: {total}\nPayment: {pay}\nView / download your confirmation: {slip}\n\nDapper Combat' },
    },
  },
  // tiếng Anh tự dịch bằng AI khi lưu nội dung tiếng Việt (lib/translate.js); apiKey chỉ ghi, không trả về trình duyệt
  ai: { enabled: true, apiKey: '' },
  // thanh toán online (lib/payments.js) — sandbox = môi trường thử của cổng; khóa bí mật (apiKey / hashSecret / password / secretKey…) chỉ ghi
  //   installment: trả góp VNPay — apiUrl = địa chỉ API trả góp (mặc định môi trường thử; VNPay gửi địa chỉ thật khi ký hợp đồng),
  //   minAmount = số tiền tối thiểu được chọn trả góp
  pay: {
    sepay: { enabled: false, apiKey: '' },
    vnpay: { enabled: false, sandbox: true, tmnCode: '', hashSecret: '' },
    installment: { enabled: false, apiUrl: 'https://sandbox.vnpayment.vn/isp-svc', tmnCode: '', clientId: '', username: '', password: '', clientSecret: '', secretKey: '', minAmount: 3000000 },
  },
};
const PDP_KEYS = Object.keys(DEFAULTS.shop.pdp);
const KINDS = ['group', 'hssv', 'found', 'other'];
const PROGS = ['gt', 'hssv', 'found', 'mem', 'pt', 'trial', ''];
const SECRET = ['telegramToken', 'smtpPass'];
const PAY_FIELDS = { sepay: { plain: [], secret: ['apiKey'] }, vnpay: { plain: ['tmnCode'], secret: ['hashSecret'] },
  installment: { plain: ['tmnCode', 'clientId', 'username'], secret: ['password', 'clientSecret', 'secretKey'] } };
const PAY_KEYS = Object.keys(DEFAULTS.shop.checkout.pay);

let cache = null, mtime = -1;
function load() {
  const m = fs.existsSync(FILE) ? fs.statSync(FILE).mtimeMs : 0;
  if (cache && m === mtime) return cache;
  let saved = {};
  try { if (m) saved = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) {
    // file hỏng (thường do sửa tay): cất sang bên cạnh để lần lưu sau không đè mất, tạm dùng mặc định
    const bad = FILE + '.hong-' + Date.now();
    try { fs.renameSync(FILE, bad); } catch { /* bỏ qua */ }
    console.error(`[thiết lập] settings.json bị hỏng (${e.message}) — đã cất ở ${path.basename(bad)}, tạm dùng mặc định`);
    saved = {};
  }
  const out = {};
  for (const g of Object.keys(DEFAULTS)) out[g] = { ...DEFAULTS[g], ...(saved[g] || {}) };
  // bản lưu cũ: lịch 5×7 và giá gt1…gt12 → chuyển sang scheduleRows / gtPackages
  const sc = saved.course || {};
  if (Array.isArray(sc.schedule) && !sc.scheduleRows) out.course.scheduleRows = DEFAULTS.course.scheduleRows.map((r, i) => ({ ...r, days: (sc.schedule[i] || r.days).map(d => (d ? 1 : 0)) }));
  if (!sc.gtPackages) out.course.gtPackages = DEFAULTS.course.gtPackages.map(p => ({ ...p, price: out.course['gt' + p.months] != null ? out.course['gt' + p.months] : p.price }));
  delete out.course.schedule;
  for (const k of ['templates', 'customer']) {
    const sv = (saved.notify || {})[k] || {};
    out.notify[k] = { ...DEFAULTS.notify[k], ...sv };
    for (const t of Object.keys(DEFAULTS.notify[k])) if (sv[t]) out.notify[k][t] = { ...DEFAULTS.notify[k][t], ...sv[t] };
  }
  out.shop.checkout = { ...DEFAULTS.shop.checkout, ...((saved.shop || {}).checkout || {}) };
  // bản lưu cũ: chưa có ZaloPay / trả góp, còn COD (đã bỏ) và cổng MoMo riêng (MoMo giờ quét mã VietQR, SePay xác nhận)
  const sp = out.shop.checkout.pay || {};
  out.shop.checkout.pay = Object.fromEntries(PAY_KEYS.map(k => [k, sp[k] !== undefined ? !!sp[k] : true]));
  if (!out.shop.checkout.pay.bank && !out.shop.checkout.pay.momo && !out.shop.checkout.pay.zalopay) out.shop.checkout.pay.bank = true;
  out.brand.nav = { ...DEFAULTS.brand.nav, ...((saved.brand || {}).nav || {}) };
  delete out.pay.momo;
  out.shop.pdp = { ...DEFAULTS.shop.pdp, ...((saved.shop || {}).pdp || {}) };
  out.shop.eta = { ...DEFAULTS.shop.eta, ...((saved.shop || {}).eta || {}) };
  cache = out; mtime = m;
  return out;
}
function all() { return JSON.parse(JSON.stringify(load())); }

const money = v => Math.max(0, Math.min(1e10, Math.round(Number(v) || 0)));
const url = v => { const s = String(v || '').trim(); return /^(\/assets\/(uploads|media|img)\/[\w.-]+|https:\/\/[^\s"'<>]+)$/.test(s) ? s : ''; };
const ids = v => (Array.isArray(v) ? v : []).map(x => String(x).slice(0, 20)).filter(x => /^[\w-]+$/.test(x)).slice(0, 24);
const txt = (v, max) => String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, max);
const pair = (v, max) => ({ vi: txt(v && v.vi, max), en: txt(v && v.en, max) });
const GUIDES = ['ao', 'dotap', 'gang', 'free'];
// mã danh mục đang có (cho kiểm tra sản phẩm)
const categoryIds = () => load().shop.categories.map(c => c.id);

function update(patch) {
  const cur = all(), before = all();
  const s = patch.shop;
  if (s) {
    for (const k of ['freeShip', 'shipFee', 'expressFee']) if (s[k] !== undefined) cur.shop[k] = money(s[k]);
    if (s.expressEnabled !== undefined) cur.shop.expressEnabled = !!s.expressEnabled;
    if (s.expressHcmOnly !== undefined) cur.shop.expressHcmOnly = !!s.expressHcmOnly;
    if (s.lowStock !== undefined) cur.shop.lowStock = Math.max(0, Math.min(1000, Math.round(Number(s.lowStock) || 0)));
    if (s.eta && typeof s.eta === 'object') {
      const d = n => Math.max(0, Math.min(30, Math.round(Number(n) || 0))), e = { ...cur.shop.eta };
      for (const k of ['stdMin', 'stdMax', 'exp']) if (s.eta[k] !== undefined) e[k] = d(s.eta[k]);
      if (s.eta.cutoff !== undefined) e.cutoff = Math.max(0, Math.min(24, Math.round(Number(s.eta.cutoff) || 0)));
      if (e.stdMax < e.stdMin) e.stdMax = e.stdMin;
      cur.shop.eta = e;
    }
    // mã giảm giá: expires = ngày cuối dùng được (YYYY-MM-DD, '' = không hạn); maxUses = số lượt tối đa (0 = không giới hạn); minOrder = tạm tính tối thiểu (0 = không)
    if (Array.isArray(s.promos)) cur.shop.promos = s.promos.slice(0, 50).map(p => ({
      code: String(p.code || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30),
      type: ['pct', 'fixed', 'freeship'].includes(p.type) ? p.type : 'fixed',
      value: p.type === 'pct' ? Math.min(100, Math.max(0, Number(p.value) || 0)) : money(p.value),
      active: p.active !== false,
      expires: /^\d{4}-\d{2}-\d{2}$/.test(String(p.expires || '')) && !isNaN(Date.parse(p.expires)) ? String(p.expires) : '',
      maxUses: Math.max(0, Math.min(1e6, Math.round(Number(p.maxUses) || 0))),
      minOrder: money(p.minOrder),
    })).filter(p => p.code);
    if (s.homeProducts) cur.shop.homeProducts = ids(s.homeProducts);
    if (s.warranty && typeof s.warranty === 'object') for (const [k, v] of Object.entries(s.warranty)) if (/^[\w-]{1,20}$/.test(k)) cur.shop.warranty[k] = Math.max(0, Math.min(120, Math.round(Number(v) || 0)));
    if (Array.isArray(s.categories)) {
      const seen = new Set();
      const list = s.categories.slice(0, 40).map(c => ({
        id: String((c && c.id) || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20),
        name: pair(c.name, 60), desc: pair(c.desc, 300), material: pair(c.material, 120),
        weight: txt(c.weight, 30), warranty: Math.max(0, Math.min(120, Math.round(Number(c.warranty) || 0))),
        guide: GUIDES.includes(c.guide) ? c.guide : 'free', hidden: !!c.hidden,
      })).filter(c => c.id && c.name.vi && !seen.has(c.id) && seen.add(c.id));
      if (list.length) cur.shop.categories = list;
    } else if (s.warranty) for (const c of cur.shop.categories) if (cur.shop.warranty[c.id] != null) c.warranty = cur.shop.warranty[c.id];
    cur.shop.warranty = Object.fromEntries(cur.shop.categories.map(c => [c.id, c.warranty]));
    if (Array.isArray(s.tiles)) cur.shop.tiles = s.tiles.slice(0, 4).map(t => ({ cat: String((t && t.cat) || '').slice(0, 20), img: url(t.img), title: pair(t.title, 80) }))
      .filter(t => t.img && cur.shop.categories.some(c => c.id === t.cat));
    if (s.checkout && typeof s.checkout === 'object') {
      const ck = s.checkout, o = cur.shop.checkout;
      if (ck.pay) for (const k of PAY_KEYS) if (ck.pay[k] !== undefined) o.pay[k] = !!ck.pay[k];
      // luôn còn ít nhất 1 cách quét mã VietQR (thẻ / trả góp chỉ có khi đã cài cổng VNPay)
      if (!o.pay.bank && !o.pay.momo && !o.pay.zalopay) o.pay.bank = true;
      for (const k of ['email', 'ward']) if (['optional', 'required', 'hidden'].includes(ck[k])) o[k] = ck[k];
      if (['optional', 'hidden'].includes(ck.note)) o.note = ck.note;
    }
    if (s.pdp && typeof s.pdp === 'object') for (const k of PDP_KEYS) if (s.pdp[k] !== undefined) cur.shop.pdp[k] = !!s.pdp[k];
  }
  const c = patch.course;
  if (c) {
    for (const k of ['foundPrice', 'foundDeposit', 'gt1', 'gt3', 'gt6', 'gt12', 'hssvMonth', 'memMonth']) if (c[k] !== undefined) cur.course[k] = money(c[k]);
    if (c.foundStart !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(String(c.foundStart)) && !isNaN(Date.parse(c.foundStart))) cur.course.foundStart = String(c.foundStart);
    if (c.hssvMonths !== undefined) cur.course.hssvMonths = Math.max(1, Math.min(24, Math.round(Number(c.hssvMonths) || 1)));
    if (Array.isArray(c.gtPackages)) {
      const seen = new Set();
      const list = c.gtPackages.slice(0, 8).map(p => ({
        months: Math.max(1, Math.min(60, Math.round(Number(p && p.months) || 0))), price: money(p && p.price),
        note: pair(p && p.note, 80), label: pair(p && p.label, 30), best: !!(p && p.best),
      })).filter(p => p.months && p.price && !seen.has(p.months) && seen.add(p.months));
      if (list.length) cur.course.gtPackages = list;
    } else for (const m of [1, 3, 6, 12]) if (c['gt' + m] !== undefined) { const p = cur.course.gtPackages.find(x => x.months === m); if (p) p.price = cur.course['gt' + m]; }
    for (const p of cur.course.gtPackages) if ([1, 3, 6, 12].includes(p.months)) cur.course['gt' + p.months] = p.price;
    if (Array.isArray(c.scheduleRows)) cur.course.scheduleRows = c.scheduleRows.slice(0, 20).map(r => ({
      time: txt(r && r.time, 40), name: pair(r && r.name, 60), sub: pair(r && r.sub, 80),
      kind: KINDS.includes(r && r.kind) ? r.kind : 'other',
      days: [0, 1, 2, 3, 4, 5, 6].map(i => (r && Array.isArray(r.days) && r.days[i] ? 1 : 0)),
      prog: PROGS.includes(r && r.prog) ? r.prog : '', opt: txt(r && r.opt, 10).replace(/[^\w-]/g, ''),
    })).filter(r => r.time || r.name.vi);
  }
  const b = patch.brand;
  if (b) {
    for (const k of ['logo', 'favicon']) if (b[k] !== undefined) cur.brand[k] = b[k] ? url(b[k]) : '';
    if (b.mapQuery !== undefined) cur.brand.mapQuery = String(b.mapQuery || '').replace(/[<>"]/g, '').trim().slice(0, 200);
    if (b.nav && typeof b.nav === 'object') for (const k of Object.keys(DEFAULTS.brand.nav)) if (b.nav[k] !== undefined) cur.brand.nav[k] = !!b.nav[k];
  }
  const n = patch.notify;
  if (n) {
    for (const k of ['siteUrl', 'telegramChat', 'smtpHost', 'smtpUser', 'mailFrom', 'notifyEmail']) if (n[k] !== undefined) cur.notify[k] = String(n[k] || '').replace(/[<>"\s]/g, '').slice(0, 200);
    if (n.siteUrl !== undefined && cur.notify.siteUrl && !/^https?:\/\//.test(cur.notify.siteUrl)) cur.notify.siteUrl = '';
    if (n.smtpPort !== undefined) cur.notify.smtpPort = Math.max(1, Math.min(65535, Math.round(Number(n.smtpPort) || 465)));
    if (n.smtpSecure !== undefined) cur.notify.smtpSecure = !!n.smtpSecure;
    // mật khẩu / token: chuỗi rỗng = giữ nguyên, null = xóa
    for (const k of SECRET) if (n[k] === null) cur.notify[k] = ''; else if (typeof n[k] === 'string' && n[k].trim()) cur.notify[k] = n[k].trim().slice(0, 300);
    // mẫu tin: null = về mẫu gốc
    const tpl = (v, def, a, b) => (v === null ? { ...def } : { on: v.on !== undefined ? !!v.on : def.on, [a]: String(v[a] != null ? v[a] : def[a]).slice(0, 200), [b]: String(v[b] != null ? v[b] : def[b]).slice(0, 4000) });
    if (n.templates) for (const k of Object.keys(DEFAULTS.notify.templates)) if (n.templates[k] !== undefined) cur.notify.templates[k] = tpl(n.templates[k], { ...DEFAULTS.notify.templates[k], ...(n.templates[k] ? cur.notify.templates[k] : {}) }, 'title', 'body');
    if (n.customer) for (const k of Object.keys(DEFAULTS.notify.customer)) if (n.customer[k] !== undefined) {
      const prev = { ...DEFAULTS.notify.customer[k], ...(n.customer[k] ? cur.notify.customer[k] : {}) }, v = n.customer[k];
      const t = tpl(v, prev, 'subject', 'body');
      // bản tiếng Anh: sửa tay thì lấy, không thì giữ bản đang có (AI dịch lại nếu tiếng Việt đổi — staleEn)
      for (const [a, max] of [['subjectEn', 200], ['bodyEn', 4000]]) t[a] = String(v && v[a] != null ? v[a] : prev[a] || '').slice(0, max);
      cur.notify.customer[k] = t;
    }
  }
  const pp = patch.pay;
  if (pp && typeof pp === 'object') {
    const field = v => String(v == null ? '' : v).replace(/[<>"\s]/g, '').slice(0, 120);
    for (const [prov, keys] of Object.entries(PAY_FIELDS)) {
      const v = pp[prov]; if (!v || typeof v !== 'object') continue;
      const o = cur.pay[prov] = { ...DEFAULTS.pay[prov], ...(cur.pay[prov] || {}) };
      for (const b of ['enabled', 'sandbox']) if (v[b] !== undefined && b in o) o[b] = !!v[b];
      for (const k of keys.plain) if (v[k] !== undefined) o[k] = field(v[k]);
      // khóa bí mật: chuỗi rỗng = giữ nguyên, null = xóa (mật khẩu có thể chứa ký tự đặc biệt → chỉ bỏ khoảng trắng đầu / cuối)
      for (const k of keys.secret) if (v[k] === null) o[k] = ''; else if (typeof v[k] === 'string' && v[k].trim()) o[k] = v[k].trim().slice(0, 256);
      // trả góp: địa chỉ API (https; http chỉ cho máy này — bộ kiểm tra tự động), số tiền tối thiểu
      if (prov === 'installment') {
        if (v.apiUrl !== undefined) { const u = String(v.apiUrl || '').trim().replace(/\/+$/, ''); if (/^(https:\/\/[^\s"'<>]+|http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/[^\s"'<>]*)?)$/.test(u)) o.apiUrl = u.slice(0, 200); }
        if (v.minAmount !== undefined) o.minAmount = money(String(v.minAmount).replace(/\D/g, ''));   // "3.000.000" hay 3000000 đều được
      }
    }
  }
  const a = patch.ai;
  if (a) {
    if (a.enabled !== undefined) cur.ai.enabled = !!a.enabled;
    if (a.apiKey === null) cur.ai.apiKey = ''; else if (typeof a.apiKey === 'string' && a.apiKey.trim()) cur.ai.apiKey = a.apiKey.trim().slice(0, 300);
  }
  // tiếng Việt đổi mà tiếng Anh giữ nguyên → bản dịch cũ không còn đúng: xóa, dịch lại nền
  const redo = staleEn(before, cur);
  writeAll(cur);
  if (redo.length) require('./translate').queue('settings', redo);
  return forAdmin();
}
function writeAll(cur) {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cur, null, 1));
  fs.renameSync(tmp, FILE);
  cache = null;
}

/* ─── Chữ 2 thứ tiếng trong thiết lập: tiếng Anh do AI dịch ─────────────────── */
// mọi cặp { vi, en } khách thấy: ref → cặp (danh mục theo mã, các danh sách khác theo vị trí)
function pairsOf(s) {
  const out = [];
  for (const c of s.shop.categories || []) for (const f of ['name', 'desc', 'material']) if (c[f]) out.push(['cat:' + c.id + ':' + f, c[f]]);
  (s.shop.tiles || []).forEach((t, i) => t.title && out.push(['tile:' + i + ':title', t.title]));
  (s.course.gtPackages || []).forEach((p, i) => { for (const f of ['note', 'label']) if (p[f]) out.push(['pkg:' + i + ':' + f, p[f]]); });
  (s.course.scheduleRows || []).forEach((r, i) => { for (const f of ['name', 'sub']) if (r[f]) out.push(['row:' + i + ':' + f, r[f]]); });
  // mẫu email xác nhận cho khách: tiêu đề + nội dung (tiếng Anh nằm ở subjectEn / bodyEn)
  for (const [k, t] of Object.entries((s.notify && s.notify.customer) || {})) for (const [a, b] of [['subject', 'subjectEn'], ['body', 'bodyEn']]) {
    out.push(['mail:' + k + ':' + a, { get vi() { return t[a] || ''; }, get en() { return t[b] || ''; }, set en(v) { t[b] = v; } }]);
  }
  return out;
}
function staleEn(before, cur) {
  const old = new Map(pairsOf(before)), redo = [];
  for (const [ref, p] of pairsOf(cur)) {
    if (!p.vi) continue;
    const o = old.get(ref);
    if (o && o.vi !== p.vi && o.en === p.en) p.en = '';
    if (!p.en) redo.push(ref);
  }
  return redo;
}
require('./translate').register('settings', {
  collect(refs) {
    const want = refs && new Set(refs);
    return pairsOf(all()).filter(([ref, p]) => p.vi && !p.en && (!want || want.has(ref))).map(([ref, p]) => ({ ref, vi: p.vi }));
  },
  apply(results) {
    const cur = all(), by = new Map(pairsOf(cur));
    let n = 0;
    for (const r of results) { const p = by.get(r.ref); if (p && p.vi === r.vi && !p.en) { p.en = txt(r.en, /^mail:.*:body$/.test(r.ref) ? 4000 : 300); n++; } }
    if (n) writeAll(cur);
  },
});

// cho trang quản trị: không trả mật khẩu, chỉ báo đã cài hay chưa; mỗi mã giảm giá kèm số lượt đã dùng (used)
function forAdmin() {
  const s = all(), used = promoUsage();
  for (const k of SECRET) { s.notify[k + 'Set'] = !!s.notify[k]; s.notify[k] = ''; }
  s.ai.apiKeySet = !!s.ai.apiKey; s.ai.apiKey = '';
  for (const [prov, keys] of Object.entries(PAY_FIELDS)) for (const k of keys.secret) { s.pay[prov][k + 'Set'] = !!s.pay[prov][k]; s.pay[prov][k] = ''; }
  s.shop.promos = s.shop.promos.map(p => ({ expires: '', maxUses: 0, minOrder: 0, ...p, used: used[p.code] || 0 }));
  return { ...s, defaults: DEFAULTS, tokens: tokens('vi') };   // tokens: giá trị biến hiện tại (gợi ý ở mục Chữ trên trang)
}
// cho tài khoản nhân viên: chỉ phần cần cho việc hằng ngày (danh mục, cảnh báo tồn kho, phí giao, học phí) — không mẫu tin, không mã giảm giá
function forStaff() {
  const s = all(), sh = s.shop, c = s.course;
  return {
    staff: true,
    shop: { categories: sh.categories, lowStock: sh.lowStock, shipFee: sh.shipFee, freeShip: sh.freeShip, expressFee: sh.expressFee, expressEnabled: sh.expressEnabled, checkout: { pay: sh.checkout.pay } },
    course: { foundPrice: c.foundPrice, foundDeposit: c.foundDeposit, gtPackages: c.gtPackages, hssvMonth: c.hssvMonth, hssvMonths: c.hssvMonths, memMonth: c.memMonth },
  };
}

/* lượt dùng mã giảm giá: data/promo-usage.json { "MÃ": số lượt } — tách khỏi settings.json để lưu Thiết lập không ghi đè số lượt */
const USAGE = path.join(DATA_DIR, 'promo-usage.json');
function promoUsage() { try { const u = JSON.parse(fs.readFileSync(USAGE, 'utf8')); return u && typeof u === 'object' && !Array.isArray(u) ? u : {}; } catch { return {}; } }
const promoUsed = code => promoUsage()[code] || 0;
function bumpPromo(code, d) {
  if (!code) return;
  const u = promoUsage();
  u[code] = Math.max(0, (u[code] || 0) + d);
  const tmp = USAGE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(u, null, 1));
  fs.renameSync(tmp, USAGE);
}
// cho trang công khai (window.__CMS.s)
// mã giảm giá không gửi ra trình duyệt (khách kiểm tra mã qua POST /api/promo)
// payOnline: cổng thanh toán online đang dùng được (không kèm khóa)
function forPublic() { const s = all(); delete s.notify; delete s.shop.promos; delete s.ai; delete s.pay; s.shop.payOnline = require('./payments').online(); return s; }

/*
 * Biến giá dùng trong chữ: {found.price}, {gt.12.mo}, {ship.free}, {promo.codes}…
 * → tự điền theo thiết lập (1.000.000 cho tiếng Việt, 1,000,000 cho tiếng Anh). site.js có bản giống hệt cho trình duyệt.
 */
const TOKEN_RE = /\{((?:found|gt|hssv|mem|ship|promo|hours|sched)\.[A-Za-z0-9.-]+)\}/g;
const DAYS = { vi: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
const HOURS_DAYS = { '1-6': ['Thứ 2 – Thứ 7', 'Mon – Sat'], '0-6': ['Thứ 2 – Chủ nhật', 'Mon – Sun'], '1-5': ['Thứ 2 – Thứ 6', 'Mon – Fri'], '1-6,0': ['Thứ 2 – Chủ nhật', 'Mon – Sun'] };
// ngày có lớp (T2…CN): ≥ 3 ngày liền nhau → "T2 – T7", còn lại "T2 · T4 · T6"
function daysText(days, lang) {
  const names = DAYS[lang === 'en' ? 'en' : 'vi'], on = [0, 1, 2, 3, 4, 5, 6].filter(i => days && days[i]);
  if (on.length >= 3 && on[on.length - 1] - on[0] === on.length - 1) return names[on[0]] + ' – ' + names[on[on.length - 1]];
  return on.map(i => names[i]).join(' · ');
}
function tokens(lang, s = load()) {
  const c = s.course, sh = s.shop, en = lang === 'en';
  const f = n => Math.round(n).toLocaleString(en ? 'en-US' : 'vi-VN');
  const eta = sh.eta || DEFAULTS.shop.eta;
  const t = {
    'found.price': f(c.foundPrice), 'found.deposit': f(c.foundDeposit),
    'hssv.month': f(c.hssvMonth), 'hssv.months': String(c.hssvMonths), 'hssv.price': f(c.hssvMonth * c.hssvMonths), 'mem.price': f(c.memMonth),
    'ship.free': f(sh.freeShip), 'ship.fee': f(sh.shipFee), 'ship.express': f(sh.expressFee),
    'ship.eta': eta.stdMin === eta.stdMax ? String(eta.stdMin) : eta.stdMin + '–' + eta.stdMax, 'ship.eta.exp': String(eta.exp),
    'promo.codes': '',   // (cũ) không còn công khai danh sách mã giảm giá
    'found.start': c.foundStart ? c.foundStart.split('-').reverse().join('.') : '',
  };
  // giờ mở cửa: lấy từ mục Liên hệ (/admin → Liên hệ & mạng xã hội)
  const ct = require('./cms').contactConfig();
  t['hours.open'] = ct.hoursOpen; t['hours.close'] = ct.hoursClose;
  t['hours.days'] = (HOURS_DAYS[ct.hoursDays] || HOURS_DAYS['1-6'])[en ? 1 : 0];
  // lịch tập: {sched.<chương trình>.<lớp/ca>} giờ học, {….days} ngày có lớp (hàng đầu tiên khớp)
  for (const r of c.scheduleRows || []) {
    if (!r.prog) continue;
    const k = 'sched.' + r.prog + (r.opt ? '.' + r.opt : '');
    if (t[k] != null) continue;
    t[k] = r.time; t[k + '.days'] = daysText(r.days, lang);
  }
  // gói Group Training: {gt.<số tháng>} giá gói, {gt.N.mo} giá mỗi tháng, {gt.N.save} tiết kiệm so với gói ngắn nhất, {gt.from} giá/tháng thấp nhất
  let min = Infinity;
  for (const k of gtPackages(c)) {
    t['gt.' + k.months] = f(k.price); t['gt.' + k.months + '.mo'] = f(k.mo); t['gt.' + k.months + '.save'] = f(k.save);
    min = Math.min(min, k.mo);
  }
  t['gt.from'] = f(min === Infinity ? 0 : min);
  return t;
}
// gói kèm giá mỗi tháng (làm tròn nghìn) và tiền tiết kiệm so với gói ít tháng nhất
function gtPackages(c = load().course) {
  const list = c.gtPackages || [];
  const base = list.slice().sort((a, b) => a.months - b.months)[0];
  const perBase = base ? base.price / base.months : 0;
  return list.map(k => ({ ...k, mo: Math.round(k.price / k.months / 1000) * 1000, save: Math.max(0, Math.round(perBase * k.months - k.price)), isBase: k === base }));
}
// biến không còn (vd gói / lớp đã xóa) → để trống thay vì hiện nguyên {…}
function fillTokens(text, lang) { const t = tokens(lang); return String(text).replace(TOKEN_RE, (m, k) => (t[k] != null ? t[k] : '')); }

function stamp() { load(); return mtime; }

module.exports = { stamp, all, update, forAdmin, forStaff, forPublic, tokens, fillTokens, TOKEN_RE, DEFAULTS, categoryIds, gtPackages, promoUsage, promoUsed, bumpPromo };
