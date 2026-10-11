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
    <section className="bg-cream-dark py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
          Explore by Room
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
          {rooms.map((room) => (
            <a
              key={room.name}
              href={room.href}
              className="group overflow-hidden rounded-xl shadow-sm ring-1 ring-beige/10 transition-shadow hover:shadow-md"
            >
              <div
                className="relative flex h-32 flex-col justify-end p-4 sm:h-40"
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
                {room.image && <div className="absolute inset-0 bg-black/40" />}
                <h3 className="relative z-10 font-serif text-base font-semibold text-white drop-shadow-sm transition-colors group-hover:text-cream sm:text-lg">
                  {room.name}
                </h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
