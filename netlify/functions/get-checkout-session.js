const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { json } = require("./checkout-shared");

function safeSessionId(value) {
  const id = String(value || "").trim();
  return /^cs_(test|live)_[A-Za-z0-9]+$/.test(id) ? id : "";
}

function maskedEmail(session) {
  const details = session.customer_details || {};
  const email = details.email || session.customer_email || "";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "";
  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"•".repeat(Math.max(3, localPart.length - visible.length))}@${domain}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, {
      error: "Cette vérification doit être appelée depuis la page merci.",
    });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return json(500, {
      error: "La vérification Stripe n’est pas configurée.",
    });
  }

  const sessionId = safeSessionId(event.queryStringParameters?.session_id);
  if (!sessionId) {
    return json(400, {
      error: "La référence de paiement est manquante.",
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
    });

    return json(200, {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer: {
        email: maskedEmail(session),
      },
      order_reference:
        session.metadata?.order_reference || session.client_reference_id || "",
      line_items: lineItems.data.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        amount_total: item.amount_total,
        currency: item.currency,
      })),
    });
  } catch (error) {
    console.error("get-checkout-session", error);
    return json(500, {
      error: "La commande n’a pas pu être vérifiée pour le moment.",
    });
  }
};
