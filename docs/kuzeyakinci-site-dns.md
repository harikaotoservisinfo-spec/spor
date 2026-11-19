# kuzeyakinci.site — canlı yayın (GitHub Pages)

Site dosyaları `site/` klasöründedir. `main` branch’e push edildiğinde GitHub Actions otomatik yayınlar.

## 1. GitHub (tek sefer)

1. Repo: https://github.com/harikaotoservisinfo-spec/spor  
2. **Settings → Pages**  
   - **Build and deployment → Source:** `GitHub Actions`  
3. Bu PR merge edildikten sonra **Settings → Pages → Custom domain** alanına: `kuzeyakinci.site`  
4. DNS yayıldıktan sonra **Enforce HTTPS**’i açın.

## 2. isimtescil.net DNS (5781862 — kuzeyakinci.site)

Panel: **Gelişmiş DNS** / mevcut kayıtlar.

### Kaldırın veya değiştirin

| Kayıt | Şu an | Yapılacak |
|--------|--------|-----------|
| `kuzeyakinci.site` | **A** → `93.89.226.17` | **Silin** (eski hosting) |

### Ekleyin — kök alan adı (4 A kaydı)

GitHub Pages için aynı host adına **dört** A kaydı:

| Kayıt adı | Tip | Değer |
|-----------|-----|--------|
| `kuzeyakinci.site` (veya `@`) | A | `185.199.108.153` |
| `kuzeyakinci.site` | A | `185.199.109.153` |
| `kuzeyakinci.site` | A | `185.199.110.153` |
| `kuzeyakinci.site` | A | `185.199.111.153` |

### www

Mevcut **CNAME** `www` → `kuzeyakinci.site` kalabilir.  
Alternatif: `www` → `harikaotoservisinfo-spec.github.io` (GitHub önerisi).

**NS** kayıtları (`tr/eu/us.dnsenable.com`) genelde olduğu gibi kalır.

## 3. Cursor uygulaması (kisisel-saha)

`https://kisisel-saha.apps.grok.bot` Cursor’da barındırılır; **özel alan adı bu adrese bağlanmıyor** (Cursor dokümantasyonu).

- **kuzeyakinci.site** → herkese açık statik site (GitHub Pages)  
- **kisisel-saha** → Cursor’da önizleme / özel yayın; isterseniz **Public** yapıp link paylaşmaya devam edebilirsiniz.

## 4. Kontrol

DNS 15 dk–48 saat sürebilir. Sonra:

- https://kuzeyakinci.site  
- https://www.kuzeyakinci.site  

GitHub **Settings → Pages** altında yeşil “DNS check successful” görünmeli.