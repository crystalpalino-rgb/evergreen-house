export function Footer() {
  return (
    <footer className="border-t border-beige/20 bg-warm-dark text-cream-dark">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a
              href="/"
              className="font-serif text-xl font-semibold tracking-tight text-cream"
            >
              Evergreen House
            </a>
            <p className="mt-3 text-sm text-beige/70">
              Timeless home collections, thoughtfully curated for every room.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-serif text-sm font-semibold text-cream">
              Shop
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Living Room", href: "/room/living-room" },
                { label: "Bedroom", href: "/room/bedroom" },
                { label: "Kitchen", href: "/room/kitchen" },
                { label: "Bathroom", href: "/room/bathroom" },
                { label: "Patio", href: "/room/patio" },
              ].map(
                (room) => (
                  <li key={room.label}>
                    <a
                      href={room.href}
                      className="text-sm text-beige/70 transition-colors hover:text-cream"
                    >
                      {room.label}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-sm font-semibold text-cream">
              Explore
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Collections", href: "/styles" },
                { label: "Blog", href: "/blog" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-beige/70 transition-colors hover:text-cream"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclosure */}
          <div>
            <h3 className="font-serif text-sm font-semibold text-cream">
              Disclosure
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-beige/60">
              As an Amazon Associate we earn from qualifying purchases. We
              carefully curate every product we recommend, our editorial
              integrity matters more than commissions.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-beige/10 pt-6 text-center text-xs text-beige/50">
          &copy; {new Date().getFullYear()} Evergreen House. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
