import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const reviewsModule = require("../netlify/functions/google-reviews.js");
const { handler, _test } = reviewsModule;

const previousFetch = global.fetch;
const previousEnv = {
  apiKey: process.env.GOOGLE_PLACES_API_KEY,
  placeId: process.env.GOOGLE_PLACE_ID,
  profileUrl: process.env.GOOGLE_MAPS_PROFILE_URL,
};

try {
  delete process.env.GOOGLE_PLACES_API_KEY;
  delete process.env.GOOGLE_PLACE_ID;
  delete process.env.GOOGLE_MAPS_PROFILE_URL;

  const unconfigured = await handler({ httpMethod: "GET" });
  const unconfiguredBody = JSON.parse(unconfigured.body);
  assert.equal(unconfigured.statusCode, 200);
  assert.equal(unconfiguredBody.configured, false);
  assert.equal(unconfigured.headers["Cache-Control"], "no-store, max-age=0");

  const rejectedMethod = await handler({ httpMethod: "POST" });
  assert.equal(rejectedMethod.statusCode, 405);

  assert.equal(_test.safeGoogleUrl("javascript:alert(1)"), "");
  assert.equal(_test.safeGoogleUrl("https://example.com/review"), "");
  assert.match(
    _test.safeGoogleUrl("https://www.google.com/maps/place/example"),
    /^https:\/\/www\.google\.com\//,
  );

  process.env.GOOGLE_PLACES_API_KEY = "test-secret-key";
  process.env.GOOGLE_PLACE_ID = "test-place-id";
  global.fetch = async (_url, options) => {
    assert.equal(options.headers["X-Goog-Api-Key"], "test-secret-key");
    assert.match(options.headers["X-Goog-FieldMask"], /reviews/);
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          displayName: { text: "Champagne Christelle Phlipaux" },
          rating: 4.9,
          userRatingCount: 12,
          googleMapsUri: "https://www.google.com/maps/place/example",
          reviews: [
            {
              name: "places/test/reviews/1",
              rating: 5,
              text: { text: "Accueil chaleureux.", languageCode: "fr" },
              originalText: {
                text: "Accueil chaleureux.",
                languageCode: "fr",
              },
              authorAttribution: {
                displayName: "Cliente test",
                uri: "https://www.google.com/maps/contrib/1",
                photoUri: "https://lh3.googleusercontent.com/avatar",
              },
              googleMapsUri: "https://www.google.com/maps/reviews/1",
              visitDate: { year: 2026, month: 9 },
            },
          ],
        };
      },
    };
  };

  const configured = await handler({ httpMethod: "GET" });
  const configuredBody = JSON.parse(configured.body);
  assert.equal(configured.statusCode, 200);
  assert.equal(configuredBody.available, true);
  assert.equal(configuredBody.place.reviewCount, 12);
  assert.equal(configuredBody.reviews.length, 1);
  assert.equal(configuredBody.reviews[0].visitDate.month, 9);
  assert.doesNotMatch(configured.body, /test-secret-key/);

  console.log(
    "Avis Google validés : configuration absente, méthode, URLs, attribution et réponse Places.",
  );
} finally {
  global.fetch = previousFetch;

  if (previousEnv.apiKey === undefined)
    delete process.env.GOOGLE_PLACES_API_KEY;
  else process.env.GOOGLE_PLACES_API_KEY = previousEnv.apiKey;

  if (previousEnv.placeId === undefined) delete process.env.GOOGLE_PLACE_ID;
  else process.env.GOOGLE_PLACE_ID = previousEnv.placeId;

  if (previousEnv.profileUrl === undefined) {
    delete process.env.GOOGLE_MAPS_PROFILE_URL;
  } else {
    process.env.GOOGLE_MAPS_PROFILE_URL = previousEnv.profileUrl;
  }
}
