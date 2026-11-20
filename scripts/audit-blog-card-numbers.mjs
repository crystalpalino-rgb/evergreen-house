#!/usr/bin/env node
/**
 * Audit every hardcoded blog card against the products table.
 *
 * Blog post product cards are static editorial copy (see the header comment in
 * each post), so their stars and review counts are typed by hand and can drift
 * away from the catalog. This script reads every card object out of
 * src/routes/blog/*.tsx, looks the product id up in Postgres, and prints every
 * card whose rating or review count disagrees with the row, plus every card
 * whose product is no longer active.
 *
 * Read only. It changes nothing.
 *
 * Usage: node scripts/audit-blog-card-numbers.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BLOG_DIR = path.join(REPO, "src/routes/blog");

const env = fs.readFileSync(path.join(REPO, ".env"), "utf8");
const url = env.match(/DATABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, "");
const sql = neon(url);

function cardsInFile(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const cards = [];
  // Stack of open object literals, so a card nested inside a section object is
  // still read on its own instead of being swallowed by the section.
  const stack = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const lead = line.length - line.trimStart().length;

    if (trimmed === "{") {
      stack.push({ indent: lead, lines: [] });
      continue;
    }
    if (!stack.length) continue;

    const open = stack[stack.length - 1];
    if (trimmed === "}," && lead === open.indent) {
      stack.pop();
      const text = open.lines.join("\n");
      const id = text.match(/^\s*id: (\d+),/m);
      // Some posts key their cards by ASIN instead of the product id.
      const asin = text.match(/^\s*asin: "([A-Z0-9]{10})",/m);
      const rating = text.match(/^\s*rating: ([\d.]+),/m);
      const reviews = text.match(/^\s*(?:reviews|reviewCount|review_count): (\d+),/m);
      if ((id || asin) && rating) {
        cards.push({
          id: id ? Number(id[1]) : null,
          asin: asin ? asin[1] : null,
          rating: rating ? Number(rating[1]) : null,
          reviews: reviews ? Number(reviews[1]) : null,
        });
      }
      if (stack.length) stack[stack.length - 1].lines.push(line);
      continue;
    }
    open.lines.push(line);
  }
  return cards;
}

const files = fs
  .readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith(".tsx") && f !== "index.tsx" && !f.startsWith("$"))
  .sort();

const rows = [];
const notInCatalog = [];
let checked = 0;

for (const file of files) {
  const cards = cardsInFile(path.join(BLOG_DIR, file));
  if (!cards.length) continue;
  const ids = cards.filter((c) => c.id !== null).map((c) => c.id);
  const asins = cards.filter((c) => c.asin !== null).map((c) => c.asin);
  const db = await sql`select id, coalesce(display_title, name) as title, rating, review_count, is_active, amazon_url
                       from products
                       where id = any(${ids})
                          or exists (select 1 from unnest(${asins}::text[]) a
                                     where products.amazon_url like '%' || a || '%')`;
  const byId = new Map(db.map((r) => [Number(r.id), r]));
  const byAsin = new Map();
  for (const row of db) {
    const hit = (row.amazon_url || "").match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
    if (hit) byAsin.set(hit[1], row);
  }

  for (const card of cards) {
    checked += 1;
    const row = card.id !== null ? byId.get(card.id) : byAsin.get(card.asin);
    if (!row) {
      notInCatalog.push({
        file,
        label: card.id !== null ? `id ${card.id}` : `asin ${card.asin}`,
      });
      continue;
    }
    const dbRating = row.rating === null ? null : Number(row.rating);
    const dbReviews = row.review_count === null ? null : Number(row.review_count);
    const problems = [];
    if (card.rating !== null && dbRating !== null && card.rating !== dbRating) {
      problems.push(`rating ${card.rating} vs db ${dbRating}`);
    }
    if (card.reviews !== null && dbReviews !== null && card.reviews !== dbReviews) {
      problems.push(`reviews ${card.reviews} vs db ${dbReviews}`);
    }
    if (!row.is_active) problems.push("product is not active");
    if (problems.length) {
      rows.push({
        file,
        label: `id ${row.id}`,
        title: row.title,
        issue: problems.join("; "),
      });
    }
  }
}

console.log(`checked ${checked} cards across ${files.length} blog route files`);
if (!rows.length) {
  console.log("no disagreements: every hardcoded rating and review count matches the database");
} else {
  for (const r of rows) {
    console.log(`${r.file} | ${r.label} | ${r.title} | ${r.issue}`);
  }
  console.log(`${rows.length} card(s) disagree`);
}
if (notInCatalog.length) {
  console.log(
    `\n${notInCatalog.length} card(s) cannot be compared, their product is not in the catalog:`
  );
  for (const r of notInCatalog) console.log(`${r.file} | ${r.label}`);
}
