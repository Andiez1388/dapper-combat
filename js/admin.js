// ─── DAPPER COMBAT — Admin Panel ────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
});

const Admin = {
  currentSection: 'dashboard',
  editingProduct: null,
  editingCourse: null,

  init() {
    this.checkAuth();
    this.applySettings();
    this.initNav();
    this.showSection('dashboard');
  },

  checkAuth() {
    const session = DC.getSession();
    if (!session || session.role !== 'admin') {
      // Show admin login
      document.getElementById('admin-login-screen').style.display = 'flex';
      document.getElementById('admin-app').style.display = 'none';
      document.getElementById('admin-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-login-email').value;
        const pass = document.getElementById('admin-login-password').value;
        // Check for default admin or registered admin
        if (email === 'admin@dappercombat.com' && pass === 'admin123') {
          // Create admin session directly
          localStorage.setItem('dc_session', JSON.stringify({ userId: 'admin', role: 'admin' }));
          document.getElementById('admin-login-screen').style.display = 'none';
          document.getElementById('admin-app').style.display = 'flex';
          this.applySettings();
          this.showSection('dashboard');
          return;
        }
        const result = DC.loginUser(email, pass);
        if (result.error || result.user?.role !== 'admin') {
          document.getElementById('admin-login-error').textContent = result.error || 'Access denied. Admin only.';
          document.getElementById('admin-login-error').style.display = 'block';
        } else {
          document.getElementById('admin-login-screen').style.display = 'none';
          document.getElementById('admin-app').style.display = 'flex';
          this.applySettings();
          this.showSection('dashboard');
        }
      });
    } else {
      document.getElementById('admin-login-screen').style.display = 'none';
      document.getElementById('admin-app').style.display = 'flex';
    }
  },

  applySettings() {
    const s = DC.getSettings();
    const root = document.documentElement.style;
    const c = s.colors;
    root.setProperty('--bg', c.bg);
    root.setProperty('--bg-secondary', c.bgSecondary);
    root.setProperty('--bg-card', c.bgCard);
    root.setProperty('--text', c.text);
    root.setProperty('--text-muted', c.textMuted);
    root.setProperty('--accent', c.accent);
    root.setProperty('--accent-red', c.accentRed);
    root.setProperty('--border', c.border);
    root.setProperty('--btn-text', c.btnText);
    root.setProperty('--font-heading', s.fonts.heading);
    root.setProperty('--font-body', s.fonts.body);
    root.setProperty('--btn-radius', s.layout.btnRadius);
    root.setProperty('--card-radius', s.layout.cardRadius);
    root.setProperty('--nav-height', s.layout.navHeight);
  },

  initNav() {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
      item.addEventListener('click', () => this.showSection(item.dataset.section));
    });
    document.getElementById('btn-admin-logout').addEventListener('click', () => {
      DC.logout();
      location.reload();
    });
    document.getElementById('btn-view-site').addEventListener('click', () => {
      window.open('index.html', '_blank');
    });
  },

  showSection(id) {
    this.currentSection = id;
    document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.toggle('active', i.dataset.section === id));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.toggle('active', s.id === 'section-' + id));
    const titleMap = { dashboard:'DASHBOARD', design:'DESIGN', content:'CONTENT', media:'MEDIA', products:'PRODUCTS', courses:'COURSES', users:'USERS', navigation:'NAVIGATION', payments:'PAYMENTS' };
    const titleEl = document.getElementById('section-title');
    if (titleEl) titleEl.textContent = titleMap[id] || id.toUpperCase();

    const renders = {
      dashboard: () => this.renderDashboard(),
      design: () => this.renderDesign(),
      content: () => this.renderContent(),
      media: () => this.renderMedia(),
      products: () => this.renderProducts(),
      courses: () => this.renderCoursesAdmin(),
      users: () => this.renderUsers(),
      navigation: () => this.renderNavigation(),
      payments: () => this.renderPayments(),
    };
    if (renders[id]) renders[id]();
  },

  toast(msg, type = 'success') {
    const c = document.getElementById('admin-toast-container');
    const el = document.createElement('div');
    el.className = `toast${type === 'error' ? ' error' : ''}`;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  },

  // ─── Dashboard ────────────────────────────────────────────────────────────
  renderDashboard() {
    const products = DC.getProducts();
    const courses = DC.getCourses();
    const users = DC.getUsers();
    const orders = DC.getOrders();
    document.getElementById('stat-products').textContent = products.length;
    document.getElementById('stat-courses').textContent = courses.length;
    document.getElementById('stat-users').textContent = users.length;
    document.getElementById('stat-orders').textContent = orders.length;
    const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    document.getElementById('stat-revenue').textContent = DC.formatPrice(revenue);

    const recentOrders = orders.slice(0, 5);
    const el = document.getElementById('recent-orders');
    el.innerHTML = recentOrders.length
      ? recentOrders.map(o => `<tr>
          <td>#${o.id}</td>
          <td>${o.userId}</td>
          <td>${DC.formatPrice(o.total)}</td>
          <td><span class="tag">${o.status}</span></td>
          <td>${new Date(o.date).toLocaleDateString()}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">No orders yet</td></tr>';
  },

  // ─── Design ──────────────────────────────────────────────────────────────
  renderDesign() {
    const s = DC.getSettings();
    const c = s.colors;

    // Color pickers
    const colorFields = {
      'color-bg': c.bg,
      'color-bg-secondary': c.bgSecondary,
      'color-bg-card': c.bgCard,
      'color-text': c.text,
      'color-text-muted': c.textMuted,
      'color-accent': c.accent,
      'color-accent-red': c.accentRed,
      'color-border': c.border,
      'color-btn-text': c.btnText,
    };
    Object.entries(colorFields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) { el.value = val; el.oninput = () => this.previewColor(id, el.value); }
    });

    // Font selectors
    const fontHeadingEl = document.getElementById('font-heading');
    const fontBodyEl = document.getElementById('font-body');
    if (fontHeadingEl) fontHeadingEl.value = s.fonts.heading;
    if (fontBodyEl) fontBodyEl.value = s.fonts.body;

    // Layout
    const btnRadiusEl = document.getElementById('btn-radius');
    if (btnRadiusEl) btnRadiusEl.value = parseInt(s.layout.btnRadius) || 0;

    document.getElementById('btn-save-design').onclick = () => this.saveDesign();
    document.getElementById('btn-reset-design').onclick = () => {
      if (confirm('Reset all design settings to default?')) {
        const def = DC.defaultSettings();
        const cur = DC.getSettings();
        cur.colors = def.colors;
        cur.fonts = def.fonts;
        cur.layout = def.layout;
        DC.saveSettings(cur);
        this.applySettings();
        this.renderDesign();
        this.toast('Design reset to defaults');
      }
    };
  },

  previewColor(id, value) {
    const map = {
      'color-bg': '--bg',
      'color-bg-secondary': '--bg-secondary',
      'color-bg-card': '--bg-card',
      'color-text': '--text',
      'color-text-muted': '--text-muted',
      'color-accent': '--accent',
      'color-accent-red': '--accent-red',
      'color-border': '--border',
      'color-btn-text': '--btn-text',
    };
    if (map[id]) document.documentElement.style.setProperty(map[id], value);
  },

  saveDesign() {
    const s = DC.getSettings();
    s.colors = {
      bg: document.getElementById('color-bg').value,
      bgSecondary: document.getElementById('color-bg-secondary').value,
      bgCard: document.getElementById('color-bg-card').value,
      text: document.getElementById('color-text').value,
      textMuted: document.getElementById('color-text-muted').value,
      accent: document.getElementById('color-accent').value,
      accentRed: document.getElementById('color-accent-red').value,
      border: document.getElementById('color-border').value,
      btnText: document.getElementById('color-btn-text').value,
    };
    const fh = document.getElementById('font-heading');
    const fb = document.getElementById('font-body');
    if (fh) s.fonts.heading = fh.value;
    if (fb) s.fonts.body = fb.value;
    const br = document.getElementById('btn-radius');
    if (br) s.layout.btnRadius = br.value + 'px';
    DC.saveSettings(s);
    this.applySettings();
    this.toast('Design settings saved!');
  },

  // ─── Content ──────────────────────────────────────────────────────────────
  renderContent() {
    const s = DC.getSettings();
    document.getElementById('content-site-name').value = s.siteName;
    document.getElementById('content-tagline').value = s.tagline;
    document.getElementById('content-hero-headline').value = s.heroHeadline;
    document.getElementById('content-hero-subtext').value = s.heroSubtext;

    // Sections toggles
    Object.keys(s.sections).forEach(key => {
      const el = document.getElementById('section-toggle-' + key);
      if (el) el.checked = s.sections[key];
    });

    // SEO
    document.getElementById('content-seo-title').value = s.seo?.title || '';
    document.getElementById('content-seo-desc').value = s.seo?.description || '';
    document.getElementById('content-seo-keywords').value = s.seo?.keywords || '';

    document.getElementById('btn-save-content').onclick = () => this.saveContent();
  },

  saveContent() {
    const s = DC.getSettings();
    s.siteName = document.getElementById('content-site-name').value;
    s.tagline = document.getElementById('content-tagline').value;
    s.heroHeadline = document.getElementById('content-hero-headline').value;
    s.heroSubtext = document.getElementById('content-hero-subtext').value;
    Object.keys(s.sections).forEach(key => {
      const el = document.getElementById('section-toggle-' + key);
      if (el) s.sections[key] = el.checked;
    });
    s.seo = {
      title: document.getElementById('content-seo-title').value,
      description: document.getElementById('content-seo-desc').value,
      keywords: document.getElementById('content-seo-keywords').value,
    };
    DC.saveSettings(s);
    this.toast('Content saved!');
  },

  // ─── Media ────────────────────────────────────────────────────────────────
  renderMedia() {
    const s = DC.getSettings();
    const heroPreview = document.getElementById('hero-media-preview');
    if (s.heroMedia) {
      heroPreview.innerHTML = s.heroMediaType === 'video'
        ? `<video src="${s.heroMedia}" style="max-width:100%;max-height:200px" controls></video>`
        : `<img src="${s.heroMedia}" style="max-width:100%;max-height:200px;object-fit:cover">`;
    } else {
      heroPreview.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);border:2px dashed var(--border)">No hero media set</div>';
    }

    document.getElementById('hero-media-upload').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const s = DC.getSettings();
        s.heroMedia = ev.target.result;
        s.heroMediaType = file.type.startsWith('video') ? 'video' : 'image';
        DC.saveSettings(s);
        this.renderMedia();
        this.toast('Hero media uploaded!');
      };
      reader.readAsDataURL(file);
    };

    document.getElementById('btn-clear-hero').onclick = () => {
      const s = DC.getSettings();
      s.heroMedia = '';
      DC.saveSettings(s);
      this.renderMedia();
      this.toast('Hero media cleared');
    };
  },

  // ─── Products ────────────────────────────────────────────────────────────
  renderProducts() {
    const products = DC.getProducts();
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = products.map(p => `<tr>
      <td>
        <div style="width:48px;height:48px;background:var(--bg-card);display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);opacity:0.5">
          ${p.images && p.images[0] ? `<img src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover">` : p.name.charAt(0)}
        </div>
      </td>
      <td><strong>${p.name}</strong></td>
      <td><span class="tag">${p.category}</span></td>
      <td>${DC.formatPrice(p.price)}</td>
      <td>${p.stock}</td>
      <td>
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer">
          <input type="checkbox" ${p.visible ? 'checked' : ''} onchange="Admin.toggleProductVisible('${p.id}', this.checked)">
          <span style="font-size:0.75rem">${p.visible ? 'Visible' : 'Hidden'}</span>
        </label>
      </td>
      <td>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-sm btn-ghost" onclick="Admin.openProductEditor('${p.id}')">EDIT</button>
          <button class="btn btn-sm btn-danger" onclick="Admin.deleteProduct('${p.id}')">DEL</button>
        </div>
      </td>
    </tr>`).join('');

    document.getElementById('btn-new-product').onclick = () => this.openProductEditor(null);
  },

  toggleProductVisible(id, visible) {
    const products = DC.getProducts();
    const p = products.find(p => p.id === id);
    if (p) { p.visible = visible; DC.saveProducts(products); }
  },

  openProductEditor(id) {
    const modal = document.getElementById('product-editor-modal');
    const p = id ? DC.getProducts().find(p => p.id === id) : null;
    this.editingProduct = p || { id: DC.genId('p'), name: '', category: 'apparel', price: 0, originalPrice: null, sizes: [], colors: [], images: [''], videos: [], colorImages: {}, description: '', stock: 0, featured: false, badge: '', visible: true };

    document.getElementById('pe-title').textContent = p ? 'EDIT PRODUCT' : 'NEW PRODUCT';
    document.getElementById('pe-name').value = this.editingProduct.name;
    document.getElementById('pe-category').value = this.editingProduct.category;
    document.getElementById('pe-price').value = this.editingProduct.price;
    document.getElementById('pe-original-price').value = this.editingProduct.originalPrice || '';
    document.getElementById('pe-sizes').value = (this.editingProduct.sizes || []).join(', ');
    document.getElementById('pe-colors').value = (this.editingProduct.colors || []).join(', ');
    document.getElementById('pe-description').value = this.editingProduct.description;
    document.getElementById('pe-stock').value = this.editingProduct.stock;
    document.getElementById('pe-badge').value = this.editingProduct.badge || '';
    document.getElementById('pe-featured').checked = this.editingProduct.featured;
    document.getElementById('pe-visible').checked = this.editingProduct.visible;
    document.getElementById('pe-image').value = (this.editingProduct.images || [''])[0] || '';

    // Image upload
    document.getElementById('pe-image-file').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { document.getElementById('pe-image').value = ev.target.result; };
      reader.readAsDataURL(file);
    };

    // Render color image inputs
    this._renderColorImageInputs();

    // Re-render color image inputs when colors change
    const peColors = document.getElementById('pe-colors');
    if (peColors) {
      peColors.oninput = () => this._renderColorImageInputs();
    }

    modal.classList.add('open');
  },

  _renderColorImageInputs() {
    const colorImagesEl = document.getElementById('pe-color-images-inputs');
    if (!colorImagesEl) return;
    const colorsVal = (document.getElementById('pe-colors')?.value || '').split(',').map(c => c.trim()).filter(Boolean);
    const colorImages = (this.editingProduct && this.editingProduct.colorImages) || {};
    colorImagesEl.innerHTML = colorsVal.map(color => `
      <div style="margin-bottom:1rem">
        <label style="font-size:0.75rem;font-family:var(--font-heading);letter-spacing:0.08em;color:var(--text-muted)">${color}</label>
        <textarea id="pe-ci-${color.replace(/\s/g,'_')}" rows="3" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
          style="width:100%;margin-top:0.35rem;font-size:0.75rem">${(colorImages[color] || []).join('\n')}</textarea>
      </div>
    `).join('') || '<p style="font-size:0.75rem;color:var(--text-muted)">Add colors to the product first, then color images will appear here.</p>';
  },

  saveProduct() {
    if (!this.editingProduct) return;
    const p = this.editingProduct;
    p.name = document.getElementById('pe-name').value;
    p.category = document.getElementById('pe-category').value;
    p.price = parseInt(document.getElementById('pe-price').value) || 0;
    const op = document.getElementById('pe-original-price').value;
    p.originalPrice = op ? parseInt(op) : null;
    p.sizes = document.getElementById('pe-sizes').value.split(',').map(s => s.trim()).filter(Boolean);
    p.colors = document.getElementById('pe-colors').value.split(',').map(s => s.trim()).filter(Boolean);
    p.description = document.getElementById('pe-description').value;
    p.stock = parseInt(document.getElementById('pe-stock').value) || 0;
    p.badge = document.getElementById('pe-badge').value;
    p.featured = document.getElementById('pe-featured').checked;
    p.visible = document.getElementById('pe-visible').checked;
    const imgUrl = document.getElementById('pe-image').value;
    p.images = imgUrl ? [imgUrl] : [''];

    // Collect colorImages
    const colorImagesData = {};
    (p.colors || []).forEach(color => {
      const taId = 'pe-ci-' + color.replace(/\s/g, '_');
      const ta = document.getElementById(taId);
      if (ta) {
        const urls = ta.value.split('\n').map(s => s.trim()).filter(Boolean);
        if (urls.length) colorImagesData[color] = urls;
      }
    });
    p.colorImages = colorImagesData;

    DC.saveProduct(p);
    document.getElementById('product-editor-modal').classList.remove('open');
    this.renderProducts();
    this.toast('Product saved!');
  },

  deleteProduct(id) {
    if (confirm('Delete this product?')) {
      DC.deleteProduct(id);
      this.renderProducts();
      this.toast('Product deleted');
    }
  },

  // ─── Courses Admin ────────────────────────────────────────────────────────
  renderCoursesAdmin() {
    const courses = DC.getCourses();
    const tbody = document.getElementById('courses-table-body');
    tbody.innerHTML = courses.map(c => `<tr>
      <td><strong>${c.title}</strong></td>
      <td>${c.instructor}</td>
      <td><span class="tag">${c.level}</span></td>
      <td>${DC.formatPrice(c.price)}</td>
      <td>${c.students || 0}</td>
      <td>
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer">
          <input type="checkbox" ${c.visible ? 'checked' : ''} onchange="Admin.toggleCourseVisible('${c.id}', this.checked)">
          <span style="font-size:0.75rem">${c.visible ? 'Visible' : 'Hidden'}</span>
        </label>
      </td>
      <td>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-sm btn-ghost" onclick="Admin.openCourseEditor('${c.id}')">EDIT</button>
          <button class="btn btn-sm btn-danger" onclick="Admin.deleteCourse('${c.id}')">DEL</button>
        </div>
      </td>
    </tr>`).join('');

    document.getElementById('btn-new-course').onclick = () => this.openCourseEditor(null);
  },

  toggleCourseVisible(id, visible) {
    const courses = DC.getCourses();
    const c = courses.find(c => c.id === id);
    if (c) { c.visible = visible; DC.saveCourses(courses); }
  },

  openCourseEditor(id) {
    const modal = document.getElementById('course-editor-modal');
    const c = id ? DC.getCourses().find(c => c.id === id) : null;
    this.editingCourse = c || { id: DC.genId('c'), title: '', instructor: '', price: 0, thumbnail: '', description: '', lessons: [], duration: '', level: 'Beginner', students: 0, visible: true, featured: false };

    document.getElementById('ce-title-label').textContent = c ? 'EDIT COURSE' : 'NEW COURSE';
    document.getElementById('ce-title').value = this.editingCourse.title;
    document.getElementById('ce-instructor').value = this.editingCourse.instructor;
    document.getElementById('ce-price').value = this.editingCourse.price;
    document.getElementById('ce-level').value = this.editingCourse.level;
    document.getElementById('ce-duration').value = this.editingCourse.duration;
    document.getElementById('ce-description').value = this.editingCourse.description;
    document.getElementById('ce-lessons').value = (this.editingCourse.lessons || []).join('\n');
    document.getElementById('ce-thumbnail').value = this.editingCourse.thumbnail || '';
    document.getElementById('ce-featured').checked = this.editingCourse.featured;
    document.getElementById('ce-visible').checked = this.editingCourse.visible;

    // Thumbnail upload
    document.getElementById('ce-thumbnail-file').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { document.getElementById('ce-thumbnail').value = ev.target.result; };
      reader.readAsDataURL(file);
    };

    modal.classList.add('open');
  },

  saveCourse() {
    if (!this.editingCourse) return;
    const c = this.editingCourse;
    c.title = document.getElementById('ce-title').value;
    c.instructor = document.getElementById('ce-instructor').value;
    c.price = parseInt(document.getElementById('ce-price').value) || 0;
    c.level = document.getElementById('ce-level').value;
    c.duration = document.getElementById('ce-duration').value;
    c.description = document.getElementById('ce-description').value;
    c.lessons = document.getElementById('ce-lessons').value.split('\n').map(l => l.trim()).filter(Boolean);
    c.thumbnail = document.getElementById('ce-thumbnail').value;
    c.featured = document.getElementById('ce-featured').checked;
    c.visible = document.getElementById('ce-visible').checked;

    DC.saveCourse(c);
    document.getElementById('course-editor-modal').classList.remove('open');
    this.renderCoursesAdmin();
    this.toast('Course saved!');
  },

  deleteCourse(id) {
    if (confirm('Delete this course?')) {
      DC.deleteCourse(id);
      this.renderCoursesAdmin();
      this.toast('Course deleted');
    }
  },

  // ─── Users ────────────────────────────────────────────────────────────────
  renderUsers() {
    const users = DC.getUsers();
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = users.length
      ? users.map(u => `<tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td><span class="tag">${u.role}</span></td>
          <td>${new Date(u.createdAt).toLocaleDateString()}</td>
          <td>${(u.enrolledCourses || []).length}</td>
          <td>${(u.orders || []).length}</td>
          <td>
            <select onchange="Admin.changeUserRole('${u.id}', this.value)" style="padding:0.3rem 0.5rem;font-size:0.75rem;width:auto">
              <option value="customer" ${u.role==='customer'?'selected':''}>Customer</option>
              <option value="student" ${u.role==='student'?'selected':''}>Student</option>
              <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
            </select>
          </td>
        </tr>`).join('')
      : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No users registered yet</td></tr>';

    document.getElementById('users-count').textContent = users.length + ' users';
  },

  changeUserRole(id, role) {
    const users = DC.getUsers();
    const u = users.find(u => u.id === id);
    if (u) { u.role = role; DC.saveUsers(users); this.toast('User role updated'); }
  },

  // ─── Navigation ───────────────────────────────────────────────────────────
  renderNavigation() {
    const s = DC.getSettings();
    const container = document.getElementById('nav-items-editor');
    container.innerHTML = s.nav.items.map((item, i) => `
      <div class="nav-item-row" data-index="${i}" style="display:flex;align-items:center;gap:1rem;padding:0.75rem;background:var(--bg-card);border:1px solid var(--border);margin-bottom:0.5rem">
        <span style="color:var(--text-muted);cursor:grab">⠿</span>
        <input type="text" value="${item.label}" data-field="label" data-index="${i}" style="flex:1;max-width:200px">
        <input type="text" value="${item.id}" data-field="id" data-index="${i}" style="flex:1;max-width:150px;color:var(--text-muted)">
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;white-space:nowrap">
          <input type="checkbox" ${item.visible ? 'checked' : ''} data-field="visible" data-index="${i}">
          Visible
        </label>
      </div>
    `).join('');

    document.getElementById('btn-save-nav').onclick = () => {
      const s = DC.getSettings();
      container.querySelectorAll('.nav-item-row').forEach((row, i) => {
        s.nav.items[i].label = row.querySelector('[data-field="label"]').value;
        s.nav.items[i].id = row.querySelector('[data-field="id"]').value;
        s.nav.items[i].visible = row.querySelector('[data-field="visible"]').checked;
      });
      DC.saveSettings(s);
      this.toast('Navigation saved!');
    };

    document.getElementById('btn-add-nav-item').onclick = () => {
      const s = DC.getSettings();
      s.nav.items.push({ id: 'new-page', label: 'NEW PAGE', visible: true });
      DC.saveSettings(s);
      this.renderNavigation();
    };
  },

  // ─── Payments ─────────────────────────────────────────────────────────────
  renderPayments() {
    const s = DC.getSettings();
    const p = s.payment;

    // Stripe
    document.getElementById('pay-stripe-enabled').checked = p.stripe.enabled;
    document.getElementById('pay-stripe-key').value = p.stripe.publicKey;
    // PayPal
    document.getElementById('pay-paypal-enabled').checked = p.paypal.enabled;
    document.getElementById('pay-paypal-id').value = p.paypal.clientId;
    // VNPay
    document.getElementById('pay-vnpay-enabled').checked = p.vnpay.enabled;
    document.getElementById('pay-vnpay-merchant').value = p.vnpay.merchantId;
    document.getElementById('pay-vnpay-secret').value = p.vnpay.hashSecret;
    // MoMo
    document.getElementById('pay-momo-enabled').checked = p.momo.enabled;
    document.getElementById('pay-momo-code').value = p.momo.partnerCode;

    // Show fields for enabled providers
    [['pay-stripe-enabled', 0], ['pay-paypal-enabled', 1], ['pay-vnpay-enabled', 2], ['pay-momo-enabled', 3]].forEach(([id, idx]) => {
      const cb = document.getElementById(id);
      if (cb && cb.checked) {
        const card = cb.closest('.payment-provider-card');
        if (card) card.querySelector('.pay-fields')?.classList.add('show');
      }
    });

    document.getElementById('btn-save-payments').onclick = () => this.savePayments();
  },

  savePayments() {
    const s = DC.getSettings();
    s.payment = {
      stripe: { enabled: document.getElementById('pay-stripe-enabled').checked, publicKey: document.getElementById('pay-stripe-key').value },
      paypal: { enabled: document.getElementById('pay-paypal-enabled').checked, clientId: document.getElementById('pay-paypal-id').value },
      vnpay: { enabled: document.getElementById('pay-vnpay-enabled').checked, merchantId: document.getElementById('pay-vnpay-merchant').value, hashSecret: document.getElementById('pay-vnpay-secret').value },
      momo:  { enabled: document.getElementById('pay-momo-enabled').checked, partnerCode: document.getElementById('pay-momo-code').value },
    };
    DC.saveSettings(s);
    this.toast('Payment settings saved!');
  },
};
