import { getDeepSections, type DeepSection } from "~/lib/deep-content";

/**
 * The long-form editorial sections below the card grid, on both the edit
 * template (/collections/<slug>) and the gift-guide list template
 * (/stocking-stuffers).
 *
 * It renders in the Reset List post rhythm: the same serif H2, the same
 * text-lg body paragraph, then the section's own block, which is a checklist
 * card or the per-piece lines, in the order the copy was written. The page's
 * Amazon disclosure is untouched: this block carries no links and no second
 * disclosure, because every card above it already sits under the page's one.
 */

function Checklist({ items }: { items: string[] }) {
  return (
    <div className="mt-6 rounded-2xl border border-beige/25 bg-white p-6 shadow-sm ring-1 ring-beige/10 sm:p-8">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C9B99A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-1 shrink-0"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-base leading-relaxed text-warm-gray sm:text-lg">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PieceLines({ pieces }: { pieces: DeepSection["pieces"] }) {
  if (!pieces) return null;
  return (
    <div className="mt-6 divide-y divide-beige/20 border-t border-beige/20">
      {pieces.map((piece) => (
        <div key={piece.product} className="py-4">
          <h3 className="font-serif text-lg font-semibold text-warm-dark sm:text-xl">
            {piece.product}
          </h3>
          <p className="mt-2 text-base leading-relaxed text-warm-gray">
            {piece.suits}
          </p>
        </div>
      ))}
    </div>
  );
}

export function DeepSections({
  page,
  className = "",
}: {
  /** The page path the copy is keyed by, e.g. "/stocking-stuffers". */
  page: string;
  className?: string;
}) {
  const sections = getDeepSections(page);
  if (sections.length === 0) return null;

  return (
    <section className={`py-10 sm:py-14 ${className}`.trim()}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {sections.map((section, index) => (
          <section
            key={section.id}
            className={index === 0 ? undefined : "mt-12"}
          >
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              {section.heading}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="mt-5 text-lg leading-relaxed text-warm-gray"
              >
                {paragraph}
              </p>
            ))}
            {section.checklist && section.checklist.length > 0 && (
              <Checklist items={section.checklist} />
            )}
            <PieceLines pieces={section.pieces} />
          </section>
        ))}
      </div>
    </section>
  );
}
