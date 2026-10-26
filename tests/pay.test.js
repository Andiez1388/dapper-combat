/*
 * Thanh toán online: SePay (tự xác nhận chuyển khoản — cả khi khách chọn MoMo / ZaloPay quét mã VietQR), VNPay thẻ, VNPay trả góp.
 * Kết quả từ cổng được giả lập đúng định dạng + chữ ký trong tài liệu (ký độc lập bằng crypto ở đây, không dùng mã của web);
 * trả góp nói chuyện với máy chủ VNPay giả (tests/lib/fake-isp.js).
 */
const crypto = require('crypto');
const fakeIsp = require('./lib/fake-isp');

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
  const VNP_SECRET = 'VNPAYTESTSECRET0123456789ABCDEF', SEPAY = 'sepay-key-thu-123';
  const ISP = { tmnCode: 'DCISP001', clientId: 'DCCLIENT', username: 'dapper', password: 'p@ss "word" 123', clientSecret: 'cs-123', secretKey: 'ISPSECRET0123456789' };
  const vnpEnc = s => encodeURIComponent(String(s)).replace(/%20/g, '+');
  const signWith = (key, p) => crypto.createHmac('sha512', key).update(Object.keys(p).sort().map(k => vnpEnc(k) + '=' + vnpEnc(p[k])).join('&')).digest('hex');
  const vnpSign = p => signWith(VNP_SECRET, p), ispSign = p => signWith(ISP.secretKey, p);
  const qs = o => '?' + new URLSearchParams(o).toString();
  const prods = (await req('/api/products')).j, p = prods.find(x => x.stock > 10 && !x.stockBy) || prods[0];
  const cust = { name: 'Khách Online', phone: '0933444555', address: '5 Hai Bà Trưng', city: 'TP. Hồ Chí Minh' };
  const order = (pay, extra = {}, qty = 1, prod = p) => req('/api/orders', { method: 'POST', body: { customer: cust, items: [{ id: prod.id, qty, size: prod.sizes[0], color: prod.colors[0][0] }], pay, ship: 'std', ...extra } });
  const getOrder = async id => (await req('/api/orders', { admin: true })).j.find(o => o.id === id);
  const slipOf = o => req(`/api/slip/${o.code.replace('#', '')}?k=${o.confirm.token}`);
  const isp = await fakeIsp.start(ISP);
  const MIN = 1000000;

  t.section('Thanh toán online (SePay / VNPay thẻ / VNPay trả góp)');
  await t.run('cấu hình', async () => {
    let r = await req('/api/settings', { method: 'PUT', admin: true, body: { pay: { sepay: { enabled: true, apiKey: SEPAY }, vnpay: { enabled: true, sandbox: true, tmnCode: 'DCTEST01', hashSecret: VNP_SECRET },
      installment: { enabled: true, apiUrl: isp.base + '/', ...ISP, minAmount: '1.000.000' } } } });
    const ins = r.j && r.j.pay.installment;
    t.ok(r.s === 200 && r.j.pay.vnpay.hashSecret === '' && r.j.pay.vnpay.hashSecretSet && r.j.pay.sepay.apiKeySet && ins.password === '' && ins.passwordSet && ins.secretKeySet && ins.clientSecretSet,
      'lưu cấu hình cổng — khóa bí mật / mật khẩu không trả về trình duyệt', r.j && r.j.pay);
    t.ok(ins.apiUrl === isp.base && ins.minAmount === MIN && ins.tmnCode === ISP.tmnCode && !r.j.pay.momo, 'trả góp: địa chỉ API (bỏ "/" cuối), mức tối thiểu; không còn cổng MoMo riêng', ins);
    const pub = await fetch(B + '/assets/data/cms.js').then(x => x.text());
    t.ok(/"payOnline":\{"vnpay":true,"installment":true,"installmentMin":1000000,"auto":true\}/.test(pub) && ![VNP_SECRET, SEPAY, ISP.secretKey, ISP.password, ISP.clientSecret].some(s => pub.includes(s)),
      'trang web biết cổng nào đang bật (thẻ, trả góp + mức tối thiểu), không lộ khóa');
    r = await req('/api/settings', { method: 'PUT', admin: true, body: { shop: { checkout: { pay: { bank: false, momo: false, zalopay: false, cod: true } } } } });
    t.ok(r.j.shop.checkout.pay.bank === true && r.j.shop.checkout.pay.cod === undefined, 'tắt hết cách quét mã → tự giữ chuyển khoản; không còn COD', r.j.shop.checkout.pay);
    await req('/api/settings', { method: 'PUT', admin: true, body: { shop: { checkout: { pay: { bank: true, momo: true, zalopay: true } } } } });
    // tài khoản nhận tiền (mã VietQR)
    await req('/api/cms', { method: 'PUT', admin: true, body: { payment: { bankBin: '970436', bankAccount: '0123456789', bankHolder: 'DAPPER COMBAT' } } });
  });

  await t.run('SePay · MoMo · ZaloPay', async () => {
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
    // MoMo / ZaloPay: quét cùng mã VietQR bằng app ví → tiền vào tài khoản ngân hàng → SePay báo về
    for (const wallet of ['momo', 'zalopay']) {
      r = await order(wallet);
      t.ok(r.s === 201 && !r.j.payUrl, wallet + ': đặt hàng → không chuyển sang cổng nào (khách quét mã VietQR)', r.j);
      const w = await getOrder(r.j.id), wc = w.code.replace(/[^A-Z0-9]/gi, '');
      let s = await slipOf(w);
      t.ok(s.j.pay && s.j.pay.wallet === wallet && s.j.pay.amount === w.total && s.j.pay.note === wc && s.j.pay.acc === '0123456789' && !('momo' in s.j.pay), wallet + ': phiếu có mã VietQR vào tài khoản ngân hàng, kèm hướng dẫn quét bằng app ví', s.j.pay);
      await hook({ id: wallet === 'momo' ? 9101 : 9102, transferType: 'in', transferAmount: w.total, content: 'Chuyen tien ' + wc + ' qua vi' });
      s = await slipOf(w);
      t.ok(s.j.paid === true && s.j.payments[0].provider === 'sepay', wallet + ': SePay báo tiền về → đơn đã thanh toán', s.j.payments);
    }
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

  await t.run('VNPay thẻ', async () => {
    let r = await order('vnpay', { lang: 'en' });
    t.ok(r.s === 201 && /^https:\/\/sandbox\.vnpayment\.vn\/paymentv2\/vpcpay\.html\?/.test(r.j.payUrl || ''), 'đặt hàng chọn thẻ (VNPay) → nhận link sang VNPay', r.j);
    const u = new URL(r.j.payUrl), q = Object.fromEntries(u.searchParams);
    const { vnp_SecureHash, ...unsigned } = q;
    t.ok(vnpSign(unsigned) === vnp_SecureHash && q.vnp_Amount === String((await getOrder(r.j.id)).total * 100) && q.vnp_TmnCode === 'DCTEST01' && q.vnp_Locale === 'en' && /^\d{14}$/.test(q.vnp_CreateDate),
      'link VNPay đúng chuẩn 2.1.0: chữ ký HMAC-SHA512, số tiền ×100, mã website, giờ tạo', q);
    // mã giao dịch: <mã đơn>T<số> — phần sau T chỉ có chữ số (trước đây dùng base36, có lúc chứa chữ T → không tìm ra đơn)
    t.ok(/^DC\d{6}T\d{13}$/.test(q.vnp_TxnRef), 'mã giao dịch gửi cổng không lẫn chữ T trong phần thời gian', q.vnp_TxnRef);
    const ipn = extra => { const pr = { vnp_Amount: q.vnp_Amount, vnp_BankCode: 'NCB', vnp_OrderInfo: q.vnp_OrderInfo, vnp_PayDate: '20261026120000', vnp_ResponseCode: '00', vnp_TmnCode: 'DCTEST01', vnp_TransactionNo: '14000001', vnp_TransactionStatus: '00', vnp_TxnRef: q.vnp_TxnRef, ...extra }; return { ...pr, vnp_SecureHash: vnpSign(pr) }; };
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
    r = await slipOf(slip);
    t.ok(r.j.paid === false && r.j.online.includes('vnpay') && r.j.online.every(x => x === 'vnpay' || x === 'installment'), 'chưa trả → phiếu cho chọn thanh toán lại (thẻ / trả góp)', r.j.online);
    r = await req('/api/pay/vnpay/create', { method: 'POST', body: { code: slip.code.replace('#', ''), k: slip.confirm.token } });
    t.ok(r.s === 200 && /vpcpay\.html\?/.test(r.j.url), 'thanh toán lại từ phiếu → link VNPay mới', r.j);
    r = await req('/api/pay/momo/create', { method: 'POST', body: { code: slip.code.replace('#', ''), k: slip.confirm.token } });
    t.ok(r.s === 404, 'không còn cổng MoMo riêng', r.j);
  });

  await t.run('VNPay trả góp', async () => {
    let r = await req('/api/pay/test/installment', { method: 'POST', admin: true });
    t.ok(r.s === 200 && r.j.banks.length === 2 && r.j.banks[0].code === 'VIETCOMBANK' && r.j.banks[0].terms.join() === '3,6,12' && r.j.banks[1].terms.join() === '9',
      'admin "Kiểm tra kết nối": đăng nhập + lấy được bảng trả góp (bỏ kỳ hạn VNPay không hỗ trợ)', r.j);
    const cheap = prods.find(x => x.price + 50000 < MIN && x.stock > 0 && !x.stockBy);
    if (cheap) {
      r = await order('installment', {}, 1, cheap);
      t.ok(r.s === 400 && /1\.000\.000/.test(r.j.error), 'đơn dưới mức tối thiểu → không cho chọn trả góp', r.j);
    }
    const qty = Math.max(1, Math.ceil(MIN / p.price));
    r = await order('installment', {}, qty);
    t.ok(r.s === 201 && r.j.installment === true && !r.j.payUrl, 'đặt hàng chọn trả góp → trang mở bảng chọn ngân hàng / kỳ hạn (chưa sang VNPay)', r.j);
    const o = await getOrder(r.j.id), slip = r.j.slip;
    const opt = await req(`/api/pay/installment/options?code=${slip.code}&k=${slip.k}`);
    const vcb = opt.j && opt.j.banks[0];
    t.ok(opt.s === 200 && opt.j.amount === o.total && vcb.code === 'VIETCOMBANK' && vcb.logo === 'https://vnpay.vn/vcb.png' && opt.j.banks[1].logo === '' &&
      vcb.schemes[0].terms.map(x => x.n).join() === '3,6,12' && vcb.schemes[0].terms[1].monthly === Math.round(Math.round(o.total * 100 * 1.02 / 6) / 100) && vcb.schemes[0].terms[1].fee > 0,
      'bảng trả góp: số tiền đúng (÷100), tiền mỗi tháng + phí, bỏ logo không an toàn', opt.j);
    t.ok(opt.j.need.join() === 'email', 'khách chưa nhập email → bảng chọn hỏi thêm email (VNPay bắt buộc)', opt.j.need);
    const create = extra => req('/api/pay/installment/create', { method: 'POST', body: { code: slip.code, k: slip.k, issuer: 'VIETCOMBANK', scheme: 'VISA', term: 6, ...extra } });
    r = await create({});
    t.ok(r.s === 400 && /email/i.test(r.j.error), 'thiếu email → báo nhập email', r.j);
    r = await create({ term: 24, email: 'tragop@example.com' });
    t.ok(r.s === 400, 'kỳ hạn không hỗ trợ → từ chối', r.j);
    r = await create({ email: 'tragop@example.com', lang: 'en' });
    const init = isp.inits[isp.inits.length - 1], b = init.body;
    t.ok(r.s === 200 && r.j.action === isp.base + '/payment/pay' && r.j.fields.tmnCode === ISP.tmnCode && /^6668219255\d{8}$/.test(r.j.fields.ispTxnId) && /^dk\./.test(r.j.fields.dataKey),
      'khởi tạo xong → form POST sang trang VNPay (ispTxnId, tmnCode, dataKey)', r.j);
    t.ok(init.ok && !init.missing.length && b.version === '2.1.1' && b.locale === 'en' && b.transaction.amount === o.total * 100 && b.transaction.recurringNumberOfIsp === 6 && b.transaction.issuerCode === 'VIETCOMBANK' &&
      /^DC\d{6}T\d{13}$/.test(b.order.orderReference) && /^\d{10,18}$/.test(b.reqId) && /^\d{14}$/.test(b.transaction.mcDate) && /&pay=cancel$/.test(b.transaction.cancelUrl),
      'gửi VNPay đúng đặc tả 2.1.1: chữ ký HMAC-SHA512 đúng thứ tự trường, số tiền ×100, kỳ hạn, mã tham chiếu', { ok: init.ok, missing: init.missing, body: b });
    t.ok(b.customerInfo.forename === 'ONLINE' && b.customerInfo.surname === 'KHACH' && b.customerInfo.mobile === '0933444555' && b.customerInfo.city === 'TP Ho Chi Minh' &&
      b.customerInfo.address === '5 Hai Ba Trung' && b.customerInfo.email === 'tragop@example.com' && b.customerInfo.country === 'VN',
      'thông tin khách: tách họ / tên, tiếng Việt không dấu', b.customerInfo);
    t.ok((await getOrder(o.id)).customer.email === 'tragop@example.com', 'email khách vừa nhập được lưu vào đơn');
    t.ok(isp.auths === 1, 'token đăng nhập VNPay được dùng lại giữa các lần gọi', isp.auths);
    // VNPay báo kết quả (IPN / Return): tham số vnp_* xếp theo tên, ký HMAC-SHA512 bằng secretKey trả góp
    const ref = b.order.orderReference;
    const ipn = extra => { const pr = { vnp_TmnCode: ISP.tmnCode, vnp_TxnRef: ref, vnp_Amount: String(o.total * 100), vnp_OrderInfo: b.order.orderInfo, vnp_TransactionNo: '20261026101521', vnp_CardType: 'ATM',
      vnp_BankCode: 'VISA', vnp_BankTranNo: 'VCB20261026', vnp_ResponseCode: '00', vnp_TransactionStatus: '00', vnp_PayDate: '20261026101520', ...extra }; return { ...pr, vnp_SecureHash: ispSign(pr) }; };
    r = await req('/api/pay/installment/ipn' + qs({ ...ipn(), vnp_SecureHash: signWith(VNP_SECRET, (({ vnp_SecureHash, ...x }) => x)(ipn())) }));
    t.ok(r.j.RspCode === '97', 'IPN trả góp ký bằng khóa khác (khóa cổng thẻ) → 97', r.j);
    r = await req('/api/pay/vnpay/ipn' + qs(ipn()));
    t.ok(r.j.RspCode === '97', 'IPN trả góp gửi nhầm vào đường dẫn cổng thẻ → 97', r.j);
    r = await req('/api/pay/installment/ipn' + qs(ipn({ vnp_Amount: '100' })));
    t.ok(r.j.RspCode === '04', 'IPN sửa số tiền → 04', r.j);
    r = await req('/api/pay/installment/ipn' + qs(ipn()));
    let o2 = await getOrder(o.id);
    t.ok(r.j.RspCode === '00' && r.j.Message === 'Confirm Success' && o2.paid && o2.payments[0].provider === 'installment' && o2.payments[0].amount === o.total, 'IPN trả góp thành công → 00, đơn "Đã nhận tiền"', { r: r.j, payments: o2.payments });
    r = await req('/api/pay/installment/ipn' + qs(ipn()));
    t.ok(r.j.RspCode === '02', 'IPN gửi lại → 02', r.j);
    r = await req('/api/pay/installment/return' + qs(ipn()));
    o2 = await getOrder(o.id);
    t.ok(r.s === 302 && /^\/phieu\/DC-\d+\?k=[a-f0-9]+&pay=ok$/.test(r.loc) && o2.payments.length === 1, 'khách quay về → phiếu xác nhận (pay=ok), không ghi 2 lần', r.loc);
    // token hết hạn sớm → tự đăng nhập lại
    isp.expireNext = true;
    r = await req('/api/pay/test/installment', { method: 'POST', admin: true });
    t.ok(r.s === 200 && isp.auths === 2, 'token hết hạn sớm (401) → tự đăng nhập lại', { s: r.s, auths: isp.auths });
    // đăng ký khóa học (học phí lớn): VNPay cần thêm địa chỉ, tỉnh / thành
    r = await req('/api/registrations', { method: 'POST', body: { name: 'Trần Văn Góp', phone: '+84933444777', program: 'found', pay: 'full', lang: 'vi' } });
    const rs = r.j.slip;
    let s = await req(`/api/slip/${rs.code}?k=${rs.k}`);
    t.ok(s.j.online.includes('installment'), 'đăng ký còn học phí từ mức tối thiểu → phiếu có nút trả góp', s.j.online);
    r = await req(`/api/pay/installment/options?code=${rs.code}&k=${rs.k}`);
    t.ok(r.s === 200 && r.j.need.join() === 'email,address,city', 'đăng ký: hỏi thêm email, địa chỉ, tỉnh / thành', r.j.need);
    r = await req('/api/pay/installment/create', { method: 'POST', body: { code: rs.code, k: rs.k, issuer: 'ACB', scheme: 'JCB', term: 9, email: 'gop@example.com', address: '12 Lý Tự Trọng, Quận 1', city: 'Hồ Chí Minh' } });
    const ci = isp.inits[isp.inits.length - 1].body.customerInfo;
    t.ok(r.s === 200 && ci.forename === 'GOP' && ci.surname === 'TRAN VAN' && ci.mobile === '0933444777' && ci.address === '12 Ly Tu Trong Quan 1' && ci.city === 'Ho Chi Minh',
      'đăng ký: khởi tạo trả góp với thông tin khách vừa bổ sung (SĐT +84 → 0)', { s: r.s, ci });
    // tắt trả góp ở trang thanh toán → không cho trả góp nữa
    await req('/api/settings', { method: 'PUT', admin: true, body: { shop: { checkout: { pay: { installment: false } } } } });
    r = await req(`/api/pay/installment/options?code=${rs.code}&k=${rs.k}`);
    s = await req(`/api/slip/${rs.code}?k=${rs.k}`);
    t.ok(r.s === 400 && !s.j.online.includes('installment'), 'tắt trả góp ở Thiết lập → Bán hàng → phiếu không còn nút trả góp', { s: r.s, online: s.j.online });
    r = await order('installment', {}, qty);
    t.ok(r.s === 400, 'tắt trả góp → không đặt hàng trả góp được', r.j);
    await req('/api/settings', { method: 'PUT', admin: true, body: { shop: { checkout: { pay: { installment: true } } } } });
  });

  await req('/api/settings', { method: 'PUT', admin: true, body: { pay: { sepay: { enabled: false }, vnpay: { enabled: false }, installment: { enabled: false } } } });
  await req('/api/cms', { method: 'PUT', admin: true, body: { payment: { bankBin: '', bankAccount: '', bankHolder: '' } } });
  await isp.stop();
};
