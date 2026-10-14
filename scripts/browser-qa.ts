import { writeFile } from "node:fs/promises";
import { browse, capture, check, evidence } from "./qa-browser";

const base = "http://127.0.0.1:4174";
const hidden =
  "id=>{const e=document.getElementById(id);return !!e&&!!e.closest('[data-instagram-focus-surface-hidden]')}";
async function eventually(name: string, expression: string): Promise<void> {
  const until = Date.now() + 15000;
  while ((await browse("js", expression)) !== "true") {
    if (Date.now() > until) throw new TypeError(`Timed out: ${name}`);
    await Bun.sleep(150);
  }
  await check(name, expression);
}
await browse("goto", base);
await browse(
  "js",
  "document.cookie='ds_user_id=1;path=/';document.cookie='qa_mode=ok;path=/';document.cookie='qa_follow=on;path=/';localStorage.clear();sessionStorage.clear()",
);
await browse("goto", base);
await browse("viewport", "375x900");
await check(
  "No custom toolbar, Focus, search page, or import controls",
  "!document.querySelector('instagram-friends-nav,instagram-user-search,instagram-focus-controls,input[type=file]')",
);
await check(
  "Original navigation DOM and styles retained",
  "document.querySelector('nav')===window.originalNavigation&&getComputedStyle(document.querySelector('#explore')).display!=='none'&&getComputedStyle(document.body).paddingBottom==='120px'",
);
await capture("checking");
await eventually(
  "Missing legacy flags recovered through authenticated GraphQL",
  `!(${hidden})('friend-video')&&(${hidden})('next-video')&&(${hidden})('suggested')`,
);
await check(
  "No manual data stored",
  "localStorage.length===0&&sessionStorage.length===0",
);
await capture("home");
await browse("js", "document.cookie='ds_user_id=99;path=/'");
await eventually(
  "Account switch clears followed approval",
  `(${hidden})('friend-video')`,
);
await capture("account-switched");
await browse(
  "js",
  "document.cookie='ds_user_id=1;path=/';document.cookie='qa_mode=owner-unsupported;path=/'",
);
await browse("goto", base);
await eventually(
  "Unavailable owner does not stop successful author checks",
  `!(${hidden})('friend-video')`,
);
await capture("owner-unavailable-recovered");
await browse("js", "document.cookie='qa_mode=ok;path=/'");
await browse("click", "#explore");
for (const width of [375, 768, 1280]) {
  await browse("viewport", `${width}x900`);
  await check(
    `Native search visible at ${width} without Explore posts`,
    `location.pathname==='/explore/'&&!(${hidden})('person-result')&&(${hidden})('friend-video')&&(${hidden})('next-video')&&document.documentElement.scrollWidth<=innerWidth`,
  );
  await capture(`search-${width}`);
}
await browse("viewport", "375x900");
await browse("fill", "#native-search", "friend");
await browse("click", "#person-result");
await eventually(
  "Search result opens followed profile without import",
  `location.pathname==='/friend/'&&!(${hidden})('grid-post')&&(${hidden})('profile-recommended')`,
);
await capture("profile-friend");
await browse("js", "document.cookie='qa_follow=off;path=/'");
await browse("click", "#follow");
await eventually(
  "Native Follow change revokes approval",
  `(${hidden})('grid-post')`,
);
await capture("profile-follow-change");
await browse("js", "document.cookie='qa_follow=on;path=/'");
await browse("click", "#profile");
await eventually(
  "Own profile accessible from original button",
  `!(${hidden})('grid-post')`,
);
await capture("profile-own");
await browse("goto", `${base}/stranger/`);
await eventually(
  "Unfollowed profile retains Follow but hides posts",
  `!(${hidden})('follow')&&(${hidden})('grid-post')`,
);
await capture("profile-stranger");
await browse("click", "#inbox");
await check(
  "Messages keep native composer",
  "location.pathname==='/direct/inbox/'&&getComputedStyle(document.querySelector('#composer')).display!=='none'",
);
await capture("messages");
await browse("js", "document.cookie='qa_mode=blocked;path=/'");
await browse("goto", base);
await eventually(
  "Rate limit explained without adding toolbar",
  `(${hidden})('friend-video')&&document.querySelector('[data-instagram-friends-status]')?.textContent.includes('(429)')`,
);
await capture("rate-limited");
await browse("js", "document.cookie='qa_mode=ok;path=/'");
await browse("goto", `${base}/accounts/login/`);
await check(
  "Login untouched",
  "document.documentElement.getAttribute('data-instagram-focus')==='off'&&!document.querySelector('[data-instagram-friends-status]')",
);
await capture("login");
for (const width of [375, 768, 1280]) {
  await browse("goto", "http://127.0.0.1:4173/");
  await browse("viewport", `${width}x900`);
  await check(
    `Install page reflows at ${width}`,
    "document.documentElement.scrollWidth<=innerWidth",
  );
  await capture(`site-${width}`);
}
await browse("viewport", "375x900");
for (const id of ["homescreen", "help", "desktop"]) {
  await browse("click", `#${id} summary`);
  await capture(`site-${id}`);
  await browse("click", `#${id} summary`);
}
await writeFile(
  `${evidence}/browser-result.json`,
  JSON.stringify(
    {
      passed: true,
      scope:
        "Production script and HTTP adapter against synthetic legacy-missing-flags, GraphQL, owner-failure and rate-limit fixtures. Native fixture controls preserved. Not authenticated Instagram or physical iPhone verification.",
      time: new Date().toISOString(),
    },
    null,
    2,
  ),
);
