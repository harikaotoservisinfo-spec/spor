#!/usr/bin/env python3
"""Antalya ASKF canlı skor sayfasından maç özeti (kuzeyakinci.site)."""
from __future__ import annotations

import re
import time
import urllib.request
from typing import Any
from urllib.parse import urljoin

ASKF_ORIGIN = "https://antalyaaskf.org"
_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
_CACHE_TTL = 600
_MAC_ID_RE = re.compile(r"^\d{4,9}$")

MONTHS = {
    "oca": 1,
    "şub": 2,
    "sub": 2,
    "mar": 3,
    "nis": 4,
    "may": 5,
    "haz": 6,
    "tem": 7,
    "ağu": 8,
    "agu": 8,
    "eyl": 9,
    "eki": 10,
    "kas": 11,
    "ara": 12,
    "ocak": 1,
    "şubat": 2,
    "subat": 2,
    "mart": 3,
    "nisan": 4,
    "mayıs": 5,
    "mayis": 5,
    "haziran": 6,
    "temmuz": 7,
    "ağustos": 8,
    "agustos": 8,
    "eylül": 9,
    "eylul": 9,
    "ekim": 10,
    "kasım": 11,
    "kasim": 11,
    "aralık": 12,
    "aralik": 12,
}


def _norm_month(token: str) -> int | None:
    key = token.strip().lower().replace("i̇", "i")
    if key in MONTHS:
        return MONTHS[key]
    short = key[:3]
    return MONTHS.get(short)


def _strip_html(chunk: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", chunk or "")).strip()


def _abs_logo(path: str) -> str:
    if not path:
        return ""
    if path.startswith("http"):
        return path
    return urljoin(ASKF_ORIGIN, path)


def parse_meta_lines(sb_html: str) -> list[str]:
    meta = re.search(r'<div class="meta">(.*?)</div>', sb_html, re.S)
    if not meta:
        return []
    lines = []
    for span in re.findall(r"<span>(.*?)</span>", meta.group(1), re.S):
        text = _strip_html(span)
        if text:
            lines.append(text)
    return lines


def parse_date_time(line: str) -> tuple[str, str, str]:
    raw = (line or "").strip()
    if not raw or "belirlenmedi" in raw.lower():
        return "", "", raw or "Tarih belirlenmedi"
    m = re.match(
        r"(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşüİ]+)\s+(\d{4})\s*·\s*[^·]+\s*·\s*(\d{1,2}):(\d{2})",
        raw,
    )
    if not m:
        return "", "", raw
    day, mon_token, year, hour, minute = m.groups()
    month = _norm_month(mon_token)
    if not month:
        return "", "", raw
    date_display = f"{int(day):02d}.{month:02d}.{year}"
    time_display = f"{int(hour):02d}:{minute}"
    return date_display, time_display, raw


def parse_teams(sb_html: str) -> tuple[dict[str, str], dict[str, str]]:
    home: dict[str, str] = {}
    away: dict[str, str] = {}
    for block in re.findall(r'<a class="tm"[^>]*>(.*?)</a>', sb_html, re.S):
        img = re.search(r'src="([^"]+)"', block)
        name_m = re.search(r"<b>([^<]+)</b>", block)
        role_m = re.search(r"<small>([^<]+)</small>", block)
        if not name_m:
            continue
        entry = {
            "name": name_m.group(1).strip(),
            "logo": _abs_logo(img.group(1)) if img else "",
            "role": role_m.group(1).strip() if role_m else "",
        }
        role = entry["role"].lower()
        if "ev" in role:
            home = entry
        elif "dep" in role:
            away = entry
    return home, away


def parse_status(sb_html: str) -> str:
    if re.search(r"Maç başlamadı", sb_html, re.I):
        return "upcoming"
    if re.search(r"class=\"bekliyor\"", sb_html):
        return "waiting"
    if re.search(r"class=\"n vs\"", sb_html) and not re.search(r"<span>\d</span>", sb_html):
        return "upcoming"
    if re.search(r"<div class=\"sc\">.*?<span>\d", sb_html, re.S):
        return "played"
    return "unknown"


def parse_fixture_html(html: str, page_url: str) -> dict[str, Any]:
    block = re.search(r'<section class="nx-md-sb">(.*?)</section>', html, re.S)
    sb = block.group(1) if block else ""
    meta = parse_meta_lines(sb)
    competition = meta[0] if meta else ""
    date_line = meta[1] if len(meta) > 1 else ""
    venue_name = meta[2] if len(meta) > 2 else ""
    date, time_str, date_raw = parse_date_time(date_line)
    home, away = parse_teams(sb)
    title_m = re.search(r"<title>([^<]+)</title>", html, re.I)
    title = title_m.group(1).strip() if title_m else ""
    status = parse_status(sb)
    maps_query = venue_name.replace(" ", "+") if venue_name else "Antalya"
    return {
        "sourceUrl": page_url,
        "title": title,
        "competition": competition,
        "date": date,
        "time": time_str,
        "dateRaw": date_raw,
        "datePending": not bool(date),
        "venueName": venue_name,
        "venueAddress": "",
        "venueCity": "Antalya",
        "mapsUrl": f"https://maps.google.com/?q={urllib.request.quote(maps_query)}",
        "homeName": home.get("name", ""),
        "awayName": away.get("name", ""),
        "homeLogo": home.get("logo", ""),
        "awayLogo": away.get("logo", ""),
        "status": status,
        "fetchedAt": int(time.time()),
    }


def fetch_askf_html(mac_id: str) -> str:
    url = f"{ASKF_ORIGIN}/canli-skor/{mac_id}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "KuzeyAkinciFixture/1.0 (+https://kuzeyakinci.site)",
            "Accept": "text/html",
            "Accept-Language": "tr-TR,tr;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=28) as resp:
        return resp.read().decode("utf-8", "replace")


def get_fixture(mac_id: str, *, cache_ttl: int = _CACHE_TTL) -> dict[str, Any]:
    if not _MAC_ID_RE.match(mac_id):
        raise ValueError("invalid_mac_id")
    now = time.time()
    cached = _CACHE.get(mac_id)
    if cached and now - cached[0] < cache_ttl:
        return {**cached[1], "cached": True}
    page_url = f"{ASKF_ORIGIN}/canli-skor/{mac_id}"
    html = fetch_askf_html(mac_id)
    fixture = parse_fixture_html(html, page_url)
    fixture["macId"] = mac_id
    fixture["cached"] = False
    _CACHE[mac_id] = (now, fixture)
    return fixture