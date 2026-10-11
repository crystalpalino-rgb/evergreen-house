import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => {
    const seo = generateStaticMetadata(
      "Terms of Service",
      "How Evergreen House works: editorial recommendations, affiliate links to Amazon, product information, and the limits of what we can promise.",
      "/terms",
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: TermsPage,
});

function TermsPage() {
  return (
    <>
      <Header />
      <main>
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]}
        />
        <section className="bg-cream py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-2 text-sm text-warm-gray">
              Last updated: October 2026
            </p>
            <p className="mt-6 text-lg leading-relaxed text-warm-gray">
              Evergreen House is a small editorial site. These terms are the
              plain version of how it works and what you can expect from us.
            </p>

            <div className="mt-10 space-y-8 leading-relaxed text-warm-dark">
              <section>
                <h2 className="font-serif text-xl font-semibold">
                  1. What Evergreen House Is
                </h2>
                <p className="mt-2">
                  We publish curated recommendations for the home: collections,
                  editor notes, and journal posts. We do not sell any of the
                  products ourselves. When you choose to buy something we
                  recommend, the sale happens on Amazon or another retailer's
                  site, under that retailer's own terms, pricing and policies.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  2. Recommendations, Not Guarantees
                </h2>
                <p className="mt-2">
                  Everything we feature is our honest editorial opinion at the
                  time we write it. We are not promising that a product will
                  suit your space, arrive on time, stay in stock, or keep the
                  exact materials, color or measurements shown when we first
                  looked at it. Sellers change listings often, so please check
                  the retailer's page before you buy.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  3. Affiliate Links
                </h2>
                <p className="mt-2">
                  Some links on this site are affiliate links, which means we
                  may earn a commission when you buy through them. It never
                  costs you anything extra. The full explanation lives in our{" "}
                  <a
                    href="/affiliate-disclosure"
                    className="text-sage underline hover:text-sage-dark"
                  >
                    Affiliate Disclosure
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  4. Product Information
                </h2>
                <p className="mt-2">
                  Prices, availability, ratings and product photos belong to the
                  retailer and come from their listings. They can change at any
                  time, and we do not control them. If something here looks out
                  of date, the retailer's listing is the accurate source. You
                  are welcome to tell us so we can fix it.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  5. Our Content
                </h2>
                <p className="mt-2">
                  The curation, writing, photography, edit collections and page
                  design on this site belong to Evergreen House. You are welcome
                  to link to us and to quote a short excerpt with credit.
                  Republishing our content, images or collections elsewhere, or
                  using them commercially, needs our written permission first.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  6. Newsletter
                </h2>
                <p className="mt-2">
                  If you join our list, you can unsubscribe at any time using
                  the link in any email we send. How we handle your email
                  address is described in our{" "}
                  <a
                    href="/evergreen-house/privacy"
                    className="text-sage underline hover:text-sage-dark"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  7. Changes to These Terms
                </h2>
                <p className="mt-2">
                  If these terms change, we will update the date at the top of
                  this page. Continuing to use the site means you accept the
                  current version.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">8. Contact</h2>
                <p className="mt-2">
                  Questions about any of this? Write to us at{" "}
                  <a
                    href="mailto:hello@evergreenhouse.co"
                    className="text-sage underline hover:text-sage-dark"
                  >
                    hello@evergreenhouse.co
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
