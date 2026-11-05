/**
 * P6adm phase 1 harness: render the surfaces the collection admin touches and
 * write their SSR HTML to a directory, so "before" and "after" can be diffed.
 *
 * Usage: bun run scripts/p6adm-render-snapshot.ts <outDir>
 *
 * Imports the built SSR handler directly (no server, no port), exactly as the
 * evergreen-seo-verify skill describes. DATABASE_URL is taken from .env.local
 * unconditionally, because the sandbox exports a Neon console link that wins
 * over dotenv.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2];
if (!outDir) {
  console.error("usage: bun run scripts/p6adm-render-snapshot.ts <outDir>");
  process.exit(1);
}

/* .env.local holds the real Neon connection string; the shell's DATABASE_URL is
   a console URL that the driver rejects. */
const envLocal = readFileSync(join(import.meta.dir, "..", ".env.local"), "utf8");
const line = envLocal.split("\n").find((l) => l.startsWith("DATABASE_URL="));
if (!line) throw new Error("DATABASE_URL not found in .env.local");
process.env.DATABASE_URL = line.slice("DATABASE_URL=".length).replace(/^"|"$/g, "");

const EDIT_SLUGS = [
  "heritage-christmas-edit",
  "cozy-christmas-bedroom-edit",
  "holiday-hosting-edit",
  "luxe-christmas-tree-edit",
  "thanksgiving-table-edit",
  "moody-thanksgiving-edit",
  "thanksgiving-hosting-edit",
  "thanksgiving-welcome-edit",
];

const PIN_SLUGS = [
  "luxe-christmas-tree",
  "cozy-christmas-bedroom",
  "holiday-hosting",
  "heritage-christmas",
  "holiday-hosting-table",
];

const paths = [
  "/",
  "/collections",
  ...EDIT_SLUGS.map((s) => `/collections/${s}`),
  ...PIN_SLUGS.map((s) => `/pin/${s}`),
];

const handler = (await import("../dist/server/server.js")).default as {
  fetch: (req: Request) => Promise<Response>;
};

mkdirSync(outDir, { recursive: true });

const rows: { path: string; status: number; bytes: number }[] = [];
for (const path of paths) {
  const res = await handler.fetch(
    new Request(`https://evergreenhouse.co${path}`, {
      headers: { accept: "text/html,application/xhtml+xml" },
    }),
  );
  const html = await res.text();
  const name = path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "__");
  writeFileSync(join(outDir, `${name}.html`), html);
  rows.push({ path, status: res.status, bytes: html.length });
}

for (const r of rows) {
  console.log(`${String(r.status).padEnd(4)} ${String(r.bytes).padStart(7)}  ${r.path}`);
}
