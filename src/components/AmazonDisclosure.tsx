import { cardVerifiedMonth } from "~/lib/card-copy";

/**
 * The page-level Amazon Associates disclosure.
 *
 * Owner Room Card Standard (2026-10-19): the disclosure appears ONCE PER PAGE,
 * not under every card. Every page that renders a product card grid therefore
 * mounts this component exactly once, and the card itself carries no disclosure
 * line at all.
 *
 * The date is the honest one: it is the day the prices and ratings shown on the
 * page were last read from the products' Amazon pages, rendered as a month and
 * year ("November 2026"). Pass `checked` when a page's data was verified on a
 * different date; when the date is unknown the line simply drops the claim.
 */

/** Day the catalog price and rating pass behind these cards ran. */
export const CARD_DATA_CHECKED_AT = "2026-11-04";

export function AmazonDisclosure({
  checked = CARD_DATA_CHECKED_AT,
  variant = "page",
  className = "",
}: {
  /** Date the price and rating data was verified. Null drops the date claim. */
  checked?: string | Date | null;
  /** "page" is the centered line under a grid, "inline" sits in a text column. */
  variant?: "page" | "inline";
  className?: string;
}) {
  const month = cardVerifiedMonth(checked);
  const line = month
    ? `As an Amazon Associate we earn from qualifying purchases. Prices and ratings checked ${month} and can change.`
    : "As an Amazon Associate we earn from qualifying purchases. Prices and ratings can change.";

  const layout =
    variant === "inline"
      ? "text-left text-xs leading-relaxed text-taupe/70"
      : "mx-auto max-w-3xl px-4 text-center text-[11px] leading-relaxed text-taupe sm:px-6";

  return <p className={`${layout} ${className}`}>{line}</p>;
}
