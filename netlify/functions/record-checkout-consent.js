const { json, parseJsonBody, TERMS_VERSION } = require("./checkout-shared");
const { createStripeClient } = require("./stripe-client");

const stripe = createStripeClient();

function safeSessionId(value) {
  const id = String(value || "").trim();
  return /^cs_(test|live)_[A-Za-z0-9]+$/.test(id) ? id : "";
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, {
      error: "L’acceptation doit être enregistrée depuis le paiement.",
    });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return json(500, {
      error: "Le paiement en ligne doit être confirmé par la maison.",
    });
  }

  const body = parseJsonBody(event);
  const sessionId = safeSessionId(body?.sessionId);
  if (!sessionId || body?.accepted !== true) {
    return json(400, {
      error: "Veuillez accepter les conditions générales de vente.",
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.status !== "open") {
      return json(409, {
        error: "Cette session de paiement n’est plus modifiable.",
      });
    }

    await stripe.checkout.sessions.update(sessionId, {
      metadata: {
        ...session.metadata,
        terms_accepted: "yes",
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
      },
    });

    return json(200, {
      ok: true,
      termsVersion: TERMS_VERSION,
    });
  } catch (error) {
    console.error("record-checkout-consent", error.message);
    return json(500, {
      error:
        "L’acceptation des conditions n’a pas pu être enregistrée. Aucun paiement n’a été lancé.",
    });
  }
};
