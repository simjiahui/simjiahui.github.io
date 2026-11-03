import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { preview } from "astro";
import { chromium } from "playwright";
import { moonState } from "../src/lib/astronomy";
import { REFERENCE } from "../src/lib/reference";

// Build a disposable checkout copy: never rewrite the developer's configuration.
const root = resolve(".");
const directory = await mkdtemp(join(tmpdir(), "moonlit-reference-"));
const reference = {
  name: "Regression observatory",
  latitude: -33.8688,
  longitude: -70.6693,
  elevation: 520,
};
let server: Awaited<ReturnType<typeof preview>> | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  const excluded = new Set([
    ".git",
    "node_modules",
    "dist",
    ".astro",
    ".cache",
    "artifacts",
  ]);
  await cp(root, directory, {
    recursive: true,
    filter: (source) => !excluded.has(basename(source)),
  });
  await symlink(join(root, "node_modules"), join(directory, "node_modules"));
  // This is the only input changed in the fixture.
  await writeFile(
    join(directory, "src/data/referenceLocation.json"),
    JSON.stringify(reference),
  );
  try {
    execFileSync("npm", ["run", "build"], { cwd: directory, stdio: "pipe" });
  } catch (error) {
    if (error && typeof error === "object" && "stderr" in error)
      console.error(String(error.stderr));
    throw error;
  }
  server = await preview({
    root: directory,
    server: { host: "127.0.0.1", port: 0 },
    logLevel: "error",
  });
  const base = `http://127.0.0.1:${server.port}`;
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    javaScriptEnabled: false,
    timezoneId: "America/Los_Angeles",
  });
  const page = await context.newPage();
  await page.goto(base);
  assert.match(
    await page.locator(".hero-coordinate").innerText(),
    /33\.8688° S\s+70\.6693° W/,
  );
  assert.match(
    (await page.locator(".observation-details").textContent()) ?? "",
    /Regression observatory \(33\.8688° S, 70\.6693° W\)/,
  );
  const snapshot = JSON.parse(
    (await page.locator("canvas").getAttribute("data-state")) ?? "null",
  );
  assert.deepEqual(snapshot, moonState(new Date(snapshot.date), reference));
  assert.notEqual(
    snapshot.altitude,
    moonState(new Date(snapshot.date)).altitude,
  );
  assert.notDeepEqual(
    snapshot.forcing,
    moonState(new Date(snapshot.date)).forcing,
  );
  assert.equal(await page.locator(".fallback-desktop").isVisible(), true);
  await page.goto(base + "/colophon/");
  const explanation = await page.locator("#lunar-scene").innerText();
  assert.ok(
    explanation.includes(
      "Regression observatory: 33.8688° S, 70.6693° W, elevation 520 m",
    ),
  );
  assert.ok(explanation.includes("distances at Regression observatory"));
  assert.ok(!explanation.includes(REFERENCE.name));
  await context.close();

  // Verify the lazy-loaded browser astronomy uses the changed configuration too.
  const live = await browser.newContext({
    timezoneId: "America/Los_Angeles",
    reducedMotion: "reduce",
  });
  const livePage = await live.newPage();
  const errors: string[] = [];
  livePage.on("pageerror", (error) => errors.push(error.message));
  const instant = new Date("2024-02-09T16:00:00Z");
  const expected = moonState(instant, reference);
  const original = moonState(instant);
  assert.notEqual(expected.altitude.toFixed(1), original.altitude.toFixed(1));
  await livePage.clock.setFixedTime(instant);
  await livePage.goto(base);
  await livePage.waitForFunction(
    (position) =>
      document.querySelector("[data-moon-position]")?.textContent === position,
    `${expected.altitude.toFixed(1)}° altitude · ${expected.azimuth.toFixed(1)}° azimuth`,
  );
  await livePage.locator("canvas.is-ready").waitFor();
  assert.equal(
    await livePage.locator("[data-lunar-date]").innerText(),
    expected.calendar.label,
  );
  assert.match(
    await livePage.locator("[data-festival]").innerText(),
    /Lunar New Year/,
  );
  assert.equal(
    await livePage.locator("[data-observation-time]").textContent(),
    "10 Feb 2024, 00:00",
  );
  assert.deepEqual(errors, []);
  await live.close();
  assert.deepEqual(
    JSON.parse(
      await readFile(join(root, "src/data/referenceLocation.json"), "utf8"),
    ),
    REFERENCE,
  );
  console.log(
    "Reference regression passed: one config edit updates rendered coordinates, notes, colophon, lunar/tidal geometry, and browser refresh; UTC+8 calendar and ASCII fallback remain intact.",
  );
} finally {
  await browser?.close();
  await server?.stop();
  await rm(directory, { recursive: true, force: true });
}
