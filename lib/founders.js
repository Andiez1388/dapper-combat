/*
 * Trang "Câu chuyện Founders" (/cau-chuyen-founders) — sửa ở /admin → Câu chuyện Founders, lưu data/founders.json
 *   tiêu đề + lời mở đầu, các chương (ảnh + mốc thời gian + tiêu đề + đoạn kể), câu trích dẫn cuối trang. VI / EN.
 *   Trang được dựng sẵn bên máy chủ (Google đọc được), dùng khung trang phụ public/trang.html.
 */
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./paths');
const FILE = path.join(DATA_DIR, 'founders.json');

const ch = (n, wide, pos, year, tvi, ten, xvi, xen) => ({ img: `/assets/img/founders/${n}.jpg`, wide, pos, year, title: { vi: tvi, en: ten }, text: { vi: xvi, en: xen } });
const DEFAULT = {
  on: true,
  title: { vi: 'Câu chuyện Founders', en: 'Our Founders' },
  intro: {
    vi: 'Dapper Combat không bắt đầu từ một bản kế hoạch kinh doanh. Nó bắt đầu từ một phòng tập mái tôn ở Sài Gòn, vài đôi găng cũ và một nhóm anh em mê boxing. Không có người mẫu thuê, không có ảnh mạng — mỗi tấm ảnh dưới đây là người thật, việc thật của chúng tôi.',
    en: 'Dapper Combat did not start with a business plan. It started in a tin-roofed gym in Saigon, with a few old gloves and a crew who loved boxing. No hired models, no stock photos — every picture below is our real people and our real work.',
  },
  chapters: [
    ch('01', false, 'center', 'Sài Gòn · những ngày đầu', 'Phòng tập mái tôn', 'The tin-roof gym',
      'Mọi thứ bắt đầu ở một phòng tập nhỏ, tường dán kín poster những trận đấu lớn. Vài người bạn, vài đôi găng, tập cho đến khi tắt đèn.',
      'It all began in a small gym, walls covered in fight posters. A few friends, a few pairs of gloves, training until the lights went out.'),
    ch('02', false, 'top', 'Mỗi buổi tập', 'Tự tay cầm đích', 'Holding the pads ourselves',
      'Founder vẫn tự cầm đích mỗi buổi. Muốn dạy người khác đấm đúng, trước hết phải tự đứng trước từng cú đấm.',
      'Our founder still holds pads every session. To teach someone to punch right, you first have to stand in front of every punch.'),
    ch('03', false, 'center', 'Trước giờ thi đấu', 'Đứng góc cho võ sĩ', 'In the corner',
      'Quấn băng, đeo găng, dặn dò trước hiệp đấu — những việc nhỏ làm hàng trăm lần, cho từng võ sĩ một.',
      'Wrapping hands, lacing gloves, the last words before the bell — small things done hundreds of times, for every fighter.'),
    ch('04', true, 'center', 'Fight Team', 'Dapper Dudes Fight Team', 'Dapper Dudes Fight Team',
      'Từ những buổi tập chung, đội Dapper Dudes Fight Team ra đời: tập cùng nhau, thi đấu cùng nhau, mặc chung một chiếc áo.',
      'Out of shared sessions came the Dapper Dudes Fight Team: we train together, fight together and wear the same shirt.'),
    ch('05', false, 'top', 'Trên sàn đấu', 'Cánh tay được giơ lên', 'A raised hand',
      'Khoảnh khắc học trò được trọng tài giơ tay chiến thắng, đeo huy chương trên ngực — đó là lý do chúng tôi chưa bỏ một buổi tập nào.',
      'The moment a student’s hand is raised and a medal hangs on his chest — that is why we never skip a session.'),
    ch('06', true, 'center', 'Cộng đồng', 'Boxing lớn lên nhờ anh em', 'Boxing grows together',
      'Sparring giao lưu với các CLB bạn, võ sĩ trong và ngoài nước. Boxing Việt Nam lớn lên nhờ những buổi tập chung như thế này.',
      'Open sparring with other clubs and fighters from home and abroad. Vietnamese boxing grows through sessions like these.'),
    ch('07', true, 'center', 'Ngoài sàn đấu', 'Ai cũng có thể bắt đầu', 'Anyone can start',
      'Chúng tôi mang boxing đến các lớp người mẫu, dân văn phòng, người chưa từng đeo găng — vì boxing không chỉ dành cho võ sĩ.',
      'We bring boxing to model classes, office workers and people who have never worn gloves — boxing is not only for fighters.'),
    ch('08', true, 'top', '12.10.2024', 'Champion’s Genesis', 'Champion’s Genesis',
      'Đồng hành cùng sự kiện Champion’s Genesis, đứng cạnh những người đang xây nền móng cho boxing chuyên nghiệp tại Việt Nam.',
      'Supporting Champion’s Genesis, alongside the people building the foundations of professional boxing in Vietnam.'),
    ch('09', true, 'center', 'IBF · The Grand Hồ Tràm', 'Hội nghị thường niên IBF lần thứ 41', 'IBF 41st Annual Convention',
      'Có mặt tại Hội nghị thường niên lần thứ 41 của IBF tổ chức ở Việt Nam — gặp gỡ, học hỏi từ những người làm boxing hàng đầu thế giới.',
      'At the IBF 41st Annual Convention held in Vietnam — meeting and learning from people at the top of world boxing.'),
    ch('10', false, 'top', 'Giấc mơ tiếp theo', 'Một chiếc đai thế giới', 'A world title',
      'Lần đầu được cầm chiếc đai IBF thật trên tay. Một ngày nào đó, chúng tôi muốn một võ sĩ Việt Nam trưởng thành từ Dapper Combat đeo nó lên người.',
      'Holding a real IBF belt for the first time. One day, we want a Vietnamese fighter raised at Dapper Combat to wear one.'),
  ],
  quote: { vi: 'Không có đường tắt. Chỉ có những buổi tập thật, với những con người thật.', en: 'No shortcuts. Just real training, with real people.' },
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
    wide: !!(c || {}).wide,
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
    return `<section class="fd-ch${c.img ? '' : ' fd-ch--text'}${c.img && c.wide ? ' fd-ch--wide' : ''}">${pic}<div class="fd-copy">` +
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
