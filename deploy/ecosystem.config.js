// PM2: giữ website luôn chạy trên VPS (deploy/setup-vps.sh). Chỉ chạy 1 tiến trình — dữ liệu lưu trong file JSON.
module.exports = {
  apps: [{
    name: 'dapper-combat',
    script: 'server.js',
    cwd: __dirname + '/..',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '400M',
    env: { NODE_ENV: 'production' },
  }],
};
