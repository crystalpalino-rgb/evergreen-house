export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Editorial lifestyle background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/images/living-room.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Warm overlay for text readability */}
      <div className="absolute inset-0 bg-white/60" />

      {/* Soft vignette edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(245,240,235,0.4) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          {/* Editorial eyebrow */}
          <p className="font-sans text-xs font-medium uppercase tracking-[0.25em] text-taupe sm:text-sm">
            Evergreen House
          </p>

          {/* Hero headline */}
          <h1 className="mt-6 font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">
            Evergreen House
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-warm-gray sm:text-xl">
            Beautiful things that never go out of style.
          </p>

          {/* Trust statement */}
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-warm-dark italic">
            Every recommendation has a place in my own home.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/rooms"
              className="inline-block rounded-full bg-terracotta px-8 py-3.5 text-center font-medium text-white shadow-md transition-all hover:bg-terracotta-dark hover:shadow-lg"
            >
              Explore Collections
            </a>
            <a
              href="#signup"
              className="inline-block rounded-full border-2 border-taupe/50 px-8 py-3.5 text-center font-medium text-warm-dark transition-all hover:border-terracotta hover:text-terracotta"
            >
              Join the Journal
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
