/* Màn hình "Tiếng Anh tự dịch (AI)": khóa Claude API, bật / tắt, trạng thái và dịch phần còn thiếu.
   Chủ shop chỉ sửa tiếng Việt; khi lưu, server (lib/translate.js) nhờ AI dịch sang tiếng Anh. */
(function () {
  'use strict';
  var A = window.DCAdmin;
  if (!A) return;
  var esc = A.esc, $ = function (s, r) { return (r || document).querySelector(s); };
  var VIEW = 'cms-ai';
  var S = { st: null, cfg: null, err: '', busy: '', test: null, timer: 0 };
  var KIND = { cms: 'Chữ trên trang', product: 'Sản phẩm', settings: 'Thiết lập (danh mục, gói tập, lịch tập…)', page: 'Trang phụ' };

  function load() {
    return Promise.all([A.api('/translate/status'), A.api('/settings')]).then(function (r) {
      S.st = r[0]; S.cfg = (r[1] && r[1].ai) || {}; S.err = '';
      render(); poll();
    }, function (e) { S.err = (e && e.message) || 'Không tải được'; render(); });
  }
  // đang dịch → hỏi lại trạng thái mỗi 2 giây
  function poll() {
    clearTimeout(S.timer);
    if (!S.st || !(S.st.running || S.st.queued)) return;
    S.timer = setTimeout(function () {
      if (A.view() !== VIEW) return;
      A.api('/translate/status').then(function (st) { S.st = st; render(); poll(); }, function () { /* thử lại lần sau */ });
    }, 2000);
  }

  function statusHtml() {
    var st = S.st;
    if (!st) return '<p class="muted">Đang tải…</p>';
    var src = { admin: 'khóa đã lưu trong trang quản trị', env: 'khóa trong file .env của máy chủ', mock: 'chế độ thử (không gọi AI thật)' }[st.keySource] || '';
    var miss = st.missing || {}, total = Object.keys(miss).reduce(function (n, k) { return n + (miss[k] || 0); }, 0);
    var state = !src ? '<span class="cf cf--off">Chưa có khóa API — chưa dịch được</span>'
      : !st.enabled ? '<span class="cf cf--off">Đang tắt</span>'
      : st.running || st.queued ? '<span class="cf cf--wait">Đang dịch…</span>'
      : '<span class="cf cf--ok">Đang bật</span>';
    return '<div class="kv">' +
      '<div class="kv__row"><span class="kv__k">Trạng thái</span><span class="kv__v">' + state + (src ? ' <span class="muted">· ' + esc(src) + '</span>' : '') + '</span></div>' +
      '<div class="kv__row"><span class="kv__k">Model</span><span class="kv__v">' + esc(st.model) + '</span></div>' +
      '<div class="kv__row"><span class="kv__k">Còn thiếu tiếng Anh</span><span class="kv__v">' + (total ? Object.keys(miss).filter(function (k) { return miss[k]; }).map(function (k) { return esc(KIND[k] || k) + ': <strong>' + esc(miss[k]) + '</strong>'; }).join(' · ') : 'Không — mọi nội dung đã có tiếng Anh') + '</span></div>' +
      (st.done || st.failed ? '<div class="kv__row"><span class="kv__k">Từ lúc máy chủ chạy</span><span class="kv__v">Đã dịch ' + esc(st.done) + ' câu' + (st.failed ? ' · <span class="cf cf--err">lỗi ' + esc(st.failed) + ' câu</span>' : '') + '</span></div>' : '') +
      (st.lastError ? '<div class="kv__row"><span class="kv__k">Lỗi gần nhất</span><span class="kv__v"><span class="cf cf--err">' + esc(st.lastError) + '</span>' + (st.lastErrorAt ? ' <span class="muted">(' + esc(A.fmtTime(st.lastErrorAt)) + ')</span>' : '') + '</span></div>' : '') +
      '</div>' +
      '<div class="set-actions"><button class="btn btn--primary" type="button" data-ai-run' + (!st.enabled || !total || S.busy ? ' disabled' : '') + '>' + (S.busy === 'run' ? 'Đang dịch…' : 'Dịch phần còn thiếu') + '</button>' +
      '<button class="btn btn--quiet" type="button" data-ai-reload>Làm mới</button></div>';
  }
  function keyHtml() {
    var c = S.cfg || {};
    return '<label class="check set-switch"><input type="checkbox" data-ai-on' + (c.enabled !== false ? ' checked' : '') + '><span class="switch__ui" aria-hidden="true"></span><span>Tự dịch sang tiếng Anh khi lưu nội dung tiếng Việt</span></label>' +
      '<label class="field"><span class="field__label">Khóa Claude API</span>' +
      '<input type="password" autocomplete="off" spellcheck="false" data-ai-key placeholder="' + (c.apiKeySet ? 'Đã lưu khóa — nhập khóa mới để thay' : 'sk-ant-…') + '">' +
      '<small class="field__hint">Lấy khóa ở <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">console.anthropic.com → API Keys ↗</a>. Khóa chỉ lưu trên máy chủ, không hiện lại. Có thể đặt <code>ANTHROPIC_API_KEY</code> trong file .env thay vì nhập ở đây.</small></label>' +
      '<div class="set-actions"><button class="btn btn--primary" type="button" data-ai-save' + (S.busy ? ' disabled' : '') + '>Lưu</button>' +
      '<button class="btn btn--line" type="button" data-ai-test' + (S.busy ? ' disabled' : '') + '>' + (S.busy === 'test' ? 'Đang thử…' : 'Thử khóa') + '</button>' +
      (c.apiKeySet ? '<button class="btn btn--quiet" type="button" data-ai-clear>Xóa khóa đã lưu</button>' : '') + '</div>' +
      (S.test ? (S.test.ok ? '<p class="ops-created" role="status">Khóa dùng được. Thử dịch “Xin chào, chào mừng bạn đến với Dapper Combat!” → <strong>' + esc(S.test.sample) + '</strong></p>'
        : '<p class="form-msg" role="alert">' + esc(S.test.error) + '</p>') : '') +
      '<p class="set-note">Chi phí do Anthropic tính theo lượng chữ: mỗi lần lưu thường chỉ vài trăm đồng; dịch lại toàn bộ website khoảng dưới 50.000đ.</p>';
  }
  function render() {
    var root = $('[data-ai-root]'); if (!root) return;
    if (S.err) { root.innerHTML = A.errorHtml(S.err); return; }
    root.innerHTML =
      '<div class="cms-help"><p><strong>Bạn chỉ cần sửa tiếng Việt.</strong> Khi bấm Lưu ở Chữ trên trang, Sản phẩm, Danh mục, Học phí & lịch tập hay Trang phụ, AI tự dịch phần vừa đổi sang tiếng Anh trong vài giây — khách bấm <strong>EN</strong> trên website là thấy bản dịch. ' +
        'Trong lúc chờ dịch (hoặc khi chưa có khóa), trang tiếng Anh tạm hiện chữ tiếng Việt mới thay vì chữ tiếng Anh cũ đã sai nội dung. Muốn tự viết bản tiếng Anh cho một chỗ nào đó, cứ sửa ô English của chỗ đó — AI chỉ dịch lại khi bạn đổi tiếng Việt.</p></div>' +
      '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">Trạng thái dịch</h2></header><div class="set-body">' + statusHtml() + '</div></section>' +
      '<section class="panel set-sec"><header class="panel__head"><h2 class="panel__title">Khóa AI</h2></header><div class="set-body">' + keyHtml() + '</div></section>';
  }

  function saveCfg(patch, msg) {
    S.busy = 'save'; render();
    return A.api('/settings', { method: 'PUT', body: { ai: patch } }).then(function (d) {
      S.busy = ''; S.cfg = (d && d.ai) || S.cfg; S.test = null;
      if (A.settingsStore && A.settingsStore.set) A.settingsStore.set(d);
      A.toast(msg);
      return load();
    }, function (e) { S.busy = ''; render(); A.apiFail(e); });
  }
  document.addEventListener('click', function (e) {
    if (A.view() !== VIEW) return;
    var t = e.target instanceof Element ? e.target : null; if (!t) return;
    if (t.closest('[data-ai-reload]')) { load(); return; }
    if (t.closest('[data-ai-save]')) {
      var key = ($('[data-ai-key]') || {}).value || '', on = !!($('[data-ai-on]') || {}).checked;
      saveCfg(key.trim() ? { enabled: on, apiKey: key.trim() } : { enabled: on }, key.trim() ? 'Đã lưu khóa AI' : 'Đã lưu');
      return;
    }
    if (t.closest('[data-ai-clear]')) {
      A.confirmDialog({ title: 'Xóa khóa AI đã lưu?', body: 'Không còn khóa thì nội dung tiếng Việt sửa sau này sẽ chưa được dịch (trang tiếng Anh tạm hiện chữ tiếng Việt).', ok: 'Xóa khóa' })
        .then(function (yes) { if (yes) saveCfg({ apiKey: null }, 'Đã xóa khóa AI'); });
      return;
    }
    if (t.closest('[data-ai-test]')) {
      S.busy = 'test'; S.test = null; render();
      A.api('/translate/test', { method: 'POST' }).then(function (r) { S.busy = ''; S.test = r; render(); }, function (er) { S.busy = ''; S.test = { ok: false, error: er.message }; render(); });
      return;
    }
    if (t.closest('[data-ai-run]')) {
      S.busy = 'run'; render();
      A.api('/translate/run', { method: 'POST', body: {} }).then(function (st) { S.busy = ''; S.st = st; render(); poll(); A.toast('Đang dịch phần còn thiếu — xong sau ít phút'); },
        function (er) { S.busy = ''; render(); A.apiFail(er); });
    }
  });

  A.register(VIEW, {
    title: 'Tiếng Anh tự dịch (AI)',
    mount: function (main) {
      main.innerHTML = A.pageHead('Tiếng Anh tự dịch (AI)', { eyebrow: 'Nội dung website', stamp: false, count: false, refresh: false }) + '<div data-ai-root></div>';
      render(); load();
    },
    reset: function () { clearTimeout(S.timer); S.st = null; S.cfg = null; S.test = null; S.busy = ''; },
  });
})();
