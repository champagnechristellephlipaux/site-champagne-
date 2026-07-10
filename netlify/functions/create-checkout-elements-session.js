const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
      error: "Le paiement en ligne doit être confirmé par la maison.",
    });
  }

  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    return json(500, {
      error: "La clé publique Stripe doit être configurée avant paiement.",
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
  const returnUrl = `${origin}/merci.html?session_id={CHECKOUT_SESSION_ID}`;

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "elements",
      mode: "payment",
      locale: "fr",
      return_url: returnUrl,
      line_items: lineItemsForStripe(items),
      billing_address_collection: "auto",
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ["FR"],
      },
      shipping_options: buildShippingOptions(shipping.shippingTotalCents),
      client_reference_id: reference,
      customer_creation: "if_required",
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
        terms_accepted: "pending",
      },
    });

    return json(200, {
      id: session.id,
      clientSecret: session.client_secret,
      client_secret: session.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      orderReference: reference,
      shipping,
      items: items.map((item) => ({
        sku: item.sku,
        format: item.format,
        quantity: item.quantity,
        name: item.name,
        formatLabel: item.formatLabel,
      })),
    });
  } catch (error) {
    console.error("create-checkout-elements-session", error);
    return json(500, {
      error: "La page de paiement ne répond pas pour l’instant.",
    });
  }
};
