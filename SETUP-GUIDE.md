# 🚀 Dom Latarnika - Przewodnik Konfiguracji

## ⚡ Google Analytics 4 Setup

1. **Stwórz konto na Google Analytics:**
   - Idź na https://analytics.google.com
   - Zaloguj się tym samym kontem Google co Gmail
   - Kliknij "Start measuring"

2. **Utwórz property:**
   - Property name: `Dom Latarnika`
   - Website URL: `https://dom-latarnika.pl`

3. **Skopiuj Google Analytics ID:**
   - Będzie w formacie: `G-XXXXXXXXXX`
   - To jest Twój Measurement ID

4. **Wklej ID do index.html:**
   - Zamień `G-XXXXXXXXXX` na Twój ID w 2 miejscach:
     ```html
     <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
     ...
     gtag('config', 'G-XXXXXXXXXX');
     ```

5. **Weryfikacja:**
   - Po 24-48h będą pierwsze dane
   - Dashboard w Google Analytics

---

## 📍 Google My Business Setup (BARDZO WAŻNE!)

1. **Idź na:** https://business.google.com
2. **Dodaj lokalizację:**
   - Nazwa: `Dom Latarnika`
   - Adres: `ul. Nadmorska 65A, 78-132 Grzybowo, Polska`
   - Telefon: `+48 607 35 45 55`
   - Strona: `https://dom-latarnika.pl`
   - Kategoria: `Pensjonat` lub `Hotel`

3. **Weryfikuj adres:**
   - Google pośle list na adres obiektu
   - Kod będzie w liście

4. **Dodaj zdjęcia:**
   - Co najmniej 5-10 zdjęć pokoi
   - To zwiększa CTR w wynikach wyszukiwania

5. **Odpowiadaj na opinie:**
   - Google My Business pokazuje opinie z Google

---

## 🔧 Cloudflare Pages Deployment

### Ustawianie domeny na Cloudflare Pages:

1. **Połącz repozytorium Git:**
   - Stwórz repo na GitHub (https://github.com)
   - Push projekt do repozytorium
   - Połącz z Cloudflare Pages

2. **Konfiguracja domeny:**
   - W Cloudflare Pages: Connect Git → Autoryzuj GitHub
   - Wybierz repo `dom-latarnika`
   - Cloudflare automatycznie wykryje stronę statyczną
   - Build command: (puste - strona statyczna)
   - Build output directory: (puste - domyślnie root)

3. **Automatyczne HTTPS:**
   - Cloudflare załatwia automatycznie (darmowe SSL)

4. **Zmiana DNS:**
   - Cloudflare pokaże Ci nameservery
   - Zmień DNS u rejestratora domeny na:
     - `ana.ns.cloudflare.com`
     - `bash.ns.cloudflare.com`
   - Lub użyj CNAME:
     - `dom-latarnika.pl` → `dom-latarnika-gh.pages.dev`

5. **Setup domeny w Cloudflare:**
   - Custom domain → Dodaj `dom-latarnika.pl`

---

## 📋 SEO Checklist - Co jest zrobione ✅

- ✅ Meta description
- ✅ Open Graph tags
- ✅ Twitter Card
- ✅ Canonical tag
- ✅ JSON-LD Structured Data
- ✅ robots.txt
- ✅ sitemap.xml
- ✅ Favicon
- ✅ Hreflang dla PL/DE/EN

---

## 📈 Tracking & Monitoring

### Google Search Console:
1. Idź na https://search.google.com/search-console
2. Dodaj domenę
3. Prześlij sitemap.xml
4. Monitor za raportów o błędach

### Google PageSpeed Insights:
- https://pagespeed.web.dev
- Wklej `https://dom-latarnika.pl`
- Sprawdź Core Web Vitals

---

## 🎯 Kolejne kroki (opcjonalnie):

- [ ] SSL Certificate (Cloudflare załatwia darmowo)
- [ ] Backup bazy danych (jeśli będzie potrzebna)
- [ ] Email na domenie (`kontakt@dom-latarnika.pl`)
- [ ] Mailchimp newsletter (zbieranie maili)
- [ ] Hotjar heatmaps (opcjonalnie, $39/mio)

---

**Pytania?** Dokumentacja Cloudflare Pages: https://developers.cloudflare.com/pages/
