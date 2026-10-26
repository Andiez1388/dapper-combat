/*
 * Thanh toán online (cấu hình ở /admin → Thanh toán online, lưu trong settings.pay; khóa bí mật không gửi ra trình duyệt):
 *   sepay — tự xác nhận chuyển khoản: SePay gọi webhook khi tài khoản ngân hàng có tiền vào; nội dung chuyển khoản chứa mã đơn (vd DC871627)
 *   vnpay — cổng VNPay (thẻ ATM / Visa / Mastercard / QR ngân hàng): link thanh toán ký HMAC-SHA512, kết quả qua IPN (GET)
 *   momo  — cổng MoMo (ví MoMo): tạo link qua API ký HMAC-SHA256, kết quả qua IPN (POST, trả 204)
 * Tài liệu: sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html · developers.momo.vn · developer.sepay.vn
 */
const crypto = require('crypto');

const cfg = () => require('./settings').all().pay || {};
const ready = {
  sepay: c => !!(c.sepay && c.sepay.enabled && c.sepay.apiKey),
  vnpay: c => !!(c.vnpay && c.vnpay.enabled && c.vnpay.tmnCode && c.vnpay.hashSecret),
  momo: c => !!(c.momo && c.momo.enabled && c.momo.partnerCode && c.momo.accessKey && c.momo.secretKey),
};
// cổng đang dùng được (trang web hiện nút thanh toán tương ứng)
function online() { const c = cfg(); return { vnpay: ready.vnpay(c), momo: ready.momo(c), auto: ready.sepay(c) }; }
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
// bỏ dấu, chỉ giữ chữ, số, dấu cách (yêu cầu của vnp_OrderInfo)
const plain = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
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
// kiểm tra chữ ký trên link VNPay gửi về (return URL / IPN) → { ok, ref, amount, success, cancel, txn }
function vnpayVerify(query) {
  const c = cfg().vnpay || {}, q = { ...query }, sig = q.vnp_SecureHash;
  delete q.vnp_SecureHash; delete q.vnp_SecureHashType;
  for (const k of Object.keys(q)) if (!k.startsWith('vnp_')) delete q[k];
  const ok = !!c.hashSecret && (same(hmac('sha512', c.hashSecret, vnpData(q)), sig) || same(hmac('sha512', c.hashSecret, vnpData(q, true)), sig));
  return {
    ok, ref: String(q.vnp_TxnRef || ''), amount: Math.round(Number(q.vnp_Amount) / 100) || 0, txn: String(q.vnp_TransactionNo || ''),
    success: q.vnp_ResponseCode === '00' && q.vnp_TransactionStatus === '00', cancel: q.vnp_ResponseCode === '24', tmn: q.vnp_TmnCode === c.tmnCode,
  };
}

/* ─── MoMo ──────────────────────────────────────────────────────────────── */
const MOMO_URL = { sandbox: 'https://test-payment.momo.vn/v2/gateway/api/create', live: 'https://payment.momo.vn/v2/gateway/api/create' };
const MOMO_MIN = 1000, MOMO_MAX = 50000000;
async function momoCreate({ ref, amount, info, redirectUrl, ipnUrl, lang }) {
  const c = cfg().momo || {};
  if (amount < MOMO_MIN || amount > MOMO_MAX) throw new Error(`MoMo chỉ nhận ${MOMO_MIN.toLocaleString('vi-VN')}đ – ${MOMO_MAX.toLocaleString('vi-VN')}đ mỗi giao dịch`);
  const b = { partnerCode: c.partnerCode, accessKey: c.accessKey, requestId: ref, amount: Math.round(amount), orderId: ref, orderInfo: String(info).slice(0, 200),
    redirectUrl, ipnUrl, extraData: '', requestType: 'captureWallet', lang: lang === 'en' ? 'en' : 'vi' };
  const raw = `accessKey=${b.accessKey}&amount=${b.amount}&extraData=${b.extraData}&ipnUrl=${b.ipnUrl}&orderId=${b.orderId}&orderInfo=${b.orderInfo}` +
    `&partnerCode=${b.partnerCode}&redirectUrl=${b.redirectUrl}&requestId=${b.requestId}&requestType=${b.requestType}`;
  b.signature = hmac('sha256', c.secretKey, raw);
  // DC_PAY_MOCK=1: bộ kiểm tra tự động — không gọi MoMo thật
  if (process.env.DC_PAY_MOCK === '1') return 'https://test-payment.momo.vn/mock?orderId=' + encodeURIComponent(b.orderId) + '&signature=' + b.signature;
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
  let r;
  try {
    r = await fetch(c.sandbox !== false ? MOMO_URL.sandbox : MOMO_URL.live, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b), signal: ctl.signal });
  } finally { clearTimeout(timer); }
  const d = await r.json().catch(() => ({}));
  if (d.resultCode !== 0 || !d.payUrl) throw new Error('MoMo báo lỗi' + (d.resultCode != null ? ' ' + d.resultCode : '') + (d.message ? ': ' + d.message : ''));
  return d.payUrl;
}
// IPN (POST) và redirect (GET) của MoMo cùng bộ trường + chữ ký
function momoVerify(p) {
  const c = cfg().momo || {};
  const raw = `accessKey=${c.accessKey}&amount=${p.amount}&extraData=${p.extraData || ''}&message=${p.message}&orderId=${p.orderId}&orderInfo=${p.orderInfo}` +
    `&orderType=${p.orderType}&partnerCode=${p.partnerCode}&payType=${p.payType}&requestId=${p.requestId}&responseTime=${p.responseTime}&resultCode=${p.resultCode}&transId=${p.transId}`;
  const ok = !!c.secretKey && same(hmac('sha256', c.secretKey, raw), p.signature) && p.partnerCode === c.partnerCode;
  const code = Number(p.resultCode);
  return { ok, ref: String(p.orderId || ''), amount: Math.round(Number(p.amount)) || 0, txn: String(p.transId || ''), success: code === 0, cancel: code === 1006 };
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

module.exports = { online, ready: () => { const c = cfg(); return { sepay: ready.sepay(c), vnpay: ready.vnpay(c), momo: ready.momo(c) }; },
  vnpayUrl, vnpayVerify, momoCreate, momoVerify, sepayAuth, codeInContent, vnpData, hmac, MOMO_MIN, MOMO_MAX };
