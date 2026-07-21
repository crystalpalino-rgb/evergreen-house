const collections = [
  {
    name: "Shop by Room",
    description: "Browse curated collections for every space in your home",
    href: "/rooms",
    gradient: "linear-gradient(135deg, #f5f0eb 0%, #e6dcd0 50%, #d4c5b2 100%)",
    light: false,
  },
  {
    name: "Shop by Style",
    description: "Browse by aesthetic — Organic Modern, Minimalist, Everyday Luxury, Collected Neutrals",
    href: "/styles",
    gradient: "linear-gradient(135deg, #c9cbb5 0%, #a8b89a 50%, #8a9a83 100%)",
    light: true,
  },
  {
    name: "Shop by Season",
    description: "Curated collections throughout the year",
    href: "/seasonal",
    gradient: "linear-gradient(135deg, #ddc4a0 0%, #c9a374 50%, #c2784a 100%)",
    light: true,
  },
  {
    name: "Shop by Lifestyle",
    description: "Solutions for real life — Small Space Living, Organization, Reading Nooks, Hosting, Family, WFH",
    href: "/lifestyle",
    gradient: "linear-gradient(135deg, #d4c1a5 0%, #c9b99a 50%, #a89b8c 100%)",
    light: true,
  },
];

export function ShopByStyle() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
          Shop by Collection
        </h2>
        <p className="mt-3 text-center text-warm-gray">
          Thoughtfully curated finds for every room, season, and style.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {collections.map((collection) => (
            <a
              key={collection.name}
              href={collection.href}
              className="group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              style={{ background: collection.gradient }}
            >
              {/* Subtle texture overlay */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 40%, #ffffff 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              />

              <div className="relative flex h-48 flex-col justify-end p-6 sm:h-52">
                <h3
                  className={`font-serif text-xl font-semibold leading-snug ${
                    collection.light ? "text-cream" : "text-warm-dark"
                  }`}
                >
                  {collection.name}
                </h3>
                <p
                  className={`mt-1.5 text-sm leading-relaxed ${
                    collection.light ? "text-cream/80" : "text-warm-gray/70"
                  }`}
                >
                  {collection.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
