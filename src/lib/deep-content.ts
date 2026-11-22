import deepSections from "~/data/deep-sections.json";

/**
 * Long-form editorial sections that sit below the card grid on an edit page or
 * a gift-guide list page.
 *
 * The copy is authored once, outside the components, in
 * src/data/deep-sections.json, keyed by the page path it belongs to. A page
 * with no entry renders nothing at all, so adding a page is a data change and
 * never a template change.
 */

export type DeepPiece = {
  /** Clean human product title, as the card below prints it. */
  product: string;
  /** One line on who the piece is for. */
  suits: string;
};

export type DeepSection = {
  id: string;
  heading: string;
  paragraphs?: string[];
  checklist?: string[];
  pieces?: DeepPiece[];
};

export type DeepContent = {
  page_title: string;
  verified_label?: string;
  sections: DeepSection[];
};

const CONTENT = deepSections as unknown as Record<string, DeepContent>;

/** The sections for one page path, in the order they were written. */
export function getDeepSections(pagePath: string): DeepSection[] {
  return CONTENT[pagePath]?.sections ?? [];
}
