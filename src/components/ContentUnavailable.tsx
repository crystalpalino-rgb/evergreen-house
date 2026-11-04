/**
 * The explicit "we could not reach the catalog" state.
 *
 * Room and collection pages used to render "0 products curated for..." and
 * "No products found for this room yet." when the database was unreachable or
 * DATABASE_URL was malformed, which reads as an empty shelf instead of an
 * outage. This block says what actually happened and keeps the rest of the page
 * (editorial copy, navigation) intact. No prices, ratings or counts are shown
 * while the data is missing - there is nothing honest to show.
 */
export function ContentUnavailable({
  title = "Content temporarily unavailable",
  message = "Our product library could not be reached just now. The curation is still here - please try this page again in a moment.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-2xl rounded-2xl border border-beige/40 bg-cream/60 px-6 py-10 text-center"
    >
      <p className="font-serif text-xl text-warm-dark">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-warm-gray">{message}</p>
      <a
        href="/rooms"
        className="mt-5 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
      >
        Browse every room →
      </a>
    </div>
  );
}
