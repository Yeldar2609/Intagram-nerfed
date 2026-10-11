import { writeFile } from "node:fs/promises";
import { browse, capture, check, evidence } from "./qa-browser";

const base = "http://127.0.0.1:4174";
const visible =
  "id=>{const el=document.getElementById(id);return !!el&&el.getClientRects().length>0&&getComputedStyle(el).display!=='none'&&!el.closest('[data-instagram-focus-surface-hidden]')}";
async function eventually(name: string, expression: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  while ((await browse("js", expression)) !== "true") {
    if (Date.now() > deadline) throw new TypeError(`Timed out: ${name}`);
    await Bun.sleep(150);
  }
  await check(name, expression);
}
await browse("goto", base);
await browse(
  "js",
  "document.cookie='ds_user_id=1;path=/';document.cookie='qa_mode=ok;path=/';document.cookie='qa_follow=on;path=/'",
);
await browse("goto", base);
await browse("viewport", "375x900");
await browse("js", "document.querySelector('footer')?.remove()");
await browse(
  "js",
  `(()=>{document.querySelector('main').innerHTML='<div><button id="own-story">Your story</button><button id="create" aria-label="New post">+</button></div><div role="feed"><div role="article" id="mobile-post"><header><a href="/friend/">friend<svg><title>Verified</title></svg></a></header><a href="/friend/p/friend/">Friend photo</a><img width="160" height="160" alt="Synthetic friend photo" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Crect width=%22160%22 height=%22160%22 fill=%22%231769e8%22/%3E%3C/svg%3E"></div><div role="article" id="stranger"><header><a href="/stranger/">stranger</a></header><img></div><div id="load-more" style="height:4px"></div></div>';document.querySelector('#create').onclick=()=>{const d=document.createElement('div');d.role='dialog';d.id='editor';d.innerHTML='<h2>Create new post</h2><input id="upload" type="file" accept="image/*,video/*"><article><video id="preview" controls></video></article><button id="edit-next">Next</button>';document.querySelector('main').append(d);d.querySelector('#edit-next').onclick=()=>d.querySelector('h2').textContent='Edit'};return true})()`,
);
await eventually(
  "Mobile feed detects decorated author and preserves loading sentinel",
  `(${visible})('mobile-post')&&!(${visible})('stranger')&&(${visible})('load-more')`,
);
await check(
  "Existing native own-story and plus buttons remain visible",
  `(${visible})('own-story')&&(${visible})('create')&&!document.querySelector('instagram-friends-nav')`,
);
await capture("home-mobile");
await browse("click", "#create");
await eventually(
  "Native editor and its preview stay visible",
  `(${visible})('editor')&&(${visible})('preview')&&(${visible})('upload')`,
);
await check(
  "Upload preview does not activate video scroll lock",
  "(()=>{const e=new Event('touchmove',{bubbles:true,cancelable:true});document.querySelector('#editor').dispatchEvent(e);return !e.defaultPrevented})()",
);
await capture("editor");
await browse("click", "#edit-next");
await check(
  "Editor Next control retains its handler",
  "document.querySelector('#editor h2').textContent==='Edit'",
);
await capture("editor-next");
for (const name of ["friend", "me", "stranger"]) {
  await browse("goto", `${base}/${name}/`);
  await browse(
    "js",
    `(()=>{document.querySelector('[role=tabpanel]').removeAttribute('role');document.querySelector('#grid-shell').insertAdjacentHTML('beforebegin','<div role="tablist"><a role="tab" aria-selected="true">Posts</a></div>')})()`,
  );
  await eventually(
    `${name} profile supports article grid without tabpanel`,
    name === "stranger"
      ? `!(${visible})('grid-post')&&(${visible})('follow')`
      : `(${visible})('grid-post')&&!(${visible})('profile-recommended')`,
  );
  await capture(`profile-${name}`);
}
await browse("goto", `${base}/friend/`);
await browse(
  "js",
  "document.querySelector('#grid-shell').outerHTML='<div><a id=qualified href=/friend/p/friend/><img alt=Photo width=160 height=160></a><a id=other-owner href=/stranger/p/other/><img></a></div>'",
);
await eventually(
  "Owner-qualified links work without semantic grid markup",
  `(${visible})('qualified')&&!(${visible})('other-owner')`,
);
await browse(
  "js",
  `document.querySelector('#qualified img').src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#1769e8"/></svg>')`,
);
await capture("profile-qualified");
await browse("js", "document.cookie='qa_follow=off;path=/'");
await browse("click", "#follow");
await eventually(
  "Unfollow revokes previously visible qualified posts",
  `!(${visible})('qualified')`,
);
await capture("profile-revoked");
await browse("js", "document.cookie='qa_follow=on;path=/'");
for (const width of [375, 768, 1280]) {
  await browse("goto", "http://127.0.0.1:4173/");
  await browse("viewport", `${width}x900`);
  await check(
    `Install page fits ${width}`,
    "document.documentElement.scrollWidth<=innerWidth",
  );
  await capture(`site-${width}`);
}
await browse("goto", "http://127.0.0.1:4173/");
await browse("viewport", "375x900");
await browse("click", "#help summary");
await capture("site-help");
await writeFile(
  `${evidence}/result.json`,
  JSON.stringify(
    {
      scope:
        "Compiled script on synthetic mobile DOM/HTTP responses. Preserves existing creator controls; does not demonstrate Instagram story posting. Live Safari/account not accessed.",
      passed: true,
      time: new Date().toISOString(),
    },
    null,
    2,
  ),
);
