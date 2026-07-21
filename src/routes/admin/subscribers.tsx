import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface Subscriber {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}

export const Route = createFileRoute("/admin/subscribers")({
  component: SubscriberList,
});

function SubscriberList() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/subscribers")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch subscribers");
        return res.json();
      })
      .then((data: Subscriber[]) => {
        setSubscribers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Header */}
      <header className="border-b border-beige/30 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-warm-dark">
              Subscribers
            </h1>
            <p className="mt-0.5 text-sm text-warm-gray">
              Email subscribers from the Evergreen House signup form
            </p>
          </div>
          <a
            href="/"
            className="rounded-lg bg-warm-dark px-4 py-2 text-sm text-white transition hover:opacity-90"
          >
            View Site
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Count */}
        {!loading && !error && (
          <p className="mb-6 font-serif text-lg text-warm-dark">
            {subscribers.length}{" "}
            {subscribers.length === 1 ? "subscriber" : "subscribers"}
          </p>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-warm-gray">Loading subscribers&hellip;</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-terracotta/30 bg-terracotta/5 px-6 py-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && subscribers.length === 0 && (
          <div className="rounded-xl border border-beige/30 bg-white px-6 py-16 text-center shadow-sm">
            <p className="font-serif text-lg text-warm-dark">
              No subscribers yet
            </p>
            <p className="mt-2 text-sm text-warm-gray">
              Subscribers will appear here once visitors sign up through the email form.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && subscribers.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-beige/30 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-beige/20 bg-cream-dark/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-taupe">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-taupe">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-taupe">
                    Date subscribed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/10">
                {subscribers.map((sub) => (
                  <tr
                    key={sub.id}
                    className="transition-colors hover:bg-cream-dark/30"
                  >
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-warm-dark">
                      {sub.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-warm-dark">
                      {sub.name || (
                        <span className="italic text-taupe">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-warm-gray">
                      {formatDate(sub.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
