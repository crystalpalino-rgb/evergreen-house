import { createFileRoute } from "@tanstack/react-router";

import {
  StockingGiftGuide,
  type StockingCardCopy,
  type StockingGuide,
  type StockingManifest,
} from "~/components/StockingGiftGuide";
import { generateStaticMetadata } from "~/lib/seo";
import { NEW_YEARS_EVE_LIST, getListImage } from "~/lib/storefront-lists";
import listManifest from "~/data/new-years-eve/list-manifest.json";
import cardCopy from "~/data/new-years-eve/card-copy.json";

/**
 * Gift guide: "New Year's Eve at Home: Black and Gold Party Finds for a
 * Grown-Up Countdown" (owner decision 64, 2026-11-23). The ninth storefront list
 * to get a page of its own, on the same template as /secret-santa.
 *
 * Every product fact comes from src/data/new-years-eve/list-manifest.json, the
 * merchandiser's live read of the list on 2026-11-23, including the full size
 * images/I/ photo URL on each card. The editorial lines come from
 * card-copy.json, keyed by ASIN. The three long-form sections below the grid
 * are keyed by "/new-years-eve" in src/data/deep-sections.json.
 *
 * The year gate is this page's own: the two pieces that read 2027 are the foil
 * balloons and the backdrop, and nothing on the page reads 2026.
 */

const PAGE_PATH = "/new-years-eve";
const HERO_JPG = "/images/new-years-eve-hero.jpg";
const HERO_WEBP = "/images/new-years-eve-hero.webp";
const HERO_ALT =
  "Black and gold New Year's Eve table with a champagne bucket of bottles on ice, gold foil fringe, black and gold balloons, white hydrangea and canapes";

const copy = cardCopy as unknown as StockingCardCopy;

const guide: StockingGuide = {
  pagePath: PAGE_PATH,
  eyebrow: "Holiday Edit",
  breadcrumbParent: { label: "Shop the Edits", href: "/collections" },
  heroJpg: HERO_JPG,
  heroWebp: HERO_WEBP,
  heroAlt: HERO_ALT,
  verifiedDate: "2026-11-23",
  verifiedDateLabel: "November 23, 2026",
  analyticsContext: "guide:new-years-eve",
  analyticsPrefix: "new-years-eve",
  list: { ...NEW_YEARS_EVE_LIST, line: copy.list_card_line },
  listImage: getListImage(NEW_YEARS_EVE_LIST.key),
  manifest: listManifest as unknown as StockingManifest,
  copy,
  related: {
    heading: "The notes behind this page",
    body: "The companion post walks the same nine pieces in the order I would set them out, with what came off the list and why.",
    links: [
      {
        label:
          "A Grown-Up Countdown at Home: Nine Black and Gold Pieces for 2027",
        href: "/blog/new-years-eve-at-home",
        line: "The same nine pieces, the year in the two places it belongs, and the order to set the room out in.",
      },
    ],
  },
};

export const Route = createFileRoute("/new-years-eve")({
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
  component: NewYearsEvePage,
});

function NewYearsEvePage() {
  return <StockingGiftGuide guide={guide} />;
}
