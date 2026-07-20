const fs = require("fs/promises");
const path = require("path");

const STORE_NAME = "ccp-orders";
const LOCAL_STORE_DIR =
  process.env.ORDERS_LOCAL_STORE ||
  path.join(process.cwd(), ".netlify", "orders");

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

function safeFileName(value) {
  return String(value || "").replace(/[^A-Za-z0-9_-]/g, "");
}

async function saveOrder(order) {
  const safeSessionId = safeFileName(order.session_id);
  if (!safeSessionId) {
    throw new Error("Référence de session Stripe invalide.");
  }

  const payload = {
    ...order,
    stored_at: new Date().toISOString(),
  };
  const serialized = JSON.stringify(payload, null, 2);
  const key = `orders/${safeSessionId}.json`;
  const store = getBlobStore();

  if (store) {
    await store.set(key, serialized, {
      contentType: "application/json; charset=utf-8",
    });
    return payload;
  }

  await fs.mkdir(LOCAL_STORE_DIR, { recursive: true });
  await fs.writeFile(
    path.join(LOCAL_STORE_DIR, `${safeSessionId}.json`),
    serialized,
    "utf8",
  );
  return payload;
}

module.exports = {
  saveOrder,
};
