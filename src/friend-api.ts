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
  constructor(
    readonly retryMs: number = 60_000,
    readonly reason: string = "Instagram is temporarily unavailable",
    readonly pauseAll: boolean = true,
  ) {
    super("Instagram follow status is unavailable");
  }
}
function unsupported(): CheckUnavailable {
  return new CheckUnavailable(
    60_000,
    "Instagram did not return follow status",
    false,
  );
}
export function parseRelationship(
  data: unknown,
  username: string,
): Relationship {
  const parsed = z.object({ data: z.object({ user: User }) }).safeParse(data);
  if (!parsed.success) throw unsupported();
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
    throw unsupported();
  return { username: user.username, id, mutual: following && followedBy };
}
const PROFILE_DOC = "28036671149327607";
const SEARCH_DOC = "26347858941511777";
const Profile = z.object({ data: z.object({ user: Identity }) });
export type HttpFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function createFriendApi(
  origin: string,
  cookies: () => string = () => "",
  fetcher: HttpFetch = (input, init) => globalThis.fetch(input, init),
): FriendApi {
  const http = ky.create({
    prefixUrl: origin,
    credentials: "include",
    retry: 0,
    timeout: 8000,
    fetch: fetcher,
    headers: {
      "x-ig-app-id": "936619743392459",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  async function request(
    path: string,
    signal: AbortSignal,
    body?: URLSearchParams,
  ): Promise<unknown> {
    try {
      const csrf = /(?:^|;\s*)csrftoken=([^;]+)/.exec(cookies())?.[1];
      const headers = csrf ? { "X-CSRFToken": csrf } : {};
      return await (body
        ? http.post(path, { signal, headers, body })
        : http.get(path, { signal, headers })
      ).json<unknown>();
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
          error.response.status === 429
            ? "Instagram asked us to wait (429)"
            : error.response.status === 401
              ? "sign in to Instagram again (401)"
              : error.response.status === 403
                ? "Instagram refused the check (403)"
                : `Instagram request failed (${error.response.status})`,
          [401, 403, 429].includes(error.response.status) ||
            error.response.status >= 500 ||
            (raw !== null && Number.isFinite(delay) && delay > 0),
        );
      }
      if (
        error instanceof TimeoutError ||
        error instanceof TypeError ||
        error instanceof SyntaxError
      )
        throw new CheckUnavailable(
          60_000,
          error instanceof SyntaxError
            ? "Instagram returned an unreadable response"
            : "connection to Instagram failed",
        );
      throw error;
    }
  }
  function graphql(
    doc: string,
    variables: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown> {
    return request(
      "graphql/query/",
      signal,
      new URLSearchParams({
        doc_id: doc,
        variables: JSON.stringify(variables),
        server_timestamps: "true",
      }),
    );
  }
  function profile(id: string, signal: AbortSignal): Promise<unknown> {
    return graphql(
      PROFILE_DOC,
      {
        enable_integrity_filters: true,
        id,
        render_surface: "PROFILE",
        __relay_internal__pv__PolarisCannesGuardianExperienceEnabledrelayprovider: true,
        __relay_internal__pv__PolarisCASB976ProfileEnabledrelayprovider: false,
        __relay_internal__pv__PolarisWebSchoolsEnabledrelayprovider: false,
        __relay_internal__pv__PolarisRepostsConsumptionEnabledrelayprovider: false,
        __relay_internal__pv__PolarisShortDramaEnabledrelayprovider: false,
      },
      signal,
    );
  }
  async function resolve(
    username: string,
    signal: AbortSignal,
  ): Promise<string> {
    const result = z
      .object({
        data: z.object({
          xdt_api__v1__fbsearch__non_profiled_serp: z.object({
            users: z.array(Identity),
          }),
        }),
      })
      .safeParse(
        await graphql(SEARCH_DOC, { hasQuery: true, query: username }, signal),
      );
    if (!result.success) throw unsupported();
    const user =
      result.data.data.xdt_api__v1__fbsearch__non_profiled_serp.users.find(
        (user) => user.username === username,
      );
    const id = user?.pk ?? user?.id;
    if (!id) throw unsupported();
    return id;
  }
  return {
    async owner(id, signal) {
      const result = Profile.safeParse(await profile(id, signal));
      if (
        !result.success ||
        (result.data.data.user.pk ?? result.data.data.user.id) !== id
      )
        throw unsupported();
      return result.data.data.user.username;
    },
    async relationship(username, signal) {
      let id: string | undefined;
      try {
        const data = await request(
          `api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
          signal,
        );
        const identity = Profile.safeParse(data);
        if (identity.success && identity.data.data.user.username === username)
          id = identity.data.data.user.id ?? identity.data.data.user.pk;
        return parseRelationship(data, username);
      } catch (error) {
        // A missing legacy field is not a rate limit. Use the current web profile query.
        if (!(error instanceof CheckUnavailable) || error.pauseAll) throw error;
      }
      id ??= await resolve(username, signal);
      const data = await profile(id, signal);
      const result = parseRelationship(data, username);
      if (result.id !== id) throw unsupported();
      return result;
    },
  };
}
