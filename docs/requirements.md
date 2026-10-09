# Feature requirements

Source: the user's four reference screenshots and request. Two screenshots show the same feature card. Marketing screenshots establish desired behavior; they are not evidence of a technical integration or permission grant.

## Requested outcome

Deliver a working, free personal Instagram companion, host its web surface online, and support an iPhone home-screen installation. Preserve the public repository name `Intagram-nerfed`. Do not add AI contributor or co-author attribution.

## Acceptance criteria

| Requirement | Evidence required for completion | Current status |
| --- | --- | --- |
| Personal Instagram inbox | Actual signed-in account loads real conversations; sending a message delivers it to its recipient | Not implemented; standalone website integration blocked by platform constraints |
| Distraction-free messaging | Feed, Explore, and Reels navigation and direct routes stay unavailable while messaging remains functional | Not implemented; requires control inside Instagram's page or a native container |
| Optional lock | User can enable and disable the restriction with a clear indication of what it controls | Not implemented |
| Two short daily passes | First pass is five minutes, second is one minute, as shown in the reference; state survives restart and resets at the next local day | Not implemented |
| Intent before unlocking | User chooses Post a story, Call someone, Post a picture or Reel, or Something else | Not implemented |
| Expiry enforcement | Restricted surfaces become unavailable when the pass expires, including after backgrounding and reopening | Not implemented; a website cannot enforce this against another app |
| Posting and calling | A valid pass enables actual posting/calling using Instagram's supported surface, with platform-specific limitations disclosed | Not implemented |
| Mobile installation | Verified manifest, icons, standalone display, safe-area layout, and home-screen launch on an iPhone | Not implemented |
| Online hosting | Public HTTPS URL serves the application successfully | Not implemented |
| Free to use | No project subscription or paid backend dependency; any platform distribution cost disclosed before choosing that route | Architecture pending |
| Public source | Public repository under the user's account | Verified: Yeldar2609/Intagram-nerfed |
| Attribution | No AI authors or co-author trailers | Verified for initial repository commit; recheck at release |

## Clarifications needed for implementation

The user must choose between a different installation method and reduced web-only functionality. Do not silently replace the requested personal inbox with demo conversations, a professional-account inbox, or an Instagram launch button.

The exact behavior of screenshot features that depend on Instagram, including notes, attachments, calls, and shared Reels in messages, must be tested against the real integration. An imitation chat UI is not proof of support.

## Data handling

- Do not request Instagram passwords in this project's UI.
- Keep Instagram login on Instagram's own origin.
- Do not publish credentials, cookies, session tokens, private messages, or the user's reference attachments in the repository.
- Any local preference or pass counter must clearly state whether it is advisory or enforced, and what happens when storage is cleared.
