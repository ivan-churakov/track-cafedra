#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
origin="${1:-}"
small_server=false
if [[ "${2:-}" == --small-server ]]; then small_server=true; fi
if [[ ! "$origin" =~ ^https?://[a-zA-Z0-9.-]+(:[0-9]+)?$ ]]; then
  echo 'Usage: bash deploy/init-env.sh https://your-domain.ru (no trailing slash)' >&2
  exit 1
fi
if [[ -e deploy/.env.production ]]; then
  echo 'deploy/.env.production already exists; edit it manually. Secrets were not replaced.' >&2
  exit 1
fi
command -v openssl >/dev/null
umask 077
set -o noclobber
while IFS= read -r line || [[ -n "$line" ]]; do
  case "$line" in
    PUBLIC_ORIGIN=*) printf 'PUBLIC_ORIGIN=%s\n' "$origin" ;;
    POSTGRES_PASSWORD=*|JWT_SECRET=*|ADMIN_PASSWORD=*|TELEGRAM_BOT_SECRET=*)
      printf '%s=%s\n' "${line%%=*}" "$(openssl rand -hex 32)" ;;
    POSTGRES_MEMORY=*) if $small_server; then echo 'POSTGRES_MEMORY=128m'; else echo "$line"; fi ;;
    POSTGRES_SHARED_BUFFERS=*) if $small_server; then echo 'POSTGRES_SHARED_BUFFERS=32MB'; else echo "$line"; fi ;;
    POSTGRES_MAX_CONNECTIONS=*) if $small_server; then echo 'POSTGRES_MAX_CONNECTIONS=30'; else echo "$line"; fi ;;
    BACKEND_MEMORY=*) if $small_server; then echo 'BACKEND_MEMORY=512m'; else echo "$line"; fi ;;
    FRONTEND_MEMORY=*) if $small_server; then echo 'FRONTEND_MEMORY=192m'; else echo "$line"; fi ;;
    BOT_MEMORY=*) if $small_server; then echo 'BOT_MEMORY=192m'; else echo "$line"; fi ;;
    *) printf '%s\n' "$line" ;;
  esac
done < deploy/.env.production.example > deploy/.env.production
echo 'Created deploy/.env.production with unique secrets (mode 600).'
echo 'Read ADMIN_PASSWORD locally on the server. Configure SMTP and Telegram if needed.'
