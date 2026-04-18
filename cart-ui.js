import { CURATED_OFFERS, PRICE_EUR } from "./shop-config.js";
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
  equivalent75clPrice,
  estimateSelectionTotal,
} from "./cart.js";
import { startCheckout } from "./checkout.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const prefersDirectScroll =
  window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

const FORMAT_NOTES = {
  brut: {
    750: "75 cl • pour découvrir la cuvée ou servir la table avec naturel",
    magnum:
      "Magnum 1,5 L • pour 6 à 8 convives ou une réception plus marquante",
    carton6:
      "Carton de 6 • pour recevoir sereinement et profiter de la livraison offerte",
  },
  rose: {
    750: "75 cl • pour offrir, inviter ou installer l’apéritif",
    carton6: "Carton de 6 • pour plusieurs cadeaux ou une table de fête",
  },
  demisec: {
    750: "75 cl • pour foie gras, dessert ou première découverte",
    magnum: "Magnum 1,5 L • pour brunch, grande table ou service gourmand",
    carton6:
      "Carton de 6 • pour prévoir plusieurs accords et profiter de la livraison offerte",
  },
};

let toastTimer = 0;

function bottleLabel(count) {
  return `${count} bouteille${count > 1 ? "s" : ""}`;
}

function purchaseUnitLabel(format, qty) {
  if (format === "magnum") return `${qty} ${qty > 1 ? "magnums" : "magnum"}`;
  if (format === "carton6") return `${qty} ${qty > 1 ? "cartons" : "carton"}`;
  return bottleLabel(qty);
}

function openDrawer() {
  const d = $("#cartDrawer");
  if (!d) return;
  document.body.classList.remove("nav-open");
  const navToggle = document.querySelector(".nav-toggle");
  if (navToggle) {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Ouvrir le menu");
  }
  d.classList.add("open");
  d.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
  renderCart();
}

function closeDrawer() {
  const d = $("#cartDrawer");
  if (!d) return;
  d.classList.remove("open");
  d.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
}

function safeText(sel, value) {
  const el = $(sel);
  if (el) el.textContent = value;
}

function safeTextAll(sel, value) {
  $$(sel).forEach((el) => {
    el.textContent = value;
  });
}

function syncCartTriggers(items) {
  const count = cartCount(items);
  const label = `${count} ${count > 1 ? "articles" : "article"}`;

  safeTextAll("[data-cart-count]", String(count));

  $$("[data-cart-open]").forEach((button) => {
    button.dataset.count = String(count);
    button.classList.toggle("is-filled", count > 0);
    button.setAttribute(
      "aria-label",
      count ? `Ouvrir la sélection, ${label}` : "Ouvrir la sélection",
    );
  });
}

function pulseCartButtons() {
  const buttons = new Set([
    ...$$("[data-cart-open]"),
    ...$$("[id='cartOpen']"),
    ...$$("[id='floatingCartOpen']"),
  ]);

  buttons.forEach((btn) => {
    btn.classList.remove("is-pulse");
    void btn.offsetWidth;
    btn.classList.add("is-pulse");
    window.setTimeout(() => btn.classList.remove("is-pulse"), 650);
  });
}

function showToast(title, message) {
  const toast = $("#shopToast");
  if (!toast) return;

  toast.hidden = false;
  toast.innerHTML = `
    <div class="shop-toast">
      <strong>${title}</strong>
      <span>${message}</span>
    </div>
  `;

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
    toast.innerHTML = "";
  }, 2600);
}

function setCheckoutIssue(message = "") {
  const feedback = $("#cartCheckoutMessage");
  if (!feedback) return;
  feedback.hidden = !message;
  feedback.textContent = message;
}

function currentProductTitle(sku) {
  return (
    document
      .querySelector(
        `[data-sku="${sku}"] .product-sale-title, [data-sku="${sku}"] h2, [data-sku="${sku}"] h3`,
      )
      ?.textContent?.trim() || sku
  );
}

function offerTotal(offer) {
  if (!offer?.items) return 0;
  return offer.items.reduce((sum, item) => {
    const unit = PRICE_EUR?.[item.sku]?.[item.format] ?? 0;
    return sum + unit * (item.qty || 0);
  }, 0);
}

function flashAddFeedback(button, sku, qty) {
  const meta = getItemMeta({ sku, format: currentFormat(sku), qty: 1 });
  const originalLabel = button.textContent;
  const formatLabel = meta.format?.label || currentFormat(sku);

  button.disabled = true;
  button.classList.add("is-success");
  button.textContent = "Ajouté à la sélection";
  pulseCartButtons();
  showToast(
    "Sélection mise à jour",
    `${currentProductTitle(sku)} • ${formatLabel} • x${qty}`,
  );

  window.setTimeout(() => {
    button.disabled = false;
    button.classList.remove("is-success");
    button.textContent = originalLabel;
  }, 1200);
}

function flashOfferFeedback(offer) {
  if (!offer) return;
  pulseCartButtons();
  showToast(
    "Sélection maison ajoutée",
    `${offer.name} • ${formatEuro(offerTotal(offer))}`,
  );
}

function updateFloatingCart(items, subtotal) {
  const floating = $("#floatingCart");
  if (!floating) return;

  const count = cartCount(items);
  if (!count) {
    floating.hidden = true;
    return;
  }

  floating.hidden = false;
  safeText(
    "#floatingCartCount",
    `${count} ${count > 1 ? "articles" : "article"}`,
  );
  safeText("#floatingCartSubtotal", formatEuro(subtotal));
}

function updateSelectionNotes() {
  Object.entries(FORMAT_NOTES).forEach(([sku, notes]) => {
    const selected =
      document.querySelector(`input[name="fmt-${sku}"]:checked`)?.value ||
      "750";
    const text = notes?.[selected];
    const noteEl = document.querySelector(`[data-selection-note="${sku}"]`);
    if (noteEl && text) noteEl.textContent = text;
  });
}

function renderCart() {
  const items = loadCart();
  setCheckoutIssue();
  safeText("#cartCount", String(cartCount(items)));
  syncCartTriggers(items);

  const body = $("#cartItems");
  const subtotalEl = $("#cartSubtotal");
  const estimatedTotalEl = $("#cartEstimatedTotal");
  const headerMetaEl = $("#cartHeaderMeta");
  const checkoutBtn = $("#cartCheckout");
  const clearBtn = $("#cartClear");
  if (checkoutBtn && !checkoutBtn.dataset.baseLabel) {
    checkoutBtn.dataset.baseLabel =
      checkoutBtn.textContent?.trim() || "Passer au paiement sécurisé";
  }
  const checkoutBaseLabel =
    checkoutBtn?.dataset.baseLabel || "Passer au paiement sécurisé";
  if (!body || !subtotalEl) return;

  if (checkoutBtn) checkoutBtn.disabled = !items.length;
  if (clearBtn) clearBtn.hidden = !items.length;

  if (!items.length) {
    body.innerHTML = `
      <div class="empty">
        <strong>Votre sélection est vide.</strong>
        <p>Choisissez une cuvée pour relire le total, l’expédition estimée et préparer une commande directe depuis Channes, avec la maison joignable si besoin.</p>
        <button class="btn primary" type="button" data-empty-close>Découvrir nos cuvées</button>
      </div>
    `;
    subtotalEl.textContent = "0€";
    if (estimatedTotalEl) estimatedTotalEl.textContent = "0€";
    if (headerMetaEl) headerMetaEl.textContent = "0 article • 0€";
    if (checkoutBtn) checkoutBtn.textContent = checkoutBaseLabel;
    updateFloatingCart([], 0);

    // Affichage livraison/progression même panier vide (UX)
    const shipEl = $("#cartShipping");
    if (shipEl) shipEl.textContent = "—";
    const bar = $("#shipProgressBar");
    const txt = $("#shipProgressText");
    const note = $("#cartShipNote");
    if (bar) bar.style.width = "0%";
    if (txt)
      txt.textContent =
        "La livraison est offerte dès 6 bouteilles de 75 cl ou sur un carton complet.";
    if (note)
      note.textContent =
        "Les magnums conservent un tarif d’expédition dédié, toujours relu avant validation.";

    return;
  }

  body.innerHTML = items
    .map((it, idx) => {
      const meta = getItemMeta(it);
      const title = meta.product?.name || it.sku;
      const fmt = meta.format?.label || it.format;
      const hint = meta.format?.hint || "";
      const unit = meta.unitPrice || 0;
      const line = unit * it.qty;
      const unitLabel =
        it.format === "magnum"
          ? "Prix unitaire"
          : it.format === "carton6"
            ? "Prix du carton"
            : "Prix unitaire";

      return `
        <div class="cart-item">
          <div class="cart-thumb">
            <img src="${meta.product?.image || ""}" alt="${title}">
          </div>

          <div class="cart-main">
            <div class="cart-item-top">
              <div>
                <div class="cart-title">${title}</div>
                <div class="cart-format">${fmt}</div>
              </div>
              <button class="icon-btn" type="button" data-ci-remove="${idx}" aria-label="Retirer ${title} de la sélection">✕</button>
            </div>
            ${hint ? `<div class="cart-hint">${hint}</div>` : ""}
            <div class="cart-metrics">
              <div class="cart-metric">
                <span class="cart-row-label">${unitLabel}</span>
                <strong class="cart-metric-value">${formatEuro(unit)}</strong>
              </div>
              <div class="cart-metric cart-metric--subtotal">
                <span class="cart-row-label">Sous-total</span>
                <strong class="cart-metric-value cart-line">${formatEuro(line)}</strong>
              </div>
            </div>

            <div class="cart-row cart-row--qty">
              <div class="cart-qty-wrap">
                <span class="cart-row-label">Quantité</span>
                <div class="qty small">
                  <button class="qty-btn" type="button" aria-label="Retirer une unité de ${title}" data-ci-minus="${idx}">−</button>
                  <input class="qty-input" type="number" min="1" inputmode="numeric" pattern="[0-9]*" aria-label="Quantité pour ${title}" value="${it.qty}" data-ci-input="${idx}" />
                  <button class="qty-btn" type="button" aria-label="Ajouter une unité de ${title}" data-ci-plus="${idx}">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  const totals = cartTotals(items);
  subtotalEl.textContent = formatEuro(totals.subtotal);
  const ship = shippingTotals(items);
  const estimatedTotal = totals.subtotal + ship.shippingTotal;
  if (estimatedTotalEl)
    estimatedTotalEl.textContent = formatEuro(estimatedTotal);
  if (headerMetaEl) {
    const count = cartCount(items);
    headerMetaEl.textContent = `${count} ${count > 1 ? "articles" : "article"} • ${formatEuro(estimatedTotal)}`;
  }
  if (checkoutBtn)
    checkoutBtn.textContent = `${checkoutBaseLabel} • ${formatEuro(estimatedTotal)}`;
  updateFloatingCart(items, totals.subtotal);

  // Livraison (affichage indicatif : la logique finale est appliquée au checkout)
  const shipEl = $("#cartShipping");
  if (shipEl)
    shipEl.textContent =
      ship.shippingTotal === 0 ? "Offerte" : formatEuro(ship.shippingTotal);

  const bar = $("#shipProgressBar");
  const txt = $("#shipProgressText");
  const note = $("#cartShipNote");

  if (bar && txt) {
    const target = 6;
    const progress = Math.min(1, (ship.bottles75 || 0) / target);
    bar.style.width = `${Math.round(progress * 100)}%`;

    if ((ship.bottles75 || 0) >= target) {
      txt.textContent =
        (ship.magnums || 0) > 0
          ? "Les 75 cl de cette sélection sont au franco. Les magnums gardent leur tarif propre."
          : "Cette sélection bénéficie de la livraison offerte.";
    } else {
      const remaining = target - (ship.bottles75 || 0);
      txt.textContent = `Encore ${bottleLabel(remaining)} de 75 cl pour atteindre le franco.`;
    }
  }

  if (note) {
    note.textContent =
      (ship.magnums || 0) > 0
        ? "Les cartons complets bénéficient aussi du franco. Les magnums sont expédiés à 10€ par unité."
        : "La livraison est offerte dès 6 bouteilles de 75 cl ou sur un carton complet.";
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

function updateAddButtonLabel(sku, selected, qty, price) {
  const button = document.querySelector(`[data-add="${sku}"]`);
  if (!button) return;
  const total = formatEuro(price * qty);
  const label =
    qty > 1
      ? `Ajouter ${purchaseUnitLabel(selected, qty)} • ${total}`
      : selected === "magnum"
        ? `Ajouter le magnum • ${total}`
        : selected === "carton6"
          ? `Ajouter le carton • ${total}`
          : `Ajouter ce format • ${total}`;
  button.textContent = label;
  button.setAttribute("aria-label", `${label} à la sélection`);
}

function updateCardPrices() {
  ["brut", "rose", "demisec"].forEach((sku) => {
    const selected =
      document.querySelector(`input[name="fmt-${sku}"]:checked`)?.value ||
      "750";
    const price = PRICE_EUR?.[sku]?.[selected] ?? 0;
    const qty = currentQty(sku);
    const card = document.querySelector(`[data-sku="${sku}"]`);
    const priceEl = card?.querySelector(".price");
    const equivalentEl = card?.querySelector("[data-price-equivalent]");
    const estimateEl = card?.querySelector("[data-total-estimate]");
    if (priceEl) priceEl.textContent = formatEuro(price);
    if (equivalentEl) {
      equivalentEl.textContent = `Soit ${formatEuro(equivalent75clPrice(sku, selected))} / 75 cl équivalent`;
    }
    if (estimateEl) {
      const estimate = estimateSelectionTotal(sku, selected, qty);
      estimateEl.textContent = `Repère France métropolitaine, livraison incluse : ${formatEuro(estimate.total)}`;
    }
    updateAddButtonLabel(sku, selected, qty, price);
  });
  updateSelectionNotes();
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
      updateCardPrices();
    });
  });

  $$("[data-qty-minus]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sku = btn.getAttribute("data-qty-minus");
      const input = document.querySelector(`[data-qty-input="${sku}"]`);
      if (!input) return;
      input.value = String(Math.max(1, parseInt(input.value || "1", 10) - 1));
      updateCardPrices();
    });
  });

  $$("[data-qty-input]").forEach((input) => {
    input.addEventListener("input", updateCardPrices);
    input.addEventListener("change", updateCardPrices);
  });

  $$("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sku = btn.getAttribute("data-add");
      if (!sku) return;
      const qty = currentQty(sku);
      addToCart(sku, currentFormat(sku), qty);
      renderCart();
      flashAddFeedback(btn, sku, qty);
    });
  });
}

function bindCartControls() {
  const buttons = new Set([
    ...$$("[data-cart-open]"),
    ...$$("[id='cartOpen']"),
    ...$$("[id='floatingCartOpen']"),
  ]);

  buttons.forEach((button) => button.addEventListener("click", openDrawer));

  $$("[data-cart-close]").forEach((el) =>
    el.addEventListener("click", closeDrawer),
  );

  $("#cartClear")?.addEventListener("click", () => {
    clearCart();
    renderCart();
  });

  $("#cartCheckout")?.addEventListener("click", async () => {
    const btn = $("#cartCheckout");
    if (!btn) return;

    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.textContent = "Ouverture du paiement sécurisé…";

    try {
      await startCheckout();
    } finally {
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      btn.textContent = originalLabel;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  const cartItems = $("#cartItems");
  if (!cartItems) return;

  cartItems.addEventListener("click", (e) => {
    const t = e.target;
    if (!t?.getAttribute) return;

    const minus = t.getAttribute("data-ci-minus");
    const plus = t.getAttribute("data-ci-plus");
    const rem = t.getAttribute("data-ci-remove");
    const emptyClose = t.getAttribute("data-empty-close");

    if (emptyClose != null) {
      closeDrawer();
      document.querySelector("#produits")?.scrollIntoView({
        behavior: prefersDirectScroll ? "auto" : "smooth",
        block: "start",
      });
      return;
    }

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
  window.addEventListener("cart:offer-added", (event) => {
    const offerId = event?.detail?.offerId;
    const offer = CURATED_OFFERS?.[offerId];
    renderCart();
    openDrawer();
    flashOfferFeedback(offer);
  });
  updateSelectionNotes();
  renderCart();

  const queuedOfferId = sessionStorage.getItem("cp_offer_added");
  const shouldOpenCart = sessionStorage.getItem("cp_open_cart") === "1";
  if (queuedOfferId || shouldOpenCart) {
    const offer = CURATED_OFFERS?.[queuedOfferId];
    renderCart();
    openDrawer();
    if (offer) flashOfferFeedback(offer);
    sessionStorage.removeItem("cp_offer_added");
    sessionStorage.removeItem("cp_open_cart");
  }

  window.addEventListener("checkout:issue", (event) => {
    openDrawer();
    setCheckoutIssue(
      event?.detail?.message ||
        "Le paiement sécurisé ne peut pas être ouvert pour le moment.",
    );
  });
}

init();
