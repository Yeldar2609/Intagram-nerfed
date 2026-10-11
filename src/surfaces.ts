import { articleAuthor, profileName } from "./authors";
import { type Friends, maySeePosts } from "./friends";
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
  friends: Friends | undefined,
): void {
  const hidden = new Set<Element>();
  const home = path === "/";
  const search = /^\/explore(?:\/|$)/i.test(path);
  const native =
    /^\/(?:direct|stories|accounts|challenge|checkpoint|oauth)(?:\/|$)/i.test(
      path,
    );
  const approved = new Set<Element>();
  const profile = profileName(path);
  if (!native) {
    for (const article of doc.querySelectorAll("article")) {
      const grid =
        !!profile &&
        !!article.closest('[role="tabpanel"]') &&
        !article.querySelector("header") &&
        !articleAuthor(article);
      article.toggleAttribute("data-instagram-friends-grid", grid);
      const allow =
        !search &&
        maySeePosts(articleAuthor(article), friends) &&
        !/\bSponsored\b/i.test(
          article.querySelector("header")?.textContent ?? "",
        );
      if (allow) approved.add(article);
      else if (!grid) hidden.add(article);
      article.toggleAttribute("data-instagram-friends-approved", allow);
    }
    for (const main of doc.querySelectorAll(MAIN)) {
      for (const link of main.querySelectorAll<HTMLAnchorElement>("a[href]")) {
        if (!mediaId(new URL(link.href, doc.baseURI).pathname)) continue;
        const allow =
          !!link.closest("article[data-instagram-friends-approved]") ||
          (!!profile &&
            maySeePosts(profile, friends) &&
            !!link.closest('[role="tabpanel"]') &&
            !link.closest("article:not([data-instagram-friends-grid]),aside"));
        link.toggleAttribute("data-instagram-friends-approved", allow);
        if (!allow) hidden.add(link);
      }
      if (profile || mediaId(path)) {
        // Keep the profile header (including Follow) while hiding unknown grid layouts.
        for (const media of main.querySelectorAll("img,video")) {
          if (
            !media.closest("[data-instagram-friends-approved]") &&
            !(profile && media.closest("header"))
          )
            hidden.add(media);
        }
      }
    }
  }
  if (home) {
    for (const main of doc.querySelectorAll(MAIN)) {
      const stories = Array.from(main.querySelectorAll(STORIES)).filter(
        (story) => !story.closest('article, [role="feed"]'),
      );
      const controls = Array.from(
        main.querySelectorAll(
          'header,nav,[role="navigation"],[role="search"],[role="searchbox"],[role="listbox"]',
        ),
      ).filter((node) => !node.closest('article,[role="feed"]'));
      const keep = [...stories, ...approved, ...controls];
      function keepStories(node: Element): void {
        if (keep.some((story) => story === node)) return;
        for (const child of node.children) {
          if (keep.some((story) => child.contains(story))) keepStories(child);
          else hidden.add(child);
        }
      }
      keepStories(main);
      main.setAttribute(READY, "");
    }
  }
  if (search) {
    for (const main of doc.querySelectorAll(MAIN)) {
      for (const media of main.querySelectorAll("img,video")) {
        const link = media.closest<HTMLAnchorElement>("a[href]");
        const url = link ? new URL(link.href, doc.baseURI) : undefined;
        const avatar =
          media.tagName === "IMG" &&
          url &&
          url.origin === new URL(doc.baseURI).origin &&
          profileName(url.pathname) &&
          !media.closest("article");
        if (!avatar) hidden.add(media);
      }
    }
  }
  const id = mediaId(path);
  if (hasMediaView(doc, path)) {
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
        if (
          primary?.contains(video) &&
          !Array.from(hidden).some((node) => node.contains(video))
        )
          continue;
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
  for (const video of doc.querySelectorAll("video"))
    if (video.closest(`[${HIDDEN}]`) && !video.paused) video.pause();
  if (!home)
    for (const node of doc.querySelectorAll(`[${READY}]`))
      node.removeAttribute(READY);
}

export const SURFACE_CSS = `
html[data-instagram-focus="on"] [data-instagram-friends-status] {font:inherit;line-height:1.4;margin:12px auto;padding:0 16px;max-width:600px;box-sizing:border-box;overflow-wrap:anywhere;color:inherit}
html[data-instagram-focus="on"] [${HIDDEN}] { display: none !important; }
html[data-instagram-focus-view="home"] :is(main,[role="main"]):not([${READY}]) { visibility: hidden !important; }
html[data-instagram-focus="on"]:not([data-instagram-friends-native]) article:not([data-instagram-friends-approved]):not([data-instagram-friends-grid]) { display: none !important; }
html[data-instagram-focus="on"]:not([data-instagram-friends-native]) :is(main,[role="main"]) a:is([href^="/p/"],[href^="/reel/"],[href^="/reels/"]):not([data-instagram-friends-approved]) { display: none !important; }
html[data-instagram-focus-view="media"], html[data-instagram-focus-view="media"] body { overflow: hidden !important; overscroll-behavior: none !important; }
html[data-instagram-focus-view="media"] :is(main,[role="main"],[role="dialog"]) { overflow: hidden !important; overscroll-behavior: none !important; }
html[data-instagram-focus-view="media"] video { max-height: 80dvh !important; object-fit: contain !important; }
`;
