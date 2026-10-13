import {
  cartCount,
  cartTotals,
  formatEuro,
  getItemMeta,
  loadCart,
  shippingTotals,
} from "../../cart.js?v=20261012a";
import { startCheckout } from "../../checkout.js?v=20261012a";

const errorNode = document.querySelector("[data-checkout-error]");
const submitButton = document.querySelector("[data-checkout-submit]");

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function formatCount(count) {
  return `${count} ${count > 1 ? "articles" : "article"}`;
}

function shippingNote(shipping) {
  const hasOnlyDiscovery =
    shipping.discoveryBoxes === 1 &&
    shipping.bottles75 === 3 &&
    shipping.magnums === 0;

  if (hasOnlyDiscovery) return "Livraison du coffret découverte : 5€.";
  if (shipping.bottles75 >= 6 && !shipping.magnums) {
    return "Livraison offerte atteinte pour ce panier.";
  }
  if (shipping.bottles75 >= 6 && shipping.magnums) {
    return `75 cl : livraison offerte. Livraison des magnums : ${formatEuro(shipping.shippingMag)}.`;
  }
  if (!shipping.bottles75 && shipping.magnums) {
    return `Livraison des magnums : ${formatEuro(shipping.shippingMag)}.`;
  }

  const remaining = Math.max(0, 6 - shipping.bottles75);
  return `Plus que ${remaining} bouteille${remaining > 1 ? "s" : ""} de 75 cl avant la livraison offerte.`;
}

function renderCartSummary(items) {
  const root = document.querySelector("[data-checkout-items]");
  const totals = cartTotals(items);
  const shipping = shippingTotals(items);
  const total = totals.subtotal + shipping.shippingTotal;

  setText("[data-checkout-count]", formatCount(cartCount(items)));
  setText("[data-checkout-subtotal]", formatEuro(totals.subtotal));
  setText(
    "[data-checkout-shipping]",
    shipping.shippingTotal === 0
      ? "Offerte"
      : formatEuro(shipping.shippingTotal),
  );
  setText("[data-checkout-total]", formatEuro(total));
  setText("[data-stripe-total]", formatEuro(total));
  setText("[data-checkout-shipping-note]", shippingNote(shipping));

  if (!root) return;
  root.replaceChildren(
    ...items.map((item) => {
      const meta = getItemMeta(item);
      const article = document.createElement("article");
      const identity = document.createElement("div");
      const title = document.createElement("strong");
      const detail = document.createElement("span");
      const lineTotal = document.createElement("b");

      article.className = "checkout-item";
      title.textContent = meta.product?.name || item.sku;
      detail.textContent = `${meta.format?.label || item.format} · x${item.qty}`;
      lineTotal.textContent = formatEuro((meta.unitPrice || 0) * item.qty);
      identity.append(title, detail);
      article.append(identity, lineTotal);
      return article;
    }),
  );
}

function showError(message, reason = "checkout_error") {
  if (errorNode) {
    errorNode.hidden = false;
    errorNode.textContent = message;
  }
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
    submitButton.dataset.checkoutAction =
      reason === "empty_cart" ? "shop" : "retry";
    submitButton.textContent =
      reason === "empty_cart" ? "Choisir une cuvée" : "Réessayer le paiement";
  }
}

window.addEventListener("checkout:issue", (event) => {
  showError(
    event.detail?.message ||
      "Stripe ne peut pas ouvrir le paiement pour le moment.",
    event.detail?.reason,
  );
});

if (submitButton) {
  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  submitButton.textContent = "Ouverture de Stripe…";
  submitButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (submitButton.dataset.checkoutAction === "shop") {
      window.location.assign("boutique.html");
      return;
    }
    startCheckout();
  });
}

renderCartSummary(loadCart());
startCheckout();
