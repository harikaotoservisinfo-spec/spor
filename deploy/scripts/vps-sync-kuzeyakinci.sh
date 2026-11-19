#!/usr/bin/env bash
# Yerel site/ klasörünü VPS'e yükler (nginx: kuzeyakinci.site).
# Kullanım: VPS_HOST=37.230.105.99 VPS_PORT=23422 VPS_USER=root ./deploy/scripts/vps-sync-kuzeyakinci.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOST="${VPS_HOST:-37.230.105.99}"
PORT="${VPS_PORT:-23422}"
USER="${VPS_USER:-root}"
DEST="${VPS_DEST:-/var/www/kuzeyakinci.site}"

RSYNC_RSH="ssh -o StrictHostKeyChecking=no -p ${PORT}"
rsync -avz --delete -e "$RSYNC_RSH" "${ROOT}/site/" "${USER}@${HOST}:${DEST}/"
echo "Yüklendi: ${USER}@${HOST}:${DEST}"