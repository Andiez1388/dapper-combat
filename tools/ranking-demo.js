/*
 * Dữ liệu mẫu cho Dapper Combat Academy Ranking: 20 võ sĩ (14 nam, 6 nữ), 8 sự kiện (fight night, sparring, kỳ đánh giá, 2 sự kiện sắp tới)
 * và ảnh minh họa (SVG vẽ tay, không phải ảnh người thật) — thay bằng ảnh thật ở /admin → Academy Ranking.
 *   node tools/ranking-demo.js   → ghi data/seed/fighters.json, data/seed/events.json, public/assets/img/fighters/demo-XX.svg
 * Chạy lại an toàn (cùng kết quả). Dữ liệu đang chạy (data/fighters.json…) không bị đụng tới.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IMG = path.join(ROOT, 'public', 'assets', 'img', 'fighters');
const COACH = 'Phong Dapper';

// [mã, tên, biệt danh, giới tính, ngày sinh, cân nặng, hạng cân, thế đứng, cao, sải tay, quê, ngày vào Academy, kỹ năng [kỹ thuật, tốc độ, sức mạnh, phòng thủ, thể lực, di chuyển], trạng thái, vẻ ngoài]
// vẻ ngoài: [màu da, kiểu tóc, màu tóc, màu găng, màu áo, mũ bảo hộ]
const SKIN = ['#f3cfae', '#e8b892', '#d9a07a', '#c4865f', '#a86b49'];
const F = [
  ['vs01', 'Nguyễn Hoàng Long', 'Rồng Đen', 'm', '1998-04-12', 63.5, 'light', 'orthodox', 172, 176, 'TP. Hồ Chí Minh', '2023-02-10', [88, 86, 82, 85, 87, 88], 'active', [1, 'side', '#15100c', '#D4372E', '#111111', 0]],
  ['vs02', 'Trần Minh Quân', 'The Hammer', 'm', '1996-09-03', 74.2, 'middle', 'orthodox', 180, 184, 'Hà Nội', '2022-11-05', [80, 74, 92, 76, 82, 74], 'active', [2, 'buzz', '#1d1510', '#111111', '#D4372E', 0]],
  ['vs03', 'Lê Đức Anh', 'Tia Chớp', 'm', '2000-01-22', 59.4, 'feather', 'southpaw', 168, 170, 'Đà Nẵng', '2023-06-01', [84, 91, 70, 80, 83, 89], 'active', [0, 'short', '#16110d', '#1f4fa3', '#f2f2f2', 0]],
  ['vs04', 'Phạm Gia Huy', 'Iron', 'm', '1997-07-15', 68.1, 'welter', 'orthodox', 175, 178, 'Hải Phòng', '2023-01-15', [78, 76, 80, 82, 85, 74], 'active', [2, 'side', '#211812', '#f2f2f2', '#2b3a4a', 1]],
  ['vs05', 'Võ Thành Đạt', 'Núi Lửa', 'm', '1995-03-30', 92.5, 'heavy', 'orthodox', 186, 190, 'Bình Định', '2022-08-20', [72, 62, 93, 70, 72, 64], 'active', [3, 'bald', '#1d1510', '#D4372E', '#3d3d3d', 0]],
  ['vs06', 'Đặng Quốc Bảo', 'Bulldozer', 'm', '1999-12-02', 80.2, 'lheavy', 'orthodox', 182, 186, 'Cần Thơ', '2024-01-08', [70, 68, 84, 66, 78, 66], 'active', [3, 'buzz', '#15100c', '#c9a227', '#111111', 0]],
  ['vs07', 'Bùi Tuấn Kiệt', 'Mắt Bão', 'm', '2001-05-18', 55.6, 'bantam', 'orthodox', 165, 167, 'TP. Hồ Chí Minh', '2024-03-02', [76, 82, 66, 78, 80, 80], 'active', [1, 'short', '#241a13', '#111111', '#D4372E', 1]],
  ['vs08', 'Huỳnh Nhật Minh', 'Kid Saigon', 'm', '2003-08-09', 63.2, 'light', 'switch', 173, 175, 'TP. Hồ Chí Minh', '2024-05-20', [74, 80, 70, 68, 76, 79], 'active', [0, 'side', '#2a1d14', '#1f4fa3', '#111111', 0]],
  ['vs09', 'Ngô Thanh Tùng', 'Cobra', 'm', '1998-10-27', 67.4, 'welter', 'southpaw', 177, 182, 'Nghệ An', '2023-09-12', [77, 79, 74, 72, 74, 78], 'active', [2, 'short', '#16110d', '#2e7d32', '#f2f2f2', 0]],
  ['vs10', 'Đỗ Khánh Duy', 'Silent', 'm', '2000-06-14', 73.5, 'middle', 'orthodox', 179, 181, 'Lâm Đồng', '2024-07-01', [68, 66, 74, 70, 72, 64], 'inactive', [1, 'buzz', '#2a1d14', '#3d3d3d', '#2b3a4a', 0]],
  ['vs11', 'Phan Văn Hậu', 'Ong Bắp Cày', 'm', '2002-02-11', 51.6, 'fly', 'orthodox', 162, 164, 'Quảng Nam', '2024-02-14', [70, 84, 58, 70, 78, 82], 'active', [2, 'short', '#15100c', '#c9a227', '#111111', 1]],
  ['vs12', 'Trịnh Bảo Nam', 'Lefty', 'm', '2002-11-30', 59.8, 'feather', 'southpaw', 170, 171, 'Đồng Nai', '2025-01-10', [64, 70, 62, 60, 68, 66], 'active', [0, 'buzz', '#1d1510', '#1f4fa3', '#D4372E', 0]],
  ['vs13', 'Lý Hải Đăng', 'Ngọn Hải Đăng', 'm', '1997-04-04', 79.6, 'lheavy', 'orthodox', 184, 189, 'Vũng Tàu', '2023-03-25', [79, 72, 83, 77, 80, 73], 'active', [4, 'side', '#15100c', '#f2f2f2', '#1f4fa3', 0]],
  ['vs14', 'Mai Xuân Phúc', 'Big Phúc', 'm', '2003-01-19', 88.0, 'heavy', 'orthodox', 183, 185, 'Thanh Hóa', '2025-03-03', [58, 54, 72, 56, 60, 52], 'active', [1, 'buzz', '#2a1d14', '#111111', '#3d3d3d', 1]],
  ['vs15', 'Nguyễn Thảo Vy', 'Bé Hổ', 'f', '2001-07-07', 50.8, 'fly', 'orthodox', 158, 159, 'TP. Hồ Chí Minh', '2023-04-18', [83, 86, 70, 81, 84, 85], 'active', [0, 'pony', '#15100c', '#D4372E', '#111111', 0]],
  ['vs16', 'Trần Ngọc Hân', 'Nữ Hoàng', 'f', '1999-02-25', 54.3, 'bantam', 'orthodox', 162, 164, 'Huế', '2022-12-01', [86, 82, 74, 84, 85, 83], 'active', [1, 'bun', '#1d1510', '#c9a227', '#D4372E', 0]],
  ['vs17', 'Lê Khánh Linh', 'Chớp Hồng', 'f', '2000-09-16', 58.7, 'feather', 'southpaw', 165, 166, 'Hà Nội', '2023-10-05', [78, 80, 72, 74, 79, 77], 'active', [0, 'bob', '#241a13', '#e05a8c', '#111111', 0]],
  ['vs18', 'Phạm Thu Trang', 'Thép', 'f', '1998-05-05', 62.4, 'light', 'orthodox', 167, 169, 'Bắc Ninh', '2023-07-22', [75, 72, 80, 76, 82, 70], 'active', [2, 'pony', '#16110d', '#111111', '#2b3a4a', 1]],
  ['vs19', 'Võ Mỹ Duyên', 'Mèo Rừng', 'f', '2003-12-12', 51.2, 'fly', 'orthodox', 156, 157, 'Tây Ninh', '2024-09-09', [66, 74, 60, 64, 70, 72], 'active', [2, 'bun', '#2a1d14', '#1f4fa3', '#f2f2f2', 0]],
  ['vs20', 'Hoàng Anh Thư', 'Blaze', 'f', '2002-03-08', 55.4, 'bantam', 'switch', 163, 165, 'Khánh Hòa', '2024-06-15', [70, 76, 66, 68, 74, 72], 'active', [1, 'bob', '#1d1510', '#D4372E', '#3d3d3d', 0]],
];
// giới thiệu ngắn (VI, EN) theo phong cách thi đấu
const BIO = {
  vs01: ['Đội trưởng Academy, lối đánh toàn diện, kiểm soát khoảng cách tốt và ra đòn kết hợp nhanh. Chưa thua trận nào trong năm 2026.', 'Academy captain with a complete game, excellent distance control and fast combinations. Unbeaten in 2026.'],
  vs02: ['Tay đấm nặng ký nhất hạng Trung, thích áp sát và tung cú móc phải uy lực.', 'The heaviest hitter at middleweight — loves to pressure and land a big right hook.'],
  vs03: ['Võ sĩ tay trái với tốc độ chân và tay thuộc hàng nhanh nhất Academy.', 'A southpaw with some of the fastest hands and feet in the academy.'],
  vs04: ['Bền bỉ, phòng thủ chắc, thắng nhờ thể lực vượt trội ở hiệp cuối.', 'Durable with a tight guard; wins the late rounds on conditioning.'],
  vs05: ['Hạng nặng có sức đấm mạnh nhất Academy, đa số trận thắng kết thúc sớm.', 'The hardest puncher in the academy — most of his wins end early.'],
  vs06: ['Áp sát liên tục, chịu đòn tốt, đang cải thiện kỹ thuật phòng thủ.', 'Relentless pressure fighter with a strong chin, sharpening his defense.'],
  vs07: ['Phản đòn sắc bén, đọc trận tốt, luôn giữ bình tĩnh trong góc đài.', 'Sharp counter-puncher who reads opponents well and stays calm on the ropes.'],
  vs08: ['Đổi thế đứng linh hoạt, phong cách tấn công nhiều màu sắc.', 'A switch-hitter with a flashy, high-volume attacking style.'],
  vs09: ['Tay trái sải dài, ra đòn thẳng chính xác như rắn hổ mang.', 'Long-armed southpaw with snake-quick, accurate straight punches.'],
  vs10: ['Đang tạm nghỉ thi đấu để hồi phục chấn thương vai.', 'Currently inactive while recovering from a shoulder injury.'],
  vs11: ['Nhỏ con nhưng tốc độ cao, di chuyển liên tục và ra đòn từ mọi góc.', 'Small but fast — constantly moving and punching from every angle.'],
  vs12: ['Tân binh tay trái tiến bộ nhanh sau khóa Foundation.', 'A fast-improving southpaw rookie fresh out of the Foundation course.'],
  vs13: ['Sải tay dài nhất Academy, giữ đối thủ ở xa bằng cú jab chuẩn mực.', 'The longest reach in the academy, keeping opponents away with a textbook jab.'],
  vs14: ['Tân binh hạng nặng, sức mạnh tốt, đang luyện thêm thể lực và di chuyển.', 'A heavyweight rookie with real power, working on stamina and footwork.'],
  vs15: ['Nữ võ sĩ hạng Ruồi số một, tốc độ cao và lì đòn.', 'The top women\'s flyweight — fast, tough and relentless.'],
  vs16: ['Nữ võ sĩ dày dạn nhất Academy, kỹ thuật tinh tế và chưa từng thua.', 'The academy\'s most experienced woman fighter — technically polished and unbeaten.'],
  vs17: ['Tay trái khó chịu, giỏi đánh lùi và phản công.', 'An awkward southpaw who excels at fighting off the back foot.'],
  vs18: ['Sức đấm và thể lực tốt, áp đảo đối thủ bằng nhịp độ cao.', 'Strong and well-conditioned; overwhelms opponents with a high work rate.'],
  vs19: ['Mới gia nhập, tinh thần chiến đấu cao, đang tích lũy kinh nghiệm sparring.', 'A newer member with plenty of fight, building sparring experience.'],
  vs20: ['Đổi thế đứng tốt, đang dần tìm được nhịp độ thi đấu.', 'A capable switch-hitter who is finding her rhythm in competition.'],
};

const GYM = 'Dapper Combat Gym', CITY = 'TP. Hồ Chí Minh';
// [mã, tên VI, tên EN, ngày, giờ, loại, mô tả VI, mô tả EN, trận: [góc đỏ, góc xanh, hạng cân, số hiệp, kết quả, cách thắng, hiệp, thời gian, trận chính]]
const E = [
  ['sk01', 'Dapper Fight Night #1', 'Dapper Fight Night #1', '2026-03-14', '19:00', 'fight', 'Đêm thi đấu nội bộ đầu tiên của năm, 6 trận theo luật boxing nghiệp dư (3 hiệp × 2 phút).', 'The first in-house fight night of the year: 6 bouts under amateur rules (3 × 2-minute rounds).', [
    ['vs01', 'vs08', 'light', 3, 'a', 'UD', 0, '', 1], ['vs02', 'vs10', 'middle', 3, 'a', 'TKO', 2, '1:48'], ['vs04', 'vs09', 'welter', 3, 'b', 'SD'],
    ['vs16', 'vs20', 'bantam', 3, 'a', 'UD'], ['vs05', 'vs14', 'heavy', 3, 'a', 'KO', 1, '2:05'], ['vs03', 'vs12', 'feather', 3, 'a', 'UD']]],
  ['sk02', 'Sparring Day — Tháng 5', 'Sparring Day — May', '2026-05-16', '09:00', 'sparring', 'Buổi sparring có chấm điểm, mỗi cặp 2 hiệp. Kết quả được tính vào bảng xếp hạng.', 'Scored sparring session, 2 rounds per pair. Results count towards the rankings.', [
    ['vs15', 'vs19', 'fly', 2, 'a', 'PTS'], ['vs07', 'vs11', 'bantam', 2, 'draw', 'PTS'], ['vs06', 'vs13', 'lheavy', 2, 'b', 'PTS'],
    ['vs17', 'vs18', 'light', 2, 'b', 'PTS'], ['vs08', 'vs12', 'light', 2, 'a', 'PTS']]],
  ['sk03', 'Dapper Fight Night #2', 'Dapper Fight Night #2', '2026-06-20', '19:00', 'fight', 'Trận chính 5 hiệp hạng Bán nặng giữa Trần Minh Quân và Lý Hải Đăng.', 'Main event: a 5-round light heavyweight bout between Tran Minh Quan and Ly Hai Dang.', [
    ['vs02', 'vs13', 'lheavy', 5, 'b', 'UD', 0, '', 1], ['vs01', 'vs09', 'welter', 3, 'a', 'KO', 3, '0:47'], ['vs16', 'vs15', 'bantam', 3, 'a', 'SD'],
    ['vs03', 'vs07', 'feather', 3, 'a', 'UD'], ['vs05', 'vs06', 'heavy', 3, 'a', 'TKO', 2, '1:12'], ['vs18', 'vs17', 'light', 3, 'a', 'MD'], ['vs11', 'vs12', 'feather', 3, 'a', 'UD']]],
  ['sk04', 'Kỳ đánh giá kỹ năng Quý III', 'Q3 Skills Assessment', '2026-08-01', '08:00', 'assessment', 'HLV chấm 6 kỹ năng cho toàn bộ võ sĩ đang thi đấu: kỹ thuật, tốc độ, sức mạnh, phòng thủ, thể lực, di chuyển.', 'Coaches score every active fighter on 6 skills: technique, speed, power, defense, stamina and footwork.', []],
  ['sk05', 'Dapper Fight Night #3', 'Dapper Fight Night #3', '2026-08-22', '19:00', 'fight', 'Trận chính 5 hiệp hạng Nhẹ: Nguyễn Hoàng Long gặp Lê Đức Anh.', 'Main event: 5 rounds at lightweight — Nguyen Hoang Long vs Le Duc Anh.', [
    ['vs01', 'vs03', 'light', 5, 'a', 'UD', 0, '', 1], ['vs13', 'vs06', 'lheavy', 3, 'a', 'TKO', 3, '1:30'], ['vs04', 'vs08', 'welter', 3, 'a', 'UD'],
    ['vs15', 'vs20', 'bantam', 3, 'a', 'UD'], ['vs16', 'vs17', 'feather', 3, 'a', 'UD'], ['vs02', 'vs05', 'heavy', 3, 'a', 'RTD', 2], ['vs09', 'vs10', 'middle', 3, 'a', 'UD']]],
  ['sk06', 'Sparring Day — Tháng 10', 'Sparring Day — October', '2026-10-10', '09:00', 'sparring', 'Sparring có chấm điểm chuẩn bị cho Fight Night #4.', 'Scored sparring ahead of Fight Night #4.', [
    ['vs07', 'vs11', 'bantam', 2, 'a', 'PTS'], ['vs19', 'vs20', 'bantam', 2, 'b', 'PTS'], ['vs14', 'vs05', 'heavy', 2, 'b', 'PTS'],
    ['vs08', 'vs09', 'welter', 2, 'draw', 'PTS'], ['vs18', 'vs17', 'light', 2, 'a', 'PTS'], ['vs12', 'vs03', 'feather', 2, 'b', 'PTS']]],
  ['sk07', 'Dapper Fight Night #4', 'Dapper Fight Night #4', '2026-11-21', '19:00', 'fight', 'Long “Rồng Đen” lên hạng Bán trung gặp Phạm Gia Huy; tái đấu Hân – Vy và Đăng – Quân.', 'Long “Black Dragon” moves up to welterweight to face Pham Gia Huy, plus the Han – Vy and Dang – Quan rematches.', [
    ['vs01', 'vs04', 'welter', 5, '', '', 0, '', 1], ['vs13', 'vs02', 'lheavy', 5, ''], ['vs16', 'vs15', 'bantam', 3, ''],
    ['vs03', 'vs07', 'feather', 3, ''], ['vs17', 'vs20', 'feather', 3, ''], ['vs05', 'vs14', 'heavy', 3, '']]],
  ['sk08', 'Year-End Showdown 2026', 'Year-End Showdown 2026', '2026-12-19', '18:30', 'fight', 'Đêm thi đấu tổng kết năm và trao danh hiệu Võ sĩ của năm.', 'The year-end fight night and Fighter of the Year awards.', [
    ['vs09', 'vs08', 'welter', 3, '', '', 0, '', 1], ['vs11', 'vs12', 'feather', 3, ''], ['vs18', 'vs17', 'light', 3, ''], ['vs06', 'vs14', 'heavy', 3, '']]],
];

/* ─── Ảnh minh họa (SVG) ──────────────────────────────────────────────────── */
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); return '#' + [16, 8, 0].map(s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k))).toString(16).padStart(2, '0')).join(''); }
function portrait([skinI, hair, hairColor, glove, top, gear], female, no) {
  const skin = SKIN[skinI], sd = shade(skin, 0.86), hc = hairColor, cuff = glove === '#f2f2f2' ? '#d6d6d6' : shade(glove, 0.72);
  const bg = female ? ['#2a2433', '#0e0c12'] : ['#1f2a36', '#0b0f14'];
  const back = {
    pony: `<path d="M246 128 C312 140 322 232 292 306 C280 272 272 232 250 196 Z" fill="${hc}"/>`,
    bob: `<path d="M128 196 C122 120 166 96 200 96 C234 96 278 120 272 196 L276 262 C262 270 248 268 240 258 L160 258 C152 268 138 270 124 262 Z" fill="${hc}"/>`,
  }[hair] || '';
  const front = {
    buzz: `<path d="M138 182 C136 122 168 106 200 106 C232 106 264 122 262 182 C254 152 234 136 200 136 C166 136 146 152 138 182 Z" fill="${hc}" opacity=".92"/>`,
    short: `<path d="M136 184 C130 116 168 98 200 98 C236 98 270 116 264 184 C258 160 250 150 240 146 L232 162 L222 140 L210 158 L198 138 L186 158 L176 140 L166 160 L158 146 C148 152 140 166 136 184 Z" fill="${hc}"/>`,
    side: `<path d="M136 188 C128 112 172 96 208 98 C248 100 272 126 264 188 C258 150 238 132 214 134 C202 150 172 158 148 150 C142 160 138 174 136 188 Z" fill="${hc}"/>`,
    bald: `<ellipse cx="178" cy="132" rx="22" ry="9" fill="#fff" opacity=".18" transform="rotate(-18 178 132)"/>`,
    pony: `<path d="M136 190 C128 114 170 96 204 98 C244 100 272 124 264 190 C256 150 234 128 200 128 C176 140 156 156 136 190 Z" fill="${hc}"/>`,
    bun: `<circle cx="200" cy="100" r="26" fill="${hc}"/><path d="M136 188 C128 116 170 100 200 100 C230 100 272 116 264 188 C256 148 232 128 200 128 C168 128 144 148 136 188 Z" fill="${hc}"/>`,
    bob: `<path d="M134 196 C128 118 170 98 200 98 C232 98 272 118 266 196 C262 160 240 134 200 136 C178 150 152 160 134 196 Z" fill="${hc}"/>`,
  }[hair];
  const brow = female ? 'stroke-width="3.5"' : 'stroke-width="6"';
  const helmet = gear ? `<path fill-rule="evenodd" fill="${glove === '#f2f2f2' ? '#1f4fa3' : glove}" d="M200 98 C252 98 276 140 276 196 C276 246 252 282 220 286 L220 262 C240 254 250 230 250 202 C250 168 230 150 200 150 C170 150 150 168 150 202 C150 230 160 254 180 262 L180 286 C148 282 124 246 124 196 C124 140 148 98 200 98 Z"/><rect x="186" y="104" width="28" height="44" rx="10" fill="#000" opacity=".12"/>` : '';
  const g = (x, rot, flip) => `<g transform="translate(${x} 318) rotate(${rot})${flip ? ' scale(-1 1)' : ''}">
    <rect x="-38" y="44" width="76" height="40" rx="9" fill="${cuff}"/><rect x="-38" y="58" width="76" height="6" fill="#000" opacity=".15"/>
    <rect x="-46" y="-58" width="92" height="108" rx="42" fill="${glove}"/><ellipse cx="34" cy="0" rx="15" ry="30" fill="${shade(glove === '#111111' ? '#3a3a3a' : glove, 0.9)}"/>
    <path d="M-30 -40 C-14 -54 14 -54 28 -42" stroke="#fff" stroke-opacity=".28" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>
<radialGradient id="l" cx=".5" cy=".28" r=".62"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="500" fill="url(#b)"/><rect width="400" height="500" fill="url(#l)"/>
<g stroke="#fff" stroke-opacity=".07" stroke-width="7"><path d="M0 128 L400 112"/><path d="M0 178 L400 166"/><path d="M0 228 L400 220"/></g>
<text x="384" y="452" text-anchor="end" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="120" fill="#fff" fill-opacity=".04">DC</text>
<path d="M54 500 C62 404 116 360 160 350 L240 350 C284 360 338 404 346 500 Z" fill="${skin}"/>
<path d="M116 500 L126 384 C150 398 174 404 200 404 C226 404 250 398 274 384 L284 500 Z" fill="${top}"/>
<path d="M172 246 L172 302 C186 318 214 318 228 302 L228 246 Z" fill="${sd}"/>
${back}
<ellipse cx="139" cy="196" rx="10" ry="17" fill="${sd}"/><ellipse cx="261" cy="196" rx="10" ry="17" fill="${sd}"/>
<ellipse cx="200" cy="190" rx="62" ry="76" fill="${skin}"/>
<path d="M164 172 Q178 ${female ? 164 : 166} 190 172 M210 172 Q222 ${female ? 164 : 166} 236 172" stroke="${hc}" ${brow} fill="none" stroke-linecap="round"/>
<ellipse cx="178" cy="190" rx="6" ry="${female ? 5 : 4}" fill="#1b1410"/><ellipse cx="222" cy="190" rx="6" ry="${female ? 5 : 4}" fill="#1b1410"/>
<path d="M200 196 Q193 214 198 219 Q204 221 208 216" stroke="${shade(skin, 0.7)}" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M184 236 Q200 ${female ? 245 : 241} 216 236" stroke="${female ? '#a8505a' : '#6b3b2e'}" stroke-width="${female ? 5 : 4}" fill="none" stroke-linecap="round"/>
${front}${helmet}
<rect x="92" y="372" width="56" height="128" fill="${skin}"/><rect x="252" y="372" width="56" height="128" fill="${skin}"/>
${g(148, -10, false)}${g(252, 10, true)}
<rect y="470" width="400" height="30" fill="#D4372E"/>
<text x="16" y="490" font-family="Arial,sans-serif" font-weight="700" font-size="13" letter-spacing="3" fill="#fff">DAPPER COMBAT</text>
<text x="384" y="490" text-anchor="end" font-family="Arial,sans-serif" font-weight="700" font-size="13" letter-spacing="2" fill="#fff">#${no}</text>
<text x="384" y="26" text-anchor="end" font-family="Arial,sans-serif" font-size="11" letter-spacing="2" fill="#fff" fill-opacity=".45">ẢNH DEMO</text>
</svg>
`;
}

/* ─── Ghi file ────────────────────────────────────────────────────────────── */
const SK = ['technique', 'speed', 'power', 'defense', 'stamina', 'footwork'];
const skills = arr => Object.fromEntries(SK.map((k, i) => [k, arr[i]]));
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const T0 = Date.parse('2026-10-29T00:00:00Z');
// hồ sơ mẫu theo kỹ năng: nhận xét HLV (điểm mạnh = 2 kỹ năng cao nhất, cần cải thiện = thấp nhất), lối đánh, mục tiêu, vài chiêu tự đặt tên
const STRONG = {
  technique: ['Đòn thẳng gọn, combo 1-2-3 mạch lạc', 'Clean straight punches, tidy 1-2-3 combinations'],
  speed: ['Ra đòn nhanh, thường đánh trước đối thủ', 'Fast hands, usually lands first'],
  power: ['Đòn tay sau rất nặng, đe dọa KO', 'Heavy rear hand, a real KO threat'],
  defense: ['Che chắn tốt, ít trúng đòn sạch', 'Tight guard, rarely takes clean shots'],
  stamina: ['Giữ nhịp tốt tới hiệp cuối', 'Keeps the pace up to the final round'],
  footwork: ['Di chuyển khéo, kiểm soát khoảng cách', 'Smart footwork, controls the distance'],
};
const WEAK = {
  technique: ['Kỹ thuật đòn móc còn thô, cần sửa tư thế', 'Hooks are still rough, posture needs work'],
  speed: ['Ra đòn còn chậm, dễ bị đánh trước', 'Slow to throw, often beaten to the punch'],
  power: ['Đòn chưa đủ nặng để buộc đối thủ lùi', 'Punches lack the weight to back opponents up'],
  defense: ['Hay hạ tay sau khi ra đòn', 'Drops the hands after punching'],
  stamina: ['Hụt hơi từ hiệp 3, cần tăng thể lực', 'Fades from round 3, needs more conditioning'],
  footwork: ['Đứng chân còn nặng, hay bị dồn vào góc', 'Flat-footed, gets trapped in the corner'],
};
const STYLE = {
  technique: ['Kỹ thuật, đánh combo gọn', 'Technical, clean combinations'], speed: ['Tốc độ, ra đòn trước', 'Speed, first to strike'],
  power: ['Áp sát, đòn nặng', 'Pressure and heavy shots'], defense: ['Phòng thủ phản công', 'Defend and counter'],
  stamina: ['Ép nhịp liên tục', 'Relentless pace'], footwork: ['Di chuyển, đánh từ xa', 'Move and box from range'],
};
const GOAL = [['Vào top 3 hạng cân trong năm 2026', 'Reach the division top 3 in 2026'], ['Giữ chuỗi thắng tới hết năm', 'Keep the win streak to the end of the year'],
  ['Lên Hạng A ở kỳ đánh giá tới', 'Move up to Class A at the next assessment'], ['Thắng trận đầu tiên bằng KO', 'Get a first KO win']];
const NOTE = [['Tập chăm, nghe góp ý tốt. Cần thêm trận thực chiến để tích kinh nghiệm.', 'Hard-working and coachable. Needs more live bouts to build experience.'],
  ['Tiến bộ rõ sau 2 kỳ đánh giá. Nên tập thêm sparring với người cao hơn.', 'Clear progress over two assessments. Should spar more with taller partners.'],
  ['Có tố chất thi đấu, giữ bình tĩnh tốt dưới áp lực.', 'A natural competitor who stays calm under pressure.']];
const ULT = [['Móc trái hạ màn', 'Curtain-closing left hook', 'Tung móc trái ngay khi đối thủ hạ tay sau cú jab.', 'Lands the left hook the moment the opponent drops the hands after a jab.'],
  ['Overhand phải', 'Right overhand', 'Vòng tay sau qua che chắn, nhắm thẳng thái dương.', 'Loops the rear hand over the guard straight to the temple.']];
const pairOf = a => ({ vi: a[0], en: a[1] });
function profile(sk, i, joined) {
  const order = SK.map((k, j) => [k, sk[j]]).sort((a, b) => b[1] - a[1]);
  const p = {
    style: pairOf(STYLE[order[0][0]]), goal: pairOf(GOAL[i % GOAL.length]),
    evalStrong: { vi: STRONG[order[0][0]][0] + '\n' + STRONG[order[1][0]][0], en: STRONG[order[0][0]][1] + '\n' + STRONG[order[1][0]][1] },
    evalWeak: pairOf(WEAK[order[5][0]]), evalNote: pairOf(NOTE[i % NOTE.length]),
    started: Number(joined.slice(0, 4)) - (i % 3) + joined.slice(4, 7), otherArts: ['', 'Muay Thái', '', 'Karate', ''][i % 5], priorRecord: i % 4 === 1 ? 'Nghiệp dư 2-1-0' : '',
    idol: ['Manny Pacquiao', '', 'Canelo Álvarez', '', 'Naoya Inoue'][i % 5], moves: {},
  };
  if (i % 4 === 0) {
    const u = ULT[(i / 4) % ULT.length];
    p.moves.ult = { name: { vi: u[0], en: u[1] }, desc: { vi: u[2], en: u[3] } };
  }
  return p;
}
fs.mkdirSync(IMG, { recursive: true });
const fighters = F.map(([id, name, nick, gender, birth, weight, division, stance, height, reach, hometown, joined, sk, status, look], i) => {
  const no = String(i + 1).padStart(2, '0');
  fs.writeFileSync(path.join(IMG, `demo-${no}.svg`), portrait(look, gender === 'f', no));
  // 3 lần chấm điểm trong năm: tiến bộ dần tới điểm hiện tại
  const assess = [['2026-02-01', 6], ['2026-05-01', 3], ['2026-08-01', 0]]
    .filter(([d]) => d >= joined || d === '2026-08-01')
    .map(([d, minus], k) => ({ date: d, skills: skills(sk.map((v, j) => Math.max(30, v - minus + ((j + k) % 2)))), note: k === 2 ? 'Kỳ đánh giá kỹ năng Quý III' : '', by: COACH }));
  assess[assess.length - 1].skills = skills(sk);
  return {
    id, createdAt: T0, name, nickname: nick, gender, birth, weight, division, stance, height, reach, hometown, joined, coach: COACH,
    photo: `/assets/img/fighters/demo-${no}.svg`, status, visible: true, bio: { vi: BIO[id][0], en: BIO[id][1] },
    skills: skills(sk), assessments: assess, slug: slug(name), updatedAt: T0, ...profile(sk, i, joined),
    private: { phone: '', emName: '', emRelation: '', emPhone: '', health: '' },
  };
});
const events = E.map(([id, vi, en, date, time, type, dvi, den, bouts]) => ({
  id, createdAt: T0, name: { vi, en }, date, time, type, venue: GYM, city: CITY, desc: { vi: dvi, en: den }, poster: '', visible: true,
  bouts: bouts.map(([a, b, division, rounds, result, method = '', round = 0, t = '', main = 0], k) => ({
    id: id.replace('sk', 'tr') + '-' + (k + 1), a, b, division, rounds, result, method: result && result !== 'nc' ? method : '',
    round: ['KO', 'TKO', 'RTD', 'DQ'].includes(method) ? round || rounds : 0, time: t, main: !!main, note: '',
  })),
  slug: slug(vi + '-' + date.slice(0, 7)), updatedAt: T0,
}));
const seed = path.join(ROOT, 'data', 'seed');
fs.writeFileSync(path.join(seed, 'fighters.json'), JSON.stringify(fighters, null, 2) + '\n');
fs.writeFileSync(path.join(seed, 'events.json'), JSON.stringify(events, null, 2) + '\n');
console.log(`${fighters.length} võ sĩ · ${events.length} sự kiện · ${events.reduce((s, e) => s + e.bouts.length, 0)} trận · ảnh ở public/assets/img/fighters/`);
