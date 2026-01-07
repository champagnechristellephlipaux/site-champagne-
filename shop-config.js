// Configuration boutique (prix & Price IDs Stripe)
//
// 1) Les PRIX (EUR) ci-dessous correspondent à ce que vous m’avez donné.
// 2) Pour activer le paiement en panier, remplacez les placeholders "price_..._PLACEHOLDER"
//    par vos vrais identifiants Stripe (Price IDs), ex: price_1Pxxxxxx...
//
// Où les trouver ? Stripe > Produits > (produit) > Prix > ID (price_...)

export const PRICE_EUR = {
  "brut": {
    "375": 10,
    "750": 18,
    "magnum": 36,
    "carton6": 120
  },
  "rose": {
    "375": 12,
    "750": 20,
    "magnum": 40,
    "carton6": 140
  },
  "demisec": {
    "375": 10,
    "750": 18,
    "magnum": 36,
    "carton6": 120
  }
};

export const STRIPE_PRICE_IDS = {
  "brut": {
    "375": "price_1SmWpbD96OJnHwPGXHehtam4",
    "750": "price_1SmadHD96OJnHwPGFQHOLm93",
    "magnum": "price_1SmaZzD96OJnHwPGYFDWuDBn",
    "carton6": "price_1SmaZKD96OJnHwPGN8q7dO4p"
  },
  "rose": {
    "375": "price_1SmXMcD96OJnHwPGCHECQVv4",
    "750": "price_1SmafvD96OJnHwPG90qFZbGf",
    "magnum": "price_1SmafnD96OJnHwPGRxpCLGmc",
    "carton6": "price_1SmafdD96OJnHwPGVksA6qXc"
  },
  "demisec": {
    "375": "price_1SmXNeD96OJnHwPG3JeL246S",
    "750": "price_1SmahXD96OJnHwPGpV81yGC0",
    "magnum": "price_1SmahLD96OJnHwPGyansOXTs",
    "carton6": "price_1SmahBD96OJnHwPGv9kaNvSK"
  }
};

export const PRODUCTS = [
  {
    sku: "brut",
    name: "Brut Tradition",
    image: "assets/brut.png"
  },
  {
    sku: "rose",
    name: "Brut Rosé",
    image: "assets/rose.png"
  },
  {
    sku: "demisec",
    name: "Demi-Sec",
    image: "assets/demisec.png"
  },
];

export const FORMATS = [
  { key: "375", label: "37,5 cl", hint: "Demi-bouteille" },
  { key: "750", label: "75 cl", hint: "Bouteille" },
  { key: "magnum", label: "Magnum 1,5 L", hint: "Format fête" },
  { key: "carton6", label: "Carton (6 × 75 cl)", hint: "Idéal réception" },
];
