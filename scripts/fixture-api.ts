// Local QA service only. Never included in an extension or website build.
export function fixtureApi(request: Request): Response | undefined {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return undefined;
  const cookies = request.headers.get("cookie") ?? "";
  if (cookies.includes("qa_mode=blocked"))
    return Response.json(
      { status: "fail" },
      { status: 429, headers: { "Retry-After": "120" } },
    );
  const id = /(?:^|;\s*)ds_user_id=(\d+)/.exec(cookies)?.[1];
  if (!id) return Response.json({ message: "login_required" }, { status: 401 });
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
          followed_by_viewer: true,
          follows_viewer:
            id === "1" &&
            username === "friend" &&
            !cookies.includes("qa_follow=off"),
        },
      },
    });
  }
  return Response.json({ status: "fail" }, { status: 404 });
}
