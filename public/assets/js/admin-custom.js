/*
 * /admin → Sản phẩm → mục "Thiết kế riêng (khách tự custom)".
 * Bật cho sản phẩm nào thì trang Shop hiện thêm lựa chọn "Tự thiết kế" (public/assets/js/custom.js).
 * Máy chủ làm sạch lại cấu hình (lib/custom.js → cleanConfig) và tự tính giá khi khách đặt.
 *
 * Nhóm tùy chọn soạn dạng chữ, mỗi dòng một nhóm:
 *   Chất liệu / Material: Da PU cao cấp / Premium PU ; Da microfiber / Microfiber +250000 ; Da bò thật / Cowhide +600k
 *   Thêm / Extras [nhiều]: Thêu cờ Việt Nam / Vietnam flag +80000 ; Túi đựng riêng / Carry bag +120000
 *   [nhiều] = khách chọn nhiều lựa chọn · [tùy chọn] = được bỏ trống · không ghi = bắt buộc chọn 1 (mặc định lựa chọn đầu)
 */
(function () {
  'use strict';
  var DEFS = null, CACHE = {}, waiting = [];
  var A = function () { return window.DCAdmin; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return (Number(n) || 0).toLocaleString('vi-VN') + '₫'; };

  function load(template) {
    template = template || 'groin';
    if (CACHE[template]) return Promise.resolve(CACHE[template]);
    return A().api('/custom/defaults?template=' + encodeURIComponent(template)).then(function (j) { DEFS = j.defs; CACHE[template] = j.config; return j.config; });
  }

  /* ─── nhóm tùy chọn ⇄ chữ ─── */
  function nm(o) { return o.vi + (o.en && o.en !== o.vi ? ' / ' + o.en : ''); }
  function toText(groups) {
    return (groups || []).map(function (g) {
      return nm(g.name) + (g.multi ? ' [nhiều]' : g.required ? '' : ' [tùy chọn]') + ': ' +
        g.choices.map(function (c) { return nm(c.name) + (c.fee ? ' +' + c.fee : ''); }).join(' ; ');
    }).join('\n');
  }
  function pair(s) { var i = s.indexOf(' / '); return i === -1 ? { vi: s.trim(), en: '' } : { vi: s.slice(0, i).trim(), en: s.slice(i + 3).trim() }; }
  function fromText(txt, old) {
    var out = [], err = '';
    var same = function (a, b) { return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase(); };
    String(txt || '').split('\n').forEach(function (line, n) {
      line = line.trim(); if (!line || err) return;
      var i = line.indexOf(':');
      if (i < 1) { err = 'Dòng ' + (n + 1) + ' thiếu dấu “:” giữa tên nhóm và các lựa chọn.'; return; }
      var left = line.slice(0, i), multi = /\[nhiều\]/i.test(left), opt = /\[tùy chọn\]/i.test(left);
      left = left.replace(/\[(nhiều|tùy chọn)\]/ig, '').trim();
      var name = pair(left), was = (old || []).filter(function (g) { return same(g.name.vi, name.vi); })[0];
      var choices = [];
      line.slice(i + 1).split(';').forEach(function (part) {
        part = part.trim(); if (!part || err) return;
        var fee = 0, m = part.match(/\+\s*([\d.,]+)\s*(k|nghìn|đ|₫)?\s*$/i);
        if (m) { fee = Number(m[1].replace(/[.,]/g, '')) * (/^k|nghìn/i.test(m[2] || '') ? 1000 : 1); part = part.slice(0, m.index).trim(); }
        if (!isFinite(fee) || fee < 0) { err = 'Dòng ' + (n + 1) + ': phụ phí “' + m[0] + '” không hợp lệ.'; return; }
        var cn = pair(part), cw = was && was.choices.filter(function (c) { return same(c.name.vi, cn.vi); })[0];
        choices.push({ id: cw ? cw.id : '', name: cn, fee: Math.round(fee) });
      });
      if (!err && !choices.length) err = 'Dòng ' + (n + 1) + ' (“' + name.vi + '”) chưa có lựa chọn nào.';
      if (!err) out.push({ id: was ? was.id : '', name: name, multi: multi, required: !multi && !opt, choices: choices });
    });
    if (!err && out.length > 10) err = 'Tối đa 10 nhóm tùy chọn.';
    return err ? { error: err } : { groups: out };
  }

  /* ─── giao diện ─── */
  function num(name, val, lbl, hint) {
    return '<label class="field"><span class="field__label">' + lbl + '</span><input type="number" min="0" step="1000" inputmode="numeric" data-cxa-f="' + name + '" value="' + esc(val || 0) + '">' +
      '<small class="field__hint">' + (hint || money(val)) + '</small></label>';
  }
  function body(c) {
    var t = DEFS.templates[c.template], tpl = Object.keys(DEFS.templates);
    return '<label class="check set-switch"><input type="checkbox" data-cxa-f="on"' + (c.on ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span>' +
      '<span><strong>Cho khách tự thiết kế sản phẩm này</strong></span></label>' +
      '<p class="field__hint">Bật lên: trang sản phẩm có 2 lựa chọn “Mẫu có sẵn” (màu / size ở mục Biến thể) và “✦ Tự thiết kế” — khách chọn màu từng phần, in / thêu tên, tải logo, chọn chất liệu… và xem trước trực tiếp. ' +
      'Hàng thiết kế riêng làm theo đơn nên không trừ tồn kho.</p>' +
      '<div class="cxa-body"' + (c.on ? '' : ' hidden') + '>' +
      '<div class="grid2"><label class="field"><span class="field__label">Kiểu sản phẩm (hình xem trước)</span><select data-cxa-f="template">' +
      tpl.map(function (k) { return '<option value="' + k + '"' + (k === c.template ? ' selected' : '') + '>' + esc(DEFS.templates[k].vi) + '</option>'; }).join('') +
      '</select><small class="field__hint">Đổi kiểu sẽ nạp lại các phần & nhóm tùy chọn mẫu của kiểu đó.</small></label>' +
      num('fee', c.fee, 'Phí thiết kế riêng (cộng vào giá bán)') + '</div>' +
      '<div class="grid2"><label class="field"><span class="field__label">Thời gian làm · Tiếng Việt</span><input type="text" maxlength="80" data-cxa-f="lead_vi" value="' + esc(c.lead.vi) + '"></label>' +
      '<label class="field"><span class="field__label">Thời gian làm · English</span><input type="text" maxlength="80" data-cxa-f="lead_en" value="' + esc(c.lead.en) + '"></label></div>' +

      '<div class="field"><span class="field__label">Các phần khách được đổi màu</span><div class="cxa-chips">' +
      t.zones.map(function (z) { return '<label class="cxa-chip"><input type="checkbox" data-cxa-zone="' + z[0] + '"' + (c.zones.indexOf(z[0]) !== -1 ? ' checked' : '') + '><span>' + esc(z[1]) + '</span></label>'; }).join('') +
      '</div><small class="field__hint">Phần không tick vẫn hiện trên hình với màu mặc định.</small></div>' +

      '<div class="field"><span class="field__label">Bảng màu cho khách chọn <em data-cxa-pcount>(' + c.palette.length + ' màu)</em></span><div class="cxa-pal">' +
      DEFS.palette.map(function (p) { return '<label class="cxa-col" title="' + esc(p[2]) + '"><input type="checkbox" data-cxa-col="' + p[0] + '"' + (c.palette.indexOf(p[0]) !== -1 ? ' checked' : '') + '><i style="background:' + p[1] + '"></i><span>' + esc(p[2]) + '</span></label>'; }).join('') +
      '</div><small class="field__hint">Ít nhất 2 màu.</small></div>' +

      '<fieldset class="cxa-box"><legend><label class="check"><input type="checkbox" data-cxa-f="text_on"' + (c.text.on ? ' checked' : '') + '><span>In / thêu tên, chữ</span></label></legend>' +
      '<div class="grid2"><label class="field"><span class="field__label">Số ký tự tối đa</span><input type="number" min="1" max="30" data-cxa-f="text_max" value="' + esc(c.text.max) + '"></label>' +
      num('text_fee', c.text.fee, 'Phí in chữ') + num('text_embroid', c.text.embroid, 'Cộng thêm nếu chọn thêu') + '</div>' +
      '<div class="field"><span class="field__label">Font cho khách chọn</span><div class="cxa-chips">' +
      DEFS.fonts.map(function (f) { return '<label class="cxa-chip"><input type="checkbox" data-cxa-font="' + f[0] + '"' + (c.text.fonts.indexOf(f[0]) !== -1 ? ' checked' : '') + '><span style="font-family:' + esc(f[3]) + '">' + esc(f[1]) + '</span></label>'; }).join('') +
      '</div></div></fieldset>' +

      '<fieldset class="cxa-box"><legend><label class="check"><input type="checkbox" data-cxa-f="logo_on"' + (c.logo.on ? ' checked' : '') + '><span>Khách tải logo lên</span></label></legend>' +
      '<div class="grid2">' + num('logo_fee', c.logo.fee, 'Phí in logo') + num('logo_embroid', c.logo.embroid, 'Cộng thêm nếu chọn thêu') + '</div>' +
      '<small class="field__hint">Logo khách tải lên lưu ở /assets/uploads/custom/ — link mở được trong chi tiết đơn hàng.</small></fieldset>' +

      (c.template === 'strap' ? modelBox(c.model) : '') +
      '<label class="field"><span class="field__label">Nhóm tùy chọn (chất liệu, đệm, khóa…)</span><textarea rows="7" data-cxa-f="groups" spellcheck="false">' + esc(toText(c.groups)) + '</textarea>' +
      '<small class="field__hint">Mỗi dòng một nhóm: <code>Tên nhóm / English: Lựa chọn / English ; Lựa chọn 2 / English +250000</code>. ' +
      'Ghi <code>[nhiều]</code> sau tên nhóm để khách chọn nhiều, <code>[tùy chọn]</code> để được bỏ trống; không ghi = bắt buộc (mặc định lựa chọn đầu). Phụ phí ghi <code>+250000</code> hoặc <code>+250k</code>.</small>' +
      '<small class="set-err" data-cxa-gerr role="status" hidden></small><div class="cxa-gprev" data-cxa-gprev>' + gprev(c.groups) + '</div></label>' +

      '<label class="field"><span class="field__label">Điều khoản khách phải đồng ý · Tiếng Việt</span><textarea rows="3" maxlength="600" data-cxa-f="terms_vi">' + esc(c.terms.vi) + '</textarea></label>' +
      '<label class="field"><span class="field__label">Điều khoản · English</span><textarea rows="3" maxlength="600" data-cxa-f="terms_en">' + esc(c.terms.en) + '</textarea></label>' +
      '</div>';
  }
  function gprev(groups) {
    return (groups || []).map(function (g) {
      return '<div><b>' + esc(g.name.vi) + '</b> <span class="muted">' + (g.multi ? 'chọn nhiều' : g.required ? 'bắt buộc' : 'không bắt buộc') + '</span> · ' +
        g.choices.map(function (c) { return esc(c.name.vi) + (c.fee ? ' <em>+' + money(c.fee) + '</em>' : ''); }).join(' · ') + '</div>';
    }).join('');
  }

  // container chứa cấu hình gốc (để giữ mã nhóm / lựa chọn khi sửa chữ)
  var BOXES = new WeakMap();
  /* ─── găng 3D thật (.glb) làm mockup cho dây dán ─── */
  function modelBox(m) {
    m = m || {};
    var rot = function (k, lbl) {
      return '<label class="field"><span class="field__label">' + lbl + '</span><select data-cxm="' + k + '">' + [0, 90, 180, 270].map(function (d) { return '<option value="' + d + '"' + (Number(m[k] || 0) === d ? ' selected' : '') + '>' + d + '°</option>'; }).join('') + '</select></label>';
    };
    var rng = function (k, lbl, min, max, step, dflt, unit) {
      var v = m[k] != null ? m[k] : dflt;
      return '<label class="field"><span class="field__label">' + lbl + ' <em data-cxm-out="' + k + '">' + v + (unit || '') + '</em></span><input type="range" data-cxm="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '"></label>';
    };
    return '<fieldset class="cxa-box cxa-model"><legend>Găng 3D làm mockup (file .glb)</legend>' +
      '<input type="hidden" data-cxm="url" value="' + esc(m.url || '') + '">' +
      '<p class="field__hint">Mặc định web dùng găng dựng sẵn. Tải file găng 3D thật (designer làm hoặc mua mẫu có quyền thương mại, định dạng <b>.glb</b>, tối đa 40MB) — dây dán tự dò cổ găng và quấn lên. ' +
      'Chỉ cần <b>1 chiếc găng</b> — web tự soi gương thành đôi.</p>' +
      '<div class="cxa-model-row"><label class="btn btn--ghost btn--sm"><input type="file" accept=".glb,model/gltf-binary" data-cxm-file hidden>' + (m.url ? 'Đổi file .glb' : 'Tải file .glb lên') + '</label>' +
      '<span data-cxm-name>' + (m.url ? esc(m.url.split('/').pop()) : 'Chưa có — đang dùng găng dựng sẵn') + '</span>' +
      (m.url ? '<button type="button" class="btn btn--ghost btn--sm" data-cxm-del>Bỏ, dùng găng dựng sẵn</button>' : '') + '</div>' +
      '<div class="cxa-model-body"' + (m.url ? '' : ' hidden') + '>' +
      '<div class="cxa-model-prev" data-cxm-prev><p class="muted">Xem trước sẽ hiện ở đây…</p></div>' +
      '<p class="field__hint">Chỉnh cho găng <b>dựng đứng, cổ găng ở dưới, mu bàn tay quay ra trước</b>, rồi chỉnh dây cho nằm đúng chỗ.</p>' +
      '<div class="grid3">' + rot('rx', 'Xoay trục X') + rot('ry', 'Xoay trục Y') + rot('rz', 'Xoay trục Z') + '</div>' +
      '<div class="grid2">' + rng('y', 'Độ cao dây (so với chiều cao găng)', 0.02, 0.6, 0.01, 0.22) + rng('fit', 'Độ ôm của dây', 0.8, 1.4, 0.01, 1) + '</div>' +
      '<div class="grid2">' + rng('turn', 'Xoay vị trí logo quanh cổ găng', -180, 180, 1, 0, '°') +
      '<div class="field"><label class="check"><input type="checkbox" data-cxm="flip"' + (m.flip ? ' checked' : '') + '><span>File là găng tay trái (lật lại)</span></label>' +
      '<label class="check"><input type="checkbox" data-cxm="tint"' + (m.tint ? ' checked' : '') + '><span>Cho khách đổi màu găng xem thử</span></label></div></div>' +
      '</div></fieldset>';
  }
  function readModel(box) {
    var g = function (k) { return box.querySelector('[data-cxm="' + k + '"]'); };
    if (!g('url') || !g('url').value) return null;
    return { url: g('url').value, rx: +g('rx').value, ry: +g('ry').value, rz: +g('rz').value, y: +g('y').value, fit: +g('fit').value, turn: +g('turn').value, flip: g('flip').checked, tint: g('tint').checked };
  }
  // xem trước trong admin: tạo lại cảnh 3D khi đổi thông số (găng .glb nhớ sẵn, không tải lại)
  var PV = { api: null, t: 0 };
  function previewModel(box) {
    var el = box.querySelector('[data-cxm-prev]'), m = readModel(box);
    if (!el || !m) return;
    clearTimeout(PV.t);
    PV.t = setTimeout(function () {
      var go = function () {
        if (PV.api) { PV.api.dispose(); PV.api = null; }
        el.innerHTML = '<div class="cxa-model-cv"></div><p class="muted" data-cxm-st>Đang tải găng 3D…</p>';
        var cv = el.firstChild, t = DEFS.templates.strap, col = {};
        t.zones.forEach(function (z) { var p = DEFS.palette.filter(function (x) { return x[0] === z[3]; })[0]; col[z[0]] = p ? p[1] : '#111'; });
        window.DCX3D.create(cv, 'strap', { model: m }).then(function (api) {
          PV.api = api; api.update({ col: col, groups: {}, glove: '#1c1c1c', text: { value: 'DAPPER', font: 'Arial, sans-serif', method: 'print', spot: 'hook' } });
          api.view('gloves');
          var st = el.querySelector('[data-cxm-st]');
          st.innerHTML = api.real ? 'Kéo để xoay. Nút: <button type="button" data-cxm-view="gloves">Cả đôi</button> <button type="button" data-cxm-view="close">Cận cảnh</button> <button type="button" data-cxm-view="palm">Mặt lòng</button>'
            : '⚠ Không đọc được file .glb — đang hiện găng dựng sẵn. Thử xuất lại file (glTF binary).';
        }, function (er) { el.innerHTML = '<p class="set-err">Không mở được xem trước 3D: ' + esc((er && er.message) || er) + '</p>'; });
      };
      if (window.DCX3D) go();
      else { var sc = document.createElement('script'); sc.src = '/assets/js/custom3d.js'; sc.onload = go; document.head.appendChild(sc); }
    }, 350);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cxm-view],[data-cxm-del]'); if (!b) return;
    if (b.matches('[data-cxm-view]')) { if (PV.api) PV.api.view(b.getAttribute('data-cxm-view')); return; }
    var box = b.closest('[data-cxa]'), fs = b.closest('.cxa-model');
    if (PV.api) { PV.api.dispose(); PV.api = null; }
    fs.outerHTML = modelBox(null);
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.matches || !t.matches('[data-cxm-file]') || !t.files[0]) return;
    var file = t.files[0], fs = t.closest('.cxa-model'), name = fs.querySelector('[data-cxm-name]');
    if (!/\.glb$/i.test(file.name)) { name.textContent = 'Cần file đuôi .glb (glTF binary). File .gltf / .fbx / .obj hãy xuất lại sang .glb.'; return; }
    if (file.size > 40 * 1024 * 1024) { name.textContent = 'File quá 40MB — giảm số đa giác hoặc nén texture rồi xuất lại.'; return; }
    name.textContent = 'Đang tải lên ' + file.name + '…';
    A().uploadRaw(new File([file], file.name, { type: 'model/gltf-binary' })).then(function (d) {
      var old = readModel(fs.closest('[data-cxa]')) || {};
      fs.outerHTML = modelBox(Object.assign(old, { url: d.url }));
      var box = document.querySelector('[data-cxa][data-ready]'); previewModel(box);
      A().toast('Đã tải găng 3D lên — chỉnh hướng & vị trí dây rồi bấm Lưu sản phẩm.');
    }, function (er) { name.textContent = (er && er.message) || 'Tải lên thất bại.'; });
  });
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t.matches || !t.matches('[data-cxm]')) return;
    var o = t.closest('.cxa-model').querySelector('[data-cxm-out="' + t.getAttribute('data-cxm') + '"]'); if (o) o.textContent = t.value + (t.getAttribute('data-cxm') === 'turn' ? '°' : '');
    previewModel(t.closest('[data-cxa]'));
  });

  function fill(box, cfg) {
    BOXES.set(box, { cfg: cfg, had: box.getAttribute('data-had') === '1' });
    box.innerHTML = body(cfg); box.setAttribute('data-ready', '1');
    if (cfg.model && cfg.model.url) previewModel(box);
  }
  function fillPending() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-cxa]:not([data-ready])'), function (box) {
      var cfg = waiting.shift() || null;
      if (cfg && cfg.template) fill(box, cfg);
      else load('groin').then(function (d) { var c = JSON.parse(JSON.stringify(d)); c.on = false; fill(box, c); }, function () { box.textContent = 'Chưa tải được cấu hình thiết kế riêng — mở lại sản phẩm để thử lại.'; });
    });
  }

  window.DCAdminCustom = {
    html: function (cfg) {
      var had = !!(cfg && cfg.template);
      waiting.push(had ? JSON.parse(JSON.stringify(cfg)) : null);
      setTimeout(function () { if (!DEFS) load(had ? cfg.template : 'groin').then(fillPending, fillPending); else fillPending(); }, 0);
      return '<div class="cxa" data-cxa data-had="' + (had ? 1 : 0) + '"><p class="muted">Đang tải…</p></div>';
    },
    // → undefined (giữ nguyên) · null (chưa từng bật → xóa) · { value } · { error, el }
    read: function (form) {
      var box = form.querySelector('[data-cxa][data-ready]'); if (!box) return undefined;
      var st = BOXES.get(box) || {}, f = function (n) { return box.querySelector('[data-cxa-f="' + n + '"]'); };
      var on = f('on').checked;
      if (!on && !st.had) return { value: null };
      var g = fromText(f('groups').value, st.cfg && st.cfg.groups);
      if (g.error) return { error: 'Thiết kế riêng — ' + g.error, el: f('groups') };
      var all = function (sel, attr) { return Array.prototype.filter.call(box.querySelectorAll(sel), function (i) { return i.checked; }).map(function (i) { return i.getAttribute(attr); }); };
      var palette = all('[data-cxa-col]', 'data-cxa-col');
      if (on && palette.length < 2) return { error: 'Thiết kế riêng — chọn ít nhất 2 màu cho khách.', el: box.querySelector('[data-cxa-col]') };
      var zones = all('[data-cxa-zone]', 'data-cxa-zone');
      if (on && !zones.length) return { error: 'Thiết kế riêng — tick ít nhất 1 phần cho khách đổi màu.', el: box.querySelector('[data-cxa-zone]') };
      var n = function (k) { return Math.max(0, Math.round(Number(f(k).value) || 0)); };
      return { value: {
        on: on, template: f('template').value, fee: n('fee'),
        lead: { vi: f('lead_vi').value.trim(), en: f('lead_en').value.trim() },
        zones: zones, palette: palette,
        text: { on: f('text_on').checked, max: Math.min(30, Math.max(1, n('text_max') || 14)), fee: n('text_fee'), embroid: n('text_embroid'), fonts: all('[data-cxa-font]', 'data-cxa-font') },
        logo: { on: f('logo_on').checked, fee: n('logo_fee'), embroid: n('logo_embroid') },
        groups: g.groups, terms: { vi: f('terms_vi').value.trim(), en: f('terms_en').value.trim() }, model: readModel(box),
      } };
    },
    _parse: fromText, _text: toText,
  };

  document.addEventListener('change', function (e) {
    var t = e.target, box = t.closest && t.closest('[data-cxa]'); if (!box) return;
    if (t.matches('[data-cxa-f="on"]')) box.querySelector('.cxa-body').hidden = !t.checked;
    if (t.matches('[data-cxa-col]')) { var c = box.querySelectorAll('[data-cxa-col]:checked').length, el = box.querySelector('[data-cxa-pcount]'); if (el) el.textContent = '(' + c + ' màu)'; }
    if (t.matches('[data-cxa-f="template"]')) {
      var keep = window.DCAdminCustom.read(box.closest('form')), v = keep && keep.value;
      load(t.value).then(function (d) {
        var c = JSON.parse(JSON.stringify(d));
        if (v) { c.on = v.on; c.fee = v.fee; c.lead = v.lead; c.palette = v.palette; c.terms = v.terms; c.logo = v.logo; c.text.fee = v.text.fee; c.text.embroid = v.text.embroid; c.text.max = v.text.max; }
        fill(box, c);
      }, function (er) { A().toast((er && er.message) || 'Chưa tải được mẫu.', 'error'); });
    }
  });
  document.addEventListener('input', function (e) {
    var t = e.target, box = t.closest && t.closest('[data-cxa]'); if (!box) return;
    if (t.matches('[data-cxa-f="groups"]')) {
      var st = BOXES.get(box) || {}, g = fromText(t.value, st.cfg && st.cfg.groups), er = box.querySelector('[data-cxa-gerr]');
      er.hidden = !g.error; er.textContent = g.error || '';
      if (!g.error) box.querySelector('[data-cxa-gprev]').innerHTML = gprev(g.groups);
    }
    if (t.type === 'number') { var h = t.parentNode.querySelector('.field__hint'); if (h && /₫$/.test(h.textContent)) h.textContent = money(t.value); }
  });

  /* ─── chi tiết đơn hàng: liệt kê thiết kế riêng ─── */
  window.DCAdminCustom.itemHtml = function (it) {
    var cx = it && it.custom; if (!cx || !Array.isArray(cx.lines)) return '';
    var logo = cx.spec && cx.spec.logo && cx.spec.logo.url;
    return '<span class="cxa-ord"><b>✦ Thiết kế riêng' + (cx.lead ? ' <small>· ' + esc(cx.lead.vi || cx.lead) + '</small>' : '') + '</b>' +
      '<span>' + cx.lines.map(function (l) { return esc(l[0]) + (l[1] ? ': ' + esc(l[1]) : '') + (l[2] ? ' <em>+' + money(l[2]) + '</em>' : ''); }).join('<br>') + '</span>' +
      (logo ? '<a href="' + esc(logo) + '" target="_blank" rel="noopener" class="cxa-ord-logo"><img src="' + esc(logo) + '" alt="">Mở logo khách gửi ↗</a>' : '') + '</span>';
  };
})();
