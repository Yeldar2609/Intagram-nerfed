import { writeFile } from "node:fs/promises";
import { browse, capture, check, evidence } from "./qa-browser";

const base = "http://127.0.0.1:4174";
const photo =
  '<img width="240" height="240" alt="Synthetic friend photo" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22240%22%3E%3Crect width=%22240%22 height=%22240%22 fill=%22%231769e8%22/%3E%3C/svg%3E">';
const visible =
  "id=>{const e=document.getElementById(id);return !!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility==='visible'&&!e.closest('[data-instagram-focus-surface-hidden]')}";
const avatar = photo
  .replace('width="240" height="240"', 'width="32" height="32"')
  .replace("Synthetic friend photo", "friend's profile picture");
async function eventually(name: string, expression: string): Promise<void> {
  const deadline = Date.now() + 20_000;
  while ((await browse("js", expression)) !== "true") {
    if (Date.now() > deadline) throw new TypeError(`Timed out: ${name}`);
    await Bun.sleep(150);
  }
  await check(name, expression);
}
async function markup(html: string): Promise<void> {
  await browse(
    "js",
    `document.querySelector('main').innerHTML=${JSON.stringify(html)};document.querySelector('footer')?.remove()`,
  );
}
await browse("goto", base);
await browse(
  "js",
  "document.cookie='ds_user_id=1;path=/';document.cookie='qa_mode=ok;path=/';document.cookie='qa_follow=on;path=/'",
);
await browse("goto", base);
await browse("viewport", "375x900");
await markup(
  `<section><div id="friend-card"><div><a href="/stories/friend/123/">${avatar}</a><a id="author" href="/friend/">friend</a></div>${photo.replace("<img", '<img id="feed-photo"')}<a href="/friend/p/one/">Today</a></div><div id="stranger"><a href="/stranger/">stranger</a>${photo}<a href="/stranger/p/two/">Today</a><p><a href="/friend/">friend</a> mentioned in caption</p></div></section>`,
);
await eventually(
  "Div feed card with story avatar is verified and visible; caption does not approve stranger",
  `(${visible})('feed-photo')&&!(${visible})('stranger')`,
);
await capture("feed-visible");
await browse(
  "js",
  "document.querySelector('#author').href='/stranger/';document.querySelector('#author').textContent='stranger'",
);
await eventually(
  "Recycled native feed photo is hidden after author changes",
  `!(${visible})('feed-photo')`,
);
await capture("feed-recycled");

await browse("goto", base);
await markup(
  '<section><div id="deferred"><div><a href="/friend/">friend</a></div><div id="placeholder" style="height:300px;visibility:visible">Pending media</div><a href="/friend/p/deferred/">Today</a></div></section>',
);
await eventually(
  "Unfinished div card retains geometry while its contents stay hidden",
  "(()=>{const e=document.querySelector('#deferred');return e.hasAttribute('data-instagram-friends-pending')&&e.getBoundingClientRect().height>=300&&getComputedStyle(e).visibility==='hidden'&&getComputedStyle(document.querySelector('#placeholder')).visibility==='hidden'})()",
);
await capture("feed-pending");
await browse(
  "js",
  `(()=>{const e=document.querySelector('#deferred');const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){e.insertAdjacentHTML('beforeend',${JSON.stringify(photo)});observer.disconnect()}});observer.observe(e)})()`,
);
await eventually(
  "Real IntersectionObserver can mount delayed media, enabling friend verification",
  `(${visible})('deferred')&&!!document.querySelector('#deferred img')`,
);
await capture("feed-hydrated");

await browse("goto", `${base}/friend/`);
await markup(
  `<article id="profile-shell"><header><h2>friend</h2></header><div><a id="owned" href="/friend/p/one/">${photo}</a><a id="unknown" href="/p/unknown/">${photo}</a><a id="other" href="/stranger/p/two/">${photo}</a></div></article>`,
);
await eventually(
  "Profile wrapper preserves only the mutual owner's qualified thumbnail",
  `(${visible})('owned')&&!(${visible})('unknown')&&!(${visible})('other')`,
);
await capture("profile-owned");
await writeFile(
  `${evidence}/result.json`,
  JSON.stringify(
    {
      passed: true,
      scope:
        "Compiled production script, synthetic local DOM/HTTP. Real browser geometry and IntersectionObserver tested. Actual Instagram account and iPhone not accessed.",
      time: new Date().toISOString(),
    },
    null,
    2,
  ),
);
