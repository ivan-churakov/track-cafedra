#!/usr/bin/env bash
# Run from the deployed repository: sudo bash deploy/enable-ip-https.sh IP
set -euo pipefail
if (( EUID != 0 )); then echo 'Run this script with sudo.' >&2; exit 1; fi
server_ip="${1:-176.109.100.65}"
python3 -c 'import ipaddress,sys; assert ipaddress.ip_address(sys.argv[1]).version == 4' "$server_ip"
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
test -f deploy/.env.production
site=/etc/nginx/sites-available/track-cafedra
test -f "$site"
backup_dir="$project_dir/backups/https-$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 700 "$backup_dir"
cp -p "$site" "$backup_dir/nginx.conf"
cp -p deploy/.env.production "$backup_dir/.env.production"
echo "Original Nginx configuration and environment saved in $backup_dir"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y python3-venv
if [[ ! -x /opt/certbot/bin/python ]]; then python3 -m venv /opt/certbot; fi
/opt/certbot/bin/pip install --upgrade pip
/opt/certbot/bin/pip install --upgrade 'certbot>=5.4,<6' 'certbot-nginx>=5.4,<6'
/opt/certbot/bin/certbot --version
if [[ ! -e /usr/local/bin/certbot ]]; then
  ln -s /opt/certbot/bin/certbot /usr/local/bin/certbot
fi
install -d -m 755 /var/www/letsencrypt/.well-known/acme-challenge

apply_nginx() {
  sed "s/SERVER_IP/$server_ip/g" "$1" > "$site"
  if ! nginx -t; then
    cp -p "$backup_dir/nginx.conf" "$site"
    echo "Invalid Nginx configuration; original restored from $backup_dir" >&2
    exit 1
  fi
  systemctl reload nginx
}

# Preserve an existing HTTPS installation on repeat runs.
if ! grep -q 'location \^~ /.well-known/acme-challenge/' "$site"; then
  apply_nginx deploy/nginx/ip-http.conf.template
fi

# Test external ACME validation before requesting a publicly trusted certificate.
/opt/certbot/bin/certbot certonly --dry-run --non-interactive --agree-tos \
  --register-unsafely-without-email --preferred-profile shortlived \
  --webroot --webroot-path /var/www/letsencrypt --ip-address "$server_ip"
/opt/certbot/bin/certbot certonly --non-interactive --agree-tos \
  --register-unsafely-without-email --preferred-profile shortlived \
  --cert-name track-cafedra-ip --webroot --webroot-path /var/www/letsencrypt \
  --ip-address "$server_ip"

install -m 755 deploy/renew-nginx.sh /etc/letsencrypt/renewal-hooks/deploy/track-cafedra-nginx
apply_nginx deploy/nginx/ip-https.conf.template

# Only the public origin changes; passwords and other secrets are preserved.
python3 - "$server_ip" <<'PY'
from pathlib import Path
import re
import sys
path = Path('deploy/.env.production')
text, count = re.subn(r'^PUBLIC_ORIGIN=.*$', 'PUBLIC_ORIGIN=https://' + sys.argv[1], path.read_text(), flags=re.M)
if count != 1:
    raise SystemExit('Expected exactly one PUBLIC_ORIGIN setting')
path.write_text(text)
PY
bash deploy/compose.sh up --no-build --pull never -d --wait --wait-timeout 300

install -m 644 deploy/systemd/track-cafedra-certbot.service /etc/systemd/system/track-cafedra-certbot.service
install -m 644 deploy/systemd/track-cafedra-certbot.timer /etc/systemd/system/track-cafedra-certbot.timer
systemctl daemon-reload
systemctl enable --now track-cafedra-certbot.timer
# The Debian 2.x client cannot manage certificates issued by the modern client.
systemctl disable --now certbot.timer
/opt/certbot/bin/certbot renew --cert-name track-cafedra-ip --dry-run --run-deploy-hooks --no-random-sleep-on-renew
bash deploy/smoke-test.sh "https://$server_ip" "$server_ip:443:127.0.0.1"
openssl x509 -in /etc/letsencrypt/live/track-cafedra-ip/fullchain.pem -noout -issuer -dates -ext subjectAltName
systemctl list-timers track-cafedra-certbot.timer
echo "HTTPS configured: https://$server_ip (automatic renewal enabled)."
