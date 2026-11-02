/* Dapper Combat — Quản trị: Academy Ranking → Hạng cân (#/rank-divisions, chỉ admin)
   Sửa tên hạng (tiếng Việt; AI tự dịch tiếng Anh) và mốc cân tối đa của từng hạng. Trên web tên hạng luôn kèm khoảng cân,
   vd "Hạng Ruồi (≤ 52 kg)", "Hạng Gà (52–56 kg)", hạng nặng nhất "> 81 kg". Mã hạng cố định — võ sĩ và trận đấu lưu theo mã.
   Lưu: PUT /api/admin/ranking/divisions { divisions, resort } — resort = xếp lại võ sĩ vào đúng hạng theo cân nặng. */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A) return;
  var esc = A.esc, VIEW = 'rank-divisions';
  var S = { d: null, err: '', draft: null, resort: true, busy: false };
  function $(s, r) { return (r || document).querySelector(s); }
  function n1(x) { return (Math.round(Number(x) * 10) / 10).toLocaleString('vi-VN', { maximumFractionDigits: 1 }); }

  function load() {
    return A.api('/admin/ranking').then(function (d) {
      S.d = d; S.err = ''; S.draft = (d.divisions || []).map(function (x) { return { id: x.id, vi: x.vi, en: x.en, max: x.max }; });
    }, function (e) { S.err = (e && e.message) || 'Không tải được hạng cân'; });
  }
  function orig() { return (S.d && S.d.divisions) || []; }
  function dirty() {
    var o = orig();
    return !!S.draft && S.draft.some(function (x, i) { return !o[i] || x.vi.trim() !== o[i].vi || Number(x.max) !== o[i].max; });
  }
  // hạng theo cân nặng với mốc đang sửa (giống lib/ranking.js divOf)
  function divOf(kg) { var l = S.draft; for (var i = 0; i < l.length - 1; i++) if (kg <= Number(l[i].max)) return l[i].id; return l[l.length - 1].id; }
  function moves() { return ((S.d && S.d.fighters) || []).filter(function (f) { return f.weight && divOf(f.weight) !== f.division; }); }
  function range(i) {
    var l = S.draft, p = l[i - 1];
    if (!p) return '≤ ' + n1(l[i].max) + ' kg';
    return i === l.length - 1 ? '> ' + n1(p.max) + ' kg' : n1(p.max) + '–' + n1(l[i].max) + ' kg';
  }
  function countIn(id) {
    var c = { m: 0, f: 0 };
    ((S.d && S.d.fighters) || []).forEach(function (f) { if (f.division === id) c[f.gender === 'f' ? 'f' : 'm']++; });
    return c;
  }

  function rowHtml(x, i) {
    var last = i === S.draft.length - 1, c = countIn(x.id);
    return '<tr data-dv-row="' + i + '">' +
      '<td data-label="Tên hạng"><input type="text" maxlength="40" data-dv="vi" data-i="' + i + '" value="' + esc(x.vi) + '" aria-label="Tên hạng ' + (i + 1) + '">' +
        '<span class="cell-sub">' + (x.en ? 'EN: ' + esc(x.en) : 'EN: AI tự dịch khi lưu') + '</span></td>' +
      '<td data-label="Cân tối đa">' + (last ? '<span class="muted">Không giới hạn</span>'
        : '<span class="set-affix dv-kg"><input type="number" min="30" max="200" step="0.1" inputmode="decimal" data-dv="max" data-i="' + i + '" value="' + esc(x.max) + '" aria-label="Cân tối đa ' + esc(x.vi) + '"><em>kg</em></span>') + '</td>' +
      '<td data-label="Hiện trên web"><strong data-dv-show="' + i + '">' + esc((x.vi || '').trim() + ' (' + range(i) + ')') + '</strong></td>' +
      '<td data-label="Võ sĩ" class="dv-n">' + (c.m + c.f ? c.m + ' nam · ' + c.f + ' nữ' : '<span class="muted">—</span>') + '</td></tr>';
  }
  function render() {
    var root = $('[data-dv-root]'); if (!root) return;
    if (S.err && !S.d) { root.innerHTML = A.errorHtml(S.err); return; }
    if (!S.draft) { root.innerHTML = A.loadingHtml ? A.loadingHtml() : '<p class="muted">Đang tải…</p>'; return; }
    root.innerHTML =
      '<div class="cms-help"><p><strong>Tên hạng cân và số kg hiện cùng nhau trên web</strong>, vd “Hạng Ruồi (≤ 52 kg)”. Sửa tên bằng tiếng Việt — tiếng Anh AI tự dịch. ' +
        'Chỉ cần nhập cân <strong>tối đa</strong> của mỗi hạng; cân tối thiểu tự lấy theo hạng nhẹ hơn liền trước. Hạng nặng nhất không có mốc trên.</p></div>' +
      '<section class="panel"><header class="panel__head"><h2 class="panel__title">Hạng cân</h2><span class="cms-sec__meta">' + S.draft.length + ' hạng, nhẹ → nặng</span></header>' +
        '<div class="table-wrap"><table class="tbl dv-table"><thead><tr><th>Tên hạng</th><th>Cân tối đa</th><th>Hiện trên web</th><th>Võ sĩ</th></tr></thead>' +
        '<tbody>' + S.draft.map(rowHtml).join('') + '</tbody></table></div>' +
        '<div class="dv-foot"><label class="check"><input type="checkbox" data-dv-resort' + (S.resort ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span>' +
          '<span>Tự xếp lại võ sĩ vào đúng hạng theo cân nặng <span data-dv-moves></span></span></label>' +
          '<p class="set-msg is-err" data-dv-err hidden></p>' +
          '<div class="set-actions"><button class="btn btn--primary" type="button" data-dv-save' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? 'Đang lưu…' : 'Lưu hạng cân') + '</button>' +
          '<button class="btn btn--quiet" type="button" data-dv-undo>Hủy thay đổi</button></div></div>' +
      '</section>';
    refresh();
  }
  // cập nhật phần xem trước mà không vẽ lại ô đang gõ
  function refresh() {
    S.draft.forEach(function (x, i) { var el = $('[data-dv-show="' + i + '"]'); if (el) el.textContent = (x.vi || '').trim() + ' (' + range(i) + ')'; });
    var mv = moves(), box = $('[data-dv-moves]');
    if (box) box.textContent = mv.length ? '(' + mv.length + ' võ sĩ sẽ đổi hạng: ' + mv.slice(0, 4).map(function (f) { return f.name + ' ' + n1(f.weight) + ' kg'; }).join(', ') + (mv.length > 4 ? '…' : '') + ')' : '(mọi võ sĩ đã đúng hạng)';
    var save = $('[data-dv-save]'); if (save) save.disabled = S.busy || (!dirty() && !(S.resort && mv.length));
    var undo = $('[data-dv-undo]'); if (undo) undo.hidden = !dirty();
  }
  function check() {
    for (var i = 0; i < S.draft.length; i++) {
      var x = S.draft[i], v = x.vi.trim();
      if (v.length < 2) return 'Nhập tên cho hạng thứ ' + (i + 1) + '.';
      if (i === S.draft.length - 1) continue;
      var m = Number(x.max);
      if (!isFinite(m) || m < 30 || m > 200) return v + ': cân tối đa phải từ 30 đến 200 kg.';
      if (i && m <= Number(S.draft[i - 1].max)) return v + ': cân tối đa phải lớn hơn hạng trước (' + S.draft[i - 1].vi.trim() + ' ≤ ' + n1(S.draft[i - 1].max) + ' kg).';
    }
    return '';
  }
  function save() {
    var err = check(), box = $('[data-dv-err]');
    if (box) { box.hidden = !err; box.textContent = err; }
    if (err) return;
    S.busy = true; refresh();
    A.api('/admin/ranking/divisions', { method: 'PUT', body: { resort: S.resort, divisions: S.draft.map(function (x) { return { id: x.id, vi: x.vi.trim(), max: Number(x.max) }; }) } }).then(function (r) {
      S.busy = false;
      if (A.rankingStale) A.rankingStale();
      A.toast('Đã lưu hạng cân' + (r.moved ? ' — ' + r.moved + ' võ sĩ đã chuyển sang đúng hạng' : ''));
      return load().then(function () { if (A.view() === VIEW) render(); });
    }, function (e) { S.busy = false; refresh(); if (box) { box.hidden = false; box.textContent = (e && e.message) || 'Không lưu được'; } });
  }

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (A.view() !== VIEW || !(t instanceof Element) || !t.matches('[data-dv]') || !S.draft) return;
    S.draft[+t.getAttribute('data-i')][t.getAttribute('data-dv')] = t.value;
    refresh();
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (A.view() !== VIEW || !(t instanceof Element) || !t.matches('[data-dv-resort]')) return;
    S.resort = t.checked; refresh();
  });
  document.addEventListener('click', function (e) {
    if (A.view() !== VIEW) return;
    var t = e.target instanceof Element ? e.target : null;
    if (t && t.closest('[data-dv-save]')) save();
    else if (t && t.closest('[data-dv-undo]')) { S.draft = orig().map(function (x) { return { id: x.id, vi: x.vi, en: x.en, max: x.max }; }); render(); }
  });

  A.register(VIEW, {
    title: 'Hạng cân',
    mount: function (main) {
      main.innerHTML = A.pageHead('Hạng cân', { eyebrow: 'Academy Ranking', stamp: false, count: false, refresh: false }) + '<div data-dv-root></div>';
      S.draft = null; render();
      load().then(function () { if (A.view() === VIEW) render(); });
    },
    isDirty: dirty,
    dirtyText: function () { return 'Tên hoặc mốc cân của hạng cân chưa lưu.'; },
    discard: function () { S.draft = null; },
    reset: function () { S.d = null; S.draft = null; S.err = ''; },
  });
})();
