import {
  cartCount,
  cartTotals,
  formatEuro,
  getItemMeta,
  loadCart,
  shippingTotals,
} from "../../cart.js";

const CREATE_SESSION_ENDPOINT =
  "/.netlify/functions/create-checkout-elements-session";

const state = {
  checkout: null,
  canConfirm: false,
  isProcessing: false,
  stripeTotal: "",
};

const $ = (selector, root = document) => root.querySelector(selector);

function redirectToShop() {
  window.location.replace("boutique.html");
}

function setText(selector, value) {
  const node = $(selector);
  if (node) node.textContent = value;
}

function showError(message) {
  const node = $("[data-checkout-error]");
  if (!node) return;
  node.hidden = !message;
  node.textContent = message || "";
}

function setButtonState(label) {
  const button = $("[data-checkout-submit]");
  if (!button) return;
  const disabled = state.isProcessing || !state.canConfirm;
  button.disabled = disabled;
  button.setAttribute("aria-busy", state.isProcessing ? "true" : "false");
  button.textContent =
    label ||
    (state.canConfirm
      ? `Payer ${state.stripeTotal || ""}`.trim()
      : "Renseigner les informations de paiement");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCount(count) {
  return `${count} ${count > 1 ? "articles" : "article"}`;
}

function renderLocalCart(items) {
  const root = $("[data-checkout-items]");
  const totals = cartTotals(items);
  const shipping = shippingTotals(items);
  const estimatedTotal = totals.subtotal + shipping.shippingTotal;
  const count = cartCount(items);

  setText("[data-checkout-count]", formatCount(count));
  setText("[data-checkout-subtotal]", formatEuro(totals.subtotal));
  setText(
    "[data-checkout-shipping]",
    shipping.shippingTotal === 0
      ? "Offerte"
      : formatEuro(shipping.shippingTotal),
  );
  setText("[data-checkout-total]", formatEuro(estimatedTotal));

  const shippingNote = $("[data-checkout-shipping-note]");
  if (shippingNote) {
    const hasOnlyFreeDiscovery =
      (shipping.freeDiscoveryBoxes || 0) > 0 &&
      (shipping.bottles75 || 0) === 0 &&
      (shipping.magnums || 0) === 0;

    if (hasOnlyFreeDiscovery) {
      shippingNote.textContent = "Livraison offerte sur le coffret découverte.";
    } else if ((shipping.freeDiscoveryBoxes || 0) > 0) {
      shippingNote.textContent =
        "Coffret découverte : livraison offerte. Autres bouteilles : barème habituel confirmé au paiement.";
    } else if (shipping.bottles75 >= 6 && !shipping.magnums) {
      shippingNote.textContent = "Livraison offerte atteinte pour ce panier.";
    } else if (shipping.bottles75 >= 6 && shipping.magnums) {
      shippingNote.textContent =
        "75 cl : livraison offerte. Magnums : tarif dédié confirmé au paiement.";
    } else {
      const remaining = Math.max(0, 6 - shipping.bottles75);
      shippingNote.textContent = `Plus que ${remaining} bouteille${remaining > 1 ? "s" : ""} de 75 cl avant la livraison offerte.`;
    }
  }

  if (!root) return;
  root.innerHTML = items
    .map((item) => {
      const meta = getItemMeta(item);
      const title = meta.product?.name || item.sku;
      const format = meta.format?.label || item.format;
      const unitPrice = meta.unitPrice || 0;
      const lineTotal = unitPrice * item.qty;
      return `
        <article class="checkout-item">
          <div>
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(format)} · x${escapeHtml(item.qty)}</span>
          </div>
          <b>${formatEuro(lineTotal)}</b>
        </article>
      `;
    })
    .join("");
}

function cartPayload(items) {
  return items.map((item) => ({
    sku: item.sku,
    format: item.format,
    qty: item.qty,
  }));
}

async function parseResponseError(response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return data?.error || "La page de paiement ne répond pas pour l’instant.";
  } catch (_error) {
    return text || "La page de paiement ne répond pas pour l’instant.";
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
  const clientSecret = data.clientSecret || data.client_secret;
  if (!data.publishableKey || !clientSecret) {
    throw new Error("La session Stripe n’a pas pu être initialisée.");
  }
  return { ...data, clientSecret };
}

function stripeAppearance() {
  return {
    theme: "stripe",
    variables: {
      colorPrimary: "#b98f55",
      colorBackground: "#fffaf2",
      colorText: "#2b2119",
      colorDanger: "#9a3d2c",
      borderRadius: "8px",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      spacingUnit: "4px",
    },
  };
}

function readCheckoutSession() {
  try {
    return typeof state.checkout?.session === "function"
      ? state.checkout.session()
      : null;
  } catch (_error) {
    return null;
  }
}

function sessionAmount(session) {
  return session?.total?.total?.amount || "";
}

function syncStripeSession(session) {
  const current = session || readCheckoutSession();
  state.canConfirm = Boolean(current?.canConfirm);
  state.stripeTotal = sessionAmount(current);

  if (state.stripeTotal) {
    setText("[data-stripe-total]", state.stripeTotal);
    setText("[data-checkout-total]", state.stripeTotal);
  }

  const lastError = current?.lastPaymentError?.message;
  if (lastError) showError(lastError);
  setButtonState();
}

function mountElements() {
  const contactElement = state.checkout.createContactDetailsElement();
  const addressElement = state.checkout.createShippingAddressElement({
    display: { name: "full" },
  });
  const paymentElement = state.checkout.createPaymentElement({
    layout: {
      type: "accordion",
      defaultCollapsed: false,
      radios: "if_multiple",
    },
  });

  contactElement.mount("#contact-details-element");
  addressElement.mount("#address-element");
  paymentElement.mount("#payment-element");
}

async function confirmPayment(event) {
  event.preventDefault();
  if (state.isProcessing || !state.checkout) return;

  state.isProcessing = true;
  showError("");
  setButtonState("Validation en cours…");

  try {
    const loadActionsResult = await state.checkout.loadActions();
    if (loadActionsResult?.type === "error") {
      throw new Error(
        loadActionsResult.error?.message || "Paiement impossible.",
      );
    }

    const result = await loadActionsResult.actions.confirm();
    if (result?.error) {
      throw new Error(result.error.message || "Le paiement a été refusé.");
    }
    if (result?.type === "error") {
      throw new Error(result.error?.message || "Le paiement a été refusé.");
    }

    setButtonState("Redirection après paiement…");
  } catch (error) {
    state.isProcessing = false;
    showError(
      error.message ||
        "Le paiement n’a pas pu être confirmé. Vérifiez vos informations puis réessayez.",
    );
    syncStripeSession();
  }
}

async function init() {
  const items = loadCart();
  if (!items.length) {
    redirectToShop();
    return;
  }

  renderLocalCart(items);
  setButtonState("Préparation du paiement…");

  try {
    if (typeof window.Stripe !== "function") {
      throw new Error("Stripe.js n’a pas pu être chargé.");
    }

    const sessionData = await createCheckoutSession(items);
    const stripe = window.Stripe(sessionData.publishableKey, { locale: "fr" });
    state.checkout = stripe.initCheckoutElementsSdk({
      clientSecret: sessionData.clientSecret,
      elementsOptions: {
        appearance: stripeAppearance(),
      },
    });

    state.checkout.on("change", syncStripeSession);
    mountElements();
    syncStripeSession();
    setButtonState();
  } catch (error) {
    console.error(error);
    state.canConfirm = false;
    showError(
      error.message ||
        "La page de paiement ne répond pas pour l’instant. Votre panier reste conservé.",
    );
    setButtonState("Paiement indisponible");
  }

  $("[data-checkout-form]")?.addEventListener("submit", confirmPayment);
}

init();
