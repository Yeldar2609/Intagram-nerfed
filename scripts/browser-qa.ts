import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const browser = process.env["BROWSE_BIN"] ?? "";
if (!browser)
  throw new TypeError("Set BROWSE_BIN to your gstack browse executable");
const evidence = resolve("work/qa");
await mkdir(evidence, { recursive: true });
const checks: string[] = [];
async function browse(...args: string[]): Promise<string> {
  const child = Bun.spawn([browser, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [output, errors, exit] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (exit !== 0)
    throw new AggregateError([output, errors], `browse ${args[0]} failed`);
  return output.trim();
}
async function check(name: string, expression: string): Promise<void> {
  const result = await browse("js", expression);
  if (result !== "true") throw new TypeError(`${name}: ${result}`);
  checks.push(name);
  console.info(`PASS ${name}`);
}
async function waitForPath(path: string): Promise<void> {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if ((await browse("url")) === `http://127.0.0.1:4174${path}`) {
      await browse("wait", "instagram-focus-controls");
      return;
    }
    await Bun.sleep(100);
  }
  throw new TypeError(`Navigation did not reach ${path}`);
}
async function capturePage(path: string): Promise<void> {
  const params = await browse(
    "js",
    "JSON.stringify({format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:innerWidth,height:document.documentElement.scrollHeight,scale:1}})",
  );
  const wrapped = await browse("cdp", "Page.captureScreenshot", params);
  const result: unknown = JSON.parse(
    wrapped.slice(wrapped.indexOf("{"), wrapped.lastIndexOf("}") + 1),
  );
  if (
    typeof result !== "object" ||
    result === null ||
    !("data" in result) ||
    typeof result.data !== "string"
  )
    throw new TypeError("Screenshot data is missing");
  await writeFile(path, Buffer.from(result.data, "base64"));
}
const host = "document.querySelector('instagram-focus-controls').shadowRoot";
await browse("goto", "http://127.0.0.1:4174/direct/inbox/");
await browse("js", "sessionStorage.clear()");
await browse("goto", "http://127.0.0.1:4174/direct/inbox/");
await browse("wait", "instagram-focus-controls");
await check(
  "Home, Explore and Reels hidden; messages visible",
  "['home','explore','reels'].every(id=>getComputedStyle(document.getElementById(id)).display==='none') && getComputedStyle(document.getElementById('inbox')).display!=='none'",
);
await browse("click", "#dynamic");
await check(
  "Dynamically inserted Reels hidden",
  "getComputedStyle(document.getElementById('added')).display==='none'",
);
await browse("click", "#mutate");
await check(
  "Changed anchor target is re-filtered",
  "getComputedStyle(document.getElementById('inbox')).display==='none'",
);
await browse("click", "#spa");
await waitForPath("/direct/inbox/");
await check(
  "SPA pushState returns to inbox",
  "location.pathname==='/direct/inbox/'",
);
for (const width of [375, 768, 1280]) {
  await browse("viewport", `${width}x900`);
  await browse("js", `${host}.querySelector('.launcher').click()`);
  await check(
    `Panel fits ${width}px`,
    `${host}.querySelector('.panel').getBoundingClientRect().left>=0 && ${host}.querySelector('.panel').getBoundingClientRect().right<=innerWidth`,
  );
  await browse("screenshot", `${evidence}/panel-${width}.png`, "--viewport");
  await browse("press", "Escape");
  await check(
    `Escape returns focus ${width}px`,
    `${host}.querySelector('.panel').hidden && ${host}.activeElement===${host}.querySelector('.launcher')`,
  );
  await browse("screenshot", `${evidence}/closed-${width}.png`, "--viewport");
}
await browse(
  "js",
  `${host}.querySelector('.launcher').click(); Array.from(${host}.querySelectorAll('button')).find(b=>b.textContent==='Open posting mode').click()`,
);
await waitForPath("/");
await check(
  "Posting persists across navigation",
  "location.pathname==='/' && document.documentElement.getAttribute('data-instagram-focus')==='off' && getComputedStyle(document.getElementById('home')).display!=='none'",
);
await browse("js", `${host}.querySelector('.launcher').click()`);
await browse("viewport", "375x900");
await browse("screenshot", `${evidence}/posting.png`, "--viewport");
await browse(
  "js",
  `(() => {const original=Storage.prototype.setItem; Storage.prototype.setItem=function(){throw new DOMException('Storage disabled','SecurityError')}; ${host}.querySelector('.primary').click(); Storage.prototype.setItem=original})()`,
);
await check(
  "Storage denial when leaving posting keeps state honest",
  `${host}.querySelector('[role=alert]')!==null && location.pathname==='/' && document.documentElement.getAttribute('data-instagram-focus')==='off'`,
);
await browse("screenshot", `${evidence}/exit-storage-error.png`, "--viewport");
await browse("js", `${host}.querySelector('.primary').click()`);
await waitForPath("/direct/inbox/");
await check(
  "Back to messages re-enables filtering",
  "location.pathname==='/direct/inbox/' && getComputedStyle(document.getElementById('home')).display==='none'",
);
await browse(
  "js",
  `Storage.prototype.setItem=function(){throw new DOMException('Storage disabled','SecurityError')}; ${host}.querySelector('.launcher').click(); Array.from(${host}.querySelectorAll('button')).find(b=>b.textContent==='Open posting mode').click()`,
);
await check(
  "Storage denial keeps focus on and reports error",
  `${host}.querySelector('[role=alert]')!==null && location.pathname==='/direct/inbox/' && document.documentElement.getAttribute('data-instagram-focus')==='on'`,
);
await browse("screenshot", `${evidence}/storage-error.png`, "--viewport");
await browse("goto", "http://127.0.0.1:4174/accounts/login/");
await check(
  "Login is untouched",
  "!document.querySelector('instagram-focus-controls') && getComputedStyle(document.getElementById('home')).display!=='none'",
);
await browse("goto", "http://127.0.0.1:4174/reels/");
await browse("wait", "instagram-focus-controls");
await check(
  "Direct Reels navigation returns to inbox",
  "location.pathname==='/direct/inbox/'",
);
for (const width of [375, 768, 1280]) {
  await browse("goto", "http://127.0.0.1:4173/");
  await browse("viewport", `${width}x900`);
  await check(
    `Installation page reflows at ${width}px`,
    "document.documentElement.scrollWidth<=innerWidth",
  );
  await capturePage(`${evidence}/site-${width}.png`);
}
await writeFile(
  `${evidence}/checks.json`,
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      scope:
        "Local real-browser harness executing the production content script; not an authenticated Instagram or physical iPhone test",
      checks,
    },
    null,
    2,
  ),
);
console.info(`Saved ${checks.length} checks and screenshots to ${evidence}`);
