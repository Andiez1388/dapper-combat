// ─── DAPPER COMBAT — Storefront App ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  window.App = App;
  window.addEventListener('message', (e) => {
    if (e.data && e.data.navigate) App.navigate(e.data.navigate);
    if (e.data && e.data.type === 'reload-settings') {
      DC.loadAll().then(() => { App.applySettings(); App.navigate(App.currentPage); });
    }
  });
});

const App = {
  currentPage: 'home',
  currentProduct: null,
  currentCourse: null,
  currentLesson: 0,
  selectedSize: null,
  selectedColor: null,

  async init() {
    try {
      await DC.loadAll();
    } catch(e) {
      console.error('Failed to load data:', e);
    }
    this.applySettings();
    if (window.I18N) I18N.init();
    this.initNav();
    this.initCart();
    this.initAuth();
    this.initBackToTop();
    const initPage = window.location.hash.slice(1) || 'home';
    this.navigate(['home','shop','courses','account','checkout','product','learn','course-pay'].includes(initPage) ? initPage : 'home');
  },

  initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400), { passive: true });
  },

  // ─── Theme ───────────────────────────────────────────────────────────────
  applySettings() {
    const s = DC.getSettings();
    const r = document.documentElement.style;
    const c = s.colors;
    r.setProperty('--bg', c.bg);
    r.setProperty('--bg-secondary', c.bgSecondary);
    r.setProperty('--bg-card', c.bgCard);
    r.setProperty('--text', c.text);
    r.setProperty('--text-muted', c.textMuted);
    r.setProperty('--accent', c.accent);
    r.setProperty('--accent-red', c.accentRed);
    r.setProperty('--border', c.border);
    r.setProperty('--btn-text', c.btnText);
    r.setProperty('--font-heading', s.fonts.heading);
    r.setProperty('--font-heading-viet', s.fonts.headingViet || "'Be Vietnam Pro', 'Inter', sans-serif");
    r.setProperty('--font-body', s.fonts.body);
    r.setProperty('--btn-radius', s.layout.btnRadius);
    r.setProperty('--card-radius', s.layout.cardRadius);
    r.setProperty('--nav-height', s.layout.navHeight);
    document.querySelectorAll('.site-name').forEach(el => el.textContent = s.siteName);
    document.title = s.siteName;
    // Footer copyright / tagline
    const cpEl = document.getElementById('footer-copyright');
    if (cpEl && s.footerCopyright) cpEl.textContent = s.footerCopyright;
    const tlEl = document.querySelector('.footer-bottom-right');
    if (tlEl && s.footerTagline) tlEl.textContent = s.footerTagline;
    this.applyLogos(s);
    this.renderAnnouncementBar(s);
    this.renderPromoPopup(s);
  },

  renderPromoPopup(s) {
    const cfg = s.promoPopup || {};
    if (!cfg.enabled) return;

    const overlay = document.getElementById('promo-popup-overlay');
    if (!overlay || overlay.dataset.initialized) return;
    overlay.dataset.initialized = '1';

    // Fill content
    const el = (id) => document.getElementById(id);
    if (cfg.imageUrl) {
      const img = el('promo-img');
      const ph  = el('promo-img-placeholder');
      if (img) { img.src = cfg.imageUrl; img.style.display = 'block'; }
      if (ph) ph.style.display = 'none';
    }
    if (cfg.discount && el('promo-discount'))   el('promo-discount').innerHTML = cfg.discount.replace(/\n/g,'<br>');
    if (cfg.code && el('promo-code-value'))      el('promo-code-value').textContent = cfg.code;
    if (cfg.code && el('promo-success-code'))    el('promo-success-code').textContent = cfg.code;
    if (cfg.copyBtnText && el('promo-copy-btn')) el('promo-copy-btn').textContent = cfg.copyBtnText;
    if (cfg.formTitle && el('promo-form-title')) el('promo-form-title').textContent = cfg.formTitle;
    if (cfg.formSub && el('promo-form-sub'))     el('promo-form-sub').textContent = cfg.formSub;
    if (cfg.submitText && el('promo-submit-btn'))el('promo-submit-btn').textContent = cfg.submitText;

    // Close handlers
    el('promo-close').onclick = () => this.closePromoPopup();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closePromoPopup(); });

    // Show after delay
    const delay = typeof cfg.delayMs === 'number' ? cfg.delayMs : 1500;
    const shown = sessionStorage.getItem('promo-shown');
    if (!shown) {
      setTimeout(() => {
        overlay.classList.add('active');
        sessionStorage.setItem('promo-shown', '1');
      }, delay);
    }
  },

  closePromoPopup() {
    const overlay = document.getElementById('promo-popup-overlay');
    if (overlay) overlay.classList.remove('active');
  },

  copyPromoCode() {
    const code = document.getElementById('promo-code-value')?.textContent || '';
    navigator.clipboard.writeText(code).catch(() => {});
    const btn = document.getElementById('promo-copy-btn');
    if (btn) { btn.textContent = 'ĐÃ SAO CHÉP ✓'; setTimeout(() => btn.textContent = (DC.getSettings().promoPopup?.copyBtnText || 'SAO CHÉP MÃ'), 2000); }
  },

  submitPromoForm(e) {
    e.preventDefault();
    document.getElementById('promo-form').style.display = 'none';
    document.getElementById('promo-success').style.display = 'flex';
  },

  renderPricingSection(s) {
    const section = document.getElementById('section-pricing');
    if (!section) return;
    const pr = s.pricing || {};
    if (!pr.enabled || !pr.plans?.length) {
      section.classList.add('hidden');
      return;
    }
    section.classList.remove('hidden');
    document.getElementById('pricing-title').textContent = pr.title || 'PRICING';
    document.getElementById('pricing-eyebrow').textContent = pr.eyebrow || 'CHOOSE YOUR PLAN';

    const grid = document.getElementById('pricing-grid');
    grid.innerHTML = pr.plans.map(plan => {
      const isFeatured = !!plan.featured;
      const featureRows = (plan.features || []).map(f => {
        const included = f.included !== false;
        const checkIcon = included
          ? `<svg class="pricing-check pricing-check-yes" viewBox="0 0 16 16" fill="none"><polyline points="2,8 6,12 14,4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
          : `<svg class="pricing-check pricing-check-no" viewBox="0 0 16 16" fill="none"><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
        return `<li class="pricing-feature${included ? '' : ' excluded'}">${checkIcon}<span>${f.text}</span></li>`;
      }).join('');

      return `<div class="pricing-card${isFeatured ? ' featured' : ''}">
        ${isFeatured && plan.featuredLabel ? `<div class="pricing-featured-badge">${plan.featuredLabel}</div>` : ''}
        <div class="pricing-tier">${plan.tier || ''}</div>
        <div class="pricing-name">${plan.name || ''}</div>
        <div class="pricing-price">${plan.price || ''}<span class="pricing-price-currency">${plan.currency || ''}</span></div>
        <div class="pricing-billing">${plan.billing || ''}</div>
        <ul class="pricing-features">${featureRows}</ul>
        <div class="pricing-cta">
          <a href="${plan.ctaLink || '#'}" class="btn ${isFeatured ? 'btn-primary' : 'btn-secondary'} btn-lg">${plan.ctaText || 'GET STARTED'}</a>
        </div>
      </div>`;
    }).join('');
  },

  renderScheduleSection(s) {
    const section = document.getElementById('section-schedule');
    if (!section) return;
    const sch = s.schedule || {};
    if (!sch.enabled || !sch.imageUrl) {
      section.classList.add('hidden');
      return;
    }
    section.classList.remove('hidden');
    const titleEl = document.getElementById('schedule-section-title');
    if (titleEl) titleEl.textContent = sch.title || 'LỊCH HỌC';
    const subEl = document.getElementById('schedule-section-subtitle');
    if (subEl) {
      subEl.textContent = sch.subtitle || '';
      subEl.style.display = sch.subtitle ? '' : 'none';
    }
    const imgEl = document.getElementById('schedule-img');
    if (imgEl) imgEl.src = sch.imageUrl;
  },

  renderAnnouncementBar(s) {
    const bar = document.getElementById('announcement-bar');
    if (!bar) return;
    const ann = s.announcementBar || {};
    if (!ann.enabled || !ann.text) {
      bar.classList.add('hidden');
      document.documentElement.style.setProperty('--bar-offset', '0px');
      return;
    }
    bar.classList.remove('hidden');
    bar.style.background = ann.bgColor  || '#0d0d0d';
    bar.style.color      = ann.textColor || '#ffffff';

    // Split messages by | separator
    const messages = ann.text.split('|').map(m => m.trim()).filter(Boolean);
    const messages2 = (ann.text2 || '').split('|').map(m => m.trim()).filter(Boolean);
    const msgs2 = messages2.length ? messages2 : messages;

    const buildItems = (list) => list.map(m =>
      `<span class="ann-ticker-item"><span class="ann-ticker-diamond">◆</span>${m}</span>`
    ).join('');

    // Row 1
    const track = document.getElementById('ann-ticker-track');
    if (track) {
      track.innerHTML = buildItems(messages) + buildItems(messages);
      const totalChars = messages.join('').length;
      track.style.animationDuration = Math.max(10, Math.min(40, totalChars * 0.28)) + 's';
    }
    // Row 2
    const track2 = document.getElementById('ann-ticker-track-2');
    if (track2) {
      track2.innerHTML = buildItems(msgs2) + buildItems(msgs2);
      const totalChars2 = msgs2.join('').length;
      track2.style.animationDuration = Math.max(10, Math.min(40, totalChars2 * 0.28)) + 's';
    }

    document.documentElement.style.setProperty('--bar-offset', '70px');
    const closeBtn = document.getElementById('ann-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        bar.classList.add('hidden');
        document.documentElement.style.setProperty('--bar-offset', '0px');
      };
    }
  },

  applyLogos(s) {
    const mark = s.logoMark || '/img/dc-mark.svg';
    const full = s.logoFull  || '/img/dc-logo.svg';
    // Navbar logo mark
    document.querySelectorAll('.nav-logo-img').forEach(el => el.src = mark);
    // Hero watermark
    document.querySelectorAll('.hero-watermark img').forEach(el => el.src = mark);
    // Footer logo
    document.querySelectorAll('.footer-logo').forEach(el => el.src = full);
    // Favicon
    if (s.faviconUrl) {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = s.faviconUrl;
    }
    // CSS watermark for product placeholder & category banners
    let styleEl = document.getElementById('dc-logo-style');
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'dc-logo-style'; document.head.appendChild(styleEl); }
    styleEl.textContent = `.product-placeholder-img::after { background-image: url('${mark}') !important; }`;
  },

  // ─── Navigation ──────────────────────────────────────────────────────────
  initNav() {
    const s = DC.getSettings();
    const navLinks = document.getElementById('nav-links');
    const mobileNav = document.getElementById('mobile-nav');
    navLinks.innerHTML = '';
    mobileNav.innerHTML = '';

    s.nav.items.filter(i => i.visible).forEach(item => {
      const makeLink = () => {
        const a = document.createElement('a');
        a.href = '#'; a.textContent = (window.I18N ? I18N.t('nav.' + item.id) : null) || item.label; a.dataset.page = item.id;
        a.addEventListener('click', (e) => { e.preventDefault(); this.navigate(item.id); this.closeMobileNav(); });
        return a;
      };
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.appendChild(makeLink());
      navLinks.appendChild(li);
      mobileNav.appendChild(makeLink());
    });

    // Mega menu for SHOP
    const shopNavItem = navLinks.querySelector('[data-page="shop"]')?.parentElement;
    if (shopNavItem) {
      shopNavItem.classList.add('has-mega');
      const mega = document.createElement('div');
      mega.className = 'mega-menu';
      mega.innerHTML = `
        <div class="mega-inner">
          <div class="mega-col mega-col-quick">
            <div class="mega-label">SHOP</div>
            <a class="mega-link featured" data-page="shop" data-filter="">SHOP ALL</a>
            <a class="mega-link featured" data-page="shop" data-filter="featured">BEST SELLERS</a>
            <a class="mega-link featured" data-page="shop" data-filter="new">NEW ARRIVALS</a>
          </div>
          <div class="mega-col">
            <div class="mega-label">CATEGORIES</div>
            <a class="mega-link" data-page="shop" data-filter="apparel">CLOTHING</a>
            <a class="mega-link" data-page="shop" data-filter="gloves">GLOVES</a>
            <a class="mega-link" data-page="shop" data-filter="equipment">EQUIPMENT</a>
            <a class="mega-link" data-page="shop" data-filter="accessories">ACCESSORIES</a>
          </div>
          <div class="mega-col mega-col-feature">
            <div class="mega-feature-img" style="background:var(--bg-secondary);height:180px;display:flex;align-items:center;justify-content:center">
              <span style="font-family:var(--font-heading);font-size:2.5rem;letter-spacing:0.1em;color:var(--accent)">DAPPER<br>COMBAT</span>
            </div>
            <div style="margin-top:0.75rem;font-size:0.75rem;color:var(--text-muted)">AUTUMN '26 COLLECTION</div>
          </div>
        </div>
      `;
      shopNavItem.appendChild(mega);
      // Wire up mega links
      mega.querySelectorAll('[data-page]').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const filter = a.dataset.filter;
          this._shopFilter = filter || 'all';
          this.navigate('shop');
          shopNavItem.classList.remove('mega-open');
        });
      });
      // Hover open/close with delay so cursor can travel to mega menu
      let megaCloseTimer = null;
      const openMega  = () => { clearTimeout(megaCloseTimer); shopNavItem.classList.add('mega-open'); };
      const closeMega = () => { megaCloseTimer = setTimeout(() => shopNavItem.classList.remove('mega-open'), 150); };
      shopNavItem.addEventListener('mouseenter', openMega);
      shopNavItem.addEventListener('mouseleave', closeMega);
      mega.addEventListener('mouseenter', openMega);
      mega.addEventListener('mouseleave', closeMega);
    }

    // Mobile nav bottom actions
    const mobileActions = document.createElement('div');
    mobileActions.id = 'mobile-nav-actions';
    mobileActions.style.cssText = 'margin-top:auto;padding-top:2rem;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:0.75rem';
    mobileNav.appendChild(mobileActions);
    this.updateMobileNavAuth();

    document.getElementById('hamburger').addEventListener('click', () => this.toggleMobileNav());

    document.addEventListener('click', (e) => {
      const nav = document.getElementById('mobile-nav');
      const hamburger = document.getElementById('hamburger');
      if (nav.classList.contains('open') && !nav.contains(e.target) && !hamburger.contains(e.target)) {
        this.closeMobileNav();
      }
    });

    let lastY = 0;
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      navbar.style.transform = (y > 100 && y > lastY) ? 'translateY(-100%)' : 'translateY(0)';
      lastY = y;
    });
  },

  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#nav-links a, #mobile-nav a').forEach(a => a.classList.remove('active'));
    this.currentPage = page;
    if (window.location.hash.slice(1) !== page) history.replaceState(null, '', '#' + page);
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    document.querySelectorAll(`[data-page="${page}"]`).forEach(a => a.classList.add('active'));
    window.scrollTo(0, 0);

    if (page === 'home')     this.renderHome();
    if (page === 'shop')     this.renderShop(null);
    if (page === 'courses')  this.renderCourses();
    if (page === 'account')  this.renderAccount();
    if (page === 'checkout') this.renderCheckout();
    if (page === 'learn')    this.renderLearn();
    if (page === 'course-pay')  this.renderCoursePayment();
    if (page === 'product')  this.renderProductDetail();
  },

  toggleMobileNav() { document.getElementById('mobile-nav').classList.toggle('open'); },
  closeMobileNav()  { document.getElementById('mobile-nav').classList.remove('open'); },

  // ─── Home ────────────────────────────────────────────────────────────────
  renderHome() {
    const s = DC.getSettings();
    const products = DC.getProducts().filter(p => p.featured && p.visible);
    const courses  = DC.getCourses().filter(c => c.featured && c.visible);

    document.getElementById('hero-headline').innerHTML = s.heroHeadline.replace(/\\n|\n/g, '<br>');
    document.getElementById('hero-subtext').textContent = s.heroSubtext;

    // Hero promo card
    const hp = s.heroPromo || {};
    const hpcEl = document.getElementById('hero-promo-card');
    const heroSubtextEl = document.getElementById('hero-subtext');
    const heroActionsEl = document.querySelector('#hero .hero-actions');
    if (hp.enabled && hpcEl) {
      hpcEl.style.display = '';
      if (heroSubtextEl) heroSubtextEl.style.display = 'none';
      if (heroActionsEl) heroActionsEl.style.display = 'none';
      const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || ''; };
      setT('hpc-tag',      hp.tag);
      setT('hpc-headline', hp.headline);
      setT('hpc-perks',    hp.perk);
      setT('hpc-badge',    hp.audienceLabel);
      setT('hpc-deadline', hp.deadline);
      const ctaEl = document.getElementById('hpc-cta');
      if (ctaEl) { ctaEl.textContent = hp.ctaText || 'XEM ƯU ĐÃI →'; ctaEl.href = hp.ctaLink || '#'; }
      const pricingEl = document.getElementById('hpc-pricing');
      if (pricingEl && hp.pricing && hp.pricing.length) {
        pricingEl.innerHTML = hp.pricing.map(p =>
          `<span>${p.label} <strong>${p.price}</strong><del>${p.originalPrice}</del></span>`
        ).join('<span class="hpc-sep">·</span>') + `<span class="hpc-unit">${hp.pricingUnit || ''}</span>`;
      }
    } else if (hpcEl) {
      hpcEl.style.display = 'none';
      if (heroSubtextEl) heroSubtextEl.style.display = '';
      if (heroActionsEl) heroActionsEl.style.display = '';
    }

    const heroMedia = document.getElementById('hero-media');
    if (heroMedia) {
      if (s.heroMedia) {
        heroMedia.innerHTML = s.heroMediaType === 'video'
          ? `<video src="${s.heroMedia}" autoplay muted loop playsinline></video>`
          : `<img src="${s.heroMedia}" alt="Hero">`;
      } else {
        heroMedia.innerHTML = `<div class="hero-placeholder">DC</div>`;
      }
    }

    // Philosophy section
    const ph = s.philosophy || {};
    const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || ''; };
    setT('philosophy-eyebrow', ph.eyebrow);
    const phHeadEl = document.getElementById('philosophy-headline');
    if (phHeadEl) phHeadEl.innerHTML = (ph.headline || '').replace(/\n/g, '<br>');
    const phBodyEl = document.getElementById('philosophy-body');
    if (phBodyEl) phBodyEl.innerHTML = (ph.body || '').replace(/\n\n/g, '</p><p>');

    // Instructor stats section
    const inst = s.instructor || {};
    setT('instructor-eyebrow', inst.eyebrow);
    setT('instructor-name', inst.name);
    setT('instructor-title', inst.title);
    setT('instructor-bio', inst.bio);
    const photoEl = document.getElementById('instructor-photo');
    if (photoEl && inst.photo) { photoEl.src = inst.photo; photoEl.alt = inst.name || 'Head Coach'; }
    const credsEl = document.getElementById('instructor-credentials');
    if (credsEl && inst.credentials) {
      credsEl.innerHTML = inst.credentials.map(c =>
        `<span class="instructor-cred-tag">${c}</span>`
      ).join('');
    }
    const statsEl = document.getElementById('instructor-stats');
    if (statsEl && inst.stats) {
      statsEl.innerHTML = inst.stats.map(stat =>
        `<div class="instructor-stat">
          <div class="instructor-stat-value">${stat.value}</div>
          <div class="instructor-stat-label">${stat.label}</div>
        </div>`
      ).join('');
    }

    // Gallery 4 images/videos
    const gallery = s.galleryImages || [];
    const gallerySection = document.getElementById('section-gallery4');
    const hasImages = gallery.some(g => g.url);
    if (gallerySection) gallerySection.style.display = hasImages ? '' : 'none';
    if (hasImages) {
      document.querySelectorAll('.gallery4-item').forEach((item, i) => {
        const g = gallery[i];
        if (!g?.url) { item.style.display = 'none'; return; }
        item.style.display = '';
        if (g.type === 'video') {
          item.innerHTML = `<video src="${g.url}" autoplay muted loop playsinline></video>`;
        } else {
          const img = item.querySelector('img') || document.createElement('img');
          img.src = g.url; img.alt = g.alt || '';
          if (!item.querySelector('img')) item.appendChild(img);
        }
      });
    }

    const setVis = (id, visible) => { const el = document.getElementById(id); if (el) el.style.display = visible ? '' : 'none'; };
    setVis('section-featured',    s.sections.featuredVisible);
    setVis('section-categories',  s.sections.categoriesVisible);
    setVis('section-course-promo',s.sections.coursePromoVisible);
    setVis('section-newsletter',  s.sections.newsletterVisible);

    // Video banner
    const vb = s.videoBanner || {};
    const vbSection = document.getElementById('section-video-banner');
    if (vb.visible === false) {
      vbSection.style.display = 'none';
    } else {
      vbSection.style.display = '';
      const vbMedia = document.getElementById('vbanner-media');
      if (vb.mediaUrl) {
        vbMedia.innerHTML = vb.mediaType === 'video'
          ? `<video src="${vb.mediaUrl}" autoplay muted loop playsinline></video>`
          : `<img src="${vb.mediaUrl}" alt="Banner">`;
      } else {
        vbMedia.innerHTML = '';
      }
    }

    // Apply category banner images from settings
    if (s.categoryImages) {
      ['apparel','equipment','gloves','courses'].forEach(cat => {
        if (!s.categoryImages[cat]) return;
        const banner = document.querySelector(`.category-banner[data-cat="${cat}"]`);
        if (!banner) return;
        const placeholder = banner.querySelector('.category-banner-placeholder');
        if (placeholder) {
          placeholder.style.backgroundImage = `url('${s.categoryImages[cat]}')`;
          placeholder.style.backgroundSize = 'cover';
          placeholder.style.backgroundPosition = 'center';
        }
      });
    }

    const grid = document.getElementById('featured-grid');
    const stripProducts = products.length ? products : DC.getProducts().filter(p => p.visible !== false).slice(0, 4);
    grid.innerHTML = stripProducts.slice(0, 4).map(p => this.featuredStripCardHTML(p)).join('');
    this.attachProductCardEvents(grid);

    // Video banner 2 (below product strip)
    const vb2 = s.videoBanner2 || {};
    const vb2Section = document.getElementById('section-video-banner-2');
    if (vb2Section) {
      vb2Section.style.display = vb2.visible === false ? 'none' : '';
      const vb2Media = document.getElementById('vbanner2-media');
      if (vb2Media && vb2.mediaUrl) {
        vb2Media.innerHTML = vb2.mediaType === 'video'
          ? `<video src="${vb2.mediaUrl}" autoplay muted loop playsinline></video>`
          : `<img src="${vb2.mediaUrl}" alt="Banner">`;
      }
    }

    // Duo images section
    const duo = s.duoImages || {};
    const duoSection = document.getElementById('section-duo-images');
    if (duoSection) {
      duoSection.style.display = duo.visible === false ? 'none' : '';
      const applyPanel = (side) => {
        const d = duo[side] || {};
        const bg = document.getElementById(`duo-bg-${side}`);
        const panel = document.getElementById(`duo-panel-${side}`);
        if (bg && d.imageUrl) bg.style.backgroundImage = `url('${d.imageUrl}')`;
      };
      applyPanel('left');
      applyPanel('right');
    }

    // Course promo
    if (courses.length) {
      document.getElementById('promo-course-title').textContent = courses[0].title;
      document.getElementById('promo-course-desc').textContent  = courses[0].description;
    }

    // Category panel images (new full-width panels)
    if (s.categoryImages) {
      ['apparel','equipment','gloves','accessories'].forEach(cat => {
        if (!s.categoryImages[cat]) return;
        const panel = document.querySelector(`.category-panel[data-cat="${cat}"] .cat-panel-img`);
        if (!panel) return;
        let img = panel.querySelector('img');
        if (!img) { img = document.createElement('img'); img.alt = cat; panel.appendChild(img); }
        img.src = s.categoryImages[cat];
      });
    }

    // Social links
    const soc = s.social || {};
    const setLink = (id, url) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (url) { el.href = url; el.style.display = ''; }
      else el.style.display = 'none';
    };
    setLink('social-facebook',  soc.facebook);
    setLink('social-instagram', soc.instagram);
    setLink('social-youtube',   soc.youtube);
    setLink('social-zalo',      soc.zalo);
    setLink('social-messenger', soc.messenger);

    // Hotline
    const hotlineEl  = document.getElementById('footer-hotline');
    const hotlineLnk = document.getElementById('footer-hotline-link');
    if (soc.hotline && hotlineEl && hotlineLnk) {
      hotlineEl.style.display = '';
      hotlineLnk.href = 'tel:' + soc.hotline.replace(/\s/g, '');
      hotlineLnk.textContent = soc.hotline;
    } else if (hotlineEl) {
      hotlineEl.style.display = 'none';
    }

    // Address
    const addrEl = document.getElementById('footer-address');
    if (addrEl) {
      if (s.address) { addrEl.textContent = s.address; addrEl.style.display = ''; }
      else addrEl.style.display = 'none';
    }

    // Map embed
    const mapSection = document.getElementById('footer-map-section');
    const mapWrap    = document.getElementById('footer-map-wrap');
    if (mapSection && mapWrap) {
      if (s.mapEmbed) {
        mapWrap.innerHTML = `<iframe src="${s.mapEmbed}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
        mapSection.style.display = '';
      } else {
        mapSection.style.display = 'none';
      }
    }

    // Floating buttons
    setLink('float-zalo',      soc.zalo);
    setLink('float-messenger', soc.messenger);
    const floatPhone = document.getElementById('float-phone');
    const floatPhoneLabel = document.getElementById('float-phone-label');
    if (soc.hotline && floatPhone) {
      floatPhone.href = 'tel:' + soc.hotline.replace(/\s/g, '');
      floatPhone.style.display = '';
      if (floatPhoneLabel) floatPhoneLabel.textContent = soc.hotline;
    } else if (floatPhone) {
      floatPhone.style.display = 'none';
    }

    // Course CTA Banner
    const cta = s.courseCTA || {};
    const ctaSection = document.getElementById('section-course-cta-banner');
    if (ctaSection) ctaSection.style.display = cta.enabled === false ? 'none' : '';
    const setCtaEl = (sel, val, html) => {
      const el = document.querySelector(sel);
      if (el && val) { if (html) el.innerHTML = val.replace(/\n/g,'<br>'); else el.textContent = val; }
    };
    setCtaEl('.course-cta-fullbanner-eyebrow', cta.eyebrow, false);
    setCtaEl('.course-cta-fullbanner-headline', cta.headline, true);
    setCtaEl('.course-cta-fullbanner-sub', cta.sub, false);
    setCtaEl('.course-cta-fullbanner-btn', cta.btnText, false);
    if (cta.bgImage) { const bg = document.querySelector('.course-cta-fullbanner-bg'); if (bg) bg.style.backgroundImage = `url('${cta.bgImage}')`; }

    this.renderCommunity(s);
    this.renderTestimonials(s, '-home');
  },

  renderCommunity(s) {
    const c = s.community || {};
    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.textContent = val; };
    const setHTML = (id, val) => { const el = document.getElementById(id); if (el && val) el.innerHTML = val; };

    set('community-eyebrow', c.eyebrow || 'THAM GIA CỘNG ĐỒNG');

    const headlineEl = document.getElementById('community-headline');
    if (headlineEl) headlineEl.innerHTML = (c.headline || 'CÙNG NHAU\nCHIẾN ĐẤU').replace(/\\n|\n/g, '<br>');

    const storyEl = document.getElementById('community-story');
    if (storyEl && c.story) {
      storyEl.innerHTML = c.story.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
    }

    set('community-stat-1-num',   c.stat1Num   || '500+');
    set('community-stat-1-label', c.stat1Label || 'Thành viên');
    set('community-stat-2-num',   c.stat2Num   || '3+');
    set('community-stat-2-label', c.stat2Label || 'Năm hoạt động');
    set('community-stat-3-num',   c.stat3Num   || '100%');
    set('community-stat-3-label', c.stat3Label || 'Miễn phí tham gia');

    const fbBtn = document.getElementById('community-btn-fb');
    if (fbBtn) {
      fbBtn.href = c.fbLink || '#';
      fbBtn.style.display = c.fbLink ? '' : '';
      const fbText = document.getElementById('community-btn-fb-text');
      if (fbText) fbText.textContent = c.fbText || 'FACEBOOK GROUP';
    }
    const zaloBtn = document.getElementById('community-btn-zalo');
    if (zaloBtn) {
      zaloBtn.href = c.zaloLink || '#';
      zaloBtn.style.display = c.zaloLink ? '' : '';
      const zaloText = document.getElementById('community-btn-zalo-text');
      if (zaloText) zaloText.textContent = c.zaloText || 'ZALO GROUP';
    }

    const img = document.getElementById('community-img');
    const placeholder = document.getElementById('community-visual-placeholder');
    if (img && placeholder) {
      if (c.imageUrl) {
        img.src = c.imageUrl;
        img.style.display = 'block';
        placeholder.style.display = 'none';
      } else {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
      }
    }
  },

  getWishlist() {
    try { return JSON.parse(localStorage.getItem('dc_wishlist') || '[]'); } catch { return []; }
  },
  toggleWishlist(productId) {
    let list = this.getWishlist();
    const idx = list.indexOf(productId);
    if (idx >= 0) { list.splice(idx, 1); this.toast('Removed from wishlist'); }
    else { list.push(productId); this.toast('Added to wishlist ♥'); }
    localStorage.setItem('dc_wishlist', JSON.stringify(list));
    document.querySelectorAll(`.wishlist-btn[data-product-id="${productId}"]`).forEach(btn => {
      btn.classList.toggle('active', list.includes(productId));
    });
  },

  productCardHTML(p) {
    const img = (p.images && p.images[0])
      ? `<img src="${p.images[0]}" alt="${p.name}" onerror="this.parentNode.innerHTML='<div class=\\'product-placeholder-img\\'>${p.name.charAt(0)}</div>'">`
      : `<div class="product-placeholder-img">${p.name.charAt(0)}</div>`;
    const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    const wished = this.getWishlist().includes(p.id);
    return `<div class="product-card" data-product-id="${p.id}">
      <div class="product-card-img">
        ${img}
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        ${discount > 0 ? `<span class="product-discount-badge">-${discount}%</span>` : ''}
        <button class="wishlist-btn${wished ? ' active' : ''}" data-product-id="${p.id}" title="Wishlist">♥</button>
        <div class="card-actions">
          <button class="card-btn-buy" data-product-id="${p.id}">BUY NOW</button>
          <button class="card-btn-add" data-product-id="${p.id}">ADD TO CART</button>
        </div>
      </div>
      <div class="product-card-info">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-sub">${(p.colors || []).join(' / ')}</div>
        <div class="product-card-price">
          ${DC.formatPrice(p.price)}
          ${p.originalPrice ? `<span class="price-original">${DC.formatPrice(p.originalPrice)}</span>` : ''}
        </div>
      </div>
    </div>`;
  },

  featuredStripCardHTML(p) {
    const img = (p.images && p.images[0])
      ? `<img src="${p.images[0]}" alt="${p.name}" onerror="this.parentNode.innerHTML='<div class=\\'strip-card-placeholder\\'>${p.name.charAt(0)}</div>'">`
      : `<div class="strip-card-placeholder">${p.name.charAt(0)}</div>`;
    const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    const wished = this.getWishlist().includes(p.id);
    return `<div class="product-card strip-card" data-product-id="${p.id}">
      <div class="product-card-img strip-card-img">
        ${img}
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        ${discount > 0 ? `<span class="product-discount-badge">-${discount}%</span>` : ''}
        <button class="wishlist-btn${wished ? ' active' : ''}" data-product-id="${p.id}" title="Wishlist">♥</button>
        <div class="card-actions">
          <button class="card-btn-buy" data-product-id="${p.id}">BUY NOW</button>
          <button class="card-btn-add" data-product-id="${p.id}">ADD TO CART</button>
        </div>
      </div>
      <div class="strip-card-info">
        <div class="strip-card-name">${p.name}</div>
        <div class="strip-card-sub">${(p.colors || []).join(' / ')} · ${(p.sizes || []).join(', ')}</div>
        <div class="strip-card-price">
          ${DC.formatPrice(p.price)}
          ${p.originalPrice ? `<span class="price-original">${DC.formatPrice(p.originalPrice)}</span>` : ''}
        </div>
      </div>
    </div>`;
  },

  attachProductCardEvents(container) {
    container.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-actions') || e.target.closest('.wishlist-btn')) return;
        const p = DC.getProducts().find(p => p.id === card.dataset.productId);
        if (p) this.openProduct(p);
      });
    });
    container.querySelectorAll('.wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleWishlist(btn.dataset.productId);
      });
    });
    container.querySelectorAll('.card-btn-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = DC.getProducts().find(p => p.id === btn.dataset.productId);
        if (!p) return;
        const size  = p.sizes?.[0]  || 'ONE SIZE';
        const color = p.colors?.[0] || 'BLACK';
        DC.addToCart(p.id, size, color);
        this.updateCartBadge();
        this.toast(`${p.name} added to cart`);
        btn.textContent = '✓ ADDED';
        setTimeout(() => { btn.textContent = 'ADD TO CART'; }, 2000);
      });
    });
    container.querySelectorAll('.card-btn-buy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = DC.getProducts().find(p => p.id === btn.dataset.productId);
        if (p) this.openProduct(p);
      });
    });
  },

  // ─── Shop ────────────────────────────────────────────────────────────────
  _shopFilter: 'all',
  _shopQuery: '',
  _shopSort: 'default',

  renderShop(filter = null) {
    if (filter !== null) this._shopFilter = filter;
    const query = (document.getElementById('shop-search')?.value || '').toLowerCase().trim();
    this._shopQuery = query;
    this._shopSort = document.getElementById('shop-sort')?.value || 'default';

    let products = DC.getProducts().filter(p => p.visible !== false);
    const activeFilter = this._shopFilter || '';
    if (activeFilter === 'featured') products = products.filter(p => p.featured || p.badge === 'BEST SELLER');
    else if (activeFilter === 'new') products = products.filter(p => p.badge === 'NEW');
    else if (activeFilter && activeFilter !== 'all') products = products.filter(p => p.category === activeFilter);
    if (query) products = products.filter(p => p.name.toLowerCase().includes(query) || (p.description||'').toLowerCase().includes(query));

    if (this._shopSort === 'price-asc')  products = [...products].sort((a, b) => a.price - b.price);
    if (this._shopSort === 'price-desc') products = [...products].sort((a, b) => b.price - a.price);
    if (this._shopSort === 'name-asc')   products = [...products].sort((a, b) => a.name.localeCompare(b.name));
    if (this._shopSort === 'new')        products = [...products].reverse();

    const countEl = document.getElementById('shop-count');
    if (countEl) countEl.textContent = `${products.length} PRODUCT${products.length !== 1 ? 'S' : ''}`;

    const grid = document.getElementById('shop-grid');
    if (!products.length && !query && this._shopFilter === 'all') {
      const skeletonCount = 8;
      grid.innerHTML = Array(skeletonCount).fill(0).map(() =>
        `<div class="product-card-skeleton"><div class="skeleton sk-img"></div><div class="skeleton sk-name"></div><div class="skeleton sk-sub"></div><div class="skeleton sk-price"></div></div>`
      ).join('');
      setTimeout(() => {
        grid.innerHTML = `<div class="empty-state"><h3>${window.I18N ? I18N.t('shop.no_results') : 'NO PRODUCTS FOUND'}</h3><p>Check back soon.</p></div>`;
      }, 600);
    } else {
      grid.innerHTML = products.length
        ? products.map(p => this.productCardHTML(p)).join('')
        : `<div class="empty-state"><h3>${window.I18N ? I18N.t('shop.no_results') : 'NO PRODUCTS FOUND'}</h3><p>${query ? `No results for "${query}"` : `No products in this category.`}</p></div>`;
      this.attachProductCardEvents(grid);
    }

    document.querySelectorAll('#shop-filters .filter-btn').forEach(btn => {
      const normalFilter = this._shopFilter || 'all';
      btn.classList.toggle('active', btn.dataset.filter === normalFilter);
      btn.onclick = () => this.renderShop(btn.dataset.filter);
    });

    const searchEl = document.getElementById('shop-search');
    if (searchEl && !searchEl._bound) {
      searchEl._bound = true;
      searchEl.addEventListener('input', () => this.renderShop(null));
    }
    const sortEl = document.getElementById('shop-sort');
    if (sortEl && !sortEl._bound) {
      sortEl._bound = true;
      sortEl.addEventListener('change', () => this.renderShop(null));
    }

    const s = DC.getSettings();
    this.renderTestimonials(s, '', 'CẢM NHẬN SẢN PHẨM THỰC TẾ');
  },

  // ─── Product Detail ──────────────────────────────────────────────────────
  openProduct(p) {
    this.currentProduct = p;
    this.selectedSize = null;
    this.selectedColor = null;
    this.navigate('product');
  },

  renderProductDetail() {
    const p = this.currentProduct;
    if (!p) return;
    this._pdQty = 1;
    this._pdSelectedColor = (p.colors||[])[0] || '';
    this._pdSelectedSize  = '';

    // Breadcrumb
    const crumbEl = document.getElementById('pd-name-crumb');
    if (crumbEl) crumbEl.textContent = p.name;
    const catEl = document.getElementById('pd-category');
    if (catEl) catEl.textContent = (p.category || '').toUpperCase();

    const titleEl = document.getElementById('pd-title');
    if (titleEl) titleEl.textContent = p.name;

    // Price block
    const priceBlock = document.getElementById('pd-price-block');
    if (priceBlock) {
      let priceHTML = `<span class="pd-price">${DC.formatPrice(p.price)}</span>`;
      if (p.originalPrice) {
        const pct = Math.round((1 - p.price / p.originalPrice) * 100);
        priceHTML += `<span class="pd-price-original">${DC.formatPrice(p.originalPrice)}</span>`;
        priceHTML += `<span class="pd-price-badge">-${pct}%</span>`;
      }
      priceBlock.innerHTML = priceHTML;
    }

    // Wishlist
    const wishBtn = document.getElementById('pd-wishlist-btn');
    const wishLabel = document.getElementById('pd-wishlist-label');
    const isWished = this.getWishlist().includes(p.id);
    if (wishBtn) wishBtn.classList.toggle('active', isWished);
    if (wishLabel) wishLabel.textContent = isWished ? 'REMOVE FROM WISHLIST' : 'ADD TO WISHLIST';

    // Colors
    const colorsGroup = document.getElementById('pd-colors-group');
    const swatchesEl  = document.getElementById('pd-color-swatches');
    const colorMap = { 'BLACK':'#111', 'WHITE':'#f5f5f5', 'RED':'#c0392b', 'NAVY':'#1a237e', 'CHARCOAL':'#424242', 'GREEN':'#2e7d32', 'BLUE':'#1565c0', 'GOLD':'#e8c87a', 'GREY':'#616161', 'GRAY':'#616161' };
    if (swatchesEl && p.colors && p.colors.length > 0) {
      swatchesEl.innerHTML = p.colors.map(c => {
        const bg = colorMap[c.toUpperCase()] || '#666';
        return `<div class="color-swatch ${c === this._pdSelectedColor ? 'active':''}" data-color="${c}" title="${c}" style="background:${bg}"></div>`;
      }).join('');
      const selColorEl = document.getElementById('pd-selected-color');
      if (selColorEl) selColorEl.textContent = this._pdSelectedColor;
      swatchesEl.querySelectorAll('.color-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
          this._pdSelectedColor = sw.dataset.color;
          swatchesEl.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
          sw.classList.add('active');
          const sc = document.getElementById('pd-selected-color');
          if (sc) sc.textContent = this._pdSelectedColor;
          // Sync Slot 1 thumbnail strip active state
          const thumb = document.querySelector(`.color-thumb-item[data-color="${this._pdSelectedColor}"]`);
          this._selectColorImage(this._pdSelectedColor, thumb);
        });
      });
      if (colorsGroup) colorsGroup.style.display = '';
    } else if (colorsGroup) {
      colorsGroup.style.display = 'none';
    }

    // Sizes
    const sizesGroup = document.getElementById('pd-sizes-group');
    const sizeBtns   = document.getElementById('pd-size-btns');
    if (sizeBtns && p.sizes && p.sizes.length > 0) {
      sizeBtns.innerHTML = p.sizes.map(s => `<button class="size-btn" data-size="${s}">${s}</button>`).join('');
      sizeBtns.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this._pdSelectedSize = btn.dataset.size;
          sizeBtns.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
      if (sizesGroup) sizesGroup.style.display = '';
    } else if (sizesGroup) {
      sizesGroup.style.display = 'none';
    }

    // Qty
    const qtyDisplay = document.getElementById('pd-qty-display');
    if (qtyDisplay) qtyDisplay.textContent = '1';

    // Description
    const descEl = document.getElementById('pd-description');
    if (descEl) descEl.textContent = p.description || '';
    const featuresEl = document.getElementById('pd-features');
    if (featuresEl) {
      if (p.features && p.features.length) {
        featuresEl.innerHTML = p.features.map(f => `<li>${f}</li>`).join('');
        featuresEl.style.display = '';
      } else {
        featuresEl.style.display = 'none';
      }
    }

    // Gallery: 2×4 grid — Slot 1: color thumbnail strip, Slot 2: video, Slots 3-8: static images
    const galleryEl = document.getElementById('product-gallery-main');
    if (galleryEl) {
      const images = (p.images || []).filter(Boolean);
      const video  = ((p.videos || []).filter(Boolean))[0] || '';
      const colorImages = p.colorImages || {};
      const colors = (p.colors || []).filter(Boolean);

      // Build Slot 1: Dr. Squatch-style thumbnail strip + main image
      const colorEntries = colors.map(c => ({ color: c, imgs: (colorImages[c] || []).filter(Boolean) }));
      const firstWithImg = colorEntries.find(e => e.imgs.length) || colorEntries[0];
      const initImg = firstWithImg && firstWithImg.imgs.length ? firstWithImg.imgs[0] : '';
      const thumbsHtml = colorEntries.map((e, idx) => {
        const thumbSrc = e.imgs[0] || '';
        const isActive = e === firstWithImg ? ' active' : '';
        if (thumbSrc) {
          return `<div class="color-thumb-item${isActive}" data-color="${e.color}" data-imgs='${JSON.stringify(e.imgs)}' onclick="App._selectColorImage('${e.color}',this)"><img src="${thumbSrc}" alt="${e.color}" loading="lazy"></div>`;
        }
        return `<div class="color-thumb-item no-img${isActive}" data-color="${e.color}" data-imgs='[]' onclick="App._selectColorImage('${e.color}',this)"><img src="/img/dc-mark.svg" alt="${e.color}"></div>`;
      }).join('');
      const slot1 = `<div class="gallery-slot gallery-color-viewer" id="gallery-slot-1">
        <div class="color-thumb-strip" id="color-thumb-strip">${thumbsHtml}</div>
        <div class="color-main-img-wrap${initImg ? '' : ' placeholder'}" id="color-main-wrap">
          <img id="color-main-img" src="${initImg || '/img/dc-mark.svg'}" alt="${p.name}">
        </div>
      </div>`;

      // Slot 2: video
      const slot2 = video
        ? `<div class="gallery-slot gallery-video-slot"><video src="${video}" controls playsinline muted loop></video></div>`
        : `<div class="gallery-slot gallery-video-slot"><div class="gallery-slot-empty"><img src="/img/dc-mark.svg" alt=""></div></div>`;

      // Slots 3–12: 10 static images
      let slots312 = '';
      for (let i = 0; i < 10; i++) {
        slots312 += images[i]
          ? `<div class="gallery-slot"><img src="${images[i]}" alt="${p.name}" loading="lazy"></div>`
          : `<div class="gallery-slot"><div class="gallery-slot-empty"><img src="/img/dc-mark.svg" alt=""></div></div>`;
      }
      galleryEl.innerHTML = `${slot1}${slot2}${slots312}`;
    }

    // Scroll cols to top
    const galleryCol = document.getElementById('product-gallery-col');
    if (galleryCol) galleryCol.scrollTop = 0;
    const infoCol = document.getElementById('product-info-col');
    if (infoCol) infoCol.scrollTop = 0;

    // Cart msg reset
    const cartMsg = document.getElementById('pd-cart-msg');
    if (cartMsg) { cartMsg.style.display = 'none'; cartMsg.textContent = ''; }

    // Delivery policy
    const deliveryText = document.getElementById('pd-delivery-text');
    if (deliveryText) deliveryText.textContent = DC.getSettings().deliveryPolicy || '';
  },

  pdQty(delta) {
    this._pdQty = Math.max(1, (this._pdQty || 1) + delta);
    const el = document.getElementById('pd-qty-display');
    if (el) el.textContent = this._pdQty;
  },

  toggleProductWishlist() {
    const p = this.currentProduct;
    if (!p) return;
    this.toggleWishlist(p.id);
    const isWished = this.getWishlist().includes(p.id);
    const wishBtn = document.getElementById('pd-wishlist-btn');
    const wishLabel = document.getElementById('pd-wishlist-label');
    if (wishBtn) wishBtn.classList.toggle('active', isWished);
    if (wishLabel) wishLabel.textContent = isWished ? 'REMOVE FROM WISHLIST' : 'ADD TO WISHLIST';
    this.updateCartBadge();
  },

  addCurrentToCart() {
    const p = this.currentProduct;
    if (!p) return;
    const size  = this._pdSelectedSize  || (p.sizes  && p.sizes[0])  || '';
    const color = this._pdSelectedColor || (p.colors && p.colors[0]) || '';
    const qty   = this._pdQty || 1;
    DC.addToCart(p.id, size, color, qty);
    this.updateCartBadge();
    const cartMsg = document.getElementById('pd-cart-msg');
    const addBtn  = document.getElementById('pd-add-cart-btn');
    if (cartMsg) {
      cartMsg.textContent = `Added ${qty}× to cart!`;
      cartMsg.style.display = 'block';
      setTimeout(() => { cartMsg.style.display = 'none'; }, 2500);
    }
    if (addBtn) {
      addBtn.textContent = 'ADDED ✓';
      setTimeout(() => { addBtn.textContent = 'ADD TO CART'; }, 2000);
    }
  },

  buyNowProduct() {
    this.addCurrentToCart();
    this.navigate('checkout');
  },

  openSizeChart() {
    const s = DC.getSettings();
    const img = document.getElementById('size-chart-img');
    const fallback = document.getElementById('size-chart-fallback');
    const url = s.sizeChartUrl || '';
    if (url) {
      img.src = url;
      img.style.display = 'block';
      fallback.style.display = 'none';
    } else {
      img.style.display = 'none';
      fallback.style.display = 'block';
    }
    document.getElementById('size-chart-modal').classList.add('open');
  },

  // ─── Color thumbnail viewer (Slot 1) ─────────────────────────────────────
  _selectColorImage(color, thumbEl) {
    // Update active thumbnail
    document.querySelectorAll('.color-thumb-item').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
    // Update main image
    const mainImg  = document.getElementById('color-main-img');
    const mainWrap = document.getElementById('color-main-wrap');
    if (!mainImg) return;
    const imgs = thumbEl ? JSON.parse(thumbEl.dataset.imgs || '[]') : [];
    if (imgs.length) {
      mainImg.src = imgs[0];
      if (mainWrap) mainWrap.classList.remove('placeholder');
    } else {
      mainImg.src = '/img/dc-mark.svg';
      if (mainWrap) mainWrap.classList.add('placeholder');
    }
  },

  // ─── Legacy carousel stubs (kept so old onclick refs don't break) ─────────
  _carouselImages: [],
  _renderCarousel() {
    const wrap  = document.getElementById('gallery-carousel-wrap');
    if (!wrap) return;
    const imgs = this._carouselImages;
    if (!imgs.length) {
      wrap.innerHTML = `<div class="carousel-placeholder"><img src="/img/dc-mark.svg" alt=""></div>`;
      if (dots) dots.innerHTML = '';
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      return;
    }
    if (prevBtn) prevBtn.style.display = '';
    if (nextBtn) nextBtn.style.display = '';
    wrap.innerHTML = imgs.map(url =>
      `<img src="${url}" alt="product">`
    ).join('');
    wrap.style.transform = `translateX(-${this._carouselIndex * 100}%)`;
    if (dots) {
      dots.innerHTML = imgs.map((_, i) =>
        `<div class="carousel-dot ${i === this._carouselIndex ? 'active' : ''}" onclick="App.carouselGoTo(${i})"></div>`
      ).join('');
    }
  },


  toggleAccordion(btn) {
    const body = btn.nextElementSibling;
    const icon = btn.querySelector('.accordion-icon');
    const isOpen = btn.classList.contains('active');
    btn.classList.toggle('active', !isOpen);
    if (body) body.style.display = isOpen ? 'none' : 'block';
    if (icon) icon.textContent = isOpen ? '+' : '−';
  },

  // ─── Courses ─────────────────────────────────────────────────────────────
  renderCourses() {
    const s = DC.getSettings();

    // Courses video banners A & B
    ['a', 'b'].forEach(key => {
      const vb = (s.coursesVbanners || {})[key] || {};
      const media = document.getElementById(`courses-vbanner-${key}-media`);
      if (!media) return;
      media.innerHTML = vb.mediaUrl
        ? (vb.mediaType === 'video'
            ? `<video src="${vb.mediaUrl}" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;display:block"></video>`
            : `<img src="${vb.mediaUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">`)
        : '';
    });

    // 9-image gallery
    const gallery = s.coursesGallery || {};
    for (let i = 1; i <= 9; i++) {
      const cell = document.getElementById(`gallery9-cell-${i}`);
      if (!cell) continue;
      const url = gallery[`img${i}`];
      const placeholder = cell.querySelector('.gallery9-placeholder');
      const existing = cell.querySelector('img');
      if (existing) existing.remove();
      if (url) {
        if (placeholder) placeholder.style.display = 'none';
        const img = document.createElement('img');
        img.src = url; img.alt = '';
        cell.appendChild(img);
      } else {
        if (placeholder) placeholder.style.display = '';
      }
    }

    // Trio video strip (bottom of courses page)
    const trio = s.coursesTrioVideos || {};
    [1, 2, 3].forEach(n => {
      const slot = trio[`slot${n}`] || {};
      const media = document.getElementById(`trio-media-${n}`);
      if (!media) return;
      media.innerHTML = slot.mediaUrl
        ? (slot.mediaType === 'video'
            ? `<video src="${slot.mediaUrl}" autoplay muted loop playsinline></video>`
            : `<img src="${slot.mediaUrl}" alt="Course ${n}">`)
        : '';
    });

    // Program blocks (alternating layout)
    const programs = s.programBlocks || {};
    [1, 2, 3].forEach(n => {
      const p = programs[`block${n}`] || {};

      // Media
      const mediaEl = document.getElementById(`program-media-${n}`);
      if (mediaEl && p.mediaUrl) {
        const placeholder = mediaEl.querySelector('.program-media-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        const existing = mediaEl.querySelector('video,img');
        if (existing) existing.remove();
        const el = p.mediaType === 'video'
          ? Object.assign(document.createElement('video'), { src: p.mediaUrl, autoplay: true, muted: true, loop: true })
          : Object.assign(document.createElement('img'), { src: p.mediaUrl, alt: `Program ${n}` });
        el.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        if (p.mediaType === 'video') el.setAttribute('playsinline', '');
        mediaEl.appendChild(el);
      }

      // Text content
      const setTxt = (id, val) => { const el = document.getElementById(id); if (el && val) el.innerHTML = val; };
      setTxt(`program-tag-${n}`,   p.tag);
      setTxt(`program-title-${n}`, p.title ? p.title.replace(/\\n|\n/g, '<br>') : null);
      setTxt(`program-desc-${n}`,  p.description);
      if (p.features) {
        const ul = document.getElementById(`program-features-${n}`);
        if (ul) ul.innerHTML = p.features.split('\n').filter(Boolean).map(f => `<li>${f}</li>`).join('');
      }
      const btn = document.getElementById(`program-btn-${n}`);
      if (btn) {
        if (p.btnText) btn.textContent = p.btnText;
        if (p.btnLink) btn.onclick = () => { if (p.btnLink.startsWith('#')) App.navigate(p.btnLink.slice(1)); else window.location.href = p.btnLink; };
      }

      // Typography
      const info = document.getElementById(`program-info-${n}`);
      if (info) {
        if (p.textAlign)  info.style.textAlign  = p.textAlign;
        if (p.fontFamily) info.style.fontFamily  = p.fontFamily;
        if (p.bodySize)   info.style.fontSize    = p.bodySize;
      }
      const titleEl = document.getElementById(`program-title-${n}`);
      if (titleEl && p.titleSize) titleEl.style.fontSize = p.titleSize;
    });

    this.renderTestimonials(s, '-courses');
  },

  renderTestimonials(s, sfx = '', titleOverride = null) {
    const cfg = s.testimonials || {};
    const track = document.getElementById('testimonials-track' + sfx);
    if (!track) return;

    const eyebrow = document.getElementById('testimonials-eyebrow' + sfx);
    const title   = document.getElementById('testimonials-title' + sfx);
    if (eyebrow) eyebrow.textContent = titleOverride || cfg.eyebrow || 'KẾT QUẢ THỰC TẾ';
    if (title)   title.textContent   = titleOverride || cfg.title   || 'KẾT QUẢ THỰC TẾ';

    const items = cfg.items || [];
    if (!items.length) return;

    track.innerHTML = items.map((t, i) => {
      const stars = '★'.repeat(Math.max(1, Math.min(5, t.stars || 5))) +
                    '☆'.repeat(5 - Math.max(1, Math.min(5, t.stars || 5)));
      const avatarContent = t.avatarUrl
        ? `<img src="${t.avatarUrl}" alt="${t.name}">`
        : (t.name || '?').charAt(0).toUpperCase();
      const feedbackImg = t.feedbackImageUrl
        ? `<div class="testimonial-feedback-img"><img src="${t.feedbackImageUrl}" alt="Feedback"></div>`
        : '';
      return `<div class="testimonial-card${t.feedbackImageUrl ? ' has-image' : ''}" data-idx="${i}">
        ${feedbackImg}
        <div class="testimonial-body">
          <div class="testimonial-stars">${stars}</div>
          <blockquote class="testimonial-quote">"${t.quote || ''}"</blockquote>
          <div class="testimonial-author">
            <div class="testimonial-avatar">${avatarContent}</div>
            <div>
              <div class="testimonial-name">${t.name || ''}</div>
              <div class="testimonial-course">${t.label || ''}</div>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    // carousel setup
    const wrap = track.parentElement;
    let prevBtn = document.getElementById('testimonials-prev' + sfx);
    let nextBtn = document.getElementById('testimonials-next' + sfx);
    if (!prevBtn || !nextBtn) return;

    // remove old listeners by cloning
    const newPrev = prevBtn.cloneNode(true);
    const newNext = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);
    prevBtn = newPrev;
    nextBtn = newNext;

    let currentOffset = 0;

    const getVisible = () => {
      const w = wrap.offsetWidth;
      if (w >= 1400) return 8;
      if (w >= 1100) return 6;
      if (w >= 800)  return 4;
      if (w >= 500)  return 3;
      return 2;
    };

    const getCardWidth = () => {
      const card = track.querySelector('.testimonial-card');
      return card ? (card.offsetWidth + 20) : 280;
    };

    const getMaxOffset = () => Math.max(0, items.length - getVisible()) * getCardWidth();

    const update = () => {
      track.style.transform = `translateX(-${currentOffset}px)`;
      prevBtn.disabled = currentOffset <= 0;
      nextBtn.disabled = currentOffset >= getMaxOffset();
    };

    const setCardWidths = () => {
      const outerW = wrap.offsetWidth;
      const vis = getVisible();
      const gap = 20;
      const cardW = Math.floor((outerW - gap * (vis - 1)) / vis);
      track.querySelectorAll('.testimonial-card').forEach(c => {
        c.style.width = cardW + 'px';
        c.style.minWidth = cardW + 'px';
      });
      currentOffset = 0;
      update();
    };

    prevBtn.addEventListener('click', () => {
      currentOffset = Math.max(0, currentOffset - getCardWidth());
      update();
    });
    nextBtn.addEventListener('click', () => {
      currentOffset = Math.min(getMaxOffset(), currentOffset + getCardWidth());
      update();
    });

    if (this._testimonialsResizeObserver) this._testimonialsResizeObserver.disconnect();
    this._testimonialsResizeObserver = new ResizeObserver(() => setCardWidths());
    this._testimonialsResizeObserver.observe(wrap);

    setTimeout(setCardWidths, 0);
  },

  courseCardHTML(c) {
    const thumb = c.thumbnail
      ? `<img src="${c.thumbnail}" alt="${c.title}"><div class="course-play">▶</div>`
      : `<div class="course-thumb-placeholder">${c.title.charAt(0)}</div><div class="course-play">▶</div>`;
    return `<div class="course-card" data-course-id="${c.id}">
      <div class="course-thumb">${thumb}</div>
      <div class="course-info">
        <div class="course-level">${c.level}</div>
        <div class="course-title">${c.title}</div>
        <div class="course-instructor">By ${c.instructor}</div>
        <div class="course-meta"><span>⏱ ${c.duration}</span><span>👥 ${c.students || 0} ${window.I18N ? I18N.t('courses.students') : 'students'}</span><span>📚 ${(c.lessons||[]).length} ${window.I18N ? I18N.t('courses.lessons') : 'lessons'}</span></div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div class="course-price">${DC.formatPrice(c.price)}</div>
          <span class="tag">${window.I18N ? I18N.t('courses.enroll') : 'Enroll →'}</span>
        </div>
      </div>
    </div>`;
  },

  openCourseModal(course) {
    this.currentCourse = course;
    const modal = document.getElementById('course-modal');
    document.getElementById('course-modal-title').textContent       = course.title;
    document.getElementById('course-modal-instructor').textContent  = 'By ' + course.instructor;
    document.getElementById('course-modal-instructor2').textContent = course.instructor;
    document.getElementById('course-modal-level').textContent       = course.level;
    document.getElementById('course-modal-duration').textContent    = course.duration;
    document.getElementById('course-modal-desc').textContent        = course.description;
    document.getElementById('course-modal-price').textContent       = DC.formatPrice(course.price);

    const lessonsCount = (course.lessons || []).length;
    const countEls = document.querySelectorAll('#course-modal-lessons-count, #course-modal-lessons-count2');
    countEls.forEach(el => el.textContent = lessonsCount);
    const studentsEl = document.getElementById('course-modal-students');
    if (studentsEl) studentsEl.textContent = course.students || 0;

    // Thumbnail
    const thumbImg  = document.getElementById('course-modal-thumb-img');
    const thumbLetter = document.getElementById('course-modal-thumb-letter');
    if (course.thumbnail) {
      thumbImg.src = course.thumbnail;
      thumbImg.style.display = 'block';
      if (thumbLetter) thumbLetter.style.display = 'none';
    } else {
      thumbImg.style.display = 'none';
      if (thumbLetter) { thumbLetter.style.display = 'block'; thumbLetter.textContent = course.title.charAt(0); }
    }

    document.getElementById('course-modal-lessons').innerHTML = (course.lessons || []).map((l, i) =>
      `<div class="lesson-item"><span class="lesson-num">${String(i+1).padStart(2,'0')}</span><span>${l}</span></div>`
    ).join('');
    modal.classList.add('open');
  },

  async enrollCourse() {
    const user = DC.getCurrentUser();
    if (!user) {
      this.closeCourseModal();
      this.openAuth('login');
      this.toast('Please login to enroll', 'error');
      return;
    }
    if (!this.currentCourse) return;
    const alreadyEnrolled = (user.enrolledCourses || []).includes(this.currentCourse.id);
    if (!alreadyEnrolled) {
      try { await DC.enrollCourse(this.currentCourse.id); this.toast(`Enrolled in ${this.currentCourse.title}!`); }
      catch(e) { this.toast(e.message, 'error'); }
    }
    this.closeCourseModal();
    this.openLearn(this.currentCourse);
  },

  closeCourseModal() { document.getElementById('course-modal').classList.remove('open'); },

  // ─── Course Learn ────────────────────────────────────────────────────────
  openLearn(course) {
    this.currentCourse = course;
    this.currentLesson = 0;
    this.navigate('learn');
    this.renderLearn();
  },

  renderLearn() {
    const course = this.currentCourse;
    if (!course) { this.navigate('courses'); return; }
    document.getElementById('learn-course-title').textContent     = course.title;
    document.getElementById('learn-course-instructor').textContent = 'By ' + course.instructor + ' · ' + course.duration;

    const lessons = course.lessons || [];
    const listEl  = document.getElementById('learn-lesson-list');
    listEl.innerHTML = lessons.map((l, i) => `
      <div class="learn-lesson-item ${i === this.currentLesson ? 'active' : ''}" data-index="${i}" onclick="App.selectLesson(${i})">
        <span class="lesson-num">${String(i + 1).padStart(2, '0')}</span>
        <span>${l}</span>
      </div>`).join('') || '<p style="color:var(--text-muted);font-size:0.8rem">No lessons added yet.</p>';

    this.selectLesson(this.currentLesson);
  },

  selectLesson(i) {
    const lessons = (this.currentCourse?.lessons) || [];
    if (!lessons.length) return;
    this.currentLesson = i;
    document.querySelectorAll('.learn-lesson-item').forEach((el, idx) => el.classList.toggle('active', idx === i));
    document.getElementById('learn-lesson-title').textContent = lessons[i] || '';
    document.getElementById('learn-lesson-meta').textContent  = `Lesson ${i + 1} of ${lessons.length} · ${this.currentCourse.duration}`;
    document.getElementById('learn-lesson-content').innerHTML = `<p>This lesson covers: <strong>${lessons[i]}</strong></p><p style="margin-top:1rem">Your instructor <strong>${this.currentCourse.instructor}</strong> will guide you through the key concepts and techniques for this lesson. Watch the video above, take notes, and practice the drills before moving on.</p>`;
    document.getElementById('learn-video-area').innerHTML = `<div class="learn-video-placeholder"><div class="play-icon">▶</div><p>LESSON ${i + 1}: ${(lessons[i] || '').toUpperCase()}</p></div>`;
    document.getElementById('btn-mark-complete').textContent = i < lessons.length - 1 ? 'NEXT LESSON →' : 'FINISH COURSE ✓';
  },

  markLessonComplete() {
    const lessons = (this.currentCourse?.lessons) || [];
    if (this.currentLesson < lessons.length - 1) {
      this.selectLesson(this.currentLesson + 1);
    } else {
      this.toast('🏆 Course completed! Great work!');
      this.navigate('account');
    }
  },

  // ─── Enrollment ──────────────────────────────────────────────────────────
  _pendingEnrollment: null,

  openEnrollForm() {
    const course = this.currentCourse;
    if (!course) return;
    this.closeCourseModal();
    document.getElementById('enroll-modal-title').textContent = course.title;
    document.getElementById('enroll-form').reset();
    const errEl = document.getElementById('enroll-error');
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
    document.getElementById('enroll-modal').classList.add('open');
    document.getElementById('enroll-form').onsubmit = (e) => { e.preventDefault(); this.submitEnrollment(); };
  },

  closeEnrollModal() {
    document.getElementById('enroll-modal').classList.remove('open');
  },

  async submitEnrollment() {
    const course  = this.currentCourse;
    const name    = document.getElementById('enroll-name').value.trim();
    const email   = document.getElementById('enroll-email').value.trim();
    const phone   = document.getElementById('enroll-phone').value.trim();
    const notes   = document.getElementById('enroll-notes').value.trim();
    const errEl   = document.getElementById('enroll-error');
    const btn     = document.getElementById('enroll-submit-btn');
    if (!name || !email || !phone) {
      errEl.textContent = 'Please fill in all required fields.';
      errEl.style.display = 'block';
      return;
    }
    btn.textContent = 'PROCESSING…';
    btn.disabled    = true;
    try {
      const entry = await DC.submitCourseEnrollment({
        courseId:   course.id,
        courseName: course.title,
        name, email, phone, notes,
        price: course.price,
      });
      this._pendingEnrollment = { ...entry, course };
      this.closeEnrollModal();
      this.toast(`Enrollment submitted! Proceeding to payment.`);
      this.navigate('course-pay');
    } catch(e) {
      errEl.textContent = e.message || 'Submission failed. Please try again.';
      errEl.style.display = 'block';
    } finally {
      btn.textContent = 'CONFIRM & PAY →';
      btn.disabled    = false;
    }
  },

  renderCoursePayment() {
    const enrollment = this._pendingEnrollment;
    if (!enrollment) { this.navigate('courses'); return; }
    const course = enrollment.course;
    const s = DC.getSettings();

    // Summary panel
    const summaryEl = document.getElementById('course-pay-summary');
    summaryEl.innerHTML = `
      <div class="order-summary-item">
        <span>${course.title} — ${course.level}</span>
        <span>${DC.formatPrice(course.price)}</span>
      </div>
      <div class="order-summary-item" style="font-size:0.75rem;color:var(--text-muted)">
        <span>Student: ${enrollment.name}</span>
        <span>${enrollment.email}</span>
      </div>`;
    document.getElementById('course-pay-total').textContent = DC.formatPrice(course.price);

    // Payment tabs (reuse same logic as checkout)
    const methods = [];
    if (s.payment.stripe.enabled) methods.push({ id:'stripe', label:'CREDIT CARD' });
    if (s.payment.paypal.enabled) methods.push({ id:'paypal', label:'PAYPAL' });
    if (s.payment.vnpay.enabled)  methods.push({ id:'vnpay',  label:'VNPAY' });
    if (s.payment.momo.enabled)   methods.push({ id:'momo',   label:'MOMO' });
    if (!methods.length) methods.push({ id:'cod', label:'BANK TRANSFER' });

    const tabsEl   = document.getElementById('course-pay-tabs');
    const panelsEl = document.getElementById('course-pay-panels');
    tabsEl.innerHTML   = methods.map((m, i) => `<button class="payment-tab ${i===0?'active':''}" data-method="${m.id}">${m.label}</button>`).join('');
    panelsEl.innerHTML = methods.map((m, i) => `<div class="payment-panel ${i===0?'active':''}" id="cpanel-${m.id}">${this._paymentPanelHTML(m.id)}</div>`).join('');
    tabsEl.querySelectorAll('.payment-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        tabsEl.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
        panelsEl.querySelectorAll('.payment-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('cpanel-' + tab.dataset.method).classList.add('active');
      });
    });

    document.getElementById('btn-confirm-course-pay').onclick = () => this.completeCoursePayment();
  },

  async completeCoursePayment() {
    const enrollment = this._pendingEnrollment;
    if (!enrollment) return;
    // Mark enrollment as paid
    try {
      await DC.updateCourseEnrollment(enrollment.id, { status: 'paid' });
    } catch {}
    this._pendingEnrollment = null;
    this.toast(`🎉 Payment confirmed! You're enrolled in ${enrollment.course.title}.`);
    this.navigate('home');
  },

  // ─── Cart ─────────────────────────────────────────────────────────────────
  initCart() {
    document.getElementById('btn-cart')?.addEventListener('click', () => this.openCart());
    document.getElementById('cart-overlay')?.addEventListener('click', () => this.closeCart());
    document.getElementById('cart-close')?.addEventListener('click', () => this.closeCart());
    document.getElementById('btn-checkout')?.addEventListener('click', () => { this.closeCart(); this.navigate('checkout'); });
    this.updateCartBadge();
  },

  openCart()  { this.renderCartDrawer(); document.getElementById('cart-drawer').classList.add('open'); document.getElementById('cart-overlay').classList.add('open'); },
  closeCart() { document.getElementById('cart-drawer').classList.remove('open'); document.getElementById('cart-overlay').classList.remove('open'); },

  renderCartDrawer() {
    const cart = DC.getCart();
    const products = DC.getProducts();
    const itemsEl = document.getElementById('cart-items');

    if (!cart.length) {
      itemsEl.innerHTML = '<div class="empty-state"><h3>CART EMPTY</h3><p>Add something.</p></div>';
      document.getElementById('cart-total').textContent = DC.formatPrice(0);
      return;
    }

    itemsEl.innerHTML = cart.map(item => {
      const p = products.find(p => p.id === item.productId);
      if (!p) return '';
      const img = (p.images && p.images[0])
        ? `<img src="${p.images[0]}" alt="${p.name}">`
        : `<div style="background:var(--bg-card);width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-size:1.5rem;opacity:0.3">${p.name.charAt(0)}</div>`;
      return `<div class="cart-item">
        <div class="cart-item-img">${img}</div>
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

    itemsEl.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = DC.getCart().find(i => i.key === btn.dataset.key);
        if (item) { DC.updateCartQty(btn.dataset.key, item.qty + (btn.dataset.action === 'inc' ? 1 : -1)); this.updateCartBadge(); this.renderCartDrawer(); }
      });
    });
    itemsEl.querySelectorAll('.cart-remove').forEach(btn => {
      btn.addEventListener('click', () => { DC.removeFromCart(btn.dataset.key); this.updateCartBadge(); this.renderCartDrawer(); });
    });
  },

  updateCartBadge() {
    const n = DC.cartCount();
    const badge = document.getElementById('cart-badge');
    badge.textContent = n;
    badge.classList.toggle('show', n > 0);
    this.updateMobileNavAuth();
  },

  // ─── Auth ─────────────────────────────────────────────────────────────────
  initAuth() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    document.getElementById('btn-login')?.addEventListener('click', () => this.openAuth('login'));
    document.getElementById('auth-close')?.addEventListener('click', () => modal.classList.remove('open'));
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
      btn.addEventListener('click', () => { document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); });
    });

    document.getElementById('auth-form-login')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('login-error');
      const result = await DC.loginUser(
        document.getElementById('login-email').value,
        document.getElementById('login-password').value
      );
      if (result.error) { errEl.textContent = result.error; errEl.classList.add('show'); }
      else { errEl.classList.remove('show'); modal.classList.remove('open'); this.updateAuthNav(); this.toast('Welcome back, ' + result.user.name + '!'); }
    });

    document.getElementById('auth-form-register')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('reg-error');
      const role  = document.querySelector('.role-btn.active')?.dataset.role || 'customer';
      const result = await DC.registerUser({
        name:     document.getElementById('reg-name').value,
        email:    document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        role,
      });
      if (result.error) { errEl.textContent = result.error; errEl.classList.add('show'); }
      else { errEl.classList.remove('show'); modal.classList.remove('open'); this.updateAuthNav(); this.toast('Welcome, ' + result.user.name + '!'); }
    });

    this.updateAuthNav();
  },

  openAuth(tab = 'login') {
    document.getElementById('auth-modal').classList.add('open');
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.toggle('active', f.id === 'auth-form-' + tab));
  },

  updateAuthNav() {
    this.updateMobileNavAuth();
  },

  updateMobileNavAuth() {
    const el = document.getElementById('mobile-nav-actions');
    if (!el) return;
    const cartCount = DC.cartCount();
    el.innerHTML = `
        <button class="btn btn-primary" style="font-size:0.85rem;position:relative" onclick="App.openCart();App.closeMobileNav()">
          CART${cartCount > 0 ? ` (${cartCount})` : ''}
        </button>`;
  },

  // ─── Account ──────────────────────────────────────────────────────────────
  async renderAccount() {
    const user = DC.getCurrentUser();
    if (!user) { this.openAuth('login'); this.navigate('home'); return; }

    document.getElementById('account-name').textContent  = user.name;
    document.getElementById('account-email').textContent = user.email;
    document.getElementById('account-role').textContent  = user.role.toUpperCase();

    await DC.loadOrders();
    const orders  = DC.getOrders();
    const ordersEl = document.getElementById('account-orders');
    ordersEl.innerHTML = orders.length
      ? orders.map(o => `<div class="cart-item" style="grid-template-columns:1fr auto">
          <div><div class="cart-item-name">Order #${o.id}</div><div class="cart-item-meta">${new Date(o.date).toLocaleDateString()}</div></div>
          <div class="cart-item-price">${DC.formatPrice(o.total)}</div>
        </div>`).join('')
      : '<div class="empty-state"><h3>NO ORDERS</h3><p>Start shopping.</p></div>';

    const enrolled = user.enrolledCourses || [];
    const courses  = DC.getCourses().filter(c => enrolled.includes(c.id));
    const coursesEl = document.getElementById('account-courses');
    coursesEl.innerHTML = courses.length
      ? courses.map(c => `<div class="cart-item" style="grid-template-columns:1fr auto">
          <div><div class="cart-item-name">${c.title}</div><div class="cart-item-meta">${c.instructor} · ${c.duration}</div></div>
          <button class="btn btn-sm btn-ghost" onclick="App.navigate('courses')">VIEW</button>
        </div>`).join('')
      : '<div class="empty-state"><h3>NO COURSES</h3><p>Enroll in a course.</p></div>';

    document.getElementById('profile-name').value  = user.name;
    document.getElementById('profile-email').value = user.email;

    document.querySelectorAll('.account-nav-item[data-tab]').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.account-nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.account-tab').forEach(t => t.classList.remove('active'));
        item.classList.add('active');
        document.getElementById('account-tab-' + item.dataset.tab).classList.add('active');
      });
    });

    document.getElementById('btn-logout').onclick = () => { DC.logout(); this.updateAuthNav(); this.navigate('home'); this.toast('Logged out'); };

    document.getElementById('form-profile').onsubmit = async (e) => {
      e.preventDefault();
      const updated = { ...user, name: document.getElementById('profile-name').value };
      await DC.updateUser(updated);
      this.toast('Profile updated');
      this.updateAuthNav();
    };
  },

  // ─── Checkout ────────────────────────────────────────────────────────────
  renderCheckout() {
    const cart = DC.getCart();
    const s    = DC.getSettings();
    if (!cart.length) { this.navigate('shop'); this.toast('Giỏ hàng trống', 'error'); return; }
    this._checkoutDiscount = 0;
    this._checkoutShipping = 0;
    this._appliedCoupon    = null;

    // Order summary
    const products  = DC.getProducts();
    const subtotal  = DC.cartTotal();
    const summaryEl = document.getElementById('checkout-summary');
    if (summaryEl) summaryEl.innerHTML = cart.map(item => {
      const p = products.find(p => p.id === item.productId);
      return p ? `<div class="order-summary-item"><span>${p.name}${item.size?' ('+item.size+')':''} ×${item.qty}</span><span>${DC.formatPrice(p.price * item.qty)}</span></div>` : '';
    }).join('');
    const subtotalEl = document.getElementById('checkout-subtotal');
    if (subtotalEl) subtotalEl.textContent = DC.formatPrice(subtotal);
    this._updateCheckoutTotal();

    // Shipping methods
    const shippingDefault = [
      { id:'standard', name:'Giao hàng tiêu chuẩn', eta:'3-5 ngày làm việc', price:0 },
      { id:'express',  name:'Giao hàng nhanh',       eta:'1-2 ngày làm việc', price:30000 },
    ];
    const shippingMethods = (s.shippingMethods && s.shippingMethods.length) ? s.shippingMethods : shippingDefault;
    const shipEl = document.getElementById('shipping-methods-container');
    if (shipEl) {
      shipEl.innerHTML = `<div class="ship-method-list">${shippingMethods.map((m, i) =>
        `<label class="ship-method-row${i===0?' selected':''}">
          <div class="ship-method-left">
            <input type="radio" name="ship-method" value="${m.id}" data-price="${m.price||0}" ${i===0?'checked':''}>
            <div><div class="ship-method-name">${m.name}</div><div class="ship-method-eta">${m.eta||''}</div></div>
          </div>
          <div class="ship-method-price">${(m.price||0) > 0 ? DC.formatPrice(m.price) : 'Miễn phí'}</div>
        </label>`).join('')}</div>`;
      shipEl.querySelectorAll('input[name="ship-method"]').forEach(r => {
        r.addEventListener('change', () => {
          shipEl.querySelectorAll('.ship-method-row').forEach(row => row.classList.remove('selected'));
          r.closest('.ship-method-row').classList.add('selected');
          this._checkoutShipping = parseInt(r.dataset.price) || 0;
          const costEl = document.getElementById('checkout-shipping-cost');
          if (costEl) costEl.textContent = this._checkoutShipping > 0 ? DC.formatPrice(this._checkoutShipping) : 'Miễn phí';
          this._updateCheckoutTotal();
        });
      });
    }

    // Payment methods — SVG icons, no emoji
    const PAY_ICONS = {
      cod:     `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h5a1 1 0 011 1v10a1 1 0 01-1 1H6a1 1 0 01-1-1v-3"/><path d="M8 11h3m-3 3h5"/></svg>`,
      bank:    `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v1H3V9z"/><path d="M5 10v8m4-8v8m4-8v8m4-8v8"/><path d="M3 18h18"/></svg>`,
      momo:    `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#ae2070;color:#fff;font-size:0.55rem;font-weight:800;border-radius:3px;line-height:1">MoMo</span>`,
      zalopay: `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#0068ff;color:#fff;font-size:0.55rem;font-weight:800;border-radius:3px;line-height:1">Zalo</span>`,
      vnpay:   `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#e31837;color:#fff;font-size:0.55rem;font-weight:800;border-radius:3px;line-height:1">VNP</span>`,
      card:    `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="5" y1="15" x2="9" y2="15"/><line x1="13" y1="15" x2="17" y2="15"/></svg>`,
      install: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h2m4 0h2M8 18h2m4 0h2"/></svg>`,
    };
    const pm = s.payment || {};
    const payMethods = [];
    if (pm.cod?.enabled !== false)    payMethods.push({ id:'cod',     icon:PAY_ICONS.cod,     name:'Thanh toán khi nhận hàng (COD)',  desc:'Trả tiền mặt khi nhận hàng' });
    if (pm.bankTransfer?.enabled)     payMethods.push({ id:'bank',    icon:PAY_ICONS.bank,    name:'Chuyển khoản ngân hàng',           desc:'Thanh toán qua tài khoản ngân hàng' });
    if (pm.momo?.enabled)             payMethods.push({ id:'momo',    icon:PAY_ICONS.momo,    name:'Ví MoMo',                          desc:'Quét mã QR hoặc chuyển khoản MoMo' });
    if (pm.zalopay?.enabled)          payMethods.push({ id:'zalopay', icon:PAY_ICONS.zalopay, name:'ZaloPay',                          desc:'Quét mã QR hoặc chuyển khoản ZaloPay' });
    if (pm.vnpay?.enabled)            payMethods.push({ id:'vnpay',   icon:PAY_ICONS.vnpay,   name:'VNPay — ATM / Internet Banking',   desc:'Tất cả ngân hàng nội địa qua cổng VNPay' });
    if (pm.stripe?.enabled)           payMethods.push({ id:'card',    icon:PAY_ICONS.card,    name:'Thẻ Visa / Mastercard / JCB',      desc:'Thanh toán bảo mật qua Stripe' });
    if (pm.installment?.enabled)      payMethods.push({ id:'install', icon:PAY_ICONS.install, name:'Trả góp 0% lãi suất',              desc:pm.installment?.desc || 'Trả góp qua thẻ tín dụng hoặc đối tác tài chính' });
    if (!payMethods.length) payMethods.push({ id:'cod', icon:PAY_ICONS.cod, name:'Thanh toán khi nhận hàng (COD)', desc:'Trả tiền mặt khi nhận hàng' });

    const payEl = document.getElementById('payment-options-container');
    if (payEl) {
      payEl.innerHTML = `<div class="pay-option-list">${payMethods.map((m, i) => {
        const expandHTML = this._checkoutExpandHTML(m.id, pm);
        return `<div class="pay-option-wrap">
          <label class="pay-option-row${i===0?' selected':''}">
            <input type="radio" name="pay-method" value="${m.id}" ${i===0?'checked':''}>
            <span class="pay-option-icon">${m.icon}</span>
            <div><div class="pay-option-name">${m.name}</div><div class="pay-option-desc">${m.desc}</div></div>
          </label>
          ${expandHTML ? `<div class="pay-option-expand${i===0&&expandHTML?' open':''}" id="pay-expand-${m.id}">${expandHTML}</div>` : ''}
        </div>`;
      }).join('')}</div>`;
      payEl.querySelectorAll('input[name="pay-method"]').forEach(r => {
        r.addEventListener('change', () => {
          payEl.querySelectorAll('.pay-option-row').forEach(row => row.classList.remove('selected'));
          r.closest('.pay-option-row').classList.add('selected');
          payEl.querySelectorAll('.pay-option-expand').forEach(ex => ex.classList.remove('open'));
          const ex = document.getElementById('pay-expand-' + r.value);
          if (ex) ex.classList.add('open');
        });
      });
    }

    document.getElementById('btn-place-order').onclick = () => this.placeOrder();
  },

  _checkoutExpandHTML(method, pm) {
    if (method === 'bank') {
      const b = pm.bankTransfer || {};
      if (!b.accountNumber) return `<div class="pay-option-expand-inner"><p style="font-size:0.82rem;color:var(--text-muted)">Thông tin tài khoản chưa được cấu hình.</p></div>`;
      return `<div class="pay-option-expand-inner">
        <div class="pay-expand-bank-row"><span>Ngân hàng</span><span class="pay-expand-bank-val">${b.bankName||'–'}</span></div>
        <div class="pay-expand-bank-row"><span>Số tài khoản</span><span class="pay-expand-bank-val">${b.accountNumber}</span></div>
        <div class="pay-expand-bank-row"><span>Chủ tài khoản</span><span class="pay-expand-bank-val">${b.accountOwner||'–'}</span></div>
        ${b.note ? `<p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.75rem">${b.note}</p>` : ''}
        ${b.qrUrl ? `<img class="pay-qr" src="${b.qrUrl}" alt="QR chuyển khoản">` : ''}
      </div>`;
    }
    if (method === 'momo') {
      const m = pm.momo || {};
      return `<div class="pay-option-expand-inner">
        ${m.phone ? `<div class="pay-expand-bank-row"><span>Số điện thoại MoMo</span><span class="pay-expand-bank-val">${m.phone}</span></div>` : ''}
        ${m.name  ? `<div class="pay-expand-bank-row"><span>Tên người nhận</span><span class="pay-expand-bank-val">${m.name}</span></div>` : ''}
        ${m.qrUrl ? `<img class="pay-qr" src="${m.qrUrl}" alt="QR MoMo">` : ''}
        ${(!m.phone && !m.qrUrl) ? `<p style="font-size:0.82rem;color:var(--text-muted)">Thông tin MoMo chưa được cấu hình.</p>` : ''}
      </div>`;
    }
    if (method === 'zalopay') {
      const z = pm.zalopay || {};
      return `<div class="pay-option-expand-inner">
        ${z.phone ? `<div class="pay-expand-bank-row"><span>Số điện thoại ZaloPay</span><span class="pay-expand-bank-val">${z.phone}</span></div>` : ''}
        ${z.name  ? `<div class="pay-expand-bank-row"><span>Tên người nhận</span><span class="pay-expand-bank-val">${z.name}</span></div>` : ''}
        ${z.qrUrl ? `<img class="pay-qr" src="${z.qrUrl}" alt="QR ZaloPay">` : ''}
        ${(!z.phone && !z.qrUrl) ? `<p style="font-size:0.82rem;color:var(--text-muted)">Thông tin ZaloPay chưa được cấu hình.</p>` : ''}
      </div>`;
    }
    if (method === 'card') {
      return `<div class="pay-option-expand-inner">
        <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem">
          <span class="pay-card-badge" style="border:1px solid #1a1f71;color:#1a1f71">VISA</span>
          <span class="pay-card-badge" style="border:1px solid #eb001b;color:#eb001b">Mastercard</span>
          <span class="pay-card-badge" style="border:1px solid #003087;color:#003087">JCB</span>
        </div>
        <div class="form-group" style="margin-bottom:0.75rem"><label style="font-size:0.75rem">Số thẻ</label><input placeholder="1234 5678 9012 3456" style="letter-spacing:0.05em"></div>
        <div class="form-row">
          <div class="form-group" style="margin-bottom:0"><label style="font-size:0.75rem">Ngày hết hạn</label><input placeholder="MM / YY"></div>
          <div class="form-group" style="margin-bottom:0"><label style="font-size:0.75rem">CVV</label><input placeholder="123" maxlength="4"></div>
        </div>
        <p style="font-size:0.7rem;color:var(--text-muted);margin-top:0.75rem">🔒 Bảo mật bởi Stripe — thông tin thẻ được mã hoá SSL 256-bit</p>
      </div>`;
    }
    if (method === 'install') {
      const inst = pm.installment || {};
      const plans = inst.plans || '3, 6, 12 tháng';
      const partners = inst.partners || 'Home Credit, Kredivo, FE Credit';
      return `<div class="pay-option-expand-inner">
        <div class="pay-expand-bank-row"><span>Kỳ hạn</span><span class="pay-expand-bank-val">${plans}</span></div>
        <div class="pay-expand-bank-row"><span>Đối tác</span><span class="pay-expand-bank-val">${partners}</span></div>
        ${inst.note ? `<p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.75rem">${inst.note}</p>` : '<p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.75rem">Nhân viên sẽ liên hệ hỗ trợ thủ tục trả góp sau khi đặt hàng.</p>'}
      </div>`;
    }
    return '';
  },

  _updateCheckoutTotal() {
    const subtotal  = DC.cartTotal();
    const discount  = this._checkoutDiscount || 0;
    const shipping  = this._checkoutShipping || 0;
    const total     = Math.max(0, subtotal - discount) + shipping;
    const totalEl   = document.getElementById('checkout-total');
    if (totalEl) totalEl.textContent = DC.formatPrice(total);
    const discRow   = document.getElementById('checkout-discount-row');
    const discAmt   = document.getElementById('checkout-discount-amount');
    if (discRow)  discRow.style.display  = discount > 0 ? '' : 'none';
    if (discAmt)  discAmt.textContent    = '−' + DC.formatPrice(discount);
  },

  applyCoupon() {
    const input = document.getElementById('coupon-input');
    const msg   = document.getElementById('coupon-msg');
    if (!input || !msg) return;
    const code    = input.value.trim().toUpperCase();
    const coupons = DC.getSettings().coupons || [];
    const coupon  = coupons.find(c => c.active && c.code.toUpperCase() === code);
    if (coupon) {
      const base = DC.cartTotal();
      if (coupon.minOrder && base < coupon.minOrder) {
        msg.textContent = `✕ Đơn tối thiểu ${DC.formatPrice(coupon.minOrder)} để dùng mã này`;
        msg.style.color = 'var(--accent-red)';
        msg.style.display = '';
        return;
      }
      const discount = coupon.type === 'percent'
        ? Math.round(base * coupon.value / 100)
        : Math.min(coupon.value, base);
      this._checkoutDiscount = discount;
      msg.textContent   = `✓ Giảm ${coupon.type === 'percent' ? coupon.value + '%' : DC.formatPrice(discount)}`;
      msg.style.color   = 'var(--accent)';
      msg.style.display = '';
      input.disabled    = true;
      this._updateCheckoutTotal();
    } else {
      msg.textContent   = '✕ Mã không hợp lệ hoặc đã hết hạn';
      msg.style.color   = 'var(--accent-red)';
      msg.style.display = '';
    }
  },

  async placeOrder() {
    const fullname = document.getElementById('ship-fullname')?.value.trim();
    const email    = document.getElementById('ship-email')?.value.trim();
    const phone    = document.getElementById('ship-phone')?.value.trim();
    const address  = document.getElementById('ship-address')?.value.trim();
    const city     = document.getElementById('ship-city')?.value.trim();
    if (!fullname || !email || !phone || !address || !city) {
      this.toast('Vui lòng điền đầy đủ thông tin giao hàng', 'error'); return;
    }
    const payMethodEl = document.querySelector('input[name="pay-method"]:checked');
    const shipMethodEl = document.querySelector('input[name="ship-method"]:checked');
    const subtotal  = DC.cartTotal();
    const discount  = this._checkoutDiscount || 0;
    const shipping  = this._checkoutShipping || 0;
    const total     = Math.max(0, subtotal - discount) + shipping;
    const user = DC.getCurrentUser();
    const order = {
      userId:   user ? user.id : 'guest',
      items:    DC.getCart(),
      subtotal, discount, shipping, total,
      paymentMethod:  payMethodEl?.value || 'cod',
      shippingMethod: shipMethodEl?.value || 'standard',
      shippingInfo: {
        name: fullname, email, phone, address, city,
        district: document.getElementById('ship-district')?.value.trim() || '',
        note:     document.getElementById('ship-note')?.value.trim() || '',
      },
    };
    try {
      const saved = await DC.saveOrder(order);
      DC.clearCart();
      this.updateCartBadge();
      this.toast(`Đặt hàng thành công! Mã đơn: #${saved.id}`);
      this.navigate('home');
    } catch(e) {
      this.toast('Lỗi đặt hàng: ' + e.message, 'error');
    }
  },

  // ─── Toast ────────────────────────────────────────────────────────────────
  toast(msg, type = 'success') {
    const c  = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast${type === 'error' ? ' error' : ''}`;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  },
};
