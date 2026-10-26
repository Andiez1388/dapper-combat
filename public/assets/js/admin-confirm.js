/* Dapper Combat — Quản trị: Xác nhận & nhật ký gửi tin (#/confirmations, #/confirmations/log)
   Ai đã / chưa nhận xác nhận (email xác nhận, phiếu xác nhận khách tự tải) + nhật ký mọi tin Telegram / email đã gửi.
   Dữ liệu đơn hàng / đăng ký lấy từ admin.js (A.data); nhật ký lấy từ /api/maillog. Mọi giá trị qua esc(). */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A || !A.conf) return;
  var esc = A.esc, CF = A.conf, VIEW = 'confirmations';
  var KIND = { orders: 'Đơn hàng', registrations: 'Đăng ký khóa học' };
  var LOG_KIND = { order: 'Đơn hàng', registration: 'Đăng ký khóa học', consult: 'Tư vấn', test: 'Gửi thử' };
  var AUD = { owner: 'Chủ shop', customer: 'Khách' };
  var CHANNEL = { telegram: 'Telegram', email: 'Email' };
  var FILTERS = [['all', 'Tất cả'], ['missing', 'Chưa nhận xác nhận'], ['failed', 'Email lỗi'], ['downloaded', 'Đã tải phiếu']];
  var T = { tab: '', filter: 'all', q: '', log: null, logErr: '', logLoading: null, onlyErr: false };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function on() { return A.view() === VIEW; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function when(ms) { var d = new Date(Number(ms)); return ms && !isNaN(d) ? pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() : '—'; }
  function sameDay(ms) { var d = new Date(Number(ms)), n = new Date(); return !!ms && d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); }

  // ── dữ liệu ──
  function records() {
    var out = [];
    ['orders', 'registrations'].forEach(function (k) {
      (A.data(k) || []).forEach(function (x) { if (x && x.id) out.push({ kind: k, x: x }); });
    });
    return out.sort(function (a, b) { return (b.x.createdAt || 0) - (a.x.createdAt || 0); });
  }
  function loaded() { return Array.isArray(A.data('orders')) && Array.isArray(A.data('registrations')); }
  function test(f, r) {
    var x = r.x, s = CF.slip(x);
    if (f === 'missing') return CF.missing(x);
    if (f === 'failed') return CF.email(x).status === 'failed';
    if (f === 'downloaded') return (Number(s.downloads) || 0) > 0;
    return true;
  }
  function stats(list) {
    return {
      missing: list.filter(function (r) { return CF.missing(r.x); }).length,
      sentToday: list.filter(function (r) { var e = CF.email(r.x); return e.status === 'sent' && sameDay(e.at); }).length,
      failed: list.filter(function (r) { return CF.email(r.x).status === 'failed'; }).length,
      downloaded: list.filter(function (r) { return (Number(CF.slip(r.x).downloads) || 0) > 0; }).length,
    };
  }
  function loadLog(force) {
    if (T.logLoading) return T.logLoading;
    if (T.log && !force) return Promise.resolve(T.log);
    T.logLoading = A.api('/maillog').then(function (l) { T.log = Array.isArray(l) ? l : []; T.logErr = ''; }, function (e) { T.logErr = (e && e.message) || 'Không tải được nhật ký'; })
      .then(function () { T.logLoading = null; return T.log; });
    return T.logLoading;
  }

  // ── khung ──
  function mount(main, sub) {
    main.innerHTML = A.pageHead('Xác nhận & nhật ký gửi tin', { eyebrow: 'Vận hành', stamp: false, count: false }) +
      '<div class="cms-help"><p>Khách <strong>có email</strong> → nhận email xác nhận (nếu đã bật mẫu email và cài SMTP ở <a href="#/set-notify">Thiết lập → Thông báo</a>). ' +
        'Khách <strong>chỉ để số điện thoại</strong> → tự tải phiếu xác nhận ở màn hình đặt hàng / đăng ký thành công. Màn này cho biết ai đã / chưa nhận xác nhận để bạn biết cần gọi ai. Đổi trạng thái đơn khỏi “Mới” (vd đã gọi xác nhận) thì đơn tự rời danh sách “Chưa nhận xác nhận”.</p></div>' +
      '<div data-cf-root></div>';
    route(main, sub);
  }
  function route(main, sub) {
    T.tab = sub === 'log' ? 'log' : '';
    render();
    if (T.tab === 'log') loadLog(true).then(function () { if (on()) render(); });
    else if (!T.log) loadLog().then(function () { if (on()) render(); });
  }
  function render() {
    var root = $('[data-cf-root]'); if (!root) return;
    var list = records(), st = stats(list), ok = loaded();
    var tile = function (key, label, val, sub, href) {
      return '<a class="stat cf-stat' + (key === 'missing' && val ? ' is-alert' : '') + '" href="' + href + '" data-cf-goto="' + key + '">' +
        '<span class="stat__label">' + esc(label) + '</span><span class="stat__value">' + (ok ? esc(val) : '…') + '</span><span class="stat__sub">' + esc(sub) + '</span></a>';
    };
    root.innerHTML = '<div class="stats cf-stats">' +
        tile('missing', 'Chưa nhận xác nhận', st.missing, 'Đơn còn “Mới”, email chưa gửi được và khách chưa mở phiếu — nên gọi', '#/confirmations') +
        tile('sentToday', 'Email đã gửi hôm nay', st.sentToday, 'Email xác nhận gửi thành công', '#/confirmations') +
        tile('failed', 'Email lỗi', st.failed, 'Gửi không thành công — xem nhật ký', '#/confirmations') +
        tile('downloaded', 'Phiếu đã tải', st.downloaded, 'Khách đã tải phiếu về máy', '#/confirmations') +
      '</div>' +
      '<div class="cf-tabs" role="tablist">' +
        '<a role="tab" class="cf-tab' + (T.tab ? '' : ' is-active') + '" href="#/confirmations" aria-selected="' + !T.tab + '">Xác nhận khách</a>' +
        '<a role="tab" class="cf-tab' + (T.tab ? ' is-active' : '') + '" href="#/confirmations/log" aria-selected="' + !!T.tab + '">Nhật ký gửi tin' + (T.log ? ' <small>' + esc(T.log.length) + '</small>' : '') + '</a>' +
      '</div><div data-cf-body></div>';
    if (T.tab === 'log') renderLog(); else renderConf(list);
  }

  // ── tab Xác nhận khách ──
  function renderConf(list) {
    var box = $('[data-cf-body]'); if (!box) return;
    if (!loaded()) { box.innerHTML = A.dataError('orders') || A.dataError('registrations') ? A.errorHtml(A.dataError('orders') || A.dataError('registrations')) : A.loadingHtml(); return; }
    var rows = list.filter(function (r) { return test(T.filter, r) && A.matches(T.q, [r.x.code, CF.phoneOf(r.kind, r.x), r.kind === 'orders' ? ((r.x.customer || {}).name) : r.x.name]); });
    box.innerHTML = '<div class="toolbar"><div class="chips" role="group" aria-label="Lọc">' + FILTERS.map(function (f) {
        var n = list.filter(function (r) { return test(f[0], r); }).length, act = T.filter === f[0];
        return '<button type="button" class="chip' + (act ? ' is-active' : '') + (f[0] === 'missing' && n ? ' chip--alert' : '') + '" data-cf-filter="' + f[0] + '" aria-pressed="' + act + '"><span>' + esc(f[1]) + '</span><span class="chip__n">' + esc(n) + '</span></button>';
      }).join('') + '</div>' +
      '<label class="search">' + A.ICON.search + '<span class="sr">Tìm</span><input type="search" data-cf-q placeholder="Tìm mã, tên, số điện thoại…" value="' + esc(T.q) + '" autocomplete="off"></label></div>' +
      (!list.length ? A.emptyHtml('Chưa có đơn hàng hay đăng ký nào', 'Khi khách đặt hàng hoặc đăng ký khóa học, trạng thái xác nhận sẽ hiện ở đây.')
        : !rows.length ? A.emptyHtml(T.filter === 'missing' ? 'Khách nào cũng đã nhận xác nhận' : 'Không có mục phù hợp', 'Thử chọn “Tất cả” hoặc đổi từ khóa.')
        : '<div class="table-wrap"><table class="tbl tbl--cf"><thead><tr><th scope="col" class="c-code">Mã</th><th scope="col" class="c-kind">Loại</th><th scope="col" class="c-name">Khách</th><th scope="col" class="c-phone">SĐT</th>' +
          '<th scope="col" class="c-mail">Email xác nhận</th><th scope="col" class="c-slip">Phiếu</th><th scope="col" class="c-date">Thời gian</th><th scope="col" class="c-act"><span class="sr">Thao tác</span></th></tr></thead><tbody>' +
          rows.map(rowHtml).join('') + '</tbody></table></div>' +
          '<p class="results-meta">Hiển thị ' + rows.length + ' / ' + list.length + '</p>');
  }
  function rowHtml(r) {
    var x = r.x, name = r.kind === 'orders' ? (x.customer || {}).name : x.name, mail = CF.emailOf(r.kind, x), url = CF.url(x);
    return '<tr class="' + (CF.missing(x) ? 'is-new' : '') + '" data-cf-row="' + esc(r.kind + ':' + x.id) + '">' +
      '<td class="c-code" data-label="Mã"><a class="code" href="' + esc(A.idHref(r.kind, x.id)) + '">' + esc(x.code || x.id) + '</a></td>' +
      '<td class="c-kind" data-label="Loại">' + esc(KIND[r.kind]) + '</td>' +
      '<td class="c-name" data-label="Khách">' + esc(name || '—') + '</td>' +
      '<td class="c-phone" data-label="SĐT">' + esc(CF.phoneOf(r.kind, x) || '—') + '</td>' +
      '<td class="c-mail" data-label="Email xác nhận">' + CF.emailHtml(x, false) + (CF.email(x).status === 'failed' && CF.email(x).error ? '<small class="cf-err">' + esc(String(CF.email(x).error).replace(/^lỗi:\s*/i, '')) + '</small>' : '') + '</td>' +
      '<td class="c-slip" data-label="Phiếu">' + esc(CF.slipText(x)) + '</td>' +
      '<td class="c-date" data-label="Thời gian">' + esc(when(x.createdAt)) + '</td>' +
      '<td class="c-act" data-label="Thao tác"><span class="cf-act">' +
        '<button class="btn btn--line btn--sm" type="button" data-cf-copy' + (url ? '' : ' disabled title="Đơn cũ — chưa có phiếu"') + '>Chép link phiếu</button>' +
        '<button class="btn btn--quiet btn--sm" type="button" data-cf-resend' + (mail ? '' : ' disabled title="Khách không nhập email"') + '>Gửi lại email</button>' +
      '</span></td></tr>';
  }

  // ── tab Nhật ký gửi tin ──
  function refLink(ref) {
    var code = String(ref || ''); if (!code) return '<span class="muted">—</span>';
    var hit = null;
    [['orders'], ['registrations'], ['consults']].forEach(function (k) { (A.data(k[0]) || []).forEach(function (x) { if (!hit && x && x.code === code) hit = { kind: k[0], id: x.id }; }); });
    return hit ? '<a class="code" href="' + esc(A.idHref(hit.kind, hit.id)) + '">' + esc(code) + '</a>' : '<span class="code">' + esc(code) + '</span>';
  }
  function renderLog() {
    var box = $('[data-cf-body]'); if (!box) return;
    if (!T.log) { box.innerHTML = T.logErr ? A.errorHtml(T.logErr) : A.loadingHtml(); return; }
    var all = T.log, rows = T.onlyErr ? all.filter(function (e) { return e && e.status !== 'ok'; }) : all;
    var errN = all.filter(function (e) { return e && e.status !== 'ok'; }).length;
    box.innerHTML = '<div class="toolbar cf-logbar"><div class="chips" role="group" aria-label="Lọc nhật ký">' +
        '<button type="button" class="chip' + (T.onlyErr ? '' : ' is-active') + '" data-cf-err="0" aria-pressed="' + !T.onlyErr + '"><span>Tất cả</span><span class="chip__n">' + esc(all.length) + '</span></button>' +
        '<button type="button" class="chip' + (T.onlyErr ? ' is-active' : '') + (errN ? ' chip--alert' : '') + '" data-cf-err="1" aria-pressed="' + T.onlyErr + '"><span>Chỉ xem lỗi</span><span class="chip__n">' + esc(errN) + '</span></button></div>' +
        '<span class="spacer"></span>' + (A.isAdmin && !A.isAdmin() ? '' : '<button class="btn btn--quiet btn--sm" type="button" data-cf-clear' + (all.length ? '' : ' disabled') + '>Xóa nhật ký</button>') + '</div>' +
      '<p class="set-note cf-lognote">Ghi lại 500 lần gửi gần nhất: tin báo chủ shop (Telegram / email), email xác nhận cho khách và tin gửi thử.</p>' +
      (!rows.length ? A.emptyHtml(all.length ? 'Không có lần gửi nào bị lỗi' : 'Chưa gửi tin nào', all.length ? '' : 'Khi máy chủ gửi Telegram / email, mỗi lần gửi sẽ được ghi ở đây.')
        : '<div class="table-wrap"><table class="tbl tbl--log"><thead><tr><th scope="col" class="c-date">Thời gian</th><th scope="col" class="c-kind">Loại</th><th scope="col" class="c-aud">Gửi cho</th><th scope="col" class="c-ch">Kênh</th>' +
          '<th scope="col" class="c-to">Tới</th><th scope="col" class="c-subj">Tiêu đề</th><th scope="col" class="c-status">Trạng thái</th><th scope="col" class="c-ref">Mã liên quan</th></tr></thead><tbody>' +
          rows.map(function (e) {
            var ok = e.status === 'ok';
            return '<tr class="' + (ok ? '' : 'is-err') + '"><td class="c-date" data-label="Thời gian">' + esc(when(e.at)) + '</td>' +
              '<td class="c-kind" data-label="Loại">' + esc(LOG_KIND[e.kind] || e.kind || '—') + '</td>' +
              '<td class="c-aud" data-label="Gửi cho">' + esc(AUD[e.audience] || e.audience || '—') + '</td>' +
              '<td class="c-ch" data-label="Kênh">' + esc(CHANNEL[e.channel] || e.channel || '—') + '</td>' +
              '<td class="c-to" data-label="Tới">' + esc(e.to || '—') + '</td>' +
              '<td class="c-subj" data-label="Tiêu đề">' + esc(e.subject || '—') + '</td>' +
              '<td class="c-status" data-label="Trạng thái">' + (ok ? '<span class="cf cf--ok">Thành công</span>' : '<span class="cf cf--err">Lỗi</span>' + (e.error ? '<small class="cf-err">' + esc(String(e.error).replace(/^lỗi:\s*/i, '')) + '</small>' : '')) + '</td>' +
              '<td class="c-ref" data-label="Mã liên quan">' + refLink(e.ref) + '</td></tr>';
          }).join('') + '</tbody></table></div>');
  }

  // ── sự kiện ──
  function rowOf(n) { var row = n.closest('[data-cf-row]'); if (!row) return null; var p = row.getAttribute('data-cf-row').split(':'); var x = (A.data(p[0]) || []).filter(function (y) { return y.id === p[1]; })[0]; return x ? { kind: p[0], x: x } : null; }
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null; if (!t || !on()) return;
    var n, r;
    if ((n = t.closest('[data-cf-goto]'))) {
      var key = n.getAttribute('data-cf-goto');
      T.filter = key === 'missing' ? 'missing' : key === 'failed' ? 'failed' : key === 'downloaded' ? 'downloaded' : 'all';
      if (location.hash === '#/confirmations') { e.preventDefault(); render(); }
      return;
    }
    if ((n = t.closest('[data-cf-filter]'))) { T.filter = n.getAttribute('data-cf-filter'); render(); var b = $('[data-cf-filter="' + T.filter + '"]'); if (b) b.focus(); return; }
    if ((n = t.closest('[data-cf-err]'))) { T.onlyErr = n.getAttribute('data-cf-err') === '1'; renderLog(); var b2 = $('[data-cf-err="' + (T.onlyErr ? 1 : 0) + '"]'); if (b2) b2.focus(); return; }
    if ((n = t.closest('[data-cf-copy]')) && (r = rowOf(n))) { CF.copy(r.x); return; }
    if ((n = t.closest('[data-cf-resend]')) && (r = rowOf(n))) {
      var id = r.x.id, kind = r.kind;
      A.setBusy(n, true);
      CF.resend(kind, id).then(function () {
        var x = (A.data(kind) || []).filter(function (y) { return y.id === id; })[0];
        A.toast('Đã gửi email xác nhận' + (x && CF.email(x).to ? ' tới ' + CF.email(x).to : '') + '.');
      }, function (er) { if (er && er.status !== 401 && er.status !== 403) A.toast(er.message, 'err'); })
        .then(function () { T.log = null; return loadLog(true); }).then(function () { if (on()) render(); });
      return;
    }
    if ((n = t.closest('[data-cf-clear]'))) {
      A.confirmDialog({ title: 'Xóa toàn bộ nhật ký gửi tin?', body: 'Chỉ xóa nhật ký — đơn hàng, đăng ký và trạng thái xác nhận của khách vẫn giữ nguyên. Không hoàn tác được.', ok: 'Xóa nhật ký', cancel: 'Quay lại' })
        .then(function (yes) {
          if (!yes) return;
          A.api('/maillog', { method: 'DELETE' }).then(function () { T.log = []; renderLog(); A.toast('Đã xóa nhật ký gửi tin.'); }, A.apiFail);
        });
    }
  });
  var qTimer = 0;
  document.addEventListener('input', function (e) {
    var t = e.target; if (!(t instanceof Element) || !on() || !t.matches('[data-cf-q]')) return;
    clearTimeout(qTimer);
    qTimer = setTimeout(function () {
      T.q = t.value; render();
      var q = $('[data-cf-q]'); if (q) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (er) { /* bỏ qua */ } }
    }, 200);
  });

  A.register(VIEW, {
    title: 'Xác nhận & nhật ký gửi tin',
    mount: mount,
    route: route,
    update: function (main, manual) {
      if (manual) { A.refreshData(); loadLog(true).then(function () { if (on()) render(); }); return; }
      render();
    },
    reset: function () { T.log = null; T.logErr = ''; T.filter = 'all'; T.q = ''; T.onlyErr = false; },
  });

  // thẻ nhỏ trên Tổng quan
  A.addDashboard(function () {
    var ok = loaded(), list = ok ? records() : [], st = stats(list);
    return '<section class="panel cf-dash"><header class="panel__head"><h2 class="panel__title">Xác nhận khách</h2><a class="link-more" href="#/confirmations">Mở →</a></header>' +
      '<a class="cf-dash__row' + (st.missing ? ' is-alert' : '') + '" href="#/confirmations" data-cf-dash="missing"><span class="cf-dash__n">' + (ok ? esc(st.missing) : '…') + '</span>' +
        '<span class="cf-dash__t"><strong>chưa nhận xác nhận</strong><small>Đơn còn “Mới”, email chưa gửi được và khách chưa mở phiếu — nên gọi xác nhận.</small></span></a>' +
      '<p class="cf-dash__meta">' + (ok ? esc(st.sentToday) + ' email đã gửi hôm nay · ' + esc(st.failed) + ' email lỗi · ' + esc(st.downloaded) + ' phiếu đã tải' : 'Đang tải…') + '</p></section>';
  }, { staff: true });
  // bấm thẻ Tổng quan → mở sẵn bộ lọc “Chưa nhận xác nhận”
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null;
    if (t && t.closest('[data-cf-dash]')) T.filter = 'missing';
  });
})();
