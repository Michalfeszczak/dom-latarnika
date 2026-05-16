# 🍪 Cookie Consent - RODO/GDPR Compliance

## 💡 Ważna uwaga — Brak zbierania danych bezpośrednio

**Dom Latarnika NIE zbiera danych gości** na swojej stronie. Wszystko obsługuje **Booking.com**:
- ❌ Brak formularza rezerwacji
- ❌ Brak emaila do kontaktu
- ❌ Brak rejestracji użytkowników
- ✅ Rezerwacje = bezpośrednio do Booking.com

**Jedyne dane zbierane:**
- Google Analytics (anonimowe IP, śledzenie ruchu)
- Cookies funkcyjne (wybór języka)

---

## Co zostało zrobione ✅

### 1. Cookie Consent Banner
- Piękny banner na dole strony
- Ukazuje się tylko raz (zapisuje się w localStorage)
- Użytkownik może: **Zaakceptuj** lub **Odrzuć**
- Link do Polityki Prywatności

### 2. Privacy Policy — Uproszczona
- Dokument: `privacy-policy.html`
- RODO-compliant (Art. 6, 15-21)
- **Jasno mówi że nie zbieracie danych**
- Opisuje tylko:
  - Google Analytics (anonimowe)
  - Booking.com obsługuje rezerwacje
  - Prawa użytkownika

### 3. Conditional Google Analytics
- GA **nie ładuje się** dopóki user nie zaakceptuje
- Jeśli user kliknie **Odrzuć** → Google Analytics nie będzie działać
- Jeśli user kliknie **Zaakceptuj** → GA się załaduje

### 4. localStorage Cookie Storage
- Decyzja użytkownika zapisywana w `localStorage`
- Klucz: `domLatarnika_cookieConsent`
- Format:
  ```json
  {
    "necessary": true,
    "analytics": false,
    "timestamp": "2026-05-16T12:30:00Z"
  }
  ```

---

## ⚙️ Setup Instructions

### Krok 1: Ustaw Google Analytics ID

W pliku `assets/cookie-consent.js` znajdź linię:
```javascript
const gaId = 'G-XXXXXXXXXX'; // Replace with your GA ID
```

Zamień `G-XXXXXXXXXX` na Twój **Measurement ID** z Google Analytics.

**Jak znaleźć Twój GA ID:**
1. Idź do https://analytics.google.com
2. Property Settings → Tracking info → Tracking code
3. Skopiuj **Measurement ID** (format: `G-XXXXX`)

### Krok 2: Ustaw domenę w Privacy Policy

W `privacy-policy.html` zmień:
- **Email:** kontakt@dom-latarnika.pl → Twój email
- **Telefon:** +48 607 354 555 → Twój telefon
- **Adres:** ul. Nadmorska 65A, 78-132 Grzybowo → Twój adres

### Krok 3: Testuj

1. Otwórz stronę w **nowej karcie incognito**
2. Powinna pojawić się banner na dole
3. Kliknij **Zaakceptuj** → localStorage powinien mieć wpis
4. Otwórz nową kartę incognito → banner nie powinien być widoczny
5. Jeśli jest ustawiony GA ID, sprawdź w DevTools (F12 → Network) czy ładuje się:
   - `https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`

---

## 🔍 Jak to działa?

### localStorage Key
```
Key: domLatarnika_cookieConsent
Value: {"necessary":true,"analytics":true,"timestamp":"..."}
```

### Cookie Banner Visibility
- **Pierwszy raz:** Banner pokazuje się zawsze
- **Następne wizyty:** Banner ukryty (user już wybrał)
- **User może resetować:** Manualnie wyczyścić localStorage w DevTools

### Google Analytics Loading
```javascript
// Wywoływane tylko gdy user zaakceptuje cookies
CookieConsent.loadAnalytics();

// Ładuje:
// <script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
// gtag('config', 'G-XXXXXXXXXX', { anonymize_ip: true })
```

---

## 📋 Files Created

- ✅ `assets/cookie-consent.css` — Styl bannera
- ✅ `assets/cookie-consent.js` — Logika consent & GA loading
- ✅ `privacy-policy.html` — Polityka Prywatności
- ✅ `COOKIES-SETUP.md` — Ten plik

### Modified Files
- ✅ `index.html` — Cookie banner + CSS/JS links
- ✅ `regulamin.html` — Cookie banner + CSS/JS links
- ✅ Footer — Dodany link do Privacy Policy

---

## 🛡️ RODO Compliance Checklist

- ✅ **Art. 6(1)(a)** — Zgoda na przetwarzanie (cookie banner)
- ✅ **Art. 13-14** — Informacje o przetwarzaniu (Privacy Policy)
- ✅ **Art. 15-21** — Prawa użytkownika (dostęp, usunięcie, etc.)
- ✅ **Art. 25** — Domyślnie prywatne (GA nie ładuje się bez zgody)
- ✅ **Art. 32** — Bezpieczeństwo (SSL/TLS, anonimizacja IP)

---

## 🔧 Zaawansowane Ustawienia

### Customizacja wiadomości bannera

W `index.html` i `regulamin.html`, zmień tekst w:
```html
<p class="cookie-consent-text">
  Używamy cookies do analizy ruchu i poprawy doświadczenia.
  <a href="/privacy-policy.html">Polityka Prywatności</a>
</p>
```

### Wycofanie zgody

User może wycofać zgodę przez wyczyszczenie localStorage:
- DevTools (F12) → Application → LocalStorage → domLatarnika_cookieConsent → Delete

Albo dodać przycisk na stronie:
```html
<button onclick="CookieConsent.reset()">Zmień ustawienia cookies</button>
```

---

## 📊 Monitorowanie Konsentu

Możesz sprawdzić ile użytkowników zaakceptowało cookies poprzez:

```javascript
// W DevTools Console:
JSON.parse(localStorage.getItem('domLatarnika_cookieConsent'))
// Output: { necessary: true, analytics: true, timestamp: "..." }
```

Ale **lepiej jest monitorować w Google Analytics** — tam będziesz mieć statystyki.

---

## ⚖️ Prawne Zastrzeżenia

1. **RODO dotyczy również cookies** — Nie możesz ładować Google Analytics bez zgody
2. **Polityka Prywatności musi być linkowana** — W naszym bannerze jest ✓
3. **User może wycofać zgodę** — localStorage zapisuje decyzję ✓
4. **Musisz mieć kontakt** — Email/tel dla pytań o dane (w Privacy Policy) ✓

---

## 🚀 Deployment

Wszystko jest gotowe do wdrożenia na Vercel. Po deployment:

1. ✅ Banner pojawi się na dole strony
2. ✅ Google Analytics nie będzie ładować się bez zgody
3. ✅ Privacy Policy będzie dostępna
4. ✅ Strona będzie RODO-compliant

**Gotów do wdrożenia!** 🚀
