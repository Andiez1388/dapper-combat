/*
 * Máy chủ trả góp VNPay giả cho bộ kiểm tra: đúng đường dẫn, kiểu dữ liệu và chuỗi ký trong đặc tả VNPAY Installment 2.1.1.
 * Tự tính lại chữ ký web gửi sang (độc lập với lib/payments.js), cấp token, trả bảng ngân hàng / kỳ hạn và mã giao dịch.
 *   S.auths: số lần đăng nhập · S.inits: các lần khởi tạo (body, ok = chữ ký đúng, missing = trường bắt buộc còn trống)
 *   S.pays: form trình duyệt POST sang trang thanh toán (ispTxnId, tmnCode, dataKey)
 *   S.expireNext = true → lần gọi kế tiếp trả 401 (token hết hạn sớm)
 */
const http = require('http');
const crypto = require('crypto');

function start(cfg) {   // cfg: { clientId, username, password, tmnCode, secretKey }
  const S = { auths: 0, inits: [], pays: [], expireNext: false, tokens: new Set() };
  const sign = s => crypto.createHmac('sha512', cfg.secretKey).update(Buffer.from(String(s), 'utf8')).digest('hex');
  const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      const u = new URL(req.url, 'http://x'), path = u.pathname.replace(/^\/isp-svc/, '');
      // trang thanh toán: trình duyệt của khách POST form (ispTxnId, tmnCode, dataKey)
      if (req.method === 'POST' && path === '/payment/pay') {
        S.pays.push(Object.fromEntries(new URLSearchParams(raw)));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end('<!doctype html><title>VNPAY</title><h1>Trang thanh toán trả góp (giả)</h1>');
      }
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { return send(res, 400, { rspCode: '95', rspMsg: 'Invalid request' }); }
      if (req.method === 'POST' && path === '/oauth/authenticate') {
        S.auths++;
        if (body.clientId !== cfg.clientId || body.username !== cfg.username || body.password !== cfg.password) return send(res, 200, { rspCode: '01', rspMsg: 'Authentication failure (wrong username or password)' });
        const tok = 'tok' + S.auths;
        S.tokens.add(tok);
        return send(res, 200, { rspCode: '00', rspMsg: 'Authentication successful', data: { accessToken: tok, refreshToken: 'r' + tok, tokenType: 'Bearer', expiresIn: 665 } });
      }
      const auth = /^Bearer (.+)$/.exec(req.headers.authorization || '');
      if (!auth || !S.tokens.has(auth[1])) return send(res, 401, { rspCode: '01', rspMsg: 'Unauthorized' });
      if (S.expireNext) { S.expireNext = false; S.tokens.clear(); return send(res, 401, { rspCode: '01', rspMsg: 'Token expired' }); }
      if (req.method === 'GET' && path === '/category/installment-info') {
        const q = Object.fromEntries(u.searchParams);
        if (q.secureHash !== sign(`${q.tmnCode}|${q.amount}|${q.currCode}`)) return send(res, 200, { rspCode: '97', rspMsg: 'Invalid checksum' });
        const amt = Number(q.amount);   // ×100
        const ri = n => ({ recurringNumberOfIsp: n, recurringFrequency: 'monthly', amount: amt, recurringAmount: Math.round(amt * 1.02 / n), totalIspAmount: Math.round(amt * 1.02), ispFeeAmount: Math.round(amt * 0.02), currCode: 'VND' });
        return send(res, 200, { rspCode: '00', rspMsg: 'Successfully', data: [
          { issuerCode: 'VIETCOMBANK', issuerName: 'Ngan hang Vietcombank', logoUrl: ' https://vnpay.vn/vcb.png ',
            schemes: [{ scheme: 'VISA', logoUrl: 'https://vnpay.vn/visa.png', recurringInfo: [ri(3), ri(6), ri(12), ri(24)] }, { scheme: 'MASTERCARD', logoUrl: '', recurringInfo: [ri(6)] }] },
          { issuerCode: 'ACB', issuerName: 'Ngan hang ACB', logoUrl: 'javascript:alert(1)', schemes: [{ scheme: 'JCB', recurringInfo: [ri(9)] }] },
        ] });
      }
      if (req.method === 'POST' && path === '/payment/init') {
        const t = body.transaction || {}, ci = body.customerInfo || {}, o = body.order || {};
        const data = [body.reqId, o.orderReference, o.orderInfo, body.tmnCode, t.issuerCode, t.scheme, t.recurringFrequency, t.recurringNumberOfIsp, t.amount, t.currCode,
          body.addData, ci.identityCode, ci.forename, ci.surname, ci.mobile, ci.email, ci.address, ci.city, ci.country, body.ipAddr, body.userAgent,
          t.returnUrl, t.cancelUrl, body.version, body.locale, t.mcDate, t.expiryDate].map(v => (v == null ? '' : v)).join('|');
        const ok = body.secureHash === sign(data);
        const missing = [].concat(['reqId', 'tmnCode', 'ipAddr', 'userAgent', 'version'].filter(k => !body[k]), ['orderReference', 'orderInfo'].filter(k => !o[k]),
          ['amount', 'currCode', 'returnUrl', 'cancelUrl', 'mcDate'].filter(k => !t[k]), ['forename', 'surname', 'mobile', 'email', 'address', 'city', 'country'].filter(k => !ci[k]));
        S.inits.push({ body, ok, missing });
        if (!ok) return send(res, 200, { rspCode: '97', rspMsg: 'Invalid checksum' });
        if (missing.length) return send(res, 200, { rspCode: '95', rspMsg: 'Invalid request', errorDetails: missing.map(f => ({ field: f, reason: 'required' })) });
        const id = '6668219255' + String(S.inits.length).padStart(8, '0'), dataKey = 'dk.' + crypto.randomBytes(8).toString('hex');
        const back = { rspCode: '00', rspMsg: 'Init successful', addData: '', transaction: { id, amount: t.amount, currCode: 'VND' }, dataKey };
        back.secureHash = sign([back.rspCode, back.rspMsg, id, t.amount, 'VND', '', dataKey].join('|'));
        return send(res, 200, back);
      }
      send(res, 404, { rspCode: '95', rspMsg: 'Not found' });
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    S.base = `http://127.0.0.1:${server.address().port}/isp-svc`;
    // đóng luôn kết nối giữ sẵn (keep-alive) của trình duyệt, không chờ trình duyệt tự đóng
    S.stop = () => new Promise(r => { server.close(r); server.closeAllConnections(); });
    resolve(S);
  }));
}

module.exports = { start };
