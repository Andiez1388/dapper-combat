const express = require('express');
const fs      = require('fs');
const path    = require('path');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dapper-combat-dev-secret';
const DATA_DIR   = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── File DB ───────────────────────────────────────────────────────────────
function read(file, def) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) { writeFile(file, def); return JSON.parse(JSON.stringify(def)); }
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return JSON.parse(JSON.stringify(def)); }
}
function writeFile(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// ─── Default Data ──────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  siteName: 'DAPPER COMBAT',
  tagline: 'PIONEERING THE FIGHT LIFESTYLE',
  heroHeadline: 'FIGHT YOUR\nBEST FIGHT',
  heroSubtext: 'Premium training gear & knowledge for serious fighters',
  heroMedia: '', heroMediaType: 'image',
  logoMark: '', logoFull: '', faviconUrl: '',
  colors: { bg:'#ffffff', bgSecondary:'#f5f5f5', bgCard:'#eeeeee', text:'#0d0d0d', textMuted:'#666666', accent:'#b8960c', accentRed:'#c0392b', border:'#dedede', btnText:'#ffffff' },
  fonts: { heading:"'Bebas Neue', Impact, 'Arial Narrow', sans-serif", body:"'Inter', 'Helvetica Neue', Arial, sans-serif" },
  layout: { btnRadius:'0px', cardRadius:'0px', navHeight:'64px' },
  nav: { items: [{ id:'home', label:'HOME', visible:true },{ id:'shop', label:'SHOP', visible:true },{ id:'courses', label:'COURSES', visible:true },{ id:'account', label:'ACCOUNT', visible:true }] },
  payment: { stripe:{enabled:false,publicKey:''}, paypal:{enabled:false,clientId:''}, vnpay:{enabled:false,merchantId:'',hashSecret:''}, momo:{enabled:false,partnerCode:''} },
  sections: { heroVisible:true, featuredVisible:true, categoriesVisible:true, coursePromoVisible:true, newsletterVisible:true },
  seo: { title:'DAPPER COMBAT', description:'', keywords:'' },
  adminEmail: '',
  sizeChartUrl: '',
  deliveryPolicy: 'Free shipping on orders over 1,500,000 VND. Standard delivery 3-5 business days. Express delivery available. Returns accepted within 14 days of purchase in original condition.',
};

const DEFAULT_PRODUCTS = [
  { id:'p1', name:'Combat Training Tee', category:'apparel', price:850000, originalPrice:1200000, sizes:['S','M','L','XL','XXL'], colors:['BLACK','WHITE','RED'], images:[''], description:'Lightweight performance tee engineered for maximum movement during training sessions.', stock:50, featured:true, badge:'BEST SELLER', visible:true },
  { id:'p2', name:'Pro Boxing Shorts', category:'apparel', price:1200000, originalPrice:null, sizes:['S','M','L','XL'], colors:['BLACK','NAVY'], images:[''], description:'Satin finish shorts with elastic waistband, side slits for full range of motion.', stock:30, featured:true, badge:'NEW', visible:true },
  { id:'p3', name:'Fighter Hoodie', category:'apparel', price:1900000, originalPrice:2500000, sizes:['S','M','L','XL','XXL'], colors:['BLACK','CHARCOAL'], images:[''], description:'Oversized heavy-weight hoodie with embroidered logo.', stock:25, featured:true, badge:'', visible:true },
  { id:'p4', name:'Pro Boxing Gloves 12oz', category:'equipment', price:2800000, originalPrice:null, sizes:['10oz','12oz','14oz','16oz'], colors:['BLACK','RED'], images:[''], description:'Triple-density foam padding with pre-curved design for a natural fist position.', stock:20, featured:true, badge:'NEW', visible:true },
  { id:'p5', name:'Hand Wraps (2 Pack)', category:'equipment', price:380000, originalPrice:null, sizes:['4.5m','5m'], colors:['BLACK','WHITE','RED'], images:[''], description:'4.5m semi-elastic wraps with thumb loop and velcro closure.', stock:100, featured:false, badge:'', visible:true },
  { id:'p6', name:'Track Jacket', category:'apparel', price:2200000, originalPrice:null, sizes:['S','M','L','XL'], colors:['BLACK','WHITE'], images:[''], description:'Retro-inspired track jacket with contrast piping and zip pockets.', stock:15, featured:false, badge:'', visible:true },
  { id:'p7', name:'Pro MMA Gloves', category:'gloves', price:1600000, originalPrice:2000000, sizes:['S/M','L/XL'], colors:['BLACK','RED'], images:[''], description:'Open-palm MMA gloves with 7oz foam padding. Ideal for sparring and bag work.', stock:40, featured:true, badge:'NEW', visible:true },
  { id:'p8', name:'Boxing Gloves 10oz', category:'gloves', price:2200000, originalPrice:null, sizes:['10oz','12oz','14oz','16oz'], colors:['BLACK','RED','WHITE'], images:[''], description:'Genuine leather boxing gloves with multi-layer foam. Professional grade.', stock:35, featured:true, badge:'BEST SELLER', visible:true },
  { id:'p9', name:'Training Mitts', category:'gloves', price:1100000, originalPrice:null, sizes:['One Size'], colors:['BLACK','RED'], images:[''], description:'Hook-and-loop focus mitts for precision target training with coaches.', stock:28, featured:false, badge:'', visible:true },
];

const DEFAULT_COURSES = [
  { id:'c1', title:'Boxing Fundamentals', instructor:'Coach Marcus', price:1500000, thumbnail:'', description:'Master the basics: stance, guard, footwork, and the fundamental punches.', lessons:['Introduction to Boxing','Stance & Footwork','The Jab','The Cross','Hooks & Uppercuts','Defense Basics'], duration:'6 weeks', level:'Beginner', students:234, visible:true, featured:true },
  { id:'c2', title:'Advanced Combinations', instructor:'Coach Sarah', price:2200000, thumbnail:'', description:'String together powerful combinations and learn ring generalship.', lessons:['1-2-3 Combos','Body Work','Countering','Pressure Fighting','Ring Generalship','Sparring Prep'], duration:'8 weeks', level:'Intermediate', students:156, visible:true, featured:true },
  { id:'c3', title:'Fighter Conditioning', instructor:'Coach Alex', price:1800000, thumbnail:'', description:'Elite fight conditioning: strength, cardio, speed, and recovery protocols.', lessons:['Conditioning Assessment','Roadwork & Cardio','Strength Training','Speed & Agility','Recovery Methods','Fight Week Prep'], duration:'12 weeks', level:'All Levels', students:412, visible:true, featured:false },
];

function hashPw(pw) { return crypto.createHash('sha256').update(pw + 'dc_salt_2024').digest('hex'); }
function genId(pre='x') { return pre + Math.random().toString(36).slice(2,9); }
function makeToken(user) { return jwt.sign({ id:user.id, email:user.email, role:user.role }, JWT_SECRET, { expiresIn:'30d' }); }

// Seed default admin on first run
function ensureAdmin() {
  const users = read('users.json', []);
  if (!users.find(u => u.email === 'admin@dappercombat.com')) {
    users.push({ id:'admin', name:'Admin', email:'admin@dappercombat.com', password:hashPw('admin123'), role:'admin', createdAt:Date.now(), enrolledCourses:[], orders:[] });
    writeFile('users.json', users);
  }
}
ensureAdmin();

// ─── Auth Middleware ────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}
function adminOnly(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    next();
  });
}

// ─── Auth Routes ────────────────────────────────────────────────────────────
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = read('users.json', []);
  const user = users.find(u => u.email === email && u.password === hashPw(password));
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const { password: _, ...safe } = user;
  res.json({ token: makeToken(user), user: safe });
});

router.post('/auth/register', (req, res) => {
  const { name, email, password, role = 'customer' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const users = read('users.json', []);
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const user = { id: genId('u'), name, email, password: hashPw(password), role: role === 'admin' ? 'customer' : role, createdAt: Date.now(), enrolledCourses: [], orders: [] };
  users.push(user);
  writeFile('users.json', users);
  const { password: _, ...safe } = user;
  res.status(201).json({ token: makeToken(user), user: safe });
});

router.get('/auth/me', auth, (req, res) => {
  const users = read('users.json', []);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

router.post('/auth/change-password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Thiếu thông tin' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 8 ký tự' });
  const users = read('users.json', []);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.password !== hashPw(currentPassword)) return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
  user.password = hashPw(newPassword);
  write('users.json', users);
  res.json({ ok: true });
});

router.post('/auth/enroll', auth, (req, res) => {
  const { courseId } = req.body;
  const users = read('users.json', []);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.enrolledCourses) user.enrolledCourses = [];
  if (!user.enrolledCourses.includes(courseId)) {
    user.enrolledCourses.push(courseId);
    writeFile('users.json', users);
  }
  const { password: _, ...safe } = user;
  res.json(safe);
});

// ─── Products ───────────────────────────────────────────────────────────────
router.get('/products', (req, res) => {
  res.json(read('products.json', DEFAULT_PRODUCTS));
});

router.post('/products', adminOnly, (req, res) => {
  const products = read('products.json', DEFAULT_PRODUCTS);
  const product = { ...req.body, id: req.body.id || genId('p') };
  products.push(product);
  writeFile('products.json', products);
  res.status(201).json(product);
});

router.put('/products/:id', adminOnly, (req, res) => {
  const products = read('products.json', DEFAULT_PRODUCTS);
  const i = products.findIndex(p => p.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Product not found' });
  products[i] = { ...products[i], ...req.body, id: req.params.id };
  writeFile('products.json', products);
  res.json(products[i]);
});

router.delete('/products/:id', adminOnly, (req, res) => {
  const products = read('products.json', DEFAULT_PRODUCTS);
  const filtered = products.filter(p => p.id !== req.params.id);
  writeFile('products.json', filtered);
  res.json({ ok: true });
});

// ─── Courses ────────────────────────────────────────────────────────────────
router.get('/courses', (req, res) => {
  res.json(read('courses.json', DEFAULT_COURSES));
});

router.post('/courses', adminOnly, (req, res) => {
  const courses = read('courses.json', DEFAULT_COURSES);
  const course = { ...req.body, id: req.body.id || genId('c') };
  courses.push(course);
  writeFile('courses.json', courses);
  res.status(201).json(course);
});

router.put('/courses/:id', adminOnly, (req, res) => {
  const courses = read('courses.json', DEFAULT_COURSES);
  const i = courses.findIndex(c => c.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Course not found' });
  courses[i] = { ...courses[i], ...req.body, id: req.params.id };
  writeFile('courses.json', courses);
  res.json(courses[i]);
});

router.delete('/courses/:id', adminOnly, (req, res) => {
  const courses = read('courses.json', DEFAULT_COURSES);
  writeFile('courses.json', courses.filter(c => c.id !== req.params.id));
  res.json({ ok: true });
});

// ─── Settings ───────────────────────────────────────────────────────────────
router.get('/settings', (req, res) => {
  res.json(read('settings.json', DEFAULT_SETTINGS));
});

router.put('/settings', adminOnly, (req, res) => {
  const current = read('settings.json', DEFAULT_SETTINGS);
  const updated = { ...current, ...req.body };
  writeFile('settings.json', updated);
  res.json(updated);
});

// ─── Orders ─────────────────────────────────────────────────────────────────
router.get('/orders', auth, (req, res) => {
  const orders = read('orders.json', []);
  if (req.user.role === 'admin') return res.json(orders);
  res.json(orders.filter(o => o.userId === req.user.id));
});

router.post('/orders', (req, res) => {
  const orders = read('orders.json', []);
  const order = { ...req.body, id: genId('ord'), date: Date.now(), status: 'pending' };
  orders.unshift(order);
  writeFile('orders.json', orders);
  res.status(201).json(order);
});

router.put('/orders/:id', adminOnly, (req, res) => {
  const orders = read('orders.json', []);
  const i = orders.findIndex(o => o.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Order not found' });
  orders[i] = { ...orders[i], ...req.body, id: req.params.id };
  writeFile('orders.json', orders);
  res.json(orders[i]);
});

// ─── Users (Admin) ──────────────────────────────────────────────────────────
router.get('/users', adminOnly, (req, res) => {
  const users = read('users.json', []).map(({ password: _, ...u }) => u);
  res.json(users);
});

router.put('/users/:id', adminOnly, (req, res) => {
  const users = read('users.json', []);
  const i = users.findIndex(u => u.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'User not found' });
  users[i] = { ...users[i], ...req.body, id: req.params.id, password: users[i].password };
  writeFile('users.json', users);
  const { password: _, ...safe } = users[i];
  res.json(safe);
});

// ─── Course Enrollments ─────────────────────────────────────────────────────
router.post('/course-enrollments', (req, res) => {
  const { courseId, courseName, name, email, phone, notes, price } = req.body;
  if (!courseId || !name || !email || !phone) return res.status(400).json({ error: 'Required fields missing' });
  const enrollments = read('course-enrollments.json', []);
  const entry = { id: genId('enr'), courseId, courseName, name, email, phone, notes: notes||'', price: price||0, date: Date.now(), status: 'pending' };
  enrollments.unshift(entry);
  writeFile('course-enrollments.json', enrollments);
  res.status(201).json(entry);
});

router.get('/course-enrollments', adminOnly, (req, res) => {
  res.json(read('course-enrollments.json', []));
});

router.put('/course-enrollments/:id', adminOnly, (req, res) => {
  const list = read('course-enrollments.json', []);
  const i = list.findIndex(e => e.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Not found' });
  list[i] = { ...list[i], ...req.body, id: req.params.id };
  writeFile('course-enrollments.json', list);
  res.json(list[i]);
});

module.exports = router;
