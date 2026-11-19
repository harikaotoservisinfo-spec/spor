# kuzeyakinci.site — canlı yayın (VPS)

Site statik dosyaları `site/` klasöründedir. **Canlı sunucu:** `37.230.105.99` (srv.winlrt.com.tr, nginx).

Dosya yolu sunucuda: `/var/www/kuzeyakinci.site`  
Nginx site config: `/etc/nginx/sites-available/kuzeyakinci.site.conf`  
(winlrt.com.tr ve diğer sitelere dokunulmaz.)

Güncelleme (SSH anahtarınızla):

```bash
./deploy/scripts/vps-sync-kuzeyakinci.sh
```

## 1. isimtescil.net DNS (5781862)

Şu an panelde **GitHub** IP’leri ve eski `93.89.226.17` var — VPS için hepsini kaldırın.

| Yapılacak | Kayıt | Tip | Değer |
|-----------|--------|-----|--------|
| **Sil** | `kuzeyakinci.site` | A | `93.89.226.17` |
| **Sil** | `kuzeyakinci.site` | A | `185.199.108.153` (ve diğer 3 GitHub A kaydı) |
| **Ekle** | `kuzeyakinci.site` | A | **`37.230.105.99`** |

**www:** `CNAME` → `kuzeyakinci.site` (mevcut kayıt uygun).

**NS** satırlarına dokunmayın.

DNS yayıldıktan sonra sunucuda (root SSH):

```bash
certbot --nginx -d kuzeyakinci.site -d www.kuzeyakinci.site
```

## 2. GitHub Pages (isteğe bağlı)

Repo’da `gh-pages` yedeği duruyor; alan adını VPS’e yönlendirdiğinizde **GitHub Custom domain kullanmayın**.

## 3. Cursor (kisisel-saha)

`https://kisisel-saha.apps.grok.bot` — önizleme; özel domain buraya bağlanmaz.

## 4. Kontrol

- http://37.230.105.99/ (Host: kuzeyakinci.site) — sunucuda 200 OK  
- DNS sonrası: https://kuzeyakinci.site