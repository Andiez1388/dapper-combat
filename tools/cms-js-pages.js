/*
 * Danh mục /admin → Nội dung website cho 2 trang dựng hoàn toàn bằng JavaScript:
 *   Truyền Nghề (public/assets/js/truyen-nghe.js, khóa "career.…") và Academy Ranking (public/assets/js/xephang.js, khóa "ranking.…")
 * Mở 2 trang với ?cmsdump trên máy chủ thử (dữ liệu mẫu), đọc window.__cmsDump = [[khóa, vi, en], …] (mọi chữ t('…') và chữ trong
 * dữ liệu p(vi, en)), đo ảnh, rồi ghi lại phần "career" / "ranking" trong data/seed/cms-catalog.json. Phần của trang khác giữ nguyên.
 * Chạy lại sau khi thêm / đổi chữ trong 2 file JS trên:
 *   node tools/cms-js-pages.js
 */
const fs = require('fs');
const path = require('path');
const { start } = require('../tests/lib/sandbox');
const { Browser } = require('../tests/lib/cdp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'seed', 'cms-catalog.json');
const OWN = ['career', 'ranking'];

const PAGES = [{ id: 'career', label: 'Truyền Nghề', url: '/truyen-nghe' }, { id: 'ranking', label: 'Academy Ranking', url: '/xep-hang' }];

/* ─── Khu vực (theo thứ tự trên trang) + quy tắc xếp khóa: [biểu thức khóa (bỏ tiền tố trang), khu vực, nhóm] ─── */
const SECTIONS = {
  career: [
    ['seo', 'SEO — tiêu đề tab & mô tả trên Google'], ['nav', 'Menu trên cùng'],
    ['hero', 'Đầu trang — 2 góc Coach / Võ sĩ, đếm ngược, học phí'], ['paths', 'Tên và đầu ra của 2 khóa (dùng ở nhiều chỗ)'],
    ['pain', 'Nỗi lo — “Muốn đi đường dài…”'], ['promise', 'Cam kết bằng hợp đồng'], ['quiz', 'Trắc nghiệm — “Bạn hợp góc nào?”'],
    ['road', 'Lộ trình 12 tháng, 4 hiệp'], ['week', 'Một tuần học mẫu'], ['skills', 'Bộ kỹ năng'], ['cmp', 'So sánh 2 khóa'],
    ['fee', 'Học phí — “Bạn nhận về một nghề”'], ['trial', 'Học tới khi thuần thục (bài test, hoàn phí tháng đầu)'],
    ['form', 'Form ghi danh'], ['cert', 'Giấy nhập môn (bên cạnh form)'], ['faq', 'Câu hỏi thường gặp'],
    ['help', 'Khung “Còn băn khoăn?” (Zalo, hotline, chỉ đường)'], ['dock', 'Thanh giữ chỗ dưới đáy màn hình (điện thoại)'], ['foot', 'Chân trang'],
  ],
  ranking: [
    ['seo', 'SEO — tiêu đề tab & mô tả trên Google'], ['nav', 'Menu, ô tìm võ sĩ, chân trang'],
    ['table', 'Bảng ranking (/xep-hang)', '/xep-hang'], ['side', 'Cột bên: sự kiện sắp tới, top 5, thống kê, kỷ lục, cách tính điểm', '/xep-hang'],
    ['common', 'Chữ dùng chung: kết quả, cách thắng, thế đứng, trạng thái', '/xep-hang'],
    ['dir', 'Thông tin võ sĩ (/vo-si)', '/vo-si'], ['profile', 'Hồ sơ võ sĩ: thông số, kỹ năng, lịch sử thi đấu', '/vo-si/_'],
    ['champ', 'Hồ sơ võ sĩ: bộ kỹ năng kiểu game (nội tại, Q W E, tuyệt chiêu)', '/vo-si/_'],
    ['analysis', 'Hồ sơ võ sĩ: phân tích, đối đầu, khả năng thắng', '/vo-si/_'],
    ['events', 'Lịch sự kiện và trang sự kiện (/su-kien)', '/su-kien'], ['compare', 'So sánh võ sĩ và kèo dự đoán (/so-sanh)', '/so-sanh'],
    ['errors', 'Trang không tìm thấy'],
  ],
};

const RULES = {
  career: [
    [/^title$/, 'seo', 'Tiêu đề tab trình duyệt / kết quả Google', 'seo'],
    [/^site\./, 'nav', 'Mục menu'],
    [/^(h1|special|claim|side\.|bao\.|baosub\.|badge\.|pick\.|guar\.|start$|clock\.|fee\.(from|both)$|seats$|cta\.|dep\.only$|age$)/, 'hero'],
    [/^data\.path\.\w+\.(corner|name|out|content|goalShort)$/, 'paths'],
    [/^(pain\.|data\.pain\.)/, 'pain'],
    [/^(promise\.|pr\.|seal\.|refund\.)/, 'promise'],
    [/^(quiz\.|data\.quiz\.)/, 'quiz'],
    [/^(bar\.|road\.|data\.path\.\w+\.rounds\.)/, 'road'],
    [/^(week\.|d\d$|tag\.|data\.path\.\w+\.week\.)/, 'week'],
    [/^(skills\.|data\.path\.\w+\.skills\.)/, 'skills'],
    [/^(cmp\.|v\.)/, 'cmp'],
    [/^(fee\.|w\.|plan\.|dep\.|pay\.)/, 'fee'],
    [/^trial\./, 'trial'],
    [/^(form\.|exp\.|opt\.|send\.|payname\.|ok\.|err\.)/, 'form'],
    [/^cert\./, 'cert'],
    [/^(faq\.|q\d+$|a\d+(\.\w+)?$|how\.)/, 'faq'],
    [/^help\./, 'help'],
    [/^dock\./, 'dock'],
    [/^foot\./, 'foot'],
  ],
  ranking: [
    [/^rank\.title$/, 'seo', 'Tiêu đề tab trình duyệt / kết quả Google · Bảng ranking (/xep-hang)', 'seo'],
    [/^(site|nav|search|foot)\./, 'nav'],
    [/^(rank\.|updated$|g\.|f\.|col\.|view\.|move\.|none$|role\.)/, 'table'],
    [/^(side|stats|rec|how)\./, 'side'],
    [/^(stance|status|res|m)\./, 'common'],
    [/^dir\./, 'dir'],
    [/^(pf|sk|bh|chart|ev2)\.|^(up|bio)\.title$|^(yrs|gm|gf|cm|kg)$/, 'profile'],
    [/^(ch|mv|ps|ult)\./, 'champ'],
    [/^(an\.|prob)/, 'analysis'],
    [/^(ev|type|feat|cd)\.|^back\.events$/, 'events'],
    [/^(cmp|pr|fx)\./, 'compare'],
    [/^(nf\.|back\.ranking$)/, 'errors'],
  ],
};

/* ─── Nhãn ──────────────────────────────────────────────────────────────── */
const SIDE = { coach: 'Coach', fighter: 'Võ sĩ', both: 'Cả hai góc', tie: 'Hai góc ngang nhau' };
const sideOf = k => { const m = k.match(/\.(coach|fighter|tie|both)(\.|$)/); return m ? SIDE[m[1]] : ''; };
// nhãn rõ nghĩa cho các khóa hay gặp (phần còn lại: tên nhóm + chữ mặc định)
const NAMES = {
  career: {
    h1: 'Tên chương trình (chữ lớn nhất)', special: 'Dòng nhỏ trên tên chương trình', claim: 'Câu chốt dưới tên chương trình', start: 'Ngày khai giảng',
    'fee.from': 'Chữ trước mức học phí thấp nhất', 'fee.both': 'Học phí 2 khóa (1 dòng)', seats: 'Số chỗ mỗi khóa', age: 'Độ tuổi tuyển',
    'cta.apply': 'Nút giữ chỗ', 'cta.quiz': 'Nút làm trắc nghiệm', 'cta.dep': 'Nút đặt cọc', 'dep.only': 'Chữ trước số tiền cọc', 'guar.link': 'Link cam kết hoàn phí',
    'clock.done': 'Đếm ngược: khi đã khai giảng', 'pain.h': 'Tiêu đề', 'pain.sub': 'Mô tả dưới tiêu đề', 'promise.h': 'Tiêu đề', 'promise.sub': 'Mô tả dưới tiêu đề',
    'quiz.h': 'Tiêu đề', 'quiz.sub': 'Mô tả dưới tiêu đề', 'quiz.n': 'Số câu đang làm', 'road.h': 'Tiêu đề', 'road.sub': 'Mô tả dưới tiêu đề',
    'week.h': 'Tiêu đề', 'week.sub': 'Mô tả dưới tiêu đề', 'week.note': 'Ghi chú dưới bảng', 'skills.h': 'Tiêu đề (khi đã chọn 1 góc)',
    'skills.both': 'Tiêu đề (chưa chọn góc)', 'skills.sub': 'Mô tả dưới tiêu đề', 'cmp.h': 'Tiêu đề', 'cmp.sub': 'Mô tả dưới tiêu đề',
    'fee.h': 'Tiêu đề', 'fee.sub': 'Mô tả dưới tiêu đề', 'trial.h': 'Tiêu đề', 'trial.p': 'Đoạn chữ', 'form.h': 'Tiêu đề', 'form.sub': 'Mô tả dưới tiêu đề',
    'faq.h': 'Tiêu đề', 'help.h': 'Tiêu đề', 'help.p': 'Đoạn chữ (khi có hotline)', 'help.p0': 'Đoạn chữ (khi chưa có hotline)',
    'foot.h1': 'Dòng lớn thứ 1', 'foot.h2': 'Dòng lớn thứ 2', 'foot.note': 'Đoạn giới thiệu', 'foot.home': 'Link về trang chủ',
    'ok.h': 'Gửi xong: tiêu đề', 'ok.p': 'Gửi xong: đoạn chữ', 'ok.pay': 'Gửi xong: nhắc thanh toán', 'ok.again': 'Gửi xong: nút ghi danh thêm',
    'dock.t': 'Dòng chính', 'dock.left': 'Số ngày còn lại', 'dock.dep': 'Dòng tiền cọc', 'a6.free': 'Trả lời câu giữ chỗ (khi tắt đặt cọc)', 'a6.dep': 'Trả lời câu giữ chỗ (khi bật đặt cọc)',
    'how.dep': 'Câu thêm vào trả lời học phí: đặt cọc', 'how.list': 'Câu thêm vào trả lời học phí: cách đóng tiền',
  },
  ranking: {
    'dir.title': 'Tiêu đề trang Thông tin võ sĩ (cũng là tiêu đề tab)',
    'ev.title': 'Tiêu đề trang Lịch sự kiện (cũng là tiêu đề tab)', 'cmp.title': 'Tiêu đề trang So sánh (cũng là tiêu đề tab)',
    'rank.sub': 'Mô tả dưới tiêu đề', 'dir.sub': 'Mô tả dưới tiêu đề', 'ev.sub': 'Mô tả dưới tiêu đề', 'cmp.hint': 'Hướng dẫn chọn võ sĩ',
    'foot.note': 'Chân trang: đoạn giới thiệu', 'foot.home': 'Chân trang: link về trang chủ', 'search.ph': 'Ô tìm võ sĩ: chữ mờ', 'search.go': 'Ô tìm võ sĩ: nút',
    'nf.title': 'Tiêu đề', 'nf.fighter': 'Không tìm thấy võ sĩ', 'nf.event': 'Không tìm thấy sự kiện',
  },
};
const GROUPS = {
  career: [
    [/^site\./, 'Menu'], [/^side\./, 'Thẻ góc · dòng nhỏ'], [/^bao\./, 'Thẻ góc · dòng lớn'], [/^baosub\./, 'Thẻ góc · dòng mô tả'], [/^badge\./, 'Thẻ góc · nhãn hoàn phí'],
    [/^pick\./, 'Thẻ góc · nút chọn'], [/^clock\./, 'Đếm ngược · đơn vị'], [/^data\.path\.\w+\.corner$/, 'Tên góc'], [/^data\.path\.\w+\.name$/, 'Tên khóa'],
    [/^data\.path\.\w+\.out$/, 'Đầu ra'], [/^data\.path\.\w+\.content$/, 'Nội dung chính'], [/^data\.path\.\w+\.goalShort$/, 'Mục tiêu (ngắn)'],
    [/^pain\.(who|fix|cost|col)/, 'Nhãn'], [/^pr\./, 'Giấy cam kết'], [/^seal\./, 'Con dấu'], [/^refund\./, 'Câu hoàn phí ngắn'],
    [/^quiz\.(r|rs)\./, 'Kết quả'], [/^quiz\.lean\./, 'Kết quả · mức nghiêng'], [/^quiz\./, 'Nút / nhãn'], [/^bar\./, 'Thanh chọn góc (dính khi cuộn)'],
    [/^road\./, 'Nhãn'], [/^week\./, 'Nhãn'], [/^d\d$/, 'Thứ'], [/^tag\./, 'Thẻ loại ca'], [/^cmp\./, 'Dòng / nhãn'], [/^v\./, 'Giá trị chung 2 khóa'],
    [/^w\./, 'Thẻ học phí'], [/^plan\./, 'Thẻ học phí · nút'], [/^fee\./, 'Đơn vị học phí'], [/^dep\./, 'Dải đặt cọc'], [/^pay\./, 'Cách đóng tiền'],
    [/^trial\.re\./, 'Chưa qua bài test'], [/^trial\.us\./, 'Tháng đầu, không phù hợp'], [/^trial\.you\./, 'Bạn tự dừng'],
    [/^exp\./, 'Lựa chọn kinh nghiệm'], [/^opt\./, 'Lựa chọn thanh toán'], [/^send\./, 'Nút gửi'], [/^payname\./, 'Tên cách thanh toán'], [/^ok\./, 'Gửi xong'],
    [/^err\./, 'Báo lỗi'], [/^form\./, 'Ô / nhãn'], [/^cert\./, 'Giấy nhập môn'], [/^faq\.g/, 'Nhóm câu hỏi'], [/^help\./, 'Nút / nhãn'],
  ],
  ranking: [
    [/^site\./, 'Menu'], [/^nav\./, 'Menu Academy Ranking'], [/^rank\./, 'Tiêu đề'], [/^g\./, 'Nút giới tính'], [/^f\./, 'Bộ lọc'], [/^col\./, 'Cột bảng'],
    [/^view\./, 'Nút xem'], [/^move\./, 'Tăng / giảm hạng'], [/^role\./, 'Bộ lọc vai trò'], [/^side\./, 'Cột bên'], [/^stats\./, 'Thống kê Academy'],
    [/^rec\./, 'Kỷ lục Academy'], [/^how\./, 'Cách tính điểm'], [/^stance\./, 'Thế đứng'], [/^status\./, 'Trạng thái'], [/^res\.\w+\.t$/, 'Kết quả (chữ đủ)'],
    [/^res\./, 'Kết quả (viết tắt)'], [/^m\./, 'Cách thắng'], [/^dir\./, 'Thông tin võ sĩ'], [/^pf\./, 'Thông số'], [/^sk\./, 'Đánh giá kỹ năng'],
    [/^bh\./, 'Lịch sử thi đấu'], [/^chart\./, 'Biểu đồ điểm'], [/^ev2\./, 'Nhận xét của HLV'], [/^ch\.role\./, 'Vai trò'], [/^ch\.diff/, 'Độ khó đối đầu'],
    [/^ch\./, 'Bộ kỹ năng'], [/^mv\.\w+\.d$/, 'Kỹ năng · mô tả'], [/^mv\./, 'Kỹ năng · tên'], [/^ps\.\w+\.d$/, 'Nội tại · mô tả'], [/^ps\./, 'Nội tại'],
    [/^ult\.(\w+\.)?d$/, 'Tuyệt chiêu · mô tả'], [/^ult\./, 'Tuyệt chiêu · tên'], [/^an\./, 'Phân tích'], [/^prob/, 'Khả năng thắng'],
    [/^ev\./, 'Sự kiện'], [/^type\./, 'Loại sự kiện'], [/^feat\./, 'Trận tâm điểm'], [/^cd\./, 'Đếm ngược'], [/^back\./, 'Link quay lại'],
    [/^cmp\./, 'So sánh'], [/^pr\./, 'Kèo dự đoán'], [/^fx\./, 'Yếu tố quyết định'], [/^nf\./, 'Không tìm thấy'],
  ],
};
const short = s => { s = String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); return s.length > 44 ? s.slice(0, 42).trim() + '…' : s; };
// dữ liệu p(vi, en): vị trí → nhãn đọc được
function dataLabel(k) {
  let m;
  if ((m = k.match(/^data\.path\.(\w+)\.rounds\.(\d+)\.(\w+)(?:\.(\d+))?$/))) {
    const what = { t: 'Tên hiệp', title: 'Danh hiệu khi qua hiệp', mile: 'Mốc kết thúc hiệp', items: 'Nội dung học · ý ' + (+m[4] + 1), unlock: 'Kỹ năng mở khóa ' + (+m[4] + 1) }[m[3]];
    return SIDE[m[1]] + ' · Hiệp ' + (+m[2] + 1) + ' · ' + what;
  }
  if ((m = k.match(/^data\.path\.(\w+)\.week\.(\d+)\.(\d+)\.0$/))) return SIDE[m[1]] + ' · ' + ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'][+m[2]] + ' · Ca ' + (+m[3] + 1);
  if ((m = k.match(/^data\.path\.(\w+)\.skills\.(\d+)\.(\d)$/))) return SIDE[m[1]] + ' · Kỹ năng ' + (+m[2] + 1) + ' · ' + (m[3] === '0' ? 'tên' : 'mô tả');
  if ((m = k.match(/^data\.pain\.(\w+)\.(\d+)\.(\d)(?:\.(\d))?$/))) return SIDE[m[1]] + ' · Nỗi lo ' + (+m[2] + 1) + ' · ' + ['Nỗi lo', 'Cái giá phải trả', 'Cách Truyền Nghề giải quyết', 'Ý giải quyết ' + (+m[4] + 1)][+m[3]];
  if ((m = k.match(/^data\.quiz\.(\d+)\.h$/))) return 'Phần ' + (+m[1] + 1) + ' · Tên phần';
  if ((m = k.match(/^data\.quiz\.(\d+)\.d\.(\w+)$/))) return 'Phần ' + (+m[1] + 1) + ' · Nhận xét khi nghiêng về ' + SIDE[m[2]];
  if ((m = k.match(/^data\.quiz\.(\d+)\.q\.(\d+)\.0$/))) return 'Phần ' + (+m[1] + 1) + ' · Câu ' + (+m[2] + 1);
  if ((m = k.match(/^data\.quiz\.(\d+)\.q\.(\d+)\.1\.(\d+)\.0$/))) return 'Phần ' + (+m[1] + 1) + ' · Câu ' + (+m[2] + 1) + ' · Đáp án ' + (+m[3] + 1);
  return null;
}
function labelOf(page, k, vi) {
  const named = NAMES[page][k];
  if (named) return named + (sideOf(k) ? ' · ' + sideOf(k) : '');
  const d = page === 'career' && dataLabel(k);
  if (d) return d;
  if (page === 'career' && /^(q|a)\d+$/.test(k)) return (k[0] === 'q' ? 'Câu hỏi ' : 'Trả lời ') + k.slice(1);
  const g = (GROUPS[page].find(([re]) => re.test(k)) || [])[1] || 'Chữ';
  return g + (sideOf(k) ? ' · ' + sideOf(k) : '') + ' · «' + short(vi) + '»';
}
function typeOf(k, vi) {
  if (/(^|\.)(h|h1|title)$|^data\.path\.\w+\.rounds\.\d+\.t$/.test(k)) return 'title';
  if (/(^|\.)(sub|p|p0|note)$/.test(k)) return 'subtitle';
  if (/^q\d+$|^data\.quiz\.\d+\.q\.\d+\.0$/.test(k)) return 'question';
  if (/^a\d+(\.\w+)?$/.test(k)) return 'answer';
  if (/^(cta|send|plan|pick)\.|\.(go|again|back|see|apply|zalo|call|map|home|all)$|^search\.go$|^(cmp|pr)\.go$/.test(k)) return 'button';
  if (/^(special|claim|side\.|week\.s\d|tag\.|d\d$|clock\.|col\.|f\.|g\.|stance|status|res\.)/.test(k) || String(vi).length <= 24) return 'label';
  return 'text';
}
const PH = /\{[a-z]+\}/gi;
function note(vi, en) { const ph = [...new Set(String(vi + ' ' + (en || '')).match(PH) || [])]; return ph.length ? ' — giữ nguyên ' + ph.join(' ') + ' (tự điền)' : ''; }

/* ─── SEO thêm (server đọc khi gửi trang): mô tả Google của từng trang ─── */
function htmlDesc(file) { const m = fs.readFileSync(path.join(ROOT, 'public', file), 'utf8').match(/<meta name="description" content="([^"]*)">/); return m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : ''; }
const SEO_EXTRA = () => ({
  career: [['seo.desc', 'Mô tả ngắn trên Google (~150 ký tự)', htmlDesc('truyen-nghe.html')]],
  ranking: require('../lib/rank-seo').PAGES.map(p => ['seo.' + p.id + '.desc', 'Mô tả trên Google · ' + p.label, p.desc]),
});

/* ─── Ảnh (Truyền Nghề) ───────────────────────────────────────────────── */
const MEDIA = [
  ['career.hero.coach', 'hero', 'Ảnh thẻ góc xanh · Coach (đầu trang)', '.tn-side.coach img'],
  ['career.hero.fighter', 'hero', 'Ảnh thẻ góc đỏ · Võ sĩ (đầu trang)', '.tn-side.fighter img'],
  ['career.plan.coach', 'fee', 'Ảnh đầu thẻ học phí · Coach', '.tn-plan.coach .tn-plan-top img'],
  ['career.plan.fighter', 'fee', 'Ảnh đầu thẻ học phí · Võ sĩ', '.tn-plan.fighter .tn-plan-top img'],
  ['career.help.img', 'help', 'Ảnh khung “Còn băn khoăn?”', '.tn-help-img img'],
];
const MEASURE = sels => `(${JSON.stringify(sels)}).map(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
  return { src: e.getAttribute('src'), n: [e.naturalWidth, e.naturalHeight], b: [Math.round(r.width), Math.round(r.height)], cover: cs.objectFit === 'cover' }; })`;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
function rec(desk, mob, cover) {
  const [w0, h0] = desk[0] >= mob[0] ? desk : mob, w = Math.min(2000, Math.ceil(w0 * 2 / 10) * 10), h = Math.round(w * h0 / w0);
  const g = gcd(w0, h0), rw = w0 / g, rh = h0 / g, ratio = rw <= 21 && rh <= 21 ? rw + ':' + rh : (w0 / h0).toFixed(2).replace(/\.?0+$/, '') + ':1';
  return { w, h, ratio, maxKB: 350, format: 'JPG hoặc WebP', ...(cover ? { cover: true } : {}) };
}

(async () => {
  const sb = await start();
  const b = await Browser.launch();
  try {
    const p = await b.newPage();
    const dump = {}, shots = {};
    for (const pg of PAGES) {
      await p.viewport(1366, 900, false);
      await p.goto(sb.base + pg.url + '?cmsdump', { wait: 1500 });
      dump[pg.id] = await p.eval('window.__cmsDump || null');
      if (!dump[pg.id]) throw new Error(pg.url + ': không đọc được window.__cmsDump');
      if (pg.id === 'career') {
        shots.desktop = await p.eval(MEASURE(MEDIA.map(m => m[3])));
        await p.viewport(375, 812, true);
        await p.goto(sb.base + pg.url, { wait: 1500 });
        shots.mobile = await p.eval(MEASURE(MEDIA.map(m => m[3])));
      }
      const errs = p.takeErrors();
      if (errs.length) throw new Error(pg.url + ': lỗi JS ' + errs.join(' | '));
    }

    const cat = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const prevF = new Map(cat.fields.filter(f => OWN.includes(f.page)).map(f => [f.key, f]));
    cat.pages = cat.pages.filter(x => !OWN.includes(x.id)).concat(PAGES);
    cat.sections = cat.sections.filter(x => !OWN.includes(x.page));
    cat.fields = cat.fields.filter(x => !OWN.includes(x.page));
    cat.media = (cat.media || []).filter(x => !OWN.includes(x.page));
    const extra = SEO_EXTRA(), count = {};
    for (const pg of PAGES) {
      const P = pg.id, secs = SECTIONS[P];
      secs.forEach(([id, label, view], i) => cat.sections.push({ id: P + '.' + id, page: P, label, order: i + 1, ...(view ? { view } : {}) }));
      let order = 0;
      const add = (key, sec, label, type, vi, en) => {
        const prev = prevF.get(key);
        cat.fields.push({ key, page: P, section: P + '.' + sec, type, label, vi, en: en != null && en !== '' ? en : null, html: false, src: 'js', locate: type !== 'seo', order: ++order, ...(prev && prev.hidden ? { hidden: true } : {}) });
        count[P] = (count[P] || 0) + 1;
      };
      for (const [k, label, vi] of extra[P]) add(P + '.' + k, 'seo', label, 'seo', vi, null);
      const seen = new Set();
      for (const [key, vi, en] of dump[P]) {
        if (seen.has(key) || typeof vi !== 'string') continue;
        seen.add(key);
        const k = key.slice(P.length + 1);
        if (!vi.replace(PH, '').trim()) continue;                       // chỉ có chỗ tự điền (vd "{n}"): không có gì để sửa
        const rule = RULES[P].find(([re]) => re.test(k));
        if (!rule) throw new Error('chưa xếp khu vực cho khóa ' + key);
        add(key, rule[1], (rule[2] || labelOf(P, k, vi)) + note(vi, en), rule[3] || typeOf(k, vi), vi, en);
      }
    }
    MEDIA.forEach(([key, sec, label], i) => {
      const d = shots.desktop[i], m = shots.mobile[i];
      if (!d) throw new Error('không thấy ảnh ' + key);
      cat.media.push({ key, page: 'career', section: 'career.' + sec, kind: 'image', url: d.src, alt: '', src: 'js', order: 100000 + i, sections: ['career.' + sec],
        natural: d.n, box: { desktop: d.b, mobile: m ? m.b : d.b }, hidden: false, rec: rec(d.b, m ? m.b : d.b, d.cover), label });
    });
    fs.writeFileSync(OUT, JSON.stringify(cat, null, 1));
    console.log('ô chữ:', JSON.stringify(count), '· ảnh:', MEDIA.length, '· khu vực:', cat.sections.filter(s => OWN.includes(s.page)).length);
  } finally { await b.close(); await sb.stop(); }
})().catch(e => { console.error(e); process.exit(1); });
