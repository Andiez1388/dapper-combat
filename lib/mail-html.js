/*
 * Giao diện email (gửi khách + báo chủ shop): bảng HTML, style viết thẳng trong thẻ → hiển thị đúng trên Gmail, Apple Mail, Outlook, điện thoại.
 *   - đầu thư nền đen: logo (/admin → Thương hiệu & menu) hoặc chữ DAPPER COMBAT nếu ảnh bị chặn
 *   - dòng "Nhãn: giá trị" liền nhau → bảng thông tin; dòng có link phiếu của website → nút bấm
 *   - chữ ký + hotline, email, website, địa chỉ, mạng xã hội (/admin → Nội dung website → Liên hệ & MXH)
 * Chữ ký sửa ở /admin → Thiết lập → Thông báo → Chữ ký email.
 */
const C = { ink: '#141414', soft: '#5f5f5f', mute: '#8a8a8a', line: '#e7e4df', bg: '#efede9', card: '#ffffff', panel: '#f7f6f3', red: '#d6312b', black: '#0b0b0b' };
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const EYEBROW = {
  order: ['Xác nhận đơn hàng', 'Order confirmation'],
  registration: ['Xác nhận đăng ký', 'Registration confirmed'],
  consult: ['Yêu cầu tư vấn', 'Consultation request'],
  owner: ['Thông báo mới', 'New notification'],
  test: ['Email thử', 'Test email'],
};
const T = {
  hotline: ['Hotline', 'Hotline'], email: ['Email', 'Email'], web: ['Website', 'Website'], addr: ['Địa chỉ', 'Address'],
  auto: ['Email này được gửi tự động từ {site}. Cần hỗ trợ, bạn chỉ cần trả lời email này hoặc gọi hotline.',
    'This email was sent automatically from {site}. Need help? Simply reply to this email or call our hotline.'],
  tax: ['MST', 'Tax ID'],
};
const SOCIAL = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['zalo', 'Zalo'], ['youtube', 'YouTube'], ['tiktok', 'TikTok']];

// "Nhãn: giá trị" → [nhãn, giá trị]
const split = l => { const i = l.indexOf(': '); return i > 0 && i < 40 ? [l.slice(0, i), l.slice(i + 2)] : [null, l]; };
const isUrl = v => /^https?:\/\/\S+$/.test(v);

// gom các dòng thành khối: đoạn văn / bảng thông tin / nút bấm
function blocks(lines, site) {
  const out = [];
  let para = null, table = null;
  const own = u => site && (u === site || u.startsWith(site + '/'));
  const flush = () => { if (para) out.push({ t: 'p', lines: para }); if (table) out.push({ t: 'kv', rows: table }); para = table = null; };
  for (const raw of lines) {
    const l = String(raw == null ? '' : raw).trim();
    if (!l) { flush(); continue; }
    const [k, v] = split(l);
    if (k && isUrl(v) && own(v)) { flush(); out.push({ t: 'btn', label: k, url: v }); continue; }
    if (k) { if (para) { out.push({ t: 'p', lines: para }); para = null; } (table = table || []).push([k, v]); continue; }
    if (table) { out.push({ t: 'kv', rows: table }); table = null; }
    (para = para || []).push(l);
  }
  flush();
  return out;
}
// chữ trong đoạn: link của website bấm được, link lạ để nguyên chữ (khách có thể tự gõ link vào ghi chú)
function inline(text, site) {
  return esc(text).replace(/(https?:\/\/[^\s<"']+)/g, u => (site && (u === site || u.startsWith(site + '/')) ? `<a href="${u}" style="color:${C.red};text-decoration:underline">${u}</a>` : u));
}
function renderBlock(b, site, first) {
  if (b.t === 'p') {
    return `<p style="margin:0 0 18px;font:${first ? '600 17px/1.6' : '400 15px/1.7'} ${FONT};color:${first ? C.ink : '#2b2b2b'}">${b.lines.map(l => inline(l, site)).join('<br>')}</p>`;
  }
  if (b.t === 'btn') {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 24px"><tr><td bgcolor="${C.red}" style="border-radius:999px">` +
      `<a href="${esc(b.url)}" target="_blank" style="display:inline-block;padding:14px 28px;font:700 14px/1 ${FONT};letter-spacing:.06em;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:999px">${esc(b.label)} &rarr;</a>` +
      `</td></tr></table>`;
  }
  // bảng thông tin: nhãn xám bên trái, giá trị đậm bên phải; "a; b; c" → mỗi ý một dòng (danh sách sản phẩm)
  const rows = b.rows.map(([k, v], i) => {
    const val = String(v).split('; ').map(x => inline(x, site)).join('<br>');
    const top = i ? `border-top:1px solid ${C.line};` : '';
    // số tiền chính (Tổng cộng / Học phí / Total / Fee) → chữ to, màu đỏ
    const big = /^(tổng cộng|tổng tiền|học phí|total|fee)$/i.test(k.trim());
    return `<tr><td valign="top" style="${top}padding:12px 12px 12px 0;width:38%;font:400 13px/1.5 ${FONT};color:${C.mute}">${esc(k)}</td>` +
      `<td valign="top" align="right" style="${top}padding:12px 0;font:${big ? '800 18px/1.4' : '600 14px/1.5'} ${FONT};color:${big ? C.red : C.ink}">${val}</td></tr>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;background:${C.panel};border:1px solid ${C.line};border-radius:12px">` +
    `<tr><td style="padding:6px 20px">${'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + rows + '</table>'}</td></tr></table>`;
}

/**
 * opts: { kind, lang, subject, lines, code, site, logo, contact, sign: { on, closing, name, tagline }, preheader, footer: true|false }
 * contact: giá trị đã nhập ở Liên hệ & MXH (phone, email, addr1, addr2, maps, facebook, instagram, zalo, youtube, company, taxId)
 */
function render(o) {
  const L = o.lang === 'en' ? 1 : 0, site = String(o.site || '').replace(/\/+$/, ''), host = site.replace(/^https?:\/\//, '');
  const ct = o.contact || {}, sign = o.sign || {};
  const eyebrow = (EYEBROW[o.kind] || EYEBROW.owner)[L];
  const logoUrl = o.logo ? (/^https?:\/\//.test(o.logo) ? o.logo : site + o.logo) : '';
  const brand = logoUrl && site
    ? `<img src="${esc(logoUrl)}" alt="DAPPER COMBAT" height="34" style="display:block;height:34px;width:auto;max-width:240px;border:0;outline:none;font:800 20px/34px ${FONT};letter-spacing:.2em;color:#ffffff">`
    : `<span style="font:800 20px/34px ${FONT};letter-spacing:.2em;color:#ffffff">DAPPER COMBAT</span>`;
  const body = blocks(o.lines || [], site).map((b, i) => renderBlock(b, site, i === 0)).join('');

  // chữ ký
  const sig = sign.on === false ? '' :
    `<tr><td class="dc-pad" style="padding:4px 40px 34px">` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${C.line};padding-top:24px">` +
      (sign.closing ? `<p style="margin:0 0 4px;font:400 15px/1.6 ${FONT};color:${C.soft}">${esc(sign.closing)}</p>` : '') +
      `<p style="margin:0;font:700 16px/1.5 ${FONT};color:${C.ink}">${esc(sign.name || 'Dapper Combat')}</p>` +
      (sign.tagline ? `<p style="margin:2px 0 0;font:700 11px/1.6 ${FONT};letter-spacing:.18em;text-transform:uppercase;color:${C.red}">${esc(sign.tagline)}</p>` : '') +
      `</td></tr></table></td></tr>`;

  // chân thư: liên hệ + mạng xã hội + doanh nghiệp
  const tel = String(ct.phone || '').replace(/[^\d+]/g, '');
  const mailTo = ct.email || o.from || '';
  const addr = [ct.addr1, ct.addr2].filter(Boolean).join(', ');
  const link = (href, text) => `<a href="${esc(href)}" target="_blank" style="color:#ffffff;text-decoration:none">${esc(text)}</a>`;
  const info = [
    tel && [T.hotline[L], link('tel:' + tel, ct.phone)],
    mailTo && [T.email[L], link('mailto:' + mailTo, mailTo)],
    site && [T.web[L], link(site, host)],
    addr && [T.addr[L], ct.maps ? link(ct.maps, addr) : esc(addr)],
  ].filter(Boolean).map(([k, v]) =>
    `<tr><td valign="top" style="padding:3px 14px 3px 0;font:400 12px/1.6 ${FONT};color:#8d8d8d;white-space:nowrap">${esc(k)}</td><td style="padding:3px 0;font:500 13px/1.6 ${FONT};color:#ffffff">${v}</td></tr>`).join('');
  const social = SOCIAL.filter(([k]) => /^https?:\/\//.test(ct[k] || '')).map(([k, n]) =>
    `<a href="${esc(ct[k])}" target="_blank" style="display:inline-block;margin:0 6px 6px 0;padding:7px 14px;border:1px solid #3a3a3a;border-radius:999px;font:600 12px/1 ${FONT};color:#ffffff;text-decoration:none">${n}</a>`).join('');
  const company = [ct.company, ct.taxId && T.tax[L] + ': ' + ct.taxId].filter(Boolean).join(' · ');
  const footer = o.footer === false ? '' :
    `<tr><td bgcolor="${C.black}" class="dc-pad" style="padding:30px 40px 32px;background:${C.black}">` +
      `<p style="margin:0 0 14px;font:800 13px/1 ${FONT};letter-spacing:.22em;color:#ffffff">DAPPER COMBAT</p>` +
      (info ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px">${info}</table>` : '') +
      (social ? `<div style="margin:0 0 12px">${social}</div>` : '') +
      (company ? `<p style="margin:0 0 8px;font:400 12px/1.6 ${FONT};color:#8d8d8d">${esc(company)}</p>` : '') +
      `<p style="margin:0;font:400 11px/1.6 ${FONT};color:#6f6f6f">${esc(T.auto[L].replace('{site}', host || 'Dapper Combat'))}</p>` +
    `</td></tr>`;

  const pre = esc(o.preheader || '');
  return `<!DOCTYPE html><html lang="${L ? 'en' : 'vi'}" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">` +
    `<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(o.subject || '')}</title>` +
    `<style>@media (max-width:620px){.dc-pad{padding-left:22px!important;padding-right:22px!important}.dc-h1{font-size:26px!important}}</style></head>` +
    `<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%">` +
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${pre}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background:${C.bg}"><tr><td align="center" style="padding:28px 12px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${C.card};border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04)">` +
      // đầu thư
      `<tr><td bgcolor="${C.black}" class="dc-pad" style="padding:26px 40px;background:${C.black}">${brand}</td></tr>` +
      `<tr><td height="4" bgcolor="${C.red}" style="height:4px;line-height:4px;font-size:0;background:${C.red}">&nbsp;</td></tr>` +
      // tiêu đề
      `<tr><td class="dc-pad" style="padding:36px 40px 6px">` +
        `<p style="margin:0 0 10px;font:700 12px/1 ${FONT};letter-spacing:.2em;text-transform:uppercase;color:${C.red}">${esc(eyebrow)}</p>` +
        (o.code ? `<h1 class="dc-h1" style="margin:0 0 26px;font:800 32px/1.15 ${FONT};letter-spacing:-.01em;color:${C.ink}">${esc(o.code)}</h1>`
          : `<h1 class="dc-h1" style="margin:0 0 26px;font:800 26px/1.25 ${FONT};color:${C.ink}">${esc(o.subject || '')}</h1>`) +
      `</td></tr>` +
      // nội dung
      `<tr><td class="dc-pad" style="padding:0 40px 10px">${body}</td></tr>` +
      sig + footer +
    `</table></td></tr></table></body></html>`;
}

module.exports = { render };
