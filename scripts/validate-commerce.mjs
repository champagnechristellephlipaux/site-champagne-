import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import { shippingTotals as clientShippingTotals } from "../cart.js";
import { PRICE_EUR } from "../shop-config.js";

const require = createRequire(import.meta.url);
const {
  CATALOG,
  normalizeCart,
  shippingFromItems,
  termsAcceptanceFromSession,
  TERMS_VERSION,
} = require("../netlify/functions/checkout-shared.js");

const temporaryOrdersDir = await fs.mkdtemp(
  path.join(os.tmpdir(), "ccp-orders-"),
);
process.env.ORDERS_LOCAL_STORE = temporaryOrdersDir;
const { saveOrder } = require("../netlify/functions/orders-store.js");

for (const [sku, formats] of Object.entries(PRICE_EUR)) {
  assert.ok(CATALOG[sku], `Produit serveur manquant : ${sku}`);
  for (const [format, price] of Object.entries(formats)) {
    const serverFormat = CATALOG[sku].formats[format];
    assert.ok(serverFormat, `Format serveur manquant : ${sku}/${format}`);
    assert.equal(
      serverFormat.unitAmount,
      Math.round(price * 100),
      `Prix divergent : ${sku}/${format}`,
    );
    assert.match(
      serverFormat.priceId,
      /^price_[A-Za-z0-9]+$/,
      `Price ID Stripe invalide : ${sku}/${format}`,
    );
  }
}

const scenarios = [
  [{ sku: "brut", format: "750", qty: 1 }],
  [{ sku: "brut", format: "750", qty: 2 }],
  [{ sku: "brut", format: "750", qty: 3 }],
  [{ sku: "brut", format: "750", qty: 4 }],
  [{ sku: "brut", format: "750", qty: 5 }],
  [{ sku: "brut", format: "750", qty: 6 }],
  [{ sku: "brut", format: "magnum", qty: 2 }],
  [{ sku: "brut", format: "carton6", qty: 1 }],
  [{ sku: "coffret-decouverte", format: "coffret3", qty: 1 }],
  [
    { sku: "rose", format: "750", qty: 3 },
    { sku: "demisec", format: "magnum", qty: 1 },
  ],
];

for (const cart of scenarios) {
  const client = clientShippingTotals(cart);
  const server = shippingFromItems(normalizeCart(cart));
  assert.equal(
    server.shippingTotalCents,
    Math.round(client.shippingTotal * 100),
    `Livraison divergente pour ${JSON.stringify(cart)}`,
  );
  assert.equal(server.bottles75, client.bottles75);
  assert.equal(server.magnums, client.magnums);
  assert.equal(server.freeDiscoveryBoxes, client.freeDiscoveryBoxes);
}

assert.match(TERMS_VERSION, /^\d{4}-\d{2}-\d{2}$/);

const checkoutTerms = termsAcceptanceFromSession({
  created: 1783036800,
  metadata: {
    terms_accepted: "stripe_checkout",
    terms_version: TERMS_VERSION,
  },
});
assert.equal(checkoutTerms.accepted, true);
assert.equal(checkoutTerms.method, "stripe_checkout_submit");
assert.match(checkoutTerms.accepted_at, /^\d{4}-\d{2}-\d{2}T/);

const checkboxTerms = termsAcceptanceFromSession({
  metadata: {
    terms_accepted: "yes",
    terms_accepted_at: "2026-07-10T12:00:00.000Z",
    terms_version: TERMS_VERSION,
  },
});
assert.deepEqual(checkboxTerms, {
  accepted: true,
  accepted_at: "2026-07-10T12:00:00.000Z",
  version: TERMS_VERSION,
  method: "site_checkbox",
});

try {
  await saveOrder({
    session_id: "cs_test_validation",
    order_reference: "CCP-TEST",
    payment_status: "paid",
  });
  const storedOrder = JSON.parse(
    await fs.readFile(
      path.join(temporaryOrdersDir, "cs_test_validation.json"),
      "utf8",
    ),
  );
  assert.equal(storedOrder.order_reference, "CCP-TEST");
  assert.equal(storedOrder.payment_status, "paid");
  assert.match(storedOrder.stored_at, /^\d{4}-\d{2}-\d{2}T/);
} finally {
  await fs.rm(temporaryOrdersDir, { recursive: true, force: true });
}

console.log(
  `${Object.keys(PRICE_EUR).length} produits, ${scenarios.length} scénarios de livraison, CGV et stockage de commande validés.`,
);
