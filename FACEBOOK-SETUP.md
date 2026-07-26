# Facebook — aktualności na stronie (Graph API)

Strona pokazuje najnowsze posty z Waszego fanpage jako **własne kafelki** —
niezawodnie, bez wtyczki FB i bez zależności od ciasteczek w przeglądarce gościa.

Posty pobiera funkcja serwerowa **`functions/api/fb-posts.js`** (endpoint `/api/fb-posts`)
na Cloudflare Pages. Token trzymany jest jako **sekret** po stronie serwera — nigdy w kodzie strony.

Dopóki nie ustawisz tokenu, sekcja pokazuje ładny kafelek „Zajrzyj na nasz Facebook"
bez dodatkowego przycisku (nic się nie psuje).

---

## Co trzeba zrobić (jednorazowo, ~15 min)

### 1. Poznaj ID swojej Strony
- Wejdź na swój fanpage → **Ustawienia** → **O stronie** (About) → na dole jest **Identyfikator strony (Page ID)**,
  np. `118117...`.
- Albo otwórz: `https://www.facebook.com/DomLatarnika/about_profile_transparency`.

### 2. Utwórz aplikację i wygeneruj token Strony
1. Wejdź na **https://developers.facebook.com/** → zaloguj się → **My Apps** → **Create App**
   → typ **Business** (lub „Inne").
2. W aplikacji dodaj produkt **Graph API Explorer** (menu Tools → Graph API Explorer),
   albo wejdź wprost: **https://developers.facebook.com/tools/explorer/**.
3. W Explorerze:
   - wybierz swoją aplikację (User or Page → **Get Page Access Token**),
   - zaznacz uprawnienia: **`pages_read_engagement`** oraz **`pages_read_user_content`**,
   - wybierz swoją Stronę i skopiuj **Page Access Token** (krótkoterminowy).
4. Zamień token na **długoterminowy (long‑lived, ~60 dni lub bezterminowy dla Strony)**:
   - Otwórz **Access Token Debugger**: https://developers.facebook.com/tools/debug/accesstoken/
   - Wklej token → **Debug** → **Extend Access Token** → skopiuj przedłużony token.
   - (Token Strony wygenerowany z długoterminowego tokenu użytkownika zwykle nie wygasa.)

> Uprawnienia do publicznych treści własnej Strony nie wymagają weryfikacji aplikacji
> (App Review), o ile używacie własnego tokenu Strony.

### 3. Wklej dane do Cloudflare Pages
W panelu Cloudflare → Twój projekt Pages → **Settings → Environment variables**
→ dodaj (dla **Production** i **Preview**):

| Nazwa | Wartość |
|---|---|
| `FB_PAGE_ID` | ID Twojej Strony (z kroku 1) |
| `FB_PAGE_TOKEN` | długoterminowy Page Access Token (z kroku 2) |

Opcjonalnie:
| `FB_EDGE` | `posts` (domyślnie), ewentualnie `feed` |
| `FB_LIMIT` | liczba postów, domyślnie `6` |

Zapisz i **zrób redeploy** (Deployments → Retry deployment), żeby zmienne weszły w życie.

### 4. Sprawdź
- Wejdź na `https://dom-latarnika.pl/api/fb-posts` — powinno zwrócić JSON z `"posts": [...]`.
- Odśwież stronę → w sekcji **Aktualności** po prawej pojawią się prawdziwe posty.

---

## Odświeżanie / cache
- Funkcja cache'uje wynik na **30 minut** (na krawędzi Cloudflare), żeby nie męczyć API i było szybko.
- Nowy post pojawi się na stronie w ciągu ~30 min (albo od razu po redeploy).

## Bezpieczeństwo
- Token jest **wyłącznie** w zmiennych środowiskowych Cloudflare (sekret), nigdy w repo ani w kodzie strony.
- Gdyby token wyciekł lub wygasł — wygeneruj nowy (krok 2) i podmień `FB_PAGE_TOKEN`.

## Gdy tokenu nie ma
- `/api/fb-posts` zwraca pustą listę, a strona pokazuje kafelek „Zajrzyj na nasz Facebook".
  Zero błędów, zero pustych miejsc.
