#!/usr/bin/env node
/**
 * Product photo size audit and repair (owner decision 62, 2026-11-22).
 *
 * Crystal flagged card photos that look blurry. The cause is that some rows
 * carry a small Amazon thumbnail instead of the full size listing photo: the
 * book covers on /stocking-stuffers arrive as 124x160 `images/P/` files even
 * though the URL carries an `_SL1500_` token.
 *
 * This script:
 *   1. collects every product photo on the listing pages (the nine storefront
 *      list manifests plus every active product row in the database, which is
 *      what the room and edit pages render),
 *   2. downloads each distinct file and records its real pixel dimensions,
 *   3. for every file under 500px on the long edge, resolves a full size photo:
 *      the Amazon product page's own main image, then a set of larger URL
 *      forms for the same ASIN,
 *   4. rewrites `products.image_url` and any manifest row that pins the old
 *      URL, all or nothing, with a backup under `curation/`.
 *
 * Usage:
 *   node scripts/fix-product-images.mjs --audit     measure and report only
 *   node scripts/fix-product-images.mjs --dry-run   show the planned repair
 *   node scripts/fix-product-images.mjs --apply     write DB and manifests
 *   node scripts/fix-product-images.mjs --revert    restore from the backup
 *
 * Every number this script prints is measured from the downloaded file.
 */

import { neon } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_DIR = path.join(ROOT, "src", "data");
const BACKUP_PATH = path.join(
  ROOT,
  "curation",
  "product-image-fix-backup-2026-11-22.json"
);
const CACHE_DIR = path.join("/tmp", "eh-image-audit");

/** A file under this on its long edge is broken. */
const MIN_LONG_EDGE = 500;
/** What every listing photo should be after the repair. */
const TARGET_LONG_EDGE = 1000;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const mode = process.argv.includes("--apply")
  ? "apply"
  : process.argv.includes("--dry-run")
    ? "dry-run"
    : process.argv.includes("--revert")
      ? "revert"
      : "audit";

function cacheName(url) {
  return url.replace(/[^a-zA-Z0-9]+/g, "_").slice(-160) + ".bin";
}

async function download(url) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, cacheName(url));
  if (fs.existsSync(file) && fs.statSync(file).size > 200) return file;
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "image/*,*/*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(file, buf);
  return file;
}

/** Real pixel dimensions of a remote image, or null when it is not an image. */
async function measure(url) {
  try {
    const file = await download(url);
    const meta = await sharp(file).metadata();
    if (!meta.width || !meta.height) return null;
    return {
      width: meta.width,
      height: meta.height,
      long: Math.max(meta.width, meta.height),
      bytes: fs.statSync(file).size,
    };
  } catch (err) {
    return { error: err.message };
  }
}

function asinFromUrl(url) {
  if (!url) return null;
  const p = url.match(/\/images\/P\/([A-Z0-9]{10})/i);
  if (p) return p[1].toUpperCase();
  const i = url.match(/\/images\/I\/([A-Za-z0-9+%_-]{8,})/);
  if (i) return null; // an /I/ hash is not an ASIN
  return null;
}

/** Every storefront list manifest in src/data, with its rows. */
function readManifests() {
  const out = [];
  for (const dir of fs.readdirSync(DATA_DIR)) {
    const file = path.join(DATA_DIR, dir, "list-manifest.json");
    if (!fs.existsSync(file)) continue;
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    out.push({ dir, file, json });
  }
  return out;
}

async function loadProducts() {
  const sql = neon(process.env.DATABASE_URL);
  return await sql`select id, name, display_title, amazon_url, image_url, image_width, image_height, room, is_active
                   from products where is_active = true order by id`;
}

/** The ASIN, which lives in the product's Amazon URL, never in its own column. */
function asinFromAmazonUrl(url) {
  if (!url) return null;
  const m = url.match(/\/(?:dp|gp\/product|product)\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}

/**
 * Full size candidates for one broken row, best first. Nothing is invented:
 * each candidate is a URL form of the same ASIN on Amazon's own image host,
 * and it only wins if the downloaded file measures large enough.
 */
function candidates(asin, oldUrl) {
  const list = [];
  if (asin) {
    list.push(
      `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`,
      `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_SX1000_.jpg`,
      `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`,
      `https://m.media-amazon.com/images/P/${asin}.jpg`
    );
  }
  // The same /I/ file at a larger size token, and with the token stripped,
  // which usually serves the original upload.
  if (oldUrl && oldUrl.includes("/images/I/")) {
    const base = oldUrl.match(/(\/images\/I\/[^._]+)/)?.[1];
    if (base) {
      list.push(
        `https://m.media-amazon.com${base}._SL1500_.jpg`,
        `https://m.media-amazon.com${base}._AC_SL1500_.jpg`,
        `https://m.media-amazon.com${base}._SL1200_.jpg`,
        `https://m.media-amazon.com${base}._AC_SL1200_.jpg`,
        `https://m.media-amazon.com${base}.jpg`
      );
    }
  }
  return [...new Set(list)];
}

/** The main image the Amazon product page itself serves. */
async function fromProductPage(asin) {
  if (!asin) return null;
  try {
    const res = await fetch(`https://www.amazon.com/dp/${asin}`, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    // A short page is Amazon's bot check, not the listing.
    if (html.length < 50000) return null;
    const dynamic = html.match(/"hiRes":"(https:[^"]+)"/);
    if (dynamic) return JSON.parse(`"${dynamic[1]}"`);
    const og = html.match(/property="og:image"\s+content="([^"]+)"/);
    if (og) return og[1];
    return null;
  } catch {
    return null;
  }
}

/** Find a photo at least MIN_LONG_EDGE, preferring TARGET_LONG_EDGE. */
async function resolveFullSize(row) {
  const asin = row.asin || asinFromUrl(row.image_url);
  const tried = [];
  const page = await fromProductPage(asin);
  // Same file first: a larger size token on the photo the page already shows
  // keeps the picture identical. The product page's own main image comes last,
  // because it can be a different photo of the same product.
  const list = [...candidates(asin, row.image_url), ...(page ? [page] : [])];
  let best = null;
  for (const url of list) {
    const dims = await measure(url);
    if (!dims || dims.error) {
      tried.push({ url, result: dims?.error ?? "not an image" });
      continue;
    }
    tried.push({ url, result: `${dims.width}x${dims.height}` });
    if (dims.long < MIN_LONG_EDGE) continue;
    if (!best || dims.long > best.dims.long) best = { url, dims };
    if (dims.long >= TARGET_LONG_EDGE) break;
  }
  return { best, tried };
}

async function audit() {
  const products = await loadProducts();
  const manifests = readManifests();

  // Collect every distinct (source, page, asin, url) photo on the listing pages.
  const targets = [];
  for (const p of products) {
    if (!p.image_url) continue;
    targets.push({
      source: "products",
      page: p.room ?? "rooms",
      asin: asinFromAmazonUrl(p.amazon_url),
      name: p.display_title ?? p.name,
      id: p.id,
      image_url: p.image_url,
    });
  }
  for (const m of manifests) {
    for (const item of m.json.items ?? []) {
      if (!item.image_url) continue;
      targets.push({ source: "manifest", page: m.dir, asin: item.asin, name: item.title, image_url: item.image_url });
    }
  }

  const dims = new Map();
  for (const t of targets) {
    if (dims.has(t.image_url)) continue;
    dims.set(t.image_url, await measure(t.image_url));
  }

  const rows = targets.map((t) => {
    const d = dims.get(t.image_url);
    const long = d && !d.error ? d.long : 0;
    return {
      ...t,
      dims: d,
      long,
      // Under 500 is broken. Anything under 1000 is below the size every
      // listing photo should reach, so it is repaired too.
      broken: !d || !!d.error || long < MIN_LONG_EDGE,
      needsFix: !d || !!d.error || long < TARGET_LONG_EDGE,
    };
  });

  const brokenUrls = [...new Set(rows.filter((r) => r.broken).map((r) => r.image_url))];
  return { products, manifests, rows, dims, brokenUrls };
}

function report(rows, dims) {
  const distinct = [...dims.entries()].sort((a, b) => (a[1]?.long ?? 0) - (b[1]?.long ?? 0));
  console.log(`distinct photos measured: ${distinct.length}`);
  console.log(`photos under ${MIN_LONG_EDGE}px on the long edge: ${distinct.filter(([, d]) => !d || d.error || d.long < MIN_LONG_EDGE).length}`);
  console.log(`photos under ${TARGET_LONG_EDGE}px on the long edge: ${distinct.filter(([, d]) => !d || d.error || d.long < TARGET_LONG_EDGE).length}`);
  console.log("");
  console.log("distinct photo | real size | bytes | url");
  for (const [url, d] of distinct) {
    const size = !d || d.error ? `FAILED ${d?.error ?? ""}` : `${d.width}x${d.height}`;
    console.log(`${size.padEnd(12)} | ${String(d?.bytes ?? 0).padStart(8)} | ${url}`);
  }
  console.log("");
  console.log("rows carrying a photo under 1000px:");
  for (const r of rows.filter((r) => r.needsFix)) {
    console.log(
      `  ${r.source}/${r.page} ${r.asin ?? r.id} ${r.name?.slice(0, 60)} -> ${r.dims?.error ?? `${r.dims?.width}x${r.dims?.height}`}`
    );
  }
}

async function plan() {
  const { products, manifests, rows, dims } = await audit();
  report(rows, dims);
  const broken = rows.filter((r) => r.needsFix);
  const fixes = [];
  const seen = new Map();
  for (const row of broken) {
    if (seen.has(row.image_url)) {
      fixes.push({ ...row, new_url: seen.get(row.image_url), new_dims: null });
      continue;
    }
    const { best, tried } = await resolveFullSize(row);
    // Never swap a photo for a smaller one.
    if (!best || best.dims.long <= row.long) {
      fixes.push({ ...row, new_url: null, new_dims: null, tried });
      continue;
    }
    seen.set(row.image_url, best.url);
    fixes.push({ ...row, new_url: best.url, new_dims: best.dims, tried });
  }
  return { products, manifests, fixes };
}

function printPlan(fixes) {
  console.log("");
  console.log("planned repairs:");
  for (const f of fixes) {
    const oldSize = f.dims?.error ? `FAILED ${f.dims.error}` : `${f.dims?.width}x${f.dims?.height}`;
    const newSize = f.new_dims ? `${f.new_dims.width}x${f.new_dims.height}` : "NO FULL SIZE FOUND";
    console.log(`  ${f.source}/${f.page} ${f.asin ?? f.id} | ${oldSize} -> ${newSize}`);
    console.log(`    old ${f.image_url}`);
    console.log(`    new ${f.new_url ?? "(unchanged)"}`);
    if (!f.new_url && f.tried) {
      for (const t of f.tried) console.log(`      tried ${t.url} => ${t.result}`);
    }
  }
  const resolved = fixes.filter((f) => f.new_url).length;
  console.log("");
  console.log(`rows needing a repair: ${fixes.length}, resolved: ${resolved}`);
}

async function apply() {
  const { products, manifests, fixes } = await plan();
  const usable = fixes.filter((f) => f.new_url);
  if (!usable.length) {
    console.log("nothing to apply");
    return;
  }
  // The backup is cumulative: a second run keeps the original value recorded
  // by the first run, so --revert always goes back to the pre-repair state.
  const previous = fs.existsSync(BACKUP_PATH)
    ? JSON.parse(fs.readFileSync(BACKUP_PATH, "utf8"))
    : { products: [], manifests: [] };
  const backup = {
    taken: new Date().toISOString(),
    reason: "product photo size repair (owner decision 62)",
    products: previous.products ?? [],
    manifests: previous.manifests ?? [],
  };
  const backedUpProduct = new Set(backup.products.map((p) => p.id));
  const backedUpManifest = new Set(backup.manifests.map((m) => `${m.page}:${m.asin}`));
  const productById = new Map(products.map((p) => [p.id, p]));
  const touchedProducts = new Set();
  for (const f of usable) {
    if (f.source === "products" && !touchedProducts.has(f.id)) {
      touchedProducts.add(f.id);
      if (backedUpProduct.has(f.id)) continue;
      backup.products.push({
        id: f.id,
        asin: f.asin,
        image_url: productById.get(f.id).image_url,
        image_width: productById.get(f.id).image_width,
        image_height: productById.get(f.id).image_height,
      });
    }
  }
  // A manifest row is rewritten only when it pins the exact old URL.
  const manifestEdits = [];
  for (const m of manifests) {
    let dirty = false;
    for (const item of m.json.items ?? []) {
      const fix = usable.find(
        (f) => f.source === "manifest" && f.page === m.dir && f.asin === item.asin && f.image_url === item.image_url
      );
      if (!fix) continue;
      if (!backedUpManifest.has(`${m.dir}:${item.asin}`)) {
        backup.manifests.push({ page: m.dir, asin: item.asin, image_url: item.image_url });
      }
      item.image_url = fix.new_url;
      dirty = true;
      manifestEdits.push({ page: m.dir, asin: item.asin });
    }
    if (dirty) fs.writeFileSync(m.file, JSON.stringify(m.json, null, 2) + "\n");
  }
  fs.mkdirSync(path.dirname(BACKUP_PATH), { recursive: true });
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(backup, null, 2) + "\n");
  console.log(`backup written: ${path.relative(ROOT, BACKUP_PATH)}`);

  const sql = neon(process.env.DATABASE_URL);
  let updated = 0;
  for (const f of usable) {
    if (f.source !== "products") continue;
    const res = await sql`update products set image_url = ${f.new_url},
                            image_width = ${f.new_dims.width},
                            image_height = ${f.new_dims.height},
                            updated_at = now()
                          where id = ${f.id} and image_url = ${f.image_url}
                          returning id`;
    updated += res.length;
  }
  console.log(`products rows updated: ${updated}`);
  console.log(`manifest rows updated: ${manifestEdits.length}`);
}

async function revert() {
  if (!fs.existsSync(BACKUP_PATH)) {
    console.error(`no backup at ${BACKUP_PATH}`);
    process.exit(1);
  }
  const backup = JSON.parse(fs.readFileSync(BACKUP_PATH, "utf8"));
  const sql = neon(process.env.DATABASE_URL);
  let restored = 0;
  for (const row of backup.products) {
    const res = await sql`update products set image_url = ${row.image_url},
                            image_width = ${row.image_width ?? null},
                            image_height = ${row.image_height ?? null},
                            updated_at = now()
                          where id = ${row.id} returning id`;
    restored += res.length;
  }
  let manifestRestored = 0;
  const byPage = new Map();
  for (const row of backup.manifests) {
    if (!byPage.has(row.page)) byPage.set(row.page, []);
    byPage.get(row.page).push(row);
  }
  for (const [page, rows] of byPage) {
    const file = path.join(DATA_DIR, page, "list-manifest.json");
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const item of json.items ?? []) {
      const row = rows.find((r) => r.asin === item.asin);
      if (!row) continue;
      item.image_url = row.image_url;
      manifestRestored += 1;
    }
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
  }
  console.log(`reverted: ${restored} products rows, ${manifestRestored} manifest rows`);
}

if (mode === "audit") {
  const { rows, dims } = await audit();
  report(rows, dims);
} else if (mode === "dry-run") {
  const { fixes } = await plan();
  printPlan(fixes);
} else if (mode === "apply") {
  await apply();
} else {
  await revert();
}
