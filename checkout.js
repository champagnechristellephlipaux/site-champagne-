import { STRIPE_PRICE_IDS } from "./shop-config.js";
import { loadCart } from "./cart.js";

const CONTACT_HELP =
  " La maison peut reprendre la commande au +33 6 82 20 34 30 ou par mail à champagne.christelle.phlipaux@gmail.com.";

function notifyCheckoutIssue(message) {
  const fullMessage = `${message}${CONTACT_HELP}`;
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
    return raw.length < 180 ? raw : "";
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
    notifyCheckoutIssue(
      "Votre sélection est vide. Ajoutez une cuvée avant d’ouvrir le paiement sécurisé.",
    );
    return;
  }

  const missing = validatePriceIds(items);
  if (missing.length) {
    console.error(
      "Price IDs Stripe manquants pour la sélection en cours.",
      missing,
    );
    notifyCheckoutIssue(
      "La page de paiement ne peut pas être préparée pour cette sélection.",
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
        errorMessage ||
          "Le paiement sécurisé ne peut pas être ouvert pour le moment. Merci de réessayer dans quelques instants.",
      );
      return;
    }

    const data = await res.json();
    if (data?.url) window.location.href = data.url;
    else
      notifyCheckoutIssue(
        "Le paiement n’a pas pu être initialisé. Relisez votre sélection puis réessayez.",
      );
  } catch (err) {
    console.error(err);
    notifyCheckoutIssue(
      "La connexion au paiement sécurisé est momentanément indisponible. Merci de réessayer dans quelques instants.",
    );
  }
}
