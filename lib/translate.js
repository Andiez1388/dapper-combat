/*
 * Tự dịch tiếng Việt → tiếng Anh bằng Claude khi lưu nội dung trong /admin.
 *   - Mỗi phần (chữ trên trang, sản phẩm, thiết lập, trang phụ) đăng ký { collect, apply } bằng register():
 *       collect(refs | null) → [{ ref, vi, html }]  (null = mọi chỗ còn thiếu tiếng Anh)
 *       apply([{ ref, vi, en }])                    → ghi bản dịch (bỏ qua nếu chữ tiếng Việt đã đổi trong lúc dịch)
 *   - Dịch chạy nền, gom nhiều câu một lần; câu đã dịch lưu ở data/translations.json → không dịch lại.
 *   - Khóa: ANTHROPIC_API_KEY (.env) hoặc /admin → Tiếng Anh tự dịch (settings.ai.apiKey, không gửi ra trình duyệt).
 *   - DC_AI_MOCK=1: dịch giả "[EN] …" cho bộ kiểm tra tự động (không gọi mạng).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DATA_DIR } = require('./paths');

const FILE = path.join(DATA_DIR, 'translations.json');
const MODEL = 'claude-opus-5-5';
const MAX_ITEMS = 40, MAX_CHARS = 8000;   // mỗi lần gọi: tối đa 40 câu / 8.000 ký tự (trang phụ dài gửi riêng)

const SYSTEM = [
  'You translate Vietnamese website content into natural, concise English for the website of Dapper Combat — a boxing gym (classes: Foundation course, Group Training, student classes, Membership, 1-on-1 personal training) and a fight-gear / apparel shop in Ho Chi Minh City, Vietnam.',
  'Each input item is one piece of text from the site: a button label, menu item, heading, short paragraph, FAQ answer, product name or description, or an HTML fragment. Translate each item independently, in the same order, and return exactly one translation per item.',
  'Rules:',
  '- Keep every placeholder in curly braces exactly as written, e.g. {found.price}, {ship.eta}, {sched.found.A}, {code}.',
  '- Keep HTML tags and attributes exactly as they are; translate only the visible text between tags.',
  '- Keep brand and programme names as written: Dapper Combat, Foundation, Group Training, Membership, BOOK I, Fight Lifestyle.',
  '- Keep numbers, prices, currency marks (đ, ₫, VND), dates, times, phone numbers, emails, URLs and codes unchanged. Write Vietnamese place names in their usual English form (TP. Hồ Chí Minh → Ho Chi Minh City, Sài Gòn → Saigon).',
  '- Match the source style: same capitalisation pattern (ALL CAPS stays ALL CAPS), same line breaks, similar length (UI labels must stay short), same tone (friendly, confident, sporty).',
  '- Common terms: học thử → free trial; đặt cọc → deposit; học viên → member / student; HLV / huấn luyện viên → coach; HSSV → students; giỏ hàng → cart; thanh toán → checkout / payment; giao hàng → delivery; đổi trả → returns; tồn kho → stock; PT 1-1 → 1-on-1 PT.',
  '- If an item is already English, is only a name, number or code, or cannot be translated, return it unchanged.',
  '- Return only the translations, with no notes or explanations.',
].join('\n');

const SCHEMA = {
  type: 'object',
  properties: { translations: { type: 'array', items: { type: 'string' } } },
  required: ['translations'],
  additionalProperties: false,
};

/* ─── Bộ nhớ dịch + trạng thái ─────────────────────────────────────────────── */
const hash = s => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 20);
let mem = null;
function load() {
  if (mem) return mem;
  try { mem = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { mem = {}; }
  mem.cache = mem.cache || {};
  return mem;
}
function save() {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(mem));
  fs.renameSync(tmp, FILE);
}
const state = { running: false, queued: 0, done: 0, failed: 0, lastRunAt: 0, lastError: '', lastErrorAt: 0 };

/* ─── Khóa / bật tắt ───────────────────────────────────────────────────────── */
const settings = () => require('./settings').all().ai || {};
function apiKey() { return settings().apiKey || process.env.ANTHROPIC_API_KEY || ''; }
const mock = () => process.env.DC_AI_MOCK === '1';
function enabled() { return settings().enabled !== false && (mock() || !!apiKey()); }
function keySource() { return mock() ? 'mock' : settings().apiKey ? 'admin' : process.env.ANTHROPIC_API_KEY ? 'env' : ''; }

/* ─── Gọi Claude ───────────────────────────────────────────────────────────── */
let client = null, clientKey = '';
function getClient() {
  const key = apiKey();
  if (!client || clientKey !== key) {
    const Anthropic = require('@anthropic-ai/sdk').default;
    client = new Anthropic({ apiKey: key, maxRetries: 3, timeout: 120000 });
    clientKey = key;
  }
  return client;
}
function friendly(e) {
  const A = require('@anthropic-ai/sdk').default;
  if (e instanceof A.AuthenticationError) return 'Khóa API không đúng hoặc đã bị thu hồi';
  if (e instanceof A.PermissionDeniedError) return 'Khóa API không có quyền dùng model này';
  if (e instanceof A.RateLimitError) return 'Đang bị giới hạn lượt gọi — sẽ thử lại ở lần lưu sau';
  if (e instanceof A.APIConnectionError) return 'Không kết nối được tới dịch vụ AI';
  if (e instanceof A.APIError) return 'Dịch vụ AI báo lỗi ' + (e.status || '') + ': ' + e.message;
  return e.message || String(e);
}
// dịch một nhóm câu → mảng bản dịch cùng thứ tự (lỗi thì ném)
async function callClaude(texts) {
  if (mock()) return texts.map(t => '[EN] ' + t);
  const res = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // fallbacks: nếu model từ chối vì chính sách an toàn, server Anthropic tự chạy lại bằng model dự phòng phù hợp
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: 'Translate these items from Vietnamese to English:\n' + JSON.stringify({ items: texts }) }],
  });
  if (res.stop_reason === 'refusal') throw new Error('AI từ chối dịch nhóm chữ này');
  if (res.stop_reason === 'max_tokens') throw new Error('Nội dung quá dài để dịch một lần');
  const block = res.content.find(b => b.type === 'text');
  const out = block ? JSON.parse(block.text).translations : null;
  if (!Array.isArray(out) || out.length !== texts.length) throw new Error('AI trả về số câu không khớp');
  return out.map(s => String(s));
}
// dịch danh sách câu (đã có trong bộ nhớ thì lấy ra), trả về Map(vi → en); câu dịch lỗi không có trong Map
async function translateTexts(list) {
  const m = load(), out = new Map(), todo = [];
  for (const it of list) {
    const h = hash(it.vi);
    if (m.cache[h] != null) out.set(it.vi, m.cache[h]);
    else if (!todo.some(x => x.vi === it.vi)) todo.push(it);
  }
  // gom nhóm: HTML dài (trang phụ) gửi riêng
  const groups = [];
  let cur = [], size = 0;
  for (const it of todo) {
    const n = it.vi.length;
    if (cur.length && (cur.length >= MAX_ITEMS || size + n > MAX_CHARS)) { groups.push(cur); cur = []; size = 0; }
    cur.push(it); size += n;
  }
  if (cur.length) groups.push(cur);
  for (const g of groups) {
    try {
      const en = await callClaude(g.map(x => x.vi));
      g.forEach((x, i) => { out.set(x.vi, en[i]); m.cache[hash(x.vi)] = en[i]; });
      save();
      state.done += g.length;
    } catch (e) {
      state.failed += g.length;
      state.lastError = friendly(e); state.lastErrorAt = Date.now();
      console.warn('[dịch tự động]', state.lastError);
      if (e instanceof require('@anthropic-ai/sdk').default.AuthenticationError) break;   // sai khóa: dừng hẳn
    }
  }
  return out;
}

/* ─── Hàng đợi ─────────────────────────────────────────────────────────────── */
const kinds = {};                 // kind → { collect, apply }
const pending = new Map();        // kind → Set(ref) | null (= mọi chỗ còn thiếu)
function register(kind, def) { kinds[kind] = def; }
// refs: danh sách chỗ cần dịch; null = quét mọi chỗ còn thiếu tiếng Anh
function queue(kind, refs) {
  if (!kinds[kind] || !enabled()) return;
  if (refs === null) pending.set(kind, null);
  else if (refs && refs.length) {
    const cur = pending.get(kind);
    if (cur === null) return;
    const s = cur || new Set();
    refs.forEach(r => s.add(r));
    pending.set(kind, s);
  } else return;
  state.queued = [...pending.values()].reduce((n, s) => n + (s ? s.size : 1), 0);
  if (!state.running) setImmediate(run);
}
async function run() {
  if (state.running) return;
  state.running = true;
  try {
    while (pending.size) {
      const [kind, refs] = pending.entries().next().value;
      pending.delete(kind);
      state.queued = [...pending.values()].reduce((n, s) => n + (s ? s.size : 1), 0);
      const items = kinds[kind].collect(refs ? [...refs] : null).filter(it => it && String(it.vi || '').trim());
      if (!items.length) continue;
      const map = await translateTexts(items);
      const results = items.filter(it => map.has(it.vi)).map(it => ({ ...it, en: map.get(it.vi) }));
      if (results.length) kinds[kind].apply(results);
    }
    state.lastRunAt = Date.now();
  } catch (e) {
    state.lastError = friendly(e); state.lastErrorAt = Date.now();
    console.warn('[dịch tự động]', e);
  } finally {
    state.running = false;
    state.queued = 0;
  }
}
// chờ hàng đợi dịch xong (cho /api/translate/run?wait=1 và bộ kiểm tra)
async function idle(ms = 60000) {
  const end = Date.now() + ms;
  while ((state.running || pending.size) && Date.now() < end) await new Promise(r => setTimeout(r, 50));
  return !state.running && !pending.size;
}
// số chỗ còn thiếu tiếng Anh theo từng phần
function missing() {
  const out = {};
  for (const [k, def] of Object.entries(kinds)) { try { out[k] = def.collect(null).filter(it => it && String(it.vi || '').trim()).length; } catch { out[k] = 0; } }
  return out;
}
// thử khóa: dịch một câu ngắn (không lưu)
async function test() {
  if (!mock() && !apiKey()) return { ok: false, error: 'Chưa có khóa API' };
  try { const [en] = await callClaude(['Xin chào, chào mừng bạn đến với Dapper Combat!']); return { ok: true, sample: en }; }
  catch (e) { return { ok: false, error: friendly(e) }; }
}
function status() {
  return { enabled: enabled(), keySource: keySource(), model: MODEL, ...state, queued: state.queued, missing: missing() };
}

module.exports = { register, queue, run, idle, status, test, enabled, MODEL };
