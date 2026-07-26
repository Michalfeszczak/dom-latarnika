# 🏠 Dom Latarnika – Pensjonat w Grzybowie

Nowoczesna, responsywna strona internetowa pensjonatu Dom Latarnika nad Bałtykiem.
Strona statyczna (HTML/CSS/JS) – bez procesu budowania, gotowa do wrzucenia na hosting.

## ✨ Cechy

- 🚀 **Szybka** – statyczne HTML/CSS/JS, obrazy w formacie WebP
- 📱 **Responsywna** – telefon, tablet, desktop
- ♿ **Dostępna** – panel ułatwień (kontrast, większy tekst, mniej ruchu), obsługa klawiatury
- 🌍 **Wielojęzyczna** – polski, niemiecki, angielski (przełącznik PL/DE/EN)
- 🛏️ **Indywidualne pokoje** – 5 typów pokoi/studiów/apartament z modalem zdjęć i wyposażenia
- 📣 **Aktualności + Facebook** – sekcja aktualności i osadzona tablica FB (po zgodzie RODO)
- 🔒 **RODO** – baner cookies, treści społecznościowe ładowane dopiero po zgodzie
- 📊 **SEO** – Open Graph, JSON-LD (BedAndBreakfast), sitemap, robots, strona 404

## 📁 Struktura projektu

```
dom-latarnika/
├── index.html              # Strona główna
├── regulamin.html          # Regulamin pobytu
├── privacy-policy.html     # Polityka prywatności
├── 404.html                # Strona błędu 404
├── robots.txt · sitemap.xml · favicon.svg
├── _redirects · _headers   # Konfiguracja Cloudflare Pages
├── assets/
│   ├── index.css           # Style strony głównej
│   ├── index.js            # Logika: pokoje, galeria, modale, i18n, Facebook
│   ├── cookie-consent.js   # Zgoda na cookies (RODO)
│   └── cookie-consent.css  # Styl banera cookies
└── img/
    ├── brand/              # logo-dark.png (na jasnym tle), logo-light.png (na ciemnym)
    ├── icons/              # ikony atutów i okolicy (family, group, waves, beach, bike, bus)
    ├── hero/               # panorama.webp – zdjęcie tła w hero
    ├── building/           # aerial.webp, terrace.webp – budynek i taras
    ├── rooms/              # zdjęcia pokoi, studiów i apartamentu
    ├── shared/             # zdjęcia i nagrania wspólnych przestrzeni (kuchnia, salon, taras)
    ├── beach/              # beach-01…08.webp – plaża i okolica
    ├── area/               # map.png – stylizowana mapa
    └── og-image.webp       # obrazek do social media (1200×630)
```

## 🖼️ Jak dodać / podmienić zdjęcia

Wszystkie zdjęcia trzymamy w `img/` w formacie **WebP** (lżejsze niż JPG/PNG).

**Konwersja i optymalizacja nowego zdjęcia** (wymaga `cwebp` lub ImageMagick):
```bash
# ImageMagick – dopasuj do maks. 1600 px dłuższego boku, jakość 80
magick moje-zdjecie.jpg -auto-orient -resize '1600x1600>' -quality 80 -strip img/rooms/nowy-pokoj.webp
```

- **Zdjęcie pokoju** → wrzuć do `img/rooms/` i wskaż je w tablicy `roomTypes` w `assets/index.js`
  (pola `cover` = miniatura karty, `images` = galeria w oknie pokoju).
- **Zdjęcie do galerii** na dole sekcji „Pokoje" → dodaj `<img>` w `index.html` w bloku
  `.gallery-clean-track`.
- **Zdjęcie w hero** (pokaz slajdów) → podmień `background-image` w sekcji `.hero-slides` w `index.html`.
- **Zdjęcie w Aktualnościach** → podmień `src` obrazków w kartach `.news-card` w `index.html`.
- **Obrazek social (Open Graph)** → nadpisz `img/og-image.webp` (proporcje 1200×630).

## 🛏️ Jak edytować pokoje (kolekcje)

Pokoje są pogrupowane w **kolekcje** (aby nie zasypywać gościa listą kilkunastu pokoi) – tablica
**`roomGroups`** w `assets/index.js`. Każda kolekcja:
```js
{
  id: "poddasze",
  images: ["img/rooms/attic-skylight.webp", …], // puste [] = placeholder „Zdjęcia wkrótce"
  names: ["7h", "8h"],                            // nazwy pokoi w tej kolekcji (chipy)
  tagKey: "rg_attic_tag",                         // etykieta na karcie
  titleKey: "rg_attic_title",
  descKey:  "rg_attic_desc",
  featureKeys: ["feat_bath", "feat_tv", …]        // wyposażenie
}
```
Aktualne kolekcje: prywatny „0", „DO"/„DU" (kilka schodków), „1h–6h", poddasze „7h/8h",
łączone „R/Piętrus/Bliźniak", Apartament.

**Aby dodać zdjęcia:** wrzuć pliki `.webp` do `img/rooms/` i dopisz ich ścieżki w `images`
danej kolekcji (pierwsze = miniatura na karcie, reszta trafia do galerii w oknie).
Teksty (tytuł, opis, etykieta) tłumaczysz w obiekcie `translations` (pl/de/en).
Ceny i dostępność celowo **nie są zaszyte** – kierujemy do Booking.com.

## 🛋️ Wspólne przestrzenie (zdjęcia i wideo)

Sekcja „Przestrzenie" (kuchnia, salon z grami, taras) jest sterowana tablicą **`sharedSpaces`**
w `assets/index.js`:
```js
{ id: "kitchen", icon: "kitchen", image: "", video: "", titleKey: …, textKey: …, tagKey: … }
```
- **Zdjęcie:** wrzuć plik do `img/shared/` i wpisz go w polu `image`, np. `image: "img/shared/kuchnia.webp"`.
- **Nagranie:** wpisz plik `.mp4` w polu `video`, np. `video: "img/shared/kuchnia.mp4"`
  (jeśli podasz też `image`, posłuży jako miniatura/poster odtwarzacza).
- Puste `image` i `video` = placeholder „Zdjęcia i nagrania wkrótce".

## 📣 Sekcja Aktualności i Facebook

- Profil FB: **https://www.facebook.com/DomLatarnika**
- Trzy edytowalne karty aktualności w `index.html` (`#aktualnosci`) – podmieniaj tytuły, teksty i zdjęcia.
- Osadzona **tablica Facebooka** ładuje się dopiero po zgodzie użytkownika (RODO). Adres profilu
  ustawia atrybut `data-fb-page` na elemencie `#fb-embed` w `index.html`.

## 🚀 Uruchomienie lokalne

```bash
python3 -m http.server 8000
# otwórz http://localhost:8000
```

## ☁️ Wdrożenie – Cloudflare Pages (darmowe)

1. Wypchnij repo na GitHub.
2. Cloudflare Pages → **Create project → Connect Git** → wybierz repozytorium.
3. Framework preset: **None**, build command i output directory: **puste**.
4. **Save and Deploy**, następnie dodaj domenę `dom-latarnika.pl` w zakładce *Custom domain*.

Pliki `_headers` i `_redirects` są już przygotowane pod Cloudflare Pages.

## 📊 Po wdrożeniu (opcjonalnie)

- **Google Search Console** – dodaj domenę i prześlij `sitemap.xml`.
- **Statystyki odwiedzin** – kod jest przygotowany: uzupełnij `loadAnalytics()` w
  `assets/cookie-consent.js` (ładuje się tylko po zgodzie na cookies). Domyślnie analityka
  jest wyłączona.
- **Wizytówka Google** – uzupełnij zdjęcia i dane kontaktowe.

---

**Kontakt:** Dom Latarnika · ul. Nadmorska 65A, 78-132 Grzybowo · tel. +48 607 354 555
