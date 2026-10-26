/* Home — giỏ hàng dùng chung với Shop (chọn size ngay trên thẻ), ảnh sản phẩm dẫn tới trang chi tiết, giá lấy từ server */
(function () {
  var CATALOG = Array.isArray(window.__DC_PRODUCTS) ? window.__DC_PRODUCTS : [];
  function T(vi, en) { return DC.lang() === 'en' ? en : vi; }
  // chữ của giỏ hàng (sửa được ở /admin → Nội dung website → Trang chủ → Giỏ hàng)
  function cartLabels() {
    return {
      title: T(DC.x("home.cart.j1",0,'GIỎ HÀNG'), DC.x("home.cart.j1",1,'YOUR CART')), empty: T(DC.x("home.cart.j2",0,'Giỏ hàng của bạn đang trống'), DC.x("home.cart.j2",1,'Your cart is empty')), sub: T(DC.x("home.cart.j3",0,'Tạm tính'), DC.x("home.cart.j3",1,'Subtotal')),
      checkout: T(DC.x("home.cart.j4",0,'THANH TOÁN'), DC.x("home.cart.j4",1,'CHECKOUT')), cont: T(DC.x("home.cart.j5",0,'Tiếp tục mua'), DC.x("home.cart.j5",1,'Continue shopping')), added: T(DC.x("home.cart.j6",0,'Đã thêm vào giỏ'), DC.x("home.cart.j6",1,'Added to cart')),
      pick: T(DC.x("home.cart.j7",0,'Chọn size'), DC.x("home.cart.j7",1,'Choose a size')), view: T(DC.x("home.cart.j8",0,'Xem chi tiết →'), DC.x("home.cart.j8",1,'View details →')), cart: T(DC.x("home.cart.j9",0,'GIỎ ({n})'), DC.x("home.cart.j9",1,'CART ({n})')),
    };
  }
  function colorName(c) {
    return ({ red: T(DC.x("home.cart.j10",0,'Đỏ'), DC.x("home.cart.j10",1,'Red')), black: T(DC.x("home.cart.j11",0,'Đen'), DC.x("home.cart.j11",1,'Black')), white: T(DC.x("home.cart.j12",0,'Trắng'), DC.x("home.cart.j12",1,'White')), grey: T(DC.x("home.cart.j13",0,'Xám'), DC.x("home.cart.j13",1,'Grey')), navy: T(DC.x("home.cart.j14",0,'Navy'), DC.x("home.cart.j14",1,'Navy')), orange: T(DC.x("home.cart.j15",0,'Cam'), DC.x("home.cart.j15",1,'Orange')) })[c] || c;
  }
  function L() { var l = cartLabels(); var c = l.cart; l.cart = function (n) { return c.replace('{n}', n); }; return l; }
  function fmt(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }
  function byName(name) { return CATALOG.find(function (p) { return p.name === name || p.nameEn === name; }); }
  // tên sản phẩm theo ngôn ngữ, link trang sản phẩm (đường dẫn riêng nếu có)
  function pn(p) { return DC.pname(p, DC.lang() === 'en'); }
  function plink(p) { return '/shop/' + encodeURIComponent(DC.pslug(p)); }
  function byId(id) { return CATALOG.find(function (p) { return p.id === id; }); }
  function cardProduct(card) {
    if (card.dataset.pid) return byId(card.dataset.pid);
    var n = card.querySelector('.product-name'); return n ? byName(n.textContent.trim()) : null;
  }
  function toast(msg) {
    var t = document.getElementById('dcToast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }
  function items() {
    var o = DC.cart.load();
    return Object.keys(o).map(function (k) {
      var a = k.split('::'), p = byId(a[0]);
      return p ? { key: k, p: p, size: a[1], color: a[2], qty: o[k] } : null;
    }).filter(Boolean);
  }
  // tồn kho: số còn thêm được (đã trừ phần đang trong giỏ, mọi size / màu)
  function inCart(id, o) { o = o || DC.cart.load(); return Object.keys(o).reduce(function (s, k) { return s + (k.split('::')[0] === id ? o[k] : 0); }, 0); }
  function room(p, o) { return Math.max(0, DC.stock(p) - inCart(p.id, o)); }
  // tồn kho theo size × màu (nếu sản phẩm chia biến thể): còn thêm được bao nhiêu cho đúng dòng giỏ
  function roomKey(p, key, o) { o = o || DC.cart.load(); var a = key.split('::'), r = room(p, o); return DC.hasVariants(p) ? Math.min(r, Math.max(0, DC.vstock(p, a[1], a[2]) - (o[key] || 0))) : r; }
  // màu còn hàng cho size (thêm nhanh dùng màu này)
  function colorFor(p, size) { if (!DC.hasVariants(p)) return p.colors[0][0]; var c = p.colors.filter(function (c) { return DC.vstock(p, size, c[0]) > 0; })[0]; return c ? c[0] : null; }
  function soldTxt() { return T(DC.x('shop.stock.out', 0, 'Hết hàng'), DC.x('shop.stock.out', 1, 'Sold out')); }
  function setQty(key, q) {
    var o = DC.cart.load(), p = byId(key.split('::')[0]);
    if (p && q > (o[key] || 0)) q = Math.min(q, (o[key] || 0) + roomKey(p, key, o));
    if (q > 0) o[key] = Math.min(50, q); else delete o[key];
    clamped = false;
    DC.cart.save(o); render();
  }
  // giỏ đã lưu giữ nhiều hơn số còn trong kho → bớt lại, báo trong giỏ
  var clamped = false;
  (function () { var o = DC.cart.load(); if (CATALOG.length && DC.cart.clamp(o, byId)) { DC.cart.save(o); clamped = true; } })();

  function renderCount() {
    var n = items().reduce(function (s, i) { return s + i.qty; }, 0);
    var lab = document.getElementById('cartLabel'), b = document.getElementById('cartBadge');
    if (lab) lab.textContent = L().cart(n);
    if (b) { b.textContent = n; b.classList.toggle('show', n > 0); }
  }
  function render() {
    renderCount();
    var box = document.getElementById('cartItems'), foot = document.getElementById('cartFoot');
    if (!box) return;
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('cartTitle', L().title); set('cartSubLab', L().sub); set('cartCheckout', L().checkout); set('cartCont', L().cont);
    var list = items();
    set('cartTotal', fmt(list.reduce(function (s, i) { return s + i.p.price * i.qty; }, 0)));
    var note = clamped ? '<div class="dc-cart-note" role="status">' + T(DC.x('shop.cart.clamped', 0, 'Một số sản phẩm trong giỏ đã được điều chỉnh theo số lượng còn trong kho.'), DC.x('shop.cart.clamped', 1, 'Some items in your cart were adjusted to the quantity in stock.')) + '</div>' : '';
    if (!list.length) { box.innerHTML = note + '<div class="cart-empty">' + L().empty + '</div>'; if (foot) foot.style.display = 'none'; return; }
    if (foot) foot.style.display = '';
    var o = DC.cart.load();
    box.innerHTML = note + list.map(function (it) {
      // tên màu riêng của sản phẩm (nếu có) → tên màu chung của giỏ Trang chủ
      var en = DC.lang() === 'en', cc = (it.p.colors || []).filter(function (x) { return x && x[0] === it.color; })[0];
      var col = cc && (en ? cc[3] || cc[2] : cc[2]) ? DC.colorName(it.p, it.color, en) : colorName(it.color), full = roomKey(it.p, it.key, o) <= 0;
      return '<div class="cart-item"><a href="' + plink(it.p) + '"><img src="' + DC.esc(it.p.img) + '" alt=""></a><div class="ci-main">' +
        '<div class="ci-name">' + DC.esc(pn(it.p)) + '</div><div class="ci-var">' + DC.esc(col) + ' · ' + DC.esc(it.size) + '</div><div class="ci-price">' + fmt(it.p.price) + '</div>' +
        '<div class="ci-qty"><button type="button" data-q="-1" data-k="' + DC.esc(it.key) + '" aria-label="−">−</button><span>' + it.qty + '</span><button type="button" data-q="1" data-k="' + DC.esc(it.key) + '" aria-label="+"' + (full ? ' disabled' : '') + '>+</button>' +
        '<button type="button" class="ci-rm" data-rm="' + DC.esc(it.key) + '">✕</button></div></div></div>';
    }).join('');
  }
  function add(p, size) {
    var col = colorFor(p, size), key = p.id + '::' + size + '::' + (col || p.colors[0][0]), o = DC.cart.load();
    if (!col || roomKey(p, key, o) <= 0) { toast(DC.soldOut(p) || !col ? soldTxt() : T(DC.x('shop.stock.max', 0, 'Đã đủ số lượng trong giỏ'), DC.x('shop.stock.max', 1, 'Max quantity in cart'))); return; }
    o[key] = Math.min(50, (o[key] || 0) + 1);
    DC.cart.save(o); render(); toast(L().added + ' · ' + size);
  }
  function closeChooser() { document.querySelectorAll('.dc-qs').forEach(function (el) { el.remove(); }); }
  function chooser(btn, p) {
    closeChooser();
    var media = btn.closest('.product-media'); if (!media) return;
    media.insertAdjacentHTML('beforeend', '<div class="dc-qs" role="dialog" aria-label="' + L().pick + '"><div class="dc-qs-top"><span>' + L().pick + '</span><button type="button" class="dc-qs-x" aria-label="close">✕</button></div>' +
      '<div class="dc-qs-sizes">' + p.sizes.map(function (s) { var oos = !colorFor(p, s); return '<button type="button" data-size="' + DC.esc(s) + '"' + (oos ? ' class="oos" disabled title="' + DC.esc(soldTxt()) + '"' : '') + '>' + DC.esc(s) + '</button>'; }).join('') + '</div>' +
      '<a class="dc-qs-view" href="' + plink(p) + '">' + L().view + '</a></div>');
    var qs = media.querySelector('.dc-qs');
    qs.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var s = e.target.closest('[data-size]');
      if (s) { add(p, s.dataset.size); closeChooser(); return; }
      if (e.target.closest('.dc-qs-x')) closeChooser();
      if (e.target.closest('.dc-qs-view')) location.href = e.target.closest('.dc-qs-view').href;
    });
  }

  var opener = null;
  window.DCcart = {
    add: function (btn, ev) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      var card = btn.closest('.product-card'), p = card && cardProduct(card);
      if (!p) { location.href = '/shop'; return; }
      if (DC.soldOut(p)) { toast(soldTxt()); return; }
      if (p.sizes.length > 1) chooser(btn, p); else add(p, p.sizes[0]);
    },
    // Esc / nút ✕ đóng giỏ, trả con trỏ bàn phím về nút đã mở giỏ
    open: function () {
      var d = document.getElementById('cartDrawer');
      if (!d.classList.contains('open')) opener = document.activeElement;
      render(); document.getElementById('cartOv').classList.add('open'); d.classList.add('open');
      setTimeout(function () { var x = d.querySelector('.cart-close'); if (x && d.classList.contains('open')) x.focus({ preventScroll: true }); }, 60);
    },
    close: function () {
      var d = document.getElementById('cartDrawer'), was = d.classList.contains('open');
      document.getElementById('cartOv').classList.remove('open'); d.classList.remove('open');
      if (was && opener && opener.focus && document.contains(opener)) opener.focus({ preventScroll: true });
      opener = null;
    },
    checkout: function (ev) { if (ev) ev.preventDefault(); location.href = items().length ? '/shop/checkout' : '/shop'; return false; },
    qty: function () {}, rm: function () {},
    refresh: render,
  };

  document.addEventListener('click', function (e) {
    var q = e.target.closest('#cartItems [data-q]');
    if (q) { var it = items().find(function (i) { return i.key === q.dataset.k; }); if (it) setQty(it.key, it.qty + parseInt(q.dataset.q, 10)); return; }
    var r = e.target.closest('#cartItems [data-rm]');
    if (r) { setQty(r.dataset.rm, 0); return; }
    if (!e.target.closest('.dc-qs') && !e.target.closest('.product-addbtn')) closeChooser();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeChooser();
    var d = document.getElementById('cartDrawer');
    if (d && d.classList.contains('open')) DCcart.close();
  });
  // nút giỏ trên thanh menu: bấm Enter / Space cũng mở giỏ
  var nc = document.getElementById('navCart');
  if (nc) nc.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); DCcart.open(); } });

  /* sản phẩm nổi bật: chọn ở /admin → Thiết lập → Bán hàng; tên, giá, ảnh, nhãn lấy từ mục Sản phẩm */
  // tên danh mục: /admin → Danh mục sản phẩm
  function catName(c) { return DC.catName(c, DC.lang() === 'en'); }
  function homeBadge(p) {
    if (p.old) return '<span class="product-badge sale">-' + Math.round((1 - p.price / p.old) * 100) + '%</span>';
    if (p.badge === 'new') return '<span class="product-badge">' + T(DC.x("home.shop.j5",0,'MỚI'), DC.x("home.shop.j5",1,'NEW')) + '</span>';
    if (p.badge === 'best') return '<span class="product-badge hot">' + T(DC.x("home.shop.j6",0,'BÁN CHẠY'), DC.x("home.shop.j6",1,'BEST SELLER')) + '</span>';
    return '';
  }
  function renderCards() {
    var ids = DC.setting('shop.homeProducts', null);
    document.querySelectorAll('.product-card').forEach(function (card, i) {
      if (ids && !card.dataset.pid) card.dataset.pid = ids[i] || '-';
      var p = cardProduct(card);
      card.style.display = p ? '' : 'none';
      if (!p) return;
      card.dataset.pid = p.id;
      var name = card.querySelector('.product-name'); if (name) name.textContent = pn(p);
      var img = card.querySelector('.product-media img'); if (img && p.img) { img.src = p.img; img.alt = pn(p); }
      var link = card.querySelector('.pc-img-link'); if (link) link.setAttribute('href', plink(p));
      var pr = card.querySelector('.product-price'); if (pr) pr.innerHTML = fmt(p.price) + (p.old ? ' <s>' + fmt(p.old) + '</s>' : '');
      var out = DC.soldOut(p);
      var tags = card.querySelector('.product-tags'); if (tags) tags.innerHTML = '<span class="product-tag">' + DC.esc(catName(p.cat)) + '</span>' + (out ? '<span class="product-badge soldout">' + DC.esc(soldTxt()) + '</span>' : homeBadge(p));
      // hết hàng: khóa nút thêm vào giỏ
      card.classList.toggle('dc-out', out);
      var btn = card.querySelector('.product-addbtn'), lab = btn && btn.querySelector('span');
      if (btn) { btn.disabled = out; if (out && lab) lab.textContent = soldTxt(); }
      // yêu thích (dùng chung với Shop)
      var fav = card.querySelector('.product-fav');
      if (fav) {
        var on = DC.fav.has(p.id);
        fav.textContent = on ? '♥' : '♡'; fav.classList.toggle('on', on);
        fav.setAttribute('role', 'button'); fav.setAttribute('tabindex', '0'); fav.setAttribute('aria-pressed', on ? 'true' : 'false');
        fav.setAttribute('aria-label', T(DC.x('shop.list.fav', 0, 'Yêu thích'), DC.x('shop.list.fav', 1, 'Favourites')) + ' — ' + pn(p));
      }
    });
    // chưa có sản phẩm nào trên server
    var grid = document.querySelector('.product-grid'), none = document.getElementById('dcNoProducts');
    if (grid && !CATALOG.length) {
      if (!none) { grid.insertAdjacentHTML('afterend', '<p class="dc-noproducts" id="dcNoProducts" role="status"></p>'); none = document.getElementById('dcNoProducts'); }
      none.textContent = T(DC.x('shop.list.none', 0, 'Sản phẩm đang được cập nhật. Vui lòng quay lại sau.'), DC.x('shop.list.none', 1, 'Products are being updated. Please check back soon.'));
    }
  }
  renderCards();
  var FLOAT = { 'home.float.zalo': ['Chat Zalo', 'Chat on Zalo'], 'home.float.mess': ['Messenger', 'Messenger'] };
  function floatLabels() {
    document.querySelectorAll('[data-float]').forEach(function (a) {
      var k = a.getAttribute('data-float'), d = FLOAT[k] || ['', ''], v = T(DC.x(k, 0, d[0]), DC.x(k, 1, d[1]));
      a.setAttribute('data-label', v); a.setAttribute('aria-label', v);
      if (!v) a.style.display = 'none';
    });
  }
  floatLabels();
  /* tim yêu thích trên thẻ sản phẩm (lưu trong trình duyệt, dùng chung với Shop) */
  function toggleFav(el) {
    var card = el.closest('.product-card'), p = card && cardProduct(card);
    if (!p) return;
    DC.fav.toggle(p.id); renderCards();
  }
  document.addEventListener('click', function (e) {
    var f = e.target.closest && e.target.closest('.product-card .product-fav');
    if (!f) return;
    e.preventDefault(); e.stopPropagation(); toggleFav(f);
  });
  document.addEventListener('keydown', function (e) {
    var f = e.target.closest && e.target.closest('.product-card .product-fav');
    if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleFav(f); }
  });
  DC.fav.onChange(renderCards);

  DC.cart.onChange(render);
  render();

  /* trạng thái "Đang mở cửa": giờ Việt Nam, ngày/giờ mở cửa cài ở /admin → Liên hệ */
  function openStatus() {
    var el = document.getElementById('locOpen'); if (!el) return;
    var mins = function (t) { var a = String(t).split(':'); return (+a[0]) * 60 + (+a[1] || 0); };
    var days = [];
    String(DC.cfg('hoursDays', '1-6')).split(',').forEach(function (part) {
      var r = part.split('-').map(Number);
      for (var d = r[0]; d <= (r.length > 1 ? r[1] : r[0]); d++) days.push(d);
    });
    var now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    var m = now.getHours() * 60 + now.getMinutes();
    var open = days.indexOf(now.getDay()) > -1 && m >= mins(DC.cfg('hoursOpen', '06:00')) && m <= mins(DC.cfg('hoursClose', '21:30'));
    el.className = 'loc-open ' + (open ? 'on' : 'off');
    el.textContent = open ? T(DC.x("home.locate.j1",0,'Đang mở cửa'), DC.x("home.locate.j1",1,'Open now')) : T(DC.x("home.locate.j2",0,'Đã đóng cửa'), DC.x("home.locate.j2",1,'Closed'));
  }
  openStatus();
  setInterval(openStatus, 60000);

  /* chữ đã sửa trong /admin: bộ dịch theo câu của Trang chủ không biết câu mới → đặt lại sau khi đổi ngôn ngữ */
  document.querySelectorAll('.lang-switch').forEach(function (sw) {
    sw.addEventListener('click', function () { setTimeout(function () { DC.applyCms(); render(); openStatus(); renderCards(); floatLabels(); }, 0); });
  });
  /* số sao trên thẻ đánh giá theo điểm (vd 4.5 → 4 sao đậm + nửa sao); điểm sửa trong /admin */
  document.querySelectorAll('.rv-stars').forEach(function (box) {
    var em = box.querySelector('em'), r = em ? parseFloat(String(em.textContent).replace(',', '.')) : NaN;
    if (isNaN(r)) return;
    box.querySelectorAll('span').forEach(function (s, i) {
      s.classList.toggle('off', i >= Math.round(r));
      s.style.opacity = r - i > 0.25 && r - i < 0.75 ? '0.5' : '';
      if (s.style.opacity) s.classList.remove('off');
    });
  });
  /* bản đồ: điền địa chỉ ở /admin → Thiết lập → Thương hiệu → hiện Google Maps thay cho ảnh bản đồ có sẵn */
  var mapQ = DC.setting('brand.mapQuery', '');
  var map = document.querySelector('.locate-map .osm-map');
  if (mapQ && map) map.innerHTML = '<iframe title="Google Maps" src="https://www.google.com/maps?q=' + encodeURIComponent(mapQ) + '&output=embed" style="position:absolute;inset:0;width:100%;height:100%;border:0;filter:grayscale(0.2)" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
})();
