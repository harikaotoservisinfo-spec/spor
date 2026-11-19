# kuzeyakinci.site — form e-posta ayarı

Form gönderimleri `POST /api/contact` üzerinden `a.kutluhan@msn.com` adresine gider.

## Sunucu bileşenleri

- Python API: `/opt/kuzeyakinci-contact/contact_server.py`
- systemd: `kuzeyakinci-contact.service`
- Nginx: `location = /api/contact` → `127.0.0.1:9473`
- Kuyruk günlüğü (SMTP kapalıyken): `/var/log/kuzeyakinci/contact-queue.jsonl`

## SMTP (MSN / Outlook)

1. [Microsoft uygulama parolası](https://account.live.com/proofs/AppPassword) oluşturun.
2. VPS’te `/etc/kuzeyakinci/contact.env` dosyasını düzenleyin:

```env
CONTACT_TO=a.kutluhan@msn.com
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=a.kutluhan@msn.com
SMTP_PASS=UYGULAMA_PAROLASI
MAIL_FROM=Kuzey Akıncı Site <a.kutluhan@msn.com>
```

3. Servisi yeniden başlatın: `systemctl restart kuzeyakinci-contact`

## Kurulum (repo’dan)

```bash
chmod +x deploy/scripts/vps-install-contact-api.sh
VPS_HOST=37.230.105.99 VPS_PORT=23422 ./deploy/scripts/vps-install-contact-api.sh
```

Nginx’i güncelledikten sonra: `nginx -t && systemctl reload nginx`