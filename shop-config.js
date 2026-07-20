// Configuration d’affichage de la boutique.
// Les identifiants Stripe et la validation finale des montants restent
// exclusivement côté serveur dans netlify/functions/checkout-shared.js.

export const PRICE_EUR = {
  "coffret-decouverte": {
    coffret3: 75,
  },
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

export const PRODUCTS = [
  {
    sku: "coffret-decouverte",
    name: "Coffret découverte",
    image: "assets/coffret-decouverte-champagne-christelle-phlipaux.webp",
  },
  {
    sku: "brut",
    name: "Brut Tradition",
    image: "assets/brut.webp",
  },
  {
    sku: "rose",
    name: "Brut Rosé",
    image: "assets/rose.webp",
  },
  {
    sku: "demisec",
    name: "Demi-Sec",
    image: "assets/demisec.webp",
  },
];

export const FORMATS = [
  {
    key: "coffret3",
    label: "Coffret 3 × 75 cl",
    hint: "Brut Tradition, Brut Rosé, Demi-Sec · livraison offerte",
  },
  { key: "750", label: "75 cl", hint: "Format de service" },
  { key: "magnum", label: "Magnum 1,5 L", hint: "Grande table" },
  { key: "carton6", label: "Carton (6 × 75 cl)", hint: "Livraison offerte" },
];

export const CURATED_OFFERS = {
  "trio-decouverte": {
    name: "Coffret découverte",
    summary: "Brut Tradition, Brut Rosé et Demi-Sec en 75 cl",
    focus: "Trois cuvées pour découvrir la maison, livraison offerte",
    items: [{ sku: "coffret-decouverte", format: "coffret3", qty: 1 }],
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
