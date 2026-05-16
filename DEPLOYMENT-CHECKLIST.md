# ✅ Checklist Wdrożenia - Dom Latarnika

## Przed deploymentem na Vercel

### 📝 Konfiguracja kodu
- [ ] Zaktualizujesz Google Analytics ID (w index.html)
- [ ] Zmienisz domeny w og:url (index.html + sitemap.xml + regulamin.html)
- [ ] Sprawdzisz logi — nie ma błędów w konsoli

### 🔍 SEO & Technical
- [ ] Zweryfikujesz Open Graph tags na https://www.opengraphcheck.com
- [ ] Zweryfikujesz mobile responsiveness (DevTools F12 → Device Toolbar)
- [ ] Sprawdzisz CSS/JS dla błędów (DevTools → Console)
- [ ] Zweryfikujesz strukturę: Lighthouse Audit (DevTools → Lighthouse)

### 🚀 Vercel Setup
- [ ] Stworzysz repo na GitHub
- [ ] Będziesz mieć konto na Vercel
- [ ] Skonektujesz repo z Vercel
- [ ] Dodasz domenę (Settings → Domains)
- [ ] Zmienisz DNS u rejestratora

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
- `vercel.json` — konfiguracja Vercel (cache, headers security)
- `SETUP-GUIDE.md` — instrukcje setup
- `DEPLOYMENT-CHECKLIST.md` — ten plik

---

## 🎯 Performance Tips

### Optymalizacja zdjęć:
Jeśli chcesz szybciej (nieobowiązkowe):
1. Skompresuj obrazy: https://tinypng.com
2. Konwertuj JPG na WebP: https://cloudconvert.com
3. Lazy loading jest już (loading="lazy" w HTML)

### Cache Busting:
- `assets/index.css` i `assets/index.js` są cachowane na 1 rok
- Zmieniając CSS/JS, dodaj ?v=1 do nazwy pliku

---

## 🚨 Problemy? Czytaj:

- **DNS nie propaguje:** Poczekaj 24-48h (czasem dłużej)
- **Google nie indeksuje:** Prześlij sitemap w Search Console
- **Zdjęcia nie ładują się:** Sprawdź ścieżki w src=""
- **Email na domenie nie działa:** Przydaj MX records u rejestratora

---

## 📞 Kontakty do wyników

Po wdrożeniu, gdzie sprawdzać radarami:
- Google Analytics: https://analytics.google.com
- Search Console: https://search.google.com/search-console
- Google My Business: https://business.google.com
- PageSpeed Insights: https://pagespeed.web.dev
- Mobile-Friendly Test: https://search.google.com/test/mobile-friendly

---

**Status:** Strona gotowa do wdrożenia ✅
