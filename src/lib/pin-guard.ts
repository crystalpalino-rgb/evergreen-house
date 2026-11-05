import pinManifest from "~/data/pins/manifest.json";
import hiddenProducts from "~/data/holiday-hidden-products.json";
import type { SnapshotCollection } from "~/lib/edits";

/**
 * The pin rebuild guard.
 *
 * The five Pinterest landing pages at /pin/<slug> print, for every numbered
 * disc, the display title and the product link of one product. Those two values
 * come from the edit item, not from the pin art, so a curation change can leave
 * a pin page pointing at a title that no longer exists in the collection it
 * describes. That is the failure mode this module exists to prevent: the pin is
 * the shop window, and a pin page that disagrees with its landing page is worse
 * than a pin that was never posted.
 *
 * `scripts/build-pin-pages.mjs` is the build that regenerates
 * `src/data/pins/manifest.json`, and it HARD-FAILS when a numbered product id no
 * longer resolves to an item in its destination edit. A deployed site cannot run
 * that build (it reads the pin kit in /home/team/shared and writes a checked-in
 * file), so the same rule is re-run here, in process, against the state a write
 * would produce: the guard resolves every number of every pin page against the
 * would-be published collection set and compares the result with what the
 * checked-in pin manifest says the page currently prints.
 *
 * What that gives the curation screens:
 *   - a write that would make the build fail (a pinned product removed from its
 *     destination edit, the destination edit no longer live, a product that is
 *     both on sale and on the no-buy-box list) is REFUSED with the pin and the
 *     number named;
 *   - a write that would leave a pin page printing a stale display title or a
 *     dead product link is REFUSED for the same reason, because the checked-in
 *     pin manifest no longer matches the state the write would publish;
 *   - a write that touches nothing a pin prints passes, and the manifest dump
 *     and the pin build have nothing to do.
 *
 * A hook change is reported as a warning rather than a refusal: the rule names
 * membership, display title and order, and the hook is the one pin page field
 * that is cosmetic. The warning tells the operator to rebuild before the next
 * deploy.
 */

/** One numbered disc as the checked-in pin manifest records it. */
interface PinNumberRow {
  n: number;
  label: string;
  product_id: number;
  display_title: string;
  product_slug: string | null;
  hook: string | null;
  unavailable: boolean;
}

interface PinPageRow {
  slug: string;
  destination: string;
  numbers: PinNumberRow[];
}

interface HiddenRow {
  id: number;
  display_title: string;
}

const PAGES = (pinManifest as { pages: PinPageRow[] }).pages;
const HIDDEN = new Map<number, HiddenRow>(
  (hiddenProducts as { hidden: HiddenRow[] }).hidden.map((row) => [Number(row.id), row]),
);

export interface PinGuardResult {
  ok: boolean;
  /** Reasons the write would break or stale a pin page. A non-empty list blocks the save. */
  errors: string[];
  /** Cosmetic drift the operator should rebuild for, without blocking the save. */
  warnings: string[];
  /** Pin pages the write leaves untouched, for the response summary. */
  unchanged: number;
}

/**
 * Resolve every pin number against a published collection set and compare the
 * result with the checked-in pin manifest.
 *
 * `published` is the set the public pages would render after the write, i.e.
 * the published snapshots with the edit being saved substituted for its draft.
 * Pass `[]` to check the current published state as it stands.
 */
export function checkPinPages(published: SnapshotCollection[]): PinGuardResult {
  const bySlug = new Map(published.map((edit) => [edit.slug, edit]));
  const errors: string[] = [];
  const warnings: string[] = [];
  let unchanged = 0;

  for (const page of PAGES) {
    const editSlug = page.destination.replace(/^\/collections\//, "");
    const edit = bySlug.get(editSlug);
    let pageTouched = false;

    if (!edit) {
      errors.push(
        `/pin/${page.slug} points at the collection ${editSlug}, which would not be live. ` +
          `The pin build fails when its destination edit is missing, so this change is refused.`,
      );
      continue;
    }

    const items = new Map(edit.items.map((item) => [Number(item.id), item]));

    for (const number of page.numbers) {
      const id = Number(number.product_id);
      const item = items.get(id);
      const hidden = HIDDEN.get(id);
      const where = `/pin/${page.slug} number ${number.n} ("${number.label}", product id ${id})`;

      if (!item && !hidden) {
        errors.push(
          `${where} is no longer in ${editSlug} and is not on the no-buy-box list. ` +
            `The pin build fails rather than drop a card, so this change is refused.`,
        );
        pageTouched = true;
        continue;
      }
      if (item && hidden) {
        errors.push(
          `${where} would be both on sale in ${editSlug} and on the no-buy-box list, ` +
            `which the pin build treats as a stale input. This change is refused.`,
        );
        pageTouched = true;
        continue;
      }

      const expectedTitle = item ? item.display_title : hidden!.display_title;
      const expectedSlug = item ? item.slug : null;
      const expectedUnavailable = !item;

      if (expectedUnavailable !== Boolean(number.unavailable)) {
        errors.push(
          `${where} would switch between on sale and off sale. ` +
            `The checked-in pin page still says ${number.unavailable ? "not available" : "on sale"}, ` +
            `so this change is refused until the pin pages are rebuilt.`,
        );
        pageTouched = true;
        continue;
      }
      if (expectedTitle !== number.display_title) {
        errors.push(
          `${where} would print "${expectedTitle}" while the checked-in pin page still prints ` +
            `"${number.display_title}". This change is refused until the pin pages are rebuilt.`,
        );
        pageTouched = true;
      }
      if ((expectedSlug ?? null) !== (number.product_slug ?? null)) {
        errors.push(
          `${where} would link to /product/${expectedSlug ?? "(none)"} while the checked-in pin ` +
            `page still links to /product/${number.product_slug ?? "(none)"}. This change is ` +
            `refused until the pin pages are rebuilt.`,
        );
        pageTouched = true;
      }
      if (item && (item.hook ?? "") !== (number.hook ?? "")) {
        warnings.push(
          `${where} carries a new hook line. The pin page will keep the old one until ` +
            `the pin pages are rebuilt.`,
        );
        pageTouched = true;
      }
    }

    if (!pageTouched) unchanged += 1;
  }

  return { ok: errors.length === 0, errors, warnings, unchanged };
}

/**
 * The published set with one collection replaced by its draft.
 *
 * A collection that is not live is not in the published set and cannot be
 * substituted in: no pin page points at a draft, and adding one would invent a
 * destination the build has never seen.
 */
export function withEditSubstituted(
  published: SnapshotCollection[],
  isLive: boolean,
  draft: SnapshotCollection,
): SnapshotCollection[] {
  if (!isLive) return published;
  return published.map((edit) => (edit.slug === draft.slug ? draft : edit));
}

/** The message the curation screens show when the guard refuses a save. */
export function pinGuardMessage(result: PinGuardResult): string {
  if (result.ok) return "";
  return (
    "Not saved: this change would leave a Pinterest landing page out of date or break the " +
    `pin build. ${result.errors.join(" ")}`
  );
}
