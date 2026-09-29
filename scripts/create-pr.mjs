const TOKEN = process.argv[2];
const r = await fetch("https://api.github.com/repos/crystalpalino-rgb/evergreen-house/pulls", {
  method: "POST",
  headers: { Authorization: `token ${TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "fix: remove global canonical, add per-route self-referencing canonicals",
    head: "fix/canonical-url-seo",
    base: "main",
    body: "Removes global canonical from __root.tsx that was causing every page to have conflicting canonicals. Fixes lifestyle/index.tsx head export. Deduplicates sitemap. Adds blog posts to sitemap."
  })
});
const pr = await r.json();
if (pr.html_url) console.log(pr.html_url);
else { console.error(JSON.stringify(pr)); process.exit(1); }
