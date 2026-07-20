(function () {
  const ENDPOINT = "/.netlify/functions/reviews-public";
  const FALLBACK_SOURCE = "/data/reviews.json";
  const CUVEES = ["Brut Tradition", "Brut Rosé", "Demi-Sec"];

  function formatDateFR(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
    }).format(date);
  }

  function formatAverage(value) {
    if (value == null) return "";
    return Number(value).toFixed(1).replace(".", ",");
  }

  function stars(rating) {
    const safe = Math.max(0, Math.min(5, Number(rating) || 0));
    return "★★★★★".slice(0, safe) + "☆☆☆☆☆".slice(0, 5 - safe);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeCuvee(value) {
    const raw = String(value || "").trim();
    const key = raw.toLowerCase();
    if (["brut", "brut tradition", "brut-tradition"].includes(key)) {
      return "Brut Tradition";
    }
    if (["rose", "rosé", "brut rose", "brut rosé", "brut-rose"].includes(key)) {
      return "Brut Rosé";
    }
    if (["demisec", "demi sec", "demi-sec"].includes(key)) return "Demi-Sec";
    return raw;
  }

  function normalizeReview(item) {
    const status = item.status ? String(item.status) : "";
    return {
      id: item.id || "",
      author: item.author || "Client de la maison",
      city: item.city || "",
      title: item.title || "Retour de dégustation",
      body: item.body || "",
      rating: Math.max(1, Math.min(5, Number(item.rating) || 5)),
      cuvee: normalizeCuvee(item.cuvee),
      context: item.context || "",
      date: item.date || item.publishedAt || item.createdAt || "",
      featured: Boolean(item.featured),
      published: status ? status === "published" : item.published !== false,
      verifiedOrder: Boolean(item.verifiedOrder),
    };
  }

  function readContainerConfig(node) {
    return {
      limit: Math.max(1, Number(node.getAttribute("data-reviews-limit")) || 3),
      featuredOnly: node.getAttribute("data-reviews-featured") === "true",
      cuvee: normalizeCuvee(node.getAttribute("data-reviews-cuvee") || ""),
      summary: node.getAttribute("data-reviews-summary") === "true",
      filterable: node.getAttribute("data-reviews-filterable") === "true",
      hideSectionWhenEmpty:
        node.getAttribute("data-reviews-hide-section-when-empty") === "true",
      emptyMode: node.getAttribute("data-reviews-empty-mode") || "card",
      emptyTitle:
        node.getAttribute("data-reviews-empty-title") ||
        "Les premiers retours publiés apparaîtront ici.",
      emptyText:
        node.getAttribute("data-reviews-empty-text") ||
        "Partagez votre retour pour aider d’autres visiteurs à choisir la cuvée juste.",
    };
  }

  function publicReviews(all) {
    return all.filter((item) => item.published);
  }

  function sortReviews(items) {
    return [...items].sort((a, b) => {
      const da = new Date(a.date || "1970-01-01").getTime();
      const db = new Date(b.date || "1970-01-01").getTime();
      return db - da;
    });
  }

  function applyFilters(all, config, activeCuvee) {
    let items = publicReviews(all);
    const cuvee = activeCuvee || config.cuvee;

    if (config.featuredOnly) {
      items = items.filter((item) => item.featured);
    }

    if (cuvee) {
      items = items.filter((item) => item.cuvee === cuvee);
    }

    return sortReviews(items);
  }

  function computeSummary(items) {
    const count = items.length;
    if (!count) {
      return { count: 0, average: null, byCuvee: {} };
    }

    const total = items.reduce((sum, item) => sum + item.rating, 0);
    const byCuvee = {};
    items.forEach((item) => {
      if (!item.cuvee) return;
      byCuvee[item.cuvee] = byCuvee[item.cuvee] || {
        count: 0,
        total: 0,
      };
      byCuvee[item.cuvee].count += 1;
      byCuvee[item.cuvee].total += item.rating;
    });

    return {
      count,
      average: total / count,
      byCuvee: Object.fromEntries(
        Object.entries(byCuvee).map(([name, value]) => [
          name,
          {
            count: value.count,
            average: value.total / value.count,
          },
        ]),
      ),
    };
  }

  function summaryBlock(items, config, activeCuvee) {
    const summary = computeSummary(items);
    const label = activeCuvee || config.cuvee || "Avis clients";
    const title = activeCuvee || config.cuvee ? label : "Note globale";

    if (!summary.count) {
      return `
        <div class="review-summary-card review-summary-card--wide">
          <div class="review-summary-label">${escapeHtml(title)}</div>
          <div class="review-summary-value">Aucun avis publié</div>
          <p>Les premiers retours validés apparaîtront ici après modération.</p>
        </div>
      `;
    }

    const cuvees = Object.entries(summary.byCuvee)
      .sort((a, b) => b[1].count - a[1].count)
      .map(
        ([name, value]) =>
          `<span>${escapeHtml(name)} · ${value.count} · ${formatAverage(value.average)}/5</span>`,
      )
      .join("");

    return `
      <div class="review-summary-card review-summary-card--main">
        <div class="review-summary-label">${escapeHtml(title)}</div>
        <div class="review-score-line">
          <span class="rating-stars" aria-label="Note moyenne ${formatAverage(summary.average)} sur 5">${stars(Math.round(summary.average))}</span>
          <strong>${formatAverage(summary.average)}/5</strong>
        </div>
        <p>Basé sur ${summary.count} avis client${summary.count > 1 ? "s" : ""} publié${summary.count > 1 ? "s" : ""} après relecture.</p>
      </div>
      <div class="review-summary-card">
        <div class="review-summary-label">Avis publiés</div>
        <div class="review-summary-value">${summary.count}</div>
        <p>Les avis en attente ne sont jamais affichés.</p>
      </div>
      <div class="review-summary-card">
        <div class="review-summary-label">Par cuvée</div>
        <div class="review-summary-tags">${cuvees || "<span>Maison</span>"}</div>
        <p>Filtrez les retours selon la cuvée recherchée.</p>
      </div>
    `;
  }

  function reviewCard(item) {
    const meta = [item.city, formatDateFR(item.date)]
      .filter(Boolean)
      .join(" · ");
    const verified = item.verifiedOrder
      ? `<span class="review-verified">Commande vérifiée</span>`
      : "";

    return `
      <article class="card pad review-card">
        <div class="review-card-top">
          <div class="review-card-head">
            <strong>${escapeHtml(item.title)}</strong>
            <div class="review-cuvee">${escapeHtml(item.cuvee)}</div>
          </div>
          <div class="rating-stars" aria-label="Note ${item.rating} sur 5">${stars(item.rating)}</div>
        </div>
        <p class="review-body">${escapeHtml(item.body)}</p>
        <div class="review-meta">
          <span>${escapeHtml(item.author)}</span>
          ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
          ${verified}
        </div>
      </article>
    `;
  }

  function emptyState(config) {
    if (config.emptyMode === "inline") {
      return `
        <div class="review-inline-empty">
          <strong>Les retours publiés viennent d’abord du réel.</strong>
          <p>${escapeHtml(config.emptyText)}</p>
        </div>
      `;
    }

    return `
      <div class="card pad review-empty">
        <strong>${escapeHtml(config.emptyTitle)}</strong>
        <p>${escapeHtml(config.emptyText)}</p>
      </div>
    `;
  }

  function filterControls(activeCuvee) {
    const choices = ["", ...CUVEES];
    return `
      <div class="review-filter" aria-label="Filtrer les avis par cuvée">
        ${choices
          .map((name) => {
            const active = name === activeCuvee;
            return `<button class="review-filter-btn${active ? " is-active" : ""}" type="button" data-review-filter="${escapeHtml(name)}">${name ? escapeHtml(name) : "Tous les avis"}</button>`;
          })
          .join("")}
      </div>
    `;
  }

  function renderContainer(node, allReviews, activeCuvee = "") {
    const config = readContainerConfig(node);
    const items = applyFilters(allReviews, config, activeCuvee);
    const visibleItems = items.slice(0, config.limit);
    const section = node.closest("[data-reviews-section]");

    if (!items.length && config.hideSectionWhenEmpty && section) {
      section.hidden = true;
      return;
    }

    if (section) section.hidden = false;

    const parts = [];
    if (config.summary) {
      parts.push(
        `<div class="review-summary-grid">${summaryBlock(items, config, activeCuvee)}</div>`,
      );
    }

    if (config.filterable) {
      parts.push(filterControls(activeCuvee));
    }

    if (visibleItems.length) {
      parts.push(
        `<div class="review-grid">${visibleItems.map(reviewCard).join("")}</div>`,
      );
    } else {
      parts.push(emptyState(config));
    }

    node.innerHTML = parts.join("");

    node.querySelectorAll("[data-review-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        renderContainer(node, allReviews, button.dataset.reviewFilter || "");
      });
    });
  }

  async function fetchReviews() {
    const endpointRes = await fetch(ENDPOINT, {
      headers: { Accept: "application/json" },
    });

    if (endpointRes.ok) {
      const data = await endpointRes.json();
      return Array.isArray(data.reviews) ? data.reviews : [];
    }

    const fallbackRes = await fetch(FALLBACK_SOURCE, {
      headers: { Accept: "application/json" },
    });
    if (!fallbackRes.ok) throw new Error(`HTTP ${fallbackRes.status}`);
    const fallbackData = await fallbackRes.json();
    return Array.isArray(fallbackData.reviews) ? fallbackData.reviews : [];
  }

  async function initReviews() {
    const containers = Array.from(
      document.querySelectorAll("[data-reviews-root]"),
    );
    if (!containers.length) return;

    try {
      const reviews = (await fetchReviews()).map(normalizeReview);
      containers.forEach((node) => renderContainer(node, reviews));
      document.documentElement.classList.add("reviews-ready");
    } catch (error) {
      containers.forEach((node) => {
        const config = readContainerConfig(node);
        const section = node.closest("[data-reviews-section]");
        if (config.hideSectionWhenEmpty && section) {
          section.hidden = true;
          return;
        }
        node.innerHTML = emptyState(config);
      });
      console.debug("Avis publiés indisponibles.", error.message);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReviews);
  } else {
    initReviews();
  }
})();
