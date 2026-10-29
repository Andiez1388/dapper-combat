/* Dapper Combat Academy Ranking — /xep-hang (ranking), /vo-si (danh sách) · /vo-si/<võ sĩ> (hồ sơ), /su-kien (lịch, kết quả) · /su-kien/<sự kiện>, /so-sanh.
   Dữ liệu: window.__DC_RANKING (/assets/data/ranking.js) — server đã tính điểm, thứ hạng, thành tích (lib/ranking.js).
   Võ sĩ, sự kiện, kết quả, điểm kỹ năng sửa ở /admin → Academy Ranking.
   Mỗi trang: dải tối đầu trang (hero) + nội dung trên nền sáng (cột chính + cột phải). */
(function () {
  'use strict';
  var D = window.__DC_RANKING || { fighters: [], events: [], divisions: [], skills: [], tiers: [], updated: '' };
  var root = document.getElementById('xh');
  if (!root) return;
  var esc = DC.esc;

  var T = {
    vi: {
      'site.home': 'Trang chủ', 'site.shop': 'Shop', 'site.course': 'Khóa học', 'site.services': 'Dịch vụ Setup',
      'nav.events': 'Lịch sự kiện', 'nav.ranking': 'Ranking võ sĩ', 'nav.fighters': 'Thông tin võ sĩ', 'search.ph': 'Tìm võ sĩ…', 'search.go': 'Tìm',
      'foot.note': 'Dapper Combat Academy Ranking là bảng xếp hạng nội bộ học viện, chỉ tính các trận đấu, buổi sparring có chấm điểm và kỳ đánh giá kỹ năng tại Dapper Combat Academy.', 'foot.home': 'Về trang chủ Dapper Combat',
      'rank.title': 'Ranking võ sĩ', 'rank.h.m': 'Ranking võ sĩ nam', 'rank.h.f': 'Ranking võ sĩ nữ', 'rank.hd.m': '{div} nam', 'rank.hd.f': '{div} nữ',
      'rank.sub': 'Bảng xếp hạng nội bộ Dapper Combat Academy, tính từ điểm kỹ năng do HLV chấm và kết quả từng trận.',
      'updated': 'Cập nhật {d}', 'g.m': 'Nam', 'g.f': 'Nữ', 'g.all': 'Tất cả',
      'f.div': 'Hạng cân', 'f.tier': 'Hạng', 'f.status': 'Trạng thái', 'f.allDiv': 'Tất cả hạng cân', 'f.allTier': 'Tất cả hạng', 'f.allStatus': 'Mọi trạng thái', 'f.inactive': 'Hiện cả võ sĩ nghỉ thi đấu', 'f.q': 'Tên hoặc biệt danh…',
      'col.fighter': 'Võ sĩ', 'col.points': 'Điểm', 'col.stars': 'Sao', 'col.tier': 'Hạng', 'col.age': 'Tuổi', 'col.record': 'T-B-H', 'col.last6': '6 trận gần nhất', 'col.stance': 'Thế đứng',
      'col.div': 'Hạng cân', 'col.home': 'Quê quán', 'col.gender': 'Giới tính', 'col.status': 'Trạng thái',
      'stance.orthodox': 'Thuận', 'stance.southpaw': 'Tay trái', 'stance.switch': 'Đổi thế', 'status.active': 'Đang thi đấu', 'status.inactive': 'Nghỉ thi đấu',
      'res.W': 'T', 'res.L': 'B', 'res.D': 'H', 'res.NC': 'KQ', 'res.W.t': 'Thắng', 'res.L.t': 'Thua', 'res.D.t': 'Hòa', 'res.NC.t': 'Không kết quả',
      'none': 'Không có võ sĩ phù hợp. Thử bỏ bớt bộ lọc.', 'side.upcoming': 'Sự kiện sắp tới', 'side.latest': 'Kết quả mới nhất', 'side.all': 'Xem tất cả',
      'side.leaders.m': 'Số 1 từng hạng cân nam', 'side.leaders.f': 'Số 1 từng hạng cân nữ', 'side.top.m': 'Top 5 nam', 'side.top.f': 'Top 5 nữ', 'side.beat': 'thắng {n}',
      'side.sameDiv': 'Cùng hạng cân', 'side.noUp': 'Chưa có sự kiện sắp tới.',
      'how.title': 'Cách tính điểm',
      'how.1': 'Điểm kỹ năng: HLV chấm 6 kỹ năng (kỹ thuật, tốc độ, sức mạnh, phòng thủ, thể lực, di chuyển) theo thang 100; trung bình × 10 (tối đa 1.000).',
      'how.2': 'Điểm thắng thua: mỗi trận đấu / sparring có chấm điểm cộng hoặc trừ điểm như BoxRec — thắng đối thủ mạnh hơn được nhiều điểm, thua đối thủ yếu hơn mất nhiều điểm; thắng KO / TKO được thưởng thêm.',
      'how.3': 'Điểm xếp hạng = điểm kỹ năng + điểm thắng thua. Hạng: Tinh anh từ 850, Hạng A từ 750, B từ 650, C từ 550, dưới 550 là Tân binh.',
      'how.4': 'Sao (1–5) theo thứ hạng trong cùng giới tính. Chỉ võ sĩ đang thi đấu được xếp hạng.',
      'pf.points': 'Điểm xếp hạng', 'pf.rank': 'Thứ hạng', 'pf.tier': 'Hạng', 'pf.div': 'Hạng cân', 'pf.status': 'Trạng thái', 'pf.stance': 'Thế đứng', 'pf.age': 'Tuổi',
      'pf.height': 'Chiều cao', 'pf.reach': 'Sải tay', 'pf.weight': 'Cân nặng', 'pf.home': 'Quê quán', 'pf.joined': 'Gia nhập Academy', 'pf.coach': 'Huấn luyện viên', 'pf.debut': 'Trận đầu tiên',
      'pf.bouts': 'Số trận · số hiệp', 'pf.ko': 'Tỉ lệ thắng KO', 'pf.streak': 'Chuỗi hiện tại', 'pf.win': 'Thắng', 'pf.loss': 'Thua', 'pf.draw': 'Hòa', 'pf.kos': '{n} KO',
      'pf.inDiv': '#{r} / {n} {div}', 'pf.inClub': '#{r} / {n} {g} toàn Academy', 'pf.unranked': 'Chưa xếp hạng (nghỉ thi đấu)', 'pf.streakOf': '{n} trận {r} liên tiếp',
      'pf.ofDiv': 'trong {n} võ sĩ {div}', 'pf.facts': 'Hồ sơ võ sĩ',
      'sk.title': 'Đánh giá kỹ năng', 'sk.skill': 'Điểm kỹ năng', 'sk.fight': 'Điểm thắng thua', 'sk.total': 'Điểm xếp hạng', 'sk.avg': 'trung bình {n}/100',
      'sk.last': 'HLV chấm lần gần nhất: {d}', 'sk.hist': 'Lịch sử chấm điểm', 'sk.date': 'Ngày', 'sk.avgCol': 'Trung bình', 'sk.change': 'Thay đổi',
      'bh.title': 'Lịch sử thi đấu', 'bh.date': 'Ngày', 'bh.opp': 'Đối thủ', 'bh.event': 'Sự kiện', 'bh.res': 'KQ', 'bh.method': 'Cách thắng', 'bh.round': 'Hiệp', 'bh.pts': 'Điểm ±', 'bh.none': 'Chưa có trận nào.',
      'up.title': 'Trận sắp tới', 'bio.title': 'Giới thiệu', 'dir.title': 'Thông tin võ sĩ', 'dir.count': '{n} võ sĩ',
      'dir.sub': 'Hồ sơ, thành tích và điểm xếp hạng của từng võ sĩ thi đấu cho Dapper Combat Academy.',
      'ev.title': 'Lịch sự kiện', 'ev.upcoming': 'Sắp diễn ra', 'ev.results': 'Kết quả', 'ev.pending': 'Chờ cập nhật kết quả', 'ev.noUp': 'Chưa có sự kiện sắp tới.', 'ev.noRes': 'Chưa có kết quả.',
      'ev.sub': 'Fight night, sparring có chấm điểm và các kỳ đánh giá kỹ năng tại Academy, kèm kết quả từng trận.',
      'ev.red': 'Góc đỏ', 'ev.blue': 'Góc xanh', 'ev.rounds': '{n} hiệp', 'ev.main': 'Trận chính', 'ev.detail': 'Chi tiết', 'ev.bouts': '{n} trận', 'ev.about': 'Giới thiệu sự kiện',
      'ev.noBouts': 'Sự kiện không có trận đấu (đánh giá kỹ năng / hoạt động Academy).', 'ev.venue': 'Địa điểm', 'ev.time': 'Thời gian', 'ev.type': 'Loại sự kiện', 'ev.result': 'Kết quả',
      'ev.draw': 'Hòa', 'ev.nc': 'Không kết quả', 'ev.wins': '{n} thắng', 'ev.round': 'H{n}', 'ev.ptsCol': 'Điểm ±',
      'type.fight': 'Fight night', 'type.sparring': 'Sparring', 'type.assessment': 'Đánh giá kỹ năng', 'type.other': 'Hoạt động Academy',
      'm.KO': 'Hạ đo ván', 'm.TKO': 'Trọng tài dừng trận', 'm.RTD': 'Bỏ cuộc giữa hiệp', 'm.DQ': 'Truất quyền thi đấu', 'm.UD': 'Thắng điểm tuyệt đối', 'm.SD': 'Thắng điểm không tuyệt đối', 'm.MD': 'Thắng điểm đa số', 'm.PTS': 'Thắng điểm',
      'nf.title': 'Không tìm thấy', 'nf.fighter': 'Không tìm thấy võ sĩ này. Có thể đường dẫn đã sai hoặc võ sĩ không còn hiển thị.', 'nf.event': 'Không tìm thấy sự kiện này.', 'back.ranking': 'Về bảng ranking', 'back.events': 'Về lịch sự kiện',
      'yrs': '{n}', 'gm': 'nam', 'gf': 'nữ', 'cm': '{n} cm', 'kg': '{n} kg',
      'nav.compare': 'So sánh', 'view.all': 'Bảng tổng', 'view.div': 'Theo hạng cân', 'move.new': 'MỚI', 'move.title': 'So với trước {e}',
      'move.note': '± = thứ hạng tăng / giảm so với trước {e} ({d}).',
      'stats.title': 'Thống kê Academy', 'stats.fighters': 'Võ sĩ đang thi đấu', 'stats.events': 'Sự kiện đã tổ chức', 'stats.bouts': 'Trận đã có kết quả', 'stats.ko': 'Thắng KO / TKO', 'stats.rounds': 'Số hiệp đã đấu',
      'rec.title': 'Kỷ lục Academy', 'rec.streak': 'Chuỗi thắng hiện tại dài nhất', 'rec.streakN': '{n} trận', 'rec.wins': 'Nhiều trận thắng nhất', 'rec.ko': 'Nhiều KO nhất', 'rec.improve': 'Tiến bộ kỹ năng nhất',
      'chart.title': 'Diễn biến điểm xếp hạng', 'chart.start': 'Điểm kỹ năng', 'chart.none': 'Chưa có trận nào để vẽ biểu đồ.',
      'prob': 'Khả năng thắng (theo điểm)', 'prob.short': 'dự đoán theo điểm',
      'cmp.title': 'So sánh võ sĩ', 'cmp.with': 'So sánh với võ sĩ', 'cmp.go': 'So sánh', 'cmp.red': 'Góc đỏ', 'cmp.blue': 'Góc xanh', 'cmp.swap': 'Đổi góc ⇄',
      'cmp.hint': 'Chọn 2 võ sĩ để so điểm, kỹ năng, thông số và đối đầu.', 'cmp.stats': 'Thông số', 'cmp.skills': 'Kỹ năng', 'cmp.h2h': 'Đối đầu trực tiếp', 'cmp.noH2h': 'Hai võ sĩ chưa từng gặp nhau.',
    },
    en: {
      'site.home': 'Home', 'site.shop': 'Shop', 'site.course': 'Courses', 'site.services': 'Gym Setup',
      'nav.events': 'Events', 'nav.ranking': 'Rankings', 'nav.fighters': 'Fighters', 'search.ph': 'Search fighters…', 'search.go': 'Search',
      'foot.note': 'Dapper Combat Academy Ranking is the academy’s in-house ranking: only bouts, scored sparring and skills assessments held at Dapper Combat Academy count.', 'foot.home': 'Back to Dapper Combat',
      'rank.title': 'Fighter rankings', 'rank.h.m': 'Men’s rankings', 'rank.h.f': 'Women’s rankings', 'rank.hd.m': 'Men’s {div}', 'rank.hd.f': 'Women’s {div}',
      'rank.sub': 'In-house rankings for Dapper Combat Academy, built from coach skill scores and every bout result.',
      'updated': 'Updated {d}', 'g.m': 'Men', 'g.f': 'Women', 'g.all': 'All',
      'f.div': 'Division', 'f.tier': 'Class', 'f.status': 'Status', 'f.allDiv': 'All divisions', 'f.allTier': 'All classes', 'f.allStatus': 'Any status', 'f.inactive': 'Include inactive fighters', 'f.q': 'Name or nickname…',
      'col.fighter': 'Fighter', 'col.points': 'Points', 'col.stars': 'Rating', 'col.tier': 'Class', 'col.age': 'Age', 'col.record': 'W-L-D', 'col.last6': 'Last 6', 'col.stance': 'Stance',
      'col.div': 'Division', 'col.home': 'Hometown', 'col.gender': 'Sex', 'col.status': 'Status',
      'stance.orthodox': 'Orthodox', 'stance.southpaw': 'Southpaw', 'stance.switch': 'Switch', 'status.active': 'Active', 'status.inactive': 'Inactive',
      'res.W': 'W', 'res.L': 'L', 'res.D': 'D', 'res.NC': 'NC', 'res.W.t': 'Win', 'res.L.t': 'Loss', 'res.D.t': 'Draw', 'res.NC.t': 'No contest',
      'none': 'No fighters match. Try removing a filter.', 'side.upcoming': 'Upcoming events', 'side.latest': 'Latest results', 'side.all': 'View all',
      'side.leaders.m': 'Division leaders, men', 'side.leaders.f': 'Division leaders, women', 'side.top.m': 'Top 5 men', 'side.top.f': 'Top 5 women', 'side.beat': 'beat {n}',
      'side.sameDiv': 'Same division', 'side.noUp': 'No upcoming events.',
      'how.title': 'How points work',
      'how.1': 'Skill points: coaches score 6 skills (technique, speed, power, defense, stamina, footwork) out of 100; the average × 10 (max 1,000).',
      'how.2': 'Fight points: every bout and scored sparring adds or removes points, BoxRec-style — beating a stronger opponent earns more, losing to a weaker one costs more; KO / TKO wins get a bonus.',
      'how.3': 'Ranking points = skill points + fight points. Classes: Elite from 850, Class A from 750, B from 650, C from 550, Rookie below 550.',
      'how.4': 'Stars (1–5) follow the ranking within each sex. Only active fighters are ranked.',
      'pf.points': 'Ranking points', 'pf.rank': 'Ranking', 'pf.tier': 'Class', 'pf.div': 'Division', 'pf.status': 'Status', 'pf.stance': 'Stance', 'pf.age': 'Age',
      'pf.height': 'Height', 'pf.reach': 'Reach', 'pf.weight': 'Weight', 'pf.home': 'Hometown', 'pf.joined': 'Joined the academy', 'pf.coach': 'Coach', 'pf.debut': 'Debut',
      'pf.bouts': 'Bouts · rounds', 'pf.ko': 'KO win rate', 'pf.streak': 'Current streak', 'pf.win': 'Won', 'pf.loss': 'Lost', 'pf.draw': 'Drawn', 'pf.kos': '{n} KO',
      'pf.inDiv': '#{r} of {n} at {div}', 'pf.inClub': '#{r} of {n} {g} academy-wide', 'pf.unranked': 'Unranked (inactive)', 'pf.streakOf': '{n} {r} in a row',
      'pf.ofDiv': 'of {n} at {div}', 'pf.facts': 'Fighter profile',
      'sk.title': 'Skills assessment', 'sk.skill': 'Skill points', 'sk.fight': 'Fight points', 'sk.total': 'Ranking points', 'sk.avg': 'average {n}/100',
      'sk.last': 'Last assessed by coaches: {d}', 'sk.hist': 'Assessment history', 'sk.date': 'Date', 'sk.avgCol': 'Average', 'sk.change': 'Change',
      'bh.title': 'Bout history', 'bh.date': 'Date', 'bh.opp': 'Opponent', 'bh.event': 'Event', 'bh.res': 'Result', 'bh.method': 'Method', 'bh.round': 'Round', 'bh.pts': 'Points ±', 'bh.none': 'No bouts yet.',
      'up.title': 'Upcoming bouts', 'bio.title': 'About', 'dir.title': 'Fighters', 'dir.count': '{n} fighters',
      'dir.sub': 'Profiles, records and ranking points for every fighter competing for Dapper Combat Academy.',
      'ev.title': 'Events', 'ev.upcoming': 'Upcoming', 'ev.results': 'Results', 'ev.pending': 'Results pending', 'ev.noUp': 'No upcoming events.', 'ev.noRes': 'No results yet.',
      'ev.sub': 'Fight nights, scored sparring and skills assessments at the academy, with the result of every bout.',
      'ev.red': 'Red corner', 'ev.blue': 'Blue corner', 'ev.rounds': '{n} rds', 'ev.main': 'Main event', 'ev.detail': 'Details', 'ev.bouts': '{n} bouts', 'ev.about': 'About the event',
      'ev.noBouts': 'No bouts at this event (skills assessment / academy activity).', 'ev.venue': 'Venue', 'ev.time': 'Time', 'ev.type': 'Event type', 'ev.result': 'Result',
      'ev.draw': 'Draw', 'ev.nc': 'No contest', 'ev.wins': '{n} wins', 'ev.round': 'R{n}', 'ev.ptsCol': 'Points ±',
      'type.fight': 'Fight night', 'type.sparring': 'Sparring', 'type.assessment': 'Skills assessment', 'type.other': 'Academy event',
      'm.KO': 'Knockout', 'm.TKO': 'Technical knockout', 'm.RTD': 'Retired between rounds', 'm.DQ': 'Disqualification', 'm.UD': 'Unanimous decision', 'm.SD': 'Split decision', 'm.MD': 'Majority decision', 'm.PTS': 'Points',
      'nf.title': 'Not found', 'nf.fighter': 'Fighter not found. The link may be wrong or the fighter is no longer listed.', 'nf.event': 'Event not found.', 'back.ranking': 'Back to the rankings', 'back.events': 'Back to events',
      'yrs': '{n}', 'gm': 'men', 'gf': 'women', 'cm': '{n} cm', 'kg': '{n} kg',
      'nav.compare': 'Compare', 'view.all': 'Overall', 'view.div': 'By division', 'move.new': 'NEW', 'move.title': 'Since before {e}',
      'move.note': '± = ranking places gained / lost since before {e} ({d}).',
      'stats.title': 'Academy stats', 'stats.fighters': 'Active fighters', 'stats.events': 'Events held', 'stats.bouts': 'Bouts with results', 'stats.ko': 'KO / TKO wins', 'stats.rounds': 'Rounds fought',
      'rec.title': 'Academy records', 'rec.streak': 'Longest current win streak', 'rec.streakN': '{n} bouts', 'rec.wins': 'Most wins', 'rec.ko': 'Most KOs', 'rec.improve': 'Most improved skills',
      'chart.title': 'Ranking points over time', 'chart.start': 'Skill points', 'chart.none': 'No bouts to chart yet.',
      'prob': 'Win chance (by points)', 'prob.short': 'prediction by points',
      'cmp.title': 'Compare fighters', 'cmp.with': 'Compare with fighter', 'cmp.go': 'Compare', 'cmp.red': 'Red corner', 'cmp.blue': 'Blue corner', 'cmp.swap': 'Swap corners ⇄',
      'cmp.hint': 'Pick two fighters to compare points, skills, physicals and head-to-head.', 'cmp.stats': 'Tale of the tape', 'cmp.skills': 'Skills', 'cmp.h2h': 'Head to head', 'cmp.noH2h': 'These fighters have never met.',
    },
  };
  var en = function () { return DC.lang() === 'en'; };
  function t(k, vars) {
    var s = (T[en() ? 'en' : 'vi'][k] != null ? T[en() ? 'en' : 'vi'][k] : T.vi[k]) || k;
    if (vars) Object.keys(vars).forEach(function (v) { s = s.split('{' + v + '}').join(vars[v]); });
    return s;
  }
  var pick = function (o) { return o ? (en() ? o.en || o.vi : o.vi) || '' : ''; };

  /* ─── Dữ liệu ─────────────────────────────────────────────────────────── */
  var byId = {}, bySlug = {}, evById = {}, evBySlug = {}, DIV = {}, TIER = {}, SKILL = D.skills || [];
  D.fighters.forEach(function (f) { byId[f.id] = f; bySlug[f.slug] = f; });
  D.events.forEach(function (e) { evById[e.id] = e; evBySlug[e.slug] = e; });
  (D.divisions || []).forEach(function (d) { DIV[d.id] = d; });
  (D.tiers || []).forEach(function (x) { TIER[x.id] = x; });
  var byPoints = function (a, b) { return b.points - a.points || b.skillAvg - a.skillAvg || a.name.localeCompare(b.name); };
  var ranked = function (f) { return f.status === 'active' && f.rank; };
  var norm = function (s) { return DC.slug(s).replace(/-/g, ' '); };

  /* ─── Mảnh giao diện ──────────────────────────────────────────────────── */
  var numFmt = function (n, dec) { return Number(n || 0).toLocaleString(en() ? 'en-US' : 'vi-VN', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }); };
  var pts = function (n) { return numFmt(n, 1); };
  function dateOf(iso, long) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00Z');
    return d.toLocaleDateString(en() ? 'en-GB' : 'vi-VN', long ? { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' } : { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  }
  // ngày kiểu tờ lịch: số ngày lớn, tháng, năm
  function dateParts(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    return { d: d.getUTCDate(), m: en() ? d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }) : 'Tháng ' + (d.getUTCMonth() + 1), y: d.getUTCFullYear() };
  }
  function dateBlock(iso, cls) { var p = dateParts(iso); return '<div class="xh-date' + (cls ? ' ' + cls : '') + '" title="' + esc(dateOf(iso, true)) + '"><b>' + p.d + '</b><span>' + esc(p.m) + '</span><small>' + p.y + '</small></div>'; }
  var divName = function (id) { return DIV[id] ? pick(DIV[id]) : ''; };
  // khoảng cân của hạng: ≤ 52 kg … > 81 kg (hạng nặng nhất)
  function divRange(d) { var i = (D.divisions || []).indexOf(d); return d.max < 999 ? '≤ ' + d.max + ' kg' : '> ' + ((D.divisions[i - 1] || {}).max || '') + ' kg'; }
  var STOP = ['KO', 'TKO', 'RTD', 'DQ'];
  var href = function (f) { return '/vo-si/' + encodeURIComponent(f.slug); };
  var evHref = function (e) { return '/su-kien/' + encodeURIComponent(e.slug); };
  var cmpHref = function (a, b) { return '/so-sanh?a=' + encodeURIComponent(a.slug) + '&b=' + encodeURIComponent(b.slug); };
  // ảnh nhỏ trong bảng / danh sách: sm 32×40, md 48×60, mặc định 40×50
  function photo(f, cls) {
    var s = cls === 'sm' ? [32, 40] : cls === 'md' ? [48, 60] : [40, 50];
    return f && f.photo ? '<img class="xh-th-img ' + (cls || '') + '" src="' + esc(f.photo) + '" alt="" loading="lazy" width="' + s[0] + '" height="' + s[1] + '">' : '<span class="xh-th-img xh-ph ' + (cls || '') + '" aria-hidden="true"></span>';
  }
  // ảnh chân dung lớn 4:5 (top 3, thẻ võ sĩ, hồ sơ, so sánh)
  function portrait(f, alt, lazy) {
    return f.photo ? '<img src="' + esc(f.photo) + '" alt="' + (alt ? esc(f.name) : '') + '" width="400" height="500"' + (lazy ? ' loading="lazy"' : '') + '>' : '<span class="xh-ph" aria-hidden="true"></span>';
  }
  function rec(r) {
    return '<span class="xh-rec" aria-label="' + esc(t('res.W.t') + ' ' + r.w + ', ' + t('res.L.t') + ' ' + r.l + ', ' + t('res.D.t') + ' ' + r.d) + '"><span class="w">' + r.w + '</span><i>-</i><span class="l">' + r.l + '</span><i>-</i><span class="d">' + r.d + '</span></span>';
  }
  function stars(n) {
    if (!n) return '<span class="xh-muted">—</span>';
    return '<span class="xh-stars" title="' + n + '/5" aria-label="' + n + '/5">' + new Array(n + 1).join('★') + '<em>' + new Array(6 - n).join('★') + '</em></span>';
  }
  var tier = function (id) { return TIER[id] ? '<span class="xh-tier ' + esc(id) + '">' + esc(pick(TIER[id])) + '</span>' : ''; };
  var res = function (r) { return '<span class="xh-res ' + esc(r) + '" title="' + esc(t('res.' + r + '.t')) + '">' + esc(t('res.' + r)) + '</span>'; };
  var last6 = function (a) { return a && a.length ? '<span class="xh-last">' + a.map(res).join('') + '</span>' : '<span class="xh-muted">—</span>'; };
  var stance = function (s) { return t('stance.' + s); };
  function delta(d) {
    if (!d) return '<span class="xh-muted">0</span>';
    return d > 0 ? '<span class="xh-up">+' + pts(d) + '</span>' : '<span class="xh-down">−' + pts(-d) + '</span>';
  }
  function nameCell(f, sub) {
    return '<div class="xh-name">' + photo(f) + '<span><a href="' + href(f) + '">' + esc(f.name) + '</a>' + (sub != null ? '<small>' + sub + '</small>' : f.nickname ? '<small>“' + esc(f.nickname) + '”</small>' : '') + '</span></div>';
  }
  var methodTitle = function (m) { return m ? '<abbr title="' + esc(t('m.' + m)) + '">' + esc(m) + '</abbr>' : ''; };
  var typeTag = function (e) { return '<span class="xh-type ' + esc(e.type) + '">' + esc(t('type.' + e.type)) + '</span>'; };
  function box(title, body, extra, id) { return '<section class="xh-box"' + (id ? ' id="' + id + '"' : '') + '><div class="xh-box-h"><h2>' + title + '</h2>' + (extra || '') + '</div>' + body + '</section>'; }
  // dải tối đầu trang: o = { crumb, pre, h1, sub, ctl, side, after, cls }
  function hero(o) {
    return '<header class="xh-hero' + (o.cls ? ' ' + o.cls : '') + '"><div class="xh-in">' + (o.crumb || '') + '<div class="xh-hero-in"><div class="xh-hero-t">' + (o.pre || '') + '<h1>' + o.h1 + '</h1>' +
      (o.sub ? '<div class="xh-hero-sub">' + o.sub + '</div>' : '') + (o.ctl ? '<div class="xh-hero-ctl">' + o.ctl + '</div>' : '') + '</div>' + (o.side || '') + '</div>' +
      (o.after ? '<div class="xh-hero-after">' + o.after + '</div>' : '') + '</div></header>';
  }
  var page = function (html) { return '<div class="xh-in xh-body">' + html + '</div>'; };
  var crumb = function (url, label, cur) { return '<p class="xh-crumb"><a href="' + url + '">' + esc(label) + '</a> / ' + esc(cur) + '</p>'; };
  function qs() { var o = {}; new URLSearchParams(location.search).forEach(function (v, k) { o[k] = v; }); return o; }
  function setQs(o) {
    var p = new URLSearchParams();
    Object.keys(o).forEach(function (k) { if (o[k] !== '' && o[k] != null && o[k] !== false) p.set(k, o[k] === true ? '1' : o[k]); });
    var s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }
  function select(name, label, opts, val) {
    return '<label>' + esc(label) + ' <select data-f="' + name + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
  }
  var divOpts = function () { return [['', t('f.allDiv')]].concat((D.divisions || []).map(function (d) { return [d.id, pick(d)]; })); };
  var tierOpts = function () { return [['', t('f.allTier')]].concat((D.tiers || []).map(function (x) { return [x.id, pick(x)]; })); };
  function seg(name, opts, val) {
    return '<div class="xh-seg" role="group">' + opts.map(function (o) { return '<button type="button" data-seg="' + name + '" data-v="' + esc(o[0]) + '" aria-pressed="' + (o[0] === val) + '"' + (o[0] === val ? ' class="on"' : '') + '>' + esc(o[1]) + '</button>'; }).join('') + '</div>';
  }

  /* ─── Cột phải: sự kiện sắp tới, kết quả mới, số 1 từng hạng cân ───────── */
  var upcoming = function () { return D.events.filter(function (e) { return e.status === 'upcoming'; }).sort(function (a, b) { return a.date.localeCompare(b.date); }); };
  var finished = function () { return D.events.filter(function (e) { return e.status !== 'upcoming'; }).sort(function (a, b) { return b.date.localeCompare(a.date); }); };
  function mainBout(e) { return e.bouts.filter(function (b) { return b.main; })[0] || e.bouts[0]; }
  function vsText(b) { var a = byId[b.a], c = byId[b.b]; return a && c ? esc(a.name) + ' <span class="xh-muted">vs</span> ' + esc(c.name) : ''; }
  function sideUpcoming() {
    var list = upcoming().slice(0, 3);
    return box(esc(t('side.upcoming')), '<div class="xh-box-b">' + (list.length ? '<ul class="xh-list">' + list.map(function (e) {
      var mb = mainBout(e);
      return '<li>' + dateBlock(e.date, 'sm') + '<div class="grow"><a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a><small>' + esc(t('type.' + e.type)) + (e.time ? ', ' + esc(e.time) : '') + '</small>' +
        (mb ? '<small>' + vsText(mb) + '</small>' : '') + '</div></li>';
    }).join('') + '</ul><a class="xh-more" href="/su-kien">' + esc(t('side.all')) + '</a>' : '<p class="xh-empty">' + esc(t('side.noUp')) + '</p>') + '</div>');
  }
  function sideLatest() {
    var e = finished().filter(function (x) { return x.bouts.some(function (b) { return b.result; }); })[0];
    if (!e) return '';
    return box(esc(t('side.latest')), '<div class="xh-box-b"><p class="xh-side-ev"><a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a><small>' + esc(dateOf(e.date)) + '</small></p><ul class="xh-list">' +
      e.bouts.filter(function (b) { return b.result; }).slice(0, 6).map(function (b) {
        var w = b.result === 'a' ? byId[b.a] : b.result === 'b' ? byId[b.b] : null, l = b.result === 'a' ? byId[b.b] : b.result === 'b' ? byId[b.a] : null;
        if (w && l) return '<li>' + res('W') + '<div class="grow"><a href="' + href(w) + '">' + esc(w.name) + '</a><small>' + esc(t('side.beat', { n: l.name })) + ', ' + methodTitle(b.method) + (b.round ? ' ' + esc(t('ev.round', { n: b.round })) : '') + '</small></div></li>';
        var a = byId[b.a], c = byId[b.b];
        return a && c ? '<li>' + res(b.result === 'draw' ? 'D' : 'NC') + '<div class="grow">' + esc(a.name) + ' <span class="xh-muted">–</span> ' + esc(c.name) + '</div></li>' : '';
      }).join('') + '</ul><a class="xh-more" href="/su-kien?tab=res">' + esc(t('side.all')) + '</a></div>');
  }
  function sideLeaders(g) {
    var rows = (D.divisions || []).map(function (d) {
      var f = D.fighters.filter(function (x) { return x.gender === g && x.division === d.id && ranked(x) && x.rank.div === 1; })[0];
      return f ? '<li>' + photo(f, 'sm') + '<div class="grow"><small>' + esc(pick(d)) + '</small><a href="' + href(f) + '">' + esc(f.name) + '</a></div><span class="xh-pts">' + pts(f.points) + '</span></li>' : '';
    }).join('');
    return rows ? box(esc(t('side.leaders.' + g)), '<div class="xh-box-b"><ul class="xh-list">' + rows + '</ul></div>') : '';
  }
  function sideTop(g) {
    var list = D.fighters.filter(function (f) { return f.gender === g && ranked(f); }).sort(byPoints).slice(0, 5);
    return list.length ? box(esc(t('side.top.' + g)), '<div class="xh-box-b"><ul class="xh-list">' + list.map(function (f) {
      return '<li><span class="rk">' + f.rank.overall + '</span>' + photo(f, 'sm') + '<div class="grow"><a href="' + href(f) + '">' + esc(f.name) + '</a><small>' + esc(divName(f.division)) + '</small></div><span class="xh-pts">' + pts(f.points) + '</span></li>';
    }).join('') + '</ul><a class="xh-more" href="/xep-hang' + (g === 'f' ? '?g=f' : '') + '">' + esc(t('side.all')) + '</a></div>') : '';
  }
  function how() {
    return box(esc(t('how.title')), '<div class="xh-how"><ul><li>' + esc(t('how.1')) + '</li><li>' + esc(t('how.2')) + '</li><li>' + esc(t('how.3')) + '</li><li>' + esc(t('how.4')) + '</li></ul></div>', '', 'cach-tinh');
  }

  /* ─── Thống kê, kỷ lục Academy ────────────────────────────────────────── */
  function sideStats() {
    var act = D.fighters.filter(function (f) { return ranked(f); });
    var done = D.events.filter(function (e) { return e.status !== 'upcoming'; }), bouts = [].concat.apply([], D.events.map(function (e) { return e.bouts; })).filter(function (b) { return b.result; });
    var kos = bouts.filter(function (b) { return (b.result === 'a' || b.result === 'b') && STOP.indexOf(b.method) > -1; }).length;
    var rounds = bouts.reduce(function (s, b) { return s + (STOP.indexOf(b.method) > -1 ? b.round || b.rounds : b.rounds); }, 0);
    var row = function (k, v, sub) { return '<li><div class="grow">' + esc(t(k)) + (sub ? '<small>' + sub + '</small>' : '') + '</div><b class="num">' + v + '</b></li>'; };
    return box(esc(t('stats.title')), '<div class="xh-box-b"><ul class="xh-list">' +
      row('stats.fighters', numFmt(act.length), esc(t('g.m')) + ' ' + act.filter(function (f) { return f.gender === 'm'; }).length + ', ' + esc(t('g.f')).toLowerCase() + ' ' + act.filter(function (f) { return f.gender === 'f'; }).length) +
      row('stats.events', numFmt(done.length)) + row('stats.bouts', numFmt(bouts.length)) + row('stats.ko', numFmt(kos)) + row('stats.rounds', numFmt(rounds)) + '</ul></div>');
  }
  function sideRecords() {
    var vis = D.fighters.filter(function (f) { return f.status === 'active'; });
    var best = function (val) {
      var top = null, v = 0;
      vis.forEach(function (f) { var x = val(f); if (x > v || (x === v && x > 0 && top && f.points > top.points)) { v = x; top = f; } });
      return top && v > 0 ? { f: top, v: v } : null;
    };
    var improve = function (f) { var a = f.assessments || []; return a.length > 1 ? Math.round((a[a.length - 1].avg - a[0].avg) * 10) / 10 : 0; };
    var rows = [
      ['rec.streak', best(function (f) { return f.streak && f.streak.res === 'W' ? f.streak.n : 0; }), function (v) { return t('rec.streakN', { n: v }); }],
      ['rec.wins', best(function (f) { return f.record.w; }), function (v) { return t('ev.wins', { n: v }); }],
      ['rec.ko', best(function (f) { return f.record.ko; }), function (v) { return v + ' KO'; }],
      ['rec.improve', best(improve), function (v) { return '+' + numFmt(v, 1); }],
    ].filter(function (r) { return r[1]; });
    return rows.length ? box(esc(t('rec.title')), '<div class="xh-box-b"><ul class="xh-list">' + rows.map(function (r) {
      return '<li>' + photo(r[1].f, 'sm') + '<div class="grow"><small>' + esc(t(r[0])) + '</small><a href="' + href(r[1].f) + '">' + esc(r[1].f.name) + '</a></div><b class="num">' + esc(r[2](r[1].v)) + '</b></li>';
    }).join('') + '</ul></div>') : '';
  }

  /* ─── Ranking ─────────────────────────────────────────────────────────── */
  // thay đổi thứ hạng so với trước sự kiện có kết quả gần nhất: ▲ lên, ▼ xuống, MỚI
  function moveCell(f, key) {
    var m = f.move && f.move[key];
    if (m == null || !ranked(f)) return '<span class="xh-muted">–</span>';
    var since = D.since ? t('move.title', { e: pick(D.since.name) }) : '';
    if (m === 'new') return '<span class="xh-mv new" title="' + esc(since) + '">' + esc(t('move.new')) + '</span>';
    if (!m) return '<span class="xh-mv same" title="' + esc(since) + '">=</span>';
    return '<span class="xh-mv ' + (m > 0 ? 'up' : 'down') + '" title="' + esc(since) + '">' + (m > 0 ? '▲' : '▼') + Math.abs(m) + '</span>';
  }
  // dòng bảng ranking; trên điện thoại mỗi dòng thành một thẻ (CSS): hạng | võ sĩ | điểm, bên dưới ± và thành tích
  function rankRows(list, divRank, showDiv) {
    return list.map(function (f) {
      var rk = ranked(f) ? (divRank ? f.rank.div : f.rank.overall) : '–';
      return '<tr' + (f.status !== 'active' ? ' class="off"' : rk === 1 ? ' class="top1"' : '') + '><td class="rk">' + rk + '</td><td class="mv">' + moveCell(f, divRank ? 'div' : 'overall') + '</td><td class="nm">' + nameCell(f) + '</td>' +
        '<td class="rc c">' + rec(f.record) + '</td><td class="l6">' + last6(f.last6) + '</td><td class="ti">' + tier(f.tier) + '</td>' +
        (showDiv ? '<td class="dv nw xh-hide-md">' + esc(divName(f.division)) + '</td>' : '') + '<td class="pt"><span class="xh-pts">' + pts(f.points) + '</span>' + stars(f.stars) + '</td></tr>';
    }).join('');
  }
  function rankHead(showDiv) {
    return '<thead><tr><th class="rk">#</th><th class="c" title="' + esc(D.since ? t('move.title', { e: pick(D.since.name) }) : '') + '">±</th><th>' + esc(t('col.fighter')) + '</th><th class="c">' + esc(t('col.record')) + '</th>' +
      '<th>' + esc(t('col.last6')) + '</th><th>' + esc(t('col.tier')) + '</th>' + (showDiv ? '<th class="xh-hide-md">' + esc(t('col.div')) + '</th>' : '') + '<th class="r">' + esc(t('col.points')) + '</th></tr></thead>';
  }
  // top 3 của danh sách đang xem, như bục nhận giải (số 1 ở giữa)
  function podium(list, divRank) {
    var top = list.filter(ranked).slice(0, 3);
    return top.length ? '<ol class="xh-pod" aria-label="Top ' + top.length + '">' + top.map(function (f, i) {
      var rk = divRank ? f.rank.div : f.rank.overall;
      return '<li class="p' + (i + 1) + (rk === 1 ? ' gold' : '') + '"><a href="' + href(f) + '">' + portrait(f) + '<span class="xh-pod-rk">' + rk + '</span><span class="xh-pod-t"><span class="xh-pod-n">' + esc(f.name) + '</span>' +
        '<span class="xh-pod-m"><span>' + esc(divName(f.division)) + '</span><span class="xh-pod-p">' + pts(f.points) + '</span></span></span></a></li>';
    }).join('') + '</ol>' : '';
  }
  function pageRanking() {
    var q = qs(), g = q.g === 'f' ? 'f' : 'm', div = DIV[q.div] ? q.div : '', tr = TIER[q.tier] ? q.tier : '', all = q.all === '1', view = q.view === 'div' && !div ? 'div' : 'all';
    var pass = function (f) { return f.gender === g && (!tr || f.tier === tr) && (all || f.status === 'active'); };
    var order = function (a, b) { return (ranked(b) ? 1 : 0) - (ranked(a) ? 1 : 0) || byPoints(a, b); };
    var body, top;
    if (view === 'div') {
      body = (D.divisions || []).map(function (d) {
        var list = D.fighters.filter(function (f) { return pass(f) && f.division === d.id; }).sort(order);
        return list.length ? '<h2 class="xh-day">' + esc(pick(d)) + ' <span class="xh-day-sub">' + divRange(d) + ', ' + esc(t('dir.count', { n: list.length })) + '</span></h2>' +
          '<div class="xh-tw"><table class="xh-table xh-rt">' + rankHead(false) + '<tbody>' + rankRows(list, true, false) + '</tbody></table></div>' : '';
      }).join('') || '<p class="xh-empty">' + esc(t('none')) + '</p>';
      top = podium(D.fighters.filter(pass).sort(order), false);
    } else {
      var list = D.fighters.filter(function (f) { return pass(f) && (!div || f.division === div); }).sort(order);
      body = '<div class="xh-tw"><table class="xh-table xh-rt">' + rankHead(!div) + '<tbody>' + (rankRows(list, !!div, !div) || '<tr><td colspan="8" class="xh-empty">' + esc(t('none')) + '</td></tr>') + '</tbody></table></div>';
      top = podium(list, !!div);
    }
    var tools = '<div class="xh-tools">' + seg('view', [['all', t('view.all')], ['div', t('view.div')]], view) +
      (view === 'all' ? select('div', t('f.div'), divOpts(), div) : '') + select('tier', t('f.tier'), tierOpts(), tr) +
      '<label><input type="checkbox" data-f="all"' + (all ? ' checked' : '') + '> ' + esc(t('f.inactive')) + '</label></div>';
    var since = D.since ? '<p class="xh-note">' + esc(t('move.note', { e: pick(D.since.name), d: dateOf(D.since.date) })) + '</p>' : '';
    root.innerHTML = hero({
      h1: esc(div && view === 'all' ? t('rank.hd.' + g, { div: divName(div) }) : t('rank.h.' + g)),
      sub: '<p>' + esc(t('rank.sub')) + ' <a href="#cach-tinh">' + esc(t('how.title')) + '</a></p>',
      ctl: seg('g', [['m', t('g.m')], ['f', t('g.f')]], g) + '<span class="xh-upd">' + esc(t('updated', { d: dateOf(D.updated) })) + '</span>',
      side: top,
    }) + page('<div class="xh-grid"><div class="xh-col"><section class="xh-box">' + tools + body + since + '</section>' + how() + '</div>' +
      '<aside class="xh-col xh-side">' + sideUpcoming() + sideLatest() + sideStats() + sideRecords() + sideLeaders(g) + '</aside></div>');
    bindFilters(function (k, v) {
      var o = { g: g, view: view, div: div, tier: tr, all: all }; o[k] = v;
      if (k === 'view') o.div = '';
      setQs({ g: o.g === 'f' ? 'f' : '', view: o.view === 'div' ? 'div' : '', div: o.div, tier: o.tier, all: o.all }); render();
    });
  }
  function bindFilters(change) {
    [].forEach.call(root.querySelectorAll('[data-f]'), function (el) {
      el.addEventListener(el.type === 'search' ? 'input' : 'change', function () { change(el.getAttribute('data-f'), el.type === 'checkbox' ? el.checked : el.value); });
    });
    [].forEach.call(root.querySelectorAll('[data-seg]'), function (b) { b.addEventListener('click', function () { change(b.getAttribute('data-seg'), b.getAttribute('data-v')); }); });
  }

  /* ─── Danh sách võ sĩ: lưới thẻ có ảnh ────────────────────────────────── */
  function pageFighters() {
    var q = qs(), g = q.g === 'm' || q.g === 'f' ? q.g : '', div = DIV[q.div] ? q.div : '', st = q.st === 'active' || q.st === 'inactive' ? q.st : '', s = q.q || '';
    var want = norm(s);
    var list = D.fighters.filter(function (f) {
      return (!g || f.gender === g) && (!div || f.division === div) && (!st || f.status === st) && (!want || norm(f.name + ' ' + (f.nickname || '') + ' ' + (f.hometown || '')).indexOf(want) > -1);
    }).sort(function (a, b) { return a.name.split(' ').pop().localeCompare(b.name.split(' ').pop()) || a.name.localeCompare(b.name); });
    var cards = list.map(function (f) {
      var rk = ranked(f) ? f.rank.div : 0;
      return '<a class="xh-card' + (f.status !== 'active' ? ' off' : '') + '" href="' + href(f) + '"><span class="xh-card-ph">' + portrait(f, false, true) +
        (rk ? '<span class="xh-card-rk' + (rk === 1 ? ' gold' : '') + '" title="' + esc(t('pf.inDiv', { r: rk, n: f.rank.divOf, div: divName(f.division) })) + '">#' + rk + '</span>' : '') + tier(f.tier) + '</span>' +
        '<span class="xh-card-b"><span class="xh-card-n">' + esc(f.name) + '</span>' + (f.nickname ? '<span class="xh-card-k">“' + esc(f.nickname) + '”</span>' : '') +
        '<span class="xh-card-d">' + esc(divName(f.division)) + ', ' + esc(t('g' + f.gender)) + (f.status !== 'active' ? ', ' + esc(t('status.inactive').toLowerCase()) : '') + '</span>' +
        '<span class="xh-card-f">' + rec(f.record) + '<span class="xh-pts">' + pts(f.points) + '</span></span></span></a>';
    }).join('');
    var tools = '<div class="xh-tools"><input type="search" data-f="q" value="' + esc(s) + '" placeholder="' + esc(t('f.q')) + '" aria-label="' + esc(t('f.q')) + '">' +
      seg('g', [['', t('g.all')], ['m', t('g.m')], ['f', t('g.f')]], g) + select('div', t('f.div'), divOpts(), div) +
      select('st', t('f.status'), [['', t('f.allStatus')], ['active', t('status.active')], ['inactive', t('status.inactive')]], st) + '<span class="xh-count">' + esc(t('dir.count', { n: list.length })) + '</span></div>';
    root.innerHTML = hero({ h1: esc(t('dir.title')), sub: '<p>' + esc(t('dir.sub')) + '</p>' }) +
      page('<div class="xh-grid"><div class="xh-col"><section class="xh-box">' + tools + (cards ? '<div class="xh-cards">' + cards + '</div>' : '<p class="xh-empty">' + esc(t('none')) + '</p>') + '</section></div>' +
      '<aside class="xh-col xh-side">' + sideTop('m') + sideTop('f') + sideUpcoming() + '</aside></div>');
    bindFilters(function (k, v) {
      var o = { q: s, g: g, div: div, st: st }; o[k] = v; setQs(o);
      if (k === 'q') { var pos = v.length; render(); var i = root.querySelector('[data-f="q"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } } else render();
    });
  }

  /* ─── Hồ sơ võ sĩ ─────────────────────────────────────────────────────── */
  // radar kỹ năng: list = [{ f, color }] (1 võ sĩ ở hồ sơ, 2 võ sĩ ở trang so sánh)
  function radar(list) {
    var n = SKILL.length, cx = 120, cy = 118, R = 84, pt = function (i, r) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    var poly = function (r) { return SKILL.map(function (s, i) { return pt(i, r).map(function (v) { return v.toFixed(1); }).join(','); }).join(' '); };
    var grid = [0.25, 0.5, 0.75, 1].map(function (k) { return '<polygon points="' + poly(R * k) + '" fill="none" stroke="#e0e3e7"/>'; }).join('');
    var axes = SKILL.map(function (s, i) { var p = pt(i, R); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="#e0e3e7"/>'; }).join('');
    var shapes = list.map(function (x) {
      var val = SKILL.map(function (s, i) { return pt(i, R * (x.f.skills[s.id] || 0) / 100).map(function (v) { return v.toFixed(1); }).join(','); }).join(' ');
      return '<polygon points="' + val + '" fill="' + x.color + '" fill-opacity="0.22" stroke="' + x.color + '" stroke-width="2" stroke-linejoin="round"/>';
    }).join('');
    var labels = SKILL.map(function (s, i) {
      var p = pt(i, R + 18), anchor = Math.abs(p[0] - cx) < 4 ? 'middle' : p[0] > cx ? 'start' : 'end';
      return '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4).toFixed(1) + '" text-anchor="' + anchor + '" font-size="11" fill="#3b434c">' + esc(pick(s)) + '</text>';
    }).join('');
    return '<svg class="xh-radar" viewBox="-30 0 300 240" role="img" aria-label="' + esc(t('sk.title')) + '">' + grid + axes + shapes + labels + '</svg>';
  }
  // khả năng thắng theo điểm hiện tại (công thức Elo dùng để tính điểm): a thắng b
  var prob = function (a, b) { return 1 / (1 + Math.pow(10, (b.points - a.points) / 400)); };
  function probBar(a, b) {
    var p = Math.round(prob(a, b) * 100);
    return '<div class="xh-prob" title="' + esc(t('prob')) + '"><span class="a" style="width:' + p + '%">' + p + '%</span><span class="b" style="width:' + (100 - p) + '%">' + (100 - p) + '%</span></div>';
  }
  // diễn biến điểm: điểm kỹ năng → sau từng trận (màu chấm theo kết quả), vạch các mốc hạng
  function chart(f) {
    var pts0 = (f.bouts || []).slice().reverse();
    if (!pts0.length) return '<p class="xh-empty">' + esc(t('chart.none')) + '</p>';
    var series = [{ v: f.skillPoints, label: t('chart.start') }].concat(pts0.map(function (b) { var o = byId[b.opp]; return { v: b.after, res: b.res, label: dateOf(b.date) + ', ' + t('res.' + b.res + '.t') + (o ? ' vs ' + o.name : '') + ' (' + (b.delta > 0 ? '+' : '') + pts(b.delta) + ')' }; }));
    var W = 640, H = 210, L = 44, Rr = 14, T = 16, Bm = 26;
    var vs = series.map(function (x) { return x.v; }), lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs);
    var pad = Math.max(15, (hi - lo) * 0.25); lo = Math.floor((lo - pad) / 10) * 10; hi = Math.ceil((hi + pad) / 10) * 10;
    var X = function (i) { return L + (series.length === 1 ? (W - L - Rr) / 2 : i * (W - L - Rr) / (series.length - 1)); }, Y = function (v) { return T + (hi - v) * (H - T - Bm) / (hi - lo); };
    var COL = { W: '#1d8348', L: '#D4372E', D: '#5c6a7b', NC: '#9aa1a9' };
    var g = '';
    [lo, (lo + hi) / 2, hi].forEach(function (v) { g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="#eef0f2"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#656c76">' + Math.round(v) + '</text>'; });
    (D.tiers || []).forEach(function (x) { if (x.min > lo && x.min < hi) g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(x.min).toFixed(1) + '" y2="' + Y(x.min).toFixed(1) + '" stroke="#C9A227" stroke-dasharray="4 4"/><text x="' + (W - Rr) + '" y="' + (Y(x.min) - 5).toFixed(1) + '" text-anchor="end" font-size="11" fill="#8a6d12">' + esc(pick(x)) + ' ' + x.min + '</text>'; });
    var line = series.map(function (x, i) { return X(i).toFixed(1) + ',' + Y(x.v).toFixed(1); }).join(' ');
    var area = X(0).toFixed(1) + ',' + (H - Bm) + ' ' + line + ' ' + X(series.length - 1).toFixed(1) + ',' + (H - Bm);
    var dots = series.map(function (x, i) { return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(x.v).toFixed(1) + '" r="' + (i ? 5.5 : 4.5) + '" fill="' + (x.res ? COL[x.res] : '#fff') + '" stroke="' + (x.res ? '#fff' : '#D4372E') + '" stroke-width="2"><title>' + esc(x.label + ': ' + pts(x.v)) + '</title></circle>'; }).join('');
    var xl = '<text x="' + X(0).toFixed(1) + '" y="' + (H - 6) + '" font-size="11" fill="#656c76">' + esc(t('chart.start')) + '</text><text x="' + X(series.length - 1).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="end" font-size="11" fill="#656c76">' + esc(dateOf(pts0[pts0.length - 1].date)) + '</text>';
    return '<div class="xh-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('chart.title')) + '">' + g + '<polygon points="' + area + '" fill="#D4372E" fill-opacity="0.07"/>' +
      '<polyline points="' + line + '" fill="none" stroke="#D4372E" stroke-width="2.5" stroke-linejoin="round"/>' + dots + xl + '</svg></div>';
  }
  // chọn võ sĩ (nhóm Nam / Nữ, kèm hạng cân và thành tích)
  function fighterOpts(sel, skip) {
    return ['m', 'f'].map(function (g) {
      var list = D.fighters.filter(function (x) { return x.gender === g && x.id !== skip; }).sort(byPoints);
      return list.length ? '<optgroup label="' + esc(t('g.' + g)) + '">' + list.map(function (x) {
        return '<option value="' + esc(x.slug) + '"' + (x.slug === sel ? ' selected' : '') + '>' + esc(x.name + ' (' + divName(x.division) + ', ' + x.record.w + '-' + x.record.l + '-' + x.record.d + ')') + '</option>';
      }).join('') + '</optgroup>' : '';
    }).join('');
  }
  function pageFighter(slug) {
    var f = bySlug[slug];
    if (!f) { notFound('nf.fighter', '/xep-hang', 'back.ranking'); return; }
    document.title = f.name + (f.nickname ? ' “' + f.nickname + '”' : '') + ' · Dapper Combat Academy Ranking';
    var r = f.record;
    // đầu trang: ảnh lớn, biệt danh, tên, thành tích T-B-H, thứ hạng
    var rankBlock = ranked(f)
      ? '<div class="xh-pf-rank' + (f.rank.div === 1 ? ' gold' : '') + '"><b>#' + f.rank.div + '</b><span>' + esc(t('pf.ofDiv', { n: f.rank.divOf, div: divName(f.division) })) + '</span><small>' + esc(t('pf.inClub', { r: f.rank.overall, n: f.rank.overallOf, g: t('g' + f.gender) })) + '</small></div>'
      : '<div class="xh-pf-rank"><span>' + esc(t('pf.unranked')) + '</span></div>';
    var stat = function (k, v) { return '<div><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>'; };
    var top = '<header class="xh-hero xh-pf-hero"><div class="xh-in">' + crumb('/vo-si', t('nav.fighters'), f.name) + '<div class="xh-pf">' +
      '<figure class="xh-pf-photo">' + portrait(f, true) + '</figure><div class="xh-pf-main">' + (f.nickname ? '<p class="xh-pf-nick">“' + esc(f.nickname) + '”</p>' : '') + '<h1>' + esc(f.name) + '</h1>' +
      '<p class="xh-pf-meta"><span>' + esc(divName(f.division)) + '</span><span>' + esc(t('g.' + f.gender)) + '</span><span>' + esc(stance(f.stance)) + '</span>' + (f.hometown ? '<span>' + esc(f.hometown) + '</span>' : '') + '</p>' +
      '<div class="xh-record"><div class="w"><b>' + r.w + '</b><span>' + esc(t('pf.win')) + '</span><small>' + esc(t('pf.kos', { n: r.ko })) + '</small></div>' +
      '<div class="l"><b>' + r.l + '</b><span>' + esc(t('pf.loss')) + '</span><small>' + esc(t('pf.kos', { n: r.koLost })) + '</small></div>' +
      '<div class="d"><b>' + r.d + '</b><span>' + esc(t('pf.draw')) + '</span><small>&nbsp;</small></div></div></div>' +
      '<div class="xh-pf-side">' + rankBlock + '<dl class="xh-pf-stats">' + stat(t('pf.points'), '<span class="xh-pts">' + pts(f.points) + '</span>') + stat(t('pf.tier'), tier(f.tier) || '—') +
      stat(t('col.stars'), stars(f.stars)) + stat(t('pf.ko'), r.w ? r.koPct + '%' : '—') + '</dl></div></div></div></header>';
    // hồ sơ: bảng 2 cột
    var kv = [
      [t('pf.points'), '<span class="xh-pts">' + pts(f.points) + '</span> ' + stars(f.stars)], [t('pf.rank'), ranked(f) ? esc(t('pf.inDiv', { r: f.rank.div, n: f.rank.divOf, div: divName(f.division) })) + '<br><small>' + esc(t('pf.inClub', { r: f.rank.overall, n: f.rank.overallOf, g: t('g' + f.gender) })) + '</small>' : '<small>' + esc(t('pf.unranked')) + '</small>'],
      [t('pf.tier'), tier(f.tier)], [t('pf.div'), esc(divName(f.division))],
      [t('pf.status'), '<span class="xh-tag' + (f.status === 'active' ? ' on' : '') + '">' + esc(t('status.' + f.status)) + '</span>'],
      [t('pf.bouts'), r.bouts + ' · ' + r.rounds], [t('pf.ko'), r.w ? r.koPct + '%' : '—'],
      [t('pf.streak'), f.streak ? esc(t('pf.streakOf', { n: f.streak.n, r: t('res.' + f.streak.res + '.t').toLowerCase() })) : '—'],
      [t('pf.stance'), esc(stance(f.stance))], [t('pf.age'), f.age != null ? f.age : '—'], [t('pf.height'), f.height ? esc(t('cm', { n: f.height })) : '—'],
      [t('pf.reach'), f.reach ? esc(t('cm', { n: f.reach })) : '—'], [t('pf.weight'), f.weight ? esc(t('kg', { n: numFmt(f.weight, 1) })) : '—'], [t('pf.home'), esc(f.hometown || '—')],
      [t('pf.joined'), f.joined ? esc(dateOf(f.joined)) : '—'], [t('pf.coach'), esc(f.coach || '—')], [t('pf.debut'), f.debut ? esc(dateOf(f.debut)) : '—'],
    ];
    var kvT = function (rows) { return '<table class="xh-kv">' + rows.map(function (x) { return '<tr><th>' + esc(x[0]) + '</th><td>' + x[1] + '</td></tr>'; }).join('') + '</table>'; }, half = Math.ceil(kv.length / 2);
    var facts = box(esc(t('pf.facts')), '<div class="xh-kv2">' + kvT(kv.slice(0, half)) + kvT(kv.slice(half)) + '</div>');
    // kỹ năng + lịch sử chấm điểm
    var hist = (f.assessments || []).slice().reverse(), prev = null;
    var histRows = (f.assessments || []).map(function (a) { var ch = prev == null ? null : Math.round((a.avg - prev) * 10) / 10; prev = a.avg; return { a: a, ch: ch }; }).reverse().map(function (x) {
      return '<tr><td>' + esc(dateOf(x.a.date)) + '</td><td class="r num">' + numFmt(x.a.avg, 1) + '</td><td class="r">' + (x.ch == null ? '<span class="xh-muted">—</span>' : delta(x.ch)) + '</td></tr>';
    }).join('');
    var skills = box(esc(t('sk.title')), '<div class="xh-skills">' + radar([{ f: f, color: '#D4372E' }]) + '<div><div class="xh-bars">' + SKILL.map(function (s) {
      var v = f.skills[s.id] || 0;
      return '<div class="xh-bar"><span>' + esc(pick(s)) + '</span><i><b style="width:' + v + '%"></b></i><em>' + v + '</em></div>';
    }).join('') + '</div><div class="xh-sum"><div><small>' + esc(t('sk.skill')) + '</small><b>' + numFmt(f.skillPoints) + '</b><small>' + esc(t('sk.avg', { n: numFmt(f.skillAvg, 1) })) + '</small></div>' +
      '<div><small>' + esc(t('sk.fight')) + '</small><b>' + delta(f.fightPoints) + '</b></div><div><small>' + esc(t('sk.total')) + '</small><b>' + pts(f.points) + '</b></div></div>' +
      (hist.length ? '<p class="xh-sum-n">' + esc(t('sk.last', { d: dateOf(hist[0].date) })) + '</p>' : '') + '</div></div>' +
      (histRows ? '<div class="xh-tw"><table class="xh-table"><thead><tr><th>' + esc(t('sk.hist')) + '</th><th class="r">' + esc(t('sk.avgCol')) + '</th><th class="r">' + esc(t('sk.change')) + '</th></tr></thead><tbody>' + histRows + '</tbody></table></div>' : ''));
    // trận sắp tới
    var up = (f.upcoming || []).map(function (u) {
      var o = byId[u.opp], e = evById[u.event];
      return o && e ? '<tr><td class="num nw">' + esc(dateOf(u.date)) + '</td><td>' + nameCell(o, rec(o.record)) + '</td><td class="xh-hide-sm"><a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a>' + (u.main ? '<small class="xh-muted"><br>' + esc(t('ev.main')) + '</small>' : '') + '</td>' +
        '<td class="c nw">' + esc(t('ev.rounds', { n: u.rounds })) + '</td><td>' + probBar(f, o) + '<a class="xh-cmp-link" href="' + cmpHref(f, o) + '">' + esc(t('cmp.go')) + '</a></td></tr>' : '';
    }).join('');
    var upBox = up ? box(esc(t('up.title')), '<div class="xh-tw"><table class="xh-table"><thead><tr><th>' + esc(t('bh.date')) + '</th><th>' + esc(t('bh.opp')) + '</th><th class="xh-hide-sm">' + esc(t('bh.event')) + '</th><th class="c">' + esc(t('bh.round')) + '</th><th>' + esc(t('prob')) + '</th></tr></thead><tbody>' + up + '</tbody></table></div>') : '';
    // lịch sử thi đấu
    var bh = (f.bouts || []).map(function (b) {
      var o = byId[b.opp], e = evById[b.event];
      if (!o) return '';
      return '<tr><td class="num nw">' + esc(dateOf(b.date)) + '</td><td>' + nameCell(o, rec(o.record)) + '</td><td class="xh-hide-sm">' + (e ? '<a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a>' : '') + '</td>' +
        '<td class="c">' + res(b.res) + '</td><td>' + methodTitle(b.method) + '</td><td class="c num">' + (b.round ? b.round + '/' + b.rounds + (b.time ? ' <small class="xh-muted">' + esc(b.time) + '</small>' : '') : b.rounds) + '</td><td class="r num">' + delta(b.delta) + '</td></tr>';
    }).join('');
    var bhBox = box(esc(t('bh.title')), bh ? '<div class="xh-tw"><table class="xh-table"><thead><tr><th>' + esc(t('bh.date')) + '</th><th>' + esc(t('bh.opp')) + '</th><th class="xh-hide-sm">' + esc(t('bh.event')) + '</th><th class="c">' + esc(t('bh.res')) + '</th><th>' + esc(t('bh.method')) + '</th><th class="c">' + esc(t('bh.round')) + '</th><th class="r">' + esc(t('bh.pts')) + '</th></tr></thead><tbody>' + bh + '</tbody></table></div>' : '<p class="xh-empty">' + esc(t('bh.none')) + '</p>',
      '<span>' + rec(r) + '</span>');
    var chartBox = box(esc(t('chart.title')), '<div class="xh-box-b">' + chart(f) + '</div>');
    var cmpBox = D.fighters.length > 1 ? box(esc(t('cmp.title')), '<form class="xh-cmp-form" action="/so-sanh"><input type="hidden" name="a" value="' + esc(f.slug) + '"><label class="xh-sr" for="xhCmpB">' + esc(t('cmp.with')) + '</label>' +
      '<select id="xhCmpB" name="b">' + fighterOpts((D.fighters.filter(function (x) { return x.id !== f.id && x.gender === f.gender && x.division === f.division; }).sort(byPoints)[0] || {}).slug, f.id) + '</select><button type="submit">' + esc(t('cmp.go')) + '</button></form>') : '';
    var bio = pick(f.bio) ? box(esc(t('bio.title')), '<div class="xh-box-b"><p>' + esc(pick(f.bio)).replace(/\n/g, '<br>') + '</p></div>') : '';
    // cùng hạng cân
    var same = D.fighters.filter(function (x) { return x.gender === f.gender && x.division === f.division && ranked(x); }).sort(byPoints);
    var sameBox = same.length ? box(esc(t('side.sameDiv')), '<div class="xh-box-b"><ul class="xh-list">' + same.map(function (x) {
      return '<li' + (x.id === f.id ? ' class="me"' : '') + '><span class="rk">' + x.rank.div + '</span>' + photo(x, 'sm') + '<div class="grow">' + (x.id === f.id ? '<b>' + esc(x.name) + '</b>' : '<a href="' + href(x) + '">' + esc(x.name) + '</a>') + '<small>' + rec(x.record) + '</small></div><span class="xh-pts">' + pts(x.points) + '</span></li>';
    }).join('') + '</ul></div>', '<span>' + esc(divName(f.division)) + '</span>') : '';
    root.innerHTML = top + page('<div class="xh-grid"><div class="xh-col">' + facts + skills + chartBox + upBox + bhBox + bio + '</div>' +
      '<aside class="xh-col xh-side">' + cmpBox + sameBox + sideTop(f.gender) + sideUpcoming() + '</aside></div>');
  }

  /* ─── Sự kiện: thẻ sự kiện, mỗi trận góc đỏ | kết quả / dự đoán | góc xanh ─ */
  function bout(e, b, opts) {
    var a = byId[b.a], c = byId[b.b];
    if (!a || !c) return '';
    var won = b.result === 'a' || b.result === 'b', showPts = opts && opts.pts && b.result && b.result !== 'nc';
    var corner = function (f, side, d) {
      var mark = won ? res(b.result === side ? 'W' : 'L') : b.result === 'draw' ? res('D') : b.result === 'nc' ? res('NC') : '';
      return '<div class="xh-cn ' + side + (won ? (b.result === side ? ' win' : ' lose') : '') + '">' + photo(f, 'md') + '<div class="xh-cn-t"><a href="' + href(f) + '">' + esc(f.name) + '</a><small>' + rec(f.record) +
        (f.stars ? stars(f.stars) : '') + (showPts ? delta(d) : '') + '</small></div>' + mark + '</div>';
    };
    var mid;
    if (won) mid = '<b class="xh-bm">' + methodTitle(b.method) + '</b><small>' + (b.round ? esc(t('ev.round', { n: b.round })) + (b.time ? ' ' + esc(b.time) : '') : esc(t('ev.rounds', { n: b.rounds }))) + '</small>';
    else if (b.result === 'draw') mid = '<b class="xh-bm">' + esc(t('ev.draw')) + '</b>' + (b.method ? '<small>' + methodTitle(b.method) + '</small>' : '');
    else if (b.result === 'nc') mid = '<b class="xh-bm">' + esc(t('ev.nc')) + '</b>';
    else if (e.status === 'pending') mid = '<span class="xh-vs" aria-hidden="true">VS</span><small>' + esc(t('ev.pending')) + '</small>';
    else mid = '<span class="xh-vs" aria-hidden="true">VS</span><small>' + esc(t('ev.rounds', { n: b.rounds })) + ', ' + esc(t('prob.short')) + '</small>' + probBar(a, c) + '<a class="xh-cmp-link" href="' + cmpHref(a, c) + '">' + esc(t('cmp.go')) + '</a>';
    return '<div class="xh-bout' + (b.main ? ' main' : '') + '"><p class="xh-bout-k">' + (b.main ? '<span class="xh-mainev">' + esc(t('ev.main')) + '</span>' : '') + esc(divName(b.division)) + '</p>' +
      corner(a, 'a', b.deltaA) + '<div class="xh-bc">' + mid + '</div>' + corner(c, 'b', b.deltaB) + '</div>';
  }
  function bouts(e, opts) {
    return e.bouts.length ? '<div class="xh-bouts">' + e.bouts.map(function (b) { return bout(e, b, opts); }).join('') + '</div>' : '<p class="xh-empty">' + esc(t('ev.noBouts')) + '</p>';
  }
  function evMeta(e, longDate) {
    var where = [e.venue, e.city].filter(Boolean).join(', ');
    return '<p class="xh-ev-meta"><span>' + esc(longDate ? dateOf(e.date, true) : new Date(e.date + 'T00:00:00Z').toLocaleDateString(en() ? 'en-GB' : 'vi-VN', { weekday: 'long', timeZone: 'UTC' })) + (e.time ? ', ' + esc(e.time) : '') + '</span>' +
      (where ? '<span>' + esc(where) + '</span>' : '') + (e.bouts.length ? '<span>' + esc(t('ev.bouts', { n: e.bouts.length })) + '</span>' : '') + '</p>';
  }
  var evTags = function (e) { return '<div class="xh-ev-tags">' + typeTag(e) + (e.status === 'pending' ? '<span class="xh-tag">' + esc(t('ev.pending')) + '</span>' : '') + '</div>'; };
  function eventBlock(e) {
    return '<article class="xh-ev"><header class="xh-ev-h">' + dateBlock(e.date) + '<div>' + evTags(e) + '<h2><a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a></h2>' + evMeta(e) + '</div>' +
      '<a class="xh-btn" href="' + evHref(e) + '">' + esc(t('ev.detail')) + '</a></header>' + bouts(e) + '</article>';
  }
  function pageEvents() {
    var tab = qs().tab === 'res' ? 'res' : 'up', up = upcoming(), done = finished();
    var list = tab === 'up' ? up : done;
    root.innerHTML = hero({ h1: esc(t('ev.title')), sub: '<p>' + esc(t('ev.sub')) + '</p>', ctl: seg('tab', [['up', t('ev.upcoming') + ' (' + up.length + ')'], ['res', t('ev.results') + ' (' + done.length + ')']], tab) }) +
      page('<div class="xh-grid"><div class="xh-col">' + (list.length ? list.map(eventBlock).join('') : '<section class="xh-box"><p class="xh-empty">' + esc(tab === 'up' ? t('ev.noUp') : t('ev.noRes')) + '</p></section>') + '</div>' +
      '<aside class="xh-col xh-side">' + sideTop('m') + sideTop('f') + '</aside></div>');
    bindFilters(function (k, v) { setQs({ tab: v === 'res' ? 'res' : '' }); render(); });
  }
  function pageEvent(slug) {
    var e = evBySlug[slug];
    if (!e) { notFound('nf.event', '/su-kien', 'back.events'); return; }
    document.title = pick(e.name) + ' · Dapper Combat Academy Ranking';
    var about = e.poster || pick(e.desc) ? box(esc(t('ev.about')), '<div class="xh-box-b">' + (e.poster ? '<img class="xh-poster" src="' + esc(e.poster) + '" alt="">' : '') + (pick(e.desc) ? '<p>' + esc(pick(e.desc)).replace(/\n/g, '<br>') + '</p>' : '') + '</div>') : '';
    root.innerHTML = hero({ crumb: crumb('/su-kien', t('nav.events'), pick(e.name)), pre: evTags(e), h1: esc(pick(e.name)), sub: evMeta(e, true), side: dateBlock(e.date, 'lg') }) +
      page('<div class="xh-grid"><div class="xh-col">' + box(esc(t('ev.bouts', { n: e.bouts.length })), bouts(e, { pts: e.status === 'done' })) + about + '</div>' +
      '<aside class="xh-col xh-side">' + sideUpcoming() + sideLatest() + '</aside></div>');
  }

  /* ─── So sánh 2 võ sĩ: /so-sanh?a=<võ sĩ>&b=<võ sĩ> ─────────────────────── */
  function pageCompare() {
    var q = qs(), list = D.fighters.slice().sort(byPoints);
    var A = bySlug[q.a] || list[0], B = bySlug[q.b] && bySlug[q.b] !== A ? bySlug[q.b] : list.filter(function (x) { return x !== A && x.gender === (A || {}).gender; })[0] || list.filter(function (x) { return x !== A; })[0];
    if (!A || !B) { root.innerHTML = hero({ h1: esc(t('cmp.title')), sub: '<p>' + esc(t('cmp.hint')) + '</p>' }); return; }
    document.title = A.name + ' vs ' + B.name + ' · Dapper Combat Academy Ranking';
    var pickers = '<div class="xh-cmp-pick"><label class="a">' + esc(t('cmp.red')) + ' <select data-f="a">' + fighterOpts(A.slug) + '</select></label>' +
      '<button type="button" class="xh-swap" data-swap>' + esc(t('cmp.swap')) + '</button><label class="b">' + esc(t('cmp.blue')) + ' <select data-f="b">' + fighterOpts(B.slug) + '</select></label></div>';
    var card = function (f, side) {
      return '<div class="xh-cmp-card ' + side + '">' + portrait(f) + '<div><a href="' + href(f) + '"><b>' + esc(f.name) + '</b></a>' + (f.nickname ? '<small>“' + esc(f.nickname) + '”</small>' : '') +
        rec(f.record) + '<span>' + stars(f.stars) + ' ' + tier(f.tier) + '</span></div></div>';
    };
    // dòng thông số: cao hơn = tốt hơn (better: 1), thấp hơn = tốt hơn (better: -1), 0 = không so
    var num2 = function (v, fmt) { return v == null || v === '' ? '—' : fmt ? fmt(v) : v; };
    var rows = [
      [t('pf.points'), A.points, B.points, 1, pts], [t('sk.skill'), A.skillPoints, B.skillPoints, 1, numFmt], [t('sk.fight'), A.fightPoints, B.fightPoints, 1, function (v) { return (v > 0 ? '+' : '') + pts(v); }],
      [t('pf.rank'), ranked(A) ? A.rank.overall : null, ranked(B) ? B.rank.overall : null, -1, function (v) { return '#' + v; }],
      [t('pf.win'), A.record.w, B.record.w, 1], [t('pf.loss'), A.record.l, B.record.l, -1], [t('pf.draw'), A.record.d, B.record.d, 0], ['KO', A.record.ko, B.record.ko, 1],
      [t('pf.bouts'), A.record.bouts + ' · ' + A.record.rounds, B.record.bouts + ' · ' + B.record.rounds, 0],
      [t('pf.age'), A.age, B.age, 0], [t('pf.height'), A.height, B.height, 0, function (v) { return t('cm', { n: v }); }], [t('pf.reach'), A.reach, B.reach, 1, function (v) { return t('cm', { n: v }); }],
      [t('pf.weight'), A.weight, B.weight, 0, function (v) { return t('kg', { n: numFmt(v, 1) }); }], [t('pf.stance'), stance(A.stance), stance(B.stance), 0], [t('pf.div'), divName(A.division), divName(B.division), 0],
      [t('pf.home'), A.hometown, B.hometown, 0],
    ].map(function (r) {
      var a = r[1], b = r[2], wa = r[3] && a != null && b != null && a !== b && (r[3] > 0 ? a > b : a < b), wb = r[3] && a != null && b != null && a !== b && !wa;
      return '<tr><td class="r' + (wa ? ' xh-better' : '') + '">' + esc(num2(a, r[4])) + '</td><th>' + esc(r[0]) + '</th><td' + (wb ? ' class="xh-better"' : '') + '>' + esc(num2(b, r[4])) + '</td></tr>';
    }).join('');
    var bars = SKILL.map(function (k) {
      var a = A.skills[k.id] || 0, b = B.skills[k.id] || 0;
      return '<div class="xh-bfly"><em' + (a > b ? ' class="xh-better"' : '') + '>' + a + '</em><i class="a"><b style="width:' + a + '%"></b></i><span>' + esc(pick(k)) + '</span><i class="b"><b style="width:' + b + '%"></b></i><em' + (b > a ? ' class="xh-better"' : '') + '>' + b + '</em></div>';
    }).join('');
    var h2h = (A.bouts || []).filter(function (x) { return x.opp === B.id; });
    var tally = h2h.reduce(function (o, x) { o[x.res] = (o[x.res] || 0) + 1; return o; }, {});
    var h2hHtml = h2h.length ? '<p class="xh-h2h"><b>' + esc(A.name) + '</b> ' + (tally.W || 0) + ' – ' + (tally.L || 0) + ' <b>' + esc(B.name) + '</b>' + (tally.D ? ', ' + esc(t('ev.draw')).toLowerCase() + ' ' + tally.D : '') + '</p>' +
      '<div class="xh-tw"><table class="xh-table"><thead><tr><th>' + esc(t('bh.date')) + '</th><th class="xh-hide-sm">' + esc(t('bh.event')) + '</th><th class="c">' + esc(A.name.split(' ').pop()) + '</th><th>' + esc(t('bh.method')) + '</th><th class="c">' + esc(t('bh.round')) + '</th></tr></thead><tbody>' +
      h2h.map(function (x) { var e = evById[x.event]; return '<tr><td class="num nw">' + esc(dateOf(x.date)) + '</td><td class="xh-hide-sm">' + (e ? '<a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a>' : '') + '</td><td class="c">' + res(x.res) + '</td><td>' + methodTitle(x.method) + '</td><td class="c num">' + (x.round ? x.round + '/' + x.rounds : x.rounds) + '</td></tr>'; }).join('') + '</tbody></table></div>'
      : '<p class="xh-empty">' + esc(t('cmp.noH2h')) + '</p>';
    root.innerHTML = hero({ h1: esc(t('cmp.title')), sub: '<p>' + esc(t('cmp.hint')) + '</p>',
      after: pickers + '<div class="xh-cmp-head">' + card(A, 'a') + '<div class="xh-cmp-vs" aria-hidden="true">VS</div>' + card(B, 'b') + '</div><div class="xh-cmp-prob"><small>' + esc(t('prob')) + '</small>' + probBar(A, B) + '</div>' }) +
      page('<div class="xh-grid xh-cmp-grid"><div class="xh-col">' + box(esc(t('cmp.stats')), '<div class="xh-tw"><table class="xh-table xh-tape"><tbody>' + rows + '</tbody></table></div>') +
      box(esc(t('cmp.h2h')), h2hHtml) + '</div><aside class="xh-col">' + box(esc(t('cmp.skills')), '<div class="xh-box-b">' + radar([{ f: A, color: '#D4372E' }, { f: B, color: '#2456A6' }]) +
      '<p class="xh-legend"><span class="a">' + esc(A.name) + '</span><span class="b">' + esc(B.name) + '</span></p><div class="xh-bflys">' + bars + '</div></div>') + '</aside></div>');
    bindFilters(function (k, v) { var o = { a: A.slug, b: B.slug }; o[k] = v; setQs(o); render(); });
    root.querySelector('[data-swap]').addEventListener('click', function () { setQs({ a: B.slug, b: A.slug }); render(); });
  }
  function notFound(msg, back, backLabel) {
    root.innerHTML = hero({ h1: esc(t('nf.title')), sub: '<p>' + esc(t(msg)) + '</p><p><a href="' + back + '">' + esc(t(backLabel)) + '</a></p>' });
  }

  /* ─── Điều hướng, tìm kiếm, ngôn ngữ ──────────────────────────────────── */
  var path = location.pathname.replace(/\/+$/, '') || '/', m;
  var route = (m = /^\/vo-si\/([^/]+)$/.exec(path)) ? ['fighter', decodeURIComponent(m[1])] : (m = /^\/su-kien\/([^/]+)$/.exec(path)) ? ['event', decodeURIComponent(m[1])]
    : path === '/vo-si' ? ['fighters'] : path === '/su-kien' ? ['events'] : path === '/so-sanh' ? ['compare'] : ['ranking'];
  var SEC = { ranking: 'ranking', fighters: 'fighters', fighter: 'fighters', events: 'events', event: 'events', compare: 'compare' };
  var TITLE = { ranking: 'nav.ranking', fighters: 'nav.fighters', events: 'nav.events' };
  function render() {
    [].forEach.call(document.querySelectorAll('[data-t]'), function (el) { el.textContent = t(el.getAttribute('data-t')); });
    [].forEach.call(document.querySelectorAll('[data-ph]'), function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-ph'))); el.setAttribute('aria-label', t(el.getAttribute('data-ph'))); });
    [].forEach.call(document.querySelectorAll('.xh-tabs a'), function (a) { var on = a.getAttribute('data-sec') === SEC[route[0]]; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (TITLE[route[0]]) document.title = t(TITLE[route[0]]) + ' — Dapper Combat Academy Ranking';
    if (route[0] === 'ranking') pageRanking();
    else if (route[0] === 'fighters') pageFighters();
    else if (route[0] === 'fighter') pageFighter(route[1]);
    else if (route[0] === 'events') pageEvents();
    else if (route[0] === 'compare') pageCompare();
    else pageEvent(route[1]);
  }
  // mục menu trang chính đang tắt ở /admin → Thiết lập → Thương hiệu & menu
  [].forEach.call(document.querySelectorAll('[data-xh-site] [data-nav]'), function (li) { if (DC.navOn && !DC.navOn(li.getAttribute('data-nav'))) li.style.display = 'none'; });
  document.querySelector('.xh-lang').addEventListener('click', function (e) {
    var b = e.target.closest('[data-lang]');
    if (!b) return;
    document.documentElement.lang = b.getAttribute('data-lang');
    [].forEach.call(this.querySelectorAll('[data-lang]'), function (x) { x.classList.toggle('on', x === b); });
    render();
  });
  // gợi ý khi gõ tên võ sĩ (bàn phím: ↑ ↓ Enter, Esc đóng)
  var form = document.querySelector('.xh-search'), input = form.querySelector('input'), sugg = document.getElementById('xhSugg'), cur = -1;
  function suggest() {
    var w = norm(input.value);
    var list = w ? D.fighters.filter(function (f) { return norm(f.name + ' ' + (f.nickname || '')).indexOf(w) > -1; }).slice(0, 8) : [];
    cur = -1;
    sugg.innerHTML = list.map(function (f, i) {
      return '<li role="option" id="xhS' + i + '"><a href="' + href(f) + '">' + photo(f, 'sm') + '<span><b>' + esc(f.name) + '</b>' + (f.nickname ? ' <small>“' + esc(f.nickname) + '”</small>' : '') + '<br><small>' + esc(divName(f.division)) + '</small> ' + rec(f.record) + '</span></a></li>';
    }).join('');
    sugg.hidden = !list.length;
    input.setAttribute('aria-expanded', list.length ? 'true' : 'false');
  }
  input.addEventListener('input', suggest);
  input.addEventListener('keydown', function (e) {
    var items = sugg.querySelectorAll('a');
    if (e.key === 'Escape') { sugg.hidden = true; return; }
    if (!items.length || sugg.hidden || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter')) return;
    if (e.key === 'Enter') { if (cur > -1) { e.preventDefault(); location.href = items[cur].getAttribute('href'); } return; }
    e.preventDefault();
    cur = (cur + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    [].forEach.call(items, function (a, i) { a.classList.toggle('on', i === cur); });
    input.setAttribute('aria-activedescendant', 'xhS' + cur);
  });
  document.addEventListener('click', function (e) { if (!form.contains(e.target)) sugg.hidden = true; });
  if (route[0] === 'fighters' && qs().q) input.value = qs().q;

  render();
})();
