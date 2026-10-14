import { POSTS, profileName } from "./authors";
import { mediaId, mediaOwner } from "./policy";

function linkKind(link: HTMLAnchorElement): string {
  const url = new URL(link.href, link.ownerDocument.baseURI);
  if (url.origin !== new URL(link.ownerDocument.baseURI).origin)
    return "external";
  if (mediaId(url.pathname))
    return mediaOwner(url.pathname) ? "owned-post" : "post";
  if (profileName(url.pathname)) return "profile";
  if (url.pathname.startsWith("/stories/")) return "story";
  return "other";
}
function describe(node: Element) {
  const tag = node.tagName.toLowerCase();
  const role = node.getAttribute("role") ?? "none";
  const style = node.ownerDocument.defaultView?.getComputedStyle(node);
  const rect = node.getBoundingClientRect();
  const links = Array.from(node.querySelectorAll<HTMLAnchorElement>("a[href]"));
  return {
    tag: [
      "div",
      "article",
      "section",
      "main",
      "header",
      "a",
      "body",
      "html",
    ].includes(tag)
      ? tag
      : "other",
    role: [
      "none",
      "main",
      "article",
      "feed",
      "list",
      "listitem",
      "button",
      "tabpanel",
      "grid",
    ].includes(role)
      ? role
      : "other",
    displayNone: style?.display === "none",
    visibilityHidden: style?.visibility === "hidden",
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    hiddenByFilter: node.hasAttribute("data-instagram-focus-surface-hidden"),
    approved: node.hasAttribute("data-instagram-friends-approved"),
    namedProfileLink: hasNamedProfileLink(node),
    images: node.querySelectorAll("img").length,
    videos: node.querySelectorAll("video").length,
    headers: node.querySelectorAll("header").length,
    profileLinks: links.filter((link) => linkKind(link) === "profile").length,
    barePostLinks: links.filter((link) => linkKind(link) === "post").length,
    ownedPostLinks: links.filter((link) => linkKind(link) === "owned-post")
      .length,
  };
}

function hasNamedProfileLink(node: Element): boolean {
  return Array.from(node.querySelectorAll<HTMLAnchorElement>("a[href]")).some(
    (link) => {
      if (linkKind(link) !== "profile") return false;
      const name = profileName(
        new URL(link.href, node.ownerDocument.baseURI).pathname,
      );
      return !!name && link.textContent?.trim().toLowerCase() === name;
    },
  );
}

// Only fixed labels, booleans and counts leave the page; never serialize DOM or URLs.
export function layoutReport(doc: Document, path: string) {
  const version = doc.documentElement.getAttribute(
    "data-instagram-focus-installed",
  );
  const articles = Array.from(doc.querySelectorAll(POSTS));
  const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>("a[href]"));
  const posts = links.filter((link) =>
    ["post", "owned-post"].includes(linkKind(link)),
  );
  const roots = new Set<Element>();
  for (const node of [
    ...posts,
    ...doc.querySelectorAll("main img,[role=main] img"),
  ]) {
    if (node.parentElement) roots.add(node.parentElement);
    if (roots.size === 3) break;
  }
  const samples = Array.from(roots).map((root) => {
    const chain = [];
    for (
      let node: Element | null = root;
      node && chain.length < 6;
      node = node.parentElement
    )
      chain.push(describe(node));
    return chain;
  });
  return {
    diagnostic: 1,
    installed:
      version === null
        ? "absent"
        : /^\d+\.\d+\.\d+$/.test(version)
          ? version
          : "unknown",
    route:
      path === "/"
        ? "home"
        : profileName(path)
          ? "profile"
          : mediaId(path)
            ? "post"
            : "other",
    counts: {
      main: doc.querySelectorAll("main,[role=main]").length,
      articles: articles.length,
      articlesWithNamedProfileLink: articles.filter(hasNamedProfileLink).length,
      postLinks: posts.length,
      ownedPostLinks: posts.filter((link) => linkKind(link) === "owned-post")
        .length,
      images: doc.querySelectorAll("img").length,
      videos: doc.querySelectorAll("video").length,
      hidden: doc.querySelectorAll("[data-instagram-focus-surface-hidden]")
        .length,
      approved: doc.querySelectorAll("[data-instagram-friends-approved]")
        .length,
      pending: doc.querySelectorAll("[data-instagram-friends-pending]").length,
      status: doc.querySelectorAll("[data-instagram-friends-status]").length,
    },
    samples,
  };
}
