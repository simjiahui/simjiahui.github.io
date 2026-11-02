import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
export type RepoMetadata = {
  stars: number;
  language: string | null;
  updated: string;
};
// Public metadata only. Local curated descriptions always remain authoritative.
export async function repositoryMetadata(
  repository: string,
): Promise<RepoMetadata | null> {
  if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(repository))
    return null;
  const key = createHash("sha256").update(repository).digest("hex");
  const path = `.cache/github/${key}.json`;
  let cached: { saved: number; data: RepoMetadata } | null = null;
  try {
    cached = JSON.parse(await readFile(path, "utf8"));
  } catch {
    /* Empty cache is normal. */
  }
  if (cached && Date.now() - cached.saved < 86400000) return cached.data;
  try {
    const slug = new URL(repository).pathname
      .replace(/^\//, "")
      .replace(/\/$/, "");
    const response = await fetch(`https://api.github.com/repos/${slug}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const json = await response.json();
    if (
      typeof json.stargazers_count !== "number" ||
      typeof json.updated_at !== "string"
    )
      throw new Error("Unexpected metadata");
    const data = {
      stars: json.stargazers_count,
      language: typeof json.language === "string" ? json.language : null,
      updated: json.updated_at,
    };
    await mkdir(".cache/github", { recursive: true });
    await writeFile(path, JSON.stringify({ saved: Date.now(), data }));
    return data;
  } catch {
    console.warn(
      `[projects] Public metadata unavailable for ${repository}; using ${cached ? "cached metadata" : "local content"}.`,
    );
    return cached?.data ?? null;
  }
}
