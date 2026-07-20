import { CURATED_OFFERS, PRICE_EUR } from "./shop-config.js?v=20260630b";
import { addToCart, formatEuro } from "./cart.js?v=20260630b";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function offerById(id) {
  return CURATED_OFFERS?.[id] || null;
}

function offerTotal(offer) {
  if (!offer?.items) return 0;
  return offer.items.reduce((sum, item) => {
    const unit = PRICE_EUR?.[item.sku]?.[item.format] ?? 0;
    return sum + unit * (item.qty || 0);
  }, 0);
}

function offerBottleCount(offer) {
  if (!offer?.items) return 0;
  return offer.items.reduce((sum, item) => {
    if (item.format === "coffret3") return sum + 3 * (item.qty || 0);
    if (item.format === "carton6") return sum + 6 * (item.qty || 0);
    return sum + (item.qty || 0);
  }, 0);
}

function offerCountLabel(offer) {
  if (!offer?.items?.length) return "";

  if (offer.items.length === 1) {
    const item = offer.items[0];
    const qty = item.qty || 1;

    if (item.format === "magnum") {
      return `${qty} ${qty > 1 ? "magnums" : "magnum"}`;
    }

    if (item.format === "carton6") {
      return `${qty} ${qty > 1 ? "cartons" : "carton"}`;
    }

    if (item.format === "coffret3") {
      const bottles = 3 * qty;
      return `${bottles} ${bottles > 1 ? "bouteilles" : "bouteille"}`;
    }

    return `${qty} ${qty > 1 ? "bouteilles" : "bouteille"}`;
  }

  const total = offerBottleCount(offer);
  return `${total} ${total > 1 ? "bouteilles" : "bouteille"}`;
}

function flashButton(button) {
  const original = button.textContent;
  button.disabled = true;
  button.classList.add("is-success");
  button.textContent = "Ajouté à la sélection";

  window.setTimeout(() => {
    button.disabled = false;
    button.classList.remove("is-success");
    button.textContent = original;
  }, 1200);
}

function fillOfferMeta() {
  $$("[data-offer-price]").forEach((node) => {
    const offer = offerById(node.getAttribute("data-offer-price"));
    if (!offer) return;
    node.textContent = formatEuro(offerTotal(offer));
  });

  $$("[data-offer-count]").forEach((node) => {
    const offer = offerById(node.getAttribute("data-offer-count"));
    if (!offer) return;
    node.textContent = offerCountLabel(offer);
  });
}

function addOfferToCart(offerId) {
  const offer = offerById(offerId);
  if (!offer) return null;

  offer.items.forEach((item) => {
    addToCart(item.sku, item.format, item.qty || 1);
  });

  return offer;
}

function redirectToBoutiqueWithOffer(offerId) {
  sessionStorage.setItem("cp_open_cart", "1");
  sessionStorage.setItem("cp_offer_added", offerId);
  window.location.href = `boutique.html?offer=${encodeURIComponent(offerId)}`;
}

function handleOfferButton(button) {
  const offerId = button.getAttribute("data-offer-add");
  if (!offerId) return;

  const offer = addOfferToCart(offerId);
  if (!offer) return;

  flashButton(button);

  if ($("#cartDrawer")) {
    window.dispatchEvent(
      new CustomEvent("cart:offer-added", {
        detail: { offerId },
      }),
    );
    return;
  }

  window.setTimeout(() => redirectToBoutiqueWithOffer(offerId), 240);
}

function bindOfferButtons() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-offer-add]");
    if (!button) return;
    handleOfferButton(button);
  });
}

function init() {
  fillOfferMeta();
  bindOfferButtons();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
