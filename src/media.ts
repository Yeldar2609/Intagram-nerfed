import { isAuthPath, mediaId } from "./policy";

export function hasMediaView(doc: Document, path: string): boolean {
  return (
    !/^\/stories(?:\/|$)/i.test(path) &&
    (!!mediaId(path) || !!doc.querySelector('[role="dialog"] video'))
  );
}

export function selectedMediaItem(doc: Document, path: string): Element | null {
  const scope =
    doc.querySelector('[role="dialog"]') ??
    doc.querySelector('main, [role="main"]');
  const id = mediaId(path);
  const selected = id
    ? Array.from(scope?.querySelectorAll("article") ?? []).find((article) =>
        Array.from(article.querySelectorAll<HTMLAnchorElement>("a[href]")).some(
          (link) => mediaId(new URL(link.href, doc.baseURI).pathname) === id,
        ),
      )
    : undefined;
  return (
    selected ??
    scope?.querySelector("article") ??
    scope?.querySelector("video") ??
    null
  );
}

export function installMediaGuard(isPosting: () => boolean): void {
  const active = () =>
    !isPosting() &&
    !isAuthPath(location.pathname) &&
    hasMediaView(document, location.pathname);
  const block = (event: Event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  for (const name of ["wheel", "touchmove"] as const) {
    window.addEventListener(
      name,
      (event) => {
        if (active()) block(event);
      },
      { capture: true, passive: false },
    );
  }
  window.addEventListener(
    "keydown",
    (event) => {
      if (!active() || !(event.target instanceof Element)) return;
      if (event.target.closest('input, textarea, [contenteditable="true"]'))
        return;
      if (
        [
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        block(event);
    },
    true,
  );
  window.addEventListener(
    "click",
    (event) => {
      if (!active() || !(event.target instanceof Element)) return;
      const control = event.target.closest(
        '[aria-label="Next reel" i], [aria-label="Previous reel" i], [aria-label="Next video" i]',
      );
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      const url = link ? new URL(link.href, location.href) : undefined;
      if (
        control ||
        (url?.origin === location.origin &&
          mediaId(url.pathname) &&
          mediaId(url.pathname) !== mediaId(location.pathname))
      )
        block(event);
    },
    true,
  );
  // Also stop programmatic scrolling of nested video rails.
  window.addEventListener(
    "scroll",
    (event) => {
      if (!active()) return;
      const target =
        event.target === document ? document.scrollingElement : event.target;
      if (target instanceof Element && target.scrollTop !== 0)
        target.scrollTop = 0;
    },
    true,
  );
  window.addEventListener(
    "ended",
    (event) => {
      if (active() && event.target instanceof HTMLVideoElement)
        event.stopImmediatePropagation();
    },
    true,
  );
  window.addEventListener(
    "play",
    (event) => {
      if (!active() || !(event.target instanceof HTMLVideoElement)) return;
      const selected = selectedMediaItem(document, location.pathname);
      if (selected && !selected.contains(event.target)) {
        event.target.pause();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
}
