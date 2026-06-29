const {
  computeSummary,
  json,
  parseBody,
  readStore,
  requireAdmin,
  sortByNewest,
  writeStore,
} = require("./reviews-store");

function adminReview(item) {
  return {
    id: item.id,
    status: item.status || "pending",
    author: item.author,
    city: item.city,
    email: item.email,
    title: item.title,
    body: item.body,
    rating: item.rating,
    cuvee: item.cuvee,
    context: item.context || "",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    publishedAt: item.publishedAt || "",
    featured: Boolean(item.featured),
    verifiedOrder: Boolean(item.verifiedOrder),
    stripeSessionId: item.stripeSessionId || "",
    orderReference: item.orderReference || "",
    photos: Array.isArray(item.photos) ? item.photos : [],
  };
}

function counts(reviews) {
  return reviews.reduce(
    (acc, item) => {
      const status = item.status || "pending";
      acc[status] = (acc[status] || 0) + 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, pending: 0, published: 0, hidden: 0 },
  );
}

function updateReview(reviews, id, updater) {
  let found = false;
  const next = reviews.map((item) => {
    if (item.id !== id) return item;
    found = true;
    return updater(item);
  });
  return { found, reviews: next };
}

exports.handler = async (event) => {
  const auth = requireAdmin(event);
  if (!auth.ok) return auth.response;

  if (event.httpMethod === "GET") {
    const store = await readStore();
    const reviews = sortByNewest(store.reviews || []).map(adminReview);
    return json(200, {
      updated_at: store.updated_at,
      counts: counts(reviews),
      summary: computeSummary(store.reviews || []),
      reviews,
    });
  }

  if (event.httpMethod !== "POST" && event.httpMethod !== "PATCH") {
    return json(405, { error: "Action non autorisée." });
  }

  const body = parseBody(event);
  const id = String(body.id || "").trim();
  const action = String(body.action || "").trim();

  if (!id || !action) {
    return json(400, { error: "Action ou avis manquant." });
  }

  const store = await readStore();
  const now = new Date().toISOString();

  if (action === "delete") {
    const before = store.reviews.length;
    store.reviews = store.reviews.filter((item) => item.id !== id);
    if (store.reviews.length === before) {
      return json(404, { error: "Avis introuvable." });
    }
    await writeStore(store);
    return json(200, { ok: true, action, id });
  }

  const allowed = {
    publish: "published",
    hide: "hidden",
    pending: "pending",
  };
  const nextStatus = allowed[action];

  if (!nextStatus) {
    return json(400, { error: "Action inconnue." });
  }

  const updated = updateReview(store.reviews, id, (item) => ({
    ...item,
    status: nextStatus,
    updatedAt: now,
    publishedAt: nextStatus === "published" ? item.publishedAt || now : "",
  }));

  if (!updated.found) {
    return json(404, { error: "Avis introuvable." });
  }

  store.reviews = updated.reviews;
  await writeStore(store);

  return json(200, { ok: true, action, id, status: nextStatus });
};
