import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import {
  DEFAULT_HERO_CONCEPT,
  Hero,
  heroArtPreloadLinks,
} from "~/components/Hero";
import { ShopTheEdits } from "~/components/ShopTheEdits";
import { ShopTheLook } from "~/components/ShopTheLook";
import { TheCurrentEdit } from "~/components/TheCurrentEdit";
import { BrowseByRoom } from "~/components/BrowseByRoom";
import { FromTheJournal } from "~/components/FromTheJournal";
import { EmailSignup } from "~/components/EmailSignup";
import { Footer } from "~/components/Footer";
import { AmazonDisclosure } from "~/components/AmazonDisclosure";
import {
  CURRENT_EDIT,
  SHOP_THE_LOOK,
  getSectionProducts,
} from "~/lib/homepage-sections";
import { generateHomeMetadata } from "~/lib/seo";
import { getOrganizationSchema, getWebSiteSchema, SITE_URL } from "~/lib/schema";
import { getEditSummaries, type EditCardData, type EditProduct } from "~/lib/edits";
import {
  RESET_LIST,
  SHOW_RESET_LIST,
  SHOW_UNDER19_ON_HOMEPAGE,
  UNDER19_LIST,
  type StorefrontList,
} from "~/lib/storefront-lists";

type HomeSearch = { hero?: "b" | "c" };

/* Edits that are live on /collections but deliberately carry no homepage card
   yet (owner, 2026-11-20: the Timeless Bedroom Edit is listed on the collections
   index only). The homepage row renders every published edit, so the hold has to
   be named here; delete a slug from this set to give it its homepage card. */
const HOMEPAGE_HELD_EDITS = new Set<string>(["timeless-bedroom-edit"]);

export const Route = createFileRoute("/")({
  /* ?hero=a|b|c selects one of the three owner-reviewable hero directions.
     Anything else (including no param) falls back to concept A. */
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const raw = typeof search.hero === "string" ? search.hero.toLowerCase() : "";
    if (raw === "b" || raw === "c") return { hero: raw };
    return {};
  },
  head: ({ match }) => {
    const seo = generateHomeMetadata();
    /* LCP: the hero photograph is the first paint element, so the art the page
       actually renders is preloaded, media scoped to the same 768px breakpoint
       the <picture> switches on. The preload used to sit in the root head and
       pointed at retired art nothing rendered. */
    const hero = (match.search as HomeSearch | undefined)?.hero;
    return {
      meta: seo.meta,
      links: [...seo.links, ...heroArtPreloadLinks(hero ?? DEFAULT_HERO_CONCEPT)],
    };
  },
  loader: async () => {
    /* The SHOP THE EDITS row is now database-backed (collection admin, phase 1),
       so the list is loaded here and handed to the component rather than read
       from a module-level constant. A failed edits read degrades to an empty row
       the way the two curated grids below already do. */
    let edits: EditCardData[] = [];
    try {
      edits = (await getEditSummaries()).filter(
        (edit) => !HOMEPAGE_HELD_EDITS.has(edit.slug),
      );
    } catch (err) {
      console.error("Edits loader error:", err);
    }
    try {
      /* Two curated grids, fetched by id from the checked-in curation file.
         The old getTrendingProducts(6) auto-pick is gone: nothing above the
         fold is chosen by a query any more. */
      const [shopTheLook, currentEdit] = await Promise.all([
        getSectionProducts(SHOP_THE_LOOK),
        getSectionProducts(CURRENT_EDIT),
      ]);
      return { edits, shopTheLook, currentEdit };
    } catch (err) {
      console.error("Loader error:", err);
      return {
        edits,
        shopTheLook: [] as EditProduct[],
        currentEdit: [] as EditProduct[],
      };
    }
  },
  component: Home,
});

function Home() {
  const { edits, shopTheLook, currentEdit } = Route.useLoaderData();
  const { hero } = Route.useSearch();
  const heroConcept = hero ?? "a";

  /* Storefront list cards under THE CURRENT EDIT. Not products, so they never
     enter the view_item_list payload. The Under $19 card is seasonal; The
     Reset List is not. */
  const currentEditLists: StorefrontList[] = [
    ...(SHOW_UNDER19_ON_HOMEPAGE ? [UNDER19_LIST] : []),
    ...(SHOW_RESET_LIST ? [RESET_LIST] : []),
  ];

  // Homepage-specific JSON-LD
  const homeSchema = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@graph": [
        getWebSiteSchema(`${SITE_URL}/search`),
        getOrganizationSchema(),
      ],
    },
    null,
    0
  );

  return (
    <>
      <Header />
      <main>
        {/* Homepage-specific schema (overrides __root.tsx default with more context) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: homeSchema }}
        />
        {/* Seasonal announcement strip - owner palette: midnight navy band,
            antique gold links. One link only: the fall link came off on
            2026-11-15 (shop audit item 7) so the strip points at the season the
            shop is actually selling. */}
        <div className="w-full border-b border-soft-white/10 bg-midnight">
          <p className="mx-auto max-w-7xl px-4 py-2.5 text-center text-xs leading-relaxed text-soft-white/80 sm:px-6 sm:text-sm">
            The Holiday Shop is live. Warm, curated finds for the season.{" "}
            <a
              href="/collection/holiday"
              className="font-semibold uppercase tracking-[0.1em] text-antique-gold underline-offset-2 transition-colors hover:text-soft-white hover:underline"
            >
              Shop Holiday
            </a>
          </p>
        </div>
        {/* Owner-approved homepage hierarchy, top to bottom:
            1 hero, 2 shop the edits, 3 shop the look (the holiday hosting
            table), 4 the current edit, 5 explore by room, 6 from the journal,
            7 email signup. Sections 3 and 4 are curated from the checked-in
            homepage merchandising file, so no row on this page is query-picked. */}
        <Hero concept={heroConcept} />
        <ShopTheEdits edits={edits} />
        <ShopTheLook products={shopTheLook} />
        <TheCurrentEdit
          products={currentEdit}
          storefrontLists={currentEditLists}
        />
        {/* One Amazon Associates disclosure for the whole page, under the last
            product grid (owner Room Card Standard). The cards carry none. */}
        <div className="bg-soft-white pb-8">
          <AmazonDisclosure />
        </div>
        <BrowseByRoom />
        <FromTheJournal />
        <EmailSignup />
      </main>
      <Footer />
    </>
  );
}
