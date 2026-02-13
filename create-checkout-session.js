// Netlify Function: create-checkout-session
// Netlify Function: create-checkout-session
// Shipping rules (manuel, selon nb de bouteilles)
// - Livraison offerte dès 6 bouteilles (équivalent 75cl, carton inclus)
// - 1 bouteille: 12€ | 2: 10€ | 3: 6€ | 4-5: 10€
// - Magnum: 10€ par magnum (cumulatif)

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const CARTON_PRICE_IDS = new Set([
  "price_1SuZIdD96OJnHwPGUzPgaC7b", // Brut carton
  "price_1SuZKnD96OJnHwPGtpalrKg2", // Demi-sec carton
  "price_1SuZF5D96OJnHwPGYqH6CCaf", // Rosé carton
]);

const BOTTLE_75CL_PRICE_IDS = new Set([
  "price_1SuZHHD96OJnHwPGwtcGoAWf", // Brut 75cl
  "price_1SuZJvD96OJnHwPGzGSNXU4j", // Demi-sec 75cl
  "price_1SuZDcD96OJnHwPGV9Snay25", // Rosé 75cl
]);

const MAGNUM_PRICE_IDS = new Set([
  "price_1SwjyPD96OJnHwPGvyvJuQEZ", // Brut magnum
  "price_1SwjzND96OJnHwPGJSfyYl4Z", // Demi-sec magnum
]);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return { statusCode: 500, body: "Missing STRIPE_SECRET_KEY env var" };
    }

    const body = JSON.parse(event.body || "{}");
    const line_items = body.line_items || [];

    if (!Array.isArray(line_items) || line_items.length === 0) {
      return { statusCode: 400, body: "Missing or empty line_items" };
    }

    // Calcul livraison (bouteilles 75cl / cartons / magnums)
    let bottles75 = 0;   // équivalent 75cl (carton = 6)
    let magnums = 0;

    for (const item of line_items) {
      if (!item?.price || !item?.quantity) continue;
      const q = Number(item.quantity) || 0;

      if (CARTON_PRICE_IDS.has(item.price)) {
        bottles75 += 6 * q;
        continue;
      }
      if (BOTTLE_75CL_PRICE_IDS.has(item.price)) {
        bottles75 += 1 * q;
        continue;
      }
      if (MAGNUM_PRICE_IDS.has(item.price)) {
        magnums += q;
        continue;
      }
      // Inconnu : par défaut, ne compte pas dans la livraison
    }

    // Barème 75cl : livraison offerte dès 6 (carton inclus)
    let shipping75Cents = 0;
    if (bottles75 >= 6) shipping75Cents = 0;
    else if (bottles75 === 5 || bottles75 === 4) shipping75Cents = 1000;
    else if (bottles75 === 3) shipping75Cents = 600;
    else if (bottles75 === 2) shipping75Cents = 1000;
    else if (bottles75 === 1) shipping75Cents = 1200;
    else shipping75Cents = 0;

    // Magnum : 10€ par magnum (cumulatif)
    const shippingMagnumCents = magnums * 1000;

    const shippingAmount = shipping75Cents + shippingMagnumCents;

    // ✅ IMPORTANT : URLs de retour (sinon Stripe peut planter)
    const origin =
      event.headers.origin ||
      event.headers.Origin ||
      "https://champagnechristellephlipaux.netlify.app"; // mets ton domaine ici si tu veux

    const success_url = process.env.SUCCESS_URL || `${origin}/merci.html`;
    const cancel_url = process.env.CANCEL_URL || `${origin}/boutique.html`;

    // Shipping option dynamique
        // Shipping options
        // Utilise les Shipping Rates Stripe fournis quand c'est possible (cas 75cl seuls),
        // sinon utilise un shipping_rate_data dynamique (magnums cumulés / mix / gratuité >=6).
        const SHIPPING_RATE_1_BOTTLE = "shr_1SwjuyD96OJnHwPGjERd7hOa";
        const SHIPPING_RATE_2_BOTTLES = "shr_1SwjvLD96OJnHwPGSSiYRqhw";
        const SHIPPING_RATE_3_BOTTLES = "shr_1SwjvjD96OJnHwPGb9Hwsk0H";

        const shipping_options = (() => {
          // Gratuité dès 6 bouteilles 75cl (carton inclus)
          const free75 = bottles75 >= 6;

          // Si magnums présents, on doit cumuler (10€ / magnum)
          if (magnums > 0) {
            const amount = (free75 ? 0 : shipping75Cents) + shippingMagnumCents;
            return [{
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount, currency: "eur" },
                display_name: amount === 0 ? "Livraison offerte" : "Livraison",
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 2 },
                  maximum: { unit: "business_day", value: 5 },
                },
              },
            }];
          }

          // Aucun magnum : on peut utiliser les Shipping Rates Stripe (plus propre côté dashboard)
          if (free75) {
            return [{
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: 0, currency: "eur" },
                display_name: "Livraison offerte",
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 2 },
                  maximum: { unit: "business_day", value: 5 },
                },
              },
            }];
          }

          if (bottles75 === 1) return [{ shipping_rate: SHIPPING_RATE_1_BOTTLE }];
          if (bottles75 === 2) return [{ shipping_rate: SHIPPING_RATE_2_BOTTLES }];
          if (bottles75 === 3) return [{ shipping_rate: SHIPPING_RATE_3_BOTTLES }];
          if (bottles75 === 4 || bottles75 === 5) return [{ shipping_rate: SHIPPING_RATE_2_BOTTLES }];

          // Aucun item comptabilisé → pas de livraison (cas anormal, fallback)
          return [{
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 0, currency: "eur" },
              display_name: "Livraison",
            },
          }];
        })();

const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url,
      cancel_url,
      shipping_address_collection: { allowed_countries: ["FR"] },
      shipping_options,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || String(err) }),
    };
  }
};
