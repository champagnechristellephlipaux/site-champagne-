(function () {
  const AGE_KEY = "ccp_age_verified_v1";
  const COOKIE_KEY = "ccp_cookie_consent_v1"; // "accepted" | "refused"
  const MIN_AGE = 18;
  const OPTIONAL_COOKIES_ENABLED = true;
  const ANALYTICS_DOMAIN = "www.champagne-christelle-phlipaux.com";
  const ANALYTICS_SCRIPT_ID = "ccp-plausible-analytics";
  const ANALYTICS_SRC = "https://plausible.io/js/script.js";

  function storageValue(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function setStorageValue(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* Ignore storage failures and keep the page usable. */
    }
  }

  function ageIsVerified() {
    return storageValue(AGE_KEY) === "true";
  }

  function analyticsAccepted() {
    return storageValue(COOKIE_KEY) === "accepted";
  }

  function analyticsProps(props) {
    return Object.fromEntries(
      Object.entries(props || {})
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value).slice(0, 120)]),
    );
  }

  function loadAnalytics() {
    if (!OPTIONAL_COOKIES_ENABLED || !analyticsAccepted()) return;
    if (document.getElementById(ANALYTICS_SCRIPT_ID)) return;

    window.plausible =
      window.plausible ||
      function () {
        (window.plausible.q = window.plausible.q || []).push(arguments);
      };

    const script = document.createElement("script");
    script.id = ANALYTICS_SCRIPT_ID;
    script.defer = true;
    script.src = ANALYTICS_SRC;
    script.setAttribute("data-domain", ANALYTICS_DOMAIN);
    document.head.appendChild(script);
  }

  function trackAnalytics(name, props) {
    if (!analyticsAccepted()) return;
    loadAnalytics();
    if (typeof window.plausible !== "function") return;
    window.plausible(name, { props: analyticsProps(props) });
  }

  window.ccpTrack = trackAnalytics;

  function focusableElements(scope) {
    return Array.from(
      scope.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((node) => !node.hidden && node.offsetParent !== null);
  }

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") n.className = v;
        else if (k === "html") n.innerHTML = v;
        else if (k.startsWith("on") && typeof v === "function")
          n.addEventListener(k.substring(2), v);
        else n.setAttribute(k, v);
      }
    }
    (children || []).forEach((c) =>
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c),
    );
    return n;
  }

  function ensureAgeGate() {
    if (ageIsVerified()) return true;

    const previouslyFocused = document.activeElement;
    const overlay = el(
      "div",
      {
        id: "age-gate-overlay",
        class: "is-open",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Vérification d’âge",
      },
      [
        el("div", { class: "age-gate-card" }, [
          el("div", { class: "age-gate-inner" }, [
            el("h2", { class: "age-gate-title" }, [
              `Accès réservé aux personnes de ${MIN_AGE} ans et plus`,
            ]),
            el("p", { class: "age-gate-text" }, [
              "Ce site présente et vend des boissons alcoolisées. Confirmez-vous avoir 18 ans ou plus ?",
            ]),
            el("div", { class: "age-gate-actions" }, [
              el(
                "button",
                {
                  type: "button",
                  class: "btn primary",
                  onclick: () => {
                    setStorageValue(AGE_KEY, "true");
                    overlay.classList.remove("is-open");
                    overlay.style.display = "none";
                    document.removeEventListener("keydown", keepFocusInGate);
                    window.dispatchEvent(new CustomEvent("ccp:age-verified"));
                    ensureCookieBanner();
                    if (previouslyFocused instanceof HTMLElement) {
                      previouslyFocused.focus();
                    }
                  },
                },
                ["Oui, j’ai 18+"],
              ),
              el(
                "button",
                {
                  type: "button",
                  class: "btn secondary",
                  onclick: () => {
                    // Soft block: keep overlay and offer exit
                    overlay.querySelector(".age-gate-text").textContent =
                      "Désolé, l’accès à ce site est réservé aux personnes majeures.";
                    overlay.querySelector(".age-gate-actions").innerHTML = "";
                    overlay.querySelector(".age-gate-actions").appendChild(
                      el(
                        "a",
                        {
                          class: "btn primary",
                          href: "https://www.google.com",
                        },
                        ["Quitter le site"],
                      ),
                    );
                    overlay.querySelector(".age-gate-actions a")?.focus();
                  },
                },
                ["Non"],
              ),
            ]),
            el("div", { class: "age-gate-small" }, [
              el("span", {
                html: "L’abus d’alcool est dangereux pour la santé, à consommer avec modération. ",
              }),
              el("a", { href: "politique-confidentialite.html" }, [
                "Lire la confidentialité",
              ]),
            ]),
          ]),
        ]),
      ],
    );

    document.body.appendChild(overlay);

    function keepFocusInGate(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = focusableElements(overlay);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", keepFocusInGate);
    window.setTimeout(() => focusableElements(overlay)[0]?.focus(), 0);
    return false;
  }

  function ensureCookieBanner() {
    if (!OPTIONAL_COOKIES_ENABLED) return;
    if (!ageIsVerified()) return;
    if (document.getElementById("cookie-banner")) return;

    const v = storageValue(COOKIE_KEY);
    if (v === "accepted") {
      loadAnalytics();
      return;
    }
    if (v === "refused") return;

    const banner = el(
      "div",
      {
        id: "cookie-banner",
        class: "is-open",
        role: "region",
        "aria-label": "Préférences cookies",
      },
      [
        el("div", { class: "cookie-card" }, [
          el("div", { class: "cookie-row" }, [
            el("div", { class: "cookie-text" }, [
              el("div", { class: "cookie-title" }, ["Cookies"]),
              el("p", {
                class: "cookie-desc",
                html: 'Nous utilisons des cookies strictement nécessaires au fonctionnement du site et, avec votre accord, des cookies de mesure d’audience pour améliorer votre expérience. <a href="politique-confidentialite.html">Lire la confidentialité</a>.',
              }),
            ]),
            el("div", { class: "cookie-actions" }, [
              el(
                "button",
                {
                  type: "button",
                  class: "btn primary",
                  onclick: () => {
                    setStorageValue(COOKIE_KEY, "accepted");
                    banner.classList.remove("is-open");
                    banner.style.display = "none";
                    if (typeof window.ccpEnableOptionalCookies === "function")
                      window.ccpEnableOptionalCookies();
                  },
                },
                ["Accepter"],
              ),
              el(
                "button",
                {
                  type: "button",
                  class: "btn secondary",
                  onclick: () => {
                    setStorageValue(COOKIE_KEY, "refused");
                    banner.classList.remove("is-open");
                    banner.style.display = "none";
                  },
                },
                ["Refuser"],
              ),
            ]),
          ]),
        ]),
      ],
    );

    document.body.appendChild(banner);
  }

  window.ccpEnableOptionalCookies = function () {
    loadAnalytics();
    trackAnalytics("cookie_consent", { choice: "accepted" });
  };

  function bindAnalyticsSignals() {
    if (window.__ccpAnalyticsSignalsBound) return;
    window.__ccpAnalyticsSignalsBound = true;

    document.addEventListener("click", (event) => {
      const link = event.target?.closest?.("a[href]");
      const href = link?.getAttribute("href") || "";
      if (href.startsWith("tel:") || href.startsWith("mailto:")) {
        trackAnalytics("contact_click", {
          type: href.startsWith("tel:") ? "phone" : "email",
          page: location.pathname,
        });
      }
    });

    window.addEventListener("cart:offer-added", (event) => {
      trackAnalytics("add_offer_to_cart", {
        offer: event?.detail?.offerId,
        page: location.pathname,
      });
    });

    window.addEventListener("checkout:issue", () => {
      trackAnalytics("checkout_issue", { page: location.pathname });
    });
  }

  function init() {
    bindAnalyticsSignals();
    try {
      ensureAgeGate();
    } catch (e) {
      /* Keep the rest of the page accessible if the gate fails. */
    }
    try {
      if (ageIsVerified()) ensureCookieBanner();
      else
        window.addEventListener("ccp:age-verified", ensureCookieBanner, {
          once: true,
        });
    } catch (e) {
      /* Keep the rest of the page accessible if the banner fails. */
    }
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
