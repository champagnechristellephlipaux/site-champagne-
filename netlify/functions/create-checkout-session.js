// Netlify Function: create-checkout-session
// Netlify Function: create-checkout-session
// Shipping rules (manuel, selon nb de bouteilles)
// - Livraison offerte dès 6 bouteilles (équivalent 75cl, carton inclus)
// - 1 bouteille: 12€ | 2: 10€ | 3: 6€ | 4-5: 10€
// - Magnum: 10€ par magnum (cumulatif)

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const MAX_ITEM_QTY = 48;

const ALLOWED_PRICE_IDS = new Map([
  ["price_1TmbcPD96OJnHwPGeEMqIjYX", { bottles75: 0, magnums: 0 }], // Coffret découverte, livraison offerte
  ["price_1SuZHHD96OJnHwPGwtcGoAWf", { bottles75: 1, magnums: 0 }], // Brut 75cl
  ["price_1SwjyPD96OJnHwPGvyvJuQEZ", { bottles75: 0, magnums: 1 }], // Brut magnum
  ["price_1SuZIdD96OJnHwPGUzPgaC7b", { bottles75: 6, magnums: 0 }], // Brut carton
  ["price_1SuZJvD96OJnHwPGzGSNXU4j", { bottles75: 1, magnums: 0 }], // Demi-sec 75cl
  ["price_1SwjzND96OJnHwPGJSfyYl4Z", { bottles75: 0, magnums: 1 }], // Demi-sec magnum
  ["price_1SuZKnD96OJnHwPGtpalrKg2", { bottles75: 6, magnums: 0 }], // Demi-sec carton
  ["price_1SuZDcD96OJnHwPGV9Snay25", { bottles75: 1, magnums: 0 }], // Rosé 75cl
  ["price_1SuZF5D96OJnHwPGYqH6CCaf", { bottles75: 6, magnums: 0 }], // Rosé carton
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
        display_name: amount === 0 ? "Livraison offerte" : "Livraison soignée",
        delivery_estimate: {
          minimum: { unit: "business_day", value: 2 },
          maximum: { unit: "business_day", value: 5 },
        },
      },
    },
  ];
}

function withCheckoutSessionId(url) {
  if (url.includes("{CHECKOUT_SESSION_ID}") || url.includes("session_id=")) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}session_id={CHECKOUT_SESSION_ID}`;
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
      const price = typeof item?.price === "string" ? item.price : "";
      const quantity = Number(item?.quantity);
      if (!price) {
        return json(400, {
          error: "Ce format doit être confirmé par la maison avant paiement.",
        });
      }
      if (!ALLOWED_PRICE_IDS.has(price)) {
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
      normalizedLineItems.push({ price, quantity });
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
      const shippingUnits = ALLOWED_PRICE_IDS.get(item.price);
      bottles75 += shippingUnits.bottles75 * q;
      magnums += shippingUnits.magnums * q;
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

    const origin =
      event.headers.origin ||
      event.headers.Origin ||
      "https://champagnechristellephlipaux.netlify.app";

    const success_url = withCheckoutSessionId(
      process.env.SUCCESS_URL || `${origin}/merci.html`,
    );
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
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ["FR"] },
      shipping_options,
      custom_fields: [
        {
          key: "instructions_livraison",
          label: {
            type: "custom",
            custom: "Instructions de livraison",
          },
          type: "text",
          optional: true,
        },
        {
          key: "nom_destinataire",
          label: {
            type: "custom",
            custom: "Nom du destinataire si différent",
          },
          type: "text",
          optional: true,
        },
      ],
      consent_collection: {
        terms_of_service: "required",
      },
      custom_text: {
        shipping_address: {
          message:
            "Livraison en France métropolitaine. Le numéro de téléphone facilite le suivi du transport.",
        },
        submit: {
          message:
            "Dernière vérification : montant, adresse et livraison avant paiement.",
        },
        terms_of_service_acceptance: {
          message: "J’accepte les conditions générales de vente.",
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
