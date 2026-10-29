/*
 * Chạy toàn bộ kiểm tra: npm test
 *   - dựng máy chủ thử với dữ liệu tạm (không đụng data/ thật)
 *   - api.test.js: API, tính tiền, tồn kho, bảo mật, SEO
 *   - browser.test.js: chạy trên Chrome / Edge ẩn (bỏ qua nếu máy không có trình duyệt)
 * Thêm --api để chỉ chạy phần API.
 */
const { start } = require('./lib/sandbox');
const { Browser } = require('./lib/cdp');
const { createChecker } = require('./lib/check');
const smtp = require('./lib/smtp');

(async () => {
  const t = createChecker();
  const t0 = Date.now();
  let env, browser, mail;
  try {
    // --base=<url> --data=<thư mục data> : dùng máy chủ thử đang chạy sẵn (khi viết test)
    const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').slice(k.length + 3);
    // máy chủ email giả: email cho khách được gửi thật qua SMTP tới đây (không ra ngoài)
    mail = await smtp.start();
    env = arg('base') ? { base: arg('base'), data: arg('data'), log: () => '', stop: async () => {} }
      : await start({ SMTP_HOST: '127.0.0.1', SMTP_PORT: String(mail.port), SMTP_SECURE: 'false', MAIL_FROM: 'shop@dc-test.local' });
    if (!arg('base')) env.smtp = mail;
    console.log('Máy chủ thử: ' + env.base + ' (dữ liệu tạm ' + env.data + ')');
    await require('./api.test')(env, t);
    await require('./ops.test')(env, t);
    await require('./ai.test')(env, t);
    await require('./mail.test')(env, t);
    await require('./pay.test')(env, t);
    await require('./ranking.test')(env, t);
    if (!process.argv.includes('--api')) {
      browser = await Browser.launch();
      if (!browser) console.log('\n(Bỏ qua kiểm tra trên trình duyệt: không tìm thấy Chrome / Edge — đặt CHROME_PATH)');
      else { console.log('\nTrình duyệt: ' + browser.exe); await require('./browser.test')(env, t, browser); }
    }
  } catch (e) {
    t.ok(false, 'chạy kiểm tra', e.stack || e.message);
  } finally {
    if (browser) await browser.close();
    if (mail) await mail.close();
    if (env) {
      const log = env.log();
      if (/\[lỗi\]|\[lỗi chưa xử lý\]/.test(log)) t.ok(false, 'máy chủ không báo lỗi trong lúc chạy', log.split('\n').filter(l => /lỗi/.test(l)).slice(0, 10).join('\n'));
      await env.stop();
    }
  }
  const fail = t.results.filter(r => !r.pass);
  console.log(`\n${t.results.length - fail.length}/${t.results.length} kiểm tra đạt · ${((Date.now() - t0) / 1000).toFixed(1)} giây`);
  if (fail.length) { console.log('\nChưa đạt:'); for (const f of fail) console.log('  ✗ [' + f.section + '] ' + f.name); }
  process.exit(fail.length ? 1 : 0);
})();
