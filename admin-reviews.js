(function () {
  const ENDPOINT = "/.netlify/functions/reviews-admin";
  const TOKEN_KEY = "ccp_reviews_admin_token";

  const state = {
    token: localStorage.getItem(TOKEN_KEY) || "",
    reviews: [],
    counts: {},
    summary: {},
  };

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stars(rating) {
    const safe = Math.max(0, Math.min(5, Number(rating) || 0));
    return "★★★★★".slice(0, safe) + "☆☆☆☆☆".slice(0, 5 - safe);
  }

  function formatDate(value) {
    if (!value) return "Non publié";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date inconnue";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function setAdminStatus(message, tone = "neutral") {
    const node = $("[data-admin-status]");
    if (!node) return;
    node.hidden = false;
    node.textContent = message;
    node.dataset.tone = tone;
  }

  async function apiRequest(options = {}) {
    const res = await fetch(ENDPOINT, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${state.token}`,
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Action impossible pour le moment.");
    }
    return data;
  }

  function statusLabel(status) {
    if (status === "published") return "Publié";
    if (status === "hidden") return "Masqué";
    return "En attente";
  }

  function reviewActions(item) {
    const publish =
      item.status !== "published"
        ? `<button class="btn primary" type="button" data-review-action="publish" data-review-id="${escapeHtml(item.id)}">Publier</button>`
        : "";
    const hide =
      item.status === "published"
        ? `<button class="btn secondary" type="button" data-review-action="hide" data-review-id="${escapeHtml(item.id)}">Masquer</button>`
        : "";
    const pending =
      item.status === "hidden"
        ? `<button class="btn secondary" type="button" data-review-action="pending" data-review-id="${escapeHtml(item.id)}">Remettre en attente</button>`
        : "";
    const remove = `<button class="btn secondary" type="button" data-review-action="delete" data-review-id="${escapeHtml(item.id)}">Supprimer</button>`;
    return [publish, hide, pending, remove].filter(Boolean).join("");
  }

  function reviewCard(item) {
    return `
      <article class="admin-review-card" data-status="${escapeHtml(item.status)}">
        <div class="admin-review-head">
          <div>
            <span class="admin-review-status">${statusLabel(item.status)}</span>
            <h3>${escapeHtml(item.title || "Avis client")}</h3>
          </div>
          <div class="rating-stars" aria-label="Note ${item.rating} sur 5">${stars(item.rating)}</div>
        </div>
        <p>${escapeHtml(item.body)}</p>
        <div class="admin-review-meta">
          <span>${escapeHtml(item.author)} · ${escapeHtml(item.city)}</span>
          <span>${escapeHtml(item.cuvee)}</span>
          <span>${escapeHtml(item.email)}</span>
          <span>Reçu le ${escapeHtml(formatDate(item.createdAt))}</span>
          ${item.publishedAt ? `<span>Publié le ${escapeHtml(formatDate(item.publishedAt))}</span>` : ""}
        </div>
        <div class="admin-review-actions">
          ${reviewActions(item)}
        </div>
      </article>
    `;
  }

  function renderList(status, selector) {
    const root = $(selector);
    if (!root) return;
    const items = state.reviews.filter((item) => item.status === status);
    root.innerHTML = items.length
      ? items.map(reviewCard).join("")
      : `<div class="admin-empty">Aucun avis ${statusLabel(status).toLowerCase()}.</div>`;
  }

  function renderStats() {
    const root = $("[data-admin-stats]");
    if (!root) return;
    const summary = state.summary || {};
    const average =
      summary.average == null
        ? "—"
        : Number(summary.average).toFixed(1).replace(".", ",");
    root.innerHTML = `
      <div><span>En attente</span><strong>${state.counts.pending || 0}</strong></div>
      <div><span>Publiés</span><strong>${state.counts.published || 0}</strong></div>
      <div><span>Masqués</span><strong>${state.counts.hidden || 0}</strong></div>
      <div><span>Note publique</span><strong>${average}/5</strong></div>
    `;
  }

  function render() {
    renderStats();
    renderList("pending", "[data-admin-pending]");
    renderList("published", "[data-admin-published]");
    renderList("hidden", "[data-admin-hidden]");

    document.querySelectorAll("[data-review-action]").forEach((button) => {
      button.addEventListener("click", () => handleAction(button));
    });
  }

  async function loadReviews() {
    if (!state.token) {
      setAdminStatus(
        "Renseignez la clé d’administration pour charger les avis.",
      );
      return;
    }

    try {
      const data = await apiRequest();
      state.reviews = Array.isArray(data.reviews) ? data.reviews : [];
      state.counts = data.counts || {};
      state.summary = data.summary || {};
      render();
      setAdminStatus("Avis chargés.", "success");
    } catch (error) {
      setAdminStatus(error.message, "error");
    }
  }

  async function handleAction(button) {
    const action = button.dataset.reviewAction;
    const id = button.dataset.reviewId;
    if (action === "delete") {
      const ok = window.confirm("Supprimer définitivement cet avis ?");
      if (!ok) return;
    }

    button.disabled = true;
    try {
      await apiRequest({
        method: "POST",
        body: JSON.stringify({ action, id }),
      });
      await loadReviews();
      setAdminStatus("Action enregistrée.", "success");
    } catch (error) {
      setAdminStatus(error.message, "error");
    } finally {
      button.disabled = false;
    }
  }

  function initAdmin() {
    const form = $("[data-admin-login]");
    if (form) {
      const input = form.querySelector("[name='token']");
      if (input) input.value = state.token;
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        state.token = input.value.trim();
        localStorage.setItem(TOKEN_KEY, state.token);
        loadReviews();
      });
    }

    const refresh = $("[data-admin-refresh]");
    if (refresh) refresh.addEventListener("click", loadReviews);

    if (state.token) loadReviews();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdmin);
  } else {
    initAdmin();
  }
})();
