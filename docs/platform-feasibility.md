# Platform feasibility

The extension runs on Instagram's real website and session. The hosted page installs it; it is not a separate authenticated Instagram client.

Mutual checks use same-origin GET requests to Instagram's existing web profile endpoints. Both following and followed-by must be explicitly true. These are undocumented endpoints and can change, omit fields or reject requests. When they fail, posts stay hidden and checks retry after a delay. The browser supplies its existing cookies; no passwords or session tokens are extracted, persisted or sent to another service. Only the non-secret viewer account ID is read to isolate tab-memory caches. No export, local import, follower-list crawling, or separate server is required.

Results expire after five minutes and follow controls trigger faster checks. Account switching aborts in-flight requests and clears approvals. Three-second spacing limits requests per tab. HTTP failures apply backoff, including Retry-After. Visibility and DOM updates trigger filtering; no third-party requests are made by the extension.

On iPhone use Userscripts in Safari, opened from a Shortcuts home-screen icon. Standalone Home Screen web apps may not run Safari extensions. Desktop uses the packaged MV3 extension.

DOM filtering is best effort against changing Instagram markup. Unknown authors and unsupported grids stay hidden; this is not a complete custom friends timeline. Real signed-in Instagram, Safari extension hosting and physical iPhone behavior remain unverified.
