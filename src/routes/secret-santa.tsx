import { createFileRoute } from "@tanstack/react-router";

import {
  StockingGiftGuide,
  type StockingCardCopy,
  type StockingGuide,
  type StockingManifest,
} from "~/components/StockingGiftGuide";
import { generateStaticMetadata } from "~/lib/seo";
import { SECRET_SANTA_LIST } from "~/lib/storefront-lists";
import listManifest from "~/data/secret-santa/list-manifest.json";
import cardCopy from "~/data/secret-santa/card-copy.json";

/**
 * Gift guide: "Secret Santa Gifts They Will Actually Want" (2026-11-22, owner
 * decision 61). The eighth storefront list to get a page of its own, on the same
 * template as the three stocking pages.
 *
 * Every product fact comes from src/data/secret-santa/list-manifest.json, the
 * merchandiser's live read of the list on 2026-11-22, including the full size
 * images/I/ photo URL on each card. The editorial lines come from
 * card-copy.json, keyed by ASIN. The three long-form sections below the grid
 * are keyed by "/secret-santa" in src/data/deep-sections.json.
 */

const PAGE_PATH = "/secret-santa";
const HERO_JPG = "/images/stocking-stuffers-hero.jpg";
const HERO_WEBP = "/images/stocking-stuffers-hero.webp";
const HERO_ALT =
  "Kraft wrapped gifts tied with red velvet ribbon and twine beside a cream cable knit stocking on a marble counter, with a lit Christmas tree and a candle behind them";

const copy = cardCopy as unknown as StockingCardCopy;

const guide: StockingGuide = {
  pagePath: PAGE_PATH,
  heroJpg: HERO_JPG,
  heroWebp: HERO_WEBP,
  heroAlt: HERO_ALT,
  verifiedDate: "2026-11-22",
  verifiedDateLabel: "November 22, 2026",
  analyticsContext: "guide:secret-santa",
  analyticsPrefix: "secret-santa",
  list: { ...SECRET_SANTA_LIST, line: copy.list_card_line },
  manifest: listManifest as unknown as StockingManifest,
  copy,
};

export const Route = createFileRoute("/secret-santa")({
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
  component: SecretSantaPage,
});

function SecretSantaPage() {
  return <StockingGiftGuide guide={guide} />;
}
