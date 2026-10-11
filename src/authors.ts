import { Username } from "./friends";

const RESERVED = new Set([
  "accounts",
  "about",
  "direct",
  "explore",
  "reel",
  "reels",
  "p",
  "stories",
  "settings",
  "your_activity",
  "legal",
  "privacy",
  "web",
  "challenge",
  "checkpoint",
  "oauth",
]);
export function profileName(path: string): string | undefined {
  const raw = /^\/([^/]+)\/?$/.exec(path)?.[1];
  const parsed = Username.safeParse(raw);
  return parsed.success && !RESERVED.has(parsed.data) ? parsed.data : undefined;
}
export function articleAuthor(article: Element): string | undefined {
  // Read a semantic header or the author region before the first post media.
  // Links after the media (captions/comments) cannot grant access.
  const header = article.querySelector("header");
  const media = Array.from(article.querySelectorAll("img,video")).find(
    (node) => {
      const link = node.closest<HTMLAnchorElement>("a[href]");
      return (
        !link ||
        !profileName(new URL(link.href, article.ownerDocument.baseURI).pathname)
      );
    },
  );
  if (!header && !media) return undefined;
  const names = new Set<string>();
  for (const link of (header ?? article).querySelectorAll<HTMLAnchorElement>(
    "a[href]",
  )) {
    if (
      !header &&
      media &&
      !(link.compareDocumentPosition(media) & Node.DOCUMENT_POSITION_FOLLOWING)
    )
      continue;
    const url = new URL(link.href, article.ownerDocument.baseURI);
    if (url.origin !== new URL(article.ownerDocument.baseURI).origin) continue;
    const name = profileName(url.pathname);
    if (name && link.textContent?.trim().toLowerCase() === name)
      names.add(name);
  }
  return names.size === 1 ? [...names][0] : undefined;
}
