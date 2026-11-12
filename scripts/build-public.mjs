import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "dist");

const publicRootFiles = [
  "_redirects",
  "admin-reviews.js",
  "apple-touch-icon.png",
  "cart-ui.js",
  "cart.js",
  "checkout.js",
  "consent.js",
  "favicon-192x192.png",
  "favicon-48x48.png",
  "favicon-96x96.png",
  "favicon.ico",
  "google-reviews.js",
  "map-loader.js",
  "merchant-center-feed.xml",
  "offers.js",
  "review-submit.js",
  "reviews.js",
  "robots.txt",
  "shop-config.js",
  "site.webmanifest",
  "sitemap.xml",
  "style.css",
  "ui.js",
];

const publicDirectories = ["assets", "data"];

function copyRequired(relativePath) {
  const source = path.join(root, relativePath);
  const destination = path.join(output, relativePath);

  if (!fs.existsSync(source)) {
    throw new Error(`Ressource publique absente : ${relativePath}`);
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

const htmlFiles = fs
  .readdirSync(root)
  .filter((file) => file.endsWith(".html"))
  .sort();

for (const file of [...htmlFiles, ...publicRootFiles, ...publicDirectories]) {
  copyRequired(file);
}

const forbiddenPublicPaths = [
  "AGENTS.md",
  "package.json",
  "scripts",
  "drafts",
  ".agents",
  "netlify",
];

for (const relativePath of forbiddenPublicPaths) {
  if (fs.existsSync(path.join(output, relativePath))) {
    throw new Error(
      `Fichier interne présent dans le build public : ${relativePath}`,
    );
  }
}

console.log(
  `${htmlFiles.length} pages et leurs ressources publiques copiées dans dist/.`,
);
