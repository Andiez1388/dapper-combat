/*
 * Kiểm tra API + trang do server dựng (không cần trình duyệt).
 * Chạy trên máy chủ thử (tests/lib/sandbox.js) — dữ liệu tạm, không đụng dữ liệu thật.
 */
const fs = require('fs');
const path = require('path');

module.exports = async function apiTests(env, t) {
  const B = env.base;
  let ip = 0;
  const req = async (url, o = {}) => {
    const r = await fetch(B + url, {
      method: o.method || 'GET', redirect: 'manual',
      // mỗi lượt gọi một IP giả (máy chủ tin X-Forwarded-For từ chính máy) → không vướng giới hạn chống spam
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.' + (++ip >> 8 & 255) + '.' + (ip & 255), ...(o.tok ? { Authorization: 'Bearer ' + o.tok } : {}), ...(o.headers || {}) },
      body: o.raw != null ? o.raw : o.body ? JSON.stringify(o.body) : undefined,
    });
    const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch { /* HTML */ }
    return { s: r.status, j, t: text, h: r.headers };
  };
  const PW = 'Thu-nghiem-' + Date.now();
  let T = '';   // phiên quản trị sau khi đổi mật khẩu
  env.adminPassword = PW;

  t.section('Đăng nhập & bảo mật');
  await t.run('đăng nhập', async () => {
    const secret = path.join(env.data, '.jwt-secret');
    t.ok(fs.existsSync(secret) && fs.readFileSync(secret, 'utf8').trim().length >= 64, 'tự tạo khóa đăng nhập ngẫu nhiên (data/.jwt-secret)');
    let r = await req('/api/auth/login', { method: 'POST', body: { email: ' ADMIN@DapperCombat.com ', password: 'admin123' } });
    t.ok(r.s === 200 && r.j.user.mustChange === true && !('password' in r.j.user), 'tài khoản mặc định: đăng nhập được (email không phân biệt hoa thường), bị bắt đổi mật khẩu', r.j);
    const t1 = r.j.token;
    const users = JSON.parse(fs.readFileSync(path.join(env.data, 'users.json'), 'utf8'));
    t.ok(String(users[0].password).startsWith('scrypt$'), 'mật khẩu lưu bằng scrypt');
    r = await req('/api/orders', { tok: t1 });
    t.ok(r.s === 403 && r.j.mustChange === true, 'chưa đổi mật khẩu → API quản trị bị chặn (403)', r);
    r = await req('/api/auth/change-password', { method: 'POST', tok: t1, body: { currentPassword: 'admin123', newPassword: 'admin123' } });
    t.ok(r.s === 400, 'không cho đặt lại admin123');
    r = await req('/api/auth/change-password', { method: 'POST', tok: t1, body: { currentPassword: 'admin123', newPassword: PW } });
    t.ok(r.s === 200 && r.j.token && r.j.user.mustChange === false, 'đổi mật khẩu → nhận phiên mới', r.j);
    T = r.j.token;
    env.adminToken = T;
    t.ok((await req('/api/orders', { tok: t1 })).s === 401, 'phiên cũ hết hiệu lực sau khi đổi mật khẩu');
    t.ok((await req('/api/orders', { tok: T })).s === 200, 'phiên mới dùng được');
    t.ok((await req('/api/auth/login', { method: 'POST', body: { email: 'admin@dappercombat.com', password: 'admin123' } })).s === 401, 'admin123 không còn đăng nhập được');
    r = await fetch(B + '/', { headers: { Origin: 'https://evil.example' } });
    t.ok(!r.headers.get('access-control-allow-origin'), 'không mở CORS cho trang khác');
    r = await req('/shop/%E0%A4%A');
    t.ok(r.s === 404 && !/URIError|node_modules|\bat \w/.test(r.t), 'đường dẫn lỗi → 404, không lộ chi tiết máy chủ');
    r = await req('/api/orders', { method: 'POST', raw: '{bad json' });
    t.ok(r.s === 400 && r.j && r.j.error === 'Yêu cầu không hợp lệ', 'JSON hỏng → 400 gọn', r.j);
  });

  t.section('Sản phẩm, mã giảm giá, đơn hàng, tồn kho');
  await t.run('đơn hàng', async () => {
    const prods = (await req('/api/products')).j;
    t.ok(Array.isArray(prods) && prods.length >= 1, 'có danh sách sản phẩm', prods);
    const p = prods[0];
    t.ok(p.reviews === 0 && p.rating === 0, 'sản phẩm mẫu không có số đánh giá giả');
    const cmsjs = (await req('/assets/data/cms.js')).t;
    t.ok(!/DAPPER10|GIAM100|FREESHIP/.test(cmsjs), 'danh sách mã giảm giá không gửi ra trình duyệt');
    let r = await req('/api/promo', { method: 'POST', body: { code: 'dapper10' } });
    t.ok(r.s === 200 && r.j.code === 'DAPPER10' && r.j.pct === 0.1, 'kiểm tra mã giảm giá qua server', r.j);
    r = await req('/api/promo', { method: 'POST', body: { code: 'XYZ', lang: 'en' } });
    t.ok(r.s === 404 && /Invalid/.test(r.j.error), 'mã sai → báo lỗi tiếng Anh khi khách xem EN', r.j);
    const order = (city, ship, extra = {}) => ({ customer: { name: 'Khách Thử', phone: '0901234567', address: '12 Đường Số 1', city }, items: [{ id: p.id, qty: 2, size: p.sizes[0], color: p.colors[0][0] }], pay: 'bank', ship, ...extra });
    r = await req('/api/orders', { method: 'POST', body: { ...order('HCM', 'std'), customer: { name: 'K', phone: '1' }, lang: 'en' } });
    t.ok(r.s === 400 && r.j.error === 'Please enter your name', 'lỗi đặt hàng bằng tiếng Anh', r.j);
    r = await req('/api/orders', { method: 'POST', body: order('Hà Nội', 'exp') });
    t.ok(r.s === 400 && /TP\.HCM/.test(r.j.error), 'hỏa tốc ngoài TP.HCM bị từ chối', r.j);
    const stockOf = async id => (await req('/api/admin/products', { tok: T })).j.find(x => x.id === id).stock;
    const s0 = await stockOf(p.id);
    r = await req('/api/orders', { method: 'POST', body: order('Tp. Hồ Chí Minh', 'exp', { promo: 'DAPPER10' }) });
    t.ok(r.s === 201 && r.j.discount === Math.round(p.price * 2 * 0.1) && r.j.slip && r.j.slip.k, 'đặt hàng hỏa tốc TP.HCM + mã giảm 10% (server tự tính)', r.j);
    const oid = r.j.id; env.order = r.j;
    t.ok(await stockOf(p.id) === s0 - 2, 'đặt hàng trừ tồn kho');
    const put = st => req('/api/orders/' + oid, { method: 'PUT', tok: T, body: { status: st } });
    await put('cancelled'); t.ok(await stockOf(p.id) === s0, 'hủy đơn → trả hàng về kho');
    await put('confirmed'); t.ok(await stockOf(p.id) === s0 - 2, 'mở lại đơn → trừ kho lại');
    await put('cancelled'); await put('cancelled'); t.ok(await stockOf(p.id) === s0, 'hủy nhiều lần chỉ trả kho 1 lần');
    const hist = (await req('/api/orders', { tok: T })).j.find(o => o.id === oid).history;
    t.ok(hist[hist.length - 1].by === 'admin@dappercombat.com', 'lịch sử ghi người đổi trạng thái');
    r = await req('/api/orders', { method: 'POST', body: order('HCM', 'std') });
    r = await req('/api/orders/' + r.j.id, { method: 'DELETE', tok: T });
    t.ok(r.j && r.j.restocked === true && await stockOf(p.id) === s0, 'xóa đơn chưa giao → trả hàng về kho', r.j);
    const full = (await req('/api/admin/products', { tok: T })).j.find(x => x.id === p.id);
    await req('/api/products/' + p.id, { method: 'PUT', tok: T, body: { ...full, stock: 1 } });
    r = await put('new');
    t.ok(r.s === 409 && /Không đủ hàng/.test(r.j.error), 'mở lại đơn khi kho không đủ → báo lỗi', r.j);
    await req('/api/products/' + p.id, { method: 'PUT', tok: T, body: { ...full, stock: 0 } });
    r = await req('/api/orders', { method: 'POST', body: { ...order('HCM', 'std'), lang: 'en' } });
    t.ok(r.s === 409 && /sold out/.test(r.j.error), 'hết hàng → không đặt được', r.j);
    await req('/api/products/' + p.id, { method: 'PUT', tok: T, body: { ...full, stock: 3 } });
    r = await req('/api/products/' + p.id, { method: 'PUT', tok: T, body: { ...full, stock: 5, stockWas: 5 } });
    t.ok(r.j.stock === 3, 'lưu sản phẩm không sửa ô tồn kho → giữ số hiện tại', r.j && r.j.stock);
    await req('/api/products/' + p.id, { method: 'PUT', tok: T, body: { ...full } });
  });

  t.section('Trường sản phẩm mới, đường dẫn, SEO');
  await t.run('sản phẩm', async () => {
    const list = (await req('/api/admin/products', { tok: T })).j, p = list[0], q = list[1];
    const old = (await req('/sitemap.xml')).t.match(/\/shop\/([a-z0-9-]+)<\/loc>/)[1];
    let r = await req('/api/products/' + p.id, { method: 'PUT', tok: T, body: { ...p, nameEn: 'Test EN', features: [{ vi: 'Điểm 1', en: 'Point 1' }, { vi: '' }], video: '/assets/uploads/x.mp4', seoTitle: 'Tiêu đề SEO', seoDesc: 'Mô tả SEO', slug: 'Đường Dẫn Mới!', colors: [[p.colors[0][0], p.colors[0][1]], ['__x', 'sai', 'Xanh lá', 'Green']] } });
    t.ok(r.s === 200 && r.j.nameEn === 'Test EN' && r.j.features.length === 1 && r.j.slug === 'duong-dan-moi' && r.j.video === '/assets/uploads/x.mp4', 'lưu tên EN, điểm nổi bật, video, đường dẫn (tự bỏ dấu)', r.j);
    t.ok(JSON.stringify(r.j.colors[1]) === JSON.stringify(['x', '#141414', 'Xanh lá', 'Green']), 'màu tự đặt tên', r.j.colors);
    r = await req('/shop/' + old);
    t.ok(r.s === 301 && r.h.get('location') === '/shop/duong-dan-moi', 'đường dẫn cũ → chuyển 301 sang đường dẫn mới', r.s);
    r = await req('/shop/duong-dan-moi');
    t.ok(r.s === 200 && /<title[^>]*>Tiêu đề SEO<\/title>/.test(r.t) && /content="Mô tả SEO"/.test(r.t) && /"@type":"Product"/.test(r.t), 'trang sản phẩm: tiêu đề / mô tả SEO riêng + dữ liệu sản phẩm cho Google');
    r = await req('/api/products/' + q.id, { method: 'PUT', tok: T, body: { ...q, slug: 'duong-dan-moi' } });
    t.ok(r.s === 400, 'trùng đường dẫn sản phẩm khác → báo lỗi');
    r = await req('/shop/khong-co-san-pham-nay');
    t.ok(r.s === 404 && r.t.includes('__DC_NOTFOUND=1'), 'link sản phẩm sai → 404 + thông báo trên trang');
    await req('/api/products/' + p.id, { method: 'PUT', tok: T, body: { ...p } });
  });

  t.section('SEO & trang công khai');
  await t.run('seo', async () => {
    let r = await req('/robots.txt');
    t.ok(r.s === 200 && /Sitemap: .*\/sitemap\.xml/.test(r.t) && /Disallow: \/admin/.test(r.t), 'robots.txt');
    r = await req('/sitemap.xml');
    t.ok(r.s === 200 && /<loc>[^<]*\/khoa-hoc<\/loc>/.test(r.t) && /\/shop\/[a-z0-9-]+<\/loc>/.test(r.t), 'sitemap.xml có trang chính + sản phẩm');
    r = await req('/');
    t.ok(/rel="canonical"/.test(r.t) && /"@type":"ExerciseGym"/.test(r.t), 'Trang chủ: link chuẩn + dữ liệu phòng tập');
    r = await req('/shop/checkout');
    t.ok(/name="robots" content="noindex"/.test(r.t), 'trang thanh toán không cho Google lập chỉ mục');
    for (const u of ['/', '/shop', '/khoa-hoc', '/dich-vu-setup']) {
      r = await req(u);
      t.ok(r.s === 200 && !/\{(found|gt|hssv|mem|ship|promo|hours|sched)\.[^}]*\}/.test(r.t), u + ' — không còn biến {…} chưa điền');
    }
    const pg = (await req('/api/pages', { tok: T })).j;
    t.ok(pg.length >= 4 && pg.every(x => !x.published), 'có sẵn 4 trang chính sách ở dạng nháp');
    r = await req('/');
    t.ok(!/href="\/trang\//.test(r.t), 'link tới trang chính sách chưa bật bị ẩn');
  });

  t.section('Đăng ký khóa học, tư vấn, nhận tin, phiếu xác nhận');
  await t.run('biểu mẫu', async () => {
    let r = await req('/api/registrations', { method: 'POST', body: { name: 'A', phone: '0901234567', program: 'trial', lang: 'en' } });
    t.ok(r.s === 400 && r.j.error === 'Please enter your name', 'đăng ký: lỗi tiếng Anh');
    r = await req('/api/registrations', { method: 'POST', body: { name: 'Học Viên Thử', phone: '0901234567', program: 'gt', pkg: '12', opt: 'pm', pay: 'full', lang: 'vi' } });
    t.ok(r.s === 201 && /^#DC-REG-/.test(r.j.code) && r.j.slip, 'đăng ký Group Training 12 tháng', r.j);
    env.reg = r.j;
    const regs = (await req('/api/registrations', { tok: T })).j;
    t.ok(regs[0].total > 0 && regs[0].due === regs[0].total, 'server tự tính học phí + số cần trả', regs[0]);
    // Truyền Nghề: Coach và Võ sĩ cùng học phí (thiết lập course.careerPrice), chưa thu tiền khi đăng ký
    for (const [program, name] of [['coach', 'Học Viên Coach'], ['fighter', 'Học Viên Võ Sĩ']]) {
      r = await req('/api/registrations', { method: 'POST', body: { name, phone: '0907654321', program, programName: 'Truyền Nghề · ' + program, detail: 'Khai giảng 20.02.2027', lang: 'vi' } });
      t.ok(r.s === 201 && /^#DC-REG-/.test(r.j.code), 'đăng ký Truyền Nghề · ' + program, r.j);
    }
    const tn = (await req('/api/registrations', { tok: T })).j.filter(x => x.program === 'coach' || x.program === 'fighter');
    t.ok(tn.length === 2 && tn.every(x => x.total === 50000000 && x.due === 0), 'Truyền Nghề: học phí 50.000.000đ cho cả 2 khóa, chưa thu khi đăng ký', tn.map(x => [x.program, x.total, x.due]));
    // chọn đặt cọc / đóng đủ: số cần trả theo tiền cọc trong Thiết lập (0 = không nhận cọc)
    const dueOf = async (pay, program = 'coach') => {
      const x = await req('/api/registrations', { method: 'POST', body: { name: 'Học Viên Cọc', phone: '0907654322', program, pay, lang: 'vi' } });
      return (await req('/api/registrations', { tok: T })).j.find(e => e.code === x.j.code).due;
    };
    t.ok(await dueOf('deposit') === 0 && await dueOf('full') === 50000000, 'Truyền Nghề: chưa đặt tiền cọc → chọn cọc vẫn chưa thu; đóng đủ = cả học phí');
    await req('/api/settings', { method: 'PUT', tok: T, body: { course: { careerDeposit: 5000000, careerSeats: 2000 } } });
    t.ok(await dueOf('deposit', 'fighter') === 5000000 && await dueOf('') === 0, 'Truyền Nghề: tiền cọc 5.000.000đ → chọn đặt cọc cần trả 5.000.000đ, tư vấn trước vẫn 0đ');
    r = await req('/api/settings', { tok: T });
    t.ok(r.j.course.careerSeats === 999, 'Truyền Nghề: số chỗ mỗi khóa tối đa 999', r.j.course.careerSeats);
    await req('/api/settings', { method: 'PUT', tok: T, body: { course: { careerDeposit: 0, careerSeats: 0 } } });
    r = await req('/api/consults', { method: 'POST', body: { name: 'Khách Setup', phone: '0901234567', city: 'Đà Nẵng', lang: 'vi' } });
    t.ok(r.s === 201 && /^#DC-SVC-/.test(r.j.code), 'gửi yêu cầu tư vấn setup', r.j);
    r = await req('/api/subscribe', { method: 'POST', body: { email: 'x', lang: 'en' } });
    t.ok(r.s === 400 && /valid email/.test(r.j.error), 'nhận tin: email sai → lỗi tiếng Anh');
    r = await req('/api/subscribe', { method: 'POST', body: { email: 'thu@example.com' } });
    t.ok(r.s === 201, 'nhận tin: email đúng');
    const s = env.order.slip;
    r = await req(`/api/slip/${s.code}?k=${s.k}`);
    t.ok(r.s === 200 && r.j.type === 'order' && r.j.status, 'phiếu xác nhận: đọc được bằng đúng khóa', r.j);
    r = await req(`/api/slip/${s.code}?k=sai`);
    t.ok(r.s === 404, 'phiếu xác nhận: sai khóa → 404');
    await req(`/api/slip/${s.code}?k=${s.k}&view=1`);
    await req(`/api/slip/${s.code}/download`, { method: 'POST', body: { k: s.k } });
    const o = (await req('/api/orders', { tok: T })).j.find(x => x.id === env.order.id);
    t.ok(o.confirm.slip.views === 1 && o.confirm.slip.downloads === 1, 'đếm lượt khách xem / tải phiếu', o.confirm.slip);
  });

  t.section('Thiết lập & dữ liệu hỏng');
  await t.run('thiết lập', async () => {
    let r = await req('/api/settings', { method: 'PUT', tok: T, body: { course: { foundStart: '2030-05-06' }, shop: { lowStock: 25, eta: { stdMin: 3, stdMax: 1 } } } });
    t.ok(r.s === 200 && r.j.course.foundStart === '2030-05-06' && r.j.shop.lowStock === 25 && r.j.shop.eta.stdMax === 3, 'lưu ngày khai giảng, ngưỡng sắp hết, thời gian giao', r.j && r.j.shop);
    r = await req('/khoa-hoc');
    t.ok(r.t.includes('06.05.2030'), 'ngày khai giảng mới hiện trên trang Khóa học');
    r = await req('/api/settings', { method: 'PUT', tok: T, body: { course: { careerPrice: 45000000, careerStart: '2027-13-40' } } });
    t.ok(r.s === 200 && r.j.course.careerPrice === 45000000 && r.j.course.careerStart === '2027-02-20', 'Truyền Nghề: lưu học phí, bỏ qua ngày khai giảng sai', r.j && r.j.course);
    r = await req('/api/settings', { method: 'PUT', tok: T, body: { course: { careerPrice: 50000000, careerStart: '2027-02-20' } } });
    t.ok(r.s === 200 && r.j.course.careerPrice === 50000000, 'Truyền Nghề: trả lại học phí mặc định');
    r = await req('/truyen-nghe');
    t.ok(r.s === 200 && /Truyền Nghề/.test(r.t) && /HVP Academy/.test(r.t) && /The Corner/.test(r.t), 'trang /truyen-nghe mở được');
    r = await req('/dao-tao');
    t.ok(r.s === 301 && r.h.get('location') === '/truyen-nghe', '/dao-tao chuyển về /truyen-nghe', r.s);
    r = await req('/sitemap.xml');
    t.ok(r.t.includes('/truyen-nghe</loc>'), 'sitemap có /truyen-nghe');
    fs.writeFileSync(path.join(env.data, 'consults.json'), '[{"hong":');
    r = await req('/api/consults', { tok: T });
    const moved = fs.readdirSync(env.data).filter(f => f.startsWith('consults.json.hong-'));
    t.ok(r.s === 200 && Array.isArray(r.j) && moved.length === 1, 'file dữ liệu hỏng → cất bản hỏng sang bên, không ghi đè mất');
  });
};
