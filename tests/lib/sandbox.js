/*
 * Máy chủ thử: chạy server.js với dữ liệu riêng trong thư mục tạm (DC_DATA_DIR, DC_UPLOAD_DIR),
 * tắt mọi kênh gửi tin thật (Telegram / SMTP). Không đụng tới data/ và public/assets/uploads thật.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.unref();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function start() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-test-'));
  const data = path.join(dir, 'data'), uploads = path.join(dir, 'uploads');
  fs.mkdirSync(data);
  fs.cpSync(path.join(ROOT, 'data', 'seed'), path.join(data, 'seed'), { recursive: true });
  const port = await freePort();
  const env = {
    ...process.env, PORT: String(port), NODE_ENV: 'test', DC_DATA_DIR: data, DC_UPLOAD_DIR: uploads,
    // để trống (dotenv không ghi đè biến đã có) → không gửi tin thật, khóa đăng nhập tự tạo trong thư mục tạm
    JWT_SECRET: '', SITE_URL: '', TRUST_PROXY: '', TELEGRAM_BOT_TOKEN: '', TELEGRAM_CHAT_ID: '', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', NOTIFY_EMAIL: '',
    // dịch tự động: dịch giả "[EN] …", không gọi AI thật (không tốn tiền, không cần khóa)
    DC_AI_MOCK: '1', ANTHROPIC_API_KEY: '',
  };
  const proc = spawn(process.execPath, ['server.js'], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  proc.stdout.on('data', d => { log += d; });
  proc.stderr.on('data', d => { log += d; });
  const base = `http://127.0.0.1:${port}`;
  const stop = async () => {
    if (proc.exitCode === null) { proc.kill(); await new Promise(r => proc.once('exit', r)); }
    fs.rmSync(dir, { recursive: true, force: true });
  };
  for (let i = 0; i < 100; i++) {
    if (proc.exitCode !== null) break;
    try { if ((await fetch(base + '/robots.txt')).ok) break; } catch { /* chưa chạy xong */ }
    await sleep(100);
  }
  // an toàn: server phải ghi dữ liệu vào thư mục tạm (nếu không hỗ trợ DC_DATA_DIR thì dừng ngay)
  await fetch(base + '/api/products').catch(() => null);
  if (!fs.existsSync(path.join(data, 'products.json'))) {
    await stop();
    throw new Error('Máy chủ thử không dùng DC_DATA_DIR — dừng để không đụng dữ liệu thật.\n' + log);
  }
  return { base, port, dir, data, uploads, log: () => log, stop };
}

module.exports = { start, ROOT, sleep };
