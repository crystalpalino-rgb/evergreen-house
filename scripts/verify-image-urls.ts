// Verifies that product image_url values really return images.
//
// Usage:
//   bun run scripts/verify-image-urls.ts [--batch=<import_batch>] [--ids=1,2,3] [--proof=<path>]
//
// For every row in scope with a non-null image_url it fetches the URL and records
// HTTP status, content-type and byte size. A URL only passes when it returns
// HTTP 200, an image/* content-type and at least MIN_IMAGE_BYTES of data, which
// rules out Amazon's 43-byte 1x1 "no image" placeholder. Rows with a null
// image_url are reported as missing. Exits non-zero if anything fails.

import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const MIN_IMAGE_BYTES = 5000;
const TIMEOUT_MS = 20000;

interface Row {
  id: number;
  name: string;
  amazon_url: string;
  image_url: string | null;
}

function loadEnv() {
  try {
    const envFile = readFileSync(resolve(import.meta.dir, "..", ".env"), "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      if (!process.env[trimmed.slice(0, eq)]) process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
    }
  } catch {
    // Rely on the process environment.
  }
}
loadEnv();
const sql = neon(process.env.DATABASE_URL!);

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

const batch = arg("batch");
const proofPath = arg("proof");
const ids = arg("ids")
  ?.split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n));

const rows = (await sql`
  SELECT id, name, amazon_url, image_url FROM products
  WHERE ${batch ? sql`import_batch = ${batch}` : sql`TRUE`}
  ORDER BY id
`) as Row[];

const scope = ids?.length ? rows.filter((r) => ids.includes(r.id)) : rows;

const results: any[] = [];
let pass = 0;
let fail = 0;
let missing = 0;

for (const r of scope) {
  if (!r.image_url) {
    missing++;
    results.push({ id: r.id, result: "missing", name: r.name });
    console.log(`${r.id}\tMISSING\tnull image_url\t${r.name}`);
    continue;
  }
  try {
    const res = await fetch(r.image_url, {
      headers: { "User-Agent": USER_AGENT, Accept: "image/avif,image/webp,image/jpeg,image/*,*/*;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ct = res.headers.get("content-type");
    const bytes = Buffer.from(await res.arrayBuffer()).length;
    const ok = res.status === 200 && !!ct && ct.toLowerCase().startsWith("image/") && bytes >= MIN_IMAGE_BYTES;
    if (ok) pass++;
    else fail++;
    results.push({ id: r.id, result: ok ? "pass" : "fail", status: res.status, contentType: ct, bytes, url: r.image_url });
    console.log(`${r.id}\t${ok ? "PASS" : "FAIL"}\t${res.status}\t${ct}\t${bytes}\t${r.name.slice(0, 40)}`);
  } catch (err: any) {
    fail++;
    results.push({ id: r.id, result: "fail", error: err?.message ?? "fetch error", url: r.image_url });
    console.log(`${r.id}\tFAIL\tERR\t${err?.message}\t${r.name.slice(0, 40)}`);
  }
}

console.log(`\nSummary: ${scope.length} rows | ${pass} pass | ${fail} fail | ${missing} missing`);
if (proofPath) {
  writeFileSync(proofPath, JSON.stringify({ checkedAt: new Date().toISOString(), scope: batch ?? "all", rows: scope.length, pass, fail, missing, results }, null, 1));
  console.log(`Proof written to ${proofPath}`);
}
if (fail || missing) process.exit(1);
