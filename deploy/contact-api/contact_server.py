#!/usr/bin/env python3
"""kuzeyakinci.site — iletişim formu API (yalnızca bu site)."""
from __future__ import annotations

import json
import os
import re
import smtplib
import ssl
import time
from collections import defaultdict
from datetime import datetime, timezone
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from askf_fixture import get_fixture

PORT = int(os.environ.get("CONTACT_PORT", "9473"))
ENV_FILE = Path(os.environ.get("CONTACT_ENV", "/etc/kuzeyakinci/contact.env"))
QUEUE = Path(os.environ.get("CONTACT_QUEUE", "/var/log/kuzeyakinci/contact-queue.jsonl"))

ALLOWED_ORIGINS = {
    "https://kuzeyakinci.site",
    "https://www.kuzeyakinci.site",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
}

RATE: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 10
RATE_WINDOW = 3600
MAX_BODY = 48_000

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_RE = re.compile(r"^\+?[\d\s().-]{7,24}$")


def load_env() -> dict[str, str]:
    env = {
        "CONTACT_TO": "a.kutluhan@msn.com",
        "SMTP_HOST": "smtp-mail.outlook.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "a.kutluhan@msn.com",
        "SMTP_PASS": "",
        "MAIL_FROM": "Kuzey Akıncı Site <a.kutluhan@msn.com>",
    }
    if not ENV_FILE.is_file():
        return env
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip()
    return env


def queue_write(record: dict) -> None:
    QUEUE.parent.mkdir(parents=True, exist_ok=True)
    with QUEUE.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")


def client_ip(handler: BaseHTTPRequestHandler) -> str:
    forwarded = handler.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    return handler.headers.get("X-Real-IP") or forwarded or handler.client_address[0]


def rate_ok(ip: str) -> bool:
    now = time.time()
    RATE[ip] = [t for t in RATE[ip] if now - t < RATE_WINDOW]
    if len(RATE[ip]) >= RATE_LIMIT:
        return False
    RATE[ip].append(now)
    return True


def origin_ok(handler: BaseHTTPRequestHandler) -> bool:
    origin = handler.headers.get("Origin", "")
    if not origin:
        return True
    return origin in ALLOWED_ORIGINS


def cors_headers(handler: BaseHTTPRequestHandler) -> None:
    origin = handler.headers.get("Origin", "")
    if origin in ALLOWED_ORIGINS:
        handler.send_header("Access-Control-Allow-Origin", origin)
        handler.send_header("Vary", "Origin")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Max-Age", "86400")


def json_response(handler: BaseHTTPRequestHandler, code: int, payload: dict) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(code)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    cors_headers(handler)
    handler.end_headers()
    handler.wfile.write(body)


def clamp(text: str, limit: int) -> str:
    return re.sub(r"\s+", " ", str(text or "").strip())[:limit]


def validate_payload(data: dict) -> tuple[dict | None, str | None]:
    if data.get("website"):
        return None, "spam"
    name = clamp(data.get("name"), 80)
    email = clamp(data.get("email"), 120).lower()
    phone = clamp(data.get("phone"), 24)
    subject = clamp(data.get("subject"), 120)
    topic = clamp(data.get("topic"), 40)
    message = clamp(data.get("message"), 4000)
    consent = bool(data.get("consent"))
    if not consent:
        return None, "consent"
    if len(name) < 2:
        return None, "name"
    if not EMAIL_RE.match(email):
        return None, "email"
    if phone and not PHONE_RE.match(phone):
        return None, "phone"
    if len(message) < 12:
        return None, "message"
    if not subject:
        subject = topic or "İletişim formu"
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "subject": subject,
        "topic": topic,
        "message": message,
    }, None


def send_mail(env: dict[str, str], payload: dict, meta: dict) -> tuple[bool, str]:
    password = env.get("SMTP_PASS", "").strip()
    if not password:
        return False, "smtp_not_configured"
    to_addr = env.get("CONTACT_TO", "a.kutluhan@msn.com")
    host = env.get("SMTP_HOST", "smtp-mail.outlook.com")
    port = int(env.get("SMTP_PORT", "587"))
    user = env.get("SMTP_USER", to_addr)
    mail_from = env.get("MAIL_FROM", f"Kuzey Akıncı Site <{user}>")

    topic_line = f"Konu: {payload['topic']}\n" if payload.get("topic") else ""
    phone_line = f"Telefon: {payload['phone']}\n" if payload.get("phone") else ""
    plain = (
        f"Yeni iletişim formu — kuzeyakinci.site\n\n"
        f"Gönderen: {payload['name']}\n"
        f"E-posta: {payload['email']}\n"
        f"{phone_line}"
        f"Başlık: {payload['subject']}\n"
        f"{topic_line}\n"
        f"Mesaj:\n{payload['message']}\n\n"
        f"---\n"
        f"IP: {meta.get('ip', '?')}\n"
        f"Zaman (UTC): {meta.get('at', '')}\n"
    )

    msg = EmailMessage()
    msg["Subject"] = f"[kuzeyakinci.site] {payload['subject']}"
    msg["From"] = mail_from
    msg["To"] = to_addr
    msg["Reply-To"] = f"{payload['name']} <{payload['email']}>"
    msg.set_content(plain)

    try:
        with smtplib.SMTP(host, port, timeout=30) as smtp:
            smtp.ehlo()
            smtp.starttls(context=ssl.create_default_context())
            smtp.login(user, password)
            smtp.send_message(msg)
        return True, "sent"
    except Exception as exc:
        return False, f"smtp_error:{type(exc).__name__}"


class Handler(BaseHTTPRequestHandler):
    server_version = "KuzeyContact/1.0"

    def log_message(self, fmt: str, *args) -> None:
        return

    def do_OPTIONS(self) -> None:
        path = urlparse(self.path).path
        if path not in ("/api/contact", "/api/askf-fixture"):
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(204)
        cors_headers(self)
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path != "/api/askf-fixture":
            json_response(self, 404, {"ok": False, "error": "not_found"})
            return
        if not origin_ok(self):
            json_response(self, 403, {"ok": False, "error": "origin"})
            return
        qs = parse_qs(urlparse(self.path).query)
        mac_id = (qs.get("macId") or qs.get("mac") or [""])[0].strip()
        if not mac_id:
            json_response(self, 400, {"ok": False, "error": "macId"})
            return
        try:
            fixture = get_fixture(mac_id)
        except ValueError:
            json_response(self, 400, {"ok": False, "error": "macId"})
            return
        except Exception as exc:
            json_response(self, 502, {"ok": False, "error": "upstream", "detail": type(exc).__name__})
            return
        json_response(self, 200, {"ok": True, "fixture": fixture})

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/contact":
            json_response(self, 404, {"ok": False, "error": "not_found"})
            return
        if not origin_ok(self):
            json_response(self, 403, {"ok": False, "error": "origin"})
            return
        ip = client_ip(self)
        if not rate_ok(ip):
            json_response(self, 429, {"ok": False, "error": "rate"})
            return
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length <= 0 or length > MAX_BODY:
            json_response(self, 400, {"ok": False, "error": "body"})
            return
        try:
            raw = self.rfile.read(length)
            data = json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            json_response(self, 400, {"ok": False, "error": "json"})
            return
        if not isinstance(data, dict):
            json_response(self, 400, {"ok": False, "error": "json"})
            return

        payload, err = validate_payload(data)
        if err == "spam":
            json_response(self, 200, {"ok": True, "delivered": False, "saved": False})
            return
        if err:
            json_response(self, 400, {"ok": False, "error": err})
            return

        meta = {
            "ip": ip,
            "at": datetime.now(timezone.utc).isoformat(),
            "ua": clamp(self.headers.get("User-Agent", ""), 200),
        }
        record = {**payload, **meta}
        queue_write(record)

        env = load_env()
        delivered, status = send_mail(env, payload, meta)
        json_response(
            self,
            200,
            {
                "ok": True,
                "delivered": delivered,
                "saved": True,
                "status": status,
            },
        )


def main() -> None:
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"contact api listening on 127.0.0.1:{PORT}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()