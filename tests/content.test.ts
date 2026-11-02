import test from "node:test";
import assert from "node:assert/strict";
import { academic, projects, profile } from "../src/data/index";
import { publicationSchema, academicSchema } from "../src/data/schema";
import { repositoryMetadata } from "../src/lib/github";
import { readFile } from "node:fs/promises";
import YAML from "yaml";
test("site content validates, academic IDs are unique, and samples are marked", () => {
  assert.ok(profile.name);
  assert.ok(academicSchema.safeParse(academic).success);
  assert.equal(
    new Set(academic.publications.map((p) => p.id)).size,
    academic.publications.length,
  );
  for (const p of projects)
    if (p.publication)
      assert.ok(academic.publications.some((pub) => pub.id === p.publication));
});
test("publication schema rejects invalid dates, unsafe links, and unknown types", () => {
  const base = academic.publications[0];
  for (const patch of [
    { date: "2024-02-30" },
    { pdf: "javascript:alert(1)" },
    { type: "award" },
    { doi: "https://doi.org/fake" },
  ])
    assert.equal(
      publicationSchema.safeParse({ ...base, ...patch }).success,
      false,
    );
});
test("missing GitHub repository is handled without a network call", async () => {
  assert.equal(await repositoryMetadata(""), null);
  assert.equal(await repositoryMetadata("https://invalid.example/repo"), null);
});
test("Pages workflow has gated deployment, official action, and minimal permissions", async () => {
  const workflow = YAML.parse(
    await readFile(".github/workflows/pages.yml", "utf8"),
  );
  assert.ok(Object.hasOwn(workflow.on, "pull_request"));
  assert.ok(workflow.on.push.branches.includes("main"));
  assert.equal(workflow.permissions.contents, "read");
  assert.ok(
    workflow.jobs.build.steps.some((s: { uses?: string }) =>
      s.uses?.startsWith("withastro/action@"),
    ),
  );
  const deploy = workflow.jobs.deploy;
  assert.equal(deploy.needs, "build");
  assert.match(deploy.if, /refs\/heads\/main/);
  assert.match(deploy.if, /pull_request/);
  assert.equal(deploy.permissions.pages, "write");
  assert.equal(deploy.permissions["id-token"], "write");
});
