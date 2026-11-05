import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminSignOut } from "~/components/AdminSignOut";
import { requireAdmin } from "~/lib/admin-guard";
import {
  addEditItem,
  getAdminEdit,
  moveEditItem,
  removeEditItem,
  saveEditItem,
  saveEditMeta,
  searchAdminProducts,
  setEditPublication,
  type AdminEditDetail,
  type ProductSearchResult,
  type SaveResult,
} from "~/lib/admin-edits";
import heroImages from "~/data/hero-images.json";

/**
 * /admin/collections/<slug>: the curation screen for one collection.
 *
 * Everything on this page writes to the DRAFT (`edits` / `edit_items`). The
 * controls at the top are the only ones that change what the public sees, and
 * they are two separate actions (owner decisions 22 and 27, 2026-11-05):
 *
 *   - "Publish changes" on a live collection swaps the published snapshot in
 *     place, so the page is never taken down and a pin that points at it keeps
 *     resolving. A draft collection gets the same publish action, which is what
 *     makes it live.
 *   - "Retire from the site" is the only action that takes a page down, it says
 *     so plainly, and it asks first.
 *
 * A price typed on a card is stored with the day it was set, on the item, never
 * in the product row (owner decision 21).
 *
 * Save reads the three boxes on the card from the page itself, not from React
 * state. A controlled input whose state missed a keystroke would otherwise write
 * the figure from before the typing and print a green "Saved" over it, which is
 * invisible data loss (owner decision 29, 2026-11-05).
 *
 * Every write goes through an adminOnly server function. A save that would leave
 * a Pinterest landing page out of date is refused, and the refusal is shown
 * here in the words the owner needs to read.
 */
export const Route = createFileRoute("/admin/collections/$slug")({
  beforeLoad: ({ location }) => requireAdmin(location),
  head: () => ({
    meta: [
      { title: "Edit collection | Evergreen House" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CollectionEditor,
});

interface ArtImage {
  path: string;
  thumb: string;
  label: string;
  group: string;
}

const ART: ArtImage[] = (heroImages as { images: ArtImage[] }).images;

interface MetaForm {
  title: string;
  headline: string;
  intro: string;
  artNote: string;
  heroImage: string;
  cardImage: string;
  related: string[];
}

interface ItemForm {
  displayTitle: string;
  hook: string;
  price: string;
}

function adminErrorMessage(err: unknown, what: string): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/unauthorized|"error":\s*401|\b401\b/i.test(raw)) {
    return "Your admin session has expired. Sign in again to load this page.";
  }
  return `${what} could not be loaded: ${raw}`;
}

function toMetaForm(detail: AdminEditDetail): MetaForm {
  return {
    title: detail.title,
    headline: detail.headline,
    intro: detail.intro,
    artNote: detail.artNote,
    heroImage: detail.heroImage,
    cardImage: detail.cardImage,
    related: detail.related,
  };
}

function toItemForms(detail: AdminEditDetail): Record<number, ItemForm> {
  const out: Record<number, ItemForm> = {};
  for (const item of detail.items) {
    out[item.productId] = {
      displayTitle: item.displayTitle,
      hook: item.hook,
      /* Two decimals, so a figure she set reads back as she typed it: 1299.00,
       * never 1299. */
      price: item.priceOverride == null ? "" : item.priceOverride.toFixed(2),
    };
  }
  return out;
}

function CollectionEditor() {
  const { slug } = Route.useParams();
  const [detail, setDetail] = useState<AdminEditDetail | null>(null);
  const [meta, setMeta] = useState<MetaForm | null>(null);
  const [items, setItems] = useState<Record<number, ItemForm>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  /**
   * Notes on a save that went through anyway. Kept apart from `notice` so a
   * caveat reads as its own thing: amber, not green (a save) and not red (a
   * refusal).
   */
  const [notes, setNotes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  /** The retire panel: a deliberate second step, because it takes a page down. */
  const [retireConfirm, setRetireConfirm] = useState(false);
  /**
   * The title, line and price boxes on each card, held by element so Save can
   * read what is in the box at the moment she clicks.
   */
  const boxes = useRef<
    Record<number, { title?: HTMLInputElement | null; hook?: HTMLInputElement | null; price?: HTMLInputElement | null }>
  >({});

  /** What the box holds right now, falling back to state if the box is gone. */
  const boxValue = useCallback(
    (productId: number, which: "title" | "hook" | "price", fallback: string) =>
      boxes.current[productId]?.[which]?.value ?? fallback,
    [],
  );

  const load = useCallback(async () => {
    try {
      const next = await getAdminEdit({ data: { slug } });
      if (!next) {
        setError("That collection does not exist.");
        return;
      }
      setDetail(next);
      setMeta(toMetaForm(next));
      setItems(toItemForms(next));
      setError("");
    } catch (err) {
      setError(adminErrorMessage(err, "This collection"));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  /** Every write returns {ok, message}. Show the message and reload on success. */
  const run = useCallback(
    async (action: () => Promise<SaveResult>, what: string) => {
      if (busy) return;
      setBusy(true);
      setNotice("");
      setError("");
      setNotes([]);
      try {
        const result = await action();
        if (result.ok) {
          setNotice(result.message || what);
          setNotes(result.warnings ?? []);
          await load();
        } else {
          setError(result.message);
          /* A refusal is only loud if she can see it: the notice is at the top. */
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (err) {
        setError(adminErrorMessage(err, what));
        window.scrollTo({ top: 0, behavior: "smooth" });
      } finally {
        setBusy(false);
      }
    },
    [busy, load],
  );

  const isLive = detail?.status === "published";
  const hasPending = detail?.hasUnpublishedChanges ?? false;

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="border-b border-beige/30 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <Link
              to="/admin/collections"
              className="text-xs uppercase tracking-wider text-taupe hover:text-warm-dark"
            >
              Collections
            </Link>
            <h1 className="font-serif text-2xl font-semibold text-warm-dark">
              {detail?.title ?? "Loading"}
            </h1>
            <p className="mt-0.5 text-xs text-taupe">
              {slug} - {detail ? `${detail.items.length} pieces` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AdminSignOut />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading && <p className="text-taupe">Loading...</p>}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm leading-relaxed text-green-900">
            {notice}
          </div>
        )}
        {notes.length > 0 && (
          <div
            className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900"
            data-notice="went-through-with-a-note"
          >
            <p className="font-semibold">Saved, with one thing to know</p>
            {notes.map((note) => (
              <p key={note} className="mt-1">
                {note}
              </p>
            ))}
          </div>
        )}

        {detail && meta && (
          <>
            {/* The only controls that change what the public sees. */}
            <section className="mb-8 rounded-xl border border-beige/30 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-taupe">
                    Public status
                  </p>
                  <p className="mt-1 font-serif text-lg text-warm-dark" data-testid="public-status">
                    {!isLive
                      ? "Draft only, not on the site"
                      : hasPending
                        ? "Live on the site, with changes you have not published"
                        : "Live on the site and up to date"}
                  </p>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-warm-gray">
                    {!isLive
                      ? "This collection has never been live. Publishing it puts it on the site."
                      : hasPending
                        ? "The page is serving the version you last published. Publishing changes swaps the new version in without taking the page down, so anyone following a pin keeps landing on a live page."
                        : `Published ${detail.publishedAt ? new Date(detail.publishedAt).toLocaleString() : "earlier"}. Everything you have saved is already on the page.`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(!isLive || hasPending) && (
                    <button
                      type="button"
                      disabled={busy}
                      data-action={isLive ? "publish-changes" : "publish-draft"}
                      onClick={() =>
                        run(
                          () => setEditPublication({ data: { slug, action: "publish" } }),
                          "Published",
                        )
                      }
                      className={`rounded-lg px-5 py-3 text-sm font-medium text-white transition disabled:opacity-50 ${
                        isLive ? "bg-burgundy hover:bg-burgundy-deep" : "bg-midnight hover:bg-midnight-deep"
                      }`}
                    >
                      {isLive ? "Publish changes" : "Publish this collection"}
                    </button>
                  )}

                  {isLive && (
                    <button
                      type="button"
                      disabled={busy}
                      data-action="retire-open"
                      onClick={() => {
                        setNotice("");
                        setError("");
                        setRetireConfirm(true);
                      }}
                      className="rounded-lg border border-red-300 px-4 py-3 text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      Retire from the site
                    </button>
                  )}
                </div>
              </div>

              {isLive && retireConfirm && (
                <div
                  className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4"
                  data-testid="retire-confirm"
                >
                  <p className="font-semibold text-red-900">
                    Retiring takes this page down on purpose. It is not a publish.
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-red-800">
                    /collections/{slug} stops being served the moment you confirm, and anyone who
                    follows a link or a pin to it gets a 404. Nothing is deleted: every piece stays
                    here, and you can publish the collection again whenever you want it back.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      data-action="retire-confirm"
                      onClick={async () => {
                        await run(
                          () => setEditPublication({ data: { slug, action: "retire" } }),
                          "Retired",
                        );
                        setRetireConfirm(false);
                      }}
                      className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-800 disabled:opacity-50"
                    >
                      Yes, take the page down
                    </button>
                    <button
                      type="button"
                      data-action="retire-cancel"
                      onClick={() => setRetireConfirm(false)}
                      className="rounded-lg border border-beige/60 bg-white px-4 py-2.5 text-sm text-warm-dark transition hover:bg-cream-dark"
                    >
                      Keep it live
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Metadata */}
            <section className="mb-8 rounded-xl border border-beige/30 bg-white p-5 shadow-sm">
              <h2 className="font-serif text-lg font-semibold text-warm-dark">The collection</h2>
              <div className="mt-4 space-y-4">
                <Field label="Title">
                  <input
                    value={meta.title}
                    onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Headline">
                  <input
                    value={meta.headline}
                    onChange={(e) => setMeta({ ...meta, headline: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Intro">
                  <textarea
                    value={meta.intro}
                    onChange={(e) => setMeta({ ...meta, intro: e.target.value })}
                    rows={4}
                    className={inputClass}
                  />
                </Field>
                <Field label="Art note">
                  <textarea
                    value={meta.artNote}
                    onChange={(e) => setMeta({ ...meta, artNote: e.target.value })}
                    rows={3}
                    className={inputClass}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ArtPicker
                    label="Hero image"
                    value={meta.heroImage}
                    onChange={(path) => setMeta({ ...meta, heroImage: path })}
                  />
                  <ArtPicker
                    label="Card image"
                    value={meta.cardImage}
                    onChange={(path) => setMeta({ ...meta, cardImage: path })}
                  />
                </div>

                <Field label="Related collections (shown in the strip under the pieces)">
                  <div className="flex flex-wrap gap-3">
                    {detail.others.map((other) => (
                      <label key={other.slug} className="flex items-center gap-2 text-sm text-warm-dark">
                        <input
                          type="checkbox"
                          checked={meta.related.includes(other.slug)}
                          onChange={(e) =>
                            setMeta({
                              ...meta,
                              related: e.target.checked
                                ? [...meta.related, other.slug]
                                : meta.related.filter((s) => s !== other.slug),
                            })
                          }
                        />
                        {other.title}
                      </label>
                    ))}
                  </div>
                </Field>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => saveEditMeta({ data: { slug, ...meta } }), "Saved")}
                    className="rounded-lg bg-warm-dark px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    Save the collection
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setMeta(toMetaForm(detail))}
                    className="rounded-lg border border-beige/50 px-4 py-2.5 text-sm text-warm-dark transition hover:bg-cream-dark"
                  >
                    Undo my changes here
                  </button>
                </div>
              </div>
            </section>

            {/* Pieces */}
            <section className="mb-8 rounded-xl border border-beige/30 bg-white p-5 shadow-sm">
              <h2 className="font-serif text-lg font-semibold text-warm-dark">
                The pieces ({detail.items.length})
              </h2>
              <p className="mt-1 text-xs text-warm-gray">
                Order here is the order on the page. A price you type is shown with the day you
                set it, and a later price check can replace it.
              </p>

              <div className="mt-4 space-y-3">
                {detail.items.map((item, index) => {
                  const form = items[item.productId] ?? {
                    displayTitle: item.displayTitle,
                    hook: item.hook,
                    price: "",
                  };
                  return (
                    <div
                      key={item.productId}
                      className="rounded-lg border border-beige/30 bg-cream/40 p-3"
                    >
                      <div className="flex gap-3">
                        <div className="flex w-8 shrink-0 flex-col items-center gap-1">
                          <span className="text-xs font-semibold text-taupe">{index + 1}</span>
                          <button
                            type="button"
                            aria-label="Move up"
                            disabled={busy || index === 0}
                            onClick={() =>
                              run(
                                () =>
                                  moveEditItem({ data: { slug, productId: item.productId, direction: "up" } }),
                                "Moved up",
                              )
                            }
                            className="rounded border border-beige/50 px-1 text-xs text-warm-dark disabled:opacity-30"
                          >
                            up
                          </button>
                          <button
                            type="button"
                            aria-label="Move down"
                            disabled={busy || index === detail.items.length - 1}
                            onClick={() =>
                              run(
                                () =>
                                  moveEditItem({ data: { slug, productId: item.productId, direction: "down" } }),
                                "Moved down",
                              )
                            }
                            className="rounded border border-beige/50 px-1 text-xs text-warm-dark disabled:opacity-30"
                          >
                            dn
                          </button>
                        </div>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            width={56}
                            height={56}
                            className="h-14 w-14 shrink-0 rounded bg-white object-contain"
                          />
                        ) : (
                          <div className="h-14 w-14 shrink-0 rounded bg-white" />
                        )}
                        <div className="min-w-0 flex-1 space-y-2">
                          <input
                            ref={(el) => {
                              boxes.current[item.productId] = { ...boxes.current[item.productId], title: el };
                            }}
                            value={form.displayTitle}
                            onChange={(e) =>
                              setItems({
                                ...items,
                                [item.productId]: { ...form, displayTitle: e.target.value },
                              })
                            }
                            className={inputClass}
                            aria-label={`Display title for piece ${index + 1}`}
                          />
                          <input
                            ref={(el) => {
                              boxes.current[item.productId] = { ...boxes.current[item.productId], hook: el };
                            }}
                            value={form.hook}
                            onChange={(e) =>
                              setItems({ ...items, [item.productId]: { ...form, hook: e.target.value } })
                            }
                            className={inputClass}
                            placeholder="The one line under the title"
                            aria-label={`Editorial line for piece ${index + 1}`}
                          />
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 text-xs text-warm-gray">
                              Price you set
                              <input
                                ref={(el) => {
                                  boxes.current[item.productId] = { ...boxes.current[item.productId], price: el };
                                }}
                                value={form.price}
                                onChange={(e) =>
                                  setItems({ ...items, [item.productId]: { ...form, price: e.target.value } })
                                }
                                inputMode="decimal"
                                placeholder={item.verifiedPrice == null ? "none" : String(item.verifiedPrice)}
                                className="w-24 rounded border border-beige/60 bg-white px-2 py-1 text-sm text-warm-dark"
                                aria-label={`Typed price for piece ${index + 1}`}
                              />
                            </label>
                            {item.priceSetAt && (
                              <span className="text-xs text-taupe">
                                set {new Date(item.priceSetAt).toLocaleDateString()}
                              </span>
                            )}
                            <span className="text-xs text-taupe">
                              verified {item.verifiedPrice == null ? "none" : `$${item.verifiedPrice}`}
                              {item.rating != null ? `, ${item.rating} stars` : ""}
                            </span>
                            <span className="text-xs text-taupe">id {item.productId}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              /* What she can see in the three boxes is what gets
                               * saved, even if a keystroke never reached state. */
                              const displayTitle = boxValue(item.productId, "title", form.displayTitle);
                              const hook = boxValue(item.productId, "hook", form.hook);
                              const price = boxValue(item.productId, "price", form.price);
                              if (
                                displayTitle !== form.displayTitle ||
                                hook !== form.hook ||
                                price !== form.price
                              ) {
                                setItems({
                                  ...items,
                                  [item.productId]: { displayTitle, hook, price },
                                });
                              }
                              return run(
                                () =>
                                  saveEditItem({
                                    data: {
                                      slug,
                                      productId: item.productId,
                                      displayTitle,
                                      hook,
                                      price: price.trim() === "" ? null : price.trim(),
                                    },
                                  }),
                                "Saved",
                              );
                            }}
                            className="rounded bg-midnight px-3 py-1.5 text-xs font-medium text-soft-white disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              run(
                                () => removeEditItem({ data: { slug, productId: item.productId } }),
                                "Removed",
                              )
                            }
                            className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-700 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <AddProduct slug={slug} busy={busy} onAdd={(productId) =>
              run(() => addEditItem({ data: { slug, productId } }), "Added")
            } />
          </>
        )}
      </main>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-beige/60 bg-white px-3 py-2 text-sm text-warm-dark outline-none focus:border-burgundy focus:ring-2 focus:ring-antique-gold/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-taupe">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

/**
 * The art dropdown: a list of the hero images the site already has, each shown
 * as the picture itself, so the owner picks by looking (owner decision 23).
 */
function ArtPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = useMemo(() => ART.find((image) => image.path === value), [value]);
  const groups = useMemo(() => {
    const out = new Map<string, ArtImage[]>();
    for (const image of ART) {
      const list = out.get(image.group) ?? [];
      list.push(image);
      out.set(image.group, list);
    }
    return [...out.entries()];
  }, []);

  return (
    <div>
      <span className="block text-xs font-semibold uppercase tracking-wider text-taupe">{label}</span>
      <div className="mt-1 flex items-start gap-3">
        {value ? (
          <img
            src={`${value}.jpg`}
            alt={current?.label ?? value}
            width={160}
            height={90}
            className="h-16 w-28 rounded border border-beige/40 object-cover"
          />
        ) : (
          <div className="flex h-16 w-28 items-center justify-center rounded border border-dashed border-beige/60 text-xs text-taupe">
            none
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm text-warm-dark">{current?.label ?? value ?? "No art selected"}</p>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="mt-1 rounded border border-beige/50 px-3 py-1 text-xs text-warm-dark hover:bg-cream-dark"
          >
            {open ? "Hide the art list" : "Choose art"}
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-beige/40 bg-cream/50 p-2">
          {groups.map(([group, list]) => (
            <div key={group} className="mb-3">
              <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-taupe">{group}</p>
              <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {list.map((image) => (
                  <button
                    key={image.path}
                    type="button"
                    onClick={() => {
                      onChange(image.path);
                      setOpen(false);
                    }}
                    className={`overflow-hidden rounded border-2 text-left ${
                      image.path === value ? "border-burgundy" : "border-transparent hover:border-antique-gold"
                    }`}
                  >
                    <img src={image.thumb} alt={image.label} className="h-14 w-full object-cover" />
                    <span className="block truncate px-1 py-0.5 text-[10px] text-warm-gray">
                      {image.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Catalog search by title, ASIN or id, then add the piece to the draft. */
function AddProduct({
  slug,
  busy,
  onAdd,
}: {
  slug: string;
  busy: boolean;
  onAdd: (productId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function search() {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      setResults(await searchAdminProducts({ data: { q: query.trim() } }));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <section className="rounded-xl border border-beige/30 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-lg font-semibold text-warm-dark">Add a piece</h2>
      <p className="mt-1 text-xs text-warm-gray">
        Search the catalog by title or ASIN. The piece is added to the end of the draft, where
        you can rename it, write its line and set a price.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Search a product title or ASIN"
          className={inputClass}
          aria-label="Search the catalog"
        />
        <button
          type="button"
          onClick={search}
          disabled={searching}
          className="shrink-0 rounded-lg bg-warm-dark px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {searching ? "Searching" : "Search"}
        </button>
      </div>
      {results.length > 0 && (
        <ul className="mt-4 space-y-2">
          {results.map((product) => (
            <li
              key={product.id}
              className="flex items-center gap-3 rounded-lg border border-beige/30 bg-cream/40 p-2"
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded bg-white object-contain"
                />
              ) : (
                <div className="h-12 w-12 rounded bg-white" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-warm-dark">{product.name}</p>
                <p className="text-xs text-taupe">
                  id {product.id}
                  {product.price != null ? ` - $${product.price}` : ""}
                  {product.rating != null ? ` - ${product.rating} stars` : ""}
                  {product.room ? ` - ${product.room}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onAdd(product.id)}
                className="shrink-0 rounded bg-midnight px-3 py-1.5 text-xs font-medium text-soft-white disabled:opacity-50"
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] text-taupe">{slug}</p>
    </section>
  );
}
