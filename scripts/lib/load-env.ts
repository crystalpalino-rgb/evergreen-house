/**
 * Resolve the database URL for a one-off script.
 *
 * The sandbox and the deployed site share one Neon database, and the sandbox
 * exports a `DATABASE_URL` that dotenv and shell sourcing never override. The
 * site's own `.env.local` (written by the Vercel CLI) is the value the built
 * server actually runs with, so it wins here. `.env` is the fallback for a
 * machine that has no `.env.local`, and the ambient variable is the last resort
 * (that is the only one a CI runner or Vercel build machine will have).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function fromFile(path: string): string | null {
  if (!existsSync(path)) return null;
  const line = readFileSync(path, "utf8")
    .split("\n")
    .find((l) => l.trim().startsWith("DATABASE_URL="));
  if (!line) return null;
  const value = line.trim().slice("DATABASE_URL=".length).trim();
  return value.replace(/^["']|["']$/g, "") || null;
}

export function loadDatabaseUrl(): string {
  const root = join(import.meta.dir, "..", "..");
  const url =
    fromFile(join(root, ".env.local")) ||
    fromFile(join(root, ".env")) ||
    process.env.DATABASE_URL ||
    "";
  if (!url) {
    throw new Error(
      "No DATABASE_URL: set it in site/.env.local, site/.env, or the environment.",
    );
  }
  /* neon() and the project's sql() helper both read this variable. */
  process.env.DATABASE_URL = url;
  return url;
}
