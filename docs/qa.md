# Verification record — v0.3.0

11 October 2026. Local fixtures contain synthetic data and execute the compiled production content script. They never access a private Instagram account.

50 unit tests cover relationship parsing (both directions required), identity mismatch, missing fields, automatic lookup/cache expiration, account-switch races, follow-change invalidation, backoff, author attribution, misleading comment links, profile grids, unknown media, SPA recycling, route filtering and current-video selection.

Strict TypeScript, Biome and build pass. Browser QA uses the actual HTTP adapter against a local response fixture: automatic own/mutual identification, no imported/stored list, account switching, follow-change revocation, exact username search, profile filtering, HTTP 429 fallback, login preservation, and unobstructed message controls. The gstack process timed out while capturing the final static desktop disclosure; that screenshot was recaptured separately. All browser functional assertions completed before this tooling failure. Screenshots cover search/site at 375/768/1280px and interaction/error states. Evidence is under ignored work/qa/v030-auto.

The separate video suite checks shared Reel conversion, wheel/touch/keyboard locks, editable fields, carousel controls, ended events, SPA advances, same-URL DM dialogs, closing dialogs and ignored legacy posting bypass. Run scripts/browser-qa.ts and scripts/scroll-qa.ts with BROWSE_BIN set to gstack browse.

## Limits

- Authenticated Instagram endpoints and DOM, actual playback, installed extension hosts and physical iPhone were not available. The user previously confirmed messages worked.
- Local HTTP fixtures demonstrate implementation behavior, not permission or reliability of Instagram's live undocumented endpoints. The integration remains best effort and fails closed on missing data.
- English story/button labels plus native story links are supported; other DOM/language variants can hide legitimate content.
- Remote relationship changes may take five minutes plus queue time; follow/unfollow controls request earlier checks.
- Screen-reader interaction, 200% zoom, real notifications/calls and the home-screen shortcut remain unverified.

The import prototype was not published. Current v0.3.0 contains no manual import workflow.
