# ✅ Checklist Wdrożenia - Dom Latarnika

## Przed deploymentem na Cloudflare Pages

### 📝 Konfiguracja kodu
- [ ] Zaktualizujesz Google Analytics ID (w index.html)
- [ ] Zmienisz domeny w og:url (index.html + sitemap.xml + regulamin.html)
- [ ] Sprawdzisz logi — nie ma błędów w konsoli

### 🔍 SEO & Technical
- [ ] Zweryfikujesz Open Graph tags na https://www.opengraphcheck.com
- [ ] Zweryfikujesz mobile responsiveness (DevTools F12 → Device Toolbar)
- [ ] Sprawdzisz CSS/JS dla błędów (DevTools → Console)
- [ ] Zweryfikujesz strukturę: Lighthouse Audit (DevTools → Lighthouse)

### 🚀 Cloudflare Pages Setup
- [ ] Stworzysz repo na GitHub
- [ ] Będziesz mieć konto na Cloudflare (darmowe)
- [ ] Skonektujesz repo z Cloudflare Pages (GitHub authorization)
- [ ] Dodasz domenę w Cloudflare Pages
- [ ] Zmienisz DNS u rejestratora domeny (na Cloudflare nameservery)

### 📊 Post-Launch (24h po wdrożeniu)

**Google Analytics:**
- [ ] Stworzysz GA4 property
- [ ] Wkleijesz ID do index.html
- [ ] Czekasz 24-48h na pierwsze dane

**Google Search Console:**
- [ ] Dodasz stronę (https://search.google.com/search-console)
- [ ] Weryfikujesz domenę
- [ ] Prześlij sitemap.xml (Sitemaps → https://dom-latarnika.pl/sitemap.xml)
- [ ] Sprawdzisz raportów o błędach

**Google My Business:**
- [ ] Stworzysz listing (https://business.google.com)
- [ ] Dodasz adres, telefon, zdjęcia
- [ ] Weryfikujesz przez list na adres obiektu

**Google PageSpeed Insights:**
- [ ] Sprawdzisz: https://pagespeed.web.dev?url=https://dom-latarnika.pl
- [ ] Notujesz wyniki Core Web Vitals

---

## 📋 Zmiany w kodzie - co zostało zrobione

✅ **index.html:**
- Open Graph meta tags
- JSON-LD Structured Data (LocalBusiness)
- Canonical tag
- Hreflang tags (PL/DE/EN)
- Google Analytics tag
- Favicon links

✅ **regulamin.html:**
- Open Graph
- Canonical tag
- Favicon

✅ **Nowe pliki:**
- `robots.txt` — instrukcje dla Google Bot
- `sitemap.xml` — mapa strony dla Google
- `favicon.svg` — ikona w pasku przeglądarki
- `_redirects` — konfiguracja redirectów dla Cloudflare Pages
- `_headers` — security headers dla Cloudflare
- `SETUP-GUIDE.md` — instrukcje setup
- `DEPLOYMENT-CHECKLIST.md` — ten plik

---

## 🎯 Performance Tips

### Optymalizacja zdjęć:
Jeśli chcesz szybciej (nieobowiązkowe):
1. Skompresuj obrazy: https://tinypng.com
2. Konwertuj JPG na WebP: https://cloudconvert.com
3. Lazy loading jest już (loading="lazy" w HTML)

### Cache na Cloudflare:
- Cloudflare cachuje pliki statyczne automatycznie
- Zmieniając CSS/JS, dodaj ?v=1 do nazwy pliku, aby wymusić refresh

---

## 🚨 Problemy? Czytaj:

- **DNS nie propaguje:** Poczekaj 24-48h (czasem dłużej)
- **Google nie indeksuje:** Prześlij sitemap w Search Console
- **Zdjęcia nie ładują się:** Sprawdź ścieżki w src=""
- **Email na domenie nie działa:** Dodaj MX records u rejestratora (Cloudflare Email Routing - darmowe)

---

## 📞 Kontakty do wyników

Po wdrożeniu, gdzie sprawdzać wyniki:
- Google Analytics: https://analytics.google.com
- Search Console: https://search.google.com/search-console
- Google My Business: https://business.google.com
- PageSpeed Insights: https://pagespeed.web.dev
- Mobile-Friendly Test: https://search.google.com/test/mobile-friendly

---

**Status:** Strona gotowa do wdrożenia na Cloudflare Pages ✅
