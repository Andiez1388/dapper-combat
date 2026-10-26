/*
 * Trang phụ tạo trong /admin → Trang phụ (chính sách đổi trả, giới thiệu, điều khoản…) — lưu ở data/pages.json
 *   mỗi trang: /trang/<slug>, tiêu đề + nội dung VI/EN (định dạng cơ bản: tiêu đề, đoạn, danh sách, link, ảnh), mô tả SEO, ảnh đầu trang, bật/tắt
 *   lần chạy đầu chép trang mẫu từ data/seed/pages.json (đang ở dạng nháp)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseDocument } = require('htmlparser2');

const ROOT = path.join(__dirname, '..');
const { DATA_DIR, SEED_DIR } = require('./paths');
const FILE = path.join(DATA_DIR, 'pages.json');
const SEED = path.join(SEED_DIR, 'pages.json');
const TEMPLATE = path.join(ROOT, 'public', 'trang.html');

function all() {
  if (!fs.existsSync(FILE)) save(fs.existsSync(SEED) ? JSON.parse(fs.readFileSync(SEED, 'utf8')) : []);
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) {
    // file hỏng (thường do sửa tay): cất sang bên cạnh để lần lưu sau không đè mất
    const bad = FILE + '.hong-' + Date.now();
    try { fs.renameSync(FILE, bad); } catch { /* bỏ qua */ }
    console.error(`[trang phụ] pages.json bị hỏng (${e.message}) — đã cất ở ${path.basename(bad)}`);
    return [];
  }
}
function save(list) {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, FILE);
}
function stamp() { return fs.existsSync(FILE) ? String(fs.statSync(FILE).mtimeMs) : '0'; }

/* ─── Làm sạch nội dung ──────────────────────────────────────────────────── */
// chỉ giữ thẻ định dạng; link: http(s), đường dẫn trong web, #, tel:, mailto:; ảnh: ảnh của web hoặc https
const KEEP = { h2: [], h3: [], h4: [], p: [], br: [], hr: [], ul: [], ol: [], li: [], strong: [], b: [], em: [], i: [], u: [], s: [], blockquote: [], figure: [], figcaption: [], a: ['href', 'target'], img: ['src', 'alt'], table: [], thead: [], tbody: [], tr: [], th: [], td: [] };
const DROP = /^(script|style|iframe|object|embed|form|input|button|select|textarea|svg|math|template|noscript|link|meta)$/;
const VOID = /^(br|hr|img)$/;
const HREF = /^(\/[^\s"<>]*|#[\w-]*|https?:\/\/[^\s"<>]+|tel:[+\d\s().-]{3,20}|mailto:[^\s"<>@]+@[^\s"<>]+)$/;
const SRC = /^(\/assets\/(uploads|media|img)\/[\w./-]+|https:\/\/[^\s"<>]+)$/;
const esc = s => String(s).replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function cleanHtml(html) {
  const doc = parseDocument(String(html || '').slice(0, 200000), { decodeEntities: false });
  const out = node => (node.children || []).map(n => {
    if (n.type === 'text') return n.data.replace(/</g, '&lt;');
    if (n.type !== 'tag') return '';
    const name = n.name.toLowerCase();
    if (DROP.test(name)) return '';
    if (!KEEP[name]) return out(n);                     // thẻ lạ: bỏ thẻ, giữ chữ bên trong
    let attrs = '';
    for (const a of KEEP[name]) {
      let v = n.attribs[a];
      if (v == null) continue;
      v = v.replace(/&amp;/g, '&').trim();
      if (a === 'href' && !HREF.test(v)) continue;
      if (a === 'src' && !SRC.test(v)) continue;
      if (a === 'target' && v !== '_blank') continue;
      attrs += ` ${a}="${esc(v)}"`;
    }
    if (name === 'a' && /target="_blank"/.test(attrs)) attrs += ' rel="noopener"';
    if (name === 'img' && !/ src=/.test(attrs)) return '';
    return VOID.test(name) ? `<${name}${attrs}>` : `<${name}${attrs}>${out(n)}</${name}>`;
  }).join('');
  return out(doc).trim();
}
const text = (v, max) => String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, max);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// dữ liệu gửi lên → trang hợp lệ (ném lỗi tiếng Việt nếu sai)
function clean(b, list, id) {
  const slug = String(b.slug || '').trim().toLowerCase();
  if (!SLUG.test(slug) || slug.length > 60) throw new Error('Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang (vd chinh-sach-doi-tra)');
  if (list.some(p => p.slug === slug && p.id !== id)) throw new Error('Đường dẫn này đã có trang khác dùng');
  const pair = (v, max, fn) => ({ vi: fn((v || {}).vi, max), en: fn((v || {}).en, max) });
  const page = {
    slug,
    title: pair(b.title, 160, text),
    desc: pair(b.desc, 300, text),
    body: pair(b.body, 200000, v => cleanHtml(v)),
    cover: b.cover && SRC.test(String(b.cover)) ? String(b.cover) : '',
    published: !!b.published,
  };
  if (!page.title.vi) throw new Error('Cần nhập tiêu đề tiếng Việt');
  return page;
}
function create(b) {
  const list = all();
  const page = { id: 'pg' + crypto.randomBytes(4).toString('hex'), ...clean(b, list), createdAt: Date.now(), updatedAt: Date.now() };
  list.push(page); save(list);
  queueEn(page);
  return page;
}
function update(id, b) {
  const list = all(), i = list.findIndex(p => p.id === id);
  if (i < 0) return null;
  const next = { ...list[i], ...clean({ ...list[i], ...b }, list, id), updatedAt: Date.now() };
  // đổi tiếng Việt mà tiếng Anh giữ nguyên → bản tiếng Anh cũ không còn đúng: xóa, AI dịch lại
  for (const f of FIELDS) if (next[f].vi !== list[i][f].vi && next[f].en === list[i][f].en) next[f].en = '';
  list[i] = next;
  save(list);
  queueEn(next);
  return list[i];
}

/* ─── Tiếng Anh tự dịch (lib/translate.js) ───────────────────────────────────── */
const FIELDS = ['title', 'desc', 'body'];
const queueEn = p => require('./translate').queue('page', FIELDS.filter(f => p[f].vi && !p[f].en).map(f => p.id + '|' + f));
require('./translate').register('page', {
  collect(refs) {
    const want = refs && new Set(refs), out = [];
    for (const p of all()) for (const f of FIELDS) if (p[f] && p[f].vi && !p[f].en && (!want || want.has(p.id + '|' + f))) out.push({ ref: p.id + '|' + f, vi: p[f].vi, html: f === 'body' });
    return out;
  },
  apply(results) {
    const list = all();
    let n = 0;
    for (const r of results) {
      const [id, f] = r.ref.split('|'), p = list.find(x => x.id === id);
      if (!p || !p[f] || p[f].vi !== r.vi || p[f].en) continue;
      p[f].en = f === 'body' ? cleanHtml(r.en) : text(r.en, f === 'title' ? 160 : 300);   // làm sạch như chữ nhập tay
      n++;
    }
    if (n) save(list);
  },
});
function remove(id) {
  const list = all(), i = list.findIndex(p => p.id === id);
  if (i < 0) return false;
  list.splice(i, 1); save(list);
  return true;
}
const bySlug = slug => all().find(p => p.slug === slug && p.published);
// trang công khai (cho danh sách link gợi ý trong /admin)
const index = () => all().map(p => ({ id: p.id, slug: p.slug, title: p.title.vi, published: p.published }));

/* ─── Dựng trang ─────────────────────────────────────────────────────────── */
// preview = true: xem bản nháp từ /admin (không cần bật hiển thị)
function render(page) {
  const t = fs.readFileSync(TEMPLATE, 'utf8');
  const en = page.title.en || page.title.vi;
  const fill = { title: esc(page.title.vi), title_en: esc(en), desc: esc(page.desc.vi || page.title.vi), desc_en: esc(page.desc.en || page.desc.vi || en),
    body_vi: page.body.vi, body_en: page.body.en || page.body.vi, slug: page.slug,
    cover: page.cover ? `<div class="pg-cover"><img src="${esc(page.cover)}" alt=""></div>` : '' };
  return t.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in fill ? fill[k] : m));
}

module.exports = { all, create, update, remove, bySlug, index, render, stamp, cleanHtml };
