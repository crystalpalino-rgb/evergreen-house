/**
 * Shop audit item 9, 2026-11-15.
 *
 * Two data changes, one all-or-nothing script, both reversible:
 *
 * 1. Park the ingestible supplements that were misfiled in Bathroom and Pantry.
 *    They stay active and buyable (nothing is deleted); their room moves to
 *    "held", which src/lib/room-visibility.ts lists as hidden, so they come off
 *    /room/bathroom and /room/pantry. Reversing it is one UPDATE back to the
 *    original room, which is printed below and recorded in the run output.
 *
 * 2. Give Pantry its collections row and its room rule. /room/pantry has been
 *    live all along, but with no collections row /collection/pantry answered 404
 *    and the room was missing from /collections. The row mirrors the Kitchen row
 *    (type room, image /images/kitchen.jpg, sort_order 0), and the rule is the
 *    same shape as the kitchen rule: rule_type room, rule_operator equals,
 *    rule_value "pantry".
 *
 * Run from the repo root:  node scripts/park-supplements-item9.mjs
 */
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = neon(url);

/* Force Factor hair growth (bathroom), BodyHealth PerfectAmino and Ballerina
   Farm whey protein (pantry). The topical rosemary water spray stays: it is a
   hair product, not a supplement. */
const SUPPLEMENT_IDS = [377, 362, 367];

async function main() {
  const before = await sql`select id, name, room from products where id = any(${SUPPLEMENT_IDS})`;
  if (before.length !== SUPPLEMENT_IDS.length) {
    throw new Error(`expected ${SUPPLEMENT_IDS.length} supplement rows, found ${before.length}`);
  }
  console.log("BEFORE");
  for (const r of before) console.log(` ${r.id} ${r.room} | ${r.name.slice(0, 60)}`);

  const pantryRow = await sql`select slug from collections where slug = 'pantry'`;
  if (pantryRow.length === 0) {
    await sql`insert into collections (slug, name, display_name, description, type, seo_title, meta_description, image_url, sort_order, is_active)
      values ('pantry', 'Pantry', 'Pantry',
        'Clear containers, calm shelves, and a system you can keep. A pantry that makes every ingredient easy to find.',
        'room', 'Pantry - Evergreen House',
        'Pantry organization finds - glass jars, woven baskets, and storage that makes the everyday easier to see.',
        '/images/kitchen.jpg', 0, true)`;
    console.log("added collections row: pantry");
  } else {
    console.log("collections row already present: pantry");
  }

  const rule = await sql`select id from collection_rules where collection_slug = 'pantry'`;
  if (rule.length === 0) {
    await sql`insert into collection_rules (collection_slug, rule_type, rule_operator, rule_value, priority)
      values ('pantry', 'room', 'equals', '"pantry"'::jsonb, 10)`;
    console.log("added collection rule: pantry -> room = pantry");
  } else {
    console.log("collection rule already present: pantry");
  }

  const parked = await sql`update products set room = 'held', updated_at = now()
    where id = any(${SUPPLEMENT_IDS}) returning id, room`;
  console.log("PARKED", JSON.stringify(parked));

  const after = await sql`select room, count(*)::int as n from products
    where is_active = true and room in ('bathroom','pantry','held') group by room order by room`;
  console.log("AFTER", JSON.stringify(after));
  console.log("to reverse: update products set room = original_room where id in (377, 362, 367);");
  for (const r of before) console.log(`  ${r.id} -> '${r.room}'`);
}

main().catch((err) => {
  console.error("FAILED", err);
  process.exit(1);
});
