const {
  checkReviewRateLimit,
  createReviewFromSubmission,
  json,
  parseBody,
  readStore,
  writeStore,
} = require("./reviews-store");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return json(405, {
      error: "Envoyez votre avis depuis le formulaire dédié.",
    });
  }

  const input = parseBody(event);

  if (input["bot-field"]) {
    return json(200, {
      ok: true,
      status: "ignored",
    });
  }

  const result = createReviewFromSubmission(input);
  if (result.errors) {
    return json(400, {
      error: "Votre avis n’a pas pu être enregistré.",
      details: result.errors,
    });
  }

  const rateLimit = await checkReviewRateLimit(event);
  if (!rateLimit.allowed) {
    const response = json(429, {
      error:
        "Plusieurs avis ont déjà été transmis récemment. Réessayez un peu plus tard.",
    });
    response.headers["Retry-After"] = String(rateLimit.retryAfterSeconds);
    return response;
  }

  const store = await readStore();
  store.reviews = [result.review, ...(store.reviews || [])];
  await writeStore(store);

  return json(202, {
    ok: true,
    status: "pending",
    message:
      "Merci. Votre avis a bien été reçu et sera relu avant une éventuelle publication.",
  });
};
