
const IMG={gloves:"/assets/media/bc3dad0ad714.jpg",gloves2:"/assets/media/3ce28cc822e3.jpg",apparel:"/assets/media/a406800d7ac8.jpg",hoodie:"/assets/media/004df67b4e85.jpg",cap:"/assets/media/e5a62861c4e3.jpg",duffel:"/assets/media/54fdef235c18.jpg",shorts:"/assets/media/9beb4e3b2965.jpg",wraps:"/assets/media/5e72dec5065d.jpg"};
const AV=["/assets/media/d23e3c2d57c6.jpg","/assets/media/0d7b90964d2f.jpg","/assets/media/ef6aa223f2d8.jpg","/assets/media/2470aa607bdf.jpg","/assets/media/a8deb0806ecb.jpg","/assets/media/112748d47b5b.jpg","/assets/media/6aba4dd7477e.jpg","/assets/media/d56ab49a7ed4.jpg","/assets/media/9160d736e23d.jpg","/assets/media/eab248b40842.jpg","/assets/media/5a07520e6fd7.jpg","/assets/media/d6f3b19b1df2.jpg","/assets/media/a8f32356a224.jpg","/assets/media/e988622475cc.jpg","/assets/media/733eb61b43d0.jpg"];
const VIDS=[DC.m("shop.js.m1","/assets/media/7393f9263e64.mp4"),DC.m("shop.js.m2","/assets/media/b160f97b50f7.mp4")];

const T={
 vi:{"nav.home":DC.x("shop.nav.home",0,"Trang chủ"),"nav.shop":DC.x("shop.nav.shop",0,"Shop"),"nav.courses":DC.x("shop.nav.courses",0,"Khóa học"),"nav.cart":DC.x("shop.nav.cart",0,"Giỏ"),
  "shop.h1":DC.x("shop.shop.h1",0,"TRANG BỊ CHO"),"shop.h2":DC.x("shop.shop.h2",0,"CHIẾN BINH"),
  "cat.all":DC.x("shop.cat.all",0,"Tất cả"),
  "card.add":DC.x("shop.card.add",0,"Thêm vào giỏ"),"card.view":DC.x("shop.card.view",0,"Xem chi tiết"),"crumb.shop":DC.x("shop.crumb.shop",0,"Shop"),
  "detail.color":DC.x("shop.detail.color",0,"Màu sắc"),"detail.size":DC.x("shop.detail.size",0,"Kích cỡ"),"detail.qty":DC.x("shop.detail.qty",0,"Số lượng"),"detail.sizeGuide":DC.x("shop.detail.sizeGuide",0,"Hướng dẫn chọn size"),
  "detail.addToCart":DC.x("shop.detail.addToCart",0,"Thêm vào giỏ"),"detail.buyNow":DC.x("shop.detail.buyNow",0,"Mua ngay"),"detail.stock":DC.x("shop.detail.stock",0,"Còn hàng"),
  "detail.save":DC.x("shop.detail.save",0,"Tiết kiệm"),"detail.sku":DC.x("shop.detail.sku",0,"Mã SP"),"detail.instock":DC.x("shop.detail.instock",0,"Còn"),"items":DC.x("shop.items",0,"sản phẩm"),"detail.delivery":DC.x("shop.detail.delivery",0,"Giao dự kiến {ship.eta} ngày"),
  "detail.payNote":DC.x("shop.detail.payNote",0,"Chuyển khoản · MoMo · ZaloPay"),"detail.payLabel":DC.x("shop.detail.payLabel",0,"Thanh toán"),"detail.payBank":DC.x("shop.detail.payBank",0,"Chuyển khoản"),"detail.payIsp":DC.x("shop.pdp.isp",0,"Trả góp"),"checkout.ispBadge":DC.x("shop.checkout.13",0,"TRẢ GÓP"),
  "detail.detailsTitle":DC.x("shop.detail.detailsTitle",0,"Mô tả chi tiết"),"detail.specsTitle":DC.x("shop.detail.specsTitle",0,"Thông số kỹ thuật"),"detail.shipTitle":DC.x("shop.detail.shipTitle",0,"Vận chuyển & đổi trả"),
  "detail.reviewsTitle":DC.x("shop.detail.reviewsTitle",0,"Khách hàng đánh giá"),"detail.related":DC.x("shop.detail.related",0,"Khách hàng cũng mua"),"detail.reviews":DC.x("shop.detail.reviews",0,"đánh giá"),
  "spec.material":DC.x("shop.spec.material",0,"Chất liệu"),"spec.origin":DC.x("shop.spec.origin",0,"Xuất xứ"),"spec.weight":DC.x("shop.spec.weight",0,"Trọng lượng"),"spec.warranty":DC.x("shop.spec.warranty",0,"Bảo hành"),"spec.vn":DC.x("shop.spec.vn",0,"Việt Nam"),
  "ship.body":DC.x("shop.ship.body",0,"Giao hàng toàn quốc {ship.eta} ngày làm việc. Miễn phí vận chuyển cho đơn từ {ship.free}₫. Đổi trả miễn phí trong 7 ngày nếu sản phẩm còn nguyên tem mác."),
  "trust.ship":DC.x("shop.trust.ship",0,"Giao toàn quốc"),"trust.return":DC.x("shop.trust.return",0,"Đổi trả 7 ngày"),"trust.auth":DC.x("shop.trust.auth",0,"Hàng chính hãng"),
  "cart.title":DC.x("shop.cart.title",0,"Giỏ hàng"),"cart.empty":DC.x("shop.cart.empty",0,"Giỏ hàng trống.<br>Thêm sản phẩm để bắt đầu!"),"cart.totalShort":DC.x("shop.cart.totalShort",0,"Tổng"),"cart.checkout":DC.x("shop.cart.checkout",0,"Thanh toán"),"cart.remove":DC.x("shop.cart.remove",0,"Xóa"),
  "sum.subtotal":DC.x("shop.sum.subtotal",0,"Tạm tính"),"sum.shipping":DC.x("shop.sum.shipping",0,"Phí vận chuyển"),"sum.total":DC.x("shop.sum.total",0,"Tổng cộng"),"sum.free":DC.x("shop.sum.free",0,"Miễn phí"),
  "checkout.continue":DC.x("shop.checkout.continue",0,"← Tiếp tục mua sắm"),"checkout.title":DC.x("shop.checkout.title",0,"Thanh toán"),"checkout.shipInfo":DC.x("shop.checkout.shipInfo",0,"Thông tin giao hàng"),"checkout.payMethod":DC.x("shop.checkout.payMethod",0,"Phương thức thanh toán"),"checkout.order":DC.x("shop.checkout.order",0,"Đơn hàng"),"checkout.placeOrder":DC.x("shop.checkout.placeOrder",0,"Đặt hàng"),"checkout.freeship":DC.x("shop.checkout.freeship",0,"Miễn phí vận chuyển cho đơn từ {ship.free}₫"),
  "f.name":DC.x("shop.f.name",0,"Họ và tên *"),"f.phone":DC.x("shop.f.phone",0,"Số điện thoại *"),"f.email":DC.x("shop.f.email",0,"Email"),"f.address":DC.x("shop.f.address",0,"Địa chỉ *"),"f.ward":DC.x("shop.f.ward",0,"Phường / Xã"),"f.city":DC.x("shop.f.city",0,"Tỉnh / Thành phố *"),"f.note":DC.x("shop.f.note",0,"Ghi chú"),
  "pay.bank":DC.x("shop.pay.bank",0,"Chuyển khoản ngân hàng"),"pay.bankSub":DC.x("shop.pay.bankSub",0,"Nhận thông tin CK sau khi đặt"),"pay.momo":DC.x("shop.pay.momo",0,"Ví MoMo"),"pay.momoSub":DC.x("shop.pay.momoSub",0,"Quét mã QR bằng app MoMo sau khi đặt"),"pay.zalopay":DC.x("shop.pay.zalopay",0,"ZaloPay"),"pay.zalopaySub":DC.x("shop.pay.zalopaySub",0,"Quét mã QR bằng app ZaloPay sau khi đặt"),"pay.vnpay":DC.x("shop.pay.vnpay",0,"Thẻ ATM / Visa / Mastercard (VNPay)"),"pay.vnpaySub":DC.x("shop.pay.vnpaySub",0,"Chuyển sang cổng VNPay để thanh toán an toàn"),"pay.installment":DC.x("shop.pay.installment",0,"Trả góp qua thẻ tín dụng (VNPay)"),"pay.installmentSub":DC.x("shop.pay.installmentSub",0,"Chọn ngân hàng và kỳ hạn 3–12 tháng sau khi đặt"),
  "ok.title":DC.x("shop.ok.title",0,"Đặt hàng thành công!"),"ok.qrNote":DC.x("shop.ok.qrNote",0,"Quét mã bằng app ngân hàng / ví để thanh toán."),"ok.qrDemo":DC.x("shop.ok.qrDemo",0,"Mã QR minh họa — thay bằng VietQR/MoMo thật của bạn."),"ok.msg":DC.x("shop.ok.msg",0,"Cảm ơn bạn đã mua sắm tại Dapper Combat. Chúng tôi sẽ liên hệ xác nhận đơn sớm nhất."),"ok.continue":DC.x("shop.ok.continue",0,"Tiếp tục mua sắm"),
  "footer.copy":DC.x("shop.footer.copy",0,"© 2026 DAPPER COMBAT. Bảo lưu mọi quyền."),"qtyLabel":DC.x("shop.qtyLabel",0,"SL"),
  "col.red":DC.x("shop.col.red",0,"Đỏ"),"col.black":DC.x("shop.col.black",0,"Đen"),"col.white":DC.x("shop.col.white",0,"Trắng"),"col.grey":DC.x("shop.col.grey",0,"Xám"),"col.navy":DC.x("shop.col.navy",0,"Navy"),"col.orange":DC.x("shop.col.orange",0,"Cam"),
  "rv.1":DC.x("shop.rv.1",0,"Chất lượng vượt mong đợi, giao nhanh. Sẽ ủng hộ tiếp!"),"rv.2":DC.x("shop.rv.2",0,"Form đẹp, vải dày dặn, đúng như mô tả."),"rv.3":DC.x("shop.rv.3",0,"Hàng ổn trong tầm giá, đóng gói cẩn thận."),
  "rv.4":DC.x("shop.rv.4",0,"Đeo cực vừa tay, đấm bao đã thật sự."),"rv.5":DC.x("shop.rv.5",0,"Màu đẹp y hình, shop tư vấn nhiệt tình."),"rv.6":DC.x("shop.rv.6",0,"Giao nhanh trong 2 ngày, rất hài lòng."),"rv.7":DC.x("shop.rv.7",0,"Chất vải mát, thấm hút tốt khi tập."),"rv.8":DC.x("shop.rv.8",0,"Đường may chắc, dùng 2 tháng vẫn như mới."),"rv.9":DC.x("shop.rv.9",0,"Giá hợp lý, chất lượng trên cả mong đợi."),"rv.10":DC.x("shop.rv.10",0,"Mua lần 2 rồi, vẫn ưng như lần đầu."),"rv.11":DC.x("shop.rv.11",0,"Size chuẩn, bảng size của shop rất chính xác."),"rv.12":DC.x("shop.rv.12",0,"Đóng gói đẹp, tặng kèm sticker dễ thương."),"rv.13":DC.x("shop.rv.13",0,"Form chuẩn gym, mặc tập lẫn đi chơi đều hợp."),"rv.14":DC.x("shop.rv.14",0,"Sản phẩm xịn, đáng đồng tiền. Recommend!"),"rv.15":DC.x("shop.rv.15",0,"Shop uy tín, sẽ giới thiệu bạn bè."),
  "detail.articleTitle":DC.x("shop.detail.articleTitle",0,"Về sản phẩm"),"seo.why":DC.x("shop.seo.why",0,"Điểm nổi bật"),"feat.1":DC.x("shop.feat.1",0,"Chất liệu cao cấp, bền bỉ theo thời gian"),"feat.2":DC.x("shop.feat.2",0,"Thiết kế chuẩn Dapper Combat"),"feat.3":DC.x("shop.feat.3",0,"Thoải mái cho tập luyện & đời thường"),"feat.4":DC.x("shop.feat.4",0,"Bảo hành chính hãng · đổi trả trong 7 ngày"),"seo.faq":DC.x("shop.seo.faq",0,"Câu hỏi thường gặp"),"seo.order":DC.x("shop.seo.order",0,"Đặt hàng online, giao toàn quốc, thanh toán chuyển khoản, MoMo hoặc ZaloPay."),"seo.q1":DC.x("shop.seo.q1",0,"Sản phẩm có bảo hành không?"),"seo.a1":DC.x("shop.seo.a1",0,"Có — bảo hành chính hãng theo chính sách Dapper Combat, đổi trả trong 7 ngày."),"seo.q2":DC.x("shop.seo.q2",0,"Làm sao chọn đúng size và màu?"),"seo.a2":DC.x("shop.seo.a2",0,"Tham khảo bảng size và chọn màu ở phần trên; cần tư vấn thêm hãy nhắn Zalo/Facebook Dapper Combat."),"seo.suffix":DC.x("shop.seo.suffix",0,"chính hãng Dapper Combat"),"sum.discount":DC.x("shop.sum.discount",0,"Giảm giá"),"promo.apply":DC.x("shop.promo.apply",0,"Áp dụng"),"promo.ph":DC.x("shop.promo.ph",0,"Mã khuyến mãi"),"promo.hint":DC.x("shop.promo.hint",0,""),"promo.ok":DC.x("shop.promo.ok",0,"Đã áp dụng mã {code}"),"promo.bad":DC.x("shop.promo.bad",0,"Mã không hợp lệ hoặc đã hết hạn"),"step.cart":DC.x("shop.step.cart",0,"Giỏ hàng"),"step.info":DC.x("shop.step.info",0,"Thông tin"),"step.done":DC.x("shop.step.done",0,"Hoàn tất"),"checkout.secure":DC.x("shop.checkout.secure",0,"Thanh toán an toàn & bảo mật"),"units":DC.x("shop.units",0,"sản phẩm")},
 en:{"nav.home":DC.x("shop.nav.home",1,"Home"),"nav.shop":DC.x("shop.nav.shop",1,"Shop"),"nav.courses":DC.x("shop.nav.courses",1,"Courses"),"nav.cart":DC.x("shop.nav.cart",1,"Cart"),
  "shop.h1":DC.x("shop.shop.h1",1,"GEAR UP"),"shop.h2":DC.x("shop.shop.h2",1,"FOR THE FIGHT"),
  "cat.all":DC.x("shop.cat.all",1,"All"),
  "card.add":DC.x("shop.card.add",1,"Add to cart"),"card.view":DC.x("shop.card.view",1,"View details"),"crumb.shop":DC.x("shop.crumb.shop",1,"Shop"),
  "detail.color":DC.x("shop.detail.color",1,"Color"),"detail.size":DC.x("shop.detail.size",1,"Size"),"detail.qty":DC.x("shop.detail.qty",1,"Quantity"),"detail.sizeGuide":DC.x("shop.detail.sizeGuide",1,"Size guide"),
  "detail.addToCart":DC.x("shop.detail.addToCart",1,"Add to cart"),"detail.buyNow":DC.x("shop.detail.buyNow",1,"Buy now"),"detail.stock":DC.x("shop.detail.stock",1,"In stock"),
  "detail.save":DC.x("shop.detail.save",1,"Save"),"detail.sku":DC.x("shop.detail.sku",1,"SKU"),"detail.instock":DC.x("shop.detail.instock",1,""),"items":DC.x("shop.items",1,"in stock"),"detail.delivery":DC.x("shop.detail.delivery",1,"Est. delivery {ship.eta} days"),
  "detail.payNote":DC.x("shop.detail.payNote",1,"Bank transfer · MoMo · ZaloPay"),"detail.payLabel":DC.x("shop.detail.payLabel",1,"Payment"),"detail.payBank":DC.x("shop.detail.payBank",1,"Bank transfer"),"detail.payIsp":DC.x("shop.pdp.isp",1,"Installments"),"checkout.ispBadge":DC.x("shop.checkout.13",1,"INSTALLMENTS"),
  "detail.detailsTitle":DC.x("shop.detail.detailsTitle",1,"Product details"),"detail.specsTitle":DC.x("shop.detail.specsTitle",1,"Specifications"),"detail.shipTitle":DC.x("shop.detail.shipTitle",1,"Shipping & returns"),
  "detail.reviewsTitle":DC.x("shop.detail.reviewsTitle",1,"Customer reviews"),"detail.related":DC.x("shop.detail.related",1,"Customers also bought"),"detail.reviews":DC.x("shop.detail.reviews",1,"reviews"),
  "spec.material":DC.x("shop.spec.material",1,"Material"),"spec.origin":DC.x("shop.spec.origin",1,"Origin"),"spec.weight":DC.x("shop.spec.weight",1,"Weight"),"spec.warranty":DC.x("shop.spec.warranty",1,"Warranty"),"spec.vn":DC.x("shop.spec.vn",1,"Vietnam"),
  "ship.body":DC.x("shop.ship.body",1,"Nationwide delivery in {ship.eta} business days. Free shipping on orders from {ship.free}₫. Free returns within 7 days if tags are intact."),
  "trust.ship":DC.x("shop.trust.ship",1,"Nationwide shipping"),"trust.return":DC.x("shop.trust.return",1,"7-day returns"),"trust.auth":DC.x("shop.trust.auth",1,"100% authentic"),
  "cart.title":DC.x("shop.cart.title",1,"Cart"),"cart.empty":DC.x("shop.cart.empty",1,"Your cart is empty.<br>Add products to get started!"),"cart.totalShort":DC.x("shop.cart.totalShort",1,"Total"),"cart.checkout":DC.x("shop.cart.checkout",1,"Checkout"),"cart.remove":DC.x("shop.cart.remove",1,"Remove"),
  "sum.subtotal":DC.x("shop.sum.subtotal",1,"Subtotal"),"sum.shipping":DC.x("shop.sum.shipping",1,"Shipping"),"sum.total":DC.x("shop.sum.total",1,"Total"),"sum.free":DC.x("shop.sum.free",1,"Free"),
  "checkout.continue":DC.x("shop.checkout.continue",1,"← Continue shopping"),"checkout.title":DC.x("shop.checkout.title",1,"Checkout"),"checkout.shipInfo":DC.x("shop.checkout.shipInfo",1,"Shipping information"),"checkout.payMethod":DC.x("shop.checkout.payMethod",1,"Payment method"),"checkout.order":DC.x("shop.checkout.order",1,"Your order"),"checkout.placeOrder":DC.x("shop.checkout.placeOrder",1,"Place order"),"checkout.freeship":DC.x("shop.checkout.freeship",1,"Free shipping on orders from {ship.free}₫"),
  "f.name":DC.x("shop.f.name",1,"Full name *"),"f.phone":DC.x("shop.f.phone",1,"Phone number *"),"f.email":DC.x("shop.f.email",1,"Email"),"f.address":DC.x("shop.f.address",1,"Address *"),"f.ward":DC.x("shop.f.ward",1,"Ward"),"f.city":DC.x("shop.f.city",1,"City / Province *"),"f.note":DC.x("shop.f.note",1,"Note"),
  "pay.bank":DC.x("shop.pay.bank",1,"Bank transfer"),"pay.bankSub":DC.x("shop.pay.bankSub",1,"Transfer details sent after order"),"pay.momo":DC.x("shop.pay.momo",1,"MoMo e-wallet"),"pay.momoSub":DC.x("shop.pay.momoSub",1,"Scan the QR with MoMo after ordering"),"pay.zalopay":DC.x("shop.pay.zalopay",1,"ZaloPay"),"pay.zalopaySub":DC.x("shop.pay.zalopaySub",1,"Scan the QR with ZaloPay after ordering"),"pay.vnpay":DC.x("shop.pay.vnpay",1,"ATM / Visa / Mastercard card (VNPay)"),"pay.vnpaySub":DC.x("shop.pay.vnpaySub",1,"You'll be taken to VNPay to pay securely"),"pay.installment":DC.x("shop.pay.installment",1,"Credit card installments (VNPay)"),"pay.installmentSub":DC.x("shop.pay.installmentSub",1,"Choose your bank and a 3–12 month term after ordering"),
  "ok.title":DC.x("shop.ok.title",1,"Order placed!"),"ok.qrNote":DC.x("shop.ok.qrNote",1,"Scan with your banking / e-wallet app to pay."),"ok.qrDemo":DC.x("shop.ok.qrDemo",1,"Sample QR — replace with your real VietQR/MoMo code."),"ok.msg":DC.x("shop.ok.msg",1,"Thank you for shopping at Dapper Combat. We will contact you shortly to confirm your order."),"ok.continue":DC.x("shop.ok.continue",1,"Continue shopping"),
  "footer.copy":DC.x("shop.footer.copy",1,"© 2026 DAPPER COMBAT. All rights reserved."),"qtyLabel":DC.x("shop.qtyLabel",1,"Qty"),
  "col.red":DC.x("shop.col.red",1,"Red"),"col.black":DC.x("shop.col.black",1,"Black"),"col.white":DC.x("shop.col.white",1,"White"),"col.grey":DC.x("shop.col.grey",1,"Grey"),"col.navy":DC.x("shop.col.navy",1,"Navy"),"col.orange":DC.x("shop.col.orange",1,"Orange"),
  "rv.1":DC.x("shop.rv.1",1,"Quality beyond expectations, fast delivery. Will buy again!"),"rv.2":DC.x("shop.rv.2",1,"Great fit, thick fabric, exactly as described."),"rv.3":DC.x("shop.rv.3",1,"Solid for the price, carefully packaged."),
  "rv.4":DC.x("shop.rv.4",1,"Fits the hand perfectly, bag work feels great."),"rv.5":DC.x("shop.rv.5",1,"Color just like the photos, super helpful shop."),"rv.6":DC.x("shop.rv.6",1,"Delivered in 2 days, very happy."),"rv.7":DC.x("shop.rv.7",1,"Cool, moisture-wicking fabric for training."),"rv.8":DC.x("shop.rv.8",1,"Strong stitching, still like new after 2 months."),"rv.9":DC.x("shop.rv.9",1,"Reasonable price, quality above expectations."),"rv.10":DC.x("shop.rv.10",1,"My second order — still love it."),"rv.11":DC.x("shop.rv.11",1,"True to size, the size chart is accurate."),"rv.12":DC.x("shop.rv.12",1,"Nice packaging, cute free sticker."),"rv.13":DC.x("shop.rv.13",1,"Gym-ready fit, great for training and casual wear."),"rv.14":DC.x("shop.rv.14",1,"Premium product, worth the money. Recommend!"),"rv.15":DC.x("shop.rv.15",1,"Trustworthy shop, will refer friends."),
  "detail.articleTitle":DC.x("shop.detail.articleTitle",1,"About this product"),"seo.why":DC.x("shop.seo.why",1,"Highlights"),"feat.1":DC.x("shop.feat.1",1,"Premium, long-lasting materials"),"feat.2":DC.x("shop.feat.2",1,"Signature Dapper Combat design"),"feat.3":DC.x("shop.feat.3",1,"Comfortable for training & everyday wear"),"feat.4":DC.x("shop.feat.4",1,"Official warranty · 7-day returns"),"seo.faq":DC.x("shop.seo.faq",1,"FAQ"),"seo.order":DC.x("shop.seo.order",1,"Order online with nationwide delivery; pay by bank transfer, MoMo or ZaloPay."),"seo.q1":DC.x("shop.seo.q1",1,"Is there a warranty?"),"seo.a1":DC.x("shop.seo.a1",1,"Yes — official Dapper Combat warranty with free returns within 7 days."),"seo.q2":DC.x("shop.seo.q2",1,"How do I pick the right size and color?"),"seo.a2":DC.x("shop.seo.a2",1,"Check the size chart and color options above; for help, message Dapper Combat on Zalo/Facebook."),"seo.suffix":DC.x("shop.seo.suffix",1,"by Dapper Combat"),"sum.discount":DC.x("shop.sum.discount",1,"Discount"),"promo.apply":DC.x("shop.promo.apply",1,"Apply"),"promo.ph":DC.x("shop.promo.ph",1,"Promo code"),"promo.hint":DC.x("shop.promo.hint",1,""),"promo.ok":DC.x("shop.promo.ok",1,"Code {code} applied"),"promo.bad":DC.x("shop.promo.bad",1,"Invalid or expired code"),"step.cart":DC.x("shop.step.cart",1,"Cart"),"step.info":DC.x("shop.step.info",1,"Details"),"step.done":DC.x("shop.step.done",1,"Done"),"checkout.secure":DC.x("shop.checkout.secure",1,"Secure & encrypted checkout"),"units":DC.x("shop.units",1,"items")}
};

// specs by category
const SPEC={};
const WARR={};
/* danh mục sản phẩm (tên, chất liệu, khối lượng, bảo hành, bảng size): sửa ở /admin → Danh mục sản phẩm */
DC.cats().forEach(function(c){T.vi["cat."+c.id]=c.name.vi;T.en["cat."+c.id]=c.name.en||c.name.vi;SPEC[c.id]={mat:{vi:c.material.vi,en:c.material.en||c.material.vi},w:c.weight};WARR[c.id]=String(c.warranty);});
function v3Guide(id){var c=DC.cat(id);return !c?id:c.guide==="free"?"phukien":c.guide;}

/* sản phẩm lấy từ server (/admin → Sản phẩm); chưa có sản phẩm nào → trang hiện "Sản phẩm đang được cập nhật" */
const PRODUCTS=DCProducts();
// image views (crops of same photo to simulate multiple angles)
const REVIEWS=DC.list("shop.reviews.list",function($k){return [[DC.x($k("shop.reviews.n1"),0,"Nguyễn Minh Quân"),+DC.x($k("shop.reviews.r1"),0,"5"),[DC.x($k("shop.rv.1"),0,"Chất lượng vượt mong đợi, giao nhanh. Sẽ ủng hộ tiếp!"),DC.x($k("shop.rv.1"),1,"Quality beyond expectations, fast delivery. Will buy again!")],DC.m($k("shop.reviews.av1"),"/assets/media/d23e3c2d57c6.jpg"),DC.m($k("shop.reviews.ph1"),"/assets/media/bc3dad0ad714.jpg")],[DC.x($k("shop.reviews.n2"),0,"Đặng Thu Hà"),+DC.x($k("shop.reviews.r2"),0,"5"),[DC.x($k("shop.rv.2"),0,"Form đẹp, vải dày dặn, đúng như mô tả."),DC.x($k("shop.rv.2"),1,"Great fit, thick fabric, exactly as described.")],DC.m($k("shop.reviews.av2"),"/assets/media/0d7b90964d2f.jpg"),DC.m($k("shop.reviews.ph2"),"/assets/media/5e72dec5065d.jpg")],[DC.x($k("shop.reviews.n3"),0,"Hoàng Gia Bảo"),+DC.x($k("shop.reviews.r3"),0,"4"),[DC.x($k("shop.rv.3"),0,"Hàng ổn trong tầm giá, đóng gói cẩn thận."),DC.x($k("shop.rv.3"),1,"Solid for the price, carefully packaged.")],DC.m($k("shop.reviews.av3"),"/assets/media/ef6aa223f2d8.jpg"),DC.m($k("shop.reviews.ph3"),"/assets/media/9beb4e3b2965.jpg")],[DC.x($k("shop.reviews.n4"),0,"Trần Văn Hùng"),+DC.x($k("shop.reviews.r4"),0,"5"),[DC.x($k("shop.rv.4"),0,"Đeo cực vừa tay, đấm bao đã thật sự."),DC.x($k("shop.rv.4"),1,"Fits the hand perfectly, bag work feels great.")],DC.m($k("shop.reviews.av4"),"/assets/media/2470aa607bdf.jpg"),DC.m($k("shop.reviews.ph4"),"/assets/media/3ce28cc822e3.jpg")],[DC.x($k("shop.reviews.n5"),0,"Lê Thị Mai"),+DC.x($k("shop.reviews.r5"),0,"5"),[DC.x($k("shop.rv.5"),0,"Màu đẹp y hình, shop tư vấn nhiệt tình."),DC.x($k("shop.rv.5"),1,"Color just like the photos, super helpful shop.")],DC.m($k("shop.reviews.av5"),"/assets/media/a8deb0806ecb.jpg"),DC.m($k("shop.reviews.ph5"),"/assets/media/a406800d7ac8.jpg")],[DC.x($k("shop.reviews.n6"),0,"Phạm Quốc Anh"),+DC.x($k("shop.reviews.r6"),0,"5"),[DC.x($k("shop.rv.6"),0,"Giao nhanh trong 2 ngày, rất hài lòng."),DC.x($k("shop.rv.6"),1,"Delivered in 2 days, very happy.")],DC.m($k("shop.reviews.av6"),"/assets/media/112748d47b5b.jpg"),DC.m($k("shop.reviews.ph6"),"/assets/media/004df67b4e85.jpg")],[DC.x($k("shop.reviews.n7"),0,"Võ Thành Đạt"),+DC.x($k("shop.reviews.r7"),0,"4"),[DC.x($k("shop.rv.7"),0,"Chất vải mát, thấm hút tốt khi tập."),DC.x($k("shop.rv.7"),1,"Cool, moisture-wicking fabric for training.")],DC.m($k("shop.reviews.av7"),"/assets/media/6aba4dd7477e.jpg"),DC.m($k("shop.reviews.ph7"),"/assets/media/e5a62861c4e3.jpg")],[DC.x($k("shop.reviews.n8"),0,"Ngô Khánh Linh"),+DC.x($k("shop.reviews.r8"),0,"5"),[DC.x($k("shop.rv.8"),0,"Đường may chắc, dùng 2 tháng vẫn như mới."),DC.x($k("shop.rv.8"),1,"Strong stitching, still like new after 2 months.")],DC.m($k("shop.reviews.av8"),"/assets/media/d56ab49a7ed4.jpg"),DC.m($k("shop.reviews.ph8"),"/assets/media/54fdef235c18.jpg")],[DC.x($k("shop.reviews.n9"),0,"Bùi Tuấn Kiệt"),+DC.x($k("shop.reviews.r9"),0,"5"),[DC.x($k("shop.rv.9"),0,"Giá hợp lý, chất lượng trên cả mong đợi."),DC.x($k("shop.rv.9"),1,"Reasonable price, quality above expectations.")],DC.m($k("shop.reviews.av9"),"/assets/media/9160d736e23d.jpg"),DC.m($k("shop.reviews.ph9"),"/assets/media/bc3dad0ad714.jpg")],[DC.x($k("shop.reviews.n10"),0,"Dương Thu Trang"),+DC.x($k("shop.reviews.r10"),0,"5"),[DC.x($k("shop.rv.10"),0,"Mua lần 2 rồi, vẫn ưng như lần đầu."),DC.x($k("shop.rv.10"),1,"My second order — still love it.")],DC.m($k("shop.reviews.av10"),"/assets/media/eab248b40842.jpg"),DC.m($k("shop.reviews.ph10"),"/assets/media/a406800d7ac8.jpg")],[DC.x($k("shop.reviews.n11"),0,"Trịnh Văn Lộc"),+DC.x($k("shop.reviews.r11"),0,"4"),[DC.x($k("shop.rv.11"),0,"Size chuẩn, bảng size của shop rất chính xác."),DC.x($k("shop.rv.11"),1,"True to size, the size chart is accurate.")],DC.m($k("shop.reviews.av11"),"/assets/media/5a07520e6fd7.jpg"),DC.m($k("shop.reviews.ph11"),"/assets/media/9beb4e3b2965.jpg")],[DC.x($k("shop.reviews.n12"),0,"Phan Gia Huy"),+DC.x($k("shop.reviews.r12"),0,"5"),[DC.x($k("shop.rv.12"),0,"Đóng gói đẹp, tặng kèm sticker dễ thương."),DC.x($k("shop.rv.12"),1,"Nice packaging, cute free sticker.")],DC.m($k("shop.reviews.av12"),"/assets/media/d6f3b19b1df2.jpg"),DC.m($k("shop.reviews.ph12"),"/assets/media/3ce28cc822e3.jpg")]];});
/* chỉ ảnh của chính sản phẩm (không lấy ảnh sản phẩm khác) + video chung */
function mediaOf(p){return [{type:"img",src:IMG[p.img]}].concat(vidsOf(p).map(v=>({type:"video",src:v})));}
let curMedia=[];

let lang="vi", filter="all", cart={}, detailId=null, detailSize=null, detailColor=null, detailQty=1;
/* yêu thích: lưu trong trình duyệt (localStorage "dc_fav"), dùng chung với Trang chủ */
const wish={has:id=>DC.fav.has(id),add:id=>DC.fav.set(id,true),delete:id=>DC.fav.set(id,false)};
let promo=null,promoCode="";
const t=k=>T[lang][k]||k;
/* mô tả sản phẩm: thiếu tiếng Anh → dùng tiếng Việt */
const pd=o=>o?(o[lang]||o.vi||""):"";
/* tên sản phẩm theo ngôn ngữ (nameEn khi xem tiếng Anh), tên màu (tên riêng của sản phẩm → tên màu chung → mã màu) */
const pn=p=>DC.pname(p,lang==="en");
const cn=(p,k)=>DC.colorName(p,k,lang==="en");
/* điểm nổi bật: của riêng sản phẩm (sửa ở /admin → Sản phẩm), không có thì dùng 4 dòng chung */
function featsOf(p){const f=(Array.isArray(p&&p.features)?p.features:[]).filter(x=>x&&(x.vi||x.en));return f.length?f.map(x=>DC.esc(lang==="en"?(x.en||x.vi):(x.vi||x.en))):["feat.1","feat.2","feat.3","feat.4"].map(k=>t(k));}
/* video trang sản phẩm: video riêng của sản phẩm thay cho 2 video chung; tắt ở Thiết lập → không có video */
function vidsOf(p){if(DC.setting("shop.pdp.videos",true)===false)return [];return p&&p.video?[p.video]:VIDS.filter(Boolean);}
/* tồn kho: số còn có thể thêm vào giỏ (đã trừ phần đang nằm trong giỏ, mọi size / màu) */
function inCart(id){return Object.keys(cart).reduce((s,k)=>s+(k.split("::")[0]===id?cart[k]:0),0);}
function canAdd(id){const p=PRODUCTS.find(x=>x.id===id);return p?Math.max(0,DC.stock(p)-inCart(id)):0;}
function roomOf(id,size,color){const p=PRODUCTS.find(x=>x.id===id);if(!p)return 0;const all=canAdd(id);return DC.hasVariants(p)?Math.min(all,Math.max(0,DC.vstock(p,size,color)-(cart[id+"::"+size+"::"+color]||0))):all;}
/* biến thể chọn sẵn: size / màu đầu tiên còn hàng */
function colorFor(p,size){if(!DC.hasVariants(p))return p.colors[0][0];const c=p.colors.find(c=>DC.vstock(p,size,c[0])>0);return c?c[0]:null;}
const soldTxt=()=>v3T(DC.x("shop.stock.out",0,"Hết hàng"),DC.x("shop.stock.out",1,"Sold out"));
const fmt=n=>n.toLocaleString(lang==="vi"?"vi-VN":"en-US")+"₫";
const SHIP_FREE=DC.setting("shop.freeShip",1000000), SHIP_FEE=DC.setting("shop.shipFee",30000);
const $=id=>document.getElementById(id);
const stars=r=>{const f=Math.round(r);return "★★★★★".slice(0,f)+"☆☆☆☆☆".slice(0,5-f);};

function applyLang(){
  document.documentElement.lang=lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{const v=T[lang][el.getAttribute("data-i18n")];if(v!=null){if(v.includes("<"))el.innerHTML=v;else el.textContent=v;}});
  document.querySelectorAll("[data-ph]").forEach(el=>{const v=T[lang][el.getAttribute("data-ph")];if(v!=null)el.placeholder=v;});
  document.querySelectorAll(".lang-switch button").forEach(b=>b.classList.toggle("on",b.dataset.lang===lang));
  renderGrid(); sync(); if(detailId) renderDetail(); renderSummary();
  if(promo){$("promoMsg").className="promo-msg ok";$("promoMsg").textContent=t("promo.ok").replace("{code}",promoCode);}
}

/* GRID */
function renderGrid(){
  $("grid").innerHTML=PRODUCTS.filter(p=>filter==="all"||p.cat===filter).map(p=>`
    <div class="card" data-open="${p.id}">
      <div class="card-media">
        <span class="card-tag">${t("cat."+p.cat)}</span>
        ${p.old?'<span class="card-sale">-'+Math.round((1-p.price/p.old)*100)+'%</span>':''}
        <img src="${IMG[p.img]}" alt="${pn(p)}">
        <div class="card-view">${t("card.view")}</div>
      </div>
      <div class="card-body">
        <div class="card-swatches">${p.colors.map(c=>'<i style="background:'+c[1]+'"></i>').join("")}</div>
        <div class="card-name">${pn(p)}</div>
        <div class="card-price">${fmt(p.price)}${p.old?' <s>'+fmt(p.old)+'</s>':''}</div>
        <button class="card-add" data-add="${p.id}">${t("card.add")}</button>
      </div>
    </div>`).join("");
}
$("filters").addEventListener("click",e=>{const b=e.target.closest(".chip");if(!b)return;filter=b.dataset.cat;document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("active",c===b));renderGrid();});
$("grid").addEventListener("click",e=>{
  const a=e.target.closest("[data-add]"),o=e.target.closest("[data-open]");
  if(a){e.stopPropagation();const p=PRODUCTS.find(x=>x.id===a.dataset.add);addToCart(p.id,p.sizes[0],p.colors[0][0],1);openCart();return;}
  if(o)openDetail(o.dataset.open);
});

/* DETAIL */
function openDetail(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;detailId=id;const v=DC.firstVariant(p);detailSize=v[0];detailColor=v[1];detailQty=1;renderDetail();showView("detail");}
function showMedia(i,poster){const m=curMedia[i];$("dStage").innerHTML=m.type==="img"?`<img src="${m.src}" alt="">`:`<video src="${m.src}" controls playsinline preload="metadata" poster="${poster}"></video>`;}
function renderDetail(){
  const p=PRODUCTS.find(x=>x.id===detailId);if(!p)return;
  curMedia=mediaOf(p);showMedia(0,IMG[p.img]);
  const bd=$("dBadge");if(p.old){bd.style.display="block";bd.textContent="-"+Math.round((1-p.price/p.old)*100)+"%";}else bd.style.display="none";
  $("dWish").textContent=wish.has(p.id)?"♥":"♡";$("dWish").classList.toggle("on",wish.has(p.id));
  $("dCat").textContent=t("cat."+p.cat);$("crumbCat").textContent=t("cat."+p.cat);$("crumbName").textContent=pn(p);$("dName").textContent=pn(p);
  $("dStars").textContent=stars(p.rating);$("dRating").textContent=p.rating.toFixed(1)+" · "+p.reviews+" "+t("detail.reviews");
  /* dòng "★ 4.9 · N đánh giá": chỉ hiện khi sản phẩm có số đánh giá thật */
  const rt=document.querySelector("#detailView .pdp-rating");if(rt)rt.style.display=p.reviews>0?"":"none";
  $("dPrice").textContent=fmt(p.price);
  const old=$("dOld"),sv=$("dSave");
  if(p.old){old.style.display="inline";old.textContent=fmt(p.old);sv.style.display="inline";sv.textContent=t("detail.save")+" "+fmt(p.old-p.price);}else{old.style.display="none";sv.style.display="none";}
  const sku="DC-"+p.id.toUpperCase().replace("P","")+"-"+p.cat.toUpperCase().slice(0,3);
  $("dMeta").innerHTML=`<span>${t("detail.sku")}: <b>${sku}</b></span><span>${t("detail.instock")} <b>${p.stock}</b> ${t("items")}</span><span><b>${t("detail.delivery")}</b></span>`;
  $("dDesc").textContent=pd(p.desc);
  pdpBuyState();
  $("dThumbs").innerHTML=curMedia.map((m,i)=>`<div class="pdp-thumb${i===0?' sel':''}${m.type==='video'?' vid':''}" data-mi="${i}"><img src="${m.type==='img'?m.src:IMG[p.img]}" alt=""></div>`).join("");
  $("dColors").innerHTML=p.colors.map(c=>`<button class="swatch${c[0]===detailColor?' sel':''}" data-color="${c[0]}" style="background:${c[1]}" title="${cn(p,c[0])}"></button>`).join("");
  $("dColorName").textContent=cn(p,detailColor);
  $("dSizes").innerHTML=p.sizes.map(s=>{const o=DC.hasVariants(p)&&DC.vstock(p,s,detailColor)<=0;return `<button class="size-opt${s===detailSize?' sel':''}${o?' oos':''}" data-size="${s}"${o?' aria-disabled="true" title="'+soldTxt()+'"':''}>${s}</button>`;}).join("");
  $("dQty").textContent=detailQty;
  // accordion
  const sp=SPEC[p.cat]||{mat:{vi:"",en:""},w:""};
  $("dAcc").innerHTML=`
    <div class="acc-item open"><button class="acc-head">${t("detail.detailsTitle")}<span class="ic">+</span></button><div class="acc-body"><div class="acc-inner">${pd(p.full)}</div></div></div>
    <div class="acc-item"><button class="acc-head">${t("detail.specsTitle")}<span class="ic">+</span></button><div class="acc-body"><div class="acc-inner"><table class="spec-table">
      <tr><td>${t("spec.material")}</td><td>${sp.mat[lang]}</td></tr>
      <tr><td>${t("spec.origin")}</td><td>${t("spec.vn")}</td></tr>
      <tr><td>${t("spec.weight")}</td><td>${sp.w}</td></tr>
      <tr><td>${t("spec.warranty")}</td><td>${WARR[p.cat]} ${lang==="vi"?"tháng":"months"}</td></tr>
    </table></div></div></div>
    <div class="acc-item"><button class="acc-head">${t("detail.shipTitle")}<span class="ic">+</span></button><div class="acc-body"><div class="acc-inner">${t("ship.body")}</div></div></div>`;
  // reviews
  $("dReviews").innerHTML=REVIEWS.map(r=>`
    <div class="rev"><div class="rev-top"><img class="rev-av" src="${r[3]}" alt=""><div><div class="rev-name">${r[0]}</div><div class="rev-stars">${stars(r[1])}</div></div></div><p class="rev-text">"${(lang==="en"?r[2][1]:r[2][0])}"</p><img class="rev-photo" src="${r[4]}" alt=""></div>`).join("");
  // SEO article (viết tay — nội dung mẫu)
  $("dArticle").innerHTML=`<div class="art-lead">${pn(p)} — ${t("cat."+p.cat)} ${t("seo.suffix")}</div>
    <p>${pd(p.full)}</p>
    <h4>${t("seo.why")}</h4>
    <ul>${featsOf(p).map(x=>"<li>"+x+"</li>").join("")}</ul>
    <p>${pd(p.desc)} ${t("seo.order")}</p>
    `;
  // related
  const rel=[...PRODUCTS.filter(x=>x.cat===p.cat&&x.id!==p.id),...PRODUCTS.filter(x=>x.cat!==p.cat)].slice(0,4);
  $("dRelated").innerHTML=rel.map(r=>`
    <div class="card" data-open="${r.id}"><div class="card-media"><span class="card-tag">${t("cat."+r.cat)}</span>${DC.soldOut(r)?'<span class="v3-out-badge">'+soldTxt()+'</span>':''}<img src="${IMG[r.img]}" alt="${pn(r)}"><div class="card-view">${t("card.view")}</div></div>
    <div class="card-body"><div class="card-name">${pn(r)}</div><div class="card-price">${fmt(r.price)}</div></div></div>`).join("");
}
$("dColors").addEventListener("click",e=>{const b=e.target.closest("[data-color]");if(!b)return;detailColor=b.dataset.color;renderDetail();});
$("dSizes").addEventListener("click",e=>{const b=e.target.closest("[data-size]");if(!b)return;detailSize=b.dataset.size;renderDetail();});
$("dThumbs").addEventListener("click",e=>{const b=e.target.closest("[data-mi]");if(!b)return;document.querySelectorAll("#dThumbs .pdp-thumb").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");showMedia(+b.dataset.mi,IMG[PRODUCTS.find(x=>x.id===detailId).img]);});
$("dAcc").addEventListener("click",e=>{const h=e.target.closest(".acc-head");if(!h)return;h.parentElement.classList.toggle("open");});
$("faqAcc").addEventListener("click",e=>{const hd=e.target.closest(".acc-head");if(!hd)return;hd.parentElement.classList.toggle("open");});
$("dWish").onclick=()=>{if(wish.has(detailId))wish.delete(detailId);else wish.add(detailId);renderDetail();v3lRefresh();};
$("dRelated").addEventListener("click",e=>{const o=e.target.closest("[data-open]");if(o)openDetail(o.dataset.open);});
document.querySelector(".rev-nav").addEventListener("click",e=>{const b=e.target.closest("[data-rv]");if(!b)return;const tr=$("dReviews");tr.scrollBy({left:(+b.dataset.rv)*Math.round(tr.clientWidth*0.85),behavior:"smooth"});});
function qtyBtns(){const room=roomOf(detailId,detailSize,detailColor);$("dQty").textContent=detailQty;$("dPlus").disabled=detailQty>=room;$("dMinus").disabled=detailQty<=1;}
/* hết hàng: khóa nút mua; số lượng không vượt quá số còn trong kho (trừ phần đã có trong giỏ) */
function pdpBuyState(){
  const p=PRODUCTS.find(x=>x.id===detailId);if(!p)return;
  const out=DC.soldOut(p)||DC.vstock(p,detailSize,detailColor)<=0,room=roomOf(p.id,detailSize,detailColor);if(detailQty>Math.max(1,room))detailQty=Math.max(1,room);
  $("dAdd").disabled=out||room<=0;$("dBuy").disabled=out;["dAdd","dBuy"].forEach(id=>$(id).classList.toggle("v3-soldout",out));
  if(out){$("dAdd").textContent=soldTxt();$("dBuy").textContent=soldTxt();}
  else if(!$("dAdd").classList.contains("v3-added")){$("dAdd").textContent=room<=0?v3T(DC.x("shop.stock.max",0,"Đã đủ số lượng trong giỏ"),DC.x("shop.stock.max",1,"Max quantity in cart")):t("detail.addToCart");$("dBuy").textContent=t("detail.buyNow");}
  qtyBtns();
}
$("dMinus").onclick=()=>{detailQty=Math.max(1,detailQty-1);qtyBtns();};
$("dPlus").onclick=()=>{if(detailQty<canAdd(detailId))detailQty++;qtyBtns();};
$("dAdd").onclick=()=>{if(!canAdd(detailId))return;addToCart(detailId,detailSize,detailColor,detailQty);openCart();};
$("dBuy").onclick=()=>{const p=PRODUCTS.find(x=>x.id===detailId);if(!p||DC.soldOut(p))return;addToCart(detailId,detailSize,detailColor,detailQty);showCheckout();};
$("crumbShop").onclick=()=>showView("shop");
/* breadcrumb danh mục → lưới sản phẩm lọc sẵn theo danh mục đó (/shop?cat=<mã>) */
$("crumbCat").onclick=()=>{const p=PRODUCTS.find(x=>x.id===detailId);if(!p)return;V3L.cat=p.cat;V3L.fav=false;V3L.sizes=[];V3L.colors=[];v3lRefresh();showView("shop");};

/* CART keyed id::size::color */
const key=(id,s,c)=>id+"::"+s+"::"+c;
function parseKey(k){const a=k.split("::");return{p:PRODUCTS.find(x=>x.id===a[0]),size:a[1],color:a[2]};}
/* thêm vào giỏ: không vượt quá số còn trong kho (server cũng kiểm tra lại khi đặt hàng) */
function addToCart(id,size,color,qty){const n=Math.min(qty,roomOf(id,size,color));if(n<=0){sync();return 0;}const k=key(id,size,color);cart[k]=(cart[k]||0)+n;sync();return n;}
function count(){return Object.values(cart).reduce((a,b)=>a+b,0);}
function subtotal(){return Object.entries(cart).reduce((s,[k,q])=>s+parseKey(k).p.price*q,0);}
function ship(){const s=subtotal();return s===0||s>=SHIP_FREE?0:SHIP_FEE;}
function sync(){const c=count();const cc=$("cartCount");cc.textContent=c;cc.style.display=c>0?"flex":"none";renderCart();renderSummary();if(detailId&&$("detailView").classList.contains("active"))pdpBuyState();if(typeof promoRecheck==="function")promoRecheck();}
/* dcCartNote: giỏ vừa được bớt theo số còn trong kho (shop-site.js bật khi tải giỏ) → hiện lời nhắn trong giỏ và ở trang thanh toán */
var dcCartNote=false;
function cartNoteHtml(){return dcCartNote?'<div class="dc-cart-note" role="status">'+v3T(DC.x("shop.cart.clamped",0,"Một số sản phẩm trong giỏ đã được điều chỉnh theo số lượng còn trong kho."),DC.x("shop.cart.clamped",1,"Some items in your cart were adjusted to the quantity in stock."))+'</div>':'';}
function renderCart(){
  const box=$("cartItems"),foot=$("cartFoot"),ks=Object.keys(cart);
  const note=cartNoteHtml();
  if(!ks.length){box.innerHTML=note+'<div class="cart-empty">'+t("cart.empty")+'</div>';foot.style.display="none";return;}
  foot.style.display="block";
  box.innerHTML=note+ks.map(k=>{const{p,size,color}=parseKey(k),q=cart[k],full=roomOf(p.id,size,color)<=0;return `
    <div class="ci"><img class="ci-img" src="${IMG[p.img]}" alt="">
      <div><div class="ci-name">${pn(p)}</div><div class="ci-var">${cn(p,color)} · ${size}</div>
        <div class="ci-qty"><button data-q="-1" data-k="${k}" aria-label="−">−</button><span>${q}</span><button data-q="1" data-k="${k}" aria-label="+"${full?' disabled title="'+v3T(DC.x("shop.stock.max",0,"Đã đủ số lượng trong giỏ"),DC.x("shop.stock.max",1,"Max quantity in cart"))+'"':''}>+</button></div></div>
      <div class="ci-right"><span class="ci-line">${fmt(p.price*q)}</span><button class="ci-del" data-del="${k}">${t("cart.remove")}</button></div>
    </div>`;}).join("");
  $("cartSub").textContent=fmt(subtotal());$("cartShip").textContent=ship()===0?t("sum.free"):fmt(ship());$("cartTotal").textContent=fmt(subtotal()+ship());
}
$("cartItems").addEventListener("click",e=>{const q=e.target.closest("[data-q]"),d=e.target.closest("[data-del]");if(q||d)dcCartNote=false;if(q){const k=q.dataset.k,dq=parseInt(q.dataset.q,10);if(dq>0){const a=k.split("::");if(roomOf(a[0],a[1],a[2])<=0)return;}cart[k]=(cart[k]||0)+dq;if(cart[k]<=0)delete cart[k];sync();}if(d){delete cart[d.dataset.del];sync();}});

/* ngăn giỏ hàng: Esc để đóng, đóng xong trả con trỏ bàn phím về nút đã mở */
const overlay=$("overlay"),cartEl=$("cart");let cartOpener=null;
function openCart(){if(!cartEl.classList.contains("open"))cartOpener=document.activeElement;cartEl.classList.add("open");overlay.classList.add("open");setTimeout(()=>{const x=$("closeCart");if(x&&cartEl.classList.contains("open"))x.focus({preventScroll:true});},60);}
function closeCart(){const was=cartEl.classList.contains("open");cartEl.classList.remove("open");overlay.classList.remove("open");if(was&&cartOpener&&cartOpener.focus&&document.contains(cartOpener)&&cartOpener.offsetParent!==null)cartOpener.focus({preventScroll:true});cartOpener=null;}
$("openCart").onclick=openCart;$("closeCart").onclick=closeCart;overlay.onclick=closeCart;
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&cartEl.classList.contains("open"))closeCart();});

function showView(v){$("shopView").style.display=v==="shop"?"block":"none";$("detailView").classList.toggle("active",v==="detail");$("checkoutView").classList.toggle("active",v==="checkout");window.scrollTo(0,0);}
function showCheckout(){if(count()===0)return;closeCart();renderSummary();showView("checkout");}
$("goCheckout").onclick=showCheckout;$("backToShop").onclick=()=>showView("shop");
function discountAmt(){if(!promo)return 0;const s=subtotal();if(promo.pct)return Math.round(s*promo.pct);if(promo.fix)return Math.min(promo.fix,s);return 0;}
function shipFinal(){if(promo&&promo.freeship)return 0;return ship();}
function renderSummary(){const box=$("sumItems"),ks=Object.keys(cart);const sc=$("sumCount");if(sc)sc.textContent=count()>0?"("+count()+" "+t("units")+")":"";box.innerHTML=cartNoteHtml()+ks.map(k=>{const{p,size,color}=parseKey(k),q=cart[k];return `<div class="sum-item"><img src="${IMG[p.img]}" alt=""><div><div>${pn(p)}</div><div class="si-q">${cn(p,color)} · ${size} · ${t("qtyLabel")}: ${q}</div></div><div class="si-line">${fmt(p.price*q)}</div></div>`;}).join("");const sub=subtotal(),disc=discountAmt(),shf=shipFinal();$("sumSub").textContent=fmt(sub);const dr=$("sumDiscRow");if(disc>0){dr.style.display="flex";$("sumDisc").textContent="−"+fmt(disc);}else{dr.style.display="none";}$("sumShip").textContent=shf===0?t("sum.free"):fmt(shf);$("sumTotal").textContent=fmt(Math.max(0,sub-disc)+shf);}
/* mã giảm giá: kiểm tra qua server (POST /api/promo) — danh sách mã không gửi xuống trình duyệt; server tính lại giá khi đặt hàng */
let promoBusy=false,promoSub=null,promoT=null;
/* giỏ đổi (thêm / bớt) sau khi đã áp mã → hỏi lại server (đơn tối thiểu, hết lượt…) */
function promoRecheck(){
  if(!promo||!promoCode||promoBusy||subtotal()===promoSub)return;
  clearTimeout(promoT);promoT=setTimeout(function(){
    if(!promo||!promoCode||!count())return;
    var code=promoCode,sub=subtotal();promoSub=sub;
    DC.api("/promo",{code:code,lang:DC.lang(),subtotal:sub}).then(function(r){if(code!==promoCode)return;var p=r&&r.pct?{pct:+r.pct}:r&&r.fix?{fix:+r.fix}:r&&r.freeship?{freeship:true}:null;if(p){promo=p;renderSummary();}},
      function(err){if(code!==promoCode||!err.status)return;promoDrop(err.status===404?t("promo.bad"):err.message);});
  },400);
}
/* bỏ mã đang áp (server từ chối) — báo ngay dưới ô mã, khách đặt lại được không cần mã */
function promoDrop(msg){promo=null;promoCode="";promoSub=null;const m=$("promoMsg");m.className="promo-msg bad";m.textContent=msg||t("promo.bad");renderSummary();}
function applyPromo(){
  const c=$("promoInput").value.trim().toUpperCase(),m=$("promoMsg"),b=$("promoApply");
  if(promoBusy)return;
  const bad=msg=>{promo=null;promoCode="";m.className="promo-msg bad";m.textContent=msg||t("promo.bad");renderSummary();};
  if(!c){bad();return;}
  promoBusy=true;b.disabled=true;b.classList.add("dc-busy");m.className="promo-msg";m.setAttribute("aria-live","polite");
  m.textContent=v3T(DC.x("shop.promo.checking",0,"Đang kiểm tra mã…"),DC.x("shop.promo.checking",1,"Checking code…"));
  DC.api("/promo",{code:c,lang:DC.lang(),subtotal:subtotal()}).then(r=>{
    promoSub=subtotal();
    const p=r&&r.pct?{pct:+r.pct}:r&&r.fix?{fix:+r.fix}:r&&r.freeship?{freeship:true}:null;
    if(!p){bad();return;}
    promo=p;promoCode=String(r.code||c).toUpperCase();m.className="promo-msg ok";m.textContent=t("promo.ok").replace("{code}",promoCode);renderSummary();
  },err=>bad(err.status===404||err.status===400?t("promo.bad"):err.message)).then(()=>{promoBusy=false;b.disabled=false;b.classList.remove("dc-busy");});
}
$("payOpts").addEventListener("change",()=>{document.querySelectorAll(".pay-opt").forEach(o=>o.classList.toggle("sel",o.querySelector("input").checked));});
function dcPayName(v){return v==="momo"?t("pay.momo"):v==="zalopay"?t("pay.zalopay"):v==="vnpay"?t("pay.vnpay"):v==="installment"?t("pay.installment"):t("pay.bank");}
function dcQr(seed){var n=25,c=8,sz=n*c,s=0;for(var i=0;i<seed.length;i++)s=(s*31+seed.charCodeAt(i))>>>0;function rnd(){s=(s*1103515245+12345)>>>0;return (s>>>16)/65536;}var r='<svg viewBox="0 0 '+sz+' '+sz+'" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect width="'+sz+'" height="'+sz+'" fill="#fff"/>';for(var y=0;y<n;y++)for(var x=0;x<n;x++){if((x<8&&y<8)||(x>n-9&&y<8)||(x<8&&y>n-9))continue;if(rnd()>0.55)r+='<rect x="'+(x*c)+'" y="'+(y*c)+'" width="'+c+'" height="'+c+'" fill="#15181C"/>';}function fd(x,y){r+='<rect x="'+(x*c)+'" y="'+(y*c)+'" width="'+(7*c)+'" height="'+(7*c)+'" fill="#15181C"/><rect x="'+((x+1)*c)+'" y="'+((y+1)*c)+'" width="'+(5*c)+'" height="'+(5*c)+'" fill="#fff"/><rect x="'+((x+2)*c)+'" y="'+((y+2)*c)+'" width="'+(3*c)+'" height="'+(3*c)+'" fill="#15181C"/>';}fd(0,0);fd(n-7,0);fd(0,n-7);return r+'</svg>';}
$("placeOrder").onclick=()=>{const f=$("checkoutForm");if(!f.reportValidity())return;if(count()===0)return;const oid=(window.DC_LAST_ORDER&&DC_LAST_ORDER.code)||("#DC-"+Math.floor(100000+Math.random()*900000));$("orderId").textContent=oid;const pay=(document.querySelector('input[name="pay"]:checked')||{}).value||"bank";const total=(window.DC_LAST_ORDER&&DC_LAST_ORDER.total)||(Math.max(0,subtotal()-discountAmt())+shipFinal());var ex=$("okExtra");var recap='<div class="ok-recap"><div><span>'+t("sum.total")+'</span><b>'+fmt(total)+'</b></div><div><span>'+t("checkout.payMethod")+'</span><b>'+dcPayName(pay)+'</b></div></div>';if(pay==="bank"||pay==="momo"||pay==="zalopay"){ex.innerHTML=recap+'<div class="ok-qr"><div class="ok-qr-box">'+dcQr(oid,total)+'</div><div class="ok-qr-info"><div class="ok-qr-amt">'+fmt(total)+'</div><div class="ok-qr-note">'+t("ok.qrNote")+'</div><div class="ok-qr-demo">'+t("ok.qrDemo")+'</div></div></div>';}else{ex.innerHTML=recap;}$("success").classList.add("active");};
$("promoApply").onclick=applyPromo;
$("promoInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();applyPromo();}});
$("successClose").onclick=()=>{cart={};dcCartNote=false;promo=null;promoCode="";$("promoInput").value="";$("promoMsg").textContent="";sync();$("success").classList.remove("active");$("checkoutForm").reset();showView("shop");};
document.querySelector(".lang-switch").addEventListener("click",e=>{const b=e.target.closest("[data-lang]");if(!b)return;lang=b.dataset.lang;applyLang();});

(function(){var po=document.getElementById("payOpts");if(po)po.addEventListener("change",function(e){po.querySelectorAll(".pay-opt").forEach(function(l){l.classList.toggle("sel",l.contains(e.target)&&e.target.checked);});});})();

/* ================= SHOP V3 ================= */
var V3={galN:8,revN:5,revSort:false,revQ:"",galPid:null,revKey:null,pid:null};
function v3T(vi,en){return lang==="vi"?vi:en;}
function v3Static(){
  var a=$("v3Announce");if(a)a.textContent=v3T(DC.x("shop.pdp.j1",0,"Miễn phí giao hàng cho đơn từ {ship.free}đ  ·  Đổi trả trong 7 ngày"),DC.x("shop.pdp.j1",1,"Free shipping on orders over {ship.free}đ  ·  7-day returns"));
  var m=$("v3More");if(m)m.textContent=v3T(DC.x("shop.pdp.j2",0,"Xem thêm hình ảnh"),DC.x("shop.pdp.j2",1,"Load more images"));
  var n=$("v3News");
  if(n&&!n.dataset.done){
    n.innerHTML='<h3>'+v3T(DC.x("shop.pdp.j3",0,"Gia nhập Dapper Combat Club"),DC.x("shop.pdp.j3",1,"Join the Dapper Combat Club"))+'</h3>'+
      '<p>'+v3T(DC.x("shop.pdp.j4",0,"Nhận ưu đãi sớm, lịch khai giảng và sản phẩm mới mỗi tháng."),DC.x("shop.pdp.j4",1,"Get early offers, class openings and new drops every month."))+'</p>'+
      '<form class="v3-news-form" id="v3NewsForm"><input type="email" required placeholder="'+v3T(DC.x("shop.pdp.j5",0,"Email của bạn"),DC.x("shop.pdp.j5",1,"Your email"))+'"><button type="submit">'+v3T(DC.x("shop.pdp.j6",0,"ĐĂNG KÝ"),DC.x("shop.pdp.j6",1,"SIGN UP"))+'</button></form>'+
      '<small>'+v3T(DC.x("shop.pdp.j7",0,"Bằng việc đăng ký, bạn đồng ý nhận email từ Dapper Combat. Có thể hủy bất cứ lúc nào."),DC.x("shop.pdp.j7",1,"By signing up you agree to receive emails from Dapper Combat. Unsubscribe anytime."))+'</small>';
  }
  V3.revKey=null;
}
/* đánh giá: chỉ gồm tên, số sao, lời đánh giá (và ảnh nếu có) lấy từ danh sách sửa được trong /admin — không thêm thành phố, ngày, phân loại tự bịa */
function v3RevList(p){
  var el=$("v3RList");if(!el||!p)return;
  var list=REVIEWS.map(function(r,i){return {r:r,i:i};});
  if(V3.revQ){var q=V3.revQ.toLowerCase();list=list.filter(function(o){return (o.r[0]+" "+(lang==="en"?o.r[2][1]:o.r[2][0])).toLowerCase().indexOf(q)>-1;});}
  if(V3.revSort)list.sort(function(a,b){return b.r[1]-a.r[1];});
  var rows=list.slice(0,V3.revN).map(function(o){
    var r=o.r;
    return '<div class="v3-rrow"><div class="v3-rmeta"><div class="v3-rname">'+r[0]+'</div></div>'+
      '<div class="v3-rbody"><div class="v3-rtop"><span class="v3-rstars" aria-label="'+r[1]+'/5">'+stars(r[1])+'</span></div>'+
      '<p class="v3-rtext">'+(lang==="en"?r[2][1]:r[2][0])+'</p>'+(r[4]?'<img class="v3-rphoto" src="'+r[4]+'" alt="" loading="lazy">':'')+'</div></div>';
  }).join("");
  el.innerHTML=(rows||'<p class="v3-rempty">'+v3T(DC.x("shop.pdp.j11",0,"Không tìm thấy đánh giá phù hợp."),DC.x("shop.pdp.j11",1,"No matching reviews."))+'</p>')+
    (list.length>V3.revN?'<div class="v3-rmore-wrap"><button type="button" class="v3-rmore" id="v3RevMore">'+v3T(DC.x("shop.pdp.j12",0,"XEM THÊM ĐÁNH GIÁ"),DC.x("shop.pdp.j12",1,"LOAD MORE REVIEWS"))+' ('+(list.length-V3.revN)+')</button></div>':'');
}
function v3Reviews(p){
  var box=$("v3Reviews");if(!box||!p)return;
  if(!REVIEWS.length){box.innerHTML="";box.style.display="none";return;}
  box.style.display="";
  /* điểm trung bình + số đánh giá tính từ danh sách đánh giá */
  var avg=REVIEWS.reduce(function(s,r){return s+(+r[1]||0);},0)/REVIEWS.length;
  box.innerHTML='<div class="v3-rhead"><div class="v3-ravg"><div class="v3-rbig">'+avg.toFixed(1)+' <span>'+stars(avg)+'</span></div>'+
    '<div class="v3-rcount">'+v3T(DC.x("shop.pdp.j13",0,"Dựa trên"),DC.x("shop.pdp.j13",1,"Based on"))+' '+REVIEWS.length+' '+v3T(DC.x("shop.pdp.j14",0,"đánh giá"),DC.x("shop.pdp.j14",1,"reviews"))+'</div></div></div>'+
    '<div class="v3-rtools"><div class="v3-rtl"><button type="button" class="v3-sort" id="v3Sort">'+(V3.revSort?v3T(DC.x("shop.pdp.j19",0,"SAO CAO NHẤT"),DC.x("shop.pdp.j19",1,"HIGHEST RATED")):v3T(DC.x("shop.pdp.j20",0,"MỚI NHẤT"),DC.x("shop.pdp.j20",1,"NEWEST")))+' ⌄</button>'+
    ('<label class="v3-rsearch">'+DC.i("shop.icon.js1",'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>')+'<input id="v3RevQ" placeholder="')+v3T(DC.x("shop.pdp.j21",0,"TÌM KIẾM"),DC.x("shop.pdp.j21",1,"SEARCH"))+'"></label></div>'+
    '<div class="v3-rtabs"><span class="on">'+v3T(DC.x("shop.pdp.j22",0,"ĐÁNH GIÁ SẢN PHẨM"),DC.x("shop.pdp.j22",1,"PRODUCT REVIEWS"))+'</span></div></div>'+
    '<div class="v3-rlist" id="v3RList"></div>';
  var qi=$("v3RevQ");if(qi)qi.value=V3.revQ;
  v3RevList(p);
}
/* gallery chỉ gồm ảnh của chính sản phẩm (ảnh chính + các ảnh cận chi tiết cắt từ ảnh chính) và 2 video chung (/admin → Hình ảnh; tắt ở Thiết lập)
   — không mượn ảnh của sản phẩm khác; sản phẩm có ảnh phụ tải lên thì shop-site.js dùng ảnh phụ thay cho ảnh cắt */
function v3Media(p){
  var main=IMG[p.img],crop=function(n){return {type:"img",src:main,crop:"v3-crop"+n};};
  var out=[{type:"img",src:main},crop(1)],vids=vidsOf(p);
  if(vids[0])out.push({type:"video",src:vids[0]});
  out.push(crop(2),crop(3),crop(4));
  if(vids[1])out.push({type:"video",src:vids[1]});
  return out;
}
function v3Render(){
  var p=PRODUCTS.find(function(x){return x.id===detailId;});if(!p)return;
  if(V3.pid!==p.id){V3.pid=p.id;V3.revN=5;V3.revQ="";V3.revSort=false;}
  $("v3Crumb").innerHTML='<a data-v3="shop">'+v3T(DC.x("shop.pdp.j24",0,"CỬA HÀNG"),DC.x("shop.pdp.j24",1,"SHOP"))+'</a><span>/</span><a data-v3="cat">'+t("cat."+p.cat)+'</a><span>/</span><b>'+pn(p)+'</b>';
  if(V3.galPid!==p.id){
    V3.galPid=p.id;
    var media=v3Media(p),g=$("v3Gal");
    g.innerHTML=media.map(function(m,i){
      return '<div class="v3-tile'+(m.crop?' '+m.crop:'')+(i>=V3.galN?' v3-extra':'')+'" data-i="'+i+'">'+(m.type==="img"?'<img src="'+m.src+'" alt="">':'<video src="'+m.src+'" muted loop playsinline autoplay preload="metadata"></video>')+'</div>';
    }).join("");
    g.classList.remove("v3-all");
    $("v3More").style.display=media.length>V3.galN?"":"none";
  }
  var w=wish.has(p.id);
  $("v3Wish").innerHTML=(w?v3T(DC.x("shop.pdp.fav.on",0,"Đã lưu vào yêu thích"),DC.x("shop.pdp.fav.on",1,"Saved to favourites")):v3T(DC.x("shop.pdp.j25",0,"Thêm vào yêu thích"),DC.x("shop.pdp.j25",1,"Add to wishlist")))+' <span>'+(w?"♥":"♡")+'</span>';
  $("v3Wish").setAttribute("aria-pressed",w?"true":"false");
  $("v3Heart").textContent=w?"♥":"♡";$("v3Heart").classList.toggle("on",w);$("v3Heart").setAttribute("aria-pressed",w?"true":"false");
  $("dRating").textContent="("+p.reviews+" "+v3T(DC.x("shop.pdp.j26",0,"đánh giá"),DC.x("shop.pdp.j26",1,"reviews"))+")";
  /* màu: ô màu (không lặp lại cùng một ảnh cho mọi màu) */
  $("dColors").innerHTML=p.colors.map(function(c){
    var oos=DC.hasVariants(p)&&DC.vstock(p,detailSize,c[0])<=0;
    return '<button type="button" class="v3-ctile v3-csw'+(c[0]===detailColor?' sel':'')+(oos?' oos':'')+'" data-color="'+c[0]+'"'+(oos?' aria-disabled="true"':'')+' title="'+DC.esc(cn(p,c[0]))+'" aria-label="'+DC.esc(cn(p,c[0]))+'" aria-pressed="'+(c[0]===detailColor)+'"><i style="background:'+c[1]+'"></i></button>';
  }).join("");
  $("v3Fit").textContent=v3T(DC.x("shop.pdp.j27",0,"Form chuẩn Dapper Combat. Nếu phân vân giữa 2 size, chọn size lớn hơn để thoải mái khi tập."),DC.x("shop.pdp.j27",1,"True-to-size Dapper Combat fit. Between sizes? Size up for comfort while training."));
  $("v3Ship").innerHTML='<span class="v3-eta">'+v3T(DC.x("shop.pdp.j28",0,"Giao dự kiến "),DC.x("shop.pdp.j28",1,"Arrives "))+'<b>'+v3pEta()+'</b></span><span>'+v3T(DC.x("shop.pdp.j29",0,"Miễn phí giao hàng cho đơn từ {ship.free}đ"),DC.x("shop.pdp.j29",1,"Free shipping on orders over {ship.free}đ"))+'</span><span>'+v3T(DC.x("shop.pdp.j30",0,"Đổi trả 7 ngày · Hàng chính hãng"),DC.x("shop.pdp.j30",1,"7-day returns · Authentic gear"))+'</span>';
  var fi=document.querySelector("#dAcc .acc-item .acc-inner");
  if(fi&&!fi.querySelector(".v3-feats"))fi.insertAdjacentHTML("beforeend",'<ul class="v3-feats">'+featsOf(p).map(function(x){return "<li>"+x+"</li>";}).join("")+'</ul>');
  /* "Hoàn thiện bộ trang phục": chỉ ghép sản phẩm còn hàng */
  var pair=DC.soldOut(p)?null:PRODUCTS.find(function(x){return x.cat!==p.cat&&x.id!==p.id&&!DC.soldOut(x);});
  $("v3Set").innerHTML=pair?('<h4>'+v3T(DC.x("shop.pdp.j31",0,"Hoàn thiện bộ trang phục"),DC.x("shop.pdp.j31",1,"Complete the set"))+'</h4>'+
    '<div class="v3-set-row"><div class="v3-set-item" data-open="'+p.id+'"><img src="'+IMG[p.img]+'" alt=""><span>'+pn(p)+'</span><b>'+fmt(p.price)+'</b></div>'+
    '<div class="v3-set-plus">+</div>'+
    '<div class="v3-set-item" data-open="'+pair.id+'"><img src="'+IMG[pair.img]+'" alt=""><span>'+pn(pair)+'</span><b>'+fmt(pair.price)+'</b></div></div>'+
    '<div class="v3-set-foot"><span>'+v3T(DC.x("shop.pdp.j32",0,"Tổng"),DC.x("shop.pdp.j32",1,"Total"))+': <b>'+fmt(p.price+pair.price)+'</b></span><button type="button" id="v3SetAdd" data-pair="'+pair.id+'">'+v3T(DC.x("shop.pdp.j33",0,"THÊM CẢ BỘ VÀO GIỎ"),DC.x("shop.pdp.j33",1,"ADD SET TO CART"))+'</button></div>'):"";
  var key=p.id+"|"+lang;
  if(V3.revKey!==key){V3.revKey=key;v3Reviews(p);}
}
(function(){
  var _rd=renderDetail;renderDetail=function(){_rd.apply(this,arguments);try{v3Render();}catch(e){console.error("v3",e);}};
  var _al=applyLang;applyLang=function(){_al.apply(this,arguments);try{v3Static();if(detailId)v3Render();}catch(e){console.error("v3",e);}};
  function cur(){return PRODUCTS.find(function(x){return x.id===detailId;});}
  document.addEventListener("click",function(e){
    var el=e.target;
    if(el.closest("#v3More")){$("v3Gal").classList.add("v3-all");$("v3More").style.display="none";return;}
    var tile=el.closest("#v3Gal .v3-tile");if(tile){var im=tile.querySelector("img");if(im){$("v3LbImg").src=im.src;$("v3Lb").classList.add("on");}return;}
    if(el.closest("#v3Lb")){$("v3Lb").classList.remove("on");return;}
    var cr=el.closest("#v3Crumb [data-v3]");if(cr){if(cr.dataset.v3==="shop"){$("crumbShop").click();}else{$("crumbCat").click();}return;}
    if(el.closest("#v3Wish")||el.closest("#v3Heart")){$("dWish").click();return;}
    var sa=el.closest("#v3SetAdd");if(sa){var p=cur(),pr=PRODUCTS.find(function(x){return x.id===sa.dataset.pair;});if(p&&pr){var v=DC.firstVariant(pr);addToCart(p.id,detailSize,detailColor,1);addToCart(pr.id,v[0],v[1],1);openCart();}return;}
    var so=el.closest("#v3Set [data-open]");if(so){openDetail(so.dataset.open);window.scrollTo({top:0,behavior:"smooth"});return;}
    if(el.closest("#v3Sort")){V3.revSort=!V3.revSort;V3.revN=5;v3Reviews(cur());return;}
    if(el.closest("#v3RevMore")){V3.revN+=5;v3RevList(cur());return;}
    if(el.closest("#detailView .pdp-rating")){var rv=$("v3Reviews");if(rv)rv.scrollIntoView({behavior:"smooth",block:"start"});return;}
  });
  document.addEventListener("input",function(e){if(e.target&&e.target.id==="v3RevQ"){V3.revQ=e.target.value;V3.revN=5;v3RevList(cur());}});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"){var lb=$("v3Lb");if(lb)lb.classList.remove("on");}});
  document.addEventListener("submit",function(e){
    /* đăng ký nhận tin: chỉ báo "Cảm ơn" khi server nhận; lỗi → báo lỗi, giữ nguyên email đã nhập */
    if(e.target&&e.target.id==="v3NewsForm"){e.preventDefault();var fm=e.target,inp=fm.querySelector("input"),btn=fm.querySelector("button"),n=$("v3News");
      if(fm.dataset.busy)return;fm.dataset.busy="1";if(btn)btn.disabled=true;
      var oe=n.querySelector(".dc-form-err");if(oe)oe.remove();
      DC.subscribe((inp||{}).value,"shop").then(function(){n.dataset.done="1";
        n.innerHTML='<h3>'+v3T(DC.x("shop.other.j1",0,"Cảm ơn bạn!"),DC.x("shop.other.j1",1,"Thank you!"))+'</h3><p>'+v3T(DC.x("shop.other.j2",0,"Bạn đã đăng ký nhận tin từ Dapper Combat."),DC.x("shop.other.j2",1,"You are now subscribed to Dapper Combat updates."))+'</p>';
      },function(err){delete fm.dataset.busy;if(btn)btn.disabled=false;fm.insertAdjacentHTML("afterend",'<p class="dc-form-err" role="alert">'+DC.esc(err.message)+'</p>');if(inp)inp.focus();});}
  });
})();


/* ---------- V3: Hướng dẫn chọn size (ngăn trượt) ---------- */
var V3SG={
  ao:{head:[[DC.x("shop.sizeguide.j1",0,"Size"),DC.x("shop.sizeguide.j1",1,"Size")],[DC.x("shop.sizeguide.j2",0,"Ngực"),DC.x("shop.sizeguide.j2",1,"Chest")],[DC.x("shop.sizeguide.j3",0,"Dài áo"),DC.x("shop.sizeguide.j3",1,"Length")],[DC.x("shop.sizeguide.j4",0,"Vai"),DC.x("shop.sizeguide.j4",1,"Shoulder")],[DC.x("shop.sizeguide.j5",0,"Chiều cao"),DC.x("shop.sizeguide.j5",1,"Height")],[DC.x("shop.sizeguide.j6",0,"Cân nặng"),DC.x("shop.sizeguide.j6",1,"Weight")]],
      unit:[0,"cm","cm","cm","cm","kg"],
      rows:DC.list("shop.sizeguide.ao",function($k){return [[DC.x($k("shop.sizeguide.j25"),0,"S"),DC.x($k("shop.sizeguide.j26"),0,"96"),DC.x($k("shop.sizeguide.j27"),0,"68"),DC.x($k("shop.sizeguide.j28"),0,"44"),DC.x($k("shop.sizeguide.j29"),0,"160–168"),DC.x($k("shop.sizeguide.j30"),0,"50–60")],[DC.x($k("shop.sizeguide.j31"),0,"M"),DC.x($k("shop.sizeguide.j32"),0,"102"),DC.x($k("shop.sizeguide.j33"),0,"71"),DC.x($k("shop.sizeguide.j34"),0,"46"),DC.x($k("shop.sizeguide.j35"),0,"168–174"),DC.x($k("shop.sizeguide.j36"),0,"60–70")],[DC.x($k("shop.sizeguide.j37"),0,"L"),DC.x($k("shop.sizeguide.j38"),0,"108"),DC.x($k("shop.sizeguide.j39"),0,"74"),DC.x($k("shop.sizeguide.j40"),0,"48"),DC.x($k("shop.sizeguide.j41"),0,"174–180"),DC.x($k("shop.sizeguide.j42"),0,"70–80")],[DC.x($k("shop.sizeguide.j43"),0,"XL"),DC.x($k("shop.sizeguide.j44"),0,"114"),DC.x($k("shop.sizeguide.j45"),0,"77"),DC.x($k("shop.sizeguide.j46"),0,"50"),DC.x($k("shop.sizeguide.j47"),0,"180–186"),DC.x($k("shop.sizeguide.j48"),0,"80–90")]];}),
      how:DC.list("shop.sizeguide.how.ao",function($k){return [[DC.x($k("shop.sizeguide.how.ao.1.t"),0,"Ngực"),DC.x($k("shop.sizeguide.how.ao.1.t"),1,"Chest"),DC.x($k("shop.sizeguide.how.ao.1.d"),0,"Đo vòng quanh phần nở nhất của ngực, giữ thước song song mặt đất."),DC.x($k("shop.sizeguide.how.ao.1.d"),1,"Measure around the fullest part of your chest, keeping the tape level.")],
           [DC.x($k("shop.sizeguide.how.ao.2.t"),0,"Dài áo"),DC.x($k("shop.sizeguide.how.ao.2.t"),1,"Length"),DC.x($k("shop.sizeguide.how.ao.2.d"),0,"Đo từ điểm cao nhất của vai xuống gấu áo."),DC.x($k("shop.sizeguide.how.ao.2.d"),1,"From the highest point of the shoulder down to the hem.")],
           [DC.x($k("shop.sizeguide.how.ao.3.t"),0,"Vai"),DC.x($k("shop.sizeguide.how.ao.3.t"),1,"Shoulder"),DC.x($k("shop.sizeguide.how.ao.3.d"),0,"Đo ngang từ đầu vai trái sang đầu vai phải."),DC.x($k("shop.sizeguide.how.ao.3.d"),1,"Straight across from one shoulder point to the other.")]];}),
      note:[DC.x("shop.sizeguide.j7",0,"Form unisex. Thích mặc rộng kiểu oversize thì tăng 1 size."),DC.x("shop.sizeguide.j7",1,"Unisex fit. For a relaxed oversized look, size up.")]},
  dotap:{head:[[DC.x("shop.sizeguide.j8",0,"Size"),DC.x("shop.sizeguide.j8",1,"Size")],[DC.x("shop.sizeguide.j9",0,"Eo"),DC.x("shop.sizeguide.j9",1,"Waist")],[DC.x("shop.sizeguide.j10",0,"Hông"),DC.x("shop.sizeguide.j10",1,"Hips")],[DC.x("shop.sizeguide.j11",0,"Dài quần"),DC.x("shop.sizeguide.j11",1,"Length")],[DC.x("shop.sizeguide.j12",0,"Chiều cao"),DC.x("shop.sizeguide.j12",1,"Height")],[DC.x("shop.sizeguide.j13",0,"Cân nặng"),DC.x("shop.sizeguide.j13",1,"Weight")]],
      unit:[0,"cm","cm","cm","cm","kg"],
      rows:DC.list("shop.sizeguide.dotap",function($k){return [[DC.x($k("shop.sizeguide.j49"),0,"S"),DC.x($k("shop.sizeguide.j50"),0,"62–68"),DC.x($k("shop.sizeguide.j51"),0,"86–92"),DC.x($k("shop.sizeguide.j52"),0,"88"),DC.x($k("shop.sizeguide.j53"),0,"150–160"),DC.x($k("shop.sizeguide.j54"),0,"42–52")],[DC.x($k("shop.sizeguide.j55"),0,"M"),DC.x($k("shop.sizeguide.j56"),0,"68–74"),DC.x($k("shop.sizeguide.j57"),0,"92–98"),DC.x($k("shop.sizeguide.j58"),0,"91"),DC.x($k("shop.sizeguide.j59"),0,"158–166"),DC.x($k("shop.sizeguide.j60"),0,"50–60")],[DC.x($k("shop.sizeguide.j61"),0,"L"),DC.x($k("shop.sizeguide.j62"),0,"74–80"),DC.x($k("shop.sizeguide.j63"),0,"98–104"),DC.x($k("shop.sizeguide.j64"),0,"94"),DC.x($k("shop.sizeguide.j65"),0,"164–172"),DC.x($k("shop.sizeguide.j66"),0,"58–68")]];}),
      how:DC.list("shop.sizeguide.how.dotap",function($k){return [[DC.x($k("shop.sizeguide.how.dotap.1.t"),0,"Eo"),DC.x($k("shop.sizeguide.how.dotap.1.t"),1,"Waist"),DC.x($k("shop.sizeguide.how.dotap.1.d"),0,"Đo vòng quanh phần nhỏ nhất của eo."),DC.x($k("shop.sizeguide.how.dotap.1.d"),1,"Around the narrowest part of your waist.")],
           [DC.x($k("shop.sizeguide.how.dotap.2.t"),0,"Hông"),DC.x($k("shop.sizeguide.how.dotap.2.t"),1,"Hips"),DC.x($k("shop.sizeguide.how.dotap.2.d"),0,"Đo vòng quanh phần nở nhất của hông."),DC.x($k("shop.sizeguide.how.dotap.2.d"),1,"Around the fullest part of your hips.")],
           [DC.x($k("shop.sizeguide.how.dotap.3.t"),0,"Dài quần"),DC.x($k("shop.sizeguide.how.dotap.3.t"),1,"Length"),DC.x($k("shop.sizeguide.how.dotap.3.d"),0,"Đo từ cạp quần xuống mắt cá chân."),DC.x($k("shop.sizeguide.how.dotap.3.d"),1,"From the waistband down to the ankle.")]];}),
      note:[DC.x("shop.sizeguide.j14",0,"Vải co giãn 4 chiều — nếu giữa 2 size, chọn size nhỏ hơn để ôm dáng."),DC.x("shop.sizeguide.j14",1,"4-way stretch — between sizes, size down for a snug fit.")]},
  gang:{head:[[DC.x("shop.sizeguide.j15",0,"Size"),DC.x("shop.sizeguide.j15",1,"Size")],[DC.x("shop.sizeguide.j16",0,"Cân nặng"),DC.x("shop.sizeguide.j16",1,"Body weight")],[DC.x("shop.sizeguide.j17",0,"Phù hợp"),DC.x("shop.sizeguide.j17",1,"Best for")]],
      unit:[0,"kg",0],
      rows:DC.list("shop.sizeguide.gang",function($k){return [[DC.x($k("shop.sizeguide.j67"),0,"12oz"),DC.x($k("shop.sizeguide.j68"),0,"< 60"),DC.x($k("shop.sizeguide.j69"),0,"Tập bao, đấm pad")+"|"+DC.x($k("shop.sizeguide.j69"),1,"Bag & pad work")],[DC.x($k("shop.sizeguide.j70"),0,"14oz"),DC.x($k("shop.sizeguide.j71"),0,"60–80"),DC.x($k("shop.sizeguide.j72"),0,"Tập luyện + sparring nhẹ")+"|"+DC.x($k("shop.sizeguide.j72"),1,"Training & light sparring")],[DC.x($k("shop.sizeguide.j73"),0,"16oz"),DC.x($k("shop.sizeguide.j74"),0,"> 80"),DC.x($k("shop.sizeguide.j75"),0,"Sparring|Sparring")]];}),
      how:DC.list("shop.sizeguide.how.gang",function($k){return [[DC.x($k("shop.sizeguide.how.gang.1.t"),0,"Cân nặng"),DC.x($k("shop.sizeguide.how.gang.1.t"),1,"Body weight"),DC.x($k("shop.sizeguide.how.gang.1.d"),0,"Chọn trọng lượng găng theo cân nặng cơ thể của bạn."),DC.x($k("shop.sizeguide.how.gang.1.d"),1,"Pick the glove weight based on your body weight.")],
           [DC.x($k("shop.sizeguide.how.gang.2.t"),0,"Mục đích"),DC.x($k("shop.sizeguide.how.gang.2.t"),1,"Purpose"),DC.x($k("shop.sizeguide.how.gang.2.d"),0,"Sparring nên dùng găng nặng hơn để bảo vệ bạn tập."),DC.x($k("shop.sizeguide.how.gang.2.d"),1,"Use heavier gloves for sparring to protect your partner.")],
           [DC.x($k("shop.sizeguide.how.gang.3.t"),0,"Băng quấn tay"),DC.x($k("shop.sizeguide.how.gang.3.t"),1,"Hand wraps"),DC.x($k("shop.sizeguide.how.gang.3.d"),0,"Luôn quấn băng tay trước khi đeo găng."),DC.x($k("shop.sizeguide.how.gang.3.d"),1,"Always wear hand wraps under your gloves.")]];}),
      note:[DC.x("shop.sizeguide.j18",0,"Phân vân giữa 2 mức? Người mới nên bắt đầu với 14oz."),DC.x("shop.sizeguide.j18",1,"Between two weights? Beginners should start with 14oz.")]},
  phukien:{free:true,note:[DC.x("shop.sizeguide.j19",0,"Freesize — có khóa / dây điều chỉnh vừa mọi kích cỡ."),DC.x("shop.sizeguide.j19",1,"One size — adjustable to fit everyone.")]}
};
var V3SGSVG={
  ao:DC.i("shop.sizeguide.icon.ao",'<svg class="v3-sg-svg" viewBox="0 0 200 200" aria-hidden="true"><path d="M70 30 L48 40 L18 72 L38 90 L52 78 L52 176 L148 176 L148 78 L162 90 L182 72 L152 40 L130 30 Q115 46 100 46 Q85 46 70 30 Z" fill="#efefef" stroke="#15181C" stroke-width="2" stroke-linejoin="round"/><g stroke="#D4372E" stroke-width="2" stroke-dasharray="4 3"><line x1="70" y1="33" x2="130" y2="33"/><line x1="54" y1="98" x2="146" y2="98"/><line x1="128" y1="44" x2="128" y2="174"/></g><g font-family="Roboto Mono,monospace" font-size="10" font-weight="700" text-anchor="middle"><circle cx="100" cy="98" r="9" fill="#15181C"/><text x="100" y="101.5" fill="#fff">1</text><circle cx="128" cy="140" r="9" fill="#15181C"/><text x="128" y="143.5" fill="#fff">2</text><circle cx="100" cy="33" r="9" fill="#15181C"/><text x="100" y="36.5" fill="#fff">3</text></g></svg>'),
  dotap:DC.i("shop.sizeguide.icon.dotap",'<svg class="v3-sg-svg" viewBox="0 0 200 200" aria-hidden="true"><path d="M62 20 L138 20 L143 62 L132 186 L107 186 L100 84 L93 186 L68 186 L57 62 Z" fill="#efefef" stroke="#15181C" stroke-width="2" stroke-linejoin="round"/><g stroke="#D4372E" stroke-width="2" stroke-dasharray="4 3"><line x1="62" y1="25" x2="138" y2="25"/><line x1="57" y1="58" x2="143" y2="58"/><line x1="158" y1="20" x2="158" y2="186"/></g><g font-family="Roboto Mono,monospace" font-size="10" font-weight="700" text-anchor="middle"><circle cx="100" cy="25" r="9" fill="#15181C"/><text x="100" y="28.5" fill="#fff">1</text><circle cx="100" cy="58" r="9" fill="#15181C"/><text x="100" y="61.5" fill="#fff">2</text><circle cx="158" cy="110" r="9" fill="#15181C"/><text x="158" y="113.5" fill="#fff">3</text></g></svg>'),
  gang:DC.i("shop.sizeguide.icon.gang",'<svg class="v3-sg-svg" viewBox="0 0 200 200" aria-hidden="true"><path d="M70 74 Q70 40 106 40 Q142 40 142 78 L142 122 Q142 138 126 140 L82 140 Q66 140 66 124 L66 106 Q48 102 50 86 Q53 72 70 80 Z" fill="#efefef" stroke="#15181C" stroke-width="2" stroke-linejoin="round"/><rect x="74" y="140" width="60" height="34" rx="3" fill="#15181C"/><text x="104" y="162" font-family="Roboto Mono,monospace" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">12–16 OZ</text></svg>')
};
function v3SgCell(c,u,inch){
  var txt=String(c);
  if(txt.indexOf("|")>-1){var a=txt.split("|");txt=v3T(a[0],a[1]);}
  if(inch&&(u==="cm"||u==="kg")){var f=u==="cm"?1/2.54:2.2046;
    txt=txt.replace(/\d+(\.\d+)?/g,function(n){var v=parseFloat(n)*f;return u==="cm"?String(Math.round(v*10)/10):String(Math.round(v));});}
  return txt;
}
function v3SgRender(){
  var p=PRODUCTS.find(function(x){return x.id===detailId;}),el=$("v3Sg");if(!p||!el)return;
  var d=V3SG[v3Guide(p.cat)]||V3SG.phukien,tab=V3.sgTab||"chart",inch=!!V3.sgInch;
  var head='<div class="v3-sg-head"><h3>'+v3T(DC.x("shop.sizeguide.j20",0,"Hướng dẫn chọn size"),DC.x("shop.sizeguide.j20",1,"Size guide"))+'</h3><button class="v3-sg-x" type="button" data-sg="close" aria-label="close">✕</button></div><div class="v3-sg-sub">'+pn(p)+'</div>';
  var foot='<div class="v3-sg-foot">'+v3T(DC.x("shop.sizeguide.j21",0,"Vẫn phân vân? Nhắn Dapper Combat qua Zalo / Facebook để được tư vấn size."),DC.x("shop.sizeguide.j21",1,"Still unsure? Message Dapper Combat on Zalo / Facebook for sizing help."))+'</div>';
  if(d.free){el.innerHTML=head+'<div class="v3-sg-body"><p class="v3-sg-note">'+v3T(d.note[0],d.note[1])+'</p></div>'+foot;return;}
  var tabs='<div class="v3-sg-tabs"><button type="button" data-sg="tab-chart" class="'+(tab==="chart"?"on":"")+'">'+v3T(DC.x("shop.sizeguide.j22",0,"BẢNG SIZE"),DC.x("shop.sizeguide.j22",1,"SIZE CHART"))+'</button><button type="button" data-sg="tab-how" class="'+(tab==="how"?"on":"")+'">'+v3T(DC.x("shop.sizeguide.j23",0,"CÁCH ĐO"),DC.x("shop.sizeguide.j23",1,"HOW TO MEASURE"))+'</button></div>';
  var body;
  if(tab==="chart"){
    var th=d.head.map(function(hd,i){var u=d.unit[i],lab=v3T(hd[0],hd[1]);if(u==="cm")lab+=" ("+(inch?"in":"cm")+")";if(u==="kg")lab+=" ("+(inch?"lb":"kg")+")";return "<th>"+lab+"</th>";}).join("");
    var tr=d.rows.map(function(r){return "<tr"+(r[0]===detailSize?' class="sel"':"")+">"+r.map(function(c,i){return "<td>"+v3SgCell(c,d.unit[i],inch)+"</td>";}).join("")+"</tr>";}).join("");
    body='<div class="v3-sg-unit"><button type="button" data-sg="cm" class="'+(!inch?"on":"")+'">CM / KG</button><button type="button" data-sg="in" class="'+(inch?"on":"")+'">INCH / LB</button></div>'+
      '<div class="v3-sg-tablewrap"><table class="v3-sg-table"><thead><tr>'+th+'</tr></thead><tbody>'+tr+'</tbody></table></div>'+
      '<p class="v3-sg-note">'+v3T(d.note[0],d.note[1])+'</p><p class="v3-sg-ref">'+v3T(DC.x("shop.sizeguide.j24",0,"Số đo mang tính tham khảo, có thể chênh lệch ±1–2 cm."),DC.x("shop.sizeguide.j24",1,"Measurements are approximate and may vary by ±1–2 cm."))+'</p>';
  }else{
    body=(V3SGSVG[v3Guide(p.cat)]||"")+'<ol class="v3-sg-how">'+d.how.map(function(h,i){return "<li><b>"+(i+1)+". "+v3T(h[0],h[1])+"</b><span>"+v3T(h[2],h[3])+"</span></li>";}).join("")+"</ol>";
  }
  el.innerHTML=head+tabs+'<div class="v3-sg-body">'+body+"</div>"+foot;
}
function v3SgOpen(){V3.sgTab="chart";v3SgRender();$("v3Sg").classList.add("on");$("v3SgOv").classList.add("on");}
function v3SgClose(){var s=$("v3Sg"),o=$("v3SgOv");if(s)s.classList.remove("on");if(o)o.classList.remove("on");}
(function(){
  var _al2=applyLang;applyLang=function(){_al2.apply(this,arguments);var sg=$("v3Sg");if(sg&&sg.classList.contains("on"))v3SgRender();};
  document.addEventListener("click",function(e){
    var el=e.target;
    if(el.closest("#detailView .size-guide")){e.preventDefault();v3SgOpen();return;}
    if(el.closest("#v3SgOv")){v3SgClose();return;}
    var b=el.closest("#v3Sg [data-sg]");if(!b)return;var a=b.dataset.sg;
    if(a==="close")v3SgClose();
    else if(a==="tab-chart"){V3.sgTab="chart";v3SgRender();}
    else if(a==="tab-how"){V3.sgTab="how";v3SgRender();}
    else if(a==="cm"){V3.sgInch=false;v3SgRender();}
    else if(a==="in"){V3.sgInch=true;v3SgRender();}
  });
  document.addEventListener("keydown",function(e){if(e.key==="Escape")v3SgClose();});
})();


/* ---------- V3: trang danh sách kiểu collection ---------- */
var V3L={cat:"all",sort:"feat",sizes:[],colors:[],lastFilter:"all",fav:false};
var V3L_HOME="/";
/* nhãn trên ảnh: theo lựa chọn ở /admin → Sản phẩm (Mới / Bán chạy / Không nhãn); "Tự động" = chỉ hiện % giảm giá khi có giá gốc */
var V3L_NEW=PRODUCTS.filter(function(p){return p.badge==="new";}).map(function(p){return p.id;});
var V3L_BEST=PRODUCTS.filter(function(p){return p.badge==="best";}).map(function(p){return p.id;});
var V3L_DESC={
  all:[DC.x("shop.list.j1",0,"Trang bị thi đấu & trang phục tập luyện chính hãng Dapper Combat — bền bỉ, thoải mái, sẵn sàng lên sàn."),DC.x("shop.list.j1",1,"Official Dapper Combat fight gear and training apparel — built to last, comfortable, ready for the ring.")]
};
DC.cats().forEach(function(c){V3L_DESC[c.id]=[c.desc.vi,c.desc.en||c.desc.vi];});
function v3lAllSizes(){var o=[];PRODUCTS.forEach(function(p){p.sizes.forEach(function(s){if(o.indexOf(s)<0)o.push(s);});});return o;}
function v3lAllColors(){var o=[],seen={};PRODUCTS.forEach(function(p){p.colors.forEach(function(c){if(!seen[c[0]]){seen[c[0]]=1;o.push(c);}});});return o;}
function v3lList(){
  var l=PRODUCTS.filter(function(p){
    return (V3L.cat==="all"||p.cat===V3L.cat)&&(!V3L.fav||wish.has(p.id))&&
      (!V3L.sizes.length||p.sizes.some(function(s){return V3L.sizes.indexOf(s)>-1;}))&&
      (!V3L.colors.length||p.colors.some(function(c){return V3L.colors.indexOf(c[0])>-1;}));
  });
  /* "Bán chạy": sản phẩm gắn nhãn Bán chạy lên trước (không dựa vào số đánh giá) */
  if(V3L.sort==="best")l.sort(function(a,b){return (b.badge==="best")-(a.badge==="best");});
  else if(V3L.sort==="asc")l.sort(function(a,b){return a.price-b.price;});
  else if(V3L.sort==="desc")l.sort(function(a,b){return b.price-a.price;});
  return l;
}
function v3lActive(){return V3L.sizes.length+V3L.colors.length+(V3L.sort!=="feat"?1:0)+(V3L.fav?1:0);}
function v3lFavTxt(){var n=PRODUCTS.filter(function(p){return wish.has(p.id);}).length;return v3T(DC.x("shop.list.fav",0,"Yêu thích"),DC.x("shop.list.fav",1,"Favourites"))+" ("+n+")";}
function v3lCard(p){
  var badge="",sale=false,out=DC.soldOut(p);
  if(p.old){badge="-"+Math.round((1-p.price/p.old)*100)+"%";sale=true;}
  else if(V3L_NEW.indexOf(p.id)>-1)badge=v3T(DC.x("shop.list.j6",0,"MỚI"),DC.x("shop.list.j6",1,"NEW"));
  else if(V3L_BEST.indexOf(p.id)>-1)badge=v3T(DC.x("shop.list.j7",0,"BÁN CHẠY"),DC.x("shop.list.j7",1,"BEST SELLER"));
  var w=wish.has(p.id),free=p.sizes.length===1;
    var qa=out?'<button type="button" disabled>'+soldTxt()+'</button>':free?(colorFor(p,p.sizes[0])?'<button type="button" data-qa="'+p.id+'|'+p.sizes[0]+'">'+v3T(DC.x("shop.list.j8",0,"THÊM VÀO GIỎ"),DC.x("shop.list.j8",1,"ADD TO CART"))+'</button>':'<button type="button" disabled>'+soldTxt()+'</button>'):
    p.sizes.map(function(s){return colorFor(p,s)?'<button type="button" data-qa="'+p.id+'|'+s+'">'+s+'</button>':'<button type="button" class="oos" disabled title="'+soldTxt()+'">'+s+'</button>';}).join("");
  return '<div class="v3c'+(out?' v3c-out':'')+'" data-open="'+p.id+'"><div class="v3c-media">'+
    (out?'<span class="v3c-badge v3-out-badge">'+soldTxt()+'</span>':badge?'<span class="v3c-badge'+(sale?' sale':'')+'">'+badge+'</span>':'')+
    '<button type="button" class="v3c-heart'+(w?' on':'')+'" data-v3h="'+p.id+'" aria-label="'+v3T(DC.x("shop.list.fav",0,"Yêu thích"),DC.x("shop.list.fav",1,"Favourites"))+'" aria-pressed="'+w+'">'+(w?"♥":"♡")+'</button>'+
    '<img src="'+IMG[p.img]+'" alt="'+DC.esc(pn(p))+'">'+
    '<div class="v3c-qa"><span>'+(out?soldTxt():free?v3T(DC.x("shop.list.j9",0,"THÊM NHANH"),DC.x("shop.list.j9",1,"QUICK ADD")):v3T(DC.x("shop.list.j10",0,"CHỌN SIZE"),DC.x("shop.list.j10",1,"CHOOSE SIZE")))+'</span><div>'+qa+'</div></div></div>'+
    '<div class="v3c-info"><div class="v3c-name">'+pn(p)+'</div>'+
    '<div class="v3c-col">'+cn(p,p.colors[0][0])+' / '+p.colors.length+' '+(p.colors.length>1?v3T(DC.x("shop.list.j11",0,"MÀU"),DC.x("shop.list.j11",1,"COLOURS")):v3T(DC.x("shop.list.j12",0,"MÀU"),DC.x("shop.list.j12",1,"COLOUR")))+'</div>'+
    '<div class="v3c-price">'+fmt(p.price)+(p.old?' <s>'+fmt(p.old)+'</s>':'')+'</div></div></div>';
}
function v3lPromoGo(cat){V3L.cat=cat;V3L.fav=false;V3L.sizes=[];V3L.colors=[];v3lRefresh();var c=$("v3Coll");if(c)window.scrollTo({top:c.getBoundingClientRect().top+scrollY-70,behavior:"smooth"});}
function v3lPromo(cat,imgKey,vi,en){
  return '<div class="v3-promo" data-promo="'+cat+'"><img src="'+(IMG[imgKey]||imgKey)+'" alt=""><div class="v3-promo-in"><h3>'+v3T(vi,en)+'</h3><span class="v3-promo-btn">'+v3T(DC.x("shop.list.j13",0,"MUA NGAY"),DC.x("shop.list.j13",1,"SHOP NOW"))+'</span></div></div>';
}
function v3RenderGrid(){
  var l=v3lList(),g=$("grid");if(!g)return;
  /* chưa có sản phẩm nào trên server */
  if(!PRODUCTS.length){v3RenderTiles(false);g.innerHTML='<div class="v3-empty" role="status">'+v3T(DC.x("shop.list.none",0,"Sản phẩm đang được cập nhật. Vui lòng quay lại sau."),DC.x("shop.list.none",1,"Products are being updated. Please check back soon."))+'</div>';return;}
  /* lọc "Yêu thích" mà chưa lưu sản phẩm nào */
  if(!l.length)v3RenderTiles(false);
  if(!l.length&&V3L.fav){g.innerHTML='<div class="v3-empty" role="status">'+v3T(DC.x("shop.list.fav.empty",0,"Bạn chưa lưu sản phẩm yêu thích nào. Bấm ♡ trên ảnh sản phẩm để lưu lại."),DC.x("shop.list.fav.empty",1,"You haven't saved any favourites yet. Tap ♡ on a product to save it."))+'<br><button type="button" data-v3clear="1">'+v3T(DC.x("shop.list.fav.all",0,"XEM TẤT CẢ SẢN PHẨM"),DC.x("shop.list.fav.all",1,"VIEW ALL PRODUCTS"))+'</button></div>';return;}
  if(!l.length){g.innerHTML='<div class="v3-empty">'+v3T(DC.x("shop.list.j14",0,"Không có sản phẩm phù hợp với bộ lọc."),DC.x("shop.list.j14",1,"No products match your filters."))+'<br><button type="button" data-v3clear="1">'+v3T(DC.x("shop.list.j15",0,"XÓA BỘ LỌC"),DC.x("shop.list.j15",1,"CLEAR FILTERS"))+'</button></div>';return;}
  var plain=V3L.cat==="all"&&!v3lActive();
  var html=l.map(v3lCard);
  g.innerHTML=html.join("");
  v3RenderTiles(plain);
}
/* ô ảnh dẫn tới danh mục (Thiết lập → Danh mục sản phẩm): khối riêng dưới lưới, chỉ hiện khi đang xem tất cả, chưa lọc */
function v3RenderTiles(plain){
  var box=$("v3Tiles");if(!box)return;
  var tiles=(DC.setting("shop.tiles",[])||[]).filter(function(x){return DC.cat(x.cat);});
  if(plain===undefined)plain=V3L.cat==="all"&&!v3lActive();
  box.innerHTML=plain&&tiles.length&&PRODUCTS.length?'<div class="v3-promo-row">'+tiles.map(function(x){return v3lPromo(x.cat,x.img,x.title.vi,x.title.en||x.title.vi);}).join("")+'</div>':"";
  box.hidden=!box.innerHTML;
}
function v3RenderColl(){
  var c=$("v3Coll");if(!c)return;
  var n=v3lList().length,act=v3lActive();
  var title=V3L.fav?v3T(DC.x("shop.list.fav",0,"Yêu thích"),DC.x("shop.list.fav",1,"Favourites")):V3L.cat==="all"?v3T(DC.x("shop.list.j16",0,"Tất cả sản phẩm"),DC.x("shop.list.j16",1,"All products")):t("cat."+V3L.cat);
  var d=V3L_DESC[V3L.cat]||V3L_DESC.all;
  var cats=["all"].concat(DC.cats().filter(function(c){return !c.hidden;}).map(function(c){return c.id;})).map(function(k){return '<a data-v3cat="'+k+'" class="'+(V3L.cat===k&&!V3L.fav?"on":"")+'">'+t("cat."+k)+'</a>';}).join("")+
    '<a data-v3fav="1" class="v3-favchip'+(V3L.fav?" on":"")+'" role="button" aria-pressed="'+V3L.fav+'">♥ '+v3lFavTxt()+'</a>';
  c.innerHTML='<div class="v3-coll-crumb"><a href="'+V3L_HOME+'" target="_blank" rel="noopener">'+v3T(DC.x("shop.list.j17",0,"TRANG CHỦ"),DC.x("shop.list.j17",1,"HOME"))+'</a><span>/</span>'+
    (V3L.cat==="all"?'<b>'+v3T(DC.x("shop.list.j18",0,"CỬA HÀNG"),DC.x("shop.list.j18",1,"SHOP"))+'</b>':'<a data-v3cat="all">'+v3T(DC.x("shop.list.j19",0,"CỬA HÀNG"),DC.x("shop.list.j19",1,"SHOP"))+'</a><span>/</span><b>'+t("cat."+V3L.cat)+'</b>')+'</div>'+
    '<h1 class="v3-coll-h">'+title+'</h1><p class="v3-coll-d">'+v3T(d[0],d[1])+'</p>';
  var nav=$("v3CollNav");if(nav)nav.innerHTML='<div class="v3-coll-cats">'+cats+'</div>'+
    '<div class="v3-coll-bar"><span>'+n+' '+v3T(DC.x("shop.list.j20",0,"SẢN PHẨM"),DC.x("shop.list.j20",1,"PRODUCTS"))+'</span><button type="button" id="v3FilterBtn">'+v3T(DC.x("shop.list.j21",0,"LỌC & SẮP XẾP"),DC.x("shop.list.j21",1,"FILTER & SORT"))+(act?' ('+act+')':'')+
    (' '+DC.i("shop.icon.js2",'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M6 12h12M10 18h4"/></svg>')+'</button></div>');
}
function v3RenderFilter(){
  var f=$("v3F");if(!f)return;
  var sorts=[[DC.x("shop.list.j22.n",0,"feat"),DC.x("shop.list.j22",0,"Nổi bật"),DC.x("shop.list.j22",1,"Featured")],[DC.x("shop.list.j23.n",0,"best"),DC.x("shop.list.j23",0,"Bán chạy"),DC.x("shop.list.j23",1,"Best seller")],[DC.x("shop.list.j24.n",0,"asc"),DC.x("shop.list.j24",0,"Giá: thấp → cao"),DC.x("shop.list.j24",1,"Price: low to high")],[DC.x("shop.list.j25.n",0,"desc"),DC.x("shop.list.j25",0,"Giá: cao → thấp"),DC.x("shop.list.j25",1,"Price: high to low")]];
  var cats=["all"].concat(DC.cats().filter(function(c){return !c.hidden;}).map(function(c){return c.id;}));
  f.innerHTML='<div class="v3-f-head"><h3>'+v3T(DC.x("shop.list.j26",0,"Lọc & sắp xếp"),DC.x("shop.list.j26",1,"Filter & sort"))+'</h3><button type="button" data-f="close" aria-label="close">✕</button></div>'+
    '<div class="v3-f-body">'+
    '<div class="v3-f-sec"><h4>'+v3T(DC.x("shop.list.j27",0,"SẮP XẾP"),DC.x("shop.list.j27",1,"SORT BY"))+'</h4><div class="v3-f-list">'+sorts.map(function(s){return '<button type="button" data-f="sort:'+s[0]+'" class="'+(V3L.sort===s[0]?"on":"")+'"><i></i>'+v3T(s[1],s[2])+'</button>';}).join("")+'</div></div>'+
    '<div class="v3-f-sec"><h4>'+v3T(DC.x("shop.list.j28",0,"DANH MỤC"),DC.x("shop.list.j28",1,"CATEGORY"))+'</h4><div class="v3-f-chips">'+cats.map(function(k){return '<button type="button" data-f="cat:'+k+'" class="'+(V3L.cat===k&&!V3L.fav?"on":"")+'">'+t("cat."+k)+'</button>';}).join("")+
      '<button type="button" data-f="fav" class="'+(V3L.fav?"on":"")+'" aria-pressed="'+V3L.fav+'">♥ '+v3lFavTxt()+'</button></div></div>'+
    '<div class="v3-f-sec"><h4>SIZE</h4><div class="v3-f-chips">'+v3lAllSizes().map(function(s){return '<button type="button" data-f="size:'+s+'" class="'+(V3L.sizes.indexOf(s)>-1?"on":"")+'">'+s+'</button>';}).join("")+'</div></div>'+
    '<div class="v3-f-sec"><h4>'+v3T(DC.x("shop.list.j29",0,"MÀU SẮC"),DC.x("shop.list.j29",1,"COLOUR"))+'</h4><div class="v3-f-chips">'+v3lAllColors().map(function(c){return '<button type="button" data-f="color:'+c[0]+'" class="'+(V3L.colors.indexOf(c[0])>-1?"on":"")+'"><em style="background:'+c[1]+'"></em>'+cn({colors:[c]},c[0])+'</button>';}).join("")+'</div></div>'+
    '</div><div class="v3-f-foot"><button type="button" data-f="clear">'+v3T(DC.x("shop.list.j30",0,"Xóa lọc"),DC.x("shop.list.j30",1,"Clear"))+'</button><button type="button" data-f="apply">'+v3T(DC.x("shop.list.j31",0,"Xem kết quả"),DC.x("shop.list.j31",1,"View results"))+' ('+v3lList().length+')</button></div>';
}
function v3lRefresh(){filter=V3L.cat;V3L.lastFilter=V3L.cat;v3RenderGrid();v3RenderColl();var f=$("v3F");if(f&&f.classList.contains("on"))v3RenderFilter();}
function v3lToggle(arr,v){var i=arr.indexOf(v);if(i>-1)arr.splice(i,1);else arr.push(v);}
function v3FOpen(){v3RenderFilter();$("v3F").classList.add("on");$("v3FOv").classList.add("on");}
function v3FClose(){var f=$("v3F"),o=$("v3FOv");if(f)f.classList.remove("on");if(o)o.classList.remove("on");}
(function(){
  renderGrid=function(){
    if(filter!==V3L.lastFilter){V3L.cat=filter;V3L.lastFilter=filter;}
    v3RenderGrid();v3RenderColl();
    var f=$("v3F");if(f&&f.classList.contains("on"))v3RenderFilter();
  };
  var g=$("grid");
  if(g)g.addEventListener("click",function(e){
    var el=e.target;
    var qa=el.closest("[data-qa]");if(qa){e.stopPropagation();e.preventDefault();var a=qa.dataset.qa.split("|"),p=PRODUCTS.find(function(x){return x.id===a[0];});var col=p&&colorFor(p,a[1]);if(p&&!DC.soldOut(p)&&col){addToCart(p.id,a[1],col,1);openCart();}return;}
    if(el.closest(".v3c-qa button[disabled]")){e.stopPropagation();e.preventDefault();return;}
    var hb=el.closest("[data-v3h]");if(hb){e.stopPropagation();e.preventDefault();var id=hb.dataset.v3h;if(wish.has(id))wish.delete(id);else wish.add(id);v3lRefresh();return;}
    var pr=el.closest("[data-promo]");if(pr){e.stopPropagation();v3lPromoGo(pr.dataset.promo);return;}
    if(el.closest("[data-v3clear]")){e.stopPropagation();V3L.sizes=[];V3L.colors=[];V3L.sort="feat";V3L.cat="all";V3L.fav=false;v3lRefresh();return;}
  },true);
  document.addEventListener("click",function(e){
    var el=e.target;
    if(el.closest("#v3FilterBtn")){v3FOpen();return;}
    if(el.closest("#v3FOv")){v3FClose();return;}
    var cl=el.closest("#v3Coll [data-v3cat],#v3CollNav [data-v3cat]");if(cl){V3L.cat=cl.dataset.v3cat;V3L.fav=false;v3lRefresh();return;}
    if(el.closest("#v3CollNav [data-v3fav]")){V3L.fav=!V3L.fav;if(V3L.fav)V3L.cat="all";v3lRefresh();return;}
    var b=el.closest("#v3F [data-f]");if(!b)return;
    var a=b.dataset.f,k=a.split(":")[0],v=a.slice(k.length+1);
    if(a==="close"||a==="apply"){v3FClose();return;}
    if(a==="clear"){V3L.sizes=[];V3L.colors=[];V3L.sort="feat";V3L.cat="all";V3L.fav=false;}
    else if(a==="fav"){V3L.fav=!V3L.fav;if(V3L.fav)V3L.cat="all";}
    else if(k==="sort")V3L.sort=v;
    else if(k==="cat"){V3L.cat=v;V3L.fav=false;}
    else if(k==="size")v3lToggle(V3L.sizes,v);
    else if(k==="color")v3lToggle(V3L.colors,v);
    v3lRefresh();
  });
  document.addEventListener("click",function(e){var pr=e.target.closest("#v3Tiles [data-promo]");if(pr)v3lPromoGo(pr.dataset.promo);});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")v3FClose();});
  /* yêu thích đổi ở tab khác (vd Trang chủ) → cập nhật tim và bộ lọc */
  DC.fav.onChange(function(){v3lRefresh();if(detailId)v3Render();});
})();


/* ===== V3 PRO: ngày giao dự kiến, thanh mua dính đáy, checkout hoàn chỉnh ===== */
var V3P={ship:"std",exp:DC.setting("shop.expressFee",35000)};
function v3pEta(a,b){
  if(a==null){var E=DC.eta();a=E.stdMin;b=E.stdMax;}
  function add(n){var d=new Date(),k=0;while(k<n){d.setDate(d.getDate()+1);if(d.getDay()!==0)k++;}return d;}
  function f(d){var w=lang==="en"?["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]:["CN","T2","T3","T4","T5","T6","T7"];return w[d.getDay()]+", "+d.getDate()+"/"+(d.getMonth()+1);}
  return a===b?f(add(a)):f(add(a))+" – "+f(add(b));
}
/* hỏa tốc: đặt trước giờ chốt (Thiết lập → thời gian giao) → nhận trong ngày; số ngày hỏa tốc > 1 → cộng thêm */
function v3pToday(){var E=DC.eta(),n=(new Date().getHours()>=E.cutoff?1:0)+Math.max(0,E.exp-1);return n===0?v3T(DC.x("shop.checkout.j1",0,"hôm nay"),DC.x("shop.checkout.j1",1,"today")):n===1?v3T(DC.x("shop.checkout.j2",0,"ngày mai"),DC.x("shop.checkout.j2",1,"tomorrow")):v3pEta(n,n);}
function v3pCutoff(txt){return String(txt).replace(/\b15:00\b/,String(DC.eta().cutoff).padStart(2,"0")+":00");}

/* --- phí ship: cộng phí hỏa tốc nếu chọn (và được phép: mặc định chỉ giao hỏa tốc trong TP.HCM) --- */
var _v3pShip=shipFinal;
shipFinal=function(){return _v3pShip()+(V3P.ship==="exp"&&count()>0&&v3pExpOk()?V3P.exp:0);};
/* hỏa tốc chỉ áp dụng trong TP.HCM (/admin → Thiết lập → Bán hàng); server kiểm tra lại bằng cùng phép thử */
function v3pExpOk(){if(!DC.setting("shop.expressHcmOnly",true))return true;var c=document.querySelector('#checkoutForm [name="city"]');return DC.isHcm(c?c.value:"");}
function v3pExpCheck(){if(V3P.ship==="exp"&&!v3pExpOk()){V3P.ship="std";renderSummary();}else v3pShipRender();}

/* --- khối "Phương thức giao hàng" + logo thanh toán + gợi ý tỉnh/thành --- */
function v3pCheckoutInit(){
  var form=$("checkoutForm");if(!form||$("v3ShipOpts"))return;
  var blocks=form.querySelectorAll(".co-block");
  blocks[0].insertAdjacentHTML("afterend",'<div class="co-block v3-shipm"><h3><span class="co-num">2</span><span id="v3ShipH"></span></h3><div class="v3-ship-opts" id="v3ShipOpts"></div></div>');
  var payNum=blocks[1]&&blocks[1].querySelector(".co-num");if(payNum)payNum.textContent="3";
  var logos={bank:('<span class="pay-logo">'+DC.i("shop.icon.js4",'<svg class="pl-ic bank" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10l9-5 9 5"/><path d="M5 10v8m14-8v8M9 10v8m6-8v8"/><path d="M3 20h18"/></svg>')+'<b>VietQR</b></span>'),
    momo:'<span class="pay-logo pl-momo">MoMo</span>',zalopay:'<span class="pay-logo pl-zalo">ZaloPay</span>',
    vnpay:'<span class="pay-logo pl-card"><b>VISA</b><b>MASTERCARD</b><b>ATM</b></span>',installment:'<span class="pay-logo pl-card"><b>VISA</b><b>MASTERCARD</b><b>JCB</b></span>'};
  document.querySelectorAll("#payOpts .pay-opt").forEach(function(l){var v=l.querySelector("input").value;if(logos[v])l.insertAdjacentHTML("beforeend",'<span class="v3-po-logos">'+logos[v]+'</span>');});
  /* gợi ý 34 tỉnh / thành sau sắp xếp 07/2025 (ô vẫn cho gõ tự do) */
  var cities=["TP. Hồ Chí Minh","Hà Nội","An Giang","Bắc Ninh","Cà Mau","Cao Bằng","Cần Thơ","Đà Nẵng","Đắk Lắk","Điện Biên","Đồng Nai","Đồng Tháp","Gia Lai","Hà Tĩnh","Hải Phòng","Huế","Hưng Yên","Khánh Hòa","Lai Châu","Lạng Sơn","Lào Cai","Lâm Đồng","Nghệ An","Ninh Bình","Phú Thọ","Quảng Ngãi","Quảng Ninh","Quảng Trị","Sơn La","Tây Ninh","Thái Nguyên","Thanh Hóa","Tuyên Quang","Vĩnh Long"];
  form.insertAdjacentHTML("beforeend",'<datalist id="v3Cities">'+cities.map(function(c){return '<option value="'+c+'">';}).join("")+'</datalist>');
  var city=form.querySelector('[name="city"]');if(city){city.setAttribute("list","v3Cities");city.setAttribute("autocomplete","address-level1");city.addEventListener("input",v3pExpCheck);city.addEventListener("change",v3pExpCheck);}
  var ac={name:"name",phone:"tel",email:"email",address:"street-address",ward:"address-level3"};
  Object.keys(ac).forEach(function(k){var i=form.querySelector('[name="'+k+'"]');if(i)i.setAttribute("autocomplete",ac[k]);});
  var ph=form.querySelector('[name="phone"]');if(ph){ph.setAttribute("type","tel");ph.setAttribute("inputmode","tel");ph.setAttribute("placeholder","09xx xxx xxx");}
  var fs=document.querySelector(".summary .promo-msg");if(fs)fs.insertAdjacentHTML("afterend",'<div class="v3-fs" id="v3Fs"></div>');
  form.addEventListener("input",function(e){var f=e.target.closest(".field");if(f&&f.classList.contains("err")){f.classList.remove("err");var m=f.querySelector(".v3-err");if(m)m.remove();}});
  $("v3ShipOpts").addEventListener("click",function(e){var b=e.target.closest("[data-ship]");if(!b||b.disabled)return;V3P.ship=b.dataset.ship;v3pShipRender();renderSummary();});
  $("placeOrder").addEventListener("click",function(e){if(!v3pValidate()){e.stopImmediatePropagation();e.preventDefault();}},true);
  /* chạy sau handler đặt hàng gốc: thêm dòng giao hàng + ngày dự kiến vào màn thành công */
  $("placeOrder").addEventListener("click",function(){
    var rc=document.querySelector("#okExtra .ok-recap");if(!rc||!$("success").classList.contains("active"))return;
    var exp=V3P.ship==="exp";
    rc.insertAdjacentHTML("beforeend",'<div><span>'+v3T(DC.x("shop.checkout.j3",0,"Giao hàng"),DC.x("shop.checkout.j3",1,"Delivery"))+'</span><b>'+(exp?v3T(DC.x("shop.checkout.j4",0,"Hỏa tốc · nhận "),DC.x("shop.checkout.j4",1,"Same-day · "))+v3pToday():v3T(DC.x("shop.checkout.j5",0,"Tiêu chuẩn · "),DC.x("shop.checkout.j5",1,"Standard · "))+v3pEta())+'</b></div>');
  });
  v3pShipRender();
}
function v3pShipRender(){
  var box=$("v3ShipOpts");if(!box)return;
  $("v3ShipH").textContent=v3T(DC.x("shop.checkout.j6",0,"Phương thức giao hàng"),DC.x("shop.checkout.j6",1,"Delivery"));
  var std=ship()===0||(promo&&promo.freeship)?v3T(DC.x("shop.checkout.j7",0,"Miễn phí"),DC.x("shop.checkout.j7",1,"Free")):fmt(SHIP_FEE);
  var expOk=v3pExpOk();if(!expOk&&V3P.ship==="exp")V3P.ship="std";
  var o=[{id:"std",n:v3T(DC.x("shop.checkout.j8",0,"Giao tiêu chuẩn"),DC.x("shop.checkout.j8",1,"Standard delivery")),s:v3T(DC.x("shop.checkout.j9",0,"Dự kiến "),DC.x("shop.checkout.j9",1,"Arrives "))+v3pEta(),p:std},
         {id:"exp",n:v3T(DC.x("shop.checkout.j10",0,"Hỏa tốc nội thành TP.HCM"),DC.x("shop.checkout.j10",1,"Same-day in Ho Chi Minh City")),s:expOk?v3T(DC.x("shop.checkout.j11",0,"Nhận "),DC.x("shop.checkout.j11",1,"Arrives "))+v3pToday()+v3pCutoff(v3T(DC.x("shop.checkout.j12",0," nếu đặt trước 15:00"),DC.x("shop.checkout.j12",1," if ordered before 15:00"))):v3T(DC.x("shop.checkout.exphcm",0,"Hỏa tốc chỉ áp dụng trong TP.HCM"),DC.x("shop.checkout.exphcm",1,"Express is HCMC only")),p:fmt((count()>0?_v3pShip():SHIP_FEE)+V3P.exp),off:!expOk}];
  box.innerHTML=o.map(function(x){return '<button type="button" class="v3-sopt'+(V3P.ship===x.id?" sel":"")+(x.off?" off":"")+'" data-ship="'+x.id+'"'+(x.off?' disabled aria-disabled="true"':'')+' aria-pressed="'+(V3P.ship===x.id)+'"><i></i><span><b>'+x.n+'</b><small>'+x.s+'</small></span><em>'+x.p+'</em></button>';}).join("");
}
function v3pValidate(){
  var form=$("checkoutForm"),bad=[];
  function chk(name,ok,msg){var i=form.querySelector('[name="'+name+'"]');if(!i)return;var f=i.closest(".field");var old=f.querySelector(".v3-err");if(old)old.remove();f.classList.toggle("err",!ok);if(!ok){f.insertAdjacentHTML("beforeend",'<small class="v3-err">'+msg+'</small>');bad.push(i);}}
  var v=function(n){var i=form.querySelector('[name="'+n+'"]');return i?i.value.trim():"";};
  chk("name",v("name").length>1,v3T(DC.x("shop.checkout.j13",0,"Vui lòng nhập họ tên"),DC.x("shop.checkout.j13",1,"Please enter your name")));
  chk("phone",/^(0|\+?84)\d{9}$/.test(v("phone").replace(/[\s.\-]/g,"")),v3T(DC.x("shop.checkout.j14",0,"Số điện thoại chưa đúng (10 số)"),DC.x("shop.checkout.j14",1,"Enter a valid 10-digit phone number")));
  chk("email",!v("email")||/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v("email")),v3T(DC.x("shop.checkout.j15",0,"Email chưa đúng định dạng"),DC.x("shop.checkout.j15",1,"Enter a valid email")));
  chk("address",v("address").length>4,v3T(DC.x("shop.checkout.j16",0,"Vui lòng nhập địa chỉ nhận hàng"),DC.x("shop.checkout.j16",1,"Please enter a delivery address")));
  chk("city",v("city").length>1,v3T(DC.x("shop.checkout.j17",0,"Vui lòng chọn tỉnh / thành phố"),DC.x("shop.checkout.j17",1,"Please choose a city")));
  if(bad.length){window.scrollTo({top:bad[0].getBoundingClientRect().top+scrollY-140,behavior:"smooth"});setTimeout(function(){bad[0].focus({preventScroll:true});},350);return false;}
  return true;
}
/* --- tóm tắt đơn: thanh tiến độ miễn phí giao hàng --- */
function v3pSum(){
  var el=$("v3Fs");if(!el)return;var s=subtotal();
  if(!s){el.innerHTML="";return;}
  if(promo&&promo.freeship){el.innerHTML='<p>✓ '+v3T(DC.x("shop.checkout.j18",0,"Đã áp dụng mã miễn phí giao hàng"),DC.x("shop.checkout.j18",1,"Free delivery code applied"))+'</p>';return;}
  if(s>=SHIP_FREE){el.innerHTML='<p>✓ '+v3T(DC.x("shop.checkout.j19",0,"Đơn hàng được miễn phí giao hàng tiêu chuẩn"),DC.x("shop.checkout.j19",1,"Your order ships free"))+'</p><div class="v3-fs-bar"><i style="width:100%"></i></div>';return;}
  el.innerHTML='<p>'+v3T(DC.x("shop.checkout.j20.1",0,"Mua thêm <b>")+fmt(SHIP_FREE-s)+DC.x("shop.checkout.j20.2",0,"</b> để được miễn phí giao hàng"),DC.x("shop.checkout.j20.1",1,"Add <b>")+fmt(SHIP_FREE-s)+DC.x("shop.checkout.j20.2",1,"</b> more for free delivery"))+'</p><div class="v3-fs-bar"><i style="width:'+Math.round(s/SHIP_FREE*100)+'%"></i></div>';
}
var _v3pRS=renderSummary;
renderSummary=function(){_v3pRS();v3pSum();v3pShipRender();v3pBars();};

/* --- thanh dính đáy trên mobile: PDP (thêm vào giỏ) & checkout (đặt hàng) --- */
function v3pBarsInit(){
  document.body.insertAdjacentHTML("beforeend",'<div class="v3-bar" id="v3Satc"></div><div class="v3-bar" id="v3Cbar"></div>');
  $("v3Satc").addEventListener("click",function(e){if(e.target.closest("button"))$("dAdd").click();});
  $("v3Cbar").addEventListener("click",function(e){if(e.target.closest("button"))$("placeOrder").click();});
  window.addEventListener("scroll",v3pBars,{passive:true});window.addEventListener("resize",v3pBars);
}
function v3pBars(){
  var sa=$("v3Satc"),cb=$("v3Cbar");if(!sa||!cb)return;
  var layer=$("cart").classList.contains("open")||$("success").classList.contains("active")||document.querySelector(".v3-sg.on,.v3-f.on,.v3-lb.on");
  var mob=innerWidth<=900&&!layer;
  var p=detailId&&PRODUCTS.find(function(x){return x.id===detailId;});
  var inDetail=$("detailView").classList.contains("active"),inCo=$("checkoutView").classList.contains("active");
  var add=$("dAdd"),past=add?add.getBoundingClientRect().bottom<0:false;
  if(p)sa.innerHTML='<img src="'+IMG[p.img]+'" alt=""><div><b>'+pn(p)+'</b><small>'+fmt(p.price)+(detailSize?" · "+detailSize:"")+'</small></div>'+(DC.soldOut(p)||DC.vstock(p,detailSize,detailColor)<=0?'<button type="button" disabled>'+soldTxt()+'</button>':'<button type="button"'+(roomOf(p.id,detailSize,detailColor)<=0?' disabled':'')+'>'+v3T(DC.x("shop.checkout.j21",0,"Thêm vào giỏ"),DC.x("shop.checkout.j21",1,"Add to cart"))+'</button>');
  sa.classList.toggle("on",mob&&inDetail&&past&&!!p);
  var po=$("placeOrder"),r=po?po.getBoundingClientRect():null,vis=r?r.top<innerHeight&&r.bottom>0:false;
  if(inCo)cb.innerHTML='<div><small>'+t("sum.total")+'</small><b>'+$("sumTotal").textContent+'</b></div><button type="button">'+t("checkout.placeOrder")+'</button>';
  cb.classList.toggle("on",mob&&inCo&&!vis&&count()>0);
}
(function(){
  var _sv=showView;showView=function(v){_sv(v);v3pBars();};
  var _oc=openCart;openCart=function(){_oc();v3pBars();};
  var _cc=closeCart;closeCart=function(){_cc();v3pBars();};
  document.addEventListener("click",function(){setTimeout(v3pBars,0);});
  var _rd2=renderDetail;renderDetail=function(){_rd2.apply(this,arguments);v3pBars();};
  var _al2=applyLang;applyLang=function(){_al2.apply(this,arguments);v3pShipRender();v3pSum();v3pBars();};
  var _sc=$("successClose").onclick;$("successClose").onclick=function(){V3P.ship="std";if(_sc)_sc.apply(this,arguments);};
  v3pCheckoutInit();v3pBarsInit();v3pSum();
})();


/* ===== V3 UX: trang sản phẩm (tồn kho, link đánh giá, phản hồi thêm giỏ, đã xem gần đây)
   + checkout (tóm tắt đơn trên mobile, nút đặt hàng có tổng tiền + trạng thái xử lý, định dạng SĐT,
   ghi nhớ thông tin giao hàng, ảnh sản phẩm ở màn thành công) ===== */
var V3U={busy:false,ok:false,t:null,last:null};
function v3uCur(){return PRODUCTS.find(function(x){return x.id===detailId;});}
function v3uSeen(id){
  var a=[id];
  try{a=JSON.parse(localStorage.getItem("dc_seen")||"[]");if(V3U.last!==id){a=a.filter(function(x){return x!==id;});a.unshift(id);a=a.slice(0,8);localStorage.setItem("dc_seen",JSON.stringify(a));}}catch(e){}
  V3U.last=id;return a;
}
function v3uPDP(){
  var p=v3uCur();if(!p)return;
  var buy=document.querySelector("#detailView .pdp-buy");
  if(buy&&!$("v3Stock"))buy.insertAdjacentHTML("beforebegin",'<div class="v3-stock" id="v3Stock"></div>');
  var st=$("v3Stock");
  /* tồn kho: hết hàng → báo hết hàng (không hiện "Chỉ còn 0 sản phẩm") */
  if(st){var stk=DC.hasVariants(p)?DC.vstock(p,detailSize,detailColor):DC.stock(p),out=stk<=0,low=!out&&stk<=+DC.setting("shop.lowStock",10);st.className="v3-stock"+(out?" out":low?" low":"");
    st.innerHTML='<i></i>'+(out?v3T(DC.x("shop.stock.outline",0,"Tạm hết hàng — nhắn Dapper Combat để được báo khi có hàng lại"),DC.x("shop.stock.outline",1,"Sold out — message Dapper Combat to hear when it's back")):low?v3T(DC.x("shop.pdp.j34.1",0,"Chỉ còn ")+stk+DC.x("shop.pdp.j34.2",0," sản phẩm — đặt sớm để giữ size"),DC.x("shop.pdp.j34.1",1,"Only ")+stk+DC.x("shop.pdp.j34.2",1," left — order soon to get your size")):v3T(DC.x("shop.pdp.j35",0,"Còn hàng · gửi đi trong 24 giờ"),DC.x("shop.pdp.j35",1,"In stock · ships within 24 hours")));}
  var seen=v3uSeen(p.id).filter(function(id){return id!==p.id;}).map(function(id){return PRODUCTS.find(function(x){return x.id===id;});}).filter(Boolean).slice(0,4);
  var box=$("v3Seen");
  if(!box){var below=document.querySelector("#detailView .pdp-below");if(below){below.insertAdjacentHTML("beforeend",'<div class="pdp-section v3-seen" id="v3Seen"></div>');box=$("v3Seen");}}
  if(box){box.style.display=seen.length?"":"none";
    box.innerHTML=seen.length?'<h3>'+v3T(DC.x("shop.pdp.j36",0,"Bạn đã xem gần đây"),DC.x("shop.pdp.j36",1,"Recently viewed"))+'</h3><div class="v3-seen-row">'+seen.map(function(q){return '<div class="v3-seen-card" data-seen="'+q.id+'"><div class="v3-seen-img">'+(DC.soldOut(q)?'<span class="v3-out-badge">'+soldTxt()+'</span>':'')+'<img src="'+IMG[q.img]+'" alt=""></div><span>'+pn(q)+'</span><b>'+fmt(q.price)+'</b></div>';}).join("")+'</div>':"";}
}
/* --- checkout: tóm tắt đơn thu gọn trên mobile --- */
function v3uMsum(){
  var grid=document.querySelector("#checkoutView .checkout-grid");if(!grid)return;
  if(!$("v3Msum"))grid.insertAdjacentHTML("beforebegin",'<div class="v3-msum" id="v3Msum"></div>');
  var el=$("v3Msum"),ks=Object.keys(cart),sub=subtotal(),disc=discountAmt(),shf=shipFinal(),tot=Math.max(0,sub-disc)+shf;
  el.innerHTML='<button type="button" class="v3-msum-h" data-msum><span>'+v3T(DC.x("shop.checkout.j22",0,"Xem đơn hàng"),DC.x("shop.checkout.j22",1,"Show order"))+' ('+count()+')<i>▾</i></span><b>'+fmt(tot)+'</b></button><div class="v3-msum-b">'+
    ks.map(function(k){var o=parseKey(k),q=cart[k];return '<div class="v3-msum-i"><div class="v3-msum-img"><img src="'+IMG[o.p.img]+'" alt=""><em>'+q+'</em></div><div><span>'+pn(o.p)+'</span><small>'+cn(o.p,o.color)+' · '+o.size+'</small></div><b>'+fmt(o.p.price*q)+'</b></div>';}).join("")+
    '<div class="v3-msum-r"><span>'+t("sum.subtotal")+'</span><span>'+fmt(sub)+'</span></div>'+
    (disc>0?'<div class="v3-msum-r"><span>'+t("sum.discount")+'</span><span>−'+fmt(disc)+'</span></div>':'')+
    '<div class="v3-msum-r"><span>'+t("sum.shipping")+'</span><span>'+(shf===0?t("sum.free"):fmt(shf))+'</span></div>'+
    '<div class="v3-msum-r tot"><span>'+t("sum.total")+'</span><span>'+fmt(tot)+'</span></div></div>';
}
/* --- nút đặt hàng hiển thị tổng tiền --- */
function v3uBtn(){
  var b=$("placeOrder");if(!b||V3U.busy)return;
  var tot=Math.max(0,subtotal()-discountAmt())+shipFinal();
  b.textContent=t("checkout.placeOrder")+(count()?" · "+fmt(tot):"");
}
/* --- ghi nhớ thông tin giao hàng --- */
var V3U_F=["name","phone","email","address","ward","city"];
function v3uPrefill(){
  var form=$("checkoutForm");if(!form)return;var s=null;
  try{s=JSON.parse(localStorage.getItem("dc_ship")||"null");}catch(e){}
  var note=$("v3Prefill");
  if(s&&!V3U_F.some(function(k){var i=form.querySelector('[name="'+k+'"]');return i&&i.value;})){
    V3U_F.forEach(function(k){var i=form.querySelector('[name="'+k+'"]');if(i&&s[k])i.value=s[k];});
    if(!note){form.querySelector(".co-block").insertAdjacentHTML("afterbegin",'<div class="v3-prefill" id="v3Prefill"></div>');note=$("v3Prefill");}
  }
  if(note)note.innerHTML='<span>'+v3T(DC.x("shop.checkout.j23",0,"Đã điền sẵn thông tin lần trước"),DC.x("shop.checkout.j23",1,"Filled in from your last order"))+'</span><button type="button" data-v3clearship>'+v3T(DC.x("shop.checkout.j24",0,"Xóa"),DC.x("shop.checkout.j24",1,"Clear"))+'</button>';
}
function v3uLabels(){
  var r=$("v3RememberTxt");if(r)r.textContent=v3T(DC.x("shop.checkout.j25",0,"Lưu thông tin cho lần mua sau"),DC.x("shop.checkout.j25",1,"Save my details for next time"));
  v3uPrefill();
}
(function(){
  /* trang sản phẩm */
  var _rd4=renderDetail;renderDetail=function(){_rd4.apply(this,arguments);try{v3uPDP();}catch(e){console.error("v3ux",e);}};
  var rating=document.querySelector("#detailView .pdp-rating");
  if(rating)rating.addEventListener("click",function(){var r=$("v3Reviews");if(r)window.scrollTo({top:r.getBoundingClientRect().top+scrollY-90,behavior:"smooth"});});
  $("dAdd").addEventListener("click",function(){var b=$("dAdd");if(b.disabled)return;b.classList.add("v3-added");b.textContent=v3T(DC.x("shop.other.j3",0,"✓ Đã thêm vào giỏ"),DC.x("shop.other.j3",1,"✓ Added to cart"));clearTimeout(V3U.t);V3U.t=setTimeout(function(){b.classList.remove("v3-added");b.textContent=t("detail.addToCart");pdpBuyState();},1800);});
  /* checkout */
  var form=$("checkoutForm");
  var first=form&&form.querySelector(".co-block");
  if(first)first.insertAdjacentHTML("beforeend",'<label class="v3-remember"><input type="checkbox" id="v3Remember" checked><span id="v3RememberTxt"></span></label>');
  var ph=form&&form.querySelector('[name="phone"]');
  if(ph)ph.addEventListener("input",function(){var d=ph.value.replace(/\D/g,"").slice(0,11);ph.value=d.length>7?d.slice(0,4)+" "+d.slice(4,7)+" "+d.slice(7):d.length>4?d.slice(0,4)+" "+d.slice(4):d;});
  var po=$("placeOrder");
  /* chạy sau bước kiểm tra form (đăng ký trước đó): hiển thị "đang xử lý" rồi mới đặt hàng */
  po.addEventListener("click",function(e){
    if(V3U.ok){V3U.ok=false;return;}
    e.stopImmediatePropagation();e.preventDefault();
    V3U.busy=true;po.classList.add("v3-busy");po.textContent=v3T(DC.x("shop.other.j4",0,"Đang xử lý…"),DC.x("shop.other.j4",1,"Processing…"));
    DCshopSubmit(function(){V3U.ok=true;po.click();V3U.busy=false;po.classList.remove("v3-busy");v3uBtn();},function(){V3U.busy=false;po.classList.remove("v3-busy");v3uBtn();});
  },true);
  po.addEventListener("click",function(){
    if(!$("success").classList.contains("active"))return;
    var ex=$("okExtra");
    if(ex&&!ex.querySelector(".v3-ok-items"))ex.insertAdjacentHTML("afterbegin",'<div class="v3-ok-items">'+Object.keys(cart).map(function(k){var o=parseKey(k);return '<div><img src="'+IMG[o.p.img]+'" alt=""><em>'+cart[k]+'</em></div>';}).join("")+'</div>');
    try{if($("v3Remember")&&$("v3Remember").checked){var s={};V3U_F.forEach(function(k){var i=form.querySelector('[name="'+k+'"]');if(i)s[k]=i.value.trim();});localStorage.setItem("dc_ship",JSON.stringify(s));}else localStorage.removeItem("dc_ship");}catch(err){}
  });
  document.addEventListener("click",function(e){
    var m=e.target.closest("[data-msum]");if(m){$("v3Msum").classList.toggle("open");return;}
    var sc=e.target.closest("[data-seen]");if(sc){openDetail(sc.dataset.seen);window.scrollTo({top:0,behavior:"smooth"});return;}
    if(e.target.closest("[data-v3clearship]")){try{localStorage.removeItem("dc_ship");}catch(err){}V3U_F.forEach(function(k){var i=form.querySelector('[name="'+k+'"]');if(i)i.value="";});var n=$("v3Prefill");if(n)n.remove();v3pExpCheck();}
  });
  var _rs3=renderSummary;renderSummary=function(){_rs3();v3uMsum();v3uBtn();};
  var _sv3=showView;showView=function(v){_sv3(v);if(v==="checkout"){v3uPrefill();v3pExpCheck();v3uMsum();v3uBtn();}};
  var _al3=applyLang;applyLang=function(){_al3.apply(this,arguments);v3uLabels();v3uMsum();v3uBtn();if(detailId)v3uPDP();};
  v3uLabels();v3uMsum();v3uBtn();
})();


/* ===== V3 OK: trang xác nhận đặt hàng (tiến trình đơn, thanh toán QR / thẻ / trả góp, giao đến, tóm tắt đơn, gợi ý khóa học) ===== */
var V3OK={d:null};
function v3okEsc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function v3okSnap(){
  var f=$("checkoutForm"),v=function(n){var i=f&&f.querySelector('[name="'+n+'"]');return i?i.value.trim():"";};
  var pay=(document.querySelector('input[name="pay"]:checked')||{}).value||"bank";
  var sub=subtotal(),disc=discountAmt(),shf=shipFinal(),id=$("orderId").textContent.trim();
  V3OK.d={id:id,ref:id.replace(/[#\-\s]/g,""),pay:pay,ship:V3P.ship,name:v("name"),phone:v("phone"),
    addr:[v("address"),v("ward"),v("city")].filter(Boolean).join(", "),
    sub:sub,disc:disc,shf:shf,total:(window.DC_LAST_ORDER&&DC_LAST_ORDER.total)||(Math.max(0,sub-disc)+shf),count:count(),
    items:Object.keys(cart).map(function(k){var o=parseKey(k);return {img:IMG[o.p.img],p:o.p,color:o.color,size:o.size,q:cart[k],line:o.p.price*cart[k]};})};
}
function v3okRender(){
  var o=V3OK.d,box=$("v3Ok");if(!o||!box)return;
  var first=o.name.split(" ").slice(-1)[0];
  var shipTxt=o.ship==="exp"?v3T(DC.x("shop.success.j1",0,"Hỏa tốc · nhận "),DC.x("shop.success.j1",1,"Same-day · arrives "))+v3pToday():v3T(DC.x("shop.success.j2",0,"Tiêu chuẩn · "),DC.x("shop.success.j2",1,"Standard · "))+v3pEta();
  var h='<div class="v3ok-in">';
  h+='<div class="v3ok-head"><div class="v3ok-badge">✓</div><div class="v3ok-eyebrow">'+v3T(DC.x("shop.success.j3",0,"Đơn hàng "),DC.x("shop.success.j3",1,"Order "))+v3okEsc(o.id)+'</div>'+
     '<h2>'+(first?v3T(DC.x("shop.success.j4",0,"Cảm ơn, "),DC.x("shop.success.j4",1,"Thank you, "))+v3okEsc(first)+"!":v3T(DC.x("shop.success.j5",0,"Cảm ơn bạn!"),DC.x("shop.success.j5",1,"Thank you!")))+'</h2>'+
     '<p>'+v3T(DC.x("shop.success.j6.1",0,"Đơn hàng đã được ghi nhận. Dapper Combat sẽ gọi hoặc nhắn Zalo số <b>")+v3okEsc(o.phone)+DC.x("shop.success.j6.2",0,"</b> để xác nhận trong vòng 2 giờ làm việc."),DC.x("shop.success.j6.1",1,"Your order is in. We'll call or message <b>")+v3okEsc(o.phone)+DC.x("shop.success.j6.2",1,"</b> on Zalo to confirm within 2 business hours."))+'</p></div>';
  /* các bước tiếp theo (không phải trạng thái đơn theo thời gian thực — không ghi ngày dự kiến) */
  var steps=[[v3T(DC.x("shop.success.j7",0,"Đã đặt hàng"),DC.x("shop.success.j7",1,"Ordered")),v3T(DC.x("shop.success.j8",0,"Vừa xong"),DC.x("shop.success.j8",1,"Just now"))],
    [v3T(DC.x("shop.success.j9",0,"Xác nhận"),DC.x("shop.success.j9",1,"Confirmation")),v3T(DC.x("shop.success.j10",0,"Shop gọi hoặc nhắn Zalo"),DC.x("shop.success.j10",1,"We call or message on Zalo"))],
    [v3T(DC.x("shop.success.j11",0,"Giao hàng"),DC.x("shop.success.j11",1,"Delivery")),o.ship==="exp"?v3T(DC.x("shop.success.step.exp",0,"Hỏa tốc trong TP.HCM"),DC.x("shop.success.step.exp",1,"Same-day in HCMC")):v3T(DC.x("shop.success.step.std",0,"{ship.eta} ngày làm việc"),DC.x("shop.success.step.std",1,"{ship.eta} business days"))],
    [v3T(DC.x("shop.success.j12",0,"Nhận hàng"),DC.x("shop.success.j12",1,"Receive your order")),""]];
  h+='<h3 class="v3ok-next">'+v3T(DC.x("shop.success.next",0,"Các bước tiếp theo"),DC.x("shop.success.next",1,"What happens next"))+'</h3>';
  h+='<ol class="v3ok-track">'+steps.map(function(s,i){return '<li class="'+(i===0?"done":"")+'"><i>'+(i===0?"✓":i+1)+'</i><b>'+s[0]+'</b>'+(s[1]?'<small>'+s[1]+'</small>':'')+'</li>';}).join("")+'</ol>';
  h+='<div class="v3ok-grid"><div class="v3ok-main">';
  /* thẻ / trả góp (VNPay): khung số tiền + nút thanh toán (trả góp: chọn ngân hàng, kỳ hạn); còn lại quét mã VietQR (app ngân hàng / MoMo / ZaloPay) */
  if(o.pay==="vnpay"||o.pay==="installment"){
    var isp=o.pay==="installment";
    h+='<section class="v3ok-card v3ok-pay"><div class="v3ok-card-h"><span>'+(isp?v3T(DC.x("shop.pay.installment",0,"Trả góp qua thẻ tín dụng (VNPay)"),DC.x("shop.pay.installment",1,"Credit card installments (VNPay)")):v3T(DC.x("shop.success.online",0,"Thanh toán online"),DC.x("shop.success.online",1,"Online payment")))+'</span><em>VNPay</em></div>'+
       '<div class="v3ok-cod"><small>'+v3T(DC.x("shop.success.j15",0,"Số tiền"),DC.x("shop.success.j15",1,"Amount"))+'</small><strong>'+fmt(o.total)+'</strong>'+
       (o.paid?'<p class="dc-paid-ok">'+v3T(DC.x("global.slip.received",0,"✓ Đã nhận tiền — cảm ơn bạn!"),DC.x("global.slip.received",1,"✓ Payment received — thank you!"))+'</p>':
        '<p class="dc-pay-note">'+(isp?v3T(DC.x("shop.success.isp",0,"Chọn ngân hàng, loại thẻ và kỳ hạn trả góp để hoàn tất thanh toán qua VNPay."),DC.x("shop.success.isp",1,"Choose your bank, card type and term to complete your installment payment with VNPay.")):
          v3T(DC.x("shop.success.payerr",0,"Chưa mở được cổng thanh toán — bạn có thể thanh toán lại từ phiếu xác nhận."),DC.x("shop.success.payerr",1,"We couldn't open the payment gateway — you can pay again from your confirmation.")))+'</p><div class="dc-paylive" id="dcOkPay"></div>')+
       '</div></section>';
  }else{
    h+='<section class="v3ok-card v3ok-pay"><div class="v3ok-card-h"><span>'+v3T(DC.x("shop.success.j13",0,"Bước tiếp theo · thanh toán"),DC.x("shop.success.j13",1,"Next step · payment"))+'</span></div>'+
       '<div class="v3ok-qr"><div class="v3ok-qr-box">'+dcQr(o.id,o.total)+'</div><div class="v3ok-qr-info"><small>'+v3T(DC.x("shop.success.j15",0,"Số tiền"),DC.x("shop.success.j15",1,"Amount"))+'</small><strong>'+fmt(o.total)+'</strong>'+
       '<small>'+v3T(DC.x("shop.success.j16",0,"Nội dung chuyển khoản"),DC.x("shop.success.j16",1,"Transfer note"))+'</small><div class="v3ok-copy"><code>'+v3okEsc(o.ref)+'</code><button type="button" data-v3copy="'+v3okEsc(o.ref)+'">'+v3T(DC.x("shop.success.j17",0,"Sao chép"),DC.x("shop.success.j17",1,"Copy"))+'</button></div>'+
       '<p>'+(o.pay==="momo"?v3T(DC.x("shop.success.j18",0,"Mở MoMo, quét mã và giữ nguyên nội dung chuyển khoản. Dapper Combat sẽ kiểm tra giao dịch rồi gọi hoặc nhắn Zalo để xác nhận đơn."),DC.x("shop.success.j18",1,"Open MoMo, scan the code and keep the transfer note. Dapper Combat will check the payment and confirm your order by phone or Zalo.")):
         o.pay==="zalopay"?v3T(DC.x("shop.success.zalo",0,"Mở ZaloPay, quét mã và giữ nguyên nội dung chuyển khoản. Dapper Combat sẽ kiểm tra giao dịch rồi gọi hoặc nhắn Zalo để xác nhận đơn."),DC.x("shop.success.zalo",1,"Open ZaloPay, scan the code and keep the transfer note. Dapper Combat will check the payment and confirm your order by phone or Zalo.")):v3T(DC.x("shop.success.j19",0,"Mở app ngân hàng, quét mã VietQR và giữ nguyên nội dung chuyển khoản. Dapper Combat sẽ kiểm tra giao dịch rồi gọi hoặc nhắn Zalo để xác nhận đơn."),DC.x("shop.success.j19",1,"Open your banking app, scan the VietQR code and keep the transfer note. Dapper Combat will check the payment and confirm your order by phone or Zalo.")))+'</p>'+
       '<p class="v3ok-demo">'+t("ok.qrDemo")+'</p></div></div></section>';
  }
  h+='<section class="v3ok-card"><div class="v3ok-card-h"><span>'+v3T(DC.x("shop.success.j23",0,"Giao đến"),DC.x("shop.success.j23",1,"Delivering to"))+'</span></div><dl class="v3ok-dl">'+
     '<div><dt>'+v3T(DC.x("shop.success.j24",0,"Người nhận"),DC.x("shop.success.j24",1,"Recipient"))+'</dt><dd>'+v3okEsc(o.name)+' · '+v3okEsc(o.phone)+'</dd></div>'+
     '<div><dt>'+v3T(DC.x("shop.success.j25",0,"Địa chỉ"),DC.x("shop.success.j25",1,"Address"))+'</dt><dd>'+v3okEsc(o.addr)+'</dd></div>'+
     '<div><dt>'+v3T(DC.x("shop.success.j26",0,"Giao hàng"),DC.x("shop.success.j26",1,"Delivery"))+'</dt><dd>'+shipTxt+'</dd></div>'+
     '<div><dt>'+v3T(DC.x("shop.success.j27",0,"Thanh toán"),DC.x("shop.success.j27",1,"Payment"))+'</dt><dd>'+dcPayName(o.pay)+'</dd></div></dl></section>';
  h+='</div><aside class="v3ok-sum"><div class="v3ok-card-h"><span>'+v3T(DC.x("shop.success.j28",0,"Tóm tắt đơn"),DC.x("shop.success.j28",1,"Order summary"))+'</span><em class="n">'+o.count+' '+v3T(DC.x("shop.success.j29",0,"sản phẩm"),DC.x("shop.success.j29",1,"items"))+'</em></div>'+
     o.items.map(function(it){return '<div class="v3ok-item"><div class="im"><img src="'+it.img+'" alt=""><em>'+it.q+'</em></div><div><span>'+v3okEsc(pn(it.p))+'</span><small>'+v3okEsc(cn(it.p,it.color))+' · '+v3okEsc(it.size)+'</small></div><b>'+fmt(it.line)+'</b></div>';}).join("")+
     '<div class="v3ok-rows"><div><span>'+t("sum.subtotal")+'</span><span>'+fmt(o.sub)+'</span></div>'+
     (o.disc>0?'<div class="disc"><span>'+t("sum.discount")+'</span><span>−'+fmt(o.disc)+'</span></div>':'')+
     '<div><span>'+t("sum.shipping")+'</span><span>'+(o.shf?fmt(o.shf):t("sum.free"))+'</span></div>'+
     '<div class="tot"><span>'+t("sum.total")+'</span><span>'+fmt(o.total)+'</span></div></div></aside></div>';
  h+='<div class="v3ok-actions"><button type="button" class="v3ok-primary" data-v3okclose>'+t("ok.continue")+'</button><a class="v3ok-ghost" href="https://zalo.me/dappercombat" target="_blank" rel="noopener">'+v3T(DC.x("shop.success.j30",0,"Nhắn Zalo hỗ trợ"),DC.x("shop.success.j30",1,"Chat with us on Zalo"))+'</a></div>';
  h+='<a class="v3ok-xsell" href="/khoa-hoc"><span><small>'+v3T(DC.x("shop.success.j31",0,"Dapper Combat · Khóa học"),DC.x("shop.success.j31",1,"Dapper Combat · Training"))+'</small><b>'+v3T(DC.x("shop.success.j32",0,"Có đồ rồi, lên sàn thôi — học thử Boxing miễn phí"),DC.x("shop.success.j32",1,"Got the gear? Book a free Boxing trial"))+'</b></span><i>→</i></a>';
  h+='</div>';
  box.innerHTML=h;
}
(function(){
  var s=$("success");if(!s)return;
  s.insertAdjacentHTML("beforeend",'<div id="v3Ok"></div>');
  /* chạy sau handler đặt hàng gốc */
  $("placeOrder").addEventListener("click",function(){
    if(!s.classList.contains("active"))return;
    v3okSnap();s.classList.add("v3ok");v3okRender();s.scrollTop=0;
  });
  document.addEventListener("click",function(e){
    var c=e.target.closest("[data-v3copy]");
    if(c){var txt=c.dataset.v3copy,done=function(){c.textContent=v3T(DC.x("shop.other.j5",0,"Đã chép ✓"),DC.x("shop.other.j5",1,"Copied ✓"));c.classList.add("ok");setTimeout(function(){c.textContent=v3T(DC.x("shop.other.j6",0,"Sao chép"),DC.x("shop.other.j6",1,"Copy"));c.classList.remove("ok");},1600);};
      try{navigator.clipboard.writeText(txt).then(done,done);}catch(err){done();}return;}
    if(e.target.closest("[data-v3okclose]")){s.classList.remove("v3ok");V3OK.d=null;$("successClose").click();}
  });
  var _al4=applyLang;applyLang=function(){_al4.apply(this,arguments);if(V3OK.d&&s.classList.contains("active"))v3okRender();};
  /* Esc: đóng màn hình đặt hàng thành công (như bấm "Tiếp tục mua sắm") — trừ khi đang mở ảnh phiếu */
  document.addEventListener("keydown",function(e){if(e.key!=="Escape"||!s.classList.contains("active"))return;if(e.defaultPrevented||document.getElementById("dcSlipView"))return;var c=s.querySelector("[data-v3okclose]");if(c)c.click();else $("successClose").click();var n=document.querySelector('.nav-links a[href="/shop"]');if(n)n.focus({preventScroll:true});});
})();

var MNAV={cur:"shop",home:"/",shop:"/shop",course:"/khoa-hoc",services:"/dich-vu-setup",zalo:"https://zalo.me/dappercombat",fb:"https://facebook.com/dappercombat"};


/* ===== MNAV V3: menu mobile + nhãn menu thống nhất cho Home / Shop / Course (cấu hình MNAV do build chèn) ===== */
(function(){
  if(typeof MNAV==="undefined")return;
  document.body.classList.add("mn-"+MNAV.cur);
  function L(){var b=document.querySelector(".lang-switch button.on");return b&&b.dataset.lang==="en"?"en":"vi";}
  function T(vi,en){return L()==="en"?en:vi;}
  var PAGES=DC.list("global.mnav.pages",function($k){return [
    {k:$k.v("home"),url:DC.x($k("global.mnav.u1"),0,"/"),n:[DC.x($k("global.mnav.1"),0,"Trang chủ"),DC.x($k("global.mnav.1"),1,"Home")],s:[DC.x($k("global.mnav.2"),0,"Câu chuyện · HLV · cộng đồng"),DC.x($k("global.mnav.2"),1,"Story · coach · community")]},
    {k:$k.v("shop"),url:DC.x($k("global.mnav.u2"),0,"/shop"),n:[DC.x($k("global.mnav.3"),0,"Shop"),DC.x($k("global.mnav.3"),1,"Shop")],s:[DC.x($k("global.mnav.4"),0,"Găng · áo · phụ kiện · đồ tập"),DC.x($k("global.mnav.4"),1,"Gloves · apparel · gear")]},
    {k:$k.v("course"),url:DC.x($k("global.mnav.u3"),0,"/khoa-hoc"),n:[DC.x($k("global.mnav.5"),0,"Khóa học"),DC.x($k("global.mnav.5"),1,"Courses")],s:[DC.x($k("global.mnav.6"),0,"Foundation · Group Training · PT 1-1"),DC.x($k("global.mnav.6"),1,"Foundation · Group Training · PT 1-on-1")]},
    {k:$k.v("services"),url:DC.x($k("global.mnav.u4"),0,"/dich-vu-setup"),n:[DC.x($k("global.mnav.7"),0,"Dịch vụ Setup"),DC.x($k("global.mnav.7"),1,"Gym Setup")],s:[DC.x($k("global.mnav.8"),0,"Thiết kế · thiết bị · setup phòng tập"),DC.x($k("global.mnav.8"),1,"Gym design · equipment · setup")]}
  ];});
  /* nút menu */
  var right=document.querySelector(".nav .nav-right");
  if(right&&!document.querySelector(".hamburger-btn")){right.insertAdjacentHTML("beforeend",'<button class="mn-btn" type="button" aria-label="menu"><span></span><span></span></button>');}
  document.body.insertAdjacentHTML("beforeend",'<div class="mn" id="mnPanel" aria-hidden="true"></div>');
  var panel=document.getElementById("mnPanel");
  function render(){
    var h='<div class="mn-top"><span class="mn-logo">'+DC.logoHtml(DC.x("global.brand",0,"DAPPER COMBAT"))+'</span><button class="mn-x" type="button" data-mn="close" aria-label="close">✕</button></div><nav class="mn-links">';
    PAGES.forEach(function(p,i){var cur=p.k===MNAV.cur;
      /* trang Shop: mục "Shop" đưa về lưới sản phẩm (kể cả khi đang xem sản phẩm / thanh toán) */
      h+='<a class="mn-link'+(cur?' cur':'')+'" '+(cur?'href="'+(MNAV.cur==="shop"?"/shop":"#")+'" data-mn="'+(MNAV.cur==="shop"?"shop":"close")+'"':'href="'+p.url+'"')+'><em>0'+(i+1)+'</em><span><b>'+T(p.n[0],p.n[1])+'</b><small>'+(cur?T(DC.x("global.mnav.9",0,"Đang xem"),DC.x("global.mnav.9",1,"You are here")):T(p.s[0],p.s[1]))+'</small></span><i>→</i></a>';});
    h+='</nav>';
    if(MNAV.cur==="services")h+='<a class="mn-cta" href="#contact" data-go="contact">'+T(DC.x("global.mnav.10",0,"Nhận tư vấn setup miễn phí"),DC.x("global.mnav.10",1,"Get a free setup consultation"))+'</a>';
    else if(MNAV.cur==="course")h+='<a class="mn-cta" href="#dang-ky" data-reg="trial">'+T(DC.x("global.mnav.11",0,"Đăng ký học thử miễn phí"),DC.x("global.mnav.11",1,"Book a free trial"))+'</a>';
    else h+='<a class="mn-cta" href="'+MNAV.course+'">'+T(DC.x("global.mnav.12",0,"Đăng ký học thử miễn phí"),DC.x("global.mnav.12",1,"Book a free trial"))+'</a>';
    if(MNAV.cur==="shop")h+='<button class="mn-sec" type="button" data-mn="cart">'+T(DC.x("global.mnav.13",0,"Xem giỏ hàng"),DC.x("global.mnav.13",1,"View cart"))+'</button>';
    h+='<div class="mn-foot"><div class="mn-soc"><a href="'+MNAV.zalo+'" target="_blank" rel="noopener">'+T(DC.x("global.mnav.zalo",0,"Zalo"),DC.x("global.mnav.zalo",1,"Zalo"))+'</a><a href="'+MNAV.fb+'" target="_blank" rel="noopener">'+T(DC.x("global.mnav.fb",0,"Facebook"),DC.x("global.mnav.fb",1,"Facebook"))+'</a></div><p>30 Đường 128, Phước Long, TP. Thủ Đức, TP. Hồ Chí Minh</p></div>';
    panel.innerHTML=h;
  }
  function open(){render();panel.classList.add("on");panel.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";}
  function close(){panel.classList.remove("on");panel.setAttribute("aria-hidden","true");document.body.style.overflow="";}
  document.addEventListener("click",function(e){
    if(e.target.closest(".mn-btn,.hamburger-btn")){e.preventDefault();open();return;}
    var a=e.target.closest("[data-mn]");
    if(a){e.preventDefault();close();if(a.dataset.mn==="cart"&&typeof openCart==="function")setTimeout(openCart,250);if(a.dataset.mn==="shop"&&typeof showView==="function")showView("shop");return;}
    if(e.target.closest("#mnPanel [data-reg],#mnPanel [data-go],#mnPanel a[target]"))close();
  },true);
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&panel.classList.contains("on"))close();});
  /* nhãn menu desktop thống nhất (VI: Trang chủ / Shop / Khóa học) + trạng thái đang xem */
  function labels(){
    var ul=document.querySelector(".nav .nav-links");
    if(ul&&MNAV.services&&ul.querySelectorAll("a").length<4)ul.insertAdjacentHTML("beforeend",'<li><a href="'+MNAV.services+'"></a></li>');
    var links=document.querySelectorAll(".nav .nav-links a");
    PAGES.forEach(function(p,i){var a=links[i];if(!a)return;a.textContent=T(p.n[0],p.n[1]);a.classList.toggle("active",p.k===MNAV.cur);});
    var back=document.querySelector(".nav .nav-back");
    if(back&&MNAV.cur==="course"){back.textContent=T(DC.x("global.mnav.14",0,"Đăng ký"),DC.x("global.mnav.14",1,"Sign up"));back.setAttribute("href","#dang-ky");back.removeAttribute("target");back.dataset.reg="found";back.classList.add("mn-navcta");}
    if(panel.classList.contains("on"))render();
  }
  var ls=document.querySelector(".lang-switch");if(ls)ls.addEventListener("click",function(){setTimeout(labels,0);});
  labels();
})();

applyLang();showView("shop");
/* receive cart handed off from Home via #buy= */
(function(){try{var m=(location.hash||"").match(/[#&]buy=([^&]+)/);if(!m)return;var items=JSON.parse(decodeURIComponent(escape(atob(m[1]))));if(!Array.isArray(items)||!items.length)return;items.forEach(function(it){var id=it[0],q=parseInt(it[1],10)||1;var p=PRODUCTS.find(function(x){return x.id===id;});if(p)addToCart(p.id,p.sizes[0],p.colors[0][0],q);});try{history.replaceState(null,"",location.pathname+location.search);}catch(e){}openCart();}catch(e){}})();
