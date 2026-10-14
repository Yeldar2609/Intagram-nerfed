import { layoutReport } from "./diagnostics";

function openPanel(): void {
  if (document.querySelector("instagram-layout-check")) return;
  const host = document.createElement("instagram-layout-check");
  host.style.cssText =
    "all:initial!important;position:fixed!important;bottom:12px!important;left:12px!important;right:12px!important;z-index:2147483647!important;display:block!important;visibility:visible!important";
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `:host{color-scheme:dark}section{font:16px/1.4 system-ui;background:#202126;color:#f5f5f7;border:1px solid #42444c;border-radius:12px;padding:16px;max-width:600px;margin:auto}h2{font-size:18px;margin:0 0 8px}p{margin:8px 0}textarea{box-sizing:border-box;width:100%;height:120px;font:12px monospace;background:#101114;color:#f5f5f7;border:1px solid #42444c}nav{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}button{font:inherit;min-height:44px;padding:8px 14px;border:0;border-radius:8px;background:#1769e8;color:white}button:focus-visible,textarea:focus-visible{outline:3px solid #86bcff}`;
  const section = document.createElement("section");
  section.setAttribute("aria-label", "Instagram layout diagnostic");
  const title = document.createElement("h2");
  title.textContent = "Instagram layout check";
  const hint = document.createElement("p");
  hint.textContent =
    "Open the empty Home feed, then copy this report and paste it into our chat. No account names, messages or cookies are included.";
  const output = document.createElement("textarea");
  output.readOnly = true;
  output.setAttribute("aria-label", "Diagnostic report");
  const notice = document.createElement("p");
  notice.setAttribute("role", "status");
  const nav = document.createElement("nav");
  const refresh = () => {
    output.value = JSON.stringify(layoutReport(document, location.pathname));
  };
  function button(label: string, action: () => void): void {
    const control = document.createElement("button");
    control.type = "button";
    control.textContent = label;
    control.addEventListener("click", action);
    nav.append(control);
  }
  button("Copy report", () => {
    refresh();
    output.focus();
    output.select();
    output.setSelectionRange(0, output.value.length);
    if (!navigator.clipboard) {
      notice.textContent =
        "Report selected. Use Copy, then paste it into our chat.";
      return;
    }
    void navigator.clipboard.writeText(output.value).then(
      () => {
        notice.textContent = "Copied. Paste it into our chat.";
      },
      () => {
        notice.textContent =
          "Use the selected report’s Copy menu, then paste it into our chat.";
      },
    );
  });
  button("Refresh", refresh);
  button("Close", () => host.remove());
  section.append(title, hint, output, nav, notice);
  shadow.append(style, section);
  document.documentElement.append(host);
  refresh();
}
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", openPanel, { once: true });
else openPanel();
