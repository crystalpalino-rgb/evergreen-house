export function Footer() {
  return (
    <footer className="border-t border-soft-white/10 bg-midnight text-soft-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a
              href="/"
              className="font-serif text-xl font-semibold tracking-tight text-soft-white"
            >
              Evergreen House
            </a>
            <p className="mt-3 text-sm text-soft-white/70">
              Timeless home collections, thoughtfully curated for every room.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-serif text-sm font-semibold text-soft-white">
              Shop
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Living Room", href: "/room/living-room" },
                { label: "Bedroom", href: "/room/bedroom" },
                { label: "Kitchen", href: "/room/kitchen" },
                { label: "Bathroom", href: "/room/bathroom" },
                { label: "Outdoor", href: "/room/patio" },
                { label: "Apparel", href: "/apparel" },
                { label: "All Rooms", href: "/rooms" },
              ].map((room) => (
                <li key={room.label}>
                  <a
                    href={room.href}
                    className="text-sm text-soft-white/70 transition-colors hover:text-antique-gold"
                  >
                    {room.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Journal, About, Contact and the policy page live here now that the
              top level nav is down to three shop destinations. */}
          <div>
            <h3 className="font-serif text-sm font-semibold text-soft-white">
              Explore
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Collections", href: "/collections" },
                { label: "Journal", href: "/blog" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "Privacy", href: "/evergreen-house/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-soft-white/70 transition-colors hover:text-antique-gold"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclosure */}
          <div>
            <h3 className="font-serif text-sm font-semibold text-soft-white">
              Disclosure
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-soft-white/60">
              As an Amazon Associate we earn from qualifying purchases. We
              carefully curate every product we recommend, our editorial
              integrity matters more than commissions.{" "}
              <a
                href="/affiliate-disclosure"
                className="underline decoration-soft-white/30 underline-offset-2 transition-colors hover:text-antique-gold"
              >
                How our links work
              </a>
            </p>
          </div>
        </div>

        {/* Social */}
        <div className="mt-10 border-t border-soft-white/10 pt-6 flex items-center justify-center gap-5">
          <a
            href="https://www.pinterest.com/evergreenhouseco/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-soft-white/60 transition-colors hover:text-antique-gold"
            aria-label="Follow us on Pinterest"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
            </svg>
          </a>
        </div>

        {/* Bottom */}
        <div className="mt-6 text-center text-xs text-soft-white/50">
          &copy; {new Date().getFullYear()} Evergreen House. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
