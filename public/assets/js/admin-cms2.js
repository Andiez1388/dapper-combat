/* Dapper Combat — Quản trị: Icon · Liên kết & nút · Bố cục trang · Phông chữ · Mã tùy chỉnh
   Dùng chung trạng thái và thanh “Lưu” của admin-content.js qua A.cms. Mọi giá trị từ API đều qua esc();
   SVG được làm sạch (sanitizeSvg) trước khi hiện. */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A || !A.cms) return;
  var K = A.cms, C = K.C, esc = A.esc, ICON = A.ICON;
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var UP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7"/></svg>';
  var DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>';
  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></svg>';
  var ICON_HINT = 'Nên dùng SVG nét đơn sắc để icon tự đổi màu theo chữ; PNG nền trong suốt, tối thiểu 96×96px.';
  var ST = { icTab: '', layTab: '', lkTab: '', lkQ: '' };

  function head(title) { return A.pageHead(title, { eyebrow: 'Nội dung website', stamp: false, count: false }) + '<div data-cms-root></div>'; }
  function rootOf(main) { return $('[data-cms-root]', main || document); }
  // chưa tải xong → hiện trạng thái tải rồi vẽ lại
  function needData(main, view, again) {
    var root = rootOf(main); if (!root) return true;
    if (K.ready()) return false;
    root.innerHTML = K.stateHtml();
    if (!C.loading) K.load().then(function () { if (A.view() === view) again(); });
    else C.loading.then(function () { if (A.view() === view) again(); });
    return true;
  }
  function pageTabs(base, ids, active, meta) {
    return K.tabsHtml(base, ids.map(function (id) { return C.idx.page[id]; }).filter(Boolean), active, meta);
  }
  function svgFileText(file) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result || '')); }; r.onerror = function () { rej({ message: 'Không đọc được file.' }); }; r.readAsText(file); });
  }

  // ═══ Hộp chọn icon (thư viện · tải lên · dán mã) ═══════════════════════════
  var dlg = null, done = null;
  function libGroups() {
    var g = {}, order = [];
    (window.DC_ICON_LIB || []).forEach(function (x) { if (!g[x.group]) { g[x.group] = []; order.push(x.group); } g[x.group].push({ id: 'lib:' + x.key, label: x.label, svg: x.svg }); });
    var seen = {}, web = [];
    ((C.cat && C.cat.icons) || []).forEach(function (ic) { var s = K.sanitizeSvg(ic.svg); if (s && !seen[s]) { seen[s] = 1; web.push({ id: 'web:' + ic.key, label: ic.label, svg: s }); } });
    if (web.length) { g['Icon đang có trên web'] = web; order.push('Icon đang có trên web'); }
    return order.map(function (k) { return [k, g[k]]; });
  }
  function buildDlg() {
    dlg = document.createElement('dialog');
    dlg.className = 'dlg dlg--wide ipk';
    dlg.setAttribute('aria-labelledby', 'ipkTitle');
    dlg.innerHTML = '<div class="ipk__wrap">' +
      '<header class="ipk__head"><h2 class="dlg__title" id="ipkTitle">Chọn icon</h2><button class="icon-btn" type="button" data-ipk-close aria-label="Đóng">' + ICON.close + '</button></header>' +
      '<p class="set-note">' + esc(ICON_HINT) + '</p>' +
      '<div class="ipk__tabs" role="tablist">' +
        '<button type="button" role="tab" data-ipk-tab="lib">Thư viện</button><button type="button" role="tab" data-ipk-tab="up">Tải lên SVG / PNG</button><button type="button" role="tab" data-ipk-tab="paste">Dán mã SVG</button></div>' +
      '<div class="ipk__pane" data-ipk-pane="lib"><label class="search ipk__search">' + ICON.search + '<span class="sr">Tìm icon</span><input type="search" data-ipk-q placeholder="Tìm icon, vd: điện thoại, giỏ hàng…" autocomplete="off"></label><div class="ipk__grid" data-ipk-grid></div></div>' +
      '<div class="ipk__pane" data-ipk-pane="up" hidden><p class="set-note">Chọn file .svg (đổi màu theo chữ) hoặc .png / .webp nền trong suốt.</p>' +
        '<label class="btn btn--line file-btn">' + ICON.upload + '<span data-ipk-uplabel>Chọn file icon</span><input class="sr" type="file" accept=".svg,image/svg+xml,image/png,image/webp" data-ipk-file></label>' +
        '<div class="set-msg" data-ipk-upmsg hidden></div></div>' +
      '<div class="ipk__pane" data-ipk-pane="paste" hidden><label class="field"><span class="field__label">Mã SVG (bắt đầu bằng &lt;svg)</span>' +
        '<textarea rows="6" class="code-ta" data-ipk-svg spellcheck="false" placeholder="&lt;svg viewBox=&quot;0 0 24 24&quot; …&gt;…&lt;/svg&gt;"></textarea></label>' +
        '<div class="ipk__pv"><span class="ico-chip ico-chip--dark" style="--sz:32px" data-ipk-pv></span><span class="ico-chip" style="--sz:32px" data-ipk-pv2></span><span class="field__hint" data-ipk-pmsg>Dán mã để xem trước.</span></div>' +
        '<div class="dlg__actions"><button class="btn btn--primary" type="button" data-ipk-use disabled>Dùng mã này</button></div></div>' +
    '</div>';
    document.body.appendChild(dlg);
    dlg.addEventListener('close', function () { var r = done; done = null; if (r) r(dlg._result || null); });
    dlg.addEventListener('click', function (e) {
      var t = e.target instanceof Element ? e.target : null; if (!t) return;
      if (t === dlg || t.closest('[data-ipk-close]')) { dlg._result = null; dlg.close(); return; }
      var b;
      if ((b = t.closest('[data-ipk-tab]'))) { showTab(b.getAttribute('data-ipk-tab')); return; }
      if ((b = t.closest('[data-ipk-pick]'))) {
        var id = b.getAttribute('data-ipk-pick'), hit = null;
        libGroups().forEach(function (g) { g[1].forEach(function (x) { if (x.id === id) hit = x; }); });
        if (hit) { dlg._result = { svg: hit.svg }; dlg.close(); }
        return;
      }
      if (t.closest('[data-ipk-use]')) {
        var raw = $('[data-ipk-svg]', dlg).value;
        if (K.sanitizeSvg(raw)) { dlg._result = { svg: raw.trim() }; dlg.close(); }
      }
    });
    dlg.addEventListener('input', function (e) {
      var t = e.target;
      if (t.matches('[data-ipk-q]')) renderGrid(t.value);
      if (t.matches('[data-ipk-svg]')) {
        var s = K.sanitizeSvg(t.value), ok = !!s && t.value.length <= 60000;
        $('[data-ipk-pv]', dlg).innerHTML = ok ? s : ''; $('[data-ipk-pv2]', dlg).innerHTML = ok ? s : '';
        $('[data-ipk-pmsg]', dlg).textContent = !t.value.trim() ? 'Dán mã để xem trước.' : ok ? 'Xem trước trên nền tối và nền sáng.' : 'Mã chưa đúng — cần một thẻ <svg>…</svg> hoàn chỉnh.';
        $('[data-ipk-use]', dlg).disabled = !ok;
      }
    });
    dlg.addEventListener('change', function (e) {
      var t = e.target; if (!t.matches('[data-ipk-file]')) return;
      var file = t.files && t.files[0]; t.value = '';
      if (!file) return;
      var msg = $('[data-ipk-upmsg]', dlg), say = function (s, err) { msg.textContent = s; msg.hidden = !s; msg.classList.toggle('is-err', !!err); };
      fileToIcon(file, say, $('[data-ipk-uplabel]', dlg)).then(function (v) { if (v) { dlg._result = v; dlg.close(); } });
    });
  }
  function showTab(tab) {
    $$('[data-ipk-tab]', dlg).forEach(function (b) { var on = b.getAttribute('data-ipk-tab') === tab; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', String(on)); });
    $$('[data-ipk-pane]', dlg).forEach(function (p) { p.hidden = p.getAttribute('data-ipk-pane') !== tab; });
    var f = tab === 'lib' ? $('[data-ipk-q]', dlg) : tab === 'paste' ? $('[data-ipk-svg]', dlg) : $('[data-ipk-file]', dlg);
    if (f) setTimeout(function () { f.focus(); }, 30);
  }
  function renderGrid(q) {
    var nq = A.norm(q || '').trim(), html = '';
    libGroups().forEach(function (g) {
      var items = g[1].filter(function (x) { return !nq || A.norm(x.label + ' ' + g[0]).indexOf(nq) >= 0; });
      if (!items.length) return;
      html += '<h3 class="ipk__gt">' + esc(g[0]) + '</h3><div class="ipk__set">' + items.map(function (x) {
        return '<button type="button" class="ipk__ic" data-ipk-pick="' + esc(x.id) + '" title="' + esc(x.label) + '"><span class="ipk__svg">' + x.svg + '</span><span class="ipk__lab">' + esc(x.label) + '</span></button>';
      }).join('') + '</div>';
    });
    $('[data-ipk-grid]', dlg).innerHTML = html || '<p class="mini-state">Không có icon nào khớp.</p>';
  }
  // file icon → {svg} (SVG đọc thành chữ) hoặc {url} (PNG / WebP tải lên máy chủ)
  function fileToIcon(file, say, label) {
    var name = String(file.name || '').toLowerCase();
    if (file.type === 'image/svg+xml' || /\.svg$/.test(name)) {
      if (file.size > 60000) { say('File SVG quá lớn (tối đa 60 KB).', true); return Promise.resolve(null); }
      return svgFileText(file).then(function (txt) {
        if (!K.sanitizeSvg(txt)) { say('File SVG không đọc được — thử xuất lại từ phần mềm thiết kế.', true); return null; }
        return { svg: txt.trim() };
      }, function (e) { say(e.message, true); return null; });
    }
    if (!/^image\/(png|webp)$/.test(file.type)) { say('Chỉ nhận SVG, PNG hoặc WebP.', true); return Promise.resolve(null); }
    if (file.size > 2 * 1024 * 1024) { say('Ảnh icon tối đa 2MB.', true); return Promise.resolve(null); }
    var orig = label ? label.textContent : '';
    return K.probe(file, 'image').then(function (d) {
      if (d && (d[0] < 96 || d[1] < 96)) A.toast('Icon nhỏ hơn 96×96px (' + d[0] + '×' + d[1] + ') — có thể bị mờ.', 'info');
      return K.uploadFile(file, function (p) { if (label) label.textContent = 'Đang tải ' + Math.round(p * 100) + '%'; });
    }).then(function (r) {
      if (label) label.textContent = orig;
      var u = A.safeImg(r && r.url); if (!u) { say('Máy chủ trả về đường dẫn không hợp lệ.', true); return null; }
      return { url: u };
    }, function (e) { if (label) label.textContent = orig; say((e && e.message) || 'Tải lên thất bại.', true); return null; });
  }
  K.iconPicker = function (opt) {
    opt = opt || {};
    if (!dlg) buildDlg();
    if (done) return Promise.resolve(null);
    $('#ipkTitle').textContent = opt.title ? 'Chọn icon: ' + opt.title : 'Chọn icon';
    $('[data-ipk-q]', dlg).value = ''; $('[data-ipk-svg]', dlg).value = '';
    $('[data-ipk-pv]', dlg).innerHTML = ''; $('[data-ipk-pv2]', dlg).innerHTML = ''; $('[data-ipk-use]', dlg).disabled = true;
    $('[data-ipk-upmsg]', dlg).hidden = true;
    renderGrid('');
    dlg._result = null;
    return new Promise(function (res) { done = res; dlg.showModal(); showTab(opt.tab || 'lib'); });
  };

  // ═══ Icon ══════════════════════════════════════════════════════════════════
  function icMount(main, sub) { main.innerHTML = head('Icon'); icRoute(main, sub); }
  function icRoute(main, sub) {
    if (needData(main, 'cms-icons', function () { icRoute(main, sub); })) return;
    var pages = C.idx.pages.filter(function (p) { return (C.idx.pageIcons[p.id] || []).length; }).map(function (p) { return p.id; });
    ST.icTab = pages.indexOf(sub) >= 0 ? sub : (pages.indexOf(ST.icTab) >= 0 ? ST.icTab : pages[0] || '');
    icRender();
  }
  function icRender() {
    var root = rootOf(); if (!root || !K.ready()) return;
    var pages = C.idx.pages.filter(function (p) { return (C.idx.pageIcons[p.id] || []).length; }).map(function (p) { return p.id; });
    var list = C.idx.pageIcons[ST.icTab] || [], groups = [], by = {};
    list.forEach(function (ic) { var g = by[ic.section]; if (!g) { g = by[ic.section] = { id: ic.section, items: [] }; groups.push(g); } g.items.push(ic); });
    root.innerHTML = '<div class="cms-help"><p><strong>Icon trên website</strong> — thay bằng icon trong thư viện, tải file của bạn hoặc dán mã SVG. ' + esc(ICON_HINT) + ' Bấm “Lưu” để áp dụng.</p></div>' +
      pageTabs('cms-icons', pages, ST.icTab, function (p) {
        var n = (C.idx.pageIcons[p.id] || []).length, ed = (C.idx.pageIcons[p.id] || []).filter(function (ic) { return K.has(C.store.icons, ic.key); }).length;
        return esc(n) + ' icon' + (ed ? ' · ' + esc(ed) + ' đã thay' : '');
      }) +
      (groups.length ? groups.map(function (g) {
        var s = C.idx.sec[g.id];
        return '<section class="cms-mgroup"><header class="cms-mgroup__head"><h2 class="cms-mgroup__title">' + esc(s ? s.label : g.id) + '</h2>' +
          '<span class="cms-sec__meta">' + esc(g.items.length) + ' icon</span></header><div class="ico-grid">' + g.items.map(function (ic) { return icCard(ic.key); }).join('') + '</div></section>';
      }).join('') : A.emptyHtml('Trang này không có icon để thay', '')) + K.savebarHtml();
    K.refreshBar();
  }
  function icCard(k) {
    var ic = C.idx.icon[K.splitKey(k).base]; if (!ic) return '';
    var ov = K.effGet('icons', k), sz = K.iconSize(k), pend = K.has(C.pend.icons, k) || K.has(C.pend.hide, k), mk = K.iconMarkup(k);
    var loc = K.locateUrl(k, ic.section, ic.page);
    return '<article class="ico-card' + (pend ? ' is-pending' : '') + (K.isHidden(k) ? ' is-hidden' : '') + '" data-ikey="' + esc(k) + '" data-iccard>' +
      '<div class="ico-card__pv"><span class="ico-chip ico-chip--dark" style="--sz:' + sz + 'px" title="Trên nền tối">' + mk + '</span><span class="ico-chip" style="--sz:' + sz + 'px" title="Trên nền sáng">' + mk + '</span>' +
        '<span class="field__hint">' + sz + ' px</span></div>' +
      '<div class="ico-card__body"><h3 class="cms-mcard__title">' + esc(ic.label || k) + '</h3>' +
        '<p class="field__hint">' + (ic.count > 1 ? 'Dùng ở ' + esc(ic.count) + ' chỗ — đổi một lần là đổi cả ' + esc(ic.count) + '. ' : '') +
          (ov ? '<span class="badge badge--mid">Đã thay</span> ' : '') + (pend ? '<span class="badge badge--done">Chưa lưu</span>' : '') + '</p>' +
        '<div class="ico-card__act">' +
          '<button type="button" class="btn btn--line btn--sm" data-ic-lib>Chọn từ thư viện</button>' +
          '<label class="btn btn--line btn--sm file-btn"><span data-ic-uplabel>Tải lên SVG / PNG</span><input class="sr" type="file" accept=".svg,image/svg+xml,image/png,image/webp" data-icfile></label>' +
          '<button type="button" class="btn btn--quiet btn--sm" data-ic-paste>Dán mã SVG</button>' +
        '</div>' +
        '<div class="ico-card__foot">' + K.hideToggleHtml(k, 'icon này') +
          (ov || pend ? '<button type="button" class="cms-link" data-ic-reset>Khôi phục icon gốc</button>' : '') +
          '<a class="cms-row__locate" href="' + esc(loc) + '" target="_blank" rel="noopener">Xem trên trang ↗</a></div>' +
        '<div class="set-msg" data-icmsg hidden></div>' +
      '</div></article>';
  }
  function icRedraw(el) {
    var card = el.closest('[data-iccard]'); if (!card) return;
    var tmp = document.createElement('div'); tmp.innerHTML = icCard(card.getAttribute('data-ikey'));
    var fresh = tmp.firstChild; card.parentNode.replaceChild(fresh, card);
    K.refreshBar();
    return fresh;
  }
  function icSet(card, v) {
    var k = card.getAttribute('data-ikey');
    K.setPend('icons', k, v);
    var fresh = icRedraw(card);
    if (fresh) { var b = $('[data-ic-lib]', fresh); if (b) b.focus(); }
  }

  // ═══ Liên kết & nút ════════════════════════════════════════════════════════
  function lkPages() {
    return C.idx.pages.map(function (p) { return p.id; }).filter(function (id) {
      return (C.cat.links || []).some(function (l) { return l.page === id; }) || (C.idx.pageFields[id] || []).some(function (f) { return f.type === 'link'; });
    });
  }
  function lkMount(main, sub) { main.innerHTML = head('Liên kết & nút'); lkRoute(main, sub); }
  function lkRoute(main, sub) {
    if (needData(main, 'cms-links', function () { lkRoute(main, sub); })) return;
    var pages = lkPages();
    ST.lkTab = pages.indexOf(sub) >= 0 ? sub : (pages.indexOf(ST.lkTab) >= 0 ? ST.lkTab : pages[0] || '');
    var root = rootOf();
    root.innerHTML = '<div class="cms-help"><p><strong>Mọi nút và liên kết trên web</strong> — đổi trang sẽ mở khi khách bấm (chọn nhanh trong danh sách hoặc gõ đường dẫn), hoặc ẩn nút. ' +
      'Ô để trống = dùng đường dẫn gốc. Bấm “Lưu” để áp dụng.</p></div>' +
      pageTabs('cms-links', pages, ST.lkTab, function (p) {
        var n = (C.cat.links || []).filter(function (l) { return l.page === p.id; }).length + (C.idx.pageFields[p.id] || []).filter(function (f) { return f.type === 'link'; }).length;
        return esc(n) + ' liên kết';
      }) +
      '<div class="cms-tools"><label class="search cms-search">' + ICON.search + '<span class="sr">Tìm liên kết</span><input type="search" data-lk-q placeholder="Tìm theo chữ trên nút hoặc đường dẫn…" autocomplete="off" value="' + esc(ST.lkQ) + '"></label></div>' +
      '<div data-lk-list></div>' + K.savebarHtml();
    lkList();
    K.refreshBar();
  }
  function lkList() {
    var box = $('[data-lk-list]'); if (!box) return;
    var q = A.norm(ST.lkQ).trim(), secs = C.idx.secs[ST.lkTab] || [], html = '';
    var hit = function (label, href) { return !q || A.norm(label + ' ' + href).indexOf(q) >= 0; };
    secs.forEach(function (s) {
      var rows = '';
      (C.idx.secLinks[s.id] || []).forEach(function (l) {
        var cur = K.effGet('links', l.key);
        if (!hit(l.label || '', (cur || '') + ' ' + (l.href || ''))) return;
        rows += K.linkRowHtml(l.key);
      });
      (C.idx.fields[s.id] || []).filter(function (f) { return f.type === 'link'; }).forEach(function (f) {
        if (!hit(f.label || '', String(K.effGet('links', f.key) || '') + ' ' + K.linkDefault(f.key))) return;
        rows += K.rowHtml(f);
      });
      if (rows) html += '<section class="cms-sec is-open lk-sec"><div class="cms-sec__head"><p class="cms-sec__toggle lk-sec__title"><span class="cms-sec__label">' + esc(s.label) + '</span></p>' +
        '<a class="cms-sec__link" href="' + esc(K.locateUrl(s.id, s.id, s.page)) + '" target="_blank" rel="noopener" title="Xem khu vực này"><span class="cms-sec__link-t">Xem trang</span> ↗</a></div>' +
        '<div class="cms-sec__body">' + rows + '</div></section>';
    });
    box.innerHTML = html || A.emptyHtml(q ? 'Không có liên kết nào khớp' : 'Trang này không có liên kết để sửa', q ? 'Thử từ khóa khác.' : '');
  }

  // ═══ Bố cục trang ══════════════════════════════════════════════════════════
  function layPages() { return ['home', 'course', 'services', 'shop'].filter(function (id) { return C.idx.page[id]; }); }
  function layMount(main, sub) { main.innerHTML = head('Bố cục trang'); layRoute(main, sub); }
  function layRoute(main, sub) {
    if (needData(main, 'cms-layout', function () { layRoute(main, sub); })) return;
    var pages = layPages();
    ST.layTab = pages.indexOf(sub) >= 0 ? sub : (pages.indexOf(ST.layTab) >= 0 ? ST.layTab : pages[0]);
    layRender();
  }
  function isNav(b) { return /\.nav$/.test(b.sec || ''); }
  function blocksOf(page) {
    var bl = ((C.cat.blocks || {})[page] || []).slice(), st = K.effGet('layout', page) || {}, hide = st.hide || {};
    var order = Array.isArray(st.order) ? st.order : [];
    var movable = bl.filter(function (b) { return !b.fixed; });
    if (order.length) movable.sort(function (a, b) { var x = order.indexOf(a.id), y = order.indexOf(b.id); return (x < 0 ? 999 : x) - (y < 0 ? 999 : y); });
    var mi = 0;
    return bl.map(function (b) { var x = b.fixed ? b : movable[mi++]; return { b: x, off: !!hide[x.id] }; });
  }
  function layWrite(page, seq) {
    var bl = (C.cat.blocks || {})[page] || [], hide = {};
    seq.forEach(function (x) { if (x.off && !isNav(x.b)) hide[x.b.id] = true; });
    var order = seq.map(function (x) { return x.b.id; });
    var isDef = order.join(',') === bl.map(function (b) { return b.id; }).join(',') && !Object.keys(hide).length;
    K.setPend('layout', page, isDef ? null : { order: order, hide: hide });
  }
  function layRender() {
    var root = rootOf(); if (!root || !K.ready()) return;
    var page = ST.layTab, pages = layPages();
    var tabs = pageTabs('cms-layout', pages, page, function (p) {
      var bl = (C.cat.blocks || {})[p.id];
      if (!bl) return 'cố định';
      var st = K.effGet('layout', p.id) || {}, off = Object.keys(st.hide || {}).length;
      return esc(bl.length) + ' khu vực' + (off ? ' · ' + esc(off) + ' đang ẩn' : '');
    });
    var body;
    if (!(C.cat.blocks || {})[page]) {
      body = '<div class="state"><p class="state__title">Trang này chưa chia khu vực để sắp xếp</p><p>Bạn vẫn sửa được chữ, ảnh, icon và liên kết của trang ở các mục khác.</p></div>';
    } else {
      var seq = blocksOf(page), url = K.pageUrl(page), changed = K.has(C.pend.layout, page) ? C.pend.layout[page] != null : K.has(C.store.layout, page);
      var movIdx = seq.map(function (x, i) { return x.b.fixed ? -1 : i; }).filter(function (i) { return i >= 0; });
      body = '<ol class="lay-list">' + seq.map(function (x, i) {
        var b = x.b, nav = isNav(b), first = movIdx[0] === i, last = movIdx[movIdx.length - 1] === i;
        return '<li class="lay' + (x.off ? ' is-off' : '') + (b.fixed ? ' is-fixed' : '') + '" data-block="' + esc(b.id) + '">' +
          '<span class="lay__n" aria-hidden="true">' + (i + 1) + '</span>' +
          '<span class="lay__label"><strong>' + esc(b.label) + '</strong><small>' + (b.fixed ? 'Cố định — luôn ở vị trí này' : x.off ? 'Đang ẩn — khách không thấy khu vực này' : 'Đang hiện') + '</small></span>' +
          '<span class="lay__ctl">' +
            (b.fixed ? '<span class="lay__lock">' + LOCK + 'cố định</span>' :
              '<button type="button" class="icon-btn icon-btn--line" data-lay-move="-1" aria-label="Đưa “' + esc(b.label) + '” lên"' + (first ? ' disabled' : '') + '>' + UP + '</button>' +
              '<button type="button" class="icon-btn icon-btn--line" data-lay-move="1" aria-label="Đưa “' + esc(b.label) + '” xuống"' + (last ? ' disabled' : '') + '>' + DOWN + '</button>') +
            (nav ? '<span class="field__hint lay__navnote">Luôn hiện</span>' : '<label class="check lay__eye" title="Bật = khách thấy khu vực này"><input type="checkbox" data-lay-show' + (x.off ? '' : ' checked') + '>' +
              '<span class="switch__ui" aria-hidden="true"></span><span>Hiện</span></label>') +
            '<a class="btn btn--quiet btn--sm" href="' + esc(K.safePath(url + '?cms=' + encodeURIComponent(b.id))) + '" target="_blank" rel="noopener">Xem</a>' +
          '</span></li>';
      }).join('') + '</ol>' +
      '<div class="cms-list__foot">' + (changed ? '<button type="button" class="btn btn--quiet btn--sm" data-lay-reset>Khôi phục bố cục gốc</button>' : '') + '</div>';
    }
    root.innerHTML = '<div class="cms-help"><p><strong>Ẩn hoặc đổi thứ tự các khu vực của trang</strong> bằng nút ↑ ↓ và công tắc “Hiện”. Khu vực có ổ khóa (menu, chân trang…) đứng cố định. ' +
      'Bấm “Xem” để mở đúng khu vực trên trang. Bấm “Lưu” để áp dụng.</p></div>' + tabs + body + K.savebarHtml();
    K.refreshBar();
  }

  // ═══ Phông chữ ═════════════════════════════════════════════════════════════
  var FONT_GROUPS = [['display', 'Chữ đứng hẹp (tiêu đề)'], ['sans', 'Chữ thường'], ['serif', 'Chữ có chân'], ['mono', 'Chữ đều (mono)']];
  var SAMPLE = 'Dapper Combat — Tập Boxing đúng chuẩn 0123';
  var FONT_TYPES = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf' };
  var loadedCss = {}, loadedFace = {};
  function fontDefs() { return (C.cat && C.cat.fonts) || []; }
  function fontCss(name) {
    var f = fontDefs().filter(function (x) { return x.name === name; })[0];
    if (!f || loadedCss[name] || !/^https:\/\/fonts\.googleapis\.com\/css2\?[^"'<>\s]+$/.test(f.css || '')) return;
    loadedCss[name] = 1;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = f.css; document.head.appendChild(l);
  }
  function fontFace(name, url) {
    var key = name + '|' + url;
    if (loadedFace[key] || !window.FontFace || !/^\/assets\/uploads\/[\w.-]+\.(woff2|woff|ttf|otf)$/.test(url)) return;
    loadedFace[key] = 1;
    try { var ff = new FontFace(name, 'url(' + url + ')'); ff.load().then(function (x) { document.fonts.add(x); }, function () { /* bỏ qua */ }); } catch (e) { /* bỏ qua */ }
  }
  function famStack(name, group) { return '"' + String(name).replace(/["\\]/g, '') + '", ' + (group === 'mono' ? 'monospace' : group === 'serif' ? 'serif' : 'sans-serif'); }
  function fontCur(role) { var v = K.effGet('fonts', role.key); return v && v.name ? v : null; }
  function fMount(main) { main.innerHTML = head('Phông chữ'); fRender(); }
  function fRender() {
    var root = rootOf(); if (!root) return;
    if (needData(null, 'cms-fonts', fRender)) return;
    var roles = (C.cat && C.cat.fontRoles) || [];
    root.innerHTML = '<div class="cms-help"><p><strong>Phông chữ của website</strong> chia theo 4 vai trò. Chọn phông trong danh sách (đều có tiếng Việt) và xem trước ngay bên dưới, hoặc tải phông riêng của bạn. Bấm “Lưu” để áp dụng cho mọi trang.</p></div>' +
      roles.map(fRoleHtml).join('') + K.savebarHtml();
    roles.forEach(function (r) { fPreview(r); });
    K.refreshBar();
  }
  function fRoleHtml(r) {
    var cur = fontCur(r), name = cur ? cur.name : r.def, pend = K.has(C.pend.fonts, r.key);
    var groups = FONT_GROUPS.map(function (g) {
      var fs = fontDefs().filter(function (f) { return f.group === g[0]; });
      return fs.length ? '<optgroup label="' + esc(g[1]) + '">' + fs.map(function (f) {
        return '<option value="' + esc(f.name) + '"' + (!(cur && cur.url) && f.name === name ? ' selected' : '') + '>' + esc(f.name) + (f.name === r.def ? ' (mặc định)' : '') + '</option>';
      }).join('') + '</optgroup>' : '';
    }).join('');
    var custom = cur && cur.url ? '<option value="__custom__" selected>' + esc(cur.name) + ' (phông tải lên)</option>' : '';
    return '<section class="panel set-sec font-role' + (pend ? ' is-pending' : '') + '" data-frole="' + esc(r.key) + '">' +
      '<header class="panel__head"><h2 class="panel__title">' + esc(r.label) + '</h2><span class="cms-sec__flags">' +
        (pend ? '<span class="badge badge--done">Chưa lưu</span>' : '') + (cur ? '<span class="badge badge--mid">Đã đổi</span>' : '') + '</span></header>' +
      '<div class="set-body">' +
        '<label class="field"><span class="field__label">Phông chữ</span><select data-font-sel>' + custom + groups + '</select>' +
          '<small class="field__hint">Mặc định: ' + esc(r.def) + '. Chọn xong xem trước ngay bên dưới.</small></label>' +
        '<p class="font-prev" data-font-prev>' + esc(SAMPLE) + '</p>' +
        '<details class="font-up"><summary>Tải phông riêng (.woff2, .woff, .ttf, .otf · tối đa 5MB)</summary>' +
          '<div class="font-up__body"><label class="field"><span class="field__label">Tên phông</span><input type="text" maxlength="60" data-font-name placeholder="VD: Phông Thương Hiệu" autocomplete="off"></label>' +
          '<label class="btn btn--line btn--sm file-btn">' + ICON.upload + '<span data-font-uplabel>Chọn file phông</span><input class="sr" type="file" accept=".woff2,.woff,.ttf,.otf" data-font-file></label>' +
          '<p class="field__hint">Nhập tên trước, rồi chọn file. Phông phải có đủ dấu tiếng Việt.</p><div class="set-msg" data-font-msg hidden></div></div></details>' +
        (cur || pend ? '<div class="set-actions"><button type="button" class="btn btn--quiet btn--sm" data-font-reset>Dùng phông mặc định</button></div>' : '') +
      '</div></section>';
  }
  function fPreview(r) {
    var box = $('[data-frole="' + CSS.escape(r.key) + '"]'); if (!box) return;
    var cur = fontCur(r), name = cur ? cur.name : r.def, f = fontDefs().filter(function (x) { return x.name === name; })[0];
    if (cur && cur.url) fontFace(cur.name, cur.url); else fontCss(name);
    $('[data-font-prev]', box).style.fontFamily = famStack(name, f ? f.group : (r.key === 'mono' ? 'mono' : 'sans'));
  }
  function fRedraw(roleKey) {
    var r = ((C.cat && C.cat.fontRoles) || []).filter(function (x) { return x.key === roleKey; })[0], box = $('[data-frole="' + CSS.escape(roleKey) + '"]');
    if (!r || !box) return;
    var tmp = document.createElement('div'); tmp.innerHTML = fRoleHtml(r);
    box.parentNode.replaceChild(tmp.firstChild, box);
    fPreview(r); K.refreshBar();
  }
  function fUpload(input) {
    var box = input.closest('[data-frole]'), role = box.getAttribute('data-frole'), file = input.files && input.files[0]; input.value = '';
    if (!file) return;
    var msg = $('[data-font-msg]', box), say = function (s, err) { msg.textContent = s; msg.hidden = !s; msg.classList.toggle('is-err', !!err); };
    var name = String($('[data-font-name]', box).value || '').trim();
    if (!/^[\p{L}\p{N} _-]{2,60}$/u.test(name)) { say('Nhập tên phông (2–60 ký tự: chữ, số, dấu cách, - hoặc _).', true); $('[data-font-name]', box).focus(); return; }
    var ext = (String(file.name).toLowerCase().match(/\.(woff2|woff|ttf|otf)$/) || [])[1];
    if (!ext) { say('Chỉ nhận file .woff2, .woff, .ttf hoặc .otf.', true); return; }
    if (file.size > 5 * 1024 * 1024) { say('File phông tối đa 5MB.', true); return; }
    var lbl = $('[data-font-uplabel]', box), orig = lbl.textContent;
    K.uploadFile(new Blob([file], { type: FONT_TYPES[ext] }), function (p) { lbl.textContent = 'Đang tải ' + Math.round(p * 100) + '%'; }).then(function (r) {
      var url = String((r && r.url) || '');
      if (!/^\/assets\/uploads\/[\w.-]+\.(woff2|woff|ttf|otf)$/.test(url)) throw { message: 'Máy chủ trả về đường dẫn không hợp lệ.' };
      K.setPend('fonts', role, { name: name, url: url });
      fRedraw(role);
      A.toast('Đã tải phông “' + name + '” — xem trước rồi bấm Lưu.', 'info');
    }, function (e) { lbl.textContent = orig; if (e && e.status !== 401) say((e && e.message) || 'Tải lên thất bại.', true); });
  }

  // ═══ Mã tùy chỉnh ══════════════════════════════════════════════════════════
  var CODE_BOXES = [
    ['css', 'CSS thêm vào mọi trang', 'Chỉnh giao diện bằng CSS. Ví dụ: .nav { letter-spacing: 0.1em; }'],
    ['head', 'Mã gắn vào <head>', 'Ví dụ: Google Analytics, mã xác minh Google Search Console. Facebook Pixel có ô riêng ở Thiết lập → Thương hiệu & menu.'],
    ['body', 'Mã gắn cuối trang', 'Ví dụ: khung chat (Messenger, Zalo, Tawk.to…).'],
  ];
  function codeVal(k) { var v = K.effGet('code', k); return v == null ? '' : String(v); }
  function cMount(main) { main.innerHTML = head('Mã tùy chỉnh'); cRender(); }
  function cRender() {
    var root = rootOf(); if (!root) return;
    if (needData(null, 'cms-code', cRender)) return;
    root.innerHTML = '<div class="code-warn" role="note">' + ICON.warn + '<div><strong>Chỉ dành cho người biết code.</strong> Mã sai có thể làm hỏng giao diện hoặc làm website không chạy. ' +
      'Chỉ dán mã từ nguồn tin cậy (Google, Facebook…). Nếu website lỗi sau khi lưu, quay lại đây bấm “Xóa hết” rồi “Lưu”.</div></div>' +
      CODE_BOXES.map(function (b) {
        var v = codeVal(b[0]), pend = K.has(C.pend.code, b[0]);
        return '<section class="panel set-sec' + (pend ? ' is-pending' : '') + '" data-codebox="' + b[0] + '">' +
          '<header class="panel__head"><h2 class="panel__title">' + esc(b[1]) + '</h2><span class="cms-sec__flags" data-code-flag>' + (pend ? '<span class="badge badge--done">Chưa lưu</span>' : '') + '</span></header>' +
          '<div class="set-body"><p class="set-note">' + esc(b[2]) + '</p>' +
            '<label class="sr" for="code-' + b[0] + '">' + esc(b[1]) + '</label>' +
            '<textarea id="code-' + b[0] + '" class="code-ta" rows="10" spellcheck="false" autocomplete="off" autocapitalize="off" data-code="' + b[0] + '">' + esc(v) + '</textarea>' +
            '<div class="set-actions"><span class="field__hint" data-code-count>' + esc(K.num(v.length)) + ' ký tự</span><span class="spacer"></span>' +
            '<button type="button" class="btn btn--quiet btn--sm" data-code-clear>Xóa hết</button></div></div></section>';
      }).join('') + K.savebarHtml();
    K.refreshBar();
  }

  // ═══ Sự kiện ═══════════════════════════════════════════════════════════════
  function on(view) { return A.view() === view; }
  var lkTimer = 0;
  document.addEventListener('input', function (e) {
    var t = e.target; if (!(t instanceof Element)) return;
    if (t.matches('[data-lk-q]') && on('cms-links')) { clearTimeout(lkTimer); lkTimer = setTimeout(function () { ST.lkQ = t.value; lkList(); }, 160); }
    if (t.matches('[data-code]') && on('cms-code')) {
      var k = t.getAttribute('data-code'), v = t.value, box = t.closest('[data-codebox]');
      K.setPend('code', k, v.trim() ? v : null);
      $('[data-code-count]', box).textContent = K.num(v.length) + ' ký tự';
      var p = K.has(C.pend.code, k); box.classList.toggle('is-pending', p); $('[data-code-flag]', box).innerHTML = p ? '<span class="badge badge--done">Chưa lưu</span>' : '';
      K.refreshBar();
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!(t instanceof Element)) return;
    if (t.matches('[data-icfile]') && on('cms-icons')) {
      var card = t.closest('[data-iccard]'), file = t.files && t.files[0]; t.value = '';
      if (!file) return;
      var msg = $('[data-icmsg]', card), say = function (s, err) { msg.textContent = s; msg.hidden = !s; msg.classList.toggle('is-err', !!err); };
      fileToIcon(file, say, $('[data-ic-uplabel]', card)).then(function (v) { if (v) icSet(card, v); });
    }
    if (t.matches('[data-lay-show]') && on('cms-layout')) {
      var id = t.closest('[data-block]').getAttribute('data-block'), seq = blocksOf(ST.layTab);
      seq.forEach(function (x) { if (x.b.id === id) x.off = !t.checked; });
      layWrite(ST.layTab, seq); layRender();
      var again = $('[data-block="' + CSS.escape(id) + '"] [data-lay-show]'); if (again) again.focus();
    }
    if (t.matches('[data-font-sel]') && on('cms-fonts')) {
      var box = t.closest('[data-frole]'), role = box.getAttribute('data-frole'), r = (C.cat.fontRoles || []).filter(function (x) { return x.key === role; })[0];
      if (t.value === '__custom__' || !r) return;
      K.setPend('fonts', role, t.value === r.def ? null : { name: t.value });
      fRedraw(role);
      var sel = $('[data-frole="' + CSS.escape(role) + '"] [data-font-sel]'); if (sel) sel.focus();
    }
    if (t.matches('[data-font-file]') && on('cms-fonts')) fUpload(t);
  });
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null; if (!t) return;
    var n;
    if (on('cms-icons')) {
      if ((n = t.closest('[data-ic-lib], [data-ic-paste]'))) {
        var card = n.closest('[data-iccard]'), ic = C.idx.icon[K.splitKey(card.getAttribute('data-ikey')).base];
        K.iconPicker({ title: ic && ic.label, tab: n.hasAttribute('data-ic-paste') ? 'paste' : 'lib' }).then(function (v) { if (v) icSet(card, v); });
        return;
      }
      if ((n = t.closest('[data-ic-reset]'))) { var c2 = n.closest('[data-iccard]'); K.setPend('icons', c2.getAttribute('data-ikey'), null); K.setPend('hide', c2.getAttribute('data-ikey'), null); icRedraw(c2); return; }
    }
    if (on('cms-layout')) {
      if ((n = t.closest('[data-lay-move]'))) {
        var id = n.closest('[data-block]').getAttribute('data-block'), seq = blocksOf(ST.layTab), dir = +n.getAttribute('data-lay-move');
        var pos = seq.map(function (x) { return x.b.id; }).indexOf(id), j = pos + dir;
        while (j >= 0 && j < seq.length && seq[j].b.fixed) j += dir;
        if (j < 0 || j >= seq.length) return;
        var tmp = seq[pos]; seq[pos] = seq[j]; seq[j] = tmp;
        layWrite(ST.layTab, seq); layRender();
        var b = $('[data-block="' + CSS.escape(id) + '"] [data-lay-move="' + dir + '"]');
        if (b && !b.disabled) b.focus(); else { b = $('[data-block="' + CSS.escape(id) + '"] [data-lay-move]:not([disabled])'); if (b) b.focus(); }
        return;
      }
      if (t.closest('[data-lay-reset]')) {
        A.confirmDialog({ title: 'Khôi phục bố cục gốc của trang này?', body: 'Mọi khu vực hiện lại và về đúng thứ tự ban đầu (sau khi bấm Lưu).', ok: 'Khôi phục', cancel: 'Quay lại' })
          .then(function (yes) { if (yes) { K.setPend('layout', ST.layTab, null); layRender(); } });
        return;
      }
    }
    if (on('cms-fonts') && (n = t.closest('[data-font-reset]'))) { var role = n.closest('[data-frole]').getAttribute('data-frole'); K.setPend('fonts', role, null); fRedraw(role); return; }
    if (on('cms-code') && (n = t.closest('[data-code-clear]'))) {
      var box = n.closest('[data-codebox]'), ta = $('[data-code]', box);
      if (!ta.value) return;
      A.confirmDialog({ title: 'Xóa hết mã trong ô này?', body: 'Ô sẽ trống (sau khi bấm Lưu thì mã bị gỡ khỏi website).', ok: 'Xóa hết', cancel: 'Quay lại' }).then(function (yes) {
        if (!yes) return;
        ta.value = ''; ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus();
      });
    }
  });

  // ═══ Đăng ký màn hình ══════════════════════════════════════════════════════
  K.screen('cms-icons', { title: 'Icon', mount: icMount, route: icRoute, render: icRender, link: function () { return K.pageUrl(ST.icTab); },
    changed: function (el) { var c = el.closest && el.closest('[data-iccard]'); if (c) icRedraw(c); } });
  K.screen('cms-links', { title: 'Liên kết & nút', mount: lkMount, route: lkRoute, render: function () { lkRoute(null, ST.lkTab); }, link: function () { return K.pageUrl(ST.lkTab); } });
  K.screen('cms-layout', { title: 'Bố cục trang', mount: layMount, route: layRoute, render: layRender, link: function () { return K.pageUrl(ST.layTab); } });
  K.screen('cms-fonts', { title: 'Phông chữ', mount: fMount, render: fRender, link: function () { return '/'; } });
  K.screen('cms-code', { title: 'Mã tùy chỉnh', mount: cMount, render: cRender, link: function () { return '/'; } });
})();
