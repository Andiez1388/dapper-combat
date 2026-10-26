/*
 * Email xác nhận cho khách (máy chủ email giả tests/lib/smtp.js): tiếng Việt / tiếng Anh theo ngôn ngữ khách đặt,
 * bản tiếng Anh AI dịch lại khi mẫu tiếng Việt đổi. Chạy sau api.test.js + ai.test.js.
 */
module.exports = async function mailTests(env, t) {
  if (!env.smtp) return;
  const B = env.base;
  let ip = 0;
  const req = async (url, o = {}) => {
    const r = await fetch(B + url, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.3.0.' + (++ip & 255), ...(o.pub ? {} : { Authorization: 'Bearer ' + env.adminToken }) }, body: o.body ? JSON.stringify(o.body) : undefined });
    const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch { /* không phải JSON */ }
    return { s: r.status, j };
  };
  const mailTo = async (to, ms = 4000) => {
    const end = Date.now() + ms;
    for (;;) {
      const m = env.smtp.mails.filter(x => x.to.includes(to)).pop();
      if (m || Date.now() > end) return m || null;
      await new Promise(r => setTimeout(r, 80));
    }
  };
  const settle = async () => { for (let i = 0; i < 100; i++) { await new Promise(r => setTimeout(r, 60)); const st = (await req('/api/translate/status')).j; if (st && !st.running && !st.queued) return; } };
  const p = (await req('/api/products', { pub: true })).j.find(x => x.stock > 5) ;
  const order = (email, lang) => req('/api/orders', { method: 'POST', pub: true, body: { lang, customer: { name: 'Khách Email', phone: '0912000111', email, address: '1 Lê Lợi', city: 'TP. Hồ Chí Minh' }, items: [{ id: p.id, qty: 1, size: p.sizes[0], color: p.colors[0][0] }], pay: 'bank', ship: 'std' } });

  t.section('Email xác nhận cho khách (VI / EN)');
  await t.run('email', async () => {
    await req('/api/settings', { method: 'PUT', body: { ai: { enabled: true }, notify: { customer: { order: { on: true }, registration: { on: true } } } } });
    let r = await order('vi@example.com', 'vi');
    let m = await mailTo('vi@example.com');
    t.ok(m && /đã nhận đơn hàng #DC-\d+/.test(m.subject) && /Tổng cộng: [\d.]+₫/.test(m.text), 'khách đặt tiếng Việt → email tiếng Việt', m && { subject: m.subject, text: m.text.slice(0, 200) });
    const o = (await req('/api/orders')).j.find(x => x.id === r.j.id);
    t.ok(o.confirm.email.status === 'sent', 'đơn ghi "đã gửi email xác nhận"', o.confirm.email);
    r = await order('en@example.com', 'en');
    m = await mailTo('en@example.com');
    t.ok(m && /^Dapper Combat received your order #DC-\d+/.test(m.subject) && /Total: [\d,]+₫/.test(m.text) && /Payment: Bank transfer/.test(m.text), 'khách đặt tiếng Anh → email tiếng Anh (giá, cách thanh toán bằng tiếng Anh)', m && { subject: m.subject, text: m.text.slice(0, 300) });
    r = await req('/api/registrations', { method: 'POST', pub: true, body: { name: 'Member EN', phone: '0912000222', email: 'reg-en@example.com', program: 'trial', programName: 'Free trial', lang: 'en' } });
    m = await mailTo('reg-en@example.com');
    t.ok(m && /received your registration #DC-REG-\d+/.test(m.subject), 'đăng ký tiếng Anh → email tiếng Anh', m && m.subject);

    // sửa mẫu tiếng Việt → AI dịch lại bản tiếng Anh
    const cur = (await req('/api/settings')).j.notify.customer.order;
    await req('/api/settings', { method: 'PUT', body: { notify: { customer: { order: { ...cur, subject: 'Cảm ơn bạn — đơn {code}' } } } } });
    await settle();
    const after = (await req('/api/settings')).j.notify.customer.order;
    t.ok(after.subjectEn === '[EN] Cảm ơn bạn — đơn {code}' && after.bodyEn === cur.bodyEn, 'sửa tiêu đề tiếng Việt → AI dịch lại tiêu đề tiếng Anh (nội dung không đổi thì giữ)', { subjectEn: after.subjectEn });
    await order('en2@example.com', 'en');
    m = await mailTo('en2@example.com');
    t.ok(m && /^\[EN\] Cảm ơn bạn — đơn #DC-\d+/.test(m.subject), 'email tiếng Anh dùng bản AI vừa dịch', m && m.subject);

    // tắt AI, sửa tiếng Việt → chưa có bản tiếng Anh → khách tiếng Anh tạm nhận bản tiếng Việt
    await req('/api/settings', { method: 'PUT', body: { ai: { enabled: false }, notify: { customer: { order: { ...after, subject: 'Đơn {code} đã nhận' } } } } });
    await order('en3@example.com', 'en');
    m = await mailTo('en3@example.com');
    t.ok(m && /^Đơn #DC-\d+ đã nhận/.test(m.subject), 'chưa có bản tiếng Anh → tạm gửi bản tiếng Việt (không gửi bản tiếng Anh cũ sai nội dung)', m && m.subject);
    await req('/api/settings', { method: 'PUT', body: { ai: { enabled: true }, notify: { customer: { order: null, registration: { on: false } } } } });
  });
};
