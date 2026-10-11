import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const browser = process.env["BROWSE_BIN"];
if (!browser) throw new TypeError("Set BROWSE_BIN to gstack browse");
export const evidence = resolve(
  process.env["QA_EVIDENCE_DIR"] ?? "work/qa/v031-native",
);
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
  const path = `${evidence}/${name}.png`;
  await browse("screenshot", path);
  const bytes = await readFile(path);
  const metadata = await sharp(bytes).metadata();
  // Some browse versions optimize full-page captures as JPEG despite the suffix.
  if (metadata.format !== "png")
    await writeFile(path, await sharp(bytes).png().toBuffer());
}
