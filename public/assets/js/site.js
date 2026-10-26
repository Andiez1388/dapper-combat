/* Dapper Combat — lớp dùng chung cho mọi trang: gọi API, giỏ hàng dùng chung, nhớ ngôn ngữ, dữ liệu sản phẩm */
(function () {
  var DC = window.DC = {};

  // lỗi trả về có err.status: mã HTTP (vd 404), 0 = mất mạng
  DC.api = function (path, body, method) {
    return fetch('/api' + path, {
      method: method || (body ? 'POST' : 'GET'),
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.error || DC.tx('global.err.send', 'Không gửi được, vui lòng thử lại.', 'Could not send, please try again.')); e.status = r.status; e.data = d; throw e; }
        return d;
      });
    }, function () {
      var e = new Error(DC.tx('global.err.net', 'Mất kết nối mạng. Kiểm tra mạng rồi thử lại.', 'Network error. Check your connection and try again.'));
      e.status = 0;
      throw e;
    });
  };

  /* thiết lập trong /admin → Thiết lập (phí giao hàng, học phí, mã giảm giá…) */
  DC.setting = function (path, def) {
    var v = String(path).split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, window.__CMS && window.__CMS.s);
    return v == null ? def : v;
  };
  // số tiền theo tên biến (vd "found.price", "gt.from") — giống lib/settings.js
  DC.fee = function (name) {
    var c = DC.setting('course', null), sh = DC.setting('shop', null);
    if (!c || !sh) return null;
    var v = {
      'found.price': c.foundPrice, 'found.deposit': c.foundDeposit, 'hssv.month': c.hssvMonth, 'hssv.price': c.hssvMonth * c.hssvMonths,
      'mem.price': c.memMonth, 'ship.free': sh.freeShip, 'ship.fee': sh.shipFee, 'ship.express': sh.expressFee,
    };
    var min = Infinity;
    DC.gtPackages().forEach(function (k) { v['gt.' + k.months] = k.price; v['gt.' + k.months + '.mo'] = k.mo; v['gt.' + k.months + '.save'] = k.save; min = Math.min(min, k.mo); });
    v['gt.from'] = min === Infinity ? 0 : min;
    return v[name] == null ? null : v[name];
  };
  // gói Group Training (/admin → Thiết lập → Học phí) kèm giá mỗi tháng và tiền tiết kiệm so với gói ít tháng nhất — giống lib/settings.js
  DC.gtPackages = function () {
    var list = DC.setting('course.gtPackages', []) || [];
    var base = list.slice().sort(function (a, b) { return a.months - b.months; })[0], per = base ? base.price / base.months : 0;
    return list.map(function (k) { return { months: k.months, price: k.price, note: k.note || {}, label: k.label || {}, best: !!k.best, isBase: k === base,
      mo: Math.round(k.price / k.months / 1000) * 1000, save: Math.max(0, Math.round(per * k.months - k.price)) }; });
  };
  // thời gian giao (ngày làm việc) — /admin → Thiết lập → Bán hàng
  DC.eta = function () { var e = DC.setting('shop.eta', null) || {}, d = { stdMin: 2, stdMax: 4, exp: 1, cutoff: 15 }; Object.keys(d).forEach(function (k) { if (e[k] != null && !isNaN(e[k])) d[k] = +e[k]; }); return d; };
  // ngày có lớp (T2…CN): ≥ 3 ngày liền nhau → "T2 – T7", còn lại "T2 · T4 · T6" — giống lib/settings.js
  var DAYS = { vi: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
  var HOURS_DAYS = { '1-6': ['Thứ 2 – Thứ 7', 'Mon – Sat'], '0-6': ['Thứ 2 – Chủ nhật', 'Mon – Sun'], '1-5': ['Thứ 2 – Thứ 6', 'Mon – Fri'], '1-6,0': ['Thứ 2 – Chủ nhật', 'Mon – Sun'] };
  DC.daysText = function (days, en) {
    var names = DAYS[en ? 'en' : 'vi'], on = [0, 1, 2, 3, 4, 5, 6].filter(function (i) { return days && days[i]; });
    if (on.length >= 3 && on[on.length - 1] - on[0] === on.length - 1) return names[on[0]] + ' – ' + names[on[on.length - 1]];
    return on.map(function (i) { return names[i]; }).join(' · ');
  };
  // biến của lịch tập: {sched.<chương trình>.<lớp/ca>} giờ học, {….days} ngày có lớp (hàng đầu tiên khớp)
  DC.schedTokens = function (en) {
    var t = {};
    (DC.setting('course.scheduleRows', []) || []).forEach(function (r) {
      if (!r || !r.prog) return;
      var k = 'sched.' + r.prog + (r.opt ? '.' + r.opt : '');
      if (t[k] != null) return;
      t[k] = r.time || ''; t[k + '.days'] = DC.daysText(r.days, en);
    });
    return t;
  };
  // điền biến trong chữ — giống lib/settings.js: {found.price} → 8.900.000 (VI) / 8,900,000 (EN); {found.start} → 02.01.2026;
  // {ship.eta} → 2–4; {hours.days} → Thứ 2 – Thứ 7; {sched.gt.am} → 06:00 – 07:30 …; biến không có → ""
  DC.tok = function (text, en) {
    if (typeof text !== 'string' || text.indexOf('{') < 0) return text;
    var sched = null;
    return text.replace(/\{((?:found|gt|hssv|mem|ship|promo|hours|sched)\.[A-Za-z0-9.-]+)\}/g, function (m, k) {
      if (k === 'hssv.months') return String(DC.setting('course.hssvMonths', 3));
      if (k === 'promo.codes') return '';                       // mã giảm giá không còn công khai (kiểm tra qua /api/promo)
      if (k === 'found.start') { var d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(DC.setting('course.foundStart', ''))); return d ? d[3] + '.' + d[2] + '.' + d[1] : ''; }
      if (k === 'ship.eta') { var e = DC.eta(); return e.stdMin === e.stdMax ? String(e.stdMin) : e.stdMin + '–' + e.stdMax; }
      if (k === 'ship.eta.exp') return String(DC.eta().exp);
      if (k === 'hours.open') return DC.cfg('hoursOpen', '06:00');
      if (k === 'hours.close') return DC.cfg('hoursClose', '21:30');
      if (k === 'hours.days') return (HOURS_DAYS[DC.cfg('hoursDays', '1-6')] || HOURS_DAYS['1-6'])[en ? 1 : 0];
      if (k.indexOf('sched.') === 0) { sched = sched || DC.schedTokens(en); return sched[k] != null ? sched[k] : ''; }
      var n = DC.fee(k);
      return n == null ? '' : Math.round(n).toLocaleString(en ? 'en-US' : 'vi-VN');
    });
  };
  // giao hỏa tốc chỉ trong TP.HCM: cùng phép thử với server
  DC.isHcm = function (c) { return /ho\s*chi\s*minh|hcm|sai\s*gon/i.test(String(c || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')); };
  /* danh mục sản phẩm (/admin → Danh mục sản phẩm): [{ id, name:{vi,en}, desc, material, weight, warranty, guide, hidden }] */
  DC.cats = function () { return DC.setting('shop.categories', []) || []; };
  DC.cat = function (id) { return DC.cats().filter(function (c) { return c.id === id; })[0] || null; };
  DC.catName = function (id, en) { var c = DC.cat(id); return c ? (en && c.name.en ? c.name.en : c.name.vi) : id; };
  DC.warranty = function (def) {
    var w = DC.setting('shop.warranty', null), o = {};
    Object.keys(def).forEach(function (k) { o[k] = String(w && w[k] != null ? w[k] : def[k]); });
    return o;
  };

  /* nội dung sửa trong /admin: DC.x("khóa", 0 = VI | 1 = EN, "mặc định") — chữ đã ẩn trả về "" */
  // window.__CMS nạp ngay sau file này (/assets/data/cms.js) → luôn đọc lúc gọi
  var cms = function () { return window.__CMS || {}; };
  // "Xem trên trang" cho chữ do JS vẽ: đánh dấu chữ đó bằng ký tự ẩn để tìm lại sau khi trang vẽ xong
  var LOC = (location.search.match(/[?&]cms=([^&]+)/) || [])[1], MARK = '⁣';
  LOC = LOC ? decodeURIComponent(LOC) : '';
  // link do JS vẽ (trường loại "Đường dẫn"): bản sửa trong /admin nằm ở __CMS.ln
  DC.x = function (k, side, def) {
    if (cms().ln && cms().ln[k] != null) return cms().ln[k];
    if (cms().h && cms().h[k]) return '';
    var c = cms().t && cms().t[k];
    var v = DC.tok(c && c[side] != null && c[side] !== '' ? c[side] : def, side === 1);
    return k === LOC && typeof v === 'string' && v && !/^[\d.,\s/:#?=-]+$/.test(v) && !/^\/|^https?:/.test(v) ? MARK + v + MARK : v;
  };
  DC.m = function (k, def) { return (cms().m && cms().m[k]) || def; };
  DC.cfg = function (k, def) { return (cms().c && cms().c[k]) || def; };
  // icon trong JS: icon thay trong /admin (đã ghép sẵn kích thước của icon cũ), "" nếu đã ẩn
  DC.i = function (k, def) { if (cms().h && cms().h[k]) return ''; return (cms().i && cms().i[k]) || def; };
  /* danh sách do JS vẽ: DC.list("khóa", function ($k) { return [ …mục… ]; })
     /admin lưu { order: [mã mục…], add: { mã mới: { from: mã mục mẫu } } } — mục mới dựng lại từ mục mẫu với khóa chữ "…@mã mới" */
  var same = function (k) { return k; };
  same.v = same;
  DC.list = function (key, make) {
    var base = make(same), o = cms().l && cms().l[key];
    if (!o || !o.order) return base;
    var out = [];
    o.order.forEach(function (id) {
      if (/^\d+$/.test(id)) { if (base[id - 1] !== undefined) out.push(base[id - 1]); return; }
      var a = o.add && o.add[id];
      if (!a) return;
      var k = function (x) { return x + '@' + id; };
      k.v = function (x) { return x + '~' + id; };            // mã riêng (vd lựa chọn trong form) không trùng mục mẫu
      var it = make(k)[a.from - 1];
      if (it !== undefined) out.push(it);
    });
    return out;
  };

  /* mã VietQR thật (tài khoản cài ở /admin → Thanh toán): quét bằng app ngân hàng hoặc MoMo, có sẵn số tiền + nội dung */
  DC.pay = function () { return (window.__CMS && window.__CMS.p) || null; };
  DC.payQr = function (ref, amount) {
    var p = DC.pay();
    if (!p) return null;
    var note = String(ref || '').replace(/[^A-Za-z0-9]/g, '');
    var url = 'https://img.vietqr.io/image/' + encodeURIComponent(p.bin) + '-' + encodeURIComponent(p.acc) + '-compact2.png?amount=' + (Math.round(amount) || 0) +
      '&addInfo=' + encodeURIComponent(note) + '&accountName=' + encodeURIComponent(p.holder);
    return '<img class="dc-vietqr" src="' + url + '" alt="VietQR ' + DC.esc(p.bank) + '" width="200" height="200">';
  };
  // thông tin chuyển khoản dạng chữ (khi khách không quét được mã)
  DC.payLines = function (ref, noNote) {
    var p = DC.pay();
    if (!p) return '';
    var row = function (k, v) { return '<div><span>' + k + '</span><b>' + DC.esc(v) + '</b></div>'; };
    return '<div class="dc-paylines">' + row(DC.tx('global.slip.bank', 'Ngân hàng', 'Bank'), p.bank) + row(DC.tx('global.slip.acc', 'Số tài khoản', 'Account no.'), p.acc) +
      (p.holder ? row(DC.tx('global.slip.holder', 'Chủ tài khoản', 'Account name'), p.holder) : '') + (noNote ? '' : row(DC.tx('global.slip.note', 'Nội dung chuyển khoản', 'Transfer note'), String(ref || '').replace(/[^A-Za-z0-9]/g, ''))) +
      (p.momo ? row('MoMo', p.momo) : '') + '</div>';
  };
  document.addEventListener('DOMContentLoaded', function () { if (DC.pay()) document.documentElement.classList.add('dc-pay-real'); });

  /* logo tải ở /admin → Thiết lập → Thương hiệu: thay biểu tượng DC trên thanh menu, chữ thương hiệu ở menu điện thoại, trang 404, phiếu, trang phụ */
  DC.logo = function () { return DC.setting('brand.logo', '') || ''; };
  // chữ thương hiệu dùng làm logo: có logo tải lên → ảnh logo (chữ thương hiệu làm chữ thay thế)
  DC.logoHtml = function (text) {
    var logo = DC.logo();
    return logo ? '<img class="dc-logo-img dc-brand-img" src="' + DC.esc(logo) + '" alt="' + DC.esc(String(text || '').replace(/<[^>]*>/g, '')) + '">' : text;
  };
  document.addEventListener('DOMContentLoaded', function () {
    var logo = DC.setting('brand.logo', '');
    if (!logo) return;
    document.querySelectorAll('[data-dc-logo]').forEach(function (el) { el.innerHTML = DC.logoHtml(el.textContent.trim()); });
    document.querySelectorAll('svg.nav-logo-mark').forEach(function (svg) {
      var r = svg.getBoundingClientRect(), img = document.createElement('img');
      img.src = logo; img.alt = ''; img.className = 'nav-logo-mark dc-logo-img';
      img.style.height = (r.height || 28) + 'px'; img.style.width = 'auto'; img.style.objectFit = 'contain';
      svg.replaceWith(img);
    });
  });
  // chữ trong HTML đã sửa: đặt lại theo ngôn ngữ đang chọn (dùng cho trang có bộ dịch theo câu như Trang chủ)
  // onlyNew: chỉ mục thêm mới trong danh sách (khóa có "@") — bộ dịch sẵn của trang không biết các mục này
  DC.applyCms = function (onlyNew) {
    var t = cms().t || {}, side = DC.lang() === 'en' ? 1 : 0;
    Object.keys(t).forEach(function (k) {
      if (t[k][side] == null || (onlyNew && k.indexOf('@') < 0)) return;
      document.querySelectorAll('[data-cms="' + k + '"]').forEach(function (el) {
        var v = DC.tok(t[k][side], side === 1), attr = el.getAttribute('data-cms-attr');
        if (attr) el.setAttribute(attr, v.replace(/<[^>]*>/g, ''));
        else if (el.tagName !== 'TITLE' && el.tagName !== 'META') el.innerHTML = v;
      });
    });
  };
  // đổi ngôn ngữ (thuộc tính lang của <html>) → đặt lại chữ cho mục thêm mới
  if (window.MutationObserver) new MutationObserver(function () { DC.applyCms(true); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  /* khu vực đã ẩn trong /admin → ẩn luôn link mục lục / nút cuộn tới nó */
  function hideDeadLinks() {
    document.querySelectorAll('a[href^="#"], [data-go]').forEach(function (a) {
      var id = a.getAttribute('data-go') || (a.getAttribute('href') || '').slice(1);
      if (!id || !/^[\w-]+$/.test(id)) return;
      var t = document.getElementById(id);
      if (t && t.closest('[data-cms-off]')) a.style.display = 'none';
    });
  }
  window.addEventListener('load', function () { hideDeadLinks(); setTimeout(hideDeadLinks, 800); });

  DC.lang = function () { return document.documentElement.lang === 'en' ? 'en' : 'vi'; };
  DC.t = function (vi, en) { return DC.lang() === 'en' ? en : vi; };
  // chữ sửa được trong /admin theo ngôn ngữ đang chọn
  DC.tx = function (k, vi, en) { var e = DC.lang() === 'en'; return DC.x(k, e ? 1 : 0, e ? en : vi); };

  /* trang phụ (/trang/<slug>) đang hiển thị — link tới trang chưa đăng thì ẩn */
  DC.pageLive = function (slug) { var pg = cms().pg; return !Array.isArray(pg) || pg.indexOf(String(slug)) > -1; };
  DC.linkLive = function (href) { var m = /^\/trang\/([\w-]+)/.exec(String(href || '')); return !m || DC.pageLive(m[1]); };

  /* sản phẩm: đường dẫn, tên theo ngôn ngữ, tên màu */
  DC.pslug = function (p) { return p && p.slug ? String(p.slug) : DC.slug(p && p.name); };
  DC.pname = function (p, en) { if (!p) return ''; if (en === undefined) en = DC.lang() === 'en'; return en && p.nameEn ? p.nameEn : p.name; };
  var COLORS = { red: ['Đỏ', 'Red'], black: ['Đen', 'Black'], white: ['Trắng', 'White'], grey: ['Xám', 'Grey'], navy: ['Navy', 'Navy'], orange: ['Cam', 'Orange'] };
  // màu [mã, hex, tên VI, tên EN]: tên riêng của sản phẩm → tên màu chung (shop.col.<mã>) → mã màu
  DC.colorName = function (p, key, en) {
    if (en === undefined) en = DC.lang() === 'en';
    var c = p && Array.isArray(p.colors) ? p.colors.filter(function (x) { return x && x[0] === key; })[0] : null;
    if (c && en && c[3]) return c[3];
    if (c && !en && c[2]) return c[2];
    if (COLORS[key]) return DC.x('shop.col.' + key, en ? 1 : 0, COLORS[key][en ? 1 : 0]);
    return (c && c[2]) || key;
  };
  DC.product = function (id) { return (window.__DC_PRODUCTS || []).filter(function (p) { return p.id === id; })[0] || null; };

  /* chữ tĩnh có bản tiếng Anh trong thuộc tính data-en (chân trang, trang 404, trang phụ…): đổi theo ngôn ngữ;
     chữ đã sửa trong /admin (data-cms) lấy từ __CMS; aria-label tiếng Anh trong data-aria-en */
  var VI_TXT = typeof WeakMap === 'function' ? new WeakMap() : null;
  DC.applyEn = function () {
    if (!VI_TXT) return;
    var en = DC.lang() === 'en';
    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (!VI_TXT.has(el)) VI_TXT.set(el, el.innerHTML);
      var k = el.getAttribute('data-cms'), d = el.getAttribute('data-en');
      el.innerHTML = en ? DC.tok(k ? DC.x(k, 1, d) : d, true) : VI_TXT.get(el);
    });
    document.querySelectorAll('[data-aria-en]').forEach(function (el) {
      if (el.dataset.ariaVi == null) el.dataset.ariaVi = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', en ? el.getAttribute('data-aria-en') : el.dataset.ariaVi);
    });
    DC.bizLine(); DC.seo();
  };
  /* dòng thông tin doanh nghiệp ở chân trang: tên · MST · địa chỉ · điện thoại · email (/admin → Liên hệ); ẩn nếu chưa có tên và MST */
  DC.bizLine = function () {
    var c = cms().c || {}, en = DC.lang() === 'en', esc = DC.esc;
    var company = String(c.company || '').trim(), tax = String(c.taxId || '').trim(), mail = String(c.email || '').trim();
    var html = !company && !tax ? '' : [company ? esc(company) : '', tax ? esc(DC.x('global.biz.tax', en ? 1 : 0, en ? 'Tax ID: ' : 'MST: ') + tax) : '',
      esc([c.addr1, c.addr2].filter(Boolean).join(', ')), c.phone ? '<a href="tel:' + esc(String(c.phone).replace(/[^\d+]/g, '')) + '">' + esc(c.phone) + '</a>' : '',
      mail ? '<a href="mailto:' + esc(mail) + '">' + esc(mail) + '</a>' : ''].filter(Boolean).join(' · ');
    document.querySelectorAll('[data-dc-biz]').forEach(function (el) { el.innerHTML = html; el.hidden = !html; });
    return html;
  };
  /* tiêu đề tab + mô tả theo ngôn ngữ (SEO tiếng Anh sửa ở /admin → Chữ trên trang → SEO) — trang tự đặt tiêu đề (Shop) thì dùng DC.onTitle */
  var SEO_EN = {
    home: ['Dapper Combat — Boxing & Fight Lifestyle in Saigon', 'Dapper Combat — structured Boxing classes, gear & apparel for fighters, and Boxing gym setup services in Ho Chi Minh City.'],
    shop: ['Shop — Dapper Combat', 'Dapper Combat Boxing gloves, tees, hoodies and training accessories. Nationwide delivery, free shipping on orders from {ship.free}₫.'],
    course: ['Boxing Courses — Dapper Combat', 'Boxing programs at Dapper Combat: 12-week Foundation, Group Training, student classes, Membership and 1-on-1 PT. Free trial for new students.'],
    services: ['Boxing Gym Setup — Dapper Combat', 'Design consulting, equipment supply and turnkey Boxing gym setup. Free survey in Ho Chi Minh City, builds nationwide.'],
  };
  var SEO_VI = null;
  DC.seo = function () {
    if (typeof DC.onTitle === 'function') { try { DC.onTitle(); } catch (e) {} }
    var t = document.querySelector('title[data-cms$=".seo.title"]'), d = document.querySelector('meta[name="description"][data-cms$=".seo.desc"]');
    if (!t && !d) return;
    if (!SEO_VI) SEO_VI = { t: document.title, d: d ? d.getAttribute('content') : '' };
    var en = DC.lang() === 'en', page = ((t || d).getAttribute('data-cms') || '').split('.')[0], def = SEO_EN[page] || [];
    if (t && typeof DC.onTitle !== 'function') document.title = en ? DC.tok(DC.x(page + '.seo.title', 1, def[0] || SEO_VI.t), true).replace(/<[^>]*>/g, '') : SEO_VI.t;
    if (d) d.setAttribute('content', en ? DC.tok(DC.x(page + '.seo.desc', 1, def[1] || SEO_VI.d), true).replace(/<[^>]*>/g, '') : SEO_VI.d);
  };
  /* nhóm link (vd "Chính sách") không còn link nào hiển thị (trang chưa đăng) → ẩn cả nhóm */
  DC.hideEmptyGroups = function () {
    document.querySelectorAll('[data-dc-hide-empty]').forEach(function (g) {
      var any = [].some.call(g.querySelectorAll('a[href]'), function (a) { return DC.linkLive(a.getAttribute('href')) && !a.closest('[data-cms-off]'); });
      [].forEach.call(g.querySelectorAll('a[href^="/trang/"]'), function (a) { if (!DC.linkLive(a.getAttribute('href'))) (a.closest('[data-cms-item]') || a).style.display = 'none'; });
      g.hidden = !any;
    });
  };
  document.addEventListener('DOMContentLoaded', function () { DC.applyEn(); DC.hideEmptyGroups(); });
  if (window.MutationObserver) new MutationObserver(function () { DC.applyEn(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  DC.esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  // đăng ký nhận tin: trả về lỗi (vd email sai, mất mạng) để form báo cho khách
  DC.subscribe = function (email, source) { return DC.api('/subscribe', { email: email, source: source, lang: DC.lang() }); };

  /* giỏ hàng: { "id::size::color": số lượng } — Home và Shop dùng chung, đồng bộ giữa các tab */
  var CART = 'dc_cart';
  DC.cart = {
    load: function () {
      try { var o = JSON.parse(localStorage.getItem(CART) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; }
      catch (e) { return {}; }
    },
    save: function (o) { try { localStorage.setItem(CART, JSON.stringify(o || {})); } catch (e) {} },
    count: function (o) { o = o || DC.cart.load(); return Object.keys(o).reduce(function (s, k) { return s + (o[k] || 0); }, 0); },
    onChange: function (fn) { window.addEventListener('storage', function (e) { if (e.key === CART) fn(DC.cart.load()); }); },
    // giỏ giữ nhiều hơn số còn trong kho → bớt lại (theo tổng số của từng sản phẩm, mọi size / màu); trả về true nếu có đổi
    clamp: function (o, find) {
      var used = {}, changed = false;
      Object.keys(o).forEach(function (k) {
        var p = find(k.split('::')[0]);
        if (!p) return;
        var a = k.split('::'), left = DC.stock(p) - (used[p.id] || 0);
        if (DC.hasVariants(p)) left = Math.min(left, DC.vstock(p, a[1], a[2]));     // tồn kho theo size × màu
        var q = Math.min(o[k], left);
        if (q < o[k]) changed = true;
        if (q > 0) { o[k] = q; used[p.id] = (used[p.id] || 0) + q; } else delete o[k];
      });
      return changed;
    },
  };
  // số còn trong kho (server gửi kèm sản phẩm); thiếu số liệu → không giới hạn
  DC.stock = function (p) { return p && p.stock != null && !isNaN(p.stock) ? Math.max(0, Math.floor(+p.stock)) : Infinity; };
  DC.soldOut = function (p) { return DC.stock(p) <= 0; };
  /* tồn kho theo size × màu (stockBy = { "<size>::<mã màu>": số }): ô thiếu / 0 = hết hàng; không chia theo biến thể → theo cả sản phẩm */
  DC.hasVariants = function (p) { return !!(p && p.stockBy && typeof p.stockBy === 'object'); };
  DC.vstock = function (p, size, color) {
    if (!DC.hasVariants(p)) return DC.stock(p);
    var n = +p.stockBy[size + '::' + color];
    return isNaN(n) ? 0 : Math.max(0, Math.floor(n));
  };
  // biến thể đầu tiên còn hàng (ưu tiên size / màu cho trước) → [size, màu]
  DC.firstVariant = function (p, size, color) {
    var sizes = size != null ? [size].concat(p.sizes) : p.sizes, cols = (p.colors || []).map(function (c) { return c[0]; });
    if (color != null) cols = [color].concat(cols);
    for (var i = 0; i < sizes.length; i++) for (var j = 0; j < cols.length; j++) if (DC.vstock(p, sizes[i], cols[j]) > 0) return [sizes[i], cols[j]];
    return [size != null ? size : p.sizes[0], color != null ? color : cols[0]];
  };

  /* sản phẩm yêu thích: danh sách mã sản phẩm trong localStorage "dc_fav", dùng chung Trang chủ và Shop */
  var FAV = 'dc_fav';
  DC.fav = {
    list: function () { try { var a = JSON.parse(localStorage.getItem(FAV) || '[]'); return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string'; }) : []; } catch (e) { return []; } },
    has: function (id) { return DC.fav.list().indexOf(id) > -1; },
    set: function (id, on) {
      var a = DC.fav.list().filter(function (x) { return x !== id; });
      if (on) a.unshift(id);
      try { localStorage.setItem(FAV, JSON.stringify(a.slice(0, 100))); } catch (e) {}
      return on;
    },
    toggle: function (id) { return DC.fav.set(id, !DC.fav.has(id)); },
    onChange: function (fn) { window.addEventListener('storage', function (e) { if (e.key === FAV) fn(); }); },
  };

  /* sản phẩm từ server (window.__DC_PRODUCTS, nạp qua /assets/data/products.js); chưa có sản phẩm → danh sách trống (trang hiện "đang cập nhật") */
  var BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  window.DCProducts = function () {
    var list = window.__DC_PRODUCTS;
    if (!Array.isArray(list) || !list.length) return [];
    var img = typeof IMG !== 'undefined' ? IMG : null, byUrl = {};
    if (img) Object.keys(img).forEach(function (k) { byUrl[img[k]] = k; });
    return list.map(function (p) {
      p = Object.assign({}, p);
      if (img) { if (byUrl[p.img]) p.img = byUrl[p.img]; else if (p.img) img[p.img] = p.img; else { p.img = 'blank'; img.blank = BLANK; } }
      if (!Array.isArray(p.sizes) || !p.sizes.length) p.sizes = ['One size'];
      if (!Array.isArray(p.colors) || !p.colors.length) p.colors = [['black', '#141414']];
      p.desc = p.desc || { vi: '', en: '' }; p.full = p.full || p.desc;
      p.rating = p.rating || 5; p.reviews = p.reviews || 0;
      if (!p.old) delete p.old;
      return p;
    });
  };
  DC.slug = function (s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  /* ngôn ngữ: chọn VI/EN ở trang nào thì các trang khác cũng theo */
  var LANG = 'dc_lang';
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.lang-switch [data-lang]');
    if (b) try { localStorage.setItem(LANG, b.dataset.lang); } catch (err) {}
  }, true);
  document.addEventListener('DOMContentLoaded', function () {
    var want; try { want = localStorage.getItem(LANG); } catch (e) {}
    if (want && want !== DC.lang()) { var b = document.querySelector('.lang-switch [data-lang="' + want + '"]'); if (b) b.click(); }
  });

  /* bề rộng cửa sổ không tính thanh cuộn — cho các khối tràn viền */
  function vw() { document.documentElement.style.setProperty('--dc-vw', document.documentElement.clientWidth + 'px'); }
  vw(); window.addEventListener('resize', vw); document.addEventListener('DOMContentLoaded', vw);

  /* "Xem trên trang" từ /admin: ?cms=<khóa>[&sec=<khu vực>][&item=<mã mục>] → mở đúng phần (giỏ hàng, form…), cuộn tới và viền đỏ
     khóa có thể là chữ, ảnh, icon, link, khối trang hoặc danh sách */
  var click = function (sel) { var b = document.querySelector(sel); if (b) b.click(); };
  var call = function (name) { var a = [].slice.call(arguments, 1); if (typeof window[name] === 'function') window[name].apply(null, a); };
  var REVEAL = {
    'global.mnav': function () { click(document.querySelector('.hamburger-btn') ? '.hamburger-btn' : '.mn-btn'); },   // Trang chủ dùng nút menu riêng
    'home.cart': function () { if (window.DCcart) DCcart.open(); },
    'shop.cart': function () { click('#openCart'); },
    'shop.sizeguide': function () { call('v3SgOpen'); },
    // trang thanh toán cần giỏ có hàng: giỏ trống thì thêm tạm 1 sản phẩm đầu tiên
    'shop.checkout': function () {
      var p = (window.__DC_PRODUCTS || [])[0];
      if (typeof count === 'function' && !count() && p) call('addToCart', p.id, (p.sizes || [])[0] || 'One size', ((p.colors || [])[0] || ['black'])[0], 1);
      call('showCheckout');
    },
    'course.drawer': function () { call('cv3Open', 'trial', {}); },
  };
  function findTarget(k, item) {
    var q = '"' + k.replace(/"/g, '') + '"';
    if (item) { var box = document.querySelector('[data-cms-list=' + q + ']'); return box && box.querySelector(':scope > [data-cms-item="' + item.replace(/"/g, '') + '"]'); }
    var el = document.querySelector(['data-cms', 'data-cms-block', 'data-cms-icon', 'data-cms-link', 'data-cms-list', 'data-cms-media', 'data-cms-poster'].map(function (a) { return '[' + a + '=' + q + ']:not([data-cms-attr])'; }).join(','));
    if (el) return el;
    // chữ do JS vẽ: tìm ký tự đánh dấu
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) if (n.nodeValue.indexOf(MARK) >= 0) return n.parentElement;
    return document.querySelector('[data-cms=' + q + ']');
  }
  window.addEventListener('load', function () {
    var p = new URLSearchParams(location.search), k = p.get('cms');
    if (!k) return;
    var sec = p.get('sec') || '', fn = REVEAL[sec];
    if (fn) try { fn(); } catch (e) {}
    // chữ chỉ hiện ở 1 bước / 1 lựa chọn khác: viền cả ngăn hoặc khu vực chứa nó
    var BOX = { 'global.mnav': '#mnPanel', 'home.cart': '#cartDrawer', 'shop.cart': '#cart', 'shop.sizeguide': '#v3Sg', 'shop.checkout': '#checkoutView', 'course.drawer': '#cv3Reg' };
    setTimeout(function () {
      var el = findTarget(k, p.get('item')) || (sec && document.querySelector(BOX[sec] || '[data-cms-sec="' + sec.replace(/"/g, '') + '"]'));
      if (!el) return;
      while (el.parentElement && !el.getClientRects().length) el = el.parentElement;   // phần tử ẩn → khung chứa gần nhất đang hiện
      var st = document.createElement('style');
      st.textContent = '.dc-cms-hl{outline:3px solid #D4372E!important;outline-offset:4px;animation:dcHl 1.2s ease-in-out 3;}@keyframes dcHl{50%{outline-color:transparent}}';
      document.head.appendChild(st);
      el.classList.add('dc-cms-hl');
      try { el.scrollIntoView({ block: 'center' }); } catch (e) { el.scrollIntoView(); }
    }, fn ? 700 : 150);
  });

  /* link nội bộ luôn mở cùng tab (trừ link đánh dấu data-newtab, vd nút "Xem / in phiếu" — giữ màn hình đặt hàng thành công) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[target="_blank"]');
    if (a && a.origin === location.origin && !a.hasAttribute('data-newtab')) a.removeAttribute('target');
  }, true);
})();
