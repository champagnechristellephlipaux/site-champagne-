import { STRIPE_PRICE_IDS } from "./shop-config.js";
import { loadCart, getItemMeta } from "./cart.js";

function validatePriceIds(items){
  const missing = [];
  items.forEach(it => {
    const pid = STRIPE_PRICE_IDS?.[it.sku]?.[it.format];
    if(!pid || pid.includes("PLACEHOLDER")) missing.push(`${it.sku}/${it.format}`);
  });
  return missing;
}

export async function startCheckout(){
  const items = loadCart();
  if(!items.length) return;

  const missing = validatePriceIds(items);
  if(missing.length){
    alert("Paiement non activé : Price IDs Stripe manquants pour :\n- " + missing.join("\n- ") +
      "\n\nRemplace les placeholders dans shop-config.js par les IDs price_... depuis Stripe.");
    return;
  }

  const line_items = items.map(it => ({
    price: STRIPE_PRICE_IDS[it.sku][it.format],
    quantity: it.qty
  }));

  const res = await fetch("/.netlify/functions/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ line_items })
  });

  if(!res.ok){
    const txt = await res.text();
    console.error(txt);
    alert("Erreur paiement. Réessaie plus tard.");
    return;
  }

  const data = await res.json();
  if(data?.url) window.location.href = data.url;
  else alert("Erreur paiement (URL manquante).");
}
