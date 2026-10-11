import { artSources, type EditCollection } from "~/lib/edits";

/**
 * One "Shop the Edit" card: the designer's 4:5 editorial card art, the serif
 * title and the SHOP THE EDIT link. Used by the homepage SHOP THE EDITS row and
 * by the /collections list, so both surfaces stay in step.
 *
 * Image note: the art is our own generated scene, never a product photo, so the
 * alt text names the edit rather than claiming a specific product is pictured.
 * WebP first with the jpg fallback, explicit 4:5 dimensions for zero CLS.
 */
export function EditCard({
  edit,
  eager = false,
  showCount = false,
  compact = false,
}: {
  edit: EditCollection;
  /** First card in a row can fetch eagerly (it may be in the first viewport). */
  eager?: boolean;
  showCount?: boolean;
  /** Smaller title for the secondary strips (Related edits). */
  compact?: boolean;
}) {
  const art = artSources(edit.card_image);
  return (
    <a href={`/collections/${edit.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl bg-cream-dark shadow-sm ring-1 ring-beige/10">
        <picture>
          <source srcSet={art.webp} type="image/webp" />
          <img
            src={art.jpg}
            alt={`${edit.title} - a curated edit from Evergreen House`}
            width={1200}
            height={1500}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </picture>
      </div>
      <h3
        className={
          compact
            ? "mt-2 font-serif text-[13px] font-semibold leading-snug text-warm-dark transition-colors group-hover:text-burgundy-deep sm:text-base"
            : "mt-4 font-serif text-lg font-semibold leading-snug text-warm-dark transition-colors group-hover:text-burgundy-deep sm:text-xl"
        }
      >
        {edit.title}
      </h3>
      <p
        className={`font-semibold uppercase tracking-[0.18em] text-burgundy ${
          compact ? "mt-1 text-[10px]" : "mt-1.5 text-[11px]"
        }`}
      >
        Shop the Edit
      </p>
      {showCount && (
        <p className="mt-1 text-xs text-taupe">
          {edit.items.length} editor-picked pieces
        </p>
      )}
    </a>
  );
}
