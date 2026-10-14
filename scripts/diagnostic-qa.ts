import { writeFile } from "node:fs/promises";
import { browse, capture, check, evidence } from "./qa-browser";

await browse("goto", "http://127.0.0.1:4174/");
await browse("viewport", "375x900");
await browse(
  "js",
  "document.cookie='qa_mode=ok;path=/';document.cookie='qa_follow=on;path=/'",
);
await browse(
  "js",
  "document.querySelector('main').innerHTML='<div><a href=\"/private_account/\">private_account</a><a href=\"/p/private_id/\"><img alt=\"private_caption\"></a></div>';const s=document.createElement('script');s.src='http://127.0.0.1:4173/instagram-layout-check.user.js';document.head.append(s)",
);
const deadline = Date.now() + 10000;
while (
  (await browse(
    "js",
    "!!document.querySelector('instagram-layout-check')?.shadowRoot.querySelector('textarea')",
  )) !== "true"
) {
  if (Date.now() > deadline)
    throw new TypeError("Diagnostic panel did not load");
  await Bun.sleep(100);
}
await browse("click", "instagram-layout-check button:has-text('Refresh')");
await check(
  "Report identifies installed script and unrecognized bare-link card without private text",
  "(()=>{const r=JSON.parse(document.querySelector('instagram-layout-check').shadowRoot.querySelector('textarea').value);return r.installed==='0.3.4'&&r.counts.main===1&&r.counts.articles===0&&r.counts.postLinks===1&&!JSON.stringify(r).includes('private_')})()",
);
for (const width of [375, 768, 1280]) {
  await browse("viewport", `${width}x900`);
  await check(
    `Diagnostic panel fits ${width}`,
    "(()=>{const r=document.querySelector('instagram-layout-check').shadowRoot.querySelector('section').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()",
  );
  await capture(`panel-${width}`);
}
await browse("viewport", "375x900");
await browse(
  "js",
  "Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true})",
);
await browse("click", "instagram-layout-check button:has-text('Copy report')");
await check(
  "Copy fallback selects entire report when Clipboard API is unavailable",
  "(()=>{const s=document.querySelector('instagram-layout-check').shadowRoot;const t=s.querySelector('textarea');return t.selectionStart===0&&t.selectionEnd===t.value.length&&!!s.querySelector('[role=status]').textContent})()",
);
await capture("copy-fallback");
await browse("click", "instagram-layout-check button:has-text('Close')");
await check(
  "Close removes diagnostic panel without changing filter installation",
  "!document.querySelector('instagram-layout-check')&&document.documentElement.getAttribute('data-instagram-focus-installed')==='0.3.4'",
);
for (const width of [375, 768, 1280]) {
  await browse("goto", "http://127.0.0.1:4173/diagnose.html");
  await browse("viewport", `${width}x900`);
  await check(
    `Diagnostic instructions fit ${width}`,
    "document.documentElement.scrollWidth<=innerWidth",
  );
  await capture(`instructions-${width}`);
}
await writeFile(
  `${evidence}/result.json`,
  JSON.stringify(
    {
      passed: true,
      scope:
        "Separate compiled diagnostic script on synthetic DOM in Chromium. No Instagram session or iPhone. Clipboard API-unavailable manual-copy fallback tested.",
      time: new Date().toISOString(),
    },
    null,
    2,
  ),
);
