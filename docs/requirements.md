# Current requirements

Updated 9 October 2026. This supersedes the original website-only feasibility decision.

The user authorized a website extension for a Personal Instagram account, with messaging, fewer distractions, occasional story posting, and a home-screen shortcut named Instagram using the original 2016 icon if possible. Native-app blocking, daily passes, and timed unlocks were removed from scope.

| Requirement | Implementation | Verification needed |
| --- | --- | --- |
| Real personal inbox | Operates on Instagram's own document and session; no replacement API or synthetic inbox | Sign-in and message delivery on user's device |
| Hide distractions | Route policy and dynamic link filtering for Home, Explore, Reels, and story browsing | Unit tests, browser fixture, then real Instagram DOM |
| Occasional posting | User-controlled posting mode restores Instagram's own controls | Native web upload availability must be checked on user's account; no new story API is provided |
| No app blocking | No Screen Time, timers, daily allowances, or device restrictions | Source review |
| Home-screen launch | Shortcuts Open URLs action opens inbox in Safari | Physical iPhone check; standalone web app is not a supported substitute |
| Name and icon | Instagram shortcut name; original 2016 artwork supplied | User selects name/icon when adding shortcut |
| Free distribution | Userscripts host extension for iOS; unpacked desktop extension; GitHub Pages installation site | Public downloads and Pages deployment |
| Public source and attribution | Yeldar2609/Intagram-nerfed, user's author identity, no AI co-author trailers | Remote commit and contributor inspection |

## Do not overclaim

A browser fixture is labeled synthetic and is not shipped in the installation site. A green test suite is not proof of authenticated account behavior. Userscripts must be installed and enabled on the user's device before the Focus button appears. Posting mode exposes the regular website temporarily, with no automatic return timer. The original screenshot's full native-app feature parity is not claimed.
