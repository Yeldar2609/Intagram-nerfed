# Verification record — v0.3.2

11 October 2026. Local fixtures contain synthetic data and execute the compiled production content script. No private Instagram account or physical iPhone was accessed.

73 unit tests include mobile profile grids with selected Posts tabs, decorated and avatar-only authors, role-based feed cards, owner-qualified URLs, strict mutual approval and revocation, loading sentinels, native creation controls and composer previews. Unknown recommendations and recycled links stay hidden. The prior relationship/API, account-switch, backoff, search, native navigation and current-video suites remain covered. New regression tests failed before the filter changes.

Browser QA: scripts/mobile-qa.ts drives the compiled script and local HTTP fixture through mobile Home, available native creator/editor controls, own/mutual/nonmutual article grids, owner-qualified links and follow revocation. These are DOM compatibility fixtures, not replicas of Instagram or proof of story publishing. Evidence: ignored work/qa/v032-mobile. Installation page is captured at 375/768/1280px and expanded help. scripts/scroll-qa.ts verifies 15 story/video protections, including username-qualified Reel URLs opening in the single-post view.

## Limits

- Signed-in Instagram DOM/API and physical iPhone remain unverified. The user reported no API error in v0.3.1 but missing posts and no story creation button.
- Instagram's official mobile-browser story help (https://help.instagram.com/1257341144298972/?cms_platform=mobile-touch), checked 11 October 2026, says story publishing is unavailable. Preserving a native creation editor does not add unsupported story publishing.
- Unknown authors, ambiguous grids and unverified relationships remain hidden. English creation labels are recognized; links and upload inputs provide non-label signals.
- No imports, external posting, follower-list export, or actual media publication was used for testing.
