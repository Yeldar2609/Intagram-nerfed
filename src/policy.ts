export const INBOX = "/direct/inbox/";
export const HOME = "/";
export function mediaId(path: string): string | undefined {
  return /^\/(?:p|reels?)\/([\w-]+)(?:\/|$)/i.exec(path)?.[1];
}
export function singlePostPath(path: string): string | undefined {
  const id = mediaId(path);
  return id ? `/p/${id}/` : undefined;
}
export function isAuthPath(path: string): boolean {
  return /^\/(accounts|challenge|checkpoint|oauth)(\/|$)/i.test(path);
}
export function isDistractionPath(path: string): boolean {
  return /^\/explore(\/|$)/i.test(path) || /^\/reels?\/?$/i.test(path);
}
export function shouldRedirect(path: string, posting: boolean): boolean {
  return !posting && isDistractionPath(path);
}
