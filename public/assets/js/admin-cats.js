/* Dapper Combat — Quản trị: Danh mục sản phẩm (#/categories)
   Danh mục trên thanh lọc Shop (tên, mô tả, chất liệu, trọng lượng, bảo hành, bảng size, ẩn/hiện, thứ tự)
   và các ô ảnh danh mục dưới lưới sản phẩm. Lưu vào Thiết lập → shop.categories + shop.tiles.
   Mọi giá trị từ API đều qua esc() trước khi chèn HTML; ảnh qua A.safeImg. */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A || !A.settingsStore) return;
  var SS = A.settingsStore, esc = A.esc, ICON = A.ICON;
  var VIEW = 'categories';
  var GUIDES = [['gang', 'Bảng size găng'], ['ao', 'Bảng size áo'], ['dotap', 'Bảng size đồ tập'], ['free', 'Freesize — không cần bảng size']];
  var MAX_TILES = 4, TILE = { w: 1200, h: 800, kb: 300 };
  var ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var UP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7"/></svg>';
  var DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>';

  // d = bản nháp { cats: [...], tiles: [...] }; mỗi mục có _k (khóa ổn định cho giao diện), danh mục mới có _new
  var T = { d: null, orig: '', open: {}, seq: 0, err: '' };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clone(o) { return JSON.parse(JSON.stringify(o == null ? null : o)); }
  function on() { return A.view() === VIEW; }
  function key() { return 'k' + (++T.seq); }
  function pair(v) { return { vi: String((v && v.vi) || ''), en: String((v && v.en) || '') }; }
  function slug(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20).replace(/-+$/, '');
  }
  function data() { return SS.data(); }
  function shop() { return (data() && data().shop) || {}; }
  function savedIds() { return (shop().categories || []).map(function (c) { return c.id; }); }
  function defaults() { var d = data() && data().defaults; return (d && d.shop && d.shop.categories) || []; }
  function products() { return SS.products() || []; }
  function countOf(id) { return products().filter(function (p) { return p.cat === id; }).length; }
  function catByK(k) { return (T.d ? T.d.cats : []).filter(function (c) { return c._k === k; })[0]; }
  function tileByK(k) { return (T.d ? T.d.tiles : []).filter(function (t) { return t._k === k; })[0]; }
  function catOf(id) { return (T.d ? T.d.cats : []).filter(function (c) { return c.id === id; })[0]; }

  function normCat(c) {
    return { id: String(c.id || ''), name: pair(c.name), desc: pair(c.desc), material: pair(c.material), weight: String(c.weight || ''),
      warranty: Math.max(0, Math.min(120, Math.round(Number(c.warranty) || 0))), guide: GUIDES.some(function (g) { return g[0] === c.guide; }) ? c.guide : 'free', hidden: !!c.hidden };
  }
  function normTile(t) { return { cat: String((t && t.cat) || ''), img: String((t && t.img) || ''), title: pair(t && t.title) }; }
  // dữ liệu gửi máy chủ / so sánh thay đổi (bỏ khóa nội bộ)
  function plainDraft(d) {
    return { categories: d.cats.map(function (c) { var x = normCat(c); x.name.vi = x.name.vi.trim(); x.name.en = x.name.en.trim(); return x; }),
      tiles: d.tiles.map(function (t) { var x = normTile(t); x.title.vi = x.title.vi.trim(); x.title.en = x.title.en.trim(); return x; }) };
  }
  function initDraft() {
    var s = shop();
    T.d = {
      cats: (s.categories || []).map(function (c) { var x = normCat(c); x._k = key(); return x; }),
      tiles: (s.tiles || []).slice(0, MAX_TILES).map(function (t) { var x = normTile(t); x._k = key(); return x; }),
    };
    T.orig = JSON.stringify(plainDraft(T.d));
  }
  function dirty() { return !!T.d && JSON.stringify(plainDraft(T.d)) !== T.orig; }

  // ═══ Khung màn hình ════════════════════════════════════════════════════════
  function mount(main) {
    T.d = null; T.open = {};
    main.innerHTML = A.pageHead('Danh mục sản phẩm', { eyebrow: 'Sản phẩm', stamp: false, count: false,
      actions: '<a class="btn btn--ghost" href="/shop" target="_blank" rel="noopener">Xem Shop ↗</a>' }) + '<div data-cat-root></div>';
    load(false);
  }
  function load(force) {
    var root = $('[data-cat-root]'); if (!root) return;
    if (!data() || force || !SS.products()) root.innerHTML = A.loadingHtml();
    Promise.all([SS.load(force), SS.loadProducts()]).then(function () {
      if (!on()) return;
      if (!data()) { root.innerHTML = A.errorHtml('Không tải được thiết lập — bấm làm mới để thử lại.'); return; }
      initDraft(); render();
    });
  }
  function render() {
    var root = $('[data-cat-root]'); if (!root || !T.d) return;
    root.innerHTML =
      '<div class="cms-help"><p><strong>Danh mục</strong> là các nhóm trên thanh lọc của Shop (Găng tay, Áo…). Thứ tự dưới đây là thứ tự trên thanh lọc. ' +
        'Chất liệu, trọng lượng, bảo hành và bảng size của danh mục hiện trong trang chi tiết của mọi sản phẩm thuộc danh mục đó. Bấm “Lưu” để áp dụng.</p></div>' +
      '<p class="form-msg" data-cat-msg role="alert" hidden></p>' +
      '<section class="panel set-sec" aria-labelledby="catListTitle"><header class="panel__head"><h2 class="panel__title" id="catListTitle">Danh mục</h2><span class="cms-sec__meta" data-cat-meta></span></header>' +
        '<div class="set-body"><div class="cat-list" data-cat-list></div>' +
        '<div class="set-actions cat-foot"><button type="button" class="btn btn--line btn--sm" data-cat-add>' + ICON.plus + '<span>Thêm danh mục</span></button>' +
          '<span class="spacer"></span><button type="button" class="btn btn--quiet btn--sm" data-cat-defaults>Khôi phục mặc định</button></div></div></section>' +
      '<section class="panel set-sec" aria-labelledby="tileTitle"><header class="panel__head"><h2 class="panel__title" id="tileTitle">Ô ảnh danh mục</h2><span class="cms-sec__meta" data-tile-meta></span></header>' +
        '<div class="set-body"><p class="set-note">Tối đa ' + MAX_TILES + ' ô ảnh hiện dưới lưới sản phẩm ở trang Shop (khi khách chưa lọc). Bấm vào ô sẽ mở đúng danh mục. Không có ô nào = ẩn cả hàng ô ảnh.</p>' +
          '<div class="tile-list" data-tile-list></div>' +
          '<div class="set-actions"><button type="button" class="btn btn--line btn--sm" data-tile-add>' + ICON.plus + '<span>Thêm ô ảnh</span></button>' +
          '<span class="field__hint">Ảnh nên ' + TILE.w + ' × ' + TILE.h + ' px, JPG/WebP ≤ ' + TILE.kb + ' KB.</span></div></div></section>' +
      '<div class="savebar" data-savebar="cats" hidden role="region" aria-label="Lưu thay đổi"><p class="savebar__msg" data-savebar-msg></p>' +
        '<div class="savebar__actions"><button class="btn btn--on-dark" type="button" data-cat-discard>Hủy</button><button class="btn btn--primary" type="button" data-cat-save>Lưu</button></div></div>';
    renderCats(); renderTiles(); bar();
  }
  function bar() {
    var b = $('[data-savebar="cats"]'); if (!b) return;
    var d = dirty();
    b.hidden = !d;
    if (d) { $('[data-savebar-msg]', b).textContent = 'Danh mục có thay đổi chưa lưu'; $('[data-cat-save]', b).textContent = 'Lưu thay đổi'; }
  }
  function msg(text) { var m = $('[data-cat-msg]'); if (!m) return; m.textContent = text || ''; m.hidden = !text; if (text) m.scrollIntoView({ block: 'nearest' }); }

  // ═══ Danh sách danh mục ════════════════════════════════════════════════════
  function renderCats(focusSel) {
    var box = $('[data-cat-list]'); if (!box) return;
    var list = T.d.cats, saved = savedIds();
    box.innerHTML = list.length ? list.map(function (c, i) { return catHtml(c, i, list.length, saved); }).join('') : '<p class="mini-state">Chưa có danh mục nào — bấm “Thêm danh mục”.</p>';
    var hid = list.filter(function (c) { return c.hidden; }).length, meta = $('[data-cat-meta]');
    if (meta) meta.textContent = list.length + ' danh mục' + (hid ? ' · ' + hid + ' đang ẩn' : '');
    var dflt = $('[data-cat-defaults]'); if (dflt) dflt.hidden = JSON.stringify(plainDraft(T.d).categories) === JSON.stringify(defaults().map(normCat));
    if (focusSel) { var f = $(focusSel); if (f) f.focus(); }
  }
  function catHtml(c, i, n, saved) {
    var isNew = saved.indexOf(c.id) < 0 || c._new, cnt = isNew ? 0 : countOf(c.id), open = !!T.open[c._k];
    var title = c.name.vi.trim() || 'Danh mục chưa đặt tên';
    var countHtml = isNew ? '<span class="cat-card__count is-muted">Chưa lưu</span>'
      : cnt ? '<a class="cat-card__count" href="#/products" data-cat-products="' + esc(c.id) + '" title="Mở danh sách sản phẩm của danh mục này">' + esc(cnt) + ' sản phẩm</a>'
        : '<span class="cat-card__count is-muted">Chưa có sản phẩm</span>';
    var lock = !isNew && cnt > 0;
    return '<article class="cat-card' + (open ? ' is-open' : '') + (c.hidden ? ' is-hidden' : '') + (isNew ? ' is-new' : '') + '" data-cat-k="' + esc(c._k) + '">' +
      '<div class="cat-card__head">' +
        '<span class="cat-card__n" aria-hidden="true">' + (i + 1) + '</span>' +
        '<button type="button" class="cat-card__toggle" data-cat-toggle aria-expanded="' + open + '">' +
          '<span class="cat-card__name" data-cat-title>' + esc(title) + '</span>' +
          '<code class="cat-chip" data-cat-chip title="Mã trên đường dẫn /shop?cat=…">' + esc(c.id || '—') + '</code>' +
          (isNew ? '<span class="badge badge--mid">Mới</span>' : '') +
          (c.hidden ? '<span class="badge badge--off">Ẩn khỏi thanh lọc</span>' : '') + '</button>' +
        '<span class="cat-card__side">' + countHtml +
          '<label class="check cat-card__hide" title="Bật = không hiện trên thanh lọc của Shop (sản phẩm vẫn hiện ở “Tất cả”)"><input type="checkbox" data-cat-hidden' + (c.hidden ? ' checked' : '') + '>' +
            '<span class="switch__ui" aria-hidden="true"></span><span>Ẩn khỏi thanh lọc</span></label>' +
          '<span class="cat-card__tools">' +
            '<button type="button" class="icon-btn icon-btn--line" data-cat-move="-1" aria-label="Đưa “' + esc(title) + '” lên"' + (i === 0 ? ' disabled' : '') + '>' + UP + '</button>' +
            '<button type="button" class="icon-btn icon-btn--line" data-cat-move="1" aria-label="Đưa “' + esc(title) + '” xuống"' + (i === n - 1 ? ' disabled' : '') + '>' + DOWN + '</button>' +
            '<button type="button" class="btn btn--quiet btn--sm' + (lock ? ' is-locked' : '') + '" data-cat-del' + (lock ? ' aria-disabled="true" title="Đang có ' + esc(cnt) + ' sản phẩm — chuyển sang danh mục khác rồi mới xóa được"' : '') + '>Xóa</button>' +
          '</span></span>' +
      '</div>' +
      (open ? catBodyHtml(c, isNew, cnt) : '') +
    '</article>';
  }
  function txtField(c, path, label, hint, opt) {
    opt = opt || {};
    var v = path.split('.').reduce(function (o, k) { return o == null ? '' : o[k]; }, c);
    var id = 'cf-' + c._k + '-' + path.replace(/\./g, '-');
    var inp = opt.area
      ? '<textarea id="' + id + '" rows="2" maxlength="' + (opt.max || 300) + '" data-cf="' + esc(path) + '"' + (opt.ph ? ' placeholder="' + esc(opt.ph) + '"' : '') + '>' + esc(v) + '</textarea>'
      : '<input id="' + id + '" type="text" maxlength="' + (opt.max || 60) + '" data-cf="' + esc(path) + '" value="' + esc(v) + '" autocomplete="off"' + (opt.ph ? ' placeholder="' + esc(opt.ph) + '"' : '') + '>';
    return '<label class="field" for="' + id + '"><span class="field__label">' + esc(label) + '</span>' + inp + (hint ? '<small class="field__hint">' + hint + '</small>' : '') + '</label>';
  }
  function catBodyHtml(c, isNew, cnt) {
    var idRow = isNew
      ? '<label class="field" for="cf-' + esc(c._k) + '-id"><span class="field__label">Mã trên đường dẫn</span>' +
          '<span class="set-affix cat-id"><em>/shop?cat=</em><input id="cf-' + esc(c._k) + '-id" type="text" maxlength="20" data-cf="id" value="' + esc(c.id) + '" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="vd: bao-cat"></span>' +
          '<small class="field__hint">Tự tạo theo tên tiếng Việt — chữ thường không dấu, số và dấu gạch ngang. <strong>Không đổi được sau khi lưu.</strong></small></label>'
      : '<div class="field"><span class="field__label">Mã trên đường dẫn</span><p class="cat-id-fixed"><code>/shop?cat=' + esc(c.id) + '</code> <span class="field__hint">cố định</span></p></div>';
    var guide = '<label class="field" for="cf-' + esc(c._k) + '-guide"><span class="field__label">Bảng size</span><select id="cf-' + esc(c._k) + '-guide" data-cf="guide">' +
      GUIDES.map(function (g) { return '<option value="' + g[0] + '"' + (c.guide === g[0] ? ' selected' : '') + '>' + esc(g[1]) + '</option>'; }).join('') + '</select>' +
      '<small class="field__hint">Bảng size hiện ở trang chi tiết sản phẩm.</small></label>';
    return '<div class="cat-card__body">' +
      '<div class="set-grid2">' +
        txtField(c, 'name.vi', 'Tên (Tiếng Việt) — bắt buộc', 'Hiện trên thanh lọc, thẻ sản phẩm, đường dẫn trang và Trang chủ.', { max: 60, ph: 'VD: Bao cát' }) +
        txtField(c, 'name.en', 'Tên (English (AI tự dịch))', 'Lưu tên tiếng Việt là AI tự dịch.', { max: 60, ph: 'VD: Heavy bags' }) +
        txtField(c, 'desc.vi', 'Mô tả (Tiếng Việt)', 'Dòng chữ dưới tiêu đề khi khách lọc Shop theo danh mục này.', { area: true, max: 300 }) +
        txtField(c, 'desc.en', 'Mô tả (English (AI tự dịch))', '', { area: true, max: 300 }) +
        txtField(c, 'material.vi', 'Chất liệu (Tiếng Việt)', 'Dòng “Chất liệu” trong bảng thông số sản phẩm.', { max: 120, ph: 'VD: Da PU, mút ép nhiều lớp' }) +
        txtField(c, 'material.en', 'Chất liệu (English (AI tự dịch))', '', { max: 120 }) +
      '</div>' +
      '<div class="set-grid3">' +
        txtField(c, 'weight', 'Trọng lượng', 'Dòng “Trọng lượng”, vd ~420g. Để trống nếu không cần.', { max: 30, ph: '~420g' }) +
        '<label class="field set-num" for="cf-' + esc(c._k) + '-warranty"><span class="field__label">Bảo hành</span><span class="set-affix"><input id="cf-' + esc(c._k) + '-warranty" type="number" inputmode="numeric" min="0" max="120" step="1" data-cf="warranty" value="' + esc(c.warranty) + '"><em>tháng</em></span>' +
          '<small class="field__hint">Hiện “Bảo hành N tháng”. Nhập 0 nếu không bảo hành.</small></label>' +
        guide +
      '</div>' + idRow +
      '<div class="set-actions cat-card__links">' + (isNew ? '<span class="field__hint">Lưu xong mới xem được trên Shop.</span>'
        : '<a class="btn btn--quiet btn--sm" href="/shop?cat=' + esc(encodeURIComponent(c.id)) + '" target="_blank" rel="noopener">Xem trên Shop ↗</a>' +
          (cnt ? '<a class="btn btn--quiet btn--sm" href="#/products" data-cat-products="' + esc(c.id) + '">Xem ' + esc(cnt) + ' sản phẩm</a>' : '')) + '</div>' +
    '</div>';
  }
  // cập nhật tiêu đề / mã trên đầu thẻ mà không vẽ lại (giữ con trỏ trong ô đang gõ)
  function patchHead(c) {
    var card = $('[data-cat-k="' + CSS.escape(c._k) + '"]'); if (!card) return;
    $('[data-cat-title]', card).textContent = c.name.vi.trim() || 'Danh mục chưa đặt tên';
    $('[data-cat-chip]', card).textContent = c.id || '—';
  }
  function uniqueSlug(base, self) {
    var id = base || '', n = 2;
    var taken = function (x) { return T.d.cats.some(function (o) { return o !== self && o.id === x; }); };
    while (id && taken(id)) { var suf = '-' + n++; id = base.slice(0, 20 - suf.length).replace(/-+$/, '') + suf; }
    return id;
  }

  // ═══ Ô ảnh danh mục ════════════════════════════════════════════════════════
  function renderTiles(focusSel) {
    var box = $('[data-tile-list]'); if (!box) return;
    var list = T.d.tiles;
    box.innerHTML = list.length ? list.map(function (t, i) { return tileHtml(t, i, list.length); }).join('') : '<p class="mini-state">Chưa có ô ảnh nào — hàng ô ảnh sẽ không hiện trên Shop.</p>';
    var meta = $('[data-tile-meta]'); if (meta) meta.textContent = list.length + ' / ' + MAX_TILES + ' ô';
    var add = $('[data-tile-add]'); if (add) add.disabled = list.length >= MAX_TILES;
    if (focusSel) { var f = $(focusSel); if (f) f.focus(); }
  }
  function tileHtml(t, i, n) {
    var src = A.safeImg(t.img), cat = catOf(t.cat), id = 'tl-' + t._k;
    var opts = '<option value="">— Chọn danh mục —</option>' + T.d.cats.filter(function (c) { return ID_RE.test(c.id); }).map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === t.cat ? ' selected' : '') + '>' + esc(c.name.vi.trim() || c.id) + (c.hidden ? ' (đang ẩn khỏi thanh lọc)' : '') + '</option>';
    }).join('');
    var warn = !t.cat || !cat ? 'Chọn danh mục để ô ảnh dẫn tới.' : cat.hidden ? 'Danh mục này đang ẩn khỏi thanh lọc — ô ảnh vẫn mở được danh mục.' : '';
    return '<div class="tile-row' + (!src || !cat ? ' is-incomplete' : '') + '" data-tile-k="' + esc(t._k) + '">' +
      '<span class="cat-card__n" aria-hidden="true">' + (i + 1) + '</span>' +
      '<div class="tile-row__img">' + (src ? '<img src="' + esc(src) + '" alt="">' : '<span class="pimg__empty">' + ICON.image + '<span>Chưa có ảnh</span></span>') + '</div>' +
      '<div class="tile-row__fields">' +
        '<label class="field" for="' + id + '-cat"><span class="field__label">Bấm vào ô sẽ mở danh mục</span><select id="' + id + '-cat" data-tf="cat">' + opts + '</select>' +
          '<small class="field__hint' + (warn && (!t.cat || !cat) ? ' set-warn' : '') + '" data-tile-warn>' + esc(warn) + '</small></label>' +
        '<div class="set-grid2">' +
          '<label class="field" for="' + id + '-vi"><span class="field__label">Tiêu đề (Tiếng Việt)</span><input id="' + id + '-vi" type="text" maxlength="80" data-tf="title.vi" value="' + esc(t.title.vi) + '" autocomplete="off" placeholder="VD: Găng tay thi đấu"></label>' +
          '<label class="field" for="' + id + '-en"><span class="field__label">Tiêu đề (English (AI tự dịch))</span><input id="' + id + '-en" type="text" maxlength="80" data-tf="title.en" value="' + esc(t.title.en) + '" autocomplete="off" placeholder="Để trống = dùng tiếng Việt"></label>' +
        '</div>' +
        '<div class="set-actions"><label class="btn btn--line btn--sm file-btn">' + ICON.upload + '<span data-tile-uplabel>' + (src ? 'Đổi ảnh' : 'Tải ảnh') + '</span>' +
          '<input class="sr" type="file" accept="image/jpeg,image/png,image/webp" data-tile-file></label>' +
          '<span class="field__hint">' + TILE.w + ' × ' + TILE.h + ' px · JPG/WebP ≤ ' + TILE.kb + ' KB</span></div>' +
        '<div class="set-msg" data-tile-msg hidden></div>' +
      '</div>' +
      '<div class="tile-row__tools">' +
        '<button type="button" class="icon-btn icon-btn--line" data-tile-move="-1" aria-label="Đưa ô ảnh ' + (i + 1) + ' lên"' + (i === 0 ? ' disabled' : '') + '>' + UP + '</button>' +
        '<button type="button" class="icon-btn icon-btn--line" data-tile-move="1" aria-label="Đưa ô ảnh ' + (i + 1) + ' xuống"' + (i === n - 1 ? ' disabled' : '') + '>' + DOWN + '</button>' +
        '<button type="button" class="icon-btn icon-btn--line" data-tile-del aria-label="Bỏ ô ảnh ' + (i + 1) + '">' + ICON.close + '</button>' +
      '</div>' +
    '</div>';
  }
  function onTileFile(input) {
    var row = input.closest('[data-tile-k]'), t = tileByK(row.getAttribute('data-tile-k')), file = input.files && input.files[0];
    input.value = '';
    if (!t || !file) return;
    var m = $('[data-tile-msg]', row), say = function (s, err) { m.textContent = s; m.hidden = !s; m.classList.toggle('is-err', !!err); };
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { say('Chỉ nhận ảnh JPG, PNG hoặc WebP.', true); return; }
    if (file.size > 10 * 1024 * 1024) { say('Ảnh tối đa 10MB — hãy nén ảnh rồi thử lại.', true); return; }
    var K = A.cms;
    if (!K || !K.uploadFile) { say('Chưa sẵn sàng tải ảnh — tải lại trang rồi thử lại.', true); return; }
    var lbl = $('[data-tile-uplabel]', row), warn = [];
    (K.probe ? K.probe(file, 'image') : Promise.resolve(null)).then(function (d) {
      if (d && d[0] < TILE.w * 0.7) warn.push('⚠ Ảnh nhỏ hơn gợi ý (' + d[0] + ' × ' + d[1] + ' px) — có thể bị mờ.');
      if (d && Math.abs(d[0] / d[1] - TILE.w / TILE.h) / (TILE.w / TILE.h) > 0.15) warn.push('⚠ Khác tỉ lệ ' + TILE.w + ' × ' + TILE.h + ' — ảnh sẽ bị cắt bớt.');
      if (file.size > TILE.kb * 1024) warn.push('⚠ Dung lượng ' + Math.round(file.size / 1024) + ' KB — trang sẽ tải chậm, nên nén lại.');
      return K.uploadFile(file, function (p) { if (lbl) lbl.textContent = 'Đang tải ' + Math.round(p * 100) + '%'; });
    }).then(function (r) {
      var url = A.safeImg(r && r.url); if (!url) throw { message: 'Máy chủ trả về đường dẫn không hợp lệ.' };
      t.img = url;
      renderTiles();
      var row2 = $('[data-tile-k="' + CSS.escape(t._k) + '"]');
      if (row2) { var m2 = $('[data-tile-msg]', row2); m2.textContent = ['Đã tải ảnh — bấm Lưu để áp dụng.'].concat(warn).join(' '); m2.hidden = false; }
      bar();
    }, function (e) { if (lbl) lbl.textContent = t.img ? 'Đổi ảnh' : 'Tải ảnh'; if (e && e.status !== 401) say((e && e.message) || 'Tải ảnh thất bại.', true); });
  }

  // ═══ Lưu / hủy ═════════════════════════════════════════════════════════════
  function validate() {
    var cats = T.d.cats, seen = {};
    for (var i = 0; i < cats.length; i++) {
      var c = cats[i], n = i + 1;
      if (!c.name.vi.trim()) return [c, 'name.vi', 'Danh mục thứ ' + n + ' chưa có tên tiếng Việt.'];
      if (!c.id) return [c, 'id', 'Danh mục “' + c.name.vi.trim() + '” chưa có mã trên đường dẫn.'];
      if (!ID_RE.test(c.id) || c.id.length > 20) return [c, 'id', 'Mã “' + c.id + '” chỉ gồm chữ thường không dấu, số và dấu gạch ngang (tối đa 20 ký tự).'];
      if (seen[c.id]) return [c, 'id', 'Mã “' + c.id + '” bị trùng với danh mục khác.'];
      seen[c.id] = 1;
      if (!(c.warranty >= 0 && c.warranty <= 120)) return [c, 'warranty', 'Bảo hành của “' + c.name.vi.trim() + '” phải từ 0 đến 120 tháng.'];
    }
    if (!cats.length) return [null, '', 'Cần ít nhất một danh mục.'];
    for (var j = 0; j < T.d.tiles.length; j++) {
      var t = T.d.tiles[j];
      if (!A.safeImg(t.img)) return [t, 'img', 'Ô ảnh thứ ' + (j + 1) + ' chưa có ảnh — tải ảnh hoặc bỏ ô này.'];
      if (!seen[t.cat]) return [t, 'cat', 'Ô ảnh thứ ' + (j + 1) + ' chưa chọn danh mục (hoặc danh mục đã bị xóa).'];
    }
    return null;
  }
  function showInvalid(v) {
    msg(v[2]); A.toast(v[2], 'err');
    var it = v[0]; if (!it) return;
    if (it.name) { // danh mục
      T.open[it._k] = true; renderCats();
      var f = $('[data-cat-k="' + CSS.escape(it._k) + '"] [data-cf="' + v[1] + '"]');
      if (f) { f.classList.add('is-invalid'); f.focus(); f.scrollIntoView({ block: 'center' }); }
    } else {
      var row = $('[data-tile-k="' + CSS.escape(it._k) + '"]');
      if (row) { var g = $(v[1] === 'cat' ? '[data-tf="cat"]' : '[data-tile-file]', row); row.scrollIntoView({ block: 'center' }); if (g && v[1] === 'cat') g.focus(); }
    }
  }
  function save(btn) {
    if (!T.d) return;
    var v = validate();
    if (v) { showInvalid(v); return; }
    msg('');
    var body = plainDraft(T.d);
    A.setBusy(btn, true);
    A.api('/settings', { method: 'PUT', body: { shop: { categories: body.categories, tiles: body.tiles } } }).then(function (d) {
      A.setBusy(btn, false);
      SS.set(d);
      var dropped = body.tiles.length - ((d.shop && d.shop.tiles) || []).length;
      initDraft(); render();
      A.toast('Đã lưu danh mục — Shop cập nhật ngay.' + (dropped > 0 ? ' (' + dropped + ' ô ảnh không hợp lệ đã bị bỏ)' : ''), 'ok', { href: '/shop', label: 'Xem trang ↗' });
    }, function (e) {
      A.setBusy(btn, false);
      if (e && e.status !== 401 && e.status !== 403) {
        msg(e.message); A.toast(e.message, 'err');
        // số sản phẩm có thể đã đổi (vd. vừa thêm sản phẩm ở tab khác) → tải lại để khóa nút Xóa cho đúng
        SS.loadProducts().then(function () { if (on() && T.d) renderCats(); });
      }
    });
  }
  function discard() {
    if (!dirty()) return;
    A.confirmDialog({ title: 'Bỏ thay đổi chưa lưu?', body: 'Danh mục và ô ảnh sẽ trở lại như lần lưu gần nhất.', ok: 'Bỏ thay đổi', cancel: 'Quay lại' }).then(function (yes) {
      if (!yes) return;
      initDraft(); msg(''); render();
    });
  }
  function restoreDefaults() {
    var defs = defaults(); if (!defs.length) return;
    var keep = defs.map(function (c) { return c.id; }), lost = {};
    products().forEach(function (p) { if (keep.indexOf(p.cat) < 0) lost[p.cat] = (lost[p.cat] || 0) + 1; });
    var ids = Object.keys(lost);
    if (ids.length) {
      var names = ids.map(function (id) { var c = catOf(id); return '“' + (c ? c.name.vi : id) + '” (' + lost[id] + ' sản phẩm)'; }).join(', ');
      A.confirmDialog({ title: 'Chưa khôi phục được', body: 'Bộ danh mục mặc định không có ' + names + '. Hãy chuyển các sản phẩm đó sang danh mục khác ở mục Sản phẩm trước.', ok: 'Đã hiểu', cancel: 'Đóng' });
      return;
    }
    A.confirmDialog({ title: 'Khôi phục danh mục mặc định?', body: 'Danh sách sẽ trở về 4 danh mục gốc (Găng tay, Áo & Hoodie, Phụ kiện, Đồ tập) với tên, mô tả, bảo hành và bảng size ban đầu. Danh mục thêm mới sẽ bị bỏ. Bấm “Lưu” để áp dụng.', ok: 'Khôi phục', cancel: 'Quay lại' })
      .then(function (yes) {
        if (!yes) return;
        T.d.cats = defs.map(function (c) { var x = normCat(c); x._k = key(); return x; });
        T.open = {};
        renderCats(); renderTiles(); bar();
        A.toast('Đã đưa về danh mục mặc định — bấm Lưu để áp dụng.', 'info');
      });
  }

  // ═══ Sự kiện ═══════════════════════════════════════════════════════════════
  document.addEventListener('input', function (e) {
    var t = e.target; if (!(t instanceof Element) || !on() || !T.d) return;
    var n;
    if (t.matches('[data-cf]') && (n = t.closest('[data-cat-k]'))) {
      var c = catByK(n.getAttribute('data-cat-k')), f = t.getAttribute('data-cf'); if (!c) return;
      t.classList.remove('is-invalid');
      if (f === 'id') {
        var v = t.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').slice(0, 20);
        if (v !== t.value) { var pos = t.selectionStart; t.value = v; try { t.setSelectionRange(pos, pos); } catch (er) { /* bỏ qua */ } }
        c.id = v.replace(/^-+|-+$/g, ''); c._idTouched = true;
      } else if (f === 'warranty') {
        c.warranty = t.value === '' ? 0 : Math.round(Number(t.value) || 0);
      } else if (f === 'weight') c.weight = t.value;
      else {
        var p = f.split('.'); c[p[0]][p[1]] = t.value;
        // danh mục mới: mã tự tạo theo tên tiếng Việt cho tới khi sửa tay
        if (f === 'name.vi' && c._new && !c._idTouched) {
          c.id = uniqueSlug(slug(t.value), c);
          var idIn = $('[data-cf="id"]', n); if (idIn) idIn.value = c.id;
        }
      }
      patchHead(c);
      if (f === 'name.vi' || f === 'id') { var keepTiles = T.d.tiles.length; if (keepTiles) renderTiles(); }
    } else if (t.matches('[data-tf]') && (n = t.closest('[data-tile-k]'))) {
      var tl = tileByK(n.getAttribute('data-tile-k')), tf = t.getAttribute('data-tf'); if (!tl) return;
      if (tf === 'title.vi') tl.title.vi = t.value; else if (tf === 'title.en') tl.title.en = t.value;
    }
    bar();
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!(t instanceof Element) || !on() || !T.d) return;
    var n;
    if (t.matches('[data-cat-hidden]') && (n = t.closest('[data-cat-k]'))) {
      var c = catByK(n.getAttribute('data-cat-k')); if (!c) return;
      c.hidden = t.checked;
      renderCats('[data-cat-k="' + CSS.escape(c._k) + '"] [data-cat-hidden]'); renderTiles();
    } else if (t.matches('[data-cf="guide"]') && (n = t.closest('[data-cat-k]'))) {
      catByK(n.getAttribute('data-cat-k')).guide = t.value;
    } else if (t.matches('[data-cf="warranty"]') && (n = t.closest('[data-cat-k]'))) {
      var c2 = catByK(n.getAttribute('data-cat-k')), w = Math.max(0, Math.min(120, Math.round(Number(t.value) || 0)));
      c2.warranty = w; t.value = w;
    } else if (t.matches('[data-tf="cat"]') && (n = t.closest('[data-tile-k]'))) {
      var tl = tileByK(n.getAttribute('data-tile-k')); tl.cat = t.value;
      var cc = catOf(t.value);
      if (cc && !tl.title.vi.trim() && !tl.title.en.trim()) { tl.title.vi = cc.name.vi; tl.title.en = cc.name.en; }
      renderTiles('[data-tile-k="' + CSS.escape(tl._k) + '"] [data-tf="cat"]');
    } else if (t.matches('[data-tile-file]')) { onTileFile(t); return; }
    bar();
  });
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null; if (!t || !on() || !T.d) return;
    var n, card, c, i, list;
    if ((n = t.closest('[data-cat-save]'))) { save(n); return; }
    if (t.closest('[data-cat-discard]')) { discard(); return; }
    if ((n = t.closest('[data-cat-products]'))) { e.preventDefault(); A.openProducts(n.getAttribute('data-cat-products')); return; }
    if ((n = t.closest('[data-cat-toggle]'))) {
      card = n.closest('[data-cat-k]'); var k = card.getAttribute('data-cat-k');
      T.open[k] = !T.open[k];
      renderCats('[data-cat-k="' + CSS.escape(k) + '"] [data-cat-toggle]');
      return;
    }
    if ((n = t.closest('[data-cat-move]'))) {
      card = n.closest('[data-cat-k]'); list = T.d.cats; c = catByK(card.getAttribute('data-cat-k')); i = list.indexOf(c);
      var to = i + (+n.getAttribute('data-cat-move'));
      if (to < 0 || to >= list.length) return;
      list.splice(i, 1); list.splice(to, 0, c);
      renderCats(); renderTiles(); bar();
      var b = $('[data-cat-k="' + CSS.escape(c._k) + '"] [data-cat-move="' + n.getAttribute('data-cat-move') + '"]');
      if (b && !b.disabled) b.focus(); else { b = $('[data-cat-k="' + CSS.escape(c._k) + '"] [data-cat-move]:not([disabled])'); if (b) b.focus(); }
      return;
    }
    if ((n = t.closest('[data-cat-del]'))) {
      card = n.closest('[data-cat-k]'); c = catByK(card.getAttribute('data-cat-k'));
      var isNew = savedIds().indexOf(c.id) < 0 || c._new, cnt = isNew ? 0 : countOf(c.id), name = c.name.vi.trim() || c.id || 'danh mục mới';
      if (cnt) { A.toast('Danh mục “' + name + '” đang có ' + cnt + ' sản phẩm — chuyển các sản phẩm sang danh mục khác (mục Sản phẩm) rồi mới xóa được.', 'err'); return; }
      var go = function () {
        T.d.cats.splice(T.d.cats.indexOf(c), 1); delete T.open[c._k];
        renderCats(); renderTiles(); bar();
        var add = $('[data-cat-add]'); if (add) add.focus();
      };
      if (isNew && !c.name.vi.trim()) { go(); return; }
      A.confirmDialog({ title: 'Xóa danh mục “' + name + '”?', body: isNew ? 'Danh mục mới này sẽ bị bỏ.' : 'Danh mục sẽ biến mất khỏi Shop sau khi bấm “Lưu”. Ô ảnh đang dẫn tới danh mục này cần chọn lại danh mục.', ok: 'Xóa', cancel: 'Quay lại' })
        .then(function (yes) { if (yes) go(); });
      return;
    }
    if (t.closest('[data-cat-add]')) {
      var nc = normCat({ id: '', name: { vi: '', en: '' }, warranty: 6, guide: 'free' });
      nc._k = key(); nc._new = true;
      T.d.cats.push(nc); T.open[nc._k] = true;
      renderCats('[data-cat-k="' + CSS.escape(nc._k) + '"] [data-cf="name.vi"]'); bar();
      var cardN = $('[data-cat-k="' + CSS.escape(nc._k) + '"]'); if (cardN) cardN.scrollIntoView({ block: 'center' });
      return;
    }
    if (t.closest('[data-cat-defaults]')) { restoreDefaults(); return; }
    if (t.closest('[data-tile-add]')) {
      if (T.d.tiles.length >= MAX_TILES) return;
      var used = T.d.tiles.map(function (x) { return x.cat; });
      var pick = T.d.cats.filter(function (x) { return ID_RE.test(x.id) && !x.hidden && used.indexOf(x.id) < 0; })[0] || T.d.cats.filter(function (x) { return ID_RE.test(x.id); })[0];
      var nt = normTile({ cat: pick ? pick.id : '', img: '', title: pick ? pick.name : null }); nt._k = key();
      T.d.tiles.push(nt);
      renderTiles('[data-tile-k="' + CSS.escape(nt._k) + '"] [data-tf="cat"]'); bar();
      return;
    }
    if ((n = t.closest('[data-tile-move], [data-tile-del]'))) {
      var row = n.closest('[data-tile-k]'), tl = tileByK(row.getAttribute('data-tile-k')); list = T.d.tiles; i = list.indexOf(tl);
      if (n.hasAttribute('data-tile-del')) {
        var drop = function () { list.splice(i, 1); renderTiles(); bar(); var a = $('[data-tile-add]'); if (a) a.focus(); };
        if (tl.img) A.confirmDialog({ title: 'Bỏ ô ảnh ' + (i + 1) + '?', body: 'Ô ảnh sẽ biến mất khỏi Shop sau khi bấm “Lưu”.', ok: 'Bỏ ô ảnh', cancel: 'Quay lại' }).then(function (yes) { if (yes) drop(); });
        else drop();
        return;
      }
      var to2 = i + (+n.getAttribute('data-tile-move'));
      if (to2 < 0 || to2 >= list.length) return;
      list.splice(i, 1); list.splice(to2, 0, tl);
      renderTiles(); bar();
      var b2 = $('[data-tile-k="' + CSS.escape(tl._k) + '"] [data-tile-move="' + n.getAttribute('data-tile-move') + '"]');
      if (b2 && !b2.disabled) b2.focus(); else { b2 = $('[data-tile-k="' + CSS.escape(tl._k) + '"] [data-tile-move]:not([disabled])'); if (b2) b2.focus(); }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (!on() || !T.d) return;
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      var b = $('[data-savebar="cats"]:not([hidden]) [data-cat-save]'); if (b) b.click();
    }
  });

  A.register(VIEW, {
    title: 'Danh mục sản phẩm',
    mount: mount,
    update: function (main, manual) {
      if (!manual) return;
      if (dirty()) { A.toast('Đang có thay đổi chưa lưu — hãy lưu hoặc hủy trước khi tải lại.', 'info'); return; }
      load(true);
    },
    isDirty: dirty,
    dirtyText: function () { return 'Danh mục sản phẩm có thay đổi chưa lưu.'; },
    discard: function () { T.d = null; T.orig = ''; },
    reset: function () { T.d = null; T.orig = ''; T.open = {}; },
  });
})();
