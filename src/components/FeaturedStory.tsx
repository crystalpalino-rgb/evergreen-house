export function FeaturedStory() {
  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <a
          href="/blog/7"
          className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-beige/10 transition-shadow hover:shadow-md"
        >
          <div className="grid md:grid-cols-5">
            {/* Clickable photo block */}
            <div className="md:col-span-2">
              <div
                className="h-64 w-full md:h-full md:min-h-[320px]"
                style={{
                  backgroundImage: "url(/images/kitchen.jpg)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>
            {/* Text content */}
            <div className="flex flex-col justify-center p-8 md:col-span-3 md:p-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-taupe">
                From the Journal
              </span>
              <h2 className="mt-3 font-serif text-2xl font-semibold text-warm-dark group-hover:text-terracotta transition-colors sm:text-3xl">
                How to Create a Home That Feels Like You
              </h2>
              <p className="mt-4 max-w-prose text-warm-gray leading-relaxed">
                Simple ways to create a home that feels warm, intentional, and
                uniquely yours.
              </p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-terracotta transition-colors group-hover:text-terracotta-dark">
                Read the Story
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
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}
