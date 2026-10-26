/*
 * Đo trên trang thật để hoàn thiện danh mục nội dung. Chạy trong Console của trang /admin (đã đăng nhập),
 * khi chưa sửa nội dung nào (data/cms.json trống). Ghi kết quả vào data/seed/cms-catalog.json qua /api/cms/capture:
 *   - chữ đang hiển thị (VI + EN) của mọi phần tử data-cms, đánh dấu chữ bị ẩn
 *   - từng vị trí ảnh/video: khu vực, khung hiển thị trên máy tính (1440px) và điện thoại (390px) → kích thước gợi ý
 */
(async () => {
  const tk = localStorage.getItem('dc_admin_token') || window.__tk;
  const H = { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' };
  const PAGES = [['home', '/'], ['shop', '/shop'], ['course', '/khoa-hoc'], ['services', '/dich-vu-setup']];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const dec = s => s.replace(/&nbsp;/g, '\u00a0').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  const cat = await (await fetch('/api/cms/catalog', { headers: H })).json();
  async function frame(url, w, h) {
    const f = document.createElement('iframe');
    f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;opacity:0;pointer-events:none;z-index:-1;border:0`;
    f.src = url; document.body.appendChild(f);
    await new Promise(r => { f.onload = r; });
    await sleep(1300);
    return f;
  }
  const shown = (el, w) => { const r = el.getBoundingClientRect(), cs = w.getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const views = (page, w) => page === 'shop'
    ? [() => {}, () => w.openDetail('p1'), () => w.eval("cart['p1::12oz::red']=1;sync();showCheckout()"), () => w.eval('openCart()'), () => w.eval("closeCart();document.getElementById('success').classList.add('active')")]
    : [() => {}];
  const fields = {}, media = {};
  function rec(key, boxEl, el, w, tag, bg) {
    const m = media[key] || (media[key] = { key, sections: [], d: null, m: null, natural: null, bg: false });
    const sec = boxEl.closest('[data-cms-sec]');
    if (sec && !m.sections.includes(sec.dataset.cmsSec)) m.sections.push(sec.dataset.cmsSec);
    if (bg) m.bg = true;
    if (el.tagName === 'IMG' && el.naturalWidth) m.natural = [el.naturalWidth, el.naturalHeight];
    const v = el.tagName === 'SOURCE' ? el.parentElement : el;
    if (v.tagName === 'VIDEO' && v.videoWidth) m.natural = [v.videoWidth, v.videoHeight];
    if (shown(boxEl, w)) { const r = boxEl.getBoundingClientRect(); if (!m[tag] || r.width > m[tag][0]) m[tag] = [Math.round(r.width), Math.round(r.height)]; }
  }
  function collectMedia(d, w, page, tag) {
    const jsByUrl = {};
    cat.media.filter(m => m.page === page && m.src === 'js').forEach(m => { jsByUrl[m.url] = m.key; });
    d.querySelectorAll('[data-cms-media],[data-cms-poster]').forEach(el => {
      const box = el.tagName === 'SOURCE' ? el.parentElement : el;
      if (el.dataset.cmsMedia) rec(el.dataset.cmsMedia, box, el, w, tag);
      if (el.dataset.cmsPoster) rec(el.dataset.cmsPoster, box, el, w, tag);
    });
    d.querySelectorAll('img,video,source').forEach(el => {
      if (el.dataset.cmsMedia) return;
      const key = jsByUrl[el.getAttribute('src') || ''];
      if (key) rec(key, el.tagName === 'SOURCE' ? el.parentElement : el, el, w, tag);
    });
    d.querySelectorAll('body *').forEach(el => {
      const bg = w.getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') return;
      (bg.match(/url\("?([^")]+)"?\)/g) || []).forEach(u => {
        const p = new URL(u.replace(/^url\("?|"?\)$/g, ''), location.origin).pathname;
        if (jsByUrl[p]) rec(jsByUrl[p], el, el, w, tag, true);
      });
    });
  }
  for (const [page, url] of PAGES) {
    for (const [W, Hh, tag] of [[1440, 900, 'd'], [390, 844, 'm']]) {
      const f = await frame(url, W, Hh);
      const w = f.contentWindow, d = f.contentDocument;
      const els = () => d.querySelectorAll('[data-cms]:not([data-cms-attr]):not(title)');
      if (tag === 'd') els().forEach(el => { const k = el.dataset.cms; if (!fields[k]) fields[k] = { vi: dec(el.innerHTML.trim()), vis: false }; });
      for (const v of views(page, w)) {
        try { v(); } catch (e) {}
        await sleep(500);
        els().forEach(el => { const o = fields[el.dataset.cms]; if (o && shown(el, w)) o.vis = true; });
        collectMedia(d, w, page, tag);
      }
      if (tag === 'd') {
        const b = d.querySelector('.lang-switch [data-lang="en"]');
        if (b) { b.click(); await sleep(400); els().forEach(el => { const o = fields[el.dataset.cms]; if (o && o.en == null) o.en = dec(el.innerHTML.trim()); }); d.querySelector('.lang-switch [data-lang="vi"]').click(); }
      }
      f.remove();
    }
  }
  localStorage.removeItem('dc_lang');
  // kích thước gợi ý: gấp 2 khung trên máy tính / gấp 3 khung trên điện thoại (màn hình độ nét cao)
  const RATIOS = [[16, 9], [21, 9], [3, 2], [4, 3], [1, 1], [4, 5], [3, 4], [2, 3], [9, 16]];
  const ratioName = (w, h) => { const r = w / h; const hit = RATIOS.find(([a, b]) => Math.abs(r - a / b) / (a / b) < 0.05); return hit ? hit.join(':') : (Math.round(r * 100) / 100) + ':1'; };
  const list = cat.media.map(c => {
    const m = media[c.key] || { sections: [], d: null, m: null, natural: null, bg: false };
    const box = m.d || m.m || m.natural || [1200, 900];
    const cap = c.kind === 'video' ? 1920 : 2560;
    let w = Math.max((m.d ? m.d[0] : 0) * 2, (m.m ? m.m[0] : 0) * 3, 400);
    w = Math.min(cap, Math.ceil(w / 100) * 100);
    let h = Math.round(w / (box[0] / box[1]) / 10) * 10;
    // video / ảnh nền tràn khung: khung đổi theo màn hình → gợi ý khổ chuẩn 16:9
    const cover = m.bg || c.kind === 'video';
    if (cover && box[0] / box[1] > 1.35) { w = Math.min(cap, 1920); h = Math.round(w * 9 / 16); }
    const full = m.d && m.d[0] >= 1200;
    return { key: c.key, section: m.sections[0] || c.section, sections: m.sections, natural: m.natural, box: { desktop: m.d, mobile: m.m }, hidden: !m.d && !m.m,
      rec: { w, h, ratio: ratioName(w, h), maxKB: c.kind === 'video' ? 8000 : (full ? 600 : 350), format: c.kind === 'video' ? 'MP4 (H.264), không cần âm thanh, 6–15 giây' : 'JPG hoặc WebP', cover: m.bg || c.kind === 'video' || undefined } };
  });
  const r = await fetch('/api/cms/capture', { method: 'POST', headers: H, body: JSON.stringify({ fields, media: list }) });
  window.__capture = { fields, media: list };
  console.log('capture xong', await r.json());
  return { res: 'ok', hiddenFields: Object.values(fields).filter(f => !f.vis).length, hiddenMedia: list.filter(m => m.hidden).map(m => m.key) };
})();
