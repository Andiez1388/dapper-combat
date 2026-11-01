/* Dapper Combat — Quản trị: Chuẩn bị chạy thật
   Danh sách việc cần xong trước khi mở website cho khách. Máy chủ tự kiểm tra từng mục (GET /api/admin/launch):
   hotline, thông tin doanh nghiệp, trang chính sách, dữ liệu mẫu, dung lượng ảnh / video, tài khoản ngân hàng, báo đơn, tài khoản admin,
   tên miền, HTTPS, thư mục dữ liệu trên hosting, sao lưu… Mỗi mục có nút tới đúng chỗ sửa.
   Google Search Console và định nghĩa "tiêu chuẩn" không tự kiểm tra được → chủ shop tự đánh dấu (PUT /api/admin/launch). */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A) return;
  var esc = A.esc, $ = function (s, r) { return (r || document).querySelector(s); };
  var VIEW = 'launch', STALE_MS = 60000;
  var S = { d: null, err: '', loading: false, at: 0, triedAt: 0, busy: '' };
  var MARK = { done: '✓', todo: '!', optional: '–' };
  var BADGE = { done: '<span class="badge badge--done">Xong</span>', todo: '<span class="badge badge--new">Cần làm</span>', optional: '<span class="badge badge--off">Không bắt buộc</span>' };

  function load() {
    S.loading = true; S.triedAt = Date.now();
    return A.api('/admin/launch').then(function (d) {
      S.d = d; S.err = ''; S.at = Date.now(); S.loading = false;
      render(); A.rerender();
    }, function (e) { S.loading = false; S.err = (e && e.message) || 'Không tải được'; render(); });
  }
  function counts() {
    var it = S.d ? S.d.items : [], req = it.filter(function (x) { return x.status !== 'optional'; });
    return { req: req.length, done: req.filter(function (x) { return x.status === 'done'; }).length, todo: req.filter(function (x) { return x.status === 'todo'; }) };
  }
  function barHtml(c) { return '<div class="lc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + c.req + '" aria-valuenow="' + c.done + '"><span style="width:' + (c.req ? Math.round(c.done / c.req * 100) : 0) + '%"></span></div>'; }

  function itemHtml(it) {
    var ext = /^https?:/.test(it.href);
    return '<li class="lc-item lc-item--' + esc(it.status) + '" data-lc-id="' + esc(it.id) + '">' +
      '<span class="lc-mark" aria-hidden="true">' + MARK[it.status] + '</span>' +
      '<div class="lc-main"><p class="lc-title">' + esc(it.title) + ' ' + (BADGE[it.status] || '') + '</p>' +
        '<p class="lc-detail">' + esc(it.detail) + '</p>' +
        (it.manual && it.doneAt ? '<p class="lc-meta">Đánh dấu lúc ' + esc(A.fmtTime(it.doneAt)) + (it.doneBy ? ' · ' + esc(it.doneBy) : '') + '</p>' : '') +
      '</div>' +
      '<div class="lc-act">' +
        (it.href ? '<a class="btn btn--line btn--sm" href="' + esc(it.href) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + (ext ? 'Mở trang ↗' : 'Sửa ngay') + '</a>' : '') +
        (it.manual ? '<label class="check lc-check"><input type="checkbox" data-lc-done="' + esc(it.id) + '"' + (it.status === 'done' ? ' checked' : '') + (S.busy ? ' disabled' : '') + '>' +
          '<span class="switch__ui" aria-hidden="true"></span><span>Đã làm xong</span></label>' : '') +
      '</div></li>';
  }
  function render() {
    var root = $('[data-lc-root]'); if (!root) return;
    if (S.err && !S.d) { root.innerHTML = A.errorHtml(S.err); return; }
    if (!S.d) { root.innerHTML = A.loadingHtml ? A.loadingHtml() : '<p class="muted">Đang kiểm tra…</p>'; return; }
    var c = counts(), groups = [], by = {};
    S.d.items.forEach(function (it) { if (!by[it.group]) { by[it.group] = []; groups.push(it.group); } by[it.group].push(it); });
    root.innerHTML =
      '<div class="cms-help"><p><strong>Những việc cần xong trước khi mở website cho khách.</strong> Hệ thống tự kiểm tra lại mỗi lần mở màn hình này — sửa xong một mục, quay lại là thấy đổi thành “Xong”. ' +
        'Mục “Hosting & tên miền” làm khi đã mua hosting và tên miền' + (S.d.production ? '' : ' (đang chạy thử trên máy nên các mục này chưa xong là bình thường)') + '.</p></div>' +
      '<section class="panel lc-sum"><div class="lc-sum__row"><p class="lc-sum__n"><strong>' + c.done + ' / ' + c.req + '</strong> việc bắt buộc đã xong</p>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-lc-reload' + (S.loading ? ' disabled' : '') + '>' + (S.loading ? 'Đang kiểm tra…' : 'Kiểm tra lại') + '</button></div>' +
        barHtml(c) + (c.done >= c.req ? '<p class="lc-sum__ok">Đã sẵn sàng chạy thật.</p>' : '') + '</section>' +
      groups.map(function (g) {
        var list = by[g], left = list.filter(function (x) { return x.status === 'todo'; }).length;
        return '<section class="panel lc-group"><header class="panel__head"><h2 class="panel__title">' + esc(g) + '</h2>' +
          '<span class="cms-sec__meta">' + (left ? left + ' việc cần làm' : 'Đã xong') + '</span></header>' +
          '<ul class="lc-list">' + list.map(itemHtml).join('') + '</ul></section>';
      }).join('');
  }
  function mark(id, done) {
    S.busy = id; render();
    A.api('/admin/launch', { method: 'PUT', body: { id: id, done: done } }).then(function (d) {
      S.busy = ''; S.d = d; S.at = Date.now(); render();
      A.toast(done ? 'Đã đánh dấu xong' : 'Đã bỏ đánh dấu');
    }, function (e) { S.busy = ''; render(); A.apiFail(e); });
  }

  document.addEventListener('click', function (e) {
    if (A.view() !== VIEW) return;
    var t = e.target instanceof Element ? e.target : null;
    if (t && t.closest('[data-lc-reload]')) load();
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (A.view() !== VIEW || !(t instanceof Element) || !t.matches('[data-lc-done]')) return;
    mark(t.getAttribute('data-lc-done'), t.checked);
  });

  // thẻ ở Tổng quan (chỉ admin): còn việc chưa xong thì nhắc, xong hết thì ẩn
  A.addDashboard(function () {
    if (!S.loading && Date.now() - Math.max(S.at, S.triedAt) > STALE_MS) load();
    if (!S.d) return '';
    var c = counts();
    if (c.done >= c.req) return '';
    return '<section class="panel lc-dash"><header class="panel__head"><h2 class="panel__title">Chuẩn bị chạy thật</h2>' +
      '<a class="link-more" href="#/launch">Xem danh sách →</a></header>' +
      '<div class="lc-dash__body"><p><strong>' + c.done + ' / ' + c.req + '</strong> việc bắt buộc đã xong. Còn: ' +
        esc(c.todo.slice(0, 3).map(function (x) { return x.title; }).join(' · ')) + (c.todo.length > 3 ? ' và ' + (c.todo.length - 3) + ' việc khác' : '') + '.</p>' +
      barHtml(c) + '</div></section>';
  });

  A.register(VIEW, {
    title: 'Chuẩn bị chạy thật',
    mount: function (main) {
      main.innerHTML = A.pageHead('Chuẩn bị chạy thật', { eyebrow: 'Thiết lập', stamp: false, count: false, refresh: false }) + '<div data-lc-root></div>';
      render(); load();
    },
  });
})();
