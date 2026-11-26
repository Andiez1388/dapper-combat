/* Địa chỉ Việt Nam theo 2 hệ: hệ mới (34 tỉnh, Tỉnh → Phường/Xã, từ 1/7/2025) và hệ cũ (63 tỉnh, Tỉnh → Quận/Huyện → Phường/Xã).
   Khách chọn địa chỉ cũ → máy chủ đổi sang phường / tỉnh mới (phí giao, hỏa tốc TP.HCM, báo cáo đều chạy trên hệ mới),
   vẫn giữ nguyên chữ khách chọn ở addrOld. Dữ liệu: thư viện vietnamadminunits (MIT) → lib/vn và public/assets/vn. */
const fs = require('fs');
const path = require('path');

const cache = {};
function data(name) {
  if (!cache[name]) {
    try { cache[name] = JSON.parse(fs.readFileSync(path.join(__dirname, 'vn', name + '.json'), 'utf8')); }
    catch (e) { console.warn('[địa chỉ] không đọc được', name, e.message); cache[name] = {}; }
  }
  return cache[name];
}

const code = v => String(v || '').replace(/[^\dD]/g, '').slice(0, 8);

/** type 'new' dùng wardCode (mã phường mới), 'old' dùng oldWard (mã phường cũ). Mã lạ → null. */
function resolve(type, wardCode, oldWard) {
  let old = null, wc = code(wardCode);
  if (type === 'old') {
    old = data('vn_old_wards')[code(oldWard)];
    if (!old || !old[3]) return null;
    wc = old[3];
  }
  const w = data('vn_new_wards')[wc];
  if (!w) return null;
  const province = data('vn_new_provinces')[w[1]] || '';
  return {
    type: old ? 'old' : 'new', wardCode: wc, ward: w[0], province, provinceCode: w[1], lat: w[2], lon: w[3],
    oldText: old ? `${old[0]}, ${old[1]}, ${old[2]}` : '', newText: `${w[0]}, ${province}`,
  };
}

/** Khách hàng trong đơn: có mã địa chỉ → điền phường / tỉnh mới theo mã (không tin chữ trình duyệt gửi), giữ chữ cũ ở addrOld. */
function applyToCustomer(customer, body) {
  const a = body && typeof body === 'object' ? body : {};
  const type = a.addrType === 'old' ? 'old' : 'new';
  if (!a.wardCode && !a.oldWard) return { ok: true, used: false };
  const r = resolve(type, a.wardCode, a.oldWard);
  if (!r) return { ok: false };
  customer.ward = r.ward;
  customer.city = r.province;
  customer.wardCode = r.wardCode;
  customer.addrType = r.type;
  if (r.oldText) customer.addrOld = r.oldText; else delete customer.addrOld;
  return { ok: true, used: true, r };
}

/** Khoảng cách đường chim bay (km). */
function km(lat1, lon1, lat2, lon2) {
  const R = 6371, d = x => x * Math.PI / 180;
  const a = Math.sin(d(lat2 - lat1) / 2) ** 2 + Math.cos(d(lat1)) * Math.cos(d(lat2)) * Math.sin(d(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* Khu vực giao hàng tính từ kho TP.HCM: 0 = cùng tỉnh, 1 = miền Nam, 2 = miền Trung, 3 = miền Bắc (34 tỉnh hệ mới) */
const REGION = {
  'TP. Hồ Chí Minh': 0, 'Đồng Nai': 1, 'Tây Ninh': 1, 'Vĩnh Long': 1, 'Đồng Tháp': 1, 'An Giang': 1, 'Cần Thơ': 1, 'Cà Mau': 1,
  'Lâm Đồng': 2, 'Khánh Hòa': 2, 'Đắk Lắk': 2, 'Gia Lai': 2, 'Quảng Ngãi': 2, 'Đà Nẵng': 2, 'Huế': 2, 'Quảng Trị': 2, 'Hà Tĩnh': 2, 'Nghệ An': 2, 'Thanh Hóa': 2,
  'Ninh Bình': 3, 'Hà Nội': 3, 'Hải Phòng': 3, 'Hưng Yên': 3, 'Bắc Ninh': 3, 'Quảng Ninh': 3, 'Phú Thọ': 3, 'Thái Nguyên': 3, 'Tuyên Quang': 3,
  'Lào Cai': 3, 'Lạng Sơn': 3, 'Cao Bằng': 3, 'Sơn La': 3, 'Điện Biên': 3, 'Lai Châu': 3,
};
const fold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/^(thanh pho|tp\.?|tinh)\s+/, '').replace(/[^a-z0-9]/g, '');
const FOLDED = Object.fromEntries(Object.entries(REGION).map(([k, v]) => [fold(k), v]));
/** Khu vực của một tỉnh (gõ tự do vẫn nhận: "TP HCM", "Hồ Chí Minh", "ha noi"…); không nhận ra → null */
function region(city) {
  const f = fold(city);
  if (!f) return null;
  if (/hcm|hochiminh|saigon/.test(f)) return 0;
  return FOLDED[f] !== undefined ? FOLDED[f] : null;
}

/** 34 tỉnh / thành hệ mới (tên ngắn: "TP. Hồ Chí Minh", "Hà Nội"…). */
const provinces = () => Object.values(data('vn_new_provinces'));

module.exports = { resolve, applyToCustomer, km, provinces, region, REGION };
