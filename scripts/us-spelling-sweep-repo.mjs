/**
 * Repo half of the one US-spelling standardisation sweep.
 *
 * Same mapping table and same word-boundary rule as scripts/us-spelling-sweep.mjs
 * (the database half). It walks the working tree, prints a per-file hit count,
 * and with --apply rewrites the copy in place.
 *
 * Never touched, only reported:
 *   - node_modules, dist, .git, .vercel, .run (build output and dependencies)
 *   - src/data/**            (historical decision record: edits, holiday sets,
 *                             hidden product ids)
 *   - curation/**            (dated curation decision records)
 *   - content-engine-history.json
 *   - this script and its sibling, which carry the British forms as data
 *   - .env*, bun.lock, package.json (no copy in them)
 *
 * Generated statics (public/sitemap-*.xml, public/google-merchant-feed.xml,
 * public/evergreen-products.csv, public/sitemap-images.xml) are swept too, so
 * the committed copy matches what the next generation step writes; the
 * generation step is then run again to prove it agrees.
 *
 * Usage:
 *   bun run scripts/us-spelling-sweep-repo.mjs            # scan only
 *   bun run scripts/us-spelling-sweep-repo.mjs --apply    # rewrite in place
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname, sep } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const APPLY = process.argv.includes("--apply");

const PAIRS = JSON.parse(readFileSync(new URL("./us-spelling-map.json", import.meta.url), "utf8"));
const MAP = new Map([...PAIRS].sort((a, b) => b[0].length - a[0].length).map(([b, u]) => [b, u]));
const FORMS = [...MAP.keys()];
const RE = new RegExp(`\\b(?:${FORMS.join("|")})\\b`, "gi");

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".vercel",
  ".run",
  ".output",
  "coverage",
]);
/** Paths that are records or self-referential data, never rewritten. */
const SKIP_PATHS = [
  "src/data/",
  "curation/",
  "content-engine-history.json",
  "scripts/us-spelling-sweep.mjs",
  "scripts/us-spelling-sweep-repo.mjs",
  "scripts/us-spelling-map.json",
  // Colour matchers, not copy: both read an imported Amazon listing title and
  // map a colour word to its canonical US value. They must keep recognising
  // "Grey" in a merchant title, so the British form stays on purpose.
  "src/lib/content-engine/scorer.ts",
  "scripts/backfill-products.ts",
  "bun.lock",
  "package.json",
];
const EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".md",
  ".html",
  ".json",
  ".txt",
  ".xml",
  ".csv",
  ".sh",
  ".yml",
  ".yaml",
]);

function matchCase(original, us) {
  if (original === original.toUpperCase() && original !== original.toLowerCase()) {
    return us.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) return us[0].toUpperCase() + us.slice(1);
  return us;
}
const convert = (text) => text.replace(RE, (m) => matchCase(m, MAP.get(m.toLowerCase())));

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const rel = relative(ROOT, full).split(sep).join("/");
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (EXTS.has(extname(entry).toLowerCase())) {
      out.push({ full, rel });
    }
  }
  return out;
}

const files = walk(ROOT);
const skipped = files.filter((f) => SKIP_PATHS.some((p) => f.rel.startsWith(p)));
const scanned = files.filter((f) => !skipped.includes(f));

const report = [];
let total = 0;
const wordTotals = {};
const changed = [];

for (const f of scanned) {
  const text = readFileSync(f.full, "utf8");
  const found = [];
  for (const m of text.matchAll(RE)) {
    found.push({ from: m[0], to: matchCase(m[0], MAP.get(m[0].toLowerCase())) });
  }
  if (!found.length) continue;
  total += found.length;
  for (const h of found) {
    wordTotals[h.from.toLowerCase()] = (wordTotals[h.from.toLowerCase()] || 0) + 1;
  }
  report.push({ rel: f.rel, count: found.length, words: found.map((h) => h.from) });
  if (APPLY) {
    const next = convert(text);
    if (next !== text) {
      writeFileSync(f.full, next);
      changed.push(f.rel);
    }
  }
}

// Skipped files are still scanned, so a record that carries a British form is
// named in the log rather than silently ignored.
const skippedReport = [];
for (const f of skipped) {
  const text = readFileSync(f.full, "utf8");
  const n = [...text.matchAll(RE)].length;
  if (n) skippedReport.push({ rel: f.rel, count: n });
}

report.sort((a, b) => b.count - a.count || a.rel.localeCompare(b.rel));
console.log(`===== REPO ${APPLY ? "APPLY" : "SCAN"} =====`);
console.log(`files scanned: ${scanned.length}   files skipped (records/self): ${skipped.length}`);
for (const r of report) {
  console.log(`  ${String(r.count).padStart(3)}  ${r.rel}   ${r.words.join(", ")}`);
}
console.log(`TOTAL ${total} across ${report.length} files`);
if (skippedReport.length) {
  console.log(`\nLeft alone on purpose (records and matchers, not copy):`);
  for (const r of skippedReport.sort((a, b) => a.rel.localeCompare(b.rel))) {
    console.log(`  ${String(r.count).padStart(3)}  ${r.rel}`);
  }
}
console.log(
  `words: ${Object.entries(wordTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([w, n]) => `${w} ${n}`)
    .join(", ")}`,
);
if (APPLY) console.log(`\nrewrote ${changed.length} files`);
