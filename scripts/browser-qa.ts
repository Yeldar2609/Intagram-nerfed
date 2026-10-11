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
  "No Focus panel or import controls",
  "!document.querySelector('instagram-focus-controls,instagram-friends-setup,input[type=file]')",
);
await capture("automatic-checking");
await eventually(
  "Automatic session checks show only mutual posts",
  `!(${hidden})('friend-video')&&(${hidden})('next-video')&&(${hidden})('suggested')`,
);
await check(
  "No manual friend data stored",
  "localStorage.length===0&&sessionStorage.length===0",
);
await eventually(
  "Own profile resolved automatically",
  "document.querySelector('instagram-friends-nav').shadowRoot.querySelector('#profile').getAttribute('href')==='/me/'",
);
await capture("home");
await browse("js", "document.cookie='ds_user_id=99;path=/'");
await eventually(
  "Account switch clears prior approvals",
  `(${hidden})('friend-video')&&document.querySelector('instagram-friends-nav').shadowRoot.querySelector('#profile').getAttribute('href')!=='/me/'`,
);
await capture("account-switched");
await browse("js", "document.cookie='ds_user_id=1;path=/'");
await browse("goto", `${base}/#user-search`);
for (const width of [375, 768, 1280]) {
  await browse("viewport", `${width}x900`);
  await check(
    `Search reflows at ${width}`,
    "document.documentElement.scrollWidth<=innerWidth",
  );
  await capture(`search-${width}`);
}
await browse("viewport", "375x900");
await browse("fill", "instagram-user-search input", "https://wrong");
await browse("click", "instagram-user-search button");
await check(
  "Search rejects URLs",
  "location.hash==='#user-search'&&document.querySelector('instagram-user-search').shadowRoot.querySelector('#error').textContent.length>0",
);
await capture("search-error");
await browse("fill", "instagram-user-search input", "@friend");
await browse("click", "instagram-user-search button");
await eventually(
  "Mutual profile opens automatically without import",
  `location.pathname==='/friend/'&&!(${hidden})('grid-post')&&(${hidden})('profile-recommended')`,
);
await capture("profile-friend");
await browse("js", "document.cookie='qa_follow=off;path=/'");
await browse("click", "#follow");
await eventually(
  "Follow change automatically revokes post approval",
  `(${hidden})('grid-post')`,
);
await capture("profile-follow-change");
await browse("js", "document.cookie='qa_follow=on;path=/'");
await browse("goto", `${base}/me/`);
await eventually("Own profile grid visible", `!(${hidden})('grid-post')`);
await capture("profile-own");
await browse("goto", `${base}/stranger/`);
await eventually(
  "Nonmutual profile keeps Follow and hides posts",
  `!(${hidden})('follow')&&(${hidden})('grid-post')`,
);
await capture("profile-stranger");
await browse("goto", `${base}/explore/`);
await browse("wait", "instagram-user-search");
await check(
  "Explore goes to username search without media",
  "location.hash==='#user-search'&&getComputedStyle(document.querySelector('main')).display==='none'",
);
await browse("goto", `${base}/direct/inbox/`);
await check(
  "Messages retain native controls without overlapping navigation",
  "!document.querySelector('instagram-friends-nav')&&getComputedStyle(document.querySelector('#composer')).display!=='none'",
);
await browse("goto", base);
await browse("js", "document.cookie='qa_mode=blocked;path=/'");
await browse("goto", base);
await eventually(
  "Rejected Instagram requests leave posts hidden and show status",
  `(${hidden})('friend-video')&&document.querySelector('instagram-friends-nav').shadowRoot.querySelector('#status').textContent.includes('unavailable')`,
);
await capture("automatic-unavailable");
await browse("js", "document.cookie='qa_mode=ok;path=/'");
await browse("goto", `${base}/accounts/login/`);
await check(
  "Login remains untouched",
  "document.documentElement.getAttribute('data-instagram-focus')==='off'&&!document.querySelector('instagram-friends-nav')",
);
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
        "Compiled production script with real HTTP adapter against a local Instagram response fixture. Not a signed-in Instagram or iPhone test.",
      time: new Date().toISOString(),
    },
    null,
    2,
  ),
);
