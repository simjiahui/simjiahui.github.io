import rawProfile from "./profile.json";
import rawAcademic from "./academic.json";
import rawProjects from "./projects.cms.json";
import { z } from "zod";
import { academicSchema, projectCatalogSchema } from "./schema";
export const profileSchema = z.object({
  name: z.string().min(1),
  nameIsPlaceholder: z.boolean(),
  siteTitle: z.string(),
  role: z.string(),
  institution: z.string(),
  location: z.string(),
  email: z.union([z.literal(""), z.email()]).default(""),
  portrait: z.string().default(""),
  interests: z.array(z.string()).default([]),
  links: z
    .array(
      z.object({
        label: z.string(),
        url: z.url().regex(/^https?:\/\//),
      }),
    )
    .default([]),
  gallery: z
    .array(
      z.object({
        src: z.string().default(""),
        alt: z.string().default(""),
        caption: z.string().default(""),
      }),
    )
    .default([]),
  navigation: z.array(
    z.object({ label: z.string(), href: z.string().regex(/^\//) }),
  ),
});
export const profile = profileSchema.parse(rawProfile);
export const academic = academicSchema.parse(rawAcademic);
export const projects = projectCatalogSchema.parse(rawProjects).projects;
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
