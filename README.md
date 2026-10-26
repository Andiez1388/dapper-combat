# Dapper Combat — website

Website Boxing & Fight Lifestyle gồm 4 trang (song ngữ VI/EN, chạy tốt trên PC, tablet, điện thoại) và trang quản trị.

| Đường dẫn | Trang |
|---|---|
| `/` | Trang chủ |
| `/shop` | Cửa hàng · `/shop/<tên-sản-phẩm>` trang chi tiết · `/shop/checkout` thanh toán |
| `/khoa-hoc` | Khóa học (đăng ký học, học thử, đặt cọc) |
| `/dich-vu-setup` | Dịch vụ setup phòng tập (form nhận tư vấn) |
| `/admin` | Quản trị: đơn hàng, đăng ký khóa học, yêu cầu tư vấn, sản phẩm, người nhận tin |

## Chạy

```bash
npm install
npm start          # http://localhost:3000
```

Cần Node 20 trở lên. Sao chép `.env.example` thành `.env` (chạy thử trên máy: đổi `NODE_ENV=development`).

**Tài khoản quản trị đầu tiên** (tạo khi chưa có admin nào):
- **Chạy thật** (`NODE_ENV=production`): đặt `ADMIN_EMAIL` + `ADMIN_PASSWORD` (≥ 10 ký tự) trong `.env` / biến môi trường của hosting → đăng nhập bằng đúng email + mật khẩu đó. Không đặt thì máy chủ tạo mật khẩu tạm ngẫu nhiên, in **một lần** ra log, đăng nhập xong bắt đổi. Mật khẩu mặc định bên dưới **không bao giờ** được dùng khi chạy thật (mã nguồn công khai).
- **Chạy thử trên máy:** `admin@dappercombat.com` / `admin123`, lần đầu đăng nhập bắt đổi mật khẩu.

Đổi mật khẩu xong, các máy khác đang đăng nhập phải đăng nhập lại. Quên mật khẩu: một admin khác cấp lại ở Tài khoản & phân quyền.

### Kiểm tra tự động

```bash
npm test           # API + chạy thử trên Chrome / Edge ẩn (cần Node 22+ cho phần trình duyệt)
npm run test:api   # chỉ phần API
```

Bộ kiểm tra (`tests/`) tự dựng máy chủ thử với dữ liệu tạm (biến `DC_DATA_DIR`, `DC_UPLOAD_DIR`) — không đụng dữ liệu thật, không gửi Telegram / email. Gồm:
- **API:** đăng nhập và bảo mật, tính tiền đơn hàng, mã giảm giá, tồn kho khi hủy / mở lại / xóa đơn, SEO, phiếu xác nhận, biểu mẫu.
- **Trình duyệt:** mọi trang × tiếng Việt / tiếng Anh × 3 cỡ màn hình (không lỗi JavaScript, không tràn ngang, không còn `{biến}` chưa điền); đặt hàng có mã giảm giá; đăng ký khóa học; yêu cầu tư vấn; mọi màn hình quản trị.

Không có Chrome / Edge ở chỗ mặc định thì đặt `CHROME_PATH`. Kết quả cuối ghi số kiểm tra đạt và liệt kê mục chưa đạt.

### Đưa lên mạng

Website lưu dữ liệu trong file (thư mục `DC_DATA_DIR`) nên cần hosting có **ổ đĩa giữ dữ liệu** — không dùng được Vercel / Netlify. Hai cách có sẵn cấu hình:

**Cách 1 — Render.com** (dễ nhất, tự cập nhật mỗi khi đẩy code lên GitHub nhánh `main`):
1. render.com → New → **Blueprint** → chọn repo này (đọc `render.yaml`: gói Starter + ổ đĩa 1GB).
2. Nhập `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SITE_URL` (vd `https://dappercombat.vn`), tùy chọn `ANTHROPIC_API_KEY`.
3. Settings → Custom Domains → thêm tên miền → làm theo hướng dẫn trỏ DNS (CNAME / A) ở nơi mua tên miền. HTTPS tự cấp.

**Cách 2 — VPS Ubuntu** (máy chủ riêng, tốc độ tốt ở Việt Nam): trỏ tên miền (bản ghi A cho `@` và `www`) về IP VPS, rồi chạy `deploy/setup-vps.sh` (cài Node, PM2, Nginx, HTTPS Let's Encrypt; chạy lại để cập nhật code):

```bash
sudo DOMAIN=dappercombat.vn EMAIL=ban@gmail.com ADMIN_EMAIL=ban@gmail.com ADMIN_PASSWORD='mat-khau-cua-ban' bash deploy/setup-vps.sh
```

Dữ liệu nằm ở `/var/lib/dapper-combat` (VPS) hoặc ổ đĩa `/var/data` (Render) — tách khỏi code nên cập nhật code không mất đơn hàng.

- **Khóa đăng nhập:** đặt `JWT_SECRET` trong `.env` (chuỗi ngẫu nhiên ≥ 32 ký tự), hoặc để trống — server tự tạo và lưu ở `data/.jwt-secret`. Đổi khóa này thì mọi người phải đăng nhập lại.
- **HTTPS:** chạy sau Nginx / Caddy (có HTTPS) trên cùng máy, chuyển tiếp về cổng `PORT`. Nếu có thêm Cloudflare phía trước, đặt `TRUST_PROXY=2` để server biết IP thật của khách (dùng cho chặn spam, chặn đoán mật khẩu).
- **Giữ server chạy:** dùng PM2 (`pm2 start server.js --name dapper`) hoặc systemd. Chỉ chạy **một** tiến trình (dữ liệu lưu trong file JSON).
- **Địa chỉ website:** điền ở `/admin` → Thiết lập → Thông báo (hoặc `SITE_URL`) để link phiếu xác nhận và ảnh xem trước khi chia sẻ link hoạt động.
- **Sao lưu:** chép định kỳ thư mục `data/` (gồm cả `data/.jwt-secret`) và `public/assets/uploads/` (ảnh, video, phông đã tải lên).
- File dữ liệu bị hỏng (thường do sửa tay) không bị ghi đè: server cất bản hỏng thành `data/<tên>.hong-<thời gian>` và ghi lỗi ra log.

## Chức năng

- **Giỏ hàng dùng chung** giữa Trang chủ và Shop, giữ lại khi tải lại trang hoặc mở tab khác. Ở Trang chủ, bấm "Thêm vào giỏ" sẽ hiện ô chọn size.
- **Đặt hàng:** đơn được lưu trên server. Server tự tính lại giá, phí giao hàng và mã giảm giá rồi trừ tồn kho. Sản phẩm hết hàng không đặt được.
  - Tồn kho theo đơn: hủy đơn → trả hàng về kho (một lần); mở lại đơn đã hủy → trừ lại (kho không đủ thì báo); xóa đơn chưa giao (Mới / Đã xác nhận) → trả hàng về kho.
  - Mã giảm giá mẫu (đang bật, xem lại trước khi mở web): `DAPPER10` (giảm 10%), `GIAM100` (giảm 100.000₫), `FREESHIP`. Danh sách mã **không gửi ra trình duyệt** — khách nhập mã, trang hỏi server (`POST /api/promo`).
  - Phí giao: 30.000₫, miễn phí cho đơn từ 1.000.000₫. Giao hỏa tốc cộng thêm 35.000₫, mặc định chỉ nhận địa chỉ TP.HCM (tắt được ở Thiết lập → Bán hàng).
  - Lỗi khi đặt hàng / đăng ký / nhận tin trả về theo ngôn ngữ khách đang xem (VI / EN).
- **Đăng ký khóa học** (trang Khóa học) và **yêu cầu tư vấn setup** (trang Dịch vụ) được lưu và có mã tra cứu: `#DC-REG-xxxxx`, `#DC-SVC-xxxxx`.
- **Đăng ký nhận tin** ở trang sản phẩm.
- **Shop:** mỗi sản phẩm có URL riêng (chia sẻ được). Nút Back của trình duyệt quay lại đúng vị trí đang xem.
- **Ngôn ngữ** VI/EN chọn ở một trang thì các trang khác cũng theo.
- **Trang quản trị** `/admin` — vận hành hằng ngày:
  - **Đơn hàng, đăng ký, tư vấn:** đổi trạng thái, ghi chú nội bộ, gọi / nhắn Zalo; lọc theo trạng thái + ngày (hôm nay / 7 ngày / 30 ngày / tháng này) + tìm kiếm; “Xem thêm” từng 50 dòng; **Xuất CSV** (mở được bằng Excel) đúng danh sách đang lọc.
  - **Đã nhận tiền:** bật trong từng đơn / đăng ký (số tiền, ghi chú, ai ghi). Đơn COD chuyển “Hoàn tất” tự ghi đã thu. Chip “Chờ thanh toán”; Tổng quan tách “Đã thu” và “Chờ thu”. Phiếu xác nhận của khách hiện “Đã thanh toán”.
  - **Sửa đơn:** thông tin khách, số lượng / size / màu, thêm sản phẩm, phí giao, giảm giá, cách thanh toán, đơn vị vận chuyển + mã vận đơn (hiện trên phiếu khách). Tồn kho tự cộng / trừ; trước khi lưu có bảng tóm tắt thay đổi; lịch sử ghi ai sửa gì.
  - **Tạo đơn** cho khách mua qua điện thoại / Facebook / Zalo / tại phòng tập: trừ kho, có phiếu xác nhận để gửi link, có thể chọn nhận tại phòng tập.
  - **Sửa đăng ký:** học phí (vd PT 1-1 theo thỏa thuận), số cần trả trước, gói, lớp / ca, ngày học. Chuyển “Đã nhập học” tự đặt ngày bắt đầu và ngày hết hạn theo gói.
  - **Hội viên:** đang tập / sắp hết hạn (≤ 7 ngày) / đã hết hạn; chép tin nhắc gia hạn, nhắn Zalo.
  - **Khách hàng:** gom đơn hàng + đăng ký theo số điện thoại (số đơn, tiền đã thu, lần gần nhất), mở nhanh từng đơn.
  - **Sản phẩm:** giá, giá gốc, tồn kho (chung hoặc **theo từng size × màu**), mô tả, ảnh, video, ẩn/hiện; người nhận tin xuất CSV.
  - **Tài khoản & phân quyền** (chỉ admin): tạo tài khoản nhân viên với mật khẩu tạm (bắt đổi lần đầu), cấp lại mật khẩu, đổi quyền, xóa. **Nhân viên** xử lý đơn, đăng ký, tư vấn, sản phẩm, khách hàng, hội viên; **không** vào được Thiết lập, Nội dung website, Tài khoản, Sao lưu và không xóa được dữ liệu.
  - **Sao lưu dữ liệu** (chỉ admin): tải một file `.json` chứa toàn bộ dữ liệu (đơn hàng, khách, sản phẩm, thiết lập, nội dung, tài khoản). Khôi phục từ file đó — dữ liệu hiện tại được cất vào `data/truoc-khoi-phuc-<thời gian>/` trước. Ảnh / video đã tải lên (`public/assets/uploads/`) **không** nằm trong file, cần chép riêng.
- **Nội dung website** (`/admin` → Nội dung website). Sửa xong là trang đổi ngay, không cần sửa mã:
  - **Chữ trên trang:** khoảng 1.320 tiêu đề, đoạn văn, nút, câu hỏi, nhãn trong giỏ hàng / form / thanh toán… của cả 4 trang, có cả tiếng Việt lẫn tiếng Anh.
    - Chia theo trang → khu vực (vd "Học phí", "Hỏi đáp") → từng chữ.
    - Nút "Xem trên trang" mở đúng vị trí (tự mở giỏ hàng, form đăng ký, bảng size, trang thanh toán… nếu chữ nằm ở đó).
    - Từng chữ / nút ẩn được khỏi trang mà không cần xóa.
    - Gồm cả SEO: tiêu đề tab và mô tả trên Google.
  - **Danh sách** (76 danh sách: thẻ khóa học, đánh giá, câu hỏi thường gặp, gói thiết bị, lựa chọn trong form, cột chân trang, menu điện thoại…): thêm mục, nhân bản, ẩn, xóa, đổi thứ tự; mục mới có chữ, ảnh, link riêng. Danh sách lồng nhau (vd các dòng trong từng thẻ học phí) cũng chỉnh được. Số thứ tự 01, 02… tự đánh lại.
  - **Bố cục trang** (Trang chủ, Shop, Khóa học, Dịch vụ): ẩn hoặc đổi thứ tự từng khu vực. Thanh menu, dải chữ chạy và chân trang đứng cố định (dải thông báo / thanh dính dưới đáy ẩn được). Link mục lục trỏ tới khu vực đã ẩn tự ẩn theo.
  - **Chân trang** của mọi trang (kể cả Shop, Dịch vụ, trang phụ) sửa chữ / link, thêm bớt mục được. Cột **Chính sách** dẫn tới 4 trang phụ chính sách; trang nào chưa bật hiển thị thì link tự ẩn (cả cột ẩn nếu chưa trang nào bật). Dòng thông tin doanh nghiệp (tên, MST, địa chỉ, hotline, email) lấy từ mục Liên hệ, chỉ hiện khi đã điền tên doanh nghiệp hoặc MST.
  - **Hình ảnh & video:** 94 vị trí, mỗi vị trí thay riêng, kèm chữ mô tả ảnh (alt). Mỗi vị trí ghi kích thước gợi ý, tỉ lệ, định dạng và dung lượng tối đa, đo từ khung hiển thị thật trên máy tính và điện thoại.
  - **Icon** (40 icon): chọn từ thư viện, tải SVG / PNG, dán mã SVG, hoặc ẩn. Icon SVG nét đơn sắc tự đổi màu theo chữ.
  - **Liên kết & nút** (67 link + link trong menu điện thoại): đổi trang mà nút / link dẫn tới, có sẵn danh sách trang và vị trí (vd `/khoa-hoc#lich-tap`). Link ra ngoài tự mở tab mới.
  - **Màu sắc:** 4 màu thương hiệu (màu nhấn, màu nhấn khi rê chuột, màu đen chủ đạo, màu nền xám) và bảng màu chi tiết (78 màu còn lại đang dùng trên trang, đổi từng màu) — áp cho cả 4 trang.
  - **Phông chữ:** 4 kiểu chữ (tiêu đề lớn, tiêu đề thanh mảnh, đoạn văn, nhãn nhỏ), chọn trong 34 phông Google Fonts có đủ dấu tiếng Việt hoặc tải phông riêng (WOFF2 / WOFF / TTF / OTF).
  - **Mã tùy chỉnh:** CSS thêm cho mọi trang, mã gắn vào `<head>` (Google Analytics, Facebook Pixel…) và cuối trang (khung chat…).
  - **Trang phụ:** tự tạo trang nội dung (chính sách đổi trả, giới thiệu, điều khoản…) ở địa chỉ `/trang/<tên-trang>`, có tiếng Việt / tiếng Anh, ảnh đầu trang, mô tả SEO, bản nháp và xem trước. Có sẵn 4 bản nháp: Chính sách đổi trả & bảo hành, Chính sách bảo mật thông tin, Điều khoản sử dụng, Chính sách giao hàng & thanh toán — cần đọc lại, điền đúng thông tin doanh nghiệp và bật hiển thị trước khi dùng.
  - **Liên hệ & mạng xã hội:** hotline, Zalo, Facebook, Instagram, YouTube, địa chỉ, link Google Maps, giờ mở cửa, tên doanh nghiệp, mã số thuế, email. Giờ mở cửa dùng để tính trạng thái "Đang mở cửa" theo giờ Việt Nam và cho biến `{hours.days}`, `{hours.open}`, `{hours.close}` trên trang.
  - **Thanh toán:** tài khoản ngân hàng nhận chuyển khoản (xem bên dưới).

## Cấu trúc

```
server.js               Express: trang, file tĩnh (ảnh/video cache 1 năm), /assets/data/products.js
routes/api.js           API: orders, registrations, consults, subscribe, products, uploads, auth, stats
data/seed/products.json Danh mục sản phẩm ban đầu (lần chạy đầu sẽ chép sang data/products.json)
data/*.json             Dữ liệu chạy thật (đơn hàng, khách, tài khoản) — không đưa lên git, cần sao lưu
public/
  index.html, shop.html, khoa-hoc.html, dich-vu-setup.html, 404.html
  admin/index.html
  assets/css/<trang>.css      giao diện từng trang
  assets/js/<trang>-<n>.js    mã giao diện từng trang (giữ nguyên từ bản thiết kế)
  assets/js/site.js           dùng chung: gọi API, giỏ hàng, ngôn ngữ
  assets/js/<trang>-site.js   phần nối từng trang với server
  assets/css/site.css         chỉnh sửa giao diện bổ sung khi chạy thành website
  assets/media/               ảnh & video (tên theo mã băm nội dung)
lib/cms.js              Nội dung sửa trong /admin: lưu, áp vào HTML/CSS/JS khi phục vụ trang, /assets/data/cms.js
lib/cms-html.js         Phần cấu trúc: bố cục, danh sách (thêm / bớt / sắp xếp mục), số thứ tự, ẩn, icon, link, alt
lib/pages.js            Trang phụ (/trang/<slug>): lưu ở data/pages.json, làm sạch nội dung, dựng từ khuôn public/trang.html
lib/settings.js         Thiết lập kinh doanh (phí giao, mã giảm giá, học phí, lịch tập, thương hiệu, thông báo) + biến giá
lib/notify.js           Báo đơn mới qua Telegram / email + email xác nhận cho khách (theo mẫu trong Thiết lập)
lib/maillog.js          Nhật ký gửi tin (data/maillog.json)
lib/translate.js        Tiếng Anh tự dịch bằng Claude (hàng đợi nền, bộ nhớ dịch data/translations.json)
lib/paths.js            Thư mục dữ liệu (DC_DATA_DIR, mặc định data/) và ảnh tải lên (DC_UPLOAD_DIR)
public/assets/js/admin-ai.js   Màn hình Tiếng Anh (AI): khóa, trạng thái, dịch phần còn thiếu
public/assets/js/admin-ops.js  Màn hình vận hành: Khách hàng, Hội viên, Tài khoản & phân quyền, Sao lưu
tests/                  Kiểm tra tự động (npm test)
public/phieu.html       Trang phiếu xác nhận cho khách (/phieu/<mã>?k=…); assets/js/slip.js vẽ phiếu + ảnh PNG
data/seed/cms-catalog.json  Danh mục nội dung: mọi chữ / ảnh / video (khu vực, loại, nội dung mặc định, kích thước gợi ý)
data/cms.json           Phần đã sửa trong /admin (dữ liệu chạy thật — sao lưu cùng data/)
tools/cms-build.js      Gắn khóa nội dung vào trang (data-cms, DC.x, DC.m) và dựng lại danh mục
tools/cms-structure.js  Đánh dấu cấu trúc: khối trang, danh sách, icon, link, số thứ tự; bảng màu; nhãn dễ hiểu (chạy sau cms-build)
tools/cms-capture.browser.js  Đo trên trang thật: chữ đang hiển thị, chữ bị ẩn, khung ảnh/video → kích thước gợi ý
tools/export-pages.js   Công cụ đã dùng để chuyển 4 trang thiết kế (file HTML nhúng base64) thành website này
```

### Nội dung trang hoạt động thế nào

- Chữ trong HTML có thuộc tính `data-cms="khóa"`. Ảnh/video có `data-cms-media` (hoặc `data-cms-poster` cho ảnh chờ của video).
- Chữ do JavaScript dựng được bọc bằng `DC.x("khóa", 0|1, "mặc định")` (0 = tiếng Việt, 1 = tiếng Anh). Ảnh do JavaScript dựng được bọc bằng `DC.m("khóa", "/assets/media/…")`.
- Cấu trúc trang: `data-cms-block` (khối trang), `data-cms-list` + `data-cms-item` (danh sách và từng mục), `data-cms-num` (số thứ tự tự đánh lại), `data-cms-icon` (icon SVG), `data-cms-link` (link). Danh sách do JavaScript dựng được bọc bằng `DC.list("khóa", function ($k) { return [ … DC.x($k("khóa chữ"), …) … ]; })`, icon trong JavaScript bằng `DC.i("khóa", '<svg…>')`.
- Mục thêm mới trong danh sách được dựng lại từ một mục gốc; mọi khóa bên trong có thêm đuôi `@<mã mục>` (vd `course.faq.q1@n3k8a`).
- Khi phục vụ trang, server áp phần đã sửa: bố cục, danh sách, ẩn, icon, link, chữ tiếng Việt trong HTML, ảnh/video, màu, phông và thông tin liên hệ. Chữ tiếng Anh và phần do JavaScript dựng lấy từ `window.__CMS` (`/assets/data/cms.js`).

**Khi thêm hoặc đổi chữ, ảnh trực tiếp trong mã** (`public/*.html`, `assets/js/<trang>-1.js`):

1. Chạy `node tools/cms-build.js` rồi `node tools/cms-structure.js` (hoặc `npm run cms:structure`). Khóa cũ và phần đã sửa trong admin được giữ nguyên; chỗ mới được gắn khóa mới. Muốn thêm danh sách mới cho admin: khai báo trong `HTML_LISTS` / `JS_LISTS` ở đầu `tools/cms-structure.js`.
2. Mở `/admin`, đăng nhập, dán `tools/cms-capture.browser.js` vào Console của trình duyệt để đo lại chữ hiển thị và kích thước ảnh. Lúc chạy bước này, `data/cms.json` cần đang trống.

Ảnh và thông tin sản phẩm sửa ở mục **Sản phẩm**, không nằm trong mục Nội dung.

## Thiết lập kinh doanh (`/admin` → Thiết lập)

Lưu ở `data/settings.json`.

- **Bán hàng:**
  - Phí giao tiêu chuẩn, ngưỡng miễn phí giao, phí và bật/tắt giao hỏa tốc; hỏa tốc chỉ nhận địa chỉ TP.HCM (tắt được).
  - Mã giảm giá: giảm %, giảm số tiền hoặc miễn phí giao; bật/tắt từng mã; hạn dùng, số lượt tối đa, đơn tối thiểu; xem đã dùng bao nhiêu lượt (hủy đơn thì lượt được trả lại).
  - Sản phẩm hiện ở Trang chủ (tối đa 6, theo thứ tự chọn).
- **Danh mục sản phẩm:** thêm, đổi tên (VI/EN), sắp xếp, ẩn khỏi thanh lọc, xóa (chỉ khi không còn sản phẩm). Mỗi danh mục có mô tả trên đầu danh sách, chất liệu, trọng lượng, số tháng bảo hành và loại bảng size (áo / đồ tập / găng / freesize) hiện ở trang chi tiết. Link dạng `/shop?cat=<mã danh mục>` mở sẵn danh mục. Kèm tối đa 4 ô ảnh dẫn tới danh mục dưới lưới sản phẩm.
  - **Trang thanh toán:** bật / tắt từng cách thanh toán (COD, chuyển khoản, MoMo); ô email, phường / xã, ghi chú: không bắt buộc / bắt buộc / ẩn. Server kiểm tra lại khi nhận đơn.
  - **Trang chi tiết sản phẩm:** ẩn / hiện từng phần (video, cam kết, logo thanh toán, gợi ý size, tồn kho, ngày giao, điểm nổi bật, "hoàn thiện bộ trang phục", hỏi đáp, bài viết, đánh giá, "khách hàng cũng mua", "đã xem gần đây", đăng ký nhận tin). Phần **đánh giá** đang tắt sẵn vì 12 đánh giá trong mục Chữ trên trang chỉ là mẫu — bật lại khi đã thay bằng đánh giá thật. Sao và số đánh giá dưới tên sản phẩm chỉ hiện khi sản phẩm có số đánh giá (mục Sản phẩm).
- **Học phí & lịch tập:**
  - Học phí Foundation, tiền cọc và **ngày khai giảng** (biến `{found.start}` trên Trang chủ / Khóa học; ngày đã qua thì Tổng quan nhắc cập nhật), lớp HSSV, Membership.
  - **Gói Group Training:** thêm / bớt / sắp xếp gói (số tháng, giá, ghi chú, tên riêng, nhãn "Hời nhất"). Giá mỗi tháng và tiền tiết kiệm tự tính; thẻ giá trên trang, nút chọn gói trong form đăng ký và số tiền server lưu đều theo đây.
  - Giá hiển thị trên trang, form đăng ký, mã QR và số tiền server lưu đều lấy theo mục này.
  - **Lịch tập:** thêm / bớt / sắp xếp hàng (giờ, tên lớp, mô tả, màu, ngày có lớp T2–CN, bấm vào hàng mở form đăng ký chương trình nào / lớp nào).
- **Thương hiệu:** logo trên thanh menu, favicon, địa chỉ để hiện Google Maps ở Trang chủ.
- **Thông báo:** Telegram / email báo đơn mới (ưu tiên hơn `.env`).
  - **Mẫu tin** cho đơn hàng, đăng ký khóa học, yêu cầu tư vấn: tiêu đề và nội dung với biến `{code}`, `{name}`, `{total}`, `{items}`…; dòng có biến trống tự bỏ; xem trước và gửi thử.
  - **Email xác nhận cho khách** (đơn hàng, đăng ký khóa học): tắt sẵn; khi bật, gửi tới email khách nhập (cần cài SMTP). Biến `{slip}` = link phiếu xác nhận (cần điền địa chỉ website).

## Xác nhận cho khách (phiếu + email)

- Mỗi đơn hàng / đăng ký khóa học có **phiếu xác nhận** riêng: `/phieu/<mã>?k=<khóa>` (khóa ngẫu nhiên, không đoán được). Khách mở được trên web, in / lưu PDF, hoặc **tải ảnh PNG** (có mã VietQR nếu thanh toán chuyển khoản).
- Nút "Tải phiếu xác nhận (ảnh)" và "Xem / in phiếu" hiện ở màn hình đặt hàng thành công (Shop) và bước cuối form đăng ký (Khóa học). Trình duyệt trong Zalo / Facebook không cho tải file → ảnh hiện ra để nhấn giữ lưu.
- Server ghi lại cho từng đơn: email xác nhận đã gửi / lỗi / khách không có email / chưa bật; số lần khách xem, tải phiếu. Xem và gửi lại ở `/admin` (chi tiết đơn / đăng ký, màn hình **Xác nhận & nhật ký gửi tin**).
- **Nhật ký gửi tin** (`data/maillog.json`, 500 dòng gần nhất): mọi tin Telegram / email đã gửi cho chủ shop và cho khách, kèm lỗi nếu có.
- Chữ trên phiếu sửa ở Chữ trên trang → Chung → Phiếu xác nhận.

Trong mục Chữ trên trang, các chữ có **biến** tự điền theo Thiết lập / Liên hệ (giá: 1.000.000 cho tiếng Việt, 1,000,000 cho tiếng Anh). Khi sửa chữ, giữ nguyên phần `{…}`:
- Giá: `{found.price}`, `{found.deposit}`, `{gt.12}`, `{gt.12.mo}`, `{gt.from}`, `{hssv.price}`, `{mem.price}`, `{ship.free}`, `{ship.fee}`, `{ship.express}`.
- Ngày khai giảng: `{found.start}`. Thời gian giao: `{ship.eta}` (vd 2–4), `{ship.eta.exp}`.
- Giờ mở cửa: `{hours.days}`, `{hours.open}`, `{hours.close}`.
- Lịch tập (theo từng hàng trong Lịch tập): `{sched.<chương trình>.<lớp/ca>}` = giờ học, thêm `.days` = ngày có lớp — vd `{sched.found.A}` "20:00 – 21:30", `{sched.found.A.days}` "T2 · T4 · T6", `{sched.gt.am}`, `{sched.hssv}`. Sửa Lịch tập là chữ trên trang đổi theo; lựa chọn lớp / ca trong form đăng ký cũng lấy từ Lịch tập.
- Biến không còn (vd gói / lớp đã xóa) để trống trên trang; mục Chữ trên trang cảnh báo.

Mỗi sản phẩm (mục Sản phẩm) có:
- **Ảnh phụ** cho trang chi tiết (tối đa 12), **video riêng** (thay 2 video chung) và **nhãn trên ảnh**: Tự động / Mới / Bán chạy / Không nhãn.
- **Tên tiếng Anh**, **điểm nổi bật riêng** (trống = 4 điểm chung), **màu tự đặt tên** (ngoài 6 màu có sẵn; tên màu lưu kèm đơn hàng).
- **SEO & đường dẫn:** tiêu đề / mô tả trên Google, đường dẫn `/shop/<đường-dẫn>` tự đặt. Đổi tên hoặc đường dẫn → link cũ tự chuyển (301) sang link mới.

## Tiếng Anh tự dịch (AI)

Chủ shop chỉ cần sửa **tiếng Việt**. Khi bấm Lưu ở Chữ trên trang, Sản phẩm (tên, mô tả, điểm nổi bật), Danh mục, Học phí & lịch tập (ghi chú gói, tên lớp) hay Trang phụ, máy chủ nhờ AI (Claude, model `claude-opus-5-5`) dịch phần vừa đổi sang tiếng Anh trong vài giây. Khách bấm **EN** trên website là thấy bản dịch — không phải chờ dịch lúc bấm.

- **Cài đặt:** `/admin` → Nội dung website → **Tiếng Anh (AI)** → dán khóa Claude API (lấy ở console.anthropic.com → API Keys) → Lưu → “Thử khóa”. Hoặc đặt `ANTHROPIC_API_KEY` trong `.env`. Khóa chỉ lưu trên máy chủ, không gửi ra trình duyệt.
- **Trong lúc chờ dịch hoặc khi chưa có khóa:** trang tiếng Anh tạm hiện chữ tiếng Việt mới (không hiện chữ tiếng Anh cũ đã sai nội dung). Màn Tiếng Anh (AI) cho biết còn bao nhiêu chỗ chưa dịch và có nút **Dịch phần còn thiếu**.
- **Muốn tự viết bản tiếng Anh** cho một chỗ: sửa ô English của chỗ đó — AI chỉ dịch lại khi chữ tiếng Việt đổi.
- AI giữ nguyên `{biến}`, thẻ HTML, tên chương trình (Foundation, Group Training…), giá, số điện thoại, đường dẫn. Câu đã dịch được nhớ trong `data/translations.json` nên không tốn tiền dịch lại.
- **Chi phí** (Anthropic tính theo lượng chữ): mỗi lần lưu thường vài trăm đồng; dịch toàn bộ website dưới 50.000đ. Nếu AI từ chối một đoạn vì chính sách an toàn, máy chủ Anthropic tự chạy lại bằng model dự phòng (`fallbacks: "default"`).
- Mã: `lib/translate.js` (hàng đợi dịch nền, gom nhiều câu một lần). Bộ kiểm tra dùng dịch giả (`DC_AI_MOCK=1`), không gọi AI thật.

## SEO

- `/sitemap.xml` (trang chính, sản phẩm đang bán, trang phụ đã bật) và `/robots.txt` tự tạo; chặn `/admin`, `/api`, `/phieu`, trang thanh toán.
- Mỗi trang có link chuẩn (canonical). Trang chủ có dữ liệu phòng tập cho Google (địa chỉ, giờ mở cửa, mạng xã hội, tên doanh nghiệp, MST); trang sản phẩm có dữ liệu sản phẩm (giá, còn hàng, ảnh).
- Chọn tiếng Anh thì tiêu đề tab và mô tả cũng đổi sang tiếng Anh.
- Cần điền **địa chỉ website** (Thiết lập → Thông báo) khi đưa lên mạng để link chuẩn và ảnh chia sẻ dùng đúng tên miền.

## Thanh toán chuyển khoản (VietQR)

Vào `/admin` → Nội dung website → **Thanh toán**, chọn ngân hàng, nhập số tài khoản và tên chủ tài khoản.
- Màn hình đặt hàng thành công và form đăng ký khóa học sẽ hiện **mã VietQR thật**, có sẵn số tiền và nội dung chuyển khoản là mã đơn (vd `DC871627`), kèm thông tin ngân hàng để khách chuyển tay.
- App ngân hàng và MoMo đều quét được. Ảnh mã do img.vietqr.io tạo.
- Chưa cài tài khoản thì trang hiện mã minh họa.

## Báo đơn mới cho chủ shop

Có đơn hàng, đăng ký khóa học hoặc yêu cầu tư vấn mới thì server gửi tin qua **Telegram** và/hoặc **email**, kèm link mở thẳng trong `/admin`. Cài trong file `.env` (xem `.env.example`):
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Tạo bot bằng @BotFather.
- Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `NOTIFY_EMAIL`. Gmail cần "mật khẩu ứng dụng".
- `SITE_URL`: địa chỉ website, để link trong tin nhắn bấm được.

Gửi thử: `POST /api/notify/test` (đăng nhập quản trị). Không cài kênh nào thì bỏ qua, khách vẫn đặt hàng bình thường.

## API công khai

| Phương thức | Đường dẫn | Ghi chú |
|---|---|---|
| GET | `/api/products` | sản phẩm đang hiển thị |
| POST | `/api/orders` | `{items:[{id,size,color,qty}], customer:{name,phone,email,address,ward,city,note}, pay, ship, promo}` |
| POST | `/api/registrations` | đăng ký khóa học |
| POST | `/api/consults` | yêu cầu tư vấn setup |
| POST | `/api/subscribe` | `{email, source}` |

Các form công khai giới hạn số lượt gửi cho mỗi IP để chống spam. API quản trị cần token đăng nhập (`Authorization: Bearer …`).

## Cần thay trước khi chạy thật

- **Hotline:** đang là số tạm `0909 xxx xxx`. Thay ở `/admin` → Nội dung website → Liên hệ & mạng xã hội (đổi ở mọi trang cùng lúc).
- **Tài khoản nhận chuyển khoản:** cài ở `/admin` → Thanh toán để có mã VietQR thật.
- **Kênh báo đơn mới:** cài Telegram hoặc email trong `.env`.
- **Cổng thanh toán online** (VNPay / MoMo tự động xác nhận) chưa kết nối vì cần tài khoản merchant. Hiện tại khách chọn COD hoặc chuyển khoản, chủ shop đối chiếu nội dung chuyển khoản và xác nhận trong `/admin`.
