import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const browser = process.env["BROWSE_BIN"];
if (!browser) throw new TypeError("Set BROWSE_BIN to gstack browse");
export const evidence = resolve("work/qa/v030-auto");
await mkdir(evidence, { recursive: true });
export async function browse(...args: string[]): Promise<string> {
  const child = Bun.spawn([browser ?? "", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, err, exit] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (exit !== 0)
    throw new AggregateError([out, err], `browse ${args[0]} failed`);
  return out.trim();
}
export async function check(name: string, expression: string): Promise<void> {
  if ((await browse("js", expression)) !== "true")
    throw new TypeError(`Failed: ${name}`);
  console.info(`PASS ${name}`);
}
export async function capture(name: string): Promise<void> {
  const params = await browse(
    "js",
    "JSON.stringify({format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:innerWidth,height:document.documentElement.scrollHeight,scale:1}})",
  );
  const wrapped = await browse("cdp", "Page.captureScreenshot", params);
  const result: unknown = JSON.parse(
    wrapped.slice(wrapped.indexOf("{"), wrapped.lastIndexOf("}") + 1),
  );
  if (
    typeof result !== "object" ||
    result === null ||
    !("data" in result) ||
    typeof result.data !== "string"
  )
    throw new TypeError("Missing capture");
  await writeFile(
    `${evidence}/${name}.png`,
    Buffer.from(result.data, "base64"),
  );
}
