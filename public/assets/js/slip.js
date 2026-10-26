/* Phiếu xác nhận cho khách (đơn hàng / đăng ký khóa học): xem trên web, in / lưu PDF, tải ảnh PNG.
   Dữ liệu: /api/slip/<mã>?k=<khóa> (khóa riêng của từng đơn). Chữ trên phiếu sửa ở /admin → Chữ trên trang → Chung → Phiếu xác nhận.
   Lượt xem / tải hiện ở /admin (đơn hàng, đăng ký → Xác nhận cho khách). */
(function () {
  var S = window.DC.slip = {};
  var L = function (k, vi, en, lang) { return DC.x('global.slip.' + k, lang === 'en' ? 1 : 0, lang === 'en' ? en : vi); };
  var money = function (n, lang) { return Math.round(n || 0).toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN') + 'đ'; };
  var COL = { red: ['Đỏ', 'Red'], black: ['Đen', 'Black'], white: ['Trắng', 'White'], grey: ['Xám', 'Grey'], navy: ['Xanh navy', 'Navy'], orange: ['Cam', 'Orange'] };
  var col = function (c, lang) { var d = COL[c] || [c, c]; return DC.x('shop.col.' + c, lang === 'en' ? 1 : 0, lang === 'en' ? d[1] : d[0]); };
  var date = function (t, lang) { return new Date(t).toLocaleString(lang === 'en' ? 'en-GB' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }); };
  var plain = function (s) { return String(s == null ? '' : s).replace(/<[^>]*>/g, ''); };
  // tên sản phẩm / màu trên phiếu: tiếng Việt lấy tên đã lưu trong đơn (colorName = tên màu riêng);
  // tiếng Anh tìm sản phẩm (nameEn, tên màu tiếng Anh) nếu trang có danh sách sản phẩm, không có thì dùng tên đã lưu / tên màu chung
  var prod = function (id) { return DC.product ? DC.product(id) : null; };
  var itemName = function (i, lang) { var p = prod(i.id); return lang === 'en' && p && p.nameEn ? p.nameEn : i.name; };
  var itemColor = function (i, lang) {
    var en = lang === 'en', p = prod(i.id);
    if (!en && i.colorName) return i.colorName;
    if (en) { var c = p && Array.isArray(p.colors) ? p.colors.filter(function (x) { return x && x[0] === i.color; })[0] : null; if (c && c[3]) return c[3]; if (i.colorName) return i.colorName; }
    return p ? DC.colorName(p, i.color, en) : col(i.color, lang);
  };

  S.url = function (ref) { return '/phieu/' + encodeURIComponent(ref.code) + '?k=' + encodeURIComponent(ref.k); };
  // lỗi: err.status = mã HTTP (404 = không có phiếu / sai khóa), 0 = mất mạng
  S.load = function (ref, view) {
    return fetch('/api/slip/' + encodeURIComponent(ref.code) + '?k=' + encodeURIComponent(ref.k) + (view ? '&view=1' : ''))
      .then(function (r) { if (!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; } return r.json(); },
        function () { var e = new Error('network'); e.status = 0; throw e; });
  };
  // trạng thái đơn / đăng ký (đổi trong /admin) → chữ dễ hiểu
  var ST = {
    order: { new: ['Mới nhận', 'Received'], confirmed: ['Đã xác nhận', 'Confirmed'], shipping: ['Đang giao', 'Shipping'], done: ['Hoàn tất', 'Completed'], cancelled: ['Đã hủy', 'Cancelled'] },
    registration: { new: ['Mới nhận', 'Received'], contacted: ['Đã liên hệ', 'Contacted'], paid: ['Đã thanh toán', 'Paid'], enrolled: ['Đã nhập học', 'Enrolled'], cancelled: ['Đã hủy', 'Cancelled'] },
  };
  S.status = function (d, lang) {
    var t = (ST[d.type] || {})[d.status];
    return t ? L('st.' + d.status, t[0], t[1], lang) : '';
  };

  // nội dung phiếu (dùng chung cho bản web và bản ảnh)
  S.model = function (d, lang) {
    var o = d.type === 'order', m = { lang: lang };
    m.brand = plain(DC.x('global.brand', 0, 'DAPPER COMBAT'));
    m.title = o ? L('title.order', 'Phiếu xác nhận đơn hàng', 'Order confirmation', lang) : L('title.reg', 'Phiếu xác nhận đăng ký', 'Registration confirmation', lang);
    m.codeLab = o ? L('code.order', 'Mã đơn hàng', 'Order no.', lang) : L('code.reg', 'Mã đăng ký', 'Registration no.', lang);
    m.code = d.code;
    m.date = L('date', 'Thời gian', 'Date', lang) + ': ' + date(d.createdAt, lang);
    var st = S.status(d, lang);
    if (st) m.status = { lab: L('st', 'Trạng thái', 'Status', lang), val: st, key: d.status };
    // đã nhận tiền (ghi ở /admin) → nhãn "Đã thanh toán"; khung mã QR (d.pay) không còn
    if (d.paid) m.paid = L('paid', 'Đã thanh toán', 'Paid', lang);
    m.info = [[L('customer', 'Khách hàng', 'Customer', lang), d.customer.name], [L('phone', 'Điện thoại', 'Phone', lang), d.customer.phone]];
    if (d.customer.email) m.info.push([L('email', 'Email', 'Email', lang), d.customer.email]);
    if (o) {
      var addr = [d.customer.address, d.customer.ward, d.customer.city].filter(Boolean).join(', ');
      if (addr && d.ship !== 'pickup') m.info.push([L('address', 'Giao đến', 'Deliver to', lang), addr]);
      m.info.push([L('delivery', 'Giao hàng', 'Delivery', lang), d.ship === 'pickup' ? L('ship.pickup', 'Nhận tại phòng tập', 'Pick up at the gym', lang) : d.ship === 'exp' ? L('ship.exp', 'Hỏa tốc nội thành TP.HCM', 'Same-day in HCMC', lang) : L('ship.std', 'Giao tiêu chuẩn ({ship.eta} ngày)', 'Standard delivery ({ship.eta} days)', lang)]);
      m.info.push([L('payment', 'Thanh toán', 'Payment', lang), { bank: L('pay.bank', 'Chuyển khoản ngân hàng', 'Bank transfer', lang), momo: L('pay.momo', 'Ví MoMo', 'MoMo e-wallet', lang), zalopay: L('pay.zalopay', 'ZaloPay', 'ZaloPay', lang),
        vnpay: L('pay.vnpay', 'Thẻ ATM / Visa / Mastercard (VNPay)', 'ATM / Visa / Mastercard card (VNPay)', lang), installment: L('pay.installment', 'Trả góp thẻ tín dụng (VNPay)', 'Credit card installments (VNPay)', lang),
        cash: L('pay.cash', 'Tiền mặt', 'Cash', lang) }[d.payMethod] || d.payMethod]);
      if (d.carrier) m.info.push([L('carrier', 'Đơn vị vận chuyển', 'Carrier', lang), d.carrier]);
      if (d.trackingCode) m.info.push([L('tracking', 'Mã vận đơn', 'Tracking code', lang), d.trackingCode]);
      m.itemsLab = L('items', 'Sản phẩm', 'Items', lang);
      m.items = (d.items || []).map(function (i) { return { name: i.qty + ' × ' + itemName(i, lang), sub: [i.size, i.color ? itemColor(i, lang) : ''].filter(Boolean).join(' · '), price: money(i.price * i.qty, lang) }; });
      m.totals = [[L('subtotal', 'Tạm tính', 'Subtotal', lang), money(d.subtotal, lang)]];
      if (d.discount) m.totals.push([L('discount', 'Giảm giá', 'Discount', lang) + (d.promo ? ' (' + d.promo + ')' : ''), '−' + money(d.discount, lang)]);
      m.totals.push([L('shipping', 'Phí giao hàng', 'Shipping', lang), d.shipping ? money(d.shipping, lang) : L('free', 'Miễn phí', 'Free', lang)]);
      m.totals.push([L('total', 'Tổng cộng', 'Total', lang), money(d.total, lang), true]);
    } else {
      m.info.push([L('program', 'Chương trình', 'Program', lang), d.program + (d.detail ? ' — ' + d.detail : '')]);
      if (d.date) m.info.push([L('start', 'Ngày muốn bắt đầu', 'Preferred start date', lang), d.date.split('-').reverse().join('/')]);
      if (d.payName) m.info.push([L('payment', 'Thanh toán', 'Payment', lang), d.payName]);
      m.totals = [];
      if (d.total) m.totals.push([L('fee', 'Học phí', 'Tuition', lang), money(d.total, lang)]);
      if (d.due) m.totals.push([L('due', 'Cần thanh toán', 'Amount due', lang), money(d.due, lang), true]);
    }
    // đã thanh toán qua cổng / chuyển khoản tự xác nhận: VNPay · 1.290.000đ · 26/10/2026 10:30
    (Array.isArray(d.payments) ? d.payments : []).forEach(function (x) {
      if (!x || !x.amount) return;
      m.info.push([L('paidvia', 'Đã thanh toán qua', 'Paid via', lang), [S.provider(x.provider, lang), money(x.amount, lang), x.at ? date(x.at, lang) : ''].filter(Boolean).join(' · ')]);
    });
    if (d.pay) m.pay = {
      lab: L('transfer', 'Chuyển khoản tới', 'Transfer to', lang),
      rows: [[L('bank', 'Ngân hàng', 'Bank', lang), d.pay.bank], [L('acc', 'Số tài khoản', 'Account no.', lang), d.pay.acc]]
        .concat(d.pay.holder ? [[L('holder', 'Chủ tài khoản', 'Account name', lang), d.pay.holder]] : [])
        .concat([[L('amount', 'Số tiền', 'Amount', lang), money(d.pay.amount, lang)], [L('note', 'Nội dung chuyển khoản', 'Transfer note', lang), d.pay.note]]),
      scan: L('scan', 'Quét mã bằng app ngân hàng, MoMo hoặc ZaloPay để chuyển đúng số tiền và nội dung.', 'Scan with your banking app, MoMo or ZaloPay — amount and note are filled in.', lang),
    };
    m.footer = L('footer', 'Vui lòng giữ phiếu này. Dapper Combat sẽ gọi xác nhận trong giờ làm việc.', 'Please keep this confirmation. Dapper Combat will call to confirm during business hours.', lang);
    m.contact = L('contact', 'Hotline', 'Hotline', lang) + ' ' + DC.cfg('phone', '') + ' · ' + location.host;
    return m;
  };

  // bản web (trang /phieu/…)
  S.html = function (d, lang, ref) {
    var m = S.model(d, lang), e = DC.esc;
    var row = function (r) { return '<div class="sl-row' + (r[2] ? ' sl-strong' : '') + '"><span>' + e(r[0]) + '</span><b>' + e(r[1]) + '</b></div>'; };
    return '<div class="sl-card"><div class="sl-top"><b>' + e(m.brand) + '</b><span>' + e(m.title) + '</span></div>' +
      '<div class="sl-code"><small>' + e(m.codeLab) + '</small><strong>' + e(m.code) + '</strong><em>' + e(m.date) + '</em>' +
      (m.status ? '<span class="sl-status sl-st-' + e(m.status.key) + '">' + e(m.status.lab) + ': <b>' + e(m.status.val) + '</b></span>' : '') +
      (m.paid ? '<span class="sl-status sl-paid">✓ ' + e(m.paid) + '</span>' : '') + '</div>' +
      '<div class="sl-sec">' + m.info.map(row).join('') + '</div>' +
      (m.items ? '<div class="sl-sec"><h3>' + e(m.itemsLab) + '</h3>' + m.items.map(function (i) { return '<div class="sl-item"><span>' + e(i.name) + (i.sub ? '<small>' + e(i.sub) + '</small>' : '') + '</span><b>' + e(i.price) + '</b></div>'; }).join('') + '</div>' : '') +
      (m.totals.length ? '<div class="sl-sec sl-totals">' + m.totals.map(row).join('') + '</div>' : '') +
      (m.pay ? '<div class="sl-sec sl-pay"><h3>' + e(m.pay.lab) + '</h3><div class="sl-pay-in"><img src="/api/slip/' + encodeURIComponent(ref.code) + '/qr.png?v=2&k=' + encodeURIComponent(ref.k) + '" alt="VietQR" width="180" onerror="this.remove()"><div>' + m.pay.rows.map(row).join('') + '<p>' + e(m.pay.scan) + '</p></div></div></div>' : '') +
      '<p class="sl-foot">' + e(m.footer) + '<br>' + e(m.contact) + '</p></div>';
  };

  // bản ảnh PNG (vẽ bằng canvas, chữ theo phông đang dùng trên trang)
  S.png = function (d, lang, ref) {
    var m = S.model(d, lang), W = 1080, P = 72, cs = getComputedStyle(document.documentElement);
    var F = function (v, def) { return (cs.getPropertyValue(v) || '').trim() || def; };
    var fDisp = F('--f-display', "'Barlow Condensed', sans-serif"), fBody = F('--f-body', "'Inter', sans-serif"), fMono = F('--f-mono', "'Roboto Mono', monospace");
    var accent = cs.getPropertyValue('--accent').trim() || '#D4372E';
    var qr = new Promise(function (res) {
      if (!m.pay) return res(null);
      var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); };
      i.src = '/api/slip/' + encodeURIComponent(ref.code) + '/qr.png?v=2&k=' + encodeURIComponent(ref.k);
    });
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    return Promise.all([qr, ready]).then(function (a) {
      var img = a[0], c = document.createElement('canvas'), x = c.getContext('2d');
      var wrap = function (t, font, max) {
        x.font = font; var out = [], line = '';
        String(t).split(/\s+/).forEach(function (w) { var test = line ? line + ' ' + w : w; if (x.measureText(test).width > max && line) { out.push(line); line = w; } else line = test; });
        if (line) out.push(line); return out.length ? out : [''];
      };
      // vẽ 2 lần: lần đầu chỉ đo chiều cao
      var paint = function (draw) {
        var y = 0;
        var text = function (t, font, color, tx, ty, align) { if (!draw) return; x.font = font; x.fillStyle = color; x.textAlign = align || 'left'; x.fillText(t, tx, ty); };
        if (draw) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, c.height); x.fillStyle = '#0b0b0b'; x.fillRect(0, 0, W, 150); x.fillStyle = accent; x.fillRect(0, 150, W, 8); }
        text(m.brand, '900 52px ' + fDisp, '#ffffff', P, 94);
        text(m.title.toUpperCase(), '500 22px ' + fMono, 'rgba(255,255,255,0.75)', W - P, 90, 'right');
        y = 230;
        text(m.codeLab.toUpperCase(), '500 22px ' + fMono, '#6b6b6b', P, y); y += 70;
        text(m.code, '900 72px ' + fDisp, '#0b0b0b', P, y); y += 50;
        text(m.date, '400 24px ' + fBody, '#444444', P, y); y += 50;
        if (m.status) { text(m.status.lab.toUpperCase() + ': ' + m.status.val.toUpperCase(), '600 24px ' + fMono, m.status.key === 'cancelled' ? '#6b6b6b' : accent, P, y - 6); y += 44; }
        if (m.paid) { text('✓ ' + m.paid.toUpperCase(), '600 24px ' + fMono, '#17703c', P, y - 6); y += 44; }
        var line = function () { if (draw) { x.fillStyle = '#e4e4e4'; x.fillRect(P, y, W - 2 * P, 2); } y += 40; };
        var kv = function (r, big) {
          var lab = r[0], vals = wrap(r[1], (big ? '700 34px ' : '600 26px ') + fBody, W - 2 * P - 330);
          text(lab, '400 24px ' + fBody, '#6b6b6b', P, y);
          vals.forEach(function (v, i) { text(v, (big ? '700 34px ' : '600 26px ') + fBody, big ? accent : '#111111', W - P, y + i * 36, 'right'); });
          y += Math.max(1, vals.length) * 36 + 14;
        };
        line();
        m.info.forEach(function (r) { kv(r); });
        if (m.items && m.items.length) {
          line();
          text(m.itemsLab.toUpperCase(), '500 22px ' + fMono, '#6b6b6b', P, y); y += 44;
          m.items.forEach(function (i) {
            var names = wrap(i.name, '600 28px ' + fBody, W - 2 * P - 260);
            names.forEach(function (n, k) { text(n, '600 28px ' + fBody, '#111111', P, y + k * 36); });
            text(i.price, '600 28px ' + fBody, '#111111', W - P, y, 'right');
            y += names.length * 36;
            if (i.sub) { text(i.sub, '400 23px ' + fBody, '#6b6b6b', P, y); y += 34; }
            y += 14;
          });
        }
        if (m.totals.length) { line(); m.totals.forEach(function (r) { kv(r, r[2]); }); }
        if (m.pay) {
          line();
          text(m.pay.lab.toUpperCase(), '500 22px ' + fMono, '#6b6b6b', P, y); y += 30;
          var top = y, qs = img ? 300 : 0, qh = img ? Math.round(qs * (img.height || 1) / (img.width || 1)) : 0;   // giữ tỉ lệ ảnh mã QR
          if (img && draw) x.drawImage(img, P, y, qs, qh);
          var lx = P + (img ? qs + 40 : 0), lw = W - P - lx;
          y += 20;
          m.pay.rows.forEach(function (r) {
            text(r[0], '400 22px ' + fBody, '#6b6b6b', lx, y);
            var v = wrap(r[1], '700 26px ' + fBody, lw);
            v.forEach(function (s, i) { text(s, '700 26px ' + fBody, '#111111', lx, y + 32 + i * 32); });
            y += 32 + v.length * 32 + 12;
          });
          y = Math.max(y, top + qh) + 16;
          wrap(m.pay.scan, '400 23px ' + fBody, W - 2 * P).forEach(function (s) { text(s, '400 23px ' + fBody, '#444444', P, y); y += 32; });
        }
        y += 20; line();
        wrap(m.footer, '400 24px ' + fBody, W - 2 * P).forEach(function (s) { text(s, '400 24px ' + fBody, '#333333', P, y); y += 34; });
        text(m.contact, '500 22px ' + fMono, '#6b6b6b', P, y + 10); y += 70;
        return y;
      };
      c.width = W; c.height = 400;
      c.height = Math.ceil(paint(false));
      paint(true);
      return new Promise(function (res) { c.toBlob(function (b) { res(b); }, 'image/png'); });
    });
  };

  // tải ảnh phiếu: lưu file + hiện ảnh (trình duyệt trong Zalo / Facebook không cho tải → nhấn giữ ảnh để lưu)
  S.download = function (ref, lang, data) {
    var get = data ? Promise.resolve(data) : S.load(ref);
    return get.then(function (d) { return S.png(d, lang || d.lang, ref); }).then(function (blob) {
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'phieu-xac-nhan-' + ref.code + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      S.preview(url, lang);
      fetch('/api/slip/' + encodeURIComponent(ref.code) + '/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ k: ref.k }) }).catch(function () {});
    });
  };
  // lời báo khi không tạo / tải được ảnh phiếu
  S.dlError = function (lang) { return L('dlerr', 'Không tạo được ảnh phiếu. Vui lòng thử lại, hoặc dùng nút "Xem / in phiếu".', 'Could not create the confirmation image. Please try again, or use "View / print".', lang); };
  S.preview = function (url, lang) {
    var old = document.getElementById('dcSlipView'); if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', '<div id="dcSlipView" class="dc-slipview" role="dialog"><div class="dc-slipview-in"><button type="button" class="dc-slipview-x" aria-label="close">✕</button>' +
      '<img src="' + url + '" alt=""><p>' + DC.esc(L('saved', 'Nhấn giữ ảnh để lưu vào máy nếu trình duyệt không tự tải.', 'Press and hold the image to save it if it did not download.', lang)) + '</p></div></div>');
    document.getElementById('dcSlipView').addEventListener('click', function (e) { if (e.target === this || e.target.closest('.dc-slipview-x')) this.remove(); });
    var x = document.querySelector('#dcSlipView .dc-slipview-x'); if (x) x.focus({ preventScroll: true });
  };
  // Esc đóng ảnh phiếu (không đóng luôn màn hình phía sau)
  document.addEventListener('keydown', function (e) {
    var v = e.key === 'Escape' && document.getElementById('dcSlipView');
    if (v) { e.preventDefault(); e.stopImmediatePropagation(); v.remove(); }
  }, true);
  /* ─── Thanh toán online ───────────────────────────────────────────────────
     nút "Thanh toán bằng thẻ (VNPay)" → POST /api/pay/vnpay/create {code, k, lang} → chuyển sang cổng;
     nút "Trả góp qua thẻ tín dụng (VNPay)" → bảng chọn ngân hàng / loại thẻ / kỳ hạn (S.isp);
     theo dõi phiếu (GET /api/slip, không tính lượt xem) cho tới khi server ghi đã nhận tiền */
  S.provider = function (p, lang) {
    return p === 'vnpay' ? 'VNPay' : p === 'installment' ? L('pay.installment', 'Trả góp thẻ tín dụng (VNPay)', 'Credit card installments (VNPay)', lang) : L('pay.bank', 'Chuyển khoản ngân hàng', 'Bank transfer', lang);
  };
  S.payBtns = function (ref, online, lang) {
    var list = (online || []).filter(function (p) { return p === 'vnpay' || p === 'installment'; });
    if (!ref || !ref.k || !list.length) return '';
    return '<div class="dc-paybtns"><p class="dc-paybtns-h">' + DC.esc(L('payonline', 'Thanh toán online', 'Pay online', lang)) + '</p><div class="dc-paybtns-row">' +
      list.map(function (p) {
        return '<button type="button" class="dc-paybtn dc-paybtn-' + p + '" data-pay-go="' + p + '" data-slip="' + DC.esc(ref.code) + '" data-k="' + DC.esc(ref.k) + '" data-lang="' + (lang === 'en' ? 'en' : 'vi') + '">' +
          DC.esc(p === 'vnpay' ? L('paybtn.vnpay', 'Thanh toán bằng thẻ (VNPay)', 'Pay by card (VNPay)', lang) : L('paybtn.installment', 'Trả góp qua thẻ tín dụng (VNPay)', 'Pay in installments (VNPay)', lang)) + '</button>';
      }).join('') + '</div><p class="dc-pay-err" role="alert" hidden></p></div>';
  };
  // màn hình chờ chuyển sang cổng thanh toán
  S.goOverlay = function (lang) {
    if (document.getElementById('dcPayGo')) return;
    document.body.insertAdjacentHTML('beforeend', '<div class="dc-paygo" id="dcPayGo" role="status" aria-live="polite"><div><i></i><p>' + DC.esc(L('paygo', 'Đang chuyển sang cổng thanh toán…', 'Redirecting to the payment gateway…', lang)) + '</p></div></div>');
  };
  // khách bấm Back từ cổng thanh toán (trang lấy lại từ bộ nhớ đệm) → tải lại để bỏ màn chờ, thấy trạng thái mới
  window.addEventListener('pageshow', function (e) { if (e.persisted && document.getElementById('dcPayGo')) location.reload(); });
  S.payGo = function (provider, ref, lang) {
    return DC.api('/pay/' + encodeURIComponent(provider) + '/create', { code: ref.code, k: ref.k, lang: lang || DC.lang() }).then(function (r) {
      if (!r || !r.url) throw new Error(L('payerr', 'Chưa mở được cổng thanh toán, vui lòng thử lại.', 'Couldn\'t open the payment gateway, please try again.', lang));
      S.goOverlay(lang);
      location.href = r.url;
      return r.url;
    });
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-pay-go]');
    if (!b || b.disabled) return;
    e.preventDefault();
    if (b.dataset.payGo === 'installment') { S.isp({ code: b.dataset.slip, k: b.dataset.k }, b.dataset.lang || DC.lang()); return; }
    var box = b.closest('.dc-paybtns'), err = box && box.querySelector('.dc-pay-err'), btns = box ? box.querySelectorAll('[data-pay-go]') : [b];
    [].forEach.call(btns, function (x) { x.disabled = true; });
    b.classList.add('dc-busy');
    if (err) { err.hidden = true; err.textContent = ''; }
    S.payGo(b.dataset.payGo, { code: b.dataset.slip, k: b.dataset.k }, b.dataset.lang || DC.lang()).catch(function (x) {
      [].forEach.call(btns, function (y) { y.disabled = false; });
      b.classList.remove('dc-busy');
      if (err) { err.textContent = x.message; err.hidden = false; }
    });
  });
  /* ─── Trả góp (VNPay): chọn ngân hàng → loại thẻ → kỳ hạn (xem trước tiền mỗi tháng) → POST form sang trang VNPay ───
     GET /api/pay/installment/options → { amount, banks, need }; need = thông tin VNPay cần mà đơn chưa có (email / địa chỉ / tỉnh thành) */
  var ISP = null;
  var NEED = { email: ['isp.email', 'Email', 'Email', 'email', 'email'], address: ['isp.address', 'Địa chỉ', 'Address', 'text', 'street-address'],
    city: ['isp.city', 'Tỉnh / thành phố', 'City / province', 'text', 'address-level1'] };
  S.ispClose = function () { var b = document.getElementById('dcIsp'); if (b) b.remove(); ISP = null; };
  S.isp = function (ref, lang) {
    if (!ref || !ref.k) return;
    lang = lang === 'en' ? 'en' : 'vi';
    S.ispClose();
    var back = document.activeElement;
    ISP = { ref: ref, lang: lang, data: null, bank: '', scheme: '', term: 0, info: {}, back: back };
    document.body.insertAdjacentHTML('beforeend', '<div id="dcIsp" class="dc-isp" role="dialog" aria-modal="true" aria-labelledby="dcIspT"><div class="dc-isp-in">' +
      '<button type="button" class="dc-isp-x" aria-label="' + (lang === 'en' ? 'Close' : 'Đóng') + '">✕</button>' +
      '<h3 id="dcIspT">' + DC.esc(L('isp.title', 'Trả góp qua thẻ tín dụng', 'Pay in installments', lang)) + '</h3>' +
      '<div class="dc-isp-body" aria-live="polite"><p class="dc-isp-wait">' + DC.esc(L('isp.loading', 'Đang tải danh sách ngân hàng…', 'Loading banks…', lang)) + '</p></div></div></div>');
    document.querySelector('#dcIsp .dc-isp-x').focus({ preventScroll: true });
    var mine = ISP;
    fetch('/api/pay/installment/options?code=' + encodeURIComponent(ref.code) + '&k=' + encodeURIComponent(ref.k) + '&lang=' + lang)
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error || L('payerr', 'Chưa mở được cổng thanh toán, vui lòng thử lại.', "Couldn't open the payment gateway, please try again.", lang)); return d; }); },
        function () { throw new Error(DC.tx('global.err.net', 'Mất kết nối mạng. Kiểm tra mạng rồi thử lại.', 'Network error. Check your connection and try again.')); })
      .then(function (d) {
        if (ISP !== mine) return;
        ISP.data = { amount: d.amount || 0, banks: Array.isArray(d.banks) ? d.banks : [], need: Array.isArray(d.need) ? d.need.filter(function (k) { return NEED[k]; }) : [] };
        if (ISP.data.banks.length === 1) ISP.bank = ISP.data.banks[0].code;
        ispRender();
      }, function (x) {
        if (ISP !== mine) return;
        var b = document.querySelector('#dcIsp .dc-isp-body');
        if (b) b.innerHTML = '<p class="dc-isp-err">' + DC.esc(x.message) + '</p>';
      });
  };
  function ispPick() {
    var d = ISP.data, bank = d.banks.filter(function (b) { return b.code === ISP.bank; })[0] || null;
    var scheme = bank ? (bank.schemes.length === 1 ? bank.schemes[0] : bank.schemes.filter(function (s) { return s.scheme === ISP.scheme; })[0]) || null : null;
    var term = scheme ? scheme.terms.filter(function (t) { return t.n === ISP.term; })[0] || null : null;
    return { bank: bank, scheme: scheme, term: term };
  }
  function ispRender(focusSel) {
    var box = document.getElementById('dcIsp'), body = box && box.querySelector('.dc-isp-body');
    if (!body || !ISP || !ISP.data) return;
    var lang = ISP.lang, d = ISP.data, e = DC.esc, p = ispPick(), mo = function (n) { return money(n, lang); };
    if (!d.banks.length) { body.innerHTML = '<p class="dc-isp-err">' + e(L('isp.none', 'Hiện chưa có ngân hàng nào nhận trả góp cho số tiền này.', 'No bank currently offers installments for this amount.', lang)) + '</p>'; return; }
    var h = '<p class="dc-isp-amt"><span>' + e(L('isp.amount', 'Số tiền trả góp', 'Amount', lang)) + '</span><b>' + e(mo(d.amount)) + '</b></p>';
    h += '<p class="dc-isp-h">' + e(L('isp.bank', '1. Ngân hàng phát hành thẻ', '1. Card issuer', lang)) + '</p><div class="dc-isp-grid">' + d.banks.map(function (b) {
      var on = p.bank && p.bank.code === b.code;
      return '<button type="button" class="dc-isp-opt' + (on ? ' on' : '') + '" data-isp-bank="' + e(b.code) + '" aria-pressed="' + !!on + '">' +
        (b.logo ? '<img src="' + e(b.logo) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '') + '<span>' + e(b.name || b.code) + '</span></button>';
    }).join('') + '</div>';
    if (p.bank) h += '<p class="dc-isp-h">' + e(L('isp.card', '2. Loại thẻ', '2. Card type', lang)) + '</p><div class="dc-isp-grid dc-isp-grid--sm">' + p.bank.schemes.map(function (s) {
      var on = p.scheme && p.scheme.scheme === s.scheme;
      return '<button type="button" class="dc-isp-opt' + (on ? ' on' : '') + '" data-isp-scheme="' + e(s.scheme) + '" aria-pressed="' + !!on + '">' +
        (s.logo ? '<img src="' + e(s.logo) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '') + '<span>' + e(s.scheme) + '</span></button>';
    }).join('') + '</div>';
    if (p.scheme) h += '<p class="dc-isp-h">' + e(L('isp.term', '3. Kỳ hạn', '3. Term', lang)) + '</p><div class="dc-isp-terms">' + p.scheme.terms.map(function (t) {
      var on = p.term && p.term.n === t.n;
      return '<button type="button" class="dc-isp-term' + (on ? ' on' : '') + '" data-isp-term="' + t.n + '" aria-pressed="' + !!on + '">' +
        '<b>' + e(L('isp.months', '{n} tháng', '{n} months', lang).replace('{n}', t.n)) + '</b>' +
        '<strong>' + e(mo(t.monthly)) + '<small>' + e(L('isp.monthly', '/tháng', '/month', lang)) + '</small></strong>' +
        '<span>' + e(L('isp.total', 'Tổng trả', 'Total', lang)) + ': ' + e(mo(t.total)) + '</span>' +
        '<span>' + e(t.fee ? L('isp.fee', 'Phí chuyển đổi', 'Conversion fee', lang) + ': ' + mo(t.fee) : L('isp.nofee', 'Không phí chuyển đổi', 'No conversion fee', lang)) + '</span></button>';
    }).join('') + '</div>';
    if (p.term && d.need.length) h += '<p class="dc-isp-h">' + e(L('isp.info', '4. Thông tin VNPay cần', '4. Details VNPay needs', lang)) + '</p><div class="dc-isp-info">' + d.need.map(function (k) {
      var n = NEED[k];
      return '<label><span>' + e(L(n[0], n[1], n[2], lang)) + '</span><input type="' + n[3] + '" data-isp-info="' + k + '" autocomplete="' + n[4] + '" value="' + e(ISP.info[k] || '') + '" required></label>';
    }).join('') + '</div>';
    h += '<p class="dc-isp-err" role="alert" hidden></p>' +
      '<button type="button" class="dc-isp-go" data-isp-go' + (p.term ? '' : ' disabled') + '>' + e(L('isp.go', 'Tiếp tục sang VNPay', 'Continue to VNPay', lang)) + '</button>' +
      '<p class="dc-isp-note">' + e(L('isp.note', 'Bạn sẽ nhập thông tin thẻ tín dụng ở trang bảo mật của VNPay.', "You'll enter your credit card details on VNPay's secure page.", lang)) + '</p>';
    body.innerHTML = h;
    var f = focusSel && body.querySelector(focusSel);
    if (f) f.focus({ preventScroll: true });
  }
  function ispGo(btn) {
    var box = document.getElementById('dcIsp'), err = box.querySelector('.dc-isp-err'), lang = ISP.lang, p = ispPick();
    var fail = function (m) { err.textContent = m; err.hidden = false; };
    if (!p.term) return fail(L('isp.pick', 'Vui lòng chọn ngân hàng, loại thẻ và kỳ hạn', 'Please choose a bank, card type and term', lang));
    var body = { code: ISP.ref.code, k: ISP.ref.k, issuer: p.bank.code, scheme: p.scheme.scheme, term: p.term.n, lang: lang }, miss = null;
    ISP.data.need.forEach(function (k) { var v = String(ISP.info[k] || '').trim(); body[k] = v; if (!v && !miss) miss = box.querySelector('[data-isp-info="' + k + '"]'); });
    if (miss) { miss.focus(); return fail(L('isp.fill', 'Vui lòng điền đủ thông tin', 'Please fill in all details', lang)); }
    err.hidden = true; btn.disabled = true; btn.classList.add('dc-busy');
    DC.api('/pay/installment/create', body).then(function (r) {
      if (!r || !r.action || !r.fields) throw new Error(L('payerr', 'Chưa mở được cổng thanh toán, vui lòng thử lại.', "Couldn't open the payment gateway, please try again.", lang));
      S.goOverlay(lang);
      var form = document.createElement('form');
      form.method = 'POST'; form.action = r.action; form.style.display = 'none';
      Object.keys(r.fields).forEach(function (k) { var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = r.fields[k]; form.appendChild(i); });
      document.body.appendChild(form);
      form.submit();
    }).catch(function (x) { btn.disabled = false; btn.classList.remove('dc-busy'); fail(x.message); });
  }
  document.addEventListener('click', function (e) {
    var box = document.getElementById('dcIsp');
    if (!box || !ISP || !box.contains(e.target)) return;
    var t = e.target.closest('button'), back = ISP.back;
    if (e.target === box || (t && t.classList.contains('dc-isp-x'))) { S.ispClose(); if (back && back.focus) back.focus({ preventScroll: true }); return; }
    if (!t || !ISP.data) return;
    if (t.hasAttribute('data-isp-bank')) { ISP.bank = t.getAttribute('data-isp-bank'); ISP.scheme = ''; ISP.term = 0; ispRender('[data-isp-bank="' + ISP.bank + '"]'); }
    else if (t.hasAttribute('data-isp-scheme')) { ISP.scheme = t.getAttribute('data-isp-scheme'); ISP.term = 0; ispRender('[data-isp-scheme="' + ISP.scheme + '"]'); }
    else if (t.hasAttribute('data-isp-term')) { ISP.term = +t.getAttribute('data-isp-term'); ispRender('[data-isp-term="' + ISP.term + '"]'); }
    else if (t.hasAttribute('data-isp-go') && !t.disabled) ispGo(t);
  });
  document.addEventListener('input', function (e) { var k = ISP && e.target.getAttribute && e.target.getAttribute('data-isp-info'); if (k) ISP.info[k] = e.target.value; });
  // Esc đóng bảng trả góp (không đóng luôn màn hình phía sau)
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !document.getElementById('dcIsp')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var back = ISP && ISP.back; S.ispClose(); if (back && back.focus) back.focus({ preventScroll: true });
  }, true);
  // theo dõi phiếu tới khi đã nhận tiền: mỗi 'every' ms, tối đa 'max' ms, chỉ khi trang đang hiện; mỗi phiếu 1 vòng theo dõi
  var W = {};
  // alive (tùy chọn): khung thanh toán còn hiện không — đóng khung thì thôi theo dõi
  S.watch = function (ref, every, max, onPaid, alive) {
    if (!ref || !ref.k) return null;
    var w = W[ref.code];
    if (w && !w.done) { w.onPaid = onPaid; w.alive = alive; return w; }
    w = W[ref.code] = { done: false, onPaid: onPaid, alive: alive, until: Date.now() + max, t: null };
    var tick = function () {
      w.t = null;
      if (w.done) return;
      if (Date.now() > w.until || (w.alive && !w.alive())) { w.done = true; return; }
      if (document.hidden) return;                       // tạm dừng khi ẩn trang — hiện lại thì chạy tiếp
      S.load(ref, false).then(function (d) {
        if (w.done) return;
        if (d.paid) { w.done = true; w.data = d; if (w.onPaid) w.onPaid(d); return; }
        w.t = setTimeout(tick, every);
      }, function () { if (!w.done) w.t = setTimeout(tick, every); });
    };
    w.stop = function () { w.done = true; if (w.t) clearTimeout(w.t); };
    w.vis = function () { if (!w.done && !document.hidden && !w.t) w.t = setTimeout(tick, 300); };
    document.addEventListener('visibilitychange', w.vis);
    w.t = setTimeout(tick, every);
    return w;
  };
  S.unwatch = function (ref) { var w = ref && W[ref.code]; if (w) w.stop(); };
  // khung thanh toán ở màn đặt hàng / đăng ký thành công: nút cổng (nếu còn dùng được) + theo dõi đã nhận tiền (chuyển khoản tự xác nhận)
  S.live = function (box, ref, lang, opt) {
    opt = opt || {};
    if (!ref || !ref.k) return;
    S.load(ref, false).then(function (d) {
      if (d.paid) { if (opt.onPaid) opt.onPaid(d); return; }
      if (box && opt.buttons !== false) box.innerHTML = S.payBtns(ref, d.online, lang);
      if (opt.poll) S.watch(ref, 5000, 15 * 60 * 1000, function (x) { if (opt.onPaid) opt.onPaid(x); }, opt.alive);
    }, function () {});
  };
  // khung nút trên màn hình đặt hàng / đăng ký thành công
  S.box = function (ref, lang) {
    if (!ref || !ref.k) return '';
    return '<div class="dc-slipbox"><p>' + DC.esc(L('box', 'Lưu phiếu xác nhận để đối chiếu khi cần.', 'Save your confirmation for reference.', lang)) + '</p>' +
      '<div class="dc-slipbox-btns"><button type="button" class="dc-slip-dl" data-slip="' + DC.esc(ref.code) + '" data-k="' + DC.esc(ref.k) + '">' + DC.esc(L('btn.download', 'Tải phiếu xác nhận (ảnh)', 'Download confirmation (image)', lang)) + '</button>' +
      '<a class="dc-slip-view" href="' + S.url(ref) + '" target="_blank" rel="noopener" data-newtab>' + DC.esc(L('btn.view', 'Xem / in phiếu', 'View / print', lang)) + '</a></div>' +
      '<p class="dc-slip-err" role="alert" hidden></p></div>';
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.dc-slip-dl');
    if (!b) return;
    e.preventDefault();
    if (b.disabled) return;
    b.disabled = true; b.classList.add('dc-busy');
    var box = b.closest('.dc-slipbox'), msg = box && box.querySelector('.dc-slip-err');
    if (msg) { msg.hidden = true; msg.textContent = ''; }
    S.download({ code: b.dataset.slip, k: b.dataset.k }, DC.lang()).catch(function () {
      if (msg) { msg.textContent = S.dlError(DC.lang()); msg.hidden = false; }
    }).then(function () { b.disabled = false; b.classList.remove('dc-busy'); });
  });
})();
