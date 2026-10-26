/* Dapper Combat — Quản trị: Nội dung website
   Chữ trên trang (VI/EN, danh sách, ẩn, đường dẫn) · Hình ảnh & video · Màu sắc (+ bảng màu) · Liên hệ · Thanh toán.
   Icon, Bố cục trang, Phông chữ, Liên kết & nút, Mã tùy chỉnh ở admin-cms2.js (dùng chung trạng thái qua A.cms).
   Dùng hạ tầng của admin.js qua window.DCAdmin. Mọi giá trị từ API đều qua esc() trước khi chèn vào HTML;
   URL, mã màu và SVG được kiểm tra / làm sạch trước khi đặt vào trang. */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A) return;
  var esc = A.esc, ICON = A.ICON;

  // ═══ Nhãn & giới hạn ═══════════════════════════════════════════════════════
  var TYPES = {
    title: 'Tiêu đề', subtitle: 'Tiêu đề nhỏ', eyebrow: 'Nhãn nhỏ trên tiêu đề', text: 'Đoạn văn',
    button: 'Nút / liên kết', item: 'Mục danh sách', quote: 'Câu trích dẫn', label: 'Chữ ngắn / nhãn',
    stat: 'Số liệu', question: 'Câu hỏi', answer: 'Câu trả lời', seo: 'SEO', link: 'Đường dẫn',
  };
  var TYPE_TONE = { title: 'strong', seo: 'strong', subtitle: 'mid', question: 'mid', quote: 'mid' };
  var LONG_TYPES = { text: 1, answer: 1, quote: 1, seo: 1 };
  var HTML_HINT = '<em>chữ</em> = chữ nhấn màu đỏ · <br> = xuống dòng';
  var EN_EMPTY = '(để trống = dùng như tiếng Việt)';
  var IMG_RE = /^image\/(jpeg|png|webp|gif)$/;
  var VID_RE = /^video\/(mp4|webm)$/;
  var MAX_IMG = 10 * 1024 * 1024, MAX_VID = 80 * 1024 * 1024;
  var SEARCH_CAP = 150;           // số ô chữ tối đa hiển thị khi tìm kiếm
  var STALE_MS = 60000;
  var AUTO_SIZE = !!(window.CSS && CSS.supports && CSS.supports('field-sizing', 'content'));
  // nhóm thay đổi chờ lưu (ngoài chữ) — lưu chung một lần bằng thanh “Lưu” ở các màn nội dung
  var PGROUPS = ['hide', 'links', 'lists', 'alt', 'media', 'icons', 'layout', 'fonts', 'code'];
  var HREF_RE = /^(\/[^\s"<>]*|#[\w-]*|https?:\/\/[^\s"<>]+|tel:[+\d\s().-]{3,20}|mailto:[^\s"<>@]+@[^\s"<>]+|zalo:\/\/[^\s"<>]+)$/;
  var UP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7"/></svg>';
  var DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>';

  // ═══ Trạng thái ════════════════════════════════════════════════════════════
  var C = {
    cat: null, store: null, idx: null, loading: null, err: '', loadedAt: 0, triedAt: 0, products: null, sitePages: [], liveIds: {},
    text: { tab: '', q: '', only: false, open: {}, pending: {} },
    pend: {}, vf: {}, itemOpen: {}, screens: {}, links: {},
    media: { tab: '', notes: {}, check: {} },
    colors: { draft: null, pal: null, q: '' },
    contact: { draft: null },
    payment: { draft: null },
  };
  PGROUPS.forEach(function (g) { C.pend[g] = {}; });

  // ═══ Tiện ích ══════════════════════════════════════════════════════════════
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function has(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  function num(n) { return (Number(n) || 0).toLocaleString('vi-VN'); }
  function byOrder(a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); }
  function safePath(u) { u = String(u || ''); return /^\/(?![\/\\])[^\s"'<>`]*$/.test(u) ? u : ''; }
  function slug(s) { return String(s).replace(/[^\w-]/g, '_'); }
  function urlSlug(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function clone(o) { return o == null ? null : JSON.parse(JSON.stringify(o)); }
  function same(a, b) { return JSON.stringify(a == null ? null : a) === JSON.stringify(b == null ? null : b); }
  var DEC = document.createElement('textarea');
  // giải mã &amp; &quot; … (textarea chỉ chứa chữ, không tạo thẻ)
  function decode(s) { s = s == null ? '' : String(s); if (s.indexOf('&') < 0) return s; DEC.innerHTML = s; return DEC.value; }
  function plain(s) { return decode(String(s == null ? '' : s).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '')); }
  function trunc(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function kb(n) { n = Number(n) || 0; return n >= 1000 ? (n / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' MB' : num(n) + ' KB'; }
  function bytes(n) { n = Number(n) || 0; return n >= 1024 * 1024 ? (n / 1048576).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' MB' : num(Math.round(n / 1024)) + ' KB'; }
  function dims(a) { return Array.isArray(a) && a[0] && a[1] ? num(a[0]) + ' × ' + num(a[1]) + ' px' : ''; }
  function pageUrl(id) { var p = C.idx && C.idx.page[id]; return p ? safePath(p.url) || '/' : '/'; }
  function inView(prefix) { var v = A.view(); return typeof v === 'string' && v.indexOf(prefix) === 0; }
  function busy(btn, on) { A.setBusy(btn, on); }

  // khóa mục thêm mới: "<khóa gốc>@<mã>[@<mã>…]"
  function splitKey(k) { var p = String(k).split('@'); return { base: p[0], chain: p.length > 1 ? '@' + p.slice(1).join('@') : '' }; }
  function newId() {
    var used = {}, ch = 'abcdefghijklmnopqrstuvwxyz0123456789';
    [C.store && C.store.lists, C.pend.lists].forEach(function (src) { Object.keys(src || {}).forEach(function (k) { var o = src[k]; if (o && o.add) Object.keys(o.add).forEach(function (id) { used[id] = 1; }); }); });
    for (;;) { var s = 'n'; for (var i = 0; i < 5; i++) s += ch[Math.floor(Math.random() * ch.length)]; if (!used[s]) return s; }
  }
  // khóa có đuôi đã lưu hết chưa (mục thêm mới chưa lưu thì chưa “Xem trên trang” được)
  function chainSaved(chain) { return String(chain || '').split('@').filter(Boolean).every(function (id) { return C.liveIds[id]; }); }

  // trang để “Xem trên trang”: khu vực có view riêng (trang sản phẩm, thanh toán…) dùng đúng trang đó
  function sectionUrl(secId, page) {
    var s = C.idx && C.idx.sec[secId], v = s && s.view;
    if (v === 'product') { var p = (C.products || [])[0]; return p ? '/shop/' + urlSlug(p.name) : '/shop'; }
    if (v && safePath(v)) return v;
    return pageUrl(s ? s.page : page);
  }
  function locateUrl(key, secId, page, extra) {
    return safePath(sectionUrl(secId, page) + '?cms=' + encodeURIComponent(key) + (secId ? '&sec=' + encodeURIComponent(secId) : '') + (extra || ''));
  }

  // ── SVG: làm sạch trước khi hiện (bỏ script, sự kiện on…, link ra ngoài) ──
  var SVG_OK = /^(svg|g|path|circle|ellipse|line|polyline|polygon|rect|defs|lineargradient|radialgradient|stop|clippath|mask|use|symbol|title|desc|text|tspan|pattern|image)$/i;
  function sanitizeSvg(src) {
    try {
      var doc = new DOMParser().parseFromString(String(src || '').trim(), 'image/svg+xml');
      var root = doc.documentElement;
      if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) return '';
      (function walk(el) {
        Array.prototype.slice.call(el.children || []).forEach(function (c) { if (!SVG_OK.test(c.nodeName)) c.parentNode.removeChild(c); else walk(c); });
        Array.prototype.slice.call(el.attributes).forEach(function (a) {
          var n = a.name.toLowerCase(), v = a.value;
          var badHref = (n === 'href' || n === 'xlink:href') && !(/^#/.test(v) || (el.nodeName.toLowerCase() === 'image' && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(v)));
          if (n.indexOf('on') === 0 || badHref || /javascript:/i.test(v) || (n === 'style' && /url\(|expression|@import/i.test(v))) el.removeAttribute(a.name);
        });
      })(root);
      var out = new XMLSerializer().serializeToString(root);
      return out.length > 60000 ? '' : out;
    } catch (e) { return ''; }
  }
  function iconUrlSafe(u) { u = String(u || ''); return /^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/.test(u) ? u : A.safeImg(u); }
  // icon đang dùng: ghi đè (svg / ảnh) hoặc icon gốc của web
  function iconMarkup(k) {
    var ic = C.idx.icon[splitKey(k).base], ov = effGet('icons', k);
    if (ov && ov.url) { var u = iconUrlSafe(ov.url); return u ? '<img src="' + esc(u) + '" alt="">' : ''; }
    if (ov && ov.svg) return sanitizeSvg(ov.svg);
    if (typeof ov === 'string') return sanitizeSvg(ov);
    return ic ? sanitizeSvg(ic.svg) : '';
  }
  function iconSize(k) {
    var ic = C.idx.icon[splitKey(k).base], m = ic && /\swidth="(\d+(?:\.\d+)?)"/.exec(String(ic.svg || '').split('>')[0]);
    var n = m ? Math.round(Number(m[1])) : 20;
    return Math.max(12, Math.min(64, n || 20));
  }

  // ═══ Tải dữ liệu ═══════════════════════════════════════════════════════════
  function load(full) {
    if (C.loading) return C.loading;
    C.triedAt = Date.now();
    var needCat = !C.cat || full;
    C.loading = Promise.all([needCat ? A.api('/cms/catalog') : Promise.resolve(C.cat), A.api('/cms'),
      C.products && !full ? Promise.resolve(C.products) : A.api('/products', { auth: false }).catch(function () { return []; }),
      A.api('/pages').catch(function () { return C.sitePages || []; }),
      A.loadCategories ? A.loadCategories(full) : null])
      .then(function (r) {
        if (needCat) setCatalog(r[0] || {});
        setStore(r[1] || {});
        C.products = Array.isArray(r[2]) ? r[2] : [];
        C.sitePages = Array.isArray(r[3]) ? r[3] : [];
        C.err = ''; C.loadedAt = Date.now();
      })
      .catch(function (e) { C.err = (e && e.message) || 'Không tải được nội dung'; })
      .then(function () { C.loading = null; });
    return C.loading;
  }
  function setCatalog(cat) {
    C.cat = cat; C.vf = {};
    var I = { page: {}, pages: [], sec: {}, secs: {}, fields: {}, field: {}, pageFields: {}, media: {}, pageMedia: {},
      list: {}, secLists: {}, inItem: {}, icon: {}, pageIcons: {}, link: {}, linkByField: {}, secLinks: {}, pageLinks: {} };
    (cat.pages || []).forEach(function (p) { I.page[p.id] = p; I.pages.push(p); });
    (cat.sections || []).slice().sort(byOrder).forEach(function (s) { I.sec[s.id] = s; (I.secs[s.page] = I.secs[s.page] || []).push(s); });
    (cat.fields || []).slice().sort(byOrder).forEach(function (f) {
      I.field[f.key] = f;
      (I.fields[f.section] = I.fields[f.section] || []).push(f);
      (I.pageFields[f.page] = I.pageFields[f.page] || []).push(f);
      f._hay = A.norm([f.label, f.itemLabel, plain(f.vi), plain(f.en), f.key].join(' '));
    });
    var secOrder = function (m) { var s = I.sec[m.section]; return s ? Number(s.order) || 0 : 999; };
    (cat.media || []).slice().sort(function (a, b) { return secOrder(a) - secOrder(b) || byOrder(a, b); }).forEach(function (m) {
      I.media[m.key] = m; (I.pageMedia[m.page] = I.pageMedia[m.page] || []).push(m);
    });
    (cat.lists || []).forEach(function (L) {
      I.list[L.key] = L;
      if (!L.parent) (I.secLists[L.section] = I.secLists[L.section] || []).push(L);
      L.items.forEach(function (it) { it.fields.concat(it.media || [], it.icons || [], it.links || []).forEach(function (k) { I.inItem[k] = L.key; }); });
    });
    (cat.icons || []).slice().sort(function (a, b) { return secOrder(a) - secOrder(b); }).forEach(function (ic) {
      I.icon[ic.key] = ic; (I.pageIcons[ic.page] = I.pageIcons[ic.page] || []).push(ic);
    });
    (cat.links || []).forEach(function (l) {
      I.link[l.key] = l;
      if (l.field) I.linkByField[l.field] = l;
      (I.secLinks[l.section] = I.secLinks[l.section] || []).push(l);
    });
    C.idx = I;
  }
  var GROUPS = ['text', 'media', 'alt', 'colors', 'palette', 'fonts', 'contact', 'payment', 'icons', 'links', 'hide', 'lists', 'layout', 'code'];
  function setStore(s) {
    s = s || {};
    GROUPS.forEach(function (k) { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
    C.store = s;
    C.liveIds = {};
    Object.keys(s.lists).forEach(function (k) { var o = s.lists[k]; if (o && o.add) Object.keys(o.add).forEach(function (id) { C.liveIds[id] = 1; }); });
    updateBadges();
  }
  function ready() { return !!(C.cat && C.store && C.idx); }
  function stateHtml() { return C.err && !ready() ? A.errorHtml(C.err) : A.loadingHtml(); }

  // ── thay đổi chờ lưu ──
  function effGet(g, k) { return has(C.pend[g], k) ? C.pend[g][k] : (C.store && C.store[g] ? C.store[g][k] : undefined); }
  function setPend(g, k, v) { if (same(v, C.store && C.store[g] ? C.store[g][k] : null)) delete C.pend[g][k]; else C.pend[g][k] = v == null ? null : v; }
  function isHidden(k) { return effGet('hide', k) === true; }
  function pendCount() { var n = Object.keys(C.text.pending).length; PGROUPS.forEach(function (g) { n += Object.keys(C.pend[g]).length; }); return n; }
  function clearPending() { C.text.pending = {}; PGROUPS.forEach(function (g) { C.pend[g] = {}; }); updateBadges(); }
  function keyPage(k) {
    var b = splitKey(k).base, I = C.idx;
    var o = I.field[b] || I.media[b] || I.icon[b] || I.link[b] || I.list[b];
    return o ? o.page : (I.page[b] ? b : '');
  }

  function editedText(page) { return Object.keys(C.store.text).filter(function (k) { var f = C.idx.field[splitKey(k).base]; return f && (!page || f.page === page); }).length; }
  function editedMedia(page) { return Object.keys(C.store.media).filter(function (k) { var m = C.idx.media[k]; return m && (!page || m.page === page); }).length; }
  function pendingCount(page) {
    var keys = Object.keys(C.text.pending);
    ['hide', 'links', 'lists', 'alt', 'media', 'icons'].forEach(function (g) { keys = keys.concat(Object.keys(C.pend[g])); });
    return keys.filter(function (k) { return !page || keyPage(k) === page; }).length;
  }

  function updateBadges() {
    var b = $('[data-cms-badge="text"]');
    if (b) { var n = pendCount(); b.hidden = !n; b.textContent = n; b.title = n + ' thay đổi nội dung chưa lưu'; }
  }

  // ═══ Thanh lưu (dùng chung) ════════════════════════════════════════════════
  function savebarHtml(kind) {
    return '<div class="savebar" data-savebar="' + kind + '" hidden role="region" aria-label="Lưu thay đổi">' +
      '<p class="savebar__msg" data-savebar-msg></p>' +
      '<div class="savebar__actions"><button class="btn btn--on-dark" type="button" data-cms-discard="' + kind + '">Hủy</button>' +
      '<button class="btn btn--primary" type="button" data-cms-save="' + kind + '">Lưu</button></div></div>';
  }
  function setSavebar(kind, n, unit) {
    var bar = $('[data-savebar="' + kind + '"]'); if (!bar) return;
    bar.hidden = !n;
    $('[data-savebar-msg]', bar).textContent = n + ' ' + unit + ' chưa lưu';
    $('[data-cms-save="' + kind + '"]', bar).textContent = 'Lưu ' + n + ' thay đổi';
  }
  function refreshBar() { setSavebar('cms', pendCount(), 'thay đổi'); updateBadges(); }

  function tabsHtml(base, pages, active, meta) {
    return '<nav class="cms-tabs" aria-label="Chọn trang">' + pages.map(function (p) {
      var on = p.id === active, m = meta(p);
      return '<a class="cms-tab' + (on ? ' is-active' : '') + '" href="#/' + base + '/' + esc(encodeURIComponent(p.id)) + '"' + (on ? ' aria-current="page"' : '') + '>' +
        '<span class="cms-tab__label">' + esc(p.label) + '</span><span class="cms-tab__meta">' + m + '</span></a>';
    }).join('') + '</nav>';
  }

  // ═══ Đường dẫn (link) ══════════════════════════════════════════════════════
  function presetGroups() {
    var ct = (C.store && C.store.contact) || {}, def = {};
    ((C.cat && C.cat.contact) || []).forEach(function (c) { def[c.key] = c.def; });
    var cv = function (k) { return String(ct[k] || def[k] || ''); };
    var phone = cv('phone').replace(/[^\d+]/g, '');
    var social = [['Zalo', cv('zalo')], ['Facebook', cv('facebook')], ['Instagram', cv('instagram')], ['YouTube', cv('youtube')]].filter(function (x) { return /^https:\/\//.test(x[1]); });
    if (phone.replace(/\D/g, '').length >= 8) social.push(['Gọi ' + cv('phone'), 'tel:' + phone]);
    return [
      ['Trang', [['Trang chủ', '/'], ['Shop', '/shop'], ['Khóa học', '/khoa-hoc'], ['Dịch vụ Setup', '/dich-vu-setup'], ['Thanh toán', '/shop/checkout']]],
      // danh mục theo Thiết lập → Danh mục sản phẩm (danh mục mới tự có ở đây)
      ['Danh mục Shop', (A.categories ? A.categories() : []).filter(function (c) { return /^[a-z0-9-]{1,20}$/.test(c.id); }).map(function (c) {
        return ['Shop — ' + c.name.vi + (c.hidden ? ' (đang ẩn)' : ''), '/shop?cat=' + c.id]; })],
      ['Trang chủ — tới khu vực', [['Triết lý', '/#triet-ly'], ['Huấn luyện viên', '/#hlv'], ['Khóa học', '/#khoa-hoc'], ['Sản phẩm', '/#san-pham'], ['Cộng đồng', '/#cong-dong'], ['Đánh giá', '/#danh-gia'], ['Địa chỉ', '/#dia-chi']]],
      ['Khóa học — tới khu vực', [['Foundation', '/khoa-hoc#foundation'], ['Về chúng tôi', '/khoa-hoc#ve-chung-toi'], ['Vì sao chọn', '/khoa-hoc#vi-sao'], ['Chương trình', '/khoa-hoc#chuong-trinh'],
        ['Không gian', '/khoa-hoc#khong-gian'], ['Học phí', '/khoa-hoc#hoc-phi'], ['Lịch tập', '/khoa-hoc#lich-tap'], ['Hỏi đáp', '/khoa-hoc#hoi-dap'], ['Quy trình', '/khoa-hoc#quy-trinh'],
        ['Thông tin cần biết', '/khoa-hoc#thong-tin'], ['Mở form đăng ký học thử', '/khoa-hoc#dang-ky']]],
      ['Dịch vụ Setup — tới khu vực', [['3 dịch vụ', '/dich-vu-setup#services'], ['Gói thiết bị', '/dich-vu-setup#packages'], ['Quy trình', '/dich-vu-setup#process'], ['Không gian', '/dich-vu-setup#gallery'], ['Hỏi đáp', '/dich-vu-setup#faq'], ['Form nhận tư vấn', '/dich-vu-setup#contact']]],
      ['Liên hệ & mạng xã hội', social],
      ['Trang phụ', (C.sitePages || []).slice().sort(function (a, b) { return (b.published ? 1 : 0) - (a.published ? 1 : 0); }).filter(function (p) { return /^[a-z0-9-]+$/.test(p.slug || ''); }).map(function (p) {
        return ['Trang phụ: ' + ((p.title && p.title.vi) || p.slug) + (p.published ? '' : ' (nháp)'), '/trang/' + p.slug]; })],
    ];
  }
  function presetSelectHtml() {
    return '<select data-link-preset aria-label="Chọn nhanh đường dẫn"><option value="">Chọn nhanh…</option>' + presetGroups().map(function (g) {
      return g[1].length ? '<optgroup label="' + esc(g[0]) + '">' + g[1].map(function (o) { return '<option value="' + esc(o[1]) + '">' + esc(o[0]) + '</option>'; }).join('') + '</optgroup>' : '';
    }).join('') + '</select>';
  }
  function linkDefault(k) {
    var b = splitKey(k).base, l = C.idx.link[b];
    if (l) return String(l.href || '');
    var f = C.idx.field[b];
    return f && f.type === 'link' ? decode(f.vi || '') : '';
  }
  function linkKeyFor(fieldKey) { var sp = splitKey(fieldKey), l = C.idx.linkByField[sp.base]; return l ? l.key + sp.chain : ''; }
  function linkHint(def) { return 'Để trống = dùng đường dẫn gốc' + (def ? ' (' + esc(trunc(def, 60)) + ')' : '') + '. Có thể chọn nhanh ở ô bên cạnh.'; }
  function linkEditorHtml(key, label) {
    var cur = effGet('links', key), def = linkDefault(key), id = 'lk-' + slug(key);
    return '<div class="cms-link-ed" data-link-key="' + esc(key) + '">' +
      '<label class="cms-side__lab" for="' + esc(id) + '"><span class="cms-lang">URL</span>' + esc(label || 'Đường dẫn khi bấm') + '</label>' +
      '<div class="cms-link-ed__row"><input id="' + esc(id) + '" type="text" inputmode="url" spellcheck="false" autocomplete="off" maxlength="300" data-link-input value="' + esc(cur == null ? '' : cur) + '" placeholder="' + esc(def || '/…') + '">' +
      presetSelectHtml() + '</div>' +
      '<p class="field__hint" data-link-msg>' + linkHint(def) + '</p></div>';
  }
  function hideToggleHtml(key, what) {
    var on = isHidden(key);
    return '<label class="check cms-hide" title="Ẩn khỏi trang web — nội dung vẫn được giữ để hiện lại sau"><input type="checkbox" data-hide-key="' + esc(key) + '"' + (on ? ' checked' : '') + '>' +
      '<span class="switch__ui" aria-hidden="true"></span><span>Ẩn ' + esc(what || 'trên trang') + '</span></label>';
  }
  // dòng “liên kết không gắn với chữ” (ảnh bấm được, logo…) và màn Liên kết & nút
  function linkRowHtml(lk, opt) {
    opt = opt || {};
    var l = C.idx.link[splitKey(lk).base]; if (!l) return '';
    var pend = has(C.pend.links, lk) || has(C.pend.hide, lk), edited = has(C.store.links, lk) || has(C.store.hide, lk);
    var loc = opt.unsaved ? '' : locateUrl(lk, l.section, l.page);
    return '<div class="cms-row cms-row--link' + (pend ? ' is-pending' : '') + (isHidden(lk) ? ' is-hidden' : '') + '" data-lkrow="' + esc(lk) + '">' +
      '<div class="cms-row__head"><span class="cms-type">Liên kết</span><span class="cms-row__label">' + esc(opt.label || l.label || lk) + '</span>' +
        '<span class="cms-row__flags">' + (pend ? '<span class="badge badge--done">Chưa lưu</span>' : '') + (edited ? '<span class="badge badge--mid">Đã sửa</span>' : '') + '</span>' +
        (loc ? '<a class="cms-row__locate" href="' + esc(loc) + '" target="_blank" rel="noopener">Xem trên trang ↗</a>' : '') + '</div>' +
      linkEditorHtml(lk, 'Đường dẫn khi bấm') +
      '<div class="cms-row__foot"><span class="spacer"></span>' + hideToggleHtml(lk) +
        (edited || pend ? '<button type="button" class="cms-link" data-link-reset>Khôi phục mặc định</button>' : '') + '</div></div>';
  }
  function otherLinksHtml(secId) {
    var ls = (C.idx.secLinks[secId] || []).filter(function (l) { return !l.field && !C.idx.inItem[l.key]; });
    if (!ls.length) return '';
    return '<div class="cms-other"><p class="cms-other__title">Liên kết khác <span class="field__hint">— ảnh, logo, biểu tượng bấm được trong khu vực này</span></p>' +
      ls.map(function (l) { return linkRowHtml(l.key); }).join('') + '</div>';
  }

  // ═══ 1. Chữ trên trang ═════════════════════════════════════════════════════
  // ô chữ của mục thêm mới (khóa có đuôi @…) dùng thông tin của ô gốc
  function fieldByKey(k) {
    if (!C.idx) return null;
    if (C.idx.field[k]) return C.idx.field[k];
    var b = splitKey(k).base, f = C.idx.field[b];
    if (!f) return null;
    if (!C.vf[k]) { var v = Object.assign({}, f); v.key = k; v.baseKey = b; C.vf[k] = v; }
    return C.vf[k];
  }
  function savedVal(f, side) { var o = C.store.text[f.key]; return o && o[side] != null ? String(o[side]) : ''; }
  function defRaw(f, side) { return side === 'vi' ? f.vi : (f.en != null ? f.en : null); }
  function defShown(f, side) { var d = defRaw(f, side); return d == null ? null : decode(d); }
  // giá trị sẽ lưu: rỗng hoặc trùng chữ gốc → '' (= dùng mặc định)
  function effective(f, side, v) {
    var t = String(v || '').trim();
    if (!t) return '';
    var d = side === 'vi' ? f.vi : (f.en != null ? f.en : f.vi);
    if (d != null && (t === d || t === decode(d))) return '';
    return t;
  }
  function curVal(f, side) { var p = C.text.pending[f.key]; return p && p[side] !== undefined ? p[side] : savedVal(f, side); }
  function isEdited(f) {
    var k = f.key, lk = linkKeyFor(k), S = C.store;
    return has(S.text, k) || has(S.hide, k) || (f.type === 'link' && has(S.links, k)) || (!!lk && (has(S.links, lk) || has(S.hide, lk)));
  }
  function isPending(f) {
    var k = f.key, lk = linkKeyFor(k), P = C.pend;
    return has(C.text.pending, k) || has(P.hide, k) || has(P.links, k) || (!!lk && (has(P.links, lk) || has(P.hide, lk)));
  }
  function filtering() { return !!(C.text.q.trim() || C.text.only); }
  function matchField(f) {
    if (C.text.only && !isEdited(f) && !isPending(f)) return false;
    var q = A.norm(C.text.q).trim();
    if (!q) return true;
    if (f._hay.indexOf(q) !== -1) return true;
    return A.norm(plain(curVal(f, 'vi')) + ' ' + plain(curVal(f, 'en'))).indexOf(q) !== -1;
  }
  function rowsFor(f, val, ph) {
    var s = String(val || ph || '').replace(/<br\s*\/?>/gi, '\n');
    var lines = s.split('\n').reduce(function (n, l) { return n + Math.max(1, Math.ceil(l.length / 46)); }, 0);
    return Math.min(10, Math.max(LONG_TYPES[f.type] ? 2 : 1, lines));
  }

  function textMount(main, sub) {
    main.innerHTML = A.pageHead('Chữ trên trang', { eyebrow: 'Nội dung website', stamp: false, count: false }) + '<div data-cms-root></div>';
    textRoute(main, sub, true);
  }
  function textRoute(main, sub, first) {
    var root = $('[data-cms-root]', main); if (!root) return;
    if (!ready()) {
      root.innerHTML = stateHtml();
      if (!C.loading && first !== 'after') load().then(function () { if (A.view() === 'cms-text') textRoute(main, sub, 'after'); });
      return;
    }
    var pages = C.idx.pages.filter(function (p) { return (C.idx.pageFields[p.id] || []).length; });
    C.text.tab = pages.some(function (p) { return p.id === sub; }) ? sub : (C.text.tab || (C.idx.page.home ? 'home' : (pages[0] && pages[0].id)));
    if (!root.firstChild || !$('[data-cms-list]', root)) {
      root.innerHTML =
        '<div class="cms-help"><p><strong>Cách sửa:</strong> mở từng khu vực, gõ chữ mới vào ô — ô để trống nghĩa là dùng chữ gốc (chữ mờ trong ô). ' +
        'Các <strong>danh sách</strong> (câu hỏi, đánh giá, thẻ…) có thể thêm, nhân bản, ẩn và đổi thứ tự từng mục. Bấm “Lưu” ở thanh dưới cùng — website cập nhật ngay.</p></div>' +
        '<div data-cms-tabs></div>' +
        '<div class="cms-tools">' +
          '<label class="search cms-search">' + ICON.search + '<span class="sr">Tìm chữ</span>' +
          '<input type="search" data-cms-search placeholder="Tìm chữ trên mọi trang…" autocomplete="off" spellcheck="false" enterkeyhint="search"></label>' +
          '<label class="check cms-only"><input type="checkbox" data-cms-only><span class="switch__ui" aria-hidden="true"></span><span>Chỉ hiện chỗ đã sửa</span></label>' +
          '<span class="spacer"></span>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-cms-expand="all">Mở tất cả</button>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-cms-expand="none">Thu gọn</button>' +
        '</div>' +
        '<div data-cms-list></div>' + savebarHtml('cms');
      $('[data-cms-search]', root).value = C.text.q;
      $('[data-cms-only]', root).checked = C.text.only;
    }
    if (first !== true && first !== 'after') window.scrollTo(0, 0);
    renderTextTabs(); renderTextList(); refreshBar();
  }
  function renderTextTabs() {
    var box = $('[data-cms-tabs]'); if (!box) return;
    var pages = C.idx.pages.filter(function (p) { return (C.idx.pageFields[p.id] || []).length; });
    var f = filtering();
    box.innerHTML = tabsHtml('cms-text', pages, C.text.tab, function (p) {
      var all = C.idx.pageFields[p.id] || [], ed = editedText(p.id), pend = pendingCount(p.id);
      return (f ? esc(num(all.filter(matchField).length)) + ' kết quả' : esc(num(all.length)) + ' chữ') +
        (ed ? ' · ' + esc(ed) + ' đã sửa' : '') + (pend ? '<b class="cms-tab__pend">' + esc(pend) + ' chưa lưu</b>' : '');
    });
  }
  function sectionFlags(secId) {
    var fields = C.idx.fields[secId] || [];
    var ed = fields.filter(isEdited).length, pend = fields.filter(isPending).length;
    (C.idx.secLists[secId] || []).forEach(function (L) { if (has(C.store.lists, L.key)) ed++; if (has(C.pend.lists, L.key)) pend++; });
    return (ed ? '<span class="badge badge--mid">' + esc(ed) + ' đã sửa</span>' : '') + (pend ? '<span class="badge badge--done">' + esc(pend) + ' chưa lưu</span>' : '');
  }
  function standalone(secId) { return (C.idx.fields[secId] || []).filter(function (x) { return !C.idx.inItem[x.key]; }); }
  function renderTextList() {
    var box = $('[data-cms-list]'); if (!box) return;
    var page = C.text.tab, secs = C.idx.secs[page] || [], f = filtering(), html = '', shown = 0, total = 0;
    var tools = $('.cms-tools');
    if (tools) $$('[data-cms-expand]', tools).forEach(function (b) { b.hidden = f; });
    secs.forEach(function (s) {
      var all = C.idx.fields[s.id] || [];
      var hits = 0;
      if (f) {
        hits = standalone(s.id).filter(matchField).length;
        (C.idx.secLists[s.id] || []).forEach(function (L) { var info = itemsOf(L.key); if (info) hits += info.items.filter(itemMatches).length; });
        if (!hits) return;
        total += hits;
        if (shown >= SEARCH_CAP) return;
        shown += hits;
      }
      var open = f ? true : !!C.text.open[s.id];
      html += sectionHtml(s, all, hits, open, open ? sectionBodyHtml(s, f) : '', f);
    });
    if (f && !total) {
      var others = C.idx.pages.filter(function (p) { return p.id !== page; }).map(function (p) {
        return [p, (C.idx.pageFields[p.id] || []).filter(matchField).length];
      }).filter(function (x) { return x[1]; });
      html = '<div class="state"><p class="state__title">Không có kết quả ở trang này</p>' +
        (others.length ? '<p>Có kết quả ở: ' + others.map(function (x) {
          return '<a href="#/cms-text/' + esc(encodeURIComponent(x[0].id)) + '">' + esc(x[0].label) + ' (' + esc(x[1]) + ')</a>';
        }).join(' · ') + '</p>' : '<p>Thử từ khóa khác' + (C.text.only ? ' hoặc tắt “Chỉ hiện chỗ đã sửa”' : '') + '.</p>') + '</div>';
    } else if (f && total > shown) {
      html += '<p class="results-meta">Đang hiện ' + esc(shown) + ' / ' + esc(total) + ' kết quả — gõ cụ thể hơn để thu hẹp.</p>';
    }
    if (!secs.length) html = A.emptyHtml('Trang này chưa có chữ nào để sửa', '');
    box.innerHTML = html;
  }
  function sectionHtml(s, all, hits, open, body, f) {
    var bid = 'cms-sec-' + slug(s.id), url = sectionUrl(s.id, s.page), nl = (C.idx.secLists[s.id] || []).length;
    return '<section class="cms-sec' + (open ? ' is-open' : '') + '" data-sec="' + esc(s.id) + '">' +
      '<div class="cms-sec__head">' +
        '<button type="button" class="cms-sec__toggle" data-sec-toggle aria-expanded="' + open + '" aria-controls="' + esc(bid) + '">' +
          '<span class="cms-sec__chev" aria-hidden="true"></span>' +
          '<span class="cms-sec__label">' + esc(s.label) + '</span>' +
          '<span class="cms-sec__meta">' + (f ? esc(hits) + ' kết quả · ' : '') + esc(all.length) + ' chữ' + (nl ? ' · ' + esc(nl) + ' danh sách' : '') + '</span>' +
          '<span class="cms-sec__flags" data-sec-flags>' + sectionFlags(s.id) + '</span>' +
        '</button>' +
        '<a class="cms-sec__link" href="' + esc(locateUrl(s.id, s.id, s.page)) + '" target="_blank" rel="noopener" title="Xem khu vực này trên trang"><span class="cms-sec__link-t">Xem trang</span> ↗</a>' +
      '</div>' +
      '<div class="cms-sec__body" id="' + esc(bid) + '"' + (open ? '' : ' hidden') + '>' + body + '</div></section>';
  }
  function sectionBodyHtml(s, f) {
    var stand = standalone(s.id), rows = f ? stand.filter(matchField) : stand;
    var h = rowsHtml(rows, f);
    if (!f) h += otherLinksHtml(s.id);
    (C.idx.secLists[s.id] || []).forEach(function (L) {
      if (f) { var info = itemsOf(L.key); if (!info || !info.items.some(itemMatches)) return; }
      h += listBlockHtml(L.key, s.id, 0, f);
    });
    return h || '<p class="mini-state">Không có chữ nào.</p>';
  }
  function rowsHtml(fields, f) {
    var vis = f ? fields : fields.filter(function (x) { return !x.hidden; });
    var hid = f ? [] : fields.filter(function (x) { return x.hidden; });
    var h = vis.map(function (x) { return rowHtml(x); }).join('');
    if (hid.length) h += '<details class="cms-hidden"><summary>Chỉ hiện trong vài trường hợp (' + esc(hid.length) + ')</summary>' + hid.map(function (x) { return rowHtml(x); }).join('') + '</details>';
    return h;
  }
  var TOKEN_RE = /\{((?:found|gt|hssv|mem|ship|promo|hours|sched)\.[A-Za-z0-9.-]+)\}/g;
  function tokenKeys(f) {
    var seen = [], txt = [f.vi, f.en, curVal(f, 'vi'), curVal(f, 'en')].join(' '), m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(txt))) if (seen.indexOf(m[1]) < 0) seen.push(m[1]);
    return seen;
  }
  function tokenLine(keys) {
    var t = A.settingsTokens ? A.settingsTokens() : null;
    if (!t && A.getSettings && !C.tokLoading) {
      C.tokLoading = A.getSettings().then(function () { C.tokLoading = null; $$('[data-tokens]').forEach(function (n) { n.innerHTML = tokenLine(n.getAttribute('data-tokens').split(' ')); }); });
    }
    var src = [], has = function (re) { return keys.some(function (k) { return re.test(k); }); };
    if (has(/^(found|gt|hssv|mem|sched)\./)) src.push('<a href="#/set-course">Thiết lập › Học phí &amp; lịch tập</a>');
    if (has(/^(ship|promo)\./)) src.push('<a href="#/set-shop">Thiết lập › Bán hàng</a>');
    if (has(/^hours\./)) src.push('<a href="#/cms-contact">Liên hệ › giờ mở cửa</a>');
    return '<span class="cms-tok__lead">Tự điền:</span> ' + keys.map(function (k) {
      // {gt.N…} / {sched.…} mà không còn gói / lớp tương ứng → trên web để trống
      var gm = /^gt\.(\d+)(?:\.(?:mo|save))?$/.exec(k), sm = /^sched\./.test(k);
      var val = !t ? '…' : t[k] != null && t[k] !== '' ? esc(t[k]) : gm ? '<span class="cms-warn">gói ' + esc(gm[1]) + ' tháng không còn — chỗ này trên web sẽ để trống</span>'
        : sm ? '<span class="cms-warn">không còn lớp này trong Lịch tập — chỗ này trên web sẽ để trống</span>' : '(trống)';
      return '<code>{' + esc(k) + '}</code> = <strong>' + val + '</strong>';
    }).join(' · ') + ' <span class="cms-tok__src">(lấy từ ' + src.join(' / ') + ' — giữ nguyên phần {…} khi sửa chữ)</span>';
  }
  function rowFlags(f) {
    return (isPending(f) ? '<span class="badge badge--done">Chưa lưu</span>' : '') + (isEdited(f) ? '<span class="badge badge--mid">Đã sửa</span>' : '') +
      (isHidden(f.key) ? '<span class="tag tag--muted">Đang ẩn trên trang</span>' : '');
  }
  // opt: { inItem, unsaved } — ô chữ nằm trong một mục danh sách / mục chưa lưu (chưa “Xem trên trang” được)
  function rowHtml(f, opt) {
    opt = opt || {};
    var lab = opt.inItem ? (f.itemLabel || f.label) : f.label;
    var locate = f.locate && !opt.unsaved ? locateUrl(f.key, f.section, f.page) : '';
    var isLink = f.type === 'link', lk = isLink ? '' : linkKeyFor(f.key);
    var tk = isLink ? [] : tokenKeys(f);
    return '<div class="cms-row' + (isPending(f) ? ' is-pending' : '') + (isHidden(f.key) ? ' is-hidden' : '') + '" data-key="' + esc(f.key) + '"' +
        (opt.inItem ? ' data-in-item="1"' : '') + (opt.unsaved ? ' data-unsaved="1"' : '') + '>' +
      '<div class="cms-row__head">' +
        '<span class="cms-type cms-type--' + (TYPE_TONE[f.type] || 'soft') + '">' + esc(TYPES[f.type] || f.type || 'Chữ') + '</span>' +
        (A.norm(lab || '') === A.norm(TYPES[f.type] || '') ? '' : '<span class="cms-row__label">' + esc(lab || f.key) + '</span>') +
        '<span class="cms-row__flags" data-row-flags>' + rowFlags(f) + '</span>' +
        (locate ? '<a class="cms-row__locate" href="' + esc(locate) + '" target="_blank" rel="noopener">Xem trên trang ↗</a>' : '') +
      '</div>' +
      (isLink ? linkEditorHtml(f.key, 'Đường dẫn (URL)') : (f.mono ? sideHtml(f, 'vi', true) : sideHtml(f, 'vi') + sideHtml(f, 'en'))) +
      (tk.length ? '<p class="cms-tok" data-tokens="' + esc(tk.join(' ')) + '">' + tokenLine(tk) + '</p>' : '') +
      (lk ? linkEditorHtml(lk, 'Đường dẫn khi bấm vào chữ này') : '') +
      '<div class="cms-row__foot">' +
        (f.html && !isLink ? '<span class="cms-hint">' + esc(HTML_HINT) + '</span>' : '') +
        '<span class="spacer"></span>' +
        (isLink ? '' : hideToggleHtml(f.key)) +                       // đường dẫn: ẩn cả mục ở danh sách, không ẩn riêng link
        (isLink ? '' : '<button type="button" class="cms-link" data-copy-def>Chép chữ gốc để sửa</button>') +
        (isEdited(f) || isPending(f) ? '<button type="button" class="cms-link" data-reset-key>Khôi phục mặc định</button>' : '') +
      '</div></div>';
  }
  // mono: trang dùng MỘT giá trị cho cả 2 ngôn ngữ → chỉ 1 ô, lưu vào {vi}
  function sideHtml(f, side, mono) {
    var id = 'cms-' + side + '-' + slug(f.key);
    var val = curVal(f, side);
    var def = defShown(f, side);
    var ph = def != null ? def : EN_EMPTY;
    var lab = mono ? '<span class="cms-lang">VI · EN</span>Nội dung (dùng cho cả 2 ngôn ngữ)'
      : '<span class="cms-lang">' + (side === 'vi' ? 'VI' : 'EN') + '</span>' + (side === 'vi' ? 'Tiếng Việt' : 'English <span class="cms-ai-tag" title="Lưu chữ tiếng Việt là AI tự dịch sang tiếng Anh — không cần nhập ô này">AI tự dịch</span>');
    return '<div class="cms-side' + (mono ? ' cms-side--full' : '') + '">' +
      '<label class="cms-side__lab" for="' + esc(id) + '">' + lab + '</label>' +
      '<textarea id="' + esc(id) + '" class="cms-ta" data-side="' + side + '" rows="' + rowsFor(f, val, ph) + '" lang="' + side + '" spellcheck="false" placeholder="' + esc(ph) + '">' + esc(val) + '</textarea>' +
      '<div class="cms-side__meta" data-meta="' + side + '">' + metaHtml(f, side, val) + '</div></div>';
  }
  function metaHtml(f, side, val) {
    var base = side === 'vi' ? f.vi : (f.en != null ? f.en : f.vi);
    var bl = plain(base).length;
    // tiếng Việt đã sửa mà chưa có tiếng Anh → AI đang dịch (hoặc chưa có khóa AI)
    if (side === 'en' && !String(val || '').trim() && savedVal(f, 'vi')) {
      return C.ai && C.ai.enabled ? '<span class="cms-ai-wait">Đang chờ AI dịch… (tự cập nhật sau vài giây)</span>'
        : '<span class="cms-warn">Chưa dịch — trang tiếng Anh đang hiện chữ tiếng Việt. Cài khóa ở <a href="#/cms-ai">Tiếng Anh (AI)</a>.</span>';
    }
    if (!String(val || '').trim()) return '<span>' + (side === 'en' && f.en == null ? 'Đang dùng chữ tiếng Việt' : 'Đang dùng chữ gốc') + ' · ' + esc(bl) + ' ký tự</span>';
    var len = plain(val).length;
    var h = '<span>' + esc(len) + ' ký tự · gốc ' + esc(bl) + '</span>';
    if (bl && len > bl * 1.5 && len - bl >= 5) h += '<span class="cms-warn">Dài hơn bản gốc nhiều — có thể vỡ bố cục</span>';
    var d = side === 'vi' ? defShown(f, 'vi') : (f.en != null ? defShown(f, 'en') : defShown(f, 'vi'));
    if (d) h += '<span class="cms-orig" title="' + esc(d) + '">Gốc: ' + esc(trunc(d, 90)) + '</span>';
    return h;
  }
  function autosize(ta) { if (AUTO_SIZE) return; ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; }

  function onTextInput(ta) {
    var row = ta.closest('[data-key]'); if (!row) return;
    var f = fieldByKey(row.getAttribute('data-key')); if (!f) return;
    var side = ta.getAttribute('data-side');
    var eff = effective(f, side, ta.value);
    var p = C.text.pending[f.key] || {};
    if (eff === savedVal(f, side)) delete p[side]; else p[side] = eff;
    if (Object.keys(p).length) C.text.pending[f.key] = p; else delete C.text.pending[f.key];
    var meta = $('[data-meta="' + side + '"]', row); if (meta) meta.innerHTML = metaHtml(f, side, ta.value);
    autosize(ta);
    // tên mục trong danh sách đổi theo ô tiêu đề
    var item = row.closest('[data-item]');
    if (item && side === 'vi' && item.getAttribute('data-title-key') === f.key) {
      var tt = $('.cms-item__title', item); if (tt) tt.textContent = plain(ta.value).trim() ? trunc(plain(ta.value).trim(), 80) : tt.getAttribute('data-fallback');
    }
    refreshRowState(row, f);
  }
  function refreshRowState(row, f) {
    if (f) {
      row.classList.toggle('is-pending', isPending(f));
      row.classList.toggle('is-hidden', isHidden(f.key));
      var fl = $('[data-row-flags]', row); if (fl) fl.innerHTML = rowFlags(f);
    }
    markItems(row);
    var sec = row.closest('[data-sec]');
    if (sec) { var sf = $('[data-sec-flags]', sec); if (sf) sf.innerHTML = sectionFlags(sec.getAttribute('data-sec')); }
    if (A.view() === 'cms-text') renderTextTabs();
    refreshBar();
  }
  // mục danh sách chứa chỗ vừa sửa → đánh dấu “Chưa lưu”
  function markItems(el) { for (var it = el.closest('[data-item]'); it; it = it.parentElement && it.parentElement.closest('[data-item]')) it.classList.add('is-pending'); }
  function redrawRow(row) {
    var key = row.getAttribute('data-key'), f = fieldByKey(key); if (!f) return row;
    var tmp = document.createElement('div');
    tmp.innerHTML = rowHtml(f, { inItem: row.hasAttribute('data-in-item'), unsaved: row.hasAttribute('data-unsaved') });
    var fresh = tmp.firstChild; row.parentNode.replaceChild(fresh, row);
    if (!AUTO_SIZE) $$('.cms-ta', fresh).forEach(autosize);
    refreshRowState(fresh, f);
    return fresh;
  }

  function toggleSection(btn) {
    var sec = btn.closest('[data-sec]'), id = sec.getAttribute('data-sec');
    var body = $('.cms-sec__body', sec);
    var open = btn.getAttribute('aria-expanded') !== 'true';
    if (open && !body.firstChild) body.innerHTML = sectionBodyHtml(C.idx.sec[id] || { id: id }, false);
    body.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    sec.classList.toggle('is-open', open);
    if (!filtering()) C.text.open[id] = open;
    if (open && !AUTO_SIZE) $$('.cms-ta', body).forEach(autosize);
  }

  function resetKey(btn) {
    var row = btn.closest('[data-key]'), key = row.getAttribute('data-key'), f = fieldByKey(key);
    if (!f) return;
    if (has(C.store.text, key)) C.text.pending[key] = f.mono ? { vi: '' } : { vi: '', en: '' }; else delete C.text.pending[key];
    setPend('hide', key, null);
    if (f.type === 'link') setPend('links', key, null);
    var lk = linkKeyFor(key); if (lk) { setPend('links', lk, null); setPend('hide', lk, null); }
    redrawRow(row);
  }
  function copyDefault(btn) {
    var row = btn.closest('[data-key]'), f = fieldByKey(row.getAttribute('data-key')); if (!f) return;
    var first = null;
    ['vi', 'en'].forEach(function (side) {
      var ta = $('textarea[data-side="' + side + '"]', row), d = defShown(f, side);
      if (ta && !ta.value.trim() && d != null) { ta.value = d; onTextInput(ta); }
      if (!first && ta) first = ta;
    });
    if (first) { first.focus(); try { first.setSelectionRange(first.value.length, first.value.length); } catch (e) { /* bỏ qua */ } }
  }

  // ═══ Danh sách (thêm / nhân bản / ẩn / xóa / đổi thứ tự mục) ══════════════
  function itemsOf(lkey) {
    var sp = splitKey(lkey), L = C.idx.list[sp.base]; if (!L) return null;
    var st = effGet('lists', lkey) || null, add = (st && st.add) || {};
    var order = st && Array.isArray(st.order) ? st.order.slice() : L.items.map(function (i) { return i.id; });
    function ctx(id) {
      var orig = L.items.filter(function (i) { return i.id === id; })[0];
      var from = orig ? id : (add[id] && String(add[id].from));
      var T = orig || L.items.filter(function (i) { return i.id === from; })[0];
      if (!T) return null;
      var ch = sp.chain + (orig ? '' : '@' + id), m = function (k) { return k + ch; };
      return { id: id, added: !orig, from: from, T: T, chain: ch, fields: T.fields.map(m), media: (T.media || []).map(m), icons: (T.icons || []).map(m),
        links: (T.links || []).map(m), lists: (T.lists || []).map(m), title: T.title ? T.title + ch : null, orig: L.items.indexOf(orig || T) };
    }
    return { L: L, key: lkey, chain: sp.chain, order: order, add: add, items: order.map(ctx).filter(Boolean),
      hidden: L.items.filter(function (i) { return order.indexOf(i.id) < 0; }).map(function (i) { return ctx(i.id); }) };
  }
  function writeList(lkey, order, add) {
    var L = C.idx.list[splitKey(lkey).base], clean = {};
    Object.keys(add || {}).forEach(function (id) { if (order.indexOf(id) >= 0) clean[id] = { from: String(add[id].from) }; });
    var isDef = !Object.keys(clean).length && order.join(',') === L.items.map(function (i) { return i.id; }).join(',');
    setPend('lists', lkey, isDef ? null : { order: order, add: clean });
  }
  function itemMatches(ctx) {
    return ctx.fields.some(function (k) { var f = fieldByKey(k); return f && matchField(f); }) ||
      ctx.lists.some(function (sk) { var info = itemsOf(sk); return !!info && info.items.some(itemMatches); });
  }
  function keysOf(ctx) { return ctx.fields.concat(ctx.media, ctx.icons, ctx.links); }
  function itemPending(ctx) {
    var ks = keysOf(ctx);
    if (ks.some(function (k) { return has(C.text.pending, k) || PGROUPS.some(function (g) { return has(C.pend[g], k); }); })) return true;
    return ctx.lists.some(function (sk) { if (has(C.pend.lists, sk)) return true; var info = itemsOf(sk); return !!info && info.items.some(itemPending); });
  }
  function itemTitle(ctx, n, noun) {
    var f = ctx.title && fieldByKey(ctx.title);
    if (f) { var v = plain(curVal(f, 'vi') || defShown(f, 'vi') || '').trim(); if (v) return trunc(v, 80); }
    return (noun || 'Mục') + ' ' + n;
  }
  function itemLocate(info, ctx, sec) {
    if (!chainSaved(ctx.chain)) return '';
    if (info.L.src === 'html') return locateUrl(info.key, sec, info.L.page, '&item=' + encodeURIComponent(ctx.id));
    var k = ctx.title || ctx.fields[0];
    return k ? locateUrl(k, sec, info.L.page) : '';
  }
  function listBlockHtml(lkey, sec, depth, f) {
    var info = itemsOf(lkey); if (!info) return '';
    var L = info.L, noun = L.item || 'Mục', nounL = noun.toLowerCase();
    var items = f ? info.items.filter(itemMatches) : info.items;
    var changed = has(C.pend.lists, lkey) ? C.pend.lists[lkey] != null : has(C.store.lists, lkey);
    return '<div class="cms-list' + (depth ? ' cms-list--sub' : '') + '" data-list="' + esc(lkey) + '" data-sec-id="' + esc(sec) + '" data-depth="' + depth + '">' +
      '<div class="cms-list__head"><p class="cms-list__title"><span class="cms-list__kind">Danh sách</span><span>' + esc(L.label) + '</span>' +
        '<span class="cms-list__n">' + esc(info.items.length) + ' ' + esc(nounL) + (info.hidden.length ? ' · ' + esc(info.hidden.length) + ' đang ẩn' : '') + '</span></p>' +
        (L.hint ? '<p class="field__hint">' + esc(L.hint) + '</p>' : '') +
        '<p class="field__hint">' + (f ? 'Đang lọc — chỉ hiện mục khớp. Tắt tìm kiếm để thêm, ẩn hoặc đổi thứ tự.' : 'Bấm vào từng ' + esc(nounL) + ' để sửa. Nút ↑ ↓ đổi thứ tự; “Nhân bản” tạo bản sao ngay bên dưới.') + '</p>' +
      '</div>' +
      (items.length ? '<ol class="cms-items">' + items.map(function (ctx) { return itemCardHtml(info, ctx, info.items.indexOf(ctx), sec, depth, f); }).join('') + '</ol>'
        : '<p class="mini-state">Danh sách đang trống' + (info.hidden.length ? ' — hiện lại mục đã ẩn bên dưới hoặc thêm mục mới.' : '.') + '</p>') +
      (!f && info.hidden.length ? '<div class="cms-list__hidden"><span class="field__hint">Mục đã ẩn — bấm để hiện lại:</span>' + info.hidden.map(function (ctx) {
        return '<button type="button" class="chip" data-item-show="' + esc(ctx.id) + '">' + ICON.plus + '<span>' + esc(itemTitle(ctx, ctx.orig + 1, noun)) + '</span></button>';
      }).join('') + '</div>' : '') +
      (!f ? '<div class="cms-list__foot"><button type="button" class="btn btn--line btn--sm" data-list-add>' + ICON.plus + '<span>Thêm ' + esc(nounL) + '</span></button>' +
        (changed ? '<button type="button" class="btn btn--quiet btn--sm" data-list-reset>Khôi phục danh sách gốc</button>' : '') + '</div>' : '') +
    '</div>';
  }
  function itemCardHtml(info, ctx, i, sec, depth, f) {
    var noun = info.L.item || 'Mục', okey = info.key + '#' + ctx.id;
    var open = f ? true : !!C.itemOpen[okey];
    var pend = itemPending(ctx), loc = itemLocate(info, ctx, sec), n = info.items.length;
    var fallback = noun + ' ' + (i + 1);
    return '<li class="cms-item' + (open ? ' is-open' : '') + (ctx.added ? ' is-new' : '') + (pend ? ' is-pending' : '') + '" data-item="' + esc(ctx.id) + '"' +
        (ctx.title ? ' data-title-key="' + esc(ctx.title) + '"' : '') + '>' +
      '<div class="cms-item__head">' +
        '<span class="cms-item__n" aria-hidden="true">' + (i + 1) + '</span>' +
        '<button type="button" class="cms-item__toggle" data-item-toggle aria-expanded="' + open + '">' +
          '<span class="cms-item__title" data-fallback="' + esc(fallback) + '">' + esc(itemTitle(ctx, i + 1, noun)) + '</span>' +
          '<span class="cms-item__flags">' + (ctx.added ? '<span class="badge badge--mid">Mục thêm mới</span>' : '') + '<span class="badge badge--done cms-item__pend">Chưa lưu</span></span></button>' +
        (f ? '' : '<span class="cms-item__tools">' +
          '<button type="button" class="icon-btn icon-btn--line" data-item-move="-1" aria-label="Đưa ' + esc(noun.toLowerCase()) + ' lên"' + (i === 0 ? ' disabled' : '') + '>' + UP + '</button>' +
          '<button type="button" class="icon-btn icon-btn--line" data-item-move="1" aria-label="Đưa ' + esc(noun.toLowerCase()) + ' xuống"' + (i === n - 1 ? ' disabled' : '') + '>' + DOWN + '</button>' +
          '<button type="button" class="btn btn--quiet btn--sm" data-item-dup title="Tạo bản sao ngay bên dưới">Nhân bản</button>' +
          (ctx.added ? '<button type="button" class="btn btn--quiet btn--sm" data-item-del title="Xóa mục thêm mới này">Xóa</button>'
            : '<button type="button" class="btn btn--quiet btn--sm" data-item-hide title="Ẩn khỏi trang — có thể hiện lại">Ẩn</button>') +
        '</span>') +
        (loc ? '<a class="cms-item__loc" href="' + esc(loc) + '" target="_blank" rel="noopener" title="Xem mục này trên trang" aria-label="Xem trên trang">↗</a>' : '') +
      '</div>' +
      '<div class="cms-item__body"' + (open ? '' : ' hidden') + '>' + (open ? itemBodyHtml(info, ctx, sec, depth) : '') + '</div></li>';
  }
  function itemBodyHtml(info, ctx, sec, depth) {
    var unsaved = !chainSaved(ctx.chain), h = '', withField = {};
    ctx.fields.forEach(function (k) {
      var f = fieldByKey(k); if (!f) return;
      h += rowHtml(f, { inItem: true, unsaved: unsaved });
      var lk = linkKeyFor(k); if (lk) withField[lk] = 1;
    });
    ctx.media.forEach(function (k) { h += itemMediaHtml(k); });
    ctx.icons.forEach(function (k) { h += itemIconHtml(k); });
    ctx.links.filter(function (lk) { return !withField[lk]; }).forEach(function (lk) { h += linkRowHtml(lk, { unsaved: unsaved }); });
    ctx.lists.forEach(function (sk) { h += listBlockHtml(sk, sec, depth + 1, false); });
    return h || '<p class="mini-state">Mục này không có chữ để sửa.</p>';
  }
  function itemMediaHtml(k) {
    var m = C.idx.media[splitKey(k).base]; if (!m) return '';
    var ov = effGet('media', k), url = A.safeImg(ov || m.url), isVid = m.kind === 'video', r = m.rec || {};
    var alt = effGet('alt', k);
    var pend = has(C.pend.media, k) || has(C.pend.alt, k) || has(C.pend.hide, k);
    return '<div class="cms-imed' + (pend ? ' is-pending' : '') + (isHidden(k) ? ' is-hidden' : '') + '" data-imkey="' + esc(k) + '">' +
      '<span class="cms-imed__thumb">' + (url ? (isVid ? '<video src="' + esc(url) + '" muted playsinline preload="metadata"></video>' : '<img src="' + esc(url) + '" alt="" loading="lazy">') : ICON.image) + '</span>' +
      '<div class="cms-imed__main">' +
        '<p class="cms-imed__label">' + esc(m.label || (isVid ? 'Video' : 'Ảnh')) + (ov ? ' <span class="badge badge--mid">Đã thay</span>' : '') + (pend ? ' <span class="badge badge--done">Chưa lưu</span>' : '') + '</p>' +
        (r.w && r.h ? '<p class="field__hint">Nên dùng ' + esc(num(r.w)) + ' × ' + esc(num(r.h)) + ' px' + (r.ratio ? ' (tỉ lệ ' + esc(r.ratio) + ')' : '') + (r.format ? ' · ' + esc(r.format) : '') + (r.maxKB ? ' · ≤ ' + esc(kb(r.maxKB)) : '') + '</p>' : '') +
        '<div class="cms-imed__act"><label class="btn btn--line btn--sm file-btn">' + ICON.upload + '<span data-imlabel>' + (isVid ? 'Đổi video' : 'Đổi ảnh') + '</span>' +
          '<input class="sr" type="file" accept="' + (isVid ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/gif') + '" data-imfile></label>' +
          (ov ? '<button type="button" class="btn btn--quiet btn--sm" data-imreset>Dùng lại ' + (isVid ? 'video' : 'ảnh') + ' gốc</button>' : '') +
          hideToggleHtml(k) + '</div>' +
        (isVid ? '' : '<label class="field cms-imed__alt"><span class="field__label">Mô tả ảnh — giúp Google và người khiếm thị hiểu ảnh</span>' +
          '<input type="text" maxlength="200" data-imalt value="' + esc(alt == null ? '' : alt) + '" placeholder="' + esc(m.alt || 'VD: Học viên tập đấm bao') + '"></label>') +
        '<div class="set-msg" data-imnote hidden></div>' +
      '</div></div>';
  }
  function itemIconHtml(k) {
    var ic = C.idx.icon[splitKey(k).base]; if (!ic) return '';
    var ov = effGet('icons', k), pend = has(C.pend.icons, k) || has(C.pend.hide, k), sz = iconSize(k);
    return '<div class="cms-iico' + (pend ? ' is-pending' : '') + (isHidden(k) ? ' is-hidden' : '') + '" data-ikey="' + esc(k) + '">' +
      '<span class="ico-chip ico-chip--dark" style="--sz:' + sz + 'px">' + iconMarkup(k) + '</span><span class="ico-chip" style="--sz:' + sz + 'px">' + iconMarkup(k) + '</span>' +
      '<div class="cms-iico__main"><p class="cms-imed__label">' + esc(ic.label || 'Icon') + (ov ? ' <span class="badge badge--mid">Đã thay</span>' : '') + '</p>' +
        '<div class="cms-imed__act"><button type="button" class="btn btn--line btn--sm" data-ipick>Đổi icon</button>' +
        (ov ? '<button type="button" class="btn btn--quiet btn--sm" data-ireset>Dùng icon gốc</button>' : '') + hideToggleHtml(k) + '</div></div></div>';
  }
  function redrawList(lkey) {
    var el = $('[data-list="' + CSS.escape(lkey) + '"]'); if (!el) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = listBlockHtml(lkey, el.getAttribute('data-sec-id'), +el.getAttribute('data-depth') || 0, false);
    var fresh = tmp.firstChild; el.parentNode.replaceChild(fresh, el);
    if (!AUTO_SIZE) $$('.cms-ta', fresh).forEach(autosize);
    refreshRowState(fresh, null);
    return fresh;
  }
  function redrawPart(el) {
    var k, tmp = document.createElement('div'), html = '';
    if ((k = el.getAttribute('data-imkey'))) html = itemMediaHtml(k);
    else if ((k = el.getAttribute('data-ikey'))) html = itemIconHtml(k);
    else if ((k = el.getAttribute('data-lkrow'))) html = linkRowHtml(k, { unsaved: !chainSaved(splitKey(k).chain) });
    if (!html) return el;
    tmp.innerHTML = html; var fresh = tmp.firstChild; el.parentNode.replaceChild(fresh, el);
    refreshRowState(fresh, null);
    return fresh;
  }
  // chép giá trị đang dùng của mục nguồn sang mục mới (mục mới mặc định lấy chữ gốc của mục mẫu, không lấy phần đã sửa)
  function copyText(src, dst) {
    var o = {}, st = C.store.text[src] || {}, pd = C.text.pending[src] || {};
    ['vi', 'en'].forEach(function (s) { var v = pd[s] !== undefined ? pd[s] : st[s]; if (v != null && v !== '') o[s] = v; });
    if (Object.keys(o).length) C.text.pending[dst] = o;
  }
  function copyG(g, src, dst) { var v = effGet(g, src); if (v != null) setPend(g, dst, clone(v)); }
  function copyItemValues(T, srcCh, dstCh) {
    T.fields.forEach(function (k) { copyText(k + srcCh, k + dstCh); copyG('hide', k + srcCh, k + dstCh); copyG('links', k + srcCh, k + dstCh); });
    (T.media || []).forEach(function (k) { ['media', 'alt', 'hide'].forEach(function (g) { copyG(g, k + srcCh, k + dstCh); }); });
    (T.icons || []).forEach(function (k) { ['icons', 'hide'].forEach(function (g) { copyG(g, k + srcCh, k + dstCh); }); });
    (T.links || []).forEach(function (k) { ['links', 'hide'].forEach(function (g) { copyG(g, k + srcCh, k + dstCh); }); });
    (T.lists || []).forEach(function (sk) {
      var st = effGet('lists', sk + srcCh), SL = C.idx.list[sk]; if (!SL) return;
      if (st) setPend('lists', sk + dstCh, clone(st));
      SL.items.forEach(function (it) { copyItemValues(it, srcCh, dstCh); });
      Object.keys((st && st.add) || {}).forEach(function (a) {
        var T2 = SL.items.filter(function (i) { return i.id === String(st.add[a].from); })[0];
        if (T2) copyItemValues(T2, srcCh + '@' + a, dstCh + '@' + a);
      });
    });
  }
  // bỏ thay đổi chờ lưu của một mục đã xóa (khóa có đuôi …@id)
  function dropPendingChain(chain) {
    var hit = function (k) { var c = splitKey(k).chain; return c === chain || c.indexOf(chain + '@') === 0; };
    Object.keys(C.text.pending).forEach(function (k) { if (hit(k)) delete C.text.pending[k]; });
    PGROUPS.forEach(function (g) { Object.keys(C.pend[g]).forEach(function (k) { if (hit(k)) delete C.pend[g][k]; }); });
  }
  function listAction(btn, kind) {
    var box = btn.closest('[data-list]'), lkey = box.getAttribute('data-list'), info = itemsOf(lkey); if (!info) return;
    var li = btn.closest('[data-item]'), id = li ? li.getAttribute('data-item') : btn.getAttribute('data-item-show');
    var order = info.order.slice(), add = clone(info.add) || {}, noun = (info.L.item || 'mục').toLowerCase(), focusId = id, focusSel = '';
    var ctx = info.items.filter(function (c) { return c.id === id; })[0];
    if (kind === 'move') {
      var at = order.indexOf(id), to = at + (+btn.getAttribute('data-item-move'));
      if (to < 0 || to >= order.length) return;
      order.splice(at, 1); order.splice(to, 0, id);
      focusSel = '[data-item-move="' + btn.getAttribute('data-item-move') + '"]';
    } else if (kind === 'hide') {
      order.splice(order.indexOf(id), 1); focusId = '';
    } else if (kind === 'show') {
      var oi = info.L.items.map(function (i) { return i.id; }).indexOf(id), pos = order.length;
      for (var j = 0; j < order.length; j++) { var oid = add[order[j]] ? String(add[order[j]].from) : order[j]; if (info.L.items.map(function (i) { return i.id; }).indexOf(oid) > oi) { pos = j; break; } }
      order.splice(pos, 0, id);
    } else if (kind === 'dup' || kind === 'add') {
      var src = kind === 'dup' ? ctx : info.items[info.items.length - 1];
      var nid = newId(), tpl;
      if (src) { tpl = src; add[nid] = { from: src.from }; }
      else { var first = info.L.items[0]; if (!first) return; tpl = null; add[nid] = { from: first.id }; }
      var at2 = src && kind === 'dup' ? order.indexOf(src.id) + 1 : order.length;
      order.splice(at2, 0, nid);
      writeList(lkey, order, add);
      if (tpl) copyItemValues(tpl.T, tpl.chain, info.chain + '@' + nid);
      C.itemOpen[lkey + '#' + nid] = true;
      var fresh = redrawList(lkey);
      var card = fresh && $('[data-item="' + CSS.escape(nid) + '"]', fresh);
      if (card) { var ta = $('textarea, input', card); (ta || card).focus && (ta || $('[data-item-toggle]', card)).focus(); card.scrollIntoView({ block: 'nearest' }); }
      A.toast(kind === 'dup' ? 'Đã nhân bản ' + noun + ' — sửa nội dung rồi bấm Lưu.' : 'Đã thêm ' + noun + ' mới — sửa nội dung rồi bấm Lưu.', 'info');
      return;
    } else if (kind === 'del') {
      order.splice(order.indexOf(id), 1); delete add[id];
      dropPendingChain(info.chain + '@' + id);
      focusId = '';
    }
    writeList(lkey, order, add);
    var fr = redrawList(lkey);
    var target = fr && focusId && $('[data-item="' + CSS.escape(focusId) + '"] ' + (focusSel || '[data-item-toggle]'), fr);
    if (target && !target.disabled) target.focus(); else if (fr) { var tg = $('[data-item-toggle]', fr) || $('[data-list-add]', fr); if (tg) tg.focus(); }
  }
  function toggleItem(btn) {
    var li = btn.closest('[data-item]'), box = li.closest('[data-list]'), lkey = box.getAttribute('data-list'), id = li.getAttribute('data-item');
    var body = li.querySelector(':scope > .cms-item__body'), open = btn.getAttribute('aria-expanded') !== 'true';
    if (open && !body.firstChild) {
      var info = itemsOf(lkey), ctx = info && info.items.filter(function (c) { return c.id === id; })[0];
      if (ctx) body.innerHTML = itemBodyHtml(info, ctx, box.getAttribute('data-sec-id'), +box.getAttribute('data-depth') || 0);
      if (!AUTO_SIZE) $$('.cms-ta', body).forEach(autosize);
    }
    body.hidden = !open; btn.setAttribute('aria-expanded', String(open)); li.classList.toggle('is-open', open);
    C.itemOpen[lkey + '#' + id] = open;
  }

  // ── đường dẫn, ẩn, ảnh & icon trong mục ──
  function onLinkInput(inp) {
    var box = inp.closest('[data-link-key]'), key = box.getAttribute('data-link-key'), v = inp.value.trim(), msg = $('[data-link-msg]', box), def = linkDefault(key);
    if (!v || v === def) { setPend('links', key, null); inp.classList.remove('is-invalid'); msg.classList.remove('is-err'); msg.innerHTML = linkHint(def); }
    else if (HREF_RE.test(v)) { setPend('links', key, v); inp.classList.remove('is-invalid'); msg.classList.remove('is-err'); msg.innerHTML = linkHint(def); }
    else { inp.classList.add('is-invalid'); msg.classList.add('is-err'); msg.textContent = 'Đường dẫn chưa đúng — dùng dạng /trang, /trang#khu-vuc, https://…, tel:… hoặc mailto:…'; return; }
    afterChange(box);
  }
  function afterChange(el) {
    var row = el.closest('[data-key]');
    if (row) { refreshRowState(row, fieldByKey(row.getAttribute('data-key'))); return; }
    var part = el.closest('[data-lkrow], [data-imkey], [data-ikey]');
    if (part) {
      var k = part.getAttribute('data-lkrow') || part.getAttribute('data-imkey') || part.getAttribute('data-ikey');
      var p = PGROUPS.some(function (g) { return has(C.pend[g], k); });
      part.classList.toggle('is-pending', p);
      part.classList.toggle('is-hidden', isHidden(k));
    }
    refreshRowState(el, null);
    var cb = C.screens[A.view()]; if (cb && cb.changed) cb.changed(el);
  }
  function onItemMedia(input) {
    var box = input.closest('[data-imkey]'), k = box.getAttribute('data-imkey'), m = C.idx.media[splitKey(k).base];
    var file = input.files && input.files[0]; input.value = '';
    if (!m || !file) return;
    var isVid = m.kind === 'video', note = $('[data-imnote]', box);
    var say = function (t, err) { note.textContent = t; note.hidden = !t; note.classList.toggle('is-err', !!err); };
    if (!(isVid ? VID_RE : IMG_RE).test(file.type)) { say(isVid ? 'Chỉ nhận video MP4 hoặc WEBM.' : 'Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF.', true); return; }
    if (file.size > (isVid ? MAX_VID : MAX_IMG)) { say(isVid ? 'Video tối đa 80MB.' : 'Ảnh tối đa 10MB — hãy nén ảnh rồi thử lại.', true); return; }
    var lbl = $('[data-imlabel]', box), fb = input.closest('.file-btn');
    fb.classList.add('is-busy'); input.disabled = true;
    var warn = [];
    probe(file, m.kind).then(function (d) {
      warn = checkLines(m, d, file.size);
      return uploadFile(file, function (p) { lbl.textContent = 'Đang tải ' + Math.round(p * 100) + '%'; });
    }).then(function (r) {
      var url = A.safeImg(r.url); if (!url) throw { message: 'Máy chủ trả về đường dẫn không hợp lệ.' };
      setPend('media', k, url);
      var fresh = redrawPart(box);
      var n2 = $('[data-imnote]', fresh);
      if (n2) { n2.textContent = ['Đã tải lên — bấm “Lưu” để áp dụng.'].concat(warn).join(' '); n2.hidden = false; }
    }, function (e) {
      fb.classList.remove('is-busy'); input.disabled = false; lbl.textContent = isVid ? 'Đổi video' : 'Đổi ảnh';
      if (e && e.status !== 401) say((e && e.message) || 'Tải lên thất bại.', true);
    });
  }
  function pickIcon(btn) {
    var box = btn.closest('[data-ikey]'), k = box.getAttribute('data-ikey');
    if (!A.cms.iconPicker) return;
    A.cms.iconPicker({ title: (C.idx.icon[splitKey(k).base] || {}).label }).then(function (v) {
      if (!v) return;
      setPend('icons', k, v);
      var fresh = redrawPart(box); var b = fresh && $('[data-ipick]', fresh); if (b) b.focus();
    });
  }

  // ── lưu / hủy tất cả thay đổi chờ ──
  function saveAll(btn) {
    var n = pendCount(); if (!n) return;
    var body = {}, tk = Object.keys(C.text.pending);
    if (tk.length) { body.text = {}; tk.forEach(function (k) { body.text[k] = Object.assign({}, C.text.pending[k]); }); }
    PGROUPS.forEach(function (g) { var ks = Object.keys(C.pend[g]); if (!ks.length) return; body[g] = {}; ks.forEach(function (k) { body[g][k] = clone(C.pend[g][k]); }); });
    if (body.code) Object.keys(body.code).forEach(function (k) { if (body.code[k] == null) body.code[k] = ''; });
    var view = A.view(), cb = C.screens[view] || {};
    var href = view === 'cms-text' ? pageUrl(C.text.tab) : (cb.link ? cb.link() : '/');
    busy(btn, true);
    A.api('/cms', { method: 'PUT', body: body }).then(function (store) {
      setStore(store); clearPending(); busy(btn, false);
      rerenderCurrent();
      A.toast('Đã lưu ' + n + ' thay đổi — website cập nhật ngay.', 'ok', { href: safePath(href) || '/', label: 'Xem trang ↗' });
      var wait = tk.filter(function (k) { var o = store.text && store.text[k]; return o && o.vi && !o.en; });
      if (wait.length && C.ai && C.ai.enabled) awaitTranslations(wait, 0);
    }, function (e) { busy(btn, false); A.apiFail(e); });
  }
  // AI dịch nền trên máy chủ → hỏi lại vài lần, cập nhật ô English của những chữ vừa dịch xong
  function awaitTranslations(keys, round) {
    if (round > 10) return;
    setTimeout(function () {
      A.api('/cms').then(function (store) {
        var left = [];
        keys.forEach(function (k) {
          var o = store.text && store.text[k];
          if (!o || !o.vi) return;
          if (!o.en) { left.push(k); return; }
          C.store.text[k] = o;
          var row = document.querySelector('.cms-row[data-key="' + (window.CSS && CSS.escape ? CSS.escape(k) : k) + '"]');
          if (row && !C.text.pending[k]) redrawRow(row);
        });
        if (left.length) awaitTranslations(left, round + 1);
      }, function () { /* thử lại ở lần sau */ });
    }, round ? 4000 : 2500);
  }
  function discardAll() {
    var n = pendCount(); if (!n) return;
    A.confirmDialog({ title: 'Bỏ ' + n + ' thay đổi chưa lưu?', body: 'Mọi thứ sẽ trở lại như lần lưu gần nhất.', ok: 'Bỏ thay đổi', cancel: 'Quay lại' }).then(function (yes) {
      if (!yes) return;
      clearPending(); rerenderCurrent();
    });
  }
  function rerenderCurrent() {
    var v = A.view();
    if (v === 'cms-text') { renderTextTabs(); renderTextList(); refreshBar(); return; }
    var cb = C.screens[v]; if (cb && cb.render) cb.render(); else refreshBar();
  }

  // ═══ 2. Hình ảnh & video ═══════════════════════════════════════════════════
  function mediaUrl(m) { return A.safeImg(C.store.media[m.key] || m.url); }
  function mediaPages() { return C.idx.pages.filter(function (p) { return (C.idx.pageMedia[p.id] || []).length; }); }

  function mediaMount(main, sub) {
    main.innerHTML = A.pageHead('Hình ảnh & video', { eyebrow: 'Nội dung website', stamp: false, count: false }) + '<div data-cms-root></div>';
    mediaRoute(main, sub, true);
  }
  function mediaRoute(main, sub, first) {
    var root = $('[data-cms-root]', main); if (!root) return;
    if (!ready()) {
      root.innerHTML = stateHtml();
      if (!C.loading && first !== 'after') load().then(function () { if (A.view() === 'cms-media') mediaRoute(main, sub, 'after'); });
      return;
    }
    var pages = mediaPages();
    C.media.tab = pages.some(function (p) { return p.id === sub; }) ? sub : (C.media.tab || (pages[0] && pages[0].id) || '');
    root.innerHTML =
      '<div class="cms-help"><p><strong>Ảnh sản phẩm thay ở mục <a href="#/products">Sản phẩm</a>.</strong> ' +
      'Mỗi ô dưới đây ghi rõ kích thước nên dùng. Ảnh/video mới áp dụng ngay sau khi tải lên — “Khôi phục mặc định” để quay về file gốc.</p></div>' +
      tabsHtml('cms-media', pages, C.media.tab, function (p) {
        var n = (C.idx.pageMedia[p.id] || []).length, ed = editedMedia(p.id);
        return esc(n) + ' ảnh/video' + (ed ? ' · ' + esc(ed) + ' đã thay' : '');
      }) +
      '<div data-cms-media></div>';
    renderMediaList();
    if (first !== true && first !== 'after') window.scrollTo(0, 0);
  }
  function renderMediaList() {
    var box = $('[data-cms-media]'); if (!box) return;
    var list = C.idx.pageMedia[C.media.tab] || [];
    if (!list.length) { box.innerHTML = A.emptyHtml('Trang này không có ảnh/video để thay', ''); return; }
    var groups = [], by = {};
    list.forEach(function (m) {
      var g = by[m.section];
      if (!g) { g = by[m.section] = { id: m.section, items: [] }; groups.push(g); }
      g.items.push(m);
    });
    box.innerHTML = groups.map(function (g) {
      var s = C.idx.sec[g.id];
      var labels = [];
      g.items.forEach(function (m) { (m.sections && m.sections.length ? m.sections : [m.section]).forEach(function (id) { var sx = C.idx.sec[id]; var l = sx ? sx.label : id; if (labels.indexOf(l) < 0) labels.push(l); }); });
      return '<section class="cms-mgroup"><header class="cms-mgroup__head"><h2 class="cms-mgroup__title">' + esc(labels.join(' · ') || (s ? s.label : g.id)) + '</h2>' +
        '<span class="cms-sec__meta">' + esc(g.items.length) + ' ảnh/video</span>' +
        '<a class="cms-sec__link" href="' + esc(pageUrl(C.media.tab)) + '" target="_blank" rel="noopener">Xem trang ↗</a></header>' +
        '<div class="cms-mgrid">' + g.items.map(mediaCard).join('') + '</div></section>';
    }).join('');
  }
  function mediaCard(m) {
    var r = m.rec || {}, over = C.store.media[m.key], url = mediaUrl(m), isVid = m.kind === 'video';
    var w = Math.round(Number(r.w)) || 4, h = Math.round(Number(r.h)) || 3;
    var preview = !url ? '<span class="pimg__empty">' + ICON.image + '<span>Không có file</span></span>' : isVid
      ? '<video src="' + esc(url) + '" muted playsinline controls preload="metadata" data-probe></video>'
      : '<img src="' + esc(url) + '" alt="' + esc(m.alt || m.label || '') + '" loading="lazy" data-probe>';
    var shown = [];
    if (m.box && dims(m.box.desktop)) shown.push('máy tính ' + dims(m.box.desktop));
    if (m.box && dims(m.box.mobile)) shown.push('điện thoại ' + dims(m.box.mobile));
    var note = C.media.notes[m.key];
    var spec = '<dl class="cms-spec">' +
      (r.w && r.h ? '<div><dt>Kích thước gợi ý</dt><dd><strong>' + esc(num(r.w)) + ' × ' + esc(num(r.h)) + ' px</strong>' + (r.ratio ? ' (tỉ lệ ' + esc(r.ratio) + ')' : '') + '</dd></div>' : '') +
      (r.format || r.maxKB ? '<div><dt>Định dạng</dt><dd>' + esc(r.format || '') + (r.maxKB ? ' · Dung lượng: ≤ ' + esc(kb(r.maxKB)) : '') + '</dd></div>' : '') +
      (shown.length ? '<div><dt>Đang hiển thị</dt><dd>' + esc(shown.join(' · ')) + '</dd></div>' : '') +
      '<div><dt>File hiện tại</dt><dd data-natural>' + esc(!over && dims(m.natural) ? dims(m.natural) : 'đang đo…') + '</dd></div>' +
      '</dl>' +
      (r.cover ? '<p class="cms-cover">' + (isVid ? 'Video' : 'Ảnh') + ' được cắt tràn khung — đặt chủ thể ở giữa.</p>' : '');
    return '<article class="cms-mcard' + (over ? ' is-over' : '') + '" data-mkey="' + esc(m.key) + '">' +
      '<div class="cms-mcard__preview" style="aspect-ratio:' + w + ' / ' + h + '">' + preview +
        (over ? '<span class="badge badge--done cms-mcard__flag">Đã thay</span>' : '') + '</div>' +
      '<div class="cms-mcard__body">' +
        '<h3 class="cms-mcard__title">' + esc(m.label || m.key) + (m.hidden ? ' <span class="tag tag--muted">Đang ẩn</span>' : '') + '</h3>' +
        '<p class="cms-mcard__key">' + esc(m.key) + '</p>' + spec +
        '<div class="cms-mnote' + (note && note.err ? ' is-err' : '') + '" data-mnote' + (note && note.lines.length ? '' : ' hidden') + '>' +
          (note ? note.lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') : '') + '</div>' +
        '<div class="cms-mprog" data-mprog hidden><span data-mprog-bar></span><em data-mprog-text></em></div>' +
        '<div class="cms-mactions">' +
          '<label class="btn btn--line file-btn">' + ICON.upload + '<span data-mfile-label>' + (isVid ? 'Tải video mới' : 'Tải ảnh mới') + '</span>' +
            '<input class="sr" type="file" accept="' + (isVid ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/gif') + '" data-mfile></label>' +
          '<button class="btn btn--ghost" type="button" data-mlink-toggle aria-expanded="false">Dán link</button>' +
          (over ? '<button class="btn btn--quiet" type="button" data-mreset>Khôi phục mặc định</button>' : '') +
        '</div>' +
        '<div class="cms-mlink" data-mlink hidden>' +
          '<label class="sr" for="ml-' + esc(slug(m.key)) + '">Link ' + (isVid ? 'video' : 'ảnh') + '</label>' +
          '<input type="url" id="ml-' + esc(slug(m.key)) + '" data-mlink-input placeholder="https://…" inputmode="url" spellcheck="false" autocomplete="off">' +
          '<button class="btn btn--primary btn--sm" type="button" data-mlink-apply>Áp dụng</button>' +
        '</div>' +
      '</div></article>';
  }
  function redrawCard(key) {
    var card = $('[data-mkey="' + CSS.escape(key) + '"]'), m = C.idx.media[key];
    if (!card || !m) return;
    var tmp = document.createElement('div'); tmp.innerHTML = mediaCard(m);
    card.parentNode.replaceChild(tmp.firstChild, card);
  }
  function setNote(key, lines, err) { C.media.notes[key] = { lines: lines, err: !!err }; var card = $('[data-mkey="' + CSS.escape(key) + '"]'); if (!card) return;
    var n = $('[data-mnote]', card); n.innerHTML = lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join(''); n.hidden = !lines.length; n.classList.toggle('is-err', !!err); }
  function checkLines(m, d, size) {
    var r = m.rec || {}, out = [], word = m.kind === 'video' ? 'Video' : 'Ảnh';
    if (d && r.w && d[0] < r.w * 0.7) out.push('⚠ ' + word + ' nhỏ hơn gợi ý (' + num(d[0]) + ' × ' + num(d[1]) + ' px so với ' + num(r.w) + ' × ' + num(r.h) + ' px), có thể bị mờ.');
    if (d && r.w && r.h) { var R = r.w / r.h, x = d[0] / d[1]; if (Math.abs(x - R) / R > 0.10) out.push('⚠ Khác tỉ lệ — ' + word.toLowerCase() + ' sẽ bị cắt bớt (file ' + (Math.round(x * 100) / 100).toLocaleString('vi-VN') + ':1, khung ' + (r.ratio || '') + ').'); }
    if (size && r.maxKB && size > r.maxKB * 1024) out.push('⚠ Dung lượng lớn (' + bytes(size) + ' so với gợi ý ≤ ' + kb(r.maxKB) + '), trang sẽ tải chậm — nên nén lại.');
    return out;
  }
  function probe(src, kind) {
    return new Promise(function (resolve) {
      var url = typeof src === 'string' ? src : URL.createObjectURL(src);
      var fin = function (w, h) { clearTimeout(t); if (typeof src !== 'string') URL.revokeObjectURL(url); resolve(w && h ? [w, h] : null); };
      var t = setTimeout(function () { fin(0, 0); }, 10000);
      if (kind === 'video') {
        var v = document.createElement('video'); v.preload = 'metadata'; v.muted = true;
        v.onloadedmetadata = function () { fin(v.videoWidth, v.videoHeight); };
        v.onerror = function () { fin(0, 0); };
        v.src = url;
      } else {
        var i = new Image();
        i.onload = function () { fin(i.naturalWidth, i.naturalHeight); };
        i.onerror = function () { fin(0, 0); };
        i.src = url;
      }
    });
  }
  // tải file nhị phân (XHR để có % tiến độ)
  function uploadFile(file, onProgress) {
    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();
      x.open('POST', '/api/uploads/file');
      x.setRequestHeader('Authorization', 'Bearer ' + A.token());
      x.setRequestHeader('Content-Type', file.type);
      x.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(e.loaded / e.total); };
      x.onload = function () {
        var d = null; try { d = JSON.parse(x.responseText); } catch (e) { /* bỏ qua */ }
        if (x.status === 401) { A.sessionExpired(); reject({ status: 401, message: 'Phiên đăng nhập đã hết hạn.' }); return; }
        if (x.status >= 200 && x.status < 300 && d && d.url) resolve(d);
        else reject({ status: x.status, message: (d && d.error) || ('Tải lên thất bại (mã ' + x.status + ').') });
      };
      x.onerror = function () { reject({ status: 0, message: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' }); };
      x.send(file);
    });
  }
  function progress(card, p) {
    var box = $('[data-mprog]', card); if (!box) return;
    box.hidden = p == null;
    if (p != null) { $('[data-mprog-bar]', box).style.width = Math.round(p * 100) + '%'; $('[data-mprog-text]', box).textContent = 'Đang tải lên ' + Math.round(p * 100) + '%'; }
  }
  function setMedia(m, url, okMsg, extra) {
    var patch = { media: {} }; patch.media[m.key] = url;
    return A.api('/cms', { method: 'PUT', body: patch }).then(function (store) {
      setStore(store);
      if (url !== null && store.media[m.key] !== url) throw { status: 400, message: 'Máy chủ không nhận đường dẫn này (chỉ nhận https://… hoặc file đã tải lên).' };
      redrawCard(m.key);
      renderMediaTabsMeta();
      A.toast(okMsg, 'ok', { href: pageUrl(m.page), label: 'Xem trang ↗' });
      return extra;
    });
  }
  function renderMediaTabsMeta() {
    var root = $('[data-cms-root]'); if (!root || A.view() !== 'cms-media') return;
    var nav = $('.cms-tabs', root); if (!nav) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = tabsHtml('cms-media', mediaPages(), C.media.tab, function (p) {
      var n = (C.idx.pageMedia[p.id] || []).length, ed = editedMedia(p.id);
      return esc(n) + ' ảnh/video' + (ed ? ' · ' + esc(ed) + ' đã thay' : '');
    });
    nav.parentNode.replaceChild(tmp.firstChild, nav);
  }
  function onMediaFile(input) {
    var card = input.closest('[data-mkey]'), m = card && C.idx.media[card.getAttribute('data-mkey')];
    var file = input.files && input.files[0];
    input.value = '';
    if (!m || !file) return;
    var isVid = m.kind === 'video';
    if (!(isVid ? VID_RE : IMG_RE).test(file.type)) { setNote(m.key, [isVid ? 'Chỉ nhận video MP4 hoặc WEBM.' : 'Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF.'], true); return; }
    if (file.size > (isVid ? MAX_VID : MAX_IMG)) { setNote(m.key, [isVid ? 'Video tối đa 80MB — vui lòng nén lại rồi thử lại.' : 'Ảnh tối đa 10MB — vui lòng nén lại rồi thử lại.'], true); return; }
    var label = $('[data-mfile-label]', card), btn = input.closest('.file-btn');
    btn.classList.add('is-busy'); input.disabled = true; label.textContent = 'Đang xử lý…';
    var lines = [];
    probe(file, m.kind).then(function (d) {
      lines = ['File đã chọn: ' + (d ? num(d[0]) + ' × ' + num(d[1]) + ' px · ' : '') + bytes(file.size)].concat(checkLines(m, d, file.size));
      setNote(m.key, lines.concat(['Đang tải lên…']));
      progress(card, 0);
      return uploadFile(file, function (p) { progress(card, p); });
    }).then(function (res) {
      return setMedia(m, res.url, 'Đã thay “' + (m.label || m.key) + '” — website cập nhật ngay.');
    }).then(function () {
      C.media.notes[m.key] = { lines: lines, err: false };
      var c2 = $('[data-mkey="' + CSS.escape(m.key) + '"]'); if (c2) setNote(m.key, lines);
    }, function (e) {
      setNote(m.key, lines.concat([(e && e.message) || 'Tải lên thất bại.']), true);
      var c3 = $('[data-mkey="' + CSS.escape(m.key) + '"]');
      if (c3) { progress(c3, null); var b3 = $('.file-btn', c3); if (b3) b3.classList.remove('is-busy'); var i3 = $('[data-mfile]', c3); if (i3) i3.disabled = false; var l3 = $('[data-mfile-label]', c3); if (l3) l3.textContent = isVid ? 'Tải video mới' : 'Tải ảnh mới'; }
      if (e && e.status !== 401 && e.status !== 403) A.toast((e && e.message) || 'Tải lên thất bại', 'err');
    });
  }
  function applyLink(btn) {
    var card = btn.closest('[data-mkey]'), m = C.idx.media[card.getAttribute('data-mkey')];
    var input = $('[data-mlink-input]', card), v = input.value.trim();
    if (!/^https:\/\/[^\s"'<>`]+$/.test(v) && !/^\/assets\/(uploads|media)\/[\w.-]+$/.test(v)) {
      input.classList.add('is-invalid'); input.focus();
      setNote(m.key, ['Link phải bắt đầu bằng https:// (hoặc /assets/uploads/… của file đã tải lên).'], true);
      return;
    }
    busy(btn, true);
    C.media.check[m.key] = true; // đo kích thước khi ảnh xem trước tải xong
    setMedia(m, v, 'Đã đổi “' + (m.label || m.key) + '” sang link mới — website cập nhật ngay.').then(function () {
      setNote(m.key, []);
    }, function (e) { busy(btn, false); setNote(m.key, [(e && e.message) || 'Không lưu được link.'], true); A.apiFail(e); });
  }
  function resetMedia(btn) {
    var card = btn.closest('[data-mkey]'), m = C.idx.media[card.getAttribute('data-mkey')];
    A.confirmDialog({ title: 'Khôi phục ' + (m.kind === 'video' ? 'video' : 'ảnh') + ' gốc?', body: '“' + (m.label || m.key) + '” sẽ quay về file mặc định của website.', ok: 'Khôi phục', cancel: 'Quay lại' }).then(function (yes) {
      if (!yes) return;
      busy(btn, true);
      delete C.media.notes[m.key];
      setMedia(m, null, 'Đã khôi phục “' + (m.label || m.key) + '”.').catch(function (e) { busy(btn, false); A.apiFail(e); });
    });
  }
  // đo kích thước thật của file đang hiển thị
  document.addEventListener('load', onProbe, true);
  document.addEventListener('loadedmetadata', onProbe, true);
  function onProbe(e) {
    var t = e.target;
    if (!t || !t.hasAttribute || !t.hasAttribute('data-probe')) return;
    var card = t.closest('[data-mkey]'); if (!card) return;
    var w = t.tagName === 'VIDEO' ? t.videoWidth : t.naturalWidth, h = t.tagName === 'VIDEO' ? t.videoHeight : t.naturalHeight;
    var dd = $('[data-natural]', card); if (dd && w && h) dd.textContent = num(w) + ' × ' + num(h) + ' px';
    var key = card.getAttribute('data-mkey'), m = C.idx && C.idx.media[key];
    if (m && C.media.check[key] && w && h) { delete C.media.check[key]; var l = checkLines(m, [w, h], 0); setNote(key, l.length ? l : ['Link mới: ' + num(w) + ' × ' + num(h) + ' px — kích thước ổn.']); }
  }
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || !t.hasAttribute || !t.hasAttribute('data-probe')) return;
    var card = t.closest('[data-mkey]'); if (!card) return;
    var dd = $('[data-natural]', card); if (dd) dd.textContent = 'không mở được file';
    var key = card.getAttribute('data-mkey');
    if (C.media.check[key]) { delete C.media.check[key]; setNote(key, ['⚠ Không mở được link này — kiểm tra lại đường dẫn.'], true); }
  }, true);

  // ═══ 3. Màu sắc (4 màu thương hiệu + bảng màu chi tiết) ═══════════════════
  var PAL_GROUPS = [['neutral', 'Trắng – đen – xám'], ['warm', 'Đỏ – cam'], ['other', 'Màu khác']];
  function colorDefs() { return (C.cat && C.cat.colors) || []; }
  function colorDef(key) { return colorDefs().filter(function (c) { return c.key === key; })[0]; }
  function palDefs() { return (C.cat && C.cat.palette) || []; }
  function darker(hex) { return '#' + [1, 3, 5].map(function (i) { return Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.87).toString(16).padStart(2, '0'); }).join('').toUpperCase(); }
  function initColors() {
    var d = {}; colorDefs().forEach(function (c) { d[c.key] = C.store.colors[c.key] ? String(C.store.colors[c.key]).toUpperCase() : null; }); C.colors.draft = d;
    var p = {}; Object.keys(C.store.palette || {}).forEach(function (k) { p[k.toUpperCase()] = String(C.store.palette[k]).toUpperCase(); }); C.colors.pal = p;
  }
  // màu đang áp dụng (null = mặc định; màu rê chuột chưa chọn riêng → tự tối đi từ màu nhấn)
  function colorVal(key) {
    var d = C.colors.draft || {}, def = colorDef(key);
    if (d[key]) return d[key];
    if (key === 'accentHover' && d.accent) return darker(d.accent);
    return def ? String(def.def).toUpperCase() : '#000000';
  }
  function palSaved(hex) { var v = (C.store.palette || {})[hex]; return v ? String(v).toUpperCase() : null; }
  function palVal(hex) { return (C.colors.pal && C.colors.pal[hex]) || hex; }
  function palChanged() { return palDefs().filter(function (p) { return ((C.colors.pal || {})[p.hex] || null) !== palSaved(p.hex); }).length; }
  function colorsDirty() {
    if (!C.colors.draft) return 0;
    return colorDefs().filter(function (c) { return (C.colors.draft[c.key] || null) !== (C.store.colors[c.key] ? String(C.store.colors[c.key]).toUpperCase() : null); }).length + palChanged();
  }
  function lum(hex) {
    var c = [1, 3, 5].map(function (i) { var v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function ratioTxt(r) { return (Math.round(r * 10) / 10).toLocaleString('vi-VN') + ':1'; }

  function colorsMount(main) {
    main.innerHTML = A.pageHead('Màu sắc', { eyebrow: 'Nội dung website', stamp: false, count: false }) + '<div data-cms-root></div>';
    colorsRender(main, true);
  }
  function colorsRender(main, first) {
    var root = $('[data-cms-root]', main); if (!root) return;
    if (!ready()) {
      root.innerHTML = stateHtml();
      if (!C.loading && first !== 'after') load().then(function () { if (A.view() === 'cms-colors') colorsRender(main, 'after'); });
      return;
    }
    if (!C.colors.draft) initColors();
    root.innerHTML =
      '<div class="cms-help"><p><strong>Màu áp dụng cho toàn bộ 4 trang</strong> (Trang chủ, Shop, Khóa học, Dịch vụ Setup). Đổi màu ở đây rồi bấm “Lưu” — xem trước ở khung bên cạnh.</p></div>' +
      '<div class="cms-colors">' +
        '<div class="cms-colors__list">' + colorDefs().map(colorRowHtml).join('') + '</div>' +
        '<aside class="cms-preview" data-preview aria-label="Xem trước màu">' +
          '<p class="cms-preview__label">Xem trước</p>' +
          '<div class="pv-light"><p class="pv-eyebrow"><span aria-hidden="true"></span>Khóa học Boxing</p>' +
            '<p class="pv-title">Tập đúng kỹ thuật, <em>tiến bộ</em> từng buổi.</p>' +
            '<div class="pv-btns"><span class="pv-btn">Đăng ký ngay</span><span class="pv-btn pv-btn--hover">Khi rê chuột</span></div></div>' +
          '<div class="pv-dark"><p class="pv-dark__title">Khối nền tối, chữ trắng</p><p>Lịch tập linh hoạt — sáng, chiều và tối mỗi ngày.</p><span class="pv-btn">Nhận tư vấn</span></div>' +
          '<div class="pv-white"><p><strong>Chữ chính trên nền trắng.</strong> Đoạn văn dùng màu đen chủ đạo.</p></div>' +
          '<div class="cms-contrast" data-contrast></div>' +
        '</aside>' +
      '</div>' +
      (palDefs().length ? '<section class="panel pal" aria-labelledby="palTitle">' +
        '<header class="panel__head"><h2 class="panel__title" id="palTitle">Bảng màu chi tiết</h2><span class="cms-sec__meta" data-pal-count></span></header>' +
        '<div class="pal__body">' +
          '<p class="cms-warnline">' + ICON.warn + '<span>Đổi màu ở đây áp cho mọi chỗ dùng đúng mã màu đó trên toàn web.</span></p>' +
          '<p class="set-note">Mỗi dòng là một mã màu đang có trên website (trừ 4 màu thương hiệu ở trên). Chọn màu mới bằng ô màu hoặc gõ mã HEX.</p>' +
          '<label class="search pal__search">' + ICON.search + '<span class="sr">Tìm mã màu</span><input type="search" data-pal-search placeholder="Tìm mã màu, vd 8A8A8A" autocomplete="off" spellcheck="false" value="' + esc(C.colors.q) + '"></label>' +
          PAL_GROUPS.map(function (g) {
            var rows = palDefs().filter(function (p) { return (p.group || 'other') === g[0]; });
            return rows.length ? '<div class="pal__group" data-pal-group><h3 class="pal__gtitle">' + esc(g[1]) + ' <span class="cms-sec__meta">' + rows.length + ' màu</span></h3>' + rows.map(palRowHtml).join('') + '</div>' : '';
          }).join('') +
          '<p class="mini-state" data-pal-empty hidden>Không có mã màu nào khớp.</p>' +
        '</div></section>' : '') +
      savebarHtml('colors');
    updateColorsUi();
    filterPalette();
  }
  function colorRowHtml(c) {
    var v = colorVal(c.key);
    return '<div class="cms-color" data-ckey="' + esc(c.key) + '">' +
      '<span class="cms-color__sw" data-csw aria-hidden="true"></span>' +
      '<div class="cms-color__main">' +
        '<p class="cms-color__label">' + esc(c.label) + '</p>' +
        '<div class="cms-color__inputs">' +
          '<label class="crow__pick"><span class="sr">Chọn màu: ' + esc(c.label) + '</span><input type="color" value="' + esc(v.toLowerCase()) + '" data-cpick></label>' +
          '<label class="cms-color__hex"><span class="sr">Mã HEX: ' + esc(c.label) + '</span><input type="text" value="' + esc(v) + '" maxlength="7" spellcheck="false" autocomplete="off" data-chex></label>' +
          '<button class="btn btn--quiet btn--sm" type="button" data-creset>Khôi phục</button>' +
        '</div>' +
        '<p class="field__hint" data-cmeta></p>' +
      '</div></div>';
  }
  function pageNames(ids) { return (ids || []).map(function (id) { var p = C.idx.page[id]; return p ? p.label : id; }).join(', '); }
  function palRowHtml(p) {
    var hex = A.safeHex(p.hex, '#000000').toUpperCase(), v = palVal(hex);
    return '<div class="pal__row" data-pal="' + esc(hex) + '">' +
      '<span class="pal__sw" data-pal-sw aria-hidden="true"></span>' +
      '<span class="pal__info"><span class="pal__hex"><span class="pal__orig" style="background:' + hex + '" aria-hidden="true"></span>' + esc(hex) + '<span class="pal__arrow" data-pal-arrow hidden>→ <b data-pal-new></b></span></span>' +
        '<span class="pal__use">dùng ' + esc(num(p.n)) + ' lần · ' + esc(pageNames(p.pages)) + '</span></span>' +
      '<span class="pal__inputs"><label class="crow__pick"><span class="sr">Màu mới cho ' + esc(hex) + '</span><input type="color" value="' + esc(v.toLowerCase()) + '" data-pal-pick></label>' +
        '<label class="cms-color__hex"><span class="sr">Mã HEX mới cho ' + esc(hex) + '</span><input type="text" value="' + esc(v) + '" maxlength="7" spellcheck="false" autocomplete="off" data-pal-hex></label>' +
        '<button class="btn btn--quiet btn--sm" type="button" data-pal-reset>Khôi phục</button></span>' +
      '</div>';
  }
  function updatePalRow(row) {
    var hex = row.getAttribute('data-pal'), v = palVal(hex), changed = v !== hex, saved = palSaved(hex), draft = (C.colors.pal || {})[hex] || null;
    $('[data-pal-sw]', row).style.background = v;
    var pick = $('[data-pal-pick]', row), tx = $('[data-pal-hex]', row);
    if (pick.value.toLowerCase() !== v.toLowerCase()) pick.value = v.toLowerCase();
    if (document.activeElement !== tx) { tx.value = v; tx.classList.remove('is-invalid'); }
    $('[data-pal-arrow]', row).hidden = !changed; $('[data-pal-new]', row).textContent = v;
    row.classList.toggle('is-changed', changed);
    row.classList.toggle('is-pending', draft !== saved);
    $('[data-pal-reset]', row).hidden = !changed;
  }
  function updateColorsUi() {
    var root = $('[data-cms-root]'); if (!root || A.view() !== 'cms-colors') return;
    colorDefs().forEach(function (c) {
      var row = $('[data-ckey="' + CSS.escape(c.key) + '"]', root); if (!row) return;
      var v = colorVal(c.key);
      $('[data-csw]', row).style.background = v;
      var pick = $('[data-cpick]', row), hex = $('[data-chex]', row);
      if (pick.value.toLowerCase() !== v.toLowerCase()) pick.value = v.toLowerCase();
      if (document.activeElement !== hex) { hex.value = v; hex.classList.remove('is-invalid'); }
      var saved = C.store.colors[c.key] ? String(C.store.colors[c.key]).toUpperCase() : null;
      var draft = C.colors.draft[c.key] || null;
      var auto = c.key === 'accentHover' && !draft;
      $('[data-cmeta]', row).innerHTML = 'Mặc định: ' + esc(String(c.def).toUpperCase()) +
        (auto ? ' · đang tự tính theo màu nhấn' : '') +
        (saved ? ' · <span class="badge badge--mid">Đã sửa</span>' : '') +
        (draft !== saved ? ' · <span class="badge badge--done">Chưa lưu</span>' : '');
      $('[data-creset]', row).hidden = !draft;
    });
    $$('[data-pal]', root).forEach(updatePalRow);
    var pc = $('[data-pal-count]', root);
    if (pc) { var ch = palDefs().filter(function (p) { return palVal(p.hex) !== p.hex; }).length; pc.textContent = palDefs().length + ' màu' + (ch ? ' · ' + ch + ' đã đổi' : ''); }
    var pv = $('[data-preview]', root);
    if (pv) {
      pv.style.setProperty('--pv-accent', colorVal('accent'));
      pv.style.setProperty('--pv-accent-h', colorVal('accentHover'));
      pv.style.setProperty('--pv-dark', colorVal('dark'));
      pv.style.setProperty('--pv-light', colorVal('light'));
      var warn = [], W = '#FFFFFF';
      var ca = contrast(colorVal('accent'), W), ch2 = contrast(colorVal('accentHover'), W), cd = contrast(colorVal('dark'), W), cl = contrast(colorVal('light'), colorVal('dark'));
      if (ca < 3) warn.push('Chữ trắng trên nút màu nhấn khó đọc (tương phản ' + ratioTxt(ca) + ', nên từ 3:1).');
      if (ch2 < 3) warn.push('Chữ trắng trên nút khi rê chuột khó đọc (tương phản ' + ratioTxt(ch2) + ', nên từ 3:1).');
      if (cd < 4.5) warn.push('Chữ trắng trên nền tối khó đọc (tương phản ' + ratioTxt(cd) + ', nên từ 4,5:1).');
      if (cl < 4.5) warn.push('Chữ đen chủ đạo trên nền xám nhạt khó đọc (tương phản ' + ratioTxt(cl) + ', nên từ 4,5:1).');
      $('[data-contrast]', pv).innerHTML = warn.length
        ? warn.map(function (w) { return '<p class="cms-warnline">' + ICON.warn + '<span>' + esc(w) + '</span></p>'; }).join('')
        : '<p class="cms-okline">Độ tương phản ổn: nút ' + esc(ratioTxt(ca)) + ' · nền tối ' + esc(ratioTxt(cd)) + '.</p>';
    }
    setSavebar('colors', colorsDirty(), 'màu');
  }
  function filterPalette() {
    var root = $('[data-cms-root]'); if (!root) return;
    var q = String(C.colors.q || '').toUpperCase().replace(/[^0-9A-F]/g, ''), any = false;
    $$('[data-pal]', root).forEach(function (row) {
      var hex = row.getAttribute('data-pal'), ok = !q || hex.indexOf(q) >= 0 || palVal(hex).indexOf(q) >= 0;
      row.hidden = !ok; if (ok) any = true;
    });
    $$('[data-pal-group]', root).forEach(function (g) { g.hidden = !$$('[data-pal]:not([hidden])', g).length; });
    var e = $('[data-pal-empty]', root); if (e) e.hidden = any;
  }
  function setColor(key, hex) {
    var c = colorDef(key); if (!c) return;
    hex = A.safeHex(hex, '');
    if (!hex) return;
    hex = hex.toUpperCase();
    var d = C.colors.draft;
    var dflt = String(c.def).toUpperCase();
    if (key === 'accentHover') { var auto = d.accent ? darker(d.accent) : dflt; d[key] = hex === auto ? null : hex; }
    else d[key] = hex === dflt ? null : hex;
    updateColorsUi();
  }
  function setPal(orig, hex) {
    hex = A.safeHex(hex, ''); if (!hex) return;
    hex = hex.toUpperCase();
    if (hex === orig) delete C.colors.pal[orig]; else C.colors.pal[orig] = hex;
    var row = $('[data-pal="' + CSS.escape(orig) + '"]'); if (row) updatePalRow(row);
    updateColorsUi();
  }
  function saveColors(btn) {
    var patch = { colors: {}, palette: {} }, n = 0;
    colorDefs().forEach(function (c) {
      var saved = C.store.colors[c.key] ? String(C.store.colors[c.key]).toUpperCase() : null, d = C.colors.draft[c.key] || null;
      if (d !== saved) { patch.colors[c.key] = d; n++; }
    });
    palDefs().forEach(function (p) {
      var d = (C.colors.pal || {})[p.hex] || null;
      if (d !== palSaved(p.hex)) { patch.palette[p.hex] = d; n++; }
    });
    if (!n) return;
    busy(btn, true);
    A.api('/cms', { method: 'PUT', body: patch }).then(function (store) {
      setStore(store); initColors(); busy(btn, false); updateColorsUi();
      A.toast('Đã lưu màu — website cập nhật ngay.', 'ok', { href: '/', label: 'Xem trang chủ ↗' });
    }, function (e) { busy(btn, false); A.apiFail(e); });
  }

  // ═══ 4–5. Liên hệ & mạng xã hội · Thanh toán (biểu mẫu khóa → giá trị) ════
  var HOURS = { hoursDays: 1, hoursOpen: 1, hoursClose: 1 };
  var FORMS = {
    contact: {
      view: 'cms-contact', title: 'Liên hệ & mạng xã hội', unit: 'thay đổi',
      help: '<strong>Hotline, link Zalo/Facebook… thay ở mọi trang cùng lúc.</strong> Ô để trống = dùng giá trị mặc định (chữ mờ trong ô).',
      ok: 'Đã lưu thông tin liên hệ — website cập nhật ngay.', link: '/',
    },
    payment: {
      view: 'cms-payment', title: 'Thanh toán', unit: 'thay đổi',
      help: '<strong>Cài tài khoản nhận chuyển khoản → màn hình đặt hàng thành công và form đăng ký khóa học sẽ hiện mã VietQR thật</strong> (có sẵn số tiền + nội dung chuyển khoản). Chưa cài thì hiện mã minh họa.',
      ok: 'Đã lưu tài khoản nhận tiền — mã VietQR trên website cập nhật ngay.', link: '/khoa-hoc',
    },
  };
  function formDefs(g) { return (C.cat && Array.isArray(C.cat[g])) ? C.cat[g] : []; }
  function formSaved(g, key) { var s = C.store[g] || {}; return s[key] != null ? String(s[key]) : ''; }
  function initForm(g) { var d = {}; formDefs(g).forEach(function (c) { d[c.key] = formSaved(g, c.key); }); C[g].draft = d; }
  // giá trị sẽ lưu: rỗng hoặc trùng mặc định → '' (= dùng mặc định)
  function formVal(g, c) {
    var v = String((C[g].draft || {})[c.key] || '').trim();
    if (c.key === 'bankHolder') v = holderText(v);
    return v === String(c.def || '') ? '' : v;
  }
  function formDirty(g) {
    if (!C[g] || !C[g].draft) return 0;
    return formDefs(g).filter(function (c) { return formVal(g, c) !== formSaved(g, c.key); }).length;
  }
  function holderText(v) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase(); }
  function optionsOf(c) { return Array.isArray(c.options) ? c.options : []; }
  function fieldError(c, v) {
    v = String(v || '').trim();
    if (!v) return '';
    if (/[<>"]/.test(v)) return 'Không dùng các ký tự < > "';
    if (c.type === 'url' && !/^https:\/\/[^\s"'<>`]+$/.test(v)) return 'Link phải bắt đầu bằng https:// và không có khoảng trắng.';
    if (c.type === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) return 'Giờ có dạng HH:MM, ví dụ 06:00.';
    if (c.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return 'Email chưa đúng định dạng, ví dụ lienhe@dappercombat.com.';
    if (c.type === 'select' && !optionsOf(c).some(function (o) { return o.v === v; })) return 'Chọn một mục trong danh sách.';
    if (c.type === 'phone' && (!/^[\d\s+().\-]+$/.test(v) || v.replace(/\D/g, '').length < 8)) return 'Số điện thoại chỉ gồm chữ số, dấu cách, + . - và có ít nhất 8 số.';
    if (c.key === 'bankAccount' && !/^[0-9A-Za-z]{4,25}$/.test(v)) return 'Số tài khoản gồm 4–25 chữ số hoặc chữ cái, không dấu cách, không dấu chấm.';
    if (c.key === 'momoPhone' && (!/^[\d\s+.\-]+$/.test(v) || v.replace(/\D/g, '').length < 9)) return 'Số MoMo chỉ gồm chữ số (ít nhất 9 số).';
    return '';
  }
  function formMount(g, main) {
    main.innerHTML = A.pageHead(FORMS[g].title, { eyebrow: 'Nội dung website', stamp: false, count: false }) + '<div data-cms-root></div>';
    formRender(g, main, true);
  }
  function formRender(g, main, first) {
    var root = $('[data-cms-root]', main || document); if (!root) return;
    if (!ready()) {
      root.innerHTML = stateHtml();
      if (!C.loading && first !== 'after') load().then(function () { if (A.view() === FORMS[g].view) formRender(g, main, 'after'); });
      return;
    }
    if (!C[g].draft) initForm(g);
    var defs = formDefs(g);
    var body;
    if (g === 'contact') {
      var main1 = defs.filter(function (c) { return !HOURS[c.key]; }), hrs = defs.filter(function (c) { return HOURS[c.key]; });
      body = '<form class="cms-contact" data-form="contact" novalidate>' + main1.map(function (c) { return fieldHtml(g, c); }).join('') +
        (hrs.length ? '<h2 class="cms-subhead">Giờ mở cửa</h2><p class="cms-subnote">Dùng để hiện trạng thái “Đang mở cửa / Đã đóng cửa” ở Trang chủ.</p>' + hrs.map(function (c) { return fieldHtml(g, c); }).join('') +
          '<p class="cms-cfield__err" data-hours-warn hidden></p>' : '') + '</form>';
    } else {
      body = '<div class="cms-pay"><form class="cms-contact" data-form="payment" novalidate>' + defs.map(function (c) { return fieldHtml(g, c); }).join('') + '</form>' +
        '<aside class="cms-qr" aria-label="Xem trước mã VietQR"><p class="cms-preview__label">Xem trước mã VietQR</p>' +
        '<div class="cms-qr__box" data-qr-box><p class="cms-qr__empty" data-qr-empty>Chọn ngân hàng và nhập số tài khoản để xem mã.</p>' +
        '<img data-qr-img alt="Mã VietQR thử" hidden></div>' +
        '<p class="cms-qr__cap" data-qr-cap hidden>Mã thử: 100.000₫ · nội dung DC123456</p></aside></div>' +
        '<p class="set-note cms-pay__more">Báo đơn mới qua Telegram / email: cài ở <a href="#/set-notify">Thiết lập › Thông báo</a>.</p>';
    }
    root.innerHTML = '<div class="cms-help"><p>' + FORMS[g].help + '</p></div>' + body + savebarHtml(g);
    updateFormUi(g);
  }
  function fieldHtml(g, c) {
    var id = 'f-' + g + '-' + slug(c.key), v = (C[g].draft || {})[c.key] || '', input;
    if (c.type === 'select') {
      var cur = v || c.def || '';
      var opts = optionsOf(c).slice();
      if (!c.def) opts.unshift({ v: '', l: '— Chưa cài —' });
      input = '<select id="' + esc(id) + '" data-fk>' + opts.map(function (o) {
        return '<option value="' + esc(o.v) + '"' + (String(o.v) === cur ? ' selected' : '') + '>' + esc(o.l) + '</option>';
      }).join('') + '</select>';
    } else if (c.type === 'time') {
      input = '<input id="' + esc(id) + '" type="time" step="300" value="' + esc(v || c.def || '') + '" data-fk>';
    } else {
      var t = c.type === 'url' ? 'url' : c.type === 'phone' ? 'tel' : c.type === 'email' ? 'email' : 'text';
      var extra = c.type === 'url' ? ' inputmode="url"' : (c.key === 'bankAccount' || c.key === 'momoPhone') ? ' inputmode="numeric"' : '';
      if (c.key === 'bankHolder') extra += ' autocapitalize="characters"';
      input = '<input id="' + esc(id) + '" type="' + t + '"' + extra + ' value="' + esc(v) + '"' + (c.def ? ' placeholder="' + esc(c.def) + '"' : '') +
        ' maxlength="' + (c.key === 'bankAccount' ? 25 : 300) + '" spellcheck="false" autocomplete="off" data-fk>';
    }
    return '<div class="cms-cfield" data-fkey="' + esc(c.key) + '">' +
      '<label class="field__label" for="' + esc(id) + '">' + esc(c.label) + '</label>' + input +
      '<p class="cms-cfield__err" data-ferr hidden></p><div class="cms-cfield__meta" data-fmeta></div></div>';
  }
  function updateFormUi(g) {
    var root = $('[data-cms-root]'); if (!root || A.view() !== FORMS[g].view) return;
    formDefs(g).forEach(function (c) {
      var box = $('[data-fkey="' + CSS.escape(c.key) + '"]', root); if (!box) return;
      var raw = String(C[g].draft[c.key] || '').trim(), v = formVal(g, c), saved = formSaved(g, c.key);
      var err = fieldError(c, raw), input = $('[data-fk]', box), errBox = $('[data-ferr]', box);
      errBox.textContent = err; errBox.hidden = !err;
      input.classList.toggle('is-invalid', !!err);
      if (err) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      var eff = v || String(c.def || '');
      var defTxt = c.type === 'select' ? (optionsOf(c).filter(function (o) { return o.v === c.def; })[0] || {}).l : c.def;
      var open = c.type === 'url' && /^https:\/\/[^\s"'<>`]+$/.test(eff) ? '<a class="cms-link" href="' + esc(eff) + '" target="_blank" rel="noopener noreferrer">Mở link ↗</a>' : '';
      $('[data-fmeta]', box).innerHTML =
        (defTxt ? '<span class="cms-cfield__def" title="' + esc(defTxt) + '">Mặc định: ' + esc(trunc(defTxt, 70)) + '</span>' : '') +
        (saved ? '<span class="badge badge--mid">Đã sửa</span>' : '') +
        (v !== saved ? '<span class="badge badge--done">Chưa lưu</span>' : '') + open +
        (v ? '<button class="cms-link" type="button" data-freset>' + (c.def ? 'Khôi phục mặc định' : 'Xóa') + '</button>' : '');
    });
    if (g === 'contact') {
      var hw = $('[data-hours-warn]', root);
      if (hw) {
        var o = formVal(g, { key: 'hoursOpen', def: defOf(g, 'hoursOpen') }) || defOf(g, 'hoursOpen');
        var cl = formVal(g, { key: 'hoursClose', def: defOf(g, 'hoursClose') }) || defOf(g, 'hoursClose');
        var bad = o && cl && /^\d\d:\d\d$/.test(o) && /^\d\d:\d\d$/.test(cl) && cl <= o;
        hw.textContent = bad ? 'Giờ đóng cửa đang sớm hơn (hoặc bằng) giờ mở cửa — kiểm tra lại.' : '';
        hw.hidden = !bad;
      }
    }
    if (g === 'payment') updateQr();
    setSavebar(g, formDirty(g), FORMS[g].unit);
  }
  function defOf(g, key) { var c = formDefs(g).filter(function (x) { return x.key === key; })[0]; return c ? String(c.def || '') : ''; }
  var qrTimer = 0;
  function updateQr() {
    clearTimeout(qrTimer);
    qrTimer = setTimeout(function () {
      var root = $('[data-cms-root]'); if (!root) return;
      var img = $('[data-qr-img]', root), empty = $('[data-qr-empty]', root), cap = $('[data-qr-cap]', root);
      if (!img) return;
      var binDef = formDefs('payment').filter(function (c) { return c.key === 'bankBin'; })[0];
      var bin = formVal('payment', binDef || { key: 'bankBin', def: '' });
      var acc = formVal('payment', { key: 'bankAccount', def: '' });
      var holder = formVal('payment', { key: 'bankHolder', def: '' });
      var okBin = binDef && optionsOf(binDef).some(function (o) { return o.v === bin; }) && /^\d{6}$/.test(bin);
      var okAcc = /^[0-9A-Za-z]{4,25}$/.test(acc);
      if (!okBin || !okAcc) {
        img.hidden = true; img.removeAttribute('src'); cap.hidden = true; empty.hidden = false;
        empty.textContent = !bin && !acc ? 'Chọn ngân hàng và nhập số tài khoản để xem mã.' : !okBin ? 'Chọn ngân hàng để xem mã.' : 'Nhập số tài khoản hợp lệ (4–25 chữ số/chữ cái) để xem mã.';
        return;
      }
      var url = 'https://img.vietqr.io/image/' + bin + '-' + acc + '-compact2.png?amount=100000&addInfo=DC123456&accountName=' + encodeURIComponent(holder);
      if (img.getAttribute('src') === url) return;
      empty.hidden = false; empty.textContent = 'Đang tạo mã…'; cap.hidden = true;
      img.onload = function () { empty.hidden = true; img.hidden = false; cap.hidden = false; };
      img.onerror = function () { img.hidden = true; cap.hidden = true; empty.hidden = false; empty.textContent = 'Không tạo được mã — kiểm tra lại ngân hàng / số tài khoản hoặc kết nối mạng.'; };
      img.setAttribute('src', url);
    }, 350);
  }
  function onFormInput(t) {
    var box = t.closest('[data-fkey]'), form = t.closest('[data-form]'); if (!box || !form) return;
    var g = form.getAttribute('data-form'), key = box.getAttribute('data-fkey');
    if (key === 'bankHolder') {
      var up = holderText(t.value);
      if (up !== t.value) { var pos = t.selectionStart; t.value = up; try { t.setSelectionRange(pos, pos); } catch (e) { /* bỏ qua */ } }
    }
    C[g].draft[key] = t.value;
    updateFormUi(g);
  }
  function saveForm(g, btn) {
    var patch = {}, n = 0, bad = null;
    patch[g] = {};
    formDefs(g).forEach(function (c) {
      var raw = String(C[g].draft[c.key] || '').trim(), v = formVal(g, c);
      if (fieldError(c, raw) && !bad) bad = c;
      if (v !== formSaved(g, c.key)) { patch[g][c.key] = v || null; n++; }
    });
    if (bad) { var inp = $('[data-fkey="' + CSS.escape(bad.key) + '"] [data-fk]'); if (inp) inp.focus(); A.toast('Kiểm tra lại: ' + bad.label, 'err'); return; }
    if (!n) return;
    busy(btn, true);
    A.api('/cms', { method: 'PUT', body: patch }).then(function (store) {
      setStore(store);
      var miss = Object.keys(patch[g]).filter(function (k) { return patch[g][k] && String(store[g][k] == null ? '' : store[g][k]) !== patch[g][k]; });
      initForm(g); busy(btn, false);
      formRender(g, $('#main'), 'after');
      if (miss.length) A.toast('Máy chủ không nhận: ' + miss.map(function (k) { var c = formDefs(g).filter(function (x) { return x.key === k; })[0]; return c ? c.label : k; }).join(', ') + ' — kiểm tra lại định dạng.', 'err');
      else A.toast(FORMS[g].ok, 'ok', { href: FORMS[g].link, label: 'Xem trang ↗' });
    }, function (e) { busy(btn, false); A.apiFail(e); });
  }

  // ═══ Sự kiện ═══════════════════════════════════════════════════════════════
  var searchTimer = 0;
  document.addEventListener('input', function (e) {
    var t = e.target; if (!(t instanceof Element) || !inView('cms-')) return;
    if (t.matches('[data-cms-search]')) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { C.text.q = t.value; renderTextTabs(); renderTextList(); }, 160);
    } else if (t.matches('textarea.cms-ta')) onTextInput(t);
    else if (t.matches('[data-link-input]')) onLinkInput(t);
    else if (t.matches('[data-imalt]')) {
      var ib = t.closest('[data-imkey]'), ik = ib.getAttribute('data-imkey'), m = C.idx.media[splitKey(ik).base], v = t.value.replace(/[<>"]/g, '');
      setPend('alt', ik, v.trim() === '' || v.trim() === String((m && m.alt) || '') ? null : v.trim());
      afterChange(ib);
    }
    else if (t.matches('[data-mlink-input]')) t.classList.remove('is-invalid');
    else if (t.matches('[data-cpick]')) setColor(t.closest('[data-ckey]').getAttribute('data-ckey'), t.value);
    else if (t.matches('[data-chex]')) {
      var hx = A.safeHex(t.value, '');
      t.classList.toggle('is-invalid', !hx && t.value.trim() !== '');
      if (hx && /^#[0-9a-f]{6}$/i.test(t.value.trim())) setColor(t.closest('[data-ckey]').getAttribute('data-ckey'), hx);
    }
    else if (t.matches('[data-pal-pick]')) setPal(t.closest('[data-pal]').getAttribute('data-pal'), t.value);
    else if (t.matches('[data-pal-hex]')) {
      var ph = String(t.value || '').trim(); if (ph && ph[0] !== '#') ph = '#' + ph;
      var okh = /^#[0-9a-f]{6}$/i.test(ph);
      t.classList.toggle('is-invalid', !okh && t.value.trim() !== '');
      if (okh) setPal(t.closest('[data-pal]').getAttribute('data-pal'), ph);
    }
    else if (t.matches('[data-pal-search]')) { C.colors.q = t.value; filterPalette(); }
    else if (t.matches('[data-fk]')) onFormInput(t);
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!(t instanceof Element) || !inView('cms-')) return;
    if (t.matches('[data-cms-only]')) { C.text.only = t.checked; renderTextTabs(); renderTextList(); }
    else if (t.matches('[data-mfile]')) onMediaFile(t);
    else if (t.matches('[data-imfile]')) onItemMedia(t);
    else if (t.matches('[data-hide-key]')) {
      setPend('hide', t.getAttribute('data-hide-key'), t.checked ? true : null);
      afterChange(t);
    }
    else if (t.matches('[data-link-preset]')) {
      var box = t.closest('[data-link-key]'), inp = $('[data-link-input]', box);
      if (t.value) { inp.value = t.value; onLinkInput(inp); }
      t.value = ''; inp.focus();
    }
    else if (t.matches('select[data-fk], input[type="time"][data-fk]')) onFormInput(t);
    else if (t.matches('[data-chex]')) { if (!A.safeHex(t.value, '')) { t.value = colorVal(t.closest('[data-ckey]').getAttribute('data-ckey')); t.classList.remove('is-invalid'); } }
    else if (t.matches('[data-pal-hex]')) { var row = t.closest('[data-pal]'); t.classList.remove('is-invalid'); updatePalRow(row); }
  });
  document.addEventListener('focusout', function (e) {
    var t = e.target;
    if (t instanceof Element && (t.matches('[data-chex]') || t.matches('[data-pal-hex]')) && inView('cms-colors')) updateColorsUi();
  });
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.key === 'Enter' && t instanceof Element && t.matches('[data-mlink-input]')) { e.preventDefault(); var b = $('[data-mlink-apply]', t.closest('[data-mkey]')); if (b) b.click(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && inView('cms-')) {
      var save = $('.savebar:not([hidden]) [data-cms-save]');
      if (save) { e.preventDefault(); save.click(); }
    }
  });
  document.addEventListener('submit', function (e) { if (e.target instanceof Element && e.target.matches('[data-form]')) { e.preventDefault(); var b = $('[data-cms-save="' + e.target.getAttribute('data-form') + '"]'); if (b && !b.closest('[hidden]')) b.click(); } });
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null; if (!t || !inView('cms-')) return;
    var n;
    if ((n = t.closest('[data-sec-toggle]'))) { toggleSection(n); return; }
    if ((n = t.closest('[data-cms-expand]'))) {
      var all = n.getAttribute('data-cms-expand') === 'all';
      (C.idx.secs[C.text.tab] || []).forEach(function (s) { C.text.open[s.id] = all; });
      renderTextList(); return;
    }
    if ((n = t.closest('[data-item-toggle]'))) { toggleItem(n); return; }
    if ((n = t.closest('[data-item-move]'))) { listAction(n, 'move'); return; }
    if ((n = t.closest('[data-item-dup]'))) { listAction(n, 'dup'); return; }
    if ((n = t.closest('[data-item-hide]'))) { listAction(n, 'hide'); return; }
    if ((n = t.closest('[data-item-show]'))) { listAction(n, 'show'); return; }
    if ((n = t.closest('[data-list-add]'))) { listAction(n, 'add'); return; }
    if ((n = t.closest('[data-item-del]'))) {
      var del = n, li = n.closest('[data-item]'), tt = li && $('.cms-item__title', li);
      A.confirmDialog({ title: 'Xóa “' + (tt ? tt.textContent : 'mục này') + '”?', body: 'Mục thêm mới này sẽ bị bỏ khỏi danh sách (sau khi bấm Lưu).', ok: 'Xóa mục', cancel: 'Quay lại' })
        .then(function (yes) { if (yes) listAction(del, 'del'); });
      return;
    }
    if ((n = t.closest('[data-list-reset]'))) {
      var lb = n.closest('[data-list]'), lk = lb.getAttribute('data-list'), L = C.idx.list[splitKey(lk).base];
      A.confirmDialog({ title: 'Khôi phục “' + (L ? L.label : 'danh sách') + '” như ban đầu?', body: 'Mục thêm mới sẽ bị bỏ, mục đã ẩn hiện lại và thứ tự trở về như gốc (sau khi bấm Lưu). Chữ đã sửa trong các mục gốc vẫn giữ.', ok: 'Khôi phục', cancel: 'Quay lại' })
        .then(function (yes) {
          if (!yes) return;
          var info = itemsOf(lk);
          if (info) Object.keys(info.add).forEach(function (id) { dropPendingChain(info.chain + '@' + id); });
          setPend('lists', lk, null); redrawList(lk);
        });
      return;
    }
    if ((n = t.closest('[data-link-reset]'))) {
      var lr = n.closest('[data-lkrow]'), lkk = lr.getAttribute('data-lkrow');
      setPend('links', lkk, null); setPend('hide', lkk, null); redrawPart(lr); return;
    }
    if ((n = t.closest('[data-imreset]'))) { var mb = n.closest('[data-imkey]'); setPend('media', mb.getAttribute('data-imkey'), null); redrawPart(mb); return; }
    if ((n = t.closest('[data-ipick]'))) { pickIcon(n); return; }
    if ((n = t.closest('[data-ireset]'))) { var ib2 = n.closest('[data-ikey]'); setPend('icons', ib2.getAttribute('data-ikey'), null); redrawPart(ib2); return; }
    if ((n = t.closest('[data-copy-def]'))) { copyDefault(n); return; }
    if ((n = t.closest('[data-reset-key]'))) { resetKey(n); return; }
    if ((n = t.closest('[data-cms-save]'))) {
      var k = n.getAttribute('data-cms-save');
      if (k === 'cms' || k === 'text') saveAll(n); else if (k === 'colors') saveColors(n); else if (FORMS[k]) saveForm(k, n);
      return;
    }
    if ((n = t.closest('[data-cms-discard]'))) {
      var d = n.getAttribute('data-cms-discard');
      if (d === 'cms' || d === 'text') discardAll();
      else if (d === 'colors') { initColors(); colorsRender($('#main'), 'after'); }
      else if (FORMS[d]) { initForm(d); formRender(d, $('#main'), 'after'); }
      return;
    }
    if ((n = t.closest('[data-mlink-toggle]'))) {
      var box = $('[data-mlink]', n.closest('[data-mkey]')), open = box.hidden;
      box.hidden = !open; n.setAttribute('aria-expanded', String(open));
      if (open) $('[data-mlink-input]', box).focus();
      return;
    }
    if ((n = t.closest('[data-mlink-apply]'))) { applyLink(n); return; }
    if ((n = t.closest('[data-mreset]'))) { resetMedia(n); return; }
    if ((n = t.closest('[data-creset]'))) { var ck = n.closest('[data-ckey]').getAttribute('data-ckey'); C.colors.draft[ck] = null; updateColorsUi(); return; }
    if ((n = t.closest('[data-pal-reset]'))) { var pr = n.closest('[data-pal]').getAttribute('data-pal'); delete C.colors.pal[pr]; updateColorsUi(); return; }
    if ((n = t.closest('[data-freset]'))) {
      var fb = n.closest('[data-fkey]'), fg = n.closest('[data-form]').getAttribute('data-form'), fk = fb.getAttribute('data-fkey');
      var fin = $('[data-fk]', fb);
      C[fg].draft[fk] = '';
      fin.value = (fin.tagName === 'SELECT' || fin.type === 'time') ? defOf(fg, fk) : '';
      updateFormUi(fg); fin.focus();
    }
  });

  // ═══ Đăng ký màn hình ══════════════════════════════════════════════════════
  function reloadIfClean(main, manual, dirty, again) {
    if (!manual) return;
    if (dirty) { A.toast('Đang có thay đổi chưa lưu — hãy lưu hoặc hủy trước khi tải lại.', 'info'); return; }
    load(true).then(again);
  }
  // trạng thái dịch tự động (ô English: "đang chờ AI dịch" hay "chưa có khóa")
  function loadAi() {
    if (A.isAdmin && !A.isAdmin()) return;
    A.api('/translate/status').then(function (st) {
      var was = C.ai && C.ai.enabled; C.ai = st;
      if (!!was !== !!st.enabled && A.view() === 'cms-text') $$('.cms-row[data-key]').forEach(function (r) { var f = fieldByKey(r.getAttribute('data-key')); var m = f && $('[data-meta="en"]', r), ta = $('textarea[data-side="en"]', r); if (m && ta) m.innerHTML = metaHtml(f, 'en', ta.value); });
    }, function () { /* không bắt buộc */ });
  }
  A.register('cms-text', {
    title: 'Chữ trên trang',
    mount: function (main, sub) { loadAi(); return textMount(main, sub); },
    route: function (main, sub) { textRoute(main, sub); },
    update: function (main, manual) { reloadIfClean(main, manual, pendCount(), function () { if (A.view() === 'cms-text') { var r = $('[data-cms-root]', main); if (r) r.innerHTML = ''; textRoute(main, C.text.tab, 'after'); } }); },
    isDirty: function () { return pendCount() > 0; },
    dirtyText: function () { return 'Có ' + pendCount() + ' thay đổi chưa lưu.'; },
    discard: clearPending,
    reset: resetAll,
  });
  A.register('cms-media', {
    title: 'Hình ảnh & video',
    mount: mediaMount,
    route: function (main, sub) { mediaRoute(main, sub); },
    update: function (main, manual) { reloadIfClean(main, manual, 0, function () { if (A.view() === 'cms-media') mediaRoute(main, C.media.tab, 'after'); }); },
  });
  A.register('cms-colors', {
    title: 'Màu sắc',
    mount: colorsMount,
    update: function (main, manual) { reloadIfClean(main, manual, colorsDirty(), function () { initColors(); if (A.view() === 'cms-colors') colorsRender(main, 'after'); }); },
    isDirty: function () { return colorsDirty() > 0; },
    dirtyText: function () { return 'Có ' + colorsDirty() + ' màu chưa lưu.'; },
    discard: function () { C.colors.draft = null; C.colors.pal = null; },
  });
  ['contact', 'payment'].forEach(function (g) {
    A.register(FORMS[g].view, {
      title: FORMS[g].title,
      mount: function (main) { formMount(g, main); },
      update: function (main, manual) { reloadIfClean(main, manual, formDirty(g), function () { initForm(g); if (A.view() === FORMS[g].view) formRender(g, main, 'after'); }); },
      isDirty: function () { return formDirty(g) > 0; },
      dirtyText: function () { return 'Có ' + formDirty(g) + ' thay đổi chưa lưu.'; },
      discard: function () { C[g].draft = null; },
    });
  });
  function resetAll() {
    C.store = null; C.err = ''; C.loadedAt = 0; C.triedAt = 0;
    clearPending(); C.text.q = ''; C.text.only = false; C.itemOpen = {};
    C.media.notes = {}; C.media.check = {};
    C.colors.draft = null; C.colors.pal = null; C.contact.draft = null; C.payment.draft = null;
    updateBadges();
  }

  // ═══ Giao diện dùng chung cho admin-cms2.js (Icon, Bố cục, Phông chữ, Liên kết, Mã tùy chỉnh, Trang phụ) ═══
  A.cms = {
    C: C, load: load, ready: ready, stateHtml: stateHtml, tabsHtml: tabsHtml, savebarHtml: function () { return savebarHtml('cms'); },
    refreshBar: refreshBar, saveAll: saveAll, discardAll: discardAll, pendCount: pendCount, clearPending: clearPending,
    effGet: effGet, setPend: setPend, isHidden: isHidden, splitKey: splitKey, fieldByKey: fieldByKey, has: has, clone: clone,
    pageUrl: pageUrl, sectionUrl: sectionUrl, locateUrl: locateUrl, safePath: safePath, urlSlug: urlSlug, num: num, trunc: trunc, plain: plain,
    linkEditorHtml: linkEditorHtml, linkRowHtml: linkRowHtml, rowHtml: rowHtml, hideToggleHtml: hideToggleHtml, linkDefault: linkDefault,
    presetSelectHtml: presetSelectHtml, hrefOk: function (v) { return HREF_RE.test(String(v || '')); },
    iconMarkup: iconMarkup, iconSize: iconSize, iconUrlSafe: iconUrlSafe, sanitizeSvg: sanitizeSvg, uploadFile: uploadFile, probe: probe, afterChange: afterChange,
    // màn hình dùng chung thanh “Lưu”: { render(), link(), changed(el) }
    screen: function (view, def) {
      C.screens[view] = def;
      A.register(view, {
        title: def.title, mount: def.mount, route: def.route,
        update: function (main, manual) { reloadIfClean(main, manual, pendCount(), function () { if (A.view() === view && def.render) def.render(); }); },
        isDirty: function () { return pendCount() > 0; },
        dirtyText: function () { return 'Có ' + pendCount() + ' thay đổi chưa lưu.'; },
        discard: clearPending,
      });
    },
  };

  // thẻ "Nội dung website" trên Tổng quan
  A.addDashboard(function () {
    var dirty = pendCount() || colorsDirty() || formDirty('contact') || formDirty('payment');
    if (!C.loading && !dirty && Date.now() - Math.max(C.loadedAt, C.triedAt) > STALE_MS) {
      load(false).then(function () { A.rerender(); });
    }
    var ok = ready(), S = C.store || {};
    var cnt = function (g) { return ok ? Object.keys(S[g] || {}).length : 0; };
    var et = ok ? editedText() : 0, em = ok ? editedMedia() : 0;
    var ec = cnt('colors') + cnt('palette'), ek = cnt('contact'), ep = cnt('payment'), ei = cnt('icons'), el = cnt('links'), eh = cnt('hide'), els = cnt('lists');
    var lay = cnt('layout'), ef = cnt('fonts'), eco = cnt('code');
    var qr = ok && S.payment.bankBin && S.payment.bankAccount;
    var total = et + em + ec + ek + ep + ei + el + eh + els + lay + ef + eco + cnt('alt');
    var sum = ok
      ? num((C.cat.fields || []).length) + ' đoạn chữ · ' + num((C.cat.media || []).length) + ' ảnh/video · ' + num((C.cat.lists || []).length) + ' danh sách · ' + num(total) + ' chỗ đã sửa'
      : (C.err ? 'Chưa tải được: ' + C.err : 'Đang tải nội dung…');
    var tile = function (href, label, val) {
      return '<a class="cms-dash__tile" href="' + href + '"><span class="cms-dash__k">' + esc(label) + '</span><span class="cms-dash__v">' + esc(val) + '</span></a>';
    };
    var v = function (n, yes, no) { return ok ? (n ? n + ' ' + yes : no) : '…'; };
    return '<section class="panel cms-dash">' +
      '<header class="panel__head"><h2 class="panel__title">Nội dung website</h2><a class="link-more" href="#/cms-text">Sửa nội dung →</a></header>' +
      '<p class="cms-dash__sum">' + esc(sum) + '</p>' +
      '<div class="cms-dash__grid cms-dash__grid--10">' +
        tile('#/cms-text', 'Chữ & danh sách', v(et + els + eh, 'chỗ đã sửa', 'Chưa sửa')) +
        tile('#/cms-media', 'Hình ảnh & video', v(em, 'đã thay', 'Chưa thay')) +
        tile('#/cms-icons', 'Icon', v(ei, 'đã thay', 'Mặc định')) +
        tile('#/cms-links', 'Liên kết & nút', v(el, 'đã đổi', 'Mặc định')) +
        tile('#/cms-layout', 'Bố cục trang', v(lay, 'trang đã chỉnh', 'Mặc định')) +
        tile('#/cms-colors', 'Màu sắc', v(ec, 'màu đã đổi', 'Mặc định')) +
        tile('#/cms-fonts', 'Phông chữ', v(ef, 'phông đã đổi', 'Mặc định')) +
        tile('#/cms-contact', 'Liên hệ & MXH', v(ek, 'mục đã đổi', 'Mặc định')) +
        tile('#/cms-payment', 'Thanh toán', ok ? (qr ? 'Đã cài VietQR' : 'Chưa cài tài khoản') : '…') +
        tile('#/pages', 'Trang phụ', ok ? (C.sitePages.length ? C.sitePages.length + ' trang · ' + C.sitePages.filter(function (p) { return p.published; }).length + ' đang hiện' : 'Chưa có') : '…') +
      '</div></section>';
  });
})();
