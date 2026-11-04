import { ProductCard } from "~/components/ProductCard";
import { AnalyticsList } from "~/components/AnalyticsList";
import { resolveHolidayPage, type ResolvedHolidaySet } from "~/lib/holiday";
import type { Product } from "~/lib/types";

/**
 * The holiday page body, shared by /room/holiday and /collection/holiday.
 *
 * Owner-approved structure (2026-11-04):
 *   1. a jump nav with the three set names
 *   2. The Hosting Table
 *   3. Tree and Mantel
 *   4. The Porch
 *   5. More Christmas Finds, everything else in the holiday room
 *
 * Membership and order come from src/data/holiday-sets.json, and the products
 * with no Amazon buy box are dropped through src/lib/holiday.ts. Each set is
 * its own AnalyticsList with its own list id, so GA4 sees four lists per page
 * instead of one undifferentiated grid.
 *
 * The page keeps its own hero, breadcrumbs and single Amazon disclosure: this
 * component renders the sets and nothing else.
 */

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

function SetGrid({ listId, listName, products }: { listId: string; listName: string; products: Product[] }) {
  return (
    <AnalyticsList id={listId} name={listName} items={products}>
      <div className={GRID}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </AnalyticsList>
  );
}

function SetSection({ set, listPrefix }: { set: ResolvedHolidaySet; listPrefix: string }) {
  if (set.products.length === 0) return null;
  const headingId = `holiday-set-${set.id}-heading`;
  return (
    <section id={set.id} aria-labelledby={headingId} className="scroll-mt-24 pt-10 first:pt-0">
      <h2 id={headingId} className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
        {set.title}
      </h2>
      <p className="mt-2 max-w-2xl text-warm-gray">{set.intro}</p>
      <div className="mt-6">
        <SetGrid listId={`${listPrefix}-${set.id}`} listName={set.title} products={set.products} />
      </div>
    </section>
  );
}

export function HolidaySets({ products, listPrefix }: { products: Product[]; listPrefix: string }) {
  const { sets, more } = resolveHolidayPage(products);
  const anchors = sets.filter((set) => set.products.length > 0);

  return (
    <div>
      <nav aria-label="Holiday sets" className="mb-8 border-y border-beige/20 py-3">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <li className="text-xs font-semibold uppercase tracking-[0.14em] text-taupe">Jump to</li>
          {anchors.map((set) => (
            <li key={set.id}>
              <a href={`#${set.id}`} className="font-medium text-warm-dark underline-offset-4 transition-colors hover:text-terracotta hover:underline">
                {set.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {anchors.map((set) => (
        <SetSection key={set.id} set={set} listPrefix={listPrefix} />
      ))}

      {more.length > 0 && (
        <section id="more-christmas-finds" aria-labelledby="holiday-more-heading" className="mt-12 scroll-mt-24 border-t border-beige/20 pt-10">
          <h2 id="holiday-more-heading" className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
            More Christmas Finds
          </h2>
          <div className="mt-6">
            <SetGrid listId={`${listPrefix}-more`} listName="More Christmas Finds" products={more} />
          </div>
        </section>
      )}
    </div>
  );
}
