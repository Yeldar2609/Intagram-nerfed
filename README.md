# Instagram friends extension

[Install / update](https://yeldar2609.github.io/Intagram-nerfed/) · v0.3.4

A free personal extension for Instagram's actual website, with its original navigation and search controls. Stories and messages remain available. Posts are shown from accounts you follow and your own account. They do not need to follow you back. Native people search remains available with Explore media hidden. No custom toolbar, Focus button, posting mode, exports or imports.

## Setup

Follow the three short steps on the [installation page](https://yeldar2609.github.io/Intagram-nerfed/), then sign in on Instagram. Friend checks run automatically in that session. Keep only one script copy enabled and close old tabs after updating.

**Story posting:** Instagram's [current mobile-browser help](https://help.instagram.com/1257341144298972/?cms_platform=mobile-touch) says story sharing is unavailable in mobile browsers. This extension preserves existing native creation controls and editors; it cannot add an unsupported Safari story uploader. Viewing stories remains available.

v0.3.4 replaces mutual-friend checks with following-only checks. Missing follow-back information no longer rejects an otherwise confirmed followed account or triggers extra fallback requests. Feed loading, native controls and single-video protections are preserved.

## Automatic checks

The extension reads the non-secret `ds_user_id` account identifier to isolate checks when accounts switch. The browser sends its normal session cookies directly to Instagram; the extension does not extract passwords or session tokens. It checks only authors encountered on the current page and the visited profile, using same-origin web requests. Positive and negative results expire after five minutes; native Follow/Unfollow actions trigger earlier rechecks. No follow list is downloaded or manually maintained. Results live only in this tab's memory and are cleared on account change or reload.

Author checks start sequentially, at least three seconds apart; a fallback can make additional requests within a check. Authentication, rate-limit, network and server failures pause checks for at least a minute and respect longer Retry-After values. Missing metadata for one account does not pause all authors. Unverified or expired authors remain hidden. A small inline status explains pending checks or a safe error reason/code. Stories, messages and native navigation remain usable.

This uses Instagram's undocumented web endpoints, not an official personal-account API. Requests include the session's CSRF header and fall back to web profile queries when legacy metadata is missing. Query IDs, variables and nested relationship fields follow [Instagrapi's pinned web implementation](https://github.com/subzeroid/instagrapi/blob/5a61562cfc87b232f2b492b03264adaa10fef65d/instagrapi/mixins/user.py#L279-L327); session headers follow its [web request helper](https://github.com/subzeroid/instagrapi/blob/5a61562cfc87b232f2b492b03264adaa10fef65d/instagrapi/mixins/public.py#L513-L577). A matching identity and confirmation that you follow the account are required; follower status is ignored. These endpoints can change or reject requests. Authenticated compatibility remains unverified on the user's account; local tests cannot establish that the reported live failure is resolved.

## Limits

Instagram's page structure can change. Unknown post authors and unsupported profile grids stay hidden. Supported grids use a native tabpanel, grid role, thumbnail article immediately after the selected Posts tab, or matching owner-qualified permalink. This filters posts Instagram loads; it does not fetch a complete or chronological friends feed. Checks are not instantaneous: a remote follow change may take up to five minutes plus request queue time to appear.

The classic icon is the user's supplied asset. On iPhone use a Shortcuts home-screen icon opening Instagram in Safari, where Userscripts can run. Standalone installed web apps may not run Safari extensions. Independent personal project, not affiliated with Instagram / Meta.

## Development

`pnpm install`, `pnpm typecheck`, `pnpm check`, `pnpm test`, `pnpm build`.

`pnpm serve` starts the installation page at port 4173 and a synthetic Instagram/HTTP fixture at 4174. With `BROWSE_BIN` pointing to gstack browse, run `bun scripts/browser-qa.ts` and `bun scripts/scroll-qa.ts`. The fixture uses synthetic relationships; it is never deployed. These tests do not replace signed-in Instagram or physical iPhone verification.
