(function () {
  const SOURCE = "/data/reviews.json";

  function formatDateFR(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
    }).format(date);
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

  function normalizeReview(item) {
    return {
      id: item.id || "",
      author: item.author || "Client de la maison",
      city: item.city || "",
      title: item.title || "Retour de dégustation",
      body: item.body || "",
      rating: Math.max(1, Math.min(5, Number(item.rating) || 5)),
      cuvee: item.cuvee || "",
      context: item.context || "",
      date: item.date || "",
      featured: Boolean(item.featured),
      published: item.published !== false,
    };
  }

  function readContainerConfig(node) {
    return {
      limit: Math.max(1, Number(node.getAttribute("data-reviews-limit")) || 3),
      featuredOnly: node.getAttribute("data-reviews-featured") === "true",
      cuvee: (node.getAttribute("data-reviews-cuvee") || "")
        .trim()
        .toLowerCase(),
      summary: node.getAttribute("data-reviews-summary") === "true",
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

  function filterReviews(all, config) {
    let items = all.filter((item) => item.published);

    if (config.featuredOnly) {
      items = items.filter((item) => item.featured);
    }

    if (config.cuvee) {
      items = items.filter((item) => item.cuvee.toLowerCase() === config.cuvee);
    }

    items.sort((a, b) => {
      const da = new Date(a.date || "1970-01-01").getTime();
      const db = new Date(b.date || "1970-01-01").getTime();
      return db - da;
    });

    return items.slice(0, config.limit);
  }

  function summaryBlock(all) {
    const published = all
      .filter((item) => item.published)
      .sort(
        (a, b) =>
          new Date(b.date || "1970-01-01").getTime() -
          new Date(a.date || "1970-01-01").getTime(),
      );
    const count = published.length;
    const average = count
      ? (published.reduce((sum, item) => sum + item.rating, 0) / count).toFixed(
          1,
        )
      : null;

    const byCuvee = {};
    published.forEach((item) => {
      if (!item.cuvee) return;
      byCuvee[item.cuvee] = (byCuvee[item.cuvee] || 0) + 1;
    });

    const cuvees = Object.entries(byCuvee)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, total]) => `<span>${escapeHtml(name)} · ${total}</span>`)
      .join("");

    if (!count) {
      return `
        <div class="review-summary-card">
          <div class="review-summary-label">Avis publiés</div>
          <div class="review-summary-value">Aucun retour publié pour l’instant</div>
          <p>Les premiers retours relus apparaîtront ici.</p>
        </div>
      `;
    }

    return `
      <div class="review-summary-card">
        <div class="review-summary-label">Note moyenne</div>
        <div class="review-summary-value">${escapeHtml(average)} / 5</div>
        <p>${count} retour${count > 1 ? "s" : ""} publié${count > 1 ? "s" : ""}</p>
      </div>
      <div class="review-summary-card">
        <div class="review-summary-label">Dernière mise à jour</div>
        <div class="review-summary-value">${escapeHtml(formatDateFR(published[0].date))}</div>
        <p>Retours relus avant mise en ligne.</p>
      </div>
      <div class="review-summary-card">
        <div class="review-summary-label">Cuvées évoquées</div>
        <div class="review-summary-tags">${cuvees || "<span>Maison</span>"}</div>
        <p>Service, commande et dégustation.</p>
      </div>
    `;
  }

  function reviewCard(item) {
    const meta = [item.city, item.context, formatDateFR(item.date)]
      .filter(Boolean)
      .join(" · ");
    const cuvee = item.cuvee
      ? `<div class="review-cuvee">${escapeHtml(item.cuvee)}</div>`
      : "";

    return `
      <article class="card pad review-card">
        <div class="review-card-top">
          <div class="review-card-head">
            <strong>${escapeHtml(item.title)}</strong>
            ${cuvee}
          </div>
          <div class="rating-stars" aria-label="Note ${item.rating} sur 5">${stars(item.rating)}</div>
        </div>
        <p class="review-body">${escapeHtml(item.body)}</p>
        <div class="review-meta">
          <span>${escapeHtml(item.author)}</span>
          ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
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

  function renderContainer(node, allReviews) {
    const config = readContainerConfig(node);
    const items = filterReviews(allReviews, config);
    const showSummary = config.summary;
    const section = node.closest("[data-reviews-section]");

    if (!items.length && config.hideSectionWhenEmpty && section) {
      section.hidden = true;
      return;
    }

    if (section) section.hidden = false;

    const parts = [];
    if (showSummary) {
      parts.push(
        `<div class="review-summary-grid">${summaryBlock(allReviews)}</div>`,
      );
    }

    if (items.length) {
      parts.push(
        `<div class="review-grid">${items.map(reviewCard).join("")}</div>`,
      );
    } else {
      parts.push(emptyState(config));
    }

    node.innerHTML = parts.join("");
  }

  async function initReviews() {
    const containers = Array.from(
      document.querySelectorAll("[data-reviews-root]"),
    );
    if (!containers.length) return;

    try {
      const res = await fetch(SOURCE, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reviews = Array.isArray(data.reviews)
        ? data.reviews.map(normalizeReview)
        : [];
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
      console.error("Impossible de charger les avis publiés.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReviews);
  } else {
    initReviews();
  }
})();
