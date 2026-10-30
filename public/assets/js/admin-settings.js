/* Dapper Combat — Quản trị: Thiết lập
   Bán hàng (phí giao, mã giảm giá, sản phẩm ở Trang chủ) · Học phí & lịch tập ·
   Thương hiệu & menu (mục trên menu, logo, favicon, bản đồ) · Thông báo (Telegram / email).
   Dùng hạ tầng của admin.js qua window.DCAdmin. Mọi giá trị từ API đều qua esc() trước khi chèn HTML. */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A) return;
  var esc = A.esc, ICON = A.ICON;

  // ═══ Nhãn ══════════════════════════════════════════════════════════════════
  var PROMO_TYPES = [['pct', 'Giảm %'], ['fixed', 'Giảm số tiền'], ['freeship', 'Miễn phí giao hàng']];
  var DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  var HOME_SLOTS = 6;
  var MAX_PKG = 8, MAX_ROWS = 20;
  var KINDS = [['group', 'Group Training'], ['hssv', 'Học sinh – sinh viên'], ['found', 'Foundation'], ['other', 'Khác']];
  var PROGS = [['', 'Không mở form'], ['gt', 'Form Group Training'], ['hssv', 'Form lớp HSSV'], ['found', 'Form Foundation (BOOK I)'], ['mem', 'Form Membership'], ['pt', 'Form PT 1-1'], ['trial', 'Form học thử miễn phí']];
  var OPTS = { found: [['A', 'Lớp A'], ['B', 'Lớp B']], gt: [['am', 'Sáng'], ['pm', 'Tối']], trial: [['am', 'Sáng'], ['pm', 'Tối']] };
  // bank / momo / zalopay: khách quét cùng mã VietQR (SePay tự xác nhận); vnpay / installment: chỉ hiện khi đã cài ở Thanh toán online
  var PAYS = [['bank', 'Chuyển khoản ngân hàng (quét mã VietQR)'], ['momo', 'Ví MoMo (quét mã VietQR bằng app MoMo)'], ['zalopay', 'ZaloPay (quét mã VietQR bằng app ZaloPay)'],
    ['vnpay', 'Thẻ ATM / Visa / Mastercard (VNPay) — chỉ hiện khi đã bật VNPay ở Thanh toán online'],
    ['installment', 'Trả góp bằng thẻ tín dụng (VNPay) — chỉ hiện khi đã bật trả góp ở Thanh toán online']];
  var QR_PAYS = ['bank', 'momo', 'zalopay'];
  var FIELD_MODES = [['optional', 'Không bắt buộc'], ['required', 'Bắt buộc'], ['hidden', 'Ẩn']];
  var PDP = [['videos', 'Video trong bộ ảnh'], ['trust', 'Dòng cam kết (giao toàn quốc, đổi trả…)'], ['pay', 'Logo phương thức thanh toán'], ['fit', 'Gợi ý chọn size'],
    ['stock', 'Báo “chỉ còn N sản phẩm”'], ['ship', 'Ngày giao dự kiến'], ['feats', 'Điểm nổi bật'], ['set', 'Gợi ý “Hoàn thiện bộ trang phục”'], ['faq', 'Câu hỏi thường gặp'],
    ['article', 'Bài viết “Về sản phẩm”'], ['reviews', 'Đánh giá của khách (ẩn cả sao cạnh tên)'], ['related', '“Khách hàng cũng mua”'], ['seen', '“Bạn đã xem gần đây”'], ['news', 'Đăng ký nhận tin (Dapper Combat Club)']];
  var TPL_KINDS = { templates: [['order', 'Đơn hàng'], ['registration', 'Đăng ký khóa học'], ['consult', 'Tư vấn setup']], customer: [['order', 'Đơn hàng'], ['registration', 'Đăng ký khóa học']] };
  var VAR_HINT = {
    code: 'mã', total: 'tổng tiền', subtotal: 'tạm tính', discount: 'giảm giá', shipping: 'phí giao', name: 'họ tên', phone: 'số điện thoại', email: 'email',
    address: 'địa chỉ đầy đủ', items: 'danh sách sản phẩm', pay: 'cách thanh toán', ship: 'cách giao', note: 'ghi chú', promo: 'mã giảm giá', date: 'ngày',
    program: 'chương trình', detail: 'chi tiết', due: 'số tiền cần trả', city: 'tỉnh / thành', type: 'loại hình', area: 'diện tích', services: 'dịch vụ', budget: 'ngân sách',
    slip: 'link phiếu xác nhận',
  };
  var IMG_RE = /^image\/(png|jpeg|webp|gif)$/;
  var EMAIL_RE = /^[^@\s<>"']+@[^@\s<>"']+\.[^@\s<>"']+$/;
  var ARROW_UP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7"/></svg>';
  var ARROW_DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>';

  var SCREENS = {
    shop: { view: 'set-shop', title: 'Bán hàng', link: '/shop', ok: 'Đã lưu thiết lập bán hàng — Shop cập nhật ngay.' },
    course: { view: 'set-course', title: 'Học phí & lịch tập', link: '/khoa-hoc', ok: 'Đã lưu học phí & lịch tập — trang Khóa học cập nhật ngay.' },
    brand: { view: 'set-brand', title: 'Thương hiệu & menu', link: '/', ok: 'Đã lưu thương hiệu — website cập nhật ngay.' },
    notify: { view: 'set-notify', title: 'Thông báo', link: '', ok: 'Đã lưu cài đặt thông báo.' },
  };

  // ═══ Trạng thái ════════════════════════════════════════════════════════════
  var ST = { data: null, loading: null, err: '', loadedAt: 0, triedAt: 0, products: null, draft: {}, status: null, notes: {}, tplTab: { templates: 'order', customer: 'order' }, tplFocus: {} };

  // ═══ Tiện ích ══════════════════════════════════════════════════════════════
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clone(o) { return JSON.parse(JSON.stringify(o == null ? null : o)); }
  function num(n) { return (Math.round(Number(n) || 0)).toLocaleString('vi-VN'); }
  function money(n) { return num(n) + '₫'; }
  function toInt(s) { var d = String(s == null ? '' : s).replace(/\D/g, ''); return d ? parseInt(d.slice(0, 13), 10) : 0; }
  function view() { return A.view(); }
  function busy(btn, on) { A.setBusy(btn, on); }
  // gói Group Training: giá mỗi tháng (làm tròn nghìn) và tiền tiết kiệm so với gói ít tháng nhất — giống lib/settings.js
  function pkgCalc(list) {
    list = list || [];
    var ok = list.filter(function (k) { return k && k.months >= 1; });
    var base = ok.slice().sort(function (a, b) { return a.months - b.months; })[0];
    var perBase = base ? (Number(base.price) || 0) / base.months : 0;
    return list.map(function (k) {
      if (!k || !(k.months >= 1)) return { mo: 0, save: 0, isBase: false, base: base };
      var price = Number(k.price) || 0;
      return { mo: Math.round(price / k.months / 1000) * 1000, save: Math.max(0, Math.round(perBase * k.months - price)), isBase: k === base, base: base };
    });
  }
  function getPath(o, path) { return String(path).split('.').reduce(function (x, k) { return x == null ? undefined : x[k]; }, o); }
  function setPath(o, path, v) {
    var p = String(path).split('.'), x = o;
    for (var i = 0; i < p.length - 1; i++) { if (x[p[i]] == null || typeof x[p[i]] !== 'object') x[p[i]] = {}; x = x[p[i]]; }
    x[p[p.length - 1]] = v;
  }

  // giá trị tự điền vào chữ ({found.price}, {gt.12.mo} …) — giống lib/settings.js (bản tiếng Việt)
  function tokens(s) {
    s = s || ST.data; if (!s) return {};
    var c = s.course || {}, sh = s.shop || {}, eta = sh.eta || {};
    // giá trị server tính sẵn (gồm giờ mở cửa lấy từ mục Liên hệ) — phần dưới tính lại theo bản nháp đang sửa
    var t = {}, base = (ST.data && ST.data.tokens) || {};
    Object.keys(base).forEach(function (k) { if (/^hours\./.test(k)) t[k] = base[k]; });
    Object.assign(t, {
      'ship.eta': eta.stdMin === eta.stdMax ? String(eta.stdMin) : eta.stdMin + '–' + eta.stdMax, 'ship.eta.exp': String(eta.exp),
      'found.price': num(c.foundPrice), 'found.deposit': num(c.foundDeposit),
      'hssv.month': num(c.hssvMonth), 'hssv.months': String(c.hssvMonths), 'hssv.price': num((c.hssvMonth || 0) * (c.hssvMonths || 0)), 'mem.price': num(c.memMonth),
      'ship.free': num(sh.freeShip), 'ship.fee': num(sh.shipFee), 'ship.express': num(sh.expressFee),
      'found.start': c.foundStart ? String(c.foundStart).split('-').reverse().join('.') : '',
    });
    // {sched.<chương trình>.<lớp/ca>} giờ học, {….days} ngày có lớp — giống lib/settings.js
    var DN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    (c.scheduleRows || []).forEach(function (r) {
      if (!r || !r.prog) return;
      var k = 'sched.' + r.prog + (r.opt ? '.' + r.opt : '');
      if (t[k] != null) return;
      var on = [0, 1, 2, 3, 4, 5, 6].filter(function (i) { return r.days && r.days[i]; });
      t[k] = r.time || '';
      t[k + '.days'] = on.length >= 3 && on[on.length - 1] - on[0] === on.length - 1 ? DN[on[0]] + ' – ' + DN[on[on.length - 1]] : on.map(function (i) { return DN[i]; }).join(' · ');
    });
    // {gt.<số tháng>} giá gói, {gt.N.mo} giá mỗi tháng, {gt.N.save} tiết kiệm, {gt.from} giá/tháng thấp nhất
    var pk = (c.gtPackages || []).filter(function (k) { return k && k.months >= 1; }), calc = pkgCalc(pk), min = Infinity;
    pk.forEach(function (k, i) {
      t['gt.' + k.months] = num(k.price); t['gt.' + k.months + '.mo'] = num(calc[i].mo); t['gt.' + k.months + '.save'] = num(calc[i].save);
      min = Math.min(min, calc[i].mo);
    });
    t['gt.from'] = num(min === Infinity ? 0 : min);
    return t;
  }

  // ═══ Tải dữ liệu ═══════════════════════════════════════════════════════════
  function load(force) {
    if (ST.loading) return ST.loading;
    if (ST.data && !force) return Promise.resolve(ST.data);
    ST.triedAt = Date.now();
    ST.loading = A.api('/settings').then(function (d) {
      ST.data = d || {}; ST.err = ''; ST.loadedAt = Date.now();
      syncCats();
      return ST.data;
    }).catch(function (e) { ST.err = (e && e.message) || 'Không tải được thiết lập'; return null; })
      .then(function (d) { ST.loading = null; return d; });
    return ST.loading;
  }
  function loadProducts() {
    return A.api('/admin/products').then(function (l) { ST.products = Array.isArray(l) ? l.filter(Boolean) : []; return ST.products; }, function () { ST.products = ST.products || []; return ST.products; });
  }
  // danh mục sản phẩm dùng chung (bảng sản phẩm, form sản phẩm, gợi ý link) → báo cho admin.js mỗi khi có dữ liệu mới
  function syncCats() {
    if (A.setCategories && ST.data && ST.data.shop) A.setCategories(ST.data.shop.categories);
    if (A.setLowStock && ST.data && ST.data.shop && ST.data.shop.lowStock != null) A.setLowStock(ST.data.shop.lowStock);
  }
  // cho admin-content.js (chữ có biến giá)
  A.getSettings = function (force) { return load(force); };
  // cho admin-cats.js (màn Danh mục sản phẩm): dùng chung bộ nhớ thiết lập với các màn Thiết lập khác
  A.settingsStore = {
    load: load,
    loadProducts: loadProducts,
    data: function () { return ST.data; },
    products: function () { return ST.products; },
    // sau khi lưu ở màn khác: cập nhật dữ liệu, bản nháp Bán hàng tạo lại từ dữ liệu mới
    set: function (d) { if (!d) return; ST.data = d; ST.loadedAt = Date.now(); delete ST.draft.shop; syncCats(); },
  };
  A.settingsTokens = function () { return ST.data ? tokens(ST.data) : null; };

  // ═══ Bản nháp & thay đổi ═══════════════════════════════════════════════════
  function initDraft(g) {
    var d = clone(ST.data[g] || {});
    if (g === 'notify') { d.telegramToken = ''; d.smtpPass = ''; }
    ST.draft[g] = d;
  }
  function draft(g) { if (!ST.draft[g] && ST.data) initDraft(g); return ST.draft[g]; }
  var KEYS = {
    shop: ['shipFee', 'freeShip', 'expressFee', 'expressEnabled', 'expressHcmOnly', 'eta', 'lowStock', 'promos', 'homeProducts', 'checkout', 'pdp'],
    course: ['foundPrice', 'foundDeposit', 'foundStart', 'gtPackages', 'hssvMonth', 'hssvMonths', 'memMonth', 'scheduleRows', 'careerPriceCoach', 'careerPriceFighter', 'careerStart', 'careerCohort', 'careerDeposit', 'careerSeats', 'careerAgeCoachMin', 'careerAgeCoachMax', 'careerAgeFighterMin', 'careerAgeFighterMax'],
    brand: ['logo', 'favicon', 'mapQuery', 'fbPixel', 'nav'],
    notify: ['siteUrl', 'telegramToken', 'telegramChat', 'smtpHost', 'smtpPort', 'smtpSecure', 'smtpUser', 'smtpPass', 'mailFrom', 'notifyEmail', 'templates', 'customer'],
  };
  function changed(g) {
    var d = ST.draft[g], s = ST.data && ST.data[g];
    if (!d || !s) return [];
    return KEYS[g].filter(function (k) {
      if (g === 'notify' && (k === 'telegramToken' || k === 'smtpPass')) return !!String(d[k] || '').trim();
      return JSON.stringify(d[k]) !== JSON.stringify(s[k]);
    });
  }
  function dirtyCount(g) { return changed(g).length; }
  function refreshBar(g) {
    var bar = $('[data-savebar="set-' + g + '"]'); if (!bar) return;
    var n = dirtyCount(g);
    bar.hidden = !n;
    $('[data-savebar-msg]', bar).textContent = n + ' mục thay đổi chưa lưu';
    $('[data-set-save]', bar).textContent = 'Lưu ' + n + ' thay đổi';
  }
  function savebarHtml(g) {
    return '<div class="savebar" data-savebar="set-' + g + '" hidden role="region" aria-label="Lưu thay đổi">' +
      '<p class="savebar__msg" data-savebar-msg></p>' +
      '<div class="savebar__actions"><button class="btn btn--on-dark" type="button" data-set-discard="' + g + '">Hủy</button>' +
      '<button class="btn btn--primary" type="button" data-set-save="' + g + '">Lưu</button></div></div>';
  }

  // ═══ Khung màn hình ════════════════════════════════════════════════════════
  function mount(g, main) {
    if (g === 'shop') ST.products = null; // sản phẩm có thể vừa thêm / đổi danh mục ở màn khác → tải lại
    main.innerHTML = A.pageHead(SCREENS[g].title, { eyebrow: 'Thiết lập', stamp: false, count: false }) + '<div data-set-root></div>';
    render(g, true);
  }
  function render(g, first) {
    var root = $('[data-set-root]'); if (!root || view() !== SCREENS[g].view) return;
    if (!ST.data || (g === 'shop' && !ST.products)) {
      root.innerHTML = ST.err && !ST.data ? A.errorHtml(ST.err) : A.loadingHtml();
      if (first !== 'after') {
        Promise.all([load(), g === 'shop' && !ST.products ? loadProducts() : null]).then(function () { render(g, 'after'); });
      }
      if (!ST.data) return;
      if (g === 'shop' && !ST.products) return;
    }
    if (!ST.draft[g]) initDraft(g);
    var html = { shop: shopHtml, course: courseHtml, brand: brandHtml, notify: notifyHtml }[g]();
    root.innerHTML = html + savebarHtml(g);
    after(g);
    refreshBar(g);
  }
  function after(g) {
    if (g === 'shop') { renderPromos(); renderHome(); renderCheckout(); }
    if (g === 'course') { updateCourseCalc(); renderPkgs(); renderRows(); }
    if (g === 'brand') { updateMap(true); }
    if (g === 'notify') { renderTpls(); loadStatus(); }
  }
  function panel(title, inner, extra) {
    return '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">' + esc(title) + '</h2>' + (extra || '') + '</header><div class="set-body">' + inner + '</div></section>';
  }
  function defHint(g, k, fmt) {
    var d = ST.data && ST.data.defaults && ST.data.defaults[g];
    if (!d || d[k] === undefined) return '';
    return 'Mặc định: ' + (fmt ? fmt(d[k]) : esc(d[k]));
  }
  function moneyField(g, k, label, hint) {
    var v = draft(g)[k];
    return '<label class="field set-money"><span class="field__label">' + esc(label) + '</span>' +
      '<span class="set-affix"><input type="text" inputmode="numeric" autocomplete="off" data-money data-g="' + g + '" data-k="' + esc(k) + '" value="' + esc(num(v)) + '"><em>₫</em></span>' +
      '<small class="field__hint" data-hint="' + esc(k) + '">' + (hint || '') + '</small></label>';
  }
  function numberField(g, k, label, min, max, unit, hint) {
    var v = getPath(draft(g), k);
    return '<label class="field set-num"><span class="field__label">' + esc(label) + '</span>' +
      '<span class="set-affix"><input type="number" inputmode="numeric" min="' + min + '" max="' + max + '" step="1" data-int data-g="' + g + '" data-k="' + esc(k) + '" value="' + esc(v == null ? '' : v) + '">' + (unit ? '<em>' + esc(unit) + '</em>' : '') + '</span>' +
      (hint ? '<small class="field__hint">' + hint + '</small>' : '') + '</label>';
  }
  function switchField(g, k, label) {
    return '<label class="check set-switch"><input type="checkbox" data-bool data-g="' + g + '" data-k="' + esc(k) + '"' + (getPath(draft(g), k) ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span>' + esc(label) + '</span></label>';
  }
  // ô tiền: tự thêm dấu chấm hàng nghìn, giữ vị trí con trỏ theo số chữ số
  function formatMoneyInput(inp) {
    var pos = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
    var before = inp.value.slice(0, pos).replace(/\D/g, '').length;
    var v = toInt(inp.value);
    var txt = inp.value.replace(/\D/g, '') === '' ? '' : num(v);
    inp.value = txt;
    var i = 0, seen = 0;
    while (i < txt.length && seen < before) { if (/\d/.test(txt[i])) seen++; i++; }
    try { inp.setSelectionRange(i, i); } catch (e) { /* bỏ qua */ }
    return v;
  }

  // ═══ 1. Bán hàng ═══════════════════════════════════════════════════════════
  function shopHtml() {
    var d = draft('shop');
    return '<div class="cms-help"><p>Áp dụng cho Shop, giỏ hàng, trang thanh toán và cách máy chủ tính tiền đơn hàng. Bấm “Lưu” ở thanh dưới cùng để áp dụng.</p></div>' +
      panel('Phí giao hàng',
        '<div class="set-grid3">' +
          moneyField('shop', 'shipFee', 'Phí giao tiêu chuẩn', defHint('shop', 'shipFee', money)) +
          moneyField('shop', 'freeShip', 'Miễn phí giao cho đơn từ', 'Tạm tính từ mức này được miễn phí giao tiêu chuẩn. ' + defHint('shop', 'freeShip', money)) +
          moneyField('shop', 'expressFee', 'Phí giao hỏa tốc (cộng thêm)', 'Cộng vào phí tiêu chuẩn khi khách chọn hỏa tốc. ' + defHint('shop', 'expressFee', money)) +
        '</div>' + switchField('shop', 'expressEnabled', 'Cho chọn giao hỏa tốc TP.HCM') +
        switchField('shop', 'expressHcmOnly', 'Chỉ nhận giao hỏa tốc khi địa chỉ ở TP.HCM') +
        '<p class="set-note">Tắt dòng trên nếu bạn giao hỏa tốc cả tỉnh khác — nhớ sửa chữ “Hỏa tốc TP.HCM” trên trang thanh toán ở mục Chữ trên trang.</p>') +
      panel('Thời gian giao hàng & tồn kho',
        '<p class="set-note">Dùng để tính ngày giao dự kiến ở trang sản phẩm / thanh toán và cho biến {ship.eta} trong chữ (vd “Giao {ship.eta} ngày làm việc”). Chủ nhật không tính.</p>' +
        '<div class="set-grid3">' +
          numberField('shop', 'eta.stdMin', 'Giao tiêu chuẩn — nhanh nhất', 0, 30, 'ngày') +
          numberField('shop', 'eta.stdMax', 'Giao tiêu chuẩn — chậm nhất', 0, 30, 'ngày') +
          numberField('shop', 'eta.exp', 'Giao hỏa tốc', 0, 30, 'ngày', '0 = giao trong ngày.') +
          numberField('shop', 'eta.cutoff', 'Đặt trước giờ này được tính từ hôm nay', 0, 24, 'giờ') +
          numberField('shop', 'lowStock', 'Báo “sắp hết hàng” khi còn ≤', 0, 1000, 'cái', 'Trang quản trị cảnh báo, trang sản phẩm hiện “Chỉ còn X”. 0 = tắt.') +
        '</div>') +
      panel('Mã giảm giá', '<div class="promos" data-promos></div><p class="set-err" data-promo-err hidden></p>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-promo-add>' + ICON.plus + '<span>Thêm mã</span></button>',
        '<span class="cms-sec__meta" data-promo-count></span>') +
      panel('Sản phẩm ở Trang chủ',
        '<p class="set-note">Trang chủ có 6 ô — chọn ít hơn thì ô thừa sẽ ẩn. Thứ tự dưới đây là thứ tự hiển thị.</p>' +
        '<ol class="hp-list" data-hp></ol>' +
        '<div class="hp-add"><label class="sr" for="hpSelect">Chọn sản phẩm để thêm</label><select id="hpSelect" data-hp-select></select>' +
        '<button class="btn btn--line" type="button" data-hp-add>' + ICON.plus + '<span>Thêm</span></button></div>',
        '<span class="cms-sec__meta" data-hp-count></span>') +
      panel('Trang thanh toán', '<div class="ck" data-ck-box></div>') +
      panel('Trang chi tiết sản phẩm', '<p class="set-note">Bật = hiện phần đó trên trang chi tiết của mọi sản phẩm. Tắt bớt để trang gọn hơn.</p>' +
        '<div class="pdp-grid">' + PDP.map(function (p) { return switchField('shop', 'pdp.' + p[0], p[1]); }).join('') + '</div>') +
      '<p class="set-note set-pointer">Bảo hành, chất liệu, trọng lượng và bảng size của từng loại sản phẩm nay sửa ở <a href="#/categories">Danh mục sản phẩm</a>.</p>' +
      (d ? '' : '');
  }
  // khối “Trang thanh toán”: luôn còn ít nhất 1 cách thanh toán (máy chủ cũng ép như vậy)
  function renderCheckout(focusSel) {
    var box = $('[data-ck-box]'); if (!box) return;
    var ck = draft('shop').checkout || {}, pay = ck.pay || {};
    // thẻ / trả góp chỉ có khi đã cài cổng → luôn phải còn ít nhất 1 cách quét mã VietQR (chuyển khoản / MoMo / ZaloPay)
    var onN = QR_PAYS.filter(function (k) { return pay[k] !== false; }).length;
    var sel = function (k, label, modes, hint) {
      return '<label class="field"><span class="field__label">' + esc(label) + '</span><select data-ck="' + k + '">' + modes.map(function (m) {
        return '<option value="' + m[0] + '"' + (ck[k] === m[0] ? ' selected' : '') + '>' + esc(m[1]) + '</option>'; }).join('') + '</select>' +
        (hint ? '<small class="field__hint">' + esc(hint) + '</small>' : '') + '</label>';
    };
    box.innerHTML = '<p class="field__label">Cách thanh toán khách được chọn</p>' +
      '<div class="ck-pay">' + PAYS.map(function (p) {
        var on = pay[p[0]] !== false, last = on && QR_PAYS.indexOf(p[0]) > -1 && onN === 1;
        return '<label class="check set-switch' + (last ? ' is-locked' : '') + '"' + (last ? ' title="Cần ít nhất một cách thanh toán"' : '') + '>' +
          '<input type="checkbox" data-ck-pay="' + p[0] + '"' + (on ? ' checked' : '') + (last ? ' disabled aria-describedby="ckPayNote"' : '') + '>' +
          '<span class="switch__ui" aria-hidden="true"></span><span>' + esc(p[1]) + '</span></label>';
      }).join('') + '</div>' +
      '<p class="set-note" id="ckPayNote">' + (onN === 1 ? '<strong>Chỉ còn một cách thanh toán nên không tắt được</strong> — bật cách khác trước. ' : 'Phải còn ít nhất một cách thanh toán. ') +
        'Số tài khoản nhận tiền (mã VietQR — app ngân hàng, MoMo, ZaloPay đều quét được) sửa ở <a href="#/cms-payment">Nội dung website → Thanh toán</a>; thẻ và trả góp cài ở <a href="#/set-payments">Thanh toán online</a>.</p>' +
      '<div class="set-grid3">' +
        sel('email', 'Ô Email', FIELD_MODES, 'Có email mới gửi được email xác nhận cho khách.') +
        sel('ward', 'Ô Phường / xã', FIELD_MODES) +
        sel('note', 'Ô Ghi chú', FIELD_MODES.filter(function (m) { return m[0] !== 'required'; })) +
      '</div>' +
      '<p class="set-note">Bắt buộc = khách phải điền mới đặt được hàng · Ẩn = không hiện ô đó.</p>';
    if (focusSel) { var f = $(focusSel, box); if (f && !f.disabled) f.focus(); }
  }
  function renderPromos() {
    var box = $('[data-promos]'); if (!box) return;
    var list = draft('shop').promos || [];
    box.innerHTML = list.length ? list.map(function (p, i) {
      var val = p.type === 'freeship'
        ? '<input type="text" value="—" disabled aria-label="Không cần giá trị">'
        : p.type === 'pct'
          ? '<input type="number" min="1" max="100" step="1" inputmode="numeric" data-pf="value" value="' + esc(p.value) + '"><em>%</em>'
          : '<input type="text" inputmode="numeric" data-pf="value" data-money-plain value="' + esc(num(p.value)) + '"><em>₫</em>';
      return '<div class="promo' + (p.active ? '' : ' is-off') + '" data-promo="' + i + '">' +
        '<label class="field promo__code"><span class="field__label">Mã</span><input type="text" data-pf="code" value="' + esc(p.code) + '" maxlength="30" autocapitalize="characters" spellcheck="false" autocomplete="off"></label>' +
        '<label class="field promo__type"><span class="field__label">Loại</span><select data-pf="type">' + PROMO_TYPES.map(function (t) {
          return '<option value="' + t[0] + '"' + (p.type === t[0] ? ' selected' : '') + '>' + esc(t[1]) + '</option>'; }).join('') + '</select></label>' +
        '<label class="field promo__val"><span class="field__label">Giá trị</span><span class="set-affix">' + val + '</span></label>' +
        '<label class="check promo__on"><input type="checkbox" data-pf="active"' + (p.active ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span>' + (p.active ? 'Đang bật' : 'Đang tắt') + '</span></label>' +
        '<button class="icon-btn icon-btn--line promo__del" type="button" data-promo-del aria-label="Xóa mã ' + esc(p.code || '') + '" title="Xóa mã">' + ICON.trash + '</button>' +
        // điều kiện dùng mã: hạn dùng, số lượt tối đa, đơn tối thiểu + số lượt đã dùng
        '<div class="promo__rules">' +
          '<label class="field"><span class="field__label">Dùng được đến hết ngày</span><input type="date" data-pf="expires" value="' + esc(p.expires || '') + '"></label>' +
          '<label class="field"><span class="field__label">Số lượt tối đa</span><span class="set-affix"><input type="number" min="0" step="1" inputmode="numeric" data-pf="maxUses" value="' + esc(p.maxUses || '') + '" placeholder="Không giới hạn"><em>lượt</em></span></label>' +
          '<label class="field"><span class="field__label">Đơn tối thiểu (tạm tính)</span><span class="set-affix"><input type="text" inputmode="numeric" data-pf="minOrder" data-money-plain value="' + esc(p.minOrder ? num(p.minOrder) : '') + '" placeholder="Không yêu cầu"><em>₫</em></span></label>' +
          '<p class="promo__used">' + promoUsedText(p) + '</p>' +
        '</div>' +
        '</div>';
    }).join('') : '<p class="mini-state">Chưa có mã giảm giá nào.</p>';
    var on = list.filter(function (p) { return p.active; }).length;
    var cnt = $('[data-promo-count]'); if (cnt) cnt.textContent = list.length + ' mã · ' + on + ' đang bật';
    validatePromos(false);
  }
  // "Đã dùng 3 / 10" (+ hết hạn / hết lượt) — số lượt do máy chủ đếm: +1 khi có đơn dùng mã, −1 khi đơn bị hủy
  function promoUsedText(p) {
    var used = Number(p.used) || 0, max = Number(p.maxUses) || 0, d = new Date();
    var today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var flag = p.expires && p.expires < today ? 'Đã hết hạn' : max && used >= max ? 'Đã hết lượt' : '';
    return 'Đã dùng <strong>' + esc(num(used)) + '</strong> / ' + (max ? esc(num(max)) : 'không giới hạn') + (flag ? ' · <span class="promo__flag">' + flag + '</span>' : '');
  }
  function validatePromos(show) {
    var list = draft('shop').promos || [], err = '', seen = {}, badIdx = -1;
    list.forEach(function (p, i) {
      if (err) return;
      if (!p.code) { err = 'Mã thứ ' + (i + 1) + ' chưa có tên.'; badIdx = i; return; }
      if (seen[p.code]) { err = 'Mã “' + p.code + '” bị trùng.'; badIdx = i; return; }
      seen[p.code] = 1;
      if (p.type === 'pct' && !(p.value >= 1 && p.value <= 100)) { err = 'Mã “' + p.code + '”: phần trăm giảm phải từ 1 đến 100.'; badIdx = i; }
      if (p.type === 'fixed' && !(p.value > 0)) { err = 'Mã “' + p.code + '”: số tiền giảm phải lớn hơn 0.'; badIdx = i; }
    });
    var box = $('[data-promo-err]');
    if (box) { box.textContent = show ? err : ''; box.hidden = !(show && err); }
    $$('[data-promo]').forEach(function (r) { r.classList.toggle('is-invalid-row', show && +r.getAttribute('data-promo') === badIdx); });
    return { err: err, idx: badIdx };
  }
  function productById(id) { return (ST.products || []).filter(function (p) { return p.id === id; })[0]; }
  function renderHome() {
    var box = $('[data-hp]'); if (!box) return;
    var ids = draft('shop').homeProducts || [];
    box.innerHTML = ids.length ? ids.map(function (id, i) {
      var p = productById(id), src = p ? A.safeImg(p.img) : '';
      var meta = p ? [A.catName ? A.catName(p.cat) : (p.cat || ''), money(p.price)].filter(Boolean).join(' · ') : 'Không còn sản phẩm này — nên bỏ ra';
      return '<li class="hp" data-hp-id="' + esc(id) + '">' +
        '<span class="hp__n">' + (i + 1) + '</span>' +
        '<span class="thumb">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : ICON.image) + '</span>' +
        '<span class="hp__name"><strong>' + esc(p ? p.name : id) + '</strong><small>' + esc(meta) + '</small>' +
          (p && p.visible === false ? '<span class="tag tag--muted">Đang ẩn — sẽ không hiện</span>' : '') + '</span>' +
        '<span class="hp__ctl">' +
          '<button class="icon-btn icon-btn--line" type="button" data-hp-move="-1" aria-label="Đưa lên"' + (i === 0 ? ' disabled' : '') + '>' + ARROW_UP + '</button>' +
          '<button class="icon-btn icon-btn--line" type="button" data-hp-move="1" aria-label="Đưa xuống"' + (i === ids.length - 1 ? ' disabled' : '') + '>' + ARROW_DOWN + '</button>' +
          '<button class="icon-btn icon-btn--line" type="button" data-hp-del aria-label="Bỏ khỏi Trang chủ">' + ICON.close + '</button>' +
        '</span></li>';
    }).join('') : '<li class="mini-state">Chưa chọn sản phẩm nào — mục sản phẩm nổi bật ở Trang chủ sẽ trống.</li>';
    var sel = $('[data-hp-select]'), full = ids.length >= HOME_SLOTS;
    if (sel) {
      var rest = (ST.products || []).filter(function (p) { return ids.indexOf(p.id) < 0; });
      sel.innerHTML = '<option value="">' + (full ? '— Đã đủ ' + HOME_SLOTS + ' ô —' : '— Chọn sản phẩm để thêm —') + '</option>' + rest.map(function (p) {
        return '<option value="' + esc(p.id) + '">' + esc(p.name) + (p.visible === false ? ' (đang ẩn)' : '') + '</option>'; }).join('');
      sel.disabled = full || !rest.length;
    }
    var add = $('[data-hp-add]'); if (add) add.disabled = full;
    var cnt = $('[data-hp-count]'); if (cnt) cnt.textContent = ids.length + ' / ' + HOME_SLOTS + ' ô';
  }

  // ═══ 2. Học phí & lịch tập ═════════════════════════════════════════════════
  function courseHtml() {
    var add = function (attr, label) { return '<button class="btn btn--line btn--sm" type="button" ' + attr + '>' + ICON.plus + '<span>' + esc(label) + '</span></button>'; };
    return '<div class="cms-help"><p><strong>Giá trên trang Khóa học, Trang chủ, form đăng ký và mã QR tự cập nhật theo đây.</strong></p></div>' +
      panel('Foundation (BOOK I)', '<div class="set-grid3">' +
        moneyField('course', 'foundPrice', 'Học phí trọn khóa', defHint('course', 'foundPrice', money)) +
        moneyField('course', 'foundDeposit', 'Tiền đặt cọc', defHint('course', 'foundDeposit', money)) +
        '<label class="field"><span class="field__label">Ngày khai giảng</span><input type="date" data-text data-g="course" data-k="foundStart" value="' + esc(draft('course').foundStart || '') + '">' +
          '<small class="field__hint">Khóa kế tiếp — hiện ở Trang chủ và trang Khóa học (biến {found.start}).</small></label></div>' +
        '<p class="set-err" data-found-warn hidden></p><p class="set-err" data-start-warn hidden></p>') +
      panel('Group Training — các gói',
        '<p class="set-note">Mỗi gói là một thẻ giá trên trang Khóa học và một lựa chọn trong form đăng ký, theo thứ tự dưới đây. Giá mỗi tháng làm tròn đến nghìn đồng; “Tiết kiệm” tính so với gói ít tháng nhất (gói đó ghi “Giá gốc”).</p>' +
        '<div class="pk-list" data-pk-list></div><p class="set-err" data-pk-err hidden></p>' +
        '<div class="set-actions">' + add('data-pk-add', 'Thêm gói') + '<span class="spacer"></span><button class="btn btn--quiet btn--sm" type="button" data-pk-reset>Khôi phục gói mặc định</button></div>',
        '<span class="cms-sec__meta" data-pk-count></span>') +
      panel('Lớp HSSV', '<div class="set-grid3">' +
        moneyField('course', 'hssvMonth', 'Học phí mỗi tháng', defHint('course', 'hssvMonth', money)) +
        numberField('course', 'hssvMonths', 'Số tháng mỗi khóa', 1, 24, 'tháng') +
        '<div class="field"><span class="field__label">Tổng mỗi khóa</span><p class="set-total" data-calc="hssv"></p></div></div>') +
      panel('Membership', '<div class="set-grid3">' + moneyField('course', 'memMonth', 'Phí mỗi tháng', defHint('course', 'memMonth', money)) + '</div>') +
      panel('Truyền Nghề (khóa Coach + khóa Võ sĩ)', '<div class="set-grid3">' +
        moneyField('course', 'careerPriceCoach', 'Học phí khóa Coach (1 năm)', defHint('course', 'careerPriceCoach', money)) +
        moneyField('course', 'careerPriceFighter', 'Học phí khóa Võ sĩ (1 năm)', defHint('course', 'careerPriceFighter', money)) +
        '<label class="field"><span class="field__label">Ngày khai giảng</span><input type="date" data-text data-g="course" data-k="careerStart" value="' + esc(draft('course').careerStart || '') + '">' +
          '<small class="field__hint">Hiện ở trang Truyền Nghề (/truyen-nghe), kèm đếm ngược tới ngày khai giảng.</small></label>' +
        '<label class="field"><span class="field__label">Tên khóa</span><input type="text" maxlength="16" data-text data-g="course" data-k="careerCohort" value="' + esc(draft('course').careerCohort || '') + '" placeholder="K01">' +
          '<small class="field__hint">Vd K01, K02. Hiện ở nhãn đầu trang, nút “Giữ chỗ khóa …”, tiêu đề ghi danh và giấy nhập môn. Để trống = K01.</small></label>' +
        moneyField('course', 'careerDeposit', 'Tiền cọc giữ chỗ', 'Để 0 = không nhận cọc. Có số tiền → form đăng ký thêm lựa chọn “Đặt cọc giữ chỗ”, khách quét mã QR trả ngay.') +
        numberField('course', 'careerAgeCoachMin', 'Coach: tuổi từ', 10, 80, 'tuổi') + numberField('course', 'careerAgeCoachMax', 'Coach: tuổi đến', 10, 80, 'tuổi', 'Tính theo năm khai giảng. Hiện ở trang + form ghi danh kiểm tra năm sinh.') +
        numberField('course', 'careerAgeFighterMin', 'Võ sĩ: tuổi từ', 10, 80, 'tuổi') + numberField('course', 'careerAgeFighterMax', 'Võ sĩ: tuổi đến', 10, 80, 'tuổi') +
        numberField('course', 'careerSeats', 'Số chỗ mỗi khóa', 0, 999, 'chỗ', 'Để 0 = không hiện. Có số → trang ghi “Mỗi khóa nhận tối đa … học viên”.') +
        '<p class="set-err" data-warn="career" hidden></p></div>') +
      panel('Lịch tập',
        '<p class="set-note">Mỗi hàng là một lớp trong bảng lịch tập ở trang Khóa học. Màu của hàng theo “Loại lớp”. Nếu chọn “Khi bấm vào hàng”, khách bấm vào hàng sẽ mở đúng form đăng ký, chọn sẵn lớp / khung giờ.</p>' +
        '<div class="sr-list" data-sr-list></div><p class="set-err" data-sr-err hidden></p>' +
        '<div class="set-actions">' + add('data-sr-add', 'Thêm lớp') + '<span class="spacer"></span><button class="btn btn--quiet btn--sm" type="button" data-sr-reset>Khôi phục lịch mặc định</button></div>' +
        '<div class="sr-prev-box"><p class="field__label">Xem trước bảng lịch</p><div data-sr-prev></div></div>',
        '<span class="cms-sec__meta" data-sr-count></span>');
  }
  function updateCourseCalc() {
    var d = draft('course'); if (!d) return;
    var h = $('[data-calc="hssv"]'); if (h) h.textContent = money((d.hssvMonth || 0) * (d.hssvMonths || 0)) + ' (' + (d.hssvMonths || 0) + ' tháng × ' + money(d.hssvMonth) + ')';
    var fw = $('[data-found-warn]');
    if (fw) { var bad = d.foundDeposit > d.foundPrice; fw.textContent = bad ? 'Tiền đặt cọc đang lớn hơn học phí trọn khóa.' : ''; fw.hidden = !bad; }
    var cw = $('[data-warn="career"]');
    if (cw) { var cb = d.careerDeposit > Math.min(d.careerPriceCoach || 0, d.careerPriceFighter || 0); cw.textContent = cb ? 'Tiền cọc Truyền Nghề đang lớn hơn học phí — khách chỉ phải cọc tối đa bằng học phí.' : ''; cw.hidden = !cb; }
    var sw = $('[data-start-warn]');
    if (sw) { var past = startPast(d.foundStart); sw.textContent = past ? 'Ngày khai giảng đã qua — trang web đang hiện ngày cũ. Chọn ngày khai giảng kế tiếp.' : ''; sw.hidden = !past; }
  }
  // ngày khai giảng (YYYY-MM-DD) đã qua so với hôm nay
  function startPast(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))) return false;
    var t = new Date(), today = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
    return v < today;
  }
  function defaultsOf(g, k) { var d = ST.data && ST.data.defaults && ST.data.defaults[g]; return d ? clone(d[k]) : null; }
  function moveBtns(attr, i, n, what) {
    return '<button class="icon-btn icon-btn--line" type="button" ' + attr + '="-1" aria-label="Đưa ' + esc(what) + ' lên"' + (i === 0 ? ' disabled' : '') + '>' + ARROW_UP + '</button>' +
      '<button class="icon-btn icon-btn--line" type="button" ' + attr + '="1" aria-label="Đưa ' + esc(what) + ' xuống"' + (i === n - 1 ? ' disabled' : '') + '>' + ARROW_DOWN + '</button>';
  }
  function pairField(attr, path, val, label, hint, ph, max) {
    return '<label class="field"><span class="field__label">' + esc(label) + '</span><input type="text" maxlength="' + (max || 80) + '" ' + attr + '="' + esc(path) + '" value="' + esc(val == null ? '' : val) + '"' +
      (ph ? ' placeholder="' + esc(ph) + '"' : '') + ' autocomplete="off">' + (hint ? '<small class="field__hint">' + hint + '</small>' : '') + '</label>';
  }

  // ── gói Group Training ──
  function pad2(m) { m = Math.round(Number(m) || 0); return (m < 10 ? '0' : '') + m; }
  function pkTitle(k) { return 'Gói ' + (k.months >= 1 ? k.months : '?') + ' tháng'; }
  function renderPkgs(focusSel) {
    var box = $('[data-pk-list]'); if (!box) return;
    var list = draft('course').gtPackages || [], n = list.length;
    box.innerHTML = list.map(function (k, i) {
      var note = k.note || {}, lab = k.label || {};
      return '<div class="pk' + (k.best ? ' is-best' : '') + '" data-pk="' + i + '">' +
        '<div class="pk__head"><span class="cat-card__n" aria-hidden="true">' + (i + 1) + '</span><strong class="pk__title" data-pk-title>' + esc(pkTitle(k)) + '</strong>' +
          (k.best ? '<span class="badge badge--done">Hời nhất</span>' : '') + '<span class="spacer"></span>' +
          '<span class="pk__tools">' + moveBtns('data-pk-move', i, n, 'gói ' + (i + 1)) +
            '<button class="icon-btn icon-btn--line" type="button" data-pk-del aria-label="Xóa gói ' + (i + 1) + '"' + (n <= 1 ? ' disabled title="Cần ít nhất một gói"' : '') + '>' + ICON.trash + '</button></span></div>' +
        '<div class="pk__grid">' +
          '<label class="field set-num"><span class="field__label">Số tháng</span><span class="set-affix"><input type="number" inputmode="numeric" min="1" max="60" step="1" data-pkf="months" value="' + esc(k.months) + '"><em>tháng</em></span>' +
            '<small class="field__hint">1–60, mỗi gói một số khác nhau.</small></label>' +
          '<label class="field set-money"><span class="field__label">Giá gói</span><span class="set-affix"><input type="text" inputmode="numeric" autocomplete="off" data-pkf="price" value="' + esc(k.price ? num(k.price) : '') + '" placeholder="VD: 3.900.000"><em>₫</em></span>' +
            '<small class="field__hint pk__calc" data-pk-calc></small></label>' +
          '<div class="field"><span class="field__label">Nhãn nổi bật</span><label class="check set-switch"><input type="checkbox" data-pkf="best"' + (k.best ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span>Hời nhất</span></label>' +
            '<small class="field__hint">Gắn nhãn “Hời nhất” và chọn sẵn trong form. Chỉ một gói.</small></div>' +
        '</div>' +
        '<div class="set-grid2">' +
          pairField('data-pkf', 'note.vi', note.vi, 'Dòng ghi chú (Tiếng Việt)', 'Dòng nhỏ dưới giá trên thẻ gói.', 'VD: 3 buổi/tuần') +
          pairField('data-pkf', 'note.en', note.en, 'Dòng ghi chú (English (AI tự dịch))', '', 'VD: 3 sessions/week') +
          pairField('data-pkf', 'label.vi', lab.vi, 'Tên gói tự đặt (Tiếng Việt) — không bắt buộc', 'Để trống = tự ghi “' + esc(pad2(k.months)) + ' THÁNG” trên thẻ, “' + esc(k.months || '?') + ' tháng” trong form.', pad2(k.months) + ' THÁNG', 30) +
          pairField('data-pkf', 'label.en', lab.en, 'Tên gói tự đặt (English (AI tự dịch))', '', pad2(k.months) + ' MONTHS', 30) +
        '</div></div>';
    }).join('');
    updatePkgCalc();
    var cnt = $('[data-pk-count]'); if (cnt) cnt.textContent = n + ' / ' + MAX_PKG + ' gói';
    var addB = $('[data-pk-add]'); if (addB) addB.disabled = n >= MAX_PKG;
    var rs = $('[data-pk-reset]'); if (rs) rs.hidden = JSON.stringify(list) === JSON.stringify(defaultsOf('course', 'gtPackages'));
    if (focusSel) { var f = $(focusSel); if (f) f.focus(); }
  }
  function updatePkgCalc() {
    var list = draft('course').gtPackages || [], calc = pkgCalc(list);
    $$('[data-pk]').forEach(function (row) {
      var i = +row.getAttribute('data-pk'), k = list[i], c = calc[i], el = $('[data-pk-calc]', row);
      if (!k) return;
      $('[data-pk-title]', row).textContent = pkTitle(k);
      if (!el) return;
      if (!(k.months >= 1) || !k.price) { el.textContent = 'Nhập số tháng và giá để xem giá mỗi tháng.'; return; }
      el.innerHTML = '≈ <strong>' + esc(money(c.mo)) + '</strong>/tháng · ' + (c.isBase ? '<strong>Giá gốc</strong> (gói ít tháng nhất)'
        : c.save > 0 ? 'Tiết kiệm <strong>' + esc(money(c.save)) + '</strong>' : '<span class="set-warn">Không rẻ hơn gói ' + esc(c.base ? c.base.months : '') + ' tháng</span>');
    });
  }
  function validatePkgs() {
    var list = draft('course').gtPackages || [], seen = {};
    if (!list.length) return { err: 'Cần ít nhất một gói Group Training.', idx: -1 };
    for (var i = 0; i < list.length; i++) {
      var k = list[i];
      if (!(k.months >= 1 && k.months <= 60) || Math.round(k.months) !== k.months) return { err: 'Gói thứ ' + (i + 1) + ': số tháng phải là số nguyên từ 1 đến 60.', idx: i, f: 'months' };
      if (seen[k.months]) return { err: 'Có hai gói cùng ' + k.months + ' tháng — mỗi gói cần số tháng khác nhau.', idx: i, f: 'months' };
      seen[k.months] = 1;
      if (!(k.price > 0)) return { err: 'Gói ' + k.months + ' tháng chưa có giá.', idx: i, f: 'price' };
    }
    return null;
  }

  // ── lịch tập ──
  function srTitle(r) { return [r.time, r.name && r.name.vi].filter(Boolean).join(' · ') || 'Lớp chưa đặt tên'; }
  function blankRow() { return { time: '', name: { vi: '', en: '' }, sub: { vi: '', en: '' }, kind: 'group', days: [0, 0, 0, 0, 0, 0, 0], prog: '', opt: '' }; }
  function renderRows(focusSel) {
    var box = $('[data-sr-list]'); if (!box) return;
    var rows = draft('course').scheduleRows || [], n = rows.length;
    box.innerHTML = n ? rows.map(function (r, i) {
      var opts = OPTS[r.prog], name = r.name || {}, sub = r.sub || {};
      return '<div class="srow k-' + esc(r.kind) + '" data-sr="' + i + '">' +
        '<div class="pk__head"><span class="cat-card__n" aria-hidden="true">' + (i + 1) + '</span><span class="sr__sw" aria-hidden="true"></span><strong class="pk__title" data-sr-title>' + esc(srTitle(r)) + '</strong><span class="spacer"></span>' +
          '<span class="pk__tools">' + moveBtns('data-sr-move', i, n, 'lớp ' + (i + 1)) +
            '<button class="btn btn--quiet btn--sm" type="button" data-sr-dup' + (n >= MAX_ROWS ? ' disabled' : '') + '>Nhân bản</button>' +
            '<button class="icon-btn icon-btn--line" type="button" data-sr-del aria-label="Xóa lớp ' + (i + 1) + '">' + ICON.trash + '</button></span></div>' +
        '<div class="set-grid2">' +
          pairField('data-srf', 'time', r.time, 'Giờ', '', '06:00 – 07:30', 40) +
          '<label class="field"><span class="field__label">Loại lớp (màu của hàng)</span><select data-srf="kind">' + KINDS.map(function (k) {
            return '<option value="' + k[0] + '"' + (r.kind === k[0] ? ' selected' : '') + '>' + esc(k[1]) + '</option>'; }).join('') + '</select></label>' +
          pairField('data-srf', 'name.vi', name.vi, 'Tên lớp (Tiếng Việt)', '', 'VD: Group Training', 60) +
          pairField('data-srf', 'name.en', name.en, 'Tên lớp (English (AI tự dịch))', 'Lưu tên tiếng Việt là AI tự dịch.', '', 60) +
          pairField('data-srf', 'sub.vi', sub.vi, 'Dòng phụ (Tiếng Việt)', 'Dòng nhỏ dưới tên, vd “T2 · T4 · T6”.', '', 80) +
          pairField('data-srf', 'sub.en', sub.en, 'Dòng phụ (English (AI tự dịch))', '', '', 80) +
        '</div>' +
        '<div class="field"><span class="field__label">Ngày có lớp</span><div class="sr-days" role="group" aria-label="Ngày có lớp">' + DAYS.map(function (d, j) {
          return '<label class="sr-day"><input type="checkbox" data-srday="' + j + '"' + (r.days && r.days[j] ? ' checked' : '') + '><span>' + d + '</span></label>'; }).join('') + '</div></div>' +
        '<div class="set-grid2">' +
          '<label class="field"><span class="field__label">Khi bấm vào hàng</span><select data-srf="prog">' + PROGS.map(function (p) {
            return '<option value="' + p[0] + '"' + (r.prog === p[0] ? ' selected' : '') + '>' + esc(p[1]) + '</option>'; }).join('') + '</select>' +
            '<small class="field__hint">Mở form đăng ký của chương trình này.</small></label>' +
          (opts ? '<label class="field"><span class="field__label">' + (r.prog === 'found' ? 'Lớp chọn sẵn trong form' : 'Khung giờ chọn sẵn trong form') + '</span><select data-srf="opt">' + opts.map(function (o) {
            return '<option value="' + o[0] + '"' + (r.opt === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>' : '') +
        '</div></div>';
    }).join('') : '<p class="mini-state">Chưa có lớp nào — bảng lịch tập trên web sẽ trống.</p>';
    renderRowPreview();
    var cnt = $('[data-sr-count]'); if (cnt) cnt.textContent = n + ' / ' + MAX_ROWS + ' lớp';
    var addB = $('[data-sr-add]'); if (addB) addB.disabled = n >= MAX_ROWS;
    var rs = $('[data-sr-reset]'); if (rs) rs.hidden = JSON.stringify(rows) === JSON.stringify(defaultsOf('course', 'scheduleRows'));
    if (focusSel) { var f = $(focusSel); if (f) f.focus(); }
  }
  function renderRowPreview() {
    var box = $('[data-sr-prev]'); if (!box) return;
    var rows = draft('course').scheduleRows || [];
    box.innerHTML = rows.length ? '<div class="sr-prev"><table><thead><tr><th scope="col">Lớp</th>' + DAYS.map(function (d) { return '<th scope="col">' + d + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr class="k-' + esc(r.kind) + '"><th scope="row"><small>' + esc(r.time) + '</small><strong>' + esc((r.name && r.name.vi) || '—') + '</strong>' + (r.sub && r.sub.vi ? '<small>' + esc(r.sub.vi) + '</small>' : '') + '</th>' +
          DAYS.map(function (d, j) { return '<td>' + (r.days && r.days[j] ? '<span class="sr-dot" title="Có lớp"></span>' : '') + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="sr-legend">' + KINDS.map(function (k) { return '<span class="k-' + k[0] + '"><span class="sr__sw" aria-hidden="true"></span>' + esc(k[1]) + '</span>'; }).join('') + '</p>'
      : '<p class="mini-state">Bảng trống.</p>';
  }
  function validateRows() {
    var rows = draft('course').scheduleRows || [];
    for (var i = 0; i < rows.length; i++) if (!String(rows[i].time || '').trim() && !String((rows[i].name || {}).vi || '').trim()) return { err: 'Lớp thứ ' + (i + 1) + ' cần có giờ hoặc tên lớp (hoặc xóa hàng này).', idx: i };
    return null;
  }

  // ═══ 3. Thương hiệu & menu ════════════════════════════════════════════════════════
  function brandHtml() {
    var d = draft('brand');
    return '<div class="cms-help"><p>Mục trên menu, logo trên thanh menu, biểu tượng trên tab trình duyệt và bản đồ ở Trang chủ. Bấm “Lưu” để áp dụng.</p></div>' +
      panel('Mục trên menu',
        '<div class="ck-pay">' + [['home', 'Trang chủ'], ['shop', 'Shop'], ['course', 'Khóa học'], ['services', 'Dịch vụ Setup'], ['ranking', 'Academy Ranking (Lịch sự kiện · Ranking võ sĩ · Thông tin võ sĩ)'], ['career', 'Truyền Nghề (đào tạo coach · võ sĩ từ con số 0)']].map(function (m) { return switchField('brand', 'nav.' + m[0], m[1]); }).join('') + '</div>' +
        '<p class="set-note">Tắt = ẩn mục đó khỏi menu trên cùng và menu điện thoại ở mọi trang. Trang vẫn còn nguyên (mở bằng đường dẫn được), bật lại là hiện ngay. Link ở chân trang sửa ở <a href="#/cms-text">Chữ trên trang</a>.</p>') +
      panel('Logo', '<div class="brand-prev"><p class="field__label">Xem trước trên thanh menu</p><div class="brand-bar" data-logo-prev>' + logoPreview(d.logo) + '</div></div>' +
        '<p class="set-spec">PNG nền trong suốt, cao ≥ 120 px, ngang tối đa ~600 px — hiển thị cao khoảng 28 px trên thanh menu.</p>' +
        uploadRow('logo', 'Tải logo mới', d.logo) + '<div class="set-msg" data-brand-note="logo" hidden></div>') +
      panel('Favicon (biểu tượng trên tab trình duyệt)', '<div class="fav-prev" data-fav-prev>' + favPreview(d.favicon) + '</div>' +
        '<p class="set-spec">PNG vuông 512 × 512 px.</p>' +
        uploadRow('favicon', 'Tải favicon mới', d.favicon) + '<div class="set-msg" data-brand-note="favicon" hidden></div>') +
      panel('Bản đồ Trang chủ',
        '<label class="field"><span class="field__label">Địa chỉ hiển thị trên bản đồ</span>' +
        '<input type="text" maxlength="200" data-text data-g="brand" data-k="mapQuery" value="' + esc(d.mapQuery || '') + '" placeholder="VD: 30 Đường 128, Phước Long, TP. Thủ Đức, TP. Hồ Chí Minh" autocomplete="off">' +
        '<small class="field__hint">Để trống = dùng bản đồ có sẵn của Trang chủ.</small></label>' +
        '<div class="map-prev" data-map-prev></div>') +
      panel('Facebook Pixel (quảng cáo Facebook)',
        '<label class="field"><span class="field__label">ID Pixel</span>' +
        '<input type="text" maxlength="4000" inputmode="numeric" data-text data-g="brand" data-k="fbPixel" value="' + esc(d.fbPixel || '') + '" placeholder="VD: 123456789012345" autocomplete="off" spellcheck="false">' +
        '<small class="field__hint">Lấy ở Facebook Events Manager → Nguồn dữ liệu → Pixel (dãy 15–16 chữ số). Dán ID hoặc dán cả đoạn mã Pixel, hệ thống tự lấy ID. Để trống = không gắn.</small></label>' +
        '<p class="set-note">Gắn vào mọi trang (trừ trang quản trị và phiếu xác nhận của khách). Tự gửi sự kiện: xem trang, xem sản phẩm, thêm vào giỏ, bắt đầu thanh toán, đặt hàng (kèm giá trị đơn), đăng ký khóa học / Truyền Nghề / tư vấn setup / nhận tin (Lead). Kiểm tra bằng tiện ích Meta Pixel Helper trên Chrome.</p>');
  }
  function logoPreview(url) {
    var src = A.safeImg(url);
    return (src ? '<img class="brand-bar__logo" src="' + esc(src) + '" alt="Logo">' : '<svg class="brand-bar__mark" aria-hidden="true"><use href="#dcMark"/></svg>') +
      '<span class="brand__word">Dapper Combat</span><span class="brand-bar__tag">' + (src ? 'Logo riêng' : 'Logo mặc định') + '</span>';
  }
  function favPreview(url) {
    var src = A.safeImg(url);
    var icon = function (sz) { return src ? '<img src="' + esc(src) + '" alt="" width="' + sz + '" height="' + sz + '">' : '<svg aria-hidden="true" width="' + sz + '" height="' + sz + '"><use href="#dcMark"/></svg>'; };
    return '<div class="fav-row"><span class="fav-tab">' + icon(16) + '<span>Dapper Combat</span></span>' +
      '<span class="fav-sq">' + icon(32) + '</span><span class="fav-sq fav-sq--dark">' + icon(32) + '</span><span class="fav-sq fav-sq--big">' + icon(64) + '</span>' +
      '<span class="brand-bar__tag brand-bar__tag--light">' + (src ? 'Favicon riêng' : 'Favicon mặc định') + '</span></div>';
  }
  function uploadRow(k, label, cur) {
    return '<div class="set-actions">' +
      '<label class="btn btn--line file-btn">' + ICON.upload + '<span data-brand-label="' + k + '">' + esc(label) + '</span>' +
      '<input class="sr" type="file" accept="image/png,image/webp,image/jpeg,image/gif" data-brand-file="' + k + '"></label>' +
      '<button class="btn btn--quiet" type="button" data-brand-reset="' + k + '"' + (cur ? '' : ' hidden') + '>Khôi phục mặc định</button></div>';
  }
  function refreshBrand() {
    var d = draft('brand');
    var lp = $('[data-logo-prev]'); if (lp) lp.innerHTML = logoPreview(d.logo);
    var fp = $('[data-fav-prev]'); if (fp) fp.innerHTML = favPreview(d.favicon);
    ['logo', 'favicon'].forEach(function (k) { var b = $('[data-brand-reset="' + k + '"]'); if (b) b.hidden = !d[k]; });
  }
  var mapTimer = 0;
  function updateMap(now) {
    clearTimeout(mapTimer);
    mapTimer = setTimeout(function () {
      var box = $('[data-map-prev]'); if (!box) return;
      var q = String(draft('brand').mapQuery || '').trim();
      if (!q) { box.innerHTML = '<p class="map-prev__empty">Đang dùng bản đồ có sẵn trên Trang chủ.</p>'; return; }
      var src = 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed';
      var fr = $('iframe', box);
      if (fr && fr.getAttribute('src') === src) return;
      box.innerHTML = '<iframe title="Xem trước bản đồ" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
      $('iframe', box).setAttribute('src', src);
    }, now ? 0 : 700);
  }
  function probe(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file), i = new Image();
      var fin = function (d) { URL.revokeObjectURL(url); resolve(d); };
      i.onload = function () { fin([i.naturalWidth, i.naturalHeight]); };
      i.onerror = function () { fin(null); };
      i.src = url;
    });
  }
  function uploadRaw(file) {
    return fetch('/api/uploads/file', { method: 'POST', headers: { Authorization: 'Bearer ' + A.token(), 'Content-Type': file.type }, body: file })
      .then(function (res) {
        return res.json().catch(function () { return null; }).then(function (d) {
          if (res.status === 401) { A.sessionExpired(); throw { status: 401, message: 'Phiên đăng nhập đã hết hạn.' }; }
          if (!res.ok || !d || !d.url) throw { status: res.status, message: (d && d.error) || ('Tải lên thất bại (mã ' + res.status + ').') };
          return d;
        });
      }, function () { throw { status: 0, message: 'Không kết nối được máy chủ.' }; });
  }
  function setNote(k, lines, err) {
    var n = $('[data-brand-note="' + k + '"]'); if (!n) return;
    n.innerHTML = lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('');
    n.hidden = !lines.length; n.classList.toggle('is-err', !!err);
  }
  function onBrandFile(input) {
    var k = input.getAttribute('data-brand-file'), file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (!IMG_RE.test(file.type)) { setNote(k, ['Chỉ nhận ảnh PNG, JPG, WEBP hoặc GIF (không nhận SVG).'], true); return; }
    if (file.size > 10 * 1024 * 1024) { setNote(k, ['Ảnh tối đa 10MB.'], true); return; }
    var btn = input.closest('.file-btn'), lbl = $('[data-brand-label="' + k + '"]');
    var orig = lbl.textContent;
    btn.classList.add('is-busy'); input.disabled = true; lbl.textContent = 'Đang tải…';
    var lines = [];
    probe(file).then(function (d) {
      lines.push('File đã chọn: ' + (d ? num(d[0]) + ' × ' + num(d[1]) + ' px · ' : '') + num(Math.round(file.size / 1024)) + ' KB');
      if (file.type !== 'image/png' && file.type !== 'image/webp') lines.push('⚠ Nên dùng PNG nền trong suốt để ' + (k === 'logo' ? 'logo' : 'biểu tượng') + ' không bị khung trắng.');
      if (d && k === 'logo') {
        if (d[1] < 120) lines.push('⚠ Ảnh thấp hơn 120 px — có thể bị mờ trên màn hình nét cao.');
        if (d[0] / d[1] > 5.5) lines.push('⚠ Logo rất dài (ngang hơn ~5 lần chiều cao) — sẽ chiếm nhiều chỗ trên thanh menu.');
      }
      if (d && k === 'favicon') {
        if (Math.abs(d[0] - d[1]) > 2) lines.push('⚠ Ảnh không vuông — biểu tượng sẽ bị méo hoặc cắt.');
        if (Math.min(d[0], d[1]) < 192) lines.push('⚠ Nhỏ hơn 192 px — biểu tượng trên điện thoại có thể bị mờ.');
      }
      return uploadRaw(file);
    }).then(function (r) {
      var url = A.safeImg(r.url);
      if (!url) throw { message: 'Máy chủ trả về đường dẫn không hợp lệ.' };
      draft('brand')[k] = url;
      refreshBrand(); refreshBar('brand');
      lines.push('Đã tải lên — bấm “Lưu” để áp dụng lên website.');
      setNote(k, lines, false);
    }, function (e) {
      lines.push((e && e.message) || 'Tải lên thất bại.');
      setNote(k, lines, true);
    }).then(function () { btn.classList.remove('is-busy'); input.disabled = false; lbl.textContent = orig; });
  }

  // ═══ 4. Thông báo ══════════════════════════════════════════════════════════
  function notifyHtml() {
    var d = draft('notify'), s = ST.data.notify || {};
    var text = function (k, label, ph, hint, type, extra) {
      return '<label class="field"><span class="field__label">' + esc(label) + '</span>' +
        '<input type="' + (type || 'text') + '" data-text data-g="notify" data-k="' + k + '" value="' + esc(d[k] == null ? '' : d[k]) + '" placeholder="' + esc(ph || '') + '" maxlength="200" spellcheck="false" autocomplete="off"' + (extra || '') + '>' +
        (hint ? '<small class="field__hint">' + hint + '</small>' : '') + '</label>';
    };
    var secret = function (k, label, isSet, ph, clearLabel) {
      return '<div class="field"><label class="field__label" for="sec-' + k + '">' + esc(label) + '</label>' +
        '<div class="set-secret"><input id="sec-' + k + '" type="password" data-secret data-g="notify" data-k="' + k + '" value="" maxlength="300" spellcheck="false" autocomplete="new-password" placeholder="' + esc(isSet ? 'Đã cài — để trống nếu không đổi' : ph) + '">' +
        (isSet ? '<button class="btn btn--quiet btn--sm" type="button" data-clear-secret="' + k + '">' + esc(clearLabel) + '</button>' : '') + '</div>' +
        '<small class="field__hint">' + (isSet ? '<span class="badge badge--done">Đã cài</span> Giá trị không hiển thị lại để bảo mật.' : 'Chưa cài.') + '</small></div>';
    };
    return '<section class="panel cms-notify" data-notify aria-labelledby="ntTitle">' +
        '<header class="panel__head"><h2 class="panel__title" id="ntTitle">Thông báo đơn mới</h2></header>' +
        '<div class="cms-notify__body">' +
          '<p class="cms-notify__intro">Khi có đơn hàng, đăng ký khóa học hoặc yêu cầu tư vấn mới, máy chủ gửi tin kèm link mở thẳng mục đó trong trang quản trị.</p>' +
          '<dl class="cms-notify__list"><div><dt>Telegram</dt><dd data-nt="telegram">Đang kiểm tra…</dd></div><div><dt>Email</dt><dd data-nt="email">Đang kiểm tra…</dd></div></dl>' +
          '<p class="field__hint">Cài ở các ô dưới đây (hoặc trong file .env trên máy chủ: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID, SMTP_HOST + NOTIFY_EMAIL …). Lưu xong rồi bấm “Gửi thử”.</p>' +
          '<div class="cms-notify__act"><button class="btn btn--line" type="button" data-notify-test>Gửi thử</button></div>' +
          '<div class="cms-notify__res" data-notify-result role="status" hidden></div>' +
        '</div></section>' +
      panel('Địa chỉ website', text('siteUrl', 'Địa chỉ website (SITE_URL)', 'https://dappervietnam.com', 'Dùng để tạo link “mở đơn” trong tin nhắn. Bắt đầu bằng https://', 'url', ' inputmode="url"')) +
      panel('Telegram',
        '<ol class="set-steps"><li>Tạo bot với <strong>@BotFather</strong> → lấy token.</li><li>Nhắn cho bot 1 tin bất kỳ, rồi mở ' +
        '<code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> để lấy <strong>chat id</strong> (số trong “chat”: {“id”: …}).</li></ol>' +
        '<div class="set-grid2">' + secret('telegramToken', 'Bot token', s.telegramTokenSet, '123456789:AA…', 'Xóa token') +
        text('telegramChat', 'Chat id', 'VD: 123456789 hoặc -100…', 'Nhóm Telegram có chat id bắt đầu bằng -100.') + '</div>') +
      panel('Email (SMTP)',
        '<p class="set-note"><strong>Gmail:</strong> smtp.gmail.com, cổng 465, SSL bật, tài khoản là địa chỉ Gmail và dùng <strong>Mật khẩu ứng dụng</strong> (không dùng mật khẩu đăng nhập).</p>' +
        '<div class="set-grid2">' +
          text('smtpHost', 'Máy chủ SMTP', 'smtp.gmail.com') +
          '<div class="set-grid2 set-grid2--tight">' + numberField('notify', 'smtpPort', 'Cổng', 1, 65535, '', '465 (SSL) hoặc 587') +
          '<div class="field"><span class="field__label">Bảo mật</span>' + switchField('notify', 'smtpSecure', 'SSL / TLS') + '</div></div>' +
          text('smtpUser', 'Tài khoản SMTP', 'ten@gmail.com', '', 'email', ' inputmode="email"') +
          secret('smtpPass', 'Mật khẩu SMTP', s.smtpPassSet, 'Mật khẩu ứng dụng', 'Xóa mật khẩu') +
          text('mailFrom', 'Email người gửi', 'ten@gmail.com', 'Thường trùng tài khoản SMTP.', 'email', ' inputmode="email"') +
          text('notifyEmail', 'Email nhận thông báo', 'chu-shop@gmail.com', 'Email sẽ nhận tin báo đơn mới.', 'email', ' inputmode="email"') +
        '</div>') +
      panel('Mẫu tin báo cho chủ shop', '<p class="set-note">Tin gửi qua Telegram và email ở trên mỗi khi có đơn hàng, đăng ký khóa học hoặc yêu cầu tư vấn mới.</p><div data-tpl-box="templates"></div>') +
      panel('Email xác nhận gửi khách', '<p class="set-note">Chỉ gửi khi đã cài Email (SMTP) ở trên <strong>và</strong> khách có nhập email — mặc định đang tắt. Khách không có email vẫn tự tải được phiếu xác nhận ở màn hình đặt hàng thành công.</p>' +
        '<p class="set-note" data-slip-warn hidden><span class="set-warn">Biến {slip} (link phiếu xác nhận) cần điền “Địa chỉ website” ở trên — nếu trống, dòng có {slip} sẽ bị bỏ.</span></p>' +
        '<div data-tpl-box="customer"></div>');
  }
  function notifyErrors() {
    var d = draft('notify'), out = [];
    if (d.siteUrl && !/^https?:\/\/[^\s"'<>]+$/.test(d.siteUrl)) out.push(['siteUrl', 'Địa chỉ website phải bắt đầu bằng https:// (hoặc http://).']);
    ['smtpUser', 'mailFrom', 'notifyEmail'].forEach(function (k) {
      if (d[k] && k !== 'smtpUser' && !EMAIL_RE.test(d[k])) out.push([k, 'Email chưa đúng định dạng: ' + d[k]]);
    });
    if (d.telegramChat && !/^-?\d{3,20}$|^@[\w]{4,}$/.test(d.telegramChat)) out.push(['telegramChat', 'Chat id là một dãy số (nhóm bắt đầu bằng -100) hoặc @tên_kênh.']);
    if (!(d.smtpPort >= 1 && d.smtpPort <= 65535)) out.push(['smtpPort', 'Cổng SMTP từ 1 đến 65535.']);
    return out;
  }
  function loadStatus() {
    A.api('/notify/status').then(function (st) {
      ST.status = st || {};
      if (view() === SCREENS.notify.view) renderTpls();
      ['telegram', 'email'].forEach(function (k) {
        var dd = $('[data-nt="' + k + '"]'); if (!dd) return;
        dd.innerHTML = st && st[k] ? '<span class="badge badge--done">Đã cài</span>' : '<span class="badge badge--off">Chưa cài</span>';
      });
    }, function (e) {
      $$('[data-nt]').forEach(function (dd) { dd.textContent = 'Không kiểm tra được'; });
      A.apiFail(e);
    });
  }
  function testNotify(btn) {
    var box = $('[data-notify-result]');
    if (dirtyCount('notify')) { A.toast('Hãy bấm “Lưu” trước khi gửi thử — máy chủ dùng cài đặt đã lưu.', 'info'); }
    busy(btn, true);
    A.api('/notify/test', { method: 'POST' }).then(function (r) {
      busy(btn, false);
      var names = { telegram: 'Telegram', email: 'Email' }, lines = [], allOk = true;
      Object.keys(r || {}).forEach(function (k) {
        var ok = r[k] === 'ok'; if (!ok) allOk = false;
        lines.push('<p class="' + (ok ? 'is-ok' : 'is-err') + '">' + esc(names[k] || k) + ': ' + (ok ? 'đã gửi tin thử ✓' : esc(r[k])) + '</p>');
      });
      if (box) { box.innerHTML = lines.join('') || '<p>Không có kênh nào phản hồi.</p>'; box.hidden = false; box.classList.toggle('has-err', !allOk); }
      A.toast(allOk ? 'Đã gửi tin thử — kiểm tra Telegram / hộp thư.' : 'Có kênh gửi thử bị lỗi — xem chi tiết trong thẻ.', allOk ? 'ok' : 'err');
    }, function (e) {
      busy(btn, false);
      if (box && e.status !== 401 && e.status !== 403) { box.innerHTML = '<p class="is-err">' + esc(e.message) + '</p>'; box.hidden = false; box.classList.add('has-err'); }
    });
  }
  function clearSecret(btn) {
    var k = btn.getAttribute('data-clear-secret');
    var what = k === 'telegramToken' ? 'token Telegram' : 'mật khẩu SMTP';
    A.confirmDialog({ title: 'Xóa ' + what + '?', body: 'Kênh này sẽ ngừng gửi thông báo cho tới khi bạn nhập lại.', ok: 'Xóa', cancel: 'Quay lại' }).then(function (yes) {
      if (!yes) return;
      var patch = { notify: {} }; patch.notify[k] = null;
      busy(btn, true);
      A.api('/settings', { method: 'PUT', body: patch }).then(function (d) {
        var keep = clone(ST.draft.notify);
        ST.data = d; initDraft('notify');
        // giữ những gì đang gõ dở ở các ô khác
        KEYS.notify.forEach(function (x) { if (x !== k && keep && keep[x] !== undefined) ST.draft.notify[x] = keep[x]; });
        ST.draft.notify[k] = '';
        render('notify', 'after');
        A.toast('Đã xóa ' + what + '.');
      }, function (e) { busy(btn, false); A.apiFail(e); });
    });
  }

  // ═══ Mẫu tin (Thông báo) ═══════════════════════════════════════════════════
  // G = 'templates' (báo chủ shop) | 'customer' (email xác nhận cho khách); mỗi G có một tab đang mở
  function tplField(G) { return G === 'templates' ? 'title' : 'subject'; }
  function tplDef(G, kind) { var d = ST.data && ST.data.defaults && ST.data.defaults.notify; return d && d[G] ? d[G][kind] : null; }
  function sameTpl(a, b) { return !!a && !!b && !!a.on === !!b.on && String(a.title || a.subject || '') === String(b.title || b.subject || '') && String(a.body || '') === String(b.body || ''); }
  function tplSaved(G, kind) { var n = ST.data && ST.data.notify; return n && n[G] ? n[G][kind] : null; }
  function renderTpls() { renderTpl('templates'); renderTpl('customer'); slipWarn(); }
  function slipWarn() { var w = $('[data-slip-warn]'); if (w) w.hidden = !!String(draft('notify').siteUrl || '').trim(); }
  function renderTpl(G) {
    var box = $('[data-tpl-box="' + G + '"]'); if (!box) return;
    var kinds = TPL_KINDS[G], tab = ST.tplTab[G];
    if (!kinds.some(function (k) { return k[0] === tab; })) tab = ST.tplTab[G] = kinds[0][0];
    var d = (draft('notify')[G] || {})[tab] || {}, f1 = tplField(G), def = tplDef(G, tab);
    var vars = ST.status && ST.status.vars ? ST.status.vars[tab] || [] : null;
    box.innerHTML = '<div class="tpl-tabs" role="tablist">' + kinds.map(function (k) {
        var on = k[0] === tab, t = (draft('notify')[G] || {})[k[0]] || {};
        return '<button type="button" role="tab" class="tpl-tab' + (on ? ' is-active' : '') + '" aria-selected="' + on + '" data-tpl-tab="' + k[0] + '">' + esc(k[1]) +
          '<small>' + (t.on ? 'Đang bật' : 'Đang tắt') + '</small></button>';
      }).join('') + '</div>' +
      '<div class="tpl" data-tpl="' + G + '" data-kind="' + esc(tab) + '">' +
        '<div class="tpl__top"><label class="check set-switch"><input type="checkbox" data-tpl-on' + (d.on ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span>' +
          (G === 'templates' ? 'Gửi tin này cho chủ shop' : 'Gửi email này cho khách') + '</span></label>' +
          (sameTpl(d, def) ? '' : '<span class="badge badge--mid">Đã sửa</span>') + '<span class="spacer"></span>' +
          '<button class="btn btn--line btn--sm" type="button" data-tpl-test>Gửi thử mẫu này</button>' +
          (sameTpl(d, def) ? '' : '<button class="btn btn--quiet btn--sm" type="button" data-tpl-reset>Khôi phục mẫu gốc</button>') + '</div>' +
        '<div class="tpl__grid"><div class="tpl__edit">' +
          '<label class="field"><span class="field__label">' + (G === 'templates' ? 'Tiêu đề tin' : 'Tiêu đề email') + '</span>' +
            '<input type="text" maxlength="200" data-tpl-f="' + f1 + '" value="' + esc(d[f1] || '') + '" autocomplete="off"></label>' +
          '<label class="field"><span class="field__label">Nội dung</span><textarea rows="11" maxlength="4000" data-tpl-f="body" spellcheck="false">' + esc(d.body || '') + '</textarea></label>' +
          '<p class="field__hint">Mỗi dòng một ý. ' + (G === 'templates' ? 'Dòng dạng “Nhãn: {biến}” sẽ in đậm phần giá trị. ' : '') +
            '<strong>Dòng có {biến} mà biến nào cũng trống</strong> (vd khách không nhập email) <strong>sẽ tự bỏ</strong> khi gửi.</p>' +
          (G === 'customer' ? '<details class="tpl-en"><summary>Bản tiếng Anh — AI tự dịch, gửi cho khách đặt bằng tiếng Anh</summary>' +
            (d.subjectEn && d.bodyEn ? '<p class="field__label">Tiêu đề</p><p>' + esc(d.subjectEn) + '</p><p class="field__label">Nội dung</p><pre class="tpl-en__body">' + esc(d.bodyEn) + '</pre>'
              : '<p class="field__hint">Chưa có bản tiếng Anh (AI đang dịch hoặc chưa cài khóa ở <a href="#/cms-ai">Tiếng Anh (AI)</a>) — khách đặt bằng tiếng Anh tạm nhận bản tiếng Việt.</p>') +
            '<p class="field__hint">Sửa mẫu tiếng Việt rồi bấm Lưu là AI dịch lại bản này.</p></details>' : '') +
          '<div class="tpl__vars"><span class="field__label">Bấm để chèn biến vào chỗ con trỏ</span><div class="tpl__chips">' + (vars ? vars.map(function (v) {
            var hint = VAR_HINT[v] || '';
            return '<button type="button" class="tpl-var" data-tpl-var="' + esc(v) + '" title="' + esc(hint + (v === 'slip' ? ' — cần “Địa chỉ website”' : '')) + '">{' + esc(v) + '}' + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</button>';
          }).join('') : '<span class="field__hint">Đang tải danh sách biến…</span>') + '</div></div>' +
        '</div><div class="tpl__prev"><p class="field__label">Xem trước với dữ liệu mẫu (không gửi)</p><div class="tpl-prev' + (G === 'customer' ? ' tpl-prev--mail' : '') + '" data-tpl-prev aria-live="polite"><p class="field__hint">Đang tạo bản xem trước…</p></div></div></div>' +
        '<div class="set-msg" data-tpl-msg role="status" hidden></div>' +
      '</div>';
    tplPreview(G, true);
  }
  var prevTimer = {}, prevSeq = 0;
  function tplPreview(G, now) {
    clearTimeout(prevTimer[G]);
    prevTimer[G] = setTimeout(function () {
      var box = $('[data-tpl="' + G + '"]'); if (!box) return;
      var tab = box.getAttribute('data-kind'), d = (draft('notify')[G] || {})[tab] || {}, f1 = tplField(G), seq = ++prevSeq;
      var body = { kind: tab, body: d.body || '' }; body[f1] = d[f1] || '';
      A.api('/notify/preview', { method: 'POST', body: body }).then(function (r) {
        var box2 = $('[data-tpl="' + G + '"][data-kind="' + tab + '"] [data-tpl-prev]'); if (!box2 || seq < (box2._seq || 0)) return;
        box2._seq = seq;
        var lines = (r && Array.isArray(r.lines)) ? r.lines : [];
        box2.innerHTML = '<p class="tpl-prev__title">' + esc((r && r.title) || '(chưa có tiêu đề)') + '</p>' + (G === 'templates'
          ? lines.map(function (l) { var i = String(l).indexOf(': '); return i > 0 && i < 40 ? '<p>' + esc(l.slice(0, i)) + ': <b>' + esc(l.slice(i + 2)) + '</b></p>' : '<p>' + (esc(l) || '&nbsp;') + '</p>'; }).join('')
          : '<p>' + lines.map(function (l) { return l ? esc(l) : '&nbsp;'; }).join('<br>') + '</p>') +
          (lines.length ? '' : '<p class="field__hint">(Không còn dòng nào — kiểm tra lại nội dung.)</p>');
      }, function (e) {
        var box2 = $('[data-tpl="' + G + '"] [data-tpl-prev]'); if (box2 && e && e.status !== 401) box2.innerHTML = '<p class="set-warn">Không xem trước được: ' + esc(e.message) + '</p>';
      });
    }, now ? 0 : 350);
  }
  function tplTest(G, btn) {
    var box = btn.closest('[data-tpl]'), kind = box.getAttribute('data-kind'), msg = $('[data-tpl-msg]', box);
    var say = function (html, err) { msg.innerHTML = html; msg.hidden = !html; msg.classList.toggle('is-err', !!err); };
    var dirty = !sameTpl((draft('notify')[G] || {})[kind], tplSaved(G, kind));
    busy(btn, true);
    A.api('/notify/test', { method: 'POST', body: G === 'customer' ? { kind: kind, customer: true } : { kind: kind } }).then(function (r) {
      busy(btn, false);
      var names = { telegram: 'Telegram', email: 'Email' }, lines = [], allOk = true;
      Object.keys(r || {}).forEach(function (k) { var ok = r[k] === 'ok'; if (!ok) allOk = false; lines.push('<p>' + esc(names[k] || k) + ': ' + (ok ? 'đã gửi tin thử ✓' : esc(r[k])) + '</p>'); });
      say((dirty ? '<p><strong>Lưu ý:</strong> gửi thử dùng mẫu đã lưu — thay đổi đang sửa chưa được gửi.</p>' : '') + (lines.join('') || '<p>Không có kênh nào phản hồi.</p>') +
        (G === 'customer' ? '<p class="field__hint">Email thử gửi tới “Email nhận thông báo” của shop.</p>' : ''), !allOk);
    }, function (e) { busy(btn, false); if (e && e.status !== 401 && e.status !== 403) say('<p>' + esc(e.message) + '</p>', true); });
  }
  function insertVar(G, v) {
    var box = $('[data-tpl="' + G + '"]'); if (!box) return;
    var el = $('[data-tpl-f="' + (ST.tplFocus[G] || 'body') + '"]', box) || $('[data-tpl-f="body"]', box);
    var ins = '{' + v + '}', s = el.selectionStart == null ? el.value.length : el.selectionStart, e2 = el.selectionEnd == null ? s : el.selectionEnd;
    el.value = el.value.slice(0, s) + ins + el.value.slice(e2);
    el.focus();
    try { el.setSelectionRange(s + ins.length, s + ins.length); } catch (er) { /* bỏ qua */ }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function validateTpls() {
    var n = draft('notify'), out = null;
    ['templates', 'customer'].forEach(function (G) {
      TPL_KINDS[G].forEach(function (k) {
        var t = (n[G] || {})[k[0]] || {};
        if (out) return;
        if (!String(t[tplField(G)] || '').trim()) out = { G: G, kind: k[0], f: tplField(G), err: (G === 'templates' ? 'Mẫu tin “' : 'Email khách “') + k[1] + '” chưa có tiêu đề.' };
        else if (!String(t.body || '').trim()) out = { G: G, kind: k[0], f: 'body', err: (G === 'templates' ? 'Mẫu tin “' : 'Email khách “') + k[1] + '” chưa có nội dung.' };
      });
    });
    return out;
  }

  // ═══ Lưu / hủy ═════════════════════════════════════════════════════════════
  function payload(g) {
    var src = ST.draft[g], d = {};
    changed(g).forEach(function (k) { d[k] = clone(src[k]); });
    if (g === 'notify') {
      ['telegramToken', 'smtpPass'].forEach(function (k) { if (d[k] !== undefined) d[k] = String(d[k] || '').trim(); });
      ['templates', 'customer'].forEach(function (G) {
        if (!d[G]) return;
        var saved = (ST.data.notify || {})[G] || {}, out = {};
        Object.keys(d[G]).forEach(function (kind) {
          if (sameTpl(d[G][kind], saved[kind])) return;
          out[kind] = sameTpl(d[G][kind], tplDef(G, kind)) ? null : d[G][kind];
        });
        d[G] = out;
      });
    }
    if (g === 'shop' && d.promos) d.promos = d.promos.map(function (p) { return { code: p.code, type: p.type, value: p.type === 'freeship' ? 0 : p.value, active: !!p.active, expires: p.expires || '', maxUses: Number(p.maxUses) || 0, minOrder: Number(p.minOrder) || 0 }; });
    if (g === 'course' && d.gtPackages) d.gtPackages = d.gtPackages.map(function (k) { return { months: k.months, price: k.price, note: k.note || { vi: '', en: '' }, label: k.label || { vi: '', en: '' }, best: !!k.best }; });
    return d;
  }
  function save(g, btn) {
    if (g === 'shop') {
      var v = validatePromos(true);
      if (v.err) { A.toast(v.err, 'err'); var row = $('[data-promo="' + v.idx + '"] input'); if (row) row.focus(); return; }
    }
    if (g === 'course') {
      var pv = validatePkgs(), rv = validateRows(), pe = $('[data-pk-err]'), re = $('[data-sr-err]');
      if (pe) { pe.textContent = pv ? pv.err : ''; pe.hidden = !pv; }
      if (re) { re.textContent = rv ? rv.err : ''; re.hidden = !rv; }
      if (pv || rv) {
        var bad = pv || rv; A.toast(bad.err, 'err');
        var fe = pv ? $('[data-pk="' + pv.idx + '"] [data-pkf="' + (pv.f || 'months') + '"]') : $('[data-sr="' + rv.idx + '"] [data-srf="time"]');
        if (fe) { fe.classList.add('is-invalid'); fe.focus(); fe.scrollIntoView({ block: 'center' }); }
        return;
      }
    }
    if (g === 'notify') {
      var tv = validateTpls();
      if (tv) {
        A.toast(tv.err, 'err');
        if (ST.tplTab[tv.G] !== tv.kind) { ST.tplTab[tv.G] = tv.kind; renderTpl(tv.G); }
        var tf = $('[data-tpl="' + tv.G + '"] [data-tpl-f="' + tv.f + '"]'); if (tf) { tf.classList.add('is-invalid'); tf.focus(); tf.scrollIntoView({ block: 'center' }); }
        return;
      }
      var errs = notifyErrors();
      $$('[data-g="notify"]').forEach(function (n) { n.classList.remove('is-invalid'); });
      if (errs.length) {
        errs.forEach(function (x) { var n = $('[data-g="notify"][data-k="' + x[0] + '"]'); if (n) n.classList.add('is-invalid'); });
        A.toast(errs[0][1], 'err');
        var f0 = $('[data-g="notify"][data-k="' + errs[0][0] + '"]'); if (f0) f0.focus();
        return;
      }
    }
    var body = {}; body[g] = payload(g);
    busy(btn, true);
    A.api('/settings', { method: 'PUT', body: body }).then(function (d) {
      ST.data = d; ST.loadedAt = Date.now();
      syncCats();
      initDraft(g);
      busy(btn, false);
      render(g, 'after');
      var link = SCREENS[g].link;
      A.toast(SCREENS[g].ok, 'ok', link ? { href: link, label: 'Xem trang ↗' } : null);
    }, function (e) { busy(btn, false); A.apiFail(e); });
  }
  function discard(g) {
    if (!dirtyCount(g)) return;
    A.confirmDialog({ title: 'Bỏ ' + dirtyCount(g) + ' thay đổi chưa lưu?', body: 'Các ô sẽ trở lại như lần lưu gần nhất.', ok: 'Bỏ thay đổi', cancel: 'Quay lại' }).then(function (yes) {
      if (!yes) return;
      initDraft(g); render(g, 'after');
    });
  }

  // ═══ Sự kiện ═══════════════════════════════════════════════════════════════
  function screenOf() { var v = view(); for (var g in SCREENS) if (SCREENS[g].view === v) return g; return ''; }
  function setDraft(g, k, v) { setPath(draft(g), k, v); }
  document.addEventListener('input', function (e) {
    var t = e.target; if (!(t instanceof Element)) return;
    var g = screenOf(); if (!g || !$('[data-set-root]') || !$('[data-set-root]').contains(t)) return;
    if (t.matches('[data-money]')) { setDraft(t.getAttribute('data-g'), t.getAttribute('data-k'), formatMoneyInput(t)); }
    else if (t.matches('[data-int]')) { var n = t.value === '' ? 0 : Math.round(Number(t.value) || 0); setDraft(t.getAttribute('data-g'), t.getAttribute('data-k'), n); }
    else if (t.matches('[data-text], [data-secret]')) {
      var val = t.value;
      if (t.getAttribute('data-g') === 'notify' && !t.matches('[data-secret]')) val = val.replace(/\s/g, '');
      setDraft(t.getAttribute('data-g'), t.getAttribute('data-k'), t.matches('[data-secret]') ? val : val.trim() === '' ? '' : (t.getAttribute('data-k') === 'mapQuery' ? val : val));
      t.classList.remove('is-invalid');
      if (t.getAttribute('data-k') === 'mapQuery') updateMap(false);
    } else if (t.closest('[data-promo]') && t.matches('[data-pf]')) {
      var row = t.closest('[data-promo]'), i = +row.getAttribute('data-promo'), p = draft('shop').promos[i], f = t.getAttribute('data-pf');
      if (f === 'code') {
        var up = t.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        if (up !== t.value) { var pos = Math.max(0, (t.selectionStart || 0) - (t.value.length - up.length)); t.value = up; try { t.setSelectionRange(pos, pos); } catch (er) { /* bỏ qua */ } }
        p.code = up;
        var del = $('[data-promo-del]', row); if (del) del.setAttribute('aria-label', 'Xóa mã ' + up);
      } else if (f === 'value') {
        p.value = t.hasAttribute('data-money-plain') ? formatMoneyInput(t) : Math.min(100, Math.max(0, Math.round(Number(t.value) || 0)));
      } else if (f === 'minOrder') p.minOrder = formatMoneyInput(t);
      else if (f === 'maxUses') p.maxUses = t.value === '' ? 0 : Math.max(0, Math.round(Number(t.value) || 0));
      else if (f === 'expires') p.expires = /^\d{4}-\d{2}-\d{2}$/.test(t.value) ? t.value : '';
      if (f === 'maxUses' || f === 'expires') { var ut = $('.promo__used', row); if (ut) ut.innerHTML = promoUsedText(p); }
      validatePromos(!!$('[data-promo-err]:not([hidden])'));
    }
    if (g === 'course') updateCourseCalc();
    refreshBar(g);
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!(t instanceof Element)) return;
    var g = screenOf(); if (!g || !$('[data-set-root]') || !$('[data-set-root]').contains(t)) return;
    if (t.matches('[data-bool]')) setDraft(t.getAttribute('data-g'), t.getAttribute('data-k'), t.checked);
    else if (t.matches('[data-brand-file]')) { onBrandFile(t); return; }
    else if (t.closest('[data-promo]') && t.matches('[data-pf]')) {
      var row = t.closest('[data-promo]'), p = draft('shop').promos[+row.getAttribute('data-promo')], f = t.getAttribute('data-pf');
      if (f === 'type') {
        var was = p.type; p.type = t.value;
        if (p.type === 'pct' && was !== 'pct') p.value = Math.min(100, p.value) || 10;
        if (p.type === 'fixed' && was !== 'fixed') p.value = p.value > 100 ? p.value : 50000;
        if (p.type === 'freeship') p.value = 0;
        renderPromos();
        var sel = $('[data-promo="' + row.getAttribute('data-promo') + '"] [data-pf="type"]'); if (sel) sel.focus();
      } else if (f === 'active') { p.active = t.checked; renderPromos(); var c = $('[data-promo="' + row.getAttribute('data-promo') + '"] [data-pf="active"]'); if (c) c.focus(); }
    } else if (t.matches('[data-int]')) {
      var mn = +t.min, mx = +t.max, v = Math.round(Number(t.value) || 0);
      if (t.value !== '' && (v < mn || v > mx)) { v = Math.min(mx, Math.max(mn, v)); t.value = v; setDraft(t.getAttribute('data-g'), t.getAttribute('data-k'), v); }
    }
    if (g === 'course') updateCourseCalc();
    refreshBar(g);
  });
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null; if (!t) return;
    var g = screenOf(); if (!g) return;
    var n;
    if ((n = t.closest('[data-set-save]'))) { save(n.getAttribute('data-set-save'), n); return; }
    if ((n = t.closest('[data-set-discard]'))) { discard(n.getAttribute('data-set-discard')); return; }
    if ((n = t.closest('[data-notify-test]'))) { testNotify(n); return; }
    if ((n = t.closest('[data-clear-secret]'))) { clearSecret(n); return; }
    if ((n = t.closest('[data-promo-add]'))) {
      var list = draft('shop').promos = draft('shop').promos || [];
      list.push({ code: '', type: 'pct', value: 10, active: true });
      renderPromos(); refreshBar('shop');
      var inp = $('[data-promo="' + (list.length - 1) + '"] [data-pf="code"]'); if (inp) inp.focus();
      return;
    }
    if ((n = t.closest('[data-promo-del]'))) {
      var i = +n.closest('[data-promo]').getAttribute('data-promo'), pr = draft('shop').promos[i];
      var go = function () { draft('shop').promos.splice(i, 1); renderPromos(); refreshBar('shop'); };
      if (pr && pr.code) A.confirmDialog({ title: 'Xóa mã “' + pr.code + '”?', body: 'Khách sẽ không dùng được mã này nữa (sau khi bấm Lưu). Nếu chỉ muốn tạm ngừng, hãy tắt mã.', ok: 'Xóa mã', cancel: 'Quay lại' }).then(function (yes) { if (yes) go(); });
      else go();
      return;
    }
    if ((n = t.closest('[data-hp-move], [data-hp-del]'))) {
      var ids = draft('shop').homeProducts, li = n.closest('[data-hp-id]'), id = li.getAttribute('data-hp-id'), at = ids.indexOf(id);
      if (n.hasAttribute('data-hp-del')) ids.splice(at, 1);
      else { var to = at + (+n.getAttribute('data-hp-move')); if (to >= 0 && to < ids.length) { ids.splice(at, 1); ids.splice(to, 0, id); } }
      renderHome(); refreshBar('shop');
      var again = $('[data-hp-id="' + CSS.escape(id) + '"] [data-hp-move="' + n.getAttribute('data-hp-move') + '"]');
      if (again && !again.disabled) again.focus();
      return;
    }
    if ((n = t.closest('[data-hp-add]'))) {
      var sel = $('[data-hp-select]'), pid = sel && sel.value, arr = draft('shop').homeProducts;
      if (!pid) { if (sel) sel.focus(); A.toast('Chọn một sản phẩm trong danh sách trước.', 'info'); return; }
      if (arr.length >= HOME_SLOTS || arr.indexOf(pid) >= 0) return;
      arr.push(pid); renderHome(); refreshBar('shop');
      return;
    }
    if ((n = t.closest('[data-brand-reset]'))) {
      var k = n.getAttribute('data-brand-reset');
      draft('brand')[k] = ''; refreshBrand(); refreshBar('brand'); setNote(k, ['Sẽ dùng ' + (k === 'logo' ? 'logo' : 'favicon') + ' mặc định sau khi bấm “Lưu”.'], false);
    }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && screenOf()) {
      var b = $('.savebar:not([hidden]) [data-set-save]');
      if (b) { e.preventDefault(); b.click(); }
    }
  });

  // ── sự kiện: gói GT, lịch tập, trang thanh toán, mẫu tin ──
  function inRoot(t) { var r = $('[data-set-root]'); return !!r && r.contains(t); }
  document.addEventListener('input', function (e) {
    var t = e.target; if (!(t instanceof Element) || !inRoot(t)) return;
    var g = screenOf(), row, f;
    if (g === 'course' && (row = t.closest('[data-pk]')) && t.matches('[data-pkf]')) {
      var k = draft('course').gtPackages[+row.getAttribute('data-pk')]; f = t.getAttribute('data-pkf'); if (!k) return;
      if (f === 'months') k.months = t.value === '' ? 0 : Math.round(Number(t.value) || 0);
      else if (f === 'price') k.price = formatMoneyInput(t);
      else if (f !== 'best') setPath(k, f, t.value);
      t.classList.remove('is-invalid');
      var pe = $('[data-pk-err]'); if (pe) pe.hidden = true;
      updatePkgCalc(); refreshBar('course');
    } else if (g === 'course' && (row = t.closest('[data-sr]')) && t.matches('input[data-srf]')) {
      var r = draft('course').scheduleRows[+row.getAttribute('data-sr')]; if (!r) return;
      setPath(r, t.getAttribute('data-srf'), t.value);
      var ti = $('[data-sr-title]', row); if (ti) ti.textContent = srTitle(r);
      var se = $('[data-sr-err]'); if (se) se.hidden = true;
      renderRowPreview(); refreshBar('course');
    } else if (g === 'notify' && t.matches('[data-tpl-f]')) {
      var box = t.closest('[data-tpl]'), G = box.getAttribute('data-tpl'), kind = box.getAttribute('data-kind');
      setPath(draft('notify'), G + '.' + kind + '.' + t.getAttribute('data-tpl-f'), t.value);
      t.classList.remove('is-invalid');
      tplPreview(G); refreshBar('notify');
    } else if (g === 'notify' && t.matches('[data-k="siteUrl"]')) slipWarn();
  });
  document.addEventListener('focusin', function (e) {
    var t = e.target; if (!(t instanceof Element) || screenOf() !== 'notify' || !t.matches('[data-tpl-f]')) return;
    ST.tplFocus[t.closest('[data-tpl]').getAttribute('data-tpl')] = t.getAttribute('data-tpl-f');
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!(t instanceof Element) || !inRoot(t)) return;
    var g = screenOf(), row, i;
    if (g === 'shop' && t.matches('[data-ck-pay]')) {
      var pay = draft('shop').checkout.pay, key = t.getAttribute('data-ck-pay');
      pay[key] = t.checked;
      if (!pay.bank && !pay.momo && !pay.zalopay) pay[key] = true; // không cho tắt cách quét mã cuối cùng
      renderCheckout('[data-ck-pay="' + key + '"]'); refreshBar('shop');
    } else if (g === 'shop' && t.matches('[data-ck]')) {
      draft('shop').checkout[t.getAttribute('data-ck')] = t.value; refreshBar('shop');
    } else if (g === 'course' && (row = t.closest('[data-pk]')) && t.matches('[data-pkf]')) {
      var list = draft('course').gtPackages; i = +row.getAttribute('data-pk');
      if (t.getAttribute('data-pkf') === 'best') {
        list.forEach(function (k, j) { k.best = j === i ? t.checked : false; });
        renderPkgs('[data-pk="' + i + '"] [data-pkf="best"]'); refreshBar('course');
      } else if (t.getAttribute('data-pkf') === 'months' && t.value !== '') {
        var m = Math.min(60, Math.max(1, Math.round(Number(t.value) || 1))); list[i].months = m; t.value = m;
        renderPkgs('[data-pk="' + i + '"] [data-pkf="months"]'); refreshBar('course');
      }
    } else if (g === 'course' && (row = t.closest('[data-sr]'))) {
      var r = draft('course').scheduleRows[i = +row.getAttribute('data-sr')]; if (!r) return;
      if (t.matches('[data-srday]')) { r.days[+t.getAttribute('data-srday')] = t.checked ? 1 : 0; renderRowPreview(); }
      else if (t.matches('select[data-srf]')) {
        var f = t.getAttribute('data-srf');
        r[f] = t.value;
        if (f === 'prog') r.opt = OPTS[r.prog] ? OPTS[r.prog][0][0] : '';
        if (f !== 'opt') renderRows('[data-sr="' + i + '"] [data-srf="' + f + '"]'); else renderRowPreview();
      }
      refreshBar('course');
    } else if (g === 'notify' && t.matches('[data-tpl-on]')) {
      var box = t.closest('[data-tpl]'), G = box.getAttribute('data-tpl');
      setPath(draft('notify'), G + '.' + box.getAttribute('data-kind') + '.on', t.checked);
      refreshBar('notify');
      var tab = $('[data-tpl-box="' + G + '"] .tpl-tab.is-active small'); if (tab) tab.textContent = t.checked ? 'Đang bật' : 'Đang tắt';
    }
  });
  document.addEventListener('mousedown', function (e) {
    // bấm chip biến không làm mất vị trí con trỏ trong ô đang gõ
    if (e.target instanceof Element && e.target.closest('[data-tpl-var]') && screenOf() === 'notify') e.preventDefault();
  });
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null; if (!t || !inRoot(t)) return;
    var g = screenOf(), n, i, list, to;
    if (g === 'course') {
      if ((n = t.closest('[data-pk-move]'))) {
        list = draft('course').gtPackages; i = +n.closest('[data-pk]').getAttribute('data-pk'); to = i + (+n.getAttribute('data-pk-move'));
        if (to < 0 || to >= list.length) return;
        list.splice(to, 0, list.splice(i, 1)[0]);
        renderPkgs('[data-pk="' + to + '"] [data-pk-move="' + n.getAttribute('data-pk-move') + '"]:not([disabled])'); refreshBar('course'); return;
      }
      if ((n = t.closest('[data-pk-del]'))) {
        list = draft('course').gtPackages; i = +n.closest('[data-pk]').getAttribute('data-pk');
        if (list.length <= 1) return;
        var k = list[i];
        A.confirmDialog({ title: 'Xóa ' + pkTitle(k).toLowerCase() + '?', body: 'Thẻ giá và lựa chọn trong form đăng ký của gói này sẽ biến mất sau khi bấm “Lưu”. Chữ có {gt.' + (k.months || 'N') + '} sẽ không còn giá để điền.', ok: 'Xóa gói', cancel: 'Quay lại' })
          .then(function (yes) { if (!yes) return; list.splice(list.indexOf(k), 1); renderPkgs(); refreshBar('course'); var a = $('[data-pk-add]'); if (a) a.focus(); });
        return;
      }
      if (t.closest('[data-pk-add]')) {
        list = draft('course').gtPackages; if (list.length >= MAX_PKG) return;
        var used = list.map(function (x) { return x.months; }), m = [1, 3, 6, 12, 18, 24, 36, 48, 60].filter(function (x) { return used.indexOf(x) < 0; })[0];
        if (!m) for (m = 1; used.indexOf(m) >= 0 && m < 60; m++) { /* tìm số tháng còn trống */ }
        list.push({ months: m, price: 0, note: { vi: '', en: '' }, label: { vi: '', en: '' }, best: false });
        renderPkgs('[data-pk="' + (list.length - 1) + '"] [data-pkf="price"]'); refreshBar('course'); return;
      }
      if (t.closest('[data-pk-reset]')) {
        A.confirmDialog({ title: 'Khôi phục gói mặc định?', body: 'Danh sách gói trở về 4 gói gốc (1, 3, 6, 12 tháng) với giá ban đầu. Bấm “Lưu” để áp dụng.', ok: 'Khôi phục', cancel: 'Quay lại' })
          .then(function (yes) { if (!yes) return; draft('course').gtPackages = defaultsOf('course', 'gtPackages') || []; renderPkgs(); refreshBar('course'); });
        return;
      }
      if ((n = t.closest('[data-sr-move]'))) {
        list = draft('course').scheduleRows; i = +n.closest('[data-sr]').getAttribute('data-sr'); to = i + (+n.getAttribute('data-sr-move'));
        if (to < 0 || to >= list.length) return;
        list.splice(to, 0, list.splice(i, 1)[0]);
        renderRows('[data-sr="' + to + '"] [data-sr-move="' + n.getAttribute('data-sr-move') + '"]:not([disabled])'); refreshBar('course'); return;
      }
      if ((n = t.closest('[data-sr-dup]'))) {
        list = draft('course').scheduleRows; i = +n.closest('[data-sr]').getAttribute('data-sr'); if (list.length >= MAX_ROWS) return;
        list.splice(i + 1, 0, clone(list[i]));
        renderRows('[data-sr="' + (i + 1) + '"] [data-srf="time"]'); refreshBar('course'); return;
      }
      if ((n = t.closest('[data-sr-del]'))) {
        list = draft('course').scheduleRows; i = +n.closest('[data-sr]').getAttribute('data-sr');
        var r = list[i], go = function () { list.splice(list.indexOf(r), 1); renderRows(); refreshBar('course'); var a = $('[data-sr-add]'); if (a) a.focus(); };
        if (r.time || (r.name && r.name.vi)) A.confirmDialog({ title: 'Xóa lớp “' + srTitle(r) + '”?', body: 'Hàng này sẽ biến mất khỏi bảng lịch tập sau khi bấm “Lưu”.', ok: 'Xóa lớp', cancel: 'Quay lại' }).then(function (yes) { if (yes) go(); });
        else go();
        return;
      }
      if (t.closest('[data-sr-add]')) {
        list = draft('course').scheduleRows; if (list.length >= MAX_ROWS) return;
        list.push(blankRow());
        renderRows('[data-sr="' + (list.length - 1) + '"] [data-srf="time"]'); refreshBar('course'); return;
      }
      if (t.closest('[data-sr-reset]')) {
        A.confirmDialog({ title: 'Khôi phục lịch mặc định?', body: 'Bảng lịch trở về 5 lớp gốc. Bấm “Lưu” để áp dụng.', ok: 'Khôi phục', cancel: 'Quay lại' })
          .then(function (yes) { if (!yes) return; draft('course').scheduleRows = defaultsOf('course', 'scheduleRows') || []; renderRows(); refreshBar('course'); });
        return;
      }
    }
    if (g === 'notify') {
      var box = t.closest('[data-tpl-box]'), G = box && box.getAttribute('data-tpl-box');
      if (!G) return;
      if ((n = t.closest('[data-tpl-tab]'))) { ST.tplTab[G] = n.getAttribute('data-tpl-tab'); renderTpl(G); var b = $('[data-tpl-box="' + G + '"] [data-tpl-tab="' + ST.tplTab[G] + '"]'); if (b) b.focus(); return; }
      if ((n = t.closest('[data-tpl-var]'))) { insertVar(G, n.getAttribute('data-tpl-var')); return; }
      if ((n = t.closest('[data-tpl-test]'))) { tplTest(G, n); return; }
      if (t.closest('[data-tpl-reset]')) {
        var kind = ST.tplTab[G];
        A.confirmDialog({ title: 'Khôi phục mẫu gốc?', body: 'Tiêu đề, nội dung và trạng thái bật / tắt của mẫu này trở về như ban đầu. Bấm “Lưu” để áp dụng.', ok: 'Khôi phục', cancel: 'Quay lại' })
          .then(function (yes) { if (!yes) return; setPath(draft('notify'), G + '.' + kind, clone(tplDef(G, kind))); renderTpl(G); refreshBar('notify'); });
      }
    }
  });

  // ═══ Đăng ký màn hình ══════════════════════════════════════════════════════
  Object.keys(SCREENS).forEach(function (g) {
    A.register(SCREENS[g].view, {
      title: SCREENS[g].title,
      mount: function (main) { mount(g, main); },
      update: function (main, manual) {
        if (!manual) return;
        if (dirtyCount(g)) { A.toast('Đang có thay đổi chưa lưu — hãy lưu hoặc hủy trước khi tải lại.', 'info'); return; }
        Promise.all([load(true), g === 'shop' ? loadProducts() : null]).then(function () { initDraft(g); render(g, 'after'); });
      },
      isDirty: function () { return dirtyCount(g) > 0; },
      dirtyText: function () { return 'Có ' + dirtyCount(g) + ' mục thiết lập chưa lưu.'; },
      discard: function () { delete ST.draft[g]; },
      reset: function () { ST.data = null; ST.draft = {}; ST.products = null; ST.status = null; ST.err = ''; ST.loadedAt = 0; ST.triedAt = 0; },
    });
  });

  // thẻ "Thiết lập" trên Tổng quan
  A.addDashboard(function () {
    var dirty = Object.keys(SCREENS).some(function (g) { return dirtyCount(g) > 0; });
    if (!ST.loading && !dirty && Date.now() - Math.max(ST.loadedAt, ST.triedAt) > 60000) {
      load(true).then(function () { A.rerender(); });
    }
    var s = ST.data, ok = !!s;
    var tile = function (href, label, val) {
      return '<a class="cms-dash__tile" href="' + href + '"><span class="cms-dash__k">' + esc(label) + '</span><span class="cms-dash__v">' + esc(val) + '</span></a>';
    };
    var shopTxt = ok ? 'Miễn phí giao từ ' + money(s.shop.freeShip) + ' · ' + (s.shop.promos || []).filter(function (p) { return p.active; }).length + ' mã đang bật' : '…';
    var startOld = ok && startPast(s.course.foundStart);
    var gtMin = ok ? pkgCalc(s.course.gtPackages || []).reduce(function (m, c) { return c.mo && c.mo < m ? c.mo : m; }, Infinity) : 0;
    if (gtMin === Infinity) gtMin = 0;
    var courseTxt = ok ? 'Foundation ' + money(s.course.foundPrice) + ' · GT từ ' + money(gtMin) + '/tháng' : '…';
    var navOff = ok && s.brand.nav ? Object.keys(s.brand.nav).filter(function (k) { return !s.brand.nav[k]; }).length : 0;
    var brandTxt = ok ? (navOff ? navOff + ' mục menu đang ẩn' : 'Menu đủ mục') + ' · ' + (s.brand.logo ? 'logo riêng' : 'logo mặc định') + ' · ' + (s.brand.mapQuery ? 'bản đồ theo địa chỉ' : 'bản đồ có sẵn') : '…';
    var cats = ok && Array.isArray(s.shop.categories) ? s.shop.categories : [];
    var hid = cats.filter(function (c) { return c.hidden; }).length;
    var catTxt = ok ? cats.length + ' danh mục' + (hid ? ' · ' + hid + ' đang ẩn' : '') : '…';
    var n = ok ? s.notify : null;
    var notifyTxt = ok ? 'Telegram: ' + (n.telegramTokenSet && n.telegramChat ? 'đã nhập' : 'chưa') + ' · Email: ' + (n.smtpHost && n.notifyEmail ? 'đã nhập' : 'chưa') : '…';
    return '<section class="panel cms-dash set-dash">' +
      '<header class="panel__head"><h2 class="panel__title">Thiết lập</h2><a class="link-more" href="#/set-shop">Mở thiết lập →</a></header>' +
      (ST.err && !ok ? '<p class="cms-dash__sum">Chưa tải được: ' + esc(ST.err) + '</p>' : '') +
      (startOld ? '<p class="set-err"><a href="#/set-course">Ngày khai giảng Foundation (' + esc(String(s.course.foundStart).split('-').reverse().join('.')) + ') đã qua — cập nhật ngày mới →</a></p>' : '') +
      '<div class="cms-dash__grid">' +
        tile('#/set-shop', 'Bán hàng', shopTxt) + tile('#/set-course', 'Học phí & lịch tập', courseTxt) +
        tile('#/set-brand', 'Thương hiệu & menu', brandTxt) + tile('#/set-notify', 'Thông báo', notifyTxt) + tile('#/categories', 'Danh mục sản phẩm', catTxt) +
      '</div></section>';
  });
})();
