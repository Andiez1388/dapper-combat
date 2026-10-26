/*
 * Thư mục dữ liệu dùng chung cho server:
 *   DATA_DIR   — dữ liệu chạy thật (*.json, .jwt-secret, bản cất trước khi khôi phục). Đổi bằng biến môi trường DC_DATA_DIR.
 *   SEED_DIR   — dữ liệu gốc đi kèm mã nguồn (luôn là data/seed của repo): sản phẩm, trang phụ, danh mục nội dung.
 *   UPLOAD_DIR — ảnh / video / phông tải lên từ /admin. Đổi bằng DC_UPLOAD_DIR (server.js phục vụ /assets/uploads từ thư mục đó).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = process.env.DC_DATA_DIR ? path.resolve(process.env.DC_DATA_DIR) : path.join(ROOT, 'data');
const SEED_DIR = path.join(ROOT, 'data', 'seed');
const UPLOAD_DIR = process.env.DC_UPLOAD_DIR ? path.resolve(process.env.DC_UPLOAD_DIR) : path.join(ROOT, 'public', 'assets', 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

module.exports = { ROOT, DATA_DIR, SEED_DIR, UPLOAD_DIR, CUSTOM_UPLOAD_DIR: !!process.env.DC_UPLOAD_DIR };
