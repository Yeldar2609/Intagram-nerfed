import { TOKENS } from "./tokens";
export type PanelOptions = {
  readonly posting: boolean;
  readonly onMessages: () => boolean;
  readonly onPosting: () => boolean;
};

export function createPanel(doc: Document, options: PanelOptions): HTMLElement {
  const host = doc.createElement("instagram-focus-controls");
  const shadow = host.attachShadow({ mode: "open" });
  const style = doc.createElement("style");
  style.textContent = `
    :host { all: initial; ${TOKENS} position: fixed; right: var(--s4); bottom: calc(var(--toolbar-bottom) + env(safe-area-inset-bottom)); z-index: 2147483646; color-scheme: dark; }
    * { box-sizing: border-box; }
    .wrap { color: var(--text); font: var(--small)/var(--line-compact) var(--font); }
    button { font: inherit; min-height: var(--control-height); border: var(--stroke) solid var(--line); border-radius: var(--radius); padding: var(--s2) var(--s4); background: var(--surface); color: var(--text); cursor: pointer; transition: opacity var(--micro); }
    button:hover { border-color: var(--focus); } button:active { opacity: var(--press-opacity); }
    button:focus-visible { outline: var(--focus-width) solid var(--focus); outline-offset: var(--focus-width); }
    .launcher { display: block; margin-left: auto; box-shadow: var(--shadow); }
    .panel { width: min(var(--panel-width), calc(100vw - var(--s8))); max-height: calc(100dvh - var(--panel-clearance)); overflow: auto; background: var(--surface); border: var(--stroke) solid var(--line); border-radius: var(--radius-panel); padding: var(--s4); margin-bottom: var(--s2); box-shadow: var(--shadow); }
    h2 { font-size: var(--body); margin: 0 0 var(--s2); } p { color: var(--muted); margin: 0 0 var(--s4); }
    .actions { display: grid; gap: var(--s2); } .primary { background: var(--blue); border-color: var(--blue); }
    .primary:hover { background: var(--hover); } [hidden] { display: none !important; }
    @media(prefers-reduced-motion: reduce) { button { transition: none; } }
  `;
  const wrap = doc.createElement("div");
  wrap.className = "wrap";
  const panel = doc.createElement("section");
  panel.className = "panel";
  panel.id = "focus-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Instagram focus settings");
  const title = doc.createElement("h2");
  title.textContent = options.posting ? "Posting mode" : "Just your messages";
  const description = doc.createElement("p");
  description.textContent = options.posting
    ? "Instagram’s regular navigation is temporarily available. Use its Create control to post. Stories are available only if Instagram offers them on your browser. Return to Messages when finished."
    : "Feed, Explore, Reels, and story browsing are hidden. Your messages stay on Instagram. Posting mode brings back Instagram’s own Create controls.";
  const actions = doc.createElement("div");
  actions.className = "actions";
  const messages = doc.createElement("button");
  messages.type = "button";
  messages.className = "primary";
  messages.textContent = "Back to messages";
  messages.addEventListener("click", () => {
    if (!options.onMessages()) {
      description.textContent =
        "Could not save focus mode. Allow website storage for Instagram and try again, or close this tab and open a new one. Posting mode is still active.";
      description.setAttribute("role", "alert");
    }
  });
  const post = doc.createElement("button");
  post.type = "button";
  post.textContent = "Open posting mode";
  post.hidden = options.posting;
  post.addEventListener("click", () => {
    if (!options.onPosting()) {
      description.textContent =
        "Posting mode needs tab storage. Allow website storage for Instagram in your browser, then try again. Focus mode remains enabled.";
      description.setAttribute("role", "alert");
    }
  });
  const close = doc.createElement("button");
  close.type = "button";
  close.textContent = "Close";
  const launcher = doc.createElement("button");
  launcher.type = "button";
  launcher.className = "launcher";
  launcher.textContent = options.posting ? "Posting mode" : "Focus";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", panel.id);
  function setOpen(open: boolean): void {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) messages.focus();
    else launcher.focus();
  }
  launcher.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));
  shadow.addEventListener("keydown", (event) => {
    if (event instanceof KeyboardEvent && event.key === "Escape")
      setOpen(false);
  });
  actions.append(messages, post, close);
  panel.append(title, description, actions);
  wrap.append(panel, launcher);
  shadow.append(style, wrap);
  return host;
}
