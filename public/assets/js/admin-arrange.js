/* Dapper Combat — Quản trị: Sắp xếp & sửa nhanh sản phẩm (#/arrange)
   Một bảng cho cả cửa hàng: thứ tự hiển thị (▲▼, theo từng danh mục), giá, giá gốc, tồn kho, ẩn / hiện,
   và chọn sản phẩm lên Trang chủ (Equipment 4 ô · Boxing Fashion 6 ô).
   Lưu: PUT /api/products/:id cho sản phẩm có đổi + PUT /api/settings (shop.homeProducts / shop.homeFashion). */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A) return;
  var esc = A.esc;
  var FASHION = 'ao';                                  // danh mục áo → khối Boxing Fashion ở Trang chủ
  var HOME = { homeProducts: 4, homeFashion: 6 };      // số ô mỗi khối Trang chủ
  var R = { list: null, orig: {}, home: null, homeOrig: '', err: '', busy: false };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function snap(p) { return JSON.stringify([p.pos || 0, p.price, p.old || 0, p.stock, p.visible !== false]); }
  function homeKey(p) { return p.cat === FASHION ? 'homeFashion' : 'homeProducts'; }
  function changed() { return (R.list || []).filter(function (p) { return snap(p) !== R.orig[p.id]; }); }
  function dirty() { return !!R.list && (changed().length > 0 || JSON.stringify(R.home) !== R.homeOrig); }
  function digits(v) { var n = Number(String(v || '').replace(/[^\d]/g, '')); return isFinite(n) ? n : 0; }
  function hasVariants(p) { return p.stockBy && typeof p.stockBy === 'object' && Object.keys(p.stockBy).length > 0; }

  // nhóm theo danh mục (đúng thứ tự ở Danh mục sản phẩm), trong nhóm theo Thứ tự hiển thị
  function groups() {
    var cats = (A.categories ? A.categories() : []).map(function (c) { return c.id; });
    (R.list || []).forEach(function (p) { if (cats.indexOf(p.cat) < 0) cats.push(p.cat); });
    return cats.map(function (c) {
      var items = R.list.filter(function (p) { return p.cat === c; });
      return { cat: c, items: items };
    }).filter(function (g) { return g.items.length; });
  }
  function sortList() {
    R.list = R.list.map(function (p, i) { return [p, i]; })
      .sort(function (a, b) { return ((Number(a[0].pos) || 1e4) - (Number(b[0].pos) || 1e4)) || a[1] - b[1]; })
      .map(function (x) { return x[0]; });
  }
  // đánh số lại 1, 2, 3… theo thứ tự nhóm → "Tất cả" trên Shop hiện đúng thứ tự này
  function renumber() {
    var n = 1, out = [];
    groups().forEach(function (g) { g.items.forEach(function (p) { p.pos = n++; out.push(p); }); });
    R.list = out;
  }

  function load(main) {
    R.err = ''; R.list = null; view(main);
    Promise.all([A.api('/admin/products'), A.api('/settings')]).then(function (r) {
      R.list = (Array.isArray(r[0]) ? r[0] : []).map(function (p) {
        return { id: p.id, name: p.name, img: p.img, cat: p.cat, price: Number(p.price) || 0, old: Number(p.old) || 0,
          stock: Number(p.stock) || 0, stockBy: p.stockBy, visible: p.visible !== false, pos: p.pos || 0, custom: p.custom && p.custom.on };
      });
      sortList();
      R.orig = {}; R.list.forEach(function (p) { R.orig[p.id] = snap(p); });
      var shop = (r[1] && r[1].shop) || {};
      R.home = { homeProducts: (shop.homeProducts || []).slice(), homeFashion: (shop.homeFashion || []).slice() };
      R.homeOrig = JSON.stringify(R.home);
      view(main);
    }, function (e) { R.err = (e && e.message) || 'Không tải được danh sách sản phẩm.'; view(main); });
  }

  function row(p, i, n) {
    var hk = homeKey(p), on = R.home[hk].indexOf(p.id) >= 0;
    var stock = hasVariants(p)
      ? '<a class="ar-var" href="' + esc(A.idHref('products', p.id)) + '" title="Sản phẩm này đếm tồn kho theo từng size / màu">' + esc(p.stock) + ' · theo size/màu →</a>'
      : '<input type="number" min="0" max="1000000" step="1" inputmode="numeric" data-ar="stock" value="' + esc(p.stock) + '" aria-label="Tồn kho">';
    return '<tr data-ar-id="' + esc(p.id) + '"' + (p.visible ? '' : ' class="is-off"') + '>' +
      '<td class="ar-move"><button class="icon-btn icon-btn--line" type="button" data-ar-mv="-1" aria-label="Đưa lên"' + (i === 0 ? ' disabled' : '') + '>▲</button>' +
        '<button class="icon-btn icon-btn--line" type="button" data-ar-mv="1" aria-label="Đưa xuống"' + (i === n - 1 ? ' disabled' : '') + '>▼</button></td>' +
      '<td class="ar-n">' + esc(p.pos || '—') + '</td>' +
      '<td class="ar-thumb"><span class="thumb">' + (A.safeImg(p.img) ? '<img src="' + esc(A.safeImg(p.img)) + '" alt="" loading="lazy">' : '') + '</span></td>' +
      '<td class="ar-name"><a class="cell-title" href="' + esc(A.idHref('products', p.id)) + '">' + esc(p.name || p.id) + '</a>' +
        '<span class="cell-sub">' + esc(p.id) + (p.custom ? ' · tự thiết kế' : '') + '</span></td>' +
      '<td><input type="text" inputmode="numeric" data-ar="price" value="' + esc(A.money(p.price).replace(/[^\d.]/g, '')) + '" aria-label="Giá bán"></td>' +
      '<td><input type="text" inputmode="numeric" data-ar="old" value="' + (p.old ? esc(A.money(p.old).replace(/[^\d.]/g, '')) : '') + '" placeholder="—" aria-label="Giá gốc (gạch ngang)"></td>' +
      '<td>' + stock + '</td>' +
      '<td class="ar-c"><label class="switch"><input type="checkbox" data-ar="visible"' + (p.visible ? ' checked' : '') + ' aria-label="Hiện trên Shop"><span class="switch__ui" aria-hidden="true"></span></label></td>' +
      '<td class="ar-c"><label class="ar-home" title="' + (hk === 'homeFashion' ? 'Khối Boxing Fashion' : 'Khối Sản phẩm nổi bật') + '"><input type="checkbox" data-ar="home"' + (on ? ' checked' : '') + '><span>★</span></label></td>' +
      '</tr>';
  }

  function homeLine(k, label) {
    var ids = R.home[k].filter(function (id) { return R.list.some(function (p) { return p.id === id; }); });
    return '<li><strong>' + label + '</strong> · ' + ids.length + ' / ' + HOME[k] + ' ô' +
      (ids.length < HOME[k] ? ' <span class="cell-sub">(ô trống tự lấy sản phẩm đang bán theo thứ tự)</span>' : '') + '</li>';
  }

  function view(main) {
    var n = R.list ? changed().length + (JSON.stringify(R.home) !== R.homeOrig ? 1 : 0) : 0;
    var html = A.pageHead('Sắp xếp & sửa nhanh', { eyebrow: 'Sản phẩm', count: false, stamp: false, refresh: false,
      actions: '<a class="btn btn--ghost" href="/shop" target="_blank" rel="noopener">Xem Shop</a>' +
        '<button class="btn btn--primary" type="button" data-ar-save' + (n && !R.busy ? '' : ' disabled') + '>' + (R.busy ? 'Đang lưu…' : n ? 'Lưu ' + n + ' thay đổi' : 'Đã lưu') + '</button>' });
    if (!R.list) { main.innerHTML = html + (R.err ? A.errorHtml(R.err) : A.loadingHtml()); return; }
    html += '<section class="panel ar-help"><ul class="ar-tips">' +
      '<li><strong>▲ ▼</strong> đổi thứ tự trong từng danh mục. Shop, mục “Tất cả” và Trang chủ xếp đúng theo thứ tự này (danh mục trên trước).</li>' +
      '<li><strong>Giá gốc</strong> có số lớn hơn giá bán thì Shop hiện giá gạch ngang và nhãn “-x%”. Để trống = không giảm giá.</li>' +
      '<li><strong>★ Trang chủ</strong>: Equipment tối đa ' + HOME.homeProducts + ' ô, áo (Boxing Fashion) tối đa ' + HOME.homeFashion + ' ô.</li>' +
      homeLine('homeProducts', 'Sản phẩm nổi bật') + homeLine('homeFashion', 'Boxing Fashion') + '</ul></section>';
    groups().forEach(function (g) {
      html += '<section class="panel ar-group"><header class="panel__head"><h2 class="panel__title">' + esc(A.catName(g.cat) || g.cat) + ' · ' + g.items.length + '</h2></header>' +
        '<div class="table-wrap"><table class="table ar-table"><thead><tr><th></th><th>#</th><th></th><th>Sản phẩm</th><th>Giá bán (đ)</th><th>Giá gốc (đ)</th><th>Tồn kho</th><th>Hiện</th><th>Trang chủ</th></tr></thead><tbody>' +
        g.items.map(function (p, i) { return row(p, i, g.items.length); }).join('') + '</tbody></table></div></section>';
    });
    main.innerHTML = html;
  }
  function syncSave(main) {
    var b = main.querySelector('[data-ar-save]'); if (!b) return;
    var n = changed().length + (JSON.stringify(R.home) !== R.homeOrig ? 1 : 0);
    b.disabled = !n || R.busy; b.textContent = R.busy ? 'Đang lưu…' : n ? 'Lưu ' + n + ' thay đổi' : 'Đã lưu';
  }
  function byId(id) { return R.list.filter(function (p) { return p.id === id; })[0]; }

  function save(main) {
    var bad = R.list.filter(function (p) { return p.price <= 0; })[0];
    if (bad) { A.toast('Giá bán của “' + bad.name + '” phải lớn hơn 0.', 'err'); return; }
    var list = changed(), homeChanged = JSON.stringify(R.home) !== R.homeOrig;
    R.busy = true; syncSave(main);
    var jobs = list.map(function (p) {
      var o = JSON.parse(R.orig[p.id]), body = {};
      if (o[0] !== (p.pos || 0)) body.pos = p.pos || '';
      if (o[1] !== p.price) body.price = p.price;
      if (o[2] !== (p.old || 0)) body.old = p.old > p.price ? p.old : null;
      if (o[3] !== p.stock && !hasVariants(p)) { body.stock = p.stock; }
      if (o[4] !== p.visible) body.visible = p.visible;
      return function () { return A.api('/products/' + encodeURIComponent(p.id), { method: 'PUT', body: body }); };
    });
    if (homeChanged) jobs.push(function () {
      // thứ tự trên Trang chủ = thứ tự trong bảng
      var ord = function (ids) { return ids.slice().sort(function (a, b) { return (Number((byId(a) || {}).pos) || 1e4) - (Number((byId(b) || {}).pos) || 1e4); }); };
      return A.api('/settings', { method: 'PUT', body: { shop: { homeProducts: ord(R.home.homeProducts), homeFashion: ord(R.home.homeFashion) } } });
    });
    var i = 0, fail = null;
    (function next() {
      if (i >= jobs.length) {
        R.busy = false;
        if (fail) { A.apiFail(fail); load(main); return; }
        A.toast('Đã lưu ' + jobs.length + ' thay đổi.');
        if (A.refreshData) try { A.refreshData('products'); } catch (e) { /* bỏ qua */ }
        load(main); return;
      }
      jobs[i++]().then(next, function (e) { fail = e; i = jobs.length; next(); });
    })();
  }

  function bind(main) {
    if (main.__arBound) return; main.__arBound = true;
    main.addEventListener('click', function (e) {
      if (!R.list || A.view() !== 'arrange') return;
      var t = e.target, b;
      if ((b = t.closest('[data-ar-save]'))) { if (!R.busy) save(main); return; }
      if ((b = t.closest('[data-ar-mv]'))) {
        var id = b.closest('[data-ar-id]').getAttribute('data-ar-id'), p = byId(id), d = +b.getAttribute('data-ar-mv');
        var same = R.list.filter(function (x) { return x.cat === p.cat; }), at = same.indexOf(p), to = at + d;
        if (to < 0 || to >= same.length) return;
        // đổi chỗ trong nhóm rồi đánh số lại toàn bộ
        if (!same.some(function (x) { return x.pos; })) renumber();
        var other = same[to], tmp = p.pos; p.pos = other.pos; other.pos = tmp;
        sortList(); renumber(); view(main);
        var again = main.querySelector('[data-ar-id="' + CSS.escape(id) + '"] [data-ar-mv="' + d + '"]');
        if (again && !again.disabled) again.focus();
      }
    });
    main.addEventListener('change', function (e) {
      if (!R.list || A.view() !== 'arrange') return;
      var t = e.target, k = t.getAttribute('data-ar'); if (!k) return;
      var tr = t.closest('[data-ar-id]'), p = byId(tr.getAttribute('data-ar-id'));
      if (k === 'price' || k === 'old') {
        p[k] = digits(t.value);
        t.value = p[k] ? A.money(p[k]).replace(/[^\d.]/g, '') : '';
      } else if (k === 'stock') {
        p.stock = Math.max(0, Math.min(1e6, Math.round(Number(t.value) || 0))); t.value = p.stock;
      } else if (k === 'visible') {
        p.visible = t.checked; tr.classList.toggle('is-off', !p.visible);
      } else if (k === 'home') {
        var hk = homeKey(p), arr = R.home[hk], at = arr.indexOf(p.id);
        if (t.checked && at < 0) {
          // bỏ id không còn tồn tại trước khi đếm ô
          R.home[hk] = arr = arr.filter(function (x) { return !!byId(x); });
          if (arr.length >= HOME[hk]) { t.checked = false; A.toast('Khối này đủ ' + HOME[hk] + ' ô rồi. Bỏ ★ một sản phẩm khác trước.', 'info'); return; }
          arr.push(p.id);
        } else if (!t.checked && at >= 0) arr.splice(at, 1);
        view(main); return;
      }
      syncSave(main);
    });
  }

  A.register('arrange', {
    title: 'Sắp xếp & sửa nhanh',
    mount: function (main) { bind(main); load(main); },
    update: function (main, manual) { if (manual && !dirty()) load(main); },
    isDirty: dirty,
    dirtyText: function () { return 'Bảng sắp xếp sản phẩm có thay đổi chưa lưu.'; },
    discard: function () { R.list = null; },
    reset: function () { R.list = null; R.err = ''; },
  });
})();
