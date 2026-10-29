/* Dapper Combat Academy Ranking — /xep-hang (ranking), /vo-si (danh sách) · /vo-si/<võ sĩ> (hồ sơ), /su-kien (lịch, kết quả) · /su-kien/<sự kiện>.
   Dữ liệu: window.__DC_RANKING (/assets/data/ranking.js) — server đã tính điểm, thứ hạng, thành tích (lib/ranking.js).
   Võ sĩ, sự kiện, kết quả, điểm kỹ năng sửa ở /admin → Academy Ranking. */
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
      'foot.note': 'Dapper Combat Academy Ranking — bảng xếp hạng nội bộ học viện, chỉ tính các trận đấu, buổi sparring có chấm điểm và kỳ đánh giá kỹ năng tại Dapper Combat Academy.', 'foot.home': '← Về trang chủ Dapper Combat',
      'rank.title': 'Ranking võ sĩ', 'updated': 'Cập nhật {d}', 'g.m': 'Nam', 'g.f': 'Nữ', 'g.all': 'Tất cả',
      'f.div': 'Hạng cân', 'f.tier': 'Hạng', 'f.status': 'Trạng thái', 'f.allDiv': 'Tất cả hạng cân', 'f.allTier': 'Tất cả hạng', 'f.allStatus': 'Mọi trạng thái', 'f.inactive': 'Hiện cả võ sĩ nghỉ thi đấu', 'f.q': 'Tên hoặc biệt danh…',
      'col.fighter': 'Võ sĩ', 'col.points': 'Điểm', 'col.stars': 'Sao', 'col.tier': 'Hạng', 'col.age': 'Tuổi', 'col.record': 'T-B-H', 'col.last6': '6 trận gần nhất', 'col.stance': 'Thế đứng',
      'col.div': 'Hạng cân', 'col.home': 'Quê quán', 'col.gender': 'Giới tính', 'col.status': 'Trạng thái',
      'stance.orthodox': 'Thuận', 'stance.southpaw': 'Tay trái', 'stance.switch': 'Đổi thế', 'status.active': 'Đang thi đấu', 'status.inactive': 'Nghỉ thi đấu',
      'res.W': 'T', 'res.L': 'B', 'res.D': 'H', 'res.NC': 'KQ', 'res.W.t': 'Thắng', 'res.L.t': 'Thua', 'res.D.t': 'Hòa', 'res.NC.t': 'Không kết quả',
      'none': 'Không có võ sĩ phù hợp.', 'side.upcoming': 'Sự kiện sắp tới', 'side.latest': 'Kết quả mới nhất', 'side.leaders': 'Số 1 từng hạng cân', 'side.all': 'Xem tất cả →',
      'side.sameDiv': 'Cùng hạng cân', 'side.top': 'Top 5 Academy', 'side.noUp': 'Chưa có sự kiện sắp tới.',
      'how.title': 'Cách tính điểm',
      'how.1': 'Điểm kỹ năng: HLV chấm 6 kỹ năng (kỹ thuật, tốc độ, sức mạnh, phòng thủ, thể lực, di chuyển) theo thang 100; trung bình × 10 (tối đa 1.000).',
      'how.2': 'Điểm thắng thua: mỗi trận đấu / sparring có chấm điểm cộng hoặc trừ điểm như BoxRec — thắng đối thủ mạnh hơn được nhiều điểm, thua đối thủ yếu hơn mất nhiều điểm; thắng KO / TKO được thưởng thêm.',
      'how.3': 'Điểm xếp hạng = điểm kỹ năng + điểm thắng thua. Hạng: Tinh anh từ 850, Hạng A từ 750, B từ 650, C từ 550, dưới 550 là Tân binh.',
      'how.4': 'Sao (1–5) theo thứ hạng trong cùng giới tính. Chỉ võ sĩ đang thi đấu được xếp hạng.',
      'pf.points': 'Điểm xếp hạng', 'pf.rank': 'Thứ hạng', 'pf.tier': 'Hạng', 'pf.div': 'Hạng cân', 'pf.status': 'Trạng thái', 'pf.stance': 'Thế đứng', 'pf.age': 'Tuổi',
      'pf.height': 'Chiều cao', 'pf.reach': 'Sải tay', 'pf.weight': 'Cân nặng', 'pf.home': 'Quê quán', 'pf.joined': 'Gia nhập Academy', 'pf.coach': 'Huấn luyện viên', 'pf.debut': 'Trận đầu tiên',
      'pf.bouts': 'Số trận · số hiệp', 'pf.ko': 'Tỉ lệ thắng KO', 'pf.streak': 'Chuỗi hiện tại', 'pf.win': 'Thắng', 'pf.loss': 'Thua', 'pf.draw': 'Hòa', 'pf.kos': '{n} KO',
      'pf.inDiv': '#{r} / {n} {div}', 'pf.inClub': '#{r} / {n} {g} toàn Academy', 'pf.unranked': 'Chưa xếp hạng (nghỉ thi đấu)', 'pf.streakOf': '{n} trận {r} liên tiếp',
      'sk.title': 'Đánh giá kỹ năng', 'sk.skill': 'Điểm kỹ năng', 'sk.fight': 'Điểm thắng thua', 'sk.total': 'Điểm xếp hạng', 'sk.avg': 'trung bình {n}/100',
      'sk.last': 'HLV chấm lần gần nhất: {d}', 'sk.hist': 'Lịch sử chấm điểm', 'sk.date': 'Ngày', 'sk.avgCol': 'Trung bình', 'sk.change': 'Thay đổi',
      'bh.title': 'Lịch sử thi đấu', 'bh.date': 'Ngày', 'bh.opp': 'Đối thủ', 'bh.event': 'Sự kiện', 'bh.res': 'KQ', 'bh.method': 'Cách thắng', 'bh.round': 'Hiệp', 'bh.pts': 'Điểm ±', 'bh.none': 'Chưa có trận nào.',
      'up.title': 'Trận sắp tới', 'bio.title': 'Giới thiệu', 'dir.title': 'Thông tin võ sĩ', 'dir.count': '{n} võ sĩ',
      'ev.title': 'Lịch sự kiện', 'ev.upcoming': 'Sắp diễn ra', 'ev.results': 'Kết quả', 'ev.pending': 'Chờ cập nhật kết quả', 'ev.noUp': 'Chưa có sự kiện sắp tới.', 'ev.noRes': 'Chưa có kết quả.',
      'ev.red': 'Góc đỏ', 'ev.blue': 'Góc xanh', 'ev.rounds': '{n} hiệp', 'ev.main': 'Trận chính', 'ev.detail': 'Chi tiết →', 'ev.bouts': '{n} trận',
      'ev.noBouts': 'Sự kiện không có trận đấu (đánh giá kỹ năng / hoạt động Academy).', 'ev.venue': 'Địa điểm', 'ev.time': 'Thời gian', 'ev.type': 'Loại sự kiện', 'ev.result': 'Kết quả',
      'ev.draw': 'Hòa', 'ev.nc': 'Không kết quả', 'ev.wins': '{n} thắng', 'ev.round': 'H{n}', 'ev.ptsCol': 'Điểm ±',
      'type.fight': 'Fight night', 'type.sparring': 'Sparring', 'type.assessment': 'Đánh giá kỹ năng', 'type.other': 'Hoạt động Academy',
      'm.KO': 'Hạ đo ván', 'm.TKO': 'Trọng tài dừng trận', 'm.RTD': 'Bỏ cuộc giữa hiệp', 'm.DQ': 'Truất quyền thi đấu', 'm.UD': 'Thắng điểm tuyệt đối', 'm.SD': 'Thắng điểm không tuyệt đối', 'm.MD': 'Thắng điểm đa số', 'm.PTS': 'Thắng điểm',
      'nf.fighter': 'Không tìm thấy võ sĩ này — có thể đường dẫn đã sai hoặc võ sĩ không còn hiển thị.', 'nf.event': 'Không tìm thấy sự kiện này.', 'back.ranking': '← Về bảng ranking', 'back.events': '← Về lịch sự kiện',
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
      'foot.note': 'Dapper Combat Academy Ranking — in-house rankings: only bouts, scored sparring and skills assessments held at Dapper Combat Academy count.', 'foot.home': '← Back to Dapper Combat',
      'rank.title': 'Fighter rankings', 'updated': 'Updated {d}', 'g.m': 'Men', 'g.f': 'Women', 'g.all': 'All',
      'f.div': 'Division', 'f.tier': 'Class', 'f.status': 'Status', 'f.allDiv': 'All divisions', 'f.allTier': 'All classes', 'f.allStatus': 'Any status', 'f.inactive': 'Include inactive fighters', 'f.q': 'Name or nickname…',
      'col.fighter': 'Fighter', 'col.points': 'Points', 'col.stars': 'Rating', 'col.tier': 'Class', 'col.age': 'Age', 'col.record': 'W-L-D', 'col.last6': 'Last 6', 'col.stance': 'Stance',
      'col.div': 'Division', 'col.home': 'Hometown', 'col.gender': 'Sex', 'col.status': 'Status',
      'stance.orthodox': 'Orthodox', 'stance.southpaw': 'Southpaw', 'stance.switch': 'Switch', 'status.active': 'Active', 'status.inactive': 'Inactive',
      'res.W': 'W', 'res.L': 'L', 'res.D': 'D', 'res.NC': 'NC', 'res.W.t': 'Win', 'res.L.t': 'Loss', 'res.D.t': 'Draw', 'res.NC.t': 'No contest',
      'none': 'No fighters match.', 'side.upcoming': 'Upcoming events', 'side.latest': 'Latest results', 'side.leaders': 'Division leaders', 'side.all': 'View all →',
      'side.sameDiv': 'Same division', 'side.top': 'Academy top 5', 'side.noUp': 'No upcoming events.',
      'how.title': 'How points work',
      'how.1': 'Skill points: coaches score 6 skills (technique, speed, power, defense, stamina, footwork) out of 100; the average × 10 (max 1,000).',
      'how.2': 'Fight points: every bout and scored sparring adds or removes points, BoxRec-style — beating a stronger opponent earns more, losing to a weaker one costs more; KO / TKO wins get a bonus.',
      'how.3': 'Ranking points = skill points + fight points. Classes: Elite from 850, Class A from 750, B from 650, C from 550, Rookie below 550.',
      'how.4': 'Stars (1–5) follow the ranking within each sex. Only active fighters are ranked.',
      'pf.points': 'Ranking points', 'pf.rank': 'Ranking', 'pf.tier': 'Class', 'pf.div': 'Division', 'pf.status': 'Status', 'pf.stance': 'Stance', 'pf.age': 'Age',
      'pf.height': 'Height', 'pf.reach': 'Reach', 'pf.weight': 'Weight', 'pf.home': 'Hometown', 'pf.joined': 'Joined the academy', 'pf.coach': 'Coach', 'pf.debut': 'Debut',
      'pf.bouts': 'Bouts · rounds', 'pf.ko': 'KO win rate', 'pf.streak': 'Current streak', 'pf.win': 'Won', 'pf.loss': 'Lost', 'pf.draw': 'Drawn', 'pf.kos': '{n} KO',
      'pf.inDiv': '#{r} of {n} at {div}', 'pf.inClub': '#{r} of {n} {g} academy-wide', 'pf.unranked': 'Unranked (inactive)', 'pf.streakOf': '{n} {r} in a row',
      'sk.title': 'Skills assessment', 'sk.skill': 'Skill points', 'sk.fight': 'Fight points', 'sk.total': 'Ranking points', 'sk.avg': 'average {n}/100',
      'sk.last': 'Last assessed by coaches: {d}', 'sk.hist': 'Assessment history', 'sk.date': 'Date', 'sk.avgCol': 'Average', 'sk.change': 'Change',
      'bh.title': 'Bout history', 'bh.date': 'Date', 'bh.opp': 'Opponent', 'bh.event': 'Event', 'bh.res': 'Result', 'bh.method': 'Method', 'bh.round': 'Round', 'bh.pts': 'Points ±', 'bh.none': 'No bouts yet.',
      'up.title': 'Upcoming bouts', 'bio.title': 'About', 'dir.title': 'Fighters', 'dir.count': '{n} fighters',
      'ev.title': 'Events', 'ev.upcoming': 'Upcoming', 'ev.results': 'Results', 'ev.pending': 'Results pending', 'ev.noUp': 'No upcoming events.', 'ev.noRes': 'No results yet.',
      'ev.red': 'Red corner', 'ev.blue': 'Blue corner', 'ev.rounds': '{n} rds', 'ev.main': 'Main event', 'ev.detail': 'Details →', 'ev.bouts': '{n} bouts',
      'ev.noBouts': 'No bouts at this event (skills assessment / academy activity).', 'ev.venue': 'Venue', 'ev.time': 'Time', 'ev.type': 'Event type', 'ev.result': 'Result',
      'ev.draw': 'Draw', 'ev.nc': 'No contest', 'ev.wins': '{n} wins', 'ev.round': 'R{n}', 'ev.ptsCol': 'Points ±',
      'type.fight': 'Fight night', 'type.sparring': 'Sparring', 'type.assessment': 'Skills assessment', 'type.other': 'Academy event',
      'm.KO': 'Knockout', 'm.TKO': 'Technical knockout', 'm.RTD': 'Retired between rounds', 'm.DQ': 'Disqualification', 'm.UD': 'Unanimous decision', 'm.SD': 'Split decision', 'm.MD': 'Majority decision', 'm.PTS': 'Points',
      'nf.fighter': 'Fighter not found — the link may be wrong or the fighter is no longer listed.', 'nf.event': 'Event not found.', 'back.ranking': '← Back to the rankings', 'back.events': '← Back to events',
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
  var divName = function (id) { return DIV[id] ? pick(DIV[id]) : ''; };
  // khoảng cân của hạng: ≤ 52 kg … > 81 kg (hạng nặng nhất)
  function divRange(d) { var i = (D.divisions || []).indexOf(d); return d.max < 999 ? '≤ ' + d.max + ' kg' : '> ' + ((D.divisions[i - 1] || {}).max || '') + ' kg'; }
  var STOP = ['KO', 'TKO', 'RTD', 'DQ'];
  var href = function (f) { return '/vo-si/' + encodeURIComponent(f.slug); };
  var evHref = function (e) { return '/su-kien/' + encodeURIComponent(e.slug); };
  function photo(f, cls) {
    return f && f.photo ? '<img class="xh-th-img ' + (cls || '') + '" src="' + esc(f.photo) + '" alt="" loading="lazy" width="34" height="42">' : '<span class="xh-th-img xh-ph ' + (cls || '') + '" aria-hidden="true"></span>';
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
  function box(title, body, extra) { return '<section class="xh-box"><div class="xh-box-h"><h2>' + title + '</h2>' + (extra || '') + '</div>' + body + '</section>'; }
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
      return '<li><div class="grow"><a href="' + evHref(e) + '"><b>' + esc(pick(e.name)) + '</b></a><small>' + esc(dateOf(e.date)) + (e.time ? ' · ' + esc(e.time) : '') + ' · ' + esc(t('type.' + e.type)) + '</small>' +
        (mb ? '<small>' + vsText(mb) + '</small>' : '') + '</div></li>';
    }).join('') + '</ul><a class="xh-more" href="/su-kien">' + esc(t('side.all')) + '</a>' : '<p class="xh-empty">' + esc(t('side.noUp')) + '</p>') + '</div>');
  }
  function sideLatest() {
    var e = finished().filter(function (x) { return x.bouts.some(function (b) { return b.result; }); })[0];
    if (!e) return '';
    return box(esc(t('side.latest')), '<div class="xh-box-b"><ul class="xh-list"><li><div class="grow"><a href="' + evHref(e) + '"><b>' + esc(pick(e.name)) + '</b></a><small>' + esc(dateOf(e.date)) + '</small></div></li>' +
      e.bouts.filter(function (b) { return b.result; }).slice(0, 6).map(function (b) {
        var w = b.result === 'a' ? byId[b.a] : b.result === 'b' ? byId[b.b] : null, l = b.result === 'a' ? byId[b.b] : b.result === 'b' ? byId[b.a] : null;
        if (w && l) return '<li>' + res('W') + '<div class="grow"><a href="' + href(w) + '">' + esc(w.name) + '</a> <span class="xh-muted">› ' + esc(l.name) + '</span><small>' + esc(b.method) + (b.round ? ' · ' + esc(t('ev.round', { n: b.round })) : '') + '</small></div></li>';
        var a = byId[b.a], c = byId[b.b];
        return a && c ? '<li>' + res(b.result === 'draw' ? 'D' : 'NC') + '<div class="grow">' + esc(a.name) + ' <span class="xh-muted">–</span> ' + esc(c.name) + '</div></li>' : '';
      }).join('') + '</ul><a class="xh-more" href="/su-kien?tab=res">' + esc(t('side.all')) + '</a></div>');
  }
  function sideLeaders(g) {
    var rows = (D.divisions || []).map(function (d) {
      var f = D.fighters.filter(function (x) { return x.gender === g && x.division === d.id && ranked(x) && x.rank.div === 1; })[0];
      return f ? '<li><div class="grow"><small>' + esc(pick(d)) + '</small><a href="' + href(f) + '">' + esc(f.name) + '</a></div><span class="xh-pts">' + pts(f.points) + '</span></li>' : '';
    }).join('');
    return rows ? box(esc(t('side.leaders')) + ' · ' + esc(t('g.' + g)), '<div class="xh-box-b"><ul class="xh-list">' + rows + '</ul></div>') : '';
  }
  function sideTop(g) {
    var list = D.fighters.filter(function (f) { return f.gender === g && ranked(f); }).sort(byPoints).slice(0, 5);
    return list.length ? box(esc(t('side.top')) + ' · ' + esc(t('g.' + g)), '<div class="xh-box-b"><ul class="xh-list">' + list.map(function (f) {
      return '<li><span class="rk">' + f.rank.overall + '</span>' + photo(f, 'sm') + '<div class="grow"><a href="' + href(f) + '">' + esc(f.name) + '</a><small>' + esc(divName(f.division)) + '</small></div><span class="xh-pts">' + pts(f.points) + '</span></li>';
    }).join('') + '</ul><a class="xh-more" href="/xep-hang?g=' + g + '">' + esc(t('side.all')) + '</a></div>') : '';
  }
  function how() {
    return box(esc(t('how.title')), '<div class="xh-how"><ul><li>' + esc(t('how.1')) + '</li><li>' + esc(t('how.2')) + '</li><li>' + esc(t('how.3')) + '</li><li>' + esc(t('how.4')) + '</li></ul></div>');
  }

  /* ─── Thống kê, kỷ lục Academy ────────────────────────────────────────── */
  function sideStats() {
    var act = D.fighters.filter(function (f) { return ranked(f); });
    var done = D.events.filter(function (e) { return e.status !== 'upcoming'; }), bouts = [].concat.apply([], D.events.map(function (e) { return e.bouts; })).filter(function (b) { return b.result; });
    var kos = bouts.filter(function (b) { return (b.result === 'a' || b.result === 'b') && STOP.indexOf(b.method) > -1; }).length;
    var rounds = bouts.reduce(function (s, b) { return s + (STOP.indexOf(b.method) > -1 ? b.round || b.rounds : b.rounds); }, 0);
    var row = function (k, v) { return '<li><div class="grow">' + esc(t(k)) + '</div><b class="num">' + v + '</b></li>'; };
    return box(esc(t('stats.title')), '<div class="xh-box-b"><ul class="xh-list">' +
      row('stats.fighters', numFmt(act.length) + ' <small class="xh-muted">(' + esc(t('g.m')) + ' ' + act.filter(function (f) { return f.gender === 'm'; }).length + ' · ' + esc(t('g.f')) + ' ' + act.filter(function (f) { return f.gender === 'f'; }).length + ')</small>') +
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
  function rankRows(list, divRank, compact) {
    return list.map(function (f) {
      var rk = ranked(f) ? (divRank ? f.rank.div : f.rank.overall) : '–';
      return '<tr' + (f.status !== 'active' ? ' class="off"' : '') + '><td class="rk">' + rk + '</td><td class="c">' + moveCell(f, divRank ? 'div' : 'overall') + '</td><td>' + nameCell(f) + '</td>' +
        '<td class="r num xh-pts">' + pts(f.points) + '</td><td>' + stars(f.stars) + '</td><td' + (compact ? ' class="xh-hide-sm"' : '') + '>' + tier(f.tier) + '</td>' +
        (compact ? '' : '<td class="c num xh-hide-sm xh-hide-md">' + (f.age != null ? f.age : '—') + '</td>') + '<td class="c">' + rec(f.record) + '</td><td' + (compact ? ' class="xh-hide-sm"' : '') + '>' + last6(f.last6) + '</td>' +
        (compact ? '' : '<td class="xh-hide-md">' + esc(stance(f.stance)) + '</td><td class="xh-hide-sm nw">' + esc(divName(f.division)) + '</td><td class="xh-hide-md">' + esc(f.hometown || '') + '</td>') + '</tr>';
    }).join('');
  }
  function rankHead(compact) {
    return '<thead><tr><th class="rk">#</th><th class="c" title="' + esc(D.since ? t('move.title', { e: pick(D.since.name) }) : '') + '">±</th><th>' + esc(t('col.fighter')) + '</th><th class="r">' + esc(t('col.points')) + '</th><th>' + esc(t('col.stars')) + '</th>' +
      '<th' + (compact ? ' class="xh-hide-sm"' : '') + '>' + esc(t('col.tier')) + '</th>' + (compact ? '' : '<th class="c xh-hide-sm xh-hide-md">' + esc(t('col.age')) + '</th>') + '<th class="c">' + esc(t('col.record')) + '</th><th' + (compact ? ' class="xh-hide-sm"' : '') + '>' + esc(t('col.last6')) + '</th>' +
      (compact ? '' : '<th class="xh-hide-md">' + esc(t('col.stance')) + '</th><th class="xh-hide-sm">' + esc(t('col.div')) + '</th><th class="xh-hide-md">' + esc(t('col.home')) + '</th>') + '</tr></thead>';
  }
  function pageRanking() {
    var q = qs(), g = q.g === 'f' ? 'f' : 'm', div = DIV[q.div] ? q.div : '', tr = TIER[q.tier] ? q.tier : '', all = q.all === '1', view = q.view === 'div' && !div ? 'div' : 'all';
    var pass = function (f) { return f.gender === g && (!tr || f.tier === tr) && (all || f.status === 'active'); };
    var order = function (a, b) { return (ranked(b) ? 1 : 0) - (ranked(a) ? 1 : 0) || byPoints(a, b); };
    var body;
    if (view === 'div') {
      body = (D.divisions || []).map(function (d) {
        var list = D.fighters.filter(function (f) { return pass(f) && f.division === d.id; }).sort(order);
        return list.length ? '<p class="xh-day">' + esc(pick(d)) + ' <span class="xh-day-sub">' + divRange(d) + ' · ' + esc(t('dir.count', { n: list.length })) + '</span></p>' +
          '<div class="xh-tw"><table class="xh-table">' + rankHead(true) + '<tbody>' + rankRows(list, true, true) + '</tbody></table></div>' : '';
      }).join('') || '<p class="xh-empty">' + esc(t('none')) + '</p>';
    } else {
      var list = D.fighters.filter(function (f) { return pass(f) && (!div || f.division === div); }).sort(order);
      body = '<div class="xh-tw"><table class="xh-table">' + rankHead(false) + '<tbody>' + (rankRows(list, !!div, false) || '<tr><td colspan="12" class="xh-empty">' + esc(t('none')) + '</td></tr>') + '</tbody></table></div>';
    }
    var filters = '<div class="xh-filters">' + seg('g', [['m', t('g.m')], ['f', t('g.f')]], g) + seg('view', [['all', t('view.all')], ['div', t('view.div')]], view) +
      (view === 'all' ? select('div', t('f.div'), divOpts(), div) : '') + select('tier', t('f.tier'), tierOpts(), tr) +
      '<label><input type="checkbox" data-f="all"' + (all ? ' checked' : '') + '> ' + esc(t('f.inactive')) + '</label></div>';
    var since = D.since ? '<p class="xh-note">' + esc(t('move.note', { e: pick(D.since.name), d: dateOf(D.since.date) })) + '</p>' : '';
    root.innerHTML = '<div class="xh-grid"><div class="xh-col"><section class="xh-box"><div class="xh-box-h"><h1>' + esc(t('rank.title')) + (div && view === 'all' ? ' · ' + esc(divName(div)) : '') + ' · ' + esc(t('g.' + g)) + '</h1><span>' + esc(t('updated', { d: dateOf(D.updated) })) + '</span></div>' +
      filters + body + since + '</section>' + how() + '</div><aside class="xh-col xh-side">' + sideUpcoming() + sideLatest() + sideStats() + sideRecords() + sideLeaders(g) + '</aside></div>';
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

  /* ─── Danh sách võ sĩ ─────────────────────────────────────────────────── */
  function pageFighters() {
    var q = qs(), g = q.g === 'm' || q.g === 'f' ? q.g : '', div = DIV[q.div] ? q.div : '', st = q.st === 'active' || q.st === 'inactive' ? q.st : '', s = q.q || '';
    var want = norm(s);
    var list = D.fighters.filter(function (f) {
      return (!g || f.gender === g) && (!div || f.division === div) && (!st || f.status === st) && (!want || norm(f.name + ' ' + (f.nickname || '') + ' ' + (f.hometown || '')).indexOf(want) > -1);
    }).sort(function (a, b) { return a.name.split(' ').pop().localeCompare(b.name.split(' ').pop()) || a.name.localeCompare(b.name); });
    var rows = list.map(function (f) {
      return '<tr' + (f.status !== 'active' ? ' class="off"' : '') + '><td>' + nameCell(f) + '</td><td>' + esc(t('g.' + f.gender)) + '</td><td>' + esc(divName(f.division)) + '</td>' +
        '<td class="c">' + rec(f.record) + '</td><td class="r num xh-pts">' + pts(f.points) + '</td><td>' + stars(f.stars) + '</td><td class="xh-hide-sm">' + tier(f.tier) + '</td>' +
        '<td class="xh-hide-sm"><span class="xh-tag' + (f.status === 'active' ? ' on' : '') + '">' + esc(t('status.' + f.status)) + '</span></td><td class="xh-hide-sm">' + esc(f.hometown || '') + '</td></tr>';
    }).join('');
    root.innerHTML = '<div class="xh-grid"><div class="xh-col"><section class="xh-box"><div class="xh-box-h"><h1>' + esc(t('dir.title')) + '</h1><span>' + esc(t('dir.count', { n: list.length })) + '</span></div>' +
      '<div class="xh-filters"><input type="search" data-f="q" value="' + esc(s) + '" placeholder="' + esc(t('f.q')) + '" aria-label="' + esc(t('f.q')) + '">' +
      seg('g', [['', t('g.all')], ['m', t('g.m')], ['f', t('g.f')]], g) + select('div', t('f.div'), divOpts(), div) +
      select('st', t('f.status'), [['', t('f.allStatus')], ['active', t('status.active')], ['inactive', t('status.inactive')]], st) + '</div>' +
      '<div class="xh-tw"><table class="xh-table"><thead><tr><th>' + esc(t('col.fighter')) + '</th><th>' + esc(t('col.gender')) + '</th><th>' + esc(t('col.div')) + '</th><th class="c">' + esc(t('col.record')) + '</th>' +
      '<th class="r">' + esc(t('col.points')) + '</th><th>' + esc(t('col.stars')) + '</th><th class="xh-hide-sm">' + esc(t('col.tier')) + '</th><th class="xh-hide-sm">' + esc(t('col.status')) + '</th><th class="xh-hide-sm">' + esc(t('col.home')) + '</th></tr></thead>' +
      '<tbody>' + (rows || '<tr><td colspan="9" class="xh-empty">' + esc(t('none')) + '</td></tr>') + '</tbody></table></div></section></div>' +
      '<aside class="xh-col xh-side">' + sideTop('m') + sideTop('f') + sideUpcoming() + '</aside></div>';
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
    var grid = [0.25, 0.5, 0.75, 1].map(function (k) { return '<polygon points="' + poly(R * k) + '" fill="none" stroke="#d5d9de"/>'; }).join('');
    var axes = SKILL.map(function (s, i) { var p = pt(i, R); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="#d5d9de"/>'; }).join('');
    var shapes = list.map(function (x) {
      var val = SKILL.map(function (s, i) { return pt(i, R * (x.f.skills[s.id] || 0) / 100).map(function (v) { return v.toFixed(1); }).join(','); }).join(' ');
      return '<polygon points="' + val + '" fill="' + x.color + '" fill-opacity="0.26" stroke="' + x.color + '" stroke-width="2"/>';
    }).join('');
    var labels = SKILL.map(function (s, i) {
      var p = pt(i, R + 18), anchor = Math.abs(p[0] - cx) < 4 ? 'middle' : p[0] > cx ? 'start' : 'end';
      return '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4).toFixed(1) + '" text-anchor="' + anchor + '" font-size="10.5" fill="#3c4752">' + esc(pick(s)) + '</text>';
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
    var series = [{ v: f.skillPoints, label: t('chart.start') }].concat(pts0.map(function (b) { var o = byId[b.opp]; return { v: b.after, res: b.res, label: dateOf(b.date) + ' · ' + t('res.' + b.res + '.t') + (o ? ' · ' + o.name : '') + ' (' + (b.delta > 0 ? '+' : '') + pts(b.delta) + ')' }; }));
    var W = 640, H = 200, L = 44, Rr = 14, T = 14, Bm = 26;
    var vs = series.map(function (x) { return x.v; }), lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs);
    var pad = Math.max(15, (hi - lo) * 0.25); lo = Math.floor((lo - pad) / 10) * 10; hi = Math.ceil((hi + pad) / 10) * 10;
    var X = function (i) { return L + (series.length === 1 ? (W - L - Rr) / 2 : i * (W - L - Rr) / (series.length - 1)); }, Y = function (v) { return T + (hi - v) * (H - T - Bm) / (hi - lo); };
    var COL = { W: '#2f8f3a', L: '#c8302a', D: '#3f6fb0', NC: '#8a8f94' };
    var g = '';
    [lo, (lo + hi) / 2, hi].forEach(function (v) { g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="#e7eaed"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="10" fill="#5f6b76">' + Math.round(v) + '</text>'; });
    (D.tiers || []).forEach(function (x) { if (x.min > lo && x.min < hi) g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(x.min).toFixed(1) + '" y2="' + Y(x.min).toFixed(1) + '" stroke="#e5a50a" stroke-dasharray="4 4"/><text x="' + (W - Rr) + '" y="' + (Y(x.min) - 4).toFixed(1) + '" text-anchor="end" font-size="10" fill="#9a6d00">' + esc(pick(x)) + ' ' + x.min + '</text>'; });
    var line = series.map(function (x, i) { return X(i).toFixed(1) + ',' + Y(x.v).toFixed(1); }).join(' ');
    var dots = series.map(function (x, i) { return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(x.v).toFixed(1) + '" r="' + (i ? 5 : 4) + '" fill="' + (x.res ? COL[x.res] : '#fff') + '" stroke="' + (x.res ? '#fff' : '#D4372E') + '" stroke-width="2"><title>' + esc(x.label + ': ' + pts(x.v)) + '</title></circle>'; }).join('');
    var xl = '<text x="' + X(0).toFixed(1) + '" y="' + (H - 6) + '" font-size="10" fill="#5f6b76">' + esc(t('chart.start')) + '</text><text x="' + X(series.length - 1).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="end" font-size="10" fill="#5f6b76">' + esc(dateOf(pts0[pts0.length - 1].date)) + '</text>';
    return '<div class="xh-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('chart.title')) + '">' + g + '<polyline points="' + line + '" fill="none" stroke="#D4372E" stroke-width="2.5" stroke-linejoin="round"/>' + dots + xl + '</svg></div>';
  }
  // chọn võ sĩ (nhóm Nam / Nữ, kèm thành tích)
  function fighterOpts(sel, skip) {
    return ['m', 'f'].map(function (g) {
      var list = D.fighters.filter(function (x) { return x.gender === g && x.id !== skip; }).sort(byPoints);
      return list.length ? '<optgroup label="' + esc(t('g.' + g)) + '">' + list.map(function (x) {
        return '<option value="' + esc(x.slug) + '"' + (x.slug === sel ? ' selected' : '') + '>' + esc(x.name + ' · ' + divName(x.division) + ' · ' + x.record.w + '-' + x.record.l + '-' + x.record.d) + '</option>';
      }).join('') + '</optgroup>' : '';
    }).join('');
  }
  function pageFighter(slug) {
    var f = bySlug[slug];
    if (!f) { notFound('nf.fighter', '/xep-hang', 'back.ranking'); return; }
    document.title = f.name + (f.nickname ? ' “' + f.nickname + '”' : '') + ' · Dapper Combat Academy Ranking';
    var r = f.record, rank = ranked(f)
      ? esc(t('pf.inDiv', { r: f.rank.div, n: f.rank.divOf, div: divName(f.division) })) + '<br><small>' + esc(t('pf.inClub', { r: f.rank.overall, n: f.rank.overallOf, g: t('g' + f.gender) })) + '</small>'
      : '<small>' + esc(t('pf.unranked')) + '</small>';
    var kv = [
      [t('pf.points'), '<span class="xh-pts">' + pts(f.points) + '</span> ' + stars(f.stars)], [t('pf.rank'), rank], [t('pf.tier'), tier(f.tier)], [t('pf.div'), esc(divName(f.division))],
      [t('pf.status'), '<span class="xh-tag' + (f.status === 'active' ? ' on' : '') + '">' + esc(t('status.' + f.status)) + '</span>'],
      [t('pf.bouts'), r.bouts + ' · ' + r.rounds], [t('pf.ko'), r.w ? r.koPct + '%' : '—'],
      [t('pf.streak'), f.streak ? esc(t('pf.streakOf', { n: f.streak.n, r: t('res.' + f.streak.res + '.t').toLowerCase() })) : '—'],
      [t('pf.stance'), esc(stance(f.stance))], [t('pf.age'), f.age != null ? f.age : '—'], [t('pf.height'), f.height ? esc(t('cm', { n: f.height })) : '—'],
      [t('pf.reach'), f.reach ? esc(t('cm', { n: f.reach })) : '—'], [t('pf.weight'), f.weight ? esc(t('kg', { n: numFmt(f.weight, 1) })) : '—'], [t('pf.home'), esc(f.hometown || '—')],
      [t('pf.joined'), f.joined ? esc(dateOf(f.joined)) : '—'], [t('pf.coach'), esc(f.coach || '—')], [t('pf.debut'), f.debut ? esc(dateOf(f.debut)) : '—'],
    ].map(function (x) { return '<tr><th>' + esc(x[0]) + '</th><td>' + x[1] + '</td></tr>'; }).join('');
    var profile = '<section class="xh-box"><div class="xh-profile"><div class="xh-pf-photo">' + (f.photo ? '<img src="' + esc(f.photo) + '" alt="' + esc(f.name) + '">' : '<span class="xh-ph" aria-hidden="true"></span>') + '</div>' +
      '<div class="xh-pf"><h1>' + esc(f.name) + '</h1>' + (f.nickname ? '<p class="xh-nick">“' + esc(f.nickname) + '”</p>' : '<p class="xh-nick"></p>') +
      '<div class="xh-record"><div class="w"><b>' + r.w + '</b><span>' + esc(t('pf.win')) + '</span><small>' + esc(t('pf.kos', { n: r.ko })) + '</small></div>' +
      '<div class="l"><b>' + r.l + '</b><span>' + esc(t('pf.loss')) + '</span><small>' + esc(t('pf.kos', { n: r.koLost })) + '</small></div>' +
      '<div class="d"><b>' + r.d + '</b><span>' + esc(t('pf.draw')) + '</span><small>&nbsp;</small></div></div>' +
      '<table class="xh-kv">' + kv + '</table></div></div></section>';
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
      (hist.length ? '<p class="xh-muted" style="margin:10px 0 0">' + esc(t('sk.last', { d: dateOf(hist[0].date) })) + '</p>' : '') + '</div></div>' +
      (histRows ? '<div class="xh-tw"><table class="xh-table"><thead><tr><th>' + esc(t('sk.hist')) + ' · ' + esc(t('sk.date')) + '</th><th class="r">' + esc(t('sk.avgCol')) + '</th><th class="r">' + esc(t('sk.change')) + '</th></tr></thead><tbody>' + histRows + '</tbody></table></div>' : ''));
    // trận sắp tới
    var up = (f.upcoming || []).map(function (u) {
      var o = byId[u.opp], e = evById[u.event];
      return o && e ? '<tr' + (u.main ? ' class="main"' : '') + '><td class="num">' + esc(dateOf(u.date)) + '</td><td>' + nameCell(o, rec(o.record)) + '</td><td><a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a></td><td class="xh-hide-sm">' + esc(divName(u.division)) + '</td><td class="c">' + esc(t('ev.rounds', { n: u.rounds })) + '</td><td>' + probBar(f, o) + '<a class="xh-cmp-link" href="/so-sanh?a=' + encodeURIComponent(f.slug) + '&b=' + encodeURIComponent(o.slug) + '">' + esc(t('cmp.go')) + ' →</a></td></tr>' : '';
    }).join('');
    var upBox = up ? box(esc(t('up.title')), '<div class="xh-tw"><table class="xh-table"><thead><tr><th>' + esc(t('bh.date')) + '</th><th>' + esc(t('bh.opp')) + '</th><th>' + esc(t('bh.event')) + '</th><th class="xh-hide-sm">' + esc(t('col.div')) + '</th><th class="c">' + esc(t('bh.round')) + '</th><th>' + esc(t('prob')) + '</th></tr></thead><tbody>' + up + '</tbody></table></div>') : '';
    // lịch sử thi đấu
    var bh = (f.bouts || []).map(function (b) {
      var o = byId[b.opp], e = evById[b.event];
      if (!o) return '';
      return '<tr><td class="num">' + esc(dateOf(b.date)) + '</td><td>' + nameCell(o, rec(o.record)) + '</td><td class="xh-hide-sm">' + (e ? '<a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a>' : '') + '</td>' +
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
    var sameBox = same.length ? box(esc(t('side.sameDiv')) + ' · ' + esc(divName(f.division)), '<div class="xh-box-b"><ul class="xh-list">' + same.map(function (x) {
      return '<li><span class="rk">' + x.rank.div + '</span>' + photo(x, 'sm') + '<div class="grow">' + (x.id === f.id ? '<b>' + esc(x.name) + '</b>' : '<a href="' + href(x) + '">' + esc(x.name) + '</a>') + '<small>' + rec(x.record) + '</small></div><span class="xh-pts">' + pts(x.points) + '</span></li>';
    }).join('') + '</ul></div>') : '';
    root.innerHTML = '<p class="xh-crumb"><a href="/vo-si">' + esc(t('nav.fighters')) + '</a> › ' + esc(f.name) + '</p><div class="xh-grid"><div class="xh-col">' + profile + skills + chartBox + upBox + bhBox + bio + '</div>' +
      '<aside class="xh-col xh-side">' + cmpBox + sameBox + sideTop(f.gender) + sideUpcoming() + '</aside></div>';
  }

  /* ─── Sự kiện ─────────────────────────────────────────────────────────── */
  function boutRows(e, opts) {
    return e.bouts.map(function (b) {
      var a = byId[b.a], c = byId[b.b];
      if (!a || !c) return '';
      var corner = function (f, win) { return '<td' + (win ? ' class="xh-win"' : '') + '>' + nameCell(f, rec(f.record) + (f.stars ? ' ' + stars(f.stars) : '')) + '</td>'; };
      var result = '';
      if (b.result === 'a' || b.result === 'b') {
        var w = b.result === 'a' ? a : c;
        result = res('W') + ' <b>' + esc(w.name.split(' ').pop()) + '</b> ' + methodTitle(b.method) + (b.round ? ' · ' + esc(t('ev.round', { n: b.round })) + (b.time ? ' ' + esc(b.time) : '') : '');
      } else if (b.result === 'draw') result = res('D') + ' ' + esc(t('ev.draw')) + (b.method ? ' · ' + methodTitle(b.method) : '');
      else if (b.result === 'nc') result = res('NC') + ' ' + esc(t('ev.nc'));
      else if (e.status === 'pending') result = '<span class="xh-muted">' + esc(t('ev.pending')) + '</span>';
      else result = '<small class="xh-muted">' + esc(t('ev.rounds', { n: b.rounds })) + ' · ' + esc(t('prob.short')) + '</small>' + probBar(a, c) + '<a class="xh-cmp-link" href="/so-sanh?a=' + encodeURIComponent(a.slug) + '&b=' + encodeURIComponent(c.slug) + '">' + esc(t('cmp.go')) + ' →</a>';
      return '<tr' + (b.main ? ' class="main"' : '') + '>' + corner(a, b.result === 'a') + '<td class="xh-vs">vs</td>' + corner(c, b.result === 'b') +
        '<td class="xh-hide-sm">' + esc(divName(b.division)) + (b.main ? '<br><small class="xh-muted">' + esc(t('ev.main')) + '</small>' : '') + '</td><td class="xh-bout-res">' + result + '</td>' +
        (opts && opts.pts ? '<td class="r num xh-hide-sm">' + (b.result && b.result !== 'nc' ? delta(b.deltaA) + ' / ' + delta(b.deltaB) : '') + '</td>' : '') + '</tr>';
    }).join('');
  }
  function boutTable(e, opts) {
    if (!e.bouts.length) return '<p class="xh-empty">' + esc(t('ev.noBouts')) + '</p>';
    return '<div class="xh-tw"><table class="xh-table"><thead><tr><th>' + esc(t('ev.red')) + '</th><th></th><th>' + esc(t('ev.blue')) + '</th><th class="xh-hide-sm">' + esc(t('col.div')) + '</th><th>' + esc(t('ev.result')) + '</th>' +
      (opts && opts.pts ? '<th class="r xh-hide-sm">' + esc(t('ev.ptsCol')) + '</th>' : '') + '</tr></thead><tbody>' + boutRows(e, opts) + '</tbody></table></div>';
  }
  function eventBlock(e) {
    return '<p class="xh-day">' + esc(dateOf(e.date, true)) + (e.time ? ' · ' + esc(e.time) : '') + '</p><div class="xh-ev"><div class="xh-ev-h"><h2><a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a></h2>' + typeTag(e) +
      (e.status === 'pending' ? '<span class="xh-tag">' + esc(t('ev.pending')) + '</span>' : '') + '</div><div class="xh-ev-meta">' + esc([e.venue, e.city].filter(Boolean).join(', ')) +
      (e.bouts.length ? ' · ' + esc(t('ev.bouts', { n: e.bouts.length })) : '') + ' · <a href="' + evHref(e) + '">' + esc(t('ev.detail')) + '</a></div>' + boutTable(e) + '</div>';
  }
  function pageEvents() {
    var tab = qs().tab === 'res' ? 'res' : 'up', up = upcoming(), done = finished();
    var list = tab === 'up' ? up : done;
    var tabs = '<div class="xh-filters">' + seg('tab', [['up', t('ev.upcoming') + ' (' + up.length + ')'], ['res', t('ev.results') + ' (' + done.length + ')']], tab) + '</div>';
    root.innerHTML = '<div class="xh-grid"><div class="xh-col"><section class="xh-box"><div class="xh-box-h"><h1>' + esc(t('ev.title')) + '</h1><span>' + esc(t('updated', { d: dateOf(D.updated) })) + '</span></div>' + tabs +
      (list.length ? list.map(eventBlock).join('') : '<p class="xh-empty">' + esc(tab === 'up' ? t('ev.noUp') : t('ev.noRes')) + '</p>') + '</section></div>' +
      '<aside class="xh-col xh-side">' + sideTop('m') + sideTop('f') + '</aside></div>';
    bindFilters(function (k, v) { setQs({ tab: v === 'res' ? 'res' : '' }); render(); });
  }
  function pageEvent(slug) {
    var e = evBySlug[slug];
    if (!e) { notFound('nf.event', '/su-kien', 'back.events'); return; }
    document.title = pick(e.name) + ' · Dapper Combat Academy Ranking';
    var kv = [[t('ev.type'), typeTag(e)], [t('ev.time'), esc(dateOf(e.date, true)) + (e.time ? ' · ' + esc(e.time) : '')], [t('ev.venue'), esc([e.venue, e.city].filter(Boolean).join(', ') || '—')]]
      .map(function (x) { return '<tr><th>' + esc(x[0]) + '</th><td>' + x[1] + '</td></tr>'; }).join('');
    var head = '<section class="xh-box"><div class="xh-box-h"><h1>' + esc(pick(e.name)) + '</h1>' + (e.status === 'pending' ? '<span>' + esc(t('ev.pending')) + '</span>' : '') + '</div><div class="xh-box-b">' +
      (e.poster ? '<img src="' + esc(e.poster) + '" alt="" style="display:block;max-width:100%;margin:0 0 12px;border:1px solid var(--xh-line)">' : '') +
      '<table class="xh-kv">' + kv + '</table>' + (pick(e.desc) ? '<p style="margin:12px 0 0">' + esc(pick(e.desc)).replace(/\n/g, '<br>') + '</p>' : '') + '</div></section>';
    root.innerHTML = '<p class="xh-crumb"><a href="/su-kien">' + esc(t('nav.events')) + '</a> › ' + esc(pick(e.name)) + '</p><div class="xh-grid"><div class="xh-col">' + head +
      box(esc(t('ev.bouts', { n: e.bouts.length })), boutTable(e, { pts: e.status === 'done' })) + '</div><aside class="xh-col xh-side">' + sideUpcoming() + sideLatest() + '</aside></div>';
  }
  /* ─── So sánh 2 võ sĩ: /so-sanh?a=<võ sĩ>&b=<võ sĩ> ─────────────────────── */
  function pageCompare() {
    var q = qs(), list = D.fighters.slice().sort(byPoints);
    var A = bySlug[q.a] || list[0], B = bySlug[q.b] && bySlug[q.b] !== A ? bySlug[q.b] : list.filter(function (x) { return x !== A && x.gender === (A || {}).gender; })[0] || list.filter(function (x) { return x !== A; })[0];
    var pickers = '<div class="xh-filters xh-cmp-pick"><label>' + esc(t('cmp.red')) + ' <select data-f="a">' + fighterOpts(A && A.slug) + '</select></label>' +
      '<button type="button" class="xh-swap" data-swap>' + esc(t('cmp.swap')) + '</button><label>' + esc(t('cmp.blue')) + ' <select data-f="b">' + fighterOpts(B && B.slug) + '</select></label></div>';
    if (!A || !B) { root.innerHTML = '<section class="xh-box"><div class="xh-box-h"><h1>' + esc(t('cmp.title')) + '</h1></div><p class="xh-empty">' + esc(t('cmp.hint')) + '</p></section>'; return; }
    document.title = A.name + ' vs ' + B.name + ' · Dapper Combat Academy Ranking';
    var card = function (f, side) {
      return '<div class="xh-cmp-card ' + side + '">' + (f.photo ? '<img src="' + esc(f.photo) + '" alt="">' : '<span class="xh-ph"></span>') + '<a href="' + href(f) + '"><b>' + esc(f.name) + '</b></a>' +
        (f.nickname ? '<small>“' + esc(f.nickname) + '”</small>' : '') + '<div>' + rec(f.record) + '</div><div>' + stars(f.stars) + ' ' + tier(f.tier) + '</div></div>';
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
    var h2hHtml = h2h.length ? '<p class="xh-box-b"><b>' + esc(A.name) + '</b> ' + (tally.W || 0) + ' – ' + (tally.L || 0) + ' <b>' + esc(B.name) + '</b>' + (tally.D ? ' · ' + esc(t('ev.draw')) + ' ' + tally.D : '') + '</p>' +
      '<div class="xh-tw"><table class="xh-table"><thead><tr><th>' + esc(t('bh.date')) + '</th><th>' + esc(t('bh.event')) + '</th><th class="c">' + esc(A.name.split(' ').pop()) + '</th><th>' + esc(t('bh.method')) + '</th><th class="c">' + esc(t('bh.round')) + '</th></tr></thead><tbody>' +
      h2h.map(function (x) { var e = evById[x.event]; return '<tr><td class="num">' + esc(dateOf(x.date)) + '</td><td>' + (e ? '<a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a>' : '') + '</td><td class="c">' + res(x.res) + '</td><td>' + methodTitle(x.method) + '</td><td class="c num">' + (x.round ? x.round + '/' + x.rounds : x.rounds) + '</td></tr>'; }).join('') + '</tbody></table></div>'
      : '<p class="xh-empty">' + esc(t('cmp.noH2h')) + '</p>';
    root.innerHTML = '<section class="xh-box"><div class="xh-box-h"><h1>' + esc(t('cmp.title')) + '</h1><span>' + esc(t('cmp.hint')) + '</span></div>' + pickers +
      '<div class="xh-cmp-head">' + card(A, 'a') + '<div class="xh-cmp-vs">VS</div>' + card(B, 'b') + '</div>' +
      '<div class="xh-box-b xh-cmp-prob"><small class="xh-muted">' + esc(t('prob')) + '</small>' + probBar(A, B) + '</div></section>' +
      '<div class="xh-grid xh-cmp-grid"><div class="xh-col">' + box(esc(t('cmp.stats')), '<div class="xh-tw"><table class="xh-table xh-tape"><tbody>' + rows + '</tbody></table></div>') +
      box(esc(t('cmp.h2h')), h2hHtml) + '</div><aside class="xh-col">' + box(esc(t('cmp.skills')), '<div class="xh-box-b">' + radar([{ f: A, color: '#D4372E' }, { f: B, color: '#1f5fa8' }]) +
      '<p class="xh-legend"><span class="a">' + esc(A.name) + '</span><span class="b">' + esc(B.name) + '</span></p><div class="xh-bflys">' + bars + '</div></div>') + '</aside></div>';
    bindFilters(function (k, v) { var o = { a: A.slug, b: B.slug }; o[k] = v; setQs(o); render(); });
    root.querySelector('[data-swap]').addEventListener('click', function () { setQs({ a: B.slug, b: A.slug }); render(); });
  }
  function notFound(msg, back, backLabel) {
    root.innerHTML = '<section class="xh-box"><div class="xh-box-b"><p>' + esc(t(msg)) + '</p><p><a href="' + back + '">' + esc(t(backLabel)) + '</a></p></div></section>';
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
      return '<li role="option" id="xhS' + i + '"><a href="' + href(f) + '">' + photo(f, 'sm') + '<span><b>' + esc(f.name) + '</b>' + (f.nickname ? ' <small>“' + esc(f.nickname) + '”</small>' : '') + '<br><small>' + esc(divName(f.division)) + ' · </small>' + rec(f.record) + '</span></a></li>';
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
