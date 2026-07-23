import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";

const roomCards = [
  {
    name: "Living Room",
    slug: "living-room",
    description: "The heart of the home — comfortable seating, warm lighting, and pieces that invite conversation",
    image: "/images/living-room.jpg",
  },
  {
    name: "Bedroom",
    slug: "bedroom",
    description: "A restful retreat with layered bedding, soft textures, and calming neutrals",
    image: "/images/bedroom.jpg",
  },
  {
    name: "Kitchen",
    slug: "kitchen",
    description: "Beautiful and functional — tools, serveware, and decor that earn their place",
    image: "/images/kitchen.jpg",
  },
  {
    name: "Bathroom",
    slug: "bathroom",
    description: "Spa-like touches, plush towels, and storage that feels intentional",
    image: "/images/bathroom.jpg",
  },
  {
    name: "Patio & Outdoor",
    slug: "patio",
    description: "Create an outdoor sanctuary with weather-worthy pieces that bring the indoors out",
    image: "/images/patio.jpg",
  },
  {
    name: "Dining Room",
    slug: "dining-room",
    description: "Tablescapes, lighting, and serveware for everyday meals and special gatherings",
    image: "/images/dining-room.jpg",
  },
];

export const Route = createFileRoute("/rooms")({
  head: () => {
    const seo = generateStaticMetadata(
      "Shop by Room",
      "Browse curated home collections for every space in your home — living room, bedroom, kitchen, bathroom, and more.",
      "/rooms"
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: RoomsPage,
});

function RoomsPage() {
  return (
    <>
      <Header />
      <main>
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Rooms" },
          ]}
        />

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/images/living-room.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-white/50" />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
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
              Shop by Room
            </h1>
            <p className="mt-4 text-lg text-warm-gray">
              Curated collections for every space in your home
            </p>
          </div>
        </section>

        {/* Room cards grid */}
        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roomCards.map((room) => (
                <a
                  key={room.slug}
                  href={`/room/${room.slug}`}
                  className="group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${room.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative flex h-52 flex-col justify-end p-6 sm:h-56">
                    <h3 className="font-serif text-xl font-semibold leading-snug text-white drop-shadow-sm">
                      {room.name}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/80 drop-shadow-sm">
                      {room.description}
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
