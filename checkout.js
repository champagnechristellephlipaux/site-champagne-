import { loadCart } from "./cart.js?v=20260630b";

const CREATE_SESSION_ENDPOINT = "/.netlify/functions/create-checkout-session";
const CONTACT_HELP =
  "\nVotre panier reste conservé. La maison peut reprendre la commande avec vous : +33 6 82 20 34 30 ou champagne.christelle.phlipaux@gmail.com.";

function notifyCheckoutIssue(message, { showContact = true } = {}) {
  const fullMessage = `${message}${showContact ? CONTACT_HELP : ""}`;
  window.ccpTrack?.("checkout_issue", {
    contactHelp: showContact ? "shown" : "hidden",
    page: location.pathname,
  });
  window.dispatchEvent(
    new CustomEvent("checkout:issue", {
      detail: { message: fullMessage },
    }),
  );

  if (!document.querySelector("#cartDrawer")) {
    alert(fullMessage);
  }
}

function cartPayload(items) {
  return items.map((item) => ({
    sku: item.sku,
    format: item.format,
    qty: item.qty,
  }));
}

async function parseResponseError(response) {
  const fallback = "Stripe ne peut pas ouvrir le paiement pour le moment.";
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return data.error || data.message || fallback;
  } catch (_error) {
    const plainText = text.trim();
    const looksLikeMarkup = /<[^>]+>/.test(plainText);
    return plainText && !looksLikeMarkup && plainText.length <= 180
      ? plainText
      : fallback;
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

  const data = await response.json();
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
    notifyCheckoutIssue(
      error.message ||
        "Le paiement ne peut pas être ouvert pour le moment. Votre panier reste conservé.",
    );
  }
}
