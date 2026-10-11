// Homepage render proof: run the built SSR handler (no server) against the real DB.
//   cd /home/team/shared/site && bun run build && bun run scripts/verify-homepage-render.ts
import { readFileSync } from "node:fs";

// The platform's DATABASE_URL is a Neon console link, so read the real one here,
// before the handler (and its src/db.ts) is imported.
const envLocal = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const real = envLocal.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!real) throw new Error("no DATABASE_URL in .env.local");
process.env.DATABASE_URL = real;

const handler = (await import("../dist/server/server.js")).default;
const BASE = "https://evergreenhouse.co";
const get = (path: string) =>
  handler.fetch(new Request(BASE + path, { headers: { accept: "text/html,application/xhtml+xml" } }));

const fail: string[] = [];
const ok = (cond: boolean, label: string, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? " :: " + extra : ""}`);
  if (!cond) fail.push(label);
};

const home = await get("/");
const html = await home.text();
ok(home.status === 200, "homepage 200", `status=${home.status}`);

// Section order from the rendered headings, in document order.
const headings = [...html.matchAll(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/g)]
  .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
  .filter(Boolean);
console.log("HEADINGS:", JSON.stringify(headings.slice(0, 24)));

const idx = (s: string) => html.indexOf(s);
const order = ["Shop the Edits", "The Holiday Hosting Table", "In this look", "The Current Edit", "Explore by Room", "From the Journal"];
const headingPositions = order.map((m) => ({ m, at: headings.indexOf(m) }));
console.log("HEADING ORDER:", JSON.stringify(headingPositions));
let ordered = true;
let prev = -1;
for (const { m, at } of headingPositions) {
  if (at < 0) { ordered = false; ok(false, `heading present: ${m}`); continue; }
  if (at < prev) ordered = false;
  prev = at;
}
// the hero H1 must be first, before the Shop the Edits row
ordered = ordered && headings.length > 1 && headings[0] === "A Season, Beautifully Collected.";
ok(ordered, "heading order: hero > Shop the Edits > Shop the Look > In this look > The Current Edit > Explore by Room > From the Journal");
ok(/text-antique-gold[^>]*>Shop the Look</.test(html), "Shop the Look eyebrow over the art");

// Copy parity for the two curated sections.
const manifest = JSON.parse(
  readFileSync("/home/team/shared/collections/homepage-manifest-2026-10-10.json", "utf8"),
);
const sections = [manifest.shop_the_look, manifest.current_edit];
for (const s of sections) {
  ok(html.includes(s.eyebrow), `eyebrow rendered: ${s.eyebrow}`);
  ok(html.includes(s.title), `title rendered: ${s.title}`);
  ok(html.includes(s.subcopy.replace(/&/g, "&amp;")), `subcopy rendered: ${s.key}`);
}
// The kicker above THE CURRENT EDIT heading uses the manifest's own alternative
// ("In the Edit") so the same four words are not printed twice.
ok(html.includes("In the Edit"), "current edit kicker rendered");

// Every curated product: card link, hook and Amazon URL.
const ANALYTICS = { shop_the_look: ["482", "483", "490", "419", "90", "102"], current_edit: ["434", "421", "439", "88", "114", "491"] };
for (const s of sections) {
  for (const item of s.items) {
    const path = item.product_path;
    const hookHit = html.includes(item.hook.replace(/&/g, "&amp;"));
    const linkHit = html.includes(`href="${path}"`);
    const amzHit = html.includes(`href="${item.amazon_url}"`);
    ok(hookHit && linkHit && amzHit, `item ${item.id} card (link/hook/amazon)`, `${linkHit ? "link" : "NO LINK"} ${hookHit ? "hook" : "NO HOOK"} ${amzHit ? "amazon" : "NO AMAZON"}`);
  }
}
ok(html.includes("Shop the full edit") && html.includes('href="/collections/holiday-hosting-edit"'), "full edit link");

// Art.
ok(html.includes('/images/shop-the-look-hero.webp'), "hero webp source");
ok(html.includes('/images/shop-the-look-hero.jpg'), "hero jpg fallback");
ok(html.includes('/images/shop-the-look-card.webp'), "4:5 card webp for phones");
ok(/width="1600" height="900"/.test(html), "explicit dimensions on the art");
ok(html.includes('data-pin-description="The Holiday Hosting Table'), "pin description on the art");

// Nothing stale.
ok(!html.includes("Trending Finds"), "no 'Trending Finds' heading");
ok(!html.includes("reaching for this week"), "no old trending subcopy");
ok(!/<h[23][^>]*>Crystal.s Edit/.test(html), "no Crystal's Edit grid");
for (const banned of ["MacBook", "Can Opener", "can opener", "Cooler", "YETI", "Roadie"]) {
  ok(!html.includes(banned), `owner exclusion absent: ${banned}`);
}
ok(!html.includes("\u2014"), "no em-dash on the homepage");
ok(!html.includes("\u2013"), "no en-dash on the homepage");

// Analytics wiring in the shipped client bundle. Static files are not served by
// the SSR handler, so read the client build from disk.
import { readdirSync } from "node:fs";
const assetsDir = new URL("../dist/client/assets/", import.meta.url);
let bundle = "";
for (const f of readdirSync(assetsDir)) {
  if (f.endsWith(".js")) bundle += readFileSync(new URL(f, assetsDir), "utf8");
}
ok(bundle.includes("view_item_list") && bundle.includes("affiliate_click"), "analytics helpers in the client bundle");
ok(bundle.includes("shop_the_look") && bundle.includes("current_edit"), "both section list ids in the client bundle");
ok(bundle.includes("event_id") && bundle.includes("amz-click-"), "affiliate_click event_id convention in the bundle");
ok((bundle.match(/dataLayer\.push/g) || []).length === 1, "exactly one dataLayer.push in the whole client bundle");

// No regression on existing URLs.
const urls = [
  "/collections/holiday-hosting-edit",
  "/collections/luxe-christmas-tree-edit",
  "/collections/heritage-christmas-edit",
  "/collections/cozy-christmas-bedroom-edit",
  "/collections",
  "/rooms",
  "/room/living-room",
  "/collection/holiday",
  "/collection/fall",
  "/blog",
  "/blog/cheap-things-that-make-your-home-look-expensive",
  "/about",
  "/terms",
  "/affiliate-disclosure",
  "/editors-picks",
];
for (const u of urls) {
  const r = await get(u);
  ok(r.status === 200, `200 ${u}`, `status=${r.status}`);
}

console.log(fail.length === 0 ? "\nALL CHECKS PASSED" : `\n${fail.length} CHECK(S) FAILED:\n - ${fail.join("\n - ")}`);
process.exit(fail.length === 0 ? 0 : 1);
