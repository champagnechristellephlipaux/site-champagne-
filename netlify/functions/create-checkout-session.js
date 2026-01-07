// Netlify Function: create-checkout-session
// Shipping rule A:
// - 2.50€ per bottle (37.5cl / 75cl / Magnum)
// - Cartons (6x75cl) = livraison offerte

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const CARTON_PRICE_IDS = new Set([
  "price_1SmadHD96OJnHwPGFQHOLm93", // Brut carton
  "price_1SmafvD96OJnHwPG90qFZbGf", // Rosé carton
  "price_1SmahXD96OJnHwPGpV81yGC0", // Demi-sec carton
]);

const SHIPPING_PER_BOTTLE_CENTS = 250;

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

    // Compter uniquement les bouteilles (pas les cartons)
    let bottleCount = 0;
    for (const item of line_items) {
      if (!item?.price || !item?.quantity) continue;
      if (CARTON_PRICE_IDS.has(item.price)) continue;
      bottleCount += Number(item.quantity);
    }

    const shippingAmount = bottleCount * SHIPPING_PER_BOTTLE_CENTS;

    // ✅ IMPORTANT : URLs de retour (sinon Stripe peut planter)
    const origin =
      event.headers.origin ||
      event.headers.Origin ||
      "https://champagnechristellephlipaux.netlify.app"; // mets ton domaine ici si tu veux

    const success_url = process.env.SUCCESS_URL || `${origin}/merci.html`;
    const cancel_url = process.env.CANCEL_URL || `${origin}/boutique.html`;

    // Shipping option dynamique
    const shipping_options =
      shippingAmount > 0
        ? [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: shippingAmount, currency: "eur" },
                display_name: "Livraison",
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 2 },
                  maximum: { unit: "business_day", value: 5 },
                },
              },
            },
          ]
        : [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: 0, currency: "eur" },
                display_name: "Livraison offerte (carton)",
              },
            },
          ];

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
