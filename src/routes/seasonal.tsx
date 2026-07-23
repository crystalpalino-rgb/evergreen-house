import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";

const seasonalCollections = [
  {
    name: "Spring",
    slug: "spring",
    description: "Light layers, fresh greenery, and pieces that welcome the new season",
    gradient: "linear-gradient(135deg, #dce8d0 0%, #c8d9b2 50%, #a8c98a 100%)",
    light: false,
  },
  {
    name: "Summer",
    slug: "summer",
    description: "Breezy textures, outdoor entertaining, and sun-washed tones",
    gradient: "linear-gradient(135deg, #f5ecd7 0%, #ecd9a2 50%, #e0c370 100%)",
    light: false,
  },
  {
    name: "Fall",
    slug: "fall",
    description: "Cozy layers, warm amber tones, and textures that invite you to slow down",
    gradient: "linear-gradient(135deg, #d4b896 0%, #c49a6c 50%, #c2784a 100%)",
    light: true,
  },
  {
    name: "Holiday",
    slug: "holiday",
    description: "Plush throws, candlelight, and pieces that make home feel like a sanctuary",
    gradient: "linear-gradient(135deg, #8a8a8a 0%, #6b5e55 50%, #3d322c 100%)",
    light: true,
  },
];

export const Route = createFileRoute("/seasonal")({
  head: () => {
    const seo = generateStaticMetadata(
      "Shop by Season",
      "Curated seasonal collections throughout the year — spring refresh, summer living, autumn warmth, and winter nesting.",
      "/seasonal"
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: SeasonalPage,
});

function SeasonalPage() {
  return (
    <>
      <Header />
      <main>
        <Breadcrumbs
          items={{ label: "Home", href: "/" }, { label: "Seasons" }}
        />
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/images/seasonal-finds.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-white/60" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-taupe transition-colors hover:text-terracotta mb-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Home
            </a>
            <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">
              Shop by Season
            </h1>
            <p className="mt-4 text-lg text-warm-gray">
              Curated collections throughout the year
            </p>
          </div>
        </section>

        {/* Seasonal cards grid */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {seasonalCollections.map((season) => (
                <a
                  key={season.name}
                  href={`/collection/${season.slug}`}
                  className="group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  style={{ background: season.gradient }}
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
                  <div className="relative flex h-52 flex-col justify-end p-6 sm:h-56">
                    <h3
                      className={`font-serif text-xl font-semibold leading-snug ${
                        season.light ? "text-cream" : "text-warm-dark"
                      }`}
                    >
                      {season.name}
                    </h3>
                    <p
                      className={`mt-1.5 text-sm leading-relaxed ${
                        season.light ? "text-cream/80" : "text-warm-gray/70"
                      }`}
                    >
                      {season.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
