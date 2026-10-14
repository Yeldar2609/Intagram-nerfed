# Verification record — v0.3.4

14 October 2026. The requested policy is now people you follow, regardless of follow-back status. Own posts remain available. This changes relationship eligibility; it does not establish the exact cause of the user's still-empty iPhone feed.

Four assertions failed against v0.3.3: one-way following in the parser and HTTP fallback, and missing follow-back information in the parser and HTTP adapter. They pass with following-only eligibility. Tests retain negative cases for follower-only accounts, missing following information, identity mismatch, account switching, expiration and unfollowing.

Browser fixture relationships deliberately differ: friend is followed but does not follow back; stranger follows the viewer but is not followed. The compiled production script must show friend posts on Home and profiles and hide stranger posts. The fixture uses real local HTTP and browser layout; it never accesses a private Instagram account.

Browser coverage: scripts/feed-qa.ts checks author discovery, recycled cards, real IntersectionObserver hydration and qualified profile thumbnails. scripts/browser-qa.ts covers native navigation/search, account switching, own/followed/unfollowed profiles, unfollowing, rate-limit/login states and the install page at 375/768/1280px. scripts/scroll-qa.ts checks 15 story/video protections. Fresh evidence: work/qa/v034-feed and work/qa/v034-browser.

## Limits

- Actual signed-in Instagram DOM/API, Safari Userscripts and physical iPhone remain unverified. Passing synthetic tests is not proof that the live empty-feed report is resolved.
- Unsupported layouts and unverified following status remain hidden. No follow list is imported or downloaded; the extension filters posts Instagram loads.
- Native controls are preserved. This change does not add mobile-browser story publishing or standalone web-app extension support.
