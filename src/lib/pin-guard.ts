import pinManifest from "~/data/pins/manifest.json";
import hiddenProducts from "~/data/holiday-hidden-products.json";
import type { SnapshotCollection } from "~/lib/edits";

/**
 * The pin guard.
 *
 * The five Pinterest landing pages at /pin/<slug> print, for every numbered
 * disc, the display title and the product link of one product. Those two values
 * come from the edit item, not from the pin art, so a curation change can leave
 * a pin page pointing at a title that no longer exists in the collection it
 * describes. That is the failure mode this module exists to prevent: the pin is
 * the shop window, and a pin page that disagrees with its landing page is worse
 * than a pin that was never posted.
 *
 * `scripts/build-pin-pages.mjs` regenerates `src/data/pins/manifest.json` and
 * hard-fails when a numbered product id no longer resolves to an item in its
 * destination edit. A deployed site cannot run that script (it reads the pin kit
 * in /home/team/shared and writes a checked-in file), so the same rule is re-run
 * here, in process, against the state a write would produce: the guard resolves
 * every number of every pin page against the would-be published collection set
 * and compares the result with what the checked-in pin manifest says the page
 * currently prints.
 *
 * What that gives the curation screens:
 *   - a write that would leave a pin page broken (a pinned product removed from
 *     its destination edit, the destination edit no longer live, a product that
 *     is both on sale and on the hidden list) is REFUSED, and the refusal names
 *     the pin page and the numbered disc;
 *   - a write that would leave a pin page printing a stale display title or a
 *     dead product link is REFUSED for the same reason, because the checked-in
 *     pin manifest no longer matches the state the write would publish;
 *   - a write that touches nothing a pin prints passes, and the manifest dump
 *     and the pin build have nothing to do.
 *
 * A hook change is reported as a warning rather than a refusal: the rule names
 * membership, display title and order, and the hook is the one pin page field
 * that is cosmetic. The warning says the pin page keeps the line it shows today.
 *
 * Everything in this file that the owner reads is plain words about her own
 * shop: no build language, no file names, no internal ids. A refusal always
 * opens with the same two sentences, the first of which says in her own words
 * why the change did not go through and the second of which says nothing on the
 * site changed. A warning never uses that opening, so a blocked change can never
 * be mistaken for one that went through.
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

/**
 * Why a write was refused. The codes are how the code tells the cases apart, so
 * that the retire path can select the destination case without matching on the
 * words the owner reads.
 */
export type PinGuardCode =
  | "destination-off-site"
  | "pinned-piece-removed"
  | "pinned-piece-on-sale-and-hidden"
  | "pinned-piece-sale-state-changed"
  | "pinned-piece-title-changed"
  | "pinned-piece-link-changed";

/** One refused change, with the pin page and disc it would have broken. */
export interface PinGuardError {
  code: PinGuardCode;
  /** The pin page the change would break, as the public sees it: /pin/<slug>. */
  pin: string;
  /** The numbered disc on that pin page, or 0 when the whole page is at risk. */
  n: number;
  /** The words printed on that disc, or "" when the whole page is at risk. */
  label: string;
  /** The one plain sentence the owner reads about this case. */
  message: string;
}

export interface PinGuardResult {
  ok: boolean;
  /** Reasons the write would break or stale a pin page. A non-empty list blocks the save. */
  errors: PinGuardError[];
  /** Cosmetic drift worth telling the owner about, without blocking the save. */
  warnings: string[];
  /** Pin pages the write leaves untouched, for the response summary. */
  unchanged: number;
}

/** What the owner was doing when a refusal stopped her. */
export type PinRefusalVerb = "published" | "saved";

/**
 * The opening of every refusal: the owner's own words for why a change did not
 * go through, then the reassurance that nothing was written. The verb only says
 * which action was stopped, so the sentence stays true whether she was
 * publishing a live collection or saving a change to its draft.
 */
export function pinRefusalHeadline(verb: PinRefusalVerb): string {
  return (
    `This change was not ${verb} because it would break the link on a live Pinterest pin. ` +
    `Nothing on the site changed.`
  );
}

/**
 * The opening of a refused retire. Taking a collection off the site is not a
 * publish, and the owner is told so in as many words.
 */
export function pinRetireRefusalHeadline(): string {
  return (
    "This collection was not taken off the site because it would break the link on a live " +
    "Pinterest pin. Nothing on the site changed."
  );
}

/** The full refusal text: the opening sentences, then one line per refused case. */
export function pinRefusalText(result: PinGuardResult, verb: PinRefusalVerb): string {
  if (result.ok) return "";
  return [pinRefusalHeadline(verb), ...result.errors.map((error) => error.message)].join(" ");
}

/** How a pin page and one of its discs is named to the owner. */
function pinWhere(pin: string, n: number, label: string): string {
  return n > 0 ? `The pin is ${pin}, number ${n}, ${label}.` : `The pin is ${pin}.`;
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
  const errors: PinGuardError[] = [];
  const warnings: string[] = [];
  let unchanged = 0;

  for (const page of PAGES) {
    const editSlug = page.destination.replace(/^\/collections\//, "");
    const edit = bySlug.get(editSlug);
    const pin = `/pin/${page.slug}`;
    let pageTouched = false;

    if (!edit) {
      errors.push({
        code: "destination-off-site",
        pin,
        n: 0,
        label: "",
        message:
          `${pinWhere(pin, 0, "")} The collection that pin opens would not be on the site any ` +
          `more, so anyone who taps it would land on a page that is not there.`,
      });
      continue;
    }

    const items = new Map(edit.items.map((item) => [Number(item.id), item]));

    for (const number of page.numbers) {
      const id = Number(number.product_id);
      const item = items.get(id);
      const hidden = HIDDEN.get(id);
      const where = pinWhere(pin, number.n, number.label);

      if (!item && !hidden) {
        errors.push({
          code: "pinned-piece-removed",
          pin,
          n: number.n,
          label: number.label,
          message:
            `${where} That piece would no longer be in this collection, so the pin would open ` +
            `a page without it.`,
        });
        pageTouched = true;
        continue;
      }
      if (item && hidden) {
        errors.push({
          code: "pinned-piece-on-sale-and-hidden",
          pin,
          n: number.n,
          label: number.label,
          message:
            `${where} That piece would be on sale in this collection and hidden at the same ` +
            `time, and the pin can only show one of those.`,
        });
        pageTouched = true;
        continue;
      }

      const expectedTitle = item ? item.display_title : hidden!.display_title;
      const expectedSlug = item ? item.slug : null;
      const expectedUnavailable = !item;

      if (expectedUnavailable !== Boolean(number.unavailable)) {
        errors.push({
          code: "pinned-piece-sale-state-changed",
          pin,
          n: number.n,
          label: number.label,
          message:
            `${where} That piece would change from ` +
            `${number.unavailable ? "not available to on sale" : "on sale to not available"}, ` +
            `and the pin page still says it is ` +
            `${number.unavailable ? "not available" : "on sale"}.`,
        });
        pageTouched = true;
        continue;
      }
      if (expectedTitle !== number.display_title) {
        errors.push({
          code: "pinned-piece-title-changed",
          pin,
          n: number.n,
          label: number.label,
          message:
            `${where} The card title would change to "${expectedTitle}", and the pin page still ` +
            `reads "${number.display_title}". The words printed on the pin picture do not ` +
            `change.`,
        });
        pageTouched = true;
      }
      if ((expectedSlug ?? null) !== (number.product_slug ?? null)) {
        errors.push({
          code: "pinned-piece-link-changed",
          pin,
          n: number.n,
          label: number.label,
          message:
            `${where} The card would open /product/${expectedSlug ?? "(none)"} and the pin page ` +
            `still opens /product/${number.product_slug ?? "(none)"}.`,
        });
        pageTouched = true;
      }
      if (item && (item.hook ?? "") !== (number.hook ?? "")) {
        warnings.push(
          `${pinWhere(pin, number.n, number.label)} That pin page keeps the line it shows ` +
            `today until the pin pages are refreshed.`,
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
