# Feature requirements

Source: the user's four reference screenshots and subsequent clarification on 9 October 2026. The clarification supersedes screenshot blocking and daily-pass features. The user confirmed that the Instagram account is Personal.

## Requested outcome

Deliver a working, free personal Instagram companion, host its web surface online, and support an iPhone home-screen installation. The user intends to delete the native Instagram app. Use the home-screen name `Instagram` and the original 2016 gradient camera icon. Preserve the public repository name `Intagram-nerfed`. Do not add AI contributor or co-author attribution.

## Acceptance criteria

| Requirement | Evidence required for completion | Current status |
| --- | --- | --- |
| Personal Instagram inbox | Actual signed-in account loads real conversations; sending a message delivers it to its recipient | Not implemented; standalone website integration blocked by platform constraints |
| Distraction-free messaging | Feed, Explore, and Reels navigation and direct routes stay unavailable while messaging remains functional | Not implemented; requires control inside Instagram's page or a native container |
| Occasional story posting | User can publish a real story to the confirmed Personal account without reinstalling the native Instagram app | Not implemented; supported integration must be established |
| No app blocking | Do not implement Screen Time controls, daily passes, intent gates, or timed unlocks | Removed from scope |
| Home-screen identity | Installed name is Instagram and icon is the requested 2016 gradient camera mark | Requested; not implemented |
| Mobile installation | Verified manifest, icons, standalone display, safe-area layout, and home-screen launch on an iPhone | Not implemented |
| Online hosting | Public HTTPS URL serves the application successfully | Not implemented |
| Free to use | No project subscription or paid backend dependency; any platform distribution cost disclosed before choosing that route | Architecture pending |
| Public source | Public repository under the user's account | Verified: Yeldar2609/Intagram-nerfed |
| Attribution | No AI authors or co-author trailers | Verified for initial repository commit; recheck at release |

## Remaining integration decision

The user has selected website-only and confirmed a Personal account. Do not ask them to select their account type again. These requirements do not have a supported standalone custom-website integration. Further progress requires accepting Instagram's own website (which retains its navigation), accepting a different installation method, or establishing a separately reviewed integration architecture. None has been accepted yet. Do not silently substitute demo conversations, a professional-account inbox, or an Instagram launch button.

The exact behavior of screenshot features that depend on Instagram, including notes, attachments, calls, and shared Reels in messages, must be tested against the real integration. An imitation chat UI is not proof of support.

## Data handling

- Do not request Instagram passwords in this project's UI.
- Keep Instagram login on Instagram's own origin.
- Do not publish credentials, cookies, session tokens, private messages, or the user's reference attachments in the repository.
- Do not implement the removed blocking or pass-counter features.
