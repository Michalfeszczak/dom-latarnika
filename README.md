# 🏠 Dom Latarnika - Pensjonat w Grzybowie

Nowoczesna, responsywna strona internetowa pensjonatu Dom Latarnika nad morzem Bałtyckim.

## ✨ Cechy

- 🚀 **Szybka** - Statyczna strona HTML/CSS/JS (bez budowania)
- 📱 **Responsywna** - Doskonale wygląda na mobilach, tabletach i desktopach
- ♿ **Dostępna** - WCAG 2.1 AA compliant z support dla screen readerów
- 🌍 **Wielojęzyczna** - Polski, niemiecki, angielski
- 🔒 **Bezpieczna** - HTTPS, security headers, RODO-compliant
- 📊 **SEO-optimized** - Open Graph, JSON-LD, sitemap, robots.txt
- 🍪 **RODO** - Cookie consent + Privacy Policy

## 🚀 Deployment - Cloudflare Pages (Darmowe)

### Krok 1: Stwórz repo na GitHub
```bash
# Już masz git repo lokalnie, teraz push na GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dom-latarnika.git
git push -u origin main
```

### Krok 2: Połącz z Cloudflare Pages
1. Idź na https://pages.cloudflare.com
2. Kliknij **Create project** → **Connect Git**
3. Autoryzuj GitHub i wybierz `dom-latarnika`
4. Framework: `None`
5. Build command: (pozostaw puste)
6. Build output directory: (pozostaw puste)
7. Kliknij **Save and Deploy** ✅

### Krok 3: Dodaj domenę
1. W Cloudflare Pages: **Custom domain**
2. Dodaj `dom-latarnika.pl`
3. Zmień DNS u rejestratora na Cloudflare nameservery:
   - `ana.ns.cloudflare.com`
   - `bash.ns.cloudflare.com`
4. Czekaj 24-48h na propagację

## 📝 Konfiguracja

### Google Analytics
1. Stwórz property na https://analytics.google.com
2. Skopiuj **Measurement ID** (format: `G-XXXXXXXXXX`)
3. Otwórz `index.html` i zamień `G-XXXXXXXXXX` na Twój ID w 2 miejscach

### Privacy Policy
Otwórz `privacy-policy.html` i zmień:
- Email kontaktu
- Numer telefonu
- Adres obiektu

## 📁 Struktura projektu

```
dom-latarnika/
├── index.html              # Główna strona
├── regulamin.html          # Regulamin pensjonatu
├── privacy-policy.html     # Polityka prywatności
├── robots.txt              # Instrukcje dla Google Bot
├── sitemap.xml             # Mapa strony
├── favicon.svg             # Ikona strony
├── _redirects              # Cloudflare Pages redirects
├── _headers                # Cloudflare Pages headers
├── assets/
│   ├── index.css           # Główne style
│   ├── index.js            # JavaScript logika
│   ├── cookie-consent.js   # Cookie & GA consent
│   └── cookie-consent.css  # Cookie banner style
├── img/                    # Zdjęcia pokoi, obiektu
└── .gitignore              # Pliki ignorowane w git
```

## 🔧 Development

### Uruchomienie lokalnie
```bash
# Najprostsze - użyj Python3:
python3 -m http.server 8000

# Lub Node.js (http-server):
npx http-server

# Otwórz: http://localhost:8000
```

### Testing
- Sprawdź mobile: DevTools (F12) → Device Toolbar
- Sprawdź SEO: https://www.opengraphcheck.com
- Sprawdź performance: https://pagespeed.web.dev

## 📊 Post-Launch

Po wdrożeniu, zrób to:

### Google Analytics
- Czekaj 24-48h na pierwsze dane
- Dashboard: https://analytics.google.com

### Google Search Console
1. Dodaj stronę: https://search.google.com/search-console
2. Weryfikuj domenę
3. Prześlij sitemap: https://dom-latarnika.pl/sitemap.xml

### Google My Business
- Stwórz listing: https://business.google.com
- Dodaj zdjęcia, godziny, telefon

### Email na domenie
- Użyj Cloudflare Email Routing (darmowe!): https://dash.cloudflare.com/
- Skonfiguruj w zakładce **Email**

## 📚 Dokumentacja

- [SETUP-GUIDE.md](SETUP-GUIDE.md) - Pełny przewodnik konfiguracji
- [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) - Checklist przed wdrożeniem
- [COOKIES-SETUP.md](COOKIES-SETUP.md) - RODO & Cookie consent

## 🛠️ Support

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- SEO Checklist: https://pagespeed.web.dev
- Accessibility: https://www.a11y-101.com

---

**Strona gotowa do publikacji!** 🚀
