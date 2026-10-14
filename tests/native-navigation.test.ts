// @vitest-environment happy-dom
import { afterEach, expect, test } from "vitest";
import { filterLinks } from "../src/filter";
import { isDistractionPath } from "../src/policy";
import { filterSurfaces } from "../src/surfaces";

afterEach(() => {
  document.body.innerHTML = "";
});
const friends = { owner: "me", following: ["friend"] };
function hidden(id: string): boolean {
  return !!document
    .getElementById(id)
    ?.closest(
      "[data-instagram-focus-surface-hidden],[data-instagram-focus-hidden]",
    );
}
test("native search route and buttons remain available", () => {
  document.body.innerHTML =
    '<main><header id="top"><button>Search</button></header><nav id="nav"><a href="/">Home</a><a id="search" href="/explore/">Search</a><a href="/me/">Profile</a></nav><div id="suggested">Suggested posts</div></main>';
  filterLinks(document);
  filterSurfaces(document, "/", friends);
  expect(isDistractionPath("/explore/search/")).toBe(false);
  expect(hidden("search")).toBe(false);
  expect(hidden("top")).toBe(false);
  expect(hidden("nav")).toBe(false);
  expect(hidden("suggested")).toBe(true);
});
test("native search shows people but never Explore media, even followed posts", () => {
  document.body.innerHTML =
    '<main><input aria-label="Search"><a id="person" href="/friend/"><img alt="Profile picture"></a><article id="post"><header><a href="/friend/">friend</a></header><img></article><a id="grid" href="/p/explore/"><img></a><video id="loose"></video></main>';
  filterSurfaces(document, "/explore/", friends);
  expect(hidden("person")).toBe(false);
  expect(hidden("post")).toBe(true);
  expect(hidden("grid")).toBe(true);
  expect(hidden("loose")).toBe(true);
});
