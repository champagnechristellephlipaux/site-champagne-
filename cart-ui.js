import { PRICE_EUR } from "./shop-config.js";
import {
  loadCart,
  addToCart,
  setQty,
  removeItem,
  clearCart,
  cartTotals,
  cartCount,
  getItemMeta,
  formatEuro,
  shippingTotals,
} from "./cart.js";
import { startCheckout } from "./checkout.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function openDrawer() {
  const d = $("#cartDrawer");
  if (!d) return;
  d.classList.add("open");
  d.setAttribute("aria-hidden", "false");
  renderCart();
}

function closeDrawer() {
  const d = $("#cartDrawer");
  if (!d) return;
  d.classList.remove("open");
  d.setAttribute("aria-hidden", "true");
}

function safeText(sel, value) {
  const el = $(sel);
  if (el) el.textContent = value;
}

function renderCart() {
  const items = loadCart();
  safeText("#cartCount", String(cartCount(items)));

  const body = $("#cartItems");
  const subtotalEl = $("#cartSubtotal");
  if (!body || !subtotalEl) return;

  if (!items.length) {
    body.innerHTML = `<div class="empty">Votre panier est vide.</div>`;
    subtotalEl.textContent = "0€";

    // Affichage livraison/progression même panier vide (UX)
    const shipEl = $("#cartShipping");
    if (shipEl) shipEl.textContent = "—";
    const bar = $("#shipProgressBar");
    const txt = $("#shipProgressText");
    const note = $("#cartShipNote");
    if (bar) bar.style.width = "0%";
    if (txt) txt.textContent = "Ajoutez 6 bouteilles (75 cl) pour obtenir la livraison offerte.";
    if (note) note.textContent = "Livraison offerte dès 6 bouteilles (75 cl/carton). Magnum : +10€ / magnum.";

    return;
  }

  body.innerHTML = items
    .map((it, idx) => {
      const meta = getItemMeta(it);
      const title = meta.product?.name || it.sku;
      const fmt = meta.format?.label || it.format;
      const unit = meta.unitPrice || 0;
      const line = unit * it.qty;

      return `
        <div class="cart-item">
          <div class="cart-thumb">
            <img src="${meta.product?.image || ""}" alt="${title}">
          </div>

          <div class="cart-main">
            <div class="cart-title">${title}</div>
            <div class="cart-meta">${fmt}</div>
            <div class="cart-meta"><b>${formatEuro(unit)}</b> / unité</div>

            <div class="cart-row">
              <div class="qty small">
                <button class="qty-btn" type="button" data-ci-minus="${idx}">−</button>
                <input class="qty-input" type="number" min="1" value="${it.qty}" data-ci-input="${idx}" />
                <button class="qty-btn" type="button" data-ci-plus="${idx}">+</button>
              </div>
              <div class="cart-line">${formatEuro(line)}</div>
            </div>
          </div>

          <button class="icon-btn" type="button" data-ci-remove="${idx}" aria-label="Supprimer">✕</button>
        </div>
      `;
    })
    .join("");

  const totals = cartTotals(items);
  subtotalEl.textContent = formatEuro(totals.subtotal);

  // Livraison (affichage indicatif : la logique finale est appliquée au checkout)
  const ship = shippingTotals(items);
  const shipEl = $("#cartShipping");
  if (shipEl) shipEl.textContent = ship.shippingTotal === 0 ? "Offerte" : formatEuro(ship.shippingTotal);

  const bar = $("#shipProgressBar");
  const txt = $("#shipProgressText");
  const note = $("#cartShipNote");

  if (bar && txt) {
    const target = 6;
    const progress = Math.min(1, (ship.bottles75 || 0) / target);
    bar.style.width = `${Math.round(progress * 100)}%`;

    if ((ship.bottles75 || 0) >= target) {
      txt.textContent = "Livraison offerte atteinte (6 bouteilles ou plus).";
    } else {
      const remaining = target - (ship.bottles75 || 0);
      txt.textContent = `Plus que ${remaining} bouteille(s) (75 cl) pour obtenir la livraison offerte.`;
    }
  }

  if (note) {
    // Mentionner les frais magnum si présent
    note.textContent = (ship.magnums || 0) > 0
      ? "Livraison offerte dès 6 bouteilles (75 cl). Magnum : 10€ par magnum."
      : "Livraison offerte dès 6 bouteilles (75 cl).";
  }
}

function currentFormat(sku) {
  const r = document.querySelector(`input[name="fmt-${sku}"]:checked`);
  return r ? r.value : "750";
}

function currentQty(sku) {
  const el = document.querySelector(`[data-qty-input="${sku}"]`);
  return Math.max(1, parseInt(el?.value || "1", 10));
}

function updateCardPrices() {
  ["brut", "rose", "demisec"].forEach((sku) => {
    const selected =
      document.querySelector(`input[name="fmt-${sku}"]:checked`)?.value || "750";
    const price = PRICE_EUR?.[sku]?.[selected] ?? 0;
    const card = document.querySelector(`[data-sku="${sku}"]`);
    const priceEl = card?.querySelector(".price");
    if (priceEl) priceEl.textContent = `${price}€`;
  });
}

function bindProductControls() {
  document.addEventListener("change", (e) => {
    if (e.target?.name?.startsWith("fmt-")) updateCardPrices();
  });
  updateCardPrices();

  $$("[data-qty-plus]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sku = btn.getAttribute("data-qty-plus");
      const input = document.querySelector(`[data-qty-input="${sku}"]`);
      if (!input) return;
      input.value = String(parseInt(input.value || "1", 10) + 1);
    });
  });

  $$("[data-qty-minus]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sku = btn.getAttribute("data-qty-minus");
      const input = document.querySelector(`[data-qty-input="${sku}"]`);
      if (!input) return;
      input.value = String(Math.max(1, parseInt(input.value || "1", 10) - 1));
    });
  });

  $$("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sku = btn.getAttribute("data-add");
      if (!sku) return;
      addToCart(sku, currentFormat(sku), currentQty(sku));
      renderCart();
      openDrawer();
    });
  });
}

function bindCartControls() {
  $("#cartOpen")?.addEventListener("click", openDrawer);

  $$("[data-cart-close]").forEach((el) =>
    el.addEventListener("click", closeDrawer)
  );

  $("#cartClear")?.addEventListener("click", () => {
    clearCart();
    renderCart();
  });

  $("#cartCheckout")?.addEventListener("click", async () => {
    await startCheckout();
  });

  const cartItems = $("#cartItems");
  if (!cartItems) return;

  cartItems.addEventListener("click", (e) => {
    const t = e.target;
    if (!t?.getAttribute) return;

    const minus = t.getAttribute("data-ci-minus");
    const plus = t.getAttribute("data-ci-plus");
    const rem = t.getAttribute("data-ci-remove");

    if (minus != null) {
      const idx = parseInt(minus, 10);
      const items = loadCart();
      const cur = items[idx]?.qty || 1;
      setQty(idx, Math.max(1, cur - 1));
      renderCart();
      return;
    }

    if (plus != null) {
      const idx = parseInt(plus, 10);
      const items = loadCart();
      const cur = items[idx]?.qty || 1;
      setQty(idx, cur + 1);
      renderCart();
      return;
    }

    if (rem != null) {
      const idx = parseInt(rem, 10);
      removeItem(idx);
      renderCart();
    }
  });

  cartItems.addEventListener("change", (e) => {
    const t = e.target;
    const idxStr = t?.getAttribute?.("data-ci-input");
    if (idxStr == null) return;

    const idx = parseInt(idxStr, 10);
    const qty = Math.max(1, parseInt(t.value || "1", 10));
    setQty(idx, qty);
    renderCart();
  });
}

function init() {
  bindProductControls();
  bindCartControls();
  window.addEventListener("cart:updated", renderCart);
  renderCart();
}

init();
