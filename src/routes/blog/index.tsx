import { createFileRoute, Link } from "@tanstack/react-router";

const SITE_URL = "https://0d599363fbd89e6841be5df43ade6f22.ctonew.app";

// ── Types ──
interface PublishedPost {
  id: number;
  title: string;
  content: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Evergreen House" },
      { name: "description", content: "Curated home inspiration, styling guides, and editor finds from Evergreen House." },
      { property: "og:title", content: "Blog — Evergreen House" },
      { property: "og:description", content: "Curated home inspiration, styling guides, and editor finds from Evergreen House." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/blog` },
      { property: "og:site_name", content: "Evergreen House" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Blog — Evergreen House" },
      { name: "twitter:description", content: "Curated home inspiration, styling guides, and editor finds from Evergreen House." },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/blog` }],
  }),
  loader: async () => {
    try {
      const baseUrl = typeof window !== "undefined" ? "" : "http://localhost:3000";
      const resp = await fetch(`${baseUrl}/api/blog-posts`);
      const data = await resp.json();
      return { posts: data.posts as PublishedPost[] };
    } catch (err) {
      console.error("Blog loader error:", err);
      return { posts: [] as PublishedPost[] };
    }
  },
  component: BlogIndex,
});

function excerpt(content: string | null, maxLen = 150): string {
  if (!content) return "";
  const plain = content
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogIndex() {
  const { posts } = Route.useLoaderData();

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/images/kitchen.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-white/50" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-sans text-xs font-medium uppercase tracking-[0.25em] text-taupe sm:text-sm">
              The Journal
            </p>
            <h1 className="mt-6 font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">
              The Journal
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-warm-gray sm:text-xl">
              Curated home inspiration, styling guides, and editor finds.
            </p>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="bg-cream py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-beige/30 bg-white px-8 py-16 text-center shadow-sm">
              <p className="text-lg text-warm-gray">No posts yet.</p>
              <p className="mt-2 text-sm text-taupe">
                Generate some in the{" "}
                <a href="/marketing" className="font-medium text-terracotta underline hover:text-terracotta-dark">
                  Marketing Dashboard
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to="/blog/$postId"
                  params={{ postId: String(post.id) }}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-beige/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-md block"
                >
                  <div className="p-6 sm:p-7">
                    <h2 className="font-serif text-lg font-semibold leading-snug text-warm-dark group-hover:text-terracotta transition-colors">
                      {post.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-warm-gray line-clamp-3">
                      {excerpt(post.content)}
                    </p>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wide text-taupe">
                      {formatDate(post.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
