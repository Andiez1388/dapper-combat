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
  var START = String(DC.setting('course.careerStart', '2027-02-20') || '2027-02-20');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(START)) START = '2027-02-20';
  var PRICE = Number(DC.setting('course.careerPrice', 50000000)) || 50000000;
  var DEPOSIT = Math.min(Number(DC.setting('course.careerDeposit', 2000000)) || 0, PRICE);
  var SEATS = Number(DC.setting('course.careerSeats', 0)) || 0;
  var SESS = 52 * 10;   // ≈ số ca cả khóa: 52 tuần × 5 buổi × 2 ca
  var YEAR = START.slice(0, 4);
  var media = function (k, def) { return DC.m ? DC.m(k, def) : def; };
  var IMG = { coach: media('career.hero.coach', '/assets/media/bc3dad0ad714.jpg'), fighter: media('career.hero.fighter', '/assets/media/bd656e3427a9.jpg') };
  // cách trả tiền đang mở trên web (/admin → Thanh toán, Thanh toán online)
  var PO = DC.payOnline ? DC.payOnline() : {};
  var BANK = DC.pay ? DC.pay() : null;
  var CAN_PAY = !!(BANK || PO.vnpay || PO.installment);
  var ISP = !!(PO.installment && PRICE >= (PO.installmentMin || 0));
  var DEP_ON = !!(DEPOSIT && CAN_PAY);   // có tiền cọc + có cách nhận tiền → mời đặt cọc giữ chỗ
  var C = (window.__CMS && window.__CMS.c) || {};
  var PHONE = C.phone && !/x/i.test(C.phone) ? String(C.phone) : '';

  var T = {
    vi: {
      'site.home': 'Trang chủ', 'site.shop': 'Cửa hàng', 'site.course': 'Khóa học', 'site.services': 'Dịch vụ Setup', 'site.ranking': 'Academy Ranking', 'site.career': 'Truyền Nghề',
      'foot.note': 'Truyền Nghề là chương trình đào tạo nghề boxing của Dapper Combat.', 'foot.home': 'Về trang chủ Dapper Combat',
      'title': 'Truyền Nghề — Học boxing thành nghề trong 1 năm | Dapper Combat',
      'h1': 'Truyền Nghề', 'special': 'Chương trình đặc biệt · Khóa {y}', 'claim': 'Một năm. Từ con số 0 thành nghề boxing.',
      'side.coach': 'Góc xanh · Coach', 'side.fighter': 'Góc đỏ · Võ sĩ', 'bao.coach': 'Bao việc làm', 'bao.fighter': 'Bao thi đấu',
      'baosub.coach': '100% cơ hội làm việc tại HVP Academy, hoặc tự do chọn phòng tập khác', 'baosub.fighter': '100% thi đấu dưới màu cờ The Corner',
      'badge': 'Cam kết hoàn 100% học phí', 'guar.link': 'Có cam kết hoàn 100% học phí',
      'promise.h': 'Cam kết 100%, hoặc hoàn 100% học phí', 'promise.sub': 'Bạn trả học phí cho một đầu ra rõ ràng. Đạt tiêu chuẩn mà không nhận được đầu ra đó, bạn được hoàn 100% học phí.',
      'pr.paper': 'GIẤY CAM KẾT', 'pr.k.coach': 'Khóa Coach · Góc xanh', 'pr.k.fighter': 'Khóa Võ sĩ · Góc đỏ',
      'pr.big.coach': 'cơ hội làm việc tại HVP Academy', 'pr.big.fighter': 'thi đấu dưới màu cờ The Corner',
      'pr.free.coach': 'Hoặc tự do tìm việc ở các phòng tập khác, tùy bạn chọn.', 'pr.free.fighter': 'Học xong, bạn ở lại tập luyện và được dẫn đi thi đấu.',
      'pr.refund': 'Hoàn 100% học phí', 'pr.if.coach': 'nếu bạn đạt tiêu chuẩn nhưng HVP Academy không sắp xếp được công việc và bạn không tìm được việc ở nơi khác.',
      'pr.if.fighter': 'nếu bạn đạt tiêu chuẩn thi đấu nhưng không được thi đấu dưới màu cờ The Corner.',
      'seal.ring': 'CAM KẾT · HOÀN HỌC PHÍ · TRUYỀN NGHỀ · ', 'seal.mid': 'HOÀN PHÍ',
      'refund.short.coach': 'Đạt chuẩn mà không có việc: hoàn 100% học phí', 'refund.short.fighter': 'Đạt chuẩn mà không được thi đấu: hoàn 100% học phí',
      'cmp.refund': 'Hoàn học phí', 'cmp.r.coach': '100% nếu đạt chuẩn mà không có việc', 'cmp.r.fighter': '100% nếu đạt chuẩn mà không được thi đấu',
      'cert.guar': 'Cam kết', 'form.guar': 'Cam kết của Dapper Combat',
      'pick.coach': 'Tôi muốn đứng lớp', 'pick.fighter': 'Tôi muốn lên sàn',
      'start': 'Khai giảng {d}', 'clock.d': 'ngày', 'clock.h': 'giờ', 'clock.m': 'phút', 'clock.s': 'giây', 'clock.done': 'Khóa {y} đã khai giảng',
      'per.course': 'trọn khóa · {c} mỗi ca tập', 'seats': 'Mỗi khóa nhận tối đa {n} học viên',
      'cta.apply': 'Giữ chỗ khóa {y}', 'cta.quiz': 'Bạn hợp góc nào?',
      'quiz.h': 'Bạn hợp góc nào?', 'quiz.sub': '4 câu hỏi, chưa tới 30 giây. Không có câu trả lời sai, chỉ có góc hợp với bạn hơn.',
      'quiz.n': 'Câu {i} / {n}', 'quiz.back': 'Câu trước', 'quiz.res': 'Kết quả của bạn', 'quiz.again': 'Làm lại',
      'quiz.r.coach': 'Bạn thuộc góc xanh: Coach', 'quiz.r.fighter': 'Bạn thuộc góc đỏ: Võ sĩ', 'quiz.r.tie': 'Bạn hợp cả hai góc',
      'quiz.rs.coach': 'Bạn thích làm người khác giỏi lên. Học xong 1 năm, bạn có 100% cơ hội làm việc tại HVP Academy.',
      'quiz.rs.fighter': 'Bạn muốn tự mình lên sàn. Học xong 1 năm, bạn 100% thi đấu dưới màu cờ The Corner.',
      'quiz.rs.tie': 'Chọn theo đích đến bạn muốn sau 12 tháng: đứng lớp hay lên sàn.',
      'quiz.see': 'Xem lộ trình {n}', 'quiz.go': 'Giữ chỗ khóa {n}',
      'bar.label': 'Con đường', 'bar.apply': 'Giữ chỗ',
      'road.h': 'Lộ trình 12 tháng, 4 hiệp', 'road.sub': 'Mỗi hiệp 3 tháng, kết thúc bằng một mốc kiểm tra. Hết hiệp 4 là tiếng chuông đầu tiên của nghề.',
      'road.round': 'Hiệp {n}', 'road.mile': 'Mốc kết thúc hiệp', 'road.bell': 'Sau 12 tháng',
      'week.h': 'Một tuần học mẫu', 'week.sub': 'Thứ 2 đến Thứ 6, mỗi ngày 2 ca. Khung lịch giống nhau ở cả 2 khóa, chỉ nội dung từng ca là khác.',
      'week.s1': 'Ca 1', 'week.s1d': 'buổi sáng', 'week.s2': 'Ca 2', 'week.s2d': 'buổi chiều', 'week.note': '10 ca mỗi tuần ở cả 2 khóa. Đổi con đường ở thanh phía trên để thấy nội dung từng ca thay đổi.',
      'd1': 'Thứ 2', 'd2': 'Thứ 3', 'd3': 'Thứ 4', 'd4': 'Thứ 5', 'd5': 'Thứ 6',
      'tag.tech': 'Kỹ thuật', 'tag.fit': 'Thể lực', 'tag.theory': 'Lý thuyết', 'tag.teach': 'Thực hành dạy', 'tag.spar': 'Sparring', 'tag.tactic': 'Chiến thuật',
      'skills.h': 'Bộ kỹ năng {n}',
      'cmp.h': 'Cùng khối lượng, khác đích đến', 'cmp.sub': 'Hai khóa cùng số tháng, cùng số buổi, cùng số ca. Khác nhau ở nội dung giảng dạy và mục tiêu cuối cùng.',
      'cmp.same': 'Giống nhau', 'cmp.diff': 'Khác nhau',
      'cmp.time': 'Thời gian', 'cmp.sched': 'Lịch học', 'cmp.fee': 'Học phí', 'cmp.content': 'Nội dung chính', 'cmp.goal': 'Mục tiêu', 'cmp.out': 'Học xong',
      'v.time': '12 tháng', 'v.sched': '5 buổi mỗi tuần, 2 ca mỗi ngày',
      'fee.h': 'Bạn nhận về một nghề', 'fee.sub': 'Học phí trọn khóa {p}, Coach và Võ sĩ cùng mức. Đây là những gì khoản đó mang lại cho bạn.',
      'w.get': 'Khóa {n}: bạn nhận về', 'w.pay': 'Học phí trọn khóa', 'w.same': 'Coach và Võ sĩ cùng mức',
      'w.sess': 'ca học trong 12 tháng', 'w.sess.d': '52 tuần, 5 buổi mỗi tuần, 2 ca mỗi ngày',
      'w.rounds': 'hiệp đào tạo, mỗi hiệp có mốc kiểm tra', 'w.skills.coach': 'kỹ năng nghề coach', 'w.skills.fighter': 'kỹ năng thi đấu',
      'w.job.coach': 'nghề để sống: đứng lớp dạy boxing', 'w.job.coach.d': 'Học như một võ sĩ, trợ giảng lớp thật, rồi tự đứng lớp.',
      'w.job.fighter': 'đội để thi đấu: The Corner', 'w.job.fighter.d': 'Sparring có chấm điểm, fight night nội bộ, rồi trận ra mắt.',
      'w.refund': 'học phí hoàn lại',
      'dep.only': 'Giữ chỗ hôm nay chỉ', 'dep.fee': 'Học phí trọn khóa {p} · {c} mỗi ca', 'dep.how': 'đặt cọc, quét mã QR trả ngay khi ghi danh',
      'cta.dep': 'Đặt cọc {d} giữ chỗ', 'dock.dep': 'Giữ chỗ chỉ {d}',
      'fee.whole': 'trọn khóa 12 tháng', 'fee.mo': 'mỗi tháng', 'fee.wk': 'mỗi tuần · 10 ca', 'fee.ca': 'mỗi ca tập', 'fee.ca.n': '≈ {n} ca cả khóa',
      'pay.dep': 'Đặt cọc {d} để giữ chỗ', 'pay.bank': 'Chuyển khoản, quét mã QR', 'pay.card': 'Thẻ ngân hàng, Visa / Mastercard (VNPay)', 'pay.isp': 'Trả góp qua thẻ tín dụng',
      'pay.ask': 'Hình thức đóng học phí được tư vấn khi bạn đăng ký.', 'pay.free': 'Đăng ký tư vấn không mất phí',
      'form.h': 'Ghi danh khóa {y}', 'form.sub': 'Điền thông tin, giấy nhập môn của bạn hiện ngay bên cạnh. Dapper Combat gọi lại để tư vấn và giữ chỗ cho bạn.',
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
      'cert.label': 'Bản xem trước giấy nhập môn', 'cert.title': 'Giấy nhập môn', 'cert.sub': 'Truyền Nghề · Khóa {y} · Khai giảng {d}', 'cert.no': 'Số',
      'cert.student': 'Học viên', 'cert.ph': 'Tên của bạn', 'cert.path': 'Con đường', 'cert.out': 'Đầu ra', 'cert.time': 'Thời gian', 'cert.time.v': '12 tháng · 10 ca mỗi tuần',
      'cert.born': 'Năm sinh', 'cert.date': 'Ngày ghi danh', 'cert.wait': 'CHỜ GHI DANH', 'cert.done1': 'ĐÃ', 'cert.done2': 'GHI DANH', 'cert.ring': 'TRUYỀN NGHỀ · KHÓA {y} · DAPPER COMBAT · ',
      'faq.h': 'Câu hỏi thường gặp', 'help.h': 'Còn băn khoăn?', 'help.p': 'Hỏi thẳng Dapper Combat về lịch học, học phí và đầu ra trước khi quyết định.',
      'help.zalo': 'Nhắn Zalo', 'help.call': 'Gọi {p}',
      'dock.t': 'Khóa {y} · {p}', 'dock.left': 'còn {n} ngày tới khai giảng',
      'q1': 'Chưa từng tập boxing có học được không?', 'a1': 'Được. Cả 2 khóa đều bắt đầu từ con số 0. Hiệp đầu tiên (3 tháng đầu) dành cho nền tảng: tư thế, bộ pháp, đòn cơ bản và thể lực.',
      'q2': 'Hai khóa khác nhau ở đâu?', 'a2': 'Cùng khối lượng: 12 tháng, 5 buổi mỗi tuần, 2 ca mỗi ngày. Khác nội dung và mục tiêu: Coach học phương pháp dạy, có 100% cơ hội làm việc tại HVP Academy; Võ sĩ học kỹ thuật, chiến thuật thi đấu và 100% thi đấu dưới màu cờ The Corner.',
      'q3': 'Lịch học cụ thể thế nào?', 'a3': 'Học từ Thứ 2 đến Thứ 6, mỗi ngày 2 ca (sáng và chiều), liên tục 12 tháng kể từ ngày khai giảng {d}.',
      'q4': 'Học phí bao nhiêu, đóng thế nào?', 'a4': '{fee} cho cả khóa 1 năm, Coach và Võ sĩ cùng giá. {how}',
      'q5': 'Học xong thì sao?', 'a5': 'Coach có 100% cơ hội làm việc tại HVP Academy, hoặc tự do tìm việc ở các phòng tập khác. Võ sĩ ở lại tập luyện và 100% được thi đấu dưới màu cờ The Corner.',
      'q7': 'Nếu học xong mà không có việc, hoặc không được thi đấu?', 'a7': 'Bạn được hoàn 100% học phí khi đã đạt tiêu chuẩn mà: với khóa Coach, HVP Academy không sắp xếp được công việc và bạn không tìm được việc ở nơi khác; với khóa Võ sĩ, bạn không được thi đấu dưới màu cờ The Corner.',
      'q8': 'Học Coach xong có bắt buộc làm tại HVP Academy không?', 'a8': 'Không. Bạn có 100% cơ hội làm việc tại HVP Academy, hoặc tự do tìm việc ở các phòng tập khác.',
      'q6': 'Giữ chỗ có mất phí không?', 'a6.free': 'Không. Đăng ký tư vấn trước không mất phí, Dapper Combat gọi lại trước khi bạn đóng học phí.',
      'a6.dep': 'Bạn chọn được: đăng ký tư vấn trước không mất phí, hoặc đặt cọc {d} để giữ chỗ ngay.',
      'how.dep': 'Có thể đặt cọc {d} để giữ chỗ.', 'how.list': 'Đóng bằng: {l}.',
    },
    en: {
      'site.home': 'Home', 'site.shop': 'Shop', 'site.course': 'Courses', 'site.services': 'Gym Setup', 'site.ranking': 'Academy Ranking', 'site.career': 'Pro Pathways',
      'foot.note': 'Pro Pathways is the boxing career program of Dapper Combat.', 'foot.home': 'Back to Dapper Combat',
      'title': 'Pro Pathways — A boxing career in one year | Dapper Combat',
      'h1': 'Pro Pathways', 'special': 'Special program · Class of {y}', 'claim': 'One year. From zero to a boxing career.',
      'side.coach': 'Blue corner · Coach', 'side.fighter': 'Red corner · Fighter', 'bao.coach': 'Job guaranteed', 'bao.fighter': 'Fights guaranteed',
      'baosub.coach': 'A 100% job opportunity at HVP Academy, or free to pick another gym', 'baosub.fighter': '100% fighting in The Corner colours',
      'badge': '100% fee refund guarantee', 'guar.link': 'Backed by a 100% fee refund guarantee',
      'promise.h': 'A 100% commitment, or 100% of your fee back', 'promise.sub': 'You pay for a clear outcome. Meet the standard and still miss that outcome, and you get 100% of the fee back.',
      'pr.paper': 'COMMITMENT', 'pr.k.coach': 'Coach course · Blue corner', 'pr.k.fighter': 'Fighter course · Red corner',
      'pr.big.coach': 'job opportunity at HVP Academy', 'pr.big.fighter': 'fighting in The Corner colours',
      'pr.free.coach': 'Or find work at any other gym, your choice.', 'pr.free.fighter': 'When you finish you stay on to train and are taken to compete.',
      'pr.refund': '100% fee refund', 'pr.if.coach': 'if you meet the standard but HVP Academy cannot place you and you cannot find work elsewhere.',
      'pr.if.fighter': 'if you meet the competition standard but do not get to fight in The Corner colours.',
      'seal.ring': 'GUARANTEE · FEE REFUND · PRO PATHWAYS · ', 'seal.mid': 'REFUND',
      'refund.short.coach': 'Meet the standard, no job: 100% refund', 'refund.short.fighter': 'Meet the standard, no fight: 100% refund',
      'cmp.refund': 'Fee refund', 'cmp.r.coach': '100% if you meet the standard but get no job', 'cmp.r.fighter': '100% if you meet the standard but get no fight',
      'cert.guar': 'Guarantee', 'form.guar': 'The Dapper Combat guarantee',
      'pick.coach': 'I want to coach', 'pick.fighter': 'I want to fight',
      'start': 'Starts {d}', 'clock.d': 'days', 'clock.h': 'hrs', 'clock.m': 'min', 'clock.s': 'sec', 'clock.done': 'The class of {y} has started',
      'per.course': 'full course · {c} per session', 'seats': 'Each course takes at most {n} students',
      'cta.apply': 'Reserve a place for {y}', 'cta.quiz': 'Which corner fits you?',
      'quiz.h': 'Which corner fits you?', 'quiz.sub': '4 questions, under 30 seconds. No wrong answers, just the corner that suits you better.',
      'quiz.n': 'Question {i} / {n}', 'quiz.back': 'Previous', 'quiz.res': 'Your result', 'quiz.again': 'Start over',
      'quiz.r.coach': 'You belong in the blue corner: Coach', 'quiz.r.fighter': 'You belong in the red corner: Fighter', 'quiz.r.tie': 'Both corners fit you',
      'quiz.rs.coach': 'You like making other people better. Finish the year with a 100% job opportunity at HVP Academy.',
      'quiz.rs.fighter': 'You want to step into the ring yourself. Finish the year and you are 100% fighting in The Corner colours.',
      'quiz.rs.tie': 'Pick by where you want to be in 12 months: in front of a class, or in the ring.',
      'quiz.see': 'See the {n} path', 'quiz.go': 'Reserve a {n} place',
      'bar.label': 'Path', 'bar.apply': 'Reserve',
      'road.h': '12 months, 4 rounds', 'road.sub': 'Each round lasts 3 months and ends with a checkpoint. After round 4 comes the first bell of your career.',
      'road.round': 'Round {n}', 'road.mile': 'End-of-round checkpoint', 'road.bell': 'After 12 months',
      'week.h': 'A sample week', 'week.sub': 'Monday to Friday, 2 shifts a day. The timetable is the same for both courses; only what happens in each shift differs.',
      'week.s1': 'Shift 1', 'week.s1d': 'morning', 'week.s2': 'Shift 2', 'week.s2d': 'afternoon', 'week.note': '10 shifts a week on both courses. Switch paths in the bar above to see each shift change.',
      'd1': 'Mon', 'd2': 'Tue', 'd3': 'Wed', 'd4': 'Thu', 'd5': 'Fri',
      'tag.tech': 'Technique', 'tag.fit': 'Conditioning', 'tag.theory': 'Theory', 'tag.teach': 'Teaching practice', 'tag.spar': 'Sparring', 'tag.tactic': 'Tactics',
      'skills.h': '{n} skill set',
      'cmp.h': 'Same workload, different destination', 'cmp.sub': 'Both courses run the same months, sessions and shifts. They differ in what is taught and where it leads.',
      'cmp.same': 'Same', 'cmp.diff': 'Different',
      'cmp.time': 'Length', 'cmp.sched': 'Schedule', 'cmp.fee': 'Fee', 'cmp.content': 'Core content', 'cmp.goal': 'Goal', 'cmp.out': 'When you finish',
      'v.time': '12 months', 'v.sched': '5 sessions a week, 2 shifts a day',
      'fee.h': 'You walk away with a trade', 'fee.sub': 'The full course is {p}, the same for Coach and Fighter. This is what that fee brings you.',
      'w.get': '{n} course: what you get', 'w.pay': 'Full course fee', 'w.same': 'Same for Coach and Fighter',
      'w.sess': 'sessions over 12 months', 'w.sess.d': '52 weeks, 5 days a week, 2 shifts a day',
      'w.rounds': 'training rounds, each ending in a checkpoint', 'w.skills.coach': 'coaching skills', 'w.skills.fighter': 'fight skills',
      'w.job.coach': 'trade to live from: teaching boxing', 'w.job.coach.d': 'Train like a fighter, assist real classes, then lead your own.',
      'w.job.fighter': 'team to fight for: The Corner', 'w.job.fighter.d': 'Scored sparring, in-house fight nights, then your debut.',
      'w.refund': 'of your fee back',
      'dep.only': 'Hold your place today for just', 'dep.fee': 'Full course {p} · {c} per session', 'dep.how': 'deposit, pay by QR code when you enrol',
      'cta.dep': 'Pay {d} deposit, hold my place', 'dock.dep': 'Hold your place for {d}',
      'fee.whole': 'full 12-month course', 'fee.mo': 'per month', 'fee.wk': 'per week · 10 sessions', 'fee.ca': 'per session', 'fee.ca.n': '≈ {n} sessions in total',
      'pay.dep': 'A {d} deposit holds your place', 'pay.bank': 'Bank transfer by QR code', 'pay.card': 'Bank card, Visa / Mastercard (VNPay)', 'pay.isp': 'Instalments on a credit card',
      'pay.ask': 'Payment options are explained when you apply.', 'pay.free': 'Applying for advice is free',
      'form.h': 'Enrol for {y}', 'form.sub': 'Fill in your details and your enrolment paper appears alongside. Dapper Combat will call you back to advise and hold your place.',
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
      'cert.label': 'Enrolment paper preview', 'cert.title': 'Enrolment paper', 'cert.sub': 'Pro Pathways · Class of {y} · Starts {d}', 'cert.no': 'No.',
      'cert.student': 'Student', 'cert.ph': 'Your name', 'cert.path': 'Path', 'cert.out': 'Outcome', 'cert.time': 'Length', 'cert.time.v': '12 months · 10 sessions a week',
      'cert.born': 'Born', 'cert.date': 'Enrolled on', 'cert.wait': 'AWAITING', 'cert.done1': 'ENROLLED', 'cert.done2': YEAR, 'cert.ring': 'PRO PATHWAYS · CLASS OF {y} · DAPPER COMBAT · ',
      'faq.h': 'Questions', 'help.h': 'Still unsure?', 'help.p': 'Ask Dapper Combat directly before you decide: schedule, fees and what happens after.',
      'help.zalo': 'Message on Zalo', 'help.call': 'Call {p}',
      'dock.t': 'Class of {y} · {p}', 'dock.left': '{n} days until the start',
      'q1': 'Can I join if I have never boxed?', 'a1': 'Yes. Both courses start from zero. The first round (the first 3 months) covers the foundations: stance, footwork, basic punches and conditioning.',
      'q2': 'How do the two courses differ?', 'a2': 'Same workload: 12 months, 5 sessions a week, 2 shifts a day. Different content and goal: Coach learns how to teach, with a 100% job opportunity at HVP Academy; Fighter learns competition technique and tactics and is 100% fighting in The Corner colours.',
      'q3': 'What does the timetable look like?', 'a3': 'Monday to Friday, 2 shifts a day (morning and afternoon), for 12 months from the start date, {d}.',
      'q4': 'How much is it and how do I pay?', 'a4': '{fee} for the full one-year course, the same for Coach and Fighter. {how}',
      'q5': 'What happens when I finish?', 'a5': 'Coaches have a 100% job opportunity at HVP Academy, or can find work at any other gym. Fighters stay on to train and are 100% fighting in The Corner colours.',
      'q7': 'What if I finish and get no job, or no fight?', 'a7': 'You get 100% of the fee back if you met the standard and: on the Coach course, HVP Academy cannot place you and you cannot find work elsewhere; on the Fighter course, you do not get to fight in The Corner colours.',
      'q8': 'After the Coach course, do I have to work at HVP Academy?', 'a8': 'No. You have a 100% job opportunity at HVP Academy, or you are free to find work at other gyms.',
      'q6': 'Does reserving a place cost anything?', 'a6.free': 'No. Applying for advice is free; Dapper Combat calls you before you pay any fee.',
      'a6.dep': 'Your choice: apply for advice for free, or pay a {d} deposit to hold your place straight away.',
      'how.dep': 'A {d} deposit holds your place.', 'how.list': 'Pay by: {l}.',
    },
  };
  function t(k, v) {
    var s = (T[en() ? 'en' : 'vi'][k] != null ? T[en() ? 'en' : 'vi'][k] : T.vi[k]);
    if (s == null) s = k;
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
      hash: 'vo-si', corner: p('Góc đỏ', 'Red corner'), name: p('Võ sĩ', 'Fighter'),
      out: p('100% thi đấu dưới màu cờ The Corner', '100% fighting in The Corner colours'),
      content: p('Kỹ thuật, thể lực, chiến thuật thi đấu', 'Technique, conditioning, fight tactics'), goalShort: p('Lên sàn thi đấu', 'Step into the ring'),
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
  // trắc nghiệm: mỗi câu 2 lựa chọn, [Coach, Võ sĩ]
  var QUIZ = [
    [p('Sau 1 năm, bạn muốn mình đang ở đâu?', 'A year from now, where do you want to be?'), p('Đứng lớp, dạy người khác đấm đúng', 'In front of a class, teaching people to punch right'), p('Đứng trên sàn, chờ tiếng chuông', 'In the ring, waiting for the bell')],
    [p('Trong phòng tập, bạn thích vai nào hơn?', 'In the gym, which role do you prefer?'), p('Người cầm đích, hô combo', 'The one holding pads and calling combos'), p('Người đánh vào đích', 'The one hitting the pads')],
    [p('Điều gì làm bạn thấy đáng nhất?', 'What feels most worth it to you?'), p('Thấy học viên tiến bộ nhờ mình', 'Seeing a student improve because of you'), p('Thắng một đối thủ mạnh hơn mình', 'Beating an opponent stronger than you')],
    [p('Áp lực nào bạn sẵn sàng đối mặt?', 'Which pressure are you ready for?'), p('Một lớp 20 người chờ bạn ra bài', 'A class of 20 waiting for your next drill'), p('Một đối thủ chờ bạn ở góc bên kia', 'An opponent waiting in the other corner')],
  ];
  var path = location.hash === '#vo-si' || location.hash === '#fighter' ? 'fighter' : 'coach';
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
      '<span class="tn-side-txt"><small>' + esc(t('side.' + k)) + '</small><strong>' + esc(t('bao.' + k)) + '</strong><span>' + esc(t('baosub.' + k)) + '</span>' +
      '<span class="tn-side-badge">' + esc(t('badge')) + '</span><em class="tn-side-cta">' + esc(t('pick.' + k)) + '</em></span></button>';
  }
  // nút giữ chỗ: có nhận cọc → "Đặt cọc 2 triệu giữ chỗ" (chọn sẵn đặt cọc trong form)
  function applyBtn(cls) {
    return DEP_ON ? '<a class="tn-btn' + (cls ? ' ' + cls : '') + '" href="#dang-ky" data-pick-pay="deposit">' + esc(t('cta.dep', { d: moneyShort(DEPOSIT) })) + '</a>'
      : '<a class="tn-btn' + (cls ? ' ' + cls : '') + '" href="#dang-ky">' + esc(t('cta.apply', { y: YEAR })) + '</a>';
  }
  function clock() {
    return '<div class="tn-clock" data-clock aria-live="off">' + ['d', 'h', 'm', 's'].map(function (u) {
      return '<span><b data-u="' + u + '">00</b><small>' + esc(t('clock.' + u)) + '</small></span>';
    }).join('') + '</div>';
  }
  function hero() {
    return '<section class="tn-hero" id="top"><div class="tn-split">' + side('coach') + side('fighter') +
      '<div class="tn-hero-mid"><p class="tn-special"><span>' + esc(t('special', { y: YEAR })) + '</span></p><h1>' + esc(t('h1')) + '</h1><p class="tn-claim">' + esc(t('claim')) + '</p></div></div>' +
      '<div class="tn-strip"><div class="tn-in tn-strip-in">' +
        '<div class="tn-start"><b>' + esc(t('start', { d: startText() })) + '</b>' + clock() + '</div>' +
        '<div class="tn-strip-price">' + (DEP_ON ? '<small>' + esc(t('dep.only')) + '</small><b>' + esc(money(DEPOSIT)) + '</b><span>' + esc(t('dep.fee', { p: money(PRICE), c: approx(PRICE / SESS) })) + '</span>'
          : '<b>' + esc(money(PRICE)) + '</b><span>' + esc(t('per.course', { c: approx(PRICE / SESS) })) + '</span>') + (SEATS ? '<span class="tn-seats">' + esc(t('seats', { n: SEATS })) + '</span>' : '') + '<a class="tn-guar" href="#cam-ket">' + esc(t('guar.link')) + '</a></div>' +
        '<div class="tn-strip-cta">' + applyBtn() + '<a class="tn-link" href="#trac-nghiem">' + esc(t('cta.quiz')) + '</a></div>' +
      '</div></div></section>';
  }
  function quizHtml() {
    if (quiz.i >= QUIZ.length) {
      var c = quiz.ans.filter(function (a) { return a === 'coach'; }).length, f = quiz.ans.length - c;
      var r = c > f ? 'coach' : f > c ? 'fighter' : 'tie';
      var btns = (r === 'tie' ? ORDER : [r]).map(function (k) {
        return '<button type="button" class="tn-btn ' + k + '" data-path="' + k + '" data-go="dang-ky">' + esc(t('quiz.go', { n: L(P[k].name) })) + '</button>' +
          (r === 'tie' ? '' : '<button type="button" class="tn-btn ghost" data-path="' + k + '" data-go="lo-trinh">' + esc(t('quiz.see', { n: L(P[k].name) })) + '</button>');
      }).join('');
      return '<div class="tn-q tn-q-res ' + r + '" role="status"><p class="tn-q-n">' + esc(t('quiz.res')) + '</p><h3>' + esc(t('quiz.r.' + r)) + '</h3><p class="tn-q-rs">' + esc(t('quiz.rs.' + r)) + '</p>' +
        '<div class="tn-q-go">' + btns + '</div><button type="button" class="tn-q-back" data-quiz="again">' + esc(t('quiz.again')) + '</button></div>';
    }
    var q = QUIZ[quiz.i];
    return '<div class="tn-q"><ol class="tn-q-dots" aria-hidden="true">' + QUIZ.map(function (x, i) { return '<li class="' + (i < quiz.i ? 'done ' + quiz.ans[i] : i === quiz.i ? 'cur' : '') + '"></li>'; }).join('') + '</ol>' +
      '<p class="tn-q-n">' + esc(t('quiz.n', { i: quiz.i + 1, n: QUIZ.length })) + '</p><h3>' + esc(L(q[0])) + '</h3>' +
      '<div class="tn-q-a"><button type="button" class="coach" data-ans="coach">' + esc(L(q[1])) + '</button><button type="button" class="fighter" data-ans="fighter">' + esc(L(q[2])) + '</button></div>' +
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
        '<ul>' + r.items.map(function (it) { return '<li>' + esc(L(it)) + '</li>'; }).join('') + '</ul><p class="tn-rd-mile"><small>' + esc(t('road.mile')) + '</small>' + esc(L(r.mile)) + '</p></li>';
    }).join('') + '</ol><div class="tn-bell"><span class="tn-bell-ic" aria-hidden="true"></span><p><small>' + esc(t('road.bell')) + '</small><b>' + esc(L(x.out)) + '</b><span class="tn-bell-alt">' + esc(t('refund.short.' + path)) + '</span></p>' +
      '<a class="tn-btn" href="#dang-ky">' + esc(t('quiz.go', { n: L(x.name) })) + '</a></div>';
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
  // giống nhau: 1 dòng mờ ở trên; khác nhau: bảng 2 cột xanh / đỏ, chữ to — đầu ra + hoàn học phí nổi nhất
  function compare() {
    var same = [['cmp.time', t('v.time')], ['cmp.sched', t('v.sched')], ['cmp.fee', money(PRICE)]];
    var diff = [['cmp.content', L(P.coach.content), L(P.fighter.content)], ['cmp.goal', L(P.coach.goalShort), L(P.fighter.goalShort)],
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
  // cán cân giá trị: trái = những gì nhận về (số to, theo con đường đang xem), phải = học phí gọn nhỏ + giữ chỗ
  function fee() {
    var x = P[path], k = path, ways = payWays().filter(function (w, i) { return !(DEP_ON && i === 0); });
    var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
    var rows = [
      [String(SESS), t('w.sess'), t('w.sess.d')],
      ['4', t('w.rounds'), x.rounds.map(function (r) { return L(r.t); }).join(' → ')],
      [String(x.skills.length), t('w.skills.' + k), x.skills.map(function (s) { return L(s[0]); }).join(', ')],
      ['1', t('w.job.' + k), t('w.job.' + k + '.d')],
      ['100%', t('pr.big.' + k), t('pr.free.' + k), 'out'],
      ['100%', t('w.refund'), cap(t('pr.if.' + k)), 'ref'],
    ];
    return '<div class="tn-worth"><div class="tn-worth-get ' + k + '"><p class="tn-worth-k">' + esc(t('w.get', { n: L(x.name) })) + '</p><ul>' + rows.map(function (r) {
        return '<li' + (r[3] ? ' class="' + r[3] + '"' : '') + '><b>' + esc(r[0]) + '</b><p><strong>' + esc(r[1]) + '</strong><span>' + esc(r[2]) + '</span></p></li>';
      }).join('') + '</ul></div>' +
      '<aside class="tn-worth-pay"><p class="tn-worth-k">' + esc(t('w.pay')) + '</p><p class="tn-fee-v">' + esc(money(PRICE)) + '</p>' +
        '<ul class="tn-worth-per"><li>' + esc(approx(PRICE / SESS)) + ' ' + esc(t('fee.ca')) + '</li><li>' + esc(approx(PRICE / 12)) + ' ' + esc(t('fee.mo')) + '</li><li>' + esc(t('w.same')) + '</li></ul>' +
        (DEP_ON ? '<div class="tn-worth-dep"><small>' + esc(t('dep.only')) + '</small><b>' + esc(money(DEPOSIT)) + '</b><span>' + esc(t('dep.how')) + '</span></div>' : '') +
        applyBtn('wide') + '<ul class="tn-worth-ways">' + (ways.length ? ways : [t('pay.ask')]).map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') +
        '<li class="free">' + esc(t('pay.free')) + '</li></ul></aside></div>';
  }
  // giấy nhập môn: tên / năm sinh cập nhật khi gõ, đóng dấu đỏ khi ghi danh xong
  function seal(done) {
    var ring = t('cert.ring', { y: YEAR });
    return '<svg class="tn-cert-seal" viewBox="0 0 160 160" aria-hidden="true"><defs><path id="tnSealP" d="M80 80 m-58 0 a58 58 0 1 1 116 0 a58 58 0 1 1 -116 0"/></defs>' +
      '<circle cx="80" cy="80" r="74" class="o"/><circle cx="80" cy="80" r="44" class="i"/>' +
      '<text class="r" textLength="362" lengthAdjust="spacing"><textPath href="#tnSealP">' + esc(ring) + '</textPath></text>' +
      (done ? '<text x="80" y="76" text-anchor="middle" class="b">' + esc(t('cert.done1')) + '</text><text x="80" y="98" text-anchor="middle" class="b2">' + esc(t('cert.done2')) + '</text>'
        : '<text x="80" y="86" text-anchor="middle" class="w">' + esc(t('cert.wait')) + '</text>') + '</svg>';
  }
  function cert() {
    var x = P[path], d = done && done.path === path ? done : null, v = saved || {};
    return '<div class="tn-cert ' + path + (d ? ' stamped' + (stampNow ? ' stamp-now' : '') : '') + '" role="img" aria-label="' + esc(t('cert.label')) + '">' +
      '<div class="tn-cert-top"><span>DAPPER COMBAT</span><span>' + esc(t('cert.no')) + ' <b data-cert-code>' + esc(d ? d.code : '—') + '</b></span></div>' +
      '<p class="tn-cert-title">' + esc(t('cert.title')) + '</p><p class="tn-cert-sub">' + esc(t('cert.sub', { y: YEAR, d: startText() })) + '</p>' +
      '<p class="tn-cert-lbl">' + esc(t('cert.student')) + '</p><p class="tn-cert-name' + (d || v.name ? '' : ' ph') + '" data-cert-name>' + esc(d ? d.name : v.name || t('cert.ph')) + '</p>' +
      '<dl class="tn-cert-dl"><div><dt>' + esc(t('cert.path')) + '</dt><dd>' + esc(L(x.name) + ' · ' + L(x.corner)) + '</dd></div><div><dt>' + esc(t('cert.out')) + '</dt><dd>' + esc(L(x.out)) + '</dd></div>' +
        '<div><dt>' + esc(t('cert.time')) + '</dt><dd>' + esc(t('cert.time.v')) + '</dd></div><div><dt>' + esc(t('cert.born')) + '</dt><dd data-cert-year>' + esc((d ? d.year : v.year) || '—') + '</dd></div></dl>' +
      '<p class="tn-cert-guar"><small>' + esc(t('cert.guar')) + '</small>' + esc(t('refund.short.' + path)) + '</p>' +
      '<div class="tn-cert-foot"><p><small>' + esc(t('cert.date')) + '</small>' + esc(today()) + '</p>' + seal(!!d) + '</div></div>';
  }
  function form() {
    var opts = [['consult', t('opt.consult'), t('opt.consult.s')]];
    if (DEP_ON) opts.push(['deposit', t('opt.deposit', { d: money(DEPOSIT) }), t('opt.deposit.s')]);
    if (CAN_PAY) opts.push(['full', t('opt.full', { p: money(PRICE) }), t('opt.full.s') + (ISP ? '. ' + t('opt.full.isp') : '')]);
    var pay = saved && saved.pay && opts.some(function (o) { return o[0] === saved.pay; }) ? saved.pay : 'consult';
    return '<form class="tn-form" novalidate><fieldset class="tn-pick"><legend>' + esc(t('form.path')) + '</legend>' + ORDER.map(function (k) {
      return '<label class="' + k + '"><input type="radio" name="path" value="' + k + '"' + (path === k ? ' checked' : '') + '><span><small>' + esc(L(P[k].corner)) + '</small><b>' + esc(L(P[k].name)) + '</b><em>' + esc(L(P[k].out)) + '</em></span></label>';
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
      '<div class="tn-form-guar"><span class="tn-mini-seal" aria-hidden="true">100%</span><p><b>' + esc(t('form.guar')) + '</b>' + esc(L(P[path].out)) + '. ' + esc(t('refund.short.' + path)) + '.</p></div>' +
      '<p class="tn-err" role="alert" hidden></p><button class="tn-btn" type="submit" data-send>' + esc(t('send.' + pay)) + '</button></form>';
  }
  function okHtml(r) {
    var payNote = r.due > 0 ? '<div class="tn-paybox"><p class="tn-paybox-t">' + esc(t('ok.pay', { what: t('ok.what.' + r.pay), d: money(r.due), note: String(r.code).replace(/[^A-Za-z0-9]/g, '') })) + '</p>' +
      (DC.payQr && BANK ? '<div class="tn-paybox-qr">' + (DC.payQr(r.code, r.due) || '') + (DC.payLines ? DC.payLines(r.code) : '') + '</div>' : '') +
      '<div class="dc-paylive" id="tnPayLive"></div></div>' : '';
    return '<div class="tn-ok" role="status"><span class="tn-ok-ic" aria-hidden="true"></span><h3>' + esc(t('ok.h')) + '</h3><p>' + esc(t('ok.p', { c: r.code, ph: r.phone, n: L(P[r.path].name) })) + '</p>' +
      payNote + (r.slip && DC.slip ? DC.slip.box(r.slip, DC.lang()) : '') + '<button type="button" class="tn-btn ghost" data-again>' + esc(t('ok.again')) + '</button></div>';
  }
  function faq() {
    var ways = payWays().filter(function (w, i) { return !(DEP_ON && i === 0); });
    var how = (DEP_ON ? t('how.dep', { d: money(DEPOSIT) }) + ' ' : '') + (ways.length ? t('how.list', { l: ways.join(', ') }) : t('pay.ask'));
    var qa = [1, 2, 3, 4, 5, 7, 8, 6].map(function (i) {
      var a = i === 6 ? (DEP_ON ? t('a6.dep', { d: money(DEPOSIT) }) : t('a6.free')) : t('a' + i, { d: startText(true), fee: money(PRICE), how: how });
      return '<details><summary>' + esc(t('q' + i)) + '</summary><p>' + esc(a) + '</p></details>';
    }).join('');
    var help = '<aside class="tn-help"><h3>' + esc(t('help.h')) + '</h3><p>' + esc(t('help.p')) + '</p><div class="tn-help-b">' +
      (C.zalo ? '<a class="tn-btn" href="' + esc(C.zalo) + '" target="_blank" rel="noopener">' + esc(t('help.zalo')) + '</a>' : '') +
      (PHONE ? '<a class="tn-btn ghost" href="tel:' + esc(PHONE.replace(/[^\d+]/g, '')) + '">' + esc(t('help.call', { p: PHONE })) + '</a>' : '') + '</div></aside>';
    return '<div class="tn-faq-wrap"><div class="tn-faq">' + qa + '</div>' + (C.zalo || PHONE ? help : '') + '</div>';
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
  var sec = function (id, h, sub, body, cls) { return '<section class="tn-sec' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="tn-in"><header class="tn-sec-h"><h2>' + h + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</header>' + body + '</div></section>'; };

  /* ─── Vẽ trang ────────────────────────────────────────────────────────── */
  var saved = null, done = null, swT, stampNow = false;
  function render() {
    [].forEach.call(document.querySelectorAll('[data-t]'), function (el) { el.textContent = t(el.getAttribute('data-t')); });
    document.title = t('title');
    document.body.setAttribute('data-path', path);
    root.innerHTML = hero() +
      sec('cam-ket', esc(t('promise.h')), esc(t('promise.sub')), promise(), 'tn-sec-pr') +
      sec('trac-nghiem', esc(t('quiz.h')), esc(t('quiz.sub')), '<div class="tn-quiz">' + quizHtml() + '</div>', 'tn-sec-quiz') +
      bar() +
      sec('lo-trinh', esc(t('road.h')), esc(t('road.sub')), road()) +
      sec('tuan-hoc', esc(t('week.h')), esc(t('week.sub')), week(), 'alt') +
      sec('ky-nang', esc(t('skills.h', { n: L(P[path].name) })), '', skills()) +
      sec('so-sanh', esc(t('cmp.h')), esc(t('cmp.sub')), compare(), 'alt') +
      sec('hoc-phi', esc(t('fee.h')), esc(t('fee.sub', { p: money(PRICE) })), fee(), 'tn-sec-fee') +
      sec('dang-ky', esc(t('form.h', { y: YEAR })), esc(t('form.sub')), '<div class="tn-apply"><div class="tn-form-box">' + (done ? okHtml(done) : form()) + '</div><div class="tn-cert-wrap">' + cert() + '</div></div>', 'tn-sec-apply') +
      sec('hoi-dap', esc(t('faq.h')), '', faq(), 'alt') +
      '<div class="tn-dock" aria-hidden="true"><p><b>' + esc(DEP_ON ? t('dock.dep', { d: moneyShort(DEPOSIT) }) : t('dock.t', { y: YEAR, p: moneyShort(PRICE) })) + '</b><small>' + esc(t('dock.left', { n: daysLeft() })) + '</small></p><a class="tn-btn sm" href="#dang-ky" tabindex="-1">' + esc(t('bar.apply')) + '</a></div>';
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
    if (ms <= 0) { el.innerHTML = '<span class="tn-clock-done">' + esc(t('clock.done', { y: YEAR })) + '</span>'; return; }
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
    if (a) { quiz.ans[quiz.i] = a.getAttribute('data-ans'); quiz.i++; swapQuiz(); return; }
    var q = e.target.closest('[data-quiz]');
    if (q) { if (q.getAttribute('data-quiz') === 'back') quiz.i = Math.max(0, quiz.i - 1); else quiz = { i: 0, ans: [] }; swapQuiz(); return; }
    var b = e.target.closest('[data-path]');
    if (b && b.tagName === 'BUTTON') { choose(b.getAttribute('data-path'), b.getAttribute('data-go')); return; }
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
    var yr = +year, now = new Date().getFullYear();
    if (year && !(yr >= now - 70 && yr <= now - 10)) return fail(t('err.year'), 'year');
    err.hidden = true; btn.disabled = true; btn.textContent = t('form.sending');
    var exp = T.vi['exp.' + el.exp.value] || '';
    DC.api('/registrations', {
      name: name, phone: phone, email: el.email.value.trim(), program: k, programName: 'Truyền Nghề · ' + P[k].name.vi,
      detail: 'Khai giảng ' + startText() + (year ? ' · sinh năm ' + year : '') + ' · kinh nghiệm: ' + exp, note: el.note.value.trim(),
      pay: pay, payName: T.vi['payname.' + pay], lang: en() ? 'en' : 'vi',
    }).then(function (r) {
      var due = pay === 'full' ? PRICE : pay === 'deposit' ? DEPOSIT : 0;
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
