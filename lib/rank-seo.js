// Các trang danh sách của Academy Ranking: tiêu đề tab = chữ "ranking.<id>.title", mô tả Google = "ranking.seo.<id>.desc"
// (sửa ở /admin → Nội dung website → Academy Ranking; title / desc dưới đây là mặc định)
const PAGES = [
  { id: 'rank', path: '/xep-hang', label: 'Bảng ranking (/xep-hang)', title: 'Ranking võ sĩ', desc: 'Dapper Combat Academy Ranking — bảng xếp hạng nội bộ học viện: điểm, sao, hạng và thành tích từng võ sĩ nam, nữ theo hạng cân.' },
  { id: 'dir', path: '/vo-si', label: 'Thông tin võ sĩ (/vo-si)', title: 'Thông tin võ sĩ', desc: 'Danh sách võ sĩ Dapper Combat Academy: thành tích, điểm xếp hạng, hạng cân và hồ sơ chi tiết.' },
  { id: 'ev', path: '/su-kien', label: 'Lịch sự kiện (/su-kien)', title: 'Lịch sự kiện', desc: 'Lịch fight night, sparring và kỳ đánh giá kỹ năng của Dapper Combat Academy, kèm kết quả từng trận.' },
  { id: 'cmp', path: '/so-sanh', label: 'So sánh võ sĩ (/so-sanh)', title: 'So sánh võ sĩ', desc: 'So sánh 2 võ sĩ Dapper Combat Academy: điểm, kỹ năng, thông số, đối đầu trực tiếp và khả năng thắng.' },
];
module.exports = { PAGES };
