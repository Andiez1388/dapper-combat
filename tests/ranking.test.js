/*
 * Dapper Combat Academy Ranking (lib/ranking.js, routes/ranking.js): dữ liệu mẫu, cách tính điểm (kỹ năng ± Elo), thứ hạng, sao, hạng,
 * trang công khai /xep-hang · /vo-si · /su-kien, quyền admin / nhân viên, kiểm tra dữ liệu, tự dịch tiếng Anh.
 * Chạy sau api.test.js (dùng phiên quản trị env.adminToken).
 */
const ranking = require('../lib/ranking');

module.exports = async function rankingTests(env, t) {
  const B = env.base;
  let ip = 0;
  const req = async (url, o = {}) => {
    const r = await fetch(B + url, { method: o.method || 'GET', redirect: 'manual',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.6.' + (++ip >> 8 & 255) + '.' + (ip & 255), ...(o.tok !== false ? { Authorization: 'Bearer ' + (o.tok || env.adminToken) } : {}) },
      body: o.body ? JSON.stringify(o.body) : undefined });
    const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch { /* trang HTML */ }
    return { s: r.status, j, t: text };
  };
  const pub = url => req(url, { tok: false });
  const settle = async () => { for (let i = 0; i < 100; i++) { await new Promise(r => setTimeout(r, 60)); const st = (await req('/api/translate/status')).j; if (st && !st.running && !st.queued) return; } };

  t.section('Academy Ranking: dữ liệu mẫu, điểm, thứ hạng');
  await t.run('dữ liệu mẫu', async () => {
    const d = (await pub('/api/ranking')).j;
    const men = d.fighters.filter(f => f.gender === 'm'), women = d.fighters.filter(f => f.gender === 'f');
    t.ok(d.fighters.length === 20 && men.length === 14 && women.length === 6 && d.events.length === 8, '20 võ sĩ mẫu (14 nam, 6 nữ), 8 sự kiện', { n: d.fighters.length, ev: d.events.length });
    t.ok(d.fighters.every(f => /^\/assets\/img\/fighters\/demo-\d\d\.svg$/.test(f.photo)), 'võ sĩ mẫu có ảnh minh họa');
    t.ok(d.fighters.every(f => !('birth' in f) && f.age > 15 && f.assessments.every(a => !('by' in a))), 'trang công khai chỉ có tuổi (không ngày sinh), không tên người chấm');
    const long = d.fighters.find(f => f.slug === 'nguyen-hoang-long');
    t.ok(long.rank.overall === 1 && long.rank.div === 1 && long.stars === 5 && long.tier === 'elite' && long.record.w === 3 && long.record.l === 0 && long.last6.join('') === 'WWW',
      'Nguyễn Hoàng Long: #1 nam, #1 hạng Nhẹ, 5 sao, Tinh anh, 3-0-0', { rank: long.rank, stars: long.stars, tier: long.tier, rec: long.record });
    t.ok(long.points === Math.round((long.skillPoints + long.fightPoints) * 10) / 10 && long.skillPoints === Math.round(ranking.skillAvg(long.skills) * 10), 'điểm xếp hạng = điểm kỹ năng (trung bình × 10) + điểm thắng thua', long);
    const ranked = men.filter(f => f.rank).sort((a, b) => a.rank.overall - b.rank.overall);
    t.ok(ranked.every((f, i) => !i || ranked[i - 1].points >= f.points) && ranked.map(f => f.rank.overall).join() === ranked.map((f, i) => i + 1).join(), 'thứ hạng nam theo điểm giảm dần, liên tục 1..n');
    const duy = d.fighters.find(f => f.status === 'inactive');
    t.ok(duy && duy.rank === null && duy.stars === null && ranked.length === 13, 'võ sĩ nghỉ thi đấu không được xếp hạng', duy && { rank: duy.rank });
    const sum = d.events.flatMap(e => e.bouts).filter(b => b.result && b.result !== 'nc').every(b => Math.abs(b.deltaA + b.deltaB) < 1e-9);
    t.ok(sum, 'mỗi trận: điểm người thắng được = điểm người thua mất (Elo)');
    const up = d.events.filter(e => e.status === 'upcoming'), done = d.events.filter(e => e.status === 'done');
    t.ok(up.length === 2 && done.length === 6 && long.upcoming.length === 1, '2 sự kiện sắp tới, 6 đã có kết quả; võ sĩ có trận sắp tới', { up: up.length, done: done.length });
    const kiet = d.fighters.find(f => f.slug === 'bui-tuan-kiet'), hau = d.fighters.find(f => f.slug === 'phan-van-hau');
    t.ok(d.since && d.since.slug === 'sparring-day-thang-10-2026-10' && kiet.move.overall === 1 && hau.move.overall === -2 && kiet.move.points === 20 && duy.move === null,
      'thay đổi thứ hạng so với trước sự kiện gần nhất (▲ / ▼ như BoxRec); võ sĩ nghỉ không có', { since: d.since, kiet: kiet.move, hau: hau.move });
  });

  await t.run('công thức', async () => {
    // tính độc lập: 2 võ sĩ bằng điểm → thắng điểm +20, thắng KO +25; hòa 0; thắng người mạnh hơn 200 điểm được nhiều hơn
    const f = (id, s) => ({ id, name: id, gender: 'm', division: 'light', status: 'active', visible: true, skills: { technique: s, speed: s, power: s, defense: s, stamina: s, footwork: s } });
    const ev = (bouts, date = '2026-01-01') => ({ id: 'e' + date, date, name: { vi: 'x' }, type: 'fight', bouts });
    const run = (fs, evs) => { const c = ranking.compute({ fighters: fs, events: evs, today: '2026-06-01' }); return Object.fromEntries(c.fighters.map(x => [x.id, x])); };
    let c = run([f('a', 70), f('b', 70)], [ev([{ a: 'a', b: 'b', result: 'a', method: 'UD', rounds: 3 }])]);
    t.ok(c.a.points === 720 && c.b.points === 680, 'bằng điểm, thắng điểm: +20 / −20', { a: c.a.points, b: c.b.points });
    c = run([f('a', 70), f('b', 70)], [ev([{ a: 'a', b: 'b', result: 'b', method: 'KO', round: 1, rounds: 3 }])]);
    t.ok(c.b.points === 725 && c.b.record.ko === 1 && c.a.record.koLost === 1 && c.b.record.rounds === 1, 'thắng KO: thưởng ×1.25 (+25), tính KO, số hiệp = hiệp kết thúc', { b: c.b.points, rec: c.b.record });
    c = run([f('a', 70), f('b', 70)], [ev([{ a: 'a', b: 'b', result: 'draw', method: 'PTS', rounds: 2 }])]);
    t.ok(c.a.points === 700 && c.a.record.d === 1, 'hòa giữa 2 người bằng điểm: không đổi điểm');
    c = run([f('a', 60), f('b', 80)], [ev([{ a: 'a', b: 'b', result: 'a', method: 'UD', rounds: 3 }])]);
    t.ok(c.a.fightPoints > 30 && c.b.fightPoints < -30, 'thắng đối thủ mạnh hơn → được nhiều điểm (như BoxRec)', { a: c.a.fightPoints });
    c = run([f('a', 70), f('b', 70)], [ev([{ a: 'a', b: 'b', result: 'nc', rounds: 3 }])]);
    t.ok(c.a.points === 700 && c.a.record.nc === 1 && c.a.record.bouts === 1, 'không kết quả (NC): không tính điểm, vẫn ghi số trận');
    t.ok(ranking.compute({ fighters: [f('x', 90)], events: [], today: '2026-06-01' }).fighters[0].tier === 'elite' &&
      ranking.compute({ fighters: [f('x', 50)], events: [], today: '2026-06-01' }).fighters[0].tier === 'rookie', 'hạng theo điểm: 900 → Tinh anh, 500 → Tân binh');
  });

  t.section('Trang công khai /xep-hang · /vo-si · /su-kien · /so-sanh');
  await t.run('trang', async () => {
    for (const u of ['/xep-hang', '/vo-si', '/su-kien', '/so-sanh']) {
      const r = await pub(u);
      t.ok(r.s === 200 && r.t.includes('/assets/js/xephang.js') && new RegExp(`<link rel="canonical" href="[^"]+${u}"`).test(r.t), u + ' — mở được, có link chuẩn (canonical)');
    }
    let r = await pub('/vo-si/nguyen-hoang-long');
    t.ok(r.s === 200 && /<title>Nguyễn Hoàng Long “Rồng Đen” — Dapper Combat Academy Ranking<\/title>/.test(r.t) && /thành tích 3-0-0/.test(r.t), 'hồ sơ võ sĩ: tiêu đề + mô tả riêng (thành tích) cho Google', (r.t.match(/<title>[^<]*<\/title>/) || [''])[0]);
    r = await pub('/vo-si/khong-co-vo-si-nay');
    t.ok(r.s === 404 && /noindex/.test(r.t), 'võ sĩ không có → 404, không cho Google lưu');
    const ev = (await pub('/api/ranking')).j.events[0];
    r = await pub('/su-kien/' + ev.slug);
    t.ok(r.s === 200 && r.t.includes(ev.name.vi), 'trang chi tiết sự kiện', ev.slug);
    const ld = html => { const m = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s); return m ? JSON.parse(m[1]) : null; };
    const evLd = ld(r.t), pLd = ld((await pub('/vo-si/nguyen-hoang-long')).t);
    t.ok(evLd && evLd['@type'] === 'SportsEvent' && evLd.startDate.startsWith(ev.date) && pLd && pLd['@type'] === 'Person' && pLd.alternateName === 'Rồng Đen' && pLd.memberOf.name === 'Dapper Combat Academy',
      'dữ liệu có cấu trúc cho Google: sự kiện (SportsEvent), võ sĩ (Person)', { evLd, pLd });
    const rd = await fetch(B + '/ranking', { redirect: 'manual' });
    t.ok(rd.status === 301 && rd.headers.get('location') === '/xep-hang', 'đường dẫn tắt /ranking → /xep-hang');
    const sm = (await pub('/sitemap.xml')).t;
    t.ok(sm.includes('/xep-hang</loc>') && sm.includes('/vo-si/nguyen-hoang-long</loc>') && sm.includes('/su-kien/' + ev.slug + '</loc>'), 'sitemap có trang xếp hạng, hồ sơ võ sĩ, sự kiện');
    const js = (await pub('/assets/data/ranking.js')).t;
    t.ok(/^window\.__DC_RANKING=\{/.test(js) && !js.includes('"birth"'), 'dữ liệu cho trang (/assets/data/ranking.js) không có ngày sinh');
  });

  t.section('Quản trị: võ sĩ, sự kiện, kết quả');
  await t.run('quản trị', async () => {
    t.ok((await pub('/api/admin/ranking')).s === 401, 'chưa đăng nhập → không xem dữ liệu quản trị');
    let r = await req('/api/admin/ranking');
    t.ok(r.s === 200 && r.j.fighters.length === 20 && r.j.computed.fighters.length === 20 && r.j.fighters[0].birth, 'admin xem dữ liệu gốc (có ngày sinh) + bản đã tính');
    r = await req('/api/fighters', { method: 'POST', body: { name: 'A' } });
    t.ok(r.s === 400 && /họ tên/.test(r.j.error), 'thiếu tên → báo lỗi', r.j);
    const sk = { technique: 70, speed: 70, power: 70, defense: 70, stamina: 70, footwork: 70 };
    r = await req('/api/fighters', { method: 'POST', body: { name: 'Võ Sĩ Thử', gender: 'm', weight: 63, skills: sk, bio: { vi: 'Võ sĩ dùng để kiểm tra.' }, photo: 'javascript:alert(1)', birth: '2001-02-30x' } });
    const nf = r.j;
    t.ok(r.s === 201 && nf.slug === 'vo-si-thu' && nf.division === 'light' && nf.photo === '' && nf.birth === '' && nf.assessments.length === 1 && nf.assessments[0].by === 'admin@dappercombat.com',
      'thêm võ sĩ: tự đặt đường dẫn, hạng cân theo cân nặng, bỏ ảnh / ngày sai, ghi lần chấm đầu tiên', nf);
    r = await req('/api/fighters/' + nf.id, { method: 'PUT', body: { nickname: 'Test' } });
    t.ok(r.s === 200 && r.j.assessments.length === 1 && r.j.nickname === 'Test', 'sửa thông tin, không đổi kỹ năng → không thêm lần chấm');
    r = await req('/api/fighters/' + nf.id, { method: 'PUT', body: { skills: { ...sk, power: 90 }, assessDate: '2020-01-01' } });
    t.ok(r.s === 400 && /Ngày chấm phải từ/.test(r.j.error), 'ngày chấm lùi trước lần chấm gần nhất → báo lỗi', r.j);
    r = await req('/api/fighters/' + nf.id, { method: 'PUT', body: { weight: 500, skills: { ...sk, power: 120 } } });
    t.ok(r.s === 400 && /Cân nặng/.test(r.j.error), 'số đo / điểm ngoài khoảng → báo lỗi (không tự bỏ)', r.j);
    r = await req('/api/fighters/' + nf.id, { method: 'PUT', body: { skills: { ...sk, power: 90 }, assessDate: ranking.vnToday(), assessNote: 'Tiến bộ sức mạnh' } });
    t.ok(r.j.assessments.length === 2 && r.j.assessments[1].date === ranking.vnToday() && r.j.assessments[1].note === 'Tiến bộ sức mạnh', 'đổi điểm kỹ năng → thêm lần chấm (ngày + ghi chú)', r.j.assessments);
    const opp = (await req('/api/admin/ranking')).j.fighters.find(f => f.slug === 'tran-minh-quan');
    r = await req('/api/events', { method: 'POST', body: { name: { vi: 'Sự kiện thử' }, date: '2026-10-20', bouts: [{ a: nf.id, b: nf.id, rounds: 3 }] } });
    t.ok(r.s === 400 && /2 võ sĩ khác nhau/.test(r.j.error), 'một võ sĩ ở cả 2 góc → báo lỗi', r.j);
    r = await req('/api/events', { method: 'POST', body: { name: { vi: 'Sự kiện thử' }, date: '2026-10-20', bouts: [{ a: nf.id, b: opp.id, rounds: 3, result: 'a' }] } });
    t.ok(r.s === 400 && /cách thắng/.test(r.j.error), 'có người thắng mà chưa chọn cách thắng → báo lỗi', r.j);
    r = await req('/api/events', { method: 'POST', body: { name: { vi: 'Sự kiện thử' }, date: '2026-10-20', type: 'sparring', bouts: [{ a: nf.id, b: opp.id, rounds: 3, result: 'a', method: 'TKO', round: 9, time: '1:05' }] } });
    const evt = r.j;
    t.ok(r.s === 201 && evt.bouts[0].round === 3 && evt.bouts[0].time === '1:05' && evt.slug, 'thêm sự kiện + kết quả (hiệp vượt số hiệp → lấy hiệp cuối)', evt);
    const d = (await pub('/api/ranking')).j, me = d.fighters.find(f => f.id === nf.id), q = d.fighters.find(f => f.id === opp.id);
    const bt = d.events.find(e => e.id === evt.id).bouts[0];
    t.ok(me.record.w === 1 && me.record.ko === 1 && me.fightPoints > 0 && bt.deltaA === me.fightPoints && q.record.l >= 1, 'kết quả mới cập nhật thành tích, điểm của cả 2 võ sĩ ngay', { w: me.record, pts: me.fightPoints, delta: bt.deltaA });
    // nhân viên: thêm / sửa được, không xóa được
    r = await req('/api/users', { method: 'POST', body: { name: 'HLV Thử', email: 'hlv-rank@example.com', role: 'staff' } });
    const tmp = r.j.tempPassword, sid = r.j.user.id;
    r = await req('/api/auth/login', { method: 'POST', tok: false, body: { email: 'hlv-rank@example.com', password: tmp } });
    r = await req('/api/auth/change-password', { method: 'POST', tok: r.j.token, body: { currentPassword: tmp, newPassword: 'HlvRank-' + Date.now() } });
    const S = r.j.token;
    t.ok((await req('/api/fighters/' + nf.id, { method: 'PUT', tok: S, body: { skills: { ...sk, speed: 80 } } })).s === 200, 'HLV (nhân viên) chấm điểm kỹ năng được');
    t.ok((await req('/api/fighters/' + nf.id, { method: 'DELETE', tok: S })).s === 403 && (await req('/api/events/' + evt.id, { method: 'DELETE', tok: S })).s === 403, 'HLV không xóa được võ sĩ / sự kiện');
    r = await req('/api/fighters/' + nf.id, { method: 'DELETE' });
    t.ok(r.s === 409 && /đã có 1 trận/.test(r.j.error), 'võ sĩ đã có trận → không xóa được (gợi ý ẩn / nghỉ thi đấu)', r.j);
    // ẩn võ sĩ: biến mất khỏi trang công khai cùng các trận của họ
    await req('/api/fighters/' + nf.id, { method: 'PUT', body: { visible: false } });
    const d2 = (await pub('/api/ranking')).j;
    t.ok(!d2.fighters.some(f => f.id === nf.id) && !d2.events.find(e => e.id === evt.id).bouts.length && (await pub('/vo-si/vo-si-thu')).s === 404, 'tắt “hiện trên web” → ẩn võ sĩ và các trận của họ');
    // tiếng Anh tự dịch (dịch giả trong bộ kiểm tra)
    await settle();
    const raw = (await req('/api/admin/ranking')).j;
    t.ok(raw.fighters.find(f => f.id === nf.id).bio.en === '[EN] Võ sĩ dùng để kiểm tra.' && raw.events.find(e => e.id === evt.id).name.en === '[EN] Sự kiện thử', 'giới thiệu võ sĩ, tên sự kiện: AI tự dịch tiếng Anh khi lưu');
    t.ok((await req('/api/events/' + evt.id, { method: 'DELETE' })).s === 200 && (await req('/api/fighters/' + nf.id, { method: 'DELETE' })).s === 200, 'xóa sự kiện thử rồi xóa võ sĩ thử (hết trận)');
    // xóa dữ liệu mẫu (sao lưu trước, khôi phục lại cho phần kiểm tra trên trình duyệt)
    t.ok((await req('/api/admin/ranking/demo', { method: 'DELETE', tok: S })).s === 403, 'HLV không xóa được dữ liệu mẫu');
    const bk = (await req('/api/backup')).j;
    const mine = (await req('/api/fighters', { method: 'POST', body: { name: 'Võ Sĩ Thật', gender: 'f', weight: 55 } })).j;
    r = await req('/api/admin/ranking/demo', { method: 'DELETE' });
    const after = (await pub('/api/ranking')).j;
    t.ok(r.s === 200 && r.j.fighters === 20 && r.j.events === 8 && after.fighters.length === 1 && after.fighters[0].id === mine.id && !after.events.length,
      'admin “Xóa dữ liệu mẫu”: bỏ 20 võ sĩ + 8 sự kiện mẫu, giữ võ sĩ đã tự thêm', { r: r.j, left: after.fighters.map(f => f.name) });
    r = await req('/api/backup/restore', { method: 'POST', body: bk });
    t.ok(r.s === 200 && (await pub('/api/ranking')).j.fighters.length === 20, 'khôi phục bản sao lưu → dữ liệu xếp hạng trở lại (có trong bản sao lưu)');
    await req('/api/users/' + sid, { method: 'DELETE' });
    const d3 = (await pub('/api/ranking')).j, q3 = d3.fighters.find(f => f.id === opp.id);
    t.ok(q3.record.l === q.record.l - 1 && q3.points > q.points, 'xóa sự kiện → điểm, thành tích tính lại như cũ', { before: [q.record, q.points], after: [q3.record, q3.points] });
  });
};
