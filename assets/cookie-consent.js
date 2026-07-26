/**
 * Cookie Consent Manager - RODO/GDPR compliant
 * Obsługuje zgodę użytkownika na cookies analityczne i społecznościowe (np. tablica Facebooka).
 *
 * Jak dołączyć analitykę (np. Google Analytics) po starcie:
 *   1) uzupełnij loadAnalytics() swoim ID/skryptem,
 *   2) nic więcej — skrypt ładuje się wyłącznie po zgodzie użytkownika.
 */

const CookieConsent = {
  storageKey: 'domLatarnika_cookieConsent',

  init() {
    const existing = this.getConsent();
    if (existing === null) {
      this.show();
    } else {
      if (existing.analytics) this.loadAnalytics();
      if (existing.social) this.notifySocial();
    }
  },

  show() {
    const banner = document.getElementById('cookie-consent');
    if (banner) banner.removeAttribute('hidden');
  },

  hide() {
    const banner = document.getElementById('cookie-consent');
    if (banner) banner.setAttribute('hidden', '');
  },

  accept() {
    this.setConsent({
      necessary: true,
      analytics: true,
      social: true,
      timestamp: new Date().toISOString()
    });
    this.loadAnalytics();
    this.notifySocial();
    this.hide();
  },

  decline() {
    this.setConsent({
      necessary: true,
      analytics: false,
      social: false,
      timestamp: new Date().toISOString()
    });
    this.hide();
  },

  // Zgoda tylko na treści społecznościowe (np. gdy użytkownik kliknie „Pokaż tablicę")
  grantSocial() {
    const current = this.getConsent() || { necessary: true, analytics: false };
    current.social = true;
    current.timestamp = new Date().toISOString();
    this.setConsent(current);
    this.notifySocial();
    this.hide();
  },

  notifySocial() {
    window.dispatchEvent(new CustomEvent('dl:social-consent'));
  },

  setConsent(consent) {
    localStorage.setItem(this.storageKey, JSON.stringify(consent));
  },

  getConsent() {
    const stored = localStorage.getItem(this.storageKey);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  loadAnalytics() {
    // Miejsce na integrację analityki po wyrażeniu zgody.
    // Przykład (odkomentuj i wstaw własne ID):
    //
    // const gaId = 'G-XXXXXXXXXX';
    // if (!window.gtag) {
    //   const s = document.createElement('script');
    //   s.async = true;
    //   s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    //   document.head.appendChild(s);
    //   window.dataLayer = window.dataLayer || [];
    //   window.gtag = function () { window.dataLayer.push(arguments); };
    //   window.gtag('js', new Date());
    //   window.gtag('config', gaId, { anonymize_ip: true, allow_ad_personalization_signals: false });
    // }
  },

  hasConsent(type) {
    const consent = this.getConsent();
    return Boolean(consent && consent[type] === true);
  },

  reset() {
    localStorage.removeItem(this.storageKey);
    this.show();
  }
};

// Udostępnij globalnie (używane przez tablicę Facebooka w index.js)
window.CookieConsent = CookieConsent;

function initCookieConsent() {
  CookieConsent.init();
  const acceptBtn = document.getElementById('cookie-accept');
  const declineBtn = document.getElementById('cookie-decline');
  if (acceptBtn) acceptBtn.addEventListener('click', () => CookieConsent.accept());
  if (declineBtn) declineBtn.addEventListener('click', () => CookieConsent.decline());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCookieConsent);
} else {
  initCookieConsent();
}
