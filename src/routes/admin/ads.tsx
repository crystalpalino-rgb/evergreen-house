import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AdminSignOut } from "~/components/AdminSignOut";
import { requireAdmin } from "~/lib/admin-guard";
import { getAdsAdminState, saveAdsAdminState, type AdsAdminState } from "~/lib/admin-fns";
import { parseHeadSnippet } from "~/lib/head-snippet";
import { adsTxtBody, normalizePublisherId } from "~/lib/ads-txt";

export const Route = createFileRoute("/admin/ads")({
  beforeLoad: ({ location }) => requireAdmin(location),
  head: () => ({
    meta: [
      { title: "Header snippet and ads.txt | Evergreen House" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async (): Promise<AdsAdminState> => {
    return getAdsAdminState();
  },
  component: AdsAdminPage,
});

function AdsAdminPage() {
  const state = Route.useLoaderData();
  const router = useRouter();

  const [headHtml, setHeadHtml] = useState(state.headHtml);
  const [publisherId, setPublisherId] = useState(state.publisherId);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(
    null,
  );

  // What the head would inject from what is in the box right now, so she sees
  // the result before she saves it.
  const preview = parseHeadSnippet(headHtml);
  const previewAdsTxt = adsTxtBody(publisherId);
  const idLooksWrong = publisherId.trim().length > 0 && !normalizePublisherId(publisherId);

  async function save() {
    setBusy(true);
    setNotice(null);
    try {
      const result = await saveAdsAdminState({ data: { headHtml, publisherId } });
      if (!result.ok) {
        setNotice({ kind: "error", text: result.reason });
        return;
      }
      setNotice(
        result.warnings.length
          ? { kind: "warn", text: `Saved. ${result.warnings.join(" ")}` }
          : { kind: "ok", text: "Saved. The site uses this from the next page load." },
      );
      await router.invalidate();
    } catch {
      setNotice({
        kind: "error",
        text: "The save did not reach the server. Nothing changed on the site - try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeSnippet() {
    setHeadHtml("");
    setBusy(true);
    setNotice(null);
    try {
      const result = await saveAdsAdminState({ data: { headHtml: "", publisherId } });
      if (!result.ok) {
        setNotice({ kind: "error", text: result.reason });
        return;
      }
      setNotice({ kind: "ok", text: "Removed. Nothing is injected into the head now." });
      await router.invalidate();
    } catch {
      setNotice({
        kind: "error",
        text: "The removal did not reach the server. Nothing changed on the site - try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  const live = state.headParsed;

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="border-b border-beige/30 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-warm-dark">
              Header snippet and ads.txt
            </h1>
            <p className="mt-0.5 text-sm text-warm-gray">
              What goes in the head of every page, and the ads.txt file at the root
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="rounded-lg bg-warm-dark px-4 py-2 text-sm text-white transition hover:opacity-90"
            >
              Dashboard
            </a>
            <AdminSignOut />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {!state.readable && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            The settings could not be read, so nothing is being injected. {state.error}
          </div>
        )}

        {/* What is live now */}
        <section className="rounded-xl border border-beige/30 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-warm-dark">
            What is live right now
          </h2>
          <p className="mt-1 text-sm text-warm-gray">
            This is exactly what is in the head of every page of the site at this moment.
          </p>

          {live.ok ? (
            <>
              <p className="mt-4 text-sm text-green-800">
                {live.scripts.length} script {live.scripts.length === 1 ? "tag is" : "tags are"}{" "}
                injected into the head.
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-warm-dark/95 p-4 text-xs leading-relaxed text-soft-white">
                {live.html}
              </pre>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-warm-dark">
                Nothing is injected. The head of every page is exactly as the site was built.
              </p>
              {live.problems.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">
                  {live.problems.map((problem, i) => (
                    <li key={i}>{problem}</li>
                  ))}
                </ul>
              )}
            </>
          )}

          {state.updatedAt && (
            <p className="mt-3 text-xs text-taupe">
              Last saved{" "}
              {new Date(state.updatedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              .
            </p>
          )}
        </section>

        {/* Edit */}
        <section className="rounded-xl border border-beige/30 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-warm-dark">Head snippet</h2>
          <p className="mt-1 text-sm text-warm-gray">
            Paste the snippet from the ad network. Only script tags go into the head; anything else
            in the paste is left out and named below. Nothing is injected until you press Save.
          </p>

          <textarea
            value={headHtml}
            onChange={(e) => setHeadHtml(e.target.value)}
            spellCheck={false}
            rows={8}
            placeholder={'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0000000000000000" crossorigin="anonymous"></script>'}
            className="mt-4 w-full rounded-lg border border-beige/60 bg-cream/40 p-3 font-mono text-xs text-warm-dark outline-none focus:border-oxblood"
          />

          <div className="mt-4 rounded-lg border border-beige/40 bg-cream/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-taupe">
              What this will inject
            </p>
            {preview.ok ? (
              <pre className="mt-2 overflow-x-auto rounded bg-white p-3 text-xs leading-relaxed text-warm-dark">
                {preview.html}
              </pre>
            ) : (
              <p className="mt-2 text-sm text-warm-dark">
                {headHtml.trim()
                  ? "Nothing. What is in the box cannot be injected as it stands."
                  : "Nothing. The box is empty."}
              </p>
            )}
            {preview.problems.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                {preview.problems.map((problem, i) => (
                  <li key={i}>{problem}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="rounded-full bg-midnight px-6 py-2.5 text-sm font-medium text-soft-white transition hover:bg-oxblood disabled:opacity-50"
            >
              {busy ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={removeSnippet}
              disabled={busy || (!state.headHtml && !headHtml)}
              className="rounded-full border border-midnight/20 px-6 py-2.5 text-sm font-medium text-midnight transition hover:border-oxblood hover:text-oxblood disabled:opacity-40"
            >
              Remove the snippet
            </button>
          </div>

          {notice && (
            <p
              className={`mt-4 rounded-lg p-3 text-sm ${
                notice.kind === "ok"
                  ? "bg-green-50 text-green-800"
                  : notice.kind === "warn"
                    ? "bg-amber-50 text-amber-900"
                    : "bg-red-50 text-red-800"
              }`}
            >
              {notice.text}
            </p>
          )}
        </section>

        {/* ads.txt */}
        <section className="rounded-xl border border-beige/30 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-warm-dark">ads.txt</h2>
          <p className="mt-1 text-sm text-warm-gray">
            The publisher ID from the ad network, for example pub-1234567890123456. While this is
            empty, no ads.txt is served at all - there is no placeholder line.
          </p>

          <input
            value={publisherId}
            onChange={(e) => setPublisherId(e.target.value)}
            spellCheck={false}
            placeholder="pub-1234567890123456"
            className="mt-4 w-full rounded-lg border border-beige/60 bg-cream/40 p-3 font-mono text-sm text-warm-dark outline-none focus:border-oxblood"
          />

          <div className="mt-4 rounded-lg border border-beige/40 bg-cream/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-taupe">
              What /ads.txt serves
            </p>
            {previewAdsTxt ? (
              <pre className="mt-2 overflow-x-auto rounded bg-white p-3 text-xs leading-relaxed text-warm-dark">
                {previewAdsTxt.trimEnd()}
              </pre>
            ) : (
              <p className="mt-2 text-sm text-warm-dark">
                Nothing. /ads.txt answers 404 until a publisher ID is saved.
              </p>
            )}
            {idLooksWrong && (
              <p className="mt-2 text-sm text-amber-800">
                That is not a publisher ID. It has to be pub- followed by 16 digits, so nothing
                would be served.
              </p>
            )}
          </div>

          <p className="mt-3 text-xs text-taupe">
            Saved with the button above, together with the head snippet.
          </p>
        </section>
      </main>
    </div>
  );
}
