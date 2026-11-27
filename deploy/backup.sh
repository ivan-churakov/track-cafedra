#!/usr/bin/env bash
# Brief maintenance window: stop writers so database paths and files match.
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
compose() { bash deploy/compose.sh "$@"; }
umask 077
backup_dir="$project_dir/backups/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir"
backend_container="$(compose ps -a -q backend)"
if [[ -z "$backend_container" ]]; then echo 'Backend container not found; no backup was made.' >&2; exit 1; fi
storage_volume="$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/var/lib/track-cafedra/storage"}}{{.Name}}{{end}}{{end}}' "$backend_container")"
if [[ -z "$storage_volume" ]]; then echo 'Expected named storage volume not found.' >&2; exit 1; fi
mapfile -t writers < <(compose --profile telegram ps --status running --services | grep -E '^(backend|frontend|telegram-bot)$' || true)
resume() {
  if (( ${#writers[@]} )); then compose up -d "${writers[@]}"; fi
}
trap resume EXIT
if (( ${#writers[@]} )); then compose stop "${writers[@]}"; fi
compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup_dir/database.dump"
docker run --rm --mount "type=volume,source=$storage_volume,target=/data,readonly" \
  postgres:16-alpine tar -czf - -C /data . > "$backup_dir/storage.tar.gz"
gzip -t "$backup_dir/storage.tar.gz"
compose exec -T postgres pg_restore --list < "$backup_dir/database.dump" > /dev/null
if [[ -f deploy/RELEASE.json ]]; then cp deploy/RELEASE.json "$backup_dir/RELEASE.json"; fi
printf 'Database and storage backup finished at %s\n' "$(date -u +%FT%TZ)" > "$backup_dir/COMPLETE"
echo "Backup saved: $backup_dir (copy it off this server). Environment secrets are not included."
