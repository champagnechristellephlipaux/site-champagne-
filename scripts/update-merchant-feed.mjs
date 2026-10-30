import fs from "node:fs";
import path from "node:path";

import { PRICE_EUR } from "../shop-config.js";

const root = process.cwd();
const origin = "https://www.champagne-christelle-phlipaux.com";

const products = [
  {
    id: "brut-tradition-75cl",
    sku: "brut",
    title: "Champagne Brut Tradition 75 cl – Christelle Phlipaux",
    description:
      "Champagne Brut Tradition 75 cl à 12 % vol., élaboré à Channes. Une cuvée fraîche et équilibrée pour l’apéritif et la table, vendue directement par la maison.",
    link: "/brut-tradition.html",
    image: "/assets/brut.png",
    additionalImage: "/assets/brut.webp",
    productType: "Champagne > Brut Tradition",
  },
  {
    id: "brut-rose-75cl",
    sku: "rose",
    title: "Champagne Brut Rosé 75 cl – Christelle Phlipaux",
    description:
      "Champagne Brut Rosé 75 cl à 12 % vol., élaboré à Channes. Une cuvée fruitée et fraîche pour l’apéritif, un repas ou un cadeau, vendue directement par la maison.",
    link: "/brut-rose.html",
    image: "/assets/rose.png",
    additionalImage: "/assets/rose.webp",
    productType: "Champagne > Brut Rosé",
  },
  {
    id: "demi-sec-75cl",
    sku: "demisec",
    title: "Champagne Demi-Sec 75 cl – Christelle Phlipaux",
    description:
      "Champagne Demi-Sec 75 cl à 12 % vol., élaboré à Channes. Une cuvée ronde et fraîche pour les desserts et les accords doux, vendue directement par la maison.",
    link: "/demi-sec.html",
    image: "/assets/demisec.png",
    additionalImage: "/assets/demisec.webp",
    productType: "Champagne > Demi-Sec",
  },
  {
    id: "coffret-decouverte-3x75cl",
    sku: "coffret-decouverte",
    format: "coffret3",
    title: "Coffret découverte Champagne 3 × 75 cl – Christelle Phlipaux",
    description:
      "Coffret découverte réunissant trois bouteilles de 75 cl à 12 % vol. : Brut Tradition, Brut Rosé et Demi-Sec, préparées à Channes par la maison.",
    link: "/coffret-decouverte-champagne.html",
    image: "/assets/coffret-decouverte-champagne-christelle-phlipaux.png",
    additionalImage:
      "/assets/coffret-decouverte-champagne-christelle-phlipaux.webp",
    productType: "Champagne > Coffret découverte",
  },
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function absoluteUrl(relativePath) {
  return new URL(relativePath, origin).href;
}

function priceFor(product) {
  const format = product.format || "750";
  const price = PRICE_EUR[product.sku]?.[format];
  if (!Number.isFinite(price)) {
    throw new Error(`Prix Merchant absent pour ${product.sku}/${format}`);
  }
  return `${price.toFixed(2)} EUR`;
}

for (const product of products) {
  for (const relativePath of [
    product.link,
    product.image,
    product.additionalImage,
  ]) {
    if (!fs.existsSync(path.join(root, relativePath.slice(1)))) {
      throw new Error(`Ressource Merchant absente : ${relativePath}`);
    }
  }
}

const items = products
  .map(
    (product) => `    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(product.title)}</g:title>
      <g:description>${escapeXml(product.description)}</g:description>
      <g:link>${escapeXml(absoluteUrl(product.link))}</g:link>
      <g:image_link>${escapeXml(absoluteUrl(product.image))}</g:image_link>
      <g:additional_image_link>${escapeXml(absoluteUrl(product.additionalImage))}</g:additional_image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${priceFor(product)}</g:price>
      <g:brand>Champagne Christelle Phlipaux</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>499676</g:google_product_category>
      <g:product_type>${escapeXml(product.productType)}</g:product_type>
    </item>`,
  )
  .join("\n");

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Champagne Christelle Phlipaux – produits</title>
    <link>${origin}/</link>
    <description>Les cuvées disponibles en vente directe auprès de la maison à Channes.</description>
${items}
  </channel>
</rss>
`;

fs.writeFileSync(path.join(root, "merchant-center-feed.xml"), feed);
console.log(
  `${products.length} produits écrits dans merchant-center-feed.xml.`,
);
