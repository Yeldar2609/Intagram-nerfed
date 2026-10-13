import { POSTS } from "./authors";

export function isCreatePath(path: string): boolean {
  return /^\/create(?:\/|$)/i.test(path);
}

export function isComposer(node: Element): boolean {
  if (node.querySelector('input[type="file"]')) return true;
  const heading = node
    .querySelector('h1,h2,[role="heading"]')
    ?.textContent?.trim();
  return /^(create new post|new post|new story|create story|crop|edit|share to story)$/i.test(
    heading ?? "",
  );
}

export function creationControls(main: Element): Element[] {
  return Array.from(
    main.querySelectorAll('button,[role="button"],a[href]'),
  ).filter((control) => {
    if (control.closest(`${POSTS},[role="feed"]`)) return false;
    const labels = [
      control.getAttribute("aria-label"),
      control.textContent,
      ...Array.from(control.querySelectorAll("svg[aria-label],svg title")).map(
        (icon) => icon.getAttribute("aria-label") ?? icon.textContent,
      ),
    ];
    return labels.some((label) =>
      /^(your story|add (?:to )?(?:your )?story|create|new post|new story|create story)$/i.test(
        label?.trim() ?? "",
      ),
    );
  });
}
