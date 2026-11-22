/**
 * The homepage season switch, as a table.
 *
 * Owner decision 47 (the flip calendar) says the homepage changes on fixed
 * dates: the Moody Thanksgiving Edit comes off on 2026-11-27 with the Heritage
 * Christmas Edit taking its place, the Christmas hero comes down on 2026-12-26
 * with the Reset hero up the same day, and the January lists are featured from
 * 2026-12-28. Nobody should have to remember any of that, and none of it should
 * live in the route as an `if`.
 *
 * So the whole calendar is this one checked-in table. `resolveHomepage()` in
 * `~/lib/homepage-season` reads it with the request's date in the site's own
 * timezone (US Eastern) and returns the state of the page for that day. Adding
 * a future flip is one row here and no new code anywhere.
 *
 * How the rows combine: a row is a CHANGE, not a snapshot. Every row whose
 * `from` is on or before today is applied in date order, later rows winning:
 *
 *   announcement   replaced whole when a row sets it (null removes the strip)
 *   hero           replaced whole (art direction plus the four lines of copy)
 *   featuredEdits  `lead` replaces the leading order, `exclude` ACCUMULATES:
 *                  an edit taken off the featured row stays off, because the
 *                  later rows in the calendar have no reason to restate it
 *   featuredLists  replaced whole (the storefront list cards under THE CURRENT
 *                  EDIT), by list key
 *
 * What a row can never do is retire a page. `exclude` only decides what the
 * homepage features: the edit keeps its URL, keeps its card in /collections and
 * keeps rendering, exactly like the other de-featured holiday pages.
 *
 * Every list and edit a row names is looked up, never assumed: a key with no
 * definition yet (the January list pages are a separate build) is skipped and
 * the slot is filled from what does exist, so an unfilled slot never renders a
 * hole.
 *
 * Dates are US Eastern calendar days, written YYYY-MM-DD. They compare as
 * strings, which is why they are written in that order.
 */

/** The four lines of hero copy, owned by the season rather than the component. */
export interface HeroCopy {
  /** Small caps line above the headline. */
  eyebrow: string;
  /** The h1. */
  headline: string;
  /** One line under the headline. */
  sub: string;
  ctaLabel: string;
  ctaHref: string;
  /**
   * Art direction, by key: see HERO_CONCEPTS in ~/components/Hero. A new season
   * points at art that already exists; no row invents an image.
   */
  concept: "a" | "b" | "c";
}

/** The announcement strip above the hero. */
export interface Announcement {
  text: string;
  label: string;
  href: string;
}

export interface HomepageChange {
  /** First US Eastern day this change is live, YYYY-MM-DD. */
  from: string;
  /** What this row does, for whoever reads the table next. */
  note: string;
  announcement?: Announcement | null;
  hero?: HeroCopy;
  featuredEdits?: {
    /** Slugs to lead the SHOP THE EDITS row with, in this order. */
    lead?: string[];
    /** Slugs off the homepage row. Their pages stay live and in /collections. */
    exclude?: string[];
  };
  /** Storefront list cards under THE CURRENT EDIT, by key, in order. */
  featuredLists?: string[];
}

export const HOMEPAGE_SCHEDULE: HomepageChange[] = [
  {
    /* The season as it stands before the first flip. Everything below is a
       change against this row, so this is also what any earlier date renders. */
    from: "2026-11-01",
    note: "Holiday season: Heritage Christmas hero, holiday shop strip, seven edits, Under $19 and Reset list cards.",
    announcement: {
      text: "The Holiday Shop is live. Warm, curated finds for the season.",
      label: "Shop Holiday",
      href: "/collection/holiday",
    },
    hero: {
      eyebrow: "THE HOLIDAY EDIT \u00B7 2026",
      headline: "A Season, Beautifully Collected.",
      sub: "Timeless finds for a home worth coming back to.",
      ctaLabel: "SHOP THE HOLIDAY EDIT",
      ctaHref: "/collection/holiday",
      concept: "a",
    },
    featuredEdits: {
      /* The Timeless Bedroom Edit is live in /collections with no homepage card
         yet (owner, 2026-11-20), and the Vintage Christmas Edit is the same
         (owner, 2026-11-22). Taking a slug off this list gives it its card. */
      exclude: ["timeless-bedroom-edit", "vintage-christmas-edit"],
    },
    featuredLists: ["under19", "reset-list"],
  },
  {
    /* Owner decision 47: the Moody Thanksgiving Edit comes off the homepage on
       the Friday after Thanksgiving. The page stays live and in /collections;
       the Heritage Christmas Edit takes the slot it leaves. */
    from: "2026-11-27",
    note: "Moody Thanksgiving off the featured row, Heritage Christmas leads it. Moody's page stays live.",
    featuredEdits: {
      lead: ["heritage-christmas-edit"],
      exclude: ["moody-thanksgiving-edit"],
    },
  },
  {
    /* Owner decision 47: the Christmas hero comes down the day after Christmas
       and the Reset hero goes up the same day. The art is the timeless concept
       the designer already shipped (sun-washed room, no holiday styling), which
       is the Reset look without inventing a new image. */
    from: "2026-12-26",
    note: "Christmas hero down, Reset hero up, holiday strip to the Reset List, Under $19 card off.",
    announcement: {
      text: "The Reset is here. Planners, meal prep, and a home that runs itself.",
      label: "Read the Reset List",
      href: "/blog/the-reset-list-17-finds",
    },
    hero: {
      eyebrow: "THE JANUARY EDIT \u00B7 2027",
      headline: "A Fresh Start, Beautifully Collected.",
      sub: "Calm, considered finds for a home that runs itself.",
      ctaLabel: "READ THE RESET LIST",
      ctaHref: "/blog/the-reset-list-17-finds",
      concept: "c",
    },
    featuredLists: ["reset-list"],
  },
  {
    /* Owner decisions 48 and 49: the four January list pages go live this day
       and New Year, Organized Home is the featured one for January. That build
       is separate, so the featured slot names the list now: until the list
       exists it is skipped and the Reset List card stays in place, and the
       January card appears the day the list is defined with no code change. */
    from: "2026-12-28",
    note: "January season: New Year, Organized Home featured in the list slot, January strip.",
    announcement: {
      text: "The January Reset is here. Organized home finds lead the season.",
      label: "Shop the Reset List",
      href: "/blog/the-reset-list-17-finds",
    },
    featuredLists: ["new-year-organized-home", "reset-list"],
  },
];
