/* Dapper Combat — Quản trị: Academy Ranking (kiểu BoxRec)
   Võ sĩ (#/fighters, #/fighters/<mã>) và Sự kiện & kết quả (#/rank-events, #/rank-events/<mã>).
   Dữ liệu: GET /api/admin/ranking (bản gốc + bản đã tính điểm, thứ hạng); lưu POST/PUT /api/fighters, /api/events (routes/ranking.js).
   HLV (tài khoản nhân viên) thêm / sửa võ sĩ, chấm điểm kỹ năng, nhập kết quả; xóa chỉ tài khoản admin.
   Tiếng Anh (giới thiệu võ sĩ, tên + mô tả sự kiện) do AI tự dịch khi lưu — ở đây chỉ hiện để xem.
   Mọi giá trị từ dữ liệu đều qua esc() trước khi chèn HTML; ảnh qua A.safeImg. */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A) return;
  var esc = A.esc, ICON = A.ICON;
  var VF = 'fighters', VE = 'rank-events';

  // nhãn (giống trang công khai xephang.js)
  var GENDER = { m: 'Nam', f: 'Nữ' };
  var STANCE = [['orthodox', 'Thuận'], ['southpaw', 'Tay trái'], ['switch', 'Đổi thế']];
  var TYPE = [['fight', 'Fight night'], ['sparring', 'Sparring'], ['assessment', 'Đánh giá kỹ năng'], ['other', 'Hoạt động Academy']];
  var METHOD = { KO: 'Hạ đo ván', TKO: 'Trọng tài dừng trận', RTD: 'Bỏ cuộc giữa hiệp', DQ: 'Truất quyền thi đấu',
    UD: 'Thắng điểm tuyệt đối', SD: 'Thắng điểm không tuyệt đối', MD: 'Thắng điểm đa số', PTS: 'Thắng điểm' };
  var DRAW = { UD: 'Hòa tuyệt đối', SD: 'Hòa không tuyệt đối', MD: 'Hòa đa số', PTS: 'Hòa tính điểm' };
  var STOP = ['KO', 'TKO', 'RTD', 'DQ'];
  var RES = { W: 'Thắng', L: 'Thua', D: 'Hòa', NC: 'Không KQ' };
  var RES_1 = { W: 'T', L: 'B', D: 'H' };
  var RES_LOW = { W: 'thắng', L: 'thua', D: 'hòa' };
  // ảnh gợi ý: chân dung dọc 4:5 (giống khung hồ sơ trên web), poster dọc 4:5
  var PHOTO = { w: 800, h: 1000, kb: 300 }, POSTER = { w: 1200, h: 1500, kb: 400 };
  var MAX_BOUTS = 40;
  var UP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7"/></svg>';
  var DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>';

  // R = dữ liệu từ máy chủ; LF / LE = bộ lọc danh sách võ sĩ / sự kiện; ED = trình sửa đang mở { view, id, src, d (bản nháp), orig }
  var R = { d: null, err: '', loading: null, at: 0, fx: null, cfx: null, cex: null };
  var LF = { q: '', g: 'all', div: 'all', st: 'all', sort: 'points' };
  var LE = { q: '', type: 'all' };
  var ED = null, CUR = { view: '', sub: '' }, seq = 0;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function clone(o) { return JSON.parse(JSON.stringify(o == null ? null : o)); }
  function on() { var v = A.view(); return v === VF || v === VE; }
  function today() { return (R.d && R.d.today) || A.member.today(); }

  // ═══ Tải dữ liệu ═══════════════════════════════════════════════════════════
  function load(force) {
    if (R.loading) return R.loading;
    if (R.d && !force) return Promise.resolve(R.d);
    R.loading = A.api('/admin/ranking').then(function (d) {
      if (!d || !Array.isArray(d.fighters) || !Array.isArray(d.events) || !d.computed) throw { message: 'Máy chủ trả về dữ liệu xếp hạng không hợp lệ.' };
      R.d = d; R.err = ''; R.at = Date.now(); index();
      return d;
    }).catch(function (e) { R.err = (e && e.message) || 'Không tải được dữ liệu xếp hạng'; return null; })
      .then(function (r) { R.loading = null; return r; });
    return R.loading;
  }
  function index() {
    R.fx = Object.create(null); R.cfx = Object.create(null); R.cex = Object.create(null);
    R.d.fighters.forEach(function (f) { if (f && f.id) R.fx[f.id] = f; });
    (R.d.computed.fighters || []).forEach(function (f) { if (f && f.id) R.cfx[f.id] = f; });
    (R.d.computed.events || []).forEach(function (e) { if (e && e.id) R.cex[e.id] = e; });
  }
  // lưu xong mà tải lại thất bại → tự chèn bản vừa lưu (chưa có điểm tính sẵn) để vẫn mở được
  function upsert(kind, item) {
    if (!R.d || !item || !item.id) return;
    var l = R.d[kind], i = l.findIndex(function (x) { return x.id === item.id; });
    if (i >= 0) l[i] = item; else l.push(item);
    index();
  }
  function fById(id) { return (R.fx && id && R.fx[id]) || null; }
  function cfById(id) { return (R.cfx && id && R.cfx[id]) || null; }
  function eById(id) { return (R.d ? R.d.events : []).filter(function (e) { return e.id === id; })[0] || null; }
  function ceById(id) { return (R.cex && id && R.cex[id]) || null; }
  function divs() { return (R.d && R.d.divisions) || []; }
  function skills() { return (R.d && R.d.skills) || []; }
  function methods() { return (R.d && R.d.methods) || Object.keys(METHOD); }
  function tiers() { return ((R.d && R.d.tiers) || []).slice().sort(function (a, b) { return b.min - a.min; }); }

  // ═══ Định dạng ═════════════════════════════════════════════════════════════
  function r1(n) { return Math.round((Number(n) || 0) * 10) / 10; }
  function n1(n) { return r1(n).toLocaleString('vi-VN', { maximumFractionDigits: 1 }); }
  function signed(n) { var x = r1(n); return x > 0 ? '+' + n1(x) : x < 0 ? '−' + n1(-x) : '±0'; }
  function deltaHtml(n) { var x = r1(n); return '<b class="rk-d' + (x > 0 ? ' is-up' : x < 0 ? ' is-down' : '') + '">' + esc(signed(x)) + '</b>'; }
  function rec(r) { r = r || {}; return (r.w || 0) + '-' + (r.l || 0) + '-' + (r.d || 0); }
  function day(s) { return s ? A.fmtWhen(s) : '—'; }
  function numStr(v) { return v == null || v === '' ? '' : String(v); }
  function toInt(v) { var n = parseInt(v, 10); return isFinite(n) ? n : 0; }
  function pair(v) { return { vi: String((v && v.vi) || ''), en: String((v && v.en) || '') }; }
  function slug(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); }
  function nameOf(id) { var f = fById(id); return f ? f.name : ''; }
  function typeName(t) { var x = TYPE.filter(function (y) { return y[0] === t; })[0]; return x ? x[1] : (t || ''); }
  function divName(id) { var d = divs().filter(function (x) { return x.id === id; })[0]; return d ? d.vi : (id || '—'); }
  // khoảng cân của hạng: "60–64 kg", hạng đầu "≤ 52 kg", hạng cuối "> 81 kg"
  function divRange(i) {
    var l = divs(), d = l[i], p = l[i - 1];
    if (!d) return '';
    if (!p) return '≤ ' + d.max + ' kg';
    return i === l.length - 1 ? '> ' + p.max + ' kg' : p.max + '–' + d.max + ' kg';
  }
  function divOf(kg) { var l = divs(); for (var i = 0; i < l.length; i++) if (kg <= l[i].max) return l[i].id; return l.length ? l[l.length - 1].id : ''; }
  function tierOf(p) { var t = tiers(); for (var i = 0; i < t.length; i++) if (p >= t[i].min) return t[i]; return t[t.length - 1] || null; }
  function tierBadge(id) {
    var t = tiers().filter(function (x) { return x.id === id; })[0];
    return t ? '<span class="badge rk-tier rk-tier--' + esc(t.id) + '">' + esc(t.vi) + '</span>' : '<span class="muted">—</span>';
  }
  function stars(n) { n = Math.max(0, Math.min(5, toInt(n))); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
  function avgOf(sk) {
    var l = skills(); if (!l.length) return 0;
    return r1(l.reduce(function (s, x) { return s + (Number(sk && sk[x.id]) || 0); }, 0) / l.length);
  }
  function ageOf(birth) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth || '')) return null;
    var b = birth.split('-').map(Number), t = today().split('-').map(Number);
    return t[0] - b[0] - (t[1] < b[1] || (t[1] === b[1] && t[2] < b[2]) ? 1 : 0);
  }
  function daysFromToday(ymd) { var a = Date.parse(ymd + 'T00:00:00Z'), b = Date.parse(today() + 'T00:00:00Z'); return isNaN(a) || isNaN(b) ? null : Math.round((a - b) / 864e5); }
  function pubF(f) { return '/vo-si/' + encodeURIComponent(f.slug || f.id); }
  function pubE(e) { return '/su-kien/' + encodeURIComponent(e.slug || e.id); }
  function thumb(url) { var src = A.safeImg(url); return '<span class="thumb">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : ICON.image) + '</span>'; }

  // ── khối HTML dùng chung ──
  function sec(title, body, meta, cls) {
    return '<section class="panel set-sec' + (cls ? ' ' + cls : '') + '"><header class="panel__head"><h2 class="panel__title">' + esc(title) + '</h2>' +
      (meta ? '<span class="cms-sec__meta">' + meta + '</span>' : '') + '</header><div class="set-body">' + body + '</div></section>';
  }
  // label / hint là chữ cố định của trang (đã an toàn); inner đã escape
  function field(label, inner, hint, cls) {
    return '<label class="field' + (cls ? ' ' + cls : '') + '"><span class="field__label">' + label + '</span>' + inner + (hint ? '<small class="field__hint">' + hint + '</small>' : '') + '</label>';
  }
  function optsHtml(opts, val) { return opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function filterSel(label, attr, opts, val) { return '<label class="datef"><span class="datef__label">' + esc(label) + '</span><select ' + attr + '>' + optsHtml(opts, val) + '</select></label>'; }
  function searchHtml(attr, ph, val) {
    return '<label class="search">' + ICON.search + '<span class="sr">Tìm kiếm</span><input type="search" ' + attr + ' placeholder="' + esc(ph) + '" value="' + esc(val) + '" autocomplete="off" spellcheck="false" enterkeyhint="search"></label>';
  }
  function chipsHtml(defs, active, attr) {
    return '<div class="chips" role="group" aria-label="Bộ lọc">' + defs.map(function (d) {
      var act = d[0] === active;
      return '<button type="button" class="chip' + (act ? ' is-active' : '') + '" ' + attr + '="' + esc(d[0]) + '" aria-pressed="' + act + '"><span>' + esc(d[1]) + '</span><span class="chip__n">' + esc(d[2]) + '</span></button>';
    }).join('') + '</div>';
  }
  // tiếng Anh: AI tự dịch khi lưu — chỉ hiện để xem
  function enHtml(p, what) {
    return '<details class="tpl-en rk-en"><summary>' + esc(what) + ' tiếng Anh: AI tự dịch</summary>' +
      (p.en ? '<p class="rk-en__text">' + esc(p.en) + '</p>'
        : p.vi ? '<p class="field__hint">Chưa có bản tiếng Anh — AI đang dịch' + (A.isAdmin() ? ' (hoặc chưa cài khóa ở <a href="#/cms-ai">Tiếng Anh (AI)</a>)' : '') + '. Trang tiếng Anh tạm hiện bản tiếng Việt.</p>'
          : '<p class="field__hint">Chưa có nội dung.</p>') +
      '<p class="field__hint">Bạn chỉ cần sửa tiếng Việt — bấm Lưu là AI dịch lại phần này.</p></details>';
  }
  function savebarHtml(ok) {
    return '<div class="savebar" data-savebar="rk" hidden role="region" aria-label="Lưu thay đổi"><p class="savebar__msg" data-rk-barmsg></p>' +
      '<div class="savebar__actions"><button class="btn btn--on-dark" type="button" data-rk-discard>Hủy</button><button class="btn btn--primary" type="button" data-rk-save>' + esc(ok) + '</button></div></div>';
  }
  function dangerHtml(label, hint) {
    return '<div class="rk-danger"><button type="button" class="btn btn--quiet btn--sm" data-rk-del>' + ICON.trash + '<span>' + esc(label) + '</span></button><p class="field__hint">' + hint + '</p></div>';
  }
  function headLoading(view) {
    return A.pageHead(view === VF ? 'Võ sĩ' : 'Sự kiện & kết quả', { eyebrow: 'Academy Ranking', stamp: false, count: false });
  }
  function notFound(view) {
    return headLoading(view) + A.emptyHtml(view === VF ? 'Không tìm thấy võ sĩ này' : 'Không tìm thấy sự kiện này', 'Có thể đã bị xóa.') +
      '<p class="rk-back"><a class="btn btn--line" href="#/' + view + '">← ' + (view === VF ? 'Danh sách võ sĩ' : 'Danh sách sự kiện') + '</a></p>';
  }
  function stamp() { var s = $('[data-rk-root] [data-stamp]'); if (s) s.textContent = R.at ? 'Cập nhật ' + A.fmtTime(R.at) : ''; }
  function msg(text) { var m = $('[data-rk-msg]'); if (!m) return; m.textContent = text || ''; m.hidden = !text; if (text) m.scrollIntoView({ block: 'nearest' }); }

  // ═══ Điều hướng trong màn ══════════════════════════════════════════════════
  function route(view, sub) {
    // đang sửa dở mà rời trình sửa → hỏi trước
    if (ED && ED.view === view && sub !== ED.id && dirty()) {
      var to = '#/' + view + (sub ? '/' + encodeURIComponent(sub) : '');
      history.replaceState(null, '', '#/' + view + '/' + encodeURIComponent(ED.id)); A.syncRoute();
      A.confirmDialog({ title: 'Bỏ thay đổi chưa lưu?', body: dirtyText() + ' Nếu rời đi, các thay đổi sẽ mất.', ok: 'Bỏ thay đổi', cancel: 'Ở lại' }).then(function (yes) {
        if (!yes) return;
        ED = null;
        history.replaceState(null, '', to); A.syncRoute();
        show(view, sub); window.scrollTo(0, 0);
      });
      return;
    }
    show(view, sub);
    window.scrollTo(0, 0);
  }
  function show(view, sub) {
    var root = $('[data-rk-root]');
    if (!root || A.view() !== view) return;
    CUR = { view: view, sub: sub };
    if (!R.d) {
      ED = null;
      root.innerHTML = headLoading(view) + (R.err ? A.errorHtml(R.err) : A.loadingHtml());
      if (!R.err) load().then(function () { if (A.view() === view && CUR.sub === sub) show(view, sub); });
      return;
    }
    if (sub) { if (view === VF) fEditor(sub); else eEditor(sub); }
    else { ED = null; if (view === VF) fList(); else eList(); }
  }

  // ═══ Danh sách võ sĩ ═══════════════════════════════════════════════════════
  function fList() {
    var root = $('[data-rk-root]');
    root.innerHTML = A.pageHead('Võ sĩ', { eyebrow: 'Academy Ranking',
        actions: '<a class="btn btn--ghost" href="/phieu-vo-si" target="_blank" rel="noopener">In phiếu thông tin võ sĩ ↗</a><a class="btn btn--ghost" href="/xep-hang" target="_blank" rel="noopener">Bảng xếp hạng ↗</a>' +
          '<a class="btn btn--primary" href="#/fighters/new">' + ICON.plus + '<span>Thêm võ sĩ</span></a>' }) +
      '<div class="cms-help"><p>Hồ sơ võ sĩ trên <a href="/xep-hang" target="_blank" rel="noopener">Dapper Combat Academy Ranking</a>. <strong>Điểm xếp hạng</strong> = điểm kỹ năng (trung bình 6 kỹ năng HLV chấm × 10) cộng / trừ điểm thắng thua sau mỗi trận. ' +
        'Bấm vào võ sĩ để sửa hồ sơ hoặc chấm điểm kỹ năng; kết quả trận nhập ở <a href="#/rank-events">Sự kiện &amp; kết quả</a>. Chỉ võ sĩ <strong>đang thi đấu</strong> và <strong>đang hiện trên web</strong> được xếp hạng.</p></div>' +
      '<div class="toolbar rk-toolbar"><div data-rkf-chips></div>' +
        filterSel('Hạng cân', 'data-rkf-div', [['all', 'Tất cả']].concat(divs().map(function (d) { return [d.id, d.vi]; })), LF.div) +
        filterSel('Trạng thái', 'data-rkf-st', [['all', 'Tất cả'], ['active', 'Đang thi đấu'], ['inactive', 'Nghỉ thi đấu'], ['hidden', 'Đang ẩn trên web']], LF.st) +
        filterSel('Xếp theo', 'data-rkf-sort', [['points', 'Điểm cao → thấp'], ['name', 'Tên A → Z'], ['new', 'Mới thêm']], LF.sort) +
        searchHtml('data-rkf-q', 'Tên, biệt danh, quê quán…', LF.q) +
      '</div><div data-rkf-demo></div><div data-rkf-list></div>';
    stamp(); fRows();
  }
  // dữ liệu mẫu (võ sĩ vs01–vs20, sự kiện sk01–sk08 do tools/ranking-demo.js tạo): admin xóa một lần trước khi chạy thật
  var DEMO_F = /^vs\d\d$/, DEMO_E = /^sk\d\d$/;
  function demoHtml() {
    if (!A.isAdmin() || !R.d) return '';
    var nf = R.d.fighters.filter(function (f) { return DEMO_F.test(f.id); }).length, ne = R.d.events.filter(function (e) { return DEMO_E.test(e.id); }).length;
    if (!nf && !ne) return '';
    return '<div class="alert rk-alert rk-demo">' + ICON.warn + '<p class="alert__text"><strong>Đang có dữ liệu mẫu</strong> (' + nf + ' võ sĩ, ' + ne + ' sự kiện, ảnh minh họa) để xem thử bảng xếp hạng. Trước khi chạy thật, thêm võ sĩ thật rồi bấm “Xóa dữ liệu mẫu” — võ sĩ và sự kiện bạn tự thêm được giữ nguyên.</p>' +
      '<button class="btn btn--line btn--sm" type="button" data-rk-demo>' + ICON.trash + '<span>Xóa dữ liệu mẫu</span></button></div>';
  }
  function clearDemo(btn) {
    A.confirmDialog({ title: 'Xóa toàn bộ dữ liệu mẫu?', body: '20 võ sĩ mẫu, 8 sự kiện mẫu cùng các trận của họ sẽ bị xóa vĩnh viễn. Võ sĩ, sự kiện bạn tự thêm vẫn giữ nguyên (trận đấu với võ sĩ mẫu bị bỏ).', ok: 'Xóa dữ liệu mẫu', cancel: 'Quay lại' })
      .then(function (yes) {
        if (!yes) return;
        btn.disabled = true;
        A.api('/admin/ranking/demo', { method: 'DELETE' }).then(function (r) {
          A.toast('Đã xóa ' + r.fighters + ' võ sĩ mẫu và ' + r.events + ' sự kiện mẫu.');
          return load(true).then(function () { if (A.view() === VF) fList(); });
        }, function (e) { btn.disabled = false; A.toast((e && e.message) || 'Chưa xóa được dữ liệu mẫu', 'err'); });
      });
  }
  function fPass(f) {
    if (LF.div !== 'all' && f.division !== LF.div) return false;
    if (LF.st === 'active' && f.status === 'inactive') return false;
    if (LF.st === 'inactive' && f.status !== 'inactive') return false;
    if (LF.st === 'hidden' && f.visible !== false) return false;
    return A.matches(LF.q, [f.name, f.nickname, f.hometown, f.coach, f.slug]);
  }
  function fRows() {
    var box = $('[data-rkf-list]'), chips = $('[data-rkf-chips]'); if (!box || !R.d) return;
    var demo = $('[data-rkf-demo]'); if (demo) demo.innerHTML = demoHtml();
    var all = R.d.computed.fighters || [], cnt = $('[data-rk-root] [data-count]');
    if (cnt) cnt.textContent = String(all.length);
    var gOf = function (f) { return f.gender === 'f' ? 'f' : 'm'; };
    var focused = document.activeElement && chips.contains(document.activeElement) ? document.activeElement.getAttribute('data-rkf-g') : null;
    chips.innerHTML = chipsHtml([['all', 'Tất cả', all.length], ['m', 'Nam', all.filter(function (f) { return gOf(f) === 'm'; }).length], ['f', 'Nữ', all.filter(function (f) { return gOf(f) === 'f'; }).length]], LF.g, 'data-rkf-g');
    if (focused) { var fb = $('[data-rkf-g="' + focused + '"]', chips); if (fb) fb.focus(); }
    if (!all.length) { box.innerHTML = A.emptyHtml('Chưa có võ sĩ nào', 'Bấm “Thêm võ sĩ” để tạo hồ sơ đầu tiên.'); return; }
    var rows = all.filter(function (f) { return (LF.g === 'all' || gOf(f) === LF.g) && fPass(f); });
    rows.sort(LF.sort === 'name' ? function (a, b) { return a.name.localeCompare(b.name, 'vi'); }
      : LF.sort === 'new' ? function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }
        : function (a, b) { return (b.points - a.points) || a.name.localeCompare(b.name, 'vi'); });
    if (!rows.length) { box.innerHTML = A.emptyHtml('Không có võ sĩ phù hợp', 'Thử chọn “Tất cả” hoặc đổi từ khóa tìm kiếm.'); return; }
    box.innerHTML = '<div class="table-wrap"><table class="tbl tbl--rkf"><thead><tr>' +
        '<th scope="col" class="c-thumb">Ảnh</th><th scope="col" class="c-name">Võ sĩ</th><th scope="col" class="c-gender">Giới tính</th><th scope="col" class="c-div">Hạng cân</th>' +
        '<th scope="col" class="c-rec">T-B-H</th><th scope="col" class="c-num c-pts">Điểm</th><th scope="col" class="c-tier">Hạng</th><th scope="col" class="c-rank">Thứ hạng</th>' +
        '<th scope="col" class="c-status">Trạng thái</th><th scope="col" class="c-toggle">Trên web</th></tr></thead><tbody>' +
      rows.map(fRow).join('') + '</tbody></table></div>' +
      '<p class="results-meta">Hiển thị ' + rows.length + ' / ' + all.length + ' võ sĩ</p>';
  }
  function fRow(f) {
    var href = '#/fighters/' + encodeURIComponent(f.id), hidden = f.visible === false, rk = f.rank, g = f.gender === 'f' ? 'f' : 'm', r = f.record || {};
    var recSub = [r.ko ? r.ko + ' KO' : '', r.nc ? r.nc + ' không KQ' : ''].filter(Boolean).join(' · ');
    return '<tr data-href="' + esc(href) + '"' + (hidden ? ' class="is-hidden"' : '') + '>' +
      '<td class="c-thumb" data-label="Ảnh">' + thumb(f.photo) + '</td>' +
      '<td class="c-name" data-label="Võ sĩ"><a class="cell-title" href="' + esc(href) + '">' + esc(f.name) + '</a>' +
        '<span class="cell-sub">' + (f.nickname ? '<span>“' + esc(f.nickname) + '”</span>' : '') +
          (hidden ? '<span class="tag tag--muted">Đang ẩn</span>' : '<a class="rk-weblink" href="' + esc(pubF(f)) + '" target="_blank" rel="noopener">Xem trên web ↗</a>') + '</span></td>' +
      '<td class="c-gender" data-label="Giới tính">' + esc(GENDER[g]) + (f.age != null ? '<span class="cell-sub">' + esc(f.age) + ' tuổi</span>' : '') + '</td>' +
      '<td class="c-div" data-label="Hạng cân">' + esc(divName(f.division)) + (f.weight ? '<span class="cell-sub">' + esc(n1(f.weight)) + ' kg</span>' : '') + '</td>' +
      '<td class="c-rec" data-label="T-B-H"><strong>' + esc(rec(r)) + '</strong>' + (recSub ? '<span class="cell-sub">' + esc(recSub) + '</span>' : '') + '</td>' +
      '<td class="c-num c-pts" data-label="Điểm" title="' + esc('Điểm kỹ năng ' + f.skillPoints + ', điểm thắng thua ' + signed(f.fightPoints)) + '"><strong>' + esc(n1(f.points)) + '</strong>' +
        '<span class="cell-sub">' + esc(f.skillPoints) + ' kỹ năng · ' + esc(signed(f.fightPoints)) + '</span></td>' +
      '<td class="c-tier" data-label="Hạng">' + tierBadge(f.tier) + (f.stars ? '<span class="cell-sub rk-stars" title="' + esc(f.stars) + ' sao">' + stars(f.stars) + '</span>' : '') + '</td>' +
      '<td class="c-rank" data-label="Thứ hạng">' + (rk ? '<strong>#' + esc(rk.overall) + '</strong> / ' + esc(rk.overallOf) + ' ' + (g === 'f' ? 'nữ' : 'nam') +
          '<span class="cell-sub">#' + esc(rk.div) + ' / ' + esc(rk.divOf) + ' hạng cân</span>'
        : '<span class="muted" title="Chỉ võ sĩ đang thi đấu và đang hiện trên web được xếp hạng">Chưa xếp hạng</span>') + '</td>' +
      '<td class="c-status" data-label="Trạng thái">' + (f.status === 'inactive' ? '<span class="badge badge--off">Nghỉ thi đấu</span>' : '<span class="badge">Đang thi đấu</span>') + '</td>' +
      '<td class="c-toggle" data-label="Trên web"><label class="switch"><input type="checkbox" data-rkf-vis="' + esc(f.id) + '"' + (hidden ? '' : ' checked') + '>' +
        '<span class="switch__ui" aria-hidden="true"></span><span class="sr">Hiện “' + esc(f.name) + '” trên web</span></label></td></tr>';
  }
  function toggleVis(input) {
    var id = input.getAttribute('data-rkf-vis'), f = fById(id); if (!f) return;
    var want = input.checked;
    input.disabled = true;
    A.api('/fighters/' + encodeURIComponent(id), { method: 'PUT', body: { visible: want } }).then(function (nf) {
      return load(true).then(function (ok) {
        if (!ok) upsert('fighters', nf);
        if (A.view() === VF && !ED) fRows();
        A.toast(want ? 'Đã hiện “' + f.name + '” trên web.' : 'Đã ẩn “' + f.name + '” khỏi web và bảng xếp hạng.', 'ok', want ? { href: pubF(nf), label: 'Xem trên web ↗' } : null);
      });
    }, function (e) { input.checked = !want; input.disabled = false; A.apiFail(e); });
  }

  // ═══ Sửa võ sĩ ═════════════════════════════════════════════════════════════
  function fDraft(src) {
    src = src || {};
    var sk = {}, pv = src.private || {}, mv = {};
    moveSlots().forEach(function (k) { var m = (src.moves && src.moves[k]) || {}; mv[k] = { name: pair(m.name), desc: pair(m.desc) }; });
    skills().forEach(function (s) {
      var raw = src.skills ? src.skills[s.id] : null, v = Number(raw);
      sk[s.id] = raw != null && raw !== '' && isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 50;
    });
    return {
      name: src.name || '', nickname: src.nickname || '', gender: src.gender === 'f' ? 'f' : 'm', birth: src.birth || '',
      weight: numStr(src.weight), division: src.division || '', stance: src.stance || 'orthodox', height: numStr(src.height), reach: numStr(src.reach),
      hometown: src.hometown || '', joined: src.joined || '', coach: src.coach || '', photo: src.photo || '',
      status: src.status === 'inactive' ? 'inactive' : 'active', visible: src.visible !== false, bio: pair(src.bio),
      skills: sk, assessDate: today(), assessNote: '', slug: src.slug || '',
      started: src.started || '', otherArts: src.otherArts || '', priorRecord: src.priorRecord || '', idol: src.idol || '',
      style: pair(src.style), goal: pair(src.goal), evalStrong: pair(src.evalStrong), evalWeak: pair(src.evalWeak), evalNote: pair(src.evalNote),
      private: { phone: pv.phone || '', emName: pv.emName || '', emRelation: pv.emRelation || '', emPhone: pv.emPhone || '', health: pv.health || '' },
      moves: mv,
    };
  }
  // chiêu trên hồ sơ: P = thế đứng, 6 kỹ năng (3 cao nhất là Q W E), R = tuyệt chiêu
  function moveSlots() { return ['stance'].concat(skills().map(function (s) { return s.id; }), ['ult']); }
  // dữ liệu gửi máy chủ (cũng dùng để so sánh có thay đổi chưa lưu)
  function fBody(d) {
    var nv = function (s) { s = String(s == null ? '' : s).trim(); return s === '' ? null : Number(s); };
    return {
      name: d.name.trim(), nickname: d.nickname.trim(), gender: d.gender, birth: d.birth, weight: nv(d.weight), division: d.division, stance: d.stance,
      height: nv(d.height), reach: nv(d.reach), hometown: d.hometown.trim(), joined: d.joined, coach: d.coach.trim(), photo: d.photo,
      status: d.status, visible: !!d.visible, bio: { vi: d.bio.vi.trim(), en: d.bio.en }, skills: clone(d.skills),
      assessDate: d.assessDate, assessNote: d.assessNote.trim(), slug: d.slug.replace(/^-+|-+$/g, ''),
      started: d.started, otherArts: d.otherArts.trim(), priorRecord: d.priorRecord.trim(), idol: d.idol.trim(),
      style: tp(d.style), goal: tp(d.goal), evalStrong: tp(d.evalStrong), evalWeak: tp(d.evalWeak), evalNote: tp(d.evalNote),
      private: { phone: d.private.phone.trim(), emName: d.private.emName.trim(), emRelation: d.private.emRelation.trim(), emPhone: d.private.emPhone.trim(), health: d.private.health.trim() },
      moves: moveSlots().reduce(function (o, k) { o[k] = { name: tp(d.moves[k].name), desc: tp(d.moves[k].desc) }; return o; }, {}),
    };
  }
  function tp(p) { return { vi: String(p.vi || '').trim(), en: p.en || '' }; }
  function setPath(o, p, v) { var ks = p.split('.'), last = ks.pop(); ks.forEach(function (k) { o = o[k]; }); o[last] = v; }
  function fEditor(id) {
    var root = $('[data-rk-root]'), isNew = id === 'new', src = isNew ? null : fById(id);
    if (!isNew && !src) { ED = null; root.innerHTML = notFound(VF); return; }
    var c = isNew ? null : cfById(id), hist = (src && Array.isArray(src.assessments)) ? src.assessments : [];
    var last = hist[hist.length - 1];
    ED = { view: VF, id: id, src: src, d: fDraft(src), prevSk: (last && last.skills) || (src && src.skills) || null };
    var d = ED.d;
    root.innerHTML = A.pageHead(isNew ? 'Thêm võ sĩ' : src.name, { eyebrow: isNew ? 'Academy Ranking · Võ sĩ' : 'Hồ sơ võ sĩ', stamp: false, count: false,
        actions: '<a class="btn btn--ghost" href="#/fighters">← Danh sách</a>' +
          (!isNew && src.visible !== false ? '<a class="btn btn--ghost" href="' + esc(pubF(src)) + '" target="_blank" rel="noopener">Xem trên web ↗</a>' : '') }) +
      '<p class="form-msg" data-rk-msg role="alert" hidden></p>' +
      '<div class="rk-grid"><div class="rk-main">' +
        '<p class="cms-help rk-paper">Các mục <strong>A1–A5</strong> (võ sĩ tự khai) và <strong>B1–B3</strong> (HLV đánh giá) khớp với <a href="/phieu-vo-si" target="_blank" rel="noopener">phiếu thông tin võ sĩ in ra giấy</a>: chép lần lượt từng mục.</p>' +
        sec('A1. Thông tin cá nhân',
          '<div class="set-grid2">' +
            field('Họ tên — bắt buộc', '<input type="text" data-ff="name" value="' + esc(d.name) + '" maxlength="80" autocomplete="off" placeholder="VD: Nguyễn Văn A">') +
            field('Biệt danh', '<input type="text" data-ff="nickname" value="' + esc(d.nickname) + '" maxlength="40" autocomplete="off" placeholder="Không bắt buộc">') +
          '</div><div class="set-grid3">' +
            field('Giới tính', '<select data-ff="gender">' + optsHtml([['m', 'Nam'], ['f', 'Nữ']], d.gender) + '</select>') +
            field('Ngày sinh', '<input type="date" data-ff="birth" value="' + esc(d.birth) + '" max="' + esc(today()) + '">', '<span data-rk-age></span>') +
            field('Gia nhập Academy', '<input type="date" data-ff="joined" value="' + esc(d.joined) + '" max="' + esc(today()) + '">') +
          '</div><div class="set-grid2">' +
            field('Quê quán', '<input type="text" data-ff="hometown" value="' + esc(d.hometown) + '" maxlength="60" autocomplete="off" placeholder="VD: TP. Hồ Chí Minh">') +
            field('HLV phụ trách', '<input type="text" data-ff="coach" value="' + esc(d.coach) + '" maxlength="60" autocomplete="off">') +
          '</div>') +
        sec('A2. Thể hình & hạng cân',
          '<div class="set-grid3">' +
            field('Cân nặng', '<span class="set-affix"><input type="number" data-ff="weight" value="' + esc(d.weight) + '" min="30" max="200" step="0.1" inputmode="decimal"><em>kg</em></span>') +
            field('Chiều cao', '<span class="set-affix"><input type="number" data-ff="height" value="' + esc(d.height) + '" min="120" max="230" step="1" inputmode="numeric"><em>cm</em></span>') +
            field('Sải tay', '<span class="set-affix"><input type="number" data-ff="reach" value="' + esc(d.reach) + '" min="120" max="240" step="1" inputmode="numeric"><em>cm</em></span>') +
          '</div><div class="set-grid2">' +
            field('Hạng cân', '<select data-ff="division">' + divOptions(d.division) + '</select>', '<span data-rk-divhint></span>') +
            field('Thế đứng', '<select data-ff="stance">' + optsHtml(STANCE, d.stance) + '</select>') +
          '</div>') +
        sec('A3. Kinh nghiệm',
          '<div class="set-grid3">' +
            field('Bắt đầu tập boxing (tháng / năm)', '<input type="month" data-ff="started" value="' + esc(d.started) + '" max="' + esc(today().slice(0, 7)) + '">') +
            field('Môn võ khác đã tập', '<input type="text" data-ff="otherArts" value="' + esc(d.otherArts) + '" maxlength="100" autocomplete="off" placeholder="VD: Muay Thái 1 năm">') +
            field('Thành tích trước khi vào Academy', '<input type="text" data-ff="priorRecord" value="' + esc(d.priorRecord) + '" maxlength="100" autocomplete="off" placeholder="VD: Nghiệp dư 3-1-0">') +
          '</div><p class="field__hint">Hiện trong mục Hồ sơ võ sĩ trên web (ô để trống thì không hiện).</p>') +
        sec('A4. Phong cách & giới thiệu',
          '<div class="set-grid3">' +
            field('Lối đánh', '<input type="text" data-ff="style.vi" value="' + esc(d.style.vi) + '" maxlength="200" autocomplete="off" placeholder="VD: Áp sát, đòn nặng">') +
            field('Thần tượng', '<input type="text" data-ff="idol" value="' + esc(d.idol) + '" maxlength="60" autocomplete="off" placeholder="VD: Manny Pacquiao">') +
            field('Mục tiêu', '<input type="text" data-ff="goal.vi" value="' + esc(d.goal.vi) + '" maxlength="200" autocomplete="off" placeholder="VD: Vào top 3 hạng cân">') +
          '</div>' +
          field('Giới thiệu (Tiếng Việt)', '<textarea rows="5" maxlength="2000" data-ff="bio" placeholder="Đôi dòng về võ sĩ: vì sao tập boxing, thành tích nổi bật…">' + esc(d.bio.vi) + '</textarea>', 'Hiện trong hồ sơ võ sĩ trên web. Tiếng Anh do AI tự dịch khi lưu.') +
          enHtml(d.bio, 'Bản')) +
        sec('A5. Liên hệ & sức khỏe',
          '<p class="set-note">Chỉ HLV và admin xem, <strong>không bao giờ hiện trên web</strong>.</p>' +
          '<div class="set-grid2">' +
            field('Số điện thoại võ sĩ', '<input type="tel" data-ff="private.phone" value="' + esc(d.private.phone) + '" maxlength="20" autocomplete="off" inputmode="tel">') +
            field('Người liên hệ khẩn cấp', '<input type="text" data-ff="private.emName" value="' + esc(d.private.emName) + '" maxlength="60" autocomplete="off">') +
            field('Quan hệ', '<input type="text" data-ff="private.emRelation" value="' + esc(d.private.emRelation) + '" maxlength="30" autocomplete="off" placeholder="VD: Bố, mẹ, vợ…">') +
            field('SĐT người liên hệ', '<input type="tel" data-ff="private.emPhone" value="' + esc(d.private.emPhone) + '" maxlength="20" autocomplete="off" inputmode="tel">') +
          '</div>' +
          field('Chấn thương / bệnh cần lưu ý', '<textarea rows="3" maxlength="500" data-ff="private.health" placeholder="VD: Từng trật khớp vai phải (2024), hen nhẹ…">' + esc(d.private.health) + '</textarea>')) +
        fSkillsHtml(d, hist, last) +
        fMovesHtml(d) +
        sec('B3. Nhận xét của HLV',
          '<div class="set-grid2">' +
            field('Điểm mạnh', '<textarea rows="4" maxlength="600" data-ff="evalStrong.vi" placeholder="Mỗi dòng một ý">' + esc(d.evalStrong.vi) + '</textarea>') +
            field('Cần cải thiện', '<textarea rows="4" maxlength="600" data-ff="evalWeak.vi" placeholder="Mỗi dòng một ý">' + esc(d.evalWeak.vi) + '</textarea>') +
          '</div>' +
          field('Nhận xét chung', '<textarea rows="3" maxlength="1000" data-ff="evalNote.vi" placeholder="Thái độ tập, tiến bộ, đề xuất thời gian tới…">' + esc(d.evalNote.vi) + '</textarea>',
            'Hiện trong mục Phân tích của hồ sơ võ sĩ trên web, kèm tên HLV phụ trách. Tiếng Anh do AI tự dịch khi lưu.')) +
      '</div><aside class="rk-side">' +
        imgSecHtml('Ảnh võ sĩ', 'Ảnh chân dung dọc tỉ lệ 4:5 — nên ' + PHOTO.w + ' × ' + PHOTO.h + ' px, JPG hoặc WebP ≤ ' + PHOTO.kb + ' KB. Chụp nửa người, mặt rõ, nền gọn.') +
        sec('Thi đấu & hiển thị',
          field('Trạng thái', '<select data-ff="status">' + optsHtml([['active', 'Đang thi đấu'], ['inactive', 'Nghỉ thi đấu']], d.status) + '</select>', 'Nghỉ thi đấu: hồ sơ vẫn hiện trên web nhưng không được xếp hạng.') +
          '<div><label class="check"><input type="checkbox" data-ff="visible"' + (d.visible ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span>Hiện trên web</span></label>' +
            '<p class="field__hint">Bật khi võ sĩ đã đồng ý ở mục A6 của phiếu. Tắt = ẩn hồ sơ khỏi website và bảng xếp hạng. Các trận đã đấu vẫn tính điểm cho đối thủ.</p></div>' +
          field('Đường dẫn trên web', '<span class="pslug"><em>/vo-si/</em><input type="text" data-ff="slug" value="' + esc(d.slug) + '" maxlength="60" spellcheck="false" autocomplete="off" placeholder="' + esc(slug(d.name) || 'ten-vo-si') + '"></span>',
            'Chữ thường không dấu, số và dấu gạch ngang. Để trống = tự tạo từ họ tên.')) +
        (c ? fStatsHtml(c) + fBoutsHtml(c) : '') +
        (A.isAdmin() && !isNew ? dangerHtml('Xóa võ sĩ', 'Chỉ xóa được võ sĩ chưa có trận nào. Võ sĩ đã thi đấu: chuyển sang “Nghỉ thi đấu” hoặc tắt “Hiện trên web”.') : '') +
      '</aside></div>' +
      savebarHtml(isNew ? 'Thêm võ sĩ' : 'Lưu võ sĩ');
    ED.orig = JSON.stringify(fBody(d));
    divHint(); ageHint(); skSum(); imgUi(); bar();
  }
  function divOptions(sel) {
    return '<option value=""' + (sel ? '' : ' selected') + ' data-rk-auto>Tự động theo cân nặng</option>' +
      divs().map(function (x, i) { return '<option value="' + esc(x.id) + '"' + (sel === x.id ? ' selected' : '') + '>' + esc(x.vi + ' (' + divRange(i) + ')') + '</option>'; }).join('');
  }
  // gợi ý hạng cân theo cân nặng; ô "Tự động" ghi rõ hạng sẽ được chọn
  function divHint() {
    if (!ED || ED.view !== VF) return;
    var box = $('[data-rk-divhint]'), auto = $('[data-rk-auto]'), d = ED.d;
    var w = String(d.weight).trim() === '' ? NaN : Number(d.weight), sug = w >= 30 && w <= 200 ? divOf(w) : '';
    if (auto) auto.textContent = 'Tự động theo cân nặng' + (sug ? ' — ' + divName(sug) : '');
    if (!box) return;
    if (!sug) box.innerHTML = d.division ? '' : 'Nhập cân nặng để tự chọn hạng cân.';
    else if (!d.division) box.innerHTML = 'Theo cân nặng ' + esc(n1(w)) + ' kg: <strong>' + esc(divName(sug)) + '</strong>.';
    else if (d.division !== sug) box.innerHTML = '<span class="set-warn">' + esc(n1(w)) + ' kg thuộc ' + esc(divName(sug)) + '.</span> <button type="button" class="linkbtn" data-rk-usediv="' + esc(sug) + '">Dùng ' + esc(divName(sug)) + '</button>';
    else box.innerHTML = 'Đúng hạng theo cân nặng.';
  }
  function ageHint() {
    var box = $('[data-rk-age]'); if (!box || !ED) return;
    var a = ageOf(ED.d.birth);
    box.textContent = (a != null && a >= 0 ? a + ' tuổi. ' : '') + 'Trên web chỉ hiện tuổi, không hiện ngày sinh.';
  }

  // ── chấm điểm kỹ năng ──
  function fSkillsHtml(d, hist, last) {
    var rows = skills().map(function (s) {
      var v = d.skills[s.id], id = 'rk-sk-' + s.id;
      return '<div class="rk-skill" data-sk-row="' + esc(s.id) + '">' +
        '<label class="rk-skill__label" for="' + esc(id) + '">' + esc(s.vi) + '</label>' +
        '<input class="rk-range" type="range" min="0" max="100" step="1" value="' + esc(v) + '" data-sk="' + esc(s.id) + '" style="--p:' + esc(v) + '%" aria-label="' + esc(s.vi + ' (thanh kéo 0–100)') + '">' +
        '<input class="rk-skill__num" id="' + esc(id) + '" type="number" min="0" max="100" step="1" inputmode="numeric" value="' + esc(v) + '" data-sk-num="' + esc(s.id) + '">' +
        '<span class="rk-skill__prev" data-sk-prev></span></div>';
    }).join('');
    return sec('B1. Chấm điểm kỹ năng',
      '<p class="set-note">Thang 0–100 cho từng kỹ năng — kéo thanh hoặc gõ số. Điểm và hạng bên dưới cập nhật ngay khi chấm.</p>' +
      '<div class="rk-skills">' + rows + '</div>' +
      '<div class="rk-sum" data-rk-sum aria-live="polite"></div>' +
      '<div class="set-grid2">' +
        field('Ngày chấm', '<input type="date" data-ff="assessDate" value="' + esc(d.assessDate) + '" max="' + esc(today()) + '">') +
        field('Ghi chú lần chấm', '<input type="text" data-ff="assessNote" value="' + esc(d.assessNote) + '" maxlength="200" autocomplete="off" placeholder="VD: Kỳ đánh giá Quý IV">') +
      '</div>' +
      '<p class="field__hint">Lưu mà điểm kỹ năng có thay đổi sẽ ghi thêm một dòng vào lịch sử chấm điểm (theo ngày chấm ở trên). Lưu mà không đổi điểm thì không ghi.</p>' +
      histHtml(hist),
      esc(last ? 'Chấm gần nhất ' + day(last.date) : 'Chưa chấm lần nào'));
  }
  // B2. chiêu trên hồ sơ: tên + mô tả tự đặt cho P (thế đứng), từng kỹ năng (3 kỹ năng cao nhất thành Q W E) và R (tuyệt chiêu)
  var MOVE_DEF = { technique: 'Đòn chuẩn xác', speed: 'Tay nhanh', power: 'Cú đấm nặng ký', defense: 'Khóa chặt và phản đòn', stamina: 'Bình xăng không đáy', footwork: 'Bộ pháp' };
  var STANCE_DEF = { orthodox: 'Thế thuận', southpaw: 'Thế tay trái', 'switch': 'Đổi thế' };
  function fMovesHtml(d) {
    var label = function (k) { return k === 'stance' ? 'P · Nội tại (thế đứng)' : k === 'ult' ? 'R · Tuyệt chiêu' : (skills().filter(function (s) { return s.id === k; })[0] || {}).vi || k; };
    var ph = function (k) { return k === 'stance' ? STANCE_DEF[d.stance] || 'Thế thuận' : k === 'ult' ? 'Để trống = theo cách thắng nhiều nhất' : MOVE_DEF[k] || ''; };
    return sec('B2. Chiêu trên hồ sơ (P Q W E R)',
      '<p class="set-note">Đặt tên + mô tả chiêu tủ của võ sĩ. 3 kỹ năng điểm cao nhất thành Q, W, E trên web. Ô để trống thì web tự đặt tên mặc định (chữ mờ trong ô).</p>' +
      '<div class="rk-mvs">' + moveSlots().map(function (k) {
        return '<div class="rk-mv" data-mv="' + esc(k) + '"><p class="rk-mv__k">' + esc(label(k)) + '<span class="badge" data-mvkey hidden></span></p>' +
          '<input type="text" data-ff="moves.' + esc(k) + '.name.vi" value="' + esc(d.moves[k].name.vi) + '" maxlength="40" autocomplete="off" placeholder="' + esc(ph(k)) + '" aria-label="' + esc('Tên chiêu: ' + label(k)) + '">' +
          '<textarea rows="2" data-ff="moves.' + esc(k) + '.desc.vi" maxlength="300" placeholder="Mô tả ngắn (không bắt buộc)" aria-label="' + esc('Mô tả chiêu: ' + label(k)) + '">' + esc(d.moves[k].desc.vi) + '</textarea></div>';
      }).join('') + '</div>');
  }
  // nhãn Q / W / E theo 3 kỹ năng đang cao nhất (cập nhật khi chấm điểm)
  function mvKeys() {
    if (!ED || ED.view !== VF) return;
    var top = skills().map(function (s) { return s.id; }).sort(function (a, b) { return (ED.d.skills[b] || 0) - (ED.d.skills[a] || 0); }).slice(0, 3);
    Array.prototype.forEach.call(document.querySelectorAll('[data-mv]'), function (el) {
      var i = top.indexOf(el.getAttribute('data-mv')), b = $('[data-mvkey]', el);
      if (b) { b.hidden = i < 0; b.textContent = i < 0 ? '' : 'đang là ' + 'QWE'.charAt(i); }
    });
  }
  function histHtml(hist) {
    if (!hist.length) return '<p class="rk-hist-empty">Chưa có lần chấm nào — lưu võ sĩ để ghi lần chấm đầu tiên.</p>';
    var rows = [], prev = null;
    hist.forEach(function (a) { var avg = avgOf(a.skills); rows.push({ a: a, avg: avg, ch: prev == null ? null : r1(avg - prev) }); prev = avg; });
    return '<div class="rk-hist-wrap"><p class="field__label">Lịch sử chấm điểm · ' + esc(hist.length) + ' lần</p><ul class="rk-hist">' + rows.reverse().map(function (x) {
      var parts = skills().map(function (s) { return s.vi + ' ' + (x.a.skills && x.a.skills[s.id] != null ? x.a.skills[s.id] : '—'); }).join(' · ');
      return '<li><span class="rk-hist__d">' + esc(day(x.a.date)) + '</span>' +
        '<span class="rk-hist__avg">' + esc(n1(x.avg)) + '<small>/100</small></span>' +
        '<span class="rk-hist__ch">' + (x.ch == null ? '<span class="muted">lần đầu</span>' : deltaHtml(x.ch)) + '</span>' +
        '<span class="rk-hist__by">' + esc(x.a.by || '') + '</span>' +
        '<span class="rk-hist__sub">' + esc(parts) + (x.a.note ? ' — <em>' + esc(x.a.note) + '</em>' : '') + '</span></li>';
    }).join('') + '</ul></div>';
  }
  function skInput(t, commit) {
    if (!ED || ED.view !== VF) return;
    var id = t.getAttribute('data-sk') || t.getAttribute('data-sk-num'), row = t.closest('[data-sk-row]');
    if (!row || !A.has(ED.d.skills, id)) return;
    var raw = String(t.value).trim(), v = Math.round(Number(raw));
    if (raw === '' || !isFinite(v)) { if (!commit) return; v = ED.d.skills[id]; }
    v = Math.max(0, Math.min(100, v));
    ED.d.skills[id] = v;
    var rng = $('[data-sk]', row), nb = $('[data-sk-num]', row);
    if (rng !== t) rng.value = v;
    rng.style.setProperty('--p', v + '%');
    if (nb !== t || commit) nb.value = v;
    skRow(row, id); skSum();
  }
  function skRow(row, id) {
    var el = $('[data-sk-prev]', row), p = ED.prevSk ? Number(ED.prevSk[id]) : NaN, v = ED.d.skills[id];
    if (!el) return;
    el.innerHTML = !isFinite(p) || ED.id === 'new' ? '' : v === p ? 'lần trước ' + esc(p) : 'lần trước ' + esc(p) + ' ' + deltaHtml(v - p);
  }
  // điểm trực tiếp: trung bình, điểm kỹ năng, điểm thắng thua hiện tại, điểm xếp hạng + hạng dự kiến
  function skSum() {
    var box = $('[data-rk-sum]'); if (!box || !ED || ED.view !== VF) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-sk-row]'), function (row) { skRow(row, row.getAttribute('data-sk-row')); });
    mvKeys();
    var avg = avgOf(ED.d.skills), kp = Math.round(avg * 10), c = ED.id !== 'new' ? cfById(ED.id) : null;
    var fp = c ? r1(c.fightPoints) : 0, total = r1(kp + fp), t = tierOf(total), changed = c && c.skillPoints !== kp;
    var nb = c && c.record ? (c.record.bouts || 0) : 0;
    var tile = function (k, v, s) { return '<div class="rk-sum__t"><span class="rk-sum__k">' + esc(k) + '</span><span class="rk-sum__v">' + esc(v) + '</span><span class="rk-sum__s">' + s + '</span></div>'; };
    box.innerHTML =
      tile('Trung bình', n1(avg), '/ 100') +
      tile('Điểm kỹ năng', String(kp), changed ? 'trước ' + esc(c.skillPoints) + ' ' + deltaHtml(kp - c.skillPoints) : 'trung bình × 10') +
      tile('Điểm thắng thua', signed(fp), esc(nb ? 'sau ' + nb + ' trận' : 'chưa có trận')) +
      '<div class="rk-sum__t rk-sum__t--main"><span class="rk-sum__k">Điểm xếp hạng' + (changed || !c ? ' (dự kiến)' : '') + '</span><span class="rk-sum__v">' + esc(n1(total)) + '</span>' +
        '<span class="rk-sum__s">' + (t ? tierBadge(t.id) : '') + '</span></div>' +
      (changed && nb ? '<p class="rk-sum__note">Điểm thắng thua được tính lại theo điểm kỹ năng mới khi lưu nên có thể lệch nhẹ.</p>' : '');
  }

  // ── cột phải: điểm & thành tích, trận đấu ──
  function fStatsHtml(c) {
    var g = c.gender === 'f' ? 'nữ' : 'nam', r = c.record || {}, rk = c.rank;
    var kv = function (k, v) { return '<div><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>'; };
    return sec('Điểm & thành tích', '<dl class="rk-kv">' +
        kv('Điểm xếp hạng', '<strong class="rk-big">' + esc(n1(c.points)) + '</strong> ' + tierBadge(c.tier)) +
        kv('Điểm kỹ năng', esc(c.skillPoints) + ' <span class="muted">(TB ' + esc(n1(c.skillAvg)) + ')</span>') +
        kv('Điểm thắng thua', deltaHtml(c.fightPoints)) +
        kv('Thứ hạng', rk ? '#' + esc(rk.overall) + ' / ' + esc(rk.overallOf) + ' ' + g + ' toàn Academy<br>#' + esc(rk.div) + ' / ' + esc(rk.divOf) + ' ' + esc(divName(c.division))
          : '<span class="muted">Chưa xếp hạng' + (c.status === 'inactive' ? ' (nghỉ thi đấu)' : c.visible === false ? ' (đang ẩn)' : '') + '</span>') +
        (c.stars ? kv('Sao', '<span class="rk-stars" aria-label="' + esc(c.stars) + ' sao">' + stars(c.stars) + '</span>') : '') +
        kv('Thành tích (T-B-H)', '<strong>' + esc(rec(r)) + '</strong>' + (r.ko ? ' · ' + esc(r.ko) + ' KO' : '') + (r.nc ? ' · ' + esc(r.nc) + ' không KQ' : '')) +
        (c.last6 && c.last6.length ? kv('Phong độ', '<span class="rk-form" title="Mới nhất bên trái">' + c.last6.map(function (x) { return '<b class="is-' + esc(x) + '" title="' + esc(RES[x] || x) + '">' + esc(RES_1[x] || x) + '</b>'; }).join('') + '</span>') : '') +
        (c.streak ? kv('Chuỗi hiện tại', esc(c.streak.n + ' trận ' + (RES_LOW[c.streak.res] || '') + ' liên tiếp')) : '') +
      '</dl><p class="field__hint">Theo dữ liệu đã lưu — tự tính lại sau mỗi lần nhập kết quả hoặc chấm điểm.</p>');
  }
  function methodShort(x) { return x.method ? x.method + (STOP.indexOf(x.method) >= 0 && x.round ? ' H' + x.round + (x.time ? ' ' + x.time : '') : '') : ''; }
  function fBoutsHtml(c) {
    var up = (c.upcoming || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }), past = (c.bouts || []).slice(0, 8);
    var evName = function (id) { var e = eById(id); return e ? (e.name && e.name.vi) || '' : ''; };
    var row = function (x, isUp) {
      var opp = fById(x.opp);
      return '<li><a class="mini-row" href="#/rank-events/' + esc(encodeURIComponent(x.event)) + '"><span class="mini-row__top"><span>' + esc(day(x.date)) + '</span>' +
        (isUp ? '<span class="badge">Sắp đấu</span>' : '<span class="badge' + (x.res === 'W' ? ' badge--done' : x.res === 'L' ? '' : ' badge--off') + '">' + esc(RES[x.res] || x.res) + '</span>') + '</span>' +
        '<span class="mini-row__name">vs ' + esc(opp ? opp.name : '(võ sĩ không còn)') + '</span>' +
        '<span class="mini-row__meta"><span>' + esc(evName(x.event)) + '</span><span>' + (isUp ? esc(x.rounds + ' hiệp') : esc(methodShort(x)) + ' ' + deltaHtml(x.delta)) + '</span></span></a></li>';
    };
    var body = up.length || past.length ? '<ul class="mini-list">' + up.map(function (x) { return row(x, true); }).join('') + past.map(function (x) { return row(x, false); }).join('') + '</ul>'
      : '<p class="mini-state">Chưa có trận nào. Xếp võ sĩ vào trận ở <a href="#/rank-events">Sự kiện &amp; kết quả</a>.</p>';
    return '<section class="panel set-sec rk-bouts-panel"><header class="panel__head"><h2 class="panel__title">Trận đấu</h2><a class="link-more" href="#/rank-events">Nhập kết quả →</a></header>' + body +
      ((c.bouts || []).length > past.length ? '<p class="field__hint rk-more">Hiện 8 trận gần nhất / ' + esc(c.bouts.length) + ' trận.</p>' : '') + '</section>';
  }

  function fField(t, commit) {
    if (!ED || ED.view !== VF) return;
    var k = t.getAttribute('data-ff'), d = ED.d;
    t.classList.remove('is-invalid');
    if (k === 'visible') d.visible = t.checked;
    else if (k === 'bio') d.bio.vi = t.value;
    else if (k === 'slug') d.slug = slugInput(t);
    else if (k.indexOf('.') > 0) setPath(d, k, t.value);
    else if (A.has(d, k) && typeof d[k] === 'string') d[k] = t.value;
    if (k === 'weight' && commit && String(d.weight).trim() !== '') {
      var w = r1(d.weight); if (isFinite(w) && w > 0) { d.weight = String(w); t.value = d.weight; }
    }
    if (k === 'weight' || k === 'division') divHint();
    else if (k === 'birth') ageHint();
    else if (k === 'name') { var s = $('[data-ff="slug"]'); if (s) s.placeholder = slug(t.value) || 'ten-vo-si'; }
  }
  function slugInput(t) {
    var v = t.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').slice(0, 60);
    if (v !== t.value) { var pos = t.selectionStart; t.value = v; try { t.setSelectionRange(pos, pos); } catch (e) { /* bỏ qua */ } }
    return v;
  }
  function validateF() {
    var d = ED.d, w = String(d.weight).trim(), h = String(d.height).trim(), r = String(d.reach).trim();
    var inR = function (s, a, b) { var n = Number(s); return isFinite(n) && n >= a && n <= b; };
    if (d.name.trim().length < 2) return ['name', 'Nhập họ tên võ sĩ (ít nhất 2 ký tự).'];
    if (d.birth && d.birth > today()) return ['birth', 'Ngày sinh chưa đúng (sau ngày hôm nay).'];
    if (w !== '' && !inR(w, 30, 200)) return ['weight', 'Cân nặng phải từ 30 đến 200 kg.'];
    if (!d.division && w === '') return ['weight', 'Nhập cân nặng hoặc chọn hạng cân.'];
    if (h !== '' && !inR(h, 120, 230)) return ['height', 'Chiều cao phải từ 120 đến 230 cm (hoặc để trống).'];
    if (r !== '' && !inR(r, 120, 240)) return ['reach', 'Sải tay phải từ 120 đến 240 cm (hoặc để trống).'];
    if (d.photo && !A.safeImg(d.photo)) return ['photo', 'Ảnh võ sĩ không hợp lệ — hãy tải ảnh lại.'];
    if (d.assessDate && d.assessDate > today()) return ['assessDate', 'Ngày chấm không được sau ngày hôm nay.'];
    if (d.started && d.started > today().slice(0, 7)) return ['started', 'Tháng bắt đầu tập boxing chưa đúng (sau tháng này).'];
    return null;
  }
  function saveF(btn) {
    if (!ED || ED.view !== VF) return;
    var v = validateF();
    if (v) {
      msg(v[1]); A.toast(v[1], 'err');
      var fe = $('[data-ff="' + v[0] + '"]');
      if (fe) { fe.classList.add('is-invalid'); fe.focus(); fe.scrollIntoView({ block: 'center' }); }
      return;
    }
    var ed = ED, isNew = ED.id === 'new', body = fBody(ED.d);
    var lastBefore = JSON.stringify(ED.src && ED.src.assessments ? ED.src.assessments.slice(-1)[0] || null : null);
    A.setBusy(btn, true); msg('');
    A.api(isNew ? '/fighters' : '/fighters/' + encodeURIComponent(ED.id), { method: isNew ? 'POST' : 'PUT', body: body }).then(function (f) {
      return load(true).then(function (ok) {
        A.setBusy(btn, false);
        if (!ok) upsert('fighters', f);
        if (ED !== ed || A.view() !== VF) return;
        if (isNew) { history.replaceState(null, '', '#/fighters/' + encodeURIComponent(f.id)); A.syncRoute(); CUR.sub = f.id; }
        var lastA = (f.assessments || []).slice(-1)[0] || null, graded = JSON.stringify(lastA) !== lastBefore;
        fEditor(f.id);
        A.toast((isNew ? 'Đã thêm võ sĩ “' + f.name + '”.' : 'Đã lưu “' + f.name + '”.') + (graded && !isNew && lastA ? ' Đã ghi lần chấm điểm ngày ' + day(lastA.date) + '.' : ''),
          'ok', f.visible !== false ? { href: pubF(f), label: 'Xem trên web ↗' } : null);
      });
    }, function (e) {
      A.setBusy(btn, false);
      if (e && e.status !== 401 && e.status !== 403) { msg(e.message); A.toast(e.message, 'err'); }
    });
  }
  function delF() {
    var f = ED && ED.src; if (!f) return;
    A.confirmDialog({ title: 'Xóa võ sĩ “' + f.name + '”?', body: 'Hồ sơ và lịch sử chấm điểm sẽ bị xóa vĩnh viễn. Chỉ xóa được võ sĩ chưa có trận nào — võ sĩ đã thi đấu hãy chuyển sang “Nghỉ thi đấu” hoặc tắt “Hiện trên web”.', ok: 'Xóa võ sĩ', cancel: 'Quay lại' })
      .then(function (yes) { if (yes) delItem('/fighters/', f.id, VF, 'Đã xóa võ sĩ “' + f.name + '”.'); });
  }
  // xóa (chỉ admin): 403 / 409 → hiện đúng lời máy chủ báo
  function delItem(path, id, view, okText) {
    var btn = $('[data-rk-del]'); A.setBusy(btn, true);
    A.api(path + encodeURIComponent(id), { method: 'DELETE' }).then(function () {
      ED = null;
      return load(true).then(function () {
        A.toast(okText);
        if (A.view() === view) location.hash = '#/' + view;
      });
    }, function (e) {
      A.setBusy(btn, false);
      if (e && (e.status !== 401 && e.status !== 403 || (e.data && e.data.adminOnly))) { msg(e.message); A.toast(e.message, 'err'); }
    });
  }

  // ── ảnh võ sĩ / poster sự kiện (tải lên /api/uploads/file như mục Hình ảnh) ──
  function imgKey() { return ED && ED.view === VE ? 'poster' : 'photo'; }
  function imgSecHtml(title, note) {
    return sec(title,
      '<div class="rk-img' + (ED.view === VE ? ' rk-img--poster' : '') + '" data-rk-img></div>' +
      '<p class="set-spec">' + esc(note) + '</p>' +
      '<div class="set-actions"><label class="btn btn--line btn--sm file-btn">' + ICON.upload + '<span data-rk-imglabel>Tải ảnh</span>' +
        '<input class="sr" type="file" accept="image/jpeg,image/png,image/webp" data-rk-imgfile></label>' +
        '<button type="button" class="btn btn--quiet btn--sm" data-rk-imgdel hidden>Bỏ ảnh</button></div>' +
      '<div class="set-msg" data-rk-imgmsg hidden></div>');
  }
  function imgUi() {
    var box = $('[data-rk-img]'); if (!box || !ED) return;
    var src = A.safeImg(ED.d[imgKey()]);
    box.innerHTML = src ? '<img src="' + esc(src) + '" alt="' + (ED.view === VE ? 'Poster sự kiện' : 'Ảnh võ sĩ') + '">' : '<span class="pimg__empty">' + ICON.image + '<span>Chưa có ảnh</span></span>';
    var del = $('[data-rk-imgdel]'); if (del) del.hidden = !src;
    var lbl = $('[data-rk-imglabel]'); if (lbl && !lbl.closest('.is-busy')) lbl.textContent = src ? 'Đổi ảnh' : 'Tải ảnh';
  }
  function upload(file, onProgress) {
    var K = A.cms;
    if (K && K.uploadFile) return K.uploadFile(file, onProgress);
    return fetch('/api/uploads/file', { method: 'POST', headers: { Authorization: 'Bearer ' + A.token(), 'Content-Type': file.type }, body: file }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (d) {
        if (res.status === 401) { A.sessionExpired(); throw { status: 401, message: 'Phiên đăng nhập đã hết hạn.' }; }
        if (!res.ok || !d || !d.url) throw { status: res.status, message: (d && d.error) || ('Tải lên thất bại (mã ' + res.status + ').') };
        return d;
      });
    }, function () { throw { status: 0, message: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' }; });
  }
  function onImg(input) {
    var file = input.files && input.files[0], ed = ED, key = imgKey(), spec = key === 'poster' ? POSTER : PHOTO;
    input.value = '';
    if (!file || !ed) return;
    var m = $('[data-rk-imgmsg]'), say = function (t, err) { if (!m) return; m.textContent = t; m.hidden = !t; m.classList.toggle('is-err', !!err); };
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { say('Chỉ nhận ảnh JPG, PNG hoặc WebP.', true); return; }
    if (file.size > 10 * 1024 * 1024) { say('Ảnh tối đa 10MB — hãy nén ảnh rồi thử lại.', true); return; }
    var lbl = $('[data-rk-imglabel]'), btn = input.closest('.file-btn'), warn = [];
    btn.classList.add('is-busy'); input.disabled = true; say('');
    var probe = A.cms && A.cms.probe ? A.cms.probe(file, 'image') : Promise.resolve(null);
    probe.then(function (d) {
      if (d && d[0] < spec.w * 0.7) warn.push('⚠ Ảnh nhỏ hơn gợi ý (' + d[0] + ' × ' + d[1] + ' px) — có thể bị mờ.');
      if (d && Math.abs(d[0] / d[1] - spec.w / spec.h) / (spec.w / spec.h) > 0.15) warn.push('⚠ Khác tỉ lệ 4:5 — ' + (key === 'photo' ? 'ảnh sẽ bị cắt bớt trong khung hồ sơ.' : 'poster vẫn hiện đủ, chỉ khác khung gợi ý.'));
      if (file.size > spec.kb * 1024) warn.push('⚠ Dung lượng ' + Math.round(file.size / 1024) + ' KB — trang sẽ tải chậm, nên nén lại.');
      return upload(file, function (p) { if (lbl) lbl.textContent = 'Đang tải ' + Math.round(p * 100) + '%'; });
    }).then(function (r) {
      var url = A.safeImg(r && r.url); if (!url) throw { message: 'Máy chủ trả về đường dẫn không hợp lệ.' };
      if (ED !== ed) return;
      ED.d[key] = url; imgUi(); bar();
      say(['Đã tải ảnh — bấm Lưu để áp dụng.'].concat(warn).join(' '), false);
    }, function (e) { if (e && e.status !== 401) say((e && e.message) || 'Tải ảnh thất bại.', true); })
      .then(function () { btn.classList.remove('is-busy'); input.disabled = false; if (ED === ed) imgUi(); });
  }

  // ═══ Danh sách sự kiện ═════════════════════════════════════════════════════
  // trạng thái: upcoming / today · pending (đã qua, chưa có kết quả nào) · partial (thiếu vài trận) · done · past (không có trận)
  function evInfo(e) {
    var t = today(), past = e.date < t, total = (e.bouts || []).length, withRes = (e.bouts || []).filter(function (b) { return b.result; }).length;
    var state = !past ? (e.date === t ? 'today' : 'upcoming') : !total ? 'past' : !withRes ? 'pending' : withRes < total ? 'partial' : 'done';
    return { past: past, total: total, withRes: withRes, missing: past ? total - withRes : 0, state: state };
  }
  function evBadge(i) {
    if (i.state === 'today') return '<span class="badge badge--new">Hôm nay</span>';
    if (i.state === 'upcoming') return '<span class="badge">Sắp diễn ra</span>';
    if (i.state === 'pending') return '<span class="badge badge--new">Chưa nhập kết quả</span>';
    if (i.state === 'partial') return '<span class="badge badge--new">Thiếu ' + esc(i.missing) + ' kết quả</span>';
    if (i.state === 'done') return '<span class="badge badge--done">Đã có kết quả</span>';
    return '<span class="badge badge--off">Đã diễn ra</span>';
  }
  function eList() {
    var root = $('[data-rk-root]');
    root.innerHTML = A.pageHead('Sự kiện & kết quả', { eyebrow: 'Academy Ranking',
        actions: '<a class="btn btn--ghost" href="/su-kien" target="_blank" rel="noopener">Lịch sự kiện ↗</a>' +
          '<a class="btn btn--primary" href="#/rank-events/new">' + ICON.plus + '<span>Thêm sự kiện</span></a>' }) +
      '<div class="cms-help"><p>Fight night, buổi sparring có chấm điểm, kỳ đánh giá kỹ năng và hoạt động Academy. Mỗi sự kiện có danh sách trận (góc đỏ / góc xanh). ' +
        '<strong>Đấu xong:</strong> mở sự kiện, nhập kết quả + cách thắng từng trận rồi bấm Lưu — điểm võ sĩ tự tính lại ngay. Sự kiện đã qua mà chưa có kết quả được đánh dấu <strong>“Chưa nhập kết quả”</strong>.</p></div>' +
      '<div data-rke-alert></div>' +
      '<div class="toolbar rk-toolbar">' + filterSel('Loại', 'data-rke-type', [['all', 'Tất cả']].concat(TYPE), LE.type) + searchHtml('data-rke-q', 'Tên sự kiện, địa điểm…', LE.q) + '</div>' +
      '<div data-rke-list></div>';
    stamp(); eRows();
  }
  function eRows() {
    var box = $('[data-rke-list]'); if (!box || !R.d) return;
    var all = R.d.computed.events || [], cnt = $('[data-rk-root] [data-count]');
    if (cnt) cnt.textContent = String(all.length);
    var pend = all.filter(function (e) { var s = evInfo(e).state; return s === 'pending' || s === 'partial'; });
    var al = $('[data-rke-alert]');
    if (al) al.innerHTML = pend.length ? '<div class="alert rk-alert">' + ICON.warn + '<p class="alert__text"><strong>' + esc(pend.length) + ' sự kiện đã qua chưa nhập đủ kết quả</strong>' +
      '<span>' + pend.slice(0, 3).map(function (e) { return '<a href="#/rank-events/' + esc(encodeURIComponent(e.id)) + '">' + esc((e.name && e.name.vi) || e.id) + '</a>'; }).join(', ') + (pend.length > 3 ? '…' : '') + ' — mở sự kiện để nhập kết quả từng trận.</span></p></div>' : '';
    if (!all.length) { box.innerHTML = A.emptyHtml('Chưa có sự kiện nào', 'Bấm “Thêm sự kiện” để tạo fight night, buổi sparring hoặc kỳ đánh giá kỹ năng.'); return; }
    var rows = all.filter(function (e) { return (LE.type === 'all' || e.type === LE.type) && A.matches(LE.q, [e.name && e.name.vi, e.venue, e.city, typeName(e.type)]); });
    var key = function (e) { return e.date + ' ' + (e.time || ''); };
    var up = rows.filter(function (e) { return !evInfo(e).past; }).sort(function (a, b) { return key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0; });
    var past = rows.filter(function (e) { return evInfo(e).past; }).sort(function (a, b) { return key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0; });
    var filtered = LE.type !== 'all' || String(LE.q).trim();
    var table = function (l, none) {
      if (!l.length) return '<p class="rk-none">' + esc(filtered ? 'Không có sự kiện phù hợp.' : none) + '</p>';
      return '<div class="table-wrap"><table class="tbl tbl--rke"><thead><tr><th scope="col" class="c-when">Ngày</th><th scope="col" class="c-name">Sự kiện</th><th scope="col" class="c-venue">Địa điểm</th>' +
        '<th scope="col" class="c-num c-bouts">Trận</th><th scope="col" class="c-status">Trạng thái</th><th scope="col" class="c-act">Trên web</th></tr></thead><tbody>' +
        l.map(eRow).join('') + '</tbody></table></div>';
    };
    box.innerHTML = '<h2 class="rk-h2">Sắp diễn ra <small>' + esc(up.length) + '</small></h2>' + table(up, 'Chưa có sự kiện sắp tới — bấm “Thêm sự kiện”.') +
      '<h2 class="rk-h2">Đã diễn ra <small>' + esc(past.length) + '</small></h2>' + table(past, 'Chưa có sự kiện nào đã diễn ra.');
  }
  function eRow(e) {
    var i = evInfo(e), href = '#/rank-events/' + encodeURIComponent(e.id), hidden = e.visible === false, dl = daysFromToday(e.date);
    var cls = i.state === 'pending' || i.state === 'partial' ? 'is-new' : hidden ? 'is-hidden' : '';
    return '<tr data-href="' + esc(href) + '"' + (cls ? ' class="' + cls + '"' : '') + '>' +
      '<td class="c-when" data-label="Ngày"><span class="dt"><span>' + esc(day(e.date)) + '</span>' + (e.time ? ' <span class="dt__time">' + esc(e.time) + '</span>' : '') + '</span>' +
        (dl > 0 ? '<span class="cell-sub">còn ' + esc(dl) + ' ngày</span>' : '') + '</td>' +
      '<td class="c-name" data-label="Sự kiện"><a class="cell-title" href="' + esc(href) + '">' + esc((e.name && e.name.vi) || '(chưa đặt tên)') + '</a>' +
        '<span class="cell-sub">' + esc(typeName(e.type)) + '</span></td>' +
      '<td class="c-venue" data-label="Địa điểm">' + (e.venue || e.city ? esc([e.venue, e.city].filter(Boolean).join(', ')) : '<span class="muted">—</span>') + '</td>' +
      '<td class="c-num c-bouts" data-label="Trận">' + (i.total ? '<strong>' + esc(i.total) + ' trận</strong>' + (i.withRes || i.past ? '<span class="cell-sub">' + esc(i.withRes) + ' / ' + esc(i.total) + ' có kết quả</span>' : '') : '<span class="muted">Không có trận</span>') + '</td>' +
      '<td class="c-status" data-label="Trạng thái">' + evBadge(i) + '</td>' +
      '<td class="c-act" data-label="Trên web">' + (hidden ? '<span class="tag tag--muted">Đang ẩn</span>' : '<a class="btn btn--quiet btn--sm" href="' + esc(pubE(e)) + '" target="_blank" rel="noopener">Xem ↗</a>') + '</td></tr>';
  }

  // ═══ Sửa sự kiện + trận đấu ════════════════════════════════════════════════
  function eDraft(src) {
    src = src || {};
    return { name: pair(src.name), date: src.date || '', time: src.time || '', type: src.type || 'fight', venue: src.venue || '', city: src.city || '',
      desc: pair(src.desc), poster: src.poster || '', visible: src.visible !== false, slug: src.slug || '', bouts: (src.bouts || []).map(bDraft) };
  }
  // trận trong bản nháp: _k = khóa giao diện, _divTouched = hạng cân đã chọn tay (không tự đổi theo góc đỏ)
  function bDraft(b) {
    b = b || {};
    return { _k: 'b' + (++seq), id: b.id || '', a: b.a || '', b: b.b || '', division: b.division || '', rounds: numStr(b.rounds || 3), result: b.result || '',
      method: b.method || '', round: b.round ? String(b.round) : '', time: b.time || '', main: !!b.main, note: b.note || '', _divTouched: !!b.division };
  }
  function isStop(b) { return (b.result === 'a' || b.result === 'b') && STOP.indexOf(b.method) >= 0; }
  function bOut(b) {
    var o = { a: b.a, b: b.b, division: b.division, rounds: toInt(b.rounds) || 3, result: b.result, method: b.result && b.result !== 'nc' ? b.method : '', round: 0, time: '', main: !!b.main, note: String(b.note).trim() };
    if (STOP.indexOf(o.method) >= 0) { if (o.result === 'draw') o.method = ''; else { o.round = toInt(b.round) || 0; o.time = String(b.time).trim(); } }
    if (b.id) o.id = b.id;
    return o;
  }
  function eBody(d) {
    return { name: { vi: d.name.vi.trim(), en: d.name.en }, date: d.date, time: d.time, type: d.type, venue: d.venue.trim(), city: d.city.trim(),
      desc: { vi: d.desc.vi.trim(), en: d.desc.en }, poster: d.poster, visible: !!d.visible, slug: d.slug.replace(/^-+|-+$/g, ''), bouts: d.bouts.map(bOut) };
  }
  function evSlugPh(d) { return slug(d.name.vi + (d.date ? '-' + d.date.slice(0, 7) : '')) || 'ten-su-kien'; }
  function eEditor(id, fresh) {
    var root = $('[data-rk-root]'), isNew = id === 'new', src = isNew ? null : eById(id);
    if (!isNew && !src) { ED = null; root.innerHTML = notFound(VE); return; }
    ED = { view: VE, id: id, src: src, d: eDraft(src) };
    var d = ED.d;
    root.innerHTML = A.pageHead(isNew ? 'Thêm sự kiện' : ((src.name && src.name.vi) || 'Sự kiện'), { eyebrow: 'Sự kiện & kết quả', stamp: false, count: false,
        actions: '<a class="btn btn--ghost" href="#/rank-events">← Danh sách</a>' +
          (!isNew && src.visible !== false ? '<a class="btn btn--ghost" href="' + esc(pubE(src)) + '" target="_blank" rel="noopener">Xem trên web ↗</a>' : '') }) +
      '<p class="form-msg" data-rk-msg role="alert" hidden></p>' +
      '<div class="rk-grid"><div class="rk-main">' +
        sec('Thông tin sự kiện',
          field('Tên sự kiện (Tiếng Việt) — bắt buộc', '<input type="text" data-ef="name" value="' + esc(d.name.vi) + '" maxlength="120" autocomplete="off" placeholder="VD: Dapper Fight Night #4">') +
          enHtml(d.name, 'Tên') +
          '<div class="set-grid3">' +
            field('Ngày — bắt buộc', '<input type="date" data-ef="date" value="' + esc(d.date) + '">') +
            field('Giờ bắt đầu', '<input type="time" data-ef="time" value="' + esc(d.time) + '">', 'Không bắt buộc.') +
            field('Loại sự kiện', '<select data-ef="type">' + optsHtml(TYPE, d.type) + '</select>') +
          '</div><div class="set-grid2">' +
            field('Địa điểm', '<input type="text" data-ef="venue" value="' + esc(d.venue) + '" maxlength="80" autocomplete="off" placeholder="VD: Dapper Combat Gym">') +
            field('Thành phố', '<input type="text" data-ef="city" value="' + esc(d.city) + '" maxlength="60" autocomplete="off" placeholder="VD: TP. Hồ Chí Minh">') +
          '</div>' +
          field('Mô tả (Tiếng Việt)', '<textarea rows="3" maxlength="2000" data-ef="desc" placeholder="Luật thi đấu, số trận, ghi chú cho khán giả…">' + esc(d.desc.vi) + '</textarea>') +
          enHtml(d.desc, 'Mô tả')) +
        '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">Trận đấu &amp; kết quả</h2><span class="cms-sec__meta" data-rk-bmeta></span></header><div class="set-body">' +
          '<p class="set-note">Mỗi trận: chọn võ sĩ góc đỏ, góc xanh và số hiệp. Đấu xong chọn kết quả + cách thắng rồi bấm <strong>Lưu</strong> — điểm hai võ sĩ tự tính lại, hiện ở dòng “Điểm ±” dưới mỗi trận. “Không kết quả” không tính điểm.</p>' +
          '<p class="set-err" data-rk-future hidden></p>' +
          '<div class="rk-bouts" data-rk-bouts></div>' +
          '<div class="set-actions"><button type="button" class="btn btn--line btn--sm" data-rk-badd>' + ICON.plus + '<span>Thêm trận</span></button></div>' +
        '</div></section>' +
      '</div><aside class="rk-side">' +
        impactHtml(fresh) +
        imgSecHtml('Poster', 'Không bắt buộc. Nên ảnh dọc 4:5 — ' + POSTER.w + ' × ' + POSTER.h + ' px, JPG hoặc WebP ≤ ' + POSTER.kb + ' KB.') +
        sec('Hiển thị',
          '<div><label class="check"><input type="checkbox" data-ef="visible"' + (d.visible ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span>Hiện trên web</span></label>' +
            '<p class="field__hint">Tắt = ẩn sự kiện khỏi lịch trên web. Kết quả các trận vẫn được tính điểm.</p></div>' +
          field('Đường dẫn trên web', '<span class="pslug"><em>/su-kien/</em><input type="text" data-ef="slug" value="' + esc(d.slug) + '" maxlength="60" spellcheck="false" autocomplete="off" placeholder="' + esc(evSlugPh(d)) + '"></span>',
            'Chữ thường không dấu, số và dấu gạch ngang. Để trống = tự tạo từ tên và tháng diễn ra.')) +
        (A.isAdmin() && !isNew ? dangerHtml('Xóa sự kiện', 'Xóa cả danh sách trận và kết quả — điểm của các võ sĩ sẽ tính lại như chưa từng đấu. Chỉ muốn ẩn thì tắt “Hiện trên web”.') : '') +
      '</aside></div>' +
      savebarHtml(isNew ? 'Thêm sự kiện' : 'Lưu sự kiện');
    ED.orig = JSON.stringify(eBody(d));
    renderBouts(); imgUi(); futureWarn(); bar();
  }
  // điểm thay đổi của từng võ sĩ trong sự kiện (theo bản đã lưu, đã tính)
  function impactHtml(fresh) {
    var ce = ED && ED.id !== 'new' ? ceById(ED.id) : null; if (!ce) return '';
    var map = Object.create(null), order = [];
    (ce.bouts || []).forEach(function (b) {
      if (!b.result || b.result === 'nc') return;
      [[b.a, b.deltaA, b.ptsA], [b.b, b.deltaB, b.ptsB]].forEach(function (x) {
        if (!map[x[0]]) { map[x[0]] = { id: x[0], d: 0, after: 0 }; order.push(map[x[0]]); }
        map[x[0]].d += Number(x[1]) || 0; map[x[0]].after = x[2];
      });
    });
    if (!order.length) return '';
    order.sort(function (a, b) { return b.d - a.d; });
    return '<section class="panel set-sec rk-impact' + (fresh ? ' is-fresh' : '') + '"><header class="panel__head"><h2 class="panel__title">Điểm thay đổi sau sự kiện</h2></header>' +
      '<ul class="rk-impact__list">' + order.map(function (x) {
        return '<li><a href="#/fighters/' + esc(encodeURIComponent(x.id)) + '">' + esc(nameOf(x.id) || '(võ sĩ không còn)') + '</a>' +
          '<span class="rk-impact__v">' + deltaHtml(x.d) + ' <span class="muted">→ ' + esc(n1(x.after)) + '</span></span></li>';
      }).join('') + '</ul>' +
      '<p class="field__hint rk-impact__note">' + (fresh ? 'Vừa tính lại sau khi lưu. ' : '') + 'Số sau mũi tên là điểm ngay sau sự kiện này; điểm hiện tại có thể khác nếu võ sĩ đã đấu thêm.</p></section>';
  }

  // ── danh sách võ sĩ để chọn: nhóm theo giới tính + hạng cân, điểm cao trước ──
  function optLabel(f) {
    var c = cfById(f.id);
    return f.name + (f.nickname ? ' “' + f.nickname + '”' : '') + ' · T-B-H ' + rec(c && c.record) + ' · ' + n1(c ? c.points : 0) + ' điểm' +
      (f.status === 'inactive' ? ' · nghỉ thi đấu' : '') + (f.visible === false ? ' · đang ẩn' : '');
  }
  function fighterOptions(sel) {
    var all = R.d.fighters, pts = function (f) { var c = cfById(f.id); return c ? c.points : 0; }, ids = divs().map(function (x) { return x.id; });
    var group = function (label, l) {
      if (!l.length) return '';
      l.sort(function (a, b) { return (pts(b) - pts(a)) || a.name.localeCompare(b.name, 'vi'); });
      return '<optgroup label="' + esc(label) + '">' + l.map(function (f) { return '<option value="' + esc(f.id) + '"' + (f.id === sel ? ' selected' : '') + '>' + esc(optLabel(f)) + '</option>'; }).join('') + '</optgroup>';
    };
    var html = '<option value="">— Chọn võ sĩ —</option>';
    [['m', 'Nam'], ['f', 'Nữ']].forEach(function (g) {
      var mine = all.filter(function (f) { return (f.gender === 'f' ? 'f' : 'm') === g[0]; });
      divs().forEach(function (dv) { html += group(g[1] + ' · ' + dv.vi, mine.filter(function (f) { return f.division === dv.id; })); });
      html += group(g[1] + ' · khác', mine.filter(function (f) { return ids.indexOf(f.division) < 0; }));
    });
    if (sel && !fById(sel)) html += '<option value="' + esc(sel) + '" selected>(võ sĩ không còn trong danh sách)</option>';
    return html;
  }
  function resultOpts(b) {
    var nA = nameOf(b.a), nB = nameOf(b.b);
    return optsHtml([['', 'Chưa đấu / chưa có kết quả'], ['a', 'Góc đỏ thắng' + (nA ? ' — ' + nA : '')], ['b', 'Góc xanh thắng' + (nB ? ' — ' + nB : '')],
      ['draw', 'Hòa'], ['nc', 'Không kết quả (không tính điểm)']], b.result);
  }
  function methodOpts(b) {
    if (!b.result || b.result === 'nc') return '<option value="">—</option>';
    var draw = b.result === 'draw', all = methods();
    var opt = function (m) { return '<option value="' + esc(m) + '"' + (b.method === m ? ' selected' : '') + '>' + esc(m + ' — ' + (draw ? DRAW[m] : METHOD[m] || m)) + '</option>'; };
    if (draw) return '<option value="">— Không ghi —</option>' + ['UD', 'SD', 'MD', 'PTS'].map(opt).join('');
    return '<option value="">— Chọn cách thắng —</option>' +
      '<optgroup label="Dừng trận">' + all.filter(function (m) { return STOP.indexOf(m) >= 0; }).map(opt).join('') + '</optgroup>' +
      '<optgroup label="Tính điểm">' + all.filter(function (m) { return STOP.indexOf(m) < 0; }).map(opt).join('') + '</optgroup>';
  }
  function boutSummary(b) {
    var nA = nameOf(b.a), nB = nameOf(b.b), parts = [];
    parts.push(nA || nB ? (nA || '?') + ' vs ' + (nB || '?') : 'Chưa chọn võ sĩ');
    if (b.division) parts.push(divName(b.division));
    if (toInt(b.rounds)) parts.push(toInt(b.rounds) + ' hiệp');
    if (b.result === 'a' || b.result === 'b') {
      parts.push((b.result === 'a' ? nA || 'Góc đỏ' : nB || 'Góc xanh') + ' thắng' + (b.method ? ' ' + b.method : '') + (isStop(b) && toInt(b.round) ? ' H' + toInt(b.round) + (b.time ? ' ' + b.time : '') : ''));
    } else if (b.result === 'draw') parts.push('Hòa' + (b.method ? ' ' + b.method : ''));
    else if (b.result === 'nc') parts.push('Không kết quả');
    return parts.join(' · ');
  }
  // dòng "Điểm ±" dưới trận: theo bản đã lưu; trận vừa sửa → nhắc lưu để tính lại
  function deltaRowHtml(b) {
    var saved = b.id && ED.src ? (ED.src.bouts || []).filter(function (x) { return x.id === b.id; })[0] : null;
    var ce = saved ? ceById(ED.id) : null, sb = ce ? (ce.bouts || []).filter(function (x) { return x.id === b.id; })[0] : null;
    var cur = bOut(b);
    if (!saved || !sb) return cur.result ? '<p class="rk-delta is-stale">Bấm Lưu để tính điểm cho trận này.</p>' : '';
    var was = bOut(bDraft(saved));
    if (cur.a !== was.a || cur.b !== was.b || cur.result !== was.result || cur.method !== was.method) return cur.result || was.result ? '<p class="rk-delta is-stale">Kết quả đã sửa — bấm Lưu để tính lại điểm.</p>' : '';
    if (!sb.result) return '';
    if (sb.result === 'nc') return '<p class="rk-delta"><span class="rk-delta__k">Điểm ±</span><span>Không kết quả — không tính điểm.</span></p>';
    var side = function (cls, id, dd, after) {
      return '<span class="rk-delta__v"><i class="rk-dot rk-dot--' + cls + '" aria-hidden="true"></i>' + esc(nameOf(id) || '?') + ' ' + deltaHtml(dd) + ' <span class="muted" title="Điểm ngay sau trận">→ ' + esc(n1(after)) + '</span></span>';
    };
    return '<p class="rk-delta"><span class="rk-delta__k">Điểm ±</span>' + side('red', sb.a, sb.deltaA, sb.ptsA) + side('blue', sb.b, sb.deltaB, sb.ptsB) + '</p>';
  }
  function boutHtml(b, i, n) {
    var k = b._k, id = 'rkb-' + k, r = toInt(b.rounds) || 3;
    return '<article class="rk-bout' + (b.main ? ' is-main' : '') + '" data-bk="' + esc(k) + '">' +
      '<header class="rk-bout__head"><span class="rk-bout__n" aria-hidden="true">' + (i + 1) + '</span>' +
        '<span class="rk-bout__title">Trận ' + (i + 1) + '</span>' + (b.main ? '<span class="badge badge--done">Trận chính</span>' : '') +
        '<span class="rk-bout__sum" data-bsum>' + esc(boutSummary(b)) + '</span>' +
        '<span class="rk-bout__tools">' +
          '<button type="button" class="icon-btn icon-btn--line" data-rk-bmove="-1" aria-label="Đưa trận ' + (i + 1) + ' lên"' + (i === 0 ? ' disabled' : '') + '>' + UP + '</button>' +
          '<button type="button" class="icon-btn icon-btn--line" data-rk-bmove="1" aria-label="Đưa trận ' + (i + 1) + ' xuống"' + (i === n - 1 ? ' disabled' : '') + '>' + DOWN + '</button>' +
          '<button type="button" class="icon-btn icon-btn--line" data-rk-bdel aria-label="Bỏ trận ' + (i + 1) + '">' + ICON.close + '</button>' +
        '</span></header>' +
      '<div class="rk-bout__body">' +
        '<div class="rk-corners">' +
          '<label class="field rk-corner rk-corner--red" for="' + esc(id) + '-a"><span class="field__label"><i class="rk-dot rk-dot--red" aria-hidden="true"></i>Góc đỏ</span>' +
            '<select id="' + esc(id) + '-a" data-bf="a">' + fighterOptions(b.a) + '</select></label>' +
          '<span class="rk-vs" aria-hidden="true">VS</span>' +
          '<label class="field rk-corner rk-corner--blue" for="' + esc(id) + '-b"><span class="field__label"><i class="rk-dot rk-dot--blue" aria-hidden="true"></i>Góc xanh</span>' +
            '<select id="' + esc(id) + '-b" data-bf="b">' + fighterOptions(b.b) + '</select></label>' +
        '</div>' +
        '<div class="rk-bout__grid">' +
          field('Hạng cân', '<select data-bf="division"><option value="">— Không ghi —</option>' + optsHtml(divs().map(function (x) { return [x.id, x.vi]; }), b.division) + '</select>') +
          field('Số hiệp', '<input type="number" data-bf="rounds" min="1" max="12" step="1" inputmode="numeric" value="' + esc(b.rounds) + '">') +
          field('Kết quả', '<select data-bf="result">' + resultOpts(b) + '</select>') +
          field('Cách thắng', '<select data-bf="method"' + (b.result && b.result !== 'nc' ? '' : ' disabled') + '>' + methodOpts(b) + '</select>') +
        '</div>' +
        (isStop(b) ? '<div class="rk-bout__grid rk-bout__stop">' +
          field('Dừng ở hiệp', '<input type="number" data-bf="round" min="1" max="' + r + '" step="1" inputmode="numeric" value="' + esc(b.round) + '" placeholder="' + r + '">', 'Để trống = hiệp cuối.') +
          field('Thời điểm (phút:giây)', '<input type="text" data-bf="time" value="' + esc(b.time) + '" maxlength="5" inputmode="numeric" autocomplete="off" placeholder="VD 1:48">', 'Không bắt buộc.') +
        '</div>' : '') +
        '<div class="rk-bout__foot">' +
          '<label class="check rk-bout__main"><input type="checkbox" data-bf="main"' + (b.main ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span>Trận chính</span></label>' +
          '<label class="rk-bout__note"><span class="sr">Ghi chú trận ' + (i + 1) + '</span><input type="text" data-bf="note" value="' + esc(b.note) + '" maxlength="120" autocomplete="off" placeholder="Ghi chú (không bắt buộc), vd: tranh đai nội bộ"></label>' +
        '</div>' +
        deltaRowHtml(b) + '<div data-bpred>' + predHtml(b) + '</div>' +
      '</div></article>';
  }
  // kèo dự đoán cho vui khi xếp trận (public/assets/js/rank-predict.js, cùng cách tính với trang So sánh)
  function predHtml(b) {
    var a = cfById(b.a), c = cfById(b.b);
    if (!window.DCPredict || !a || !c || b.a === b.b || b.result) return '';
    var p = window.DCPredict.predict(a, c, { rounds: toInt(b.rounds) || 3, type: ED.d.type });
    var pc = function (x) { return Math.round(x * 100) + '%'; }, nm = function (f) { return f.name.split(' ').pop(); };
    var likely = { aKO: nm(a) + ' thắng KO / TKO', aDec: nm(a) + ' thắng điểm', draw: 'Hòa', bDec: nm(c) + ' thắng điểm', bKO: nm(c) + ' thắng KO / TKO' }[p.likely];
    return '<p class="rk-delta rk-pred"><span class="rk-delta__k">Kèo dự đoán</span>' +
      '<span class="rk-delta__v"><i class="rk-dot rk-dot--red" aria-hidden="true"></i>' + esc(nm(a)) + ' <b>' + pc(p.a) + '</b> · hòa ' + pc(p.draw) + ' · <i class="rk-dot rk-dot--blue" aria-hidden="true"></i>' + esc(nm(c)) + ' <b>' + pc(p.b) + '</b></span>' +
      '<span class="rk-delta__v">Kèo ' + esc(p.odds.a.toFixed(2)) + ' – ' + esc(p.odds.b.toFixed(2)) + ' · dễ xảy ra nhất: ' + esc(likely) + '</span>' +
      '<a class="linkbtn" href="/so-sanh?a=' + encodeURIComponent(a.slug) + '&b=' + encodeURIComponent(c.slug) + '&r=' + (toInt(b.rounds) >= 5 ? 5 : 3) + (ED.d.type === 'fight' ? '&t=fight' : '') + '" target="_blank" rel="noopener">Xem phân tích ↗</a></p>';
  }
  function renderBouts(focusSel) {
    var box = $('[data-rk-bouts]'); if (!box || !ED || ED.view !== VE) return;
    var l = ED.d.bouts;
    box.innerHTML = l.length ? l.map(function (b, i) { return boutHtml(b, i, l.length); }).join('')
      : '<p class="rk-none">' + (ED.d.type === 'assessment' || ED.d.type === 'other' ? 'Kỳ đánh giá kỹ năng / hoạt động Academy thường không có trận — chấm điểm kỹ năng ở hồ sơ từng võ sĩ (mục Võ sĩ).' : 'Chưa có trận nào — bấm “Thêm trận”.') + '</p>';
    bMeta();
    var add = $('[data-rk-badd]'); if (add) add.disabled = l.length >= MAX_BOUTS;
    if (focusSel) { var f = $(focusSel); if (f) f.focus(); }
  }
  function bMeta() {
    var m = $('[data-rk-bmeta]'); if (!m || !ED) return;
    var l = ED.d.bouts, n = l.filter(function (b) { return b.result; }).length;
    m.textContent = l.length ? l.length + ' trận · ' + n + ' có kết quả' : '';
  }
  function rerenderBout(b, f) {
    var card = $('[data-bk="' + CSS.escape(b._k) + '"]'); if (!card) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = boutHtml(b, ED.d.bouts.indexOf(b), ED.d.bouts.length);
    card.parentNode.replaceChild(tmp.firstChild, card);
    if (f) { var el = $('[data-bk="' + CSS.escape(b._k) + '"] [data-bf="' + f + '"]'); if (el) el.focus(); }
  }
  function bByEl(t) {
    var card = t.closest('[data-bk]'); if (!card || !ED || ED.view !== VE) return null;
    var k = card.getAttribute('data-bk');
    return ED.d.bouts.filter(function (b) { return b._k === k; })[0] || null;
  }
  // ô chữ / số: cập nhật tại chỗ (không vẽ lại, giữ con trỏ); ô chọn / công tắc: vẽ lại thẻ trận để bật / tắt ô liên quan
  function bInput(t, commit) {
    var b = bByEl(t); if (!b) return;
    var f = t.getAttribute('data-bf'), card = t.closest('[data-bk]'), redraw = false;
    t.classList.remove('is-invalid'); card.classList.remove('is-invalid');
    if (f === 'main') { b.main = t.checked; redraw = true; }
    else if (f === 'note') b.note = t.value;
    else if (f === 'time') {
      b.time = t.value;
      var m = commit ? /^\s*0?(\d)[:.,'](\d{2})\s*$/.exec(t.value) : null;
      if (m && +m[2] < 60) { b.time = m[1] + ':' + m[2]; t.value = b.time; }
    } else if (f === 'rounds') {
      b.rounds = t.value;
      var rd = $('[data-bf="round"]', card), r = toInt(t.value);
      if (rd && r >= 1 && r <= 12) { rd.max = r; rd.placeholder = r; }
      var pr = $('[data-bpred]', card); if (pr) pr.innerHTML = predHtml(b);
    } else if (f === 'round') b.round = t.value;
    else if (f === 'a' || f === 'b') {
      b[f] = t.value;
      if (f === 'a' && !b._divTouched) { var fa = fById(t.value); b.division = fa ? fa.division : ''; }
      redraw = true;
    } else if (f === 'division') { b.division = t.value; b._divTouched = !!t.value; }
    else if (f === 'result') {
      b.result = t.value;
      if (!b.result || b.result === 'nc' || (b.result === 'draw' && !A.has(DRAW, b.method))) b.method = '';
      if (!isStop(b)) { b.round = ''; b.time = ''; }
      redraw = true; futureWarn();
    } else if (f === 'method') {
      b.method = t.value;
      if (!isStop(b)) { b.round = ''; b.time = ''; }
      redraw = true;
    }
    if (redraw) rerenderBout(b, f);
    else { var s = $('[data-bsum]', card); if (s) s.textContent = boutSummary(b); }
    bMeta();
  }
  function addBout() {
    if (!ED || ED.d.bouts.length >= MAX_BOUTS) return;
    var last = ED.d.bouts[ED.d.bouts.length - 1], nb = bDraft({ rounds: last ? toInt(last.rounds) || 3 : 3 });
    ED.d.bouts.push(nb);
    renderBouts('[data-bk="' + nb._k + '"] [data-bf="a"]');
    var card = $('[data-bk="' + nb._k + '"]'); if (card) card.scrollIntoView({ block: 'center' });
    bar();
  }
  function moveBout(btn) {
    var b = bByEl(btn); if (!b) return;
    var l = ED.d.bouts, i = l.indexOf(b), dir = +btn.getAttribute('data-rk-bmove'), to = i + dir;
    if (to < 0 || to >= l.length) return;
    l.splice(i, 1); l.splice(to, 0, b);
    renderBouts();
    var nb = $('[data-bk="' + b._k + '"] [data-rk-bmove="' + dir + '"]');
    if (!nb || nb.disabled) nb = $('[data-bk="' + b._k + '"] [data-rk-bmove]:not([disabled])');
    if (nb) nb.focus();
    bar();
  }
  function delBout(btn) {
    var b = bByEl(btn); if (!b) return;
    var i = ED.d.bouts.indexOf(b);
    var go = function () { ED.d.bouts.splice(ED.d.bouts.indexOf(b), 1); renderBouts(); futureWarn(); bar(); var a = $('[data-rk-badd]'); if (a) a.focus(); };
    if (!b.a && !b.b && !b.result) { go(); return; }
    A.confirmDialog({ title: 'Bỏ trận ' + (i + 1) + '?', body: (b.result ? 'Kết quả của trận này sẽ bị xóa khi bấm Lưu và điểm hai võ sĩ được tính lại. ' : '') + 'Trận sẽ biến mất khỏi sự kiện sau khi bấm Lưu.', ok: 'Bỏ trận', cancel: 'Quay lại' })
      .then(function (yes) { if (yes) go(); });
  }
  function futureWarn() {
    var p = $('[data-rk-future]'); if (!p || !ED || ED.view !== VE) return;
    var fut = !!ED.d.date && ED.d.date > today() && ED.d.bouts.some(function (b) { return b.result; });
    p.textContent = fut ? 'Sự kiện này chưa diễn ra (ngày ' + day(ED.d.date) + ') nhưng đã có kết quả — kiểm tra lại ngày, hoặc chỉ nhập kết quả sau khi đấu xong.' : '';
    p.hidden = !fut;
  }
  function eField(t, commit) {
    if (!ED || ED.view !== VE) return;
    var k = t.getAttribute('data-ef'), d = ED.d;
    t.classList.remove('is-invalid');
    if (k === 'visible') d.visible = t.checked;
    else if (k === 'name') d.name.vi = t.value;
    else if (k === 'desc') d.desc.vi = t.value;
    else if (k === 'slug') d.slug = slugInput(t);
    else if (A.has(d, k) && typeof d[k] === 'string') d[k] = t.value;
    if (k === 'name' || k === 'date') { var s = $('[data-ef="slug"]'); if (s) s.placeholder = evSlugPh(d); }
    if (k === 'date') futureWarn();
    if (k === 'type' && commit && !d.bouts.length) renderBouts();
  }
  function validateE() {
    var d = ED.d;
    if (d.name.vi.trim().length < 2) return [null, 'name', 'Nhập tên sự kiện (ít nhất 2 ký tự).'];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || isNaN(Date.parse(d.date))) return [null, 'date', 'Chọn ngày diễn ra sự kiện.'];
    if (d.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)) return [null, 'time', 'Giờ bắt đầu chưa đúng (vd 19:00).'];
    for (var i = 0; i < d.bouts.length; i++) {
      var b = d.bouts[i], n = 'Trận ' + (i + 1) + ': ', r = String(b.rounds).trim(), rn = toInt(r);
      if (!b.a) return [b, 'a', n + 'chọn võ sĩ góc đỏ.'];
      if (!b.b) return [b, 'b', n + 'chọn võ sĩ góc xanh.'];
      if (b.a === b.b) return [b, 'b', n + 'hai góc phải là 2 võ sĩ khác nhau.'];
      if (!/^\d+$/.test(r) || rn < 1 || rn > 12) return [b, 'rounds', n + 'số hiệp từ 1 đến 12.'];
      if ((b.result === 'a' || b.result === 'b') && !b.method) return [b, 'method', n + 'chọn cách thắng (KO, TKO, tính điểm…).'];
      if (isStop(b)) {
        var rd = String(b.round).trim();
        if (rd && (!/^\d+$/.test(rd) || toInt(rd) < 1 || toInt(rd) > rn)) return [b, 'round', n + 'hiệp dừng trận phải từ 1 đến ' + rn + '.'];
        if (String(b.time).trim() && !/^\d:[0-5]\d$/.test(String(b.time).trim())) return [b, 'time', n + 'thời điểm dừng trận dạng phút:giây, vd 1:48.'];
      }
    }
    return null;
  }
  function saveE(btn) {
    if (!ED || ED.view !== VE) return;
    var v = validateE();
    if (v) {
      msg(v[2]); A.toast(v[2], 'err');
      var fe = v[0] ? $('[data-bk="' + CSS.escape(v[0]._k) + '"] [data-bf="' + v[1] + '"]') : $('[data-ef="' + v[1] + '"]');
      if (v[0]) { var card = $('[data-bk="' + CSS.escape(v[0]._k) + '"]'); if (card) card.classList.add('is-invalid'); }
      if (fe) { fe.classList.add('is-invalid'); fe.focus(); fe.scrollIntoView({ block: 'center' }); }
      return;
    }
    var ed = ED, isNew = ED.id === 'new', body = eBody(ED.d), hasRes = body.bouts.some(function (b) { return b.result; });
    A.setBusy(btn, true); msg('');
    A.api(isNew ? '/events' : '/events/' + encodeURIComponent(ED.id), { method: isNew ? 'POST' : 'PUT', body: body }).then(function (ev) {
      return load(true).then(function (ok) {
        A.setBusy(btn, false);
        if (!ok) upsert('events', ev);
        if (ED !== ed || A.view() !== VE) return;
        if (isNew) { history.replaceState(null, '', '#/rank-events/' + encodeURIComponent(ev.id)); A.syncRoute(); CUR.sub = ev.id; }
        eEditor(ev.id, hasRes && ok);
        A.toast('Đã lưu “' + ev.name.vi + '”' + (hasRes ? ' — điểm võ sĩ đã tính lại.' : '.'), 'ok', ev.visible !== false ? { href: pubE(ev), label: 'Xem trên web ↗' } : null);
        var imp = $('.rk-impact.is-fresh'); if (imp && window.innerWidth < 1200) imp.scrollIntoView({ block: 'nearest' });
      });
    }, function (e) {
      A.setBusy(btn, false);
      if (e && e.status !== 401 && e.status !== 403) { msg(e.message); A.toast(e.message, 'err'); }
    });
  }
  function delE() {
    var e = ED && ED.src; if (!e) return;
    var n = (e.bouts || []).length;
    A.confirmDialog({ title: 'Xóa sự kiện “' + ((e.name && e.name.vi) || '') + '”?', body: 'Sự kiện' + (n ? ', ' + n + ' trận và mọi kết quả' : '') + ' sẽ bị xóa vĩnh viễn; điểm của các võ sĩ được tính lại như chưa từng đấu. Chỉ muốn ẩn thì tắt “Hiện trên web”.', ok: 'Xóa sự kiện', cancel: 'Quay lại' })
      .then(function (yes) { if (yes) delItem('/events/', e.id, VE, 'Đã xóa sự kiện “' + ((e.name && e.name.vi) || '') + '”.'); });
  }

  // ═══ Lưu / hủy chung ═══════════════════════════════════════════════════════
  function plain() { return ED.view === VF ? fBody(ED.d) : eBody(ED.d); }
  // chỉ tính “chưa lưu” khi trình sửa đang mở trên màn hình
  function dirty() { return !!ED && !!$('[data-rk-root] [data-savebar="rk"]') && JSON.stringify(plain()) !== ED.orig; }
  function dirtyText() { return ED && ED.view === VE ? 'Sự kiện đang sửa có thay đổi chưa lưu.' : 'Hồ sơ võ sĩ đang sửa có thay đổi chưa lưu.'; }
  function bar() {
    var b = $('[data-savebar="rk"]'); if (!b || !ED) return;
    var isNew = ED.id === 'new', d = dirty();
    b.hidden = !(d || isNew);
    var m = $('[data-rk-barmsg]', b);
    if (m) m.textContent = isNew ? (ED.view === VF ? 'Võ sĩ mới — chưa lưu' : 'Sự kiện mới — chưa lưu') : (ED.view === VF ? 'Hồ sơ võ sĩ có thay đổi chưa lưu' : 'Sự kiện có thay đổi chưa lưu');
  }
  function discardEd() {
    if (!ED) return;
    var view = ED.view, id = ED.id;
    var go = function () {
      msg('');
      if (id === 'new') { ED = null; history.replaceState(null, '', '#/' + view); A.syncRoute(); show(view, ''); window.scrollTo(0, 0); }
      else if (view === VF) fEditor(id); else eEditor(id);
    };
    if (!dirty()) { go(); return; }
    A.confirmDialog({ title: 'Bỏ thay đổi chưa lưu?', body: view === VF ? 'Hồ sơ võ sĩ sẽ trở lại như lần lưu gần nhất.' : 'Sự kiện và các trận sẽ trở lại như lần lưu gần nhất.', ok: 'Bỏ thay đổi', cancel: 'Quay lại' })
      .then(function (yes) { if (yes) go(); });
  }

  // ═══ Sự kiện trên trang ════════════════════════════════════════════════════
  document.addEventListener('input', function (e) {
    var t = e.target; if (!(t instanceof Element) || !on()) return;
    if (t.matches('[data-rkf-q]')) { LF.q = t.value; fRows(); return; }
    if (t.matches('[data-rke-q]')) { LE.q = t.value; eRows(); return; }
    // ô chọn / công tắc / file xử lý ở "change"
    if (!ED || t.tagName === 'SELECT' || t.type === 'checkbox' || t.type === 'file') return;
    if (t.matches('[data-ff]')) fField(t, false);
    else if (t.matches('[data-sk], [data-sk-num]')) skInput(t, false);
    else if (t.matches('[data-ef]')) eField(t, false);
    else if (t.matches('[data-bf]')) bInput(t, false);
    else return;
    bar();
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!(t instanceof Element) || !on()) return;
    if (t.matches('[data-rkf-div]')) { LF.div = t.value; fRows(); return; }
    if (t.matches('[data-rkf-st]')) { LF.st = t.value; fRows(); return; }
    if (t.matches('[data-rkf-sort]')) { LF.sort = t.value; fRows(); return; }
    if (t.matches('[data-rke-type]')) { LE.type = t.value; eRows(); return; }
    if (t.matches('[data-rkf-vis]')) { toggleVis(t); return; }
    if (!ED) return;
    if (t.matches('[data-rk-imgfile]')) { onImg(t); return; }
    if (t.matches('[data-ff]')) fField(t, true);
    else if (t.matches('[data-sk], [data-sk-num]')) skInput(t, true);
    else if (t.matches('[data-ef]')) eField(t, true);
    else if (t.matches('[data-bf]')) bInput(t, true);
    else return;
    bar();
  });
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null; if (!t || !on()) return;
    var n;
    if ((n = t.closest('[data-rkf-g]'))) { LF.g = n.getAttribute('data-rkf-g'); fRows(); var cb = $('[data-rkf-g="' + LF.g + '"]'); if (cb) cb.focus(); return; }
    if ((n = t.closest('[data-rk-demo]')) && !n.disabled) { clearDemo(n); return; }
    if (!ED) return;
    if ((n = t.closest('[data-rk-save]'))) { if (ED.view === VF) saveF(n); else saveE(n); return; }
    if (t.closest('[data-rk-discard]')) { discardEd(); return; }
    if (t.closest('[data-rk-del]')) { if (ED.view === VF) delF(); else delE(); return; }
    if (t.closest('[data-rk-imgdel]')) { ED.d[imgKey()] = ''; imgUi(); var im = $('[data-rk-imgmsg]'); if (im) im.hidden = true; bar(); return; }
    if ((n = t.closest('[data-rk-usediv]')) && ED.view === VF) {
      ED.d.division = n.getAttribute('data-rk-usediv');
      var ds = $('[data-ff="division"]'); if (ds) { ds.value = ED.d.division; ds.focus(); }
      divHint(); bar(); return;
    }
    if (t.closest('[data-rk-badd]')) { addBout(); return; }
    if ((n = t.closest('[data-rk-bmove]'))) { moveBout(n); return; }
    if ((n = t.closest('[data-rk-bdel]'))) { delBout(n); return; }
  });
  document.addEventListener('keydown', function (e) {
    if (!on() || !ED) return;
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      var b = $('[data-savebar="rk"]:not([hidden]) [data-rk-save]'); if (b && !b.disabled) b.click();
    }
  });

  // ═══ Đăng ký màn hình ══════════════════════════════════════════════════════
  // staff: true = HLV (tài khoản nhân viên) dùng được — máy chủ đã cho phép (staffOk); A.register đưa vào danh sách màn nhân viên
  [[VF, 'Võ sĩ'], [VE, 'Sự kiện & kết quả']].forEach(function (x) {
    var view = x[0];
    A.register(view, {
      title: x[1],
      staff: true,
      mount: function (main, sub) {
        ED = null; if (!R.d) R.err = '';
        main.innerHTML = '<div data-rk-root></div>';
        show(view, sub || '');
      },
      route: function (main, sub) { route(view, sub || ''); },
      // nút làm mới: tải lại dữ liệu (nếu không có thay đổi chưa lưu); tự làm mới 60 giây thì bỏ qua
      update: function (main, manual) {
        stamp();
        if (!manual) return;
        if (dirty()) { A.toast('Đang có thay đổi chưa lưu — hãy lưu hoặc hủy trước khi tải lại.', 'info'); return; }
        load(true).then(function (ok) {
          if (!ok && R.d && R.err) A.toast(R.err, 'err');
          if (A.view() === view) show(view, CUR.view === view ? CUR.sub : '');
        });
      },
      isDirty: function () { return !!ED && ED.view === view && dirty(); },
      dirtyText: dirtyText,
      discard: function () { ED = null; },
      reset: function () { R.d = null; R.err = ''; R.at = 0; ED = null; LF.q = ''; LF.g = 'all'; LF.div = 'all'; LF.st = 'all'; LE.q = ''; LE.type = 'all'; },
    });
  });
})();
