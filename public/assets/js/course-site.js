/* Khóa học — gửi phiếu đăng ký lên server, nhận mã đăng ký thật rồi mới hiện bước "Xác nhận" */
function DCcourseSubmit() {
  if (CV3.sending) return;
  var d = CV3.done, p = CV3_P[CV3.prog] || {};
  var reg = document.getElementById('cv3Reg');
  var btn = reg && reg.querySelector('.cv3-foot .cv3-next');
  var old = document.getElementById('dcRegErr'); if (old) old.remove();
  CV3.sending = true;
  if (btn) { btn.disabled = true; btn.textContent = cv3T(DC.x("course.drawer.j92",0,'Đang gửi…'), DC.x("course.drawer.j92",1,'Sending…')); }
  DC.api('/registrations', {
    program: CV3.prog, programName: d.prog, detail: d.detail,
    pkg: p.pkgs ? CV3.pkg : '', opt: CV3.opt || '', pay: CV3.pay || '', payName: d.payName,
    total: d.total, due: d.due, name: d.name, phone: d.phone,
    email: CV3.f.email, date: CV3.f.date, note: CV3.f.note, lang: DC.lang(),
  }).then(function (res) {
    CV3.sending = false;
    CV3.done.id = res.code;
    CV3.done.slip = res.slip;
    CV3.step = 3; cv3Render();
  }, function (err) {
    CV3.sending = false;
    if (btn) { btn.disabled = false; btn.textContent = cv3T(DC.x("course.drawer.j93",0,'Xác nhận đăng ký'), DC.x("course.drawer.j93",1,'Confirm sign-up')); }
    var foot = reg && reg.querySelector('.cv3-foot');
    if (foot) foot.insertAdjacentHTML('afterbegin', '<p class="dc-form-err" id="dcRegErr" role="alert">' + DC.esc(err.message) + '</p>');
  });
}

/* mã QR đặt cọc / học phí: VietQR thật nếu đã cài tài khoản trong /admin */
var _cv3Qr = cv3Qr;
cv3Qr = function (ref, amount) { return DC.payQr(ref, amount) || _cv3Qr(ref); };
var _dcCv3Render = cv3Render;
cv3Render = function () {
  _dcCv3Render.apply(this, arguments);
  var info = CV3.step === 3 && DC.pay() && document.querySelector('#cv3Reg .cv3-qr > div:last-child');
  if (info) info.insertAdjacentHTML('beforeend', DC.payLines(CV3.done && CV3.done.id));
  // phiếu xác nhận cho khách ở bước cuối
  var body = CV3.step === 3 && CV3.done && CV3.done.slip && DC.slip && document.querySelector('#cv3Reg .cv3-body');
  if (body) body.insertAdjacentHTML('beforeend', DC.slip.box(CV3.done.slip, DC.lang()));
};

/* học phí, gói Group Training, lịch tập theo /admin → Thiết lập → Học phí & lịch tập */
var DCC = {
  en: function () { return DC.lang() === 'en'; },
  money: function (n) { return Math.round(n).toLocaleString(DCC.en() ? 'en-US' : 'vi-VN') + 'đ'; },
  pick: function (a) { return DCC.en() ? (a.en || a.vi || '') : (a.vi || ''); },
  // chữ sửa ở mục Chữ trên trang (ô gốc nằm trong HTML): [khóa, VI mặc định, EN mặc định]
  x: function (k, vi, en) { return DC.x(k, DCC.en() ? 1 : 0, DCC.en() ? en : vi); },
  // tên gói: thẻ giá "03 THÁNG" / "3 MONTHS", nút trong form "3 tháng" / "3 months" (trừ khi đặt tên riêng)
  dur: function (k, card, en) {
    if (en === undefined) en = DCC.en();
    var own = en ? (k.label.en || k.label.vi) : k.label.vi;
    if (own) return own;
    var m = k.months;
    if (en) return card ? (String(m).padStart(2, '0') + (m > 1 ? ' MONTHS' : ' MONTH')) : (m + (m > 1 ? ' months' : ' month'));
    return card ? String(m).padStart(2, '0') + ' THÁNG' : m + ' tháng';
  },
};
(function () {
  var c = DC.setting('course', null);
  if (!c) return;
  CV3_P.found.price = c.foundPrice; CV3_P.found.deposit = c.foundDeposit;
  CV3_P.hssv.price = c.hssvMonth * c.hssvMonths;
  CV3_P.mem.price = c.memMonth;
  var pk = DC.gtPackages();
  if (pk.length) {
    CV3_P.gt.pkgs = pk.map(function (k) { return { id: String(k.months), t: [DCC.dur(k, false, false), DCC.dur(k, false, true)], p: k.price, save: k.save || undefined, best: k.best }; });
    var best = pk.filter(function (k) { return k.best; })[0] || pk[pk.length - 1];
    if (!pk.some(function (k) { return String(k.months) === CV3.pkg; })) CV3.pkg = String(best.months);
  }
  /* lựa chọn lớp / khung giờ trong form đăng ký lấy từ lịch tập (/admin → Thiết lập → Lịch tập):
     Foundation = các hàng "found", Group Training + buổi tập thử = các hàng "gt"; thêm hàng là thêm lựa chọn */
  var rows = Array.isArray(c.scheduleRows) ? c.scheduleRows : [];
  var byProg = function (prog) { var seen = {}; return rows.filter(function (r) { if (!r || r.prog !== prog || !r.opt || seen[r.opt]) return false; seen[r.opt] = 1; return true; }); };
  var pair = function (v) { return v && typeof v === 'object' ? [v.vi || v.en || '', v.en || v.vi || ''] : [String(v || ''), String(v || '')]; };
  var days = function (r) { return [DC.daysText(r.days, false), DC.daysText(r.days, true)]; };
  // nhãn có sẵn (sửa được ở Chữ trên trang) cho các lớp / ca gốc; hàng mới dùng tên + giờ của hàng
  var known = function (list, id) { return (list || []).filter(function (o) { return o.id === id; })[0]; };
  var found = byProg('found'), gt = byProg('gt');
  if (found.length) {
    var oldF = CV3_P.found.opts;
    CV3_P.found.opts = found.map(function (r) {
      var k = known(oldF, r.opt), d = days(r), n = pair(r.name);
      return { id: r.opt, t: k ? k.t : n, s: k ? k.s : [d[0] + ' — ' + r.time, d[1] + ' — ' + r.time] };
    });
  }
  if (gt.length) {
    var oldG = CV3_P.gt.opts, oldT = CV3_P.trial.opts;
    CV3_P.gt.opts = gt.map(function (r) {
      var k = known(oldG, r.opt), d = days(r);
      return { id: r.opt, t: k ? k.t : [r.time, r.time], s: k ? k.s : d };
    });
    CV3_P.trial.opts = gt.map(function (r) {
      var k = known(oldT, r.opt);
      return { id: r.opt, t: k ? k.t : [r.time, r.time], s: [r.time, r.time] };
    });
  }
})();
// thẻ gói Group Training
function dcRenderGt() {
  var g = document.querySelector('.gt-grid'), pk = DC.gtPackages();
  if (!g || !pk.length) return;
  g.innerHTML = pk.map(function (k) {
    return '<div class="gt-card' + (k.best ? ' best' : '') + '" data-months="' + k.months + '">' +
      (k.best ? '<div data-cms="course.gt.best" class="gt-ribbon">' + DCC.x('course.gt.best', 'HỜI NHẤT', 'BEST VALUE') + '</div>' : '') +
      '<div class="gt-dur">' + DC.esc(DCC.dur(k, true)) + '</div>' +
      '<div class="gt-price">' + DCC.money(k.price) + '</div>' +
      '<div class="gt-mo">' + DCC.money(k.mo) + '<small data-cms="course.gt.permo">' + DCC.x('course.gt.permo', '/tháng', '/month') + '</small></div>' +
      (k.isBase ? '<div data-cms="course.gt.base" class="gt-save base">' + DCC.x('course.gt.base', 'Giá gốc', 'Base price') + '</div>'
        : '<div class="gt-save' + (k.best ? ' hot' : '') + '">' + DCC.x('course.gt.savelab', 'Tiết kiệm', 'Save') + ' ' + DCC.money(k.save) + '</div>') +
      '<div class="gt-note">' + DC.esc(DCC.pick(k.note)) + '</div>' +
      '<button type="button" class="cv3-pick" data-reg="gt" data-pkg="' + k.months + '">' + cv3T(DC.x('course.sticky.j2', 0, 'Chọn gói này'), DC.x('course.sticky.j2', 1, 'Choose plan')) + '</button></div>';
  }).join('');
}
// bảng lịch tập: mỗi hàng 1 lớp, bấm vào hàng mở form đăng ký đúng chương trình / lớp
function dcRenderSched() {
  var tb = document.querySelector('table.sched tbody'), rows = DC.setting('course.scheduleRows', null);
  if (!tb || !rows) return;
  tb.innerHTML = rows.map(function (r) {
    return '<tr class="r-' + r.kind + (r.prog ? ' cux-row' : '') + '"' + (r.prog ? ' tabindex="0" data-cux-prog="' + r.prog + '"' + (r.opt ? ' data-cux-opt="' + DC.esc(r.opt) + '"' : '') : '') + '>' +
      '<th>' + DC.esc(r.time) + '</th><td class="sch-cls"><span>' + DC.esc(DCC.pick(r.name)) + '</span><small><span>' + DC.esc(DCC.pick(r.sub)) + '</span></small></td>' +
      r.days.map(function (d) { return '<td>' + (d ? '<span class="on">●</span>' : '<span class="off">—</span>') + '</td>'; }).join('') + '</tr>';
  }).join('');
  if (typeof cfinSched === 'function') cfinSched();
}
dcRenderGt(); dcRenderSched();
// đổi ngôn ngữ → vẽ lại thẻ gói + lịch tập
var _dcApplyLang = applyLang;
applyLang = function () { _dcApplyLang.apply(this, arguments); dcRenderGt(); dcRenderSched(); };

/* link "#dang-ky" (vd từ Trang chủ: /khoa-hoc#dang-ky, hoặc link sửa trong /admin) → mở form đăng ký học thử */
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href$="#dang-ky"]');
  if (!a || a.hasAttribute('data-reg') || a.pathname !== location.pathname) return;
  e.preventDefault();
  cv3Open('trial', {});
});
window.addEventListener('load', function () {
  if (location.hash === '#dang-ky') setTimeout(function () { cv3Open('trial', {}); }, 300);
});

/* nút giỏ hàng trên thanh menu: số sản phẩm thật trong giỏ (dùng chung với Trang chủ / Shop), cập nhật khi giỏ đổi ở tab khác */
function dcCartLabel() {
  var el = document.getElementById('dcCartLabel');
  if (!el) return;
  var en = DC.lang() === 'en';
  el.textContent = DC.x('course.nav.cart', en ? 1 : 0, en ? 'CART ({n})' : 'GIỎ ({n})').replace('{n}', DC.cart.count());
}
dcCartLabel();
DC.cart.onChange(dcCartLabel);
var _dcCartLang = applyLang;
applyLang = function () { _dcCartLang.apply(this, arguments); dcCartLabel(); };
(function () {
  var c = document.querySelector('.nav .nav-cart');
  if (!c) return;
  c.setAttribute('role', 'link'); c.setAttribute('tabindex', '0');
  c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); location.href = CV3_SHOP; } });
})();
