
const DICT={
 // ticker (row2)
 "Free Shipping toàn quốc":"Free shipping nationwide","Học thử miễn phí":"Free trial class","HLV đai đen BJJ":"BJJ black-belt coach","500+ thành viên":"500+ members","Sài Gòn · Việt Nam":"Saigon · Vietnam",
 // nav
 "GIỎ (0)":"CART (0)","ĐĂNG KÝ":"SIGN UP",
 // hero
 "Premium training gear & knowledge for serious fighters. Sài Gòn.":"Premium training gear & knowledge for serious fighters. Saigon.",
 "KHÁM PHÁ SHOP":"EXPLORE SHOP","XEM KHÓA HỌC":"VIEW COURSES","CUỘN XUỐNG":"SCROLL",
 // philosophy
 "TRIẾT LÝ CỦA CHÚNG TÔI":"OUR PHILOSOPHY","KHÔNG ĐƠN":"NOT JUST","THUẦN LÀ":"ANOTHER","THỂ THAO":"SPORT",
 "\"Kỷ luật trên thảm đấu tạo nên con người bên ngoài cuộc đời.\"":"\"Discipline on the mat builds the person off it.\"",
 "Dapper Combat ra đời từ niềm tin rằng võ thuật không chỉ là kỹ thuật — đó là cách rèn luyện tư duy, ý chí và nhân cách. Tại đây, mỗi buổi tập là một bài học về sự kiên nhẫn, kỷ luật và phát triển bản thân.":"Dapper Combat was born from the belief that martial arts are not just technique — they train the mind, the will and the character. Here, every session is a lesson in patience, discipline and self-growth.",
 "Chúng tôi không tạo ra vận động viên. Chúng tôi tạo ra những con người mạnh mẽ hơn.":"We don't make athletes. We make stronger human beings.",
 "Kỹ thuật chính xác":"Precise technique","Thể lực đỉnh cao":"Peak conditioning","Tư duy chiến lược":"Strategic mind","Cộng đồng vững mạnh":"Strong community",
 // instructor
 "HUẤN LUYỆN VIÊN TRƯỞNG":"HEAD COACH","Cựu vô địch quyền anh quốc gia":"Former national boxing champion",
 "Đai đen BJJ đệ nhị đẳng. Khoa đã dành hơn 15 năm nghiên cứu và huấn luyện các môn võ thuật chiến đấu tại Việt Nam, Thái Lan và Brazil. Triết lý của anh đơn giản: kỷ luật trên thảm đấu tạo nên con người bên ngoài cuộc đời.":"Second-degree BJJ black belt. Khoa has spent over 15 years studying and coaching combat martial arts across Vietnam, Thailand and Brazil. His philosophy is simple: discipline on the mat builds the person off it.",
 "Học viên":"Students","Đai đen":"Black belt","Vô địch":"Champion","Năm KN":"Years exp.","Sài Gòn":"Saigon",
 // courses
 "KHÓA HỌC NỔI BẬT":"FEATURED COURSES","HỌC TỪ":"LEARN FROM","NGƯỜI THẬT":"REAL FIGHTERS","XEM TẤT CẢ":"VIEW ALL",
 "Kỹ thuật cơ bản quyền anh: stance, jab, cross, hook và phòng thủ cho người mới bắt đầu.":"Boxing basics: stance, jab, cross, hook and defense for absolute beginners.",
 "Phối hợp đòn phức tạp, footwork nâng cao và chiến thuật thi đấu thực chiến.":"Complex combinations, advanced footwork and real fight tactics.",
 "Chương trình thể lực chuyên biệt cho võ sĩ: sức mạnh, sức bền và tốc độ phản xạ.":"Fighter-specific conditioning: strength, endurance and reaction speed.",
 "Làm chủ 8 bộ phận tấn công của Muay Thai: đấm, đá, gối, khuỷu tay từ căn bản.":"Master the 8 weapons of Muay Thai: punches, kicks, knees and elbows from the basics.",
 "Kỹ thuật vật lộn dưới sàn, kiểm soát vị trí, khóa khớp và siết cổ căn bản BJJ.":"Ground grappling, positional control, joint locks and chokes — BJJ fundamentals.",
 "Tăng tốc độ ra đòn và sức mạnh tối đa qua các bài tập plyometric và kỹ thuật tạ.":"Boost punching speed and max power through plyometrics and weight work.",
 "Thể lực":"Conditioning","ĐĂNG KÝ →":"ENROLL →",
 // shop video banner
 "BỘ SƯU TẬP MỚI · 2026":"NEW COLLECTION · 2026","Trang bị thi đấu & thời trang đường phố cho chiến binh. Giao hàng toàn quốc.":"Fight gear & streetwear for warriors. Nationwide delivery.",
 // image banner 1
 "SỐNG TRỌN":"LIVE THE","TINH THẦN VÕ ĐÀI":"FIGHTER SPIRIT","Kỷ luật, mồ hôi và bản lĩnh — tinh thần Dapper Combat trong từng khoảnh khắc.":"Discipline, sweat and grit — the Dapper Combat spirit in every moment.",
 // product grid
 "SẢN PHẨM":"FEATURED","NỔI BẬT":"PRODUCTS","Găng tay":"Gloves","Áo thun":"Tee","Hoodie":"Hoodie","Phụ kiện":"Accessory","Đồ tập":"Training","THÊM VÀO GIỎ":"ADD TO CART",
 // training banner
 "RÈN LUYỆN":"TRAIN TO","ĐỂ CHIẾN ĐẤU":"FIGHT","Kỹ thuật chính xác. Thể lực đỉnh cao. Tư duy của nhà vô địch.":"Precise technique. Peak conditioning. A champion's mindset.",
 // image banner 2
 "TRANG BỊ CHO":"GEAR UP FOR","CHIẾN BINH":"THE FIGHT","Từ sàn tập đến đường phố — bộ sưu tập gear & apparel chính hãng Dapper Combat.":"From the mat to the street — the official Dapper Combat gear & apparel collection.",
 // community
 "THAM GIA CỘNG ĐỒNG":"JOIN THE COMMUNITY","CÙNG NHAU":"FIGHT","CHIẾN ĐẤU":"TOGETHER",
 "Dapper Combat không chỉ là nơi học kỹ thuật — đây là cộng đồng của những người tin vào sự rèn luyện bền bỉ. Hàng trăm học viên đang chia sẻ hành trình, hỗ trợ nhau mỗi ngày.":"Dapper Combat is more than a place to learn technique — it's a community that believes in relentless training. Hundreds of students share the journey and support each other every day.",
 "Thành viên":"Members","Năm hoạt động":"Years running","Miễn phí tham gia":"Free to join","Sài Gòn, Việt Nam":"Saigon, Vietnam",
 // reviews
 "HỌC VIÊN NÓI GÌ":"WHAT STUDENTS SAY","ĐÁNH GIÁ":"REVIEWS","TỪ CỘNG ĐỒNG":"FROM THE COMMUNITY",
 "Học viên Boxing":"Boxing student","Học viên Muay Thai":"Muay Thai student","Học viên BJJ":"BJJ student",
 "\"HLV Khoa dạy rất tận tâm. Sau 3 tháng tôi tự tin hơn hẳn, jab-cross giờ thành phản xạ.\"":"\"Coach Khoa is incredibly dedicated. After 3 months I'm far more confident — jab-cross is now reflex.\"",
 "\"Lớp Muay Thai cực đã, vừa giảm cân vừa học tự vệ. Cộng đồng ở đây rất thân thiện.\"":"\"The Muay Thai class is amazing — lost weight and learned self-defense. Super friendly community.\"",
 "\"BJJ khó nhưng gây nghiện. Thầy chỉ từng chi tiết siết và khóa khớp rất kỹ. Đáng tiền.\"":"\"BJJ is hard but addictive. Coach breaks down every choke and lock in detail. Worth every penny.\"",
 "\"Thể lực cải thiện rõ rệt sau khóa conditioning. Bài tập nặng nhưng hiệu quả thật sự.\"":"\"My conditioning improved dramatically after the course. Tough workouts, real results.\"",
 "\"Gym sạch, đồ xịn, HLV nhiệt. Mình đi tập mỗi ngày không chán. 10 điểm không nhưng.\"":"\"Clean gym, quality gear, passionate coaches. I train daily and never get bored. 10/10.\"",
 "\"Môi trường tập rất tôn trọng. Từ người chưa biết gì giờ mình đấm pad ngon lành.\"":"\"A very respectful training environment. From zero experience to hitting pads like a pro.\"",
 "\"Khóa combinations nâng tầm hẳn. Footwork và combo giờ mượt hơn nhiều so với trước.\"":"\"The combinations course leveled me up. Footwork and combos are much smoother now.\"",
 "\"Tốc độ ra đòn tăng rõ. Giáo án bài bản, có đo lường tiến bộ từng tuần rất khoa học.\"":"\"Noticeably faster strikes. A structured program with measurable weekly progress.\"",
 "\"Chị em tập BJJ ở đây đông vui. Thầy kiên nhẫn, chú trọng an toàn. Rất recommend!\"":"\"Lots of women train BJJ here — fun and welcoming. Patient coach, safety-first. Highly recommend!\"",
 "\"Giá hợp lý so với chất lượng. Phụ kiện DC cũng bền đẹp, dùng rất thích.\"":"\"Great value for the quality. DC gear is durable and good-looking too.\"",
 "\"Giảm 8kg sau 2 tháng, vừa khỏe vừa biết đánh. Quá hời so với số tiền bỏ ra.\"":"\"Lost 8kg in 2 months — fitter and able to fight. A steal for the price.\"",
 "\"Không gian chất, nhạc hay, tập quên mệt. HLV luôn sửa động tác tận tình từng người.\"":"\"Cool space, great music, you forget you're tired. Coaches correct everyone personally.\"",
 "\"Lên sàn sparring mới thấy giá trị bài học. Thầy dạy chiến thuật thực chiến rất hay.\"":"\"Sparring shows the real value of the lessons. Coach teaches genuine fight tactics.\"",
 "\"Plyometric khó nhằn nhưng rất đáng. Sức mạnh cú đấm tăng thấy rõ sau mỗi tuần.\"":"\"Plyometrics are brutal but worth it. My punching power visibly grows each week.\"",
 "\"Cộng đồng Dapper Combat như một gia đình. Tập xong còn rủ nhau đi ăn. Mê luôn!\"":"\"The Dapper Combat community is like family. We grab food after training. Love it!\"",
 // CTA
 "GIỚI HẠN CHỈ CÒN — THÁNG NÀY":"LIMITED SPOTS — THIS MONTH","BƯỚC VÀO":"STEP INTO","THẢM ĐẤU":"THE RING",
 "ĐĂNG KÝ HỌC THỬ MIỄN PHÍ":"BOOK A FREE TRIAL","XEM LỊCH KHAI GIẢNG":"SEE CLASS SCHEDULE",
 // map / locate
 "GHÉ THĂM CHÚNG TÔI":"VISIT US","PHÒNG TẬP &":"GYM &","CỬA HÀNG":"STORE",
 "Địa chỉ":"Address","Giờ mở cửa":"Opening hours","Liên hệ":"Contact",
 "Lầu 3, 104 Quốc Hướng,":"3rd Floor, 104 Quoc Huong,","P. An Khánh, TP. Thủ Đức, TP.HCM":"An Khanh Ward, Thu Duc City, HCMC",
 "30 Đường 128, Phường Phước Long,":"30 Street 128, Phuoc Long Ward,",
 "30 Đường 128, Phước Long,":"30 Street 128, Phuoc Long,","TP. Thủ Đức, TP. Hồ Chí Minh":"Thu Duc City, Ho Chi Minh City","TP. Thủ Đức, TP.HCM":"Thu Duc City, HCMC","TP. Hồ Chí Minh, Việt Nam":"Ho Chi Minh City, Vietnam","30 Đường 128, Phước Long":"30 Street 128, Phuoc Long",
 "Hotline: 0909 xxx xxx":"Hotline: 0909 xxx xxx","Nhắn tư vấn":"Chat with us","Zalo / Facebook: Dapper Combat":"Zalo / Facebook: Dapper Combat",
 "CHỈ ĐƯỜNG GOOGLE MAPS →":"GET DIRECTIONS →",
 // footer
 "Pioneering the fight lifestyle. Premium training gear & knowledge for serious fighters. Sài Gòn, Việt Nam.":"Pioneering the fight lifestyle. Premium training gear & knowledge for serious fighters. Saigon, Vietnam.",
 "Về chúng tôi":"About us","3rd Floor, 104 Quốc Hướng":"3rd Floor, 104 Quoc Huong","An Khánh, TP.HCM":"An Khanh, HCMC","Chính sách đổi trả":"Return policy","Liên hệ":"Contact","Xem tất cả":"View all",
 "© 2026 DAPPER COMBAT. BẢO LƯU MỌI QUYỀN.":"© 2026 DAPPER COMBAT. ALL RIGHTS RESERVED.",
 "Từ hơn 138 học viên":"From 138+ students",
 "MUA NGAY →":"BUY NOW →",
 "GỌI HOTLINE":"CALL HOTLINE",
 "BÁN CHẠY":"BESTSELLER",
 "MỚI":"NEW",
 "Đã bán 250+":"250+ sold",
 "Đã bán 180+":"180+ sold",
 "Đã bán 120+":"120+ sold",
 "Đã bán 90+":"90+ sold",
 "Đã bán 60+":"60+ sold",
 "Đã bán 75+":"75+ sold",
 // home course cards + hero trust
 "Bài bản nhất":"Most structured",
 "Phổ biến":"Popular",
 "Ưu đãi":"Student deal",
 "Tự do":"Flexible",
 "1 kèm 1":"1-on-1",
 "Miễn phí":"Free",
 "Nền tảng · 12 tuần":"Foundation · 12 weeks",
 "Mọi trình độ":"All levels",
 "Học sinh · Sinh viên":"Students",
 "Linh hoạt":"Flexible access",
 "Cá nhân":"Personal",
 "Người mới":"Beginners",
 "Lớp HSSV":"Student Class",
 "Buổi tập thử":"Trial Session",
 "Giáo án 12 tuần · 36 buổi. Baseline → Final Assessment, Phong Dapper trực tiếp đứng lớp.":"A 12-week · 36-session syllabus. Baseline → Final Assessment, taught in person by Phong Dapper.",
 "Tập kỹ thuật & thể lực cùng HLV, linh hoạt sáng/tối. Gói 1 / 3 / 6 / 12 tháng.":"Technique & conditioning with a coach, flexible morning/evening. 1 / 3 / 6 / 12-month plans.",
 "Tập tự do trong giờ mở cửa 09:00 – 20:00, không cố định lịch. Chủ động thời gian.":"Train freely during opening hours 09:00 – 20:00, no fixed schedule. On your own time.",
 "Huấn luyện 1 kèm 1, giáo án cá nhân hóa theo mục tiêu và lịch của bạn.":"One-on-one coaching, a program personalized to your goals and schedule.",
 "Trải nghiệm một buổi tập thực tế, được HLV hướng dẫn và tư vấn lộ trình phù hợp.":"Experience a real session, guided by a coach with advice on the right path for you.",
 "Từ 1.000.000đ":"From 1,000,000đ",
 "800.000đ/tháng":"800,000đ/month",
 "Theo yêu cầu":"On request",
 "Đăng ký thử":"Book a trial",
 "TÌM HIỂU →":"LEARN MORE →",
 "XEM GÓI →":"VIEW PLANS →",
 "LIÊN HỆ →":"CONTACT →",
 "TẬP THỬ →":"TRY IT →",
 "138+ học viên":"138+ students","HLV Boxing":"Boxing coaches",
 "PT 1-1 · Cá nhân":"1-on-1 PT · Personal"
};
(function(){
  const nodes=[];
  (function walk(el){
    for(const n of el.childNodes){
      if(n.nodeType===3){ const k=n.nodeValue.trim(); if(k && DICT[k]!==undefined) nodes.push({node:n,orig:n.nodeValue,key:k}); }
      else if(n.nodeType===1 && n.tagName!=="SCRIPT" && n.tagName!=="STYLE") walk(n);
    }
  })(document.body);
  let lang="vi";
  function setLang(l){
    lang=l; document.documentElement.lang=l;
    nodes.forEach(t=>{ t.node.nodeValue = (l==="en") ? t.orig.replace(t.key, DICT[t.key]) : t.orig; });
    document.querySelectorAll(".lang-switch button").forEach(b=>b.classList.toggle("on",b.dataset.lang===l));
  }
  document.querySelector(".lang-switch").addEventListener("click",e=>{const b=e.target.closest("[data-lang]");if(b)setLang(b.dataset.lang);});
})();
