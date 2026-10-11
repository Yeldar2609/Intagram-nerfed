# Verification record — v0.3.1

11 October 2026. Local fixtures contain synthetic data and execute the compiled production content script. They never access a private Instagram account.

60 unit tests cover relationship parsing, identity mismatch, missing-field GraphQL fallback, CSRF/session request shape, exact username resolution, refusal/backoff, owner-failure isolation, cache expiration, account-switch races, follow-change invalidation, author attribution, profile grids, native navigation/search preservation, Explore media filtering and current-video selection.

Strict TypeScript, Biome and build pass. Browser QA exercises the compiled HTTP adapter against responses that deliberately omit legacy relationship flags and require a CSRF header on GraphQL. It verifies fallback success, unsupported owner recovery, account switching, native navigation DOM identity, native search/result navigation, follow-change revocation, own/nonmutual profiles, HTTP 429 explanation, login and message controls. The long gstack harness timed out during the final disclosure capture after all functional assertions passed; remaining captures were repeated in short runs and dimensions checked. Evidence is under ignored work/qa/v031-native. Search and site are captured at 375/768/1280px. Fixtures are not replicas or evidence of Instagram's actual current appearance.

The separate video suite checks shared Reel conversion, wheel/touch/keyboard locks, editable fields, carousel controls, ended events, SPA advances, same-URL DM dialogs, closing dialogs and ignored legacy posting bypass. Run scripts/browser-qa.ts and scripts/scroll-qa.ts with BROWSE_BIN set to gstack browse.

## Limits

- Authenticated Instagram endpoints and DOM, actual playback, installed extension hosts and physical iPhone were not available. The user previously confirmed messages worked.
- Local HTTP fixtures demonstrate implementation behavior, not permission or reliability of Instagram's live undocumented endpoints. The integration remains best effort and fails closed on missing data.
- English story/button labels plus native story links are supported; other DOM/language variants can hide legitimate content.
- Remote relationship changes may take five minutes plus queue time; follow/unfollow controls request earlier checks.
- Screen-reader interaction, 200% zoom, real notifications/calls and the home-screen shortcut remain unverified.

The import prototype was not published. Current v0.3.1 contains no manual import workflow.
