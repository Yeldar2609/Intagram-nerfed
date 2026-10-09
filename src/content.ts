import { FILTER_CSS, filterLinks } from "./filter";
import { hasMediaView, installMediaGuard } from "./media";
import { createPanel } from "./panel";
import {
  HOME,
  INBOX,
  isAuthPath,
  isDistractionPath,
  shouldRedirect,
  singlePostPath,
} from "./policy";
import { filterSurfaces, SURFACE_CSS } from "./surfaces";

const KEY = "instagram-focus-posting-v2";
const ROOT = "data-instagram-focus";
const INSTALLED = "data-instagram-focus-installed";

function start(): void {
  if (document.documentElement.hasAttribute(INSTALLED)) return;
  document.documentElement.setAttribute(INSTALLED, "");
  let posting = false;
  try {
    posting = sessionStorage.getItem(KEY) === "true";
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
  }

  function savePosting(value: boolean): boolean {
    try {
      sessionStorage.setItem(KEY, String(value));
      posting = value;
      return true;
    } catch (error) {
      if (!(error instanceof DOMException)) throw error;
      return false;
    }
  }
  const style = document.createElement("style");
  style.textContent = FILTER_CSS + SURFACE_CSS;
  document.documentElement.append(style);
  let panel: HTMLElement | undefined;
  let lastPath = "";
  let scheduled = false;
  let lockedPost: string | undefined;
  function changeMode(value: boolean, path: string): boolean {
    if (!savePosting(value)) return false;
    if (location.pathname === path) {
      panel?.remove();
      panel = undefined;
      sync();
    } else location.assign(path);
    return true;
  }
  installMediaGuard(() => posting);
  function sync(): void {
    scheduled = false;
    const path = location.pathname;
    const media = !posting && !isAuthPath(path) && hasMediaView(document, path);
    const post = posting ? undefined : singlePostPath(path);
    if (!media) lockedPost = undefined;
    if (media) lockedPost ??= post ?? path;
    if (post) {
      if (post !== lockedPost || /^\/reels?\//i.test(path)) {
        document.documentElement.setAttribute(ROOT, "redirecting");
        location.replace(lockedPost ?? post);
        return;
      }
    }
    if (shouldRedirect(path, posting)) {
      document.documentElement.setAttribute(ROOT, "redirecting");
      location.replace(HOME);
      return;
    }
    const auth = isAuthPath(path);
    const state = auth || posting ? "off" : "on";
    if (document.documentElement.getAttribute(ROOT) !== state)
      document.documentElement.setAttribute(ROOT, state);
    const view =
      state === "off"
        ? "off"
        : media
          ? "media"
          : path === HOME
            ? "home"
            : "other";
    document.documentElement.setAttribute("data-instagram-focus-view", view);
    if (auth) {
      panel?.remove();
      panel = undefined;
      lastPath = path;
      return;
    }
    if (document.body && (!panel?.isConnected || lastPath !== path)) {
      panel?.remove();
      panel = createPanel(document, {
        posting,
        onHome: () => changeMode(false, HOME),
        onMessages: () => changeMode(false, INBOX),
        onPosting: () => changeMode(true, HOME),
      });
      document.body.append(panel);
    }
    filterLinks(document, posting);
    filterSurfaces(document, path, posting);
    lastPath = path;
  }
  function schedule(): void {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sync);
  }
  document.addEventListener(
    "click",
    (event) => {
      if (
        posting ||
        isAuthPath(location.pathname) ||
        !(event.target instanceof Element)
      )
        return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (url.origin === location.origin && isDistractionPath(url.pathname)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        location.assign(HOME);
      }
    },
    true,
  );
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href", "aria-label", "role"],
  });
  window.addEventListener("popstate", schedule);
  window.addEventListener("pageshow", schedule);
  document.addEventListener("visibilitychange", schedule);
  // Instagram uses history APIs in its own JavaScript realm. Poll only the path
  // to cover SPA transitions even when no observable DOM mutation accompanies them.
  window.setInterval(() => {
    if (lastPath !== location.pathname) schedule();
  }, 500);
  sync();
}
if (document.documentElement) start();
else document.addEventListener("DOMContentLoaded", start, { once: true });
