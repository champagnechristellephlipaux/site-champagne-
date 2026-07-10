import { startCheckout } from "../../checkout.js?v=20260710b";

const errorNode = document.querySelector("[data-checkout-error]");
const submitButton = document.querySelector("[data-checkout-submit]");

function showError(message) {
  if (errorNode) {
    errorNode.hidden = false;
    errorNode.textContent = message;
  }
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
    submitButton.textContent = "Réessayer le paiement";
  }
}

window.addEventListener("checkout:issue", (event) => {
  showError(
    event.detail?.message ||
      "Stripe ne peut pas ouvrir le paiement pour le moment.",
  );
});

if (submitButton) {
  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  submitButton.textContent = "Ouverture de Stripe…";
  submitButton.addEventListener("click", (event) => {
    event.preventDefault();
    startCheckout();
  });
}

startCheckout();
