import { createFileRoute } from "@tanstack/react-router";

import {
  StockingGiftGuide,
  type StockingCardCopy,
  type StockingGuide,
  type StockingManifest,
} from "~/components/StockingGiftGuide";
import { generateStaticMetadata } from "~/lib/seo";
import { SMALL_SPACE_HOME_FITNESS_LIST } from "~/lib/storefront-lists";
import listManifest from "~/data/small-space-home-fitness/list-manifest.json";
import cardCopy from "~/data/small-space-home-fitness/card-copy.json";

/**
 * January list page: "Small-Space Home Fitness" (owner decisions 48 and 49, 2026-11-22). One of
 * the four January lists, built on the same storefront-list template as the
 * stocking pages. Every product fact comes from src/data/small-space-home-fitness/list-manifest.json,
 * the merchandiser's live read of the list on 2026-11-22; the lines come from
 * card-copy.json, keyed by ASIN. Nothing below is typed by hand.
 *
 * The page opens on its own Amazon list card, which carries the list name, one
 * line and one crystalpalino-20 link, and no rating, count or price.
 */

const PAGE_PATH = "/small-space-home-fitness";
const HERO_JPG = "/images/blog-reset-list-v2.jpg";
const HERO_WEBP = "/images/blog-reset-list-v2.webp";
const HERO_ALT =
  "A bright home office desk holding the Reset List finds: a paper file organizer, an open planner, a memory journal, a sunrise alarm clock and drawer organizers, with a plant at the edge of the desk in soft daylight";

const copy = cardCopy as unknown as StockingCardCopy;

const guide: StockingGuide = {
  pagePath: PAGE_PATH,
  eyebrow: "The January Reset",
  breadcrumbParent: {
    label: "The Reset List",
    href: "/blog/the-reset-list-17-finds",
  },
  heroJpg: HERO_JPG,
  heroWebp: HERO_WEBP,
  heroAlt: HERO_ALT,
  verifiedDate: "2026-11-22",
  verifiedDateLabel: "November 22, 2026",
  analyticsContext: "guide:small-space-home-fitness",
  analyticsPrefix: "small-space-home-fitness",
  list: { ...SMALL_SPACE_HOME_FITNESS_LIST, line: copy.list_card_line },
  manifest: listManifest as unknown as StockingManifest,
  copy,
  related: {
    heading: "The rest of the January reset",
    body: "Four lists, one for each part of January. Start with the organized home, or go straight to the part of the month you are on.",
    links: [
      {
        label: "New Year, Organized Home",
        href: "/new-year-organized-home",
        line: "Eight pieces for the January reset: containers, labels and drawers that make the shelves finally make sense.",
      },
      {
        label: "Meal Prep Kitchen Reset",
        href: "/meal-prep-kitchen-reset",
        line: "Eight kitchen pieces that shorten the distance between getting home and eating something good.",
      },
      {
        label: "Wellness at Home",
        href: "/wellness-at-home",
        line: "Eight quiet pieces for the part of January that is not about doing more.",
      },
      {
        label: "The Reset List: 17 Finds for a Home That Runs Itself",
        href: "/blog/the-reset-list-17-finds",
        line: "The post the four lists came out of: the systems that reset the week, one piece at a time.",
      },
    ],
  },
};

export const Route = createFileRoute("/small-space-home-fitness")({
  head: () => {
    const seo = generateStaticMetadata(
      copy.seo_title,
      copy.seo_description,
      PAGE_PATH,
      {
        image: HERO_JPG,
        imageWidth: 2000,
        imageHeight: 667,
      }
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: SmallSpaceHomeFitnessPage,
});

function SmallSpaceHomeFitnessPage() {
  return <StockingGiftGuide guide={guide} />;
}
