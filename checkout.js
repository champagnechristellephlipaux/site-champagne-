import { loadCart } from "./cart.js?v=20260630b";

const CONTACT_HELP =
  "\nVotre panier reste conservé. La maison peut reprendre la commande avec vous : +33 6 82 20 34 30 ou champagne.christelle.phlipaux@gmail.com.";

function notifyCheckoutIssue(message, { showContact = true } = {}) {
  const fullMessage = `${message}${showContact ? CONTACT_HELP : ""}`;
  window.dispatchEvent(
    new CustomEvent("checkout:issue", {
      detail: { message: fullMessage },
    }),
  );

  if (!document.querySelector("#cartDrawer")) {
    alert(fullMessage);
  }
}

export async function startCheckout() {
  const items = loadCart();
  if (!items.length) {
    notifyCheckoutIssue("Choisissez d’abord une cuvée.", {
      showContact: false,
    });
    return;
  }

  window.location.href = "checkout.html";
}
