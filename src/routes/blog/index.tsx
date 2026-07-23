import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";
import { SITE_URL } from "~/lib/schema";
import { getBlogPosts, deleteBlogPost, type BlogPost } from "~/lib/blog";

export const Route = createFileRoute("/blog/")({
  head: () => {
    const seo = generateStaticMetadata(
      "Blog",
      "Curated home inspiration, styling guides, and editor finds from Evergreen House.",
      "/blog"
    );
    return { meta: seo.meta, links: seo.links };
  },
  loader: async () => {
    try {
      const posts = await getBlogPosts();
      return { posts };
    } catch (err) {
      console.error("Blog loader error:", err);
      return { posts: [] as BlogPost[] };
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
  return plain.slice(0, maxLen).replace(/\s+\S*$/, "") + "\u2026";
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
  const { posts: initialPosts } = Route.useLoaderData();
  const [posts, setPosts] = useState(initialPosts);
  const [deleting, setDeleting] = useState<number | null>(null);
  const isAdmin =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("admin") === "true";

  const handleDelete = async (postId: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(postId);
    const result = await deleteBlogPost({ data: postId });
    setDeleting(null);
    if (result.success) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } else {
      alert(result.error || "Failed to delete post");
    }
  };

  return (
    <>
      <main>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog" },
          ]}
        />
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
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-sans text-xs font-medium uppercase tracking-[0.25em] text-taupe sm:text-sm">
                Curated Inspiration
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
        <section className="bg-cream py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-beige/30 bg-white px-8 py-10 text-center shadow-sm">
                <p className="text-lg text-warm-gray">No posts yet.</p>
                <p className="mt-2 text-sm text-taupe">
                  Check back soon for curated home inspiration and editor finds.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <div key={post.id} className="relative">
                    <Link
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
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(post.id, post.title);
                        }}
                        disabled={deleting === post.id}
                        className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-rose-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 disabled:opacity-50"
                        title="Delete post"
                        aria-label={`Delete "${post.title}"`}
                      >
                        {deleting === post.id ? (
                          <span className="text-xs">\u2026</span>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
