import type { Product } from "~/lib/types";

export function Hero({ trending }: { trending: Product[] }) {
  return (
    <section className="relative overflow-hidden">
      {/* Editorial lifestyle hero image — LCP: explicit dimensions prevent CLS */}
      <img
        src="/images/living-room.jpg"
        alt="Beautiful living room with timeless decor"
        width={1200}
        height={800}
        fetchpriority="high"
        loading="eager"
        decoding="sync"
        className="absolute inset-0 h-full w-full object-cover"
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

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-3xl text-center">
          {/* Hero headline */}
          <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">
            Evergreen House
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-warm-gray sm:text-xl">
            Beautiful things that never go out of style.
          </p>

          {/* Trust statement */}
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-warm-dark italic">
            Every recommendation has a place in my own home.
          </p>

          {/* CTAs */}
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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

      {/* Product teaser strip — first 3 trending products overlaid at bottom */}
      {trending.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0">
          <div className="bg-white/70 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {trending.slice(0, 3).map((product) => (
                  <a
                    key={product.id}
                    href={product.amazon_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 rounded-lg bg-white/80 px-2 py-2 shadow-sm ring-1 ring-beige/20 transition-all hover:bg-white hover:shadow-md sm:gap-3 sm:px-3"
                  >
                    {/* Thumbnail */}
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-cream sm:h-14 sm:w-14">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.image_alt || product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-serif text-lg text-beige/50 italic">
                            {product.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-warm-dark group-hover:text-terracotta sm:text-sm">
                        {product.name}
                      </p>
                      {product.price && (
                        <p className="text-xs font-semibold text-terracotta">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(product.price)}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
