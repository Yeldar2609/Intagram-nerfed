# Requirements — v0.3.4

- Real Instagram session, no separate login proxy.
- Keep stories/messages, remove Focus and posting mode.
- Preserve native creation controls and upload editors when present. Story publishing itself is unavailable in Instagram mobile web according to its current help; do not promise a working Safari story uploader.
- No import or reimport. Check whether the signed-in viewer follows each author automatically. Follow-back information is not required.
- Show recognized followed/own authors; hide unknown, expired or unverified authors.
- Recognize role-based articles, decorated author links, native article grids without tabpanels, and username-prefixed post links. Keep feed loading markers so more native posts can load.
- Identify own profile automatically. Other profiles retain Follow but hide unfollowed posts.
- Keep Instagram's original navigation and native people search; hide Explore media.
- One shared video at a time; preserve wheel/touch/keyboard/autoplay guards.
- Classic icon, free downloads, concise GitHub Pages setup.
- Throttle checks, isolate accounts, honor backoff. Never treat absent relationship data as approval.
