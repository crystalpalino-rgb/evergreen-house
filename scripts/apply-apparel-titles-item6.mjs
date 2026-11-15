/**
 * Shop audit cleanup, item 6: the Apparel titles.
 *
 * Reads the decision file
 *   /home/team/shared/curation/apparel-titles-2026-11-15.json
 * and sets `display_title` on the 26 apparel rows that carry a new title, in
 * ONE atomic UPDATE. The 8 rows marked "keep" and the 5 marked "remove" are
 * left exactly as they are: the Halloween pieces come out under item 7, not
 * here.
 *
 * Only `display_title` changes. `name` is untouched, so every product URL
 * (canonicalProductSlug reads seo_slug then name), the sitemaps, the merchant
 * feed and the product CSV are unaffected. The card title, the product page
 * title and the product JSON-LD name all read `display_title` first through
 * cardTitle() in src/lib/card-copy.ts.
 *
 * Every check runs before the write. Any failure aborts with nothing changed,
 * and the UPDATE itself carries a matched-count guard so a half set can never
 * land.
 *
 * Usage:
 *   node scripts/apply-apparel-titles-item6.mjs --dry-run
 *   node scripts/apply-apparel-titles-item6.mjs
 *   node scripts/apply-apparel-titles-item6.mjs --revert
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const FILE = "/home/team/shared/curation/apparel-titles-2026-11-15.json";
const MAX_TITLE = 60;
const EXPECTED_APPLY = 26;
const EXPECTED_KEEP = 8;
const EXPECTED_REMOVE = 5;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const REVERT = args.has("--revert");

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
    if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    /* fall through */
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());
const fail = (msg) => {
  console.error(`\nABORT - nothing was written.\n  ${msg}\n`);
  process.exit(1);
};

/** Mirrors productNameToSlug() in src/lib/product-slug.ts, which is what the
 *  product route resolves a URL with. Kept in step by hand: the route helper is
 *  TypeScript and this script runs straight from node. */
const nameToSlug = (name) =>
  (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

const canonicalSlug = (row) => (row.seo_slug || "").trim() || nameToSlug(row.name);

/* ── the decision file ──────────────────────────────────────────────────── */

const doc = JSON.parse(readFileSync(FILE, "utf8"));
if (!Array.isArray(doc) || !doc.length) fail(`${FILE} is not a non-empty array.`);

const slugs = doc.map((r) => String(r.slug || "").trim());
if (slugs.some((s) => !s)) fail("a row in the decision file has no slug.");
if (new Set(slugs).size !== slugs.length) fail("the decision file repeats a slug.");

const dashy = /[\u2013\u2014]/;
if (dashy.test(JSON.stringify(doc))) fail("em dash or en dash in the decision file.");

const KEEP = doc.filter((r) => r.new_title === "keep");
const REMOVE = doc.filter((r) => r.new_title === "remove");
const APPLY = doc.filter((r) => r.new_title !== "keep" && r.new_title !== "remove");

if (APPLY.length !== EXPECTED_APPLY) {
  fail(`the decision file has ${APPLY.length} rows with a new title, expected ${EXPECTED_APPLY}.`);
}
if (KEEP.length !== EXPECTED_KEEP) fail(`${KEEP.length} "keep" rows, expected ${EXPECTED_KEEP}.`);
if (REMOVE.length !== EXPECTED_REMOVE) fail(`${REMOVE.length} "remove" rows, expected ${EXPECTED_REMOVE}.`);

for (const r of APPLY) {
  const title = String(r.new_title || "").trim();
  if (!title) fail(`${r.slug} has an empty new title.`);
  if (title !== r.new_title) fail(`${r.slug} has leading or trailing space in its new title.`);
  if (title.length > MAX_TITLE) fail(`${r.slug} new title is ${title.length} chars: ${title}`);
  if (dashy.test(title)) fail(`${r.slug} new title carries an em dash or en dash.`);
}

/* ── resolve every row in the file against the live catalog ─────────────── */

const live = await db.query(
  `SELECT id, name, display_title, seo_slug, room, product_type, is_active
     FROM products WHERE product_type = 'apparel' ORDER BY id`,
);

const bySlug = new Map();
for (const row of live) {
  const slug = canonicalSlug(row);
  const list = bySlug.get(slug) || [];
  list.push(row);
  bySlug.set(slug, list);
}

const resolved = new Map();
const unresolved = [];
for (const r of doc) {
  const hits = bySlug.get(r.slug) || [];
  if (hits.length !== 1) {
    unresolved.push(`${r.slug} -> ${hits.length} rows`);
    continue;
  }
  resolved.set(r.slug, hits[0]);
}
if (unresolved.length) {
  fail(`rows the file names that do not resolve to exactly one apparel product: ${unresolved.join("; ")}`);
}

/* ── validation: every apply row is where the file says it is ───────────── */

const plan = [];
const alreadyApplied = [];
for (const r of APPLY) {
  const row = resolved.get(r.slug);
  if (!row.is_active) fail(`${row.id} (${r.slug}) is not active.`);
  if (row.product_type !== "apparel") fail(`${row.id} (${r.slug}) is not an apparel row.`);
  const current = (row.display_title || "").trim();
  if (current && current === r.new_title) {
    alreadyApplied.push(row);
    continue;
  }
  if (current) {
    fail(`${row.id} (${r.slug}) already carries display_title "${current}"; re-read the audit.`);
  }
  if ((row.name || "").trim() !== String(r.current_title || "").trim()) {
    fail(
      `${row.id} (${r.slug}) name does not match the file's current_title.\n  live: ${JSON.stringify(
        row.name,
      )}\n  file: ${JSON.stringify(r.current_title)}`,
    );
  }
  plan.push({ id: row.id, cur: row.name, next: r.new_title, slug: r.slug });
}

if (plan.length + alreadyApplied.length !== EXPECTED_APPLY) {
  fail(`${plan.length} to write and ${alreadyApplied.length} already done, expected ${EXPECTED_APPLY}.`);
}

/* The untouched rows must exist too, so the script proves it looked at them
   rather than quietly dropping them. */
for (const r of KEEP) {
  const row = resolved.get(r.slug);
  if (!row) fail(`keep row ${r.slug} is missing.`);
  const shown = (row.display_title || row.name || "").trim();
  if (shown !== String(r.current_title || "").trim()) {
    fail(`keep row ${row.id} shows "${shown}", the file says "${r.current_title}".`);
  }
}
for (const r of REMOVE) {
  const row = resolved.get(r.slug);
  if (!row) fail(`remove row ${r.slug} is missing.`);
  if ((row.display_title || "").trim()) {
    fail(`remove row ${row.id} carries display_title "${row.display_title}"; item 7 handles it.`);
  }
}

/* The write set and the untouched sets must not overlap. */
const applyIds = new Set([...plan.map((p) => p.id), ...alreadyApplied.map((row) => row.id)]);
for (const r of [...KEEP, ...REMOVE]) {
  const row = resolved.get(r.slug);
  if (applyIds.has(row.id)) fail(`${row.id} is both an apply row and a ${r.new_title} row.`);
}

/* ── report the plan ────────────────────────────────────────────────────── */

console.log(`decision file   ${FILE}`);
console.log(`live apparel    ${live.length} rows, ${live.filter((r) => r.is_active).length} active`);
console.log(`writing         ${plan.length} display_title value(s), max ${MAX_TITLE} chars`);
console.log(`already done    ${alreadyApplied.length}`);
console.log(`untouched       ${KEEP.length} keep, ${REMOVE.length} remove (Halloween leaves under item 7)`);
for (const p of plan) {
  console.log(`  ${p.id}  ${p.next}  (${p.next.length})`);
}
if (alreadyApplied.length) console.log(`  already: ${alreadyApplied.map((r) => r.id).join(", ")}`);

/* ── revert mode ────────────────────────────────────────────────────────── */

if (REVERT) {
  const ids = doc.filter((r) => r.new_title !== "keep" && r.new_title !== "remove").map((r) => resolved.get(r.slug).id);
  const titles = doc.filter((r) => r.new_title !== "keep" && r.new_title !== "remove").map((r) => r.new_title);
  const back = await db.query(
    `WITH v AS (SELECT * FROM unnest($1::int[], $2::text[]) AS t(id, new_title))
     UPDATE products p
        SET display_title = NULL, updated_at = now()
       FROM v
      WHERE p.id = v.id AND p.display_title = v.new_title
     RETURNING p.id`,
    [ids, titles],
  );
  console.log(`\nreverted ${back.length} product(s) to no display_title.`);
  process.exit(0);
}

if (DRY_RUN) {
  console.log("\n--dry-run: no rows written.");
  process.exit(0);
}

if (!plan.length) {
  console.log("\nnothing to write: every row already carries its new title.");
  process.exit(0);
}

/* ── the write: one statement, so it lands whole or not at all ──────────── */

const written = await db.query(
  `WITH v AS (SELECT * FROM unnest($1::int[], $2::text[], $3::text[]) AS t(id, cur, new_title)),
        m AS (
          SELECT count(*)::int AS n
            FROM products p JOIN v ON p.id = v.id
           WHERE p.is_active
             AND p.product_type = 'apparel'
             AND p.name = v.cur
             AND p.display_title IS NULL
        ),
        u AS (
          UPDATE products p
             SET display_title = v.new_title, updated_at = now()
            FROM v
           WHERE p.id = v.id
             AND p.name = v.cur
             AND p.display_title IS NULL
             AND p.is_active
             AND p.product_type = 'apparel'
             AND (SELECT n FROM m) = $4
          RETURNING p.id
        )
   SELECT (SELECT n FROM m) AS matched, count(*)::int AS updated FROM u`,
  [plan.map((p) => p.id), plan.map((p) => p.cur), plan.map((p) => p.next), plan.length],
);

const res = written[0];
if (Number(res.updated) !== plan.length) {
  console.error(
    `WARNING: expected ${plan.length} rows, the update touched ${res.updated} (matched ${res.matched}). Inspect before doing anything else.`,
  );
}

/* ── read back ──────────────────────────────────────────────────────────── */

const after = await db.query(
  `SELECT id, display_title, name FROM products WHERE id = ANY($1::int[]) ORDER BY id`,
  [plan.map((p) => p.id)],
);
const want = new Map(plan.map((p) => [p.id, p.next]));
let ok = 0;
let longest = 0;
for (const row of after) {
  const got = (row.display_title || "").trim();
  if (got === want.get(Number(row.id))) ok++;
  else console.error(`  MISMATCH ${row.id}: ${JSON.stringify(got)}`);
  longest = Math.max(longest, got.length);
}
console.log(`\nread back: ${ok} of ${plan.length} rows carry their new title, longest ${longest} chars.`);

/* The keep and remove rows must read exactly as they did before the write. */
const untouchedRows = [...KEEP, ...REMOVE].map((r) => resolved.get(r.slug));
const untouched = await db.query(
  `SELECT id, display_title FROM products WHERE id = ANY($1::int[]) ORDER BY id`,
  [untouchedRows.map((r) => r.id)],
);
const before = new Map(untouchedRows.map((r) => [r.id, (r.display_title || "").trim()]));
let same = 0;
for (const row of untouched) {
  const was = before.get(Number(row.id)) || "";
  const now = (row.display_title || "").trim();
  if (was === now) same++;
  else console.error(`  CHANGED ${row.id}: was ${JSON.stringify(was)}, now ${JSON.stringify(now)}`);
}
console.log(`untouched: ${same} of ${untouched.length} keep/remove rows read exactly as before.`);
