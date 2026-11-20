/*
 * Xem trước 3D cho mẫu "groin guard" (Tự thiết kế — custom.js).
 * Mô hình dựng bằng three.js (public/assets/vendor/three, tải khi khách mở "Tự thiết kế"):
 *   lưới bề mặt được "bơm phồng" theo hình thân trước → đệm da tròn mép, cup nhô ra, đường may lõm, ôm cong theo hông;
 *   màu từng phần, viền, chỉ may, chữ, logo được vẽ lên ảnh phủ (canvas) nên đổi gì cũng cập nhật ngay.
 * Khách kéo để xoay; máy không có WebGL thì custom.js dùng hình SVG phẳng.
 * Hình học dùng chung toạ độ 420 × 380 với SVG trong custom.js.
 */
(function () {
  'use strict';
  var BASE = '/assets/vendor/three/';
  var W = 420, H = 380, CX = 210;
  var CELL = 1.5, GX = 281, GY = 254; // lưới đỉnh: mỗi ô 1,5 đơn vị
  var TS = 2.4;                     // độ phân giải ảnh phủ (px / đơn vị)

  var P = {
    body: 'M48 64 Q210 52 372 64 Q386 66 386 82 L384 170 Q383 190 366 200 L262 262 Q258 300 238 330 Q222 352 210 352 Q198 352 182 330 Q162 300 158 262 L54 200 Q37 190 36 170 L34 82 Q34 66 48 64 Z',
    cup: 'M120 246 Q210 230 300 246 L300 380 L120 380 Z',
    band: 'M0 0 L420 0 L420 88 Q210 72 0 88 Z',
    bandLine: 'M30 88 Q210 72 390 88',
    cupLine: 'M150 250 Q210 234 270 250',
    seam: 'M210 79 L210 352',
    patch: 'M177 98 L243 98 Q249 98 249 104 L249 148 Q249 154 243 154 L177 154 Q171 154 171 148 L171 104 Q171 98 177 98 Z',
    strapL: 'M60 192 C92 224 130 256 164 280 L170 306 C128 282 86 250 48 212 Z',
    strapR: 'M360 192 C328 224 290 256 256 280 L250 306 C292 282 334 250 372 212 Z',
  };
  // ô đặt chữ / logo: [tâm x, tâm y, rộng, cao, phần nền]
  var SPOTS = { cup: [210, 126, 70, 46, 'panel'], belt: [210, 72, 230, 15, 'belt'], left: [118, 148, 104, 54, 'left'], right: [302, 148, 104, 54, 'right'], tip: [210, 292, 64, 40, 'cup'] };

  function ok() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))) && 'noModule' in document.createElement('script'); }
    catch (e) { return false; }
  }

  /* ─── bề mặt: mặt nạ hình → độ phồng ─── */
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
    var t = new Float32Array(a.length), b = Float32Array.from(a), n = 2 * r + 1;
    for (var p = 0; p < passes; p++) {
      for (var y = 0; y < GY; y++) for (var x = 0; x < GX; x++) { var s = 0; for (var k = -r; k <= r; k++) s += b[y * GX + Math.min(GX - 1, Math.max(0, x + k))]; t[y * GX + x] = s / n; }
      for (y = 0; y < GY; y++) for (x = 0; x < GX; x++) { s = 0; for (k = -r; k <= r; k++) s += t[Math.min(GY - 1, Math.max(0, y + k)) * GX + x]; b[y * GX + x] = s / n; }
    }
    return b;
  }
  var ss = function (a, b, v) { var t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  function heights() {
    var body = blur(mask([P.body]), 7, 3), straps = blur(mask([P.strapL, P.strapR]), 3, 2);
    var groove = blur(mask([P.seam, P.bandLine, P.cupLine], 3), 2, 2), patch = blur(mask([P.patch]), 2, 2);
    var z = new Float32Array(GX * GY);
    for (var j = 0; j < GY; j++) for (var i = 0; i < GX; i++) {
      var k = j * GX + i, x = i * CELL, y = j * CELL, v;
      var hb = Math.pow(ss(0.4, 0.97, body[k]), 0.7);
      if (hb > 0) {
        var g = Math.exp(-(Math.pow(x - CX, 2) / (2 * 52 * 52) + Math.pow(y - 282, 2) / (2 * 66 * 66)));
        v = 15 * hb + 26 * g * hb - 4 * groove[k] * hb + 2.2 * patch[k];
      } else v = straps[k] > 0.3 ? -6 + 4 * Math.sqrt(ss(0.5, 0.97, straps[k])) : 0;
      v -= 0.0027 * Math.pow(x - CX, 2) + 0.011 * Math.pow(Math.max(0, y - 308), 2);
      z[k] = v;
    }
    return z;
  }

  /* ─── ảnh phủ ─── */
  var IMG = {};
  function img(url, done) {
    if (IMG[url]) return IMG[url].complete ? IMG[url] : null;
    var im = new Image(); im.onload = done; im.src = url; IMG[url] = im; return null;
  }
  function luma(hex) { var n = parseInt(String(hex).slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); }
  var GRAIN = null;
  function grain() {
    if (GRAIN) return GRAIN;
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var x = c.getContext('2d'), d = x.createImageData(256, 256);
    for (var i = 0; i < d.data.length; i += 4) { var v = 128 + (Math.random() - 0.5) * 90; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    // vân da: chấm lõm
    x.fillStyle = 'rgba(0,0,0,.18)';
    for (i = 0; i < 1400; i++) { x.beginPath(); x.arc(Math.random() * 256, Math.random() * 256, Math.random() * 1.6 + 0.4, 0, 7); x.fill(); }
    GRAIN = c; return c;
  }
  function paint(c, s, redraw) {
    var x = c.getContext('2d'), col = s.col;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height);
    x.setTransform(TS, 0, 0, TS, 0, 0);
    var body = new Path2D(P.body);
    // dây thun đùi (nằm sau thân)
    [P.strapL, P.strapR].forEach(function (d) {
      var p = new Path2D(d); x.fillStyle = col.strap; x.fill(p);
      x.save(); x.clip(p); x.strokeStyle = luma(col.strap) > 140 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.12)'; x.lineWidth = 1;
      for (var t = 0; t < 420; t += 3.2) { x.beginPath(); x.moveTo(t, 160); x.lineTo(t - 120, 330); x.stroke(); }
      x.restore();
    });
    x.save(); x.clip(body);
    x.fillStyle = col.left; x.fillRect(0, 0, CX, H);
    x.fillStyle = col.right; x.fillRect(CX, 0, CX, H);
    x.fillStyle = col.cup; x.fill(new Path2D(P.cup));
    x.fillStyle = col.belt; x.fill(new Path2D(P.band));
    // vân da
    x.globalCompositeOperation = 'soft-light'; x.globalAlpha = s.material === 'cow' ? 0.32 : s.material === 'micro' ? 0.12 : 0.2;
    x.fillStyle = x.createPattern(grain(), 'repeat'); x.save(); x.scale(1 / TS * 1.4, 1 / TS * 1.4); x.fillRect(0, 0, W * TS, H * TS); x.restore();
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    // miếng logo
    var patch = new Path2D(P.patch);
    x.fillStyle = col.panel; x.fill(patch); x.strokeStyle = col.trim; x.lineWidth = 2.6; x.stroke(patch);
    // viền ống quanh thân + mép đai + đường cup
    x.strokeStyle = col.trim; x.lineWidth = 7; x.stroke(body);
    x.lineWidth = 2.6; x.stroke(new Path2D(P.bandLine));
    // chỉ may
    x.strokeStyle = s.stitch; x.lineWidth = 1.15; x.setLineDash([3.2, 2.4]); x.lineCap = 'round';
    x.save(); x.translate(CX, 205); x.scale(0.962, 0.955); x.translate(-CX, -205); x.stroke(body); x.restore();
    x.save(); x.translate(0, 5); x.stroke(new Path2D(P.bandLine)); x.restore();
    x.beginPath(); x.moveTo(206, 90); x.lineTo(206, 348); x.moveTo(214, 90); x.lineTo(214, 348); x.stroke();
    x.save(); x.translate(CX, 126); x.scale(0.88, 0.84); x.translate(-CX, -126); x.stroke(patch); x.restore();
    x.setLineDash([]);
    // logo
    var lg = s.logo;
    if (lg && lg.url && SPOTS[lg.spot]) {
      var im = img(lg.url, redraw);
      if (im) {
        var L = SPOTS[lg.spot], k = Math.min(L[2] / im.naturalWidth, L[3] / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
        x.save(); if (lg.method === 'embroid') { x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 2; x.shadowOffsetY = 0.8; x.filter = 'saturate(1.15) contrast(1.05)'; }
        x.drawImage(im, L[0] - w / 2, L[1] - h / 2, w, h); x.restore();
      }
    }
    // chữ
    var tx = s.text;
    if (tx && tx.value && SPOTS[tx.spot]) {
      var T = SPOTS[tx.spot], bg = col[T[4]], fs = T[3] * 0.82;
      x.font = '700 ' + fs + 'px ' + tx.font; var mw = x.measureText(tx.value).width;
      if (mw > T[2]) { fs *= T[2] / mw; x.font = '700 ' + fs + 'px ' + tx.font; }
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = luma(bg) > 150 ? '#141414' : '#ffffff';
      if (tx.method === 'embroid') { x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 1.6; x.shadowOffsetY = 0.7; x.strokeStyle = luma(bg) > 150 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)'; x.lineWidth = 0.6; x.strokeText(tx.value, T[0], T[1]); }
      x.fillText(tx.value, T[0], T[1]);
      x.shadowColor = 'transparent';
    }
    x.restore();
  }

  /* ─── cảnh 3D ─── */
  function build(THREE, RoomEnvironment, el) {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    var cv = renderer.domElement; cv.className = 'cx-3d-cv'; el.appendChild(cv);
    var scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.85;
    var key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(-320, 420, 620); scene.add(key);
    var fill = new THREE.DirectionalLight(0xfff4e8, 0.45); fill.position.set(420, -80, 300); scene.add(fill);
    var cam = new THREE.PerspectiveCamera(26, 1, 10, 6000);

    var geo = new THREE.PlaneGeometry(W, H, GX - 1, GY - 1), pos = geo.attributes.position, z = heights();
    for (var k = 0; k < pos.count; k++) pos.setZ(k, z[k]);
    geo.computeVertexNormals();
    var tc = document.createElement('canvas'); tc.width = Math.round(W * TS); tc.height = Math.round(H * TS);
    var tex = new THREE.CanvasTexture(tc); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    var bump = new THREE.CanvasTexture(grain()); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(9, 8);
    var mat = new THREE.MeshPhysicalMaterial({ map: tex, bumpMap: bump, bumpScale: 0.5, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, side: THREE.DoubleSide, alphaTest: 0.5 });
    var mesh = new THREE.Mesh(geo, mat), grp = new THREE.Group(); grp.add(mesh); scene.add(grp);

    var yaw = -0.55, pitch = 0.16, want = { yaw: 0.3, pitch: 0.16 }, dirty = true, raf = 0, last = null, was = false;
    function size() {
      var w = el.clientWidth || 400, h = el.clientHeight || 380;
      renderer.setSize(w, h, false); cam.aspect = w / h;
      var fit = Math.max(H / 2 + 30, (W / 2 + 30) / cam.aspect);
      cam.position.set(0, 0, fit / Math.tan(THREE.MathUtils.degToRad(13))); cam.lookAt(0, -8, 0); cam.updateProjectionMatrix(); dirty = true; loop();
    }
    function loop() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var dy = want.yaw - yaw, dp = want.pitch - pitch, moving = Math.abs(dy) > 0.0005 || Math.abs(dp) > 0.0005;
        if (moving) { yaw += dy * 0.12; pitch += dp * 0.12; dirty = true; }
        else if (was) { yaw = want.yaw; pitch = want.pitch; dirty = true; }   // khung cuối khi vừa dừng xoay → chụp ảnh nhỏ
        was = moving;
        if (dirty) { grp.rotation.set(pitch, yaw, 0); renderer.render(scene, cam); dirty = false; if (!moving && api.onframe) api.onframe(); }
        if (moving || drag) loop();
      });
    }
    // kéo để xoay
    var drag = null;
    cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, yaw: want.yaw, pitch: want.pitch }; cv.setPointerCapture(e.pointerId); el.classList.add('cx-grab'); });
    cv.addEventListener('pointermove', function (e) {
      if (!drag) return;
      want.yaw = Math.max(-0.8, Math.min(0.8, drag.yaw + (e.clientX - drag.x) / 160));
      want.pitch = Math.max(-0.3, Math.min(0.55, drag.pitch + (e.clientY - drag.y) / 220)); loop();
    });
    var up = function () { drag = null; el.classList.remove('cx-grab'); loop(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('dblclick', function () { want.yaw = 0.3; want.pitch = 0.16; loop(); });
    if (window.ResizeObserver) new ResizeObserver(size).observe(el); else window.addEventListener('resize', size);

    var api = {
      update: function (s) {
        last = s;
        paint(tc, s, function () { if (last) api.update(last); });
        tex.needsUpdate = true;
        var gloss = s.finish !== 'matte';
        mat.roughness = gloss ? 0.34 : 0.74; mat.clearcoat = gloss ? 0.6 : 0.05; mat.clearcoatRoughness = gloss ? 0.25 : 0.6;
        mat.bumpScale = s.material === 'cow' ? 1.1 : s.material === 'micro' ? 0.25 : 0.5;
        dirty = true; loop();
      },
      view: function (yw, pt) { want.yaw = yw; want.pitch = pt; loop(); },
      snapshot: function () { try { return cv.toDataURL('image/webp', 0.82); } catch (e) { return ''; } },
      onframe: null,
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
