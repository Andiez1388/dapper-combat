/*
 * Trang "Câu chuyện Founders" (/cau-chuyen-founders) — sửa ở /admin → Câu chuyện Founders, lưu data/founders.json
 *   tiêu đề + lời mở đầu, các chương (ảnh + mốc thời gian + tiêu đề + đoạn kể), câu trích dẫn cuối trang. VI / EN.
 *   Trang được dựng sẵn bên máy chủ (Google đọc được), dùng khung trang phụ public/trang.html.
 */
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./paths');
const FILE = path.join(DATA_DIR, 'founders.json');

const DEFAULT = {
  on: true,
  title: { vi: 'Câu chuyện Founders', en: 'Our Founders' },
  intro: {
    vi: 'Dapper Combat không bắt đầu từ một bản kế hoạch kinh doanh. Nó bắt đầu từ những buổi tập muộn, đôi găng sờn và vài người bạn tin rằng boxing có thể thay đổi một con người.',
    en: 'Dapper Combat did not start with a business plan. It started with late-night sessions, worn-out gloves and a few friends who believed boxing can change a person.',
  },
  chapters: [
    { img: '', pos: 'center', year: '', title: { vi: 'Bắt đầu', en: 'The beginning' }, text: { vi: 'Ảnh và câu chuyện sẽ được cập nhật.', en: 'Photos and story coming soon.' } },
  ],
  quote: { vi: 'Chúng tôi là người thật, tập thật, dạy thật.', en: 'Real people. Real training. Real coaching.' },
  quoteBy: 'Founders · Dapper Combat',
};

const IMG = /^\/assets\/(uploads|media|img)\/[\w./-]+\.(jpe?g|png|webp|gif)$/i;
const txt = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, n);
const pair = (o, n, d) => ({ vi: txt((o || {}).vi, n) || (d ? d.vi : ''), en: txt((o || {}).en, n) });
const POS = ['center', 'top', 'bottom', 'left', 'right'];

function clean(raw) {
  raw = raw && typeof raw === 'object' ? raw : {};
  const chapters = (Array.isArray(raw.chapters) ? raw.chapters : []).slice(0, 24).map(c => ({
    img: IMG.test(String((c || {}).img || '')) ? String(c.img) : '',
    pos: POS.includes((c || {}).pos) ? c.pos : 'center',
    year: txt((c || {}).year, 24),
    title: pair((c || {}).title, 120),
    text: pair((c || {}).text, 1500),
  })).filter(c => c.img || c.title.vi || c.text.vi);
  return {
    on: raw.on !== false,
    title: pair(raw.title, 90, DEFAULT.title),
    intro: pair(raw.intro, 800),
    chapters,
    quote: pair(raw.quote, 300),
    quoteBy: txt(raw.quoteBy, 80),
  };
}
function get() {
  try { return clean(JSON.parse(fs.readFileSync(FILE, 'utf8'))); } catch { return clean(DEFAULT); }
}
function save(raw) {
  const d = clean(raw), tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2)); fs.renameSync(tmp, FILE);
  return d;
}

/* ─── dựng HTML (chữ đã làm sạch → chỉ cần thoát ký tự) ─── */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const paras = s => String(s || '').split(/\n+/).map(x => x.trim()).filter(Boolean).map(x => '<p>' + esc(x) + '</p>').join('');
function body(d, lang) {
  const L = o => (lang === 'en' ? o.en || o.vi : o.vi);
  const ch = d.chapters.map((c, i) => {
    const pic = c.img ? `<figure class="fd-pic"><img src="${esc(c.img)}" alt="${esc(L(c.title) || L(d.title))}" loading="${i < 2 ? 'eager' : 'lazy'}" style="object-position:${c.pos}"></figure>` : '';
    return `<section class="fd-ch${c.img ? '' : ' fd-ch--text'}">${pic}<div class="fd-copy">` +
      (c.year ? `<span class="fd-year">${esc(c.year)}</span>` : `<span class="fd-year">${String(i + 1).padStart(2, '0')}</span>`) +
      (L(c.title) ? `<h2>${esc(L(c.title))}</h2>` : '') + paras(L(c.text)) + '</div></section>';
  }).join('');
  const q = L(d.quote) ? `<blockquote class="fd-quote"><p>“${esc(L(d.quote))}”</p>${d.quoteBy ? `<cite>${esc(d.quoteBy)}</cite>` : ''}</blockquote>` : '';
  const cta = `<div class="fd-cta"><a href="/khoa-hoc" class="fd-btn">${lang === 'en' ? 'Train with us' : 'Tập cùng chúng tôi'}</a><a href="/shop" class="fd-btn fd-btn--ghost">${lang === 'en' ? 'Visit the shop' : 'Ghé cửa hàng'}</a></div>`;
  return (L(d.intro) ? `<p class="fd-intro">${esc(L(d.intro))}</p>` : '') + `<div class="fd-story">${ch}</div>` + q + cta;
}
// dữ liệu cho trang phụ (lib/pages.js → render)
function page() {
  const d = get();
  const first = d.chapters.find(c => c.img);
  return {
    on: d.on, slug: 'cau-chuyen-founders',
    title: d.title, desc: { vi: d.intro.vi.slice(0, 160), en: (d.intro.en || d.intro.vi).slice(0, 160) },
    body: { vi: body(d, 'vi'), en: body(d, 'en') }, cover: '', image: first ? first.img : '',
  };
}
function stamp() { try { return String(fs.statSync(FILE).mtimeMs); } catch { return '0'; } }

module.exports = { get, save, clean, page, stamp, DEFAULT };
