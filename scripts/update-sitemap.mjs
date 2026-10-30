import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sitemapPath = path.join(root, "sitemap.xml");
const today = new Date().toISOString().slice(0, 10);

function gitOutput(args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function pageFile(url) {
  const pathname = new URL(url).pathname;
  return pathname === "/" ? "index.html" : pathname.slice(1);
}

function lastModified(file) {
  const absolutePath = path.join(root, file);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Page absente du sitemap : ${file}`);
  }

  if (gitOutput(["status", "--porcelain", "--", file])) return today;

  const committedDate = gitOutput(["log", "-1", "--format=%cs", "--", file]);
  if (/^\d{4}-\d{2}-\d{2}$/.test(committedDate)) return committedDate;

  return fs.statSync(absolutePath).mtime.toISOString().slice(0, 10);
}

const sitemap = fs.readFileSync(sitemapPath, "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
);

if (!urls.length) throw new Error("Le sitemap ne contient aucune URL");

const entries = urls
  .map((url) => {
    const lastmod = lastModified(pageFile(url));
    return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
  })
  .join("\n");

fs.writeFileSync(
  sitemapPath,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
);

console.log(`${urls.length} URL datées dans sitemap.xml.`);
