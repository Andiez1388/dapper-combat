/* Dapper Combat — Quản trị: yêu cầu file ảnh / video dùng chung cho MỌI chỗ tải lên
   (Hình ảnh & video, sản phẩm, danh mục, võ sĩ, sự kiện, trang phụ, logo / favicon, icon).
   A.media.html(spec)  → khung "Yêu cầu file" đặt ngay dưới nút tải: kích thước, độ nét (1080p, không 4K), định dạng, dung lượng tối đa.
   A.media.prep(file, spec) → kiểm tra trước khi tải lên:
     ảnh JPG / PNG / WebP to hơn cần → tự thu nhỏ + nén về đúng kích thước và dưới dung lượng tối đa (bỏ luôn thông tin GPS trong ảnh);
     video nặng hơn mức tối đa hoặc 2K / 4K → không nhận, báo cách xuất lại.
   spec: { kind: 'image' | 'video' | 'icon', w, h (0 = cao tùy ý), maxKB, cover (cắt tràn khung), alpha (cần nền trong suốt), dur (thời lượng gợi ý) } */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A) return;
  var esc = A.esc;
  var KB = 1024, VIDEO_EDGE = 1920, GIF_MAX_KB = 2000, VIDEO_SEC = 30;
  var TOOLS = 'CapCut hoặc HandBrake (miễn phí)';

  function num(n) { return (Math.round(Number(n) || 0)).toLocaleString('vi-VN'); }
  function kb(n) { n = Number(n) || 0; return n >= 1000 ? (n / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' MB' : num(n) + ' KB'; }
  function bytes(n) { return kb(n / KB); }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function ratioOf(w, h) {
    if (!w || !h) return '';
    var RATIOS = [[16, 9], [21, 9], [3, 2], [4, 3], [1, 1], [4, 5], [3, 4], [2, 3], [9, 16], [1.91, 1]];
    var r = w / h, hit = RATIOS.find(function (x) { return Math.abs(r - x[0] / x[1]) / (x[0] / x[1]) < 0.03; });
    if (hit) return hit[0] + ':' + hit[1];
    var g = gcd(w, h); return w / g <= 21 && h / g <= 21 ? w / g + ':' + h / g : (Math.round(r * 100) / 100).toLocaleString('vi-VN') + ':1';
  }
  function norm(s) {
    s = s || {};
    var kind = s.kind === 'video' || s.kind === 'icon' ? s.kind : 'image';
    var w = Math.round(Number(s.w)) || 0, h = Math.round(Number(s.h)) || 0;
    var maxKB = Math.round(Number(s.maxKB || s.kb)) || (kind === 'video' ? 5000 : kind === 'icon' ? 60 : 400);
    return { kind: kind, w: w, h: h, ratio: s.ratio || ratioOf(w, h), maxKB: maxKB, cover: !!s.cover, alpha: !!s.alpha || kind === 'icon',
      dur: s.dur || (kind === 'video' ? '6–15 giây' : ''), note: s.note || '' };
  }
  // yêu cầu của một ô Hình ảnh & video (danh mục nội dung: m.rec)
  function fromRec(m) {
    var r = (m && m.rec) || {};
    return norm({ kind: m && m.kind, w: r.w, h: r.h, ratio: r.ratio, maxKB: r.maxKB, cover: r.cover, alpha: /png/i.test(r.format || '') });
  }

  // ── khung "Yêu cầu file" ─────────────────────────────────────────────────
  function rows(spec) {
    var s = norm(spec), out = [];
    var row = function (k, v) { out.push('<div><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>'); };
    if (s.w && s.h) row('Kích thước', '<strong>' + num(s.w) + ' × ' + num(s.h) + ' px</strong>' + (s.ratio ? ' (tỉ lệ ' + esc(s.ratio) + (s.h > s.w ? ', dọc' : s.w > s.h ? ', ngang' : ', vuông') + ')' : ''));
    else if (s.w) row('Kích thước', 'Ngang <strong>' + num(s.w) + ' px</strong>, cao tùy ý');
    else if (s.h) row('Kích thước', 'Cao <strong>≥ ' + num(s.h) + ' px</strong>, ngang tùy theo logo');
    if (s.kind === 'video') {
      row('Độ nét', '<strong>1080p (Full HD)</strong>' + (s.w && s.h ? ' — ' + num(s.w) + ' × ' + num(s.h) : '') + '. <strong>Không dùng 2K / 4K</strong>: web chỉ hiện tối đa 1080p, file 4K nặng gấp ~4 lần mà không nét hơn.');
      row('Định dạng', 'MP4 (H.264), 25–30 khung hình/giây, <strong>không cần âm thanh</strong> (video tự chạy không tiếng)');
      row('Thời lượng', esc(s.dur) + ', cảnh đầu và cuối nối được để lặp lại mượt');
      row('Dung lượng tối đa', '<strong>' + esc(kb(s.maxKB)) + '</strong> — video nặng hơn sẽ không nhận. Xuất lại bằng ' + esc(TOOLS) + ': 1080p, 30 khung hình/giây, bỏ âm thanh.');
    } else if (s.kind === 'icon') {
      row('Định dạng', '<strong>SVG</strong> (nét nhất, tự đổi màu theo chữ) hoặc PNG / WebP nền trong suốt');
      row('Dung lượng tối đa', '<strong>' + esc(kb(s.maxKB)) + '</strong> (SVG) — PNG to hơn ' + num(s.w || 256) + ' px được tự thu nhỏ');
    } else {
      row('Độ nét', 'Ảnh chụp từ điện thoại / máy ảnh dùng được luôn, <strong>không cần ảnh 4K</strong> — ảnh to hơn kích thước trên được tự thu nhỏ khi tải lên. Ảnh nhỏ hơn sẽ bị mờ.');
      row('Định dạng', s.alpha ? '<strong>PNG hoặc WebP nền trong suốt</strong>' : '<strong>JPG hoặc WebP</strong> (PNG chỉ khi cần nền trong suốt)');
      row('Dung lượng tối đa', '<strong>' + esc(kb(s.maxKB)) + '</strong> — ảnh nặng hơn được tự nén về mức này khi tải lên');
    }
    var notes = [];
    if (s.cover) notes.push((s.kind === 'video' ? 'Video' : 'Ảnh') + ' được cắt tràn khung — đặt chủ thể ở giữa, chừa khoảng trống quanh mép.');
    if (s.note) notes.push(esc(s.note));
    if (notes.length) row('Lưu ý', notes.join(' '));
    return out.join('');
  }
  // tóm tắt một dòng (vd. ảnh trong danh sách ở màn Chữ, icon) — bấm để xem đủ yêu cầu
  function line(spec) {
    var s = norm(spec), size = s.w && s.h ? num(s.w) + ' × ' + num(s.h) + ' px' + (s.ratio ? ' (' + s.ratio + ')' : '') : s.w ? 'ngang ' + num(s.w) + ' px' : s.h ? 'cao ≥ ' + num(s.h) + ' px' : '';
    if (s.kind === 'video') return 'Video 1080p' + (size ? ' · ' + size : '') + ' · MP4 không tiếng · ' + s.dur + ' · tối đa ' + kb(s.maxKB) + ' · không dùng 4K';
    if (s.kind === 'icon') return 'SVG hoặc PNG nền trong suốt · tối đa ' + kb(s.maxKB);
    return 'Ảnh ' + size + ' · ' + (s.alpha ? 'PNG / WebP nền trong suốt' : 'JPG / WebP') + ' · tối đa ' + kb(s.maxKB) + ' (tự nén)';
  }
  function html(spec, opt) {
    var dl = '<dl class="cms-spec mspec" aria-label="Yêu cầu file">' + rows(spec) + '</dl>';
    return opt && opt.compact ? '<details class="mspec-more"><summary>Yêu cầu file: ' + esc(line(spec)) + '</summary>' + dl + '</details>' : dl;
  }

  // ── đo file ──────────────────────────────────────────────────────────────
  function probe(file, kind) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var fin = function (r) { clearTimeout(t); URL.revokeObjectURL(url); resolve(r); };
      var t = setTimeout(function () { fin(null); }, 15000);
      if (kind === 'video') {
        var v = document.createElement('video'); v.preload = 'metadata'; v.muted = true;
        v.onloadedmetadata = function () { fin(v.videoWidth ? { w: v.videoWidth, h: v.videoHeight, sec: v.duration } : null); };
        v.onerror = function () { fin(null); };
        v.src = url;
      } else {
        var i = new Image();
        i.onload = function () { fin(i.naturalWidth ? { w: i.naturalWidth, h: i.naturalHeight, img: i } : null); };
        i.onerror = function () { fin(null); };
        i.src = url;
      }
    });
  }
  var WEBP = null;
  function webpOk() {
    if (WEBP === null) { try { var c = document.createElement('canvas'); c.width = c.height = 1; WEBP = c.toDataURL('image/webp').indexOf('data:image/webp') === 0; } catch (e) { WEBP = false; } }
    return WEBP;
  }
  function hasAlpha(img) {
    try {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var x = c.getContext('2d'); x.drawImage(img, 0, 0, 64, 64);
      var d = x.getImageData(0, 0, 64, 64).data;
      for (var i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
    } catch (e) { /* bỏ qua */ }
    return false;
  }
  function toBlob(canvas, type, q) { return new Promise(function (ok) { canvas.toBlob(function (b) { ok(b); }, type, q); }); }
  // thu nhỏ về đúng khung gợi ý (ảnh vẫn phủ kín khung) rồi nén dần tới khi ≤ dung lượng tối đa
  function shrink(file, d, s) {
    var tw = s.w || (s.h ? Math.round(s.h * d.w / d.h) : d.w), th = s.h || Math.round(tw * d.h / d.w);
    var scale = Math.min(1, Math.max(tw / d.w, th / d.h));
    var alpha = /png|webp/.test(file.type) && hasAlpha(d.img);
    var type = alpha ? (webpOk() ? 'image/webp' : 'image/png') : 'image/jpeg';
    var limit = s.maxKB * KB, Q = type === 'image/png' ? [1] : [0.86, 0.8, 0.74, 0.68, 0.62];
    var round = 0;
    var attempt = function () {
      var W = Math.max(1, Math.round(d.w * scale)), H = Math.max(1, Math.round(d.h * scale));
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d');
      if (!alpha) { x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); }
      x.imageSmoothingQuality = 'high';
      x.drawImage(d.img, 0, 0, W, H);
      var qi = 0;
      var tryQ = function () {
        return toBlob(c, type, Q[qi]).then(function (b) {
          if (!b) return null;
          if (b.size <= limit) return { blob: b, w: W, h: H };
          if (++qi < Q.length) return tryQ();
          if (++round > 6) return { blob: b, w: W, h: H };
          scale *= 0.85; return attempt();
        });
      };
      return tryQ();
    };
    return attempt().then(function (r) {
      if (!r) return null;
      var ext = { 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/png': '.png' }[type];
      var name = String(file.name || 'anh').replace(/\.[^.]+$/, '') + ext;
      var out;
      try { out = new File([r.blob], name, { type: type }); } catch (e) { out = r.blob; out.name = name; }
      return { file: out, w: r.w, h: r.h };
    });
  }

  // ── kiểm tra + chuẩn bị file trước khi tải lên ───────────────────────────
  // → Promise<{ file, lines: [ghi chú], warn: [cảnh báo], dims: [rộng, cao] của file gốc }>; không nhận được → reject { message }
  function prep(file, spec) {
    var s = norm(spec), fail = function (m) { return Promise.reject({ message: m }); };
    var name = String(file.name || '').toLowerCase(), size = file.size || 0;
    if (s.kind === 'video') {
      if (!/^video\/(mp4|webm)$/.test(file.type)) return fail('Chỉ nhận video MP4 (H.264) hoặc WEBM.');
      if (size > s.maxKB * KB) return fail('Video nặng ' + bytes(size) + ' — tối đa ' + kb(s.maxKB) + ' cho vị trí này. Xuất lại bằng ' + TOOLS + ': 1080p, 30 khung hình/giây, bỏ âm thanh, cắt còn ' + s.dur + '.');
      return probe(file, 'video').then(function (d) {
        var lines = ['File đã chọn: ' + (d ? num(d.w) + ' × ' + num(d.h) + ' px · ' + (d.sec ? Math.round(d.sec) + ' giây · ' : '') : '') + bytes(size)], warn = [];
        if (d && Math.max(d.w, d.h) > VIDEO_EDGE * 1.05) return fail('Video đang ' + num(d.w) + ' × ' + num(d.h) + ' px (2K / 4K) — web chỉ hiện tối đa 1080p. Xuất lại ở 1080p (' + (d.h > d.w ? '1080 × 1920' : '1920 × 1080') + ') bằng ' + TOOLS + '.');
        if (d && s.w && Math.max(d.w, d.h) < Math.max(s.w, s.h) * 0.7) warn.push('⚠ Video nhỏ hơn 1080p (' + num(d.w) + ' × ' + num(d.h) + ' px) — có thể bị mờ.');
        if (d && s.w && s.h && Math.abs(d.w / d.h - s.w / s.h) / (s.w / s.h) > 0.12) warn.push('⚠ Khác tỉ lệ khung ' + s.ratio + ' — video sẽ bị cắt bớt.');
        if (d && d.sec > VIDEO_SEC) warn.push('⚠ Video dài ' + Math.round(d.sec) + ' giây — nên ' + s.dur + ' để nhẹ và lặp lại mượt.');
        return { file: file, lines: lines.concat(warn), warn: warn, dims: d ? [d.w, d.h] : null };
      });
    }
    var isSvg = file.type === 'image/svg+xml' || /\.svg$/.test(name);
    if (isSvg) {
      if (s.kind !== 'icon') return fail('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
      if (size > s.maxKB * KB) return fail('File SVG nặng ' + bytes(size) + ' — tối đa ' + kb(s.maxKB) + '. Xuất lại SVG tối giản từ phần mềm thiết kế.');
      return Promise.resolve({ file: file, lines: [], warn: [] });
    }
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return fail('Chỉ nhận ảnh JPG, PNG hoặc WebP' + (s.kind === 'icon' ? ' (hoặc SVG)' : '') + '.');
    if (size > 40 * 1024 * KB) return fail('Ảnh nặng ' + bytes(size) + ' — quá lớn để xử lý. Chọn ảnh dưới 40 MB.');
    var gif = file.type === 'image/gif';
    if (gif && size > GIF_MAX_KB * KB) return fail('GIF nặng ' + bytes(size) + ' — tối đa ' + kb(GIF_MAX_KB) + '. Dùng ảnh JPG / WebP, hoặc video MP4 thay cho ảnh động.');
    return probe(file, 'image').then(function (d) {
      var lines = ['File đã chọn: ' + (d ? num(d.w) + ' × ' + num(d.h) + ' px · ' : '') + bytes(size)], warn = [];
      var tw = s.w, th = s.h;
      if (d && tw && d.w < tw * 0.7 && (!th || d.h < th * 0.7 || d.w / d.h < tw / th)) warn.push('⚠ Ảnh nhỏ hơn gợi ý (' + num(d.w) + ' × ' + num(d.h) + ' px so với ' + num(tw) + (th ? ' × ' + num(th) : '') + ' px) — có thể bị mờ.');
      else if (d && !tw && th && d.h < th) warn.push('⚠ Ảnh thấp hơn ' + num(th) + ' px — có thể bị mờ trên màn hình nét cao.');
      if (d && tw && th && Math.abs(d.w / d.h - tw / th) / (tw / th) > 0.12) warn.push('⚠ Khác tỉ lệ ' + s.ratio + ' — ' + (s.cover ? 'ảnh sẽ bị cắt bớt.' : 'ảnh vẫn hiện đủ nhưng lệch khung.'));
      if (s.alpha && !/png|webp|gif/.test(file.type)) warn.push('⚠ Nên dùng PNG / WebP nền trong suốt — ảnh JPG sẽ có nền trắng.');
      if (!d || gif) {
        if (size > s.maxKB * KB) warn.push('⚠ Dung lượng ' + bytes(size) + ' — vượt mức ' + kb(s.maxKB) + ', trang sẽ tải chậm.');
        return { file: file, lines: lines.concat(warn), warn: warn, dims: d ? [d.w, d.h] : null };
      }
      var big = (tw && d.w > tw * 1.15 && (!th || d.h > th * 1.15)) || (!tw && th && d.h > th * 3) || size > s.maxKB * KB;
      if (!big) return { file: file, lines: lines.concat(warn), warn: warn, dims: [d.w, d.h] };
      return shrink(file, d, s.kind === 'icon' ? { w: s.w || 256, h: s.h || 256, maxKB: Math.max(s.maxKB, 150) } : s).then(function (r) {
        if (!r || (r.file.size >= size && size <= s.maxKB * KB)) return { file: file, lines: lines.concat(warn), warn: warn, dims: [d.w, d.h] };
        lines.push('Đã tự thu nhỏ & nén: ' + num(r.w) + ' × ' + num(r.h) + ' px · ' + bytes(r.file.size));
        if (r.file.size > s.maxKB * KB) warn.push('⚠ Vẫn nặng ' + bytes(r.file.size) + ' sau khi nén — nên chọn ảnh khác.');
        return { file: r.file, lines: lines.concat(warn), warn: warn, dims: [d.w, d.h] };
      });
    });
  }

  A.media = { html: html, rows: rows, line: line, prep: prep, spec: norm, fromRec: fromRec, kb: kb, bytes: bytes };
})();
