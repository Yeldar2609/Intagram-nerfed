import { describe, expect, test } from "vitest";
import {
  INBOX,
  isAuthPath,
  isDistractionPath,
  shouldRedirect,
} from "../src/policy";

describe("Instagram navigation policy", () => {
  test.each([
    "/",
    "/explore/",
    "/explore/search/",
    "/reels/",
    "/reel/abc/",
    "/stories/alex/123/",
  ])("redirects %s to the inbox in focus mode", (path) => {
    // Given a distracting Instagram route, when focus mode evaluates it, then return to messages.
    expect(shouldRedirect(path, false)).toBe(true);
  });
  test.each([
    INBOX,
    "/direct/t/123/",
    "/accounts/login/",
    "/challenge/abc/",
    "/accounts/onetap/",
    "/p/shared/",
  ])("preserves %s", (path) => {
    // Given a message, login, or shared post route, when evaluated, then preserve it.
    expect(shouldRedirect(path, false)).toBe(false);
  });
  test("allows posting mode to reach the native site", () => {
    // Given posting mode, when home is requested, then do not redirect.
    expect(shouldRedirect("/", true)).toBe(false);
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
