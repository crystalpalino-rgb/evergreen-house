/**
 * The free Christmas Gift List printable (owner, 2026-11-23). It lives on the
 * site, not on Beacons, and it is free and ungated: one plain link that starts
 * the download, with no email field, no signup and no popup.
 *
 * The PDF is a static file under public/downloads, so the link points straight
 * at the file and carries `download` with a plain filename.
 *
 * Both pages that carry this block use the same words, so the two agree.
 */

const PRINTABLE_HREF = "/downloads/christmas-gift-list-and-budget.pdf";
const PRINTABLE_FILENAME = "christmas-gift-list-and-budget.pdf";

export function PrintableDownload({ className = "" }: { className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-beige/30 bg-white p-6 shadow-sm ring-1 ring-beige/10 sm:p-8 ${className}`.trim()}
    >
      <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
        The Christmas Gift List, free to print
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-warm-gray sm:text-base">
        One page, your budget at the top, and a column for bought and a column
        for wrapped. Print a copy for every list you keep. No email needed.
      </p>
      <a
        href={PRINTABLE_HREF}
        download={PRINTABLE_FILENAME}
        className="mt-6 inline-block rounded-full bg-burgundy px-6 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-burgundy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
      >
        Download the printable (PDF, 1 page)
      </a>
    </section>
  );
}
