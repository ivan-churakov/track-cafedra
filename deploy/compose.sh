#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
if [[ ! -f deploy/.env.production ]]; then
  echo 'Missing deploy/.env.production. Run: bash deploy/init-env.sh https://YOUR_DOMAIN' >&2
  exit 1
fi
exec docker compose --env-file deploy/.env.production -f compose.production.yml "$@"
