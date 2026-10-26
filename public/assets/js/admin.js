/* Dapper Combat — Quản trị vận hành
   JS thuần (không framework, không thư viện ngoài). Mọi dữ liệu từ API đều đi qua esc()
   trước khi chèn vào HTML; URL ảnh và mã màu được kiểm tra trước khi đặt vào thuộc tính. */
(function () {
  'use strict';

  // ═══ Cấu hình & nhãn ═══════════════════════════════════════════════════════
  var TOKEN_KEY = 'dc_admin_token';
  var DEFPW_KEY = 'dc_admin_defpw';
  var DEFAULT_PW = 'admin123';
  var REFRESH_MS = 60000;
  var LOW_STOCK = 10;   // đổi ở Thiết lập → Bán hàng (setLowStock)
  var MAX_UPLOAD = 8 * 1024 * 1024;
  var BASE_TITLE = 'Quản trị — Dapper Combat';

  var VIEWS = {
    dashboard: 'Tổng quan',
    orders: 'Đơn hàng',
    registrations: 'Đăng ký khóa học',
    consults: 'Tư vấn setup',
    products: 'Sản phẩm',
    subscribers: 'Nhận tin',
  };
  // màn hình bổ sung (vd. Nội dung website trong admin-content.js) đăng ký qua window.DCAdmin.register
  var PLUGINS = {};
  var DASH_HOOKS = [];
  var STATUS = {
    orders: [['new', 'Mới'], ['confirmed', 'Đã xác nhận'], ['shipping', 'Đang giao'], ['done', 'Hoàn tất'], ['cancelled', 'Đã hủy']],
    registrations: [['new', 'Mới'], ['contacted', 'Đã liên hệ'], ['paid', 'Đã thanh toán'], ['enrolled', 'Đã xếp lớp'], ['cancelled', 'Đã hủy']],
    consults: [['new', 'Mới'], ['contacted', 'Đã liên hệ'], ['surveyed', 'Đã khảo sát'], ['quoted', 'Đã báo giá'], ['won', 'Chốt hợp đồng'], ['lost', 'Không thành']],
  };
  var TONE = { 'new': 'new', done: 'done', enrolled: 'done', won: 'done', cancelled: 'off', lost: 'off' };
  var PAY = { cod: 'COD (thu tiền khi nhận)', bank: 'Chuyển khoản', momo: 'MoMo/ZaloPay' };
  var PAY_SHORT = { cod: 'COD', bank: 'Chuyển khoản', momo: 'MoMo/ZaloPay' };
  var SHIP = { std: 'Tiêu chuẩn', exp: 'Hỏa tốc TP.HCM', pickup: 'Nhận tại phòng tập' };
  // nguồn đơn tạo tay (bán qua điện thoại / mạng xã hội / tại chỗ)
  var SOURCE = { phone: 'Điện thoại', facebook: 'Facebook', zalo: 'Zalo', walkin: 'Tại phòng tập', other: 'Khác' };
  var SOURCE_TAG = { phone: 'Điện thoại', facebook: 'Facebook', zalo: 'Zalo', walkin: 'Tại quầy', other: 'Đơn tay' }; // nhãn ngắn trong bảng
  var ROLE_LABEL = { admin: 'Quản trị', staff: 'Nhân viên' };
  // màn nhân viên (staff) được vào; còn lại chỉ admin (nội dung website, thiết lập, tài khoản, sao lưu…)
  var STAFF_VIEWS = { dashboard: 1, orders: 1, registrations: 1, consults: 1, confirmations: 1, products: 1, subscribers: 1, customers: 1, members: 1 };
  var DATE_OPTS = [['all', 'Tất cả'], ['today', 'Hôm nay'], ['7d', '7 ngày'], ['30d', '30 ngày'], ['month', 'Tháng này']];
  var PAGE_SIZE = 50;
  // danh mục sản phẩm: lấy từ Thiết lập (shop.categories, sửa ở màn “Danh mục sản phẩm”); danh sách dưới chỉ dùng khi chưa tải xong
  var CAT_FALLBACK = [['gang', 'Găng tay'], ['ao', 'Áo & Hoodie'], ['phukien', 'Phụ kiện'], ['dotap', 'Đồ tập']].map(function (c) { return { id: c[0], name: { vi: c[1], en: '' }, hidden: false }; });
  var CAT_ID_RE = /^[a-z0-9-]{1,20}$/;
  var COLORS = {
    red: ['Đỏ', '#d4372e'], black: ['Đen', '#141414'], white: ['Trắng', '#ffffff'],
    grey: ['Xám', '#8c8c8c'], navy: ['Xanh navy', '#1d2a44'], orange: ['Cam', '#e8732a'],
  };
  var AREA = { s: '< 50 m²', m: '50–100 m²', l: '100–200 m²', xl: '> 200 m²' };
  var BIZ = { gym: 'Phòng gym', club: 'CLB / võ đường', home: 'Home gym', hotel: 'Khách sạn / resort', other: 'Khác' };
  var SVC = { design: 'Tư vấn & thiết kế', equip: 'Cung cấp thiết bị', turnkey: 'Setup trọn gói' };
  var PROGRAM = { found: 'BOOK I — Foundation', gt: 'Group Training', hssv: 'Lớp HSSV', mem: 'Membership', pt: 'PT 1-1', trial: 'Học thử miễn phí' };
  var LANG = { vi: 'Tiếng Việt', en: 'English' };
  var WEEKDAY = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  var ERR_VI = {
    'Not found': 'Không tìm thấy — có thể mục này đã bị xóa.',
    'Product not found': 'Không tìm thấy sản phẩm — có thể đã bị xóa.',
    'Admins only': 'Tài khoản này không có quyền quản trị.',
    'User not found': 'Không tìm thấy tài khoản.',
    'Not authenticated': 'Bạn chưa đăng nhập.',
    'Invalid or expired token': 'Phiên đăng nhập đã hết hạn.',
  };

  var ICON = {
    refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3h3l1.6 4.4-2.1 1.5a11 11 0 0 0 6 6l1.5-2.1 4.4 1.6v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.2 2 2 0 0 1 6.6 3z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9.5L5 19.5V16H4z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3zM3 7l9 6 9-6"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12M7 11l5 5 5-5M4 20h16"/></svg>',
    image: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM4 15l4.5-4.5L13 15l3-3 4 4"/><circle cx="15.5" cy="9" r="1.5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2zM12 10v5M12 17.5v.5"/></svg>',
  };

  // ═══ Tiện ích ═══════════════════════════════════════════════════════════════
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
  function esc(v) { return v == null ? '' : String(v).replace(/[&<>"'`]/g, function (c) { return ESC_MAP[c]; }); }
  function has(obj, k) { return Object.prototype.hasOwnProperty.call(obj, k); }
  function label(map, v) { return v != null && v !== '' && has(map, v) ? map[v] : (v == null ? '' : String(v)); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function toDate(ms) { var d = new Date(Number(ms)); return ms && !isNaN(d.getTime()) ? d : null; }
  function fmtDay(ms) { var d = toDate(ms); return d ? pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() : '—'; }
  function fmtTime(ms) { var d = toDate(ms); return d ? pad(d.getHours()) + ':' + pad(d.getMinutes()) : ''; }
  function fmtDate(ms) { var d = toDate(ms); return d ? fmtDay(ms) + ' ' + fmtTime(ms) : '—'; }
  // ngày khách chọn (chuỗi): "2026-11-02" → "02/11/2026"; định dạng khác giữ nguyên
  function fmtWhen(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    return m ? m[3] + '/' + m[2] + '/' + m[1] : String(s || '');
  }
  function money(n) { var v = Math.round(Number(n) || 0); return v.toLocaleString('vi-VN') + '₫'; }
  function num(n) { return (Number(n) || 0).toLocaleString('vi-VN'); }
  function digits(s) { return String(s == null ? '' : s).replace(/\D/g, ''); }
  function telHref(phone) { var p = String(phone || '').replace(/[^\d+]/g, ''); return digits(p).length >= 8 ? 'tel:' + p : ''; }
  function zaloHref(phone) {
    var d = digits(phone);
    if (d.length === 11 && d.indexOf('84') === 0) d = '0' + d.slice(2);
    return d.length >= 9 ? 'https://zalo.me/' + d : '';
  }
  var EMAIL_RE = /^[^@\s<>"']+@[^@\s<>"']+\.[^@\s<>"']+$/;
  // chỉ cho phép ảnh nội bộ ("/assets/…") hoặc https:// — chặn "//", "\", javascript:, data: …
  function safeImg(url) {
    var u = String(url == null ? '' : url).trim();
    if (!u || /[\s\\<>"'`]/.test(u)) return '';
    if (/^\/(?!\/)/.test(u) || /^https:\/\/[^/]/i.test(u)) return u;
    return '';
  }
  function safeHex(h, fallback) {
    var s = String(h == null ? '' : h).trim();
    if (/^#[0-9a-f]{3}$/i.test(s)) s = '#' + s.slice(1).split('').map(function (c) { return c + c; }).join('');
    return /^#[0-9a-f]{6}$/i.test(s) ? s.toLowerCase() : (fallback === undefined ? '#141414' : fallback);
  }
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  }
  function matches(q, fields) {
    var nq = norm(q).trim();
    if (!nq) return true;
    var hay = fields.map(norm).join(' \u0001 ');
    if (hay.indexOf(nq) !== -1) return true;
    var dq = digits(q);
    if (dq.length >= 3 && dq.length === String(q).replace(/[\s.\-+#]/g, '').length) {
      return fields.some(function (f) { return digits(f).indexOf(dq) !== -1; });
    }
    return false;
  }
  function byNewest(list) {
    return (Array.isArray(list) ? list : []).filter(Boolean).slice().sort(function (a, b) { return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0); });
  }
  // ── danh mục sản phẩm ──
  var CATS = { list: null, loading: null };
  function catList() { return CATS.list || CAT_FALLBACK; }
  function catById(id) { return catList().filter(function (c) { return c.id === id; })[0] || null; }
  // tên tiếng Việt; mã lạ (danh mục đã xóa…) → hiện nguyên mã
  function catName(id) { var c = catById(id); return c ? (c.name && c.name.vi) || c.id : (id == null ? '' : String(id)); }
  function setCategories(list) {
    if (!Array.isArray(list)) return;
    var clean = list.filter(function (c) { return c && CAT_ID_RE.test(String(c.id || '')); }).map(function (c) {
      return { id: String(c.id), name: { vi: String((c.name && c.name.vi) || c.id), en: String((c.name && c.name.en) || '') }, hidden: !!c.hidden };
    });
    if (!clean.length) return;
    var changed = JSON.stringify(clean) !== JSON.stringify(CATS.list);
    CATS.list = clean;
    if (!changed) return;
    if (S.view === 'products') updateView();
    // form sản phẩm đang mở mà chưa sửa gì → vẽ lại để có danh mục mới
    if (S.drawer && S.drawer.view === 'products' && !S.dirty) renderDrawer();
  }
  function loadCategories(force) {
    if (CATS.list && !force) return Promise.resolve(catList());
    if (CATS.loading) return CATS.loading;
    var A = window.DCAdmin;
    var p = A && A.getSettings ? A.getSettings(force) : api('/settings');
    CATS.loading = Promise.resolve(p).then(function (d) {
      if (d && d.shop) setCategories(d.shop.categories);
      return catList();
    }, function () { return catList(); }).then(function (l) { CATS.loading = null; return l; });
    return CATS.loading;
  }
  // ── tiền: đã nhận / chờ thu ──
  // số cần thu: đơn = tổng đơn; đăng ký = số cần trả trước, không có thì tổng học phí
  function dueOf(kind, x) { return kind === 'orders' ? Number(x.total) || 0 : Number(x.due) || Number(x.total) || 0; }
  // chờ thanh toán: đơn chuyển khoản / MoMo chưa nhận tiền; đăng ký còn phải trả — đều chưa hủy
  function awaitingPay(kind, x) {
    if (!x || x.paid || x.status === 'cancelled') return false;
    return kind === 'orders' ? (x.pay === 'bank' || x.pay === 'momo') : kind === 'registrations' && dueOf(kind, x) > 0;
  }
  function payTag(kind, x) {
    if (x.paid) return '<span class="paytag paytag--ok" title="Đã nhận ' + esc(money(x.paidAmount)) + '">Đã thu</span>';
    if (awaitingPay(kind, x)) return '<span class="paytag paytag--wait" title="Chưa ghi nhận đã nhận tiền">Chờ thu</span>';
    return '';
  }
  // dòng chữ (chưa escape) cho bảng chi tiết
  function paidText(kind, x) {
    if (x.paid) return money(x.paidAmount) + ' · ' + fmtDate(x.paidAt) + (x.paidBy ? ' · ' + x.paidBy : '') + (x.paidNote ? ' · ' + x.paidNote : '');
    return awaitingPay(kind, x) ? 'Chưa — chờ khách thanh toán ' + money(dueOf(kind, x)) : (kind === 'orders' && x.pay === 'cod' && x.status !== 'cancelled' ? 'Chưa — thu khi giao (COD)' : '');
  }
  function memberLeft(r) {
    var d = daysTo(r.endDate);
    return d == null ? '' : d < 0 ? ' (đã hết hạn ' + -d + ' ngày)' : d === 0 ? ' (hết hạn hôm nay)' : ' (còn ' + d + ' ngày)';
  }
  function moneyVal(s) { var d = String(s == null ? '' : s).replace(/\D/g, ''); return d ? parseInt(d.slice(0, 13), 10) : 0; }
  // ô tiền: tự thêm dấu chấm hàng nghìn, giữ vị trí con trỏ
  function fmtMoneyInput(inp) {
    var pos = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
    var before = inp.value.slice(0, pos).replace(/\D/g, '').length;
    var raw = inp.value.replace(/\D/g, ''), txt = raw === '' ? '' : num(moneyVal(raw));
    inp.value = txt;
    var i = 0, seen = 0;
    while (i < txt.length && seen < before) { if (/\d/.test(txt[i])) seen++; i++; }
    try { inp.setSelectionRange(i, i); } catch (e) { /* bỏ qua */ }
    return moneyVal(txt);
  }
  // ── hội viên (đăng ký "Đã xếp lớp" có ngày hết hạn) ──
  function ymdToday() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function ymdOk(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !isNaN(Date.parse(s)); }
  function daysTo(ymd) { return ymdOk(ymd) ? Math.round((Date.parse(ymd + 'T00:00:00Z') - Date.parse(ymdToday() + 'T00:00:00Z')) / 864e5) : null; }
  // active = đang tập (còn hạn / chưa có ngày hết hạn) · soon = còn ≤ 7 ngày · expired = đã hết hạn
  function memberState(r) {
    if (!r || r.status !== 'enrolled') return '';
    var d = daysTo(r.endDate);
    return d == null ? 'active' : d < 0 ? 'expired' : d <= 7 ? 'soon' : 'active';
  }
  function addMonthsYmd(ymd, n) {
    var p = String(ymd).split('-').map(Number), dt = new Date(Date.UTC(p[0], p[1] - 1 + n, p[2]));
    if (dt.getUTCDate() !== p[2]) dt.setUTCDate(0);
    return dt.toISOString().slice(0, 10);
  }
  function cust(o) { return o && o.customer && typeof o.customer === 'object' ? o.customer : {}; }
  function qtyOf(o) { return (Array.isArray(o.items) ? o.items : []).reduce(function (s, i) { return s + (Number(i && i.qty) || 0); }, 0); }
  function colorName(k) { return has(COLORS, k) ? COLORS[k][0] : String(k || ''); }
  function programName(r) { return r.programName || label(PROGRAM, r.program) || '—'; }
  function statusLabel(kind, s) {
    var f = (STATUS[kind] || []).filter(function (x) { return x[0] === s; })[0];
    return f ? f[1] : (s || '—');
  }
  function badge(kind, s) { return '<span class="badge badge--' + (TONE[s] || 'mid') + '">' + esc(statusLabel(kind, s)) + '</span>'; }
  function idHref(view, id) { return '#/' + view + '/' + encodeURIComponent(String(id)); }
  function F(form, name) { return form.elements.namedItem(name); }

  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* bộ nhớ bị chặn */ } }
  function lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) { /* bỏ qua */ } }
  function ssGet(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } }
  function ssDel(k) { try { window.sessionStorage.removeItem(k); } catch (e) { /* bỏ qua */ } }

  function setBusy(btn, on) {
    if (!btn) return;
    btn.disabled = !!on;
    btn.classList.toggle('is-busy', !!on);
    if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy');
  }
  function setMsg(node, msg) { if (!node) return; node.textContent = msg || ''; node.hidden = !msg; }

  // ═══ Trạng thái ═════════════════════════════════════════════════════════════
  var S = {
    token: lsGet(TOKEN_KEY) || '',
    user: null,
    view: '',
    sub: '',
    data: { stats: null, orders: null, registrations: null, consults: null, products: null, subscribers: null },
    err: {},
    loadedAt: 0,
    refreshing: null,
    again: false,
    gen: 0,
    timer: 0,
    filter: { orders: 'all', registrations: 'all', consults: 'all', products: 'all' },
    q: { orders: '', registrations: '', consults: '', products: '', subscribers: '' },
    date: { orders: 'all', registrations: 'all', consults: 'all' },
    limit: { orders: PAGE_SIZE, registrations: PAGE_SIZE, consults: PAGE_SIZE },
    autoRender: false, // đang vẽ lại do tự làm mới (60 giây) → giữ nguyên chỗ đang xem
    drawerMode: '',    // '' = xem chi tiết · 'edit' = sửa đơn / sửa đăng ký
    seen: null,
    drawer: null,      // { view, id }
    drawerFrom: null,  // hash trước khi mở drawer
    drawerPending: false,
    dirty: false,
    lastFocus: null,
    curHash: null,
    prevHash: null,
  };

  var el = {
    boot: $('#boot'), login: $('#login'), loginForm: $('#loginForm'), loginMsg: $('#loginMsg'),
    app: $('#app'), main: $('#main'), side: $('#side'), sideScrim: $('#sideScrim'),
    menuBtn: $('#menuBtn'), sideClose: $('#sideClose'), userEmail: $('#userEmail'),
    drawer: $('#drawer'), drawerScrim: $('#drawerScrim'),
    confirmDlg: $('#confirmDlg'), confirmTitle: $('#confirmTitle'), confirmBody: $('#confirmBody'),
    confirmOk: $('#confirmOk'), confirmCancel: $('#confirmDlg button[value="cancel"]'),
    pwDlg: $('#pwDlg'), pwForm: $('#pwForm'), pwMsg: $('#pwMsg'), toasts: $('#toasts'),
  };

  // ═══ Thông báo (toast) ══════════════════════════════════════════════════════
  // link (tùy chọn): { href: '/khoa-hoc', label: 'Xem trang ↗' } — chỉ nhận đường dẫn nội bộ bắt đầu bằng "/"
  function toast(msg, type, link) {
    type = type || 'ok';
    var t = document.createElement('div');
    t.className = 'toast toast--' + type;
    if (type === 'err') t.setAttribute('role', 'alert');
    t.textContent = msg;
    if (link && /^\/(?![\/\\])/.test(String(link.href || ''))) {
      var a = document.createElement('a');
      a.className = 'toast__link'; a.href = link.href; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = link.label || 'Xem trang ↗';
      t.appendChild(document.createTextNode(' '));
      t.appendChild(a);
    }
    el.toasts.appendChild(t);
    while (el.toasts.children.length > 4) el.toasts.removeChild(el.toasts.firstChild);
    void t.offsetWidth;
    t.classList.add('is-in');
    var gone = function () { t.classList.remove('is-in'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260); };
    t.addEventListener('click', gone);
    setTimeout(gone, type === 'err' ? 6500 : (link ? 6000 : 3200));
  }

  // ═══ Gọi API ════════════════════════════════════════════════════════════════
  function ApiError(message, status, data) { this.message = message; this.status = status; this.data = data || null; }
  ApiError.prototype = Object.create(Error.prototype);
  ApiError.prototype.name = 'ApiError';

  function api(path, opts) {
    opts = opts || {};
    var headers = { Accept: 'application/json' };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    var sentToken = opts.auth === false ? '' : S.token;
    if (sentToken) headers.Authorization = 'Bearer ' + sentToken;
    return fetch('/api' + path, {
      method: opts.method || 'GET', headers: headers, cache: 'no-store',
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        var msg = data && typeof data.error === 'string' ? (ERR_VI[data.error] || data.error) : '';
        if (res.status === 401 && sentToken && opts.on401 !== 'error') {
          if (sentToken === S.token) sessionExpired();
          throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
        }
        if (res.status === 403 && sentToken && data && data.mustChange) {
          if (sentToken === S.token) forcePassword();
          throw new ApiError(msg, 403);
        }
        // tài khoản nhân viên gọi việc chỉ admin làm được → báo lỗi, không đăng xuất
        if (res.status === 403 && sentToken && data && data.adminOnly) throw new ApiError(msg || 'Chỉ tài khoản quản trị (admin) mới làm được việc này.', 403, data);
        if (res.status === 403 && sentToken) {
          if (sentToken === S.token) logout('Tài khoản này không có quyền quản trị.');
          throw new ApiError('Tài khoản này không có quyền quản trị.', 403);
        }
        if (!res.ok) throw new ApiError(msg || ('Máy chủ báo lỗi (' + res.status + '). Vui lòng thử lại.'), res.status, data);
        return data;
      });
    }, function () {
      throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.', 0);
    });
  }
  function apiFail(e) { if (e && ((e.status !== 401 && e.status !== 403) || (e.data && e.data.adminOnly))) toast(e.message || 'Đã có lỗi xảy ra', 'err'); }
  // vai trò tài khoản đang đăng nhập
  // (chưa biết tài khoản — vd mất mạng lúc mở trang — thì hiện đủ; máy chủ vẫn tự chặn việc không được phép)
  function isAdmin() { return !S.user || S.user.role === 'admin'; }
  function canView(v) { return isAdmin() || has(STAFF_VIEWS, v); }

  // ═══ Tải dữ liệu ════════════════════════════════════════════════════════════
  var SOURCES = {
    stats: '/stats', orders: '/orders', registrations: '/registrations',
    consults: '/consults', products: '/admin/products', subscribers: '/subscribers',
  };

  function refresh(manual) {
    if (!S.token) return Promise.resolve();
    // đang tải dở → tải lại thêm một lượt khi xong (dữ liệu vừa sửa có thể chưa có trong lượt đang chạy)
    if (S.refreshing) { S.again = true; return S.refreshing; }
    var token = S.token, gen = S.gen;
    var keys = Object.keys(SOURCES);
    spin(true);
    S.refreshing = Promise.all(keys.map(function (k) {
      return api(SOURCES[k]).then(function (v) { return { ok: true, v: v }; }, function (e) { return { ok: false, e: e }; });
    })).then(function (res) {
      if (!S.token || S.token !== token) return;
      if (gen !== S.gen) { S.again = true; return; } // có thay đổi cục bộ trong lúc tải → bỏ kết quả cũ
      var failed = [];
      res.forEach(function (r, i) {
        var k = keys[i];
        if (r.ok) {
          S.data[k] = k === 'stats' ? (r.v || {}) : (k === 'products' ? (Array.isArray(r.v) ? r.v.filter(Boolean) : []) : byNewest(r.v));
          delete S.err[k];
        } else { S.err[k] = r.e.message; failed.push(r.e.message); }
      });
      S.loadedAt = Date.now();
      announceNew();
      renderNav();
      S.autoRender = !manual;
      try { updateView(manual); } finally { S.autoRender = false; }
      if (S.drawer && S.drawerPending) renderDrawer();
      if (manual) { if (failed.length) toast(failed[0], 'err'); else toast('Đã cập nhật dữ liệu'); }
    });
    var after = function () {
      S.refreshing = null; spin(false);
      if (S.again && S.token) { S.again = false; refresh(); }
    };
    return S.refreshing.then(after, function (e) { if (window.console) console.error(e); after(); });
  }
  function spin(on) { $$('[data-refresh]').forEach(function (b) { b.classList.toggle('is-spinning', on); }); }

  function startTimer() {
    stopTimer();
    S.timer = setInterval(function () { if (document.visibilityState === 'visible' && S.token) refresh(); }, REFRESH_MS);
  }
  function stopTimer() { if (S.timer) clearInterval(S.timer); S.timer = 0; }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && S.token && !el.app.hidden && Date.now() - S.loadedAt > REFRESH_MS) refresh();
  });

  function findById(kind, id) { var l = S.data[kind]; return Array.isArray(l) ? l.filter(function (x) { return x.id === id; })[0] || null : null; }
  function replaceItem(kind, item) {
    S.gen++;
    var l = S.data[kind]; if (!Array.isArray(l) || !item) return;
    var i = l.findIndex(function (x) { return x.id === item.id; });
    if (i >= 0) l[i] = item; else l.unshift(item);
  }
  function removeItem(kind, id) { S.gen++; var l = S.data[kind]; if (Array.isArray(l)) S.data[kind] = l.filter(function (x) { return x.id !== id; }); }

  function countNew(kind) {
    var l = S.data[kind];
    if (Array.isArray(l)) return l.filter(function (x) { return x.status === 'new'; }).length;
    var st = S.data.stats;
    return st && st[kind] ? Number(st[kind]['new']) || 0 : 0;
  }
  function lowStockCount() {
    var l = S.data.products;
    if (Array.isArray(l)) return l.filter(function (p) { return p.visible !== false && Number(p.stock) <= LOW_STOCK; }).length;
    return S.data.stats && Array.isArray(S.data.stats.lowStock) ? S.data.stats.lowStock.length : 0;
  }

  // báo khi có đơn / đăng ký / yêu cầu mới xuất hiện sau lần tải trước
  function announceNew() {
    var names = { orders: 'đơn hàng', registrations: 'đăng ký khóa học', consults: 'yêu cầu tư vấn' };
    var msgs = [];
    var seen = S.seen || {};
    Object.keys(names).forEach(function (k) {
      var l = S.data[k];
      if (!Array.isArray(l)) return;
      if (seen[k]) {
        var fresh = l.filter(function (x) { return !seen[k][x.id]; }).length;
        if (fresh) msgs.push(fresh + ' ' + names[k] + ' mới');
      }
      var ids = {}; l.forEach(function (x) { ids[x.id] = 1; });
      seen[k] = ids;
    });
    if (S.seen && msgs.length) toast('Có ' + msgs.join(', '), 'info');
    S.seen = seen;
    var total = countNew('orders') + countNew('registrations') + countNew('consults');
    document.title = (total ? '(' + total + ') ' : '') + BASE_TITLE;
  }

  // ═══ Điều hướng ═════════════════════════════════════════════════════════════
  function renderNav() {
    ['orders', 'registrations', 'consults', 'products', 'members'].forEach(function (k) {
      var b = $('[data-badge="' + k + '"]'); if (!b) return;
      var n = k === 'products' ? lowStockCount() : k === 'members' ? (S.data.registrations || []).filter(function (r) { return memberState(r) === 'soon'; }).length : countNew(k);
      b.hidden = !n;
      b.textContent = n > 99 ? '99+' : String(n);
      b.title = k === 'products' ? n + ' sản phẩm sắp hết hàng' : k === 'members' ? n + ' hội viên sắp hết hạn (≤ 7 ngày)' : n + ' mục mới chưa xử lý';
    });
    $$('[data-nav]').forEach(function (a) {
      var on = a.getAttribute('data-nav') === S.view;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function parseHash() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var view = has(VIEWS, parts[0]) ? parts[0] : '';
    var id = '', sub = '';
    if (parts.length > 1 && parts[1]) { try { id = decodeURIComponent(parts.slice(1).join('/')); } catch (e) { id = ''; } }
    if (has(PLUGINS, view)) { sub = id; id = ''; }
    if (id && view !== 'products' && !COLL[view]) id = '';
    return { view: view || 'dashboard', id: id, sub: sub, valid: !!view };
  }

  function pluginDirty() { var pl = has(PLUGINS, S.view) ? PLUGINS[S.view] : null; return !!(pl && pl.isDirty && pl.isDirty()); }

  function onHashChange() {
    if (el.app.hidden) return;
    S.prevHash = S.curHash;
    var p = parseHash();
    // màn nội dung có thay đổi chưa lưu → hỏi trước khi rời màn
    if (pluginDirty() && p.view !== S.view) {
      var pl = PLUGINS[S.view], to = location.hash;
      history.replaceState(null, '', S.curHash || '#/' + S.view);
      confirmDialog({ title: 'Bỏ thay đổi chưa lưu?', body: (pl.dirtyText ? pl.dirtyText() : 'Có thay đổi chưa lưu.') + ' Nếu rời màn này, các thay đổi sẽ mất.', ok: 'Bỏ thay đổi', cancel: 'Ở lại' })
        .then(function (yes) {
          if (!yes) return;
          if (pl.discard) pl.discard();
          history.replaceState(null, '', to);
          route();
        });
      return;
    }
    var target = p.id ? p.view + '/' + p.id : '';
    var current = S.drawer ? S.drawer.view + '/' + S.drawer.id : '';
    if (S.drawer && S.dirty && target !== current) {
      var wanted = location.hash;
      history.replaceState(null, '', idHref(S.drawer.view, S.drawer.id));
      S.curHash = location.hash;
      confirmDialog({ title: 'Bỏ thay đổi chưa lưu?', body: 'Những gì bạn vừa nhập trong bảng chi tiết sẽ không được lưu.', ok: 'Bỏ thay đổi', cancel: 'Tiếp tục sửa' })
        .then(function (yes) {
          if (!yes) return;
          S.dirty = false;
          history.replaceState(null, '', wanted);
          route();
        });
      return;
    }
    route();
  }

  // tài khoản nhân viên: ẩn mục chỉ admin dùng (nội dung website, thiết lập, tài khoản, sao lưu…) + nhóm menu trống
  function applyRole() {
    $$('.side__nav [data-nav]').forEach(function (a) { a.hidden = !canView(a.getAttribute('data-nav')); });
    $$('.side__nav .side__group').forEach(function (g) {
      var n = g.nextElementSibling, any = false;
      while (n && !n.classList.contains('side__group')) { if (!n.hidden) any = true; n = n.nextElementSibling; }
      g.hidden = !any;
    });
    el.userEmail.textContent = S.user && S.user.email ? S.user.email : '';
    var role = $('#userRole');
    if (role) { role.textContent = S.user ? ROLE_LABEL[S.user.role] || S.user.role || '' : ''; role.hidden = !S.user; }
  }

  function route() {
    var p = parseHash();
    if (!p.valid) history.replaceState(null, '', '#/dashboard');
    if (p.valid && !canView(p.view)) {
      history.replaceState(null, '', '#/dashboard');
      toast('Mục này chỉ dành cho tài khoản quản trị (admin).', 'info');
      p = parseHash();
    }
    closeSidebar(true);
    if (p.view !== S.view || !el.main.firstChild) {
      S.view = p.view; S.sub = p.sub;
      mountView();
      window.scrollTo(0, 0);
    } else if (has(PLUGINS, p.view) && p.sub !== S.sub) {
      S.sub = p.sub;
      if (PLUGINS[p.view].route) PLUGINS[p.view].route(el.main, p.sub);
    }
    renderNav();
    if (p.id) openDrawer(p.view, p.id);
    else if (S.drawer) { S.drawer = null; S.dirty = false; S.drawerMode = ''; ED = null; hideDrawer(); }
    S.curHash = location.hash;
  }

  // ═══ Khung trang ════════════════════════════════════════════════════════════
  function pageHead(title, opts) {
    opts = opts || {};
    return '<header class="page-head">' +
      '<div class="page-head__text"><p class="eyebrow">' + esc(opts.eyebrow || 'Vận hành') + '</p>' +
      '<h1 class="page-title">' + esc(title) + (opts.count === false ? '' : ' <span class="page-count" data-count></span>') + '</h1></div>' +
      '<div class="page-head__actions">' + (opts.stamp === false ? '' : '<span class="stamp" data-stamp></span>') +
      (opts.refresh === false ? '' : '<button class="btn btn--ghost btn--icon" type="button" data-refresh aria-label="Làm mới dữ liệu" title="Làm mới">' + ICON.refresh + '</button>') +
      (opts.actions || '') + '</div></header>';
  }
  function toolbar(placeholder, withChips, withDate) {
    return '<div class="toolbar">' +
      (withChips ? '<div class="chips" role="group" aria-label="Bộ lọc" data-chips></div>' : '') +
      (withDate ? '<label class="datef"><span class="datef__label">Thời gian</span><select data-date>' +
        DATE_OPTS.map(function (d) { return '<option value="' + d[0] + '">' + esc(d[1]) + '</option>'; }).join('') + '</select></label>' : '') +
      '<label class="search">' + ICON.search + '<span class="sr">Tìm kiếm</span>' +
      '<input type="search" data-search placeholder="' + esc(placeholder) + '" autocomplete="off" spellcheck="false" enterkeyhint="search"></label>' +
      '</div>';
  }
  function todayLine() { var d = new Date(); return WEEKDAY[d.getDay()] + ', ' + fmtDay(d.getTime()); }

  function mountView() {
    var v = S.view, html;
    if (has(PLUGINS, v)) { PLUGINS[v].mount(el.main, S.sub || ''); return; }
    if (v === 'dashboard') {
      html = pageHead('Tổng quan', { eyebrow: todayLine(), count: false }) + '<div data-body></div>';
    } else if (v === 'products') {
      html = pageHead('Sản phẩm', { actions: '<a class="btn btn--primary" href="#/products/new">' + ICON.plus + '<span>Thêm sản phẩm</span></a>' }) +
        toolbar('Tìm tên hoặc mã sản phẩm…', true) + '<div data-body></div>';
    } else if (v === 'subscribers') {
      html = pageHead('Nhận tin', { eyebrow: 'Bản tin email', actions: '<button class="btn btn--primary" type="button" data-action="export-csv">' + ICON.download + '<span>Xuất CSV</span></button>' }) +
        toolbar('Tìm email…', false) + '<div data-body></div>';
    } else {
      var acts = '<button class="btn btn--line" type="button" data-action="export-list" title="Xuất danh sách đang lọc ra file mở bằng Excel">' + ICON.download + '<span>Xuất CSV</span></button>' +
        (v === 'orders' ? '<a class="btn btn--primary" href="#/orders/new" title="Đơn bán qua điện thoại, Facebook, Zalo hoặc tại phòng tập">' + ICON.plus + '<span>Tạo đơn</span></a>' : '');
      html = pageHead(VIEWS[v], { eyebrow: COLL[v].eyebrow, actions: acts }) + toolbar('Tìm mã, tên, SĐT…', true, true) + '<div data-body></div>';
    }
    el.main.innerHTML = html;
    var input = $('[data-search]', el.main);
    if (input) input.value = S.q[v] || '';
    var ds = $('[data-date]', el.main);
    if (ds) ds.value = S.date[v] || 'all';
    updateView();
  }

  function updateView(manual) {
    if (!el.main.firstChild || el.app.hidden) return;
    if (has(PLUGINS, S.view)) { if (PLUGINS[S.view].update) PLUGINS[S.view].update(el.main, !!manual); return; }
    var stamp = S.loadedAt ? 'Cập nhật ' + fmtTime(S.loadedAt) : '';
    $$('[data-stamp]', el.main).forEach(function (s) { s.textContent = stamp; });
    if (S.view === 'dashboard') renderDashboard();
    else if (S.view === 'products') renderProducts();
    else if (S.view === 'subscribers') renderSubscribers();
    else if (COLL[S.view]) renderCollection(S.view);
  }

  function loadingHtml() { return '<div class="state state--loading"><span class="spinner" aria-hidden="true"></span><span>Đang tải dữ liệu…</span></div>'; }
  function errorHtml(msg) {
    return '<div class="state state--error">' + ICON.warn + '<p class="state__title">Không tải được dữ liệu</p><p>' + esc(msg) + '</p>' +
      '<button class="btn" type="button" data-refresh>Thử lại</button></div>';
  }
  function emptyHtml(title, sub) {
    return '<div class="state"><p class="state__title">' + esc(title) + '</p>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>';
  }
  function staleHtml(kind) {
    return S.err[kind] ? '<p class="inline-warn">' + ICON.warn + '<span>Chưa cập nhật được: ' + esc(S.err[kind]) + '</span></p>' : '';
  }

  function renderChips(box, defs, active) {
    if (!box) return;
    var focused = document.activeElement && box.contains(document.activeElement) ? document.activeElement.getAttribute('data-filter') : null;
    box.innerHTML = defs.map(function (d) {
      var on = d[0] === active;
      return '<button type="button" class="chip' + (on ? ' is-active' : '') + (d[3] && d[2] ? ' chip--alert' : '') + '" data-filter="' + esc(d[0]) + '" aria-pressed="' + on + '">' +
        '<span>' + esc(d[1]) + '</span><span class="chip__n">' + esc(d[2]) + '</span></button>';
    }).join('');
    if (focused) { var b = box.querySelector('[data-filter="' + CSS.escape(focused) + '"]'); if (b) b.focus(); }
  }

  // cols: [nhãn, class, fn(item) → HTML đã escape]
  function tableHtml(kind, cols, rows, opts) {
    opts = opts || {};
    return '<div class="table-wrap"><table class="tbl tbl--' + kind + '"><thead><tr>' +
      cols.map(function (c) { return '<th scope="col" class="' + c[1] + '">' + esc(c[0]) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      rows.map(function (r) {
        var cls = opts.rowClass ? opts.rowClass(r) : '';
        return '<tr' + (opts.href ? ' data-href="' + esc(opts.href(r)) + '"' : '') + (cls ? ' class="' + cls + '"' : '') + '>' +
          cols.map(function (c) { return '<td class="' + c[1] + '" data-label="' + esc(c[0]) + '">' + c[2](r) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function dateCell(ms) { return '<span class="dt"><span>' + esc(fmtDay(ms)) + '</span> <span class="dt__time">' + esc(fmtTime(ms)) + '</span></span>'; }
  function codeLink(view, x) { return '<a class="code" href="' + esc(idHref(view, x.id)) + '">' + esc(x.code || x.id) + '</a>'; }
  function or(v) { return v != null && v !== '' ? esc(v) : '<span class="muted">—</span>'; }

  // ═══ Xác nhận cho khách (email xác nhận + phiếu xác nhận khách tự tải) ══════════
  // confirm = { token, email: { status: pending | off | none | nosmtp | sent | failed, at, to, error }, slip: { views, downloads, viewedAt, firstAt, lastAt } }
  var CONF_EMAIL = { pending: 'Đang gửi…', off: 'Email xác nhận đang tắt', none: 'Khách không nhập email', nosmtp: 'Chưa cài SMTP (email)', sent: 'Đã gửi', failed: 'Gửi lỗi', skip: 'Chưa gửi (đơn tạo tay)' };
  var CONF_KINDS = ['orders', 'registrations'];
  function confOf(x) { return x && x.confirm && typeof x.confirm === 'object' ? x.confirm : null; }
  function confEmail(x) { var c = confOf(x); return c && c.email && typeof c.email === 'object' ? c.email : {}; }
  function confSlip(x) { var c = confOf(x); return c && c.slip && typeof c.slip === 'object' ? c.slip : {}; }
  function confReached(x) { var s = confSlip(x); return confEmail(x).status === 'sent' || (Number(s.views) || 0) > 0 || (Number(s.downloads) || 0) > 0; }
  // khách cần gọi: đơn / đăng ký có phiếu xác nhận, còn trạng thái Mới (đã xử lý = đã liên hệ), email chưa gửi được và khách chưa mở / tải phiếu
  function confMissing(x) { return !!confOf(x) && x.status === 'new' && !confReached(x); }
  function hhmm(ms) { var d = toDate(ms); return d ? pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) : ''; }
  function slipUrl(x) {
    var c = confOf(x), code = String((x && x.code) || '').replace(/^#/, '');
    if (!c || !/^[A-Za-z0-9-]{3,40}$/.test(code) || !/^[a-f0-9]{16,64}$/i.test(String(c.token || ''))) return '';
    return location.origin + '/phieu/' + encodeURIComponent(code) + '?k=' + encodeURIComponent(c.token);
  }
  function confEmailOf(kind, x) { return kind === 'orders' ? cust(x).email : x.email; }
  function confPhoneOf(kind, x) { return kind === 'orders' ? cust(x).phone : x.phone; }
  // trạng thái email bằng chữ (đã escape); full = kèm chi tiết lỗi + link bật
  function confEmailHtml(x, full) {
    if (!confOf(x)) return '<span class="cf cf--off">Đơn cũ — chưa có phiếu xác nhận</span>';
    var e = confEmail(x), st = e.status || 'pending', tone = st === 'sent' ? 'ok' : st === 'failed' ? 'err' : st === 'pending' ? 'wait' : 'off';
    var txt = st === 'sent' ? 'Đã gửi' + (e.at ? ' lúc ' + hhmm(e.at) : '') + (e.to ? ' tới ' + e.to : '') : (CONF_EMAIL[st] || st);
    if (st === 'failed' && full && e.error) txt += ' — ' + String(e.error).replace(/^lỗi:\s*/i, '');
    if (st === 'failed' && full && e.at) txt += ' (' + hhmm(e.at) + ')';
    return '<span class="cf cf--' + tone + '">' + esc(txt) + '</span>' +
      (full && (st === 'off' || st === 'nosmtp') ? ' <a class="cf-link" href="#/set-notify">Bật ở Thiết lập → Thông báo</a>' : '');
  }
  function confSlipText(x) {
    if (!confOf(x)) return 'Đơn cũ — chưa có phiếu xác nhận';
    var s = confSlip(x), v = Number(s.views) || 0, d = Number(s.downloads) || 0, last = Math.max(Number(s.viewedAt) || 0, Number(s.lastAt) || 0);
    return v || d ? 'Khách đã xem ' + v + ' lần · tải ' + d + ' lần' + (last ? ' (lần cuối ' + hhmm(last) + ')' : '') : 'Khách chưa mở phiếu';
  }
  // ô gọn trong bảng danh sách
  function confCell(x) {
    if (!confOf(x)) return '<span class="cf cf--off" title="Đơn cũ — chưa có phiếu xác nhận">Đơn cũ</span>';
    var e = confEmail(x).status || 'pending', s = confSlip(x), d = Number(s.downloads) || 0, v = Number(s.views) || 0;
    var em = e === 'sent' ? '<span class="cf cf--ok" title="Email xác nhận đã gửi">Email ✓</span>'
      : e === 'failed' ? '<span class="cf cf--err" title="Email xác nhận gửi lỗi">Email lỗi</span>'
      : e === 'pending' ? '<span class="cf cf--wait" title="Đang gửi email xác nhận">Đang gửi</span>'
      : '<span class="cf" title="' + esc(CONF_EMAIL[e] || e) + '">' + esc({ none: 'Không có email', off: 'Email đang tắt', nosmtp: 'Chưa cài SMTP', skip: 'Chưa gửi email' }[e] || CONF_EMAIL[e] || e) + '</span>';
    var sl = d ? '<span class="cf cf--ok" title="Khách đã tải phiếu ' + esc(d) + ' lần">Đã tải phiếu</span>'
      : v ? '<span class="cf cf--ok" title="Khách đã mở phiếu ' + esc(v) + ' lần">Đã xem phiếu</span>'
      : '<span class="cf" title="Khách chưa mở phiếu">Chưa mở phiếu</span>';
    return '<span class="cf-cell' + (confMissing(x) ? ' is-missing' : '') + '">' + em + sl + '</span>';
  }
  function confSection(kind, x) { return CONF_KINDS.indexOf(kind) < 0 ? '' : '<section class="d-sec conf" data-conf-box>' + confInner(kind, x) + '</section>'; }
  function confInner(kind, x) {
    var em = confEmailOf(kind, x), ph = confPhoneOf(kind, x), url = slipUrl(x), zalo = zaloHref(ph);
    return '<h3 class="d-sec__title">Xác nhận cho khách</h3>' +
      '<div class="conf-row"><span class="conf-row__k">Email xác nhận</span><div class="conf-row__v"><p>' + confEmailHtml(x, true) + '</p>' +
        '<div class="conf-row__act"><button class="btn btn--line btn--sm" type="button" data-action="conf-resend"' + (em ? '' : ' disabled aria-describedby="confNoMail"') + '>Gửi lại email xác nhận</button></div>' +
        (em ? '' : '<p class="field__hint" id="confNoMail">Khách không nhập email nên không gửi được — hãy gửi link phiếu qua Zalo / SMS.</p>') +
        '<p class="form-msg" data-conf-msg role="alert" hidden></p></div></div>' +
      '<div class="conf-row"><span class="conf-row__k">Phiếu xác nhận</span><div class="conf-row__v">' +
        (url ? '<p>' + esc(confSlipText(x)) + '</p><div class="conf-row__act">' +
          '<a class="btn btn--line btn--sm" href="' + esc(url + '&staff=1') + '" target="_blank" rel="noopener" title="Nhân viên mở phiếu không tính là khách đã xem">Mở phiếu ↗</a>' +
          '<button class="btn btn--line btn--sm" type="button" data-action="conf-copy">Chép link phiếu</button>' +
          (zalo ? '<a class="btn btn--quiet btn--sm" href="' + esc(zalo) + '" target="_blank" rel="noopener noreferrer">Nhắn Zalo cho khách ↗</a>' : '') + '</div>' +
          (zalo ? '<p class="field__hint">Bấm “Chép link phiếu”, rồi “Nhắn Zalo cho khách” và dán link vào tin nhắn.</p>' : '')
          : '<p class="muted">Đơn cũ — chưa có phiếu xác nhận. “Gửi lại email xác nhận” sẽ tạo phiếu cho đơn này.</p>') +
      '</div></div>';
  }
  // cập nhật confirm của một mục (từ API) và vẽ lại chỗ đang hiện
  function applyConfirm(kind, id, confirm) {
    var x = findById(kind, id); if (!x || !confirm) return;
    x.confirm = confirm; S.gen++;
    if (S.drawer && S.drawer.view === kind && S.drawer.id === id) {
      var box = $('[data-conf-box]', el.drawer);
      if (box) { var msg = $('[data-conf-msg]', box), keep = msg && !msg.hidden ? [msg.textContent, msg.className] : null; box.innerHTML = confInner(kind, x); if (keep) { msg = $('[data-conf-msg]', box); msg.textContent = keep[0]; msg.className = keep[1]; msg.hidden = false; } }
    }
    if (S.view === kind) updateView();
  }
  // gửi lại email xác nhận ngay (kể cả khi mẫu email đang tắt); lỗi 400 vẫn trả confirm mới
  function resendConfirm(kind, id) {
    return api('/' + kind + '/' + encodeURIComponent(id) + '/confirm-email', { method: 'POST' }).then(function (r) {
      applyConfirm(kind, id, r && r.confirm); return r;
    }, function (e) {
      if (e && e.data && e.data.confirm) applyConfirm(kind, id, e.data.confirm);
      throw e;
    });
  }
  function copyText(text) {
    var fallback = function () {
      var ta = document.createElement('textarea'), ok = false;
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); return ok;
    };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    return Promise.resolve(fallback());
  }
  function copySlip(x) {
    var url = slipUrl(x);
    if (!url) { toast('Đơn này chưa có phiếu xác nhận.', 'info'); return; }
    copyText(url).then(function (ok) {
      if (ok) toast('Đã chép link phiếu — dán vào Zalo / SMS gửi khách.');
      else toast('Trình duyệt không cho chép tự động. Link phiếu: ' + url, 'info');
    });
  }
  function onResend(btn, kind, id) {
    var box = btn.closest('[data-conf-box]'), msg = box && $('[data-conf-msg]', box);
    setBusy(btn, true); if (msg) setMsg(msg, '');
    resendConfirm(kind, id).then(function () {
      var x = findById(kind, id), e2 = confEmail(x);
      toast('Đã gửi email xác nhận' + (e2.to ? ' tới ' + e2.to : '') + '.');
    }, function (e) {
      if (e && (e.status === 401 || e.status === 403)) return;
      var m = $('[data-conf-box] [data-conf-msg]', el.drawer); if (m) setMsg(m, e.message);
      toast(e.message, 'err');
    }).then(function () { var b = $('[data-action="conf-resend"]', el.drawer); if (b) setBusy(b, false); });
  }

  // ═══ Đơn hàng / Đăng ký / Tư vấn ═══════════════════════════════════════════
  var COLL = {
    orders: {
      eyebrow: 'Shop', noun: 'đơn hàng',
      empty: 'Chưa có đơn hàng nào', emptySub: 'Đơn đặt từ trang Shop sẽ xuất hiện ở đây.',
      name: function (o) { return cust(o).name; },
      phone: function (o) { return cust(o).phone; },
      email: function (o) { return cust(o).email; },
      search: function (o) { var c = cust(o); return [o.code, c.name, c.phone, c.email]; },
      meta: function (o) { return money(o.total); },
      cols: [
        ['Mã', 'c-code', function (o) { return codeLink('orders', o) + (o.source ? ' <span class="src-tag" title="Đơn tạo tay · ' + esc(label(SOURCE, o.source)) + '">' + esc(label(SOURCE_TAG, o.source)) + '</span>' : ''); }],
        ['Ngày giờ', 'c-date', function (o) { return dateCell(o.createdAt); }],
        ['Khách', 'c-name', function (o) { return or(cust(o).name); }],
        ['SĐT', 'c-phone', function (o) { return or(cust(o).phone); }],
        ['Số món', 'c-num', function (o) { return esc(qtyOf(o)); }],
        ['Tổng', 'c-money', function (o) { return '<strong>' + esc(money(o.total)) + '</strong>' + payTag('orders', o); }],
        ['Thanh toán', 'c-pay', function (o) { return or(label(PAY_SHORT, o.pay)); }],
        ['Xác nhận', 'c-conf', confCell],
        ['Trạng thái', 'c-status', function (o) { return badge('orders', o.status); }],
      ],
      detail: function (o) {
        var c = cust(o);
        var addr = [c.address, c.ward, c.city].filter(Boolean).join(', ');
        return sec('Khách hàng', kv([
          ['Họ tên', c.name], ['Điện thoại', c.phone], ['Email', c.email], ['Địa chỉ', addr],
        ]) + (c.note ? quote('Ghi chú của khách', c.note) : '')) +
          sec('Sản phẩm · ' + qtyOf(o) + ' món', itemsHtml(o.items) + totalsHtml(o)) +
          sec('Thanh toán & giao hàng', kv([
            ['Thanh toán', label(PAY, o.pay) || '—'], ['Đã nhận tiền', paidText('orders', o)], ['Giao hàng', label(SHIP, o.ship) || '—'],
            ['Đơn vị vận chuyển', o.carrier], ['Mã vận đơn', o.trackingCode],
            ['Mã giảm giá', o.promo], ['Nguồn đơn', o.source ? 'Tạo tay · ' + label(SOURCE, o.source) + (o.createdBy ? ' · bởi ' + o.createdBy : '') : 'Website'],
            ['Ngôn ngữ đặt hàng', label(LANG, o.lang)],
          ]));
      },
    },
    registrations: {
      eyebrow: 'Khóa học', noun: 'đăng ký',
      empty: 'Chưa có đăng ký khóa học nào', emptySub: 'Học viên đăng ký từ trang Khóa học sẽ xuất hiện ở đây.',
      name: function (r) { return r.name; },
      phone: function (r) { return r.phone; },
      email: function (r) { return r.email; },
      search: function (r) { return [r.code, r.name, r.phone, r.email, programName(r)]; },
      meta: function (r) { return programName(r); },
      cols: [
        ['Mã', 'c-code', function (r) { return codeLink('registrations', r); }],
        ['Ngày giờ', 'c-date', function (r) { return dateCell(r.createdAt); }],
        ['Học viên', 'c-name', function (r) { return or(r.name); }],
        ['SĐT', 'c-phone', function (r) { return or(r.phone); }],
        ['Chương trình', 'c-prog', function (r) { return esc(programName(r)); }],
        ['Bắt đầu', 'c-when', function (r) { return or(fmtWhen(r.date)); }],
        ['Học phí', 'c-money', function (r) { return (r.total ? esc(money(r.total)) : (r.program === 'trial' ? 'Miễn phí' : '<span class="muted">—</span>')) + payTag('registrations', r); }],
        ['Xác nhận', 'c-conf', confCell],
        ['Trạng thái', 'c-status', function (r) { return badge('registrations', r.status); }],
      ],
      detail: function (r) {
        return sec('Học viên', kv([
          ['Họ tên', r.name], ['Điện thoại', r.phone], ['Email', r.email], ['Ngôn ngữ', label(LANG, r.lang)],
        ])) +
          sec('Đăng ký', kv([
            ['Chương trình', programName(r)], ['Chi tiết', r.detail], ['Gói', r.pkg ? (/^\d+$/.test(r.pkg) ? r.pkg + ' tháng' : r.pkg) : ''],
            ['Lớp / ca', r.opt ? ({ am: 'Ca sáng', pm: 'Ca tối', A: 'Lớp A', B: 'Lớp B' }[r.opt] || 'Lớp ' + r.opt) : ''],
            ['Ngày bắt đầu mong muốn', fmtWhen(r.date)],
          ])) +
          sec('Thanh toán', kv([
            ['Hình thức', r.payName || r.pay], ['Tổng học phí', r.total ? money(r.total) : (r.program === 'trial' ? 'Miễn phí' : '')],
            ['Cần thanh toán trước', r.due ? money(r.due) : ''], ['Đã nhận tiền', paidText('registrations', r)],
          ])) +
          (r.startDate || r.endDate ? sec('Hội viên', kv([
            ['Bắt đầu tập', r.startDate ? fmtWhen(r.startDate) : ''],
            ['Hết hạn', r.endDate ? fmtWhen(r.endDate) + memberLeft(r) : 'Chưa có — đặt trong “Sửa đăng ký”'],
          ])) : '') +
          (r.note ? sec('Ghi chú của học viên', '<p class="note-text">' + esc(r.note) + '</p>') : '');
      },
    },
    consults: {
      eyebrow: 'Dịch vụ setup phòng tập', noun: 'yêu cầu',
      empty: 'Chưa có yêu cầu tư vấn nào', emptySub: 'Yêu cầu từ trang Dịch vụ setup sẽ xuất hiện ở đây.',
      name: function (c) { return c.name; },
      phone: function (c) { return c.phone; },
      email: function () { return ''; },
      search: function (c) { return [c.code, c.name, c.phone, c.city, (c.typeName || label(BIZ, c.type))]; },
      meta: function (c) { return [(c.typeName || label(BIZ, c.type)), (c.areaName || label(AREA, c.area))].filter(Boolean).join(' · ') || c.city || ''; },
      cols: [
        ['Mã', 'c-code', function (c) { return codeLink('consults', c); }],
        ['Ngày giờ', 'c-date', function (c) { return dateCell(c.createdAt); }],
        ['Khách', 'c-name', function (c) { return or(c.name); }],
        ['SĐT', 'c-phone', function (c) { return or(c.phone); }],
        ['Khu vực', 'c-city', function (c) { return or(c.city); }],
        ['Loại hình', 'c-type', function (c) { return or((c.typeName || label(BIZ, c.type))); }],
        ['Diện tích', 'c-area', function (c) { return or((c.areaName || label(AREA, c.area))); }],
        ['Trạng thái', 'c-status', function (c) { return badge('consults', c.status); }],
      ],
      detail: function (c) {
        var svc = Array.isArray(c.svc) ? c.svc.filter(Boolean) : [];
        return sec('Khách hàng', kv([
          ['Họ tên', c.name], ['Điện thoại', c.phone], ['Tỉnh / thành', c.city], ['Ngôn ngữ', label(LANG, c.lang)],
        ])) +
          sec('Dự án', kv([
            ['Loại hình', (c.typeName || label(BIZ, c.type))], ['Diện tích', (c.areaName || label(AREA, c.area))], ['Ngân sách', c.budgetName || c.budget],
          ]) + (svc.length ? '<div class="kv kv--block"><div class="kv__row"><dt>Dịch vụ quan tâm</dt><dd><span class="tags">' +
            svc.map(function (s, i) { return '<span class="tag">' + esc((c.svcNames && c.svcNames[i]) || label(SVC, s)) + '</span>'; }).join('') + '</span></dd></div></div>' : '')) +
          (c.note ? sec('Ghi chú của khách', '<p class="note-text">' + esc(c.note) + '</p>') : '');
      },
    },
  };

  // ── lọc theo thời gian (ngày tạo) ──
  function dateStart(key) {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    if (key === 'today') return d.getTime();
    if (key === '7d') { d.setDate(d.getDate() - 6); return d.getTime(); }
    if (key === '30d') { d.setDate(d.getDate() - 29); return d.getTime(); }
    if (key === 'month') { d.setDate(1); return d.getTime(); }
    return 0;
  }
  function chipTest(kind, f, x) {
    return f === 'all' || (f === 'noconf' ? confMissing(x) : f === 'unpaid' ? awaitingPay(kind, x) : x.status === f);
  }
  // danh sách đang hiện: thời gian + chip + tìm kiếm (dùng chung cho bảng và Xuất CSV)
  function listRows(kind) {
    var all = S.data[kind] || [], since = dateStart(S.date[kind]), f = S.filter[kind], q = S.q[kind], cfg = COLL[kind];
    var inRange = since ? all.filter(function (x) { return (Number(x.createdAt) || 0) >= since; }) : all;
    return { all: all, inRange: inRange, rows: inRange.filter(function (x) { return chipTest(kind, f, x) && matches(q, cfg.search(x)); }) };
  }
  // giữ nguyên chỗ đang xem khi bảng vẽ lại do tự làm mới (dòng đầu tiên đang thấy giữ nguyên vị trí trên màn hình)
  function placeOf(box) {
    if (!box || window.scrollY < 40) return null;
    var top = el.app.querySelector('.topbar'), minY = top && top.offsetHeight ? top.offsetHeight : 0;
    var rows = $$('tr[data-href]', box), hit = null;
    for (var i = 0; i < rows.length; i++) { var r = rows[i].getBoundingClientRect(); if (r.bottom > minY + 4) { hit = { href: rows[i].getAttribute('data-href'), top: r.top }; break; } }
    var fa = document.activeElement;
    if (hit && fa && box.contains(fa) && fa.hasAttribute('data-more')) hit.more = true;
    return hit;
  }
  function restorePlace(box, p) {
    if (!p) return;
    var row = box.querySelector('tr[data-href="' + CSS.escape(p.href) + '"]');
    if (row) window.scrollBy(0, row.getBoundingClientRect().top - p.top);
    if (p.more) { var m = $('[data-more]', box); if (m) m.focus({ preventScroll: true }); }
  }
  function renderCollection(kind) {
    var cfg = COLL[kind], list = S.data[kind];
    var body = $('[data-body]', el.main), count = $('[data-count]', el.main);
    var L = listRows(kind), all = L.all, inRange = L.inRange;
    var counts = {};
    inRange.forEach(function (x) { counts[x.status] = (counts[x.status] || 0) + 1; });
    var f = S.filter[kind];
    var defs = [['all', 'Tất cả', inRange.length]].concat(STATUS[kind].map(function (s) { return [s[0], s[1], counts[s[0]] || 0, s[0] === 'new']; }));
    if (kind === 'orders' || kind === 'registrations') defs.push(['unpaid', 'Chờ thanh toán', inRange.filter(function (x) { return awaitingPay(kind, x); }).length, true]);
    if (CONF_KINDS.indexOf(kind) >= 0) defs.push(['noconf', 'Chưa nhận xác nhận', inRange.filter(confMissing).length, true]);
    renderChips($('[data-chips]', el.main), defs, f);
    var ds = $('[data-date]', el.main); if (ds && ds.value !== S.date[kind]) ds.value = S.date[kind];
    if (count) count.textContent = list ? String(all.length) : '';
    if (!list) { body.innerHTML = S.err[kind] ? errorHtml(S.err[kind]) : loadingHtml(); return; }
    if (!all.length) { body.innerHTML = staleHtml(kind) + emptyHtml(cfg.empty, cfg.emptySub); return; }
    var q = S.q[kind], rows = L.rows, dated = S.date[kind] !== 'all';
    if (!rows.length) {
      body.innerHTML = staleHtml(kind) + emptyHtml(
        f === 'noconf' && !q ? 'Khách nào cũng đã nhận xác nhận' : f === 'unpaid' && !q ? 'Không có khoản nào đang chờ thanh toán'
          : f !== 'all' && !q ? 'Không có ' + cfg.noun + ' nào ở trạng thái “' + statusLabel(kind, f) + '”' : 'Không có kết quả phù hợp',
        dated ? 'Đang lọc theo thời gian “' + DATE_OPTS.filter(function (d) { return d[0] === S.date[kind]; })[0][1] + '” — thử chọn “Tất cả”.' : 'Thử chọn “Tất cả” hoặc đổi từ khóa tìm kiếm.');
      return;
    }
    var lim = Math.max(PAGE_SIZE, S.limit[kind] || PAGE_SIZE), shown = rows.slice(0, lim), rest = rows.length - shown.length;
    var place = S.autoRender ? placeOf(body) : null;
    body.innerHTML = staleHtml(kind) + tableHtml(kind, cfg.cols, shown, {
      href: function (x) { return idHref(kind, x.id); },
      rowClass: function (x) { return x.status === 'new' ? 'is-new' : ''; },
    }) + '<div class="list-foot"><p class="results-meta">Hiển thị ' + shown.length + ' / ' + rows.length + ' ' + esc(cfg.noun) +
      (rows.length !== all.length ? ' phù hợp · tổng ' + all.length : '') + '</p>' +
      (rest > 0 ? '<button class="btn btn--line" type="button" data-more>Xem thêm ' + Math.min(PAGE_SIZE, rest) + ' (còn ' + rest + ')</button>' : '') + '</div>';
    restorePlace(body, place);
  }

  // ═══ Tổng quan ══════════════════════════════════════════════════════════════
  function renderDashboard() {
    var body = $('[data-body]', el.main); if (!body) return;
    var html = '';
    if (ssGet(DEFPW_KEY) === '1') {
      html += '<div class="alert" role="alert">' + ICON.warn +
        '<div class="alert__text"><strong>Bạn đang dùng mật khẩu mặc định.</strong>' +
        '<span>Ai biết mật khẩu này đều xem được đơn hàng và thông tin khách. Hãy đổi mật khẩu ngay.</span></div>' +
        '<button class="btn btn--primary" type="button" data-action="password">Đổi mật khẩu</button></div>';
    }
    var st = S.data.stats;
    if (!st) { body.innerHTML = html + (S.err.stats ? errorHtml(S.err.stats) : loadingHtml()); return; }
    var o = st.orders || {}, r = st.registrations || {}, c = st.consults || {}, m = st.money || {}, mo = m.orders || {}, mr = m.registrations || {};
    var cards = [
      { label: 'Đơn hàng mới', value: num(o['new']), sub: 'Tổng ' + num(o.total) + ' đơn', href: '#/orders', filter: 'orders:new', alert: o['new'] > 0 },
      { label: 'Đăng ký khóa học mới', value: num(r['new']), sub: 'Tổng ' + num(r.total) + ' đăng ký', href: '#/registrations', filter: 'registrations:new', alert: r['new'] > 0 },
      { label: 'Yêu cầu tư vấn mới', value: num(c['new']), sub: 'Tổng ' + num(c.total) + ' yêu cầu', href: '#/consults', filter: 'consults:new', alert: c['new'] > 0 },
      { label: 'Người nhận tin', value: num(st.subscribers), sub: 'Email đăng ký bản tin', href: '#/subscribers' },
      { label: 'Đã thu · 30 ngày', value: money(m.collected30), sub: 'Đơn hàng ' + money(mo.collected30) + ' · Khóa học ' + money(mr.collected30) + ' — tính theo ngày ghi “Đã nhận tiền”', href: '#/orders', filter: 'orders:all', wide: true },
      { label: 'Chờ thu', value: money(m.pending), wide: true, alert: (m.pendingCount || 0) > 0,
        sub: (m.pendingCount ? num(m.pendingCount) + ' khoản chuyển khoản / học phí chưa nhận tiền' : 'Không có khoản chuyển khoản / học phí nào đang chờ') +
          (m.codCount ? ' · thêm ' + money(m.cod) + ' COD đang chờ giao (' + num(m.codCount) + ' đơn)' : ''),
        href: (m.pendingOrders || !m.pendingRegs) ? '#/orders' : '#/registrations', filter: ((m.pendingOrders || !m.pendingRegs) ? 'orders' : 'registrations') + ':unpaid' },
      { label: 'Đã thu · từ trước tới nay', value: money(m.collected), sub: 'Đơn hàng ' + money(mo.collected) + ' · Khóa học ' + money(mr.collected), href: '#/customers', wide: true },
      { label: 'Doanh số đặt hàng · 30 ngày', value: money(o.revenue30), sub: 'Giá trị đơn đặt trong 30 ngày (kể cả đơn chưa thu tiền), không tính đơn đã hủy', href: '#/orders', filter: 'orders:all', wide: true },
    ];
    html += '<div class="stats">' + cards.map(function (k) {
      return '<a class="stat' + (k.wide ? ' stat--wide' : '') + '" href="' + k.href + '"' + (k.filter ? ' data-set-filter="' + k.filter + '"' : '') + '>' +
        '<span class="stat__label">' + esc(k.label) + '</span>' +
        '<span class="stat__value">' + esc(k.value) + '</span>' +
        '<span class="stat__sub">' + esc(k.sub) + '</span>' +
        (k.alert ? '<span class="stat__flag">Cần xử lý</span>' : '') + '</a>';
    }).join('') + '</div>';

    var low = (Array.isArray(st.lowStock) ? st.lowStock : []).slice().sort(function (a, b) { return (a.stock || 0) - (b.stock || 0); });
    var lowHtml = '<section class="panel"><header class="panel__head"><h2 class="panel__title">Sắp hết hàng</h2>' +
      '<a class="link-more" href="#/products" data-set-filter="products:low">Sản phẩm →</a></header>' +
      (low.length ? '<ul class="mini-list">' + low.map(function (p) {
        var n = Number(p.stock) || 0;
        return '<li><a class="stock-row" href="' + esc(idHref('products', p.id)) + '"><span class="stock-row__name">' + esc(p.name) + '</span>' +
          '<span class="stock-row__n">' + (n <= 0 ? 'Hết hàng' : 'Còn ' + esc(n)) + '</span></a></li>';
      }).join('') + '</ul>' : '<p class="mini-state">Tất cả sản phẩm đang bán đều còn trên ' + LOW_STOCK + ' cái.</p>') + '</section>';

    // thẻ của màn bổ sung; tài khoản nhân viên chỉ thấy thẻ đánh dấu staff (không gọi API chỉ dành cho admin)
    DASH_HOOKS.forEach(function (h) { if (!h.staff && !isAdmin()) return; try { html += h.fn() || ''; } catch (e) { if (window.console) console.error(e); } });
    html += '<div class="dash-grid">' +
      recentPanel('orders', 'Đơn hàng gần đây') + lowHtml +
      recentPanel('registrations', 'Đăng ký khóa học gần đây') +
      recentPanel('consults', 'Yêu cầu tư vấn gần đây') + '</div>';
    body.innerHTML = html;
  }

  function recentPanel(kind, title) {
    var cfg = COLL[kind], list = S.data[kind], inner;
    if (!list) inner = '<p class="mini-state">' + (S.err[kind] ? esc(S.err[kind]) : 'Đang tải…') + '</p>';
    else if (!list.length) inner = '<p class="mini-state">' + esc(cfg.empty) + '</p>';
    else {
      inner = '<ul class="mini-list">' + list.slice(0, 5).map(function (x) {
        return '<li><a class="mini-row' + (x.status === 'new' ? ' is-new' : '') + '" href="' + esc(idHref(kind, x.id)) + '">' +
          '<span class="mini-row__top"><span class="code">' + esc(x.code || x.id) + '</span>' + badge(kind, x.status) + '</span>' +
          '<span class="mini-row__name">' + esc(cfg.name(x) || '—') + '</span>' +
          '<span class="mini-row__meta"><span>' + esc(fmtDate(x.createdAt)) + '</span><span>' + esc(cfg.meta(x)) + '</span></span></a></li>';
      }).join('') + '</ul>';
    }
    return '<section class="panel"><header class="panel__head"><h2 class="panel__title">' + esc(title) + '</h2>' +
      '<a class="link-more" href="#/' + kind + '" data-set-filter="' + kind + ':all">Xem tất cả →</a></header>' + inner + '</section>';
  }

  // ═══ Sản phẩm (danh sách) ═══════════════════════════════════════════════════
  function thumb(url, alt) {
    var src = safeImg(url);
    return '<span class="thumb">' + (src ? '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '" loading="lazy">' : ICON.image) + '</span>';
  }
  var PRODUCT_COLS = [
    ['Ảnh', 'c-thumb', function (p) { return thumb(p.img, ''); }],
    ['Sản phẩm', 'c-name', function (p) {
      return '<a class="cell-title" href="' + esc(idHref('products', p.id)) + '">' + esc(p.name || 'Chưa đặt tên') + '</a>' +
        '<span class="cell-sub">' + esc(p.id) + (p.visible === false ? ' · <span class="tag tag--muted">Đang ẩn</span>' : '') + '</span>';
    }],
    ['Danh mục', 'c-cat', function (p) { return or(catName(p.cat)); }],
    ['Giá', 'c-money', function (p) {
      return '<strong>' + esc(money(p.price)) + '</strong>' + (Number(p.old) > Number(p.price) ? ' <s class="cell-old">' + esc(money(p.old)) + '</s>' : '');
    }],
    ['Tồn kho', 'c-stock', function (p) {
      var n = Number(p.stock) || 0, by = p.stockBy && typeof p.stockBy === 'object' ? p.stockBy : null;
      var out = by ? Object.keys(by).filter(function (k) { return !(Number(by[k]) > 0); }).length : 0;
      return '<span class="stock' + (n <= LOW_STOCK ? ' stock--low' : '') + '">' + esc(n) + (n <= 0 ? ' · hết' : '') + '</span>' +
        (by ? '<span class="cell-sub">theo size / màu' + (out && n > 0 ? ' · ' + esc(out) + ' loại hết' : '') + '</span>' : '');
    }],
    ['Hiển thị', 'c-toggle', function (p) {
      return '<label class="switch"><input type="checkbox" data-visible="' + esc(p.id) + '"' + (p.visible !== false ? ' checked' : '') + '>' +
        '<span class="switch__ui" aria-hidden="true"></span><span class="sr">Hiển thị “' + esc(p.name) + '” trên Shop</span></label>';
    }],
  ];

  function renderProducts() {
    var list = S.data.products, body = $('[data-body]', el.main), count = $('[data-count]', el.main);
    var all = list || [];
    var f = S.filter.products;
    var isLow = function (p) { return (Number(p.stock) || 0) <= LOW_STOCK; };
    var defs = [['all', 'Tất cả', all.length]];
    catList().forEach(function (c) { defs.push([c.id, c.name.vi, all.filter(function (p) { return p.cat === c.id; }).length]); });
    // sản phẩm nằm trong mã danh mục không còn tồn tại → vẫn lọc được
    all.forEach(function (p) { if (p.cat && !catById(p.cat) && !defs.some(function (d) { return d[0] === p.cat; })) defs.push([p.cat, p.cat, all.filter(function (x) { return x.cat === p.cat; }).length]); });
    defs.push(['low', 'Sắp hết (≤' + LOW_STOCK + ')', all.filter(isLow).length]);
    defs.push(['hidden', 'Đang ẩn', all.filter(function (p) { return p.visible === false; }).length]);
    renderChips($('[data-chips]', el.main), defs, f);
    if (count) count.textContent = list ? String(all.length) : '';
    if (!list) { body.innerHTML = S.err.products ? errorHtml(S.err.products) : loadingHtml(); return; }
    if (!all.length) { body.innerHTML = staleHtml('products') + emptyHtml('Chưa có sản phẩm nào', 'Bấm “Thêm sản phẩm” để tạo sản phẩm đầu tiên cho Shop.'); return; }
    var q = S.q.products;
    var rows = all.filter(function (p) {
      var okF = f === 'all' || (f === 'low' ? isLow(p) : f === 'hidden' ? p.visible === false : p.cat === f);
      return okF && matches(q, [p.name, p.id, catName(p.cat)]);
    });
    if (!rows.length) { body.innerHTML = staleHtml('products') + emptyHtml('Không có sản phẩm phù hợp', 'Thử chọn “Tất cả” hoặc đổi từ khóa tìm kiếm.'); return; }
    body.innerHTML = staleHtml('products') + tableHtml('products', PRODUCT_COLS, rows, {
      href: function (p) { return idHref('products', p.id); },
      rowClass: function (p) { return p.visible === false ? 'is-hidden' : ''; },
    }) + '<p class="results-meta">Hiển thị ' + rows.length + ' / ' + all.length + ' sản phẩm</p>';
  }

  function toggleVisible(input) {
    var id = input.getAttribute('data-visible');
    var p = findById('products', id); if (!p) return;
    var want = input.checked;
    input.disabled = true;
    api('/products/' + encodeURIComponent(id), { method: 'PUT', body: { visible: want } }).then(function (upd) {
      replaceItem('products', upd);
      toast(want ? 'Đã hiển thị “' + p.name + '” trên Shop' : 'Đã ẩn “' + p.name + '” khỏi Shop');
      updateView(); renderNav(); refresh();
    }, function (e) {
      input.checked = !want; apiFail(e);
    }).then(function () { input.disabled = false; });
  }

  // ═══ Nhận tin ═══════════════════════════════════════════════════════════════
  function filteredSubs() {
    var q = S.q.subscribers;
    return (S.data.subscribers || []).filter(function (s) { return matches(q, [s.email, s.source]); });
  }
  var SUB_COLS = [
    ['Email', 'c-name', function (s) { return '<span class="cell-title">' + esc(s.email) + '</span>'; }],
    ['Nguồn', 'c-src', function (s) { return or(s.source); }],
    ['Ngày đăng ký', 'c-date', function (s) { return dateCell(s.createdAt); }],
    ['Thao tác', 'c-act', function (s) {
      return '<button class="icon-btn icon-btn--line" type="button" data-del-sub="' + esc(s.id) + '" aria-label="Xóa ' + esc(s.email) + '" title="Xóa">' + ICON.trash + '</button>';
    }],
  ];
  function renderSubscribers() {
    var list = S.data.subscribers, body = $('[data-body]', el.main), count = $('[data-count]', el.main);
    if (count) count.textContent = list ? String(list.length) : '';
    if (!list) { body.innerHTML = S.err.subscribers ? errorHtml(S.err.subscribers) : loadingHtml(); return; }
    if (!list.length) { body.innerHTML = staleHtml('subscribers') + emptyHtml('Chưa có người nhận tin nào', 'Email đăng ký bản tin trên website sẽ xuất hiện ở đây.'); return; }
    var rows = filteredSubs();
    if (!rows.length) { body.innerHTML = staleHtml('subscribers') + emptyHtml('Không có email phù hợp', 'Thử đổi từ khóa tìm kiếm.'); return; }
    body.innerHTML = staleHtml('subscribers') + tableHtml('subscribers', isAdmin() ? SUB_COLS : SUB_COLS.slice(0, 3), rows) +
      '<p class="results-meta">Hiển thị ' + rows.length + ' / ' + list.length + ' email</p>';
  }

  // ── Xuất CSV (mở bằng Excel / Google Sheets): UTF-8 có BOM để Excel đọc đúng tiếng Việt ──
  // ô chữ bắt đầu bằng = + - @ được thêm ' phía trước để Excel không chạy như công thức (CSV injection)
  function csvCell(v) {
    if (typeof v === 'number') return isFinite(v) ? String(v) : '';
    if (v && v.raw) return v.raw;
    var s = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  // số điện thoại giữ số 0 đầu khi mở bằng Excel (="0909…"); chỉ áp dụng cho chuỗi toàn số
  function csvPhone(p) { var s = String(p == null ? '' : p).trim(); return /^\+?\d[\d .\-]{5,19}$/.test(s) ? { raw: '"=""' + s + '"""' } : s; }
  function downloadCsv(name, head, rows) {
    var lines = [head.map(csvCell).join(',')].concat(rows.map(function (r) { return r.map(csvCell).join(','); }));
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob), d = new Date(), a = document.createElement('a');
    a.href = url;
    a.download = 'dapper-combat-' + name + '-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  function exportCsv() {
    var rows = filteredSubs();
    if (!rows.length) { toast('Chưa có email nào để xuất', 'err'); return; }
    downloadCsv('nhan-tin', ['Email', 'Nguồn', 'Ngày đăng ký'], rows.map(function (s) { return [s.email, s.source, fmtDate(s.createdAt)]; }));
    toast('Đã xuất ' + rows.length + ' email ra file CSV');
  }
  function itemsText(items) {
    return (Array.isArray(items) ? items : []).map(function (it) {
      var opts = [it.size, it.colorName || colorName(it.color)].filter(Boolean).join(', ');
      return (Number(it.qty) || 0) + '× ' + (it.name || it.id) + (opts ? ' (' + opts + ')' : '');
    }).join('; ');
  }
  var CSV = {
    orders: { file: 'don-hang',
      head: ['Mã đơn', 'Ngày đặt', 'Trạng thái', 'Khách hàng', 'Số điện thoại', 'Email', 'Địa chỉ', 'Phường / xã', 'Tỉnh / thành', 'Sản phẩm', 'Số món',
        'Tạm tính', 'Giảm giá', 'Mã giảm giá', 'Phí giao', 'Tổng cộng', 'Thanh toán', 'Giao hàng', 'Đã nhận tiền', 'Số tiền đã nhận', 'Ngày nhận tiền', 'Ghi chú nhận tiền',
        'Đơn vị vận chuyển', 'Mã vận đơn', 'Nguồn đơn', 'Ghi chú của khách', 'Ghi chú nội bộ'],
      row: function (o) {
        var c = cust(o);
        return [o.code || o.id, fmtDate(o.createdAt), statusLabel('orders', o.status), c.name, csvPhone(c.phone), c.email, c.address, c.ward, c.city, itemsText(o.items), qtyOf(o),
          Number(o.subtotal) || 0, Number(o.discount) || 0, o.promo || '', Number(o.shipping) || 0, Number(o.total) || 0, label(PAY_SHORT, o.pay), label(SHIP, o.ship),
          o.paid ? 'Đã nhận' : 'Chưa', o.paid ? Number(o.paidAmount) || 0 : '', o.paid ? fmtDate(o.paidAt) : '', o.paidNote || '',
          o.carrier || '', o.trackingCode || '', o.source ? label(SOURCE, o.source) : 'Website', c.note, o.adminNote];
      } },
    registrations: { file: 'dang-ky-khoa-hoc',
      head: ['Mã đăng ký', 'Ngày đăng ký', 'Trạng thái', 'Học viên', 'Số điện thoại', 'Email', 'Chương trình', 'Chi tiết', 'Gói', 'Lớp / ca', 'Ngày muốn bắt đầu',
        'Học phí', 'Cần trả trước', 'Hình thức thanh toán', 'Đã nhận tiền', 'Số tiền đã nhận', 'Ngày nhận tiền', 'Ghi chú nhận tiền', 'Bắt đầu tập', 'Hết hạn', 'Ghi chú của học viên', 'Ghi chú nội bộ'],
      row: function (r) {
        return [r.code || r.id, fmtDate(r.createdAt), statusLabel('registrations', r.status), r.name, csvPhone(r.phone), r.email, programName(r), r.detail, r.pkg ? (/^\d+$/.test(r.pkg) ? r.pkg + ' tháng' : r.pkg) : '', r.opt ? label(OPT_LABEL, r.opt) : '', fmtWhen(r.date),
          Number(r.total) || 0, Number(r.due) || 0, r.payName || r.pay || '', r.paid ? 'Đã nhận' : 'Chưa', r.paid ? Number(r.paidAmount) || 0 : '', r.paid ? fmtDate(r.paidAt) : '', r.paidNote || '',
          r.startDate ? fmtWhen(r.startDate) : '', r.endDate ? fmtWhen(r.endDate) : '', r.note, r.adminNote];
      } },
    consults: { file: 'tu-van-setup',
      head: ['Mã yêu cầu', 'Ngày gửi', 'Trạng thái', 'Khách hàng', 'Số điện thoại', 'Tỉnh / thành', 'Loại hình', 'Diện tích', 'Ngân sách', 'Dịch vụ quan tâm', 'Ghi chú của khách', 'Ghi chú nội bộ'],
      row: function (c) {
        var svc = (Array.isArray(c.svc) ? c.svc : []).map(function (s, i) { return (c.svcNames && c.svcNames[i]) || label(SVC, s); }).join('; ');
        return [c.code || c.id, fmtDate(c.createdAt), statusLabel('consults', c.status), c.name, csvPhone(c.phone), c.city, c.typeName || label(BIZ, c.type), c.areaName || label(AREA, c.area), c.budgetName || c.budget, svc, c.note, c.adminNote];
      } },
  };
  // xuất đúng danh sách đang thấy (bộ lọc trạng thái + thời gian + tìm kiếm), mọi dòng — không chỉ 50 dòng đầu
  function exportList(kind) {
    var def = CSV[kind]; if (!def) return;
    if (!S.data[kind]) { toast('Dữ liệu chưa tải xong, thử lại sau giây lát.', 'info'); return; }
    var rows = listRows(kind).rows;
    if (!rows.length) { toast('Không có dòng nào để xuất với bộ lọc hiện tại.', 'err'); return; }
    downloadCsv(def.file, def.head, rows.map(def.row));
    toast('Đã xuất ' + rows.length + ' ' + COLL[kind].noun + ' ra file CSV');
  }

  function deleteSubscriber(id) {
    var s = findById('subscribers', id); if (!s) return;
    confirmDialog({ title: 'Xóa email khỏi danh sách nhận tin?', body: s.email + ' sẽ không nhận bản tin nữa. Thao tác này không thể hoàn tác.', ok: 'Xóa email' })
      .then(function (yes) {
        if (!yes) return;
        api('/subscribers/' + encodeURIComponent(id), { method: 'DELETE' }).then(function () {
          removeItem('subscribers', id); toast('Đã xóa ' + s.email); updateView(); refresh();
        }, apiFail);
      });
  }

  // ═══ Drawer (bảng chi tiết) ═════════════════════════════════════════════════
  function sec(title, inner) { return '<section class="d-sec"><h3 class="d-sec__title">' + esc(title) + '</h3>' + inner + '</section>'; }
  // rows: [nhãn, giá trị thô] — tự escape, bỏ qua giá trị rỗng
  function kv(rows) {
    var r = rows.filter(function (x) { return x[1] != null && x[1] !== ''; });
    return r.length ? '<dl class="kv">' + r.map(function (x) { return '<div class="kv__row"><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('') + '</dl>' : '<p class="muted">Không có thông tin.</p>';
  }
  function quote(title, text) { return '<div class="quote"><span class="quote__label">' + esc(title) + '</span><p class="note-text">' + esc(text) + '</p></div>'; }

  function itemsHtml(items) {
    if (!Array.isArray(items) || !items.length) return '<p class="muted">Không có sản phẩm.</p>';
    return '<ul class="items">' + items.map(function (it) {
      it = it || {};
      var opts = [it.size, it.colorName || colorName(it.color)].filter(Boolean).join(' · ');
      var line = it.line != null ? it.line : (Number(it.qty) || 0) * (Number(it.price) || 0);
      return '<li class="item">' + thumb(it.img, '') +
        '<span class="item__info"><span class="item__name">' + esc(it.name || it.id || 'Sản phẩm') + '</span>' +
        (opts ? '<span class="item__opts">' + esc(opts) + '</span>' : '') +
        '<span class="item__qty">' + esc(it.qty) + ' × ' + esc(money(it.price)) + '</span></span>' +
        '<span class="item__line">' + esc(money(line)) + '</span></li>';
    }).join('') + '</ul>';
  }
  function totalsHtml(o) {
    return '<dl class="totals">' +
      '<div><dt>Tạm tính</dt><dd>' + esc(money(o.subtotal)) + '</dd></div>' +
      (o.discount ? '<div><dt>Giảm giá' + (o.promo ? ' (' + esc(o.promo) + ')' : '') + '</dt><dd>−' + esc(money(o.discount)) + '</dd></div>' : '') +
      '<div><dt>Phí giao hàng</dt><dd>' + (o.shipping ? esc(money(o.shipping)) : 'Miễn phí') + '</dd></div>' +
      '<div class="totals__grand"><dt>Tổng cộng</dt><dd>' + esc(money(o.total)) + '</dd></div></dl>';
  }
  function contactLinks(phone, email) {
    var tel = telHref(phone), zalo = zaloHref(phone), h = '';
    if (tel) h += '<a class="btn btn--line" href="' + esc(tel) + '">' + ICON.phone + '<span>Gọi</span></a>';
    if (zalo) h += '<a class="btn btn--line" href="' + esc(zalo) + '" target="_blank" rel="noopener noreferrer">' + ICON.chat + '<span>Zalo</span></a>';
    if (email && EMAIL_RE.test(email)) h += '<a class="btn btn--line" href="mailto:' + esc(encodeURI(email)) + '">' + ICON.mail + '<span>Email</span></a>';
    return h ? '<div class="quick">' + h + '</div>' : '';
  }
  // lịch sử: đổi trạng thái, sửa đơn / đăng ký, ghi nhận tiền — kèm người làm
  function historyHtml(kind, item) {
    var h = (Array.isArray(item.history) ? item.history : []).filter(function (x) { return x && (x.status || x.edit || x.paid !== undefined); });
    if (!item.source && (!h.length || h[0].status !== 'new')) h = [{ at: item.createdAt, status: 'new' }].concat(h);
    return sec('Lịch sử', '<ol class="timeline">' + h.slice().reverse().map(function (x, i) {
      var title = x.edit ? 'Đã sửa' : x.paid === true ? 'Đã nhận tiền · ' + money(x.amount) : x.paid === false ? 'Bỏ ghi nhận đã nhận tiền' : statusLabel(kind, x.status);
      return '<li class="' + (i === 0 ? 'is-current' : '') + (x.edit || x.paid !== undefined ? ' is-note' : '') + '"><span class="timeline__main"><span class="timeline__status">' + esc(title) + '</span>' +
        (x.note ? '<span class="timeline__note">' + esc(x.note) + '</span>' : '') + (x.by ? '<span class="timeline__by">' + esc(x.by) + '</span>' : '') + '</span>' +
        '<time>' + esc(fmtDate(x.at)) + '</time></li>';
    }).join('') + '</ol>');
  }
  // trường nhập trong drawer (nhãn là chữ có sẵn trong mã, không lấy từ dữ liệu)
  function fld(lbl, inner, hint, cls) {
    return '<label class="field' + (cls ? ' ' + cls : '') + '"><span class="field__label">' + lbl + '</span>' + inner + (hint ? '<small class="field__hint">' + hint + '</small>' : '') + '</label>';
  }
  function moneyInput(name, v, attrs) {
    return '<span class="set-affix set-money"><input type="text" inputmode="numeric" autocomplete="off" data-money name="' + name + '" value="' + esc(v === '' || v == null ? '' : num(v)) + '"' + (attrs || '') + '><em>₫</em></span>';
  }
  // khối "Đã nhận tiền" trong phần Xử lý
  function payBoxHtml(kind, x) {
    var due = dueOf(kind, x), on = !!x.paid;
    return '<div class="paybox" data-paybox>' +
      '<label class="check set-switch"><input type="checkbox" name="paid"' + (on ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span><strong>Đã nhận tiền</strong></span></label>' +
      '<div class="grid2" data-pay-fields' + (on ? '' : ' hidden') + '>' +
        fld('Số tiền đã nhận', moneyInput('paidAmount', on ? x.paidAmount : due), (kind === 'orders' ? 'Tổng đơn ' : 'Cần thu ') + esc(money(due))) +
        fld('Ghi chú nhận tiền', '<input type="text" name="paidNote" maxlength="300" value="' + esc(x.paidNote || '') + '" placeholder="VD: VCB, mã GD 123456" autocomplete="off">') +
      '</div>' +
      '<p class="field__hint">' + (on ? 'Ghi nhận lúc ' + esc(fmtDate(x.paidAt)) + (x.paidBy ? ' · bởi ' + esc(x.paidBy) : '') + (Number(x.paidAmount) !== due && due ? ' · <strong>' + (Number(x.paidAmount) < due ? 'còn thiếu ' + esc(money(due - x.paidAmount)) : 'nhận dư ' + esc(money(x.paidAmount - due))) + '</strong>' : '')
        : awaitingPay(kind, x) ? 'Khách chưa thanh toán — bật khi đã nhận tiền (kiểm tra sao kê ngân hàng / MoMo).'
          : kind === 'orders' && x.pay === 'cod' ? 'Đơn COD tự ghi “Đã nhận tiền” khi chuyển sang “Hoàn tất”.' : 'Bật khi đã nhận tiền của khách.') + '</p>' +
      '</div>';
  }
  var CARRIERS = ['GHN', 'GHTK', 'Viettel Post', 'J&T Express', 'Ninja Van', 'VNPost', 'Ahamove', 'Grab Express', 'Nhân viên giao'];
  function drawerHead(eyebrow, title, subHtml) {
    return '<header class="drawer__head"><div class="drawer__heading">' +
      '<p class="eyebrow">' + esc(eyebrow) + '</p><h2 class="drawer__title" id="drawerTitle">' + esc(title) + '</h2>' +
      (subHtml ? '<div class="drawer__sub">' + subHtml + '</div>' : '') + '</div>' +
      '<button class="icon-btn" type="button" data-close aria-label="Đóng">' + ICON.close + '</button></header>';
  }

  function detailHtml(kind, item) {
    var cfg = COLL[kind];
    var eyebrow = { orders: 'Đơn hàng', registrations: 'Đăng ký khóa học', consults: 'Tư vấn setup' }[kind];
    var head = drawerHead(eyebrow, item.code || item.id, badge(kind, item.status) + '<span>' + esc(fmtDate(item.createdAt)) + '</span>');
    var manage = '<section class="d-sec d-sec--manage"><h3 class="d-sec__title">Xử lý</h3>' +
      '<form id="detailForm" class="manage" novalidate>' +
      '<label class="field"><span class="field__label">Trạng thái</span><select name="status">' +
      STATUS[kind].map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === item.status ? ' selected' : '') + '>' + esc(s[1]) + '</option>'; }).join('') +
      (STATUS[kind].some(function (s) { return s[0] === item.status; }) ? '' : '<option value="' + esc(item.status) + '" selected>' + esc(item.status || '—') + '</option>') +
      '</select></label>' +
      (kind === 'orders' || kind === 'registrations' ? payBoxHtml(kind, item) : '') +
      (kind === 'orders' ? '<div class="grid2">' +
        fld('Đơn vị vận chuyển', '<input type="text" name="carrier" list="carrierList" maxlength="60" value="' + esc(item.carrier || '') + '" placeholder="VD: GHN, GHTK…" autocomplete="off">') +
        fld('Mã vận đơn', '<input type="text" name="trackingCode" maxlength="60" value="' + esc(item.trackingCode || '') + '" placeholder="Mã để khách tra cứu" autocomplete="off" spellcheck="false">') +
        '</div><datalist id="carrierList">' + CARRIERS.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' : '') +
      '<label class="field"><span class="field__label">Ghi chú nội bộ</span><textarea name="adminNote" rows="4" maxlength="1000" placeholder="Chỉ nhân viên thấy — VD: đã gọi xác nhận, hẹn giao chiều thứ Sáu…">' +
      esc(item.adminNote || '') + '</textarea></label>' +
      (kind === 'orders' ? '<p class="field__hint">Chuyển sang “Đã hủy” sẽ hoàn số lượng trong đơn về tồn kho. Đơn vị vận chuyển và mã vận đơn hiện trên phiếu xác nhận của khách.</p>' : '') +
      '</form></section>';
    var body = '<div class="drawer__body">' + contactLinks(cfg.phone(item), cfg.email(item)) + manage + confSection(kind, item) + cfg.detail(item) + historyHtml(kind, item) + '</div>';
    var editLabel = kind === 'orders' ? 'Sửa đơn' : kind === 'registrations' ? 'Sửa đăng ký' : '';
    var foot = '<footer class="drawer__foot">' +
      (isAdmin() ? '<button class="btn btn--quiet" type="button" data-action="delete-item">' + ICON.trash + '<span>Xóa</span></button>' : '') +
      '<span class="spacer"></span>' +
      (editLabel ? '<button class="btn btn--line" type="button" data-action="edit-item" title="Sửa ' + (kind === 'orders' ? 'khách, sản phẩm, phí giao, giảm giá, cách thanh toán' : 'học phí, gói, ngày tập, thông tin học viên') + '">' + esc(editLabel) + '</button>' : '') +
      '<button class="btn btn--primary" type="submit" form="detailForm">Lưu</button></footer>';
    return head + body + foot;
  }

  function missingHtml(view) {
    var loading = !S.data[view] && !S.err[view];
    S.drawerPending = loading;
    return drawerHead(VIEWS[view], loading ? 'Đang tải…' : 'Không tìm thấy', '') +
      '<div class="drawer__body">' + (loading ? loadingHtml() : emptyHtml('Không tìm thấy mục này', S.err[view] ? S.err[view] : 'Có thể mục này đã bị xóa hoặc đường dẫn không đúng.')) + '</div>';
  }

  function openDrawer(view, id) {
    var same = S.drawer && S.drawer.view === view && S.drawer.id === id;
    if (same) return;
    var wasOpen = !!S.drawer;
    S.drawer = { view: view, id: id };
    S.dirty = false;
    S.drawerMode = view === 'orders' && id === 'new' ? 'create' : '';
    ED = null;
    S.drawerFrom = S.prevHash;
    if (!wasOpen) S.lastFocus = document.activeElement;
    renderDrawer();
    showDrawer();
  }

  function renderDrawer() {
    if (!S.drawer) return;
    var v = S.drawer.view, id = S.drawer.id, html;
    S.drawerPending = false;
    var keepTop = !S.drawerSwitch;
    S.drawerSwitch = false;
    if (v === 'products') {
      if (id === 'new') html = productFormHtml(null);
      else { var p = findById('products', id); html = p ? productFormHtml(p) : missingHtml('products'); }
    } else if (v === 'orders' && S.drawerMode === 'create') {
      // đơn tạo tay: cần danh sách sản phẩm trước khi vẽ form
      html = S.data.products ? orderEditorHtml(null) : missingHtml('products');
    } else {
      var item = findById(v, id);
      if (item && S.drawerMode === 'edit') html = v === 'orders' ? orderEditorHtml(item) : regEditorHtml(item);
      else html = item ? detailHtml(v, item) : missingHtml(v);
    }
    var scroll = $('.drawer__body', el.drawer);
    var top = scroll && keepTop ? scroll.scrollTop : 0;
    el.drawer.innerHTML = html;
    var pform = $('#productForm', el.drawer); if (pform) { galleryState(pform); vsInit(pform); }
    if ($('#orderEdit', el.drawer)) edRender();
    if ($('#regEdit', el.drawer)) regHints();
    var nb = $('.drawer__body', el.drawer);
    if (nb && top) nb.scrollTop = top;
  }

  function showDrawer() {
    if (!el.drawer.hidden && el.drawer.classList.contains('is-open')) { el.drawer.focus({ preventScroll: true }); return; }
    el.drawer.hidden = false; el.drawerScrim.hidden = false;
    void el.drawer.offsetWidth;
    el.drawer.classList.add('is-open'); el.drawerScrim.classList.add('is-open');
    el.app.inert = true; el.app.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.add('is-locked');
    el.drawer.focus({ preventScroll: true });
  }
  function hideDrawer(immediate) {
    el.drawer.classList.remove('is-open'); el.drawerScrim.classList.remove('is-open');
    el.app.inert = false; el.app.removeAttribute('aria-hidden');
    if (!el.app.classList.contains('side-open')) document.documentElement.classList.remove('is-locked');
    var finish = function () { if (!S.drawer) { el.drawer.hidden = true; el.drawerScrim.hidden = true; el.drawer.innerHTML = ''; } };
    if (immediate) finish(); else setTimeout(finish, 240);
    var f = S.lastFocus; S.lastFocus = null;
    if (f && document.contains(f) && typeof f.focus === 'function' && !el.app.hidden) f.focus({ preventScroll: true });
  }
  function leaveDrawer() {
    if (!S.drawer) return;
    S.dirty = false; S.drawerMode = ''; ED = null;
    var listHash = '#/' + S.drawer.view;
    // mở từ màn Khách hàng / Hội viên → đóng thì quay lại đúng chỗ đó
    if (S.drawerFrom === listHash || /^#\/(customers|members)(\/|$)/.test(S.drawerFrom || '')) history.back();
    else { history.replaceState(null, '', listHash); route(); }
  }
  function requestCloseDrawer() {
    if (!S.drawer) return;
    if (!S.dirty) { leaveDrawer(); return; }
    confirmDialog({ title: 'Bỏ thay đổi chưa lưu?', body: 'Những gì bạn vừa nhập trong bảng chi tiết sẽ không được lưu.', ok: 'Bỏ thay đổi', cancel: 'Tiếp tục sửa' })
      .then(function (yes) { if (yes) leaveDrawer(); });
  }

  // ── lưu trạng thái + ghi chú ──
  function saveDetail(form) {
    if (!S.drawer) return;
    var kind = S.drawer.view, id = S.drawer.id, item = findById(kind, id);
    if (!item) return;
    var status = F(form, 'status').value, note = F(form, 'adminNote').value;
    var body = {};
    if (status !== item.status) body.status = status;
    if (note !== (item.adminNote || '')) body.adminNote = note;
    var pd = F(form, 'paid');
    if (pd) {
      var amt = moneyVal(F(form, 'paidAmount').value), pn = F(form, 'paidNote').value.trim();
      if (pd.checked && !(amt > 0)) { var ai = F(form, 'paidAmount'); ai.classList.add('is-invalid'); ai.focus(); toast('Nhập số tiền đã nhận (lớn hơn 0).', 'err'); return; }
      if (pd.checked !== !!item.paid) body.paid = pd.checked;
      if (pd.checked && (!item.paid || amt !== Number(item.paidAmount))) { body.paid = true; body.paidAmount = amt; }
      if (pn !== (item.paidNote || '')) body.paidNote = pn;
    }
    if (kind === 'orders') {
      var ca = F(form, 'carrier').value.trim(), tc = F(form, 'trackingCode').value.trim();
      if (ca !== (item.carrier || '')) body.carrier = ca;
      if (tc !== (item.trackingCode || '')) body.trackingCode = tc;
    }
    if (!Object.keys(body).length) { toast('Không có thay đổi nào để lưu'); return; }
    var pre = Promise.resolve(true);
    if (kind === 'orders' && body.status === 'cancelled') {
      pre = confirmDialog({ title: 'Hủy đơn ' + (item.code || '') + '?', body: 'Số lượng sản phẩm trong đơn sẽ được hoàn lại vào tồn kho.' +
        (item.paid && body.paid !== false ? ' Đơn này đã ghi “Đã nhận tiền” ' + money(item.paidAmount) + ' — nếu đã hoàn tiền cho khách, hãy tắt “Đã nhận tiền” để số liệu “Đã thu” đúng.' : ''), ok: 'Xác nhận hủy đơn' });
    } else if (kind === 'orders' && item.status === 'cancelled' && body.status) {
      pre = confirmDialog({ title: 'Mở lại đơn đã hủy?', body: 'Khi hủy, hàng của đơn này đã được hoàn vào kho. Mở lại đơn sẽ trừ lại số lượng đó khỏi tồn kho (nếu kho không đủ, hệ thống sẽ báo).', ok: 'Mở lại đơn' });
    } else if (body.paid === false) {
      pre = confirmDialog({ title: 'Bỏ ghi nhận “Đã nhận tiền”?', body: 'Số tiền ' + money(item.paidAmount) + ' sẽ không còn tính vào “Đã thu” và ' + (item.code || 'mục này') + ' quay lại danh sách “Chờ thanh toán” (nếu còn phải thu).', ok: 'Bỏ ghi nhận', cancel: 'Quay lại' });
    }
    pre.then(function (go) {
      if (!go) return;
      var btn = $('[form="detailForm"]', el.drawer);
      setBusy(btn, true);
      api('/' + kind + '/' + encodeURIComponent(id), { method: 'PUT', body: body }).then(function (upd) {
        replaceItem(kind, upd);
        S.dirty = false;
        if (S.drawer && S.drawer.view === kind && S.drawer.id === id) renderDrawer();
        updateView(); renderNav();
        var extra = upd.paid && !item.paid && body.paid === undefined ? ' — đã tự ghi “Đã nhận tiền” ' + money(upd.paidAmount) : '';
        if (kind === 'registrations' && upd.status === 'enrolled' && item.status !== 'enrolled' && upd.endDate) extra += ' — hội viên đến hết ' + fmtWhen(upd.endDate);
        toast('Đã lưu ' + (upd.code || item.code || '') + extra);
        refresh();
      }, function (e) { setBusy(btn, false); apiFail(e); });
    });
  }

  function deleteCurrent() {
    if (!S.drawer) return;
    var kind = S.drawer.view, id = S.drawer.id, item = findById(kind, id);
    if (!item) return;
    var title, body, ok, path;
    if (kind === 'products') {
      title = 'Xóa sản phẩm “' + (item.name || id) + '”?';
      body = 'Sản phẩm sẽ biến mất khỏi Shop; các đơn hàng cũ vẫn giữ thông tin. Nếu chỉ muốn tạm ngừng bán, hãy tắt “Hiển thị”. Thao tác này không thể hoàn tác.';
      ok = 'Xóa sản phẩm'; path = '/products/';
    } else {
      title = 'Xóa ' + (item.code || 'mục này') + '?';
      body = 'Thao tác này không thể hoàn tác.' + (kind === 'orders' && (item.status === 'new' || item.status === 'confirmed')
        ? ' Đơn chưa giao nên số lượng trong đơn sẽ được hoàn lại vào tồn kho.' : kind === 'orders' && (item.status === 'shipping' || item.status === 'done') ? ' Đơn đã giao nên tồn kho giữ nguyên.' : '');
      ok = 'Xóa vĩnh viễn'; path = '/' + kind + '/';
    }
    confirmDialog({ title: title, body: body, ok: ok }).then(function (yes) {
      if (!yes) return;
      var btn = $('[data-action="delete-item"]', el.drawer);
      setBusy(btn, true);
      api(path + encodeURIComponent(id), { method: 'DELETE' }).then(function () {
        removeItem(kind, id);
        toast('Đã xóa ' + (item.code || item.name || ''));
        leaveDrawer(); updateView(); renderNav(); refresh();
      }, function (e) { setBusy(btn, false); apiFail(e); });
    });
  }

  // ═══ Sửa đơn / tạo đơn thủ công ═════════════════════════════════════════════
  // ED = { mode: 'edit' | 'create', id, orig (đơn gốc khi sửa), items: [{ id, name, img, size, color, colorName, qty, price }], add: ô "Thêm sản phẩm", payTouched }
  var ED = null;
  var STATUS_START = [['new', 'Mới'], ['confirmed', 'Đã xác nhận'], ['shipping', 'Đang giao'], ['done', 'Hoàn tất']];
  var PHONE_RE = /^(0|\+?84)\d{9}$/;
  // hàng của đơn đã trả về kho (đơn đã hủy) → sửa đơn không đụng tới tồn kho
  function stockOut(o) { return !!o && (o.stockReturned !== undefined ? !!o.stockReturned : o.status === 'cancelled'); }
  function vkey(size, color) { return String(size) + '::' + String(color); }
  function colorLabel(p, key) { var c = ((p && p.colors) || []).filter(function (x) { return x[0] === key; })[0]; return c && c[2] ? c[2] : colorName(key); }
  // phí giao / học phí hiện tại (Thiết lập; tài khoản nhân viên nhận bản rút gọn)
  function setData() { var A = window.DCAdmin; return A && A.settingsStore ? A.settingsStore.data() || {} : {}; }
  function shopCfg() { var sh = setData().shop || {}; return { fee: sh.shipFee != null ? +sh.shipFee : 30000, free: sh.freeShip != null ? +sh.freeShip : 1000000, exp: sh.expressFee != null ? +sh.expressFee : 35000 }; }
  // số còn trong kho cho một size / màu (sản phẩm chia tồn kho theo biến thể) hoặc cả sản phẩm — cộng lại phần đơn đang sửa đang giữ
  function availOf(p, size, color) {
    if (!p) return Infinity;
    var n = p.stockBy ? Number(p.stockBy[vkey(size, color)]) || 0 : Number(p.stock) || 0;
    if (ED && ED.orig && !stockOut(ED.orig)) (ED.orig.items || []).forEach(function (it) {
      if (it.id === p.id && (!p.stockBy || (it.size === size && it.color === color))) n += Number(it.qty) || 0;
    });
    return n;
  }
  function edNeed(p, size, color) {
    return ED.items.filter(function (it) { return it.id === p.id && (!p.stockBy || (it.size === size && it.color === color)); }).reduce(function (s, it) { return s + (Number(it.qty) || 0); }, 0);
  }
  function edSubtotal() { return ED ? ED.items.reduce(function (s, it) { return s + it.price * it.qty; }, 0) : 0; }
  function edForm() { return $('#orderEdit', el.drawer); }
  function optsHtml(pairs, v) { return pairs.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(v) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join(''); }
  function mapPairs(map) { return Object.keys(map).map(function (k) { return [k, map[k]]; }); }

  function orderEditorHtml(o) {
    var create = !o;
    if (!ED || ED.id !== (create ? 'new' : o.id)) {
      ED = { mode: create ? 'create' : 'edit', id: create ? 'new' : o.id, orig: o || null, add: { id: '', size: '', color: '', qty: 1 }, payTouched: false, shipTouched: false,
        items: create ? [] : (Array.isArray(o.items) ? o.items : []).map(function (it) {
          return { id: it.id, name: it.name || it.id, img: it.img, size: it.size, color: it.color, colorName: it.colorName || '', qty: Number(it.qty) || 1, price: Number(it.price) || 0 };
        }) };
    }
    var c = create ? {} : cust(o);
    var inp = function (name, v, extra) { return '<input type="text" name="' + name + '" value="' + esc(v || '') + '" autocomplete="off"' + (extra || '') + '>'; };
    var head = drawerHead(create ? 'Đơn tạo tay' : 'Sửa đơn hàng', create ? 'Tạo đơn mới' : (o.code || o.id),
      create ? '<span>Bán qua điện thoại, Facebook, Zalo hoặc tại phòng tập</span>' : badge('orders', o.status) + '<span>' + esc(fmtDate(o.createdAt)) + '</span>');
    var body = '<div class="drawer__body"><form id="orderEdit" class="pform" novalidate>' +
      '<p class="form-msg" data-form-msg role="alert" hidden></p>' +
      (create ? sec('Nguồn đơn', '<div class="grid2">' +
        fld('Khách đặt qua', '<select name="source">' + optsHtml(mapPairs(SOURCE), 'phone') + '</select>') +
        fld('Trạng thái ban đầu', '<select name="status">' + optsHtml(STATUS_START, 'confirmed') + '</select>', 'Đơn tạo tay không gửi Telegram / email báo đơn mới.') + '</div>') : '') +
      sec('Khách hàng', '<div class="grid2">' +
        fld('Họ tên *', inp('name', c.name, ' maxlength="80"')) +
        fld('Số điện thoại *', '<input type="tel" name="phone" value="' + esc(c.phone || '') + '" maxlength="20" inputmode="tel" autocomplete="off">') + '</div>' +
        fld('Email', '<input type="email" name="email" value="' + esc(c.email || '') + '" maxlength="120" inputmode="email" autocomplete="off" spellcheck="false">', create ? 'Có email thì gửi được email xác nhận cho khách.' : '') +
        fld('Địa chỉ', inp('address', c.address, ' maxlength="200" placeholder="Để trống nếu khách nhận tại phòng tập"')) +
        '<div class="grid2">' + fld('Phường / xã', inp('ward', c.ward, ' maxlength="80"')) + fld('Tỉnh / thành', inp('city', c.city, ' maxlength="80"')) + '</div>' +
        fld('Ghi chú của khách', '<textarea name="note" rows="2" maxlength="500">' + esc(c.note || '') + '</textarea>')) +
      sec('Sản phẩm', '<div data-ed-items></div>') +
      sec('Phí giao & giảm giá', '<div class="grid2">' +
        fld('Phí giao hàng', moneyInput('shipping', create ? 0 : Number(o.shipping) || 0), '<span data-ed-shiphint></span>') +
        fld('Giảm giá', moneyInput('discount', create ? 0 : Number(o.discount) || 0), !create && o.promo ? 'Khách dùng mã ' + esc(o.promo) + ' khi đặt.' : 'Số tiền giảm cho cả đơn.') + '</div>' +
        '<div data-ed-totals></div>') +
      sec('Thanh toán & giao hàng', '<div class="grid2">' +
        fld('Thanh toán', '<select name="pay">' + optsHtml(mapPairs(PAY), create ? 'cod' : o.pay) + '</select>') +
        fld('Giao hàng', '<select name="ship">' + optsHtml(mapPairs(SHIP), create ? 'std' : (o.ship || 'std')) + '</select>') + '</div>' +
        (create ? '<div class="paybox" data-paybox><label class="check set-switch"><input type="checkbox" name="paid"><span class="switch__ui" aria-hidden="true"></span><span><strong>Khách đã trả tiền</strong></span></label>' +
          '<div class="grid2" data-pay-fields hidden>' + fld('Số tiền đã nhận', moneyInput('paidAmount', '')) +
          fld('Ghi chú nhận tiền', '<input type="text" name="paidNote" maxlength="300" placeholder="VD: tiền mặt tại quầy" autocomplete="off">') + '</div>' +
          '<p class="field__hint">Bật nếu khách đã trả (tiền mặt, chuyển khoản…). Đơn COD tạo ở trạng thái “Hoàn tất” tự ghi đã nhận tiền.</p></div>' : '')) +
      (create ? sec('Khác', fld('Ghi chú nội bộ', '<textarea name="adminNote" rows="2" maxlength="1000" placeholder="Chỉ nhân viên thấy"></textarea>') +
        '<label class="check set-switch"><input type="checkbox" name="sendEmail" disabled><span class="switch__ui" aria-hidden="true"></span><span>Gửi email xác nhận cho khách (kèm link phiếu)</span></label>' +
        '<p class="field__hint" data-ed-mailhint>Nhập email của khách để bật. Cần cài SMTP ở Thiết lập → Thông báo. Không gửi thì vẫn chép được link phiếu để gửi qua Zalo.</p>')
        : sec('Lý do sửa', fld('Ghi vào lịch sử đơn (không bắt buộc)', inp('reason', '', ' maxlength="200" placeholder="VD: khách gọi đổi size"')))) +
      '<div data-ed-stock aria-live="polite"></div>' +
      '</form></div>';
    var foot = '<footer class="drawer__foot">' +
      '<button class="btn btn--ghost" type="button" data-action="edit-cancel">' + (create ? 'Hủy' : 'Hủy sửa') + '</button><span class="spacer"></span>' +
      '<button class="btn btn--primary" type="submit" form="orderEdit">' + (create ? 'Tạo đơn' : 'Lưu thay đổi') + '</button></footer>';
    return head + body + foot;
  }

  // vẽ lại danh sách sản phẩm trong đơn + ô thêm sản phẩm + tổng tiền (giữ nguyên các ô khách hàng đang nhập)
  function edRender(focusSel) {
    var form = edForm(); if (!form || !ED) return;
    var box = $('[data-ed-items]', form), prods = S.data.products || [];
    var lines = ED.items.map(function (it, i) {
      var p = findById('products', it.id), di = ' data-i="' + i + '"';
      var sizes = p && Array.isArray(p.sizes) ? p.sizes : [], colors = p && Array.isArray(p.colors) ? p.colors : [];
      var sizeSel = sizes.length > 1 ? '<label class="ed-sel"><span class="sr">Size</span><select data-ed-f="size"' + di + '>' + optsHtml(sizes.map(function (s) { return [s, s]; }).concat(sizes.indexOf(it.size) < 0 && it.size ? [[it.size, it.size + ' (cũ)']] : []), it.size) + '</select></label>'
        : it.size ? '<span class="ed-fixed">' + esc(it.size) + '</span>' : '';
      var colorSel = colors.length > 1 ? '<label class="ed-sel"><span class="sr">Màu</span><select data-ed-f="color"' + di + '>' + optsHtml(colors.map(function (c) { return [c[0], c[2] || colorName(c[0])]; }).concat(!colors.some(function (c) { return c[0] === it.color; }) && it.color ? [[it.color, (it.colorName || colorName(it.color)) + ' (cũ)']] : []), it.color) + '</select></label>'
        : it.color ? '<span class="ed-fixed">' + esc(it.colorName || colorLabel(p, it.color)) + '</span>' : '';
      var avail = availOf(p, it.size, it.color), need = p ? edNeed(p, it.size, it.color) : 0;
      var warn = !p ? 'Sản phẩm đã bị xóa khỏi mục Sản phẩm — chỉ đổi số lượng hoặc bỏ được.' : need > avail ? 'Kho chỉ còn ' + avail + (p.stockBy ? ' cho size / màu này' : '') + ' — bớt số lượng hoặc nhập thêm hàng ở mục Sản phẩm.' : '';
      return '<li class="ed-line' + (warn && p ? ' is-short' : '') + '"' + di + '>' + thumb(it.img, '') +
        '<div class="ed-line__main"><span class="item__name">' + esc(it.name) + '</span>' +
          (sizeSel || colorSel ? '<span class="ed-line__opts">' + sizeSel + colorSel + '</span>' : '') +
          '<span class="item__qty">' + esc(money(it.price)) + ' / cái' + (p && avail !== Infinity ? ' · kho còn ' + esc(avail) : '') + '</span>' +
          (warn ? '<span class="ed-warn">' + esc(warn) + '</span>' : '') + '</div>' +
        '<div class="ed-line__side"><span class="qty">' +
          '<button class="icon-btn icon-btn--line" type="button" data-ed-qty="-1"' + di + ' aria-label="Bớt 1"' + (it.qty <= 1 ? ' disabled' : '') + '>−</button>' +
          '<input type="number" min="1" max="999" step="1" inputmode="numeric" data-ed-f="qty"' + di + ' value="' + esc(it.qty) + '" aria-label="Số lượng ' + esc(it.name) + '">' +
          '<button class="icon-btn icon-btn--line" type="button" data-ed-qty="1"' + di + ' aria-label="Thêm 1">+</button></span>' +
          '<span class="item__line" data-ed-line="' + i + '">' + esc(money(it.price * it.qty)) + '</span>' +
          '<button class="icon-btn icon-btn--line" type="button" data-ed-del' + di + ' aria-label="Bỏ “' + esc(it.name) + '” khỏi đơn" title="Bỏ khỏi đơn">' + ICON.trash + '</button></div></li>';
    });
    // ô "Thêm sản phẩm": nhóm theo danh mục, có cả sản phẩm đang ẩn (bán tại chỗ)
    var a = ED.add, ap = a.id ? findById('products', a.id) : null;
    var groups = catList().map(function (c) { return [c.name.vi, prods.filter(function (p) { return p.cat === c.id; })]; });
    var rest = prods.filter(function (p) { return !catById(p.cat); });
    if (rest.length) groups.push(['Khác', rest]);
    var popt = function (p) {
      var n = Number(p.stock) || 0;
      return '<option value="' + esc(p.id) + '"' + (p.id === a.id ? ' selected' : '') + '>' + esc(p.name + ' — ' + money(p.price) + (n <= 0 ? ' (hết hàng)' : ' (còn ' + n + ')') + (p.visible === false ? ' · đang ẩn' : '')) + '</option>';
    };
    var addRow = '<div class="ed-add"><p class="field__label">Thêm sản phẩm</p><div class="ed-add__row">' +
      '<label class="ed-add__prod"><span class="sr">Sản phẩm</span><select data-ed-add="id"><option value="">— Chọn sản phẩm —</option>' +
        groups.filter(function (g) { return g[1].length; }).map(function (g) { return '<optgroup label="' + esc(g[0]) + '">' + g[1].map(popt).join('') + '</optgroup>'; }).join('') + '</select></label>' +
      (ap && ap.sizes && ap.sizes.length > 1 ? '<label class="ed-sel"><span class="sr">Size</span><select data-ed-add="size">' + optsHtml(ap.sizes.map(function (s) { return [s, s]; }), a.size) + '</select></label>' : '') +
      (ap && ap.colors && ap.colors.length > 1 ? '<label class="ed-sel"><span class="sr">Màu</span><select data-ed-add="color">' + optsHtml(ap.colors.map(function (c) { return [c[0], c[2] || colorName(c[0])]; }), a.color) + '</select></label>' : '') +
      '<label class="ed-add__qty"><span class="sr">Số lượng thêm</span><input type="number" min="1" max="999" step="1" inputmode="numeric" data-ed-add="qty" value="' + esc(a.qty) + '"></label>' +
      '<button class="btn btn--line" type="button" data-ed-addbtn' + (ap ? '' : ' disabled') + '>' + ICON.plus + '<span>Thêm</span></button></div>' +
      (ap ? '<p class="field__hint">' + esc(money(ap.price)) + ' · kho còn ' + esc(Math.max(0, availOf(ap, a.size, a.color) - edNeed(ap, a.size, a.color))) + (ap.stockBy ? ' (size / màu đã chọn)' : '') + (ap.visible === false ? ' · sản phẩm đang ẩn trên Shop' : '') + '</p>' : '') + '</div>';
    box.innerHTML = (lines.length ? '<ul class="ed-lines">' + lines.join('') + '</ul>' : '<p class="mini-state ed-empty">Chưa có sản phẩm nào — chọn ở ô “Thêm sản phẩm” bên dưới.</p>') + addRow;
    edTotals();
    if (focusSel) { var f = $(focusSel, box); if (f && !f.disabled) f.focus(); }
  }
  function edTotals() {
    var form = edForm(); if (!form || !ED) return;
    var sub = edSubtotal(), ship = moneyVal(F(form, 'shipping').value), disc = Math.min(sub, moneyVal(F(form, 'discount').value)), total = sub - disc + ship;
    $('[data-ed-totals]', form).innerHTML = totalsHtml({ subtotal: sub, discount: disc, shipping: ship, total: total });
    var cfg = shopCfg(), how = F(form, 'ship').value;
    var rule = how === 'pickup' ? 0 : (sub >= cfg.free ? 0 : cfg.fee) + (how === 'exp' ? cfg.exp : 0);
    var sh = $('[data-ed-shiphint]', form);
    if (sh) sh.innerHTML = (how === 'pickup' ? 'Nhận tại phòng tập: 0₫' : 'Theo bảng phí: ' + esc(money(rule))) + (rule !== ship ? ' <button type="button" class="linkbtn" data-ed-shiprule="' + rule + '">Dùng số này</button>' : '');
    var pa = F(form, 'paidAmount');
    if (ED.mode === 'create' && pa && !ED.payTouched) pa.value = num(total);
    edStock();
  }
  // tồn kho thay đổi khi lưu: [{ p, it, d }] d > 0 = trừ thêm khỏi kho, d < 0 = trả về kho
  function edDelta() {
    var m = {}, order = [];
    var put = function (it, sign) {
      var p = findById('products', it.id); if (!p) return;
      var k = it.id + '|' + (p.stockBy ? vkey(it.size, it.color) : '');
      if (!m[k]) { m[k] = { p: p, it: it, d: 0 }; order.push(k); }
      m[k].d += sign * (Number(it.qty) || 0);
    };
    ED.items.forEach(function (it) { put(it, 1); });
    if (ED.orig) (ED.orig.items || []).forEach(function (it) { put(it, -1); });
    return order.map(function (k) { return m[k]; }).filter(function (e) { return e.d; });
  }
  function stockLines() {
    if (!ED) return [];
    if (ED.orig && stockOut(ED.orig)) return ['Đơn đã hủy nên tồn kho không đổi.'];
    return edDelta().map(function (e) {
      var nm = '“' + e.p.name + '”' + (e.p.stockBy ? ' (' + [e.it.size, colorLabel(e.p, e.it.color)].filter(Boolean).join(', ') + ')' : '');
      return e.d > 0 ? nm + ': trừ thêm ' + e.d + ' khỏi kho' : nm + ': trả ' + (-e.d) + ' về kho';
    });
  }
  function edStock() {
    var box = $('[data-ed-stock]', el.drawer); if (!box) return;
    var l = stockLines();
    box.innerHTML = l.length ? '<div class="ed-stock"><p class="field__label">' + (ED.mode === 'create' ? 'Tồn kho sẽ trừ khi tạo đơn' : 'Tồn kho sẽ thay đổi khi lưu') + '</p><ul>' +
      l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '';
  }
  // gộp các dòng trùng sản phẩm + size + màu
  function edMerge() {
    var out = [];
    ED.items.forEach(function (it) {
      var same = out.filter(function (x) { return x.id === it.id && x.size === it.size && x.color === it.color; })[0];
      if (same) same.qty = Math.min(999, same.qty + it.qty); else out.push(it);
    });
    ED.items = out;
  }
  function edAdd() {
    var a = ED.add, p = a.id ? findById('products', a.id) : null; if (!p) return;
    var size = a.size || p.sizes[0], color = a.color || p.colors[0][0], qty = Math.max(1, Math.min(999, parseInt(a.qty, 10) || 1));
    var c = p.colors.filter(function (x) { return x[0] === color; })[0] || p.colors[0];
    // sản phẩm đã có trong đơn giữ giá lúc đặt (máy chủ cũng tính như vậy)
    var was = ED.orig ? (ED.orig.items || []).filter(function (x) { return x.id === p.id; })[0] : null;
    ED.items.push({ id: p.id, name: was ? was.name : p.name, img: was ? was.img : p.img, size: size, color: c[0], colorName: c[2] || '', qty: qty, price: was ? Number(was.price) || 0 : Number(p.price) || 0 });
    edMerge();
    ED.add = { id: '', size: '', color: '', qty: 1 };
    S.dirty = true;
    edRender('[data-ed-add="id"]');
  }
  function readOrderEditor(form) {
    var g = function (n) { var f = F(form, n); return f ? String(f.value).trim() : ''; };
    var bad = function (msg, n) { return formError(form, msg, n ? F(form, n) : null); };
    var c = { name: g('name'), phone: g('phone'), email: g('email'), address: g('address'), ward: g('ward'), city: g('city'), note: g('note') };
    if (c.name.length < 2) return bad('Nhập họ tên khách (ít nhất 2 ký tự).', 'name');
    if (!PHONE_RE.test(c.phone.replace(/[\s.\-]/g, ''))) return bad('Số điện thoại chưa đúng (10 số, bắt đầu bằng 0 hoặc +84).', 'phone');
    if (c.email && !EMAIL_RE.test(c.email)) return bad('Email chưa đúng định dạng.', 'email');
    if (!ED.items.length) { var sel = $('[data-ed-add="id"]', form); formError(form, 'Đơn cần ít nhất 1 sản phẩm — chọn sản phẩm ở ô “Thêm sản phẩm”.', sel); return false; }
    var short = ED.items.filter(function (it) { var p = findById('products', it.id); return p && edNeed(p, it.size, it.color) > availOf(p, it.size, it.color); })[0];
    if (short) return bad('Không đủ hàng cho “' + short.name + '” — bớt số lượng hoặc cập nhật tồn kho ở mục Sản phẩm trước.');
    var d = { customer: c, items: ED.items.map(function (it) { return { id: it.id, size: it.size, color: it.color, qty: it.qty }; }),
      shipping: moneyVal(g('shipping')), discount: moneyVal(g('discount')), pay: g('pay'), ship: g('ship') };
    if (d.discount > edSubtotal()) return bad('Giảm giá không được lớn hơn tạm tính (' + money(edSubtotal()) + ').', 'discount');
    if (ED.mode === 'create') {
      d.source = g('source'); d.status = g('status'); d.adminNote = g('adminNote');
      if (F(form, 'paid').checked) {
        d.paid = true; d.paidAmount = moneyVal(g('paidAmount')); d.paidNote = g('paidNote');
        if (!(d.paidAmount > 0)) return bad('Nhập số tiền khách đã trả.', 'paidAmount');
      }
      var se = F(form, 'sendEmail'); d.sendEmail = !!(se && se.checked && !se.disabled);
    } else d.reason = g('reason');
    return d;
  }
  // tóm tắt thay đổi (hộp xác nhận trước khi lưu)
  function editSummary(o, d) {
    var out = [], oc = cust(o), CFD = { name: 'tên', phone: 'SĐT', email: 'email', address: 'địa chỉ', ward: 'phường / xã', city: 'tỉnh / thành', note: 'ghi chú' };
    var cc = Object.keys(CFD).filter(function (k) { return (oc[k] || '') !== d.customer[k]; });
    if (cc.length) out.push('Sửa ' + cc.map(function (k) { return CFD[k]; }).join(', ') + ' của khách');
    var key = function (it) { return it.id + '|' + it.size + '|' + it.color; }, om = {}, nm = {};
    var nameOf = function (it) { var x = [it.size, it.colorName || colorName(it.color)].filter(Boolean).join(', '); return it.name + (x ? ' (' + x + ')' : ''); };
    (o.items || []).forEach(function (it) { om[key(it)] = it; });
    ED.items.forEach(function (it) { nm[key(it)] = it; });
    Object.keys(om).forEach(function (k) { if (!nm[k]) out.push('Bỏ ' + nameOf(om[k]) + ' ×' + om[k].qty); else if (nm[k].qty !== Number(om[k].qty)) out.push(nameOf(om[k]) + ': số lượng ' + om[k].qty + ' → ' + nm[k].qty); });
    Object.keys(nm).forEach(function (k) { if (!om[k]) out.push('Thêm ' + nameOf(nm[k]) + ' ×' + nm[k].qty); });
    if (d.shipping !== (Number(o.shipping) || 0)) out.push('Phí giao ' + money(o.shipping) + ' → ' + money(d.shipping));
    if (d.discount !== (Number(o.discount) || 0)) out.push('Giảm giá ' + money(o.discount) + ' → ' + money(d.discount));
    if (d.pay !== o.pay) out.push('Thanh toán: ' + label(PAY_SHORT, o.pay) + ' → ' + label(PAY_SHORT, d.pay));
    if (d.ship !== (o.ship || 'std')) out.push('Giao hàng: ' + label(SHIP, o.ship) + ' → ' + label(SHIP, d.ship));
    var nt = edSubtotal() - Math.min(edSubtotal(), d.discount) + d.shipping;
    if (nt !== (Number(o.total) || 0)) out.push('Tổng đơn ' + money(o.total) + ' → ' + money(nt));
    return out;
  }
  function saveOrderEdit(form) {
    if (!ED) return;
    var d = readOrderEditor(form); if (!d) return;
    setMsg($('[data-form-msg]', form), '');
    var btn = $('[form="orderEdit"]', el.drawer);
    var fail = function (e) { setBusy(btn, false); if (e.status !== 401 && e.status !== 403) setMsg($('[data-form-msg]', form), e.message); apiFail(e); };
    if (ED.mode === 'create') {
      setBusy(btn, true);
      api('/admin/orders', { method: 'POST', body: d }).then(function (o) {
        replaceItem('orders', o);
        S.dirty = false; S.drawerMode = ''; ED = null;
        history.replaceState(null, '', idHref('orders', o.id)); S.curHash = location.hash;
        S.drawer = { view: 'orders', id: o.id }; S.drawerSwitch = true;
        renderDrawer(); updateView(); renderNav();
        var em = confEmail(o).status;
        toast('Đã tạo đơn ' + o.code + (em === 'sent' ? ' và gửi email xác nhận cho khách' : em === 'failed' || em === 'nosmtp' ? ' — email xác nhận chưa gửi được (' + (CONF_EMAIL[em] || em) + ')' : '') + '. Bấm “Chép link phiếu” để gửi phiếu cho khách.');
        refresh();
      }, fail);
      return;
    }
    var o = ED.orig, lines = editSummary(o, d);
    if (!lines.length) { toast('Không có thay đổi nào để lưu' + (d.reason ? ' (lý do sửa chỉ ghi kèm khi có thay đổi)' : '') + '.'); return; }
    var st = stockLines();
    confirmDialog({
      title: 'Lưu thay đổi đơn ' + (o.code || '') + '?',
      body: lines.map(function (l) { return '• ' + l; }).join('\n') + '\n\nTồn kho: ' + (st.length ? '\n' + st.map(function (l) { return '• ' + l; }).join('\n') : 'không đổi.') +
        (o.paid ? '\n\nĐơn đã ghi “Đã nhận tiền” ' + money(o.paidAmount) + ' — số này giữ nguyên, sửa ở phần Xử lý nếu khách trả thêm / được hoàn.' : ''),
      ok: 'Lưu thay đổi', cancel: 'Xem lại',
    }).then(function (yes) {
      if (!yes) return;
      setBusy(btn, true);
      api('/orders/' + encodeURIComponent(o.id) + '/edit', { method: 'PUT', body: d }).then(function (upd) {
        replaceItem('orders', upd);
        S.dirty = false; S.drawerMode = ''; ED = null; S.drawerSwitch = true;
        renderDrawer(); updateView(); renderNav();
        toast('Đã lưu thay đổi đơn ' + (upd.code || ''));
        refresh();
      }, fail);
    });
  }

  // ── bật / tắt chế độ sửa trong bảng chi tiết ──
  function startEdit() {
    if (!S.drawer) return;
    var go = function () { S.dirty = false; S.drawerMode = 'edit'; ED = null; S.drawerSwitch = true; renderDrawer(); var f = $('.drawer__body input:not([type="hidden"]), .drawer__body select', el.drawer); if (f) f.focus(); };
    if (!S.dirty) { go(); return; }
    confirmDialog({ title: 'Bỏ thay đổi ở phần Xử lý?', body: 'Bạn vừa sửa trạng thái / ghi chú / tiền nhưng chưa bấm Lưu. Chuyển sang sửa thì những thay đổi đó sẽ mất.', ok: 'Bỏ và sửa', cancel: 'Quay lại' })
      .then(function (yes) { if (yes) go(); });
  }
  function cancelEdit() {
    if (S.drawerMode === 'create') { requestCloseDrawer(); return; }
    var go = function () { S.dirty = false; S.drawerMode = ''; ED = null; S.drawerSwitch = true; renderDrawer(); };
    if (!S.dirty) { go(); return; }
    confirmDialog({ title: 'Bỏ các thay đổi đang sửa?', body: 'Những gì bạn vừa sửa sẽ không được lưu.', ok: 'Bỏ thay đổi', cancel: 'Tiếp tục sửa' }).then(function (yes) { if (yes) go(); });
  }

  // ═══ Sửa đăng ký khóa học ═══════════════════════════════════════════════════
  var OPT_LABEL = { '': '—', am: 'Ca sáng', pm: 'Ca tối', A: 'Lớp A', B: 'Lớp B' };
  function courseCfg() { return setData().course || {}; }
  // số tháng của gói: Group Training theo gói, HSSV theo khóa, Membership 1 tháng (giống máy chủ)
  function regMonths(r, pkg) { var c = courseCfg(); return r.program === 'gt' ? parseInt(pkg, 10) || 0 : r.program === 'hssv' ? Number(c.hssvMonths) || 0 : r.program === 'mem' ? 1 : 0; }
  function regPrice(r, pkg) {
    var c = courseCfg();
    if (r.program === 'gt') { var k = (c.gtPackages || []).filter(function (x) { return String(x.months) === String(pkg); })[0]; return k ? Number(k.price) || 0 : 0; }
    return r.program === 'hssv' ? (Number(c.hssvMonth) || 0) * (Number(c.hssvMonths) || 0) : r.program === 'mem' ? Number(c.memMonth) || 0 : r.program === 'found' ? Number(c.foundPrice) || 0 : 0;
  }
  function regEditorHtml(r) {
    var pk = courseCfg().gtPackages || [];
    var inp = function (name, v, extra) { return '<input type="text" name="' + name + '" value="' + esc(v || '') + '" autocomplete="off"' + (extra || '') + '>'; };
    var dateIn = function (name, v) { return '<input type="date" name="' + name + '" value="' + esc(ymdOk(v) ? v : '') + '">'; };
    var head = drawerHead('Sửa đăng ký', r.code || r.id, badge('registrations', r.status) + '<span>' + esc(programName(r)) + '</span>');
    var pkgField = r.program === 'gt' ? fld('Gói', '<select name="pkg"><option value="">—</option>' +
      optsHtml(pk.map(function (k) { return [String(k.months), k.months + ' tháng — ' + money(k.price)]; }).concat(r.pkg && !pk.some(function (k) { return String(k.months) === r.pkg; }) ? [[r.pkg, r.pkg + ' (gói cũ)']] : []), r.pkg || '') + '</select>') : '';
    var optField = fld('Lớp / ca', '<select name="opt">' + optsHtml(mapPairs(OPT_LABEL).concat(r.opt && !has(OPT_LABEL, r.opt) ? [[r.opt, r.opt]] : []), r.opt || '') + '</select>');
    var body = '<div class="drawer__body"><form id="regEdit" class="pform" novalidate>' +
      '<p class="form-msg" data-form-msg role="alert" hidden></p>' +
      sec('Học viên', '<div class="grid2">' + fld('Họ tên *', inp('name', r.name, ' maxlength="80"')) +
        fld('Số điện thoại *', '<input type="tel" name="phone" value="' + esc(r.phone || '') + '" maxlength="20" inputmode="tel" autocomplete="off">') + '</div>' +
        fld('Email', '<input type="email" name="email" value="' + esc(r.email || '') + '" maxlength="120" inputmode="email" autocomplete="off" spellcheck="false">')) +
      sec('Đăng ký · ' + programName(r),
        fld('Chi tiết chương trình', inp('detail', r.detail, ' maxlength="200"'), 'Dòng mô tả hiện trên phiếu xác nhận, VD “12 tháng · Tối”.') +
        '<div class="grid2">' + pkgField + optField + '</div>' +
        (ymdOk(r.date) || !r.date ? fld('Ngày muốn bắt đầu', dateIn('date', r.date)) : fld('Ngày muốn bắt đầu', inp('date', r.date, ' maxlength="20"')))) +
      sec('Học phí', '<div class="grid2">' +
        fld('Tổng học phí', moneyInput('total', Number(r.total) || 0), '<span data-reg-price></span>') +
        fld('Cần trả trước', moneyInput('due', Number(r.due) || 0), 'Số khách cần trả trước (0 = trả sau). Dùng cho “Chờ thanh toán”.') + '</div>' +
        (r.program === 'pt' ? '<p class="field__hint"><strong>PT 1-1</strong> không có giá cố định — nhập giá đã thỏa thuận với học viên.</p>' : '')) +
      sec('Hội viên', '<p class="field__hint">Dùng cho màn “Hội viên” (nhắc gia hạn qua Zalo). Tự điền khi chuyển trạng thái sang “Đã xếp lớp”.</p><div class="grid2">' +
        fld('Ngày bắt đầu tập', dateIn('startDate', r.startDate)) + fld('Ngày hết hạn', dateIn('endDate', r.endDate), '<span data-reg-endhint></span>') + '</div>') +
      sec('Ghi chú', fld('Ghi chú của học viên', '<textarea name="note" rows="2" maxlength="500">' + esc(r.note || '') + '</textarea>') +
        fld('Lý do sửa (ghi vào lịch sử, không bắt buộc)', inp('reason', '', ' maxlength="200" placeholder="VD: thỏa thuận giá PT 10 buổi"'))) +
      '</form></div>';
    var foot = '<footer class="drawer__foot"><button class="btn btn--ghost" type="button" data-action="edit-cancel">Hủy sửa</button><span class="spacer"></span>' +
      '<button class="btn btn--primary" type="submit" form="regEdit">Lưu thay đổi</button></footer>';
    return head + body + foot;
  }
  function regHints() {
    var form = $('#regEdit', el.drawer), r = S.drawer && findById('registrations', S.drawer.id); if (!form || !r) return;
    var pkg = F(form, 'pkg') ? F(form, 'pkg').value : r.pkg, price = regPrice(r, pkg), total = moneyVal(F(form, 'total').value);
    var ph = $('[data-reg-price]', form);
    if (ph) ph.innerHTML = price ? 'Giá ' + (r.program === 'gt' ? 'gói ' + esc(pkg) + ' tháng' : 'niêm yết') + ': ' + esc(money(price)) + (price !== total ? ' <button type="button" class="linkbtn" data-reg-use="total" data-v="' + price + '">Dùng giá này</button>' : '') : '';
    var months = regMonths(r, pkg), sd = F(form, 'startDate').value, eh = $('[data-reg-endhint]', form);
    if (!eh) return;
    if (months && ymdOk(sd)) {
      var end = addMonthsYmd(sd, months);
      eh.innerHTML = 'Theo gói ' + months + ' tháng: ' + esc(fmtWhen(end)) + (end !== F(form, 'endDate').value ? ' <button type="button" class="linkbtn" data-reg-use="endDate" data-v="' + end + '">Dùng ngày này</button>' : '');
    } else eh.textContent = months ? 'Nhập ngày bắt đầu để tính theo gói ' + months + ' tháng.' : 'Chương trình này không có thời hạn cố định — tự nhập nếu cần.';
  }
  function saveRegEdit(form) {
    var r = S.drawer && findById('registrations', S.drawer.id); if (!r) return;
    var g = function (n) { var f = F(form, n); return f ? String(f.value).trim() : undefined; };
    var bad = function (msg, n) { return formError(form, msg, n ? F(form, n) : null); };
    var v = { name: g('name'), phone: g('phone'), email: g('email'), detail: g('detail'), opt: g('opt'), date: g('date'), note: g('note'),
      total: moneyVal(g('total')), due: moneyVal(g('due')), startDate: g('startDate'), endDate: g('endDate') };
    if (F(form, 'pkg')) v.pkg = g('pkg');
    if (v.name.length < 2) return bad('Nhập họ tên học viên (ít nhất 2 ký tự).', 'name');
    if (!PHONE_RE.test(v.phone.replace(/[\s.\-]/g, ''))) return bad('Số điện thoại chưa đúng (10 số, bắt đầu bằng 0 hoặc +84).', 'phone');
    if (v.email && !EMAIL_RE.test(v.email)) return bad('Email chưa đúng định dạng.', 'email');
    if (v.due > v.total) return bad('Số tiền cần trả trước không được lớn hơn tổng học phí.', 'due');
    if (v.startDate && v.endDate && v.endDate < v.startDate) return bad('Ngày hết hạn phải sau ngày bắt đầu tập.', 'endDate');
    var body = {};
    Object.keys(v).forEach(function (k) {
      if (k === 'total' || k === 'due') { if (v[k] !== (Number(r[k]) || 0)) body[k] = v[k]; }
      else if (v[k] !== undefined && v[k] !== String(r[k] == null ? '' : r[k])) body[k] = v[k];
    });
    if (!Object.keys(body).length) { toast('Không có thay đổi nào để lưu'); return; }
    if (g('reason')) body.reason = g('reason');
    var btn = $('[form="regEdit"]', el.drawer);
    setMsg($('[data-form-msg]', form), ''); setBusy(btn, true);
    api('/registrations/' + encodeURIComponent(r.id) + '/edit', { method: 'PUT', body: body }).then(function (upd) {
      replaceItem('registrations', upd);
      S.dirty = false; S.drawerMode = ''; S.drawerSwitch = true;
      renderDrawer(); updateView(); renderNav();
      toast('Đã lưu thay đổi ' + (upd.code || ''));
      refresh();
    }, function (e) { setBusy(btn, false); if (e.status !== 401 && e.status !== 403) setMsg($('[data-form-msg]', form), e.message); apiFail(e); });
  }

  // ═══ Tồn kho theo size × màu (form sản phẩm) ═════════════════════════════════
  // VS = { on, vals: { "<size>::<màu>": số }, was: tồn kho từng ô lúc mở form (máy chủ giữ số mới nhất của ô không sửa) }
  var VS = null;
  function vsAxes(form) {
    var sizes = [];
    String((F(form, 'sizes') || {}).value || '').split(',').forEach(function (s) { s = s.trim().slice(0, 20); if (s && sizes.indexOf(s) < 0) sizes.push(s); });
    if (!sizes.length) sizes = ['One size'];
    var colors = [];
    $$('[data-crow]', form).forEach(function (row) {
      var key = $('[data-ckey]', row).value, nvIn = $('[data-cname="vi"]', row), nv = nvIn ? nvIn.value.trim() : '';
      if (key === '__new') { if (!nv) return; key = slugify(nv, 20) || 'mau'; }
      if (colors.some(function (c) { return c.key === key; })) return;
      colors.push({ key: key, name: nv || colorName(key) });
    });
    return { sizes: sizes, colors: colors };
  }
  function vsKeys(ax) { var k = []; ax.sizes.forEach(function (s) { ax.colors.forEach(function (c) { k.push(vkey(s, c.key)); }); }); return k; }
  function vsInit(form) {
    var id = S.drawer && S.drawer.id, p = id && id !== 'new' ? findById('products', id) : null, by = p && p.stockBy && typeof p.stockBy === 'object' ? p.stockBy : null;
    VS = { on: !!by, vals: by ? JSON.parse(JSON.stringify(by)) : {}, was: by ? JSON.parse(JSON.stringify(by)) : null, had: !!by };
    vsRender(form);
  }
  function vsRender(form) {
    var box = $('[data-vs]', form); if (!box || !VS) return;
    var grid = $('[data-vs-grid]', box), stock = F(form, 'stock'), hint = $('[data-stock-hint]', form);
    $('[data-vs-on]', box).checked = VS.on;
    grid.hidden = !VS.on;
    stock.readOnly = VS.on;
    stock.classList.toggle('is-auto', VS.on);
    if (hint) hint.textContent = VS.on ? 'Tự cộng từ bảng size / màu (mục Biến thể).' : 'Cảnh báo khi còn ≤ ' + LOW_STOCK + '.';
    if (!VS.on) { setMsg($('[data-vs-warn]', box), ''); return; }
    var ax = vsAxes(form), sum = 0;
    if (!ax.colors.length) { grid.innerHTML = '<p class="field__hint">Thêm ít nhất một màu để chia tồn kho.</p>'; return; }
    grid.innerHTML = '<div class="vgrid-wrap"><table class="vgrid"><thead><tr><th scope="col">Size</th>' +
      ax.colors.map(function (c) { return '<th scope="col">' + esc(c.name) + '</th>'; }).join('') + '<th scope="col" class="vgrid__sum">Cộng</th></tr></thead><tbody>' +
      ax.sizes.map(function (s) {
        var rs = 0;
        return '<tr><th scope="row">' + esc(s) + '</th>' + ax.colors.map(function (c) {
          var k = vkey(s, c.key), v = Math.max(0, parseInt(VS.vals[k], 10) || 0); rs += v; sum += v;
          return '<td><input type="number" min="0" max="1000000" step="1" inputmode="numeric" data-vs-key="' + esc(k) + '" value="' + v + '"' + (v <= 0 ? ' class="is-zero"' : '') + ' aria-label="' + esc('Tồn kho size ' + s + ', màu ' + c.name) + '"></td>';
        }).join('') + '<td class="vgrid__sum" data-vs-row>' + rs + '</td></tr>';
      }).join('') + '</tbody></table></div><p class="field__hint">Ô đỏ = size / màu đó đang hết hàng (khách không đặt được). Tổng: <strong data-vs-total>' + sum + '</strong> cái.</p>';
    stock.value = sum;
  }
  function vsSum(form) {
    var total = 0;
    $$('.vgrid tbody tr', form).forEach(function (tr) {
      var rs = 0;
      $$('[data-vs-key]', tr).forEach(function (i) { var v = Math.max(0, parseInt(i.value, 10) || 0); rs += v; i.classList.toggle('is-zero', v <= 0); });
      var c = $('[data-vs-row]', tr); if (c) c.textContent = rs;
      total += rs;
    });
    var t = $('[data-vs-total]', form); if (t) t.textContent = total;
    F(form, 'stock').value = total;
  }
  function vsToggle(form, on) {
    var warn = '';
    if (on) {
      var keys = vsKeys(vsAxes(form));
      if (!keys.some(function (k) { return VS.vals[k] != null; })) {
        var total = Math.max(0, parseInt(F(form, 'stock').value, 10) || 0), base = Math.floor(total / Math.max(1, keys.length)), rem = total - base * keys.length;
        keys.forEach(function (k, i) { VS.vals[k] = base + (i < rem ? 1 : 0); });
        warn = total && keys.length > 1 ? 'Đã chia tạm ' + total + ' cái cho ' + keys.length + ' loại size / màu — hãy sửa lại cho đúng số thật trong kho rồi bấm Lưu.' : !total ? 'Nhập số lượng còn trong kho cho từng size / màu.' : '';
      }
    }
    VS.on = on;
    vsRender(form);
    setMsg($('[data-vs-warn]', form), warn);
  }
  function vsCollect(form) {
    if (!VS || !VS.on) return VS && VS.had ? null : undefined;
    var out = {};
    vsKeys(vsAxes(form)).forEach(function (k) { out[k] = Math.max(0, parseInt(VS.vals[k], 10) || 0); });
    return out;
  }

  // ═══ Form sản phẩm ══════════════════════════════════════════════════════════
  function blankProduct() {
    return { name: '', cat: (catList().filter(function (c) { return !c.hidden; })[0] || catList()[0]).id, price: '', old: '', stock: 0, visible: true, sizes: [], colors: [['black', COLORS.black[1]]],
      desc: { vi: '', en: '' }, full: { vi: '', en: '' }, rating: 0, reviews: 0, img: '', images: [], badge: '',
      nameEn: '', features: [], video: '', seoTitle: '', seoDesc: '', slug: '' };
  }
  // giống server (routes/api.js slugify): bỏ dấu, chữ thường, nối bằng "-"
  function slugify(v, max) {
    return String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max || 80);
  }
  function featRowHtml(f) {
    f = f || {};
    return '<div class="feat" data-feat>' +
      '<label><span class="sr">Điểm nổi bật · Tiếng Việt</span><input type="text" data-feat-vi maxlength="160" value="' + esc(f.vi || '') + '" placeholder="VD: Da PU 2 lớp, bền gấp đôi" autocomplete="off"></label>' +
      '<label><span class="sr">Điểm nổi bật · English</span><input type="text" data-feat-en maxlength="160" value="' + esc(f.en || '') + '" placeholder="English — AI tự dịch khi lưu" autocomplete="off"></label>' +
      '<button class="icon-btn icon-btn--line" type="button" data-feat-del aria-label="Bỏ điểm này" title="Bỏ điểm này">' + ICON.close + '</button></div>';
  }
  var MAX_FEATS = 8, MAX_VIDEO = 80 * 1024 * 1024;
  function vidPreviewHtml(url) {
    var src = safeImg(url);
    return src ? '<video src="' + esc(src) + '" muted playsinline controls preload="metadata"></video>' : '<span class="pimg__empty">Chưa có video riêng — trang chi tiết dùng 2 video chung</span>';
  }
  function colorRowHtml(key, hex, nv, ne) {
    var keys = Object.keys(COLORS), own = key && key !== '__new' && !has(COLORS, key);
    var h = safeHex(hex, has(COLORS, key) ? COLORS[key][1] : '#141414');
    var opt = function (k, label) { return '<option value="' + esc(k) + '"' + (k === key ? ' selected' : '') + '>' + esc(label) + '</option>'; };
    return '<div class="crow" data-crow>' +
      '<label class="crow__key"><span class="sr">Màu</span><select data-ckey data-prev="' + esc(key || '') + '">' +
      keys.map(function (k) { return opt(k, COLORS[k][0]); }).join('') + (own ? opt(key, (nv || key) + ' (màu riêng)') : '') +
      '<option value="__new"' + (key === '__new' ? ' selected' : '') + '>+ Màu khác (tự đặt tên)…</option>' +
      '</select></label>' +
      '<label class="crow__pick"><span class="sr">Chọn màu</span><input type="color" value="' + h + '" data-chex></label>' +
      '<label class="crow__hex"><span class="sr">Mã màu HEX</span><input type="text" value="' + (/^#[0-9a-f]{6}$/i.test(String(hex || '').trim()) ? String(hex).trim() : h) + '" maxlength="7" spellcheck="false" autocomplete="off" data-chex-text></label>' +
      '<button class="icon-btn icon-btn--line" type="button" data-crow-del aria-label="Bỏ màu này" title="Bỏ màu này">' + ICON.close + '</button>' +
      '<div class="crow__names">' +
        '<label><span class="sr">Tên màu · Tiếng Việt</span><input type="text" data-cname="vi" maxlength="30" value="' + esc(nv || '') + '" placeholder="' + esc(has(COLORS, key) ? COLORS[key][0] + ' (tên có sẵn)' : 'Tên màu, vd Xanh lá') + '" autocomplete="off"></label>' +
        '<label><span class="sr">Tên màu · English</span><input type="text" data-cname="en" maxlength="30" value="' + esc(ne || '') + '" placeholder="English, vd Green" autocomplete="off"></label>' +
      '</div></div>';
  }
  function imgPreviewHtml(url) {
    var src = safeImg(url);
    return src ? '<img src="' + esc(src) + '" alt="Ảnh sản phẩm">' : '<span class="pimg__empty">' + ICON.image + '<span>Chưa có ảnh</span></span>';
  }
  var IMG_SPEC = 'Gợi ý: 1600 × 2000 px (tỉ lệ 4:5), JPG/WebP ≤ 400 KB';
  var MAX_GALLERY = 12;
  var BADGES = [['', 'Tự động — hiện “-x%” khi có giá gốc'], ['new', 'Mới'], ['best', 'Bán chạy'], ['none', 'Không nhãn']];
  function galItemHtml(url) {
    var src = safeImg(url);
    if (!src) return '';
    return '<div class="gal__item" data-gal-url="' + esc(src) + '">' +
      '<span class="gal__img"><img src="' + esc(src) + '" alt="" loading="lazy"></span>' +
      '<span class="gal__ctl">' +
        '<button class="icon-btn" type="button" data-gal-move="-1" aria-label="Đưa ảnh lên trước" title="Lên trước"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
        '<button class="icon-btn" type="button" data-gal-move="1" aria-label="Đưa ảnh ra sau" title="Ra sau"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' +
        '<button class="icon-btn" type="button" data-gal-del aria-label="Bỏ ảnh này" title="Bỏ ảnh">' + ICON.close + '</button>' +
      '</span></div>';
  }
  function galleryState(form) {
    var box = $('[data-gal]', form); if (!box) return;
    var items = $$('[data-gal-url]', box);
    var n = items.length;
    items.forEach(function (it, i) {
      var b = $$('[data-gal-move]', it);
      b[0].disabled = i === 0; b[1].disabled = i === n - 1;
    });
    var cnt = $('[data-gal-count]', form); if (cnt) cnt.textContent = n + ' / ' + MAX_GALLERY + ' ảnh';
    var add = $('[data-gal-add]', form);
    if (add) { add.disabled = n >= MAX_GALLERY; add.closest('.file-btn').classList.toggle('is-disabled', n >= MAX_GALLERY); }
    var empty = $('[data-gal-empty]', form); if (empty) empty.hidden = n > 0;
  }
  // tải nhiều ảnh phụ (nhị phân → /api/uploads/file), lần lượt từng ảnh
  function uploadGallery(input) {
    var form = input.form || $('#productForm');
    var files = Array.prototype.slice.call(input.files || []);
    input.value = '';
    if (!form || !files.length) return;
    var room = MAX_GALLERY - $$('[data-gal-url]', form).length;
    if (room <= 0) { formError(form, 'Tối đa ' + MAX_GALLERY + ' ảnh phụ.'); return; }
    var bad = files.filter(function (x) { return !/^image\/(png|jpeg|webp|gif)$/.test(x.type) || x.size > 10 * 1024 * 1024; });
    var skipped = Math.max(0, files.length - bad.length - room);
    files = files.filter(function (x) { return bad.indexOf(x) < 0; }).slice(0, room);
    var msgs = [];
    if (bad.length) msgs.push(bad.length + ' file bị bỏ qua (chỉ nhận PNG/JPG/WEBP/GIF ≤ 10MB).');
    if (skipped) msgs.push(skipped + ' ảnh vượt quá giới hạn ' + MAX_GALLERY + ' ảnh.');
    if (!files.length) { formError(form, msgs.join(' ')); return; }
    var lbl = $('[data-gal-label]', form), btn = input.closest('.file-btn');
    btn.classList.add('is-busy'); input.disabled = true;
    var done = 0;
    var next = function (i) {
      if (i >= files.length) {
        btn.classList.remove('is-busy'); input.disabled = false; lbl.textContent = '+ Tải thêm ảnh';
        galleryState(form); if (done) S.dirty = true;
        if (msgs.length) formError(form, msgs.join(' ')); else setMsg($('[data-form-msg]', form), '');
        if (done) toast('Đã thêm ' + done + ' ảnh phụ — bấm Lưu để áp dụng');
        return;
      }
      lbl.textContent = 'Đang tải ' + (i + 1) + '/' + files.length + '…';
      uploadRaw(files[i]).then(function (r) {
        var url = r && safeImg(r.url);
        var box = $('[data-gal]', form);
        if (url && box) { box.insertAdjacentHTML('beforeend', galItemHtml(url)); done++; }
      }, function (e) {
        if (e && e.status === 401) return;
        msgs.push(files[i].name + ': ' + ((e && e.message) || 'lỗi tải lên'));
      }).then(function () { if (S.token) next(i + 1); });
    };
    next(0);
  }
  function uploadVideo(input) {
    var form = input.form || $('#productForm'), file = input.files && input.files[0];
    input.value = '';
    if (!form || !file) return;
    if (!/^video\/(mp4|webm)$/.test(file.type)) { formError(form, 'Chỉ nhận video MP4 hoặc WEBM.'); return; }
    if (file.size > MAX_VIDEO) { formError(form, 'Video lớn hơn 80MB — vui lòng cắt ngắn hoặc nén lại.'); return; }
    var lbl = $('[data-vid-label]', form), btn = input.closest('.file-btn');
    btn.classList.add('is-busy'); input.disabled = true; lbl.textContent = 'Đang tải video…';
    uploadRaw(file).then(function (r) {
      var url = r && safeImg(r.url);
      if (!url) throw new ApiError('Tải lên thất bại.', 0);
      F(form, 'video').value = url;
      $('[data-vid-preview]', form).innerHTML = vidPreviewHtml(url);
      $('[data-vid-del]', form).hidden = false;
      S.dirty = true; setMsg($('[data-form-msg]', form), '');
      toast('Đã tải video — bấm Lưu để áp dụng');
    }, function (e) { if (e && e.status !== 401) formError(form, (e && e.message) || 'Tải video thất bại.'); })
      .then(function () { btn.classList.remove('is-busy'); input.disabled = false; lbl.textContent = F(form, 'video').value ? 'Đổi video' : 'Tải video lên'; });
  }
  function uploadRaw(file) {
    return fetch('/api/uploads/file', { method: 'POST', headers: { Authorization: 'Bearer ' + S.token, 'Content-Type': file.type }, body: file })
      .then(function (res) {
        return res.json().catch(function () { return null; }).then(function (d) {
          if (res.status === 401) { sessionExpired(); throw new ApiError('Phiên đăng nhập đã hết hạn.', 401); }
          if (!res.ok || !d || !d.url) throw new ApiError((d && d.error) || ('Tải lên thất bại (mã ' + res.status + ').'), res.status);
          return d;
        });
      }, function () { throw new ApiError('Không kết nối được máy chủ.', 0); });
  }
  function moneyHint(v) { var n = Number(v); return v !== '' && v != null && isFinite(n) && n > 0 ? '= ' + money(n) : ''; }

  function productFormHtml(p) {
    var isNew = !p;
    p = p || blankProduct();
    var desc = p.desc || {}, full = p.full || {};
    var colors = Array.isArray(p.colors) && p.colors.length ? p.colors : [['black', COLORS.black[1]]];
    var feats = Array.isArray(p.features) ? p.features : [];
    var curSlug = p.slug || slugify(p.name) || p.id || '';
    var catOpts = catList().map(function (c) { return '<option value="' + esc(c.id) + '"' + (p.cat === c.id ? ' selected' : '') + '>' + esc(c.name.vi) + (c.hidden ? ' (đang ẩn khỏi thanh lọc)' : '') + '</option>'; }).join('') +
      (p.cat && !catById(p.cat) ? '<option value="' + esc(p.cat) + '" selected>' + esc(p.cat) + ' (danh mục không còn)</option>' : '');
    var field = function (lbl, inner, hint, cls) {
      return '<label class="field' + (cls ? ' ' + cls : '') + '"><span class="field__label">' + lbl + '</span>' + inner + (hint ? '<small class="field__hint">' + hint + '</small>' : '') + '</label>';
    };
    var head = drawerHead(isNew ? 'Sản phẩm mới' : 'Sửa sản phẩm', isNew ? 'Thêm sản phẩm' : (p.name || 'Sản phẩm'),
      isNew ? '' : '<span>Mã ' + esc(p.id) + '</span>' + (p.visible === false ? '<span class="tag tag--muted">Đang ẩn</span>' : '') +
        (p.updatedAt ? '<span>Sửa lần cuối ' + esc(fmtDate(p.updatedAt)) + (p.updatedBy ? ' · ' + esc(p.updatedBy) : '') + '</span>' : ''));
    var body = '<div class="drawer__body"><form id="productForm" class="pform" novalidate>' +
      '<p class="form-msg" data-form-msg role="alert" hidden></p>' +
      sec('Ảnh sản phẩm',
        '<div class="pimg"><div class="pimg__preview" data-img-preview>' + imgPreviewHtml(p.img) + '</div>' +
        '<div class="pimg__ctl">' +
        '<label class="btn btn--line file-btn">' + ICON.upload + '<span data-upload-label>Tải ảnh lên</span>' +
        '<input class="sr" type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload></label>' +
        '<small class="field__hint">PNG, JPG, WEBP hoặc GIF · tối đa 8MB</small>' +
        field('Hoặc dán đường dẫn ảnh', '<input type="text" name="img" value="' + esc(p.img || '') + '" placeholder="/assets/media/… hoặc https://…" inputmode="url" spellcheck="false" autocomplete="off">',
          'Chỉ nhận đường dẫn bắt đầu bằng “/” hoặc “https://”.') +
        '<small class="field__hint field__hint--spec">' + IMG_SPEC + '</small>' +
        '</div></div>') +
      sec('Ảnh phụ (trang chi tiết sản phẩm)',
        '<p class="field__hint">Hiện sau ảnh chính trong trang chi tiết, đúng thứ tự dưới đây (tối đa ' + MAX_GALLERY + ' ảnh). ' + IMG_SPEC + '.</p>' +
        '<div class="gal" data-gal>' + (Array.isArray(p.images) ? p.images : []).map(galItemHtml).join('') + '</div>' +
        '<p class="gal__empty" data-gal-empty' + (Array.isArray(p.images) && p.images.length ? ' hidden' : '') + '>Chưa có ảnh phụ.</p>' +
        '<div class="gal__bar"><label class="btn btn--line file-btn">' + ICON.upload + '<span data-gal-label>+ Tải thêm ảnh</span>' +
        '<input class="sr" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple data-gal-add></label>' +
        '<span class="field__hint" data-gal-count>' + (Array.isArray(p.images) ? p.images.length : 0) + ' / ' + MAX_GALLERY + ' ảnh</span></div>' +
        '<div class="pvid"><span class="field__label">Video sản phẩm (không bắt buộc)</span>' +
        '<div class="pvid__preview" data-vid-preview>' + vidPreviewHtml(p.video) + '</div>' +
        '<div class="gal__bar"><label class="btn btn--line file-btn">' + ICON.upload + '<span data-vid-label>' + (p.video ? 'Đổi video' : 'Tải video lên') + '</span>' +
        '<input class="sr" type="file" accept="video/mp4,video/webm" data-vid-add></label>' +
        '<button class="btn btn--quiet btn--sm" type="button" data-vid-del' + (p.video ? '' : ' hidden') + '>Bỏ video</button></div>' +
        '<input type="hidden" name="video" value="' + esc(p.video || '') + '">' +
        '<small class="field__hint">MP4 hoặc WEBM, tối đa 80MB (nên ngắn dưới 15 giây, dưới 8MB để trang tải nhanh). Có video riêng thì trang chi tiết hiện video này thay cho 2 video chung.</small></div>') +
      sec('Thông tin bán hàng',
        field('Tên sản phẩm', '<input type="text" name="name" value="' + esc(p.name || '') + '" maxlength="120" required autocomplete="off">') +
        field('Tên sản phẩm · English (AI tự dịch)', '<input type="text" name="nameEn" value="' + esc(p.nameEn || '') + '" maxlength="120" autocomplete="off" placeholder="AI tự dịch khi lưu — không cần nhập">') +
        '<div class="grid2">' +
        field('Danh mục', '<select name="cat">' + catOpts + '</select>', isAdmin() ? 'Thêm / sửa danh mục ở <a href="#/categories">Danh mục sản phẩm</a>.' : '') +
        field('Tồn kho', '<input type="number" name="stock" value="' + esc(p.stock != null ? p.stock : 0) + '"' + (p.id ? ' data-was="' + esc(p.stock != null ? p.stock : 0) + '"' : '') + ' min="0" step="1" inputmode="numeric" required>', '<span data-stock-hint>Cảnh báo khi còn ≤ ' + LOW_STOCK + '.</span>') +
        field('Giá bán (₫)', '<input type="number" name="price" value="' + esc(p.price != null ? p.price : '') + '" min="0" step="1" inputmode="numeric" required>',
          '<span data-money-for="price">' + esc(moneyHint(p.price)) + '</span>') +
        field('Giá gốc (₫)', '<input type="number" name="old" value="' + esc(p.old || '') + '" min="0" step="1" inputmode="numeric" placeholder="Để trống nếu không giảm giá">',
          '<span data-money-for="old">' + esc(moneyHint(p.old)) + '</span>') +
        '</div>' +
        field('Nhãn trên ảnh', '<select name="badge">' + BADGES.map(function (b) { return '<option value="' + b[0] + '"' + ((p.badge || '') === b[0] ? ' selected' : '') + '>' + esc(b[1]) + '</option>'; }).join('') + '</select>',
          'Nhãn ở góc ảnh sản phẩm trên Shop và Trang chủ.') +
        '<label class="check"><input type="checkbox" name="visible"' + (p.visible !== false ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span>' +
        '<span>Hiển thị trên Shop</span></label>') +
      sec('Biến thể',
        field('Kích cỡ', '<input type="text" name="sizes" value="' + esc(Array.isArray(p.sizes) ? p.sizes.join(', ') : '') + '" placeholder="VD: 10oz, 12oz, 14oz" autocomplete="off" spellcheck="false">',
          'Phân cách bằng dấu phẩy. Để trống = “One size”.') +
        '<div class="field"><span class="field__label" id="colorsLabel">Màu sắc</span>' +
        '<div class="crows" data-crows role="group" aria-labelledby="colorsLabel">' + colors.map(function (c) { return Array.isArray(c) ? colorRowHtml(c[0], c[1], c[2], c[3]) : colorRowHtml('', ''); }).join('') + '</div>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-crow-add>' + ICON.plus + '<span>Thêm màu</span></button>' +
        '<small class="field__hint">Chọn màu có sẵn hoặc “Màu khác” rồi đặt tên. Ô tên để trống = dùng tên có sẵn.</small></div>' +
        '<div class="vstock" data-vs><label class="check set-switch"><input type="checkbox" data-vs-on><span class="switch__ui" aria-hidden="true"></span><span><strong>Tồn kho theo size / màu</strong></span></label>' +
        '<p class="field__hint">Bật khi mỗi size / màu có số lượng riêng: khách không đặt được size / màu đã hết, ô “Tồn kho” phía trên tự cộng.</p>' +
        '<p class="set-err" data-vs-warn role="status" hidden></p><div data-vs-grid hidden></div></div>') +
      sec('Điểm nổi bật (trang chi tiết)',
        '<p class="field__hint">Mỗi dòng một ý, tối đa ' + MAX_FEATS + '. Để trống = dùng 4 điểm chung ở <a href="#/cms-text">Chữ trên trang</a>.</p>' +
        '<div class="feats" data-feats>' + feats.map(featRowHtml).join('') + '</div>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-feat-add' + (feats.length >= MAX_FEATS ? ' disabled' : '') + '>' + ICON.plus + '<span>Thêm điểm nổi bật</span></button>') +
      sec('Mô tả',
        field('Mô tả ngắn · Tiếng Việt', '<textarea name="desc_vi" rows="3" maxlength="2000">' + esc(desc.vi || '') + '</textarea>') +
        field('Mô tả ngắn · English (AI tự dịch)', '<textarea name="desc_en" rows="3" maxlength="2000">' + esc(desc.en || '') + '</textarea>') +
        field('Mô tả chi tiết · Tiếng Việt', '<textarea name="full_vi" rows="6" maxlength="2000">' + esc(full.vi || '') + '</textarea>') +
        field('Mô tả chi tiết · English (AI tự dịch)', '<textarea name="full_en" rows="6" maxlength="2000">' + esc(full.en || '') + '</textarea>')) +
      sec('Đánh giá hiển thị',
        '<p class="field__hint">Sao và số đánh giá chỉ hiện dưới tên sản phẩm khi số lượt đánh giá lớn hơn 0. Chỉ nhập số liệu thật (vd từ Shopee, Facebook).</p>' +
        '<div class="grid2">' +
        field('Điểm (0–5)', '<input type="number" name="rating" value="' + esc(p.rating != null ? p.rating : 0) + '" min="0" max="5" step="0.1" inputmode="decimal">') +
        field('Số lượt đánh giá', '<input type="number" name="reviews" value="' + esc(p.reviews != null ? p.reviews : 0) + '" min="0" step="1" inputmode="numeric">') +
        '</div>') +
      sec('SEO & đường dẫn',
        field('Tiêu đề trên Google', '<input type="text" name="seoTitle" maxlength="70" value="' + esc(p.seoTitle || '') + '" placeholder="' + esc((p.name || 'Tên sản phẩm') + ' — Dapper Combat') + '" autocomplete="off">',
          'Để trống = tên sản phẩm + “— Dapper Combat”. Nên dưới 60 ký tự.') +
        field('Mô tả trên Google', '<textarea name="seoDesc" rows="2" maxlength="200" placeholder="Để trống = lấy từ mô tả ngắn">' + esc(p.seoDesc || '') + '</textarea>', 'Nên 120–160 ký tự.') +
        field('Đường dẫn', '<span class="pslug"><em>/shop/</em><input type="text" name="slug" maxlength="80" value="' + esc(p.slug || '') + '" placeholder="' + esc(slugify(p.name) || 'ten-san-pham') + '" spellcheck="false" autocomplete="off"></span>',
          'Chữ thường không dấu, số và dấu “-”. Để trống = tự tạo từ tên. Đổi tên / đường dẫn thì link cũ vẫn tự chuyển sang link mới.' +
          (p.id && curSlug ? ' Đang dùng: <a href="/shop/' + esc(curSlug) + '" target="_blank" rel="noopener">/shop/' + esc(curSlug) + ' ↗</a>' : ''))) +
      '</form></div>';
    var foot = '<footer class="drawer__foot">' +
      (isNew || !isAdmin() ? '' : '<button class="btn btn--quiet" type="button" data-action="delete-item">' + ICON.trash + '<span>Xóa</span></button>') +
      '<span class="spacer"></span>' +
      '<button class="btn btn--ghost" type="button" data-close>Hủy</button>' +
      '<button class="btn btn--primary" type="submit" form="productForm">' + (isNew ? 'Tạo sản phẩm' : 'Lưu') + '</button></footer>';
    return head + body + foot;
  }

  function formError(form, msg, fieldEl) {
    var box = $('[data-form-msg]', form);
    $$('.is-invalid', form).forEach(function (n) { n.classList.remove('is-invalid'); n.removeAttribute('aria-invalid'); });
    setMsg(box, msg);
    if (fieldEl) {
      fieldEl.classList.add('is-invalid'); fieldEl.setAttribute('aria-invalid', 'true');
      fieldEl.focus();
      if (fieldEl.scrollIntoView) fieldEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else if (box && box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
    return false;
  }

  function readProductForm(form) {
    var get = function (n) { var f = F(form, n); return f ? String(f.value).trim() : ''; };
    var name = get('name');
    if (!name) return formError(form, 'Vui lòng nhập tên sản phẩm.', F(form, 'name'));
    var price = get('price') === '' ? NaN : Number(get('price'));
    if (!Number.isInteger(price) || price < 0) return formError(form, 'Giá bán phải là số nguyên ≥ 0 (đơn vị đồng).', F(form, 'price'));
    var old = get('old') === '' ? 0 : Number(get('old'));
    if (!Number.isInteger(old) || old < 0) return formError(form, 'Giá gốc phải là số nguyên (hoặc để trống).', F(form, 'old'));
    if (old && old <= price) return formError(form, 'Giá gốc phải lớn hơn giá bán — hoặc để trống nếu không giảm giá.', F(form, 'old'));
    var stock = get('stock') === '' ? NaN : Number(get('stock'));
    if (!Number.isInteger(stock) || stock < 0) return formError(form, 'Tồn kho phải là số nguyên ≥ 0.', F(form, 'stock'));
    var rating = get('rating') === '' ? 0 : Number(get('rating'));
    if (!isFinite(rating) || rating < 0 || rating > 5) return formError(form, 'Điểm đánh giá phải từ 0 đến 5.', F(form, 'rating'));
    var reviews = get('reviews') === '' ? 0 : Number(get('reviews'));
    if (!Number.isInteger(reviews) || reviews < 0) return formError(form, 'Số lượt đánh giá phải là số nguyên ≥ 0.', F(form, 'reviews'));
    var img = get('img');
    if (img && !safeImg(img)) return formError(form, 'Đường dẫn ảnh phải bắt đầu bằng “/” hoặc “https://” và không chứa khoảng trắng.', F(form, 'img'));
    var sizes = [];
    get('sizes').split(',').forEach(function (s) { s = s.trim(); if (s && sizes.indexOf(s) === -1) sizes.push(s.slice(0, 20)); });
    var colors = [], keysSeen = {}, bad = null;
    $$('[data-crow]', form).forEach(function (row) {
      if (bad) return;
      var key = $('[data-ckey]', row).value, txt = $('[data-chex-text]', row);
      var nvIn = $('[data-cname="vi"]', row), nv = nvIn ? nvIn.value.trim() : '', ne = $('[data-cname="en"]', row) ? $('[data-cname="en"]', row).value.trim() : '';
      var raw = String(txt.value || '').trim();
      var hex = /^#[0-9a-f]{6}$/i.test(raw) ? raw : safeHex(raw, ''); // giữ nguyên chữ hoa/thường của mã đã có
      if (!hex) { bad = [txt, 'Mã màu phải có dạng #RRGGBB (VD: #d4372e).']; return; }
      if (key === '__new') {
        if (!nv) { bad = [nvIn, 'Đặt tên cho màu mới (vd Xanh lá).']; return; }
        key = slugify(nv, 20) || 'mau';
      }
      if (keysSeen[key]) { bad = [$('[data-ckey]', row), 'Mỗi màu chỉ nên chọn một lần.']; return; }
      keysSeen[key] = 1;
      colors.push(nv || ne ? [key, hex, nv, ne] : [key, hex]);
    });
    if (bad) return formError(form, bad[1], bad[0]);
    if (!colors.length) return formError(form, 'Cần ít nhất một màu.', $('[data-crow-add]', form));
    // tồn kho theo size / màu: mỗi ô là số nguyên ≥ 0; ô tồn kho tổng = tổng các ô
    var badCell = $$('[data-vs-key]', form).filter(function (i) { var v = Number(i.value); return VS && VS.on && (i.value === '' || !Number.isInteger(v) || v < 0); })[0];
    if (badCell) return formError(form, 'Tồn kho từng size / màu phải là số nguyên ≥ 0.', badCell);
    var stockBy = vsCollect(form);
    if (stockBy) stock = Object.keys(stockBy).reduce(function (s, k) { return s + stockBy[k]; }, 0);
    return {
      stockBy: stockBy, stockByWas: stockBy && VS.was ? VS.was : undefined,
      name: name, cat: get('cat'), price: price, old: old || null, stock: stock,
      visible: !!F(form, 'visible').checked, sizes: sizes, colors: colors,
      desc: { vi: get('desc_vi'), en: get('desc_en') }, full: { vi: get('full_vi'), en: get('full_en') },
      rating: Math.round(rating * 10) / 10, reviews: reviews, img: img,
      images: $$('[data-gal-url]', form).map(function (n) { return n.getAttribute('data-gal-url'); }).filter(function (u) { return !!safeImg(u); }).slice(0, MAX_GALLERY),
      badge: (F(form, 'badge') && F(form, 'badge').value) || '',
      nameEn: get('nameEn'), video: get('video'), seoTitle: get('seoTitle'), seoDesc: get('seoDesc'), slug: slugify(get('slug')),
      features: $$('[data-feat]', form).map(function (r) { return { vi: $('[data-feat-vi]', r).value.trim(), en: $('[data-feat-en]', r).value.trim() }; })
        .filter(function (f) { return f.vi; }).slice(0, MAX_FEATS),
      // số tồn kho lúc mở form: không sửa ô này thì server giữ số hiện tại (có thể vừa bị trừ bởi đơn mới)
      stockWas: F(form, 'stock').hasAttribute('data-was') ? Number(F(form, 'stock').getAttribute('data-was')) : undefined,
    };
  }

  function saveProduct(form) {
    if (!S.drawer) return;
    var data = readProductForm(form);
    if (!data) return;
    setMsg($('[data-form-msg]', form), '');
    var isNew = S.drawer.id === 'new';
    var id = S.drawer.id;
    var btn = $('[form="productForm"]', el.drawer);
    setBusy(btn, true);
    api(isNew ? '/products' : '/products/' + encodeURIComponent(id), { method: isNew ? 'POST' : 'PUT', body: data }).then(function (p) {
      replaceItem('products', p);
      S.dirty = false;
      toast(isNew ? 'Đã thêm “' + p.name + '”' : 'Đã lưu “' + p.name + '”');
      leaveDrawer(); updateView(); renderNav(); refresh();
    }, function (e) {
      setBusy(btn, false);
      if (e.status !== 401 && e.status !== 403) setMsg($('[data-form-msg]', form), e.message);
      apiFail(e);
    });
  }

  function uploadImage(input) {
    var file = input.files && input.files[0];
    var form = input.form || $('#productForm');
    input.value = '';
    if (!file || !form) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { formError(form, 'Chỉ nhận ảnh PNG, JPG, WEBP hoặc GIF.'); return; }
    if (file.size > MAX_UPLOAD) { formError(form, 'Ảnh lớn hơn 8MB — vui lòng nén hoặc thu nhỏ ảnh rồi thử lại.'); return; }
    var lbl = $('[data-upload-label]', form), btn = input.closest('.file-btn');
    btn.classList.add('is-busy'); lbl.textContent = 'Đang tải ảnh…'; input.disabled = true;
    var done = function () { btn.classList.remove('is-busy'); lbl.textContent = 'Tải ảnh lên'; input.disabled = false; };
    var reader = new FileReader();
    reader.onerror = function () { done(); formError(form, 'Không đọc được file ảnh.'); };
    reader.onload = function () {
      api('/uploads', { method: 'POST', body: { dataUrl: String(reader.result || '') } }).then(function (r) {
        done();
        var url = r && safeImg(r.url);
        if (!url) { formError(form, 'Máy chủ trả về đường dẫn ảnh không hợp lệ.'); return; }
        F(form, 'img').value = url;
        $('[data-img-preview]', form).innerHTML = imgPreviewHtml(url);
        setMsg($('[data-form-msg]', form), '');
        S.dirty = true;
        toast('Đã tải ảnh lên — bấm Lưu để áp dụng');
      }, function (e) { done(); if (e.status !== 401 && e.status !== 403) formError(form, e.message); });
    };
    reader.readAsDataURL(file);
  }

  // ═══ Hộp thoại ══════════════════════════════════════════════════════════════
  function confirmDialog(o) {
    var d = el.confirmDlg;
    if (typeof d.showModal !== 'function') return Promise.resolve(window.confirm(o.title + (o.body ? '\n\n' + o.body : '')));
    if (d.open) return Promise.resolve(false);
    el.confirmTitle.textContent = o.title;
    el.confirmBody.textContent = o.body || '';
    el.confirmOk.textContent = o.ok || 'Đồng ý';
    el.confirmCancel.textContent = o.cancel || 'Quay lại';
    d.returnValue = '';
    return new Promise(function (resolve) {
      d.addEventListener('close', function () { resolve(d.returnValue === 'ok'); }, { once: true });
      d.showModal();
      el.confirmCancel.focus();
    });
  }
  // bấm ra ngoài hộp thoại = hủy
  $$('dialog.dlg').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d && !(d === el.pwDlg && S.pwForced)) d.close('cancel'); });
  });
  // đổi mật khẩu bắt buộc (còn dùng mật khẩu mặc định): không đóng được bằng Esc / bấm ra ngoài
  el.pwDlg.addEventListener('cancel', function (e) { if (S.pwForced) e.preventDefault(); });

  function openPassword(forced, current) {
    closeSidebar(true);
    var f = el.pwForm;
    f.reset(); setMsg(el.pwMsg, '');
    S.pwForced = !!forced;
    $('#pwForce').hidden = !forced;
    $('[data-pw-cancel]', f).hidden = !!forced;
    $('[data-pw-out]', f).hidden = !forced;
    F(f, 'username').value = S.user && S.user.email ? S.user.email : '';
    if (current) F(f, 'current').value = current;
    if (typeof el.pwDlg.showModal === 'function') { if (!el.pwDlg.open) el.pwDlg.showModal(); }
    else el.pwDlg.setAttribute('open', '');
    (current ? F(f, 'next') : F(f, 'current')).focus();
  }
  function forcePassword(current) {
    resetState();
    showLogin('');
    openPassword(true, current);
  }
  el.pwForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = el.pwForm;
    var cur = F(f, 'current').value, next = F(f, 'next').value, again = F(f, 'again').value;
    var bad = function (msg, n) { setMsg(el.pwMsg, msg); F(f, n).focus(); };
    if (!cur) return bad('Vui lòng nhập mật khẩu hiện tại.', 'current');
    if (next.length < 8) return bad('Mật khẩu mới cần tối thiểu 8 ký tự.', 'next');
    if (next === DEFAULT_PW) return bad('Không dùng lại mật khẩu mặc định.', 'next');
    if (next === cur) return bad('Mật khẩu mới phải khác mật khẩu hiện tại.', 'next');
    if (next !== again) return bad('Hai lần nhập mật khẩu mới chưa khớp.', 'again');
    var btn = $('[type="submit"]', f);
    setBusy(btn, true); setMsg(el.pwMsg, '');
    api('/auth/change-password', { method: 'POST', body: { currentPassword: cur, newPassword: next }, on401: 'error' }).then(function (r) {
      setBusy(btn, false);
      // đổi mật khẩu → phiên cũ hết hiệu lực, server trả phiên mới
      if (r && r.token) { S.token = r.token; lsSet(TOKEN_KEY, r.token); }
      if (r && r.user) S.user = r.user;
      ssDel(DEFPW_KEY);
      var forced = S.pwForced; S.pwForced = false;
      el.pwDlg.close();
      toast('Đã đổi mật khẩu');
      if (forced) startApp();
      else if (S.view === 'dashboard') updateView();
    }, function (err) {
      setBusy(btn, false);
      if (err.status === 401) {
        // 401 có thể là sai mật khẩu hiện tại hoặc phiên hết hạn → kiểm tra phiên
        api('/auth/me').then(function () { bad(err.message || 'Mật khẩu hiện tại không đúng.', 'current'); }, function () { /* đã chuyển về màn đăng nhập */ });
      } else bad(err.message, 'current');
    });
  });
  $$('[data-dlg-cancel]').forEach(function (b) { b.addEventListener('click', function () { var d = b.closest('dialog'); if (d) d.close(); }); });

  // ═══ Thanh bên (mobile/tablet) ══════════════════════════════════════════════
  var desktopMQ = window.matchMedia('(min-width: 1024px)');
  function openSidebar() {
    el.app.classList.add('side-open');
    el.sideScrim.hidden = false;
    el.menuBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('is-locked');
    var a = $('.side__nav a.is-active', el.side) || $('.side__nav a', el.side);
    setTimeout(function () { if (a) a.focus(); }, 30);
  }
  function closeSidebar(silent) {
    if (!el.app.classList.contains('side-open')) return;
    var inside = el.side.contains(document.activeElement);
    el.app.classList.remove('side-open');
    el.sideScrim.hidden = true;
    el.menuBtn.setAttribute('aria-expanded', 'false');
    if (!S.drawer) document.documentElement.classList.remove('is-locked');
    if (inside && !silent && !desktopMQ.matches) el.menuBtn.focus();
  }
  el.menuBtn.addEventListener('click', function () { if (el.app.classList.contains('side-open')) closeSidebar(); else openSidebar(); });
  el.sideClose.addEventListener('click', function () { closeSidebar(); });
  el.sideScrim.addEventListener('click', function () { closeSidebar(); });
  var onMQ = function () { if (desktopMQ.matches) closeSidebar(true); };
  if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', onMQ); else if (desktopMQ.addListener) desktopMQ.addListener(onMQ);

  // ═══ Đăng nhập / đăng xuất ══════════════════════════════════════════════════
  function showLogin(msg) {
    el.boot.hidden = true; el.app.hidden = true; el.login.hidden = false;
    setMsg(el.loginMsg, msg || '');
    var email = F(el.loginForm, 'email');
    setTimeout(function () { (email.value ? F(el.loginForm, 'password') : email).focus(); }, 30);
  }
  function resetState() {
    stopTimer();
    S.user = null;
    Object.keys(S.data).forEach(function (k) { S.data[k] = null; });
    S.err = {}; S.seen = null; S.loadedAt = 0; S.again = false;
    S.drawer = null; S.dirty = false; S.drawerPending = false; S.drawerMode = ''; ED = null; VS = null;
    S.view = ''; S.sub = ''; S.curHash = null; S.prevHash = null;
    Object.keys(PLUGINS).forEach(function (k) { if (PLUGINS[k].reset) PLUGINS[k].reset(); });
    el.main.innerHTML = '';
    el.drawer.classList.remove('is-open'); el.drawerScrim.classList.remove('is-open');
    el.drawer.hidden = true; el.drawerScrim.hidden = true; el.drawer.innerHTML = '';
    el.app.inert = false; el.app.removeAttribute('aria-hidden');
    el.app.classList.remove('side-open'); el.sideScrim.hidden = true;
    document.documentElement.classList.remove('is-locked');
    $$('dialog[open]').forEach(function (d) { try { d.close(); } catch (e) { d.removeAttribute('open'); } });
    document.title = BASE_TITLE;
  }
  function logout(msg) {
    S.token = ''; lsDel(TOKEN_KEY); ssDel(DEFPW_KEY);
    resetState();
    showLogin(msg);
  }
  function sessionExpired() {
    if (!S.token) return;
    logout('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  function startApp() {
    el.boot.hidden = true; el.login.hidden = true; el.app.hidden = false;
    applyRole();
    el.main.innerHTML = '';
    S.view = ''; S.prevHash = null;
    route();
    refresh();
    loadCategories(true);
    startTimer();
  }

  el.loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = el.loginForm;
    var email = F(f, 'email').value.trim(), password = F(f, 'password').value;
    if (!email || !password) { setMsg(el.loginMsg, 'Vui lòng nhập email và mật khẩu.'); (email ? F(f, 'password') : F(f, 'email')).focus(); return; }
    var btn = $('[type="submit"]', f);
    setBusy(btn, true); setMsg(el.loginMsg, '');
    api('/auth/login', { method: 'POST', body: { email: email, password: password }, auth: false }).then(function (r) {
      setBusy(btn, false);
      if (!r || !r.token) { setMsg(el.loginMsg, 'Máy chủ trả về dữ liệu không hợp lệ.'); return; }
      if (r.user && !has(ROLE_LABEL, r.user.role)) { setMsg(el.loginMsg, 'Tài khoản này không có quyền vào trang quản trị.'); return; }
      S.token = r.token; lsSet(TOKEN_KEY, r.token);
      if (password === DEFAULT_PW) ssSet(DEFPW_KEY, '1'); else ssDel(DEFPW_KEY);
      S.user = r.user || null;
      f.reset();
      if (S.user && S.user.mustChange) { openPassword(true, password); return; }
      startApp();
    }, function (err) {
      setBusy(btn, false);
      setMsg(el.loginMsg, err.message);
      var pw = F(f, 'password'); pw.focus(); pw.select();
    });
  });

  // ═══ Sự kiện chung ══════════════════════════════════════════════════════════
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    var n;
    // liên kết "Bỏ qua đến nội dung" không được đổi hash (hash dùng để điều hướng)
    if (t.closest('.skip')) { e.preventDefault(); el.main.focus(); return; }
    if ((n = t.closest('[data-refresh]'))) { refresh(true); return; }
    if ((n = t.closest('[data-action]'))) {
      var act = n.getAttribute('data-action');
      if (act === 'password') openPassword();
      else if (act === 'logout-now') { S.pwForced = false; el.pwDlg.close(); logout(''); }
      else if (act === 'logout') {
        confirmDialog({ title: 'Đăng xuất khỏi trang quản trị?', body: '', ok: 'Đăng xuất' }).then(function (yes) { if (yes) logout(''); });
      } else if (act === 'delete-item') deleteCurrent();
      else if (act === 'export-csv') exportCsv();
      else if (act === 'export-list') exportList(S.view);
      else if (act === 'edit-item') startEdit();
      else if (act === 'edit-cancel') cancelEdit();
      else if (act === 'conf-resend' && S.drawer) onResend(n, S.drawer.view, S.drawer.id);
      else if (act === 'conf-copy' && S.drawer) copySlip(findById(S.drawer.view, S.drawer.id));
      return;
    }
    if ((n = t.closest('[data-close]'))) { requestCloseDrawer(); return; }
    if ((n = t.closest('[data-filter]')) && el.main.contains(n)) {
      S.filter[S.view] = n.getAttribute('data-filter'); if (has(S.limit, S.view)) S.limit[S.view] = PAGE_SIZE; updateView(); return;
    }
    if ((n = t.closest('[data-more]')) && el.main.contains(n) && has(S.limit, S.view)) {
      S.limit[S.view] = (S.limit[S.view] || PAGE_SIZE) + PAGE_SIZE; updateView();
      var mb = $('[data-more]', el.main); if (mb) mb.focus({ preventScroll: true });
      return;
    }
    // ── sửa đơn / tạo đơn: số lượng, bỏ dòng, thêm sản phẩm, phí giao theo bảng ──
    if ((n = t.closest('[data-ed-qty]')) && ED) {
      var qi = +n.getAttribute('data-i'), qit = ED.items[qi]; if (!qit) return;
      qit.qty = Math.max(1, Math.min(999, qit.qty + (+n.getAttribute('data-ed-qty'))));
      S.dirty = true; edRender('[data-ed-qty="' + n.getAttribute('data-ed-qty') + '"][data-i="' + qi + '"]'); return;
    }
    if ((n = t.closest('[data-ed-del]')) && ED) {
      ED.items.splice(+n.getAttribute('data-i'), 1); S.dirty = true; edRender('[data-ed-add="id"]'); return;
    }
    if ((n = t.closest('[data-ed-addbtn]')) && ED) { edAdd(); return; }
    if ((n = t.closest('[data-ed-shiprule]')) && ED) {
      var sf = F(edForm(), 'shipping'); sf.value = num(+n.getAttribute('data-ed-shiprule')); S.dirty = true; edTotals(); sf.focus(); return;
    }
    if ((n = t.closest('[data-reg-use]'))) {
      var rf = $('#regEdit', el.drawer), rk = n.getAttribute('data-reg-use'), rv = n.getAttribute('data-v');
      if (rf && F(rf, rk)) { F(rf, rk).value = rk === 'total' ? num(+rv) : rv; S.dirty = true; regHints(); F(rf, rk).focus(); }
      return;
    }
    if ((n = t.closest('[data-set-filter]'))) {
      var parts = n.getAttribute('data-set-filter').split(':');
      if (has(S.filter, parts[0])) { S.filter[parts[0]] = parts[1]; S.q[parts[0]] = ''; }
      return; // để liên kết tự điều hướng
    }
    if ((n = t.closest('[data-gal-move], [data-gal-del]')) && el.drawer.contains(n)) {
      var gi = n.closest('[data-gal-url]'), gform = n.closest('form');
      if (n.hasAttribute('data-gal-del')) gi.remove();
      else if (n.getAttribute('data-gal-move') === '-1' && gi.previousElementSibling) gi.parentNode.insertBefore(gi, gi.previousElementSibling);
      else if (n.getAttribute('data-gal-move') === '1' && gi.nextElementSibling) gi.parentNode.insertBefore(gi.nextElementSibling, gi);
      S.dirty = true; galleryState(gform);
      if (!n.hasAttribute('data-gal-del') && document.contains(n) && !n.disabled) n.focus();
      return;
    }
    if ((n = t.closest('[data-feat-add]'))) {
      var fbox = $('[data-feats]', n.closest('form'));
      if ($$('[data-feat]', fbox).length >= MAX_FEATS) return;
      fbox.insertAdjacentHTML('beforeend', featRowHtml());
      S.dirty = true;
      n.disabled = $$('[data-feat]', fbox).length >= MAX_FEATS;
      $('[data-feat-vi]', fbox.lastElementChild).focus();
      return;
    }
    if ((n = t.closest('[data-feat-del]'))) {
      var fform = n.closest('form');
      n.closest('[data-feat]').remove(); S.dirty = true;
      var fadd = $('[data-feat-add]', fform); if (fadd) fadd.disabled = false;
      return;
    }
    if ((n = t.closest('[data-vid-del]'))) {
      var vform = n.closest('form');
      F(vform, 'video').value = ''; $('[data-vid-preview]', vform).innerHTML = vidPreviewHtml('');
      $('[data-vid-label]', vform).textContent = 'Tải video lên'; n.hidden = true; S.dirty = true;
      return;
    }
    if ((n = t.closest('[data-crow-add]'))) {
      var box = $('[data-crows]', n.closest('form'));
      var used = $$('[data-ckey]', box).map(function (s) { return s.value; });
      var next = Object.keys(COLORS).filter(function (k) { return used.indexOf(k) === -1; })[0] || '__new';
      box.insertAdjacentHTML('beforeend', colorRowHtml(next, has(COLORS, next) ? COLORS[next][1] : '#141414'));
      S.dirty = true;
      if (VS && VS.on) vsRender(n.closest('form'));
      var sel = box.lastElementChild && $('[data-ckey]', box.lastElementChild); if (sel) sel.focus();
      return;
    }
    if ((n = t.closest('[data-crow-del]'))) {
      var rows = n.closest('[data-crows]'), cform = n.closest('form');
      if ($$('[data-crow]', rows).length <= 1) { toast('Sản phẩm cần ít nhất một màu', 'err'); return; }
      n.closest('[data-crow]').remove(); S.dirty = true;
      if (VS && VS.on) vsRender(cform);
      return;
    }
    if ((n = t.closest('[data-del-sub]'))) { deleteSubscriber(n.getAttribute('data-del-sub')); return; }
    if ((n = t.closest('[data-nav]'))) { closeSidebar(true); return; }
    if ((n = t.closest('tr[data-href]')) && !t.closest('a, button, input, select, textarea, label')) {
      location.hash = n.getAttribute('data-href');
    }
  });

  el.drawerScrim.addEventListener('click', requestCloseDrawer);

  el.main.addEventListener('input', function (e) {
    if (e.target.matches && e.target.matches('[data-search]')) { S.q[S.view] = e.target.value; if (has(S.limit, S.view)) S.limit[S.view] = PAGE_SIZE; updateView(); }
  });
  el.main.addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('[data-visible]')) toggleVisible(e.target);
    if (e.target.matches && e.target.matches('[data-date]') && has(S.date, S.view)) { S.date[S.view] = e.target.value; S.limit[S.view] = PAGE_SIZE; updateView(); }
  });

  el.drawer.addEventListener('input', function (e) {
    var t = e.target;
    if (!t.closest || !t.closest('form')) return;
    S.dirty = true;
    if (t.classList.contains('is-invalid')) { t.classList.remove('is-invalid'); t.removeAttribute('aria-invalid'); }
    if (t.matches('[data-money]')) fmtMoneyInput(t);
    // sửa đơn / tạo đơn
    if (ED && t.closest('#orderEdit')) {
      if (t.matches('[data-ed-f="qty"]')) {
        var it = ED.items[+t.getAttribute('data-i')], q = parseInt(t.value, 10);
        if (it && q >= 1 && q <= 999) { it.qty = q; var lc = $('[data-ed-line="' + t.getAttribute('data-i') + '"]', el.drawer); if (lc) lc.textContent = money(it.price * it.qty); edTotals(); }
      } else if (t.matches('[data-ed-add="qty"]')) ED.add.qty = Math.max(1, Math.min(999, parseInt(t.value, 10) || 1));
      else if (t.name === 'shipping' || t.name === 'discount') edTotals();
      else if (t.name === 'paidAmount') ED.payTouched = true;
      else if (t.name === 'email') {
        var se = F(t.form, 'sendEmail'); if (se) { se.disabled = !EMAIL_RE.test(t.value.trim()); if (se.disabled) se.checked = false; }
      }
      return;
    }
    if (t.closest('#regEdit')) { if (t.name === 'total' || t.name === 'startDate' || t.name === 'endDate') regHints(); return; }
    // tồn kho theo size / màu
    if (t.matches('[data-vs-key]') && VS) { VS.vals[t.getAttribute('data-vs-key')] = Math.max(0, parseInt(t.value, 10) || 0); vsSum(t.form); return; }
    if (VS && VS.on && (t.name === 'sizes' || t.matches('[data-cname]'))) vsRender(t.form);
    if (t.matches('[data-chex]')) { var tx = $('[data-chex-text]', t.closest('[data-crow]')); if (tx) tx.value = t.value; }
    else if (t.matches('[data-chex-text]')) { var hx = safeHex(t.value, ''); if (hx) $('[data-chex]', t.closest('[data-crow]')).value = hx; }
    else if (t.name === 'img') { $('[data-img-preview]', t.form).innerHTML = imgPreviewHtml(t.value); }
    else if (t.name === 'price' || t.name === 'old') { var h = $('[data-money-for="' + t.name + '"]', t.form); if (h) h.textContent = moneyHint(t.value); }
    else if (t.name === 'name') {
      var sl = F(t.form, 'slug'), stt = F(t.form, 'seoTitle');
      if (sl) sl.placeholder = slugify(t.value) || 'ten-san-pham';
      if (stt) stt.placeholder = (t.value.trim() || 'Tên sản phẩm') + ' — Dapper Combat';
    }
  });
  el.drawer.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-upload]')) { uploadImage(t); return; }
    if (t.matches('[data-gal-add]')) { uploadGallery(t); return; }
    if (t.matches('[data-vid-add]')) { uploadVideo(t); return; }
    if (!t.closest('form')) return;
    S.dirty = true;
    // "Đã nhận tiền": hiện ô số tiền; bật lần đầu thì điền sẵn số cần thu
    if (t.name === 'paid' && t.closest('[data-paybox]')) {
      var pf = $('[data-pay-fields]', t.closest('[data-paybox]')), pa = F(t.form, 'paidAmount');
      pf.hidden = !t.checked;
      if (t.checked && pa) { if (!moneyVal(pa.value) && ED && ED.mode === 'create') { ED.payTouched = false; edTotals(); } pa.focus(); pa.select(); }
      return;
    }
    if (ED && t.closest('#orderEdit')) {
      var f = t.getAttribute('data-ed-f'), ai = t.getAttribute('data-ed-add');
      if (f === 'size' || f === 'color') { var li = +t.getAttribute('data-i'), lit = ED.items[li]; if (lit) { lit[f] = t.value; if (f === 'color') { var lp = findById('products', lit.id), lc2 = lp && lp.colors.filter(function (c) { return c[0] === t.value; })[0]; lit.colorName = lc2 && lc2[2] ? lc2[2] : ''; } edMerge(); edRender(); } }
      else if (f === 'qty') edRender();
      else if (ai === 'id') { var np = findById('products', t.value); ED.add = { id: t.value, size: np ? np.sizes[0] : '', color: np ? np.colors[0][0] : '', qty: ED.add.qty || 1 }; edRender('[data-ed-add="' + (np && np.sizes.length > 1 ? 'size' : np && np.colors.length > 1 ? 'color' : 'qty') + '"]'); }
      else if (ai === 'size' || ai === 'color') { ED.add[ai] = t.value; edRender('[data-ed-add="' + ai + '"]'); }
      else if (t.name === 'ship') { ED.shipTouched = true; edTotals(); }
      else if (t.name === 'source' && !ED.shipTouched) { F(t.form, 'ship').value = t.value === 'walkin' ? 'pickup' : 'std'; edTotals(); }
      return;
    }
    if (t.closest('#regEdit')) { regHints(); return; }
    if (t.matches('[data-vs-on]')) { vsToggle(t.form, t.checked); return; }
    if (t.matches('[data-ckey]')) {
      // đổi màu: nếu mã HEX vẫn là màu mặc định của màu cũ thì đổi theo màu mới
      var row = t.closest('[data-crow]'), prev = t.getAttribute('data-prev') || '';
      var tx = $('[data-chex-text]', row), pick = $('[data-chex]', row);
      var cur = safeHex(tx.value, '');
      if (has(COLORS, t.value) && (!cur || (has(COLORS, prev) && cur === COLORS[prev][1]))) { tx.value = COLORS[t.value][1]; pick.value = COLORS[t.value][1]; }
      t.setAttribute('data-prev', t.value);
      var nvIn = $('[data-cname="vi"]', row);
      if (nvIn) { nvIn.placeholder = has(COLORS, t.value) ? COLORS[t.value][0] + ' (tên có sẵn)' : 'Tên màu, vd Xanh lá'; if (t.value === '__new') nvIn.focus(); }
      if (VS && VS.on) vsRender(t.form);
    }
  });
  // ảnh lỗi → hiện khung trống thay vì biểu tượng ảnh vỡ
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.closest('.thumb, .pimg__preview')) t.classList.add('is-broken');
  }, true);

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.id === 'detailForm') { e.preventDefault(); saveDetail(f); }
    else if (f.id === 'productForm') { e.preventDefault(); saveProduct(f); }
    else if (f.id === 'orderEdit') { e.preventDefault(); saveOrderEdit(f); }
    else if (f.id === 'regEdit') { e.preventDefault(); saveRegEdit(f); }
  });

  document.addEventListener('keydown', function (e) {
    // Enter trong ô "Thêm sản phẩm" = thêm vào đơn (không gửi cả form)
    if (e.key === 'Enter' && ED && e.target instanceof Element && e.target.matches('[data-ed-add]')) { e.preventDefault(); if (ED.add.id) edAdd(); return; }
    if (e.key === 'Escape') {
      if (e.defaultPrevented || document.querySelector('dialog[open]')) return;
      if (S.drawer) { e.preventDefault(); requestCloseDrawer(); return; }
      if (el.app.classList.contains('side-open')) { closeSidebar(); }
      return;
    }
    // giữ focus trong drawer
    if (e.key === 'Tab' && S.drawer && !el.drawer.hidden && !document.querySelector('dialog[open]')) {
      var f = $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', el.drawer)
        .filter(function (n) { return n.offsetParent !== null || n.classList.contains('sr'); });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === el.drawer)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!el.drawer.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });

  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('beforeunload', function (e) { if (S.dirty || pluginDirty()) { e.preventDefault(); e.returnValue = ''; } });

  // ═══ Khởi động ══════════════════════════════════════════════════════════════
  function boot() {
    if (!S.token) { showLogin(''); return; }
    api('/auth/me').then(function (me) {
      if (!me || !has(ROLE_LABEL, me.role)) { logout('Tài khoản này không có quyền vào trang quản trị.'); return; }
      S.user = me;
      if (me.mustChange) { showLogin(''); openPassword(true); return; }
      startApp();
    }, function (e) {
      if (!S.token) return; // 401/403 → đã về màn đăng nhập
      if (e.status === 404) { logout('Không tìm thấy tài khoản. Vui lòng đăng nhập lại.'); return; }
      startApp();          // lỗi mạng: vẫn mở giao diện, từng mục sẽ có nút “Thử lại”
      toast(e.message, 'err');
    });
  }

  // ═══ Giao diện cho màn hình bổ sung (admin-content.js) ══════════════════════
  // def: { title, mount(main, sub), route?(main, sub), update?(main, manual), isDirty?(), dirtyText?(), discard?(), reset?() }
  window.DCAdmin = {
    register: function (id, def) { PLUGINS[id] = def; VIEWS[id] = def.title; },
    // opts.staff = thẻ cũng hiện cho tài khoản nhân viên
    addDashboard: function (fn, opts) { DASH_HOOKS.push({ fn: fn, staff: !!(opts && opts.staff) }); },
    api: api, apiFail: apiFail, toast: toast, confirmDialog: confirmDialog,
    setBusy: setBusy, setMsg: setMsg, esc: esc, norm: norm, has: has,
    safeImg: safeImg, safeHex: safeHex, fmtDate: fmtDate, fmtTime: fmtTime,
    pageHead: pageHead, loadingHtml: loadingHtml, errorHtml: errorHtml, emptyHtml: emptyHtml,
    ICON: ICON,
    token: function () { return S.token; },
    sessionExpired: sessionExpired,
    view: function () { return S.view; },
    rerender: function () { if (S.view === 'dashboard') updateView(); },
    // danh mục sản phẩm (từ Thiết lập) — dùng chung cho bảng sản phẩm, form sản phẩm, gợi ý link…
    categories: function () { return catList().slice(); },
    catName: catName,
    setCategories: setCategories,
    setLowStock: function (n) {
      n = Math.max(0, Math.round(Number(n) || 0));
      if (n === LOW_STOCK) return;
      LOW_STOCK = n;
      if (S.view === 'products' || S.view === 'dashboard') updateView();
      renderNav();
    },
    loadCategories: loadCategories,
    // dữ liệu vận hành (đơn hàng, đăng ký…) đã tải + tải lại
    data: function (kind) { return has(S.data, kind) ? S.data[kind] : null; },
    dataError: function (kind) { return S.err[kind] || ''; },
    refreshData: function (manual) { return refresh(manual); },
    money: money, idHref: idHref, zaloHref: zaloHref, fmtDay: fmtDay, matches: matches,
    conf: { of: confOf, email: confEmail, slip: confSlip, missing: confMissing, reached: confReached, url: slipUrl, emailHtml: confEmailHtml, slipText: confSlipText,
      cell: confCell, emailOf: confEmailOf, phoneOf: confPhoneOf, resend: resendConfirm, copy: copySlip, hhmm: hhmm, LABEL: CONF_EMAIL },
    // mở màn Sản phẩm, lọc sẵn theo một danh mục
    openProducts: function (cat) {
      S.filter.products = cat && (catById(cat) || CAT_ID_RE.test(String(cat))) ? String(cat) : 'all';
      if (location.hash === '#/products') updateView(); else location.hash = '#/products';
    },
    // màn hình tự đổi hash bằng history.replaceState → đồng bộ lại trạng thái điều hướng
    syncRoute: function () { var p = parseHash(); S.sub = p.sub; S.curHash = location.hash; },
    // tài khoản đang đăng nhập (admin / staff)
    user: function () { return S.user; },
    isAdmin: isAdmin,
    // dùng chung cho màn Khách hàng, Hội viên, Tài khoản, Sao lưu (admin-ops.js)
    badge: badge, statusLabel: statusLabel, programName: programName, cust: cust, fmtWhen: fmtWhen, telHref: telHref, digits: digits,
    pay: { due: dueOf, awaiting: awaitingPay, tag: payTag, text: paidText },
    member: { state: memberState, daysTo: daysTo, left: memberLeft, today: ymdToday },
    csv: { download: downloadCsv, phone: csvPhone },
    copyText: copyText, PAGE_SIZE: PAGE_SIZE, ROLE_LABEL: ROLE_LABEL, SOURCE: SOURCE,
  };

  // chờ mọi script (defer) đăng ký xong rồi mới khởi động
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
