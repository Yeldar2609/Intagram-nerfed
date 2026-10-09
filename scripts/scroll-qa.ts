import { mkdir, writeFile } from "node:fs/promises";

const browser = process.env["BROWSE_BIN"];
if (!browser)
  throw new TypeError("Set BROWSE_BIN to the gstack browse executable");
const checks: string[] = [];
async function browse(...args: string[]): Promise<string> {
  const child = Bun.spawn([browser ?? "", ...args], {
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
async function visit(path: string): Promise<void> {
  await browse("goto", `http://127.0.0.1:4174${path}`);
  await browse("wait", "instagram-focus-controls");
}
const hidden = "e=>!!e.closest('[data-instagram-focus-surface-hidden]')";
await visit("/");
await browse("js", "sessionStorage.clear()");
await visit("/");
await check(
  "Home preserves friends stories and hides feed and recommendations",
  `!(${hidden})(document.querySelector('#story')) && ['friend-video','next-video','suggested'].every(id=>(${hidden})(document.getElementById(id))) && location.pathname==='/'`,
);
await browse(
  "js",
  "document.querySelector('main').insertAdjacentHTML('beforeend','<article id=new-post>New post</article>')",
);
await browse(
  "js",
  "document.querySelector('#new-post').hasAttribute('data-instagram-focus-surface-hidden')",
);
await check(
  "Dynamically inserted Home posts stay hidden",
  "getComputedStyle(document.querySelector('#new-post')).display==='none'",
);
await browse("click", "#story");
await check(
  "Story viewer remains accessible and scroll gestures are not blocked",
  "(()=>{const e=new WheelEvent('wheel',{bubbles:true,cancelable:true});document.body.dispatchEvent(e);return location.pathname==='/stories/friend/123/' && !e.defaultPrevented})()",
);
await visit("/reel/friend/");
await check(
  "Shared Reel opens the same media as a single post",
  "location.pathname==='/p/friend/'",
);
await check(
  "Opened video stays visible and recommendations hide",
  `!(${hidden})(document.querySelector('#friend-video')) && (${hidden})(document.querySelector('#next-video'))`,
);
await check(
  "Wheel and touchmove cannot scroll to another video",
  "['wheel','touchmove'].every(type=>{const e=new Event(type,{bubbles:true,cancelable:true});document.body.dispatchEvent(e);return e.defaultPrevented})",
);
await check(
  "Keyboard scroll is blocked without blocking message typing",
  "(()=>{const a=new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true});document.body.dispatchEvent(a);const b=new KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true});document.querySelector('input').dispatchEvent(b);return a.defaultPrevented&&!b.defaultPrevented})()",
);
await check(
  "Photo carousel Next stays available",
  `!(${hidden})(document.querySelector('#photo-next'))`,
);
await check(
  "Video ended cannot trigger ancestor autoplay handler",
  "(()=>{let advanced=false;document.body.addEventListener('ended',()=>advanced=true,{once:true});document.querySelector('video').dispatchEvent(new Event('ended',{bubbles:true}));return !advanced})()",
);
await browse("js", "history.pushState({},'', '/p/next/')");
await browse("wait", "html[data-instagram-focus-view=media]");
const deadline = Date.now() + 5000;
while ((await browse("url")) !== "http://127.0.0.1:4174/p/friend/") {
  if (Date.now() > deadline)
    throw new RangeError("Video route changed away from original post");
  await Bun.sleep(100);
}
await check(
  "SPA video advance returns to the originally opened post",
  "location.pathname==='/p/friend/'",
);
await visit("/direct/t/friend/");
await browse(
  "js",
  "document.body.insertAdjacentHTML('beforeend','<div role=dialog id=video-modal><video controls></video><video id=extra-video></video><a href=/p/next/>More videos</a></div>')",
);
await browse("wait", "html[data-instagram-focus-view=media]");
await check(
  "Video modal in messages is locked without a URL change",
  "(()=>{const e=new Event('touchmove',{bubbles:true,cancelable:true});document.querySelector('#video-modal').dispatchEvent(e);return e.defaultPrevented && location.pathname==='/direct/t/friend/' && getComputedStyle(document.querySelector('#extra-video')).display==='none'})()",
);
await browse("js", "document.querySelector('#video-modal').remove()");
await browse("wait", "html[data-instagram-focus-view=other]");
await check(
  "Closing the video restores conversation scrolling",
  "(()=>{const e=new WheelEvent('wheel',{bubbles:true,cancelable:true});document.body.dispatchEvent(e);return !e.defaultPrevented})()",
);
await browse(
  "js",
  "document.body.insertAdjacentHTML('beforeend','<div role=dialog><video></video></div>')",
);
await browse("wait", "html[data-instagram-focus-view=media]");
await browse("js", "history.pushState({},'', '/p/next/')");
const modalDeadline = Date.now() + 5000;
while ((await browse("url")) !== "http://127.0.0.1:4174/direct/t/friend/") {
  if (Date.now() > modalDeadline)
    throw new RangeError("Modal escaped into recommended video route");
  await Bun.sleep(100);
}
await check(
  "Message video modal cannot advance into a recommended post route",
  "location.pathname==='/direct/t/friend/'",
);
await visit("/p/friend/");
await browse(
  "js",
  "sessionStorage.setItem('instagram-focus-posting-v2','true')",
);
await visit("/p/friend/");
await check(
  "Explicit posting mode releases media scroll protection",
  "(()=>{const e=new WheelEvent('wheel',{bubbles:true,cancelable:true});document.body.dispatchEvent(e);return !e.defaultPrevented && document.documentElement.getAttribute('data-instagram-focus')==='off'})()",
);
await browse("js", "sessionStorage.clear()");
await visit("/");
await browse("viewport", "375x900");
await mkdir("work/qa", { recursive: true });
await browse("screenshot", "work/qa/stories-home.png", "--viewport");
await visit("/p/friend/");
await browse("screenshot", "work/qa/single-video.png", "--viewport");
await writeFile(
  "work/qa/scroll-checks.json",
  JSON.stringify(
    {
      scope:
        "Production script in synthetic browser fixture; signed-in Instagram/iPhone not verified",
      checks,
    },
    null,
    2,
  ),
);
console.info(`Passed ${checks.length} story/video browser checks`);
