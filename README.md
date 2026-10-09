# Instagram — just messages

A free focus extension for Instagram's real website. Use your existing Personal account; sign in directly on Instagram.

**Install:** https://yeldar2609.github.io/Intagram-nerfed/

## What it does

- Redirects Home, Explore, Reels and story-browsing routes to your inbox.
- Hides links to those routes, including links Instagram inserts dynamically.
- Keeps Instagram's native conversations and account/security pages.
- Offers manual **Posting mode** to restore Instagram's regular navigation and Create controls. **Back to messages** restores filtering. No timers or daily limits.
- Includes the classic Instagram icon and instructions for a home-screen shortcut named **Instagram**.

Story uploading works only where Instagram itself supports it on the web. This extension does not add an unsupported publishing API. Reel links shared in chats are also hidden in focus mode; switch to posting mode to open them. Profile pages and ordinary shared posts are preserved. This is a distraction filter, not a security restriction.

## iPhone installation

Use the free, open-source [Userscripts Safari extension](https://github.com/quoid/userscripts). Install the `.user.js` file from the installation page, allow it on instagram.com, then refresh Instagram. No Apple developer account or custom native app is required.

For the home-screen icon, use Apple Shortcuts to open `https://www.instagram.com/direct/inbox/` in Safari, and choose the provided classic icon. **Standalone home-screen web apps are not the supported execution context:** they may not run Safari extensions. The shortcut opens Safari and its browser chrome remains visible. Set Safari as your default browser.

The installation page has the complete steps and downloadable icon. Check for the **Focus** button on Instagram to confirm that the script is running.

## Desktop

Download the extension ZIP from the installation page. Unzip it, enable Developer mode in Chrome/Edge's Extensions page, and choose **Load unpacked** on the folder containing `manifest.json`. Safari on Mac can use Userscripts.

## Privacy

No backend, analytics, API keys, password form, message scraping, or cookie access. The script changes navigation and visibility on Instagram. One boolean posting-mode preference is stored in the current tab's Instagram session storage. It remains active until you choose Back to messages or end that tab session; browser session restoration may preserve it. Removing the extension restores Instagram's normal interface.

The site uses GitHub Pages, and Instagram and GitHub have their own privacy policies. Instagram's name and icon are used at the owner's request for this independent personal project. It is not affiliated with Instagram, Meta, or Konvo.

## Develop

Requires Node 22, pnpm 10, and Bun 1.3.14.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm check
pnpm test
pnpm build
pnpm serve
```

Build output: `dist/extension` (Manifest V3 extension), `dist/site` (installation site, userscript, icon and extension ZIP). GitHub Actions tests and deploys `dist/site` to Pages on pushes to main.

The local server exposes the installation site on port 4173 and a synthetic extension test fixture on port 4174. The fixture is never deployed. With gstack browse installed, set `BROWSE_BIN` to its executable and run `bun scripts/browser-qa.ts` for repeatable browser checks and screenshots under ignored `work/qa`.

## Verification limits

See [QA evidence](docs/qa.md). Local tests do not establish that a private account can send messages or post a story, or that a physical iPhone runs the extension correctly. Those require a signed-in device check. No personal account has been accessed or message sent during development.

[Design contract](DESIGN.md) · [Requirements](docs/requirements.md) · [Icon attribution](assets/ATTRIBUTION.md)
