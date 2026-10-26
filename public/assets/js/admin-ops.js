/* Dapper Combat — Quản trị: Khách hàng (#/customers), Hội viên (#/members),
   Tài khoản & phân quyền (#/users, chỉ admin), Sao lưu dữ liệu (#/backup, chỉ admin).
   Khách hàng / Hội viên lấy từ dữ liệu đơn hàng + đăng ký admin.js đã tải (không lưu thêm gì).
   Dùng hạ tầng của admin.js qua window.DCAdmin. Mọi giá trị từ dữ liệu đều qua esc() trước khi chèn HTML. */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A || !A.pay) return;
  var esc = A.esc, ICON = A.ICON, PAGE = A.PAGE_SIZE || 50;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function on(v) { return A.view() === v; }
  function num(n) { return (Math.round(Number(n) || 0)).toLocaleString('vi-VN'); }
  function day(ms) { return ms ? A.fmtDay(ms) : '—'; }
  // số điện thoại chuẩn để gộp khách: chỉ chữ số, 84xxxxxxxxx → 0xxxxxxxxx
  function normPhone(p) { var d = A.digits(p); if (d.length === 11 && d.indexOf('84') === 0) d = '0' + d.slice(2); return d; }
  function quickLinks(phone, email) {
    var tel = A.telHref(phone), zalo = A.zaloHref(phone), h = '';
    if (tel) h += '<a class="btn btn--line" href="' + esc(tel) + '">' + ICON.phone + '<span>Gọi</span></a>';
    if (zalo) h += '<a class="btn btn--line" href="' + esc(zalo) + '" target="_blank" rel="noopener noreferrer">' + ICON.chat + '<span>Zalo</span></a>';
    if (email && /^[^@\s<>"']+@[^@\s<>"']+\.[^@\s<>"']+$/.test(email)) h += '<a class="btn btn--line" href="mailto:' + esc(encodeURI(email)) + '">' + ICON.mail + '<span>Email</span></a>';
    return h ? '<div class="quick ops-quick">' + h + '</div>' : '';
  }
  function chipsHtml(defs, active, attr) {
    return '<div class="chips" role="group" aria-label="Bộ lọc">' + defs.map(function (d) {
      var act = d[0] === active;
      return '<button type="button" class="chip' + (act ? ' is-active' : '') + (d[3] && d[2] ? ' chip--alert' : '') + '" ' + attr + '="' + esc(d[0]) + '" aria-pressed="' + act + '"><span>' + esc(d[1]) + '</span><span class="chip__n">' + esc(d[2]) + '</span></button>';
    }).join('') + '</div>';
  }
  function searchHtml(attr, ph, val) {
    return '<label class="search">' + ICON.search + '<span class="sr">Tìm kiếm</span><input type="search" ' + attr + ' placeholder="' + esc(ph) + '" value="' + esc(val) + '" autocomplete="off" spellcheck="false" enterkeyhint="search"></label>';
  }
  function moreHtml(shown, total, noun, attr) {
    var rest = total - shown;
    return '<div class="list-foot"><p class="results-meta">Hiển thị ' + shown + ' / ' + total + ' ' + noun + '</p>' +
      (rest > 0 ? '<button class="btn btn--line" type="button" ' + attr + '>Xem thêm ' + Math.min(PAGE, rest) + ' (còn ' + rest + ')</button>' : '') + '</div>';
  }
  function loaded() { return Array.isArray(A.data('orders')) && Array.isArray(A.data('registrations')); }
  function loadState() { var e = A.dataError('orders') || A.dataError('registrations'); return e ? A.errorHtml(e) : A.loadingHtml(); }
  // ô tìm kiếm: vẽ lại phần danh sách, giữ con trỏ trong ô
  function keepSearch(attr, fn) {
    var f = $('[' + attr + ']'), pos = f && f.selectionStart;
    fn();
    f = $('[' + attr + ']');
    if (f && document.activeElement !== f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (e) { /* bỏ qua */ } }
  }

  // ═══ Khách hàng ═════════════════════════════════════════════════════════════
  var CU = { q: '', f: 'all', limit: PAGE };
  // gộp đơn hàng + đăng ký theo số điện thoại; tên / email lấy theo lần gần nhất
  function customers() {
    var map = {}, list = [];
    var put = function (kind, x, name, phone, email) {
      var k = normPhone(phone); if (k.length < 8) return;
      var c = map[k], at = Number(x.createdAt) || 0;
      if (!c) { c = map[k] = { key: k, phone: phone, name: '', email: '', orders: [], regs: [], collected: 0, bought: 0, last: 0, first: Infinity, nameAt: -1, emailAt: -1 }; list.push(c); }
      if (name && at >= c.nameAt) { c.name = name; c.nameAt = at; c.phone = phone; }
      if (email && at >= c.emailAt) { c.email = email; c.emailAt = at; }
      (kind === 'orders' ? c.orders : c.regs).push(x);
      if (x.paid) c.collected += Number(x.paidAmount) || 0;
      if (kind === 'orders' && x.status !== 'cancelled') c.bought += Number(x.total) || 0;
      c.last = Math.max(c.last, at, Number(x.paidAt) || 0, Number(x.updatedAt) || 0);
      c.first = Math.min(c.first, at);
    };
    (A.data('orders') || []).forEach(function (o) { var c = A.cust(o); put('orders', o, c.name, c.phone, c.email); });
    (A.data('registrations') || []).forEach(function (r) { put('registrations', r, r.name, r.phone, r.email); });
    list.forEach(function (c) {
      var byNew = function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); };
      c.orders.sort(byNew); c.regs.sort(byNew);
    });
    return list.sort(function (a, b) { return b.last - a.last; });
  }
  var CU_F = [['all', 'Tất cả'], ['buy', 'Đã mua hàng'], ['learn', 'Học viên'], ['both', 'Cả hai']];
  function cuTest(f, c) { return f === 'buy' ? c.orders.length > 0 : f === 'learn' ? c.regs.length > 0 : f === 'both' ? c.orders.length > 0 && c.regs.length > 0 : true; }
  function cuMount(main, sub) {
    main.innerHTML = A.pageHead('Khách hàng', { eyebrow: 'Vận hành', actions: '<button class="btn btn--line" type="button" data-cu-export>' + ICON.download + '<span>Xuất CSV</span></button>' }) + '<div data-cu-root></div>';
    cuRender(sub);
  }
  function cuRender(sub) {
    var root = $('[data-cu-root]'); if (!root) return;
    if (sub === undefined) sub = CU.sub || '';
    CU.sub = sub;
    var cnt = $('[data-count]'), exp = $('[data-cu-export]');
    if (exp) exp.hidden = !!sub;
    if (!loaded()) { root.innerHTML = loadState(); return; }
    var all = customers();
    if (cnt) cnt.textContent = String(all.length);
    if (sub) { root.innerHTML = cuDetail(all.filter(function (c) { return c.key === sub; })[0]); return; }
    root.innerHTML = '<div class="cms-help"><p>Gộp <strong>đơn hàng</strong> và <strong>đăng ký khóa học</strong> theo số điện thoại — không cần nhập gì thêm. “Đã thu” = tổng các khoản đã ghi “Đã nhận tiền”. Bấm vào một khách để xem toàn bộ đơn và đăng ký của họ.</p></div>' +
      '<div class="toolbar"><div data-cu-chips></div>' + searchHtml('data-cu-q', 'Tìm tên, SĐT, email…', CU.q) + '</div><div data-cu-list></div>';
    cuList(all);
  }
  function cuList(all) {
    all = all || customers();
    var chips = $('[data-cu-chips]'), box = $('[data-cu-list]'); if (!box) return;
    chips.innerHTML = chipsHtml(CU_F.map(function (f) { return [f[0], f[1], all.filter(function (c) { return cuTest(f[0], c); }).length]; }), CU.f, 'data-cu-f');
    var rows = all.filter(function (c) { return cuTest(CU.f, c) && A.matches(CU.q, [c.name, c.phone, c.key, c.email]); });
    if (!all.length) { box.innerHTML = A.emptyHtml('Chưa có khách hàng nào', 'Khi có đơn hàng hoặc đăng ký khóa học, khách sẽ hiện ở đây.'); return; }
    if (!rows.length) { box.innerHTML = A.emptyHtml('Không có khách phù hợp', 'Thử chọn “Tất cả” hoặc đổi từ khóa tìm kiếm.'); return; }
    var shown = rows.slice(0, CU.limit);
    box.innerHTML = '<div class="table-wrap"><table class="tbl tbl--cu"><thead><tr><th scope="col" class="c-name">Khách</th><th scope="col" class="c-phone">SĐT</th><th scope="col" class="c-mail">Email</th>' +
      '<th scope="col" class="c-num">Đơn hàng</th><th scope="col" class="c-money">Đã thu</th><th scope="col" class="c-num c-regs">Đăng ký</th><th scope="col" class="c-date">Gần nhất</th></tr></thead><tbody>' +
      shown.map(function (c) {
        return '<tr data-href="#/customers/' + esc(c.key) + '"><td class="c-name" data-label="Khách"><a class="cell-title" href="#/customers/' + esc(c.key) + '">' + esc(c.name || '(không tên)') + '</a></td>' +
          '<td class="c-phone" data-label="SĐT">' + esc(c.phone || c.key) + '</td>' +
          '<td class="c-mail" data-label="Email">' + (c.email ? esc(c.email) : '<span class="muted">—</span>') + '</td>' +
          '<td class="c-num" data-label="Đơn hàng">' + esc(c.orders.length) + '</td>' +
          '<td class="c-money" data-label="Đã thu"><strong>' + esc(A.money(c.collected)) + '</strong></td>' +
          '<td class="c-num c-regs" data-label="Đăng ký">' + esc(c.regs.length) + '</td>' +
          '<td class="c-date" data-label="Gần nhất">' + esc(day(c.last)) + '</td></tr>';
      }).join('') + '</tbody></table></div>' + moreHtml(shown.length, rows.length, 'khách', 'data-cu-more');
  }
  function cuDetail(c) {
    var back = '<a class="ops-back" href="#/customers">← Tất cả khách hàng</a>';
    if (!c) return back + A.emptyHtml('Không tìm thấy khách này', 'Có thể đơn / đăng ký của khách đã bị xóa.');
    var oLive = c.orders.filter(function (o) { return o.status !== 'cancelled'; }).length;
    var tile = function (label, val, sub) { return '<div class="stat"><span class="stat__label">' + esc(label) + '</span><span class="stat__value">' + esc(val) + '</span>' + (sub ? '<span class="stat__sub">' + esc(sub) + '</span>' : '') + '</div>'; };
    var ordersHtml = c.orders.length ? '<ul class="mini-list">' + c.orders.map(function (o) {
      var items = (o.items || []).map(function (it) { return (it.qty || 0) + '× ' + (it.name || ''); }).join(', ');
      return '<li><a class="mini-row" href="' + esc(A.idHref('orders', o.id)) + '"><span class="mini-row__top"><span class="code">' + esc(o.code || o.id) + '</span>' + A.badge('orders', o.status) + '</span>' +
        '<span class="mini-row__name">' + esc(items || '—') + '</span>' +
        '<span class="mini-row__meta"><span>' + esc(A.fmtDate(o.createdAt)) + '</span><span>' + esc(A.money(o.total)) + ' ' + A.pay.tag('orders', o) + '</span></span></a></li>';
    }).join('') + '</ul>' : '<p class="mini-state">Chưa có đơn hàng.</p>';
    var regsHtml = c.regs.length ? '<ul class="mini-list">' + c.regs.map(function (r) {
      var left = r.status === 'enrolled' && r.endDate ? ' · hết hạn ' + A.fmtWhen(r.endDate) + A.member.left(r) : '';
      return '<li><a class="mini-row" href="' + esc(A.idHref('registrations', r.id)) + '"><span class="mini-row__top"><span class="code">' + esc(r.code || r.id) + '</span>' + A.badge('registrations', r.status) + '</span>' +
        '<span class="mini-row__name">' + esc(A.programName(r) + (r.detail ? ' · ' + r.detail : '')) + '</span>' +
        '<span class="mini-row__meta"><span>' + esc(A.fmtDate(r.createdAt) + left) + '</span><span>' + esc(r.total ? A.money(r.total) : '—') + ' ' + A.pay.tag('registrations', r) + '</span></span></a></li>';
    }).join('') + '</ul>' : '<p class="mini-state">Chưa đăng ký khóa học.</p>';
    return back + '<section class="panel ops-cust"><div class="ops-cust__head"><div><h2 class="ops-cust__name">' + esc(c.name || '(không tên)') + '</h2>' +
        '<p class="ops-cust__meta">' + esc([c.phone || c.key, c.email].filter(Boolean).join(' · ')) + '</p></div>' + quickLinks(c.phone || c.key, c.email) + '</div></section>' +
      '<div class="stats ops-stats">' + tile('Đơn hàng', num(c.orders.length), oLive !== c.orders.length ? (c.orders.length - oLive) + ' đơn đã hủy' : 'Giá trị ' + A.money(c.bought)) +
        tile('Đã thu', A.money(c.collected), 'Đơn hàng + học phí đã nhận') + tile('Đăng ký khóa học', num(c.regs.length), '') + tile('Khách từ', day(c.first), 'Gần nhất ' + day(c.last)) + '</div>' +
      '<div class="dash-grid ops-cust-grid"><section class="panel"><header class="panel__head"><h2 class="panel__title">Đơn hàng</h2></header>' + ordersHtml + '</section>' +
      '<section class="panel"><header class="panel__head"><h2 class="panel__title">Đăng ký khóa học</h2></header>' + regsHtml + '</section></div>';
  }
  function cuExport() {
    if (!loaded()) return;
    var rows = customers().filter(function (c) { return cuTest(CU.f, c) && A.matches(CU.q, [c.name, c.phone, c.key, c.email]); });
    if (!rows.length) { A.toast('Không có khách nào để xuất.', 'err'); return; }
    A.csv.download('khach-hang', ['Khách hàng', 'Số điện thoại', 'Email', 'Số đơn hàng', 'Giá trị đơn (không tính đơn hủy)', 'Đã thu', 'Số đăng ký khóa học', 'Lần đầu', 'Gần nhất'],
      rows.map(function (c) { return [c.name, A.csv.phone(c.phone || c.key), c.email, c.orders.length, c.bought, c.collected, c.regs.length, day(c.first), day(c.last)]; }));
    A.toast('Đã xuất ' + rows.length + ' khách ra file CSV');
  }

  // ═══ Hội viên ═══════════════════════════════════════════════════════════════
  var ME = { f: 'active', q: '', limit: PAGE };
  var ME_F = [['active', 'Đang tập'], ['soon', 'Sắp hết hạn (≤ 7 ngày)'], ['expired', 'Đã hết hạn'], ['all', 'Tất cả']];
  function members() { return (A.data('registrations') || []).filter(function (r) { return r.status === 'enrolled'; }); }
  function meTest(f, r) { var s = A.member.state(r); return f === 'all' || (f === 'active' ? s === 'active' || s === 'soon' : s === f); }
  function remindText(r) {
    var d = A.member.daysTo(r.endDate), date = A.fmtWhen(r.endDate), prog = A.programName(r);
    return 'Chào ' + (r.name || 'bạn') + ', gói ' + prog + ' của bạn tại Dapper Combat ' +
      (d < 0 ? 'đã hết hạn từ ngày ' + date : d === 0 ? 'hết hạn hôm nay (' + date + ')' : 'sẽ hết hạn ngày ' + date) +
      '. Bạn muốn gia hạn để tiếp tục tập thì nhắn lại cho Dapper Combat nhé!';
  }
  function meMount(main) {
    main.innerHTML = A.pageHead('Hội viên', { eyebrow: 'Khóa học' }) +
      '<div class="cms-help"><p>Học viên ở trạng thái <strong>“Đã xếp lớp”</strong>. Ngày bắt đầu / hết hạn tự điền khi chuyển sang “Đã xếp lớp” (Group Training theo gói, lớp HSSV theo khóa, Membership 1 tháng) và sửa được trong <strong>Sửa đăng ký</strong>. ' +
      'Bấm “Chép tin nhắc” rồi “Zalo” để nhắn khách gia hạn.</p></div>' +
      '<div class="toolbar"><div data-me-chips></div>' + searchHtml('data-me-q', 'Tìm tên, SĐT, mã…', ME.q) + '</div><div data-me-list></div>';
    meRender();
  }
  function meRender() {
    var box = $('[data-me-list]'), chips = $('[data-me-chips]'); if (!box) return;
    if (!loaded()) { box.innerHTML = loadState(); return; }
    var all = members(), cnt = $('[data-count]');
    if (cnt) cnt.textContent = String(all.length);
    chips.innerHTML = chipsHtml(ME_F.map(function (f) { return [f[0], f[1], all.filter(function (r) { return meTest(f[0], r); }).length, f[0] === 'soon']; }), ME.f, 'data-me-f');
    if (!all.length) { box.innerHTML = A.emptyHtml('Chưa có hội viên nào', 'Chuyển đăng ký khóa học sang “Đã xếp lớp” để học viên hiện ở đây.'); return; }
    var rows = all.filter(function (r) { return meTest(ME.f, r) && A.matches(ME.q, [r.name, r.phone, r.code, A.programName(r)]); })
      .sort(function (a, b) { return (a.endDate || '9999') < (b.endDate || '9999') ? -1 : (a.endDate || '9999') > (b.endDate || '9999') ? 1 : 0; });
    if (!rows.length) { box.innerHTML = A.emptyHtml(ME.f === 'soon' ? 'Không có hội viên nào sắp hết hạn' : ME.f === 'expired' ? 'Không có hội viên nào đã hết hạn' : 'Không có hội viên phù hợp', 'Thử chọn “Tất cả” hoặc đổi từ khóa tìm kiếm.'); return; }
    var shown = rows.slice(0, ME.limit);
    box.innerHTML = '<div class="table-wrap"><table class="tbl tbl--me"><thead><tr><th scope="col" class="c-code">Mã</th><th scope="col" class="c-name">Học viên</th><th scope="col" class="c-phone">SĐT</th><th scope="col" class="c-prog">Chương trình</th>' +
      '<th scope="col" class="c-when">Bắt đầu</th><th scope="col" class="c-when c-end">Hết hạn</th><th scope="col" class="c-status">Còn lại</th><th scope="col" class="c-act"><span class="sr">Nhắc gia hạn</span></th></tr></thead><tbody>' +
      shown.map(function (r) {
        var s = A.member.state(r), d = A.member.daysTo(r.endDate), zalo = A.zaloHref(r.phone);
        var left = d == null ? '<span class="badge" title="Đặt ngày hết hạn trong “Sửa đăng ký”">Chưa đặt hạn</span>' : d < 0 ? '<span class="badge badge--off">Hết hạn ' + esc(-d) + ' ngày</span>' : '<span class="badge' + (s === 'soon' ? ' badge--new' : '') + '">' + (d === 0 ? 'Hết hạn hôm nay' : 'Còn ' + esc(d) + ' ngày') + '</span>';
        return '<tr class="' + (s === 'soon' ? 'is-new' : '') + '" data-href="' + esc(A.idHref('registrations', r.id)) + '" data-me-id="' + esc(r.id) + '">' +
          '<td class="c-code" data-label="Mã"><a class="code" href="' + esc(A.idHref('registrations', r.id)) + '">' + esc(r.code || r.id) + '</a></td>' +
          '<td class="c-name" data-label="Học viên">' + esc(r.name || '—') + '</td>' +
          '<td class="c-phone" data-label="SĐT">' + esc(r.phone || '—') + '</td>' +
          '<td class="c-prog" data-label="Chương trình">' + esc(A.programName(r) + (r.detail ? ' · ' + r.detail : '')) + '</td>' +
          '<td class="c-when" data-label="Bắt đầu">' + esc(r.startDate ? A.fmtWhen(r.startDate) : '—') + '</td>' +
          '<td class="c-when c-end" data-label="Hết hạn">' + esc(r.endDate ? A.fmtWhen(r.endDate) : '—') + '</td>' +
          '<td class="c-status" data-label="Còn lại">' + left + '</td>' +
          '<td class="c-act" data-label="Nhắc gia hạn"><span class="ops-act">' +
            (r.endDate ? '<button class="btn btn--line btn--sm" type="button" data-me-copy>Chép tin nhắc</button>' : '') +
            (zalo ? '<a class="btn btn--quiet btn--sm" href="' + esc(zalo) + '" target="_blank" rel="noopener noreferrer">Zalo ↗</a>' : '') + '</span></td></tr>';
      }).join('') + '</tbody></table></div>' + moreHtml(shown.length, rows.length, 'hội viên', 'data-me-more');
  }

  // ═══ Tài khoản & phân quyền (chỉ admin) ══════════════════════════════════════
  var US = { list: null, err: '', loading: null, created: null };
  function usLoad() {
    if (US.loading) return US.loading;
    US.loading = A.api('/users').then(function (l) { US.list = Array.isArray(l) ? l : []; US.err = ''; }, function (e) { US.err = (e && e.message) || 'Không tải được danh sách tài khoản'; })
      .then(function () { US.loading = null; if (on('users')) usRender(); });
    return US.loading;
  }
  function usMount(main) {
    main.innerHTML = A.pageHead('Tài khoản & phân quyền', { eyebrow: 'Thiết lập', stamp: false }) +
      '<div class="cms-help"><p><strong>Quản trị (admin)</strong>: dùng được mọi mục. <strong>Nhân viên</strong>: xem và xử lý đơn hàng, đăng ký khóa học, tư vấn, khách hàng, hội viên; tạo / sửa đơn; sửa sản phẩm, ảnh và tồn kho. ' +
      'Nhân viên <strong>không</strong> vào được Nội dung website, Thiết lập, Tài khoản, Sao lưu và <strong>không xóa</strong> được dữ liệu.</p></div><div data-us-root></div>';
    usRender(); usLoad();
  }
  function usRender() {
    var root = $('[data-us-root]'); if (!root) return;
    var me = A.user() || {}, list = US.list, cnt = $('[data-count]');
    if (cnt) cnt.textContent = list ? String(list.length) : '';
    var created = US.created ? '<div class="ops-created" role="status"><p><strong>Đã tạo tài khoản cho ' + esc(US.created.user.name || US.created.user.email) + '.</strong> Mật khẩu tạm (chỉ hiện một lần — hãy gửi ngay):</p>' +
      '<p class="ops-pw"><code>' + esc(US.created.pw) + '</code></p>' +
      '<p class="field__hint">Gửi cho người dùng: địa chỉ <strong>' + esc(location.origin + '/admin') + '</strong>, email <strong>' + esc(US.created.user.email) + '</strong> và mật khẩu tạm. Lần đầu đăng nhập sẽ phải đặt mật khẩu mới.</p>' +
      '<div class="set-actions"><button class="btn btn--primary btn--sm" type="button" data-us-copy>Chép thông tin đăng nhập</button><button class="btn btn--quiet btn--sm" type="button" data-us-done>Đã gửi, ẩn đi</button></div></div>' : '';
    var form = '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">Thêm tài khoản</h2></header><form class="set-body" id="userAdd" novalidate>' +
      '<div class="set-grid3"><label class="field"><span class="field__label">Tên</span><input type="text" name="name" maxlength="80" autocomplete="off" placeholder="VD: Lan (thu ngân)"></label>' +
      '<label class="field"><span class="field__label">Email đăng nhập</span><input type="email" name="email" maxlength="120" autocomplete="off" inputmode="email" spellcheck="false" required></label>' +
      '<label class="field"><span class="field__label">Quyền</span><select name="role"><option value="staff">Nhân viên</option><option value="admin">Quản trị (admin)</option></select></label></div>' +
      '<p class="form-msg" data-us-msg role="alert" hidden></p>' +
      '<div class="set-actions"><button class="btn btn--primary" type="submit">' + ICON.plus + '<span>Tạo tài khoản</span></button><span class="field__hint">Hệ thống tạo mật khẩu tạm; người dùng đổi ở lần đăng nhập đầu.</span></div></form></section>';
    var table;
    if (!list) table = US.err ? A.errorHtml(US.err) : A.loadingHtml();
    else {
      var admins = list.filter(function (u) { return u.role === 'admin'; }).length;
      table = '<div class="table-wrap"><table class="tbl tbl--us"><thead><tr><th scope="col" class="c-name">Tên</th><th scope="col" class="c-mail">Email</th><th scope="col" class="c-role">Quyền</th>' +
        '<th scope="col" class="c-status">Trạng thái</th><th scope="col" class="c-date">Đăng nhập gần nhất</th><th scope="col" class="c-act"><span class="sr">Thao tác</span></th></tr></thead><tbody>' +
        list.map(function (u) {
          var self = u.id === me.id, lastAdmin = u.role === 'admin' && admins <= 1;
          return '<tr data-us-id="' + esc(u.id) + '"><td class="c-name" data-label="Tên"><strong>' + esc(u.name || '—') + '</strong>' + (self ? ' <span class="tag tag--muted">Bạn</span>' : '') + '</td>' +
            '<td class="c-mail" data-label="Email">' + mailHtml(u.email) + '</td>' +
            '<td class="c-role" data-label="Quyền">' + (self || lastAdmin ? '<span class="badge' + (u.role === 'admin' ? ' badge--done' : '') + '" title="' + (self ? 'Không tự đổi quyền của mình' : 'Phải còn ít nhất một admin') + '">' + esc(A.ROLE_LABEL[u.role] || u.role) + '</span>'
              : '<label><span class="sr">Quyền của ' + esc(u.email) + '</span><select data-us-role>' + ['staff', 'admin'].map(function (r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + esc(A.ROLE_LABEL[r]) + '</option>'; }).join('') + '</select></label>') + '</td>' +
            '<td class="c-status" data-label="Trạng thái">' + (u.mustChange ? '<span class="cf cf--wait">Chờ đổi mật khẩu tạm</span>' : '<span class="cf cf--ok">Đang dùng</span>') + '</td>' +
            '<td class="c-date" data-label="Đăng nhập gần nhất">' + esc(u.lastLoginAt ? A.fmtDate(u.lastLoginAt) : 'Chưa đăng nhập') + '</td>' +
            '<td class="c-act" data-label="Thao tác"><span class="ops-act">' + (self ? '<span class="field__hint">Đổi mật khẩu ở cuối thanh menu</span>' :
              '<button class="btn btn--line btn--sm" type="button" data-us-reset>Cấp lại mật khẩu</button>' +
              (lastAdmin ? '' : '<button class="icon-btn icon-btn--line" type="button" data-us-del aria-label="Xóa tài khoản ' + esc(u.email) + '" title="Xóa tài khoản">' + ICON.trash + '</button>')) + '</span></td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    root.innerHTML = created + form + table;
  }
  // email xuống dòng sau dấu @ (không cắt giữa chữ)
  function mailHtml(e) { var i = String(e || '').indexOf('@'); return i > 0 ? esc(e.slice(0, i + 1)) + '<wbr>' + esc(e.slice(i + 1)) : esc(e); }
  function usById(id) { return (US.list || []).filter(function (u) { return u.id === id; })[0]; }
  function usAdd(f) {
    var msg = $('[data-us-msg]', f), email = f.elements.email.value.trim(), name = f.elements.name.value.trim(), role = f.elements.role.value;
    if (!/^[^@\s<>"']+@[^@\s<>"']+\.[^@\s<>"']+$/.test(email)) { A.setMsg(msg, 'Nhập email đúng định dạng.'); f.elements.email.focus(); return; }
    var go = function () {
      var btn = $('[type="submit"]', f); A.setBusy(btn, true); A.setMsg(msg, '');
      A.api('/users', { method: 'POST', body: { name: name, email: email, role: role } }).then(function (r) {
        US.created = { user: r.user, pw: r.tempPassword }; US.list = (US.list || []).concat(r.user);
        usRender(); A.toast('Đã tạo tài khoản ' + r.user.email);
        var c = $('[data-us-copy]'); if (c) c.focus();
      }, function (e) { A.setBusy(btn, false); A.setMsg(msg, e.message); A.apiFail(e); });
    };
    if (role === 'admin') A.confirmDialog({ title: 'Tạo tài khoản quản trị?', body: email + ' sẽ có toàn quyền: sửa nội dung website, thiết lập, tài khoản, sao lưu và xóa dữ liệu.', ok: 'Tạo tài khoản admin', cancel: 'Quay lại' }).then(function (y) { if (y) go(); });
    else go();
  }
  function copyCreds(u, pw) {
    var text = 'Trang quản trị Dapper Combat: ' + location.origin + '/admin\nEmail: ' + u.email + '\nMật khẩu tạm: ' + pw + '\n(Lần đầu đăng nhập sẽ phải đặt mật khẩu mới.)';
    A.copyText(text).then(function (ok) { A.toast(ok ? 'Đã chép thông tin đăng nhập — dán vào Zalo / tin nhắn gửi người dùng.' : 'Trình duyệt không cho chép tự động — hãy chép tay mật khẩu tạm.', ok ? 'ok' : 'info'); });
  }

  // ═══ Sao lưu dữ liệu (chỉ admin) ═════════════════════════════════════════════
  var FILE_VI = { 'orders.json': 'Đơn hàng', 'registrations.json': 'Đăng ký khóa học', 'consults.json': 'Yêu cầu tư vấn', 'subscribers.json': 'Người nhận tin', 'products.json': 'Sản phẩm',
    'users.json': 'Tài khoản (mật khẩu đã mã hóa)', 'pages.json': 'Trang phụ', 'maillog.json': 'Nhật ký gửi tin', 'settings.json': 'Thiết lập', 'cms.json': 'Nội dung website', 'promo-usage.json': 'Lượt dùng mã giảm giá' };
  var BK = { bundle: null, name: '', err: '', result: null, busy: false };
  function bkMount(main) {
    main.innerHTML = A.pageHead('Sao lưu dữ liệu', { eyebrow: 'Thiết lập', stamp: false, count: false, refresh: false }) + '<div data-bk-root></div>';
    bkRender();
  }
  function bkSummary(b) {
    var files = Object.keys(b.files || {});
    return '<ul class="ops-files">' + files.map(function (f) {
      var v = b.files[f];
      return '<li><span>' + esc(FILE_VI[f] || f) + '</span><span class="muted">' + (Array.isArray(v) ? esc(num(v.length)) + ' mục' : 'có') + '</span></li>';
    }).join('') + '</ul>';
  }
  function bkRender() {
    var root = $('[data-bk-root]'); if (!root) return;
    var b = BK.bundle;
    root.innerHTML =
      '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">Tải bản sao lưu</h2></header><div class="set-body">' +
        '<p>Một file <strong>.json</strong> gồm toàn bộ dữ liệu: đơn hàng, đăng ký khóa học, tư vấn, người nhận tin, sản phẩm & tồn kho, thiết lập, nội dung website, trang phụ, tài khoản (chỉ có mật khẩu đã mã hóa) và nhật ký gửi tin.</p>' +
        '<p class="set-err"><strong>Ảnh, video và phông chữ đã tải lên không nằm trong file này.</strong> Chúng ở thư mục <code>public/assets/uploads</code> trên máy chủ — hãy chép riêng thư mục đó (nhờ người quản lý máy chủ) khi sao lưu hoặc chuyển máy.</p>' +
        '<p class="set-note">Nên tải bản sao lưu mỗi tuần và cất ở nơi an toàn (Google Drive, USB…). File có thông tin khách hàng — không gửi cho người lạ.</p>' +
        '<div class="set-actions"><button class="btn btn--primary" type="button" data-bk-download>' + ICON.download + '<span>Tải bản sao lưu</span></button></div></div></section>' +
      '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">Khôi phục từ bản sao lưu</h2></header><div class="set-body">' +
        '<p>Thay <strong>toàn bộ</strong> dữ liệu hiện tại bằng dữ liệu trong file sao lưu. Trước khi ghi đè, máy chủ tự cất bản hiện tại vào thư mục <code>data/truoc-khoi-phuc-…</code>.</p>' +
        '<label class="btn btn--line file-btn">' + ICON.upload + '<span>Chọn file sao lưu (.json)</span><input class="sr" type="file" accept=".json,application/json" data-bk-file></label>' +
        (BK.err ? '<p class="form-msg" role="alert">' + esc(BK.err) + '</p>' : '') +
        (b ? '<div class="ops-restore"><p><strong>' + esc(BK.name) + '</strong> — sao lưu lúc ' + esc(b.createdAt ? A.fmtDate(b.createdAt) : '—') + (b.createdBy ? ' bởi ' + esc(b.createdBy) : '') + '</p>' + bkSummary(b) +
          '<label class="check ops-ack"><input type="checkbox" data-bk-ack><span class="switch__ui" aria-hidden="true"></span><span>Tôi hiểu: dữ liệu hiện tại (kể cả đơn hàng mới sau thời điểm sao lưu) sẽ được thay bằng dữ liệu trong file này.</span></label>' +
          '<div class="set-actions"><button class="btn btn--primary" type="button" data-bk-restore disabled>Khôi phục dữ liệu</button><button class="btn btn--quiet" type="button" data-bk-clear>Chọn file khác</button></div></div>' : '') +
        (BK.result ? '<div class="ops-created" role="status"><p><strong>Đã khôi phục dữ liệu.</strong> Bản trước khi khôi phục được cất ở <code>' + esc(BK.result.savedTo) + '</code> trên máy chủ.</p>' +
          '<ul class="ops-files">' + BK.result.restored.map(function (x) { return '<li><span>' + esc(FILE_VI[x.file] || x.label || x.file) + '</span><span class="muted">' + (x.count != null ? esc(num(x.count)) + ' mục' : 'đã khôi phục') + '</span></li>'; }).join('') + '</ul>' +
          '<p class="field__hint">Nếu bản sao lưu có tài khoản khác, bạn có thể phải đăng nhập lại.</p></div>' : '') +
      '</div></section>';
  }
  function bkDownload(btn) {
    A.setBusy(btn, true);
    fetch('/api/backup', { headers: { Authorization: 'Bearer ' + A.token() }, cache: 'no-store' }).then(function (res) {
      if (res.status === 401) { A.sessionExpired(); throw new Error('Phiên đăng nhập đã hết hạn.'); }
      if (!res.ok) return res.json().catch(function () { return {}; }).then(function (d) { throw new Error(d.error || 'Không tải được bản sao lưu (mã ' + res.status + ').'); });
      var m = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') || '');
      return res.blob().then(function (blob) { return { blob: blob, name: m ? m[1] : 'dapper-combat-sao-luu.json' }; });
    }).then(function (r) {
      var url = URL.createObjectURL(r.blob), a = document.createElement('a');
      a.href = url; a.download = r.name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
      A.toast('Đã tải ' + r.name + ' — nhớ chép thêm thư mục ảnh tải lên (public/assets/uploads).');
    }, function (e) { if (A.token()) A.toast(e.message, 'err'); }).then(function () { A.setBusy(btn, false); });
  }
  function bkFile(input) {
    var file = input.files && input.files[0]; input.value = '';
    BK.bundle = null; BK.err = ''; BK.result = null;
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { BK.err = 'File quá lớn (tối đa 200MB).'; bkRender(); return; }
    var rd = new FileReader();
    rd.onerror = function () { BK.err = 'Không đọc được file.'; bkRender(); };
    rd.onload = function () {
      var b = null;
      try { b = JSON.parse(String(rd.result || '')); } catch (e) { b = null; }
      if (!b || b.app !== 'dapper-combat' || b.version !== 1 || !b.files || typeof b.files !== 'object') BK.err = 'File này không phải bản sao lưu của Dapper Combat (hoặc đã bị hỏng).';
      else { BK.bundle = b; BK.name = file.name; }
      bkRender();
    };
    rd.readAsText(file);
  }
  function bkRestore(btn) {
    var b = BK.bundle; if (!b) return;
    A.confirmDialog({
      title: 'Khôi phục dữ liệu từ bản sao lưu ' + (b.createdAt ? A.fmtDate(b.createdAt) : '') + '?',
      body: 'Đơn hàng, đăng ký, sản phẩm, thiết lập, nội dung website, tài khoản… hiện tại sẽ bị THAY bằng dữ liệu trong file. Những gì phát sinh sau thời điểm sao lưu sẽ không còn trên trang (bản hiện tại vẫn được cất trong thư mục data/truoc-khoi-phuc-… trên máy chủ). Ảnh / video không thay đổi.',
      ok: 'Khôi phục ngay', cancel: 'Quay lại',
    }).then(function (yes) {
      if (!yes) return;
      A.setBusy(btn, true);
      A.api('/backup/restore', { method: 'POST', body: b }).then(function (r) {
        BK.bundle = null; BK.result = r; bkRender();
        A.toast('Đã khôi phục dữ liệu từ bản sao lưu.');
        A.refreshData();
      }, function (e) { A.setBusy(btn, false); A.apiFail(e); });
    });
  }

  // ═══ Sự kiện ═══════════════════════════════════════════════════════════════
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null; if (!t) return;
    var n, v = A.view();
    if (v === 'customers') {
      if ((n = t.closest('[data-cu-f]'))) { CU.f = n.getAttribute('data-cu-f'); CU.limit = PAGE; cuList(); var b = $('[data-cu-f="' + CU.f + '"]'); if (b) b.focus(); return; }
      if (t.closest('[data-cu-more]')) { CU.limit += PAGE; cuList(); var m = $('[data-cu-more]'); if (m) m.focus({ preventScroll: true }); return; }
      if (t.closest('[data-cu-export]')) { cuExport(); return; }
    }
    if (v === 'members') {
      if ((n = t.closest('[data-me-f]'))) { ME.f = n.getAttribute('data-me-f'); ME.limit = PAGE; meRender(); var b2 = $('[data-me-f="' + ME.f + '"]'); if (b2) b2.focus(); return; }
      if (t.closest('[data-me-more]')) { ME.limit += PAGE; meRender(); var m2 = $('[data-me-more]'); if (m2) m2.focus({ preventScroll: true }); return; }
      if ((n = t.closest('[data-me-copy]'))) {
        var id = n.closest('[data-me-id]').getAttribute('data-me-id'), r = members().filter(function (x) { return x.id === id; })[0];
        if (r) A.copyText(remindText(r)).then(function (ok) { A.toast(ok ? 'Đã chép tin nhắc — bấm “Zalo”, rồi dán vào khung chat.' : 'Trình duyệt không cho chép: ' + remindText(r), ok ? 'ok' : 'info'); });
        return;
      }
    }
    if (v === 'users') {
      if (t.closest('[data-us-copy]') && US.created) { copyCreds(US.created.user, US.created.pw); return; }
      if (t.closest('[data-us-done]')) { US.created = null; usRender(); return; }
      if ((n = t.closest('[data-us-reset]'))) {
        var u = usById(n.closest('[data-us-id]').getAttribute('data-us-id')); if (!u) return;
        A.confirmDialog({ title: 'Cấp lại mật khẩu cho ' + u.email + '?', body: 'Mật khẩu cũ hết hiệu lực ngay, máy đang đăng nhập bằng tài khoản này bị đăng xuất. Bạn sẽ nhận một mật khẩu tạm để gửi cho người dùng.', ok: 'Cấp mật khẩu mới', cancel: 'Quay lại' })
          .then(function (yes) {
            if (!yes) return;
            A.api('/users/' + encodeURIComponent(u.id) + '/reset-password', { method: 'POST' }).then(function (r) {
              US.created = { user: r.user, pw: r.tempPassword };
              US.list = US.list.map(function (x) { return x.id === r.user.id ? r.user : x; });
              usRender(); window.scrollTo(0, 0); A.toast('Đã cấp mật khẩu tạm mới cho ' + u.email);
            }, A.apiFail);
          });
        return;
      }
      if ((n = t.closest('[data-us-del]'))) {
        var du = usById(n.closest('[data-us-id]').getAttribute('data-us-id')); if (!du) return;
        A.confirmDialog({ title: 'Xóa tài khoản ' + du.email + '?', body: 'Người này sẽ không đăng nhập được nữa. Đơn hàng, đăng ký họ đã xử lý vẫn giữ nguyên. Không hoàn tác được.', ok: 'Xóa tài khoản', cancel: 'Quay lại' })
          .then(function (yes) {
            if (!yes) return;
            A.api('/users/' + encodeURIComponent(du.id), { method: 'DELETE' }).then(function () {
              US.list = US.list.filter(function (x) { return x.id !== du.id; }); usRender(); A.toast('Đã xóa tài khoản ' + du.email);
            }, A.apiFail);
          });
        return;
      }
    }
    if (v === 'backup') {
      if ((n = t.closest('[data-bk-download]'))) { bkDownload(n); return; }
      if ((n = t.closest('[data-bk-restore]'))) { bkRestore(n); return; }
      if (t.closest('[data-bk-clear]')) { BK.bundle = null; BK.err = ''; bkRender(); var fi = $('[data-bk-file]'); if (fi) fi.click(); return; }
    }
  });
  document.addEventListener('input', function (e) {
    var t = e.target; if (!(t instanceof Element)) return;
    if (t.matches('[data-cu-q]') && on('customers')) { CU.q = t.value; CU.limit = PAGE; keepSearch('data-cu-q', function () { cuList(); }); }
    else if (t.matches('[data-me-q]') && on('members')) { ME.q = t.value; ME.limit = PAGE; keepSearch('data-me-q', meRender); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!(t instanceof Element)) return;
    if (t.matches('[data-bk-file]')) { bkFile(t); return; }
    if (t.matches('[data-bk-ack]')) { var b = $('[data-bk-restore]'); if (b) b.disabled = !t.checked; return; }
    if (t.matches('[data-us-role]')) {
      var u = usById(t.closest('[data-us-id]').getAttribute('data-us-id')), want = t.value; if (!u) return;
      A.confirmDialog({ title: 'Đổi quyền của ' + u.email + '?', body: want === 'admin' ? 'Thành Quản trị (admin): toàn quyền, kể cả thiết lập, tài khoản, sao lưu và xóa dữ liệu.' : 'Thành Nhân viên: chỉ xử lý đơn hàng, đăng ký, khách hàng, sản phẩm; không vào thiết lập, không xóa dữ liệu.', ok: 'Đổi quyền', cancel: 'Quay lại' })
        .then(function (yes) {
          if (!yes) { t.value = u.role; return; }
          A.api('/users/' + encodeURIComponent(u.id), { method: 'PUT', body: { role: want } }).then(function (nu) {
            US.list = US.list.map(function (x) { return x.id === nu.id ? nu : x; }); usRender(); A.toast('Đã đổi quyền ' + nu.email + ' thành ' + (A.ROLE_LABEL[nu.role] || nu.role));
          }, function (er) { t.value = u.role; A.apiFail(er); });
        });
    }
  });
  document.addEventListener('submit', function (e) {
    if (e.target instanceof Element && e.target.id === 'userAdd') { e.preventDefault(); usAdd(e.target); }
  });

  // ═══ Đăng ký màn hình ══════════════════════════════════════════════════════
  A.register('customers', {
    title: 'Khách hàng',
    mount: function (main, sub) { cuMount(main, sub); },
    route: function (main, sub) { cuRender(sub); window.scrollTo(0, 0); },
    // dữ liệu đơn hàng / đăng ký đã được admin.js tải lại; đang ở danh sách thì chỉ vẽ lại bảng (giữ ô tìm kiếm đang gõ)
    update: function () { if (!CU.sub && $('[data-cu-list]') && loaded()) { cuList(); var c = $('[data-count]'); if (c) c.textContent = String(customers().length); } else cuRender(); },
    reset: function () { CU.q = ''; CU.f = 'all'; CU.limit = PAGE; CU.sub = ''; },
  });
  A.register('members', {
    title: 'Hội viên',
    mount: function (main) { meMount(main); },
    update: function () { meRender(); },
    reset: function () { ME.q = ''; ME.f = 'active'; ME.limit = PAGE; },
  });
  A.register('users', {
    title: 'Tài khoản & phân quyền',
    mount: function (main) { usMount(main); },
    update: function (main, manual) { if (manual) { A.refreshData(); usLoad(); } },
    reset: function () { US.list = null; US.err = ''; US.created = null; },
  });
  A.register('backup', {
    title: 'Sao lưu dữ liệu',
    mount: function (main) { bkMount(main); },
    reset: function () { BK.bundle = null; BK.err = ''; BK.result = null; },
  });

  // thẻ "Hội viên" trên Tổng quan (cả nhân viên)
  A.addDashboard(function () {
    if (!Array.isArray(A.data('registrations'))) return '';
    var m = members(); if (!m.length) return '';
    var soon = m.filter(function (r) { return A.member.state(r) === 'soon'; }).length, exp = m.filter(function (r) { return A.member.state(r) === 'expired'; }).length;
    return '<section class="panel cf-dash"><header class="panel__head"><h2 class="panel__title">Hội viên</h2><a class="link-more" href="#/members">Mở →</a></header>' +
      '<a class="cf-dash__row' + (soon ? ' is-alert' : '') + '" href="#/members" data-me-dash="soon"><span class="cf-dash__n">' + esc(soon) + '</span>' +
        '<span class="cf-dash__t"><strong>sắp hết hạn (≤ 7 ngày)</strong><small>Nhắn Zalo nhắc học viên gia hạn.</small></span></a>' +
      '<p class="cf-dash__meta">' + esc(m.length - exp) + ' đang tập · ' + esc(exp) + ' đã hết hạn</p></section>';
  }, { staff: true });
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null;
    if (t && t.closest('[data-me-dash]')) { ME.f = 'soon'; ME.limit = PAGE; }
  });
})();
