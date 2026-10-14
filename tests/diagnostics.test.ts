// @vitest-environment happy-dom
import { afterEach, expect, test } from "vitest";
import { layoutReport } from "../src/diagnostics";

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-instagram-focus-installed");
});

test("reports an unrecognized bare-link feed without copying private content", () => {
  document.documentElement.setAttribute(
    "data-instagram-focus-installed",
    "0.3.4",
  );
  document.body.innerHTML =
    '<main><div><a href="/private_name/">private_name</a><a href="/p/private_id/?secret=token"><img src="https://private.invalid/secret.jpg" alt="private caption"></a><p>private message</p></div></main>';
  const report = layoutReport(document, "/");
  expect(report.installed).toBe("0.3.4");
  expect(report.counts.main).toBe(1);
  expect(report.counts.articles).toBe(0);
  expect(report.counts.postLinks).toBe(1);
  expect(report.samples.length).toBeGreaterThan(0);
  const serialized = JSON.stringify(report);
  for (const secret of [
    "private_name",
    "private_id",
    "token",
    "private caption",
    "private message",
    "private.invalid",
  ])
    expect(serialized).not.toContain(secret);
});

test("distinguishes detected articles and hides malformed version or route values", () => {
  document.documentElement.setAttribute(
    "data-instagram-focus-installed",
    "private version",
  );
  document.body.innerHTML =
    '<main><article data-instagram-friends-approved><header><a href="/private_name/">private_name</a></header><img></article><article data-instagram-friends-pending data-instagram-focus-surface-hidden><img></article></main>';
  const report = layoutReport(document, "/private_name/");
  expect(report.installed).toBe("unknown");
  expect(report.route).toBe("profile");
  expect(report.counts).toMatchObject({
    articles: 2,
    articlesWithNamedProfileLink: 1,
    approved: 1,
    pending: 1,
    hidden: 1,
  });
  expect(JSON.stringify(report)).not.toContain("private");
});
