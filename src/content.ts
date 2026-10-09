import { FILTER_CSS, filterLinks } from "./filter";
import { createPanel } from "./panel";
import { INBOX, isAuthPath, isDistractionPath, shouldRedirect } from "./policy";

const KEY = "instagram-focus-posting-v1";
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
  style.textContent = FILTER_CSS;
  document.documentElement.append(style);
  let panel: HTMLElement | undefined;
  let lastPath = "";
  let scheduled = false;
  function sync(): void {
    scheduled = false;
    const path = location.pathname;
    if (shouldRedirect(path, posting)) {
      document.documentElement.setAttribute(ROOT, "redirecting");
      location.replace(INBOX);
      return;
    }
    const auth = isAuthPath(path);
    const state = auth || posting ? "off" : "on";
    if (document.documentElement.getAttribute(ROOT) !== state)
      document.documentElement.setAttribute(ROOT, state);
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
        onMessages: () => {
          if (!savePosting(false)) return false;
          location.assign(INBOX);
          return true;
        },
        onPosting: () => {
          if (!savePosting(true)) return false;
          location.assign("/");
          return true;
        },
      });
      document.body.append(panel);
    }
    filterLinks(document, posting);
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
        location.assign(INBOX);
      }
    },
    true,
  );
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"],
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
