// Local QA service only. Never included in an extension or website build.
export async function fixtureApi(
  request: Request,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/") && url.pathname !== "/graphql/query/")
    return undefined;
  const cookies = request.headers.get("cookie") ?? "";
  if (cookies.includes("qa_mode=blocked"))
    return Response.json(
      { status: "fail" },
      { status: 429, headers: { "Retry-After": "120" } },
    );
  const id = /(?:^|;\s*)ds_user_id=(\d+)/.exec(cookies)?.[1];
  if (!id) return Response.json({ message: "login_required" }, { status: 401 });
  if (url.pathname === "/graphql/query/") {
    if (request.headers.get("X-CSRFToken") !== "fixture-csrf")
      return Response.json({ status: "fail" }, { status: 403 });
    const params = new URLSearchParams(await request.text());
    const variables: unknown = JSON.parse(params.get("variables") ?? "{}");
    if (typeof variables !== "object" || !variables || !("id" in variables))
      return Response.json({ status: "fail" }, { status: 400 });
    if (cookies.includes("qa_mode=owner-unsupported") && variables.id === id)
      return Response.json({ data: { user: null } });
    const username =
      variables.id === "1"
        ? "me"
        : variables.id === "2"
          ? "friend"
          : variables.id === "99"
            ? "alternate"
            : "stranger";
    return Response.json({
      data: {
        user: {
          pk: variables.id,
          username,
          friendship_status: {
            following:
              id === "1" &&
              username === "friend" &&
              !cookies.includes("qa_follow=off"),
            followed_by: username === "stranger",
          },
        },
      },
    });
  }
  if (/^\/api\/v1\/users\/\d+\/info\/$/.test(url.pathname))
    return Response.json({
      user: { pk: id, username: id === "1" ? "me" : "alternate" },
    });
  if (url.pathname === "/api/v1/users/web_profile_info/") {
    const username = url.searchParams.get("username");
    if (!username) return Response.json({ status: "fail" }, { status: 400 });
    return Response.json({
      data: {
        user: {
          id: username === "me" ? "1" : username === "friend" ? "2" : "3",
          username,
          // Deliberately omit relationships: exercise the production GraphQL fallback.
        },
      },
    });
  }
  return Response.json({ status: "fail" }, { status: 404 });
}
