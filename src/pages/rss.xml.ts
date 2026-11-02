import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
export async function GET(context: APIContext) {
  const posts = (
    await getCollection("journal", ({ data }) => !data.draft)
  ).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: "Moonlit Tides · Journal",
    description: "Research notes and observations from the shoreline.",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: `${post.data.sample ? "[Sample article] " : ""}${post.data.description}`,
      link: `/journal/${post.id}/`,
    })),
    customData: "<language>en</language>",
  });
}
