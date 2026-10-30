import { loadCart } from "./cart.js?v=20261012a";

const CREATE_SESSION_ENDPOINT = "/.netlify/functions/create-checkout-session";
const CHECKOUT_ERROR_FALLBACK =
  "Le paiement ne peut pas être ouvert pour le moment. Votre panier reste conservé.";
const CONTACT_HELP_ALERT =
  " La maison peut reprendre la commande avec vous au 06 82 20 34 30 ou par e-mail.";
const SAFE_CHECKOUT_MESSAGES = new Set([
  "Ouvrez le paiement depuis votre panier.",
  "Le panier n’a pas pu être lu. Rouvrez-le pour continuer.",
  "Choisissez une cuvée avant de continuer.",
  "Un produit du panier n’est pas reconnu. Reprenez la commande depuis la boutique.",
  "Ce produit doit être confirmé par la maison avant paiement.",
  "Choisissez une quantité entre 1 et 48 par format.",
  "Stripe ne peut pas ouvrir le paiement pour le moment.",
  "Stripe n’a pas retourné d’adresse de paiement.",
]);

export function publicCheckoutMessage(
  message,
  fallback = CHECKOUT_ERROR_FALLBACK,
) {
  const normalized = typeof message === "string" ? message.trim() : "";
  return SAFE_CHECKOUT_MESSAGES.has(normalized) ? normalized : fallback;
}

function notifyCheckoutIssue(
  message,
  { showContact = true, reason = "checkout_error" } = {},
) {
  const safeMessage = publicCheckoutMessage(message, message);
  window.dispatchEvent(
    new CustomEvent("checkout:issue", {
      detail: { message: safeMessage, reason, showContact },
    }),
  );

  if (!document.querySelector("#cartDrawer, [data-checkout-error]")) {
    alert(`${safeMessage}${showContact ? CONTACT_HELP_ALERT : ""}`);
  }
}

function cartPayload(items) {
  return items.map((item) => ({
    sku: item.sku,
    format: item.format,
    qty: item.qty,
  }));
}

export async function parseResponseError(response) {
  const fallback = "Stripe ne peut pas ouvrir le paiement pour le moment.";
  if (response.status === 404) return fallback;

  let text = "";
  try {
    text = await response.text();
  } catch (_error) {
    return fallback;
  }

  try {
    const data = JSON.parse(text);
    const message =
      typeof data?.error === "string"
        ? data.error
        : typeof data?.error?.message === "string"
          ? data.error.message
          : typeof data?.message === "string"
            ? data.message
            : "";
    return publicCheckoutMessage(message, fallback);
  } catch (_error) {
    return fallback;
  }
}

async function createCheckoutSession(items) {
  const response = await fetch(CREATE_SESSION_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ cart: cartPayload(items) }),
  });

  if (!response.ok) {
    throw new Error(await parseResponseError(response));
  }

  let data;
  try {
    data = await response.json();
  } catch (_error) {
    throw new Error(CHECKOUT_ERROR_FALLBACK);
  }
  if (!data.url) {
    throw new Error("Stripe n’a pas retourné d’adresse de paiement.");
  }
  return data;
}

export async function startCheckout() {
  const items = loadCart();
  if (!items.length) {
    window.ccpTrack?.("checkout_empty_cart", { page: location.pathname });
    notifyCheckoutIssue("Choisissez d’abord une cuvée.", {
      showContact: false,
      reason: "empty_cart",
    });
    return;
  }

  try {
    window.ccpTrack?.("checkout_session_requested", {
      items: items.reduce((sum, item) => sum + (item.qty || 0), 0),
      page: location.pathname,
    });
    const session = await createCheckoutSession(items);
    window.location.assign(session.url);
  } catch (error) {
    notifyCheckoutIssue(publicCheckoutMessage(error?.message));
  }
}
