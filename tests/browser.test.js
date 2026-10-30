/*
 * Kiểm tra trên trình duyệt thật (Chrome / Edge chạy ẩn):
 *   - mọi trang × tiếng Việt / tiếng Anh × 3 cỡ màn hình: không lỗi JavaScript, không tràn ngang, không còn {biến} chưa điền
 *   - đặt hàng (có mã giảm giá), phiếu xác nhận, đăng ký khóa học, yêu cầu tư vấn, trang quản trị
 * Cần chạy sau api.test.js (dùng phiên quản trị + đơn hàng đã tạo ở đó).
 */
const { sleep } = require('./lib/sandbox');
const fakeIsp = require('./lib/fake-isp');

const TOKEN_RE = /\{(found|gt|hssv|mem|ship|promo|hours|sched)\.[^}]*\}/;
const WIDTHS = [375, 820, 1366];

module.exports = async function browserTests(env, t, browser) {
  const B = env.base;
  const api = (url, o = {}) => fetch(B + url, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.adminToken }, body: o.body ? JSON.stringify(o.body) : undefined }).then(r => r.json());
  const page = await browser.newPage();
  const errs = label => { const e = page.takeErrors(); t.ok(!e.length, label + ' — không lỗi JavaScript', e); };

  // chuẩn bị: bật 1 trang chính sách để kiểm tra trang phụ
  const pages = await api('/api/pages');
  const terms = pages.find(p => p.slug === 'dieu-khoan-su-dung');
  if (terms) await api('/api/pages/' + terms.id, { method: 'PUT', body: { ...terms, published: true } });
  const prods = await api('/api/products');
  const p = prods[1] || prods[0];
  const slug = (await (await fetch(B + '/sitemap.xml')).text()).match(new RegExp('/shop/([a-z0-9-]+)</loc>'))[1];
  const s = env.order.slip;

  t.section('Mọi trang · VI / EN · 375 / 820 / 1366 px');
  const URLS = [['/', 'Trang chủ'], ['/shop', 'Shop'], ['/shop/' + slug, 'Trang sản phẩm'], ['/khoa-hoc', 'Khóa học'], ['/dich-vu-setup', 'Dịch vụ setup'],
    ['/trang/dieu-khoan-su-dung', 'Trang phụ'], [`/phieu/${s.code}?k=${s.k}&staff=1`, 'Phiếu xác nhận'], ['/khong-co-trang-nay', 'Trang 404'],
    ['/xep-hang', 'Ranking võ sĩ'], ['/vo-si', 'Danh sách võ sĩ'], ['/vo-si/nguyen-hoang-long', 'Hồ sơ võ sĩ'], ['/su-kien', 'Lịch sự kiện'], ['/su-kien?tab=res', 'Kết quả sự kiện'], ['/xep-hang?view=div', 'Ranking theo hạng cân'], ['/so-sanh?a=nguyen-hoang-long&b=le-duc-anh', 'So sánh võ sĩ'], ['/truyen-nghe', 'Truyền Nghề'],
    ['/su-kien/' + (await (await fetch(B + '/api/ranking')).json()).events.find(e => e.status === 'done' && e.bouts.length).slug, 'Chi tiết sự kiện']];
  await page.goto(B + '/');
  const titles = {};
  for (const lang of ['vi', 'en']) {
    for (const [u, name] of URLS) {
      await t.run(name + ' ' + lang, async () => {
        await page.eval(`localStorage.setItem('dc_lang','${lang}');1`);
        await page.viewport(1366);
        await page.goto(B + u, { wait: 900 });
        const info = await page.eval(`({ title: document.title, desc: (document.querySelector('meta[name=description]') || {}).content || '', text: document.body.innerText })`);
        titles[u + lang] = info.title + ' | ' + info.desc;
        t.ok(!TOKEN_RE.test(info.text), `${name} (${lang}) — không còn {biến} chưa điền`, (info.text.match(TOKEN_RE) || [])[0]);
        const over = [];
        for (const w of WIDTHS) {
          await page.viewport(w);
          await sleep(250);
          const sw = await page.eval('document.documentElement.scrollWidth - innerWidth');
          if (sw > 1) over.push(w + 'px: tràn ' + sw + 'px');
        }
        t.ok(!over.length, `${name} (${lang}) — không tràn ngang ở 375 / 820 / 1366`, over);
        errs(`${name} (${lang})`);
      });
    }
  }
  for (const u of ['/', '/shop', '/khoa-hoc', '/dich-vu-setup']) t.ok(titles[u + 'vi'] && titles[u + 'en'] && titles[u + 'vi'] !== titles[u + 'en'], u + ' — tiêu đề / mô tả trang đổi sang tiếng Anh', [titles[u + 'vi'], titles[u + 'en']]);
  await page.viewport(1366);

  t.section('Đặt hàng trên trang (mã giảm giá, phiếu xác nhận)');
  await t.run('đặt hàng', async () => {
    await page.eval(`localStorage.setItem('dc_lang','vi'); localStorage.setItem('dc_cart', JSON.stringify({${JSON.stringify(p.id + '::' + p.sizes[0] + '::' + p.colors[0][0])}: 1})); 1`);
    await page.goto(B + '/shop/checkout', { wait: 1200 });
    const before = (await api('/api/orders')).length;
    const filled = await page.eval(`(() => {
      const f = document.getElementById('checkoutForm'); if (!f) return 'không thấy form';
      const set = (n, v) => { const el = f.elements[n]; if (!el) return; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
      set('name', 'Khách Trình Duyệt'); set('phone', '0912345678'); set('email', 'khach@example.com'); set('address', '45 Lê Lợi, Bến Nghé'); set('city', 'TP. Hồ Chí Minh'); set('ward', 'Bến Nghé');
      const bank = f.querySelector('input[name=pay][value=bank]'); if (bank) bank.click();
      return 'ok';
    })()`);
    t.ok(filled === 'ok', 'điền form thanh toán', filled);
    await page.eval(`(() => { document.getElementById('promoInput').value = 'DAPPER10'; document.getElementById('promoApply').click(); return 1; })()`);
    const promo = await page.until(`(document.getElementById('promoMsg').textContent.includes('DAPPER10')) && document.getElementById('promoMsg').textContent`);
    t.ok(promo, 'áp dụng mã DAPPER10 (server kiểm tra)', promo);
    await page.eval(`document.getElementById('placeOrder').click(); 1`);
    const box = await page.until(`document.querySelector('.dc-slipbox') ? document.querySelector('.dc-slip-view').getAttribute('href') : ''`, 10000);
    t.ok(box, 'đặt hàng xong → hiện ô tải / xem phiếu xác nhận', await page.eval(`document.body.innerText.slice(0, 400)`));
    const orders = await api('/api/orders');
    const o = orders[0];
    t.ok(orders.length === before + 1 && o.customer.name === 'Khách Trình Duyệt' && o.promo === 'DAPPER10' && o.discount > 0 && o.pay === 'bank', 'đơn lưu đúng trên server (khách, mã giảm giá, chuyển khoản)', o);
    errs('Đặt hàng');
    if (box) {
      await page.goto(B + box, { wait: 1200 });
      const txt = await page.eval('document.body.innerText');
      t.ok(txt.includes(o.code.replace('#', '')) || txt.includes(o.code), 'mở phiếu xác nhận của đơn vừa đặt', txt.slice(0, 300));
      const after = (await api('/api/orders')).find(x => x.id === o.id);
      t.ok(after.confirm.slip.views >= 1, 'khách mở phiếu → admin thấy "đã xem"', after.confirm.slip);
      errs('Phiếu xác nhận');
    }
  });

  t.section('Mục trên menu (bật / tắt ở Thiết lập → Thương hiệu & menu)');
  await t.run('menu', async () => {
    const st = await api('/api/settings');
    const n = st.brand.nav || {};
    t.ok(n.home === true && n.shop === true && n.course === true && n.services === false && n.ranking === true && n.career === true && Object.keys(n).length === 6, 'mặc định: ẩn "Dịch vụ Setup", các mục còn lại hiện', st.brand.nav);
    const look = async u => {
      await page.goto(B + u, { wait: 1000 });
      return page.eval(`(() => {
        const vis = el => getComputedStyle(el.closest('li') || el).display !== 'none';
        const top = [...document.querySelectorAll('.nav .nav-links a, .pg-links a')].filter(vis).map(a => a.getAttribute('href'));
        const b = document.querySelector('.mn-btn, .hamburger-btn'); if (b) b.click();
        const mob = [...document.querySelectorAll('#mnPanel .mn-link, #pgMenu a')].filter(a => getComputedStyle(a).display !== 'none').map(a => a.textContent.replace(/\\s+/g, ' ').trim());
        const x = document.querySelector('#mnPanel .mn-x'); if (x) x.click();
        return { top, mob };
      })()`);
    };
    const pg = (await api('/api/pages')).find(x => x.published);
    const urls = ['/', '/shop', '/khoa-hoc'].concat(pg ? ['/trang/' + pg.slug] : []);
    for (const u of urls) {
      const m = await look(u);
      t.ok(m.top.length >= 3 && !m.top.some(h => /dich-vu-setup/.test(h)) && !m.mob.some(s => /Dịch vụ Setup/.test(s)), u + ' — menu trên cùng + menu điện thoại không còn "Dịch vụ Setup"', m);
      t.ok(['/su-kien', '/xep-hang', '/vo-si'].every(h => m.top.includes(h)) && m.mob.some(s => /Academy Ranking|Ranking võ sĩ/.test(s)), u + ' — có mục "Academy Ranking" (menu thả xuống: Lịch sự kiện · Ranking võ sĩ · Thông tin võ sĩ)', m);
      t.ok(m.top.includes('/truyen-nghe') && m.mob.some(s => /Truyền Nghề/.test(s)) && m.mob.some(s => /Cửa hàng/.test(s)) && !m.mob.some(s => /\bShop\b/.test(s)), u + ' — có mục "Truyền Nghề", tiếng Việt ghi "Cửa hàng"', m);
    }
    let r = await api('/api/settings', { method: 'PUT', body: { brand: { nav: { services: true, shop: false, bogus: true } } } });
    t.ok(r.brand.nav.services === true && r.brand.nav.shop === false && !('bogus' in r.brand.nav), 'lưu bật / tắt từng mục (bỏ qua mục lạ)', r.brand.nav);
    const m = await look('/khoa-hoc');
    t.ok(m.top.some(h => /dich-vu-setup/.test(h)) && !m.top.some(h => h === '/shop') && m.mob.some(s => /Dịch vụ Setup/.test(s)) && m.mob.length === 5 && !m.mob.some(s => /Cửa hàng/.test(s)), 'bật "Dịch vụ Setup", tắt "Cửa hàng" → menu đổi theo ngay', m);
    await api('/api/settings', { method: 'PUT', body: { brand: { nav: { services: false, shop: true } } } });
    errs('Menu bật / tắt');
  });

  t.section('Dapper Combat Academy Ranking trên trang (kiểu BoxRec)');
  await t.run('xếp hạng', async () => {
    await page.eval(`localStorage.setItem('dc_lang','vi'); 1`);
    await page.goto(B + '/xep-hang', { wait: 1000 });
    let st = await page.eval(`({ rows: document.querySelectorAll('#xh .xh-table tbody tr').length, first: (document.querySelector('#xh .xh-table tbody tr .xh-name a') || {}).textContent, tab: (document.querySelector('.xh-tabs a.on') || {}).textContent })`);
    t.ok(st.rows === 13 && st.first === 'Nguyễn Hoàng Long' && st.tab === 'Ranking võ sĩ', 'ranking nam: 13 võ sĩ đang thi đấu, số 1 đứng đầu', st);
    await page.eval(`document.querySelector('[data-seg="g"][data-v="f"]').click(); 1`);
    st = await page.eval(`({ rows: document.querySelectorAll('#xh .xh-table tbody tr').length, first: document.querySelector('#xh .xh-table tbody tr .xh-name a').textContent, url: location.search })`);
    t.ok(st.rows === 6 && st.first === 'Trần Ngọc Hân' && st.url === '?g=f', 'bấm "Nữ" → bảng nữ, nhớ lựa chọn trên đường dẫn', st);
    await page.eval(`(() => { const i = document.querySelector('.xh-search input'); i.value = 'rong den'; i.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
    st = await page.eval(`[...document.querySelectorAll('#xhSugg a')].map(a => a.getAttribute('href'))`);
    t.ok(st.length === 1 && st[0] === '/vo-si/nguyen-hoang-long', 'ô tìm: gõ biệt danh không dấu "rong den" → gợi ý đúng võ sĩ', st);
    await page.goto(B + '/xep-hang', { wait: 1000 });
    st = await page.eval(`[...document.querySelectorAll('#xh .xh-table tbody tr')].map(r => r.querySelector('.xh-name a').textContent + '|' + r.children[1].textContent)`);
    t.ok(st.includes('Bùi Tuấn Kiệt|▲1') && st.includes('Phan Văn Hậu|▼2'), 'cột ± : thứ hạng lên / xuống so với trước sự kiện gần nhất', st);
    await page.eval(`document.querySelector('[data-seg="view"][data-v="div"]').click(); 1`);
    st = await page.eval(`({ heads: [...document.querySelectorAll('#xh .xh-day')].map(x => x.firstChild.textContent.trim()), tables: document.querySelectorAll('#xh .xh-table').length, url: location.search })`);
    t.ok(st.heads[0] === 'Hạng Ruồi' && st.heads.length === st.tables && st.heads.length >= 7 && st.url === '?view=div', 'xem "Theo hạng cân": mỗi hạng cân một bảng', st);
    await page.goto(B + '/so-sanh?a=nguyen-hoang-long&b=le-duc-anh', { wait: 1000 });
    st = await page.eval(`({ names: [...document.querySelectorAll('.xh-cmp-card b')].map(b => b.textContent), prob: [...document.querySelectorAll('.xh-cmp-prob .xh-prob span')].map(s => parseInt(s.textContent, 10)), h2h: [...document.querySelectorAll('#xh .xh-res')].map(x => x.textContent), radar: document.querySelectorAll('.xh-radar polygon[fill-opacity]').length, tab: document.querySelector('.xh-tabs a.on').textContent })`);
    t.ok(st.names.join() === 'Nguyễn Hoàng Long,Lê Đức Anh' && st.prob[0] + st.prob[1] === 100 && st.prob[0] > 50 && st.h2h.includes('T') && st.radar === 2 && st.tab === 'So sánh',
      'so sánh 2 võ sĩ: khả năng thắng, đối đầu trực tiếp, radar chồng 2 võ sĩ', st);
    st = await page.eval(`({ big: [...document.querySelectorAll('.xh-pr-big b')].map(b => parseInt(b.textContent, 10)), fx: document.querySelectorAll('.xh-pr-fx li').length })`);
    t.ok(st.big.length === 3 && Math.abs(st.big[0] + st.big[1] + st.big[2] - 100) <= 2 && st.big[0] > st.big[2] && st.fx >= 1, 'so sánh: kèo dự đoán (thắng / hòa / thua ~100%, yếu tố quyết định)', st);
    await page.eval(`document.querySelector('[data-seg="r"][data-v="5"]').click(); 1`);
    st = await page.eval(`({ url: location.search, kv: [...document.querySelectorAll('.xh-pr-kv dt')].map(x => x.textContent).join('|') })`);
    t.ok(/r=5/.test(st.url) && /5 hiệp/.test(st.kv), 'chọn 5 hiệp → tính lại kèo, nhớ trên đường dẫn', st);
    await page.goto(B + '/phieu-vo-si', { wait: 800 });
    st = await page.eval(`({ sheets: document.querySelectorAll('.sheet').length, h2: [...document.querySelectorAll('h2 b')].map(b => b.textContent).join(',') })`);
    t.ok(st.sheets === 2 && st.h2 === 'A1,A2,A3,A4,A5,A6,B1,B2,B3', 'phiếu thông tin võ sĩ in ra giấy: 2 trang, mục A1–A6, B1–B3', st);
    await page.goto(B + '/su-kien', { wait: 1000 });
    st = await page.eval(`document.querySelectorAll('#xh .xh-prob').length`);
    t.ok(st >= 6, 'trận sắp đấu có thanh khả năng thắng (theo điểm)', st);
    st = await page.eval(`({ feat: [...document.querySelectorAll('.xh-feat-f > span:not(.xh-rec)')].map(x => x.textContent), cd: document.querySelectorAll('.xh-feat [data-cd] b').length })`);
    t.ok(st.feat.join() === 'Nguyễn Hoàng Long,Phạm Gia Huy' && st.cd === 3, 'lịch sự kiện: trận tâm điểm của sự kiện sắp tới + đồng hồ đếm ngược', st);
    await page.goto(B + '/vo-si', { wait: 1000 });
    const cards = await page.eval(`document.querySelectorAll('#xh .xh-card').length`);
    await page.eval(`document.querySelector('[data-seg="role"][data-v="power"]').click(); 1`);
    st = await page.eval(`({ n: document.querySelectorAll('#xh .xh-card').length, url: location.search })`);
    t.ok(cards === 20 && st.n > 0 && st.n < 20 && st.url === '?role=power', 'thông tin võ sĩ: lưới 20 thẻ, lọc theo vai trò "Đấm nặng"', { cards, ...st });
    await page.goto(B + '/vo-si/nguyen-hoang-long', { wait: 1000 });
    st = await page.eval(`({ h1: document.querySelector('#xh h1').textContent, radar: !!document.querySelector('.xh-radar polygon[fill-opacity]'), chart: document.querySelectorAll('.xh-chart circle').length, bouts: document.querySelectorAll('#xh .xh-res').length, title: document.title, cmp: !!document.querySelector('.xh-cmp-form select[name=b]') })`);
    t.ok(st.h1 === 'Nguyễn Hoàng Long' && st.radar && st.chart === 4 && st.bouts >= 3 && /Rồng Đen/.test(st.title) && /Academy Ranking/.test(st.title) && st.cmp,
      'hồ sơ võ sĩ: tên, radar kỹ năng, biểu đồ diễn biến điểm, lịch sử thi đấu, ô so sánh', st);
    st = await page.eval(`(() => { document.querySelector('[data-ab="4"]').click(); return { keys: [...document.querySelectorAll('[data-ab] .xh-ab-k')].map(k => k.textContent).join(''), on: document.querySelector('[data-ab].on').getAttribute('data-ab'), name: document.querySelector('#xhAbD h3').textContent, sub: (document.querySelector('#xhAbD .xh-ab-sub') || {}).textContent }; })()`);
    t.ok(st.keys === 'PQWER' && st.on === '4' && st.name === 'Móc trái hạ màn' && st.sub === 'Áp đảo thẻ điểm',
      'hồ sơ kiểu trang tướng: bấm R → tuyệt chiêu HLV đặt tên, kèm cách thắng sở trường (2 lần thắng điểm tuyệt đối)', st);
    await page.eval(`document.querySelector('.xh-lang [data-lang="en"]').click(); 1`);
    st = await page.eval(`({ tab: document.querySelector('.xh-tabs a.on').textContent, th: document.querySelector('.xh-kv th').textContent, html: document.documentElement.lang })`);
    t.ok(st.tab === 'Fighters' && st.th === 'Ranking points' && st.html === 'en', 'bấm EN → giao diện bảng xếp hạng sang tiếng Anh', st);
    await page.eval(`localStorage.setItem('dc_lang','vi'); 1`);
    errs('Academy Ranking');
  });

  t.section('Cách thanh toán · trả góp VNPay (trên trang)');
  await t.run('trả góp', async () => {
    const ISP = { tmnCode: 'DCISP002', clientId: 'DCCLIENT', username: 'dapper', password: 'mat-khau-thu-123', secretKey: 'ISPSECRET-BROWSER' };
    const isp = await fakeIsp.start(ISP), MIN = 1000000;
    try {
      await api('/api/settings', { method: 'PUT', body: { pay: { installment: { enabled: true, apiUrl: isp.base, ...ISP, minAmount: MIN } } } });
      const all = await api('/api/admin/products');
      const big = all.find(x => x.stock >= 5 && !x.stockBy && x.visible !== false && x.price * 4 >= MIN) || all[0], qty = Math.max(1, Math.ceil(MIN / big.price));
      const cheap = all.find(x => x.stock >= 1 && !x.stockBy && x.visible !== false && x.price + 60000 < MIN);
      const shown = `[...document.querySelectorAll('#payOpts .pay-opt')].filter(l => getComputedStyle(l).display !== 'none').map(l => l.querySelector('input').value + (l.querySelector('input').disabled ? ':off' : ''))`;
      if (cheap) {
        await page.eval(`localStorage.setItem('dc_lang','vi'); localStorage.setItem('dc_cart', JSON.stringify({${JSON.stringify(cheap.id + '::' + cheap.sizes[0] + '::' + cheap.colors[0][0])}: 1})); 1`);
        await page.goto(B + '/shop/checkout', { wait: 1200 });
        const st = await page.eval(`({ opts: ${shown}, sub: document.querySelector('#payOpts [data-pay-opt="installment"] .po-sub').textContent })`);
        t.ok(st.opts.join() === 'bank,momo,zalopay,installment:off' && /1\.000\.000/.test(st.sub), 'đơn nhỏ: trả góp hiện nhưng khóa, ghi mức tối thiểu; không còn COD', st);
      }
      await page.eval(`localStorage.setItem('dc_cart', JSON.stringify({${JSON.stringify(big.id + '::' + big.sizes[0] + '::' + big.colors[0][0])}: ${qty}})); 1`);
      await page.goto(B + '/shop/checkout', { wait: 1200 });
      const opts = await page.eval(shown);
      t.ok(opts.join() === 'bank,momo,zalopay,installment', 'trang thanh toán: chuyển khoản, MoMo, ZaloPay, trả góp (thẻ ẩn khi chưa bật VNPay)', opts);
      await page.eval(`(() => {
        const f = document.getElementById('checkoutForm');
        const set = (n, v) => { const el = f.elements[n]; if (!el) return; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
        set('name', 'Nguyễn Trả Góp'); set('phone', '0912345679'); set('email', ''); set('address', '45 Lê Lợi'); set('city', 'TP. Hồ Chí Minh');
        f.querySelector('input[name=pay][value=installment]').click();
        document.getElementById('placeOrder').click(); return 1;
      })()`);
      const banks = await page.until(`document.querySelectorAll('#dcIsp [data-isp-bank]').length`, 10000);
      t.ok(banks === 2, 'đặt hàng chọn trả góp → tự mở bảng chọn ngân hàng', await page.eval(`(document.getElementById('dcIsp') || document.body).innerText.slice(0, 300)`));
      await page.eval(`document.querySelector('#dcIsp [data-isp-bank="VIETCOMBANK"]').click(); 1`);
      await page.eval(`document.querySelector('#dcIsp [data-isp-scheme="VISA"]').click(); 1`);
      await page.eval(`document.querySelector('#dcIsp [data-isp-term="6"]').click(); 1`);
      const step = await page.eval(`({ terms: document.querySelectorAll('#dcIsp [data-isp-term]').length, email: !!document.querySelector('#dcIsp [data-isp-info="email"]'), go: !document.querySelector('#dcIsp [data-isp-go]').disabled,
        txt: document.getElementById('dcIsp').textContent.replace(/\\s+/g, ' ') })`);
      t.ok(step.terms === 3 && step.email && step.go && /6 tháng/.test(step.txt) && /\/tháng/.test(step.txt), 'chọn ngân hàng → loại thẻ → kỳ hạn (xem tiền mỗi tháng); khách chưa có email → hỏi thêm', step);
      await page.eval(`(() => { const i = document.querySelector('#dcIsp [data-isp-info="email"]'); i.value = 'gop@example.com'; i.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#dcIsp [data-isp-go]').click(); return 1; })()`);
      for (let i = 0; i < 50 && !isp.pays.length; i++) await sleep(200);
      const init = isp.inits[isp.inits.length - 1], pay = isp.pays[0] || {};
      t.ok(!!init && init.ok && pay.tmnCode === ISP.tmnCode && /^dk\./.test(pay.dataKey || '') && /^6668219255/.test(pay.ispTxnId || ''),
        'bấm "Tiếp tục sang VNPay" → trình duyệt POST form sang trang trả góp VNPay', { init: init && { ok: init.ok, missing: init.missing }, pay });
      const o = (await api('/api/orders'))[0];
      t.ok(o.pay === 'installment' && o.customer.email === 'gop@example.com' && init.body.transaction.recurringNumberOfIsp === 6, 'đơn lưu cách trả góp + email khách vừa nhập', { pay: o.pay, email: o.customer.email });
      errs('Trả góp');
    } finally {
      await api('/api/settings', { method: 'PUT', body: { pay: { installment: { enabled: false } } } });
      await isp.stop();
    }
  });

  t.section('Đăng ký khóa học trên trang');
  await t.run('đăng ký', async () => {
    const before = (await api('/api/registrations')).length;
    await page.goto(B + '/khoa-hoc', { wait: 1000 });
    await page.eval(`cv3Open('trial'); 1`);
    for (let i = 0; i < 4; i++) {
      const hasForm = await page.eval(`!!document.getElementById('cv3Name')`);
      if (hasForm) {
        await page.eval(`(() => { const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }; set('cv3Name', 'Học Viên Trình Duyệt'); set('cv3Phone', '0987654321'); return 1; })()`);
        await page.eval(`document.querySelector('#cv3Reg [data-cv3="next"]').click(); 1`);
        break;
      }
      await page.eval(`(document.querySelector('#cv3Reg [data-cv3="next"]') || {}).click && document.querySelector('#cv3Reg [data-cv3="next"]').click(); 1`);
      await sleep(300);
    }
    const ok = await page.until(`!!document.querySelector('#cv3Reg .dc-slipbox')`, 10000);
    t.ok(ok, 'đăng ký học thử xong → hiện phiếu xác nhận', await page.eval(`document.getElementById('cv3Reg').innerText.slice(0, 400)`));
    const regs = await api('/api/registrations');
    t.ok(regs.length === before + 1 && regs[0].name === 'Học Viên Trình Duyệt', 'đăng ký lưu trên server', regs[0]);
    errs('Đăng ký khóa học');
  });

  t.section('Truyền Nghề (/truyen-nghe): 2 con đường Coach / Võ sĩ, đăng ký giữ chỗ');
  await t.run('truyền nghề', async () => {
    await page.eval(`localStorage.setItem('dc_lang','vi'); 1`);
    await page.goto(B + '/truyen-nghe', { wait: 1200 });
    const look = () => page.eval(`({ path: document.body.dataset.path, h1: document.querySelector('.tn-hero h1').textContent, round1: document.querySelector('.tn-road h3').textContent, cells: document.querySelectorAll('.tn-wk-c').length,
      cell1: document.querySelector('.tn-wk-c b').textContent, out: document.querySelector('.tn-bell b').textContent, fee: document.querySelector('.tn-fee-v').textContent, start: document.querySelector('.tn-start b').textContent,
      skills: document.querySelectorAll('.tn-skills li').length, hash: location.hash, nav: [...document.querySelectorAll('.tn-site a')].filter(a => a.offsetParent).map(a => a.textContent) })`);
    let st = await look();
    t.ok(st.path === 'coach' && st.h1 === 'Truyền Nghề' && st.out === '100% cơ hội làm việc tại HVP Academy' && st.fee === '50.000.000đ' && st.start === 'Khai giảng 20.02.2027', 'mở trang: con đường Coach, học phí + ngày khai giảng từ thiết lập', st);
    t.ok(st.cells === 10 && st.skills === 6 && st.nav.includes('Cửa hàng') && st.nav.includes('Truyền Nghề'), 'tuần học 5 ngày × 2 ca, 6 kỹ năng, menu có "Cửa hàng" + "Truyền Nghề"', st);
    const coachCell = st.cell1;
    await page.eval(`document.querySelector('.tn-seg .fighter').click(); 1`);
    st = await look();
    t.ok(st.path === 'fighter' && st.hash === '#vo-si' && st.round1 === 'Nền tảng và thể lực' && st.out === '100% thi đấu dưới màu cờ The Corner' && st.cells === 10 && st.cell1 !== coachCell, 'đổi sang Võ sĩ: cùng khung 10 ca, nội dung + đích đến đổi theo', st);
    await page.goto(B + '/', { wait: 300 });
    await page.goto(B + '/truyen-nghe#vo-si', { wait: 1000 });
    st = await look();
    t.ok(st.path === 'fighter', 'mở thẳng /truyen-nghe#vo-si → con đường Võ sĩ', st);
    // gửi thiếu tên → báo lỗi; gõ dở rồi đổi ngôn ngữ → chữ vẫn còn
    await page.eval(`(() => { const f = document.querySelector('.tn-form'); f.elements.phone.value = '0912 345 678'; f.querySelector('[type=submit]').click(); return 1; })()`);
    const err = await page.eval(`document.querySelector('.tn-err').hidden ? '' : document.querySelector('.tn-err').textContent`);
    t.ok(err === 'Nhập họ và tên', 'thiếu tên → báo lỗi rõ ràng', err);
    await page.eval(`(() => { const f = document.querySelector('.tn-form'); f.elements.name.value = 'Võ Sĩ Trình Duyệt'; f.elements.year.value = '2003'; document.querySelector('.tn-lang [data-lang="en"]').click(); return 1; })()`);
    st = await page.eval(`({ h1: document.querySelector('.tn-hero h1').textContent, name: document.querySelector('.tn-form').elements.name.value, phone: document.querySelector('.tn-form').elements.phone.value, out: document.querySelector('.tn-bell b').textContent })`);
    t.ok(st.h1 === 'Pro Pathways' && st.out === '100% fighting in The Corner colours' && st.name === 'Võ Sĩ Trình Duyệt' && st.phone === '0912 345 678', 'tiếng Anh: đổi chữ, giữ thông tin đã gõ', st);
    const before = (await api('/api/registrations')).length;
    await page.eval(`document.querySelector('.tn-form [type=submit]').click(); 1`);
    const ok = await page.until(`!!document.querySelector('.tn-ok')`, 8000);
    t.ok(ok && /DC-REG-/.test(await page.eval(`document.querySelector('.tn-ok').textContent`)), 'gửi đăng ký → hiện mã đăng ký');
    const regs = await api('/api/registrations');
    const r0 = regs[0];
    t.ok(regs.length === before + 1 && r0.name === 'Võ Sĩ Trình Duyệt' && r0.program === 'fighter' && r0.programName === 'Truyền Nghề · Võ sĩ' && r0.total === 50000000 && r0.due === 0 && /sinh năm 2003/.test(r0.detail) && r0.lang === 'en', 'đăng ký lưu trên server: khóa Võ sĩ, học phí 50 triệu, chưa thu tiền', r0);
    st = await page.eval(`({ stamped: !!document.querySelector('.tn-cert.stamped'), code: document.querySelector('[data-cert-code]').textContent, name: document.querySelector('[data-cert-name]').textContent, pay: !!document.querySelector('.tn-paybox') })`);
    t.ok(st.stamped && st.code === r0.code && st.name === 'Võ Sĩ Trình Duyệt' && !st.pay, 'giấy nhập môn đóng dấu "đã ghi danh", ghi mã đăng ký; tư vấn trước → không hiện mã QR', st);
    await page.eval(`localStorage.setItem('dc_lang','vi'); 1`);
    // trắc nghiệm "hợp góc nào" → kết quả → giữ chỗ đúng góc; giấy nhập môn đổi theo tên đang gõ
    await page.goto(B + '/', { wait: 300 });
    await page.goto(B + '/truyen-nghe', { wait: 1000 });
    for (const a of ['fighter', 'coach', 'fighter', 'fighter']) await page.eval(`document.querySelector('.tn-q-a .${a}').click(); 1`);
    st = await page.eval(`(document.querySelector('.tn-q-res h3') || {}).textContent`);
    t.ok(st === 'Bạn thuộc góc đỏ: Võ sĩ', 'trắc nghiệm 4 câu → kết quả góc đỏ', st);
    await page.eval(`document.querySelector('.tn-q-res [data-go="dang-ky"]').click(); 1`);
    await page.eval(`(() => { const n = document.querySelector('.tn-form [name=name]'); n.value = 'Trần Thị Bình'; n.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
    st = await page.eval(`({ path: document.body.dataset.path, name: document.querySelector('[data-cert-name]').textContent, out: document.querySelector('.tn-cert-dl div:nth-child(2) dd').textContent, pay: !!document.querySelector('[name=pay]') })`);
    t.ok(st.path === 'fighter' && st.name === 'Trần Thị Bình' && st.out === '100% thi đấu dưới màu cờ The Corner' && !st.pay, 'bấm "Giữ chỗ khóa Võ sĩ" → form chọn sẵn Võ sĩ, giấy nhập môn hiện tên đang gõ; chưa có tài khoản nhận tiền → chỉ đăng ký tư vấn', st);
    // có tài khoản nhận tiền + tiền cọc → chọn "Đặt cọc" → mã QR đúng số cọc ngay sau khi gửi
    await api('/api/cms', { method: 'PUT', body: { payment: { bankBin: '970436', bankAccount: '0123456789', bankHolder: 'DAPPER COMBAT' } } });
    await api('/api/settings', { method: 'PUT', body: { course: { careerDeposit: 5000000, careerSeats: 20 } } });
    await page.goto(B + '/', { wait: 300 });
    await page.goto(B + '/truyen-nghe#vo-si', { wait: 1000 });
    st = await page.eval(`({ opts: [...document.querySelectorAll('.tn-form [name=pay]')].map(x => x.value), seats: (document.querySelector('.tn-seats') || {}).textContent,
      strip: document.querySelector('.tn-strip-price b').textContent, dep: (document.querySelector('.tn-worth-dep b') || {}).textContent, fee: document.querySelector('.tn-worth-pay .tn-fee-v').textContent,
      rows: [...document.querySelectorAll('.tn-worth-get li > b')].map(b => b.textContent).join(' '), dock: document.querySelector('.tn-dock b').textContent })`);
    t.ok(st.opts.join() === 'consult,deposit,full' && st.seats === 'Mỗi khóa nhận tối đa 20 học viên' && st.strip === '5.000.000đ' && st.dep === '5.000.000đ' && st.fee === '50.000.000đ' && st.rows === '520 4 6 1 100% 100%' && st.dock === 'Giữ chỗ chỉ 5 triệu',
      'có tài khoản nhận tiền + tiền cọc → mời "giữ chỗ chỉ 5 triệu", khu học phí liệt kê thứ nhận về, form có Tư vấn / Đặt cọc / Đóng đủ', st);
    await page.eval(`document.querySelector('.tn-strip-cta [data-pick-pay]').click(); 1`);
    st = await page.eval(`({ pay: (document.querySelector('.tn-form [name=pay]:checked') || {}).value, send: document.querySelector('.tn-form [data-send]').textContent })`);
    t.ok(st.pay === 'deposit' && st.send === 'Ghi danh và đặt cọc', 'bấm "Đặt cọc 5 triệu giữ chỗ" → form chọn sẵn đặt cọc', st);
    await page.eval(`(() => { const f = document.querySelector('.tn-form'); f.elements.name.value = 'Học Viên Đặt Cọc'; f.elements.phone.value = '0933 111 222'; f.querySelector('[type=submit]').click(); return 1; })()`);
    await page.until(`!!document.querySelector('.tn-ok')`, 8000);
    st = await page.eval(`({ box: !!document.querySelector('.tn-paybox'), qr: (document.querySelector('.tn-paybox .dc-vietqr') || {}).src || '', text: (document.querySelector('.tn-paybox-t') || {}).textContent })`);
    const dep = (await api('/api/registrations'))[0];
    t.ok(st.box && /amount=5000000/.test(st.qr) && /5\.000\.000đ/.test(st.text) && dep.name === 'Học Viên Đặt Cọc' && dep.due === 5000000 && dep.payName === 'Đặt cọc giữ chỗ', 'đặt cọc → hiện mã QR 5.000.000đ, đăng ký lưu số cần trả 5.000.000đ', { st, due: dep.due, payName: dep.payName });
    await api('/api/settings', { method: 'PUT', body: { course: { careerDeposit: 2000000, careerSeats: 0 } } });
    await api('/api/cms', { method: 'PUT', body: { payment: { bankBin: '', bankAccount: '', bankHolder: '' } } });
    // tắt mục "Truyền Nghề" trong /admin → menu các trang ẩn theo
    await api('/api/settings', { method: 'PUT', body: { brand: { nav: { career: false } } } });
    await page.goto(B + '/khoa-hoc', { wait: 1000 });
    const shown = await page.eval(`[...document.querySelectorAll('.nav .nav-links a')].some(a => a.getAttribute('href') === '/truyen-nghe' && getComputedStyle(a.closest('li')).display !== 'none')`);
    t.ok(!shown, 'tắt "Truyền Nghề" ở Thiết lập → menu trang Khóa học ẩn mục này');
    await api('/api/settings', { method: 'PUT', body: { brand: { nav: { career: true } } } });
    errs('Truyền Nghề');
  });

  t.section('Yêu cầu tư vấn setup trên trang');
  await t.run('tư vấn', async () => {
    const before = (await api('/api/consults')).length;
    await page.goto(B + '/dich-vu-setup', { wait: 1000 });
    await page.eval(`(() => {
      const chip = document.querySelector('[data-chips="type"] button, [data-chips="type"] [data-v], [data-chips="type"] > *'); if (chip) chip.click();
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
      set('fName', 'Chủ Phòng Tập'); set('fPhone', '0909888777');
      const f = document.getElementById('svcForm'); f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable: true }));
      return 1;
    })()`);
    const code = await page.until(`(document.body.innerText.match(/#DC-SVC-\\d+/) || [])[0]`, 10000);
    t.ok(code, 'gửi yêu cầu tư vấn → hiện mã tra cứu', await page.eval(`document.getElementById('svcForm') ? document.getElementById('svcForm').innerText.slice(0, 300) : ''`));
    t.ok((await api('/api/consults')).length === before + 1, 'yêu cầu tư vấn lưu trên server');
    errs('Tư vấn setup');
  });

  t.section('Tồn kho theo size × màu, phiếu đã thanh toán (trên trang)');
  await t.run('biến thể', async () => {
    const all = await api('/api/admin/products');
    const q = all.find(x => x.sizes.length >= 2 && x.visible !== false);
    const k0 = q.sizes[0] + '::' + q.colors[0][0];
    await api('/api/products/' + q.id, { method: 'PUT', body: { ...q, stockBy: { [k0]: 2 } } });
    const qs = (await (await fetch(B + '/api/products')).json()).find(x => x.id === q.id);
    await page.eval(`localStorage.setItem('dc_lang','vi'); localStorage.removeItem('dc_cart'); 1`);
    await page.goto(B + '/shop/' + (qs.slug || q.id), { wait: 1200 });
    const st = await page.eval(`({ oos: document.querySelectorAll('.oos').length, txt: document.body.textContent.replace(/\\s+/g, ' ') })`);
    t.ok(st.oos >= 1, 'trang sản phẩm gạch size / màu đã hết', st.oos);
    t.ok(/chỉ còn 2\b/i.test(st.txt), 'trang sản phẩm báo "Chỉ còn 2" theo đúng size / màu đang chọn', (st.txt.match(/.{0,80}(chỉ còn|còn hàng|hết hàng).{0,80}/i) || [''])[0]);
    errs('Trang sản phẩm có tồn kho theo size');
    await api('/api/products/' + q.id, { method: 'PUT', body: { ...q, stockBy: null } });
    await api('/api/orders/' + env.order.id, { method: 'PUT', body: { paid: true, carrier: 'GHN', trackingCode: 'GHN-TEST-1' } });
    await api('/api/orders/' + env.order.id + '/edit', { method: 'PUT', body: { carrier: 'GHN', trackingCode: 'GHN-TEST-1' } });
    await page.goto(B + `/phieu/${s.code}?k=${s.k}&staff=1`, { wait: 1200 });
    const slip = await page.eval('document.body.textContent');
    t.ok(/Đã thanh toán/.test(slip) && /GHN-TEST-1/.test(slip), 'phiếu xác nhận hiện "Đã thanh toán" + mã vận đơn', slip.slice(0, 400));
    errs('Phiếu đã thanh toán');
  });

  if (env.aiField) {
    t.section('Bấm EN → hiện bản AI dịch');
    await t.run('EN', async () => {
      await page.eval(`localStorage.setItem('dc_lang','vi'); 1`);
      await page.goto(B + '/', { wait: 900 });
      const sel = JSON.stringify('[data-cms="' + env.aiField + '"]');
      const vi = await page.eval(`(document.querySelector(${sel}) || {}).textContent || ''`);
      await page.eval(`(() => { const b = [...document.querySelectorAll('button, a')].find(x => x.textContent.trim() === 'EN'); if (b) b.click(); return !!b; })()`);
      await sleep(500);
      const en = await page.eval(`(document.querySelector(${sel}) || {}).textContent || ''`);
      t.ok(/Khi tắt AI/.test(vi) && /^\s*\[EN\] Khi tắt AI\s*$/.test(en), 'tiếng Việt hiện chữ đã sửa; bấm EN hiện bản dịch', { vi, en });
      await page.eval(`localStorage.setItem('dc_lang','vi'); 1`);
      errs('Đổi sang tiếng Anh');
    });
  }

  t.section('Trang quản trị');
  await t.run('quản trị', async () => {
    await page.goto(B + '/admin', { wait: 800 });
    await page.eval(`localStorage.removeItem('dc_admin_token'); location.reload(); 1`);
    await sleep(1200);
    await page.eval(`(() => { const f = document.querySelector('form'); const set = (n, v) => { const el = f.querySelector('[name=' + n + ']') || f.querySelector('input[type=' + (n === 'email' ? 'email' : 'password') + ']'); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }; set('email', 'admin@dappercombat.com'); set('password', ${JSON.stringify(env.adminPassword)}); f.querySelector('[type=submit]').click(); return 1; })()`);
    const inApp = await page.until(`location.hash.length > 2 && !!document.querySelector('[data-nav]') && document.querySelector('[data-nav]').offsetParent !== null || document.querySelectorAll('[data-nav]').length > 3`, 8000);
    t.ok(inApp, 'đăng nhập trang quản trị');
    const routes = await page.eval(`[...new Set([...document.querySelectorAll('a[data-nav]')].map(a => a.getAttribute('href')))]`);
    t.ok(routes.length >= 10, 'menu quản trị có ' + routes.length + ' mục', routes);
    const bad = [];
    for (const r of routes) {
      await page.eval(`location.hash = ${JSON.stringify(r)}; 1`);
      await sleep(900);
      const st = await page.eval(`(() => { const m = document.querySelector('main') || document.getElementById('main'); return { len: m ? m.innerText.trim().length : 0, err: !!document.querySelector('.state--error, [data-error]') }; })()`);
      const e = page.takeErrors();
      if (st.len < 20 || e.length) bad.push({ route: r, len: st.len, errors: e });
    }
    t.ok(!bad.length, 'mọi màn hình quản trị mở được, không lỗi JavaScript', bad);
    const o = (await api('/api/orders'))[0];
    await page.eval(`location.hash = '#/orders/${o.id}'; 1`);
    const conf = await page.until(`document.body.textContent.includes('Xác nhận cho khách')`, 5000);   // innerText bị in hoa theo CSS
    t.ok(conf, 'chi tiết đơn hàng có mục "Xác nhận cho khách"');
    await page.eval(`location.hash = '#/fighters/vs01'; 1`);
    const fsec = await page.until(`document.querySelectorAll('[data-ff^="moves."]').length === 16 && [...document.querySelectorAll('.panel__title')].map(h => h.textContent.slice(0, 2)).join()`, 5000);
    t.ok(fsec && ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3'].every(k => fsec.includes(k)), 'hồ sơ võ sĩ trong admin: đủ mục A1–A5, B1–B3 (khớp phiếu giấy), 8 ô chiêu P Q W E R', fsec);
    await page.eval(`location.hash = '#/rank-events/sk07'; 1`);
    const pred = await page.until(`document.querySelectorAll('.rk-pred').length`, 5000);
    t.ok(pred === 6, 'xếp trận trong admin: trận chưa đấu hiện kèo dự đoán', pred);
    await page.eval(`location.hash = '#/dashboard'; 1`);
    await sleep(600);
    for (const w of [375, 820]) {
      await page.viewport(w); await sleep(400);
      const sw = await page.eval('document.documentElement.scrollWidth - innerWidth');
      t.ok(sw <= 1, 'quản trị không tràn ngang ở ' + w + 'px', sw);
    }
    await page.viewport(1366);
    errs('Trang quản trị');
  });

  await page.close();
};
