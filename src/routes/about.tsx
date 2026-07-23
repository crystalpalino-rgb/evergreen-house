import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";
import { SITE_URL } from "~/lib/schema";

export const Route = createFileRoute("/about")({
  head: () => {
    const seo = generateStaticMetadata(
      "About Evergreen House",
      "After more than 15 years in ecommerce and merchandising, I created Evergreen House to share timeless home products that truly deserve a place in your home.",
      "/about"
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: About,
});

function About() {
  return (
    <>
      <Header />
      <main>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "About" },
          ]}
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
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-sans text-xs font-medium uppercase tracking-[0.25em] text-taupe sm:text-sm">
                Our Story
              </p>
              <h1 className="mt-6 font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">
                About Evergreen House
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-warm-gray sm:text-xl">
                We believe every home should feel like you.
              </p>
            </div>
          </div>
        </section>

        {/* ── Founder Story ── */}
        <section className="bg-cream py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-5">
              {/* Founder photo  left column on desktop */}
              <div className="flex justify-center lg:col-span-2 lg:justify-end">
                <div className="relative">
                  <div className="h-56 w-56 overflow-hidden rounded-full ring-2 ring-beige/30 sm:h-72 sm:w-72 lg:h-80 lg:w-80">
                    <img
                      src="/about-pic.jpg"
                      alt="Founder of Evergreen House"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Story text  right column on desktop */}
              <div className="lg:col-span-3">
                <div className="prose-custom space-y-6 text-warm-dark">
                  <p className="text-lg leading-relaxed text-warm-gray">
                    I've spent more than a decade helping millions of people discover products they'll love. Throughout my career in ecommerce and merchandising, I've worked behind the scenes with some of the world's largest online retailers, building collections, launching brands, and learning what turns a product into something people genuinely recommend.
                  </p>

                  <p className="text-lg leading-relaxed text-warm-gray">
                    Along the way, I realized something.
                  </p>

                  <p className="text-lg leading-relaxed text-warm-gray">
                    The hardest part isn't finding home decor. It's knowing what's actually worth buying.
                  </p>

                  <p className="text-lg leading-relaxed text-warm-gray">
                    We've all been there. You search for something simple, like a table lamp or a set of towels, and suddenly you're staring at hundreds of nearly identical options, thousands of reviews, and no real way to know which one is actually worth your money.
                  </p>

                  <p className="text-lg leading-relaxed text-warm-gray">
                    I created Evergreen House to solve that problem.
                  </p>

                  <p className="text-lg leading-relaxed text-warm-gray">
                    This is where I share the products I'd recommend to my own friends and family. Every collection is thoughtfully curated with an editor's eye, focusing on quality, value, and timeless style instead of whatever happens to be trending that week.
                  </p>

                  <p className="text-lg leading-relaxed text-warm-gray">
                    I believe your home should tell your story. It doesn't have to be expensive. It doesn't have to be perfect. It just needs to feel like the place you can't wait to come home to.
                  </p>

                  <p className="text-lg leading-relaxed text-warm-gray">
                    So I do the research. I compare the options. I read the reviews. I narrow hundreds of choices down to the few I'd confidently buy myself.
                  </p>

                  <p className="text-lg leading-relaxed text-warm-gray">
                    I hope this becomes your trusted place for beautiful finds, practical ideas, and inspiration that helps you create a home you truly love.
                  </p>

                  <p className="text-lg leading-relaxed text-warm-gray">
                    Welcome. I'm so glad you're here.
                  </p>

                  <p className="mt-6 font-serif text-lg italic text-taupe">
                    Crystal
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="bg-cream-dark py-8 sm:py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
              What We Stand For
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {/* Value 1 */}
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/15">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8a9a83"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-warm-dark">
                  Honest recommendations, always.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  Every product we feature is something we'd buy ourselves. No
                  exceptions.
                </p>
              </div>

              {/* Value 2 */}
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta/15">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#c2784a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-warm-dark">
                  Design is for everyone.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  You don't need a designer budget to create a home you love.
                </p>
              </div>

              {/* Value 3 */}
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-beige/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#c9b99a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-warm-dark">
                  Quality over quantity.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  We'd rather recommend five great finds than fifty mediocre ones.
                </p>
              </div>

              {/* Value 4 */}
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-dark/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3d322c"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-warm-dark">
                  Your home, your story.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  We provide the inspiration; you make it yours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <section className="bg-beige/15 py-8 sm:py-12">
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
