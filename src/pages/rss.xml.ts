import { siteContent, plain } from "../data/siteContent";
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
export async function GET(context: APIContext) {
  const posts = (
    await getCollection("journal", ({ data }) => !data.draft)
  ).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: plain(siteContent.journal.rss.title),
    description: plain(siteContent.journal.rss.description),
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: `${post.data.sample ? siteContent.journal.rss.samplePrefix : ""}${post.data.description}`,
      link: `/journal/${post.id}/`,
    })),
    customData: "<language>en</language>",
  });
}
