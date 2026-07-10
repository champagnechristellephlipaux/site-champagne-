const crypto = require("crypto");

const MAX_ITEM_QTY = 48;
const DEFAULT_SITE_URL = "https://champagne-christelle-phlipaux.com";
const TERMS_VERSION = "2026-06-30";

const CATALOG = {
  "coffret-decouverte": {
    name: "Coffret découverte",
    formats: {
      coffret3: {
        label: "Brut Tradition, Brut Rosé et Demi-Sec en 75 cl",
        priceId: "price_1TmbcPD96OJnHwPGeEMqIjYX",
        unitAmount: 7500,
        bottles75: 0,
        magnums: 0,
        shippingIncluded: true,
      },
    },
  },
  brut: {
    name: "Brut Tradition",
    formats: {
      750: {
        label: "75 cl",
        priceId: "price_1SuZHHD96OJnHwPGwtcGoAWf",
        unitAmount: 2250,
        bottles75: 1,
        magnums: 0,
      },
      magnum: {
        label: "Magnum 1,5 L",
        priceId: "price_1SwjyPD96OJnHwPGvyvJuQEZ",
        unitAmount: 4900,
        bottles75: 0,
        magnums: 1,
      },
      carton6: {
        label: "Carton de 6",
        priceId: "price_1SuZIdD96OJnHwPGUzPgaC7b",
        unitAmount: 13500,
        bottles75: 6,
        magnums: 0,
      },
    },
  },
  demisec: {
    name: "Demi-Sec",
    formats: {
      750: {
        label: "75 cl",
        priceId: "price_1SuZJvD96OJnHwPGzGSNXU4j",
        unitAmount: 2250,
        bottles75: 1,
        magnums: 0,
      },
      magnum: {
        label: "Magnum 1,5 L",
        priceId: "price_1SwjzND96OJnHwPGJSfyYl4Z",
        unitAmount: 4900,
        bottles75: 0,
        magnums: 1,
      },
      carton6: {
        label: "Carton de 6",
        priceId: "price_1SuZKnD96OJnHwPGtpalrKg2",
        unitAmount: 13500,
        bottles75: 6,
        magnums: 0,
      },
    },
  },
  rose: {
    name: "Brut Rosé",
    formats: {
      750: {
        label: "75 cl",
        priceId: "price_1SuZDcD96OJnHwPGV9Snay25",
        unitAmount: 2500,
        bottles75: 1,
        magnums: 0,
      },
      carton6: {
        label: "Carton de 6",
        priceId: "price_1SuZF5D96OJnHwPGYqH6CCaf",
        unitAmount: 15000,
        bottles75: 6,
        magnums: 0,
      },
    },
  },
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

function parseJsonBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch (_error) {
    return null;
  }
}

function normalizeQty(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QTY) {
    return 0;
  }
  return quantity;
}

function normalizeCart(input) {
  if (!Array.isArray(input) || !input.length) {
    throw new Error("Choisissez une cuvée avant de continuer.");
  }

  const grouped = new Map();

  input.forEach((item) => {
    const sku = String(item?.sku || "").trim();
    const format = String(item?.format || "").trim();
    const quantity = normalizeQty(item?.qty ?? item?.quantity);
    const product = CATALOG[sku];
    const formatConfig = product?.formats?.[format];

    if (!product || !formatConfig || !quantity) {
      throw new Error(
        "Un produit du panier n’est pas reconnu. Reprenez la commande depuis la boutique.",
      );
    }

    if (!formatConfig.priceId && !formatConfig.unitAmount) {
      throw new Error(
        "Ce produit doit être confirmé par la maison avant paiement.",
      );
    }

    const key = `${sku}:${format}`;
    const current = grouped.get(key) || {
      sku,
      format,
      quantity: 0,
      product,
      formatConfig,
    };
    current.quantity += quantity;

    if (current.quantity > MAX_ITEM_QTY) {
      throw new Error("Choisissez une quantité entre 1 et 48 par format.");
    }

    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((item) => ({
    sku: item.sku,
    format: item.format,
    quantity: item.quantity,
    name: item.product.name,
    formatLabel: item.formatConfig.label,
    price: item.formatConfig.priceId,
    unitAmount: item.formatConfig.unitAmount || 0,
    bottles75: item.formatConfig.bottles75,
    magnums: item.formatConfig.magnums,
    shippingIncluded: Boolean(item.formatConfig.shippingIncluded),
  }));
}

function shippingFromItems(items) {
  const bottles75 = items.reduce(
    (sum, item) => sum + item.bottles75 * item.quantity,
    0,
  );
  const magnums = items.reduce(
    (sum, item) => sum + item.magnums * item.quantity,
    0,
  );
  const freeDiscoveryBoxes = items.reduce(
    (sum, item) => sum + (item.shippingIncluded ? item.quantity : 0),
    0,
  );

  let shipping75Cents = 0;
  if (bottles75 >= 6) shipping75Cents = 0;
  else if (bottles75 === 5 || bottles75 === 4) shipping75Cents = 1000;
  else if (bottles75 === 3) shipping75Cents = 600;
  else if (bottles75 === 2) shipping75Cents = 1000;
  else if (bottles75 === 1) shipping75Cents = 1200;

  const shippingMagnumCents = magnums * 1000;
  const shippingTotalCents = shipping75Cents + shippingMagnumCents;

  return {
    bottles75,
    magnums,
    shipping75Cents,
    shippingMagnumCents,
    shippingTotalCents,
    freeDiscoveryBoxes,
  };
}

function buildShippingOptions(amount) {
  return [
    {
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: {
          amount,
          currency: "eur",
        },
        display_name:
          amount === 0
            ? "Livraison offerte"
            : "Livraison France métropolitaine",
        delivery_estimate: {
          minimum: { unit: "business_day", value: 2 },
          maximum: { unit: "business_day", value: 5 },
        },
      },
    },
  ];
}

function sanitizeOrigin(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const host = url.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    const isNetlify = host.endsWith(".netlify.app");
    const isKnownDomain =
      host === "champagne-christelle-phlipaux.com" ||
      host === "www.champagne-christelle-phlipaux.com";
    if (isLocal || isNetlify || isKnownDomain) {
      return url.origin;
    }
  } catch (_error) {
    return "";
  }
  return "";
}

function siteOrigin(event) {
  return (
    process.env.SITE_URL ||
    process.env.URL ||
    sanitizeOrigin(event.headers?.origin || event.headers?.Origin) ||
    DEFAULT_SITE_URL
  ).replace(/\/$/, "");
}

function orderReference() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `CCP-${stamp}-${suffix}`;
}

function cartSignature(items) {
  return items
    .map((item) => `${item.sku}:${item.format}:${item.quantity}`)
    .join("|")
    .slice(0, 500);
}

function lineItemsForStripe(items) {
  const useConfiguredPriceIds = process.env.STRIPE_USE_PRICE_IDS === "true";

  return items.map((item) => ({
    ...(useConfiguredPriceIds && item.price
      ? { price: item.price }
      : {
          price_data: {
            currency: "eur",
            unit_amount: item.unitAmount,
            product_data: {
              name: item.name,
              description: item.formatLabel,
            },
          },
        }),
    quantity: item.quantity,
  }));
}

module.exports = {
  CATALOG,
  DEFAULT_SITE_URL,
  MAX_ITEM_QTY,
  TERMS_VERSION,
  buildShippingOptions,
  cartSignature,
  json,
  lineItemsForStripe,
  normalizeCart,
  orderReference,
  parseJsonBody,
  shippingFromItems,
  siteOrigin,
};
