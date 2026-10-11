import { EDITS } from "~/lib/edits";
import { EditCard } from "./EditCard";

/**
 * Homepage SHOP THE EDITS row: the four published curated edits, immediately
 * below the hero. Image-led and deliberately wordless: art, serif title, one
 * link each. No prices, no product copy, nothing to read before the picture.
 *
 * The four cards come from the checked-in curation manifest, so adding or
 * retiring an edit is a data change, not a layout change.
 */
export function ShopTheEdits() {
  return (
    <section className="bg-soft-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
              Shop the Edits
            </h2>
            <p className="mt-2 text-sm text-warm-gray sm:text-base">
              Four curated edits for the season.
            </p>
          </div>
          <a
            href="/collections"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-burgundy transition-colors hover:text-burgundy-deep"
          >
            All collections
          </a>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-4">
          {EDITS.map((edit, i) => (
            <EditCard key={edit.slug} edit={edit} eager={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
