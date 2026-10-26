/*
 * Thanh toán online: SePay (tự xác nhận chuyển khoản), VNPay, MoMo.
 * Kết quả từ cổng được giả lập đúng định dạng + chữ ký trong tài liệu (ký độc lập bằng crypto ở đây, không dùng mã của web).
 */
const crypto = require('crypto');

module.exports = async function payTests(env, t) {
  const B = env.base;
  let ip = 0;
  const req = async (url, o = {}) => {
    const r = await fetch(B + url, { method: o.method || 'GET', redirect: 'manual',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.4.' + (++ip >> 8 & 255) + '.' + (ip & 255), ...(o.admin ? { Authorization: 'Bearer ' + env.adminToken } : {}), ...(o.headers || {}) },
      body: o.body ? JSON.stringify(o.body) : undefined });
    const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch { /* không phải JSON */ }
    return { s: r.status, j, loc: r.headers.get('location') };
  };
  const VNP_SECRET = 'VNPAYTESTSECRET0123456789ABCDEF', MOMO = { partnerCode: 'MOMOTEST', accessKey: 'ACCESSKEYTEST', secretKey: 'SECRETKEYTEST0123456789' }, SEPAY = 'sepay-key-thu-123';
  const vnpEnc = s => encodeURIComponent(String(s)).replace(/%20/g, '+');
  const vnpSign = p => crypto.createHmac('sha512', VNP_SECRET).update(Object.keys(p).sort().map(k => vnpEnc(k) + '=' + vnpEnc(p[k])).join('&')).digest('hex');
  const momoSign = p => crypto.createHmac('sha256', MOMO.secretKey).update(`accessKey=${MOMO.accessKey}&amount=${p.amount}&extraData=${p.extraData}&message=${p.message}&orderId=${p.orderId}&orderInfo=${p.orderInfo}&orderType=${p.orderType}&partnerCode=${p.partnerCode}&payType=${p.payType}&requestId=${p.requestId}&responseTime=${p.responseTime}&resultCode=${p.resultCode}&transId=${p.transId}`).digest('hex');
  const prods = (await req('/api/products')).j, p = prods.find(x => x.stock > 10 && !x.stockBy) || prods[0];
  const order = (pay, extra = {}) => req('/api/orders', { method: 'POST', body: { customer: { name: 'Khách Online', phone: '0933444555', address: '5 Hai Bà Trưng', city: 'TP. Hồ Chí Minh' }, items: [{ id: p.id, qty: 1, size: p.sizes[0], color: p.colors[0][0] }], pay, ship: 'std', ...extra } });
  const getOrder = async id => (await req('/api/orders', { admin: true })).j.find(o => o.id === id);

  t.section('Thanh toán online (SePay / VNPay / MoMo)');
  await t.run('cấu hình', async () => {
    let r = await req('/api/settings', { method: 'PUT', admin: true, body: { pay: { sepay: { enabled: true, apiKey: SEPAY }, vnpay: { enabled: true, sandbox: true, tmnCode: 'DCTEST01', hashSecret: VNP_SECRET }, momo: { enabled: true, sandbox: true, ...MOMO } } } });
    t.ok(r.s === 200 && r.j.pay.vnpay.hashSecret === '' && r.j.pay.vnpay.hashSecretSet && r.j.pay.momo.secretKeySet && r.j.pay.sepay.apiKeySet, 'lưu cấu hình cổng — khóa bí mật không trả về trình duyệt', r.j && r.j.pay);
    const pub = await fetch(B + '/assets/data/cms.js').then(x => x.text());
    t.ok(/"payOnline":\{"vnpay":true,"momo":true,"auto":true\}/.test(pub) && !pub.includes(VNP_SECRET) && !pub.includes(MOMO.secretKey) && !pub.includes(SEPAY), 'trang web biết cổng nào đang bật, không lộ khóa');
  });

  await t.run('SePay', async () => {
    let r = await order('bank');
    const o = await getOrder(r.j.id), code = o.code.replace(/[^A-Z0-9]/gi, '');
    const hook = (body, key = SEPAY) => req('/api/pay/sepay/webhook', { method: 'POST', headers: key ? { Authorization: 'Apikey ' + key } : {}, body });
    r = await hook({ id: 9001, transferType: 'in', transferAmount: o.total, content: 'MBVCB.123 ' + code + ' chuyen tien' }, 'sai-khoa');
    t.ok(r.s === 401, 'SePay: sai khóa → từ chối');
    r = await hook({ id: 9001, gateway: 'Vietcombank', transferType: 'in', transferAmount: o.total, content: 'MBVCB.12345.' + code.slice(0, 2) + '-' + code.slice(2) + '.CT tu 0123', referenceCode: 'FT1' });
    let o2 = await getOrder(o.id);
    t.ok(r.s === 200 && r.j.success === true && o2.paid === true && o2.paidAmount === o.total && o2.payments.length === 1, 'SePay: tiền về đủ → đơn tự chuyển "Đã nhận tiền" (mã đơn trong nội dung chuyển khoản)', { paid: o2.paid, payments: o2.payments });
    r = await hook({ id: 9001, transferType: 'in', transferAmount: o.total, content: code });
    o2 = await getOrder(o.id);
    t.ok(r.j.success === true && o2.payments.length === 1, 'SePay gửi lại cùng giao dịch → không ghi 2 lần');
    r = await hook({ id: 9002, transferType: 'in', transferAmount: 50000, content: 'chuyen tien an trua' });
    t.ok(r.j.success === true, 'giao dịch không có mã đơn → bỏ qua, vẫn trả thành công cho SePay');
    // đăng ký: chuyển thiếu rồi chuyển nốt
    r = await req('/api/registrations', { method: 'POST', body: { name: 'Học Viên CK', phone: '0933444666', program: 'gt', pkg: '1', opt: 'am', pay: 'full', lang: 'vi' } });
    const reg = (await req('/api/registrations', { admin: true })).j.find(x => x.id === r.j.id), rc = reg.code.replace(/[^A-Z0-9]/gi, '');
    await hook({ id: 9003, transferType: 'in', transferAmount: Math.floor(reg.due / 2), content: rc });
    let reg2 = (await req('/api/registrations', { admin: true })).j.find(x => x.id === reg.id);
    t.ok(!reg2.paid && reg2.history.some(h => /còn thiếu/.test(h.note || '')), 'chuyển thiếu → chưa tính đã trả, ghi "còn thiếu" để gọi khách', reg2.history.slice(-1));
    await hook({ id: 9004, transferType: 'in', transferAmount: reg.due - Math.floor(reg.due / 2), content: rc });
    reg2 = (await req('/api/registrations', { admin: true })).j.find(x => x.id === reg.id);
    t.ok(reg2.paid === true && reg2.paidAmount === reg.due, 'chuyển nốt phần còn lại → đã nhận đủ', { paid: reg2.paid, paidAmount: reg2.paidAmount });
    r = await req(`/api/slip/${r.j.slip.code}?k=${r.j.slip.k}`);
    t.ok(r.j.paid === true && r.j.pay === null && r.j.online.length === 0 && r.j.payments.length === 2, 'phiếu xác nhận: đã thanh toán, ẩn mã QR, không còn nút thanh toán', r.j);
  });

  await t.run('VNPay', async () => {
    let r = await order('vnpay', { lang: 'en' });
    t.ok(r.s === 201 && /^https:\/\/sandbox\.vnpayment\.vn\/paymentv2\/vpcpay\.html\?/.test(r.j.payUrl || ''), 'đặt hàng chọn VNPay → nhận link sang VNPay', r.j);
    const u = new URL(r.j.payUrl), q = Object.fromEntries(u.searchParams);
    const { vnp_SecureHash, ...unsigned } = q;
    t.ok(vnpSign(unsigned) === vnp_SecureHash && q.vnp_Amount === String((await getOrder(r.j.id)).total * 100) && q.vnp_TmnCode === 'DCTEST01' && q.vnp_Locale === 'en' && /^\d{14}$/.test(q.vnp_CreateDate),
      'link VNPay đúng chuẩn 2.1.0: chữ ký HMAC-SHA512, số tiền ×100, mã website, giờ tạo', q);
    // mã giao dịch: <mã đơn>T<số> — phần sau T chỉ có chữ số (trước đây dùng base36, có lúc chứa chữ T → không tìm ra đơn)
    t.ok(/^DC\d{6}T\d{13}$/.test(q.vnp_TxnRef), 'mã giao dịch gửi cổng không lẫn chữ T trong phần thời gian', q.vnp_TxnRef);
    const ipn = extra => { const pr = { vnp_Amount: q.vnp_Amount, vnp_BankCode: 'NCB', vnp_OrderInfo: q.vnp_OrderInfo, vnp_PayDate: '20261026120000', vnp_ResponseCode: '00', vnp_TmnCode: 'DCTEST01', vnp_TransactionNo: '14000001', vnp_TransactionStatus: '00', vnp_TxnRef: q.vnp_TxnRef, ...extra }; return { ...pr, vnp_SecureHash: vnpSign(pr) }; };
    const qs = o => '?' + new URLSearchParams(o).toString();
    r = await req('/api/pay/vnpay/ipn' + qs({ ...ipn(), vnp_SecureHash: 'abc' }));
    t.ok(r.j.RspCode === '97', 'IPN sai chữ ký → 97', r.j);
    r = await req('/api/pay/vnpay/ipn' + qs(ipn({ vnp_Amount: '100' })));
    t.ok(r.j.RspCode === '97' || r.j.RspCode === '04', 'IPN sửa số tiền → không chấp nhận', r.j);
    r = await req('/api/pay/vnpay/ipn' + qs(ipn()));
    const oid = (await req('/api/orders', { admin: true })).j.find(o => o.code.replace(/[^A-Z0-9]/gi, '') === q.vnp_TxnRef.split('T')[0]).id;
    let o = await getOrder(oid);
    t.ok(r.j.RspCode === '00' && o.paid && o.payments[0].provider === 'vnpay', 'IPN thành công → 00, đơn "Đã nhận tiền"', { r: r.j, paid: o.paid });
    r = await req('/api/pay/vnpay/ipn' + qs(ipn()));
    t.ok(r.j.RspCode === '02', 'IPN gửi lại → 02 (đã xác nhận), không ghi 2 lần', r.j);
    r = await req('/api/pay/vnpay/return' + qs(ipn()));
    o = await getOrder(oid);
    t.ok(r.s === 302 && /^\/phieu\/DC-\d+\?k=[a-f0-9]+&pay=ok$/.test(r.loc) && o.payments.length === 1, 'khách quay về → chuyển tới phiếu xác nhận (pay=ok)', r.loc);
    // khách hủy
    r = await order('vnpay');
    const q2 = Object.fromEntries(new URL(r.j.payUrl).searchParams);
    const cancel = (() => { const pr = { vnp_Amount: q2.vnp_Amount, vnp_ResponseCode: '24', vnp_TmnCode: 'DCTEST01', vnp_TransactionNo: '0', vnp_TransactionStatus: '02', vnp_TxnRef: q2.vnp_TxnRef }; return { ...pr, vnp_SecureHash: vnpSign(pr) }; })();
    r = await req('/api/pay/vnpay/return' + qs(cancel));
    t.ok(r.s === 302 && /pay=cancel$/.test(r.loc), 'khách hủy ở VNPay → phiếu báo đã hủy', r.loc);
    const slip = (await req('/api/orders', { admin: true })).j.find(x => x.code.replace(/[^A-Z0-9]/gi, '') === q2.vnp_TxnRef.split('T')[0]);
    r = await req(`/api/slip/${slip.code.replace('#', '')}?k=${slip.confirm.token}`);
    t.ok(r.j.paid === false && r.j.online.includes('vnpay') && r.j.online.includes('momo'), 'chưa trả → phiếu cho chọn thanh toán lại (VNPay / MoMo)', r.j.online);
    r = await req('/api/pay/vnpay/create', { method: 'POST', body: { code: slip.code.replace('#', ''), k: slip.confirm.token } });
    t.ok(r.s === 200 && /vpcpay\.html\?/.test(r.j.url), 'thanh toán lại từ phiếu → link VNPay mới', r.j);
  });

  await t.run('MoMo', async () => {
    let r = await order('momo');
    t.ok(r.s === 201 && /test-payment\.momo\.vn/.test(r.j.payUrl || ''), 'đặt hàng chọn MoMo (cổng bật) → nhận link sang MoMo', r.j);
    const ref = new URL(r.j.payUrl).searchParams.get('orderId'), o0 = await getOrder(r.j.id);
    const body = { partnerCode: MOMO.partnerCode, orderId: ref, requestId: ref, amount: o0.total, orderInfo: 'Dapper Combat ' + ref.split('T')[0], orderType: 'momo_wallet', transId: 31000001, resultCode: 0, message: 'Successful.', payType: 'qr', responseTime: Date.now(), extraData: '' };
    r = await req('/api/pay/momo/ipn', { method: 'POST', body: { ...body, signature: 'sai' } });
    let o = await getOrder(o0.id);
    t.ok(r.s === 204 && !o.paid, 'IPN MoMo sai chữ ký → bỏ qua');
    r = await req('/api/pay/momo/ipn', { method: 'POST', body: { ...body, signature: momoSign(body) } });
    o = await getOrder(o0.id);
    t.ok(r.s === 204 && o.paid && o.payments[0].provider === 'momo', 'IPN MoMo đúng → 204, đơn "Đã nhận tiền"', { paid: o.paid });
  });

  await req('/api/settings', { method: 'PUT', admin: true, body: { pay: { sepay: { enabled: false }, vnpay: { enabled: false }, momo: { enabled: false } } } });
};
