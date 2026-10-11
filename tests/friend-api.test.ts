import { expect, test, vi } from "vitest";
import {
  CheckUnavailable,
  createFriendApi,
  type HttpFetch,
} from "../src/friend-api";

test("missing legacy flags fall back to current web profile with session and CSRF", async () => {
  const requests: Request[] = [];
  const fetcher = vi.fn<HttpFetch>(async (input) => {
    const request = new Request(input);
    requests.push(request);
    if (request.method === "GET")
      return Response.json({ data: { user: { id: "2", username: "friend" } } });
    const body = new URLSearchParams(await request.text());
    expect(body.get("doc_id")).toBe("28036671149327607");
    expect(JSON.parse(body.get("variables") ?? "{}").id).toBe("2");
    return Response.json({
      data: {
        user: {
          pk: "2",
          username: "friend",
          friendship_status: { following: true, followed_by: true },
        },
      },
    });
  });
  const api = createFriendApi(
    "https://www.instagram.com",
    () => "csrftoken=test-token",
    fetcher,
  );
  expect(
    await api.relationship("friend", new AbortController().signal),
  ).toEqual({ id: "2", username: "friend", mutual: true });
  expect(requests).toHaveLength(2);
  for (const request of requests) {
    expect(request.credentials).toBe("include");
    expect(request.headers.get("X-CSRFToken")).toBe("test-token");
    expect(new URL(request.url).origin).toBe("https://www.instagram.com");
  }
});

test("unsupported legacy endpoint resolves exact username through web search", async () => {
  const fetcher = vi.fn<HttpFetch>(async (input) => {
    const request = new Request(input);
    if (request.method === "GET") return new Response(null, { status: 404 });
    const body = new URLSearchParams(await request.text());
    if (body.get("doc_id") === "26347858941511777")
      return Response.json({
        data: {
          xdt_api__v1__fbsearch__non_profiled_serp: {
            users: [
              { pk: "99", username: "friend_similar" },
              { pk: "2", username: "friend" },
            ],
          },
        },
      });
    expect(JSON.parse(body.get("variables") ?? "{}").id).toBe("2");
    return Response.json({
      data: {
        user: {
          id: "2",
          username: "friend",
          friendship_status: { following: true, followed_by: false },
        },
      },
    });
  });
  expect(
    (
      await createFriendApi(
        "https://www.instagram.com",
        () => "",
        fetcher,
      ).relationship("friend", new AbortController().signal)
    ).mutual,
  ).toBe(false);
  expect(fetcher).toHaveBeenCalledTimes(3);
});

test.each([
  401, 403, 429,
])("does not bypass Instagram refusal %s with fallback requests", async (status) => {
  const fetcher = vi.fn<HttpFetch>(
    async () =>
      new Response(null, { status, headers: { "Retry-After": "120" } }),
  );
  await expect(
    createFriendApi(
      "https://www.instagram.com",
      () => "",
      fetcher,
    ).relationship("friend", new AbortController().signal),
  ).rejects.toMatchObject({ retryMs: 120_000, pauseAll: true });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test("missing fallback follow-back status stays unknown", async () => {
  const fetcher = vi.fn<HttpFetch>(async () =>
    Response.json({
      data: {
        user: {
          id: "2",
          username: "friend",
          friendship_status: { following: true },
        },
      },
    }),
  );
  await expect(
    createFriendApi(
      "https://www.instagram.com",
      () => "",
      fetcher,
    ).relationship("friend", new AbortController().signal),
  ).rejects.toBeInstanceOf(CheckUnavailable);
});

test("owner uses web GraphQL instead of mobile users/info and verifies returned ID", async () => {
  const fetcher = vi.fn<HttpFetch>(async (input) => {
    expect(new Request(input).url).toBe(
      "https://www.instagram.com/graphql/query/",
    );
    return Response.json({ data: { user: { pk: "1", username: "me" } } });
  });
  const api = createFriendApi("https://www.instagram.com", () => "", fetcher);
  expect(await api.owner("1", new AbortController().signal)).toBe("me");
  await expect(
    api.owner("2", new AbortController().signal),
  ).rejects.toBeInstanceOf(CheckUnavailable);
});
