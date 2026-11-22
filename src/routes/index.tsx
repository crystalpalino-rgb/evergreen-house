import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import {
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
  orderFeaturedEdits,
  resolveHomepage,
  type HomepageSeason,
} from "~/lib/homepage-season";
import { getListsByKey, type StorefrontList } from "~/lib/storefront-lists";

type HomeSearch = { hero?: "b" | "c" };

export const Route = createFileRoute("/")({
  /* ?hero=a|b|c selects one of the three owner-reviewable hero directions.
     Anything else (including no param) falls back to the season's own art. */
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const raw = typeof search.hero === "string" ? search.hero.toLowerCase() : "";
    if (raw === "b" || raw === "c") return { hero: raw };
    return {};
  },
  head: ({ match }) => {
    const seo = generateHomeMetadata();
    /* LCP: the hero photograph is the first paint element, so the art the page
       actually renders is preloaded, media scoped to the same 768px breakpoint
       the <picture> switches on. Which art that is comes from the same dated
       season table the loader reads, so the preload never points at the season
       the page has already left. The preload used to sit in the root head and
       pointed at retired art nothing rendered. */
    const hero = (match.search as HomeSearch | undefined)?.hero;
    const season = resolveHomepage();
    return {
      meta: seo.meta,
      links: [
        ...seo.links,
        ...heroArtPreloadLinks(hero ?? season.hero.concept),
      ],
    };
  },
  loader: async () => {
    /* What the homepage looks like today, decided here on the server from the
       checked-in dated table (~/data/homepage-schedule). The component renders
       this answer, so the first paint is already the season's hero and row and
       there is no flash of the previous one. */
    const season: HomepageSeason = resolveHomepage();

    /* The SHOP THE EDITS row is database-backed (collection admin, phase 1).
       The season decides its order and what is off it; a failed edits read
       degrades to an empty row the way the two curated grids below already
       do. */
    let edits: EditCardData[] = [];
    try {
      edits = orderFeaturedEdits(
        await getEditSummaries(),
        season.leadEdits,
        season.excludedEdits,
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
      return { edits, shopTheLook, currentEdit, season };
    } catch (err) {
      console.error("Loader error:", err);
      return {
        edits,
        shopTheLook: [] as EditProduct[],
        currentEdit: [] as EditProduct[],
        season,
      };
    }
  },
  component: Home,
});

function Home() {
  const { edits, shopTheLook, currentEdit, season } = Route.useLoaderData();
  const { hero } = Route.useSearch();
  const heroConcept = hero ?? season.hero.concept;

  /* Storefront list cards under THE CURRENT EDIT, named by the season. Not
     products, so they never enter the view_item_list payload. A season can name
     a list that does not exist yet; that key is skipped, never rendered empty. */
  const currentEditLists: StorefrontList[] = getListsByKey(season.featuredLists);

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
            shop is actually selling. The season table owns the words and the
            link, so the strip flips with the hero on the same day; a season
            with no strip set renders none. */}
        {season.announcement && (
          <div className="w-full border-b border-soft-white/10 bg-midnight">
            <p className="mx-auto max-w-7xl px-4 py-2.5 text-center text-xs leading-relaxed text-soft-white/80 sm:px-6 sm:text-sm">
              {season.announcement.text}{" "}
              <a
                href={season.announcement.href}
                className="font-semibold uppercase tracking-[0.1em] text-antique-gold underline-offset-2 transition-colors hover:text-soft-white hover:underline"
              >
                {season.announcement.label}
              </a>
            </p>
          </div>
        )}
        {/* Owner-approved homepage hierarchy, top to bottom:
            1 hero, 2 shop the edits, 3 shop the look (the holiday hosting
            table), 4 the current edit, 5 explore by room, 6 from the journal,
            7 email signup. Sections 3 and 4 are curated from the checked-in
            homepage merchandising file, so no row on this page is query-picked. */}
        <Hero concept={heroConcept} copy={season.hero} />
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
