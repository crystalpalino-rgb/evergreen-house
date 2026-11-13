/**
 * Site settings that the owner edits from the admin screens and that the server
 * reads on every request: the head injection snippet and the ads.txt publisher
 * ID.
 *
 * Server only. Both values live in the `site_settings` table (key/value), so a
 * change takes effect without a rebuild or a deploy.
 *
 * Nothing here may ever take the site down. Every read is wrapped so a missing
 * table, a missing DATABASE_URL or a value that no longer parses answers with
 * "inject nothing" instead of an error page.
 */

import { sql } from "../db";
import { parseHeadSnippet, type HeadScript, type HeadSnippetResult } from "./head-snippet";
import { adsTxtBody } from "./ads-txt";

export { adsTxtBody, normalizePublisherId } from "./ads-txt";

/** Key holding the raw pasted snippet, exactly as the owner typed it. */
export const HEAD_HTML_KEY = "ads_head_html";
/** Key holding the AdSense publisher ID, e.g. pub-1234567890123456. */
export const ADS_PUBLISHER_KEY = "ads_txt_publisher_id";

/** How long a read is reused before the database is asked again. */
const CACHE_MS = 30_000;

export interface AdsSettings {
  /** The snippet exactly as saved. */
  headHtml: string;
  /** The publisher ID exactly as saved. */
  publisherId: string;
  /** When either value was last written, ISO string, or null. */
  updatedAt: string | null;
}

const EMPTY: AdsSettings = { headHtml: "", publisherId: "", updatedAt: null };

let cache: { at: number; value: AdsSettings } | null = null;

/** Forget the cached read so the next request sees a fresh save. */
export function clearAdsSettingsCache(): void {
  cache = null;
}

/** Read both settings. Throws only if the database itself cannot be reached. */
export async function readAdsSettings(): Promise<AdsSettings> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  const db = sql();
  const rows = (await db`
    SELECT key, value, updated_at FROM site_settings
    WHERE key = ${HEAD_HTML_KEY} OR key = ${ADS_PUBLISHER_KEY}
  `) as Array<{ key: string; value: string | null; updated_at: string | Date | null }>;

  const next: AdsSettings = { ...EMPTY };
  let newest = 0;
  for (const row of rows) {
    if (row.key === HEAD_HTML_KEY) next.headHtml = row.value ?? "";
    if (row.key === ADS_PUBLISHER_KEY) next.publisherId = row.value ?? "";
    if (row.updated_at) {
      const ms = new Date(row.updated_at).getTime();
      if (Number.isFinite(ms) && ms > newest) newest = ms;
    }
  }
  next.updatedAt = newest ? new Date(newest).toISOString() : null;

  cache = { at: Date.now(), value: next };
  return next;
}

/** Read both settings, answering empty rather than throwing. */
export async function readAdsSettingsSafely(): Promise<AdsSettings> {
  try {
    return await readAdsSettings();
  } catch (err) {
    console.error("site settings read failed:", err instanceof Error ? err.message : err);
    return { ...EMPTY };
  }
}

/** Write one setting. Upsert, so a key that does not exist yet is created. */
export async function writeAdsSetting(key: string, value: string): Promise<void> {
  const db = sql();
  await db`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${key}, ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()
  `;
  clearAdsSettingsCache();
}

/**
 * The script tags the document head should render right now.
 *
 * This is the second lock behind the admin save: whatever is stored is parsed
 * again here, and anything that does not come back clean injects nothing. It
 * never throws, so a bad value can never stop a page rendering.
 */
export async function getHeadScriptsForRender(): Promise<HeadScript[]> {
  const settings = await readAdsSettingsSafely();
  if (!settings.headHtml.trim()) return [];
  const parsed = parseHeadSnippet(settings.headHtml);
  if (!parsed.ok) {
    if (parsed.problems.length) {
      console.error("head snippet refused at render:", parsed.problems.join(" | "));
    }
    return [];
  }
  return parsed.scripts;
}

/** Parse the stored snippet the way the renderer does, for the admin screen. */
export async function getStoredHeadSnippet(): Promise<{
  settings: AdsSettings;
  parsed: HeadSnippetResult;
}> {
  const settings = await readAdsSettingsSafely();
  return { settings, parsed: parseHeadSnippet(settings.headHtml) };
}

/**
 * Answer /ads.txt. Empty setting means no file at all: a 404 with an empty
 * body, never a placeholder line.
 */
export async function handleAdsTxt(): Promise<Response> {
  const noStore = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
    "X-Robots-Tag": "noindex",
  };
  try {
    const settings = await readAdsSettings();
    const body = adsTxtBody(settings.publisherId);
    if (!body) return new Response("", { status: 404, headers: noStore });
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new Response("", { status: 404, headers: noStore });
  }
}
