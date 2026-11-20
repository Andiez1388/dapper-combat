/*
 * Sản phẩm tự thiết kế (lib/custom.js): cấu hình trong /admin, máy chủ tự tính phụ phí, không trừ tồn kho,
 * logo tải lên chỉ nhận ảnh thật, sửa đơn giữ nguyên bản thiết kế.
 */
module.exports = async function customTests(env, t) {
  const B = env.base;
  let ip = 0;
  const req = async (url, o = {}) => {
    const r = await fetch(B + url, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.7.0.' + (++ip & 255), ...(o.pub ? {} : { Authorization: 'Bearer ' + env.adminToken }) }, body: o.body ? JSON.stringify(o.body) : undefined });
    const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch { /* không phải JSON */ }
    return { s: r.status, j };
  };
  const cust = { name: 'Khách Custom', phone: '0912000222', email: 'cx@example.com', address: '1 Lê Lợi', city: 'TP. Hồ Chí Minh' };

  t.section('Sản phẩm tự thiết kế (custom)');
  await t.run('custom', async () => {
    const d = await req('/api/custom/defaults?template=groin');
    t.ok(d.s === 200 && d.j.config.groups.length >= 3 && d.j.defs.palette.length >= 10, 'admin lấy được cấu hình mẫu groin guard', d.s);
    t.ok((await req('/api/custom/defaults', { pub: true })).s === 401, 'khách không xem được /custom/defaults');

    const cfg = { ...d.j.config, on: true, fee: 200000, palette: ['black', 'red', 'evil', 'white'], groups: [...d.j.config.groups, { name: { vi: '<b>x</b>' }, choices: [] }] };
    let r = await req('/api/products', { method: 'POST', body: { name: 'Test Groin Custom', cat: 'gang', price: 900000, stock: 3, sizes: ['M', 'L'], colors: [['black', '#111111']], visible: true, custom: cfg } });
    const p = r.j;
    t.ok(r.s === 200 || r.s === 201, 'tạo sản phẩm có thiết kế riêng', r.j);
    t.ok(p.custom && p.custom.on && !p.custom.palette.includes('evil') && p.custom.groups.length === d.j.config.groups.length, 'máy chủ làm sạch cấu hình (bỏ màu lạ, nhóm rỗng)', p.custom);

    const spec = { zones: { cup: 'white', trim: 'gold', left: 'red' }, text: { value: 'PHONG', font: 'script', method: 'embroid', spot: 'belt' }, groups: { material: 'cow', extra: ['flag', 'nope'] }, note: 'chữ nghiêng' };
    r = await req('/api/orders', { method: 'POST', pub: true, body: { customer: cust, pay: 'bank', ship: 'std', items: [{ id: p.id, size: 'M', color: 'x', qty: 5, custom: spec }, { id: p.id, size: 'L', color: 'black', qty: 1 }] } });
    t.ok(r.s === 200 || r.s === 201, 'đặt 5 cái thiết kế riêng dù kho chỉ còn 3 (làm theo đơn)', r.j);
    const ord = (await req('/api/orders')).j.find(o => o.code === r.j.code || o.id === r.j.id) || {};
    const cx = (ord.items || []).find(i => i.custom), std = (ord.items || []).find(i => !i.custom);
    // 900k + 200k phí + 100k thêu chữ + 600k da bò + 80k cờ ("nope" bị bỏ); vàng gold không có trong bảng màu → về màu mặc định
    t.ok(cx && cx.price === 1880000 && cx.qty === 5, 'máy chủ tự tính giá thiết kế riêng', cx && cx.price);
    t.ok(cx && /^cx-/.test(cx.color) && cx.custom.spec.zones.trim !== 'gold' && cx.custom.spec.zones.cup === 'white', 'màu ngoài bảng màu bị bỏ', cx && cx.custom.spec.zones);
    t.ok(std && std.price === 900000, 'dòng mẫu có sẵn giữ giá thường');
    const after = (await req('/api/products')).j.find(x => x.id === p.id);
    t.ok(after.stock === 2, 'chỉ dòng mẫu có sẵn trừ tồn kho', after.stock);

    r = await req('/api/orders', { method: 'POST', pub: true, body: { customer: cust, pay: 'bank', ship: 'std', items: [{ id: p.id, size: 'M', color: 'x', qty: 1, custom: { text: { value: 'X'.repeat(40) } } }] } });
    t.ok(r.s === 400, 'chữ quá dài → báo lỗi', r.j);
    r = await req('/api/orders', { method: 'POST', pub: true, body: { customer: cust, pay: 'bank', ship: 'std', items: [{ id: p.id, size: 'M', color: 'x', qty: 1, custom: { logo: { url: 'https://evil.example/x.png' } } }] } });
    t.ok(r.s === 400, 'logo phải là ảnh đã tải lên web', r.j);

    // logo
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    r = await req('/api/custom/logo', { method: 'POST', pub: true, body: { dataUrl: png } });
    t.ok(r.s === 201 && /^\/assets\/uploads\/custom\/[a-f0-9]+\.png$/.test(r.j.url), 'khách tải logo PNG lên được', r.j);
    t.ok((await fetch(B + r.j.url)).status === 200, 'logo mở được qua đường dẫn');
    const fake = 'data:image/png;base64,' + Buffer.from('<script>alert(1)</script>').toString('base64');
    t.ok((await req('/api/custom/logo', { method: 'POST', pub: true, body: { dataUrl: fake } })).s === 400, 'file giả ảnh bị từ chối');
    r = await req('/api/orders', { method: 'POST', pub: true, body: { customer: cust, pay: 'bank', ship: 'std', items: [{ id: p.id, size: 'L', color: 'x', qty: 1, custom: { logo: { url: r.j.url, method: 'print', spot: 'cup' } } }] } });
    t.ok((r.s === 200 || r.s === 201) && r.j.total >= 900000 + 200000 + 150000, 'đặt có logo → cộng phí logo', r.j && r.j.total);

    // sửa đơn: đổi size dòng thiết kế riêng vẫn giữ bản thiết kế + giá
    const items = ord.items.map(i => ({ id: i.id, size: i.custom ? 'L' : i.size, color: i.color, qty: i.custom ? 2 : i.qty }));
    r = await req('/api/orders/' + ord.id + '/edit', { method: 'PUT', body: { items } });
    const ed = (await req('/api/orders')).j.find(o => o.id === ord.id) || {};
    const ecx = (ed.items || []).find(i => i.custom);
    t.ok(ecx && ecx.size === 'L' && ecx.qty === 2 && ecx.price === 1880000 && ecx.custom.spec.text.value === 'PHONG', 'sửa đơn giữ nguyên bản thiết kế', r.s + ' ' + JSON.stringify(ecx || r.j).slice(0, 200));

    // tắt thiết kế riêng → không đặt custom được nữa
    await req('/api/products/' + p.id, { method: 'PUT', body: { custom: { ...p.custom, on: false } } });
    r = await req('/api/orders', { method: 'POST', pub: true, body: { customer: cust, pay: 'bank', ship: 'std', items: [{ id: p.id, size: 'M', color: 'x', qty: 1, custom: spec }] } });
    t.ok(r.s === 400, 'tắt thiết kế riêng → không nhận đơn custom', r.j);
    await req('/api/products/' + p.id, { method: 'DELETE' });
  });
};
