/*
 * Điều khiển Chrome / Edge chạy ẩn qua Chrome DevTools Protocol (không cần cài thêm thư viện).
 * CHROME_PATH = đường dẫn trình duyệt nếu không nằm ở chỗ mặc định.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { sleep } = require('./sandbox');

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean);
const findBrowser = () => CANDIDATES.find(p => fs.existsSync(p)) || null;

class Page {
  constructor(browser, sessionId) {
    this.b = browser; this.sid = sessionId;
    this.errors = [];      // lỗi JavaScript + console.error
    this.network = [];     // tải tài nguyên lỗi (chỉ để tham khảo)
  }
  send(method, params) { return this.b.send(method, params, this.sid); }
  onEvent(method, params) {
    if (method === 'Runtime.exceptionThrown') {
      const d = params.exceptionDetails || {};
      this.errors.push('exception: ' + ((d.exception && d.exception.description) || d.text || '').split('\n')[0] + (d.url ? ' @ ' + d.url + ':' + d.lineNumber : ''));
    } else if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
      this.errors.push('console.error: ' + params.args.map(a => a.value != null ? a.value : a.description || '').join(' ').slice(0, 300));
    } else if (method === 'Log.entryAdded' && params.entry.level === 'error') {
      if (params.entry.source === 'network') this.network.push(params.entry.text + ' ' + (params.entry.url || ''));
      else this.errors.push('log: ' + params.entry.text.slice(0, 300));
    }
  }
  async goto(url, { wait = 400 } = {}) {
    const loaded = this.b.waitFor('Page.loadEventFired', this.sid, 20000);
    await this.send('Page.navigate', { url });
    await loaded;
    if (wait) await sleep(wait);
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) throw new Error('eval: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text));
    return r.result.value;
  }
  // chờ tới khi biểu thức trả về giá trị "thật" (tối đa ms)
  async until(expression, ms = 8000) {
    const end = Date.now() + ms;
    for (;;) {
      const v = await this.eval(expression).catch(() => null);
      if (v) return v;
      if (Date.now() > end) return null;
      await sleep(150);
    }
  }
  viewport(width, height = 900, mobile = width < 768) {
    return this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  }
  takeErrors() { const e = this.errors; this.errors = []; this.network = []; return e; }
  close() { return this.b.send('Target.closeTarget', { targetId: this.targetId }).catch(() => null); }
}

class Browser {
  static async launch() {
    const exe = findBrowser();
    if (!exe) return null;
    if (typeof WebSocket === 'undefined') { console.log('(Kiểm tra trên trình duyệt cần Node 22 trở lên)'); return null; }
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-chrome-'));
    const proc = spawn(exe, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check',
      '--disable-extensions', '--disable-gpu', '--mute-audio', '--disable-background-networking', 'about:blank'], { stdio: 'ignore' });
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 150 && !fs.existsSync(portFile); i++) await sleep(100);
    if (!fs.existsSync(portFile)) { proc.kill(); throw new Error('Không mở được trình duyệt ' + exe); }
    await sleep(100);
    const [port, wsPath] = fs.readFileSync(portFile, 'utf8').trim().split('\n');
    const b = new Browser(proc, profile, `ws://127.0.0.1:${port}${wsPath}`, exe);
    await b.connect();
    return b;
  }
  constructor(proc, profile, url, exe) { this.proc = proc; this.profile = profile; this.url = url; this.exe = exe; this.id = 0; this.calls = new Map(); this.pages = new Map(); this.waiters = []; }
  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => resolve();
      this.ws.onerror = e => reject(new Error('CDP: ' + (e.message || 'không kết nối được')));
      this.ws.onmessage = ev => {
        const m = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
        if (m.id && this.calls.has(m.id)) {
          const { resolve: ok, reject: bad } = this.calls.get(m.id); this.calls.delete(m.id);
          return m.error ? bad(new Error(m.error.message)) : ok(m.result);
        }
        if (m.method) {
          const pg = m.sessionId && this.pages.get(m.sessionId);
          if (pg) pg.onEvent(m.method, m.params);
          this.waiters = this.waiters.filter(w => (w.method === m.method && w.sid === m.sessionId ? (w.resolve(m.params), false) : true));
        }
      };
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.calls.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  waitFor(method, sid, ms) {
    return new Promise((resolve, reject) => {
      const w = { method, sid, resolve };
      this.waiters.push(w);
      setTimeout(() => { this.waiters = this.waiters.filter(x => x !== w); reject(new Error('Hết thời gian chờ ' + method)); }, ms);
    });
  }
  async newPage() {
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    const p = new Page(this, sessionId);
    p.targetId = targetId;
    this.pages.set(sessionId, p);
    await Promise.all(['Page.enable', 'Runtime.enable', 'Log.enable'].map(m => p.send(m)));
    return p;
  }
  async close() {
    try { await this.send('Browser.close'); } catch { /* đã đóng */ }
    await new Promise(r => { if (this.proc.exitCode !== null) r(); else { this.proc.once('exit', r); setTimeout(() => { this.proc.kill(); r(); }, 3000); } });
    try { fs.rmSync(this.profile, { recursive: true, force: true }); } catch { /* Chrome còn giữ file */ }
  }
}

module.exports = { Browser, findBrowser };
