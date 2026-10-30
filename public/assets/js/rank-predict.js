/* Dapper Combat Academy Ranking — dự đoán kèo giữa 2 võ sĩ (cho vui khi xếp lịch sparring / fight night, không dùng để cá cược).
   Dùng chung: trang công khai (xephang.js), /admin (admin-ranking.js) và kiểm thử (Node: require).

   Vào: 2 võ sĩ đã tính điểm (points, skills, record, last6, height, reach, weight, age, stance) + { rounds, type }.
   Cách tính:
     1. Chênh điểm xếp hạng (đã gồm kỹ năng HLV chấm + thắng thua kiểu Elo).
     2. Cộng "lợi thế lối đánh" (giới hạn ±160 điểm): tấn công của mình (kỹ thuật, tốc độ, sức mạnh) xuyên phòng thủ đối thủ
        (phòng thủ, di chuyển) tới đâu; thể lực (trận càng dài càng quan trọng); sải tay; cân nặng; thế đứng (tay trái gặp người
        thuận được lợi nhỏ); kinh nghiệm thi đấu; phong độ 6 trận gần nhất; tuổi (đỉnh cao 22–30).
     3. Khả năng thắng theo công thức Elo: 1 / (1 + 10^(−chênh / 400)); tách phần hòa (cao khi 2 bên ngang nhau, sparring hòa nhiều hơn).
     4. Thắng KO / TKO hay tính điểm: sức mạnh + tỉ lệ thắng KO của mình, phòng thủ + thể lực + số lần bị dừng trận của đối thủ.
   Ra: { a, b, draw, aKO, aDec, bKO, bDec, distance, aRound, bRound, likely, odds, fav, factors, confidence, rounds }
       odds = tỉ lệ thập phân công bằng (1 / khả năng), không trừ phần nhà cái. */
(function (root) {
  'use strict';
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  var num = function (v, d) { v = Number(v); return isFinite(v) ? v : d; };
  var sk = function (f, k) { return num(f.skills && f.skills[k], 50); };
  var attack = function (f) { return 0.4 * sk(f, 'technique') + 0.3 * sk(f, 'speed') + 0.3 * sk(f, 'power'); };
  var guard = function (f) { return 0.65 * sk(f, 'defense') + 0.35 * sk(f, 'footwork'); };
  var bouts = function (f) { return num(f.record && f.record.bouts, 0); };
  // phong độ 6 trận gần nhất (mới nhất đứng đầu, nặng ký hơn): −1 … +1
  function form(f) {
    var s = 0, w = 0;
    (f.last6 || []).forEach(function (r, i) { var k = 1 - i * 0.12; w += k; s += k * (r === 'W' ? 1 : r === 'L' ? -1 : 0); });
    return w ? s / w : 0;
  }
  var lean = function (x) { return x == null ? 0 : x === 'southpaw' ? 1 : x === 'switch' ? 0.5 : 0; };
  var agePenalty = function (x) { return x == null ? 0 : x < 22 ? (22 - x) * 4 : x > 30 ? (x - 30) * 5 : 0; };

  function predict(A, B, opt) {
    opt = opt || {};
    var rounds = clamp(Math.round(num(opt.rounds, 3)), 1, 12), spar = opt.type !== 'fight';
    var factors = [];
    var add = function (k, v, a, b) { factors.push({ k: k, v: Math.round(v * 10) / 10, a: a, b: b }); return v; };
    var ra = num(A.points, 500), rb = num(B.points, 500);
    var edge =
      add('matchup', 2.2 * ((attack(A) - guard(B)) - (attack(B) - guard(A))), Math.round(attack(A) - guard(B)), Math.round(attack(B) - guard(A))) +
      add('stamina', (sk(A, 'stamina') - sk(B, 'stamina')) * 0.9 * rounds / 3, sk(A, 'stamina'), sk(B, 'stamina')) +
      (A.reach && B.reach ? add('reach', clamp((A.reach - B.reach) * 2.2, -30, 30), A.reach, B.reach) : 0) +
      (A.weight && B.weight ? add('weight', clamp((A.weight - B.weight) * 4, -60, 60), A.weight, B.weight) : 0) +
      (A.stance !== B.stance ? add('stance', (lean(A.stance) - lean(B.stance)) * 12, A.stance, B.stance) : 0) +
      add('experience', clamp((bouts(A) - bouts(B)) * 6, -36, 36), bouts(A), bouts(B)) +
      add('form', (form(A) - form(B)) * 30, (A.last6 || []).join(''), (B.last6 || []).join('')) +
      add('age', agePenalty(B.age) - agePenalty(A.age), A.age, B.age);
    var pa = 1 / (1 + Math.pow(10, -(ra - rb + clamp(edge, -160, 160)) / 400));
    var draw = clamp((spar ? 0.09 : 0.05) * (1 - Math.abs(pa - 0.5) * 1.8) * (rounds <= 3 ? 1.15 : 1), 0.01, 0.12);
    var wa = pa * (1 - draw), wb = (1 - pa) * (1 - draw);
    // tỉ lệ một trận thắng kết thúc bằng KO / TKO
    function stop(X, Y) {
      var koRate = X.record && X.record.w ? num(X.record.ko, 0) / X.record.w : 0.25, chin = bouts(Y) ? num(Y.record.koLost, 0) / bouts(Y) : 0.15;
      var r = 0.18 + (sk(X, 'power') - 60) * 0.009 + (koRate - 0.25) * 0.35 - (sk(Y, 'defense') - 60) * 0.006 - (sk(Y, 'stamina') - 60) * 0.003 + (chin - 0.15) * 0.4 + (rounds - 3) * 0.03;
      return clamp(r * (spar ? 0.55 : 1), 0.03, 0.7);
    }
    // hiệp dễ dừng trận nhất: đấm nặng kết thúc sớm, thể lực tốt kết thúc muộn
    var stopRound = function (X) { return clamp(Math.round(rounds * (0.75 - (sk(X, 'power') - 60) * 0.008 + (sk(X, 'stamina') - 60) * 0.004)), 1, rounds); };
    var sa = stop(A, B), sb = stop(B, A);
    var out = { a: wa, b: wb, draw: draw, aKO: wa * sa, aDec: wa * (1 - sa), bKO: wb * sb, bDec: wb * (1 - sb), rounds: rounds, type: spar ? 'sparring' : 'fight' };
    out.distance = 1 - out.aKO - out.bKO;
    out.aRound = stopRound(A); out.bRound = stopRound(B);
    out.likely = [['aDec', out.aDec], ['aKO', out.aKO], ['draw', draw], ['bDec', out.bDec], ['bKO', out.bKO]].sort(function (x, y) { return y[1] - x[1]; })[0][0];
    out.odds = { a: +(1 / wa).toFixed(2), b: +(1 / wb).toFixed(2), draw: +(1 / draw).toFixed(2) };
    out.fav = wa >= wb ? 'a' : 'b';
    // yếu tố đáng kể nhất (≥ 6 điểm), lớn trước
    out.factors = factors.filter(function (x) { return Math.abs(x.v) >= 6; }).sort(function (x, y) { return Math.abs(y.v) - Math.abs(x.v); }).slice(0, 5);
    var nb = Math.min(bouts(A), bouts(B));
    out.confidence = nb >= 4 ? 'high' : nb >= 2 ? 'medium' : 'low';
    return out;
  }
  // phần trăm thắng chỉ giữa 2 bên (bỏ phần hòa) — cho thanh đỏ / xanh
  function share(p) { var a = Math.round(p.a / (p.a + p.b) * 100); return [a, 100 - a]; }

  var api = { predict: predict, share: share };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DCPredict = api;
})(this);
