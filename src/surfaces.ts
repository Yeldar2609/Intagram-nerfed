import { hasMediaView, selectedMediaItem } from "./media";
import { mediaId } from "./policy";

const HIDDEN = "data-instagram-focus-surface-hidden";
const READY = "data-instagram-focus-home-ready";
const MAIN = 'main, [role="main"]';
// Keep native story controls, including Instagram's button-based story tray.
const STORIES =
  'a[href^="/stories/"], a[href^="https://www.instagram.com/stories/"], a[href^="https://instagram.com/stories/"], button[aria-label*="story" i], [role="button"][aria-label*="story" i]';

export function filterSurfaces(
  doc: Document,
  path: string,
  posting: boolean,
): void {
  const hidden = new Set<Element>();
  const home = !posting && path === "/";
  if (home) {
    for (const main of doc.querySelectorAll(MAIN)) {
      const stories = Array.from(main.querySelectorAll(STORIES)).filter(
        (story) => !story.closest('article, [role="feed"]'),
      );
      function keepStories(node: Element): void {
        if (stories.some((story) => story === node)) return;
        for (const child of node.children) {
          if (stories.some((story) => child.contains(story)))
            keepStories(child);
          else hidden.add(child);
        }
      }
      keepStories(main);
      main.setAttribute(READY, "");
    }
  }
  const id = posting ? undefined : mediaId(path);
  if (!posting && hasMediaView(doc, path)) {
    const scope =
      doc.querySelector('[role="dialog"]') ?? doc.querySelector(MAIN);
    if (scope) {
      const articles = Array.from(scope.querySelectorAll("article"));
      const selected =
        articles.find((article) =>
          Array.from(
            article.querySelectorAll<HTMLAnchorElement>("a[href]"),
          ).some(
            (link) => mediaId(new URL(link.href, doc.baseURI).pathname) === id,
          ),
        ) ?? articles[0];
      for (const article of articles)
        if (article !== selected) hidden.add(article);
      for (const link of scope.querySelectorAll<HTMLAnchorElement>("a[href]")) {
        const linkedId = mediaId(new URL(link.href, doc.baseURI).pathname);
        if (linkedId && linkedId !== id) hidden.add(link);
      }
      for (const button of scope.querySelectorAll(
        '[aria-label="Next reel" i], [aria-label="Previous reel" i], [aria-label="Next video" i]',
      ))
        hidden.add(button);
      const primary = selectedMediaItem(doc, path);
      for (const video of scope.querySelectorAll("video")) {
        if (primary?.contains(video)) continue;
        hidden.add(video);
        if (!video.paused) video.pause();
      }
    }
  }
  for (const node of doc.querySelectorAll(`[${HIDDEN}]`)) {
    if (!hidden.has(node)) node.removeAttribute(HIDDEN);
  }
  for (const node of hidden)
    if (!node.hasAttribute(HIDDEN)) node.setAttribute(HIDDEN, "");
  if (!home)
    for (const node of doc.querySelectorAll(`[${READY}]`))
      node.removeAttribute(READY);
}

export const SURFACE_CSS = `
html[data-instagram-focus="on"] [${HIDDEN}] { display: none !important; }
html[data-instagram-focus-view="home"] :is(main,[role="main"]):not([${READY}]) { visibility: hidden !important; }
html[data-instagram-focus-view="home"] :is(main,[role="main"]) :is(article,[role="feed"]) { display: none !important; }
html[data-instagram-focus-view="home"], html[data-instagram-focus-view="home"] body,
html[data-instagram-focus-view="media"], html[data-instagram-focus-view="media"] body { overflow: hidden !important; overscroll-behavior: none !important; }
html[data-instagram-focus-view="media"] :is(main,[role="main"],[role="dialog"]) { overflow: hidden !important; overscroll-behavior: none !important; }
html[data-instagram-focus-view="media"] video { max-height: 80dvh !important; object-fit: contain !important; }
`;
