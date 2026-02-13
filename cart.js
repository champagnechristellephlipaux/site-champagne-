import { PRODUCTS, FORMATS, PRICE_EUR } from "./shop-config.js";

const CART_KEY = "cp_cart_v1";

export function loadCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch(e){ return []; }
}
export function saveCart(items){
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart:updated"));
}
export function addToCart(sku, formatKey, qty=1){
  // Safety: if a format is no longer sold (e.g. rosé magnum), fallback to 75cl
  const safeFormat = (PRICE_EUR?.[sku] && PRICE_EUR[sku][formatKey] != null) ? formatKey : "750";
  const items = loadCart();
  const existing = items.find(i => i.sku===sku && i.format===safeFormat);
  if(existing) existing.qty += qty;
  else items.push({ sku, format: safeFormat, qty });
  saveCart(items);
}
export function setQty(index, qty){
  const items = loadCart();
  if(!items[index]) return;
  items[index].qty = Math.max(1, qty|0);
  saveCart(items);
}
export function removeItem(index){
  const items = loadCart();
  items.splice(index,1);
  saveCart(items);
}
export function clearCart(){ saveCart([]); }

export function formatEuro(n){
  return new Intl.NumberFormat("fr-FR", { style:"currency", currency:"EUR" }).format(n);
}

export function getItemMeta(item){
  const p = PRODUCTS.find(x => x.sku===item.sku);
  const f = FORMATS.find(x => x.key===item.format);
  const price = PRICE_EUR?.[item.sku]?.[item.format] ?? 0;
  return { product:p, format:f, unitPrice:price };
}

export function cartTotals(items){
  let subtotal = 0;
  items.forEach(it => {
    const meta = getItemMeta(it);
    subtotal += (meta.unitPrice || 0) * (it.qty || 0);
  });
  return { subtotal };
}

export function cartCount(items){
  return items.reduce((a,b)=>a+(b.qty||0),0);
}


// --- Livraison (affichage UX) ---
// Règles (75cl / cartons) : livraison offerte dès 6 bouteilles (équivalent 75cl)
// - 1 bouteille : 12€
// - 2 bouteilles : 10€ (total)
// - 3 bouteilles : 6€ (total)
// - 4-5 bouteilles : 10€ (total)
// Magnum : 10€ par magnum (cumulatif)

export function bottles75clEquivalent(items){
  let count = 0;
  items.forEach(it => {
    const q = Number(it.qty || 0);
    if(!q) return;
    if(it.format === "carton6") count += 6 * q;
    else if(it.format === "750") count += 1 * q;
  });
  return count;
}

export function magnumCount(items){
  return items.reduce((acc,it)=> acc + ((it.format==="magnum") ? Number(it.qty||0) : 0), 0);
}

export function shippingTotals(items){
  const b75 = bottles75clEquivalent(items);
  const mags = magnumCount(items);

  let shipping75 = 0;
  if(b75 >= 6) shipping75 = 0;
  else if(b75 === 5 || b75 === 4) shipping75 = 10;
  else if(b75 === 3) shipping75 = 6;
  else if(b75 === 2) shipping75 = 10;
  else if(b75 === 1) shipping75 = 12;
  else shipping75 = 0;

  const shippingMag = mags * 10;

  return { shipping75, shippingMag, shippingTotal: shipping75 + shippingMag, bottles75: b75, magnums: mags };
}
