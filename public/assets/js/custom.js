/*
 * Trình tự thiết kế sản phẩm (Boxing Equipment) — trang Shop, trang chi tiết sản phẩm.
 * Sản phẩm có custom.on (bật ở /admin → Sản phẩm → Thiết kế riêng) hiện thêm lựa chọn "Tự thiết kế":
 *   xem trước SVG đổi màu từng phần · tên / chữ (font, in / thêu, vị trí) · logo khách tải lên · nhóm tùy chọn có phụ phí · ghi chú cho thợ
 * Giỏ hàng: dòng thiết kế có khóa "id::size::cx-<mã>"; bản thiết kế lưu ở DC.cx (localStorage dc_cx).
 * Giá trên trang chỉ để khách xem — máy chủ tính lại khi đặt hàng (lib/custom.js).
 */
(function () {
  'use strict';
  var D = (window.__CMS && window.__CMS.cx) || null;
  if (!D || !window.DC) return;
  var $ = function (id) { return document.getElementById(id); };
  var en = function () { return DC.lang() === 'en'; };
  var T = function (vi, enTxt) { return en() ? enTxt : vi; };
  var esc = DC.esc;
  var money = function (n) { return (Math.round(n) || 0).toLocaleString('vi-VN') + 'đ'; };
  var pick = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i][0] === id) return list[i]; return null; };
  var nm = function (o) { return o ? (en() ? o.en || o.vi : o.vi) : ''; };

  /* ─── bộ nhớ bản thiết kế (dùng chung với giỏ hàng) ─── */
  var KEY = 'dc_cx';
  function store() { try { var o = JSON.parse(localStorage.getItem(KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ('0000000' + (h >>> 0).toString(16)).slice(-8); }
  DC.cx = {
    get: function (ref) { var o = store()[ref]; return o && o.spec ? o : null; },
    put: function (pid, spec) {
      var ref = 'cx-' + hash(pid + JSON.stringify(spec)), all = store();
      all[ref] = { pid: pid, spec: spec, at: Date.now() };
      // dọn bản thiết kế cũ không còn trong giỏ (giữ tối đa 40)
      var cart = DC.cart.load(), used = {};
      Object.keys(cart).forEach(function (k) { used[k.split('::')[2]] = 1; });
      Object.keys(all).sort(function (a, b) { return (all[b].at || 0) - (all[a].at || 0); }).forEach(function (r, i) { if (r !== ref && !used[r] && i >= 40) delete all[r]; });
      try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* bỏ qua */ }
      return ref;
    },
    is: function (color) { return /^cx-/.test(String(color || '')); },
    // phụ phí theo cấu hình sản phẩm (cùng cách tính với máy chủ)
    fee: function (p, spec) { return calc(p && p.custom, spec || {}).fee; },
    label: function () { return T('Thiết kế riêng', 'Custom design'); },
    calc: function (p, spec) { return calc(p && p.custom, spec || {}); },
  };

  function calc(cfg, s) {
    var out = { fee: 0, lines: [] };
    if (!cfg || !cfg.on) return out;
    var t = D.templates[cfg.template] || D.templates.groin;
    if (cfg.fee) { out.fee += cfg.fee; out.lines.push([T('Phí thiết kế riêng', 'Custom design fee'), '', cfg.fee]); }
    var tx = s.text || {};
    if (cfg.text.on && tx.value) {
      var tf = cfg.text.fee + (tx.method === 'embroid' ? cfg.text.embroid : 0);
      out.fee += tf; out.lines.push([T('Chữ', 'Text'), '“' + tx.value + '” · ' + methodName(tx.method), tf]);
    }
    var lg = s.logo || {};
    if (cfg.logo.on && lg.url) {
      var lf = cfg.logo.fee + (lg.method === 'embroid' ? cfg.logo.embroid : 0);
      out.fee += lf; out.lines.push(['Logo', methodName(lg.method) + ' · ' + spotName(t, lg.spot), lf]);
    }
    (cfg.groups || []).forEach(function (g) {
      var want = (s.groups || {})[g.id], ids = g.multi ? (Array.isArray(want) ? want : []) : [want];
      ids = ids.filter(function (id) { return g.choices.some(function (c) { return c.id === id; }); });
      if (!ids.length && g.required && g.choices[0]) ids = [g.choices[0].id];
      ids.forEach(function (id) { var c = g.choices.filter(function (x) { return x.id === id; })[0]; out.fee += c.fee; out.lines.push([nm(g.name), nm(c.name), c.fee]); });
    });
    return out;
  }
  function methodName(m) { var x = pick(D.methods, m === 'embroid' ? 'embroid' : 'print'); return en() ? x[2] : x[1]; }
  function spotName(t, id) { var x = pick(t.spots, id) || t.spots[0]; return en() ? x[2] : x[1]; }
  function zoneName(z) { return en() ? z[2] : z[1]; }
  function colName(c) { return en() ? c[3] : c[2]; }
  function hexOf(id) { var c = pick(D.palette, id); return c ? c[1] : '#111'; }
  // chữ / viền nổi trên nền: nền sáng → chữ đen
  function ink(hex) { var n = parseInt(String(hex).slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#111' : '#fff'; }

  /* ─── hình xem trước (SVG) theo mẫu ─── */
  var SHADE = '<defs><linearGradient id="cxSh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>' +
    '<radialGradient id="cxHi" cx=".35" cy=".25" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<filter id="cxDrop" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-opacity=".22"/></filter></defs>';
  var SHAPES = {
    groin: {
      box: '0 0 420 380',
      parts: [
        ['belt', 'M28 52 Q210 20 392 52 L392 104 Q210 74 28 104 Z'],
        ['left', 'M28 104 Q120 90 168 96 L176 236 Q110 214 58 162 Q36 138 28 104 Z'],
        ['right', 'M392 104 Q300 90 252 96 L244 236 Q310 214 362 162 Q384 138 392 104 Z'],
        ['cup', 'M160 92 Q210 84 260 92 Q276 170 252 262 Q236 330 210 352 Q184 330 168 262 Q144 170 160 92 Z'],
        ['panel', 'M178 132 Q210 124 242 132 Q248 172 236 206 Q222 222 210 226 Q198 222 184 206 Q172 172 178 132 Z'],
      ],
      stitch: ['M40 64 Q210 36 380 64', 'M40 92 Q210 64 380 92', 'M170 104 Q210 97 250 104 Q262 172 242 256 Q228 318 210 336 Q192 318 178 256 Q158 172 170 104'],
      spots: { belt: [210, 72, 260, 34], cup: [210, 178, 64, 56], left: [112, 150, 92, 46], right: [308, 150, 92, 46] },
    },
    gloves: {
      box: '0 0 420 380',
      parts: [
        ['cuff', 'M126 250 L294 250 L300 360 L120 360 Z'],
        ['palm', 'M118 120 Q120 40 210 34 Q300 40 302 120 L300 252 L120 252 Z'],
        ['top', 'M134 120 Q138 58 210 54 Q282 58 286 120 L284 230 L136 230 Z'],
        ['thumb', 'M300 150 Q350 140 352 196 Q350 244 302 246 Z'],
        ['lace', 'M196 262 L224 262 L224 352 L196 352 Z'],
      ],
      stitch: ['M140 240 L280 240', 'M128 262 L292 262'],
      spots: { top: [210, 150, 120, 60], cuff: [210, 306, 140, 40], thumb: [328, 198, 40, 34] },
    },
    headgear: {
      box: '0 0 420 380',
      parts: [
        ['crown', 'M90 150 Q96 40 210 34 Q324 40 330 150 L330 170 L90 170 Z'],
        ['cheek', 'M90 170 L150 170 L150 316 Q108 300 92 250 Z M330 170 L270 170 L270 316 Q312 300 328 250 Z'],
        ['ear', 'M70 172 Q66 132 92 128 L92 246 Q66 238 70 172 Z M350 172 Q354 132 328 128 L328 246 Q354 238 350 172 Z'],
        ['chin', 'M150 300 L270 300 Q262 352 210 360 Q158 352 150 300 Z'],
        ['bar', 'M150 168 L270 168 L270 186 L150 186 Z'],
      ],
      stitch: ['M96 150 Q210 132 324 150'],
      spots: { front: [210, 104, 150, 44], cheek: [120, 236, 52, 40], back: [210, 64, 120, 30] },
    },
  };
  function preview(p, s) {
    var cfg = p.custom, sh = SHAPES[cfg.template] || SHAPES.groin, t = D.templates[cfg.template] || D.templates.groin;
    var col = function (zid) { var z = (s.zones || {})[zid]; if (z) return hexOf(z); var def = pick(t.zones, zid); return hexOf(def ? def[3] : 'black'); };
    var trim = col('trim'), out = '<svg class="cx-svg" viewBox="' + sh.box + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(T('Xem trước thiết kế', 'Design preview')) + '">' + SHADE + '<g filter="url(#cxDrop)">';
    sh.parts.forEach(function (pt) {
      var zid = pt[0];
      if (cfg.zones.indexOf(zid) === -1 && zid !== 'panel') zid = zid; // vùng không cho chọn vẫn vẽ bằng màu mặc định
      out += '<path d="' + pt[1] + '" fill="' + col(zid) + '" stroke="' + trim + '" stroke-width="6" stroke-linejoin="round"/>' +
        '<path d="' + pt[1] + '" fill="url(#cxSh)"/><path d="' + pt[1] + '" fill="url(#cxHi)"/>';
    });
    var stitchCol = (s.groups && [].concat(s.groups.extra || []).indexOf('stitch') !== -1) ? ink(col('cup')) === '#fff' ? '#f2c12e' : '#c8102e' : 'rgba(255,255,255,.45)';
    sh.stitch.forEach(function (d) { out += '<path d="' + d + '" fill="none" stroke="' + stitchCol + '" stroke-width="2" stroke-dasharray="6 5"/>'; });
    out += '</g>';
    // logo
    var lg = s.logo || {};
    if (lg.url && sh.spots[lg.spot]) {
      var L = sh.spots[lg.spot], w = L[2], h = L[3];
      out += '<image href="' + esc(lg.url) + '" x="' + (L[0] - w / 2) + '" y="' + (L[1] - h / 2) + '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid meet"' + (lg.method === 'embroid' ? ' style="filter:contrast(1.1) saturate(1.1)"' : '') + '/>';
    }
    // chữ
    var tx = s.text || {};
    if (tx.value && sh.spots[tx.spot]) {
      var P = sh.spots[tx.spot], f = pick(D.fonts, tx.font) || D.fonts[0], zoneCol = col(tx.spot === 'belt' ? 'belt' : tx.spot === 'cup' ? 'panel' : tx.spot);
      var size = Math.max(14, Math.min(P[3] * 0.72, (P[2] * 1.7) / Math.max(3, tx.value.length)));
      out += '<text x="' + P[0] + '" y="' + P[1] + '" text-anchor="middle" dominant-baseline="central" font-family="' + esc(f[3]) + '" font-size="' + size.toFixed(1) + '" font-weight="700" letter-spacing="1" fill="' + ink(zoneCol) + '"' +
        (tx.method === 'embroid' ? ' stroke="' + (ink(zoneCol) === '#fff' ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.35)') + '" stroke-width="1.2" paint-order="stroke"' : '') + '>' + esc(tx.value) + '</text>';
    }
    return out + '</svg>';
  }

  /* ─── trạng thái theo sản phẩm đang xem ─── */
  var S = null;
  function fresh(p) {
    var t = D.templates[p.custom.template] || D.templates.groin, z = {};
    p.custom.zones.forEach(function (zid) { var d = pick(t.zones, zid); z[zid] = p.custom.palette.indexOf(d[3]) !== -1 ? d[3] : p.custom.palette[0]; });
    var g = {};
    (p.custom.groups || []).forEach(function (x) { g[x.id] = x.multi ? [] : (x.required ? x.choices[0].id : ''); });
    return { pid: p.id, mode: 'std', zones: z, text: { value: '', font: p.custom.text.fonts[0], method: 'print', spot: t.spots[0][0] },
      logo: { url: '', method: 'print', spot: (t.spots[1] || t.spots[0])[0], name: '' }, groups: g, note: '', agree: false, open: 'color' };
  }
  function spec() {
    var o = { zones: S.zones, groups: {} };
    Object.keys(S.groups).forEach(function (k) { var v = S.groups[k]; if (Array.isArray(v) ? v.length : v) o.groups[k] = v; });
    if (S.text.value.trim()) o.text = { value: S.text.value.trim(), font: S.text.font, method: S.text.method, spot: S.text.spot };
    if (S.logo.url) o.logo = { url: S.logo.url, method: S.logo.method, spot: S.logo.spot };
    if (S.note.trim()) o.note = S.note.trim();
    return o;
  }
  function product() { return typeof PRODUCTS !== 'undefined' && typeof detailId !== 'undefined' ? PRODUCTS.filter(function (x) { return x.id === detailId; })[0] : null; }

  /* ─── vẽ giao diện ─── */
  function mount() {
    var p = product(), info = document.querySelector('.pdp-info'), gal = document.querySelector('.pdp-gallery');
    var mode = $('cxMode'), panel = $('cxPanel'), stage = $('cxStage');
    if (!p || !p.custom || !p.custom.on) {
      if (mode) mode.hidden = true; if (panel) panel.hidden = true; if (stage) stage.hidden = true;
      document.body.classList.remove('cx-on'); S = null; return;
    }
    if (!S || S.pid !== p.id) S = fresh(p);
    if (!mode) {
      mode = document.createElement('div'); mode.id = 'cxMode'; mode.className = 'cx-mode';
      var colorRow = info.querySelector('.opt-color'); info.insertBefore(mode, colorRow);
      panel = document.createElement('div'); panel.id = 'cxPanel'; panel.className = 'cx-panel';
      info.insertBefore(panel, info.querySelector('.pdp-buy'));
      stage = document.createElement('div'); stage.id = 'cxStage'; stage.className = 'cx-stage';
      gal.insertBefore(stage, gal.firstChild);
    }
    mode.hidden = false;
    mode.innerHTML = '<p class="cx-mode-h">' + T('Chọn kiểu', 'Choose') + '</p><div class="cx-seg" role="tablist">' +
      '<button type="button" role="tab" data-cx-mode="std" aria-selected="' + (S.mode === 'std') + '">' + T('Mẫu có sẵn', 'Ready-made') + '<small>' + T('Màu & size tiêu chuẩn · giao nhanh', 'Standard colours & sizes · ships fast') + '</small></button>' +
      '<button type="button" role="tab" data-cx-mode="cx" aria-selected="' + (S.mode === 'cx') + '"><span class="cx-star">✦</span> ' + T('Tự thiết kế', 'Design your own') + '<small>' + T('Màu từng phần · tên · logo · chất liệu', 'Every panel · name · logo · material') + '</small></button></div>';
    var on = S.mode === 'cx';
    document.body.classList.toggle('cx-on', on);
    panel.hidden = !on; stage.hidden = !on;
    if (on) { render(p); } else { pdpPrice(p, 0); }
  }
  function sec(id, num, title, sub, body) {
    var open = S.open === id;
    return '<section class="cx-sec' + (open ? ' open' : '') + '" data-cx-sec="' + id + '"><button type="button" class="cx-sec-h" aria-expanded="' + open + '"><span class="cx-n">' + num + '</span><span class="cx-t">' + title +
      '<small>' + sub + '</small></span><span class="cx-chev" aria-hidden="true">+</span></button><div class="cx-sec-b">' + body + '</div></section>';
  }
  function render(p) {
    var cfg = p.custom, t = D.templates[cfg.template] || D.templates.groin, c = calc(cfg, spec());
    $('cxStage').innerHTML = '<div class="cx-stage-in">' + preview(p, S) + '<p class="cx-stage-cap">' + T('Xem trước minh họa — màu thật và vị trí chính xác có trong bản phác thảo gửi bạn duyệt trước khi làm.', 'Illustrative preview — exact colours and placement come in the mockup we send you to approve before production.') + '</p></div>';
    var h = '<div class="cx-mini">' + preview(p, S) + '</div>';
    // 1. màu
    var presets = [['black', 'red'], ['white', 'gold'], ['navy', 'silver'], ['red', 'white'], ['pink', 'white'], ['black', 'gold']].filter(function (x) { return cfg.palette.indexOf(x[0]) !== -1 && cfg.palette.indexOf(x[1]) !== -1; });
    var colBody = (presets.length ? '<div class="cx-presets"><span>' + T('Phối nhanh', 'Quick combos') + '</span>' + presets.map(function (x) {
      return '<button type="button" data-cx-preset="' + x[0] + '|' + x[1] + '" title="' + esc(colName(pick(D.palette, x[0])) + ' / ' + colName(pick(D.palette, x[1]))) + '"><i style="background:' + hexOf(x[0]) + '"></i><i style="background:' + hexOf(x[1]) + '"></i></button>';
    }).join('') + '</div>' : '') + cfg.zones.map(function (zid) {
      var z = pick(t.zones, zid), cur = S.zones[zid];
      return '<div class="cx-zone"><div class="cx-zone-h"><b>' + esc(zoneName(z)) + '</b><span>' + esc(colName(pick(D.palette, cur))) + '</span></div><div class="cx-sw">' +
        cfg.palette.map(function (cid) { var cc = pick(D.palette, cid); return '<button type="button" class="' + (cid === cur ? 'sel' : '') + '" data-cx-zone="' + zid + '" data-cx-col="' + cid + '" style="--c:' + cc[1] + '" aria-label="' + esc(zoneName(z) + ': ' + colName(cc)) + '" aria-pressed="' + (cid === cur) + '"></button>'; }).join('') + '</div></div>';
    }).join('');
    h += sec('color', 1, T('Màu từng phần', 'Panel colours'), cfg.zones.length + ' ' + T('phần', 'panels') + ' · ' + cfg.palette.length + ' ' + T('màu', 'colours'), colBody);
    var n = 2;
    // 2. chữ
    if (cfg.text.on) {
      var tx = S.text;
      var tb = '<label class="cx-in"><span>' + T('Tên / chữ muốn in', 'Name / text') + ' <em>' + tx.value.length + '/' + cfg.text.max + '</em></span><input type="text" data-cx-text maxlength="' + cfg.text.max + '" value="' + esc(tx.value) + '" placeholder="' + T('VD: PHONG, DAPPER, TEAM HVP…', 'e.g. PHONG, DAPPER, TEAM HVP…') + '" autocomplete="off"></label>' +
        '<p class="cx-lab">' + T('Font chữ', 'Font') + '</p><div class="cx-chips cx-fonts">' + cfg.text.fonts.map(function (fid) { var f = pick(D.fonts, fid); return '<button type="button" data-cx-font="' + fid + '" class="' + (tx.font === fid ? 'sel' : '') + '" style="font-family:' + esc(f[3]) + '">' + esc(tx.value || 'Dapper') + '<small>' + esc(en() ? f[2] : f[1]) + '</small></button>'; }).join('') + '</div>' +
        '<p class="cx-lab">' + T('Cách làm', 'Method') + '</p><div class="cx-chips">' + D.methods.map(function (m) { var fee = cfg.text.fee + (m[0] === 'embroid' ? cfg.text.embroid : 0); return '<button type="button" data-cx-tmethod="' + m[0] + '" class="' + (tx.method === m[0] ? 'sel' : '') + '">' + (en() ? m[2] : m[1]) + (fee ? ' <em>+' + money(fee) + '</em>' : '') + '</button>'; }).join('') + '</div>' +
        '<p class="cx-lab">' + T('Vị trí', 'Placement') + '</p><div class="cx-chips">' + t.spots.map(function (sp) { return '<button type="button" data-cx-tspot="' + sp[0] + '" class="' + (tx.spot === sp[0] ? 'sel' : '') + '">' + esc(en() ? sp[2] : sp[1]) + '</button>'; }).join('') + '</div>';
      h += sec('text', n++, T('Tên / chữ', 'Name / text'), tx.value ? '“' + esc(tx.value) + '”' : T('Không bắt buộc', 'Optional'), tb);
    }
    // 3. logo
    if (cfg.logo.on) {
      var lg = S.logo;
      var lb = (lg.url ? '<div class="cx-logo"><img src="' + esc(lg.url) + '" alt=""><div><b>' + esc(lg.name || 'logo') + '</b><button type="button" data-cx-logo-del>' + T('Bỏ logo', 'Remove logo') + '</button></div></div>'
          : '<label class="cx-up"><input type="file" accept="image/png,image/jpeg,image/webp" data-cx-logo hidden><b>' + T('Tải logo lên', 'Upload a logo') + '</b><span>' + T('PNG nền trong suốt là đẹp nhất · tối đa 4MB', 'Transparent PNG works best · max 4MB') + '</span></label>') +
        '<p class="cx-up-msg" data-cx-logo-msg role="status"></p>' +
        '<p class="cx-lab">' + T('Cách làm', 'Method') + '</p><div class="cx-chips">' + D.methods.map(function (m) { var fee = cfg.logo.fee + (m[0] === 'embroid' ? cfg.logo.embroid : 0); return '<button type="button" data-cx-lmethod="' + m[0] + '" class="' + (lg.method === m[0] ? 'sel' : '') + '">' + (en() ? m[2] : m[1]) + (fee ? ' <em>+' + money(fee) + '</em>' : '') + '</button>'; }).join('') + '</div>' +
        '<p class="cx-lab">' + T('Vị trí', 'Placement') + '</p><div class="cx-chips">' + t.spots.map(function (sp) { return '<button type="button" data-cx-lspot="' + sp[0] + '" class="' + (lg.spot === sp[0] ? 'sel' : '') + '">' + esc(en() ? sp[2] : sp[1]) + '</button>'; }).join('') + '</div>' +
        '<p class="cx-fine">' + T('Bạn cần là chủ sở hữu logo hoặc được phép sử dụng logo.', 'You must own the logo or have permission to use it.') + '</p>';
      h += sec('logo', n++, 'Logo', lg.url ? T('Đã tải lên', 'Uploaded') : T('Không bắt buộc', 'Optional'), lb);
    }
    // 4. tùy chọn
    if ((cfg.groups || []).length) {
      var gb = cfg.groups.map(function (g) {
        var cur = S.groups[g.id];
        return '<p class="cx-lab">' + esc(nm(g.name)) + (g.multi ? ' <em>' + T('chọn nhiều', 'pick any') + '</em>' : '') + '</p><div class="cx-chips">' + g.choices.map(function (ch) {
          var sel = g.multi ? (cur || []).indexOf(ch.id) !== -1 : cur === ch.id;
          return '<button type="button" data-cx-g="' + g.id + '" data-cx-c="' + ch.id + '" class="' + (sel ? 'sel' : '') + '" aria-pressed="' + sel + '">' + esc(nm(ch.name)) + (ch.fee ? ' <em>+' + money(ch.fee) + '</em>' : '') + '</button>';
        }).join('') + '</div>';
      }).join('');
      h += sec('opts', n++, T('Chất liệu & tùy chọn', 'Materials & options'), cfg.groups.length + ' ' + T('nhóm', 'groups'), gb);
    }
    // 5. ghi chú
    h += sec('note', n++, T('Ghi chú cho thợ', 'Note for our craftsmen'), S.note ? T('Đã ghi', 'Added') : T('Không bắt buộc', 'Optional'),
      '<textarea data-cx-note maxlength="300" rows="3" placeholder="' + T('VD: chữ nghiêng, logo nhỏ hơn, phối giống bộ găng của tôi…', 'e.g. italic text, smaller logo, match my gloves…') + '">' + esc(S.note) + '</textarea>');
    // tổng
    var base = p.price, total = base + c.fee;
    h += '<div class="cx-sum"><div class="cx-sum-r"><span>' + T('Giá sản phẩm', 'Base price') + '</span><b>' + money(base) + '</b></div>' +
      c.lines.filter(function (l) { return l[2]; }).map(function (l) { return '<div class="cx-sum-r cx-sum-f"><span>' + esc(l[0]) + (l[1] ? ' · ' + esc(l[1]) : '') + '</span><b>+' + money(l[2]) + '</b></div>'; }).join('') +
      '<div class="cx-sum-r cx-sum-t"><span>' + T('Giá mỗi sản phẩm', 'Price per item') + '</span><b>' + money(total) + '</b></div>' +
      '<p class="cx-lead">⏱ ' + esc(nm(cfg.lead)) + '</p>' +
      '<label class="cx-agree"><input type="checkbox" data-cx-agree' + (S.agree ? ' checked' : '') + '><span>' + esc(nm(cfg.terms)) + '</span></label><p class="cx-err" data-cx-err role="alert" hidden></p></div>';
    $('cxPanel').innerHTML = h;
    pdpPrice(p, c.fee);
  }
  // giá + chữ nút theo chế độ
  function pdpPrice(p, fee) {
    var on = S && S.mode === 'cx';
    if ($('dPrice')) $('dPrice').textContent = money(p.price + (on ? fee : 0));
    var add = $('dAdd'), buy = $('dBuy');
    if (on) {
      if (add) { add.disabled = false; add.classList.remove('v3-soldout'); add.textContent = T('Thêm thiết kế vào giỏ', 'Add design to cart'); }
      if (buy) { buy.disabled = false; buy.classList.remove('v3-soldout'); buy.textContent = T('Đặt làm ngay', 'Order now'); }
    } else if (typeof pdpBuyState === 'function') pdpBuyState();
  }
  function rerender() { var p = product(); if (p && S && S.mode === 'cx') render(p); }

  /* ─── thao tác ─── */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cx-mode],[data-cx-zone],[data-cx-preset],[data-cx-font],[data-cx-tmethod],[data-cx-tspot],[data-cx-lmethod],[data-cx-lspot],[data-cx-g],[data-cx-logo-del],.cx-sec-h');
    if (!b || !S) return;
    if (b.matches('[data-cx-mode]')) { S.mode = b.getAttribute('data-cx-mode'); mount(); return; }
    if (b.matches('.cx-sec-h')) { var id = b.parentNode.getAttribute('data-cx-sec'); S.open = S.open === id ? '' : id; rerender(); return; }
    if (b.matches('[data-cx-zone]')) S.zones[b.getAttribute('data-cx-zone')] = b.getAttribute('data-cx-col');
    else if (b.matches('[data-cx-preset]')) {
      var pr = b.getAttribute('data-cx-preset').split('|');
      Object.keys(S.zones).forEach(function (z) { S.zones[z] = z === 'trim' || z === 'panel' || z === 'lace' || z === 'bar' ? pr[1] : pr[0]; });
    }
    else if (b.matches('[data-cx-font]')) S.text.font = b.getAttribute('data-cx-font');
    else if (b.matches('[data-cx-tmethod]')) S.text.method = b.getAttribute('data-cx-tmethod');
    else if (b.matches('[data-cx-tspot]')) S.text.spot = b.getAttribute('data-cx-tspot');
    else if (b.matches('[data-cx-lmethod]')) S.logo.method = b.getAttribute('data-cx-lmethod');
    else if (b.matches('[data-cx-lspot]')) S.logo.spot = b.getAttribute('data-cx-lspot');
    else if (b.matches('[data-cx-logo-del]')) { S.logo.url = ''; S.logo.name = ''; }
    else if (b.matches('[data-cx-g]')) {
      var p = product(), gid = b.getAttribute('data-cx-g'), cid = b.getAttribute('data-cx-c'), g = p.custom.groups.filter(function (x) { return x.id === gid; })[0];
      if (g.multi) { var a = S.groups[gid] || []; var i = a.indexOf(cid); if (i === -1) a.push(cid); else a.splice(i, 1); S.groups[gid] = a; }
      else S.groups[gid] = !g.required && S.groups[gid] === cid ? '' : cid;
    }
    rerender();
  });
  document.addEventListener('input', function (e) {
    var t = e.target; if (!S) return;
    if (t.matches('[data-cx-text]')) {
      S.text.value = t.value;
      var p = product(), pos = t.selectionStart;
      // vẽ lại xem trước + giá, giữ con trỏ trong ô
      render(p); var n = document.querySelector('[data-cx-text]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { /* bỏ qua */ } }
    } else if (t.matches('[data-cx-note]')) S.note = t.value;
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!S) return;
    if (t.matches('[data-cx-agree]')) { S.agree = t.checked; var er = document.querySelector('[data-cx-err]'); if (er) er.hidden = true; }
    if (t.matches('[data-cx-logo]') && t.files && t.files[0]) upload(t.files[0]);
  });
  function upload(file) {
    var msg = document.querySelector('[data-cx-logo-msg]'), say = function (s) { if (msg) msg.textContent = s; };
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return say(T('Logo cần là ảnh PNG, JPG hoặc WEBP.', 'The logo must be a PNG, JPG or WEBP image.'));
    if (file.size > 4 * 1024 * 1024) return say(T('Logo tối đa 4MB.', 'The logo must be 4MB or smaller.'));
    say(T('Đang tải logo lên…', 'Uploading…'));
    var r = new FileReader();
    r.onload = function () {
      DC.api('/custom/logo', { dataUrl: r.result }).then(function (j) { S.logo.url = j.url; S.logo.name = file.name.slice(0, 60); rerender(); },
        function (er) { say(er.message || T('Chưa tải được logo, vui lòng thử lại.', 'Upload failed, please try again.')); });
    };
    r.readAsDataURL(file);
  }

  /* ─── thêm vào giỏ (chế độ tự thiết kế) ─── */
  function addDesign(goCheckout) {
    var p = product(); if (!p) return;
    if (!S.agree) {
      var er = document.querySelector('[data-cx-err]');
      if (er) { er.hidden = false; er.textContent = T('Vui lòng tick ô đồng ý ở trên để đặt sản phẩm thiết kế riêng.', 'Please tick the box above to order a custom item.'); er.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      return;
    }
    var ref = DC.cx.put(p.id, spec()), k = p.id + '::' + detailSize + '::' + ref;
    cart[k] = Math.min(20, (cart[k] || 0) + (detailQty || 1));
    sync();
    DC.track('AddToCart', { content_ids: [p.id], content_type: 'product', value: (p.price + DC.cx.fee(p, spec())) * (detailQty || 1), currency: 'VND' });
    if (goCheckout) showCheckout(); else openCart();
  }
  ['dAdd', 'dBuy'].forEach(function (id) {
    var b = $(id); if (!b) return;
    b.addEventListener('click', function (e) { if (S && S.mode === 'cx') { e.stopImmediatePropagation(); e.preventDefault(); addDesign(id === 'dBuy'); } }, true);
  });

  // vẽ lại sau mỗi lần trang chi tiết vẽ (đổi sản phẩm / đổi ngôn ngữ / đổi size)
  if (typeof v3Render === 'function') {
    var _r = v3Render;
    v3Render = function () { var x = _r.apply(this, arguments); try { mount(); } catch (er) { console.error('[custom]', er); } return x; };
  }
  if (typeof pdpBuyState === 'function') {
    var _b = pdpBuyState;
    pdpBuyState = function () { var x = _b.apply(this, arguments); if (S && S.mode === 'cx') { var p = product(); if (p) pdpPrice(p, DC.cx.fee(p, spec())); } return x; };
  }
  if (window.MutationObserver) new MutationObserver(function () { rerender(); mount(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  document.addEventListener('DOMContentLoaded', function () { try { mount(); } catch (er) { /* bỏ qua */ } });
})();
