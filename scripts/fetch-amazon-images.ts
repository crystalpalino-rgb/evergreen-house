// Fetches and VALIDATES product images from Amazon for products whose image_url is NULL.
//
// Usage:
//   bun run scripts/fetch-amazon-images.ts [options]
//
// Options:
//   --batch=<import_batch>   only touch rows with this import_batch (e.g. thanksgiving-2026)
//   --ids=1,2,3              only touch these product ids
//   --verify                 also re-check rows that already have an image_url and repair
//                            any that no longer return a real image
//   --dry-run                resolve and validate URLs but do not write to the database
//   --limit=N                stop after N rows
//   --proof=<path>           append one JSON line per row to this file (incremental proof)
//
// Only the products.image_url column is ever written. No other column is touched.
//
// Resolution order per product (first candidate that validates wins):
//   1. data-old-hires           the listing's own hi-res main image
//   2. data-a-dynamic-image     the listing's gallery map, largest entry
//   3. #landingImage src
//   4. "hiRes" JSON field
//   5. og:image / twitter:image
//   6. Amazon's ASIN image service  https://m.media-amazon.com/images/P/<ASIN>.01._SCLZZZZZZZ_.jpg
//      (and _SL1500_ / LZZZZZZZ variants) - no page parsing at all, so it survives a
//      throttled or layout-changed product page. This is the product's genuine Amazon
//      image, not a stand-in.
//
// Every candidate is downloaded and checked before it is written: HTTP 200,
// content-type image/*, and at least MIN_IMAGE_BYTES of real data. Amazon's image
// service answers "no image" with a 43-byte 1x1 transparent GIF and HTTP 200, so the
// byte floor is what stops a placeholder being stored as a product photo.

import { neon } from "@neondatabase/serverless";
import { readFileSync, appendFileSync } from "fs";
import { resolve } from "path";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// A real product photo is far bigger than this. The image service's "no image"
// placeholder is 43 bytes, so this floor rejects it and any other stub.
const MIN_IMAGE_BYTES = 5000;

const PAGE_TIMEOUT_MS = 25000;
const IMAGE_TIMEOUT_MS = 20000;
const MAX_PAGE_ATTEMPTS = 3;

interface Product {
  id: number;
  name: string;
  amazon_url: string;
  image_url: string | null;
}

interface Candidate {
  url: string;
  path: string;
}

interface ImageCheck {
  ok: boolean;
  status: number;
  contentType: string | null;
  bytes: number;
  reason?: string;
}

interface Resolved {
  url: string | null;
  path: string;
  tried: { url: string; path: string; reason: string }[];
}

function loadEnv() {
  try {
    const envFile = readFileSync(resolve(import.meta.dir, "..", ".env"), "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const val = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // No .env file: rely on the process environment.
  }
}

loadEnv();
const sql = neon(process.env.DATABASE_URL!);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

function extractAsin(url: string): string | null {
  const m = url.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?#]|$)/i);
  return m ? m[1].toUpperCase() : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// Rebuild the same photo at a larger size. Amazon's per-image size suffix is
// interchangeable, but not every size exists for every image, so the caller
// always validates the rebuilt URL and falls back to the original.
function upsize(url: string): string | null {
  const m = url.match(/^(https?:\/\/m\.media-amazon\.com\/images\/I\/[^./]+)\.[^/]*$/);
  if (!m) return null;
  return `${m[1]}._AC_SL1500_.jpg`;
}

function extractCandidates(html: string): Candidate[] {
  const out: Candidate[] = [];
  const push = (url: string | null | undefined, path: string) => {
    if (!url) return;
    const clean = decodeEntities(url).trim();
    if (!clean.startsWith("http")) return;
    out.push({ url: clean, path });
    const big = upsize(clean);
    if (big && big !== clean) out.push({ url: big, path: `${path}-upsized` });
  };

  // 1. data-old-hires: the listing's own hi-res main image.
  let m = html.match(/data-old-hires=["']([^"']+)["']/i);
  push(m?.[1], "data-old-hires");

  // 2. data-a-dynamic-image: the gallery map, largest entry first.
  m = html.match(/data-a-dynamic-image=["']([^"']+)["']/i);
  if (m) {
    try {
      const map = JSON.parse(decodeEntities(m[1])) as Record<string, [number, number]>;
      const entries = Object.entries(map)
        .filter(([u]) => u.startsWith("http"))
        .sort((a, b) => (b[1]?.[0] ?? 0) * (b[1]?.[1] ?? 0) - (a[1]?.[0] ?? 0) * (a[1]?.[1] ?? 0));
      if (entries[0]) push(entries[0][0], "data-a-dynamic-image");
    } catch {
      // Malformed map: skip this strategy.
    }
  }

  // 3. The landing image element, in either attribute order.
  m =
    html.match(/id=["']landingImage["'][^>]*?src=["']([^"']+)["']/i) ??
    html.match(/src=["']([^"']+)["'][^>]*?id=["']landingImage["']/i);
  push(m?.[1], "landingImage");

  // 4. hiRes JSON field carried in the page's image block.
  m = html.match(/["']hiRes["']\s*:\s*["']([^"']+)["']/i);
  push(m?.[1], "hiRes-json");

  // 5. Social meta tags.
  m =
    html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ??
    html.match(/<meta\s+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  push(m?.[1], "og:image");
  m = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
  push(m?.[1], "twitter:image");

  return out;
}

// No page parsing at all: Amazon's image service resolves the main image from the ASIN.
function asinServiceCandidates(asin: string): Candidate[] {
  return [
    { url: `https://m.media-amazon.com/images/P/${asin}.01._SL1500_.jpg`, path: "asin-service-sl1500" },
    { url: `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`, path: "asin-service-sclzz" },
    { url: `https://m.media-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`, path: "asin-service-lzz" },
    { url: `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`, path: "asin-service-ssl" },
  ];
}

async function checkImage(url: string): Promise<ImageCheck> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "image/avif,image/webp,image/jpeg,image/*,*/*;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
    const contentType = res.headers.get("content-type");
    const buf = Buffer.from(await res.arrayBuffer());
    if (res.status !== 200) return { ok: false, status: res.status, contentType, bytes: buf.length, reason: `http ${res.status}` };
    if (!contentType || !contentType.toLowerCase().startsWith("image/")) {
      return { ok: false, status: res.status, contentType, bytes: buf.length, reason: `content-type ${contentType}` };
    }
    if (buf.length < MIN_IMAGE_BYTES) {
      return { ok: false, status: res.status, contentType, bytes: buf.length, reason: `placeholder (${buf.length} bytes)` };
    }
    return { ok: true, status: res.status, contentType, bytes: buf.length };
  } catch (err: any) {
    return { ok: false, status: 0, contentType: null, bytes: 0, reason: err?.message ?? "fetch error" };
  }
}

function isBlockedPage(html: string): boolean {
  return (
    /Enter the characters you see below/i.test(html) ||
    /api-services-support@amazon\.com/i.test(html) ||
    /\/errors\/validateCaptcha/i.test(html) ||
    html.length < 20000
  );
}

async function resolveImage(product: Product): Promise<Resolved> {
  const tried: { url: string; path: string; reason: string }[] = [];
  const asin = extractAsin(product.amazon_url);

  let candidates: Candidate[] = [];

  for (let attempt = 1; attempt <= MAX_PAGE_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(product.amazon_url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "en-US,en;q=0.9",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
      });
      if (!res.ok) {
        tried.push({ url: product.amazon_url, path: "page", reason: `http ${res.status}` });
      } else {
        const html = await res.text();
        if (isBlockedPage(html)) {
          tried.push({ url: product.amazon_url, path: "page", reason: `blocked or empty page (${html.length} bytes)` });
        } else {
          candidates = extractCandidates(html);
          if (candidates.length) break;
          tried.push({ url: product.amazon_url, path: "page", reason: "no image candidate in page" });
        }
      }
    } catch (err: any) {
      tried.push({ url: product.amazon_url, path: "page", reason: err?.message ?? "fetch error" });
    }
    if (attempt < MAX_PAGE_ATTEMPTS) await sleep(4000 * attempt + Math.random() * 2000);
  }

  for (const c of candidates) {
    const check = await checkImage(c.url);
    if (check.ok) return { url: c.url, path: c.path, tried };
    tried.push({ url: c.url, path: c.path, reason: check.reason ?? "invalid image" });
  }

  // Fallback that needs no page parsing at all.
  if (asin) {
    for (const c of asinServiceCandidates(asin)) {
      const check = await checkImage(c.url);
      if (check.ok) return { url: c.url, path: c.path, tried };
      tried.push({ url: c.url, path: c.path, reason: check.reason ?? "invalid image" });
    }
  }

  return { url: null, path: "none", tried };
}

async function main() {
  const batch = arg("batch");
  const ids = arg("ids")
    ?.split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  const verify = flag("verify");
  const dryRun = flag("dry-run");
  const limit = arg("limit") ? Number(arg("limit")) : undefined;
  const proofPath = arg("proof");

  const rows = (await sql`
    SELECT id, name, amazon_url, image_url
    FROM products
    WHERE ${batch ? sql`import_batch = ${batch}` : sql`TRUE`}
    ORDER BY id
  `) as Product[];

  let targets = rows.filter((r) => (verify ? true : !r.image_url));
  if (ids?.length) targets = targets.filter((r) => ids.includes(r.id));
  if (limit) targets = targets.slice(0, limit);

  console.log(
    `Scope: ${batch ? `import_batch=${batch}` : "all products"} | ${rows.length} rows | ${targets.length} to process${verify ? " (verify mode)" : ""}\n`,
  );

  let filled = 0;
  let alreadyOk = 0;
  let failed = 0;
  const failures: { id: number; name: string; asin: string | null; tried: any[] }[] = [];

  for (let i = 0; i < targets.length; i++) {
    const product = targets[i];
    const label = product.name.length > 46 ? product.name.slice(0, 43) + "..." : product.name.padEnd(46);
    const asin = extractAsin(product.amazon_url);
    process.stdout.write(`[${i + 1}/${targets.length}] ${label} ... `);

    // In verify mode an existing image that still returns a real image is left alone.
    if (verify && product.image_url) {
      const check = await checkImage(product.image_url);
      if (check.ok) {
        console.log(`= existing ok (${check.bytes} bytes)`);
        alreadyOk++;
        if (proofPath) {
          appendFileSync(
            proofPath,
            JSON.stringify({ id: product.id, asin, result: "existing-ok", url: product.image_url, status: check.status, contentType: check.contentType, bytes: check.bytes }) + "\n",
          );
        }
        continue;
      }
      console.log(`existing image bad (${check.reason}), refetching ... `);
    }

    const resolved = await resolveImage(product);

    if (resolved.url) {
      if (!dryRun) {
        await sql`UPDATE products SET image_url = ${resolved.url} WHERE id = ${product.id}`;
      }
      console.log(`✓ [${resolved.path}] ${resolved.url.slice(0, 70)}`);
      filled++;
      if (proofPath) {
        appendFileSync(
          proofPath,
          JSON.stringify({ id: product.id, asin, result: dryRun ? "dry-run" : "filled", path: resolved.path, url: resolved.url }) + "\n",
        );
      }
    } else {
      console.log(`✗ no image anywhere (${resolved.tried.length} candidates tried)`);
      failed++;
      failures.push({ id: product.id, name: product.name, asin, tried: resolved.tried });
      if (proofPath) {
        appendFileSync(
          proofPath,
          JSON.stringify({ id: product.id, asin, result: "failed", path: "none", tried: resolved.tried }) + "\n",
        );
      }
    }

    // Be a good citizen: Amazon throttles aggressive scrapers.
    await sleep(3500 + Math.random() * 2000);
    if ((i + 1) % 8 === 0 && i < targets.length - 1) {
      console.log(`\n  Pausing 20s (batch ${Math.floor((i + 1) / 8)} complete)...\n`);
      await sleep(20000);
    }
  }

  console.log(`\nDone. ${filled} filled, ${alreadyOk} already valid, ${failed} failed.`);
  if (failures.length) {
    console.log("\nNo image found anywhere for:");
    for (const f of failures) console.log(`  id ${f.id} (${f.asin ?? "no ASIN"}): ${f.name}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
