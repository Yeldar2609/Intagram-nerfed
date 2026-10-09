# Platform decision and sources

Updated 9 October 2026. The earlier website-only decision is superseded: the user authorized an extension for Instagram's website and a home-screen icon where possible.

## Chosen architecture

A content script runs on Instagram's own page, using the user's existing Instagram session. It changes navigation and link visibility; it does not implement a third-party Instagram API, collect credentials, or download private messages to a server. The same bundled script ships as a Manifest V3 desktop extension and a userscript for the Userscripts Safari extension.

The hosted website distributes the script, desktop ZIP, original icon, and installation guide. It does not pretend to be a personal-account OAuth client or inbox.

## iPhone distribution

Userscripts documents App Store installation, enabling the Safari extension, `.user.js` installation from a webpage or script directory, document-start injection and isolated content context. The implementation uses that mechanism without GM permissions or external runtime dependencies.

Primary documentation: https://github.com/quoid/userscripts#usage

No custom Apple developer account is needed to use an existing script-host extension. A custom Safari app extension would have Apple's separate packaging/distribution requirements: https://developer.apple.com/documentation/safariservices/safari-web-extensions

## Home-screen behavior

The supported recipe is an Apple Shortcuts home-screen icon that opens Instagram's inbox URL in Safari, with Safari set as the default browser. A standalone Add to Home Screen web app is not a verified extension execution context and is not represented as supported. Browser chrome remains visible. The installation guide includes the classic icon and manual shortcut steps.

## Posting limits

Posting mode exposes Instagram's own UI. It does not add a publishing API or guarantee that Instagram offers story uploading, calls, notifications, or attachments on every browser/account. That must be verified on the user's iPhone. The user removed timers, daily passes and app blocking.

## Why the standalone site was not used

A separate website cannot read or modify Instagram's document under the same-origin policy: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy

Meta's supported messaging integration targets professional accounts, while this user confirmed a Personal account: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api

The extension operates inside the Instagram page instead of pretending that signing in transfers Instagram access to another website.
