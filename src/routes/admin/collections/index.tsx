import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminSignOut } from "~/components/AdminSignOut";
import { requireAdmin } from "~/lib/admin-guard";
import { listAdminEdits, type AdminEditSummary } from "~/lib/admin-edits";

/**
 * /admin/collections: the eight "Shop the Edit" collections, draft and live.
 *
 * This is the entry point the owner uses instead of asking us to change a
 * collection. It lists what is live, what is only a draft, and which live
 * collections have draft changes waiting behind the publish switch.
 *
 * Data comes from an adminOnly server function, so a request without a session
 * gets a 401 rather than a list.
 */
export const Route = createFileRoute("/admin/collections/")({
  beforeLoad: ({ location }) => requireAdmin(location),
  head: () => ({
    meta: [
      { title: "Collections | Evergreen House" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CollectionsList,
});

function CollectionsList() {
  const [edits, setEdits] = useState<AdminEditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const rows = await listAdminEdits();
        if (live) setEdits(rows);
      } catch (err) {
        if (live) setError(adminErrorMessage(err, "The collection list"));
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="border-b border-beige/30 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-warm-dark">Collections</h1>
            <p className="mt-0.5 text-sm text-warm-gray">
              Edit a collection, then switch it live when it is ready
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="rounded-lg border border-beige/40 px-4 py-2 text-sm text-warm-dark transition hover:bg-cream-dark"
            >
              Dashboard
            </a>
            <AdminSignOut />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {loading && <p className="text-taupe">Loading collections...</p>}

        {!loading && !error && (
          <div className="overflow-hidden rounded-xl border border-beige/30 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-beige/20 bg-cream-dark text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-taupe">
                    Collection
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-taupe">
                    Pieces
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-taupe">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-taupe">
                    Last saved
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {edits.map((edit) => (
                  <tr key={edit.slug} className="border-b border-beige/10 hover:bg-cream/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-warm-dark">{edit.title}</p>
                      <p className="text-xs text-taupe">{edit.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-warm-gray">{edit.itemCount}</td>
                    <td className="px-4 py-3">
                      {edit.status === "published" ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Live
                        </span>
                      ) : (
                        <span className="rounded-full bg-cream-dark px-2 py-0.5 text-xs font-medium text-warm-gray">
                          Draft only
                        </span>
                      )}
                      {edit.hasUnpublishedChanges && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Draft changes
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-taupe">
                      {edit.updatedAt ? new Date(edit.updatedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/admin/collections/$slug"
                        params={{ slug: edit.slug }}
                        className="rounded-lg bg-midnight px-3 py-1.5 text-xs font-medium text-soft-white transition hover:bg-midnight-deep"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
                {edits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-warm-gray">
                      No collections found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs leading-relaxed text-taupe">
          Everything you change here is saved as a draft. The public page keeps showing the
          last published version until you use the switch on the collection page.
        </p>
      </main>
    </div>
  );
}

/** The adminOnly 401 arrives as an error body; say so in words the owner reads. */
function adminErrorMessage(err: unknown, what: string): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/unauthorized|"error":\s*401|\b401\b/i.test(raw)) {
    return "Your admin session has expired. Sign in again to load this page.";
  }
  return `${what} could not be loaded: ${raw}`;
}
