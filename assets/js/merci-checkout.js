import { clearCart, formatEuro } from "../../cart.js?v=20260630b";

const STATUS_ENDPOINT = "/.netlify/functions/get-checkout-session";

const $ = (selector, root = document) => root.querySelector(selector);

function setText(selector, value) {
  const node = $(selector);
  if (node) node.textContent = value;
}

function show(node) {
  if (node) node.hidden = false;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAmount(amount, currency) {
  if (!Number.isFinite(amount)) return "";
  if (currency === "eur") return formatEuro(amount / 100);
  return `${(amount / 100).toFixed(2)} ${String(currency || "").toUpperCase()}`;
}

async function fetchSession(sessionId) {
  const response = await fetch(
    `${STATUS_ENDPOINT}?session_id=${encodeURIComponent(sessionId)}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.error || "La commande n’a pas pu être vérifiée pour le moment.",
    );
  }
  return data;
}

function renderSummary(session) {
  const root = $("[data-order-summary]");
  if (!root) return;

  const amount = formatAmount(session.amount_total, session.currency);
  const reference = session.order_reference || session.id;
  root.innerHTML = `
    <div><span>Référence</span><strong>${escapeHtml(reference)}</strong></div>
    ${amount ? `<div><span>Montant réglé</span><strong>${escapeHtml(amount)}</strong></div>` : ""}
    ${
      session.customer?.email
        ? `<div><span>Email</span><strong>${escapeHtml(session.customer.email)}</strong></div>`
        : ""
    }
  `;
  show(root);
}

function renderComplete(session) {
  clearCart();
  setText("[data-merci-kicker]", "Paiement confirmé");
  setText("[data-merci-title]", "Merci pour votre commande");
  setText(
    "[data-merci-copy]",
    "Votre paiement est confirmé. Nous préparons votre commande à Channes. Vous recevrez les informations de suivi par email dès son expédition.",
  );
  renderSummary(session);
  show($("[data-merci-success]"));
}

function renderOpen() {
  setText("[data-merci-kicker]", "Paiement non finalisé");
  setText("[data-merci-title]", "Votre paiement n’est pas terminé");
  setText(
    "[data-merci-copy]",
    "Aucun paiement confirmé n’a été trouvé pour cette session. Votre panier reste conservé pour reprendre la commande.",
  );
  show($("[data-merci-open]"));
}

function renderPending(session) {
  setText("[data-merci-kicker]", "Vérification en cours");
  setText("[data-merci-title]", "Paiement en cours de confirmation");
  setText(
    "[data-merci-copy]",
    "La commande a été reçue, mais le paiement n’est pas encore marqué comme réglé. La maison vérifiera la transaction avant préparation.",
  );
  renderSummary(session);
  show($("[data-merci-open]"));
}

function renderFallback(message) {
  setText("[data-merci-kicker]", "Commande");
  setText("[data-merci-title]", "Vérification de votre commande");
  setText(
    "[data-merci-copy]",
    message ||
      "La page ne dispose pas encore d’une référence de paiement à vérifier.",
  );
  show($("[data-merci-open]"));
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  if (!sessionId) {
    renderFallback();
    return;
  }

  try {
    const session = await fetchSession(sessionId);
    if (session.status === "complete" && session.payment_status === "paid") {
      renderComplete(session);
    } else if (session.status === "complete") {
      renderPending(session);
    } else {
      renderOpen();
    }
  } catch (error) {
    console.debug("Vérification de commande indisponible.", error.message);
    renderFallback(
      "La vérification automatique n’a pas abouti. Si un paiement a été validé, la maison le retrouvera dans Stripe.",
    );
  }
}

init();
