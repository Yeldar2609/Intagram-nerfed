# Design contract — v0.3.4

Keep the real Instagram interface. No fabricated inbox, feed or login. The supplied classic icon remains the only image asset on the installation page. Dark neutral surfaces and blue actions follow shared tokens in src/tokens.ts.

## Tokens and layout

Background #101114; surface #202126; text #f5f5f7; muted #b9bbc4; border #42444c; primary #1769e8; hover #1255bd; focus #86bcff. System font, body 16px/1.6, labels 14px, heading 24px. Spacing 4/8/12/16/24/32/48px. Content width 760px; padding 24px mobile, site desktop 48px. 12px controls, 44px minimum targets, 3px focus outlines.

## Components

- Remove Focus and posting mode completely. No import/export controls.
- Preserve existing native Create/Your story controls and upload editors. Do not invent a story-posting button when Instagram provides none. Mobile-browser story publishing is currently unsupported by Instagram.
- Preserve Instagram's own navigation DOM, icons, handlers and layout. No replacement toolbar, search page, or body-padding overrides. Reels-feed links remain hidden; original Home, Search, Messages and Profile controls stay native.
- A small inline live status before the main content reports pending checks or an error reason. No buttons or overlays. No approval prompts or recurring manual setup.
- Native Search retains input and people results while Explore post articles, grid links and non-avatar media are hidden. Legacy /#user-search bookmarks move to native /explore/search/.
- Installation stays three short steps, then collapsed Home Screen/help/desktop instructions. Classic icon and concise text.
- No decorative motion. Hover/focus/active states use shared tokens. Keyboard form submission, native validation and readable error feedback.

## Verification limits

Capture search/site at 375/768/1280px, plus automatic pending/unavailable states, Home and followed/own/unfollowed profiles in the local fixture. Native fixture controls are preserved, not replacements rendered by the extension. This proves local UI and adapter behavior, not authenticated Instagram appearance or physical iPhone execution. Unknown authors/grids stay hidden.
