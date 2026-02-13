// Configuration boutique (prix & Price IDs Stripe)
//
// 1) Les PRIX (EUR) ci-dessous correspondent à ce que vous m’avez donné.
// 2) Pour activer le paiement en panier, remplacez les placeholders "price_..._PLACEHOLDER"
//    par vos vrais identifiants Stripe (Price IDs), ex: price_1Pxxxxxx...
//
// Où les trouver ? Stripe > Produits > (produit) > Prix > ID (price_...)

export const PRICE_EUR = {
  "brut": {
    "750": 22.5,
    "magnum": 49,
    "carton6": 135
  },
  "demisec": {
    "750": 22.5,
    "magnum": 49,
    "carton6": 135
  },
  "rose": {
    "750": 25,
    "carton6": 150
  }
};

export const STRIPE_PRICE_IDS = {
  "brut": {
    "750": "price_1SuZHHD96OJnHwPGwtcGoAWf",
    "magnum": "price_1SwjyPD96OJnHwPGvyvJuQEZ",
    "carton6": "price_1SuZIdD96OJnHwPGUzPgaC7b"
  },
  "demisec": {
    "750": "price_1SuZJvD96OJnHwPGzGSNXU4j",
    "magnum": "price_1SwjzND96OJnHwPGJSfyYl4Z",
    "carton6": "price_1SuZKnD96OJnHwPGtpalrKg2"
  },
  "rose": {
    "750": "price_1SuZDcD96OJnHwPGV9Snay25",
    "carton6": "price_1SuZF5D96OJnHwPGYqH6CCaf"
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
  { key: "750", label: "75 cl", hint: "Bouteille" },
  { key: "magnum", label: "Magnum 1,5 L", hint: "Format fête" },
  { key: "carton6", label: "Carton (6 × 75 cl)", hint: "Idéal réception" },
];
