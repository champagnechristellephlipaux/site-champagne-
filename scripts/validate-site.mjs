import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

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
    /\b(?:href|src)="((?!https?:|\/)[^"]+\.(?:css|js))(\?[^\"]*)?"/gi,
  )) {
    assert.ok(
      match[2]?.includes("v="),
      `${file} charge un fichier CSS/JS sans version de cache : ${match[1]}`,
    );
  }
}

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const url = new URL(match[1]);
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
  "Le sous-domaine Netlify doit rediriger vers le domaine officiel",
);

const netlifyConfig = fs.readFileSync(path.join(root, "netlify.toml"), "utf8");
assert.match(
  netlifyConfig,
  /frame-src[^"\n]*https:\/\/www\.google\.com/,
  "La CSP doit autoriser la carte Google des dépositaires",
);

console.log(
  `${htmlFiles.length} pages validées : structure, liens, images, JSON-LD et sitemap.`,
);
