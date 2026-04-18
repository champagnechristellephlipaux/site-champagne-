(function () {
  document.documentElement.classList.add("reveal-ready");

  const SOCIAL_LINKS = [
    {
      label: "Instagram",
      href: "https://www.instagram.com/champagne.c.phlipaux/",
      aria: "Instagram Champagne Christelle Phlipaux",
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/Christelle.Phlipaux/",
      aria: "Facebook Champagne Christelle Phlipaux",
    },
  ];

  const NAV_ITEMS = [
    {
      href: "cuvees.html",
      label: "Les Cuvées",
      matches: [
        "cuvees.html",
        "brut-tradition.html",
        "brut-rose.html",
        "demi-sec.html",
      ],
      className: "nav-link--featured",
    },
    {
      href: "cadeaux.html",
      label: "Offrir",
      matches: ["cadeaux.html", "evenements.html"],
    },
    {
      href: "maison.html",
      label: "Maison",
      matches: [
        "maison.html",
        "terroir.html",
        "champagne-de-vigneron.html",
        "visites-degustations.html",
      ],
    },
  ];

  const HEADER_ACTIONS = [
    {
      href: "index.html#contact",
      label: "Contact",
      className: "nav-contact-link",
      disableActive: true,
    },
    {
      href: "boutique.html",
      label: "Commander",
      className: "btn primary nav-primary-cta",
      matches: ["boutique.html", "livraison-paiement.html", "merci.html"],
    },
  ];

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const saveData = Boolean(
    navigator.connection && navigator.connection.saveData,
  );

  function currentPageName() {
    const raw = window.location.pathname.split("/").pop();
    return raw && raw.length ? raw : "index.html";
  }

  function getNavParts() {
    const header = document.querySelector("header");
    if (!header) return null;

    const standardShell = header.querySelector(".container.nav");
    const standardMenu = standardShell?.querySelector(".menu");
    if (standardShell && standardMenu) {
      return { header, shell: standardShell, menu: standardMenu };
    }

    const compactShell = header.querySelector(".topbar-inner");
    const compactMenu = compactShell?.querySelector("nav");
    if (compactShell && compactMenu) {
      compactMenu.classList.add("menu");
      return { header, shell: compactShell, menu: compactMenu };
    }

    return null;
  }

  function buildMenuLink(item, extraClass = "") {
    const className = [item.className, extraClass].filter(Boolean).join(" ");
    const classes = className ? ` class="${className}"` : "";
    const attributes = [`href="${item.href}"`];
    if (Array.isArray(item.matches) && item.matches.length) {
      attributes.push(`data-active-match="${item.matches.join(",")}"`);
    }
    if (item.disableActive) attributes.push('data-disable-active="true"');
    return `<a${classes} ${attributes.join(" ")}>${item.label}</a>`;
  }

  function buildBrand() {
    return [
      '<a class="brand" href="index.html" aria-label="Accueil Champagne Christelle Phlipaux" data-disable-active="true">',
      '<picture><source srcset="assets/logo-trans.webp" type="image/webp"/><img alt="Logo Champagne Christelle Phlipaux" class="brand-logo" decoding="async" height="204" loading="lazy" src="assets/logo-trans.png" width="242"/></picture>',
      '<div class="brand-text">',
      '<div class="brand-title"><span class="brand-champagne">Champagne</span> <span class="brand-name">Christelle Phlipaux</span></div>',
      '<div class="brand-sub"><span>Maison de vigneron</span><span>Channes, Côte des Bar</span></div>',
      "</div>",
      "</a>",
    ].join("");
  }

  function buildCartAction() {
    return [
      '<button class="btn secondary nav-cart-link" type="button" data-cart-open aria-label="Ouvrir la sélection">',
      '<span class="nav-cart-label">Sélection</span>',
      '<span class="nav-cart-count" data-cart-count>0</span>',
      "</button>",
    ].join("");
  }

  function setupGlobalNav() {
    const parts = getNavParts();
    if (!parts) return;

    const { shell } = parts;
    const hasCart = Boolean(document.querySelector("#cartDrawer"));
    const links = NAV_ITEMS.map((item) => buildMenuLink(item)).join("");
    const actions = [
      buildMenuLink(HEADER_ACTIONS[0]),
      hasCart ? buildCartAction() : "",
      buildMenuLink(HEADER_ACTIONS[1]),
    ].join("");

    shell.classList.add("nav-shell");
    shell.innerHTML = [
      buildBrand(),
      '<div class="nav-panel" id="siteNavPanel">',
      `<nav aria-label="Navigation principale" class="menu">${links}</nav>`,
      `<div class="nav-actions${hasCart ? " nav-actions--has-cart" : ""}">${actions}</div>`,
      "</div>",
    ].join("");
  }

  function closeNav(button) {
    document.body.classList.remove("nav-open");
    if (button) {
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Ouvrir le menu");
    }
  }

  function setupSkipLink() {
    if (document.querySelector(".skip-link")) return;
    const target =
      document.querySelector("main") ||
      document.querySelector(".hero, .page-hero, .shop-hero, .section");
    if (!target) return;

    if (!target.id) target.id = "contenu";

    const skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = `#${target.id}`;
    skip.textContent = "Aller au contenu";
    document.body.insertBefore(skip, document.body.firstChild);
  }

  function setupHeaderState() {
    let ticking = false;

    const sync = () => {
      document.body.classList.toggle("is-scrolled", window.scrollY > 12);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function setupNav() {
    const parts = getNavParts();
    if (!parts) return;

    const { shell, menu } = parts;
    const panel = shell.querySelector(".nav-panel");
    let button = shell.querySelector(".nav-toggle");

    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "nav-toggle";
      button.setAttribute("aria-label", "Ouvrir le menu");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", "siteNavPanel");
      button.innerHTML =
        '<span class="nav-toggle-icon" aria-hidden="true"><span></span><span></span><span></span></span>';
      shell.insertBefore(button, panel || menu);
    }

    button.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.setAttribute(
        "aria-label",
        open ? "Fermer le menu" : "Ouvrir le menu",
      );
    });

    panel?.addEventListener("click", (event) => {
      if (event.target.closest("a, [data-cart-open]")) closeNav(button);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav(button);
    });

    document.addEventListener("click", (event) => {
      if (!document.body.classList.contains("nav-open")) return;
      if (shell.contains(event.target)) return;
      closeNav(button);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 920) closeNav(button);
    });
  }

  function setupCurrentLink() {
    const current = currentPageName();
    const navLinks = document.querySelectorAll("header a[href]");

    navLinks.forEach((link) => {
      if (link.hasAttribute("data-disable-active")) return;
      const activeMatch = (link.getAttribute("data-active-match") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const href = link.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;

      const target = href.split("#")[0].replace(/^\//, "") || "index.html";
      const isCurrent = activeMatch.length
        ? activeMatch.includes(current)
        : target === current ||
          (current === "index.html" &&
            (target === "" || target === "index.html"));

      if (isCurrent) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function setupInPageNav() {
    const links = Array.from(document.querySelectorAll('header a[href^="#"]'));
    if (!links.length) return;

    const pairs = links
      .map((link) => {
        const id = link.getAttribute("href").slice(1);
        const section = id ? document.getElementById(id) : null;
        return id && section ? { id, link, section } : null;
      })
      .filter(Boolean);

    if (!pairs.length) return;

    const setActive = (activeId) => {
      pairs.forEach(({ id, link }) => {
        const isActive = id === activeId;
        link.classList.toggle("active", isActive);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        setActive(visible.target.id);
      },
      {
        threshold: [0.2, 0.45, 0.7],
        rootMargin: "-24% 0px -52% 0px",
      },
    );

    pairs.forEach(({ section }) => observer.observe(section));
  }

  function setupFooter() {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const current = currentPageName();
    const compactPages = new Set([
      "mentions-legales.html",
      "cgv.html",
      "politique-confidentialite.html",
      "merci.html",
      "merci-contact.html",
      "merci-avis.html",
    ]);

    if (compactPages.has(current) && footer.querySelector(".footer-meta")) {
      ensureFooterReviewLink(footer);
      ensureFooterSocialLinks(footer);
      return;
    }

    footer.innerHTML = [
      '<div class="container footer-grid">',
      "<div>",
      '<a class="brand brand--compact" href="index.html">',
      '<picture><source srcset="assets/logo-trans.webp" type="image/webp"/><img alt="Logo Champagne Christelle Phlipaux" class="brand-logo" decoding="async" height="204" loading="lazy" src="assets/logo-trans.png" width="242"/></picture>',
      '<div class="brand-text">',
      '<div class="brand-title"><span class="brand-champagne">Champagne</span> <span class="brand-name">Christelle Phlipaux</span></div>',
      '<div class="brand-sub">Channes — Côte des Bar</div>',
      "</div>",
      "</a>",
      '<div class="small">Trois cuvées de vigneron, un vignoble à Channes, une cave et un conseil direct depuis la propriété.</div>',
      '<div class="footer-trust">',
      "<span>Channes, Côte des Bar</span>",
      "<span>3 cuvées de vigneron</span>",
      "<span>Vente directe</span>",
      "<span>Paiement sécurisé</span>",
      "</div>",
      "</div>",
      "<div>",
      '<div class="footer-heading">Explorer la maison</div>',
      '<div><a href="maison.html">La maison</a></div>',
      '<div><a href="terroir.html">Le terroir</a></div>',
      '<div><a href="cuvees.html">Nos Cuvées</a></div>',
      '<div><a href="champagne-de-vigneron.html">Champagne de vigneron</a></div>',
      "</div>",
      "<div>",
      '<div class="footer-heading">Commander & visiter</div>',
      '<div><a href="boutique.html">Boutique</a></div>',
      '<div><a href="livraison-paiement.html">Livraison & paiement</a></div>',
      '<div><a href="depositaires.html">Dépositaires</a></div>',
      '<div><a href="visites-degustations.html">Visiter la maison</a></div>',
      '<div><a href="avis-clients.html">Avis & retours</a></div>',
      '<div><a href="index.html#contact">Contact</a></div>',
      '<div><a href="mailto:champagne.christelle.phlipaux@gmail.com">champagne.christelle.phlipaux@gmail.com</a></div>',
      '<div><a href="tel:+33682203430">+33 6 82 20 34 30</a></div>',
      "<div>4 rue de Villiers, 10340 Channes</div>",
      '<div class="footer-social">',
      '<div class="footer-heading">Suivre</div>',
      '<div class="footer-social-links">',
      `<a class="social-link" href="${SOCIAL_LINKS[0].href}" target="_blank" rel="noopener noreferrer" aria-label="${SOCIAL_LINKS[0].aria}">${SOCIAL_LINKS[0].label}</a>`,
      `<a class="social-link" href="${SOCIAL_LINKS[1].href}" target="_blank" rel="noopener noreferrer" aria-label="${SOCIAL_LINKS[1].aria}">${SOCIAL_LINKS[1].label}</a>`,
      "</div>",
      "</div>",
      "</div>",
      "</div>",
      '<div class="container footer-meta">',
      '<div class="small footer-links"><a href="mentions-legales.html">Mentions légales</a> • <a href="cgv.html">CGV</a> • <a href="politique-confidentialite.html">Confidentialité</a></div>',
      '<div class="small footer-alcool">La vente d’alcool est interdite aux mineurs de moins de 18 ans. L’abus d’alcool est dangereux pour la santé, à consommer avec modération.</div>',
      "</div>",
    ].join("");

    ensureFooterReviewLink(footer);
    ensureFooterSocialLinks(footer);
  }

  function ensureFooterReviewLink(footer) {
    const scope = footer || document.querySelector("footer");
    if (!scope) return;
    if (scope.querySelector('a[href="avis-clients.html"]')) return;

    const headings = Array.from(scope.querySelectorAll(".footer-heading"));
    const targetHeading = headings.find((heading) => {
      const label = heading.textContent.trim().toLowerCase();
      return [
        "decouvrir",
        "découvrir",
        "explorer",
        "explorer la maison",
        "pages",
        "navigation",
        "infos utiles",
        "support",
        "commander & visiter",
      ].includes(label);
    });

    const column = targetHeading?.parentElement;
    if (!column) return;

    const item = document.createElement("div");
    item.innerHTML = '<a href="avis-clients.html">Avis & retours</a>';
    column.appendChild(item);
  }

  function ensureFooterSocialLinks(footer) {
    const scope = footer || document.querySelector("footer");
    if (!scope || scope.querySelector(".footer-social")) return;

    const headings = Array.from(scope.querySelectorAll(".footer-heading"));
    const targetHeading = headings.find((heading) => {
      const label = heading.textContent.trim().toLowerCase();
      return ["contact", "suivre"].includes(label);
    });

    const column =
      targetHeading?.parentElement ||
      scope.querySelector(".footer-grid > div:last-child");
    if (!column) return;

    const block = document.createElement("div");
    block.className = "footer-social";
    block.innerHTML = [
      '<div class="footer-heading">Suivre</div>',
      '<div class="footer-social-links">',
      ...SOCIAL_LINKS.map(
        (item) =>
          `<a class="social-link" href="${item.href}" target="_blank" rel="noopener noreferrer" aria-label="${item.aria}">${item.label}</a>`,
      ),
      "</div>",
    ].join("");

    column.appendChild(block);
  }

  function setupReveal() {
    const items = Array.from(
      document.querySelectorAll(".reveal, [data-reveal]"),
    );
    if (!items.length) return;

    if (
      prefersReduced ||
      saveData ||
      coarsePointer ||
      window.innerWidth < 820 ||
      !("IntersectionObserver" in window)
    ) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );

    const foldThreshold = window.innerHeight * 0.92;

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top <= foldThreshold) {
        item.classList.add("is-visible");
        return;
      }
      observer.observe(item);
    });
  }

  function setupSmoothAnchors() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;

      const id = link.getAttribute("href").slice(1);
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      window.setTimeout(() => {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        window.setTimeout(() => target.removeAttribute("tabindex"), 800);
      }, 420);
    });
  }

  function setupDetails() {
    document.querySelectorAll("details.more").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        const siblings =
          details.parentElement?.querySelectorAll("details.more[open]") || [];
        siblings.forEach((sibling) => {
          if (sibling !== details) sibling.open = false;
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupSkipLink();
    setupHeaderState();
    setupGlobalNav();
    setupNav();
    setupCurrentLink();
    setupInPageNav();
    setupFooter();
    setupReveal();
    setupSmoothAnchors();
    setupDetails();
  });
})();
