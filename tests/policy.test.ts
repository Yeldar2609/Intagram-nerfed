import { describe, expect, test } from "vitest";
import {
  INBOX,
  isAuthPath,
  isDistractionPath,
  shouldRedirect,
} from "../src/policy";

describe("Instagram navigation policy", () => {
  test.each([
    "/explore/",
    "/explore/search/",
    "/reels/",
  ])("identifies %s as a distraction route", (path) => {
    // Given a distracting Instagram route, when focus mode evaluates it, then return to Home.
    expect(shouldRedirect(path)).toBe(true);
  });
  test.each([
    "/",
    "/reel/abc/",
    "/stories/alex/123/",
    INBOX,
    "/direct/t/123/",
    "/accounts/login/",
    "/challenge/abc/",
    "/accounts/onetap/",
    "/p/shared/",
  ])("preserves %s", (path) => {
    // Given a message, login, or shared post route, when evaluated, then preserve it.
    expect(shouldRedirect(path)).toBe(false);
  });
  test("preserves Home", () => {
    // Given Home, preserve the route so stories and mutual posts can render.
    expect(shouldRedirect("/")).toBe(false);
  });
  test("distinguishes usernames from reserved route names", () => {
    // Given a similar profile name, when classified, then do not treat it as Explore.
    expect(isDistractionPath("/explorer_person/")).toBe(false);
  });
  test("identifies login and security challenges", () => {
    // Given a challenge URL, when classified, then authentication UI remains untouched.
    expect(isAuthPath("/checkpoint/123/")).toBe(true);
  });
});
