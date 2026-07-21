import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

export const Route = createFileRoute("/evergreen-house/privacy")({
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-warm-gray">Last updated: July 2026</p>

        <div className="mt-8 space-y-6 text-warm-dark leading-relaxed">
          <section>
            <h2 className="font-medium text-lg">1. Information We Collect</h2>
            <p className="mt-2">
              When you subscribe to the Evergreen House newsletter, we collect your email address.
              When you browse the site, we may collect anonymous usage data through standard
              analytics tools and the Pinterest Tag to understand how visitors engage with our content.
            </p>
          </section>

          <section>
            <h2 className="font-medium text-lg">2. How We Use Your Information</h2>
            <p className="mt-2">
              Your email is used solely to send you the Evergreen House newsletter — curated home
              finds, editorial content, and product recommendations. We do not sell, rent, or share
              your email with third parties.
            </p>
          </section>

          <section>
            <h2 className="font-medium text-lg">3. Cookies & Tracking</h2>
            <p className="mt-2">
              We use the Pinterest Tag to track page visits and conversions (such as newsletter
              signups and affiliate link clicks) for advertising and analytics purposes. We may
              also use standard browser cookies for basic site functionality.
            </p>
          </section>

          <section>
            <h2 className="font-medium text-lg">4. Amazon Affiliate Disclosure</h2>
            <p className="mt-2">
              Evergreen House is a participant in the Amazon Services LLC Associates Program, an
              affiliate advertising program designed to provide a means for sites to earn advertising
              fees by linking to Amazon.com. When you click on an Amazon link and make a purchase, we
              may earn a small commission at no additional cost to you.
            </p>
          </section>

          <section>
            <h2 className="font-medium text-lg">5. Your Rights</h2>
            <p className="mt-2">
              You can unsubscribe from our newsletter at any time using the link in any email we send.
              If you have questions about your data or would like to request deletion, contact us.
            </p>
          </section>

          <section>
            <h2 className="font-medium text-lg">6. Contact</h2>
            <p className="mt-2">
              For privacy-related inquiries, reach out at{" "}
              <a href="mailto:hello@evergreenhouse.co" className="text-sage hover:text-sage-dark underline">
                hello@evergreenhouse.co
              </a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
