import { TOKENS } from "./tokens";

export const UI_CSS = `
:host { ${TOKENS} color:var(--text); font:var(--body)/var(--line-body) var(--font); color-scheme:dark; }
* {box-sizing:border-box} [hidden] {display:none!important}
a {color:var(--focus);text-underline-offset:var(--s1)}
button,input {font:inherit;min-height:var(--control-height);border:var(--stroke) solid var(--line);border-radius:var(--radius);padding:var(--s2) var(--s3);background:var(--surface);color:var(--text);max-width:100%}
button {cursor:pointer} button:hover {background:var(--hover)} button:disabled {opacity:.6;cursor:wait}
a,button,input {outline-offset:var(--s1)} :focus-visible {outline:var(--focus-width) solid var(--focus)}
h1 {font-size:var(--heading);line-height:1.3;margin:var(--s6) 0 var(--s3)}
p {color:var(--muted);margin:0 0 var(--s4)} label {display:block;margin:var(--s4) 0 var(--s2)} input:not([type=checkbox]) {display:block;width:100%}
.page {max-width:var(--content-width);margin:auto;padding:var(--s6)}
.page > a, summary {display:flex;align-items:center;min-height:var(--control-height)}
summary {display:list-item;padding:var(--s2) 0;cursor:pointer}
.primary {background:var(--blue);width:100%;margin:var(--s4) 0}
.small {font-size:var(--small)} [role=alert] {color:var(--text)}
.check {display:flex;gap:var(--s3);align-items:flex-start} .check input {min-height:var(--s6);flex-shrink:0}
`;

export function makeSurface(
  doc: Document,
  name: string,
  markup: string,
): { readonly host: HTMLElement; readonly root: ShadowRoot } {
  const host = doc.createElement(name);
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${UI_CSS}</style>${markup}`;
  return { host, root };
}
