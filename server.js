require('dotenv').config();
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');

const app = express();
const PUB = path.join(__dirname, 'public');
const api = require('./routes/api');
const cms = require('./lib/cms');
const settings = require('./lib/settings');
const ranking = require('./lib/ranking');

app.disable('x-powered-by');
// IP thật của khách (để chặn spam / đoán mật khẩu): chỉ tin header X-Forwarded-For do proxy trên chính máy chủ thêm vào.
// Đặt sau Cloudflare / proxy khác: TRUST_PROXY trong .env (số lớp proxy, vd 2, hoặc dải IP)
const tp = process.env.TRUST_PROXY;
app.set('trust proxy', tp === undefined || tp === '' ? 'loopback' : /^\d+$/.test(tp) ? Number(tp) : tp === 'true' ? true : tp === 'false' ? false : tp);
// ảnh tải lên từ trang quản trị (base64). Khôi phục bản sao lưu tự đọc dữ liệu (giới hạn lớn hơn) sau khi đã kiểm tra đăng nhập — routes/api.js
const jsonBody = express.json({ limit: '12mb' });
app.use((req, res, next) => (req.path === '/api/backup/restore' ? next() : jsonBody(req, res, next)));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// đường dẫn cũ / gõ tắt
const moved = { '/index.html': '/', '/shop.html': '/shop', '/khoa-hoc.html': '/khoa-hoc', '/courses': '/khoa-hoc', '/course': '/khoa-hoc',
  '/dich-vu-setup.html': '/dich-vu-setup', '/setup': '/dich-vu-setup', '/dich-vu': '/dich-vu-setup', '/admin.html': '/admin', '/checkout': '/shop/checkout',
  '/xep-hang.html': '/xep-hang', '/ranking': '/xep-hang', '/rankings': '/xep-hang', '/bang-xep-hang': '/xep-hang', '/fighters': '/vo-si', '/events': '/su-kien', '/lich-su-kien': '/su-kien' };
app.get(Object.keys(moved), (req, res) => res.redirect(301, moved[req.path]));
app.get('/trang.html', (req, res) => sendPage(req, res, path.join(PUB, '404.html'), 404)); // khuôn trang phụ: không phục vụ trực tiếp

// Trang + CSS/JS của trang: áp nội dung tùy chỉnh từ /admin (chữ, ảnh/video, màu, liên hệ) trước khi gửi
// head = thẻ thêm vào <head> (link chuẩn cho Google, dữ liệu có cấu trúc)
function sendPage(req, res, file, status = 200, head = '') {
  const rel = path.relative(PUB, file).split(path.sep).join('/');
  const raw = fs.readFileSync(file, 'utf8');
  let body = cms.transformable(rel) ? cms.transform(rel, raw) : raw;
  if (head) body = body.replace('</head>', head + '</head>');
  const etag = '"' + crypto.createHash('sha1').update(body).digest('base64').slice(0, 22) + '"';
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('ETag', etag);
  if (status === 200 && req.headers['if-none-match'] === etag) return res.status(304).end();
  res.status(status).type(path.extname(file)).send(body);
}
app.get(/^\/assets\/(css|js)\/[\w.-]+\.(css|js)$/, (req, res, next) => {
  const file = path.join(PUB, req.path);
  if (!cms.transformable(req.path.slice(1)) || !fs.existsSync(file)) return next();
  sendPage(req, res, file);
});

// ─── SEO: địa chỉ chuẩn, dữ liệu cho Google, sitemap ───────────────────────
const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// địa chỉ gốc: Thiết lập → Thông báo → địa chỉ website, SITE_URL, hoặc tên miền đang truy cập
const baseUrl = req => ((settings.all().notify || {}).siteUrl || process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
const abs = (req, u) => (/^\//.test(u || '') ? baseUrl(req) + u : u || '');
const ldJson = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
function seoHead(req, pathName, ld) {
  const url = attr(baseUrl(req) + pathName);
  return `<link rel="canonical" href="${url}"><meta property="og:url" content="${url}">` + (ld ? ldJson(ld) : '');
}
// phòng tập (Trang chủ): tên, địa chỉ, giờ mở cửa, mạng xã hội — lấy từ /admin → Liên hệ
const WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const OPEN_DAYS = { '1-6': [1, 2, 3, 4, 5, 6], '0-6': [1, 2, 3, 4, 5, 6, 0], '1-5': [1, 2, 3, 4, 5], '1-6,0': [1, 2, 3, 4, 5, 6, 0] };
function gymLd(req) {
  const c = cms.contactConfig(), base = baseUrl(req);
  const o = {
    '@context': 'https://schema.org', '@type': 'ExerciseGym', name: 'Dapper Combat', url: base + '/',
    address: { '@type': 'PostalAddress', streetAddress: c.addr1, addressLocality: c.addr2, addressCountry: 'VN' },
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: (OPEN_DAYS[c.hoursDays] || OPEN_DAYS['1-6']).map(i => WEEK[i]), opens: c.hoursOpen, closes: c.hoursClose }],
    sameAs: [c.facebook, c.instagram, c.youtube].filter(Boolean),
  };
  if (c.company) o.legalName = c.company;
  if (c.taxId) o.taxID = c.taxId;
  if (c.phone && !/x/i.test(c.phone)) o.telephone = c.phone;
  if (c.email) o.email = c.email;
  if (c.maps) o.hasMap = c.maps;
  return o;
}
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', 'Disallow: /phieu/', 'Disallow: /shop/checkout', '', 'Sitemap: ' + baseUrl(req) + '/sitemap.xml', ''].join('\n'));
});
app.get('/sitemap.xml', (req, res) => {
  const base = baseUrl(req), esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const rk = ranking.publicData();
  const urls = ['/', '/shop', '/khoa-hoc', '/dich-vu-setup', '/xep-hang', '/vo-si', '/su-kien']
    .concat(api.publicProducts().map(p => '/shop/' + api.productSlug(p)))
    .concat(cms.livePages().map(s => '/trang/' + s))
    .concat(rk.fighters.map(f => '/vo-si/' + f.slug), rk.events.map(e => '/su-kien/' + e.slug));
  res.type('application/xml').setHeader('Cache-Control', 'no-cache');
  res.send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url><loc>${esc(base + u)}</loc></url>`).join('\n') + '\n</urlset>\n');
});

// Ảnh/video đặt tên theo mã băm nội dung → cache lâu dài; HTML/CSS/JS luôn kiểm tra lại (ETag → 304)
// ảnh tải lên nằm ngoài public/ (DC_UPLOAD_DIR) → phục vụ /assets/uploads từ thư mục đó
const paths = require('./lib/paths');
if (paths.CUSTOM_UPLOAD_DIR) {
  app.use('/assets/uploads', express.static(paths.UPLOAD_DIR, {
    index: false, redirect: false, // không có ở đây → thử public/assets/uploads (ảnh cũ) rồi mới báo 404
    setHeaders(res) { res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); },
  }));
}
app.use(express.static(PUB, {
  index: false,
  redirect: false,
  setHeaders(res, file) {
    if (/[\\/]assets[\\/](media|uploads)[\\/]/.test(file)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    else res.setHeader('Cache-Control', 'no-cache');
  },
}));

// Dữ liệu cho trang: sản phẩm (Home + Shop) và nội dung đã sửa trong /admin
app.get('/assets/data/products.js', (req, res) => {
  res.type('application/javascript').setHeader('Cache-Control', 'no-cache');
  res.send('window.__DC_PRODUCTS=' + JSON.stringify(api.publicProducts()).replace(/</g, '\\u003c') + ';');
});
// bảng xếp hạng CLB: đã tính điểm, thứ hạng, thành tích (lib/ranking.js)
app.get('/assets/data/ranking.js', (req, res) => {
  res.type('application/javascript').setHeader('Cache-Control', 'no-cache');
  res.send('window.__DC_RANKING=' + JSON.stringify(ranking.publicData()).replace(/</g, '\\u003c') + ';');
});
app.get('/assets/data/cms.js', (req, res) => {
  res.type('application/javascript').setHeader('Cache-Control', 'no-cache');
  res.send(cms.clientScript());
});

app.use('/api', api);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ─── Trang ──────────────────────────────────────────────────────────────────
// canon = đường dẫn chuẩn của trang (thẻ canonical cho Google); ld = dữ liệu có cấu trúc
const page = (file, canon, ld) => (req, res) => sendPage(req, res, path.join(PUB, file), 200, canon ? seoHead(req, canon, ld && ld(req)) : '');
app.get('/', page('index.html', '/', gymLd));
// trang sản phẩm: tiêu đề, mô tả, ảnh chia sẻ theo đúng sản phẩm (Google, Facebook, Zalo đọc được)
app.get('/shop/:slug', (req, res, next) => {
  const list = api.publicProducts(), want = req.params.slug;
  const p = list.find(x => api.productSlug(x) === want || x.id === want);
  if (!p) {
    if (want === 'checkout') return next();
    // đường dẫn cũ (đổi tên / đổi đường dẫn sản phẩm) → chuyển hẳn sang đường dẫn mới
    const old = list.find(x => (x.oldSlugs || []).includes(want) || api.slugify(x.name) === want);
    if (old) return res.redirect(301, '/shop/' + api.productSlug(old));
    // link sản phẩm sai / đã ngừng bán: báo 404 (Google bỏ link), trang Shop hiện thông báo
    const html = cms.transform('shop.html', fs.readFileSync(path.join(PUB, 'shop.html'), 'utf8'))
      .replace('</head>', '<meta name="robots" content="noindex"><script>window.__DC_NOTFOUND=1</script></head>');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(404).type('html').send(html);
  }
  const file = path.join(PUB, 'shop.html'), canon = '/shop/' + api.productSlug(p);
  let html = cms.transform('shop.html', fs.readFileSync(file, 'utf8'));
  const rawDesc = p.seoDesc || ((p.desc && p.desc.vi) || '').slice(0, 300);
  const title = attr(p.seoTitle || p.name + ' — Dapper Combat'), desc = attr(rawDesc);
  // dữ liệu sản phẩm cho Google (giá, còn hàng, ảnh)
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.id, description: rawDesc,
    image: [p.img].concat(p.images || []).filter(Boolean).map(u => abs(req, u)),
    brand: { '@type': 'Brand', name: 'Dapper Combat' },
    offers: { '@type': 'Offer', url: baseUrl(req) + canon, priceCurrency: 'VND', price: p.price, availability: 'https://schema.org/' + (p.stock > 0 ? 'InStock' : 'OutOfStock') },
  };
  if (p.reviews > 0 && p.rating > 0) ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews };
  html = html.replace(/(<title[^>]*>)[^<]*(<\/title>)/, `$1${title}$2`)
    .replace(/(property="og:title" content=")[^"]*"/, `$1${title}"`)
    .replace(/(<meta[^>]*name="description" content=")[^"]*"/, `$1${desc}"`)
    .replace(/(property="og:description" content=")[^"]*"/, `$1${desc}"`)
    .replace(/(property="og:image" content=")[^"]*"/, `$1${attr(abs(req, p.img))}"`)
    .replace('</head>', seoHead(req, canon, ld) + '</head>');
  res.setHeader('Cache-Control', 'no-cache');
  res.type('html').send(html);
});
// trang thanh toán: không cho Google lập chỉ mục (trùng nội dung /shop)
app.get('/shop/checkout', (req, res) => {
  const html = cms.transform('shop.html', fs.readFileSync(path.join(PUB, 'shop.html'), 'utf8')).replace('</head>', '<meta name="robots" content="noindex"></head>');
  res.setHeader('Cache-Control', 'no-cache');
  res.type('html').send(html);
});
app.get('/shop', page('shop.html', '/shop'));
app.get('/shop/*', page('shop.html'));
app.get('/khoa-hoc', page('khoa-hoc.html', '/khoa-hoc'));
app.get('/dich-vu-setup', page('dich-vu-setup.html', '/dich-vu-setup'));
app.get('/admin', page('admin/index.html'));
// bảng xếp hạng CLB (kiểu BoxRec): /xep-hang · /vo-si · /vo-si/<võ sĩ> · /su-kien · /su-kien/<sự kiện> — chung khuôn public/xep-hang.html
function rankPage(req, res, canon, title, desc, status = 200) {
  let html = fs.readFileSync(path.join(PUB, 'xep-hang.html'), 'utf8');
  if (title) html = html.replace(/<title>[^<]*<\/title>/, `<title>${attr(title)} — Dapper Combat</title>`).replace('<meta property="og:type"', `<meta property="og:title" content="${attr(title)}"><meta property="og:type"`);
  if (desc) html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(desc)}"><meta property="og:description" content="${attr(desc)}">`);
  html = html.replace('</head>', (status === 200 ? seoHead(req, canon) : '<meta name="robots" content="noindex">') + '</head>');
  res.setHeader('Cache-Control', 'no-cache');
  res.status(status).type('html').send(html);
}
app.get('/xep-hang', (req, res) => rankPage(req, res, '/xep-hang', 'Ranking võ sĩ', 'Bảng xếp hạng nội bộ CLB Dapper Combat: điểm, sao, hạng và thành tích từng võ sĩ nam, nữ theo hạng cân.'));
app.get('/vo-si', (req, res) => rankPage(req, res, '/vo-si', 'Thông tin võ sĩ', 'Danh sách võ sĩ CLB Dapper Combat: thành tích, điểm xếp hạng, hạng cân và hồ sơ chi tiết.'));
app.get('/su-kien', (req, res) => rankPage(req, res, '/su-kien', 'Lịch sự kiện', 'Lịch fight night, sparring và kỳ đánh giá kỹ năng của CLB Dapper Combat, kèm kết quả từng trận.'));
app.get('/vo-si/:slug', (req, res) => {
  const f = ranking.publicData().fighters.find(x => x.slug === String(req.params.slug).toLowerCase());
  if (!f) return rankPage(req, res, '', 'Không tìm thấy võ sĩ', '', 404);
  const r = f.record;
  rankPage(req, res, '/vo-si/' + f.slug, f.name + (f.nickname ? ` “${f.nickname}”` : ''),
    `${f.name}: thành tích ${r.w}-${r.l}-${r.d} (${r.ko} KO), ${f.points} điểm xếp hạng` + (f.rank && f.rank.div ? `, hạng ${f.rank.div}/${f.rank.divOf} ${(ranking.DIVISIONS.find(d => d.id === f.division) || {}).vi || ''}` : '') + ' — CLB Dapper Combat.');
});
app.get('/su-kien/:slug', (req, res) => {
  const e = ranking.publicData().events.find(x => x.slug === String(req.params.slug).toLowerCase());
  if (!e) return rankPage(req, res, '', 'Không tìm thấy sự kiện', '', 404);
  rankPage(req, res, '/su-kien/' + e.slug, e.name.vi, (e.desc.vi || e.name.vi) + ' — ' + e.date.split('-').reverse().join('/') + ', ' + [e.venue, e.city].filter(Boolean).join(', '));
});
// phiếu xác nhận cho khách: /phieu/<mã đơn>?k=<khóa> (dữ liệu lấy qua /api/slip, cần đúng khóa)
app.get('/phieu/:code', page('phieu.html'));
// trang phụ tạo trong /admin → Trang phụ
const pages = require('./lib/pages');
app.get('/trang/:slug', (req, res) => {
  const p = pages.bySlug(String(req.params.slug).toLowerCase());
  if (!p) return sendPage(req, res, path.join(PUB, '404.html'), 404);
  const body = cms.transform(`trang/${p.slug}.html`, pages.render(p)).replace('</head>', seoHead(req, '/trang/' + p.slug) + '</head>');
  res.setHeader('Cache-Control', 'no-cache');
  res.type('html').send(body);
});

app.use((req, res) => sendPage(req, res, path.join(PUB, '404.html'), 404));

// lỗi: không lộ chi tiết máy chủ cho khách (chi tiết ghi vào log)
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[lỗi]', req.method, req.originalUrl, err.stack || err);
  if (res.headersSent) return next(err);
  if (req.path.startsWith('/api/')) return res.status(status).json({ error: status === 413 ? 'Dữ liệu gửi lên quá lớn' : status < 500 ? 'Yêu cầu không hợp lệ' : 'Lỗi máy chủ, vui lòng thử lại' });
  if (status < 500) return sendPage(req, res, path.join(PUB, '404.html'), 404);
  res.status(500).type('html').send('<!doctype html><meta charset="utf-8"><title>Lỗi máy chủ</title><p style="font-family:sans-serif;padding:24px">Có lỗi xảy ra, vui lòng thử lại sau. <a href="/">Về trang chủ</a></p>');
});
process.on('unhandledRejection', e => console.error('[lỗi chưa xử lý]', e));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🥊  DAPPER COMBAT  →  http://localhost:${PORT}`);
  console.log(`⚙️   Quản trị      →  http://localhost:${PORT}/admin`);
  console.log('     Lần đầu: đăng nhập bằng tài khoản mặc định (xem README) — hệ thống sẽ bắt đổi mật khẩu\n');
});
