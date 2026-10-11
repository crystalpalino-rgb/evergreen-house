import type { EditProduct } from "~/lib/edits";
import { CURRENT_EDIT, type HomepageSection } from "~/lib/homepage-sections";
import { AnalyticsList } from "./AnalyticsList";
import { EditProductCard } from "./EditProductCard";

/**
 * Homepage THE CURRENT EDIT: the six pieces we would buy again, spanning the
 * seasonal collections by design. It replaces the old auto-picked "Trending
 * Finds" row, so nothing on this page is chosen by a query any more.
 *
 * The kicker, the heading and the one line of subcopy come from the curation
 * file (src/lib/homepage-sections.ts), as do the six ids, their display titles
 * and their hooks. No price, no rating, no urgency copy: none of that is
 * verified data the brand can stand behind.
 *
 * Layout rhythm matches the rest of the page: same container, same card, same
 * grid steps as the collection pages. The hairline on top keeps the section
 * distinct from the white SHOP THE LOOK product block above it.
 */
export function TheCurrentEdit({
  products,
  section = CURRENT_EDIT,
}: {
  products: EditProduct[];
  section?: HomepageSection;
}) {
  const { eyebrow, title, subcopy } = section;
  const analyticsItems = products.map((p) => ({ id: p.id, name: p.title }));

  return (
    <section className="border-t border-beige/25 bg-soft-white py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-[46rem]">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-burgundy">
            {eyebrow}
          </p>
          <h2 className="mt-2.5 font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-warm-gray sm:text-base">
            {subcopy}
          </p>
        </div>
        <AnalyticsList
          id={section.key}
          name={title}
          context={section.key}
          items={analyticsItems}
        >
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-5">
            {products.map((product) => (
              <EditProductCard key={product.id} product={product} />
            ))}
          </div>
        </AnalyticsList>
      </div>
    </section>
  );
}
