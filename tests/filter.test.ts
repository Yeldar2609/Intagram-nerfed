import { Window } from "happy-dom";
import { expect, test } from "vitest";
import { filterLinks, HIDDEN } from "../src/filter";

test("hides distraction links while preserving messages and external URLs", () => {
  // Given actual HTML anchors, when focus filters them, then only Instagram distractions hide.
  const window = new Window({ url: "https://www.instagram.com/direct/inbox/" });
  window.document.body.innerHTML =
    '<a id="home" href="/">Home</a><a id="dm" href="/direct/t/123/">DM</a><a id="external" href="https://example.com/reels/">External</a>';
  filterLinks(window.document, false);
  expect(window.document.querySelector("#home")?.hasAttribute(HIDDEN)).toBe(
    true,
  );
  expect(window.document.querySelector("#dm")?.hasAttribute(HIDDEN)).toBe(
    false,
  );
  expect(window.document.querySelector("#external")?.hasAttribute(HIDDEN)).toBe(
    false,
  );
});

test("restores hidden links when posting mode is enabled", () => {
  // Given a previously hidden anchor, when posting mode filters, then its original visibility returns.
  const window = new Window({ url: "https://www.instagram.com/" });
  window.document.body.innerHTML =
    '<a href="/reels/" data-instagram-focus-hidden>Reels</a>';
  filterLinks(window.document, true);
  expect(window.document.querySelector("a")?.hasAttribute(HIDDEN)).toBe(false);
});
