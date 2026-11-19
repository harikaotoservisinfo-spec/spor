#!/usr/bin/env bash
# kuzeyakinci.site — iletişim API kurulumu (diğer projelere dokunmaz)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOST="${VPS_HOST:-37.230.105.99}"
PORT="${VPS_PORT:-23422}"
USER="${VPS_USER:-root}"
RSYNC_RSH="ssh -o StrictHostKeyChecking=no -p ${PORT}"

ssh -o StrictHostKeyChecking=no -p "${PORT}" "${USER}@${HOST}" 'bash -s' <<'REMOTE'
set -euo pipefail
mkdir -p /opt/kuzeyakinci-contact
mkdir -p /etc/kuzeyakinci
mkdir -p /var/log/kuzeyakinci
if [ ! -f /etc/kuzeyakinci/contact.env ]; then
  cp /opt/kuzeyakinci-contact/contact.env.example /etc/kuzeyakinci/contact.env 2>/dev/null || true
fi
REMOTE

rsync -avz -e "$RSYNC_RSH" \
  "${ROOT}/deploy/contact-api/contact_server.py" \
  "${ROOT}/deploy/contact-api/contact.env.example" \
  "${USER}@${HOST}:/opt/kuzeyakinci-contact/"

ssh -o StrictHostKeyChecking=no -p "${PORT}" "${USER}@${HOST}" 'bash -s' <<'REMOTE'
set -euo pipefail
chmod 755 /opt/kuzeyakinci-contact/contact_server.py
if [ ! -f /etc/kuzeyakinci/contact.env ]; then
  cp /opt/kuzeyakinci-contact/contact.env.example /etc/kuzeyakinci/contact.env
  chmod 600 /etc/kuzeyakinci/contact.env
fi
install -m 644 /dev/stdin /etc/systemd/system/kuzeyakinci-contact.service <<'UNIT'
[Unit]
Description=Kuzey Akıncı iletişim formu API
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/kuzeyakinci-contact
ExecStart=/usr/bin/python3 /opt/kuzeyakinci-contact/contact_server.py
Restart=on-failure
RestartSec=4
Environment=CONTACT_ENV=/etc/kuzeyakinci/contact.env
Environment=CONTACT_QUEUE=/var/log/kuzeyakinci/contact-queue.jsonl

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now kuzeyakinci-contact.service
systemctl is-active kuzeyakinci-contact.service
REMOTE

echo "İletişim API kuruldu. SMTP için /etc/kuzeyakinci/contact.env içine SMTP_PASS ekleyin."