// Verify the two curated homepage sections against the live DB, by id.
// Run: bun run scripts/verify-homepage-sections.ts   (with DATABASE_URL set)
import { readFileSync } from "node:fs";

const url = (() => {
  // site/.env.local carries the real connection string.
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres")) {
    return process.env.DATABASE_URL;
  }
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = txt.match(/^DATABASE_URL=(.*)$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
})();
if (!url) throw new Error("no DATABASE_URL");

const { neon } = await import("@neondatabase/serverless");
const db = neon(url);

const manifest = JSON.parse(
  readFileSync("/home/team/shared/collections/homepage-manifest-2026-10-10.json", "utf8"),
);

const sections = [manifest.shop_the_look, manifest.current_edit];
const all = sections.flatMap((s) => s.items.map((i) => ({ ...i, section: s.key })));
const ids = all.map((i) => i.id);
console.log("ids:", ids.join(","));

const rows = (await db.query(
  `SELECT id, name, seo_slug, is_active, amazon_url, image_url, image_alt, price, rating FROM products WHERE id IN (${ids.join(",")})`,
  [],
)) as any[];

const byId = new Map(rows.map((r) => [Number(r.id), r]));
let bad = 0;
const problems: string[] = [];
for (const item of all) {
  const row = byId.get(item.id);
  if (!row) {
    problems.push(`${item.id} MISSING from products`);
    bad++;
    continue;
  }
  const slug = (row.seo_slug || "").trim() ||
    String(row.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
  const path = `/product/${slug}`;
  const okPath = path === item.product_path;
  const okUrl = row.amazon_url === item.amazon_url;
  const okActive = row.is_active === true;
  if (!okPath || !okUrl || !okActive) {
    problems.push(
      `${item.id} path=${path} (manifest ${item.product_path}, ${okPath ? "ok" : "MISMATCH"}) active=${row.is_active} url=${okUrl ? "ok" : "MISMATCH " + row.amazon_url}`,
    );
    bad++;
  }
  console.log(
    `${item.section} ${item.id} active=${row.is_active} slug=${slug} amazon=${row.amazon_url?.slice(-30)} img=${row.image_url ? "yes" : "NO"} alt=${row.image_alt ? "yes" : "NO"} name=${JSON.stringify(row.name)}`,
  );
}

// exclusions must not appear
const banned = [22, 184, 195, 221, 290];
const bannedHit = banned.filter((b) => ids.includes(b));
if (bannedHit.length) problems.push(`owner exclusions present: ${bannedHit.join(",")}`);
const uniq = new Set(ids);
if (uniq.size !== 12) problems.push(`expected 12 distinct ids, got ${uniq.size}`);

// em-dash / en-dash audit on the copy that ships
const copy = JSON.stringify(sections.map((s) => ({ e: s.eyebrow, t: s.title, s: s.subcopy, items: s.items.map((i) => [i.display_title, i.hook]) })));
for (const ch of ["\u2014", "\u2013"]) {
  if (copy.includes(ch)) problems.push(`dash ${JSON.stringify(ch)} in curated copy`);
}
// compare with the checked-in TS file
const ts = readFileSync(new URL("../src/lib/homepage-sections.ts", import.meta.url), "utf8");
for (const s of sections) {
  for (const v of [s.eyebrow, s.title, s.subcopy, ...s.items.flatMap((i: any) => [i.display_title, i.hook])]) {
    if (!ts.includes(v)) problems.push(`copy missing from homepage-sections.ts: ${JSON.stringify(v)}`);
  }
}
for (const s of sections) {
  for (const i of s.items) if (!ts.includes(`id: ${i.id},`)) problems.push(`id ${i.id} missing from TS`);
}

console.log(bad === 0 && problems.length === 0 ? "ALL OK: 12 products verified against the live DB + copy parity" : "PROBLEMS:");
for (const p of problems) console.log(" -", p);
process.exit(problems.length === 0 ? 0 : 1);
