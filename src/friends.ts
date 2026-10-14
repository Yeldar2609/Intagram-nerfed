import { z } from "zod";
export const Username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^(?=.*[a-z0-9_])[a-z0-9._]{1,30}$/);
export type Friends = {
  readonly owner: string | undefined;
  readonly following: readonly string[];
};
export function maySeePosts(
  username: string | undefined,
  friends: Friends | undefined,
): boolean {
  return (
    !!username &&
    !!friends &&
    (username === friends.owner || friends.following.includes(username))
  );
}
export function viewerId(cookie: string): string | undefined {
  return /(?:^|;\s*)ds_user_id=(\d+)(?:;|$)/.exec(cookie)?.[1];
}
