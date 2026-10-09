export const INBOX = "/direct/inbox/";
export function isAuthPath(path: string): boolean {
  return /^\/(accounts|challenge|checkpoint|oauth)(\/|$)/i.test(path);
}
export function isDistractionPath(path: string): boolean {
  return path === "/" || /^\/(explore|reels?|stories)(\/|$)/i.test(path);
}
export function shouldRedirect(path: string, posting: boolean): boolean {
  return !posting && isDistractionPath(path);
}
