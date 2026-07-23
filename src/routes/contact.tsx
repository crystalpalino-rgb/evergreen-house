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
          items={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        />
        {/* ── Contact ── */}
        <section className="bg-cream py-8 sm:py-12">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-10">
              <div className="space-y-6 text-center">
                <div>
                  <p className="font-sans text-xs font-medium uppercase tracking-[0.25em] text-taupe">
                    Get in Touch
                  </p>
                  <h1 className="mt-2 font-serif text-3xl font-bold text-warm-dark sm:text-4xl">
                    Contact Us
                  </h1>
                  <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-warm-gray">
                    Questions about a product? A suggestion for a collection? Just want to say hello? We'd love to hear from you.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <a
                    href="mailto:hello@evergreenhouse.co"
                    className="inline-flex items-center gap-3 rounded-full bg-terracotta px-8 py-3.5 font-medium text-white shadow-md transition-all hover:bg-terracotta-dark hover:shadow-lg"
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

                <div className="border-t border-beige/20 pt-5">
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
      </main>
      <Footer />
    </>
  );
}
