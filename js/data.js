// ─── Data Layer ─────────────────────────────────────────────────────────────
const DC = {
  KEYS: {
    products: 'dc_products',
    courses:  'dc_courses',
    users:    'dc_users',
    orders:   'dc_orders',
    settings: 'dc_settings',
    cart:     'dc_cart',
    session:  'dc_session',
    nav:      'dc_nav',
  },

  _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  },
  _set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  // ─── Settings ──────────────────────────────────────────────────────────────
  defaultSettings() {
    return {
      siteName: 'DAPPER COMBAT',
      tagline: 'PIONEERING THE FIGHT LIFESTYLE',
      heroHeadline: 'FIGHT YOUR\nBEST FIGHT',
      heroSubtext: 'Premium training gear & knowledge for serious fighters',
      heroMedia: '',
      heroMediaType: 'image',
      colors: {
        bg: '#0a0a0a',
        bgSecondary: '#141414',
        bgCard: '#1a1a1a',
        text: '#ffffff',
        textMuted: '#888888',
        accent: '#e8c87a',
        accentRed: '#d63031',
        border: '#2a2a2a',
        btnText: '#0a0a0a',
      },
      fonts: {
        heading: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
        body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        headingSize: '1rem',
      },
      layout: {
        btnRadius: '0px',
        cardRadius: '0px',
        spacing: '1rem',
        navHeight: '64px',
      },
      nav: {
        items: [
          { id: 'home', label: 'HOME', visible: true },
          { id: 'shop', label: 'SHOP', visible: true },
          { id: 'courses', label: 'COURSES', visible: true },
          { id: 'account', label: 'ACCOUNT', visible: true },
        ]
      },
      payment: {
        stripe: { enabled: false, publicKey: '' },
        paypal: { enabled: false, clientId: '' },
        vnpay: { enabled: false, merchantId: '', hashSecret: '' },
        momo:  { enabled: false, partnerCode: '' },
      },
      sections: {
        heroVisible: true,
        featuredVisible: true,
        categoriesVisible: true,
        coursePromoVisible: true,
        newsletterVisible: true,
      },
      seo: { title: 'DAPPER COMBAT', description: '', keywords: '' },
    };
  },
  getSettings() {
    return this._get(this.KEYS.settings) || this.defaultSettings();
  },
  saveSettings(s) { this._set(this.KEYS.settings, s); },

  // ─── Products ───────────────────────────────────────────────────────────────
  defaultProducts() {
    return [
      { id: 'p1', name: 'Combat Training Tee', category: 'apparel', price: 850000, originalPrice: 1200000, sizes: ['S','M','L','XL','XXL'], colors: ['BLACK','WHITE','RED'], images: [''], videos: [], colorImages: {}, description: 'Lightweight performance tee engineered for maximum movement during training sessions.', stock: 50, featured: true, badge: 'BEST SELLER', visible: true },
      { id: 'p2', name: 'Pro Boxing Shorts', category: 'apparel', price: 1200000, originalPrice: null, sizes: ['S','M','L','XL'], colors: ['BLACK','NAVY'], images: [''], videos: [], colorImages: {}, description: 'Satin finish shorts with elastic waistband, side slits for full range of motion.', stock: 30, featured: true, badge: 'NEW', visible: true },
      { id: 'p3', name: 'Fighter Hoodie', category: 'apparel', price: 1900000, originalPrice: 2500000, sizes: ['S','M','L','XL','XXL'], colors: ['BLACK','CHARCOAL'], images: [''], videos: [], colorImages: {}, description: 'Oversized heavy-weight hoodie with embroidered logo.', stock: 25, featured: true, badge: '', visible: true },
      { id: 'p4', name: 'Pro Boxing Gloves 12oz', category: 'equipment', price: 2800000, originalPrice: null, sizes: ['10oz','12oz','14oz','16oz'], colors: ['BLACK','RED'], images: [''], videos: [], colorImages: {}, description: 'Triple-density foam padding with pre-curved design for a natural fist position.', stock: 20, featured: true, badge: 'NEW', visible: true },
      { id: 'p5', name: 'Hand Wraps (2 Pack)', category: 'equipment', price: 380000, originalPrice: null, sizes: ['4.5m','5m'], colors: ['BLACK','WHITE','RED'], images: [''], videos: [], colorImages: {}, description: '4.5m semi-elastic wraps with thumb loop and velcro closure.', stock: 100, featured: false, badge: '', visible: true },
      { id: 'p6', name: 'Track Jacket', category: 'apparel', price: 2200000, originalPrice: null, sizes: ['S','M','L','XL'], colors: ['BLACK','WHITE'], images: [''], videos: [], colorImages: {}, description: 'Retro-inspired track jacket with contrast piping and zip pockets.', stock: 15, featured: false, badge: '', visible: true },
    ];
  },
  getProducts() { return this._get(this.KEYS.products) || this.defaultProducts(); },
  saveProducts(arr) { this._set(this.KEYS.products, arr); },
  saveProduct(product) {
    const arr = this.getProducts();
    const i = arr.findIndex(p => p.id === product.id);
    if (i >= 0) arr[i] = product; else arr.push(product);
    this.saveProducts(arr);
  },
  deleteProduct(id) { this.saveProducts(this.getProducts().filter(p => p.id !== id)); },

  // ─── Courses ────────────────────────────────────────────────────────────────
  defaultCourses() {
    return [
      { id: 'c1', title: 'Boxing Fundamentals', instructor: 'Coach Marcus', price: 1500000, thumbnail: '', description: 'Master the basics: stance, guard, footwork, and the fundamental punches.', lessons: ['Introduction to Boxing', 'Stance & Footwork', 'The Jab', 'The Cross', 'Hooks & Uppercuts', 'Defense Basics'], duration: '6 weeks', level: 'Beginner', students: 234, visible: true, featured: true },
      { id: 'c2', title: 'Advanced Combinations', instructor: 'Coach Sarah', price: 2200000, thumbnail: '', description: 'String together powerful combinations and learn ring generalship.', lessons: ['1-2-3 Combos', 'Body Work', 'Countering', 'Pressure Fighting', 'Ring Generalship', 'Sparring Prep'], duration: '8 weeks', level: 'Intermediate', students: 156, visible: true, featured: true },
      { id: 'c3', title: 'Fighter Conditioning', instructor: 'Coach Alex', price: 1800000, thumbnail: '', description: 'Elite fight conditioning: strength, cardio, speed, and recovery protocols.', lessons: ['Conditioning Assessment', 'Roadwork & Cardio', 'Strength Training', 'Speed & Agility', 'Recovery Methods', 'Fight Week Prep'], duration: '12 weeks', level: 'All Levels', students: 412, visible: true, featured: false },
    ];
  },
  getCourses() { return this._get(this.KEYS.courses) || this.defaultCourses(); },
  saveCourses(arr) { this._set(this.KEYS.courses, arr); },
  saveCourse(course) {
    const arr = this.getCourses();
    const i = arr.findIndex(c => c.id === course.id);
    if (i >= 0) arr[i] = course; else arr.push(course);
    this.saveCourses(arr);
  },
  deleteCourse(id) { this.saveCourses(this.getCourses().filter(c => c.id !== id)); },

  // ─── Users ──────────────────────────────────────────────────────────────────
  getUsers() { return this._get(this.KEYS.users) || []; },
  saveUsers(arr) { this._set(this.KEYS.users, arr); },
  registerUser({ name, email, password, role = 'customer' }) {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) return { error: 'Email already registered' };
    const user = { id: 'u' + Date.now(), name, email, password: btoa(password), role, createdAt: Date.now(), enrolledCourses: [], orders: [] };
    users.push(user);
    this.saveUsers(users);
    return { user };
  },
  loginUser(email, password) {
    const user = this.getUsers().find(u => u.email === email && u.password === btoa(password));
    if (!user) return { error: 'Invalid email or password' };
    this._set(this.KEYS.session, { userId: user.id, role: user.role });
    return { user };
  },
  logout() { localStorage.removeItem(this.KEYS.session); },
  getSession() { return this._get(this.KEYS.session); },
  getCurrentUser() {
    const s = this.getSession();
    if (!s) return null;
    return this.getUsers().find(u => u.id === s.userId) || null;
  },
  updateUser(user) {
    const arr = this.getUsers();
    const i = arr.findIndex(u => u.id === user.id);
    if (i >= 0) { arr[i] = user; this.saveUsers(arr); }
  },

  // ─── Cart ───────────────────────────────────────────────────────────────────
  getCart() { return this._get(this.KEYS.cart) || []; },
  saveCart(arr) { this._set(this.KEYS.cart, arr); },
  addToCart(productId, size, color, qty = 1) {
    const cart = this.getCart();
    const key = `${productId}__${size}__${color}`;
    const existing = cart.find(i => i.key === key);
    if (existing) existing.qty += qty;
    else cart.push({ key, productId, size, color, qty });
    this.saveCart(cart);
  },
  updateCartQty(key, qty) {
    const cart = this.getCart();
    const item = cart.find(i => i.key === key);
    if (item) { item.qty = qty; if (item.qty <= 0) return this.removeFromCart(key); }
    this.saveCart(cart);
  },
  removeFromCart(key) { this.saveCart(this.getCart().filter(i => i.key !== key)); },
  clearCart() { this.saveCart([]); },
  cartTotal() {
    const products = this.getProducts();
    return this.getCart().reduce((sum, item) => {
      const p = products.find(p => p.id === item.productId);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
  },
  cartCount() { return this.getCart().reduce((s, i) => s + i.qty, 0); },

  // ─── Orders ─────────────────────────────────────────────────────────────────
  getOrders() { return this._get(this.KEYS.orders) || []; },
  saveOrder(order) {
    const arr = this.getOrders();
    arr.unshift(order);
    this._set(this.KEYS.orders, arr);
  },

  // ─── Helpers ────────────────────────────────────────────────────────────────
  formatPrice(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  },
  genId(prefix = 'x') { return prefix + Math.random().toString(36).slice(2, 9); },
};
