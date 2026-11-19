const KEY = "kuzey-akinci-profile-v1";
const CHAPTERS = [
  { id: "kisi", index: "01", title: "Kişi", kicker: "Önce insan", line: "Formadan önce gelen taraf." },
  { id: "futbolcu", index: "02", title: "Futbolcu", kicker: "Sahada", line: "Numara, mevki, oyun fikri." },
  { id: "istatistikler", index: "03", title: "İstatistikler", kicker: "Rakamlar", line: "Sezon, maç ve sahaya yansıyan sayılar." },
  { id: "elci", index: "04", title: "Elçi", kicker: "Duruş", line: "Oyunun içinde nasıl durduğu." },
  { id: "projeler", index: "05", title: "Projeler", kicker: "Kurulanlar", line: "Bitmemiş, başlamış işler." }
];

const SPOTS = [
  ["kaleci", 50, 92],
  ["santrafor", 50, 16],
  ["forvet", 50, 22],
  ["sol kanat", 18, 30],
  ["sağ kanat", 82, 30],
  ["on numara", 50, 36],
  ["orta saha", 50, 48],
  ["ön libero", 50, 58],
  ["sol bek", 16, 72],
  ["sağ bek", 84, 72],
  ["stoper", 50, 74],
  ["libero", 50, 64],
  ["bek", 18, 72],
  ["kanat", 18, 30]
];

const ROW_FIELDS = {
  facts: ["label", "value"],
  stats: ["label", "value"],
  gameStats: ["label", "value"],
  seasons: ["id", "label", "competition", "played", "goals", "wins", "draws", "losses"],
  matches: ["season", "date", "time", "home", "away", "score", "competition", "macId", "role", "subIn", "subOut", "minutes", "goals"],
  goalEvents: ["season", "macId", "minute", "type", "date"],
  honours: ["year", "title", "detail"],
  values: ["title", "text"],
  dreams: ["title", "text"],
  photos: ["file", "alt", "caption", "chapter"],
  personaBlocks: ["title", "text", "chapter", "align"],
  futbolBlocks: ["title", "text", "chapter", "align"]
};

const PHOTO_PATH = /^photos\/[a-z0-9._-]+\.(png|jpe?g|webp)$/i;

const PLACEHOLDERS = {
  label: "Başlık",
  value: "Değer",
  year: "Yıl",
  title: "Ad",
  detail: "Not",
  text: "Cümle",
  file: "photos/dosya.png",
  chapter: "kisi",
  align: "left",
  id: "2025-26",
  competition: "U15 Gelişim Ligi",
  played: "25",
  goals: "12",
  wins: "17",
  draws: "2",
  losses: "6",
  season: "2025-26",
  date: "13.09.2025",
  time: "13.00",
  home: "Ev sahibi",
  away: "Misafir",
  score: "2-1",
  macId: "300799",
  role: "ilk11",
  subIn: "40",
  subOut: "57",
  minutes: "57",
  minute: "67",
  type: "F - Ayak"
};

const GOAL_LIMITS = { season: 12, macId: 12, minute: 4, type: 24, date: 16 };

const DEFAULT = window.SAHA_DEFAULT;
let profile;
let menuOpen = false;
let editorOpen = false;
let reelObserver = null;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function safeColor(value, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || "")) ? String(value) : fallback;
}

function safeAskfUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return "";
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "antalyaaskf.org") return "";
    return url.href;
  } catch {
    return "";
  }
}

function safeTffUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return "";
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "tff.org") return "";
    return url.href;
  } catch {
    return "";
  }
}

function safeSocialUrl(value, kind) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return "";
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (kind === "youtube" && (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be")) {
      return host === "youtu.be"
        ? `https://www.youtube.com/watch?v=${encodeURIComponent(url.pathname.slice(1))}`
        : `https://www.youtube.com${url.pathname}`;
    }
    if (kind === "instagram" && (host === "instagram.com" || host === "m.instagram.com")) {
      const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
      return `https://www.instagram.com${path}`;
    }
  } catch {
    return "";
  }
  return "";
}

function youtubeIcon() {
  return `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2c-.3-1.1-1.2-2-2.3-2.3C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.2.4c-1.1.3-2 1.2-2.3 2.3C0 8 0 12 0 12s0 4 .5 5.8c.3 1.1 1.2 2 2.3 2.3 1.8.4 9.2.4 9.2.4s7.4 0 9.2-.4c1.1-.3 2-1.2 2.3-2.3.5-1.8.5-5.8.5-5.8s0-4-.5-5.8ZM9.7 15.5V8.5L15.8 12l-6.1 3.5Z"/></svg>`;
}

function instagramIcon() {
  return `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.8A5.2 5.2 0 1 1 7.8 13 5.2 5.2 0 0 1 12 7.8Zm0 2A3.2 3.2 0 1 0 15.2 13 3.2 3.2 0 0 0 12 9.8Zm5.6-2.9a1.2 1.2 0 1 1-1.2 1.2 1.2 1.2 0 0 1 1.2-1.2Z"/></svg>`;
}

function socialIconsHTML(person) {
  const youtube = safeSocialUrl(person.youtube, "youtube");
  const instagram = safeSocialUrl(person.instagram, "instagram");
  if (!youtube && !instagram) return "";
  return `<div class="social">
    ${youtube ? `<a class="social-link" href="${esc(youtube)}" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><span class="sr-only">YouTube</span>${youtubeIcon()}</a>` : ""}
    ${instagram ? `<a class="social-link" href="${esc(instagram)}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><span class="sr-only">Instagram</span>${instagramIcon()}</a>` : ""}
  </div>`;
}

function personalSahaHTML(person) {
  return `<span class="personal-tag"><span class="personal-label">Kişisel saha</span>${socialIconsHTML(person)}</span>`;
}

function cleanLine(value, max, fallback = "") {
  const text = String(value ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  return text || fallback;
}

function cleanBlock(value, max) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function cleanPhotos(list, max = 24) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, max).map((item) => {
    const file = String(item?.file ?? "").trim();
    if (!PHOTO_PATH.test(file)) return null;
    let chapter = cleanLine(item?.chapter, 20).toLocaleLowerCase("tr");
    if (chapter === "kupalar") chapter = "istatistikler";
    if (!CHAPTERS.some((ch) => ch.id === chapter)) {
      if (file.includes("portre")) chapter = "kisi";
      else if (file.includes("futbolcu")) chapter = "futbolcu";
      else if (file.includes("projeler")) chapter = "projeler";
      else if (file.includes("kupalar") || file.includes("istatistik")) chapter = "istatistikler";
      else if (file.includes("elci")) chapter = "elci";
      else chapter = "";
    }
    return {
      file,
      alt: cleanLine(item?.alt, 120, "Fotoğraf"),
      caption: cleanLine(item?.caption, 120),
      chapter
    };
  }).filter(Boolean);
}

function mergePhotos(list) {
  const defaults = cleanPhotos(DEFAULT.photos || []);
  if (!list.length) return defaults;
  const known = new Set(list.map((photo) => photo.file));
  const merged = [...list];
  defaults.forEach((photo) => {
    if (!known.has(photo.file)) merged.push(photo);
  });
  return merged;
}

function chapterPhoto(person, id) {
  const photos = person.photos || [];
  const hit = photos.find((photo) => photo.chapter === id);
  if (hit) return hit;
  const index = { kisi: 0, futbolcu: 1, istatistikler: 2, kupalar: 2, elci: 3, projeler: 4 }[id];
  if (index !== undefined && photos[index]) return photos[index];
  return null;
}

function heroPhoto(person) {
  return chapterPhoto(person, "kisi");
}

function photoFigure(photo, className = "portrait") {
  if (!photo?.file) return "";
  const cap = photo.caption ? `<figcaption>${esc(photo.caption)}</figcaption>` : "";
  return `<figure class="${className}">
    <img src="${esc(photo.file)}" alt="${esc(photo.alt)}" width="960" height="1200" decoding="async" loading="lazy">
    ${cap}
  </figure>`;
}

function galleryHTML(photos) {
  if (!photos.length) {
    return `<p class="empty">İlk fotoğraf burada görünür.</p>`;
  }
  return `<div class="gallery">${photos.map((photo) => photoFigure(photo, "gallery-card")).join("")}</div>`;
}

function cleanPersonaBlocks(list, max = 8) {
  if (!Array.isArray(list)) return [];
  const allowed = new Set(CHAPTERS.map((ch) => ch.id));
  return list.slice(0, max).map((item) => {
    const title = cleanLine(item?.title, 60);
    const text = cleanBlock(item?.text, 1200);
    const chapter = cleanLine(item?.chapter, 20);
    const align = cleanLine(item?.align, 10).toLowerCase() === "right" ? "right" : "left";
    if (!title || !text) return null;
    return {
      title,
      text,
      chapter: allowed.has(chapter) ? chapter : "",
      align
    };
  }).filter(Boolean);
}

function mergeFacts(list) {
  const defaults = cleanList(DEFAULT.facts || [], ["label", "value"], { label: 40, value: 80 });
  if (!list.length) return defaults;
  const labels = new Set(list.map((fact) => fact.label));
  const merged = [...list];
  defaults.forEach((fact) => {
    if (fact.label && !labels.has(fact.label)) merged.push(fact);
  });
  return merged;
}

function mergeStoryBlocks(list, defaultsKey) {
  const defaults = cleanPersonaBlocks(DEFAULT[defaultsKey] || []);
  if (!list.length) return defaults;
  const known = new Set(list.map((block) => `${block.title}\n${block.align}`));
  const merged = [...list];
  defaults.forEach((block) => {
    const key = `${block.title}\n${block.align}`;
    if (!known.has(key)) merged.push(block);
  });
  return merged;
}

function mergeStats(list) {
  const defaults = cleanList(DEFAULT.stats || [], ["label", "value"], { label: 40, value: 80 });
  if (!list.length) return defaults;
  const labels = new Set(list.map((stat) => stat.label));
  const merged = [...list];
  defaults.forEach((stat) => {
    if (stat.label && !labels.has(stat.label)) merged.push(stat);
  });
  return merged;
}

function mergeGameStats(list) {
  const defaults = cleanList(DEFAULT.gameStats || [], ["label", "value"], { label: 40, value: 80 });
  if (!list.length) return defaults;
  const labels = new Set(list.map((stat) => stat.label));
  const merged = [...list];
  defaults.forEach((stat) => {
    if (stat.label && !labels.has(stat.label)) merged.push(stat);
  });
  return merged;
}

function cleanAskf(source, useFallback) {
  const base = DEFAULT.askf && typeof DEFAULT.askf === "object" ? DEFAULT.askf : {};
  const raw = source?.askf && typeof source.askf === "object" ? source.askf : {};
  const pick = (key, max) => cleanLine(raw[key] ?? base[key], max, useFallback ? String(base[key] || "") : "");
  const totals = { played: 0, goals: 0, yellow: 0, red: 0, ...(base.totals || {}), ...(raw.totals || {}) };
  const mergeList = (user, def, max = 500) => {
    const list = Array.isArray(user) && user.length ? user : def;
    return Array.isArray(list) ? list.slice(0, max) : [];
  };
  return {
    profileUrl: safeAskfUrl(raw.profileUrl) || (useFallback ? safeAskfUrl(base.profileUrl) : "") || safeAskfUrl("https://antalyaaskf.org/bilgi-bankasi/oyuncu-bilgisi/2049878/kuzey-akinci"),
    oyid: pick("oyid", 12),
    licenseNo: pick("licenseNo", 16),
    totals,
    career: mergeList(raw.career, base.career, 24),
    matches: mergeList(raw.matches, base.matches, 120),
    goals: mergeList(raw.goals, base.goals, 120),
    cards: mergeList(raw.cards, base.cards, 24)
  };
}

function cleanTff(source, useFallback) {
  const base = DEFAULT.tff || {};
  const raw = source?.tff && typeof source.tff === "object" ? source.tff : source;
  const profileUrl = safeTffUrl(raw?.profileUrl) || (useFallback ? safeTffUrl(base.profileUrl) : "");
  return {
    profileUrl,
    kisiId: cleanLine(raw?.kisiId, 12, useFallback ? base.kisiId || "" : ""),
    licenseNo: cleanLine(raw?.licenseNo, 16, useFallback ? base.licenseNo || "" : ""),
    club: cleanLine(raw?.club, 80, useFallback ? base.club || "" : "")
  };
}

const MATCH_LIMITS = {
  season: 12,
  date: 16,
  time: 8,
  home: 80,
  away: 80,
  score: 12,
  competition: 60,
  macId: 12,
  role: 12,
  subIn: 4,
  subOut: 4,
  minutes: 4,
  goals: 3
};

const MATCH_ROLES = new Set(["ilk11", "yedek", "kadro_disi"]);

const SEASON_LIMITS = {
  id: 12,
  label: 20,
  competition: 60,
  played: 6,
  goals: 6,
  wins: 6,
  draws: 6,
  losses: 6
};

function cleanSeasons(list) {
  return cleanList(list, ROW_FIELDS.seasons, SEASON_LIMITS, 24);
}

function cleanMatchRole(value) {
  const role = cleanLine(value, 12).toLocaleLowerCase("tr");
  return MATCH_ROLES.has(role) ? role : "";
}

function numMatch(value) {
  const n = Number(String(value ?? "").replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

function matchLength(person) {
  const n = numMatch(person?.playModel?.matchLength);
  return n > 0 ? n : 90;
}

function xgPer90Rate(person) {
  const n = Number(String(person?.playModel?.xgPer90 ?? "0.30").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0.3;
}

function deriveMatchMinutes(match, length = 90) {
  const stored = numMatch(match.minutes);
  if (stored) return stored;
  const subIn = numMatch(match.subIn);
  const subOut = numMatch(match.subOut);
  const role = cleanMatchRole(match.role);
  if (role === "ilk11") return subOut || length;
  if (role === "yedek") return subIn ? (subOut || length) - subIn : 0;
  return 0;
}

function matchExpectedGoals(match, person) {
  const length = matchLength(person);
  const minutes = deriveMatchMinutes(match, length);
  return (minutes / length) * xgPer90Rate(person);
}

function roleLabel(role) {
  if (role === "ilk11") return "İlk 11";
  if (role === "yedek") return "Yedek";
  if (role === "kadro_disi") return "Kadro dışı";
  return "—";
}

function formatMinuteMark(value) {
  const min = numMatch(value);
  return min ? `${min}'` : "—";
}

function formatDurationTotal(minutes) {
  const total = numMatch(minutes);
  if (!total) return "0 dk";
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return hours ? `${total} dk (${hours}s ${rest}dk)` : `${total} dk`;
}

function playingTimeAggregate(matches, seasonId, person) {
  const length = matchLength(person);
  const rows = (matches || []).filter((m) => !seasonId || m.season === seasonId);
  const goalList = (person.goalEvents || []).filter((g) => !seasonId || g.season === seasonId);
  const goalsFromEvents = goalList.length;
  let totalMin = 0;
  let goals = 0;
  let xg = 0;
  let starts = 0;
  let subEntries = 0;
  let benchUnused = 0;
  rows.forEach((match) => {
    const minutes = deriveMatchMinutes(match, length);
    totalMin += minutes;
    goals += numMatch(match.goals);
    xg += matchExpectedGoals(match, person);
    const role = cleanMatchRole(match.role);
    if (role === "ilk11") starts += 1;
    else if (role === "yedek") {
      if (minutes > 0 || numMatch(match.subIn)) subEntries += 1;
      else benchUnused += 1;
    }
  });
  const appearances = rows.filter((m) => deriveMatchMinutes(m, length) > 0).length;
  if (goalsFromEvents) goals = goalsFromEvents;
  return {
    totalMin,
    goals,
    xg,
    starts,
    subEntries,
    benchUnused,
    appearances,
    avgMin: appearances ? totalMin / appearances : 0,
    xgPer90: xgPer90Rate(person),
    matchLength: length
  };
}

function cleanMatches(list) {
  return cleanList(list, ROW_FIELDS.matches, MATCH_LIMITS, 240).map((row) => {
    const role = cleanMatchRole(row.role);
    const minutes = numMatch(row.minutes) || "";
    return {
      ...row,
      macId: String(row.macId || "").replace(/\D/g, "").slice(0, 12),
      role,
      subIn: numMatch(row.subIn) ? String(numMatch(row.subIn)) : "",
      subOut: numMatch(row.subOut) ? String(numMatch(row.subOut)) : "",
      minutes: minutes ? String(minutes) : (role ? String(deriveMatchMinutes({ ...row, role }, 90)) : ""),
      goals: numMatch(row.goals) ? String(numMatch(row.goals)) : ""
    };
  }).filter((row) => row.date && row.score && (row.home || row.away));
}

function mergeSeasons(list) {
  const defaults = cleanSeasons(DEFAULT.seasons || []);
  if (!list.length) return defaults;
  const ids = new Set(list.map((s) => s.id).filter(Boolean));
  const merged = [...list];
  defaults.forEach((season) => {
    if (season.id && !ids.has(season.id)) merged.push(season);
  });
  return merged;
}

function cleanGoalEvents(list) {
  return cleanList(list, ROW_FIELDS.goalEvents, GOAL_LIMITS, 120).map((row) => ({
    ...row,
    macId: String(row.macId || "").replace(/\D/g, "").slice(0, 12),
    minute: numMatch(row.minute) ? String(numMatch(row.minute)) : ""
  })).filter((row) => row.macId && row.minute);
}

function mergeGoalEvents(list) {
  const defaults = cleanGoalEvents(DEFAULT.goalEvents || []);
  if (!defaults.length) return cleanGoalEvents(list);
  if (!list.length) return defaults;
  const keys = new Set(list.map((g) => `${g.macId}-${g.minute}`));
  const merged = [...list];
  defaults.forEach((goal) => {
    const key = `${goal.macId}-${goal.minute}`;
    if (!keys.has(key)) merged.push(goal);
  });
  return cleanGoalEvents(merged);
}

function matchByMacId(matches, macId) {
  return (matches || []).find((m) => m.macId === macId) || null;
}

function goalEventRowsHTML(person, seasonId) {
  const goals = (person.goalEvents || []).filter((g) => !seasonId || g.season === seasonId);
  if (!goals.length) return "";
  const rows = goals
    .slice()
    .sort((a, b) => parseMatchDate(b.date) - parseMatchDate(a.date) || numMatch(b.minute) - numMatch(a.minute));
  return rows.map((goal) => {
    const match = matchByMacId(person.matches, goal.macId);
    const macUrl = goal.macId ? `https://www.tff.org/Default.aspx?pageId=29&macId=${encodeURIComponent(goal.macId)}` : "";
    const label = match
      ? `${shortClubName(match.home)} – ${match.score} – ${shortClubName(match.away)}`
      : `Maç ${goal.macId}`;
    return `<tr>
      <td>${esc(goal.date || match?.date || "")}</td>
      <td>${macUrl ? `<a href="${esc(macUrl)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>` : esc(label)}</td>
      <td class="match-play">${esc(goal.minute)}'</td>
      <td class="match-play">${esc(goal.type || "F - Ayak")}</td>
    </tr>`;
  }).join("");
}

function goalsSectionHTML(person, seasonId) {
  const body = goalEventRowsHTML(person, seasonId);
  if (!body) return "";
  const count = (person.goalEvents || []).filter((g) => !seasonId || g.season === seasonId).length;
  return `<section class="group goals-block">
    <h2>Attığı goller</h2>
    <p class="match-note">TFF oyuncu profili — Attığı Goller sekmesi (${count} kayıt).</p>
    <div class="match-scroll" tabindex="0">
      <table class="match-table">
        <thead><tr><th>Tarih</th><th>Maç</th><th>Dk</th><th>Tip</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </section>`;
}

function mergeMatches(list) {
  const defaults = cleanMatches(DEFAULT.matches || []);
  if (!defaults.length) return cleanMatches(list);
  if (!list.length) return defaults;
  const byMac = Object.fromEntries(defaults.map((m) => [m.macId, m]));
  const ids = new Set();
  const merged = list.map((match) => {
    const clean = cleanMatches([match])[0];
    if (!clean) return match;
    ids.add(clean.macId);
    const base = byMac[clean.macId];
    if (!base) return clean;
    const play = ["role", "subIn", "subOut", "minutes", "goals"];
    const row = { ...clean };
    play.forEach((key) => {
      if (!row[key] && base[key]) row[key] = base[key];
    });
    return row;
  });
  defaults.forEach((match) => {
    if (match.macId && !ids.has(match.macId)) merged.push(match);
  });
  return cleanMatches(merged);
}

function parseMatchDate(value) {
  const parts = String(value || "").split(".");
  if (parts.length !== 3) return 0;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (!day || !month || !year) return 0;
  return Date.UTC(year, month - 1, day);
}

function clubIsCisem(name) {
  return String(name || "").toLocaleLowerCase("tr").includes("çisem");
}

function matchOutcome(home, away, score) {
  const parts = String(score || "").trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (!parts) return "";
  const homeGoals = Number(parts[1]);
  const awayGoals = Number(parts[2]);
  const weHome = clubIsCisem(home);
  const weAway = clubIsCisem(away);
  if (!weHome && !weAway) return "";
  const scored = weHome ? homeGoals : awayGoals;
  const conceded = weHome ? awayGoals : homeGoals;
  if (scored > conceded) return "G";
  if (scored < conceded) return "M";
  return "B";
}

function shortClubName(name) {
  let text = String(name || "").trim();
  text = text.replace(/\s+GENÇLİK VE SPOR$/i, "");
  text = text.replace(/\s+SPOR KULÜBÜ$/i, " SK");
  text = text.replace(/\s+FUTBOL A\.Ş\.$/i, "");
  text = text.replace(/\s+FUTBOL SPOR KULÜBÜ$/i, "");
  return text.length > 42 ? `${text.slice(0, 39)}…` : text;
}

function cleanList(list, keys, limits, max = 12) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, max).map((item) => {
    const row = {};
    keys.forEach((key) => {
      row[key] = cleanLine(item?.[key], limits[key] || 80);
    });
    return row;
  }).filter((row) => Object.values(row).some(Boolean));
}

function cloneDefault() {
  return sanitize(DEFAULT);
}

function sanitize(data, useFallback = true) {
  const source = data && typeof data === "object" ? data : {};
  return {
    firstName: cleanLine(source.firstName, 40, useFallback ? "Kuzey" : ""),
    lastName: cleanLine(source.lastName, 40, useFallback ? "Akıncı" : ""),
    number: cleanLine(source.number, 2).replace(/\D/g, "").slice(0, 2),
    position: cleanLine(source.position, 40),
    team: cleanLine(source.team, 60),
    city: cleanLine(source.city, 40),
    age: cleanLine(source.age, 12),
    birthDate: cleanLine(source.birthDate, 40),
    birthPlace: cleanLine(source.birthPlace, 60),
    hometown: cleanLine(source.hometown, 60),
    foot: cleanLine(source.foot, 20),
    naturalFoot: cleanLine(source.naturalFoot, 20),
    teamLogo: PHOTO_PATH.test(String(source.teamLogo ?? "").trim()) ? String(source.teamLogo).trim() : "",
    idol: cleanLine(source.idol, 40),
    motto: cleanLine(source.motto, 80),
    bio: cleanBlock(source.bio, 2000),
    day: cleanBlock(source.day, 800),
    loves: cleanBlock(source.loves, 800),
    style: cleanBlock(source.style, 800),
    kit: safeColor(source.kit, "#f3f1ea"),
    kitInk: safeColor(source.kitInk, "#142018"),
    youtube: safeSocialUrl(source.youtube, "youtube") || (useFallback ? safeSocialUrl(DEFAULT.youtube, "youtube") : ""),
    instagram: safeSocialUrl(source.instagram, "instagram") || (useFallback ? safeSocialUrl(DEFAULT.instagram, "instagram") : ""),
    photos: mergePhotos(cleanPhotos(source.photos)),
    personaBlocks: mergeStoryBlocks(cleanPersonaBlocks(source.personaBlocks), "personaBlocks"),
    futbolIntro: cleanBlock(source.futbolIntro, 1200, useFallback ? DEFAULT.futbolIntro || "" : ""),
    futbolBlocks: mergeStoryBlocks(cleanPersonaBlocks(source.futbolBlocks), "futbolBlocks"),
    facts: mergeFacts(cleanList(source.facts, ["label", "value"], { label: 40, value: 80 })),
    stats: mergeStats(cleanList(source.stats, ["label", "value"], { label: 40, value: 80 })),
    askf: cleanAskf(source, useFallback),
    tff: cleanTff(source, useFallback),
    playModel: {
      xgPer90: cleanLine(source.playModel?.xgPer90, 8, useFallback ? DEFAULT.playModel?.xgPer90 || "0.30" : "0.30"),
      matchLength: cleanLine(source.playModel?.matchLength, 3, useFallback ? DEFAULT.playModel?.matchLength || "90" : "90")
    },
    seasons: mergeSeasons(cleanSeasons(source.seasons)),
    matches: mergeMatches(cleanMatches(source.matches)),
    goalEvents: mergeGoalEvents(cleanGoalEvents(source.goalEvents)),
    gameStats: mergeGameStats(cleanList(source.gameStats, ["label", "value"], { label: 40, value: 80 })),
    honours: cleanList(source.honours, ["year", "title", "detail"], { year: 12, title: 60, detail: 180 }),
    values: cleanList(source.values, ["title", "text"], { title: 40, text: 240 }),
    dreams: cleanList(source.dreams, ["title", "text"], { title: 40, text: 240 })
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return cloneDefault();
    return sanitize(JSON.parse(raw));
  } catch {
    return cloneDefault();
  }
}

function fullName(person) {
  const name = [person.firstName, person.lastName].map((part) => (part || "").trim()).filter(Boolean).join(" ");
  return name || "Kuzey Akıncı";
}

function initials(person) {
  const first = [...(person.firstName || "Kuzey")][0] || "K";
  const last = [...(person.lastName || "Akıncı")][0] || "A";
  return (first + last).toLocaleUpperCase("tr");
}

function shirtName(person) {
  return (person.lastName || person.firstName || "Akıncı").toLocaleUpperCase("tr");
}

function isBrandName(person) {
  return person.firstName.toLocaleLowerCase("tr") === "kuzey"
    && person.lastName.toLocaleLowerCase("tr") === "akıncı";
}

function findSpot(position) {
  const value = (position || "").toLocaleLowerCase("tr").trim();
  if (!value) return null;
  const hits = SPOTS.filter(([name]) => value.includes(name));
  if (!hits.length) return null;
  hits.sort((a, b) => b[0].length - a[0].length);
  return { x: hits[0][1], y: hits[0][2] };
}

function richText(value) {
  const parts = String(value || "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return "";
  return parts.map((part) => `<p>${esc(part).replace(/\n/g, "<br>")}</p>`).join("");
}

function route() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, ""));
  const id = raw === "kupalar" ? "istatistikler" : raw;
  return CHAPTERS.some((chapter) => chapter.id === id) ? id : "home";
}

function applyProfile(person) {
  document.documentElement.style.setProperty("--kit", person.kit);
  document.documentElement.style.setProperty("--kit-ink", person.kitInk);
  document.title = fullName(person);
}

function chapterBgFile(id, person) {
  return chapterPhoto(person, id)?.file || "";
}

function titleMarkup(title) {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return esc(title);
  return parts.map((part) => esc(part)).join("<br>");
}

let activeHomeScene = null;

function setHomeScene(id) {
  const stack = document.querySelector(".bg-stack");
  const areas = document.querySelectorAll(".area_seccion");
  if (!stack || !areas.length) return;
  const slide = stack.querySelector(`.bg-slide[data-bg="${id}"]`);
  const hasImage = !!slide?.querySelector(".bg-ken");
  activeHomeScene = hasImage ? id : null;
  areas.forEach((area) => area.classList.toggle("is-active", area.dataset.scene === id));
  stack.querySelectorAll(".bg-slide").forEach((bg) => {
    const on = bg.dataset.bg === id && hasImage;
    bg.classList.toggle("is-on", on);
    if (on) {
      const ken = bg.querySelector(".bg-ken");
      if (ken && !reducedMotion) {
        ken.style.animation = "none";
        void ken.offsetWidth;
        ken.style.animation = "";
      }
    }
  });
}

function clearHomeScene() {
  activeHomeScene = null;
  document.querySelectorAll(".area_seccion").forEach((area) => area.classList.remove("is-active"));
  document.querySelectorAll(".bg-slide").forEach((bg) => bg.classList.remove("is-on"));
}

function initHomeInteractions() {
  const grid = document.querySelector(".home-grid");
  const areas = [...document.querySelectorAll(".area_seccion")];
  if (!grid || !areas.length) return;
  areas.forEach((area) => {
    area.addEventListener("pointerenter", () => setHomeScene(area.dataset.scene));
    area.addEventListener("focus", () => setHomeScene(area.dataset.scene));
  });
  grid.addEventListener("pointerleave", clearHomeScene);
  const coarse = window.matchMedia("(hover: none)").matches;
  if (coarse) {
    areas.forEach((area) => {
      area.addEventListener("click", (event) => {
        if (activeHomeScene !== area.dataset.scene) {
          event.preventDefault();
          setHomeScene(area.dataset.scene);
        }
      });
    });
  }
}

function setScene(id) {
  document.querySelectorAll(".scene").forEach((scene) => {
    scene.classList.toggle("is-on", scene.dataset.scene === id);
  });
  document.querySelectorAll(".rail button").forEach((button) => {
    button.setAttribute("aria-current", button.dataset.scene === id ? "true" : "false");
  });
  CHAPTERS.forEach((chapter) => document.body.classList.remove(`scene-${chapter.id}`));
  document.body.classList.add(`scene-${id}`);
}

function watchReel() {
  reelObserver?.disconnect();
  const reel = document.querySelector(".reel");
  if (!reel) return;
  reelObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setScene(entry.target.dataset.scene);
    });
  }, { root: reel, threshold: 0.6 });
  reel.querySelectorAll(".panel").forEach((panel) => reelObserver.observe(panel));
}

function markSVG(person) {
  return `<svg class="mark" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" stroke-width="1.25"/>
    <path d="M32 7 L34.6 14 H29.4 Z" fill="var(--lime)"/>
    <text x="32" y="39" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="20" fill="currentColor">${esc(initials(person))}</text>
  </svg>`;
}

function headerHTML(isHome) {
  const name = fullName(profile);
  const menuBtn = `<button type="button" class="menu-toggle" data-action="open-menu" aria-expanded="${menuOpen ? "true" : "false"}" aria-label="Menü">
        <span class="menu-bars" aria-hidden="true"><span></span><span></span><span></span></span>
      </button>`;
  return isHome
    ? `<a class="brand brand-mono" href="#">
        <span class="logo-monogram">${esc(initials(profile))}</span>
        <span class="sr-only">${esc(name)}</span>
      </a>
      <div class="tools home-tools">
        ${menuBtn}
        <button type="button" data-action="edit">Düzenle</button>
      </div>`
    : `<a class="brand" href="#">
        ${markSVG(profile)}
        <span class="brand-name">${esc(name)}<small class="brand-tag">${personalSahaHTML(profile)}</small></span>
      </a>
      <div class="tools">
        <button type="button" data-action="edit">Düzenle</button>
        <button type="button" data-action="open-menu" aria-expanded="${menuOpen ? "true" : "false"}">Menü</button>
      </div>`;
}

function homeHTML() {
  const backgrounds = CHAPTERS.map((chapter) => {
    const file = chapterBgFile(chapter.id, profile);
    const ken = file
      ? `<div class="bg-ken" style="background-image:url(${esc(file)})"></div>`
      : "";
    return `<div class="bg-slide" data-bg="${chapter.id}">${ken}</div>`;
  }).join("");
  const areas = CHAPTERS.map((chapter) => `<a class="area_seccion" href="#${chapter.id}" data-scene="${chapter.id}">
      <span class="titulo">${titleMarkup(chapter.title)}</span>
    </a>`).join("");
  return `<h1 class="sr-only">${esc(fullName(profile))}</h1>
    <div class="bg-stack" aria-hidden="true">${backgrounds}</div>
    <div class="home-shell">
      <div class="home-grid secc_5">${areas}</div>
    </div>
    <footer class="home-footer">
      <span>${esc(fullName(profile))}</span>
      ${personalSahaHTML(profile)}
    </footer>`;
}

function cupSVG() {
  return `<svg viewBox="0 0 64 72" aria-hidden="true">
    <path d="M14 8 H50 V26 C50 40 40 48 32 48 C24 48 14 40 14 26 Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <path d="M14 14 H8 C8 26 12 30 18 30" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <path d="M50 14 H56 C56 26 52 30 46 30" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <path d="M32 48 V58 M22 58 H42 M26 64 H38" fill="none" stroke="currentColor" stroke-width="1.6"/>
  </svg>`;
}

function teamLogoHTML(person) {
  if (!person.teamLogo) return "";
  const team = person.team || "Kulüp";
  return `<figure class="club-mark"><img src="${esc(person.teamLogo)}" alt="${esc(team)} logosu" width="120" height="120" decoding="async" loading="lazy"></figure>`;
}

function footNoteHTML(person) {
  const bits = [];
  if (person.naturalFoot) bits.push(`Doğal ayak: ${person.naturalFoot} (solak)`);
  if (person.foot) bits.push(`Sahada: ${person.foot}`);
  if (!bits.length) return "";
  return `<p class="pitch-foot">${esc(bits.join(" · "))}</p>`;
}

function shirtSVG(person) {
  const name = shirtName(person);
  const number = /^\d{1,2}$/.test(person.number) ? person.number : "";
  const size = name.length > 10 ? 12 : name.length > 8 ? 14 : 16;
  const nameY = number ? 122 : 146;
  return `<svg class="shirt" viewBox="0 0 228 230" role="img" aria-label="Forma, ${esc(name)}${number ? ` ${esc(number)}` : ""}">
    <path fill="var(--kit)" d="M46 52 L76 26 L94 46 C104 58 124 58 134 46 L152 26 L182 52 L204 92 L176 108 L176 214 L52 214 L52 108 L24 92 Z"/>
    <path fill="var(--ice)" d="M24 92 L52 108 L48 120 L16 100 Z"/>
    <path fill="var(--ice)" d="M204 92 L176 108 L180 120 L212 100 Z"/>
    <path d="M94 46 C104 60 124 60 134 46" fill="none" stroke="var(--ice)" stroke-width="2"/>
    <text x="114" y="${nameY}" text-anchor="middle" fill="var(--kit-ink)" font-family="Outfit, sans-serif" font-size="${size}" letter-spacing="2">${esc(name)}</text>
    ${number ? `<text x="114" y="176" text-anchor="middle" fill="var(--kit-ink)" font-family="Fraunces, Georgia, serif" font-size="64" font-weight="600">${esc(number)}</text>` : ""}
  </svg>`;
}

function pitchSVG(person) {
  const spot = findSpot(person.position);
  const dot = spot
    ? `<circle cx="${spot.x}" cy="${spot.y}" r="3.2" fill="#e5ff63"/><circle cx="${spot.x}" cy="${spot.y}" r="6.2" fill="none" stroke="#e5ff63"/>`
    : "";
  return `<svg class="pitch" viewBox="0 0 100 120" role="img" aria-label="Mevki çizelgesi">
    <rect x="8" y="6" width="84" height="108" fill="none" stroke="currentColor" stroke-width="0.8"/>
    <line x1="8" y1="60" x2="92" y2="60" stroke="currentColor" stroke-width="0.6"/>
    <circle cx="50" cy="60" r="10" fill="none" stroke="currentColor" stroke-width="0.6"/>
    <rect x="30" y="6" width="40" height="16" fill="none" stroke="currentColor" stroke-width="0.6"/>
    <rect x="30" y="98" width="40" height="16" fill="none" stroke="currentColor" stroke-width="0.6"/>
    ${dot}
  </svg>`;
}

function itemsHTML(list, emptyText) {
  if (!list.length) return `<p class="empty">${esc(emptyText)}</p>`;
  return list.map((item, index) => `<article class="item">
      <span class="item-index">${String(index + 1).padStart(2, "0")}</span>
      <div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.text)}</p>
      </div>
    </article>`).join("");
}

function factsHTML(list) {
  if (!list.length) return "";
  return `<div class="facts">${list.map((fact) => `<div class="fact"><span>${esc(fact.label)}</span><strong>${esc(fact.value)}</strong></div>`).join("")}</div>`;
}

function optionalBlock(title, text, empty, focus) {
  const body = text
    ? `<div class="prose">${richText(text)}</div>`
    : `<p class="empty">${esc(empty)}</p><p><button type="button" class="textbtn" data-action="edit" data-focus="${focus}">Yaz</button></p>`;
  return `<section class="group"><h2>${esc(title)}</h2>${body}</section>`;
}

function chapterFrame(chapter, inner, extraClass = "") {
  const extra = extraClass ? ` ${extraClass}` : "";
  return `<article class="article${extra}">
    <a class="back" href="#">← Saha</a>
    <p class="kicker">${chapter.index} · ${esc(chapter.kicker)}</p>
    <h1>${esc(chapter.title)}</h1>
    ${inner}
    <footer class="colophon"><span>${esc(fullName(profile))}</span>${personalSahaHTML(profile)}</footer>
  </article>`;
}

function personaVisual(block) {
  if (!block.chapter) return "";
  const photo = chapterPhoto(profile, block.chapter);
  if (!photo) return "";
  return `<div class="persona-visual">${photoFigure(photo, "persona-shot")}</div>`;
}

function personaBlocksHTML(blocks) {
  if (!blocks.length) return `<p class="empty">Kişi bölümleri düzenle menüsünden yazılır.</p>`;
  return blocks.map((block) => {
    const visual = personaVisual(block);
    const side = block.align === "right" ? "is-right" : "is-left";
    return `<section class="persona-row ${side}">
      ${visual}
      <div class="persona-copy">
        <h2>${esc(block.title)}</h2>
        <div class="prose">${richText(block.text)}</div>
      </div>
    </section>`;
  }).join("");
}

function renderKisi() {
  const hero = chapterPhoto(profile, "kisi");
  const heroBand = hero
    ? `<div class="persona-hero" style="--persona-hero:url('${esc(hero.file)}')" role="img" aria-label="${esc(hero.alt)}"></div>`
    : "";
  const etymology = isBrandName(profile) ? `<section class="persona-etym">
      <div class="persona-etym-grid">
        <div class="persona-etym-card">
          <span>Ad</span>
          <strong>Kuzey</strong>
          <em>Yön</em>
        </div>
        <div class="persona-etym-card">
          <span>Soyad</span>
          <strong>Akıncı</strong>
          <em>Hareket</em>
        </div>
      </div>
    </section>` : "";
  return chapterFrame(CHAPTERS[0], `
    ${heroBand}
    <div class="persona-sheet">
      <p class="persona-lede">${esc(profile.bio)}</p>
      <section class="persona-vitals" aria-label="Özet bilgiler">
        ${factsHTML(profile.facts)}
      </section>
      ${etymology}
      ${personaBlocksHTML(profile.personaBlocks)}
      ${optionalBlock("Merak", profile.loves, "Serbest zaman ve ilgi alanları.", "f-loves")}
    </div>
  `, "article-persona");
}

function renderFutbolcu() {
  const action = chapterPhoto(profile, "futbolcu");
  const heroBand = action
    ? `<div class="persona-hero persona-hero-saha" style="--persona-hero:url('${esc(action.file)}')" role="img" aria-label="${esc(action.alt)}"></div>`
    : "";
  const intro = profile.futbolIntro || profile.style;
  return chapterFrame(CHAPTERS[1], `
    ${heroBand}
    <div class="persona-sheet">
      <p class="persona-lede">${esc(intro)}</p>
      <section class="persona-vitals" aria-label="Futbol özeti">
        ${factsHTML(profile.stats)}
      </section>
      <div class="futbol-kit-band">
        <div class="futbol-kit-main">
          ${teamLogoHTML(profile)}
          ${shirtSVG(profile)}
          <div class="pitch-card pitch-card-inline">
            <h2>Mevki</h2>
            ${pitchSVG(profile)}
            <p class="pitch-label">${esc(profile.position || "Mevki seçilmedi")}</p>
            ${footNoteHTML(profile)}
          </div>
        </div>
        <div class="prose futbol-style">${richText(profile.style)}</div>
      </div>
      ${personaBlocksHTML(profile.futbolBlocks)}
      <section class="group futbol-play">
        <h2>Antrenman</h2>
        <div class="mini">
          <div class="goal"></div>
          <div class="ball" id="ball"></div>
        </div>
        <div class="shot-row">
          <button type="button" class="textbtn" data-action="kick">Topa vur</button>
          <p class="gol" id="gol" aria-live="polite"></p>
        </div>
      </section>
    </div>
  `, "article-persona article-futbolcu");
}

function tffBlockHTML(person) {
  const tff = person.tff || {};
  const url = safeTffUrl(tff.profileUrl);
  if (!url && !tff.licenseNo) return "";
  const lines = [];
  if (tff.licenseNo) lines.push(`Lisans no: ${esc(tff.licenseNo)}`);
  if (tff.club) lines.push(`Kulüp: ${esc(tff.club)}`);
  if (person.birthPlace) lines.push(`Doğum yeri: ${esc(person.birthPlace)}`);
  if (person.birthDate) lines.push(`Doğum tarihi: ${esc(person.birthDate)}`);
  return `<section class="group tff-block">
    <h2>TFF kaydı</h2>
    <p class="tff-lede">Resmi federasyon profili — maç ve gol listeleri buradan doğrulanır.</p>
  ${lines.length ? `<ul class="tff-facts">${lines.map((line) => `<li>${line}</li>`).join("")}</ul>` : ""}
  ${url ? `<p class="tff-link"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">TFF oyuncu profili</a></p>` : ""}
  </section>`;
}

function seasonSummaryHTML(season, person, matches) {
  const agg = playingTimeAggregate(matches, season.id, person);
  const chips = [
    ["Maç", season.played],
    ["Gol (TFF)", season.goals],
    ["G", season.wins],
    ["B", season.draws],
    ["M", season.losses],
    ["Süre", formatDurationTotal(agg.totalMin)],
    ["İlk 11", String(agg.starts)],
    ["Yedek giriş", String(agg.subEntries)],
    ["Ort. dk", agg.appearances ? agg.avgMin.toFixed(1) : ""],
    ["xG", agg.xg ? agg.xg.toFixed(2) : ""]
  ].filter(([, value]) => value !== "" && value !== undefined);
  return `<div class="season-summary">
    <p class="season-title">${esc(season.label || season.id)} · ${esc(season.competition || "")}</p>
    ${chips.length ? `<div class="season-chips">${chips.map(([label, value]) => `<span class="season-chip"><em>${esc(label)}</em> ${esc(value)}</span>`).join("")}</div>` : ""}
  </div>`;
}

function playingTimeIntroHTML(person) {
  const xg = xgPer90Rate(person);
  const length = matchLength(person);
  return `<p class="match-note">Kadro ve süreler TFF maç detayından alınır. Gol beklentisi (xG) = (oynama dk ÷ ${length}) × ${xg.toFixed(2)} gol/90 (mevkiye göre düzenlenebilir).</p>`;
}

function matchesTableHTML(matches, seasonId, person, opts = {}) {
  const { compact = false, skipIntro = false, skipFooter = false } = opts;
  const length = matchLength(person);
  const rows = matches
    .filter((m) => !seasonId || m.season === seasonId)
    .slice()
    .sort((a, b) => parseMatchDate(b.date) - parseMatchDate(a.date));
  if (!rows.length) {
    return `<p class="empty">Bu sezon için maç henüz eklenmedi.</p>`;
  }
  const body = rows.map((match) => {
    const outcome = matchOutcome(match.home, match.away, match.score);
    const outcomeClass = outcome ? ` result-${outcome === "G" ? "win" : outcome === "M" ? "loss" : "draw"}` : "";
    const macUrl = match.macId ? `https://www.tff.org/Default.aspx?pageId=29&macId=${encodeURIComponent(match.macId)}` : "";
    const scoreCell = macUrl
      ? `<a href="${esc(macUrl)}" target="_blank" rel="noopener noreferrer" class="score-link">${esc(match.score)}</a>`
      : esc(match.score);
    const when = [match.date, match.time].filter(Boolean).join(" · ");
    const minutes = deriveMatchMinutes(match, length);
    const xg = matchExpectedGoals(match, person);
    const goals = numMatch(match.goals);
    const role = cleanMatchRole(match.role);
    return `<tr>
      <td class="match-when">${macUrl ? `<a href="${esc(macUrl)}" target="_blank" rel="noopener noreferrer">${esc(when)}</a>` : esc(when)}</td>
      <td class="match-teams"><span class="${clubIsCisem(match.home) ? "is-us" : ""}">${esc(shortClubName(match.home))}</span>
        <span class="match-score">${scoreCell}</span>
        <span class="${clubIsCisem(match.away) ? "is-us" : ""}">${esc(shortClubName(match.away))}</span></td>
      <td class="match-play" title="Kadro">${esc(roleLabel(role))}</td>
      <td class="match-play">${formatMinuteMark(match.subIn)}</td>
      <td class="match-play">${formatMinuteMark(match.subOut)}</td>
      <td class="match-play match-min"><strong>${minutes ? `${minutes}'` : "—"}</strong></td>
      <td class="match-play">${goals || "—"}</td>
      <td class="match-play match-xg">${minutes ? xg.toFixed(2) : "—"}</td>
      <td class="match-result${outcomeClass}" aria-label="Sonuç">${outcome ? esc(outcome) : "—"}</td>
    </tr>`;
  }).join("");
  const intro = skipIntro ? "" : playingTimeIntroHTML(person);
  const tableClass = compact ? "match-table match-table-season match-table-tff" : "match-table match-table-play";
  const scrollClass = compact ? "match-scroll season-match-scroll" : "match-scroll";
  const footer = skipFooter ? "" : `<p class="match-note">Milli maçlar bu listede yer almaz (TFF notu).</p>`;
  return `${intro}
  <div class="${scrollClass}" tabindex="0" aria-label="Maç listesi">
    <table class="${tableClass}">
      <thead><tr>
        <th>Tarih</th><th>Maç</th><th>Kadro</th><th>Giriş</th><th>Çıkış</th><th>Dk</th><th>G</th><th>xG</th><th></th>
      </tr></thead>
      <tbody>${body}</tbody>
    </table>
  </div>
  ${footer}`;
}

function playingTimeStatsGridHTML(agg) {
  if (!agg.appearances) return "";
  const goalDelta = agg.goals - agg.xg;
  const deltaLabel = goalDelta >= 0 ? `+${goalDelta.toFixed(2)}` : goalDelta.toFixed(2);
  return `<div class="season-playtime-grid stats stats-wide">
    <div class="stat"><span>Toplam süre</span><strong>${esc(formatDurationTotal(agg.totalMin))}</strong></div>
    <div class="stat"><span>İlk 11 başlangıç</span><strong>${agg.starts}</strong></div>
    <div class="stat"><span>Yedekten giriş</span><strong>${agg.subEntries}</strong></div>
    <div class="stat"><span>Maç başına ort.</span><strong>${agg.avgMin.toFixed(1)}'</strong></div>
    <div class="stat"><span>Maç golleri (TFF)</span><strong>${agg.goals}</strong></div>
    <div class="stat"><span>Gol beklentisi (xG)</span><strong>${agg.xg.toFixed(2)}</strong></div>
    <div class="stat"><span>Gol − xG</span><strong>${deltaLabel}</strong></div>
  </div>`;
}

function playingTimeStatsHTML(person, season) {
  const agg = playingTimeAggregate(person.matches, season?.id, person);
  const grid = playingTimeStatsGridHTML(agg);
  if (!grid) return "";
  return `<section class="group playtime-block">
    <h2>Oynama süresi</h2>
    ${grid}
  </section>`;
}

function seasonsHTML(person) {
  const seasons = person.seasons || [];
  const allMatches = person.matches || [];
  if (!seasons.length && !allMatches.length) {
    return `<section class="group"><h2>Sezonlar</h2><p class="empty">Sezon özeti ve maç listesi henüz yazılmadı.</p></section>`;
  }
  if (!seasons.length) {
    return `<section class="group"><h2>Maçlar</h2>${matchesTableHTML(allMatches, "", person)}</section>`;
  }
  return seasons.map((season) => `<section class="group season-block">
    <h2>${esc(season.label || season.id)}</h2>
    ${seasonSummaryHTML(season, person, allMatches)}
    ${playingTimeStatsHTML(person, season)}
    ${goalsSectionHTML(person, season.id)}
    ${matchesTableHTML(allMatches, season.id, person)}
  </section>`).join("");
}

function kpiIcon(kind) {
  const icons = {
    matches: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="m4.5 12.5 3.5 3.5L19.5 4.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    goals: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    yellow: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="16" rx="2" fill="currentColor" opacity="0.9"/></svg>',
    red: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="16" rx="2" fill="currentColor" opacity="0.85"/></svg>'
  };
  return icons[kind] || "";
}

function askfTotalsHTML(askf) {
  const t = askf.totals || {};
  const played = numMatch(t.played);
  const goals = numMatch(t.goals);
  const yellow = numMatch(t.yellow);
  const red = numMatch(t.red);
  if (!played && !goals && !yellow && !red) return "";
  const gpg = played && goals ? (goals / played).toFixed(2) : "";
  const cards = [
    {
      kind: "matches",
      label: "Maç",
      value: String(t.played ?? played),
      hint: "ASKF kariyer toplamı",
      featured: true
    },
    {
      kind: "goals",
      label: "Gol",
      value: String(t.goals ?? goals),
      hint: gpg ? `Maç başına ${gpg}` : "Kariyer golleri",
      featured: true
    },
    {
      kind: "yellow",
      label: "Sarı kart",
      value: String(t.yellow ?? yellow),
      hint: yellow ? "Lig disiplini" : "Temiz kayıt"
    },
    {
      kind: "red",
      label: "Kırmızı kart",
      value: String(t.red ?? red),
      hint: red ? "Dikkat" : "Temiz kayıt"
    }
  ];
  return `<div class="kpi-bento" role="list" aria-label="Kariyer özeti">
    ${cards.map((card) => `<article class="kpi-card kpi-${card.kind}${card.featured ? " kpi-featured" : ""}" role="listitem">
      <div class="kpi-card-shine" aria-hidden="true"></div>
      <div class="kpi-card-body">
        <span class="kpi-icon">${kpiIcon(card.kind)}</span>
        <p class="kpi-value">${esc(card.value)}</p>
        <p class="kpi-label">${esc(card.label)}</p>
        <p class="kpi-hint">${esc(card.hint)}</p>
      </div>
    </article>`).join("")}
  </div>`;
}

function parseCareerLeague(league) {
  const text = String(league || "").trim();
  const parts = text.split(/\s+[-–]\s+/);
  if (parts.length >= 2) {
    return { season: parts[0].trim(), competition: parts.slice(1).join(" - ").trim() };
  }
  return { season: "", competition: text };
}

function normalizeCompetition(value) {
  return String(value || "").toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
}

function belongsToLeague(item, season, competition) {
  if (season && item.season !== season) return false;
  const a = normalizeCompetition(item.competition);
  const b = normalizeCompetition(competition);
  if (!b) return true;
  return a === b || a.includes(b) || b.includes(a);
}

function askfLeagueMatches(askf, season, competition) {
  return (askf.matches || [])
    .filter((m) => belongsToLeague(m, season, competition))
    .sort((a, b) => parseMatchDate(b.date) - parseMatchDate(a.date));
}

function askfLeagueGoals(askf, season, competition) {
  return (askf.goals || [])
    .filter((g) => belongsToLeague(g, season, competition))
    .sort((a, b) => parseMatchDate(b.date) - parseMatchDate(a.date));
}

function askfLeagueCards(askf, season, competition) {
  return (askf.cards || []).filter((c) => belongsToLeague(c, season, competition));
}

function askfSeasonMatchRows(matches) {
  if (!matches.length) return `<p class="empty">Bu lig için maç kaydı yok.</p>`;
  const body = matches.map((match) => {
    const role = match.role ? roleLabel(match.role) : "—";
    const mins = match.minutes ? `${match.minutes}'` : "—";
    return `<tr>
      <td class="match-when">${esc(match.date)}</td>
      <td class="match-teams">${esc(match.matchup)}</td>
      <td class="match-play match-score-col"><strong>${esc(match.score)}</strong></td>
      <td class="match-play">${esc(role)}</td>
      <td class="match-play">${formatMinuteMark(match.subIn)}</td>
      <td class="match-play">${formatMinuteMark(match.subOut)}</td>
      <td class="match-play match-min"><strong>${mins}</strong></td>
    </tr>`;
  }).join("");
  return `<div class="match-scroll season-match-scroll" tabindex="0">
    <table class="match-table match-table-season">
      <thead><tr><th>Tarih</th><th>Maç</th><th>Skor</th><th>Kadro</th><th>Giriş</th><th>Çıkış</th><th>Dk</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
}

function askfSeasonGoalRows(goals) {
  if (!goals.length) return `<p class="empty season-empty">Bu sezonda gol kaydı yok.</p>`;
  const body = goals.map((goal) => `<tr>
    <td class="match-when">${esc(goal.date)}</td>
    <td class="match-teams">${esc(goal.matchup)}</td>
    <td class="match-play match-score-col"><strong>${esc(goal.score)}</strong></td>
    <td class="match-play"><strong>${esc(goal.minute)}'</strong></td>
  </tr>`).join("");
  return `<div class="match-scroll"><table class="match-table match-table-season"><thead><tr><th>Tarih</th><th>Maç</th><th>Skor</th><th>Dk</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

function askfSeasonCardRows(cards) {
  if (!cards.length) return "";
  const body = cards.map((card) => {
    const type = String(card.card || "").toLocaleLowerCase("tr");
    const klass = type.includes("kırmızı") || type.includes("kirmizi") ? "card-red" : "card-yellow";
    return `<tr>
      <td class="match-when">${esc(card.date)}</td>
      <td class="match-teams">${esc(card.matchup)}</td>
      <td class="match-play match-score-col"><strong>${esc(card.score)}</strong></td>
      <td class="match-play"><span class="card-pill ${klass}">${esc(card.card || "Kart")}</span></td>
      <td class="match-play">${esc(card.minute)}'</td>
    </tr>`;
  }).join("");
  return `<div class="season-subblock">
    <h3 class="season-subtitle">Kartlar</h3>
    <div class="match-scroll"><table class="match-table match-table-season"><thead><tr><th>Tarih</th><th>Maç</th><th>Skor</th><th>Kart</th><th>Dk</th></tr></thead><tbody>${body}</tbody></table></div>
  </div>`;
}

function normalizeSeasonYear(label) {
  const s = String(label || "").replace(/–/g, "-").trim();
  const m = s.match(/^(\d{4})-(\d{2,4})$/);
  if (!m) return s;
  let end = m[2];
  if (end.length === 2) end = `${m[1].slice(0, 2)}${end}`;
  return `${m[1]}-${end}`;
}

function buildSeasonCardItems(person) {
  const items = [];
  const askf = person.askf || {};
  (askf.career || []).forEach((row) => {
    const { season, competition } = parseCareerLeague(row.league);
    items.push({
      kind: "askf",
      sortSeason: normalizeSeasonYear(season),
      seasonDisplay: season || "Sezon",
      competition,
      askfRow: row
    });
  });
  (person.seasons || []).forEach((season) => {
    items.push({
      kind: "tff",
      sortSeason: normalizeSeasonYear(season.label || season.id),
      seasonDisplay: season.label || season.id,
      competition: season.competition || "Gelişim Ligi",
      tffSeason: season
    });
  });
  items.sort((a, b) => {
    const bySeason = b.sortSeason.localeCompare(a.sortSeason, "tr");
    if (bySeason !== 0) return bySeason;
    if (a.kind !== b.kind) return a.kind === "tff" ? -1 : 1;
    return (a.competition || "").localeCompare(b.competition || "", "tr");
  });
  return items;
}

function askfSeasonCardBody(askf, season, competition) {
  const matches = askfLeagueMatches(askf, season, competition);
  const goals = askfLeagueGoals(askf, season, competition);
  const discipline = askfLeagueCards(askf, season, competition);
  return `<div class="season-subblock">
      <h3 class="season-subtitle">Maçlar <span class="season-count">${matches.length}</span></h3>
      ${askfSeasonMatchRows(matches)}
    </div>
    <div class="season-subblock">
      <h3 class="season-subtitle">Goller <span class="season-count">${goals.length}</span></h3>
      ${askfSeasonGoalRows(goals)}
    </div>
    ${askfSeasonCardRows(discipline)}`;
}

function tffSeasonCardBody(person, season) {
  const agg = playingTimeAggregate(person.matches, season.id, person);
  const matchCount = (person.matches || []).filter((m) => m.season === season.id).length;
  const goalRows = goalEventRowsHTML(person, season.id);
  const tffUrl = safeTffUrl(person.tff?.profileUrl);
  const goalsBlock = goalRows
    ? `<div class="season-subblock">
        <h3 class="season-subtitle">Attığı goller <span class="season-count">${(person.goalEvents || []).filter((g) => g.season === season.id).length}</span></h3>
        <p class="match-note season-inline-note">TFF oyuncu profili — Attığı Goller sekmesi.</p>
        <div class="match-scroll"><table class="match-table match-table-season"><thead><tr><th>Tarih</th><th>Maç</th><th>Dk</th><th>Tip</th></tr></thead><tbody>${goalRows}</tbody></table></div>
      </div>`
    : "";
  return `${playingTimeStatsGridHTML(agg) ? `<div class="season-subblock">
      <h3 class="season-subtitle">Oynama süresi</h3>
      ${playingTimeStatsGridHTML(agg)}
    </div>` : ""}
    ${goalsBlock}
    <div class="season-subblock">
      <h3 class="season-subtitle">Maçlar <span class="season-count">${matchCount}</span></h3>
      <p class="match-note season-inline-note">Kadro ve süreler TFF maç detayından; xG modeli profil ayarından.</p>
      ${matchesTableHTML(person.matches || [], season.id, person, { compact: true, skipIntro: true, skipFooter: true })}
      <p class="match-note season-inline-note">Milli maçlar bu listede yer almaz (TFF notu).</p>
    </div>
    ${tffUrl ? `<p class="match-note season-source-link"><a href="${esc(tffUrl)}" target="_blank" rel="noopener noreferrer">TFF oyuncu profili</a></p>` : ""}`;
}

function seasonCardsHTML(person) {
  const items = buildSeasonCardItems(person);
  if (!items.length) return "";
  const askf = person.askf || {};
  const cards = items.map((item, index) => {
    const slug = `${item.sortSeason}-${item.competition}`.toLocaleLowerCase("tr").replace(/[^a-z0-9]+/g, "-").slice(0, 52);
    let stats = [];
    let body = "";
    let extraClass = "";
    if (item.kind === "askf") {
      const row = item.askfRow;
      const { season, competition } = parseCareerLeague(row.league);
      stats = [
        ["Maç", row.played],
        ["Gol", row.goals],
        ["Giriş", row.subIn],
        ["Çıkış", row.subOut],
        row.yellow !== "0" ? ["Sarı", row.yellow] : null,
        row.red !== "0" ? ["Kırmızı", row.red] : null
      ].filter(Boolean);
      body = askfSeasonCardBody(askf, season, competition);
    } else {
      extraClass = " season-card-tff";
      const season = item.tffSeason;
      const agg = playingTimeAggregate(person.matches, season.id, person);
      stats = [
        ["Maç", season.played],
        ["Gol", season.goals],
        ["G", season.wins],
        ["B", season.draws],
        ["M", season.losses],
        agg.appearances ? ["Süre", formatDurationTotal(agg.totalMin)] : null,
        agg.xg ? ["xG", agg.xg.toFixed(2)] : null
      ].filter(Boolean);
      body = tffSeasonCardBody(person, season);
    }
    const leagueLine = item.kind === "tff"
      ? `<span class="season-card-league">${esc(item.competition)} <span class="season-source-pill">TFF</span></span>`
      : `<span class="season-card-league">${esc(item.competition)}</span>`;
    return `<details class="season-card${extraClass}" id="season-${esc(slug)}"${index === 0 ? " open" : ""}>
      <summary class="season-card-summary">
        <span class="season-card-titles">
          <span class="season-card-season">${esc(item.seasonDisplay)}</span>
          ${leagueLine}
        </span>
        <span class="season-card-metrics" aria-hidden="true">
          ${stats.map(([label, value]) => `<span class="season-metric"><em>${esc(label)}</em> ${esc(value)}</span>`).join("")}
        </span>
        <span class="season-card-chevron" aria-hidden="true"></span>
      </summary>
      <div class="season-card-body">${body}</div>
    </details>`;
  }).join("");
  return `<section class="group stats-panel" id="askf-sezonlar">
    <h2>Sezonlar</h2>
    <p class="match-note">Karta tıkla — ASKF ve TFF liglerinde maç, gol ve istatistikler açılır.</p>
    <div class="season-card-stack">${cards}</div>
  </section>`;
}

function askfBlockHTML(person) {
  const askf = person.askf || {};
  const url = safeAskfUrl(askf.profileUrl);
  const hasAskf = (askf.matches?.length || askf.career?.length);
  const hasSeasons = buildSeasonCardItems(person).length;
  if (!hasAskf && !hasSeasons) return "";
  return `<section class="group askf-block stats-dashboard">
    <div class="stats-source-head">
      <div>
        <h2>Antalya ASKF</h2>
        <p class="tff-lede">Kariyer, maç, gol ve kart — il resmi amatör veri bankası.</p>
      </div>
      ${url ? `<a class="stats-source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Oyuncu profili</a>` : ""}
    </div>
    ${askfTotalsHTML(askf)}
    <nav class="stats-jump" aria-label="İstatistik bölümleri">
      <a href="#askf-sezonlar">Sezonlar</a>
    </nav>
    ${seasonCardsHTML(person)}
  </section>`;
}

function renderIstatistikler() {
  const visual = chapterPhoto(profile, "istatistikler");
  const heroBand = visual
    ? `<div class="persona-hero persona-hero-cup" style="--persona-hero:url('${esc(visual.file)}')" role="img" aria-label="${esc(visual.alt)}"></div>`
    : "";
  return chapterFrame(CHAPTERS[2], `
    ${heroBand}
    <div class="persona-sheet persona-stats">
      <p class="persona-lede">ASKF kariyeri ve TFF resmi lig verisi — tek sayfada, doğrulanmış kaynaklarla.</p>
      ${askfBlockHTML(profile)}
      <section class="group">
        <h2>Profil kartları</h2>
        ${factsHTML(profile.stats)}
      </section>
    </div>
  `, "article-persona article-stats");
}

function renderElci() {
  const stance = chapterPhoto(profile, "elci");
  const lead = stance ? `<div class="article-photo">${photoFigure(stance, "portrait hero ambassador")}</div>` : "";
  return chapterFrame(CHAPTERS[3], `
    ${lead}
    <p class="motto">${esc(profile.motto || "Yön belli. Hareket bende.")}</p>
    <p class="lede">Elçi burada bir kurum unvanı değil. Oyuna, rakibe ve takıma karşı duruşun adı.</p>
    <section class="group">${itemsHTML(profile.values, "Duruş cümleleri düzenle menüsünden yazılır.")}</section>
  `);
}

function renderProjeler() {
  const visual = chapterPhoto(profile, "projeler");
  const lead = visual ? `<div class="article-photo">${photoFigure(visual, "portrait hero stadium")}</div>` : "";
  return chapterFrame(CHAPTERS[4], `
    ${lead}
    <p class="lede">Bitmiş işlerin listesi değil. Kuzey Akıncı adının altında duran, süren işler.</p>
    <section class="group">${itemsHTML(profile.dreams, "İlk proje buraya yazılır.")}</section>
  `);
}

const PAGES = {
  kisi: renderKisi,
  futbolcu: renderFutbolcu,
  istatistikler: renderIstatistikler,
  elci: renderElci,
  projeler: renderProjeler
};

function field(id, label, value, extra = "") {
  return `<label class="field ${extra}" for="${id}"><span>${label}</span><input id="${id}" value="${esc(value)}" maxlength="80"></label>`;
}

function area(id, label, value) {
  return `<label class="field wide" for="${id}"><span>${label}</span><textarea id="${id}" maxlength="2000">${esc(value)}</textarea></label>`;
}

function rowHTML(keys, item = {}) {
  const inputs = keys.map((key) => `<input data-k="${key}" placeholder="${esc(PLACEHOLDERS[key] || key)}" value="${esc(item[key] || "")}" maxlength="180">`).join("");
  const cols = keys.length > 6 ? " cols-wide" : keys.length > 3 ? " cols-4" : keys.length > 2 ? " cols-3" : "";
  return `<div class="row${cols}">${inputs}<button type="button" data-action="remove-row">Sil</button></div>`;
}

function rowsHTML(name, items) {
  const keys = ROW_FIELDS[name];
  return `<div class="rows" data-rows="${name}">${items.map((item) => rowHTML(keys, item)).join("")}</div>
    <button type="button" class="add" id="add-${name}" data-action="add-row" data-rows="${name}">Ekle</button>`;
}

function editorHTML() {
  return `<div class="editor">
    <button type="button" class="backdrop" data-action="close-editor" aria-label="Kapat"></button>
    <form class="sheet" id="profile-form">
      <div class="sheet-top"><button type="button" class="textbtn" data-action="close-editor">Vazgeç</button></div>
      <p id="brand-preview">${esc(fullName(profile))}</p>
      <p class="empty">Marka adı Kuzey Akıncı. Buradan numara, takım, yaş ve kupalar yazılır. Kayıt bu tarayıcıda kalır.</p>
      <h2>Marka</h2>
      <div class="form-grid">
        ${field("f-first", "Ad", profile.firstName)}
        ${field("f-last", "Soyad", profile.lastName)}
        ${field("f-age", "Yaş", profile.age)}
        ${field("f-city", "Şehir", profile.city)}
        ${field("f-birth-date", "Doğum tarihi", profile.birthDate)}
        ${field("f-birth-place", "Doğum yeri", profile.birthPlace)}
        ${field("f-hometown", "Memleket", profile.hometown, "wide")}
        ${field("f-idol", "Örnek aldığı oyuncu", profile.idol, "wide")}
        ${field("f-youtube", "YouTube", profile.youtube, "wide")}
        ${field("f-instagram", "Instagram", profile.instagram, "wide")}
      </div>
      <h2>TFF</h2>
      <div class="form-grid">
        ${field("f-tff-url", "Oyuncu profili URL", profile.tff?.profileUrl || "", "wide")}
        ${field("f-tff-license", "Lisans no", profile.tff?.licenseNo || "")}
        ${field("f-tff-kisi", "kisiID", profile.tff?.kisiId || "")}
        ${field("f-tff-club", "TFF kulüp adı", profile.tff?.club || "", "wide")}
        ${field("f-xg-per90", "Gol beklentisi (gol/90)", profile.playModel?.xgPer90 || "0.30")}
        ${field("f-match-length", "Maç süresi (dk)", profile.playModel?.matchLength || "90")}
      </div>
      <h2>Saha</h2>
      <div class="form-grid">
        <label class="field" for="f-number"><span>Forma numarası</span><input id="f-number" inputmode="numeric" maxlength="2" value="${esc(profile.number)}"></label>
        <label class="field" for="f-position"><span>Mevki</span><input id="f-position" list="positions" value="${esc(profile.position)}" maxlength="40"></label>
        ${field("f-team", "Takım", profile.team)}
        ${field("f-team-logo", "Kulüp logosu", profile.teamLogo || "", "wide")}
        <label class="field" for="f-natural-foot"><span>Doğal ayak</span><input id="f-natural-foot" list="feet" value="${esc(profile.naturalFoot || "")}" maxlength="20"></label>
        <label class="field" for="f-foot"><span>Sahada kullanılan ayak</span><input id="f-foot" list="feet" value="${esc(profile.foot)}" maxlength="20"></label>
        <label class="field" for="f-kit"><span>Forma rengi</span><input id="f-kit" type="color" value="${esc(profile.kit)}"></label>
        <label class="field" for="f-kit-ink"><span>Forma yazı rengi</span><input id="f-kit-ink" type="color" value="${esc(profile.kitInk)}"></label>
      </div>
      <datalist id="positions">
        ${["Kaleci", "Sol bek", "Stoper", "Sağ bek", "Ön libero", "Orta saha", "On numara", "Sol kanat", "Sağ kanat", "Forvet", "Santrafor"].map((item) => `<option value="${item}"></option>`).join("")}
      </datalist>
      <datalist id="feet"><option value="Sağ"></option><option value="Sol"></option><option value="Çift"></option></datalist>
      <div id="shirt-preview">${shirtSVG(profile)}</div>
      <h2>Metin</h2>
      <div class="form-grid">
        ${field("f-motto", "Cümle", profile.motto, "wide")}
        ${area("f-bio", "Kişi metni", profile.bio)}
        ${area("f-day", "Gün", profile.day)}
        ${area("f-loves", "Merak", profile.loves)}
        ${area("f-futbol-intro", "Futbolcu girişi", profile.futbolIntro || "")}
        ${area("f-style", "Oyun profili", profile.style)}
      </div>
      <h2>Fotoğraflar</h2>
      <p class="empty">Dosyalar site klasöründeki <code>photos/</code> içinden gelir. Burada alt yazı ve açıklama yazılır.</p>
      ${rowsHTML("photos", profile.photos)}
      <h2>Futbolcu sayfası</h2>
      <p class="empty">Çisem Spor, mevki yolculuğu ve hız bölümleri. chapter alanı: kisi, futbolcu, istatistikler, elci, projeler.</p>
      ${rowsHTML("futbolBlocks", profile.futbolBlocks || [])}
      <h2>Kişi sayfası</h2>
      <p class="empty">Ramos sitesindeki gibi Kök, Aile, Öğrenim bölümleri. Bölüm fotoğrafı için chapter alanına kisi, futbolcu, istatistikler, elci veya projeler yazın.</p>
      ${rowsHTML("personaBlocks", profile.personaBlocks)}
      <h2>Kartlar</h2>
      ${rowsHTML("facts", profile.facts)}
      <h2>Rakamlar</h2>
      ${rowsHTML("stats", profile.stats)}
      <h2>Sezon istatistikleri</h2>
      ${rowsHTML("gameStats", profile.gameStats || [])}
      <h2>Sezon özetleri</h2>
      <p class="empty">Her sezon için maç, gol ve G/B/M sayıları. id: 2025-26 gibi.</p>
      ${rowsHTML("seasons", profile.seasons || [])}
      <h2>Maç listesi</h2>
      <p class="empty">TFF maç detayı: role = ilk11 veya yedek; subIn / subOut dakikaları; minutes boşsa hesaplanır.</p>
      ${rowsHTML("matches", profile.matches || [])}
      <h2>Attığı goller</h2>
      <p class="empty">TFF gol satırları — macId ve dakika.</p>
      ${rowsHTML("goalEvents", profile.goalEvents || [])}
      <h2>Kupalar ve ödüller</h2>
      ${rowsHTML("honours", profile.honours)}
      <h2>Duruş</h2>
      ${rowsHTML("values", profile.values)}
      <h2>Projeler</h2>
      ${rowsHTML("dreams", profile.dreams)}
      <h2>Dosya</h2>
      <div class="tools">
        <button type="button" class="textbtn" data-action="export">JSON indir</button>
        <label class="textbtn filebtn">JSON yükle<input id="import-file" type="file" accept="application/json,.json" hidden></label>
        <button type="button" class="textbtn danger" data-action="reset">Başlangıca dön</button>
      </div>
      <p class="form-error" id="form-error" role="alert"></p>
      <div class="savebar">
        <button type="submit" class="primary">Kaydet</button>
        <button type="button" data-action="close-editor">Vazgeç</button>
      </div>
    </form>
  </div>`;
}

function menuHTML() {
  const page = route();
  const isHome = page === "home";
  const links = CHAPTERS.map((chapter) => `<a href="#${chapter.id}" ${page === chapter.id ? 'aria-current="page"' : ""}>${esc(chapter.title)}</a>`).join("");
  return `<nav class="menu${isHome ? " menu-drawer" : ""}" aria-label="Menü">
    <div class="menu-top"><button type="button" class="textbtn" data-action="close-menu">Kapat</button></div>
    ${links}
    <button type="button" class="textbtn" data-action="edit">Düzenle</button>
  </nav>`;
}

function renderPage() {
  applyProfile(profile);
  const page = route();
  const isHome = page === "home";
  document.body.classList.toggle("is-home", isHome);
  const stage = document.getElementById("stage");
  if (stage) {
    if (isHome) stage.hidden = true;
    else stage.removeAttribute("hidden");
  }
  document.querySelector(".veil")?.classList.toggle("is-hidden", isHome);
  document.querySelector(".grain")?.classList.toggle("is-hidden", isHome);
  document.getElementById("top").innerHTML = headerHTML(isHome);
  document.getElementById("view").innerHTML = isHome ? homeHTML() : PAGES[page]();
  if (isHome) {
    reelObserver?.disconnect();
    clearHomeScene();
    initHomeInteractions();
  } else {
    setScene(page);
    window.scrollTo(0, 0);
  }
}

function syncChrome() {
  document.body.classList.toggle("lock", menuOpen || editorOpen);
  document.body.classList.toggle("menu-open", menuOpen);
  document.querySelectorAll("[data-action='open-menu']").forEach((menuButton) => {
    menuButton.setAttribute("aria-expanded", menuOpen ? "true" : "false");
  });
  document.getElementById("overlays").innerHTML = `${menuOpen ? menuHTML() : ""}${editorOpen ? editorHTML() : ""}`;
  if (menuOpen) document.querySelector("[data-action='close-menu']")?.focus();
}

function readRows(name) {
  const keys = ROW_FIELDS[name];
  return [...document.querySelectorAll(`.rows[data-rows="${name}"] .row`)].map((row) => {
    const item = {};
    keys.forEach((key) => {
      item[key] = row.querySelector(`[data-k="${key}"]`)?.value || "";
    });
    return item;
  });
}

function readForm(useFallback = false) {
  const value = (id) => document.getElementById(id)?.value ?? "";
  return sanitize({
    firstName: value("f-first"),
    lastName: value("f-last"),
    age: value("f-age"),
    birthDate: value("f-birth-date"),
    birthPlace: value("f-birth-place"),
    hometown: value("f-hometown"),
    city: value("f-city"),
    idol: value("f-idol"),
    youtube: value("f-youtube"),
    instagram: value("f-instagram"),
    tff: {
      profileUrl: value("f-tff-url"),
      licenseNo: value("f-tff-license"),
      kisiId: value("f-tff-kisi"),
      club: value("f-tff-club")
    },
    playModel: {
      xgPer90: value("f-xg-per90"),
      matchLength: value("f-match-length")
    },
    number: value("f-number"),
    position: value("f-position"),
    team: value("f-team"),
    teamLogo: value("f-team-logo"),
    naturalFoot: value("f-natural-foot"),
    foot: value("f-foot"),
    kit: value("f-kit"),
    kitInk: value("f-kit-ink"),
    motto: value("f-motto"),
    bio: value("f-bio"),
    day: value("f-day"),
    loves: value("f-loves"),
    futbolIntro: value("f-futbol-intro"),
    style: value("f-style"),
    photos: readRows("photos"),
    personaBlocks: readRows("personaBlocks"),
    futbolBlocks: readRows("futbolBlocks"),
    facts: readRows("facts"),
    gameStats: readRows("gameStats"),
    seasons: readRows("seasons"),
    matches: readRows("matches"),
    goalEvents: readRows("goalEvents"),
    stats: readRows("stats"),
    honours: readRows("honours"),
    values: readRows("values"),
    dreams: readRows("dreams")
  }, useFallback);
}

function updatePreview() {
  if (!document.getElementById("profile-form")) return;
  const draft = readForm();
  const preview = document.getElementById("brand-preview");
  const shirt = document.getElementById("shirt-preview");
  if (preview) preview.textContent = fullName(draft);
  if (shirt) shirt.innerHTML = shirtSVG(draft);
  const brand = document.querySelector(".brand-name");
  if (brand) brand.innerHTML = `${esc(fullName(draft))}<small class="brand-tag">${personalSahaHTML(draft)}</small>`;
  const mark = document.querySelector(".mark text");
  if (mark) mark.textContent = initials(draft);
  applyProfile(draft);
}

function saveForm() {
  profile = readForm(true);
  localStorage.setItem(KEY, JSON.stringify(profile));
  editorOpen = false;
  menuOpen = false;
  renderPage();
  syncChrome();
}

function closeEditor() {
  editorOpen = false;
  applyProfile(profile);
  renderPage();
  syncChrome();
}

function openEditor(focusId) {
  editorOpen = true;
  menuOpen = false;
  syncChrome();
  const focusIdMap = {
    "add-game-stats": "add-gameStats",
    "add-stats": "add-stats",
    "add-honours": "add-honours",
    "add-seasons": "add-seasons",
    "add-matches": "add-matches"
  };
  const targetId = focusIdMap[focusId] || focusId;
  const target = targetId ? document.getElementById(targetId) : document.getElementById("f-first");
  target?.scrollIntoView({ block: "center" });
  target?.focus();
}

function kick() {
  const ball = document.getElementById("ball");
  const gol = document.getElementById("gol");
  if (!ball || ball.classList.contains("is-kicked")) return;
  ball.classList.add("is-kicked");
  if (gol) gol.textContent = "Gol.";
  window.setTimeout(() => {
    ball.classList.remove("is-kicked");
    if (gol) gol.textContent = "";
  }, reducedMotion ? 700 : 1400);
}

function exportProfile() {
  const data = document.getElementById("profile-form") ? readForm() : profile;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "kuzey-akinci.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function importProfile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      profile = sanitize(JSON.parse(String(reader.result)));
      localStorage.setItem(KEY, JSON.stringify(profile));
      editorOpen = false;
      renderPage();
      syncChrome();
    } catch {
      const error = document.getElementById("form-error");
      if (error) error.textContent = "Bu dosya okunamadı.";
    }
  };
  reader.readAsText(file);
}

document.body.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "open-menu") {
    menuOpen = true;
    editorOpen = false;
    syncChrome();
  } else if (action === "close-menu") {
    menuOpen = false;
    syncChrome();
  } else if (action === "edit") {
    openEditor(target.dataset.focus || "");
  } else if (action === "close-editor") {
    closeEditor();
  } else if (action === "kick") {
    kick();
  } else if (action === "add-row") {
    const name = target.dataset.rows;
    const box = document.querySelector(`.rows[data-rows="${name}"]`);
    box?.insertAdjacentHTML("beforeend", rowHTML(ROW_FIELDS[name]));
    box?.lastElementChild?.querySelector("input")?.focus();
  } else if (action === "remove-row") {
    target.closest(".row")?.remove();
    updatePreview();
  } else if (action === "export") {
    exportProfile();
  } else if (action === "reset") {
    if (!window.confirm("Her şey silinip Kuzey Akıncı başlangıcına dönsün mü?")) return;
    localStorage.removeItem(KEY);
    profile = cloneDefault();
    editorOpen = false;
    renderPage();
    syncChrome();
  }
});

document.body.addEventListener("submit", (event) => {
  if (event.target.id !== "profile-form") return;
  event.preventDefault();
  saveForm();
});

document.body.addEventListener("input", (event) => {
  if (event.target.closest("#profile-form")) updatePreview();
});

document.body.addEventListener("change", (event) => {
  if (event.target.id === "import-file" && event.target.files?.[0]) {
    importProfile(event.target.files[0]);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (editorOpen) closeEditor();
  else if (menuOpen) {
    menuOpen = false;
    syncChrome();
  }
});

window.addEventListener("hashchange", () => {
  menuOpen = false;
  if (editorOpen) {
    editorOpen = false;
    applyProfile(profile);
  }
  renderPage();
  syncChrome();
});

profile = load();
renderPage();
syncChrome();
