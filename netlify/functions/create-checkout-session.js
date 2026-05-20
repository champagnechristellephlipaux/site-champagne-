// Netlify Function: create-checkout-session
// Netlify Function: create-checkout-session
// Shipping rules (manuel, selon nb de bouteilles)
// - Expédition incluse dès 6 bouteilles (équivalent 75cl, carton inclus)
// - 1 bouteille: 12€ | 2: 10€ | 3: 6€ | 4-5: 10€
// - Magnum: 10€ par magnum (cumulatif)

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const MAX_ITEM_QTY = 48;

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

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

function buildShippingOption(amount) {
  return [
    {
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: { amount, currency: "eur" },
        display_name: amount === 0 ? "Expédition incluse" : "Livraison soignée",
        delivery_estimate: {
          minimum: { unit: "business_day", value: 2 },
          maximum: { unit: "business_day", value: 5 },
        },
      },
    },
  ];
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, {
        error: "Ouvrez le paiement depuis le panier.",
      });
    }

    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, {
        error: "Le panier n’a pas pu être lu. Rouvrez-le pour continuer.",
      });
    }

    const line_items = body.line_items || [];

    if (!Array.isArray(line_items) || line_items.length === 0) {
      return json(400, {
        error: "Choisissez une cuvée avant de continuer.",
      });
    }

    const normalizedLineItems = [];

    for (const item of line_items) {
      const quantity = Number(item?.quantity);
      if (!item?.price) {
        return json(400, {
          error: "Ce format doit être confirmé par la maison avant paiement.",
        });
      }
      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_ITEM_QTY
      ) {
        return json(400, {
          error: "Choisissez une quantité entre 1 et 48 par format.",
        });
      }
      normalizedLineItems.push({ price: item.price, quantity });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return json(500, {
        error: "Le paiement en ligne doit être confirmé par la maison.",
      });
    }

    // Calcul livraison (bouteilles 75cl / cartons / magnums)
    let bottles75 = 0; // équivalent 75cl (carton = 6)
    let magnums = 0;

    for (const item of normalizedLineItems) {
      const q = item.quantity;
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

    // Barème 75cl : expédition incluse dès 6 (carton inclus)
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

    const origin =
      event.headers.origin ||
      event.headers.Origin ||
      "https://champagnechristellephlipaux.netlify.app";

    const success_url = process.env.SUCCESS_URL || `${origin}/merci.html`;
    const cancel_url = process.env.CANCEL_URL || `${origin}/boutique.html`;

    const shipping_options = buildShippingOption(shippingAmount);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: normalizedLineItems,
      success_url,
      cancel_url,
      locale: "fr",
      customer_creation: "if_required",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      shipping_address_collection: { allowed_countries: ["FR"] },
      shipping_options,
      custom_text: {
        shipping_address: {
          message:
            "Livraison en France métropolitaine. Aucun compte client ni téléphone n’est demandé.",
        },
        submit: {
          message:
            "Dernière vérification : montant, adresse et livraison avant paiement.",
        },
      },
      metadata: {
        canal: "site",
        maison: "Champagne Christelle Phlipaux",
      },
    });

    return json(200, { url: session.url });
  } catch (err) {
    console.error(err);
    return json(500, {
      error: "La page de paiement ne répond pas pour l’instant.",
    });
  }
};
