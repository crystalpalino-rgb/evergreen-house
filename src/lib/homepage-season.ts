import {
  HOMEPAGE_SCHEDULE,
  type Announcement,
  type HeroCopy,
} from "~/data/homepage-schedule";
import type { EditCardData } from "~/lib/edits";

/**
 * The homepage season switch: reads `~/data/homepage-schedule` and answers what
 * the homepage looks like on a given day.
 *
 * The day is the SITE's day, not the visitor's: the flip happens on the date in
 * US Eastern, so a reader in Tokyo at 11am on 2026-11-27 sees the page the owner
 * flipped that morning in New Jersey. `Intl` with the IANA zone does the
 * arithmetic, so daylight saving is handled and nothing here depends on the
 * server's own TZ.
 *
 * Called from the homepage loader, which runs on the server for the request and
 * hands the answer to the component as loader data: the first paint is already
 * the right hero, so there is no flash of the previous season and no client
 * clock in the decision.
 */

/** The site's own timezone (owner, decision 47: dates flip on the ET day). */
export const SITE_TIME_ZONE = "America/New_York";

/** The calendar day it is in the site's timezone, as YYYY-MM-DD. */
export function siteDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** The homepage as the table says it should be on one day. */
export interface HomepageSeason {
  /** The US Eastern day this was resolved for, YYYY-MM-DD. */
  date: string;
  /** The `from` of the newest row applied: the season the page is in. */
  since: string;
  /** That row's note, so a log line or a proof run can say what flipped. */
  note: string;
  /** The strip above the hero, or null for no strip at all. */
  announcement: Announcement | null;
  hero: HeroCopy;
  /** Slugs to lead the SHOP THE EDITS row with. */
  leadEdits: string[];
  /** Slugs off the homepage row. Their pages stay live and in /collections. */
  excludedEdits: string[];
  /** Storefront list keys under THE CURRENT EDIT, in order. */
  featuredLists: string[];
}

/**
 * Resolve the homepage state for a day. Rows on or before the day are applied
 * in date order (see the merge rules in the schedule's header comment). A date
 * earlier than every row renders the first row, so the page always has a hero.
 */
export function resolveHomepage(now: Date = new Date()): HomepageSeason {
  const date = siteDate(now);
  const rows = [...HOMEPAGE_SCHEDULE].sort((a, b) =>
    a.from < b.from ? -1 : a.from > b.from ? 1 : 0,
  );
  const applied = rows.filter((row) => row.from <= date);
  const active = applied.length > 0 ? applied : rows.slice(0, 1);

  let announcement: Announcement | null = null;
  let hero: HeroCopy | null = null;
  let leadEdits: string[] = [];
  let featuredLists: string[] = [];
  const excluded = new Set<string>();

  for (const row of active) {
    if (row.announcement !== undefined) announcement = row.announcement;
    if (row.hero) hero = row.hero;
    if (row.featuredEdits?.lead) leadEdits = row.featuredEdits.lead;
    /* Exclusions accumulate: once an edit is off the featured row it stays off
       until a later row puts it back by naming it in `lead`. */
    for (const slug of row.featuredEdits?.exclude ?? []) excluded.add(slug);
    if (row.featuredLists) featuredLists = row.featuredLists;
  }

  const last = active[active.length - 1];
  return {
    date,
    since: last.from,
    note: last.note,
    announcement,
    hero: hero as HeroCopy,
    leadEdits,
    excludedEdits: [...excluded],
    featuredLists,
  };
}

/**
 * The SHOP THE EDITS row in the season's order: the slugs the season leads with
 * first, then every other published edit in its curated order.
 *
 * A slug the season names but the database does not publish is skipped, and the
 * row fills from the edits that do exist, so an unfilled slot never renders a
 * hole. Excluded slugs are dropped from the row only: the edit itself is
 * untouched, keeps its URL and keeps its card in /collections.
 */
export function orderFeaturedEdits(
  edits: EditCardData[],
  leadEdits: string[],
  excludedEdits: string[],
): EditCardData[] {
  const excluded = new Set(excludedEdits);
  const bySlug = new Map(edits.map((edit) => [edit.slug, edit]));
  const out: EditCardData[] = [];
  const seen = new Set<string>();

  for (const slug of leadEdits) {
    if (excluded.has(slug) || seen.has(slug)) continue;
    const edit = bySlug.get(slug);
    if (!edit) continue;
    out.push(edit);
    seen.add(slug);
  }
  for (const edit of edits) {
    if (excluded.has(edit.slug) || seen.has(edit.slug)) continue;
    out.push(edit);
    seen.add(edit.slug);
  }
  return out;
}
