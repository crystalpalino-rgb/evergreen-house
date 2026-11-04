/**
 * Prove the pin-priority ship against a running site, in the rendered HTML.
 *
 * Every check below reads the page a shopper actually receives: the card order
 * on the three room pages, the /apparel featured row, the verified price and
 * review count on each of the eleven cards, the holiday card counts, 483 still
 * absent, every untouched page still holding its card count, and no em-dash,
 * en-dash or British spelling anywhere on a page this change touched.
 *
 * Card identity comes from the product link inside each <article> (the card's
 * one internal link), resolved back to a product id with the same
 * canonicalProductSlug helper the site itself links with.
 *
 * Usage:
 *   bun run scripts/verify-pin-priority.mts                      # localhost:3000
 *   bun run scripts/verify-pin-priority.mts https://evergreenhouse.co
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { canonicalProductSlug } from "../src/lib/product-slug";

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const VERIFICATION =
  "/home/team/shared/curation/pin-priority-verification-2026-11-04.json";

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
  if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());

const failures: string[] = [];
const notes: string[] = [];

function check(ok: boolean, label: string, detail = "") {
  if (ok) {
    console.log(`  PASS  ${label}${detail ? ` (${detail})` : ""}`);
  } else {
    console.log(`  FAIL  ${label}${detail ? ` (${detail})` : ""}`);
    failures.push(`${label}${detail ? `: ${detail}` : ""}`);
  }
}

/** Fetch a page as text, cached per run. Throws on a non-200 so a soft 404 cannot pass. */
const pageCache = new Map<string, string>();
async function get(path: string): Promise<string> {
  const cached = pageCache.get(path);
  if (cached) return cached;
  const res = await fetch(`${BASE}${path}`, {
    headers: { "accept-encoding": "gzip, deflate, br", "cache-control": "no-cache" },
  });
  const buf = new Uint8Array(await res.arrayBuffer());
  if (res.status !== 200) throw new Error(`${path} -> HTTP ${res.status}`);
  // gzip magic bytes would mean the body was not decoded; the site serves gzip.
  if (buf[0] === 0x1f && buf[1] === 0x8b) throw new Error(`${path} -> still gzip encoded`);
  const text = new TextDecoder().decode(buf);
  pageCache.set(path, text);
  return text;
}

type Card = { slug: string; id: number | null; price: string | null; rating: string | null; reviews: string | null; html: string };

/** Every product card in a chunk of HTML, in document order. */
function cards(html: string, slugToId: Map<string, number>): Card[] {
  const out: Card[] = [];
  const parts = html.split(/<article[\s>]/).slice(1);
  for (const part of parts) {
    const block = part.slice(0, part.indexOf("</article>") + 1 || undefined);
    const slug = (block.match(/\/product\/([^"'?#\s]+)/) || [])[1] || "";
    const priceSpan = block.match(/ml-auto text-\[11px\][^>]*>([^<]+)</);
    const ratingCandidates = [...block.matchAll(/text-\[11px\] font-medium text-warm-dark">([^<]+)</g)]
      .map((m) => m[1].trim())
      .filter((v) => !v.startsWith("$"));
    const reviews = block.match(/text-taupe">\((?:<!-- -->)?([\d,]+)(?:<!-- -->)?\)</);
    out.push({
      slug,
      id: slugToId.get(slug) ?? null,
      price: priceSpan ? priceSpan[1].trim() : null,
      rating: ratingCandidates.length ? ratingCandidates[0] : null,
      reviews: reviews ? reviews[1] : null,
      html: block,
    });
  }
  return out;
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const num = (n: number) => new Intl.NumberFormat("en-US").format(n);

const DASHES = { "\u2014": "em-dash", "\u2013": "en-dash" };
const BRITISH = [
  "colour", "colours", "coloured", "favourite", "favourites", "centre", "centres",
  "organise", "organised", "organisation", "personalised", "personalise", "jewellery",
  "neighbour", "neighbours", "behaviour", "flavour", "honour", "labour", "theatre",
  "defence", "licence", "cancelled", "travelled", "travelling", "modelling", "grey",
  "analysed", "recognise", "recognised", "realise", "realised", "apologise", "apologised",
  "customise", "customised", "minimise", "maximise", "utilise", "optimise", "cosy",
  "moulding", "mouldings", "practise", "programme", "cheque", "storey",
];

function textCheck(path: string, html: string) {
  const found: string[] = [];
  for (const [char, label] of Object.entries(DASHES)) {
    const n = html.split(char).length - 1;
    if (n > 0) found.push(`${n} ${label}`);
  }
  const lower = html.toLowerCase();
  const brit = BRITISH.filter((word) => new RegExp(`\\b${word}\\b`).test(lower));
  check(found.length === 0, `${path}: no em-dash or en-dash`, found.join(", ") || "clean");
  check(brit.length === 0, `${path}: no British spellings`, brit.join(", ") || "clean");
}

async function main() {
  console.log(`Target: ${BASE}\n`);

  const rows = (await db.query(
    "SELECT id, name, seo_slug FROM products WHERE is_active = true",
    [],
  )) as { id: number; name: string; seo_slug: string | null }[];
  const slugToId = new Map<string, number>();
  for (const row of rows) slugToId.set(canonicalProductSlug(row), Number(row.id));

  const verification = JSON.parse(readFileSync(VERIFICATION, "utf8"));
  const verified = new Map<number, any>(
    verification.products.map((p: any) => [Number(p.id), p]),
  );

  // ---------- 1-3. room ordering ----------
  const rooms: { path: string; expect: number[] }[] = [
    { path: "/room/office", expect: [293, 297, 300, 318] },
    { path: "/room/bedroom", expect: [413, 36, 27, 44] },
    { path: "/room/dining-room", expect: [419, 243, 28, 90] },
  ];
  const roomPages = new Map<string, Card[]>();
  for (const room of rooms) {
    console.log(`${room.path}`);
    const html = await get(room.path);
    textCheck(room.path, html);
    const found = cards(html, slugToId);
    roomPages.set(room.path, found);
    const head = found.slice(0, 4).map((c) => c.id);
    check(
      JSON.stringify(head) === JSON.stringify(room.expect),
      `first four cards are ${room.expect.join(", ")} in that order`,
      `saw ${head.join(", ")}`,
    );
  }

  // ---------- 4. /apparel featured row ----------
  console.log("\n/apparel");
  const apparelHtml = await get("/apparel");
  textCheck("/apparel", apparelHtml);
  const featuredStart = apparelHtml.indexOf('id="apparel-featured-heading"');
  const categoriesStart = apparelHtml.indexOf('aria-label="Apparel categories"');
  check(featuredStart > 0, "featured row heading is present");
  check(
    featuredStart > 0 && categoriesStart > featuredStart,
    "featured row sits above the category chips",
  );
  const featuredCards = featuredStart > 0 ? cards(apparelHtml.slice(featuredStart, categoriesStart), slugToId) : [];
  const sectionCards = categoriesStart > 0 ? cards(apparelHtml.slice(categoriesStart), slugToId) : [];
  check(
    JSON.stringify(featuredCards.map((c) => c.id)) === JSON.stringify([405, 406, 407]),
    "featured row shows 405, 406, 407 in that order",
    `saw ${featuredCards.map((c) => c.id).join(", ")}`,
  );
  for (const id of [405, 406, 407]) {
    const inSection = sectionCards.filter((c) => c.id === id).length;
    check(inSection === 1, `${id} still sits in its own section below`, `${inSection} card(s)`);
  }
  const allApparel = cards(apparelHtml, slugToId);
  const count403 = allApparel.filter((c) => c.id === 403).length;
  check(count403 === 1, "403 appears once on the page", `${count403} card(s)`);
  check(!featuredCards.some((c) => c.id === 403), "403 is not in the featured row");
  check(
    sectionCards.length === 39,
    "/apparel sections still hold 39 cards",
    `${sectionCards.length}`,
  );
  check(
    allApparel.length === 42,
    "/apparel renders 42 cards in total (39 in sections + 3 featured)",
    `${allApparel.length}`,
  );

  // ---------- 5. verified price and review count on all eleven ----------
  console.log("\nverified facts on the cards");
  const pageCards = new Map<string, Card[]>(roomPages);
  pageCards.set("/apparel", allApparel);
  const wantOnPage: Record<number, string> = {
    293: "/room/office", 297: "/room/office", 300: "/room/office", 318: "/room/office",
    36: "/room/bedroom", 27: "/room/bedroom",
    243: "/room/dining-room",
    405: "/apparel", 406: "/apparel", 407: "/apparel", 403: "/apparel",
  };
  for (const [idText, path] of Object.entries(wantOnPage)) {
    const id = Number(idText);
    const v = verified.get(id);
    const card = (pageCards.get(path) || []).find((c) => c.id === id);
    const expectedPrice = usd(v.price);
    const expectedReviews = num(v.review_count);
    const expectedRating = String(v.rating);
    check(
      Boolean(card) &&
        card!.price === expectedPrice &&
        card!.reviews === expectedReviews &&
        card!.rating === expectedRating,
      `${id} card shows ${expectedPrice}, ${expectedRating} stars, ${expectedReviews} reviews`,
      card ? `${card.price} / ${card.rating} / ${card.reviews}` : "card not found",
    );
  }
  const duvet = (pageCards.get("/room/bedroom") || []).find((c) => c.id === 36);
  check(duvet?.price === "$89.99", "the duvet card reads $89.99, not the old $71.68", duvet?.price || "");

  // ---------- 6. holiday: 89 cards, 483 still absent ----------
  console.log("\nholiday");
  for (const path of ["/room/holiday", "/collection/holiday"]) {
    const html = await get(path);
    textCheck(path, html);
    const found = cards(html, slugToId);
    check(found.length === 89, `${path} shows 89 cards`, `${found.length}`);
    check(!found.some((c) => c.id === 483), `${path} does not show 483`);
  }
  const hostingEdit = await get("/collections/holiday-hosting-edit");
  textCheck("/collections/holiday-hosting-edit", hostingEdit);
  const hostingTable = hostingEdit.slice(hostingEdit.indexOf("Hosting Table"));
  check(
    !cards(hostingTable, slugToId).some((c) => c.id === 483),
    "483 is absent from the Hosting Table set",
  );

  // ---------- 7. nothing regressed ----------
  console.log("\ncard counts on every other page");
  // Counts are the ones production served before this change (captured on
  // 2026-11-04 from the live site), so "unchanged" is measured against the real
  // page, not against an assumption. /collection/fall renders 55 cards: the 39
  // in the Fall collection itself plus 16 in the related strip below it.
  const counts: { path: string; count: number }[] = [
    { path: "/room/entryway", count: 33 },
    { path: "/room/office", count: 30 },
    { path: "/room/bedroom", count: 38 },
    { path: "/room/dining-room", count: 14 },
    { path: "/room/living-room", count: 68 },
    { path: "/room/kitchen", count: 47 },
    { path: "/collection/fall", count: 55 },
    { path: "/collection/holiday", count: 89 },
    { path: "/collections/heritage-christmas-edit", count: 30 },
    { path: "/collections/cozy-christmas-bedroom-edit", count: 20 },
    { path: "/collections/holiday-hosting-edit", count: 22 },
    { path: "/collections/luxe-christmas-tree-edit", count: 21 },
    { path: "/collections/thanksgiving-hosting-edit", count: 13 },
    { path: "/collections/moody-tablescape-edit", count: 10 },
  ];
  for (const { path, count } of counts) {
    const html = await get(path);
    textCheck(path, html);
    const found = cards(html, slugToId).length;
    check(found === count, `${path} still shows ${count} cards`, `${found}`);
  }

  // ---------- summary ----------
  console.log(`\n${failures.length === 0 ? "ALL CHECKS PASSED" : `${failures.length} CHECK(S) FAILED`} against ${BASE}`);
  if (failures.length) {
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  for (const n of notes) console.log(`  note: ${n}`);
}

main().catch((error) => {
  console.error(`\nFAILED: ${error.message}`);
  process.exit(1);
});
