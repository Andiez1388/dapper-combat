/* Dapper Combat — Quản trị: Trang phụ (chính sách đổi trả, giới thiệu, điều khoản…)
   Danh sách trang + trình soạn thảo đơn giản (contenteditable) cho VI/EN. Nội dung được làm sạch theo
   danh sách thẻ cho phép (giống máy chủ) trước khi hiện trong trình soạn thảo và trước khi gửi đi. */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A) return;
  var esc = A.esc, ICON = A.ICON, K = A.cms || {};
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function urlSlug(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, ''); }
  var LANGS = [['vi', 'Tiếng Việt'], ['en', 'English (AI tự dịch)']];
  var HREF_RE = /^(\/[^\s"<>]*|#[\w-]*|https?:\/\/[^\s"<>]+|tel:[+\d\s().-]{3,20}|mailto:[^\s"<>@]+@[^\s"<>]+)$/;
  var SRC_RE = /^(\/assets\/(uploads|media|img)\/[\w./-]+|https:\/\/[^\s"<>]+)$/;
  var COVER = { w: 1920, h: 800, kb: 400 };

  var P = { list: null, loading: null, err: '', editId: '', d: null, orig: '', slugTouched: false, lang: 'vi', html: { vi: false, en: false }, range: null };

  // ── làm sạch nội dung (giống máy chủ: chỉ giữ thẻ định dạng, link & ảnh hợp lệ) ──
  var KEEP = { h2: [], h3: [], h4: [], p: [], br: [], hr: [], ul: [], ol: [], li: [], strong: [], b: [], em: [], i: [], u: [], s: [], blockquote: [], figure: [], figcaption: [],
    a: ['href', 'target'], img: ['src', 'alt'], table: [], thead: [], tbody: [], tr: [], th: [], td: [] };
  var DROP = /^(script|style|iframe|object|embed|form|input|button|select|textarea|svg|math|template|noscript|link|meta)$/i;
  function cleanHtml(html) {
    var doc = new DOMParser().parseFromString('<body>' + String(html || '').slice(0, 200000) + '</body>', 'text/html');
    function walk(node) {
      var out = '';
      Array.prototype.forEach.call(node.childNodes, function (n) {
        if (n.nodeType === 3) { out += esc(n.nodeValue).replace(/&#39;/g, "'").replace(/&quot;/g, '"'); return; }
        if (n.nodeType !== 1) return;
        var name = n.nodeName.toLowerCase();
        if (DROP.test(name)) return;
        if (!KEEP[name]) { out += walk(n); return; }
        var attrs = '';
        KEEP[name].forEach(function (a) {
          var v = n.getAttribute(a); if (v == null) return; v = v.trim();
          if (a === 'href' && !HREF_RE.test(v)) return;
          if (a === 'src' && !SRC_RE.test(v)) return;
          if (a === 'target' && v !== '_blank') return;
          attrs += ' ' + a + '="' + esc(v) + '"';
        });
        if (name === 'img' && attrs.indexOf(' src=') < 0) return;
        out += /^(br|hr|img)$/.test(name) ? '<' + name + attrs + '>' : '<' + name + attrs + '>' + walk(n) + '</' + name + '>';
      });
      return out;
    }
    return walk(doc.body).trim();
  }

  // ═══ Tải dữ liệu ═══════════════════════════════════════════════════════════
  function load(force) {
    if (P.loading) return P.loading;
    if (P.list && !force) return Promise.resolve(P.list);
    P.loading = A.api('/pages').then(function (l) { P.list = Array.isArray(l) ? l : []; P.err = ''; syncPresets(); return P.list; })
      .catch(function (e) { P.err = (e && e.message) || 'Không tải được danh sách trang'; return null; })
      .then(function (r) { P.loading = null; return r; });
    return P.loading;
  }
  function syncPresets() { if (K && K.C) K.C.sitePages = (P.list || []).slice(); }
  function byId(id) { return (P.list || []).filter(function (p) { return p.id === id; })[0]; }
  function fmt(ms) { var d = new Date(Number(ms)); if (!ms || isNaN(d)) return ''; var z = function (n) { return String(n).padStart(2, '0'); }; return z(d.getDate()) + '/' + z(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()); }
  function pageLink(p) { return '/trang/' + encodeURIComponent(p.slug); }
  function blank() { return { slug: '', title: { vi: '', en: '' }, desc: { vi: '', en: '' }, body: { vi: '<p></p>', en: '' }, cover: '', published: false }; }

  // ═══ Danh sách ═════════════════════════════════════════════════════════════
  function mount(main, sub) {
    // vào lại màn này từ màn khác → bỏ trạng thái trình soạn thảo cũ (đã được hỏi lưu khi rời đi)
    P.d = null; P.orig = ''; P.editId = '';
    main.innerHTML = '<div data-pg-root></div>';
    route(main, sub);
  }
  function route(main, sub) {
    // đang sửa dở mà rời trình soạn thảo → hỏi trước
    if (P.d && dirty() && sub !== P.editId) {
      var to = sub ? '#/pages/' + sub : '#/pages';
      history.replaceState(null, '', '#/pages/' + P.editId); A.syncRoute();
      A.confirmDialog({ title: 'Bỏ thay đổi chưa lưu?', body: 'Trang đang sửa có thay đổi chưa lưu. Nếu rời đi, các thay đổi sẽ mất.', ok: 'Bỏ thay đổi', cancel: 'Ở lại' }).then(function (yes) {
        if (!yes) return;
        P.d = null; P.orig = '';
        history.replaceState(null, '', to); A.syncRoute();
        show(sub);
      });
      return;
    }
    show(sub);
  }
  function show(sub) {
    var root = $('[data-pg-root]'); if (!root) return;
    if (!P.list) {
      root.innerHTML = A.pageHead('Trang phụ', { eyebrow: 'Nội dung website', stamp: false, count: false }) + (P.err ? A.errorHtml(P.err) : A.loadingHtml());
      if (!P.loading && !P.err) load().then(function () { if (A.view() === 'pages') show(sub); });
      return;
    }
    if (sub) editor(sub); else listView();
    window.scrollTo(0, 0);
  }
  function listView() {
    P.d = null; P.editId = ''; P.orig = '';
    var root = $('[data-pg-root]');
    var list = (P.list || []).slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    root.innerHTML = A.pageHead('Trang phụ', { eyebrow: 'Nội dung website', stamp: false, count: false,
        actions: '<a class="btn btn--primary" href="#/pages/new">' + ICON.plus + '<span>Tạo trang mới</span></a>' }) +
      '<div class="cms-help"><p><strong>Trang phụ</strong> là các trang nội dung riêng như chính sách đổi trả, giới thiệu, điều khoản… Mỗi trang có địa chỉ <code>/trang/tên-trang</code>. ' +
      'Trang <strong>bản nháp</strong> chỉ bạn xem trước được; bật “Hiện trên web” khi đã sẵn sàng. Có thể gắn trang vào nút / link ở mục Liên kết & nút.</p></div>' +
      (list.length ? '<div class="pg-list">' + list.map(function (p) {
        return '<article class="pg-row" data-pg="' + esc(p.id) + '">' +
          '<div class="pg-row__main"><h3 class="pg-row__title">' + esc((p.title && p.title.vi) || '(chưa có tiêu đề)') + '</h3>' +
            '<p class="pg-row__url">/trang/' + esc(p.slug) + '</p>' +
            '<p class="pg-row__meta">' + (p.published ? '<span class="badge badge--done">Đang hiện</span>' : '<span class="badge badge--off">Bản nháp</span>') +
              '<span class="field__hint">Sửa lần cuối ' + esc(fmt(p.updatedAt || p.createdAt)) + '</span></p></div>' +
          '<div class="pg-row__act">' +
            '<label class="check" title="Bật = khách xem được trang này"><input type="checkbox" data-pg-pub' + (p.published ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span>Hiện trên web</span></label>' +
            '<a class="btn btn--line btn--sm" href="#/pages/' + esc(encodeURIComponent(p.id)) + '">Sửa</a>' +
            (p.published ? '<a class="btn btn--quiet btn--sm" href="' + esc(pageLink(p)) + '" target="_blank" rel="noopener">Xem ↗</a>' : '') +
            '<button type="button" class="btn btn--quiet btn--sm" data-pg-preview>Xem trước</button>' +
            '<button type="button" class="btn btn--quiet btn--sm" data-pg-del>Xóa</button>' +
          '</div></article>';
      }).join('') + '</div>' : A.emptyHtml('Chưa có trang phụ nào', 'Bấm “Tạo trang mới” để viết trang đầu tiên.'));
  }

  // ═══ Trình soạn thảo ═══════════════════════════════════════════════════════
  function editor(id) {
    var isNew = id === 'new', src = isNew ? blank() : byId(id);
    var root = $('[data-pg-root]');
    if (!src) { root.innerHTML = A.pageHead('Trang phụ', { eyebrow: 'Nội dung website', stamp: false, count: false }) + A.emptyHtml('Không tìm thấy trang này', 'Có thể trang đã bị xóa.') + '<p><a class="btn btn--line" href="#/pages">← Danh sách trang</a></p>'; return; }
    P.editId = id; P.slugTouched = !isNew; P.html = { vi: false, en: false };
    P.d = { slug: src.slug || '', title: clone(src.title || { vi: '', en: '' }), desc: clone(src.desc || { vi: '', en: '' }), body: clone(src.body || { vi: '', en: '' }), cover: src.cover || '', published: !!src.published };
    root.innerHTML = A.pageHead(isNew ? 'Tạo trang mới' : 'Sửa trang phụ', { eyebrow: 'Trang phụ', stamp: false, count: false,
        actions: '<a class="btn btn--ghost" href="#/pages">← Danh sách</a>' }) +
      '<p class="form-msg" data-pg-msg role="alert" hidden></p>' +
      '<div class="pg-grid">' +
        '<div class="pg-main">' +
          '<div class="pg-langs" role="tablist" aria-label="Ngôn ngữ">' + LANGS.map(function (l) {
            return '<button type="button" role="tab" class="pg-lang' + (l[0] === P.lang ? ' is-active' : '') + '" data-pg-lang="' + l[0] + '" aria-selected="' + (l[0] === P.lang) + '">' + esc(l[1]) + '</button>';
          }).join('') + '</div>' +
          LANGS.map(function (l) { return langPane(l[0], l[1]); }).join('') +
        '</div>' +
        '<aside class="pg-side">' +
          '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">Địa chỉ trang</h2></header><div class="set-body">' +
            '<label class="field"><span class="field__label">Tên trên đường dẫn</span><input type="text" data-pg-slug value="' + esc(P.d.slug) + '" maxlength="60" spellcheck="false" autocomplete="off" placeholder="vd: chinh-sach-doi-tra"></label>' +
            '<p class="field__hint">Chữ thường không dấu, số và dấu gạch ngang. ' + (isNew ? 'Tự tạo theo tiêu đề tiếng Việt cho tới khi bạn sửa tay.' : 'Đổi tên sẽ làm link cũ không mở được nữa.') + '</p>' +
            '<p class="pg-url" data-pg-url></p></div></section>' +
          '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">Hiển thị</h2></header><div class="set-body">' +
            '<label class="check"><input type="checkbox" data-pg-published' + (P.d.published ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span>Hiện trên web</span></label>' +
            '<p class="field__hint">Tắt = bản nháp: chỉ xem trước được trong trang quản trị.</p>' +
            '<div class="set-actions"><button type="button" class="btn btn--line btn--sm" data-pg-preview-cur>Xem trước</button>' +
            (!isNew && src.published ? '<a class="btn btn--quiet btn--sm" href="' + esc(pageLink(src)) + '" target="_blank" rel="noopener">Xem trang ↗</a>' : '') + '</div></div></section>' +
          '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">Ảnh đầu trang</h2></header><div class="set-body">' +
            '<div class="pg-cover" data-pg-cover></div>' +
            '<p class="set-spec">Nên dùng ' + COVER.w + ' × ' + COVER.h + ' px, JPG hoặc WebP ≤ ' + COVER.kb + ' KB. Không bắt buộc.</p>' +
            '<div class="set-actions"><label class="btn btn--line btn--sm file-btn">' + ICON.upload + '<span data-pg-coverlabel>Tải ảnh</span><input class="sr" type="file" accept="image/jpeg,image/png,image/webp" data-pg-coverfile></label>' +
              '<button type="button" class="btn btn--quiet btn--sm" data-pg-coverdel>Bỏ ảnh</button></div>' +
            '<div class="set-msg" data-pg-covermsg hidden></div></div></section>' +
          (isNew ? '' : '<p class="field__hint">Tạo lúc ' + esc(fmt(src.createdAt)) + ' · sửa lần cuối ' + esc(fmt(src.updatedAt)) + '</p>') +
        '</aside>' +
      '</div>' +
      '<div class="savebar" data-savebar="pg" hidden role="region" aria-label="Lưu trang"><p class="savebar__msg">Trang có thay đổi chưa lưu</p>' +
        '<div class="savebar__actions"><button class="btn btn--on-dark" type="button" data-pg-discard>Hủy</button><button class="btn btn--primary" type="button" data-pg-save>' + (isNew ? 'Tạo trang' : 'Lưu trang') + '</button></div></div>';
    LANGS.forEach(function (l) { var area = $('[data-rte="' + l[0] + '"] [data-rte-area]'); if (area) area.innerHTML = cleanHtml(P.d.body[l[0]] || ''); });
    showLang(P.lang);
    coverUi(); urlUi();
    P.orig = JSON.stringify(collect());
    if (isNew) { var bar = $('[data-savebar="pg"]'); bar.hidden = false; }
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); document.execCommand('styleWithCSS', false, false); } catch (e) { /* bỏ qua */ }
  }
  function langPane(l, label) {
    var tools = [['h2', 'Tiêu đề lớn'], ['h3', 'Tiêu đề nhỏ'], ['b', 'Đậm'], ['i', 'Nghiêng'], ['ul', 'Danh sách chấm'], ['ol', 'Danh sách số'], ['quote', 'Trích dẫn'], ['hr', 'Đường kẻ'], ['link', 'Chèn link'], ['img', 'Chèn ảnh'], ['clear', 'Xóa định dạng']];
    return '<div class="pg-pane" data-pg-pane="' + l + '"' + (l === P.lang ? '' : ' hidden') + '>' +
      '<label class="field"><span class="field__label">Tiêu đề trang (' + esc(label) + ')' + (l === 'vi' ? ' — bắt buộc' : '') + '</span>' +
        '<input type="text" data-pg-title="' + l + '" value="' + esc(P.d.title[l] || '') + '" maxlength="160" autocomplete="off"' + (l === 'en' ? ' placeholder="Để trống = dùng tiêu đề tiếng Việt"' : '') + '></label>' +
      '<label class="field"><span class="field__label">Mô tả ngắn trên Google (' + esc(label) + ')</span>' +
        '<textarea rows="2" maxlength="300" data-pg-desc="' + l + '" placeholder="Khoảng 150 ký tự, hiện dưới tiêu đề trong kết quả tìm kiếm">' + esc(P.d.desc[l] || '') + '</textarea></label>' +
      '<div class="field"><span class="field__label">Nội dung (' + esc(label) + ')' + (l === 'en' ? ' — để trống = dùng bản tiếng Việt' : '') + '</span>' +
        '<div class="rte" data-rte="' + l + '">' +
          '<div class="rte__bar" role="toolbar" aria-label="Định dạng nội dung">' + tools.map(function (t) {
            return '<button type="button" class="rte__btn" data-cmd="' + t[0] + '">' + esc(t[1]) + '</button>';
          }).join('') + '<span class="spacer"></span><button type="button" class="rte__btn rte__btn--html" data-cmd="html" aria-pressed="false" title="Sửa trực tiếp mã HTML (cho người rành)">HTML</button></div>' +
          '<div class="rte__area" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Nội dung trang (' + esc(label) + ')" data-rte-area lang="' + l + '"></div>' +
          '<textarea class="code-ta rte__html" rows="14" spellcheck="false" data-rte-html hidden aria-label="Mã HTML nội dung (' + esc(label) + ')"></textarea>' +
          '<input class="sr" type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-rte-img tabindex="-1" aria-hidden="true">' +
        '</div>' +
        '<p class="field__hint">Dán chữ từ Word / web sẽ tự bỏ định dạng lạ. Có thể dùng giá tự động như <code>{ship.free}</code> — website tự điền số.</p></div>' +
    '</div>';
  }
  function showLang(l) {
    P.lang = l;
    $$('[data-pg-lang]').forEach(function (b) { var on = b.getAttribute('data-pg-lang') === l; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', String(on)); });
    $$('[data-pg-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pg-pane') !== l; });
  }
  function collect() {
    var d = clone(P.d);
    LANGS.forEach(function (x) {
      var l = x[0], box = $('[data-rte="' + l + '"]'); if (!box) return;
      d.body[l] = tidy(P.html[l] ? cleanHtml($('[data-rte-html]', box).value) : cleanHtml($('[data-rte-area]', box).innerHTML));
      if (!d.body[l].replace(/<p>\s*(<br>)?\s*<\/p>/g, '').trim()) d.body[l] = '';
    });
    return d;
  }
  // bỏ đoạn rỗng do trình soạn thảo để lại, dấu xuống dòng thêm khi xem mã HTML và dòng trống cuối bài
  var BLOCK_END = /(<\/(?:p|h2|h3|h4|li|blockquote|ul|ol|figure|table|tr)>|<hr>)[ \t]*\n\s*/g;
  function tidy(html) {
    return String(html || '').replace(BLOCK_END, '$1').replace(/<p>\s*<\/p>/g, '').replace(/(?:<p>\s*<br>\s*<\/p>\s*)+$/, '').trim();
  }
  // chỉ tính “chưa lưu” khi trình soạn thảo đang mở trên màn hình
  function dirty() { return !!P.d && !!$('[data-pg-root] [data-rte]') && JSON.stringify(collect()) !== P.orig; }
  function bar() { var b = $('[data-savebar="pg"]'); if (b) b.hidden = !(dirty() || P.editId === 'new'); }
  function urlUi() { var u = $('[data-pg-url]'); if (u) u.innerHTML = P.d.slug ? 'Địa chỉ: <strong>' + esc(location.origin + '/trang/' + P.d.slug) + '</strong>' : '<span class="cms-warn">Chưa có địa chỉ — nhập tiêu đề hoặc tên trang.</span>'; }
  function coverUi() {
    var box = $('[data-pg-cover]'); if (!box) return;
    var src = A.safeImg(P.d.cover);
    box.innerHTML = src ? '<img src="' + esc(src) + '" alt="Ảnh đầu trang">' : '<span class="pimg__empty">' + ICON.image + '<span>Chưa có ảnh</span></span>';
    var del = $('[data-pg-coverdel]'); if (del) del.hidden = !src;
  }
  function msg(text) { var m = $('[data-pg-msg]'); if (!m) return; m.textContent = text || ''; m.hidden = !text; if (text) m.scrollIntoView({ block: 'nearest' }); }

  function save(btn) {
    var d = collect();
    if (!String(d.title.vi || '').trim()) { showLang('vi'); msg('Cần nhập tiêu đề tiếng Việt.'); var ti = $('[data-pg-title="vi"]'); if (ti) ti.focus(); return; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug)) { msg('Tên trên đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang (vd chinh-sach-doi-tra).'); $('[data-pg-slug]').focus(); return; }
    var isNew = P.editId === 'new';
    A.setBusy(btn, true); msg('');
    A.api(isNew ? '/pages' : '/pages/' + encodeURIComponent(P.editId), { method: isNew ? 'POST' : 'PUT', body: d }).then(function (p) {
      A.setBusy(btn, false);
      var i = (P.list || []).findIndex(function (x) { return x.id === p.id; });
      if (i >= 0) P.list[i] = p; else (P.list = P.list || []).push(p);
      syncPresets();
      if (isNew) { history.replaceState(null, '', '#/pages/' + encodeURIComponent(p.id)); A.syncRoute(); }
      editor(p.id);
      A.toast(isNew ? 'Đã tạo trang “' + p.title.vi + '”' + (p.published ? '.' : ' (bản nháp).') : 'Đã lưu trang.', 'ok', p.published ? { href: pageLink(p), label: 'Xem trang ↗' } : null);
    }, function (e) { A.setBusy(btn, false); if (e && e.status !== 401 && e.status !== 403) { msg(e.message); A.toast(e.message, 'err'); } });
  }
  function preview(data) {
    var w = window.open('', '_blank');
    if (!w) { A.toast('Trình duyệt chặn cửa sổ mới — hãy cho phép cửa sổ bật lên rồi thử lại.', 'err'); return; }
    try { w.document.write('<p style="font-family:sans-serif;padding:24px">Đang tạo bản xem trước…</p>'); } catch (e) { /* bỏ qua */ }
    A.api('/pages/preview', { method: 'POST', body: { title: data.title, body: data.body, cover: data.cover } }).then(function (r) {
      try { w.document.open(); w.document.write(String((r && r.html) || '')); w.document.close(); } catch (e) { /* bỏ qua */ }
    }, function (e) { try { w.close(); } catch (er) { /* bỏ qua */ } A.apiFail(e); });
  }

  // ── trình soạn thảo: lệnh định dạng ──
  function areaOf(el) { var box = el.closest('[data-rte]'); return box ? $('[data-rte-area]', box) : null; }
  function saveRange(area) {
    var sel = window.getSelection();
    if (sel && sel.rangeCount && area.contains(sel.getRangeAt(0).commonAncestorContainer)) P.range = sel.getRangeAt(0).cloneRange();
    else { var r = document.createRange(); r.selectNodeContents(area); r.collapse(false); P.range = r; }
  }
  function restoreRange(area) {
    area.focus();
    var sel = window.getSelection(); sel.removeAllRanges();
    if (P.range && area.contains(P.range.commonAncestorContainer)) sel.addRange(P.range);
    else { var r = document.createRange(); r.selectNodeContents(area); r.collapse(false); sel.addRange(r); }
  }
  function block(tag) {
    var cur = String(document.queryCommandValue('formatBlock') || '').toLowerCase().replace(/[<>]/g, '');
    document.execCommand('formatBlock', false, cur === tag ? 'p' : tag);
  }
  function runCmd(btn) {
    var box = btn.closest('[data-rte]'), l = box.getAttribute('data-rte'), area = $('[data-rte-area]', box), cmd = btn.getAttribute('data-cmd');
    if (cmd === 'html') { toggleHtml(box, l); return; }
    if (P.html[l]) { A.toast('Đang ở chế độ HTML — bấm “HTML” lần nữa để quay lại soạn thảo.', 'info'); return; }
    area.focus();
    if (cmd === 'h2' || cmd === 'h3') block(cmd);
    else if (cmd === 'quote') block('blockquote');
    else if (cmd === 'b') document.execCommand('bold');
    else if (cmd === 'i') document.execCommand('italic');
    else if (cmd === 'ul') document.execCommand('insertUnorderedList');
    else if (cmd === 'ol') document.execCommand('insertOrderedList');
    else if (cmd === 'hr') document.execCommand('insertHorizontalRule');
    else if (cmd === 'clear') { document.execCommand('removeFormat'); document.execCommand('unlink'); document.execCommand('formatBlock', false, 'p'); }
    else if (cmd === 'link') { saveRange(area); linkDialog(area); return; }
    else if (cmd === 'img') { saveRange(area); $('[data-rte-img]', box).click(); return; }
    bar();
  }
  function toggleHtml(box, l) {
    var area = $('[data-rte-area]', box), ta = $('[data-rte-html]', box), b = $('[data-cmd="html"]', box);
    if (!P.html[l]) { ta.value = tidy(cleanHtml(area.innerHTML)).replace(/(<\/(p|h2|h3|h4|li|blockquote|ul|ol|figure|table|tr)>|<hr>)/g, '$1\n'); area.hidden = true; ta.hidden = false; ta.focus(); }
    else { area.innerHTML = cleanHtml(ta.value); ta.hidden = true; area.hidden = false; area.focus(); }
    P.html[l] = !P.html[l];
    b.setAttribute('aria-pressed', String(P.html[l])); b.classList.toggle('is-active', P.html[l]);
    $$('.rte__btn:not([data-cmd="html"])', box).forEach(function (x) { x.disabled = P.html[l]; });
  }
  // hộp nhỏ: chèn link / mô tả ảnh
  var small = null, smallDone = null;
  function smallDialog(opt) {
    if (!small) {
      small = document.createElement('dialog'); small.className = 'dlg'; small.setAttribute('aria-labelledby', 'pgdTitle');
      document.body.appendChild(small);
      small.addEventListener('close', function () { var r = smallDone; smallDone = null; if (r) r(small._ok ? small._vals : null); });
      small.addEventListener('click', function (e) { if (e.target === small) small.close(); if (e.target.closest && e.target.closest('[data-pgd-cancel]')) small.close(); });
      small.addEventListener('change', function (e) { if (e.target.matches('[data-link-preset]')) { var u = $('[name="url"]', small); if (e.target.value) u.value = e.target.value; e.target.value = ''; u.focus(); } });
      small.addEventListener('submit', function (e) {
        e.preventDefault();
        var vals = {}, f = e.target, err = '';
        $$('input', f).forEach(function (i) { if (i.name) vals[i.name] = i.type === 'checkbox' ? i.checked : i.value.trim(); });
        if (small._opt && small._opt.validate) err = small._opt.validate(vals);
        var m = $('[data-pgd-msg]', small); m.textContent = err; m.hidden = !err;
        if (err) return;
        small._ok = true; small._vals = vals; small.close();
      });
    }
    small._opt = opt;
    small._ok = false;
    small.innerHTML = '<form novalidate><h2 class="dlg__title" id="pgdTitle">' + esc(opt.title) + '</h2>' + opt.fields.map(function (fd) {
      if (fd.type === 'checkbox') return '<label class="check"><input type="checkbox" name="' + fd.name + '"' + (fd.value ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span>' + esc(fd.label) + '</span></label>';
      return '<label class="field"><span class="field__label">' + esc(fd.label) + '</span>' +
        (fd.presets && K.presetSelectHtml ? '<span class="cms-link-ed__row"><input type="text" name="' + fd.name + '" value="' + esc(fd.value || '') + '" placeholder="' + esc(fd.placeholder || '') + '" autocomplete="off" spellcheck="false">' + K.presetSelectHtml() + '</span>'
          : '<input type="text" name="' + fd.name + '" value="' + esc(fd.value || '') + '" placeholder="' + esc(fd.placeholder || '') + '" autocomplete="off">') +
        (fd.hint ? '<small class="field__hint">' + esc(fd.hint) + '</small>' : '') + '</label>';
    }).join('') + '<p class="form-msg" data-pgd-msg role="alert" hidden></p>' +
      '<div class="dlg__actions"><button class="btn" type="button" data-pgd-cancel>Quay lại</button><button class="btn btn--primary" type="submit">' + esc(opt.ok || 'Đồng ý') + '</button></div></form>';
    return new Promise(function (res) { smallDone = res; small.showModal(); var first = $('input:not([type=checkbox])', small); if (first) first.focus(); });
  }
  function linkDialog(area) {
    var collapsed = !P.range || P.range.collapsed;
    var cur = P.range && P.range.commonAncestorContainer, a = cur && (cur.nodeType === 1 ? cur : cur.parentElement);
    a = a && a.closest ? a.closest('a') : null;
    smallDialog({ title: 'Chèn link', ok: 'Chèn link', fields: [
      { name: 'url', label: 'Đường dẫn', presets: true, value: a ? a.getAttribute('href') : '', placeholder: '/khoa-hoc, https://…, tel:…', hint: 'Chọn nhanh ở ô bên cạnh hoặc gõ đường dẫn.' },
    ].concat(collapsed && !a ? [{ name: 'text', label: 'Chữ hiển thị', placeholder: 'VD: Xem bảng giá' }] : []).concat([{ name: 'newtab', type: 'checkbox', label: 'Mở trong tab mới', value: a ? a.getAttribute('target') === '_blank' : false }]),
      validate: function (v) { return HREF_RE.test(v.url) ? '' : 'Đường dẫn chưa đúng — dùng dạng /trang, /trang#khu-vuc, https://…, tel:… hoặc mailto:…'; } })
      .then(function (v) {
        if (!v) { restoreRange(area); return; }
        restoreRange(area);
        if (a && area.contains(a)) { a.setAttribute('href', v.url); if (v.newtab) a.setAttribute('target', '_blank'); else a.removeAttribute('target'); }
        else if (collapsed) document.execCommand('insertHTML', false, '<a href="' + esc(v.url) + '"' + (v.newtab ? ' target="_blank"' : '') + '>' + esc(v.text || v.url) + '</a>');
        else {
          document.execCommand('createLink', false, v.url);
          if (v.newtab) $$('a[href="' + CSS.escape(v.url) + '"]', area).forEach(function (x) { x.setAttribute('target', '_blank'); });
        }
        bar();
      });
  }
  function insertImage(input) {
    var box = input.closest('[data-rte]'), area = $('[data-rte-area]', box), file = input.files && input.files[0]; input.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { A.toast('Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF.', 'err'); return; }
    if (file.size > 10 * 1024 * 1024) { A.toast('Ảnh tối đa 10MB — hãy nén ảnh rồi thử lại.', 'err'); return; }
    if (!K.uploadFile) return;
    A.toast('Đang tải ảnh lên…', 'info');
    K.uploadFile(file, function () {}).then(function (r) {
      var url = A.safeImg(r && r.url); if (!url) throw { message: 'Máy chủ trả về đường dẫn không hợp lệ.' };
      return smallDialog({ title: 'Mô tả ảnh', ok: 'Chèn ảnh', fields: [{ name: 'alt', label: 'Mô tả ngắn (giúp Google và người khiếm thị hiểu ảnh)', placeholder: 'VD: Phòng tập Dapper Combat' }] })
        .then(function (v) { restoreRange(area); document.execCommand('insertHTML', false, '<img src="' + esc(url) + '" alt="' + esc((v && v.alt) || '') + '">'); bar(); });
    }).catch(function (e) { if (e && e.status !== 401) A.toast((e && e.message) || 'Tải ảnh thất bại.', 'err'); });
  }
  function onPaste(e) {
    var area = e.target.closest && e.target.closest('[data-rte-area]'); if (!area) return;
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData('text/plain') || '';
    var html = text.replace(/\r/g, '').split(/\n{2,}/).map(function (para) { para = para.trim(); return para ? '<p>' + esc(para).replace(/\n/g, '<br>') + '</p>' : ''; }).join('');
    if (html) document.execCommand('insertHTML', false, html);
    bar();
  }
  function onCover(input) {
    var file = input.files && input.files[0]; input.value = '';
    if (!file) return;
    var m = $('[data-pg-covermsg]'), say = function (t, err) { m.textContent = t; m.hidden = !t; m.classList.toggle('is-err', !!err); };
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { say('Chỉ nhận ảnh JPG, PNG hoặc WebP.', true); return; }
    if (file.size > 10 * 1024 * 1024) { say('Ảnh tối đa 10MB.', true); return; }
    var lbl = $('[data-pg-coverlabel]'), warn = [];
    (K.probe ? K.probe(file, 'image') : Promise.resolve(null)).then(function (d) {
      if (d && d[0] < COVER.w * 0.7) warn.push('⚠ Ảnh nhỏ hơn gợi ý (' + d[0] + ' × ' + d[1] + ' px) — có thể bị mờ.');
      if (d && Math.abs(d[0] / d[1] - COVER.w / COVER.h) / (COVER.w / COVER.h) > 0.15) warn.push('⚠ Khác tỉ lệ 1920 × 800 — ảnh sẽ bị cắt bớt.');
      if (file.size > COVER.kb * 1024) warn.push('⚠ Dung lượng lớn (' + Math.round(file.size / 1024) + ' KB) — trang sẽ tải chậm, nên nén lại.');
      return K.uploadFile(file, function (p) { lbl.textContent = 'Đang tải ' + Math.round(p * 100) + '%'; });
    }).then(function (r) {
      lbl.textContent = 'Tải ảnh';
      var url = A.safeImg(r && r.url); if (!url) throw { message: 'Máy chủ trả về đường dẫn không hợp lệ.' };
      P.d.cover = url; coverUi(); bar();
      say(['Đã tải ảnh — bấm Lưu để áp dụng.'].concat(warn).join(' '), false);
    }, function (e) { lbl.textContent = 'Tải ảnh'; if (e && e.status !== 401) say((e && e.message) || 'Tải ảnh thất bại.', true); });
  }

  // ═══ Sự kiện ═══════════════════════════════════════════════════════════════
  function on() { return A.view() === 'pages'; }
  document.addEventListener('mousedown', function (e) { if (on() && e.target.closest && e.target.closest('.rte__btn')) e.preventDefault(); });
  document.addEventListener('paste', function (e) { if (on()) onPaste(e); });
  document.addEventListener('input', function (e) {
    var t = e.target; if (!(t instanceof Element) || !on() || !P.d) return;
    if (t.matches('[data-pg-title]')) {
      var l = t.getAttribute('data-pg-title'); P.d.title[l] = t.value;
      if (l === 'vi' && !P.slugTouched) { P.d.slug = urlSlug(t.value); var s = $('[data-pg-slug]'); if (s) s.value = P.d.slug; urlUi(); }
    } else if (t.matches('[data-pg-desc]')) P.d.desc[t.getAttribute('data-pg-desc')] = t.value;
    else if (t.matches('[data-pg-slug]')) {
      P.slugTouched = true;
      var v = t.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').slice(0, 60);
      if (v !== t.value) { var pos = t.selectionStart; t.value = v; try { t.setSelectionRange(pos, pos); } catch (er) { /* bỏ qua */ } }
      P.d.slug = v.replace(/^-+|-+$/g, ''); urlUi();
    }
    bar();
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!(t instanceof Element) || !on()) return;
    if (t.matches('[data-pg-published]') && P.d) { P.d.published = t.checked; bar(); }
    else if (t.matches('[data-pg-coverfile]')) onCover(t);
    else if (t.matches('[data-rte-img]')) insertImage(t);
    else if (t.matches('[data-pg-pub]')) {
      var row = t.closest('[data-pg]'), id = row.getAttribute('data-pg'), want = t.checked;
      t.disabled = true;
      A.api('/pages/' + encodeURIComponent(id), { method: 'PUT', body: { published: want } }).then(function (p) {
        var i = P.list.findIndex(function (x) { return x.id === p.id; }); if (i >= 0) P.list[i] = p; syncPresets();
        listView();
        A.toast(want ? 'Trang “' + p.title.vi + '” đã hiện trên web.' : 'Đã chuyển “' + p.title.vi + '” về bản nháp.', 'ok', want ? { href: pageLink(p), label: 'Xem trang ↗' } : null);
      }, function (er) { t.disabled = false; t.checked = !want; A.apiFail(er); });
    }
  });
  document.addEventListener('keydown', function (e) {
    if (!on() || !P.d) return;
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); var b = $('[data-pg-save]'); if (b && !b.closest('[hidden]')) b.click(); }
  });
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null; if (!t || !on()) return;
    var n;
    if ((n = t.closest('[data-cmd]'))) { runCmd(n); return; }
    if ((n = t.closest('[data-pg-lang]'))) { showLang(n.getAttribute('data-pg-lang')); return; }
    if ((n = t.closest('[data-pg-save]'))) { save(n); return; }
    if (t.closest('[data-pg-discard]')) {
      A.confirmDialog({ title: 'Bỏ thay đổi chưa lưu?', body: 'Trang sẽ trở lại như lần lưu gần nhất.', ok: 'Bỏ thay đổi', cancel: 'Quay lại' }).then(function (yes) {
        if (!yes) return;
        if (P.editId === 'new') { P.d = null; history.replaceState(null, '', '#/pages'); A.syncRoute(); listView(); } else editor(P.editId);
      });
      return;
    }
    if (t.closest('[data-pg-coverdel]') && P.d) { P.d.cover = ''; coverUi(); bar(); return; }
    if (t.closest('[data-pg-preview-cur]') && P.d) { preview(collect()); return; }
    if ((n = t.closest('[data-pg-preview]'))) { var p = byId(n.closest('[data-pg]').getAttribute('data-pg')); if (p) preview(p); return; }
    if ((n = t.closest('[data-pg-del]'))) {
      var row = n.closest('[data-pg]'), pg = byId(row.getAttribute('data-pg')); if (!pg) return;
      A.confirmDialog({ title: 'Xóa trang “' + ((pg.title && pg.title.vi) || pg.slug) + '”?', body: 'Trang sẽ bị xóa vĩnh viễn và link /trang/' + pg.slug + ' không mở được nữa. Nếu chỉ muốn ẩn, hãy tắt “Hiện trên web”.', ok: 'Xóa trang', cancel: 'Quay lại' })
        .then(function (yes) {
          if (!yes) return;
          A.api('/pages/' + encodeURIComponent(pg.id), { method: 'DELETE' }).then(function () {
            P.list = P.list.filter(function (x) { return x.id !== pg.id; }); syncPresets(); listView();
            A.toast('Đã xóa trang “' + ((pg.title && pg.title.vi) || pg.slug) + '”.');
          }, A.apiFail);
        });
    }
  });
  // con trỏ trong ô soạn thảo đổi → bật/tắt trạng thái nút (đậm, nghiêng…)
  document.addEventListener('selectionchange', function () {
    if (!on() || !P.d) return;
    var sel = window.getSelection(); if (!sel || !sel.rangeCount) return;
    var node = sel.getRangeAt(0).commonAncestorContainer, el = node.nodeType === 1 ? node : node.parentElement;
    var area = el && el.closest && el.closest('[data-rte-area]'); if (!area) return;
    var box = area.closest('[data-rte]'), blk = String(document.queryCommandValue('formatBlock') || '').toLowerCase().replace(/[<>]/g, '');
    // tiêu đề vốn in đậm → không bật nút “Đậm” khi con trỏ nằm trong tiêu đề
    var state = { b: document.queryCommandState('bold') && blk !== 'h2' && blk !== 'h3', i: document.queryCommandState('italic'), ul: document.queryCommandState('insertUnorderedList'), ol: document.queryCommandState('insertOrderedList'), h2: blk === 'h2', h3: blk === 'h3', quote: blk === 'blockquote' };
    Object.keys(state).forEach(function (k) { var b = $('[data-cmd="' + k + '"]', box); if (b) { b.classList.toggle('is-active', !!state[k]); b.setAttribute('aria-pressed', String(!!state[k])); } });
  });

  A.register('pages', {
    title: 'Trang phụ',
    mount: mount,
    route: route,
    update: function (main, manual) {
      if (!manual) return;
      if (dirty()) { A.toast('Đang có thay đổi chưa lưu — hãy lưu hoặc hủy trước khi tải lại.', 'info'); return; }
      load(true).then(function () { if (A.view() === 'pages') show(P.editId || ''); });
    },
    isDirty: dirty,
    dirtyText: function () { return 'Trang đang sửa có thay đổi chưa lưu.'; },
    discard: function () { P.d = null; P.orig = ''; },
    reset: function () { P.list = null; P.d = null; P.orig = ''; P.err = ''; },
  });
})();
