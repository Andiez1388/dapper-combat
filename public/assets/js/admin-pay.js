/* Màn hình "Thanh toán online" (Thiết lập): SePay (tự xác nhận chuyển khoản), VNPay (thẻ / ATM), MoMo (ví).
   Khóa bí mật chỉ ghi lên máy chủ, không hiện lại. Server: lib/payments.js + /api/pay/* */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A) return;
  var esc = A.esc, $ = function (s, r) { return (r || document).querySelector(s); };
  var VIEW = 'set-payments';
  var S = { cfg: null, site: '', err: '', busy: '', msg: {} };

  function base() { return (S.site || location.origin).replace(/\/+$/, ''); }
  function load() {
    return A.api('/settings').then(function (d) {
      S.cfg = (d && d.pay) || {}; S.site = (d && d.notify && d.notify.siteUrl) || ''; S.err = ''; render();
    }, function (e) { S.err = (e && e.message) || 'Không tải được'; render(); });
  }
  function urlRow(label, url) {
    return '<div class="pay-url"><span class="field__label">' + esc(label) + '</span><code>' + esc(url) + '</code>' +
      '<button class="btn btn--quiet btn--sm" type="button" data-pay-copy="' + esc(url) + '">Chép</button></div>';
  }
  function sw(prov, key, label, on) {
    return '<label class="check set-switch"><input type="checkbox" data-pf="' + prov + '.' + key + '"' + (on ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span>' + esc(label) + '</span></label>';
  }
  function txt(prov, key, label, val, ph, secret, isSet) {
    return '<label class="field"><span class="field__label">' + esc(label) + '</span>' +
      '<input type="' + (secret ? 'password' : 'text') + '" data-pf="' + prov + '.' + key + '" value="' + esc(secret ? '' : val || '') + '" autocomplete="off" spellcheck="false" placeholder="' +
        esc(secret && isSet ? 'Đã lưu — nhập để thay' : ph || '') + '">' + '</label>';
  }
  function state(on, ready) {
    return !on ? '<span class="cf cf--off">Đang tắt</span>' : ready ? '<span class="cf cf--ok">Đang bật</span>' : '<span class="cf cf--wait">Bật nhưng chưa nhập đủ khóa</span>';
  }
  function msgHtml(p) { var m = S.msg[p]; return m ? '<p class="' + (m.ok ? 'ops-created' : 'form-msg') + '" role="status">' + m.html + '</p>' : ''; }
  function actions(p, testLabel) {
    return '<div class="set-actions"><button class="btn btn--primary" type="button" data-pay-save="' + p + '"' + (S.busy ? ' disabled' : '') + '>' + (S.busy === 'save-' + p ? 'Đang lưu…' : 'Lưu') + '</button>' +
      (testLabel ? '<button class="btn btn--line" type="button" data-pay-test="' + p + '"' + (S.busy ? ' disabled' : '') + '>' + (S.busy === 'test-' + p ? 'Đang thử…' : esc(testLabel)) + '</button>' : '') + '</div>' + msgHtml(p);
  }
  function render() {
    var root = $('[data-pay-root]'); if (!root) return;
    if (S.err) { root.innerHTML = A.errorHtml(S.err); return; }
    if (!S.cfg) { root.innerHTML = A.loadingHtml(); return; }
    var c = S.cfg, se = c.sepay || {}, vn = c.vnpay || {}, mo = c.momo || {};
    var site = S.site ? '' : '<p class="set-err">Chưa điền <strong>Địa chỉ website</strong> ở <a href="#/set-notify">Thiết lập → Thông báo</a> — các đường dẫn dưới đây đang lấy theo địa chỉ bạn đang mở trang quản trị. Khi web chạy thật, hãy điền tên miền (vd https://dappercombat.com).</p>';
    root.innerHTML =
      '<div class="cms-help"><p><strong>Tiền về là đơn tự chuyển “Đã nhận tiền”</strong> (kèm báo Telegram / email cho bạn), khách thấy “Đã thanh toán” ngay trên màn hình và phiếu xác nhận. Ba cách độc lập — bật cách nào cũng được:</p>' +
        '<ul><li><strong>Chuyển khoản tự xác nhận (SePay):</strong> khách vẫn quét mã VietQR như hiện tại; không mất phí % mỗi giao dịch.</li>' +
        '<li><strong>VNPay:</strong> khách trả bằng thẻ ATM nội địa, Visa / Mastercard, hoặc QR ngân hàng. Cần đăng ký kinh doanh + hợp đồng với VNPay.</li>' +
        '<li><strong>MoMo:</strong> khách trả bằng ví MoMo. Cần hợp đồng MoMo Business.</li></ul></div>' + site +
      '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">Chuyển khoản tự xác nhận — SePay</h2>' + state(se.enabled, se.apiKeySet) + '</header><div class="set-body">' +
        '<ol class="pay-steps"><li>Đăng ký tại <a href="https://my.sepay.vn" target="_blank" rel="noopener noreferrer">my.sepay.vn ↗</a>, liên kết tài khoản ngân hàng nhận tiền (đúng tài khoản ở <a href="#/cms-payment">Nội dung website → Thanh toán</a>).</li>' +
        '<li>Vào <strong>WebHooks → Thêm webhook</strong>: sự kiện “Có tiền vào”, gọi tới đường dẫn bên dưới, kiểu chứng thực <strong>API Key</strong>.</li>' +
        '<li>Dán API Key đó vào ô dưới, bật lên và bấm Lưu.</li></ol>' +
        urlRow('Đường dẫn webhook', base() + '/api/pay/sepay/webhook') +
        '<p class="field__hint">Nội dung chuyển khoản của khách là mã đơn (vd DC123456) — mã VietQR trên web đã điền sẵn. Khách chuyển thiếu: đơn ghi “còn thiếu” và báo bạn để gọi khách.</p>' +
        sw('sepay', 'enabled', 'Bật tự xác nhận chuyển khoản', se.enabled) +
        txt('sepay', 'apiKey', 'API Key (đặt trong SePay)', '', 'Khóa bạn đặt khi tạo webhook', true, se.apiKeySet) +
        actions('sepay') + '</div></section>' +
      '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">Thẻ ATM / Visa / Mastercard — VNPay</h2>' + state(vn.enabled, vn.tmnCode && vn.hashSecretSet) + '</header><div class="set-body">' +
        '<ol class="pay-steps"><li>Đăng ký merchant tại <a href="https://vnpay.vn" target="_blank" rel="noopener noreferrer">vnpay.vn ↗</a> (thử miễn phí: <a href="https://sandbox.vnpayment.vn/devreg/" target="_blank" rel="noopener noreferrer">sandbox.vnpayment.vn/devreg ↗</a>). VNPay gửi <strong>Mã website (TMN Code)</strong> và <strong>Chuỗi bí mật (Hash Secret)</strong>.</li>' +
        '<li>Gửi VNPay đường dẫn <strong>IPN</strong> bên dưới để cài cho tài khoản của bạn.</li>' +
        '<li>Nhập mã + chuỗi bí mật, bật lên, bấm Lưu rồi “Tạo link thử 10.000đ” — mở được trang thanh toán VNPay là cấu hình đúng.</li></ol>' +
        urlRow('IPN URL (gửi cho VNPay)', base() + '/api/pay/vnpay/ipn') + urlRow('Return URL (tự gửi kèm)', base() + '/api/pay/vnpay/return') +
        sw('vnpay', 'enabled', 'Cho khách thanh toán bằng thẻ qua VNPay', vn.enabled) +
        sw('vnpay', 'sandbox', 'Môi trường thử (sandbox) — tắt khi đã có tài khoản thật', vn.sandbox !== false) +
        '<div class="grid2">' + txt('vnpay', 'tmnCode', 'Mã website (vnp_TmnCode)', vn.tmnCode, 'VD: ABCD1234') +
        txt('vnpay', 'hashSecret', 'Chuỗi bí mật (vnp_HashSecret)', '', '', true, vn.hashSecretSet) + '</div>' +
        actions('vnpay', 'Tạo link thử 10.000đ') + '</div></section>' +
      '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">Ví MoMo — cổng MoMo</h2>' + state(mo.enabled, mo.partnerCode && mo.accessKey && mo.secretKeySet) + '</header><div class="set-body">' +
        '<ol class="pay-steps"><li>Đăng ký <a href="https://business.momo.vn" target="_blank" rel="noopener noreferrer">MoMo Business ↗</a> → lấy <strong>Partner code, Access key, Secret key</strong> (môi trường thử có sẵn ở <a href="https://developers.momo.vn" target="_blank" rel="noopener noreferrer">developers.momo.vn ↗</a>).</li>' +
        '<li>Nhập 3 mã, bật lên, bấm Lưu rồi “Thử tạo giao dịch” — mở được trang MoMo là cấu hình đúng.</li>' +
        '<li>Bật cổng MoMo thì lựa chọn “Ví MoMo” ở trang thanh toán chuyển khách sang MoMo (thay cho quét mã VietQR bằng app MoMo).</li></ol>' +
        urlRow('IPN URL (tự gửi kèm mỗi giao dịch)', base() + '/api/pay/momo/ipn') +
        sw('momo', 'enabled', 'Cho khách thanh toán bằng ví MoMo', mo.enabled) +
        sw('momo', 'sandbox', 'Môi trường thử (sandbox) — tắt khi đã có tài khoản thật', mo.sandbox !== false) +
        '<div class="grid2">' + txt('momo', 'partnerCode', 'Partner code', mo.partnerCode, 'VD: MOMOXXXX') + txt('momo', 'accessKey', 'Access key', mo.accessKey, '') + '</div>' +
        txt('momo', 'secretKey', 'Secret key', '', '', true, mo.secretKeySet) +
        actions('momo', 'Thử tạo giao dịch') + '</div></section>' +
      '<p class="set-note">Bật / tắt từng cách thanh toán khách được chọn ở <a href="#/set-shop">Thiết lập → Bán hàng → Trang thanh toán</a>. Đơn nào tiền về tự động sẽ có mục “Tiền về tự động” trong chi tiết đơn.</p>';
  }

  function collect(p) {
    var out = {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-pf^="' + p + '."]'), function (el) {
      var k = el.getAttribute('data-pf').split('.')[1];
      if (el.type === 'checkbox') out[k] = el.checked;
      else if (el.type === 'password') { if (el.value.trim()) out[k] = el.value.trim(); }
      else out[k] = el.value.trim();
    });
    return out;
  }
  function save(p) {
    S.busy = 'save-' + p; S.msg[p] = null; render();
    var body = { pay: {} }; body.pay[p] = collect(p);
    return A.api('/settings', { method: 'PUT', body: body }).then(function (d) {
      S.busy = ''; S.cfg = (d && d.pay) || S.cfg;
      if (A.settingsStore && A.settingsStore.set) A.settingsStore.set(d);
      S.msg[p] = { ok: true, html: 'Đã lưu.' }; render();
    }, function (e) { S.busy = ''; S.msg[p] = { ok: false, html: esc(e.message) }; render(); });
  }
  function test(p) {
    S.busy = 'test-' + p; S.msg[p] = null; render();
    A.api('/pay/test/' + p, { method: 'POST' }).then(function (r) {
      S.busy = '';
      S.msg[p] = { ok: true, html: 'Tạo được giao dịch thử — <a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">mở trang thanh toán ↗</a> (giao dịch thử không gắn với đơn nào).' };
      render();
    }, function (e) { S.busy = ''; S.msg[p] = { ok: false, html: esc(e.message) }; render(); });
  }
  document.addEventListener('click', function (e) {
    if (A.view() !== VIEW) return;
    var t = e.target instanceof Element ? e.target : null, n; if (!t) return;
    if ((n = t.closest('[data-pay-save]'))) { save(n.getAttribute('data-pay-save')); return; }
    if ((n = t.closest('[data-pay-test]'))) { test(n.getAttribute('data-pay-test')); return; }
    if ((n = t.closest('[data-pay-copy]'))) {
      var v = n.getAttribute('data-pay-copy');
      (navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { A.toast('Đã chép đường dẫn'); }, function () { A.toast('Đường dẫn: ' + v, 'info'); });
    }
  });

  A.register(VIEW, {
    title: 'Thanh toán online',
    mount: function (main) {
      main.innerHTML = A.pageHead('Thanh toán online', { eyebrow: 'Thiết lập', stamp: false, count: false, refresh: false }) + '<div data-pay-root></div>';
      render(); load();
    },
    reset: function () { S.cfg = null; S.msg = {}; S.busy = ''; },
  });
})();
