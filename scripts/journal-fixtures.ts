import { glob, readFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";

/** Read the current content for smoke-test expectations, rather than fixing tests to demo posts. */
export async function journalFixtures() {
  const entries: {
    slug: string;
    draft: boolean;
    sample: boolean;
    category: string;
    description: string;
  }[] = [];
  for await (const path of glob("**/*.md", { cwd: "src/content/journal" })) {
    const source = await readFile(join("src/content/journal", path), "utf8");
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) throw new Error(`Missing journal frontmatter: ${path}`);
    const data = YAML.parse(match[1]!);
    entries.push({
      slug: path.replace(/\\/g, "/").replace(/\.md$/, ""),
      draft: data.draft ?? false,
      sample: data.sample ?? false,
      category: data.category,
      description: data.description,
    });
  }
  return entries;
}
