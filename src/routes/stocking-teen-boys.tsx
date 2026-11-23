import { createFileRoute } from "@tanstack/react-router";

import {
  StockingGiftGuide,
  type StockingCardCopy,
  type StockingGuide,
  type StockingManifest,
} from "~/components/StockingGiftGuide";
import { generateStaticMetadata } from "~/lib/seo";
import { TEEN_BOYS_STOCKING_LIST, type StorefrontListImage } from "~/lib/storefront-lists";
import listManifest from "~/data/stocking-teen-boys/list-manifest.json";
import cardCopy from "~/data/stocking-teen-boys/card-copy.json";

/**
 * Gift guide: "Stocking Stuffers for Teen Boys: Tech, Games and Gear" (2026-11-22,
 * owner decision 48). One of the three stocking lists that got a page of its
 * own rather than a section on the hub. Every product fact comes from
 * src/data/stocking-teen-boys/list-manifest.json, the merchandiser's live read
 * of the list on 2026-11-22; the lines come from card-copy.json, keyed by ASIN.
 *
 * The gaming socks read 4.7 stars on 72 ratings, under the house 100 review
 * bar; the card shows the honest number and the line does not lean on it.
 */

const PAGE_PATH = "/stocking-teen-boys";
const HERO_JPG = "/images/stocking-teen-boys-hero-v2.jpg";
const HERO_WEBP = "/images/stocking-teen-boys-hero-v2.webp";
const HERO_ALT =
  "Flat lay of stocking gifts for teen boys: a Wilson football, wireless earbuds, a light strip, patterned socks, a power bank, card games and hand warmers under a lit tree";

/**
 * The list card at the top of this page carries the list's own flat lay of
 * its gifts, the portrait art Crystal supplied (owner, 2026-11-22). Portrait,
 * so the scene is held whole instead of cropped to a landscape slot. It is
 * the list's scene, never a product photo, and the card still carries no
 * rating, count or price.
 */
const LIST_IMAGE: StorefrontListImage = {
  src: "/images/stocking-teen-boys-card-v2.jpg",
  webp: "/images/stocking-teen-boys-card-v2.webp",
  alt: "Flat lay of teen stocking gifts with a Wilson football, patterned socks, a power bank, card games and hand warmers",
  aspect: "portrait",
};

const copy = cardCopy as unknown as StockingCardCopy;

const guide: StockingGuide = {
  pagePath: PAGE_PATH,
  heroJpg: HERO_JPG,
  heroWebp: HERO_WEBP,
  heroAlt: HERO_ALT,
  verifiedDate: "2026-11-22",
  verifiedDateLabel: "November 22, 2026",
  analyticsContext: "guide:stocking-teen-boys",
  analyticsPrefix: "stocking-teen-boys",
  listImage: LIST_IMAGE,
  list: { ...TEEN_BOYS_STOCKING_LIST, line: copy.list_card_line },
  manifest: listManifest as unknown as StockingManifest,
  copy,
};

export const Route = createFileRoute("/stocking-teen-boys")({
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
  component: StockingTeenBoysPage,
});

function StockingTeenBoysPage() {
  return <StockingGiftGuide guide={guide} />;
}
