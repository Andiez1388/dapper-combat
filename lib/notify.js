/*
 * Báo cho chủ shop khi có đơn hàng / đăng ký khóa học / yêu cầu tư vấn mới, và (nếu bật) email xác nhận cho khách.
 * Nội dung tin theo mẫu sửa ở /admin → Thiết lập → Thông báo ({code}, {name}, {total}…).
 * Cấu hình trong .env (không cài kênh nào thì bỏ qua, không ảnh hưởng khách đặt hàng):
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE (true khi dùng cổng 465), MAIL_FROM, NOTIFY_EMAIL
 *   SITE_URL (vd https://dappercombat.vn) — để kèm link mở thẳng trang quản trị
 */
const nodemailer = require('nodemailer');

const settings = require('./settings');
const maillog = require('./maillog');
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
const money = n => (n || 0).toLocaleString('vi-VN') + '₫';
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const PAY = { cod: 'COD (thu tiền khi nhận)', bank: 'Chuyển khoản', momo: 'MoMo' };
const COLOR = { red: 'Đỏ', black: 'Đen', white: 'Trắng', grey: 'Xám', navy: 'Xanh navy', orange: 'Cam' };

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
// "Nhãn: giá trị" → [nhãn, giá trị] để in đậm phần giá trị
const split = line => { const i = line.indexOf(': '); return i > 0 && i < 40 ? [line.slice(0, i), line.slice(i + 2)] : [null, line]; };
const VARS = {
  order: o => ({
    code: o.code, total: money(o.total), subtotal: money(o.subtotal), discount: o.discount ? money(o.discount) : '', shipping: o.shipping ? money(o.shipping) : 'Miễn phí',
    name: o.customer.name, phone: o.customer.phone, email: o.customer.email, address: [o.customer.address, o.customer.ward, o.customer.city].filter(Boolean).join(', '),
    items: o.items.map(i => `${i.qty}× ${i.name} (${[i.size, i.colorName || COLOR[i.color] || i.color].filter(Boolean).join(', ')})`).join('; '), pay: PAY[o.pay] || o.pay,
    ship: o.ship === 'exp' ? 'Hỏa tốc TP.HCM' : o.ship === 'pickup' ? 'Nhận tại phòng tập' : 'Tiêu chuẩn', note: o.customer.note, promo: o.promo || '', date: time(o.createdAt), slip: slipUrl(o),
  }),
  registration: r => ({
    code: r.code, name: r.name, phone: r.phone, email: r.email, program: r.programName || r.program, detail: r.detail,
    total: r.total ? money(r.total) : '', due: r.due ? money(r.due) : '', pay: r.payName ? r.payName + (r.due ? ' — ' + money(r.due) : '') : '',
    date: r.date ? r.date.split('-').reverse().join('/') : '', note: r.note, slip: slipUrl(r),
  }),
  consult: c => ({
    code: c.code, name: c.name, phone: c.phone, city: c.city, type: c.typeName || c.type, area: c.areaName || c.area,
    services: ((c.svcNames && c.svcNames.length ? c.svcNames : c.svc) || []).join(', '), budget: c.budgetName || c.budget, note: c.note,
  }),
};
const time = t => new Date(t || Date.now()).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
// link phiếu xác nhận cho khách (cần địa chỉ website trong Thiết lập → Thông báo)
function slipUrl(e) {
  const site = env('SITE_URL').replace(/\/+$/, '');
  return site && e.confirm && e.confirm.token ? `${site}/phieu/${String(e.code).replace(/^#/, '')}?k=${e.confirm.token}` : '';
}
// dữ liệu mẫu cho nút "Gửi thử"
const SAMPLE = {
  order: { code: '#DC-123456', total: 1320000, subtotal: 1290000, discount: 0, shipping: 30000, pay: 'cod', ship: 'std', createdAt: Date.now(),
    customer: { name: 'Nguyễn Văn A', phone: '0909123456', email: 'khach@example.com', address: '12 Đường số 1', ward: 'Phước Long', city: 'TP. Hồ Chí Minh', note: 'Gọi trước khi giao' },
    items: [{ qty: 1, name: 'DC Pro Sparring Gloves', size: '14oz', color: 'red' }], confirm: { token: 'a1b2c3d4e5f6a7b8c9d0e1f2' } },
  registration: { code: '#DC-REG-12345', name: 'Nguyễn Văn A', phone: '0909123456', email: 'khach@example.com', programName: 'Group Training', detail: '12 tháng · Tối', total: 12000000, payName: 'Chuyển khoản', due: 12000000, date: '2026-11-02', note: '', confirm: { token: 'a1b2c3d4e5f6a7b8c9d0e1f2' } },
  consult: { code: '#DC-SVC-12345', name: 'Nguyễn Văn A', phone: '0909123456', city: 'TP. Hồ Chí Minh', typeName: 'Phòng gym', areaName: '50–100 m²', svcNames: ['Cung cấp thiết bị'], budgetName: '100–300 triệu', note: '' },
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
    const html = `<h2 style="font-family:Arial,sans-serif">${esc(title)}</h2><table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">` +
      lines.map(l => { const [k, v] = split(l); return k ? `<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(k)}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>` : `<tr><td colspan="2" style="padding:4px 0">${esc(v) || '&nbsp;'}</td></tr>`; }).join('') + '</table>' +
      (url ? `<p><a href="${esc(url)}">Mở trang quản trị</a></p>` : '');
    try {
      await mailer().sendMail({ from: env('MAIL_FROM') || env('SMTP_USER'), to: env('NOTIFY_EMAIL'), subject: title, html, text: lines.join('\n') + (url ? '\n\n' + url : '') });
      result.email = 'ok';
    } catch (e) { result.email = 'lỗi: ' + e.message; }
    note(meta, 'email', env('NOTIFY_EMAIL'), title, result.email === 'ok' ? 'ok' : 'failed', result.email === 'ok' ? '' : result.email);
  }
  return result;
}
// email cho khách (xác nhận đơn / đăng ký): chữ thường, giữ xuống dòng; link (dòng bắt đầu bằng http) bấm được
async function sendCustomer(to, subject, lines, meta = {}) {
  if (!env('SMTP_HOST')) return { email: 'chưa cài SMTP' };
  if (!to) return { email: 'khách không nhập email' };
  const line = l => (!l ? '&nbsp;' : esc(l).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>'));
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222">${lines.map(line).join('<br>')}</div>`;
  let r;
  try {
    await mailer().sendMail({ from: env('MAIL_FROM') || env('SMTP_USER'), to, subject, html, text: lines.join('\n') });
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
  const vars = VARS[kind](entry);
  const r = await sendCustomer(to, fill(cus.subject, vars), renderLines(cus.body, vars), { kind, ref: entry.code });
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
  if (customer) { const c = t.customer[kind]; return c ? sendCustomer(env('NOTIFY_EMAIL'), '[Thử] ' + fill(c.subject, vars), renderLines(c.body, vars), { kind: 'test' }) : Promise.resolve({ email: 'không có mẫu' }); }
  const o = t.templates[kind];
  return send('[Thử] ' + fill(o.title, vars), renderLines(o.body, vars), '', { kind: 'test' });
}
// xem trước trong /admin (không gửi)
function preview(kind, title, body) {
  const vars = VARS[kind] ? VARS[kind](SAMPLE[kind]) : {};
  return { title: fill(title, vars), lines: renderLines(body, vars), vars: Object.keys(vars) };
}

module.exports = {
  channels, test, preview,
  vars: Object.fromEntries(Object.keys(VARS).map(k => [k, Object.keys(VARS[k](SAMPLE[k]))])),
  order: (o, onCustomer) => fire('order', o, '#/orders/' + o.id, onCustomer),
  registration: (r, onCustomer) => fire('registration', r, '#/registrations/' + r.id, onCustomer),
  consult: c => fire('consult', c, '#/consults/' + c.id),
  // /admin: gửi lại email xác nhận (kể cả khi mẫu đang tắt)
  resend: (kind, entry) => customerMail(kind, entry, true),
};
