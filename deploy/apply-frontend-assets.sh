#!/usr/bin/env bash
# For public/ assets only. React/TypeScript changes require a full release build.
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
update_dir="$(realpath -- "${1:?Provide the unpacked asset update directory}")"
release_tag="${2:?Provide a unique frontend image tag}"
if [[ ! "$release_tag" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]]; then
  echo 'Invalid release tag' >&2; exit 1
fi
test -d "$update_dir/public"
test -f "$update_dir/deploy/frontend-assets.Dockerfile"
cd "$project_dir"
compose() { bash deploy/compose.sh "$@"; }
compose config --quiet
frontend_container="$(compose ps -q frontend)"
test -n "$frontend_container"
base_image="$(docker inspect --format '{{.Config.Image}}' "$frontend_container")"
backend_container="$(compose ps -q backend)"
if docker image inspect "track-cafedra/frontend:$release_tag" >/dev/null 2>&1; then
  echo 'Release tag already exists; use a new tag.' >&2; exit 1
fi

umask 077
backup_dir="$project_dir/backups/frontend-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir"
cp -p deploy/.env.production "$backup_dir/.env.production"
docker build --pull=false --build-arg "FRONTEND_IMAGE=$base_image" \
  -t "track-cafedra/frontend:$release_tag" \
  -f "$update_dir/deploy/frontend-assets.Dockerfile" "$update_dir"
cp -a "$update_dir/public/." "$project_dir/public/"

python3 - "$release_tag" <<'PY'
from pathlib import Path
import re
import sys
path = Path('deploy/.env.production')
text = path.read_text()
setting = 'FRONTEND_RELEASE_TAG=' + sys.argv[1]
if re.search(r'^FRONTEND_RELEASE_TAG=', text, flags=re.M):
    text = re.sub(r'^FRONTEND_RELEASE_TAG=.*$', setting, text, flags=re.M)
else:
    text = text.rstrip() + '\n' + setting + '\n'
path.write_text(text)
PY
if ! compose up --no-build --pull never -d --no-deps --wait --wait-timeout 120 frontend; then
  cp -p "$backup_dir/.env.production" deploy/.env.production
  compose up --no-build --pull never -d --no-deps --wait --wait-timeout 120 frontend
  echo 'Frontend startup failed; previous release restored.' >&2
  exit 1
fi
test "$(compose ps -q backend)" = "$backend_container"
echo "Frontend asset release applied: $release_tag. Backend container preserved."
echo "Previous environment: $backup_dir/.env.production"
