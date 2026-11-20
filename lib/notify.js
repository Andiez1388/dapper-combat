/*
 * Báo cho chủ shop khi có đơn hàng / đăng ký khóa học / yêu cầu tư vấn mới, và (nếu bật) email xác nhận cho khách.
 * Nội dung tin theo mẫu sửa ở /admin → Thiết lập → Thông báo ({code}, {name}, {total}…).
 * Cấu hình trong .env (không cài kênh nào thì bỏ qua, không ảnh hưởng khách đặt hàng):
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE (true khi dùng cổng 465), MAIL_FROM, NOTIFY_EMAIL
 *   SITE_URL (vd https://dappervietnam.com) — để kèm link mở thẳng trang quản trị
 */
const nodemailer = require('nodemailer');

const settings = require('./settings');
const maillog = require('./maillog');
const mailHtml = require('./mail-html');
// cấu hình: /admin → Thiết lập → Thông báo; chưa điền thì lấy từ .env
const MAP = { TELEGRAM_BOT_TOKEN: 'telegramToken', TELEGRAM_CHAT_ID: 'telegramChat', SMTP_HOST: 'smtpHost', SMTP_PORT: 'smtpPort', SMTP_SECURE: 'smtpSecure',
  SMTP_USER: 'smtpUser', SMTP_PASS: 'smtpPass', MAIL_FROM: 'mailFrom', NOTIFY_EMAIL: 'notifyEmail', SITE_URL: 'siteUrl' };
function env(k) {
  const n = settings.all().notify, v = n[MAP[k]];
  if (k === 'SMTP_SECURE' && n.smtpHost) return String(!!v);
  if (k === 'SMTP_PORT' && n.smtpHost) return String(v || 465);
  if (v !== undefined && v !== '' && typeof v !== 'boolean' && k !== 'SMTP_PORT') return String(v).trim();
  return (process.env[k] || '').trim();
}
const money = (n, lang) => (n || 0).toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN') + '₫';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PAY = { bank: 'Chuyển khoản', momo: 'MoMo (quét mã QR)', zalopay: 'ZaloPay (quét mã QR)', vnpay: 'Thẻ / ATM (VNPay)', installment: 'Trả góp thẻ tín dụng (VNPay)', cash: 'Tiền mặt' };
const COLOR = { red: 'Đỏ', black: 'Đen', white: 'Trắng', grey: 'Xám', navy: 'Xanh navy', orange: 'Cam' };
// email cho khách đặt bằng tiếng Anh
const EN = {
  pay: { bank: 'Bank transfer', momo: 'MoMo (QR scan)', zalopay: 'ZaloPay (QR scan)', vnpay: 'Card / ATM (VNPay)', installment: 'Credit card installments (VNPay)', cash: 'Cash' },
  color: { red: 'Red', black: 'Black', white: 'White', grey: 'Grey', navy: 'Navy', orange: 'Orange' },
  ship: { exp: 'Express (HCMC)', pickup: 'Pick up at the gym', std: 'Standard' }, free: 'Free',
};
const SHIP_VI = { exp: 'Hỏa tốc TP.HCM', pickup: 'Nhận tại phòng tập', std: 'Tiêu chuẩn' };

function channels() {
  return {
    telegram: !!(env('TELEGRAM_BOT_TOKEN') && env('TELEGRAM_CHAT_ID')),
    email: !!(env('SMTP_HOST') && env('NOTIFY_EMAIL')),
  };
}

let transport = null, transportKey = '';
function mailer() {
  const key = [env('SMTP_HOST'), env('SMTP_PORT'), env('SMTP_SECURE'), env('SMTP_USER'), env('SMTP_PASS')].join('|');
  if (key !== transportKey) { transport = null; transportKey = key; } // đổi cấu hình trong admin → tạo kết nối mới
  if (!transport) transport = nodemailer.createTransport({
    host: env('SMTP_HOST'), port: +env('SMTP_PORT') || 587, secure: env('SMTP_SECURE') === 'true',
    auth: env('SMTP_USER') ? { user: env('SMTP_USER'), pass: env('SMTP_PASS') } : undefined,
  });
  return transport;
}

/* ─── Mẫu tin (/admin → Thiết lập → Thông báo) ───────────────────────────── */
// {biến} → giá trị; dòng có biến mà biến nào cũng trống thì bỏ cả dòng
function fill(t, vars) { return String(t || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m)); }
function renderLines(body, vars) {
  return String(body || '').split('\n').map(line => {
    const keys = [...line.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
    if (keys.length && keys.every(k => vars[k] == null || vars[k] === '')) return null;
    return fill(line, vars);
  }).filter(l => l !== null);
}
// sản phẩm thiết kế riêng: tóm tắt từng lựa chọn trên 1 dòng (bỏ link logo, bỏ phí) — chi tiết đầy đủ xem trong /admin → Đơn hàng
function designText(i, en) {
  const ls = (i.custom && i.custom.lines) || [];
  const parts = ls.filter(l => l[0] !== 'Phí thiết kế riêng').map(l => l[0] === 'Logo' ? 'Logo ' + String(l[1]).split(' · ').slice(0, 2).join(' · ') : l[0] + ' ' + l[1]);
  return (en ? 'Custom design: ' : 'Thiết kế riêng: ') + parts.join(' · ');
}
// "Nhãn: giá trị" → [nhãn, giá trị] để in đậm phần giá trị
const split = line => { const i = line.indexOf(': '); return i > 0 && i < 40 ? [line.slice(0, i), line.slice(i + 2)] : [null, line]; };
// lang = 'en': giá, cách thanh toán, cách giao, màu ghi bằng tiếng Anh (email cho khách đặt bằng tiếng Anh)
const VARS = {
  order: (o, lang) => {
    const en = lang === 'en', m = n => money(n, lang);
    const color = i => (en ? EN.color[i.color] : '') || i.colorName || COLOR[i.color] || i.color;
    return {
      code: o.code, total: m(o.total), subtotal: m(o.subtotal), discount: o.discount ? m(o.discount) : '', shipping: o.shipping ? m(o.shipping) : en ? EN.free : 'Miễn phí',
      name: o.customer.name, phone: o.customer.phone, email: o.customer.email, address: [o.customer.address, o.customer.ward, o.customer.city].filter(Boolean).join(', '),
      items: o.items.map(i => `${i.qty}× ${i.name} (${[i.size, i.custom ? designText(i, en) : color(i)].filter(Boolean).join(', ')})`).join('; '), pay: (en ? EN.pay : PAY)[o.pay] || o.pay,
      ship: (en ? EN.ship : SHIP_VI)[o.ship] || (en ? EN.ship : SHIP_VI).std, note: o.customer.note, promo: o.promo || '', date: time(o.createdAt, lang), slip: slipUrl(o),
    };
  },
  registration: (r, lang) => ({
    code: r.code, name: r.name, phone: r.phone, email: r.email, program: r.programName || r.program, detail: r.detail,
    total: r.total ? money(r.total, lang) : '', due: r.due ? money(r.due, lang) : '', pay: r.payName ? r.payName + (r.due ? ' — ' + money(r.due, lang) : '') : '',
    date: r.date ? r.date.split('-').reverse().join('/') : '', note: r.note, slip: slipUrl(r),
  }),
  consult: c => ({
    code: c.code, name: c.name, phone: c.phone, email: c.email, city: c.city, type: c.typeName || c.type, area: c.areaName || c.area,
    services: ((c.svcNames && c.svcNames.length ? c.svcNames : c.svc) || []).join(', '), budget: c.budgetName || c.budget, note: c.note,
  }),
};
const time = (t, lang) => new Date(t || Date.now()).toLocaleString(lang === 'en' ? 'en-GB' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
// link phiếu xác nhận cho khách (cần địa chỉ website trong Thiết lập → Thông báo)
function slipUrl(e) {
  const site = env('SITE_URL').replace(/\/+$/, '');
  return site && e.confirm && e.confirm.token ? `${site}/phieu/${String(e.code).replace(/^#/, '')}?k=${e.confirm.token}` : '';
}
// dữ liệu mẫu cho nút "Gửi thử"
const SAMPLE = {
  order: { code: '#DC-123456', total: 1320000, subtotal: 1290000, discount: 0, shipping: 30000, pay: 'bank', ship: 'std', createdAt: Date.now(),
    customer: { name: 'Nguyễn Văn A', phone: '0909123456', email: 'khach@example.com', address: '12 Đường số 1', ward: 'Phước Long', city: 'TP. Hồ Chí Minh', note: 'Gọi trước khi giao' },
    items: [{ qty: 1, name: 'DC Pro Sparring Gloves', size: '14oz', color: 'red' }], confirm: { token: 'a1b2c3d4e5f6a7b8c9d0e1f2' } },
  registration: { code: '#DC-REG-12345', name: 'Nguyễn Văn A', phone: '0909123456', email: 'khach@example.com', programName: 'Group Training', detail: '12 tháng · Tối', total: 12000000, payName: 'Chuyển khoản', due: 12000000, date: '2026-11-02', note: '', confirm: { token: 'a1b2c3d4e5f6a7b8c9d0e1f2' } },
  consult: { code: '#DC-SVC-12345', name: 'Nguyễn Văn A', phone: '0909123456', email: 'khach@example.com', city: 'TP. Hồ Chí Minh', typeName: 'Phòng gym', areaName: '50–100 m²', svcNames: ['Cung cấp thiết bị'], budgetName: '100–300 triệu', note: '' },
};

// ghi nhật ký gửi tin (lỗi ghi nhật ký không làm hỏng việc gửi)
function note(meta, channel, to, subject, status, error) {
  try { maillog.add({ kind: meta.kind || 'test', audience: meta.audience || 'owner', channel, to, subject, status, error: error || undefined, ref: meta.ref || undefined }); } catch (e) { console.warn('[nhật ký gửi tin]', e.message); }
}
// lines: các dòng chữ đã điền ("Nhãn: giá trị"); meta: { kind, ref } cho nhật ký
async function send(title, lines, link, meta = {}) {
  const ch = channels(), result = {};
  const url = env('SITE_URL') ? env('SITE_URL').replace(/\/$/, '') + '/admin' + (link || '') : '';
  if (ch.telegram) {
    const text = `<b>${esc(title)}</b>\n` + lines.map(l => { const [k, v] = split(l); return k ? `${esc(k)}: <b>${esc(v)}</b>` : esc(v); }).join('\n') + (url ? `\n\n<a href="${esc(url)}">Mở trang quản trị</a>` : '');
    try {
      const r = await fetch(`https://api.telegram.org/bot${env('TELEGRAM_BOT_TOKEN')}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env('TELEGRAM_CHAT_ID'), text, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
      result.telegram = r.ok ? 'ok' : 'lỗi ' + r.status;
    } catch (e) { result.telegram = 'lỗi: ' + e.message; }
    note(meta, 'telegram', 'Telegram', title, result.telegram === 'ok' ? 'ok' : 'failed', result.telegram === 'ok' ? '' : result.telegram);
  }
  if (ch.email) {
    const lk = look('vi');
    const html = mailHtml.render({ ...lk, kind: 'owner', subject: title, lines: lines.concat(url ? ['', 'Mở trong trang quản trị: ' + url] : []),
      sign: { on: false }, footer: false, preheader: lines[0] || title, site: lk.site || (url ? url.replace(/\/admin.*$/, '') : '') });
    try {
      await mailer().sendMail({ from: env('MAIL_FROM') || env('SMTP_USER'), to: env('NOTIFY_EMAIL'), subject: title, html, text: lines.join('\n') + (url ? '\n\n' + url : '') });
      result.email = 'ok';
    } catch (e) { result.email = 'lỗi: ' + e.message; }
    note(meta, 'email', env('NOTIFY_EMAIL'), title, result.email === 'ok' ? 'ok' : 'failed', result.email === 'ok' ? '' : result.email);
  }
  return result;
}
// dữ liệu chung cho giao diện email: địa chỉ web, logo, liên hệ & mạng xã hội, chữ ký
function look(lang) {
  const n = tpl(), sg = n.sign || {}, en = lang === 'en';
  let contact = {};
  try { contact = { ...(require('./cms').data().contact || {}) }; } catch (e) { console.warn('[email] không đọc được Liên hệ & MXH:', e.message); }
  return {
    site: String(env('SITE_URL') || '').replace(/\/+$/, ''), logo: (settings.all().brand || {}).logo || '', contact, from: env('MAIL_FROM') || env('SMTP_USER'),
    sign: { on: sg.on !== false, closing: en ? sg.closingEn || sg.closing : sg.closing, name: en ? sg.nameEn || sg.name : sg.name, tagline: sg.tagline },
  };
}
// HTML đầy đủ của email khách (dùng cho gửi thật, gửi thử và xem trước trong /admin)
function customerHtml(kind, subject, lines, code, lang) {
  const lk = look(lang);
  return mailHtml.render({ ...lk, kind, lang, subject, lines, code, preheader: lines.find(l => l && !/^(Chào|Hi|Hello)\b/.test(l)) || subject });
}
// email cho khách (xác nhận đơn / đăng ký / tư vấn): giao diện thương hiệu (lib/mail-html.js) + chữ ký
async function sendCustomer(to, subject, lines, meta = {}) {
  if (!env('SMTP_HOST')) return { email: 'chưa cài SMTP' };
  if (!to) return { email: 'khách không nhập email' };
  const lang = meta.lang === 'en' ? 'en' : 'vi', lk = look(lang);
  const html = customerHtml(meta.tplKind || meta.kind, subject, lines, meta.ref, lang);
  const sigText = lk.sign.on ? [''].concat([lk.sign.closing, lk.sign.name, lk.contact.phone && 'Hotline: ' + lk.contact.phone, lk.site].filter(Boolean)) : [];
  let r;
  try {
    await mailer().sendMail({ from: env('MAIL_FROM') || env('SMTP_USER'), to, subject, html, text: lines.concat(sigText).join('\n') });
    r = { email: 'ok' };
  } catch (e) { r = { email: 'lỗi: ' + e.message }; }
  note({ ...meta, audience: 'customer' }, 'email', to, subject, r.email === 'ok' ? 'ok' : 'failed', r.email === 'ok' ? '' : r.email);
  return r;
}
const tpl = () => settings.all().notify;
// email xác nhận cho khách → trạng thái lưu vào đơn / đăng ký: off | none | nosmtp | sent | failed
async function customerMail(kind, entry, force) {
  const cus = tpl().customer[kind], to = kind === 'order' ? entry.customer.email : entry.email;
  if (!to) return { status: 'none' }; // khách chỉ để SĐT → dùng phiếu; báo 'none' kể cả khi email đang tắt
  if (!cus || (!cus.on && !force)) return { status: 'off' };
  if (!env('SMTP_HOST')) return { status: 'nosmtp' };
  // khách đặt bằng tiếng Anh → mẫu tiếng Anh (AI dịch / mặc định); chưa có bản tiếng Anh thì dùng mẫu tiếng Việt
  const lang = entry.lang === 'en' && cus.subjectEn && cus.bodyEn ? 'en' : 'vi';
  const vars = VARS[kind](entry, lang);
  const subject = lang === 'en' ? cus.subjectEn : cus.subject, body = lang === 'en' ? cus.bodyEn : cus.body;
  const r = await sendCustomer(to, fill(subject, vars), renderLines(body, vars), { kind, ref: entry.code, lang });
  return r.email === 'ok' ? { status: 'sent', at: Date.now(), to } : { status: 'failed', at: Date.now(), to, error: r.email };
}
// tin mới: báo chủ shop + (nếu bật) email xác nhận cho khách. Gửi nền: lỗi chỉ ghi log, không làm hỏng việc khách đặt hàng
// onCustomer(kết quả email cho khách) — để lưu trạng thái vào đơn
function fire(kind, entry, link, onCustomer) {
  const t = tpl(), vars = VARS[kind](entry), own = t.templates[kind];
  const log = r => { for (const [k, v] of Object.entries(r)) if (v !== 'ok') console.warn(`[thông báo ${k}] ${v}`); };
  if (own && own.on && (channels().telegram || channels().email)) send(fill(own.title, vars), renderLines(own.body, vars), link, { kind, ref: entry.code }).then(log);
  if (t.customer[kind]) customerMail(kind, entry).then(r => onCustomer && onCustomer(r)).catch(e => console.warn('[email khách]', e.message));
}
// "Gửi thử": mẫu tin của 1 loại (kind) với dữ liệu mẫu; customer = gửi mẫu email khách tới email nhận thông báo của shop
function test(kind, customer) {
  if (!VARS[kind]) return send('Dapper Combat — thông báo thử', ['Thời gian: ' + time(), 'Nội dung: Kênh thông báo đơn mới đã hoạt động'], '', { kind: 'test' });
  const t = tpl(), vars = VARS[kind](SAMPLE[kind]);
  if (customer) { const c = t.customer[kind]; return c ? sendCustomer(env('NOTIFY_EMAIL'), '[Thử] ' + fill(c.subject, vars), renderLines(c.body, vars), { kind: 'test', tplKind: kind, ref: vars.code }) : Promise.resolve({ email: 'không có mẫu' }); }
  const o = t.templates[kind];
  return send('[Thử] ' + fill(o.title, vars), renderLines(o.body, vars), '', { kind: 'test' });
}
// tiền về qua cổng thanh toán / chuyển khoản tự xác nhận → báo chủ shop (Telegram / email)
function paid(type, x, info) {
  if (!channels().telegram && !channels().email) return;
  const name = type === 'order' ? (x.customer || {}).name : x.name;
  const head = info.result === 'paid' ? '💰 Đã nhận tiền ' : info.result === 'partial' ? '⚠️ Nhận chưa đủ tiền ' : '⚠️ Nhận thêm tiền ';
  const lines = ['Khách: ' + name, 'Số tiền: ' + money(info.amount), 'Qua: ' + info.provider, info.txn ? 'Mã giao dịch: ' + info.txn : '',
    info.result === 'partial' ? 'Ghi chú: Khách chuyển chưa đủ — gọi khách để bổ sung' : info.result === 'already' ? 'Ghi chú: Đơn đã thanh toán trước đó — kiểm tra hoàn tiền' : ''].filter(Boolean);
  send(head + x.code + ' — ' + money(info.amount), lines, (type === 'order' ? '#/orders/' : '#/registrations/') + x.id, { kind: type, ref: x.code })
    .catch(e => console.warn('[báo nhận tiền]', e.message));
}
// xem trước giao diện email gửi khách (HTML đầy đủ, dữ liệu mẫu) — /admin → Thông báo
function mailPreview(kind, subject, body, sign) {
  if (!VARS[kind]) return '';
  const vars = VARS[kind](SAMPLE[kind]);
  const lk = look('vi');
  if (sign && typeof sign === 'object') lk.sign = { on: sign.on !== false, closing: String(sign.closing || ''), name: String(sign.name || ''), tagline: String(sign.tagline || '') };
  return mailHtml.render({ ...lk, kind, lang: 'vi', subject: fill(subject, vars), lines: renderLines(body, vars), code: vars.code });
}
// xem trước trong /admin (không gửi)
function preview(kind, title, body) {
  const vars = VARS[kind] ? VARS[kind](SAMPLE[kind]) : {};
  return { title: fill(title, vars), lines: renderLines(body, vars), vars: Object.keys(vars) };
}

module.exports = {
  channels, test, preview, mailPreview, paid,
  vars: Object.fromEntries(Object.keys(VARS).map(k => [k, Object.keys(VARS[k](SAMPLE[k]))])),
  order: (o, onCustomer) => fire('order', o, '#/orders/' + o.id, onCustomer),
  registration: (r, onCustomer) => fire('registration', r, '#/registrations/' + r.id, onCustomer),
  consult: (c, onCustomer) => fire('consult', c, '#/consults/' + c.id, onCustomer),
  // /admin: gửi lại email xác nhận (kể cả khi mẫu đang tắt)
  resend: (kind, entry) => customerMail(kind, entry, true),
};
