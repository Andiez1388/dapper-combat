/*
 * Xem trước 3D trọn bộ groin guard (Tự thiết kế — custom.js).
 * three.js (public/assets/vendor/three) chỉ tải khi khách mở "Tự thiết kế".
 *
 * Cách dựng — giống cách may thật: một "rập" da phẳng (PATTERN, rộng 600 × cao 380) được
 *   1) bơm phồng thành đệm (mép tròn, cup vồng, đường may lõm, viền cuộn mép trên dày hơn),
 *   2) quấn quanh hông theo hình elip (ôm qua 2 bên hông ra sau lưng),
 *   3) phần cup bẻ cong luồn xuống dưới háng ra sau.
 * Mặt trong là lớp lót da nhăn + túi cup; viền bọc mép là ống 3D chạy quanh rập.
 * Phía sau: đai thun bản to khép vòng giữa 2 mép thân, ốp hông, bản xỏ dây + 12 khoen + dây buộc chéo 3D,
 * nơ thắt 2 đầu dây thả (hoặc khóa dán / khóa cài). Dây thun đùi từ 2 góc sau của vạt hông xuống miếng nối có khoen dưới đáy.
 * Hình SVG phẳng (máy không có WebGL) chiếu cùng rập ra mặt trước.
 */
(function () {
  'use strict';
  var BASE = '/assets/vendor/three/';
  var PW = 600, PH = 380, X0 = 300;              // rập: x = 0..600 (300 = giữa trước), y = 0 (mép trên) .. 380 (đáy cup)
  var CELL = 2, GX = PW / CELL + 1, GY = PH / CELL + 1;
  var TS = 2, TB = 2.2;                            // px / đơn vị ảnh phủ: thân · đai sau
  var R = 150, EA = 196, EB = 128;                  // quấn: x → góc = (x - 300) / R, elip ngang EA × sâu EB
  var VB = 232, RB = 230;                           // cup bẻ cong xuống dưới từ y = VB, bán kính RB
  var BT = 6, BH = 94;                              // đai sau: từ y = 6, cao 94

  var P = {
    body: 'M2 6 Q300 0 598 6 L598 96 Q598 114 582 120 C552 132 528 156 512 180 C502 198 488 206 472 204 C454 202 446 140 412 144 ' +
      'C406 154 398 176 388 196 L322 318 C315 331 308 338 300 338 C292 338 285 331 278 318 L212 196 C202 176 194 154 188 144 ' +
      'C154 140 146 202 128 204 C112 206 98 198 88 180 C72 156 48 132 18 120 Q2 114 2 96 Z',
    band: 'M0 0 L600 0 L600 24 Q300 19 0 24 Z',
    bandLine: 'M2 24 Q300 19 598 24',
    cupLine: 'M222 230 Q264 196 300 182 Q336 196 378 230',
    seam: 'M300 20 L300 336',
    patch: 'M270 66 L330 66 Q336 66 336 72 L336 112 Q336 118 330 118 L270 118 Q264 118 264 112 L264 72 Q264 66 270 66 Z',
  };
  // ô chữ / logo trên rập: [tâm x, tâm y, rộng, cao, phần nền]
  var SPOTS = { cup: [300, 92, 62, 42, 'panel'], belt: [300, 12, 150, 11, 'belt'], left: [190, 110, 96, 46, 'left'], right: [410, 110, 96, 46, 'right'], tip: [300, 258, 66, 38, 'right'] };
  var BACK = { backL: 0.28, backR: 0.72 };          // ô trên đai sau (tỉ lệ dọc đai, nhìn từ sau: trái → phải)

  // kiểm tra WebGL đúng 1 lần (mỗi lần getContext tạo thêm 1 ngữ cảnh — trình duyệt chỉ cho ~16, quá thì mất hình 3D)
  var OK = null;
  function ok() {
    if (OK !== null) return OK;
    try {
      var c = document.createElement('canvas'), g = window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'));
      OK = !!g; var lose = g && g.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    } catch (e) { OK = false; }
    return OK;
  }
  var ss = function (a, b, v) { var t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  function luma(hex) { var n = parseInt(String(hex).slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); }
  function shade(hex, k) { var n = parseInt(String(hex).slice(1), 16), f = function (c) { return Math.max(0, Math.min(255, Math.round(c * k))); }; return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; }

  /* ─── rập → không gian 3D ─── */
  // trả về [X, Y, Z, nx, ny, nz] — điểm trên mặt quấn + pháp tuyến hướng ra ngoài
  function wrap(x, y) {
    var th = (x - X0) / R, sn = Math.sin(th), cs = Math.cos(th);
    var nx = EB * sn, nz = EA * cs, nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;
    var Y = -y, Zb = 0, ph = 0;
    if (y > VB) { ph = (y - VB) / RB; Y = -(VB + RB * Math.sin(ph)); Zb = -RB * (1 - Math.cos(ph)); }
    var c = Math.cos(ph);
    return [EA * sn, Y, EB * cs - EB + Zb, nx * c, -Math.sin(ph), nz * c];
  }
  function at(x, y, h) { var w = wrap(x, y); return [w[0] + w[3] * h, w[1] + w[4] * h, w[2] + w[5] * h]; }

  /* ─── độ phồng ─── */
  function mask(paths, stroke) {
    var c = document.createElement('canvas'); c.width = GX; c.height = GY;
    var x = c.getContext('2d'); x.setTransform(1 / CELL, 0, 0, 1 / CELL, 0.5, 0.5);
    x.fillStyle = x.strokeStyle = '#fff'; x.lineWidth = stroke || 1; x.lineCap = 'round';
    paths.forEach(function (d) { var p = new Path2D(d); if (stroke) x.stroke(p); else x.fill(p); });
    var px = x.getImageData(0, 0, GX, GY).data, out = new Float32Array(GX * GY);
    for (var i = 0; i < out.length; i++) out[i] = px[i * 4 + 3] / 255;
    return out;
  }
  function blur(a, r, passes) {
    var t = new Float32Array(a.length), b = Float32Array.from(a), n = 2 * r + 1, x, y, k, s;
    for (var p = 0; p < passes; p++) {
      for (y = 0; y < GY; y++) for (x = 0; x < GX; x++) { s = 0; for (k = -r; k <= r; k++) s += b[y * GX + Math.min(GX - 1, Math.max(0, x + k))]; t[y * GX + x] = s / n; }
      for (y = 0; y < GY; y++) for (x = 0; x < GX; x++) { s = 0; for (k = -r; k <= r; k++) s += t[Math.min(GY - 1, Math.max(0, y + k)) * GX + x]; b[y * GX + x] = s / n; }
    }
    return b;
  }
  function heights() {
    var body = blur(mask([P.body]), 5, 3), groove = blur(mask([P.seam, P.bandLine, P.cupLine], 3), 1, 2), patch = blur(mask([P.patch]), 1, 2);
    var h = new Float32Array(GX * GY);
    for (var j = 0; j < GY; j++) for (var i = 0; i < GX; i++) {
      var k = j * GX + i, x = i * CELL, y = j * CELL, hb = Math.pow(ss(0.4, 0.97, body[k]), 0.7);
      if (!hb) continue;
      var dome = Math.exp(-(Math.pow(x - X0, 2) / (2 * 46 * 46) + Math.pow(y - 252, 2) / (2 * 58 * 58)));
      var roll = 5 * (1 - ss(14, 26, y));           // viền cuộn mép trên dày hơn
      h[k] = hb * (11 + 22 * dome + roll - 3.6 * groove[k]) + 1.1 * patch[k];
    }
    return h;
  }
  function hAt(h, x, y) {
    var gx = Math.max(0, Math.min(GX - 1.001, x / CELL)), gy = Math.max(0, Math.min(GY - 1.001, y / CELL)), i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
    var a = h[j * GX + i], b = h[j * GX + i + 1], c = h[(j + 1) * GX + i], d = h[(j + 1) * GX + i + 1];
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }
  function outline(d, step) {
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'), pe = document.createElementNS(ns, 'path');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    pe.setAttribute('d', d); svg.appendChild(pe); document.body.appendChild(svg);
    var len = pe.getTotalLength(), out = [];
    for (var s = 0; s < len; s += step) { var p = pe.getPointAtLength(s); out.push([p.x, p.y]); }
    document.body.removeChild(svg);
    return out;
  }

  /* ─── vân & hoạ tiết ─── */
  var CACHE = {};
  function noise(name, fn) { if (!CACHE[name]) { var c = document.createElement('canvas'); fn(c); CACHE[name] = c; } return CACHE[name]; }
  function grain() {
    return noise('grain', function (c) {
      c.width = c.height = 256;
      var x = c.getContext('2d'), d = x.createImageData(256, 256);
      for (var i = 0; i < d.data.length; i += 4) { var v = 128 + (Math.random() - 0.5) * 90; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      x.putImageData(d, 0, 0); x.fillStyle = 'rgba(0,0,0,.18)';
      for (i = 0; i < 1400; i++) { x.beginPath(); x.arc(Math.random() * 256, Math.random() * 256, Math.random() * 1.6 + 0.4, 0, 7); x.fill(); }
    });
  }
  function ribs() {
    return noise('ribs', function (c) {
      c.width = 64; c.height = 64; var x = c.getContext('2d');
      x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, 64, 64);
      for (var i = 0; i < 64; i += 4) { x.fillStyle = '#ffffff'; x.fillRect(i, 0, 2, 64); x.fillStyle = '#a9a9a9'; x.fillRect(i + 2, 0, 1, 64); }
      x.fillStyle = 'rgba(0,0,0,.08)'; for (i = 0; i < 64; i += 2) x.fillRect(0, i, 64, 1);
    });
  }
  function twist() {
    return noise('twist', function (c) {
      c.width = 32; c.height = 32; var x = c.getContext('2d');
      x.fillStyle = '#f2f2f2'; x.fillRect(0, 0, 32, 32); x.strokeStyle = '#b9b9b9'; x.lineWidth = 3;
      for (var i = -32; i < 64; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 16, 32); x.stroke(); }
    });
  }
  // nếp nhăn da lót (cố định, vẽ 1 lần)
  var WRINKLES = null;
  function wrinkles() {
    if (WRINKLES) return WRINKLES;
    var out = [], seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var i = 0; i < 260; i++) {
      var x = rnd() * PW, y = 30 + rnd() * 330, len = 18 + rnd() * 60, pts = [[x, y]];
      for (var k = 1; k < 6; k++) { x += len / 5; y += (rnd() - 0.5) * 7; pts.push([x, y]); }
      out.push({ pts: pts, light: rnd() > 0.5, w: 0.6 + rnd() * 1.2 });
    }
    WRINKLES = out; return out;
  }
  var IMG = {};
  function img(url, done) {
    if (IMG[url]) return IMG[url].complete && IMG[url].naturalWidth ? IMG[url] : null;
    var im = new Image(); im.onload = done; im.src = url; IMG[url] = im; return null;
  }
  function drawText(x, tx, box, bg) {
    var fs = box[3] * 0.82; x.font = '700 ' + fs + 'px ' + tx.font;
    var mw = x.measureText(tx.value).width; if (mw > box[2]) { fs *= box[2] / mw; x.font = '700 ' + fs + 'px ' + tx.font; }
    x.save(); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = luma(bg) > 150 ? '#141414' : '#ffffff';
    if (tx.method === 'embroid') { x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 1.6; x.shadowOffsetY = 0.7; x.strokeStyle = luma(bg) > 150 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)'; x.lineWidth = 0.6; x.strokeText(tx.value, box[0], box[1]); }
    x.fillText(tx.value, box[0], box[1]); x.restore();
  }
  function drawLogo(x, lg, box, redraw) {
    var im = img(lg.url, redraw); if (!im) return;
    var k = Math.min(box[2] / im.naturalWidth, box[3] / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
    x.save(); if (lg.method === 'embroid') { x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 2; x.shadowOffsetY = 0.8; }
    x.drawImage(im, box[0] - w / 2, box[1] - h / 2, w, h); x.restore();
  }
  function leatherGrain(x, s, w, h) {
    x.save(); x.globalCompositeOperation = 'soft-light'; x.globalAlpha = s.material === 'cow' ? 0.32 : s.material === 'micro' ? 0.12 : 0.2;
    x.fillStyle = x.createPattern(grain(), 'repeat'); x.scale(0.6, 0.6); x.fillRect(0, 0, w / 0.6, h / 0.6); x.restore();
  }

  /* ─── ảnh phủ thân (mặt ngoài) ─── */
  function paintFront(c, s, redraw) {
    var x = c.getContext('2d'), col = s.col;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.setTransform(TS, 0, 0, TS, 0, 0);
    var body = new Path2D(P.body), patch = new Path2D(P.patch);
    x.save(); x.clip(body);
    x.fillStyle = col.left; x.fillRect(0, 0, X0, PH); x.fillStyle = col.right; x.fillRect(X0, 0, X0, PH);
    x.fillStyle = col.belt; x.fill(new Path2D(P.band));
    leatherGrain(x, s, PW, PH);
    // bóng nếp gấp nhẹ ở đường cup
    x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 3; x.stroke(new Path2D(P.cupLine));
    x.fillStyle = col.panel; x.fill(patch); x.strokeStyle = col.trim; x.lineWidth = 2.2; x.stroke(patch);
    x.strokeStyle = shade(col.belt, 0.75); x.lineWidth = 1.6; x.stroke(new Path2D(P.bandLine));
    // chỉ may
    x.strokeStyle = col.thread; x.lineWidth = 1.05; x.setLineDash([3, 2.3]); x.lineCap = 'round';
    x.save(); x.translate(X0, 172); x.scale(0.975, 0.958); x.translate(-X0, -172); x.stroke(body); x.restore();
    x.save(); x.translate(0, 4.5); x.stroke(new Path2D(P.bandLine)); x.restore();
    x.beginPath(); x.moveTo(296.5, 30); x.lineTo(296.5, 332); x.moveTo(303.5, 30); x.lineTo(303.5, 332); x.stroke();
    x.save(); x.translate(X0, 92); x.scale(0.86, 0.8); x.translate(-X0, -92); x.stroke(patch); x.restore();
    x.setLineDash([]);
    if (s.logo && SPOTS[s.logo.spot]) drawLogo(x, s.logo, SPOTS[s.logo.spot], redraw);
    if (s.text && SPOTS[s.text.spot]) { var sp = SPOTS[s.text.spot]; drawText(x, s.text, sp, col[sp[4] === 'right' && sp[0] < X0 ? 'left' : sp[4]]); }
    x.restore();
  }
  /* ─── lớp lót trong: da nhăn + túi cup ─── */
  function paintLining(c, s) {
    var x = c.getContext('2d'), col = s.col, k = c.width / PW, lt = luma(col.lining) > 140;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.setTransform(k, 0, 0, k, 0, 0);
    var body = new Path2D(P.body);
    x.save(); x.clip(body);
    x.fillStyle = col.lining; x.fillRect(0, 0, PW, PH);
    leatherGrain(x, { material: 'micro' }, PW, PH);
    wrinkles().forEach(function (w) {
      x.strokeStyle = w.light ? (lt ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.10)') : (lt ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.45)');
      x.lineWidth = w.w; x.beginPath(); x.moveTo(w.pts[0][0], w.pts[0][1]);
      for (var i = 1; i < w.pts.length; i++) x.lineTo(w.pts[i][0], w.pts[i][1]); x.stroke();
    });
    // túi cup: miếng lót tam giác tối màu ở lòng cup
    var g = x.createRadialGradient(X0, 268, 8, X0, 268, 84); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, PW, PH);
    var tri = new Path2D('M260 230 Q300 216 340 230 Q330 274 306 310 Q300 318 294 310 Q270 274 260 230 Z');
    x.fillStyle = shade(col.lining, 0.45); x.fill(tri);
    x.strokeStyle = lt ? 'rgba(0,0,0,.3)' : 'rgba(255,255,255,.18)'; x.lineWidth = 1.4; x.stroke(tri);
    x.strokeStyle = 'rgba(0,0,0,.35)'; x.setLineDash([2.4, 2]); x.lineWidth = 0.9; x.beginPath(); x.moveTo(X0, 30); x.lineTo(X0, 222); x.stroke(); x.setLineDash([]);
    x.strokeStyle = col.trim; x.lineWidth = 8; x.stroke(body);
    x.restore();
  }
  /* ─── đai sau ─── */
  function eyeletPts(L) { var out = [], mid = L / 2; for (var r = 0; r < 6; r++) { var y = 11 + r * (BH - 22) / 5; out.push([mid - 18, y], [mid + 18, y]); } return out; }
  function paintBelt(c, s, L, redraw) {
    var x = c.getContext('2d'), col = s.col, mid = L / 2;
    x.setTransform(TB, 0, 0, TB, 0, 0);
    x.fillStyle = col.elastic; x.fillRect(0, 0, L, BH);
    var lt = luma(col.elastic) > 140;
    for (var t = 0; t < L; t += 2.6) { x.fillStyle = lt ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.07)'; x.fillRect(t, 0, 1, BH); }
    x.fillStyle = lt ? 'rgba(0,0,0,.12)' : 'rgba(0,0,0,.35)'; x.fillRect(0, 0, L, 3.2); x.fillRect(0, BH - 3.2, L, 3.2);
    x.strokeStyle = col.thread; x.lineWidth = 1; x.setLineDash([3, 2.2]);
    [[0, 16], [L - 16, L]].forEach(function (r) {
      x.fillStyle = col.side; x.fillRect(r[0], 0, r[1] - r[0], BH);
      x.save(); x.beginPath(); x.rect(r[0], 0, r[1] - r[0], BH); x.clip(); leatherGrain(x, s, L, BH); x.restore();
      var e = r[0] === 0 ? r[1] - 3 : r[0] + 3; x.beginPath(); x.moveTo(e, 2); x.lineTo(e, BH - 2); x.stroke();
    });
    var strip = function (a, b) {
      x.fillStyle = col.lacepanel; x.fillRect(a, 0, b - a, BH);
      x.save(); x.beginPath(); x.rect(a, 0, b - a, BH); x.clip(); leatherGrain(x, s, L, BH); x.restore();
      x.strokeRect(a + 2.4, 2.4, b - a - 4.8, BH - 4.8);
    };
    if (s.closure === 'velcro') {
      strip(mid - 42, mid + 42);
      x.save(); x.fillStyle = 'rgba(0,0,0,.18)'; for (var i = mid - 34; i < mid + 34; i += 2.2) for (var j = 10; j < BH - 10; j += 2.2) x.fillRect(i, j, 1, 1); x.restore();
    } else if (s.closure === 'buckle') {
      strip(mid - 34, mid + 34);
    } else {
      strip(mid - 31, mid - 6); strip(mid + 6, mid + 31);
      x.fillStyle = 'rgba(0,0,0,.65)'; eyeletPts(L).forEach(function (e) { x.beginPath(); x.arc(e[0], e[1], 2.5, 0, 7); x.fill(); });
    }
    x.setLineDash([]);
    ['backL', 'backR'].forEach(function (k) {
      var box = [L * BACK[k], BH / 2, Math.min(120, L * 0.24), 38];
      if (s.logo && s.logo.spot === k) drawLogo(x, s.logo, box, redraw);
      if (s.text && s.text.spot === k) drawText(x, s.text, box, col.elastic);
    });
  }

  /* ─── hình phẳng (SVG) chiếu mặt trước — dùng khi máy không có WebGL ─── */
  var FLAT = null;
  function flatGeo() {
    if (FLAT) return FLAT;
    var K = 0.98, proj = function (p) { var w = wrap(p[0], p[1]); return [(210 + w[0] * K).toFixed(1), (40 - w[1] * K).toFixed(1)]; };
    var poly = function (d) { return outline(d, 3).map(function (p) { return proj(p).join(','); }).join(' '); };
    FLAT = { body: poly(P.body), patch: poly(P.patch), band: poly('M2 6 Q300 0 598 6 L598 24 Q300 19 2 24 Z'), seam: [proj([300, 20]), proj([300, 334])], spots: {} };
    Object.keys(SPOTS).forEach(function (k) {
      var s = SPOTS[k], c = proj([s[0], s[1]]), sc = Math.cos((s[0] - X0) / R);
      FLAT.spots[k] = [+c[0], +c[1], s[2] * sc * K, s[3] * K, s[4] === 'right' && s[0] < X0 ? 'left' : s[4]];
    });
    return FLAT;
  }
  function svg(col) {
    var f = flatGeo();
    return '<clipPath id="cxBodyClip"><polygon points="' + f.body + '"/></clipPath><g clip-path="url(#cxBodyClip)">' +
      '<rect width="210" height="400" fill="' + col('left') + '"/><rect x="210" width="210" height="400" fill="' + col('right') + '"/>' +
      '<polygon points="' + f.band + '" fill="' + col('belt') + '"/><rect width="420" height="400" fill="url(#cxSh)"/><ellipse cx="210" cy="300" rx="70" ry="64" fill="url(#cxHi)"/>' +
      '<line x1="' + f.seam[0][0] + '" y1="' + f.seam[0][1] + '" x2="' + f.seam[1][0] + '" y2="' + f.seam[1][1] + '" stroke="rgba(0,0,0,.3)" stroke-width="1.6"/></g>' +
      '<polygon points="' + f.body + '" fill="none" stroke="' + col('trim') + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<polygon points="' + f.patch + '" fill="' + col('panel') + '" stroke="' + col('trim') + '" stroke-width="2.4"/>';
  }

  /* ─── mô hình: groin guard ─── */
  function groinModel(ctx) {
    var THREE = ctx.THREE, V3 = ctx.V3, root = ctx.root, leather = ctx.leather, ctex = ctx.ctex, bump = ctx.bump;
    root.position.set(0, 172, EB - 6);
    var A = function (x, y, h) { var p = at(x, y, h); return new V3(p[0], p[1], p[2]); };

    // thân: lưới theo rập → quấn + phồng
    var h = heights(), geo = new THREE.PlaneGeometry(PW, PH, GX - 1, GY - 1), pos = geo.attributes.position;
    for (var j = 0; j < GY; j++) for (var i = 0; i < GX; i++) { var k = j * GX + i, p = at(i * CELL, j * CELL, h[k]); pos.setXYZ(k, p[0], p[1], p[2]); }
    geo.computeVertexNormals();
    var fc = document.createElement('canvas'); fc.width = PW * TS; fc.height = PH * TS;
    var lc = document.createElement('canvas'); lc.width = PW * 1.4; lc.height = PH * 1.4;
    var fTex = ctex(fc), lTex = ctex(lc);
    var frontMat = leather({ map: fTex, side: THREE.FrontSide, alphaTest: 0.5 });
    var liningMat = new THREE.MeshPhysicalMaterial({ map: lTex, side: THREE.BackSide, alphaTest: 0.5, roughness: 0.55, clearcoat: 0.2 });
    // PlaneGeometry quay mặt +z; sau khi quấn, kiểm tra mặt trước có hướng ra ngoài không
    var nm = geo.attributes.normal, mid = Math.round(GY * 0.3) * GX + Math.round(GX / 2);
    if (nm.getZ(mid) < 0) { frontMat.side = THREE.BackSide; liningMat.side = THREE.FrontSide; }
    root.add(new THREE.Mesh(geo, frontMat), new THREE.Mesh(geo, liningMat));

    // viền bọc mép
    var edge = outline(P.body, 2.5).map(function (p) { return A(p[0], p[1], hAt(h, p[0], Math.max(p[1], 9)) * 0.55 + 0.6); });
    var trimMat = leather({ color: 0xffffff });
    root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge, true, 'centripetal'), 900, 3.5, 10, true), trimMat));

    // đai sau: khép vòng elip giữa 2 mép sau của thân (nhìn từ sau: trái → phải)
    var th0 = (PW - X0) / R - 0.05, ea = EA + 4, eb = EB + 4, bp = [];
    for (var q = 0; q <= 64; q++) { var t = th0 + (q / 64) * (2 * Math.PI - 2 * th0); bp.push(new V3(ea * Math.sin(t), 0, eb * Math.cos(t) - EB)); }
    var belt = new THREE.CatmullRomCurve3(bp, false, 'centripetal'), L = belt.getLength();
    var outward = function (p) { return new V3(p.x / (ea * ea), 0, (p.z + EB) / (eb * eb)).normalize(); };
    function strip(fn, nu, nv) {
      var g = new THREE.BufferGeometry(), P3 = [], UV = [], I = [], a, b, c, d, ii, jj;
      for (jj = 0; jj <= nv; jj++) for (ii = 0; ii <= nu; ii++) { var v = fn(ii / nu, jj / nv); P3.push(v.x, v.y, v.z); UV.push(ii / nu, 1 - jj / nv); }
      for (jj = 0; jj < nv; jj++) for (ii = 0; ii < nu; ii++) { a = jj * (nu + 1) + ii; b = a + 1; c = a + nu + 1; d = c + 1; I.push(a, c, b, b, c, d); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals();
      return g;
    }
    var beltGeo = strip(function (u, v) { var p = belt.getPointAt(u); return new V3(p.x, -(BT + v * BH), p.z); }, 200, 6);
    var bc = document.createElement('canvas'); bc.width = Math.round(L * TB); bc.height = Math.round(BH * TB);
    var bTex = ctex(bc);
    var beltOut = new THREE.MeshPhysicalMaterial({ map: bTex, roughness: 0.8, sheen: 0.4, sheenRoughness: 0.8, bumpMap: bump, bumpScale: 0.15 });
    var beltIn = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.92 });
    var bn = beltGeo.attributes.normal, bmi = 3 * 201 + 100, out0 = new V3(bn.getX(bmi), 0, bn.getZ(bmi)).dot(outward(belt.getPointAt(0.5))) > 0;
    beltOut.side = out0 ? THREE.FrontSide : THREE.BackSide; beltIn.side = out0 ? THREE.BackSide : THREE.FrontSide;
    root.add(new THREE.Mesh(beltGeo, beltOut), new THREE.Mesh(beltGeo, beltIn));
    function onBelt(s, y, off) { var p = belt.getPointAt(Math.max(0, Math.min(1, s / L))); return new V3(p.x, -(BT + y), p.z).add(outward(p).multiplyScalar(off || 0)); }

    // dây thun đùi: từ góc sau của vạt hông → miếng nối dưới đáy
    var ribTex = new THREE.CanvasTexture(ribs()); ribTex.wrapS = ribTex.wrapT = THREE.RepeatWrapping; ribTex.repeat.set(1, 30);
    var strapMat = new THREE.MeshStandardMaterial({ map: ribTex, roughness: 0.85, side: THREE.DoubleSide });
    var tabP = A(X0, 330, -5), axis = function (p) { return new V3(p.x, 0, p.z + EB).normalize(); };
    [1, -1].forEach(function (sx) {
      var a = A(sx > 0 ? 576 : 24, 116, -4);
      var m1 = a.clone().lerp(tabP, 0.33).add(new V3(sx * 8, -26, -10)), m2 = a.clone().lerp(tabP, 0.7).add(new V3(sx * 4, -22, -6));
      var c = new THREE.CatmullRomCurve3([a, m1, m2, tabP.clone().add(new V3(sx * 6, 2, 0))], false, 'centripetal');
      root.add(new THREE.Mesh(strip(function (u, v) {
        var p = c.getPointAt(u), tg = c.getTangentAt(u), side = new V3().crossVectors(tg, axis(p)).normalize();
        return p.clone().add(side.multiplyScalar((v - 0.5) * 15));
      }, 90, 2), strapMat));
    });
    var tabMat = leather({ color: 0xffffff }), metalMat = new THREE.MeshStandardMaterial({ metalness: 0.95, roughness: 0.28 });
    var tab = new THREE.Mesh(new THREE.BoxGeometry(24, 13, 4), tabMat); tab.position.copy(tabP); tab.lookAt(tabP.clone().add(new V3(0, -0.7, -1))); root.add(tab);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(6, 1.4, 10, 24), metalMat); ring.position.copy(tabP).add(new V3(0, -8, -6)); ring.lookAt(ring.position.clone().add(new V3(0, -0.4, -1))); root.add(ring);

    // khoen + dây buộc / khóa
    var laceTex = new THREE.CanvasTexture(twist()); laceTex.wrapS = laceTex.wrapT = THREE.RepeatWrapping; laceTex.repeat.set(60, 1);
    var laceMat = new THREE.MeshStandardMaterial({ map: laceTex, roughness: 0.75 });
    var hw = new THREE.Group(), hwKind = ''; root.add(hw);
    function tube(pts, r, seg) { return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), seg || 80, r, 8, false), laceMat); }
    function face(m, p) { m.position.copy(p); m.lookAt(p.clone().add(outward(p))); return m; }
    function hardware(kind) {
      if (kind === hwKind) return; hwKind = kind;
      while (hw.children.length) hw.children.pop().geometry.dispose();
      var md = L / 2;
      if (kind === 'velcro') return;
      if (kind === 'buckle') {
        [BH * 0.3, BH * 0.7].forEach(function (y) {
          var p = onBelt(md, y, 2.5), r = face(new THREE.Mesh(new THREE.TorusGeometry(10, 1.6, 10, 4), metalMat), p);
          r.rotateZ(Math.PI / 4); r.scale.set(1.3, 0.75, 1); hw.add(r);
          hw.add(face(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 15, 8), metalMat), p));
        });
        return;
      }
      var E = eyeletPts(L), rows = E.length / 2;
      E.forEach(function (e) { hw.add(face(new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.95, 8, 18), metalMat), onBelt(e[0], e[1], 0.8))); });
      var eye = function (side, row, off) { var e = E[row * 2 + (side === 'L' ? 0 : 1)]; return onBelt(e[0], e[1], off); };
      hw.add(tube([eye('L', 0, 1.2), onBelt(md, E[0][1], 3), eye('R', 0, 1.2)], 1.25, 20));
      [['L', 3.6], ['R', 2.4]].forEach(function (cfg) {
        var pts = [], side = cfg[0], other;
        for (var r = 0; r < rows - 1; r++) {
          other = side === 'L' ? 'R' : 'L';
          var a = eye(side, r, 1.2), b = eye(other, r + 1, 1.2);
          pts.push(a, a.clone().lerp(b, 0.5).add(outward(a).multiplyScalar(cfg[1])));
          side = other;
        }
        pts.push(eye(side, rows - 1, 1.2), onBelt(md + (side === 'L' ? -5 : 5), BH + 2, 4), onBelt(md, BH + 6, 5));
        hw.add(tube(pts, 1.25, 180));
      });
      var knot = onBelt(md, BH + 6, 5);
      hw.add(face(new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), laceMat), knot));
      [-1, 1].forEach(function (d) {
        hw.add(tube([knot, onBelt(md + d * 9, BH - 4, 8), onBelt(md + d * 20, BH + 2, 7), onBelt(md + d * 12, BH + 12, 6), knot], 1.2, 40));
        var e3 = onBelt(md + d * 7, BH + 66, 9);
        hw.add(tube([knot, onBelt(md + d * 4, BH + 24, 7), onBelt(md + d * 10, BH + 46, 8), e3], 1.2, 50));
        var ag = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 7, 8), metalMat); ag.position.copy(e3).add(new V3(0, -3, 0)); hw.add(ag);
      });
    }

    return {
      fit: [222, 232],
      views: { front: [0.2, 0.08], side: [1.5, 0.08], back: [Math.PI + 0.3, 0.16], top: [Math.PI + 0.25, 0.72], under: [Math.PI + 0.35, -0.55] },
      reset: function () { hwKind = ''; },
      update: function (s, redraw) {
        paintFront(fc, s, redraw); fTex.needsUpdate = true;
        paintLining(lc, s); lTex.needsUpdate = true;
        paintBelt(bc, s, L, redraw); bTex.needsUpdate = true;
        hardware(s.closure || 'lace');
        trimMat.color.set(s.col.trim); tabMat.color.set(s.col.tab); strapMat.color.set(s.col.strap); laceMat.color.set(s.col.lace); metalMat.color.set(s.col.eyelet);
        beltIn.color.set(shade(s.col.elastic, 0.7));
        var gloss = s.finish !== 'matte';
        [frontMat, trimMat, tabMat].forEach(function (m) { m.roughness = gloss ? 0.34 : 0.74; m.clearcoat = gloss ? 0.6 : 0.05; m.clearcoatRoughness = gloss ? 0.25 : 0.6; m.bumpScale = s.material === 'cow' ? 1.1 : s.material === 'micro' ? 0.25 : 0.5; });
      },
    };
  }

  /* ─── mô hình: dây dán găng (Lace N Loop) ───
   * Đơn vị ~ mm. Găng buộc dây minh hoạ (dựng đứng: cổ găng dưới, nắm tay trên), dây dán quấn ~1,35 vòng quanh cổ găng:
   * đầu trong = đoạn loop (có khoen giữ đầu dây buộc, mặt trong lót êm) → đoạn thun → đoạn hook (mặt ngoài in logo) → tab kéo ở ngoài cùng.
   * Chế độ "trải phẳng": 2 dải dây — mặt ngoài (trên) và mặt trong (dưới). */
  var SEC = [['loop', 0, 0.47], ['elastic', 0.47, 0.6], ['hook', 0.6, 0.93], ['grip', 0.93, 1]];
  var STRAP_SPOTS = { hook: 0.765, loop: 0.24, grip: 0.965 };
  var CORNER = 0.22;   // bo góc 2 đầu dây (tỉ lệ bề rộng)
  function strapCanvas(c, s, L, W, inner, redraw) {
    var k = 4, x = c.getContext('2d'), col = s.col, r = W * CORNER;
    if (c.width !== Math.round(L * k) || c.height !== Math.round(W * k)) { c.width = Math.round(L * k); c.height = Math.round(W * k); }
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.setTransform(k, 0, 0, k, 0, 0);
    var shape = new Path2D(); shape.moveTo(r, 0); shape.lineTo(L - r, 0); shape.quadraticCurveTo(L, 0, L, r); shape.lineTo(L, W - r); shape.quadraticCurveTo(L, W, L - r, W);
    shape.lineTo(r, W); shape.quadraticCurveTo(0, W, 0, W - r); shape.lineTo(0, r); shape.quadraticCurveTo(0, 0, r, 0); shape.closePath();
    x.fillStyle = col.edge; x.fillRect(0, 0, L, W);
    x.save(); x.clip(shape);
    SEC.forEach(function (sc) {
      var a = sc[1] * L, b = sc[2] * L, id = sc[0], base = inner ? (id === 'hook' ? shade(col.hook, 0.82) : id === 'grip' ? col.grip : col.cover) : col[id];
      x.fillStyle = base; x.fillRect(a, 0, b - a, W);
      var lt = luma(base) > 140, i;
      if (!inner && id === 'loop') { x.fillStyle = lt ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.07)'; for (i = 0; i < 1400; i++) x.fillRect(a + ((i * 37.3) % (b - a)), (i * 13.7) % W, 0.5, 0.5); }
      if (inner && id === 'hook') { x.fillStyle = lt ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.16)'; for (var hx = a + 1; hx < b; hx += 1.5) for (var hy = 1; hy < W; hy += 1.5) x.fillRect(hx, hy, 0.6, 0.6); }
      if (id === 'elastic') { x.strokeStyle = lt ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.12)'; x.lineWidth = 0.5; for (var e = a; e < b; e += 1.3) { x.beginPath(); x.moveTo(e, 0); x.lineTo(e, W); x.stroke(); } }
      if (inner && id !== 'hook' && id !== 'grip') { x.fillStyle = 'rgba(0,0,0,.07)'; for (i = 0; i < 600; i++) x.fillRect(a + ((i * 29.1) % (b - a)), (i * 7.3) % W, 1.1, 1.1); }
      if (id === 'grip') { x.strokeStyle = lt ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.08)'; x.lineWidth = 0.4; for (var g = 0; g < W; g += 1.1) { x.beginPath(); x.moveTo(a, g); x.lineTo(b, g); x.stroke(); } }
    });
    // chỉ may dọc 2 mép + ô chữ X ở mỗi chỗ nối đoạn
    x.strokeStyle = s.reflect ? '#e8f0f3' : col.thread; x.lineWidth = 0.55; x.setLineDash([2, 1.4]);
    x.beginPath(); x.moveTo(r * 0.5, 3.4); x.lineTo(L - r * 0.5, 3.4); x.moveTo(r * 0.5, W - 3.4); x.lineTo(L - r * 0.5, W - 3.4); x.stroke();
    var xbox = function (a0, w0) { var y0 = 4.6, h0 = W - 9.2; x.strokeRect(a0, y0, w0, h0); x.beginPath(); x.moveTo(a0, y0); x.lineTo(a0 + w0, y0 + h0); x.moveTo(a0 + w0, y0); x.lineTo(a0, y0 + h0); x.stroke(); };
    xbox(SEC[1][1] * L - 4, 8); xbox(SEC[2][1] * L - 4, 8);
    // đầu dán: miếng vuông gắn trên mặt ngoài cuối đoạn hook (khâu ô chữ X) — như hàng thật
    var pa = SEC[2][2] * L - W * 1.05;
    if (!inner) {
      x.setLineDash([]); x.fillStyle = luma(col.hook) > 140 ? shade(col.hook, 0.9) : shade(col.hook, 1.35); x.fillRect(pa, 2.2, W * 1.05, W - 4.4);
      x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(pa, 2.2, 0.8, W - 4.4);
      x.setLineDash([2, 1.4]); xbox(pa + 3, W * 1.05 - 6);
    } else xbox(SEC[3][1] * L - 4, 8);
    x.setLineDash([]);
    if (inner) { x.fillStyle = 'rgba(0,0,0,.8)'; x.beginPath(); x.arc(14, W / 2, 3.3, 0, 7); x.fill(); }
    else ['hook', 'loop', 'grip'].forEach(function (sp) {
      var cxp = sp === 'hook' ? (SEC[2][1] * L + pa) / 2 : STRAP_SPOTS[sp] * L;
      var secW = sp === 'grip' ? (SEC[3][2] - SEC[3][1]) * L * 0.8 : sp === 'hook' ? (pa - SEC[2][1] * L) * 0.86 : (SEC[0][2] - SEC[0][1]) * L * 0.6;
      var box = [cxp, W / 2, secW, W * 0.56];
      if (s.logo && s.logo.spot === sp) drawLogo(x, s.logo, box, redraw);
      if (s.text && s.text.spot === sp) drawText(x, s.text, box, col[sp]);
    });
    x.restore();
  }
  /* găng boxing điêu khắc bằng hàm khoảng cách (SDF) — dựng đứng: đáy cổ găng y = 0, mu bàn tay +z, lòng bàn tay −z, ngón cái −x (găng phải).
   *  · thân nắm tay: siêu-elip (mu tay phẳng, mép đệm tròn), rộng dần lên khớp ngón
   *  · cuộn ngón ở mặt lòng + hõm tay cầm bên dưới · ngón cái ôm hông, có rãnh tách với thân
   *  · cổ găng hơi loe xuống, mép đáy cuộn dày, miệng găng rỗng (thấy lót trong)
   *  · viền ống (piping) chạy quanh mép găng + vòng nối cổ găng — tô màu tương phản như găng thật */
  var GRX = 57, GRZ = 50, GCH = 112;
  function gTaper(y) { return 1 + 0.07 * (1 - Math.min(Math.max(y, 0), GCH) / GCH); }
  var smin = function (a, b, k) { var h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  // mặt cắt ngang thân găng theo độ cao: cổ găng elip → loe dần thành nắm tay vuông-tròn
  var TOP = 286, YC = 206;
  function gSec(y) {
    if (y <= GCH) { var f = gTaper(y); return [GRX * f, GRZ * f, 0, 2]; }
    var u = ss(GCH, 200, y), v = ss(GCH, 194, y);
    return [GRX + 20 * u, GRZ + 16 * v, 4 * u, 2 + 0.45 * ss(GCH, 190, y)];
  }
  function gParts(x, y, z) {
    var S = gSec(Math.max(0, Math.min(y, YC))), q = Math.pow(Math.pow(Math.abs(x / S[0]), S[3]) + Math.pow(Math.abs((z - S[2]) / S[1]), S[3]), 1 / S[3]);
    var e = (q - 1) * Math.min(S[0], S[1]);
    var body = Math.max(e, -y, y - YC);
    // đỉnh nắm tay: siêu-elip khối, cùng mặt cắt với thân ở YC → vòm tròn liền mạch
    var Rx = GRX + 20, Rz = GRZ + 16, Hh = TOP - YC, pp = 2.45;
    var dome = (Math.pow(Math.pow(Math.abs(x / Rx), pp) + Math.pow(Math.max(0, y - YC) / Hh, 2.2) + Math.pow(Math.abs((z - 4) / Rz), pp), 1 / pp) - 1) * Math.min(Rx, Hh, Rz);
    body = Math.min(body, Math.max(dome, YC - y));
    body = smin(body, Math.hypot(e + 1.5, y - 6) - 6.5, 3);                           // mép đáy cổ găng cuộn
    var f = gTaper(y), ie = (Math.sqrt(x * x / ((GRX * f - 7) * (GRX * f - 7)) + z * z / ((GRZ * f - 7) * (GRZ * f - 7))) - 1) * Math.min(GRX * f - 7, GRZ * f - 7);
    body = Math.max(body, -Math.max(ie, y - 64));                                        // miệng găng rỗng
    var roll = Math.hypot(Math.max(Math.abs(x) - 50, 0), y - 196, z + 54) - 15;         // cuộn ngón mặt lòng
    body = smin(body, roll, 24);
    var ax = -70, ay = 124, az = 6, dx = -6, dy = 100, dz = 22, px = x - ax, py = y - ay, pz = z - az;   // ngón cái
    var t = Math.max(0, Math.min(1, (px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz)));
    var thumb = Math.hypot(px - dx * t, py - dy * t, pz - dz * t) - (21 + 4 * Math.sin(Math.PI * t) - 2 * t);
    var d = smin(body, thumb, 16);
    var pipe = Math.exp(-(z - 3) * (z - 3) / 4.5) * ss(GCH + 16, GCH + 36, y) * ss(3, 9, thumb);
    var ring = Math.exp(-(y - GCH - 6) * (y - GCH - 6) / 5);
    d -= 1.8 * pipe + 1.0 * ring;
    return { d: d, pipe: Math.max(ss(0.35, 0.6, pipe), ss(0.45, 0.7, ring)), lin: ie < 2.2 && y < 66 ? 1 : 0 };
  }
  function gloveSDF(x, y, z) { return gParts(x, y, z).d; }
  var GLOVE_GEO = null;
  function gloveGeometry(THREE, MarchingCubes) {
    if (GLOVE_GEO) return GLOVE_GEO;
    var N = 128, S = 186, C = [-14, 152, 0], mc = new MarchingCubes(N, new THREE.MeshBasicMaterial(), false, false, 200000);
    mc.isolation = 0;
    for (var zi = 0; zi < N; zi++) for (var yi = 0; yi < N; yi++) for (var xi = 0; xi < N; xi++) {
      mc.field[xi + yi * N + zi * N * N] = -gloveSDF(C[0] + S * (xi - N / 2) / (N / 2), C[1] + S * (yi - N / 2) / (N / 2), C[2] + S * (zi - N / 2) / (N / 2));
    }
    mc.update();
    var src = mc.geometry.attributes.position.array, n = mc.count, P3 = new Float32Array(n * 3), NR = new Float32Array(n * 3), UV = new Float32Array(n * 2), CL = new Float32Array(n * 3), WP = new Float32Array(n), WL = new Float32Array(n), h = 0.5;
    for (var i = 0; i < n; i++) {
      var x = C[0] + src[i * 3] * S, y = C[1] + src[i * 3 + 1] * S, z = C[2] + src[i * 3 + 2] * S, gx, gy, gz, gl, d;
      for (var it = 0; it < 3; it++) {   // nắn đỉnh về đúng mặt (Newton)
        d = gloveSDF(x, y, z);
        gx = gloveSDF(x + h, y, z) - gloveSDF(x - h, y, z); gy = gloveSDF(x, y + h, z) - gloveSDF(x, y - h, z); gz = gloveSDF(x, y, z + h) - gloveSDF(x, y, z - h);
        gl = Math.hypot(gx, gy, gz) || 1; x -= d * gx / gl; y -= d * gy / gl; z -= d * gz / gl;
      }
      gx = gloveSDF(x + h, y, z) - gloveSDF(x - h, y, z); gy = gloveSDF(x, y + h, z) - gloveSDF(x, y - h, z); gz = gloveSDF(x, y, z + h) - gloveSDF(x, y, z - h); gl = Math.hypot(gx, gy, gz) || 1;
      P3[i * 3] = x; P3[i * 3 + 1] = y; P3[i * 3 + 2] = z; NR[i * 3] = gx / gl; NR[i * 3 + 1] = gy / gl; NR[i * 3 + 2] = gz / gl;
      UV[i * 2] = Math.atan2(x, z) / (2 * Math.PI) + 0.5; UV[i * 2 + 1] = y / 330;
      var w = gParts(x, y, z); WP[i] = w.pipe; WL[i] = w.lin;
    }
    mc.geometry.dispose();
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P3, 3)); g.setAttribute('normal', new THREE.BufferAttribute(NR, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
    g.setAttribute('color', new THREE.BufferAttribute(CL, 3)); g.userData = { pipe: WP, lin: WL, key: '' };
    GLOVE_GEO = g; return g;
  }
  // tô màu găng: da · viền ống tương phản · lót trong tối
  function paintGlove(THREE, g, hex) {
    if (g.userData.key === hex) return; g.userData.key = hex;
    var base = new THREE.Color(hex), pipe = new THREE.Color(luma(hex) > 150 ? '#1e1e1e' : '#ecebe6'), lin = new THREE.Color('#141414'), c = new THREE.Color(), CL = g.attributes.color.array;
    for (var i = 0; i < g.userData.pipe.length; i++) {
      c.copy(base).lerp(pipe, g.userData.pipe[i]).lerp(lin, g.userData.lin[i]);
      CL[i * 3] = c.r; CL[i * 3 + 1] = c.g; CL[i * 3 + 2] = c.b;
    }
    g.attributes.color.needsUpdate = true;
  }
  // điểm trên mặt lòng găng (dò tia từ phía lòng tay, −z → +z); side = −1: găng trái (soi gương)
  function palmPoint(V3, x, y, side, off) {
    var X = x * side, z = -230, d;
    for (var i = 0; i < 240; i++) { d = gloveSDF(X, y, z); if (d < 0.05) break; z += Math.max(d * 0.9, 0.25); }
    var h = 0.5, n = new V3((gloveSDF(X + h, y, z) - gloveSDF(X - h, y, z)) * side, gloveSDF(X, y + h, z) - gloveSDF(X, y - h, z), gloveSDF(X, y, z + h) - gloveSDF(X, y, z - h)).normalize();
    return { p: new V3(x, y, z).add(n.clone().multiplyScalar(off || 0)), n: n };
  }

  /* dải dây có độ dày: mặt ngoài phồng nhẹ (đệm), mặt trong phẳng, viền bọc mép là ống chạy quanh chu vi.
   * frame(s) → { p: điểm giữa, n: pháp tuyến mặt ngoài, b: hướng bề rộng (lên trên ảnh phủ) }, s = 0..L */
  function ribbon(THREE, frame, L, W, T, mats, noEdge) {
    var NU = Math.max(140, Math.round(L / 1.4)), NV = 10, r = W * CORNER, V3 = THREE.Vector3;
    var half = function (sv) { var d = Math.min(sv, L - sv); return d < r ? W / 2 - r + Math.sqrt(Math.max(0, r * r - (r - d) * (r - d))) : W / 2; };
    var F = [], i, j;
    for (i = 0; i <= NU; i++) { var sv = L * i / NU; F.push([frame(sv), half(sv), sv]); }
    var face = function (sg) {
      var P3 = [], UV = [], I = [];
      F.forEach(function (f) {
        for (j = 0; j <= NV; j++) {
          var u = -1 + 2 * j / NV, off = f[1] * u, h = sg > 0 ? T / 2 * (1 + 0.45 * (1 - Math.pow(Math.abs(u), 4))) : -T / 2, fr = f[0];
          P3.push(fr.p.x + fr.b.x * off + fr.n.x * h, fr.p.y + fr.b.y * off + fr.n.y * h, fr.p.z + fr.b.z * off + fr.n.z * h); UV.push(f[2] / L, 0.5 + off / W);
        }
      });
      for (i = 0; i < NU; i++) for (j = 0; j < NV; j++) { var a = i * (NV + 1) + j, b = a + 1, c = a + NV + 1, d = c + 1; I.push(a, c, b, b, c, d); }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
    };
    var grp = new THREE.Group();
    grp.add(new THREE.Mesh(face(1), mats.outer), new THREE.Mesh(face(-1), mats.inner));
    if (!noEdge) {
      var ring = [];
      F.forEach(function (f) { ring.push(f[0].p.clone().add(f[0].b.clone().multiplyScalar(f[1]))); });
      for (i = F.length - 1; i >= 0; i--) ring.push(F[i][0].p.clone().add(F[i][0].b.clone().multiplyScalar(-F[i][1])));
      grp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true, 'centripetal'), ring.length * 2, T * 0.62, 8, true), mats.edge));
    }
    return grp;
  }
  /* quấn xoắn ốc quanh 1 vành (cổ găng / vòng tròn): mỗi vòng dày thêm 1 lớp; tab kéo cuối dây bật thẳng ra ngoài như hàng thật.
   * ptAt(th, off) · nAt(th): điểm & pháp tuyến vành ở góc th; faceS đặt ở góc faceTh (quay ra trước) */
  function wrapFrame(V3, ptAt, nAt, L, T, faceS, faceTh, tabFrom) {
    var tab, start = 0;
    for (var pass = 0; pass < 2; pass++) {
      tab = []; var acc = 0, prev = null;
      for (var th = start; acc < L + 4; th += 0.004) {
        var off = 1 + T * 1.15 * (th - start) / (2 * Math.PI) + T / 2, p = ptAt(th, off);
        if (prev) acc += p.distanceTo(prev); tab.push([acc, th, off]); prev = p;
      }
      var hit = tab.filter(function (t) { return t[0] >= faceS; })[0][1]; start += faceTh - hit;
    }
    var spiral = function (sv) {
      var lo = 0, hi = tab.length - 1; while (hi - lo > 1) { var m = (lo + hi) >> 1; if (tab[m][0] < sv) lo = m; else hi = m; }
      var a = tab[lo], b = tab[hi], k = (sv - a[0]) / ((b[0] - a[0]) || 1), t2 = a[1] + (b[1] - a[1]) * k;
      return { p: ptAt(t2, a[2] + (b[2] - a[2]) * k), n: nAt(t2), b: new V3(0, 1, 0) };
    };
    var f0 = spiral(tabFrom), t0 = spiral(tabFrom + 0.5).p.sub(spiral(tabFrom - 0.5).p).normalize(), K = 0.018;
    return function (sv) {
      if (sv <= tabFrom) return spiral(sv);
      var d = sv - tabFrom, tg = t0.clone().add(f0.n.clone().multiplyScalar(2 * K * d)).normalize();
      return { p: f0.p.clone().add(t0.clone().multiplyScalar(d)).add(f0.n.clone().multiplyScalar(K * d * d)), n: f0.n.clone().sub(t0.clone().multiplyScalar(2 * K * d)).normalize(), b: new V3(0, 1, 0), tg: tg };
    };
  }

  /* găng .glb: xoay theo cấu hình → co về cao 330 (cùng tỉ lệ găng dựng sẵn), đáy cổ găng y = 0, tâm trục y;
   * dò đường viền cổ găng ở độ cao dây (lấy mọi đỉnh trong dải ±5) → bán kính theo từng góc → dây quấn ôm đúng hình găng thật */
  function fitModel(THREE, gltf, m) {
    m = m || {}; var V3 = THREE.Vector3, D2R = Math.PI / 180;
    var obj = new THREE.Group(), inner = gltf.scene.clone(true), hold = new THREE.Group();
    hold.rotation.set((m.rx || 0) * D2R, (m.ry || 0) * D2R, (m.rz || 0) * D2R, 'YXZ'); hold.add(inner);
    if (m.flip) hold.scale.x = -1;
    obj.add(hold); obj.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(obj, true), size = box.getSize(new V3()), k = 330 / (size.y || 1);
    obj.scale.setScalar(k); obj.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(obj, true); var c = box.getCenter(new V3());
    obj.position.set(-c.x, -box.min.y, -c.z); obj.updateMatrixWorld(true);
    var y = 330 * (m.y || 0.22), BIN = 96, rad = new Float32Array(BIN), pts = [], v = new V3(), sx = 0, sz = 0;
    obj.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      o.castShadow = o.receiveShadow = false;
      var pa = o.geometry.attributes.position, step = Math.max(1, Math.floor(pa.count / 200000));
      for (var i = 0; i < pa.count; i += step) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); if (Math.abs(v.y - y) < 5) { pts.push(v.x, v.z); sx += v.x; sz += v.z; } }
    });
    var n = pts.length / 2, cx = n ? sx / n : 0, cz = n ? sz / n : 0;
    for (var j = 0; j < n; j++) { var dx = pts[j * 2] - cx, dz = pts[j * 2 + 1] - cz, b = Math.floor(((Math.atan2(dx, dz) / (2 * Math.PI)) + 1) % 1 * BIN); rad[b] = Math.max(rad[b], Math.hypot(dx, dz)); }
    // lỗ hổng (góc không có đỉnh) → nội suy; làm mượt vòng
    var fallback = n ? 0 : 50;
    for (var t = 0; t < BIN; t++) if (!rad[t]) { var a = t, b2 = t; while (!rad[(a + BIN - 1) % BIN] && a > t - BIN) a--; while (!rad[(b2 + 1) % BIN] && b2 < t + BIN) b2++; rad[t] = (rad[(a + BIN - 1) % BIN] + rad[(b2 + 1) % BIN]) / 2 || fallback || 50; }
    var sm = new Float32Array(BIN);
    for (t = 0; t < BIN; t++) { var acc = 0, wsum = 0; for (var q = -4; q <= 4; q++) { var w = 5 - Math.abs(q); acc += Math.max(rad[(t + q + BIN) % BIN], rad[t] * 0.85) * w; wsum += w; } sm[t] = acc / wsum * (m.fit || 1); }
    var R = function (th) { var u = ((th / (2 * Math.PI)) % 1 + 1) % 1 * BIN, i0 = Math.floor(u) % BIN, f = u - Math.floor(u); return sm[i0] * (1 - f) + sm[(i0 + 1) % BIN] * f; };
    var maxR = 0; for (t = 0; t < BIN; t++) maxR = Math.max(maxR, sm[t]);
    // tô màu găng xem thử (chỉ khi admin bật): nhân màu vào vật liệu gốc
    var mats = []; obj.traverse(function (o) { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(function (x) { return x.clone(); }) : o.material.clone(); [].concat(o.material).forEach(function (x) { if (x.color) mats.push([x, x.color.clone()]); }); } });
    return {
      obj: obj, y: y, sp: Math.max(95, Math.max(size.x, size.z) * k * 0.5 + 30), turn: (m.turn || 0) * D2R,
      at: function (th, yy, off) { var r = R(th) + off; return new V3(cx + r * Math.sin(th), yy, cz + r * Math.cos(th)); },
      n: function (th) { var e = 0.02, p1 = R(th - e), p2 = R(th + e), tx = new V3(p2 * Math.sin(th + e) - p1 * Math.sin(th - e), 0, p2 * Math.cos(th + e) - p1 * Math.cos(th - e)); return new V3(-tx.z, 0, tx.x).normalize(); },
      tint: m.tint ? function (hex) { var col = new THREE.Color(hex); mats.forEach(function (x) { x[0].color.copy(x[1]).multiply(col); }); } : null,
      cuffR: maxR,
    };
  }

  function strapModel(ctx) {
    var THREE = ctx.THREE, V3 = ctx.V3, root = ctx.root, leather = ctx.leather, ctex = ctx.ctex;
    var prodGrp = new THREE.Group(), pairGrp = new THREE.Group(), flatGrp = new THREE.Group(); root.add(prodGrp, pairGrp, flatGrp);
    var REAL = ctx.gltf ? fitModel(THREE, ctx.gltf, ctx.model) : null;   // găng 3D thật (.glb) tải lên ở /admin
    var gGeo = REAL ? null : gloveGeometry(THREE, ctx.MarchingCubes);
    var gloveMat = leather({ color: 0xffffff, vertexColors: true, roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.16 });
    gloveMat.bumpScale = 0.35;
    var metal = new THREE.MeshStandardMaterial({ metalness: 0.95, roughness: 0.25, color: 0xc3c6ca });
    var laceMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.8 });
    var outC = document.createElement('canvas'), inC = document.createElement('canvas'), outT = ctex(outC), inT = ctex(inC);
    var mats = {
      outer: new THREE.MeshPhysicalMaterial({ map: outT, roughness: 0.78, sheen: 0.6, sheenRoughness: 0.6, side: THREE.DoubleSide }),
      inner: new THREE.MeshStandardMaterial({ map: inT, roughness: 0.92, side: THREE.DoubleSide }),
      edge: new THREE.MeshPhysicalMaterial({ roughness: 0.6, sheen: 0.5, sheenRoughness: 0.5 }),
    };
    var cuffAt = REAL ? REAL.at : function (th, y, off) { var f = gTaper(y); return new V3((GRX * f + off) * Math.sin(th), y, (GRZ * f + off) * Math.cos(th)); };
    var cuffN = REAL ? REAL.n : function (th, y) { var f = gTaper(y); return new V3(Math.sin(th) / (GRX * f), 0, Math.cos(th) / (GRZ * f)).normalize(); };
    var Y0 = REAL ? REAL.y : 80;   // dây nằm ngay dưới nắm tay như ảnh thật
    var SP = REAL ? REAL.sp : 116, FACE = REAL ? REAL.turn : 0;

    // 2 găng (phải / trái soi gương); dây buộc chạy dọc khe mặt lòng, trên & dưới dây dán, bám đúng mặt găng
    var gloves = [1, -1].map(function (side) {
      var g = new THREE.Group();
      if (REAL) {
        var mdl = side > 0 ? REAL.obj : REAL.obj.clone(true); if (side < 0) mdl.scale.x *= -1;
        g.add(mdl); g.position.set(side * SP, 0, 0); g.rotation.y = -side * 0.2; pairGrp.add(g); return g;
      }
      var body = new THREE.Mesh(gGeo, gloveMat); body.scale.x = side; g.add(body);
      var rows = [20, 42, 120, 142, 164], CX = 13, P = function (x, y, off) { return palmPoint(V3, x, y, side, off).p; };
      rows.forEach(function (y) { [-1, 1].forEach(function (sd) {
        var q = palmPoint(V3, sd * CX, y, side, 0.4), rg = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.9, 8, 16), metal);
        rg.position.copy(q.p); rg.lookAt(q.p.clone().add(q.n)); g.add(rg);
      }); });
      var lace = function (pts) { return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), pts.length * 12, 1.35, 8, false), laceMat); };
      var top = rows[rows.length - 1];
      g.add(lace([P(-CX, top, 1.6), P(0, top + 1, 2.4), P(CX, top, 1.6)]));
      [[-1, 2.6], [1, 1.6]].forEach(function (c) {
        var pts = [], sd = c[0];
        for (var k = rows.length - 1; k > 0; k--) {
          var y1 = rows[k], y2 = rows[k - 1];
          pts.push(P(sd * CX, y1, 1.6));
          [0.25, 0.5, 0.75].forEach(function (tt) {
            var yy = y1 + (y2 - y1) * tt, under = Math.abs(yy - Y0) < 28 ? 0 : 1;
            pts.push(P(sd * CX * (1 - 2 * tt), yy, 1.6 + c[1] * under * Math.sin(Math.PI * tt)));
          });
          sd = -sd;
        }
        pts.push(P(sd * CX, rows[0], 1.6), P(sd * CX * 0.7, 8, 2.6));
        g.add(lace(pts));
      });
      g.position.set(side * 116, 0, 0); g.rotation.y = -side * 0.2;
      pairGrp.add(g); return g;
    });

    var built = '', L = 380, W = 32, TH = 3.2, strapObjs = [];
    function eyelet(fr, flip) {
      var e = new THREE.Mesh(new THREE.TorusGeometry(3.4, 1.15, 10, 20), metal);
      e.position.copy(fr.p.clone().add(fr.n.clone().multiplyScalar((flip ? -1 : 1) * (TH / 2 + 0.3)))); e.lookAt(e.position.clone().add(fr.n)); return e;
    }
    function rebuild() {
      strapObjs.forEach(function (o) { o.parent.remove(o); o.traverse(function (m) { if (m.geometry && m.geometry !== gGeo) m.geometry.dispose(); }); }); strapObjs = [];
      var logoS = (SEC[2][1] * L + SEC[2][2] * L - W * 1.05) / 2, tabS = SEC[3][1] * L + 2;
      // ── trên găng: chữ / logo quay ra mu bàn tay, tab kéo bật ra bên hông
      var onGlove = wrapFrame(V3, function (th, off) { return cuffAt(th, Y0, off); }, function (th) { return cuffN(th, Y0); }, L, TH, logoS, FACE, tabS);
      gloves.forEach(function (g) { var rb = ribbon(THREE, onGlove, L, W, TH, mats); g.add(rb); strapObjs.push(rb); });
      // ── sản phẩm: 1 đôi cuộn tròn (như khi bán), xếp chồng
      var RA = 56, RB = 40;
      var ringAt = function (th, off) { return new V3((RA + off) * Math.sin(th), 0, (RB + off) * Math.cos(th)); };
      var ringN = function (th) { return new V3(Math.sin(th) / RA, 0, Math.cos(th) / RB).normalize(); };
      var coil = wrapFrame(V3, ringAt, ringN, L, TH, logoS, -0.12, tabS);
      [0, 1].forEach(function (k) {
        var g = new THREE.Group(); g.add(ribbon(THREE, coil, L, W, TH, mats));
        g.position.set(k ? 10 : -6, k ? -W / 2 - 5 : W / 2 + 5, k ? 6 : 0); g.rotation.y = k ? 0.18 : -0.06;
        prodGrp.add(g); strapObjs.push(g);
      });
      // ── trải phẳng: mặt ngoài (trên) · mặt trong có khoen (dưới)
      var flat = function (sv) { return { p: new V3(sv - L / 2, 0, 0), n: new V3(0, 0, 1), b: new V3(0, 1, 0) }; };
      var fo = ribbon(THREE, flat, L, W, TH, mats); fo.position.y = W * 0.85;
      var fi = ribbon(THREE, flat, L, W, TH, mats); fi.rotation.y = Math.PI; fi.position.y = -W * 0.85;
      fi.add(eyelet(flat(14), true));
      flatGrp.add(fo, fi); strapObjs.push(fo, fi);
    }
    return {
      fit: [178, 196],
      views: { front: [-0.05, 0.42], gloves: [0, 0.1], close: [0.45, 0.24], palm: [Math.PI, 0.12], flat: [0, 0] },
      onview: function (name) {
        var prod = name === 'front', fl = name === 'flat';
        prodGrp.visible = prod; flatGrp.visible = fl; pairGrp.visible = !prod && !fl; gloves[1].visible = name !== 'close';
        var sc = prod ? 1.55 : fl ? 0.95 : name === 'close' ? 1.85 : 0.94;
        root.scale.setScalar(sc);
        root.position.set(name === 'close' ? -SP * sc : 0, prod || fl ? 0 : name === 'close' ? -Y0 * sc : -150, name === 'close' ? -10 : 0);
      },
      real: !!REAL,
      reset: function () { built = ''; },
      update: function (s, redraw) {
        var nL = s.groups && s.groups.length === 'long' ? 430 : 380, nW = s.groups && s.groups.width === 'w38' ? 38 : 32;
        if (built !== nL + 'x' + nW) { built = nL + 'x' + nW; L = nL; W = nW; rebuild(); }
        strapCanvas(outC, s, L, W, false, redraw); strapCanvas(inC, s, L, W, true, redraw);
        outT.needsUpdate = inT.needsUpdate = true;
        mats.edge.color.set(s.col.edge); metal.color.set(s.col.eyelet);
        if (gGeo) paintGlove(THREE, gGeo, s.glove || '#1c1c1c'); else if (REAL.tint) REAL.tint(s.glove || '#1c1c1c');
        laceMat.color.set(s.laces ? s.col.hook : '#f2f2f2');
      },
    };
  }

  /* ─── cảnh 3D ─── */
  function build(THREE, RoomEnvironment, el, tpl, MarchingCubes, gltf, modelCfg) {
    var V3 = THREE.Vector3;
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    var cv = renderer.domElement; cv.className = 'cx-3d-cv'; el.appendChild(cv);
    var scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.85;
    var key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-320, 420, 620); scene.add(key);
    var fill = new THREE.DirectionalLight(0xfff4e8, 0.45); fill.position.set(420, -80, 300); scene.add(fill);
    var rim = new THREE.DirectionalLight(0xffffff, 1.1); rim.position.set(260, 380, -700); scene.add(rim);
    var low = new THREE.DirectionalLight(0xffffff, 0.5); low.position.set(0, -600, -200); scene.add(low);
    var cam = new THREE.PerspectiveCamera(26, 1, 10, 8000);
    var grp = new THREE.Group(), root = new THREE.Group(); grp.add(root); scene.add(grp);
    var maxAni = renderer.capabilities.getMaxAnisotropy();
    function ctex(c) { var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAni; return t; }
    var bump = new THREE.CanvasTexture(grain()); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(12, 8);
    var leather = function (o) { return new THREE.MeshPhysicalMaterial(Object.assign({ bumpMap: bump, bumpScale: 0.5, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3 }, o)); };
    var M = (MODELS[tpl] || MODELS.groin)({ THREE: THREE, V3: V3, root: root, leather: leather, ctex: ctex, bump: bump, MarchingCubes: MarchingCubes, gltf: gltf, model: modelCfg });

    // xoay
    var yaw = M.views.front[0] - 0.8, pitch = M.views.front[1], want = { yaw: M.views.front[0], pitch: M.views.front[1] }, dirty = true, raf = 0, last = null, was = false, spin = false, drag = null;
    function size() {
      var w = el.clientWidth || 400, hh = el.clientHeight || 380;
      renderer.setSize(w, hh, false); cam.aspect = w / hh;
      var fit = Math.max(M.fit[0], M.fit[1] / cam.aspect);
      cam.position.set(0, 0, fit / Math.tan(THREE.MathUtils.degToRad(13))); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix(); dirty = true; loop();
    }
    function loop() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        if (spin && !drag) want.yaw += 0.012;
        var dy = want.yaw - yaw, dp = want.pitch - pitch, moving = Math.abs(dy) > 0.0005 || Math.abs(dp) > 0.0005;
        if (moving) { yaw += dy * 0.12; pitch += dp * 0.12; dirty = true; }
        else if (was) { yaw = want.yaw; pitch = want.pitch; dirty = true; }   // khung cuối khi vừa dừng → chụp ảnh nhỏ
        was = moving;
        if (dirty) { grp.rotation.set(pitch, yaw, 0); renderer.render(scene, cam); dirty = false; if (!moving && !spin && api.onframe) api.onframe(); }
        if (moving || drag || spin) loop();
      });
    }
    cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, yaw: want.yaw, pitch: want.pitch }; cv.setPointerCapture(e.pointerId); el.classList.add('cx-grab'); api.spin(false); });
    cv.addEventListener('pointermove', function (e) {
      if (!drag) return;
      want.yaw = drag.yaw + (e.clientX - drag.x) / 150;
      want.pitch = Math.max(-0.7, Math.min(0.8, drag.pitch + (e.clientY - drag.y) / 200)); loop();
    });
    var up = function () { drag = null; el.classList.remove('cx-grab'); loop(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('dblclick', function () { api.view('front'); });
    // trình duyệt thu hồi ngữ cảnh WebGL (nhiều tab 3D, máy yếu…) → khi trả lại thì vẽ lại toàn bộ
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); });
    cv.addEventListener('webglcontextrestored', function () { if (M.reset) M.reset(); if (last) api.update(last); });
    if (window.ResizeObserver) new ResizeObserver(size).observe(el); else window.addEventListener('resize', size);

    var VIEWS = M.views;
    var api = {
      update: function (s) {
        last = s;
        var redraw = function () { if (last) api.update(last); };
        M.update(s, redraw);
        dirty = true; loop();
      },
      view: function (name) {
        var v = VIEWS[name] || VIEWS.front, t = v[0], n = Math.round((want.yaw - t) / (2 * Math.PI));
        spin = false; if (api.onspin) api.onspin(false); want.yaw = t + n * 2 * Math.PI; want.pitch = v[1];
        if (M.onview) M.onview(name);
        dirty = true; loop();
      },
      spin: function (on) { spin = on === undefined ? !spin : !!on; if (api.onspin) api.onspin(spin); loop(); return spin; },
      real: !!M.real,
      snapshot: function (type) { try { if (type) { renderer.render(scene, cam); return cv.toDataURL(type); } return cv.toDataURL('image/webp', 0.82); } catch (e) { return ''; } },
      dispose: function () { try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* bỏ qua */ } if (cv.parentNode) cv.parentNode.removeChild(cv); },
      onframe: null, onspin: null,
    };
    if (M.onview) M.onview('front');
    size();
    return api;
  }

  // tải .glb (hỗ trợ nén Draco / Meshopt); nhớ theo đường dẫn để mở lại không phải tải lại
  var GLB = {};
  function loadGlb(THREE, url) {
    if (GLB[url]) return GLB[url];
    GLB[url] = Promise.all([import(BASE + 'GLTFLoader-r170.js'), import(BASE + 'DRACOLoader-r170.js'), import(BASE + 'meshopt_decoder.module.js')]).then(function (m) {
      var ld = new m[0].GLTFLoader(), dr = new m[1].DRACOLoader(); dr.setDecoderPath(BASE + 'draco/'); ld.setDRACOLoader(dr); ld.setMeshoptDecoder(m[2].MeshoptDecoder);
      return new Promise(function (ok, no) { ld.load(url, ok, undefined, no); });
    });
    GLB[url].catch(function () { delete GLB[url]; });
    return GLB[url];
  }
  var MODELS = { groin: groinModel, strap: function (ctx) { return strapModel(ctx); } };

  window.DCX3D = {
    ok: ok,
    svg: svg,
    spots2d: function () { return flatGeo().spots; },
    has: function (tpl) { return !!MODELS[tpl]; },
    _gloveGeometry: function (THREE, MC) { return gloveGeometry(THREE, MC); },   // dùng khi kiểm tra (xuất .glb mẫu)
    // opts.model = { url, rx, ry, rz, flip, y, fit, turn, tint } — găng .glb thật làm mockup (mẫu dây dán)
    create: function (el, tpl, opts) {
      var model = opts && opts.model && opts.model.url ? opts.model : null;
      return import(BASE + 'three-r170.module.min.js').then(function (THREE) {
        return Promise.all([import(BASE + 'RoomEnvironment-r170.js'), tpl === 'strap' ? import(BASE + 'MarchingCubes-r170.js') : null, model ? loadGlb(THREE, model.url).catch(function (er) { if (window.console) console.warn('[custom3d] không tải được găng 3D, dùng găng dựng sẵn', er); return null; }) : null]).then(function (m) {
          return build(THREE, m[0].RoomEnvironment, el, tpl || 'groin', m[1] && m[1].MarchingCubes, m[2], model);
        });
      });
    },
  };
})();
