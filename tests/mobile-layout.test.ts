// @vitest-environment happy-dom
import { afterEach, expect, test } from "vitest";
import { articleAuthor } from "../src/authors";
import { hasMediaView } from "../src/media";
import { mediaId } from "../src/policy";
import { filterSurfaces } from "../src/surfaces";

const friends = { owner: "me", mutuals: ["friend"] };
afterEach(() => {
  document.body.innerHTML = "";
});
const hidden = (id: string) => {
  const node = document.getElementById(id);
  if (!node) throw new TypeError(`Missing fixture: ${id}`);
  return !!node.closest("[data-instagram-focus-surface-hidden]");
};
const postsTab =
  '<div role="tablist"><a role="tab" aria-selected="true">Posts</a></div>';

test("keeps native own-story and create controls without aria labels", () => {
  document.body.innerHTML =
    '<main><div><button id="own">Your story</button><button id="create"><svg aria-label="New post"></svg></button></div><article id="unknown"><img></article></main>';
  filterSurfaces(document, "/", friends);
  expect(hidden("own")).toBe(false);
  expect(hidden("create")).toBe(false);
  expect(hidden("unknown")).toBe(true);
});
test("keeps upload previews and editor controls without treating them as a video viewer", () => {
  document.body.innerHTML =
    '<main><article id="unknown"><img></article><div role="dialog" id="editor"><input type="file" accept="image/*,video/*"><article><video id="preview"></video></article><button id="next">Next</button></div></main>';
  filterSurfaces(document, "/", friends);
  expect(hidden("editor")).toBe(false);
  expect(hidden("preview")).toBe(false);
  expect(hidden("next")).toBe(false);
  expect(hidden("unknown")).toBe(true);
  expect(hasMediaView(document, "/")).toBe(false);
});
test("reads decorated native author links and role=article feed cards", () => {
  document.body.innerHTML =
    '<main><div role="article" id="friend"><header><a href="/friend/">friend<svg><title>Verified</title></svg></a></header><img></div><div role="article" id="stranger"><header><a href="/stranger/">stranger</a></header><img></div></main>';
  const article = document.getElementById("friend");
  if (!article) throw new TypeError("Missing fixture");
  expect(articleAuthor(article)).toBe("friend");
  filterSurfaces(document, "/", friends);
  expect(hidden("friend")).toBe(false);
  expect(hidden("stranger")).toBe(true);
});
test("recognizes avatar-only headers without trusting caption mentions", () => {
  document.body.innerHTML =
    '<article><header><a href="/friend/"><img alt="friend\u0027s profile picture"></a></header><img><a href="/stranger/">stranger</a></article>';
  const article = document.querySelector("article");
  if (!article) throw new TypeError("Missing fixture");
  expect(articleAuthor(article)).toBe("friend");
});
test.each([
  "me",
  "friend",
])("supports %s native article grids without a tabpanel", (name) => {
  document.body.innerHTML = `<main><header>Profile</header>${postsTab}<article id="grid"><a id="post" href="/p/one/"><img></a></article><aside><a id="recommended" href="/p/two/"><img></a></aside></main>`;
  filterSurfaces(document, `/${name}/`, friends);
  expect(hidden("grid")).toBe(false);
  expect(hidden("post")).toBe(false);
  expect(hidden("recommended")).toBe(true);
});
test("supports owner-qualified links while rejecting another owner's grid link", () => {
  document.body.innerHTML =
    '<main><header>Profile</header><div><a id="post" href="/friend/p/one/"><img></a><a id="recommended" href="/stranger/p/two/"><img></a></div></main>';
  filterSurfaces(document, "/friend/", friends);
  expect(mediaId("/friend/p/one/")).toBe("one");
  expect(mediaId("/friend/reel/one/")).toBe("one");
  expect(hidden("post")).toBe(false);
  expect(hidden("recommended")).toBe(true);
});
test("a nonmutual native article grid still stays hidden", () => {
  document.body.innerHTML =
    '<main><header><button id="follow">Follow</button></header><article><a id="post" href="/stranger/p/one/"><img></a></article></main>';
  filterSurfaces(document, "/stranger/", friends);
  expect(hidden("post")).toBe(true);
  expect(hidden("follow")).toBe(false);
});

test("revokes native grid approval when a friend is no longer mutual", () => {
  document.body.innerHTML = `<main><header>Profile</header>${postsTab}<article><a id="post" href="/friend/p/one/"><img></a></article></main>`;
  filterSurfaces(document, "/friend/", friends);
  expect(hidden("post")).toBe(false);
  filterSurfaces(document, "/friend/", { owner: "me", mutuals: [] });
  expect(hidden("post")).toBe(true);
});

test("preserves empty native feed sentinels so more friends posts can load", () => {
  document.body.innerHTML =
    '<main><div role="feed"><article id="unknown"><header><a href="/stranger/">stranger</a></header><img></article><div id="sentinel" style="height:1px"></div><div role="progressbar" id="loading"></div></div></main>';
  filterSurfaces(document, "/", friends);
  expect(hidden("unknown")).toBe(true);
  expect(hidden("sentinel")).toBe(false);
  expect(hidden("loading")).toBe(false);
});

test("does not mistake an unknown recommendation for the profile grid", () => {
  document.body.innerHTML =
    '<main><header>Profile</header><article id="suggestion"><a href="/p/unknown/"><img id="unknown"></a></article></main>';
  filterSurfaces(document, "/friend/", friends);
  expect(hidden("suggestion")).toBe(true);
  expect(hidden("unknown")).toBe(true);
});

test.each([
  "https://other.example/p/stranger/",
  "/stranger/",
])("clears recycled grid approval for %s", (destination) => {
  document.body.innerHTML = `<main>${postsTab}<article><a id="post" href="/friend/p/one/"><img id="photo"></a></article></main>`;
  filterSurfaces(document, "/friend/", friends);
  expect(hidden("photo")).toBe(false);
  document.getElementById("post")?.setAttribute("href", destination);
  filterSurfaces(document, "/friend/", friends);
  expect(hidden("photo")).toBe(true);
});
