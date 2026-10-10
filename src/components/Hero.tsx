/* Homepage hero with three owner-reviewable art directions.
   The concept is switched with the ?hero=a|b|c query param (default a), so all
   three can be compared on the same preview URL, desktop and mobile.

   Art direction and text placement per concept come from the designer's brief in
   /home/team/shared/design/hero-concepts/README.md:
     A Heritage Holiday   cream text over a light dark scrim, left third upper 2/3
                          desktop, top third mobile (above the armchair).
     B Modern Editorial   white and antique gold text, NO scrim so the diagonal
                          shaft of light stays visible, left third upper half
                          desktop, upper third mobile.
     C Timeless Lifestyle dark warm charcoal text over a very light scrim, left
                          third upper 2/3 desktop, upper wall mobile. */

type HeroTone = "light" | "dark";
type HeroScrim = "light" | "none";

interface HeroConcept {
  id: "a" | "b" | "c";
  /* Immutable one year image cache: these filenames are new, nothing here
     overwrites the previous holiday-edit-hero-2026 art. */
  desktopWebp: string;
  desktopJpg: string;
  mobileWebp: string;
  mobileJpg: string;
  tone: HeroTone;
  scrim: HeroScrim;
  alt: string;
}

const HERO_CONCEPTS: Record<string, HeroConcept> = {
  a: {
    id: "a",
    desktopWebp: "/images/hero-a-heritage-desktop.webp",
    desktopJpg: "/images/hero-a-heritage-desktop.jpg",
    mobileWebp: "/images/hero-a-heritage-mobile.webp",
    mobileJpg: "/images/hero-a-heritage-mobile.jpg",
    tone: "light",
    scrim: "light",
    alt: "Heirloom holiday drawing room with an oxblood velvet sofa, tartan throw, brass candlesticks and a lit stone fireplace under an evergreen garland",
  },
  b: {
    id: "b",
    desktopWebp: "/images/hero-b-modern-desktop.webp",
    desktopJpg: "/images/hero-b-modern-desktop.jpg",
    mobileWebp: "/images/hero-b-modern-mobile.webp",
    mobileJpg: "/images/hero-b-modern-mobile.jpg",
    tone: "light",
    scrim: "none",
    alt: "Modern editorial room with a sculptural oxblood velvet chair, dark green marble plinth, olive tree and a diagonal shaft of golden light across charcoal walls",
  },
  c: {
    id: "c",
    desktopWebp: "/images/hero-c-timeless-desktop.webp",
    desktopJpg: "/images/hero-c-timeless-desktop.jpg",
    mobileWebp: "/images/hero-c-timeless-mobile.webp",
    mobileJpg: "/images/hero-c-timeless-mobile.jpg",
    tone: "dark",
    scrim: "light",
    alt: "Sun-washed timeless living room with a washed linen sofa, travertine console, dried grasses in a ceramic vase and a stone archway into softly lit rooms",
  },
};

export const DEFAULT_HERO_CONCEPT = "a";

export function Hero({ concept = DEFAULT_HERO_CONCEPT }: { concept?: string }) {
  const art = HERO_CONCEPTS[concept] ?? HERO_CONCEPTS[DEFAULT_HERO_CONCEPT];
  const light = art.tone === "light";
  const scrim = art.scrim === "light";

  /* Scrims are tinted opposite to the text tone: a soft midnight wash under the
     cream and gold type over lit artwork, a soft white wash under the charcoal
     type over sunlit artwork. Concept B renders none so the light shaft reads.
     Class names are written out in full because Tailwind only generates the
     utilities it can find as literal text. */
  const scrimTopClass = light
    ? "absolute inset-0 bg-gradient-to-b from-midnight/75 via-midnight/35 to-transparent sm:hidden"
    : "absolute inset-0 bg-gradient-to-b from-soft-white/60 via-soft-white/30 to-transparent sm:hidden";
  const scrimSideClass = light
    ? "absolute inset-0 hidden bg-gradient-to-r from-midnight/65 via-midnight/20 to-transparent sm:block"
    : "absolute inset-0 hidden bg-gradient-to-r from-soft-white/45 via-soft-white/15 to-transparent sm:block";

  const eyebrowClass = light ? "text-antique-gold" : "text-burgundy";
  const headlineClass = light ? "text-soft-white" : "text-midnight";
  const subClass = light ? "text-soft-white/85" : "text-midnight/80";

  return (
    <section className="relative isolate overflow-hidden bg-soft-white">
      {/* Editorial lifestyle hero image - LCP: explicit dimensions prevent CLS.
          The 4:5 mobile crop is served below 768px, webp first with the jpg
          fallback. */}
      <picture>
        <source
          media="(max-width: 767px)"
          srcSet={art.mobileWebp}
          type="image/webp"
        />
        <source
          media="(max-width: 767px)"
          srcSet={art.mobileJpg}
          type="image/jpeg"
        />
        <source srcSet={art.desktopWebp} type="image/webp" />
        <img
          src={art.desktopJpg}
          alt={art.alt}
          width={1600}
          height={1100}
          fetchpriority="high"
          loading="eager"
          decoding="sync"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>

      {/* Readability scrim, anchored to the headline block: top weighted on small
          screens where the text sits in the top third, left weighted from sm up
          so the artwork keeps its depth on the right. */}
      {scrim && (
        <>
          <div className={scrimTopClass} />
          <div className={scrimSideClass} />
        </>
      )}

      <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-start px-4 pb-12 pt-14 sm:min-h-[600px] sm:px-6 sm:pt-16 lg:min-h-[680px] lg:px-8 lg:pt-24">
        {/* The headline block lives in the left third and stays top anchored:
            the upper two thirds are the calm zone of all three crops. */}
        <div className="w-full max-w-[24rem] sm:max-w-[25rem] lg:max-w-[28rem]">
          <p className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-antique-gold" />
            <span
              className={`text-[0.7rem] font-semibold uppercase tracking-[0.28em] sm:text-xs ${eyebrowClass}`}
            >
              THE HOLIDAY EDIT {"\u00B7"} 2026
            </span>
          </p>

          <h1
            className={`mt-4 font-serif text-[2.1rem] font-semibold leading-[1.08] sm:mt-5 sm:text-5xl lg:text-[3.4rem] ${headlineClass}`}
          >
            A Season, Beautifully Collected.
          </h1>

          <p
            className={`mt-4 text-base leading-relaxed sm:mt-5 sm:text-lg ${subClass}`}
          >
            Timeless finds for a home worth coming back to.
          </p>

          <div className="mt-7">
            <a
              href="/collection/holiday"
              className="inline-block w-full rounded-full bg-burgundy px-8 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.12em] text-soft-white shadow-sm transition-colors hover:bg-burgundy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-antique-gold focus-visible:ring-offset-2 focus-visible:ring-offset-midnight sm:w-auto"
            >
              SHOP THE HOLIDAY EDIT
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
