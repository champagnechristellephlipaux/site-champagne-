const {
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
