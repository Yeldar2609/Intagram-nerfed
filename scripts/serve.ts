import { resolve, sep } from "node:path";
import { fixtureApi } from "./fixture-api";

const root = resolve("dist/site");
const fixture = resolve("tests/fixture.html");
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 4173,
  async fetch(request) {
    const url = new URL(request.url);
    if (
      url.pathname.startsWith("/direct/") ||
      url.pathname === "/fixture" ||
      url.pathname === "/explore/" ||
      url.pathname === "/reels/" ||
      url.pathname.startsWith("/accounts/")
    )
      return new Response(Bun.file(fixture));
    if (url.pathname === "/test-content.js")
      return new Response(Bun.file("dist/extension/content.js"));
    const path = resolve(
      root,
      `.${decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)}`,
    );
    if (!path.startsWith(root + sep))
      return new Response("Not found", { status: 404 });
    const file = Bun.file(path);
    return (await file.exists())
      ? new Response(file)
      : new Response("Not found", { status: 404 });
  },
});
console.info(`Local QA server: ${server.url}`);
const fixtureServer = Bun.serve({
  hostname: "127.0.0.1",
  port: 4174,
  fetch(request) {
    const api = fixtureApi(request);
    if (api) return api;
    return new Response(
      Bun.file(
        new URL(request.url).pathname === "/test-content.js"
          ? "dist/extension/content.js"
          : fixture,
      ),
      {
        headers: request.headers.get("cookie")?.includes("ds_user_id=")
          ? {}
          : { "Set-Cookie": "ds_user_id=1; Path=/; SameSite=Lax" },
      },
    );
  },
});
console.info(`Isolated extension fixture: ${fixtureServer.url}`);
