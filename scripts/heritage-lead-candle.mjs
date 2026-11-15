/**
 * Shop audit item 9 follow-up, 2026-11-15.
 *
 * Crystal wants The Heritage Christmas Edit to open on the Thymes Frasier Fir
 * pine candle (product 491, 4.6 stars, 6,172 reviews) instead of the olive
 * velvet pouf (product 53). The page lead-gates the position 0 sofa out, so
 * position 1 is the card a visitor sees first.
 *
 * Two changes, one script:
 *   1. edit_items: swap the positions of product 491 and the row that currently
 *      holds position 1 (product 53). Every other row keeps its exact position.
 *   2. edit_publications.snapshot: swap the same two items in the published
 *      snapshot's items array, so the live page and the edit order agree.
 *
 * The edit_items swap is one UPDATE (no unique index on (edit_id, position), so
 * a CASE swap is atomic). The snapshot is rewritten in the same shape it was
 * read. Nothing is deleted; reversing it is running the script again with the
 * two ids the other way round, or one swap back.
 *
 * Idempotent: if the candle already holds position 1, it changes nothing.
 *
 * Run from the repo root:  node scripts/heritage-lead-candle.mjs
 */
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = neon(url);

const EDIT_SLUG = "heritage-christmas-edit";
const CANDLE_ID = 491; // Thymes Frasier Fir Pine Needle Candle
const LEAD_POSITION = 1;

async function main() {
  const edits = await sql`select id, slug from edits where slug = ${EDIT_SLUG}`;
  if (edits.length !== 1) throw new Error(`expected one edit ${EDIT_SLUG}, found ${edits.length}`);
  const editId = edits[0].id;

  const items = await sql`select product_id, position, display_title from edit_items where edit_id = ${editId} order by position`;
  const candle = items.find((r) => r.product_id === CANDLE_ID);
  const lead = items.find((r) => r.position === LEAD_POSITION);
  if (!candle) throw new Error(`product ${CANDLE_ID} is not in ${EDIT_SLUG}`);
  if (!lead) throw new Error(`no row holds position ${LEAD_POSITION} in ${EDIT_SLUG}`);

  console.log("BEFORE");
  console.log(` position ${LEAD_POSITION}: ${lead.product_id} ${lead.display_title}`);
  console.log(` position ${candle.position}: ${candle.product_id} ${candle.display_title}`);

  if (candle.position !== LEAD_POSITION) {
    await sql`update edit_items
      set position = case product_id when ${CANDLE_ID} then ${LEAD_POSITION}::int else ${candle.position}::int end
      where edit_id = ${editId} and product_id in (${CANDLE_ID}, ${lead.product_id})`;
    console.log(`swapped positions in edit_items: ${CANDLE_ID} -> ${LEAD_POSITION}, ${lead.product_id} -> ${candle.position}`);
  } else {
    console.log("edit_items already lead with the candle, nothing to swap");
  }

  const pubs = await sql`select snapshot from edit_publications where edit_id = ${editId}`;
  if (pubs.length !== 1) throw new Error(`expected one publication row for ${EDIT_SLUG}, found ${pubs.length}`);
  const snapshot = pubs[0].snapshot;
  const list = snapshot.items;
  if (!Array.isArray(list)) throw new Error("snapshot has no items array");
  const cIdx = list.findIndex((it) => it.id === CANDLE_ID);
  if (cIdx < 0) throw new Error(`product ${CANDLE_ID} is not in the published snapshot`);
  if (cIdx !== LEAD_POSITION) {
    const leadIdx = list.findIndex((it, i) => i !== cIdx && i === LEAD_POSITION);
    if (leadIdx !== LEAD_POSITION) throw new Error(`snapshot has no item at index ${LEAD_POSITION}`);
    if (list[leadIdx].id !== lead.product_id) {
      throw new Error(`snapshot index ${LEAD_POSITION} holds ${list[leadIdx].id}, edit_items position ${LEAD_POSITION} holds ${lead.product_id}`);
    }
    [list[cIdx], list[leadIdx]] = [list[leadIdx], list[cIdx]];
    snapshot.items = list;
    await sql`update edit_publications set snapshot = ${JSON.stringify(snapshot)}::jsonb where edit_id = ${editId}`;
    console.log(`swapped the same two cards in the published snapshot (index ${cIdx} <-> index ${LEAD_POSITION})`);
  } else {
    console.log("published snapshot already leads with the candle, nothing to swap");
  }

  const after = await sql`select product_id, position, display_title from edit_items where edit_id = ${editId} order by position`;
  const afterPub = await sql`select snapshot from edit_publications where edit_id = ${editId}`;
  const afterList = afterPub[0].snapshot.items;

  const expect = items.slice().sort((a, b) => a.position - b.position).map((r) => r.product_id);
  const got = after.map((r) => r.product_id);
  if (got.length !== expect.length) throw new Error("item count changed");
  const setEq = (a, b) => a.slice().sort().join(",") === b.slice().sort().join(",");
  if (!setEq(got, expect)) throw new Error("the set of items changed");
  if (after[LEAD_POSITION].product_id !== CANDLE_ID) throw new Error("candle did not land at position 1");
  if (afterList[LEAD_POSITION].id !== CANDLE_ID) throw new Error("snapshot did not land the candle at index 1");
  if (afterList.map((it) => it.id).join(",") !== got.join(",")) {
    throw new Error("snapshot order does not match edit_items order");
  }

  console.log("AFTER");
  for (const r of after.slice(0, 9)) {
    console.log(` ${r.position} ${r.product_id} ${r.display_title}`);
  }
  console.log("OK: candle at position 1, everything else unchanged, snapshot matches edit_items");
}

await main();
