/*
 * Thanh toán online (cấu hình ở /admin → Thanh toán online, lưu trong settings.pay; khóa bí mật không gửi ra trình duyệt):
 *   sepay       — tự xác nhận chuyển khoản: SePay gọi webhook khi tài khoản ngân hàng có tiền vào; nội dung chuyển khoản chứa mã đơn (vd DC871627).
 *                 Khách trả bằng app ngân hàng, MoMo hay ZaloPay đều quét cùng một mã VietQR → tiền về tài khoản ngân hàng → SePay báo về
 *   vnpay       — cổng VNPay (thẻ ATM / Visa / Mastercard / QR ngân hàng): link thanh toán ký HMAC-SHA512, kết quả qua IPN (GET)
 *   installment — trả góp qua thẻ tín dụng (hệ thống trả góp riêng của VNPay): lấy token → bảng ngân hàng / loại thẻ / kỳ hạn →
 *                 khởi tạo giao dịch → trình duyệt POST sang trang VNPay → kết quả qua Return URL / IPN (GET, ký như cổng VNPay)
 * Tài liệu: sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html · sandbox.vnpayment.vn/apis/docs/thanh-toan-installment/installment.html
 *           (đặc tả VNPAY_Installment_Payment_Techspec 2.1.1) · developer.sepay.vn
 */
const crypto = require('crypto');

const cfg = () => require('./settings').all().pay || {};
const ready = {
  sepay: c => !!(c.sepay && c.sepay.enabled && c.sepay.apiKey),
  vnpay: c => !!(c.vnpay && c.vnpay.enabled && c.vnpay.tmnCode && c.vnpay.hashSecret),
  installment: c => { const i = c.installment || {}; return !!(i.enabled && i.apiUrl && i.tmnCode && i.clientId && i.username && i.password && i.secretKey); },
};
// cổng đang dùng được (trang web hiện lựa chọn / nút thanh toán tương ứng); installmentMin = số tiền tối thiểu được trả góp
function online() {
  const c = cfg(), isp = ready.installment(c);
  return { vnpay: ready.vnpay(c), installment: isp, installmentMin: isp ? Math.max(0, Number(c.installment.minAmount) || 0) : 0, auto: ready.sepay(c) };
}
const hmac = (alg, key, s) => crypto.createHmac(alg, String(key)).update(Buffer.from(String(s), 'utf8')).digest('hex');
const same = (a, b) => { a = Buffer.from(String(a || '').toLowerCase()); b = Buffer.from(String(b || '').toLowerCase()); return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b); };

/* ─── VNPay ─────────────────────────────────────────────────────────────── */
const VNP_URL = { sandbox: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', live: 'https://pay.vnpay.vn/vpcpay.html' };
// mã hóa như mẫu của VNPay: key và value URL-encode, dấu cách thành "+"
const vnpEnc = s => encodeURIComponent(String(s)).replace(/%20/g, '+');
// keepEmpty: mẫu Java của VNPay bỏ trường rỗng, mẫu PHP / Node giữ lại → khi kiểm tra chữ ký VNPay gửi về thử cả hai
const vnpData = (p, keepEmpty) => Object.keys(p).filter(k => keepEmpty ? p[k] != null : p[k] !== '' && p[k] != null).sort().map(k => vnpEnc(k) + '=' + vnpEnc(p[k])).join('&');
// giờ Việt Nam (GMT+7) dạng yyyyMMddHHmmss
const vnTime = (t = Date.now()) => new Date(t + 7 * 3600e3).toISOString().replace(/\D/g, '').slice(0, 14);
// bỏ dấu, chỉ giữ chữ, số, dấu cách (yêu cầu của vnp_OrderInfo và thông tin khách khi trả góp)
const plain = (s, max = 200) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
function ipv4(ip) { const s = String(ip || '').replace(/^::ffff:/, ''); return /^\d+\.\d+\.\d+\.\d+$/.test(s) ? s : '127.0.0.1'; }
function vnpayUrl({ ref, amount, info, ip, returnUrl, lang }) {
  const c = cfg().vnpay || {};
  const p = {
    vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: c.tmnCode, vnp_Amount: Math.round(amount) * 100, vnp_CurrCode: 'VND',
    vnp_TxnRef: ref, vnp_OrderInfo: plain(info), vnp_OrderType: 'other', vnp_Locale: lang === 'en' ? 'en' : 'vn',
    vnp_ReturnUrl: returnUrl, vnp_IpAddr: ipv4(ip), vnp_CreateDate: vnTime(), vnp_ExpireDate: vnTime(Date.now() + 15 * 60e3),
  };
  const data = vnpData(p);
  return (c.sandbox !== false ? VNP_URL.sandbox : VNP_URL.live) + '?' + data + '&vnp_SecureHash=' + hmac('sha512', c.hashSecret, data);
}
// kiểm tra chữ ký trên link VNPay gửi về (return URL / IPN) → { ok, ref, amount, success, cancel, txn, tmn }
// kind: 'vnpay' (cổng thẻ) | 'installment' (trả góp — cùng kiểu ký: tham số vnp_* xếp theo tên, HMAC-SHA512 bằng secretKey)
function vnpayVerify(query, kind = 'vnpay') {
  const all = cfg(), c = kind === 'installment' ? all.installment || {} : all.vnpay || {};
  const secret = kind === 'installment' ? c.secretKey : c.hashSecret, q = { ...query }, sig = q.vnp_SecureHash;
  delete q.vnp_SecureHash; delete q.vnp_SecureHashType;
  for (const k of Object.keys(q)) if (!k.startsWith('vnp_')) delete q[k];
  // đặc tả trả góp không ghi cách mã hóa → thử thêm bản không URL-encode
  const raw = Object.keys(q).filter(k => q[k] !== '' && q[k] != null).sort().map(k => k + '=' + q[k]).join('&');
  const ok = !!secret && [vnpData(q), vnpData(q, true), raw].some(d => same(hmac('sha512', secret, d), sig));
  return {
    ok, ref: String(q.vnp_TxnRef || ''), amount: Math.round(Number(q.vnp_Amount) / 100) || 0, txn: String(q.vnp_TransactionNo || ''),
    success: q.vnp_ResponseCode === '00' && q.vnp_TransactionStatus === '00', cancel: q.vnp_ResponseCode === '24', tmn: !!c.tmnCode && q.vnp_TmnCode === c.tmnCode,
  };
}

/* ─── VNPay trả góp (đặc tả 2.1.1) ─────────────────────────────────────── */
const TERMS = [3, 6, 9, 12];      // kỳ hạn VNPay hỗ trợ (tháng)
const isp = () => cfg().installment || {};
const ispBase = () => String(isp().apiUrl || '').trim().replace(/\/+$/, '');
const httpsUrl = s => { s = String(s || '').trim(); return /^https:\/\/[^\s"'<>]+$/.test(s) ? s : ''; };
const ispOk = d => String(d && d.rspCode) === '00';
const ispErr = (d, what) => new Error(what + (d && d.rspCode != null ? ' (mã ' + d.rspCode + ')' : '') + (d && d.rspMsg ? ': ' + d.rspMsg : '') +
  (d && Array.isArray(d.errorDetails) && d.errorDetails.length ? ' — ' + d.errorDetails.map(x => (x && x.field) + ': ' + (x && x.reason)).join('; ') : ''));
async function ispFetch(path, opt) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(ispBase() + path, { ...opt, signal: ctl.signal });
    return { status: r.status, d: await r.json().catch(() => null) };
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'VNPay trả góp không phản hồi (quá 30 giây)' : 'Không kết nối được VNPay trả góp: ' + e.message);
  } finally { clearTimeout(timer); }
}
// token đăng nhập (VNPay cấp clientId / username / password / clientSecret) — dùng lại tới gần hết hạn
let token = null;
async function ispAuth(force) {
  const c = isp(), key = [ispBase(), c.clientId, c.username, c.password, c.clientSecret].join('|');
  if (!force && token && token.key === key && token.exp > Date.now()) return token.auth;
  token = null;
  const { status, d } = await ispFetch('/oauth/authenticate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: c.clientId, username: c.username, password: c.password, ...(c.clientSecret ? { clientSecret: c.clientSecret } : {}) }) });
  const t = (d && d.data) || {};
  if (!ispOk(d) || !t.accessToken) throw ispErr(d || { rspMsg: 'HTTP ' + status }, 'Đăng nhập VNPay trả góp không được');
  token = { key, auth: (t.tokenType || 'Bearer') + ' ' + t.accessToken, exp: Date.now() + Math.max(30, (Number(t.expiresIn) || 300) - 30) * 1000 };
  return token.auth;
}
// gọi API có token; token hết hạn sớm (HTTP 401) → đăng nhập lại 1 lần
async function ispCall(method, path, body) {
  for (let i = 0; i < 2; i++) {
    const auth = await ispAuth(i > 0);
    const r = await ispFetch(path, { method, headers: { Authorization: auth, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (r.status !== 401) return r;
  }
  throw new Error('VNPay trả góp từ chối token đăng nhập');
}
// ngân hàng / loại thẻ / kỳ hạn trả góp cho số tiền → [{ code, name, logo, schemes: [{ scheme, logo, terms: [{ n, monthly, total, fee }] }] }]
const optCache = new Map();
async function installmentOptions(amount, fresh) {
  amount = Math.round(amount);
  const hit = !fresh && optCache.get(amount);
  if (hit && hit.exp > Date.now()) return hit.banks;
  const c = isp(), amt = amount * 100;
  const q = new URLSearchParams({ tmnCode: c.tmnCode, amount: String(amt), currCode: 'VND', secureHash: hmac('sha512', c.secretKey, `${c.tmnCode}|${amt}|VND`) }).toString();
  let r = await ispCall('GET', '/category/installment-info?' + q);
  if (r.status === 404) r = await ispCall('GET', '/category/get-installment-info?' + q);   // trang tài liệu web ghi đường dẫn này
  if (!ispOk(r.d)) throw ispErr(r.d || { rspMsg: 'HTTP ' + r.status }, 'VNPay chưa trả bảng trả góp');
  const vnd = v => Math.round((Number(v) || 0) / 100), arr = v => (Array.isArray(v) ? v : []);
  const banks = arr(r.d.data).map(b => ({
    code: String(b.issuerCode || '').trim(), name: String(b.issuerName || b.issuerCode || '').trim(), logo: httpsUrl(b.logoUrl),
    schemes: arr(b.schemes).map(s => ({
      scheme: String(s.scheme || '').trim(), logo: httpsUrl(s.logoUrl),
      terms: arr(s.recurringInfo).map(t => ({ n: Number(t.recurringNumberOfIsp) || 0, monthly: vnd(t.recurringAmount), total: vnd(t.totalIspAmount), fee: vnd(t.ispFeeAmount) }))
        .filter(t => TERMS.includes(t.n)).sort((a, b) => a.n - b.n),
    })).filter(s => /^[A-Za-z0-9_]{2,20}$/.test(s.scheme) && s.terms.length),
  })).filter(b => /^[A-Za-z0-9_]{2,20}$/.test(b.code) && b.schemes.length);
  if (optCache.size > 50) optCache.clear();
  optCache.set(amount, { banks, exp: Date.now() + 10 * 60e3 });
  return banks;
}
// khởi tạo giao dịch trả góp → form trình duyệt POST sang VNPay { action, fields: { ispTxnId, tmnCode, dataKey }, txnId }
// customer: { name, phone, email, address, city } (VNPay cần đủ, tiếng Việt không dấu)
async function installmentInit({ ref, amount, info, issuer, scheme, term, customer, ip, ua, returnUrl, cancelUrl, lang }) {
  const c = isp(), amt = Math.round(amount) * 100;
  const words = plain(customer.name, 100).toUpperCase().split(' ').filter(Boolean);
  const forename = words.length ? words[words.length - 1] : 'KHACH', surname = words.length > 1 ? words.slice(0, -1).join(' ') : forename;
  const mobile = String(customer.phone || '').replace(/\D/g, '').replace(/^84(?=\d{9}$)/, '0').slice(0, 20);
  const b = {
    reqId: String(Date.now()) + String(crypto.randomInt(100, 1000)), tmnCode: c.tmnCode,
    order: { orderReference: ref, orderInfo: plain(info, 255) },
    transaction: { issuerCode: issuer, scheme, recurringFrequency: 'monthly', recurringNumberOfIsp: term, amount: amt, currCode: 'VND',
      returnUrl, cancelUrl, mcDate: vnTime(), expiryDate: vnTime(Date.now() + 15 * 60e3) },
    customerInfo: { forename, surname, mobile, email: String(customer.email || '').trim(), address: plain(customer.address, 255), city: plain(customer.city, 255), country: 'VN' },
    ipAddr: ipv4(ip), userAgent: String(ua || 'Mozilla/5.0').slice(0, 255), addData: '', version: '2.1.1', locale: lang === 'en' ? 'en' : 'vn',
  };
  const t = b.transaction, ci = b.customerInfo;
  // chuỗi ký theo đúng thứ tự trong đặc tả (trường tùy chọn để trống: identityCode = "")
  b.secureHash = hmac('sha512', c.secretKey, [b.reqId, b.order.orderReference, b.order.orderInfo, b.tmnCode, t.issuerCode, t.scheme, t.recurringFrequency, t.recurringNumberOfIsp,
    t.amount, t.currCode, b.addData, '', ci.forename, ci.surname, ci.mobile, ci.email, ci.address, ci.city, ci.country, b.ipAddr, b.userAgent,
    t.returnUrl, t.cancelUrl, b.version, b.locale, t.mcDate, t.expiryDate].join('|'));
  const { status, d } = await ispCall('POST', '/payment/init', b);
  const tx = (d && d.transaction) || {};
  if (!ispOk(d) || !tx.id || !d.dataKey) throw ispErr(d || { rspMsg: 'HTTP ' + status }, 'VNPay chưa tạo được giao dịch trả góp');
  if (d.secureHash) {
    const back = [d.rspCode, d.rspMsg == null ? '' : d.rspMsg, tx.id, tx.amount, tx.currCode, d.addData == null ? '' : d.addData, d.dataKey].join('|');
    // tiền chỉ ghi nhận qua IPN / Return (có kiểm chữ ký) → chữ ký phản hồi lệch chỉ ghi cảnh báo, không chặn khách
    if (!same(hmac('sha512', c.secretKey, back), d.secureHash)) console.warn('[trả góp VNPay] chữ ký phản hồi khởi tạo không khớp — kiểm tra lại secretKey', ref);
  }
  return { txnId: String(tx.id), action: ispBase() + '/payment/pay', fields: { ispTxnId: String(tx.id), tmnCode: c.tmnCode, dataKey: String(d.dataKey) } };
}

/* ─── SePay (chuyển khoản tự xác nhận) ─────────────────────────────────── */
// header: Authorization: Apikey <khóa>
function sepayAuth(header) {
  const key = (cfg().sepay || {}).apiKey, m = /^apikey\s+(.+)$/i.exec(String(header || '').trim());
  return !!key && !!m && same(m[1].trim(), key);
}
// mã đơn trong nội dung chuyển khoản: DC123456 (đơn hàng) / DCREG12345 (đăng ký) — ngân hàng có thể chèn dấu chấm, gạch, dấu cách
function codeInContent(...texts) {
  for (const t of texts) {
    const m = /(?:^|[^A-Z0-9])DC[-._ ]?(REG)?[-._ ]?(\d{5,6})(?!\d)/i.exec(String(t || ''));
    if (m) return 'DC' + (m[1] ? 'REG' : '') + m[2];
  }
  return '';
}

module.exports = { online, ready: () => { const c = cfg(); return { sepay: ready.sepay(c), vnpay: ready.vnpay(c), installment: ready.installment(c) }; },
  vnpayUrl, vnpayVerify, installmentOptions, installmentInit, sepayAuth, codeInContent, vnpData, hmac, plain, TERMS };
