# Design contract — v0.3.0

Keep the real Instagram interface. No fabricated inbox, feed or login. The supplied classic icon remains the only image asset on the installation page. Dark neutral surfaces and blue actions follow shared tokens in src/tokens.ts.

## Tokens and layout

Background #101114; surface #202126; text #f5f5f7; muted #b9bbc4; border #42444c; primary #1769e8; hover #1255bd; focus #86bcff. System font, body 16px/1.6, labels 14px, heading 24px. Spacing 4/8/12/16/24/32/48px. Content width 760px; padding 24px mobile, site desktop 48px. 12px controls, 44px minimum targets, 3px focus outlines.

## Components

- Remove Focus and posting mode completely. No import/export controls.
- On Home and profiles, a compact bottom navigation has Home, Messages, Search and Profile. Safe-area padding protects iPhone controls. The bar is absent in stories and messages to avoid covering native controls. Body has bottom clearance.
- Profile becomes available when the signed-in account is resolved. A small live status reports automatic checks or temporary failure. No approval prompts or recurring manual setup.
- Search is a full-page shadow DOM surface at /#user-search with a Back link. It accepts an exact username and opens the native profile; no results grid or Explore content. Underlying content is hidden while open.
- Installation stays three short steps, then collapsed Home Screen/help/desktop instructions. Classic icon and concise text.
- No decorative motion. Hover/focus/active states use shared tokens. Keyboard form submission, native validation and readable error feedback.

## Verification limits

Capture search/site at 375/768/1280px, plus search error, automatic pending/unavailable states, Home and mutual/own/nonmutual profiles in the local fixture. This proves local UI and adapter behavior, not authenticated Instagram or physical iPhone execution. Unknown authors/grids stay hidden.
