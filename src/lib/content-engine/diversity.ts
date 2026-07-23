/**
 * Content Diversity Tracker — prevents content repetition by tracking
 * which products and hooks have been used recently.
 *
 * Stores history in a JSON file at the project root.
 * Auto-purges entries older than 60 days.
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ─── Types ──────────────────────────────────────────────────────────────────

interface UsageEntry {
  date: string; // ISO date string
  productIds: number[];
  room: string;
  hook: string;
}

interface HistoryData {
  version: 1;
  entries: UsageEntry[];
}

// ─── File path ──────────────────────────────────────────────────────────────

const HISTORY_FILE = path.resolve(
  process.cwd(),
  "content-engine-history.json",
);

// ─── Private helpers ────────────────────────────────────────────────────────

function loadHistory(): HistoryData {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, "utf-8");
      const data = JSON.parse(raw) as HistoryData;
      // Purge old entries on load
      return purgeOldEntries(data);
    }
  } catch {
    // Corrupt file — start fresh
    console.warn(
      "Content diversity tracker: could not read history file, starting fresh.",
    );
  }
  return { version: 1, entries: [] };
}

function saveHistory(data: HistoryData): void {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function purgeOldEntries(data: HistoryData): HistoryData {
  const cutoff = daysAgo(60);
  const filtered = data.entries.filter(
    (e) => new Date(e.date) >= cutoff,
  );
  if (filtered.length !== data.entries.length) {
    return { ...data, entries: filtered };
  }
  return data;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Mark a set of products as used in a content package.
 * Called after content is generated/approved.
 */
export function markProductsUsed(
  productIds: number[],
  room: string,
  hook: string,
): void {
  const history = loadHistory();
  history.entries.push({
    date: new Date().toISOString(),
    productIds,
    room,
    hook,
  });
  saveHistory(history);
}

/**
 * Get product IDs used in the last N days.
 * Used by the generator to avoid repeating products.
 */
export function getRecentlyUsedProducts(days: number = 60): number[] {
  const history = loadHistory();
  const cutoff = daysAgo(days);
  const ids = new Set<number>();
  for (const entry of history.entries) {
    if (new Date(entry.date) >= cutoff) {
      for (const id of entry.productIds) {
        ids.add(id);
      }
    }
  }
  return Array.from(ids);
}

/**
 * Get hooks used in the last N days.
 * Used by the generator to pick fresh hooks.
 */
export function getRecentlyUsedHooks(days: number = 60): string[] {
  const history = loadHistory();
  const cutoff = daysAgo(days);
  const hooks = new Set<string>();
  for (const entry of history.entries) {
    if (new Date(entry.date) >= cutoff) {
      hooks.add(entry.hook);
    }
  }
  return Array.from(hooks);
}

/**
 * Get all entries for inspection/debugging.
 */
export function getAllEntries(): UsageEntry[] {
  return loadHistory().entries;
}

/**
 * Manually purge all entries (for testing/reset).
 */
export function resetHistory(): void {
  saveHistory({ version: 1, entries: [] });
}

/**
 * Get the number of active entries.
 */
export function getEntryCount(): number {
  return loadHistory().entries.length;
}
