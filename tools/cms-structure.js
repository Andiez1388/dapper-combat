/*
 * Cấu trúc trang cho trang quản trị — chạy sau tools/cms-build.js, chạy lại an toàn:
 *   - khối trang (data-cms-block)                → ẩn / đổi thứ tự khu vực trên từng trang
 *   - danh sách lặp lại (thẻ, câu hỏi, nút…)      → thêm / nhân bản / bớt / sắp xếp mục
 *       HTML: data-cms-list="khóa" trên khung, data-cms-item="1…n" trên từng mục
 *       JS:   DC.list("khóa", function ($k) { return [ … DC.x($k("khóa chữ"), …) … ]; })
 *   - số thứ tự 01, 02… trong danh sách (data-cms-num) → server tự đánh lại
 *   - icon SVG (data-cms-icon trong HTML, DC.i("khóa", '<svg…>') trong JS) → thay icon
 *   - liên kết (data-cms-link)                    → đổi đường dẫn của nút / link
 *   - bảng màu đang dùng                          → đổi từng màu
 *   node tools/cms-structure.js
 */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const { parseDocument, DomUtils } = require('htmlparser2');

const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const CAT = path.join(ROOT, 'data', 'seed', 'cms-catalog.json');
const cat = JSON.parse(fs.readFileSync(CAT, 'utf8'));
const fieldBy = new Map(cat.fields.map(f => [f.key, f]));
const read = f => fs.readFileSync(path.join(PUB, f), 'utf8');
const save = (f, s) => fs.writeFileSync(path.join(PUB, f), s);

const PAGES = [
  { id: 'home', html: 'index.html', js: ['home-3.js'] },
  { id: 'shop', html: 'shop.html', js: ['shop-1.js'] },
  { id: 'course', html: 'khoa-hoc.html', js: ['course-1.js'] },
  { id: 'services', html: 'dich-vu-setup.html', js: ['services-1.js'] },
];

/* ─── Sửa markup một lần (chạy lại không đổi gì) ─────────────────────────── */
function newField(f) { // trường mới do công cụ này thêm
  if (fieldBy.has(f.key)) return;
  const sec = cat.sections.find(s => s.id === f.section);
  const o = { page: f.section.split('.')[0], html: /<[a-z]/i.test(f.vi), src: 'html', locate: true, en: null, ...f };
  cat.fields.push(o); fieldBy.set(o.key, o);
  if (!sec) console.warn('  ! thiếu khu vực', f.section);
}
function fixups() {
  // tên thương hiệu cạnh logo trên thanh menu (dùng chung 4 trang)
  if (!cat.sections.find(s => s.id === 'global.brand')) cat.sections.push({ id: 'global.brand', page: 'global', label: 'Tên thương hiệu cạnh logo (thanh menu mọi trang)', order: 0 });
  newField({ key: 'global.brand', section: 'global.brand', page: 'global', type: 'title', label: 'Tên thương hiệu cạnh logo', vi: 'DAPPER COMBAT', mono: true, locate: true });
  // ảnh hiện khi chia sẻ link (Facebook, Zalo…) — og:image, sửa ở mục Hình ảnh của khu vực SEO
  const OG = { home: '/assets/media/3ce28cc822e3.jpg', shop: '/assets/media/bc3dad0ad714.jpg', course: '/assets/media/a331f4b974ac.jpg', services: '/assets/media/ddcc413eb9ca.jpg' };
  for (const p of PAGES) {
    let s = read(p.html);
    s = s.replace(/(<a href="\/" class="nav-logo"[^>]*>\s*<svg[\s\S]*?<\/svg>)\s*DAPPER COMBAT/, '$1 <span data-cms="global.brand">DAPPER COMBAT</span>');
    const key = p.id + '.seo.og';
    if (!s.includes(`data-cms-media="${key}"`)) s = s.replace(/(<meta data-cms="[\w.]+\.seo\.desc" data-cms-attr="content" property="og:description"[^>]*>)/, `$1\n<meta data-cms-media="${key}" property="og:image" content="${OG[p.id]}">`);
    newMedia({ key, section: p.id + '.seo', url: OG[p.id], src: 'html', attr: 'content', label: 'Ảnh khi chia sẻ link (Facebook, Zalo…)', rec: { w: 1200, h: 630, ratio: '1.91:1', maxKB: 300, format: 'JPG' } });
    save(p.html, s);
  }
  // trang báo lỗi 404 (cms-build không quét file này)
  if (!cat.sections.find(s => s.id === 'global.404')) cat.sections.push({ id: 'global.404', page: 'global', label: 'Trang báo lỗi 404 (đường dẫn không tồn tại)', order: 99 });
  [['global.404.title', 'seo', 'Tiêu đề tab trình duyệt', 'Không tìm thấy trang — Dapper Combat'], ['global.404.eyebrow', 'eyebrow', 'Nhãn nhỏ trên tiêu đề', 'Lỗi 404'],
    ['global.404.h', 'title', 'Tiêu đề', 'Trang này đã<br><em>rời sàn đấu.</em>'],
    ['global.404.p', 'text', 'Đoạn văn', 'Đường dẫn bạn mở không tồn tại hoặc đã được chuyển. Chọn một trong các mục dưới đây để tiếp tục.'],
    ['global.404.b1', 'button', 'Nút 1', 'Trang chủ'], ['global.404.b2', 'button', 'Nút 2', 'Shop'], ['global.404.b3', 'button', 'Nút 3', 'Khóa học'], ['global.404.b4', 'button', 'Nút 4', 'Dịch vụ Setup'],
  ].forEach(([key, type, label, vi], i) => newField({ key, section: 'global.404', page: 'global', type, label, vi, mono: true, locate: false, order: i }));
  ['Trang chủ', 'Shop', 'Khóa học', 'Dịch vụ Setup'].forEach((l, i) => newField({ key: 'global.mnav.u' + (i + 1), section: 'global.mnav', page: 'global', type: 'link', label: 'Đường dẫn — ' + l, vi: Object.values(MNAV_URL)[i][1], mono: true, src: 'js', locate: false }));
  let h = read('index.html');
  // khung menu điện thoại cũ (đã thay bằng menu mới trong home-3.js, không còn mở được)
  h = h.replace(/<!-- Mobile Nav -->\s*<div class="mobile-nav-overlay" id="mobileNav">[\s\S]*?<\/ul>\s*<\/div>\s*/, '');
  // 2 nút cuối trang chủ chưa dẫn đi đâu → link thật
  h = h.replace(/<button data-cms="home\.cta\.3" class="btn-white">([\s\S]*?)<\/button>/, '<a data-cms="home.cta.3" href="/khoa-hoc#dang-ky" class="btn-white">$1</a>');
  h = h.replace(/<button data-cms="home\.cta\.4" class="btn-white-ghost">([\s\S]*?)<\/button>/, '<a data-cms="home.cta.4" href="/khoa-hoc#lich-tap" class="btn-white-ghost">$1</a>');
  // chân trang: các dòng chữ thành link thật
  const FOOT_HOME = {
    'home.footer.8': '/shop?cat=ao', 'home.footer.9': '/shop?cat=gang', 'home.footer.10': '/shop?cat=dotap', 'home.footer.11': '/shop?cat=phukien', 'home.footer.12': '/shop',
    'home.footer.14': '/khoa-hoc#foundation', 'home.footer.15': '/khoa-hoc#hoc-phi', 'home.footer.16': '/khoa-hoc#hoc-phi', 'home.footer.17': '/khoa-hoc#hoc-phi', 'home.footer.18': '/khoa-hoc#hoc-phi', 'home.footer.19': '/khoa-hoc',
    'home.footer.21': '/#triet-ly', 'home.footer.22': '/#dia-chi', 'home.footer.23': '/#dia-chi', 'home.footer.24': '/shop', 'home.footer.25': '/#dia-chi',
  };
  h = footLinks(h, FOOT_HOME);
  h = h.replace('<a data-cms="home.community.4" href="#"', '<a data-cms="home.community.4" href="https://facebook.com/dappercombat" target="_blank" rel="noopener"');
  h = h.replace('<a data-cms="home.community.5" href="#"', '<a data-cms="home.community.5" href="https://zalo.me/dappercombat" target="_blank" rel="noopener"');
  h = addIds(h, { 'home.philo': 'triet-ly', 'home.instructor': 'hlv', 'home.courses': 'khoa-hoc', 'home.shop': 'san-pham', 'home.community': 'cong-dong', 'home.reviews': 'danh-gia', 'home.locate': 'dia-chi' });
  save('index.html', h);

  let c = read('khoa-hoc.html');
  c = c.replace('<div class="fwrap-tab" data-i18n="fw.tab">', '<div data-cms="course.fw.tab" class="fwrap-tab" data-i18n="fw.tab">');
  newField({ key: 'course.fw.tab', section: 'course.fbanner', type: 'eyebrow', label: 'Nhãn trên khung Foundation', vi: 'CHƯƠNG TRÌNH ĐẶC BIỆT', en: 'SPECIAL PROGRAM', src: 'html' });
  c = c.replace(/(<span data-cms="course\.fb\.open"[^>]*>[^<]*<\/span>) (02\.01\.2026 · BOOK I — FOUNDATION)<\/p>/, '$1 <span data-cms="course.fb.meta">$2</span></p>');
  newField({ key: 'course.fb.meta', section: 'course.fbanner', type: 'label', label: 'Ngày khai giảng & tên khóa (cạnh chữ KHAI GIẢNG)', vi: '02.01.2026 · BOOK I — FOUNDATION', mono: true });
  const FD = [['12', 'weeks', 'Số tuần'], ['36', 'sessions', 'Số buổi'], ['6', 'cap', 'Số học viên mỗi lớp']];
  for (const [n, k, l] of FD) {
    c = c.replace(`<div class="fd-num">${n}</div><div data-cms="course.fd.${k}"`, `<div data-cms="course.fd.n.${k}" class="fd-num">${n}</div><div data-cms="course.fd.${k}"`);
    newField({ key: `course.fd.n.${k}`, section: 'course.fdetail', type: 'stat', label: l, vi: n, mono: true });
  }
  for (const [n, k, l] of [['02', 'classes', 'Số lớp'], ['12', 'spots', 'Số chỗ']]) {
    c = c.replace(`<div class="fd-num">${n}</div><div data-cms="course.fd.${k}"`, `<div data-cms="course.fd.n.${k}" class="fd-num">${n}</div><div data-cms="course.fd.${k}"`);
    newField({ key: `course.fd.n.${k}`, section: 'course.fdetail', type: 'stat', label: l, vi: n, mono: true });
  }
  const FOOT_COURSE = { 'course.footer.2': '#foundation', 'course.footer.3': '#hoc-phi', 'course.ft.hssv': '#hoc-phi', 'course.footer.4': '#hoc-phi', 'course.ft.pt': '#hoc-phi',
    'course.footer.6': '/#dia-chi', 'course.footer.7': '/#dia-chi', 'course.footer.8': 'tel:0909000000', 'course.footer.9': 'https://zalo.me/dappercombat' };
  c = footLinks(c, FOOT_COURSE);
  c = addIds(c, { 'course.fbanner': 'foundation', 'course.approach': 've-chung-toi', 'course.why': 'vi-sao', 'course.programs': 'chuong-trinh', 'course.gallery': 'khong-gian', 'course.pricing': 'hoc-phi', 'course.schedule': 'lich-tap', 'course.faq': 'hoi-dap', 'course.regproc': 'quy-trinh', 'course.info': 'thong-tin' });
  save('khoa-hoc.html', c);

  let sh = read('shop.html');
  sh = sh.replace('<input id="promoInput" data-ph="promo.ph" placeholder="Mã khuyến mãi">', '<input data-cms="shop.promo.ph" data-cms-attr="placeholder" id="promoInput" data-ph="promo.ph" placeholder="Mã khuyến mãi">');
  newField({ key: 'shop.promo.ph', section: 'shop.checkout', type: 'label', label: 'Chữ mờ trong ô nhập mã giảm giá', vi: 'Mã khuyến mãi', en: 'Promo code', locate: false });
  save('shop.html', sh);
  // danh mục sản phẩm giờ sửa ở /admin → Danh mục sản phẩm (lib/settings.js) → bỏ các ô chữ cũ
  ['shop.cat.gang', 'shop.cat.ao', 'shop.cat.phukien', 'shop.cat.dotap', 'shop.list.j2', 'shop.list.j3', 'shop.list.j4', 'shop.list.j5', 'shop.list.j32',
    'shop.pdp.j34', 'shop.pdp.j37', 'shop.pdp.j38', 'shop.pdp.j39', 'shop.spec.w.gang', 'shop.spec.w.ao', 'shop.spec.w.phukien', 'shop.spec.w.dotap',
    'home.shop.j1', 'home.shop.j2', 'home.shop.j3', 'home.shop.j4'].forEach(dropField);
  // gói Group Training + lịch tập giờ sửa ở /admin → Thiết lập → Học phí & lịch tập (course-site.js vẽ lại thẻ gói, bảng lịch)
  ['course.gt.d1', 'course.gt.d2', 'course.gt.d3', 'course.gt.d4', 'course.pricing.6', 'course.pricing.7', 'course.pricing.8', 'course.pricing.9',
    'course.gt.sv2', 'course.gt.sv3', 'course.gt.sv4', 'course.gt.n12', 'course.gt.n12b', 'course.gt.n36', 'course.gt.n36b',
    'course.drawer.j11', 'course.drawer.j12', 'course.drawer.j13', 'course.drawer.j14',
    'course.schedule.1', 'course.schedule.2', 'course.schedule.3', 'course.schedule.4', 'course.schedule.5',
    'course.scc.group', 'course.scc.groupsub', 'course.scc.hssv', 'course.scc.hssvsub', 'course.scc.group2', 'course.scc.groupsub2',
    'course.scc.fa', 'course.scc.fasub', 'course.scc.fb', 'course.scc.fbsub'].forEach(dropField);
  // phiếu xác nhận cho khách (assets/js/slip.js, trang /phieu/…)
  if (!cat.sections.find(s => s.id === 'global.slip')) cat.sections.push({ id: 'global.slip', page: 'global', label: 'Phiếu xác nhận cho khách (tải ảnh / in) — đơn hàng & đăng ký khóa học', order: 3 });
  [['title.order', 'Tiêu đề phiếu — đơn hàng', 'Phiếu xác nhận đơn hàng', 'Order confirmation'], ['title.reg', 'Tiêu đề phiếu — đăng ký khóa học', 'Phiếu xác nhận đăng ký', 'Registration confirmation'],
    ['code.order', 'Nhãn mã đơn hàng', 'Mã đơn hàng', 'Order no.'], ['code.reg', 'Nhãn mã đăng ký', 'Mã đăng ký', 'Registration no.'], ['date', 'Nhãn thời gian', 'Thời gian', 'Date'],
    ['customer', 'Nhãn khách hàng', 'Khách hàng', 'Customer'], ['phone', 'Nhãn điện thoại', 'Điện thoại', 'Phone'], ['email', 'Nhãn email', 'Email', 'Email'],
    ['address', 'Nhãn địa chỉ giao', 'Giao đến', 'Deliver to'], ['delivery', 'Nhãn cách giao', 'Giao hàng', 'Delivery'],
    ['ship.std', 'Giao tiêu chuẩn', 'Giao tiêu chuẩn ({ship.eta} ngày)', 'Standard delivery ({ship.eta} days)'], ['ship.exp', 'Giao hỏa tốc', 'Hỏa tốc nội thành TP.HCM', 'Same-day in HCMC'],
    ['payment', 'Nhãn thanh toán', 'Thanh toán', 'Payment'], ['pay.cod', 'Tên cách thanh toán COD', 'Thanh toán khi nhận hàng (COD)', 'Cash on delivery (COD)'],
    ['pay.bank', 'Tên cách thanh toán chuyển khoản', 'Chuyển khoản ngân hàng', 'Bank transfer'], ['pay.momo', 'Tên cách thanh toán ví', 'Ví MoMo', 'MoMo e-wallet'],
    ['items', 'Nhãn danh sách sản phẩm', 'Sản phẩm', 'Items'], ['subtotal', 'Nhãn tạm tính', 'Tạm tính', 'Subtotal'], ['discount', 'Nhãn giảm giá', 'Giảm giá', 'Discount'],
    ['shipping', 'Nhãn phí giao', 'Phí giao hàng', 'Shipping'], ['free', 'Chữ khi miễn phí giao', 'Miễn phí', 'Free'], ['total', 'Nhãn tổng cộng', 'Tổng cộng', 'Total'],
    ['program', 'Nhãn chương trình (đăng ký)', 'Chương trình', 'Program'], ['start', 'Nhãn ngày muốn bắt đầu', 'Ngày muốn bắt đầu', 'Preferred start date'],
    ['fee', 'Nhãn học phí', 'Học phí', 'Tuition'], ['due', 'Nhãn số tiền cần thanh toán', 'Cần thanh toán', 'Amount due'],
    ['transfer', 'Tiêu đề khung chuyển khoản', 'Chuyển khoản tới', 'Transfer to'], ['bank', 'Nhãn ngân hàng', 'Ngân hàng', 'Bank'], ['acc', 'Nhãn số tài khoản', 'Số tài khoản', 'Account no.'],
    ['holder', 'Nhãn chủ tài khoản', 'Chủ tài khoản', 'Account name'], ['amount', 'Nhãn số tiền', 'Số tiền', 'Amount'], ['note', 'Nhãn nội dung chuyển khoản', 'Nội dung chuyển khoản', 'Transfer note'],
    ['scan', 'Hướng dẫn quét mã', 'Quét mã bằng app ngân hàng hoặc MoMo để chuyển đúng số tiền và nội dung.', 'Scan with your banking or MoMo app — amount and note are filled in.'],
    ['footer', 'Lời nhắn cuối phiếu', 'Vui lòng giữ phiếu này. Dapper Combat sẽ gọi xác nhận trong giờ làm việc.', 'Please keep this confirmation. Dapper Combat will call to confirm during business hours.'],
    ['contact', 'Nhãn hotline cuối phiếu', 'Hotline', 'Hotline'],
    ['box', 'Lời nhắc trên màn hình đặt hàng / đăng ký thành công', 'Lưu phiếu xác nhận để đối chiếu khi cần.', 'Save your confirmation for reference.'],
    ['btn.download', 'Nút tải phiếu (ảnh)', 'Tải phiếu xác nhận (ảnh)', 'Download confirmation (image)'], ['btn.view', 'Nút xem / in phiếu', 'Xem / in phiếu', 'View / print'],
    ['btn.print', 'Nút in trên trang phiếu', 'In / lưu PDF', 'Print / save as PDF'],
    ['saved', 'Hướng dẫn lưu ảnh khi không tự tải', 'Nhấn giữ ảnh để lưu vào máy nếu trình duyệt không tự tải.', 'Press and hold the image to save it if it did not download.'],
    ['notfound', 'Báo khi link phiếu sai', 'Không tìm thấy phiếu — link có thể đã sai hoặc hết hiệu lực.', 'Confirmation not found — the link may be wrong.'],
  ].forEach(([k, label, vi, en], i) => newField({ key: 'global.slip.' + k, section: 'global.slip', page: 'global', type: /^title/.test(k) ? 'title' : /^btn/.test(k) ? 'button' : /footer|scan|box|saved|notfound/.test(k) ? 'text' : 'label', label, vi, en, src: 'js', locate: false, order: i }));
  newField({ key: 'course.gt.savelab', section: 'course.pricing', page: 'course', type: 'label', label: 'Chữ “Tiết kiệm” trên thẻ gói Group Training (số tiền tự tính)', vi: 'Tiết kiệm', en: 'Save', src: 'js' });
  newField({ key: 'shop.checkout.req.email', section: 'shop.checkout', page: 'shop', type: 'label', label: 'Báo lỗi khi bỏ trống email (khi đặt email là bắt buộc)', vi: 'Vui lòng nhập email', en: 'Please enter your email', src: 'js', locate: false });
  newField({ key: 'shop.checkout.req.ward', section: 'shop.checkout', page: 'shop', type: 'label', label: 'Báo lỗi khi bỏ trống phường / xã (khi đặt là bắt buộc)', vi: 'Vui lòng nhập phường / xã', en: 'Please enter your ward', src: 'js', locate: false });
  // "cách đo" trong bảng size
  const sjs = read('assets/js/shop-1.js'), GUIDE = { ao: 'Áo', dotap: 'Đồ tập', gang: 'Găng' };
  const howVal = (k, side) => (sjs.match(new RegExp(`DC\\.x\\((?:\\$k\\()?"${k.replace(/\./g, '\\.')}"\\)?,${side},"((?:[^"\\\\]|\\\\.)*)"\\)`)) || [])[1];
  for (const m of sjs.matchAll(/"shop\.sizeguide\.how\.(\w+)\.(\d+)\.([td])"\)?,0,/g)) {
    const key = `shop.sizeguide.how.${m[1]}.${m[2]}.${m[3]}`;
    newField({ key, section: 'shop.sizeguide', page: 'shop', type: m[3] === 't' ? 'subtitle' : 'text', src: 'js',
      label: `Cách đo ${GUIDE[m[1]] || m[1]} · bước ${m[2]} — ${m[3] === 't' ? 'tên phần đo' : 'hướng dẫn'}`, vi: JSON.parse('"' + howVal(key, 0) + '"'), en: JSON.parse('"' + howVal(key, 1) + '"') });
  }
  // tên màu sản phẩm (hiện ở trang chi tiết, giỏ hàng, đơn hàng)
  const COL = { red: ['Đỏ', 'Red'], black: ['Đen', 'Black'], white: ['Trắng', 'White'], grey: ['Xám', 'Grey'], navy: ['Xanh navy', 'Navy'], orange: ['Cam', 'Orange'] };
  const shopJs = read('assets/js/shop-1.js');
  for (const [k, [vi, en]] of Object.entries(COL)) {
    const mv = shopJs.match(new RegExp(`DC\\.x\\("shop\\.col\\.${k}",0,"([^"]*)"\\)`)), me = shopJs.match(new RegExp(`DC\\.x\\("shop\\.col\\.${k}",1,"([^"]*)"\\)`));
    newField({ key: 'shop.col.' + k, section: 'shop.pdp', type: 'label', label: 'Tên màu sản phẩm — ' + vi, vi: mv ? mv[1] : vi, en: me ? me[1] : en, src: 'js', locate: false });
  }
  auditFixups();
  audit2Fixups();
  audit3Fixups();
  audit4Fixups();
}
/* ─── Đợt sửa 1 (rà soát trang công khai): chữ mới, chữ mặc định đổi, chữ bỏ ───────────── */
// đổi chữ mặc định của trường đã có (giữ nguyên phần đã sửa trong /admin — nằm ở data/cms.json)
function setDefault(key, vi, en) {
  const f = fieldBy.get(key);
  if (!f) { console.warn('  ! thiếu trường', key); return; }
  if (vi !== undefined) { f.vi = vi; f.html = /<[a-z]/i.test(vi || ''); }
  if (en !== undefined) f.en = en;
}
function auditFixups() {
  const js = (key, section, type, label, vi, en) => newField({ key, section, type, label, vi, en, src: 'js' });
  // hết hàng / tồn kho
  js('shop.stock.out', 'shop.list', 'label', 'Chữ “Hết hàng” trên ảnh và nút sản phẩm (khi tồn kho bằng 0) — dùng cả ở Trang chủ', 'Hết hàng', 'Sold out');
  js('shop.stock.outline', 'shop.pdp', 'text', 'Dòng tồn kho ở trang sản phẩm khi hết hàng', 'Tạm hết hàng — nhắn Dapper Combat để được báo khi có hàng lại', "Sold out — message Dapper Combat to hear when it's back");
  js('shop.stock.max', 'shop.pdp', 'label', 'Nút thêm vào giỏ khi giỏ đã có đủ số lượng còn trong kho', 'Đã đủ số lượng trong giỏ', 'Max quantity in cart');
  js('shop.cart.clamped', 'shop.cart', 'text', 'Lời nhắn khi giỏ hàng được bớt theo số còn trong kho', 'Một số sản phẩm trong giỏ đã được điều chỉnh theo số lượng còn trong kho.', 'Some items in your cart were adjusted to the quantity in stock.');
  js('shop.list.none', 'shop.list', 'text', 'Báo khi chưa có sản phẩm nào (Shop và Trang chủ)', 'Sản phẩm đang được cập nhật. Vui lòng quay lại sau.', 'Products are being updated. Please check back soon.');
  // yêu thích
  js('shop.list.fav', 'shop.list', 'label', 'Bộ lọc “Yêu thích” (số trong ngoặc tự đếm) / nhãn nút tim', 'Yêu thích', 'Favourites');
  js('shop.list.fav.empty', 'shop.list', 'text', 'Báo khi lọc “Yêu thích” mà chưa lưu sản phẩm nào', 'Bạn chưa lưu sản phẩm yêu thích nào. Bấm ♡ trên ảnh sản phẩm để lưu lại.', "You haven't saved any favourites yet. Tap ♡ on a product to save it.");
  js('shop.list.fav.all', 'shop.list', 'button', 'Nút xem tất cả sản phẩm (khi chưa có yêu thích)', 'XEM TẤT CẢ SẢN PHẨM', 'VIEW ALL PRODUCTS');
  js('shop.pdp.fav.on', 'shop.pdp', 'label', 'Chữ cạnh nút tim khi sản phẩm đã nằm trong yêu thích', 'Đã lưu vào yêu thích', 'Saved to favourites');
  // link sản phẩm không còn
  js('shop.notfound', 'shop.list', 'text', 'Báo khi mở link sản phẩm không còn / sai đường dẫn', 'Không tìm thấy sản phẩm này — có thể sản phẩm đã ngừng bán hoặc đường dẫn bị sai.', "We couldn't find that product — it may be discontinued or the link is wrong.");
  // thanh toán
  js('shop.promo.checking', 'shop.checkout', 'label', 'Chữ khi đang kiểm tra mã giảm giá', 'Đang kiểm tra mã…', 'Checking code…');
  js('shop.checkout.exphcm', 'shop.checkout', 'label', 'Ghi chú khi giao hỏa tốc không áp dụng cho tỉnh / thành đã nhập', 'Hỏa tốc chỉ áp dụng trong TP.HCM', 'Express is HCMC only');
  js('shop.checkout.req.note', 'shop.checkout', 'label', 'Báo lỗi khi bỏ trống ghi chú (khi đặt ghi chú là bắt buộc)', 'Vui lòng nhập ghi chú', 'Please enter a note');
  newField({ key: 'shop.checkout.10', section: 'shop.checkout', type: 'label', label: 'Chữ phương thức thanh toán — chuyển khoản (VietQR)', vi: 'VIETQR', src: 'html' });
  // đặt hàng thành công: các bước tiếp theo
  js('shop.success.next', 'shop.success', 'subtitle', 'Tiêu đề các bước tiếp theo', 'Các bước tiếp theo', 'What happens next');
  js('shop.success.step.std', 'shop.success', 'label', 'Bước giao hàng — giao tiêu chuẩn', '2–4 ngày làm việc', '2–4 business days');
  js('shop.success.step.exp', 'shop.success', 'label', 'Bước giao hàng — giao hỏa tốc', 'Hỏa tốc trong TP.HCM', 'Same-day in HCMC');
  // khóa học
  js('course.nav.cart', 'course.nav', 'label', 'Nút giỏ hàng trên thanh menu ({n} = số sản phẩm trong giỏ)', 'GIỎ ({n})', 'CART ({n})');
  js('course.drawer.err.email', 'course.drawer', 'label', 'Báo lỗi email sai định dạng (form đăng ký)', 'Email chưa đúng định dạng', 'Enter a valid email');
  js('course.drawer.err.date', 'course.drawer', 'label', 'Báo lỗi chọn ngày đã qua (form đăng ký)', 'Vui lòng chọn ngày từ hôm nay trở đi', 'Please choose today or a later date');
  // phiếu xác nhận: trạng thái + lỗi tải
  [['st', 'Nhãn trạng thái', 'Trạng thái', 'Status'],
    ['st.new', 'Trạng thái: mới nhận (đơn hàng & đăng ký)', 'Mới nhận', 'Received'], ['st.confirmed', 'Trạng thái đơn: đã xác nhận', 'Đã xác nhận', 'Confirmed'],
    ['st.shipping', 'Trạng thái đơn: đang giao', 'Đang giao', 'Shipping'], ['st.done', 'Trạng thái đơn: hoàn tất', 'Hoàn tất', 'Completed'],
    ['st.cancelled', 'Trạng thái: đã hủy (đơn hàng & đăng ký)', 'Đã hủy', 'Cancelled'], ['st.contacted', 'Trạng thái đăng ký: đã liên hệ', 'Đã liên hệ', 'Contacted'],
    ['st.paid', 'Trạng thái đăng ký: đã thanh toán', 'Đã thanh toán', 'Paid'], ['st.enrolled', 'Trạng thái đăng ký: đã nhập học', 'Đã nhập học', 'Enrolled'],
    ['dlerr', 'Báo khi không tạo / tải được ảnh phiếu', 'Không tạo được ảnh phiếu. Vui lòng thử lại, hoặc dùng nút "Xem / in phiếu".', 'Could not create the confirmation image. Please try again, or use "View / print".'],
    ['neterr', 'Báo khi mất mạng lúc mở phiếu', 'Không tải được phiếu — kiểm tra kết nối mạng rồi thử lại.', 'Could not load the confirmation — check your connection and try again.'],
    ['retry', 'Nút thử lại (trang phiếu)', 'Thử lại', 'Try again'],
  ].forEach(([k, label, vi, en], i) => newField({ key: 'global.slip.' + k, section: 'global.slip', page: 'global', type: /^st\./.test(k) || k === 'st' ? 'label' : k === 'retry' ? 'button' : 'text', label, vi, en, src: 'js', locate: false, order: 40 + i }));

  // chữ mặc định đổi
  setDefault('home.hero.8', 'Foundation khai giảng {found.start}', 'Foundation opens {found.start}');
  setDefault('home.courses.30', undefined, '1-on-1 PT · Personal');
  setDefault('course.programs.4', undefined, 'Student class');
  setDefault('course.programs.8', undefined, '1-on-1 PT · Personal');
  setDefault('course.fb.meta', '{found.start} · BOOK I — FOUNDATION');
  setDefault('course.fdetail.9', '{found.start}');
  setDefault('course.drawer.j86', 'Khai giảng {found.start} · 2 lớp, mỗi lớp tối đa 6 học viên. Starter Kit (áo, bảo vệ răng, handbook) được phát ngày đầu.', 'Starts {found.start} · 2 classes, max 6 students each. Starter Kit (tee, mouthguard, handbook) on day one.');
  setDefault('course.sticky.j1', 'Khai giảng <b>Foundation 01</b> — {found.start} · Học thử miễn phí cho học viên mới', '<b>Foundation 01</b> starts {found.start} · Free trial for new students');
  setDefault('course.sticky.j5', 'Foundation 01 · khai giảng {found.start}', 'Foundation 01 · starts {found.start}');
  setDefault('course.sticky.j6', '2 lớp · {found.price}đ', '2 classes · {found.price}đ');
  setDefault('shop.promo.hint', '', '');
  setDefault('shop.pay.momo', 'Ví MoMo', 'MoMo e-wallet');
  setDefault('shop.success.j9', undefined, 'Confirmation');
  setDefault('shop.success.j10', 'Shop gọi hoặc nhắn Zalo', 'We call or message on Zalo');
  setDefault('shop.success.j11', 'Giao hàng', 'Delivery');
  setDefault('shop.success.j12', 'Nhận hàng', 'Receive your order');
  setDefault('shop.success.j18', 'Mở MoMo, quét mã và giữ nguyên nội dung chuyển khoản. Dapper Combat sẽ kiểm tra giao dịch rồi gọi hoặc nhắn Zalo để xác nhận đơn.', 'Open MoMo, scan the code and keep the transfer note. Dapper Combat will check the payment and confirm your order by phone or Zalo.');
  setDefault('shop.success.j19', 'Mở app ngân hàng, quét mã VietQR và giữ nguyên nội dung chuyển khoản. Dapper Combat sẽ kiểm tra giao dịch rồi gọi hoặc nhắn Zalo để xác nhận đơn.', 'Open your banking app, scan the VietQR code and keep the transfer note. Dapper Combat will check the payment and confirm your order by phone or Zalo.');
  setDefault('global.slip.pay.momo', 'Ví MoMo', 'MoMo e-wallet');
  // trang 404: chữ tiếng Anh (trang có nút VI / EN)
  setDefault('global.404.title', undefined, 'Page not found — Dapper Combat');
  setDefault('global.404.eyebrow', undefined, 'Error 404');
  setDefault('global.404.h', undefined, 'This page has<br><em>left the ring.</em>');
  setDefault('global.404.p', undefined, "The link you opened doesn't exist or has moved. Pick one of the options below to continue.");
  setDefault('global.404.b1', undefined, 'Home');
  setDefault('global.404.b2', undefined, 'Shop');
  setDefault('global.404.b3', undefined, 'Courses');
  setDefault('global.404.b4', undefined, 'Gym Setup');

  // chữ bỏ: logo thẻ / ZaloPay (chỉ nhận COD, chuyển khoản VietQR, MoMo); phần bịa trong đánh giá; "Giữ đơn 24 giờ"
  ['shop.pdp.3', 'shop.pdp.4', 'shop.checkout.5', 'shop.checkout.6', 'shop.checkout.8',
    'shop.pdp.j8', 'shop.pdp.j9', 'shop.pdp.j10', 'shop.pdp.j15', 'shop.pdp.j16', 'shop.pdp.j17', 'shop.pdp.j18', 'shop.pdp.j23',
    'shop.success.j14'].forEach(dropField);
}
/* ─── Đợt sửa 3: phiếu xác nhận — đã thanh toán, đơn vị vận chuyển, mã vận đơn, nhận tại phòng tập ─── */
function audit3Fixups() {
  [['paid', 'Nhãn đã thanh toán (khi đã ghi nhận tiền)', 'Đã thanh toán', 'Paid'], ['carrier', 'Nhãn đơn vị vận chuyển', 'Đơn vị vận chuyển', 'Carrier'],
    ['tracking', 'Nhãn mã vận đơn', 'Mã vận đơn', 'Tracking code'], ['ship.pickup', 'Nhận tại phòng tập (cách giao)', 'Nhận tại phòng tập', 'Pick up at the gym']]
    .forEach(([k, label, vi, en], i) => newField({ key: 'global.slip.' + k, section: 'global.slip', page: 'global', type: 'label', label, vi, en, src: 'js', locate: false, order: 60 + i }));
}
/* ─── Đợt sửa 4: thanh toán online (thẻ ATM / Visa / Mastercard qua VNPay, ví MoMo qua cổng MoMo, tự xác nhận chuyển khoản) ─── */
function audit4Fixups() {
  const f = (key, section, type, label, vi, en, src) => newField({ key, section, type, label, vi, en, src: src || 'js', ...(src === 'html' ? {} : { locate: false }) });
  f('shop.pay.vnpay', 'shop.checkout', 'subtitle', 'Cách thanh toán — thẻ (VNPay): tên (chỉ hiện khi cổng VNPay bật)', 'Thẻ ATM / Visa / Mastercard (VNPay)', 'ATM / Visa / Mastercard card (VNPay)', 'html');
  f('shop.pay.vnpaySub', 'shop.checkout', 'text', 'Cách thanh toán — thẻ (VNPay): dòng mô tả', 'Chuyển sang cổng VNPay để thanh toán an toàn', "You'll be taken to VNPay to pay securely", 'html');
  f('shop.checkout.11', 'shop.checkout', 'label', 'Chữ phương thức thanh toán — thẻ (VNPay)', 'VISA · MASTERCARD · ATM', null, 'html');
  f('shop.pay.momoGo', 'shop.checkout', 'text', 'Cách thanh toán — ví MoMo: dòng mô tả khi cổng MoMo bật (thay cho "Quét mã sau khi đặt")', 'Chuyển sang MoMo để thanh toán (không cần quét mã)', "You'll be taken to MoMo to pay — no QR scan");
  f('shop.success.online', 'shop.success', 'label', 'Tiêu đề khung thanh toán online (đơn trả bằng thẻ / ví MoMo)', 'Thanh toán online', 'Online payment');
  f('shop.success.payerr', 'shop.success', 'text', 'Báo khi chưa mở được cổng thanh toán', 'Chưa mở được cổng thanh toán — bạn có thể thanh toán lại từ phiếu xác nhận.', "We couldn't open the payment gateway — you can pay again from your confirmation.");
  [['pay.vnpay', 'Cách thanh toán — thẻ (VNPay)', 'Thẻ ATM / Visa / Mastercard (VNPay)', 'ATM / Visa / Mastercard card (VNPay)'],
    ['paidvia', 'Nhãn dòng đã thanh toán qua cổng / chuyển khoản', 'Đã thanh toán qua', 'Paid via'],
    ['payonline', 'Tiêu đề khung nút thanh toán online', 'Thanh toán online', 'Pay online'],
    ['paybtn.vnpay', 'Nút thanh toán bằng thẻ (VNPay)', 'Thanh toán bằng thẻ (VNPay)', 'Pay by card (VNPay)'],
    ['paybtn.momo', 'Nút thanh toán bằng ví MoMo', 'Thanh toán bằng ví MoMo', 'Pay with MoMo'],
    ['paygo', 'Màn chờ chuyển sang cổng thanh toán', 'Đang chuyển sang cổng thanh toán…', 'Redirecting to the payment gateway…'],
    ['payfail', 'Báo thanh toán chưa thành công (quay về từ cổng)', 'Thanh toán chưa thành công. Bạn có thể thử lại bằng các nút bên dưới.', "The payment didn't go through. You can try again with the buttons below."],
    ['payerr', 'Báo khi bấm nút thanh toán mà chưa mở được cổng', 'Chưa mở được cổng thanh toán, vui lòng thử lại.', "Couldn't open the payment gateway, please try again."],
    ['payok', 'Báo thanh toán thành công (quay về từ cổng)', 'Thanh toán thành công — cảm ơn bạn!', 'Payment successful — thank you!'],
    ['paywait', 'Báo đang chờ cổng xác nhận thanh toán', 'Đang chờ xác nhận thanh toán…', 'Waiting for payment confirmation…'],
    ['paycancel', 'Báo khách đã hủy thanh toán ở cổng', 'Bạn đã hủy thanh toán.', 'You cancelled the payment.'],
    ['received', 'Thay mã QR khi đã nhận tiền (tự xác nhận / cổng báo về)', '✓ Đã nhận tiền — cảm ơn bạn!', '✓ Payment received — thank you!']]
    .forEach(([k, label, vi, en], i) => newField({ key: 'global.slip.' + k, section: 'global.slip', page: 'global', type: 'label', label, vi, en, src: 'js', locate: false, order: 70 + i }));
}
/* ─── Đợt sửa 2: chân trang sửa được (danh sách, link, nhóm Chính sách), biến giờ / lịch / thời gian giao, SEO tiếng Anh ─── */
function setField(key, props) { const x = fieldBy.get(key); if (x) Object.assign(x, props); else console.warn('  ! thiếu trường', key); }
// đổi một đoạn trong chữ mặc định (cả VI và EN)
function swap(key, from, to, side) {
  const x = fieldBy.get(key); if (!x) { console.warn('  ! thiếu trường', key); return; }
  for (const sd of side ? [side] : ['vi', 'en']) if (typeof x[sd] === 'string') x[sd] = x[sd].split(from).join(to);
}
function sec(id, label, order) { if (!cat.sections.find(x => x.id === id)) cat.sections.push({ id, page: id.split('.')[0], label, order }); }
function audit2Fixups() {
  sec('global.footer', 'Chân trang dùng chung — dòng thông tin doanh nghiệp (tên, MST, email sửa ở Liên hệ & mạng xã hội)', 4);
  sec('global.pgfoot', 'Chân trang của trang phụ (/trang/…)', 5);
  sec('global.misc', 'Thông báo chung (lỗi gửi form, mất mạng)', 6);
  const js = (key, section, type, label, vi, en) => newField({ key, section, type, label, vi, en, src: 'js' });
  const ht = (key, section, type, label, vi, en, extra) => newField({ key, section, type, label, vi, en, src: 'html', ...(extra || {}) });
  js('global.err.send', 'global.misc', 'text', 'Báo lỗi khi gửi không thành công', 'Không gửi được, vui lòng thử lại.', 'Could not send, please try again.');
  js('global.err.net', 'global.misc', 'text', 'Báo mất kết nối mạng', 'Mất kết nối mạng. Kiểm tra mạng rồi thử lại.', 'Network error. Check your connection and try again.');
  js('global.biz.tax', 'global.footer', 'label', 'Nhãn trước mã số thuế ở chân trang', 'MST: ', 'Tax ID: ');
  js('global.mnav.zalo', 'global.mnav', 'label', 'Nút Zalo trong menu điện thoại', 'Zalo', 'Zalo');
  js('global.mnav.fb', 'global.mnav', 'label', 'Nút Facebook trong menu điện thoại', 'Facebook', 'Facebook');
  js('home.float.zalo', 'home.float', 'label', 'Chữ hiện khi rê chuột vào nút Zalo nổi', 'Chat Zalo', 'Chat on Zalo');
  js('home.float.mess', 'home.float', 'label', 'Chữ hiện khi rê chuột vào nút Messenger nổi', 'Messenger', 'Messenger');
  // nhóm "Chính sách" ở mọi chân trang (link tới trang phụ chưa đăng tự ẩn)
  const POL = [['Đổi trả & bảo hành', 'Returns & warranty'], ['Giao hàng & thanh toán', 'Shipping & payment'], ['Chính sách bảo mật', 'Privacy policy'], ['Điều khoản sử dụng', 'Terms of use']];
  for (const [pre, section, head] of [['home.footer', 'home.footer', 'CHÍNH SÁCH'], ['course.footer', 'course.footer', 'CHÍNH SÁCH'], ['shop.footer', 'shop.footer', 'CHÍNH SÁCH'], ['services.footer', 'services.footer', 'Chính sách'], ['global.pgfoot', 'global.pgfoot', null]]) {
    if (head) ht(pre + '.pol', section, 'subtitle', 'Tiêu đề cột Chính sách', head, head === 'CHÍNH SÁCH' ? 'POLICIES' : 'Policies');
    POL.forEach(([vi, en], i) => ht(pre + '.p' + (i + 1), section, 'item', 'Chính sách — ' + vi, vi, en));
  }
  // Shop: chân trang mới
  ht('shop.footer.tag', 'shop.footer', 'text', 'Câu giới thiệu dưới tên thương hiệu', 'Trang bị thi đấu và trang phục tập luyện Dapper Combat — giao hàng toàn quốc.', 'Fight gear and training apparel by Dapper Combat — delivered nationwide.');
  [['h1', 'SHOP', 'SHOP'], ['h2', 'DAPPER COMBAT', 'DAPPER COMBAT']].forEach(([k, vi, en]) => ht('shop.footer.' + k, 'shop.footer', 'subtitle', 'Tiêu đề cột liên kết', vi, en));
  [['l1', 'Tất cả sản phẩm', 'All products'], ['l2', 'Găng tay', 'Gloves'], ['l3', 'Áo & Hoodie', 'Apparel'], ['l4', 'Phụ kiện', 'Accessories'],
    ['l5', 'Trang chủ', 'Home'], ['l6', 'Khóa học Boxing', 'Boxing classes'], ['l7', 'Dịch vụ Setup', 'Gym Setup'], ['l8', 'Liên hệ', 'Contact']].forEach(([k, vi, en]) => ht('shop.footer.' + k, 'shop.footer', 'item', 'Liên kết — ' + vi, vi, en));
  // Dịch vụ: chân trang chuyển từ JS sang HTML (sửa được danh sách, link)
  for (const k of ['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j8', 'j9']) setField('services.footer.' + k, { src: 'html' });
  ht('services.footer.brand', 'services.footer', 'title', 'Tên thương hiệu ở chân trang', 'DAPPER COMBAT', null, { mono: true });
  ht('services.footer.l2', 'services.footer', 'item', 'Liên kết — Shop', 'Shop', 'Shop');
  [['c1', 'Hotline 0909 xxx xxx', 'Hotline 0909 xxx xxx'], ['c2', '30 Đường 128, Phước Long', null], ['c3', 'TP. Thủ Đức, TP. Hồ Chí Minh', null], ['c4', 'Zalo', 'Zalo'], ['c5', 'Facebook', 'Facebook']]
    .forEach(([k, vi, en]) => ht('services.footer.' + k, 'services.footer', 'item', 'Liên hệ — ' + vi, vi, en));
  dropField('services.footer.j7');
  // trang phụ
  ht('global.pgfoot.copy', 'global.pgfoot', 'label', 'Dòng bản quyền', '© Dapper Combat', '© Dapper Combat');
  [['l1', 'Shop', 'Shop'], ['l2', 'Khóa học', 'Courses'], ['l3', 'Dịch vụ Setup', 'Gym Setup']].forEach(([k, vi, en]) => ht('global.pgfoot.' + k, 'global.pgfoot', 'item', 'Liên kết — ' + vi, vi, en));

  // giờ mở cửa / lịch tập / thời gian giao → biến (tự theo Liên hệ và Thiết lập)
  setDefault('home.locate.5', '{hours.days}: {hours.open} – {hours.close}', '{hours.days}: {hours.open} – {hours.close}');
  setDefault('home.courses.19', 'Khung giờ cố định {sched.hssv}, {sched.hssv.days}. Giá ưu đãi cho học sinh, sinh viên.', 'Fixed slot {sched.hssv}, {sched.hssv.days}. Special price for students.');
  const T2 = {
    'course.fd.sc1': ['Lớp A — {sched.found.A.days} · {sched.found.A}', 'Class A — {sched.found.A.days} · {sched.found.A}'],
    'course.fd.sc2': ['Lớp B — {sched.found.B.days} · {sched.found.B}', 'Class B — {sched.found.B.days} · {sched.found.B}'],
    'course.prg.m1': ['Sáng {sched.gt.am} · Tối {sched.gt.pm}', 'Morning {sched.gt.am} · Evening {sched.gt.pm}'],
    'course.prg.m3': ['3 buổi/tuần · {sched.hssv.days}', '3 sessions/week · {sched.hssv.days}'],
    'course.hssv.f2': ['Khung giờ {sched.hssv}', 'Time slot {sched.hssv}'],
    'course.hssv.f3': ['Lịch {sched.hssv.days}', 'Days: {sched.hssv.days}'],
    'course.drawer.j5': ['{sched.found.A.days} — {sched.found.A}', '{sched.found.A.days} — {sched.found.A}'],
    'course.drawer.j7': ['{sched.found.B.days} — {sched.found.B}', '{sched.found.B.days} — {sched.found.B}'],
    'course.drawer.j17': ['{sched.gt.am} · {sched.gt.am.days}', '{sched.gt.am} · {sched.gt.am.days}'],
    'course.drawer.j19': ['{sched.gt.pm} · {sched.gt.pm.days}', '{sched.gt.pm} · {sched.gt.pm.days}'],
    'course.drawer.j21': ['{sched.hssv.days} — {sched.hssv} · khóa {hssv.months} tháng', '{sched.hssv.days} — {sched.hssv} · {hssv.months}-month term'],
    'global.slip.ship.std': ['Giao tiêu chuẩn ({ship.eta} ngày)', 'Standard delivery ({ship.eta} days)'],
  };
  for (const [k, [vi, en]] of Object.entries(T2)) setDefault(k, vi, en);
  swap('course.prg.d1', 'Thứ 2 – Thứ 7.', '{sched.gt.am.days}.', 'vi'); swap('course.prg.d1', 'Mon–Sat.', '{sched.gt.am.days}.', 'en');
  swap('course.prg.d3', 'Khung giờ cố định 17:00 – 18:30, Thứ 3 · 5 · 7.', 'Khung giờ cố định {sched.hssv}, {sched.hssv.days}.', 'vi');
  swap('course.prg.d3', 'Fixed slot 17:00 – 18:30, Tue · Thu · Sat.', 'Fixed slot {sched.hssv}, {sched.hssv.days}.', 'en');
  for (const k of ['shop.detail.delivery', 'shop.ship.body', 'shop.success.step.std']) swap(k, '2–4', '{ship.eta}');
  // SEO tiếng Anh (tiêu đề tab + mô tả khi khách chọn EN)
  const SEO = {
    home: ['Dapper Combat — Boxing & Fight Lifestyle in Saigon', 'Dapper Combat — structured Boxing classes, gear & apparel for fighters, and Boxing gym setup services in Ho Chi Minh City.'],
    shop: ['Shop — Dapper Combat', 'Dapper Combat Boxing gloves, tees, hoodies and training accessories. Nationwide delivery, free shipping on orders from {ship.free}₫.'],
    course: ['Boxing Courses — Dapper Combat', 'Boxing programs at Dapper Combat: 12-week Foundation, Group Training, student classes, Membership and 1-on-1 PT. Free trial for new students.'],
    services: ['Boxing Gym Setup — Dapper Combat', 'Design consulting, equipment supply and turnkey Boxing gym setup. Free survey in Ho Chi Minh City, builds nationwide.'],
  };
  for (const [p, [t, d]] of Object.entries(SEO)) { setDefault(p + '.seo.title', undefined, t); setDefault(p + '.seo.desc', undefined, d); }
}
// <li data-cms="k">chữ</li> → <li><a data-cms="k" href="…">chữ</a></li>
function footLinks(s, map) {
  for (const [k, href] of Object.entries(map)) {
    s = s.replace(new RegExp(`<li data-cms="${k.replace(/\./g, '\\.')}"((?: data-i18n="[^"]*")?)>([\\s\\S]*?)</li>`), (m, i18n, inner) => `<li><a data-cms="${k}"${i18n} href="${href}">${inner}</a></li>`);
  }
  return s;
}
// id cho khu vực (để làm link #neo, vd /khoa-hoc#lich-tap)
function addIds(s, map) {
  for (const [sec, id] of Object.entries(map)) {
    if (s.includes(`id="${id}"`)) continue;
    s = s.replace(new RegExp(`(<(?:section|header|div|footer)) data-cms-sec="${sec.replace(/\./g, '\\.')}"((?:(?! id=)[^>])*)>`), `$1 id="${id}" data-cms-sec="${sec}"$2>`);
  }
  return s;
}

/* ─── Bộ chọn đơn giản: "tag.class#id:not(.x)", nối bằng khoảng trắng hoặc ">" ─ */
function compound(s) {
  const o = { tag: null, cls: [], id: null, not: [] };
  s = s.replace(/:not\(([^)]*)\)/g, (m, x) => { o.not.push(compound(x)); return ''; });
  const t = s.match(/^[a-z0-9]+/i); if (t) o.tag = t[0].toLowerCase();
  for (const x of s.matchAll(/\.([\w-]+)/g)) o.cls.push(x[1]);
  const id = s.match(/#([\w-]+)/); if (id) o.id = id[1];
  return o;
}
function isEl(e) { return e && (e.type === 'tag' || e.type === 'script' || e.type === 'style'); }
function hit(el, c) {
  if (!isEl(el)) return false;
  if (c.tag && el.name !== c.tag) return false;
  const cls = (el.attribs.class || '').split(/\s+/);
  if (c.cls.some(x => !cls.includes(x))) return false;
  if (c.id && el.attribs.id !== c.id) return false;
  return !c.not.some(n => hit(el, n));
}
function chain(sel) {
  const out = []; let comb = ' ';
  for (const p of sel.trim().replace(/\s*>\s*/g, ' > ').split(/\s+/)) { if (p === '>') { comb = '>'; continue; } out.push({ c: compound(p), comb }); comb = ' '; }
  return out;
}
function matches(el, ch) {
  let i = ch.length - 1;
  if (!hit(el, ch[i].c)) return false;
  let cur = el;
  while (i > 0) {
    const comb = ch[i].comb; i--;
    cur = cur.parent;
    if (comb === '>') { if (!hit(cur, ch[i].c)) return false; } else { while (cur && !hit(cur, ch[i].c)) cur = cur.parent; if (!cur) return false; }
  }
  return true;
}
const $$ = (nodes, sel) => { const ch = chain(sel); return DomUtils.findAll(e => matches(e, ch), nodes); };
const kids = el => (el.children || []).filter(isEl);
const parse = s => parseDocument(s, { withStartIndices: true, withEndIndices: true, decodeEntities: false });
const secOf = el => { for (let p = el; p; p = p.parent) if (p.attribs && p.attribs['data-cms-sec']) return p.attribs['data-cms-sec']; return null; };
const textOf = (src, el) => src.slice(el.startIndex, el.endIndex + 1).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
// chỉnh HTML theo vị trí (thêm thuộc tính, xóa đoạn), áp từ cuối lên
function applyEdits(src, edits) {
  edits.sort((a, b) => b.at - a.at || b.del - a.del);
  for (const e of edits) src = src.slice(0, e.at) + e.ins + src.slice(e.at + e.del);
  return src;
}
function attrEdit(el, name, value) { // thêm thuộc tính ngay sau tên thẻ
  el.attribs[name] = value;
  return { at: el.startIndex + 1 + el.name.length, del: 0, ins: value === '' ? ` ${name}` : ` ${name}="${value}"` };
}

/* ─── Danh sách trong HTML ───────────────────────────────────────────────── */
// nth: khung thứ mấy khớp bộ chọn (1 = đầu tiên); dup: dải chữ chạy lặp lại → server tự nhân đôi
// sub: danh sách con trong mỗi mục (khóa con = <khóa>.<số mục>.<sub.key>)
const HTML_LISTS = [
  ['home', 'home.ticker.r1', '.ticker-track:not(.reverse)', '.ticker-item', 'Dải chữ chạy — dòng trên', 'Cụm chữ', { dup: 2 }],
  ['home', 'home.ticker.r2', '.ticker-track.reverse', '.ticker-item', 'Dải chữ chạy — dòng dưới', 'Cụm chữ', { dup: 2 }],
  ['home', 'home.nav.links', 'nav.nav ul.nav-links', 'li', 'Liên kết trên thanh menu (máy tính)', 'Liên kết'],
  ['home', 'home.hero.btns', '.hero-actions', 'a', 'Nút ở đầu trang', 'Nút'],
  ['home', 'home.hero.trust', '.hero-trust', 'span', 'Dòng chữ nhỏ dưới nút', 'Dòng'],
  ['home', 'home.philo.text', '.philo-text', 'p', 'Đoạn văn triết lý', 'Đoạn'],
  ['home', 'home.philo.pillars', '.philo-pillars', '.pillar', 'Trụ cột (01, 02…)', 'Trụ cột'],
  ['home', 'home.instructor.creds', '.instructor-creds', '.cred-tag', 'Thẻ chứng chỉ của HLV', 'Chứng chỉ'],
  ['home', 'home.instructor.stats', '.instructor-stats', 'div', 'Số liệu của HLV', 'Số liệu'],
  ['home', 'home.courses.cards', '.course-grid', '.course-card', 'Thẻ khóa học', 'Thẻ khóa học'],
  ['home', 'home.imgbanner.g1', '.imgbanner-grid', 'img', 'Ảnh trong băng ảnh lớn thứ 1', 'Ảnh', { nth: 1, hint: 'Bố cục đẹp nhất với 4 ảnh.' }],
  ['home', 'home.imgbanner.g2', '.imgbanner-grid', 'img', 'Ảnh trong băng ảnh lớn thứ 2', 'Ảnh', { nth: 2, hint: 'Bố cục đẹp nhất với 4 ảnh.' }],
  ['home', 'home.community.btns', '.comm-btns', 'a', 'Nút tham gia cộng đồng', 'Nút'],
  ['home', 'home.community.stats', '.comm-right', '.stat-block', 'Số liệu cộng đồng', 'Số liệu'],
  ['home', 'home.reviews.cards', '.reviews-track', '.review-card', 'Thẻ đánh giá', 'Đánh giá'],
  ['home', 'home.cta.btns', '.cta-banner-btns', 'a', 'Nút kêu gọi cuối trang', 'Nút'],
  ['home', 'home.footer.social', '.footer-social', 'a', 'Nút mạng xã hội ở chân trang', 'Nút'],
  ['home', 'home.footer.cols', 'footer .footer-grid', '.footer-col', 'Cột liên kết ở chân trang', 'Cột', { sub: { key: 'links', sel: 'ul', item: 'li', label: 'Liên kết trong cột', itemLabel: 'Liên kết' } }],

  ['course', 'course.nav.links', 'nav.nav ul.nav-links', 'li', 'Liên kết trên thanh menu (máy tính)', 'Liên kết'],
  ['course', 'course.fbanner.books', '.fbanner-books', '.fbook', 'Các chương (FOUNDATION, THE STANDARD…)', 'Chương'],
  ['course', 'course.fdetail.specs', '.fd-specs', 'div', 'Thông số khóa (tuần, buổi…)', 'Thông số'],
  ['course', 'course.fdetail.cards', '.fd-cards', '.fd-card', 'Thẻ thông tin khóa', 'Thẻ', { sub: { key: 'lines', sel: 'ul.fd-list', item: 'li', label: 'Các dòng trong thẻ', itemLabel: 'Dòng' } }],
  ['course', 'course.fdetail.open', '.fd-open', '.fd-open-item', 'Thông tin khai giảng', 'Mục'],
  ['course', 'course.hero.stats', '.stats-inner', '.stat', 'Dải số liệu', 'Số liệu'],
  ['course', 'course.approach.text', '.approach-text', 'p', 'Đoạn văn', 'Đoạn'],
  ['course', 'course.why.cards', '.why-grid', '.why-card', 'Lý do chọn Dapper Combat', 'Lý do'],
  ['course', 'course.programs.list', '.programs .sec-inner', '.program', 'Danh sách chương trình', 'Chương trình'],
  ['course', 'course.gallery.imgs', '.cgallery', 'a', 'Ảnh không gian', 'Ảnh'],
  ['course', 'course.pricing.cards', '.pcards', '.pcard', 'Thẻ học phí', 'Thẻ', { sub: { key: 'feats', sel: 'ul.pcard-feats', item: 'li', label: 'Quyền lợi trong thẻ', itemLabel: 'Quyền lợi' } }],
  ['course', 'course.pricing.extra', '.extra-grid', '.extra-card', 'Dịch vụ thêm (Membership, PT 1-1)', 'Thẻ'],
  ['course', 'course.faq.list', '.faq-list', '.faq-item', 'Câu hỏi thường gặp', 'Câu hỏi'],
  ['course', 'course.regproc.steps', '.reg-grid', '.reg-step', 'Các bước đăng ký', 'Bước'],
  ['course', 'course.info.cards', '.infogrid', '.info-card', 'Thông tin cần biết', 'Thông tin'],
  ['course', 'course.footer.cols', 'footer .footer-grid', '.footer-col', 'Cột liên kết ở chân trang', 'Cột', { sub: { key: 'links', sel: 'ul', item: 'li', label: 'Liên kết trong cột', itemLabel: 'Liên kết' } }],

  ['shop', 'shop.nav.links', 'nav.nav ul.nav-links', 'li', 'Liên kết trên thanh menu (máy tính)', 'Liên kết'],
  ['shop', 'shop.pdp.trust', '.pdp-trust', 'div', 'Cam kết dưới nút mua', 'Cam kết'],
  ['shop', 'shop.pdp.faq', '#faqAcc', '.acc-item', 'Câu hỏi thường gặp (trang sản phẩm)', 'Câu hỏi'],
  ['shop', 'shop.checkout.assure', '.co-assure', 'div', 'Cam kết ở trang thanh toán', 'Cam kết'],
  ['shop', 'shop.checkout.badges', '.pay-badges', 'span', 'Chữ phương thức thanh toán (VISA, MOMO…)', 'Phương thức'],

  ['services', 'services.nav.links', 'nav.nav ul.nav-links', 'li', 'Liên kết trên thanh menu (máy tính)', 'Liên kết'],
  ['shop', 'shop.footer.cols', 'footer .footer-grid', '.footer-col', 'Cột liên kết ở chân trang', 'Cột', { sub: { key: 'links', sel: 'ul', item: 'li', label: 'Liên kết trong cột', itemLabel: 'Liên kết' } }],
  ['services', 'services.footer.cols', 'footer .ft', '.ft-col', 'Cột liên kết ở chân trang', 'Cột', { sub: { key: 'links', sel: 'ul', item: 'li', label: 'Liên kết trong cột', itemLabel: 'Liên kết' } }],
  ['global', 'global.pgfoot.links', 'footer .pg-foot-links', 'li', 'Liên kết ở chân trang của trang phụ', 'Liên kết'],
  ['global', 'global.pgfoot.pol', 'footer .pg-foot-links', 'li', 'Liên kết chính sách ở chân trang của trang phụ', 'Liên kết', { nth: 2 }],
];
// số thứ tự trong mục danh sách → tự đánh lại khi thêm / đổi chỗ
const NUM_SEL = { home: ['.pillar-num'], course: ['.fb-n', '.why-num', '.program-num', '.reg-num'] };

/* ─── Khối trang (đổi thứ tự / ẩn) ───────────────────────────────────────── */
// khối không cho đổi chỗ: thanh menu, dải chữ chạy, chân trang; Shop là ứng dụng → không chỉnh bố cục
const FIXED = /\.(nav|ticker|footer|snav|ann|announce|sticky|sbar)$/;
const BLOCK_LABELS = { 'course.hero': 'Đầu trang', 'course.hero.b2': 'Dải số liệu (học viên, năm kinh nghiệm…)', 'course.fbanner.wrap': 'Foundation — giới thiệu & chi tiết khóa',
  'course.ann': 'Dải thông báo trên cùng (khai giảng Foundation)', 'course.sticky': 'Thanh giữ chỗ dính đáy màn hình',
  'services.ann': 'Dải thông báo trên cùng (khảo sát miễn phí · hotline)', 'services.sbar': 'Thanh hotline / Zalo dính đáy màn hình',
  'shop.announce': 'Dải thông báo trên cùng (miễn phí giao hàng · đổi trả)', 'shop.coll': 'Đầu trang danh sách (tên, mô tả danh mục)', 'shop.cats': 'Hàng danh mục + nút Lọc & sắp xếp',
  'shop.grid': 'Lưới sản phẩm', 'shop.tiles': 'Ô ảnh dẫn tới danh mục (dưới lưới)', 'shop.footer': 'Chân trang' };
// Shop: khối trang đặt sẵn trong shop.html (chỉ phần danh sách sản phẩm), không tự gắn theo con trực tiếp của <body>
const NO_LAYOUT = { shop: true };

/* ─── HTML: gắn thuộc tính ───────────────────────────────────────────────── */
function prepHtml(page) {
  let src = read(page.html);
  // dải chữ chạy: bỏ nửa sau (bản lặp), server tự nhân đôi khi phục vụ
  let doc = parse(src);
  const rm = [];
  for (const [pg, key, sel, item, , , opt] of HTML_LISTS) {
    if (pg !== page.id || !opt || !opt.dup) continue;
    const box = $$(doc.children, sel)[0];
    if (!box || box.attribs['data-cms-dup']) continue;
    const its = kids(box).filter(k => hit(k, compound(item)));
    const half = its.length / opt.dup;
    its.slice(half).forEach(el => {
      const prev = el.prev && el.prev.type === 'text' && !el.prev.data.trim() ? el.prev : null;
      const from = prev ? prev.startIndex : el.startIndex;
      rm.push({ at: from, del: el.endIndex + 1 - from, ins: '' });
      DomUtils.findAll(e => e.attribs && e.attribs['data-cms'], [el]).concat(el.attribs['data-cms'] ? [el] : []).forEach(e => dropField(e.attribs['data-cms']));
    });
    rm.push(attrEdit(box, 'data-cms-dup', String(opt.dup)));
  }
  if (rm.length) { src = applyEdits(src, rm); doc = parse(src); }

  const edits = [];
  const add = (el, name, value) => { if (el.attribs[name] == null) edits.push(attrEdit(el, name, value)); return el.attribs[name]; };
  // khối: con trực tiếp của <body> có (hoặc chứa) khu vực data-cms-sec
  if (!NO_LAYOUT[page.id]) {
    const seen = {};
    blockEls(doc).forEach(el => {
      const sec = el.attribs['data-cms-sec'] || DomUtils.findOne(e => e.attribs && e.attribs['data-cms-sec'], [el], true).attribs['data-cms-sec'] + '.wrap';
      seen[sec] = (seen[sec] || 0) + 1;
      add(el, 'data-cms-block', seen[sec] > 1 ? `${sec}.b${seen[sec]}` : sec);
    });
  }
  // số thứ tự
  for (const sel of NUM_SEL[page.id] || []) $$(doc.children, sel).forEach(el => add(el, 'data-cms-num', ''));
  // icon SVG (trừ logo)
  const usedIcon = new Set(DomUtils.findAll(e => e.attribs && e.attribs['data-cms-icon'], doc.children).map(e => e.attribs['data-cms-icon']));
  const icN = {}, sameSvg = {}; // icon giống hệt nhau trong cùng khu vực dùng chung 1 khóa (vd icon giỏ hàng trên 6 thẻ sản phẩm)
  DomUtils.findAll(e => e.name === 'svg' && !/nav-logo-mark/.test(e.attribs.class || '') && !insideSvg(e), doc.children).forEach(el => {
    if (el.attribs['data-cms-icon']) return;
    const sec = secOf2(el, page.id), mark = sec + '|' + src.slice(el.startIndex, el.endIndex + 1);
    let k = sameSvg[mark];
    if (!k) { const base = sec + '.ic'; do { icN[base] = (icN[base] || 0) + 1; k = base + icN[base]; } while (usedIcon.has(k)); usedIcon.add(k); sameSvg[mark] = k; }
    add(el, 'data-cms-icon', k);
  });
  // liên kết
  const usedLink = new Set(DomUtils.findAll(e => e.attribs && e.attribs['data-cms-link'], doc.children).map(e => e.attribs['data-cms-link']));
  const lnN = {};
  DomUtils.findAll(e => e.name === 'a' && e.attribs.href != null, doc.children).forEach(el => {
    if (el.attribs['data-cms-link'] || noLink(el)) return;
    let k = el.attribs['data-cms'];
    if (!k || usedLink.has(k)) { const base = secOf2(el, page.id) + '.ln'; do { lnN[base] = (lnN[base] || 0) + 1; k = base + lnN[base]; } while (usedLink.has(k)); }
    usedLink.add(k); add(el, 'data-cms-link', k);
  });
  // danh sách
  for (const [pg, key, sel, item, , , opt = {}] of HTML_LISTS) {
    if (pg !== page.id) continue;
    const boxes = $$(doc.children, sel);
    const box = boxes[(opt.nth || 1) - 1];
    if (!box) { console.warn('  ! không thấy danh sách', key, sel); continue; }
    add(box, 'data-cms-list', key);
    const its = kids(box).filter(k => hit(k, compound(item)));
    its.forEach((it, i) => {
      add(it, 'data-cms-item', String(i + 1));
      if (opt.sub) {
        const sb = $$(it.children, opt.sub.sel)[0];
        if (!sb) return;
        add(sb, 'data-cms-list', `${key}.${i + 1}.${opt.sub.key}`);
        kids(sb).filter(k => hit(k, compound(opt.sub.item))).forEach((x, j) => add(x, 'data-cms-item', String(j + 1)));
      }
    });
  }
  src = applyEdits(src, edits);
  save(page.html, src);
}
const blockEls = doc => { const body = DomUtils.findOne(e => e.name === 'body', doc.children, true); return kids(body).filter(k => k.attribs['data-cms-sec'] || DomUtils.findOne(e => e.attribs && e.attribs['data-cms-sec'], [k], true)); };
// link do JS tự đặt: thẻ sản phẩm (theo sản phẩm thật), nút mở form đăng ký khóa học
// (cũng bỏ: link có id — giỏ hàng, nút menu do JS điền —, ảnh thư viện mở phóng to, nút "← Trang chủ" đổi thành "Đăng ký")
const JS_LINKS = ['fb.cta', 'fb.deposit', 'fd.cta', 'fd.deposit', 'bk.cta', 'hssv.cta', 'mem.cta', 'pt.cta', 'cta.b1', 'gt.cta'];
const noLink = el => JS_LINKS.includes(el.attribs['data-i18n']) || el.attribs.id || /(^| )(nav-back|nav-cta)( |$)/.test(el.attribs.class || '') ||
  (() => { for (let p = el; p; p = p.parent) if (p.attribs && /(^| )(product-grid|cgallery)( |$)/.test(p.attribs.class || '')) return true; return false; })();
// phần tử nằm ngoài các khu vực data-cms-sec → khu vực theo khung chứa
const OUTSIDE = [[/(^| )float-social( |$)/, 'float', 'Nút chat nổi góc màn hình (Zalo, Messenger)'], [/(^| )cart-drawer( |$)/, 'cart', 'Giỏ hàng (ngăn bên phải)']];
function secOf2(el, page) {
  const s = secOf(el);
  if (s) return s;
  for (let p = el; p; p = p.parent) for (const [re, id, label] of OUTSIDE) if (p.attribs && re.test(p.attribs.class || '')) return ensureSec(page + '.' + id, page, label);
  return ensureSec(page + '.other', page, 'Phần khác của trang');
}
function ensureSec(id, page, label) { if (!cat.sections.find(s => s.id === id)) cat.sections.push({ id, page, label, order: 95 }); return id; }
const insideSvg = el => { for (let p = el.parent; p; p = p.parent) if (p.name === 'svg') return true; return false; };
function dropField(key) { const i = cat.fields.findIndex(f => f.key === key); if (i >= 0) { cat.fields.splice(i, 1); fieldBy.delete(key); } }

/* ─── HTML: đọc cấu trúc vào danh mục ────────────────────────────────────── */
const OUT = { lists: [], icons: [], links: [], blocks: {} };
const secLabel = id => (cat.sections.find(s => s.id === id) || {}).label || id;
function scanHtml(page) {
  const src = read(page.html), full = parse(src);
  // page.root: chỉ đọc trong 1 phần tử (vd chân trang của khuôn trang phụ)
  const doc = page.root ? { children: [DomUtils.findOne(e => e.name === page.root, full.children, true)].filter(Boolean) } : full;
  // khối
  if (!page.root) {
    const blocks = DomUtils.findAll(e => e.attribs && e.attribs['data-cms-block'], doc.children);
    const count = {};
    blocks.forEach(el => { const s = el.attribs['data-cms-sec']; if (s) count[s] = (count[s] || 0) + 1; });
    if (blocks.length) OUT.blocks[page.id] = blocks.map(el => {
      const id = el.attribs['data-cms-block'];
      const secs = el.attribs['data-cms-sec'] ? [el.attribs['data-cms-sec']] : [...new Set(DomUtils.findAll(e => e.attribs && e.attribs['data-cms-sec'], [el]).map(e => e.attribs['data-cms-sec']))];
      const sec = secs[0];
      let label = secs.map(secLabel).join(' + ');
      if (BLOCK_LABELS[id]) label = BLOCK_LABELS[id];
      else if (count[sec] > 1) { const f = DomUtils.findOne(e => e.attribs && e.attribs['data-cms'], [el], true); label += f ? ' — ' + plain(fieldBy.get(f.attribs['data-cms'])) : ' ' + id.split('.b')[1]; }
      return { id, sec, secs: secs.length > 1 ? secs : undefined, label, fixed: FIXED.test(sec) || undefined };
    });
  }
  // icon (cùng khóa ở nhiều chỗ → 1 mục, ghi số chỗ)
  const icons = {};
  if (!page.root) DomUtils.findAll(e => e.attribs && e.attribs['data-cms-icon'], doc.children).forEach(el => {
    const key = el.attribs['data-cms-icon'];
    if (icons[key]) { icons[key].count++; return; }
    icons[key] = { key, page: page.id, section: secOf2(el, page.id), label: iconLabel(src, el), svg: src.slice(el.startIndex, el.endIndex + 1).replace(/\s+data-cms-icon="[^"]*"/, ''), src: 'html', count: 1 };
    OUT.icons.push(icons[key]);
  });
  // liên kết
  DomUtils.findAll(e => e.attribs && e.attribs['data-cms-link'], doc.children).forEach(el => {
    const key = el.attribs['data-cms-link'], f = el.attribs['data-cms'] === key ? key : null;
    const t = (f && plain(fieldBy.get(f))) || textOf(src, el) || el.attribs['aria-label'] || (DomUtils.findOne(e => e.name === 'img', [el], true) ? 'Ảnh có link' : 'Liên kết');
    OUT.links.push({ key, page: page.id, section: secOf2(el, page.id), label: t.slice(0, 60), href: el.attribs.href.replace(/&amp;/g, '&'), field: f || undefined, src: 'html' });
  });
  // danh sách
  DomUtils.findAll(e => e.attribs && e.attribs['data-cms-list'], doc.children).forEach(box => {
    const key = box.attribs['data-cms-list'];
    const def = HTML_LISTS.find(d => d[1] === key);
    let meta;
    if (def) meta = { label: def[4], item: def[5], hint: def[6] && def[6].hint, dup: def[6] && def[6].dup };
    else { // danh sách con
      const parent = HTML_LISTS.find(d => d[6] && d[6].sub && key.startsWith(d[1] + '.') && key.endsWith('.' + d[6].sub.key));
      meta = parent ? { label: parent[6].sub.label, item: parent[6].sub.itemLabel, parent: parent[1] } : { label: key, item: 'Mục' };
    }
    const items = kids(box).filter(k => k.attribs['data-cms-item']).map(it => itemInfo(it));
    OUT.lists.push({ key, page: page.id, section: secOf(box) || page.id, src: 'html', label: meta.label, item: meta.item, hint: meta.hint, dup: meta.dup, parent: meta.parent, items });
  });
}
// trường / ảnh / icon / link / danh sách con trong 1 mục (không tính phần thuộc mục của danh sách con)
function itemInfo(it) {
  const o = { id: it.attribs['data-cms-item'], fields: [], media: [], icons: [], links: [], lists: [] };
  const visit = (el, top) => {
    if (!isEl(el)) return;
    const a = el.attribs;
    if (!top && a['data-cms-item']) return;
    if (a['data-cms'] && !o.fields.includes(a['data-cms'])) o.fields.push(a['data-cms']);
    if (a['data-cms-media']) o.media.push(a['data-cms-media']);
    if (a['data-cms-poster']) o.media.push(a['data-cms-poster']);
    if (a['data-cms-icon']) o.icons.push(a['data-cms-icon']);
    if (a['data-cms-link']) o.links.push(a['data-cms-link']);
    if (a['data-cms-list'] && !top) o.lists.push(a['data-cms-list']);
    (el.children || []).forEach(c => visit(c, false));
  };
  visit(it, true);
  o.title = pickTitle(o.fields);
  return o;
}
const TITLE_RANK = ['question', 'title', 'subtitle', 'button', 'item', 'label', 'eyebrow', 'stat', 'text', 'answer', 'quote'];
function pickTitle(keys) {
  let best = null, r = 99;
  for (const k of keys) { const f = fieldBy.get(k); if (!f) continue; const i = TITLE_RANK.indexOf(f.type); if (i >= 0 && i < r) { r = i; best = k; } }
  return best || keys[0] || null;
}
const plain = f => f ? String(f.vi || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40) : '';
function iconLabel(src, el) {
  const host = (() => { for (let p = el.parent; p; p = p.parent) if (p.name === 'a' || p.name === 'button' || p.name === 'label') return p; return null; })();
  const sib = el.parent && kids(el.parent).find(k => k !== el && (k.attribs['data-cms'] || textOf(src, k)));
  let t = '';
  if (sib) t = sib.attribs['data-cms'] ? plain(fieldBy.get(sib.attribs['data-cms'])) : textOf(src, sib);
  if (!t && host) t = textOf(src, host) || host.attribs['aria-label'] || '';
  if (!t && el.parent) t = textOf(src, el.parent) || el.parent.attribs['aria-label'] || '';
  // thẻ chứa gần nhất có chữ (vd thẻ "Địa chỉ" trong khu Địa chỉ)
  for (let p = el.parent, n = 0; !t && p && n < 4; p = p.parent, n++) { const f = DomUtils.findOne(e => e.attribs && e.attribs['data-cms'], [p], true); if (f) t = plain(fieldBy.get(f.attribs['data-cms'])); }
  t = t.slice(0, 40);
  return t ? `Icon cạnh “${t}”` : 'Icon';
}

/* ─── JS: danh sách + icon ───────────────────────────────────────────────── */
// [file(s), khóa, khóa chữ nằm trong mục đầu, số mục, nhãn, tên 1 mục, tùy chọn]
//   id: chỗ chứa mã riêng của mục (số thứ tự trong mảng hoặc tên thuộc tính) → bản sao có mã khác
//   sub: { prop | idx, key, label, itemLabel } danh sách con trong mỗi mục
const JS_LISTS = [
  [['services-1.js'], 'services.hero.facts', 'services.hero.j6', 4, 'Điểm nổi bật ở đầu trang', 'Điểm'],
  [['services-1.js'], 'services.services.cards', 'services.services.j1', 3, 'Các dịch vụ', 'Dịch vụ', { sub: { prop: 'li', key: 'li', label: 'Các dòng trong thẻ dịch vụ', itemLabel: 'Dòng' } }],
  [['services-1.js'], 'services.fit.items', 'services.fit.j1', 5, 'Phù hợp cho ai', 'Đối tượng'],
  [['services-1.js'], 'services.why.items', 'services.why.j1', 4, 'Vì sao chọn Dapper Combat', 'Lý do'],
  [['services-1.js'], 'services.packages.cards', 'services.packages.j31', 3, 'Gói thiết bị', 'Gói', { id: 'k', sub: { prop: 'li', key: 'li', label: 'Thiết bị trong gói', itemLabel: 'Thiết bị' } }],
  [['services-1.js'], 'services.catalog.items', 'services.catalog.j1', 8, 'Danh mục thiết bị', 'Nhóm thiết bị'],
  [['services-1.js'], 'services.process.steps', 'services.process.j1', 5, 'Các bước quy trình', 'Bước'],
  [['services-1.js'], 'services.gallery.imgs', 'services.gallery.j1', 5, 'Ảnh không gian tham khảo', 'Ảnh'],
  [['services-1.js'], 'services.faq.items', 'services.faq.j1', 6, 'Câu hỏi thường gặp', 'Câu hỏi'],
  [['services-1.js'], 'services.contact.types', 'services.contact.j16', 5, 'Lựa chọn “Loại hình” trong form', 'Lựa chọn', { id: 0 }],
  [['services-1.js'], 'services.contact.areas', 'services.contact.area.s', 4, 'Lựa chọn “Diện tích” trong form', 'Lựa chọn', { id: 0 }],
  [['services-1.js'], 'services.contact.svcs', 'services.contact.j23', 3, 'Lựa chọn “Dịch vụ quan tâm” trong form', 'Lựa chọn', { id: 0 }],
  [['services-1.js'], 'services.contact.budgets', 'services.contact.j30', 5, 'Lựa chọn “Ngân sách” trong form', 'Lựa chọn', { id: 0 }],
  [['home-3.js', 'shop-1.js', 'course-1.js', 'services-1.js'], 'global.mnav.pages', 'global.mnav.1', 4, 'Các trang trong menu điện thoại', 'Trang', { id: 'k' }],
  [['shop-1.js'], 'shop.reviews.list', 'shop.reviews.n1', 12, 'Đánh giá mẫu ở trang sản phẩm', 'Đánh giá'],
  [['shop-1.js'], 'shop.sizeguide.ao', 'shop.sizeguide.j25', 4, 'Bảng size Áo — các dòng', 'Size'],
  [['shop-1.js'], 'shop.sizeguide.dotap', 'shop.sizeguide.j49', 3, 'Bảng size Đồ tập — các dòng', 'Size'],
  [['shop-1.js'], 'shop.sizeguide.gang', 'shop.sizeguide.j67', 3, 'Bảng size Găng — các dòng', 'Size'],
  [['shop-1.js'], 'shop.sizeguide.how.ao', 'shop.sizeguide.how.ao.1.t', 3, 'Cách đo — Áo', 'Bước đo'],
  [['shop-1.js'], 'shop.sizeguide.how.dotap', 'shop.sizeguide.how.dotap.1.t', 3, 'Cách đo — Đồ tập', 'Bước đo'],
  [['shop-1.js'], 'shop.sizeguide.how.gang', 'shop.sizeguide.how.gang.1.t', 3, 'Cách đo — Găng', 'Bước đo'],
];
// tên icon dùng chung trong JS
const ICON_NAMES = {
  'services.icon.plan': 'Bản vẽ — dịch vụ Tư vấn & thiết kế', 'services.icon.gear': 'Thiết bị — dịch vụ Cung cấp thiết bị', 'services.icon.key': 'Chìa khóa — dịch vụ Setup trọn gói',
  'services.icon.ring': 'Võ đài', 'services.icon.bag': 'Bao cát', 'services.icon.floor': 'Sàn & thảm', 'services.icon.glove': 'Găng & bảo hộ', 'services.icon.mirror': 'Gương',
  'services.icon.weight': 'Khu thể lực', 'services.icon.light': 'Âm thanh & ánh sáng', 'services.icon.chat': 'Tin nhắn (nút Zalo)', 'services.icon.phone': 'Điện thoại (nút gọi)', 'services.icon.brand': 'Branding',
  'shop.sizeguide.icon.ao': 'Hình minh họa cách đo — Áo', 'shop.sizeguide.icon.dotap': 'Hình minh họa cách đo — Đồ tập', 'shop.sizeguide.icon.gang': 'Hình minh họa cách đo — Găng',
};
// icon trong chuỗi JS không có tên riêng: [khu vực, nhãn]
const ICON_META = {
  'shop.icon.js1': ['shop.pdp', 'Kính lúp — ô tìm trong phần đánh giá'], 'shop.icon.js2': ['shop.list', 'Bộ lọc — nút “Lọc & sắp xếp” (điện thoại)'],
  'shop.icon.js3': ['shop.checkout', 'Logo COD — phương thức thanh toán'], 'shop.icon.js4': ['shop.checkout', 'Logo chuyển khoản — phương thức thanh toán'],
};
const isCall = (n, name) => n && n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && n.callee.object.name === 'DC' && n.callee.property.name === name;
// khóa thật của DC.x/DC.m/DC.i: "k" hoặc $k("k") / $k2($k("k"))
function keyArg(a) { while (a && a.type === 'CallExpression' && a.callee.type === 'Identifier' && /^\$k\d*$/.test(a.callee.name)) a = a.arguments[0]; return a && a.type === 'Literal' && typeof a.value === 'string' ? a.value : null; }

// đường dẫn các trang trong menu điện thoại (trang đang xem vẫn là nút đóng menu)
const MNAV_URL = { home: ['global.mnav.u1', '/'], shop: ['global.mnav.u2', '/shop'], course: ['global.mnav.u3', '/khoa-hoc'], services: ['global.mnav.u4', '/dich-vu-setup'] };
function prepJs(file) {
  let src = read('assets/js/' + file);
  for (const [k, [key, url]] of Object.entries(MNAV_URL)) src = src.replace(`url:MNAV.${k},`, `url:DC.x(${JSON.stringify(key)},0,${JSON.stringify(url)}),`);
  if (file === 'shop-1.js') src = shopPre(src);
  if (file === 'services-1.js') src = servicesPre(src);
  const ast = acorn.parse(src, { ecmaVersion: 'latest' });
  const edits = [];
  // 1. danh sách
  for (const [files, key, anchor, n, , , opt = {}] of JS_LISTS) {
    if (!files.includes(file) || src.includes(`DC.list(${JSON.stringify(key)},`)) continue;
    const arr = findArray(ast, anchor, n);
    if (!arr) { console.warn('  ! không thấy mảng', key, 'trong', file); continue; }
    wrapList(src, arr, JSON.stringify(key), '$k', [], opt, key, edits);
  }
  src = apply(src, edits);
  // 2. icon SVG trong chuỗi
  const ast2 = acorn.parse(src, { ecmaVersion: 'latest' });
  const ed2 = [];
  let n = 0;
  walk.ancestor(ast2, {
    Literal(node, anc) {
      if (typeof node.value !== 'string' || !/<svg[\s\S]*<\/svg>/.test(node.value)) return;
      if (anc.some(a => a !== node && isCall(a, 'i'))) return;
      const raw = src.slice(node.start + 1, node.end - 1), q = src[node.start];
      const parent = anc[anc.length - 2];
      const propKey = parent && parent.type === 'Property' && parent.value === node ? (parent.key.name || parent.key.value) : null;
      const owner = anc.slice().reverse().find(a => a.type === 'VariableDeclarator');
      const pieces = []; let last = 0;
      for (const m of raw.matchAll(/<svg[\s\S]*?<\/svg>/g)) {
        if (/\\/.test(m[0])) return;
        pieces.push(raw.slice(last, m.index)); pieces.push({ svg: m[0] }); last = m.index + m[0].length;
      }
      pieces.push(raw.slice(last));
      let out = [];
      for (const p of pieces) {
        if (typeof p === 'string') { if (p) out.push(q + p + q); continue; }
        let k;
        if (owner && owner.id.name === 'ICON' && propKey) k = 'services.icon.' + propKey;
        else if (owner && owner.id.name === 'V3SGSVG' && propKey) k = 'shop.sizeguide.icon.' + propKey;
        else k = `${pageOfFile(file)}.icon.js${++n}`;
        out.push(`DC.i(${JSON.stringify(k)},${q}${p.svg}${q})`);
      }
      ed2.push([node.start, node.end, out.length > 1 ? '(' + out.join('+') + ')' : out[0]]);
    },
  });
  src = apply(src, ed2);
  save('assets/js/' + file, src);
}
const pageOfFile = f => f.startsWith('home') ? 'home' : f.split('-')[0];
function apply(src, edits) {
  edits.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  for (const [s, e, t] of edits) src = src.slice(0, s) + t + src.slice(e);
  return src;
}
// mảng nhỏ nhất có n mục (mỗi mục là mảng / object) mà mục đầu chứa khóa anchor
function findArray(ast, anchor, n) {
  let best = null;
  walk.full(ast, node => {
    if (node.type !== 'ArrayExpression' || node.elements.length !== n) return;
    const first = node.elements[0];
    if (!first || (first.type !== 'ArrayExpression' && first.type !== 'ObjectExpression')) return;
    let has = false;
    walk.full(first, x => { if (!has && (isCall(x, 'x') || isCall(x, 'm')) && keyArg(x.arguments[0]) === anchor) has = true; });
    if (has && (!best || node.end - node.start < best.end - best.start)) best = node;
  });
  return best;
}
// bọc mảng thành DC.list(...); khóa chữ bên trong được bọc bằng tham số $k (và $k2 cho danh sách con)
function wrapList(src, arr, keyExpr, param, outer, opt, key, edits) {
  const inner = [...outer].reverse(); // $k của danh sách ngoài được áp trước
  const wrapKey = lit => [...inner, param].reduce((acc, p) => `${p}(${acc})`, lit);
  edits.push([arr.start, arr.start, `DC.list(${keyExpr},function(${param}){return `]);
  edits.push([arr.end, arr.end, `;})`]);
  const subArrays = [];
  arr.elements.forEach((el, i) => {
    if (!el) return;
    // mã riêng của mục
    if (opt.id !== undefined) {
      const idNode = typeof opt.id === 'number' ? (el.type === 'ArrayExpression' ? el.elements[opt.id] : null)
        : (el.type === 'ObjectExpression' ? (el.properties.find(p => (p.key.name || p.key.value) === opt.id) || {}).value : null);
      if (idNode && idNode.type === 'Literal') edits.push([idNode.start, idNode.end, `${param}.v(${src.slice(idNode.start, idNode.end)})`]);
    }
    // danh sách con
    if (opt.sub) {
      const subNode = el.type === 'ObjectExpression' ? (el.properties.find(p => (p.key.name || p.key.value) === opt.sub.prop) || {}).value : null;
      if (subNode && subNode.type === 'ArrayExpression') {
        subArrays.push(subNode);
        const subKey = `${key}.${i + 1}.${opt.sub.key}`;
        wrapList(src, subNode, `${wrapKey(JSON.stringify(subKey))}`, param + '2', [...outer, param], {}, subKey, edits);
      }
    }
  });
  // khóa chữ / ảnh trong mảng (trừ phần thuộc danh sách con — đã bọc ở trên)
  walk.full(arr, x => {
    if (!(isCall(x, 'x') || isCall(x, 'm') || isCall(x, 'i'))) return;
    const a = x.arguments[0];
    if (a.type !== 'Literal') return;
    if (subArrays.some(s => a.start >= s.start && a.end <= s.end)) return;
    edits.push([a.start, a.end, wrapKey(src.slice(a.start, a.end))]);
  });
}
// Dịch vụ: ảnh không gian lấy theo từng mục (để mục thêm mới có ảnh riêng); mã gói bỏ phần đuôi bản sao
function servicesPre(s) {
  const imgs = s.match(/const IMGS=\{([^}]*)\};\n/);
  if (!imgs) return s;
  for (const m of imgs[1].matchAll(/(g\d):DC\.m\("([^"]+)","([^"]+)"\)/g)) s = s.replace(`["${m[1]}",T(DC.x("services.gallery`, `[DC.m("${m[2]}","${m[3]}"),T(DC.x("services.gallery`);
  s = s.replace(`'<figure><img src="'+IMGS[g[0]]+'"`, `'<figure><img src="'+g[0]+'"`);
  s = s.replace(imgs[0], '');
  s = s.replace('F.area={starter:"s",pro:"m",club:"l"}[k]||"";', 'F.area={starter:"s",pro:"m",club:"l"}[String(k).split("~")[0]]||"";');
  return s;
}
// Shop: đánh giá mẫu giữ chữ + ảnh đại diện + ảnh khách gửi ngay trong từng mục (để mục thêm mới sửa riêng được)
function shopPre(s) {
  if (!/const REVIEWS=\[\[DC\.x\("shop\.reviews\.n1"/.test(s)) return s;
  const IMG = {}; for (const m of s.match(/const IMG=\{([^}]*)\}/)[1].matchAll(/(\w+):"([^"]+)"/g)) IMG[m[1]] = m[2];
  const AV = JSON.parse(s.match(/const AV=(\[[^\]]*\])/)[1]);
  const dict = (n, side) => (s.match(new RegExp(`"rv\\.${n}":DC\\.x\\("shop\\.rv\\.${n}",${side},("(?:[^"\\\\]|\\\\.)*")\\)`)) || [, '""'])[1];
  s = s.replace(/"rv\.(\d+)",(\d+),"(\w+)"\]/g, (m, n, av, img) => {
    newMedia({ key: 'shop.reviews.av' + n, section: 'shop.reviews', url: AV[+av], label: `Đánh giá ${n} · Ảnh đại diện`, rec: { w: 160, h: 160, ratio: '1:1', maxKB: 60, format: 'JPG hoặc WebP' } });
    newMedia({ key: 'shop.reviews.ph' + n, section: 'shop.reviews', url: IMG[img], label: `Đánh giá ${n} · Ảnh khách gửi`, rec: { w: 800, h: 800, ratio: '1:1', maxKB: 200, format: 'JPG hoặc WebP' } });
    return `[DC.x("shop.rv.${n}",0,${dict(n, 0)}),DC.x("shop.rv.${n}",1,${dict(n, 1)})],DC.m("shop.reviews.av${n}",${JSON.stringify(AV[+av])}),DC.m("shop.reviews.ph${n}",${JSON.stringify(IMG[img])})]`;
  });
  s = s.split('t(r[2])').join('(lang==="en"?r[2][1]:r[2][0])').split('AV[r[3]]').join('r[3]').split('IMG[r[4]]').join('r[4]');
  return s;
}
function newMedia(m) {
  const i = (cat.media || []).findIndex(x => x.key === m.key);
  const o = { page: m.section.split('.')[0], kind: 'image', attr: 'src', alt: '', src: 'js', hidden: false, order: 99000 + cat.media.length, sections: [m.section], ...m };
  if (i < 0) cat.media.push(o); else cat.media[i] = { ...o, order: cat.media[i].order };
}

function scanJs(file, seen) {
  const src = read('assets/js/' + file);
  const ast = acorn.parse(src, { ecmaVersion: 'latest' });
  walk.simple(ast, {
    CallExpression(node) {
      if (isCall(node, 'list')) {
        const key = keyArg(node.arguments[0]);
        if (!key || seen.has(key)) return;
        seen.add(key);
        const def = JS_LISTS.find(d => d[1] === key);
        const parent = def ? null : JS_LISTS.find(d => d[6] && d[6].sub && key.startsWith(d[1] + '.') && key.endsWith('.' + d[6].sub.key));
        const fn = node.arguments[1], ret = fn.body.body.find(b => b.type === 'ReturnStatement');
        const arr = ret && ret.argument;
        const items = (arr && arr.elements || []).map((el, i) => jsItem(el, i));
        const meta = def ? { label: def[4], item: def[5], hint: def[6] && def[6].hint } : parent ? { label: parent[6].sub.label, item: parent[6].sub.itemLabel, parent: parent[1] } : { label: key, item: 'Mục' };
        const f0 = items[0] && fieldBy.get(items[0].fields[0]);
        OUT.lists.push({ key, page: key.split('.')[0], section: f0 ? f0.section : key.split('.').slice(0, 2).join('.'), src: 'js', label: meta.label, item: meta.item, hint: meta.hint, parent: meta.parent, items });
      }
      if (isCall(node, 'i')) {
        const key = keyArg(node.arguments[0]), svg = node.arguments[1];
        if (!key || seen.has('i:' + key)) return;
        seen.add('i:' + key);
        const page = key.split('.')[0], meta = ICON_META[key] || [];
        OUT.icons.push({ key, page, section: meta[0] || (/^services\.icon\./.test(key) ? 'services.icons' : key.split('.').slice(0, 2).join('.')), label: meta[1] || ICON_NAMES[key] || 'Icon', svg: svg.value, src: 'js', count: 1 });
      }
    },
  });
}
function jsItem(el, i) {
  const o = { id: String(i + 1), fields: [], media: [], icons: [], links: [], lists: [] };
  const inner = [];
  walk.full(el, x => { if (isCall(x, 'list') && x !== el) inner.push(x); });
  const inSub = x => inner.some(s => x.start >= s.start && x.end <= s.end);
  walk.full(el, x => {
    if (isCall(x, 'list') && inner.includes(x) && !inner.some(s => s !== x && x.start >= s.start && x.end <= s.end)) { const k = keyArg(x.arguments[0]); if (k) o.lists.push(k); return; }
    if (inSub(x)) return;
    const k = (isCall(x, 'x') || isCall(x, 'm') || isCall(x, 'i')) ? keyArg(x.arguments[0]) : null;
    if (!k) return;
    const bucket = isCall(x, 'x') ? o.fields : isCall(x, 'm') ? o.media : o.icons;
    if (!bucket.includes(k)) bucket.push(k);
  });
  o.title = pickTitle(o.fields);
  return o;
}

/* ─── Bảng màu ───────────────────────────────────────────────────────────── */
const BRAND = ['#D4372E', '#B82E26', '#0B0B0B', '#F2F2F2'];
function palette() {
  const files = ['assets/css/home.css', 'assets/css/course.css', 'assets/css/shop.css', 'assets/css/services.css', 'assets/css/site.css', 'index.html', 'khoa-hoc.html', 'shop.html', 'dich-vu-setup.html', 'assets/js/home-1.js', 'assets/js/home-3.js', 'assets/js/home-site.js', 'assets/js/shop-1.js', 'assets/js/course-1.js', 'assets/js/services-1.js'];
  const norm = h => { h = h.toUpperCase(); return h.length === 4 ? '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3] : h; };
  const pageOf = f => /home|index/.test(f) ? 'home' : /shop/.test(f) ? 'shop' : /course|khoa-hoc/.test(f) ? 'course' : /services|dich-vu/.test(f) ? 'services' : 'global';
  const m = {};
  for (const f of files) {
    const s = read(f).replace(/data:[^"')\s]+/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '');
    const hit = (hex, how) => { const k = norm(hex); (m[k] = m[k] || { hex: k, n: 0, pages: new Set(), alpha: 0 }).n++; m[k].pages.add(pageOf(f)); if (how === 'a') m[k].alpha++; };
    for (const x of s.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/g)) if (/\.css$/.test(f) || /[:\s("',]$/.test(s[x.index - 1] || '')) hit(x[0]);
    for (const x of s.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,)?/g)) hit('#' + [x[1], x[2], x[3]].map(v => (+v).toString(16).padStart(2, '0')).join(''), x[4] ? 'a' : '');
  }
  const group = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 20) return 'neutral'; if (r > g + 40 && r > b + 40) return 'warm'; return 'other'; };
  return Object.values(m).filter(x => !BRAND.includes(x.hex)).sort((a, b) => b.n - a.n).map(x => ({ hex: x.hex, n: x.n, pages: [...x.pages], group: group(x.hex) }));
}

/* ─── Nhãn dễ hiểu ───────────────────────────────────────────────────────── */
// vai trò của chữ trong 1 mục danh sách (hiện trong thẻ mục ở /admin), đoán theo class của phần tử
const ROLE_CLASS = [
  [/rv-stars/, 'Điểm (vd 5.0)'], [/rv-text/, 'Lời đánh giá'], [/rv-name/, 'Tên học viên'],
  [/badge|ribbon/, 'Nhãn góc ảnh'], [/rv-name|pcard-name|cc-title|program-title|why-h|reg-h|info-h|pillar-label|fb-t|-title\b|-name\b|\bh4\b/, 'Tiêu đề'],
  [/rv-role/, 'Vai trò / lớp học'], [/rv-text|cc-desc|program-desc|why-p|reg-p|info-p|-desc\b|pcard-note|extra-p/, 'Mô tả'],
  [/price/, 'Giá'], [/cta|btn/, 'Nút'], [/level|pcard-tag|-tag\b/, 'Nhãn nhỏ'], [/meta|\bpm\b|-per\b/, 'Thông tin phụ'],
  [/istat-label|stat-label|fd-lab|-label\b|-lab\b|^l div$/, 'Chú thích dưới số'], [/^n div$/, 'Số liệu'], [/istat-val|stat-num|fd-num|\bstat\b|-val\b|-num\b/, 'Số liệu'], [/fb-s\b/, 'Nhãn “chương hiện tại”'],
];
const TYPE_ROLE = { title: 'Tiêu đề', subtitle: 'Tiêu đề', eyebrow: 'Nhãn nhỏ', text: 'Mô tả', label: 'Chữ', button: 'Chữ trên nút', item: 'Dòng',
  quote: 'Trích dẫn', stat: 'Số liệu', question: 'Câu hỏi', answer: 'Câu trả lời', link: 'Đường dẫn khi bấm', seo: 'SEO' };
const KEY_ROLE = [
  [/^shop\.reviews\.n\d+$/, 'Tên khách'], [/^shop\.reviews\.r\d+$/, 'Số sao (1–5)'], [/^shop\.rv\.\d+$/, 'Nội dung đánh giá'],
  [/^global\.mnav\.u\d$/, 'Đường dẫn khi bấm'], [/^global\.mnav\.[1357]$/, 'Tên trang'], [/^global\.mnav\.[2468]$/, 'Mô tả ngắn dưới tên'],
  [/^services\.packages\.j\d+\.n$/, 'Số lượng'], [/^services\.packages\.j(31|33|35)$/, 'Tên gói'], [/^services\.packages\.j(32|34|36)$/, 'Diện tích'],
  [/^services\.packages\.j(1|8|15)$/, 'Phù hợp cho'],
  [/\.how\.\w+\.\d+\.t$/, 'Tên phần đo'], [/\.how\.\w+\.\d+\.d$/, 'Cách đo'],
];
function rolesPass() {
  const roleOf = new Map();
  for (const p of PAGES) {
    const src = read(p.html), doc = parse(src);
    DomUtils.findAll(e => e.attribs && e.attribs['data-cms'], doc.children).forEach(el => {
      const k = el.attribs['data-cms'], cls = (el.attribs.class || (el.parent && el.parent.attribs && el.parent.attribs.class) || '') + ' ' + el.name;
      if (el.name === 'summary') return roleOf.set(k, 'Câu hỏi');
      if (el.parent && el.parent.name === 'details' && el.name === 'p') return roleOf.set(k, 'Câu trả lời');
      if (el.name === 'li' || (el.name === 'a' && el.parent && el.parent.name === 'li')) return roleOf.set(k, el.name === 'a' ? 'Chữ trên link' : 'Dòng');
      const r = ROLE_CLASS.find(([re]) => re.test(cls));
      if (r) roleOf.set(k, r[1]);
    });
  }
  const inItem = new Set();
  for (const l of cat.lists) for (const it of l.items) for (const k of it.fields) inItem.add(k);
  for (const f of cat.fields) {
    delete f.itemLabel;
    if (!inItem.has(f.key)) continue;
    const kr = KEY_ROLE.find(([re]) => re.test(f.key));
    const tail = /^Bảng size .* · (.+)$/.exec(f.label || '');
    f.itemLabel = kr ? kr[1] : tail ? (tail[1] === 'tên size' ? 'Tên size' : tail[1]) : roleOf.get(f.key) || TYPE_ROLE[f.type] || 'Chữ';
  }
  // "Xem trên trang": chữ do JS vẽ giờ cũng tìm được (trừ màn hình chỉ hiện sau khi đặt hàng / thông báo thoáng qua)
  const NO_LOCATE = /^(shop\.success|shop\.other|services\.other|global\.404|global\.pgfoot|global\.footer|global\.misc|.*\.seo)$/;
  for (const f of cat.fields) f.locate = !NO_LOCATE.test(f.section) && f.type !== 'seo' && f.type !== 'link';
  // trang cần mở khi xem: trang sản phẩm / thanh toán
  const VIEW = { 'shop.pdp': 'product', 'shop.reviews': 'product', 'shop.sizeguide': 'product', 'shop.checkout': '/shop/checkout' };
  for (const s of cat.sections) { if (VIEW[s.id]) s.view = VIEW[s.id]; else delete s.view; }
}

/* ─── Chạy ───────────────────────────────────────────────────────────────── */
fixups();
for (const p of PAGES) prepHtml(p);
const jsFiles = [...new Set(PAGES.flatMap(p => p.js))];
for (const f of jsFiles) prepJs(f);
for (const p of PAGES) scanHtml(p);
scanHtml({ id: 'global', html: 'trang.html', root: 'footer' });   // chân trang của trang phụ (/trang/…)
const seenJs = new Set();
for (const f of jsFiles) scanJs(f, seenJs);
if (!cat.sections.find(s => s.id === 'services.icons')) cat.sections.push({ id: 'services.icons', page: 'services', label: 'Icon dùng chung trên trang Dịch vụ', order: 90 });
cat.lists = OUT.lists; cat.icons = OUT.icons; cat.links = OUT.links; cat.blocks = OUT.blocks; cat.palette = palette();
rolesPass();
fs.writeFileSync(CAT, JSON.stringify(cat, null, 1));
console.log(`danh sách ${OUT.lists.length} · icon ${OUT.icons.length} · liên kết ${OUT.links.length} · khối ${Object.values(OUT.blocks).reduce((s, b) => s + b.length, 0)} · màu ${cat.palette.length} · trường ${cat.fields.length}`);
