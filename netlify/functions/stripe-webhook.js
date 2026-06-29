const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { json } = require("./checkout-shared");

function rawBody(event) {
  return Buffer.from(
    event.body || "",
    event.isBase64Encoded ? "base64" : "utf8",
  );
}

function compactAddress(address) {
  if (!address) return null;
  return {
    line1: address.line1 || "",
    line2: address.line2 || "",
    postal_code: address.postal_code || "",
    city: address.city || "",
    country: address.country || "",
  };
}

async function buildCompletedOrder(session) {
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
  });
  const details = session.customer_details || {};
  const shipping = session.shipping_details || {};

  return {
    session_id: session.id,
    order_reference:
      session.metadata?.order_reference || session.client_reference_id || "",
    payment_status: session.payment_status,
    amount_total: session.amount_total,
    currency: session.currency,
    customer: {
      name: details.name || "",
      email: details.email || session.customer_email || "",
      phone: details.phone || "",
      billing_address: compactAddress(details.address),
    },
    shipping: {
      name: shipping.name || "",
      address: compactAddress(shipping.address),
      amount_total: session.shipping_cost?.amount_total || 0,
    },
    products: lineItems.data.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      amount_total: item.amount_total,
      currency: item.currency,
    })),
    metadata: session.metadata || {},
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Webhook Stripe uniquement." });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return json(500, {
      error: "Le webhook Stripe doit être configuré côté Netlify.",
    });
  }

  const signature =
    event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody(event),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("stripe-webhook signature", error.message);
    return json(400, { error: `Webhook Stripe invalide: ${error.message}` });
  }

  try {
    if (stripeEvent.type === "checkout.session.completed") {
      const order = await buildCompletedOrder(stripeEvent.data.object);
      console.info("checkout.session.completed", JSON.stringify(order));
    }

    return json(200, { received: true });
  } catch (error) {
    console.error("stripe-webhook handler", error);
    return json(500, {
      error: "Le webhook Stripe n’a pas pu être traité.",
    });
  }
};
