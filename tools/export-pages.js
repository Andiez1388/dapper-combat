/*
 * Xuất 4 trang thiết kế v3 (bản build 1 file HTML có nhúng ảnh/video base64) thành website trong public/:
 *   - ảnh/video base64 → public/assets/media/<mã băm>.<đuôi>
 *   - <style> → public/assets/css/<trang>.css, <script> lớn → public/assets/js/<trang>-<n>.js (giữ đúng vị trí chạy)
 *   - link artifact claude.ai → đường dẫn thật (/, /shop, /khoa-hoc, /dich-vu-setup)
 *   - vá các điểm nối với backend (đặt hàng, đăng ký khóa học, tư vấn setup, nhận tin, giỏ hàng dùng chung)
 *   - data/seed/products.json lấy từ danh mục sản phẩm của trang Shop
 *
 * Dùng: node tools/export-pages.js <thư mục chứa dapper-home-v3.html, dapper-shop-v3.html, dapper-course-v3.html, dapper-services-v3.html>
 * Sau lần xuất đầu, public/ là mã nguồn chính; chỉ chạy lại khi cần dựng lại từ bản thiết kế.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const SRC = process.argv[2];
if (!SRC) { console.error('Thiếu thư mục nguồn'); process.exit(1); }
const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const DIRS = { media: path.join(PUB, 'assets', 'media'), css: path.join(PUB, 'assets', 'css'), js: path.join(PUB, 'assets', 'js') };
Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));

const ART = { RXEZDnazJtdSPpZsAaASbP: '/', '528Rb2tBWUM8Qiw9Xd5L5E': '/shop', T2NgpX7c7yHpwXiVxiDbKw: '/khoa-hoc', EaQfupWHs9sjnBhvnGmFpN: '/dich-vu-setup' };
const sha = (b, n = 10) => crypto.createHash('sha1').update(b).digest('hex').slice(0, n);
function must(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }
function rep(s, a, b, label, all = false) {
  must(s.includes(a), label);
  return all ? s.split(a).join(b) : s.replace(a, () => b);
}

// khung mặc định mà trình xem artifact bọc quanh mỗi trang — giữ lại để giao diện y như bản đã duyệt
const SKELETON_CSS = ':root{color-scheme:light;box-sizing:border-box}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}\n';

const EXT = { jpeg: 'jpg', jpg: 'jpg', png: 'png', webp: 'webp', gif: 'gif', 'svg+xml': 'svg', mp4: 'mp4', webm: 'webm', quicktime: 'mov' };
let mediaBytes = 0, mediaFiles = new Set();
function extractMedia(s) {
  return s.replace(/data:(image|video)\/([a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g, (m, kind, sub, b64) => {
    const buf = Buffer.from(b64, 'base64');
    const name = sha(buf, 12) + '.' + (EXT[sub] || sub);
    const file = path.join(DIRS.media, name);
    if (!mediaFiles.has(name)) { mediaFiles.add(name); mediaBytes += buf.length; if (!fs.existsSync(file)) fs.writeFileSync(file, buf); }
    return '/assets/media/' + name;
  });
}

function rewriteLinks(s) {
  for (const [id, url] of Object.entries(ART)) s = s.split('https://claude.ai/artifact/' + id).join(url);
  // link nội bộ mở cùng tab
  s = s.replace(/<a\b[^>]*>/g, tag => {
    const href = (tag.match(/\bhref="([^"]*)"/) || [])[1] || '';
    if (!href.startsWith('/') && !href.startsWith('#')) return tag;
    return tag.replace(/\s+target="_blank"/, '').replace(/\s+rel="noopener(?: noreferrer)?"/, '');
  });
  // menu dùng chung (mnav): trang nội bộ không mở tab mới
  s = s.split(`'href="'+p.url+'" target="_blank" rel="noopener"'`).join(`'href="'+p.url+'"'`);
  s = s.split(`'<a class="mn-cta" href="'+MNAV.course+'" target="_blank" rel="noopener">'`).join(`'<a class="mn-cta" href="'+MNAV.course+'">'`);
  s = s.split(`'<li><a href="'+MNAV.services+'" target="_blank" rel="noopener"></a></li>'`).join(`'<li><a href="'+MNAV.services+'"></a></li>'`);
  return s;
}

// tìm dấu ] đóng mảng bắt đầu tại `start` (bỏ qua chuỗi)
function arrayEnd(s, start) {
  let depth = 0, q = null;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '[' || c === '{' || c === '(') depth++;
    else if (c === ']' || c === '}' || c === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function head(meta) {
  return [
    `<title>${meta.title}</title>`,
    `<meta name="description" content="${meta.desc}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Dapper Combat">`,
    `<meta property="og:title" content="${meta.title}">`,
    `<meta property="og:description" content="${meta.desc}">`,
    `<meta name="theme-color" content="#0b0b0b">`,
    `<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">`,
  ].join('\n');
}

const PAGES = [
  { src: 'dapper-home-v3.html', out: 'index.html', key: 'home', products: true,
    title: 'Dapper Combat — Boxing &amp; Fight Lifestyle tại Sài Gòn',
    desc: 'Dapper Combat — lớp Boxing bài bản, gear &amp; apparel cho võ sĩ, dịch vụ setup phòng tập Boxing tại TP. Hồ Chí Minh.' },
  { src: 'dapper-shop-v3.html', out: 'shop.html', key: 'shop', products: true,
    title: 'Shop — Dapper Combat',
    desc: 'Găng tay Boxing, áo, hoodie và phụ kiện tập luyện Dapper Combat. Giao toàn quốc, miễn phí vận chuyển đơn từ 1.000.000₫.' },
  { src: 'dapper-course-v3.html', out: 'khoa-hoc.html', key: 'course',
    title: 'Khóa học Boxing — Dapper Combat',
    desc: 'Chương trình Boxing tại Dapper Combat: Foundation 12 tuần, Group Training, lớp HSSV, Membership và PT 1-1. Học thử miễn phí cho học viên mới.' },
  { src: 'dapper-services-v3.html', out: 'dich-vu-setup.html', key: 'services',
    title: 'Dịch vụ setup phòng tập Boxing — Dapper Combat',
    desc: 'Tư vấn thiết kế, cung cấp thiết bị và setup trọn gói phòng tập Boxing. Khảo sát miễn phí trong TP.HCM, thi công toàn quốc.' },
];

// vá riêng từng trang (mỗi chuỗi phải khớp đúng 1 chỗ trong bản thiết kế)
const PATCH = {
  home(s) {
    s = rep(s, '<a href="#" class="nav-logo">', '<a href="/" class="nav-logo">', 'home logo');
    return s;
  },
  shop(s) {
    // bản Shop đọc lại từ artifact còn khung bọc ngoài → lấy tài liệu bên trong
    const inner = s.indexOf('<!doctype html>\n<html lang="vi">');
    must(inner > 0, 'shop inner doc');
    s = s.slice(inner, s.indexOf('</html>', inner) + 7);
    s = rep(s, '<a href="#" class="nav-logo" id="homeLogo">', '<a href="/" class="nav-logo" id="homeLogo">', 'shop logo');
    s = rep(s, '$("homeLogo").onclick=e=>{e.preventDefault();showView("shop");};', '', 'shop logo click');
    // danh mục sản phẩm: dùng dữ liệu từ server (quản lý ở /admin), bản nhúng làm dự phòng
    const ps = s.indexOf('const PRODUCTS=[');
    must(ps > 0, 'PRODUCTS');
    const pe = arrayEnd(s, ps + 'const PRODUCTS='.length);
    must(pe > 0 && s[pe + 1] === ';', 'PRODUCTS end');
    s = s.slice(0, pe + 1) + ')' + s.slice(pe + 1);
    s = s.replace('const PRODUCTS=[', 'const PRODUCTS=DCProducts([');
    // đặt hàng: gửi đơn lên server thay cho hiệu ứng chờ giả
    s = rep(s, 'setTimeout(function(){V3U.ok=true;po.click();V3U.busy=false;po.classList.remove("v3-busy");v3uBtn();},900);',
      'DCshopSubmit(function(){V3U.ok=true;po.click();V3U.busy=false;po.classList.remove("v3-busy");v3uBtn();},function(){V3U.busy=false;po.classList.remove("v3-busy");v3uBtn();});', 'place order delay');
    s = rep(s, 'const oid="#DC-"+Math.floor(100000+Math.random()*900000);', 'const oid=(window.DC_LAST_ORDER&&DC_LAST_ORDER.code)||("#DC-"+Math.floor(100000+Math.random()*900000));', 'order id');
    s = rep(s, 'const total=Math.max(0,subtotal()-discountAmt())+shipFinal();var ex=$("okExtra");', 'const total=(window.DC_LAST_ORDER&&DC_LAST_ORDER.total)||(Math.max(0,subtotal()-discountAmt())+shipFinal());var ex=$("okExtra");', 'order total');
    s = rep(s, 'total:Math.max(0,sub-disc)+shf,count:count(),', 'total:(window.DC_LAST_ORDER&&DC_LAST_ORDER.total)||(Math.max(0,sub-disc)+shf),count:count(),', 'v3ok total');
    // nhận tin
    s = rep(s, 'if(e.target&&e.target.id==="v3NewsForm"){e.preventDefault();', 'if(e.target&&e.target.id==="v3NewsForm"){e.preventDefault();DC.subscribe((e.target.querySelector("input")||{}).value,"shop");', 'newsletter');
    return s;
  },
  course(s) {
    s = rep(s, '<a href="#" class="nav-logo">', '<a href="/" class="nav-logo">', 'course logo');
    s = rep(s, 'window.open(CV3_SHOP,"_blank","noopener")', 'location.href=CV3_SHOP', 'course cart');
    // đăng ký: gửi lên server rồi mới hiện bước "Xác nhận"
    const fn = s.indexOf('function cv3Submit(){');
    must(fn > 0, 'cv3Submit');
    const end = s.indexOf('CV3.step=3;cv3Render();', fn);
    must(end > 0 && end - fn < 2000, 'cv3Submit step');
    s = s.slice(0, end) + 'DCcourseSubmit();' + s.slice(end + 'CV3.step=3;cv3Render();'.length);
    return s;
  },
  services(s) {
    s = rep(s, '<a href="#" class="nav-logo">', '<a href="/" class="nav-logo">', 'services logo');
    s = rep(s, 'F.done={id:"#DC-SVC-"+Math.floor(10000+Math.random()*90000),name,phone:$("fPhone").value.trim()};\n  rContact();go("contact");',
      'DCsvcSubmit(name);', 'services submit');
    return s;
  },
};

let seedProducts = null;
for (const pg of PAGES) {
  let s = fs.readFileSync(path.join(SRC, pg.src), 'utf8');
  s = PATCH[pg.key](s);
  s = extractMedia(s);
  s = rewriteLinks(s);
  must(!s.includes('claude.ai/artifact'), pg.key + ': còn link artifact');

  // danh mục sản phẩm gốc → seed cho server
  if (pg.key === 'shop') {
    const imgStmt = s.match(/const IMG=\{[^}]*\};/)[0];
    const ps = s.indexOf('const PRODUCTS=DCProducts(');
    const pe = arrayEnd(s, ps + 'const PRODUCTS=DCProducts('.length);
    const arr = s.slice(ps + 'const PRODUCTS=DCProducts('.length, pe + 1);
    const ctx = {};
    vm.runInNewContext(imgStmt.replace('const IMG', 'IMG') + '\nPRODUCTS=' + arr + ';', ctx);
    seedProducts = ctx.PRODUCTS.map(p => ({ ...p, img: ctx.IMG[p.img] || p.img, visible: true }));
  }

  // <head>: tiêu đề, mô tả, favicon
  s = s.replace(/<title>[^<]*<\/title>\s*/, '');
  s = s.replace(/<meta name="description"[^>]*>\s*/, '');
  s = s.replace(/<head>/i, '<head>');
  const headEnd = s.indexOf('<head>') + 6;
  must(headEnd > 6, pg.key + ' head');
  const metaAt = s.indexOf('\n', s.indexOf('<meta name="viewport"', headEnd)) + 1;
  s = s.slice(0, metaAt) + head(pg) + '\n' + s.slice(metaAt);

  // CSS: gom mọi <style> (theo đúng thứ tự) thành 1 file
  const styles = [];
  s = s.replace(/<style[^>]*>([\s\S]*?)<\/style>\s*/g, (m, css) => { styles.push(css); return styles.length === 1 ? '%%CSS%%' : ''; });
  must(styles.length, pg.key + ' styles');
  const css = SKELETON_CSS + styles.join('\n');
  const cssName = pg.key + '.css';
  fs.writeFileSync(path.join(DIRS.css, cssName), css);
  s = s.replace('%%CSS%%', `<link rel="stylesheet" href="/assets/css/${cssName}?v=${sha(css, 8)}">\n<link rel="stylesheet" href="/assets/css/site.css">\n`);

  // JS: script lớn ra file riêng, giữ nguyên vị trí (thứ tự chạy không đổi)
  let n = 0;
  s = s.replace(/<script>([\s\S]*?)<\/script>/g, (m, js) => {
    if (js.length < 1500) return m;
    n++;
    const name = `${pg.key}-${n}.js`;
    fs.writeFileSync(path.join(DIRS.js, name), js);
    return `<script src="/assets/js/${name}?v=${sha(js, 8)}"></script>`;
  });

  // lớp nối với website: site.js trong <head>, dữ liệu sản phẩm trước script đầu tiên, <trang>-site.js cuối <body>
  s = s.replace('</head>', '<script src="/assets/js/site.js"></script>\n<script src="/assets/data/cms.js"></script>\n</head>');
  if (pg.products) {
    const first = s.indexOf('<script', s.indexOf('<body'));
    s = s.slice(0, first) + '<script src="/assets/data/products.js"></script>\n' + s.slice(first);
  }
  const bodyEnd = s.lastIndexOf('</body>');
  s = s.slice(0, bodyEnd) + `<script src="/assets/js/${pg.key}-site.js"></script>\n` + s.slice(bodyEnd);

  fs.writeFileSync(path.join(PUB, pg.out), s);
  console.log(`${pg.out.padEnd(20)} ${(Buffer.byteLength(s) / 1024).toFixed(0)}KB html, ${(css.length / 1024).toFixed(0)}KB css, ${n} js`);
}

fs.mkdirSync(path.join(ROOT, 'data', 'seed'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'seed', 'products.json'), JSON.stringify(seedProducts, null, 2));
console.log(`media: ${mediaFiles.size} file, ${(mediaBytes / 1048576).toFixed(1)}MB · seed: ${seedProducts.length} sản phẩm`);
