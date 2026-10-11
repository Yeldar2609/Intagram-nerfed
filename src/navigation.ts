import { profileName } from "./authors";
import type { Friends } from "./friends";
import { makeSurface } from "./ui";
export function createNavigation(doc: Document): HTMLElement {
  return makeSurface(
    doc,
    "instagram-friends-nav",
    `<style>
    :host {position:fixed;bottom:0;left:0;right:0;z-index:2147483646;background:var(--bg);border-top:var(--stroke) solid var(--line);padding-bottom:env(safe-area-inset-bottom)}
    nav {display:flex;max-width:var(--content-width);margin:auto} nav a {flex:1;display:flex;align-items:center;justify-content:center;min-height:var(--control-height);padding:var(--s2);font-size:var(--small);text-decoration:none}
    [aria-disabled=true] {color:var(--muted)} p {font-size:var(--small);text-align:center;margin:0;padding:var(--s1) var(--s3)} p:empty {display:none}
    </style><p id="status" role="status" aria-live="polite"></p><nav aria-label="Instagram navigation"><a href="/">Home</a><a href="/direct/inbox/">Messages</a><a href="/#user-search">Search</a><a id="profile" aria-disabled="true">Profile</a></nav>`,
  ).host;
}
export function updateNavigation(
  host: HTMLElement,
  friends: Friends,
  status: string,
): void {
  const profile = host.shadowRoot?.querySelector("#profile");
  if (friends.owner) {
    profile?.setAttribute("href", `/${friends.owner}/`);
    profile?.removeAttribute("aria-disabled");
  } else {
    profile?.removeAttribute("href");
    profile?.setAttribute("aria-disabled", "true");
  }
  const text = host.shadowRoot?.querySelector("#status");
  if (text && text.textContent !== status) text.textContent = status;
}
export function createSearch(doc: Document): HTMLElement {
  const { host, root } = makeSurface(
    doc,
    "instagram-user-search",
    `<div class="page"><a href="/">← Back to Instagram</a><h1>Find a person</h1><p>Enter their exact username to open their profile and follow them.</p><form><label for="username">Instagram username</label><input id="username" autocapitalize="none" autocomplete="off" spellcheck="false" required maxlength="31" placeholder="@username"><button class="primary" type="submit">Open profile</button><p id="error" role="alert"></p></form><p class="small">Posts appear only for mutual friends and your own profile. Follow-back checks update automatically.</p></div>`,
  );
  const input = root.querySelector<HTMLInputElement>("input");
  const error = root.querySelector("#error");
  root.querySelector("form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = profileName(`/${input?.value.trim().replace(/^@/, "")}/`);
    if (!username) {
      if (error)
        error.textContent =
          "Enter a valid username, not a name or website address.";
      return;
    }
    doc.defaultView?.location.assign(`/${username}/`);
  });
  return host;
}
