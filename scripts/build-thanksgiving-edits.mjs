/**
 * Thanksgiving 2026 - build the four Thanksgiving edit manifests.
 *
 * Source of truth (read only, never edited here):
 *   /home/team/shared/thanksgiving-2026/build/table-set-2026-11-04.json
 *   /home/team/shared/thanksgiving-2026/build/moody-set-2026-11-04.json
 *   /home/team/shared/thanksgiving-2026/build/hosting-set-2026-11-04.json
 *   /home/team/shared/thanksgiving-2026/build/welcome-set-2026-11-04.json
 *   /home/team/shared/thanksgiving-2026/build/copy-2026-11-04.json
 *     (page title / headline / intro / art_note for the three new pages,
 *      plus the 52 authored card lines keyed by ASIN)
 *
 * What it writes: src/data/edits/manifest.json, 8 published collections.
 *   - the four holiday edits, untouched
 *   - thanksgiving-table-edit   (20)
 *   - moody-thanksgiving-edit   (20: 13 new + 7 carried ids)
 *   - thanksgiving-hosting-edit (19: 13 carried + 6 of the 7 new)
 *   - thanksgiving-welcome-edit (12)
 * The retired moody-tablescape-edit is dropped from the manifest; its live URL
 * redirects to the new Moody page (build-vercel.sh config.json, vercel.json and
 * serve.ts carry the redirect).
 *
 * Item shape is the established one: id, slug, name, display_title, hook,
 * raw_name. The order is the set file's order. A carried-over item keeps the
 * hook it has been live with (authored, shipped) and takes its clean title and
 * slug from the product row.
 *
 * No figure the card prints (price, rating, review count) is written here: the
 * page renders those from the products row at request time. The manifest owns
 * order and editorial copy only.
 *
 * The one deliberate omission: DOWAN Large White Serving Bowls, Set of 2
 * (id 608) is left out of the Hosting manifest. It is the same Amazon listing
 * family as the DOWAN 90 Ounce White Serving Bowl (id 590) already in the Table
 * set, and the build gates forbid one product in two sets of the same season.
 * Hosting therefore ships at 19, not 20, and no substitute is added.
 *
 * Usage: node scripts/build-thanksgiving-edits.mjs [--apply]
 *   dry run by default; --apply writes the manifest.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const APPLY = process.argv.includes("--apply");
const SITE = new URL("..", import.meta.url).pathname;
const BUILD = "/home/team/shared/thanksgiving-2026/build";
const MANIFEST = `${SITE}src/data/edits/manifest.json`;
const CHECKED_AT = "2026-11-04";

/* The collections that are already live and must not change. */
const UNTOUCHED = [
  "heritage-christmas-edit",
  "cozy-christmas-bedroom-edit",
  "holiday-hosting-edit",
  "luxe-christmas-tree-edit",
];

/* The id that stays out of the Hosting manifest (same Amazon listing family as
   id 590 in the Table set). */
const OMIT = new Set([608]);

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  const raw = readFileSync(`${SITE}.env.local`, "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
  if (!line) throw new Error("no DATABASE_URL in site/.env.local");
  const value = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  if (!value.startsWith("postgres")) throw new Error("DATABASE_URL is not a postgres URL");
  return value;
}

const db = neon(resolveDatabaseUrl());
const problems = [];
const fail = (m) => problems.push(m);

/* ── load sources ───────────────────────────────────────────────────────── */
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const copy = JSON.parse(readFileSync(`${BUILD}/copy-2026-11-04.json`, "utf8"));
const setFiles = {
  "thanksgiving-table-edit": "table-set-2026-11-04.json",
  "moody-thanksgiving-edit": "moody-set-2026-11-04.json",
  "thanksgiving-hosting-edit": "hosting-set-2026-11-04.json",
  "thanksgiving-welcome-edit": "welcome-set-2026-11-04.json",
};
const sets = {};
for (const [slug, file] of Object.entries(setFiles)) {
  sets[slug] = JSON.parse(readFileSync(`${BUILD}/${file}`, "utf8"));
}

const oldBySlug = new Map(manifest.collections.map((c) => [c.slug, c]));
/* Hooks the carried-over items are already live with, by product id. */
const liveHook = new Map();
for (const col of manifest.collections) {
  for (const item of col.items) liveHook.set(Number(item.id), item);
}

/* ── product rows ───────────────────────────────────────────────────────── */
const rows = await db`
  SELECT id, name, display_title, seo_slug, amazon_url, card_hook, is_active
    FROM products
   WHERE import_batch = 'thanksgiving-2026'
      OR id BETWEEN 552 AND 574
   ORDER BY id
`;
const byId = new Map(rows.map((r) => [Number(r.id), r]));
const byAsin = new Map();
for (const r of rows) {
  const m = String(r.amazon_url || "").match(/\/dp\/([A-Z0-9]{10})/);
  if (m) byAsin.set(m[1], r);
}

function itemFromRow(row, hook, fallbackSlug) {
  return {
    id: Number(row.id),
    slug: (row.seo_slug || fallbackSlug || "").trim(),
    name: row.name,
    display_title: row.display_title || row.name,
    hook,
    raw_name: false,
  };
}

/* ── build the four collections ─────────────────────────────────────────── */
const BUILT = {};
for (const [slug, set] of Object.entries(sets)) {
  const copyCol = (copy.collections || []).find((c) => c.slug === slug);
  const old = oldBySlug.get(slug);
  /* Page copy: the copy file wins for the three new pages; the Hosting page
     keeps the title and copy it has been live with (lead brief). */
  const page =
    slug === "thanksgiving-hosting-edit"
      ? {
          title: old.title,
          headline: old.headline,
          intro: old.intro,
          art_note: old.art_note,
          hero_image: old.hero_image,
          card_image: old.card_image,
        }
      : {
          title: copyCol?.title,
          headline: copyCol?.headline,
          intro: copyCol?.intro,
          art_note: copyCol?.art_note,
          hero_image: `/images/edit-${slug}-hero-light`,
          card_image: `/images/edit-${slug}-card-light`,
        };
  for (const [k, v] of Object.entries(page)) {
    if (!v) fail(`${slug}: page.${k} is empty`);
  }

  const items = [];
  const ordered = [...set.items].sort((a, b) => a.position - b.position);
  for (const entry of ordered) {
    let row;
    let hook;
    if (entry.existing_product_id) {
      row = byId.get(Number(entry.existing_product_id));
      if (!row) {
        fail(`${slug}: carried id ${entry.existing_product_id} not in the database`);
        continue;
      }
      const live = liveHook.get(Number(entry.existing_product_id));
      hook = live?.hook || "";
      if (!hook) fail(`${slug}: carried id ${row.id} has no authored hook`);
      if (OMIT.has(Number(row.id))) continue;
      items.push({
        id: Number(row.id),
        slug: (row.seo_slug || live?.slug || "").trim(),
        name: row.name,
        display_title: row.display_title || row.name,
        hook,
        raw_name: live?.raw_name ?? false,
      });
    } else {
      row = byAsin.get(entry.asin);
      if (!row) {
        fail(`${slug}: ASIN ${entry.asin} has no product row`);
        continue;
      }
      if (OMIT.has(Number(row.id))) continue;
      hook = row.card_hook || "";
      if (!hook) fail(`${slug}: id ${row.id} (${entry.asin}) has no card_hook`);
      items.push(itemFromRow(row, hook, entry.slug));
    }
  }

  BUILT[slug] = {
    slug,
    title: page.title,
    headline: page.headline,
    intro: page.intro,
    art_note: page.art_note,
    hero_image: page.hero_image,
    card_image: page.card_image,
    related: [],
    items,
  };
}

/* Related strips: the other three Thanksgiving edits, never a fallback to the
   Christmas edits. */
const ORDER = [
  "thanksgiving-table-edit",
  "moody-thanksgiving-edit",
  "thanksgiving-hosting-edit",
  "thanksgiving-welcome-edit",
];
for (const slug of ORDER) {
  BUILT[slug].related = ORDER.filter((s) => s !== slug);
}

/* ── checks ─────────────────────────────────────────────────────────────── */
const EXPECT = {
  "thanksgiving-table-edit": 20,
  "moody-thanksgiving-edit": 20,
  "thanksgiving-hosting-edit": 19,
  "thanksgiving-welcome-edit": 12,
};
for (const [slug, n] of Object.entries(EXPECT)) {
  if (BUILT[slug].items.length !== n) {
    fail(`${slug}: ${BUILT[slug].items.length} items, expected ${n}`);
  }
}
/* Nothing may appear twice inside the Thanksgiving season. */
const seen = new Map();
for (const slug of ORDER) {
  for (const item of BUILT[slug].items) {
    if (seen.has(item.id)) fail(`id ${item.id} is in both ${seen.get(item.id)} and ${slug}`);
    seen.set(item.id, slug);
  }
}
/* The omitted id and its twin may never appear. */
for (const item of [...seen.keys()].map((id) => ({ id }))) {
  if (OMIT.has(item.id)) fail(`omitted id ${item.id} is in a manifest`);
}
const tableIds = BUILT["thanksgiving-table-edit"].items.map((i) => i.id);
if (!tableIds.includes(590)) fail("id 590 (DOWAN 90 Ounce) is not in the Table set");
/* Every item carries a hook, a slug, a title and a live row. */
for (const slug of ORDER) {
  for (const item of BUILT[slug].items) {
    if (!item.hook) fail(`${slug}: id ${item.id} has no hook`);
    if (!item.slug) fail(`${slug}: id ${item.id} has no slug`);
    if (!item.display_title) fail(`${slug}: id ${item.id} has no display_title`);
    const row = byId.get(item.id);
    if (!row) fail(`${slug}: id ${item.id} is not a product row`);
    else if (!row.is_active) fail(`${slug}: id ${item.id} is not active`);
  }
}
/* House style: no em dash, no en dash, no typographic quotes anywhere written. */
const BAD = [/\u2014/g, /\u2013/g, /\u2018/g, /\u2019/g, /\u201c/g, /\u201d/g, /\u2026/g];
const BAD_SPELLING = [/\bcolours?\b/i, /\bgrey\b/i, /\bfibres?\b/i, /\bcentre\b/i, /\bfavourite\b/i, /\bjewellery\b/i, /\btheatre\b/i, /\bcatalogue\b/i];
function audit(label, text) {
  for (const re of BAD) if (re.test(text)) fail(`${label}: forbidden character ${re}`);
  for (const re of BAD_SPELLING) if (re.test(text)) fail(`${label}: British spelling ${re}`);
}
for (const slug of ORDER) {
  const c = BUILT[slug];
  audit(`${slug} title`, c.title);
  audit(`${slug} headline`, c.headline);
  audit(`${slug} intro`, c.intro);
  audit(`${slug} art_note`, c.art_note);
  for (const item of c.items) {
    audit(`${slug} id ${item.id} title`, item.display_title);
    audit(`${slug} id ${item.id} hook`, item.hook);
  }
}

if (problems.length) {
  console.error(`FAILED ${problems.length} check(s):`);
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}

/* ── write ──────────────────────────────────────────────────────────────── */
const next = {
  manifest_version: manifest.manifest_version,
  note:
    (manifest.note || "") +
    ` 2026-11-04: Thanksgiving 2026 build. Four Thanksgiving edits now published: ` +
    `thanksgiving-table-edit (20), moody-thanksgiving-edit (20), thanksgiving-hosting-edit (19), ` +
    `thanksgiving-welcome-edit (12). Built by scripts/build-thanksgiving-edits.mjs from the set files ` +
    `and copy file in /home/team/shared/thanksgiving-2026/build/, all figures verified live on ` +
    `${CHECKED_AT}. moody-tablescape-edit retired (owner decision 17: one Moody collection) and its ` +
    `URL redirects to /collections/moody-thanksgiving-edit. DOWAN Large White Serving Bowls, Set of 2 ` +
    `(id 608) is deliberately absent from the Hosting set: same Amazon listing family as id 590 in the ` +
    `Table set, so one product would sit in two sets of the same season. Hosting ships at 19, unpadded.`,
  collections: [
    ...UNTOUCHED.map((slug) => oldBySlug.get(slug)),
    ...ORDER.map((slug) => BUILT[slug]),
  ],
};

for (const c of next.collections) {
  if (!c) fail("a collection resolved to undefined");
}
if (next.collections.some((c) => !c)) {
  console.error("FAILED: a collection is missing");
  process.exit(1);
}

console.log("Plan:");
for (const c of next.collections) console.log(`  ${c.slug.padEnd(30)} ${String(c.items.length).padStart(3)} items  related=${(c.related || []).join(",") || "(fallback)"}`);
console.log(`  collections: ${next.collections.length}`);

if (!APPLY) {
  console.log("\nDry run. Re-run with --apply to write src/data/edits/manifest.json");
  process.exit(0);
}
writeFileSync(MANIFEST, JSON.stringify(next, null, 2) + "\n");
console.log("\nWrote src/data/edits/manifest.json");
