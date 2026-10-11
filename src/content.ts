import { articleAuthor, profileName } from "./authors";
import { FILTER_CSS, filterLinks } from "./filter";
import { createFriendApi } from "./friend-api";
import { FriendChecks } from "./friend-checks";
import { viewerId } from "./friends";
import { hasMediaView, installMediaGuard } from "./media";
import { createNavigation, createSearch, updateNavigation } from "./navigation";
import { HOME, isAuthPath, isDistractionPath, singlePostPath } from "./policy";
import { filterSurfaces, SURFACE_CSS } from "./surfaces";

const ROOT = "data-instagram-focus";
const INSTALLED = "data-instagram-focus-installed";
function start(): void {
  if (document.documentElement.hasAttribute(INSTALLED)) return;
  document.documentElement.setAttribute(INSTALLED, "0.3.0");
  const style = document.createElement("style");
  style.textContent =
    FILTER_CSS +
    SURFACE_CSS +
    `
    html[data-instagram-focus="on"]:not([data-instagram-friends-native]) body {padding-bottom:calc(96px + env(safe-area-inset-bottom))!important}
    html[data-instagram-friends-page] body > :not(instagram-user-search):not(script):not(style) {display:none!important}
    html[data-instagram-friends-page] body {margin:0!important;padding:0!important;background:#101114!important;overflow:auto!important}
    html[data-instagram-friends-page] {overflow:auto!important}
  `;
  document.documentElement.append(style);
  let scheduled = false;
  let lockedPost: string | undefined;
  let navigation: HTMLElement | undefined;
  let page: HTMLElement | undefined;
  const checks = new FriendChecks(createFriendApi(location.origin), schedule);
  installMediaGuard(() => !!page);
  function sync(): void {
    scheduled = false;
    const path = location.pathname;
    const auth = isAuthPath(path);
    const native = /^\/(direct|stories)(\/|$)/.test(path);
    const special = !auth && path === HOME && location.hash === "#user-search";
    if (isDistractionPath(path)) {
      document.documentElement.setAttribute(ROOT, "redirecting");
      location.replace(path.startsWith("/explore") ? "/#user-search" : HOME);
      return;
    }
    const media = !auth && !special && hasMediaView(document, path);
    const post = singlePostPath(path);
    if (!media) lockedPost = undefined;
    if (media) lockedPost ??= post ?? path;
    if (post && (post !== lockedPost || /^\/reels?\//i.test(path))) {
      document.documentElement.setAttribute(ROOT, "redirecting");
      location.replace(lockedPost ?? post);
      return;
    }
    const names =
      auth || native || special
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
    if (!auth && !native && !special) void checks.tick(Date.now());
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
    document.documentElement.toggleAttribute(
      "data-instagram-friends-page",
      special,
    );
    if (page && !special) {
      page.remove();
      page = undefined;
    }
    if (document.body && special && !page) {
      page = createSearch(document);
      document.body.append(page);
    }
    if (auth || special || native) {
      navigation?.remove();
      navigation = undefined;
    } else if (document.body && !navigation?.isConnected) {
      navigation = createNavigation(document);
      document.body.append(navigation);
    }
    if (navigation)
      updateNavigation(navigation, friends, checks.status(Date.now()));
    if (!auth && !special) {
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
        location.assign("/#user-search");
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
