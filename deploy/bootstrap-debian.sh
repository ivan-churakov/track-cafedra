#!/usr/bin/env bash
# Run explicitly once as root on a new Debian server. No application is started.
set -euo pipefail
if (( EUID != 0 )); then echo 'Run with sudo or from the root console.' >&2; exit 1; fi
deploy_user="${1:-}"
public_host="${2:-}"
if [[ ! "$deploy_user" =~ ^[a-z_][a-z0-9_-]*$ ]] || ! id "$deploy_user" >/dev/null 2>&1; then
  echo 'First argument must be an existing deployment user.' >&2; exit 1
fi
if [[ ! "$public_host" =~ ^[a-zA-Z0-9.-]+$ ]]; then
  echo 'Usage: sudo bash deploy/bootstrap-debian.sh USER DOMAIN_OR_IP' >&2; exit 1
fi
. /etc/os-release
if [[ "$ID" != debian ]]; then echo 'This script supports Debian only.' >&2; exit 1; fi
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl nginx openssl certbot python3-certbot-nginx
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian %s stable\n' \
  "$(dpkg --print-architecture)" "$VERSION_CODENAME" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker "$deploy_user"
systemctl enable --now docker nginx
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
site=/etc/nginx/sites-available/track-cafedra
if [[ ! -e "$site" ]]; then
  sed "s/YOUR_DOMAIN/$public_host/g" "$project_dir/deploy/nginx/host.conf.example" > "$site"
  ln -s "$site" /etc/nginx/sites-enabled/track-cafedra
  nginx -t
  systemctl reload nginx
else
  echo 'Existing track-cafedra Nginx configuration was preserved.'
fi
echo 'Server tools installed. Reconnect SSH to activate Docker group membership.'
echo 'Application port is loopback 8090. Open inbound TCP 22, 80 and 443 in the provider firewall.'
