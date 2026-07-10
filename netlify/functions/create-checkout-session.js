const {
  buildShippingOptions,
  cartSignature,
  json,
  lineItemsForStripe,
  normalizeCart,
  orderReference,
  parseJsonBody,
  shippingFromItems,
  siteOrigin,
  TERMS_VERSION,
} = require("./checkout-shared");
const { createStripeClient } = require("./stripe-client");

const stripe = createStripeClient();

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return json(405, {
      error: "Ouvrez le paiement depuis votre panier.",
    });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return json(500, {
      error: "Le paiement en ligne doit être configuré côté Netlify.",
    });
  }

  const body = parseJsonBody(event);
  if (!body) {
    return json(400, {
      error: "Le panier n’a pas pu être lu. Rouvrez-le pour continuer.",
    });
  }

  let items;
  try {
    items = normalizeCart(body.cart || body.items);
  } catch (error) {
    return json(400, { error: error.message });
  }

  const shipping = shippingFromItems(items);
  const reference = orderReference();
  const origin = siteOrigin(event);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "fr",
      success_url: `${origin}/merci.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/boutique.html`,
      line_items: lineItemsForStripe(items),
      billing_address_collection: "auto",
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ["FR"],
      },
      shipping_options: buildShippingOptions(shipping.shippingTotalCents),
      client_reference_id: reference,
      customer_creation: "if_required",
      submit_type: "pay",
      custom_text: {
        submit: {
          message:
            "En validant le paiement, vous confirmez avoir lu et accepté les conditions générales de vente de Champagne Christelle Phlipaux.",
        },
      },
      metadata: {
        channel: "site",
        maison: "Champagne Christelle Phlipaux",
        order_reference: reference,
        cart: cartSignature(items),
        bottles75: String(shipping.bottles75),
        magnums: String(shipping.magnums),
        free_discovery_boxes: String(shipping.freeDiscoveryBoxes || 0),
        shipping_cents: String(shipping.shippingTotalCents),
        terms_version: TERMS_VERSION,
        terms_accepted: "stripe_checkout",
      },
    });

    if (!session.url) {
      throw new Error("Stripe n’a pas retourné d’URL de paiement.");
    }

    return json(200, {
      id: session.id,
      url: session.url,
      orderReference: reference,
    });
  } catch (error) {
    console.error("create-checkout-session", error);
    return json(500, {
      error: "Stripe ne peut pas ouvrir le paiement pour le moment.",
    });
  }
};
