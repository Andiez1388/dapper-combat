/* Dapper Combat — Truyền Nghề (/truyen-nghe): đào tạo coach / võ sĩ từ con số 0, khóa 1 năm.
   Hai con đường như hai góc đài: góc xanh = Coach (học xong có việc làm tại HVP Academy), góc đỏ = Võ sĩ (thi đấu dưới tên The Corner).
   Cùng khối lượng (12 tháng, 5 buổi / tuần, 2 ca / ngày), khác nội dung giảng dạy và mục tiêu.
   Học phí + ngày khai giảng: /admin → Thiết lập → Học phí & lịch tập. Đăng ký gửi về /admin → Đăng ký khóa học (chương trình coach / fighter).
   Mở thẳng một con đường: /truyen-nghe#coach hoặc /truyen-nghe#vo-si. */
(function () {
  'use strict';
  var root = document.getElementById('tn');
  if (!root || !window.DC) return;
  var esc = DC.esc;
  var en = function () { return DC.lang() === 'en'; };
  var L = function (o) { return o ? (en() ? o.en || o.vi : o.vi) || '' : ''; };
  var p = function (vi, e) { return { vi: vi, en: e }; };
  var START = String(DC.setting('course.careerStart', '2027-02-20') || '2027-02-20');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(START)) START = '2027-02-20';
  var PRICE = Number(DC.setting('course.careerPrice', 50000000)) || 50000000;

  var T = {
    vi: {
      'site.home': 'Trang chủ', 'site.shop': 'Cửa hàng', 'site.course': 'Khóa học', 'site.services': 'Dịch vụ Setup', 'site.ranking': 'Academy Ranking', 'site.career': 'Truyền Nghề',
      'foot.note': 'Truyền Nghề là chương trình đào tạo nghề boxing của Dapper Combat.', 'foot.home': 'Về trang chủ Dapper Combat',
      'h1': 'Truyền Nghề', 'special': 'Chương trình đặc biệt',
      'lead': 'Học boxing từ con số 0 để thành nghề trong 1 năm. Hai con đường, hai bộ kỹ năng, hai đích đến: đứng lớp làm coach, hoặc lên sàn làm võ sĩ.',
      'start': 'Khai giảng {d}', 'left': 'còn {n} ngày', 'today': 'khai giảng hôm nay', 'started': 'đã khai giảng',
      'f.months': 'tháng học', 'f.sess': 'buổi mỗi tuần', 'f.shifts': 'ca mỗi ngày', 'f.fee': 'học phí mỗi khóa',
      'cta.apply': 'Đăng ký giữ chỗ', 'cta.paths': 'Xem 2 con đường', 'ring.hint': 'Bấm vào một góc đài để xem con đường đó.', 'ring.label': 'Sàn đấu: góc đỏ Võ sĩ, góc xanh Coach',
      'paths.h': 'Hai góc đài, một sàn tập', 'paths.sub': 'Cùng giờ tập, cùng mồ hôi, nhưng mỗi góc đài đi về một hướng. Chọn góc của bạn.',
      'card.who': 'Dành cho', 'card.goal': 'Mục tiêu', 'card.out': 'Học xong', 'card.pick': 'Xem lộ trình {n}', 'card.on': 'Đang xem',
      'bar.label': 'Con đường', 'bar.apply': 'Đăng ký',
      'cmp.h': 'Cùng khối lượng, khác đích đến', 'cmp.sub': 'Hai khóa học cùng số tháng, cùng số buổi, cùng số ca. Khác nhau ở nội dung giảng dạy và mục tiêu cuối cùng.',
      'cmp.same': 'Giống nhau', 'cmp.diff': 'Khác nhau',
      'cmp.time': 'Thời gian', 'cmp.sched': 'Lịch học', 'cmp.fee': 'Học phí', 'cmp.content': 'Nội dung chính', 'cmp.goal': 'Mục tiêu', 'cmp.out': 'Học xong',
      'v.time': '12 tháng', 'v.sched': '5 buổi mỗi tuần, 2 ca mỗi ngày',
      'road.h': 'Lộ trình 12 tháng, 4 hiệp', 'road.sub': 'Mỗi hiệp 3 tháng, kết thúc bằng một mốc kiểm tra. Hết hiệp 4 là tiếng chuông đầu tiên của nghề.',
      'road.round': 'Hiệp {n}', 'road.mile': 'Mốc kết thúc hiệp', 'road.bell': 'Sau 12 tháng',
      'week.h': 'Một tuần học mẫu', 'week.sub': 'Thứ 2 đến Thứ 6, mỗi ngày 2 ca. Khung lịch giống hệt nhau ở cả 2 khóa, chỉ nội dung từng ca là khác.',
      'week.s1': 'Ca 1', 'week.s1d': 'buổi sáng', 'week.s2': 'Ca 2', 'week.s2d': 'buổi chiều', 'week.note': '10 ca mỗi tuần ở cả 2 khóa. Bấm đổi con đường để thấy nội dung từng ca thay đổi.',
      'd1': 'Thứ 2', 'd2': 'Thứ 3', 'd3': 'Thứ 4', 'd4': 'Thứ 5', 'd5': 'Thứ 6',
      'tag.tech': 'Kỹ thuật', 'tag.fit': 'Thể lực', 'tag.theory': 'Lý thuyết', 'tag.teach': 'Thực hành dạy', 'tag.spar': 'Sparring', 'tag.tactic': 'Chiến thuật',
      'skills.h': 'Bộ kỹ năng {n}', 'promise.h': 'Cam kết khi học xong', 'seal.coach': 'VIỆC LÀM', 'seal.fighter': 'THI ĐẤU',
      'fee.h': 'Học phí', 'fee.per': 'mỗi khóa 1 năm', 'fee.same': 'Coach và Võ sĩ cùng mức học phí.', 'fee.how': 'Hình thức đóng học phí được tư vấn khi bạn đăng ký.',
      'form.h': 'Đăng ký giữ chỗ', 'form.sub': 'Để lại thông tin, Dapper Combat sẽ gọi lại để tư vấn và giữ chỗ cho bạn.',
      'form.path': 'Bạn muốn theo con đường nào?', 'form.name': 'Họ và tên', 'form.phone': 'Số điện thoại', 'form.email': 'Email (không bắt buộc)', 'form.year': 'Năm sinh',
      'form.exp': 'Kinh nghiệm boxing', 'exp.0': 'Chưa tập bao giờ', 'exp.1': 'Dưới 1 năm', 'exp.2': 'Từ 1 năm trở lên', 'form.note': 'Bạn muốn hỏi thêm gì? (không bắt buộc)',
      'form.send': 'Gửi đăng ký', 'form.sending': 'Đang gửi…',
      'ok.h': 'Đã nhận đăng ký', 'ok.p': 'Mã đăng ký của bạn: {c}. Dapper Combat sẽ gọi lại số {ph} để tư vấn khóa {n}.', 'ok.again': 'Đăng ký cho người khác',
      'err.name': 'Nhập họ và tên', 'err.phone': 'Số điện thoại chưa đúng', 'err.year': 'Năm sinh chưa đúng',
      'faq.h': 'Câu hỏi thường gặp',
      'q1': 'Chưa từng tập boxing có học được không?', 'a1': 'Được. Cả 2 khóa đều bắt đầu từ con số 0. Hiệp đầu tiên (3 tháng đầu) dành cho nền tảng: tư thế, bộ pháp, đòn cơ bản và thể lực.',
      'q2': 'Hai khóa khác nhau ở đâu?', 'a2': 'Cùng khối lượng: 12 tháng, 5 buổi mỗi tuần, 2 ca mỗi ngày. Khác nội dung và mục tiêu: Coach học phương pháp dạy và có việc làm tại HVP Academy; Võ sĩ học kỹ thuật, chiến thuật thi đấu và ở lại thi đấu dưới tên The Corner.',
      'q3': 'Lịch học cụ thể thế nào?', 'a3': 'Học từ Thứ 2 đến Thứ 6, mỗi ngày 2 ca (sáng và chiều), liên tục 12 tháng kể từ ngày khai giảng {d}.',
      'q4': 'Học phí bao nhiêu, đóng thế nào?', 'a4': '{fee} cho cả khóa 1 năm, Coach và Võ sĩ cùng giá. Hình thức đóng học phí được tư vấn khi bạn đăng ký.',
      'q5': 'Học xong thì sao?', 'a5': 'Coach được nhận làm việc tại HVP Academy. Võ sĩ ở lại tập luyện và được dẫn đi thi đấu dưới tên The Corner.',
    },
    en: {
      'site.home': 'Home', 'site.shop': 'Shop', 'site.course': 'Courses', 'site.services': 'Gym Setup', 'site.ranking': 'Academy Ranking', 'site.career': 'Pro Pathways',
      'foot.note': 'Pro Pathways is the boxing career program of Dapper Combat.', 'foot.home': 'Back to Dapper Combat',
      'h1': 'Pro Pathways', 'special': 'Special program',
      'lead': 'Go from zero to a boxing career in one year. Two paths, two skill sets, two destinations: coach in the gym, or fighter in the ring.',
      'start': 'Starts {d}', 'left': 'in {n} days', 'today': 'starts today', 'started': 'now running',
      'f.months': 'months', 'f.sess': 'sessions a week', 'f.shifts': 'shifts a day', 'f.fee': 'per course',
      'cta.apply': 'Reserve a place', 'cta.paths': 'See both paths', 'ring.hint': 'Tap a corner of the ring to see that path.', 'ring.label': 'The ring: red corner Fighter, blue corner Coach',
      'paths.h': 'Two corners, one gym', 'paths.sub': 'Same hours, same sweat, but each corner heads somewhere different. Pick yours.',
      'card.who': 'For', 'card.goal': 'Goal', 'card.out': 'When you finish', 'card.pick': 'See the {n} path', 'card.on': 'Viewing',
      'bar.label': 'Path', 'bar.apply': 'Apply',
      'cmp.h': 'Same workload, different destination', 'cmp.sub': 'Both courses run the same months, sessions and shifts. They differ in what is taught and where it leads.',
      'cmp.same': 'Same', 'cmp.diff': 'Different',
      'cmp.time': 'Length', 'cmp.sched': 'Schedule', 'cmp.fee': 'Fee', 'cmp.content': 'Core content', 'cmp.goal': 'Goal', 'cmp.out': 'When you finish',
      'v.time': '12 months', 'v.sched': '5 sessions a week, 2 shifts a day',
      'road.h': '12 months, 4 rounds', 'road.sub': 'Each round lasts 3 months and ends with a checkpoint. After round 4 comes the first bell of your career.',
      'road.round': 'Round {n}', 'road.mile': 'End-of-round checkpoint', 'road.bell': 'After 12 months',
      'week.h': 'A sample week', 'week.sub': 'Monday to Friday, 2 shifts a day. The timetable is identical for both courses; only what happens in each shift differs.',
      'week.s1': 'Shift 1', 'week.s1d': 'morning', 'week.s2': 'Shift 2', 'week.s2d': 'afternoon', 'week.note': '10 shifts a week on both courses. Switch paths to see each shift change.',
      'd1': 'Mon', 'd2': 'Tue', 'd3': 'Wed', 'd4': 'Thu', 'd5': 'Fri',
      'tag.tech': 'Technique', 'tag.fit': 'Conditioning', 'tag.theory': 'Theory', 'tag.teach': 'Teaching practice', 'tag.spar': 'Sparring', 'tag.tactic': 'Tactics',
      'skills.h': '{n} skill set', 'promise.h': 'What we commit to', 'seal.coach': 'JOB', 'seal.fighter': 'FIGHT',
      'fee.h': 'Fee', 'fee.per': 'per one-year course', 'fee.same': 'Coach and Fighter cost the same.', 'fee.how': 'Payment options are explained when you apply.',
      'form.h': 'Reserve a place', 'form.sub': 'Leave your details and Dapper Combat will call you back to advise and hold your place.',
      'form.path': 'Which path do you want?', 'form.name': 'Full name', 'form.phone': 'Phone number', 'form.email': 'Email (optional)', 'form.year': 'Year of birth',
      'form.exp': 'Boxing experience', 'exp.0': 'Never trained', 'exp.1': 'Under 1 year', 'exp.2': '1 year or more', 'form.note': 'Anything you want to ask? (optional)',
      'form.send': 'Send application', 'form.sending': 'Sending…',
      'ok.h': 'Application received', 'ok.p': 'Your reference: {c}. Dapper Combat will call {ph} to talk about the {n} course.', 'ok.again': 'Apply for someone else',
      'err.name': 'Please enter your name', 'err.phone': 'Please enter a valid phone number', 'err.year': 'Please check the year of birth',
      'faq.h': 'Questions',
      'q1': 'Can I join if I have never boxed?', 'a1': 'Yes. Both courses start from zero. The first round (the first 3 months) covers the foundations: stance, footwork, basic punches and conditioning.',
      'q2': 'How do the two courses differ?', 'a2': 'Same workload: 12 months, 5 sessions a week, 2 shifts a day. Different content and goal: Coach learns how to teach and gets a job at HVP Academy; Fighter learns competition technique and tactics and stays on to fight under The Corner.',
      'q3': 'What does the timetable look like?', 'a3': 'Monday to Friday, 2 shifts a day (morning and afternoon), for 12 months from the start date, {d}.',
      'q4': 'How much is it and how do I pay?', 'a4': '{fee} for the full one-year course, the same for Coach and Fighter. Payment options are explained when you apply.',
      'q5': 'What happens when I finish?', 'a5': 'Coaches are hired to work at HVP Academy. Fighters stay on to train and are taken to compete under the name The Corner.',
    },
  };
  function t(k, v) {
    var s = (T[en() ? 'en' : 'vi'][k] != null ? T[en() ? 'en' : 'vi'][k] : T.vi[k]) || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split('{' + x + '}').join(v[x]); });
    return s;
  }

  /* ─── Hai con đường ─────────────────────────────────────────────────────── */
  var P = {
    coach: {
      hash: 'coach', corner: p('Góc xanh', 'Blue corner'), name: p('Coach', 'Coach'), title: p('Huấn luyện viên', 'Coach'), seal: 'HVP ACADEMY',
      who: p('Người muốn sống bằng nghề dạy boxing. Chưa biết đấm cũng được: bạn học như một võ sĩ trước khi học cách dạy.', 'People who want to make a living teaching boxing. No experience needed: you train like a fighter before you learn to teach.'),
      goal: p('Đứng lớp dạy boxing chuyên nghiệp, lớp nhóm và 1-1.', 'Teach boxing professionally, group classes and 1-on-1.'),
      out: p('Có việc làm tại HVP Academy', 'A job at HVP Academy'),
      content: p('Phương pháp dạy, cầm đích, soạn giáo án', 'Teaching method, pad work, lesson planning'), goalShort: p('Đứng lớp dạy người khác', 'Teach other people'),
      promise: p('Học xong 1 năm, bạn được nhận làm việc tại HVP Academy.', 'Finish the year and you are hired to work at HVP Academy.'),
      promiseSub: p('Bạn bước ra khỏi khóa học với một công việc, không chỉ một tấm chứng nhận.', 'You leave the course with a job, not just a certificate.'),
      rounds: [
        { t: p('Nền tảng như một võ sĩ', 'Foundations, like a fighter'), items: [p('Tư thế, bộ pháp, 6 đòn cơ bản', 'Stance, footwork, the 6 basic punches'), p('Thể lực nền, khởi động và giãn cơ đúng', 'Base conditioning, proper warm-up and cool-down'), p('Tự tập đúng trước khi dạy người khác', 'Do it right yourself before you teach it')], mile: p('Sát hạch kỹ thuật cơ bản', 'Basic technique assessment') },
        { t: p('Nghề cầm đích', 'The craft of the pads'), items: [p('Cầm đích (pad work) và ra bài tập', 'Holding pads and calling drills'), p('Đọc lỗi kỹ thuật và cách sửa', 'Spotting and fixing technical faults'), p('Nguyên lý soạn giáo án một buổi tập', 'Planning a single session')], mile: p('Tự soạn và dạy thử một buổi', 'Plan and teach a trial session') },
        { t: p('Trợ giảng lớp thật', 'Assisting real classes'), items: [p('Kèm HLV chính tại các lớp đang mở', 'Shadow the head coach in live classes'), p('Quản lý lớp nhóm, giữ nhịp buổi tập', 'Run a group and keep the session moving'), p('Sơ cứu, phòng chấn thương, dinh dưỡng cơ bản', 'First aid, injury prevention, basic nutrition')], mile: p('HLV chính đánh giá đạt', 'Signed off by the head coach') },
        { t: p('Đứng lớp và sát hạch', 'Leading classes, final test'), items: [p('Đứng lớp nhóm và 1-1 có giám sát', 'Lead group and 1-on-1 sessions under supervision'), p('Xây chương trình 4 tuần cho học viên', 'Build a 4-week program for a member'), p('Tư vấn và giữ chân học viên', 'Advise members and keep them training')], mile: p('Sát hạch cuối khóa', 'Final assessment') },
      ],
      week: [
        [[p('Kỹ thuật nền', 'Core technique'), 'tech'], [p('Giải phẫu và sinh lý vận động', 'Anatomy and exercise physiology'), 'theory']],
        [[p('Thể lực', 'Conditioning'), 'fit'], [p('Cầm đích', 'Pad work'), 'teach']],
        [[p('Kỹ thuật nền', 'Core technique'), 'tech'], [p('Đọc lỗi và sửa kỹ thuật', 'Spotting and fixing faults'), 'teach']],
        [[p('Thể lực', 'Conditioning'), 'fit'], [p('Soạn giáo án, quản lý lớp', 'Lesson plans, running a class'), 'theory']],
        [[p('Sparring kỹ thuật', 'Technical sparring'), 'spar'], [p('Trợ giảng lớp thật', 'Assisting a live class'), 'teach']],
      ],
      skills: [
        [p('Cầm đích và ra bài', 'Pads and drills'), p('Giữ nhịp, đọc khoảng cách, gọi combo cho học viên đánh.', 'Keep the rhythm, read the distance, call combinations for members to throw.')],
        [p('Đọc và sửa lỗi kỹ thuật', 'Spotting and fixing faults'), p('Nhìn ra lỗi tư thế, lỗi đòn và sửa bằng bài tập phù hợp.', 'See stance and punch faults and fix them with the right drill.')],
        [p('Soạn giáo án', 'Lesson planning'), p('Từ một buổi tập tới chương trình nhiều tuần cho từng trình độ.', 'From a single session to multi-week programs for every level.')],
        [p('Quản lý lớp', 'Running a class'), p('Dẫn lớp nhóm và buổi 1-1, giữ an toàn và hứng thú.', 'Lead groups and 1-on-1 sessions, keeping them safe and engaging.')],
        [p('Sơ cứu và phòng chấn thương', 'First aid and injury prevention'), p('Quấn băng tay đúng, khởi động đúng, xử lý chấn thương nhẹ.', 'Wrap hands, warm up properly, deal with minor injuries.')],
        [p('Dinh dưỡng và tư vấn', 'Nutrition and advice'), p('Hướng dẫn ăn tập cơ bản, tư vấn và giữ chân học viên.', 'Basic eating-for-training advice, guiding and keeping members.')],
      ],
    },
    fighter: {
      hash: 'vo-si', corner: p('Góc đỏ', 'Red corner'), name: p('Võ sĩ', 'Fighter'), title: p('Võ sĩ thi đấu', 'Competitive fighter'), seal: 'THE CORNER',
      who: p('Người muốn lên sàn thi đấu thật. Chưa từng tập cũng được: bạn được xây từ nền tảng.', 'People who want to fight for real. Never trained? You get built from the ground up.'),
      goal: p('Thi đấu boxing, từ sparring nội bộ tới trận đấu thật.', 'Compete in boxing, from in-house sparring to real bouts.'),
      out: p('Thi đấu dưới tên The Corner', 'Fight under the name The Corner'),
      content: p('Kỹ thuật, thể lực, chiến thuật thi đấu', 'Technique, conditioning, fight tactics'), goalShort: p('Lên sàn thi đấu', 'Step into the ring'),
      promise: p('Học xong, bạn ở lại thi đấu dưới tên The Corner và được đội ngũ dẫn đi thi đấu.', 'When you finish you stay on to fight under the name The Corner, and the team takes you to compete.'),
      promiseSub: p('Không chỉ học đánh: bạn có một đội, một góc đài và lịch thi đấu.', 'More than lessons: a team, a corner and fights on the calendar.'),
      rounds: [
        { t: p('Nền tảng và thể lực', 'Foundations and conditioning'), items: [p('Tư thế, bộ pháp, đòn cơ bản', 'Stance, footwork, basic punches'), p('Thể lực nền cho người mới', 'Base conditioning for beginners'), p('Sparring kỹ thuật nhẹ', 'Light technical sparring')], mile: p('Lần chấm kỹ năng đầu tiên trên Academy Ranking', 'First skills score on the Academy Ranking') },
        { t: p('Xây lối đánh', 'Building your style'), items: [p('Combo, phòng thủ và phản đòn', 'Combinations, defense and counters'), p('Sparring có chấm điểm', 'Scored sparring'), p('Chiến thuật theo từng kiểu đối thủ', 'Tactics for each kind of opponent')], mile: p('Sparring Day có chấm điểm', 'A scored Sparring Day') },
        { t: p('Thi đấu nội bộ', 'In-house competition'), items: [p('Fight night nội bộ của Academy', 'Academy fight nights'), p('Giữ cân và dinh dưỡng thi đấu', 'Making weight and fight nutrition'), p('Tâm lý trước trận', 'Pre-fight mindset')], mile: p('Trận fight night nội bộ đầu tiên', 'Your first in-house fight night') },
        { t: p('Trại thi đấu', 'Fight camp'), items: [p('Fight camp trước trận', 'A full fight camp'), p('Phân tích băng hình đối thủ', 'Opponent video study'), p('Chuẩn bị trận ra mắt', 'Preparing your debut')], mile: p('Ra mắt dưới tên The Corner', 'Debut under The Corner') },
      ],
      week: [
        [[p('Kỹ thuật và combo', 'Technique and combinations'), 'tech'], [p('Thể lực sức bền', 'Endurance conditioning'), 'fit']],
        [[p('Bao cát và đích', 'Bags and pads'), 'tech'], [p('Sparring kỹ thuật', 'Technical sparring'), 'spar']],
        [[p('Phòng thủ và phản đòn', 'Defense and counters'), 'tech'], [p('Thể lực sức mạnh', 'Strength conditioning'), 'fit']],
        [[p('Chiến thuật, xem băng hình', 'Tactics and video study'), 'tactic'], [p('Sparring có chấm điểm', 'Scored sparring'), 'spar']],
        [[p('Tốc độ và phản xạ', 'Speed and reflexes'), 'fit'], [p('Sparring, fight night nội bộ', 'Sparring, in-house fight night'), 'spar']],
      ],
      skills: [
        [p('Kỹ thuật thi đấu', 'Competition technique'), p('Đòn, combo và phòng thủ dùng được dưới áp lực thật.', 'Punches, combinations and defense that hold up under real pressure.')],
        [p('Thể lực chuyên sâu', 'Fight conditioning'), p('Sức bền, sức mạnh, tốc độ đủ cho trận nhiều hiệp.', 'Endurance, strength and speed for multi-round bouts.')],
        [p('Sparring chiến thuật', 'Tactical sparring'), p('Áp dụng kế hoạch trận đấu khi có người đánh lại.', 'Run a game plan while someone hits back.')],
        [p('Đọc đối thủ', 'Reading opponents'), p('Xem băng hình, tìm điểm yếu, điều chỉnh giữa các hiệp.', 'Study video, find weaknesses, adjust between rounds.')],
        [p('Giữ cân và dinh dưỡng thi đấu', 'Weight and fight nutrition'), p('Xuống cân an toàn, ăn uống trước và sau trận.', 'Cut weight safely, eat right before and after a fight.')],
        [p('Tâm lý thi đấu', 'Fight mindset'), p('Giữ bình tĩnh khi lên sàn, trước đám đông và sau thất bại.', 'Stay calm in the ring, in front of a crowd and after a loss.')],
      ],
    },
  };
  var ORDER = ['coach', 'fighter'];
  var path = location.hash === '#vo-si' || location.hash === '#fighter' ? 'fighter' : 'coach';

  /* ─── Mảnh giao diện ──────────────────────────────────────────────────── */
  var money = function (n) { return Math.round(n).toLocaleString(en() ? 'en-US' : 'vi-VN') + (en() ? ' VND' : 'đ'); };
  var moneyShort = function (n) { return n % 1000000 === 0 ? (n / 1000000) + (en() ? 'm' : 'tr') : money(n); };
  function startText(long) {
    var d = new Date(START + 'T00:00:00Z');
    return long ? d.toLocaleDateString(en() ? 'en-GB' : 'vi-VN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      : START.slice(8) + '.' + START.slice(5, 7) + '.' + START.slice(0, 4);
  }
  // số ngày tới khai giảng theo lịch Việt Nam
  var daysLeft = function () { return Math.round((Date.parse(START) - Date.parse(new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10))) / 86400000); };
  function leftText() { var n = daysLeft(); return n > 0 ? t('left', { n: n }) : n === 0 ? t('today') : t('started'); }
  // tháng của từng hiệp (mỗi hiệp 3 tháng kể từ tháng khai giảng)
  function roundMonths(i) {
    var y = +START.slice(0, 4), m = +START.slice(5, 7) - 1 + i * 3;
    var f = function (k) { var d = new Date(Date.UTC(y, m + k, 1)); return en() ? d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'T' + (d.getUTCMonth() + 1) + '/' + d.getUTCFullYear(); };
    return f(0) + ' – ' + f(2);
  }
  var other = function (k) { return k === 'coach' ? 'fighter' : 'coach'; };

  // sàn đấu nhìn từ trên xuống (xoay 45°): góc trái đỏ = Võ sĩ, góc phải xanh = Coach
  function ring() {
    var d = function (o) { return 'M200 ' + (30 + o) + ' L' + (370 - o) + ' 200 L200 ' + (370 - o) + ' L' + (30 + o) + ' 200 Z'; };
    return '<svg class="tn-ring-svg" viewBox="0 0 400 400" aria-hidden="true">' +
      '<defs><radialGradient id="tnGr" cx="0.12" cy="0.5" r="0.62"><stop offset="0" stop-color="#D4372E" stop-opacity="0.55"/><stop offset="1" stop-color="#D4372E" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tnGb" cx="0.88" cy="0.5" r="0.62"><stop offset="0" stop-color="#2f6fd6" stop-opacity="0.55"/><stop offset="1" stop-color="#2f6fd6" stop-opacity="0"/></radialGradient></defs>' +
      '<path d="' + d(-14) + '" class="apron"/><path d="' + d(8) + '" class="canvas"/>' +
      '<path d="' + d(8) + '" fill="url(#tnGr)" class="glow r"/><path d="' + d(8) + '" fill="url(#tnGb)" class="glow b"/>' +
      '<path d="' + d(2) + '" class="rope r1"/><path d="' + d(12) + '" class="rope r2"/><path d="' + d(22) + '" class="rope r3"/>' +
      '<g class="logo"><text x="200" y="158" text-anchor="middle" class="k">' + esc(t('start', { d: '' }).trim()) + '</text><text x="200" y="222" text-anchor="middle" class="d">' + esc(START.slice(8) + '.' + START.slice(5, 7)) + '</text><text x="200" y="254" text-anchor="middle" class="y">' + esc(START.slice(0, 4)) + '</text></g>' +
      '<circle cx="200" cy="30" r="11" class="post n"/><circle cx="200" cy="370" r="11" class="post n"/>' +
      '<circle cx="30" cy="200" r="15" class="post r"/><circle cx="370" cy="200" r="15" class="post b"/></svg>';
  }
  function cornerBtn(k) {
    var x = P[k];
    return '<button type="button" class="tn-corner ' + k + '" data-path="' + k + '" aria-pressed="' + (path === k) + '"><small>' + esc(L(x.corner)) + '</small><b>' + esc(L(x.name)) + '</b><span>' + esc(L(x.out)) + '</span></button>';
  }
  function card(k) {
    var x = P[k];
    return '<article class="tn-card ' + k + (path === k ? ' on' : '') + '"><header><small>' + esc(L(x.corner)) + '</small><h3>' + esc(L(x.name)) + '</h3>' + (path === k ? '<span class="tn-on">' + esc(t('card.on')) + '</span>' : '') + '</header>' +
      '<dl><div><dt>' + esc(t('card.who')) + '</dt><dd>' + esc(L(x.who)) + '</dd></div><div><dt>' + esc(t('card.goal')) + '</dt><dd>' + esc(L(x.goal)) + '</dd></div>' +
      '<div class="out"><dt>' + esc(t('card.out')) + '</dt><dd>' + esc(L(x.out)) + '</dd></div></dl>' +
      '<p class="tn-card-meta"><span>' + esc(t('v.time')) + '</span><span>' + esc(t('v.sched')) + '</span><span>' + esc(money(PRICE)) + '</span></p>' +
      '<button type="button" class="tn-btn ' + (path === k ? '' : 'ghost') + '" data-path="' + k + '" data-go="lo-trinh">' + esc(t('card.pick', { n: L(x.name) })) + '</button></article>';
  }
  function compare() {
    var row = function (key, a, b, same) {
      return '<div class="tn-cmp-row' + (same ? ' same' : ' diff') + '"><div class="c coach">' + esc(a) + '</div><div class="k"><span>' + esc(t(key)) + '</span><i title="' + esc(t(same ? 'cmp.same' : 'cmp.diff')) + '" aria-label="' + esc(t(same ? 'cmp.same' : 'cmp.diff')) + '">' + (same ? '=' : '≠') + '</i></div><div class="c fighter">' + esc(b) + '</div></div>';
    };
    return '<div class="tn-cmp"><div class="tn-cmp-row head"><div class="c coach">' + esc(L(P.coach.name)) + '</div><div class="k"></div><div class="c fighter">' + esc(L(P.fighter.name)) + '</div></div>' +
      row('cmp.time', t('v.time'), t('v.time'), true) + row('cmp.sched', t('v.sched'), t('v.sched'), true) + row('cmp.fee', money(PRICE), money(PRICE), true) +
      row('cmp.content', L(P.coach.content), L(P.fighter.content)) + row('cmp.goal', L(P.coach.goalShort), L(P.fighter.goalShort)) + row('cmp.out', L(P.coach.out), L(P.fighter.out)) + '</div>';
  }
  function road() {
    var x = P[path];
    return '<ol class="tn-road">' + x.rounds.map(function (r, i) {
      return '<li><p class="tn-rd-n"><b>' + (i + 1) + '</b><span>' + esc(t('road.round', { n: i + 1 })) + '</span><small>' + esc(roundMonths(i)) + '</small></p><h3>' + esc(L(r.t)) + '</h3>' +
        '<ul>' + r.items.map(function (it) { return '<li>' + esc(L(it)) + '</li>'; }).join('') + '</ul><p class="tn-rd-mile"><small>' + esc(t('road.mile')) + '</small>' + esc(L(r.mile)) + '</p></li>';
    }).join('') + '</ol><div class="tn-bell"><span class="tn-bell-ic" aria-hidden="true"></span><p><small>' + esc(t('road.bell')) + '</small><b>' + esc(L(x.out)) + '</b></p></div>';
  }
  function week() {
    var x = P[path], head = '<div class="tn-wk-h"></div>' + [1, 2, 3, 4, 5].map(function (d) { return '<div class="tn-wk-h">' + esc(t('d' + d)) + '</div>'; }).join('');
    var shift = function (s) {
      return '<div class="tn-wk-s"><b>' + esc(t('week.s' + s)) + '</b><small>' + esc(t('week.s' + s + 'd')) + '</small></div>' + x.week.map(function (day, i) {
        var c = day[s - 1];
        return '<div class="tn-wk-c ' + c[1] + '"><small class="tn-wk-d">' + esc(t('d' + (i + 1))) + ', ' + esc(t('week.s' + s)) + '</small><b>' + esc(L(c[0])) + '</b><span>' + esc(t('tag.' + c[1])) + '</span></div>';
      }).join('');
    };
    return '<div class="tn-wk">' + head + shift(1) + shift(2) + '</div><p class="tn-note">' + esc(t('week.note')) + '</p>';
  }
  function skills() {
    return '<ul class="tn-skills">' + P[path].skills.map(function (s) { return '<li><h3>' + esc(L(s[0])) + '</h3><p>' + esc(L(s[1])) + '</p></li>'; }).join('') + '</ul>';
  }
  // con dấu tròn: tên nơi làm việc / đội thi đấu chạy quanh vòng tròn
  function seal(name) {
    var txt = (name + ' · ').repeat(3);
    return '<svg class="tn-seal" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="tnSealP" d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0"/></defs>' +
      '<circle cx="100" cy="100" r="92" class="o"/><circle cx="100" cy="100" r="56" class="i"/>' +
      '<text class="ring-t" textLength="460" lengthAdjust="spacing"><textPath href="#tnSealP">' + esc(txt) + '</textPath></text>' +
      '<text x="100" y="98" text-anchor="middle" class="big">' + esc(t(path === 'coach' ? 'seal.coach' : 'seal.fighter')) + '</text>' +
      '<text x="100" y="122" text-anchor="middle" class="sm">' + esc(startText().slice(-4)) + '</text></svg>';
  }
  function promise() {
    var x = P[path];
    return '<div class="tn-promise"><div><p class="tn-promise-q">' + esc(L(x.promise)) + '</p><p class="tn-promise-s">' + esc(L(x.promiseSub)) + '</p></div>' + seal(x.seal) + '</div>';
  }
  function form() {
    return '<form class="tn-form" novalidate><fieldset class="tn-pick"><legend>' + esc(t('form.path')) + '</legend>' + ORDER.map(function (k) {
      return '<label class="' + k + '"><input type="radio" name="path" value="' + k + '"' + (path === k ? ' checked' : '') + '><span><small>' + esc(L(P[k].corner)) + '</small><b>' + esc(L(P[k].name)) + '</b><em>' + esc(L(P[k].out)) + '</em></span></label>';
    }).join('') + '</fieldset>' +
      '<div class="tn-fg"><label class="tn-f wide"><span>' + esc(t('form.name')) + '</span><input name="name" autocomplete="name" maxlength="80" required></label>' +
      '<label class="tn-f"><span>' + esc(t('form.phone')) + '</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="20" required></label>' +
      '<label class="tn-f"><span>' + esc(t('form.year')) + '</span><input name="year" inputmode="numeric" maxlength="4" placeholder="2004"></label>' +
      '<label class="tn-f"><span>' + esc(t('form.email')) + '</span><input name="email" type="email" autocomplete="email" maxlength="120"></label>' +
      '<label class="tn-f"><span>' + esc(t('form.exp')) + '</span><select name="exp">' + [0, 1, 2].map(function (i) { return '<option value="' + i + '">' + esc(t('exp.' + i)) + '</option>'; }).join('') + '</select></label>' +
      '<label class="tn-f wide"><span>' + esc(t('form.note')) + '</span><textarea name="note" rows="3" maxlength="400"></textarea></label></div>' +
      '<p class="tn-err" role="alert" hidden></p><button class="tn-btn" type="submit">' + esc(t('form.send')) + '</button></form>';
  }
  function faq() {
    return '<div class="tn-faq">' + [1, 2, 3, 4, 5].map(function (i) {
      return '<details><summary>' + esc(t('q' + i)) + '</summary><p>' + esc(t('a' + i, { d: startText(true), fee: money(PRICE) })) + '</p></details>';
    }).join('') + '</div>';
  }
  var sec = function (id, h, sub, body, cls) { return '<section class="tn-sec' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="tn-in"><header class="tn-sec-h"><h2>' + h + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</header>' + body + '</div></section>'; };

  /* ─── Vẽ trang ────────────────────────────────────────────────────────── */
  var saved = null, done = null, intro = true, swT;
  function render() {
    [].forEach.call(document.querySelectorAll('[data-t]'), function (el) { el.textContent = t(el.getAttribute('data-t')); });
    document.title = t('h1') + ' — ' + (en() ? 'Coach and fighter training from zero' : 'Đào tạo coach và võ sĩ từ con số 0') + ' | Dapper Combat';
    document.body.setAttribute('data-path', path);
    var facts = [[12, 'f.months'], [5, 'f.sess'], [2, 'f.shifts'], [moneyShort(PRICE), 'f.fee']];
    root.innerHTML =
      '<section class="tn-hero" id="top"><div class="tn-in tn-hero-in"><div class="tn-hero-t">' +
        '<p class="tn-special"><span>' + esc(t('special')) + '</span></p><h1>' + esc(t('h1')) + '</h1><p class="tn-lead">' + esc(t('lead')) + '</p>' +
        '<p class="tn-start"><b>' + esc(t('start', { d: startText() })) + '</b><span data-left>' + esc(leftText()) + '</span></p>' +
        '<ul class="tn-facts">' + facts.map(function (f) { return '<li><b>' + esc(String(f[0])) + '</b><span>' + esc(t(f[1])) + '</span></li>'; }).join('') + '</ul>' +
        '<div class="tn-cta"><a class="tn-btn" href="#dang-ky">' + esc(t('cta.apply')) + '</a><a class="tn-btn ghost" href="#hai-con-duong">' + esc(t('cta.paths')) + '</a></div></div>' +
        '<div class="tn-ring' + (intro ? ' intro' : '') + '" role="group" aria-label="' + esc(t('ring.label')) + '">' + ring() + cornerBtn('fighter') + cornerBtn('coach') + '<p class="tn-ring-hint">' + esc(t('ring.hint')) + '</p></div>' +
      '</div></section>' +
      '<div class="tn-bar"><div class="tn-in tn-bar-in"><span class="tn-bar-l">' + esc(t('bar.label')) + '</span><div class="tn-seg" role="group">' + ORDER.map(function (k) {
        return '<button type="button" class="' + k + (path === k ? ' on' : '') + '" data-path="' + k + '" aria-pressed="' + (path === k) + '"><i></i>' + esc(L(P[k].name)) + '</button>';
      }).join('') + '</div><span class="tn-bar-out">' + esc(L(P[path].out)) + '</span><a class="tn-btn sm" href="#dang-ky">' + esc(t('bar.apply')) + '</a></div></div>' +
      sec('hai-con-duong', esc(t('paths.h')), esc(t('paths.sub')), '<div class="tn-cards">' + ORDER.map(card).join('') + '</div>') +
      sec('so-sanh', esc(t('cmp.h')), esc(t('cmp.sub')), compare(), 'alt') +
      sec('lo-trinh', esc(t('road.h')), esc(t('road.sub')), road()) +
      sec('tuan-hoc', esc(t('week.h')), esc(t('week.sub')), week(), 'alt') +
      sec('ky-nang', esc(t('skills.h', { n: L(P[path].name) })), '', skills()) +
      sec('cam-ket', esc(t('promise.h')), '', promise(), 'alt') +
      sec('dang-ky', esc(t('form.h')), esc(t('form.sub')), '<div class="tn-apply"><aside class="tn-fee"><p class="tn-fee-k">' + esc(t('fee.h')) + '</p><p class="tn-fee-v">' + esc(money(PRICE)) + '</p><p class="tn-fee-per">' + esc(t('fee.per')) + '</p>' +
        '<ul><li>' + esc(t('fee.same')) + '</li><li>' + esc(t('v.time')) + ', ' + esc(t('v.sched')) + '</li><li>' + esc(t('start', { d: startText(true) })) + ' (' + esc(leftText()) + ')</li><li>' + esc(t('fee.how')) + '</li></ul></aside>' +
        '<div class="tn-form-box">' + (done ? okHtml(done) : form()) + '</div></div>') +
      sec('hoi-dap', esc(t('faq.h')), '', faq(), 'alt');
    intro = false;
    restore();
  }
  function okHtml(r) {
    return '<div class="tn-ok" role="status"><span class="tn-ok-ic" aria-hidden="true"></span><h3>' + esc(t('ok.h')) + '</h3><p>' + esc(t('ok.p', { c: r.code, ph: r.phone, n: L(P[r.path].name) })) + '</p><button type="button" class="tn-btn ghost" data-again>' + esc(t('ok.again')) + '</button></div>';
  }
  // giữ chữ đã gõ trong form khi đổi ngôn ngữ / con đường
  function keep() {
    var f = root.querySelector('.tn-form');
    saved = f ? [].reduce.call(f.elements, function (o, el) { if (el.name && el.type !== 'radio') o[el.name] = el.value; return o; }, {}) : saved;
  }
  function restore() {
    var f = root.querySelector('.tn-form'); if (!f || !saved) return;
    Object.keys(saved).forEach(function (k) { if (f.elements[k]) f.elements[k].value = saved[k]; });
  }
  // đổi con đường: vẽ lại các phần theo con đường, giữ vị trí cuộn
  function choose(k, go) {
    if (!P[k]) return;
    keep(); path = k;
    try { history.replaceState(null, '', '#' + P[k].hash); } catch (e) { /* khung xem không cho đổi địa chỉ */ }
    var y = window.scrollY; render(); window.scrollTo(0, y);
    root.classList.add('sw'); clearTimeout(swT); swT = setTimeout(function () { root.classList.remove('sw'); }, 700);
    if (go) { var s = document.getElementById(go); if (s) s.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
  }

  /* ─── Sự kiện ─────────────────────────────────────────────────────────── */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-path]');
    if (b && b.tagName === 'BUTTON') { choose(b.getAttribute('data-path'), b.getAttribute('data-go')); return; }
    if (e.target.closest('[data-again]')) { done = null; saved = null; render(); var n = root.querySelector('.tn-form [name=name]'); if (n) n.focus(); }
  });
  root.addEventListener('change', function (e) { if (e.target.name === 'path' && e.target.checked) choose(e.target.value); });
  root.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, el = f.elements, err = f.querySelector('.tn-err'), btn = f.querySelector('[type=submit]');
    var fail = function (m, name) { err.textContent = m; err.hidden = false; if (name && el[name]) el[name].focus(); };
    var name = el.name.value.trim(), phone = el.phone.value.trim(), year = el.year.value.trim(), k = (f.querySelector('[name=path]:checked') || {}).value || path;
    if (name.length < 2) return fail(t('err.name'), 'name');
    if (!/^[0-9 +().-]{8,20}$/.test(phone) || phone.replace(/\D/g, '').length < 9) return fail(t('err.phone'), 'phone');
    var yr = +year, now = new Date().getFullYear();
    if (year && !(yr >= now - 70 && yr <= now - 10)) return fail(t('err.year'), 'year');
    err.hidden = true; btn.disabled = true; btn.textContent = t('form.sending');
    var exp = T.vi['exp.' + el.exp.value] || '';
    DC.api('/registrations', {
      name: name, phone: phone, email: el.email.value.trim(), program: k, programName: 'Truyền Nghề · ' + P[k].name.vi,
      detail: 'Khai giảng ' + startText() + (year ? ' · sinh năm ' + year : '') + ' · kinh nghiệm: ' + exp, note: el.note.value.trim(), lang: en() ? 'en' : 'vi',
    }).then(function (r) {
      done = { code: r.code, phone: phone, path: k }; saved = null; path = k; render();
      var box = root.querySelector('.tn-form-box'); if (box) box.scrollIntoView({ block: 'center' });
    }, function (x) { btn.disabled = false; btn.textContent = t('form.send'); fail(x.message); });
  });
  // mục menu trang chính đang tắt ở /admin → Thiết lập → Thương hiệu & menu
  [].forEach.call(document.querySelectorAll('[data-tn-site] [data-nav]'), function (li) { if (DC.navOn && !DC.navOn(li.getAttribute('data-nav'))) li.style.display = 'none'; });
  // điện thoại: menu cuộn ngang → kéo mục "Truyền Nghề" vào tầm nhìn
  var site = document.querySelector('[data-tn-site]'), cur = site && site.querySelector('a.on');
  if (cur && site.scrollWidth > site.clientWidth) site.scrollLeft = cur.getBoundingClientRect().left - site.getBoundingClientRect().left - 16;
  document.querySelector('.tn-lang').addEventListener('click', function (e) {
    var b = e.target.closest('[data-lang]');
    if (!b) return;
    keep();
    document.documentElement.lang = b.getAttribute('data-lang');
    [].forEach.call(this.querySelectorAll('[data-lang]'), function (x) { x.classList.toggle('on', x === b); });
    render();
  });
  window.addEventListener('hashchange', function () { var k = location.hash === '#vo-si' ? 'fighter' : location.hash === '#coach' ? 'coach' : ''; if (k && k !== path) choose(k); });
  render();
})();
