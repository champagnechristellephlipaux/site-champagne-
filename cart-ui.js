import { CURATED_OFFERS, PRICE_EUR } from "./shop-config.js?v=20260630b";
import {
  loadCart,
  addToCart,
  setQty,
  removeItem,
  clearCart,
  cartTotals,
  cartCount,
  MAX_ITEM_QTY,
  getItemMeta,
  formatEuro,
  shippingTotals,
  equivalent75clPrice,
  estimateSelectionTotal,
} from "./cart.js?v=20260630b";
import { startCheckout } from "./checkout.js?v=20260630b";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const prefersDirectScroll =
  window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

const FORMAT_NOTES = {
  "coffret-decouverte": {
    coffret3: "Coffret • 3 bouteilles, livraison offerte",
  },
  brut: {
    750: "75 cl • première commande, repas",
    magnum: "Magnum • grande table",
    carton6: "Carton de 6 • livraison offerte",
  },
  rose: {
    750: "75 cl • cadeau, apéritif",
    carton6: "Carton de 6 • cadeaux ou réception",
  },
  demisec: {
    750: "75 cl • foie gras, fruits",
    magnum: "Magnum • grande table gourmande",
    carton6: "Carton de 6 • livraison offerte",
  },
};

let toastTimer = 0;
let cartTrigger = null;
const selectionTimers = new Map();

function ensureCartLiveStatus() {
  const drawer = $("#cartDrawer .drawer-panel");
  if (!drawer) return null;

  let status = $("#cartLiveStatus");
  if (status) return status;

  status = document.createElement("div");
  status.id = "cartLiveStatus";
  status.className = "cart-live-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");
  drawer.appendChild(status);
  return status;
}

function announceCart(message) {
  const status = ensureCartLiveStatus();
  if (!status) return;
  status.textContent = "";
  window.setTimeout(() => {
    status.textContent = message;
  }, 20);
}

function replaceCloseIcons() {
  $$(".icon-btn").forEach((button) => {
    if (
      !button.matches("[data-cart-close], [data-ci-remove]") ||
      button.querySelector(".ui-close-mark")
    )
      return;
    button.innerHTML = '<span class="ui-close-mark" aria-hidden="true"></span>';
  });
}

function pulseDrawerChange() {
  const panel = $("#cartDrawer .drawer-panel");
  if (!panel) return;
  panel.classList.remove("is-changing");
  void panel.offsetWidth;
  panel.classList.add("is-changing");
  window.setTimeout(() => panel.classList.remove("is-changing"), 360);
}

function pulseProductSelection(sku) {
  const card = document.querySelector(`[data-sku="${sku}"]`);
  if (!card) return;

  card.classList.remove("is-selection-changing");
  void card.offsetWidth;
  card.classList.add("is-selection-changing");

  window.clearTimeout(selectionTimers.get(sku));
  selectionTimers.set(
    sku,
    window.setTimeout(() => {
      card.classList.remove("is-selection-changing");
      selectionTimers.delete(sku);
    }, 340),
  );
}

function drawerFocusableElements(drawer) {
  return Array.from(
    drawer.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((node) => !node.hidden && node.offsetParent !== null);
}

function bottleLabel(count) {
  return `${count} bouteille${count > 1 ? "s" : ""}`;
}

function purchaseUnitLabel(format, qty) {
  if (format === "magnum") return `${qty} ${qty > 1 ? "magnums" : "magnum"}`;
  if (format === "carton6") return `${qty} ${qty > 1 ? "cartons" : "carton"}`;
  if (format === "coffret3")
    return `${qty} ${qty > 1 ? "coffrets" : "coffret"}`;
  return bottleLabel(qty);
}

function singlePurchaseLabel(format) {
  if (format === "magnum") return "ce magnum";
  if (format === "carton6") return "ce carton";
  if (format === "coffret3") return "ce coffret";
  return "cette cuvée";
}

function selectedFormatLabel(format) {
  if (format === "magnum") return "Magnum 1,5 L";
  if (format === "carton6") return "Carton de 6";
  if (format === "coffret3") return "Coffret 3 bouteilles";
  return "Bouteille 75 cl";
}

function openDrawer(trigger = document.activeElement) {
  const d = $("#cartDrawer");
  if (!d) return;
  cartTrigger = trigger instanceof HTMLElement ? trigger : null;
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
  window.setTimeout(() => {
    d.querySelector(".drawer-head [data-cart-close]")?.focus();
  }, 0);
}

function closeDrawer() {
  const d = $("#cartDrawer");
  if (!d) return;
  d.classList.remove("open");
  d.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
  if (cartTrigger?.isConnected) cartTrigger.focus();
  cartTrigger = null;
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
      count ? `Ouvrir le panier, ${label}` : "Ouvrir le panier",
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
      <span class="shop-toast-copy">
        <strong>${title}</strong>
        <span>${message}</span>
      </span>
      <button class="shop-toast-action" type="button" data-cart-open>Voir le panier</button>
    </div>
  `;

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
    toast.innerHTML = "";
  }, 4500);
}

function setCheckoutIssue(message = "") {
  const feedback = $("#cartCheckoutMessage");
  if (!feedback) return;
  feedback.setAttribute("aria-live", "polite");
  feedback.hidden = !message;
  feedback.textContent = message;
}

function normalizeQuantity(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(MAX_ITEM_QTY, Math.max(1, parsed));
}

function setQuantityInput(input, value) {
  input.value = String(normalizeQuantity(value));
}

function currentProductTitle(sku) {
  const card = document.querySelector(`[data-sku="${sku}"]`);
  return (
    card?.querySelector(".product-buy-heading strong")?.textContent?.trim() ||
    card?.querySelector(".product-sale-title, h2, h3")?.textContent?.trim() ||
    sku
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
  button.textContent = "Ajouté au panier";
  pulseCartButtons();
  showToast(
    "Ajouté au panier",
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
    "Ajouté au panier",
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

function syncDrawerAssurance() {
  $$(".drawer-assurance").forEach((node) => {
    node.innerHTML = `
      <span>Préparé à Channes</span>
      <span>Emballage renforcé</span>
      <span>Paiement sécurisé</span>
    `;
  });
}

function renderCart() {
  const items = loadCart();
  const panel = $("#cartDrawer .drawer-panel");
  panel?.classList.toggle("is-empty", !items.length);
  setCheckoutIssue();
  syncDrawerAssurance();
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
      checkoutBtn.textContent?.trim() || "Continuer vers le paiement";
  }
  const checkoutBaseLabel =
    checkoutBtn?.dataset.baseLabel || "Continuer vers le paiement";
  if (!body || !subtotalEl) return;

  if (checkoutBtn) checkoutBtn.disabled = !items.length;
  if (clearBtn) clearBtn.hidden = !items.length;

  if (!items.length) {
    body.innerHTML = `
      <div class="empty">
        <strong>Votre panier est vide.</strong>
        <p>Choisissez une cuvée pour voir le format, la livraison et le total avant paiement.</p>
        <button class="btn primary" type="button" data-empty-close>Choisir une cuvée</button>
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
        "Livraison offerte sur le coffret découverte ou dès 6 bouteilles de 75 cl.";
    if (note)
      note.textContent =
        "Coffret : sans frais. 6 bouteilles de 75 cl : sans frais. Magnum : 10€ par unité.";

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
              <div class="cart-item-identity">
                <div class="cart-title">${title}</div>
                <div class="cart-format">${fmt}</div>
              </div>
              <div class="cart-line-wrap cart-line-wrap--primary">
                <span class="cart-row-label">Sous-total</span>
                <strong class="cart-line">${formatEuro(line)}</strong>
              </div>
              <button class="icon-btn" type="button" data-ci-remove="${idx}" aria-label="Retirer ${title} du panier"><span class="ui-close-mark" aria-hidden="true"></span></button>
            </div>
            ${hint ? `<div class="cart-hint">${hint}</div>` : ""}
            <div class="cart-item-bottom">
              <div class="cart-qty-wrap">
                <span class="cart-row-label">Quantité</span>
                <div class="qty small">
                  <button class="qty-btn" type="button" aria-label="Réduire la quantité de ${title}" data-ci-minus="${idx}" ${it.qty <= 1 ? "disabled" : ""}>−</button>
                  <input class="qty-input" type="number" min="1" max="${MAX_ITEM_QTY}" inputmode="numeric" pattern="[0-9]*" aria-label="Quantité pour ${title}, de 1 à ${MAX_ITEM_QTY}" value="${it.qty}" data-ci-input="${idx}" />
                  <button class="qty-btn" type="button" aria-label="Augmenter la quantité de ${title}" data-ci-plus="${idx}">+</button>
                </div>
              </div>
              <div class="cart-unit-note">
                <span class="cart-row-label">${unitLabel}</span>
                <strong>${formatEuro(unit)}</strong>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
  replaceCloseIcons();

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

  // Livraison : la même grille est appliquée côté serveur au paiement.
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
    const hasOnlyFreeDiscovery =
      (ship.freeDiscoveryBoxes || 0) > 0 &&
      (ship.bottles75 || 0) === 0 &&
      (ship.magnums || 0) === 0;
    bar.style.width = `${Math.round((hasOnlyFreeDiscovery ? 1 : progress) * 100)}%`;

    if (hasOnlyFreeDiscovery) {
      txt.textContent = "Livraison offerte sur le coffret découverte.";
    } else if ((ship.bottles75 || 0) >= target) {
      txt.textContent =
        (ship.magnums || 0) > 0
          ? `75 cl : livraison offerte. Magnums : ${formatEuro(ship.shippingMag)}.`
          : "Livraison offerte atteinte pour ce panier.";
    } else if ((ship.bottles75 || 0) > 0) {
      const remaining = target - (ship.bottles75 || 0);
      txt.textContent = `Plus que ${bottleLabel(remaining)} avant la livraison offerte.`;
    } else if ((ship.magnums || 0) > 0) {
      txt.textContent = `Livraison des magnums : ${formatEuro(ship.shippingMag)}.`;
    } else {
      txt.textContent = "Frais de livraison affichés dans le total.";
    }
  }

  if (note) {
    if (
      (ship.freeDiscoveryBoxes || 0) > 0 &&
      ((ship.bottles75 || 0) > 0 || (ship.magnums || 0) > 0)
    ) {
      note.textContent =
        ship.shippingTotal === 0
          ? "Le coffret et les bouteilles de 75 cl sont livrés sans frais."
          : `Le coffret est livré sans frais. Livraison des autres formats : ${formatEuro(ship.shippingTotal)}.`;
    } else if ((ship.freeDiscoveryBoxes || 0) > 0) {
      note.textContent = "Aucun frais de livraison pour ce coffret.";
    } else {
      note.textContent =
        (ship.magnums || 0) > 0
          ? "Magnum : 10€ par unité. Les 75 cl sont livrés sans frais dès 6 bouteilles."
          : "Livraison offerte dès 6 bouteilles de 75 cl.";
    }
  }
}

function currentFormat(sku) {
  const r = document.querySelector(`input[name="fmt-${sku}"]:checked`);
  return r ? r.value : "750";
}

function currentQty(sku) {
  const el = document.querySelector(`[data-qty-input="${sku}"]`);
  return normalizeQuantity(el?.value || "1");
}

function updateAddButtonLabel(sku, selected, qty, price) {
  const button = document.querySelector(`[data-add="${sku}"]`);
  if (!button) return;
  const total = formatEuro(price * qty);
  const isMobileShop =
    window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
  const label = isMobileShop
    ? qty > 1
      ? `Ajouter x${qty} • ${total}`
      : `Ajouter • ${total}`
    : qty > 1
      ? `Ajouter ${purchaseUnitLabel(selected, qty)} • ${total}`
      : `Ajouter ${singlePurchaseLabel(selected)} • ${total}`;
  button.textContent = label;
  button.setAttribute("aria-label", label);
}

function updateCardPrices() {
  ["coffret-decouverte", "brut", "rose", "demisec"].forEach((sku) => {
    const selected =
      document.querySelector(`input[name="fmt-${sku}"]:checked`)?.value ||
      "750";
    const price = PRICE_EUR?.[sku]?.[selected] ?? 0;
    const qty = currentQty(sku);
    const card = document.querySelector(`[data-sku="${sku}"]`);
    const priceEl = card?.querySelector(".price");
    const formatEl = card?.querySelector("[data-format-current]");
    const equivalentEl = card?.querySelector("[data-price-equivalent]");
    const estimateEl = card?.querySelector("[data-total-estimate]");
    if (priceEl) priceEl.textContent = formatEuro(price);
    if (formatEl) formatEl.textContent = selectedFormatLabel(selected);
    if (equivalentEl) {
      equivalentEl.textContent =
        selected === "coffret3"
          ? "Prix TTC · 3 bouteilles de 75 cl · livraison offerte"
          : `Prix TTC · soit ${formatEuro(equivalent75clPrice(sku, selected))} / 75 cl équivalent`;
    }
    if (estimateEl) {
      const estimate = estimateSelectionTotal(sku, selected, qty);
      estimateEl.textContent = `Total TTC, livraison comprise : ${formatEuro(estimate.total)}`;
    }
    updateAddButtonLabel(sku, selected, qty, price);
  });
  updateSelectionNotes();
}

function bindProductControls() {
  document.addEventListener("change", (e) => {
    if (!e.target?.name?.startsWith("fmt-")) return;
    const sku = e.target.name.replace("fmt-", "");
    updateCardPrices();
    pulseProductSelection(sku);
  });
  updateCardPrices();

  $$("[data-qty-plus]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sku = btn.getAttribute("data-qty-plus");
      const input = document.querySelector(`[data-qty-input="${sku}"]`);
      if (!input) return;
      setQuantityInput(input, normalizeQuantity(input.value) + 1);
      updateCardPrices();
      pulseProductSelection(sku);
    });
  });

  $$("[data-qty-minus]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sku = btn.getAttribute("data-qty-minus");
      const input = document.querySelector(`[data-qty-input="${sku}"]`);
      if (!input) return;
      setQuantityInput(input, normalizeQuantity(input.value) - 1);
      updateCardPrices();
      pulseProductSelection(sku);
    });
  });

  $$("[data-qty-input]").forEach((input) => {
    input.setAttribute("min", "1");
    input.setAttribute("max", String(MAX_ITEM_QTY));
    input.setAttribute("inputmode", "numeric");
    input.addEventListener("input", updateCardPrices);
    input.addEventListener("change", () => {
      setQuantityInput(input, input.value);
      updateCardPrices();
      const sku = input.getAttribute("data-qty-input");
      if (sku) pulseProductSelection(sku);
    });
  });

  $$("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sku = btn.getAttribute("data-add");
      if (!sku) return;
      const qty = currentQty(sku);
      addToCart(sku, currentFormat(sku), qty);
      flashAddFeedback(btn, sku, qty);
    });
  });
}

function bindCartControls() {
  document.addEventListener("click", (event) => {
    const trigger = event.target?.closest?.(
      "[data-cart-open], #cartOpen, #floatingCartOpen",
    );
    if (!trigger || !$("#cartDrawer")) return;
    event.preventDefault();
    openDrawer(trigger);
  });

  $$("[data-cart-close]").forEach((el) =>
    el.addEventListener("click", closeDrawer),
  );

  $("#cartClear")?.addEventListener("click", () => {
    clearCart();
    announceCart("Panier vidé.");
    pulseDrawerChange();
  });

  $("#cartCheckout")?.addEventListener("click", async () => {
    const btn = $("#cartCheckout");
    if (!btn) return;

    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.textContent = "Préparation du paiement…";

    try {
      await startCheckout();
    } finally {
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      btn.textContent = originalLabel;
    }
  });

  document.addEventListener("keydown", (e) => {
    const drawer = $("#cartDrawer");
    if (!drawer?.classList.contains("open")) return;

    if (e.key === "Escape") {
      closeDrawer();
      return;
    }

    if (e.key !== "Tab") return;
    const focusable = drawerFocusableElements(drawer);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
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
      const title = getItemMeta(items[idx]).product?.name || "Cuvée";
      const next = Math.max(1, cur - 1);
      setQty(idx, next);
      announceCart(`${title} : quantité ${next}.`);
      pulseDrawerChange();
      return;
    }

    if (plus != null) {
      const idx = parseInt(plus, 10);
      const items = loadCart();
      const cur = items[idx]?.qty || 1;
      const title = getItemMeta(items[idx]).product?.name || "Cuvée";
      const next = normalizeQuantity(cur + 1);
      setQty(idx, next);
      announceCart(`${title} : quantité ${next}.`);
      pulseDrawerChange();
      return;
    }

    if (rem != null) {
      const idx = parseInt(rem, 10);
      const items = loadCart();
      const title = getItemMeta(items[idx]).product?.name || "Cuvée";
      removeItem(idx);
      announceCart(`${title} retiré du panier.`);
      pulseDrawerChange();
    }
  });

  cartItems.addEventListener("change", (e) => {
    const t = e.target;
    const idxStr = t?.getAttribute?.("data-ci-input");
    if (idxStr == null) return;

    const idx = parseInt(idxStr, 10);
    const qty = normalizeQuantity(t.value || "1");
    const items = loadCart();
    const title = getItemMeta(items[idx]).product?.name || "Cuvée";
    setQty(idx, qty);
    announceCart(`${title} : quantité ${qty}.`);
    pulseDrawerChange();
  });
}

function init() {
  replaceCloseIcons();
  ensureCartLiveStatus();
  bindProductControls();
  bindCartControls();
  window.addEventListener("cart:updated", renderCart);
  window.addEventListener("site:navigation-ready", renderCart);
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
        "La page de paiement ne répond pas pour l’instant. Votre panier reste conservé.",
    );
  });
}

init();
