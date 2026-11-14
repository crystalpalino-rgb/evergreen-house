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
 * Art: Crystal's own bright hosting photograph (the regraded bright2 files),
 * webp first with a jpg fallback, both shipped sizes used. The 4:5 crop
 * (800x1000) carries the band on phones; the 16:9 hero (1600x900) takes over
 * from the sm breakpoint.
 *
 * Height: a fixed banner height, not the art's aspect ratio. The 16:9 frame at
 * 1280 wide rendered 720px tall and outranked the 680px hero, so the band is
 * capped at 420px on phones and 435px from sm up, with object-cover holding the
 * crop. Nothing distorts, and the section stays clearly under the hero.
 *
 * Type over the art: the headline sits left aligned over the photograph behind
 * the same midnight gradient the Holiday Hosting edit hero wears over this same
 * frame, because the bright left third cannot carry white type on its own. On
 * phones the copy drops below the art instead of sitting on the 4:5 crop, so the
 * gradient is desktop only and the art stays clean. No text is baked into the
 * image.
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
        <div className="relative h-[420px] w-full sm:h-[435px]">
          <picture>
            <source
              media="(max-width: 639px)"
              srcSet="/images/home-shop-the-look-card-bright2.webp"
              type="image/webp"
            />
            <source media="(max-width: 639px)" srcSet="/images/home-shop-the-look-card-bright2.jpg" />
            <source srcSet="/images/home-shop-the-look-hero-bright2.webp" type="image/webp" />
            <img
              src="/images/home-shop-the-look-hero-bright2.jpg"
              alt="A Christmas dining table set with holly banded china, a berry and evergreen centerpiece in a stoneware urn, brass taper candlesticks and plaid placemats, with a lit tree behind."
              width={1600}
              height={900}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              data-pin-description="The Holiday Hosting Table: holly banded china, brass tapers, a berry centerpiece and candlelight. Shop the look at Evergreen House."
            />
          </picture>
          {/* Scrim: Crystal's bright photograph is not the moody art the copy
              was measured against, so the left band needs the same midnight
              gradient the Holiday Hosting edit hero wears over this frame.
              Phones keep the art clean: the copy sits below it there. */}
          <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-midnight/85 via-midnight/50 to-midnight/15 sm:block" />
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
