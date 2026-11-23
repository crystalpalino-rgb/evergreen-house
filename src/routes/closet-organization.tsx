import { createFileRoute } from "@tanstack/react-router";

import {
  StockingGiftGuide,
  type StockingCardCopy,
  type StockingGuide,
  type StockingManifest,
} from "~/components/StockingGiftGuide";
import { generateStaticMetadata } from "~/lib/seo";
import { CLOSET_ORGANIZATION_LIST, getListImage } from "~/lib/storefront-lists";
import listManifest from "~/data/closet-organization/list-manifest.json";
import cardCopy from "~/data/closet-organization/card-copy.json";

/**
 * January list page: "Closet Organization Ideas" (owner decision 54,
 * 2026-11-22). Built on the same storefront-list template as the four January
 * lists. Every product fact comes from
 * src/data/closet-organization/list-manifest.json, the merchandiser's live read
 * of the list on 2026-11-23; the lines come from card-copy.json, keyed by ASIN,
 * which is the page copy's card_hook block lifted as-is. Nothing below is typed
 * by hand.
 *
 * The page opens on its own Amazon list card, which carries the list name, one
 * line, its own 4:5 scene and one crystalpalino-20 link, and no rating, count or
 * price. The hero is the designer's 1600x1100 scene, so the frame holds 16:11
 * rather than the 3:1 banner the older pages use.
 */

const PAGE_PATH = "/closet-organization";
const HERO_JPG = "/images/january-closet-organization-hero.jpg";
const HERO_WEBP = "/images/january-closet-organization-hero.webp";
const HERO_ALT =
  "Two woven baskets and folded oatmeal linens on the top shelf of a pale oak closet, with a row of matching wooden hangers, a stack of sweaters and a shoe rack below, in warm morning light.";

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
  heroWidth: 1600,
  heroHeight: 1100,
  verifiedDate: "2026-11-23",
  verifiedDateLabel: "November 23, 2026",
  analyticsContext: "guide:closet-organization",
  analyticsPrefix: "closet-organization",
  list: { ...CLOSET_ORGANIZATION_LIST, line: copy.list_card_line },
  listImage: getListImage(CLOSET_ORGANIZATION_LIST.key),
  manifest: listManifest as unknown as StockingManifest,
  copy,
  related: {
    heading: "The rest of the January reset",
    body: "Two working rooms, one list each, and the post the reset lists came out of.",
    links: [
      {
        label: "Pantry Organization Ideas",
        href: "/pantry-organization",
        line: "Seven pantry organizers chosen to make a shelf legible, read and dated the same day.",
      },
      {
        label: "Closet Organization Ideas: Eight Finds That Keep a Closet Tidy",
        href: "/blog/closet-organization-ideas",
        line: "The companion post: why none of the eight is pretty, and the order I would buy them in.",
      },
      {
        label:
          "Pantry Organization Ideas: Seven Finds That Make a Shelf Legible",
        href: "/blog/pantry-organization-ideas",
        line: "The pantry companion post, for the shelf where things go to be forgotten.",
      },
      {
        label: "The Reset List: 17 Finds for a Home That Runs Itself",
        href: "/blog/the-reset-list-17-finds",
        line: "The post the reset lists came out of: the systems that reset the week, one piece at a time.",
      },
    ],
  },
};

export const Route = createFileRoute("/closet-organization")({
  head: () => {
    const seo = generateStaticMetadata(
      copy.seo_title,
      copy.seo_description,
      PAGE_PATH,
      {
        image: HERO_JPG,
        imageWidth: 1600,
        imageHeight: 1100,
      },
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: ClosetOrganizationPage,
});

function ClosetOrganizationPage() {
  return <StockingGiftGuide guide={guide} />;
}
