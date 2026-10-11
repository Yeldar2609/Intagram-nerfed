import { articleAuthor, profileName } from "./authors";
import { FILTER_CSS, filterLinks } from "./filter";
import { createFriendApi } from "./friend-api";
import { FriendChecks } from "./friend-checks";
import { viewerId } from "./friends";
import { hasMediaView, installMediaGuard } from "./media";
import { HOME, isAuthPath, isDistractionPath, singlePostPath } from "./policy";
import { filterSurfaces, SURFACE_CSS } from "./surfaces";

const ROOT = "data-instagram-focus";
const INSTALLED = "data-instagram-focus-installed";
function start(): void {
  if (document.documentElement.hasAttribute(INSTALLED)) return;
  document.documentElement.setAttribute(INSTALLED, "0.3.1");
  const style = document.createElement("style");
  style.textContent = FILTER_CSS + SURFACE_CSS;
  document.documentElement.append(style);
  let scheduled = false;
  let lockedPost: string | undefined;
  let status: HTMLElement | undefined;
  const checks = new FriendChecks(
    createFriendApi(location.origin, () => document.cookie),
    schedule,
  );
  installMediaGuard(() => false);
  function sync(): void {
    scheduled = false;
    const path = location.pathname;
    const auth = isAuthPath(path);
    const native = /^\/(direct|stories)(\/|$)/.test(path);
    const search = /^\/explore(?:\/|$)/i.test(path);
    if (path === HOME && location.hash === "#user-search") {
      location.replace("/explore/search/");
      return;
    }
    if (isDistractionPath(path)) {
      document.documentElement.setAttribute(ROOT, "redirecting");
      location.replace(HOME);
      return;
    }
    const media = !auth && !search && hasMediaView(document, path);
    const post = singlePostPath(path);
    if (!media) lockedPost = undefined;
    if (media) lockedPost ??= post ?? path;
    if (post && (post !== lockedPost || /^\/reels?\//i.test(path))) {
      document.documentElement.setAttribute(ROOT, "redirecting");
      location.replace(lockedPost ?? post);
      return;
    }
    const names =
      auth || native || search
        ? []
        : Array.from(document.querySelectorAll("article"))
            .map(articleAuthor)
            .filter((name): name is string => !!name);
    const profile = profileName(path);
    if (profile) names.unshift(profile);
    checks.update(
      auth ? undefined : viewerId(document.cookie),
      names,
      Date.now(),
    );
    if (!auth && !native && !search) void checks.tick(Date.now());
    const friends = checks.snapshot(Date.now());
    document.documentElement.setAttribute(ROOT, auth ? "off" : "on");
    document.documentElement.toggleAttribute(
      "data-instagram-friends-native",
      native,
    );
    document.documentElement.setAttribute(
      "data-instagram-focus-view",
      auth
        ? "off"
        : media
          ? "media"
          : path === HOME
            ? "home"
            : native
              ? "native"
              : "other",
    );
    const message = auth || native || search ? "" : checks.status(Date.now());
    const main = document.querySelector("main,[role=main]");
    if (message && main) {
      if (!status?.isConnected) {
        status = document.createElement("p");
        status.setAttribute("data-instagram-friends-status", "");
        status.setAttribute("role", "status");
        main.before(status);
      }
      if (status.textContent !== message) status.textContent = message;
    } else {
      status?.remove();
      status = undefined;
    }
    if (!auth) {
      filterLinks(document);
      filterSurfaces(document, path, friends);
    }
  }
  function schedule(): void {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sync);
  }
  document.addEventListener(
    "click",
    (event) => {
      if (isAuthPath(location.pathname) || !(event.target instanceof Element))
        return;
      const profile = profileName(location.pathname);
      const control = event.target.closest("button,[role=button]");
      if (
        profile &&
        control &&
        /\bfollow(?:ing)?\b|unfollow/i.test(control.textContent ?? "")
      ) {
        // Recheck after Instagram's mutation settles, then again for confirmation dialogs.
        for (const delay of [1500, 5000])
          window.setTimeout(() => {
            checks.invalidate(profile);
            schedule();
          }, delay);
      }
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
    characterData: true,
    attributes: true,
    attributeFilter: ["href", "aria-label", "role", "src"],
  });
  for (const event of ["popstate", "hashchange", "pageshow"])
    window.addEventListener(event, schedule);
  document.addEventListener("visibilitychange", schedule);
  window.setInterval(() => {
    if (!document.hidden) schedule();
  }, 1000);
  sync();
}
if (document.documentElement) start();
else document.addEventListener("DOMContentLoaded", start, { once: true });
