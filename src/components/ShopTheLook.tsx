import type { EditProduct } from "~/lib/edits";
import { SHOP_THE_LOOK, type HomepageSection } from "~/lib/homepage-sections";
import { AnalyticsList } from "./AnalyticsList";
import { EditProductCard } from "./EditProductCard";

/**
 * Homepage SHOP THE LOOK: one scene, one table.
 *
 * The section is a single full-bleed tablescape photograph (the holiday hosting
 * table from /collections/holiday-hosting-edit) with six curated pieces below it,
 * not a stack of mini collection cards: every product in the list physically sits
 * on that one table, so the picture and the list are the same idea.
 *
 * Art: webp first with a jpg fallback, both shipped sizes used. The 4:5 crop
 * (1200x1500) carries the band on phones, where it stays tall enough to read;
 * the 16:9 hero (1600x900) takes over from the sm breakpoint.
 *
 * Type over the art: the delivered hero keeps its LEFT third quiet (measured
 * mean L 72, white type at 9.1:1), so the headline sits left aligned over the
 * photograph with no scrim. On phones the copy drops below the art instead of
 * sitting on a 4:5 crop the designer did not measure, and the band turns into a
 * midnight block. No text is baked into the image.
 *
 * All copy comes from the curation file via src/lib/homepage-sections.ts.
 */
export function ShopTheLook({
  products,
  section = SHOP_THE_LOOK,
}: {
  products: EditProduct[];
  section?: HomepageSection;
}) {
  const { eyebrow, title, subcopy, link } = section;
  /* GA4 payload for view_item_list: the id plus the display title the card shows. */
  const analyticsItems = products.map((p) => ({ id: p.id, name: p.title }));

  return (
    <section className="bg-midnight">
      <div className="relative isolate">
        <div className="relative aspect-[4/5] w-full sm:aspect-[16/9]">
          <picture>
            <source
              media="(max-width: 639px)"
              srcSet="/images/shop-the-look-card.webp"
              type="image/webp"
            />
            <source media="(max-width: 639px)" srcSet="/images/shop-the-look-card.jpg" />
            <source srcSet="/images/shop-the-look-hero.webp" type="image/webp" />
            <img
              src="/images/shop-the-look-hero.jpg"
              alt="A holiday hosting table set with holly banded china, a Christmas tree glass pitcher, a tree shaped wooden platter, walnut taper candlesticks and a run of votive candlelight."
              width={1600}
              height={900}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              data-pin-description="The Holiday Hosting Table: holly banded china, walnut tapers and candlelight. Shop the look at Evergreen House."
            />
          </picture>
        </div>
        {/* Copy: in the quiet left band over the art from sm up, below the art on
            phones. No scrim (measured 9.1:1 against white type). */}
        <div className="mx-auto flex max-w-7xl flex-col justify-center px-4 py-7 sm:absolute sm:inset-0 sm:px-6 sm:py-10 lg:px-8">
          <div className="max-w-[34rem]">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-antique-gold">
              {eyebrow}
            </p>
            <h2 className="mt-2.5 max-w-[26rem] font-serif text-3xl font-semibold leading-[1.1] text-soft-white sm:mt-3 sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="mt-3 max-w-[32rem] text-sm leading-relaxed text-soft-white/90 sm:text-base">
              {subcopy}
            </p>
          </div>
        </div>
      </div>

      {/* The six pieces on that table, in curated order. */}
      <div className="bg-soft-white pb-12 pt-8 sm:pb-16 sm:pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex items-baseline gap-3">
              <h3 className="font-serif text-xl text-warm-dark sm:text-2xl">
                In this look
              </h3>
              <p className="text-xs uppercase tracking-[0.14em] text-taupe">
                {products.length} pieces
              </p>
            </div>
            {link && (
              <a
                href={link.href}
                className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-burgundy transition-colors hover:text-burgundy-deep"
              >
                {link.label}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            )}
          </div>
          <AnalyticsList
            id={section.key}
            name={title}
            context={section.key}
            items={analyticsItems}
          >
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-5">
              {products.map((product) => (
                <EditProductCard key={product.id} product={product} />
              ))}
            </div>
          </AnalyticsList>
        </div>
      </div>
    </section>
  );
}
