// ─── DAPPER COMBAT — Storefront App ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  currentPage: 'home',
  currentProduct: null,
  currentCourse: null,
  selectedSize: null,
  selectedColor: null,
  accountTab: 'orders',
  _pdSelectedColor: null,
  _pdQty: 1,
  _carouselIndex: 0,
  _carouselImages: [],

  init() {
    this.applySettings();
    this.initNav();
    this.initCart();
    this.initAuth();
    this.renderHome();
    this.navigate('home');
    window.addEventListener('popstate', () => this.handleHash());
    window.addEventListener('hashchange', () => this.handleHash());
  },

  // ─── Settings / Theme ────────────────────────────────────────────────────
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

    // Site name
    const logo = document.querySelectorAll('.site-name');
    logo.forEach(el => el.textContent = s.siteName);
    document.title = s.siteName;
  },

  // ─── Navigation ──────────────────────────────────────────────────────────
  initNav() {
    const s = DC.getSettings();
    const navLinks = document.getElementById('nav-links');
    const mobileNav = document.getElementById('mobile-nav');
    navLinks.innerHTML = '';
    mobileNav.innerHTML = '';

    s.nav.items.filter(i => i.visible).forEach(item => {
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = item.label;
      a.dataset.page = item.id;
      a.addEventListener('click', (e) => { e.preventDefault(); this.navigate(item.id); this.closeMobileNav(); });
      navLinks.appendChild(a);

      const ma = a.cloneNode(true);
      ma.addEventListener('click', (e) => { e.preventDefault(); this.navigate(item.id); this.closeMobileNav(); });
      mobileNav.appendChild(ma);
    });

    // Hamburger
    document.getElementById('hamburger').addEventListener('click', () => this.toggleMobileNav());

    // Scroll hide/show nav
    let lastY = 0;
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 100 && y > lastY) navbar.style.transform = 'translateY(-100%)';
      else navbar.style.transform = 'translateY(0)';
      lastY = y;
    });
  },

  navigate(page, data = null) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#nav-links a, #mobile-nav a').forEach(a => a.classList.remove('active'));

    this.currentPage = page;
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    // Set active nav
    document.querySelectorAll(`[data-page="${page}"]`).forEach(a => a.classList.add('active'));

    window.scrollTo(0, 0);

    // Render page content
    if (page === 'home') this.renderHome();
    if (page === 'shop') this.renderShop();
    if (page === 'courses') this.renderCourses();
    if (page === 'account') this.renderAccount();
    if (page === 'checkout') this.renderCheckout();
    if (page === 'product' && data) this.renderProduct(data);
  },

  toggleMobileNav() {
    document.getElementById('mobile-nav').classList.toggle('open');
  },
  closeMobileNav() {
    document.getElementById('mobile-nav').classList.remove('open');
  },

  handleHash() {
    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById('page-' + hash)) this.navigate(hash);
  },

  // ─── Home ────────────────────────────────────────────────────────────────
  renderHome() {
    const s = DC.getSettings();
    const products = DC.getProducts().filter(p => p.featured && p.visible);
    const courses = DC.getCourses().filter(c => c.featured && c.visible);

    // Hero
    document.getElementById('hero-headline').innerHTML = s.heroHeadline.replace(/\n/g, '<br>');
    document.getElementById('hero-subtext').textContent = s.heroSubtext;
    const heroMedia = document.getElementById('hero-media');
    if (s.heroMedia) {
      if (s.heroMediaType === 'video') {
        heroMedia.innerHTML = `<video src="${s.heroMedia}" autoplay muted loop playsinline></video>`;
      } else {
        heroMedia.innerHTML = `<img src="${s.heroMedia}" alt="Hero">`;
      }
    } else {
      heroMedia.innerHTML = `<div class="hero-placeholder">DC</div>`;
    }

    // Toggle sections
    document.getElementById('section-featured').style.display = s.sections.featuredVisible ? '' : 'none';
    document.getElementById('section-categories').style.display = s.sections.categoriesVisible ? '' : 'none';
    document.getElementById('section-course-promo').style.display = s.sections.coursePromoVisible ? '' : 'none';
    document.getElementById('section-newsletter').style.display = s.sections.newsletterVisible ? '' : 'none';

    // Featured products
    const grid = document.getElementById('featured-grid');
    grid.innerHTML = products.slice(0, 4).map(p => this.productCardHTML(p)).join('');
    this.attachProductCardEvents(grid);

    // Course promo
    if (courses.length) {
      const c = courses[0];
      document.getElementById('promo-course-title').textContent = c.title;
      document.getElementById('promo-course-desc').textContent = c.description;
    }
  },

  productCardHTML(p) {
    const imgContent = p.images && p.images[0]
      ? `<img src="${p.images[0]}" alt="${p.name}" onerror="this.parentNode.innerHTML='<div class=\\'product-placeholder-img\\'>${p.name.charAt(0)}</div>'">`
      : `<div class="product-placeholder-img">${p.name.charAt(0)}</div>`;

    return `<div class="product-card" data-product-id="${p.id}">
      <div class="product-card-img">
        ${imgContent}
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
      </div>
      <div class="product-card-info">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-sub">${p.colors ? p.colors.join(' / ') : ''}</div>
        <div class="product-card-price">
          ${DC.formatPrice(p.price)}
          ${p.originalPrice ? `<span class="price-original">${DC.formatPrice(p.originalPrice)}</span>` : ''}
        </div>
      </div>
    </div>`;
  },

  attachProductCardEvents(container) {
    container.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const p = DC.getProducts().find(p => p.id === card.dataset.productId);
        if (p) this.openProduct(p);
      });
    });
  },

  // ─── Shop ────────────────────────────────────────────────────────────────
  renderShop(filter = 'all') {
    let products = DC.getProducts().filter(p => p.visible);
    if (filter !== 'all') products = products.filter(p => p.category === filter);

    const grid = document.getElementById('shop-grid');
    grid.innerHTML = products.length
      ? products.map(p => this.productCardHTML(p)).join('')
      : '<div class="empty-state"><h3>NO PRODUCTS</h3><p>Check back soon.</p></div>';
    this.attachProductCardEvents(grid);

    // Filter buttons
    document.querySelectorAll('#shop-filters .filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
      btn.onclick = () => this.renderShop(btn.dataset.filter);
    });
  },

  // ─── Product Detail ──────────────────────────────────────────────────────
  openProduct(p) {
    this.currentProduct = p;
    this.selectedSize = null;
    this.selectedColor = null;
    this.navigate('product', p);
  },

  renderProduct(p) {
    document.getElementById('product-category').textContent = p.category.toUpperCase();
    document.getElementById('product-name').textContent = p.name;
    document.getElementById('product-price').innerHTML = DC.formatPrice(p.price) +
      (p.originalPrice ? ` <span class="price-original">${DC.formatPrice(p.originalPrice)}</span>` : '');
    document.getElementById('product-desc').textContent = p.description;

    // ── Gallery ──────────────────────────────────────────────────
    // Slot 2: Video
    const videoWrap = document.getElementById('gallery-video-wrap');
    const videos = (p.videos || []).filter(Boolean);
    if (videoWrap) {
      if (videos[0]) {
        videoWrap.innerHTML = `<video src="${videos[0]}" controls playsinline muted loop style="width:100%;height:100%;object-fit:cover"></video>`;
      } else {
        videoWrap.innerHTML = `<img src="/img/dc-mark.svg" alt="" id="gallery-video-placeholder" style="width:40%;opacity:0.06">`;
      }
    }
    // Slots 3–8: Static images
    const images = (p.images || []).filter(Boolean);
    for (let i = 0; i < 6; i++) {
      const slot = document.getElementById(`gallery-slot-${i + 3}`);
      if (!slot) continue;
      if (images[i]) {
        slot.innerHTML = `<img src="${images[i]}" alt="${p.name}" loading="lazy">`;
      } else {
        slot.innerHTML = `<div class="gallery-slot-empty"><img src="/img/dc-mark.svg" alt=""></div>`;
      }
    }
    // Slot 1: Carousel — init with first color's images
    const firstColor = (p.colors || [])[0] || '';
    this._carouselIndex = 0;
    this._carouselImages = ((p.colorImages || {})[firstColor] || []).filter(Boolean);
    this._renderCarousel();
    // Scroll gallery col to top
    const galleryCol = document.getElementById('product-gallery-col');
    if (galleryCol) galleryCol.scrollTop = 0;
    const infoCol = document.getElementById('product-info-col');
    if (infoCol) infoCol.scrollTop = 0;

    // Sizes
    const sizesEl = document.getElementById('product-sizes');
    sizesEl.innerHTML = (p.sizes || []).map(s =>
      `<button class="size-btn" data-size="${s}">${s}</button>`
    ).join('');
    sizesEl.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sizesEl.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedSize = btn.dataset.size;
      });
    });

    // Colors
    const colorMap = { BLACK: '#111', WHITE: '#eee', RED: '#c0392b', NAVY: '#1a2a4a', CHARCOAL: '#444', STONE: '#c4b49a', WASHED: '#555' };
    const swatchesEl = document.getElementById('product-colors');
    swatchesEl.innerHTML = (p.colors || []).map(c =>
      `<button class="color-swatch" data-color="${c}" style="background:${colorMap[c] || '#888'}" title="${c}"></button>`
    ).join('');
    // Set first color as selected by default
    if (firstColor) {
      const firstSwatch = swatchesEl.querySelector('.color-swatch');
      if (firstSwatch) firstSwatch.classList.add('active');
      this._pdSelectedColor = firstColor;
      this.selectedColor = firstColor;
      const pdColorLabel = document.getElementById('pd-selected-color');
      if (pdColorLabel) pdColorLabel.textContent = firstColor;
    }
    swatchesEl.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        this._pdSelectedColor = sw.dataset.color;
        this.selectedColor = sw.dataset.color;
        swatchesEl.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        const pdColorLabel = document.getElementById('pd-selected-color');
        if (pdColorLabel) pdColorLabel.textContent = this._pdSelectedColor;
        this._updateCarouselForColor(this._pdSelectedColor);
      });
    });

    // Add to cart button
    document.getElementById('btn-add-cart').onclick = () => this.addToCart();
  },

  addToCart() {
    if (!this.currentProduct) return;
    const size = this.selectedSize || (this.currentProduct.sizes ? this.currentProduct.sizes[0] : 'ONE SIZE');
    const color = this._pdSelectedColor || this.selectedColor || (this.currentProduct.colors ? this.currentProduct.colors[0] : 'BLACK');
    DC.addToCart(this.currentProduct.id, size, color);
    this.updateCartBadge();
    this.toast(`${this.currentProduct.name} added to cart`);
    this.openCart();
  },

  // ─── Courses ─────────────────────────────────────────────────────────────
  renderCourses() {
    const courses = DC.getCourses().filter(c => c.visible);
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = courses.map(c => this.courseCardHTML(c)).join('');
    grid.querySelectorAll('.course-card').forEach(card => {
      card.addEventListener('click', () => {
        const course = courses.find(c => c.id === card.dataset.courseId);
        if (course) this.openCourseModal(course);
      });
    });
  },

  courseCardHTML(c) {
    const thumbContent = c.thumbnail
      ? `<img src="${c.thumbnail}" alt="${c.title}"><div class="course-play">▶</div>`
      : `<div class="course-thumb-placeholder">${c.title.charAt(0)}</div><div class="course-play">▶</div>`;

    return `<div class="course-card" data-course-id="${c.id}">
      <div class="course-thumb">${thumbContent}</div>
      <div class="course-info">
        <div class="course-level">${c.level}</div>
        <div class="course-title">${c.title}</div>
        <div class="course-instructor">By ${c.instructor}</div>
        <div class="course-meta">
          <span>⏱ ${c.duration}</span>
          <span>👥 ${c.students} students</span>
          <span>📚 ${(c.lessons || []).length} lessons</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div class="course-price">${DC.formatPrice(c.price)}</div>
          <span class="tag">Enroll →</span>
        </div>
      </div>
    </div>`;
  },

  openCourseModal(course) {
    this.currentCourse = course;
    const modal = document.getElementById('course-modal');
    document.getElementById('course-modal-title').textContent = course.title;
    document.getElementById('course-modal-instructor').textContent = 'By ' + course.instructor;
    document.getElementById('course-modal-level').textContent = course.level;
    document.getElementById('course-modal-duration').textContent = course.duration;
    document.getElementById('course-modal-desc').textContent = course.description;
    document.getElementById('course-modal-price').textContent = DC.formatPrice(course.price);
    const lessonList = document.getElementById('course-modal-lessons');
    lessonList.innerHTML = (course.lessons || []).map((l, i) =>
      `<div class="lesson-item"><span class="lesson-num">${String(i+1).padStart(2,'0')}</span><span>${l}</span></div>`
    ).join('');
    modal.classList.add('open');
  },

  enrollCourse() {
    const user = DC.getCurrentUser();
    if (!user) {
      this.closeCourseModal();
      this.openAuth('login');
      this.toast('Please login to enroll', 'error');
      return;
    }
    if (!this.currentCourse) return;
    if (!user.enrolledCourses) user.enrolledCourses = [];
    if (!user.enrolledCourses.includes(this.currentCourse.id)) {
      user.enrolledCourses.push(this.currentCourse.id);
      DC.updateUser(user);
      this.toast(`Enrolled in ${this.currentCourse.title}!`);
    } else {
      this.toast('Already enrolled in this course');
    }
    this.closeCourseModal();
  },

  closeCourseModal() {
    document.getElementById('course-modal').classList.remove('open');
  },

  // ─── Carousel ────────────────────────────────────────────────────────────
  carouselNav(delta) {
    const imgs = this._carouselImages;
    if (!imgs.length) return;
    this._carouselIndex = (this._carouselIndex + delta + imgs.length) % imgs.length;
    this._renderCarousel();
  },

  _renderCarousel() {
    const wrap = document.getElementById('gallery-carousel-wrap');
    const dotsEl = document.getElementById('gallery-carousel-dots');
    if (!wrap) return;
    const imgs = this._carouselImages;
    if (!imgs.length) {
      wrap.innerHTML = `<div class="carousel-placeholder"><img src="/img/dc-mark.svg" alt=""></div>`;
      if (dotsEl) dotsEl.innerHTML = '';
      return;
    }
    wrap.innerHTML = imgs.map(url =>
      url ? `<img src="${url}" alt="product">` : `<div class="carousel-placeholder"><img src="/img/dc-mark.svg" alt=""></div>`
    ).join('');
    wrap.style.transform = `translateX(-${this._carouselIndex * 100}%)`;
    if (dotsEl) {
      dotsEl.innerHTML = imgs.map((_, i) =>
        `<div class="carousel-dot ${i === this._carouselIndex ? 'active' : ''}" onclick="App.carouselGoTo(${i})"></div>`
      ).join('');
    }
  },

  carouselGoTo(index) {
    this._carouselIndex = index;
    this._renderCarousel();
  },

  _updateCarouselForColor(color) {
    const p = this.currentProduct;
    if (!p) return;
    const colorImgs = (p.colorImages || {})[color] || [];
    this._carouselImages = colorImgs.filter(Boolean);
    this._carouselIndex = 0;
    this._renderCarousel();
  },

  // ─── Cart ─────────────────────────────────────────────────────────────────
  initCart() {
    document.getElementById('btn-cart').addEventListener('click', () => this.openCart());
    document.getElementById('cart-overlay').addEventListener('click', () => this.closeCart());
    document.getElementById('cart-close').addEventListener('click', () => this.closeCart());
    document.getElementById('btn-checkout').addEventListener('click', () => {
      this.closeCart();
      this.navigate('checkout');
    });
    this.updateCartBadge();
  },

  openCart() {
    this.renderCartDrawer();
    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
  },

  closeCart() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
  },

  renderCartDrawer() {
    const cart = DC.getCart();
    const products = DC.getProducts();
    const itemsEl = document.getElementById('cart-items');

    if (!cart.length) {
      itemsEl.innerHTML = '<div class="empty-state"><h3>CART EMPTY</h3><p>Add something</p></div>';
      document.getElementById('cart-total').textContent = DC.formatPrice(0);
      return;
    }

    itemsEl.innerHTML = cart.map(item => {
      const p = products.find(p => p.id === item.productId);
      if (!p) return '';
      const imgContent = p.images && p.images[0]
        ? `<img src="${p.images[0]}" alt="${p.name}">`
        : `<div style="background:var(--bg-card);width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-size:1.5rem;opacity:0.3">${p.name.charAt(0)}</div>`;
      return `<div class="cart-item">
        <div class="cart-item-img">${imgContent}</div>
        <div>
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-meta">${item.size} · ${item.color}</div>
          <div class="qty-control">
            <button class="qty-btn" data-key="${item.key}" data-action="dec">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" data-key="${item.key}" data-action="inc">+</button>
          </div>
          <button class="cart-remove" data-key="${item.key}">REMOVE</button>
        </div>
        <div class="cart-item-price">${DC.formatPrice(p.price * item.qty)}</div>
      </div>`;
    }).join('');

    document.getElementById('cart-total').textContent = DC.formatPrice(DC.cartTotal());

    // Events
    itemsEl.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cart = DC.getCart();
        const item = cart.find(i => i.key === btn.dataset.key);
        if (item) {
          const delta = btn.dataset.action === 'inc' ? 1 : -1;
          DC.updateCartQty(btn.dataset.key, item.qty + delta);
          this.updateCartBadge();
          this.renderCartDrawer();
        }
      });
    });
    itemsEl.querySelectorAll('.cart-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        DC.removeFromCart(btn.dataset.key);
        this.updateCartBadge();
        this.renderCartDrawer();
      });
    });
  },

  updateCartBadge() {
    const n = DC.cartCount();
    const badge = document.getElementById('cart-badge');
    badge.textContent = n;
    badge.classList.toggle('show', n > 0);
  },

  // ─── Auth ─────────────────────────────────────────────────────────────────
  initAuth() {
    const modal = document.getElementById('auth-modal');
    document.getElementById('btn-login').addEventListener('click', () => this.openAuth('login'));
    document.getElementById('auth-close').addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById('auth-form-' + tab.dataset.tab).classList.add('active');
      });
    });

    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Login form
    document.getElementById('form-login').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const result = DC.loginUser(email, pass);
      const errEl = document.getElementById('login-error');
      if (result.error) {
        errEl.textContent = result.error;
        errEl.classList.add('show');
      } else {
        errEl.classList.remove('show');
        modal.classList.remove('open');
        this.updateAuthNav();
        this.toast('Welcome back, ' + result.user.name + '!');
      }
    });

    // Register form
    document.getElementById('form-register').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const pass = document.getElementById('reg-password').value;
      const role = document.querySelector('.role-btn.active')?.dataset.role || 'customer';
      const result = DC.registerUser({ name, email, password: pass, role });
      const errEl = document.getElementById('reg-error');
      if (result.error) {
        errEl.textContent = result.error;
        errEl.classList.add('show');
      } else {
        DC.loginUser(email, pass);
        modal.classList.remove('open');
        this.updateAuthNav();
        this.toast('Account created! Welcome, ' + name + '!');
      }
    });

    this.updateAuthNav();
  },

  openAuth(tab = 'login') {
    document.getElementById('auth-modal').classList.add('open');
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.toggle('active', f.id === 'auth-form-' + tab));
  },

  updateAuthNav() {
    const user = DC.getCurrentUser();
    const btn = document.getElementById('btn-login');
    if (user) {
      btn.innerHTML = `<span style="font-family:var(--font-heading);font-size:0.85rem;letter-spacing:0.1em">${user.name.split(' ')[0].toUpperCase()}</span>`;
      btn.onclick = () => this.navigate('account');
    } else {
      btn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      btn.onclick = () => this.openAuth('login');
    }
  },

  // ─── Account ─────────────────────────────────────────────────────────────
  renderAccount() {
    const user = DC.getCurrentUser();
    if (!user) { this.openAuth('login'); this.navigate('home'); return; }

    document.getElementById('account-name').textContent = user.name;
    document.getElementById('account-email').textContent = user.email;
    document.getElementById('account-role').textContent = user.role.toUpperCase();

    // Orders tab
    const orders = DC.getOrders().filter(o => o.userId === user.id);
    const ordersEl = document.getElementById('account-orders');
    ordersEl.innerHTML = orders.length
      ? orders.map(o => `<div class="cart-item" style="grid-template-columns:1fr auto">
          <div>
            <div class="cart-item-name">Order #${o.id}</div>
            <div class="cart-item-meta">${new Date(o.date).toLocaleDateString()}</div>
          </div>
          <div class="cart-item-price">${DC.formatPrice(o.total)}</div>
        </div>`).join('')
      : '<div class="empty-state"><h3>NO ORDERS</h3><p>Start shopping to see orders here.</p></div>';

    // Courses tab
    const enrolled = (user.enrolledCourses || []);
    const courses = DC.getCourses().filter(c => enrolled.includes(c.id));
    const coursesEl = document.getElementById('account-courses');
    coursesEl.innerHTML = courses.length
      ? courses.map(c => `<div class="cart-item" style="grid-template-columns:1fr auto">
          <div>
            <div class="cart-item-name">${c.title}</div>
            <div class="cart-item-meta">${c.instructor} · ${c.duration}</div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="App.navigate('courses')">VIEW</button>
        </div>`).join('')
      : '<div class="empty-state"><h3>NO COURSES</h3><p>Enroll in a course to get started.</p></div>';

    // Profile tab
    document.getElementById('profile-name').value = user.name;
    document.getElementById('profile-email').value = user.email;

    // Tab navigation
    document.querySelectorAll('.account-nav-item[data-tab]').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.account-nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.account-tab').forEach(t => t.classList.remove('active'));
        item.classList.add('active');
        document.getElementById('account-tab-' + item.dataset.tab).classList.add('active');
      });
    });

    // Logout
    document.getElementById('btn-logout').onclick = () => {
      DC.logout();
      this.updateAuthNav();
      this.navigate('home');
      this.toast('Logged out');
    };

    // Profile save
    document.getElementById('form-profile').onsubmit = (e) => {
      e.preventDefault();
      user.name = document.getElementById('profile-name').value;
      DC.updateUser(user);
      this.toast('Profile updated');
    };
  },

  // ─── Checkout ────────────────────────────────────────────────────────────
  renderCheckout() {
    const cart = DC.getCart();
    const products = DC.getProducts();
    const s = DC.getSettings();

    if (!cart.length) {
      this.navigate('shop');
      this.toast('Cart is empty', 'error');
      return;
    }

    // Order summary
    const summaryEl = document.getElementById('checkout-summary');
    summaryEl.innerHTML = cart.map(item => {
      const p = products.find(p => p.id === item.productId);
      return p ? `<div class="order-summary-item">
        <span>${p.name} (${item.size}) x${item.qty}</span>
        <span>${DC.formatPrice(p.price * item.qty)}</span>
      </div>` : '';
    }).join('');
    document.getElementById('checkout-total').textContent = DC.formatPrice(DC.cartTotal());

    // Payment tabs
    const enabledMethods = [];
    if (s.payment.stripe.enabled) enabledMethods.push({ id: 'stripe', label: 'CREDIT CARD' });
    if (s.payment.paypal.enabled) enabledMethods.push({ id: 'paypal', label: 'PAYPAL' });
    if (s.payment.vnpay.enabled) enabledMethods.push({ id: 'vnpay', label: 'VNPAY' });
    if (s.payment.momo.enabled) enabledMethods.push({ id: 'momo', label: 'MOMO' });
    if (!enabledMethods.length) enabledMethods.push({ id: 'cod', label: 'CASH ON DELIVERY' });

    const tabsEl = document.getElementById('payment-tabs');
    const panelsEl = document.getElementById('payment-panels');
    tabsEl.innerHTML = enabledMethods.map((m, i) =>
      `<button class="payment-tab ${i===0?'active':''}" data-method="${m.id}">${m.label}</button>`
    ).join('');
    panelsEl.innerHTML = enabledMethods.map((m, i) =>
      `<div class="payment-panel ${i===0?'active':''}" id="panel-${m.id}">${this.paymentPanelHTML(m.id, s)}</div>`
    ).join('');

    tabsEl.querySelectorAll('.payment-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        tabsEl.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
        panelsEl.querySelectorAll('.payment-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.method).classList.add('active');
      });
    });

    // Place order
    document.getElementById('btn-place-order').onclick = () => this.placeOrder();
  },

  paymentPanelHTML(method, s) {
    if (method === 'stripe') {
      return `<div class="form-group"><label>Card Number</label><input placeholder="1234 5678 9012 3456"></div>
        <div class="form-row">
          <div class="form-group"><label>Expiry</label><input placeholder="MM/YY"></div>
          <div class="form-group"><label>CVV</label><input placeholder="123"></div>
        </div>
        <div class="form-group"><label>Cardholder Name</label><input placeholder="John Doe"></div>
        <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem">Secured by Stripe</p>`;
    }
    if (method === 'paypal') {
      return `<div style="text-align:center;padding:2rem">
        <div style="font-size:2rem;margin-bottom:1rem">🅿️</div>
        <p style="color:var(--text-muted);margin-bottom:1rem">You will be redirected to PayPal to complete your purchase.</p>
        </div>`;
    }
    if (method === 'vnpay') {
      return `<div style="text-align:center;padding:2rem">
        <div style="font-size:2rem;margin-bottom:1rem">🏦</div>
        <p style="color:var(--text-muted);margin-bottom:1rem">Thanh toán qua VNPay. Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay.</p>
        </div>`;
    }
    if (method === 'momo') {
      return `<div style="text-align:center;padding:2rem">
        <div style="font-size:2rem;margin-bottom:1rem">💜</div>
        <p style="color:var(--text-muted);margin-bottom:1rem">Thanh toán qua Ví MoMo.</p>
        </div>`;
    }
    return `<div style="text-align:center;padding:2rem">
      <p style="color:var(--text-muted)">Pay cash upon delivery.</p>
    </div>`;
  },

  placeOrder() {
    const user = DC.getCurrentUser();
    const order = {
      id: DC.genId('ord'),
      userId: user ? user.id : 'guest',
      items: DC.getCart(),
      total: DC.cartTotal(),
      date: Date.now(),
      status: 'pending',
    };
    DC.saveOrder(order);
    DC.clearCart();
    this.updateCartBadge();
    this.toast('Order placed successfully! #' + order.id);
    this.navigate('home');
  },

  // ─── Toast ────────────────────────────────────────────────────────────────
  toast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast${type === 'error' ? ' error' : ''}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  },
};
