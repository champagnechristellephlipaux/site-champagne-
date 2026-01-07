import { PRODUCTS, FORMATS, PRICE_EUR } from "./shop-config.js";
import {
  loadCart,
  addToCart,
  setQty,
  removeItem,
  clearCart,
  cartTotals,
  cartCount,
  getItemMeta,
  formatEuro
} from "./cart.js";
import { startCheckout } from "./checkout.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function openDrawer() {
  const d = $("#cartDrawer");
  if (!d) return;
  d.classList.add("open");
  d.setAttribute("aria-hidden", "false");
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
}

function currentFormat(sku) {
  const r = document.querySelector(`input[name="fmt-${sku}"]:checked`);
  return r ? r.value : "750";
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

function currentQty(sku) {
  const el = document.querySelector(`[data-qty-input="${sku}"]`);
  return Math.max(1, parseInt(el?.value || "1", 10));
}

function bindProductControls() {
  document.addEventListener("change", (e) => {
    if (e.target?.name?.startsWith("fmt-")) updateCardPrices();
  });
  updateCardPrices();

  $$('[data-qty-plus]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sku = btn.getAttribute('data-qty-plus');
      const input = document.querySelector(`[data-qty-input="${sku}"]`);
      if (!input) return;
      input.value = String(parseInt(input.value || '1', 10) + 1);
    });
  });

  $$('[data-qty-minus]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sku = btn.getAttribute('data-qty-minus');
      const input = document.querySelector(`[data-qty-input="${sku}"]`);
      if (!input) return;
      input.value = String(Math.max(1, parseInt(input.value || '1', 10) - 1));
    });
  });

  $$('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sku = btn.getAttribute('data-add');
      if (!sku) return;
      addToCart(sku, currentFormat(sku), currentQty(sku));
      openDrawer();
    });
  });

  $$('[data-buy-now]').forEach((a) => {
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      const sku = a.getAttribute('data-buy-now');
      if (!sku) return;
      addToCart(sku, '750', currentQty(sku));
      openDrawer();
      await startCheckout();
    });
  });
}

function bindCartControls() {
  $("#cartOpen")?.addEventListener('click', openDrawer);
  $$('[data-cart-close]').forEach((el) => el.addEventListener('click', closeDrawer));

  $("#cartClear")?.addEventListener('click', () => {
    clearCart();
    renderCart();
  });

  $("#cartCheckout")?.addEventListener('click', async () => {
    await startCheckout();
  });

  const cartItems = $("#cartItems");
  if (!cartItems) return;

  cartItems.addEventListener('click', (e) => {
    const t = e.target;
    const minus = t.getAttribute?.('data-ci-minus');
    const plus = t.getAttribute?.('data-ci-plus');
    const rem = t.getAttribute?.('data-ci-remove');

    if (minus != null) {
      const idx = int(minus);
    }
  });
}

(function init(){
  bindProductControls();
  // NOTE: The rest of controls are implemented in the in-zip original cart-ui
  renderCart();
})();
