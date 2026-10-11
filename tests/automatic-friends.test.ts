import { expect, test } from "vitest";
import {
  CheckUnavailable,
  type FriendApi,
  parseRelationship,
} from "../src/friend-api";
import { FriendChecks } from "../src/friend-checks";
import { viewerId } from "../src/friends";

test("reads only the non-secret viewer identity cookie", () => {
  expect(viewerId("other=abc; ds_user_id=123; more=x")).toBe("123");
  expect(viewerId("not_ds_user_id=123")).toBeUndefined();
});
test.each([
  [true, true, true],
  [true, false, false],
  [false, true, false],
  [false, false, false],
])("requires both relationship directions (%s,%s)", (following, followedBy, mutual) => {
  const data = {
    data: {
      user: {
        id: "2",
        username: "friend",
        followed_by_viewer: following,
        follows_viewer: followedBy,
      },
    },
  };
  expect(parseRelationship(data, "friend").mutual).toBe(mutual);
});
test("accepts nested native relationship fields", () => {
  expect(
    parseRelationship(
      {
        data: {
          user: {
            pk: 2,
            username: "friend",
            friendship_status: { following: true, followed_by: true },
          },
        },
      },
      "friend",
    ).mutual,
  ).toBe(true);
});
test("never interprets missing flags or mismatched names as a mutual", () => {
  expect(() =>
    parseRelationship(
      {
        data: {
          user: { id: "2", username: "friend", followed_by_viewer: true },
        },
      },
      "friend",
    ),
  ).toThrow(CheckUnavailable);
  expect(() =>
    parseRelationship(
      {
        data: {
          user: {
            id: "2",
            username: "other",
            follows_viewer: true,
            followed_by_viewer: true,
          },
        },
      },
      "friend",
    ),
  ).toThrow(CheckUnavailable);
});
const api: FriendApi = {
  owner: async () => "me",
  relationship: async (username) => ({
    id: "2",
    username,
    mutual: username === "friend",
  }),
};
test("checks encountered authors automatically and caches them per account", async () => {
  const checks = new FriendChecks(api, () => {});
  checks.update("1", ["friend", "stranger"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  await checks.tick(6000);
  expect(checks.snapshot(6000)).toEqual({ owner: "me", mutuals: ["friend"] });
  checks.update("99", [], 6001);
  expect(checks.snapshot(6001)).toEqual({ owner: undefined, mutuals: [] });
});
test("expires previous approvals rather than displaying stale relationships", async () => {
  const checks = new FriendChecks(api, () => {});
  checks.update("1", ["friend"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  expect(checks.snapshot(400_000).mutuals).toEqual([]);
});

test("ignores a previous account lookup that completes after switching accounts", async () => {
  let finish: ((value: string) => void) | undefined;
  const slow: FriendApi = {
    ...api,
    owner: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  };
  const checks = new FriendChecks(slow, () => {});
  checks.update("1", [], 0);
  const old = checks.tick(0);
  checks.update("99", [], 1);
  finish?.("old-account");
  await old;
  expect(checks.snapshot(2).owner).toBeUndefined();
});
test("invalidates a mutual after a follow change and rechecks automatically", async () => {
  let mutual = true;
  const changing: FriendApi = {
    ...api,
    relationship: async (username) => ({ id: "2", username, mutual }),
  };
  const checks = new FriendChecks(changing, () => {});
  checks.update("1", ["friend"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  mutual = false;
  checks.invalidate("friend");
  expect(checks.snapshot(3001).mutuals).toEqual([]);
  await checks.tick(6000);
  expect(checks.snapshot(6001).mutuals).toEqual([]);
});
test("backs off instead of repeatedly calling a blocked endpoint", async () => {
  let requests = 0;
  const blocked: FriendApi = {
    ...api,
    relationship: async () => {
      requests++;
      throw new CheckUnavailable(120_000);
    },
  };
  const checks = new FriendChecks(blocked, () => {});
  checks.update("1", ["friend"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  await checks.tick(6000);
  await checks.tick(120_000);
  expect(requests).toBe(1);
  expect(checks.snapshot(120_000).mutuals).toEqual([]);
});

test("honors backoff even when the initial account lookup is rate limited", async () => {
  let requests = 0;
  const blocked: FriendApi = {
    owner: async () => {
      requests++;
      throw new CheckUnavailable(120_000);
    },
    relationship: async (username) => {
      requests++;
      return { id: "2", username, mutual: true };
    },
  };
  const checks = new FriendChecks(blocked, () => {});
  checks.update("1", ["friend"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  await checks.tick(120_000);
  expect(requests).toBe(1);
  expect(checks.snapshot(120_000).mutuals).toEqual([]);
});

test("an unsupported owner endpoint does not pause author checks", async () => {
  const checks = new FriendChecks(
    {
      ...api,
      owner: async () => {
        throw new CheckUnavailable(60_000, "unsupported", false);
      },
    },
    () => {},
  );
  checks.update("1", ["friend"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  expect(checks.snapshot(3001).mutuals).toEqual(["friend"]);
});
test("own profile approval also expires if account refresh becomes unavailable", async () => {
  const checks = new FriendChecks(api, () => {});
  checks.update("1", [], 0);
  await checks.tick(0);
  expect(checks.snapshot(1).owner).toBe("me");
  expect(checks.snapshot(400_000).owner).toBeUndefined();
});

test("a rejected author cannot starve later authors after backoff", async () => {
  const checked: string[] = [];
  const partial: FriendApi = {
    ...api,
    relationship: async (username) => {
      checked.push(username);
      if (username === "missing") throw new CheckUnavailable();
      return { id: "2", username, mutual: true };
    },
  };
  const checks = new FriendChecks(partial, () => {});
  checks.update("1", ["missing", "friend"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  await checks.tick(72_000);
  expect(checked).toEqual(["missing", "friend"]);
  expect(checks.snapshot(72_001).mutuals).toEqual(["friend"]);
});
test("checks authors beyond the first fifty without a permanent cutoff", async () => {
  const names = Array.from({ length: 51 }, (_, index) => `friend${index}`);
  const checks = new FriendChecks(
    {
      ...api,
      relationship: async (username) => ({ id: "2", username, mutual: true }),
    },
    () => {},
  );
  checks.update("1", names, 0);
  await checks.tick(0);
  for (let index = 1; index <= 51; index++) await checks.tick(index * 3000);
  expect(checks.snapshot(153_001).mutuals).toHaveLength(51);
});
