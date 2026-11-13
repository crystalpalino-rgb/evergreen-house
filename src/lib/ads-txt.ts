/**
 * The ads.txt line, derived from a publisher ID.
 *
 * Pure: no database, no server imports, so the admin screen can show the owner
 * the exact line that would be served while she types. The server reads the
 * same function in `site-settings.ts`.
 */

/** Accept pub-XXXXXXXXXXXXXXXX or ca-pub-XXXXXXXXXXXXXXXX; "" when it is neither. */
export function normalizePublisherId(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim().toLowerCase().replace(/^ca-/, "");
  return /^pub-\d{16}$/.test(trimmed) ? trimmed : "";
}

/**
 * The ads.txt body for a publisher ID, or "" when there is no usable ID.
 * Google's certification authority ID (f08c47fec0942fa0) is fixed for AdSense.
 */
export function adsTxtBody(publisherId: string | null | undefined): string {
  const id = normalizePublisherId(publisherId);
  if (!id) return "";
  return `google.com, ${id}, DIRECT, f08c47fec0942fa0\n`;
}
