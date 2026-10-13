import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import {
  cartTotals as clientCartTotals,
  shippingTotals as clientShippingTotals,
} from "../cart.js";
import { PRICE_EUR } from "../shop-config.js";

const require = createRequire(import.meta.url);
const {
  CATALOG,
  lineItemsForStripe,
  normalizeCart,
  shippingFromItems,
  termsAcceptanceFromSession,
  TERMS_VERSION,
} = require("../netlify/functions/checkout-shared.js");

const temporaryOrdersDir = await fs.mkdtemp(
  path.join(os.tmpdir(), "ccp-orders-"),
);
const originalOrdersLocalStore = process.env.ORDERS_LOCAL_STORE;
process.env.ORDERS_LOCAL_STORE = temporaryOrdersDir;
const { saveOrder } = require("../netlify/functions/orders-store.js");

const expectedPrices = {
  "coffret-decouverte": { coffret3: 56 },
  brut: { 750: 18, magnum: 40, carton6: 108 },
  demisec: { 750: 18, magnum: 40, carton6: 108 },
  rose: { 750: 20, carton6: 120 },
};

const expectedStripePriceIds = {
  "coffret-decouverte": {
    coffret3: "price_1UPd16D96OJnHwPGJP0SZlIE",
  },
  brut: {
    750: "price_1SmWpbD96OJnHwPGXHehtam4",
    magnum: "price_1UPcvZD96OJnHwPGRx7U3ZQ5",
    carton6: "price_1UPcw0D96OJnHwPGErK0n5vh",
  },
  demisec: {
    750: "price_1UPd4lD96OJnHwPGM0vRZwRv",
    magnum: "price_1UPd5bD96OJnHwPGa1kljMhc",
    carton6: "price_1UPd53D96OJnHwPGGKe926sS",
  },
  rose: {
    750: "price_1UPd2sD96OJnHwPG7OIsfI9o",
    carton6: "price_1UPd3KD96OJnHwPGL1L7ifTx",
  },
};

assert.deepEqual(
  PRICE_EUR,
  expectedPrices,
  "La grille tarifaire client doit rester alignée sur les prix approuvés",
);

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
    if (serverFormat.priceId) {
      assert.match(
        serverFormat.priceId,
        /^price_[A-Za-z0-9]+$/,
        `Price ID Stripe invalide : ${sku}/${format}`,
      );
    }
  }
}

for (const [sku, formats] of Object.entries(expectedStripePriceIds)) {
  for (const [format, priceId] of Object.entries(formats)) {
    assert.equal(
      CATALOG[sku].formats[format].priceId,
      priceId,
      `Price ID Stripe divergent : ${sku}/${format}`,
    );
  }
}

const scenarios = [
  {
    cart: [{ sku: "brut", format: "750", qty: 1 }],
    shippingCents: 1200,
  },
  {
    cart: [{ sku: "brut", format: "750", qty: 2 }],
    shippingCents: 1000,
  },
  {
    cart: [{ sku: "brut", format: "750", qty: 3 }],
    shippingCents: 600,
  },
  {
    cart: [{ sku: "brut", format: "750", qty: 4 }],
    shippingCents: 1000,
  },
  {
    cart: [{ sku: "brut", format: "750", qty: 5 }],
    shippingCents: 1000,
  },
  {
    cart: [{ sku: "brut", format: "750", qty: 6 }],
    shippingCents: 0,
  },
  {
    cart: [{ sku: "brut", format: "magnum", qty: 2 }],
    shippingCents: 2000,
  },
  {
    cart: [{ sku: "brut", format: "carton6", qty: 1 }],
    shippingCents: 0,
  },
  {
    cart: [{ sku: "coffret-decouverte", format: "coffret3", qty: 1 }],
    shippingCents: 500,
  },
  {
    cart: [
      { sku: "coffret-decouverte", format: "coffret3", qty: 1 },
      { sku: "brut", format: "750", qty: 1 },
    ],
    shippingCents: 1000,
  },
  {
    cart: [
      { sku: "coffret-decouverte", format: "coffret3", qty: 1 },
      { sku: "brut", format: "magnum", qty: 1 },
    ],
    shippingCents: 1600,
  },
  {
    cart: [
      { sku: "coffret-decouverte", format: "coffret3", qty: 1 },
      { sku: "brut", format: "750", qty: 3 },
    ],
    shippingCents: 0,
  },
  {
    cart: [
      { sku: "rose", format: "750", qty: 3 },
      { sku: "demisec", format: "magnum", qty: 1 },
    ],
    shippingCents: 1600,
  },
];

for (const { cart, shippingCents } of scenarios) {
  const client = clientShippingTotals(cart);
  const normalized = normalizeCart(cart);
  const server = shippingFromItems(normalized);
  assert.equal(
    server.shippingTotalCents,
    Math.round(client.shippingTotal * 100),
    `Livraison divergente pour ${JSON.stringify(cart)}`,
  );
  assert.equal(
    server.shippingTotalCents,
    shippingCents,
    `Livraison inattendue pour ${JSON.stringify(cart)}`,
  );
  assert.equal(server.bottles75, client.bottles75);
  assert.equal(server.magnums, client.magnums);
  assert.equal(server.discoveryBoxes, client.discoveryBoxes);

  for (const [index, item] of lineItemsForStripe(normalized).entries()) {
    assert.equal(
      item.price,
      normalized[index].price,
      "Le checkout doit utiliser le nouveau Price ID Stripe",
    );
    assert.equal(
      item.price_data,
      undefined,
      "Aucun prix Stripe créé à la volée ne doit remplacer le Price ID configuré",
    );
  }
}

const catalogVariants = [
  { sku: "coffret-decouverte", format: "coffret3" },
  { sku: "brut", format: "750" },
  { sku: "brut", format: "magnum" },
  { sku: "brut", format: "carton6" },
  { sku: "demisec", format: "750" },
  { sku: "demisec", format: "magnum" },
  { sku: "demisec", format: "carton6" },
  { sku: "rose", format: "750" },
  { sku: "rose", format: "carton6" },
];

function independentlyExpectedShippingCents(cart) {
  let bottles75 = 0;
  let magnums = 0;
  let discoveryBoxes = 0;

  for (const item of cart) {
    const quantity = item.qty;
    if (item.format === "750") bottles75 += quantity;
    if (item.format === "carton6") bottles75 += 6 * quantity;
    if (item.format === "magnum") magnums += quantity;
    if (item.sku === "coffret-decouverte" && item.format === "coffret3") {
      bottles75 += 3 * quantity;
      discoveryBoxes += quantity;
    }
  }

  const regularBottles75 = bottles75 - discoveryBoxes * 3;
  let shipping75 = 0;
  if (bottles75 >= 6) shipping75 = 0;
  else if (bottles75 === 4 || bottles75 === 5) shipping75 = 1000;
  else if (bottles75 === 3) {
    shipping75 =
      discoveryBoxes === 1 && regularBottles75 === 0 && magnums === 0
        ? 500
        : 600;
  } else if (bottles75 === 2) shipping75 = 1000;
  else if (bottles75 === 1) shipping75 = 1200;

  return shipping75 + magnums * 1000;
}

function validateGeneratedCart(cart) {
  const client = clientShippingTotals(cart);
  const clientSubtotal = clientCartTotals(cart).subtotal;
  const normalized = normalizeCart(cart);
  const server = shippingFromItems(normalized);
  const expectedShipping = independentlyExpectedShippingCents(cart);
  const expectedSubtotal = cart.reduce(
    (sum, item) =>
      sum + expectedPrices[item.sku][item.format] * Number(item.qty),
    0,
  );
  const serverSubtotal = normalized.reduce(
    (sum, item) => sum + item.unitAmount * item.quantity,
    0,
  );

  assert.equal(clientSubtotal, expectedSubtotal);
  assert.equal(serverSubtotal, Math.round(expectedSubtotal * 100));
  assert.equal(client.shippingTotal * 100, expectedShipping);
  assert.equal(server.shippingTotalCents, expectedShipping);
}

let generatedScenarioCount = 0;
for (const variant of catalogVariants) {
  for (let qty = 1; qty <= 6; qty += 1) {
    validateGeneratedCart([{ ...variant, qty }]);
    generatedScenarioCount += 1;
  }
}
for (let left = 0; left < catalogVariants.length; left += 1) {
  for (let right = left + 1; right < catalogVariants.length; right += 1) {
    validateGeneratedCart([
      { ...catalogVariants[left], qty: 1 },
      { ...catalogVariants[right], qty: 1 },
    ]);
    generatedScenarioCount += 1;
  }
}

const stripeClientPath =
  require.resolve("../netlify/functions/stripe-client.js");
const checkoutHandlerPath =
  require.resolve("../netlify/functions/create-checkout-session.js");
const elementsCheckoutHandlerPath =
  require.resolve("../netlify/functions/create-checkout-elements-session.js");
const statusHandlerPath =
  require.resolve("../netlify/functions/get-checkout-session.js");
const consentHandlerPath =
  require.resolve("../netlify/functions/record-checkout-consent.js");
const webhookHandlerPath =
  require.resolve("../netlify/functions/stripe-webhook.js");
const originalStripeClientModule = require.cache[stripeClientPath];
const originalStripeSecret = process.env.STRIPE_SECRET_KEY;
const originalStripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const originalSiteUrl = process.env.SITE_URL;
const createdSessions = [];
const updatedSessions = [];
const retrievedSessions = [];
let webhookEventType = "checkout.session.completed";
const stripeLineItems = [
  {
    id: "li_validation",
    description: "Coffret découverte",
    quantity: 1,
    amount_total: 5600,
    currency: "eur",
  },
  {
    id: "li_validation_magnum",
    description: "Brut Tradition — Magnum 1,5 L",
    quantity: 1,
    amount_total: 4000,
    currency: "eur",
  },
];
const stripeStub = {
  checkout: {
    sessions: {
      create: async (payload) => {
        createdSessions.push(payload);
        if (payload.ui_mode === "elements") {
          return {
            id: "cs_test_elementsvalidation",
            client_secret: "cs_test_elementsvalidation_secret_validation",
          };
        }
        return {
          id: "cs_test_checkoutvalidation",
          url: "https://checkout.stripe.com/c/pay/cs_test_checkoutvalidation",
        };
      },
      retrieve: async (sessionId) => {
        retrievedSessions.push(sessionId);
        if (sessionId === "cs_test_consentvalidation") {
          return {
            id: sessionId,
            status: "open",
            metadata: { order_reference: "CCP-CONSENT" },
          };
        }
        return {
          id: sessionId,
          status: "complete",
          payment_status: "paid",
          amount_total: 11200,
          currency: "eur",
          customer_details: { email: "alice@example.com" },
          metadata: { order_reference: "CCP-STATUS" },
        };
      },
      update: async (sessionId, payload) => {
        updatedSessions.push({ sessionId, payload });
        return { id: sessionId, ...payload };
      },
      listLineItems: async () => ({ data: stripeLineItems }),
    },
  },
  webhooks: {
    constructEvent: () => ({
      id: "evt_test_checkoutvalidation",
      type: webhookEventType,
      data: {
        object: {
          id: "cs_test_webhookvalidation",
          status: "complete",
          payment_status: "paid",
          amount_total: 11200,
          currency: "eur",
          client_reference_id: "CCP-WEBHOOK",
          customer_details: {
            name: "Client test",
            email: "client@example.com",
            phone: "0600000000",
          },
          collected_information: {
            shipping_details: {
              name: "Client test",
              address: {
                line1: "1 rue du Test",
                postal_code: "10000",
                city: "Troyes",
                country: "FR",
              },
            },
          },
          shipping_cost: { amount_total: 1600 },
          metadata: {
            order_reference: "CCP-WEBHOOK",
            terms_accepted: "stripe_checkout",
            terms_version: TERMS_VERSION,
          },
        },
      },
    }),
  },
};

try {
  require.cache[stripeClientPath] = {
    id: stripeClientPath,
    filename: stripeClientPath,
    loaded: true,
    exports: { createStripeClient: () => stripeStub },
    children: [],
    paths: [],
  };
  process.env.STRIPE_SECRET_KEY = "sk_test_checkout_validation";
  process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_checkout_validation";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_checkout_validation";
  process.env.SITE_URL = "https://www.champagne-christelle-phlipaux.com";

  delete require.cache[checkoutHandlerPath];
  const { handler: createCheckoutHandler } = require(checkoutHandlerPath);
  const checkoutResponse = await createCheckoutHandler({
    httpMethod: "POST",
    headers: { origin: "https://example.invalid" },
    body: JSON.stringify({
      cart: [
        { sku: "coffret-decouverte", format: "coffret3", qty: 1 },
        { sku: "brut", format: "magnum", qty: 1 },
      ],
    }),
  });
  assert.equal(checkoutResponse.statusCode, 200);
  const checkoutBody = JSON.parse(checkoutResponse.body);
  assert.equal(checkoutBody.id, "cs_test_checkoutvalidation");
  assert.match(checkoutBody.url, /^https:\/\/checkout\.stripe\.com\//);
  assert.equal(createdSessions.length, 1);
  const checkoutPayload = createdSessions[0];
  assert.match(
    checkoutPayload.integration_identifier,
    /^ccp_checkout_[a-z]{8}$/,
  );
  assert.deepEqual(checkoutPayload.line_items, [
    {
      price: expectedStripePriceIds["coffret-decouverte"].coffret3,
      quantity: 1,
    },
    { price: expectedStripePriceIds.brut.magnum, quantity: 1 },
  ]);
  assert.equal(
    checkoutPayload.shipping_options[0].shipping_rate_data.fixed_amount.amount,
    1600,
  );
  assert.equal(
    checkoutPayload.shipping_options[0].shipping_rate_data.delivery_estimate,
    undefined,
    "Stripe ne doit pas afficher un délai de livraison non approuvé",
  );
  assert.equal(checkoutPayload.metadata.shipping_cents, "1600");
  assert.equal(checkoutPayload.metadata.discovery_boxes, "1");
  assert.equal(checkoutPayload.metadata.terms_accepted, "stripe_checkout");
  assert.equal(
    checkoutPayload.success_url,
    "https://www.champagne-christelle-phlipaux.com/merci.html?session_id={CHECKOUT_SESSION_ID}",
  );
  assert.equal(
    checkoutPayload.cancel_url,
    "https://www.champagne-christelle-phlipaux.com/boutique.html",
  );
  assert.deepEqual(checkoutPayload.shipping_address_collection, {
    allowed_countries: ["FR"],
  });

  const invalidCheckoutResponse = await createCheckoutHandler({
    httpMethod: "POST",
    headers: {},
    body: JSON.stringify({
      cart: [{ sku: "inconnu", format: "750", qty: 1 }],
    }),
  });
  assert.equal(invalidCheckoutResponse.statusCode, 400);
  assert.equal(createdSessions.length, 1);

  delete require.cache[elementsCheckoutHandlerPath];
  const { handler: createElementsCheckoutHandler } = require(
    elementsCheckoutHandlerPath,
  );
  const elementsCheckoutResponse = await createElementsCheckoutHandler({
    httpMethod: "POST",
    headers: {},
    body: JSON.stringify({
      cart: [
        { sku: "rose", format: "750", qty: 1 },
        { sku: "demisec", format: "carton6", qty: 1 },
      ],
    }),
  });
  assert.equal(elementsCheckoutResponse.statusCode, 200);
  const elementsCheckoutBody = JSON.parse(elementsCheckoutResponse.body);
  assert.equal(elementsCheckoutBody.id, "cs_test_elementsvalidation");
  assert.equal(
    elementsCheckoutBody.clientSecret,
    "cs_test_elementsvalidation_secret_validation",
  );
  assert.equal(
    elementsCheckoutBody.publishableKey,
    "pk_test_checkout_validation",
  );
  assert.equal(createdSessions.length, 2);
  const elementsCheckoutPayload = createdSessions[1];
  assert.equal(elementsCheckoutPayload.ui_mode, "elements");
  assert.match(
    elementsCheckoutPayload.integration_identifier,
    /^ccp_checkout_[a-z]{8}$/,
  );
  assert.deepEqual(elementsCheckoutPayload.line_items, [
    { price: expectedStripePriceIds.rose[750], quantity: 1 },
    { price: expectedStripePriceIds.demisec.carton6, quantity: 1 },
  ]);
  assert.equal(
    elementsCheckoutPayload.shipping_options[0].shipping_rate_data.fixed_amount
      .amount,
    0,
  );
  assert.equal(
    elementsCheckoutPayload.shipping_options[0].shipping_rate_data
      .delivery_estimate,
    undefined,
  );

  delete require.cache[statusHandlerPath];
  const { handler: statusHandler } = require(statusHandlerPath);
  const statusResponse = await statusHandler({
    httpMethod: "GET",
    queryStringParameters: { session_id: "cs_test_statusvalidation" },
  });
  assert.equal(statusResponse.statusCode, 200);
  const statusBody = JSON.parse(statusResponse.body);
  assert.equal(statusBody.status, "complete");
  assert.equal(statusBody.payment_status, "paid");
  assert.equal(statusBody.amount_total, 11200);
  assert.equal(statusBody.customer.email, "al•••@example.com");
  assert.equal(statusBody.order_reference, "CCP-STATUS");
  assert.equal(statusBody.line_items.length, 2);
  const invalidStatusResponse = await statusHandler({
    httpMethod: "GET",
    queryStringParameters: { session_id: "session-invalide" },
  });
  assert.equal(invalidStatusResponse.statusCode, 400);

  delete require.cache[consentHandlerPath];
  const { handler: consentHandler } = require(consentHandlerPath);
  const consentResponse = await consentHandler({
    httpMethod: "POST",
    body: JSON.stringify({
      sessionId: "cs_test_consentvalidation",
      accepted: true,
    }),
  });
  assert.equal(consentResponse.statusCode, 200);
  assert.equal(updatedSessions.length, 1);
  assert.equal(updatedSessions[0].payload.metadata.terms_accepted, "yes");
  assert.equal(
    updatedSessions[0].payload.metadata.terms_version,
    TERMS_VERSION,
  );
  assert.match(
    updatedSessions[0].payload.metadata.terms_accepted_at,
    /^\d{4}-\d{2}-\d{2}T/,
  );

  delete require.cache[webhookHandlerPath];
  const { handler: webhookHandler } = require(webhookHandlerPath);
  const webhookResponse = await webhookHandler({
    httpMethod: "POST",
    headers: { "stripe-signature": "signature-test" },
    body: "{}",
    isBase64Encoded: false,
  });
  assert.equal(webhookResponse.statusCode, 200);
  const webhookOrder = JSON.parse(
    await fs.readFile(
      path.join(temporaryOrdersDir, "cs_test_webhookvalidation.json"),
      "utf8",
    ),
  );
  assert.equal(webhookOrder.order_reference, "CCP-WEBHOOK");
  assert.equal(webhookOrder.fulfillment_status, "ready");
  assert.equal(webhookOrder.shipping.amount_total, 1600);
  assert.equal(webhookOrder.terms.accepted, true);
  assert.equal(webhookOrder.terms.method, "stripe_checkout_submit");
  assert.equal(webhookOrder.products.length, 2);

  webhookEventType = "checkout.session.async_payment_failed";
  const failedPaymentWebhookResponse = await webhookHandler({
    httpMethod: "POST",
    headers: { "stripe-signature": "signature-test" },
    body: "{}",
    isBase64Encoded: false,
  });
  assert.equal(failedPaymentWebhookResponse.statusCode, 200);
  const failedPaymentOrder = JSON.parse(
    await fs.readFile(
      path.join(temporaryOrdersDir, "cs_test_webhookvalidation.json"),
      "utf8",
    ),
  );
  assert.equal(failedPaymentOrder.fulfillment_status, "payment_failed");
  assert.equal(
    failedPaymentOrder.stripe_event,
    "checkout.session.async_payment_failed",
  );

  webhookEventType = "checkout.session.async_payment_succeeded";
  const succeededPaymentWebhookResponse = await webhookHandler({
    httpMethod: "POST",
    headers: { "stripe-signature": "signature-test" },
    body: "{}",
    isBase64Encoded: false,
  });
  assert.equal(succeededPaymentWebhookResponse.statusCode, 200);
  const succeededPaymentOrder = JSON.parse(
    await fs.readFile(
      path.join(temporaryOrdersDir, "cs_test_webhookvalidation.json"),
      "utf8",
    ),
  );
  assert.equal(succeededPaymentOrder.fulfillment_status, "ready");
  assert.equal(
    succeededPaymentOrder.stripe_event,
    "checkout.session.async_payment_succeeded",
  );

  delete process.env.ORDERS_LOCAL_STORE;
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const webhookStorageFailureResponse = await webhookHandler({
      httpMethod: "POST",
      headers: { "stripe-signature": "signature-test" },
      body: "{}",
      isBase64Encoded: false,
    });
    assert.equal(
      webhookStorageFailureResponse.statusCode,
      500,
      "Le webhook doit répondre en erreur si la commande ne peut pas être stockée, afin que Stripe la retente",
    );
  } finally {
    console.error = originalConsoleError;
    process.env.ORDERS_LOCAL_STORE = temporaryOrdersDir;
  }
} finally {
  for (const modulePath of [
    checkoutHandlerPath,
    elementsCheckoutHandlerPath,
    statusHandlerPath,
    consentHandlerPath,
    webhookHandlerPath,
  ]) {
    delete require.cache[modulePath];
  }
  if (originalStripeClientModule) {
    require.cache[stripeClientPath] = originalStripeClientModule;
  } else {
    delete require.cache[stripeClientPath];
  }
  if (originalStripeSecret === undefined) {
    delete process.env.STRIPE_SECRET_KEY;
  } else {
    process.env.STRIPE_SECRET_KEY = originalStripeSecret;
  }
  if (originalStripePublishableKey === undefined) {
    delete process.env.STRIPE_PUBLISHABLE_KEY;
  } else {
    process.env.STRIPE_PUBLISHABLE_KEY = originalStripePublishableKey;
  }
  if (originalWebhookSecret === undefined) {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  } else {
    process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
  }
  if (originalSiteUrl === undefined) {
    delete process.env.SITE_URL;
  } else {
    process.env.SITE_URL = originalSiteUrl;
  }
}

const stripeIdLineItems = lineItemsForStripe(
  normalizeCart([
    { sku: "coffret-decouverte", format: "coffret3", qty: 1 },
    { sku: "brut", format: "750", qty: 1 },
    { sku: "brut", format: "magnum", qty: 1 },
    { sku: "brut", format: "carton6", qty: 1 },
    { sku: "demisec", format: "750", qty: 1 },
    { sku: "demisec", format: "magnum", qty: 1 },
    { sku: "demisec", format: "carton6", qty: 1 },
    { sku: "rose", format: "750", qty: 1 },
    { sku: "rose", format: "carton6", qty: 1 },
  ]),
);
assert.deepEqual(
  stripeIdLineItems.map((item) => item.price),
  [
    expectedStripePriceIds["coffret-decouverte"].coffret3,
    expectedStripePriceIds.brut[750],
    expectedStripePriceIds.brut.magnum,
    expectedStripePriceIds.brut.carton6,
    expectedStripePriceIds.demisec[750],
    expectedStripePriceIds.demisec.magnum,
    expectedStripePriceIds.demisec.carton6,
    expectedStripePriceIds.rose[750],
    expectedStripePriceIds.rose.carton6,
  ],
  "Tous les formats doivent utiliser les nouveaux Price IDs Stripe",
);

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

  delete process.env.ORDERS_LOCAL_STORE;
  await assert.rejects(
    saveOrder({
      session_id: "cs_test_storage_unavailable",
      order_reference: "CCP-STORAGE-FAIL",
      payment_status: "paid",
    }),
    /stockage durable Netlify Blobs est indisponible/,
    "Le webhook doit échouer pour permettre une nouvelle tentative si le stockage durable est indisponible",
  );
} finally {
  if (originalOrdersLocalStore === undefined) {
    delete process.env.ORDERS_LOCAL_STORE;
  } else {
    process.env.ORDERS_LOCAL_STORE = originalOrdersLocalStore;
  }
  await fs.rm(temporaryOrdersDir, { recursive: true, force: true });
}

console.log(
  `${Object.keys(PRICE_EUR).length} produits, ${scenarios.length} scénarios prioritaires et ${generatedScenarioCount} scénarios générés, checkout, confirmation, webhook, CGV et stockage validés.`,
);
