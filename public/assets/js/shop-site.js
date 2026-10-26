/* Shop — nối với website: giỏ hàng lưu lại & dùng chung, URL riêng cho sản phẩm/thanh toán (nút Back hoạt động), gửi đơn lên server */

/* ---- giỏ hàng ---- */
function dcValidKey(k) {
  var a = k.split('::'), p = PRODUCTS.find(function (x) { return x.id === a[0]; });
  return !!(p && p.sizes.indexOf(a[1]) > -1 && p.colors.some(function (c) { return c[0] === a[2]; }));
}
// nạp giỏ đã lưu; giữ nhiều hơn số còn trong kho (hoặc sản phẩm đã hết hàng) → bớt lại và báo cho khách
function dcLoadCart(o) {
  Object.keys(cart).forEach(function (k) { delete cart[k]; });
  Object.keys(o).forEach(function (k) { if (dcValidKey(k)) cart[k] = Math.max(1, Math.min(50, parseInt(o[k], 10) || 1)); });
  if (DC.cart.clamp(cart, function (id) { return PRODUCTS.find(function (x) { return x.id === id; }); })) dcCartNote = true;
}
var _dcSync = sync;
sync = function () { _dcSync.apply(this, arguments); DC.cart.save(cart); };
dcLoadCart(DC.cart.load());
sync();
DC.cart.onChange(function (o) { dcLoadCart(o); _dcSync(); });

/* ---- đặt hàng ---- */
var DCS = { busy: false };
function dcOrderErr(msg) {
  var po = document.getElementById('placeOrder'), el = document.getElementById('dcOrderErr');
  if (!el && po) { po.insertAdjacentHTML('afterend', '<p class="dc-form-err" id="dcOrderErr" role="alert"></p>'); el = document.getElementById('dcOrderErr'); }
  if (!el) return;
  el.textContent = msg || '';
  el.style.display = msg ? '' : 'none';
  if (msg) try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
}
function DCshopSubmit(ok, fail) {
  if (DCS.busy) return;
  DCS.busy = true;
  dcOrderErr('');
  var f = document.getElementById('checkoutForm');
  var v = function (n) { var i = f && f.querySelector('[name="' + n + '"]'); return i ? i.value.trim() : ''; };
  var items = Object.keys(cart).map(function (k) { var a = k.split('::'); return { id: a[0], size: a[1], color: a[2], qty: cart[k] }; });
  DC.api('/orders', {
    items: items,
    customer: { name: v('name'), phone: v('phone'), email: v('email'), address: v('address'), ward: v('ward'), city: v('city'), note: v('note') },
    pay: (document.querySelector('input[name="pay"]:checked') || {}).value || 'bank',
    ship: (window.V3P && V3P.ship === 'exp' && v3pExpOk()) ? 'exp' : 'std',
    promo: promo ? promoCode : '',
    lang: DC.lang(),
  }).then(function (res) {
    DCS.busy = false;
    window.DC_LAST_ORDER = res;
    // thẻ (VNPay): làm trống giỏ rồi chuyển sang cổng; cổng lỗi (payError) → màn thành công + nút thanh toán lại
    // trả góp: màn thành công tự mở bảng chọn ngân hàng / kỳ hạn (v3okRender bên dưới)
    if (res.payUrl) { dcPayRedirect(res.payUrl); return; }
    ok();                       // màn "Đặt hàng thành công" chụp lại giỏ ngay trong lệnh này
    cart = {}; sync();          // rồi làm trống giỏ (cả bản lưu)
    if (location.pathname !== '/shop/checkout') history.replaceState(null, '', '/shop/checkout');
    document.title = String(DC.tx('shop.ok.title', 'Đặt hàng thành công!', 'Order placed!')).replace(/<[^>]*>/g, '').replace(/!\s*$/, '') + ' — Dapper Combat';
  }, function (err) {
    DCS.busy = false;
    fail();
    // mã giảm giá không còn dùng được (hết hạn / hết lượt / chưa đủ đơn tối thiểu): bỏ mã, báo ở ô mã — khách bấm Đặt hàng lại không cần mã
    if (err.data && err.data.promoError) {
      promoDrop(err.message);
      var pm = document.getElementById('promoMsg');
      if (pm) try { pm.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
      return;
    }
    dcOrderErr(err.message);
  });
}

function dcPayRedirect(url) {
  try {
    var rm = document.getElementById('v3Remember'), f = document.getElementById('checkoutForm');
    if (rm && rm.checked && f) { var o = {}; V3U_F.forEach(function (k) { var i = f.querySelector('[name="' + k + '"]'); if (i) o[k] = i.value.trim(); }); localStorage.setItem('dc_ship', JSON.stringify(o)); }
    else if (rm) localStorage.removeItem('dc_ship');
  } catch (e) {}
  cart = {}; sync();
  if (DC.slip) DC.slip.goOverlay(DC.lang());
  setTimeout(function () { location.href = url; }, 150);
}

/* ---- URL: /shop[?cat=<danh mục>] · /shop/<tên-sản-phẩm> · /shop/checkout ---- */
var DCR = { silent: false, view: 'shop', listY: 0 };
function dcPathFor(v) {
  if (v === 'detail') { var p = PRODUCTS.find(function (x) { return x.id === detailId; }); return '/shop/' + (p ? encodeURIComponent(DC.pslug(p)) : ''); }
  if (v === 'checkout') return '/shop/checkout';
  return '/shop' + (window.V3L && V3L.cat && V3L.cat !== 'all' ? '?cat=' + encodeURIComponent(V3L.cat) : '');
}
/* tiêu đề tab: sản phẩm = tiêu đề SEO riêng hoặc tên (theo ngôn ngữ); thanh toán; Shop = tiêu đề SEO của trang Shop */
function dcTitle(v) {
  var p = v === 'detail' && PRODUCTS.find(function (x) { return x.id === detailId; }), en = DC.lang() === 'en';
  if (p) { var st = p.seoTitle && typeof p.seoTitle === 'object' ? (en ? p.seoTitle.en || p.seoTitle.vi : p.seoTitle.vi) : p.seoTitle; document.title = st || DC.pname(p, en) + ' — Dapper Combat'; return; }
  if (v === 'checkout') { document.title = String(DC.tx('shop.checkout.title', 'Thanh toán', 'Checkout')).replace(/<[^>]*>/g, '') + ' — Dapper Combat'; return; }
  document.title = String(DC.tx('shop.seo.title', 'Shop — Dapper Combat', 'Shop — Dapper Combat')).replace(/<[^>]*>/g, '');
}
// đổi ngôn ngữ (site.js) → đặt lại tiêu đề theo màn hình đang xem
DC.onTitle = function () { dcTitle(DCR.view); };
var _dcSV = showView;
showView = function (v) {
  if (DCR.view === 'shop' && v !== 'shop') DCR.listY = window.scrollY;
  if (v !== 'shop') dcNotFound(false);
  _dcSV.apply(this, arguments);
  DCR.view = v;
  var url = dcPathFor(v);
  if (!DCR.silent && location.pathname + location.search !== url) history.pushState({ v: v }, '', url);
  dcTitle(v);
};
// đổi danh mục trên lưới → cập nhật link (/shop?cat=…) để chia sẻ / tải lại vẫn đúng
var _dcRefresh = v3lRefresh;
v3lRefresh = function () {
  _dcRefresh.apply(this, arguments);
  if (DCR.view === 'shop' && !DCR.silent && /^\/shop\/?$/.test(location.pathname)) { var url = dcPathFor('shop'); if (location.pathname + location.search !== url) history.replaceState({ v: 'shop' }, '', url); }
};
// danh mục trong link (/shop?cat=<mã danh mục>, vd từ chân trang, menu, breadcrumb)
function dcCatFromUrl() {
  var cat = new URLSearchParams(location.search).get('cat') || 'all';
  if (cat !== 'all' && !DC.cat(cat)) cat = 'all';
  if (cat !== V3L.cat || V3L.fav) { V3L.cat = cat; V3L.fav = false; v3lRefresh(); }
}
/* link sản phẩm không còn (server trả 404 kèm window.__DC_NOTFOUND): báo rõ trên lưới rồi chuyển link về /shop */
function dcNotFound(on) {
  var el = document.getElementById('dcNotFound');
  if (!on) { if (el) el.remove(); return; }
  if (!el) {
    var sv = document.getElementById('shopView');
    if (!sv) return;
    sv.insertAdjacentHTML('afterbegin', '<div class="dc-notfound" id="dcNotFound" role="alert"><p></p><button type="button" aria-label="close">✕</button></div>');
    el = document.getElementById('dcNotFound');
    el.querySelector('button').addEventListener('click', function () { dcNotFound(false); });
  }
  el.querySelector('p').textContent = DC.x('shop.notfound', DC.lang() === 'en' ? 1 : 0, DC.lang() === 'en' ? "We couldn't find that product — it may be discontinued or the link is wrong." : 'Không tìm thấy sản phẩm này — có thể sản phẩm đã ngừng bán hoặc đường dẫn bị sai.');
}
function dcRoute() {
  var seg = (location.pathname.replace(/\/+$/, '').match(/^\/shop\/([^/]+)$/) || [])[1];
  try { seg = seg && decodeURIComponent(seg); } catch (e) {}
  DCR.silent = true;
  try {
    if (!seg) { dcCatFromUrl(); if (DCR.view !== 'shop') showView('shop'); else dcTitle('shop'); }
    else if (seg === 'checkout') { if (count() > 0) showCheckout(); else { history.replaceState(null, '', '/shop' + location.search); showView('shop'); } }
    else {
      var p = PRODUCTS.find(function (x) { return DC.pslug(x) === seg || DC.slug(x.name) === seg || x.id === seg; });
      if (p) openDetail(p.id);
      else { history.replaceState(null, '', '/shop'); showView('shop'); dcNotFound(true); }
    }
  } finally { DCR.silent = false; }
}
window.addEventListener('popstate', function () {
  var s = document.getElementById('success');
  if (s && s.classList.contains('active')) { var c = document.getElementById('successClose'); DCR.silent = true; if (c) c.click(); DCR.silent = false; }
  closeCart();
  dcRoute();
  if (DCR.view === 'shop') window.scrollTo({ top: DCR.listY, behavior: 'instant' });
});
dcRoute();
if (window.__DC_NOTFOUND && DCR.view === 'shop') dcNotFound(true);
// đổi ngôn ngữ → đổi luôn chữ của thông báo
document.querySelector('.lang-switch').addEventListener('click', function () { setTimeout(function () { if (document.getElementById('dcNotFound')) dcNotFound(true); }, 0); });

/* link "Shop" trên thanh menu (máy tính): đang ở trang sản phẩm / thanh toán → về lưới sản phẩm ngay trong trang */
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('.nav-links a[href="/shop"]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  closeCart();
  showView('shop');
});

/* ---- mã QR chuyển khoản: VietQR thật nếu đã cài tài khoản trong /admin, không thì giữ mã minh họa ---- */
var _dcQr = dcQr;
dcQr = function (ref, amount) { return DC.payQr(ref, amount) || _dcQr(ref); };
var _dcOkRender = v3okRender;
v3okRender = function () {
  _dcOkRender.apply(this, arguments);
  var info = document.querySelector('#v3Ok .v3ok-qr-info');
  if (info && DC.pay() && window.V3OK && V3OK.d) info.insertAdjacentHTML('beforeend', DC.payLines(V3OK.d.ref, true));
  // phiếu xác nhận cho khách: tải ảnh / xem & in (lượt tải hiện ở /admin)
  var act = document.querySelector('#v3Ok .v3ok-actions'), last = window.DC_LAST_ORDER;
  if (act && last && last.slip && DC.slip) act.insertAdjacentHTML('beforebegin', DC.slip.box(last.slip, DC.lang()));
  // thanh toán online (thẻ / trả góp) / chuyển khoản tự xác nhận (cả khi quét mã bằng MoMo / ZaloPay)
  var d = window.V3OK && V3OK.d, po = DC.payOnline();
  if (!d || !last || !last.slip || !DC.slip) return;
  if (d.paid) { var q = document.querySelector('#v3Ok .v3ok-qr'); if (q) q.outerHTML = '<p class="dc-paid-ok">' + DC.esc(DC.tx('global.slip.received', '✓ Đã nhận tiền — cảm ơn bạn!', '✓ Payment received — thank you!')) + '</p>'; return; }
  var onPaid = function () { if (window.V3OK && V3OK.d === d) { d.paid = true; v3okRender(); } };
  var alive = function () { var sc = document.getElementById('success'); return !!(sc && sc.classList.contains('active') && window.V3OK && V3OK.d === d); };
  if (d.pay === 'vnpay' || d.pay === 'installment') DC.slip.live(document.getElementById('dcOkPay'), last.slip, DC.lang(), { onPaid: onPaid, poll: po.auto, alive: alive });
  else if (po.auto) DC.slip.live(null, last.slip, DC.lang(), { buttons: false, poll: true, onPaid: onPaid, alive: alive });
  // trả góp: mở luôn bảng chọn ngân hàng / kỳ hạn (1 lần — đóng rồi thì bấm nút trong khung để mở lại)
  if (d.pay === 'installment' && last.installment && !d.ispShown) { d.ispShown = true; DC.slip.isp(last.slip, DC.lang()); }
};

/* giao hỏa tốc tắt trong /admin → Thiết lập → Bán hàng: bỏ lựa chọn này ở trang thanh toán */
if (!DC.setting('shop.expressEnabled', true)) {
  V3P.ship = 'std';
  var _dcShipRender = v3pShipRender;
  v3pShipRender = function () { _dcShipRender.apply(this, arguments); var b = document.querySelector('#v3ShipOpts [data-ship="exp"]'); if (b) b.remove(); };
  v3pShipRender();
}

/* trang chi tiết sản phẩm: các phần bật / tắt ở /admin → Thiết lập → Bán hàng */
(function () {
  var pdp = DC.setting('shop.pdp', null);
  if (!pdp) return;
  if (pdp.videos === false) VIDS.length = 0;                                    // không chèn video vào bộ ảnh
  var SEL = { trust: '.pdp-trust', pay: '.pay-methods', fit: '#v3Fit', stock: '#v3Stock', ship: '#v3Ship', feats: '.v3-feats', set: '#v3Set',
    faq: '.pdp-faq', article: '.v3-article', reviews: '#v3Reviews,.pdp-rating', related: '.v3-related', seen: '#v3Seen', news: '#v3News' };
  var off = Object.keys(SEL).filter(function (k) { return pdp[k] === false; }).map(function (k) { return SEL[k]; });
  if (off.length) document.head.insertAdjacentHTML('beforeend', '<style id="dc-pdp">' + off.join(',') + '{display:none!important}</style>');
})();

/* thanh toán online (/admin → Thanh toán online): lựa chọn thẻ (VNPay) / trả góp + logo chỉ hiện khi đã cài;
   trả góp chỉ chọn được khi tổng đơn từ mức tối thiểu (dòng mô tả ghi rõ mức) */
(function () {
  var po = DC.payOnline(), ckp = (DC.setting('shop.checkout', null) || {}).pay || {};
  var on = { vnpay: po.vnpay && ckp.vnpay !== false, installment: po.installment && ckp.installment !== false };
  Object.keys(on).forEach(function (k) {
    var opt = document.querySelector('#payOpts [data-pay-opt="' + k + '"]'), i = opt && opt.querySelector('input');
    if (opt) { if (on[k]) opt.style.removeProperty('display'); else opt.style.setProperty('display', 'none', 'important'); }
    if (i) { i.disabled = !on[k]; if (!on[k]) i.checked = false; }
    document.querySelectorAll('.pay-methods [data-pay="' + k + '"], .pay-badges [data-pay="' + k + '"]').forEach(function (el) { if (on[k]) el.style.removeProperty('display'); else el.style.setProperty('display', 'none', 'important'); });
  });
  if (!on.installment || !po.installmentMin) return;
  var opt = document.querySelector('#payOpts [data-pay-opt="installment"]'), inp = opt && opt.querySelector('input'), sub = opt && opt.querySelector('.po-sub');
  if (!inp) return;
  var check = function () {
    var low = Math.max(0, subtotal() - discountAmt()) + shipFinal() < po.installmentMin;
    inp.disabled = low; opt.classList.toggle('is-off', low);
    if (low && inp.checked) {
      inp.checked = false;
      var first = document.querySelector('#payOpts input[name="pay"]:not(:disabled)');
      if (first) { first.checked = true; first.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    if (sub) sub.textContent = low ? String(DC.tx('shop.pay.installmentMin', 'Áp dụng cho đơn từ {min}', 'For orders from {min}')).replace('{min}', fmt(po.installmentMin)) : t('pay.installmentSub');
  };
  var _rs = renderSummary; renderSummary = function () { _rs.apply(this, arguments); check(); };
  var _al = applyLang; applyLang = function () { _al.apply(this, arguments); check(); };
  check();
})();
// đóng màn đặt hàng thành công → thôi theo dõi thanh toán
document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-v3okclose]') && window.DC_LAST_ORDER && DC.slip) DC.slip.unwatch(DC_LAST_ORDER.slip); }, true);

/* trang thanh toán: phương thức thanh toán đang nhận, ô email / phường xã / ghi chú bắt buộc hoặc ẩn (/admin → Thiết lập → Bán hàng) */
(function () {
  var ck = DC.setting('shop.checkout', null), form = document.getElementById('checkoutForm');
  if (!ck || !form) return;
  form.querySelectorAll('#payOpts .pay-opt').forEach(function (l) {
    var i = l.querySelector('input[name="pay"]');
    if (i && ck.pay && ck.pay[i.value] === false) { l.style.setProperty('display', 'none', 'important'); i.disabled = true; i.checked = false; }
  });
  // logo thanh toán (trang sản phẩm, cuối tóm tắt đơn): chỉ hiện cách thanh toán đang nhận
  if (ck.pay) document.querySelectorAll('.pay-methods [data-pay], .pay-badges [data-pay]').forEach(function (el) {
    if (ck.pay[el.getAttribute('data-pay')] === false) el.style.setProperty('display', 'none', 'important');
  });
  if (!form.querySelector('input[name="pay"]:checked')) {
    var first = form.querySelector('input[name="pay"]:not(:disabled)');
    if (first) { first.checked = true; first.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  ['email', 'ward', 'note'].forEach(function (n) {
    var i = form.querySelector('[name="' + n + '"]'), f = i && i.closest('.field');
    if (!f) return;
    if (ck[n] === 'hidden') { f.style.display = 'none'; i.value = ''; }
    if (ck[n] === 'required') { i.required = true; f.classList.add('dc-req'); }
  });
  var MSG = { email: ['shop.checkout.req.email', 'Vui lòng nhập email', 'Please enter your email'], ward: ['shop.checkout.req.ward', 'Vui lòng nhập phường / xã', 'Please enter your ward'],
    note: ['shop.checkout.req.note', 'Vui lòng nhập ghi chú', 'Please enter a note'] };
  var _dcValidate = v3pValidate;
  v3pValidate = function () {
    var ok = _dcValidate(), bad = null;
    ['email', 'ward', 'note'].forEach(function (n) {
      var i = form.querySelector('[name="' + n + '"]');
      if (ck[n] !== 'required' || !i || i.value.trim()) return;
      var f = i.closest('.field');
      if (!f.querySelector('.v3-err')) f.insertAdjacentHTML('beforeend', '<small class="v3-err">' + DC.esc(v3T(DC.x(MSG[n][0], 0, MSG[n][1]), DC.x(MSG[n][0], 1, MSG[n][2]))) + '</small>');
      f.classList.add('err'); bad = bad || i;
    });
    if (bad && ok) { window.scrollTo({ top: bad.getBoundingClientRect().top + scrollY - 140, behavior: 'smooth' }); bad.focus({ preventScroll: true }); }
    return ok && !bad;
  };
})();

/* ảnh phụ của sản phẩm (tải ở /admin → Sản phẩm): trang chi tiết dùng ảnh thật thay cho ảnh cắt từ ảnh chính */
var _dcMedia = v3Media;
v3Media = function (p) {
  if (!p || !Array.isArray(p.images) || !p.images.length) return _dcMedia(p);
  var imgs = [IMG[p.img]].concat(p.images).map(function (u) { return { type: 'img', src: u }; }), vids = vidsOf(p);   // video riêng của sản phẩm hoặc 2 video chung
  var out = imgs.slice(0, 2);
  if (vids[0]) out.push({ type: 'video', src: vids[0] });
  out = out.concat(imgs.slice(2));
  if (vids[1]) out.push({ type: 'video', src: vids[1] });
  return out;
};
// mở thẳng /shop/<sản phẩm>: bộ ảnh đã dựng trước khi thay hàm trên → dựng lại
if (V3.galPid) { V3.galPid = null; v3Render(); }
