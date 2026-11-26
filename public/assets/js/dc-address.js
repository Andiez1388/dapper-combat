/* Bộ chọn địa chỉ 2 hệ cho trang thanh toán (giống ErgoChair):
   - Địa chỉ mới (từ 1/7/2025): 34 tỉnh → phường / xã
   - Địa chỉ cũ: 63 tỉnh → quận / huyện → phường / xã; máy chủ đổi sang phường mới (/api/address) và hiện cho khách xem
   DC.addr.mount(khung, { onChange }) — khung chứa sẵn input ẩn name="ward" / name="city"; bộ chọn ghi tên phường / tỉnh MỚI vào đó
   + input ẩn addrType, wardCode, oldWard (máy chủ đọc mã, không tin chữ). Dữ liệu: /assets/vn/*.json */
(function () {
  'use strict';
  var BASE = '/assets/vn/', cache = {};
  function get(f) {
    if (!cache[f]) cache[f] = fetch(BASE + f).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    return cache[f];
  }
  var en = function () { return window.DC && DC.lang && DC.lang() === 'en'; };
  var T = function (k, vi, eng) { return window.DC && DC.x ? DC.x('shop.addr.' + k, en() ? 1 : 0, en() ? eng : vi) : (en() ? eng : vi); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function opts(sel, list, ph, cur) {
    sel.innerHTML = '<option value="">' + esc(ph) + '</option>' + list.map(function (x) {
      return '<option value="' + x[0] + '"' + (x[0] === cur ? ' selected' : '') + '>' + esc(x[1]) + '</option>';
    }).join('');
    sel.disabled = !list.length;
  }

  function mount(box, o) {
    o = o || {};
    var st = o.state || {};
    var H = function (n) {
      var i = box.querySelector('input[name="' + n + '"]');
      if (!i) { i = document.createElement('input'); i.type = 'hidden'; i.name = n; box.appendChild(i); }
      return i;
    };
    var ui = document.createElement('div');
    ui.className = 'dc-addr';
    box.insertBefore(ui, box.firstChild);
    var districts = [], type = st.type === 'old' ? 'old' : 'new', seq = 0;
    function paint() {
      ui.innerHTML =
        '<div class="dc-addr-tabs" role="radiogroup">' +
        '<button type="button" role="radio" data-t="new" aria-checked="' + (type === 'new') + '"><b>' + esc(T('new', 'Địa chỉ mới', 'New address')) + '</b><small>' + esc(T('newSub', 'Tỉnh → Phường, xã (sau sáp nhập 1/7/2025)', 'Province → Ward (after 1 Jul 2025 merger)')) + '</small></button>' +
        '<button type="button" role="radio" data-t="old" aria-checked="' + (type === 'old') + '"><b>' + esc(T('old', 'Địa chỉ cũ', 'Old address')) + '</b><small>' + esc(T('oldSub', 'Tỉnh → Quận, huyện → Phường, xã', 'Province → District → Ward')) + '</small></button></div>' +
        '<div class="dc-addr-grid" data-box="new"' + (type === 'new' ? '' : ' hidden') + '>' +
        '<label>' + esc(T('pNew', 'Tỉnh / Thành phố *', 'Province / City *')) + '<select data-s="pnew"></select></label>' +
        '<label>' + esc(T('wNew', 'Phường / Xã *', 'Ward / Commune *')) + '<select data-s="wnew" disabled></select></label></div>' +
        '<div class="dc-addr-grid three" data-box="old"' + (type === 'old' ? '' : ' hidden') + '>' +
        '<label>' + esc(T('pOld', 'Tỉnh / Thành phố (cũ) *', 'Province / City (old) *')) + '<select data-s="pold"></select></label>' +
        '<label>' + esc(T('dOld', 'Quận / Huyện *', 'District *')) + '<select data-s="dold" disabled></select></label>' +
        '<label>' + esc(T('wOld', 'Phường / Xã (cũ) *', 'Ward (old) *')) + '<select data-s="wold" disabled></select></label></div>' +
        '<div class="dc-addr-out" data-out hidden></div>';
    }
    paint();
    var $ = function (s) { return ui.querySelector(s); };
    var S = function (k) { return $('[data-s="' + k + '"]'); };

    function fire() {
      var city = H('city');
      ['input', 'change'].forEach(function (ev) { city.dispatchEvent(new Event(ev, { bubbles: true })); });
      if (o.onChange) o.onChange(state());
    }
    function state() {
      return { type: type, pnew: S('pnew').value, wnew: S('wnew').value, pold: S('pold').value, dold: S('dold').value, wold: S('wold').value };
    }
    function names(sel) { var x = sel.options[sel.selectedIndex]; return x && x.value ? x.textContent : ''; }
    function sync() {
      var n = ++seq, out = $('[data-out]');
      H('addrType').value = type;
      H('wardCode').value = type === 'new' ? S('wnew').value : '';
      H('oldWard').value = type === 'old' ? S('wold').value : '';
      $('[data-box="new"]').hidden = type !== 'new';
      $('[data-box="old"]').hidden = type !== 'old';
      [].forEach.call(ui.querySelectorAll('[data-t]'), function (b) { b.setAttribute('aria-checked', String(b.dataset.t === type)); });
      if (type === 'new') {
        H('ward').value = S('wnew').value ? names(S('wnew')) : '';
        H('city').value = S('wnew').value ? names(S('pnew')) : '';
        out.hidden = true; fire(); return;
      }
      H('ward').value = ''; H('city').value = '';
      if (!S('wold').value) { out.hidden = true; fire(); return; }
      out.hidden = false; out.className = 'dc-addr-out'; out.textContent = T('checking', 'Đang đối chiếu địa chỉ mới…', 'Matching to the new address…');
      fetch('/api/address?type=old&old=' + encodeURIComponent(S('wold').value)).then(function (r) { return r.json(); }).then(function (r) {
        if (n !== seq) return;
        if (!r.ok) { out.className = 'dc-addr-out bad'; out.textContent = T('nomatch', 'Không tìm thấy địa chỉ mới tương ứng — vui lòng chọn theo địa chỉ mới.', 'No matching new address — please use the new address.'); fire(); return; }
        H('ward').value = r.ward; H('city').value = r.province;
        out.innerHTML = '✓ ' + esc(T('match', 'Theo địa chỉ mới:', 'New address:')) + ' <b>' + esc(r.newText) + '</b>';
        fire();
      }).catch(function () { if (n === seq) { out.hidden = true; fire(); } });
    }
    function loadNew(cur) {
      if (!S('pnew').value) { opts(S('wnew'), [], T('pickP', 'Chọn tỉnh trước', 'Choose a province first')); return Promise.resolve(); }
      return get('w-new-' + S('pnew').value + '.json').then(function (l) { opts(S('wnew'), l, T('pickW', 'Chọn phường, xã', 'Choose a ward'), cur); });
    }
    function loadOld(curD, curW) {
      if (!S('pold').value) { districts = []; opts(S('dold'), [], T('pickP', 'Chọn tỉnh trước', 'Choose a province first')); opts(S('wold'), [], T('pickD', 'Chọn quận trước', 'Choose a district first')); return Promise.resolve(); }
      return get('d-old-' + S('pold').value + '.json').then(function (l) { districts = l; opts(S('dold'), l, T('pickD2', 'Chọn quận, huyện', 'Choose a district'), curD); oldWards(curW); });
    }
    function oldWards(cur) {
      var d = districts.filter(function (x) { return x[0] === S('dold').value; })[0];
      opts(S('wold'), d ? d[2] : [], d ? T('pickW', 'Chọn phường, xã', 'Choose a ward') : T('pickD', 'Chọn quận trước', 'Choose a district first'), cur);
    }
    ui.addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b || b.dataset.t === type) return; type = b.dataset.t; fillSeq++; sync(); });
    function bind() {
      S('pnew').addEventListener('change', function () { fillSeq++; loadNew('').then(sync); });
      S('wnew').addEventListener('change', function () { fillSeq++; sync(); });
      S('pold').addEventListener('change', function () { fillSeq++; loadOld('', '').then(sync); });
      S('dold').addEventListener('change', function () { fillSeq++; oldWards(''); sync(); });
      S('wold').addEventListener('change', function () { fillSeq++; sync(); });
    }
    var fillSeq = 0;   // lần điền sau thắng: lần điền cũ (đang tải) xong muộn không ghi đè
    function fill(s) {
      var n = ++fillSeq;
      return Promise.all([get('p-new.json'), get('p-old.json')]).then(function (r) {
        if (n !== fillSeq) return;
        opts(S('pnew'), r[0], T('pickP0', 'Chọn tỉnh, thành', 'Choose a province'), s.pnew || '');
        opts(S('pold'), r[1], T('pickP0', 'Chọn tỉnh, thành', 'Choose a province'), s.pold || '');
        return Promise.all([s.pnew ? get('w-new-' + s.pnew + '.json') : null, s.pold ? get('d-old-' + s.pold + '.json') : null]).then(function (x) {
          if (n !== fillSeq) return;
          if (x[0]) opts(S('wnew'), x[0], T('pickW', 'Chọn phường, xã', 'Choose a ward'), s.wnew || ''); else opts(S('wnew'), [], T('pickP', 'Chọn tỉnh trước', 'Choose a province first'));
          districts = x[1] || [];
          if (x[1]) { opts(S('dold'), x[1], T('pickD2', 'Chọn quận, huyện', 'Choose a district'), s.dold || ''); oldWards(s.wold || ''); }
          else { opts(S('dold'), [], T('pickP', 'Chọn tỉnh trước', 'Choose a province first')); opts(S('wold'), [], T('pickD', 'Chọn quận trước', 'Choose a district first')); }
          sync();
        });
      }).catch(function (e) { console.warn('[địa chỉ]', e); });
    }
    bind();
    fill(st);
    return {
      state: state,
      // đổi ngôn ngữ: vẽ lại chữ, giữ lựa chọn
      relabel: function () { var s = state(); paint(); bind(); fill(s); },
      reset: function () { type = 'new'; var s = {}; paint(); bind(); fill(s); },
      set: function (s) { type = s && s.type === 'old' ? 'old' : 'new'; paint(); bind(); fill(s || {}); },
      // chưa chọn đủ → trả về ô đầu tiên còn trống
      missing: function () { var ks = type === 'old' ? ['pold', 'dold', 'wold'] : ['pnew', 'wnew']; for (var i = 0; i < ks.length; i++) if (!S(ks[i]).value) return S(ks[i]); return H('city').value ? null : S(ks[ks.length - 1]); },
    };
  }
  window.DC = window.DC || {};
  DC.addr = { mount: mount };
})();
