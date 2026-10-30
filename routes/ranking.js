/*
 * API Dapper Combat Academy Ranking (lib/ranking.js):
 *   GET  /api/ranking                     dữ liệu cho trang công khai (đã tính điểm, thứ hạng, thành tích)
 *   GET  /api/admin/ranking               dữ liệu gốc + bản đã tính, cho /admin → Academy Ranking
 *   POST /api/fighters · PUT/DELETE /api/fighters/:id    võ sĩ (xóa: chỉ admin, võ sĩ chưa có trận nào)
 *   POST /api/events   · PUT/DELETE /api/events/:id      sự kiện + danh sách trận, kết quả
 *   DELETE /api/admin/ranking/demo                         xóa dữ liệu mẫu (chỉ admin)
 * Nhân viên (HLV) được thêm / sửa võ sĩ, chấm điểm, nhập kết quả; xóa cần tài khoản admin.
 */
const ranking = require('../lib/ranking');
const TEXT = ranking.FIGHTER_TEXT.map(x => x[0]);
const translate = require('../lib/translate');

module.exports = function mountRanking(router, { adminOnly, staffOk }) {
  // tiếng Anh tự dịch: chữ trên hồ sơ võ sĩ (giới thiệu, lối đánh, mục tiêu, nhận xét HLV, chiêu), tên + mô tả sự kiện
  translate.register('ranking', {
    collect(refs) {
      const want = refs && new Set(refs);
      return ranking.pairs().filter(([ref, p]) => p.vi && !p.en && (!want || want.has(ref))).map(([ref, p]) => ({ ref, vi: p.vi }));
    },
    apply: ranking.applyEn,
  });
  // chữ tiếng Việt đổi → bỏ bản tiếng Anh cũ (trừ khi gửi kèm bản tiếng Anh mới), xếp hàng dịch lại
  const staleEn = (before, after, fields, kind) => {
    const refs = [];
    for (const k of fields) {
      const b = (before && ranking.getPath(before, k)) || {}, a = ranking.getPath(after, k);
      if (!a) continue;
      if (a.vi !== (b.vi || '') && a.en === (b.en || '')) a.en = '';
      if (a.vi && !a.en) refs.push(kind + '|' + after.id + '|' + k);
    }
    return refs;
  };

  router.get('/ranking', (req, res) => res.json(ranking.publicData()));
  router.get('/admin/ranking', staffOk, (req, res) => {
    const c = ranking.compute();
    res.json({ fighters: ranking.fighters(), events: ranking.events(), computed: c, divisions: ranking.DIVISIONS, skills: ranking.SKILLS, tiers: ranking.TIERS.map(t => ({ ...t, min: Number.isFinite(t.min) ? t.min : 0 })),
      methods: ranking.METHODS, eventTypes: ranking.EVENT_TYPES, stances: ranking.STANCES, today: c.today });
  });

  router.post('/fighters', staffOk, (req, res) => {
    const list = ranking.fighters(), r = ranking.cleanFighter(req.body || {}, {}, list, req.user.email);
    if (r.error) return res.status(400).json({ error: r.error });
    const refs = staleEn(null, r.fighter, TEXT, 'fighter');
    list.push(r.fighter);
    ranking.write('fighters.json', list);
    translate.queue('ranking', refs);
    res.status(201).json(r.fighter);
  });
  router.put('/fighters/:id', staffOk, (req, res) => {
    const list = ranking.fighters(), i = list.findIndex(f => f.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: 'Không tìm thấy võ sĩ' });
    const r = ranking.cleanFighter(req.body || {}, list[i], list, req.user.email);
    if (r.error) return res.status(400).json({ error: r.error });
    const refs = staleEn(list[i], r.fighter, TEXT, 'fighter');
    list[i] = r.fighter;
    ranking.write('fighters.json', list);
    translate.queue('ranking', refs);
    res.json(r.fighter);
  });
  router.delete('/fighters/:id', adminOnly, (req, res) => {
    const list = ranking.fighters(), f = list.find(x => x.id === req.params.id);
    if (!f) return res.status(404).json({ error: 'Không tìm thấy võ sĩ' });
    const n = ranking.events().reduce((s, e) => s + e.bouts.filter(b => b.a === f.id || b.b === f.id).length, 0);
    if (n) return res.status(409).json({ error: `${f.name} đã có ${n} trận trong lịch sử — không xóa được. Chuyển sang “Nghỉ thi đấu” hoặc tắt “Hiện trên web” thay vì xóa.` });
    ranking.write('fighters.json', list.filter(x => x.id !== f.id));
    res.json({ ok: true });
  });

  const ids = () => new Set(ranking.fighters().map(f => f.id));
  router.post('/events', staffOk, (req, res) => {
    const list = ranking.events(), r = ranking.cleanEvent(req.body || {}, {}, list, ids());
    if (r.error) return res.status(400).json({ error: r.error });
    const refs = staleEn(null, r.event, ['name', 'desc'], 'event');
    list.push(r.event);
    ranking.write('events.json', list);
    translate.queue('ranking', refs);
    res.status(201).json(r.event);
  });
  router.put('/events/:id', staffOk, (req, res) => {
    const list = ranking.events(), i = list.findIndex(e => e.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    const r = ranking.cleanEvent(req.body || {}, list[i], list, ids());
    if (r.error) return res.status(400).json({ error: r.error });
    const refs = staleEn(list[i], r.event, ['name', 'desc'], 'event');
    list[i] = r.event;
    ranking.write('events.json', list);
    translate.queue('ranking', refs);
    res.json(r.event);
  });
  // xóa dữ liệu mẫu (võ sĩ vs01–vs20, sự kiện sk01–sk08 do tools/ranking-demo.js tạo) — võ sĩ / sự kiện thêm ở /admin không bị đụng tới
  const DEMO_F = /^vs\d\d$/, DEMO_E = /^sk\d\d$/;
  router.delete('/admin/ranking/demo', adminOnly, (req, res) => {
    const fs = ranking.fighters(), es = ranking.events();
    const gone = new Set(fs.filter(f => DEMO_F.test(f.id)).map(f => f.id));
    const keepE = es.filter(e => !DEMO_E.test(e.id)).map(e => ({ ...e, bouts: e.bouts.filter(b => !gone.has(b.a) && !gone.has(b.b)) }));
    ranking.write('events.json', keepE);
    ranking.write('fighters.json', fs.filter(f => !gone.has(f.id)));
    res.json({ ok: true, fighters: gone.size, events: es.length - keepE.length });
  });
  router.delete('/events/:id', adminOnly, (req, res) => {
    const list = ranking.events();
    if (!list.some(e => e.id === req.params.id)) return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    ranking.write('events.json', list.filter(e => e.id !== req.params.id));
    res.json({ ok: true });
  });
};
