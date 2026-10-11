# Platform feasibility

The extension runs on Instagram's real website and session. The hosted page installs it; it is not a separate authenticated Instagram client.

Mutual checks use same-origin profile GET and web GraphQL POST requests. Both following and followed-by must be explicitly true. Undocumented endpoints can change, omit fields or reject requests. v0.3.1 adds web GraphQL fallback, replaces the mobile-style owner endpoint and distinguishes unsupported data from authentication/rate-limit failures. The browser supplies session cookies; the CSRF cookie is read only to send Instagram its CSRF header. The non-secret viewer account ID isolates tab-memory caches. Nothing is persisted or sent to another service. No export, import, follower-list crawling or separate server is required.

Results expire after five minutes and follow controls trigger faster checks. Account switching aborts in-flight requests and clears approvals. Author checks start three seconds apart; fallback requests within one check are sequential. Authentication, network, throttling and server failures apply global backoff including Retry-After. Unsupported metadata only delays the affected author. Visibility and DOM updates trigger filtering; no third-party requests are made by the extension.

On iPhone use Userscripts in Safari, opened from a Shortcuts home-screen icon. Standalone Home Screen web apps may not run Safari extensions. Desktop uses the packaged MV3 extension.

DOM filtering is best effort against changing Instagram markup. Unknown authors and unsupported grids stay hidden; this is not a complete custom friends timeline. Real signed-in Instagram, Safari extension hosting and physical iPhone behavior remain unverified.
