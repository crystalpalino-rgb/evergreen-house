/**
 * Head snippet parsing and sanitising.
 *
 * The owner pastes an ad snippet (an AdSense loader, or anything similar) into
 * the admin screen. This module turns whatever she pasted into the exact list of
 * script tags that go into the document head, and refuses anything that could
 * break the page.
 *
 * It is pure: no database, no React, no DOM. The admin screen runs it on every
 * keystroke so she can see what is about to be injected, and the root route runs
 * it again on every server render, so a stored value can never put markup in the
 * head that this function would not have produced itself.
 *
 * The rules, in plain terms:
 *  - Only <script> tags are injected. Anything else she pastes is left out and
 *    named back to her.
 *  - A script file must be an https:// address. An http:// or relative one is
 *    refused, because it cannot load on the live site.
 *  - Only a short list of attributes survives (src, async, defer, crossorigin,
 *    type, id, integrity, referrerpolicy, charset, nomodule). Anything else,
 *    including event handlers, is dropped.
 *  - A snippet that is truncated (an unclosed <script) is refused whole, because
 *    half a tag in the head is exactly the kind of paste that breaks a page.
 */

/** Pastes bigger than this are refused outright. */
export const MAX_SNIPPET_BYTES = 20_000;
/** More script tags than this are refused outright. */
export const MAX_SCRIPTS = 10;

const ALLOWED_ATTRS = new Set([
  "src",
  "async",
  "defer",
  "crossorigin",
  "type",
  "id",
  "integrity",
  "referrerpolicy",
  "charset",
  "nomodule",
]);

/** Attributes with no value of their own. */
const BOOLEAN_ATTRS = new Set(["async", "defer", "nomodule"]);

const SAFE_VALUE_RE = /^[A-Za-z0-9._:@/+=-]+$/;

const SCRIPT_SOURCE = String.raw`<script\b([^>]*)>([\s\S]*?)<\/script\s*>`;
const ATTR_SOURCE =
  "([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s\"'=<>`]+)))?";

export interface HeadScript {
  /** Attributes exactly as they will be rendered. */
  attrs: Record<string, string | boolean>;
  /** Inline code, when the script has no src. */
  body: string | null;
}

export interface HeadSnippetResult {
  /** True when at least one script tag will be injected. */
  ok: boolean;
  /** Exactly what the head injection renders, in order. */
  scripts: HeadScript[];
  /** The same thing as HTML text, for the "what is live" panel. */
  html: string;
  /** Plain sentences for the owner. Empty when nothing was refused. */
  problems: string[];
  /** Size of the paste, in bytes. */
  bytes: number;
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function renderScriptHtml(script: HeadScript): string {
  const attrs = Object.entries(script.attrs)
    .map(([name, value]) => (value === true ? name : `${name}="${String(value).replace(/"/g, "&quot;")}"`))
    .join(" ");
  const open = attrs ? ` ${attrs}` : "";
  return script.body ? `<script${open}>${script.body}</script>` : `<script${open}></script>`;
}

/**
 * Parse a pasted snippet into the exact script tags that will be injected.
 * Never throws: a paste it cannot make sense of comes back as `ok: false` with
 * the reason in `problems`, and nothing is injected.
 */
export function parseHeadSnippet(raw: string | null | undefined): HeadSnippetResult {
  const input = typeof raw === "string" ? raw : "";
  const bytes = byteLength(input);
  const problems: string[] = [];
  const scripts: HeadScript[] = [];

  const refuse = (): HeadSnippetResult => ({ ok: false, scripts: [], html: "", problems, bytes });

  if (!input.trim()) return { ok: false, scripts: [], html: "", problems, bytes };

  if (bytes > MAX_SNIPPET_BYTES) {
    problems.push(
      `That paste is ${Math.round(bytes / 1024)} KB. The limit is ${MAX_SNIPPET_BYTES / 1024} KB, so nothing was injected.`,
    );
    return refuse();
  }

  let leftover = input;
  let match: RegExpExecArray | null;
  const scriptRe = new RegExp(SCRIPT_SOURCE, "gi");

  while ((match = scriptRe.exec(input)) !== null) {
    const full = match[0];
    const attrText = match[1] ?? "";
    const bodyText = match[2] ?? "";
    leftover = leftover.replace(full, "");

    if (scripts.length >= MAX_SCRIPTS) {
      problems.push(`That paste has more than ${MAX_SCRIPTS} script tags, so nothing was injected.`);
      return refuse();
    }

    const attrs: Record<string, string | boolean> = {};
    let refused = false;
    let attrMatch: RegExpExecArray | null;
    const attrRe = new RegExp(ATTR_SOURCE, "g");

    while ((attrMatch = attrRe.exec(attrText)) !== null) {
      const name = (attrMatch[1] ?? "").toLowerCase();
      const value = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";

      if (!ALLOWED_ATTRS.has(name)) {
        problems.push(`The attribute "${name}" on a script is not allowed, so it was left out.`);
        continue;
      }

      if (BOOLEAN_ATTRS.has(name)) {
        attrs[name] = true;
        continue;
      }

      if (name === "src") {
        let url: URL | null = null;
        try {
          url = new URL(value.trim());
        } catch {
          url = null;
        }
        if (!url || url.protocol !== "https:") {
          problems.push(
            `A script file has to be a full https:// address. "${value.trim().slice(0, 80) || "(empty)"}" is not, so that script was left out.`,
          );
          refused = true;
          break;
        }
        attrs.src = url.toString();
        continue;
      }

      if (name === "crossorigin") {
        const mode = value.trim().toLowerCase();
        if (mode && mode !== "anonymous" && mode !== "use-credentials") {
          problems.push(`The crossorigin value "${mode}" is not valid, so it was left out.`);
          continue;
        }
        attrs.crossorigin = mode || "anonymous";
        continue;
      }

      if (!SAFE_VALUE_RE.test(value.trim())) {
        problems.push(`The value of "${name}" is not allowed, so it was left out.`);
        continue;
      }
      attrs[name] = value.trim();
    }

    if (refused) continue;

    const hasSrc = typeof attrs.src === "string";
    const body = bodyText.trim() ? bodyText : "";

    if (!hasSrc && !body.trim()) {
      problems.push("A script tag with no file and no code was left out.");
      continue;
    }

    if (!hasSrc && byteLength(body) > MAX_SNIPPET_BYTES) {
      problems.push("The inline code in that script is too long, so nothing was injected.");
      return refuse();
    }

    scripts.push({ attrs, body: hasSrc ? null : body });
  }

  // Anything left over that still looks like a script tag means the paste was
  // cut short (an opening tag with no </script>). Refuse the whole paste: a
  // half-open tag in the head is what breaks a page.
  if (/<script\b/i.test(leftover)) {
    problems.push(
      "A script tag in that paste was never closed with </script>, so nothing was injected. Paste the snippet again in full.",
    );
    return refuse();
  }

  // Everything else that is not a script tag is left out and named back to her.
  const markup = leftover
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
  if (markup) {
    const first = markup.slice(0, 60).replace(/\s+/g, " ");
    problems.push(
      `Only script tags go in the head. This was left out: "${first}${markup.length > 60 ? "..." : ""}".`,
    );
  }

  const html = scripts.map(renderScriptHtml).join("\n");

  if (!scripts.length) return { ok: false, scripts: [], html: "", problems, bytes };

  return { ok: true, scripts, html, problems, bytes };
}

/**
 * The HTML the head injection renders, as text, for the owner to read back.
 * Returns "" when nothing is injected.
 */
export function headSnippetHtml(result: HeadSnippetResult): string {
  return result.ok ? result.html : "";
}
