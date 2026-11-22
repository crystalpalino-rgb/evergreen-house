// Fetch the real Amazon main image for every card on the eight list pages and
// write it into that page's list-manifest.json (image_url + image_alt).
//
// Why: the list manifests were built from live Amazon reads that recorded the
// rating, review count and price but no photo, so every card on the eight list
// pages rendered text only. The products on these lists are not catalog rows
// (nothing in the products table carries these ASINs), so there is no image_url
// to inherit: the photo is read from the live listing.
//
// Same rules as scripts/fetch-amazon-images.ts (see the amazon-product-image-fetch
// skill): page-first candidate order, every candidate DOWNLOADED and checked
// (200 + image/* + >= 5000 bytes, which rejects Amazon's 43-byte 1x1 "no image"
// gif), ASIN image service only as the fallback. Nothing is written unless the
// bytes are real.
//
//   node scripts/fetch-list-page-images.mjs --proof=/tmp/list-images.jsonl
//   node scripts/fetch-list-page-images.mjs --apply   (writes the manifests)
import fs from "node:fs";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const MIN_IMAGE_BYTES = 5000;
const PAGE_TIMEOUT_MS = 25000;
const IMAGE_TIMEOUT_MS = 10000;
const MAX_PAGE_ATTEMPTS = 3;

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

const LABELS = {
  "stocking-stuffers": "Stocking Stuffers",
  "stocking-men": "Stocking Stuffers for Men",
  "stocking-teen-boys": "Stocking Stuffers for Teen Boys",
  "stocking-teen-girls": "Stocking Stuffers for Teen Girls",
  "new-year-organized-home": "New Year, Organized Home",
  "meal-prep-kitchen-reset": "Meal Prep Kitchen Reset",
  "small-space-home-fitness": "Small-Space Home Fitness",
  "wellness-at-home": "Wellness at Home",
};

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const flag = (name) => process.argv.includes(`--${name}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const decodeEntities = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

function upsize(url) {
  const m = url.match(/^(https?:\/\/m\.media-amazon\.com\/images\/I\/[^./]+)\.[^/]*$/);
  if (!m) return null;
  return `${m[1]}._AC_SL1500_.jpg`;
}

function extractCandidates(html) {
  const out = [];
  const push = (url, path) => {
    if (!url) return;
    const clean = decodeEntities(url).trim();
    if (!clean.startsWith("http")) return;
    out.push({ url: clean, path });
    const big = upsize(clean);
    if (big && big !== clean) out.push({ url: big, path: `${path}-upsized` });
  };
  let m = html.match(/data-old-hires=["']([^"']+)["']/i);
  push(m?.[1], "data-old-hires");
  m = html.match(/data-a-dynamic-image=["']([^"']+)["']/i);
  if (m) {
    try {
      const map = JSON.parse(decodeEntities(m[1]));
      const entries = Object.entries(map)
        .filter(([u]) => u.startsWith("http"))
        .sort((a, b) => (b[1]?.[0] ?? 0) * (b[1]?.[1] ?? 0) - (a[1]?.[0] ?? 0) * (a[1]?.[1] ?? 0));
      if (entries[0]) push(entries[0][0], "data-a-dynamic-image");
    } catch {
      // malformed map
    }
  }
  m =
    html.match(/id=["']landingImage["'][^>]*?src=["']([^"']+)["']/i) ??
    html.match(/src=["']([^"']+)["'][^>]*?id=["']landingImage["']/i);
  push(m?.[1], "landingImage");
  m = html.match(/["']hiRes["']\s*:\s*["']([^"']+)["']/i);
  push(m?.[1], "hiRes-json");
  m =
    html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ??
    html.match(/<meta\s+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  push(m?.[1], "og:image");
  m = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
  push(m?.[1], "twitter:image");
  return out;
}

const asinServiceCandidates = (asin) => [
  { url: `https://m.media-amazon.com/images/P/${asin}.01._SL1500_.jpg`, path: "asin-service-sl1500" },
  { url: `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`, path: "asin-service-sclzz" },
  { url: `https://m.media-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`, path: "asin-service-lzz" },
  { url: `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`, path: "asin-service-ssl" },
];

async function checkImage(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "image/avif,image/webp,image/jpeg,image/*,*/*;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
    const contentType = res.headers.get("content-type");
    const buf = Buffer.from(await res.arrayBuffer());
    if (res.status !== 200) return { ok: false, status: res.status, contentType, bytes: buf.length, reason: `http ${res.status}` };
    if (!contentType || !contentType.toLowerCase().startsWith("image/"))
      return { ok: false, status: res.status, contentType, bytes: buf.length, reason: `content-type ${contentType}` };
    if (buf.length < MIN_IMAGE_BYTES)
      return { ok: false, status: res.status, contentType, bytes: buf.length, reason: `placeholder (${buf.length} bytes)` };
    return { ok: true, status: res.status, contentType, bytes: buf.length };
  } catch (err) {
    return { ok: false, status: 0, contentType: null, bytes: 0, reason: err?.message ?? "fetch error" };
  }
}

const isBlockedPage = (html) =>
  /Enter the characters you see below/i.test(html) ||
  /api-services-support@amazon\.com/i.test(html) ||
  /\/errors\/validateCaptcha/i.test(html) ||
  html.length < 20000;

async function resolveImage(asin) {
  const tried = [];
  const pageUrl = `https://www.amazon.com/dp/${asin}`;
  let candidates = [];
  for (let attempt = 1; attempt <= MAX_PAGE_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(pageUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "en-US,en;q=0.9",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
      });
      if (!res.ok) {
        tried.push({ path: "page", reason: `http ${res.status}` });
      } else {
        const html = await res.text();
        if (isBlockedPage(html)) {
          tried.push({ path: "page", reason: `blocked or short page (${html.length} bytes)` });
        } else {
          candidates = extractCandidates(html);
          if (candidates.length) break;
          tried.push({ path: "page", reason: "no image candidate in page" });
        }
      }
    } catch (err) {
      tried.push({ path: "page", reason: err?.message ?? "fetch error" });
    }
    if (attempt < MAX_PAGE_ATTEMPTS) await sleep(4000 * attempt + Math.random() * 2000);
  }
  for (const c of candidates) {
    const check = await checkImage(c.url);
    if (check.ok) return { url: c.url, path: c.path, check, tried };
    tried.push({ path: c.path, reason: check.reason ?? "invalid image" });
  }
  for (const c of asinServiceCandidates(asin)) {
    const check = await checkImage(c.url);
    if (check.ok) return { url: c.url, path: c.path, check, tried };
    tried.push({ path: c.path, reason: check.reason ?? "invalid image" });
  }
  return { url: null, path: "none", check: null, tried };
}

// Product pages already saved to disk during earlier curation passes carry the
// listing's own image URL, so those ASINs need no network read at all.
function loadCachedImageMap(wanted) {
  const out = new Map();
  const roots = ["/home/team/shared/curation", "/home/team/shared/stocking-stuffers"];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (/^[A-Z0-9]{10}\.html$/.test(e.name)) {
        const asin = e.name.slice(0, 10);
        if (!wanted.has(asin)) continue;
        const html = fs.readFileSync(p, "utf8");
        const m =
          html.match(/data-old-hires=["']([^"']+)["']/i) ||
          html.match(/id=["']landingImage["'][^>]*?src=["']([^"']+)["']/i) ||
          html.match(/src=["']([^"']+)["'][^>]*?id=["']landingImage["']/i);
        if (m) out.set(asin, m[1]);
      }
    }
  };
  for (const r of roots) walk(r);
  return out;
}

async function resolveFromService(asin) {
  const tried = [];
  for (const c of asinServiceCandidates(asin)) {
    const check = await checkImage(c.url);
    if (check.ok) return { url: c.url, path: c.path, check, tried };
    tried.push({ path: c.path, reason: check.reason ?? "invalid image" });
  }
  return { url: null, path: "none", check: null, tried };
}

function readManifest(dir) {
  const p = `src/data/${dir}/list-manifest.json`;
  return { path: p, json: JSON.parse(fs.readFileSync(p, "utf8")) };
}

function writeManifest(p, json) {
  fs.writeFileSync(p, `${JSON.stringify(json, null, 2)}\n`);
}

async function main() {
  const proofPath = arg("proof") ?? "/tmp/list-page-images.jsonl";
  const apply = flag("apply");
  const only = arg("only");

  // Every card that renders on a page, deduped by ASIN across the eight pages.
  const targets = new Map(); // asin -> { dirs:Set, title }
  for (const dir of DIRS) {
    if (only && dir !== only) continue;
    const { json } = readManifest(dir);
    for (const item of json.items ?? []) {
      if (item.appears_on_page === false) continue;
      if (!targets.has(item.asin)) targets.set(item.asin, { dirs: new Set(), title: item.title });
      targets.get(item.asin).dirs.add(dir);
    }
  }
  console.log(`cards on the eight pages: ${targets.size} unique ASINs`);

  if (!apply) {
    const results = new Map();
    // Anything already resolved in an earlier run of this script is kept.
    if (fs.existsSync(proofPath)) {
      for (const line of fs.readFileSync(proofPath, "utf8").split("\n")) {
        if (!line.trim()) continue;
        try {
          const r = JSON.parse(line);
          if (r.url) results.set(r.asin, r.url);
        } catch {
          // partial line from a killed run
        }
      }
    }
    let n = 0;
    const cached = loadCachedImageMap(new Set(targets.keys()));
    const noPage = flag("no-page");
    for (const [asin, info] of targets) {
      n += 1;
      if (results.has(asin)) {
        console.log(`[${n}/${targets.size}] ${asin} = already resolved`);
        continue;
      }
      process.stdout.write(`[${n}/${targets.size}] ${asin} ${info.title.slice(0, 40)} ... `);
      let r = { url: null, path: "none", check: null, tried: [] };
      // 1. A product page already saved on disk during an earlier curation pass.
      if (cached.has(asin)) {
        const check = await checkImage(cached.get(asin));
        if (check.ok) r = { url: cached.get(asin), path: "cached-page", check, tried: [] };
      }
      // 2. The ASIN image service, no page parsing (validated by download).
      if (!r.url) r = await resolveFromService(asin);
      // 3. The live listing, page first, service as its own fallback.
      if (!r.url && !noPage) r = await resolveImage(asin);
      if (r.url) {
        results.set(asin, r.url);
        console.log(`OK [${r.path}] ${r.check.bytes} bytes`);
      } else {
        console.log(`FAILED (${r.tried.map((t) => t.reason).join(" | ").slice(0, 120)})`);
      }
      fs.appendFileSync(
        proofPath,
        `${JSON.stringify({
          asin,
          title: info.title,
          pages: [...info.dirs],
          url: r.url,
          path: r.path,
          status: r.check?.status ?? null,
          contentType: r.check?.contentType ?? null,
          bytes: r.check?.bytes ?? 0,
          tried: r.tried,
        })}\n`,
      );
      await sleep(3500 + Math.random() * 2000);
      if (n % 8 === 0) await sleep(20000);
    }
    const ok = [...results.keys()].length;
    console.log(`\nresolved ${ok}/${targets.size} images`);
    process.exit(ok === targets.size ? 0 : 1);
  }

  // --apply: write image_url + image_alt onto every on-page card.
  const results = new Map();
  for (const line of fs.readFileSync(proofPath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    if (r.url) results.set(r.asin, r.url);
  }
  let written = 0;
  const missing = [];
  for (const dir of DIRS) {
    if (only && dir !== only) continue;
    const { path, json } = readManifest(dir);
    for (const item of json.items ?? []) {
      if (item.appears_on_page === false) continue;
      const url = results.get(item.asin);
      if (!url) {
        missing.push(`${dir}/${item.asin}`);
        continue;
      }
      item.image_url = url;
      item.image_alt = `${item.title}, from our ${LABELS[dir]} list at Evergreen House`;
      written += 1;
    }
    writeManifest(path, json);
  }
  console.log(`wrote image_url on ${written} cards`);
  if (missing.length) {
    console.log(`NO IMAGE: ${missing.join(", ")}`);
    process.exit(1);
  }
}

main();
