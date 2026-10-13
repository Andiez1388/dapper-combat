// ─── DAPPER COMBAT — Admin Panel ────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => { Admin.init(); });

const Admin = {
  editingProduct: null,
  editingCourse: null,

  async init() {
    // Check for existing valid token first
    if (DC.getToken()) {
      try {
        const user = await DC.loadCurrentUser();
        if (user && user.role === 'admin') { this.showApp(); return; }
      } catch {}
      DC.clearToken();
    }
    // Always require manual login — no auto-login
    this.showLoginScreen();
  },

  async checkAuth() { this.showApp(); },

  showLoginScreen() {
    document.getElementById('admin-login-screen').style.display = 'flex';
    document.getElementById('admin-app').style.display = 'none';
    document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('admin-login-error');
      const result = await DC.loginUser(
        document.getElementById('admin-login-email').value,
        document.getElementById('admin-login-password').value
      );
      if (result.error || result.user?.role !== 'admin') {
        errEl.textContent = result.error || 'Access denied. Admin only.';
        errEl.style.display = 'block';
      } else { this.showApp(); }
    });
  },

  async showApp() {
    document.getElementById('admin-login-screen').style.display = 'none';
    document.getElementById('admin-app').style.display = 'flex';

    try { await DC.loadAll(); } catch(e) { console.error(e); }
    this.applySettings();
    this.initNav();
    this.showSection('dashboard');
  },

  applySettings() {
    const s = DC.getSettings();
    const r = document.documentElement.style;
    const c = s.colors;
    r.setProperty('--bg', c.bg); r.setProperty('--bg-secondary', c.bgSecondary);
    r.setProperty('--bg-card', c.bgCard); r.setProperty('--text', c.text);
    r.setProperty('--text-muted', c.textMuted); r.setProperty('--accent', c.accent);
    r.setProperty('--accent-red', c.accentRed); r.setProperty('--border', c.border);
    r.setProperty('--btn-text', c.btnText); r.setProperty('--font-heading', s.fonts.heading);
    r.setProperty('--font-body', s.fonts.body); r.setProperty('--btn-radius', s.layout.btnRadius);
    r.setProperty('--card-radius', s.layout.cardRadius); r.setProperty('--nav-height', s.layout.navHeight);
    // Apply logos
    const mark = s.logoMark || '/img/dc-mark.svg';
    document.querySelectorAll('.admin-logo-img').forEach(el => el.src = mark);
  },

  initNav() {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
      item.addEventListener('click', () => this.showSection(item.dataset.section));
    });
    document.getElementById('btn-admin-logout').addEventListener('click', () => { DC.logout(); location.reload(); });
    document.getElementById('btn-view-site').addEventListener('click', () => window.open('/', '_blank'));
  },

  showSection(id) {
    document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.toggle('active', i.dataset.section === id));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.toggle('active', s.id === 'section-' + id));
    const mainEl = document.querySelector('.admin-main');
    if (mainEl) mainEl.scrollTop = 0;
    const titles = { dashboard:'DASHBOARD', design:'DESIGN', content:'CONTENT', media:'MEDIA', products:'PRODUCTS', courses:'COURSES', orders:'ORDERS', enrollments:'ENROLLMENTS', users:'USERS', navigation:'NAVIGATION', payments:'PAYMENTS', social:'SOCIAL & LIÊN HỆ', community:'CỘNG ĐỒNG', testimonials:'ĐÁNH GIÁ — TESTIMONIALS', schedule:'LỊCH HỌC', pricing:'PRICING — BẢNG GIÁ', preview:'PREVIEW — STOREFRONT', security:'SECURITY', categories:'CATEGORIES', 'course-cta':'COURSE CTA BANNER', 'announcement-bar':'ANNOUNCEMENT BAR', 'promo-popup':'PROMO POPUP', 'footer-content':'FOOTER — NỘI DUNG' };
    document.getElementById('section-title').textContent = titles[id] || id.toUpperCase();
    document.getElementById('section-breadcrumb').textContent = id === 'preview' ? 'Live preview of your storefront' : 'Admin Panel';

    const renders = {
      dashboard:  () => this.renderDashboard(),
      design:     () => this.renderDesign(),
      content:    () => this.renderContent(),
      media:      () => this.renderMedia(),
      products:   () => this.renderProducts(),
      courses:    () => this.renderCoursesAdmin(),
      orders:     () => this.renderOrders(),
      enrollments: () => this.renderEnrollments(),
      users:      () => this.renderUsers(),
      navigation:   () => this.renderNavigation(),
      'hero-promo': () => this.renderHeroPromo(),
      philosophy:   () => this.renderPhilosophy(),
      instructor:   () => this.renderInstructor(),
      gallery4:          () => this.renderGallery4(),
      categories:        () => this.renderCategories(),
      'course-cta':      () => this.renderCourseCTA(),
      'announcement-bar':() => this.renderAnnouncementBar(),
      'promo-popup':     () => this.renderPromoPopup(),
      'footer-content':  () => this.renderFooterContent(),
      payments:          () => this.renderPayments(),
      social:       () => this.renderSocial(),
      community:    () => this.renderCommunityAdmin(),
      testimonials: () => this.renderTestimonials(),
      schedule:   () => this.renderSchedule(),
      pricing:    () => this.renderPricing(),
      coupons:    () => this.renderCoupons(),
      preview:    () => this.renderPreview(),
      security:   () => this.renderSecurity(),
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
    document.getElementById('stat-products').textContent = DC.getProducts().length;
    document.getElementById('stat-courses').textContent  = DC.getCourses().length;
    document.getElementById('stat-users').textContent    = DC.getUsers().length;
    const orders  = DC.getOrders();
    document.getElementById('stat-orders').textContent  = orders.length;
    document.getElementById('stat-revenue').textContent = DC.formatPrice(orders.reduce((s, o) => s + (o.total||0), 0));

    const el = document.getElementById('recent-orders');
    el.innerHTML = orders.slice(0, 5).map(o =>
      `<tr><td>#${o.id}</td><td>${o.userId}</td><td>${DC.formatPrice(o.total)}</td><td><span class="tag">${o.status}</span></td><td>${new Date(o.date).toLocaleDateString()}</td></tr>`
    ).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">No orders yet</td></tr>';
  },

  // ─── Design ──────────────────────────────────────────────────────────────
  renderDesign() {
    const s = DC.getSettings();
    const fields = { 'color-bg':s.colors.bg, 'color-bg-secondary':s.colors.bgSecondary, 'color-bg-card':s.colors.bgCard, 'color-text':s.colors.text, 'color-text-muted':s.colors.textMuted, 'color-accent':s.colors.accent, 'color-accent-red':s.colors.accentRed, 'color-border':s.colors.border, 'color-btn-text':s.colors.btnText };
    const cssMap  = { 'color-bg':'--bg', 'color-bg-secondary':'--bg-secondary', 'color-bg-card':'--bg-card', 'color-text':'--text', 'color-text-muted':'--text-muted', 'color-accent':'--accent', 'color-accent-red':'--accent-red', 'color-border':'--border', 'color-btn-text':'--btn-text' };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) { el.value = val; el.oninput = () => document.documentElement.style.setProperty(cssMap[id], el.value); }
    });
    const fh = document.getElementById('font-heading'); if (fh) fh.value = s.fonts.heading;
    const fb = document.getElementById('font-body');    if (fb) fb.value = s.fonts.body;
    const br = document.getElementById('btn-radius');   if (br) br.value = parseInt(s.layout.btnRadius) || 0;

    document.getElementById('btn-save-design').onclick = () => this.saveDesign();
    document.getElementById('btn-reset-design').onclick = () => {
      if (!confirm('Reset all design settings to default?')) return;
      const def = DC._defaultSettings();
      const cur = DC.getSettings();
      cur.colors = def.colors; cur.fonts = def.fonts; cur.layout = def.layout;
      DC.saveSettings(cur).then(() => { this.applySettings(); this.renderDesign(); this.toast('Design reset'); });
    };
  },

  async saveDesign() {
    const s = DC.getSettings();
    s.colors = {
      bg:          document.getElementById('color-bg').value,
      bgSecondary: document.getElementById('color-bg-secondary').value,
      bgCard:      document.getElementById('color-bg-card').value,
      text:        document.getElementById('color-text').value,
      textMuted:   document.getElementById('color-text-muted').value,
      accent:      document.getElementById('color-accent').value,
      accentRed:   document.getElementById('color-accent-red').value,
      border:      document.getElementById('color-border').value,
      btnText:     document.getElementById('color-btn-text').value,
    };
    const fh = document.getElementById('font-heading'); if (fh) s.fonts.heading = fh.value;
    const fb = document.getElementById('font-body');    if (fb) s.fonts.body = fb.value;
    const br = document.getElementById('btn-radius');   if (br) s.layout.btnRadius = br.value + 'px';
    try {
      await DC.saveSettings(s);
      this.applySettings();
      this.toast('Design saved!');
      // Reload preview iframe if open
      const iframe = document.getElementById('preview-iframe');
      if (iframe && iframe.contentWindow) {
        try { iframe.contentWindow.postMessage({ type:'reload-settings' }, '*'); } catch{}
      }
    }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Content ──────────────────────────────────────────────────────────────
  renderContent() {
    const s = DC.getSettings();
    // Announcement bar
    const ann = s.announcementBar || {};
    const setV = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    const setC = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
    setChk('ann-enabled', ann.enabled);
    setV('ann-text', ann.text);
    setV('ann-text2', ann.text2);
    setV('ann-btn-text', ann.btnText);
    setV('ann-btn-link', ann.btnLink);
    const bgCol  = ann.bgColor   || '#0d0d0d';
    const txtCol = ann.textColor || '#ffffff';
    setV('ann-bg-color',      bgCol);
    setV('ann-bg-color-hex',  bgCol);
    setV('ann-text-color',    txtCol);
    setV('ann-text-color-hex',txtCol);
    // Sync color pickers ↔ hex inputs
    const syncColor = (pickId, hexId) => {
      const pick = document.getElementById(pickId), hex = document.getElementById(hexId);
      if (!pick || !hex) return;
      pick.addEventListener('input', () => hex.value = pick.value);
      hex.addEventListener('input', () => { if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) pick.value = hex.value; });
    };
    syncColor('ann-bg-color', 'ann-bg-color-hex');
    syncColor('ann-text-color', 'ann-text-color-hex');
    const btnSaveAnn = document.getElementById('btn-save-ann');
    if (btnSaveAnn) btnSaveAnn.onclick = async () => {
      const sp = DC.getSettings();
      sp.announcementBar = {
        enabled:   document.getElementById('ann-enabled')?.checked || false,
        text:      document.getElementById('ann-text')?.value.trim() || '',
        text2:     document.getElementById('ann-text2')?.value.trim() || '',
        btnText:   document.getElementById('ann-btn-text')?.value.trim() || '',
        btnLink:   document.getElementById('ann-btn-link')?.value.trim() || '',
        bgColor:   document.getElementById('ann-bg-color-hex')?.value.trim() || '#0d0d0d',
        textColor: document.getElementById('ann-text-color-hex')?.value.trim() || '#ffffff',
      };
      try { await DC.saveSettings(sp); this.toast('Announcement bar đã lưu!'); }
      catch(e) { this.toast(e.message, 'error'); }
    };

    document.getElementById('content-site-name').value    = s.siteName;
    document.getElementById('content-tagline').value      = s.tagline;
    document.getElementById('content-hero-headline').value= s.heroHeadline;
    document.getElementById('content-hero-subtext').value = s.heroSubtext;
    Object.keys(s.sections).forEach(key => {
      const el = document.getElementById('section-toggle-' + key);
      if (el) el.checked = s.sections[key];
    });
    document.getElementById('content-seo-title').value    = s.seo?.title || '';
    document.getElementById('content-seo-desc').value     = s.seo?.description || '';
    document.getElementById('content-seo-keywords').value = s.seo?.keywords || '';
    const vbToggle = document.getElementById('section-toggle-videoBannerVisible');
    if (vbToggle) vbToggle.checked = s.videoBanner?.visible !== false;
    const vb2Toggle = document.getElementById('section-toggle-videoBanner2Visible');
    if (vb2Toggle) vb2Toggle.checked = s.videoBanner2?.visible !== false;
    document.getElementById('btn-save-content').onclick   = () => this.saveContent();

    // Program blocks load
    const programs = s.programBlocks || {};
    [1, 2, 3].forEach(n => {
      const p = programs[`block${n}`] || {};
      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
      setVal(`prog-media-url-${n}`,  p.mediaUrl);
      setVal(`prog-media-type-${n}`, p.mediaType || 'image');
      setVal(`prog-title-size-${n}`, p.titleSize);
      setVal(`prog-body-size-${n}`,  p.bodySize);
      setVal(`prog-font-${n}`,       p.fontFamily);
      setVal(`prog-align-${n}`,      p.textAlign || 'left');
      setVal(`prog-tag-${n}`,        p.tag);
      setVal(`prog-title-${n}`,      p.title);
      setVal(`prog-desc-${n}`,       p.description);
      setVal(`prog-features-${n}`,   p.features);
      setVal(`prog-btn-text-${n}`,   p.btnText);
      setVal(`prog-btn-link-${n}`,   p.btnLink);
    });
    const btnSaveProg = document.getElementById('btn-save-programs');
    if (btnSaveProg) btnSaveProg.onclick = async () => {
      const sp = DC.getSettings();
      sp.programBlocks = {};
      [1, 2, 3].forEach(n => {
        const getVal = id => document.getElementById(id)?.value.trim() || '';
        sp.programBlocks[`block${n}`] = {
          mediaUrl:   getVal(`prog-media-url-${n}`),
          mediaType:  getVal(`prog-media-type-${n}`) || 'image',
          titleSize:  getVal(`prog-title-size-${n}`),
          bodySize:   getVal(`prog-body-size-${n}`),
          fontFamily: getVal(`prog-font-${n}`),
          textAlign:  getVal(`prog-align-${n}`) || 'left',
          tag:        getVal(`prog-tag-${n}`),
          title:      getVal(`prog-title-${n}`),
          description:getVal(`prog-desc-${n}`),
          features:   getVal(`prog-features-${n}`),
          btnText:    getVal(`prog-btn-text-${n}`),
          btnLink:    getVal(`prog-btn-link-${n}`),
        };
      });
      try { await DC.saveSettings(sp); this.toast('Program blocks đã lưu!'); }
      catch(e) { this.toast(e.message, 'error'); }
    };
  },

  switchProgTab(n) {
    [1, 2, 3].forEach(i => {
      const panel = document.getElementById(`prog-panel-${i}`);
      const btn   = document.querySelector(`[data-prog-tab="${i}"]`);
      if (panel) panel.style.display = i === n ? '' : 'none';
      if (btn) {
        btn.className = i === n
          ? 'btn btn-sm btn-primary'
          : 'btn btn-sm';
        if (i !== n) btn.style.cssText = 'background:var(--bg-secondary);color:var(--text-muted)';
        else btn.style.cssText = '';
      }
    });
  },

  async saveContent() {
    const s = DC.getSettings();
    s.siteName    = document.getElementById('content-site-name').value;
    s.tagline     = document.getElementById('content-tagline').value;
    s.heroHeadline= document.getElementById('content-hero-headline').value;
    s.heroSubtext = document.getElementById('content-hero-subtext').value;
    Object.keys(s.sections).forEach(key => {
      const el = document.getElementById('section-toggle-' + key);
      if (el) s.sections[key] = el.checked;
    });
    const vbToggle = document.getElementById('section-toggle-videoBannerVisible');
    if (vbToggle) {
      if (!s.videoBanner) s.videoBanner = {};
      s.videoBanner.visible = vbToggle.checked;
    }
    const vb2Toggle = document.getElementById('section-toggle-videoBanner2Visible');
    if (vb2Toggle) {
      if (!s.videoBanner2) s.videoBanner2 = {};
      s.videoBanner2.visible = vb2Toggle.checked;
    }
    s.seo = { title: document.getElementById('content-seo-title').value, description: document.getElementById('content-seo-desc').value, keywords: document.getElementById('content-seo-keywords').value };
    try { await DC.saveSettings(s); this.toast('Content saved!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Logo & Branding ─────────────────────────────────────────────────────
  renderLogoSection() {
    const s = DC.getSettings();
    const markSrc    = s.logoMark  || '/img/dc-mark.svg';
    const fullSrc    = s.logoFull  || '/img/dc-logo.svg';
    const faviconSrc = s.faviconUrl || '/img/dc-mark.svg';
    const markImg    = document.getElementById('logo-mark-img');
    const fullImg    = document.getElementById('logo-full-img');
    const favImg     = document.getElementById('favicon-img');
    if (markImg) markImg.src = markSrc;
    if (fullImg) fullImg.src = fullSrc;
    if (favImg)  favImg.src  = faviconSrc;

    const wireUpload = (inputId, previewId, key) => {
      const input = document.getElementById(inputId);
      if (!input) return;
      input.onchange = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = document.getElementById(previewId)?.querySelector('img');
          if (img) img.src = ev.target.result;
          input._pendingData = ev.target.result;
        };
        reader.readAsDataURL(file);
      };
    };
    wireUpload('logo-mark-upload',  'logo-mark-preview',  'logoMark');
    wireUpload('logo-full-upload',  'logo-full-preview',  'logoFull');
    wireUpload('favicon-upload',    'favicon-preview',    'faviconUrl');

    document.getElementById('btn-save-logos').onclick = () => this.saveLogoSettings();
  },

  useLogoUrl(type) {
    const urlMap = { mark: 'logo-mark-url', full: 'logo-full-url', favicon: 'favicon-url' };
    const imgMap = { mark: 'logo-mark-img', full: 'logo-full-img', favicon: 'favicon-img' };
    const inputMap = { mark: 'logo-mark-upload', full: 'logo-full-upload', favicon: 'favicon-upload' };
    const url = document.getElementById(urlMap[type])?.value?.trim();
    if (!url) return;
    const img = document.getElementById(imgMap[type]);
    if (img) img.src = url;
    const input = document.getElementById(inputMap[type]);
    if (input) input._pendingData = url;
  },

  clearLogo(type) {
    const defaults = { mark: '/img/dc-mark.svg', full: '/img/dc-logo.svg', favicon: '/img/dc-mark.svg' };
    const imgMap   = { mark: 'logo-mark-img', full: 'logo-full-img', favicon: 'favicon-img' };
    const inputMap = { mark: 'logo-mark-upload', full: 'logo-full-upload', favicon: 'favicon-upload' };
    const img   = document.getElementById(imgMap[type]);
    const input = document.getElementById(inputMap[type]);
    if (img) img.src = defaults[type];
    if (input) { input._pendingData = ''; input.value = ''; }
    // Save cleared value
    const keyMap = { mark: 'logoMark', full: 'logoFull', favicon: 'faviconUrl' };
    const s = DC.getSettings();
    s[keyMap[type]] = '';
    DC.saveSettings(s).then(() => { this.toast('Reset to default'); this.broadcastLogoUpdate(s); });
  },

  async saveLogoSettings() {
    const s = DC.getSettings();
    const markInput = document.getElementById('logo-mark-upload');
    const fullInput = document.getElementById('logo-full-upload');
    const favInput  = document.getElementById('favicon-upload');
    if (markInput?._pendingData !== undefined) s.logoMark   = markInput._pendingData;
    if (fullInput?._pendingData !== undefined) s.logoFull   = fullInput._pendingData;
    if (favInput?._pendingData  !== undefined) s.faviconUrl = favInput._pendingData;
    try {
      await DC.saveSettings(s);
      this.toast('Logos saved!');
      this.broadcastLogoUpdate(s);
    } catch(e) { this.toast(e.message, 'error'); }
  },

  broadcastLogoUpdate(s) {
    // Update logos in the admin panel itself
    const mark = s.logoMark  || '/img/dc-mark.svg';
    const full = s.logoFull  || '/img/dc-logo.svg';
    document.querySelectorAll('.admin-logo-img').forEach(el => el.src = mark);
    // Notify preview iframe if open
    const iframe = document.getElementById('preview-frame');
    if (iframe) iframe.contentWindow?.postMessage({ type:'reload-settings' }, '*');
  },

  // ─── Media ────────────────────────────────────────────────────────────────
  renderMedia() {
    this.renderLogoSection();
    const s = DC.getSettings();
    const heroPreview = document.getElementById('hero-media-preview');
    if (s.heroMedia) {
      heroPreview.innerHTML = s.heroMediaType === 'video'
        ? `<video src="${s.heroMedia}" style="max-width:100%;max-height:200px" controls></video>`
        : `<img src="${s.heroMedia}" style="max-width:100%;max-height:200px;object-fit:cover">`;
    } else {
      heroPreview.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);border:2px dashed var(--border)">No hero media set</div>';
    }

    document.getElementById('hero-media-upload').onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const s = DC.getSettings();
        s.heroMedia = ev.target.result;
        s.heroMediaType = file.type.startsWith('video') ? 'video' : 'image';
        try { await DC.saveSettings(s); this.renderMedia(); this.toast('Hero media uploaded!'); }
        catch(err) { this.toast(err.message, 'error'); }
      };
      reader.readAsDataURL(file);
    };

    document.getElementById('btn-clear-hero').onclick = async () => {
      const s = DC.getSettings();
      s.heroMedia = '';
      try { await DC.saveSettings(s); this.renderMedia(); this.toast('Cleared'); }
      catch(e) { this.toast(e.message, 'error'); }
    };

    // Video Banner
    const vb = s.videoBanner || {};
    const vbUrlEl  = document.getElementById('vbanner-media-url');
    const vbTypeEl = document.getElementById('vbanner-media-type');
    if (vbUrlEl)  vbUrlEl.value  = vb.mediaUrl  || '';
    if (vbTypeEl) vbTypeEl.value = vb.mediaType || 'video';
    const setIfEl = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setIfEl('vbanner-tag-input',      vb.tag);
    setIfEl('vbanner-headline-input', vb.headline);
    setIfEl('vbanner-sub-input',      vb.sub);
    setIfEl('vbanner-cta-text-input', vb.ctaText);
    setIfEl('vbanner-cta-link-input', vb.ctaLink);

    const btnSaveVb = document.getElementById('btn-save-vbanner');
    if (btnSaveVb) btnSaveVb.onclick = async () => {
      const s4 = DC.getSettings();
      s4.videoBanner = {
        mediaUrl:  document.getElementById('vbanner-media-url')?.value.trim()       || '',
        mediaType: document.getElementById('vbanner-media-type')?.value              || 'video',
        tag:       document.getElementById('vbanner-tag-input')?.value.trim()        || '',
        headline:  document.getElementById('vbanner-headline-input')?.value.trim()   || '',
        sub:       document.getElementById('vbanner-sub-input')?.value.trim()        || '',
        ctaText:   document.getElementById('vbanner-cta-text-input')?.value.trim()   || '',
        ctaLink:   document.getElementById('vbanner-cta-link-input')?.value.trim()   || '',
        visible:   true,
      };
      try { await DC.saveSettings(s4); this.toast('Video banner 1 đã lưu!'); }
      catch(e) { this.toast(e.message, 'error'); }
    };

    // Video Banner 2
    const vb2 = s.videoBanner2 || {};
    const setIfEl2 = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setIfEl2('vbanner2-media-url',     vb2.mediaUrl);
    setIfEl2('vbanner2-tag-input',     vb2.tag);
    setIfEl2('vbanner2-headline-input',vb2.headline);
    setIfEl2('vbanner2-sub-input',     vb2.sub);
    setIfEl2('vbanner2-cta-text-input',vb2.ctaText);
    setIfEl2('vbanner2-cta-link-input',vb2.ctaLink);
    const vb2TypeEl = document.getElementById('vbanner2-media-type');
    if (vb2TypeEl) vb2TypeEl.value = vb2.mediaType || 'video';

    const btnSaveVb2 = document.getElementById('btn-save-vbanner2');
    if (btnSaveVb2) btnSaveVb2.onclick = async () => {
      const s5 = DC.getSettings();
      s5.videoBanner2 = {
        mediaUrl:  document.getElementById('vbanner2-media-url')?.value.trim()        || '',
        mediaType: document.getElementById('vbanner2-media-type')?.value               || 'video',
        tag:       document.getElementById('vbanner2-tag-input')?.value.trim()         || '',
        headline:  document.getElementById('vbanner2-headline-input')?.value.trim()    || '',
        sub:       document.getElementById('vbanner2-sub-input')?.value.trim()         || '',
        ctaText:   document.getElementById('vbanner2-cta-text-input')?.value.trim()    || '',
        ctaLink:   document.getElementById('vbanner2-cta-link-input')?.value.trim()    || '',
        visible:   true,
      };
      try { await DC.saveSettings(s5); this.toast('Video banner 2 đã lưu!'); }
      catch(e) { this.toast(e.message, 'error'); }
    };

    // Duo Images
    const duo = s.duoImages || {};
    const loadDuoSide = (side) => {
      const d = duo[side] || {};
      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
      setVal(`duo-${side}-img`,   d.imageUrl);
      setVal(`duo-${side}-tag`,   d.tag);
      setVal(`duo-${side}-title`, d.title);
      setVal(`duo-${side}-cta`,   d.cta);
      setVal(`duo-${side}-link`,  d.link);
      const preview = document.getElementById(`duo-preview-${side}`);
      if (preview && d.imageUrl) {
        preview.style.backgroundImage = `url('${d.imageUrl}')`;
        preview.textContent = '';
      }
      // live preview on URL change
      const imgInput = document.getElementById(`duo-${side}-img`);
      if (imgInput) imgInput.oninput = () => {
        const url = imgInput.value.trim();
        if (preview) { preview.style.backgroundImage = url ? `url('${url}')` : ''; preview.textContent = url ? '' : 'Chưa có ảnh'; }
      };
    };
    loadDuoSide('left');
    loadDuoSide('right');

    const btnSaveDuo = document.getElementById('btn-save-duo');
    if (btnSaveDuo) btnSaveDuo.onclick = async () => {
      const s6 = DC.getSettings();
      s6.duoImages = {
        visible: true,
        left:  { imageUrl: document.getElementById('duo-left-img')?.value.trim()   || '', tag: document.getElementById('duo-left-tag')?.value.trim()   || '', title: document.getElementById('duo-left-title')?.value.trim()  || '', cta: document.getElementById('duo-left-cta')?.value.trim()   || '', link: document.getElementById('duo-left-link')?.value.trim()  || '' },
        right: { imageUrl: document.getElementById('duo-right-img')?.value.trim()  || '', tag: document.getElementById('duo-right-tag')?.value.trim()  || '', title: document.getElementById('duo-right-title')?.value.trim() || '', cta: document.getElementById('duo-right-cta')?.value.trim()  || '', link: document.getElementById('duo-right-link')?.value.trim() || '' },
      };
      try { await DC.saveSettings(s6); this.toast('2 hình ảnh đã lưu!'); }
      catch(e) { this.toast(e.message, 'error'); }
    };

    // Courses Trio Videos
    const trio = s.coursesTrioVideos || {};
    [1, 2, 3].forEach(n => {
      const slot = trio[`slot${n}`] || {};
      const urlEl  = document.getElementById(`trio-url-${n}`);
      const typeEl = document.getElementById(`trio-type-${n}`);
      if (urlEl)  urlEl.value  = slot.mediaUrl  || '';
      if (typeEl) typeEl.value = slot.mediaType || 'video';
    });
    const btnSaveTrio = document.getElementById('btn-save-trio');
    if (btnSaveTrio) btnSaveTrio.onclick = async () => {
      const st = DC.getSettings();
      st.coursesTrioVideos = { slot1: {}, slot2: {}, slot3: {} };
      [1, 2, 3].forEach(n => {
        st.coursesTrioVideos[`slot${n}`] = {
          mediaUrl:  document.getElementById(`trio-url-${n}`)?.value.trim()  || '',
          mediaType: document.getElementById(`trio-type-${n}`)?.value || 'video',
        };
      });
      try { await DC.saveSettings(st); this.toast('3 video courses đã lưu!'); }
      catch(e) { this.toast(e.message, 'error'); }
    };

    // Courses vbanners A & B
    const cvb = s.coursesVbanners || {};
    ['a','b'].forEach(key => {
      const slot = cvb[key] || {};
      const urlEl  = document.getElementById(`courses-vbanner-${key}-url`);
      const typeEl = document.getElementById(`courses-vbanner-${key}-type`);
      if (urlEl)  urlEl.value  = slot.mediaUrl  || '';
      if (typeEl) typeEl.value = slot.mediaType || 'video';
    });
    const btnSaveCVB = document.getElementById('btn-save-courses-vbanners');
    if (btnSaveCVB) btnSaveCVB.onclick = async () => {
      const sc = DC.getSettings();
      sc.coursesVbanners = {};
      ['a','b'].forEach(key => {
        sc.coursesVbanners[key] = {
          mediaUrl:  document.getElementById(`courses-vbanner-${key}-url`)?.value.trim()  || '',
          mediaType: document.getElementById(`courses-vbanner-${key}-type`)?.value || 'video',
        };
      });
      try { await DC.saveSettings(sc); this.toast('2 video banner courses đã lưu!'); }
      catch(e) { this.toast(e.message, 'error'); }
    };

    // 9-image gallery
    const gal = s.coursesGallery || {};
    for (let i = 1; i <= 9; i++) {
      const urlEl   = document.getElementById(`gallery9-url-${i}`);
      const preview = document.getElementById(`gallery9-preview-${i}`);
      const url = gal[`img${i}`] || '';
      if (urlEl) {
        urlEl.value = url;
        urlEl.oninput = () => {
          const v = urlEl.value.trim();
          if (preview) { preview.style.backgroundImage = v ? `url('${v}')` : ''; preview.textContent = v ? '' : '—'; }
        };
      }
      if (preview && url) { preview.style.backgroundImage = `url('${url}')`; preview.textContent = ''; }
    }
    const btnSaveGal = document.getElementById('btn-save-gallery9');
    if (btnSaveGal) btnSaveGal.onclick = async () => {
      const sg = DC.getSettings();
      sg.coursesGallery = {};
      for (let i = 1; i <= 9; i++) {
        sg.coursesGallery[`img${i}`] = document.getElementById(`gallery9-url-${i}`)?.value.trim() || '';
      }
      try { await DC.saveSettings(sg); this.toast('9 ảnh gallery đã lưu!'); }
      catch(e) { this.toast(e.message, 'error'); }
    };

    // Category banner image previews
    const s2 = DC.getSettings();
    ['apparel','equipment','gloves','courses'].forEach(cat => {
      const preview = document.getElementById(`cat-img-preview-${cat}`);
      if (s2.categoryImages && s2.categoryImages[cat]) {
        preview.innerHTML = `<img src="${s2.categoryImages[cat]}" style="width:100%;height:100%;object-fit:cover">`;
      }
      const input = document.querySelector(`.cat-img-upload[data-cat="${cat}"]`);
      if (input) {
        input.onchange = (e) => {
          const file = e.target.files[0]; if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            preview.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover">`;
            input._pendingData = ev.target.result;
          };
          reader.readAsDataURL(file);
        };
      }
    });

    document.getElementById('btn-save-cat-images').onclick = async () => {
      const s3 = DC.getSettings();
      if (!s3.categoryImages) s3.categoryImages = {};
      let changed = false;
      document.querySelectorAll('.cat-img-upload').forEach(inp => {
        if (inp._pendingData) { s3.categoryImages[inp.dataset.cat] = inp._pendingData; changed = true; }
      });
      if (changed) {
        try { await DC.saveSettings(s3); this.toast('Category images saved!'); } catch(e) { this.toast(e.message,'error'); }
      } else { this.toast('No new images to save'); }
    };
  },

  // ─── Products ────────────────────────────────────────────────────────────
  renderSizeChart() {
    const s = DC.getSettings();
    const input = document.getElementById('size-chart-url-input');
    const preview = document.getElementById('size-chart-preview');
    const placeholder = document.getElementById('size-chart-preview-placeholder');
    if (input) input.value = s.sizeChartUrl || '';
    if (s.sizeChartUrl && preview) {
      preview.src = s.sizeChartUrl;
      preview.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    }
    const fileEl = document.getElementById('size-chart-file');
    if (fileEl && !fileEl._bound) {
      fileEl._bound = true;
      fileEl.addEventListener('change', async () => {
        const file = fileEl.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
          const url = e.target.result;
          if (input) input.value = url;
          if (preview) { preview.src = url; preview.style.display = 'block'; }
          if (placeholder) placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
      });
    }
  },

  async saveSizeChart() {
    const s = DC.getSettings();
    const url = document.getElementById('size-chart-url-input')?.value?.trim() || '';
    s.sizeChartUrl = url;
    try { await DC.saveSettings(s); this.toast('Size chart saved!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  renderDeliveryPolicy() {
    const s = DC.getSettings();
    const el = document.getElementById('delivery-policy-input');
    if (el) el.value = s.deliveryPolicy || '';
  },

  async saveDeliveryPolicy() {
    const s = DC.getSettings();
    s.deliveryPolicy = document.getElementById('delivery-policy-input')?.value?.trim() || '';
    try { await DC.saveSettings(s); this.toast('Delivery policy saved!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  renderProducts() {
    this.renderSizeChart();
    this.renderDeliveryPolicy();
    const products = DC.getProducts();
    document.getElementById('products-table-body').innerHTML = products.map(p => `<tr>
      <td><div style="width:48px;height:48px;background:var(--bg-card);display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);overflow:hidden">
        ${(p.images && p.images[0]) ? `<img src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover">` : `<span style="opacity:0.4;font-size:1.5rem">${p.name.charAt(0)}</span>`}
      </div></td>
      <td><strong>${p.name}</strong></td>
      <td><span class="tag">${p.category}</span></td>
      <td>${DC.formatPrice(p.price)}</td>
      <td>${p.stock}</td>
      <td><label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer"><input type="checkbox" ${p.visible?'checked':''} onchange="Admin.toggleProductVisible('${p.id}',this.checked)"><span style="font-size:0.75rem">${p.visible?'Visible':'Hidden'}</span></label></td>
      <td><div style="display:flex;gap:0.5rem">
        <button class="btn btn-sm btn-ghost" onclick="Admin.openProductEditor('${p.id}')">EDIT</button>
        <button class="btn btn-sm btn-danger" onclick="Admin.deleteProduct('${p.id}')">DEL</button>
      </div></td>
    </tr>`).join('');
    document.getElementById('btn-new-product').onclick = () => this.openProductEditor(null);
  },

  async toggleProductVisible(id, visible) {
    const p = DC.getProducts().find(p => p.id === id);
    if (p) { try { await DC.saveProduct({ ...p, visible }); } catch(e) { this.toast(e.message, 'error'); } }
  },

  openProductEditor(id) {
    const p = id ? DC.getProducts().find(p => p.id === id) : null;
    this.editingProduct = p || { id: DC.genId('p'), name:'', category:'apparel', price:0, originalPrice:null, sizes:[], colors:[], images:[''], description:'', stock:0, featured:false, badge:'', visible:true };
    document.getElementById('pe-title').textContent          = p ? 'EDIT PRODUCT' : 'NEW PRODUCT';
    document.getElementById('pe-name').value                 = this.editingProduct.name;
    document.getElementById('pe-category').value            = this.editingProduct.category;
    document.getElementById('pe-price').value               = this.editingProduct.price;
    document.getElementById('pe-original-price').value      = this.editingProduct.originalPrice || '';
    document.getElementById('pe-sizes').value               = (this.editingProduct.sizes || []).join(', ');
    document.getElementById('pe-colors').value              = (this.editingProduct.colors || []).join(', ');
    document.getElementById('pe-description').value         = this.editingProduct.description;
    document.getElementById('pe-stock').value               = this.editingProduct.stock;
    document.getElementById('pe-badge').value               = this.editingProduct.badge || '';
    document.getElementById('pe-featured').checked          = this.editingProduct.featured;
    document.getElementById('pe-visible').checked           = this.editingProduct.visible;
    // Slot 2: video (single URL now)
    document.getElementById('pe-videos').value = (this.editingProduct.videos || [])[0] || '';
    // Slots 3–12: 10 static images
    const imgs = this.editingProduct.images || [];
    for (let i = 0; i < 10; i++) {
      const el = document.getElementById(`pe-img-${i + 3}`);
      if (el) el.value = imgs[i] || '';
    }
    // Color images: render inputs after colors are set
    this._renderColorImageInputs();
    // Re-render when colors field changes
    document.getElementById('pe-colors').oninput = () => this._renderColorImageInputs();
    document.getElementById('product-editor-modal').classList.add('open');
  },

  _renderColorImageInputs() {
    const group = document.getElementById('pe-color-images-group');
    if (!group) return;
    const colorsRaw = document.getElementById('pe-colors').value;
    const colors = colorsRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const existing = this.editingProduct.colorImages || {};
    if (!colors.length) {
      group.innerHTML = '<p style="font-size:0.75rem;color:var(--text-muted)">No colors defined above. Add colors first.</p>';
      return;
    }
    group.innerHTML = colors.map(c =>
      `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
        <span style="font-size:0.75rem;min-width:80px;font-weight:600">${c}</span>
        <input type="url" id="pe-ci-${c}" placeholder="Image URL for ${c}" value="${(existing[c] && existing[c][0]) || ''}" style="flex:1">
      </div>`
    ).join('');
  },

  async saveProduct() {
    const p = { ...this.editingProduct };
    p.name          = document.getElementById('pe-name').value;
    p.category      = document.getElementById('pe-category').value;
    p.price         = parseInt(document.getElementById('pe-price').value) || 0;
    const op        = document.getElementById('pe-original-price').value;
    p.originalPrice = op ? parseInt(op) : null;
    p.sizes         = document.getElementById('pe-sizes').value.split(',').map(s => s.trim()).filter(Boolean);
    p.colors        = document.getElementById('pe-colors').value.split(',').map(s => s.trim()).filter(Boolean);
    p.description   = document.getElementById('pe-description').value;
    p.stock         = parseInt(document.getElementById('pe-stock').value) || 0;
    p.badge         = document.getElementById('pe-badge').value;
    p.featured      = document.getElementById('pe-featured').checked;
    p.visible       = document.getElementById('pe-visible').checked;
    // Slots 3–12: static images
    p.images = [];
    for (let i = 0; i < 10; i++) {
      const el = document.getElementById(`pe-img-${i + 3}`);
      p.images.push(el ? el.value.trim() : '');
    }
    // Slot 2: video (single URL)
    const vidVal = (document.getElementById('pe-videos')?.value || '').trim();
    p.videos = vidVal ? [vidVal] : [];
    // Slot 1: color images map
    const colorImages = {};
    (p.colors || []).forEach(c => {
      const el = document.getElementById(`pe-ci-${c.toUpperCase()}`);
      const url = el ? el.value.trim() : '';
      colorImages[c.toUpperCase()] = url ? [url] : [];
    });
    p.colorImages = colorImages;
    try {
      await DC.saveProduct(p);
      document.getElementById('product-editor-modal').classList.remove('open');
      this.renderProducts();
      this.toast('Product saved!');
    } catch(e) { this.toast(e.message, 'error'); }
  },

  async deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try { await DC.deleteProduct(id); this.renderProducts(); this.toast('Deleted'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Courses ──────────────────────────────────────────────────────────────
  renderCoursesAdmin() {
    const courses = DC.getCourses();
    document.getElementById('courses-table-body').innerHTML = courses.map(c => `<tr>
      <td><strong>${c.title}</strong></td>
      <td>${c.instructor}</td>
      <td><span class="tag">${c.level}</span></td>
      <td>${DC.formatPrice(c.price)}</td>
      <td>${c.students || 0}</td>
      <td><label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer"><input type="checkbox" ${c.visible?'checked':''} onchange="Admin.toggleCourseVisible('${c.id}',this.checked)"><span style="font-size:0.75rem">${c.visible?'Visible':'Hidden'}</span></label></td>
      <td><div style="display:flex;gap:0.5rem">
        <button class="btn btn-sm btn-ghost" onclick="Admin.openCourseEditor('${c.id}')">EDIT</button>
        <button class="btn btn-sm btn-danger" onclick="Admin.deleteCourse('${c.id}')">DEL</button>
      </div></td>
    </tr>`).join('');
    document.getElementById('btn-new-course').onclick = () => this.openCourseEditor(null);
  },

  async toggleCourseVisible(id, visible) {
    const c = DC.getCourses().find(c => c.id === id);
    if (c) { try { await DC.saveCourse({ ...c, visible }); } catch(e) { this.toast(e.message, 'error'); } }
  },

  openCourseEditor(id) {
    const c = id ? DC.getCourses().find(c => c.id === id) : null;
    this.editingCourse = c || { id: DC.genId('c'), title:'', instructor:'', price:0, thumbnail:'', description:'', lessons:[], duration:'', level:'Beginner', students:0, visible:true, featured:false };
    document.getElementById('ce-title-label').textContent = c ? 'EDIT COURSE' : 'NEW COURSE';
    document.getElementById('ce-title').value       = this.editingCourse.title;
    document.getElementById('ce-instructor').value  = this.editingCourse.instructor;
    document.getElementById('ce-price').value       = this.editingCourse.price;
    document.getElementById('ce-level').value       = this.editingCourse.level;
    document.getElementById('ce-duration').value    = this.editingCourse.duration;
    document.getElementById('ce-description').value = this.editingCourse.description;
    document.getElementById('ce-lessons').value     = (this.editingCourse.lessons || []).join('\n');
    document.getElementById('ce-thumbnail').value   = this.editingCourse.thumbnail || '';
    document.getElementById('ce-featured').checked  = this.editingCourse.featured;
    document.getElementById('ce-visible').checked   = this.editingCourse.visible;
    document.getElementById('ce-thumbnail-file').onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { document.getElementById('ce-thumbnail').value = ev.target.result; };
      reader.readAsDataURL(file);
    };
    document.getElementById('course-editor-modal').classList.add('open');
  },

  async saveCourse() {
    const c = { ...this.editingCourse };
    c.title       = document.getElementById('ce-title').value;
    c.instructor  = document.getElementById('ce-instructor').value;
    c.price       = parseInt(document.getElementById('ce-price').value) || 0;
    c.level       = document.getElementById('ce-level').value;
    c.duration    = document.getElementById('ce-duration').value;
    c.description = document.getElementById('ce-description').value;
    c.lessons     = document.getElementById('ce-lessons').value.split('\n').map(l => l.trim()).filter(Boolean);
    c.thumbnail   = document.getElementById('ce-thumbnail').value;
    c.featured    = document.getElementById('ce-featured').checked;
    c.visible     = document.getElementById('ce-visible').checked;
    try {
      await DC.saveCourse(c);
      document.getElementById('course-editor-modal').classList.remove('open');
      this.renderCoursesAdmin();
      this.toast('Course saved!');
    } catch(e) { this.toast(e.message, 'error'); }
  },

  async deleteCourse(id) {
    if (!confirm('Delete this course?')) return;
    try { await DC.deleteCourse(id); this.renderCoursesAdmin(); this.toast('Deleted'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Orders ───────────────────────────────────────────────────────────────
  async renderOrders() {
    let orders = [];
    try {
      const token = DC.getToken();
      if (token) {
        const r = await fetch('/api/orders', { headers: { 'Authorization': 'Bearer ' + token } });
        orders = await r.json();
      }
    } catch(e) { this.toast('Failed to load orders', 'error'); return; }

    document.getElementById('orders-count').textContent = orders.length + ' orders';
    const tbody = document.getElementById('orders-table-body');
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">No orders yet</td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(o => {
      const ship  = o.shipping || {};
      const items = (o.items || []).length;
      const name  = ship.name || o.userId || 'Guest';
      const addr  = [ship.address, ship.city].filter(Boolean).join(', ') || '—';
      return `<tr>
        <td><code style="font-size:0.75rem;color:var(--accent)">#${o.id}</code></td>
        <td>
          <div style="font-size:0.85rem">${name}</div>
          <div style="font-size:0.7rem;color:var(--text-muted)">${ship.email || ''}</div>
        </td>
        <td style="font-size:0.8rem;color:var(--text-muted)">${addr}</td>
        <td style="font-size:0.85rem">${items} item${items !== 1 ? 's' : ''}</td>
        <td style="color:var(--accent);font-family:var(--font-heading)">${DC.formatPrice(o.total || 0)}</td>
        <td><span class="tag" style="background:${o.status==='pending'?'rgba(232,200,122,0.15)':'rgba(0,200,100,0.1)'};border-color:${o.status==='pending'?'var(--accent)':'#00c864'};color:${o.status==='pending'?'var(--accent)':'#00c864'}">${(o.status||'pending').toUpperCase()}</span></td>
        <td style="font-size:0.8rem;color:var(--text-muted)">${new Date(o.date).toLocaleDateString('vi-VN')}</td>
        <td>
          <select onchange="Admin.updateOrderStatus('${o.id}',this.value)" style="padding:0.25rem 0.5rem;font-size:0.72rem;width:auto;background:var(--bg-card);border:1px solid var(--border);color:var(--text)">
            <option value="pending"   ${o.status==='pending'   ?'selected':''}>Pending</option>
            <option value="confirmed" ${o.status==='confirmed' ?'selected':''}>Confirmed</option>
            <option value="shipping"  ${o.status==='shipping'  ?'selected':''}>Shipping</option>
            <option value="delivered" ${o.status==='delivered' ?'selected':''}>Delivered</option>
            <option value="cancelled" ${o.status==='cancelled' ?'selected':''}>Cancelled</option>
          </select>
        </td>
      </tr>`;
    }).join('');
  },

  async updateOrderStatus(id, status) {
    try {
      const token = DC.getToken();
      await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ status }),
      });
      this.toast('Order status updated');
    } catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Preview ──────────────────────────────────────────────────────────────
  renderPreview() {
    const iframe = document.getElementById('preview-iframe');
    if (!iframe.src || iframe.src === 'about:blank') iframe.src = '/';
  },

  previewPage(page, btn) {
    document.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const iframe = document.getElementById('preview-iframe');
    iframe.contentWindow.postMessage({ navigate: page }, '*');
  },

  // ─── Users ────────────────────────────────────────────────────────────────
  async renderUsers() {
    try { await DC.loadUsers(); } catch(e) { this.toast(e.message, 'error'); return; }
    const users = DC.getUsers();
    document.getElementById('users-count').textContent = users.length + ' users';
    document.getElementById('users-table-body').innerHTML = users.length
      ? users.map(u => `<tr>
          <td>${u.name}</td><td>${u.email}</td>
          <td><span class="tag">${u.role}</span></td>
          <td>${new Date(u.createdAt).toLocaleDateString()}</td>
          <td>${(u.enrolledCourses||[]).length}</td>
          <td>${(u.orders||[]).length}</td>
          <td><select onchange="Admin.changeUserRole('${u.id}',this.value)" style="padding:0.3rem 0.5rem;font-size:0.75rem;width:auto">
            <option value="customer" ${u.role==='customer'?'selected':''}>Customer</option>
            <option value="student"  ${u.role==='student' ?'selected':''}>Student</option>
            <option value="admin"    ${u.role==='admin'   ?'selected':''}>Admin</option>
          </select></td>
        </tr>`).join('')
      : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No users yet</td></tr>';
  },

  async changeUserRole(id, role) {
    try { await DC.changeUserRole(id, role); this.toast('Role updated'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Navigation ───────────────────────────────────────────────────────────
  renderNavigation() {
    const s = DC.getSettings();
    const container = document.getElementById('nav-items-editor');
    container.innerHTML = s.nav.items.map((item, i) => `
      <div class="nav-item-row" style="display:flex;align-items:center;gap:1rem;padding:0.75rem;background:var(--bg-card);border:1px solid var(--border);margin-bottom:0.5rem">
        <span style="color:var(--text-muted)">⠿</span>
        <input type="text" value="${item.label}" data-field="label" data-index="${i}" style="flex:1;max-width:200px">
        <input type="text" value="${item.id}"    data-field="id"    data-index="${i}" style="flex:1;max-width:150px;color:var(--text-muted)">
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;white-space:nowrap">
          <input type="checkbox" ${item.visible?'checked':''} data-field="visible" data-index="${i}"> Visible
        </label>
      </div>`).join('');

    document.getElementById('btn-save-nav').onclick = async () => {
      const s = DC.getSettings();
      container.querySelectorAll('.nav-item-row').forEach((row, i) => {
        s.nav.items[i].label   = row.querySelector('[data-field="label"]').value;
        s.nav.items[i].id      = row.querySelector('[data-field="id"]').value;
        s.nav.items[i].visible = row.querySelector('[data-field="visible"]').checked;
      });
      try { await DC.saveSettings(s); this.toast('Navigation saved!'); }
      catch(e) { this.toast(e.message, 'error'); }
    };

    document.getElementById('btn-add-nav-item').onclick = async () => {
      const s = DC.getSettings();
      s.nav.items.push({ id:'new-page', label:'NEW PAGE', visible:true });
      await DC.saveSettings(s);
      this.renderNavigation();
    };
  },

  // ─── Payments ─────────────────────────────────────────────────────────────
  renderPayments() {
    this.renderAdminEmail();
    const p = DC.getSettings().payment || {};
    const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    const sc = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
    // COD
    sc('pay-cod-enabled', p.cod?.enabled !== false);
    sv('pay-cod-desc',    p.cod?.description);
    // Bank Transfer
    sc('pay-bank-enabled',  p.bankTransfer?.enabled);
    sv('pay-bank-name',     p.bankTransfer?.bankName);
    sv('pay-bank-account',  p.bankTransfer?.accountNumber);
    sv('pay-bank-owner',    p.bankTransfer?.accountOwner);
    sv('pay-bank-qr',       p.bankTransfer?.qrUrl);
    sv('pay-bank-note',     p.bankTransfer?.note);
    // MoMo
    sc('pay-momo-enabled', p.momo?.enabled);
    sv('pay-momo-phone',   p.momo?.phone);
    sv('pay-momo-name',    p.momo?.name);
    sv('pay-momo-qr',      p.momo?.qrUrl);
    // ZaloPay
    sc('pay-zalopay-enabled', p.zalopay?.enabled);
    sv('pay-zalopay-phone',   p.zalopay?.phone);
    sv('pay-zalopay-name',    p.zalopay?.name);
    sv('pay-zalopay-qr',      p.zalopay?.qrUrl);
    // VNPay
    sc('pay-vnpay-enabled',  p.vnpay?.enabled);
    sv('pay-vnpay-merchant', p.vnpay?.merchantId);
    sv('pay-vnpay-secret',   p.vnpay?.hashSecret);
    // Stripe
    sc('pay-stripe-enabled', p.stripe?.enabled);
    sv('pay-stripe-key',     p.stripe?.publicKey);
    // PayPal
    sc('pay-paypal-enabled', p.paypal?.enabled);
    sv('pay-paypal-id',      p.paypal?.clientId);
    // Show expanded for enabled
    // Installment
    sc('pay-install-enabled',  p.installment?.enabled);
    sv('pay-install-plans',    p.installment?.plans);
    sv('pay-install-partners', p.installment?.partners);
    sv('pay-install-note',     p.installment?.note);
    ['pay-cod-enabled','pay-bank-enabled','pay-momo-enabled','pay-zalopay-enabled','pay-vnpay-enabled','pay-stripe-enabled','pay-paypal-enabled','pay-install-enabled'].forEach(id => {
      const cb = document.getElementById(id);
      if (cb?.checked) cb.closest('.payment-provider-card')?.querySelector('.pay-fields')?.classList.add('show');
    });
    document.getElementById('btn-save-payments').onclick = () => this.savePayments();
  },

  async savePayments() {
    const s = DC.getSettings();
    const gv = id => document.getElementById(id)?.value.trim() || '';
    const gc = id => document.getElementById(id)?.checked || false;
    s.payment = {
      cod:          { enabled: gc('pay-cod-enabled'),         description:   gv('pay-cod-desc') },
      bankTransfer: { enabled: gc('pay-bank-enabled'),        bankName:      gv('pay-bank-name'),    accountNumber: gv('pay-bank-account'), accountOwner: gv('pay-bank-owner'), qrUrl: gv('pay-bank-qr'), note: gv('pay-bank-note') },
      momo:         { enabled: gc('pay-momo-enabled'),        phone:         gv('pay-momo-phone'),   name:          gv('pay-momo-name'),    qrUrl: gv('pay-momo-qr'), partnerCode: '' },
      zalopay:      { enabled: gc('pay-zalopay-enabled'),     phone:         gv('pay-zalopay-phone'),name:          gv('pay-zalopay-name'), qrUrl: gv('pay-zalopay-qr') },
      vnpay:        { enabled: gc('pay-vnpay-enabled'),       merchantId:    gv('pay-vnpay-merchant'),hashSecret:   gv('pay-vnpay-secret') },
      stripe:       { enabled: gc('pay-stripe-enabled'),      publicKey:     gv('pay-stripe-key') },
      paypal:       { enabled: gc('pay-paypal-enabled'),      clientId:      gv('pay-paypal-id') },
      installment:  { enabled: gc('pay-install-enabled'),     plans:         gv('pay-install-plans'), partners: gv('pay-install-partners'), note: gv('pay-install-note') },
    };
    try { await DC.saveSettings(s); this.toast('Đã lưu cài đặt thanh toán!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Social & Contact ─────────────────────────────────────────────────────
  renderSocial() {
    const s   = DC.getSettings();
    const soc = s.social || {};
    const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    sv('social-fb',       soc.facebook);
    sv('social-ig',       soc.instagram);
    sv('social-yt',       soc.youtube);
    sv('social-zalo',     soc.zalo);
    sv('social-messenger',soc.messenger);
    sv('social-hotline',  soc.hotline);
    sv('social-address',  s.address);
    sv('social-map-embed',s.mapEmbed);
    document.getElementById('btn-save-social').onclick = () => this.saveSocial();
  },

  async saveSocial() {
    const s = DC.getSettings();
    const gv = id => document.getElementById(id)?.value.trim() || '';
    s.social = {
      facebook:  gv('social-fb'),
      instagram: gv('social-ig'),
      youtube:   gv('social-yt'),
      zalo:      gv('social-zalo'),
      messenger: gv('social-messenger'),
      hotline:   gv('social-hotline'),
    };
    s.address  = gv('social-address');
    s.mapEmbed = gv('social-map-embed');
    try { await DC.saveSettings(s); this.toast('Đã lưu cài đặt mạng xã hội!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Hero Promo ───────────────────────────────────────────────────────────
  renderHeroPromo() {
    const hp = DC.getSettings().heroPromo || {};
    const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    const cb = document.getElementById('hero-promo-enabled');
    if (cb) cb.checked = !!hp.enabled;
    sv('hero-promo-tag',          hp.tag);
    sv('hero-promo-headline',     hp.headline);
    sv('hero-promo-perk',         hp.perk);
    sv('hero-promo-deadline',     hp.deadline);
    sv('hero-promo-pricing-unit', hp.pricingUnit);
    sv('hero-promo-audience',     hp.audienceLabel);
    sv('hero-promo-cta-text',     hp.ctaText);
    sv('hero-promo-cta-link',     hp.ctaLink);

    // Pricing rows (2 rows by default)
    const container = document.getElementById('hero-promo-pricing-rows');
    if (container) {
      const pricing = hp.pricing || [{label:'',price:'',originalPrice:''},{label:'',price:'',originalPrice:''}];
      // Clear old rows (keep headers — first 3 divs)
      while (container.children.length > 3) container.removeChild(container.lastChild);
      pricing.forEach((p, i) => {
        container.insertAdjacentHTML('beforeend', `
          <input type="text" class="admin-input hpc-pl" data-i="${i}" placeholder="Người lớn" value="${p.label||''}">
          <input type="text" class="admin-input hpc-pp" data-i="${i}" placeholder="3.6M" value="${p.price||''}">
          <input type="text" class="admin-input hpc-po" data-i="${i}" placeholder="4.5M" value="${p.originalPrice||''}">
        `);
      });
    }
    document.getElementById('btn-save-hero-promo').onclick = () => this.saveHeroPromo();
  },

  async saveHeroPromo() {
    const s  = DC.getSettings();
    const gv = id => document.getElementById(id)?.value.trim() || '';
    const pricing = [];
    document.querySelectorAll('#hero-promo-pricing-rows .hpc-pl').forEach((el, i) => {
      pricing.push({
        label:         el.value.trim(),
        price:         document.querySelectorAll('#hero-promo-pricing-rows .hpc-pp')[i]?.value.trim() || '',
        originalPrice: document.querySelectorAll('#hero-promo-pricing-rows .hpc-po')[i]?.value.trim() || '',
      });
    });
    s.heroPromo = {
      enabled:      document.getElementById('hero-promo-enabled')?.checked ?? true,
      tag:          gv('hero-promo-tag'),
      headline:     gv('hero-promo-headline'),
      perk:         gv('hero-promo-perk'),
      deadline:     gv('hero-promo-deadline'),
      pricingUnit:  gv('hero-promo-pricing-unit'),
      audienceLabel:gv('hero-promo-audience'),
      ctaText:      gv('hero-promo-cta-text'),
      ctaLink:      gv('hero-promo-cta-link'),
      pricing,
    };
    try { await DC.saveSettings(s); this.toast('Đã lưu Hero Promo Card!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Philosophy ───────────────────────────────────────────────────────────
  renderPhilosophy() {
    const ph = DC.getSettings().philosophy || {};
    const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    sv('philosophy-admin-eyebrow',  ph.eyebrow);
    sv('philosophy-admin-headline', ph.headline);
    sv('philosophy-admin-body',     ph.body);
    document.getElementById('btn-save-philosophy').onclick = () => this.savePhilosophy();
  },

  async savePhilosophy() {
    const s  = DC.getSettings();
    const gv = id => document.getElementById(id)?.value.trim() || '';
    s.philosophy = {
      eyebrow:  gv('philosophy-admin-eyebrow'),
      headline: gv('philosophy-admin-headline'),
      body:     gv('philosophy-admin-body'),
    };
    try { await DC.saveSettings(s); this.toast('Đã lưu section Triết Lý!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Instructor Stats ─────────────────────────────────────────────────────
  renderInstructor() {
    const inst = DC.getSettings().instructor || {};
    const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    sv('instructor-eyebrow-admin', inst.eyebrow);
    sv('instructor-name-admin',    inst.name);

    const container = document.getElementById('instructor-stats-admin');
    if (container) {
      const stats = inst.stats || [{value:'',label:''},{value:'',label:''},{value:'',label:''},{value:'',label:''}];
      container.innerHTML = stats.map((st, i) => `
        <div>
          <label class="admin-label" style="font-size:0.7rem">Chỉ số ${i+1} — Số / Giá trị</label>
          <input type="text" class="admin-input inst-sv" data-i="${i}" placeholder="500+" value="${st.value||''}" style="margin-bottom:0.4rem">
          <input type="text" class="admin-input inst-sl" data-i="${i}" placeholder="Học viên" value="${st.label||''}">
        </div>
      `).join('');
    }
    document.getElementById('btn-save-instructor').onclick = () => this.saveInstructor();
  },

  async saveInstructor() {
    const s  = DC.getSettings();
    const gv = id => document.getElementById(id)?.value.trim() || '';
    const stats = [];
    document.querySelectorAll('#instructor-stats-admin .inst-sv').forEach((el, i) => {
      stats.push({
        value: el.value.trim(),
        label: document.querySelectorAll('#instructor-stats-admin .inst-sl')[i]?.value.trim() || '',
      });
    });
    s.instructor = {
      eyebrow: gv('instructor-eyebrow-admin'),
      name:    gv('instructor-name-admin'),
      stats,
    };
    try { await DC.saveSettings(s); this.toast('Đã lưu Giảng Viên & Stats!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Gallery 4 ───────────────────────────────────────────────────────────
  renderGallery4() {
    const images = DC.getSettings().galleryImages || [{},{},{},{}];
    const container = document.getElementById('gallery4-admin-rows');
    if (!container) return;
    container.innerHTML = images.map((img, i) => `
      <div class="admin-field-group">
        <label class="admin-label">Ảnh ${i + 1} — URL</label>
        <input type="text" class="admin-input g4-url" data-i="${i}" placeholder="https://..." value="${img.url || ''}">
        <input type="text" class="admin-input g4-alt" data-i="${i}" placeholder="Mô tả ảnh (alt text)" value="${img.alt || ''}" style="margin-top:0.4rem">
      </div>
    `).join('');
    document.getElementById('btn-save-gallery4').onclick = () => this.saveGallery4();
  },

  async saveGallery4() {
    const s = DC.getSettings();
    const images = [];
    document.querySelectorAll('#gallery4-admin-rows .g4-url').forEach((el, i) => {
      images.push({
        url: el.value.trim(),
        alt: document.querySelectorAll('#gallery4-admin-rows .g4-alt')[i]?.value.trim() || '',
      });
    });
    s.galleryImages = images;
    try { await DC.saveSettings(s); this.toast('Đã lưu Gallery 4 ảnh!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Categories ───────────────────────────────────────────────────────────
  renderCategories() {
    const s = DC.getSettings();
    const cat = s.categoryImages || {};
    const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    sv('cat-apparel',     cat.apparel);
    sv('cat-equipment',   cat.equipment);
    sv('cat-gloves',      cat.gloves);
    sv('cat-accessories', cat.accessories);
    document.getElementById('btn-save-categories').onclick = () => this.saveCategories();
  },

  async saveCategories() {
    const s = DC.getSettings();
    const gv = id => document.getElementById(id)?.value.trim() || '';
    s.categoryImages = {
      apparel:     gv('cat-apparel'),
      equipment:   gv('cat-equipment'),
      gloves:      gv('cat-gloves'),
      accessories: gv('cat-accessories'),
    };
    try { await DC.saveSettings(s); this.toast('Đã lưu Category images!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Course CTA Banner ────────────────────────────────────────────────────
  renderCourseCTA() {
    const cta = DC.getSettings().courseCTA || {};
    const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    const sc = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
    sc('cta-enabled',   cta.enabled !== false);
    sv('cta-eyebrow',   cta.eyebrow);
    sv('cta-headline',  cta.headline);
    sv('cta-sub',       cta.sub);
    sv('cta-btn-text',  cta.btnText);
    sv('cta-bg-image',  cta.bgImage);
    document.getElementById('btn-save-course-cta').onclick = () => this.saveCourseCTA();
  },

  async saveCourseCTA() {
    const s = DC.getSettings();
    const gv = id => document.getElementById(id)?.value.trim() || '';
    s.courseCTA = {
      enabled:  document.getElementById('cta-enabled')?.checked !== false,
      eyebrow:  gv('cta-eyebrow'),
      headline: gv('cta-headline'),
      sub:      gv('cta-sub'),
      btnText:  gv('cta-btn-text'),
      bgImage:  gv('cta-bg-image'),
    };
    try { await DC.saveSettings(s); this.toast('Đã lưu Course CTA Banner!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Announcement Bar (standalone section) ────────────────────────────────
  renderAnnouncementBar() {
    const ann = DC.getSettings().announcementBar || {};
    const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    const sc = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
    sc('ann-enabled',    ann.enabled);
    sv('ann-text',       ann.text);
    sv('ann-text2',      ann.text2);
    sv('ann-bg-color',   ann.bgColor   || '#0d0d0d');
    sv('ann-text-color', ann.textColor || '#ffffff');
    document.getElementById('btn-save-announcement').onclick = () => this.saveAnnouncementBar();
  },

  async saveAnnouncementBar() {
    const s = DC.getSettings();
    const gv = id => document.getElementById(id)?.value.trim() || '';
    s.announcementBar = {
      enabled:   document.getElementById('ann-enabled')?.checked || false,
      text:      gv('ann-text'),
      text2:     gv('ann-text2'),
      bgColor:   gv('ann-bg-color')   || '#0d0d0d',
      textColor: gv('ann-text-color') || '#ffffff',
    };
    try { await DC.saveSettings(s); this.toast('Đã lưu Announcement Bar!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Promo Popup ──────────────────────────────────────────────────────────
  renderPromoPopup() {
    const pp = DC.getSettings().promoPopup || {};
    const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
    const sc = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
    sc('pp-enabled',    pp.enabled);
    sv('pp-code',       pp.code);
    sv('pp-delay',      pp.delay ?? 2000);
    sv('pp-discount',   pp.discount);
    sv('pp-image',      pp.image);
    sv('pp-form-title', pp.formTitle);
    sv('pp-copy-btn',   pp.copyBtnText);
    sv('pp-form-sub',   pp.formSub);
    sv('pp-submit',     pp.submitText);
    document.getElementById('btn-save-promo-popup').onclick = () => this.savePromoPopup();
  },

  async savePromoPopup() {
    const s = DC.getSettings();
    const gv = id => document.getElementById(id)?.value.trim() || '';
    s.promoPopup = {
      enabled:      document.getElementById('pp-enabled')?.checked || false,
      code:         gv('pp-code'),
      delay:        parseInt(document.getElementById('pp-delay')?.value) || 2000,
      discount:     gv('pp-discount'),
      image:        gv('pp-image'),
      formTitle:    gv('pp-form-title'),
      copyBtnText:  gv('pp-copy-btn'),
      formSub:      gv('pp-form-sub'),
      submitText:   gv('pp-submit'),
    };
    try { await DC.saveSettings(s); this.toast('Đã lưu Promo Popup!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Footer Content ───────────────────────────────────────────────────────
  renderFooterContent() {
    const s = DC.getSettings();
    const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    sv('footer-tagline-input',        s.tagline);
    sv('footer-copyright-input',      s.footerCopyright);
    sv('footer-bottom-tagline-input', s.footerTagline);
    document.getElementById('btn-save-footer-content').onclick = () => this.saveFooterContent();
  },

  async saveFooterContent() {
    const s = DC.getSettings();
    const gv = id => document.getElementById(id)?.value.trim() || '';
    s.tagline         = gv('footer-tagline-input');
    s.footerCopyright = gv('footer-copyright-input');
    s.footerTagline   = gv('footer-bottom-tagline-input');
    try { await DC.saveSettings(s); this.toast('Đã lưu Footer!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Community ────────────────────────────────────────────────────────────
  renderCommunityAdmin() {
    const c = DC.getSettings().community || {};
    const gv = id => document.getElementById(id);
    const set = (id, val) => { const el = gv(id); if (el) el.value = val || ''; };

    set('community-admin-eyebrow', c.eyebrow);
    set('community-admin-headline', c.headline);
    set('community-admin-story', c.story);
    set('community-stat1-num',   c.stat1Num);
    set('community-stat1-label', c.stat1Label);
    set('community-stat2-num',   c.stat2Num);
    set('community-stat2-label', c.stat2Label);
    set('community-stat3-num',   c.stat3Num);
    set('community-stat3-label', c.stat3Label);
    set('community-fb-link',  c.fbLink);
    set('community-fb-text',  c.fbText);
    set('community-zalo-link', c.zaloLink);
    set('community-zalo-text', c.zaloText);

    const preview = document.getElementById('community-img-preview');
    const previewImg = document.getElementById('community-img-preview-img');
    if (c.imageUrl && preview && previewImg) {
      previewImg.src = c.imageUrl;
      preview.style.display = 'block';
    }

    const uploadInput = gv('community-img-upload');
    if (uploadInput) {
      uploadInput.onchange = () => {
        const file = uploadInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
          uploadInput._pendingData = e.target.result;
          if (previewImg) { previewImg.src = e.target.result; preview.style.display = 'block'; }
        };
        reader.readAsDataURL(file);
      };
    }

    gv('btn-save-community').onclick = () => this.saveCommunity();
  },

  useCommunityImgUrl() {
    const urlInput = document.getElementById('community-img-url');
    const url = urlInput?.value.trim();
    if (!url) return;
    const preview = document.getElementById('community-img-preview');
    const previewImg = document.getElementById('community-img-preview-img');
    if (previewImg) { previewImg.src = url; preview.style.display = 'block'; }
    const uploadInput = document.getElementById('community-img-upload');
    if (uploadInput) uploadInput._pendingUrl = url;
  },

  clearCommunityImg() {
    const preview = document.getElementById('community-img-preview');
    if (preview) preview.style.display = 'none';
    const upload = document.getElementById('community-img-upload');
    if (upload) { upload.value = ''; upload._pendingData = null; upload._pendingUrl = null; }
    const urlInput = document.getElementById('community-img-url');
    if (urlInput) urlInput.value = '';
    const s = DC.getSettings();
    if (s.community) { s.community.imageUrl = ''; DC.saveSettings(s); }
  },

  async saveCommunity() {
    const s  = DC.getSettings();
    s.community = s.community || {};
    const gv = id => document.getElementById(id);
    const gval = id => gv(id)?.value.trim() || '';

    s.community.eyebrow    = gval('community-admin-eyebrow');
    s.community.headline   = gval('community-admin-headline');
    s.community.story      = gv('community-admin-story')?.value.trim() || '';
    s.community.stat1Num   = gval('community-stat1-num');
    s.community.stat1Label = gval('community-stat1-label');
    s.community.stat2Num   = gval('community-stat2-num');
    s.community.stat2Label = gval('community-stat2-label');
    s.community.stat3Num   = gval('community-stat3-num');
    s.community.stat3Label = gval('community-stat3-label');
    s.community.fbLink     = gval('community-fb-link');
    s.community.fbText     = gval('community-fb-text') || 'FACEBOOK GROUP';
    s.community.zaloLink   = gval('community-zalo-link');
    s.community.zaloText   = gval('community-zalo-text') || 'ZALO GROUP';

    const uploadInput = gv('community-img-upload');
    if (uploadInput?._pendingData) {
      s.community.imageUrl = uploadInput._pendingData;
    } else if (uploadInput?._pendingUrl) {
      s.community.imageUrl = uploadInput._pendingUrl;
    }

    try {
      await DC.saveSettings(s);
      this.toast('Đã lưu cài đặt cộng đồng!');
    } catch(e) {
      this.toast('Lỗi lưu: ' + e.message, 'error');
    }
  },

  // ─── Testimonials ─────────────────────────────────────────────────────────
  renderTestimonials() {
    const cfg = DC.getSettings().testimonials || {};
    const items = cfg.items || [];

    const eyebrowEl = document.getElementById('testimonials-admin-eyebrow');
    const titleEl   = document.getElementById('testimonials-admin-title');
    if (eyebrowEl) eyebrowEl.value = cfg.eyebrow || '';
    if (titleEl)   titleEl.value   = cfg.title   || '';

    const listEl = document.getElementById('testimonials-admin-list');
    if (!listEl) return;

    const renderList = (itemsArr) => {
      listEl.innerHTML = itemsArr.map((t, i) => `
        <div class="testimonial-admin-item" data-idx="${i}" style="background:var(--bg-secondary);border:1px solid var(--border);padding:1.25rem;position:relative">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <strong style="font-family:var(--font-heading);font-size:0.85rem;letter-spacing:0.06em">ĐÁNH GIÁ #${i+1}</strong>
            <div style="display:flex;gap:0.5rem">
              ${i > 0 ? `<button onclick="AdminPanel._testMoveItem(${i},-1)" style="background:none;border:1px solid var(--border);padding:2px 8px;cursor:pointer;color:var(--text)" title="Di lên">↑</button>` : ''}
              ${i < itemsArr.length - 1 ? `<button onclick="AdminPanel._testMoveItem(${i},1)" style="background:none;border:1px solid var(--border);padding:2px 8px;cursor:pointer;color:var(--text)" title="Di xuống">↓</button>` : ''}
              <button onclick="AdminPanel._testDeleteItem(${i})" style="background:none;border:1px solid var(--accent-red,#c0392b);padding:2px 8px;cursor:pointer;color:var(--accent-red,#c0392b)" title="Xoá">✕</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">
            <div>
              <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.3rem">Tên khách hàng</label>
              <input type="text" class="admin-input t-name" value="${(t.name||'').replace(/"/g,'&quot;')}" placeholder="Nguyễn Văn A" style="width:100%">
            </div>
            <div>
              <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.3rem">Khoá học / Nhãn</label>
              <input type="text" class="admin-input t-label" value="${(t.label||'').replace(/"/g,'&quot;')}" placeholder="Boxing Fundamentals" style="width:100%">
            </div>
          </div>
          <div style="margin-bottom:0.75rem">
            <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.3rem">Nội dung đánh giá</label>
            <textarea class="admin-input t-quote" rows="3" style="width:100%;resize:vertical">${(t.quote||'').replace(/</g,'&lt;')}</textarea>
          </div>
          <div style="display:grid;grid-template-columns:80px 1fr;gap:0.75rem;align-items:end">
            <div>
              <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.3rem">Số sao (1-5)</label>
              <input type="number" class="admin-input t-stars" value="${t.stars || 5}" min="1" max="5" style="width:100%">
            </div>
            <div>
              <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.3rem">URL ảnh avatar (để trống = dùng chữ cái)</label>
              <input type="text" class="admin-input t-avatar" value="${(t.avatarUrl||'').replace(/"/g,'&quot;')}" placeholder="https://... hoặc để trống" style="width:100%">
            </div>
          </div>
          <div style="margin-top:0.75rem">
            <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.5rem">📷 Hình ảnh feedback (screenshot, ảnh sản phẩm...)</label>
            <div style="display:flex;gap:0.75rem;align-items:flex-start">
              <div style="flex:1">
                <input type="file" class="admin-input t-feedback-upload" accept="image/*" style="padding:0.3rem;font-size:0.75rem">
                <input type="text" class="admin-input t-feedback-url" value="${(t.feedbackImageUrl||'').replace(/"/g,'&quot;')}" placeholder="Hoặc dán URL ảnh..." style="margin-top:0.4rem;width:100%">
              </div>
              ${t.feedbackImageUrl ? `<img src="${t.feedbackImageUrl.replace(/"/g,'&quot;')}" style="width:80px;height:60px;object-fit:cover;border:1px solid var(--border);flex-shrink:0" class="t-feedback-preview">` : `<div class="t-feedback-preview" style="width:80px;height:60px;background:var(--bg-card);border:1px dashed var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:var(--text-muted)">Chưa có ảnh</div>`}
            </div>
          </div>
        </div>
      `).join('');

      // Wire up file inputs after render
      listEl.querySelectorAll('.testimonial-admin-item').forEach(item => {
        const upload = item.querySelector('.t-feedback-upload');
        const urlInput = item.querySelector('.t-feedback-url');
        const preview = item.querySelector('.t-feedback-preview');
        if (upload) {
          upload.onchange = () => {
            const file = upload.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
              upload._pendingData = e.target.result;
              if (preview) { preview.src = e.target.result; preview.style.cssText = 'width:80px;height:60px;object-fit:cover;border:1px solid var(--border);flex-shrink:0'; preview.tagName !== 'IMG' && (preview.outerHTML = `<img src="${e.target.result}" style="width:80px;height:60px;object-fit:cover;border:1px solid var(--border);flex-shrink:0" class="t-feedback-preview">`); }
            };
            reader.readAsDataURL(file);
          };
        }
      });
    };

    renderList(items);

    // Add button
    const addBtn = document.getElementById('btn-add-testimonial');
    if (addBtn) {
      addBtn.onclick = () => {
        const currentItems = this._getTestimonialsFromDOM();
        currentItems.push({ stars: 5, quote: '', name: '', label: '', avatarUrl: '' });
        renderList(currentItems);
      };
    }

    // Move/delete helpers
    AdminPanel._testMoveItem = (idx, dir) => {
      const arr = this._getTestimonialsFromDOM();
      const tmp = arr[idx]; arr[idx] = arr[idx + dir]; arr[idx + dir] = tmp;
      renderList(arr);
    };
    AdminPanel._testDeleteItem = (idx) => {
      const arr = this._getTestimonialsFromDOM();
      arr.splice(idx, 1);
      renderList(arr);
    };

    const saveBtn = document.getElementById('btn-save-testimonials');
    if (saveBtn) saveBtn.onclick = () => this.saveTestimonials();
  },

  _getTestimonialsFromDOM() {
    const listEl = document.getElementById('testimonials-admin-list');
    if (!listEl) return [];
    return Array.from(listEl.querySelectorAll('.testimonial-admin-item')).map(el => {
      const upload = el.querySelector('.t-feedback-upload');
      const urlInput = el.querySelector('.t-feedback-url');
      let feedbackImageUrl = el.querySelector('.t-feedback-url')?.value.trim() || '';
      if (upload?._pendingData) feedbackImageUrl = upload._pendingData;
      return {
        name:             el.querySelector('.t-name')?.value.trim()  || '',
        label:            el.querySelector('.t-label')?.value.trim() || '',
        quote:            el.querySelector('.t-quote')?.value.trim() || '',
        stars:            parseInt(el.querySelector('.t-stars')?.value) || 5,
        avatarUrl:        el.querySelector('.t-avatar')?.value.trim() || '',
        feedbackImageUrl
      };
    });
  },

  async saveTestimonials() {
    const s = DC.getSettings();
    s.testimonials = s.testimonials || {};
    s.testimonials.eyebrow = document.getElementById('testimonials-admin-eyebrow')?.value.trim() || 'HỌC VIÊN NÓI GÌ';
    s.testimonials.title   = document.getElementById('testimonials-admin-title')?.value.trim()   || 'THÀNH TÍCH THỰC TẾ';
    s.testimonials.items   = this._getTestimonialsFromDOM();
    try {
      await DC.saveSettings(s);
      this.toast('Đã lưu đánh giá học viên!');
    } catch(e) {
      this.toast('Lỗi lưu: ' + e.message, 'error');
    }
  },

  // ─── Schedule ─────────────────────────────────────────────────────────────
  renderSchedule() {
    const sch = DC.getSettings().schedule || {};
    const el = id => document.getElementById(id);
    const enabledEl = el('schedule-enabled');
    if (enabledEl) enabledEl.checked = !!sch.enabled;
    const titleEl = el('schedule-title');
    if (titleEl) titleEl.value = sch.title || '';
    const subEl = el('schedule-subtitle');
    if (subEl) subEl.value = sch.subtitle || '';

    const preview = el('schedule-img-preview');
    if (preview) {
      preview.innerHTML = sch.imageUrl
        ? `<img src="${sch.imageUrl}" style="max-width:100%;max-height:300px;object-fit:contain">`
        : '<span style="color:var(--text-muted);font-size:0.8rem">Chưa có ảnh lịch học</span>';
    }

    const uploadInput = el('schedule-img-upload');
    if (uploadInput) {
      uploadInput.onchange = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          uploadInput._pendingData = ev.target.result;
          if (preview) preview.innerHTML = `<img src="${ev.target.result}" style="max-width:100%;max-height:300px;object-fit:contain">`;
        };
        reader.readAsDataURL(file);
      };
    }

    el('btn-save-schedule').onclick = () => this.saveSchedule();
  },

  useScheduleImgUrl() {
    const url = document.getElementById('schedule-img-url')?.value?.trim();
    if (!url) return;
    const input = document.getElementById('schedule-img-upload');
    if (input) input._pendingData = url;
    const preview = document.getElementById('schedule-img-preview');
    if (preview) preview.innerHTML = `<img src="${url}" style="max-width:100%;max-height:300px;object-fit:contain">`;
  },

  clearScheduleImg() {
    const input = document.getElementById('schedule-img-upload');
    if (input) { input._pendingData = ''; input.value = ''; }
    const preview = document.getElementById('schedule-img-preview');
    if (preview) preview.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem">Chưa có ảnh lịch học</span>';
    const urlInput = document.getElementById('schedule-img-url');
    if (urlInput) urlInput.value = '';
  },

  async saveSchedule() {
    const s = DC.getSettings();
    const gv = id => document.getElementById(id);
    const uploadInput = gv('schedule-img-upload');
    const currentImg = s.schedule?.imageUrl || '';
    s.schedule = {
      enabled:  gv('schedule-enabled')?.checked ?? false,
      title:    gv('schedule-title')?.value?.trim() || '',
      subtitle: gv('schedule-subtitle')?.value?.trim() || '',
      imageUrl: (uploadInput?._pendingData !== undefined ? uploadInput._pendingData : currentImg),
    };
    try { await DC.saveSettings(s); this.toast('Đã lưu lịch học!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Pricing ─────────────────────────────────────────────────────────────
  renderPricing() {
    const pr = DC.getSettings().pricing || {};
    const el = id => document.getElementById(id);
    if (el('pricing-enabled')) el('pricing-enabled').checked = !!pr.enabled;
    if (el('pricing-title-input')) el('pricing-title-input').value = pr.title || '';
    if (el('pricing-eyebrow-input')) el('pricing-eyebrow-input').value = pr.eyebrow || '';

    (pr.plans || []).forEach((plan, i) => {
      const sv = (key, val) => { const inp = el(`plan-${i}-${key}`); if (inp) inp.value = val ?? ''; };
      const sc = (key, val) => { const inp = el(`plan-${i}-${key}`); if (inp) inp.checked = !!val; };
      sv('tier',     plan.tier);
      sv('name',     plan.name);
      sv('price',    plan.price);
      sv('currency', plan.currency);
      sv('billing',  plan.billing);
      sv('badge',    plan.featuredLabel);
      sv('cta-text', plan.ctaText);
      sv('cta-link', plan.ctaLink);
      sc('featured', plan.featured);
      const featTextarea = el(`plan-${i}-features`);
      if (featTextarea) {
        featTextarea.value = (plan.features || []).map(f => (f.included === false ? '-' : '') + f.text).join('\n');
      }
    });

    el('btn-save-pricing').onclick = () => this.savePricing();
  },

  async savePricing() {
    const s = DC.getSettings();
    const el = id => document.getElementById(id);
    const gv = id => el(id)?.value?.trim() || '';

    const parsePlanFeatures = (i) => {
      const raw = el(`plan-${i}-features`)?.value || '';
      return raw.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const excluded = trimmed.startsWith('-');
        return { text: excluded ? trimmed.slice(1).trim() : trimmed, included: !excluded };
      }).filter(Boolean);
    };

    s.pricing = {
      enabled:  el('pricing-enabled')?.checked ?? false,
      title:    gv('pricing-title-input'),
      eyebrow:  gv('pricing-eyebrow-input'),
      plans: [0, 1, 2].map(i => ({
        tier:         gv(`plan-${i}-tier`),
        name:         gv(`plan-${i}-name`),
        price:        gv(`plan-${i}-price`),
        currency:     gv(`plan-${i}-currency`),
        billing:      gv(`plan-${i}-billing`),
        featured:     el(`plan-${i}-featured`)?.checked ?? false,
        featuredLabel: gv(`plan-${i}-badge`),
        features:     parsePlanFeatures(i),
        ctaText:      gv(`plan-${i}-cta-text`),
        ctaLink:      gv(`plan-${i}-cta-link`),
      })),
    };

    try { await DC.saveSettings(s); this.toast('Đã lưu bảng giá!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Coupons ─────────────────────────────────────────────────────────────
  renderCoupons() {
    const coupons = DC.getSettings().coupons || [];
    const tbody   = document.getElementById('coupons-table-body');
    if (!tbody) return;
    tbody.innerHTML = coupons.length
      ? coupons.map((c, i) => `<tr>
          <td><strong>${c.code}</strong></td>
          <td>${c.type === 'percent' ? 'Phần trăm' : 'Cố định'}</td>
          <td style="color:var(--accent)">${c.type === 'percent' ? c.value + '%' : DC.formatPrice(c.value)}</td>
          <td style="font-size:0.8rem">${c.minOrder ? DC.formatPrice(c.minOrder) : '–'}</td>
          <td><span class="tag" style="${c.active ? 'background:rgba(39,174,96,0.15);color:#27ae60' : 'opacity:0.5'}">${c.active ? 'Hoạt động' : 'Tắt'}</span></td>
          <td><div style="display:flex;gap:0.5rem">
            <button class="btn btn-sm btn-ghost" onclick="Admin.openCouponEditor(${i})">SỬA</button>
            <button class="btn btn-sm btn-danger" onclick="Admin.deleteCoupon(${i})">XÓA</button>
          </div></td>
        </tr>`).join('')
      : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">Chưa có mã khuyến mãi nào</td></tr>';
  },

  openCouponEditor(idx) {
    this._editCouponIdx = idx;
    const coupons = DC.getSettings().coupons || [];
    const c = idx !== null ? coupons[idx] : { code:'', type:'percent', value:10, minOrder:0, active:true };
    document.getElementById('coupon-editor-title').textContent = idx !== null ? 'SỬA MÃ KHUYẾN MÃI' : 'THÊM MÃ KHUYẾN MÃI';
    document.getElementById('ce-code').value      = c.code;
    document.getElementById('ce-type').value      = c.type || 'percent';
    document.getElementById('ce-value').value     = c.value;
    document.getElementById('ce-min-order').value = c.minOrder || 0;
    document.getElementById('ce-active').checked  = c.active !== false;
    document.getElementById('coupon-editor-modal').classList.add('open');
  },

  async saveCoupon() {
    const code = document.getElementById('ce-code').value.trim().toUpperCase();
    if (!code) { this.toast('Nhập mã khuyến mãi', 'error'); return; }
    const coupon = {
      code,
      type:     document.getElementById('ce-type').value,
      value:    parseFloat(document.getElementById('ce-value').value) || 0,
      minOrder: parseInt(document.getElementById('ce-min-order').value) || 0,
      active:   document.getElementById('ce-active').checked,
    };
    const s = DC.getSettings();
    if (!s.coupons) s.coupons = [];
    if (this._editCouponIdx !== null && this._editCouponIdx !== undefined) {
      s.coupons[this._editCouponIdx] = coupon;
    } else {
      s.coupons.push(coupon);
    }
    try {
      await DC.saveSettings(s);
      document.getElementById('coupon-editor-modal').classList.remove('open');
      this.renderCoupons();
      this.toast('Đã lưu mã khuyến mãi!');
    } catch(e) { this.toast(e.message, 'error'); }
  },

  async deleteCoupon(idx) {
    if (!confirm('Xoá mã này?')) return;
    const s = DC.getSettings();
    s.coupons = (s.coupons || []).filter((_, i) => i !== idx);
    try { await DC.saveSettings(s); this.renderCoupons(); this.toast('Đã xoá'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Enrollments ─────────────────────────────────────────────────────────
  async renderEnrollments() {
    let enrollments = [];
    try { enrollments = await DC.getCourseEnrollments(); } catch(e) { this.toast(e.message, 'error'); return; }
    const countEl = document.getElementById('enrollments-count');
    if (countEl) countEl.textContent = `${enrollments.length} total enrollment${enrollments.length !== 1 ? 's' : ''}`;
    const tbody = document.getElementById('enrollments-table-body');
    tbody.innerHTML = enrollments.length
      ? enrollments.map(e => `<tr>
          <td style="font-size:0.75rem">${new Date(e.date).toLocaleDateString()}</td>
          <td><strong>${e.courseName}</strong></td>
          <td>${e.name}</td>
          <td style="font-size:0.8rem">${e.email}</td>
          <td style="font-size:0.8rem">${e.phone}</td>
          <td>${DC.formatPrice(e.price)}</td>
          <td><span class="tag" style="${e.status==='paid'?'background:rgba(39,174,96,0.2);color:#27ae60':''}">${e.status.toUpperCase()}</span></td>
          <td>
            <select onchange="Admin.updateEnrollmentStatus('${e.id}', this.value)" style="font-size:0.7rem;padding:0.25rem 0.5rem;background:var(--bg-card);border:1px solid var(--border);color:var(--text)">
              <option value="pending" ${e.status==='pending'?'selected':''}>Pending</option>
              <option value="paid" ${e.status==='paid'?'selected':''}>Paid</option>
              <option value="confirmed" ${e.status==='confirmed'?'selected':''}>Confirmed</option>
              <option value="cancelled" ${e.status==='cancelled'?'selected':''}>Cancelled</option>
            </select>
          </td>
        </tr>`).join('')
      : '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">No enrollments yet</td></tr>';
  },

  async updateEnrollmentStatus(id, status) {
    try {
      await DC.updateCourseEnrollment(id, { status });
      this.toast('Status updated');
      this.renderEnrollments();
    } catch(e) { this.toast(e.message, 'error'); }
  },

  // ─── Admin Email ─────────────────────────────────────────────────────────
  renderAdminEmail() {
    const s = DC.getSettings();
    const emailEl = document.getElementById('admin-email-input');
    const subjectEl = document.getElementById('admin-email-subject');
    if (emailEl) emailEl.value = s.adminEmail || '';
    if (subjectEl) subjectEl.value = s.adminEmailSubject || '[DAPPER COMBAT]';
  },

  async saveAdminEmail() {
    const s = DC.getSettings();
    const emailEl = document.getElementById('admin-email-input');
    const subjectEl = document.getElementById('admin-email-subject');
    s.adminEmail = emailEl?.value?.trim() || '';
    s.adminEmailSubject = subjectEl?.value?.trim() || '[DAPPER COMBAT]';
    try { await DC.saveSettings(s); this.toast('Email settings saved!'); }
    catch(e) { this.toast(e.message, 'error'); }
  },

  renderSecurity() {
    // Show admin URL
    const urlEl = document.getElementById('admin-url-display');
    if (urlEl) urlEl.textContent = window.location.origin + '/admin.html';

    const btn = document.getElementById('btn-change-password');
    if (!btn) return;
    btn.onclick = async () => {
      const errEl = document.getElementById('sec-error');
      errEl.style.display = 'none';
      const currentPw = document.getElementById('sec-current-pw').value;
      const newPw     = document.getElementById('sec-new-pw').value;
      const confirmPw = document.getElementById('sec-confirm-pw').value;
      if (newPw !== confirmPw) { errEl.textContent = 'Mật khẩu mới không khớp'; errEl.style.display = 'block'; return; }
      if (newPw.length < 8)   { errEl.textContent = 'Mật khẩu mới tối thiểu 8 ký tự'; errEl.style.display = 'block'; return; }
      try {
        const token = DC.getToken();
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
        });
        const data = await res.json();
        if (!res.ok) { errEl.textContent = data.error; errEl.style.display = 'block'; return; }
        this.toast('Đổi mật khẩu thành công!');
        document.getElementById('sec-current-pw').value = '';
        document.getElementById('sec-new-pw').value = '';
        document.getElementById('sec-confirm-pw').value = '';
      } catch(e) { errEl.textContent = e.message; errEl.style.display = 'block'; }
    };
  },
};
