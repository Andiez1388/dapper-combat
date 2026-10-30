/*
 * Dapper Combat Academy Ranking — bảng xếp hạng nội bộ học viện (kiểu BoxRec): võ sĩ, sự kiện (fight night / sparring / kỳ đánh giá), trận đấu và kết quả.
 * Dữ liệu: data/fighters.json, data/events.json (lần đầu chép từ data/seed/). Sửa ở /admin → Academy Ranking.
 *
 * Cách tính (tự động mỗi lần đọc):
 *   - Điểm kỹ năng = trung bình 6 kỹ năng HLV chấm (0–100) × 10 → 0–1000
 *   - Điểm xếp hạng = điểm kỹ năng ± điểm thắng / thua (Elo như BoxRec): mỗi trận có kết quả, theo thứ tự ngày,
 *     mong đợi thắng E = 1 / (1 + 10^((điểm đối thủ − điểm mình) / 400)), cộng K × (kết quả − E), K = 40; thắng KO / TKO / RTD / DQ × 1.25.
 *     Thắng đối thủ mạnh hơn được nhiều điểm, thua đối thủ yếu hơn mất nhiều điểm; hòa = 0.5; không kết quả (NC) không tính.
 *   - Hạng (Tinh anh / A / B / C / Tân binh) theo điểm; sao 1–5 theo thứ hạng trong cùng giới tính (như sao BoxRec)
 *   - Thứ hạng: theo điểm, trong cùng giới tính (toàn Academy) và cùng hạng cân; chỉ võ sĩ đang thi đấu (status active)
 *
 * Hồ sơ võ sĩ khớp mục với phiếu giấy /phieu-vo-si (A1–A5 võ sĩ tự khai, B1–B3 HLV đánh giá). Liên hệ + sức khỏe (private)
 * chỉ /admin xem, không bao giờ ra trang công khai.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DATA_DIR, SEED_DIR } = require('./paths');

const DIVISIONS = [
  { id: 'fly', max: 52, vi: 'Hạng Ruồi', en: 'Flyweight' },
  { id: 'bantam', max: 56, vi: 'Hạng Gà', en: 'Bantamweight' },
  { id: 'feather', max: 60, vi: 'Hạng Lông', en: 'Featherweight' },
  { id: 'light', max: 64, vi: 'Hạng Nhẹ', en: 'Lightweight' },
  { id: 'welter', max: 69, vi: 'Hạng Bán trung', en: 'Welterweight' },
  { id: 'middle', max: 75, vi: 'Hạng Trung', en: 'Middleweight' },
  { id: 'lheavy', max: 81, vi: 'Hạng Bán nặng', en: 'Light heavyweight' },
  { id: 'heavy', max: 999, vi: 'Hạng Nặng', en: 'Heavyweight' },
];
const SKILLS = [
  { id: 'technique', vi: 'Kỹ thuật', en: 'Technique' }, { id: 'speed', vi: 'Tốc độ', en: 'Speed' }, { id: 'power', vi: 'Sức mạnh', en: 'Power' },
  { id: 'defense', vi: 'Phòng thủ', en: 'Defense' }, { id: 'stamina', vi: 'Thể lực', en: 'Stamina' }, { id: 'footwork', vi: 'Di chuyển', en: 'Footwork' },
];
const TIERS = [
  { id: 'elite', min: 850, vi: 'Tinh anh', en: 'Elite' }, { id: 'a', min: 750, vi: 'Hạng A', en: 'Class A' },
  { id: 'b', min: 650, vi: 'Hạng B', en: 'Class B' }, { id: 'c', min: 550, vi: 'Hạng C', en: 'Class C' },
  { id: 'rookie', min: -Infinity, vi: 'Tân binh', en: 'Rookie' },
];
const STANCES = ['orthodox', 'southpaw', 'switch'];
const EVENT_TYPES = ['fight', 'sparring', 'assessment', 'other'];
const RESULTS = ['', 'a', 'b', 'draw', 'nc'];
const METHODS = ['KO', 'TKO', 'RTD', 'DQ', 'UD', 'SD', 'MD', 'PTS'];
const STOPPAGE = ['KO', 'TKO', 'RTD', 'DQ'];
const K = 40, STOP_BONUS = 1.25;
// chiêu trên hồ sơ (P = thế đứng, Q W E = kỹ năng, R = tuyệt chiêu): tên + mô tả tự đặt, để trống = trang web tự tạo
const MOVE_SLOTS = ['stance', ...SKILLS.map(s => s.id), 'ult'];
// chữ 2 thứ tiếng (AI tự dịch tiếng Anh khi lưu): [đường dẫn, độ dài tối đa]
const FIGHTER_TEXT = [['bio', 2000], ['style', 200], ['goal', 200], ['evalStrong', 600], ['evalWeak', 600], ['evalNote', 1000]]
  .concat(...MOVE_SLOTS.map(s => [['moves.' + s + '.name', 40], ['moves.' + s + '.desc', 300]]));
const getPath = (o, p) => p.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);
function setPath(o, p, v) { const ks = p.split('.'), last = ks.pop(); let x = o; for (const k of ks) x = x[k] = x[k] && typeof x[k] === 'object' ? x[k] : {}; x[last] = v; }

/* ─── Đọc / ghi ───────────────────────────────────────────────────────────── */
function seedOf(file) { try { return JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), 'utf8')); } catch { return []; } }
function read(file) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) { const s = seedOf(file); write(file, s); return s; }
  try { const v = JSON.parse(fs.readFileSync(p, 'utf8')); return Array.isArray(v) ? v : []; } catch (e) {
    const bad = p + '.hong-' + Date.now();
    try { fs.renameSync(p, bad); } catch { /* bỏ qua */ }
    console.error(`[xếp hạng] ${file} bị hỏng (${e.message}) — đã cất ở ${path.basename(bad)}`);
    return [];
  }
}
function write(file, data) {
  const p = path.join(DATA_DIR, file), tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, p);
}
const fighters = () => read('fighters.json');
const events = () => read('events.json');

/* ─── Kiểm tra dữ liệu từ /admin ──────────────────────────────────────────── */
const txt = (v, max) => String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, max);
const pair = (v, max) => ({ vi: txt(v && v.vi, max), en: txt(v && v.en, max) });
const num = (v, min, max, step = 1) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? Math.round(n / step) * step : null; };
const date = v => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && !isNaN(Date.parse(v)) ? String(v) : '');
const PHOTO = /^(\/assets\/(uploads|media|img)\/[\w-]+(\/[\w-]+)*\.(jpg|jpeg|png|webp|gif|svg)|https:\/\/[^\s"'<>]+)$/;
const slugify = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const vnToday = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const genId = pre => pre + crypto.randomBytes(5).toString('hex');
const divOf = kg => (DIVISIONS.find(d => kg <= d.max) || DIVISIONS[DIVISIONS.length - 1]).id;
function uniqueSlug(want, list, id) {
  let s = want || 'x', n = 2;
  while (list.some(x => x.id !== id && x.slug === s)) s = want + '-' + n++;
  return s;
}

// võ sĩ: base = bản đang lưu (sửa) → giữ trường không gửi lên; trả { fighter } hoặc { error }
function cleanFighter(b, base = {}, list = [], by = '') {
  const g = k => (b[k] !== undefined ? b[k] : base[k]);
  const f = { id: base.id || genId('vs'), createdAt: base.createdAt || Date.now() };
  f.name = txt(g('name'), 80);
  if (f.name.length < 2) return { error: 'Nhập họ tên võ sĩ' };
  f.nickname = txt(g('nickname'), 40);
  f.gender = g('gender') === 'f' ? 'f' : 'm';
  f.birth = date(g('birth'));
  // số đo: để trống được, nhập ngoài khoảng thì báo (không tự bỏ)
  const range = (k, min, max, step, msg) => { const v = g(k); if (v === '' || v == null) return null; const n = num(v, min, max, step); if (n == null) throw new Error(msg); return n; };
  try {
    f.weight = range('weight', 30, 200, 0.1, 'Cân nặng phải từ 30 đến 200 kg');
    f.height = range('height', 120, 230, 1, 'Chiều cao phải từ 120 đến 230 cm');
    f.reach = range('reach', 120, 240, 1, 'Sải tay phải từ 120 đến 240 cm');
  } catch (e) { return { error: e.message }; }
  f.division = DIVISIONS.some(d => d.id === g('division')) ? g('division') : f.weight ? divOf(f.weight) : 'light';
  f.stance = STANCES.includes(g('stance')) ? g('stance') : 'orthodox';
  f.hometown = txt(g('hometown'), 60);
  f.joined = date(g('joined'));
  f.coach = txt(g('coach'), 60);
  const photo = String(g('photo') || '').trim();
  f.photo = PHOTO.test(photo) && !photo.includes('..') ? photo : '';
  f.status = g('status') === 'inactive' ? 'inactive' : 'active';
  f.visible = g('visible') !== false;
  // chữ 2 thứ tiếng; chiêu để trống thì không lưu (trang web tự tạo tên + mô tả)
  f.moves = {};
  for (const [p, max] of FIGHTER_TEXT) {
    const v = pair(getPath(b, p) !== undefined ? getPath(b, p) : getPath(base, p), max);
    if (!p.startsWith('moves.') || v.vi || v.en) setPath(f, p, v);
  }
  // kinh nghiệm (A3), thần tượng (A4)
  f.started = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(g('started') || '')) ? g('started') : '';
  f.otherArts = txt(g('otherArts'), 100);
  f.priorRecord = txt(g('priorRecord'), 100);
  f.idol = txt(g('idol'), 60);
  // liên hệ + sức khỏe (A5): chỉ /admin xem
  const pv = { ...(base.private || {}), ...(b.private && typeof b.private === 'object' ? b.private : {}) };
  f.private = { phone: txt(pv.phone, 20), emName: txt(pv.emName, 60), emRelation: txt(pv.emRelation, 30), emPhone: txt(pv.emPhone, 20), health: txt(pv.health, 500) };
  const sk = g('skills') || {};
  f.skills = {};
  for (const s of SKILLS) {
    const v = sk[s.id];
    if (v === '' || v == null) { f.skills[s.id] = 50; continue; }
    const n = num(v, 0, 100);
    if (n == null) return { error: `Điểm ${s.vi.toLowerCase()} phải từ 0 đến 100` };
    f.skills[s.id] = n;
  }
  // lịch sử chấm điểm: điểm kỹ năng đổi → thêm 1 lần đánh giá (ngày gửi kèm hoặc hôm nay); lần chấm mới không được lùi ngày
  // so với lần gần nhất (lần cuối trong danh sách luôn là điểm hiện tại)
  f.assessments = Array.isArray(base.assessments) ? base.assessments.slice(-30) : [];
  const last = f.assessments[f.assessments.length - 1];
  if (!last || JSON.stringify(last.skills) !== JSON.stringify(f.skills)) {
    const when = date(b.assessDate) || vnToday();
    if (last && when < last.date) return { error: `Ngày chấm phải từ ${last.date.split('-').reverse().join('/')} trở đi (sau lần chấm gần nhất)` };
    f.assessments.push({ date: when, skills: f.skills, note: txt(b.assessNote, 200), by: txt(by, 80) });
    f.assessments = f.assessments.slice(-30);
  }
  f.slug = uniqueSlug(slugify(txt(b.slug, 60)) || base.slug || slugify(f.name), list, f.id);
  f.updatedAt = Date.now();
  return { fighter: f };
}

// sự kiện + danh sách trận: võ sĩ phải có thật, kết quả / cách thắng hợp lệ
function cleanEvent(b, base = {}, list = [], fighterIds = new Set()) {
  const g = k => (b[k] !== undefined ? b[k] : base[k]);
  const e = { id: base.id || genId('sk'), createdAt: base.createdAt || Date.now() };
  e.name = pair(g('name'), 120);
  if (e.name.vi.length < 2) return { error: 'Nhập tên sự kiện' };
  e.date = date(g('date'));
  if (!e.date) return { error: 'Chọn ngày diễn ra sự kiện' };
  e.time = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(g('time') || '')) ? g('time') : '';
  e.type = EVENT_TYPES.includes(g('type')) ? g('type') : 'fight';
  e.venue = txt(g('venue'), 80);
  e.city = txt(g('city'), 60);
  e.desc = pair(g('desc'), 2000);
  const poster = String(g('poster') || '').trim();
  e.poster = PHOTO.test(poster) && !poster.includes('..') ? poster : '';
  e.visible = g('visible') !== false;
  const bouts = Array.isArray(g('bouts')) ? g('bouts').slice(0, 40) : [];
  e.bouts = [];
  for (const [i, x] of bouts.entries()) {
    if (!x || typeof x !== 'object') continue;
    const bt = { id: /^[\w-]{3,20}$/.test(String(x.id || '')) ? String(x.id) : genId('tr'), a: String(x.a || ''), b: String(x.b || '') };
    if (!fighterIds.has(bt.a) || !fighterIds.has(bt.b)) return { error: `Trận ${i + 1}: chọn đủ 2 võ sĩ` };
    if (bt.a === bt.b) return { error: `Trận ${i + 1}: hai góc phải là 2 võ sĩ khác nhau` };
    bt.division = DIVISIONS.some(d => d.id === x.division) ? x.division : '';
    bt.rounds = num(x.rounds, 1, 12) || 3;
    bt.result = RESULTS.includes(x.result) ? x.result : '';
    bt.method = bt.result && bt.result !== 'nc' && METHODS.includes(x.method) ? x.method : '';
    if ((bt.result === 'a' || bt.result === 'b') && !bt.method) return { error: `Trận ${i + 1}: chọn cách thắng (KO, TKO, tính điểm…)` };
    if (bt.result === 'draw' && STOPPAGE.includes(bt.method)) bt.method = 'PTS';
    bt.round = STOPPAGE.includes(bt.method) ? num(x.round, 1, bt.rounds) || bt.rounds : 0;
    bt.time = STOPPAGE.includes(bt.method) && /^\d:[0-5]\d$/.test(String(x.time || '')) ? x.time : '';
    bt.main = !!x.main;
    bt.note = txt(x.note, 120);
    e.bouts.push(bt);
  }
  e.slug = uniqueSlug(slugify(txt(b.slug, 60)) || base.slug || slugify(e.name.vi + '-' + e.date.slice(0, 7)), list, e.id);
  e.updatedAt = Date.now();
  return { event: e };
}

/* ─── Tính điểm, thành tích, thứ hạng ─────────────────────────────────────── */
const r1 = n => Math.round(n * 10) / 10;
const skillAvg = sk => r1(SKILLS.reduce((s, x) => s + (Number(sk && sk[x.id]) || 0), 0) / SKILLS.length);
const tierOf = pts => TIERS.find(t => pts >= t.min).id;
function ageOf(birth, today) {
  if (!birth) return null;
  const [y, m, d] = birth.split('-').map(Number), [ty, tm, td] = today.split('-').map(Number);
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}
// sao theo thứ hạng trong cùng giới tính: top 10% 5 sao, 30% 4, 60% 3, 85% 2, còn lại 1
const starsOf = (rank, of) => { const p = (rank - 1) / Math.max(1, of); return p < 0.1 ? 5 : p < 0.3 ? 4 : p < 0.6 ? 3 : p < 0.85 ? 2 : 1; };

function compute(opts = {}) {
  const today = opts.today || vnToday();
  const F = opts.fighters || fighters(), E = (opts.events || events()).slice().sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const S = new Map(F.map(f => [f.id, {
    base: Math.round(skillAvg(f.skills) * 10), delta: 0, w: 0, l: 0, d: 0, nc: 0, ko: 0, koLost: 0, rounds: 0, bouts: [], upcoming: [], debut: '',
  }]));
  const pts = id => S.get(id).base + S.get(id).delta;
  const evOut = [];
  for (const ev of E) {
    const bouts = [];
    for (const b of ev.bouts) {
      const A = S.get(b.a), B = S.get(b.b);
      if (!A || !B) continue;
      const out = { ...b, deltaA: 0, deltaB: 0, ptsA: null, ptsB: null };
      if (!b.result) {
        if (ev.date >= today) for (const [me, opp, corner] of [[A, b.b, 'a'], [B, b.a, 'b']]) me.upcoming.push({ event: ev.id, date: ev.date, opp, corner, rounds: b.rounds, division: b.division, main: b.main });
        bouts.push(out); continue;
      }
      const ra = pts(b.a), rb = pts(b.b);
      if (b.result !== 'nc') {
        const ea = 1 / (1 + Math.pow(10, (rb - ra) / 400)), sa = b.result === 'a' ? 1 : b.result === 'b' ? 0 : 0.5;
        const mult = b.result !== 'draw' && STOPPAGE.includes(b.method) ? STOP_BONUS : 1;
        out.deltaA = r1(K * mult * (sa - ea)); out.deltaB = -out.deltaA;
        A.delta += out.deltaA; B.delta += out.deltaB;
      }
      out.ptsA = r1(pts(b.a)); out.ptsB = r1(pts(b.b));
      const rnds = STOPPAGE.includes(b.method) ? b.round || b.rounds : b.rounds;
      for (const [me, side, opp] of [[A, 'a', b.b], [B, 'b', b.a]]) {
        const res = b.result === 'nc' ? 'NC' : b.result === 'draw' ? 'D' : b.result === side ? 'W' : 'L';
        if (res === 'W') { me.w++; if (STOPPAGE.includes(b.method)) me.ko++; }
        else if (res === 'L') { me.l++; if (STOPPAGE.includes(b.method)) me.koLost++; }
        else if (res === 'D') me.d++; else me.nc++;
        me.rounds += rnds;
        if (!me.debut) me.debut = ev.date;
        me.bouts.push({ event: ev.id, date: ev.date, opp, res, method: b.method, round: b.round, time: b.time, rounds: b.rounds, division: b.division,
          delta: side === 'a' ? out.deltaA : out.deltaB, after: side === 'a' ? out.ptsA : out.ptsB, oppBefore: r1(side === 'a' ? rb : ra) });
      }
      bouts.push(out);
    }
    // done = đã có kết quả (hoặc đã qua, không có trận); pending = đã qua ngày nhưng chưa nhập kết quả
    evOut.push({ ...ev, status: ev.bouts.some(b => b.result) ? 'done' : ev.date >= today ? 'upcoming' : ev.bouts.length ? 'pending' : 'done', bouts });
  }
  const out = F.map(f => {
    const s = S.get(f.id), points = r1(s.base + s.delta), bouts = s.bouts.slice().reverse();
    const total = s.w + s.l + s.d;
    let streak = null;
    for (const x of bouts) { if (x.res === 'NC') continue; if (!streak) streak = { res: x.res, n: 1 }; else if (x.res === streak.res) streak.n++; else break; }
    return {
      ...f, age: ageOf(f.birth, today), skillAvg: skillAvg(f.skills), skillPoints: s.base, fightPoints: r1(s.delta), points, tier: tierOf(points),
      record: { w: s.w, l: s.l, d: s.d, nc: s.nc, ko: s.ko, koLost: s.koLost, bouts: total + s.nc, rounds: s.rounds, koPct: s.w ? Math.round(s.ko / s.w * 100) : 0 },
      last6: bouts.filter(x => x.res !== 'NC').slice(0, 6).map(x => x.res), streak, debut: s.debut, bouts, upcoming: s.upcoming,
      rank: null, stars: null,
    };
  });
  // thứ hạng: võ sĩ đang thi đấu, đang hiện; toàn Academy theo giới tính + theo hạng cân
  const ranked = out.filter(f => f.status === 'active' && f.visible !== false).sort((a, b) => b.points - a.points || b.skillAvg - a.skillAvg || a.name.localeCompare(b.name));
  for (const g of ['m', 'f']) {
    const list = ranked.filter(f => f.gender === g);
    list.forEach((f, i) => { f.rank = { overall: i + 1, overallOf: list.length }; f.stars = starsOf(i + 1, list.length); });
    for (const d of DIVISIONS) {
      const dl = list.filter(f => f.division === d.id);
      dl.forEach((f, i) => { f.rank.div = i + 1; f.rank.divOf = dl.length; });
    }
  }
  return { today, fighters: out, events: evOut.reverse() };
}

// cho trang công khai: bỏ võ sĩ / sự kiện đang ẩn, ngày sinh (chỉ để tuổi), người chấm
// thay đổi thứ hạng so với trước sự kiện có kết quả gần nhất (mũi tên lên / xuống như BoxRec):
// { overall, div } = số bậc tăng (+) / giảm (−), 'new' = trước đó chưa được xếp hạng; points = điểm tăng / giảm
function movement(F, E, c) {
  const last = E.filter(e => e.bouts.some(b => b.result)).sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))[0];
  if (!last) return { since: null, of: () => null };
  const prev = new Map(compute({ fighters: F, events: E.filter(e => e.id !== last.id), today: c.today }).fighters.map(f => [f.id, f]));
  return {
    since: { id: last.id, slug: last.slug, name: last.name, date: last.date },
    of(f) {
      if (!f.rank) return null;
      const p = prev.get(f.id);
      if (!p || !p.rank) return { overall: 'new', div: 'new', points: 0 };
      return { overall: p.rank.overall - f.rank.overall, div: p.division === f.division ? p.rank.div - f.rank.div : 'new', points: r1(f.points - p.points) };
    },
  };
}

function publicData() {
  const F = fighters(), E = events(), c = compute({ fighters: F, events: E }), mv = movement(F, E, c);
  const vis = new Set(c.fighters.filter(f => f.visible !== false).map(f => f.id));
  const out = c.fighters.filter(f => vis.has(f.id)).map(f => {
    const { birth, createdAt, updatedAt, visible, assessments, private: _private, ...rest } = f;
    return { ...rest, move: mv.of(f), assessments: (assessments || []).map(a => ({ date: a.date, avg: skillAvg(a.skills), skills: a.skills })),
      bouts: f.bouts.filter(b => vis.has(b.opp)), upcoming: f.upcoming.filter(b => vis.has(b.opp)) };
  });
  const evs = c.events.filter(e => e.visible !== false).map(e => {
    const { createdAt, updatedAt, visible, ...rest } = e;
    return { ...rest, bouts: e.bouts.filter(b => vis.has(b.a) && vis.has(b.b)) };
  });
  return { updated: c.today, since: mv.since, divisions: DIVISIONS, skills: SKILLS, tiers: TIERS.map(t => ({ ...t, min: Number.isFinite(t.min) ? t.min : 0 })), fighters: out, events: evs };
}

/* ─── Tự dịch tiếng Anh (lib/translate.js): giới thiệu võ sĩ, tên + mô tả sự kiện ─── */
function pairs() {
  const out = [];
  for (const f of fighters()) for (const [p] of FIGHTER_TEXT) out.push(['fighter|' + f.id + '|' + p, getPath(f, p) || {}]);
  for (const e of events()) { out.push(['event|' + e.id + '|name', e.name || {}]); out.push(['event|' + e.id + '|desc', e.desc || {}]); }
  return out;
}
function applyEn(results) {
  const by = new Map(results.map(r => [r.ref, r]));
  for (const [file, kind, fields] of [['fighters.json', 'fighter', FIGHTER_TEXT], ['events.json', 'event', [['name', 120], ['desc', 2000]]]]) {
    const list = read(file);
    let n = 0;
    for (const x of list) for (const [k, max] of fields) {
      const r = by.get(kind + '|' + x.id + '|' + k), p = getPath(x, k);
      if (r && p && r.vi === p.vi && !p.en) { p.en = txt(r.en, max); n++; }
    }
    if (n) write(file, list);
  }
}

module.exports = { DIVISIONS, SKILLS, TIERS, STANCES, EVENT_TYPES, METHODS, STOPPAGE, MOVE_SLOTS, FIGHTER_TEXT, getPath, fighters, events, write, cleanFighter, cleanEvent, compute, publicData, pairs, applyEn, slugify, vnToday, skillAvg };
