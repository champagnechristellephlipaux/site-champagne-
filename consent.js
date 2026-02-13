(function(){
  const AGE_KEY = "ccp_age_verified_v1";
  const COOKIE_KEY = "ccp_cookie_consent_v1"; // "accepted" | "refused"
  const MIN_AGE = 18;

  function el(tag, attrs, children){
    const n = document.createElement(tag);
    if(attrs){
      for(const [k,v] of Object.entries(attrs)){
        if(k === "class") n.className = v;
        else if(k === "html") n.innerHTML = v;
        else if(k.startsWith("on") && typeof v === "function") n.addEventListener(k.substring(2), v);
        else n.setAttribute(k, v);
      }
    }
    (children||[]).forEach(c => n.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return n;
  }

  function ensureAgeGate(){
    if (localStorage.getItem(AGE_KEY) === "true") return;

    const overlay = el("div", { id:"age-gate-overlay", class:"is-open", role:"dialog", "aria-modal":"true", "aria-label":"Vérification d’âge" }, [
      el("div", { class:"age-gate-card" }, [
        el("div", { class:"age-gate-inner" }, [
          el("h2", { class:"age-gate-title" }, [`Accès réservé aux personnes de ${MIN_AGE} ans et plus`]),
          el("p", { class:"age-gate-text" }, ["Ce site présente et vend des boissons alcoolisées. Confirmez-vous avoir 18 ans ou plus ?"]),
          el("div", { class:"age-gate-actions" }, [
            el("button", { type:"button", class:"btn primary", onclick: () => {
              try { localStorage.setItem(AGE_KEY, "true"); } catch(e){}
              overlay.classList.remove("is-open");
              overlay.style.display = "none";
            }}, ["Oui, j’ai 18+"]),
            el("button", { type:"button", class:"btn secondary", onclick: () => {
              // Soft block: keep overlay and offer exit
              overlay.querySelector(".age-gate-text").textContent = "Désolé, l’accès à ce site est réservé aux personnes majeures.";
              overlay.querySelector(".age-gate-actions").innerHTML = "";
              overlay.querySelector(".age-gate-actions").appendChild(
                el("a", { class:"btn primary", href:"https://www.google.com" }, ["Quitter le site"])
              );
            }}, ["Non"])
          ]),
          el("div", { class:"age-gate-small" }, [
            el("span", { html: 'L’abus d’alcool est dangereux pour la santé, à consommer avec modération. ' }),
            el("a", { href:"politique-confidentialite.html" }, ["En savoir plus"])
          ])
        ])
      ])
    ]);

    document.body.appendChild(overlay);
  }

  function ensureCookieBanner(){
    const v = localStorage.getItem(COOKIE_KEY);
    if (v === "accepted" || v === "refused") return;

    const banner = el("div", { id:"cookie-banner", class:"is-open", role:"region", "aria-label":"Préférences cookies" }, [
      el("div", { class:"cookie-card" }, [
        el("div", { class:"cookie-row" }, [
          el("div", { class:"cookie-text" }, [
            el("div", { class:"cookie-title" }, ["Cookies"]),
            el("p", { class:"cookie-desc", html: 'Nous utilisons des cookies strictement nécessaires au fonctionnement du site et, avec votre accord, des cookies de mesure d’audience pour améliorer votre expérience. <a href="politique-confidentialite.html">En savoir plus</a>.' })
          ]),
          el("div", { class:"cookie-actions" }, [
            el("button", { type:"button", class:"btn primary", onclick: () => {
              try { localStorage.setItem(COOKIE_KEY, "accepted"); } catch(e){}
              banner.classList.remove("is-open"); banner.style.display="none";
              if (typeof window.ccpEnableOptionalCookies === "function") window.ccpEnableOptionalCookies();
            }}, ["Accepter"]),
            el("button", { type:"button", class:"btn secondary", onclick: () => {
              try { localStorage.setItem(COOKIE_KEY, "refused"); } catch(e){}
              banner.classList.remove("is-open"); banner.style.display="none";
            }}, ["Refuser"])
          ])
        ])
      ])
    ]);

    document.body.appendChild(banner);
  }

  // Optional hook for future analytics (kept inert unless you add scripts inside)
  window.ccpEnableOptionalCookies = function(){
    // Example: load analytics only after consent.
    // const s=document.createElement('script'); s.src='https://www.googletagmanager.com/gtag/js?id=G-XXXX'; s.async=true; document.head.appendChild(s);
  };

  function init(){
    try { ensureAgeGate(); } catch(e){}
    try { ensureCookieBanner(); } catch(e){}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
