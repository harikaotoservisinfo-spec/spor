const KEY = "kuzey-akinci-profile-v1";
const CHAPTERS = [
  { id: "kisi", index: "01", title: "Kişi", kicker: "Önce insan", line: "Formadan önce gelen taraf." },
  { id: "futbolcu", index: "02", title: "Futbolcu", kicker: "Sahada", line: "Numara, mevki, oyun fikri." },
  { id: "kupalar", index: "03", title: "Kupalar", kicker: "Kazanılanlar", line: "Asılan her şey burada durur." },
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
  honours: ["year", "title", "detail"],
  values: ["title", "text"],
  dreams: ["title", "text"],
  photos: ["file", "alt", "caption"]
};

const PHOTO_PATH = /^photos\/[a-z0-9._-]+\.(png|jpe?g|webp)$/i;

const PLACEHOLDERS = {
  label: "Başlık",
  value: "Değer",
  year: "Yıl",
  title: "Ad",
  detail: "Not",
  text: "Cümle",
  file: "photos/dosya.png"
};

const DEFAULT = window.SAHA_DEFAULT;
let profile = load();
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
    return {
      file,
      alt: cleanLine(item?.alt, 120, "Fotoğraf"),
      caption: cleanLine(item?.caption, 120)
    };
  }).filter(Boolean);
}

function heroPhoto(person) {
  return person.photos?.[0] || null;
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
    foot: cleanLine(source.foot, 20),
    idol: cleanLine(source.idol, 40),
    motto: cleanLine(source.motto, 80),
    bio: cleanBlock(source.bio, 2000),
    day: cleanBlock(source.day, 800),
    loves: cleanBlock(source.loves, 800),
    style: cleanBlock(source.style, 800),
    kit: safeColor(source.kit, "#f3f1ea"),
    kitInk: safeColor(source.kitInk, "#142018"),
    photos: (() => {
      const list = cleanPhotos(source.photos);
      return list.length ? list : cleanPhotos(DEFAULT.photos || []);
    })(),
    facts: cleanList(source.facts, ["label", "value"], { label: 40, value: 80 }),
    stats: cleanList(source.stats, ["label", "value"], { label: 40, value: 20 }),
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
  const id = decodeURIComponent(location.hash.replace(/^#/, ""));
  return CHAPTERS.some((chapter) => chapter.id === id) ? id : "home";
}

function applyProfile(person) {
  document.documentElement.style.setProperty("--kit", person.kit);
  document.documentElement.style.setProperty("--kit-ink", person.kitInk);
  document.title = fullName(person);
  const hero = heroPhoto(person);
  const url = hero ? `url("${hero.file}")` : "none";
  document.documentElement.style.setProperty("--photo-kisi", url);
  document.documentElement.style.setProperty("--photo-futbolcu", url);
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

function headerHTML() {
  const name = fullName(profile);
  return `<a class="brand" href="#">
      ${markSVG(profile)}
      <span class="brand-name">${esc(name)}<small>Kişisel saha</small></span>
    </a>
    <div class="tools">
      <button type="button" data-action="edit">Düzenle</button>
      <button type="button" data-action="open-menu" aria-expanded="${menuOpen ? "true" : "false"}">Menü</button>
    </div>`;
}

function homeHTML() {
  const hero = heroPhoto(profile);
  const panels = CHAPTERS.map((chapter) => {
    const shot = chapter.id === "kisi" && hero
      ? `<figure class="panel-shot"><img src="${esc(hero.file)}" alt="${esc(hero.alt)}" width="480" height="640" decoding="async" loading="eager"></figure>`
      : "";
    const extra = chapter.id === "kisi" && hero ? " panel-photo" : "";
    return `<a class="panel${extra}" href="#${chapter.id}" data-scene="${chapter.id}">
      <span class="idx">${chapter.index}</span>
      <h2>${esc(chapter.title)}</h2>
      <p>${esc(chapter.line)}</p>
      ${shot}
    </a>`;
  }).join("");
  const dots = CHAPTERS.map((chapter) => `<button type="button" data-action="scene" data-scene="${chapter.id}" aria-label="${esc(chapter.title)}"></button>`).join("");
  return `<h1 class="sr-only">${esc(fullName(profile))}</h1>
    <div class="reel" id="reel">${panels}</div>
    <p class="hint">Kaydır</p>
    <nav class="rail" aria-label="Bölümler">${dots}</nav>`;
}

function cupSVG() {
  return `<svg viewBox="0 0 64 72" aria-hidden="true">
    <path d="M14 8 H50 V26 C50 40 40 48 32 48 C24 48 14 40 14 26 Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <path d="M14 14 H8 C8 26 12 30 18 30" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <path d="M50 14 H56 C56 26 52 30 46 30" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <path d="M32 48 V58 M22 58 H42 M26 64 H38" fill="none" stroke="currentColor" stroke-width="1.6"/>
  </svg>`;
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

function chapterFrame(chapter, inner) {
  return `<article class="article">
    <a class="back" href="#">← Saha</a>
    <p class="kicker">${chapter.index} · ${esc(chapter.kicker)}</p>
    <h1>${esc(chapter.title)}</h1>
    ${inner}
    <footer class="colophon"><span>${esc(fullName(profile))}</span><span>Kişisel saha</span></footer>
  </article>`;
}

function renderKisi() {
  const etymology = isBrandName(profile) ? `<div class="split">
      <div><span>Ad</span><strong>Kuzey</strong><em>Yön</em></div>
      <div><span>Soyad</span><strong>Akıncı</strong><em>Hareket</em></div>
    </div>` : "";
  const bits = [];
  if (profile.age) bits.push(`${profile.age} yaşında.`);
  if (profile.city) bits.push(profile.city);
  if (profile.idol) bits.push(`Örnek aldığı oyuncu: ${profile.idol}.`);
  const lede = bits.length ? `<p class="lede">${esc(bits.join(" "))}</p>` : "";
  const hero = heroPhoto(profile);
  const lead = hero ? `<div class="article-photo">${photoFigure(hero, "portrait hero")}</div>` : "";
  return chapterFrame(CHAPTERS[0], `
    ${lead}
    ${lede}
    <div class="prose">${richText(profile.bio)}</div>
    ${etymology}
    ${factsHTML(profile.facts)}
    ${optionalBlock("Gün", profile.day, "Okul, antrenman ve akşamın sırası buraya gelir.", "f-day")}
    ${optionalBlock("Merak", profile.loves, "Sevdiği oyun, eşya ya da saat buraya yazılır.", "f-loves")}
  <section class="group">
      <h2>Fotoğraflar</h2>
      ${galleryHTML(profile.photos)}
    </section>
  `);
}

function renderFutbolcu() {
  const bits = [fullName(profile)];
  if (profile.team) bits.push(profile.team);
  if (profile.position) bits.push(profile.position);
  if (profile.number) bits.push(`forma ${profile.number}`);
  if (profile.foot) bits.push(`güçlü ayak ${profile.foot.toLocaleLowerCase("tr")}`);
  const stats = profile.stats.length
    ? `<div class="stats">${profile.stats.map((stat) => `<div class="stat"><span>${esc(stat.label)}</span><strong>${esc(stat.value)}</strong></div>`).join("")}</div>`
    : `<p class="empty">Sezon rakamları henüz yok.</p><p><button type="button" class="textbtn" data-action="edit" data-focus="add-stats">Rakam ekle</button></p>`;
  return chapterFrame(CHAPTERS[1], `
    <p class="lede">${esc(bits.join(" · "))}</p>
    <div class="layout">
      <div>
        <div class="prose">${richText(profile.style)}</div>
        <section class="group">
          <h2>Rakamlar</h2>
          ${stats}
        </section>
      </div>
      <div class="kit-col">
        ${(() => { const h = heroPhoto(profile); return h ? photoFigure(h, "portrait kit-shot") : ""; })()}
        ${shirtSVG(profile)}
        <div class="pitch-card">
          <h2>Mevki</h2>
          ${pitchSVG(profile)}
          <p class="pitch-label">${esc(profile.position || "Mevki seçilmedi")}</p>
        </div>
      </div>
    </div>
    <section class="group">
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
  `);
}

function renderKupalar() {
  const body = profile.honours.length
    ? `<div class="cups">${profile.honours.map((honour) => `<article class="cup">
        ${cupSVG()}
        ${honour.year ? `<em>${esc(honour.year)}</em>` : ""}
        <strong>${esc(honour.title)}</strong>
        ${honour.detail ? `<p>${esc(honour.detail)}</p>` : ""}
      </article>`).join("")}</div>`
    : `<div class="ghost">
        ${cupSVG()}
        <p class="lede">Kupa, madalya ya da bir teşekkür. İlki asılınca duvar dolmaya başlar.</p>
        <p><button type="button" class="textbtn" data-action="edit" data-focus="add-honours">Kupa ekle</button></p>
      </div>`;
  return chapterFrame(CHAPTERS[2], body);
}

function renderElci() {
  return chapterFrame(CHAPTERS[3], `
    <p class="motto">${esc(profile.motto || "Yön belli. Hareket bende.")}</p>
    <p class="lede">Elçi burada bir kurum unvanı değil. Oyuna, rakibe ve takıma karşı duruşun adı.</p>
    <section class="group">${itemsHTML(profile.values, "Duruş cümleleri düzenle menüsünden yazılır.")}</section>
  `);
}

function renderProjeler() {
  return chapterFrame(CHAPTERS[4], `
    <p class="lede">Bitmiş işlerin listesi değil. Kuzey Akıncı adının altında duran, süren işler.</p>
    <section class="group">${itemsHTML(profile.dreams, "İlk proje buraya yazılır.")}</section>
  `);
}

const PAGES = {
  kisi: renderKisi,
  futbolcu: renderFutbolcu,
  kupalar: renderKupalar,
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
  return `<div class="row${keys.length > 2 ? " cols-3" : ""}">${inputs}<button type="button" data-action="remove-row">Sil</button></div>`;
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
        ${field("f-idol", "Örnek aldığı oyuncu", profile.idol, "wide")}
      </div>
      <h2>Saha</h2>
      <div class="form-grid">
        <label class="field" for="f-number"><span>Forma numarası</span><input id="f-number" inputmode="numeric" maxlength="2" value="${esc(profile.number)}"></label>
        <label class="field" for="f-position"><span>Mevki</span><input id="f-position" list="positions" value="${esc(profile.position)}" maxlength="40"></label>
        ${field("f-team", "Takım", profile.team, "wide")}
        <label class="field" for="f-foot"><span>Güçlü ayak</span><input id="f-foot" list="feet" value="${esc(profile.foot)}" maxlength="20"></label>
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
        ${area("f-style", "Oyun fikri", profile.style)}
      </div>
      <h2>Fotoğraflar</h2>
      <p class="empty">Dosyalar site klasöründeki <code>photos/</code> içinden gelir. Burada alt yazı ve açıklama yazılır.</p>
      ${rowsHTML("photos", profile.photos)}
      <h2>Kartlar</h2>
      ${rowsHTML("facts", profile.facts)}
      <h2>Rakamlar</h2>
      ${rowsHTML("stats", profile.stats)}
      <h2>Kupalar</h2>
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
  const links = CHAPTERS.map((chapter) => `<a href="#${chapter.id}" ${page === chapter.id ? 'aria-current="page"' : ""}>${esc(chapter.title)}</a>`).join("");
  return `<nav class="menu" aria-label="Menü">
    <div class="menu-top"><button type="button" class="textbtn" data-action="close-menu">Kapat</button></div>
    ${links}
    <button type="button" class="textbtn" data-action="edit">Düzenle</button>
  </nav>`;
}

function renderPage() {
  applyProfile(profile);
  const page = route();
  document.body.classList.toggle("is-home", page === "home");
  document.getElementById("top").innerHTML = headerHTML();
  document.getElementById("view").innerHTML = page === "home" ? homeHTML() : PAGES[page]();
  setScene(page === "home" ? "kisi" : page);
  if (page === "home") watchReel();
  else {
    reelObserver?.disconnect();
    window.scrollTo(0, 0);
  }
}

function syncChrome() {
  document.body.classList.toggle("lock", menuOpen || editorOpen);
  const menuButton = document.querySelector("[data-action='open-menu']");
  if (menuButton) menuButton.setAttribute("aria-expanded", menuOpen ? "true" : "false");
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
    city: value("f-city"),
    idol: value("f-idol"),
    number: value("f-number"),
    position: value("f-position"),
    team: value("f-team"),
    foot: value("f-foot"),
    kit: value("f-kit"),
    kitInk: value("f-kit-ink"),
    motto: value("f-motto"),
    bio: value("f-bio"),
    day: value("f-day"),
    loves: value("f-loves"),
    style: value("f-style"),
    photos: readRows("photos"),
    facts: readRows("facts"),
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
  if (brand) brand.innerHTML = `${esc(fullName(draft))}<small>Kişisel saha</small>`;
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
  const target = focusId ? document.getElementById(focusId) : document.getElementById("f-first");
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
  } else if (action === "scene") {
    const panel = document.querySelector(`.panel[data-scene="${target.dataset.scene}"]`);
    panel?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
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

document.body.addEventListener("pointerover", (event) => {
  const panel = event.target.closest?.(".panel");
  if (panel?.dataset.scene) setScene(panel.dataset.scene);
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

renderPage();
syncChrome();
