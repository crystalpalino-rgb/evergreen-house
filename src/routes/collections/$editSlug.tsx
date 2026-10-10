import {
  createFileRoute,
  notFound,
  isNotFound,
} from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { AnalyticsList } from "~/components/AnalyticsList";
import { EditProductCard } from "~/components/EditProductCard";
import { EditCard } from "~/components/EditCard";
import {
  artSources,
  getEdit,
  getEditProducts,
  getRelatedEdits,
  type EditCollection,
  type EditProduct,
} from "~/lib/edits";
import { generateStaticMetadata, SITE_URL } from "~/lib/seo";
import { getCollectionPageSchema } from "~/lib/schema";

/**
 * "Shop the Edit" landing page: /collections/<edit-slug>.
 *
 * Editorial copy and the product order come from the checked-in curation
 * manifest (src/data/edits/manifest.json); the live product facts come from the
 * products table by id. Only the four published edits have a page: an unknown or
 * unpublished slug (the retired winter-capsule-wardrobe for instance) throws
 * notFound, so it is a real 404 rather than an empty shell.
 *
 * Mobile first, per the owner brief: the header is a compact art band with the
 * eyebrow, serif title, the two-sentence intro and the affiliate disclosure over
 * the CALM LEFT THIRD of the hero, so the first product row lands inside the
 * first viewport on a phone.
 */

type EditLoaderData = {
  edit: EditCollection;
  products: EditProduct[];
  related: EditCollection[];
};

/** Meta description: edit title plus the one-line headline, capped at 158. */
function metaDescription(edit: EditCollection): string {
  const base = `${edit.title}: ${edit.headline}.`;
  if (base.length <= 158) return base;
  const cut = base.slice(0, 155);
  return `${cut.slice(0, cut.lastIndexOf(" "))}...`;
}

export const Route = createFileRoute("/collections/$editSlug")({
  loader: async ({ params }): Promise<EditLoaderData> => {
    const edit = getEdit(params.editSlug);
    if (!edit) throw notFound();
    try {
      const products = await getEditProducts(edit);
      return { edit, products, related: getRelatedEdits(edit.slug) };
    } catch (err) {
      if (isNotFound(err)) throw err;
      console.error("Edit loader error:", err);
      return { edit, products: [], related: getRelatedEdits(edit.slug) };
    }
  },
  head: ({ loaderData }) => {
    const edit = loaderData?.edit;
    if (!edit) return {};
    const seo = generateStaticMetadata(
      `${edit.title} - Curated Finds`,
      metaDescription(edit),
      `/collections/${edit.slug}`,
    );
    /* The edit's own hero art is a better social card than the site default,
       so the og/twitter image entries are pointed at it (1600x900). */
    const hero = artSources(edit.hero_image);
    const ogImage = `${SITE_URL}${hero.jpg}`;
    const meta = seo.meta.map((tag) => {
      const t = tag as Record<string, string>;
      if (t.property === "og:image" || t.name === "twitter:image") {
        return { ...t, content: ogImage };
      }
      if (t.property === "og:image:width") return { ...t, content: "1600" };
      if (t.property === "og:image:height") return { ...t, content: "900" };
      return t;
    });
    /* LCP: the hero art is the first paint element, so it is preloaded. */
    const links = [
      ...seo.links,
      { rel: "preload", as: "image", href: hero.webp, type: "image/webp" },
    ];
    return { meta, links };
  },
  component: EditPage,
});

function EditPage() {
  const { edit, products, related } = Route.useLoaderData();
  const hero = artSources(edit.hero_image);
  const url = `${SITE_URL}/collections/${edit.slug}`;

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      getCollectionPageSchema(
        {
          name: edit.title,
          display_name: edit.title,
          description: edit.intro,
        },
        url,
      ),
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: edit.title,
        numberOfItems: products.length,
        itemListElement: products.map((product, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: product.title,
          url: `${SITE_URL}/product/${product.slug}`,
        })),
      },
    ],
  });

  /* GA4 view_item_list payload: id plus the display title the card shows. */
  const analyticsItems = products.map((p) => ({ id: p.id, name: p.title }));

  return (
    <>
      <Header />
      <main>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Collections", href: "/collections" },
            { label: edit.title },
          ]}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schema }}
        />
        {/* Compact editorial header. Mobile gets a 16:9 band; the desktop band is
            taller, and the copy stays in the quiet left third of the art. */}
        <section className="relative isolate overflow-hidden bg-midnight">
          <picture>
            <source srcSet={hero.webp} type="image/webp" />
            <img
              src={hero.jpg}
              alt={`${edit.title} - a curated edit from Evergreen House`}
              width={1600}
              height={900}
              fetchpriority="high"
              loading="eager"
              decoding="sync"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-midnight/85 via-midnight/50 to-midnight/15" />
          <div className="relative mx-auto flex min-h-[264px] max-w-7xl flex-col justify-center px-4 py-6 sm:min-h-[340px] sm:px-6 sm:py-10 lg:min-h-[420px] lg:px-8">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-antique-gold">
              Shop the Edit
            </p>
            <h1 className="mt-2.5 max-w-[26rem] font-serif text-[1.75rem] font-semibold leading-[1.1] text-soft-white sm:mt-3 sm:text-4xl lg:text-5xl">
              {edit.title}
            </h1>
            <p className="mt-3 max-w-[34rem] text-sm leading-relaxed text-soft-white/85 sm:text-base">
              {edit.intro}
            </p>
            {/* Affiliate disclosure: small, understated, inside the header. */}
            <p className="mt-4 text-[11px] leading-relaxed text-soft-white/60">
              As an Amazon Associate, Evergreen House earns from qualifying
              purchases.
            </p>
          </div>
        </section>

        {/* Products, in manifest order, immediately below the header. */}
        <section className="bg-soft-white pb-10 pt-5 sm:pb-14 sm:pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-serif text-xl text-warm-dark sm:text-2xl">
                In this edit
              </h2>
              <p className="text-xs uppercase tracking-[0.14em] text-taupe">
                {products.length} pieces
              </p>
            </div>
            {products.length > 0 ? (
              <AnalyticsList
                id={`edit-${edit.slug}`}
                name={edit.title}
                context="shop_the_edit"
                items={analyticsItems}
              >
                <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                  {products.map((product) => (
                    <EditProductCard key={product.id} product={product} />
                  ))}
                </div>
              </AnalyticsList>
            ) : (
              <p className="mt-6 text-warm-gray">
                These pieces are being restocked. Browse{" "}
                <a
                  href="/collections"
                  className="font-medium text-burgundy transition-colors hover:text-burgundy-deep"
                >
                  all collections
                </a>{" "}
                in the meantime.
              </p>
            )}
          </div>
        </section>

        {/* Related edits: the other three, small. */}
        {related.length > 0 && (
          <section className="border-t border-beige/20 bg-cream-dark py-8 sm:py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-serif text-xl text-warm-dark sm:text-2xl">
                Related edits
              </h2>
              <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-6">
                {related.map((other) => (
                  <EditCard key={other.slug} edit={other} compact />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
