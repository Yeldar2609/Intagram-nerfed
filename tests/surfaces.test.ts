// @vitest-environment happy-dom
import { afterEach, expect, test } from "vitest";
import { selectedMediaItem } from "../src/media";
import { mediaId, singlePostPath } from "../src/policy";
import { filterSurfaces } from "../src/surfaces";

afterEach(() => {
  document.body.innerHTML = "";
});
const hidden = (selector: string) => {
  const node = document.querySelector(selector);
  if (!node) throw new RangeError(`Missing fixture node: ${selector}`);
  return node.closest("[data-instagram-focus-surface-hidden]") !== null;
};

test("keeps native story links but hides posts and suggested content on Home", () => {
  // Given a native story tray alongside feed and recommendations.
  document.body.innerHTML =
    '<nav>Messages</nav><main><div><div id="stories"><a id="friend" href="/stories/friend/123/">Friend</a></div><article id="post">Post</article></div><section id="suggested">Suggested videos</section></main>';
  // When Home is filtered.
  filterSurfaces(document, "/", false);
  // Then stories and navigation survive, while both feed formats hide.
  expect(hidden("#friend")).toBe(false);
  expect(hidden("nav")).toBe(false);
  expect(hidden("#post")).toBe(true);
  expect(hidden("#suggested")).toBe(true);
});

test("supports story buttons and filters newly inserted feed content", () => {
  document.body.innerHTML =
    '<main><button aria-label="Friend story">Friend</button><div id="feed">Feed</div></main>';
  filterSurfaces(document, "/", false);
  document
    .querySelector("main")
    ?.insertAdjacentHTML("beforeend", '<article id="new">New post</article>');
  filterSurfaces(document, "/", false);
  expect(hidden("button")).toBe(false);
  expect(hidden("#new")).toBe(true);
});

test("hides the Home feed while the story tray has not loaded", () => {
  document.body.innerHTML = '<main><article id="post">Post</article></main>';
  filterSurfaces(document, "/", false);
  expect(hidden("#post")).toBe(true);
});

test("restores native content on stories, messages and posting mode", () => {
  document.body.innerHTML = '<main><article id="post">Post</article></main>';
  for (const [path, posting] of [
    ["/stories/friend/123/", false],
    ["/direct/inbox/", false],
    ["/", true],
  ] as const) {
    filterSurfaces(document, "/", false);
    filterSurfaces(document, path, posting);
    expect(hidden("#post")).toBe(false);
  }
});

test("preserves only the opened post and hides routes to other videos", () => {
  document.body.innerHTML =
    '<main><article id="current"><a href="/p/friend/">Current</a><video></video><button id="carousel" aria-label="Next">Next photo</button></article><article id="next"><a href="/reel/next/">Next</a></article><a id="recommendation" href="/p/third/">More</a><button id="next-reel" aria-label="Next reel">Next</button></main>';
  filterSurfaces(document, "/p/friend/", false);
  expect(hidden("#current")).toBe(false);
  expect(hidden("#next")).toBe(true);
  expect(hidden("#recommendation")).toBe(true);
  expect(hidden("#next-reel")).toBe(true);
  expect(hidden("#carousel")).toBe(false);
});

test("keeps the requested video even when another article precedes it", () => {
  document.body.innerHTML =
    '<main><article><a href="/p/other/">Other</a><video id="other"></video></article><article><a href="/p/friend/">Friend</a><video id="friend"></video><video id="carousel-video"></video></article></main>';
  filterSurfaces(document, "/p/friend/", false);
  expect(hidden("#other")).toBe(true);
  expect(hidden("#friend")).toBe(false);
  expect(hidden("#carousel-video")).toBe(false);
  expect(
    selectedMediaItem(document, "/p/friend/")?.querySelector("video")?.id,
  ).toBe("friend");
});

test.each([
  "/reel/abc/",
  "/reels/abc/",
  "/p/abc/",
])("opens %s in a single post view", (path) => {
  expect(singlePostPath(path)).toBe("/p/abc/");
  expect(mediaId(path)).toBe("abc");
});
