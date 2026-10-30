import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { PRICE_EUR } from "../shop-config.js";

const root = process.cwd();
const htmlFiles = fs
  .readdirSync(root)
  .filter((file) => file.endsWith(".html"))
  .sort();
const pages = new Map(
  htmlFiles.map((file) => [
    file,
    fs.readFileSync(path.join(root, file), "utf8"),
  ]),
);

for (const [file, html] of pages) {
  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  assert.equal(h1Count, 1, `${file} doit contenir exactement un H1`);

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(
    ids.length,
    new Set(ids).size,
    `${file} contient des identifiants HTML dupliqués`,
  );

  for (const match of html.matchAll(
    /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    assert.doesNotThrow(
      () => JSON.parse(match[1]),
      `${file} contient un JSON-LD invalide`,
    );
  }

  for (const match of html.matchAll(/<img\b[\s\S]*?>/gi)) {
    assert.match(match[0], /\bwidth="\d+"/, `${file} : image sans largeur`);
    assert.match(match[0], /\bheight="\d+"/, `${file} : image sans hauteur`);
  }

  for (const match of html.matchAll(/\bhref="([^"]+)"/g)) {
    const href = match[1];
    if (
      !href ||
      /^(?:https?:|mailto:|tel:|javascript:)/.test(href) ||
      href.startsWith("/")
    ) {
      continue;
    }

    const [rawTarget, fragment] = href.split("#");
    const target = rawTarget || file;
    if (!target.endsWith(".html")) continue;
    assert.ok(
      pages.has(target),
      `${file} pointe vers une page absente : ${target}`,
    );

    if (fragment) {
      const targetHtml = pages.get(target);
      assert.match(
        targetHtml,
        new RegExp(
          `\\bid="${fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
        ),
        `${file} pointe vers une ancre absente : ${href}`,
      );
    }
  }

  const canonical = html.match(
    /<link\b[^>]*href="([^"]+)"[^>]*rel="canonical"/i,
  );
  if (canonical?.[1]?.startsWith("http")) {
    assert.ok(
      canonical[1].startsWith("https://www.champagne-christelle-phlipaux.com/"),
      `${file} utilise un domaine canonique inattendu`,
    );
  }

  for (const match of html.matchAll(
    /<meta\b[^>]*content="([^"]+)"[^>]*(?:property="og:image"|name="twitter:image")[^>]*>/gi,
  )) {
    assert.match(
      match[1],
      /^https:\/\/www\.champagne-christelle-phlipaux\.com\/assets\//,
      `${file} doit utiliser une URL absolue du domaine officiel pour ses images de partage`,
    );
  }

  const header = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0];
  const headerLogo = header?.match(
    /<img\b[\s\S]*?class="brand-logo"[\s\S]*?>/i,
  )?.[0];
  if (headerLogo) {
    assert.doesNotMatch(
      headerLogo,
      /loading="lazy"/i,
      `${file} ne doit pas différer le logo visible dans l’en-tête`,
    );
  }

  for (const match of html.matchAll(
    /\b(?:href|src)="((?!https?:|\/)[^"]+\.(?:css|js))(\?[^\"]*)?"/gi,
  )) {
    assert.ok(
      match[2]?.includes("v="),
      `${file} charge un fichier CSS/JS sans version de cache : ${match[1]}`,
    );
  }
}

const depositariesHtml = pages.get("depositaires.html");
assert.match(
  depositariesHtml,
  /data-map-src="https:\/\/www\.google\.com\/maps\//,
  "La carte des dépositaires doit rester sans chargement tiers avant action",
);
assert.doesNotMatch(
  depositariesHtml,
  /<iframe\b[^>]*\ssrc="https:\/\/www\.google\.com\/maps\//,
  "L’iframe Google Maps ne doit pas avoir de src initial",
);
assert.match(
  depositariesHtml,
  /map-loader\.js\?v=/,
  "La page Dépositaires doit charger le contrôleur de carte versionné",
);

const merchantProducts = [
  {
    file: "brut-tradition.html",
    sku: "brut",
    name: "Champagne Brut Tradition 75 cl – Christelle Phlipaux",
    price: "18.00",
  },
  {
    file: "brut-rose.html",
    sku: "rose",
    name: "Champagne Brut Rosé 75 cl – Christelle Phlipaux",
    price: "20.00",
  },
  {
    file: "demi-sec.html",
    sku: "demisec",
    name: "Champagne Demi-Sec 75 cl – Christelle Phlipaux",
    price: "18.00",
  },
  {
    file: "coffret-decouverte-champagne.html",
    sku: "coffret-decouverte",
    name: "Coffret découverte Champagne 3 × 75 cl – Christelle Phlipaux",
    price: "56.00",
  },
];

for (const expected of merchantProducts) {
  const html = pages.get(expected.file);
  const structuredItems = [
    ...html.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].flatMap((match) => {
    const data = JSON.parse(match[1]);
    return Array.isArray(data) ? data : [data];
  });
  const product = structuredItems.find(
    (item) => item?.["@type"] === "Product" && item.sku === expected.sku,
  );
  assert.ok(product, `${expected.file} doit exposer son produit Merchant`);
  assert.equal(
    product.name,
    expected.name,
    `${expected.file} doit utiliser un nom produit précis et cohérent`,
  );
  const alcoholProperty = product.additionalProperty?.find(
    (property) => property?.name === "Titre alcoométrique volumique",
  );
  assert.ok(
    alcoholProperty,
    `${expected.file} doit exposer le degré d’alcool dans ses données produit`,
  );
  assert.match(
    alcoholProperty.value,
    /12 % vol\./,
    `${expected.file} doit annoncer le degré d’alcool confirmé`,
  );
  assert.match(
    html,
    /12 % vol\./,
    `${expected.file} doit afficher le degré d’alcool aux visiteurs`,
  );

  const offers = Array.isArray(product.offers)
    ? product.offers
    : [product.offers];
  assert.equal(
    offers.length,
    1,
    `${expected.file} ne doit exposer que le format 75 cl principal à Merchant`,
  );
  const offer = offers[0];
  assert.equal(offer.price, expected.price, `${expected.file} : prix Merchant`);
  assert.equal(
    offer.priceCurrency,
    "EUR",
    `${expected.file} : devise Merchant`,
  );
  assert.equal(
    offer.availability,
    "https://schema.org/InStock",
    `${expected.file} : disponibilité Merchant`,
  );
  assert.equal(
    offer.itemCondition,
    "https://schema.org/NewCondition",
    `${expected.file} : état Merchant`,
  );
  assert.equal(
    offer.url,
    product.url,
    `${expected.file} doit envoyer Merchant vers sa fiche produit directe`,
  );
  assert.match(
    html,
    /property="product:availability"/,
    `${expected.file} doit exposer la disponibilité dans ses métadonnées`,
  );
  assert.match(
    html,
    /Disponible/,
    `${expected.file} doit afficher la disponibilité aux visiteurs`,
  );
}

const merchantFeedPath = path.join(root, "merchant-center-feed.xml");
assert.ok(
  fs.existsSync(merchantFeedPath),
  "Le flux Merchant doit être généré avec npm run merchant:feed",
);
const merchantFeed = fs.readFileSync(merchantFeedPath, "utf8");
assert.match(
  merchantFeed,
  /xmlns:g="http:\/\/base\.google\.com\/ns\/1\.0"/,
  "Le flux Merchant doit déclarer l’espace de noms Google",
);
const merchantItems = [...merchantFeed.matchAll(/<item>([\s\S]*?)<\/item>/g)];
assert.equal(
  merchantItems.length,
  4,
  "Le flux Merchant doit contenir 4 produits",
);

const feedExpectations = [
  {
    id: "brut-tradition-75cl",
    sku: "brut",
    format: "750",
    path: "/brut-tradition.html",
  },
  {
    id: "brut-rose-75cl",
    sku: "rose",
    format: "750",
    path: "/brut-rose.html",
  },
  {
    id: "demi-sec-75cl",
    sku: "demisec",
    format: "750",
    path: "/demi-sec.html",
  },
  {
    id: "coffret-decouverte-3x75cl",
    sku: "coffret-decouverte",
    format: "coffret3",
    path: "/coffret-decouverte-champagne.html",
  },
];

for (const expected of feedExpectations) {
  const item = merchantItems.find((entry) =>
    entry[1].includes(`<g:id>${expected.id}</g:id>`),
  )?.[1];
  assert.ok(item, `Produit absent du flux Merchant : ${expected.id}`);
  const expectedPrice = PRICE_EUR[expected.sku][expected.format].toFixed(2);
  assert.match(
    item,
    new RegExp(`<g:price>${expectedPrice} EUR<\\/g:price>`),
    `Prix du flux Merchant incorrect : ${expected.id}`,
  );
  assert.match(
    item,
    new RegExp(
      `<g:link>https:\\/\\/www\\.champagne-christelle-phlipaux\\.com${expected.path.replaceAll(".", "\\.")}<\\/g:link>`,
    ),
    `URL du flux Merchant incorrecte : ${expected.id}`,
  );
  assert.match(
    item,
    /<g:identifier_exists>no<\/g:identifier_exists>/,
    `Le flux doit signaler l’absence de GTIN : ${expected.id}`,
  );
  assert.match(
    item,
    /<g:google_product_category>499676<\/g:google_product_category>/,
    `Catégorie Google alcool incorrecte : ${expected.id}`,
  );
  assert.match(
    item,
    /<g:availability>in_stock<\/g:availability>/,
    `Disponibilité du flux Merchant incorrecte : ${expected.id}`,
  );
  assert.match(
    item,
    /<g:description>[^<]*12 % vol\./,
    `Le degré d’alcool doit figurer dans le flux Merchant : ${expected.id}`,
  );
}

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const sitemapUrls = new Set();
const today = new Date().toISOString().slice(0, 10);
const sitemapEntries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)];
assert.ok(sitemapEntries.length, "Le sitemap doit contenir des URL publiques");

for (const entry of sitemapEntries) {
  const loc = entry[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
  const lastmod = entry[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  assert.ok(loc, "Chaque entrée du sitemap doit contenir une URL");
  assert.ok(lastmod, `Le sitemap doit dater sa dernière modification : ${loc}`);
  assert.match(
    lastmod,
    /^\d{4}-\d{2}-\d{2}$/,
    `Date lastmod invalide pour ${loc}`,
  );
  assert.ok(lastmod <= today, `Date lastmod future pour ${loc}`);
  assert.ok(!sitemapUrls.has(loc), `URL dupliquée dans le sitemap : ${loc}`);
  sitemapUrls.add(loc);

  const url = new URL(loc);
  const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  assert.ok(pages.has(file), `Le sitemap référence une page absente : ${file}`);
  assert.doesNotMatch(
    pages.get(file),
    /<meta\b[^>]*content="[^"]*noindex/i,
    `Le sitemap référence une page noindex : ${file}`,
  );
}

const redirects = fs.readFileSync(path.join(root, "_redirects"), "utf8");
assert.match(
  redirects,
  /https:\/\/champagnechristellephlipaux\.netlify\.app\/\*\s+https:\/\/www\.champagne-christelle-phlipaux\.com\/:splat\s+301!/,
  "L'ancien sous-domaine Netlify doit rediriger vers le domaine officiel",
);
assert.match(
  redirects,
  /https:\/\/elegant-melomakarona-6f213a\.netlify\.app\/\*\s+https:\/\/www\.champagne-christelle-phlipaux\.com\/:splat\s+301!/,
  "Le sous-domaine Netlify actif doit rediriger vers le domaine officiel",
);

const netlifyConfig = fs.readFileSync(path.join(root, "netlify.toml"), "utf8");
assert.match(
  netlifyConfig,
  /frame-src[^"\n]*https:\/\/www\.google\.com/,
  "La CSP doit autoriser la carte Google des dépositaires",
);

const immersiveCss = fs.readFileSync(
  path.join(root, "assets/css/immersive-experience.css"),
  "utf8",
);
const pendingRevealRule = immersiveCss.match(
  /\.immersive-reveal-ready \.immersive-reveal:not\(\.is-visible\)\s*\{([^}]*)\}/,
)?.[1];
assert.ok(pendingRevealRule, "La règle de révélation progressive doit exister");
assert.doesNotMatch(
  pendingRevealRule,
  /opacity:\s*0\b|visibility:\s*hidden\b|display:\s*none\b/,
  "Une animation en attente ne doit jamais masquer le contenu",
);

console.log(
  `${htmlFiles.length} pages validées : structure, liens, images, JSON-LD et sitemap.`,
);
