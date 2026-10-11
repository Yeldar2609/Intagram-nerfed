// @vitest-environment happy-dom
import { afterEach, expect, test } from "vitest";
import { articleAuthor } from "../src/authors";

import { filterSurfaces } from "../src/surfaces";

const friends = {
  owner: "me",
  mutuals: ["friend"],
};
afterEach(() => {
  document.body.innerHTML = "";
});
function hidden(id: string): boolean {
  const node = document.getElementById(id);
  if (!node) throw new TypeError("Missing fixture");
  return !!node.closest("[data-instagram-focus-surface-hidden]");
}
test("Home shows mutual posts and excludes a followed-only author even when a friend comments", () => {
  // Given distinct authors and a misleading friend comment.
  document.body.innerHTML =
    '<main><article id="friend"><header><a href="/friend/">friend</a></header><img src="friend.jpg"></article><article id="stranger"><header><a href="/stranger/">stranger</a></header><img src="stranger.jpg"><a href="/friend/">friend</a></article><article id="unknown"><img></article></main>';
  // When the verified mutual list is applied.
  filterSurfaces(document, "/", friends);
  // Then only the mutual author is visible.
  expect(hidden("friend")).toBe(false);
  expect(hidden("stranger")).toBe(true);
  expect(hidden("unknown")).toBe(true);
});
test("recognizes the author before post media in div-based article layouts", () => {
  document.body.innerHTML =
    '<article><div><a href="/friend/"><img src="avatar.jpg"></a><a href="/friend/">friend</a></div><img src="post.jpg"><div><a href="/stranger/">stranger</a>comment</div></article>';
  const article = document.querySelector("article");
  if (!article) throw new TypeError("Missing fixture");
  expect(articleAuthor(article)).toBe("friend");
});
test("profile retains Follow but hides nonmutual posts", () => {
  document.body.innerHTML =
    '<main><header><h1>stranger</h1><button id="follow">Follow</button></header><div role="tabpanel"><a id="post" href="/p/stranger/"><img></a></div></main>';
  filterSurfaces(document, "/stranger/", friends);
  expect(hidden("follow")).toBe(false);
  expect(hidden("post")).toBe(true);
});
test.each([
  "me",
  "friend",
])("allows %s profile grid while hiding out-of-grid recommendations", (name) => {
  document.body.innerHTML =
    '<main><header><h1>Profile</h1></header><div role="tabpanel"><a id="grid" href="/p/ok/"><img></a></div><aside><a id="suggested" href="/p/recommended/"><img></a></aside></main>';
  filterSurfaces(document, `/${name}/`, friends);
  expect(hidden("grid")).toBe(false);
  expect(hidden("suggested")).toBe(true);
});
test("revokes an approved article when its author changes during SPA recycling", () => {
  document.body.innerHTML =
    '<main><article id="post"><header><a href="/friend/">friend</a></header><img></article></main>';
  filterSurfaces(document, "/", friends);
  const header = document.querySelector("header");
  if (!header) throw new TypeError("Missing fixture");
  header.innerHTML = '<a href="/stranger/">stranger</a>';
  filterSurfaces(document, "/", friends);
  expect(hidden("post")).toBe(true);
});
test("hides standalone post media when an unsupported layout has no author", () => {
  document.body.innerHTML =
    '<main><img id="unknown-photo"><video id="unknown-video"></video></main>';
  filterSurfaces(document, "/p/unknown/", friends);
  expect(hidden("unknown-photo")).toBe(true);
  expect(hidden("unknown-video")).toBe(true);
});

test("keeps mutual profile grid containers that use article markup", () => {
  document.body.innerHTML =
    '<main><header>Profile</header><div role="tabpanel"><article id="grid-shell"><div><a id="grid-post" href="/p/ok/"><img></a></div></article></div></main>';
  filterSurfaces(document, "/friend/", friends);
  expect(hidden("grid-shell")).toBe(false);
  expect(hidden("grid-post")).toBe(false);
});
