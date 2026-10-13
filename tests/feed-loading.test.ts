// @vitest-environment happy-dom
import { afterEach, expect, test } from "vitest";
import { articleAuthor } from "../src/authors";
import { filterSurfaces } from "../src/surfaces";

const friends = { owner: "me", mutuals: ["friend"] };
afterEach(() => {
  document.body.innerHTML = "";
});
function node(id: string): HTMLElement {
  const result = document.getElementById(id);
  if (!result) throw new TypeError(`Missing fixture ${id}`);
  return result;
}
const hidden = (id: string) =>
  !!node(id).closest("[data-instagram-focus-surface-hidden]");

test("a story avatar before the username does not hide a mutual feed post", () => {
  document.body.innerHTML =
    '<main><article id="post"><div><a href="/stories/friend/123/"><img alt="friend\u0027s profile picture"></a><a href="/friend/">friend</a></div><img id="photo"><a href="/p/one/">Today</a></article></main>';
  expect(articleAuthor(node("post"))).toBe("friend");
  filterSurfaces(document, "/", friends);
  expect(hidden("photo")).toBe(false);
});

test("owner-qualified thumbnails work inside a profile article without grid roles", () => {
  document.body.innerHTML =
    '<main><article><header><h2>friend</h2></header><div><a href="/friend/p/one/"><img id="photo"></a><a href="/stranger/p/two/"><img id="other"></a></div></article></main>';
  filterSurfaces(document, "/friend/", friends);
  expect(hidden("photo")).toBe(false);
  expect(hidden("other")).toBe(true);
});

test("nonsemantic feed cards use their author region without trusting captions", () => {
  document.body.innerHTML =
    '<main><section><div id="post"><div><a href="/friend/">friend</a></div><img id="photo"><a href="/friend/p/one/">Today</a></div><div id="other"><div><a href="/stranger/">stranger</a></div><img><a href="/stranger/p/two/">Today</a><p><a href="/friend/">friend</a> mentioned</p></div></section></main>';
  filterSurfaces(document, "/", friends);
  expect(hidden("photo")).toBe(false);
  expect(hidden("other")).toBe(true);
});

test("late-mounted media keeps an unknown card pending until its author can be read", () => {
  document.body.innerHTML =
    '<main><article id="post"><div><a href="/friend/">friend</a></div><div style="height:300px"></div></article></main>';
  filterSurfaces(document, "/", friends);
  expect(node("post").hasAttribute("data-instagram-friends-pending")).toBe(
    true,
  );
  node("post").insertAdjacentHTML("beforeend", '<img id="photo">');
  filterSurfaces(document, "/", friends);
  expect(node("post").hasAttribute("data-instagram-friends-pending")).toBe(
    false,
  );
  expect(hidden("photo")).toBe(false);
});

test("an owned thumbnail cannot approve bare recommendations in the same wrapper", () => {
  document.body.innerHTML =
    '<main><article><a href="/friend/p/one/"><img id="photo"></a><a href="/p/unknown/"><img id="unknown"></a></article></main>';
  filterSurfaces(document, "/friend/", friends);
  expect(hidden("photo")).toBe(false);
  expect(hidden("unknown")).toBe(true);
});

test("recycled div cards lose approval when their author changes", () => {
  document.body.innerHTML =
    '<main><div><a id="author" href="/friend/">friend</a><img id="photo"><a href="/friend/p/one/">Today</a></div></main>';
  filterSurfaces(document, "/", friends);
  expect(hidden("photo")).toBe(false);
  node("author").setAttribute("href", "/stranger/");
  node("author").textContent = "stranger";
  filterSurfaces(document, "/", friends);
  expect(hidden("photo")).toBe(true);
});

test.each([
  "/stranger/p/one/",
  "/p/one/",
])("does not borrow a surrounding friend's header for %s", (href) => {
  document.body.innerHTML = `<main><section><header><a href="/friend/">friend</a></header><div><img id="photo"><a href="${href}">Today</a></div></section></main>`;
  filterSurfaces(document, "/", friends);
  expect(hidden("photo")).toBe(true);
});

test("a recycled inferred card cannot retain approval after its permalink owner changes", () => {
  document.body.innerHTML =
    '<main><div><a href="/friend/">friend</a><img id="photo"><a id="post-link" href="/friend/p/one/">Today</a></div></main>';
  filterSurfaces(document, "/", friends);
  expect(hidden("photo")).toBe(false);
  node("post-link").setAttribute("href", "/stranger/p/two/");
  filterSurfaces(document, "/", friends);
  expect(hidden("photo")).toBe(true);
});

test("profile navigation also revokes approval from a recycled inferred card", () => {
  document.body.innerHTML =
    '<main><div><a href="/friend/">friend</a><img id="photo"><a id="post-link" href="/friend/p/one/">Today</a></div></main>';
  filterSurfaces(document, "/friend/", friends);
  expect(hidden("photo")).toBe(false);
  node("post-link").setAttribute("href", "/stranger/p/two/");
  filterSurfaces(document, "/friend/", friends);
  expect(hidden("photo")).toBe(true);
});

test("a div card can finish mounting media before author verification", () => {
  document.body.innerHTML =
    '<main><div id="post"><a href="/friend/">friend</a><div id="slot" style="height:300px"></div><a href="/friend/p/one/">Today</a></div></main>';
  filterSurfaces(document, "/", friends);
  expect(node("post").hasAttribute("data-instagram-friends-pending")).toBe(
    true,
  );
  node("slot").insertAdjacentHTML("beforeend", '<img id="photo">');
  filterSurfaces(document, "/", friends);
  expect(hidden("photo")).toBe(false);
});
