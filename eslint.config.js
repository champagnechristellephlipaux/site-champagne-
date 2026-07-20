const js = require("@eslint/js");
const globals = require("globals");

const sharedRules = {
  ...js.configs.recommended.rules,
  "no-unused-vars": ["warn", { caughtErrors: "none", argsIgnorePattern: "^_" }],
};

module.exports = [
  {
    ignores: [
      "**/*.zip",
      ".DS_Store",
      "AGENTS.md/**",
      "assets/*.{jpg,jpeg,png,webp,gif,svg,ico}",
      "champagne_christelle_phlipaux_maison_terroir_cuvees_v8/**",
    ],
  },
  {
    files: [
      "admin-reviews.js",
      "consent.js",
      "review-submit.js",
      "reviews.js",
      "selection-assistant.js",
      "ui.js",
    ],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
      },
    },
    rules: sharedRules,
  },
  {
    files: [
      "assets/js/**/*.js",
      "cart.js",
      "cart-ui.js",
      "checkout.js",
      "offers.js",
      "shop-config.js",
    ],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    rules: sharedRules,
  },
  {
    files: ["eslint.config.js", "netlify/functions/**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        exports: "writable",
        module: "readonly",
        require: "readonly",
      },
    },
    rules: sharedRules,
  },
];
