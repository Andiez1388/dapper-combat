const express = require('express');
const fs      = require('fs');
const path    = require('path');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');

const router = express.Router();
const notify = require('../lib/notify');
const settings = require('../lib/settings');
const translate = require('../lib/translate');

// thư mục dữ liệu / ảnh tải lên: đổi được bằng DC_DATA_DIR, DC_UPLOAD_DIR (lib/paths.js); dữ liệu gốc luôn ở data/seed của repo
const { DATA_DIR, SEED_DIR, UPLOAD_DIR } = require('../lib/paths');
const SEED_PRODUCTS = path.join(SEED_DIR, 'products.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// khóa ký phiên đăng nhập: JWT_SECRET trong .env (≥ 32 ký tự); chưa đặt → tự tạo ngẫu nhiên, lưu ở data/.jwt-secret (không đưa lên git)
const JWT_SECRET = (() => {
  const env = String(process.env.JWT_SECRET || '');
  if (env.length >= 32 && !/change-this/i.test(env)) return env;
  if (env) console.warn('[bảo mật] JWT_SECRET trong .env quá ngắn hoặc còn là giá trị mẫu → dùng khóa tự tạo trong data/.jwt-secret');
  const f = path.join(DATA_DIR, '.jwt-secret');
  try { const s = fs.readFileSync(f, 'utf8').trim(); if (s.length >= 32) return s; } catch { /* chưa có */ }
  const s = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(f, s, { mode: 0o600 });
  return s;
})();

// ─── File DB ───────────────────────────────────────────────────────────────
function read(file, def) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) { writeFile(file, def); return JSON.parse(JSON.stringify(def)); }
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {
    // file hỏng (thường do sửa tay): cất bản hỏng sang bên cạnh để không bị lần ghi sau đè mất
    const bad = p + '.hong-' + Date.now();
    try { fs.renameSync(p, bad); } catch { /* bỏ qua */ }
    console.error(`[dữ liệu] ${file} bị hỏng (${e.message}) — đã cất bản hỏng ở ${path.basename(bad)}, tạm dùng dữ liệu trống`);
    return JSON.parse(JSON.stringify(def));
  }
}
// ghi qua file tạm rồi đổi tên: không để file JSON bị hỏng nếu tiến trình dừng giữa chừng
function writeFile(file, data) {
  const p = path.join(DATA_DIR, file), tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, p);
}

// ─── Helpers ───────────────────────────────────────────────────────────────
// mật khẩu: scrypt + muối riêng từng tài khoản. Bản cũ (sha256) vẫn đăng nhập được và tự đổi sang scrypt ở lần đăng nhập kế tiếp
function hashPw(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return 'scrypt$' + salt + '$' + crypto.scryptSync(String(pw), salt, 64).toString('hex');
}
function checkPw(pw, stored) {
  stored = String(stored || '');
  let a, b;
  if (stored.startsWith('scrypt$')) {
    const [, salt, h] = stored.split('$');
    a = Buffer.from(h || '', 'hex'); b = crypto.scryptSync(String(pw), salt || '', 64);
  } else {
    a = Buffer.from(stored); b = Buffer.from(crypto.createHash('sha256').update(String(pw) + 'dc_salt_2024').digest('hex'));
  }
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const DEFAULT_PW = 'admin123';
function genId(pre = 'x') { return pre + crypto.randomBytes(5).toString('hex'); }
// tv = số phiên bản đăng nhập: đổi mật khẩu → tăng tv → mọi phiên cũ (máy khác) hết hiệu lực
function makeToken(user) { return jwt.sign({ id: user.id, email: user.email, role: user.role, tv: user.tv || 0 }, JWT_SECRET, { expiresIn: '30d' }); }
function str(v, max = 200) { return typeof v === 'string' ? v.trim().slice(0, max) : (typeof v === 'number' ? String(v).slice(0, max) : ''); }
function int(v, min, max, def = 0) { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; }
const PHONE_RE = /^(0|\+?84)\d{9}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function phoneOk(p) { return PHONE_RE.test(String(p || '').replace(/[\s.\-]/g, '')); }
// mã hiển thị cho khách: #DC-123456, #DC-REG-12345, #DC-SVC-12345 (không trùng trong danh sách hiện có)
function makeCode(prefix, digits, list) {
  const used = new Set(list.map(x => x.code));
  for (let i = 0; i < 50; i++) {
    const n = crypto.randomInt(10 ** (digits - 1), 10 ** digits);
    const code = prefix + n;
    if (!used.has(code)) return code;
  }
  return prefix + Date.now();
}

// chặn spam form công khai: tối đa `max` lượt / `windowMs` cho mỗi IP và mỗi loại form
const hits = new Map();
function limit(key, max = 12, windowMs = 10 * 60 * 1000) {
  return (req, res, next) => {
    const k = key + '|' + (req.ip || '');
    const now = Date.now();
    const arr = (hits.get(k) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: msg(req, 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.', 'Too many requests, please try again in a few minutes.') });
    arr.push(now); hits.set(k, arr); next();
  };
}
// dọn lượt cũ để bộ nhớ không phình mãi
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of hits) if (!arr.length || now - arr[arr.length - 1] > 60 * 60 * 1000) hits.delete(k);
}, 15 * 60 * 1000).unref();
// lời nhắn cho khách theo ngôn ngữ trang đang xem (trình duyệt gửi kèm lang)
function msg(req, vi, en) { return ((req.body || {}).lang || req.query.lang) === 'en' ? en : vi; }

// Seed default admin on first run (bắt đổi mật khẩu ở lần đăng nhập đầu)
// Tài khoản admin đầu tiên (khi chưa có admin nào):
//   - ADMIN_EMAIL + ADMIN_PASSWORD (biến môi trường của hosting, ≥ 10 ký tự) → dùng đúng mật khẩu đó
//   - chạy thật (NODE_ENV=production) mà chưa đặt ADMIN_PASSWORD → tạo mật khẩu ngẫu nhiên, in 1 lần ra log máy chủ, bắt đổi khi đăng nhập
//     (không bao giờ dùng mật khẩu mặc định ghi trong README — mã nguồn công khai)
//   - chạy thử trên máy (không phải production) → mật khẩu mặc định, bắt đổi khi đăng nhập
function ensureAdmin() {
  const users = read('users.json', []);
  if (users.some(u => u.role === 'admin')) return;
  const email = String(process.env.ADMIN_EMAIL || 'admin@dappercombat.com').trim().toLowerCase();
  let pw = String(process.env.ADMIN_PASSWORD || '');
  if (pw && pw.length < 10) { console.warn('[quản trị] ADMIN_PASSWORD quá ngắn (cần ít nhất 10 ký tự) — bỏ qua'); pw = ''; }
  const fromEnv = !!pw;
  if (!pw && process.env.NODE_ENV === 'production') {
    pw = crypto.randomBytes(9).toString('base64url');
    console.log(`[quản trị] Tạo tài khoản ${email} với mật khẩu tạm: ${pw} — đăng nhập /admin và đổi ngay (mật khẩu này chỉ in một lần)`);
  }
  users.push({ id: 'admin', name: 'Admin', email, password: hashPw(pw || DEFAULT_PW), role: 'admin', mustChange: !fromEnv, createdAt: Date.now() });
  writeFile('users.json', users);
}
ensureAdmin();
const safeUser = ({ password, tv, ...u }) => ({ ...u, mustChange: !!u.mustChange });

// ─── Auth Middleware ────────────────────────────────────────────────────────
// phiên chỉ hợp lệ khi tài khoản còn tồn tại và chưa đổi mật khẩu sau lúc đăng nhập (tv khớp)
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  let t;
  try { t = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
  const user = read('users.json', []).find(u => u.id === t.id);
  if (!user || (user.tv || 0) !== (t.tv || 0)) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
  req.user = { id: user.id, email: user.email, role: user.role, mustChange: !!user.mustChange };
  next();
}
// vai trò: admin = toàn quyền; staff = nhân viên (đơn hàng, đăng ký, tư vấn, sản phẩm, khách hàng — không vào thiết lập / nội dung / tài khoản / sao lưu, không xóa)
const ROLES = ['admin', 'staff'];
function staffOk(req, res, next) {
  auth(req, res, () => {
    if (!ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Admins only' });
    // còn dùng mật khẩu mặc định / mật khẩu tạm → chỉ được đổi mật khẩu
    if (req.user.mustChange) return res.status(403).json({ error: 'Cần đổi mật khẩu trước khi dùng trang quản trị', mustChange: true });
    next();
  });
}
function adminOnly(req, res, next) {
  staffOk(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ tài khoản quản trị (admin) mới làm được việc này.', adminOnly: true });
    next();
  });
}

// ─── Auth Routes ────────────────────────────────────────────────────────────
router.post('/auth/login', limit('login', 20), (req, res) => {
  const { email, password } = req.body || {};
  const users = read('users.json', []);
  const em = String(email || '').trim().toLowerCase();
  const user = users.find(u => String(u.email).toLowerCase() === em);
  if (!user || !checkPw(String(password || ''), user.password)) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
  if (!String(user.password).startsWith('scrypt$')) user.password = hashPw(String(password)); // nâng cấp cách lưu mật khẩu cũ
  if (String(password) === DEFAULT_PW) user.mustChange = true;
  user.lastLoginAt = Date.now();
  writeFile('users.json', users);
  res.json({ token: makeToken(user), user: safeUser(user) });
});

router.get('/auth/me', auth, (req, res) => {
  const users = read('users.json', []);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user));
});

router.post('/auth/change-password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Thiếu thông tin' });
  if (String(newPassword).length < 8) return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 8 ký tự' });
  if (String(newPassword) === DEFAULT_PW || String(newPassword) === String(currentPassword)) return res.status(400).json({ error: 'Hãy chọn mật khẩu mới khác mật khẩu cũ' });
  const users = read('users.json', []);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!checkPw(String(currentPassword), user.password)) return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
  user.password = hashPw(String(newPassword));
  user.tv = (user.tv || 0) + 1; // đăng xuất các máy khác
  delete user.mustChange;
  writeFile('users.json', users);
  res.json({ ok: true, token: makeToken(user), user: safeUser(user) });
});

// ─── Tài khoản & phân quyền (chỉ admin) ────────────────────────────────────
// mật khẩu tạm: 10 ký tự dễ đọc (bỏ 0/O, 1/l/I); người nhận phải đổi ở lần đăng nhập đầu
function tempPassword() {
  const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += abc[crypto.randomInt(abc.length)];
  return /\d/.test(s) ? s : s.slice(0, 9) + String(crypto.randomInt(2, 10));
}
const adminCount = users => users.filter(u => u.role === 'admin').length;
router.get('/users', adminOnly, (req, res) => res.json(read('users.json', []).map(safeUser)));
router.post('/users', adminOnly, (req, res) => {
  const b = req.body || {}, users = read('users.json', []);
  const email = str(b.email, 120).toLowerCase(), role = ROLES.includes(b.role) ? b.role : 'staff';
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email chưa đúng định dạng' });
  if (users.some(u => String(u.email).toLowerCase() === email)) return res.status(409).json({ error: 'Email này đã có tài khoản' });
  const pw = tempPassword();
  const u = { id: genId('u'), name: str(b.name, 80) || email.split('@')[0], email, password: hashPw(pw), role, mustChange: true, createdAt: Date.now(), createdBy: req.user.email };
  users.push(u);
  writeFile('users.json', users);
  res.status(201).json({ user: safeUser(u), tempPassword: pw });
});
router.put('/users/:id', adminOnly, (req, res) => {
  const b = req.body || {}, users = read('users.json', []), u = users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (b.role !== undefined && b.role !== u.role) {
    if (!ROLES.includes(b.role)) return res.status(400).json({ error: 'Vai trò không hợp lệ' });
    if (u.id === req.user.id) return res.status(400).json({ error: 'Không thể tự đổi quyền của chính mình — nhờ một admin khác làm.' });
    if (u.role === 'admin' && adminCount(users) <= 1) return res.status(400).json({ error: 'Phải còn ít nhất một tài khoản admin.' });
    u.role = b.role;
  }
  if (b.name !== undefined) u.name = str(b.name, 80) || u.name;
  u.updatedAt = Date.now(); u.updatedBy = req.user.email;
  writeFile('users.json', users);
  res.json(safeUser(u));
});
// cấp lại mật khẩu tạm: máy đang đăng nhập bằng tài khoản đó bị đăng xuất, lần đăng nhập tới phải đổi mật khẩu
router.post('/users/:id/reset-password', adminOnly, (req, res) => {
  const users = read('users.json', []), u = users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (u.id === req.user.id) return res.status(400).json({ error: 'Muốn đổi mật khẩu của chính bạn, dùng “Đổi mật khẩu” ở cuối thanh menu.' });
  const pw = tempPassword();
  u.password = hashPw(pw); u.mustChange = true; u.tv = (u.tv || 0) + 1;
  u.updatedAt = Date.now(); u.updatedBy = req.user.email;
  writeFile('users.json', users);
  res.json({ user: safeUser(u), tempPassword: pw });
});
router.delete('/users/:id', adminOnly, (req, res) => {
  const users = read('users.json', []), u = users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (u.id === req.user.id) return res.status(400).json({ error: 'Không thể tự xóa tài khoản đang đăng nhập.' });
  if (u.role === 'admin' && adminCount(users) <= 1) return res.status(400).json({ error: 'Phải còn ít nhất một tài khoản admin.' });
  writeFile('users.json', users.filter(x => x.id !== u.id));
  res.json({ ok: true });
});

// ─── Products ───────────────────────────────────────────────────────────────
function seedProducts() {
  try { return JSON.parse(fs.readFileSync(SEED_PRODUCTS, 'utf8')); } catch { return []; }
}
function products() {
  const list = read('products.json', seedProducts());
  // dữ liệu cũ (v1) không có trường `cat` của Shop v3 → thay bằng bộ sản phẩm v3 (sản phẩm v3 luôn có `cat`, kể cả khi chưa có ảnh)
  if (list.length && !list.some(p => p.cat)) { const seed = seedProducts(); writeFile('products.json', seed); return seed; }
  return list;
}
function publicProducts() { return products().filter(p => p.visible !== false); }
router.publicProducts = publicProducts;
// đường dẫn sản phẩm /shop/<slug>: slug tự đặt trong /admin, hoặc tự tạo từ tên (bỏ dấu)
const slugify = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const productSlug = p => p.slug || slugify(p.name) || p.id;
router.slugify = slugify;
router.productSlug = productSlug;

router.get('/products', (req, res) => { res.json(publicProducts()); });
router.get('/admin/products', staffOk, (req, res) => { res.json(products()); });

const PRODUCT_FIELDS = ['name', 'nameEn', 'cat', 'price', 'old', 'img', 'images', 'video', 'badge', 'rating', 'reviews', 'stock', 'sizes', 'colors', 'features', 'desc', 'full', 'seoTitle', 'seoDesc', 'slug', 'visible'];
const MEDIA_URL = /^(\/assets\/(uploads|media)\/[\w.-]+|https:\/\/[^\s"'<>]+)$/;
function cleanProduct(body, base = {}) {
  const p = { ...base };
  for (const k of PRODUCT_FIELDS) if (body[k] !== undefined) p[k] = body[k];
  p.name = str(p.name, 120) || 'Sản phẩm mới';
  p.nameEn = str(p.nameEn, 120);
  const cats = settings.categoryIds();                      // danh mục sửa ở /admin → Danh mục sản phẩm
  p.cat = cats.includes(str(p.cat, 30)) ? str(p.cat, 30) : (cats.includes(base.cat) ? base.cat : cats[0]);
  p.price = int(p.price, 0, 1e9);
  p.old = p.old ? int(p.old, 0, 1e9) : null; if (!p.old || p.old <= p.price) delete p.old;
  p.stock = int(p.stock, 0, 1e6);
  p.reviews = int(p.reviews, 0, 1e6);
  p.rating = p.reviews ? Math.min(5, Math.max(0, Number(p.rating) || 0)) : 0; // chưa có đánh giá → không hiện sao
  p.sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes.map(s => str(s, 20)).filter(Boolean) : ['One size'];
  // màu: [mã, mã màu HEX, tên tiếng Việt, tên tiếng Anh] — tên trống = dùng tên có sẵn theo mã (Đỏ, Đen…)
  p.colors = Array.isArray(p.colors) && p.colors.length ? p.colors.filter(c => Array.isArray(c) && c[0]).slice(0, 12).map(c => {
    const key = slugify(str(c[0], 30)).slice(0, 20) || 'mau', hex = /^#[0-9a-f]{6}$/i.test(str(c[1], 7)) ? str(c[1], 7) : '#141414';
    const vi = str(c[2], 30), en = str(c[3], 30);
    return vi || en ? [key, hex, vi, en] : [key, hex];
  }) : [['black', '#141414']];
  for (const k of ['desc', 'full']) p[k] = { vi: str(p[k] && p[k].vi, 2000), en: str(p[k] && p[k].en, 2000) };
  // điểm nổi bật riêng của sản phẩm (trống = dùng 4 điểm chung ở mục Chữ trên trang)
  p.features = Array.isArray(p.features) ? p.features.slice(0, 8).map(f => ({ vi: str(f && f.vi, 160), en: str(f && f.en, 160) })).filter(f => f.vi) : [];
  p.img = str(p.img, 300);
  // ảnh phụ cho trang chi tiết (tối đa 12); nhãn trên ảnh: new = Mới, best = Bán chạy, none = không nhãn ("" = tự động; có giá gốc thì hiện % giảm)
  p.images = Array.isArray(p.images) ? p.images.map(u => str(u, 300)).filter(u => MEDIA_URL.test(u)).slice(0, 12) : [];
  // video riêng (MP4 / WEBM) thay cho 2 video chung ở trang chi tiết
  p.video = str(p.video, 300);
  if (p.video && !(MEDIA_URL.test(p.video) && (/^https:/.test(p.video) || /\.(mp4|webm)$/i.test(p.video)))) p.video = '';
  // SEO riêng (trống = tự lấy tên + mô tả) và đường dẫn tự đặt (trống = tự tạo từ tên)
  p.seoTitle = str(p.seoTitle, 70);
  p.seoDesc = str(p.seoDesc, 200);
  p.slug = slugify(str(p.slug, 80));
  if (p.slug === 'checkout') p.slug = '';
  p.badge = ['new', 'best', 'none'].includes(p.badge) ? p.badge : '';
  p.visible = p.visible !== false;
  // tồn kho theo size × màu (không bắt buộc): { "<size>::<mã màu>": số } — có thì stock = tổng
  if (body.stockBy === null) delete p.stockBy;
  else {
    const by = cleanStockBy(body.stockBy !== undefined ? body.stockBy : base.stockBy, p);
    if (by) { p.stockBy = by; p.stock = sumBy(by); } else delete p.stockBy;
  }
  return p;
}
const VKEY = (size, color) => String(size) + '::' + String(color);
const sumBy = by => Object.values(by || {}).reduce((s, n) => s + (Number(n) || 0), 0);
// chỉ giữ các ô khớp size / màu hiện có của sản phẩm (đổi size / màu → ô mới = 0)
function cleanStockBy(raw, p) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out = {};
  for (const s of p.sizes) for (const c of p.colors) { const k = VKEY(s, c[0]); out[k] = int(raw[k], 0, 1e6, 0); }
  return out;
}
// tên biến thể để báo lỗi: "14oz, Đỏ" (bỏ phần size khi chỉ có One size, bỏ màu khi chỉ có 1 màu)
const COLOR_NAMES = { red: ['Đỏ', 'Red'], black: ['Đen', 'Black'], white: ['Trắng', 'White'], grey: ['Xám', 'Grey'], navy: ['Xanh navy', 'Navy'], orange: ['Cam', 'Orange'] };
function variantText(p, key, en) {
  const i = String(key).lastIndexOf('::'), size = String(key).slice(0, i), color = String(key).slice(i + 2);
  const c = (p.colors || []).find(x => x[0] === color) || [];
  const cn = (en ? c[3] || c[2] : c[2]) || (COLOR_NAMES[color] || [])[en ? 1 : 0] || color;
  const parts = [];
  if (size && !((p.sizes || []).length <= 1 && /^one size$/i.test(size))) parts.push(size);
  if (color && (p.colors || []).length > 1) parts.push(cn);
  return parts.length ? ' (' + parts.join(', ') + ')' : '';
}

// đường dẫn trùng với sản phẩm khác (kể cả đường dẫn cũ đang chuyển hướng) → báo lỗi
function slugTaken(list, p) {
  const s = productSlug(p);
  const other = list.find(x => x.id !== p.id && (productSlug(x) === s || x.id === s || (x.oldSlugs || []).includes(s)));
  return other ? `Đường dẫn "/shop/${s}" đang dùng cho sản phẩm "${other.name}" — đặt đường dẫn khác ở mục SEO.` : '';
}

router.post('/products', staffOk, (req, res) => {
  const list = products();
  const b = { ...(req.body || {}) };
  delete b.stockWas; delete b.stockByWas;
  const p = cleanProduct(b);
  p.id = genId('p');
  p.createdAt = p.updatedAt = Date.now(); p.updatedBy = req.user.email;
  const taken = slugTaken(list, p);
  if (taken) return res.status(400).json({ error: taken });
  list.push(p);
  writeFile('products.json', list);
  translate.queue('product', productEnRefs(p));
  res.status(201).json(p);
});

/* ─── Tiếng Anh của sản phẩm: AI tự dịch (lib/translate.js) ─────────────────── */
// các cặp chữ của 1 sản phẩm: [ref, lấy tiếng Việt, đọc / ghi tiếng Anh]
function productPairs(p) {
  const out = [[p.id + '|name', p.name, () => p.nameEn, v => { p.nameEn = v; }]];
  for (const k of ['desc', 'full']) if (p[k]) out.push([p.id + '|' + k, p[k].vi, () => p[k].en, v => { p[k].en = v; }]);
  (p.features || []).forEach((f, i) => out.push([p.id + '|feat|' + i, f.vi, () => f.en, v => { f.en = v; }]));
  return out;
}
const productEnRefs = p => productPairs(p).filter(([, vi, en]) => vi && !en()).map(([ref]) => ref);
// đổi tiếng Việt mà tiếng Anh giữ nguyên → xóa bản tiếng Anh cũ (dịch lại nền)
function staleProductEn(old, p) {
  const prev = new Map(productPairs(old).map(([ref, vi, en]) => [ref, { vi, en: en() }]));
  for (const [ref, vi, en, set] of productPairs(p)) { const o = prev.get(ref); if (o && o.vi !== vi && o.en === en()) set(''); }
}
translate.register('product', {
  collect(refs) {
    const want = refs && new Set(refs), out = [];
    for (const p of products()) for (const [ref, vi, en] of productPairs(p)) if (vi && !en() && (!want || want.has(ref))) out.push({ ref, vi });
    return out;
  },
  apply(results) {
    const list = products(), by = new Map(results.map(r => [r.ref, r]));
    let n = 0;
    for (const p of list) for (const [ref, vi, en, set] of productPairs(p)) { const r = by.get(ref); if (r && r.vi === vi && !en()) { set(str(r.en, ref.endsWith('|name') ? 120 : 2000)); n++; } }
    if (n) writeFile('products.json', list);
  },
});

router.put('/products/:id', staffOk, (req, res) => {
  const list = products();
  const i = list.findIndex(p => p.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Product not found' });
  const b = { ...(req.body || {}) };
  // tồn kho không đổi trong form (stockWas = số lúc mở form) → giữ số hiện tại, tránh "trả lại" hàng của đơn vừa đặt trong lúc đang sửa
  if (b.stockWas !== undefined && Number(b.stockWas) === Number(b.stock)) delete b.stock;
  // tồn kho theo size / màu: ô nào không đổi so với lúc mở form → giữ số hiện tại của ô đó
  const curBy = list[i].stockBy;
  if (b.stockBy && typeof b.stockBy === 'object' && b.stockByWas && typeof b.stockByWas === 'object' && curBy) {
    b.stockBy = { ...b.stockBy };
    for (const k of Object.keys(b.stockBy)) if (b.stockByWas[k] !== undefined && Number(b.stockByWas[k]) === Number(b.stockBy[k]) && curBy[k] !== undefined) b.stockBy[k] = curBy[k];
  }
  delete b.stockWas; delete b.stockByWas; delete b.oldSlugs; delete b.createdAt; delete b.updatedAt; delete b.updatedBy;
  const before = productSlug(list[i]);
  const p = { ...cleanProduct(b, list[i]), id: req.params.id, updatedAt: Date.now(), updatedBy: req.user.email };
  const taken = slugTaken(list, p);
  if (taken) return res.status(400).json({ error: taken });
  // đổi tên / đổi đường dẫn → giữ đường dẫn cũ để link đã chia sẻ vẫn mở được (chuyển hướng 301)
  const now = productSlug(p);
  p.oldSlugs = (list[i].oldSlugs || []).concat(before !== now ? [before] : []).filter((s, k, a) => s !== now && a.indexOf(s) === k).slice(-10);
  if (!p.oldSlugs.length) delete p.oldSlugs;
  staleProductEn(list[i], p);
  list[i] = p;
  writeFile('products.json', list);
  translate.queue('product', productEnRefs(p));
  res.json(list[i]);
});

router.delete('/products/:id', adminOnly, (req, res) => {
  writeFile('products.json', products().filter(p => p.id !== req.params.id));
  res.json({ ok: true });
});

// ảnh sản phẩm tải lên từ trang quản trị (data URL → file trong /assets/uploads)
router.post('/uploads', staffOk, (req, res) => {
  const m = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(String((req.body || {}).dataUrl || ''));
  if (!m) return res.status(400).json({ error: 'Chỉ nhận ảnh PNG, JPG, WEBP hoặc GIF' });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'Ảnh tối đa 8MB' });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const name = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16) + '.' + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  res.status(201).json({ url: '/assets/uploads/' + name });
});

// ảnh/video tải lên dạng nhị phân (dùng cho mục Hình ảnh & video trong quản trị)
const UPLOAD_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm' };
// phông chữ tự tải (mục Phông chữ): kiểm tra chữ ký đầu file
const FONT_TYPES = { 'font/woff2': ['woff2', 'wOF2'], 'font/woff': ['woff', 'wOFF'], 'font/ttf': ['ttf', '\0\x01\0\0'], 'font/otf': ['otf', 'OTTO'] };
router.post('/uploads/file', staffOk, express.raw({ type: () => true, limit: '80mb' }), (req, res) => {
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const font = FONT_TYPES[type];
  const ext = UPLOAD_TYPES[type] || (font && font[0]);
  if (!ext) return res.status(400).json({ error: 'Chỉ nhận ảnh JPG, PNG, WEBP, GIF, video MP4, WEBM hoặc phông WOFF2, WOFF, TTF, OTF' });
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || !buf.length) return res.status(400).json({ error: 'File trống' });
  if (font && (buf.length > 5 * 1024 * 1024 || !(buf.slice(0, 4).toString('latin1') === font[1] || (ext === 'ttf' && buf.slice(0, 4).toString('latin1') === 'true')))) return res.status(400).json({ error: 'File phông chữ không hợp lệ (tối đa 5MB)' });
  if (ext !== 'mp4' && ext !== 'webm' && buf.length > 10 * 1024 * 1024) return res.status(413).json({ error: 'Ảnh tối đa 10MB' });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16) + '.' + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  res.status(201).json({ url: '/assets/uploads/' + name, size: buf.length, type });
});

// ─── Thiết lập kinh doanh (phí giao, mã giảm giá, học phí, lịch tập, thương hiệu, thông báo) ───
// nhân viên chỉ nhận phần cần cho việc hằng ngày (danh mục, phí giao, học phí…) — không có mẫu tin, tài khoản gửi tin, mã giảm giá
router.get('/settings', staffOk, (req, res) => res.json(req.user.role === 'admin' ? settings.forAdmin() : settings.forStaff()));
router.put('/settings', adminOnly, (req, res) => {
  const b = req.body || {};
  // không xóa danh mục còn sản phẩm
  if (b.shop && Array.isArray(b.shop.categories)) {
    const keep = new Set(b.shop.categories.map(c => String((c && c.id) || '').toLowerCase()));
    const used = {};
    for (const p of products()) if (!keep.has(p.cat)) used[p.cat] = (used[p.cat] || 0) + 1;
    const ids = Object.keys(used).filter(id => settings.categoryIds().includes(id));
    if (ids.length) {
      const name = id => ((settings.all().shop.categories.find(c => c.id === id) || {}).name || {}).vi || id;
      return res.status(400).json({ error: ids.map(id => `Danh mục "${name(id)}" đang có ${used[id]} sản phẩm`).join('; ') + ' — chuyển các sản phẩm đó sang danh mục khác (mục Sản phẩm) rồi mới xóa được.' });
    }
  }
  res.json(settings.update(b));
});

// ─── Nội dung trang (chữ, ảnh/video, màu, liên hệ) ─────────────────────────
const cms = require('../lib/cms');
router.get('/cms/catalog', adminOnly, (req, res) => res.json(cms.catalog()));
router.get('/cms', adminOnly, (req, res) => res.json(cms.data()));
router.put('/cms', adminOnly, (req, res) => res.json(cms.update(req.body || {})));
router.post('/cms/capture', adminOnly, (req, res) => res.json(cms.mergeCapture(req.body || {})));

// ─── Trang phụ (chính sách, giới thiệu…): /trang/<slug> ─────────────────────
const pages = require('../lib/pages');
const pageErr = (res, fn) => { try { return fn(); } catch (e) { return res.status(400).json({ error: e.message }); } };
router.get('/pages', adminOnly, (req, res) => res.json(pages.all()));
router.post('/pages', adminOnly, (req, res) => pageErr(res, () => res.status(201).json(pages.create(req.body || {}))));
router.put('/pages/:id', adminOnly, (req, res) => pageErr(res, () => { const p = pages.update(req.params.id, req.body || {}); return p ? res.json(p) : res.status(404).json({ error: 'Not found' }); }));
router.delete('/pages/:id', adminOnly, (req, res) => (pages.remove(req.params.id) ? res.json({ ok: true }) : res.status(404).json({ error: 'Not found' })));
// xem trước bản nháp: trả về HTML đã dựng (trang quản trị mở trong cửa sổ mới)
router.post('/pages/preview', adminOnly, (req, res) => pageErr(res, () => {
  const b = req.body || {}, p = { slug: 'xem-truoc', title: { vi: String((b.title || {}).vi || 'Xem trước'), en: String((b.title || {}).en || '') }, desc: { vi: '', en: '' },
    body: { vi: pages.cleanHtml((b.body || {}).vi), en: pages.cleanHtml((b.body || {}).en) }, cover: /^(\/assets\/|https:\/\/)/.test(String(b.cover || '')) ? String(b.cover) : '' };
  res.json({ html: cms.transform('trang/xem-truoc.html', pages.render(p)) });
}));

// ─── Orders ─────────────────────────────────────────────────────────────────
// Giá, phí giao và mã giảm giá tính lại ở server (trùng logic trang Shop) — không tin số tiền gửi từ trình duyệt.
function shopRules() {
  const sh = settings.all().shop;
  return { freeShip: sh.freeShip, fee: sh.shipFee, express: sh.expressFee, expressOn: sh.expressEnabled, expressHcmOnly: sh.expressHcmOnly !== false };
}
// cách thanh toán trên web: bank / momo / zalopay = quét cùng mã VietQR (SePay tự xác nhận); vnpay = thẻ; installment = trả góp (VNPay)
// đơn nhân viên tạo thêm: cash = tiền mặt (mua tại phòng tập / nhận hàng trả tiền mặt)
const PAY = ['bank', 'momo', 'zalopay', 'vnpay', 'installment'];
const QR_PAY = ['bank', 'momo', 'zalopay'];
const STAFF_PAY = PAY.concat('cash');
const ORDER_STATUS = ['new', 'confirmed', 'shipping', 'done', 'cancelled'];
// giao hỏa tốc chỉ trong TP.HCM (Thiết lập → Bán hàng); trang Shop dùng đúng phép thử này (DC.isHcm)
const isHcm = c => /ho\s*chi\s*minh|hcm|sai\s*gon/i.test(String(c || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd'));

/* ─── Mã giảm giá: hạn dùng, số lượt, đơn tối thiểu ──────────────────────────
   Mỗi mã (Thiết lập → Bán hàng): expires "YYYY-MM-DD" (dùng được hết ngày đó, giờ Việt Nam), maxUses (0 = không giới hạn),
   minOrder (tạm tính tối thiểu, 0 = không). Số lượt đã dùng lưu ở data/promo-usage.json: +1 khi có đơn dùng mã, −1 khi đơn bị hủy. */
const vnToday = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const moneyVi = n => Math.round(n || 0).toLocaleString('vi-VN'), moneyEn = n => Math.round(n || 0).toLocaleString('en-US');
// subtotal = null khi chưa biết tạm tính (trang Shop chưa gửi) → bỏ qua kiểm tra đơn tối thiểu
function promoCheck(code, subtotal, req) {
  const L = (vi, en) => msg(req, vi, en);
  const p = code && settings.all().shop.promos.find(x => x.code === code && x.active);
  if (!p) return { none: true };
  if (p.expires && vnToday() > p.expires) return { error: L('Mã giảm giá đã hết hạn', 'This code has expired') };
  if (p.maxUses && settings.promoUsed(code) >= p.maxUses) return { error: L('Mã giảm giá đã hết lượt sử dụng', 'This code has been fully redeemed') };
  if (subtotal != null && p.minOrder && subtotal < p.minOrder) return { error: L(`Đơn tối thiểu ${moneyVi(p.minOrder)}đ để dùng mã này`, `Minimum order ${moneyEn(p.minOrder)}đ for this code`) };
  return { rule: p, promo: p.type === 'pct' ? { pct: p.value / 100 } : p.type === 'fixed' ? { fix: p.value } : { freeship: true } };
}
// đếm lượt dùng mã theo đơn (promoCounted = đơn đang được tính 1 lượt)
function promoCount(o, d) {
  if (!o.promo) return;
  if (d > 0 && !o.promoCounted) { settings.bumpPromo(o.promo, 1); o.promoCounted = true; }
  else if (d < 0 && o.promoCounted) { settings.bumpPromo(o.promo, -1); o.promoCounted = false; }
}

// mã giảm giá không gửi sẵn cho trình duyệt: trang Shop hỏi server khi khách bấm Áp dụng
// body: { code, lang, subtotal? } — gửi kèm subtotal (tạm tính) để kiểm tra đơn tối thiểu ngay khi áp mã
router.post('/promo', limit('promo', 30), (req, res) => {
  const b = req.body || {}, code = str(b.code, 30).toUpperCase();
  const sub = b.subtotal !== undefined && b.subtotal !== null && b.subtotal !== '' ? int(b.subtotal, 0, 1e10) : null;
  const r = promoCheck(code, sub, req);
  if (r.none) return res.status(404).json({ error: msg(req, 'Mã không hợp lệ hoặc đã hết hạn', 'Invalid or expired code') });
  if (r.error) return res.status(422).json({ error: r.error, code });
  res.json({ code, ...r.promo, ...(r.rule.minOrder ? { minOrder: r.rule.minOrder } : {}), ...(r.rule.expires ? { expires: r.rule.expires } : {}) });
});

/* ─── Tồn kho theo dòng hàng (có / không chia theo size × màu) ──────────────── */
// số lượng theo sản phẩm: { id: { total, by: { "<size>::<màu>": n } } }
function needOf(items) {
  const m = {};
  for (const it of items || []) {
    if (!it || !it.id) continue;
    const e = m[it.id] = m[it.id] || { total: 0, by: {} };
    const q = Number(it.qty) || 0, k = VKEY(it.size, it.color);
    e.total += q; e.by[k] = (e.by[k] || 0) + q;
  }
  return m;
}
// chênh lệch a − b (số cần trừ thêm khỏi kho; âm = trả về kho)
function needDiff(a, b) {
  const out = {};
  for (const id of new Set(Object.keys(a).concat(Object.keys(b)))) {
    const x = a[id] || { total: 0, by: {} }, y = b[id] || { total: 0, by: {} }, by = {};
    for (const k of new Set(Object.keys(x.by).concat(Object.keys(y.by)))) { const d = (x.by[k] || 0) - (y.by[k] || 0); if (d) by[k] = d; }
    if (x.total - y.total || Object.keys(by).length) out[id] = { total: x.total - y.total, by };
  }
  return out;
}
// thiếu hàng cho phần cần trừ thêm (số dương) → [{ p, key, have, need }]
function shortages(catalog, need) {
  const out = [];
  for (const p of catalog) {
    const n = need[p.id]; if (!n) continue;
    if (p.stockBy) { for (const [k, q] of Object.entries(n.by)) if (q > 0 && q > (p.stockBy[k] || 0)) out.push({ p, key: k, have: p.stockBy[k] || 0, need: q }); }
    else if (n.total > 0 && n.total > p.stock) out.push({ p, key: '', have: p.stock, need: n.total });
  }
  return out;
}
const shortText = (list, word = 'cần') => list.map(s => `"${s.p.name}"${s.key ? variantText(s.p, s.key) : ''} ${word} ${s.need}, kho còn ${s.have}`).join('; ');
// trừ (sign = −1) / trả (sign = +1) kho theo need; ô biến thể không còn (đã đổi size / màu) thì bỏ qua
function applyNeed(need, sign, catalog = products()) {
  for (const p of catalog) {
    const n = need[p.id]; if (!n) continue;
    if (p.stockBy) {
      for (const [k, q] of Object.entries(n.by)) if (p.stockBy[k] !== undefined) p.stockBy[k] = Math.max(0, p.stockBy[k] + sign * q);
      p.stock = sumBy(p.stockBy);
    } else p.stock = Math.max(0, p.stock + sign * n.total);
  }
  writeFile('products.json', catalog);
}

function priceOrder(body, req) {
  const L = (vi, en) => msg(req, vi, en), en = msg(req, '', 'en') === 'en';
  const catalog = products();
  const items = [];
  for (const it of (Array.isArray(body.items) ? body.items.slice(0, 40) : [])) {
    const p = catalog.find(x => x.id === it.id && x.visible !== false);
    if (!p) return { error: L('Một sản phẩm trong giỏ không còn bán. Vui lòng tải lại trang.', 'An item in your cart is no longer available. Please reload the page.') };
    const qty = int(it.qty, 1, 50, 1);
    const size = p.sizes.includes(it.size) ? it.size : p.sizes[0];
    const pc = p.colors.find(c => c[0] === it.color) || p.colors[0], color = pc[0];
    const same = items.find(x => x.id === p.id && x.size === size && x.color === color);
    if (same) { same.qty += qty; same.line = same.qty * same.price; continue; }
    // tên màu tự đặt (nếu có) lưu kèm đơn — đơn cũ vẫn đọc đúng khi sau này đổi màu sản phẩm
    items.push({ id: p.id, name: p.name, img: p.img, size, color, ...(pc[2] ? { colorName: pc[2] } : {}), qty, price: p.price, line: p.price * qty });
  }
  if (!items.length) return { error: L('Giỏ hàng trống', 'Your cart is empty') };
  // hết hàng: theo từng size / màu nếu sản phẩm chia tồn kho theo biến thể
  const short = shortages(catalog, needOf(items))[0];
  if (short) {
    const p = short.p, nm = en ? p.nameEn || p.name : p.name, v = short.key ? variantText(p, short.key, en) : '';
    return { error: short.have > 0 ? L(`"${p.name}"${v} chỉ còn ${short.have} sản phẩm`, `Only ${short.have} left of "${nm}"${v}`) : L(`"${p.name}"${v} đã hết hàng`, `"${nm}"${v} is sold out`), code: 409 };
  }
  const subtotal = items.reduce((s, x) => s + x.line, 0);
  const R = shopRules();
  const promoCode = str(body.promo, 30).toUpperCase();
  const pc = promoCheck(promoCode, subtotal, req);
  if (pc.error) return { error: pc.error, code: 422, promoError: true };
  const promo = pc.promo || null;
  const discount = !promo ? 0 : promo.pct ? Math.round(subtotal * promo.pct) : promo.fix ? Math.min(promo.fix, subtotal) : 0;
  if (body.ship === 'exp' && R.expressOn && R.expressHcmOnly && !isHcm(body.customer && body.customer.city))
    return { error: L('Giao hỏa tốc chỉ áp dụng trong TP.HCM — vui lòng chọn giao tiêu chuẩn', 'Express delivery is only available in Ho Chi Minh City — please choose standard delivery') };
  const ship = body.ship === 'exp' && R.expressOn ? 'exp' : 'std';
  const base = promo && promo.freeship ? 0 : (subtotal >= R.freeShip ? 0 : R.fee);
  const shipping = base + (ship === 'exp' ? R.express : 0);
  return { items, subtotal, discount, shipping, ship, promo: promo ? promoCode : '', total: Math.max(0, subtotal - discount) + shipping };
}

router.post('/orders', limit('order', 10), async (req, res) => {
  const b = req.body || {};
  const c = b.customer || {};
  const customer = {
    name: str(c.name, 80), phone: str(c.phone, 20), email: str(c.email, 120),
    address: str(c.address, 200), ward: str(c.ward, 80), city: str(c.city, 80), note: str(c.note, 500),
  };
  const bad = (vi, en) => res.status(400).json({ error: msg(req, vi, en) });
  if (customer.name.length < 2) return bad('Vui lòng nhập họ tên', 'Please enter your name');
  if (!phoneOk(customer.phone)) return bad('Số điện thoại chưa đúng', 'Please enter a valid phone number');
  if (customer.email && !EMAIL_RE.test(customer.email)) return bad('Email chưa đúng định dạng', 'Please enter a valid email');
  if (customer.address.length < 5 || customer.city.length < 2) return bad('Vui lòng nhập đủ địa chỉ nhận hàng', 'Please enter your full delivery address');
  // trang thanh toán theo /admin → Thiết lập → Bán hàng
  const ck = settings.all().shop.checkout;
  if (ck.email === 'required' && !customer.email) return bad('Vui lòng nhập email', 'Please enter your email');
  if (ck.ward === 'required' && customer.ward.length < 2) return bad('Vui lòng nhập phường / xã', 'Please enter your ward');
  if (ck.note === 'required' && customer.note.length < 2) return bad('Vui lòng nhập ghi chú cho đơn hàng', 'Please add an order note');
  // thẻ (VNPay) / trả góp: chỉ khi cổng đã cài ở /admin → Thanh toán online
  const online = payments.online();
  if (!PAY.includes(b.pay)) return bad('Vui lòng chọn cách thanh toán', 'Please choose a payment method');
  if (b.pay === 'vnpay' && !online.vnpay) return bad('Thanh toán bằng thẻ đang tạm ngưng, vui lòng chọn cách khác', 'Card payment is unavailable, please choose another method');
  if (b.pay === 'installment' && !online.installment) return bad('Trả góp đang tạm ngưng, vui lòng chọn cách khác', 'Installments are unavailable, please choose another method');
  if (ck.pay[b.pay] === false) return bad('Phương thức thanh toán này đang tạm ngưng, vui lòng chọn cách khác', 'This payment method is unavailable, please choose another');
  const priced = priceOrder(b, req);
  if (priced.error) return res.status(priced.code || 400).json({ error: priced.error, ...(priced.promoError ? { promoError: true } : {}) });
  if (b.pay === 'installment' && priced.total < online.installmentMin)
    return bad(`Trả góp áp dụng cho đơn từ ${moneyVi(online.installmentMin)}đ — vui lòng chọn cách khác`, `Installments are available for orders from ${moneyEn(online.installmentMin)}đ — please choose another method`);

  const orders = read('orders.json', []);
  const order = {
    id: genId('ord'), code: makeCode('#DC-', 6, orders), createdAt: Date.now(), status: 'new',
    customer, pay: b.pay, lang: b.lang === 'en' ? 'en' : 'vi',
    ...priced, adminNote: '', history: [{ at: Date.now(), status: 'new' }], confirm: newConfirm(), stockReturned: false,
  };
  // trừ tồn kho (theo size / màu nếu sản phẩm chia tồn kho theo biến thể) + đếm lượt dùng mã giảm giá
  applyNeed(needOf(order.items), -1);
  promoCount(order, +1);
  orders.unshift(order);
  writeFile('orders.json', orders);
  notify.order(order, r => setConfirm('orders.json', order.id, { email: r }));
  const out = { id: order.id, code: order.code, total: order.total, subtotal: order.subtotal, discount: order.discount, shipping: order.shipping, slip: slipRef(order) };
  // thẻ: trả link để trang chuyển khách sang VNPay (lỗi thì khách thanh toán lại từ phiếu xác nhận)
  // trả góp: trang mở bảng chọn ngân hàng / kỳ hạn (GET /pay/installment/options) rồi mới sang VNPay
  if (order.pay === 'vnpay') {
    try { out.payUrl = await startPay(req, { x: order, file: 'orders.json', type: 'order' }, 'vnpay', order.lang); }
    catch (e) { out.payError = e.message; console.warn('[thanh toán vnpay]', e.message); }
  }
  if (order.pay === 'installment') out.installment = true;
  res.status(201).json(out);
});

/* ─── Xác nhận cho khách: email + phiếu xác nhận tải về ───────────────────── */
// confirm = { token (khóa mở phiếu), email: { status: pending | off | none | nosmtp | sent | failed, at, to, error }, slip: { views, downloads, firstAt, lastAt } }
function newConfirm() { return { token: crypto.randomBytes(12).toString('hex'), email: { status: 'pending' }, slip: { views: 0, downloads: 0 } }; }
const slipRef = e => ({ code: String(e.code).replace(/^#/, ''), k: e.confirm.token });
function setConfirm(file, id, patch) {
  const list = read(file, []), x = list.find(e => e.id === id);
  if (!x) return null;
  x.confirm = x.confirm || newConfirm();
  if (patch.email) x.confirm.email = patch.email;
  if (patch.slip) x.confirm.slip = { ...x.confirm.slip, ...patch.slip };
  writeFile(file, list);
  return x;
}

// ─── Course registrations (trang Khóa học) ──────────────────────────────────
const REG_STATUS = ['new', 'contacted', 'paid', 'enrolled', 'cancelled'];
router.post('/registrations', limit('reg', 10), (req, res) => {
  const b = req.body || {};
  const reg = {
    name: str(b.name, 80), phone: str(b.phone, 20), email: str(b.email, 120),
    program: str(b.program, 20), programName: str(b.programName, 120), detail: str(b.detail, 200),
    pkg: str(b.pkg, 10), opt: str(b.opt, 10), pay: str(b.pay, 20), payName: str(b.payName, 80),
    total: int(b.total, 0, 1e9), due: int(b.due, 0, 1e9), date: str(b.date, 20), note: str(b.note, 500),
    lang: b.lang === 'en' ? 'en' : 'vi',
  };
  const bad = (vi, en) => res.status(400).json({ error: msg(req, vi, en) });
  if (reg.name.length < 2) return bad('Vui lòng nhập họ tên', 'Please enter your name');
  if (!phoneOk(reg.phone)) return bad('Số điện thoại chưa đúng', 'Please enter a valid phone number');
  if (reg.email && !EMAIL_RE.test(reg.email)) return bad('Email chưa đúng định dạng', 'Please enter a valid email');
  if (!reg.program) return bad('Chưa chọn chương trình', 'Please choose a program');
  const fee = settings.all().course;
  const gt = (fee.gtPackages || []).find(k => String(k.months) === reg.pkg);   // gói Group Training theo số tháng
  const totals = { found: fee.foundPrice, gt: gt ? gt.price : 0, hssv: fee.hssvMonth * fee.hssvMonths, mem: fee.memMonth, pt: 0, trial: 0, coach: fee.careerPrice, fighter: fee.careerPrice };
  if (totals[reg.program] !== undefined) {
    reg.total = totals[reg.program];
    const career = reg.program === 'coach' || reg.program === 'fighter';
    reg.due = !reg.total ? 0 : reg.pay === 'full' ? reg.total : reg.pay !== 'deposit' ? 0
      : career ? Math.min(fee.careerDeposit || 0, reg.total) : reg.program === 'found' ? fee.foundDeposit : 0;
  }
  const list = read('registrations.json', []);
  const entry = { id: genId('reg'), code: makeCode('#DC-REG-', 5, list), createdAt: Date.now(), status: 'new', ...reg, adminNote: '', confirm: newConfirm() };
  list.unshift(entry);
  writeFile('registrations.json', list);
  notify.registration(entry, r => setConfirm('registrations.json', entry.id, { email: r }));
  res.status(201).json({ id: entry.id, code: entry.code, slip: slipRef(entry) });
});

/* phiếu xác nhận (công khai, cần đúng khóa k): dữ liệu để vẽ phiếu, ảnh QR chuyển khoản, đếm lượt tải */
const BANKS = require('../lib/cms').banks;
function bySlip(code, k) {
  const c = '#' + String(code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  for (const [file, type] of [['orders.json', 'order'], ['registrations.json', 'registration']]) {
    const x = read(file, []).find(e => e.code === c);
    if (x && x.confirm && k && crypto.timingSafeEqual(Buffer.from(String(k).padEnd(24).slice(0, 24)), Buffer.from(x.confirm.token))) return { x, file, type };
  }
  return null;
}
// tài khoản nhận tiền (/admin → Thanh toán) + số tiền cần chuyển của đơn / đăng ký
function payInfo(type, x) {
  const p = cms.data().payment || {};
  if (x.paid) return null; // đã nhận tiền → không cần mã QR chuyển khoản
  const amount = type === 'order' ? (QR_PAY.includes(x.pay) ? x.total : 0) : x.due || 0;
  if (!amount || !p.bankBin || !p.bankAccount) return null;
  // wallet: khách chọn MoMo / ZaloPay → phiếu hướng dẫn quét mã bằng app ví (vẫn chuyển vào tài khoản ngân hàng)
  return { bank: (BANKS.find(b => b[0] === p.bankBin) || [])[1] || '', bin: p.bankBin, acc: p.bankAccount, holder: p.bankHolder || '', amount, note: String(x.code).replace(/[^A-Za-z0-9]/g, ''),
    ...(type === 'order' && (x.pay === 'momo' || x.pay === 'zalopay') ? { wallet: x.pay } : {}) };
}
router.get('/slip/:code', limit('slip', 60), (req, res) => {
  const f = bySlip(req.params.code, req.query.k);
  if (!f) return res.status(404).json({ error: msg(req, 'Không tìm thấy phiếu', 'Confirmation not found') });
  const { x, type } = f;
  if (req.query.view) setConfirm(f.file, x.id, { slip: { views: (x.confirm.slip.views || 0) + 1, viewedAt: Date.now() } });
  const pay = payInfo(type, x);
  const base = { type, code: x.code, createdAt: x.createdAt, lang: x.lang, status: x.status, pay: pay ? { ...pay, qr: true } : null, paid: !!x.paid,
    online: onlineFor(type, x), payments: (x.payments || []).map(p => ({ provider: p.provider, amount: p.amount, at: p.at })) };
  if (type === 'order') return res.json({ ...base, customer: x.customer, items: x.items, subtotal: x.subtotal, discount: x.discount, shipping: x.shipping, total: x.total, payMethod: x.pay, ship: x.ship, promo: x.promo || '',
    carrier: x.carrier || '', trackingCode: x.trackingCode || '' });
  res.json({ ...base, customer: { name: x.name, phone: x.phone, email: x.email, note: x.note }, program: x.programName || x.program, detail: x.detail, total: x.total, due: x.due, payName: x.payName, date: x.date });
});
// ảnh VietQR qua server (img.vietqr.io không cho trình duyệt vẽ lại vào ảnh phiếu)
const qrCache = new Map();
router.get('/slip/:code/qr.png', limit('slipqr', 30), async (req, res) => {
  const f = bySlip(req.params.code, req.query.k), p = f && payInfo(f.type, f.x);
  if (!p) return res.status(404).end();
  const url = `https://img.vietqr.io/image/${encodeURIComponent(p.bin)}-${encodeURIComponent(p.acc)}-compact2.png?amount=${p.amount}&addInfo=${encodeURIComponent(p.note)}&accountName=${encodeURIComponent(p.holder)}`;
  try {
    let hit = qrCache.get(url);
    if (!hit) {
      const r = await fetch(url);
      if (!r.ok) throw new Error('VietQR ' + r.status);
      // VietQR có thể trả SVG dù đường dẫn / header ghi png → xem nội dung để gửi đúng loại ảnh
      const buf = Buffer.from(await r.arrayBuffer());
      const type = /^\s*(<\?xml|<svg)/.test(buf.slice(0, 100).toString('utf8')) ? 'image/svg+xml' : 'image/png';
      hit = { type, buf };
      if (qrCache.size > 200) qrCache.clear();
      qrCache.set(url, hit);
    }
    res.type(hit.type).setHeader('Cache-Control', 'private, max-age=86400');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data:"); // ảnh từ bên ngoài: không cho chạy mã
    res.send(hit.buf);
  } catch (e) { res.status(502).end(); }
});
router.post('/slip/:code/download', limit('slipdl', 30), (req, res) => {
  const f = bySlip(req.params.code, (req.body || {}).k);
  if (!f) return res.status(404).json({ error: 'Không tìm thấy phiếu' });
  const s = f.x.confirm.slip || {}, now = Date.now();
  setConfirm(f.file, f.x.id, { slip: { downloads: (s.downloads || 0) + 1, firstAt: s.firstAt || now, lastAt: now } });
  res.json({ ok: true });
});
/* ─── Thanh toán online: SePay (tự xác nhận chuyển khoản — cả khi khách quét mã bằng MoMo / ZaloPay), VNPay thẻ, VNPay trả góp — lib/payments.js ─── */
const payments = require('../lib/payments');
const KIND_OF = { order: 'orders', registration: 'registrations' };
const alnum = code => String(code || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();   // #DC-871627 → DC871627 (nội dung chuyển khoản / mã giao dịch)
const siteBase = req => ((settings.all().notify || {}).siteUrl || process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
// tìm đơn / đăng ký theo mã viết liền (DC871627, DCREG12345)
function byAlnum(code) {
  const c = alnum(code);
  if (!c) return null;
  for (const [file, type] of [['orders.json', 'order'], ['registrations.json', 'registration']]) {
    const x = read(file, []).find(e => alnum(e.code) === c);
    if (x) return { x, file, type };
  }
  return null;
}
// mã giao dịch gửi sang cổng: <mã đơn>T<thời gian> (mỗi lần bấm thanh toán là một mã mới — cổng không nhận trùng)
// mã đơn (DC123456 / DCREG12345) không có chữ T; phần thời gian sau T chỉ gồm chữ số
const refCode = ref => { const s = String(ref || ''), i = s.indexOf('T'); return i > 0 ? s.slice(0, i) : ''; };
const newRef = code => code + 'T' + Date.now();
// còn phải trả bao nhiêu (0 = đã trả / đã hủy / không cần trả trước)
const owed = (type, x) => (x.paid || x.status === 'cancelled' ? 0 : dueOf(KIND_OF[type], x));
// cổng khách còn dùng được cho đơn / đăng ký này (thẻ VNPay; trả góp khi số tiền đủ mức tối thiểu) — theo cả bật / tắt ở Thiết lập → Bán hàng
function onlineFor(type, x) {
  const o = payments.online(), ck = settings.all().shop.checkout.pay, due = owed(type, x);
  if (!due) return [];
  return [o.vnpay && 'vnpay', o.installment && due >= o.installmentMin && 'installment'].filter(p => p && ck[p] !== false);
}
// tạo link thanh toán thẻ ở cổng VNPay → url (lỗi thì ném, lời nhắn theo ngôn ngữ khách)
async function startPay(req, f, provider, lang) {
  const L = (vi, en) => (lang === 'en' ? en : vi);
  if (provider !== 'vnpay' || !payments.online().vnpay) throw new Error(L('Cổng thanh toán này đang tắt', 'This payment method is unavailable'));
  const amount = owed(f.type, f.x);
  if (!amount) throw new Error(f.x.paid ? L('Đơn này đã thanh toán', 'This order is already paid') : L('Không có khoản nào cần thanh toán', 'Nothing to pay'));
  const code = alnum(f.x.code), ref = newRef(code), base = siteBase(req);
  const list = read(f.file, []), x = list.find(e => e.id === f.x.id);
  x.payAttempts = (x.payAttempts || []).concat({ provider, ref, amount, at: Date.now() }).slice(-10);
  writeFile(f.file, list);
  return payments.vnpayUrl({ ref, amount, info: 'Thanh toan ' + code, ip: req.ip, returnUrl: base + '/api/pay/vnpay/return', lang });
}
// giao dịch đã xử lý (cổng / SePay gửi lại nhiều lần) — data/pay-events.json
function seenEvent(key) {
  const list = read('pay-events.json', []);
  if (list.includes(key)) return true;
  writeFile('pay-events.json', [key].concat(list).slice(0, 5000));
  return false;
}
// ghi nhận tiền về: { provider, ref?, code?, amount, txn } → 'paid' | 'already' | 'partial' | 'notfound' | 'amount' | 'dup'
function confirmPay({ provider, ref, code, amount, txn }) {
  const f = byAlnum(ref ? refCode(ref) : code);
  if (!f) return 'notfound';
  const list = read(f.file, []), x = list.find(e => e.id === f.x.id), kind = KIND_OF[f.type];
  if (ref) {
    const att = (x.payAttempts || []).find(a => a.ref === ref);
    if (!att) return 'notfound';
    if (Math.round(att.amount) !== Math.round(amount)) return 'amount';
  }
  if (txn && seenEvent(provider + ':' + txn)) return 'dup';
  const NAME = { sepay: 'Chuyển khoản (tự xác nhận)', vnpay: 'VNPay', installment: 'VNPay trả góp' };
  x.payments = (x.payments || []).concat({ provider, amount, at: Date.now(), txn: String(txn || '').slice(0, 60) });
  let result;
  if (x.paid) {
    result = 'already';
    x.history = (x.history || []).concat({ at: Date.now(), by: 'Tự động · ' + NAME[provider], note: 'Nhận thêm ' + vnd(amount) + ' sau khi đơn đã thanh toán — kiểm tra hoàn tiền nếu khách trả 2 lần' });
  } else {
    const got = x.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0), due = dueOf(kind, x);
    if (got >= due) { markPaid(kind, x, 'Tự động · ' + NAME[provider], got, NAME[provider] + (txn ? ' · mã GD ' + txn : '')); result = 'paid'; }
    else { x.history = (x.history || []).concat({ at: Date.now(), by: 'Tự động · ' + NAME[provider], note: 'Nhận ' + vnd(amount) + ' — còn thiếu ' + vnd(due - got) }); result = 'partial'; }
  }
  writeFile(f.file, list);
  notify.paid(f.type, x, { provider: NAME[provider], amount, txn, result });
  return result;
}
const slipBack = (f, state) => `/phieu/${String(f.x.code).replace(/^#/, '')}?k=${f.x.confirm ? f.x.confirm.token : ''}&pay=${state}`;

// khách bấm "Thanh toán bằng thẻ (VNPay)" ở phiếu xác nhận
router.post('/pay/vnpay/create', limit('paycreate', 20), async (req, res) => {
  const b = req.body || {}, lang = b.lang === 'en' ? 'en' : 'vi';
  const f = bySlip(b.code, b.k);
  if (!f) return res.status(404).json({ error: msg(req, 'Không tìm thấy phiếu', 'Confirmation not found') });
  try { res.json({ url: await startPay(req, f, 'vnpay', lang) }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

/* trả góp (VNPay): khách chọn ngân hàng → loại thẻ → kỳ hạn ở trang web, server khởi tạo giao dịch, trình duyệt POST sang VNPay.
   VNPay cần email, địa chỉ, tỉnh / thành của khách — thiếu (khách không nhập email, đăng ký khóa học không có địa chỉ) thì hỏi thêm ở bảng chọn */
const ispCustomer = f => (f.type === 'order'
  ? { name: f.x.customer.name, phone: f.x.customer.phone, email: f.x.customer.email || '', address: [f.x.customer.address, f.x.customer.ward].filter(Boolean).join(', '), city: f.x.customer.city || '' }
  : { name: f.x.name, phone: f.x.phone, email: f.x.email || '', address: f.x.ispAddress || '', city: f.x.ispCity || '' });
const ispNeed = cu => ['email', 'address', 'city'].filter(k => !cu[k]);
// kiểm tra trước khi hỏi VNPay → lời báo (theo ngôn ngữ khách) hoặc null
function ispBlock(f, L) {
  const o = payments.online(), due = owed(f.type, f.x);
  if (!o.installment || settings.all().shop.checkout.pay.installment === false) return L('Trả góp đang tạm ngưng, vui lòng chọn cách thanh toán khác', 'Installments are unavailable, please choose another payment method');
  if (!due) return f.x.paid ? L('Đơn này đã thanh toán', 'This order is already paid') : L('Không có khoản nào cần thanh toán', 'Nothing to pay');
  if (due < o.installmentMin) return L(`Trả góp áp dụng cho khoản từ ${moneyVi(o.installmentMin)}đ`, `Installments are available from ${moneyEn(o.installmentMin)}đ`);
  return null;
}
// GET /pay/installment/options?code=&k= → { amount, banks: [{ code, name, logo, schemes: [{ scheme, logo, terms: [{ n, monthly, total, fee }] }] }], need: ['email'…] }
router.get('/pay/installment/options', limit('ispopt', 30), async (req, res) => {
  const f = bySlip(req.query.code, req.query.k), L = (vi, en) => msg(req, vi, en);
  if (!f) return res.status(404).json({ error: L('Không tìm thấy phiếu', 'Confirmation not found') });
  const block = ispBlock(f, L);
  if (block) return res.status(400).json({ error: block });
  const amount = owed(f.type, f.x);
  try { res.json({ amount, banks: await payments.installmentOptions(amount), need: ispNeed(ispCustomer(f)) }); }
  catch (e) {
    console.warn('[trả góp VNPay] bảng trả góp:', e.message);
    res.status(502).json({ error: L('Chưa lấy được danh sách ngân hàng trả góp, vui lòng thử lại sau ít phút.', "Couldn't load installment options, please try again in a few minutes.") });
  }
});
// POST /pay/installment/create { code, k, issuer, scheme, term, email?, address?, city?, lang } → { action, fields } (trình duyệt POST form sang VNPay)
router.post('/pay/installment/create', limit('paycreate', 20), async (req, res) => {
  const b = req.body || {}, lang = b.lang === 'en' ? 'en' : 'vi', L = (vi, en) => (lang === 'en' ? en : vi);
  const f = bySlip(b.code, b.k);
  if (!f) return res.status(404).json({ error: L('Không tìm thấy phiếu', 'Confirmation not found') });
  const block = ispBlock(f, L);
  if (block) return res.status(400).json({ error: block });
  const issuer = str(b.issuer, 20).toUpperCase(), scheme = str(b.scheme, 20).toUpperCase(), term = int(b.term, 0, 99, 0);
  if (!/^[A-Z0-9_]{2,20}$/.test(issuer) || !/^[A-Z0-9_]{2,20}$/.test(scheme) || !payments.TERMS.includes(term))
    return res.status(400).json({ error: L('Vui lòng chọn ngân hàng, loại thẻ và kỳ hạn trả góp', 'Please choose a bank, card type and term') });
  // thông tin VNPay cần mà đơn / đăng ký chưa có
  const cu = ispCustomer(f), add = {};
  for (const k of ispNeed(cu)) add[k] = str(b[k], k === 'email' ? 120 : k === 'address' ? 200 : 80);
  if (add.email !== undefined && !EMAIL_RE.test(add.email)) return res.status(400).json({ error: L('Vui lòng nhập email đúng định dạng', 'Please enter a valid email') });
  if (add.address !== undefined && add.address.length < 5) return res.status(400).json({ error: L('Vui lòng nhập địa chỉ', 'Please enter your address') });
  if (add.city !== undefined && add.city.length < 2) return res.status(400).json({ error: L('Vui lòng nhập tỉnh / thành phố', 'Please enter your city / province') });
  Object.assign(cu, add);
  const amount = owed(f.type, f.x), code = alnum(f.x.code), ref = newRef(code), base = siteBase(req);
  let r;
  try {
    r = await payments.installmentInit({ ref, amount, info: 'Thanh toan tra gop ' + code, issuer, scheme, term, customer: cu, ip: req.ip, ua: req.get('user-agent'),
      returnUrl: base + '/api/pay/installment/return', cancelUrl: base + slipBack(f, 'cancel'), lang });
  } catch (e) {
    console.warn('[trả góp VNPay] khởi tạo', ref, e.message);
    return res.status(502).json({ error: L('Chưa tạo được giao dịch trả góp, vui lòng thử lại hoặc chọn ngân hàng / kỳ hạn khác.', "Couldn't start the installment payment, please try again or choose another bank / term.") });
  }
  // lưu lần thanh toán (IPN đối chiếu số tiền theo mã giao dịch) + thông tin khách vừa bổ sung
  const list = read(f.file, []), x = list.find(e => e.id === f.x.id);
  x.payAttempts = (x.payAttempts || []).concat({ provider: 'installment', ref, amount, at: Date.now(), isp: r.txnId, issuer, scheme, term }).slice(-10);
  if (add.email) { if (f.type === 'order') x.customer.email = add.email; else x.email = add.email; }
  if (f.type === 'registration') { if (add.address) x.ispAddress = add.address; if (add.city) x.ispCity = add.city; }
  writeFile(f.file, list);
  res.json({ action: r.action, fields: r.fields });
});

// VNPay thẻ / trả góp: khách quay về (kiểm tra chữ ký, ghi nhận nếu chưa có IPN — cùng kết quả, không ghi trùng) và IPN (máy chủ VNPay báo, nguồn chính xác nhất)
for (const kind of ['vnpay', 'installment']) {
  router.get(`/pay/${kind}/return`, (req, res) => {
    const v = payments.vnpayVerify(req.query, kind), f = v.ok ? byAlnum(refCode(v.ref)) : null;
    if (!f) return res.redirect('/');
    if (v.success) confirmPay({ provider: kind, ref: v.ref, amount: v.amount, txn: v.txn });
    res.redirect(slipBack(f, v.success ? 'ok' : v.cancel ? 'cancel' : 'fail'));
  });
  router.get(`/pay/${kind}/ipn`, (req, res) => {
    const v = payments.vnpayVerify(req.query, kind);
    if (!v.ok || !v.tmn) return res.json({ RspCode: '97', Message: 'Invalid signature' });
    const f = byAlnum(refCode(v.ref)), att = f && (f.x.payAttempts || []).find(a => a.ref === v.ref && (a.provider || 'vnpay') === kind);
    if (!att) return res.json({ RspCode: '01', Message: 'Order not found' });
    if (Math.round(att.amount) !== v.amount) return res.json({ RspCode: '04', Message: 'invalid amount' });
    if (!v.success) return res.json({ RspCode: '00', Message: 'Confirm Success' });   // giao dịch lỗi / bị hủy: đã nhận thông báo, không đổi đơn
    if (f.x.paid && (f.x.payments || []).some(p => p.provider === kind && p.txn === v.txn)) return res.json({ RspCode: '02', Message: 'Order already confirmed' });
    const r = confirmPay({ provider: kind, ref: v.ref, amount: v.amount, txn: v.txn });
    res.json(r === 'dup' ? { RspCode: '02', Message: 'Order already confirmed' } : { RspCode: '00', Message: 'Confirm Success' });
  });
}
// SePay: tài khoản ngân hàng có tiền vào → tìm mã đơn trong nội dung chuyển khoản
router.post('/pay/sepay/webhook', (req, res) => {
  if (!payments.sepayAuth(req.headers.authorization)) return res.status(401).json({ success: false });
  const b = req.body || {};
  if (b.transferType === 'in' && Number(b.transferAmount) > 0) {
    const code = payments.codeInContent(b.content, b.description, b.code);
    if (code) confirmPay({ provider: 'sepay', code, amount: Math.round(Number(b.transferAmount)), txn: b.id != null ? String(b.id) : b.referenceCode });
  }
  res.json({ success: true });   // luôn trả thành công (giao dịch không phải của web cũng vậy) để SePay không gửi lại
});
// /admin: thử cấu hình cổng (VNPay thẻ: link thử 10.000đ không gắn đơn; trả góp: đăng nhập + lấy bảng trả góp cho một số tiền mẫu)
router.post('/pay/test/:provider', adminOnly, async (req, res) => {
  const p = req.params.provider, ready = payments.ready(), base = siteBase(req);
  try {
    if (p === 'vnpay') {
      if (!ready.vnpay) return res.status(400).json({ error: 'Chưa bật / chưa nhập đủ mã website (TMN) và chuỗi bí mật VNPay.' });
      return res.json({ url: payments.vnpayUrl({ ref: newRef('TEST'), amount: 10000, info: 'Thu cau hinh Dapper Combat', ip: req.ip, returnUrl: base + '/api/pay/vnpay/return', lang: 'vi' }) });
    }
    if (p === 'installment') {
      if (!ready.installment) return res.status(400).json({ error: 'Chưa bật / chưa nhập đủ địa chỉ API, mã website (TMN), Client ID, tên đăng nhập, mật khẩu và Secret key trả góp.' });
      const amount = Math.max(5000000, payments.online().installmentMin), banks = await payments.installmentOptions(amount, true);
      return res.json({ amount, banks: banks.map(b => ({ code: b.code, name: b.name, schemes: b.schemes.map(s => s.scheme), terms: [...new Set([].concat(...b.schemes.map(s => s.terms.map(t => t.n))))].sort((a, c) => a - c) })) });
    }
    res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// /admin: gửi lại email xác nhận cho khách
for (const [name, file, kind] of [['orders', 'orders.json', 'order'], ['registrations', 'registrations.json', 'registration']]) {
  router.post(`/${name}/:id/confirm-email`, staffOk, async (req, res) => {
    let x = read(file, []).find(e => e.id === req.params.id);
    if (!x) return res.status(404).json({ error: 'Not found' });
    if (!x.confirm) x = setConfirm(file, x.id, {});
    let r;
    try { r = await notify.resend(kind, x); } catch (e) { r = { status: 'failed', at: Date.now(), error: e.message }; }
    const saved = setConfirm(file, x.id, { email: r });
    const err = { none: 'Khách không nhập email', nosmtp: 'Chưa cài SMTP ở Thiết lập → Thông báo', failed: 'Gửi lỗi: ' + (r.error || '') }[r.status];
    if (err) return res.status(400).json({ error: err, confirm: saved.confirm });
    res.json({ ok: true, confirm: saved.confirm });
  });
}
// nhật ký gửi tin
const maillog = require('../lib/maillog');
router.get('/maillog', staffOk, (req, res) => res.json(maillog.list()));
router.delete('/maillog', adminOnly, (req, res) => { maillog.clear(); res.json({ ok: true }); });

// ─── Gym setup consultations (trang Dịch vụ Setup) ─────────────────────────
const CONSULT_STATUS = ['new', 'contacted', 'surveyed', 'quoted', 'won', 'lost'];
router.post('/consults', limit('consult', 10), (req, res) => {
  const b = req.body || {};
  const c = {
    name: str(b.name, 80), phone: str(b.phone, 20), city: str(b.city, 80), note: str(b.note, 800),
    type: str(b.type, 40), area: str(b.area, 40), budget: str(b.budget, 40),
    svc: Array.isArray(b.svc) ? b.svc.slice(0, 6).map(s => str(s, 40)) : [],
    // tên lựa chọn đúng như trên trang (lựa chọn có thể sửa / thêm trong /admin)
    typeName: str(b.typeName, 80), areaName: str(b.areaName, 80), budgetName: str(b.budgetName, 80),
    svcNames: Array.isArray(b.svcNames) ? b.svcNames.slice(0, 6).map(s => str(s, 80)) : [],
    lang: b.lang === 'en' ? 'en' : 'vi',
  };
  if (c.name.length < 2) return res.status(400).json({ error: msg(req, 'Vui lòng nhập họ tên', 'Please enter your name') });
  if (!phoneOk(c.phone)) return res.status(400).json({ error: msg(req, 'Số điện thoại chưa đúng', 'Please enter a valid phone number') });
  const list = read('consults.json', []);
  const entry = { id: genId('svc'), code: makeCode('#DC-SVC-', 5, list), createdAt: Date.now(), status: 'new', ...c, adminNote: '' };
  list.unshift(entry);
  writeFile('consults.json', list);
  notify.consult(entry);
  res.status(201).json({ id: entry.id, code: entry.code });
});

// ─── Newsletter ─────────────────────────────────────────────────────────────
router.post('/subscribe', limit('sub', 10), (req, res) => {
  const email = str((req.body || {}).email, 120).toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: msg(req, 'Email chưa đúng định dạng', 'Please enter a valid email') });
  const list = read('subscribers.json', []);
  if (!list.find(s => s.email === email)) {
    list.unshift({ id: genId('sub'), email, source: str((req.body || {}).source, 30), createdAt: Date.now() });
    writeFile('subscribers.json', list);
  }
  res.status(201).json({ ok: true });
});

// ─── Admin: danh sách + cập nhật trạng thái ────────────────────────────────
/// tồn kho theo đơn: stockReturned = hàng của đơn đã cộng lại vào kho (đơn cũ chưa có cờ: đã hủy = đã trả)
const stockBack = o => (o.stockReturned !== undefined ? !!o.stockReturned : o.status === 'cancelled');

/* ─── Đã nhận tiền (đơn hàng, đăng ký khóa học) ──────────────────────────────
   paid, paidAt, paidAmount (mặc định = tổng đơn / số cần trả trước, không có thì học phí), paidNote, paidBy (email người ghi) */
const dueOf = (kind, x) => (kind === 'orders' ? Number(x.total) || 0 : Number(x.due) || Number(x.total) || 0);
function markPaid(kind, x, by, amount, note) {
  const now = Date.now();
  x.paid = true; x.paidAt = now; x.paidBy = by;
  x.paidAmount = amount != null ? amount : dueOf(kind, x);
  if (note !== undefined) x.paidNote = note;
  x.history = (x.history || []).concat({ at: now, paid: true, amount: x.paidAmount, by, ...(note ? { note } : {}) });
}
function setPaid(kind, x, b, by) {
  const amt = b.paidAmount !== undefined && b.paidAmount !== null && b.paidAmount !== '' ? int(b.paidAmount, 0, 1e10, dueOf(kind, x)) : null;
  const note = b.paidNote !== undefined ? str(b.paidNote, 300) : undefined;
  if (b.paid) {
    if (!x.paid) return markPaid(kind, x, by, amt, note);
    if (amt != null && amt !== x.paidAmount) { x.history = (x.history || []).concat({ at: Date.now(), paid: true, amount: amt, by, note: 'Sửa số tiền đã nhận' }); x.paidAmount = amt; }
    if (note !== undefined) x.paidNote = note;
  } else if (x.paid) {
    x.paid = false; delete x.paidAt; delete x.paidAmount; delete x.paidBy;
    x.paidNote = note !== undefined ? note : '';
    x.history = (x.history || []).concat({ at: Date.now(), paid: false, by });
  } else if (note !== undefined) x.paidNote = note;
}

/* ─── Hội viên: đăng ký "Đã xếp lớp" có ngày bắt đầu tập / ngày hết hạn (YYYY-MM-DD) ─── */
const okDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !isNaN(Date.parse(s));
function addMonths(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, d));
  if (dt.getUTCDate() !== d) dt.setUTCDate(0); // 31/01 + 1 tháng → ngày cuối tháng 2
  return dt.toISOString().slice(0, 10);
}
function addDays(ymd, n) { const d = new Date(ymd + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
// số tháng của gói: Group Training theo gói đã chọn, lớp HSSV theo số tháng mỗi khóa, Membership 1 tháng; còn lại (Foundation, PT, học thử) để trống — tự nhập
function memberMonths(r) {
  if (r.program === 'gt') return int(r.pkg, 0, 60, 0);
  if (r.program === 'hssv') return settings.all().course.hssvMonths || 0;
  if (r.program === 'mem') return 1;
  return 0;
}
function memberDates(r) {
  if (!okDate(r.startDate)) r.startDate = okDate(r.date) && r.date > vnToday() ? r.date : vnToday();
  if (!okDate(r.endDate)) { const n = memberMonths(r); if (n) r.endDate = addMonths(r.startDate, n); }
}
const ymdVi = s => (okDate(s) ? s.split('-').reverse().join('/') : '—');

function adminCollection(name, file, statuses) {
  router.get('/' + name, staffOk, (req, res) => res.json(read(file, [])));
  router.put('/' + name + '/:id', staffOk, (req, res) => {
    const list = read(file, []);
    const i = list.findIndex(x => x.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: 'Not found' });
    const b = req.body || {}, o = list[i], by = req.user.email;
    let moved = false;
    if (statuses && b.status !== undefined) {
      if (!statuses.includes(b.status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
      if (b.status !== o.status) {
        if (name === 'orders') {
          if (b.status === 'cancelled' && !stockBack(o)) { applyNeed(needOf(o.items), +1); o.stockReturned = true; } // hủy → trả hàng về kho (1 lần)
          else if (b.status !== 'cancelled' && stockBack(o)) {
            // mở lại đơn đã hủy → trừ kho lại; không đủ hàng thì báo để cập nhật tồn kho trước
            const short = shortages(products(), needOf(o.items));
            if (short.length) return res.status(409).json({ error: 'Không đủ hàng để mở lại đơn: ' + shortText(short) + '. Cập nhật tồn kho ở mục Sản phẩm trước.' });
            applyNeed(needOf(o.items), -1); o.stockReturned = false;
          }
          // lượt dùng mã giảm giá: hủy → trả lại 1 lượt; mở lại đơn đã trả lượt → tính lại
          if (b.status === 'cancelled') promoCount(o, -1);
          else if (o.status === 'cancelled' && o.promoCounted === false) promoCount(o, +1);
        }
        o.status = b.status; moved = true;
        o.history = (o.history || []).concat({ at: Date.now(), status: b.status, by });
        if (name === 'registrations' && b.status === 'enrolled') memberDates(o);
      }
    }
    if ((name === 'orders' || name === 'registrations') && (b.paid !== undefined || b.paidNote !== undefined || b.paidAmount !== undefined)) {
      setPaid(name, o, { paid: b.paid !== undefined ? !!b.paid : !!o.paid, paidAmount: b.paidAmount, paidNote: b.paidNote }, by);
    }
    // tự ghi đã nhận tiền: đơn tiền mặt chuyển sang Hoàn tất; đăng ký chuyển sang "Đã thanh toán"
    if (moved && b.paid === undefined && !o.paid) {
      if (name === 'orders' && o.status === 'done' && o.pay === 'cash') markPaid('orders', o, by, null, 'Tự ghi: đơn tiền mặt hoàn tất');
      if (name === 'registrations' && o.status === 'paid' && dueOf('registrations', o) > 0) markPaid('registrations', o, by, null, 'Tự ghi: chuyển sang “Đã thanh toán”');
    }
    if (name === 'orders') {
      if (b.carrier !== undefined) o.carrier = str(b.carrier, 60);
      if (b.trackingCode !== undefined) o.trackingCode = str(b.trackingCode, 60);
    }
    if (b.adminNote !== undefined) o.adminNote = str(b.adminNote, 1000);
    if (name !== 'subscribers') { o.updatedAt = Date.now(); o.updatedBy = by; }
    writeFile(file, list);
    res.json(o);
  });
  // xóa: chỉ admin
  router.delete('/' + name + '/:id', adminOnly, (req, res) => {
    const list = read(file, []), o = list.find(x => x.id === req.params.id);
    if (!o) return res.status(404).json({ error: 'Not found' });
    // xóa đơn chưa giao (mới / đã xác nhận) → trả hàng về kho + trả lượt mã giảm giá; đơn đang giao / hoàn tất thì hàng đã rời kho
    const open = name === 'orders' && !['shipping', 'done'].includes(o.status);
    const restock = open && !stockBack(o);
    if (restock) applyNeed(needOf(o.items), +1);
    if (open) promoCount(o, -1);
    writeFile(file, list.filter(x => x.id !== o.id));
    res.json({ ok: true, restocked: restock });
  });
}
adminCollection('orders', 'orders.json', ORDER_STATUS);
adminCollection('registrations', 'registrations.json', REG_STATUS);
adminCollection('consults', 'consults.json', CONSULT_STATUS);
adminCollection('subscribers', 'subscribers.json', null);

/* ─── Sửa đơn / tạo đơn thủ công (nhân viên) ─────────────────────────────────── */
const SOURCES = { phone: 'Điện thoại', facebook: 'Facebook', zalo: 'Zalo', walkin: 'Tại phòng tập', other: 'Khác' };
const SHIPS = ['std', 'exp', 'pickup'];
const SHIP_VI = { std: 'Tiêu chuẩn', exp: 'Hỏa tốc', pickup: 'Nhận tại phòng tập' };
const PAY_VI = { bank: 'Chuyển khoản', momo: 'MoMo', zalopay: 'ZaloPay', vnpay: 'Thẻ (VNPay)', installment: 'Trả góp (VNPay)', cash: 'Tiền mặt' };
const vnd = n => moneyVi(n) + '₫';
// khách do nhân viên nhập: bắt buộc tên + SĐT (khách mua tại phòng tập không cần địa chỉ)
function staffCustomer(c, base = {}) {
  c = c && typeof c === 'object' ? c : {};
  const pick = (k, max) => (c[k] !== undefined ? str(c[k], max) : str(base[k], max));
  const out = { name: pick('name', 80), phone: pick('phone', 20), email: pick('email', 120), address: pick('address', 200), ward: pick('ward', 80), city: pick('city', 80), note: pick('note', 500) };
  if (out.name.length < 2) return { error: 'Nhập họ tên khách (ít nhất 2 ký tự).' };
  if (!phoneOk(out.phone)) return { error: 'Số điện thoại chưa đúng (10 số, bắt đầu bằng 0 hoặc +84).' };
  if (out.email && !EMAIL_RE.test(out.email)) return { error: 'Email chưa đúng định dạng.' };
  return { customer: out };
}
// dòng hàng do nhân viên nhập: sản phẩm đã có trong đơn giữ giá lúc đặt; sản phẩm mới lấy giá hiện tại (kể cả sản phẩm đang ẩn);
// sản phẩm đã xóa khỏi mục Sản phẩm chỉ giữ / đổi số lượng / bỏ được
function staffItems(raw, old) {
  const catalog = products(), items = [];
  old = Array.isArray(old) ? old : [];
  for (const it of (Array.isArray(raw) ? raw.slice(0, 60) : [])) {
    if (!it || !it.id) continue;
    const p = catalog.find(x => x.id === it.id), was = old.filter(x => x.id === it.id);
    const exact = was.find(x => x.size === it.size && x.color === it.color);
    if (!p && !exact) return { error: 'Không tìm thấy sản phẩm "' + str(it.name || it.id, 80) + '" — có thể đã bị xóa khỏi mục Sản phẩm.' };
    const qty = int(it.qty, 1, 999, 1);
    let line;
    if (p) {
      // size / màu đã bỏ khỏi sản phẩm nhưng dòng cũ đang dùng → giữ nguyên như lúc đặt
      const size = p.sizes.includes(it.size) ? it.size : exact ? exact.size : p.sizes[0];
      const pc = p.colors.find(c => c[0] === it.color), keep = !pc && exact && exact.color === it.color;
      const color = pc ? pc[0] : keep ? exact.color : p.colors[0][0];
      const colorName = pc ? pc[2] || '' : keep ? exact.colorName || '' : p.colors[0][2] || '';
      line = { id: p.id, name: was.length ? was[0].name : p.name, img: was.length ? was[0].img : p.img, size, color, ...(colorName ? { colorName } : {}), price: was.length ? was[0].price : p.price };
    } else line = { id: exact.id, name: exact.name, img: exact.img, size: exact.size, color: exact.color, ...(exact.colorName ? { colorName: exact.colorName } : {}), price: exact.price };
    const same = items.find(x => x.id === line.id && x.size === line.size && x.color === line.color);
    if (same) { same.qty += qty; same.line = same.qty * same.price; continue; }
    items.push({ ...line, qty, line: line.price * qty });
  }
  if (!items.length) return { error: 'Đơn cần ít nhất 1 sản phẩm.' };
  return { items };
}
// phí giao và giảm giá do nhân viên nhập (số tiền cụ thể); tổng = tạm tính − giảm giá + phí giao
function staffTotals(items, b, base = {}) {
  const subtotal = items.reduce((s, x) => s + x.line, 0);
  const discount = Math.min(subtotal, b.discount !== undefined ? int(b.discount, 0, 1e10, 0) : Number(base.discount) || 0);
  const shipping = b.shipping !== undefined ? int(b.shipping, 0, 1e9, 0) : Number(base.shipping) || 0;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}
const lineName = it => {
  const opts = [it.size, it.colorName || (COLOR_NAMES[it.color] || [])[0] || it.color].filter(Boolean);
  return '“' + it.name + '”' + (opts.length ? ' (' + opts.join(', ') + ')' : '');
};
function itemChanges(oldItems, newItems) {
  const key = it => it.id + '|' + it.size + '|' + it.color, out = [];
  const o = new Map(oldItems.map(it => [key(it), it])), n = new Map(newItems.map(it => [key(it), it]));
  for (const [k, it] of o) { const m = n.get(k); if (!m) out.push('bỏ ' + lineName(it) + ' ×' + it.qty); else if (m.qty !== it.qty) out.push(lineName(it) + ' SL ' + it.qty + ' → ' + m.qty); }
  for (const [k, it] of n) if (!o.has(k)) out.push('thêm ' + lineName(it) + ' ×' + it.qty);
  return out;
}
// PUT /orders/:id/edit { customer, items:[{id,size,color,qty}], shipping, discount, pay, ship, carrier, trackingCode, reason }
router.put('/orders/:id/edit', staffOk, (req, res) => {
  const orders = read('orders.json', []), o = orders.find(x => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {}, by = req.user.email;
  const cu = staffCustomer(b.customer, o.customer);
  if (cu.error) return res.status(400).json({ error: cu.error });
  const it = b.items !== undefined ? staffItems(b.items, o.items) : { items: o.items || [] };
  if (it.error) return res.status(400).json({ error: it.error });
  const t = staffTotals(it.items, b, o);
  const pay = STAFF_PAY.includes(b.pay) ? b.pay : o.pay, ship = SHIPS.includes(b.ship) ? b.ship : o.ship;
  const carrier = b.carrier !== undefined ? str(b.carrier, 60) : o.carrier || '', tracking = b.trackingCode !== undefined ? str(b.trackingCode, 60) : o.trackingCode || '';
  const changes = [], oc = o.customer || {};
  const CF = { name: 'tên', phone: 'SĐT', email: 'email', address: 'địa chỉ', ward: 'phường/xã', city: 'tỉnh/TP', note: 'ghi chú của khách' };
  const cc = Object.keys(CF).filter(k => (oc[k] || '') !== cu.customer[k]);
  if (cc.length) changes.push('sửa ' + cc.map(k => CF[k]).join(', ') + ' của khách');
  changes.push(...itemChanges(o.items || [], it.items));
  if (t.shipping !== (Number(o.shipping) || 0)) changes.push('phí giao ' + vnd(o.shipping) + ' → ' + vnd(t.shipping));
  if (t.discount !== (Number(o.discount) || 0)) changes.push('giảm giá ' + vnd(o.discount) + ' → ' + vnd(t.discount));
  if (pay !== o.pay) changes.push('thanh toán ' + (PAY_VI[o.pay] || o.pay || '—') + ' → ' + PAY_VI[pay]);
  if (ship !== o.ship) changes.push('giao hàng ' + (SHIP_VI[o.ship] || o.ship || '—') + ' → ' + SHIP_VI[ship]);
  if (carrier !== (o.carrier || '')) changes.push('đơn vị vận chuyển: ' + (carrier || '—'));
  if (tracking !== (o.trackingCode || '')) changes.push('mã vận đơn: ' + (tracking || '—'));
  if (!changes.length) return res.status(400).json({ error: 'Không có thay đổi nào để lưu.' });
  // tồn kho: chỉ điều chỉnh khi hàng của đơn đang được trừ khỏi kho (đơn chưa hủy)
  if (!stockBack(o)) {
    const delta = needDiff(needOf(it.items), needOf(o.items)), catalog = products();
    const short = shortages(catalog, delta);
    if (short.length) return res.status(409).json({ error: 'Không đủ hàng: ' + shortText(short, 'cần thêm') + '. Bớt số lượng hoặc cập nhật tồn kho ở mục Sản phẩm trước.' });
    if (Object.keys(delta).length) applyNeed(delta, -1, catalog);
  }
  const reason = str(b.reason, 200);
  Object.assign(o, { customer: cu.customer, items: it.items, ...t, pay, ship, carrier, trackingCode: tracking });
  o.history = (o.history || []).concat({ at: Date.now(), edit: true, by, note: ('Sửa đơn: ' + changes.join('; ') + (reason ? ' — ' + reason : '')).slice(0, 1000) });
  o.updatedAt = Date.now(); o.updatedBy = by;
  writeFile('orders.json', orders);
  res.json(o);
});
// POST /admin/orders — đơn bán qua điện thoại / Facebook / Zalo / tại phòng tập. Trừ kho, có phiếu xác nhận, không báo Telegram / email cho chủ shop
// { customer, items, shipping, discount, pay, ship, source, status, paid, paidAmount, paidNote, carrier, trackingCode, adminNote, sendEmail }
router.post('/admin/orders', staffOk, async (req, res) => {
  const b = req.body || {}, by = req.user.email;
  const cu = staffCustomer(b.customer);
  if (cu.error) return res.status(400).json({ error: cu.error });
  const it = staffItems(b.items, []);
  if (it.error) return res.status(400).json({ error: it.error });
  const catalog = products(), need = needOf(it.items), short = shortages(catalog, need);
  if (short.length) return res.status(409).json({ error: 'Không đủ hàng: ' + shortText(short) + '. Bớt số lượng hoặc cập nhật tồn kho ở mục Sản phẩm trước.' });
  const status = ['new', 'confirmed', 'shipping', 'done'].includes(b.status) ? b.status : 'confirmed';
  const source = SOURCES[b.source] ? b.source : 'other';
  const orders = read('orders.json', []), now = Date.now();
  const order = {
    id: genId('ord'), code: makeCode('#DC-', 6, orders), createdAt: now, status, customer: cu.customer,
    pay: STAFF_PAY.includes(b.pay) ? b.pay : 'cash', ship: SHIPS.includes(b.ship) ? b.ship : 'std', lang: 'vi',
    items: it.items, ...staffTotals(it.items, b), promo: '', source, createdBy: by,
    carrier: str(b.carrier, 60), trackingCode: str(b.trackingCode, 60), adminNote: str(b.adminNote, 1000),
    history: [{ at: now, status, by, note: 'Tạo đơn thủ công · ' + SOURCES[source] }], confirm: newConfirm(), stockReturned: false,
  };
  if (b.paid) markPaid('orders', order, by, b.paidAmount !== undefined && b.paidAmount !== null && b.paidAmount !== '' ? int(b.paidAmount, 0, 1e10, order.total) : null, str(b.paidNote, 300) || undefined);
  else if (status === 'done' && order.pay === 'cash') markPaid('orders', order, by, null, 'Tự ghi: đơn tiền mặt hoàn tất');
  applyNeed(need, -1, catalog);
  const send = !!b.sendEmail && !!order.customer.email;
  // không gửi email: 'skip' = đơn tạo tay, nhân viên chọn không gửi; 'none' = khách không có email
  order.confirm.email = { status: send ? 'pending' : order.customer.email ? 'skip' : 'none' };
  orders.unshift(order);
  writeFile('orders.json', orders);
  if (send) {
    let r;
    try { r = await notify.resend('order', order); } catch (e) { r = { status: 'failed', at: Date.now(), error: e.message }; }
    const saved = setConfirm('orders.json', order.id, { email: r });
    if (saved) order.confirm = saved.confirm;
  }
  res.status(201).json(order);
});

// PUT /registrations/:id/edit { name, phone, email, detail, pkg, opt, date, note, total, due, startDate, endDate, reason }
router.put('/registrations/:id/edit', staffOk, (req, res) => {
  const list = read('registrations.json', []), r = list.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {}, by = req.user.email, next = {};
  const S = (k, max) => { if (b[k] !== undefined) next[k] = str(b[k], max); };
  S('name', 80); S('phone', 20); S('email', 120); S('detail', 200); S('pkg', 10); S('opt', 10); S('date', 20); S('note', 500);
  for (const k of ['total', 'due']) if (b[k] !== undefined) next[k] = int(b[k], 0, 1e10, 0);
  for (const k of ['startDate', 'endDate']) if (b[k] !== undefined) {
    const v = str(b[k], 10);
    if (v && !okDate(v)) return res.status(400).json({ error: 'Ngày không hợp lệ (cần dạng năm-tháng-ngày).' });
    next[k] = v;
  }
  const m = { ...r, ...next };
  if (String(m.name || '').length < 2) return res.status(400).json({ error: 'Nhập họ tên học viên (ít nhất 2 ký tự).' });
  if (!phoneOk(m.phone)) return res.status(400).json({ error: 'Số điện thoại chưa đúng (10 số, bắt đầu bằng 0 hoặc +84).' });
  if (m.email && !EMAIL_RE.test(m.email)) return res.status(400).json({ error: 'Email chưa đúng định dạng.' });
  if ((m.due || 0) > (m.total || 0)) return res.status(400).json({ error: 'Số tiền cần trả trước không được lớn hơn tổng học phí.' });
  if (m.startDate && m.endDate && m.endDate < m.startDate) return res.status(400).json({ error: 'Ngày hết hạn phải sau ngày bắt đầu tập.' });
  const L = { name: 'tên', phone: 'SĐT', email: 'email', detail: 'chi tiết', pkg: 'gói', opt: 'lớp / ca', date: 'ngày muốn bắt đầu', note: 'ghi chú',
    total: 'học phí', due: 'cần trả trước', startDate: 'ngày bắt đầu tập', endDate: 'ngày hết hạn' };
  const changes = Object.keys(next).filter(k => (k === 'total' || k === 'due' ? (Number(r[k]) || 0) !== next[k] : String(r[k] == null ? '' : r[k]) !== next[k])).map(k =>
    k === 'total' || k === 'due' ? L[k] + ' ' + vnd(r[k]) + ' → ' + vnd(next[k]) : k === 'startDate' || k === 'endDate' ? L[k] + ' ' + ymdVi(r[k]) + ' → ' + ymdVi(next[k]) : L[k]);
  if (!changes.length) return res.status(400).json({ error: 'Không có thay đổi nào để lưu.' });
  Object.assign(r, next);
  const reason = str(b.reason, 200);
  r.history = (r.history || []).concat({ at: Date.now(), edit: true, by, note: ('Sửa ' + changes.join('; ') + (reason ? ' — ' + reason : '')).slice(0, 1000) });
  r.updatedAt = Date.now(); r.updatedBy = by;
  writeFile('registrations.json', list);
  res.json(r);
});

// ─── Tiếng Anh tự dịch bằng AI (lib/translate.js) ───────────────────────────
router.get('/translate/status', staffOk, (req, res) => res.json(translate.status()));
// dịch mọi chỗ còn thiếu tiếng Anh; wait=1: chờ dịch xong mới trả lời (tối đa 2 phút)
router.post('/translate/run', adminOnly, async (req, res) => {
  if (!translate.enabled()) return res.status(400).json({ error: 'Chưa bật dịch tự động hoặc chưa có khóa API.' });
  for (const k of ['cms', 'product', 'settings', 'page']) translate.queue(k, null);
  if ((req.body || {}).wait) await translate.idle(120000);
  res.json(translate.status());
});
router.post('/translate/test', adminOnly, limit('aitest', 10), async (req, res) => res.json(await translate.test()));

// kênh báo đơn mới (Telegram / email cấu hình trong .env)
router.get('/notify/status', adminOnly, (req, res) => res.json({ ...notify.channels(), vars: notify.vars }));
// gửi thử: { kind: 'order' | 'registration' | 'consult', customer: true = mẫu email gửi khách (tới email nhận thông báo của shop) }
router.post('/notify/test', adminOnly, limit('notifytest', 10), async (req, res) => {
  const ch = notify.channels(), b = req.body || {};
  if (b.customer) {
    if (!ch.email) return res.status(400).json({ error: 'Cần cài SMTP và "Email nhận thông báo" trước — email thử sẽ gửi tới địa chỉ đó.' });
  } else if (!ch.telegram && !ch.email) return res.status(400).json({ error: 'Chưa cài kênh nào. Điền Telegram hoặc SMTP ở mục Thiết lập → Thông báo.' });
  try { res.json(await notify.test(String(b.kind || ''), !!b.customer)); }
  catch (e) { res.status(500).json({ error: 'Gửi thử lỗi: ' + e.message }); }
});
// xem trước mẫu tin với dữ liệu mẫu (không gửi)
router.post('/notify/preview', adminOnly, (req, res) => {
  const b = req.body || {};
  res.json(notify.preview(String(b.kind || ''), String(b.title || b.subject || '').slice(0, 200), String(b.body || '').slice(0, 4000)));
});

router.get('/stats', staffOk, (req, res) => {
  const orders = read('orders.json', []), regs = read('registrations.json', []), cons = read('consults.json', []);
  const live = orders.filter(o => o.status !== 'cancelled');
  const since = Date.now() - 30 * 864e5;
  // tiền đã thu (theo ngày ghi nhận tiền) / chờ thu: đơn chưa nhận tiền, đăng ký còn phải trả (đều chưa hủy)
  const paidSum = (l, from) => l.filter(x => x.paid && (!from || (Number(x.paidAt) || 0) >= from)).reduce((s, x) => s + (Number(x.paidAmount) || 0), 0);
  const waitO = orders.filter(o => !o.paid && o.status !== 'cancelled');
  const waitR = regs.filter(r => !r.paid && r.status !== 'cancelled' && dueOf('registrations', r) > 0);
  const today = vnToday(), soon = addDays(today, 7), mem = regs.filter(r => r.status === 'enrolled');
  res.json({
    orders: { total: orders.length, new: orders.filter(o => o.status === 'new').length, revenue: live.reduce((s, o) => s + (o.total || 0), 0), revenue30: live.filter(o => o.createdAt >= since).reduce((s, o) => s + (o.total || 0), 0) },
    registrations: { total: regs.length, new: regs.filter(r => r.status === 'new').length },
    consults: { total: cons.length, new: cons.filter(c => c.status === 'new').length },
    subscribers: read('subscribers.json', []).length,
    lowStock: products().filter(p => p.visible !== false && p.stock <= settings.all().shop.lowStock).map(p => ({ id: p.id, name: p.name, stock: p.stock })),
    money: {
      collected: paidSum(orders) + paidSum(regs), collected30: paidSum(orders, since) + paidSum(regs, since),
      orders: { collected: paidSum(orders), collected30: paidSum(orders, since) },
      registrations: { collected: paidSum(regs), collected30: paidSum(regs, since) },
      pending: waitO.reduce((s, o) => s + (Number(o.total) || 0), 0) + waitR.reduce((s, r) => s + dueOf('registrations', r), 0),
      pendingCount: waitO.length + waitR.length, pendingOrders: waitO.length, pendingRegs: waitR.length,
    },
    members: {
      total: mem.length, active: mem.filter(r => !r.endDate || r.endDate >= today).length,
      expiring: mem.filter(r => r.endDate && r.endDate >= today && r.endDate <= soon).length, expired: mem.filter(r => r.endDate && r.endDate < today).length,
    },
  });
});

/* ─── Sao lưu & khôi phục (chỉ admin) ──────────────────────────────────────────
   Một file JSON gồm mọi data/*.json (kể cả tài khoản — chỉ có mã băm mật khẩu). Ảnh / video tải lên (public/assets/uploads) KHÔNG nằm trong file. */
const dataFiles = () => fs.readdirSync(DATA_DIR).filter(f => /^[\w-][\w.-]*\.json$/.test(f) && fs.statSync(path.join(DATA_DIR, f)).isFile());
const stampOf = (t = Date.now()) => new Date(t + 7 * 3600e3).toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
router.get('/backup', adminOnly, (req, res) => {
  const files = {};
  for (const f of dataFiles()) { try { files[f] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); } catch (e) { console.warn('[sao lưu] bỏ qua ' + f + ': ' + e.message); } }
  res.setHeader('Content-Disposition', `attachment; filename="dapper-combat-sao-luu-${stampOf()}.json"`);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ app: 'dapper-combat', version: 1, createdAt: Date.now(), createdBy: req.user.email, files });
});
const LIST_FILES = ['orders.json', 'registrations.json', 'consults.json', 'subscribers.json', 'products.json', 'users.json', 'pages.json', 'maillog.json', 'fighters.json', 'events.json'];
const OBJ_FILES = ['settings.json', 'cms.json', 'promo-usage.json'];
const FILE_VI = { 'orders.json': 'đơn hàng', 'registrations.json': 'đăng ký khóa học', 'consults.json': 'yêu cầu tư vấn', 'subscribers.json': 'người nhận tin', 'products.json': 'sản phẩm',
  'users.json': 'tài khoản', 'pages.json': 'trang phụ', 'maillog.json': 'nhật ký gửi tin', 'settings.json': 'thiết lập', 'cms.json': 'nội dung website', 'promo-usage.json': 'lượt dùng mã giảm giá',
  'fighters.json': 'võ sĩ (xếp hạng CLB)', 'events.json': 'sự kiện (xếp hạng CLB)' };
router.post('/backup/restore', adminOnly, express.json({ limit: '200mb' }), (req, res) => {
  const b = req.body || {}, bad = m => res.status(400).json({ error: m });
  if (b.app !== 'dapper-combat' || b.version !== 1 || !b.files || typeof b.files !== 'object' || Array.isArray(b.files)) return bad('File này không phải bản sao lưu của Dapper Combat (hoặc đã bị hỏng).');
  const names = Object.keys(b.files);
  if (!names.length) return bad('Bản sao lưu không có dữ liệu.');
  for (const n of names) {
    const v = b.files[n];
    if (!/^[\w-][\w.-]*\.json$/.test(n) || n.includes('..')) return bad('Tên file không hợp lệ trong bản sao lưu: ' + n);
    if (v === null || typeof v !== 'object') return bad('Dữ liệu ' + (FILE_VI[n] || n) + ' bị hỏng.');
    if (LIST_FILES.includes(n) && !Array.isArray(v)) return bad('Dữ liệu ' + FILE_VI[n] + ' bị hỏng (cần là danh sách).');
    if (OBJ_FILES.includes(n) && Array.isArray(v)) return bad('Dữ liệu ' + FILE_VI[n] + ' bị hỏng.');
  }
  for (const n of ['orders.json', 'registrations.json', 'consults.json', 'products.json']) {
    if (b.files[n] && b.files[n].some(x => !x || typeof x !== 'object' || !x.id)) return bad('Dữ liệu ' + FILE_VI[n] + ' bị hỏng (thiếu mã).');
  }
  const us = b.files['users.json'];
  if (us) {
    if (us.some(u => !u || typeof u.id !== 'string' || typeof u.email !== 'string' || typeof u.password !== 'string')) return bad('Dữ liệu tài khoản bị hỏng.');
    if (!us.some(u => u.role === 'admin')) return bad('Bản sao lưu không có tài khoản admin nào — không khôi phục để tránh bị khóa khỏi trang quản trị.');
  }
  // cất bản hiện tại trước khi ghi đè
  const dir = 'truoc-khoi-phuc-' + stampOf() + '-' + crypto.randomBytes(2).toString('hex');
  fs.mkdirSync(path.join(DATA_DIR, dir), { recursive: true });
  for (const f of dataFiles()) fs.copyFileSync(path.join(DATA_DIR, f), path.join(DATA_DIR, dir, f));
  for (const n of names) writeFile(n, b.files[n]); // khóa đăng nhập (data/.jwt-secret) giữ nguyên, không nằm trong bản sao lưu
  res.json({
    ok: true, savedTo: 'data/' + dir, createdAt: Number(b.createdAt) || null,
    restored: names.map(n => ({ file: n, label: FILE_VI[n] || n, count: Array.isArray(b.files[n]) ? b.files[n].length : null })),
  });
});

// ─── Bảng xếp hạng CLB (võ sĩ, sự kiện, kết quả) — routes/ranking.js ─────────
require('./ranking')(router, { adminOnly, staffOk });

module.exports = router;
