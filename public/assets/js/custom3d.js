/*
 * Xem trước 3D trọn bộ groin guard (Tự thiết kế — custom.js): mặt trước, mặt sau, dây đùi.
 * three.js (public/assets/vendor/three) chỉ tải khi khách mở "Tự thiết kế".
 *
 *   Thân trước  lưới bề mặt "bơm phồng" theo khuôn 2D (đệm tròn mép, cup nhô, đường may lõm), ôm cong theo hông,
 *               mặt trong là lớp lót (chần trám, lòng cup); viền bọc mép là ống 3D chạy quanh khuôn.
 *   Mặt sau     đai thun bản to ôm vòng lưng, 2 ốp hông, bản xỏ dây ở giữa với khoen kim loại + dây buộc chéo 3D,
 *               nơ thắt và 2 đầu dây thả (hoặc khóa dán / khóa cài theo lựa chọn "Kiểu khóa").
 *   Dây đùi     2 dây thun từ góc đai sau vòng xuống, nối bằng miếng nối dưới cup.
 * Mọi màu (kể cả chỉ may, dây buộc, khoen) đổi tức thì; khách kéo để xoay 360°.
 * Toạ độ khuôn 420 × 380 dùng chung với hình SVG phẳng trong custom.js (máy không có WebGL).
 */
(function () {
  'use strict';
  var BASE = '/assets/vendor/three/';
  var W = 420, H = 380, CX = 210;
  var CELL = 1.5, GX = 281, GY = 254;   // lưới đỉnh thân trước
  var TS = 2.4, TB = 2.2;               // px / đơn vị: ảnh phủ thân trước · đai sau
  var BELT_TOP = 122, BELT_BOT = 30, BH = BELT_TOP - BELT_BOT;

  var P = {
    body: 'M48 64 Q210 52 372 64 Q386 66 386 82 L388 236 Q388 258 366 258 L346 258 Q332 258 328 244 Q320 214 306 212 Q290 210 284 240 ' +
      'Q278 292 250 330 Q230 354 210 354 Q190 354 170 330 Q142 292 136 240 Q130 210 114 212 Q100 214 92 244 Q88 258 74 258 L54 258 Q32 258 32 236 L34 82 Q34 66 48 64 Z',
    cup: 'M110 234 Q210 216 310 234 L310 380 L110 380 Z',
    band: 'M0 0 L420 0 L420 88 Q210 72 0 88 Z',
    bandLine: 'M30 88 Q210 72 390 88',
    cupLine: 'M138 240 Q210 222 282 240',
    seam: 'M210 79 L210 352',
    patch: 'M177 98 L243 98 Q249 98 249 104 L249 148 Q249 154 243 154 L177 154 Q171 154 171 148 L171 104 Q171 98 177 98 Z',
  };
  // ô chữ / logo mặt trước: [tâm x, tâm y, rộng, cao, phần nền]
  var SPOTS = { cup: [210, 126, 70, 46, 'panel'], belt: [210, 72, 230, 15, 'belt'], left: [100, 150, 104, 54, 'left'], right: [320, 150, 104, 54, 'right'], tip: [210, 290, 64, 40, 'cup'] };
  // ô trên đai sau: vị trí theo tỉ lệ chiều dài đai (0 = trái khi nhìn từ sau)
  var BACK = { backL: 0.29, backR: 0.71 };

  function ok() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
    catch (e) { return false; }
  }
  var ss = function (a, b, v) { var t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  function luma(hex) { var n = parseInt(String(hex).slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); }
  function shade(hex, k) { var n = parseInt(String(hex).slice(1), 16), f = function (c) { return Math.max(0, Math.min(255, Math.round(c * k))); }; return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; }

  /* ─── thân trước: mặt nạ → độ phồng ─── */
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
  function curveZ(x, y) {
    var dx = Math.abs(x - CX);
    // ôm hông + hai vạt hông cụp ra sau + cup luồn xuống dưới
    return -0.0027 * dx * dx - 0.0011 * Math.max(0, y - 170) * Math.max(0, dx - 90) - 0.011 * Math.pow(Math.max(0, y - 308), 2);
  }
  function heights() {
    var body = blur(mask([P.body]), 7, 3), groove = blur(mask([P.seam, P.bandLine, P.cupLine], 3), 2, 2), patch = blur(mask([P.patch]), 2, 2);
    var z = new Float32Array(GX * GY);
    for (var j = 0; j < GY; j++) for (var i = 0; i < GX; i++) {
      var k = j * GX + i, x = i * CELL, y = j * CELL, hb = Math.pow(ss(0.4, 0.97, body[k]), 0.7);
      var g = Math.exp(-(Math.pow(x - CX, 2) / (2 * 62 * 62) + Math.pow(y - 280, 2) / (2 * 66 * 66)));
      z[k] = (hb > 0 ? 15 * hb + 26 * g * hb - 4 * groove[k] * hb + 2.2 * patch[k] : 0) + curveZ(x, y);
    }
    return z;
  }
  function zAt(z, x, y) {
    var gx = Math.max(0, Math.min(GX - 1.001, x / CELL)), gy = Math.max(0, Math.min(GY - 1.001, y / CELL)), i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
    var a = z[j * GX + i], b = z[j * GX + i + 1], c = z[(j + 1) * GX + i], d = z[(j + 1) * GX + i + 1];
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
  // gân dây thun (xám — nhân với màu vật liệu)
  function ribs() {
    return noise('ribs', function (c) {
      c.width = 64; c.height = 64; var x = c.getContext('2d');
      x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, 64, 64);
      for (var i = 0; i < 64; i += 4) { x.fillStyle = '#ffffff'; x.fillRect(i, 0, 2, 64); x.fillStyle = '#a9a9a9'; x.fillRect(i + 2, 0, 1, 64); }
      x.fillStyle = 'rgba(0,0,0,.08)'; for (i = 0; i < 64; i += 2) x.fillRect(0, i, 64, 1);
    });
  }
  // dây buộc: sợi xoắn
  function twist() {
    return noise('twist', function (c) {
      c.width = 32; c.height = 32; var x = c.getContext('2d');
      x.fillStyle = '#f2f2f2'; x.fillRect(0, 0, 32, 32); x.strokeStyle = '#b9b9b9'; x.lineWidth = 3;
      for (var i = -32; i < 64; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 16, 32); x.stroke(); }
    });
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

  /* ─── ảnh phủ: thân trước (mặt ngoài) ─── */
  function paintFront(c, s, redraw) {
    var x = c.getContext('2d'), col = s.col;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.setTransform(TS, 0, 0, TS, 0, 0);
    var body = new Path2D(P.body), patch = new Path2D(P.patch);
    x.save(); x.clip(body);
    x.fillStyle = col.left; x.fillRect(0, 0, CX, H); x.fillStyle = col.right; x.fillRect(CX, 0, CX, H);
    x.fillStyle = col.cup; x.fill(new Path2D(P.cup)); x.fillStyle = col.belt; x.fill(new Path2D(P.band));
    leatherGrain(x, s, W, H);
    x.fillStyle = col.panel; x.fill(patch); x.strokeStyle = col.trim; x.lineWidth = 2.6; x.stroke(patch);
    x.stroke(new Path2D(P.bandLine));
    // chỉ may
    x.strokeStyle = col.thread; x.lineWidth = 1.15; x.setLineDash([3.2, 2.4]); x.lineCap = 'round';
    x.save(); x.translate(CX, 205); x.scale(0.962, 0.958); x.translate(-CX, -205); x.stroke(body); x.restore();
    x.save(); x.translate(0, 5); x.stroke(new Path2D(P.bandLine)); x.restore();
    x.beginPath(); x.moveTo(206, 90); x.lineTo(206, 348); x.moveTo(214, 90); x.lineTo(214, 348); x.stroke();
    x.save(); x.translate(CX, 126); x.scale(0.88, 0.84); x.translate(-CX, -126); x.stroke(patch); x.restore();
    x.setLineDash([]);
    if (s.logo && SPOTS[s.logo.spot]) drawLogo(x, s.logo, SPOTS[s.logo.spot], redraw);
    if (s.text && SPOTS[s.text.spot]) drawText(x, s.text, SPOTS[s.text.spot], col[SPOTS[s.text.spot][4]]);
    x.restore();
  }
  /* ─── mặt trong thân trước: lớp lót chần trám ─── */
  function paintLining(c, s) {
    var x = c.getContext('2d'), col = s.col, k = c.width / W;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.setTransform(k, 0, 0, k, 0, 0);
    var body = new Path2D(P.body);
    x.save(); x.clip(body);
    x.fillStyle = col.lining; x.fillRect(0, 0, W, H);
    var g = x.createRadialGradient(CX, 286, 6, CX, 286, 70); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    leatherGrain(x, { material: 'micro' }, W, H);
    x.strokeStyle = luma(col.lining) > 140 ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.14)'; x.lineWidth = 1; x.setLineDash([2.4, 2]);
    for (var t = -400; t < 800; t += 22) { x.beginPath(); x.moveTo(t, 0); x.lineTo(t + 380, H); x.stroke(); x.beginPath(); x.moveTo(t + 380, 0); x.lineTo(t, H); x.stroke(); }
    x.setLineDash([]);
    x.strokeStyle = col.trim; x.lineWidth = 9; x.stroke(body);
    x.restore();
  }
  /* ─── đai sau (mặt ngoài) ─── */
  function eyelets(L) { var out = [], mid = L / 2; for (var r = 0; r < 5; r++) { var y = 13 + r * (BH - 26) / 4; out.push([mid - 19.5, y], [mid + 19.5, y]); } return out; }
  function paintBelt(c, s, L, redraw) {
    var x = c.getContext('2d'), col = s.col, mid = L / 2;
    x.setTransform(TB, 0, 0, TB, 0, 0);
    x.fillStyle = col.elastic; x.fillRect(0, 0, L, BH);
    var lt = luma(col.elastic) > 140;
    for (var t = 0; t < L; t += 2.6) { x.fillStyle = lt ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.07)'; x.fillRect(t, 0, 1, BH); }
    x.fillStyle = lt ? 'rgba(0,0,0,.12)' : 'rgba(0,0,0,.35)'; x.fillRect(0, 0, L, 3.4); x.fillRect(0, BH - 3.4, L, 3.4);
    // ốp hông 2 bên
    x.strokeStyle = col.thread; x.lineWidth = 1; x.setLineDash([3, 2.2]);
    [[0, 24], [L - 24, L]].forEach(function (r) {
      x.fillStyle = col.side; x.fillRect(r[0], 0, r[1] - r[0], BH);
      x.save(); x.beginPath(); x.rect(r[0], 0, r[1] - r[0], BH); x.clip(); leatherGrain(x, s, L, BH); x.restore();
      var e = r[0] === 0 ? r[1] - 3 : r[0] + 3; x.beginPath(); x.moveTo(e, 2); x.lineTo(e, BH - 2); x.stroke();
    });
    // bản khóa giữa
    var strip = function (a, b) {
      x.fillStyle = col.lacepanel; x.fillRect(a, 0, b - a, BH);
      x.save(); x.beginPath(); x.rect(a, 0, b - a, BH); x.clip(); leatherGrain(x, s, L, BH); x.restore();
      x.strokeRect(a + 2.6, 2.6, b - a - 5.2, BH - 5.2);
    };
    if (s.closure === 'velcro') {
      strip(mid - 42, mid + 42);
      x.save(); x.fillStyle = 'rgba(0,0,0,.18)'; for (var i = mid - 34; i < mid + 34; i += 2.2) for (var j = 10; j < BH - 10; j += 2.2) x.fillRect(i, j, 1, 1); x.restore();
    } else if (s.closure === 'buckle') {
      strip(mid - 34, mid + 34);
    } else {
      strip(mid - 32, mid - 7); strip(mid + 7, mid + 32);
      x.fillStyle = 'rgba(0,0,0,.65)'; eyelets(L).forEach(function (e) { x.beginPath(); x.arc(e[0], e[1], 2.6, 0, 7); x.fill(); });
    }
    x.setLineDash([]);
    ['backL', 'backR'].forEach(function (k) {
      var box = [L * BACK[k], BH / 2, Math.min(130, L * 0.26), 40];
      if (s.logo && s.logo.spot === k) drawLogo(x, s.logo, box, redraw);
      if (s.text && s.text.spot === k) drawText(x, s.text, box, col.elastic);
    });
  }

  /* ─── cảnh 3D ─── */
  function build(THREE, RoomEnvironment, el) {
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
    var cam = new THREE.PerspectiveCamera(26, 1, 10, 8000);
    var grp = new THREE.Group(), root = new THREE.Group(); grp.add(root); scene.add(grp);
    root.position.set(0, 22, 140);
    var maxAni = renderer.capabilities.getMaxAnisotropy();
    function ctex(c) { var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAni; return t; }
    var bump = new THREE.CanvasTexture(grain()); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(9, 8);
    var leather = function (o) { return new THREE.MeshPhysicalMaterial(Object.assign({ bumpMap: bump, bumpScale: 0.5, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3 }, o)); };
    var M = function (x, y) { return new V3(x - CX, 190 - y, 0); };   // toạ độ khuôn → không gian 3D

    // thân trước + lớp lót
    var z = heights(), geo = new THREE.PlaneGeometry(W, H, GX - 1, GY - 1), pos = geo.attributes.position;
    for (var k = 0; k < pos.count; k++) pos.setZ(k, z[k]);
    geo.computeVertexNormals();
    var fc = document.createElement('canvas'); fc.width = Math.round(W * TS); fc.height = Math.round(H * TS);
    var lc = document.createElement('canvas'); lc.width = Math.round(W * 1.4); lc.height = Math.round(H * 1.4);
    var fTex = ctex(fc), lTex = ctex(lc);
    var frontMat = leather({ map: fTex, side: THREE.FrontSide, alphaTest: 0.5 });
    var liningMat = new THREE.MeshStandardMaterial({ map: lTex, side: THREE.BackSide, alphaTest: 0.5, roughness: 0.85 });
    root.add(new THREE.Mesh(geo, frontMat), new THREE.Mesh(geo, liningMat));

    // viền bọc mép (ống chạy quanh khuôn)
    var edge = outline(P.body, 2).map(function (p) { var v = M(p[0], p[1]); v.z = zAt(z, p[0], p[1]) + 0.5; return v; });
    var trimMat = leather({ color: 0xffffff });
    root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge, true, 'centripetal'), 700, 3.1, 10, true), trimMat));

    // đai sau: vòng từ mép phải thân trước → sau lưng → mép trái (nhìn từ sau: trái → phải)
    var zs = zAt(z, 33, 120), xs = 177.5;
    var beltPts = [[xs, zs], [xs + 2, zs - 50], [xs - 8, -200], [140, -258], [76, -292], [0, -302], [-76, -292], [-140, -258], [-xs + 8, -200], [-xs - 2, zs - 50], [-xs, zs]]
      .map(function (p) { return new V3(p[0], 0, p[1]); });
    var belt = new THREE.CatmullRomCurve3(beltPts, false, 'centripetal'), L = belt.getLength();
    var outward = function (p) { return new V3(p.x, 0, p.z + 140).normalize(); };
    function strip(fn, nu, nv) {
      var g = new THREE.BufferGeometry(), P3 = [], UV = [], I = [], i, j;
      for (j = 0; j <= nv; j++) for (i = 0; i <= nu; i++) { var v = fn(i / nu, j / nv); P3.push(v.x, v.y, v.z); UV.push(i / nu, 1 - j / nv); }
      for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) { var a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, c, b, b, c, d); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals();
      return g;
    }
    var beltGeo = strip(function (u, v) { var p = belt.getPointAt(u); return new V3(p.x, BELT_TOP - v * BH, p.z); }, 180, 6);
    var bc = document.createElement('canvas'); bc.width = Math.round(L * TB); bc.height = Math.round(BH * TB);
    var bTex = ctex(bc);
    var beltOut = new THREE.MeshPhysicalMaterial({ map: bTex, roughness: 0.8, sheen: 0.4, sheenRoughness: 0.8, bumpMap: bump, bumpScale: 0.15 });
    var beltIn = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.92 });
    // mặt nào của dải đai quay ra ngoài?
    var nrm = beltGeo.attributes.normal, mi = 3 * 181 + 90, nOut = new V3(nrm.getX(mi), 0, nrm.getZ(mi)).dot(outward(belt.getPointAt(0.5))) > 0;
    beltOut.side = nOut ? THREE.FrontSide : THREE.BackSide; beltIn.side = nOut ? THREE.BackSide : THREE.FrontSide;
    root.add(new THREE.Mesh(beltGeo, beltOut), new THREE.Mesh(beltGeo, beltIn));
    // điểm trên mặt đai: s = khoảng cách dọc đai, y = tính từ mép trên xuống, off = nhô ra ngoài
    function onBelt(s, y, off) { var p = belt.getPointAt(Math.max(0, Math.min(1, s / L))); return new V3(p.x, BELT_TOP - y, p.z).add(outward(p).multiplyScalar(off || 0)); }

    // dây thun đùi
    var ribTex = new THREE.CanvasTexture(ribs()); ribTex.wrapS = ribTex.wrapT = THREE.RepeatWrapping; ribTex.repeat.set(1, 26);
    var strapMat = new THREE.MeshStandardMaterial({ map: ribTex, roughness: 0.85, side: THREE.DoubleSide });
    var tabP = new V3(0, -166, -52);
    [1, -1].forEach(function (sx) {
      var a = onBelt(sx > 0 ? 16 : L - 16, BH - 6, 0);
      var c = new THREE.CatmullRomCurve3([a, new V3(sx * 176, -18, -150), new V3(sx * 146, -96, -140), new V3(sx * 76, -150, -96), new V3(sx * 18, -166, -60), tabP.clone().add(new V3(sx * 4, 0, 0))], false, 'centripetal');
      root.add(new THREE.Mesh(strip(function (u, v) {
        var p = c.getPointAt(u), t = c.getTangentAt(u), o = new V3(p.x, 0, p.z + 140).normalize(), side = new V3().crossVectors(t, o).normalize();
        return p.clone().add(side.multiplyScalar((v - 0.5) * 15)).add(o.multiplyScalar(-1.5));
      }, 90, 2), strapMat));
    });
    var tabMat = leather({ color: 0xffffff });
    var tab = new THREE.Mesh(new THREE.BoxGeometry(22, 12, 4), tabMat); tab.position.copy(tabP); tab.rotation.x = -0.9; root.add(tab);

    // phụ kiện khóa (dây buộc / khoen / khóa cài) — dựng lại khi đổi kiểu khóa
    var laceTex = new THREE.CanvasTexture(twist()); laceTex.wrapS = laceTex.wrapT = THREE.RepeatWrapping; laceTex.repeat.set(60, 1);
    var laceMat = new THREE.MeshStandardMaterial({ map: laceTex, roughness: 0.75 });
    var metalMat = new THREE.MeshStandardMaterial({ metalness: 0.95, roughness: 0.28 });
    var hw = new THREE.Group(), hwKind = ''; root.add(hw);
    function tube(pts, r, seg) { return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), seg || 80, r, 8, false), laceMat); }
    function face(m, p) { m.position.copy(p); m.lookAt(p.clone().add(outward(p))); return m; }
    function hardware(kind) {
      if (kind === hwKind) return; hwKind = kind;
      while (hw.children.length) hw.children.pop().geometry.dispose();
      var mid = L / 2;
      if (kind === 'velcro') return;
      if (kind === 'buckle') {
        [BH * 0.32, BH * 0.68].forEach(function (y) {
          var p = onBelt(mid, y, 2.5), ring = face(new THREE.Mesh(new THREE.TorusGeometry(10, 1.6, 10, 4), metalMat), p);
          ring.rotateZ(Math.PI / 4); ring.scale.set(1.3, 0.75, 1); hw.add(ring);
          var bar = face(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 15, 8), metalMat), p); hw.add(bar);
        });
        return;
      }
      var E = eyelets(L);
      E.forEach(function (e) { hw.add(face(new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.95, 8, 18), metalMat), onBelt(e[0], e[1], 0.8))); });
      var at = function (side, row, off) { var e = E[row * 2 + (side === 'L' ? 0 : 1)]; return onBelt(e[0], e[1], off); };
      // thanh ngang trên cùng + 2 dây chéo (dây này đè lên dây kia)
      hw.add(tube([at('L', 0, 1.2), onBelt(mid, 13, 3), at('R', 0, 1.2)], 1.25, 20));
      [['L', 3.6], ['R', 2.4]].forEach(function (cfg) {
        var pts = [], side = cfg[0], other;
        for (var r = 0; r < 4; r++) {
          other = side === 'L' ? 'R' : 'L';
          var a = at(side, r, 1.2), b = at(other, r + 1, 1.2);
          pts.push(a, a.clone().lerp(b, 0.5).add(outward(a).multiplyScalar(cfg[1])));
          side = other;
        }
        pts.push(at(side, 4, 1.2), onBelt(mid + (side === 'L' ? -6 : 6), BH + 2, 4), onBelt(mid, BH + 6, 5));
        hw.add(tube(pts, 1.25, 160));
      });
      // nơ: nút + 2 quai + 2 đầu dây thả xuống (đầu bịt kim loại)
      var knot = onBelt(mid, BH + 6, 5);
      hw.add(face(new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), laceMat), knot));
      [-1, 1].forEach(function (d) {
        hw.add(tube([knot, onBelt(mid + d * 9, BH - 4, 8), onBelt(mid + d * 20, BH + 2, 7), onBelt(mid + d * 12, BH + 12, 6), knot], 1.2, 40));
        var e3 = onBelt(mid + d * 7, BH + 74, 4);
        hw.add(tube([knot, onBelt(mid + d * 4, BH + 26, 6), onBelt(mid + d * 10, BH + 52, 5), e3], 1.2, 50));
        var ag = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 7, 8), metalMat); ag.position.copy(e3).add(new V3(0, -3, 0)); hw.add(ag);
      });
    }

    // xoay
    var yaw = -0.55, pitch = 0.16, want = { yaw: 0.3, pitch: 0.16 }, dirty = true, raf = 0, last = null, was = false, spin = false, drag = null;
    function size() {
      var w = el.clientWidth || 400, h = el.clientHeight || 380;
      renderer.setSize(w, h, false); cam.aspect = w / h;
      var fit = Math.max(215, 235 / cam.aspect);
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
      want.pitch = Math.max(-0.55, Math.min(0.7, drag.pitch + (e.clientY - drag.y) / 200)); loop();
    });
    var up = function () { drag = null; el.classList.remove('cx-grab'); loop(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('dblclick', function () { api.view('front'); });
    if (window.ResizeObserver) new ResizeObserver(size).observe(el); else window.addEventListener('resize', size);

    var VIEWS = { front: [0.3, 0.16], back: [Math.PI + 0.3, 0.2], top: [Math.PI + 0.2, 0.68], side: [1.35, 0.1], under: [Math.PI * 0.82, -0.42] };
    var api = {
      update: function (s) {
        last = s;
        var redraw = function () { if (last) api.update(last); };
        paintFront(fc, s, redraw); fTex.needsUpdate = true;
        paintLining(lc, s); lTex.needsUpdate = true;
        paintBelt(bc, s, L, redraw); bTex.needsUpdate = true;
        hardware(s.closure || 'lace');
        trimMat.color.set(s.col.trim); tabMat.color.set(s.col.tab); strapMat.color.set(s.col.strap); laceMat.color.set(s.col.lace); metalMat.color.set(s.col.eyelet);
        beltIn.color.set(shade(s.col.elastic, 0.7));
        var gloss = s.finish !== 'matte';
        [frontMat, trimMat, tabMat].forEach(function (m) { m.roughness = gloss ? 0.34 : 0.74; m.clearcoat = gloss ? 0.6 : 0.05; m.clearcoatRoughness = gloss ? 0.25 : 0.6; m.bumpScale = s.material === 'cow' ? 1.1 : s.material === 'micro' ? 0.25 : 0.5; });
        dirty = true; loop();
      },
      // xoay tới mặt cần xem (đường ngắn nhất)
      view: function (name) {
        var v = VIEWS[name] || VIEWS.front, t = v[0], n = Math.round((want.yaw - t) / (2 * Math.PI));
        spin = false; if (api.onspin) api.onspin(false); want.yaw = t + n * 2 * Math.PI; want.pitch = v[1]; loop();
      },
      spin: function (on) { spin = on === undefined ? !spin : !!on; if (api.onspin) api.onspin(spin); loop(); return spin; },
      snapshot: function () { try { return cv.toDataURL('image/webp', 0.82); } catch (e) { return ''; } },
      onframe: null, onspin: null,
    };
    size();
    return api;
  }

  window.DCX3D = {
    ok: ok,
    paths: P,
    spots: SPOTS,
    create: function (el) {
      return import(BASE + 'three-r170.module.min.js').then(function (THREE) {
        return import(BASE + 'RoomEnvironment-r170.js').then(function (m) { return build(THREE, m.RoomEnvironment, el); });
      });
    },
  };
})();
