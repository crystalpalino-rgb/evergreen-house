/**
 * Site Standard rule 10 and owner decision 43: room-fit review, first park pass
 * (owner approved 2026-11-16). The review at
 * /home/team/shared/curation/room-fit-review-2026-11-16.json flags 52 rows,
 * 38 of them severity "clear". This pass takes 37 of those 38 off the public
 * pages. Id 413 (Trendy Queen oatmeal lounge set) is excluded by the owner:
 * decision 3 keeps it on the Bedroom page and it is not part of this pass.
 *
 * Parked, never deleted: is_active goes false, the row leaves its draft edit
 * list and every published collection snapshot. Rows already parked by an
 * earlier pass (175 was) are skipped and reported, not re-written. Pinned rows
 * are refused: decision 42 makes them the only exception.
 *
 * Usage:
 *   bun run scripts/park-room-fit-clear-2026-11-16.mjs            # apply
 *   bun run scripts/park-room-fit-clear-2026-11-16.mjs --dry-run  # checks only
 *   bun run scripts/park-room-fit-clear-2026-11-16.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { neon } from "@neondatabase/serverless";

const BACKUP = "/home/team/shared/curation/room-fit-clear-park-2026-11-16-backup.json";

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

/** The owner exclusion: decision 3 keeps the lounge set on /room/bedroom. */
const EXCLUDED = [
  { id: 413, reason: "Trendy Queen oatmeal lounge set, owner decision 3 keeps it on /room/bedroom" },
];

/** Every severity "clear" row in the review except 413, with the reviewer's reason. */
const PARKED = [
  { id: 31, room: "bathroom", reason: "A set of two collapsible plastic laundry baskets, not a bathroom fixture or bath decor. Laundry belongs with Organization." },
  { id: 175, room: "bathroom", reason: "The live listing is a multi-purpose self-adhesive hook set sold for kitchen, bathroom, living room and office; a generic hook is not a bathroom piece the page can style." },
  { id: 349, room: "bedroom", reason: "Under-bed storage containers are storage bins, not bedding or decor, and the bedroom page is bedding and decor only." },
  { id: 366, room: "bedroom", reason: "A tower fan is an appliance. The bedroom page is bedding and decor only." },
  { id: 364, room: "dining-room", reason: "Baseball birthday party supplies: themed plates, napkins and balloons. Party tableware is off the dining room brief." },
  { id: 374, room: "entryway", reason: "Women's snow boots. Footwear is apparel, not entryway furniture, storage, rugs or door decor." },
  { id: 375, room: "entryway", reason: "A children's insulated winter jacket. Outerwear is apparel, not entryway decor." },
  { id: 376, room: "entryway", reason: "Boys' waterproof snow boots. Children's footwear is apparel, not entryway decor." },
  { id: 388, room: "entryway", reason: "An oversized cropped puffer jacket. Outerwear is apparel, not entryway decor." },
  { id: 389, room: "entryway", reason: "A cropped puffer jacket with stand collar. Outerwear is apparel, not entryway decor." },
  { id: 401, room: "entryway", reason: "A flannel plaid shacket. Clothing is apparel, not entryway decor." },
  { id: 404, room: "entryway", reason: "An oversized faux leather jacket. Outerwear is apparel, not entryway decor." },
  { id: 428, room: "entryway", reason: "An oversized plaid flannel shacket. Clothing is apparel, not entryway decor." },
  { id: 380, room: "fall", reason: "A Halloween ghost doormat and plaid rug set. Halloween is parked and out of the seasonal edits, and this is Halloween-specific rather than fall." },
  { id: 362, room: "held", reason: "An amino acid supplement. No home page carries it (room held) and an ingestible is off-brand for a home curation site." },
  { id: 367, room: "held", reason: "A whey protein powder. No home page carries it (room held) and an ingestible is off-brand for a home curation site." },
  { id: 377, room: "held", reason: "A hair growth supplement. No home page carries it (room held) and an ingestible is off-brand for a home curation site." },
  { id: 365, room: "living-room", reason: "A CMY colour mixing cube: an educational colour theory object, not living room decor." },
  { id: 435, room: "living-room", reason: "A scalloped jute front door mat. It is an entryway mat, and the entryway page already carries its sibling." },
  { id: 481, room: "living-room", reason: "A NEST Holiday scented reed diffuser. A Christmas scent belongs on the Holiday edit, not a year-round room page." },
  { id: 391, room: "loungewear", reason: "A gingham ruffle shirt: daywear, not loungewear." },
  { id: 395, room: "loungewear", reason: "A floral embroidered boho sweater: daywear, not loungewear." },
  { id: 402, room: "loungewear", reason: "A tie front bow cardigan: daywear, not loungewear." },
  { id: 403, room: "loungewear", reason: "High waisted wide leg jeans. Denim is daywear and is the clearest non loungewear row in the room." },
  { id: 424, room: "loungewear", reason: "A cropped knit cardigan: daywear, not loungewear." },
  { id: 352, room: "office", reason: "A large ring light on a 79 inch stand, sold for TikTok, streaming and makeup. Content creation gear is not home office kit." },
  { id: 353, room: "office", reason: "An overhead desk ring light with phone mount, sold for live streaming and video. Content creation gear is not home office kit." },
  { id: 463, room: "office", reason: "An Xbox Series S game console. A gaming console is not office kit: the same failure as the MacBook Air that produced rule 10." },
  { id: 465, room: "office", reason: "A TheraGun massage gun: a personal recovery device, not office equipment." },
  { id: 472, room: "office", reason: "A pink Kodak compact digital camera. A camera is not office supplies or desk decor." },
  { id: 95, room: "organization", reason: "Cordless electric scissors: a craft and cutting tool, not home organization or storage." },
  { id: 169, room: "organization", reason: "An airtight cereal canister set. A pantry canister belongs on Pantry, not Organization." },
  { id: 170, room: "organization", reason: "A fridge egg holder. A refrigerator item belongs on Pantry, not Organization." },
  { id: 23, room: "patio", reason: "A nine-piece garden hand tool set. Garden tools are not patio furniture or outdoor living." },
  { id: 172, room: "patio", reason: "A pocket size handheld rechargeable fan: a personal fan, not patio furnishing." },
  { id: 227, room: "spring", reason: "A nine-piece garden hand tool set on an Easter and spring decor edit. Garden tools are not spring decor." },
  { id: 94, room: "summer", reason: "A paperback guide book on the summer home edit. A book is not summer decor or summer entertaining." },];

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  for (const name of ["../.env.local", "../.env"]) {
    try {
      const raw = readFileSync(new URL(name, import.meta.url), "utf8");
      const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
      if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    } catch {
      /* next file */
    }
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
function fail(msg) {
  console.log("\nABORT - nothing was written.");
  console.log(msg);
  process.exit(1);
}

/** src/data/edits/manifest.json is a generated export of the published
 *  snapshots, so it is rebuilt from the database rather than hand-edited. */
function regenManifest() {
  const out = execFileSync("bun", ["run", "scripts/dump-edits-manifest.ts"], {
    cwd: new URL("..", import.meta.url).pathname,
    encoding: "utf8",
  });
  console.log(`Manifest export regenerated: ${out.trim().split("\n").pop()}`);
}

/* ---------------------------------------------------------- revert path */

if (REVERT) {
  if (!existsSync(BACKUP)) fail(`No back-up at ${BACKUP}: nothing to revert.`);
  const back = JSON.parse(readFileSync(BACKUP, "utf8"));

  const ids = back.products.map((p) => p.id);
  const res = await db`
    UPDATE products AS p
       SET is_active = v.is_active
      FROM jsonb_to_recordset(${JSON.stringify(back.products)}::jsonb)
           AS v(id int, is_active boolean)
     WHERE p.id = v.id
    RETURNING p.id`;
  console.log(`Products restored: ${res.length} of ${ids.length}`);

  if (back.edit_items.length > 0) {
    const back2 = await db`
      INSERT INTO edit_items (edit_id, product_id, position, display_title, hook, slug, name, raw_name, price_override, price_set_at)
      SELECT edit_id, product_id, position, display_title, hook, slug, name, raw_name, price_override, price_set_at
        FROM jsonb_to_recordset(${JSON.stringify(back.edit_items)}::jsonb)
             AS t(edit_id int, product_id int, position int, display_title text, hook text, slug text, name text, raw_name boolean, price_override numeric, price_set_at timestamptz)
      RETURNING id`;
    console.log(`Edit items reinserted: ${back2.length}`);
  }

  if (back.snapshots.length > 0) {
    const back3 = await db`
      UPDATE edit_publications p
         SET snapshot = v.snapshot::jsonb
        FROM jsonb_to_recordset(${JSON.stringify(back.snapshots)}::jsonb)
             AS v(edit_id int, snapshot text)
       WHERE p.edit_id = v.edit_id
      RETURNING p.edit_id`;
    console.log(`Snapshots restored: ${back3.length}`);
  }

  regenManifest();
  console.log("\nRevert done.");
  process.exit(0);
}

/* ---------------------------------------------------------------- checks */

const ids = PARKED.map((p) => p.id);
if (new Set(ids).size !== ids.length) fail("The park list names the same product twice.");
if (ids.includes(413)) fail("413 is the owner exclusion and must not be in the park list.");
console.log(`Park list: ${ids.length} rows (413 excluded by the owner)`);

const current = await db`SELECT id, name, room, is_active, pin_rank, rating, review_count, amazon_url
                           FROM products WHERE id = ANY(${ids}::int[]) ORDER BY id`;
const byId = new Map(current.map((r) => [Number(r.id), r]));
const missing = ids.filter((id) => !byId.has(id));
if (missing.length) fail(`Not in the catalog: ${missing.join(", ")}.`);

const pinned = ids.filter((id) => num(byId.get(id).pin_rank) !== null);
if (pinned.length) fail(`Refusing to park pinned rows: ${pinned.join(", ")}.`);

const alreadyParked = ids.filter((id) => byId.get(id).is_active !== true);
const toPark = ids.filter((id) => byId.get(id).is_active === true);
console.log(`Already parked, skipped: ${alreadyParked.length ? alreadyParked.join(", ") : "none"}`);
console.log(`To park now: ${toPark.length}`);

const excluded = await db`SELECT id, name, room, is_active FROM products WHERE id = 413`;
if (excluded.length !== 1) fail("413 is not in the catalog: the owner exclusion cannot be checked.");
if (excluded[0].is_active !== true) fail("413 is inactive: the owner exclusion was not untouched by an earlier pass.");
console.log(`Owner exclusion stays active: 413 ${excluded[0].name} (${excluded[0].room})`);

/* every static reference, checked before any write */
const REF_FILES = ["../src/data/holiday-sets.json", "../src/data/holiday-hidden-products.json"];
const idPattern = new RegExp(`(?:\\bid|productId|product_id)["']?\\s*[:=]\\s*(${ids.join("|")})\\b`);
for (const rel of REF_FILES) {
  let text = "";
  try {
    text = readFileSync(new URL(rel, import.meta.url), "utf8");
  } catch {
    continue;
  }
  const hit = text.match(idPattern);
  if (hit) fail(`${rel} still names product ${hit[1]}.`);
}
console.log(`Static id references: none (checked ${REF_FILES.length} data files).`);

/* the checked-in edits manifest is a generated export, so it is rebuilt below */
{
  const text = readFileSync(new URL("../src/data/edits/manifest.json", import.meta.url), "utf8");
  const hits = [...text.matchAll(new RegExp(`"id":\\s*(${ids.join("|")})\\b`, "g"))].map((m) => m[1]);
  console.log(
    `Edits manifest export names ${hits.length} parked row(s)${hits.length ? ` (${hits.join(", ")})` : ""}: regenerated from the database after the write.`,
  );
}

/* blog posts hardcode Amazon links, so they are matched on ASIN, never on id */
const asins = current
  .map((r) => (String(r.amazon_url || "").match(/\/dp\/([A-Z0-9]{10})/) || [])[1])
  .filter(Boolean);
const blogDir = new URL("../src/routes/blog/", import.meta.url).pathname;
const blogHits = [];
for (const file of readdirSync(blogDir)) {
  if (!file.endsWith(".tsx")) continue;
  const text = readFileSync(blogDir + file, "utf8");
  for (const asin of asins) if (text.includes(asin)) blogHits.push(`${file} -> ${asin}`);
}
if (blogHits.length) {
  console.log("WARNING - a hardcoded blog card still names a parked row (not a catalog render):");
  for (const hit of blogHits) console.log(`  ${hit}`);
  console.log("  Left in place: taking the card out changes an owner-approved headline count.");
} else {
  console.log(`Blog posts: none of the ${asins.length} ASINs appear.`);
}

/* the draft edit lists that carry these rows, and their published snapshots */
const items = await db`SELECT i.id, i.edit_id, i.product_id, i.position, i.display_title, i.hook,
                              i.slug, i.name, i.raw_name, i.price_override, i.price_set_at
                         FROM edit_items i WHERE i.product_id = ANY(${ids}::int[]) ORDER BY i.edit_id, i.position`;
const editsAffected = [...new Set(items.map((i) => Number(i.edit_id)))].sort((a, b) => a - b);

const snapHits = await db.query(
  `SELECT p.edit_id, count(*)::int AS n
     FROM edit_publications p, jsonb_array_elements(p.snapshot->'items') elem
    WHERE (elem->>'id')::int = ANY($1::int[])
    GROUP BY p.edit_id ORDER BY p.edit_id`,
  [ids],
);
const snapshotEdits = snapHits.map((r) => Number(r.edit_id));
const snapshotCards = snapHits.reduce((a, r) => a + Number(r.n), 0);

console.log(`Draft items naming a parked row: ${items.length}${editsAffected.length ? ` (edits ${editsAffected.join(", ")})` : ""}`);
console.log(`Snapshot cards naming a parked row: ${snapshotCards}${snapshotEdits.length ? ` (edits ${snapshotEdits.join(", ")})` : ""}`);

const perRoom = {};
for (const id of toPark) {
  const room = byId.get(id).room;
  perRoom[room] = (perRoom[room] || 0) + 1;
}
console.log(`Coming off, by room: ${Object.entries(perRoom).map(([r, n]) => `${r} ${n}`).join(", ")}`);

if (DRY) {
  console.log("\nDry run: no write. Back-up would be written to " + BACKUP);
  for (const p of PARKED) {
    const row = byId.get(p.id);
    const state = row.is_active === true ? "park" : "already parked, skip";
    console.log(`  ${state} ${p.id} (${row.room}): ${p.reason}`);
  }
  console.log(`\nWould park ${toPark.length} products, remove ${items.length} draft items and ${snapshotCards} snapshot cards.`);
  process.exit(0);
}

/* ----------------------------------------------------------------- write */

const backup = {
  decision: 43,
  rule: "Site Standard 10, room fit",
  pass: "2026-11-16 clear severity",
  source: "/home/team/shared/curation/room-fit-review-2026-11-16.json",
  excluded: EXCLUDED,
  written_at: new Date().toISOString(),
  products: toPark.map((id) => ({ id, is_active: byId.get(id).is_active })),
  edit_items: items.map((i) => ({
    edit_id: Number(i.edit_id),
    product_id: Number(i.product_id),
    position: Number(i.position),
    display_title: i.display_title,
    hook: i.hook,
    slug: i.slug,
    name: i.name,
    raw_name: i.raw_name,
    price_override: i.price_override,
    price_set_at: i.price_set_at ? new Date(i.price_set_at).toISOString() : null,
  })),
  snapshots: snapHits.length
    ? (
        await db.query(
          `SELECT edit_id, snapshot FROM edit_publications WHERE edit_id = ANY($1::int[]) ORDER BY edit_id`,
          [snapshotEdits],
        )
      ).map((p) => ({ edit_id: Number(p.edit_id), snapshot: JSON.stringify(p.snapshot) }))
    : [],
};
writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
console.log(`\nBack-up written: ${BACKUP}`);

/* 1. the product rows, one statement, guarded on the state we just read */
if (toPark.length > 0) {
  const w1 = await db`UPDATE products SET is_active = false
                      WHERE id = ANY(${toPark}::int[]) AND is_active = true
                     RETURNING id`;
  if (w1.length !== toPark.length) fail(`Parked ${w1.length} products, expected ${toPark.length}.`);
  console.log(`Products parked: ${w1.length}`);
}

/* 2. out of the draft lists */
if (items.length > 0) {
  const w2 = await db`DELETE FROM edit_items WHERE product_id = ANY(${ids}::int[])
                      RETURNING id`;
  if (w2.length !== items.length) fail(`Removed ${w2.length} draft items, expected ${items.length}.`);
  console.log(`Draft items removed: ${w2.length}`);
}

/* 3. out of the published snapshots, one statement for every affected edit */
if (snapshotEdits.length > 0) {
  const w3 = await db.query(
    `UPDATE edit_publications p
        SET snapshot = jsonb_set(p.snapshot, '{items}',
              (SELECT jsonb_agg(elem ORDER BY ord)
                 FROM jsonb_array_elements(p.snapshot->'items') WITH ORDINALITY AS t(elem, ord)
                WHERE NOT ((elem->>'id')::int = ANY($1::int[]))))
      WHERE p.edit_id = ANY($2::int[])
     RETURNING p.edit_id, jsonb_array_length(p.snapshot->'items') AS n`,
    [ids, snapshotEdits],
  );
  if (w3.length !== snapshotEdits.length) fail(`Rewrote ${w3.length} snapshots, expected ${snapshotEdits.length}.`);
  console.log(`Snapshots rewritten: ${w3.map((r) => `${r.edit_id} (${r.n} cards)`).join(", ")}`);
} else {
  console.log("Snapshots rewritten: 0 (no published snapshot named a parked row)");
}

/* 4. the checked-in export, rebuilt from the database so it stays exact */
regenManifest();

/* ------------------------------------------------------------- read-back */

const off = await db`SELECT count(*)::int AS n FROM products
                      WHERE id = ANY(${ids}::int[]) AND is_active = false`;
if (off[0].n !== ids.length) fail(`Read-back: ${off[0].n} of ${ids.length} rows are inactive.`);
console.log(`\nInactive now: ${off[0].n} of ${ids.length} (the other ${ids.length - off[0].n} were already parked)`);

const leftItems = await db`SELECT count(*)::int AS n FROM edit_items WHERE product_id = ANY(${ids}::int[])`;
console.log(`Draft items still naming a parked row: ${leftItems[0].n}`);

const leftSnaps = await db.query(
  `SELECT p.edit_id, count(*)::int AS n
     FROM edit_publications p, jsonb_array_elements(p.snapshot->'items') elem
    WHERE (elem->>'id')::int = ANY($1::int[])
    GROUP BY p.edit_id ORDER BY p.edit_id`,
  [ids],
);
console.log(
  `Snapshot cards still naming a parked row: ${leftSnaps.length === 0 ? 0 : leftSnaps.map((r) => `${r.edit_id}: ${r.n}`).join(", ")}`,
);

const keep = await db`SELECT id, is_active FROM products WHERE id = 413`;
console.log(`Owner exclusion 413 is_active: ${keep[0].is_active}`);
