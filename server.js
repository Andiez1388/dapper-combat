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

// nén gzip cho chữ (HTML, CSS, JS, JSON, SVG, XML): nhẹ hơn ~70%, mở nhanh hơn trên điện thoại (điểm tốc độ Google)
// ảnh / video đã nén sẵn → bỏ qua; bản nén của file tĩnh giữ trong bộ nhớ theo ETag
const zlib = require('zlib');
const ZIP_TYPE = /^(text\/|application\/(javascript|json|xml|ld\+json|manifest\+json)|image\/svg\+xml)/;
const zipCache = new Map();
app.use((req, res, next) => {
  if (req.method === 'HEAD' || !/\bgzip\b/.test(req.headers['accept-encoding'] || '') || /^\/assets\/(media|uploads)\//.test(req.path)) return next();
  const end = res.end.bind(res), chunks = [];
  const buf = (c, enc) => (c == null || typeof c === 'function' ? null : Buffer.isBuffer(c) ? c : Buffer.from(c, typeof enc === 'string' ? enc : 'utf8'));
  res.write = (c, enc) => { const b = buf(c, enc); if (b) chunks.push(b); return true; };
  res.end = (c, enc) => {
    const b = buf(c, enc); if (b) chunks.push(b);
    let body = Buffer.concat(chunks);
    if (res.headersSent) return end(body);
    const vary = String(res.getHeader('Vary') || '');
    if (!/accept-encoding|\*/i.test(vary)) res.setHeader('Vary', vary ? vary + ', Accept-Encoding' : 'Accept-Encoding');
    if (body.length > 1024 && ZIP_TYPE.test(String(res.getHeader('Content-Type') || '')) && !res.getHeader('Content-Encoding') && res.statusCode !== 206) {
      const tag = res.getHeader('ETag'), key = tag && req.path + '|' + tag;
      body = (key && zipCache.get(key)) || zlib.gzipSync(body, { level: 6 });
      if (key) { if (zipCache.size > 300) zipCache.clear(); zipCache.set(key, body); }
      res.setHeader('Content-Encoding', 'gzip');
    }
    if (res.statusCode !== 304) res.setHeader('Content-Length', body.length);
    return end(body);
  };
  next();
});

// ─── Chế độ riêng tư (/admin → Thương hiệu & menu) ───────────────────────────
// Bật: khách (và Google) chỉ thấy trang "Sắp ra mắt". Trình duyệt đã mở trang quản trị có vé xem trước (routes/api.js) → xem như bình thường.
// Luôn mở: trang quản trị, API (đăng nhập, cổng thanh toán báo về), CSS / JS / ảnh (trang quản trị và trang "Sắp ra mắt" cần).
const OPEN_WHEN_PRIVATE = /^\/(admin(\/|$)|api\/|assets\/(css|js|img|media|uploads|fonts)\/|img\/|favicon)/;
const escAttr = v => String(v || '').replace(/[&"<>]/g, c => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[c]));
function comingSoon() {
  const b = settings.all().brand, logo = b.logo ? `<img src="${escAttr(b.logo)}" alt="Dapper Combat">` : '<p class="w">DAPPER COMBAT</p>';
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Dapper Combat — Sắp ra mắt</title>${b.favicon ? `<link rel="icon" href="${escAttr(b.favicon)}">` : ''}
<style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#0b0b0b;color:#f2f2f2;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:24px;box-sizing:border-box}
img{max-height:64px;max-width:80vw;margin-bottom:28px}.w{font-weight:800;letter-spacing:.18em;font-size:clamp(22px,5vw,34px);margin:0 0 24px}
h1{font-size:clamp(28px,6vw,48px);margin:0 0 12px;letter-spacing:.04em}h1 span{color:#d6312b}p.s{color:#9a9a9a;margin:0;line-height:1.6}</style></head>
<body><main>${logo}<h1>SẮP <span>RA MẮT</span></h1><p class="s">Website đang được hoàn thiện, hẹn gặp bạn sớm.<br>Coming soon — we're getting ready.</p></main></body></html>`;
}
app.use((req, res, next) => {
  if (!settings.isPrivate() || OPEN_WHEN_PRIVATE.test(req.path) || api.canPreview(req)) return next();
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-store');
  if (req.path === '/robots.txt') return res.type('text/plain').send('User-agent: *\nDisallow: /\n');
  res.status(503).setHeader('Retry-After', '86400');
  res.type('html').send(comingSoon());
});

// đường dẫn cũ / gõ tắt
const moved = { '/index.html': '/', '/shop.html': '/shop', '/khoa-hoc.html': '/khoa-hoc', '/courses': '/khoa-hoc', '/course': '/khoa-hoc',
  '/dich-vu-setup.html': '/dich-vu-setup', '/setup': '/dich-vu-setup', '/dich-vu': '/dich-vu-setup', '/admin.html': '/admin', '/checkout': '/shop/checkout',
  '/xep-hang.html': '/xep-hang', '/ranking': '/xep-hang', '/rankings': '/xep-hang', '/bang-xep-hang': '/xep-hang', '/fighters': '/vo-si', '/events': '/su-kien', '/lich-su-kien': '/su-kien',
  '/truyen-nghe.html': '/truyen-nghe', '/dao-tao': '/truyen-nghe', '/day-nghe': '/truyen-nghe', '/pro': '/truyen-nghe' };
app.get(Object.keys(moved), (req, res) => res.redirect(301, moved[req.path]));
app.get('/trang.html', (req, res) => sendPage(req, res, path.join(PUB, '404.html'), 404)); // khuôn trang phụ: không phục vụ trực tiếp

// Trang + CSS/JS của trang: áp nội dung tùy chỉnh từ /admin (chữ, ảnh/video, màu, liên hệ) trước khi gửi
// head = thẻ thêm vào <head> (link chuẩn cho Google, dữ liệu có cấu trúc) · edit = sửa thêm trên HTML (vd tiêu đề tab)
// Gắn mã phiên bản vào CSS / JS trong trang (/assets/js/site.js?v=…): hosting có thể trả file tĩnh không kèm Cache-Control
// → trình duyệt tự giữ bản cũ nhiều ngày sau khi cập nhật. Mã = dấu thời gian sửa file → file đổi thì đường dẫn đổi, tải bản mới.
const assetVer = new Map();
function versioned(html) {
  return html.replace(/((?:src|href)=")(\/assets\/(?:js|css)\/[\w.-]+\.(?:js|css))"/g, (m, a, url) => {
    let st;
    try { st = fs.statSync(path.join(PUB, url)); } catch { return m; }
    // file được điền nội dung sửa trong /admin (cms.transformable) → đổi mã khi nội dung đổi
    const key = url + '|' + st.mtimeMs + '|' + st.size + (cms.transformable(url.slice(1)) ? '|' + cms.version() : '');
    if (!assetVer.has(key)) assetVer.set(key, crypto.createHash('sha1').update(key).digest('hex').slice(0, 10));
    return a + url + '?v=' + assetVer.get(key) + '"';
  });
}
function sendPage(req, res, file, status = 200, head = '', edit = null) {
  const rel = path.relative(PUB, file).split(path.sep).join('/');
  const raw = fs.readFileSync(file, 'utf8');
  let body = cms.transformable(rel) ? cms.transform(rel, raw) : raw;
  if (edit) body = edit(body);
  if (head) body = body.replace('</head>', () => head + '</head>');
  if (rel.endsWith('.html')) body = versioned(absOg(req, body));
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
// ld = 1 khối hoặc mảng khối dữ liệu có cấu trúc
function seoHead(req, pathName, ld) {
  const url = attr(baseUrl(req) + pathName);
  return `<link rel="canonical" href="${url}"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary_large_image">` + [].concat(ld || []).map(ldJson).join('');
}
// đường dẫn trang trên Google (BreadcrumbList): [[tên, đường dẫn], …] sau "Trang chủ"
const crumbs = (req, items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [['Trang chủ', '/']].concat(items).map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: baseUrl(req) + u })) });
const ORG = req => ({ '@type': 'Organization', name: 'Dapper Combat', url: baseUrl(req) + '/' });
// ảnh chia sẻ mặc định (Facebook, Zalo): ảnh chia sẻ của Trang chủ (/admin → Hình ảnh → Trang chủ → SEO)
const shareImg = () => cms.mediaUrl('home.seo.og');
const okImg = u => (u && !/\.svg(\?|$)/i.test(u) ? u : '');   // Facebook không đọc ảnh SVG
// og:image dạng /assets/… → đường dẫn đầy đủ (Facebook, Zalo chỉ đọc đường dẫn đầy đủ)
const absOg = (req, html) => html.replace(/(<meta [^>]*property="og:image" content=")(\/[^"]*")/g, (m, a, u) => a + attr(baseUrl(req)) + u);
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
  const urls = ['/', '/shop', '/khoa-hoc', '/dich-vu-setup', '/truyen-nghe', '/xep-hang', '/vo-si', '/su-kien']
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
// Dapper Combat Academy Ranking: đã tính điểm, thứ hạng, thành tích (lib/ranking.js)
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
  // mô tả Google: "Mô tả SEO" của sản phẩm, không có thì mô tả sản phẩm (ngắn quá thì thêm giá — Google hiện ~150 ký tự)
  const pd = ((p.desc && p.desc.vi) || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  const rawDesc = p.seoDesc || (pd.length < 110 ? (pd ? pd.replace(/[.!…]?$/, '.') + ' ' : '') + `Giá ${Number(p.price || 0).toLocaleString('vi-VN')}₫, mua online tại Dapper Combat.` : pd);
  const title = attr(p.seoTitle || p.name + ' — Dapper Combat'), desc = attr(rawDesc);
  // dữ liệu sản phẩm cho Google (giá, còn hàng, ảnh)
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.id, description: rawDesc,
    image: [p.img].concat(p.images || []).filter(Boolean).map(u => abs(req, u)),
    brand: { '@type': 'Brand', name: 'Dapper Combat' },
    offers: { '@type': 'Offer', url: baseUrl(req) + canon, priceCurrency: 'VND', price: p.price, availability: 'https://schema.org/' + (p.stock > 0 ? 'InStock' : 'OutOfStock') },
  };
  if (p.reviews > 0 && p.rating > 0) ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews };
  // hàm thay thế (không dùng chuỗi): tên / mô tả có $' $& không làm hỏng trang
  const img = attr(abs(req, p.img)), head = seoHead(req, canon, [ld, crumbs(req, [['Cửa hàng', '/shop'], [p.name, canon]])]);
  html = html.replace(/(<title[^>]*>)[^<]*(<\/title>)/, (m, a, b) => a + title + b)
    .replace(/(property="og:title" content=")[^"]*"/, (m, a) => a + title + '"')
    .replace(/(<meta[^>]*name="description" content=")[^"]*"/, (m, a) => a + desc + '"')
    .replace(/(property="og:description" content=")[^"]*"/, (m, a) => a + desc + '"')
    .replace(/(property="og:image" content=")[^"]*"/, (m, a) => a + img + '"')
    .replace('</head>', () => head + '</head>');
  res.setHeader('Cache-Control', 'no-cache');
  res.type('html').send(versioned(html));
});
// trang thanh toán: không cho Google lập chỉ mục (trùng nội dung /shop)
app.get('/shop/checkout', (req, res) => {
  const html = absOg(req, cms.transform('shop.html', fs.readFileSync(path.join(PUB, 'shop.html'), 'utf8')).replace('</head>', '<meta name="robots" content="noindex"></head>'));
  res.setHeader('Cache-Control', 'no-cache');
  res.type('html').send(versioned(html));
});
app.get('/shop', page('shop.html', '/shop', req => [crumbs(req, [['Cửa hàng', '/shop']]), { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Cửa hàng Dapper Combat',
  itemListElement: api.publicProducts().map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: baseUrl(req) + '/shop/' + api.productSlug(p) })) }]));
app.get('/shop/*', page('shop.html'));
app.get('/khoa-hoc', page('khoa-hoc.html', '/khoa-hoc', req => crumbs(req, [['Khóa học', '/khoa-hoc']])));
app.get('/dich-vu-setup', page('dich-vu-setup.html', '/dich-vu-setup', req => [crumbs(req, [['Dịch vụ Setup', '/dich-vu-setup']]),
  { '@context': 'https://schema.org', '@type': 'Service', name: 'Dịch vụ setup phòng tập Boxing', serviceType: 'Setup phòng tập Boxing', provider: ORG(req), url: baseUrl(req) + '/dich-vu-setup' }]));
// Truyền Nghề: đào tạo coach / võ sĩ từ con số 0 (khóa 1 năm, học phí + ngày khai giảng ở /admin → Thiết lập → Học phí & lịch tập)
// tiêu đề tab + mô tả Google: /admin → Nội dung website → Truyền Nghề → SEO
const seoText = (html, title, desc) => html.replace(/<title>[^<]*<\/title>/, m => (title ? `<title>${attr(title)}</title>` : m))
  .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g, (m, a) => (desc ? a + attr(desc) : m));
// 2 khóa cho Google (Course): tên, nội dung, đầu ra (chữ sửa ở /admin), học phí + ngày khai giảng (Thiết lập)
function careerLd(req) {
  const c = settings.all().course;
  const course = (k, price) => ({ '@context': 'https://schema.org', '@type': 'Course', name: 'Truyền Nghề — Khóa ' + cms.textVi('career.data.path.' + k + '.name'),
    description: cms.textVi('career.data.path.' + k + '.content') + '. ' + cms.textVi('career.data.path.' + k + '.out') + '.', provider: ORG(req), url: baseUrl(req) + '/truyen-nghe',
    offers: { '@type': 'Offer', category: 'Paid', price, priceCurrency: 'VND' }, hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Onsite', ...(c.careerStart ? { startDate: c.careerStart } : {}) } });
  return [crumbs(req, [['Truyền Nghề', '/truyen-nghe']]), course('coach', c.careerPriceCoach), course('fighter', c.careerPriceFighter)];
}
app.get('/truyen-nghe', (req, res) => sendPage(req, res, path.join(PUB, 'truyen-nghe.html'), 200, seoHead(req, '/truyen-nghe', careerLd(req)),
  html => seoText(html, cms.textVi('career.title'), cms.textVi('career.seo.desc'))
    .replace(/(<meta property="og:image" content=")[^"]*/, (m, a) => a + attr(cms.mediaUrl('career.hero.coach')))));
// logo tải ở /admin → Thương hiệu & menu: thay biểu tượng DC + chữ "Dapper Combat" ở màn đăng nhập, thanh trên, menu trái
const ADMIN_BRAND = /<svg class="brand__mark" aria-hidden="true"><use href="#dcMark"\/><\/svg>\s*<span class="brand__word">Dapper Combat<\/span>/g;
app.get('/admin', (req, res) => {
  const logo = settings.all().brand.logo;
  sendPage(req, res, path.join(PUB, 'admin/index.html'), 200, '',
    logo ? html => html.replace(ADMIN_BRAND, () => `<img class="brand__logo" src="${escAttr(logo)}" alt="Dapper Combat">`) : null);
});
// Dapper Combat Academy Ranking (kiểu BoxRec): /xep-hang · /vo-si · /vo-si/<võ sĩ> · /su-kien · /su-kien/<sự kiện> · /so-sanh — chung khuôn public/xep-hang.html
// ld = dữ liệu có cấu trúc cho Google (võ sĩ: Person, sự kiện: SportsEvent)
// img = ảnh chia sẻ (ảnh võ sĩ / poster sự kiện), không có thì ảnh chia sẻ mặc định
function rankPage(req, res, canon, title, desc, status = 200, ld = null, img = '') {
  let html = cms.transform('xep-hang.html', fs.readFileSync(path.join(PUB, 'xep-hang.html'), 'utf8'));
  html = html.replace('<meta property="og:type"', () => `<meta property="og:image" content="${attr(abs(req, okImg(img) || shareImg()))}"><meta property="og:type"`);
  if (title) html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${attr(title)} — Dapper Combat Academy Ranking</title>`).replace('<meta property="og:type"', () => `<meta property="og:title" content="${attr(title)}"><meta property="og:type"`);
  if (desc) html = html.replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${attr(desc)}"><meta property="og:description" content="${attr(desc)}">`);
  const sh = status === 200 ? seoHead(req, canon, ld) : '<meta name="robots" content="noindex">';
  html = html.replace('</head>', () => sh + '</head>');
  res.setHeader('Cache-Control', 'no-cache');
  res.status(status).type('html').send(html);
}
const ACADEMY = { '@type': 'SportsOrganization', name: 'Dapper Combat Academy', sport: 'Boxing' };
// tiêu đề tab + mô tả Google sửa ở /admin → Nội dung website → Academy Ranking (mặc định trong lib/rank-seo.js)
const RANK_HOME = ['Academy Ranking', '/xep-hang'];
for (const p of require('./lib/rank-seo').PAGES) app.get(p.path, (req, res) => {
  const title = cms.textVi('ranking.' + p.id + '.title', p.title);
  rankPage(req, res, p.path, title, cms.textVi('ranking.seo.' + p.id + '.desc', p.desc), 200, crumbs(req, p.id === 'rank' ? [RANK_HOME] : [RANK_HOME, [title, p.path]]));
});
// phiếu thông tin võ sĩ in ra giấy (A4, 2 trang): mục A1–A6 / B1–B3 khớp form /admin → Academy Ranking → Võ sĩ
app.get('/phieu-vo-si', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.sendFile(path.join(PUB, 'phieu-vo-si.html'));
});
// /vo-si/_ · /su-kien/_ = võ sĩ / sự kiện đầu tiên đang có ("Xem trên trang" trong /admin → Nội dung website)
const firstOf = (req, res, base, x) => res.redirect(302, x ? base + x.slug + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '') : base.slice(0, -1));
app.get('/vo-si/_', (req, res) => firstOf(req, res, '/vo-si/', ranking.publicData().fighters[0]));
app.get('/su-kien/_', (req, res) => { const ev = ranking.publicData().events; firstOf(req, res, '/su-kien/', ev.find(e => (e.bouts || []).length) || ev[0]); });
app.get('/vo-si/:slug', (req, res) => {
  const f = ranking.publicData().fighters.find(x => x.slug === String(req.params.slug).toLowerCase());
  if (!f) return rankPage(req, res, '', 'Không tìm thấy võ sĩ', '', 404);
  const r = f.record;
  rankPage(req, res, '/vo-si/' + f.slug, f.name + (f.nickname ? ` “${f.nickname}”` : ''),
    `${f.name}: thành tích ${r.w}-${r.l}-${r.d} (${r.ko} KO), ${f.points} điểm xếp hạng` + (f.rank && f.rank.div ? `, hạng ${f.rank.div}/${f.rank.divOf} ${(ranking.divisions().find(d => d.id === f.division) || {}).vi || ''}` : '') + ' — Dapper Combat Academy Ranking.',
    200, [crumbs(req, [RANK_HOME, ['Thông tin võ sĩ', '/vo-si'], [f.name, '/vo-si/' + f.slug]]), { '@context': 'https://schema.org', '@type': 'Person', name: f.name, ...(f.nickname ? { alternateName: f.nickname } : {}), gender: f.gender === 'f' ? 'Female' : 'Male',
      ...(f.height ? { height: f.height + ' cm' } : {}), ...(f.weight ? { weight: f.weight + ' kg' } : {}), ...(f.photo && !/.svg$/.test(f.photo) ? { image: abs(req, f.photo) } : {}), url: baseUrl(req) + '/vo-si/' + f.slug, memberOf: ACADEMY }], f.photo);
});
app.get('/su-kien/:slug', (req, res) => {
  const e = ranking.publicData().events.find(x => x.slug === String(req.params.slug).toLowerCase());
  if (!e) return rankPage(req, res, '', 'Không tìm thấy sự kiện', '', 404);
  rankPage(req, res, '/su-kien/' + e.slug, e.name.vi, (e.desc.vi || e.name.vi) + ' — ' + e.date.split('-').reverse().join('/') + ', ' + [e.venue, e.city].filter(Boolean).join(', '), 200, [crumbs(req, [RANK_HOME, ['Lịch sự kiện', '/su-kien'], [e.name.vi, '/su-kien/' + e.slug]]), {
    '@context': 'https://schema.org', '@type': 'SportsEvent', name: e.name.vi, startDate: e.date + (e.time ? 'T' + e.time + ':00+07:00' : ''), sport: 'Boxing', url: baseUrl(req) + '/su-kien/' + e.slug,
    eventStatus: 'https://schema.org/EventScheduled', organizer: ACADEMY, ...(e.desc.vi ? { description: e.desc.vi } : {}),
    ...(e.venue || e.city ? { location: { '@type': 'Place', name: e.venue || e.city, address: e.city || '' } } : {}) }], e.poster);
});
// phiếu xác nhận cho khách: /phieu/<mã đơn>?k=<khóa> (dữ liệu lấy qua /api/slip, cần đúng khóa)
app.get('/phieu/:code', page('phieu.html'));
// trang phụ tạo trong /admin → Trang phụ
const pages = require('./lib/pages');
app.get('/trang/:slug', (req, res) => {
  const p = pages.bySlug(String(req.params.slug).toLowerCase());
  if (!p) return sendPage(req, res, path.join(PUB, '404.html'), 404);
  const body = cms.transform(`trang/${p.slug}.html`, pages.render(p)).replace('</head>', () => seoHead(req, '/trang/' + p.slug) + '</head>');
  res.setHeader('Cache-Control', 'no-cache');
  res.type('html').send(versioned(body));
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
