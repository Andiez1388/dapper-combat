/*
 * Dựng danh mục nội dung cho trang quản trị (data/seed/cms-catalog.json):
 *   - gắn khóa data-cms="…" cho từng tiêu đề / đoạn văn / nút trong HTML, data-cms-sec cho từng khu vực
 *   - bọc chữ song ngữ trong JS bằng DC.x("khóa", 0|1, "mặc định") để quản trị sửa được (0 = VI, 1 = EN)
 *   - liệt kê ảnh/video theo trang + khu vực
 * Chạy lại an toàn: chỗ đã gắn khóa sẽ được giữ nguyên khóa cũ.
 *   node tools/cms-build.js
 */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const { parseDocument, DomUtils } = require('htmlparser2');

const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const JS = f => path.join(PUB, 'assets', 'js', f);
const OUT = path.join(ROOT, 'data', 'seed', 'cms-catalog.json');

/* ─── Trang, khu vực ─────────────────────────────────────────────────────── */
const PAGES = [
  { id: 'home', label: 'Trang chủ', url: '/', html: 'index.html', js: ['home-1.js', 'home-3.js', 'home-site.js'], css: 'home.css', callees: ['T'] },
  { id: 'shop', label: 'Shop', url: '/shop', html: 'shop.html', js: ['shop-1.js'], css: 'shop.css', callees: ['v3T', 'T'], dict: 'T' },
  { id: 'course', label: 'Khóa học', url: '/khoa-hoc', html: 'khoa-hoc.html', js: ['course-1.js', 'course-site.js'], css: 'course.css', callees: ['cv3T', 'T'], dict: 'T' },
  { id: 'services', label: 'Dịch vụ Setup', url: '/dich-vu-setup', html: 'dich-vu-setup.html', js: ['services-1.js', 'services-site.js'], css: 'services.css', callees: ['T'] },
];

// khu vực trong HTML: [selector đơn giản (tag / .class / #id), id, nhãn] — theo thứ tự trên trang
const HTML_SECTIONS = {
  home: [
    ['.ticker-band', 'ticker', 'Dải chữ chạy trên cùng'], ['nav.nav', 'nav', 'Menu trên cùng'],
    ['.hero', 'hero', 'Đầu trang — video & tiêu đề lớn'], ['.philo', 'philo', 'Triết lý'],
    ['.instructor', 'instructor', 'Huấn luyện viên'], ['.courses', 'courses', 'Khóa học'],
    ['.vbanner', 'vbanner', 'Băng video'], ['.imgbanner', 'imgbanner', 'Băng ảnh lớn'],
    ['.shop', 'shop', 'Sản phẩm nổi bật'], ['.community', 'community', 'Cộng đồng'],
    ['.reviews', 'reviews', 'Đánh giá của học viên'], ['.cta-banner', 'cta', 'Kêu gọi đăng ký (cuối trang)'],
    ['.locate', 'locate', 'Địa chỉ phòng tập & cửa hàng'], ['footer', 'footer', 'Chân trang'],
  ],
  shop: [
    ['nav.nav', 'nav', 'Menu trên cùng'], ['.shop-hero', 'list', 'Trang danh sách sản phẩm'], ['.filters', 'list', 'Trang danh sách sản phẩm'],
    ['#detailView', 'pdp', 'Trang chi tiết sản phẩm'], ['#checkoutView', 'checkout', 'Trang thanh toán'],
    ['#cart', 'cart', 'Giỏ hàng (ngăn bên phải)'], ['#success', 'success', 'Màn hình đặt hàng thành công'], ['footer', 'footer', 'Chân trang'],
  ],
  course: [
    ['nav.nav', 'nav', 'Menu trên cùng'], ['.phero', 'hero', 'Đầu trang'], ['.stats-band', 'hero', 'Đầu trang'],
    ['.fbanner', 'fbanner', 'Foundation — giới thiệu'], ['.fdetail', 'fdetail', 'Foundation — chi tiết khóa'],
    ['.approach', 'approach', 'Cách chúng tôi dạy'], ['.story', 'story', 'Câu chuyện'], ['.why', 'why', 'Vì sao chọn Dapper Combat'],
    ['.cvideo', 'cvideo', 'Băng video'], ['.programs', 'programs', 'Danh sách chương trình'], ['section:nth(gallery)', 'gallery', 'Không gian (ảnh)'],
    ['.compare', 'pricing', 'Học phí'], ['.schedule', 'schedule', 'Lịch tập'], ['.faq', 'faq', 'Hỏi đáp'],
    ['.regproc', 'regproc', 'Quy trình đăng ký'], ['.infogrid-sec', 'info', 'Thông tin cần biết'], ['.cta', 'cta', 'Kêu gọi đăng ký (cuối trang)'],
    ['footer', 'footer', 'Chân trang'],
  ],
  services: [
    ['nav.nav', 'nav', 'Menu trên cùng'], ['.hero', 'hero', 'Đầu trang'], ['#snav', 'snav', 'Thanh mục lục'],
    ['#services', 'services', '3 dịch vụ'], ['#why', 'why', 'Vì sao chọn Dapper Combat'], ['#fit', 'fit', 'Phù hợp cho ai'],
    ['#packages', 'packages', 'Gói thiết bị tham khảo'], ['#catalog', 'catalog', 'Danh mục thiết bị'], ['#process', 'process', 'Quy trình'],
    ['#cta', 'cta', 'Dải liên hệ giữa trang'], ['#gallery', 'gallery', 'Không gian (ảnh)'], ['#faq', 'faq', 'Hỏi đáp'],
    ['#contact', 'contact', 'Form nhận tư vấn'], ['footer', 'footer', 'Chân trang'],
  ],
};
// khu vực cho chữ nằm trong JS: theo tên hàm / biến bao quanh
const JS_SECTIONS = {
  home: [[/^catName$|^homeBadge$/, 'shop', 'Sản phẩm nổi bật'], [/^cartLabels$|^colorName$/, 'cart', 'Giỏ hàng (ngăn bên phải)'], [/^openStatus$/, 'locate', 'Địa chỉ phòng tập & cửa hàng']],
  shop: [
    [/^SPEC$/, 'pdp', 'Trang chi tiết sản phẩm'],
    [/^v3Static$|^v3Rev|^v3Reviews|^v3Render$|^v3Media|^v3uPDP|^v3uSeen|^mediaOf|^renderDetail/, 'pdp', 'Trang chi tiết sản phẩm'],
    [/^v3Sg|^V3SG/, 'sizeguide', 'Bảng size'],
    [/^v3l|^v3RenderGrid|^v3RenderColl|^v3RenderFilter|^v3F|^V3L/, 'list', 'Trang danh sách sản phẩm'],
    [/^v3p|^v3uMsum|^v3uBtn|^v3uPrefill|^v3uLabels|^dcPayName/, 'checkout', 'Trang thanh toán'],
    [/^v3ok/, 'success', 'Màn hình đặt hàng thành công'],
  ],
  course: [
    [/^cv3Labels$|^cv3Sticky/, 'sticky', 'Thông báo đầu trang & thanh giữ chỗ'],
    [/^cuxLabels$|^CUX_SECS$/, 'secnav', 'Thanh mục lục & nút đầu trang'],
    [/^cfinLabels$/, 'regproc', 'Quy trình đăng ký'], [/^cfinSched$/, 'schedule', 'Lịch tập'],
    [/^cv3|^CV3_P$|^CV3|^DCcourseSubmit$/, 'drawer', 'Form đăng ký (ngăn bên phải)'],
  ],
  services: [
    [/^rStatic$/, 'top', 'Thông báo đầu trang & thanh liên hệ'], [/^rHero$/, 'hero', 'Đầu trang'], [/^rSnav$|^SECS$/, 'snav', 'Thanh mục lục'],
    [/^rServices$/, 'services', '3 dịch vụ'], [/^rWhy$/, 'why', 'Vì sao chọn Dapper Combat'], [/^rFit$/, 'fit', 'Phù hợp cho ai'],
    [/^rPackages$/, 'packages', 'Gói thiết bị tham khảo'], [/^rCatalog$/, 'catalog', 'Danh mục thiết bị'], [/^rProcess$/, 'process', 'Quy trình'],
    [/^rCta$/, 'cta', 'Dải liên hệ giữa trang'], [/^rGallery$/, 'gallery', 'Không gian (ảnh)'], [/^rFaq$/, 'faq', 'Hỏi đáp'],
    [/^rContact$|^submitForm$|^prefillPkg$|^chips$|^DCsvcSubmit$/, 'contact', 'Form nhận tư vấn'], [/^rFoot$/, 'footer', 'Chân trang'],
  ],
};
// khóa từ điển (Shop/Khóa học) → khu vực khi không tìm thấy phần tử HTML tương ứng
const DICT_SECTIONS = {
  shop: { nav: 'nav', shop: 'list', cat: 'list', card: 'list', crumb: 'pdp', detail: 'pdp', spec: 'pdp', ship: 'pdp', trust: 'checkout', cart: 'cart', sum: 'checkout', checkout: 'checkout', f: 'checkout', pay: 'checkout', ok: 'success', footer: 'footer', col: 'pdp', rv: 'pdp', seo: 'pdp', feat: 'pdp', promo: 'checkout', step: 'checkout' },
  course: {},
};
const EXTRA_SECTIONS = {
  shop: [['sizeguide', 'Bảng size']],
  course: [['sticky', 'Thông báo đầu trang & thanh giữ chỗ'], ['secnav', 'Thanh mục lục & nút đầu trang'], ['drawer', 'Form đăng ký (ngăn bên phải)']],
  services: [['top', 'Thông báo đầu trang & thanh liên hệ']],
};
// tên gọi cho các loại chữ
const TYPES = {
  title: 'Tiêu đề', subtitle: 'Tiêu đề nhỏ', eyebrow: 'Nhãn nhỏ trên tiêu đề', text: 'Đoạn văn', button: 'Nút / liên kết',
  item: 'Mục danh sách', quote: 'Câu trích dẫn', label: 'Chữ ngắn / nhãn', stat: 'Số liệu', question: 'Câu hỏi', answer: 'Câu trả lời', seo: 'SEO',
};

/* ─── Danh mục ───────────────────────────────────────────────────────────── */
const catalog = { version: 1, pages: [{ id: 'global', label: 'Chung (mọi trang)', url: '/' }].concat(PAGES.map(p => ({ id: p.id, label: p.label, url: p.url }))), sections: [], fields: [], media: [] };
const fieldByKey = new Map();
const usedStrings = new Set(); // khóa từ điển còn được dùng (data-i18n trong HTML, chuỗi trong JS)
const secOrder = {};
function section(page, id, label) {
  const full = page + '.' + id;
  if (!catalog.sections.find(s => s.id === full)) {
    secOrder[page] = (secOrder[page] || 0) + 1;
    catalog.sections.push({ id: full, page, label, order: secOrder[page] });
  }
  return full;
}
section('global', 'mnav', 'Menu điện thoại (dùng chung mọi trang)');
for (const p of PAGES) section(p.id, 'seo', 'SEO — tiêu đề tab & mô tả trên Google');

// Chạy lại trên mã đã gắn khóa: giữ khóa cũ + thông tin đã đo (nhãn, khu vực, kích thước ảnh) từ danh mục trước
const INCREMENTAL = PAGES.some(p => fs.readFileSync(path.join(PUB, p.html), 'utf8').includes('data-cms='));
const PREV = INCREMENTAL && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
const prevF = new Map(((PREV && PREV.fields) || []).map(f => [f.key, f]));
const prevM = new Map(((PREV && PREV.media) || []).map(m => [m.key, m]));
const taken = new Set([...prevF.keys(), ...prevM.keys()]);
function prevSection(id) { // đăng ký lại khu vực của danh mục trước
  const s = PREV && PREV.sections.find(x => x.id === id);
  if (!s) return null;
  return section(s.page, id.slice(s.page.length + 1), s.label);
}

function addField(f) {
  const old = fieldByKey.get(f.key);
  if (old) { for (const k of ['vi', 'en']) if (old[k] == null && f[k] != null) old[k] = f[k]; old.html = old.html || f.html; return old; }
  fieldByKey.set(f.key, f); catalog.fields.push(f); return f;
}
const decodeEnt = s => String(s || '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
function classify(tag, cls, text, dictKey) {
  tag = (tag || '').toLowerCase(); cls = cls || ''; const t = (text || '').replace(/<[^>]+>/g, '');
  if (dictKey) {
    if (/(^|\.)q\d*$/.test(dictKey)) return 'question';
    if (/(^|\.)a\d+$/.test(dictKey) && /faq/.test(dictKey)) return 'answer';
    if (/(^|\.)(h|h\d|title|headline)$/.test(dictKey)) return 'title';
    if (/(^|\.)(eyebrow|tag|kicker)$/.test(dictKey)) return 'eyebrow';
    if (/cta|btn|(^|\.)b\d$/.test(dictKey)) return 'button';
    if (/(^|\.)(name)$/.test(dictKey)) return 'subtitle';
    if (/(^|\.)(p\d*|sub|desc|lead|intro|note|txt|text|body|quote)$/.test(dictKey)) return /quote/.test(dictKey) ? 'quote' : 'text';
  }
  if (tag === 'h1' || tag === 'h2') return 'title';
  if (/^h[3-6]$/.test(tag)) return 'subtitle';
  if (tag === 'summary') return 'question';
  if (tag === 'blockquote' || /quote/.test(cls)) return 'quote';
  if (tag === 'li') return 'item';
  if (tag === 'a' || tag === 'button' || /btn|cta/.test(cls)) return 'button';
  if (/eyebrow|kicker|(^|[\s-])tag\b|label|-lab\b/.test(cls)) return 'eyebrow';
  if (/(^|[\s-])(n|num|val|stat-num|stat)\b/.test(cls) && t.length < 12) return 'stat';
  if (tag === 'p' || /lead|desc|sub|(^|-)p\b|text|note|bio|intro/.test(cls)) return 'text';
  if (/(^|-)h\b|title|name|head/.test(cls)) return 'subtitle';
  return t.length > 90 ? 'text' : 'label';
}

/* ─── HTML: gắn khóa ─────────────────────────────────────────────────────── */
const INLINE = new Set(['em', 'br', 'b', 'strong', 'i', 'span', 'small', 's', 'u', 'sup', 'sub', 'mark', 'del']);
const SKIP_TAGS = new Set(['script', 'style', 'svg', 'noscript', 'template', 'select', 'option', 'textarea']);
const SKIP_IN = {
  home: ['.product-card', '#cartDrawer', '.mobile-nav-overlay', '.float-social', '.lang-switch', '.nav-cart'],
  shop: ['.lang-switch', '#cart .cart-items', '#cartItems'],
  course: ['.lang-switch', '.nav-cart'],
  services: ['.lang-switch'],
};
function matches(el, sel) {
  if (!el || el.type !== 'tag') return false;
  if (sel.startsWith('#')) return el.attribs.id === sel.slice(1);
  if (sel.startsWith('.')) return (' ' + (el.attribs.class || '') + ' ').includes(' ' + sel.slice(1) + ' ');
  if (sel.includes('.')) { const [t, c] = sel.split('.'); return el.name === t && matches(el, '.' + c); }
  return el.name === sel;
}
function matchesSel(el, sel) { // hỗ trợ "#cart .cart-items"
  const parts = sel.split(' ');
  if (!matches(el, parts[parts.length - 1])) return false;
  if (parts.length === 1) return true;
  for (let p = el.parent; p; p = p.parent) if (matches(p, parts[0])) return true;
  return false;
}
function isTextBlock(el) {
  let direct = false, ok = true;
  (function chk(n, top) {
    for (const c of n.children || []) {
      if (c.type === 'text') { if (top && /[\p{L}\p{N}]/u.test(c.data)) direct = true; continue; }
      if (c.type !== 'tag') continue;
      if (!INLINE.has(c.name) || c.attribs.id || c.attribs['data-i18n']) { ok = false; return; }
      chk(c, false);
    }
  })(el, true);
  if (!direct) { // chỉ có 1 thẻ nội dòng chứa chữ (vd <p><em>ABC</em></p>) vẫn tính là 1 khối
    const kids = (el.children || []).filter(c => c.type === 'tag' && c.name !== 'br');
    direct = ok && kids.length === 1 && /[\p{L}\p{N}]/u.test(DomUtils.textContent(el));
  }
  return ok && direct;
}
// thẻ lặp lại gần nhất bao quanh (vd 3 thẻ giá) → { id, i }
function groupOf(el, root) {
  for (let p = el.parent; p && p !== root && p.parent; p = p.parent) {
    if (p.type !== 'tag') continue;
    const sig = c => c.type === 'tag' && c.name === p.name && (c.attribs.class || '') === (p.attribs.class || '');
    const sibs = p.parent.children.filter(sig);
    if (sibs.length >= 2) return { id: p.startIndex, i: sibs.indexOf(p) + 1 };
  }
  return null;
}

function annotateHtml(page) {
  const file = path.join(PUB, page.html);
  let src = fs.readFileSync(file, 'utf8');
  const doc = parseDocument(src, { withStartIndices: true, withEndIndices: true, decodeEntities: false });
  const inserts = []; // [vị trí chèn, chuỗi]
  const secs = HTML_SECTIONS[page.id];
  const sectionOf = new Map();
  // khu vực
  const body = DomUtils.findOne(e => e.name === 'body', doc.children);
  let gallerySeen = false;
  DomUtils.findAll(e => true, body.children).forEach(el => {
    for (const [sel, id, label] of secs) {
      let hit = sel === 'section:nth(gallery)' ? (el.name === 'section' && !el.attribs.class && !gallerySeen && el.parent === body && DomUtils.textContent(el).includes('LÊN SÀN')) : matches(el, sel);
      if (sel === 'section:nth(gallery)' && hit) gallerySeen = true;
      if (hit && !sectionOf.has(el)) {
        const sid = section(page.id, id, label);
        sectionOf.set(el, sid);
        if (!el.attribs['data-cms-sec']) inserts.push([el.startIndex + 1 + el.name.length, ` data-cms-sec="${sid}"`]);
        break;
      }
    }
  });
  const secFor = el => { for (let p = el; p; p = p.parent) if (sectionOf.has(p)) return sectionOf.get(p); return null; };
  const skipped = el => {
    for (let p = el; p; p = p.parent) { if (p.type === 'tag' && SKIP_TAGS.has(p.name)) return true; if (SKIP_IN[page.id].some(s => matchesSel(p, s))) return true; }
    return false;
  };
  // SEO
  const title = DomUtils.findOne(e => e.name === 'title', doc.children);
  const desc = DomUtils.findOne(e => e.name === 'meta' && e.attribs.name === 'description', doc.children);
  const ogt = DomUtils.findOne(e => e.name === 'meta' && e.attribs.property === 'og:title', doc.children);
  const ogd = DomUtils.findOne(e => e.name === 'meta' && e.attribs.property === 'og:description', doc.children);
  const seoSec = page.id + '.seo';
  const tag = (el, key, attr) => {
    if (!el || el.attribs['data-cms']) return;
    inserts.push([el.startIndex + 1 + el.name.length, ` data-cms="${key}"` + (attr ? ` data-cms-attr="${attr}"` : '')]);
  };
  if (title) { tag(title, page.id + '.seo.title'); addField({ key: page.id + '.seo.title', page: page.id, section: seoSec, type: 'seo', label: 'Tiêu đề tab trình duyệt / kết quả Google', vi: decodeEnt(DomUtils.textContent(title)), en: null, html: false, src: 'html', locate: false }); }
  if (desc) { tag(desc, page.id + '.seo.desc', 'content'); addField({ key: page.id + '.seo.desc', page: page.id, section: seoSec, type: 'seo', label: 'Mô tả ngắn trên Google (~150 ký tự)', vi: decodeEnt(desc.attribs.content), en: null, html: false, src: 'html', locate: false }); }
  tag(ogt, page.id + '.seo.title', 'content'); tag(ogd, page.id + '.seo.desc', 'content');

  // chữ
  const counter = {};
  DomUtils.findAll(e => true, body.children).forEach(el => {
    if (skipped(el) || !secFor(el) || !isTextBlock(el)) return;
    const plain = DomUtils.textContent(el);
    if (/^[^\p{L}\p{N}]*$/u.test(plain)) return;                                                          // chỉ có ký hiệu
    if (/^\s*\d{1,2}\s*$/.test(plain) && !/stat/.test((el.parent && el.parent.attribs.class) || '')) return; // số thứ tự bước (giữ số liệu thống kê)
    // bỏ qua nếu phần tử cha đã là khối chữ (tránh gắn lồng nhau)
    for (let p = el.parent; p && p !== body; p = p.parent) if (p.type === 'tag' && p._cms) return;
    let key = el.attribs['data-cms'];
    const i18n = el.attribs['data-i18n'];
    if (i18n) usedStrings.add(i18n);
    const sid = secFor(el);
    if (!key) {
      if (i18n && (page.id === 'course' || page.id === 'shop')) key = page.id + '.' + i18n;
      else { do { counter[sid] = (counter[sid] || 0) + 1; key = sid + '.' + counter[sid]; } while (fieldByKey.has(key) || taken.has(key) || src.includes(`data-cms="${key}"`)); }
      inserts.push([el.startIndex + 1 + el.name.length, ` data-cms="${key}"`]);
    }
    el._cms = true;
    let root = null; for (let p = el; p; p = p.parent) if (sectionOf.has(p)) { root = p; break; }
    const grp = groupOf(el, root);
    const inner = src.slice(el.children[0].startIndex, el.children[el.children.length - 1].endIndex + 1).trim();
    addField({ key, page: page.id, section: sid, type: classify(el.name, el.attribs.class, inner, i18n), vi: inner, en: null, html: /<[a-z]/i.test(inner), src: 'html', locate: true, order: el.startIndex, grp: grp ? 'h' + grp.id : undefined, gi: grp ? grp.i : undefined });
  });
  // ảnh / video: mỗi vị trí trên trang một khóa riêng (cùng 1 file dùng ở 2 chỗ vẫn thay riêng được)
  const mediaN = {};
  DomUtils.findAll(e => e.name === 'img' || e.name === 'video' || e.name === 'source', body.children).forEach(el => {
    if (skipped(el) || /position:\s*absolute/.test(el.attribs.style || '')) return; // ô bản đồ, ảnh trong thẻ sản phẩm…
    const sid = secFor(el) || section(page.id, 'other', 'Thông báo nhỏ & chữ khác');
    for (const [attr, marker] of [['src', 'data-cms-media'], ['poster', 'data-cms-poster']]) {
      const url = el.attribs[attr] || '';
      if (!/^\/assets\/(media|uploads)\//.test(url)) continue;
      let key = el.attribs[marker];
      if (!key) {
        do { mediaN[sid] = (mediaN[sid] || 0) + 1; key = sid + '.m' + mediaN[sid]; } while (taken.has(key) || src.includes(`="${key}"`));
        inserts.push([el.startIndex + 1 + el.name.length, ` ${marker}="${key}"`]);
      }
      const kind = attr === 'poster' || el.name === 'img' ? 'image' : 'video';
      catalog.media.push({ key, page: page.id, section: sid, kind, url, attr, alt: el.attribs.alt || '', poster: attr === 'poster' || undefined, src: 'html', order: el.startIndex });
    }
  });
  inserts.sort((a, b) => b[0] - a[0]).forEach(([at, s]) => { src = src.slice(0, at) + s + src.slice(at); });
  fs.writeFileSync(file, src);
  return inserts.length;
}

/* ─── JS: bọc chữ song ngữ ───────────────────────────────────────────────── */
const SKIP_NAMES = /^(CV3_KEEP|IMG|IMGS|AV|VIDS|IMGKEYS|URLS|ICON|PRODUCTS|REVIEWS|PROMOS|IDMAP|DICT|V3_LIFE|MNAV)$/;
const isStr = n => n && ((n.type === 'Literal' && typeof n.value === 'string') || (n.type === 'TemplateLiteral' && n.expressions.length === 0));
const strVal = n => n.type === 'Literal' ? n.value : n.quasis[0].value.cooked;
const isDCx = n => n && n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && n.callee.object.name === 'DC' && n.callee.property.name === 'x';
// khóa trong danh sách đã bọc bởi tools/cms-structure.js: $k("khóa") / $k2($k("khóa"))
const unwrapKey = a => { while (a && a.type === 'CallExpression' && a.callee.type === 'Identifier' && /^\$k\d*$/.test(a.callee.name)) a = a.arguments[0]; return a; };
function pieces(arg) { // các chuỗi nối bằng + trong 1 đối số
  if (isStr(arg)) return [arg];
  if (arg.type === 'BinaryExpression' && arg.operator === '+') return pieces(arg.left).concat(pieces(arg.right));
  return [];
}
function pairOk(a, b) {
  const isPath = x => /^#|^https?:|^\/[\w.-]*\//.test(x);           // đường dẫn thật; "/ tháng" vẫn là chữ
  if (isPath(a) || isPath(b)) return false;
  if (/^[a-z0-9]+.[a-z0-9.]+$/i.test(a) || /^[a-z0-9]+.[a-z0-9.]+$/i.test(b)) return false; // khóa từ điển như "feat.1"
  if (/^[a-z0-9_-]{1,10}$/.test(a)) return false;               // mã nội bộ: "s", "gym", "red"
  if (a !== b && a.toLowerCase() === b.toLowerCase()) return false;
  if (a.length <= 3 && b.length <= 3) return false;              // "S","M"…
  return /\p{L}/u.test(a) && /\p{L}/u.test(b);
}
// hàm nhận chữ song ngữ qua 2 tham số cuối
const PAIR_CALLS = ['v3lPromo'];
// thuộc tính trong dữ liệu thẻ → loại chữ
const PROP_TYPES = { n: 'subtitle', name: 'subtitle', title: 'subtitle', t: 'subtitle', h: 'subtitle', tier: 'subtitle',
  p: 'text', d: 'text', desc: 'text', sub: 'text', s: 'text', for: 'text', body: 'text', note: 'text',
  tag: 'eyebrow', badge: 'eyebrow', lab: 'label', label: 'label', q: 'question', a: 'answer', cta: 'button', btn: 'button' };
// hàng gần nhất (object/array nằm trong 1 mảng dữ liệu) → số thẻ
function rowOf(anc) {
  for (let i = anc.length - 2; i >= 1; i--) {
    const x = anc[i], px = anc[i - 1];
    if (/Function/.test(x.type)) break;
    if ((x.type === 'ObjectExpression' || x.type === 'ArrayExpression') && px.type === 'ArrayExpression' && px.elements.length >= 2)
      return { gi: px.elements.indexOf(x) + 1, grpStart: x.start };
  }
  return { gi: undefined, grpStart: undefined };
}
function ctxTag(src, at) { // thẻ HTML mở ngay trước đoạn chữ, vd '<h2 class="h2">'+T(...)
  const before = src.slice(Math.max(0, at - 260), at);
  const m = before.match(/<([a-z][a-z0-9]*)((?:\s[^<>]*)?)>\s*['"`]?\s*\+?\s*$/i) || before.match(/<([a-z][a-z0-9]*)((?:\s[^<>]*)?)>[^<>]*$/i);
  if (!m) return { tag: '', cls: '' };
  const cls = (m[2].match(/class=\\?["']([^"'\\]*)/) || [])[1] || '';
  return { tag: m[1], cls };
}

function transformJs(page, fileName) {
  const file = JS(fileName);
  let src = fs.readFileSync(file, 'utf8');
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
  const edits = []; // [start, end, replacement]
  const counter = {};
  let mnavN = 0;
  const dictObj = {}; // side → ObjectExpression của từ điển T.vi / T.en

  // tìm từ điển: const T={vi:{…},en:{…}} hoặc T={en:{…}}
  if (page.dict) walk.simple(ast, {
    VariableDeclarator(n) { if (n.id.name === page.dict && n.init && n.init.type === 'ObjectExpression') n.init.properties.forEach(p => { const k = p.key.name || p.key.value; if ((k === 'vi' || k === 'en') && p.value.type === 'ObjectExpression') dictObj[k] = p.value; }); },
    AssignmentExpression(n) { if (n.left.name === page.dict && n.right.type === 'ObjectExpression') n.right.properties.forEach(p => { const k = p.key.name || p.key.value; if ((k === 'vi' || k === 'en') && p.value.type === 'ObjectExpression') dictObj[k] = p.value; }); },
  });
  const dictNodes = new Set(Object.values(dictObj));

  const nameOf = anc => { // tên hàm bao quanh gần nhất; nếu nằm ngoài mọi hàm thì tên biến chứa nó
    let top = '';
    for (let i = anc.length - 1; i >= 0; i--) {
      const a = anc[i], p = anc[i - 1];
      if (a.type === 'FunctionDeclaration' && a.id) return a.id.name;
      if (/FunctionExpression|ArrowFunctionExpression/.test(a.type) && p) {
        if (p.type === 'VariableDeclarator' && p.id.name) return p.id.name;
        if (p.type === 'AssignmentExpression' && p.left.type === 'Identifier') return p.left.name;
        if (p.type === 'Property' && p.key) return p.key.name || p.key.value;
      }
      if (!top && a.type === 'VariableDeclarator' && a.id.name) top = a.id.name;
      if (!top && a.type === 'AssignmentExpression' && a.left.type === 'Identifier') top = a.left.name;
    }
    return top;
  };
  // chuỗi được dùng ngoài từ điển (để bỏ các khóa từ điển cũ không còn hiển thị)
  walk.fullAncestor(ast, (n, st, anc) => {
    if (anc.some(a => dictNodes.has(a))) return;
    if (isStr(n)) usedStrings.add(strVal(n));
    if (n.type === 'Property' && n.key && n.key.type === 'Literal') usedStrings.add(n.key.value);
  });
  const inMnav = anc => anc.some(a => /Function/.test(a.type) && a.body && a.body.body && a.body.body.some(s => s.type === 'VariableDeclaration' && s.declarations.some(d => d.id.name === 'PAGES')));
  const secFor = (anc, name) => {
    if (inMnav(anc)) return 'global.mnav';
    for (const [re, id, label] of JS_SECTIONS[page.id] || []) if (re.test(name)) return section(page.id, id, label);
    return section(page.id, 'other', 'Thông báo nhỏ & chữ khác');
  };
  const inSrc = k => src.includes(`DC.x(${JSON.stringify(k)},`) || src.includes(`$k(${JSON.stringify(k)})`);
  const keyFor = sec => {
    if (sec === 'global.mnav') { let k; do { k = 'global.mnav.' + (++mnavN); } while (taken.has(k) || inSrc(k)); return k; }
    let k;
    do { counter[sec] = (counter[sec] || 0) + 1; k = sec + '.j' + counter[sec]; } while (fieldByKey.has(k) || taken.has(k) || inSrc(k));
    return k;
  };
  const wrappedAt = new Set();
  const wrap = (lit, key, side) => { wrappedAt.add(lit.start); edits.push([lit.start, lit.end, `DC.x(${JSON.stringify(key)},${side},${src.slice(lit.start, lit.end)})`]); };
  const done = new Set();

  walk.ancestor(ast, {
    CallExpression(n, anc) {
      if (isDCx(n)) { // đã gắn khóa ở lần chạy trước: đưa lại vào danh mục
        const [k0, sd, def] = n.arguments, k = unwrapKey(k0);
        if (!k || k.type !== 'Literal' || !isStr(def)) return;
        const key = k.value, side = sd.value, val = strVal(def), p = prevF.get(key);
        const par = anc[anc.length - 2];
        const dk = par && par.type === 'Property' && dictNodes.has(anc[anc.length - 3]) ? (par.key.value || par.key.name) : undefined;
        const meta = p ? { page: p.page, section: prevSection(p.section) || p.section, type: p.type, label: p.label, html: p.html, src: p.src, locate: p.locate, hidden: p.hidden, order: p.order }
          : { page: page.id, section: section(page.id, 'other', 'Thông báo nhỏ & chữ khác'), type: classify('', '', val, dk), src: 'js', locate: false, html: /<[a-z]/i.test(val), order: n.start, dict: dk };
        addField({ ...meta, key, vi: side === 0 ? val : null, en: side === 1 ? val : null });
        if (p && p.src === 'html') { const f = fieldByKey.get(key); f.vi = p.vi; if (p.en != null) f.en = p.en; } // chữ hiển thị đã đo
        return;
      }
      if (n.callee.type !== 'Identifier' || !page.callees.includes(n.callee.name) || n.arguments.length !== 2) return;
      if (anc.some(a => a !== n && isDCx(a))) return;
      const [a, b] = n.arguments.map(pieces);
      if (!a.length || !b.length) return;
      const name = nameOf(anc.slice(0, -1));
      if (SKIP_NAMES.test(name)) return;
      const sec = secFor(anc, name);
      const ctx = ctxTag(src, n.start);
      // chữ trong dữ liệu thẻ (dịch vụ, gói, FAQ…): tên thuộc tính / vị trí → loại chữ; vị trí hàng → số thẻ
      const par = anc[anc.length - 2];
      const { gi, grpStart } = rowOf(anc);
      let posType = null;
      if (par && par.type === 'Property') posType = PROP_TYPES[par.key.name || par.key.value] || null;
      else if (par && par.type === 'ArrayExpression') {
        const gp = anc[anc.length - 3];
        const pk = gp && gp.type === 'Property' ? (gp.key.name || gp.key.value) : '';
        const calls = par.elements.filter(e => e && e.type === 'CallExpression');
        const pos = calls.indexOf(n);
        const faq = /^Q$|faq/i.test(name) || /faq/.test(sec);
        posType = /^(li|items|list|bullets)$/.test(pk) || calls.length >= 3 ? 'item' : pos === 0 ? (faq ? 'question' : 'subtitle') : (faq ? 'answer' : 'text');
      }
      const base = keyFor(sec);
      const join = a.length > 1 || b.length > 1;
      const nPairs = Math.max(a.length, b.length);
      for (let i = 0; i < nPairs; i++) {
        const key = join ? base + '.' + (i + 1) : base;
        const vi = a[i], en = b[i];
        if (vi) { wrap(vi, key, 0); done.add(vi); }
        if (en) { wrap(en, key, 1); done.add(en); }
        const v = vi ? strVal(vi) : null, e = en ? strVal(en) : null;
        addField({ key, fn: name, grp: gi ? 'j' + grpStart : undefined, gi, page: sec === 'global.mnav' ? 'global' : page.id, section: sec, type: join ? 'label' : (posType || classify(ctx.tag, ctx.cls, v || e)), vi: v, en: e, html: /<[a-z]/i.test((v || '') + (e || '')), src: 'js', locate: false, joined: join || undefined, order: n.start });
      }
    },
    ArrayExpression(n, anc) {
      if (!n.elements.every(isStr) || n.elements.some(x => done.has(x))) return;
      if (anc.some(a => a !== n && isDCx(a))) return;
      // [vi, en] hoặc [số lượng, vi, en] (danh sách thiết bị trong gói)
      const qty = n.elements.length === 3 && strVal(n.elements[0]).length <= 8 ? n.elements[0] : null;
      if (n.elements.length !== 2 && !qty) return;
      const [la, lb] = qty ? n.elements.slice(1) : n.elements;
      const [a, b] = [strVal(la), strVal(lb)];
      const name = nameOf(anc.slice(0, -1));
      if (SKIP_NAMES.test(name) || !pairOk(a, b)) return;
      const sec = secFor(anc, name);
      const { gi, grpStart } = rowOf(anc.slice(0, -1));
      const page2 = sec === 'global.mnav' ? 'global' : page.id;
      const key = keyFor(sec);
      if (qty) {
        wrap(qty, key + '.n', 0);
        addField({ key: key + '.n', fn: name, grp: gi ? 'j' + grpStart : undefined, gi, page: page2, section: sec, type: 'stat', vi: strVal(qty), en: null, mono: true, html: false, src: 'js', locate: false, order: n.start - 0.5 });
      }
      wrap(la, key, 0); wrap(lb, key, 1);
      addField({ key, fn: name, grp: gi ? 'j' + grpStart : undefined, gi, page: page2, section: sec, type: qty ? 'item' : classify('', '', a), vi: a, en: b, html: false, src: 'js', locate: false, order: n.start });
    },
    Property(n, anc) {
      const obj = anc[anc.length - 2];
      if (!dictNodes.has(obj) || !isStr(n.value)) return;
      const side = obj === dictObj.vi ? 0 : 1;
      const dk = n.key.value || n.key.name;
      const key = page.id + '.' + dk;
      wrap(n.value, key, side);
      const pre = dk.split('.')[0];
      const existing = fieldByKey.get(key);
      const sec = existing ? existing.section : section(page.id, DICT_SECTIONS[page.id][pre] || 'other', ({ nav: 'Menu trên cùng', list: 'Trang danh sách sản phẩm', pdp: 'Trang chi tiết sản phẩm', checkout: 'Trang thanh toán', cart: 'Giỏ hàng (ngăn bên phải)', success: 'Màn hình đặt hàng thành công', footer: 'Chân trang' })[DICT_SECTIONS[page.id][pre]] || 'Chữ khác trên trang');
      const f = addField({ key, dict: dk, page: page.id, section: sec, type: classify('', '', strVal(n.value), dk), vi: side === 0 ? strVal(n.value) : null, en: side === 1 ? strVal(n.value) : null, html: /<[a-z]/i.test(strVal(n.value)), src: existing ? existing.src : 'js', locate: existing ? existing.locate : false, order: existing ? existing.order : 1e7 + n.start });
      if (side === 1) f.en = strVal(n.value); // EN luôn lấy từ từ điển
      if (side === 0 && (!existing || page.id === 'shop')) f.vi = strVal(n.value); // Shop hiển thị VI từ từ điển
    },
  });
  // các dạng dữ liệu khác: {vi, en} · [vi, en, mô tả vi, mô tả en] · "vi|en" · ô số đo bảng size · chữ truyền qua tham số hàm
  const SG_CAT = { ao: 'Áo', dotap: 'Đồ tập', gang: 'Găng', phukien: 'Phụ kiện' };
  const headVi = h => h && h.type === 'ArrayExpression' ? (isStr(h.elements[0]) ? strVal(h.elements[0]) : isDCx(h.elements[0]) ? strVal(h.elements[0].arguments[2]) : '') : '';
  const free = lit => isStr(lit) && !wrappedAt.has(lit.start);
  const addPair = (la, lb, anc, name, type) => {
    const sec = secFor(anc, name), { gi, grpStart } = rowOf(anc), key = keyFor(sec);
    wrap(la, key, 0); wrap(lb, key, 1);
    addField({ key, fn: name, grp: gi ? 'j' + grpStart : undefined, gi, page: page.id, section: sec, type: type || classify('', '', strVal(la)), vi: strVal(la), en: strVal(lb), html: /<[a-z]/i.test(strVal(la)), src: 'js', locate: false, order: la.start });
  };
  walk.ancestor(ast, {
    ObjectExpression(n, anc) { // { vi: "…", en: "…" }
      const pv = n.properties.find(p => (p.key.name || p.key.value) === 'vi'), pe = n.properties.find(p => (p.key.name || p.key.value) === 'en');
      if (!pv || !pe || !free(pv.value) || !free(pe.value)) return;
      if (anc.some(a => a !== n && isDCx(a))) return;
      const name = nameOf(anc.slice(0, -1));
      if (SKIP_NAMES.test(name) || dictNodes.has(n)) return;
      addPair(pv.value, pe.value, anc, name, 'text');
    },
    ArrayExpression(n, anc) {
      if (anc.some(a => a !== n && isDCx(a))) return;
      const name = nameOf(anc.slice(0, -1));
      if (SKIP_NAMES.test(name)) return;
      const par = anc[anc.length - 2];
      // ô bảng size: mỗi ô sửa riêng (dùng chung cho 2 ngôn ngữ); ô dạng "vi|en" tách thành 2 ngôn ngữ
      if (name === 'V3SG' && par && par.type === 'ArrayExpression' && anc[anc.length - 3] && anc[anc.length - 3].type === 'Property' && (anc[anc.length - 3].key.name === 'rows')) {
        const catObj = anc[anc.length - 4], catProp = anc[anc.length - 5];
        const head = catObj && catObj.properties.find(p => p.key.name === 'head');
        const cat = SG_CAT[catProp && catProp.key && (catProp.key.name || catProp.key.value)] || '';
        const rowName = isStr(n.elements[0]) ? strVal(n.elements[0]) : '';
        n.elements.forEach((cell, j) => {
          if (!free(cell)) return;
          const v = strVal(cell), col = head ? headVi(head.value.elements[j]) : '';
          const sec = section(page.id, 'sizeguide', 'Bảng size');
          const label = `Bảng size ${cat} · ${j === 0 ? 'tên size' : rowName + ' · ' + col}`;
          const parts = v.split('|');
          if (parts.length === 2 && pairOk(parts[0], parts[1])) {
            const key = keyFor(sec);
            edits.push([cell.start, cell.end, `DC.x(${JSON.stringify(key)},0,${JSON.stringify(parts[0])})+"|"+DC.x(${JSON.stringify(key)},1,${JSON.stringify(parts[1])})`]); wrappedAt.add(cell.start);
            addField({ key, page: page.id, section: sec, type: 'text', label, vi: parts[0], en: parts[1], html: false, src: 'js', locate: false, order: cell.start });
          } else {
            const key = keyFor(sec);
            wrap(cell, key, 0);
            addField({ key, page: page.id, section: sec, type: 'stat', label, vi: v, en: null, mono: true, html: false, src: 'js', locate: false, order: cell.start });
          }
        });
        return;
      }
      // [tiêu đề vi, tiêu đề en, mô tả vi, mô tả en]
      if (n.elements.length === 4 && n.elements.every(free)) {
        const v = n.elements.map(strVal);
        if (pairOk(v[0], v[1]) && pairOk(v[2], v[3])) { addPair(n.elements[0], n.elements[1], anc, name, 'subtitle'); addPair(n.elements[2], n.elements[3], anc, name, 'text'); return; }
      }
      // chuỗi "vi|en" lẻ trong dữ liệu
      n.elements.forEach(el => {
        if (!free(el)) return;
        const parts = strVal(el).split('|');
        if (parts.length !== 2 || !pairOk(parts[0], parts[1]) || !/\s/.test(parts[0] + parts[1])) return;
        const sec = secFor(anc, name), key = keyFor(sec);
        edits.push([el.start, el.end, `DC.x(${JSON.stringify(key)},0,${JSON.stringify(parts[0])})+"|"+DC.x(${JSON.stringify(key)},1,${JSON.stringify(parts[1])})`]); wrappedAt.add(el.start);
        addField({ key, page: page.id, section: sec, type: 'label', vi: parts[0], en: parts[1], html: false, src: 'js', locate: false, order: el.start });
      });
    },
    CallExpression(n, anc) { // hàm nhận chữ qua tham số, vd v3lPromo("gang","gloves2","Găng tay thi đấu","Fight gloves")
      if (n.callee.type !== 'Identifier' || !PAIR_CALLS.includes(n.callee.name)) return;
      const a = n.arguments, la = a[a.length - 2], lb = a[a.length - 1];
      if (!free(la) || !free(lb) || !pairOk(strVal(la), strVal(lb))) return;
      addPair(la, lb, anc, nameOf(anc.slice(0, -1)), 'subtitle');
    },
  });

  // đường dẫn ảnh/video trong JS → DC.m("khóa", "mặc định") (trừ ảnh sản phẩm: quản lý ở mục Sản phẩm)
  walk.ancestor(ast, {
    Literal(n, anc) {
      if (typeof n.value !== 'string' || !/^\/assets\/(media|uploads)\/[\w.-]+$/.test(n.value)) return;
      const dcm = anc.find(a => a !== n && a.type === 'CallExpression' && a.callee.type === 'MemberExpression' && a.callee.object.name === 'DC' && a.callee.property.name === 'm');
      if (dcm) { // đã gắn khóa ở lần chạy trước
        const key = unwrapKey(dcm.arguments[0]).value;
        const p = prevM.get(key);
        catalog.media.push(p ? { ...p, url: n.value } : { key, page: page.id, section: null, kind: /\.(mp4|webm)$/.test(n.value) ? 'video' : 'image', url: n.value, alt: '', src: 'js', order: 1e8 + n.start });
        return;
      }
      if (anc.some(a => a !== n && a.type === 'CallExpression' && a.callee.type === 'MemberExpression' && a.callee.object.name === 'DC')) return;
      const name = nameOf(anc.slice(0, -1));
      if (/^(IMG|AV|IMGKEYS|PRODUCTS|REVIEWS|V3_LIFE)$/.test(name)) return;
      let key;
      do { mediaJsN[page.id] = (mediaJsN[page.id] || 0) + 1; key = page.id + '.js.m' + mediaJsN[page.id]; } while (taken.has(key) || src.includes(`DC.m(${JSON.stringify(key)},`));
      edits.push([n.start, n.end, `DC.m(${JSON.stringify(key)},${src.slice(n.start, n.end)})`]);
      catalog.media.push({ key, page: page.id, section: null, kind: /\.(mp4|webm)$/.test(n.value) ? 'video' : 'image', url: n.value, alt: '', src: 'js', order: 1e8 + n.start });
    },
  });
  edits.sort((x, y) => y[0] - x[0]).forEach(([s, e, r]) => { src = src.slice(0, s) + r + src.slice(e); });
  fs.writeFileSync(file, src);
  return edits.length;
}
const mediaJsN = {};

/* ─── Chạy ───────────────────────────────────────────────────────────────── */
for (const p of PAGES) {
  const nh = annotateHtml(p);
  (EXTRA_SECTIONS[p.id] || []).forEach(([id, label]) => section(p.id, id, label));
  let nj = 0;
  for (const f of p.js) nj += transformJs(p, f);
  console.log(`${p.id.padEnd(9)} html +${nh} chỗ gắn khóa, js ${nj} chuỗi được bọc`);
}

// lần chạy lại: giữ chữ hiển thị / nhãn / kích thước ảnh đã đo ở danh mục trước
for (const f of catalog.fields) {
  const p = prevF.get(f.key);
  if (!p) continue;
  if (p.src === 'html') { f.vi = p.vi; if (p.en != null) f.en = p.en; }
  f.label = p.label; if (p.hidden) f.hidden = true; if (p.mono) f.mono = true;
}
catalog.media = catalog.media.map(m => {
  const p = prevM.get(m.key);
  return p ? { ...p, url: m.url, order: m.order } : m;
});

// bỏ khóa từ điển cũ không còn hiển thị ở đâu (vẫn để nguyên trong mã)
catalog.fields = catalog.fields.filter(f => !(f.dict && f.src === 'js' && (!usedStrings.has(f.dict) || f.vi == null)));
// khu vực trống (vd chỉ có khóa cũ) thì bỏ
catalog.sections = catalog.sections.filter(s => catalog.fields.some(f => f.section === s.id));

// đánh số nhãn trong từng khu vực: "Đoạn văn 2", "Nút 3"…
const byType = {};
catalog.fields.sort((a, b) => (a.order || 0) - (b.order || 0));
for (const f of catalog.fields) {
  const k = f.section + '|' + (f.grp || '') + '|' + f.type;
  byType[k] = (byType[k] || 0) + 1;
  f._n = byType[k]; f._k = k;
}
for (const f of catalog.fields) {
  if (f.label) continue;
  const total = byType[f._k];
  f.label = (f.gi ? 'Thẻ ' + f.gi + ' · ' : '') + (f.joined ? 'Phần câu có chèn dữ liệu' : TYPES[f.type]) + (total > 1 ? ' ' + f._n : '');
}
// số lượng trong danh sách thiết bị: trang dùng 1 giá trị cho cả 2 ngôn ngữ
catalog.fields.forEach(f => { if (/.n$/.test(f.key) && f.type === 'stat') f.mono = true; });
catalog.fields.forEach(f => { delete f._n; delete f._k; delete f.joined; delete f.grp; delete f.gi; if (!process.env.CMS_DEBUG) { delete f.fn; delete f.dict; } });
// trang do tools/cms-js-pages.js dựng (Truyền Nghề, Academy Ranking): giữ nguyên từ danh mục đang có
const OWN = new Set(['career', 'ranking']);
const CUR = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
if (CUR) for (const k of ['pages', 'sections', 'fields', 'media']) catalog[k] = catalog[k].filter(x => !OWN.has(k === 'pages' ? x.id : x.page)).concat((CUR[k] || []).filter(x => OWN.has(k === 'pages' ? x.id : x.page)));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(catalog, null, 1));
const pageCount = {}; catalog.fields.forEach(f => pageCount[f.page] = (pageCount[f.page] || 0) + 1);
console.log('trường chữ:', JSON.stringify(pageCount), '· khu vực:', catalog.sections.length);
