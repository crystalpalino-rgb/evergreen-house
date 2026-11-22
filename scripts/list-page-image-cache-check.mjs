// Which of the eight list pages' on-page ASINs already have a cached Amazon
// product page on disk (saved during earlier curation passes)? Prints the
// cached HTML path per ASIN, and whether that page carries a real image URL.
import fs from "node:fs";
import path from "node:path";

const DIRS = [
  "stocking-stuffers",
  "stocking-men",
  "stocking-teen-boys",
  "stocking-teen-girls",
  "new-year-organized-home",
  "meal-prep-kitchen-reset",
  "small-space-home-fitness",
  "wellness-at-home",
];

const asins = new Set();
for (const d of DIRS) {
  const p = `/home/team/shared/site/src/data/${d}/list-manifest.json`;
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const it of j.items ?? []) if (it.appears_on_page !== false) asins.add(it.asin);
}

// Every cached HTML file anywhere under the shared curation folders.
const roots = ["/home/team/shared/curation", "/home/team/shared/stocking-stuffers"];
const found = new Map();
function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/^[A-Z0-9]{10}\.html$/.test(e.name)) {
      const asin = e.name.slice(0, 10);
      if (!asins.has(asin)) continue;
      const stat = fs.statSync(p);
      if (!found.has(asin) || stat.size > found.get(asin).size) {
        found.set(asin, { path: p, size: stat.size });
      }
    }
  }
}
for (const r of roots) walk(r);

let withImage = 0;
for (const asin of asins) {
  const hit = found.get(asin);
  let note = "no cached page";
  if (hit) {
    const html = fs.readFileSync(hit.path, "utf8");
    const m =
      html.match(/data-old-hires=["']([^"']+)["']/i) ||
      html.match(/id=["']landingImage["'][^>]*?src=["']([^"']+)["']/i) ||
      html.match(/src=["']([^"']+)["'][^>]*?id=["']landingImage["']/i);
    if (m) {
      withImage += 1;
      note = `IMG ${m[1].slice(0, 90)}`;
    } else {
      note = `cached but no image tag (${hit.size} bytes)`;
    }
  }
  console.log(`${asin}  ${note}`);
}
console.log(`\n${asins.size} ASINs, ${found.size} with a cached page, ${withImage} with an image URL`);
