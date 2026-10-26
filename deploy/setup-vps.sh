#!/usr/bin/env bash
# Cài website Dapper Combat lên VPS Ubuntu 22.04 / 24.04 (chạy bằng quyền root):
#   curl -fsSL https://raw.githubusercontent.com/Andiez1388/dapper-combat/main/deploy/setup-vps.sh -o setup.sh
#   sudo DOMAIN=dappercombat.vn EMAIL=ban@gmail.com ADMIN_EMAIL=ban@gmail.com ADMIN_PASSWORD='mat-khau-cua-ban' bash setup.sh
# Trước đó: trỏ tên miền (bản ghi A cho @ và www) về IP của VPS.
# Chạy lại script này để cập nhật code mới nhất từ GitHub (dữ liệu giữ nguyên).
set -euo pipefail

DOMAIN="${DOMAIN:?Thiếu DOMAIN, vd DOMAIN=dappercombat.vn}"
EMAIL="${EMAIL:?Thiếu EMAIL (để nhận thông báo chứng chỉ HTTPS)}"
REPO="${REPO:-https://github.com/Andiez1388/dapper-combat.git}"
BRANCH="${BRANCH:-main}"
APP=/opt/dapper-combat
DATA=/var/lib/dapper-combat
PORT=3000

echo "== Cài Node.js 22, Nginx, Certbot, PM2"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
apt-get install -y git nginx certbot python3-certbot-nginx
command -v pm2 >/dev/null || npm install -g pm2

echo "== Lấy code từ GitHub ($BRANCH)"
if [ -d "$APP/.git" ]; then git -C "$APP" fetch -q origin && git -C "$APP" checkout -q "$BRANCH" && git -C "$APP" reset -q --hard "origin/$BRANCH"
else git clone -q -b "$BRANCH" "$REPO" "$APP"; fi
cd "$APP" && npm ci --omit=dev

echo "== Cấu hình (.env chỉ tạo lần đầu)"
mkdir -p "$DATA/data" "$DATA/uploads"
if [ ! -f "$APP/.env" ]; then
  cat > "$APP/.env" <<ENV
PORT=$PORT
NODE_ENV=production
DC_DATA_DIR=$DATA/data
DC_UPLOAD_DIR=$DATA/uploads
SITE_URL=https://$DOMAIN
ADMIN_EMAIL=${ADMIN_EMAIL:-}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
ENV
  chmod 600 "$APP/.env"
fi

echo "== Chạy website bằng PM2 (tự chạy lại khi khởi động máy)"
pm2 startOrReload "$APP/deploy/ecosystem.config.js" --update-env
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null || true

echo "== Nginx + HTTPS cho $DOMAIN"
cat > /etc/nginx/sites-available/dapper-combat <<NGINX
server {
  listen 80;
  server_name $DOMAIN www.$DOMAIN;
  client_max_body_size 100m;
  location / {
    proxy_pass http://127.0.0.1:$PORT;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NGINX
ln -sf /etc/nginx/sites-available/dapper-combat /etc/nginx/sites-enabled/dapper-combat
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -m "$EMAIL" --agree-tos -n --redirect || echo "!! Chưa cấp được HTTPS — kiểm tra tên miền đã trỏ về IP này chưa, rồi chạy lại script"

echo
echo "Xong: https://$DOMAIN  ·  Quản trị: https://$DOMAIN/admin"
echo "Sao lưu định kỳ thư mục $DATA (dữ liệu + ảnh tải lên)."
pm2 logs dapper-combat --lines 5 --nostream | grep "quản trị" || true
