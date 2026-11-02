import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { preview } from "astro";
import { existsSync } from "node:fs";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

await mkdir("artifacts", { recursive: true });
const server = await preview({
  server: { host: "127.0.0.1", port: 0 },
  logLevel: "error",
});
const base = `http://127.0.0.1:${server.port}`;
const report: { pages: unknown[]; checks: string[]; errors: string[] } = {
  pages: [],
  checks: [],
  errors: [],
};
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      const response = await fetch(base);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(100);
  }
  assert.ok(ready, "Preview did not become ready");
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
  browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => report.errors.push(e.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().endsWith("/404.html"))
      report.errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  const routes = [
    "/",
    "/research/",
    "/publications/",
    "/projects/",
    "/journal/",
    "/about/",
    "/cv/",
    "/colophon/",
    "/journal/a-small-reservoir/",
    "/journal/reading-the-moon/",
    "/404.html",
  ];
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(
      await page.locator("h1").count(),
      1,
      `${route} must have exactly one h1`,
    );
    assert.ok(await page.title());
    await page.locator("img").evaluateAll(async (images) => {
      await Promise.all(
        images.map(async (image) => {
          const img = image as HTMLImageElement;
          img.loading = "eager";
          await img.decode().catch(() => {});
        }),
      );
    });
    const brokenImages = await page
      .locator("img")
      .evaluateAll((images) =>
        images
          .filter(
            (i) =>
              !(i as HTMLImageElement).complete ||
              (i as HTMLImageElement).naturalWidth === 0,
          )
          .map((i) => (i as HTMLImageElement).src),
      );
    assert.deepEqual(brokenImages, [], `Broken images on ${route}`);
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    report.pages.push({
      route,
      accessibilityViolations: scan.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
    if (scan.violations.length)
      report.errors.push(
        `Accessibility violations on ${route}: ${scan.violations.map((v) => v.id).join(", ")}`,
      );
  }
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 740 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of [
      "/",
      "/research/",
      "/publications/",
      "/projects/",
      "/journal/",
      "/about/",
      "/cv/",
      "/journal/a-small-reservoir/",
    ]) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      const dimensions = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
      assert.ok(
        dimensions.scroll <= dimensions.viewport + 1,
        `Horizontal overflow ${route} at ${viewport.width}: ${dimensions.scroll}`,
      );
    }
    await page.goto(base, { waitUntil: "networkidle" });
    await page.locator("img").evaluateAll(async (images) => {
      await Promise.all(
        images.map(async (image) => {
          const img = image as HTMLImageElement;
          img.loading = "eager";
          await img.decode().catch(() => {});
        }),
      );
    });
    await page.screenshot({
      path: `artifacts/home-${viewport.width}.png`,
      fullPage: viewport.width === 1440 || viewport.width === 390,
    });
    if (viewport.width === 390) {
      const toggle = page.getByRole("button", { name: /Menu/ });
      await toggle.click();
      assert.equal(await toggle.getAttribute("aria-expanded"), "true");
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Research", exact: true })
        .focus();
      await page.keyboard.press("Escape");
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      assert.equal(
        await toggle.evaluate((el) => document.activeElement === el),
        true,
      );
    }
  }
  report.checks.push(
    "11 routes scanned with axe; 8 routes checked at 1440, 768, 390, and 320px; images and headings validated.",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/publications/", { waitUntil: "networkidle" });
  await page.selectOption("#publication-type", "journal");
  assert.equal(
    await page.locator("[data-publication-empty]").isVisible(),
    true,
  );
  await page.selectOption("#publication-type", "preprint");
  assert.equal(await page.locator("[data-publication]:visible").count(), 1);
  await page.selectOption("#publication-year", "sample");
  assert.equal(await page.locator("[data-publication]:visible").count(), 1);
  await page.goto(base + "/journal/", { waitUntil: "networkidle" });
  await page.selectOption("#journal-category", "Mathematics");
  assert.equal(await page.locator("[data-journal-empty]").isVisible(), true);
  await page.selectOption("#journal-category", "Research Notes");
  assert.equal(await page.locator("[data-post]:visible").count(), 1);
  report.checks.push(
    "Publication type/year and journal category filters return expected records and empty states.",
  );
  // A test-only citation is injected into the served HTML; it never becomes site content.
  const fixtureCitation = "@misc{ui-test,title={Test fixture only}}";
  const fixture = `<section id="citation-test"><details open><summary>Test-only citation fixture</summary><pre>${fixtureCitation}</pre><button data-copy="${fixtureCitation}">Copy test citation</button><button data-download="${fixtureCitation}" data-filename="ui-test.bib">Download test citation</button><span role="status"></span></details></section>`;
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: base,
  });
  for (const routePath of ["/publications/", "/"]) {
    const routeUrl = base + routePath;
    await page.route(routeUrl, async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        "</main>",
        `${fixture}</main>`,
      );
      await route.fulfill({ response, body });
    });
    await page.goto(routeUrl, { waitUntil: "networkidle" });
    const citation = page.locator("#citation-test");
    await citation
      .getByRole("button", { name: "Copy test citation", exact: true })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector("#citation-test [role=status]")?.textContent ===
        "Citation copied.",
    );
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      fixtureCitation,
    );
    const downloadReady = page.waitForEvent("download");
    await citation
      .getByRole("button", { name: "Download test citation", exact: true })
      .click();
    const download = await downloadReady;
    assert.equal(download.suggestedFilename(), "ui-test.bib");
    assert.equal(
      await readFile((await download.path())!, "utf8"),
      fixtureCitation,
    );
    await page.unroute(routeUrl);
  }
  report.checks.push(
    "Test-only citations copy and download correctly on both Publications and Home; no fake citation is stored as site content.",
  );

  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator("canvas.is-ready").waitFor();
  const still = await page.locator("canvas").getAttribute("data-frame-time");
  await delay(400);
  assert.equal(
    await page.locator("canvas").getAttribute("data-frame-time"),
    still,
    "Reduced motion must not animate",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await delay(250);
  const moving = await page.locator("canvas").getAttribute("data-frame-time");
  await delay(250);
  assert.notEqual(
    await page.locator("canvas").getAttribute("data-frame-time"),
    moving,
  );
  await page.locator("footer").scrollIntoViewIfNeeded();
  await delay(200);
  const paused = await page.locator("canvas").getAttribute("data-frame-time");
  await delay(250);
  assert.equal(
    await page.locator("canvas").getAttribute("data-frame-time"),
    paused,
    "Off-screen scene should pause",
  );
  report.checks.push(
    "Reduced motion produces a still frame; normal mode animates; off-screen rendering pauses.",
  );
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const fallback = await nojs.newPage();
  await fallback.goto(base);
  assert.equal(await fallback.locator(".fallback-mobile").isVisible(), true);
  assert.equal(
    await fallback
      .getByRole("navigation", { name: "Main navigation" })
      .isVisible(),
    true,
  );
  await fallback.screenshot({
    path: "artifacts/no-javascript-390.png",
    fullPage: false,
  });
  await nojs.close();
  report.checks.push(
    "No-JavaScript ASCII fallback and navigation remain visible.",
  );
  const cv = await page.request.get(base + "/cv.pdf");
  assert.equal(cv.status(), 200);
  assert.equal((await cv.body()).subarray(0, 5).toString(), "%PDF-");
  const rss = await page.request.get(base + "/rss.xml");
  const feed = await rss.text();
  assert.match(feed, /a-small-reservoir/);
  assert.match(feed, /\[Sample article\]/);
  const sitemap = await page.request.get(base + "/sitemap-index.xml");
  assert.equal(sitemap.status(), 200);
  assert.match(await sitemap.text(), /sitemap/);
  assert.ok((await readFile("public/cv.pdf")).length > 1000);
  report.checks.push(
    "CV PDF, RSS sample labeling, and sitemap served successfully.",
  );
  assert.deepEqual(report.errors, []);
  console.log(
    `Browser checks passed: ${report.pages.length} pages scanned. Screenshots in artifacts/.`,
  );
} catch (error) {
  report.errors.push(String(error));
  throw error;
} finally {
  await writeFile(
    "artifacts/browser-report.json",
    JSON.stringify(report, null, 2),
  );
  await browser?.close();
  await server.stop();
}
