// ─── DAPPER COMBAT — API Client (replaces localStorage) ─────────────────────
const DC = {
  _cache: { products: [], courses: [], settings: null, orders: [], users: [] },

  // ─── Token (auth) ──────────────────────────────────────────────────────
  getToken() { return localStorage.getItem('dc_token'); },
  setToken(t) { localStorage.setItem('dc_token', t); },
  clearToken() { localStorage.removeItem('dc_token'); },
  _headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this.getToken();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  },

  // ─── HTTP ──────────────────────────────────────────────────────────────
  async req(method, url, body) {
    const opts = { method, headers: this._headers() };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const r = await fetch(url, opts);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  },

  // ─── Bootstrap ─────────────────────────────────────────────────────────
  async loadAll() {
    const [products, courses, settings] = await Promise.all([
      this.req('GET', '/api/products').catch(() => []),
      this.req('GET', '/api/courses').catch(() => []),
      this.req('GET', '/api/settings').catch(() => null),
    ]);
    this._cache.products = products;
    this._cache.courses  = courses;
    if (settings) this._cache.settings = settings;

    // Orders only if logged in
    if (this.getToken()) {
      await this.loadCurrentUser();
      await this.loadOrders();
    }
  },

  // ─── Settings ──────────────────────────────────────────────────────────
  getSettings() { return this._cache.settings || this._defaultSettings(); },
  async saveSettings(s) {
    const updated = await this.req('PUT', '/api/settings', s);
    this._cache.settings = updated;
    return updated;
  },

  // ─── Products ──────────────────────────────────────────────────────────
  getProducts() { return this._cache.products; },
  async saveProduct(p) {
    const exists = this._cache.products.find(x => x.id === p.id);
    const result = exists
      ? await this.req('PUT', `/api/products/${p.id}`, p)
      : await this.req('POST', '/api/products', p);
    const i = this._cache.products.findIndex(x => x.id === result.id);
    if (i >= 0) this._cache.products[i] = result; else this._cache.products.push(result);
    return result;
  },
  async deleteProduct(id) {
    await this.req('DELETE', `/api/products/${id}`);
    this._cache.products = this._cache.products.filter(p => p.id !== id);
  },

  // ─── Courses ───────────────────────────────────────────────────────────
  getCourses() { return this._cache.courses; },
  async saveCourse(c) {
    const exists = this._cache.courses.find(x => x.id === c.id);
    const result = exists
      ? await this.req('PUT', `/api/courses/${c.id}`, c)
      : await this.req('POST', '/api/courses', c);
    const i = this._cache.courses.findIndex(x => x.id === result.id);
    if (i >= 0) this._cache.courses[i] = result; else this._cache.courses.push(result);
    return result;
  },
  async deleteCourse(id) {
    await this.req('DELETE', `/api/courses/${id}`);
    this._cache.courses = this._cache.courses.filter(c => c.id !== id);
  },

  // ─── Auth ──────────────────────────────────────────────────────────────
  async loginUser(email, password) {
    try {
      const r = await this.req('POST', '/api/auth/login', { email, password });
      this.setToken(r.token);
      this._cache.currentUser = r.user;
      return { user: r.user };
    } catch(e) { return { error: e.message }; }
  },
  async registerUser({ name, email, password, role }) {
    try {
      const r = await this.req('POST', '/api/auth/register', { name, email, password, role });
      this.setToken(r.token);
      this._cache.currentUser = r.user;
      return { user: r.user };
    } catch(e) { return { error: e.message }; }
  },
  async loadCurrentUser() {
    if (!this.getToken()) return null;
    try {
      const user = await this.req('GET', '/api/auth/me');
      this._cache.currentUser = user;
      return user;
    } catch {
      this.clearToken();
      this._cache.currentUser = null;
      return null;
    }
  },
  getCurrentUser() { return this._cache.currentUser || null; },
  getSession() {
    const u = this._cache.currentUser;
    return u ? { userId: u.id, role: u.role } : null;
  },
  logout() {
    this.clearToken();
    this._cache.currentUser = null;
  },
  async enrollCourse(courseId) {
    const user = await this.req('POST', '/api/auth/enroll', { courseId });
    this._cache.currentUser = user;
    return user;
  },
  async updateUser(user) {
    const updated = await this.req('PUT', `/api/users/${user.id}`, user);
    if (this._cache.currentUser?.id === user.id) this._cache.currentUser = updated;
    return updated;
  },

  // ─── Orders ────────────────────────────────────────────────────────────
  getOrders() { return this._cache.orders; },
  async loadOrders() {
    try {
      this._cache.orders = await this.req('GET', '/api/orders');
    } catch { this._cache.orders = []; }
  },
  async saveOrder(order) {
    const result = await this.req('POST', '/api/orders', order);
    this._cache.orders.unshift(result);
    return result;
  },

  // ─── Users (admin) ─────────────────────────────────────────────────────
  getUsers() { return this._cache.users; },
  async loadUsers() {
    this._cache.users = await this.req('GET', '/api/users');
    return this._cache.users;
  },
  async changeUserRole(id, role) {
    const updated = await this.req('PUT', `/api/users/${id}`, { role });
    const i = this._cache.users.findIndex(u => u.id === id);
    if (i >= 0) this._cache.users[i] = updated;
    return updated;
  },

  // ─── Cart (localStorage — stays client-side per user) ──────────────────
  getCart() {
    try { return JSON.parse(localStorage.getItem('dc_cart')) || []; } catch { return []; }
  },
  _saveCart(arr) { localStorage.setItem('dc_cart', JSON.stringify(arr)); },
  addToCart(productId, size, color, qty = 1) {
    const cart = this.getCart();
    const key = `${productId}__${size}__${color}`;
    const item = cart.find(i => i.key === key);
    if (item) item.qty += qty; else cart.push({ key, productId, size, color, qty });
    this._saveCart(cart);
  },
  updateCartQty(key, qty) {
    const cart = this.getCart();
    const item = cart.find(i => i.key === key);
    if (!item) return;
    item.qty = qty;
    if (item.qty <= 0) return this.removeFromCart(key);
    this._saveCart(cart);
  },
  removeFromCart(key) { this._saveCart(this.getCart().filter(i => i.key !== key)); },
  clearCart() { localStorage.removeItem('dc_cart'); },
  cartTotal() {
    return this.getCart().reduce((sum, item) => {
      const p = this._cache.products.find(p => p.id === item.productId);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
  },
  cartCount() { return this.getCart().reduce((s, i) => s + i.qty, 0); },

  // ─── Helpers ───────────────────────────────────────────────────────────
  formatPrice(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  },
  genId(prefix = 'x') { return prefix + Math.random().toString(36).slice(2, 9); },

  _defaultSettings() {
    return {
      siteName: 'DAPPER COMBAT',
      tagline: 'PIONEERING THE FIGHT LIFESTYLE',
      heroHeadline: 'FIGHT YOUR\nBEST FIGHT',
      heroSubtext: 'Premium training gear & knowledge for serious fighters',
      heroMedia: '', heroMediaType: 'image',
      logoMark: '', logoFull: '', faviconUrl: '',
      colors: { bg:'#ffffff', bgSecondary:'#f5f5f5', bgCard:'#eeeeee', text:'#0d0d0d', textMuted:'#666666', accent:'#b8960c', accentRed:'#c0392b', border:'#dedede', btnText:'#ffffff' },
      fonts: { heading:"'Bebas Neue', Impact, 'Arial Narrow', sans-serif", body:"'Inter', 'Helvetica Neue', Arial, sans-serif" },
      layout: { btnRadius:'0px', cardRadius:'0px', navHeight:'64px' },
      nav: { items: [{ id:'home', label:'HOME', visible:true },{ id:'shop', label:'SHOP', visible:true },{ id:'courses', label:'COURSES', visible:true }] },
      payment: {
        cod:          { enabled: true, description: 'Trả tiền mặt khi nhận hàng' },
        bankTransfer: { enabled: false, bankName: '', accountNumber: '', accountOwner: '', qrUrl: '', note: '' },
        momo:         { enabled: false, phone: '', name: '', qrUrl: '', partnerCode: '' },
        zalopay:      { enabled: false, phone: '', name: '', qrUrl: '' },
        vnpay:        { enabled: false, merchantId: '', hashSecret: '' },
        stripe:       { enabled: false, publicKey: '' },
        paypal:       { enabled: false, clientId: '' },
        installment:  { enabled: false, plans: '3, 6, 12 tháng', partners: 'Home Credit, Kredivo, FE Credit', note: '' },
      },
      social: { facebook: '', instagram: '', youtube: '', zalo: '', messenger: '', hotline: '' },
      coupons: [],
      shippingMethods: [],
      sections: { heroVisible:true, featuredVisible:true, categoriesVisible:true, coursePromoVisible:true, newsletterVisible:true },
      seo: { title:'DAPPER COMBAT', description:'', keywords:'' },
      adminEmail: '',
      announcementBar: { enabled: false, text: '', btnText: '', btnLink: '', bgColor: '#0d0d0d', textColor: '#ffffff' },
      sizeChartUrl: '',
      deliveryPolicy: 'Free shipping on orders over 1,500,000 VND. Standard delivery 3-5 business days. Express delivery available. Returns accepted within 14 days of purchase in original condition.',
    };
  },

  async submitCourseEnrollment(data) {
    const res = await fetch('/api/course-enrollments', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    return res.json();
  },

  async getCourseEnrollments() {
    const res = await fetch('/api/course-enrollments', { headers: this._headers() });
    if (!res.ok) throw new Error('Failed to load enrollments');
    return res.json();
  },

  async updateCourseEnrollment(id, data) {
    const res = await fetch('/api/course-enrollments/' + id, {
      method: 'PUT',
      headers: {'Content-Type':'application/json', ...this._headers()},
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update enrollment');
    return res.json();
  },
};
