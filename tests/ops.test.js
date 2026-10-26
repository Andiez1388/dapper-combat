/*
 * Kiểm tra tính năng vận hành (Đợt 3): nhận tiền, sửa đơn, tạo đơn tay, sửa đăng ký, hội viên,
 * tài khoản nhân viên + phân quyền, mã giảm giá có điều kiện, tồn kho theo size × màu, sao lưu / khôi phục.
 * Chạy sau api.test.js (dùng phiên quản trị env.adminToken).
 */
const fs = require('fs');

module.exports = async function opsTests(env, t) {
  const B = env.base;
  let ip = 0;
  const req = async (url, o = {}) => {
    const r = await fetch(B + url, {
      method: o.method || 'GET',
      // mỗi lượt gọi một IP giả (máy chủ tin X-Forwarded-For từ chính máy) → không vướng giới hạn chống spam
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.1.' + (++ip >> 8 & 255) + '.' + (ip & 255), ...(o.tok !== false ? { Authorization: 'Bearer ' + (o.tok || env.adminToken) } : {}) },
      body: o.body ? JSON.stringify(o.body) : undefined,
    });
    const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch { /* không phải JSON */ }
    return { s: r.status, j, t: text };
  };
  const pub = (url, body) => req(url, { method: 'POST', body, tok: false });
  const prods = (await req('/api/admin/products')).j;
  const p = prods.find(x => x.stock >= 10 && x.visible !== false) || prods[0];
  const line = (qty, prod = p, si = 0, ci = 0) => ({ id: prod.id, size: prod.sizes[si], color: prod.colors[ci][0], qty });
  const cust = { name: 'Khách Vận Hành', phone: '0933222111', address: '9 Nguyễn Huệ, Bến Nghé', city: 'TP. Hồ Chí Minh' };
  const stockOf = async id => (await req('/api/admin/products')).j.find(x => x.id === id).stock;

  t.section('Đã nhận tiền & doanh thu');
  await t.run('nhận tiền', async () => {
    let r = await pub('/api/orders', { customer: cust, items: [line(1)], pay: 'bank', ship: 'std' });
    const oid = r.j.id;
    r = await req('/api/orders/' + oid, { method: 'PUT', body: { paid: true, paidNote: 'Đã thấy tiền trong sao kê' } });
    t.ok(r.s === 200 && r.j.paid === true && r.j.paidAmount === r.j.total && r.j.paidBy, 'bật "Đã nhận tiền" → ghi số tiền = tổng đơn + người ghi', r.j);
    const st = (await req('/api/stats')).j;
    t.ok(st.money && st.money.collected >= r.j.total, 'Tổng quan: "Đã thu" có tiền của đơn vừa nhận', st.money);
    r = await pub('/api/orders', { customer: cust, items: [line(1)], pay: 'cod', ship: 'std' });
    const cod = r.j.id;
    r = await req('/api/orders/' + cod, { method: 'PUT', body: { status: 'done' } });
    t.ok(r.j.paid === true, 'đơn COD chuyển "Hoàn tất" → tự ghi đã nhận tiền', r.j);
    r = await req(`/api/slip/${r.j.code.replace('#', '')}?k=${r.j.confirm.token}`, { tok: false });
    t.ok(r.j.paid === true && r.j.pay === null, 'phiếu xác nhận báo đã thanh toán, ẩn mã QR', r.j);
  });

  t.section('Tạo đơn tay & sửa đơn');
  await t.run('đơn tay', async () => {
    const s0 = await stockOf(p.id);
    let r = await req('/api/admin/orders', { method: 'POST', body: { customer: cust, items: [line(2)], shipping: 0, discount: 50000, pay: 'cod', ship: 'pickup', source: 'walkin', status: 'confirmed' } });
    t.ok(r.s === 201 && /^#DC-\d{6}$/.test(r.j.code) && r.j.source === 'walkin' && r.j.ship === 'pickup' && r.j.confirm && r.j.confirm.token, 'tạo đơn tay (mua tại phòng tập) có mã đơn + phiếu xác nhận', r.j);
    t.ok(r.j.total === p.price * 2 - 50000, 'đơn tay tự tính tiền (giảm 50.000đ)', r.j.total);
    t.ok(await stockOf(p.id) === s0 - 2, 'đơn tay trừ tồn kho');
    const id = r.j.id;
    r = await req('/api/orders/' + id + '/edit', { method: 'PUT', body: { items: [line(3)], shipping: 15000, carrier: 'GHN', trackingCode: 'GHN123456', reason: 'khách lấy thêm 1' } });
    t.ok(r.s === 200 && r.j.items[0].qty === 3 && r.j.shipping === 15000 && r.j.total === p.price * 3 - 50000 + 15000, 'sửa đơn: tăng số lượng, thêm phí giao → tự tính lại tổng', r.j);
    t.ok(await stockOf(p.id) === s0 - 3, 'sửa đơn: trừ thêm đúng 1 cái trong kho');
    t.ok(r.j.history.some(h => h.edit && /Sửa đơn/.test(h.note) && h.by), 'sửa đơn ghi lịch sử (ai sửa, sửa gì)');
    r = await req(`/api/slip/${r.j.code.replace('#', '')}?k=${r.j.confirm.token}`, { tok: false });
    t.ok(r.j.carrier === 'GHN' && r.j.trackingCode === 'GHN123456', 'phiếu xác nhận có đơn vị vận chuyển + mã vận đơn', r.j);
    r = await req('/api/orders/' + id + '/edit', { method: 'PUT', body: { items: [line(9999)] } });
    t.ok(r.s === 409 || r.s === 400, 'sửa đơn vượt tồn kho → báo lỗi', r.j);
    r = await req('/api/orders/' + id + '/edit', { method: 'PUT', body: { items: [line(1)] } });
    t.ok(r.s === 200 && await stockOf(p.id) === s0 - 1, 'sửa đơn giảm số lượng → trả lại kho');
    await req('/api/orders/' + id, { method: 'PUT', body: { status: 'cancelled' } });
    t.ok(await stockOf(p.id) === s0, 'hủy đơn tay → trả hết về kho');
  });

  t.section('Sửa đăng ký & hội viên');
  await t.run('đăng ký', async () => {
    let r = await pub('/api/registrations', { name: 'Học Viên PT', phone: '0944555666', program: 'pt', lang: 'vi' });
    const rid = r.j.id;
    r = await req('/api/registrations/' + rid + '/edit', { method: 'PUT', body: { total: 6000000, due: 2000000, reason: 'giá PT thỏa thuận' } });
    t.ok(r.s === 200 && r.j.total === 6000000 && r.j.due === 2000000, 'nhập học phí PT 1-1 thỏa thuận', r.j);
    r = await req('/api/registrations/' + rid + '/edit', { method: 'PUT', body: { due: 9000000 } });
    t.ok(r.s === 400, 'số cần trả trước lớn hơn học phí → báo lỗi');
    r = await pub('/api/registrations', { name: 'Hội Viên Mới', phone: '0955666777', program: 'gt', pkg: '3', opt: 'am', pay: 'full', lang: 'vi' });
    r = await req('/api/registrations/' + r.j.id, { method: 'PUT', body: { status: 'enrolled' } });
    t.ok(r.j.startDate && r.j.endDate && r.j.endDate > r.j.startDate, 'chuyển "Đã nhập học" → tự đặt ngày bắt đầu / hết hạn (gói 3 tháng)', r.j);
    const st = (await req('/api/stats')).j;
    t.ok(st.members && st.members.total >= 1 && st.members.active >= 1, 'Tổng quan đếm hội viên đang tập', st.members);
  });

  t.section('Tài khoản nhân viên & phân quyền');
  await t.run('nhân viên', async () => {
    let r = await req('/api/users', { method: 'POST', body: { name: 'Nhân Viên A', email: 'nhanvien@example.com', role: 'staff' } });
    t.ok(r.s === 201 && r.j.tempPassword && r.j.tempPassword.length >= 10 && r.j.user.mustChange, 'admin tạo tài khoản nhân viên (mật khẩu tạm, bắt đổi lần đầu)', r.j);
    const staffId = r.j.user.id, tmp = r.j.tempPassword;
    r = await pub('/api/auth/login', { email: 'nhanvien@example.com', password: tmp });
    t.ok(r.s === 200 && r.j.user.role === 'staff' && r.j.user.mustChange, 'nhân viên đăng nhập bằng mật khẩu tạm');
    t.ok((await req('/api/orders', { tok: r.j.token })).s === 403, 'chưa đổi mật khẩu tạm → chưa dùng được');
    r = await req('/api/auth/change-password', { method: 'POST', tok: r.j.token, body: { currentPassword: tmp, newPassword: 'NhanVien-' + Date.now() } });
    const S = r.j.token;
    t.ok(r.s === 200 && S, 'nhân viên đổi mật khẩu tạm');
    t.ok((await req('/api/orders', { tok: S })).s === 200, 'nhân viên xem được đơn hàng');
    t.ok((await req('/api/stats', { tok: S })).s === 200, 'nhân viên xem được Tổng quan');
    t.ok((await req('/api/settings', { method: 'PUT', tok: S, body: { shop: { shipFee: 1 } } })).s === 403, 'nhân viên KHÔNG sửa được Thiết lập');
    t.ok((await req('/api/cms', { method: 'PUT', tok: S, body: {} })).s === 403, 'nhân viên KHÔNG sửa được nội dung website');
    t.ok((await req('/api/users', { tok: S })).s === 403, 'nhân viên KHÔNG xem được danh sách tài khoản');
    t.ok((await req('/api/backup', { tok: S })).s === 403, 'nhân viên KHÔNG tải được bản sao lưu');
    const anyOrder = (await req('/api/orders')).j[0];
    t.ok((await req('/api/orders/' + anyOrder.id, { method: 'DELETE', tok: S })).s === 403, 'nhân viên KHÔNG xóa được đơn hàng');
    r = await req('/api/users/' + staffId + '/reset-password', { method: 'POST' });
    t.ok(r.s === 200 && (await req('/api/orders', { tok: S })).s === 401, 'admin cấp lại mật khẩu → máy nhân viên bị đăng xuất');
    const me = (await req('/api/auth/me')).j;
    t.ok((await req('/api/users/' + me.id, { method: 'DELETE' })).s === 400, 'không tự xóa tài khoản đang đăng nhập');
    t.ok((await req('/api/users/' + me.id, { method: 'PUT', body: { role: 'staff' } })).s === 400, 'không tự hạ quyền admin của chính mình');
    t.ok((await req('/api/users/' + staffId, { method: 'DELETE' })).s === 200, 'admin xóa tài khoản nhân viên');
  });

  t.section('Mã giảm giá có điều kiện');
  await t.run('mã giảm giá', async () => {
    const st = (await req('/api/settings')).j;
    const base = st.shop.promos.map(x => ({ code: x.code, type: x.type, value: x.value, active: x.active, expires: x.expires || '', maxUses: x.maxUses || 0, minOrder: x.minOrder || 0 }));
    const setPromo = (code, patch) => req('/api/settings', { method: 'PUT', body: { shop: { promos: base.map(x => (x.code === code ? { ...x, ...patch } : x)) } } });
    await setPromo('GIAM100', { minOrder: 99000000 });
    let r = await pub('/api/promo', { code: 'GIAM100', subtotal: 500000 });
    t.ok(r.s === 422 && /tối thiểu/.test(r.j.error), 'chưa đủ đơn tối thiểu → báo "Đơn tối thiểu…"', r.j);
    r = await pub('/api/orders', { customer: cust, items: [line(1)], pay: 'cod', ship: 'std', promo: 'GIAM100' });
    t.ok(r.s === 422 && r.j.promoError, 'đặt hàng với mã chưa đủ điều kiện → báo lỗi mã (không tạo đơn)', r.j);
    await setPromo('GIAM100', { expires: '2020-01-01' });
    r = await pub('/api/promo', { code: 'GIAM100', subtotal: 500000, lang: 'en' });
    t.ok(r.s === 422 && /expired/.test(r.j.error), 'mã hết hạn → báo hết hạn', r.j);
    await setPromo('GIAM100', { maxUses: 1 });
    r = await pub('/api/orders', { customer: cust, items: [line(1)], pay: 'cod', ship: 'std', promo: 'GIAM100' });
    t.ok(r.s === 201 && r.j.discount === 100000, 'dùng mã lần 1 (tối đa 1 lượt)', r.j);
    const used1 = r.j.id;
    r = await pub('/api/promo', { code: 'GIAM100', subtotal: 500000 });
    t.ok(r.s === 422 && /hết lượt/.test(r.j.error), 'hết lượt dùng → báo hết lượt', r.j);
    await req('/api/orders/' + used1, { method: 'PUT', body: { status: 'cancelled' } });
    r = await pub('/api/promo', { code: 'GIAM100', subtotal: 500000 });
    t.ok(r.s === 200, 'hủy đơn đã dùng mã → mã được dùng lại', r.j);
    const after = (await req('/api/settings')).j.shop.promos.find(x => x.code === 'GIAM100');
    t.ok(after.used === 0, 'admin thấy số lượt đã dùng', after);
    await req('/api/settings', { method: 'PUT', body: { shop: { promos: base } } });
  });

  t.section('Tồn kho theo size × màu');
  await t.run('tồn kho biến thể', async () => {
    const q = (await req('/api/admin/products')).j.find(x => x.sizes.length >= 2) || p;
    const k0 = q.sizes[0] + '::' + q.colors[0][0], k1 = q.sizes[1] + '::' + q.colors[0][0];
    let r = await req('/api/products/' + q.id, { method: 'PUT', body: { ...q, stockBy: { [k0]: 1, [k1]: 0 } } });
    t.ok(r.s === 200 && r.j.stockBy && r.j.stockBy[k0] === 1 && r.j.stock === 1, 'lưu tồn kho riêng từng size / màu (tổng tự cộng)', r.j && { stock: r.j.stock, stockBy: r.j.stockBy });
    const pubP = (await req('/api/products', { tok: false })).j.find(x => x.id === q.id);
    t.ok(pubP.stockBy && pubP.stockBy[k0] === 1, 'trang web nhận được tồn kho theo size / màu');
    r = await pub('/api/orders', { customer: cust, items: [{ id: q.id, size: q.sizes[1], color: q.colors[0][0], qty: 1 }], pay: 'cod', ship: 'std', lang: 'en' });
    t.ok(r.s === 409 && new RegExp(q.sizes[1]).test(r.j.error), 'size đã hết → không đặt được, báo đúng size', r.j);
    r = await pub('/api/orders', { customer: cust, items: [{ id: q.id, size: q.sizes[0], color: q.colors[0][0], qty: 1 }], pay: 'cod', ship: 'std' });
    t.ok(r.s === 201, 'size còn hàng → đặt được', r.j);
    const oid = r.j.id;
    let cur = (await req('/api/admin/products')).j.find(x => x.id === q.id);
    t.ok(cur.stockBy[k0] === 0 && cur.stock === 0, 'đặt hàng trừ đúng ô size / màu');
    await req('/api/orders/' + oid, { method: 'PUT', body: { status: 'cancelled' } });
    cur = (await req('/api/admin/products')).j.find(x => x.id === q.id);
    t.ok(cur.stockBy[k0] === 1, 'hủy đơn trả đúng ô size / màu');
    await req('/api/products/' + q.id, { method: 'PUT', body: { ...q, stockBy: null } });
  });

  t.section('Sao lưu & khôi phục');
  await t.run('sao lưu', async () => {
    let r = await req('/api/backup');
    t.ok(r.s === 200 && r.j.app === 'dapper-combat' && r.j.files['orders.json'] && r.j.files['users.json'] && !JSON.stringify(r.j).includes('.jwt-secret'), 'tải bản sao lưu (đủ dữ liệu, không kèm khóa đăng nhập)');
    const bk = r.j, before = (await req('/api/consults')).j.length;
    await pub('/api/consults', { name: 'Sau Sao Lưu', phone: '0901112223', city: 'Huế' });
    t.ok((await req('/api/consults')).j.length === before + 1, 'thêm dữ liệu mới sau khi sao lưu');
    r = await req('/api/backup/restore', { method: 'POST', body: bk });
    t.ok(r.s === 200 && r.j.ok && /truoc-khoi-phuc-/.test(r.j.savedTo), 'khôi phục bản sao lưu (cất bản hiện tại trước)', r.j);
    t.ok((await req('/api/consults')).j.length === before, 'dữ liệu trở về đúng lúc sao lưu');
    t.ok(fs.readdirSync(env.data).some(f => f.startsWith('truoc-khoi-phuc-')), 'có thư mục cất dữ liệu trước khi khôi phục');
    r = await req('/api/backup/restore', { method: 'POST', body: { app: 'khac', files: {} } });
    t.ok(r.s === 400, 'file không phải bản sao lưu → từ chối');
    r = await req('/api/backup/restore', { method: 'POST', body: { ...bk, files: { 'users.json': bk.files['users.json'].map(u => ({ ...u, role: 'staff' })) } } });
    t.ok(r.s === 400 && /admin/.test(r.j.error), 'bản sao lưu không có admin → từ chối (tránh bị khóa ngoài)', r.j);
  });
};
