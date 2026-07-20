const {
  computeSummary,
  json,
  publicReview,
  readStore,
  sortByNewest,
} = require("./reviews-store");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Lecture uniquement." });
  }

  const store = await readStore();
  const reviews = sortByNewest(store.reviews || [])
    .filter((item) => item.status === "published")
    .map(publicReview);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
    body: JSON.stringify({
      updated_at: store.updated_at,
      summary: computeSummary(store.reviews || []),
      reviews,
    }),
  };
};
