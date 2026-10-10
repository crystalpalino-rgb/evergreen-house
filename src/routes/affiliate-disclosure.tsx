import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";

export const Route = createFileRoute("/affiliate-disclosure")({
  head: () => {
    const seo = generateStaticMetadata(
      "Affiliate Disclosure",
      "Evergreen House participates in the Amazon Services LLC Associates Program. Here is exactly how our links work, in plain language.",
      "/affiliate-disclosure",
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: AffiliateDisclosurePage,
});

function AffiliateDisclosurePage() {
  return (
    <>
      <Header />
      <main>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Affiliate Disclosure" },
          ]}
        />
        <section className="bg-cream py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
              Affiliate Disclosure
            </h1>
            <p className="mt-2 text-sm text-warm-gray">
              Last updated: October 2026
            </p>
            <p className="mt-6 text-lg leading-relaxed text-warm-gray">
              The short version: some links on this site earn us a commission,
              it never costs you more, and it never decides what we recommend.
              Here is the longer version.
            </p>

            <div className="mt-10 space-y-8 leading-relaxed text-warm-dark">
              <section>
                <h2 className="font-serif text-xl font-semibold">
                  The Amazon Associates Program
                </h2>
                <p className="mt-2">
                  Evergreen House is a participant in the Amazon Services LLC
                  Associates Program, an affiliate advertising program designed
                  to provide a means for sites to earn advertising fees by
                  advertising and linking to Amazon.com.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  What That Means for You
                </h2>
                <p className="mt-2">
                  When you click a link to Amazon from this site and buy
                  something, Amazon pays us a small commission. The price you
                  pay is the same either way. If you would rather not use our
                  links, you can always search Amazon for the product yourself.
                </p>
                <p className="mt-3">
                  This applies to the "View on Amazon" buttons on our
                  collections, room pages and product pages, and to Amazon links
                  in our journal posts. Links that leave this site for Amazon
                  are tagged so Amazon can credit the order to us.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  Prices and Availability
                </h2>
                <p className="mt-2">
                  Prices, availability, shipping, ratings and product
                  descriptions are set by Amazon and can change at any time. The
                  details shown on the retailer's page are always the accurate
                  ones, and they may differ from what we wrote when we first
                  recommended a product.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  How We Choose What to Feature
                </h2>
                <p className="mt-2">
                  Every product in an edit is there because an editor would buy
                  it again, not because of its commission. We do not accept
                  payment for a place in a collection, and we will tell you
                  plainly if that ever changes.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  Other Links
                </h2>
                <p className="mt-2">
                  We may also link to retailers or brands we do not earn from,
                  when they are simply the right answer for a room. Those links
                  are not affiliate links unless we say so next to them.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">Questions</h2>
                <p className="mt-2">
                  If anything here is unclear, email us at{" "}
                  <a
                    href="mailto:hello@evergreenhouse.co"
                    className="text-sage underline hover:text-sage-dark"
                  >
                    hello@evergreenhouse.co
                  </a>{" "}
                  and we will explain it. Our{" "}
                  <a
                    href="/terms"
                    className="text-sage underline hover:text-sage-dark"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/evergreen-house/privacy"
                    className="text-sage underline hover:text-sage-dark"
                  >
                    Privacy Policy
                  </a>{" "}
                  cover the rest.
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
