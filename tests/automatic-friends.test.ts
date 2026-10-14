import { expect, test } from "vitest";
import { CheckUnavailable, type FriendApi } from "../src/friend-api";
import { FriendChecks } from "../src/friend-checks";
import { viewerId } from "../src/friends";

test("reads only the non-secret viewer identity cookie", () => {
  expect(viewerId("other=abc; ds_user_id=123; more=x")).toBe("123");
  expect(viewerId("not_ds_user_id=123")).toBeUndefined();
});
const api: FriendApi = {
  owner: async () => "me",
  relationship: async (username) => ({
    id: "2",
    username,
    following: username === "friend",
  }),
};
test("checks encountered authors automatically and caches them per account", async () => {
  const checks = new FriendChecks(api, () => {});
  checks.update("1", ["friend", "stranger"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  await checks.tick(6000);
  expect(checks.snapshot(6000)).toEqual({ owner: "me", following: ["friend"] });
  checks.update("99", [], 6001);
  expect(checks.snapshot(6001)).toEqual({ owner: undefined, following: [] });
});
test("expires previous approvals rather than displaying stale relationships", async () => {
  const checks = new FriendChecks(api, () => {});
  checks.update("1", ["friend"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  expect(checks.snapshot(400_000).following).toEqual([]);
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
test("invalidates a following after a follow change and rechecks automatically", async () => {
  let following = true;
  const changing: FriendApi = {
    ...api,
    relationship: async (username) => ({ id: "2", username, following }),
  };
  const checks = new FriendChecks(changing, () => {});
  checks.update("1", ["friend"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  following = false;
  checks.invalidate("friend");
  expect(checks.snapshot(3001).following).toEqual([]);
  await checks.tick(6000);
  expect(checks.snapshot(6001).following).toEqual([]);
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
  expect(checks.snapshot(120_000).following).toEqual([]);
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
      return { id: "2", username, following: true };
    },
  };
  const checks = new FriendChecks(blocked, () => {});
  checks.update("1", ["friend"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  await checks.tick(120_000);
  expect(requests).toBe(1);
  expect(checks.snapshot(120_000).following).toEqual([]);
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
  expect(checks.snapshot(3001).following).toEqual(["friend"]);
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
      return { id: "2", username, following: true };
    },
  };
  const checks = new FriendChecks(partial, () => {});
  checks.update("1", ["missing", "friend"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  await checks.tick(72_000);
  expect(checked).toEqual(["missing", "friend"]);
  expect(checks.snapshot(72_001).following).toEqual(["friend"]);
});
test("successful unrelated checks do not erase a failed friend's explanation", async () => {
  const checks = new FriendChecks(
    {
      ...api,
      relationship: async (username) => {
        if (username === "friend")
          throw new CheckUnavailable(60_000, "missing relationship", false);
        return { id: "3", username, following: false };
      },
    },
    () => {},
  );
  checks.update("1", ["friend", "stranger"], 0);
  await checks.tick(0);
  await checks.tick(3000);
  await checks.tick(6000);
  expect(checks.status(6001)).toContain("missing relationship");
  const failedStatus = checks.status(6001);
  checks.invalidate("friend");
  expect(checks.status(6001)).not.toBe("");
  expect(checks.status(6001)).not.toBe(failedStatus);
});

test("checks authors beyond the first fifty without a permanent cutoff", async () => {
  const names = Array.from({ length: 51 }, (_, index) => `friend${index}`);
  const checks = new FriendChecks(
    {
      ...api,
      relationship: async (username) => ({
        id: "2",
        username,
        following: true,
      }),
    },
    () => {},
  );
  checks.update("1", names, 0);
  await checks.tick(0);
  for (let index = 1; index <= 51; index++) await checks.tick(index * 3000);
  expect(checks.snapshot(153_001).following).toHaveLength(51);
});
