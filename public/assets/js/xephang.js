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
      'site.home': 'Trang chủ', 'site.shop': 'Cửa hàng', 'site.career': 'Truyền Nghề', 'site.course': 'Khóa học', 'site.services': 'Dịch vụ Setup',
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
      'site.home': 'Home', 'site.shop': 'Shop', 'site.career': 'Pro Pathways', 'site.course': 'Courses', 'site.services': 'Gym Setup',
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
  // hồ sơ kiểu trang tướng: vai trò, độ khó, bộ kỹ năng, phân tích
  var T2 = {
    vi: {
      'ch.skills': 'Bộ kỹ năng', 'ch.skillsSub': 'Nội tại là thế đứng, Q W E là ba kỹ năng HLV chấm cao nhất, R là cách thắng sở trường. Bấm từng biểu tượng để xem.',
      'ch.passive': 'Nội tại', 'ch.ult': 'Tuyệt chiêu', 'ch.stats': 'Chỉ số',
      'ch.role.technique': 'Kỹ thuật gia', 'ch.role.speed': 'Tốc độ', 'ch.role.power': 'Đấm nặng', 'ch.role.defense': 'Phản đòn', 'ch.role.stamina': 'Áp sát bền bỉ', 'ch.role.footwork': 'Đánh từ xa',
      'ch.diff': 'Độ khó đối đầu', 'ch.diff.1': 'Thấp', 'ch.diff.2': 'Trung bình', 'ch.diff.3': 'Cao',
      'mv.score': 'HLV chấm {v}/100', 'mv.lvl': 'Cấp {n}/{m}',
      'mv.technique': 'Đòn chuẩn xác', 'mv.technique.d': 'Ra đòn đúng kỹ thuật, ít sơ hở, phối hợp combo mạch lạc.',
      'mv.speed': 'Tay nhanh', 'mv.speed.d': 'Ra đòn và thu tay rất nhanh, thường chiếm thế chủ động trong các pha trao đổi.',
      'mv.power': 'Cú đấm nặng ký', 'mv.power.d': 'Mỗi cú trúng đích đều có thể khiến đối thủ chao đảo.',
      'mv.defense': 'Khóa chặt và phản đòn', 'mv.defense.d': 'Chặn, né, lắc tốt rồi trả đòn ngay khi đối thủ để lộ sơ hở.',
      'mv.stamina': 'Bình xăng không đáy', 'mv.stamina.d': 'Giữ nhịp độ cao tới hiệp cuối, càng về cuối càng ép mạnh.',
      'mv.footwork': 'Bộ pháp', 'mv.footwork.d': 'Di chuyển kiểm soát khoảng cách, cắt góc và thoát khỏi góc đài khéo léo.',
      'ps.orthodox': 'Thế thuận', 'ps.orthodox.d': 'Tay trái dẫn đòn, tay phải là cú đấm quyết định. Lối đánh cân bằng, chắc chắn.',
      'ps.southpaw': 'Thế tay trái', 'ps.southpaw.d': 'Tay phải dẫn đòn, tay trái ra đòn mạnh: góc đấm ngược khiến đối thủ quen đánh với người thuận tay khó chịu.',
      'ps.switch': 'Đổi thế', 'ps.switch.d': 'Đổi qua lại giữa thế thuận và thế tay trái, khiến đối thủ khó đọc góc ra đòn.',
      'ps.reach': 'Sải tay {r} cm, chiều cao {h} cm.', 'ps.reachAdv': 'Lợi thế sải tay +{n} cm.',
      'ult.KO': 'Cú knock-out', 'ult.TKO': 'Dồn ép dừng trận', 'ult.RTD': 'Bẻ gãy ý chí', 'ult.DQ': 'Ép phạm luật', 'ult.UD': 'Áp đảo thẻ điểm', 'ult.SD': 'Thắng sát nút', 'ult.MD': 'Thắng điểm đa số', 'ult.PTS': 'Thắng điểm', 'ult.none': 'Chưa mở khóa',
      'ult.d': 'Cách thắng sở trường: {m}, {n} lần. Tổng cộng {ko} trận thắng KO / TKO ({pct}% số trận thắng).', 'ult.none.d': 'Chưa có trận thắng. Tuyệt chiêu mở khóa khi có chiến thắng đầu tiên.',
      'an.title': 'Phân tích', 'an.win': 'Tỉ lệ thắng', 'an.ko': 'Thắng KO / TKO', 'an.of': 'trên {n} trận thắng', 'an.avg': 'Điểm ± trung bình mỗi trận', 'an.rounds': 'Số hiệp đã đấu',
      'an.mu': 'Đối đầu', 'an.good': 'Dễ thắng', 'an.bad': 'Khó thắng', 'an.noGood': 'Chưa có võ sĩ nào được dự đoán yếu hơn.', 'an.noBad': 'Chưa có võ sĩ nào được dự đoán mạnh hơn.',
      'an.note': 'Khả năng thắng dự đoán theo điểm xếp hạng hiện tại, so với võ sĩ cùng giới tính ở hạng cân này và hạng cân kề bên. Bấm vào tên để so sánh chi tiết.',
    },
    en: {
      'ch.skills': 'Abilities', 'ch.skillsSub': 'Passive is the stance, Q W E are the three skills coaches rate highest, R is the favourite way to win. Click each icon to read it.',
      'ch.passive': 'Passive', 'ch.ult': 'Ultimate', 'ch.stats': 'Stats',
      'ch.role.technique': 'Technician', 'ch.role.speed': 'Speedster', 'ch.role.power': 'Power puncher', 'ch.role.defense': 'Counter-puncher', 'ch.role.stamina': 'Pressure fighter', 'ch.role.footwork': 'Out-boxer',
      'ch.diff': 'Threat level', 'ch.diff.1': 'Low', 'ch.diff.2': 'Medium', 'ch.diff.3': 'High',
      'mv.score': 'Coach score {v}/100', 'mv.lvl': 'Level {n} of {m}',
      'mv.technique': 'Clean technique', 'mv.technique.d': 'Lands correct, tidy punches, leaves few openings and strings combinations together.',
      'mv.speed': 'Fast hands', 'mv.speed.d': 'Throws and retracts very fast, usually taking the initiative in exchanges.',
      'mv.power': 'Heavy hands', 'mv.power.d': 'Any clean shot can hurt the opponent.',
      'mv.defense': 'Shell and counter', 'mv.defense.d': 'Blocks, slips and rolls well, then fires back the moment the opponent opens up.',
      'mv.stamina': 'Bottomless tank', 'mv.stamina.d': 'Keeps a high pace to the final round and pushes harder late.',
      'mv.footwork': 'Footwork', 'mv.footwork.d': 'Controls distance, cuts angles and gets out of the corners with ease.',
      'ps.orthodox': 'Orthodox stance', 'ps.orthodox.d': 'Left hand leads, the right is the finisher. A balanced, solid style.',
      'ps.southpaw': 'Southpaw stance', 'ps.southpaw.d': 'Right hand leads, the left hits hard: the mirrored angles bother opponents used to orthodox fighters.',
      'ps.switch': 'Switch hitter', 'ps.switch.d': 'Switches between orthodox and southpaw, so opponents struggle to read the angles.',
      'ps.reach': 'Reach {r} cm, height {h} cm.', 'ps.reachAdv': 'Reach advantage +{n} cm.',
      'ult.KO': 'Knockout', 'ult.TKO': 'Stoppage pressure', 'ult.RTD': 'Will breaker', 'ult.DQ': 'Forced fouls', 'ult.UD': 'Scorecard control', 'ult.SD': 'Close-call closer', 'ult.MD': 'Majority verdict', 'ult.PTS': 'Points win', 'ult.none': 'Locked',
      'ult.d': 'Favourite way to win: {m}, {n} times. {ko} KO / TKO wins in total ({pct}% of wins).', 'ult.none.d': 'No wins yet. The ultimate unlocks with the first win.',
      'an.title': 'Analysis', 'an.win': 'Win rate', 'an.ko': 'KO / TKO wins', 'an.of': 'of {n} wins', 'an.avg': 'Average points ± per bout', 'an.rounds': 'Rounds fought',
      'an.mu': 'Matchups', 'an.good': 'Favourable', 'an.bad': 'Tough', 'an.noGood': 'Nobody is predicted to be weaker yet.', 'an.noBad': 'Nobody is predicted to be stronger yet.',
      'an.note': 'Win chance predicted from current ranking points, against fighters of the same sex in this division and the ones next to it. Click a name for the full comparison.',
    },
  };
  Object.keys(T2).forEach(function (l) { Object.keys(T2[l]).forEach(function (k) { T[l][k] = T2[l][k]; }); });
  // bổ sung: lọc vai trò, đếm ngược, trận tâm điểm
  var T3 = {
    vi: { 'f.role': 'Vai trò', 'role.all': 'Tất cả', 'feat.title': 'Trận tâm điểm', 'cd.in': 'Thời gian còn lại tới giờ thi đấu', 'cd.d': 'ngày', 'cd.h': 'giờ', 'cd.m': 'phút', 'ev.in': 'còn {n} ngày', 'ev.today': 'hôm nay' },
    en: { 'f.role': 'Role', 'role.all': 'All', 'feat.title': 'Featured bout', 'cd.in': 'Time left until the first bell', 'cd.d': 'days', 'cd.h': 'hrs', 'cd.m': 'min', 'ev.in': 'in {n} days', 'ev.today': 'today' },
  };
  Object.keys(T3).forEach(function (l) { Object.keys(T3[l]).forEach(function (k) { T[l][k] = T3[l][k]; }); });
  // kèo dự đoán (rank-predict.js), nhận xét HLV, kinh nghiệm + phong cách trên hồ sơ
  var T4 = {
    vi: {
      'prob': 'Khả năng thắng (dự đoán)', 'prob.short': 'dự đoán',
      'pr.title': 'Kèo dự đoán', 'pr.go': 'Xem kèo', 'pr.draw': 'Hòa', 'pr.odds': 'Kèo', 'pr.oddsLine': 'Kèo {a} – {b}',
      'pr.out.aKO': '{a} thắng KO / TKO', 'pr.out.aDec': '{a} thắng điểm', 'pr.out.draw': 'Hòa', 'pr.out.bDec': '{b} thắng điểm', 'pr.out.bKO': '{b} thắng KO / TKO',
      'pr.likely': 'Dễ xảy ra nhất', 'pr.distance': 'Đấm hết {n} hiệp', 'pr.early': 'Nếu dừng trận sớm, khoảng',
      'pr.factors': 'Yếu tố quyết định', 'pr.conf': 'Độ tin cậy', 'pr.conf.low': 'thấp (ít trận để so)', 'pr.conf.medium': 'vừa', 'pr.conf.high': 'cao',
      'pr.note': 'Tính từ điểm xếp hạng, kỹ năng HLV chấm, thể hình, kinh nghiệm và phong độ. Chỉ để tham khảo cho vui khi xếp lịch, không dùng để cá cược.',
      'fx.matchup': 'Tấn công xuyên phòng thủ', 'fx.stamina': 'Thể lực trong trận {n} hiệp', 'fx.reach': 'Sải tay', 'fx.weight': 'Cân nặng', 'fx.stance': 'Thế đứng',
      'fx.experience': 'Kinh nghiệm thi đấu', 'fx.form': 'Phong độ gần đây', 'fx.age': 'Tuổi', 'fx.boutsN': '{a} vs {b} trận', 'fx.lvl': 'Mức {n}/3',
      'ult.custom.d': 'Chiêu kết thúc sở trường do HLV ghi nhận.',
      'ev2.title': 'Nhận xét của HLV', 'ev2.strong': 'Điểm mạnh', 'ev2.weak': 'Cần cải thiện', 'ev2.by': '{c}, lần chấm gần nhất {d}', 'ev2.coach': 'HLV',
      'pf.started': 'Bắt đầu tập boxing', 'pf.otherArts': 'Môn võ khác', 'pf.prior': 'Thành tích trước khi vào Academy', 'pf.style': 'Lối đánh', 'pf.idol': 'Thần tượng', 'pf.goal': 'Mục tiêu',
      'an.note': 'Khả năng thắng dự đoán từ điểm, kỹ năng, thể hình và phong độ, so với võ sĩ cùng giới tính ở hạng cân này và hạng cân kề bên. Bấm vào tên để xem kèo chi tiết.',
    },
    en: {
      'prob': 'Win chance (prediction)', 'prob.short': 'prediction',
      'pr.title': 'Fight odds', 'pr.go': 'See the odds', 'pr.draw': 'Draw', 'pr.odds': 'Odds', 'pr.oddsLine': 'Odds {a} – {b}',
      'pr.out.aKO': '{a} by KO / TKO', 'pr.out.aDec': '{a} on points', 'pr.out.draw': 'Draw', 'pr.out.bDec': '{b} on points', 'pr.out.bKO': '{b} by KO / TKO',
      'pr.likely': 'Most likely', 'pr.distance': 'Goes all {n} rounds', 'pr.early': 'If stopped early, around',
      'pr.factors': 'Deciding factors', 'pr.conf': 'Confidence', 'pr.conf.low': 'low (few bouts to compare)', 'pr.conf.medium': 'medium', 'pr.conf.high': 'high',
      'pr.note': 'Built from ranking points, coach skill scores, physicals, experience and form. Just for fun when planning bouts, not for betting.',
      'fx.matchup': 'Offence against defence', 'fx.stamina': 'Stamina over {n} rounds', 'fx.reach': 'Reach', 'fx.weight': 'Weight', 'fx.stance': 'Stance',
      'fx.experience': 'Ring experience', 'fx.form': 'Recent form', 'fx.age': 'Age', 'fx.boutsN': '{a} vs {b} bouts', 'fx.lvl': 'Level {n} of 3',
      'ult.custom.d': 'Signature finisher noted by the coaches.',
      'ev2.title': 'Coach’s assessment', 'ev2.strong': 'Strengths', 'ev2.weak': 'To improve', 'ev2.by': '{c}, last assessed {d}', 'ev2.coach': 'Coach',
      'pf.started': 'Started boxing', 'pf.otherArts': 'Other martial arts', 'pf.prior': 'Record before the academy', 'pf.style': 'Fighting style', 'pf.idol': 'Idol', 'pf.goal': 'Goal',
      'an.note': 'Win chance predicted from points, skills, physicals and form, against fighters of the same sex in this division and the ones next to it. Click a name for the full odds.',
    },
  };
  Object.keys(T4).forEach(function (l) { Object.keys(T4[l]).forEach(function (k) { T[l][k] = T4[l][k]; }); });
  var en = function () { return DC.lang() === 'en'; };
  // chữ sửa ở /admin → Nội dung website → Academy Ranking: khóa "ranking.<khóa>" (danh mục dựng bằng tools/cms-js-pages.js, đọc ?cmsdump)
  if (/[?&]cmsdump\b/.test(location.search)) window.__cmsDump = Object.keys(T.vi).map(function (k) { return ['ranking.' + k, T.vi[k], T.en[k]]; });
  function t(k, vars) {
    var s = (T[en() ? 'en' : 'vi'][k] != null ? T[en() ? 'en' : 'vi'][k] : T.vi[k]);
    s = s == null ? k : DC.x('ranking.' + k, en() ? 1 : 0, s) || '';
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
  var monthOf = function (ym) { var d = new Date(ym + '-01T00:00:00Z'); return en() ? d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : ym.slice(5) + '/' + ym.slice(0, 4); };
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

  // biểu tượng nét mảnh 24×24: thế đứng, 6 kỹ năng (cũng là 6 vai trò), tuyệt chiêu
  var ICON = {
    stance: '<path d="M12 3l7 9-7 9-7-9z"/><circle cx="12" cy="12" r="2.2"/>',
    technique: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3"/><path d="M12 1.5v4.5M12 18v4.5M1.5 12H6M18 12h4.5"/>',
    speed: '<path d="M13.5 2L5 13.5h6.2L10 22l9-12.2h-6.4z"/>',
    power: '<path d="M12 2.5l2.1 5.4 5.6-1.6-3.1 5 4.9 2.9-5.7.9.8 5.8L12 17.3 7.4 20.9l.8-5.8-5.7-.9 4.9-2.9-3.1-5 5.6 1.6z"/>',
    defense: '<path d="M12 2.5l8 3v6c0 4.9-3.3 8.9-8 10.5-4.7-1.6-8-5.6-8-10.5v-6z"/>',
    stamina: '<path d="M2 12h4.5l2.5-6 4 12 3-8 1.5 2H22"/>',
    footwork: '<path d="M4 6l6 6-6 6M12 6l6 6-6 6"/>',
    ult: '<path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/><circle cx="12" cy="12" r="1.6"/>',
  };
  var icon = function (k) { return '<svg class="xh-ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">' + (ICON[k] || ICON.ult) + '</svg>'; };
  // huy hiệu hạng: lục giác màu theo hạng (Tinh anh có thêm cánh); số giữa = thứ hạng trong hạng cân, bản nhỏ (mini) chỉ có viên đá
  var EMB = { elite: ['#f3d77a', '#9c7a14'], a: ['#ff7b70', '#94201a'], b: ['#86aef0', '#1d4386'], c: ['#dfe4e9', '#6f7a84'], rookie: ['#ddb184', '#6e4622'] }, embN = 0;
  function emblem(f, mini) {
    var tr = EMB[f.tier] ? f.tier : 'rookie', c = EMB[tr], id = 'xhEmb' + (++embN), rk = String(ranked(f) ? f.rank.div : '–');
    return '<svg class="xh-emb' + (mini ? ' mini' : '') + '" viewBox="0 0 80 88" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>' +
      (tr === 'elite' ? '<path d="M13 28L1 19l4 21 8 5zM67 28l12-9-4 21-8 5z" fill="url(#' + id + ')" opacity="0.85"/>' : '') +
      '<path d="M40 3l29 16v41L40 85 11 60V19z" fill="url(#' + id + ')"/><path d="M40 13l20 11.5v32L40 74 20 56.5v-32z" fill="#0b0d12" opacity="0.84"/>' +
      (mini ? '<path d="M40 31l9 13-9 13-9-13z" fill="url(#' + id + ')"/>' : '<text x="40" y="' + (rk.length > 1 ? 54 : 56) + '" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="' + (rk.length > 1 ? 26 : 32) + '" fill="' + c[0] + '">' + esc(rk) + '</text>') + '</svg>';
  }
  var bySkill = function (f) { return SKILL.slice().sort(function (a, b) { return (f.skills[b.id] || 0) - (f.skills[a.id] || 0); }); };
  // vai trò chính = kỹ năng HLV chấm cao nhất
  var roleOf = function (f) { return (bySkill(f)[0] || {}).id || 'technique'; };
  // thành tích T-B-H + thanh tỉ lệ thắng (xanh thắng, đỏ thua, xám hòa)
  function winBar(r) {
    var n = r.w + r.l + r.d, p = n ? Math.round(r.w / n * 100) : 0;
    return rec(r) + (n ? '<span class="xh-wr" title="' + esc(t('an.win')) + ' ' + p + '%"><span class="xh-wr-b"><i class="w" style="flex-grow:' + r.w + '"></i><i class="l" style="flex-grow:' + r.l + '"></i><i class="d" style="flex-grow:' + r.d + '"></i></span><small>' + p + '%</small></span>' : '');
  }
  // đếm ngược tới giờ thi đấu (giờ Việt Nam); [data-cd] tự cập nhật mỗi 30 giây
  var startOf = function (e) { return e.date + 'T' + (e.time || '00:00') + ':00+07:00'; };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  function cdParts(iso) { var m = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 60000)); return [Math.floor(m / 1440), Math.floor(m / 60) % 24, m % 60]; }
  function countdown(e) {
    var p = cdParts(startOf(e));
    return '<div class="xh-cd" data-cd="' + startOf(e) + '" role="timer" aria-label="' + esc(t('cd.in')) + '">' + [['cd.d', p[0]], ['cd.h', pad2(p[1])], ['cd.m', pad2(p[2])]].map(function (x) {
      return '<div><b>' + x[1] + '</b><small>' + esc(t(x[0])) + '</small></div>';
    }).join('') + '</div>';
  }
  setInterval(function () {
    [].forEach.call(document.querySelectorAll('[data-cd]'), function (el) {
      var p = cdParts(el.getAttribute('data-cd'));
      [].forEach.call(el.querySelectorAll('b'), function (b, i) { b.textContent = i ? pad2(p[i]) : p[i]; });
    });
  }, 30000);
  // số ngày tới sự kiện theo lịch Việt Nam (0 = hôm nay)
  var daysTo = function (e) { return Math.round((Date.parse(e.date) - Date.parse(new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10))) / 86400000); };

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
        '<td class="ti"><span class="xh-ti">' + emblem(f, true) + '<span>' + esc(TIER[f.tier] ? pick(TIER[f.tier]) : '') + '</span></span></td><td class="rc">' + winBar(f.record) + '</td><td class="l6">' + last6(f.last6) + '</td>' +
        (showDiv ? '<td class="dv nw xh-hide-md">' + esc(divName(f.division)) + '</td>' : '') + '<td class="pt"><span class="xh-pts">' + pts(f.points) + '</span>' + stars(f.stars) + '</td></tr>';
    }).join('');
  }
  function rankHead(showDiv) {
    return '<thead><tr><th class="rk">#</th><th class="c" title="' + esc(D.since ? t('move.title', { e: pick(D.since.name) }) : '') + '">±</th><th>' + esc(t('col.fighter')) + '</th><th>' + esc(t('col.tier')) + '</th>' +
      '<th>' + esc(t('col.record')) + '</th><th>' + esc(t('col.last6')) + '</th>' + (showDiv ? '<th class="xh-hide-md">' + esc(t('col.div')) + '</th>' : '') + '<th class="r">' + esc(t('col.points')) + '</th></tr></thead>';
  }
  // top 3 của danh sách đang xem, như bục nhận giải: số 1 ở giữa; khung vàng / bạc / đồng theo thứ hạng thật
  function podium(list, divRank) {
    var top = list.filter(ranked).slice(0, 3);
    return top.length ? '<ol class="xh-pod" aria-label="Top ' + top.length + '">' + top.map(function (f, i) {
      var rk = divRank ? f.rank.div : f.rank.overall;
      return '<li class="p' + (i + 1) + (rk < 4 ? ' m' + rk : '') + '"><a href="' + href(f) + '"><span class="xh-pod-img">' + portrait(f) + '<span class="xh-pod-rk">' + rk + '</span></span>' +
        '<span class="xh-pod-t">' + emblem(f, true) + '<span class="xh-pod-n">' + esc(f.name) + '</span><span class="xh-pod-m"><span>' + esc(divName(f.division)) + '</span><span class="xh-pod-p">' + pts(f.points) + '</span></span></span></a></li>';
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

  /* ─── Thông tin võ sĩ: lưới thẻ kiểu chọn tướng, lọc theo vai trò (kỹ năng mạnh nhất) ─ */
  function pageFighters() {
    var q = qs(), g = q.g === 'm' || q.g === 'f' ? q.g : '', div = DIV[q.div] ? q.div : '', st = q.st === 'active' || q.st === 'inactive' ? q.st : '', s = q.q || '';
    var RO = SKILL.map(function (x) { return x.id; }), ro = RO.indexOf(q.role) > -1 ? q.role : '', want = norm(s);
    var list = D.fighters.filter(function (f) {
      return (!g || f.gender === g) && (!div || f.division === div) && (!st || f.status === st) && (!ro || roleOf(f) === ro) &&
        (!want || norm(f.name + ' ' + (f.nickname || '') + ' ' + (f.hometown || '')).indexOf(want) > -1);
    }).sort(function (a, b) { return a.name.split(' ').pop().localeCompare(b.name.split(' ').pop()) || a.name.localeCompare(b.name); });
    var cards = list.map(function (f) {
      var r2 = roleOf(f);
      return '<a class="xh-card' + (f.status !== 'active' ? ' off' : '') + '" href="' + href(f) + '">' + portrait(f, false, true) +
        '<span class="xh-card-emb" title="' + esc(ranked(f) ? t('pf.inDiv', { r: f.rank.div, n: f.rank.divOf, div: divName(f.division) }) : t('pf.unranked')) + '">' + emblem(f) + '</span>' +
        '<span class="xh-card-role" title="' + esc(t('ch.role.' + r2)) + '">' + icon(r2) + '</span><span class="xh-card-b">' + (f.nickname ? '<span class="xh-card-k">' + esc(f.nickname) + '</span>' : '') +
        '<span class="xh-card-n">' + esc(f.name) + '</span><span class="xh-card-d">' + esc(divName(f.division)) + ', ' + esc(t('g' + f.gender)) + (f.status !== 'active' ? ', ' + esc(t('status.inactive').toLowerCase()) : '') + '</span>' +
        '<span class="xh-card-f">' + rec(f.record) + '<span class="xh-pts">' + pts(f.points) + '</span></span></span></a>';
    }).join('');
    var roles = '<div class="xh-rolef" role="group" aria-label="' + esc(t('f.role')) + '">' + [''].concat(RO).map(function (id) {
      return '<button type="button" data-seg="role" data-v="' + id + '" aria-pressed="' + (ro === id) + '"' + (ro === id ? ' class="on"' : '') + '>' + (id ? icon(id) : '') + '<span>' + esc(id ? t('ch.role.' + id) : t('role.all')) + '</span></button>';
    }).join('') + '</div>';
    var tools = '<div class="xh-box xh-toolbar"><div class="xh-tools"><input type="search" data-f="q" value="' + esc(s) + '" placeholder="' + esc(t('f.q')) + '" aria-label="' + esc(t('f.q')) + '">' +
      seg('g', [['', t('g.all')], ['m', t('g.m')], ['f', t('g.f')]], g) + select('div', t('f.div'), divOpts(), div) +
      select('st', t('f.status'), [['', t('f.allStatus')], ['active', t('status.active')], ['inactive', t('status.inactive')]], st) + '<span class="xh-count">' + esc(t('dir.count', { n: list.length })) + '</span></div></div>';
    root.innerHTML = hero({ h1: esc(t('dir.title')), sub: '<p>' + esc(t('dir.sub')) + '</p>', ctl: roles }) +
      page(tools + (cards ? '<div class="xh-cards">' + cards + '</div>' : '<div class="xh-box"><p class="xh-empty">' + esc(t('none')) + '</p></div>'));
    bindFilters(function (k, v) {
      var o = { q: s, g: g, div: div, st: st, role: ro }; o[k] = v; setQs(o);
      if (k === 'q') { var pos = v.length; render(); var i = root.querySelector('[data-f="q"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } } else render();
    });
  }

  /* ─── Hồ sơ võ sĩ ─────────────────────────────────────────────────────── */
  // radar kỹ năng: list = [{ f, color }] (1 võ sĩ ở hồ sơ, 2 võ sĩ ở trang so sánh)
  function radar(list) {
    var n = SKILL.length, cx = 120, cy = 118, R = 84, pt = function (i, r) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    var poly = function (r) { return SKILL.map(function (s, i) { return pt(i, r).map(function (v) { return v.toFixed(1); }).join(','); }).join(' '); };
    var grid = [0.25, 0.5, 0.75, 1].map(function (k) { return '<polygon points="' + poly(R * k) + '" fill="none" stroke="' + '#2b323c' + '"/>'; }).join('');
    var axes = SKILL.map(function (s, i) { var p = pt(i, R); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="' + '#2b323c' + '"/>'; }).join('');
    var shapes = list.map(function (x) {
      var val = SKILL.map(function (s, i) { return pt(i, R * (x.f.skills[s.id] || 0) / 100).map(function (v) { return v.toFixed(1); }).join(','); }).join(' ');
      return '<polygon points="' + val + '" fill="' + x.color + '" fill-opacity="' + 0.3 + '" stroke="' + x.color + '" stroke-width="2" stroke-linejoin="round"/>';
    }).join('');
    var labels = SKILL.map(function (s, i) {
      var p = pt(i, R + 18), anchor = Math.abs(p[0] - cx) < 4 ? 'middle' : p[0] > cx ? 'start' : 'end';
      return '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4).toFixed(1) + '" text-anchor="' + anchor + '" font-size="11" fill="' + '#c3c9d0' + '">' + esc(pick(s)) + '</text>';
    }).join('');
    return '<svg class="xh-radar" viewBox="-30 0 300 240" role="img" aria-label="' + esc(t('sk.title')) + '">' + grid + axes + shapes + labels + '</svg>';
  }
  // dự đoán kèo (rank-predict.js): điểm, kỹ năng, thể hình, kinh nghiệm, phong độ → khả năng thắng / hòa, cách thắng, kèo
  var predict = function (a, b, opt) { return window.DCPredict.predict(a, b, opt); };
  // thanh đỏ / xanh: khả năng thắng giữa 2 bên (bỏ phần hòa); opt = { rounds, type } của trận
  function probBar(a, b, opt) {
    var s = window.DCPredict.share(predict(a, b, opt));
    return '<div class="xh-prob" title="' + esc(t('prob')) + '"><span class="a" style="width:' + s[0] + '%">' + s[0] + '%</span><span class="b" style="width:' + s[1] + '%">' + s[1] + '%</span></div>';
  }
  var oddsLine = function (a, b, opt) { var p = predict(a, b, opt); return '<small class="xh-odds">' + esc(t('pr.oddsLine', { a: numFmt(p.odds.a, 2), b: numFmt(p.odds.b, 2) })) + '</small>'; };
  // diễn biến điểm: điểm kỹ năng → sau từng trận (màu chấm theo kết quả), vạch các mốc hạng
  function chart(f) {
    var pts0 = (f.bouts || []).slice().reverse();
    if (!pts0.length) return '<p class="xh-empty">' + esc(t('chart.none')) + '</p>';
    var series = [{ v: f.skillPoints, label: t('chart.start') }].concat(pts0.map(function (b) { var o = byId[b.opp]; return { v: b.after, res: b.res, label: dateOf(b.date) + ', ' + t('res.' + b.res + '.t') + (o ? ' vs ' + o.name : '') + ' (' + (b.delta > 0 ? '+' : '') + pts(b.delta) + ')' }; }));
    // rộng theo khung đang hiển thị để chữ không quá nhỏ trên điện thoại
    var W = Math.max(420, Math.min(1100, (root.clientWidth || 640) - 90)), H = W < 640 ? 240 : 250, L = 44, Rr = 14, T = 16, Bm = 26;
    var vs = series.map(function (x) { return x.v; }), lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs);
    var pad = Math.max(15, (hi - lo) * 0.25); lo = Math.floor((lo - pad) / 10) * 10; hi = Math.ceil((hi + pad) / 10) * 10;
    var X = function (i) { return L + (series.length === 1 ? (W - L - Rr) / 2 : i * (W - L - Rr) / (series.length - 1)); }, Y = function (v) { return T + (hi - v) * (H - T - Bm) / (hi - lo); };
    var COL = { W: '#3fbf72', L: '#ff5a4f', D: '#9fb0c3', NC: '#9aa1a9' }, C = { grid: '#232932', txt: '#8d96a1', tier: '#c8a85a', tierTxt: '#e2c97f', bg: '#11151c' };
    var g = '';
    [lo, (lo + hi) / 2, hi].forEach(function (v) { g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="' + C.grid + '"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="' + C.txt + '">' + Math.round(v) + '</text>'; });
    (D.tiers || []).forEach(function (x) { if (x.min > lo && x.min < hi) g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(x.min).toFixed(1) + '" y2="' + Y(x.min).toFixed(1) + '" stroke="' + C.tier + '" stroke-dasharray="4 4"/><text x="' + (W - Rr) + '" y="' + (Y(x.min) - 5).toFixed(1) + '" text-anchor="end" font-size="11" fill="' + C.tierTxt + '">' + esc(pick(x)) + ' ' + x.min + '</text>'; });
    var line = series.map(function (x, i) { return X(i).toFixed(1) + ',' + Y(x.v).toFixed(1); }).join(' ');
    var area = X(0).toFixed(1) + ',' + (H - Bm) + ' ' + line + ' ' + X(series.length - 1).toFixed(1) + ',' + (H - Bm);
    var dots = series.map(function (x, i) { return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(x.v).toFixed(1) + '" r="' + (i ? 5.5 : 4.5) + '" fill="' + (x.res ? COL[x.res] : C.bg) + '" stroke="' + (x.res ? C.bg : '#D4372E') + '" stroke-width="2"><title>' + esc(x.label + ': ' + pts(x.v)) + '</title></circle>'; }).join('');
    var xl = '<text x="' + X(0).toFixed(1) + '" y="' + (H - 6) + '" font-size="11" fill="' + C.txt + '">' + esc(t('chart.start')) + '</text><text x="' + X(series.length - 1).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="end" font-size="11" fill="' + C.txt + '">' + esc(dateOf(pts0[pts0.length - 1].date)) + '</text>';
    return '<div class="xh-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('chart.title')) + '">' + g + '<polygon points="' + area + '" fill="#D4372E" fill-opacity="' + 0.14 + '"/>' +
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
  /* hồ sơ võ sĩ kiểu trang phân tích tướng (game MOBA): ảnh lớn, huy hiệu hạng, vai trò, độ khó đối đầu,
     bộ kỹ năng P Q W E R (nội tại = thế đứng, Q W E = 3 kỹ năng HLV chấm cao nhất, R = cách thắng sở trường),
     phân tích dễ thắng / khó thắng (theo điểm), lịch sử đấu tô màu thắng / thua */
  // chiêu HLV tự đặt ở /admin (tên + mô tả, 2 thứ tiếng); để trống = tên tự tạo
  var moveOf = function (f, slot) { var m = f.moves && f.moves[slot]; return { name: m ? pick(m.name) : '', desc: m ? pick(m.desc) : '' }; };
  // tuyệt chiêu = cách thắng nhiều nhất (bằng nhau thì ưu tiên thắng KO / TKO), hoặc chiêu kết thúc HLV ghi nhận
  function ultimate(f) {
    var n = {};
    (f.bouts || []).forEach(function (b) { if (b.res === 'W' && b.method) n[b.method] = (n[b.method] || 0) + 1; });
    var m = Object.keys(n).sort(function (a, b) { return n[b] - n[a] || (STOP.indexOf(b) > -1) - (STOP.indexOf(a) > -1); })[0];
    var auto = m ? { name: t('ult.' + m), lvl: Math.min(3, n[m]), max: 3, desc: t('ult.d', { m: t('m.' + m), n: n[m], ko: f.record.ko, pct: f.record.koPct || 0 }) }
      : { name: t('ult.none'), lvl: 0, max: 3, desc: t('ult.none.d'), off: true };
    var c = moveOf(f, 'ult');
    if (!c.name && !c.desc) return auto;
    return { name: c.name || auto.name, sub: m ? t('ult.' + m) : '', lvl: Math.max(1, auto.lvl), max: 3, desc: (c.desc || t('ult.custom.d')) + (m ? ' ' + auto.desc : '') };
  }
  function abilities(f) {
    var reach = f.reach && f.height ? ' ' + t('ps.reach', { r: f.reach, h: f.height }) + (f.reach > f.height ? ' ' + t('ps.reachAdv', { n: f.reach - f.height }) : '') : '';
    var cp = moveOf(f, 'stance');
    return [{ key: 'P', ic: 'stance', label: t('ch.passive'), name: cp.name || t('ps.' + f.stance), sub: cp.name ? t('ps.' + f.stance) : '', desc: (cp.desc || t('ps.' + f.stance + '.d')) + reach }]
      .concat(bySkill(f).slice(0, 3).map(function (s, i) {
        var v = f.skills[s.id] || 0, cm = moveOf(f, s.id);
        return { key: 'QWE'.charAt(i), ic: s.id, label: pick(s), name: cm.name || t('mv.' + s.id), sub: t('mv.score', { v: v }), lvl: Math.max(1, Math.ceil(v / 20)), max: 5, desc: cm.desc || t('mv.' + s.id + '.d') };
      }))
      .concat([Object.assign({ key: 'R', ic: 'ult', label: t('ch.ult') }, ultimate(f))]);
  }
  function abilityDetail(a) {
    var pips = '';
    for (var i = 0; i < (a.max || 0); i++) pips += '<i' + (i < a.lvl ? ' class="on"' : '') + '></i>';
    return '<span class="xh-ab-bg">' + icon(a.ic) + '</span><p class="xh-ab-t"><span class="xh-ab-k">' + a.key + '</span>' + esc(a.label) + '</p><h3>' + esc(a.name) + '</h3>' + (a.sub ? '<p class="xh-ab-sub">' + esc(a.sub) + '</p>' : '') +
      (a.max ? '<div class="xh-pips" role="img" aria-label="' + esc(t('mv.lvl', { n: a.lvl, m: a.max })) + '">' + pips + '</div>' : '') + '<p class="xh-ab-p">' + esc(a.desc) + '</p>';
  }
  function pageFighter(slug) {
    var f = bySlug[slug];
    if (!f) { notFound('nf.fighter', '/xep-hang', 'back.ranking'); return; }
    document.title = f.name + (f.nickname ? ' “' + f.nickname + '”' : '') + ' · Dapper Combat Academy Ranking';
    var r = f.record, sk = bySkill(f), decided = r.w + r.l + r.d, winPct = decided ? Math.round(r.w / decided * 100) : 0;
    var panel = function (title, body, sub) { return '<div class="xh-ch-p">' + (title ? '<h3>' + title + (sub ? ' <small>' + sub + '</small>' : '') + '</h3>' : '') + body + '</div>'; };
    var sec = function (id, title, body, sub) { return '<section class="xh-ch-sec xh-in" id="' + id + '"><div class="xh-ch-h"><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' + body + '</section>'; };
    // đầu trang
    var lvl = f.stars >= 4 ? 3 : f.stars === 3 ? 2 : 1;
    var stat = function (k, v) { return '<div><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>'; };
    var top = '<header class="xh-ch-hero">' + (f.photo ? '<div class="xh-ch-bg" style="background-image:url(&quot;' + esc(f.photo) + '&quot;)"></div>' : '') + '<div class="xh-in xh-ch-in">' + crumb('/vo-si', t('nav.fighters'), f.name) +
      '<div class="xh-ch-grid"><div class="xh-ch-info"><div class="xh-ch-tier">' + emblem(f) + '<div><b>' + esc(pick(TIER[f.tier]) || '') + '</b>' +
      (ranked(f) ? '<span>' + esc(t('pf.inDiv', { r: f.rank.div, n: f.rank.divOf, div: divName(f.division) })) + '</span><small>' + esc(t('pf.inClub', { r: f.rank.overall, n: f.rank.overallOf, g: t('g' + f.gender) })) + '</small>' : '<span>' + esc(t('pf.unranked')) + '</span>') + '</div></div>' +
      (f.nickname ? '<p class="xh-ch-nick">' + esc(f.nickname) + '</p>' : '') + '<h1>' + esc(f.name) + '</h1>' +
      '<div class="xh-ch-roles">' + sk.slice(0, 2).map(function (s) { return '<span class="xh-role">' + icon(s.id) + esc(t('ch.role.' + s.id)) + '</span>'; }).join('') +
      '<span class="xh-diff"><span>' + esc(t('ch.diff')) + '</span><span class="xh-diff-bars" aria-hidden="true"><i class="on"></i><i' + (lvl > 1 ? ' class="on"' : '') + '></i><i' + (lvl > 2 ? ' class="on"' : '') + '></i></span><b>' + esc(t('ch.diff.' + lvl)) + '</b></span></div>' +
      '<div class="xh-record"><div class="w"><b>' + r.w + '</b><span>' + esc(t('pf.win')) + '</span><small>' + esc(t('pf.kos', { n: r.ko })) + '</small></div>' +
      '<div class="l"><b>' + r.l + '</b><span>' + esc(t('pf.loss')) + '</span><small>' + esc(t('pf.kos', { n: r.koLost })) + '</small></div>' +
      '<div class="d"><b>' + r.d + '</b><span>' + esc(t('pf.draw')) + '</span><small>&nbsp;</small></div></div>' +
      '<dl class="xh-ch-stats">' + stat(t('pf.points'), pts(f.points)) + stat(t('an.win'), decided ? winPct + '%' : '—') + stat(t('col.stars'), stars(f.stars)) +
      stat(t('pf.streak'), f.streak ? esc(t('pf.streakOf', { n: f.streak.n, r: t('res.' + f.streak.res + '.t').toLowerCase() })) : '—') + '</dl></div>' +
      '<figure class="xh-ch-art">' + portrait(f, true) + '</figure></div></div>' +
      '<nav class="xh-ch-tabs" aria-label="' + esc(f.name) + '"><a href="#bo-ky-nang">' + esc(t('ch.skills')) + '</a><a href="#phan-tich">' + esc(t('an.title')) + '</a><a href="#lich-su">' + esc(t('bh.title')) + '</a><a href="#ho-so">' + esc(t('pf.facts')) + '</a></nav></header>';

    // bộ kỹ năng + chỉ số
    var AB = abilities(f);
    var abil = panel('', '<div class="xh-ab" role="group" aria-label="' + esc(t('ch.skills')) + '">' + AB.map(function (a, i) {
      return '<button type="button" class="xh-ab-b' + (a.key === 'R' ? ' ult' : '') + (a.off ? ' off' : '') + '" data-ab="' + i + '" aria-pressed="false" aria-controls="xhAbD" title="' + esc(a.label + ': ' + a.name) + '">' +
        '<span class="xh-ab-i">' + icon(a.ic) + '</span><span class="xh-ab-k">' + a.key + '</span></button>';
    }).join('') + '</div><div class="xh-ab-d" id="xhAbD" aria-live="polite"></div><h4 class="xh-ch-sub">' + esc(t('ch.stats')) + '</h4><div class="xh-ch-stat">' + SKILL.map(function (s) {
      var v = f.skills[s.id] || 0;
      return '<div class="xh-st">' + icon(s.id) + '<span>' + esc(pick(s)) + '</span><i><b style="width:' + v + '%"></b></i><em>' + v + '</em></div>';
    }).join('') + '</div>');
    var hist = (f.assessments || []), prev = null;
    var histRows = hist.map(function (a) { var ch = prev == null ? null : Math.round((a.avg - prev) * 10) / 10; prev = a.avg; return { a: a, ch: ch }; }).reverse().map(function (x) {
      return '<tr><td>' + esc(dateOf(x.a.date)) + '</td><td class="r num">' + numFmt(x.a.avg, 1) + '</td><td class="r">' + (x.ch == null ? '<span class="xh-muted">—</span>' : delta(x.ch)) + '</td></tr>';
    }).join('');
    var stats = panel(esc(t('sk.title')), radar([{ f: f, color: '#D4372E' }]) + '<div class="xh-sum"><div><small>' + esc(t('sk.skill')) + '</small><b>' + numFmt(f.skillPoints) + '</b><small>' + esc(t('sk.avg', { n: numFmt(f.skillAvg, 1) })) + '</small></div>' +
      '<div><small>' + esc(t('sk.fight')) + '</small><b>' + delta(f.fightPoints) + '</b></div><div><small>' + esc(t('sk.total')) + '</small><b>' + pts(f.points) + '</b></div></div>' +
      (hist.length ? '<p class="xh-sum-n">' + esc(t('sk.last', { d: dateOf(hist[hist.length - 1].date) })) + '</p>' : '') +
      (histRows ? '<div class="xh-tw"><table class="xh-table"><thead><tr><th>' + esc(t('sk.hist')) + '</th><th class="r">' + esc(t('sk.avgCol')) + '</th><th class="r">' + esc(t('sk.change')) + '</th></tr></thead><tbody>' + histRows + '</tbody></table></div>' : ''));

    // phân tích: số liệu, dễ thắng / khó thắng trong hạng cân này và hạng kề bên, trận sắp tới, so sánh
    var dvIds = (D.divisions || []).map(function (d) { return d.id; }), di = dvIds.indexOf(f.division);
    var deltas = (f.bouts || []).filter(function (b) { return typeof b.delta === 'number'; });
    var avgD = deltas.length ? deltas.reduce(function (s, b) { return s + b.delta; }, 0) / deltas.length : 0;
    var tile = function (k, v) { return '<div class="xh-tile"><small>' + esc(t(k)) + '</small><b>' + v + '</b></div>'; };
    var tiles = '<div class="xh-tiles">' + tile('an.win', decided ? winPct + '%' : '—') + tile('an.ko', r.ko + (r.w ? ' <small>' + esc(t('an.of', { n: r.w })) + '</small>' : '')) +
      tile('an.avg', deltas.length ? delta(Math.round(avgD * 10) / 10) : '—') + tile('an.rounds', numFmt(r.rounds)) + '</div>';
    var pool = D.fighters.filter(function (x) { return x.id !== f.id && x.gender === f.gender && ranked(x) && Math.abs(dvIds.indexOf(x.division) - di) <= 1; })
      .map(function (x) { return { x: x, p: window.DCPredict.share(predict(f, x))[0] }; });
    var mu = function (o) {
      return '<a class="xh-mu" href="' + cmpHref(f, o.x) + '">' + photo(o.x, 'md') + '<span><span class="xh-mu-n">' + esc(o.x.name) + '</span><small>' + esc(divName(o.x.division)) + ', ' + pts(o.x.points) + ' ' + esc(t('col.points').toLowerCase()) + '</small>' +
        '<span class="xh-mu-bar"><i style="width:' + o.p + '%"></i></span></span><b>' + o.p + '%</b></a>';
    };
    var good = pool.filter(function (o) { return o.p >= 50; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 3);
    var bad = pool.filter(function (o) { return o.p < 50; }).sort(function (a, b) { return a.p - b.p; }).slice(0, 3);
    var mus = panel(esc(t('an.mu')), '<div class="xh-mus"><div class="good"><h4>' + esc(t('an.good')) + '</h4>' + (good.length ? good.map(mu).join('') : '<p class="xh-ch-note">' + esc(t('an.noGood')) + '</p>') + '</div>' +
      '<div class="bad"><h4>' + esc(t('an.bad')) + '</h4>' + (bad.length ? bad.map(mu).join('') : '<p class="xh-ch-note">' + esc(t('an.noBad')) + '</p>') + '</div></div><p class="xh-ch-note">' + esc(t('an.note')) + '</p>');
    var up = (f.upcoming || []).map(function (u) {
      var o = byId[u.opp], e = evById[u.event];
      return o && e ? '<div class="xh-ch-up"><small>' + esc(dateOf(u.date)) + ', <a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a>' + (u.main ? ', ' + esc(t('ev.main').toLowerCase()) : '') + '</small>' + nameCell(o, rec(o.record)) + probBar(f, o, { rounds: u.rounds, type: e.type }) + oddsLine(f, o, { rounds: u.rounds, type: e.type }) +
        '<a class="xh-cmp-link" href="' + cmpHref(f, o) + '">' + esc(t('cmp.go')) + '</a></div>' : '';
    }).join('');
    // nhận xét của HLV (B3): mỗi dòng một ý
    var lines = function (p) { var l = pick(p).split('\n').map(function (s) { return s.trim(); }).filter(Boolean); return l.length ? '<ul>' + l.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : ''; };
    var lastA = (f.assessments || [])[(f.assessments || []).length - 1];
    var evalP = pick(f.evalStrong) || pick(f.evalWeak) || pick(f.evalNote) ? panel(esc(t('ev2.title')),
      '<div class="xh-eval">' + (pick(f.evalStrong) ? '<div class="good"><h4>' + esc(t('ev2.strong')) + '</h4>' + lines(f.evalStrong) + '</div>' : '') +
      (pick(f.evalWeak) ? '<div class="bad"><h4>' + esc(t('ev2.weak')) + '</h4>' + lines(f.evalWeak) + '</div>' : '') + '</div>' +
      (pick(f.evalNote) ? '<p class="xh-eval-note">' + esc(pick(f.evalNote)).replace(/\n/g, '<br>') + '</p>' : '') +
      '<p class="xh-ch-note">' + esc(t('ev2.by', { c: f.coach || t('ev2.coach'), d: lastA ? dateOf(lastA.date) : '—' })) + '</p>') : '';
    var cmp = D.fighters.length > 1 ? panel(esc(t('cmp.title')), '<form class="xh-cmp-form" action="/so-sanh"><input type="hidden" name="a" value="' + esc(f.slug) + '"><label class="xh-sr" for="xhCmpB">' + esc(t('cmp.with')) + '</label>' +
      '<select id="xhCmpB" name="b">' + fighterOpts((D.fighters.filter(function (x) { return x.id !== f.id && x.gender === f.gender && x.division === f.division; }).sort(byPoints)[0] || {}).slug, f.id) + '</select><button type="submit">' + esc(t('cmp.go')) + '</button></form>') : '';

    // lịch sử thi đấu
    var mh = (f.bouts || []).map(function (b) {
      var o = byId[b.opp], e = evById[b.event];
      if (!o) return '';
      return '<li class="xh-mh ' + esc(b.res) + '"><div class="xh-mh-r">' + res(b.res) + '<b>' + esc(t('res.' + b.res + '.t')) + '</b><small>' + methodTitle(b.method) + (b.round ? ' ' + esc(t('ev.round', { n: b.round })) + (b.time ? ' ' + esc(b.time) : '') : ' ' + esc(t('ev.rounds', { n: b.rounds }))) + '</small></div>' +
        '<div class="xh-mh-o">' + photo(o, 'md') + '<div><a href="' + href(o) + '">' + esc(o.name) + '</a><small>' + rec(o.record) + '</small></div></div>' +
        '<div class="xh-mh-e">' + (e ? '<a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a>' : '') + '<small>' + esc(dateOf(b.date)) + '</small></div>' +
        '<div class="xh-mh-p">' + delta(b.delta) + (b.after != null ? '<small>' + pts(b.after) + '</small>' : '') + '</div></li>';
    }).join('');

    // hồ sơ: bảng 2 cột, giới thiệu, cùng hạng cân
    var kv = [
      [t('pf.points'), '<span class="xh-pts">' + pts(f.points) + '</span> ' + stars(f.stars)], [t('pf.rank'), ranked(f) ? esc(t('pf.inDiv', { r: f.rank.div, n: f.rank.divOf, div: divName(f.division) })) + '<br><small>' + esc(t('pf.inClub', { r: f.rank.overall, n: f.rank.overallOf, g: t('g' + f.gender) })) + '</small>' : '<small>' + esc(t('pf.unranked')) + '</small>'],
      [t('pf.tier'), tier(f.tier)], [t('pf.div'), esc(divName(f.division))],
      [t('pf.status'), '<span class="xh-tag' + (f.status === 'active' ? ' on' : '') + '">' + esc(t('status.' + f.status)) + '</span>'],
      [t('pf.bouts'), r.bouts + ' · ' + r.rounds], [t('pf.ko'), r.w ? r.koPct + '%' : '—'],
      [t('pf.streak'), f.streak ? esc(t('pf.streakOf', { n: f.streak.n, r: t('res.' + f.streak.res + '.t').toLowerCase() })) : '—'],
      [t('pf.stance'), esc(stance(f.stance))], [t('pf.age'), f.age != null ? f.age : '—'], [t('pf.height'), f.height ? esc(t('cm', { n: f.height })) : '—'],
      [t('pf.reach'), f.reach ? esc(t('cm', { n: f.reach })) : '—'], [t('pf.weight'), f.weight ? esc(t('kg', { n: numFmt(f.weight, 1) })) : '—'], [t('pf.home'), esc(f.hometown || '—')],
      [t('pf.joined'), f.joined ? esc(dateOf(f.joined)) : '—'], [t('pf.coach'), esc(f.coach || '—')], [t('pf.debut'), f.debut ? esc(dateOf(f.debut)) : '—'],
    ].concat([ // kinh nghiệm, phong cách: chỉ hiện mục đã điền
      [t('pf.started'), f.started ? esc(monthOf(f.started)) : ''], [t('pf.otherArts'), esc(f.otherArts || '')], [t('pf.prior'), esc(f.priorRecord || '')],
      [t('pf.style'), esc(pick(f.style))], [t('pf.idol'), esc(f.idol || '')], [t('pf.goal'), esc(pick(f.goal))],
    ].filter(function (x) { return x[1]; }));
    var kvT = function (rows) { return '<table class="xh-kv">' + rows.map(function (x) { return '<tr><th>' + esc(x[0]) + '</th><td>' + x[1] + '</td></tr>'; }).join('') + '</table>'; }, half = Math.ceil(kv.length / 2);
    var same = D.fighters.filter(function (x) { return x.gender === f.gender && x.division === f.division && ranked(x); }).sort(byPoints);
    var sameP = same.length ? panel(esc(t('side.sameDiv')), '<ul class="xh-list">' + same.map(function (x) {
      return '<li' + (x.id === f.id ? ' class="me"' : '') + '><span class="rk">' + x.rank.div + '</span>' + photo(x, 'sm') + '<div class="grow">' + (x.id === f.id ? '<b>' + esc(x.name) + '</b>' : '<a href="' + href(x) + '">' + esc(x.name) + '</a>') + '<small>' + rec(x.record) + '</small></div><span class="xh-pts">' + pts(x.points) + '</span></li>';
    }).join('') + '</ul>', esc(divName(f.division))) : '';

    root.innerHTML = top +
      sec('bo-ky-nang', t('ch.skills'), '<div class="xh-ch-2">' + abil + stats + '</div>', t('ch.skillsSub')) +
      sec('phan-tich', t('an.title'), tiles + '<div class="xh-ch-2"><div class="xh-ch-col">' + evalP + mus + '</div><div class="xh-ch-col">' + (up ? panel(esc(t('up.title')), up) : '') + cmp + '</div></div>') +
      sec('lich-su', t('bh.title'), '<div class="xh-ch-col">' + panel(esc(t('chart.title')), chart(f)) + (mh ? '<ol class="xh-mhl">' + mh + '</ol>' : panel('', '<p class="xh-empty">' + esc(t('bh.none')) + '</p>')) + '</div>') +
      sec('ho-so', t('pf.facts'), '<div class="xh-ch-2"><div class="xh-ch-col">' + panel('', '<div class="xh-kv2">' + kvT(kv.slice(0, half)) + kvT(kv.slice(half)) + '</div>') +
        (pick(f.bio) ? panel(esc(t('bio.title')), '<p>' + esc(pick(f.bio)).replace(/\n/g, '<br>') + '</p>') : '') + '</div>' + sameP + '</div>');
    // bấm biểu tượng kỹ năng → khung mô tả đổi theo (mặc định Q)
    var btns = root.querySelectorAll('[data-ab]'), box2 = document.getElementById('xhAbD');
    var show = function (i) {
      [].forEach.call(btns, function (b, j) { b.classList.toggle('on', i === j); b.setAttribute('aria-pressed', String(i === j)); });
      box2.innerHTML = abilityDetail(AB[i]);
    };
    [].forEach.call(btns, function (b, i) { b.addEventListener('click', function () { show(i); }); });
    show(1);
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
    else mid = '<span class="xh-vs" aria-hidden="true">VS</span><small>' + esc(t('ev.rounds', { n: b.rounds })) + ', ' + esc(t('prob.short')) + '</small>' + probBar(a, c, { rounds: b.rounds, type: e.type }) +
      oddsLine(a, c, { rounds: b.rounds, type: e.type }) + '<a class="xh-cmp-link" href="' + cmpHref(a, c) + (e.type === 'fight' ? '&t=fight' : '') + '&r=' + b.rounds + '">' + esc(t('pr.go')) + '</a>';
    return '<div class="xh-bout' + (b.main ? ' main' : '') + '"><p class="xh-bout-k">' + (b.main ? '<span class="xh-mainev">' + esc(t('ev.main')) + '</span>' : '') + esc(divName(b.division)) + '</p>' +
      corner(a, 'a', b.deltaA) + '<div class="xh-bc">' + mid + '</div>' + corner(c, 'b', b.deltaB) + '</div>';
  }
  function bouts(e, opts) {
    return e.bouts.length ? '<div class="xh-bouts">' + e.bouts.map(function (b) { return bout(e, b, opts); }).join('') + '</div>' : '<p class="xh-empty">' + esc(t('ev.noBouts')) + '</p>';
  }
  function evMeta(e, longDate) {
    var where = [e.venue, e.city].filter(Boolean).join(', '), left = e.status === 'upcoming' ? daysTo(e) : -1;
    return '<p class="xh-ev-meta"><span>' + esc(longDate ? dateOf(e.date, true) : new Date(e.date + 'T00:00:00Z').toLocaleDateString(en() ? 'en-GB' : 'vi-VN', { weekday: 'long', timeZone: 'UTC' })) + (e.time ? ', ' + esc(e.time) : '') + '</span>' +
      (where ? '<span>' + esc(where) + '</span>' : '') + (e.bouts.length ? '<span>' + esc(t('ev.bouts', { n: e.bouts.length })) + '</span>' : '') +
      (left >= 0 ? '<span class="xh-soon">' + esc(left ? t('ev.in', { n: left }) : t('ev.today')) + '</span>' : '') + '</p>';
  }
  var evTags = function (e) { return '<div class="xh-ev-tags">' + typeTag(e) + (e.status === 'pending' ? '<span class="xh-tag">' + esc(t('ev.pending')) + '</span>' : '') + '</div>'; };
  function eventBlock(e) {
    return '<article class="xh-ev"><header class="xh-ev-h">' + dateBlock(e.date) + '<div>' + evTags(e) + '<h2><a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a></h2>' + evMeta(e) + '</div>' +
      '<a class="xh-btn" href="' + evHref(e) + '">' + esc(t('ev.detail')) + '<span class="xh-vh"> — ' + esc(pick(e.name)) + '</span></a></header>' + bouts(e) + '</article>';
  }
  // trận tâm điểm: trận chính của sự kiện sắp tới gần nhất, đồng hồ đếm ngược + dự đoán theo điểm
  function featured() {
    var e = upcoming()[0], b = e && mainBout(e), a = b && byId[b.a], c = b && byId[b.b];
    if (!a || !c) return '';
    var side = function (f, cls) { return '<a class="xh-feat-f ' + cls + '" href="' + href(f) + '">' + portrait(f) + '<span>' + esc(f.name) + '</span>' + rec(f.record) + '</a>'; };
    return '<div class="xh-feat"><p class="xh-feat-k">' + esc(t('feat.title')) + '</p><div class="xh-feat-vs">' + side(a, 'a') + '<span class="xh-feat-x" aria-hidden="true">VS</span>' + side(c, 'b') + '</div>' +
      '<p class="xh-feat-e"><a href="' + evHref(e) + '">' + esc(pick(e.name)) + '</a><small>' + esc(dateOf(e.date, true)) + (e.time ? ', ' + esc(e.time) : '') + '</small></p>' + countdown(e) + probBar(a, c, { rounds: b.rounds, type: e.type }) + oddsLine(a, c, { rounds: b.rounds, type: e.type }) + '</div>';
  }
  function pageEvents() {
    var tab = qs().tab === 'res' ? 'res' : 'up', up = upcoming(), done = finished();
    var list = tab === 'up' ? up : done;
    root.innerHTML = hero({ h1: esc(t('ev.title')), sub: '<p>' + esc(t('ev.sub')) + '</p>', ctl: seg('tab', [['up', t('ev.upcoming') + ' (' + up.length + ')'], ['res', t('ev.results') + ' (' + done.length + ')']], tab), side: featured() }) +
      page('<div class="xh-grid"><div class="xh-col">' + (list.length ? list.map(eventBlock).join('') : '<section class="xh-box"><p class="xh-empty">' + esc(tab === 'up' ? t('ev.noUp') : t('ev.noRes')) + '</p></section>') + '</div>' +
      '<aside class="xh-col xh-side">' + sideTop('m') + sideTop('f') + '</aside></div>');
    bindFilters(function (k, v) { setQs({ tab: v === 'res' ? 'res' : '' }); render(); });
  }
  function pageEvent(slug) {
    var e = evBySlug[slug];
    if (!e) { notFound('nf.event', '/su-kien', 'back.events'); return; }
    document.title = pick(e.name) + ' · Dapper Combat Academy Ranking';
    var about = e.poster || pick(e.desc) ? box(esc(t('ev.about')), '<div class="xh-box-b">' + (e.poster ? '<img class="xh-poster" src="' + esc(e.poster) + '" alt="">' : '') + (pick(e.desc) ? '<p>' + esc(pick(e.desc)).replace(/\n/g, '<br>') + '</p>' : '') + '</div>') : '';
    root.innerHTML = hero({ crumb: crumb('/su-kien', t('nav.events'), pick(e.name)), pre: evTags(e), h1: esc(pick(e.name)), sub: evMeta(e, true),
      side: '<div class="xh-ev-side">' + dateBlock(e.date, 'lg') + (e.status === 'upcoming' ? countdown(e) : '') + '</div>' }) +
      page('<div class="xh-grid"><div class="xh-col">' + box(esc(t('ev.bouts', { n: e.bouts.length })), bouts(e, { pts: e.status === 'done' })) + about + '</div>' +
      '<aside class="xh-col xh-side">' + sideUpcoming() + sideLatest() + '</aside></div>');
  }

  /* ─── So sánh 2 võ sĩ: /so-sanh?a=<võ sĩ>&b=<võ sĩ> — màn đối đầu góc đỏ | góc xanh ─ */
  function pageCompare() {
    var q = qs(), list = D.fighters.slice().sort(byPoints);
    var A = bySlug[q.a] || list[0], B = bySlug[q.b] && bySlug[q.b] !== A ? bySlug[q.b] : list.filter(function (x) { return x !== A && x.gender === (A || {}).gender; })[0] || list.filter(function (x) { return x !== A; })[0];
    if (!A || !B) { root.innerHTML = hero({ h1: esc(t('cmp.title')), sub: '<p>' + esc(t('cmp.hint')) + '</p>' }); return; }
    document.title = A.name + ' vs ' + B.name + ' · Dapper Combat Academy Ranking';
    // kèo dự đoán (cho vui): số hiệp + loại trận chọn được, mặc định sparring 3 hiệp
    var RD = q.r === '5' ? 5 : 3, TY = q.t === 'fight' ? 'fight' : 'sparring', OPT = { rounds: RD, type: TY };
    var P = predict(A, B, OPT), pc = function (x) { return Math.round(x * 100); }, short = function (f) { return f.name.split(' ').pop(); };
    var outName = function (k) { return t('pr.out.' + k, { a: short(A), b: short(B) }); };
    var five = [['aKO', P.aKO], ['aDec', P.aDec], ['draw', P.draw], ['bDec', P.bDec], ['bKO', P.bKO]];
    var big = function (side, name, p, odds) { return '<div class="' + side + '"><small>' + esc(name) + '</small><b>' + pc(p) + '%</b><span>' + esc(t('pr.odds')) + ' ' + numFmt(odds, 2) + '</span></div>'; };
    var resTxt = function (s) { return String(s || '').split('').map(function (x) { return t('res.' + x); }).join(' ') || '—'; };
    var fxDetail = function (x) {
      return x.k === 'reach' ? t('cm', { n: x.a + ' vs ' + x.b }) : x.k === 'weight' ? t('kg', { n: numFmt(x.a, 1) + ' vs ' + numFmt(x.b, 1) }) : x.k === 'stance' ? stance(x.a) + ' vs ' + stance(x.b)
        : x.k === 'experience' ? t('fx.boutsN', { a: x.a, b: x.b }) : x.k === 'form' ? resTxt(x.a) + '  vs  ' + resTxt(x.b) : x.k === 'age' ? (x.a != null ? x.a : '—') + ' vs ' + (x.b != null ? x.b : '—')
          : x.k === 'stamina' ? x.a + ' vs ' + x.b : '';
    };
    var factors = P.factors.map(function (x) {
      var side = x.v > 0 ? 'a' : 'b', lvl = Math.abs(x.v) >= 30 ? 3 : Math.abs(x.v) >= 15 ? 2 : 1;
      return '<li class="' + side + '"><span class="k">' + esc(t('fx.' + x.k, { n: RD })) + '<small>' + esc(fxDetail(x)) + '</small></span><span class="w">' + esc(short(side === 'a' ? A : B)) +
        '<i class="l' + lvl + '" aria-label="' + esc(t('fx.lvl', { n: lvl })) + '"><b></b><b></b><b></b></i></span></li>';
    }).join('');
    var predBox = box(esc(t('pr.title')), '<div class="xh-pr"><div class="xh-pr-ctl">' + seg('r', [['3', t('ev.rounds', { n: 3 })], ['5', t('ev.rounds', { n: 5 })]], String(RD)) +
      seg('t', [['sparring', t('type.sparring')], ['fight', t('type.fight')]], TY) + '</div>' +
      '<div class="xh-pr-big">' + big('a', A.name, P.a, P.odds.a) + big('d', t('pr.draw'), P.draw, P.odds.draw) + big('b', B.name, P.b, P.odds.b) + '</div>' +
      '<div class="xh-pr-bar" role="img" aria-label="' + esc(five.map(function (x) { return outName(x[0]) + ' ' + pc(x[1]) + '%'; }).join(', ')) + '">' +
        five.map(function (x) { return '<i class="' + x[0] + '" style="flex-grow:' + Math.max(0.4, x[1] * 100).toFixed(1) + '"></i>'; }).join('') + '</div>' +
      '<ul class="xh-pr-leg">' + five.map(function (x) { return '<li class="' + x[0] + '"><i></i>' + esc(outName(x[0])) + '<b>' + pc(x[1]) + '%</b></li>'; }).join('') + '</ul>' +
      '<dl class="xh-pr-kv"><div><dt>' + esc(t('pr.likely')) + '</dt><dd>' + esc(outName(P.likely)) + '</dd></div><div><dt>' + esc(t('pr.distance', { n: RD })) + '</dt><dd>' + pc(P.distance) + '%</dd></div>' +
        '<div><dt>' + esc(t('pr.early')) + '</dt><dd>' + esc(short(A) + ' ' + t('ev.round', { n: P.aRound }) + ', ' + short(B) + ' ' + t('ev.round', { n: P.bRound })) + '</dd></div></dl>' +
      (factors ? '<h4 class="xh-pr-h">' + esc(t('pr.factors')) + '</h4><ul class="xh-pr-fx">' + factors + '</ul>' : '') +
      '<p class="xh-ch-note">' + esc(t('pr.conf') + ': ' + t('pr.conf.' + P.confidence) + '. ' + t('pr.note')) + '</p></div>');
    var pickers ='<div class="xh-cmp-pick"><label class="a">' + esc(t('cmp.red')) + ' <select data-f="a">' + fighterOpts(A.slug) + '</select></label>' +
      '<button type="button" class="xh-swap" data-swap>' + esc(t('cmp.swap')) + '</button><label class="b">' + esc(t('cmp.blue')) + ' <select data-f="b">' + fighterOpts(B.slug) + '</select></label></div>';
    var card = function (f, side) {
      return '<div class="xh-cmp-card ' + side + '"><span class="xh-cmp-img">' + portrait(f) + '</span><div class="xh-cmp-t">' + emblem(f, true) + (f.nickname ? '<small>' + esc(f.nickname) + '</small>' : '') +
        '<a href="' + href(f) + '"><b>' + esc(f.name) + '</b></a>' + rec(f.record) + '<span class="xh-cmp-x">' + stars(f.stars) + tier(f.tier) + '</span></div></div>';
    };
    // dòng thông số: cao hơn = tốt hơn (better: 1, có thanh so), thấp hơn = tốt hơn (better: -1), 0 = không so
    var num2 = function (v, fmt) { return v == null || v === '' ? '—' : fmt ? fmt(v) : v; };
    var tape = [
      [t('pf.points'), A.points, B.points, 1, pts], [t('sk.skill'), A.skillPoints, B.skillPoints, 1, numFmt], [t('sk.fight'), A.fightPoints, B.fightPoints, 1, function (v) { return (v > 0 ? '+' : '') + pts(v); }],
      [t('pf.rank'), ranked(A) ? A.rank.overall : null, ranked(B) ? B.rank.overall : null, -1, function (v) { return '#' + v; }],
      [t('pf.win'), A.record.w, B.record.w, 1], [t('pf.loss'), A.record.l, B.record.l, -1], [t('pf.draw'), A.record.d, B.record.d, 0], ['KO', A.record.ko, B.record.ko, 1],
      [t('pf.bouts'), A.record.bouts + ' · ' + A.record.rounds, B.record.bouts + ' · ' + B.record.rounds, 0],
      [t('pf.age'), A.age, B.age, 0], [t('pf.height'), A.height, B.height, 0, function (v) { return t('cm', { n: v }); }], [t('pf.reach'), A.reach, B.reach, 1, function (v) { return t('cm', { n: v }); }],
      [t('pf.weight'), A.weight, B.weight, 0, function (v) { return t('kg', { n: numFmt(v, 1) }); }], [t('pf.stance'), stance(A.stance), stance(B.stance), 0], [t('pf.div'), divName(A.division), divName(B.division), 0],
      [t('pf.home'), A.hometown, B.hometown, 0],
    ].map(function (r) {
      var a = r[1], b = r[2], wa = r[3] && a != null && b != null && a !== b && (r[3] > 0 ? a > b : a < b), wb = r[3] && a != null && b != null && a !== b && !wa;
      var bar = function (v, o) { var m = Math.max(v, o, 0); return r[3] === 1 && typeof v === 'number' && typeof o === 'number' && m > 0 ? '<i class="xh-tp-bar"><i style="width:' + Math.round(Math.max(0, v) / m * 100) + '%"></i></i>' : ''; };
      return '<div class="xh-tp"><div class="a' + (wa ? ' better' : '') + '"><b>' + esc(num2(a, r[4])) + '</b>' + bar(a, b) + '</div><span>' + esc(r[0]) + '</span><div class="b' + (wb ? ' better' : '') + '"><b>' + esc(num2(b, r[4])) + '</b>' + bar(b, a) + '</div></div>';
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
    root.innerHTML = hero({ h1: esc(t('cmp.title')), sub: '<p>' + esc(t('cmp.hint')) + '</p>', cls: 'xh-vs-hero',
      after: pickers + '<div class="xh-cmp-head">' + card(A, 'a') + '<div class="xh-cmp-vs" aria-hidden="true">VS</div>' + card(B, 'b') + '</div><div class="xh-cmp-prob"><small>' + esc(t('prob')) + '</small>' + probBar(A, B, OPT) + oddsLine(A, B, OPT) + '</div>' }) +
      page('<div class="xh-grid xh-cmp-grid"><div class="xh-col">' + predBox + box(esc(t('cmp.stats')), '<div class="xh-tape">' + tape + '</div>') +
      box(esc(t('cmp.h2h')), h2hHtml) + '</div><aside class="xh-col">' + box(esc(t('cmp.skills')), '<div class="xh-box-b">' + radar([{ f: A, color: '#D4372E' }, { f: B, color: '#2f6fd6' }]) +
      '<p class="xh-legend"><span class="a">' + esc(A.name) + '</span><span class="b">' + esc(B.name) + '</span></p><div class="xh-bflys">' + bars + '</div></div>') + '</aside></div>');
    var keep = { r: RD === 5 ? '5' : '', t: TY === 'fight' ? 'fight' : '' };
    bindFilters(function (k, v) { var o = { a: A.slug, b: B.slug, r: keep.r, t: keep.t }; o[k] = k === 'r' ? (v === '5' ? '5' : '') : k === 't' ? (v === 'fight' ? 'fight' : '') : v; setQs(o); render(); });
    root.querySelector('[data-swap]').addEventListener('click', function () { setQs({ a: B.slug, b: A.slug, r: keep.r, t: keep.t }); render(); });
  }
  function notFound(msg, back, backLabel) {
    root.innerHTML = hero({ h1: esc(t('nf.title')), sub: '<p>' + esc(t(msg)) + '</p><p><a href="' + back + '">' + esc(t(backLabel)) + '</a></p>' });
  }

  /* ─── Điều hướng, tìm kiếm, ngôn ngữ ──────────────────────────────────── */
  var path = location.pathname.replace(/\/+$/, '') || '/', m;
  var route = (m = /^\/vo-si\/([^/]+)$/.exec(path)) ? ['fighter', decodeURIComponent(m[1])] : (m = /^\/su-kien\/([^/]+)$/.exec(path)) ? ['event', decodeURIComponent(m[1])]
    : path === '/vo-si' ? ['fighters'] : path === '/su-kien' ? ['events'] : path === '/so-sanh' ? ['compare'] : ['ranking'];
  var SEC = { ranking: 'ranking', fighters: 'fighters', fighter: 'fighters', events: 'events', event: 'events', compare: 'compare' };
  var TITLE = { ranking: 'rank.title', fighters: 'dir.title', events: 'ev.title', compare: 'cmp.title' };   // cùng khóa server dùng cho <title> (lib/rank-seo.js)
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
