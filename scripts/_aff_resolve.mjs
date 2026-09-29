// One-off affiliate link migration: amzn.to short links -> clean /dp/ASIN?tag=NEWTAG URLs
// Usage: node scripts/_aff_resolve.mjs resolve   (writes scripts/aff_mapping.json, no DB writes)
//        node scripts/_aff_resolve.mjs apply     (updates products.amazon_url from the mapping)
import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);
const sql = neon(env.DATABASE_URL || env.NEON_DATABASE_URL);

const NEW_TAG = "crystalcost09-20";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const MAPPING_FILE = "scripts/aff_mapping.json";
const CONCURRENCY = 8;

function extractAsin(finalUrl) {
  const m =
    finalUrl.match(/\/dp\/([A-Z0-9]{10})(?:[/?]|$)/) ||
    finalUrl.match(/\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/) ||
    finalUrl.match(/\/product\/([A-Z0-9]{10})(?:[/?]|$)/);
  return m ? m[1] : null;
}

async function resolveOne(oldUrl) {
  const bare = oldUrl.split("?")[0].trim(); // drop any stray query on the short link
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(bare, {
      redirect: "follow",
      headers: { "user-agent": UA },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const asin = extractAsin(res.url);
    if (!asin) return { ok: false, reason: `no ASIN in final URL: ${res.url}` };
    return {
      ok: true,
      asin,
      newUrl: `https://www.amazon.com/dp/${asin}?tag=${NEW_TAG}`,
    };
  } catch (e) {
    return { ok: false, reason: `fetch failed: ${e.message}` };
  }
}

const mode = process.argv[2] || "resolve";

if (mode === "resolve") {
  // ALL rows with a URL (active or not) so the whole table ends up consistent
  const rows = await sql`SELECT id, amazon_url FROM products WHERE amazon_url LIKE 'http%'`;
  console.log(`Resolving ${rows.length} links...`);
  const out = { tag: NEW_TAG, generatedAt: new Date().toISOString(), items: {} };
  let done = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (r) => ({ id: r.id, ...(await resolveOne(r.amazon_url)) }))
    );
    for (const r of results) {
      const old = rows.find((x) => x.id === r.id).amazon_url;
      out.items[r.id] = {
        old,
        shortCode: old.split("?")[0].replace(/^https:\/\/amzn\.to\//, ""),
        asin: r.asin ?? null,
        newUrl: r.newUrl ?? null,
        ok: r.ok,
        reason: r.reason ?? null,
      };
      done++;
      if (!r.ok) failed++;
    }
    if (i % 50 === 0 || i + CONCURRENCY >= rows.length)
      console.log(`  ${done}/${rows.length} (${failed} failed so far)`);
  }
  writeFileSync(MAPPING_FILE, JSON.stringify(out, null, 1));
  const okCount = Object.values(out.items).filter((v) => v.ok).length;
  console.log(`\nRESOLVE DONE: ${okCount} ok / ${failed} failed / ${rows.length} total`);
  console.log(`Mapping written to ${MAPPING_FILE}`);
  for (const [id, v] of Object.entries(out.items).filter(([, x]) => !x.ok)) {
    console.log(`  FAIL id=${id} ${v.reason} | ${v.old}`);
  }
} else if (mode === "apply") {
  const map = JSON.parse(readFileSync(MAPPING_FILE, "utf8"));
  const entries = Object.entries(map.items)
    .filter(([, v]) => v.ok)
    .map(([id, v]) => ({ id: Number(id), ...v }))
    .sort((a, b) => a.id - b.id);

  // Group by resolved URL; siblings beyond the first get a &ref=<shortCode> to
  // stay unique under the amazon_url unique index, like the old ?ref= data.
  const byUrl = new Map();
  for (const e of entries) {
    if (!byUrl.has(e.newUrl)) byUrl.set(e.newUrl, []);
    byUrl.get(e.newUrl).push(e);
  }
  const targets = new Map(); // id -> target URL
  for (const group of byUrl.values()) {
    group.forEach((e, i) => {
      targets.set(e.id, i === 0 ? e.newUrl : `${e.newUrl}&ref=${e.shortCode}`);
    });
  }

  console.log(`Applying ${targets.size} updates with tag=${map.tag} ...`);
  let applied = 0;
  let skipped = 0;
  for (const [id, target] of targets) {
    const cur = await sql`SELECT amazon_url FROM products WHERE id = ${id}`;
    if (!cur.length) {
      console.log(`  MISSING row id=${id}`);
      continue;
    }
    if (cur[0].amazon_url === target) {
      skipped++;
      continue;
    }
    if (cur[0].amazon_url.includes(`tag=${map.tag}`)) {
      // already migrated (e.g. to a sibling URL on a prior failed run) - leave it
      skipped++;
      continue;
    }
    try {
      await sql`UPDATE products SET amazon_url = ${target}, updated_at = now() WHERE id = ${id}`;
      applied++;
    } catch (e) {
      console.log(`  FAILED id=${id}: ${e.message} -> ${target}`);
    }
  }
  console.log(`APPLY DONE: ${applied} updated, ${skipped} already correct/skipped`);

  const check = await sql`SELECT
    count(*) FILTER (WHERE amazon_url LIKE 'https://amzn.to/%') AS still_short,
    count(*) FILTER (WHERE amazon_url LIKE '%tag=${map.tag}%') AS with_new_tag,
    count(*) FILTER (WHERE amazon_url LIKE 'http%') AS with_url
    FROM products`;
  console.log(JSON.stringify(check));
}