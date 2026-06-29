const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const STORE_NAME = "ccp-reviews";
const STORE_KEY = "reviews.json";
const LOCAL_STORE_FILE =
  process.env.REVIEWS_LOCAL_STORE ||
  path.join(process.cwd(), ".netlify", "reviews-local.json");

const CUVEE_LABELS = {
  "brut-tradition": "Brut Tradition",
  "brut tradition": "Brut Tradition",
  brut: "Brut Tradition",
  "brut rose": "Brut Rosé",
  "brut rosé": "Brut Rosé",
  "brut-rose": "Brut Rosé",
  rose: "Brut Rosé",
  rosé: "Brut Rosé",
  "demi-sec": "Demi-Sec",
  "demi sec": "Demi-Sec",
  demisec: "Demi-Sec",
};

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(payload),
  };
}

function getBlobsModule() {
  try {
    return require("@netlify/blobs");
  } catch (_error) {
    try {
      return require("netlify-cli/node_modules/@netlify/blobs");
    } catch (_fallbackError) {
      return null;
    }
  }
}

function getBlobStore() {
  const blobs = getBlobsModule();
  if (!blobs?.getStore) return null;
  try {
    return blobs.getStore({ name: STORE_NAME });
  } catch (_error) {
    return null;
  }
}

function emptyStore() {
  return {
    updated_at: new Date().toISOString(),
    reviews: [],
  };
}

function normalizeText(value, maxLength = 400) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeBody(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 1800);
}

function normalizeCuvee(value) {
  const raw = normalizeText(value, 80);
  const key = raw.toLowerCase();
  return CUVEE_LABELS[key] || "";
}

function normalizeRating(value) {
  const rating = Number.parseInt(value, 10);
  if (!Number.isInteger(rating)) return 0;
  return Math.max(1, Math.min(5, rating));
}

function publicReview(item) {
  return {
    id: item.id,
    author: item.author,
    city: item.city,
    title: item.title,
    body: item.body,
    rating: item.rating,
    cuvee: item.cuvee,
    context: item.context || "",
    date: (item.publishedAt || item.createdAt || "").slice(0, 10),
    featured: Boolean(item.featured),
    published: item.status === "published",
    verifiedOrder: Boolean(item.verifiedOrder),
    photos: Array.isArray(item.photos) ? item.photos : [],
  };
}

function sortByNewest(items) {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt || b.date || "1970-01-01").getTime() -
      new Date(a.createdAt || a.date || "1970-01-01").getTime(),
  );
}

async function readLocalStore() {
  try {
    const text = await fs.readFile(LOCAL_STORE_FILE, "utf8");
    const parsed = JSON.parse(text);
    return {
      updated_at: parsed.updated_at || new Date().toISOString(),
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    };
  } catch (_error) {
    return emptyStore();
  }
}

async function writeLocalStore(data) {
  await fs.mkdir(path.dirname(LOCAL_STORE_FILE), { recursive: true });
  await fs.writeFile(LOCAL_STORE_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function readStore() {
  const store = getBlobStore();
  if (store) {
    try {
      const text = await store.get(STORE_KEY, { type: "text" });
      if (text) {
        const parsed = JSON.parse(text);
        return {
          updated_at: parsed.updated_at || new Date().toISOString(),
          reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
        };
      }
    } catch (_error) {
      // Local development can run without a configured Blobs context.
    }
  }

  return readLocalStore();
}

async function writeStore(data) {
  const payload = {
    updated_at: new Date().toISOString(),
    reviews: sortByNewest(data.reviews || []),
  };

  const store = getBlobStore();
  if (store) {
    try {
      await store.set(STORE_KEY, JSON.stringify(payload, null, 2), {
        contentType: "application/json; charset=utf-8",
      });
      return payload;
    } catch (_error) {
      // Keep local testing possible when Blobs is not configured.
    }
  }

  await writeLocalStore(payload);
  return payload;
}

function createReviewFromSubmission(input) {
  const author = normalizeText(input.prenom || input.nom_affiche, 80);
  const city = normalizeText(input.ville, 80);
  const email = normalizeText(input.email, 180).toLowerCase();
  const cuvee = normalizeCuvee(input.cuvee);
  const rating = normalizeRating(input.note || input.rating);
  const body = normalizeBody(input.commentaire || input.avis);
  const title =
    normalizeText(input.titre, 120) ||
    (cuvee ? `Avis sur ${cuvee}` : "Avis client");
  const rgpd =
    input.rgpd === true ||
    input.rgpd === "on" ||
    input.rgpd === "true" ||
    input.rgpd === "oui";

  const errors = [];
  if (!author) errors.push("Indiquez un prénom ou un pseudo.");
  if (!city) errors.push("Indiquez une ville.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Indiquez une adresse e-mail valide.");
  }
  if (!cuvee) errors.push("Choisissez la cuvée concernée.");
  if (!rating) errors.push("Choisissez une note de 1 à 5.");
  if (body.length < 20) {
    errors.push("Votre avis doit contenir au moins quelques mots.");
  }
  if (!rgpd) {
    errors.push("Vous devez accepter le traitement de votre avis.");
  }

  if (errors.length) {
    return { errors };
  }

  const createdAt = new Date().toISOString();
  const emailHash = crypto.createHash("sha256").update(email).digest("hex");

  return {
    review: {
      id: crypto.randomUUID(),
      status: "pending",
      author,
      city,
      email,
      emailHash,
      title,
      body,
      rating,
      cuvee,
      context: normalizeText(input.contexte || input.type_retour, 120),
      createdAt,
      updatedAt: createdAt,
      publishedAt: "",
      featured: false,
      verifiedOrder: false,
      stripeSessionId: normalizeText(input.stripeSessionId, 160),
      orderReference: normalizeText(input.orderReference, 160),
      photos: [],
      source: "site",
    },
  };
}

function computeSummary(reviews) {
  const published = reviews.filter((item) => item.status === "published");
  const count = published.length;
  const ratingTotal = published.reduce(
    (sum, item) => sum + (Number(item.rating) || 0),
    0,
  );
  const byCuvee = {};

  published.forEach((item) => {
    if (!item.cuvee) return;
    byCuvee[item.cuvee] = byCuvee[item.cuvee] || {
      count: 0,
      ratingTotal: 0,
    };
    byCuvee[item.cuvee].count += 1;
    byCuvee[item.cuvee].ratingTotal += Number(item.rating) || 0;
  });

  return {
    average: count ? Number((ratingTotal / count).toFixed(1)) : null,
    count,
    byCuvee: Object.fromEntries(
      Object.entries(byCuvee).map(([name, value]) => [
        name,
        {
          count: value.count,
          average: Number((value.ratingTotal / value.count).toFixed(1)),
        },
      ]),
    ),
  };
}

function parseBody(event) {
  const contentType = event.headers?.["content-type"] || "";
  const raw = event.body || "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw || "{}");
    } catch (_error) {
      return {};
    }
  }

  const params = new URLSearchParams(raw);
  return Object.fromEntries(params.entries());
}

function requireAdmin(event) {
  const expected = process.env.REVIEWS_ADMIN_TOKEN || "";
  if (!expected) {
    return {
      ok: false,
      response: json(500, {
        error:
          "La clé d’administration des avis doit être configurée dans Netlify.",
      }),
    };
  }

  const header =
    event.headers?.authorization || event.headers?.Authorization || "";
  const tokenFromHeader = header.replace(/^Bearer\s+/i, "");
  const token =
    tokenFromHeader ||
    event.headers?.["x-admin-token"] ||
    event.queryStringParameters?.token;

  if (token !== expected) {
    return {
      ok: false,
      response: json(401, { error: "Accès administration refusé." }),
    };
  }

  return { ok: true };
}

module.exports = {
  CUVEE_LABELS,
  computeSummary,
  createReviewFromSubmission,
  json,
  normalizeCuvee,
  parseBody,
  publicReview,
  readStore,
  requireAdmin,
  sortByNewest,
  writeStore,
};
