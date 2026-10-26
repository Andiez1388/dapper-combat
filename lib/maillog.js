/*
 * Nhật ký gửi tin: mỗi lần gửi Telegram / email (báo chủ shop, email xác nhận cho khách, gửi thử)
 * → data/maillog.json, giữ 500 dòng mới nhất. Xem ở /admin → Xác nhận & nhật ký gửi tin.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(require('./paths').DATA_DIR, 'maillog.json');
const MAX = 500;

function list() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; }
}
// e: { kind: order | registration | consult | test, audience: owner | customer, channel: telegram | email, to, subject, status: ok | failed, error, ref }
function add(e) {
  const l = list();
  l.unshift({ at: Date.now(), ...e });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(l.slice(0, MAX), null, 1));
  fs.renameSync(tmp, FILE);
}
function clear() { if (fs.existsSync(FILE)) fs.unlinkSync(FILE); }

module.exports = { list, add, clear };
