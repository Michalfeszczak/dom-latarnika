# Facebook — aktualności na stronie (Graph API)

Strona pokazuje najnowsze posty z Waszego fanpage jako **własne kafelki** —
niezawodnie, bez wtyczki FB i bez zależności od ciasteczek w przeglądarce gościa.

Posty pobiera Worker **`worker/index.js`** przez endpoint `/api/fb-posts`.
Wspólny handler jest w **`worker/fb-posts.js`**, a `functions/api/fb-posts.js`
zostaje jako kompatybilny wrapper dla trybu Pages Functions. Token trzymany jest
jako **sekret** po stronie Cloudflare — nigdy w kodzie strony.

Dopóki nie ustawisz tokenu, sekcja pokazuje spokojny kafelek „Zajrzyj na nasz Facebook"
bez dodatkowego przycisku (nic się nie psuje).

---

## Co trzeba zrobić (jednorazowo, ~15 min)

### 1. Poznaj ID swojej Strony
- Fanpage → **Ustawienia** → **O stronie** → na dole **Identyfikator strony (Page ID)**, np. `118117...`.

### 2. Utwórz aplikację i wygeneruj token Strony
1. **https://developers.facebook.com/** → **My Apps** → **Create App** (typ Business).
2. Otwórz **Graph API Explorer**: https://developers.facebook.com/tools/explorer/
3. Wybierz aplikację → **Get Page Access Token**, zaznacz uprawnienia
   **`pages_read_engagement`** i **`pages_read_user_content`**, wybierz Stronę, skopiuj token.
4. Zamień na **długoterminowy** w **Access Token Debugger**
   (https://developers.facebook.com/tools/debug/accesstoken/) → **Extend Access Token**.

### 3. Wklej dane w Cloudflare
Projekt `dom-latarnika` → **Settings → Variables and Secrets**:

| Nazwa | Wartość |
|---|---|
| `FB_PAGE_ID` | ID Strony (krok 1) |
| `FB_PAGE_TOKEN` | długoterminowy Page Access Token (krok 2) |

Opcjonalnie: `FB_EDGE` (`posts`/`feed`), `FB_LIMIT` (domyślnie `6`). Zapisz i zrób **redeploy**.

Nie dodawaj D1, KV, R2 ani innych Bindings — to są tylko zmienne/sekrety tekstowe.

### 4. Sprawdź
- `https://dom-latarnika.pl/api/fb-posts` → JSON z `"posts": [...]`.
- Odśwież stronę → w sekcji **Aktualności** po prawej pojawią się prawdziwe posty.

---

## Cache i odświeżanie
- Funkcja cache'uje wynik na **30 minut** (krawędź Cloudflare). Nowy post pojawi się w ~30 min (lub od razu po redeploy).

## Bezpieczeństwo i prywatność
- Token wyłącznie w zmiennych środowiskowych Cloudflare (sekret).
- Miniatury postów ładują się z serwerów Facebooka (fbcdn) — przy wyświetlaniu adres IP gościa trafia do Facebooka.
  Jeśli chcesz to wyeliminować, można dodatkowo proxyować obrazki przez tę samą funkcję (do ustalenia).

## Gdy tokenu nie ma
- `/api/fb-posts` zwraca pustą listę, a strona pokazuje spokojny kafelek „Zajrzyj na nasz Facebook" bez dodatkowego przycisku.
