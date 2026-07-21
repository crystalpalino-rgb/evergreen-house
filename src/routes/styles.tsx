import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

const allStyles = [
  {
    name: "Organic Modern",
    slug: "modern",
    description: "Clean lines meet natural materials — warm woods, stone, linen, and shapes that feel both grounded and fresh",
    gradient: "linear-gradient(135deg, #e2d4c0 0%, #d4c1a5 50%, #c5ad8a 100%)",
    light: false,
  },
  {
    name: "Minimalist & Modern",
    slug: "minimalist",
    description: "Less but better — calm, uncluttered spaces where every piece earns its place through purpose and beauty",
    gradient: "linear-gradient(135deg, #f8f7f5 0%, #f1efec 50%, #e9e7e3 100%)",
    light: false,
  },
  {
    name: "Everyday Luxury",
    slug: "glam",
    description: "High-end looks without the high-end price — marble, brass, velvet, and pieces that feel indulgent every day",
    gradient: "linear-gradient(135deg, #3d322c 0%, #4a3d35 50%, #5c4d44 100%)",
    light: true,
  },
  {
    name: "Collected Neutrals",
    slug: "cozy",
    description: "Layered creams, beiges, taupes, and warm whites — a palette that never feels boring, always feels intentional",
    gradient: "linear-gradient(135deg, #f2ece4 0%, #e8dfd2 50%, #ded2c0 100%)",
    light: false,
  },
];

export const Route = createFileRoute("/styles")({
  head: () => ({
    meta: [
      { title: "Shop by Style, Evergreen House" },
      {
        name: "description",
        content:
          "Browse by aesthetic — Organic Modern, Minimalist & Modern, Everyday Luxury, and Collected Neutrals. Find pieces that match your style.",
      },
    ],
  }),
  component: StylesPage,
});

function StylesPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-cream-dark" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #3d322c 1px, transparent 1px), radial-gradient(circle at 80% 70%, #3d322c 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
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
              Shop by Style
            </h1>
            <p className="mt-4 text-lg text-warm-gray">
              Browse by aesthetic — find pieces that match your style
            </p>
          </div>
        </section>

        {/* Style cards grid */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {allStyles.map((style) => (
                <a
                  key={style.slug}
                  href={`/style/${style.slug}`}
                  className="group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  style={{ background: style.gradient }}
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
                        style.light ? "text-cream" : "text-warm-dark"
                      }`}
                    >
                      {style.name}
                    </h3>
                    <p
                      className={`mt-1.5 text-sm leading-relaxed ${
                        style.light ? "text-cream/80" : "text-warm-gray/70"
                      }`}
                    >
                      {style.description}
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
