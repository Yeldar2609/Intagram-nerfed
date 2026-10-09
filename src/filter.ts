import { isDistractionPath } from "./policy";

export const HIDDEN = "data-instagram-focus-hidden";
type FilterLink = {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
};
type LinkDocument = {
  readonly baseURI: string;
  readonly links: Iterable<FilterLink>;
};
export function filterLinks(doc: LinkDocument, posting: boolean): void {
  for (const link of doc.links) {
    const href = link.getAttribute("href");
    if (href === null) continue;
    let url: URL;
    try {
      url = new URL(href, doc.baseURI);
    } catch (error) {
      if (error instanceof TypeError) continue;
      throw error;
    }
    const hide =
      !posting &&
      url.origin === new URL(doc.baseURI).origin &&
      isDistractionPath(url.pathname);
    if (hide && !link.hasAttribute(HIDDEN)) link.setAttribute(HIDDEN, "");
    if (!hide && link.hasAttribute(HIDDEN)) link.removeAttribute(HIDDEN);
  }
}

export const FILTER_CSS = `
html[data-instagram-focus="on"] [${HIDDEN}] { display: none !important; }
html[data-instagram-focus="redirecting"] body { visibility: hidden !important; }
`;
