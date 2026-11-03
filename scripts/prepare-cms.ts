import { readFile, writeFile } from "node:fs/promises";
import { projects } from "../src/data/index";

// Keep the public, legacy array format. The object-shaped CMS source is authoritative.
const path = new URL("../src/data/projects.json", import.meta.url);
const output = JSON.stringify(projects, null, 2) + "\n";
let current: unknown;
try {
  current = JSON.parse(await readFile(path, "utf8"));
} catch {
  // Regenerate a missing or invalid derived file from the validated CMS source.
}
if (JSON.stringify(current) !== JSON.stringify(projects))
  await writeFile(path, output);
