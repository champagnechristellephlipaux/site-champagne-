// cart-ui.js
import {
  loadCart,
  addToCart,
  setQty,
  removeItem,
  clearCart,
  cartTotals,
  cartCount,
  formatEuro
} from "./cart.js";

import { PRODUCTS, PRICE_EUR } from "./shop-config.js";
import { startCheckout } from "./checkout.js";

// Helpers
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// Drawer
function openCart() {
  const d = $("#cartDrawer");
  if (!d) return;
  d.classList.add("open");
  d.setAttribute("aria-hidden", "false");
}

function closeCart() {
  const d = $("#cartDrawer");
  if (!d) return;
  d.classList.remove("open");
  d.setAttribute("aria-hidden", "true");
}

// Render panier
function renderCart() {
  const items = loadCart();

  // compteur (optionnel)
  const countEl = $("#cartCount");
  if (countEl) countEl.textContent = cartCount(items);

  const list = $("#cartItems");
  const subtotalEl = $("#cartSubtotal");

  if (!list || !subtotalEl) return;

  if (!items.length) {
    list.innerHTML = `<p class="empty">Votre panier est vide.</p>`;
    subtotalEl.textContent = "0 €";
    return;
  }

  list.innerHTML = "";

  items.forEach((item, idx) => {
    const product = PRODUCTS[item.sku];
    if (!product) return;

    const unit = PRICE_EUR[item.sku]?.[item.format] ?? 0;
    const line = unit * item.qty;

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div class="cart-row__main">
        <strong>${product.name}</strong><br>
        <small>${item.format}</small>
      </div>

      <div class="cart-row__qty">
        <button data-minus="${idx}">−</button>
        <input type="number" min="1" value="${item.qty}" data-input="${idx}">
        <button data-plus="${idx}">+</button>
      </div>

      <div class="cart-row__price">${formatEuro(line)}</div>

      <button class="cart-row__remove" data-remove="${idx}">✕</button>
    `;
    list.appendChild(row);
  });

  const totals = cartTotals(items);
  subtotalEl.textContent = formatEuro(totals.subtotal);
}

// Bind produits (boutique)
function bindProducts() {
  $$("[data-add-to-cart]").forEach(btn => {
    btn.addEventListener("click", () => {
      const sku = btn.dataset.sku;
      const format = btn.dataset.format;
      const qty = parseInt(btn.dataset.qty || "1", 10);

      if (!sku || !format) return;

      addToCart(sku, format, qty);
      renderCart();
      openCart();
    });
  });
}

// Bind panier
function bindCart() {
  // ouvrir / fermer
  $("#cartOpen")?.addEventListener("click", openCart);
  $$("[data-cart-close]").forEach(b => b.addEventListener("click", closeCart));

  // vider
  $("#cartClear")?.addEventListener("click", () => {
    clearCart();
    renderCart();
  });

  // payer
  $("#cartCheckout")?.addEventListener("click", async () => {
    await startCheckout();
  });

  const list = $("#cartItems");
  if (!list) return;

  list.addEventListener("click", e => {
    const t = e.target;

    if (t.dataset.plus !== undefined) {
      const i = parseInt(t.dataset.plus, 10);
      const items = loadCart();
      setQty(i, items[i].qty + 1);
    }

    if (t.dataset.minus !== undefined) {
      const i = parseInt(t.dataset.minus, 10);
      const items = loadCart();
      setQty(i, Math.max(1, items[i].qty - 1));
    }

    if (t.dataset.remove !== undefined) {
      removeItem(parseInt(t.dataset.remove, 10));
    }
  });

  list.addEventListener("change", e => {
    if (e.target.dataset.input !== undefined) {
      setQty(
        parseInt(e.target.dataset.input, 10),
        parseInt(e.target.value || "1", 10)
      );
    }
  });

  window.addEventListener("cart:updated", renderCart);
}

// INIT
(function init() {
  bindProducts();
  bindCart();
  renderCart();
})();
