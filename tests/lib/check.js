// Ghi kết quả kiểm tra: t.ok(điều kiện, tên, chi tiết khi sai)
function createChecker() {
  const results = [];
  let section = '';
  return {
    section(name) { section = name; console.log('\n── ' + name); },
    ok(cond, name, detail) {
      const pass = !!cond;
      results.push({ section, name, pass, detail });
      console.log((pass ? '  ✓ ' : '  ✗ ') + name + (pass || detail === undefined ? '' : '\n      → ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 600)));
      return pass;
    },
    // chạy một khối; lỗi bất ngờ = 1 kiểm tra sai, các khối sau vẫn chạy
    async run(name, fn) {
      try { await fn(); } catch (e) { this.ok(false, name + ' — lỗi khi chạy', e.stack || e.message); }
    },
    results,
  };
}
module.exports = { createChecker };
