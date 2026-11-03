import { preview } from "astro";
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

const path = "src/data/siteContent.json";
const original = await readFile(path, "utf8");
const changed = JSON.parse(original);
changed.home.introduction.aboutLink = "A little more about *my work*";
changed.hero.description =
  '<img src=x onerror="window.copyInjected=true"> is literal copy.';
changed.hero.subtitle = "An edited subtitle\n*Second line*";
changed.hero.illumination = "Illumination: {percent}%";
changed.hero.observation.festivalFallback = "An edited quiet moment.";
changed.about.heading.title = "About *my work*";
changed.research.themes[0].title = "A *revised* research theme";
changed.publications.filters.one = "{count} selected entry";
changed.publications.filters.many = "{count} selected entries";
changed.publications.card.types.preprint = "Working paper";
changed.journal.one = "{count} journal entry";
changed.journal.many = "{count} journal entries";
changed.journal.categories[0].label = "Lab notes";
const build = () =>
  execFileSync("npm", ["run", "build"], {
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
    stdio: "pipe",
  });
let server: Awaited<ReturnType<typeof preview>> | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  await writeFile(path, JSON.stringify(changed, null, 2) + "\n");
  build();
  server = await preview({
    server: { host: "127.0.0.1", port: 0 },
    logLevel: "error",
  });
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ reducedMotion: "reduce" });
  await page.clock.setFixedTime(new Date("2024-04-02T03:15:00Z"));
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const base = `http://127.0.0.1:${server.port}`;
  await page.goto(base, { waitUntil: "networkidle" });
  assert.equal(
    await page.locator(".hero-about-link em").innerText(),
    "my work",
  );
  assert.equal(await page.locator(".hero-description img").count(), 0);
  assert.ok(
    (await page.locator(".hero-description").innerText()).includes(
      "<img src=x onerror=",
    ),
  );
  assert.equal(await page.evaluate("window.copyInjected"), undefined);
  assert.equal(
    await page.locator(".hero-subtitle em").innerText(),
    "Second line",
  );
  assert.equal(await page.locator(".hero-subtitle br").count(), 1);
  assert.match(
    await page.locator("[data-illumination]").innerText(),
    /^Illumination: \d+%$/,
  );
  assert.equal(
    await page.locator("[data-festival]").innerText(),
    "An edited quiet moment.",
  );
  assert.equal(
    await page.locator(".theme-preview h3 em").first().innerText(),
    "revised",
  );
  await page.goto(base + "/about/", { waitUntil: "networkidle" });
  assert.equal(await page.locator("h1 em").innerText(), "my work");
  await page.goto(base + "/research/", { waitUntil: "networkidle" });
  assert.equal(await page.locator("#reservoir h2 em").innerText(), "revised");
  await page.goto(base + "/publications/", { waitUntil: "networkidle" });
  assert.equal(
    await page.locator("[data-publication-count]").innerText(),
    "1 selected entry",
  );
  await page.selectOption("#publication-type", "journal");
  assert.equal(
    await page.locator("[data-publication-count]").innerText(),
    "0 selected entries",
  );
  await page.selectOption("#publication-type", "preprint");
  assert.equal(
    await page.locator("[data-publication-count]").innerText(),
    "1 selected entry",
  );
  assert.equal(
    (await page.locator(".type-label").textContent())?.trim(),
    "Working paper",
  );
  await page.goto(base + "/journal/", { waitUntil: "networkidle" });
  assert.equal(
    await page.locator("[data-journal-count]").innerText(),
    "2 journal entries",
  );
  await page.selectOption("#journal-category", "Research Notes");
  assert.equal(
    await page.locator("[data-journal-count]").innerText(),
    "1 journal entry",
  );
  assert.equal(
    (
      await page.locator("[data-post]:visible .post-meta > span").textContent()
    )?.trim(),
    "Lab notes",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: changing only JSON updates headings, br/em, paragraphs, dynamic lunar labels, theme cards, category labels, and live filter counts; HTML remains inert text.",
  );
} catch (error) {
  if (error && typeof error === "object" && "stderr" in error)
    console.error(String(error.stderr));
  throw error;
} finally {
  try {
    await browser?.close();
    await server?.stop();
  } finally {
    await writeFile(path, original);
    // Never leave test wording in the deployable dist/ directory.
    build();
    console.log(
      "Restored the original JSON bytes and rebuilt the default website.",
    );
  }
}
