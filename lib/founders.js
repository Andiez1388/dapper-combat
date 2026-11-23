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
    vi: 'Dapper Combat bắt đầu từ một góc phòng tập mái tôn ở Sài Gòn, mấy đôi găng cũ và vài anh em mê boxing. Người giữ lửa từ những ngày đó tới giờ là anh Hoàng Vũ Phong. Ảnh trên trang này đều là ảnh anh em tự chụp, có tấm mờ, có tấm lệch, nhưng tấm nào cũng thật.',
    en: 'Dapper Combat started in a corner of a tin-roofed gym in Saigon, with a few old pairs of gloves and a handful of friends who loved boxing. The one who has kept it going since those days is Hoang Vu Phong. Every photo on this page was taken by us. Some are blurry, some are crooked, but all of them are real.',
  },
  chapters: [
    ch('01', false, 'center', 'Sài Gòn · những ngày đầu', 'Góc phòng tập mái tôn', 'The tin-roof gym',
      'Hồi đó phòng tập nhỏ lắm, trưa nắng là hầm như cái lò. Tường dán đầy poster mấy trận đấu lớn, coi riết thuộc lòng.\nTập xong anh em ngồi bệt dưới sàn, chia nhau chai nước, bàn chuyện mai tập gì. Chưa ai nghĩ tới chuyện làm thương hiệu.',
      'The gym was tiny and turned into an oven at noon. The walls were covered in posters of big fights we knew by heart.\nAfter training we sat on the floor, shared a bottle of water and talked about tomorrow’s session. Nobody was thinking about a brand.'),
    ch('02', false, 'top', 'Mỗi buổi tập', 'Anh Phong vẫn tự cầm đích', 'Phong still holds the pads',
      'Tới giờ anh Phong vẫn giữ thói quen tự cầm đích cho học trò. Anh hay nói phải đứng trước cú đấm của người ta mới biết người ta sai chỗ nào. Đứng ngoài nhìn thì không thấy được.',
      'Phong still holds pads for his students himself. He likes to say you only see what someone is doing wrong when you stand in front of their punches. From the side, you miss it.'),
    ch('03', false, 'center', 'Trước giờ lên sàn', 'Buộc găng cho võ sĩ', 'Lacing up a fighter',
      'Quấn băng, buộc găng, dặn một hai câu trước khi vào hiệp. Việc nhỏ thôi nhưng anh em làm kỹ lắm, vì dây găng mà lỏng là coi như hỏng trận.',
      'Wrapping hands, lacing gloves, a word or two before the round. Small jobs, but we take them seriously. A loose glove can cost you the fight.'),
    ch('04', true, 'center', 'Fight Team', 'Dapper Dudes Fight Team', 'Dapper Dudes Fight Team',
      'Tập chung lâu thì thành đội. Dapper Dudes Fight Team có từ đó, mặc chung một kiểu áo cho dễ nhận nhau ở giải. Mấy chiếc áo ấy về sau thành dòng đồ Dapper Dudes đang bán trong cửa hàng.',
      'Train together long enough and you become a team. That is how the Dapper Dudes Fight Team started, all in the same shirt so we could find each other at tournaments. Those shirts later became the Dapper Dudes line in our shop.'),
    ch('05', false, 'top', 'Trên sàn đấu', 'Ngày học trò thắng', 'The day a student wins',
      'Có những tối cả đội đứng dưới sàn mà tim đập còn mạnh hơn người đang đấu. Lúc trọng tài giơ tay học trò mình lên, mấy tháng tập coi như được trả công.',
      'Some nights the whole team stands ringside with hearts beating harder than the fighter’s. When the referee raises our student’s hand, months of training pay off in a second.'),
    ch('06', true, 'center', 'Cộng đồng', 'Tập chung với anh em', 'Training with friends',
      'Phòng tập nào cũng là anh em. Tụi mình hay qua lại sparring với các câu lạc bộ khác, có cả bạn võ sĩ nước ngoài. Đánh với người lạ mới thấy mình còn thiếu gì.',
      'Every gym is family to us. We often spar with other clubs, foreign fighters included. You only find out what you are missing when you face someone new.'),
    ch('07', true, 'center', 'Ngoài sàn đấu', 'Ai cũng tập được', 'Anyone can train',
      'Không phải ai tới phòng tập cũng muốn đi thi. Có bạn làm văn phòng, có bạn làm người mẫu, có bạn chỉ muốn khỏe hơn. Tụi mình dạy hết, và dạy đàng hoàng như dạy võ sĩ.',
      'Not everyone who walks in wants to compete. Office workers, models, people who just want to feel stronger. We teach them all, as properly as we teach fighters.'),
    ch('11', true, 'center', 'A Night of Warriors', 'Rủ nhau đi coi đấu', 'A night out at the fights',
      'Có trận lớn là anh em rủ nhau đi coi. Đêm WBO Global Title Match, ngồi dưới khán đài nhìn người ta đánh, về học được nhiều hơn cả tuần tập.',
      'Whenever there is a big fight, we go together. At the WBO Global Title Match we learned more from the stands than from a week in the gym.'),
    ch('12', true, 'center', 'Sau tiếng chuông cuối', 'Phòng chờ sau trận', 'After the final bell',
      'Sau trận, phòng chờ lúc nào cũng ồn ào, ai cũng cười. Được đứng cạnh những võ sĩ đã đi xa hơn mình, nghe họ kể chuyện tập, về nhà lại muốn tập thêm.',
      'After the fight the locker room is always loud and full of smiles. Standing next to fighters who have gone further, hearing how they train, we always come home wanting to train harder.'),
    ch('08', true, 'top', '12.10.2024', 'Champion’s Genesis', 'Champion’s Genesis',
      'Tụi mình góp mặt ở Champion’s Genesis cùng nhiều người đang làm boxing chuyên nghiệp ở Việt Nam. Boxing nước mình còn non, ai làm được gì thì góp nấy.',
      'We were at Champion’s Genesis with many of the people building professional boxing in Vietnam. The sport is still young here, so everyone pitches in where they can.'),
    ch('13', true, 'top', 'Người đi trước', 'Học từ người đi trước', 'Learning from those before us',
      'Đi đâu anh Phong cũng hay tìm gặp những người đã gắn bó với boxing cả đời. Hỏi một câu, nghe họ trả lời, có khi bớt được mấy năm mò mẫm.',
      'Wherever he goes, Phong looks for people who have spent their lives in boxing. One question and one answer can save you years of guessing.'),
    ch('09', true, 'center', 'IBF · The Grand Hồ Tràm', 'Hội nghị IBF lần thứ 41', 'IBF 41st Annual Convention',
      'Hội nghị thường niên lần thứ 41 của IBF tổ chức ngay ở Việt Nam. Anh em có mặt, gặp những người làm boxing từ khắp nơi. Về tới phòng tập rồi mà kể mấy hôm vẫn chưa hết chuyện.',
      'The IBF held its 41st Annual Convention right here in Vietnam. We were there and met boxing people from all over the world. Back at the gym, the stories lasted for days.'),
    ch('10', false, 'top', 'Giấc mơ tiếp theo', 'Chiếc đai IBF', 'The IBF belt',
      'Lần đầu cầm chiếc đai IBF trên tay, thấy nó nặng hơn mình nghĩ. Tụi mình mong có ngày một võ sĩ Việt tập ở Dapper Combat đeo được nó.\nCòn xa, nhưng cứ tập đều thì sẽ tới.',
      'Holding an IBF belt for the first time, it felt heavier than we expected. We hope one day a Vietnamese fighter from Dapper Combat wears one.\nIt is a long way off, but if we keep training, we will get there.'),
  ],
  hero: '/assets/img/founders/10.jpg',
  motto: { vi: 'Mọi sự cẩu thả trong công việc đều là một tội ác.', en: 'Every act of carelessness at work is a crime.' },
  mottoBy: 'Hoàng Vũ Phong · Founder',
  quote: { vi: 'Tập thật, sống thật, làm tới nơi tới chốn.', en: 'Train for real, live for real, finish what you start.' },
  quoteBy: 'Anh em Dapper Combat',
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
    hero: IMG.test(String(raw.hero || '')) ? String(raw.hero) : (raw.hero === '' ? '' : DEFAULT.hero),
    motto: pair(raw.motto, 200),
    mottoBy: txt(raw.mottoBy, 80),
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
  const motto = L(d.motto) ? `<figure class="fd-motto" data-fd-reveal><span class="fd-motto-mark" aria-hidden="true">“</span><blockquote>${esc(L(d.motto))}</blockquote>${d.mottoBy ? `<figcaption>${esc(d.mottoBy)}</figcaption>` : ''}</figure>` : '';
  const ch = d.chapters.map((c, i) => {
    const pic = c.img ? `<figure class="fd-pic"><img src="${esc(c.img)}" alt="${esc(L(c.title) || L(d.title))}" loading="${i < 2 ? 'eager' : 'lazy'}" style="object-position:${c.pos}"></figure>` : '';
    return `<section class="fd-ch${c.img ? '' : ' fd-ch--text'}${c.img && c.wide ? ' fd-ch--wide' : ''}" data-fd-reveal>${pic}<div class="fd-copy"><span class="fd-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>` +
      (c.year ? `<span class="fd-year">${esc(c.year)}</span>` : `<span class="fd-year">${String(i + 1).padStart(2, '0')}</span>`) +
      (L(c.title) ? `<h2>${esc(L(c.title))}</h2>` : '') + paras(L(c.text)) + '</div></section>' + (i === Math.min(2, d.chapters.length - 1) ? motto : '');
  }).join('');
  const q = L(d.quote) ? `<blockquote class="fd-quote" data-fd-reveal><p>“${esc(L(d.quote))}”</p>${d.quoteBy ? `<cite>${esc(d.quoteBy)}</cite>` : ''}</blockquote>` : '';
  const cta = `<div class="fd-cta"><a href="/khoa-hoc" class="fd-btn">${lang === 'en' ? 'Come train with us' : 'Tới tập thử'}</a><a href="/shop" class="fd-btn fd-btn--ghost">${lang === 'en' ? 'Visit the shop' : 'Ghé cửa hàng'}</a></div>`;
  return `<div class="fd-story">${ch}</div>` + q + cta;
}
// dữ liệu cho trang phụ (lib/pages.js → render)
// đầu trang: nền đen, tiêu đề + lời mở đầu (2 ngôn ngữ, script trang phụ tự đổi) + ảnh founder
function hero(d) {
  const t = d.title, en = t.en || t.vi;
  return `<header class="fd-hero"><div class="fd-hero-in"><div class="fd-hero-copy">` +
    `<p class="fd-eyebrow" data-pg-vi="Người thật · Việc thật" data-pg-en="Real people · Real work">Người thật · Việc thật</p>` +
    `<h1 data-pg-vi="${esc(t.vi)}" data-pg-en="${esc(en)}">${esc(t.vi)}</h1>` +
    (d.intro.vi ? `<p class="fd-lead" data-lang-body="vi">${esc(d.intro.vi)}</p><p class="fd-lead" data-lang-body="en" hidden>${esc(d.intro.en || d.intro.vi)}</p>` : '') +
    `<a class="fd-scroll" href="#fd-story"><span data-pg-vi="Đọc câu chuyện" data-pg-en="Read our story">Đọc câu chuyện</span><i aria-hidden="true">↓</i></a></div>` +
    (d.hero ? `<figure class="fd-hero-pic"><img src="${esc(d.hero)}" alt="${esc(d.mottoBy || t.vi)}" fetchpriority="high"></figure>` : '') +
    `</div></header><div class="fd-progress" aria-hidden="true"><i></i></div>`;
}
function page() {
  const d = get();
  const first = d.chapters.find(c => c.img);
  return {
    on: d.on, slug: 'cau-chuyen-founders',
    title: d.title, desc: { vi: d.intro.vi.slice(0, 160), en: (d.intro.en || d.intro.vi).slice(0, 160) },
    body: { vi: body(d, 'vi'), en: body(d, 'en') }, cover: '', image: d.hero || (first ? first.img : ''), hero: hero(d),
  };
}
function reset() { try { fs.unlinkSync(FILE); } catch { /* chưa lưu lần nào */ } return get(); }
function stamp() { try { return String(fs.statSync(FILE).mtimeMs); } catch { return '0'; } }

module.exports = { get, save, clean, page, stamp, reset, DEFAULT };
