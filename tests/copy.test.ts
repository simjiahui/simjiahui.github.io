import test from "node:test";
import assert from "node:assert/strict";
import { parseCopy, interpolate, plainCopy } from "../src/lib/copy";
import { siteContent, siteContentSchema, text } from "../src/data/siteContent";

test("copy renders configurable breaks and italics without an HTML parser", () => {
  assert.deepEqual(parseCopy("Curiosity at the edge\nof *complexity.*"), [
    { type: "text", value: "Curiosity at the edge" },
    { type: "break" },
    { type: "text", value: "of " },
    { type: "emphasis", value: "complexity." },
  ]);
  assert.deepEqual(parseCopy("One\r\n*two*\rthree"), [
    { type: "text", value: "One" },
    { type: "break" },
    { type: "emphasis", value: "two" },
    { type: "break" },
    { type: "text", value: "three" },
  ]);
  assert.deepEqual(parseCopy("An unmatched * stays literal"), [
    { type: "text", value: "An unmatched * stays literal" },
  ]);
  assert.deepEqual(parseCopy("<script>alert(1)</script>"), [
    { type: "text", value: "<script>alert(1)</script>" },
  ]);
  assert.equal(plainCopy("A\n*gentle* title"), "A gentle title");
});
test("copy placeholders preserve zero counts, shared facts, and literal data", () => {
  assert.equal(interpolate("{count} results", { count: 0 }), "0 results");
  assert.equal(
    interpolate("Hello {name}", { name: "<b>Ada</b>" }),
    "Hello <b>Ada</b>",
  );
  assert.match(text(siteContent.hero.roleLine), /Tohoku University/);
  assert.throws(() => interpolate("{unknown}"), /Unknown content placeholder/);
  assert.throws(
    () => interpolate("{constructor}"),
    /Unknown content placeholder/,
  );
});
test("central content validation rejects missing sections, wrong types, and typo keys", () => {
  assert.equal(siteContentSchema.safeParse(siteContent).success, true);
  const missing = structuredClone(siteContent) as Partial<typeof siteContent>;
  delete missing.about;
  assert.equal(siteContentSchema.safeParse(missing).success, false);
  assert.equal(
    siteContentSchema.safeParse({
      ...siteContent,
      home: {
        ...siteContent.home,
        introduction: { ...siteContent.home.introduction, heading: 7 },
      },
    }).success,
    false,
  );
  assert.equal(
    siteContentSchema.safeParse({ ...siteContent, homepage: {} }).success,
    false,
  );
  assert.equal(
    siteContentSchema.safeParse({
      ...siteContent,
      hero: { ...siteContent.hero, description: "Hello {nmae}" },
    }).success,
    false,
  );
});
test("research relationships and journal filters retain unique stable identities", () => {
  const duplicate = structuredClone(siteContent);
  duplicate.research.themes.push({ ...duplicate.research.themes[0]! });
  assert.equal(siteContentSchema.safeParse(duplicate).success, false);
  const categories = structuredClone(siteContent);
  categories.journal.categories[0]!.value =
    categories.journal.categories[1]!.value;
  assert.equal(siteContentSchema.safeParse(categories).success, false);
  assert.equal(
    siteContentSchema.safeParse({
      ...siteContent,
      hero: {
        ...siteContent.hero,
        subtitle: "An *edited* subtitle\nwith another line",
      },
    }).success,
    true,
  );
});
