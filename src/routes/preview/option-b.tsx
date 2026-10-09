import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

/**
 * TEMPORARY DESIGN PREVIEW ROUTE - not linked from anywhere, noindex, safe to delete.
 * Option B: asymmetric editorial header/hero + refined card direction.
 * Self contained on purpose: it renders its own header, hero and cards inline so that
 * the shared Header/Hero/ProductCard components stay untouched while the owner compares.
 */

type PreviewProduct = {
  id: number;
  name: string;
  price: string;
  editor_note: string;
  image_url: string;
  amazon_url: string;
};

// Pulled from the products table (all active, short names, short opening sentence).
const PRODUCTS: PreviewProduct[] = [
  {
    id: 461,
    name: "Breville Bambino Espresso Machine",
    price: "$299.95",
    editor_note:
      "A Breville espresso machine belongs on the counter when mornings matter and space is tight.",
    image_url: "https://m.media-amazon.com/images/I/61egYXcL9OL._AC_SL1500_.jpg",
    amazon_url: "https://www.amazon.com/dp/B0B1JPPG2L?tag=crystalcost09-20",
  },
  {
    id: 474,
    name: "Brooklinen Turkish Cotton Bath Robe",
    price: "$149.00",
    editor_note:
      "A Turkish cotton robe that dries quickly and softens with every wash, the quiet luxury of a slow morning.",
    image_url: "https://m.media-amazon.com/images/I/71E1qyMqfpL._AC_SL1500_.jpg",
    amazon_url: "https://www.amazon.com/dp/B0GPHM69G4?tag=crystalcost09-20",
  },
  {
    id: 481,
    name: "NEST New York Holiday Reed Diffuser",
    price: "$75.00",
    editor_note:
      "A pomegranate and pine diffuser that scents an entry or a bath for months without a flame.",
    image_url: "https://m.media-amazon.com/images/I/81Np6Tf-BnL._AC_SL1500_.jpg",
    amazon_url: "https://www.amazon.com/dp/B0GZJ9MXCP?tag=crystalcost09-20",
  },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

const SHOP_LINKS = [
  { label: "Living Room", href: "/room/living-room" },
  { label: "Bedroom", href: "/room/bedroom" },
  { label: "Kitchen", href: "/room/kitchen" },
  { label: "Bathroom", href: "/room/bathroom" },
  { label: "All collections", href: "/rooms" },
];

// Compact header, shared shape with Option A (both previews use the same header).
function PreviewHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-beige/15 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-[62px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="font-serif text-[22px] font-medium tracking-tight text-warm-dark sm:text-[25px]"
        >
          Evergreen House
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          <a
            href="/"
            className="text-sm text-warm-gray transition-colors hover:text-terracotta"
          >
            Home
          </a>
          <div className="group relative">
            <a
              href="/rooms"
              className="flex items-center gap-1 text-sm text-warm-gray transition-colors hover:text-terracotta"
            >
              Shop
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-200 group-hover:rotate-180"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </a>
            <div className="invisible absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 pt-3 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
              <div className="rounded-xl border border-beige/15 bg-white p-2">
                {SHOP_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-sm text-warm-gray transition-colors hover:bg-cream-dark hover:text-terracotta"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <a
            href="/about"
            className="text-sm text-warm-gray transition-colors hover:text-terracotta"
          >
            About
          </a>
          <a
            href="/blog"
            className="text-sm text-warm-gray transition-colors hover:text-terracotta"
          >
            Journal
          </a>
        </nav>

        <div className="flex items-center gap-1">
          <a
            href="/search"
            aria-label="Search"
            className="rounded-full p-2 text-warm-gray transition-colors hover:text-terracotta"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </a>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-full p-2 text-warm-gray transition-colors hover:text-terracotta md:hidden"
          >
            {mobileOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-beige/15 bg-cream md:hidden">
          <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <a
              href="/"
              className="block py-2 text-sm text-warm-gray hover:text-terracotta"
            >
              Home
            </a>
            <a
              href="/rooms"
              className="block py-2 text-sm text-warm-gray hover:text-terracotta"
            >
              Shop
            </a>
            <a
              href="/about"
              className="block py-2 text-sm text-warm-gray hover:text-terracotta"
            >
              About
            </a>
            <a
              href="/blog"
              className="block py-2 text-sm text-warm-gray hover:text-terracotta"
            >
              Journal
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

// Refined card direction: rounded-xl, hairline border, no shadow, contained product shot,
// reason stated plainly (no quotation marks, no italic), terracotta price, quiet text link.
function PreviewCard({ product }: { product: PreviewProduct }) {
  const slug = slugify(product.name);
  return (
    <div className="group rounded-xl border border-beige/15 bg-white">
      <div className="aspect-square overflow-hidden rounded-t-xl">
        <a
          href={product.amazon_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full w-full"
        >
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </a>
      </div>
      <div className="px-4 pb-4 pt-1">
        <h3 className="font-sans text-sm font-medium text-warm-dark line-clamp-2">
          <a href={`/product/${slug}`} className="transition-colors hover:text-terracotta">
            {product.name}
          </a>
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-taupe line-clamp-2">
          {product.editor_note}
        </p>
        <p className="mt-1.5 text-sm font-semibold text-terracotta">{product.price}</p>
        <a
          href={product.amazon_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-sage transition-colors hover:text-sage-dark"
        >
          View on Amazon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="11"
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
        </a>
      </div>
    </div>
  );
}

function OptionB() {
  return (
    <>
      <div className="bg-warm-dark text-cream">
        <p className="mx-auto max-w-7xl px-4 py-2 text-center text-[11px] tracking-wide sm:px-6">
          Design preview, Option B: asymmetric editorial. For review only, not applied to the live site.
        </p>
      </div>

      <PreviewHeader />

      <main>
        {/* HERO: asymmetric editorial. No overall veil at all - a left to centre cream scrim
            keeps the headline legible while the right two thirds of the photo stay rich. */}
        <section className="relative isolate overflow-hidden">
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
          {/* Mobile (below sm): the supporting line runs nearly the full width, and its last word
              lands on a dark patch of the photo (a shadowed plant), so the scrim is held high all
              the way across - from-cream/96, via-cream/90 at 60%, to-cream/85 - instead of fading
              out at the right. From sm up the brief's exact stops take over and the photo goes back
              to staying rich on the right: from-cream/85, via-cream/40 at 50%, to-transparent. */}
          <div className="absolute inset-0 bg-gradient-to-r from-cream/96 via-cream/90 via-60% to-cream/85 sm:from-cream/85 sm:via-cream/40 sm:via-50% sm:to-transparent" />

          <div className="relative mx-auto flex min-h-[520px] max-w-7xl flex-col justify-center px-5 py-14 sm:min-h-[560px] sm:px-6 sm:py-16 lg:min-h-[640px] lg:px-8">
            <div className="max-w-2xl">
              <h1 className="font-serif text-4xl font-medium leading-tight tracking-tight text-warm-dark lg:text-5xl xl:text-6xl">
                A home worth coming home to.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-warm-gray sm:text-lg">
                Thoughtfully chosen home finds for rooms that feel like you.
              </p>
              <a
                href="/rooms"
                className="mt-7 inline-block rounded-xl bg-terracotta px-7 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-terracotta-dark"
              >
                Shop the Collections
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-taupe">
                Shop the look
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-warm-dark sm:text-3xl">
                Curated finds for every room
              </h2>
            </div>
            <a
              href="/rooms"
              className="hidden shrink-0 text-sm text-warm-gray transition-colors hover:text-terracotta sm:inline"
            >
              View all
            </a>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product) => (
              <PreviewCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-beige/15 bg-cream-dark/60">
        <div className="mx-auto max-w-7xl px-5 py-8 text-center text-xs text-taupe sm:px-6 lg:px-8">
          Design preview only. Option B keeps the photography rich and the composition off centre.
        </div>
      </footer>
    </>
  );
}

export const Route = createFileRoute("/preview/option-b")({
  head: () => ({
    meta: [
      { title: "Design preview: Option B, asymmetric editorial | Evergreen House" },
      {
        name: "description",
        content:
          "Internal design preview of the asymmetric editorial homepage direction. Not a live page.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OptionB,
});
