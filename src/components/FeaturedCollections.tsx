const roomCards = [
  { name: "Living Room", slug: "living-room", emoji: "🛋️", image: "/images/living-room.jpg", alt: "Modern living room with vertical garden, neutral tones, and abundant natural light", pinDescription: "Modern living room with vertical garden, airy, green, and beautifully designed" },
  { name: "Bedroom", slug: "bedroom", emoji: "🛏️", image: "/images/bedroom.jpg", alt: "Warm, cozy bedroom with layered bedding and modern luxury", pinDescription: "Bedroom inspiration, warm, cozy, and luxuriously layered" },
  { name: "Kitchen", slug: "kitchen", emoji: "🍳", image: "/images/kitchen.jpg", alt: "Beautiful kitchen with warm tones and thoughtful design", pinDescription: "Kitchen inspiration, beautiful, warm, and functional" },
  { name: "Bathroom", slug: "bathroom", emoji: "🛁", image: "/images/bathroom.jpg", alt: "Spa-like bathroom with marble and warm light", pinDescription: "Bathroom ideas, marble, cream, and hotel-inspired calm" },
  { name: "Patio", slug: "patio", emoji: "🌿", image: "/images/patio.jpg", alt: "Beautiful outdoor patio with lush greenery and ambiance", pinDescription: "Outdoor patio inspiration, lush, green, and serene" },
  { name: "Dining Room", slug: "dining-room", emoji: "🍽️", image: "/images/dining-room.jpg", alt: "Beautiful dining room with designer lighting and warm finishes", pinDescription: "Dining room inspiration, designer lighting, warm wood, and marble" },
  { name: "Organization", slug: "storage", emoji: "📦", image: "/images/organization.jpg", alt: "Beautifully organized space with thoughtful storage", pinDescription: "Organization inspiration, functional storage with style" },
  { name: "Seasonal Finds", slug: "seasonal-finds", emoji: "🍂", image: "/images/seasonal-finds.jpg", alt: "Seasonal decor for every time of year", pinDescription: "Seasonal finds for every time of year, cozy and fresh" },
  { name: "Wall Decor", slug: "wall-decor", emoji: "🖼️", image: "/images/wall-decor.jpg", alt: "Beautiful wall decor to elevate any space", pinDescription: "Wall decor inspiration, art and mirrors to elevate your space" },
];

export function FeaturedCollections({
  roomCounts,
}: {
  roomCounts: { room: string; count: number }[];
}) {
  const countMap: Record<string, number> = {};
  roomCounts.forEach((r) => {
    countMap[r.room] = r.count;
  });

  return (
    <section id="collections" className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
          Shop by Room
        </h2>
        <p className="mt-3 text-center text-warm-gray">
          Curated collections for every space in your home
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roomCards.map((room) => (
            <a
              key={room.name}
              href={`/room/${room.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-beige/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="pin-image-wrapper aspect-[4/3] overflow-hidden">
                <img
                  src={room.image}
                  alt={room.alt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  data-pin-description={room.pinDescription}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-warm-dark/60 via-warm-dark/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="mt-2 font-serif text-xl font-semibold text-white">
                  {room.name}
                </h3>
                {countMap[room.slug] !== undefined && (
                  <p className="mt-1 text-xs text-cream/80">
                    {countMap[room.slug]} products
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
