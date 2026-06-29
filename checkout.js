import { STRIPE_PRICE_IDS } from "./shop-config.js";
import { loadCart } from "./cart.js";

const CONTACT_HELP =
  "\nVotre panier reste conservé. La maison peut reprendre la commande avec vous : +33 6 82 20 34 30 ou champagne.christelle.phlipaux@gmail.com.";

function notifyCheckoutIssue(message, { showContact = true } = {}) {
  const fullMessage = `${message}${showContact ? CONTACT_HELP : ""}`;
  window.dispatchEvent(
    new CustomEvent("checkout:issue", {
      detail: { message: fullMessage },
    }),
  );

  if (!document.querySelector("#cartDrawer")) {
    alert(fullMessage);
  }
}

function parseServerError(raw) {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return parsed?.error || "";
  } catch {
    return "";
  }
}

function validatePriceIds(items) {
  const missing = [];
  items.forEach((it) => {
    const pid = STRIPE_PRICE_IDS?.[it.sku]?.[it.format];
    if (!pid || pid.includes("PLACEHOLDER"))
      missing.push(`${it.sku}/${it.format}`);
  });
  return missing;
}

export async function startCheckout() {
  const items = loadCart();
  if (!items.length) {
    notifyCheckoutIssue("Choisissez d’abord une cuvée.", {
      showContact: false,
    });
    return;
  }

  window.location.href = "checkout.html";
}

export async function startHostedCheckout() {
  const items = loadCart();
  if (!items.length) {
    notifyCheckoutIssue("Choisissez d’abord une cuvée.", {
      showContact: false,
    });
    return;
  }

  const missing = validatePriceIds(items);
  if (missing.length) {
    console.error(
      "Price IDs Stripe manquants pour le panier en cours.",
      missing,
    );
    notifyCheckoutIssue(
      "Ce format mérite une confirmation de la maison avant paiement.",
    );
    return;
  }

  const line_items = items.map((it) => ({
    price: STRIPE_PRICE_IDS[it.sku][it.format],
    quantity: it.qty,
  }));

  try {
    const res = await fetch("/.netlify/functions/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ line_items }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error(txt);
      const errorMessage = parseServerError(txt);
      notifyCheckoutIssue(
        errorMessage || "La page de paiement ne s’ouvre pas pour le moment.",
      );
      return;
    }

    const data = await res.json();
    if (data?.url) window.location.href = data.url;
    else notifyCheckoutIssue("Le lien de paiement n’a pas pu être créé.");
  } catch (err) {
    console.error(err);
    notifyCheckoutIssue("La page de paiement ne répond pas pour l’instant.");
  }
}
