import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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
import YAML from "yaml";
import { chromium } from "playwright";
import { preview } from "astro";
import { existsSync } from "node:fs";
import { glob } from "node:fs/promises";

const root = resolve(".");
const directory = await mkdtemp(join(tmpdir(), "moonlit-cms-"));
let server: Awaited<ReturnType<typeof preview>> | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
const excluded = new Set([
  ".git",
  "node_modules",
  "dist",
  ".astro",
  ".cache",
  "artifacts",
]);
const load = async (path: string) =>
  JSON.parse(await readFile(join(directory, path), "utf8"));
// Pages CMS removes blank values before serializing. Model that boundary, not the Astro loader.
const clean = (value: any): any => {
  if (Array.isArray(value))
    return value.map(clean).filter((v) => v !== "" && v != null);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .map(([k, v]) => [k, clean(v)])
        .filter(
          ([, v]) =>
            v !== "" &&
            v != null &&
            !(typeof v === "object" && !Object.keys(v).length),
        ),
    );
  return value;
};
const save = async (path: string, value: unknown) =>
  writeFile(join(directory, path), JSON.stringify(clean(value), null, 2));
const build = () =>
  execFileSync("npm", ["run", "build"], {
    cwd: directory,
    encoding: "utf8",
    stdio: "pipe",
  });
try {
  await cp(root, directory, {
    recursive: true,
    filter: (source) => !excluded.has(basename(source)),
  });
  await symlink(join(root, "node_modules"), join(directory, "node_modules"));
  const content = await load("src/data/siteContent.json");
  content.hero.subtitle = "CMS line one\n*CMS italic line*";
  content.home.projects.heading = "CMS edited projects";
  content.shared.biography = "CMS biography fixture.";
  content.shared.footer.description = "CMS footer fixture.";
  await save("src/data/siteContent.json", content);
  const profile = await load("src/data/profile.json");
  profile.portrait = "/images/orbits.svg";
  profile.gallery = [
    {
      src: "/images/waves.svg",
      alt: "CMS ocean fixture",
      caption: "CMS photo caption",
    },
  ];
  await save("src/data/profile.json", profile);
  const academic = await load("src/data/academic.json");
  academic.publications = [
    {
      id: "cms-test-publication",
      type: "preprint",
      title: "CMS publication fixture",
      authors: ["CMS test author"],
      venue: "CMS test venue",
      date: "2026-01-01",
      status: "Test fixture",
      placeholder: false,
      featured: true,
      themes: [],
    },
  ];
  academic.education = [
    {
      title: "CMS qualification fixture",
      institution: "CMS institution",
      start: "2020",
      end: "2024",
      description: "",
    },
  ];
  await save("src/data/academic.json", academic);
  await save("src/data/projects.cms.json", {
    projects: [
      {
        id: "cms-project-fixture",
        title: "CMS project fixture",
        description: "CMS project description",
        image: "/images/network.svg",
        publication: "cms-test-publication",
        featured: true,
        placeholder: true,
      },
    ],
  });
  const articlePath = join(
    directory,
    "src/content/journal/cms-test-article.md",
  );
  const article = {
    title: "CMS article fixture",
    description: "CMS article summary",
    date: "2026-01-02",
    category: "Research Notes",
    tags: ["cms-fixture"],
    cover: "/images/orbits.svg",
    coverAlt: "CMS orbital illustration",
    draft: true,
    sample: false,
  };
  const body =
    "## A visual editor heading\n\n**Formatted prose** and *italic prose*.\n\n$$\nx^2\n$$\n\n```ts\nconst sample = 1;\n```\n";
  const post = () =>
    writeFile(articlePath, `---\n${YAML.stringify(article)}---\n\n${body}`);
  await post();
  const result = build();
  assert.match(result, /1 verified academic records/);
  const home = await readFile(join(directory, "dist/index.html"), "utf8");
  assert.match(home, /CMS line one<br[^>]*><em>CMS italic line<\/em>/);
  assert.ok(home.includes("CMS edited projects"));
  assert.ok(home.includes("CMS project fixture"));
  assert.ok(home.includes("CMS footer fixture"));
  assert.ok(home.includes("/images/orbits.svg"));
  const about = await readFile(
    join(directory, "dist/about/index.html"),
    "utf8",
  );
  assert.ok(about.includes("CMS biography fixture"));
  assert.ok(about.includes("CMS photo caption"));
  assert.ok(
    !(await readFile(join(directory, "dist/rss.xml"), "utf8")).includes(
      "CMS article fixture",
    ),
  );
  await assert.rejects(
    readFile(join(directory, "dist/journal/cms-test-article/index.html")),
  );
  const pdf = await readFile(join(directory, "public/cv.pdf"));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 1000);
  article.draft = false;
  await post();
  build();
  const html = await readFile(
    join(directory, "dist/journal/cms-test-article/index.html"),
    "utf8",
  );
  assert.ok(html.includes("Formatted prose"));
  assert.ok(html.includes('class="katex'));
  assert.ok(html.includes("CMS orbital illustration"));
  assert.ok(
    (await readFile(join(directory, "dist/rss.xml"), "utf8")).includes(
      "CMS article fixture",
    ),
  );
  // An empty object is what CMS actually writes when the last project is removed.
  await save("src/data/projects.cms.json", { projects: [] });
  academic.publications = [];
  await save("src/data/academic.json", academic);
  for await (const path of glob("**/*.md", {
    cwd: join(directory, "src/content/journal"),
  })) {
    const file = join(directory, "src/content/journal", path);
    const markdown = await readFile(file, "utf8");
    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/)!;
    const metadata = YAML.parse(match[1]!);
    metadata.draft = true;
    await writeFile(
      file,
      markdown.replace(match[0], `---\n${YAML.stringify(metadata)}---`),
    );
  }
  build();
  assert.deepEqual(await load("src/data/projects.json"), []);
  assert.ok(
    !(await readFile(join(directory, "dist/index.html"), "utf8")).includes(
      "CMS project fixture",
    ),
  );
  server = await preview({
    root: directory,
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
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.port}/publications/`, {
    waitUntil: "networkidle",
  });
  assert.equal(
    await page.locator("[data-publication-empty]").isVisible(),
    true,
  );
  assert.match(
    await page.locator("[data-publication-count]").innerText(),
    /^0 /,
  );
  await page.goto(`http://127.0.0.1:${server.port}/journal/`, {
    waitUntil: "networkidle",
  });
  assert.equal(await page.locator("[data-post]").count(), 0);
  assert.equal(await page.locator("[data-journal-empty]").isVisible(), true);
  assert.match(await page.locator("[data-journal-count]").innerText(), /^0 /);
  assert.deepEqual(errors, []);
  console.log(
    "CMS smoke checks passed: form-style saves, formatting, media, academic/CV data, draft/public journal with math and RSS, and an empty project catalog all build correctly.",
  );
} catch (error) {
  if (error && typeof error === "object" && "stderr" in error)
    console.error(String(error.stderr));
  throw error;
} finally {
  await browser?.close();
  await server?.stop();
  await rm(directory, { recursive: true, force: true });
}
