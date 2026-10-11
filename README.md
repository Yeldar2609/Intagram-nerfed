# Instagram friends extension

[Install / update](https://yeldar2609.github.io/Intagram-nerfed/) · v0.3.0

A free personal extension for Instagram's actual website. Stories and messages remain available. Posts are shown only after the author is verified as a mutual friend, or as your own account. Search opens a profile by exact username without Explore posts. No Focus button, posting mode, exports or imports.

## Setup

Follow the three short steps on the [installation page](https://yeldar2609.github.io/Intagram-nerfed/), then sign in on Instagram. Friend checks run automatically in that session. Keep only one script copy enabled and close old tabs after updating.

## Automatic checks

The extension reads the non-secret `ds_user_id` account identifier to isolate checks when accounts switch. The browser sends its normal session cookies directly to Instagram; the extension does not extract passwords or session tokens. It checks only authors encountered on the current page and the visited profile, using same-origin web requests. Positive and negative results expire after five minutes; native Follow/Unfollow actions trigger earlier rechecks. No follow list is downloaded or manually maintained. Results live only in this tab's memory and are cleared on account change or reload.

Checks are sequential, at least three seconds apart. Rejected requests pause checks for at least a minute and respect longer Retry-After values. Unverified or expired authors remain hidden. A small status message explains pending or unavailable checks. Stories and messages remain usable while checks are unavailable.

This uses Instagram's undocumented web endpoints, not an official personal-account API. Those endpoints can change or reject requests. The [Instaloader source at da65e69](https://github.com/instaloader/instaloader/blob/da65e697a021be94e6ae20e33145fbf488351a73/instaloader/structures.py) documents the profile endpoints and following/follow-back fields used here. The extension requires both relationship directions and a matching returned username; missing data never grants access. Authenticated Instagram compatibility has not been verified on the user's account.

## Limits

Instagram's page structure can change. Unknown post authors and unsupported profile grids stay hidden. Supported profile grids use a native tabpanel. This filters posts Instagram loads; it does not fetch a complete or chronological friends feed. Search requires an exact username. Checks are not instantaneous: a remote follow change may take up to five minutes plus request queue time to appear.

The classic icon is the user's supplied asset. On iPhone use a Shortcuts home-screen icon opening Instagram in Safari, where Userscripts can run. Standalone installed web apps may not run Safari extensions. Independent personal project, not affiliated with Instagram / Meta.

## Development

`pnpm install`, `pnpm typecheck`, `pnpm check`, `pnpm test`, `pnpm build`.

`pnpm serve` starts the installation page at port 4173 and a synthetic Instagram/HTTP fixture at 4174. With `BROWSE_BIN` pointing to gstack browse, run `bun scripts/browser-qa.ts` and `bun scripts/scroll-qa.ts`. The fixture uses synthetic relationships; it is never deployed. These tests do not replace signed-in Instagram or physical iPhone verification.
