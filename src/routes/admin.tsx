import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface ProductSummary {
  id: number;
  name: string;
  fullName: string | null;
  room: string;
  price: number | null;
  rating: number | null;
  completenessScore: number;
  qualityScore: number;
  imageUrl: string | null;
  aiSummary: string | null;
  editorNote: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface LowQualityProduct extends ProductSummary {
  seoTitle?: string | null;
  pinterestTitle?: string | null;
  issues: string[];
}

interface AdminSummary {
  totalProducts: number;
  activeProducts: number;
  avgCompleteness: number;
  avgQuality: number;
  missingImages: number;
  missingSEO: number;
  missingAI: number;
  missingPinterest: number;
  collections: number;
  collectionRules: number;
  recentlyAdded: ProductSummary[];
  needsAttention: ProductSummary[];
}

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

const ROOM_LABELS: Record<string, string> = {
  "living-room": "Living Room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  patio: "Patio / Outdoor",
  storage: "Storage",
  laundry: "Laundry",
  entryway: "Entryway",
  organization: "Organization",
  "dining-room": "Dining Room",
  "home-office": "Home Office",
};

function roomLabel(room: string): string {
  return ROOM_LABELS[room] ?? room.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  return `$${price.toFixed(0)}`;
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  let color = "bg-red-100 text-red-800";
  if (score >= 80) color = "bg-green-100 text-green-800";
  else if (score >= 60) color = "bg-yellow-100 text-yellow-800";
  else if (score >= 40) color = "bg-orange-100 text-orange-800";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}: {score}
    </span>
  );
}

function MetricsCard({
  label,
  value,
  sub,
  colorClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
}) {
  return (
    <div className="rounded-xl border border-beige/30 bg-white p-5 shadow-sm editorial-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-taupe">{label}</p>
      <p className={`mt-1 font-serif text-3xl font-semibold ${colorClass ?? "text-warm-dark"}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-warm-gray">{sub}</p>}
    </div>
  );
}

function ProgressBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs font-medium text-warm-dark">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-cream-dark">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-warm-gray">{pct}%</span>
    </div>
  );
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [lowQuality, setLowQuality] = useState<LowQualityProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [sumResp, lqResp] = await Promise.all([
        fetch("/api/admin/summary"),
        fetch("/api/admin/low-quality"),
      ]);
      if (!sumResp.ok) throw new Error("Summary fetch failed: " + (await sumResp.text()));
      if (!lqResp.ok) throw new Error("Low-quality fetch failed: " + (await lqResp.text()));
      const sumData = await sumResp.json();
      const lqData = await lqResp.json();
      setSummary(sumData);
      setLowQuality(lqData.products ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalProducts = summary?.totalProducts ?? 0;

  // Content coverage calculations
  const withSEO = totalProducts - (summary?.missingSEO ?? 0);
  const withPinterest = totalProducts - (summary?.missingPinterest ?? 0);
  const withAI = totalProducts - (summary?.missingAI ?? 0);
  const withImages = totalProducts - (summary?.missingImages ?? 0);

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Header */}
      <header className="border-b border-beige/30 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-warm-dark">
              Intelligence Layer
            </h1>
            <p className="mt-0.5 text-sm text-warm-gray">
              Evergreen House product quality &amp; health metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="rounded-lg border border-beige/40 px-4 py-2 text-sm text-warm-dark transition hover:bg-cream-dark disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
            <a
              href="/"
              className="rounded-lg bg-warm-dark px-4 py-2 text-sm text-white transition hover:opacity-90"
            >
              View Site
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
            <button onClick={() => setError("")} className="ml-3 underline">
              Dismiss
            </button>
          </div>
        )}

        {loading && !summary && (
          <div className="py-20 text-center">
            <p className="text-lg text-taupe animate-pulse">Loading Intelligence Layer...</p>
          </div>
        )}

        {summary && (
          <>
            {/* ── Top: Metrics Cards ── */}
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-lg font-semibold text-warm-dark">Overview</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                <MetricsCard label="Total Products" value={summary.totalProducts} />
                <MetricsCard label="Active" value={summary.activeProducts} />
                <MetricsCard
                  label="Avg Completeness"
                  value={summary.avgCompleteness}
                  sub="%"
                  colorClass={
                    summary.avgCompleteness >= 80
                      ? "text-sage"
                      : summary.avgCompleteness >= 60
                        ? "text-terracotta"
                        : "text-red-600"
                  }
                />
                <MetricsCard
                  label="Avg Quality"
                  value={summary.avgQuality}
                  sub="/ 10"
                  colorClass={
                    summary.avgQuality >= 8
                      ? "text-sage"
                      : summary.avgQuality >= 6
                        ? "text-terracotta"
                        : "text-red-600"
                  }
                />
                <MetricsCard label="Collections" value={summary.collections} />
                <MetricsCard label="Rules" value={summary.collectionRules} />
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* ── Left: Data Health ── */}
              <div className="lg:col-span-2 space-y-8">
                {/* Needs Attention */}
                <section>
                  <h2 className="mb-3 font-serif text-lg font-semibold text-warm-dark">
                    Products Needing Attention
                  </h2>
                  {summary.needsAttention.length === 0 ? (
                    <div className="rounded-xl border border-beige/30 bg-white px-6 py-10 text-center shadow-sm editorial-card">
                      <p className="text-warm-gray">All products look healthy! 🎉</p>
                      <p className="mt-1 text-sm text-taupe">
                        Every product has images, AI content, and completeness ≥ 50.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {summary.needsAttention.slice(0, 8).map((p) => (
                        <div
                          key={p.id}
                          className="rounded-xl border border-beige/30 bg-white p-4 shadow-sm editorial-card"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-serif text-sm font-semibold text-warm-dark truncate">
                                  {p.name}
                                </h3>
                                <span className="rounded-full bg-cream-dark px-2 py-0.5 text-xs text-warm-gray">
                                  {roomLabel(p.room)}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <ScoreBadge score={p.completenessScore} label="Comp" />
                                <ScoreBadge score={p.qualityScore} label="Qual" />
                                {!p.imageUrl && (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                    No Image
                                  </span>
                                )}
                                {!p.aiSummary && (
                                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                                    No AI
                                  </span>
                                )}
                              </div>
                              {p.editorNote && (
                                <p className="mt-2 text-xs text-warm-gray line-clamp-1">
                                  {p.editorNote}
                                </p>
                              )}
                            </div>
                            <span className="flex-shrink-0 text-xs text-taupe">
                              {formatPrice(p.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {summary.needsAttention.length > 8 && (
                        <p className="text-center text-xs text-taupe">
                          +{summary.needsAttention.length - 8} more products need attention
                        </p>
                      )}
                    </div>
                  )}
                </section>

                {/* Recently Added / Updated */}
                <section>
                  <h2 className="mb-3 font-serif text-lg font-semibold text-warm-dark">
                    Recently Updated
                  </h2>
                  <div className="overflow-hidden rounded-xl border border-beige/30 bg-white shadow-sm editorial-card">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-beige/20 bg-cream-dark text-left">
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-taupe">
                            Product
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-taupe">
                            Room
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-taupe">
                            Price
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-taupe">
                            Comp
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-taupe">
                            Qual
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.recentlyAdded.map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-beige/10 transition hover:bg-cream/50"
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium text-warm-dark">{p.name}</span>
                              {p.updatedAt && (
                                <p className="text-xs text-taupe">
                                  {new Date(p.updatedAt).toLocaleDateString()}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-warm-gray">{roomLabel(p.room)}</td>
                            <td className="px-4 py-3 text-warm-gray">{formatPrice(p.price)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-medium ${
                                  p.completenessScore >= 80
                                    ? "text-sage"
                                    : p.completenessScore >= 60
                                      ? "text-terracotta"
                                      : "text-red-600"
                                }`}
                              >
                                {p.completenessScore}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-medium ${
                                  p.qualityScore >= 8
                                    ? "text-sage"
                                    : p.qualityScore >= 6
                                      ? "text-terracotta"
                                      : "text-red-600"
                                }`}
                              >
                                {p.qualityScore}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {summary.recentlyAdded.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-warm-gray">
                              No products yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* ── Right: Content Coverage + Low Quality ── */}
              <div className="space-y-8">
                {/* Content Coverage */}
                <section>
                  <h2 className="mb-3 font-serif text-lg font-semibold text-warm-dark">
                    Content Coverage
                  </h2>
                  <div className="rounded-xl border border-beige/30 bg-white p-5 shadow-sm editorial-card space-y-4">
                    <ProgressBar
                      label="With Images"
                      value={withImages}
                      total={totalProducts}
                      color="bg-sage"
                    />
                    <ProgressBar
                      label="With SEO"
                      value={withSEO}
                      total={totalProducts}
                      color="bg-beige"
                    />
                    <ProgressBar
                      label="With Pinterest"
                      value={withPinterest}
                      total={totalProducts}
                      color="bg-terracotta"
                    />
                    <ProgressBar
                      label="With AI"
                      value={withAI}
                      total={totalProducts}
                      color="bg-warm-dark"
                    />
                  </div>
                </section>

                {/* Low-Quality Products Quick View */}
                <section>
                  <h2 className="mb-3 font-serif text-lg font-semibold text-warm-dark">
                    Low Quality ({lowQuality.length})
                  </h2>
                  {lowQuality.length === 0 ? (
                    <div className="rounded-xl border border-beige/30 bg-white px-4 py-8 text-center shadow-sm editorial-card">
                      <p className="text-sm text-warm-gray">No low-quality products found.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {lowQuality.slice(0, 15).map((p) => (
                        <div
                          key={p.id}
                          className="rounded-lg border border-beige/20 bg-white p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-xs font-medium text-warm-dark truncate">{p.name}</p>
                            <span className="ml-2 flex-shrink-0 text-xs text-taupe">
                              {p.completenessScore}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {p.issues.map((issue) => {
                              const labels: Record<string, string> = {
                                "missing-image": "No Image",
                                "low-completeness": "Low Comp",
                                "missing-ai": "No AI",
                                "missing-seo": "No SEO",
                                "missing-pinterest": "No Pin",
                              };
                              return (
                                <span
                                  key={issue}
                                  className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700"
                                >
                                  {labels[issue] ?? issue}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
