const roomTiles = [
  {
    name: "Bedroom",
    description: "A calming retreat with soft textures and warm layers",
    href: "/room/bedroom",
    gradient: "linear-gradient(135deg, #f5f0eb 0%, #ede4d8 50%, #e8ddd0 100%)",
  },
  {
    name: "Kitchen",
    description: "Beautiful tools and timeless pieces for everyday cooking",
    href: "/room/kitchen",
    gradient: "linear-gradient(135deg, #ede4d8 0%, #e4d8c8 50%, #ddd2c0 100%)",
  },
  {
    name: "Bathroom",
    description: "Spa-worthy upgrades that turn routine into ritual",
    href: "/room/bathroom",
    gradient: "linear-gradient(135deg, #e8ddd0 0%, #e0d5c8 50%, #f0e8dc 100%)",
  },
  {
    name: "Living Room",
    description: "Gathered pieces that make a room feel like home",
    href: "/room/living-room",
    gradient: "linear-gradient(135deg, #f0e8dc 0%, #e8ddd0 50%, #f5f0eb 100%)",
  },
  {
    name: "Home Office",
    description: "Stylish, productive spaces you'll actually want to work in",
    href: "/room/office",
    gradient: "linear-gradient(135deg, #e4d8c8 0%, #ddd2c0 50%, #ede4d8 100%)",
  },
  {
    name: "Patio & Outdoor",
    description: "Inviting outdoor spaces for morning coffee to evening gatherings",
    href: "/room/patio",
    gradient: "linear-gradient(135deg, #ddd2c0 0%, #d4c5b2 50%, #e4d8c8 100%)",
  },
];

export function RoomCollections() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
          Room Collections
        </h2>
        <p className="mt-3 text-center text-warm-gray">
          Curated finds for every space, designed to grow with your home
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roomTiles.map((room) => (
            <a
              key={room.name}
              href={room.href}
              className="group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              style={{ background: room.gradient }}
            >
              {/* Subtle dot texture overlay */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 40%, #3d322c 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="relative flex h-48 flex-col items-center justify-center p-6 sm:h-52">
                <h3 className="font-serif text-xl font-semibold leading-snug text-warm-dark">
                  {room.name}
                </h3>
                <p className="mt-2 text-center text-sm leading-relaxed text-warm-gray/70">
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
