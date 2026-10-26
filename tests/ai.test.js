/*
 * Kiểm tra tiếng Anh tự dịch (lib/translate.js) với dịch giả DC_AI_MOCK=1: "[EN] <chữ tiếng Việt>".
 * Chạy sau api.test.js (dùng phiên quản trị env.adminToken).
 */
module.exports = async function aiTests(env, t) {
  const B = env.base;
  const req = async (url, o = {}) => {
    const r = await fetch(B + url, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.adminToken }, body: o.body ? JSON.stringify(o.body) : undefined });
    const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch { /* không phải JSON */ }
    return { s: r.status, j, t: text };
  };
  // chờ hàng đợi dịch trên máy chủ chạy xong
  const settle = async () => {
    for (let i = 0; i < 100; i++) {
      await new Promise(r => setTimeout(r, 60));
      const st = (await req('/api/translate/status')).j;
      if (st && !st.running && !st.queued) return st;
    }
    return null;
  };
  const cmsT = async key => { const js = (await fetch(B + '/assets/data/cms.js').then(r => r.text())); const m = js.match(/^window\.__CMS=(.*);$/s); return m ? (JSON.parse(m[1]).t || {})[key] : null; };

  t.section('Tiếng Anh tự dịch (AI)');
  await t.run('dịch tự động', async () => {
    let st = (await req('/api/translate/status')).j;
    t.ok(st && st.enabled && st.keySource === 'mock', 'dịch tự động đang bật (chế độ thử)', st);

    // 1. Chữ trên trang: sửa tiếng Việt → tiếng Anh tự dịch
    const cat = (await req('/api/cms/catalog')).j;
    const f = cat.fields.find(x => x.page === 'home' && x.src === 'html' && !x.mono && x.type !== 'link' && !/\{/.test(x.vi || ''));
    t.ok(!!f, 'chọn một chữ trên Trang chủ để thử', f && f.key);
    await req('/api/cms', { method: 'PUT', body: { text: { [f.key]: { vi: 'Chữ mới để thử dịch' } } } });
    let pair = await cmsT(f.key);
    t.ok(pair && (pair[1] === 'Chữ mới để thử dịch' || pair[1] === '[EN] Chữ mới để thử dịch'), 'ngay sau khi lưu: tiếng Anh không còn chữ cũ (tạm hiện tiếng Việt mới hoặc đã dịch)', pair);
    await settle();
    let store = (await req('/api/cms')).j;
    t.ok(store.text[f.key].en === '[EN] Chữ mới để thử dịch', 'AI dịch xong → lưu bản tiếng Anh', store.text[f.key]);
    pair = await cmsT(f.key);
    t.ok(pair && pair[1] === '[EN] Chữ mới để thử dịch', 'trang tiếng Anh dùng bản dịch', pair);
    await req('/api/cms', { method: 'PUT', body: { text: { [f.key]: { vi: 'Đổi lần hai' } } } });
    await settle();
    store = (await req('/api/cms')).j;
    t.ok(store.text[f.key].en === '[EN] Đổi lần hai', 'đổi tiếng Việt lần nữa → dịch lại', store.text[f.key]);
    await req('/api/cms', { method: 'PUT', body: { text: { [f.key]: { en: 'Hand written' } } } });
    await settle();
    store = (await req('/api/cms')).j;
    t.ok(store.text[f.key].en === 'Hand written', 'tự sửa ô English → giữ nguyên, AI không ghi đè', store.text[f.key]);
    env.aiField = f.key;

    // 2. Sản phẩm
    const p = (await req('/api/admin/products')).j[0];
    let r = await req('/api/products/' + p.id, { method: 'PUT', body: { ...p, name: 'Găng Thử Dịch', desc: { vi: 'Mô tả mới', en: p.desc.en }, features: [{ vi: 'Điểm mới', en: '' }] } });
    await settle();
    const p2 = (await req('/api/admin/products')).j.find(x => x.id === p.id);
    t.ok(p2.nameEn === '[EN] Găng Thử Dịch' && p2.desc.en === '[EN] Mô tả mới' && p2.features[0].en === '[EN] Điểm mới', 'sản phẩm: tên, mô tả, điểm nổi bật tự dịch', { nameEn: p2.nameEn, desc: p2.desc, features: p2.features });
    t.ok(p2.full.en === p.full.en, 'sản phẩm: phần tiếng Việt không đổi thì giữ bản tiếng Anh cũ');

    // 3. Thiết lập (danh mục)
    const s = (await req('/api/settings')).j;
    const cats = s.shop.categories.map((c, i) => (i === 0 ? { ...c, name: { vi: 'Găng thi đấu', en: c.name.en } } : c));
    await req('/api/settings', { method: 'PUT', body: { shop: { categories: cats } } });
    await settle();
    const c0 = (await req('/api/settings')).j.shop.categories[0];
    t.ok(c0.name.en === '[EN] Găng thi đấu', 'danh mục: tên tự dịch', c0.name);

    // 4. Trang phụ
    const pg = (await req('/api/pages')).j.find(x => x.slug === 'dieu-khoan-su-dung');
    await req('/api/pages/' + pg.id, { method: 'PUT', body: { ...pg, title: { vi: 'Điều khoản mới', en: pg.title.en }, body: { vi: '<p>Nội dung <strong>mới</strong></p>', en: pg.body.en } } });
    await settle();
    const pg2 = (await req('/api/pages')).j.find(x => x.id === pg.id);
    t.ok(pg2.title.en === '[EN] Điều khoản mới' && /\[EN\] <p>Nội dung <strong>mới<\/strong><\/p>/.test(pg2.body.en), 'trang phụ: tiêu đề + nội dung tự dịch (giữ thẻ HTML)', pg2.title);

    // 5. Khóa API không lộ ra ngoài
    r = await req('/api/settings', { method: 'PUT', body: { ai: { apiKey: 'sk-ant-thu-nghiem-123' } } });
    t.ok(r.j.ai && r.j.ai.apiKey === '' && r.j.ai.apiKeySet === true, 'khóa AI lưu trên máy chủ, không trả về trình duyệt', r.j.ai);
    const pub = await fetch(B + '/assets/data/cms.js').then(x => x.text());
    t.ok(!pub.includes('sk-ant-thu-nghiem'), 'khóa AI không có trong dữ liệu công khai');
    await req('/api/settings', { method: 'PUT', body: { ai: { apiKey: null } } });

    // 6. Tắt dịch tự động → sửa tiếng Việt thì trang tiếng Anh tạm hiện chữ tiếng Việt
    await req('/api/settings', { method: 'PUT', body: { ai: { enabled: false } } });
    await req('/api/cms', { method: 'PUT', body: { text: { [f.key]: { vi: 'Khi tắt AI' } } } });
    await settle();
    pair = await cmsT(f.key);
    t.ok(pair && pair[1] === 'Khi tắt AI', 'tắt AI: tiếng Anh tạm dùng chữ tiếng Việt mới (không hiện chữ cũ sai nội dung)', pair);
    await req('/api/settings', { method: 'PUT', body: { ai: { enabled: true } } });
    r = await req('/api/translate/run', { method: 'POST', body: { wait: true } });
    store = (await req('/api/cms')).j;
    t.ok(store.text[f.key].en === '[EN] Khi tắt AI', 'bật lại + "Dịch phần còn thiếu" → dịch bù', store.text[f.key]);
    st = (await req('/api/translate/status')).j;
    const miss = Object.values(st.missing || {}).reduce((a, b) => a + b, 0);
    t.ok(miss === 0, 'không còn chỗ nào thiếu tiếng Anh', st.missing);
  });
};
