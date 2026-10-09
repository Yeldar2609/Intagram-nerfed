# Platform feasibility

Verified 9 October 2026 using the gstack browse browser and primary documentation.

## Standalone home-screen website

The browser's same-origin policy prevents a hosted page from reading or rewriting another origin's document or storage. Opening Instagram in a window or embedding it does not grant access to its private inbox or navigation. CORS requires the remote server's cooperation; it is not a client-side switch.

Source: [MDN: Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy).

Consequently, a standalone website can provide installation instructions and its own local features, but cannot implement the requested Instagram inbox and distraction filtering by changing Instagram from outside its origin. A locally stored timer cannot lock another website or the native Instagram app.

## Meta messaging API

Meta's documented Instagram messaging API supports professional Instagram accounts and has messaging requirements and restrictions. It is not a general replacement for an arbitrary personal Instagram inbox, including the complete group conversation experience in the reference.

Source: [Meta: Instagram messaging API](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api).

Do not build a professional-account integration and claim that it fulfills the user's personal messaging request.

## Native app restrictions

Apple's Family Controls framework requires native capabilities, authorization, and an entitlement. Distribution requires the applicable Apple setup and entitlement approval. This framework is not exposed as a PWA API.

Source: [Apple: Family Controls](https://developer.apple.com/documentation/familycontrols).

A native application is a possible route toward app-level restrictions. A native Instagram web container would still require real-device verification of login, messaging, media, calling, filtering, and navigation. Merely wrapping a URL is not feature parity.

## Safari extension

A Safari web extension can run permissioned content scripts on Instagram's own web pages, making distraction filtering technically possible without collecting Instagram credentials. The signed-in Instagram web experience supplies the real conversations.

Apple documents Safari extensions as iOS app extensions with a distribution process. They are a different installation from Add to Home Screen. The current documentation also links a packaging route through App Store Connect without a Mac; availability and account requirements must be checked before promising that route.

Source: [Apple: Safari web extensions](https://developer.apple.com/documentation/safariservices/safari-web-extensions).

An extension can restrict the Instagram web surface where it runs. It cannot independently shield the native Instagram app. Do not assume an iPhone standalone home-screen web app runs Safari extensions; verify the target context explicitly.

## Implementation decision

Pending the user's choice:

1. Browser extension: real Instagram web messaging and page restrictions, with a separate extension installation and testing against Instagram's changing DOM.
2. Native iPhone application: closest route toward the combined messaging and app restriction goal, with Apple build/distribution and entitlement dependencies.
3. Standalone website: meets hosting and home-screen installation requirements, but omits integrated personal DMs and enforced Instagram blocking. This is a scope change requiring the user's explicit choice.

The original goal remains incomplete until a route is selected, implemented, deployed or distributed as agreed, and verified on the target device.
