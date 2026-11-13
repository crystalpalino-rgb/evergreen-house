import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";

/* The copy on this page is the owner's final text (brief 2026-11-12, with her
   two corrections applied the same day). It is published verbatim: same
   headings, same paragraph order, same links and bullets. Do not reword. */
export const Route = createFileRoute("/privacy")({
  head: () => {
    const seo = generateStaticMetadata(
      "Privacy Policy",
      "What information Evergreen House collects, how it is used, the cookies and advertising we work with, our affiliate links, and how to reach us.",
      "/privacy",
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: PrivacyPolicyPage,
});

const linkClass = "text-sage underline hover:text-sage-dark";

function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main>
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
        />
        <section className="bg-cream py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
              PRIVACY POLICY
            </h1>
            <p className="mt-2 text-sm text-warm-gray">
              Last updated: November 12, 2026
            </p>

            <div className="mt-8 space-y-8 leading-relaxed text-warm-dark">
              <p>
                Evergreen House (evergreenhouse.co) is a home and lifestyle site
                run by Crystal Costa. This page explains what information this
                site collects, how it is used, and the choices you have.
                Questions about this policy:{" "}
                <a href="mailto:hello@evergreenhouse.co" className={linkClass}>
                  hello@evergreenhouse.co
                </a>
                .
              </p>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  INFORMATION WE COLLECT
                </h2>
                <p className="mt-3">
                  <strong className="font-semibold">
                    Information you give us.
                  </strong>{" "}
                  If you sign up for our email list, we collect your email
                  address and, if you choose to share it, your first name. If you
                  contact us by email, we keep that message so we can reply.
                </p>
                <p className="mt-3">
                  <strong className="font-semibold">
                    Information collected automatically.
                  </strong>{" "}
                  Like most websites, this site uses cookies and similar tools to
                  understand how visitors use the site, to remember preferences,
                  and to serve advertising. This includes analytics tools such as
                  Google Analytics and the Pinterest Tag, which help us
                  understand which pages and pins people visit. The site also
                  uses Google Tag Manager to manage these tags.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  COOKIES AND ADVERTISING
                </h2>
                <p className="mt-3">
                  This site plans to display advertising served by Google
                  AdSense and may work with other ad networks in the future.
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>
                    Third party vendors, including Google, use cookies to serve
                    ads based on your prior visits to this website or other
                    websites.
                  </li>
                  <li>
                    Google's use of advertising cookies enables it and its
                    partners to serve ads to you based on your visit to this site
                    and other sites on the Internet.
                  </li>
                  <li>
                    You may opt out of personalized advertising by visiting
                    Google Ads Settings:{" "}
                    <a
                      href="https://adssettings.google.com"
                      className={linkClass}
                    >
                      https://adssettings.google.com
                    </a>
                  </li>
                  <li>
                    You can also opt out of some third party vendors' use of
                    cookies for personalized advertising at{" "}
                    <a
                      href="https://www.aboutads.info/choices/"
                      className={linkClass}
                    >
                      https://www.aboutads.info/choices/
                    </a>
                  </li>
                  <li>
                    For more on how Google uses data from sites that use its
                    services:{" "}
                    <a
                      href="https://policies.google.com/technologies/partner-sites"
                      className={linkClass}
                    >
                      https://policies.google.com/technologies/partner-sites
                    </a>
                  </li>
                </ul>
                <p className="mt-3">
                  Most browsers also let you block or delete cookies in their
                  settings. If you turn cookies off, some parts of the site may
                  not work as intended, but you can still read everything we
                  publish.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  AFFILIATE LINKS DISCLOSURE
                </h2>
                <p className="mt-3">
                  Many product links on this site are affiliate links. If you
                  click one and buy something, we may earn a commission at no
                  extra cost to you. This is how the site pays for itself.
                </p>
                <p className="mt-3">
                  Evergreen House is a participant in the Amazon Services LLC
                  Associates Program, an affiliate advertising program designed
                  to provide a means for sites to earn advertising fees by
                  advertising and linking to Amazon.com. As an Amazon Associate,
                  we earn from qualifying purchases.
                </p>
                <p className="mt-3">
                  We also link to products through other affiliate programs and
                  retailer partnerships. We only feature products we would
                  genuinely recommend for the homes we write about, and a
                  commission never changes the price you pay.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  EMAIL SIGNUPS
                </h2>
                <p className="mt-3">
                  If you join our email list, we collect your email address and
                  store it so we can send you new posts, seasonal collections,
                  and occasional product finds. Our email sending is not switched
                  on yet: right now addresses are stored on the site and no
                  marketing emails are being sent. When sending starts, every
                  email will include an unsubscribe link. We do not sell or rent
                  our email list.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  HOW INFORMATION IS SHARED
                </h2>
                <p className="mt-3">
                  We do not sell your personal information. Information is shared
                  only with the service providers that make the site work
                  (hosting, analytics, advertising, and email delivery), and only
                  as needed for them to do that work. We may disclose information
                  if required by law.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  CHILDREN'S PRIVACY
                </h2>
                <p className="mt-3">
                  This site is written for adults and is not directed at children
                  under 13. We do not knowingly collect personal information from
                  children under 13.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">
                  CHANGES TO THIS POLICY
                </h2>
                <p className="mt-3">
                  If this policy changes, we will update this page and note the
                  new date at the top.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-semibold">CONTACT</h2>
                <p className="mt-3">
                  Crystal Costa, Evergreen House
                  <br />
                  <a href="mailto:hello@evergreenhouse.co" className={linkClass}>
                    hello@evergreenhouse.co
                  </a>
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
