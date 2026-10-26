/* Dịch vụ Setup — gửi yêu cầu tư vấn lên server, nhận mã yêu cầu thật */
// chữ của lựa chọn đang bật (đúng như khách thấy) — gửi kèm mã để /admin hiển thị đúng cả lựa chọn mới thêm
function chipNames(name) {
  return Array.prototype.map.call(document.querySelectorAll('[data-chips="' + name + '"] .chip.on'), function (b) { return b.textContent.trim(); });
}
function budgetName() {
  var s = document.getElementById('fBudget');
  return s && s.value ? s.options[s.selectedIndex].text : '';
}
function DCsvcSubmit(name) {
  if (F.sending) return;
  var form = document.getElementById('svcForm');
  var btn = form && form.querySelector('button[type="submit"], .btn[type="submit"]');
  var old = document.getElementById('dcSvcErr'); if (old) old.remove();
  var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
  var phone = val('fPhone');
  F.sending = true;
  if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = T(DC.x("services.contact.j44",0,'Đang gửi…'), DC.x("services.contact.j44",1,'Sending…')); }
  DC.api('/consults', {
    type: F.type, area: F.area, svc: F.svc, budget: F.budget,
    typeName: chipNames('type')[0] || '', areaName: chipNames('area')[0] || '', svcNames: chipNames('svc'), budgetName: budgetName(),
    name: name, phone: phone, city: val('fCity'), note: val('fNote'), lang: DC.lang(),
  }).then(function (res) {
    F.sending = false;
    F.done = { id: res.code, name: name, phone: phone };
    rContact(); go('contact');
  }, function (err) {
    F.sending = false;
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || T(DC.x("services.contact.j45",0,'Gửi yêu cầu'), DC.x("services.contact.j45",1,'Send request')); }
    var at = btn || form;
    if (at) at.insertAdjacentHTML('afterend', '<p class="dc-form-err" id="dcSvcErr" role="alert">' + DC.esc(err.message) + '</p>');
  });
}
