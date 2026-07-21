const rooms = [
  {
    name: "Bedroom",
    href: "/room/bedroom",
    description: "Restful retreats and cozy layers",
    image: "/images/bedroom.jpg",
  },
  {
    name: "Living Room",
    href: "/room/living-room",
    description: "Gathered spaces for everyday living",
    image: "/images/living-room.jpg",
  },
  {
    name: "Kitchen",
    href: "/room/kitchen",
    description: "Beautiful tools for the heart of the home",
    image: "/images/kitchen.jpg",
  },
  {
    name: "Bathroom",
    href: "/room/bathroom",
    description: "Spa-like touches and soft textures",
    image: "/images/bathroom.jpg",
  },
  {
    name: "Home Office",
    href: "/room/office",
    description: "Thoughtful setups for focused work",
    image: "/images/home-office.jpg",
  },
  {
    name: "Outdoor",
    href: "/room/patio",
    description: "Alfresco living and garden moments",
    image: "/images/patio.jpg",
  },
];

export function BrowseByRoom() {
  return (
    <section className="bg-cream-dark py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
          Start with Your Space
        </h2>
        <p className="mt-3 text-center text-warm-gray">
          Choose the room you're decorating and explore thoughtfully curated collections.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <a
              key={room.name}
              href={room.href}
              className="group overflow-hidden rounded-2xl shadow-sm ring-1 ring-beige/10 transition-shadow hover:shadow-md"
            >
              <div
                className="relative flex h-48 flex-col justify-end p-6 sm:h-56"
                style={
                  room.image
                    ? {
                        backgroundImage: `url(${room.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : { background: room.gradient }
                }
              >
                {/* Dark overlay for photo tiles so text is readable */}
                {room.image && (
                  <div className="absolute inset-0 bg-black/40" />
                )}
                <h3 className="relative z-10 font-serif text-xl font-semibold text-white drop-shadow-sm group-hover:text-cream transition-colors">
                  {room.name}
                </h3>
                <p className="relative z-10 mt-1 text-sm text-white/80 drop-shadow-sm">
                  {room.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
