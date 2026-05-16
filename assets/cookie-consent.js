/**
 * Cookie Consent Manager - RODO/GDPR compliant
 * Manages user consent for cookies and analytics
 */

const CookieConsent = {
  storageKey: 'domLatarnika_cookieConsent',

  init() {
    // Check if user already made a choice
    const existing = this.getConsent();
    if (existing === null) {
      this.show();
    } else if (existing.analytics) {
      this.loadAnalytics();
    }
  },

  show() {
    const banner = document.getElementById('cookie-consent');
    if (banner) {
      banner.removeAttribute('hidden');
    }
  },

  hide() {
    const banner = document.getElementById('cookie-consent');
    if (banner) {
      banner.setAttribute('hidden', '');
    }
  },

  accept() {
    this.setConsent({
      necessary: true,
      analytics: true,
      timestamp: new Date().toISOString()
    });
    this.loadAnalytics();
    this.hide();
  },

  decline() {
    this.setConsent({
      necessary: true,
      analytics: false,
      timestamp: new Date().toISOString()
    });
    this.hide();
  },

  setConsent(consent) {
    localStorage.setItem(this.storageKey, JSON.stringify(consent));
  },

  getConsent() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : null;
  },

  loadAnalytics() {
    // Load Google Analytics only if user consented
    const consent = this.getConsent();
    if (consent && consent.analytics) {
      const gaId = 'G-XXXXXXXXXX'; // Replace with your GA ID

      // Only load if GA hasn't been loaded yet
      if (!window.gtag) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', gaId, {
          'anonymize_ip': true,
          'allow_ad_personalization': false
        });
      }
    }
  },

  // Helper: Check if user agreed to specific cookie type
  hasConsent(type) {
    const consent = this.getConsent();
    return consent && consent[type] === true;
  },

  // Helper: Reset consent (for testing/settings)
  reset() {
    localStorage.removeItem(this.storageKey);
    this.show();
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CookieConsent.init());
} else {
  CookieConsent.init();
}

// Hook up button events
document.addEventListener('DOMContentLoaded', () => {
  const acceptBtn = document.getElementById('cookie-accept');
  const declineBtn = document.getElementById('cookie-decline');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => CookieConsent.accept());
  }

  if (declineBtn) {
    declineBtn.addEventListener('click', () => CookieConsent.decline());
  }
});
