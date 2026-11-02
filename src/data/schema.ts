import { z } from "zod";
const link = z.union([
  z.literal(""),
  z
    .url()
    .refine(
      (url) => /^https?:\/\//.test(url),
      "Only HTTP(S) links are allowed",
    ),
  z.string().regex(/^\/(?!\/)[^\s]*$/),
]);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !Number.isNaN(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s,
    "Use a valid YYYY-MM-DD date",
  );
export const publicationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  type: z.enum([
    "journal",
    "conference",
    "preprint",
    "poster",
    "talk",
    "seminar",
  ]),
  title: z.string().min(1),
  authors: z.array(z.string().min(1)).min(1),
  venue: z.string(),
  date,
  status: z.string(),
  placeholder: z.boolean().default(false),
  featured: z.boolean().default(false),
  themes: z.array(z.string()).default([]),
  doi: z
    .string()
    .refine(
      (v) => !v || /^10\.\d{4,9}\/\S+$/.test(v),
      "Use a DOI identifier, e.g. 10.1234/example",
    )
    .default(""),
  arxiv: z
    .string()
    .refine(
      (v) =>
        !v ||
        /^(\d{4}\.\d{4,5}(v\d+)?|[a-z-]+(\.[A-Z]{2})?\/\d{7}(v\d+)?)$/.test(v),
      "Use an arXiv identifier",
    )
    .default(""),
  pdf: link.default(""),
  code: link.default(""),
  slides: link.default(""),
  bibtex: z.string().default(""),
});
const entry = z.object({
  title: z.string(),
  institution: z.string(),
  start: z.string(),
  end: z.string(),
  description: z.string().default(""),
});
export const academicSchema = z
  .object({
    education: z.array(entry),
    experience: z.array(entry),
    publications: z.array(publicationSchema),
  })
  .superRefine((data, ctx) => {
    if (
      new Set(data.publications.map((p) => p.id)).size !==
      data.publications.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Publication IDs must be unique",
      });
  });
export const projectsSchema = z.array(
  z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    repository: z.union([
      z.literal(""),
      z.string().regex(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/),
    ]),
    demo: link,
    image: link,
    publication: z.string(),
    themes: z.array(z.string()),
    featured: z.boolean(),
    placeholder: z.boolean(),
  }),
);
export type Publication = z.infer<typeof publicationSchema>;
