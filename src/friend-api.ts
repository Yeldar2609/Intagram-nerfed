import ky, { HTTPError, TimeoutError } from "ky";
import { z } from "zod";
import { Username } from "./friends";

const Id = z
  .union([z.string().regex(/^\d+$/), z.number().int().nonnegative()])
  .transform(String);
const Identity = z.object({
  username: Username,
  id: Id.optional(),
  pk: Id.optional(),
});
const User = Identity.extend({
  followed_by_viewer: z.boolean().optional(),
  follows_viewer: z.boolean().optional(),
  friendship_status: z
    .object({
      following: z.boolean().optional(),
      followed_by: z.boolean().optional(),
    })
    .nullable()
    .optional(),
});
export type Relationship = {
  readonly username: string;
  readonly id: string;
  readonly mutual: boolean;
};
export interface FriendApi {
  owner(id: string, signal: AbortSignal): Promise<string>;
  relationship(username: string, signal: AbortSignal): Promise<Relationship>;
}
export class CheckUnavailable extends Error {
  constructor(readonly retryMs: number = 60_000) {
    super("Instagram follow status is unavailable");
  }
}
export function parseRelationship(
  data: unknown,
  username: string,
): Relationship {
  const parsed = z.object({ data: z.object({ user: User }) }).safeParse(data);
  if (!parsed.success) throw new CheckUnavailable();
  const user = parsed.data.data.user;
  const id = user.id ?? user.pk;
  const following =
    user.followed_by_viewer ?? user.friendship_status?.following;
  const followedBy = user.follows_viewer ?? user.friendship_status?.followed_by;
  if (
    !id ||
    user.username !== username ||
    following === undefined ||
    followedBy === undefined
  )
    throw new CheckUnavailable();
  return { username: user.username, id, mutual: following && followedBy };
}
export function createFriendApi(origin: string): FriendApi {
  const http = ky.create({
    prefixUrl: origin,
    credentials: "include",
    retry: 0,
    timeout: 8000,
    headers: {
      "x-ig-app-id": "936619743392459",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  async function get(path: string, signal: AbortSignal): Promise<unknown> {
    try {
      return await http.get(path, { signal }).json<unknown>();
    } catch (error) {
      if (error instanceof HTTPError) {
        const raw = error.response.headers.get("retry-after");
        const seconds = raw ? Number(raw) : NaN;
        const delay = Number.isFinite(seconds)
          ? seconds * 1000
          : raw
            ? Date.parse(raw) - Date.now()
            : 60_000;
        throw new CheckUnavailable(
          Math.max(60_000, Number.isFinite(delay) ? delay : 60_000),
        );
      }
      if (
        error instanceof TimeoutError ||
        error instanceof TypeError ||
        error instanceof SyntaxError
      )
        throw new CheckUnavailable();
      throw error;
    }
  }
  return {
    async owner(id, signal) {
      const result = z
        .object({ user: Identity })
        .safeParse(await get(`api/v1/users/${id}/info/`, signal));
      if (
        !result.success ||
        (result.data.user.pk ?? result.data.user.id) !== id
      )
        throw new CheckUnavailable();
      return result.data.user.username;
    },
    async relationship(username, signal) {
      return parseRelationship(
        await get(
          `api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
          signal,
        ),
        username,
      );
    },
  };
}
