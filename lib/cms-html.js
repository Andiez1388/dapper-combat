/*
 * Áp phần "cấu trúc" đã chỉnh trong /admin vào HTML khi phục vụ trang:
 *   bố cục (ẩn / đổi thứ tự khu vực) · danh sách (thêm / nhân bản / bớt / sắp xếp mục) · số thứ tự 01, 02…
 *   ẩn từng chữ / ảnh / nút · thay icon · đổi đường dẫn link · chữ thay thế của ảnh (alt)
 * Đánh dấu trong HTML do tools/cms-structure.js gắn: data-cms-block, data-cms-list, data-cms-item, data-cms-num,
 * data-cms-icon, data-cms-link. Mục thêm mới: mọi khóa bên trong được thêm đuôi "@<mã mục>" (vd home.faq.q1@a3).
 */
const { parseDocument, DomUtils } = require('htmlparser2');

const parse = s => parseDocument(s, { withStartIndices: true, withEndIndices: true, decodeEntities: false });
const isEl = e => e && (e.type === 'tag' || e.type === 'script' || e.type === 'style');
const kids = el => (el.children || []).filter(isEl);
const slice = (src, el) => src.slice(el.startIndex, el.endIndex + 1);
function applyEdits(src, edits) {
  edits.sort((a, b) => b.at - a.at);
  for (const e of edits) src = src.slice(0, e.at) + e.ins + src.slice(e.at + e.del);
  return src;
}
const esc = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// thêm thuộc tính vào thẻ mở (nếu chưa có)
const addAttr = (el, name, value) => el.attribs[name] != null ? null : { at: el.startIndex + 1 + el.name.length, del: 0, ins: value == null ? ` ${name}` : ` ${name}="${esc(value)}"` };

/* ─── Bố cục trang ───────────────────────────────────────────────────────── */
// lay = { order: [id khối…], hide: { id: true } }; fixed = id khối không được đổi chỗ
function layout(src, lay, fixed) {
  if (!lay) return src;
  const findBlocks = () => DomUtils.findAll(e => e.attribs && e.attribs['data-cms-block'], parse(src).children);
  if (lay.hide) src = applyEdits(src, findBlocks().filter(el => lay.hide[el.attribs['data-cms-block']]).map(el => addAttr(el, 'data-cms-off')).filter(Boolean));
  const blocks = findBlocks(), edits = [];
  if (Array.isArray(lay.order) && lay.order.length) {
    // đổi chỗ trong từng nhóm khối cùng cha; khối cố định (menu, chân trang…) đứng yên
    const groups = new Map();
    for (const el of blocks) { if (fixed.has(el.attribs['data-cms-block'])) continue; const g = groups.get(el.parent) || []; g.push(el); groups.set(el.parent, g); }
    for (const slots of groups.values()) {
      const ids = slots.map(el => el.attribs['data-cms-block']);
      const seq = lay.order.filter(id => ids.includes(id)).concat(ids.filter(id => !lay.order.includes(id)));
      slots.forEach((el, i) => { if (seq[i] !== ids[i]) edits.push({ at: el.startIndex, del: el.endIndex + 1 - el.startIndex, ins: slice(src, slots[ids.indexOf(seq[i])]) }); });
    }
  }
  return edits.length ? applyEdits(src, edits) : src;
}

/* ─── Danh sách ──────────────────────────────────────────────────────────── */
// bản sao 1 mục: mọi khóa bên trong thêm đuôi @id; bỏ id="" (tránh trùng); mục ngoài cùng đổi data-cms-item
const KEY_ATTR = /(\s(?:data-cms|data-cms-media|data-cms-poster|data-cms-icon|data-cms-link|data-cms-list|data-i18n|data-ph))="([^"]*)"/g;
function cloneItem(html, id) {
  return html.replace(/(\sdata-cms-item=")[^"]*"/, `$1${id}"`)
    .replace(KEY_ATTR, (m, a, v) => `${a}="${v}@${id}"`)
    .replace(/\sid="[^"]*"/g, '');
}
// L = { khóa: { order: [id…], add: { id: { from } } } }
function lists(src, L) {
  const done = new Set();
  for (let guard = 0; guard < 400; guard++) {
    const doc = parse(src);
    const box = DomUtils.findOne(e => e.attribs && e.attribs['data-cms-list'] && !done.has(e.attribs['data-cms-list']) &&
      (L[e.attribs['data-cms-list']] || e.attribs['data-cms-dup']), doc.children, true);
    if (!box) break;
    const key = box.attribs['data-cms-list'];
    done.add(key);
    const items = kids(box).filter(k => k.attribs['data-cms-item'] != null);
    if (!items.length) continue;
    const byId = new Map(items.map(it => [it.attribs['data-cms-item'], slice(src, it)]));
    const o = L[key];
    let seq;
    if (o && Array.isArray(o.order)) {
      seq = [];
      for (const id of o.order) {
        if (byId.has(id)) seq.push(byId.get(id));
        else if (o.add && o.add[id] && byId.has(String(o.add[id].from))) seq.push(cloneItem(byId.get(String(o.add[id].from)), id));
      }
    } else seq = items.map(it => slice(src, it));
    const dup = +box.attribs['data-cms-dup'] || 1;
    if (dup > 1) seq = Array.from({ length: dup }, () => seq).flat();
    const first = items[0], last = items[items.length - 1];
    const gap = items.length > 1 ? src.slice(first.endIndex + 1, items[1].startIndex) : '\n';
    // phần không phải mục nằm xen giữa (hiếm) → giữ lại ở cuối
    const extra = [];
    for (let n = first.next; n && n !== last; n = n.next) if (!(isEl(n) && n.attribs['data-cms-item'] != null) && !(n.type === 'text' && !n.data.trim())) extra.push(slice(src, n));
    src = src.slice(0, first.startIndex) + seq.join(/\S/.test(gap) ? '\n' : gap) + extra.join('') + src.slice(last.endIndex + 1);
  }
  return src;
}
// số thứ tự (data-cms-num) theo vị trí mới, giữ độ dài (01, 02…)
function renumber(src) {
  const doc = parse(src), edits = [];
  for (const box of DomUtils.findAll(e => e.attribs && e.attribs['data-cms-list'], doc.children)) {
    kids(box).filter(k => k.attribs['data-cms-item'] != null).forEach((it, i) => {
      const num = DomUtils.findOne(e => e.attribs && e.attribs['data-cms-num'] != null, [it], true);
      if (!num || !num.children.length) return;
      const a = num.children[0].startIndex, b = num.children[num.children.length - 1].endIndex + 1, cur = src.slice(a, b).trim();
      if (!/^\d+$/.test(cur)) return;
      const v = String(i + 1).padStart(cur.length, '0');
      if (v !== cur) edits.push({ at: a, del: b - a, ins: v });
    });
  }
  return edits.length ? applyEdits(src, edits) : src;
}

/* ─── Ẩn, icon, link, alt ────────────────────────────────────────────────── */
const ATTRS = ['data-cms', 'data-cms-media', 'data-cms-poster', 'data-cms-icon', 'data-cms-link'];
function marks(src, hide, icons, links, alts) {
  const doc = parse(src), edits = [];
  // các phần tử lồng nhau → xử lý từ trong ra ngoài trên chuỗi (đổi icon thay cả thẻ, còn lại chỉ sửa thẻ mở)
  const els = DomUtils.findAll(e => e.attribs && ATTRS.some(a => e.attribs[a] != null), doc.children);
  for (const el of els) {
    const a = el.attribs;
    const off = ATTRS.some(x => a[x] != null && hide[a[x]]);
    if (a['data-cms-icon'] && icons[a['data-cms-icon']] && el.name === 'svg') {
      let svg = mergeSvg(slice(src, el), icons[a['data-cms-icon']]);
      if (off) svg = svg.replace(/^<svg\b/, '<svg data-cms-off');
      edits.push({ at: el.startIndex, del: el.endIndex + 1 - el.startIndex, ins: svg, whole: true });
      continue;
    }
    const tag = src.slice(el.startIndex, src.indexOf('>', el.startIndex) + 1);
    let t = tag;
    if (off && a['data-cms-off'] == null) t = t.replace(/^<([a-zA-Z0-9]+)/, '<$1 data-cms-off');
    if (a['data-cms-link'] && links[a['data-cms-link']] != null) {
      const href = links[a['data-cms-link']];
      t = /\shref="[^"]*"/.test(t) ? t.replace(/(\shref=")[^"]*"/, `$1${esc(href)}"`) : t.replace(/^<a\b/, `<a href="${esc(href)}"`);
      t = t.replace(/\s(target|rel)="[^"]*"/g, '');
      if (/^https?:\/\//.test(href)) t = t.replace(/^<a\b/, '<a target="_blank" rel="noopener"');
    }
    const mk = a['data-cms-media'];
    if (mk && alts[mk] != null && el.name === 'img') t = /\salt="[^"]*"/.test(t) ? t.replace(/(\salt=")[^"]*"/, `$1${esc(alts[mk])}"`) : t.replace(/^<img\b/, `<img alt="${esc(alts[mk])}"`);
    if (t !== tag) edits.push({ at: el.startIndex, del: tag.length, ins: t });
  }
  // icon thay cả thẻ: bỏ các sửa nằm bên trong nó
  const wholes = edits.filter(e => e.whole);
  const keep = edits.filter(e => e.whole || !wholes.some(w => e.at > w.at && e.at < w.at + w.del));
  return keep.length ? applyEdits(src, keep) : src;
}

/* ─── Icon: ghép icon mới vào khung icon cũ ──────────────────────────────── */
// giữ thuộc tính bố cục của icon cũ (class, kích thước, style, aria…) + lấy hình & màu nét của icon mới
const KEEP = /^(class|width|height|style|aria-[\w-]+|role|focusable|data-[\w-]+)$/;
const LOOK = /^(viewBox|fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|stroke-miterlimit|fill-rule|clip-rule|preserveAspectRatio|xmlns(:\w+)?)$/;
function attrsOf(tag) { const o = {}; for (const m of tag.matchAll(/\s([\w:-]+)(?:="([^"]*)")?/g)) o[m[1]] = m[2] == null ? '' : m[2]; return o; }
function mergeSvg(orig, ov) {
  const open = orig.match(/^<svg\b[^>]*>/i);
  const oa = attrsOf(open ? open[0].slice(4, -1) : '');
  const keep = Object.entries(oa).filter(([k]) => KEEP.test(k)).map(([k, v]) => ` ${k}="${v}"`).join('');
  if (ov.url) {
    const vb = (oa.viewBox || '0 0 24 24').split(/[\s,]+/).map(Number);
    return `<svg${keep} viewBox="${vb.join(' ')}" xmlns="http://www.w3.org/2000/svg"><image href="${esc(ov.url)}" x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" preserveAspectRatio="xMidYMid meet"/></svg>`;
  }
  const m = String(ov.svg || '').match(/^\s*<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/i);
  if (!m) return orig;
  const look = Object.entries(attrsOf(m[1])).filter(([k]) => LOOK.test(k)).map(([k, v]) => ` ${k}="${v}"`).join('');
  return `<svg${keep}${look}>${m[2]}</svg>`;
}

/* ─── Làm sạch SVG tải lên ───────────────────────────────────────────────── */
// bỏ script, sự kiện on…, link javascript:, nội dung nhúng; SVG có <style> → dùng dạng ảnh (tránh đè CSS của trang)
function cleanSvg(svg) {
  let s = String(svg || '').replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>|<!--[\s\S]*?-->/gi, '').trim();
  const m = s.match(/<svg\b[\s\S]*<\/svg>/i);
  if (!m) return null;
  s = m[0]
    .replace(/<(script|foreignObject|iframe|object|embed|audio|video)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|foreignObject|iframe|object|embed)\b[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:xlink:)?href\s*=\s*("|')\s*(?!#|data:image\/)[^"']*\1/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/'/g, '"');
  if (s.length > 60000) return null;
  if (/<style[\s>]/i.test(s)) return { url: 'data:image/svg+xml;base64,' + Buffer.from(s).toString('base64') };
  return { svg: s };
}

module.exports = { layout, lists, renumber, marks, mergeSvg, cleanSvg, cloneItem };
