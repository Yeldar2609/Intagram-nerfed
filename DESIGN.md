# Instagram focus design

## 1. Atmosphere & Identity
Keep Instagram's real inbox intact. The supplied screenshots establish dark neutral surfaces, compact controls, and a blue primary action. Do not fabricate chat data or recreate the inbox. The requested classic Instagram icon is used at the user's direction; the installation page identifies this as an independent extension. This is an operational extension, not a marketing-site redesign.

## 2. Color
Dark background #101114; raised surface #202126; border #42444c; primary text #f5f5f7; secondary #b9bbc4; blue action #1769e8 (white label); hover #1255bd; focus #86bcff. Icon colors come from the user-supplied PNG asset. No decorative gradients beyond that asset.

Shared implementation tokens live in `src/tokens.ts`: included in the shadow-root stylesheet and emitted as the installation site's `tokens.css`. Spacing, typography, radii, focus, elevation and motion use these same variables on both surfaces.

## 3. Typography
Native system UI stack (-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif). Body 16px/1.6, label 14px/1.4, page heading responsive 32–48px/1.15, section heading 24px/1.3. Use native UI typography to blend with the user's inbox.

## 4. Spacing & Layout
4px base with 8/12/16/24/32/48px steps. Site max width 760px; mobile padding 24px, desktop 48px. Controls min-height 44px. Extension launcher fixed right 16px, bottom calc(80px + safe-area-inset-bottom); narrow settings panel width min(320px, viewport minus 32px). No full-page overlay, conversation scrolling stays unchanged except while a video dialog is open. Root feed stays hidden during route redirection.

## 5. Components
- Action link/button: 12px radius, primary blue or secondary dark. Hover color, active opacity, visible 3px focus outline, disabled native state. Real links for downloads and navigation.
- Focus launcher: 44px pill, text label, expanded ARIA state, opens a shadow-root panel. Kept separate from Instagram's DOM styling. Hidden on authentication routes.
- Focus panel: heading, current mode, Stories action, Messages action, Posting mode action, close button. Keyboard Escape closes and returns focus. No focus trap because the panel is nonmodal. Posting mode clearly exposes Instagram's regular site temporarily. No automatic publishing.
- Installation section: heading, numbered native list, download action. Steps remain visible without JavaScript. iPhone/desktop/shortcut sections are anchor-linked, not hidden tabs.
- Primitive harness: test fixture exposes launcher open/closed and focus/posting states; real screenshots at 375/768/1280px before release.

## 6. Motion & Interaction
No decorative motion. 120ms opacity feedback on buttons; reduced-motion disables transitions. Settings panel uses the native hidden state. Route filtering handles SPA navigation and DOM changes. User can always return to Messages, disable the extension, or remove the userscript.

## 7. Depth & Surface
One raised panel with 1px border and 0 8px 24px #0006 shadow. No nested cards. Site uses rules between instructional sections. Native Instagram layout is not restyled.

## 8. Accessibility Constraints & Accepted Debt
AA text contrast, visible focus, semantic buttons and headings, 44px controls, reflow at 375px, readable at 200% zoom. Persona: iPhone user seeking real conversations with fewer distractions; secondary: desktop keyboard user installing a local extension. Unverified items are test gaps, not accepted product debt: real iPhone extension execution, authenticated Instagram UI and story availability. Do not claim these pass without evidence.
