// Configuration boutique (prix & Price IDs Stripe)
//
// 1) Les PRIX (EUR) ci-dessous correspondent à ce que vous m’avez donné.
// 2) Pour activer le paiement en panier, remplacez les placeholders "price_..._PLACEHOLDER"
//    par vos vrais identifiants Stripe (Price IDs), ex: price_1Pxxxxxx...
//
// Où les trouver ? Stripe > Produits > (produit) > Prix > ID (price_...)

export const PRICE_EUR = {
  brut: {
    750: 22.5,
    magnum: 49,
    carton6: 135,
  },
  demisec: {
    750: 22.5,
    magnum: 49,
    carton6: 135,
  },
  rose: {
    750: 25,
    carton6: 150,
  },
};

export const STRIPE_PRICE_IDS = {
  brut: {
    750: "price_1SuZHHD96OJnHwPGwtcGoAWf",
    magnum: "price_1SwjyPD96OJnHwPGvyvJuQEZ",
    carton6: "price_1SuZIdD96OJnHwPGUzPgaC7b",
  },
  demisec: {
    750: "price_1SuZJvD96OJnHwPGzGSNXU4j",
    magnum: "price_1SwjzND96OJnHwPGJSfyYl4Z",
    carton6: "price_1SuZKnD96OJnHwPGtpalrKg2",
  },
  rose: {
    750: "price_1SuZDcD96OJnHwPGV9Snay25",
    carton6: "price_1SuZF5D96OJnHwPGYqH6CCaf",
  },
};

export const PRODUCTS = [
  {
    sku: "brut",
    name: "Brut Tradition",
    image: "assets/brut.png",
  },
  {
    sku: "rose",
    name: "Brut Rosé",
    image: "assets/rose.png",
  },
  {
    sku: "demisec",
    name: "Demi-Sec",
    image: "assets/demisec.png",
  },
];

export const FORMATS = [
  { key: "750", label: "75 cl", hint: "Format de service" },
  { key: "magnum", label: "Magnum 1,5 L", hint: "Grande table" },
  { key: "carton6", label: "Carton (6 × 75 cl)", hint: "Expédition incluse" },
];

export const CURATED_OFFERS = {
  "trio-decouverte": {
    name: "Trio de la maison",
    summary: "Brut Tradition, Brut Rosé et Demi-Sec en 75 cl",
    focus: "Pour lire Channes en trois cuvées, sans discours inutile",
    items: [
      { sku: "brut", format: "750", qty: 1 },
      { sku: "rose", format: "750", qty: 1 },
      { sku: "demisec", format: "750", qty: 1 },
    ],
  },
  "table-de-fete": {
    name: "Table de fête maison",
    summary: "2 Brut Tradition et 1 Brut Rosé",
    focus: "Pour recevoir avec la ligne droite du Brut et l'éclat du Rosé",
    items: [
      { sku: "brut", format: "750", qty: 2 },
      { sku: "rose", format: "750", qty: 1 },
    ],
  },
  "rose-a-offrir": {
    name: "Brut Rosé à offrir",
    summary: "1 bouteille de Brut Rosé 75 cl",
    focus: "Pour remercier avec fruit, tenue et discrétion",
    items: [{ sku: "rose", format: "750", qty: 1 }],
  },
  "magnum-reception": {
    name: "Magnum Réception",
    summary: "1 magnum de Brut Tradition 1,5 L",
    focus: "Pour servir la ligne de Channes à une grande table",
    items: [{ sku: "brut", format: "magnum", qty: 1 }],
  },
  "douceur-gourmande": {
    name: "Demi-Sec gourmand",
    summary: "1 bouteille de Demi-Sec 75 cl",
    focus:
      "Pour le foie gras, les desserts peu sucrés et les accords de contraste",
    items: [{ sku: "demisec", format: "750", qty: 1 }],
  },
  "cadeau-entreprise": {
    name: "Carton Signature Maison",
    summary: "1 carton de 6 Brut Tradition 75 cl",
    focus: "Pour garder le Brut de Channes prêt à servir",
    items: [{ sku: "brut", format: "carton6", qty: 1 }],
  },
};
