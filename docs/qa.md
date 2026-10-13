# Verification record — v0.3.3

13 October 2026. The user confirmed posts return when Userscripts is disabled. Local fixtures contain synthetic data and execute the compiled production content script. No private Instagram account or physical iPhone was accessed.

85 unit tests cover story-avatar author boundaries, nonsemantic feed cards, qualified thumbnails inside article wrappers, pending media, retained verification errors and all prior relationship, navigation and video policies. Bug reproductions failed before their fixes; additional negative cases check caption mentions, mixed-owner grids and recycled cards on Home and profiles.

Browser QA: scripts/mobile-qa.ts drives the compiled script and local HTTP fixture through mobile Home, available native creator/editor controls, own/mutual/nonmutual article grids, owner-qualified links and follow revocation. These are DOM compatibility fixtures, not replicas of Instagram or proof of story publishing. Evidence: ignored work/qa/v033-compat. Installation page is captured at 375/768/1280px and expanded help. scripts/scroll-qa.ts verifies 15 story/video protections, including username-qualified Reel URLs opening in the single-post view.

scripts/feed-qa.ts also drives a real IntersectionObserver: a hidden unfinished card retains geometry, receives its delayed image, triggers author verification and becomes visible. This specifically tests the loading mechanism absent from earlier static fixtures. Fresh evidence is under work/qa/v033-feed and work/qa/v033-compat. It establishes local mechanisms, not the exact DOM variant on the user's phone.

## Limits

- Signed-in Instagram DOM/API and physical iPhone remain unverified. The user reported no API error in v0.3.2 but missing posts and no story creation button.
- Instagram's official mobile-browser story help (https://help.instagram.com/1257341144298972/?cms_platform=mobile-touch), checked 11 October 2026, says story publishing is unavailable. Preserving a native creation editor does not add unsupported story publishing.
- Unknown authors, ambiguous grids and unverified relationships remain hidden. English creation labels are recognized; links and upload inputs provide non-label signals.
- No imports, external posting, follower-list export, or actual media publication was used for testing.
