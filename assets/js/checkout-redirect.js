import { startCheckout } from "../../checkout.js?v=20260911a";

const errorNode = document.querySelector("[data-checkout-error]");
const submitButton = document.querySelector("[data-checkout-submit]");

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

startCheckout();
