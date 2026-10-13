import { articleAuthor, POSTS, postMedia, profileName } from "./authors";
import { mediaId, mediaOwner } from "./policy";

// Div cards need a single owner-qualified post and a matching author before its media.
export function discoverPosts(doc: Document): readonly Element[] {
  for (const node of doc.querySelectorAll("[data-instagram-friends-post]")) {
    node.removeAttribute("data-instagram-friends-post");
    node.removeAttribute("data-instagram-friends-approved");
  }
  const posts = new Set(doc.querySelectorAll(POSTS));
  for (const link of doc.querySelectorAll<HTMLAnchorElement>(
    'main a[href],[role="main"] a[href]',
  )) {
    const url = new URL(link.href, doc.baseURI);
    const id = mediaId(url.pathname);
    const owner = mediaOwner(url.pathname);
    if (
      !id ||
      !owner ||
      url.origin !== new URL(doc.baseURI).origin ||
      link.closest(POSTS)
    )
      continue;
    for (
      let card = link.parentElement;
      card && !card.matches('main,[role="main"],aside,[role="complementary"]');
      card = card.parentElement
    ) {
      if (card.querySelector(POSTS)) break;
      const ids = new Set(
        Array.from(card.querySelectorAll<HTMLAnchorElement>("a[href]"))
          .map((anchor) => mediaId(new URL(anchor.href, doc.baseURI).pathname))
          .filter(Boolean),
      );
      if (ids.size > 1) break;
      const author = articleAuthor(card);
      const awaitingMedia =
        !author &&
        !postMedia(card) &&
        Array.from(card.querySelectorAll<HTMLAnchorElement>("a[href]")).some(
          (anchor) => {
            const profile = new URL(anchor.href, doc.baseURI);
            return (
              profile.origin === url.origin &&
              profileName(profile.pathname) === owner
            );
          },
        );
      if (author !== owner && !awaitingMedia) continue;
      const owners = Array.from(
        card.querySelectorAll<HTMLAnchorElement>("a[href]"),
      )
        .map((anchor) => mediaOwner(new URL(anchor.href, doc.baseURI).pathname))
        .filter(Boolean);
      if (owners.some((name) => name !== owner)) break;
      card.setAttribute("data-instagram-friends-post", "");
      posts.add(card);
      break;
    }
  }
  return [...posts];
}
