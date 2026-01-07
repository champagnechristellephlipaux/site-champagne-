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
  const items = loadCart();
  const existing = items.find(i => i.sku===sku && i.format===formatKey);
  if(existing) existing.qty += qty;
  else items.push({ sku, format: formatKey, qty });
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
