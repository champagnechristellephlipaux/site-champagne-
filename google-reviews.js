(function () {
  const ENDPOINT = "/.netlify/functions/google-reviews";
  const roots = Array.from(document.querySelectorAll("[data-google-reviews]"));

  if (!roots.length) return;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function formatRating(value) {
    return Number(value).toFixed(1).replace(".", ",");
  }

  function formatVisitDate(value) {
    if (!value?.year || !value?.month) return "";
    const date = new Date(Date.UTC(value.year, value.month - 1, 1));
    return `Visite en ${new Intl.DateTimeFormat("fr-FR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date)}`;
  }

  function stars(rating) {
    const safe = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    const node = element("span", "google-review-stars");
    node.textContent = `${"★".repeat(safe)}${"☆".repeat(5 - safe)}`;
    node.setAttribute("aria-label", `Note ${safe} sur 5`);
    return node;
  }

  function externalLink(url, className, text) {
    const link = element("a", className, text);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  function authorBlock(review) {
    const author = element("div", "google-review-author");

    if (review.author?.photoUrl) {
      const photo = document.createElement("img");
      photo.className = "google-review-avatar";
      photo.src = review.author.photoUrl;
      photo.alt = "";
      photo.width = 44;
      photo.height = 44;
      photo.loading = "lazy";
      photo.decoding = "async";
      photo.referrerPolicy = "no-referrer";
      photo.addEventListener("error", () => photo.remove());
      author.append(photo);
    }

    const identity = element("div", "google-review-identity");
    const name = review.author?.name || "Utilisateur Google";
    if (review.author?.profileUrl) {
      identity.append(externalLink(review.author.profileUrl, "", name));
    } else {
      identity.append(element("strong", "", name));
    }

    const visit = formatVisitDate(review.visitDate);
    const date = visit || review.relativeTime || "";
    if (date) identity.append(element("span", "", date));
    author.append(identity);
    return author;
  }

  function reviewCard(review, fallbackMapsUrl) {
    const card = element("article", "google-review-card");
    const head = element("div", "google-review-card-head");
    head.append(authorBlock(review), stars(review.rating));
    card.append(head);

    if (review.text) {
      card.append(element("p", "google-review-text", review.text));
    }

    if (review.translated) {
      card.append(
        element(
          "p",
          "google-review-translation",
          "Avis traduit par Google Maps.",
        ),
      );
    }

    const sourceUrl = review.googleMapsUrl || fallbackMapsUrl;
    card.append(
      externalLink(sourceUrl, "google-review-source", "Voir l’avis original"),
    );
    return card;
  }

  function renderSummary(root, place) {
    const summary = root
      .closest(".shop-google-reviews-section")
      ?.querySelector("[data-google-reviews-summary]");
    if (!summary || !place?.rating || !place?.reviewCount) return;

    summary.replaceChildren();
    const score = element("strong", "", `${formatRating(place.rating)}/5`);
    const count = element("span", "", `${place.reviewCount} avis Google`);
    summary.append(stars(place.rating), score, count);
    summary.hidden = false;
  }

  function renderReviews(root, payload) {
    const limit = Math.max(
      1,
      Math.min(3, Number(root.getAttribute("data-google-reviews-limit")) || 3),
    );
    const reviews = Array.isArray(payload.reviews)
      ? payload.reviews.slice(0, limit)
      : [];

    if (!payload.available || !reviews.length) {
      root.setAttribute("aria-busy", "false");
      return;
    }

    const mapsUrl = payload.place?.googleMapsUrl || payload.googleMapsUrl;
    const grid = element("div", "google-reviews-grid");
    reviews.forEach((review) => grid.append(reviewCard(review, mapsUrl)));

    const footer = element("div", "google-reviews-footer");
    const attribution = element(
      "span",
      "google-maps-attribution",
      "Google Maps",
    );
    attribution.setAttribute("translate", "no");
    footer.append(
      attribution,
      externalLink(mapsUrl, "btn secondary", "Voir tous les avis sur Google"),
    );

    root.replaceChildren(grid, footer);
    root.setAttribute("aria-busy", "false");
    renderSummary(root, payload.place);

    const disclosure = root
      .closest(".shop-google-reviews-section")
      ?.querySelector("[data-google-reviews-disclosure]");
    if (disclosure) disclosure.hidden = false;

    const status = root
      .closest(".shop-google-reviews-section")
      ?.querySelector("[data-google-reviews-status]");
    if (status) status.textContent = `${reviews.length} avis Google chargés.`;
  }

  async function load(root) {
    if (root.dataset.googleReviewsLoaded === "true") return;
    root.dataset.googleReviewsLoaded = "true";
    root.setAttribute("aria-busy", "true");

    try {
      const response = await fetch(ENDPOINT, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Avis Google indisponibles.");
      const payload = await response.json();

      const fallbackLink = root.querySelector("[data-google-reviews-link]");
      const mapsUrl = payload.place?.googleMapsUrl || payload.googleMapsUrl;
      if (fallbackLink && mapsUrl) {
        fallbackLink.href = mapsUrl;
      }
      renderReviews(root, payload);
    } catch (_error) {
      root.setAttribute("aria-busy", "false");
    }
  }

  if (!("IntersectionObserver" in window)) {
    roots.forEach(load);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        load(entry.target);
      });
    },
    { rootMargin: "240px 0px" },
  );

  roots.forEach((root) => observer.observe(root));
})();
