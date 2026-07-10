const stripePackage = require("stripe");

const STRIPE_API_VERSION =
  process.env.STRIPE_API_VERSION || "2026-03-25.dahlia";

function createStripeClient() {
  return stripePackage(process.env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
  });
}

module.exports = {
  STRIPE_API_VERSION,
  createStripeClient,
};
