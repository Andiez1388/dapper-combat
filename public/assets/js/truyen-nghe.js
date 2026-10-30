/* Dapper Combat — Truyền Nghề (/truyen-nghe): đào tạo coach / võ sĩ từ con số 0, khóa 1 năm. Trang bán khóa học.
   Hai con đường như hai góc đài: góc xanh = Coach (bao việc làm tại HVP Academy), góc đỏ = Võ sĩ (bao thi đấu dưới tên The Corner).
   Cùng khối lượng (12 tháng, 5 buổi / tuần, 2 ca / ngày), khác nội dung giảng dạy và mục tiêu.
   Thứ tự trang theo đường đi của người mua: đầu trang chọn góc + đếm ngược → trắc nghiệm "hợp góc nào" → lộ trình / tuần học / kỹ năng
   → học phí chia nhỏ → ghi danh (giấy nhập môn hiện tên người đăng ký, đóng dấu khi gửi xong, có thể đặt cọc / trả ngay) → hỏi đáp + Zalo.
   Học phí, ngày khai giảng, tiền cọc, số chỗ: /admin → Thiết lập → Học phí & lịch tập → Truyền Nghề.
   Đăng ký gửi về /admin → Đăng ký khóa học (chương trình coach / fighter). Mở thẳng một con đường: /truyen-nghe#coach hoặc #vo-si. */
(function () {
  'use strict';
  var root = document.getElementById('tn');
  if (!root || !window.DC) return;
  var esc = DC.esc;
  var en = function () { return DC.lang() === 'en'; };
  var L = function (o) { return o ? (en() ? o.en || o.vi : o.vi) || '' : ''; };
  var p = function (vi, e) { return { vi: vi, en: e }; };
  /* nội dung sửa ở /admin → Nội dung website → Truyền Nghề: chữ t('…') = khóa "career.<khóa>", chữ trong dữ liệu p(vi, en) = khóa theo vị trí
     "career.data.<khối>.<…>" (vd career.data.path.coach.rounds.0.t). Danh mục /admin dựng bằng tools/cms-js-pages.js (đọc ?cmsdump). */
  var SEEN = [];
  var cmsWalk = function (o, k) {
    if (!o || typeof o !== 'object') return o;
    if (typeof o.vi === 'string' && Object.keys(o).length === 2 && 'en' in o) { SEEN.push([k, o.vi, o.en]); return { vi: DC.x(k, 0, o.vi), en: DC.x(k, 1, o.en) }; }
    Object.keys(o).forEach(function (x) { o[x] = cmsWalk(o[x], k + '.' + x); });
    return o;
  };
  var START = String(DC.setting('course.careerStart', '2027-02-20') || '2027-02-20');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(START)) START = '2027-02-20';
  // học phí mỗi khóa (Coach, Võ sĩ khác giá)
  var PRICES = { coach: Number(DC.setting('course.careerPriceCoach', 85000000)) || 85000000, fighter: Number(DC.setting('course.careerPriceFighter', 65000000)) || 65000000 };
  var priceOf = function (k) { return PRICES[k] || PRICES.coach; };
  var PRICE_MIN = Math.min(PRICES.coach, PRICES.fighter);
  // độ tuổi tuyển, tính theo năm khai giảng
  var age = function (k, d) { return Number(DC.setting('course.' + k, d)) || d; };
  var AGES = { coach: [age('careerAgeCoachMin', 18), age('careerAgeCoachMax', 35)], fighter: [age('careerAgeFighterMin', 18), age('careerAgeFighterMax', 26)] };
  var DEPOSIT = Math.min(Number(DC.setting('course.careerDeposit', 2000000)) || 0, PRICE_MIN);
  var SEATS = Number(DC.setting('course.careerSeats', 0)) || 0;
  var SESS = 52 * 10;   // ≈ số ca cả khóa: 52 tuần × 5 buổi × 2 ca
  var YEAR = START.slice(0, 4);
  var COHORT = String(DC.setting('course.careerCohort', 'K01') || '').trim() || 'K01';   // tên khóa: K01, K02…
  var media = function (k, def) { return DC.m ? DC.m(k, def) : def; };
  var IMG = { coach: media('career.hero.coach', '/assets/media/bc3dad0ad714.jpg'), fighter: media('career.hero.fighter', '/assets/media/bd656e3427a9.jpg') };
  var PLAN_IMG = { coach: media('career.plan.coach', IMG.coach), fighter: media('career.plan.fighter', IMG.fighter) };   // ảnh đầu thẻ học phí
  var HELP_IMG = media('career.help.img', IMG.coach);                                                                    // ảnh khung "Còn băn khoăn?"
  // cách trả tiền đang mở trên web (/admin → Thanh toán, Thanh toán online)
  var PO = DC.payOnline ? DC.payOnline() : {};
  var BANK = DC.pay ? DC.pay() : null;
  var CAN_PAY = !!(BANK || PO.vnpay || PO.installment);
  var ISP = !!(PO.installment && PRICE_MIN >= (PO.installmentMin || 0));
  var DEP_ON = !!(DEPOSIT && CAN_PAY);   // có tiền cọc + có cách nhận tiền → mời đặt cọc giữ chỗ
  var C = (window.__CMS && window.__CMS.c) || {};
  var PHONE = C.phone ? String(C.phone) : '';                                   // số mẫu "0909 xxx xxx" vẫn hiện để thấy chỗ
  var DIAL = PHONE && !/x/i.test(PHONE) ? PHONE.replace(/[^\d+]/g, '') : '';   // chỉ bấm gọi được khi là số thật

  var T = {
    vi: {
      'site.home': 'Trang chủ', 'site.shop': 'Cửa hàng', 'site.course': 'Khóa học', 'site.services': 'Dịch vụ Setup', 'site.ranking': 'Academy Ranking', 'site.career': 'Truyền Nghề',
      'foot.h1': 'Khóa truyền nghề boxing {k}, độc quyền tại Dapper Combat.', 'foot.h2': 'Không dạy cho biết, truyền nghề để hiểu, làm, sống, cống hiến và để lại di sản.',
      'foot.note': 'Truyền Nghề là chương trình đào tạo nghề boxing chuyên sâu do Dapper Combat xây dựng và trực tiếp giảng dạy: 12 tháng, 520 ca, 4 lần sát hạch, bắt đầu từ con số 0. Đầu ra cam kết bằng hợp đồng: 100% cơ hội làm việc tại HVP Academy cho khóa Coach, 100% thi đấu dưới màu cờ The Corner cho khóa Võ sĩ, và hoàn 100% học phí nếu bạn đạt chuẩn mà không có đầu ra.', 'foot.home': 'Về trang chủ Dapper Combat',
      'title': 'Truyền Nghề — Học boxing thành nghề trong 1 năm | Dapper Combat',
      'h1': 'Truyền Nghề', 'special': 'Khóa truyền nghề boxing', 'claim': 'Một năm. Từ con số 0 thành nghề boxing.',
      'side.coach': 'Góc xanh · Coach', 'side.fighter': 'Góc đỏ · Võ sĩ', 'bao.coach': 'Bao việc làm', 'bao.fighter': 'Bao thi đấu',
      'baosub.coach': '100% cơ hội làm việc tại HVP Academy, hoặc tự do chọn phòng tập khác', 'baosub.fighter': '100% thi đấu dưới màu cờ The Corner',
      'badge.coach': 'Hoàn 100% học phí nếu đạt chuẩn mà không có việc', 'badge.fighter': 'Hoàn 100% học phí nếu đạt chuẩn mà không được thi đấu', 'guar.link': 'Hoàn 100% học phí nếu đạt chuẩn mà không có đầu ra',
      'promise.h': 'Bạn đạt chuẩn, chúng tôi cam kết bằng hợp đồng', 'promise.sub': 'Có nghề trong tay, hoặc nhận lại 100% học phí. Mọi cam kết được ghi trong hợp đồng: đạt tiêu chuẩn mà không có việc làm (Coach) hay không được thi đấu (Võ sĩ), Dapper Combat hoàn lại toàn bộ học phí.',
      'pr.paper': 'GIẤY CAM KẾT', 'pr.k.coach': 'Khóa Coach · Góc xanh', 'pr.k.fighter': 'Khóa Võ sĩ · Góc đỏ',
      'pr.big.coach': 'cơ hội làm việc tại HVP Academy', 'pr.big.fighter': 'thi đấu dưới màu cờ The Corner',
      'pr.free.coach': 'Hoặc tự do tìm việc ở các phòng tập khác, tùy bạn chọn.', 'pr.free.fighter': 'Học xong, bạn ở lại tập luyện và được dẫn đi thi đấu.',
      'pr.refund': 'Hoàn 100% học phí', 'pr.if.coach': 'nếu bạn đạt tiêu chuẩn nhưng HVP Academy không sắp xếp được công việc và bạn không tìm được việc ở nơi khác.',
      'pr.if.fighter': 'nếu bạn đạt tiêu chuẩn thi đấu nhưng không được thi đấu dưới màu cờ The Corner.',
      'seal.ring': 'CAM KẾT · HOÀN HỌC PHÍ · TRUYỀN NGHỀ · ', 'seal.mid': 'HOÀN PHÍ',
      'refund.short.coach': 'Đạt chuẩn mà không có việc: hoàn 100% học phí', 'refund.short.fighter': 'Đạt chuẩn mà không được thi đấu: hoàn 100% học phí',
      'cmp.refund': 'Hoàn học phí', 'cmp.r.coach': '100% nếu đạt chuẩn mà không có việc', 'cmp.r.fighter': '100% nếu đạt chuẩn mà không được thi đấu',
      'cert.guar': 'Cam kết bằng hợp đồng', 'form.guar': 'Cam kết bằng hợp đồng', 'form.trial': 'Chưa qua bài test thì học lại tới khi thuần thục, không mất thêm học phí. Tháng học đầu tiên, nếu bạn không phù hợp với chúng tôi: hoàn 100% học phí đã đóng. Tự dừng: không hoàn học phí.',
      'pick.coach': 'Tôi muốn đứng lớp', 'pick.fighter': 'Tôi muốn lên sàn',
      'start': 'Khai giảng {d}', 'clock.d': 'ngày', 'clock.h': 'giờ', 'clock.m': 'phút', 'clock.s': 'giây', 'clock.done': 'Khóa {k} đã khai giảng',
      'fee.from': 'Học phí trọn khóa từ', 'fee.both': 'Võ sĩ {f} · Coach {c}', 'seats': 'Mỗi khóa nhận tối đa {n} học viên',
      'cta.apply': 'Giữ chỗ khóa {k}', 'cta.quiz': 'Bạn hợp góc nào?',
      'quiz.h': 'Bạn hợp góc nào?', 'quiz.sub': '12 câu về tính cách, năng lượng, sở thích và mục tiêu, khoảng 2 phút. Không có đáp án đúng hay sai: chọn điều gần với bạn nhất, kết quả sẽ cho bạn thấy mình nghiêng về góc nào và vì sao.',
      'quiz.n': 'Câu {i} / {n}', 'quiz.back': 'Câu trước', 'quiz.res': 'Kết quả của bạn', 'quiz.again': 'Làm lại',
      'quiz.r.coach': 'Bạn thuộc góc xanh: Coach', 'quiz.r.fighter': 'Bạn thuộc góc đỏ: Võ sĩ', 'quiz.r.tie': 'Bạn hợp cả hai góc',
      'quiz.rs.coach': 'Bạn thích làm người khác giỏi lên. Học xong 1 năm, bạn có 100% cơ hội làm việc tại HVP Academy.',
      'quiz.rs.fighter': 'Bạn muốn tự mình lên sàn. Học xong 1 năm, bạn 100% thi đấu dưới màu cờ The Corner.',
      'quiz.rs.tie': 'Chọn theo đích đến bạn muốn sau 12 tháng: đứng lớp hay lên sàn.',
      'quiz.lean.coach': 'Nghiêng về Coach', 'quiz.lean.fighter': 'Nghiêng về Võ sĩ', 'quiz.lean.both': 'Cân bằng hai góc', 'quiz.age': 'Khóa {n} nhận học viên {a}.',
      'quiz.see': 'Xem lộ trình {n}', 'quiz.go': 'Giữ chỗ khóa {n}',
      'bar.label': 'Con đường', 'bar.apply': 'Giữ chỗ',
      'road.h': '12 tháng, 4 hiệp, 12 kỹ năng nghề', 'road.sub': 'Mỗi hiệp 3 tháng mở khóa một nhóm kỹ năng và một danh hiệu mới, xác nhận bằng một lần sát hạch. Chưa qua thì học lại tới khi thuần thục, không mất thêm học phí. Hết hiệp 4, bạn mang cả 12 kỹ năng vào nghề.',
      'road.unlock': 'Kỹ năng mở khóa', 'road.pass': 'Qua mốc: {m}', 'road.carry': 'Bạn mang theo {n} kỹ năng đã mở khóa qua 4 hiệp',
      'road.round': 'Hiệp {n}', 'road.mile': 'Mốc kết thúc hiệp', 'road.bell': 'Sau 12 tháng',
      'week.h': 'Một tuần học mẫu', 'week.sub': 'Thứ 2 đến Thứ 6, mỗi ngày 2 ca, mỗi ca 2–3 tiếng. Khung lịch giống nhau ở cả 2 khóa, chỉ nội dung từng ca là khác.',
      'week.s1': 'Ca 1', 'week.s1d': 'buổi sáng', 'week.s2': 'Ca 2', 'week.s2d': 'buổi chiều', 'week.len': '2–3 tiếng', 'week.note': '10 ca mỗi tuần, mỗi ca 2–3 tiếng: 20–30 giờ tập mỗi tuần, hơn 1.000 giờ trong 12 tháng. Đổi con đường ở thanh phía trên để thấy nội dung từng ca thay đổi.',
      'd1': 'Thứ 2', 'd2': 'Thứ 3', 'd3': 'Thứ 4', 'd4': 'Thứ 5', 'd5': 'Thứ 6',
      'tag.tech': 'Kỹ thuật', 'tag.fit': 'Thể lực', 'tag.theory': 'Lý thuyết', 'tag.teach': 'Thực hành dạy', 'tag.spar': 'Sparring', 'tag.tactic': 'Chiến thuật',
      'skills.h': 'Bộ kỹ năng {n}', 'skills.both': 'Hai bộ kỹ năng, hai nghề', 'skills.sub': 'Mỗi khóa luyện một bộ kỹ năng riêng cho đúng đích đến của nó.',
      'pain.h': 'Muốn đi đường dài, muốn sống cùng với boxing, vướng ở đâu?', 'pain.sub': 'Nếu từng nghĩ tới chuyện sống bằng boxing, chắc bạn đã gặp ít nhất một điều dưới đây. Đây là cái giá của việc tự đi một mình, và cách Truyền Nghề gỡ từng cái.',
      'pain.who.coach': 'Bạn muốn làm coach', 'pain.who.fighter': 'Bạn muốn làm võ sĩ', 'pain.fix': 'Truyền Nghề giải quyết', 'pain.cost': 'Cái giá phải trả', 'pain.col.q': 'Nỗi lo khi tự đi một mình', 'pain.col.a': 'Truyền Nghề giải quyết',
      'cmp.h': 'Cùng khối lượng, khác đích đến', 'cmp.sub': 'Hai khóa cùng số tháng, cùng số buổi, cùng số ca. Khác nhau ở nội dung, mục tiêu, học phí và đầu ra.',
      'cmp.same': 'Giống nhau', 'cmp.diff': 'Khác nhau',
      'cmp.time': 'Thời gian', 'cmp.sched': 'Lịch học', 'cmp.fee': 'Học phí (đã gồm VAT)', 'cmp.content': 'Nội dung chính', 'cmp.goal': 'Mục tiêu', 'cmp.out': 'Học xong',
      'v.time': '12 tháng', 'v.sched': '5 buổi mỗi tuần, 2 ca mỗi ngày, mỗi ca 2–3 tiếng',
      'fee.h': 'Bạn nhận về một nghề', 'fee.sub': 'Hai khóa, hai mức học phí. Mỗi khóa là một nghề trọn vẹn trong 12 tháng, kèm cam kết đầu ra.',
      'w.get': 'Bạn nhận về', 'w.pay': 'Học phí trọn khóa, đã gồm VAT', 'plan.go': 'Giữ chỗ khóa {n}', 'plan.go.dep': 'Đặt cọc {d}, giữ chỗ khóa {n}',
      'trial.h': 'Học tới khi thuần thục', 'trial.p': 'Suốt khóa có các bài test và cuộc thi. Hoàn thành thì lên lớp, chưa hoàn thành thì học lại. Dapper Combat không đuổi học bạn.',
      'trial.re.k': 'Chưa qua bài test, cuộc thi', 'trial.re.b': 'Học lại', 'trial.re.s': 'tới khi thuần thục, không mất thêm học phí. Chỉ là thời gian hoàn tất sẽ lâu hơn.',
      'trial.us.k': 'Tháng học đầu tiên, nếu bạn không phù hợp với chúng tôi', 'trial.us.b': 'Hoàn 100%', 'trial.us.s': 'học phí đã đóng, và bạn kết thúc việc học.',
      'trial.you.k': 'Bạn tự dừng, vì bất kỳ lý do gì', 'trial.you.b': 'Không hoàn', 'trial.you.s': 'học phí đã đóng.',
      'faq.g1': 'Trước khi vào học', 'faq.g2': 'Lịch học và học phí', 'faq.g3': 'Đầu ra và cam kết',
      'help.visit': 'Ghé xem phòng tập', 'help.hours': 'Mở cửa {o} – {c}', 'help.map': 'Chỉ đường',
      'w.sess.coach': 'ca học nghề dạy trong 12 tháng', 'w.sess.fighter': 'ca luyện thi đấu trong 12 tháng', 'w.sess.d': '52 tuần, 5 buổi mỗi tuần, 2 ca mỗi ngày, mỗi ca 2–3 tiếng',
      'w.rounds.coach': 'danh hiệu trên đường tới Coach đứng lớp', 'w.rounds.fighter': 'danh hiệu trên đường tới võ sĩ The Corner', 'w.skills.coach': 'kỹ năng nghề coach', 'w.skills.fighter': 'kỹ năng thi đấu',
      'w.job.coach': 'nghề để sống: đứng lớp dạy boxing', 'w.job.coach.d': 'Học như một võ sĩ, trợ giảng lớp thật, rồi tự đứng lớp.',
      'w.job.fighter': 'đội để thi đấu: The Corner', 'w.job.fighter.d': 'Sparring có chấm điểm, fight night nội bộ, rồi trận ra mắt.',
      'w.refund': 'học phí hoàn lại',
      'dep.only': 'Giữ chỗ hôm nay chỉ', 'dep.fee': 'Học phí trọn khóa, đã gồm VAT: Võ sĩ {f}, Coach {c}', 'dep.how': 'cho khóa nào cũng vậy. Đặt cọc, quét mã QR trả ngay khi ghi danh.',
      'cta.dep': 'Đặt cọc {d} giữ chỗ', 'dock.dep': 'Giữ chỗ chỉ {d}',
      'fee.whole': 'trọn khóa 12 tháng', 'fee.mo': 'mỗi tháng', 'fee.wk': 'mỗi tuần · 10 ca', 'fee.ca': 'mỗi ca tập', 'fee.ca.n': '≈ {n} ca cả khóa',
      'pay.dep': 'Đặt cọc {d} để giữ chỗ', 'pay.bank': 'Chuyển khoản, quét mã QR', 'pay.card': 'Thẻ ngân hàng, Visa / Mastercard (VNPay)', 'pay.isp': 'Trả góp qua thẻ tín dụng',
      'pay.ask': 'Hình thức đóng học phí được tư vấn khi bạn đăng ký.', 'pay.free': 'Đăng ký tư vấn không mất phí',
      'form.h': 'Ghi danh khóa truyền nghề boxing {k}', 'form.sub': 'Điền thông tin, giấy nhập môn của bạn hiện ngay bên cạnh. Dapper Combat gọi lại để tư vấn và giữ chỗ cho bạn.',
      'form.path': 'Bạn chọn góc nào?', 'form.name': 'Họ và tên', 'form.phone': 'Số điện thoại', 'form.email': 'Email (không bắt buộc)', 'form.year': 'Năm sinh',
      'form.exp': 'Kinh nghiệm boxing', 'exp.0': 'Chưa tập bao giờ', 'exp.1': 'Dưới 1 năm', 'exp.2': 'Từ 1 năm trở lên', 'form.note': 'Bạn muốn hỏi thêm gì? (không bắt buộc)',
      'form.pay': 'Bạn muốn', 'opt.consult': 'Tư vấn trước, chưa đóng tiền', 'opt.consult.s': 'Dapper Combat gọi lại, bạn quyết định sau',
      'opt.deposit': 'Đặt cọc {d} giữ chỗ ngay', 'opt.deposit.s': 'Quét mã QR trả ngay sau khi gửi', 'opt.full': 'Đóng đủ {p}', 'opt.full.s': 'Quét mã QR hoặc trả bằng thẻ sau khi gửi', 'opt.full.isp': 'Có thể trả góp qua thẻ tín dụng',
      'send.consult': 'Gửi đăng ký giữ chỗ', 'send.deposit': 'Ghi danh và đặt cọc', 'send.full': 'Ghi danh và thanh toán', 'form.sending': 'Đang gửi…',
      'payname.consult': 'Tư vấn trước', 'payname.deposit': 'Đặt cọc giữ chỗ', 'payname.full': 'Đóng đủ học phí',
      'ok.h': 'Đã ghi danh', 'ok.p': 'Mã đăng ký của bạn: {c}. Dapper Combat sẽ gọi lại số {ph} để tư vấn khóa {n}.',
      'ok.pay': 'Còn một bước: {what} {d} để giữ chỗ. Nội dung chuyển khoản: {note}.', 'ok.what.deposit': 'đặt cọc', 'ok.what.full': 'thanh toán',
      'ok.again': 'Ghi danh cho người khác',
      'err.name': 'Nhập họ và tên', 'err.phone': 'Số điện thoại chưa đúng', 'err.year': 'Năm sinh chưa đúng',
      'err.year.req': 'Nhập năm sinh để kiểm tra độ tuổi tuyển', 'err.age': 'Khóa {n} nhận học viên từ {a} đến {b} tuổi (tính theo năm khai giảng {y}).', 'err.age.alt': 'Bạn vừa tuổi khóa {n} ({a}–{b} tuổi).',
      'age': '{a}–{b} tuổi', 'cmp.age': 'Độ tuổi tuyển',
      'q9': 'Bao nhiêu tuổi thì đăng ký được?', 'a9': 'Khóa Coach nhận học viên từ {ca} đến {cb} tuổi, khóa Võ sĩ từ {fa} đến {fb} tuổi, tính theo năm khai giảng {y}.',
      'cert.label': 'Bản xem trước giấy nhập môn', 'cert.title': 'Giấy nhập môn', 'cert.kick': '★ Truyền Nghề · Khóa {k} ★', 'cert.sub': 'Khai giảng {d}', 'cert.no': 'Số',
      'cert.student': 'Học viên', 'cert.ph': 'Tên của bạn', 'cert.path': 'Con đường', 'cert.out': 'Đầu ra', 'cert.time': 'Thời gian', 'cert.time.v': '12 tháng · 10 ca mỗi tuần',
      'cert.born': 'Năm sinh', 'cert.date': 'Ngày ghi danh', 'cert.wait': 'CHỜ GHI DANH', 'cert.done1': 'ĐÃ', 'cert.done2': 'GHI DANH', 'cert.ring': 'TRUYỀN NGHỀ · KHÓA {k} · DAPPER COMBAT · ',
      'faq.h': 'Câu hỏi thường gặp', 'help.h': 'Còn băn khoăn?', 'help.p': 'Nhắn Zalo hoặc gọi hotline, Dapper Combat trả lời bạn về lịch học, học phí và đầu ra trước khi bạn quyết định.', 'help.p0': 'Nhắn Zalo, Dapper Combat trả lời bạn về lịch học, học phí và đầu ra trước khi bạn quyết định.',
      'help.zalo': 'Nhắn Zalo', 'help.call': 'Gọi hotline', 'help.hot': 'Hotline',
      'dock.t': 'Khóa {k} · từ {p}', 'dock.left': 'còn {n} ngày tới khai giảng',
      'q1': 'Chưa từng tập boxing có học được không?', 'a1': 'Được. Cả 2 khóa đều bắt đầu từ con số 0. Hiệp đầu tiên (3 tháng đầu) dành cho nền tảng: tư thế, bộ pháp, đòn cơ bản và thể lực.',
      'q2': 'Hai khóa khác nhau ở đâu?', 'a2': 'Cùng khối lượng: 12 tháng, 5 buổi mỗi tuần, 2 ca mỗi ngày, mỗi ca 2–3 tiếng. Khác nội dung và mục tiêu: Coach học phương pháp dạy, có 100% cơ hội làm việc tại HVP Academy; Võ sĩ học kỹ thuật, chiến thuật thi đấu và 100% thi đấu dưới màu cờ The Corner.',
      'q3': 'Lịch học cụ thể thế nào?', 'a3': 'Học từ Thứ 2 đến Thứ 6, mỗi ngày 2 ca (sáng và chiều), mỗi ca 2–3 tiếng, liên tục 12 tháng kể từ ngày khai giảng {d}.',
      'q4': 'Học phí bao nhiêu, đóng thế nào?', 'a4': 'Khóa Võ sĩ {f}, khóa Coach {c}, cho cả khóa 1 năm, đã gồm VAT. {how}',
      'q5': 'Học xong thì sao?', 'a5': 'Coach có 100% cơ hội làm việc tại HVP Academy, hoặc tự do tìm việc ở các phòng tập khác. Võ sĩ ở lại tập luyện và 100% được thi đấu dưới màu cờ The Corner.',
      'q7': 'Nếu học xong mà không có việc, hoặc không được thi đấu?', 'a7': 'Bạn được hoàn 100% học phí khi đã đạt tiêu chuẩn mà: với khóa Coach, HVP Academy không sắp xếp được công việc và bạn không tìm được việc ở nơi khác; với khóa Võ sĩ, bạn không được thi đấu dưới màu cờ The Corner.',
      'q8': 'Học Coach xong có bắt buộc làm tại HVP Academy không?', 'a8': 'Không. Bạn có 100% cơ hội làm việc tại HVP Academy, hoặc tự do tìm việc ở các phòng tập khác.',
      'q10': 'Không qua bài test thì sao?', 'a10': 'Suốt khóa có các bài test và cuộc thi. Hoàn thành thì bạn được lên lớp; chưa hoàn thành thì học lại tới khi thuần thục, không mất thêm học phí. Dapper Combat không đuổi học bạn, chỉ là thời gian hoàn tất sẽ lâu hơn.',
      'q11': 'Dừng giữa chừng có được hoàn học phí không?', 'a11': 'Trong tháng học đầu tiên, nếu bạn không phù hợp với chúng tôi, Dapper Combat hoàn 100% học phí đã đóng và bạn kết thúc việc học. Nếu bạn tự dừng, vì bất kỳ lý do gì, học phí không hoàn lại. Cam kết đầu ra trong hợp đồng vẫn giữ nguyên.',
      'q6': 'Giữ chỗ có mất phí không?', 'a6.free': 'Không. Đăng ký tư vấn trước không mất phí, Dapper Combat gọi lại trước khi bạn đóng học phí.',
      'a6.dep': 'Bạn chọn được: đăng ký tư vấn trước không mất phí, hoặc đặt cọc {d} để giữ chỗ ngay.',
      'how.dep': 'Có thể đặt cọc {d} để giữ chỗ.', 'how.list': 'Đóng bằng: {l}.',
    },
    en: {
      'site.home': 'Home', 'site.shop': 'Shop', 'site.course': 'Courses', 'site.services': 'Gym Setup', 'site.ranking': 'Academy Ranking', 'site.career': 'Pro Pathways',
      'foot.h1': 'Boxing career course {k}, only at Dapper Combat.', 'foot.h2': 'Not a class to try. A trade to understand, practise, live, give back and leave as a legacy.',
      'foot.note': 'Pro Pathways is an in-depth boxing career program built and taught by Dapper Combat: 12 months, 520 sessions, 4 assessments, starting from zero. The outcomes are guaranteed by contract: a 100% job opportunity at HVP Academy on the Coach course, 100% fighting in The Corner colours on the Fighter course, and a 100% refund if you meet the standard without that outcome.', 'foot.home': 'Back to Dapper Combat',
      'title': 'Pro Pathways — A boxing career in one year | Dapper Combat',
      'h1': 'Pro Pathways', 'special': 'Boxing career course', 'claim': 'One year. From zero to a boxing career.',
      'side.coach': 'Blue corner · Coach', 'side.fighter': 'Red corner · Fighter', 'bao.coach': 'Job guaranteed', 'bao.fighter': 'Fights guaranteed',
      'baosub.coach': 'A 100% job opportunity at HVP Academy, or free to pick another gym', 'baosub.fighter': '100% fighting in The Corner colours',
      'badge.coach': '100% refund if you meet the standard but get no job', 'badge.fighter': '100% refund if you meet the standard but get no fight', 'guar.link': '100% refund if you meet the standard and miss the outcome',
      'promise.h': 'You meet the standard. We put it in your contract.', 'promise.sub': 'Walk away with a trade, or get 100% of your fee back. It is all in the contract: meet the standard but get no job (Coach) or no fight (Fighter), and Dapper Combat refunds the full fee.',
      'pr.paper': 'COMMITMENT', 'pr.k.coach': 'Coach course · Blue corner', 'pr.k.fighter': 'Fighter course · Red corner',
      'pr.big.coach': 'job opportunity at HVP Academy', 'pr.big.fighter': 'fighting in The Corner colours',
      'pr.free.coach': 'Or find work at any other gym, your choice.', 'pr.free.fighter': 'When you finish you stay on to train and are taken to compete.',
      'pr.refund': '100% fee refund', 'pr.if.coach': 'if you meet the standard but HVP Academy cannot place you and you cannot find work elsewhere.',
      'pr.if.fighter': 'if you meet the competition standard but do not get to fight in The Corner colours.',
      'seal.ring': 'GUARANTEE · FEE REFUND · PRO PATHWAYS · ', 'seal.mid': 'REFUND',
      'refund.short.coach': 'Meet the standard, no job: 100% refund', 'refund.short.fighter': 'Meet the standard, no fight: 100% refund',
      'cmp.refund': 'Fee refund', 'cmp.r.coach': '100% if you meet the standard but get no job', 'cmp.r.fighter': '100% if you meet the standard but get no fight',
      'cert.guar': 'Guaranteed by contract', 'form.guar': 'Guaranteed by contract', 'form.trial': 'Fail a test and you repeat until you have it down, at no extra fee. In the first month, if you are not a fit for us: 100% of the fee you paid back. If you stop: no refund.',
      'pick.coach': 'I want to coach', 'pick.fighter': 'I want to fight',
      'start': 'Starts {d}', 'clock.d': 'days', 'clock.h': 'hrs', 'clock.m': 'min', 'clock.s': 'sec', 'clock.done': '{k} has started',
      'fee.from': 'Full course from', 'fee.both': 'Fighter {f} · Coach {c}', 'seats': 'Each course takes at most {n} students',
      'cta.apply': 'Reserve a place in {k}', 'cta.quiz': 'Which corner fits you?',
      'quiz.h': 'Which corner fits you?', 'quiz.sub': '12 questions on personality, energy, interests and goals, about 2 minutes. No right or wrong answers: pick what is closest to you, and the result shows which corner you lean towards and why.',
      'quiz.n': 'Question {i} / {n}', 'quiz.back': 'Previous', 'quiz.res': 'Your result', 'quiz.again': 'Start over',
      'quiz.r.coach': 'You belong in the blue corner: Coach', 'quiz.r.fighter': 'You belong in the red corner: Fighter', 'quiz.r.tie': 'Both corners fit you',
      'quiz.rs.coach': 'You like making other people better. Finish the year with a 100% job opportunity at HVP Academy.',
      'quiz.rs.fighter': 'You want to step into the ring yourself. Finish the year and you are 100% fighting in The Corner colours.',
      'quiz.rs.tie': 'Pick by where you want to be in 12 months: in front of a class, or in the ring.',
      'quiz.lean.coach': 'Leans Coach', 'quiz.lean.fighter': 'Leans Fighter', 'quiz.lean.both': 'Balanced', 'quiz.age': 'The {n} course: {a}.',
      'quiz.see': 'See the {n} path', 'quiz.go': 'Reserve a {n} place',
      'bar.label': 'Path', 'bar.apply': 'Reserve',
      'road.h': '12 months, 4 rounds, 12 professional skills', 'road.sub': 'Each 3-month round unlocks a set of skills and a new title, confirmed by a checkpoint. Miss it and you repeat until you have it down, at no extra fee. After round 4 you take all 12 skills into your career.',
      'road.unlock': 'Skills unlocked', 'road.pass': 'Checkpoint: {m}', 'road.carry': 'You leave with {n} skills unlocked across 4 rounds',
      'road.round': 'Round {n}', 'road.mile': 'End-of-round checkpoint', 'road.bell': 'After 12 months',
      'week.h': 'A sample week', 'week.sub': 'Monday to Friday, 2 shifts a day, 2–3 hours each. The timetable is the same for both courses; only what happens in each shift differs.',
      'week.s1': 'Shift 1', 'week.s1d': 'morning', 'week.s2': 'Shift 2', 'week.s2d': 'afternoon', 'week.len': '2–3 hours', 'week.note': '10 shifts a week, 2–3 hours each: 20–30 hours of training a week, over 1,000 hours in 12 months. Switch paths in the bar above to see each shift change.',
      'd1': 'Mon', 'd2': 'Tue', 'd3': 'Wed', 'd4': 'Thu', 'd5': 'Fri',
      'tag.tech': 'Technique', 'tag.fit': 'Conditioning', 'tag.theory': 'Theory', 'tag.teach': 'Teaching practice', 'tag.spar': 'Sparring', 'tag.tactic': 'Tactics',
      'skills.h': '{n} skill set', 'skills.both': 'Two skill sets, two trades', 'skills.sub': 'Each course trains its own skill set for its own destination.',
      'pain.h': 'Want to go the distance and build a life with boxing? Here is what gets in the way', 'pain.sub': 'If you have ever thought about living from boxing, you have probably hit at least one of these. This is what going it alone costs, and how Pro Pathways fixes each one.',
      'pain.who.coach': 'You want to coach', 'pain.who.fighter': 'You want to fight', 'pain.fix': 'How Pro Pathways fixes it', 'pain.cost': 'What it costs you', 'pain.col.q': 'The worry when you go it alone', 'pain.col.a': 'How Pro Pathways fixes it',
      'cmp.h': 'Same workload, different destination', 'cmp.sub': 'Both courses run the same months, sessions and shifts. They differ in content, goal, fee and outcome.',
      'cmp.same': 'Same', 'cmp.diff': 'Different',
      'cmp.time': 'Length', 'cmp.sched': 'Schedule', 'cmp.fee': 'Fee (VAT included)', 'cmp.content': 'Core content', 'cmp.goal': 'Goal', 'cmp.out': 'When you finish',
      'v.time': '12 months', 'v.sched': '5 sessions a week, 2 shifts a day, 2–3 hours each',
      'fee.h': 'You walk away with a trade', 'fee.sub': 'Two courses, two fees. Each is a complete trade in 12 months, backed by an outcome guarantee.',
      'w.get': 'What you get', 'w.pay': 'Full course fee, VAT included', 'plan.go': 'Reserve a {n} place', 'plan.go.dep': 'Pay {d}, hold my {n} place',
      'trial.h': 'Train until you have it down', 'trial.p': 'There are tests and competitions throughout the course. Pass and you move up; if not, you repeat. Dapper Combat does not send anyone away.',
      'trial.re.k': 'Did not pass a test or competition', 'trial.re.b': 'Repeat it', 'trial.re.s': 'until you have it down, at no extra fee. It just takes longer to finish.',
      'trial.us.k': 'In the first month, if you are not a fit for us', 'trial.us.b': '100% back', 'trial.us.s': 'of the fee you paid, and your course ends.',
      'trial.you.k': 'If you stop, for any reason', 'trial.you.b': 'No refund', 'trial.you.s': 'of the fee you paid.',
      'faq.g1': 'Before you join', 'faq.g2': 'Schedule and fees', 'faq.g3': 'Outcome and guarantee',
      'help.visit': 'Come and see the gym', 'help.hours': 'Open {o} – {c}', 'help.map': 'Directions',
      'w.sess.coach': 'sessions learning to coach, over 12 months', 'w.sess.fighter': 'sessions training to fight, over 12 months', 'w.sess.d': '52 weeks, 5 days a week, 2 shifts a day, 2–3 hours each',
      'w.rounds.coach': 'titles on the way to leading your own class', 'w.rounds.fighter': 'titles on the way to fighting for The Corner', 'w.skills.coach': 'coaching skills', 'w.skills.fighter': 'fight skills',
      'w.job.coach': 'trade to live from: teaching boxing', 'w.job.coach.d': 'Train like a fighter, assist real classes, then lead your own.',
      'w.job.fighter': 'team to fight for: The Corner', 'w.job.fighter.d': 'Scored sparring, in-house fight nights, then your debut.',
      'w.refund': 'of your fee back',
      'dep.only': 'Hold your place today for just', 'dep.fee': 'Full course, VAT included: Fighter {f}, Coach {c}', 'dep.how': 'for either course. Pay the deposit by QR code when you enrol.',
      'cta.dep': 'Pay {d} deposit, hold my place', 'dock.dep': 'Hold your place for {d}',
      'fee.whole': 'full 12-month course', 'fee.mo': 'per month', 'fee.wk': 'per week · 10 sessions', 'fee.ca': 'per session', 'fee.ca.n': '≈ {n} sessions in total',
      'pay.dep': 'A {d} deposit holds your place', 'pay.bank': 'Bank transfer by QR code', 'pay.card': 'Bank card, Visa / Mastercard (VNPay)', 'pay.isp': 'Instalments on a credit card',
      'pay.ask': 'Payment options are explained when you apply.', 'pay.free': 'Applying for advice is free',
      'form.h': 'Enrol in boxing career course {k}', 'form.sub': 'Fill in your details and your enrolment paper appears alongside. Dapper Combat will call you back to advise and hold your place.',
      'form.path': 'Which corner?', 'form.name': 'Full name', 'form.phone': 'Phone number', 'form.email': 'Email (optional)', 'form.year': 'Year of birth',
      'form.exp': 'Boxing experience', 'exp.0': 'Never trained', 'exp.1': 'Under 1 year', 'exp.2': '1 year or more', 'form.note': 'Anything you want to ask? (optional)',
      'form.pay': 'You want to', 'opt.consult': 'Get advice first, pay nothing yet', 'opt.consult.s': 'Dapper Combat calls you, you decide later',
      'opt.deposit': 'Pay a {d} deposit now', 'opt.deposit.s': 'Scan the QR code right after sending', 'opt.full': 'Pay the full {p}', 'opt.full.s': 'Scan the QR code or pay by card after sending', 'opt.full.isp': 'Credit card instalments available',
      'send.consult': 'Send my application', 'send.deposit': 'Enrol and pay deposit', 'send.full': 'Enrol and pay', 'form.sending': 'Sending…',
      'payname.consult': 'Advice first', 'payname.deposit': 'Deposit to hold a place', 'payname.full': 'Full fee',
      'ok.h': 'You are enrolled', 'ok.p': 'Your reference: {c}. Dapper Combat will call {ph} to talk about the {n} course.',
      'ok.pay': 'One more step: {what} {d} to hold your place. Transfer note: {note}.', 'ok.what.deposit': 'pay the deposit of', 'ok.what.full': 'pay',
      'ok.again': 'Enrol someone else',
      'err.name': 'Please enter your name', 'err.phone': 'Please enter a valid phone number', 'err.year': 'Please check the year of birth',
      'err.year.req': 'Enter your year of birth so we can check the age range', 'err.age': 'The {n} course takes students aged {a} to {b} (counted in the start year, {y}).', 'err.age.alt': 'You fit the {n} course (age {a}–{b}).',
      'age': 'age {a}–{b}', 'cmp.age': 'Age range',
      'q9': 'How old do I need to be?', 'a9': 'The Coach course takes students aged {ca} to {cb}, the Fighter course {fa} to {fb}, counted in the start year {y}.',
      'cert.label': 'Enrolment paper preview', 'cert.title': 'Enrolment paper', 'cert.kick': '★ Pro Pathways · {k} ★', 'cert.sub': 'Starts {d}', 'cert.no': 'No.',
      'cert.student': 'Student', 'cert.ph': 'Your name', 'cert.path': 'Path', 'cert.out': 'Outcome', 'cert.time': 'Length', 'cert.time.v': '12 months · 10 sessions a week',
      'cert.born': 'Born', 'cert.date': 'Enrolled on', 'cert.wait': 'AWAITING', 'cert.done1': 'ENROLLED', 'cert.done2': COHORT, 'cert.ring': 'PRO PATHWAYS · {k} · DAPPER COMBAT · ',
      'faq.h': 'Questions', 'help.h': 'Still unsure?', 'help.p': 'Message us on Zalo or call the hotline: Dapper Combat answers your questions on schedule, fees and outcomes before you decide.', 'help.p0': 'Message us on Zalo: Dapper Combat answers your questions on schedule, fees and outcomes before you decide.',
      'help.zalo': 'Message on Zalo', 'help.call': 'Call the hotline', 'help.hot': 'Hotline',
      'dock.t': '{k} · from {p}', 'dock.left': '{n} days until the start',
      'q1': 'Can I join if I have never boxed?', 'a1': 'Yes. Both courses start from zero. The first round (the first 3 months) covers the foundations: stance, footwork, basic punches and conditioning.',
      'q2': 'How do the two courses differ?', 'a2': 'Same workload: 12 months, 5 sessions a week, 2 shifts a day, 2–3 hours each. Different content and goal: Coach learns how to teach, with a 100% job opportunity at HVP Academy; Fighter learns competition technique and tactics and is 100% fighting in The Corner colours.',
      'q3': 'What does the timetable look like?', 'a3': 'Monday to Friday, 2 shifts a day (morning and afternoon), 2–3 hours each, for 12 months from the start date, {d}.',
      'q4': 'How much is it and how do I pay?', 'a4': 'Fighter course {f}, Coach course {c}, for the full year, VAT included. {how}',
      'q5': 'What happens when I finish?', 'a5': 'Coaches have a 100% job opportunity at HVP Academy, or can find work at any other gym. Fighters stay on to train and are 100% fighting in The Corner colours.',
      'q7': 'What if I finish and get no job, or no fight?', 'a7': 'You get 100% of the fee back if you met the standard and: on the Coach course, HVP Academy cannot place you and you cannot find work elsewhere; on the Fighter course, you do not get to fight in The Corner colours.',
      'q8': 'After the Coach course, do I have to work at HVP Academy?', 'a8': 'No. You have a 100% job opportunity at HVP Academy, or you are free to find work at other gyms.',
      'q10': 'What if I fail a test?', 'a10': 'There are tests and competitions throughout the course. Pass and you move up; if not, you repeat until you have it down, at no extra fee. Dapper Combat does not send you away, it just takes longer to finish.',
      'q11': 'If I stop partway, do I get a refund?', 'a11': 'In the first month, if you are not a fit for us, Dapper Combat refunds 100% of the fee you paid and your course ends. If you stop, for any reason, the fee is not refunded. The outcome guarantee in your contract still stands.',
      'q6': 'Does reserving a place cost anything?', 'a6.free': 'No. Applying for advice is free; Dapper Combat calls you before you pay any fee.',
      'a6.dep': 'Your choice: apply for advice for free, or pay a {d} deposit to hold your place straight away.',
      'how.dep': 'A {d} deposit holds your place.', 'how.list': 'Pay by: {l}.',
    },
  };
  Object.keys(T.vi).forEach(function (k) { SEEN.push(['career.' + k, T.vi[k], T.en[k]]); });
  function t(k, v) {
    var s = (T[en() ? 'en' : 'vi'][k] != null ? T[en() ? 'en' : 'vi'][k] : T.vi[k]);
    s = s == null ? k : DC.x('career.' + k, en() ? 1 : 0, s);
    if (v) Object.keys(v).forEach(function (x) { s = s.split('{' + x + '}').join(v[x]); });
    return s;
  }

  /* ─── Hai con đường ─────────────────────────────────────────────────────── */
  var P = {
    coach: {
      hash: 'coach', corner: p('Góc xanh', 'Blue corner'), name: p('Coach', 'Coach'),
      out: p('100% cơ hội làm việc tại HVP Academy', 'A 100% job opportunity at HVP Academy'),
      content: p('Phương pháp dạy, cầm đích, soạn giáo án', 'Teaching method, pad work, lesson planning'), goalShort: p('Đứng lớp dạy người khác', 'Teach other people'),
      rounds: [
        { t: p('Nền tảng như một võ sĩ', 'Foundations, like a fighter'), items: [p('Tư thế, bộ pháp, 6 đòn cơ bản', 'Stance, footwork, the 6 basic punches'), p('Thể lực nền, khởi động và giãn cơ đúng', 'Base conditioning, proper warm-up and cool-down'), p('Tự tập đúng trước khi dạy người khác', 'Do it right yourself before you teach it')], mile: p('Sát hạch kỹ thuật cơ bản', 'Basic technique assessment'), title: p('Học viên nền tảng', 'Foundation student'),
          unlock: [p('Đánh đúng 6 đòn cơ bản', 'Throw the 6 basic punches right'), p('Tư thế và bộ pháp chuẩn', 'Solid stance and footwork'), p('Khởi động, giãn cơ đúng cách', 'Proper warm-up and cool-down')] },
        { t: p('Nghề cầm đích', 'The craft of the pads'), items: [p('Cầm đích (pad work) và ra bài tập', 'Holding pads and calling drills'), p('Đọc lỗi kỹ thuật và cách sửa', 'Spotting and fixing technical faults'), p('Nguyên lý soạn giáo án một buổi tập', 'Planning a single session')], mile: p('Tự soạn và dạy thử một buổi', 'Plan and teach a trial session'), title: p('Trợ lý cầm đích', 'Pad assistant'),
          unlock: [p('Cầm đích, gọi combo', 'Hold pads, call combinations'), p('Đọc và sửa lỗi kỹ thuật', 'Spot and fix faults'), p('Soạn giáo án một buổi', 'Plan a full session')] },
        { t: p('Trợ giảng lớp thật', 'Assisting real classes'), items: [p('Kèm HLV chính tại các lớp đang mở', 'Shadow the head coach in live classes'), p('Quản lý lớp nhóm, giữ nhịp buổi tập', 'Run a group and keep the session moving'), p('Sơ cứu, phòng chấn thương, dinh dưỡng cơ bản', 'First aid, injury prevention, basic nutrition')], mile: p('HLV chính đánh giá đạt', 'Signed off by the head coach'), title: p('Trợ giảng', 'Assistant coach'),
          unlock: [p('Dẫn lớp nhóm', 'Run a group class'), p('Sơ cứu, phòng chấn thương', 'First aid, injury prevention'), p('Tư vấn dinh dưỡng cơ bản', 'Basic nutrition advice')] },
        { t: p('Đứng lớp và sát hạch', 'Leading classes, final test'), items: [p('Đứng lớp nhóm và 1-1 có giám sát', 'Lead group and 1-on-1 sessions under supervision'), p('Xây chương trình 4 tuần cho học viên', 'Build a 4-week program for a member'), p('Tư vấn và giữ chân học viên', 'Advise members and keep them training')], mile: p('Sát hạch cuối khóa', 'Final assessment'), title: p('Coach đứng lớp', 'Class coach'),
          unlock: [p('Đứng lớp nhóm và 1-1', 'Lead group and 1-on-1 sessions'), p('Xây chương trình 4 tuần', 'Build a 4-week program'), p('Tư vấn, giữ chân học viên', 'Advise and keep members')] },
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
      hash: 'vo-si', corner: p('Góc đỏ', 'Red corner'), name: p('Võ sĩ', 'Fighter'),
      out: p('100% thi đấu dưới màu cờ The Corner', '100% fighting in The Corner colours'),
      content: p('Kỹ thuật, thể lực, chiến thuật thi đấu', 'Technique, conditioning, fight tactics'), goalShort: p('Lên sàn thi đấu', 'Step into the ring'),
      rounds: [
        { t: p('Nền tảng và thể lực', 'Foundations and conditioning'), items: [p('Tư thế, bộ pháp, đòn cơ bản', 'Stance, footwork, basic punches'), p('Thể lực nền cho người mới', 'Base conditioning for beginners'), p('Sparring kỹ thuật nhẹ', 'Light technical sparring')], mile: p('Lần chấm kỹ năng đầu tiên trên Academy Ranking', 'First skills score on the Academy Ranking'), title: p('Tân binh', 'Rookie'),
          unlock: [p('Tư thế, bộ pháp vững', 'Solid stance and footwork'), p('Đòn cơ bản chuẩn', 'Clean basic punches'), p('Sparring kỹ thuật', 'Technical sparring')] },
        { t: p('Xây lối đánh', 'Building your style'), items: [p('Combo, phòng thủ và phản đòn', 'Combinations, defense and counters'), p('Sparring có chấm điểm', 'Scored sparring'), p('Chiến thuật theo từng kiểu đối thủ', 'Tactics for each kind of opponent')], mile: p('Sparring Day có chấm điểm', 'A scored Sparring Day'), title: p('Võ sĩ sparring', 'Sparring fighter'),
          unlock: [p('Combo và phản đòn', 'Combinations and counters'), p('Phòng thủ dưới áp lực', 'Defense under pressure'), p('Lối đánh của riêng bạn', 'A style of your own')] },
        { t: p('Thi đấu nội bộ', 'In-house competition'), items: [p('Fight night nội bộ của Academy', 'Academy fight nights'), p('Giữ cân và dinh dưỡng thi đấu', 'Making weight and fight nutrition'), p('Tâm lý trước trận', 'Pre-fight mindset')], mile: p('Trận fight night nội bộ đầu tiên', 'Your first in-house fight night'), title: p('Võ sĩ nội bộ', 'In-house fighter'),
          unlock: [p('Giữ cân, dinh dưỡng thi đấu', 'Making weight, fight nutrition'), p('Tâm lý trước trận', 'Pre-fight mindset'), p('Kinh nghiệm fight night', 'Fight night experience')] },
        { t: p('Trại thi đấu', 'Fight camp'), items: [p('Fight camp trước trận', 'A full fight camp'), p('Phân tích băng hình đối thủ', 'Opponent video study'), p('Chuẩn bị trận ra mắt', 'Preparing your debut')], mile: p('Ra mắt dưới tên The Corner', 'Debut under The Corner'), title: p('Võ sĩ The Corner', 'The Corner fighter'),
          unlock: [p('Fight camp trọn vẹn', 'A full fight camp'), p('Đọc băng hình đối thủ', 'Opponent video study'), p('Trận ra mắt', 'Your debut bout')] },
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
  // nỗi lo khi tự đi một mình: [nỗi lo, cái giá phải trả, tiêu đề giải pháp, [3 ý cụ thể]] — giải pháp lấy từ lộ trình / lịch tuần / kỹ năng
  var PAINS = {
    coach: [
      [p('Biết đánh, nhưng đứng trước học viên thì không biết dạy gì', 'You can box, but in front of a class you do not know what to teach'),
       p('Bạn đấm được, nhưng không giải thích được vì sao đòn của học viên sai. Họ tập mãi không lên, rồi lặng lẽ nghỉ. Không phòng tập nào giữ một coach không giữ nổi học viên.', 'You can punch, but you cannot explain why a member\'s punch is wrong. They stop improving and quietly quit. No gym keeps a coach who cannot keep members.'),
       p('Học nghề dạy, không chỉ học đánh', 'Learn to teach, not just to box'),
       [p('Cầm đích, giữ nhịp, gọi combo theo trình độ từng học viên', 'Hold pads, keep the rhythm, call combinations for each member\'s level'),
        p('Nhìn ra lỗi tư thế, lỗi đòn và sửa bằng đúng bài tập', 'Spot stance and punch faults and fix them with the right drill'),
        p('Soạn giáo án từ một buổi tới chương trình nhiều tuần', 'Plan anything from a single session to a multi-week program')]],
      [p('Tự học qua video, sai từ gốc mà không ai sửa', 'Learning from videos, wrong from the root with nobody to fix it'),
       p('Một lỗi lặp lại trăm lần thành thói quen. Bạn đem thói quen sai đó dạy cho người khác, nó thành chấn thương của họ và vết xấu trên uy tín của bạn.', 'A mistake repeated a hundred times becomes a habit. You pass that habit on, it turns into other people\'s injuries and a mark on your name.'),
       p('Xây lại nền tảng như một võ sĩ', 'Rebuild your foundations like a fighter'),
       [p('Hiệp 1 (3 tháng đầu): tư thế, bộ pháp, 6 đòn cơ bản, thể lực nền', 'Round 1 (first 3 months): stance, footwork, the 6 basic punches, base conditioning'),
        p('520 ca trong 12 tháng, 10 ca mỗi tuần từ Thứ 2 đến Thứ 6', '520 sessions over 12 months, 10 a week from Monday to Friday'),
        p('Mỗi hiệp kết thúc bằng một lần sát hạch', 'Every round ends with an assessment')]],
      [p('Chưa từng đứng lớp thật, lần đầu đứng lớp là lần đầu run', 'Never led a real class, so your first class is your first panic'),
       p('Hai mươi người nhìn vào bạn. Bạn quên bài, mất nhịp, buổi tập rời rạc. Học viên nhận ra ngay, và chủ phòng tập cũng vậy.', 'Twenty people are watching. You forget the drill, lose the rhythm, the session falls apart. Members notice at once, and so does the gym owner.'),
       p('Đứng lớp thật trước khi phải tự đứng lớp', 'Real classes before you lead your own'),
       [p('Hiệp 3: trợ giảng, kèm HLV chính tại các lớp đang mở', 'Round 3: assist the head coach in live classes'),
        p('Học quản lý lớp nhóm, giữ nhịp buổi tập, sơ cứu và phòng chấn thương', 'Learn to run a group, keep the session moving, first aid and injury prevention'),
        p('Hiệp 4: đứng lớp nhóm và 1-1 có giám sát', 'Round 4: lead group and 1-on-1 sessions under supervision')]],
      [p('Học xong không biết bắt đầu đi làm ở đâu', 'You finish and have no idea where to start working'),
       p('Phòng tập cần người đã từng đứng lớp, không cần thêm một người "biết đánh". Không có chỗ bắt đầu, bạn quay về nghề cũ và boxing lại chỉ là sở thích.', 'Gyms want someone who has led classes, not another person who "can box". With nowhere to start, you go back to your old job and boxing becomes a hobby again.'),
       p('100% cơ hội làm việc tại HVP Academy', 'A 100% job opportunity at HVP Academy'),
       [p('Học xong có cơ hội làm việc tại HVP Academy', 'A place to work at HVP Academy when you finish'),
        p('Hoặc tự do chọn phòng tập khác, mang theo 12 kỹ năng đã mở khóa', 'Or any other gym you choose, with 12 unlocked skills to show'),
        p('Học cách tư vấn và giữ chân học viên, để làm nghề lâu dài', 'Learn to advise and keep members, so the job lasts')]],
      [p('Không có gì chứng minh tay nghề khi đi xin việc', 'Nothing to prove your skill when you apply for a job'),
       p('Ai cũng nói mình biết dạy. Không có mốc đánh giá nào, hồ sơ của bạn giống hệt hàng chục hồ sơ khác, và mức lương cũng vậy.', 'Everyone says they can teach. Without any assessment, your application looks like dozens of others, and so does your pay.'),
       p('4 lần sát hạch, 4 danh hiệu, 12 kỹ năng', '4 assessments, 4 titles, 12 skills'),
       [p('Qua mỗi hiệp, nhận một danh hiệu: Học viên nền tảng, Trợ lý cầm đích, Trợ giảng, Coach đứng lớp', 'Each round earns a title: Foundation student, Pad assistant, Assistant coach, Class coach'),
        p('Sát hạch cuối khóa trước khi chính thức đứng lớp', 'A final assessment before you lead classes for real'),
        p('12 kỹ năng mở khóa, kể ra được từng cái khi phỏng vấn', '12 unlocked skills you can name one by one in an interview')]],
    ],
    fighter: [
      [p('Tập mãi mà chưa một lần lên sàn thật', 'Training for years and never once in a real ring'),
       p('Ngày nào cũng đấm bao, chạy bộ, sparring vài hiệp cho vui. Năm này qua năm khác, chiếc găng vẫn chưa một lần chạm đối thủ thật dưới ánh đèn.', 'Every day: the bag, the run, a few rounds of sparring for fun. Year after year, your gloves have never touched a real opponent under the lights.'),
       p('100% thi đấu dưới màu cờ The Corner', '100% fighting in The Corner colours'),
       [p('Hiệp 3: fight night nội bộ của Academy', 'Round 3: Academy fight nights'),
        p('Hiệp 4: fight camp và trận ra mắt', 'Round 4: fight camp and your debut bout'),
        p('Học xong ở lại tập và được dẫn đi thi đấu', 'When you finish you stay on to train and are taken to compete')]],
      [p('Lên sàn một mình, không đội, không ai đứng góc', 'In the ring alone, no team, nobody in your corner'),
       p('Không ai lo cân, lo găng, lo chiến thuật giữa hiệp. Bạn vừa đánh vừa tự xoay xở mọi thứ, và thua từ trước khi chuông vang.', 'Nobody handles weight, gloves or tactics between rounds. You fight and sort out everything else yourself, and lose before the first bell.'),
       p('Có cả đội The Corner đứng sau', 'The Corner team behind you'),
       [p('Ở lại tập với đội The Corner sau khóa học', 'Stay on and train with The Corner team after the course'),
        p('Fight camp trước trận, có kế hoạch trận đấu rõ ràng', 'A fight camp before each bout, with a clear game plan'),
        p('Xem băng hình đối thủ, điều chỉnh giữa các hiệp', 'Study opponent video, adjust between rounds')]],
      [p('Không biết mình đang ở trình độ nào', 'No idea what level you are really at'),
       p('Không ai chấm điểm, bạn đoán mò. Nhận trận quá sức thì chấn thương, nhận trận quá dễ thì phí cả năm tập.', 'Nobody scores you, so you guess. Take a fight that is too hard and you get hurt, too easy and you waste a year.'),
       p('Đo trình độ bằng điểm số, không bằng cảm giác', 'Measure your level in scores, not feelings'),
       [p('Chấm kỹ năng trên Dapper Combat Academy Ranking ngay từ hiệp 1', 'Skill scores on the Dapper Combat Academy Ranking from round 1'),
        p('Sparring có chấm điểm từ hiệp 2', 'Scored sparring from round 2'),
        p('Thứ hạng lên xuống theo từng trận, biết rõ mình đứng ở đâu', 'Your rank moves with every bout, so you know where you stand')]],
      [p('Tự mày mò xuống cân, ăn uống, giữ tâm lý trước trận', 'Working out weight cuts, diet and nerves on your own'),
       p('Xuống cân sai cách là bước vào trận với cơ thể kiệt sức. Run trước đám đông là quên sạch mọi thứ đã tập suốt nhiều tháng.', 'Cut weight the wrong way and you walk in already drained. Freeze in front of a crowd and months of training disappear.'),
       p('Học cả phần nằm ngoài sàn đấu', 'Learn everything that happens outside the ring'),
       [p('Giữ cân an toàn, dinh dưỡng trước và sau trận', 'Safe weight management, eating before and after a fight'),
        p('Tâm lý trước trận, giữ bình tĩnh trước đám đông và sau thất bại', 'Pre-fight mindset, staying calm in front of a crowd and after a loss'),
        p('Thể lực sức bền, sức mạnh, tốc độ cho trận nhiều hiệp', 'Endurance, strength and speed for multi-round bouts')]],
      [p('Tuổi thi đấu trôi qua mà vẫn chưa bắt đầu', 'Your fighting years slipping by before you even start'),
       p('Võ sĩ có tuổi nghề. Mỗi năm chần chừ là bớt đi một năm có thể thi đấu, và cánh cửa đó không mở lại.', 'Fighters have a shelf life. Every year you wait is one less year you can fight, and that door does not reopen.'),
       p('Từ con số 0 tới trận ra mắt trong 12 tháng', 'From zero to your debut in 12 months'),
       [p('Không cần kinh nghiệm: hiệp 1 xây nền tảng và thể lực', 'No experience needed: round 1 builds foundations and fitness'),
        p('4 hiệp, 520 ca, 10 ca mỗi tuần, không ngắt quãng', '4 rounds, 520 sessions, 10 a week without a break'),
        p('Hết hiệp 4: trận ra mắt dưới màu cờ The Corner', 'End of round 4: your debut in The Corner colours')]],
    ],
  };
  // trắc nghiệm tự đánh giá: 4 phần × 3 câu; mỗi lựa chọn [chữ, điểm Coach, điểm Võ sĩ] (mỗi câu tối đa 2 điểm cho mỗi góc),
  // d = nhận xét phần đó theo góc nghiêng (coach / fighter / both)
  var QUIZ = [
    { h: p('Tính cách', 'Personality'),
      d: { coach: p('Kiên nhẫn, thích giải thích và kéo người khác đi cùng: tố chất của người đứng lớp.', 'Patient, keen to explain and to bring people along: the makings of a coach.'),
           fighter: p('Thích thử thách, muốn tự mình chứng minh và không chịu thua.', 'You love a challenge, want to prove it yourself and hate to lose.'),
           both: p('Vừa biết lùi lại để dẫn dắt người khác, vừa có máu hơn thua.', 'You can step back to lead others, and you still hate to lose.') },
      q: [
        [p('Trong một nhóm, bạn thường là người…', 'In a group, you are usually the one who…'), [
          [p('Giải thích lại khi có ai đó chưa hiểu', 'Explains it again when someone is lost'), 2, 0],
          [p('Nhận phần việc khó nhất về mình', 'Takes on the hardest part'), 0, 2],
          [p('Kéo mọi người đi cùng, không để ai bị bỏ lại', 'Brings everyone along, nobody left behind'), 1, 0],
          [p('Lặng lẽ làm phần của mình thật tốt', 'Quietly does their own part really well'), 0, 1]]],
        [p('Có người thách thức bạn. Bạn…', 'Someone challenges you. You…'), [
          [p('Muốn chứng minh ngay, càng khó càng hăng', 'Want to prove yourself now, the harder the better'), 0, 2],
          [p('Bình tĩnh xem người đó giỏi ở đâu để học lại', 'Stay calm and see what they do well, to learn from it'), 1, 0],
          [p('Về tập kỹ hơn, nhưng nhất định không chịu thua', 'Go and train harder, but you will not lose'), 0, 1],
          [p('Không cần hơn thua, bạn đi đường của mình', 'No need to win, you walk your own road'), 2, 0]]],
        [p('Một người làm sai cùng một việc lần thứ năm. Bạn…', 'Someone gets the same thing wrong for the fifth time. You…'), [
          [p('Thử một cách giải thích khác', 'Try a different way of explaining it'), 2, 0],
          [p('Mặc họ, bạn tập trung vào việc của mình', 'Leave them to it and focus on your own work'), 0, 2],
          [p('Làm mẫu lại thật chậm cho họ xem', 'Show it again, slowly'), 1, 0],
          [p('Bắt đầu sốt ruột, muốn tự làm cho nhanh', 'Get impatient and want to just do it yourself'), 0, 1]]]] },
    { h: p('Năng lượng', 'Energy'),
      d: { coach: p('Bạn nạp năng lượng từ con người: đông người, nhịp đều, có người đang nghe mình.', 'People recharge you: a crowd, a steady rhythm, someone listening.'),
           fighter: p('Bạn nạp năng lượng từ cường độ: tập nặng, dồn hết sức cho một mục tiêu.', 'Intensity recharges you: hard training, everything into one goal.'),
           both: p('Năng lượng của bạn đến từ cả con người lẫn cường độ.', 'You draw energy from both people and intensity.') },
      q: [
        [p('Sau một ngày dài, điều gì nạp lại năng lượng cho bạn?', 'After a long day, what recharges you?'), [
          [p('Một buổi tập thật nặng, ra hết mồ hôi', 'A really hard session, sweating it all out'), 0, 2],
          [p('Nói chuyện, gặp gỡ mọi người', 'Talking and being around people'), 2, 0],
          [p('Ở một mình, yên tĩnh', 'Time alone, in quiet'), 0, 1],
          [p('Giúp được ai đó một việc', 'Helping someone out'), 1, 0]]],
        [p('Bạn hợp với nhịp sống nào hơn?', 'Which rhythm suits you better?'), [
          [p('Đều đặn mỗi ngày, gặp nhiều người, nhiều lớp', 'Steady every day, lots of people, lots of classes'), 2, 0],
          [p('Dồn hết sức cho một mục tiêu lớn, rồi mới nghỉ', 'Everything into one big goal, then rest'), 0, 2],
          [p('Mỗi ngày một việc khác, không lặp lại', 'Something different every day'), 1, 1]]],
        [p('Lúc nào bạn thấy mình "cháy" nhất?', 'When do you feel most on fire?'), [
          [p('Khi cơ thể mệt rã rời mà vẫn phải đánh tiếp', 'When your body is spent and you keep fighting'), 0, 2],
          [p('Khi đứng trước đám đông và mọi người đang nghe mình', 'In front of a crowd that is listening to you'), 2, 0],
          [p('Khi vượt qua con số tốt nhất của chính mình', 'When you beat your own best'), 0, 1],
          [p('Khi thấy ai đó làm được điều họ tưởng không làm được', 'When someone does what they thought they could not'), 1, 0]]]] },
    { h: p('Sở thích', 'Interests'),
      d: { coach: p('Bạn để ý cách dạy, cách sửa đòn, cách người đứng góc làm việc.', 'You notice how things are taught, how punches are fixed, how the corner works.'),
           fighter: p('Bạn bị cuốn vào trận đấu, sparring và cảm giác được đứng trên sàn.', 'You are drawn to fights, sparring and the feeling of the ring.'),
           both: p('Bạn mê cả những gì xảy ra trên sàn lẫn chuyện phía sau góc đài.', 'You love both what happens in the ring and what goes on in the corner.') },
      q: [
        [p('Xem một trận boxing, bạn để ý điều gì nhất?', 'Watching a fight, what do you notice most?'), [
          [p('Người đứng góc nói gì giữa hiệp', 'What the corner says between rounds'), 2, 0],
          [p('Không khí, tiếng hò reo, cảm giác muốn được lên đó', 'The crowd, the noise, wanting to be up there'), 0, 2],
          [p('Vì sao đòn này trúng, đòn kia trượt', 'Why one punch lands and another misses'), 1, 1],
          [p('Ai thắng, và thắng bằng cách nào', 'Who wins, and how'), 0, 1]]],
        [p('Phần nào của buổi tập bạn thích nhất?', 'Which part of training do you enjoy most?'), [
          [p('Sparring', 'Sparring'), 0, 2],
          [p('Cầm đích cho người khác đánh', 'Holding pads for someone else'), 2, 0],
          [p('Đánh bao tới khi mỏi tay', 'Hitting the bag until your arms give out'), 0, 1],
          [p('Chỉ cho người mới vài đòn cơ bản', 'Showing a beginner the basics'), 1, 0]]],
        [p('Rảnh rỗi, bạn hay xem gì về boxing?', 'In your free time, what boxing do you watch?'), [
          [p('Video hướng dẫn, phân tích kỹ thuật', 'Tutorials and technique breakdowns'), 2, 0],
          [p('Highlight, những pha knock-out', 'Highlights and knockouts'), 0, 2],
          [p('Phỏng vấn, câu chuyện của võ sĩ và HLV', 'Interviews and stories of fighters and coaches'), 1, 1]]]] },
    { h: p('Mục tiêu', 'Goals'),
      d: { coach: p('Bạn muốn một nghề vững, đứng lớp và nhìn học viên lớn lên.', 'You want a solid trade, a class of your own and students who grow.'),
           fighter: p('Bạn muốn lên sàn, gặp đối thủ thật dưới ánh đèn.', 'You want the ring and real opponents under the lights.'),
           both: p('Bạn muốn cả hai: thi đấu khi còn trẻ, rồi đứng lớp lâu dài.', 'You want both: fight while you are young, then coach for years.') },
      q: [
        [p('Sau 1 năm, bạn muốn mình đang ở đâu?', 'A year from now, where do you want to be?'), [
          [p('Đứng lớp, dạy người khác đấm đúng', 'In front of a class, teaching people to punch right'), 2, 0],
          [p('Đứng trên sàn, chờ tiếng chuông', 'In the ring, waiting for the bell'), 0, 2]]],
        [p('Điều gì làm bạn thấy đáng nhất?', 'What feels most worth it to you?'), [
          [p('Thắng một đối thủ mạnh hơn mình', 'Beating an opponent stronger than you'), 0, 2],
          [p('Thấy học viên tiến bộ nhờ mình', 'Seeing a student improve because of you'), 2, 0],
          [p('Được người trong nghề công nhận', 'Being respected by people in the sport'), 1, 1]]],
        [p('Bạn muốn boxing là gì trong đời mình?', 'What do you want boxing to be in your life?'), [
          [p('Một nghề vững để sống lâu dài', 'A solid trade to live from for years'), 2, 0],
          [p('Một giai đoạn cháy hết mình khi còn trẻ', 'A few years of giving everything while young'), 0, 2],
          [p('Thi đấu trước, rồi đứng lớp sau', 'Fight first, coach later'), 1, 1]]]] }
  ];
  cmsWalk(P, 'career.data.path'); cmsWalk(PAINS, 'career.data.pain'); cmsWalk(QUIZ, 'career.data.quiz');
  if (/[?&]cmsdump\b/.test(location.search)) window.__cmsDump = SEEN;
  var QN = QUIZ.reduce(function (s, g) { return s + g.q.length; }, 0);
  // "Xem trên trang" từ /admin (?cms=<khóa>) với chữ riêng của khóa Võ sĩ → mở sẵn góc Võ sĩ
  var path = location.hash === '#vo-si' || location.hash === '#fighter' || /[?&]cms=career.[^&]*fighter/.test(location.search) ? 'fighter' : 'coach';
  var quiz = { i: 0, ans: [] };

  /* ─── Số, ngày ───────────────────────────────────────────────────────── */
  var money = function (n) { return Math.round(n).toLocaleString(en() ? 'en-US' : 'vi-VN') + (en() ? ' VND' : 'đ'); };
  var approx = function (n) {   // ≈ 4,17 triệu / ≈ 96.000đ
    if (n >= 1e6) { var m = (Math.round(n / 1e4) / 100).toLocaleString(en() ? 'en-US' : 'vi-VN'); return '≈ ' + m + (en() ? 'm VND' : ' triệu'); }
    return '≈ ' + money(Math.round(n / 1000) * 1000);
  };
  var moneyShort = function (n) { return n % 1000000 === 0 ? (n / 1000000) + (en() ? 'm VND' : ' triệu') : money(n); };
  function startText(long) {
    var d = new Date(START + 'T00:00:00Z');
    return long ? d.toLocaleDateString(en() ? 'en-GB' : 'vi-VN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      : START.slice(8) + '.' + START.slice(5, 7) + '.' + START.slice(0, 4);
  }
  var target = Date.parse(START + 'T00:00:00+07:00');   // 0 giờ ngày khai giảng, giờ Việt Nam
  var daysLeft = function () { return Math.max(0, Math.ceil((target - Date.now()) / 86400000)); };
  function roundMonths(i) {
    var y = +START.slice(0, 4), m = +START.slice(5, 7) - 1 + i * 3;
    var f = function (k) { var d = new Date(Date.UTC(y, m + k, 1)); return en() ? d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'T' + (d.getUTCMonth() + 1) + '/' + d.getUTCFullYear(); };
    return f(0) + ' – ' + f(2);
  }
  var today = function () { var d = new Date(Date.now() + 7 * 3600000); return String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + d.getUTCFullYear(); };
  function payWays() {
    var w = [];
    if (DEP_ON) w.push(t('pay.dep', { d: money(DEPOSIT) }));
    if (BANK) w.push(t('pay.bank'));
    if (PO.vnpay) w.push(t('pay.card'));
    if (ISP) w.push(t('pay.isp'));
    return w;
  }

  /* ─── Mảnh giao diện ──────────────────────────────────────────────────── */
  // 2 góc ở đầu trang luôn ngang nhau (không đánh dấu góc đang xem), bấm vào → chọn góc + cuộn tới lộ trình
  function side(k) {
    return '<button type="button" class="tn-side ' + k + '" data-path="' + k + '" data-go="lo-trinh">' +
      '<img src="' + esc(IMG[k]) + '" alt="" ' + (k === 'coach' ? 'fetchpriority="high"' : 'loading="eager"') + ' decoding="async">' +
      '<span class="tn-side-txt"><small>' + esc(t('side.' + k)) + ' · ' + esc(ageText(k)) + '</small><strong>' + esc(t('bao.' + k)) + '</strong><span>' + esc(t('baosub.' + k)) + '</span>' +
      '<span class="tn-side-badge">' + esc(t('badge.' + k)) + '</span><em class="tn-side-cta">' + esc(t('pick.' + k)) + '</em></span></button>';
  }
  // nút giữ chỗ: có nhận cọc → "Đặt cọc 2 triệu giữ chỗ" (chọn sẵn đặt cọc trong form)
  function applyBtn(cls) {
    return DEP_ON ? '<a class="tn-btn' + (cls ? ' ' + cls : '') + '" href="#dang-ky" data-pick-pay="deposit">' + esc(t('cta.dep', { d: moneyShort(DEPOSIT) })) + '</a>'
      : '<a class="tn-btn' + (cls ? ' ' + cls : '') + '" href="#dang-ky">' + esc(t('cta.apply', { k: COHORT })) + '</a>';
  }
  var ageText = function (k) { return t('age', { a: AGES[k][0], b: AGES[k][1] }); };
  function clock() {
    return '<div class="tn-clock" data-clock aria-live="off">' + ['d', 'h', 'm', 's'].map(function (u) {
      return '<span><b data-u="' + u + '">00</b><small>' + esc(t('clock.' + u)) + '</small></span>';
    }).join('') + '</div>';
  }
  function hero() {
    return '<section class="tn-hero" id="top"><div class="tn-split">' + side('coach') + side('fighter') +
      '<div class="tn-hero-mid"><p class="tn-special"><span class="tn-cohort"><span>' + esc(t('special')) + '</span><b>' + esc(COHORT) + '</b></span></p><h1>' + esc(t('h1')) + '</h1><p class="tn-claim">' + esc(t('claim')) + '</p></div></div>' +
      '<div class="tn-strip"><div class="tn-in tn-strip-in">' +
        '<div class="tn-start"><b>' + esc(t('start', { d: startText() })) + '</b>' + clock() + '</div>' +
        '<div class="tn-strip-price">' + (DEP_ON ? '<small>' + esc(t('dep.only')) + '</small><b>' + esc(money(DEPOSIT)) + '</b><span>' + esc(t('dep.fee', { f: moneyShort(PRICES.fighter), c: moneyShort(PRICES.coach) })) + '</span>'
          : '<small>' + esc(t('fee.from')) + '</small><b>' + esc(money(PRICE_MIN)) + '</b><span>' + esc(t('fee.both', { f: moneyShort(PRICES.fighter), c: moneyShort(PRICES.coach) })) + '</span>') + (SEATS ? '<span class="tn-seats">' + esc(t('seats', { n: SEATS })) + '</span>' : '') + '<a class="tn-guar" href="#cam-ket">' + esc(t('guar.link')) + '</a></div>' +
        '<div class="tn-strip-cta">' + applyBtn() + '<a class="tn-link" href="#trac-nghiem">' + esc(t('cta.quiz')) + '</a></div>' +
      '</div></div></section>';
  }
  function quizHtml() {
    if (quiz.i >= QN) {
      // cộng điểm từng phần → % Coach, góc nghiêng của từng phần
      var C = 0, F = 0, n = 0;
      var dims = QUIZ.map(function (g) {
        var c = 0, f = 0;
        g.q.forEach(function (x) { var a = x[1][quiz.ans[n++]] || [0, 0, 0]; c += a[1]; f += a[2]; });
        C += c; F += f;
        return [g, c > f ? 'coach' : f > c ? 'fighter' : 'both'];
      });
      var pc = C + F ? Math.round(C * 100 / (C + F)) : 50;
      var r = Math.abs(pc - 50) <= 6 ? 'tie' : pc > 50 ? 'coach' : 'fighter', ks = r === 'tie' ? ORDER : [r];
      var btns = ks.map(function (k) {
        return '<button type="button" class="tn-btn ' + k + '" data-path="' + k + '" data-go="dang-ky">' + esc(t('quiz.go', { n: L(P[k].name) })) + '</button>' +
          (r === 'tie' ? '' : '<button type="button" class="tn-btn ghost" data-path="' + k + '" data-go="lo-trinh">' + esc(t('quiz.see', { n: L(P[k].name) })) + '</button>');
      }).join('');
      return '<div class="tn-q tn-q-res ' + r + '" role="status"><p class="tn-q-n">' + esc(t('quiz.res')) + '</p><h3>' + esc(t('quiz.r.' + r)) + '</h3>' +
        '<div class="tn-q-mix"><p><span class="coach">' + esc(L(P.coach.name)) + ' <b>' + pc + '%</b></span><span class="fighter">' + esc(L(P.fighter.name)) + ' <b>' + (100 - pc) + '%</b></span></p>' +
        '<div class="tn-q-bar" aria-hidden="true"><i style="width:' + pc + '%"></i></div></div>' +
        '<p class="tn-q-rs">' + esc(t('quiz.rs.' + r)) + '</p>' +
        '<dl class="tn-q-dims">' + dims.map(function (x) {
          return '<div class="' + x[1] + '"><dt>' + esc(L(x[0].h)) + '<small>' + esc(t('quiz.lean.' + x[1])) + '</small></dt><dd>' + esc(L(x[0].d[x[1]])) + '</dd></div>';
        }).join('') + '</dl>' +
        '<p class="tn-q-age">' + ks.map(function (k) { return esc(t('quiz.age', { n: L(P[k].name), a: ageText(k) })); }).join(' ') + '</p>' +
        '<div class="tn-q-go">' + btns + '</div><button type="button" class="tn-q-back" data-quiz="again">' + esc(t('quiz.again')) + '</button></div>';
    }
    // câu đang hỏi + thanh tiến độ theo 4 phần (mỗi câu 1 vạch)
    var s = 0, g, x;
    for (g = 0; g < QUIZ.length; g++) { if (quiz.i < s + QUIZ[g].q.length) break; s += QUIZ[g].q.length; }
    x = QUIZ[g].q[quiz.i - s];
    var m = 0, parts = '<ol class="tn-q-parts" aria-hidden="true">' + QUIZ.map(function (gg) {
      var a = m; m += gg.q.length;
      return '<li class="' + (quiz.i >= m ? 'done' : quiz.i >= a ? 'cur' : '') + '"><span>' + esc(L(gg.h)) + '</span><p>' + gg.q.map(function (y, j) {
        return '<i class="' + (a + j < quiz.i ? 'done' : a + j === quiz.i ? 'cur' : '') + '"></i>';
      }).join('') + '</p></li>';
    }).join('') + '</ol>';
    return '<div class="tn-q">' + parts + '<p class="tn-q-n">' + esc(t('quiz.n', { i: quiz.i + 1, n: QN })) + '</p><h3>' + esc(L(x[0])) + '</h3>' +
      '<div class="tn-q-a">' + x[1].map(function (a, j) {
        return '<button type="button" data-ans="' + j + '" data-lean="' + (a[1] > a[2] ? 'coach' : a[2] > a[1] ? 'fighter' : 'both') + '"' + (quiz.ans[quiz.i] === j ? ' class="on"' : '') + '>' + esc(L(a[0])) + '</button>';
      }).join('') + '</div>' +
      (quiz.i ? '<button type="button" class="tn-q-back" data-quiz="back">' + esc(t('quiz.back')) + '</button>' : '') + '</div>';
  }
  function bar() {
    return '<div class="tn-bar"><div class="tn-in tn-bar-in"><span class="tn-bar-l">' + esc(t('bar.label')) + '</span><div class="tn-seg" role="group">' + ORDER.map(function (k) {
      return '<button type="button" class="' + k + (path === k ? ' on' : '') + '" data-path="' + k + '" aria-pressed="' + (path === k) + '"><i></i>' + esc(L(P[k].name)) + '</button>';
    }).join('') + '</div><span class="tn-bar-out">' + esc(L(P[path].out)) + '</span><a class="tn-btn sm" href="#dang-ky">' + esc(t('bar.apply')) + '</a></div></div>';
  }
  function road() {
    var x = P[path];
    return '<ol class="tn-road">' + x.rounds.map(function (r, i) {
      return '<li><p class="tn-rd-n"><b>' + (i + 1) + '</b><span>' + esc(t('road.round', { n: i + 1 })) + '</span><small>' + esc(roundMonths(i)) + '</small></p><h3>' + esc(L(r.t)) + '</h3>' +
        '<ul>' + r.items.map(function (it) { return '<li>' + esc(L(it)) + '</li>'; }).join('') + '</ul>' +
        '<div class="tn-rd-skill"><small>' + esc(t('road.unlock')) + '</small><p>' + r.unlock.map(function (u) { return '<span>' + esc(L(u)) + '</span>'; }).join('') + '</p></div>' +
        '<div class="tn-rd-end"><small>' + esc(t('road.pass', { m: L(r.mile) })) + '</small><p><b>Lv.' + (i + 1) + '</b><span>' + esc(L(r.title)) + '</span></p></div></li>';
    }).join('') + '</ol><div class="tn-bell"><span class="tn-bell-ic" aria-hidden="true"></span><p><small>' + esc(t('road.bell')) + '</small><b>' + esc(L(x.out)) + '</b><span class="tn-bell-alt">' + esc(t('road.carry', { n: x.rounds.reduce(function (s, r) { return s + r.unlock.length; }, 0) })) + '</span></p>' +
      '<a class="tn-btn" href="#dang-ky">' + esc(t('quiz.go', { n: L(x.name) })) + '</a></div>';
  }
  function week() {
    var x = P[path], head = '<div class="tn-wk-h"></div>' + [1, 2, 3, 4, 5].map(function (d) { return '<div class="tn-wk-h">' + esc(t('d' + d)) + '</div>'; }).join('');
    var shift = function (s) {
      return '<div class="tn-wk-s"><b>' + esc(t('week.s' + s)) + '</b><small>' + esc(t('week.s' + s + 'd')) + '</small><small class="tn-wk-len">' + esc(t('week.len')) + '</small></div>' + x.week.map(function (day, i) {
        var c = day[s - 1];
        return '<div class="tn-wk-c ' + c[1] + '"><small class="tn-wk-d">' + esc(t('d' + (i + 1))) + ', ' + esc(t('week.s' + s)) + '</small><b>' + esc(L(c[0])) + '</b><span>' + esc(t('tag.' + c[1])) + '</span></div>';
      }).join('');
    };
    return '<div class="tn-wk">' + head + shift(1) + shift(2) + '</div><p class="tn-note">' + esc(t('week.note')) + '</p>';
  }
  // 2 bộ kỹ năng cạnh nhau (không đổi theo con đường đang xem)
  function skills() {
    return '<div class="tn-skset">' + ORDER.map(function (k) {
      return '<div class="tn-sk ' + k + '"><h3 class="tn-sk-h"><small>' + esc(L(P[k].corner)) + '</small>' + esc(t('skills.h', { n: L(P[k].name) })) + '</h3>' +
        '<ul class="tn-skills">' + P[k].skills.map(function (s) { return '<li><h3>' + esc(L(s[0])) + '</h3><p>' + esc(L(s[1])) + '</p></li>'; }).join('') + '</ul></div>';
    }).join('') + '</div>';
  }
  // nỗi lo khi tự đi con đường coach / võ sĩ → Truyền Nghề giải quyết: 2 tab chọn khóa (đổi con đường cho cả trang),
  // mỗi nỗi lo 1 hàng tách đôi — trái xám (nỗi lo), phải màu khóa (cách giải quyết); hàng cuối = hoàn học phí
  function pains() {
    var k = path, list = PAINS[k];
    return '<div class="tn-pain-tabs" role="group">' + ORDER.map(function (o) {
        return '<button type="button" class="' + o + (o === k ? ' on' : '') + '" data-path="' + o + '" aria-pressed="' + (o === k) + '"><small>' + esc(L(P[o].corner) + ' · ' + ageText(o)) + '</small>' + esc(t('pain.who.' + o)) + '</button>';
      }).join('') + '</div>' +
      '<div class="tn-pain"><div class="tn-pain-hd" aria-hidden="true"><span>' + esc(t('pain.col.q')) + '</span><span></span><span>' + esc(t('pain.col.a')) + '</span></div>' + list.map(function (x, i) {
        return '<div class="tn-pain-row"><div class="tn-pain-q"><h3>' + esc(L(x[0])) + '</h3><p><small>' + esc(t('pain.cost')) + '</small>' + esc(L(x[1])) + '</p></div><i aria-hidden="true"></i>' +
          '<div class="tn-pain-a"><small>' + esc(t('pain.fix')) + '</small><h3>' + esc(L(x[2])) + '</h3><ul>' + x[3].map(function (b) { return '<li>' + esc(L(b)) + '</li>'; }).join('') + '</ul></div></div>';
      }).join('') + '</div>' +
      '<p class="tn-pain-go"><button type="button" class="tn-btn ' + k + '" data-path="' + k + '" data-go="lo-trinh">' + esc(t('quiz.see', { n: L(P[k].name) })) + '</button></p>';
  }
  // giống nhau: 1 dòng mờ ở trên; khác nhau: bảng 2 cột xanh / đỏ, chữ to — đầu ra + hoàn học phí nổi nhất
  function compare() {
    var same = [['cmp.time', t('v.time')], ['cmp.sched', t('v.sched')]];
    var diff = [['cmp.age', ageText('coach'), ageText('fighter')], ['cmp.content', L(P.coach.content), L(P.fighter.content)], ['cmp.goal', L(P.coach.goalShort), L(P.fighter.goalShort)], ['cmp.fee', money(PRICES.coach), money(PRICES.fighter), 'fee'],
      ['cmp.out', L(P.coach.out), L(P.fighter.out), 'out'], ['cmp.refund', t('cmp.r.coach'), t('cmp.r.fighter'), 'ref']];
    return '<div class="tn-cmp-same"><span class="tn-cmp-same-k"><i aria-hidden="true">=</i>' + esc(t('cmp.same')) + '</span><ul>' + same.map(function (r) {
      return '<li><small>' + esc(t(r[0])) + '</small>' + esc(r[1]) + '</li>';
    }).join('') + '</ul></div>' +
      '<div class="tn-cmp"><div class="tn-cmp-h"><span class="k"><i aria-hidden="true">≠</i>' + esc(t('cmp.diff')) + '</span>' + ORDER.map(function (k) {
        return '<span class="c ' + k + '"><small>' + esc(L(P[k].corner)) + '</small>' + esc(L(P[k].name)) + '</span>';
      }).join('') + '</div>' + diff.map(function (r) {
        return '<div class="tn-cmp-row' + (r[3] ? ' ' + r[3] : '') + '"><span class="k">' + esc(t(r[0])) + '</span><span class="c coach">' + esc(r[1]) + '</span><span class="c fighter">' + esc(r[2]) + '</span></div>';
      }).join('') + '</div>';
  }
  // học phí: dải giữ chỗ chung + 2 thẻ khóa cạnh nhau (ảnh, độ tuổi, đầu ra, thứ nhận về, học phí chia nhỏ, nút giữ chỗ đúng khóa);
  // 2 thẻ cùng khung hàng (thẳng nhau), chữ từng hàng riêng theo khóa
  function fee() {
    var ways = payWays().filter(function (w, i) { return !(DEP_ON && i === 0); });
    var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
    var plan = function (k) {
      var x = P[k], pr = priceOf(k);
      var rows = [
        [String(SESS), t('w.sess.' + k), t('w.sess.d')],
        [String(x.rounds.length), t('w.rounds.' + k), x.rounds.map(function (r) { return L(r.title); }).join(' → ')],
        [String(x.skills.length), t('w.skills.' + k), x.skills.map(function (s) { return L(s[0]); }).join(', ')],
        ['1', t('w.job.' + k), t('w.job.' + k + '.d')],
        ['100%', t('pr.big.' + k), t('pr.free.' + k), 'out'],
        ['100%', t('w.refund'), cap(t('pr.if.' + k)), 'ref'],
      ];
      return '<article class="tn-plan ' + k + (path === k ? ' on' : '') + '"><header class="tn-plan-top"><img src="' + esc(PLAN_IMG[k]) + '" alt="" loading="lazy" decoding="async">' +
        '<p><small>' + esc(L(x.corner) + ' · ' + ageText(k)) + '</small><b>' + esc(L(x.name)) + '</b><span>' + esc(L(x.out)) + '</span></p></header>' +
        '<p class="tn-worth-k">' + esc(t('w.get')) + '</p><ul class="tn-plan-get">' + rows.map(function (r) {
          return '<li' + (r[3] ? ' class="' + r[3] + '"' : '') + '><b>' + esc(r[0]) + '</b><p><strong>' + esc(r[1]) + '</strong><span>' + esc(r[2]) + '</span></p></li>';
        }).join('') + '</ul>' +
        '<div class="tn-plan-price"><p class="tn-worth-k">' + esc(t('w.pay')) + '</p><p class="tn-fee-v">' + esc(money(pr)) + '</p>' +
        '<p class="tn-plan-per"><span>' + esc(approx(pr / SESS)) + ' ' + esc(t('fee.ca')) + '</span><span>' + esc(approx(pr / 12)) + ' ' + esc(t('fee.mo')) + '</span></p>' +
        '<button type="button" class="tn-btn ' + k + '" data-path="' + k + '" data-go="dang-ky"' + (DEP_ON ? ' data-pick-pay="deposit"' : '') + '>' +
          esc(DEP_ON ? t('plan.go.dep', { d: moneyShort(DEPOSIT), n: L(x.name) }) : t('plan.go', { n: L(x.name) })) + '</button></div></article>';
    };
    return (DEP_ON ? '<div class="tn-dep-band"><p><small>' + esc(t('dep.only')) + '</small><b>' + esc(money(DEPOSIT)) + '</b></p><span>' + esc(t('dep.how')) + '</span>' +
        (SEATS ? '<em>' + esc(t('seats', { n: SEATS })) + '</em>' : '') + '</div>' : '') +
      '<div class="tn-plans">' + ORDER.map(plan).join('') + '</div>' +
      '<ul class="tn-plans-ways">' + (ways.length ? ways : [t('pay.ask')]).map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '<li class="free">' + esc(t('pay.free')) + '</li></ul>' + trial();
  }
  // học tới khi thuần thục (chủ chốt 2026-10-30): chưa qua test → học lại không mất phí; tháng đầu không phù hợp → hoàn 100%; tự dừng → không hoàn
  function trial() {
    var c = function (k) { return '<div class="' + k + '"><small>' + esc(t('trial.' + k + '.k')) + '</small><b>' + esc(t('trial.' + k + '.b')) + '</b><span>' + esc(t('trial.' + k + '.s')) + '</span></div>'; };
    return '<div class="tn-trial"><h3>' + esc(t('trial.h')) + '</h3><p>' + esc(t('trial.p')) + '</p>' +
      '<div class="tn-trial-cases">' + c('re') + c('us') + c('you') + '</div></div>';
  }
  // giấy nhập môn (kiểu tờ đăng ký boxing Mỹ thập niên 70–80): tên / năm sinh cập nhật khi gõ, đóng dấu đỏ ở cuống khi ghi danh xong
  function seal(done) {
    var ring = t('cert.ring', { k: COHORT });
    return '<svg class="tn-cert-seal" viewBox="0 0 160 160" aria-hidden="true"><defs><path id="tnSealP" d="M80 80 m-58 0 a58 58 0 1 1 116 0 a58 58 0 1 1 -116 0"/></defs>' +
      '<circle cx="80" cy="80" r="74" class="o"/><circle cx="80" cy="80" r="44" class="i"/>' +
      '<text class="r" textLength="362" lengthAdjust="spacing"><textPath href="#tnSealP">' + esc(ring) + '</textPath></text>' +
      (done ? '<text x="80" y="76" text-anchor="middle" class="b">' + esc(t('cert.done1')) + '</text><text x="80" y="98" text-anchor="middle" class="b2">' + esc(t('cert.done2')) + '</text>'
        : '<text x="80" y="86" text-anchor="middle" class="w">' + esc(t('cert.wait')) + '</text>') + '</svg>';
  }
  function cert() {
    var x = P[path], d = done && done.path === path ? done : null, v = saved || {};
    return '<div class="tn-cert ' + path + (d ? ' stamped' + (stampNow ? ' stamp-now' : '') : '') + '" role="img" aria-label="' + esc(t('cert.label')) + '">' +
      '<div class="tn-cert-top"><span>★ DAPPER COMBAT ★</span><span>' + esc(t('cert.no')) + ' <b data-cert-code>' + esc(d ? d.code : '—') + '</b></span></div>' +
      '<div class="tn-cert-body"><p class="tn-cert-kick">' + esc(t('cert.kick', { k: COHORT })) + '</p><p class="tn-cert-title">' + esc(t('cert.title')) + '</p><p class="tn-cert-sub">' + esc(t('cert.sub', { d: startText() })) + '</p>' +
      '<p class="tn-cert-lbl">' + esc(t('cert.student')) + '</p><p class="tn-cert-name' + (d || v.name ? '' : ' ph') + '" data-cert-name>' + esc(d ? d.name : v.name || t('cert.ph')) + '</p>' +
      '<dl class="tn-cert-dl"><div><dt>' + esc(t('cert.path')) + '</dt><dd>' + esc(L(x.name) + ' · ' + L(x.corner)) + '</dd></div><div><dt>' + esc(t('cert.out')) + '</dt><dd>' + esc(L(x.out)) + '</dd></div>' +
        '<div><dt>' + esc(t('cert.time')) + '</dt><dd>' + esc(t('cert.time.v')) + '</dd></div><div><dt>' + esc(t('cert.born')) + '</dt><dd data-cert-year>' + esc((d ? d.year : v.year) || '—') + '</dd></div></dl>' +
      '<p class="tn-cert-guar"><small>' + esc(t('cert.guar')) + '</small>' + esc(t('refund.short.' + path)) + '</p></div>' +
      '<div class="tn-cert-foot"><p><small>' + esc(t('cert.date')) + '</small>' + esc(today()) + '</p>' + seal(!!d) + '</div></div>';
  }
  function form() {
    var opts = [['consult', t('opt.consult'), t('opt.consult.s')]];
    if (DEP_ON) opts.push(['deposit', t('opt.deposit', { d: money(DEPOSIT) }), t('opt.deposit.s')]);
    if (CAN_PAY) opts.push(['full', t('opt.full', { p: money(priceOf(path)) }), t('opt.full.s') + (ISP ? '. ' + t('opt.full.isp') : '')]);
    var pay = saved && saved.pay && opts.some(function (o) { return o[0] === saved.pay; }) ? saved.pay : 'consult';
    return '<form class="tn-form" novalidate><fieldset class="tn-pick"><legend>' + esc(t('form.path')) + '</legend>' + ORDER.map(function (k) {
      return '<label class="' + k + '"><input type="radio" name="path" value="' + k + '"' + (path === k ? ' checked' : '') + '><span><small>' + esc(L(P[k].corner)) + '</small><b>' + esc(L(P[k].name)) + '</b><i class="tn-pick-p">' + esc(money(priceOf(k))) + ' · ' + esc(ageText(k)) + '</i><em>' + esc(L(P[k].out)) + '</em></span></label>';
    }).join('') + '</fieldset>' +
      '<div class="tn-fg"><label class="tn-f wide"><span>' + esc(t('form.name')) + '</span><input name="name" autocomplete="name" maxlength="80" required></label>' +
      '<label class="tn-f"><span>' + esc(t('form.phone')) + '</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="20" required></label>' +
      '<label class="tn-f"><span>' + esc(t('form.year')) + '</span><input name="year" inputmode="numeric" maxlength="4"></label>' +
      '<label class="tn-f"><span>' + esc(t('form.email')) + '</span><input name="email" type="email" autocomplete="email" maxlength="120"></label>' +
      '<label class="tn-f"><span>' + esc(t('form.exp')) + '</span><select name="exp">' + [0, 1, 2].map(function (i) { return '<option value="' + i + '">' + esc(t('exp.' + i)) + '</option>'; }).join('') + '</select></label>' +
      '<label class="tn-f wide"><span>' + esc(t('form.note')) + '</span><textarea name="note" rows="2" maxlength="400"></textarea></label></div>' +
      (opts.length > 1 ? '<fieldset class="tn-payopt"><legend>' + esc(t('form.pay')) + '</legend>' + opts.map(function (o) {
        return '<label><input type="radio" name="pay" value="' + o[0] + '"' + (o[0] === pay ? ' checked' : '') + '><span><b>' + esc(o[1]) + '</b><small>' + esc(o[2]) + '</small></span></label>';
      }).join('') + '</fieldset>' : '') +
      '<div class="tn-form-guar"><span class="tn-mini-seal" aria-hidden="true">100%</span><p><b>' + esc(t('form.guar')) + '</b>' + esc(L(P[path].out)) + '. ' + esc(t('refund.short.' + path)) + '.<small>' + esc(t('form.trial')) + '</small></p></div>' +
      '<p class="tn-err" role="alert" hidden></p><button class="tn-btn" type="submit" data-send>' + esc(t('send.' + pay)) + '</button></form>';
  }
  function okHtml(r) {
    var payNote = r.due > 0 ? '<div class="tn-paybox"><p class="tn-paybox-t">' + esc(t('ok.pay', { what: t('ok.what.' + r.pay), d: money(r.due), note: String(r.code).replace(/[^A-Za-z0-9]/g, '') })) + '</p>' +
      (DC.payQr && BANK ? '<div class="tn-paybox-qr">' + (DC.payQr(r.code, r.due) || '') + (DC.payLines ? DC.payLines(r.code) : '') + '</div>' : '') +
      '<div class="dc-paylive" id="tnPayLive"></div></div>' : '';
    return '<div class="tn-ok" role="status"><span class="tn-ok-ic" aria-hidden="true"></span><h3>' + esc(t('ok.h')) + '</h3><p>' + esc(t('ok.p', { c: r.code, ph: r.phone, n: L(P[r.path].name) })) + '</p>' +
      payNote + (r.slip && DC.slip ? DC.slip.box(r.slip, DC.lang()) : '') + '<button type="button" class="tn-btn ghost" data-again>' + esc(t('ok.again')) + '</button></div>';
  }
  // hỏi đáp chia 3 nhóm; khung "Còn băn khoăn?": ảnh, Zalo / gọi, ghé phòng tập (địa chỉ, giờ mở cửa, chỉ đường — lấy ở /admin → Liên hệ)
  function faq() {
    var ways = payWays().filter(function (w, i) { return !(DEP_ON && i === 0); });
    var how = (DEP_ON ? t('how.dep', { d: money(DEP_ON ? DEPOSIT : 0) }) + ' ' : '') + (ways.length ? t('how.list', { l: ways.join(', ') }) : t('pay.ask'));
    var ans = function (i) {
      return i === 6 ? (DEP_ON ? t('a6.dep', { d: money(DEPOSIT) }) : t('a6.free'))
        : t('a' + i, { d: startText(true), f: money(PRICES.fighter), c: money(PRICES.coach), how: how, ca: AGES.coach[0], cb: AGES.coach[1], fa: AGES.fighter[0], fb: AGES.fighter[1], y: YEAR });
    };
    var groups = [['faq.g1', [1, 10, 9, 2]], ['faq.g2', [3, 4, 6]], ['faq.g3', [5, 7, 11, 8]]];
    var qa = groups.map(function (g, gi) {
      return '<div class="tn-faq-g"><h3>' + esc(t(g[0])) + '</h3>' + g[1].map(function (i, n) {
        return '<details' + (gi === 0 && n === 0 ? ' open' : '') + '><summary>' + esc(t('q' + i)) + '</summary><p>' + esc(ans(i)) + '</p></details>';
      }).join('') + '</div>';
    }).join('');
    var addr = [C.addr1, C.addr2].filter(Boolean).join(', ');
    var visit = addr ? '<div class="tn-help-visit"><b>' + esc(t('help.visit')) + '</b><span>' + esc(addr) + '</span>' +
      (C.hoursOpen && C.hoursClose ? '<span>' + esc(t('help.hours', { o: C.hoursOpen, c: C.hoursClose })) + '</span>' : '') +
      (C.maps ? '<a href="' + esc(C.maps) + '" target="_blank" rel="noopener">' + esc(t('help.map')) + '</a>' : '') + '</div>' : '';
    var tel = DIAL ? 'tel:' + DIAL : '';
    var link = function (cls, inner) { return tel ? '<a class="' + cls + '" href="' + esc(tel) + '">' + inner + '</a>' : '<span class="' + cls + '">' + inner + '</span>'; };
    var help = '<aside class="tn-help"><div class="tn-help-img"><img src="' + esc(HELP_IMG) + '" alt="" loading="lazy" decoding="async"></div><div class="tn-help-in"><h3>' + esc(t('help.h')) + '</h3><p>' + esc(t(PHONE ? 'help.p' : 'help.p0')) + '</p>' +
      (PHONE ? link('tn-help-tel', '<small>' + esc(t('help.hot')) + '</small><b>' + esc(PHONE) + '</b>') : '') +
      '<div class="tn-help-b' + (C.zalo && PHONE ? ' two' : '') + '">' +
      (C.zalo ? '<a class="tn-btn" href="' + esc(C.zalo) + '" target="_blank" rel="noopener">' + esc(t('help.zalo')) + '</a>' : '') +
      (PHONE ? link('tn-btn ghost', esc(t('help.call'))) : '') + '</div>' + visit + '</div></aside>';
    return '<div class="tn-faq-wrap"><div class="tn-faq">' + qa + '</div>' + (C.zalo || PHONE || addr ? help : '') + '</div>';
  }
  // 2 tờ "giấy cam kết": số 100% thật lớn + dấu đỏ hoàn 100% học phí, bấm → giữ chỗ đúng khóa
  function refundSeal(k) {
    var id = 'tnRefP-' + k;
    return '<svg class="tn-pr-seal" viewBox="0 0 160 160" aria-hidden="true"><defs><path id="' + id + '" d="M80 80 m-58 0 a58 58 0 1 1 116 0 a58 58 0 1 1 -116 0"/></defs>' +
      '<circle cx="80" cy="80" r="74" class="o"/><circle cx="80" cy="80" r="44" class="i"/><text class="r" textLength="362" lengthAdjust="spacing"><textPath href="#' + id + '">' + esc(t('seal.ring')) + '</textPath></text>' +
      '<text x="80" y="86" text-anchor="middle" class="c">100%</text><text x="80" y="106" text-anchor="middle" class="c2">' + esc(t('seal.mid')) + '</text></svg>';
  }
  function promise() {
    return '<div class="tn-pr">' + ORDER.map(function (k) {
      return '<article class="tn-pr-card ' + k + '"><p class="tn-pr-top"><span>' + esc(t('pr.paper')) + '</span><span>' + esc(t('pr.k.' + k)) + '</span></p>' +
        '<p class="tn-pr-big"><b>100%</b><span>' + esc(t('pr.big.' + k)) + '</span></p><p class="tn-pr-free">' + esc(t('pr.free.' + k)) + '</p>' +
        '<div class="tn-pr-ref">' + refundSeal(k) + '<p><b>' + esc(t('pr.refund')) + '</b>' + esc(t('pr.if.' + k)) + '</p></div>' +
        '<button type="button" class="tn-btn ' + k + '" data-path="' + k + '" data-go="dang-ky">' + esc(t('quiz.go', { n: L(P[k].name) })) + '</button></article>';
    }).join('') + '</div>';
  }
  var other = function (k) { return k === 'coach' ? 'fighter' : 'coach'; };
  var sec = function (id, h, sub, body, cls) { return '<section class="tn-sec' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="tn-in"><header class="tn-sec-h"><h2>' + h + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</header>' + body + '</div></section>'; };

  /* ─── Vẽ trang ────────────────────────────────────────────────────────── */
  var saved = null, done = null, swT, stampNow = false;
  function render() {
    [].forEach.call(document.querySelectorAll('[data-t]'), function (el) { el.textContent = t(el.getAttribute('data-t'), { k: COHORT }); });
    document.title = t('title');
    document.body.setAttribute('data-path', path);
    root.innerHTML = hero() +
      sec('noi-lo', esc(t('pain.h')), esc(t('pain.sub')), pains(), 'tn-sec-pain') +
      sec('cam-ket', esc(t('promise.h')), esc(t('promise.sub')), promise(), 'tn-sec-pr') +
      sec('trac-nghiem', esc(t('quiz.h')), esc(t('quiz.sub')), '<div class="tn-quiz">' + quizHtml() + '</div>', 'tn-sec-quiz') +
      bar() +
      sec('lo-trinh', esc(t('road.h')), esc(t('road.sub')), road()) +
      sec('tuan-hoc', esc(t('week.h')), esc(t('week.sub')), week(), 'alt') +
      sec('ky-nang', esc(t('skills.both')), esc(t('skills.sub')), skills()) +
      sec('so-sanh', esc(t('cmp.h')), esc(t('cmp.sub')), compare(), 'alt') +
      sec('hoc-phi', esc(t('fee.h')), esc(t('fee.sub', { n: L(P[path].name), p: money(priceOf(path)) })), fee(), 'tn-sec-fee') +
      sec('dang-ky', esc(t('form.h', { k: COHORT })), esc(t('form.sub')), '<div class="tn-apply"><div class="tn-form-box">' + (done ? okHtml(done) : form()) + '</div><div class="tn-cert-wrap">' + cert() + '</div></div>', 'tn-sec-apply') +
      sec('hoi-dap', esc(t('faq.h')), '', faq(), 'alt') +
      '<div class="tn-dock" aria-hidden="true"><p><b>' + esc(DEP_ON ? t('dock.dep', { d: moneyShort(DEPOSIT) }) : t('dock.t', { k: COHORT, p: moneyShort(PRICE_MIN) })) + '</b><small>' + esc(t('dock.left', { n: daysLeft() })) + '</small></p><a class="tn-btn sm" href="#dang-ky" tabindex="-1">' + esc(t('bar.apply')) + '</a></div>';
    stampNow = false;
    restore();
    tick();
    if (done && done.due > 0) payLive();
    dock();
  }
  // giữ chữ đã gõ khi đổi ngôn ngữ / con đường
  function keep() {
    var f = root.querySelector('.tn-form');
    if (!f) return;
    saved = [].reduce.call(f.elements, function (o, el) { if (el.name && el.type !== 'radio') o[el.name] = el.value; return o; }, {});
    var pay = f.querySelector('[name=pay]:checked'); if (pay) saved.pay = pay.value;
  }
  function restore() {
    var f = root.querySelector('.tn-form'); if (!f || !saved) return;
    Object.keys(saved).forEach(function (k) { if (f.elements[k] && f.elements[k].type !== 'radio' && k !== 'pay') f.elements[k].value = saved[k]; });
  }
  function choose(k, go) {
    if (!P[k]) return;
    keep(); path = k;
    try { history.replaceState(null, '', '#' + P[k].hash); } catch (e) { /* khung xem không cho đổi địa chỉ */ }
    var y = window.scrollY; render(); window.scrollTo(0, y);
    root.classList.add('sw'); clearTimeout(swT); swT = setTimeout(function () { root.classList.remove('sw'); }, 700);
    if (go) { var s = document.getElementById(go); if (s) s.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
  }
  // đếm ngược tới 0 giờ ngày khai giảng (giờ Việt Nam)
  function tick() {
    var el = root.querySelector('[data-clock]');
    if (!el) return;
    var ms = target - Date.now();
    if (ms <= 0) { el.innerHTML = '<span class="tn-clock-done">' + esc(t('clock.done', { k: COHORT })) + '</span>'; return; }
    var v = { d: Math.floor(ms / 86400000), h: Math.floor(ms / 3600000) % 24, m: Math.floor(ms / 60000) % 60, s: Math.floor(ms / 1000) % 60 };
    Object.keys(v).forEach(function (u) { var b = el.querySelector('[data-u="' + u + '"]'); if (b) b.textContent = u === 'd' ? String(v[u]) : String(v[u]).padStart(2, '0'); });
  }
  setInterval(tick, 1000);
  // thanh "Giữ chỗ" dính đáy màn hình điện thoại: hiện khi đã cuộn qua đầu trang, ẩn khi đang ở form ghi danh
  function dock() {
    var d = root.querySelector('.tn-dock'), h = root.querySelector('.tn-hero'), f = document.getElementById('dang-ky');
    if (!d || !h || !f) return;
    var fr = f.getBoundingClientRect(), on = h.getBoundingClientRect().bottom < 0 && !(fr.top < innerHeight && fr.bottom > 0);
    d.classList.toggle('on', on);
  }
  window.addEventListener('scroll', dock, { passive: true });
  window.addEventListener('resize', dock);
  // còn tiền cọc / học phí: nút trả bằng thẻ / trả góp (cổng đang bật) + tự báo "đã nhận tiền" khi chuyển khoản được xác nhận
  function payLive() {
    var box = document.getElementById('tnPayLive'), d = done;
    if (!box || !d.slip || !DC.slip) return;
    if (d.paidLive) { paid(); return; }
    if (!PO.vnpay && !PO.installment && !PO.auto) return;
    DC.slip.live(box, d.slip, DC.lang(), { buttons: PO.vnpay || PO.installment, poll: PO.auto, alive: function () { return done === d; }, onPaid: function () { d.paidLive = true; if (done === d) paid(); } });
  }
  function paid() {
    var pb = root.querySelector('.tn-paybox');
    if (pb) pb.outerHTML = '<p class="dc-paid-ok">' + esc(DC.tx ? DC.tx('global.slip.received', '✓ Đã nhận tiền — cảm ơn bạn!', '✓ Payment received — thank you!') : '✓') + '</p>';
  }

  /* ─── Sự kiện ─────────────────────────────────────────────────────────── */
  root.addEventListener('click', function (e) {
    var a = e.target.closest('[data-ans]');
    if (a) { quiz.ans[quiz.i] = +a.getAttribute('data-ans'); quiz.i++; swapQuiz(); return; }
    var q = e.target.closest('[data-quiz]');
    if (q) { if (q.getAttribute('data-quiz') === 'back') quiz.i = Math.max(0, quiz.i - 1); else quiz = { i: 0, ans: [] }; swapQuiz(); return; }
    var b = e.target.closest('[data-path]');
    if (b && b.tagName === 'BUTTON') {
      choose(b.getAttribute('data-path'), b.getAttribute('data-go'));
      var bp = b.getAttribute('data-pick-pay'), br = bp && root.querySelector('.tn-form [name=pay][value="' + bp + '"]');
      if (br && !br.checked) br.click();
      return;
    }
    var pp = e.target.closest('[data-pick-pay]');
    if (pp) { var r = root.querySelector('.tn-form [name=pay][value="' + pp.getAttribute('data-pick-pay') + '"]'); if (r && !r.checked) r.click(); }
    if (e.target.closest('[data-again]')) { done = null; saved = null; render(); var n = root.querySelector('.tn-form [name=name]'); if (n) n.focus(); }
  });
  // trắc nghiệm: chỉ vẽ lại khung câu hỏi
  function swapQuiz() {
    var box = root.querySelector('.tn-quiz');
    if (!box) return;
    box.innerHTML = quizHtml();
    var f = box.querySelector('button'); if (f && quiz.i) f.focus({ preventScroll: true });
  }
  root.addEventListener('change', function (e) {
    if (e.target.name === 'path' && e.target.checked) choose(e.target.value);
    if (e.target.name === 'pay') { var s = root.querySelector('[data-send]'); if (s) s.textContent = t('send.' + e.target.value); }
  });
  // giấy nhập môn đổi theo chữ đang gõ
  root.addEventListener('input', function (e) {
    var n = e.target.name;
    if (n === 'name') { var c = root.querySelector('[data-cert-name]'); var v = e.target.value.trim(); c.textContent = v || t('cert.ph'); c.classList.toggle('ph', !v); }
    if (n === 'year') { var y = root.querySelector('[data-cert-year]'); y.textContent = /^\d{4}$/.test(e.target.value.trim()) ? e.target.value.trim() : '—'; }
  });
  root.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, el = f.elements, err = f.querySelector('.tn-err'), btn = f.querySelector('[type=submit]');
    var fail = function (m, name) { err.textContent = m; err.hidden = false; if (name && el[name]) el[name].focus(); };
    var name = el.name.value.trim(), phone = el.phone.value.trim(), year = el.year.value.trim(), k = (f.querySelector('[name=path]:checked') || {}).value || path;
    var pay = (f.querySelector('[name=pay]:checked') || {}).value || 'consult';
    if (name.length < 2) return fail(t('err.name'), 'name');
    if (!/^[0-9 +().-]{8,20}$/.test(phone) || phone.replace(/\D/g, '').length < 9) return fail(t('err.phone'), 'phone');
    if (!year) return fail(t('err.year.req'), 'year');
    var yr = +year, now = new Date().getFullYear();
    if (!/^\d{4}$/.test(year) || !(yr >= now - 80 && yr <= now)) return fail(t('err.year'), 'year');
    var old = +YEAR - yr, rg = AGES[k], o = other(k), ro = AGES[o];
    if (old < rg[0] || old > rg[1]) return fail(t('err.age', { n: L(P[k].name), a: rg[0], b: rg[1], y: YEAR }) + (old >= ro[0] && old <= ro[1] ? ' ' + t('err.age.alt', { n: L(P[o].name), a: ro[0], b: ro[1] }) : ''), 'year');
    err.hidden = true; btn.disabled = true; btn.textContent = t('form.sending');
    var exp = T.vi['exp.' + el.exp.value] || '';
    DC.api('/registrations', {
      name: name, phone: phone, email: el.email.value.trim(), program: k, programName: 'Truyền Nghề · ' + P[k].name.vi,
      detail: 'Khai giảng ' + startText() + (year ? ' · sinh năm ' + year : '') + ' · kinh nghiệm: ' + exp, note: el.note.value.trim(),
      pay: pay, payName: T.vi['payname.' + pay], lang: en() ? 'en' : 'vi',
    }).then(function (r) {
      var due = pay === 'full' ? priceOf(k) : pay === 'deposit' ? DEPOSIT : 0;
      done = { code: r.code, slip: r.slip, phone: phone, name: name, year: year, path: k, pay: pay, due: due };
      saved = null; path = k; stampNow = true; render();
      var box = root.querySelector('.tn-sec-apply'); if (box) box.scrollIntoView({ block: 'start' });
      dock();
    }, function (x) { btn.disabled = false; btn.textContent = t('send.' + pay); fail(x.message); });
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
