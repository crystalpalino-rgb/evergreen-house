export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-cream-dark">
      {/* Editorial lifestyle hero image - LCP: explicit dimensions prevent CLS.
          WebP is served where supported; the JPEG is the fallback. */}
      <picture>
        <source
          srcSet="/images/holiday-edit-hero-2026.webp"
          type="image/webp"
        />
        <img
          src="/images/holiday-edit-hero-2026.jpg"
          alt="Warm living room styled for the holidays with burgundy velvet cushions, a tartan throw, evergreen wreath and brass candlesticks"
          width={1600}
          height={1100}
          fetchpriority="high"
          loading="eager"
          decoding="sync"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>

      {/* Readability scrim. Full strength on small screens, where the crop can put
          the sofa behind the text; left weighted from sm up so the artwork keeps
          its depth on the right and the headline sits on clean plaster. */}
      <div className="absolute inset-0 bg-white/70 sm:hidden" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-white/85 via-white/45 to-transparent sm:block" />

      <div className="relative mx-auto flex min-h-[540px] max-w-7xl flex-col justify-end px-4 pb-10 pt-16 sm:min-h-[580px] sm:justify-start sm:px-6 sm:pb-14 sm:pt-14 lg:min-h-[640px] lg:px-8 lg:pt-20">
        {/* Left third of the artwork is the clean zone; the block stays there from
            sm up and centers, over a stronger scrim, on small screens. */}
        <div className="mx-auto w-full max-w-xl text-center sm:mx-0 sm:max-w-[26rem] sm:text-left lg:max-w-[30rem]">
          <p className="flex items-center justify-center gap-3 sm:justify-start">
            <span aria-hidden="true" className="h-px w-8 bg-antique-gold" />
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-burgundy sm:text-xs">
              THE HOLIDAY EDIT 2026
            </span>
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] text-midnight sm:mt-5 sm:text-5xl lg:text-[3.4rem]">
            A Season, Beautifully Collected
          </h1>

          <p className="mt-4 text-base leading-relaxed text-midnight/75 sm:mt-5 sm:text-lg">
            Timeless holiday finds our editors love, gathered in one place.
          </p>

          <div className="mt-7 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <a
              href="/collection/holiday"
              className="inline-block w-full rounded-full bg-burgundy px-8 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.12em] text-soft-white shadow-sm transition-colors hover:bg-burgundy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-antique-gold focus-visible:ring-offset-2 focus-visible:ring-offset-soft-white sm:w-auto"
            >
              SHOP THE HOLIDAY EDIT
            </a>
            <a
              href="#signup"
              className="text-sm font-medium text-midnight underline decoration-antique-gold decoration-2 underline-offset-4 transition-colors hover:text-burgundy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-antique-gold focus-visible:ring-offset-2 focus-visible:ring-offset-soft-white"
            >
              Join the list
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
