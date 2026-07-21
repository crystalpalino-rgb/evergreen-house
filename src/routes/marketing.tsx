import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  getDashboardData,
  generateDraft,
  getDrafts,
  approveDraft,
  deleteDraft,
  runAgent,
  getAgentSummary,
  ensureMarketingTable,
  type DashboardStats,
  type MarketingTask,
  type AgentSummary,
} from "~/lib/marketing";

export const Route = createFileRoute("/marketing")({
  loader: async () => {
    try {
      await ensureMarketingTable();
      const data = await getDashboardData();
      const drafts = await getDrafts({ data: {} });
      return { ...data, initialDrafts: drafts };
    } catch (err: any) {
      console.error("Marketing loader error:", err);
      return {
        stats: {
          totalProducts: 0,
          productsByRoom: [],
          averageRating: 0,
          productCountBySeason: [],
          totalDrafts: 0,
          pendingDrafts: 0,
          approvedDrafts: 0,
        } as DashboardStats,
        priorityTasks: [],
        recentDrafts: [],
        contentGaps: [],
        initialDrafts: [] as MarketingTask[],
      };
    }
  },
  component: MarketingDashboard,
});

function MarketingDashboard() {
  const loaderData = Route.useLoaderData();
  const [stats, setStats] = useState(loaderData.stats);
  const [priorityTasks, setPriorityTasks] = useState(loaderData.priorityTasks);
  const [drafts, setDrafts] = useState(loaderData.initialDrafts);
  const [contentGaps, setContentGaps] = useState(loaderData.contentGaps);
  const [loading, setLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [generateChannel, setGenerateChannel] = useState<"blog" | "pinterest" | "email">("blog");
  const [generateTopic, setGenerateTopic] = useState("");
  const [generateKeywords, setGenerateKeywords] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [toast, setToast] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");

  // Agent summary state
  const [agentSummary, setAgentSummary] = useState<AgentSummary | null>(null);
  const autoRunRef = useRef(false);

  const refreshDashboard = async () => {
    setLoading(true);
    try {
      const [data, draftList] = await Promise.all([
        getDashboardData(),
        getDrafts({ data: {} }),
      ]);
      setStats(data.stats);
      setPriorityTasks(data.priorityTasks);
      setDrafts(draftList);
      setContentGaps(data.contentGaps);
    } catch (err: any) {
      setStatusMsg("Error refreshing: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshAgentSummary = async () => {
    try {
      const summary = await getAgentSummary();
      setAgentSummary(summary);
    } catch (_) {
      // Silently fail — summary is informational
    }
  };

  // Auto-run agent on load if 0 pending drafts
  useEffect(() => {
    if (autoRunRef.current) return;
    autoRunRef.current = true;

    const pending = loaderData.stats.pendingDrafts ?? 0;
    if (pending === 0 && (loaderData.initialDrafts?.length ?? 0) === 0) {
      setAgentLoading(true);
      runAgent()
        .then((result) => {
          setDrafts(result.generated);
          setToast(result.summary);
          refreshDashboard();
          refreshAgentSummary();
        })
        .catch((err) => {
          console.error("Auto-run agent failed:", err);
        })
        .finally(() => setAgentLoading(false));
    } else {
      // Still refresh summary for display
      refreshAgentSummary();
    }
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleGenerate = async () => {
    setLoading(true);
    setStatusMsg("");
    try {
      const draft = await generateDraft({
        data: { channel: generateChannel, topic: generateTopic || undefined, keywords: generateKeywords || undefined },
      });
      setDrafts((prev) => [draft, ...prev]);
      setStatusMsg(`Draft generated: "${draft.title}"`);
      setGenerateTopic("");
      setGenerateKeywords("");
      refreshAgentSummary();
    } catch (err: any) {
      setStatusMsg("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAgent = async () => {
    setAgentLoading(true);
    setStatusMsg("");
    setToast("");
    try {
      const result = await runAgent();
      // Prepend generated drafts to the queue
      setDrafts((prev) => [...result.generated, ...prev]);
      setToast(result.summary);
      await refreshDashboard();
      await refreshAgentSummary();
    } catch (err: any) {
      setStatusMsg("Agent error: " + err.message);
    } finally {
      setAgentLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setLoading(true);
    try {
      const updated = await approveDraft({ data: id });
      setDrafts((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setStatusMsg("Draft approved!");
      refreshDashboard();
      refreshAgentSummary();
    } catch (err: any) {
      setStatusMsg("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this draft?")) return;
    setLoading(true);
    try {
      await deleteDraft({ data: id });
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      setStatusMsg("Draft deleted.");
      refreshDashboard();
      refreshAgentSummary();
    } catch (err: any) {
      setStatusMsg("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: number) => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/marketing/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error ?? "Publish failed");
      const updated = await resp.json();
      setDrafts((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setStatusMsg("Post published! It's now live on the blog.");
      refreshDashboard();
      refreshAgentSummary();
    } catch (err: any) {
      setStatusMsg("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrafts = drafts.filter((d) => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (filterChannel !== "all" && d.channel !== filterChannel) return false;
    return true;
  });

  const channelColors: Record<string, string> = {
    blog: "bg-blue-100 text-blue-800",
    pinterest: "bg-red-100 text-red-800",
    email: "bg-green-100 text-green-800",
  };

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    review: "bg-purple-100 text-purple-800",
    approved: "bg-green-100 text-green-800",
    published: "bg-blue-100 text-blue-800",
  };

  // Format relative time for last agent run
  const formatLastRun = (iso: string | null): string => {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  const formatRoomList = (rooms: string[]): string => {
    if (!rooms || rooms.length === 0) return "various rooms";
    return rooms
      .map((r) => {
        const names: Record<string, string> = {
          "living-room": "Living Room",
          bedroom: "Bedroom",
          kitchen: "Kitchen",
          bathroom: "Bathroom",
          patio: "Patio",
          office: "Office",
          entryway: "Entryway",
          laundry: "Laundry",
          storage: "Storage",
        };
        return names[r] ?? r;
      })
      .join(", ");
  };

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Header */}
      <header className="border-b border-beige/30 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-warm-dark">
              Marketing Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-warm-gray">AI Marketing Agent & Content Strategy</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshDashboard}
              disabled={loading}
              className="rounded-lg border border-beige/40 px-4 py-2 text-sm text-warm-dark transition hover:bg-cream-dark disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
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
        {/* Toast */}
        {toast && (
          <div className="mb-6 animate-pulse rounded-lg border border-sage/40 bg-sage/10 px-4 py-3 text-sm font-medium text-sage-dark">
            🤖 {toast}
            <button
              onClick={() => setToast("")}
              className="ml-3 text-taupe hover:text-warm-dark"
            >
              Dismiss
            </button>
          </div>
        )}

        {statusMsg && (
          <div className="mb-6 rounded-lg border border-beige/50 bg-cream-dark px-4 py-3 text-sm text-warm-dark">
            {statusMsg}
            <button
              onClick={() => setStatusMsg("")}
              className="ml-3 text-taupe hover:text-warm-dark"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Agent Summary Panel ── */}
        <section className="mb-8">
          <div className="rounded-xl border border-beige/30 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-lg font-semibold text-warm-dark">
                  🤖 Marketing Agent
                </h2>
                <p className="mt-1 text-sm text-warm-gray">
                  The agent analyzes priorities and generates drafts for you automatically.
                </p>
              </div>
              <button
                onClick={handleRunAgent}
                disabled={agentLoading}
                className="rounded-lg bg-terracotta px-6 py-3 text-sm font-semibold text-white transition hover:bg-terracotta-dark disabled:opacity-50 shadow-sm"
              >
                {agentLoading ? "Agent Running..." : "🚀 Run Marketing Agent"}
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              <AgentStat
                label="Last Agent Run"
                value={formatLastRun(agentSummary?.lastRun ?? null)}
              />
              <AgentStat
                label="Drafts This Week"
                value={String(agentSummary?.draftsThisWeek ?? "—")}
              />
              <AgentStat
                label="Approval Rate"
                value={agentSummary ? `${agentSummary.approvalRate}%` : "—"}
              />
              <AgentStat
                label="Last Focus"
                value={
                  agentSummary?.lastRunRooms?.length
                    ? formatRoomList(agentSummary.lastRunRooms)
                    : "—"
                }
              />
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-lg font-semibold text-warm-dark">Overview</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <StatCard label="Total Products" value={stats.totalProducts} />
            <StatCard label="Avg Rating" value={stats.averageRating.toFixed(1) + "★"} />
            <StatCard label="Total Drafts" value={stats.totalDrafts} />
            <StatCard label="Pending" value={stats.pendingDrafts} />
            <StatCard label="Approved" value={stats.approvedDrafts} />
            <StatCard label="Content Gaps" value={contentGaps.length} />
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Priority Tasks + Content Gaps */}
          <div className="lg:col-span-1 space-y-6">
            {/* Priority Tasks */}
            <section>
              <h2 className="mb-3 font-serif text-lg font-semibold text-warm-dark">
                Priority Tasks
              </h2>
              <div className="space-y-2">
                {priorityTasks.length === 0 ? (
                  <p className="rounded-lg border border-beige/30 bg-white px-4 py-6 text-center text-sm text-warm-gray">
                    No priority tasks yet. Generate some drafts to get started.
                  </p>
                ) : (
                  priorityTasks.map((task: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-lg border border-beige/30 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0 rounded-full bg-terracotta/10 px-2 py-0.5 text-xs font-medium text-terracotta">
                          {task.type === "content_gap"
                            ? "Gap"
                            : task.type === "high_value"
                              ? "Feature"
                              : "Seasonal"}
                        </span>
                        <div>
                          <h3 className="text-sm font-medium text-warm-dark">{task.title}</h3>
                          <p className="mt-1 text-xs text-warm-gray">{task.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Room Distribution */}
            <section>
              <h2 className="mb-3 font-serif text-lg font-semibold text-warm-dark">
                Products by Room
              </h2>
              <div className="rounded-lg border border-beige/30 bg-white p-4 shadow-sm">
                <div className="space-y-2">
                  {stats.productsByRoom.map((r: any) => (
                    <div key={r.room} className="flex items-center justify-between">
                      <span className="text-sm text-warm-dark capitalize">
                        {r.room.replace(/-/g, " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-cream-dark">
                          <div
                            className="h-full rounded-full bg-sage transition-all"
                            style={{
                              width: `${Math.min(100, (r.count / Math.max(...stats.productsByRoom.map((x: any) => x.count))) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="w-6 text-right text-xs text-warm-gray">{r.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Seasonal Analysis */}
            <section>
              <h2 className="mb-3 font-serif text-lg font-semibold text-warm-dark">
                Seasonal Keywords
              </h2>
              <div className="rounded-lg border border-beige/30 bg-white p-4 shadow-sm">
                <div className="space-y-2">
                  {stats.productCountBySeason.map((s: any) => (
                    <div key={s.season} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-warm-dark">{s.season}</span>
                      <span className="text-sm text-warm-gray">
                        {s.count} product{s.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Draft Generator + Draft Queue */}
          <div className="lg:col-span-2 space-y-6">
            {/* Draft Generator */}
            <section>
              <h2 className="mb-3 font-serif text-lg font-semibold text-warm-dark">
                Manual Draft Generator
              </h2>
              <div className="rounded-lg border border-beige/30 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-warm-gray">
                      Channel
                    </label>
                    <select
                      value={generateChannel}
                      onChange={(e) =>
                        setGenerateChannel(e.target.value as "blog" | "pinterest" | "email")
                      }
                      className="rounded-lg border border-beige/40 bg-cream px-3 py-2 text-sm text-warm-dark focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
                    >
                      <option value="blog">Blog Post</option>
                      <option value="pinterest">Pinterest Pin</option>
                      <option value="email">Email Newsletter</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-warm-gray">
                      Topic or Room (optional)
                    </label>
                    <input
                      type="text"
                      value={generateTopic}
                      onChange={(e) => setGenerateTopic(e.target.value)}
                      placeholder="e.g., living room, cozy fall finds, kitchen refresh"
                      className="w-full rounded-lg border border-beige/40 bg-cream px-3 py-2 text-sm text-warm-dark placeholder:text-taupe focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
                    />
                  </div>
                  {generateChannel === "pinterest" && (
                    <div className="w-full">
                      <label className="mb-1 block text-xs font-medium text-warm-gray">
                        AI Keywords (one per line)
                      </label>
                      <textarea
                        value={generateKeywords}
                        onChange={(e) => setGenerateKeywords(e.target.value)}
                        placeholder={`e.g.\nmodern farmhouse\nneutral decor\ntimeless home finds`}
                        rows={3}
                        className="w-full rounded-lg border border-beige/40 bg-cream px-3 py-2 text-sm text-warm-dark placeholder:text-taupe focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
                      />
                      <p className="mt-1 text-xs text-taupe">
                        Keywords help the AI include relevant search terms in pin titles and descriptions for better Pinterest discoverability.
                      </p>
                    </div>
                  )}
                  <div className="flex items-end">
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="rounded-lg bg-terracotta px-5 py-2 text-sm font-medium text-white transition hover:bg-terracotta-dark disabled:opacity-50"
                    >
                      {loading ? "Generating..." : "Generate Draft"}
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-xs text-warm-gray">
                  Drafts use real product data from the database. They appear in the review queue
                  below — they are never auto-published.
                </p>
              </div>
            </section>

            {/* Draft Queue */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-warm-dark">Draft Queue</h2>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-lg border border-beige/40 bg-white px-2 py-1 text-xs text-warm-dark"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                  </select>
                  <select
                    value={filterChannel}
                    onChange={(e) => setFilterChannel(e.target.value)}
                    className="rounded-lg border border-beige/40 bg-white px-2 py-1 text-xs text-warm-dark"
                  >
                    <option value="all">All Channels</option>
                    <option value="blog">Blog</option>
                    <option value="pinterest">Pinterest</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>

              {filteredDrafts.length === 0 ? (
                <div className="rounded-lg border border-beige/30 bg-white px-6 py-12 text-center shadow-sm">
                  <p className="text-warm-gray">No drafts yet.</p>
                  <p className="mt-1 text-sm text-taupe">
                    Use the agent or manual generator above to create your first draft.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDrafts.map((draft) => (
                    <DraftCard
                      key={draft.id}
                      draft={draft}
                      onApprove={handleApprove}
                      onPublish={handlePublish}
                      onDelete={handleDelete}
                      loading={loading}
                      channelColor={channelColors[draft.channel] ?? "bg-gray-100 text-gray-800"}
                      statusColor={statusColors[draft.status] ?? "bg-gray-100 text-gray-800"}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function AgentStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-beige/20 bg-cream/50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-taupe">{label}</p>
      <p className="mt-1 text-sm font-semibold text-warm-dark">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-beige/30 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-taupe">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-warm-dark">{value}</p>
    </div>
  );
}

function DraftCard({
  draft,
  onApprove,
  onPublish,
  onDelete,
  loading,
  channelColor,
  statusColor,
}: {
  draft: MarketingTask;
  onApprove: (id: number) => void;
  onPublish: (id: number) => void;
  onDelete: (id: number) => void;
  loading: boolean;
  channelColor: string;
  statusColor: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const channelLabels: Record<string, string> = {
    blog: "Blog Post",
    pinterest: "Pinterest Pin",
    email: "Email Newsletter",
  };

  const handleCopyLink = async () => {
    if (!draft.destination_link) return;
    const base = window.location.origin;
    const fullUrl = `${base}${draft.destination_link}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = fullUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-lg border border-beige/30 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${channelColor}`}>
              {channelLabels[draft.channel] ?? draft.channel}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
              {draft.status}
            </span>
            {draft.priority <= 3 && (
              <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-xs font-medium text-terracotta">
                Priority
              </span>
            )}
          </div>
          <h3 className="font-serif text-base font-medium text-warm-dark">{draft.title}</h3>
          {draft.rationale && (
            <p className="mt-1 text-xs text-taupe italic">{draft.rationale}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {draft.status !== "approved" && draft.status !== "published" && (
            <button
              onClick={() => onApprove(draft.id)}
              disabled={loading}
              className="rounded-lg bg-sage px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sage-dark disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {draft.status === "approved" && draft.channel === "blog" && (
            <button
              onClick={() => onPublish(draft.id)}
              disabled={loading}
              className="rounded-lg bg-terracotta px-3 py-1.5 text-xs font-medium text-white transition hover:bg-terracotta-dark disabled:opacity-50"
            >
              Publish
            </button>
          )}
          {draft.status === "published" && (
            <span className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-800">
              Published
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg border border-beige/40 px-3 py-1.5 text-xs text-warm-dark transition hover:bg-cream-dark"
          >
            {expanded ? "Collapse" : "Preview"}
          </button>
          <button
            onClick={() => onDelete(draft.id)}
            disabled={loading}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {expanded && draft.content && (
        <div className="mt-4 border-t border-beige/20 pt-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-warm-dark">
            {draft.content}
          </pre>
          {draft.product_ids && draft.product_ids.length > 0 && (
            <p className="mt-3 text-xs text-taupe">
              Products referenced: {draft.product_ids.length}
            </p>
          )}
          {draft.destination_link && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-sage/30 bg-sage/5 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-taupe">
                  Destination Link
                </p>
                <p className="mt-0.5 text-sm font-medium text-warm-dark truncate">
                  {draft.destination_link}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="flex-shrink-0 rounded-lg bg-warm-dark px-4 py-2 text-xs font-medium text-white transition hover:opacity-90"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
          <p className="mt-3 text-xs text-warm-gray">
            Created: {new Date(draft.created_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
