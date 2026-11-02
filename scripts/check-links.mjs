import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, join, extname } from "node:path";
const root = resolve("dist");
const pages = [];
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const next = join(path, entry.name);
    if (entry.isDirectory()) await walk(next);
    else if (entry.name.endsWith(".html")) pages.push(next);
  }
}
await walk(root);
const errors = [];
let checked = 0;
// Build output has quoted, escaped attributes. This checker handles href/src,
// local files, trailing-slash routes, and HTML fragments; remote links aren't crawled.
const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
for (const page of pages) {
  const html = await readFile(page, "utf8");
  const relative = page.slice(root.length).replace(/index\.html$/, "");
  const base = new URL(relative, "https://simjiahui.github.io");
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = decode(match[1]);
    if (/^(mailto:|tel:|data:|blob:)/.test(value)) continue;
    const url = new URL(value, base);
    if (url.origin !== base.origin) continue;
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes("..")) {
      errors.push(`Unsafe path ${value}`);
      continue;
    }
    let target = join(root, pathname);
    try {
      if ((await stat(target)).isDirectory())
        target = join(target, "index.html");
      await stat(target);
      checked++;
      if (url.hash && extname(target) === ".html") {
        const targetHtml = await readFile(target, "utf8");
        const id = decodeURIComponent(url.hash.slice(1));
        if (!targetHtml.includes(`id="${id}"`))
          errors.push(`${relative}: missing fragment ${value}`);
      }
    } catch {
      errors.push(`${relative}: missing local file ${value}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Internal links checked: ${checked} references across ${pages.length} HTML pages.`,
  );
