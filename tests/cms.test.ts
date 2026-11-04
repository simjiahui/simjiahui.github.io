import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { glob, readFile } from "node:fs/promises";
import YAML from "yaml";
import { academicSchema, projectCatalogSchema } from "../src/data/schema";
import { profileSchema, profile, academic, projects } from "../src/data";
import { siteContentSchema, siteContent } from "../src/data/siteContent";
import { parseCopy } from "../src/lib/copy";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const config = YAML.parse(readFileSync(".pages.yml", "utf8"));

// Model Pages CMS 2.x's documented/observed save cleanup: false survives;
// blank strings, nulls and empty object properties/lists do not.
export function cmsSave(value: any): any {
  if (Array.isArray(value))
    return value
      .map(cmsSave)
      .filter((v) => v !== null && v !== "" && v !== undefined);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .map(([k, v]) => [k, cmsSave(v)])
        .filter(
          ([, v]) =>
            v !== null &&
            v !== "" &&
            v !== undefined &&
            !(typeof v === "object" && Object.keys(v).length === 0),
        ),
    );
  return value;
}

test("CMS blank-value cleanup preserves the website's normalized structures", () => {
  assert.deepEqual(
    profileSchema.parse(cmsSave(read("src/data/profile.json"))),
    profile,
  );
  assert.deepEqual(
    academicSchema.parse(cmsSave(read("src/data/academic.json"))),
    academic,
  );
  assert.deepEqual(
    siteContentSchema.parse(cmsSave(read("src/data/siteContent.json"))),
    siteContent,
  );
  assert.deepEqual(
    projectCatalogSchema.parse(cmsSave(read("src/data/projects.cms.json")))
      .projects,
    projects,
  );
  assert.deepEqual(
    projectCatalogSchema.parse(cmsSave({ projects: [] })).projects,
    [],
  );
  assert.equal(
    profileSchema.parse(cmsSave({ ...profile, portrait: null })).portrait,
    "",
  );
  assert.equal(
    profileSchema.safeParse({ ...profile, name: undefined }).success,
    false,
  );
  assert.equal(
    academicSchema.safeParse({ publications: [{ title: "Incomplete" }] })
      .success,
    false,
  );
});

test("CMS editors map existing nested keys, preserve shared files, and protect singletons", () => {
  assert.equal(config.settings.content.merge, true);
  assert.deepEqual(config.media[0].input, "public/images");
  assert.deepEqual(config.media[0].output, "/images");
  const names = new Set();
  const check = (fields: any[], value: any, path: string) => {
    for (const f of fields) {
      assert.ok(
        Object.hasOwn(value, f.name),
        `${path}.${f.name} has no data mapping`,
      );
      const v = value[f.name];
      if (f.type === "object") {
        const items = f.list ? v : [v];
        for (const item of items) check(f.fields, item, `${path}.${f.name}`);
      }
      if (f.type === "image") assert.equal(f.options.media, "photographs");
    }
  };
  for (const entry of config.content) {
    assert.ok(!names.has(entry.name));
    names.add(entry.name);
    if (entry.type !== "file") continue;
    assert.equal(entry.operations.delete, false);
    assert.equal(entry.operations.rename, false);
    if (entry.name === "projects-output") {
      assert.equal(entry.format, "code");
      assert.equal(entry.fields[0].readonly, true);
      continue;
    }
    assert.equal(entry.format, "json");
    const data = read(entry.path);
    for (const item of entry.list ? data : [data])
      check(entry.fields, item, entry.path);
  }
  assert.ok(
    !config.content.some(
      (e: any) => e.path === "src/data/referenceLocation.json",
    ),
  );
});

test("journal controls retain Markdown frontmatter/body and safe publication defaults", () => {
  const editor = config.content.find((e: any) => e.name === "journal");
  const fields = Object.fromEntries(editor.fields.map((f: any) => [f.name, f]));
  assert.equal(editor.path, "src/content/journal");
  assert.equal(editor.format, "yaml-frontmatter");
  assert.equal(fields.date.type, "date");
  assert.equal(fields.date.options.format, "yyyy-MM-dd");
  assert.equal(fields.body.type, "rich-text");
  assert.equal(fields.body.options.format, "markdown");
  assert.equal(fields.body.options.switcher, true);
  assert.equal(fields.draft.default, true);
  assert.deepEqual(fields.category.options.values, [
    "Research Notes",
    "Conferences & Travel",
    "Mathematics",
    "Life & Other Things",
  ]);
  const heading = "Questions about\n*learning and dynamics.*";
  assert.deepEqual(parseCopy(JSON.parse(JSON.stringify({ heading })).heading), [
    { type: "text", value: "Questions about" },
    { type: "break" },
    { type: "emphasis", value: "learning and dynamics." },
  ]);
});

test("existing posts retain explicit draft status when opened with new-entry CMS defaults", async () => {
  for await (const path of glob("src/content/journal/**/*.md")) {
    const source = await readFile(path, "utf8");
    const metadata = YAML.parse(
      source.match(/^---\r?\n([\s\S]*?)\r?\n---/)![1]!,
    );
    assert.equal(
      typeof metadata.draft,
      "boolean",
      `${path} must not inherit the new-entry Draft default`,
    );
  }
});
