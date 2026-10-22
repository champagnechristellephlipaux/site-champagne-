import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const blobsModulePath = require.resolve("@netlify/blobs");
const ordersStorePath = require.resolve("../netlify/functions/orders-store.js");
const originalBlobsModule = require.cache[blobsModulePath];
const originalOrdersStoreModule = require.cache[ordersStorePath];
const calls = [];
const writes = [];
const lambdaEvent = {
  blobs: "contexte-netlify-encode",
  headers: {
    "x-nf-deploy-id": "deploy-validation",
    "x-nf-site-id": "site-validation",
  },
};

try {
  require.cache[blobsModulePath] = {
    id: blobsModulePath,
    filename: blobsModulePath,
    loaded: true,
    exports: {
      connectLambda: (event) => {
        calls.push({ method: "connectLambda", event });
      },
      getStore: (options) => {
        calls.push({ method: "getStore", options });
        return {
          set: async (key, value, options) => {
            writes.push({ key, value, options });
          },
        };
      },
    },
    children: [],
    paths: [],
  };
  delete require.cache[ordersStorePath];

  const { saveOrder } = require(ordersStorePath);
  const order = {
    session_id: "cs_live_blobvalidation",
    order_reference: "CCP-BLOB-VALIDATION",
    payment_status: "paid",
  };

  await saveOrder(order, lambdaEvent);
  await saveOrder(order, lambdaEvent);

  assert.equal(calls[0].method, "connectLambda");
  assert.equal(calls[0].event, lambdaEvent);
  assert.equal(calls[1].method, "getStore");
  assert.deepEqual(calls[1].options, { name: "ccp-orders" });
  assert.equal(writes.length, 2);
  assert.deepEqual(
    writes.map(({ key }) => key),
    [
      "orders/cs_live_blobvalidation.json",
      "orders/cs_live_blobvalidation.json",
    ],
    "Les nouvelles tentatives Stripe doivent conserver une clé idempotente",
  );
  assert.deepEqual(writes[0].options, {
    contentType: "application/json; charset=utf-8",
  });
  assert.equal(
    JSON.parse(writes[0].value).order_reference,
    order.order_reference,
  );

  console.log(
    "Initialisation Netlify Blobs et stockage idempotent du webhook validés.",
  );
} finally {
  delete require.cache[ordersStorePath];
  if (originalOrdersStoreModule) {
    require.cache[ordersStorePath] = originalOrdersStoreModule;
  }
  if (originalBlobsModule) {
    require.cache[blobsModulePath] = originalBlobsModule;
  } else {
    delete require.cache[blobsModulePath];
  }
}
