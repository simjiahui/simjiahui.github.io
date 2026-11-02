import rawProfile from "./profile.json";
import rawAcademic from "./academic.json";
import rawProjects from "./projects.json";
import { z } from "zod";
import { academicSchema, projectsSchema } from "./schema";
export const profile = z
  .object({
    name: z.string().min(1),
    nameIsPlaceholder: z.boolean(),
    siteTitle: z.string(),
    role: z.string(),
    institution: z.string(),
    location: z.string(),
    email: z.union([z.literal(""), z.email()]),
    portrait: z.string(),
    interests: z.array(z.string()),
    links: z.array(
      z.object({
        label: z.string(),
        url: z.url().regex(/^https?:\/\//),
      }),
    ),
    gallery: z
      .array(
        z.object({ src: z.string(), alt: z.string(), caption: z.string() }),
      )
      .default([]),
    navigation: z.array(
      z.object({ label: z.string(), href: z.string().regex(/^\//) }),
    ),
  })
  .parse(rawProfile);
export const academic = academicSchema.parse(rawAcademic);
export const projects = projectsSchema.parse(rawProjects);
for (const p of projects) {
  if (
    p.publication &&
    !academic.publications.some((pub) => pub.id === p.publication)
  )
    throw new Error(`Unknown publication ${p.publication} in project ${p.id}`);
}
export const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Shanghai",
  });
