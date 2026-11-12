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
};
