import { cp, mkdir, writeFile } from "node:fs/promises";
import { zipSync } from "fflate";
import sharp from "sharp";
import { TOKENS } from "../src/tokens";

await mkdir("dist/extension/icons", { recursive: true });
await mkdir("dist/site", { recursive: true });
const result = await Bun.build({
  entrypoints: ["src/content.ts"],
  target: "browser",
  format: "iife",
  minify: false,
});
if (!result.success)
  throw new AggregateError(result.logs, "Extension build failed");
const artifact = result.outputs[0];
if (!artifact) throw new RangeError("Build produced no script");
const code = await artifact.text();
await writeFile("dist/extension/content.js", code);
const metadata = `// ==UserScript==
// @name         Instagram — just messages
// @namespace    https://github.com/Yeldar2609/Intagram-nerfed
// @version      0.2.0
// @description  Stories and messages without feed posts or endless video scrolling. Optional posting mode.
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @run-at       document-start
// @inject-into  content
// @grant        none
// @noframes
// ==/UserScript==
`;
await writeFile("dist/site/instagram-focus.user.js", metadata + code);
await cp("site", "dist/site", { recursive: true });
await writeFile("dist/site/tokens.css", `:root { ${TOKENS} }`);
const sizes = [32, 48, 128, 180, 512] as const;
for (const size of sizes) {
  await sharp("assets/instagram-classic.png")
    .trim()
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(`dist/extension/icons/icon-${size}.png`);
}
await cp(
  "dist/extension/icons/icon-512.png",
  "dist/site/instagram-classic.png",
);
await cp("dist/extension/icons/icon-32.png", "dist/site/favicon-classic.png");
await cp(
  "dist/extension/icons/icon-180.png",
  "dist/site/apple-touch-icon-classic.png",
);
await writeFile(
  "dist/extension/manifest.json",
  JSON.stringify(
    {
      manifest_version: 3,
      name: "Instagram — just messages",
      version: "0.2.0",
      description:
        "A personal focus extension. Stories and messages without endless scrolling. Independent of Meta.",
      icons: { "48": "icons/icon-48.png", "128": "icons/icon-128.png" },
      content_scripts: [
        {
          matches: ["https://www.instagram.com/*", "https://instagram.com/*"],
          js: ["content.js"],
          run_at: "document_start",
          all_frames: false,
        },
      ],
    },
    null,
    2,
  ),
);
await writeFile("dist/site/.nojekyll", "");
const files: Record<string, Uint8Array> = {};
for await (const path of new Bun.Glob("**/*").scan({
  cwd: "dist/extension",
  onlyFiles: true,
})) {
  files[path.replaceAll("\\", "/")] = new Uint8Array(
    await Bun.file(`dist/extension/${path}`).arrayBuffer(),
  );
}
await writeFile("dist/site/instagram-extension.zip", zipSync(files));
console.info(
  "Built extension, iPhone userscript, installation site, and classic icon.",
);
