/* Dapper Combat — Quản trị: Câu chuyện Founders (/cau-chuyen-founders)
   Tiêu đề, lời mở đầu, các chương (ảnh + mốc + tiêu đề + đoạn kể), câu trích dẫn. Ảnh tự thu nhỏ (≤ 1600px) trước khi tải lên.
   Dữ liệu: GET / PUT /api/founders (máy chủ làm sạch ở lib/founders.js). */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A) return;
  var esc = A.esc;
  var F = { d: null, orig: '', err: '', busy: false };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function dirty() { return !!F.d && JSON.stringify(F.d) !== F.orig; }
  function blank() { return { img: '', pos: 'center', wide: false, year: '', title: { vi: '', en: '' }, text: { vi: '', en: '' } }; }

  /* thu nhỏ ảnh điện thoại (thường 4–10MB) về ≤ 1600px JPEG trước khi tải lên */
  function shrink(file) {
    return new Promise(function (ok) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return ok(file);
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function (b) { ok(b && b.size < file.size ? new File([b], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file); }, 'image/jpeg', 0.84);
      };
      im.onerror = function () { URL.revokeObjectURL(url); ok(file); };
      im.src = url;
    });
  }
  function upload(file) { return shrink(file).then(function (f) { return A.uploadRaw(f); }).then(function (r) { return r.url; }); }

  function field(lbl, html, hint) { return '<label class="field"><span class="field__label">' + lbl + '</span>' + html + (hint ? '<small class="field__hint">' + hint + '</small>' : '') + '</label>'; }
  function inp(path, v, max, ph) { return '<input type="text" data-fd="' + path + '" value="' + esc(v || '') + '" maxlength="' + max + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>'; }
  function ta(path, v, max, rows, ph) { return '<textarea data-fd="' + path + '" maxlength="' + max + '" rows="' + rows + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>' + esc(v || '') + '</textarea>'; }

  function chapter(c, i, n) {
    return '<article class="fd-a-ch" data-i="' + i + '">' +
      '<div class="fd-a-pic">' + (c.img ? '<img src="' + esc(c.img) + '" alt="" style="object-position:' + c.pos + '">' : '<span>Chưa có ảnh</span>') +
      '<label class="btn btn--line btn--sm"><input type="file" accept="image/jpeg,image/png,image/webp" data-fd-img="' + i + '" hidden>' + (c.img ? 'Đổi ảnh' : 'Chọn ảnh') + '</label>' +
      '<select data-fd="chapters.' + i + '.pos" title="Phần ảnh được giữ khi cắt khung">' + [['center', 'Căn giữa'], ['top', 'Giữ phần trên'], ['bottom', 'Giữ phần dưới'], ['left', 'Giữ bên trái'], ['right', 'Giữ bên phải']]
        .map(function (o) { return '<option value="' + o[0] + '"' + (c.pos === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select' +
      '<label class="check"><input type="checkbox" data-fd="chapters.' + i + '.wide"' + (c.wide ? ' checked' : '') + '><span>Ảnh ngang, hiện rộng (ảnh nhóm)</span></label></div>' +
      '<div class="fd-a-body"><div class="fd-a-top"><b>Chương ' + (i + 1) + '</b><span>' +
      '<button type="button" class="btn btn--quiet btn--sm" data-fd-mv="' + i + ':-1"' + (i ? '' : ' disabled') + ' title="Đưa lên">↑</button>' +
      '<button type="button" class="btn btn--quiet btn--sm" data-fd-mv="' + i + ':1"' + (i < n - 1 ? '' : ' disabled') + ' title="Đưa xuống">↓</button>' +
      '<button type="button" class="btn btn--quiet btn--sm" data-fd-del="' + i + '" title="Xóa chương">Xóa</button></span></div>' +
      '<div class="grid2">' + field('Mốc thời gian', inp('chapters.' + i + '.year', c.year, 24, 'VD: 2019 · Sài Gòn')) + field('Tiêu đề', inp('chapters.' + i + '.title.vi', c.title.vi, 120)) + '</div>' +
      field('Câu chuyện', ta('chapters.' + i + '.text.vi', c.text.vi, 1500, 4), 'Xuống dòng để tách đoạn. Ngắn gọn 2–4 câu là đẹp nhất.') +
      '<details class="fd-a-en"><summary>English</summary>' + field('Title', inp('chapters.' + i + '.title.en', c.title.en, 120)) + field('Story', ta('chapters.' + i + '.text.en', c.text.en, 1500, 3)) + '</details>' +
      '</div></article>';
  }
  function view(main) {
    var d = F.d;
    var html = A.pageHead('Câu chuyện Founders', { eyebrow: 'Nội dung', count: false, stamp: false, refresh: false,
      actions: '<a class="btn btn--ghost" href="/cau-chuyen-founders" target="_blank" rel="noopener">Xem trang ↗</a><button class="btn btn--primary" type="button" data-fd-save' + (dirty() ? '' : ' disabled') + '>Lưu</button>' });
    if (!d) { main.innerHTML = html + (F.err ? A.errorHtml(F.err) : A.loadingHtml()); return; }
    html += '<section class="panel fd-a"><div class="fd-a-head">' +
      '<label class="check set-switch"><input type="checkbox" data-fd="on"' + (d.on ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span><strong>Hiện trang trên web</strong> · /cau-chuyen-founders</span></label>' +
      '<p class="field__hint">Mục “Founders” trên menu bật / tắt ở Thiết lập → Thương hiệu & menu.</p></div>' +
      '<div class="grid2">' + field('Tiêu đề trang', inp('title.vi', d.title.vi, 90)) + field('Title (English)', inp('title.en', d.title.en, 90)) + '</div>' +
      field('Lời mở đầu', ta('intro.vi', d.intro.vi, 800, 3)) + '<details class="fd-a-en"><summary>English</summary>' + field('Intro', ta('intro.en', d.intro.en, 800, 3)) + '</details></section>' +
      '<section class="panel fd-a"><header class="fd-a-sec"><h2 class="panel__title">Các chương · ' + d.chapters.length + '</h2>' +
      '<span><label class="btn btn--line btn--sm"><input type="file" accept="image/jpeg,image/png,image/webp" multiple data-fd-many hidden>+ Thêm nhiều ảnh</label>' +
      '<button type="button" class="btn btn--line btn--sm" data-fd-add>+ Thêm chương</button></span></header>' +
      '<p class="field__hint">Mỗi chương = 1 ảnh + 1 đoạn kể. Trên web ảnh và chữ xếp so le trái / phải theo thứ tự này. Chọn nhiều ảnh cùng lúc → mỗi ảnh thành 1 chương mới.</p>' +
      '<p class="fd-a-msg" data-fd-msg role="status"></p>' +
      '<div class="fd-a-list">' + d.chapters.map(function (c, i) { return chapter(c, i, d.chapters.length); }).join('') + '</div></section>' +
      '<section class="panel fd-a"><h2 class="panel__title">Câu trích dẫn cuối trang</h2>' +
      field('Câu trích dẫn', ta('quote.vi', d.quote.vi, 300, 2)) + '<div class="grid2">' + field('Quote (English)', inp('quote.en', d.quote.en, 300)) + field('Người nói', inp('quoteBy', d.quoteBy, 80, 'VD: Duy & Phong · Founders')) + '</div></section>';
    main.innerHTML = html;
  }
  function set(path, v) {
    var ks = path.split('.'), o = F.d;
    for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = v;
  }
  function msg(t) { var m = document.querySelector('[data-fd-msg]'); if (m) m.textContent = t || ''; }
  function syncSave() { var b = document.querySelector('[data-fd-save]'); if (b) b.disabled = !dirty() || F.busy; }
  function load(main) {
    F.err = ''; view(main);
    A.api('/founders').then(function (d) { F.d = d; F.orig = JSON.stringify(d); view(main); }, function (e) { F.err = (e && e.message) || 'Không tải được.'; view(main); });
  }
  var BOUND = new WeakSet();
  function bind(main) {
    if (BOUND.has(main)) return; BOUND.add(main);
    main.addEventListener('input', function (e) { var t = e.target, p = t.getAttribute && t.getAttribute('data-fd'); if (!p || !F.d) return; set(p, t.type === 'checkbox' ? t.checked : t.value); syncSave(); });
    main.addEventListener('change', function (e) {
      var t = e.target; if (!F.d) return;
      var p = t.getAttribute('data-fd'); if (p && t.tagName === 'SELECT') { set(p, t.value); view(main); return; }
      if (p && t.type === 'checkbox') { set(p, t.checked); syncSave(); return; }
      if (t.hasAttribute('data-fd-img') && t.files[0]) {
        var i = +t.getAttribute('data-fd-img'); msg('Đang tải ảnh lên…');
        upload(t.files[0]).then(function (url) { F.d.chapters[i].img = url; view(main); msg('Đã tải ảnh — nhớ bấm Lưu.'); }, function (er) { msg((er && er.message) || 'Tải ảnh thất bại.'); });
      }
      if (t.hasAttribute('data-fd-many') && t.files.length) {
        var files = Array.prototype.slice.call(t.files, 0, 24 - F.d.chapters.length), done = 0;
        // chương mẫu còn trống ảnh → điền ảnh vào trước
        var empty = F.d.chapters.filter(function (c) { return !c.img; });
        msg('Đang tải ' + files.length + ' ảnh…');
        files.reduce(function (pr, f) {
          return pr.then(function () {
            return upload(f).then(function (url) {
              var c = empty.shift(); if (!c) { c = blank(); F.d.chapters.push(c); }
              c.img = url; done++; msg('Đã tải ' + done + '/' + files.length + ' ảnh…');
            });
          });
        }, Promise.resolve()).then(function () { view(main); msg('Đã thêm ' + done + ' ảnh — viết câu chuyện cho từng chương rồi bấm Lưu.'); },
          function (er) { view(main); msg('Dừng ở ảnh ' + (done + 1) + ': ' + ((er && er.message) || 'tải lên thất bại')); });
      }
    });
    main.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fd-save],[data-fd-add],[data-fd-del],[data-fd-mv]'); if (!b || !F.d) return;
      if (b.hasAttribute('data-fd-add')) { F.d.chapters.push(blank()); view(main); return; }
      if (b.hasAttribute('data-fd-del')) {
        var di = +b.getAttribute('data-fd-del');
        A.confirmDialog({ title: 'Xóa chương ' + (di + 1) + '?', body: 'Ảnh và đoạn kể của chương này sẽ bị xóa khỏi trang (sau khi bấm Lưu).', ok: 'Xóa', cancel: 'Giữ lại' })
          .then(function (yes) { if (yes) { F.d.chapters.splice(di, 1); view(main); } });
        return;
      }
      if (b.hasAttribute('data-fd-mv')) {
        var mv = b.getAttribute('data-fd-mv').split(':'), a = +mv[0], c = a + +mv[1], L = F.d.chapters;
        if (c >= 0 && c < L.length) { var t = L[a]; L[a] = L[c]; L[c] = t; view(main); }
        return;
      }
      F.busy = true; syncSave();
      A.api('/founders', { method: 'PUT', body: F.d }).then(function (d) {
        F.busy = false; F.d = d; F.orig = JSON.stringify(d); view(main); A.toast('Đã lưu Câu chuyện Founders.');
      }, function (er) { F.busy = false; syncSave(); A.apiFail(er); });
    });
  }
  A.register('founders', {
    title: 'Câu chuyện Founders',
    mount: function (main) { bind(main); load(main); },
    update: function (main, manual) { if (manual && !dirty()) load(main); },
    isDirty: dirty,
    dirtyText: function () { return 'Câu chuyện Founders có thay đổi chưa lưu.'; },
    discard: function () { F.d = null; F.orig = ''; },
    reset: function () { F.d = null; F.orig = ''; F.err = ''; },
  });
})();
