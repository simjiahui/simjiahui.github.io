import { preview } from "astro";
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

// Record before a copy-only refactor, compare after it. No baseline is enforced
// during routine content edits, where changed wording is intentional.
const record = process.argv.includes("--record");
const directory = "artifacts/content-management";
await mkdir(directory, { recursive: true });
const server = await preview({
  server: { host: "127.0.0.1", port: 0 },
  logLevel: "error",
});
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox"],
});
try {
  const snapshots: Record<string, unknown> = {};
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    for (const route of [
      "/",
      "/about/",
      "/research/",
      "/publications/",
      "/projects/",
      "/journal/",
      "/journal/a-small-reservoir/",
      "/cv/",
      "/404.html",
      "/colophon/",
    ]) {
      await page.goto(`http://127.0.0.1:${server.port}${route}`, {
        waitUntil: "networkidle",
      });
      await page.evaluate(() => document.fonts.ready);
      const snapshot = await page.evaluate(String.raw`(() => {
        const dynamic =
          "[data-ascii-fallback],canvas,[data-phase],[data-illumination],[data-lunar-date],[data-festival],[data-moon-position],[data-observation-time]";
        const walk = (el) => {
          if (el.matches("script,style")) return null;
          const rect = el.getBoundingClientRect();
          const attrs = [...el.attributes]
            .filter(
              (a) =>
                !a.name.startsWith("data-") &&
                !(
                  el.tagName === "CANVAS" &&
                  ["width", "height", "style", "class"].includes(a.name)
                ),
            )
            .map((a) => [a.name, a.value])
            .sort((a, b) => a[0].localeCompare(b[0]));
          return {
            tag: el.tagName,
            attrs,
            text: el.matches(dynamic)
              ? ""
              : Array.from(el.childNodes)
                  .filter((n) => n.nodeType === Node.TEXT_NODE)
                  .map((n) => n.textContent)
                  .join("")
                  .replace(/\s+/g, " ")
                  .trim(),
            box: el.matches(dynamic)
              ? null
              : [rect.x, rect.y, rect.width, rect.height].map(
                  (n) => Math.round(n * 10) / 10,
                ),
            children: el.matches(dynamic)
              ? []
              : [...el.children].map(walk).filter(Boolean),
          };
        };
        return walk(document.body);
      })()`);
      snapshots[`${width}:${route}`] = snapshot;
      if (route === "/" || route === "/about/")
        await page.screenshot({
          path: `${directory}/${record ? "before" : "after"}-${route === "/" ? "home" : "about"}-${width}.png`,
        });
    }
    await page.close();
  }
  const path = `${directory}/baseline.json`;
  if (record) {
    await writeFile(path, JSON.stringify(snapshots, null, 2));
    console.log(
      "Recorded default text, structure, attributes, and layout for 20 page/viewport combinations.",
    );
  } else {
    await writeFile(
      `${directory}/current.json`,
      JSON.stringify(snapshots, null, 2),
    );
    const baseline = JSON.parse(await readFile(path, "utf8"));
    for (const key of Object.keys(snapshots))
      assert.deepEqual(
        snapshots[key],
        baseline[key],
        `Default wording/structure/layout changed: ${key}`,
      );
    console.log(
      "PASS: default wording, element structure, non-data attributes, and layout match the production baseline across 20 page/viewport combinations.",
    );
  }
} finally {
  await browser.close();
  await server.stop();
}
