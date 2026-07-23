import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";
import { SITE_URL } from "~/lib/schema";

export const Route = createFileRoute("/contact")({
  head: () => {
    const seo = generateStaticMetadata(
      "Contact Evergreen House",
      "Have a question or just want to say hello? We'd love to hear from you. Reach out to the Evergreen House team.",
      "/contact"
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: Contact,
});

function Contact() {
  return (
    <>
      <Header />
      <main>
        <Breadcrumbs
          items={{ label: "Home", href: "/" }, { label: "Contact" }}
        />
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-cream-dark" />
          {/* Subtle dot texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #3d322c 1px, transparent 1px), radial-gradient(circle at 80% 70%, #3d322c 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-sans text-xs font-medium uppercase tracking-[0.25em] text-taupe sm:text-sm">
                Get in Touch
              </p>
              <h1 className="mt-6 font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">
                Contact Us
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-warm-gray sm:text-xl">
                We'd love to hear from you.
              </p>
            </div>
          </div>
        </section>

        {/* ── Contact Content ── */}
        <section className="bg-cream py-16 sm:py-24">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-12">
              <div className="space-y-8 text-center">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
                    Let's Talk
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-warm-gray">
                    Whether you have a question about a product, a suggestion for a collection, or just want to say hello, we're always happy to hear from you.
                  </p>
                  <p className="mt-3 text-lg leading-relaxed text-warm-gray">
                    Drop us a note and we'll get back to you as soon as we can.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4 pt-4">
                  <a
                    href="mailto:hello@evergreenhouse.com"
                    className="inline-flex items-center gap-3 rounded-full bg-terracotta px-8 py-4 font-medium text-white shadow-md transition-all hover:bg-terracotta-dark hover:shadow-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    Email Us
                  </a>
                  <p className="text-sm text-warm-gray/70">
                    hello@evergreenhouse.co
                  </p>
                </div>

                <div className="border-t border-beige/20 pt-8">
                  <p className="text-sm leading-relaxed text-warm-gray/60">
                    We read every message and typically respond within 1–2 business days. In the meantime, you might find what you're looking for in our{" "}
                    <a
                      href="/styles"
                      className="text-taupe underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta"
                    >
                      curated collections
                    </a>{" "}
                    or on the{" "}
                    <a
                      href="/blog"
                      className="text-taupe underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta"
                    >
                      blog
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <section className="bg-beige/15 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              Want the best finds in your inbox?
            </h2>
            <p className="mt-3 text-warm-gray">
              Join our newsletter for curated home picks, styling tips, and
              editor-approved favorites.
            </p>
            <a
              href="/#signup"
              className="mt-6 inline-block rounded-full bg-terracotta px-8 py-3.5 text-center font-medium text-white shadow-md transition-all hover:bg-terracotta-dark hover:shadow-lg"
            >
              Sign Up for Free
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
