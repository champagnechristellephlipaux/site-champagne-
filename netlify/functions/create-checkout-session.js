// Netlify Function: create-checkout-session
// Shipping rule A:
// - 2.50€ per bottle (37.5cl / 75cl / Magnum)
// - Cartons (6x75cl) = livraison offerte
// - If carton + bottles => bottles still pay shipping

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const CARTON_PRICE_IDS = new Set([
  "price_1SmaZKD96OJnHwPGN8q7dO4p", // Brut carton
  "price_1SmafdD96OJnHwPGVksA6qXc", // Rosé carton
  "price_1SmahBD96OJnHwPGv9kaNvSK", // Demi-sec carton
]);

const SHIPPING_PER_BOTTLE_CENTS = 250;

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const line_items = body.line_items || [];

    let bottleCount = 0;
    for (const item of line_items) {
      if (!item?.price || !item?.quantity) continue;
      if (CARTON_PRICE_IDS.has(item.price)) continue;
      bottleCount += item.quantity;
    }

    const shippingAmount = bottleCount * SHIPPING_PER_BOTTLE_CENTS;

    const success_url = process.env.SUCCESS_URL;
    const cancel_url = process.env.CANCEL_URL;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      shipping_address_collection: { allowed_countries: ["FR"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingAmount,
              currency: "eur",
            },
            display_name:
              shippingAmount === 0
                ? "Livraison offerte (carton)"
                : `Livraison (${bottleCount} bouteille(s) × 2,50€)`,
          },
        },
      ],
      success_url: success_url + "?session_id={CHECKOUT_SESSION_ID}",
      cancel_url,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  }
};