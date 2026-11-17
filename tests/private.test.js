/*
 * Chế độ riêng tư (/admin → Thương hiệu & menu): khách thấy "Sắp ra mắt", trình duyệt có vé xem trước thấy website.
 * Chạy sau api.test.js (dùng phiên quản trị env.adminToken). Cuối bài tắt lại để các kiểm tra sau không bị ảnh hưởng.
 */
module.exports = async function privateTests(env, t) {
  const B = env.base;
  const admin = { Authorization: 'Bearer ' + env.adminToken, 'Content-Type': 'application/json' };
  const get = (url, headers = {}) => fetch(B + url, { headers, redirect: 'manual' });
  const setPrivate = on => fetch(B + '/api/settings', { method: 'PUT', headers: admin, body: JSON.stringify({ brand: { private: on } }) });

  t.section('Chế độ riêng tư');
  await t.run('chế độ riêng tư', async () => {
    let r = await get('/');
    t.ok(r.status === 200, 'mặc định: website mở cho mọi người', r.status);

    r = await setPrivate(true);
    const saved = await r.json();
    t.ok(r.status === 200 && saved.brand && saved.brand.private === true, 'admin bật chế độ riêng tư → lưu được', saved);

    for (const url of ['/', '/shop', '/khoa-hoc', '/xep-hang', '/shop.html', '/assets/data/products.js', '/sitemap.xml']) {
      r = await get(url);
      const html = await r.text();
      t.ok(r.status === 503 && /RA MẮT/.test(html) && /noindex/.test(r.headers.get('x-robots-tag') || ''), 'khách mở ' + url + ' → trang "Sắp ra mắt", Google không lập chỉ mục', r.status);
    }
    r = await get('/robots.txt');
    t.ok(/Disallow: \/\n/.test(await r.text()), 'robots.txt chặn toàn bộ khi đang riêng tư');

    r = await get('/admin');
    t.ok(r.status === 200, 'trang quản trị vẫn mở được để đăng nhập', r.status);
    r = await get('/assets/js/site.js');
    t.ok(r.status === 200, 'CSS / JS vẫn tải được', r.status);
    r = await get('/api/settings', { Authorization: admin.Authorization });
    t.ok(r.status === 200, 'API quản trị vẫn chạy', r.status);

    r = await fetch(B + '/api/auth/preview', { method: 'POST' });
    t.ok(r.status === 401, 'không đăng nhập thì không xin được vé xem trước', r.status);
    r = await fetch(B + '/api/auth/preview', { method: 'POST', headers: admin });
    const setCookie = r.headers.get('set-cookie') || '';
    const cookie = (setCookie.match(/dc_pv=[^;]+/) || [''])[0];
    t.ok(r.status === 200 && cookie && /HttpOnly/i.test(setCookie), 'đăng nhập quản trị → nhận vé xem trước (cookie HttpOnly)', setCookie);

    r = await get('/', { Cookie: cookie });
    t.ok(r.status === 200 && !/RA MẮT/.test(await r.text()), 'có vé xem trước → xem website như bình thường', r.status);
    r = await get('/shop', { Cookie: cookie });
    t.ok(r.status === 200, 'có vé → mở được Shop', r.status);
    r = await get('/', { Cookie: 'dc_pv=gia-mao' });
    t.ok(r.status === 503, 'vé giả → vẫn chặn', r.status);
    r = await get('/api/settings', { Authorization: 'Bearer ' + cookie.slice(6) });
    t.ok(r.status === 401, 'vé xem trước không dùng thay đăng nhập API được', r.status);

    r = await fetch(B + '/api/auth/preview', { method: 'DELETE' });
    t.ok(/dc_pv=;.*Max-Age=0/i.test(r.headers.get('set-cookie') || ''), 'đăng xuất → xóa vé xem trước', r.headers.get('set-cookie'));

    r = await setPrivate(false);
    t.ok(r.status === 200, 'tắt chế độ riêng tư', r.status);
    r = await get('/');
    t.ok(r.status === 200, 'tắt xong → khách mở website bình thường', r.status);
  });
  await setPrivate(false).catch(() => {});

  t.section('Logo riêng ở trang quản trị');
  await t.run('logo trang quản trị', async () => {
    const setLogo = logo => fetch(B + '/api/settings', { method: 'PUT', headers: admin, body: JSON.stringify({ brand: { logo } }) });
    let html = await (await get('/admin')).text();
    t.ok((html.match(/brand__mark/g) || []).length >= 3 && !/brand__logo"/.test(html), 'chưa tải logo → dùng logo mặc định');
    const r = await setLogo('/assets/img/__test-logo.png');
    t.ok(r.status === 200, 'lưu logo riêng', r.status);
    html = await (await get('/admin')).text();
    t.ok((html.match(/<img class="brand__logo" src="\/assets\/img\/__test-logo.png"/g) || []).length === 3 && !/<span class="brand__word">Dapper Combat/.test(html),
      'có logo riêng → màn đăng nhập, thanh trên, menu trái đều dùng logo đó, bỏ chữ lặp');
    await setLogo('');
  });

  t.section('Pháp lý: thông tin doanh nghiệp, chính sách, đồng ý, xác minh Google');
  await t.run('pháp lý', async () => {
    const put = (url, body) => fetch(B + url, { method: 'PUT', headers: admin, body: JSON.stringify(body) });
    let r = await put('/api/cms', { contact: { company: 'CÔNG TY CỔ PHẦN THỬ', taxId: '0318379975', email: 'cskh@example.com', bizDate: '29/03/2024',
      regAddr: '27/13 đường số 13, Tam Bình', legalRep: 'Nguyễn Văn A', moitUrl: 'https://evil.example.com/x', moitImg: 'http://online.gov.vn/logo.png' } });
    t.ok(r.status === 200, 'lưu thông tin doanh nghiệp', r.status);
    const cj = await (await get('/assets/data/cms.js')).text();
    t.ok(/0318379975/.test(cj) && /27\/13 đường số 13/.test(cj) && !/evil\.example/.test(cj) && /online\.gov\.vn/.test(cj), 'trang nhận MST, trụ sở; link logo Bộ Công Thương chỉ nhận tên miền .gov.vn');
    // trang chính sách dùng biến {biz.*}
    const list = await (await fetch(B + '/api/pages', { headers: admin })).json();
    const pg = list.find(p => p.slug === 'chinh-sach-bao-mat');
    r = await put('/api/pages/' + pg.id, { ...pg, published: true, body: { vi: '<p>{biz.name} — MST {biz.tax} — <a href="mailto:{biz.email}">mail</a> <a href="tel:{biz.phone}">gọi</a></p>', en: '<p>{biz.name} open {hours.days}</p>' } });
    t.ok(r.status === 200, 'lưu trang chính sách', r.status);
    const html = await (await get('/trang/chinh-sach-bao-mat')).text();
    t.ok(/CÔNG TY CỔ PHẦN THỬ — MST 0318379975/.test(html) && /href="mailto:cskh@example.com"/.test(html) && /href="tel:/.test(html), 'trang chính sách tự điền tên công ty, MST, email, link gọi', html.match(/<article data-lang-body="vi">[\s\S]{0,300}/));
    t.ok(/data-lang-body="en"[^>]*>[^<]*<p>CÔNG TY CỔ PHẦN THỬ open (Mon|Every)/.test(html), 'bản tiếng Anh điền biến bằng tiếng Anh');
    await put('/api/pages/' + pg.id, { ...pg });
    // đồng ý chính sách → lưu thời điểm
    r = await fetch(B + '/api/consults', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.9.9.9' }, body: JSON.stringify({ type: 'gym', name: 'Khách Đồng Ý', phone: '0912000444', consent: true }) });
    const id = (await r.json()).id;
    const c = (await (await fetch(B + '/api/consults', { headers: admin })).json()).find(x => x.id === id);
    t.ok(c && c.consentAt > 0, 'yêu cầu tư vấn lưu thời điểm khách đồng ý chính sách bảo mật', c);
    // mã xác minh Google / Bing
    r = await put('/api/settings', { brand: { verifyGoogle: '<meta name="google-site-verification" content="abcDEF123_-xyz" />', verifyBing: 'B1C2D3E4F5' } });
    const home = await (await get('/')).text();
    t.ok(/<meta name="google-site-verification" content="abcDEF123_-xyz">/.test(home) && /<meta name="msvalidate.01" content="B1C2D3E4F5">/.test(home), 'dán thẻ meta Google / mã Bing → trang có thẻ xác minh');
    await put('/api/settings', { brand: { verifyGoogle: '', verifyBing: '' } });
    await put('/api/cms', { contact: { company: null, taxId: null, email: null, bizDate: null, regAddr: null, legalRep: null, moitUrl: null, moitImg: null } });
  });

  t.section('Mã phiên bản cho CSS / JS');
  await t.run('mã phiên bản', async () => {
    for (const url of ['/', '/shop', '/admin', '/khoa-hoc']) {
      const html = await (await get(url)).text();
      const plain = html.match(/(?:src|href)="\/assets\/(?:js|css)\/[\w.-]+\.(?:js|css)"/g);
      t.ok(/\/assets\/js\/[\w.-]+\.js\?v=[0-9a-f]{10}"/.test(html) && !plain, url + ': mọi file CSS / JS có ?v=… (cập nhật xong khách tải bản mới ngay)', plain);
    }
    const r = await get('/assets/js/site.js?v=abc');
    t.ok(r.status === 200, 'file có ?v= vẫn tải được', r.status);
  });
};
