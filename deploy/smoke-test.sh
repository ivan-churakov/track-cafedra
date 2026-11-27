#!/usr/bin/env bash
set -euo pipefail
base="${1:-http://127.0.0.1:8090}"
base="${base%/}"
command -v curl >/dev/null
curl_options=()
# Optional address mapping for servers whose public IP does not support NAT hairpin.
if [[ -n "${2:-}" ]]; then curl_options+=(--resolve "$2"); fi
for route in / /students /teachers /teacher/login /admin /track /track2 /api/teachers /api/study-plans /api/retake-schedules; do
  curl "${curl_options[@]}" --fail --silent --show-error --max-time 40 "$base$route" >/dev/null
  printf 'OK %s\n' "$route"
done
status="$(curl "${curl_options[@]}" --silent --show-error --max-time 20 -o /dev/null -w '%{http_code}' \
  -H 'Content-Type: application/json' -d '{"login":"deployment-invalid-user","password":"invalid-password"}' \
  "$base/api/auth/login")"
if [[ "$status" != 401 ]]; then
  echo "FAIL: invalid login returned $status instead of 401; verify Java API routing." >&2
  exit 1
fi
status="$(curl "${curl_options[@]}" --silent --show-error --max-time 20 -o /dev/null -w '%{http_code}' "$base/api/auth/me")"
if [[ "$status" != 401 ]]; then
  echo "FAIL: anonymous /api/auth/me returned $status instead of 401." >&2
  exit 1
fi
echo 'API authentication rejects anonymous and invalid credentials.'
