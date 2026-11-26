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
// ô đồng ý chính sách bảo mật ngay trên nút "Đặt hàng"
(function () {
  var put = function () { var po = document.getElementById('placeOrder'); if (po && !document.querySelector('#placeOrder ~ .dc-consent, .dc-consent + #placeOrder')) po.insertAdjacentHTML('beforebegin', DC.consent.html('dc-consent--shop')); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', put); else put();
  // đổi ngôn ngữ → vẽ lại chữ của ô
  if (window.MutationObserver) new MutationObserver(function () { var o = document.querySelector('.dc-consent--shop'); if (o) { o.outerHTML = DC.consent.html('dc-consent--shop'); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
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
  var items = Object.keys(cart).map(function (k) {
    var a = k.split('::'), d = DC.cx && DC.cx.is(a[2]) ? DC.cx.get(a[2]) : null;
    return d ? { id: a[0], size: a[1], color: 'custom', custom: d.spec, qty: cart[k] } : { id: a[0], size: a[1], color: a[2], qty: cart[k] };
  });
  DC.api('/orders', {
    items: items,
    customer: { name: v('name'), phone: v('phone'), email: v('email'), address: v('address'), ward: v('ward'), city: v('city'), note: v('note'),
      addrType: v('addrType'), wardCode: v('wardCode'), oldWard: v('oldWard') },
    pay: (document.querySelector('input[name="pay"]:checked') || {}).value || 'bank',
    ship: (window.V3P && V3P.ship === 'exp' && v3pExpOk()) ? 'exp' : 'std',
    promo: promo ? promoCode : '',
    lang: DC.lang(),
    invoice: window.DCINV ? DCINV.value() : null,
  }).then(function (res) {
    DCS.busy = false;
    window.DC_LAST_ORDER = res;
    // thẻ (VNPay): làm trống giỏ rồi chuyển sang cổng; cổng lỗi (payError) → màn thành công + nút thanh toán lại
    // trả góp: màn thành công tự mở bảng chọn ngân hàng / kỳ hạn (v3okRender bên dưới)
    if (res.payUrl) { dcPayRedirect(res.payUrl, res.slip); return; }
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

// đơn đã tạo, giỏ đã xóa → đổi địa chỉ trang hiện tại thành phiếu xác nhận trước khi sang VNPay:
// khách bấm Back / mở lại tab sẽ về phiếu (có mã đơn + nút thanh toán lại), không về giỏ trống rồi đặt đơn lần nữa
function dcPayRedirect(url, ref) {
  if (ref && DC.slip) try { history.replaceState(null, '', DC.slip.url(ref)); } catch (e) {}
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
dcQr = function (ref, amount) { return DC.payQr(ref, amount) || DC.payPending(); };  // _dcQr (mã QR vẽ mẫu) không dùng nữa
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
  // hiện = công tắc ở Thiết lập → Bán hàng → Trang thanh toán đang bật; chọn được = đã cài mã ở Thanh toán online.
  // Bật mà chưa cài mã → hiện mờ "Sắp có" (xem được giao diện, khách chưa chọn được)
  var show = { vnpay: ckp.vnpay !== false, installment: ckp.installment !== false };
  var on = { vnpay: po.vnpay && show.vnpay, installment: po.installment && show.installment };
  Object.keys(on).forEach(function (k) {
    var opt = document.querySelector('#payOpts [data-pay-opt="' + k + '"]'), i = opt && opt.querySelector('input');
    if (opt) {
      if (show[k]) opt.style.removeProperty('display'); else opt.style.setProperty('display', 'none', 'important');
      var soon = show[k] && !on[k];
      opt.classList.toggle('is-soon', soon);
      var tag = opt.querySelector('.po-soon');
      if (soon && !tag) { var nm = opt.querySelector('.po-name'); if (nm) nm.insertAdjacentHTML('afterend', '<span class="po-soon">' + DC.esc(DC.tx('shop.pay.soon', 'Sắp có', 'Coming soon')) + '</span>'); }
      if (!soon && tag) tag.remove();
      if (soon) opt.title = DC.tx('shop.pay.soonTip', 'Đang kết nối cổng VNPAY — sắp dùng được', 'VNPAY gateway is being connected — available soon');
      else opt.removeAttribute('title');
    }
    if (i) { i.disabled = !on[k]; if (!on[k]) i.checked = false; }
    document.querySelectorAll('.pay-methods [data-pay="' + k + '"], .pay-badges [data-pay="' + k + '"]').forEach(function (el) { if (show[k]) el.style.removeProperty('display'); else el.style.setProperty('display', 'none', 'important'); });
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
/* ảnh riêng theo màu: màu đang chọn lên đầu, sau đó ảnh các màu khác, rồi ảnh chung của sản phẩm */
var _dcMediaC = v3Media;
v3Media = function (p) {
  if (!hasCimg(p)) return _dcMediaC(p);
  var seen = {}, out = [], add = function (u) { if (u && !seen[u]) { seen[u] = 1; out.push({ type: 'img', src: u }); } };
  add(cimg(p, detailColor));
  p.colors.forEach(function (c) { add(cimg(p, c[0])); });
  if (p.img !== 'blank') add(IMG[p.img]);
  (Array.isArray(p.images) ? p.images : []).forEach(add);
  vidsOf(p).forEach(function (v, i) { if (v) out.splice(Math.min(out.length, i === 0 ? 2 : out.length), 0, { type: 'video', src: v }); });
  return out;
};
// đổi màu ở trang chi tiết → dựng lại gallery để ảnh màu đó lên đầu
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('#dColors [data-color]');
  if (b && typeof V3 !== 'undefined') { var p = PRODUCTS.find(function (x) { return x.id === detailId; }); if (p && hasCimg(p) && b.dataset.color !== detailColor) V3.galPid = null; }
}, true);
// mở thẳng /shop/<sản phẩm>: bộ ảnh đã dựng trước khi thay hàm trên → dựng lại
if (V3.galPid) { V3.galPid = null; v3Render(); }
/* thanh tab danh mục dính ngay dưới menu: lấy đúng chiều cao menu (đổi theo màn hình) */
(function () {
  var set = function () { var n = document.querySelector('nav.nav') || document.querySelector('nav'); if (n) document.documentElement.style.setProperty('--shop-nav-h', n.offsetHeight + 'px'); };
  set(); window.addEventListener('resize', set); window.addEventListener('load', set);
})();

/* ---- địa chỉ 2 hệ (mới / cũ) ở trang thanh toán: bộ chọn thay cho 2 ô gõ Phường / Tỉnh ---- */
var DCADDR = null;
(function () {
  var f = document.getElementById('checkoutForm');
  if (!f || !DC.addr) return;
  var city = f.querySelector('[name="city"]'), ward = f.querySelector('[name="ward"]');
  if (!city || !ward) return;
  var row = city.closest('.field-row');
  var box = document.createElement('div');
  box.className = 'field dc-addr-field';
  (row || city.closest('.field')).insertAdjacentElement('beforebegin', box);
  city.type = 'hidden'; ward.type = 'hidden'; city.removeAttribute('required');
  box.appendChild(city);
  f.appendChild(ward);                     // ngoài .field: tùy chọn "ẩn / bắt buộc phường" cũ không đụng bộ chọn
  if (row) row.remove();
  var saved = null;
  try { if (localStorage.getItem('dc_ship')) saved = JSON.parse(localStorage.getItem('dc_addr') || 'null'); } catch (e) {}
  DCADDR = DC.addr.mount(box, {
    state: saved,
    onChange: function () { try { renderSummary(); } catch (e) {} [].forEach.call(box.querySelectorAll('.dc-bad'), function (s) { if (s.value) s.classList.remove('dc-bad'); }); var e = box.querySelector('.v3-err'); if (city.value && e) { e.remove(); box.classList.remove('err'); } },
  });
  var remember = function () {
    try { if (DCADDR && (!document.getElementById('v3Remember') || document.getElementById('v3Remember').checked)) localStorage.setItem('dc_addr', JSON.stringify(DCADDR.state())); else localStorage.removeItem('dc_addr'); } catch (e) {}
  };
  document.getElementById('placeOrder').addEventListener('click', remember, true);
  document.addEventListener('click', function (e) { if (e.target.closest('[data-v3clearship]')) { try { localStorage.removeItem('dc_addr'); } catch (er) {} DCADDR.reset(); } });
  // chưa chọn đủ địa chỉ → đưa khách tới đúng ô còn trống
  var _v = v3pValidate;
  v3pValidate = function () {
    var ok = _v(), m = DCADDR.missing();
    if (m) { box.classList.add('err'); m.classList.add('dc-bad'); if (!box.querySelector('.v3-err')) box.insertAdjacentHTML('beforeend', '<small class="v3-err">' + DC.esc(DC.tx('shop.addr.need', 'Vui lòng chọn đủ tỉnh / phường, xã', 'Please choose your province and ward')) + '</small>'); setTimeout(function () { m.focus({ preventScroll: true }); }, 360); }
    return ok && !m;
  };
  if (window.MutationObserver) new MutationObserver(function () { DCADDR.relabel(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();

/* ---- ô "Chuyển khoản": ngân hàng, số tài khoản, chủ tài khoản + ảnh mã QR công ty (giống trang thanh toán ErgoChair) ---- */
(function () {
  var opts = document.getElementById('payOpts');
  if (!opts) return;
  var box = document.createElement('div');
  box.className = 'dc-bankbox'; box.id = 'dcBankBox';
  opts.insertAdjacentElement('afterend', box);
  var QR = ['bank', 'momo', 'zalopay'];
  function paint() {
    var cur = (document.querySelector('#payOpts input[name="pay"]:checked') || {}).value || '';
    var p = DC.pay(), ck = DC.setting('shop.checkout', null) || {}, img = ck.qrImage || '';
    if (QR.indexOf(cur) < 0 || (!p && !img)) { box.hidden = true; box.innerHTML = ''; return; }
    var row = function (k, v) { return v ? '<span><small>' + k + '</small><b>' + DC.esc(v) + '</b></span>' : ''; };
    var staticQr = img && (ck.qrMode === 'image' || !p);
    box.hidden = false;
    box.innerHTML = '<div class="dc-bankbox__in">' +
      (img ? '<figure class="dc-bankbox__qr"><img src="' + DC.esc(img) + '" alt="' + DC.esc(DC.tx('global.qr.company', 'Mã QR công ty', 'Company QR code')) + '" width="132" height="132" loading="lazy"><figcaption>' + DC.tx('global.qr.company', 'Mã QR công ty', 'Company QR code') + '</figcaption></figure>' : '') +
      (p ? '<div class="dc-bankbox__rows">' + row(DC.tx('global.slip.bank', 'Ngân hàng', 'Bank'), p.bank) + row(DC.tx('global.slip.acc', 'Số tài khoản', 'Account no.'), p.acc) + row(DC.tx('global.slip.holder', 'Chủ tài khoản', 'Account name'), p.holder) + '</div>' : '') +
      '</div><p class="dc-bankbox__hint">✓ ' + (staticQr
        ? DC.tx('shop.bankbox.static', 'Bấm Đặt hàng để nhận số tiền và nội dung chuyển khoản có mã đơn, rồi quét mã QR công ty và nhập đúng 2 thông tin này.', 'Place your order to get the amount and a transfer note with your order code, then scan the company QR and enter both.')
        : DC.tx('shop.bankbox.auto', 'Bấm Đặt hàng, mã QR hiện ngay với đúng số tiền và nội dung chuyển khoản có mã đơn. Quét bằng app ngân hàng, MoMo hoặc ZaloPay là xong.', 'Place your order and a QR code appears with the exact amount and a transfer note with your order code. Scan it with any banking app, MoMo or ZaloPay.')) + '</p>';
  }
  opts.addEventListener('change', paint);
  if (window.MutationObserver) new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint); else paint();
  window.addEventListener('load', paint);
})();

/* ---- VAT: giá đã gồm VAT → dòng "Đã gồm VAT 8%" dưới Tổng cộng + ô yêu cầu xuất hóa đơn VAT (cá nhân / công ty) ---- */
var DCINV = null;
(function () {
  var tot = document.getElementById('sumTotal'), f = document.getElementById('checkoutForm');
  var rate = function () { return Number(DC.setting('shop.vatNow', 8)) || 0; };
  var pct = function () { return String(rate()).replace('.', ','); };
  if (tot) {
    var row = document.createElement('div');
    row.className = 'sum-vat'; row.id = 'sumVat';
    tot.closest('.sum-total').insertAdjacentElement('afterend', row);
    var paint = function () {
      var n = Number(String(tot.textContent).replace(/\D/g, '')) || 0, r = rate();
      row.hidden = !n || !r;
      row.innerHTML = '<span>' + DC.esc(DC.tx('shop.vat.incl', 'Đã gồm VAT', 'Incl. VAT')) + ' ' + pct() + '%</span><span>' + (Math.round(n * r / (100 + r))).toLocaleString('vi-VN') + '₫</span>';
    };
    new MutationObserver(paint).observe(tot, { childList: true, characterData: true, subtree: true });
    new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    paint();
  }
  if (!f) return;
  var note = f.querySelector('[name="note"]'), anchor = note ? note.closest('.field') : null;
  var box = document.createElement('div');
  box.className = 'dc-inv';
  (anchor || f.lastElementChild).insertAdjacentElement('afterend', box);
  var st = { want: false, type: 'personal' };
  var L = function (k, vi, en) { return DC.esc(DC.tx('shop.inv.' + k, vi, en)); };
  function draw() {
    var keep = {};
    [].forEach.call(box.querySelectorAll('input[data-inv]'), function (i) { keep[i.dataset.inv] = i.value; });
    var co = st.type === 'company';
    box.innerHTML = '<label class="dc-inv__want"><input type="checkbox" data-inv-want' + (st.want ? ' checked' : '') + '> <span><b>' + L('want', 'Xuất hóa đơn VAT (hóa đơn điện tử)', 'I need a VAT invoice (e-invoice)') + '</b><small>' +
      L('wantSub', 'Giá đã gồm VAT. Hóa đơn gửi qua email sau khi đơn hoàn tất.', 'Prices include VAT. The e-invoice is emailed once the order is complete.') + '</small></span></label>' +
      (st.want ? '<div class="dc-inv__body"><div class="dc-inv__type">' +
        '<button type="button" data-inv-type="personal" aria-pressed="' + !co + '">' + L('personal', 'Cá nhân', 'Individual') + '</button>' +
        '<button type="button" data-inv-type="company" aria-pressed="' + co + '">' + L('company', 'Công ty', 'Company') + '</button></div>' +
        '<div class="field-row">' +
          '<div class="field"><label>' + (co ? L('cname', 'Tên công ty *', 'Company name *') : L('pname', 'Họ tên trên hóa đơn', 'Name on invoice')) + '</label><input data-inv="name" maxlength="160" autocomplete="organization"></div>' +
          (co ? '<div class="field"><label>' + L('tax', 'Mã số thuế *', 'Tax code *') + '</label><input data-inv="tax" inputmode="numeric" maxlength="14" placeholder="0312345678"></div>' : '') +
        '</div>' +
        '<div class="field"><label>' + (co ? L('caddr', 'Địa chỉ công ty (theo đăng ký thuế) *', 'Company address (as registered) *') : L('paddr', 'Địa chỉ trên hóa đơn', 'Invoice address')) + '</label><input data-inv="addr" maxlength="250"></div>' +
        '<div class="field"><label>' + L('email', 'Email nhận hóa đơn *', 'Email for the e-invoice *') + '</label><input data-inv="email" type="email" maxlength="120" autocomplete="email"></div>' +
      '</div>' : '');
    [].forEach.call(box.querySelectorAll('input[data-inv]'), function (i) { if (keep[i.dataset.inv] != null) i.value = keep[i.dataset.inv]; });
    var em = box.querySelector('[data-inv="email"]'), ce = f.querySelector('[name="email"]');
    if (em && !em.value && ce) em.value = ce.value;
  }
  box.addEventListener('change', function (e) { if (e.target.matches('[data-inv-want]')) { st.want = e.target.checked; draw(); } });
  box.addEventListener('click', function (e) { var b = e.target.closest('[data-inv-type]'); if (b) { st.type = b.dataset.invType; draw(); } });
  box.addEventListener('input', function (e) { var fd = e.target.closest('.field'); if (fd) { fd.classList.remove('err'); var m = fd.querySelector('.v3-err'); if (m) m.remove(); } });
  new MutationObserver(function () { draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  draw();
  function val(k) { var i = box.querySelector('[data-inv="' + k + '"]'); return i ? i.value.trim() : ''; }
  function err(k, msg) {
    var i = box.querySelector('[data-inv="' + k + '"]'); if (!i) return;
    var fd = i.closest('.field'); fd.classList.add('err');
    if (!fd.querySelector('.v3-err')) { var m = document.createElement('div'); m.className = 'v3-err'; m.textContent = msg; fd.appendChild(m); }
    return i;
  }
  DCINV = {
    value: function () { return st.want ? { want: true, type: st.type, name: val('name'), tax: val('tax'), addr: val('addr'), email: val('email') } : null; },
    check: function () {
      if (!st.want) return true;
      var first = null, co = st.type === 'company', e1;
      var mark = function (bad, k, vi, en) { if (bad) { e1 = err(k, DC.tx('shop.inv.e' + k, vi, en)); first = first || e1; } };
      mark(co && val('name').length < 3, 'name', 'Nhập tên công ty', 'Enter the company name');
      mark(co && !/^\d{10}(-?\d{3})?$/.test(val('tax').replace(/\s/g, '')), 'tax', 'Mã số thuế gồm 10 hoặc 13 chữ số', 'Tax code has 10 or 13 digits');
      mark(co && val('addr').length < 5, 'addr', 'Nhập địa chỉ công ty', 'Enter the company address');
      mark(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('email')), 'email', 'Nhập email nhận hóa đơn', 'Enter an email for the invoice');
      if (first) setTimeout(function () { first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 360);
      return !first;
    },
  };
  var _v2 = v3pValidate;
  v3pValidate = function () { var a = _v2(), b = DCINV.check(); return a && b; };
})();
