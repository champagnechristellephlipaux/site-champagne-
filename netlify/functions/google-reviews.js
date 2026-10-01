const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places";
const GOOGLE_FIELD_MASK = [
  "displayName",
  "rating",
  "userRatingCount",
  "googleMapsUri",
  "reviews",
  "attributions",
].join(",");
const DEFAULT_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Champagne%20Christelle%20Phlipaux%2C%204%20Rue%20de%20Villiers%2C%2010340%20Channes";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
    body: JSON.stringify(body),
  };
}

function cleanText(value, maxLength = 5000) {
  const withoutControls = Array.from(String(value || ""), (character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127 ? " " : character;
  }).join("");

  return withoutControls.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeGoogleUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const allowed = [
      "google.com",
      "google.fr",
      "googleusercontent.com",
      "gstatic.com",
      "maps.app.goo.gl",
    ].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

    return url.protocol === "https:" && allowed ? url.toString() : "";
  } catch (_error) {
    return "";
  }
}

function normalizeVisitDate(value) {
  const year = Number(value?.year);
  const month = Number(value?.month);
  if (!Number.isInteger(year) || year < 2000) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month };
}

function normalizeReview(review) {
  const text = cleanText(review?.text?.text || review?.originalText?.text);
  const originalText = cleanText(review?.originalText?.text);
  const localizedLanguage = cleanText(review?.text?.languageCode, 20);
  const originalLanguage = cleanText(review?.originalText?.languageCode, 20);
  const rating = Math.max(1, Math.min(5, Number(review?.rating) || 5));

  return {
    id: cleanText(review?.name, 240),
    rating,
    text,
    author: {
      name: cleanText(
        review?.authorAttribution?.displayName || "Utilisateur Google",
        120,
      ),
      profileUrl: safeGoogleUrl(review?.authorAttribution?.uri),
      photoUrl: safeGoogleUrl(review?.authorAttribution?.photoUri),
    },
    relativeTime: cleanText(review?.relativePublishTimeDescription, 120),
    publishedAt: cleanText(review?.publishTime, 80),
    visitDate: normalizeVisitDate(review?.visitDate),
    googleMapsUrl: safeGoogleUrl(review?.googleMapsUri),
    flagUrl: safeGoogleUrl(review?.flagContentUri),
    translated: Boolean(
      localizedLanguage &&
      originalLanguage &&
      localizedLanguage !== originalLanguage &&
      text !== originalText,
    ),
    originalLanguage,
  };
}

function normalizeAttributions(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      provider: cleanText(item?.provider, 120),
      providerUrl: safeGoogleUrl(item?.providerUri),
    }))
    .filter((item) => item.provider);
}

async function fetchPlaceDetails({ apiKey, placeId, fetchImpl = fetch }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  const url = new URL(`${PLACES_ENDPOINT}/${encodeURIComponent(placeId)}`);
  url.searchParams.set("languageCode", "fr");
  url.searchParams.set("regionCode", "FR");

  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": GOOGLE_FIELD_MASK,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Google Places a répondu avec le statut ${response.status}.`,
      );
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Lecture uniquement." });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  const configuredMapsUrl = safeGoogleUrl(process.env.GOOGLE_MAPS_PROFILE_URL);
  const fallbackMapsUrl = configuredMapsUrl || DEFAULT_MAPS_URL;

  if (!apiKey || !placeId) {
    return json(200, {
      configured: false,
      available: false,
      googleMapsUrl: fallbackMapsUrl,
      reviews: [],
    });
  }

  try {
    const place = await fetchPlaceDetails({ apiKey, placeId });
    const googleMapsUrl = safeGoogleUrl(place.googleMapsUri) || fallbackMapsUrl;
    const reviews = Array.isArray(place.reviews)
      ? place.reviews.map(normalizeReview).filter((review) => review.id)
      : [];

    return json(200, {
      configured: true,
      available: true,
      place: {
        name: cleanText(place.displayName?.text, 160),
        rating: Number(place.rating) || null,
        reviewCount: Math.max(0, Number(place.userRatingCount) || 0),
        googleMapsUrl,
      },
      googleMapsUrl,
      ordering: "relevance",
      attributions: normalizeAttributions(place.attributions),
      reviews,
    });
  } catch (error) {
    console.error("Google Places reviews unavailable:", error.message);
    return json(502, {
      configured: true,
      available: false,
      googleMapsUrl: fallbackMapsUrl,
      reviews: [],
    });
  }
};

exports._test = {
  cleanText,
  fetchPlaceDetails,
  normalizeReview,
  safeGoogleUrl,
};
