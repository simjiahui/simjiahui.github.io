import { preview } from "astro";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const directory = "artifacts/lunar-refinement";
await mkdir(directory, { recursive: true });
const server = await preview({
  server: { host: "127.0.0.1", port: 0 },
  logLevel: "error",
});
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox"],
});
const base = `http://127.0.0.1:${server.port}`;
const errors: string[] = [];
const measurements: unknown[] = [];
try {
  for (const width of [1440, 768, 390, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: width < 700 ? 900 : 1000 },
      reducedMotion: "no-preference",
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    await page.locator("canvas.is-ready").waitFor();
    await delay(1800);
    const start = await page.locator("canvas").evaluate((canvas) => ({
      frames: Number((canvas as HTMLElement).dataset.framesRendered),
      time: performance.now(),
    }));
    await delay(4200);
    const end = await page.locator("canvas").evaluate((canvas) => ({
      frames: Number((canvas as HTMLElement).dataset.framesRendered),
      time: performance.now(),
      pixelRatio: (canvas as HTMLElement).dataset.pixelRatio,
      columns: (canvas as HTMLElement).dataset.columns,
      rows: (canvas as HTMLElement).dataset.rows,
      renderMs: (canvas as HTMLElement).dataset.renderMs,
    }));
    const fps =
      ((Number(end.frames) - start.frames) * 1000) /
      (Number(end.time) - start.time);
    assert.ok(fps > 10, `Renderer stalled at ${width}px: ${fps.toFixed(1)}fps`);
    assert.ok(Number(end.pixelRatio) <= 1.5);
    assert.ok(Number(end.columns) < 360);
    measurements.push({
      width,
      fps: Number(fps.toFixed(1)),
      columns: end.columns,
      rows: end.rows,
      averageDrawMs: end.renderMs,
      pixelRatio: end.pixelRatio,
    });
    await page.screenshot({ path: `${directory}/actual-${width}.png` });
    if (width === 1440) {
      await delay(2000);
      await page.screenshot({ path: `${directory}/actual-1440-later.png` });
    }
    await context.close();
  }
  for (const [label, date, phase] of [
    ["full", "2024-03-25T07:00:00Z", "Full moon"],
    ["waxing", "2024-04-15T19:13:00Z", "First quarter"],
    ["waning", "2024-04-02T03:15:00Z", "Last quarter"],
    ["new", "2024-04-08T18:21:00Z", "New moon"],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date(date!));
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForFunction(
      (expected) =>
        document.querySelector("[data-phase]")?.textContent === expected,
      phase,
    );
    const time = await page.locator("canvas").getAttribute("data-frame-time");
    await delay(250);
    assert.equal(
      await page.locator("canvas").getAttribute("data-frame-time"),
      time,
    );
    await page.screenshot({ path: `${directory}/phase-${label}.png` });
    await context.close();
  }
  const reduced = await browser.newContext({
    viewport: { width: 390, height: 900 },
    reducedMotion: "reduce",
  });
  const still = await reduced.newPage();
  await still.goto(base, { waitUntil: "networkidle" });
  await still.screenshot({ path: `${directory}/reduced-390.png` });
  await reduced.close();
  const nojs = await browser.newContext({
    viewport: { width: 390, height: 1000 },
    javaScriptEnabled: false,
  });
  const fallback = await nojs.newPage();
  await fallback.goto(base);
  assert.ok(await fallback.locator(".fallback-mobile").isVisible());
  await fallback.screenshot({ path: `${directory}/nojs-390.png` });
  await nojs.close();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ measurements, errors }, null, 2));
} finally {
  await writeFile(
    `${directory}/report.json`,
    JSON.stringify({ measurements, errors }, null, 2),
  );
  await browser.close();
  await server.stop();
}
