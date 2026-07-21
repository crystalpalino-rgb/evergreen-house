import { createFileRoute, Link } from "@tanstack/react-router";
const SITE_URL = "https://0d599363fbd89e6841be5df43ade6f22.ctonew.app";
interface BlogPost {
  id: number;
  title: string;
  content: string | null;
  channel: string;
  status: string;
  created_at: string;
  updated_at: string;
}
export const Route = createFileRoute("/blog/$postId")({
  head: ({ loaderData }) => {
    const post = (loaderData as any)?.post as BlogPost | null;
    const postExcerpt = post?.content
      ? post.content.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\n/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
      : "";
    return {
      meta: [
        { title: post ? `${post.title} — Evergreen House` : "Post Not Found — Evergreen House" },
        { name: "description", content: postExcerpt || "A blog post from Evergreen House." },
        { property: "og:title", content: post ? post.title : "Post Not Found" },
        { property: "og:description", content: postExcerpt || "A blog post from Evergreen House." },
        { property: "og:type", content: "article" },
        { property: "og:url", content: post ? `${SITE_URL}/blog/${post.id}` : SITE_URL },
        { property: "og:site_name", content: "Evergreen House" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: post ? post.title : "Post Not Found" },
        { name: "twitter:description", content: postExcerpt || "A blog post from Evergreen House." },
      ],
      links: post ? [{ rel: "canonical", href: `${SITE_URL}/blog/${post.id}` }] : [],
    };
  },
  loader: async ({ params }) => {
    try {
      const id = parseInt(params.postId, 10);
      if (isNaN(id)) return { post: null };
      const baseUrl = typeof window !== "undefined" ? "" : "http://localhost:3000";
      const resp = await fetch(`${baseUrl}/api/blog-post?id=${id}`);
      const data = await resp.json();
      return { post: data.post as BlogPost | null };
    } catch (err) {
      console.error("Blog post loader error:", err);
      return { post: null };
    }
  },
  component: BlogPostPage,
});
function renderContent(content: string): string {
  let html = content
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-terracotta underline decoration-beige/40 underline-offset-2 hover:text-terracotta-dark" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Strip markdown heading and list markers from each line
  html = html
    .split(/\n/)
    .map((line) => {
      line = line.replace(/^###\s+/, "");
      line = line.replace(/^##\s+/, "");
      line = line.replace(/^#\s+/, "");
      line = line.replace(/^-\s+/, "");
      return line;
    })
    .join("\n");
  html = html
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      return `<p class="mb-5 leading-relaxed">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
  return html;
}
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function BackArrow() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function BlogPostPage() {
  const { post } = Route.useLoaderData();
  return (
    <main>
      <article className="bg-cream py-12 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-taupe transition-colors hover:text-terracotta"
          >
            <BackArrow />
            Back to Blog
          </Link>
          {!post ? (
            <div className="mt-12 rounded-2xl border border-beige/30 bg-white px-8 py-16 text-center shadow-sm">
              <h1 className="font-serif text-2xl font-semibold text-warm-dark">Post Not Found</h1>
              <p className="mt-3 text-warm-gray">
                This post may not be published yet or doesn't exist.
              </p>
              <Link
                to="/blog"
                className="mt-6 inline-block rounded-full bg-terracotta px-6 py-2.5 text-sm font-medium text-white transition hover:bg-terracotta-dark"
              >
                Browse all posts
              </Link>
            </div>
          ) : (
            <>
              <header className="mb-10">
                <h1 className="font-serif text-3xl font-bold leading-tight text-warm-dark sm:text-4xl lg:text-5xl">
                  {post.title}
                </h1>
                <p className="mt-4 text-sm font-medium uppercase tracking-wide text-taupe">
                  {formatDate(post.created_at)}
                </p>
              </header>
              <div
                className="prose-custom text-base leading-relaxed text-warm-dark sm:text-lg"
                dangerouslySetInnerHTML={{ __html: renderContent(post.content ?? "") }}
              />
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    headline: post.title,
                    description: (post.content ?? "").replace(/\*\*(.*?)\*\*/g, "$1").slice(0, 160),
                    datePublished: post.created_at,
                    dateModified: post.updated_at,
                    author: { "@type": "Organization", name: "Evergreen House" },
                    publisher: { "@type": "Organization", name: "Evergreen House", url: SITE_URL },
                    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${post.id}` },
                  }),
                }}
              />
              <div className="mt-16 border-t border-beige/30 pt-8">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-taupe transition-colors hover:text-terracotta"
                >
                  <BackArrow />
                  Back to all posts
                </Link>
              </div>
            </>
          )}
        </div>
      </article>
    </main>
  );
}
