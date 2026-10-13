import { Username } from "./friends";
export const POSTS = 'article,[role="article"],[data-instagram-friends-post]';

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
  "create",
]);
export function profileName(path: string): string | undefined {
  const raw = /^\/([^/]+)\/?$/.exec(path)?.[1];
  const parsed = Username.safeParse(raw);
  return parsed.success && !RESERVED.has(parsed.data) ? parsed.data : undefined;
}
export function postMedia(article: Element): Element | undefined {
  return Array.from(article.querySelectorAll("img,video")).find((node) => {
    const link = node.closest<HTMLAnchorElement>("a[href]");
    const path = link
      ? new URL(link.href, article.ownerDocument.baseURI).pathname
      : undefined;
    return (
      !path ||
      (!profileName(path) && !/^\/stories\/[a-z0-9._]+(?:\/|$)/i.test(path))
    );
  });
}
export function articleAuthor(article: Element): string | undefined {
  // Read a semantic header or the author region before the first post media.
  // Links after the media (captions/comments) cannot grant access.
  const header = article.querySelector("header");
  const media = postMedia(article);
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
    if (!name) continue;
    const label = link.cloneNode(true);
    if (!(label instanceof Element)) continue;
    for (const icon of label.querySelectorAll("svg,[aria-hidden=true]"))
      icon.remove();
    const avatar = link
      .querySelector("img")
      ?.getAttribute("alt")
      ?.toLowerCase();
    if (
      label.textContent?.trim().toLowerCase() === name ||
      avatar === `${name}'s profile picture` ||
      avatar === `${name}’s profile picture`
    )
      names.add(name);
  }
  return names.size === 1 ? [...names][0] : undefined;
}
