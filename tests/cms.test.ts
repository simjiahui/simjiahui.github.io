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

interface CmsField {
  name: string;
  type: string;
  required?: boolean;
  list?: boolean | object;
  fields?: CmsField[];
  options?: { media?: string };
}

function checkMappings(
  fields: CmsField[],
  value: Record<string, any>,
  path: string,
) {
  for (const field of fields) {
    const fieldPath = `${path}.${field.name}`;
    // Validate configuration even when an optional value is absent from this file.
    if (field.type === "image")
      assert.equal(field.options?.media, "photographs");
    if (!Object.hasOwn(value, field.name)) {
      assert.notEqual(field.required, true, `${fieldPath} has no data mapping`);
      continue;
    }
    if (field.type !== "object") continue;
    const nested = value[field.name];
    if (field.list) {
      assert.ok(Array.isArray(nested), `${fieldPath} must be a list`);
      nested.forEach((item, index) => {
        assert.ok(
          item && typeof item === "object" && !Array.isArray(item),
          `${fieldPath}[${index}] must be an object`,
        );
        checkMappings(field.fields ?? [], item, `${fieldPath}[${index}]`);
      });
    } else {
      assert.ok(
        nested && typeof nested === "object" && !Array.isArray(nested),
        `${fieldPath} must be an object`,
      );
      checkMappings(field.fields ?? [], nested, fieldPath);
    }
  }
}

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
      checkMappings(entry.fields, item, entry.path);
  }
  assert.ok(
    !config.content.some(
      (e: any) => e.path === "src/data/referenceLocation.json",
    ),
  );
});

test("mapping checks allow missing optional fields but retain required checks in objects and lists", () => {
  const fields: CmsField[] = [
    { name: "optional", type: "text", required: false },
    { name: "implicitOptional", type: "string" },
    {
      name: "group",
      type: "object",
      fields: [{ name: "title", type: "string", required: true }],
    },
    {
      name: "items",
      type: "object",
      list: true,
      fields: [{ name: "title", type: "string", required: true }],
    },
  ];
  assert.doesNotThrow(() => checkMappings(fields, {}, "fixture"));
  assert.doesNotThrow(() =>
    checkMappings(fields, { group: { title: "" }, items: [] }, "fixture"),
  );
  assert.throws(
    () => checkMappings(fields, { group: {} }, "fixture"),
    /fixture\.group\.title has no data mapping/,
  );
  assert.throws(
    () => checkMappings(fields, { items: [{}] }, "fixture"),
    /fixture\.items\[0\]\.title has no data mapping/,
  );
  assert.throws(
    () =>
      checkMappings(
        [{ name: "required", type: "string", required: true }],
        {},
        "fixture",
      ),
    /fixture\.required has no data mapping/,
  );
  assert.throws(() =>
    checkMappings(
      [{ name: "image", type: "image", options: { media: "wrong" } }],
      {},
      "fixture",
    ),
  );
});

test("empty optional copy survives CMS JSON saves without changing other content", () => {
  const original = read("src/data/siteContent.json");
  const about = config.content.find((entry: any) => entry.name === "about");
  const footer = config.content.find(
    (entry: any) => entry.name === "footer-contact",
  );
  const expected = structuredClone(siteContent);
  expected.shared.biographyNote = "";
  expected.home.contact.missingEmail = "";
  for (const empty of ["", null, undefined]) {
    const edited = structuredClone(original);
    edited.shared.biographyNote = empty;
    edited.home.contact.missingEmail = empty;
    const saved = JSON.parse(JSON.stringify(cmsSave(edited)));
    assert.equal(Object.hasOwn(saved.shared, "biographyNote"), false);
    assert.equal(Object.hasOwn(saved.home.contact, "missingEmail"), false);
    assert.doesNotThrow(() =>
      checkMappings(about.fields, saved, "src/data/siteContent.json"),
    );
    assert.doesNotThrow(() =>
      checkMappings(footer.fields, saved, "src/data/siteContent.json"),
    );
    assert.deepEqual(siteContentSchema.parse(saved), expected);
  }
  const missingRequired = structuredClone(original);
  delete missingRequired.shared.biography;
  assert.throws(
    () =>
      checkMappings(about.fields, missingRequired, "src/data/siteContent.json"),
    /shared\.biography has no data mapping/,
  );
  assert.equal(siteContentSchema.safeParse(missingRequired).success, false);
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
