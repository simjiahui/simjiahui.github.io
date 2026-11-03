import { z } from "zod";
import rawContent from "./siteContent.json";
import { profile } from "./index";
import { interpolate, plainCopy } from "../lib/copy";
import { referenceVariables } from "../lib/reference";

const contentShape = z.strictObject({
  _editing: z.string(),
  shared: z.strictObject({
    biography: z.string(),
    biographyNote: z.string(),
    siteDescription: z.string(),
    headingPunctuation: z.string(),
    portraitAlt: z.string(),
    emailLabel: z.string(),
    cvLabel: z.string(),
    sectionLink: z.string(),
    skipLink: z.string(),
    homeLabel: z.string(),
    menu: z.string(),
    navigationLabel: z.string(),
    rssAlternateTitle: z.string(),
    socialImageAlt: z.string(),
    footer: z.strictObject({
      description: z.string(),
      linksHeading: z.string(),
      privacy: z.string(),
      colophonLink: z.string(),
    }),
  }),
  hero: z.strictObject({
    eyebrow: z.string(),
    coordinates: z.string(),
    roleLine: z.string(),
    namePlaceholder: z.string(),
    subtitle: z.string(),
    description: z.string(),
    researchButton: z.string(),
    publicationsButton: z.string(),
    cvButton: z.string(),
    scrollCue: z.string(),
    illumination: z.string(),
    observation: z.strictObject({
      eyebrow: z.string(),
      festivalFallback: z.string(),
      explanationLink: z.string().default(""),
      summary: z.string(),
      reference: z.string(),
      position: z.string(),
      calendar: z.string(),
      snapshot: z.string(),
      artisticNote: z.string(),
    }),
  }),
  home: z.strictObject({
    introduction: z.strictObject({
      eyebrow: z.string(),
      photoPlaceholder: z.string(),
      photoCaption: z.string(),
      heading: z.string(),
      paragraph: z.string(),
      aboutLink: z.string(),
    }),
    research: z.strictObject({
      eyebrow: z.string(),
      heading: z.string(),
      link: z.string(),
    }),
    publications: z.strictObject({
      eyebrow: z.string(),
      heading: z.string(),
      link: z.string(),
      emptyNote: z.string(),
    }),
    projects: z.strictObject({
      eyebrow: z.string(),
      heading: z.string(),
      link: z.string(),
    }),
    journal: z.strictObject({
      eyebrow: z.string(),
      heading: z.string(),
      link: z.string(),
    }),
    contact: z.strictObject({
      eyebrow: z.string(),
      heading: z.string(),
      paragraph: z.string(),
      emailButton: z.string(),
      linksButton: z.string(),
      missingEmail: z.string().default(""),
    }),
  }),
  about: z.strictObject({
    meta: z.strictObject({
      title: z.string(),
      description: z.string(),
    }),
    heading: z.strictObject({
      eyebrow: z.string(),
      title: z.string(),
      description: z.string(),
    }),
    photoPlaceholder: z.string(),
    greeting: z.string(),
    namePlaceholder: z.string(),
    journeyHeading: z.string(),
    journeyParagraph: z.string(),
    educationHeading: z.string(),
    educationEmpty: z.string(),
    experienceHeading: z.string(),
    interestsHeading: z.string(),
    interestsEmpty: z.string(),
    gallery: z.strictObject({
      eyebrow: z.string(),
      heading: z.string(),
      photoNumber: z.string(),
      placeholder: z.string(),
      captionSuffix: z.string(),
    }),
    contact: z.strictObject({
      eyebrow: z.string(),
      heading: z.string(),
      paragraph: z.string(),
      cvLink: z.string(),
      missingEmail: z.string(),
    }),
  }),
  research: z.strictObject({
    meta: z.strictObject({
      title: z.string(),
      description: z.string(),
    }),
    heading: z.strictObject({
      eyebrow: z.string(),
      title: z.string(),
      description: z.string(),
    }),
    relatedHeading: z.string(),
    relatedEmpty: z.string(),
    illustrationAlt: z.string(),
    illustrationCaption: z.string(),
    themes: z.array(
      z.strictObject({
        id: z.string().regex(/^[a-z0-9-]+$/),
        number: z.string(),
        title: z.string(),
        subtitle: z.string(),
        description: z.string(),
        math: z.string(),
        caption: z.string(),
        image: z.string(),
      }),
    ),
  }),
  publications: z.strictObject({
    meta: z.strictObject({
      title: z.string(),
      description: z.string(),
    }),
    heading: z.strictObject({
      eyebrow: z.string(),
      title: z.string(),
      description: z.string(),
    }),
    recordsLabel: z.string(),
    filters: z.strictObject({
      type: z.string(),
      allTypes: z.string(),
      journal: z.string(),
      conference: z.string(),
      preprint: z.string(),
      poster: z.string(),
      talk: z.string(),
      seminar: z.string(),
      year: z.string(),
      allYears: z.string(),
      sampleYear: z.string(),
      one: z.string(),
      many: z.string(),
    }),
    noMatches: z.string(),
    emptyHeading: z.string(),
    emptyParagraph: z.string(),
    cvPrompt: z.string(),
    cvLink: z.string(),
    card: z.strictObject({
      sampleYear: z.string(),
      placeholder: z.string(),
      types: z.strictObject({
        journal: z.string(),
        conference: z.string(),
        preprint: z.string(),
        poster: z.string(),
        talk: z.string(),
        seminar: z.string(),
      }),
      doi: z.string(),
      arxiv: z.string(),
      pdf: z.string(),
      code: z.string(),
      slides: z.string(),
      bibtexSummary: z.string(),
      copy: z.string(),
      download: z.string(),
      copied: z.string(),
      copyFailed: z.string(),
    }),
  }),
  projects: z.strictObject({
    meta: z.strictObject({
      title: z.string(),
      description: z.string(),
    }),
    heading: z.strictObject({
      eyebrow: z.string(),
      title: z.string(),
      description: z.string(),
    }),
    listLabel: z.string(),
    sampleNote: z.string(),
    card: z.strictObject({
      imageAlt: z.string(),
      sample: z.string(),
      sampleEyebrow: z.string(),
      eyebrow: z.string(),
      technologiesLabel: z.string(),
      repository: z.string(),
      demo: z.string(),
      publication: z.string(),
      publicRepository: z.string(),
      stars: z.string(),
    }),
  }),
  journal: z.strictObject({
    meta: z.strictObject({
      title: z.string(),
      description: z.string(),
    }),
    heading: z.strictObject({
      eyebrow: z.string(),
      title: z.string(),
      description: z.string(),
    }),
    articlesLabel: z.string(),
    categoryLabel: z.string(),
    allCategories: z.string(),
    categories: z.array(
      z.strictObject({
        value: z.enum([
          "Research Notes",
          "Conferences & Travel",
          "Mathematics",
          "Life & Other Things",
        ]),
        label: z.string(),
      }),
    ),
    one: z.string(),
    many: z.string(),
    rssLink: z.string(),
    empty: z.string(),
    sampleCard: z.string(),
    article: z.strictObject({
      backLink: z.string(),
      sample: z.string(),
      tagsLabel: z.string(),
      thanks: z.string(),
      moreLink: z.string(),
    }),
    rss: z.strictObject({
      title: z.string(),
      description: z.string(),
      samplePrefix: z.string(),
    }),
  }),
  cv: z.strictObject({
    meta: z.strictObject({
      title: z.string(),
      description: z.string(),
    }),
    heading: z.strictObject({
      eyebrow: z.string(),
      title: z.string(),
      description: z.string(),
    }),
    draft: z.string(),
    description: z.string(),
    download: z.string(),
    downloadFormat: z.string(),
    recordNote: z.string(),
    contentsLabel: z.string(),
    paperEyebrow: z.string(),
    interestsHeading: z.string(),
    interests: z.string(),
    recordsHeading: z.string(),
    educationCount: z.string(),
    experienceCount: z.string(),
    publicationCount: z.string(),
    talkCount: z.string(),
    generatedNote: z.string(),
  }),
  colophon: z.strictObject({
    meta: z.strictObject({ title: z.string(), description: z.string() }),
    heading: z.strictObject({
      eyebrow: z.string(),
      title: z.string(),
      description: z.string(),
    }),
    moonHeading: z.string(),
    astronomyParagraph: z.string(),
    moonArtParagraph: z.string(),
    motionHeading: z.string(),
    motionParagraph: z.string(),
    tideDisclaimer: z.string(),
    calendarHeading: z.string(),
    calendarParagraph: z.string(),
    accessibilityHeading: z.string(),
    accessibilityParagraph: z.string(),
    technologyHeading: z.string(),
    technologyParagraph: z.string(),
    cvParagraph: z.string(),
    sourceLink: z.string(),
  }),
  notFound: z.strictObject({
    title: z.string(),
    eyebrow: z.string(),
    heading: z.string(),
    description: z.string(),
    homeLink: z.string(),
    journalLink: z.string(),
  }),
});
export const siteContentSchema = contentShape.superRefine((content, ctx) => {
  const allowed = new Set([
    "name",
    "role",
    "institution",
    "location",
    "referenceName",
    "referenceLatitude",
    "referenceLongitude",
    "referenceElevation",
    "siteTitle",
    "count",
    "percent",
    "altitude",
    "azimuth",
    "number",
    "title",
  ]);
  const visit = (value: unknown, path: (string | number)[]) => {
    if (typeof value === "string") {
      if (["math", "_editing"].includes(String(path.at(-1)))) return;
      for (const match of value.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)) {
        if (!allowed.has(match[1]!))
          ctx.addIssue({
            code: "custom",
            path,
            message: `Unknown placeholder {${match[1]}}. Keep documented placeholders unchanged.`,
          });
      }
    } else if (Array.isArray(value))
      value.forEach((entry, index) => visit(entry, [...path, index]));
    else if (value && typeof value === "object")
      Object.entries(value).forEach(([key, entry]) =>
        visit(entry, [...path, key]),
      );
  };
  visit(content, []);
  if (
    new Set(content.research.themes.map((theme) => theme.id)).size !==
    content.research.themes.length
  )
    ctx.addIssue({
      code: "custom",
      path: ["research", "themes"],
      message: "Research theme IDs must be unique.",
    });
  const categories = content.journal.categories.map(
    (category) => category.value,
  );
  if (categories.length !== 4 || new Set(categories).size !== 4)
    ctx.addIssue({
      code: "custom",
      path: ["journal", "categories"],
      message:
        "Keep each of the four category values once; edit their labels instead.",
    });
});
export const siteContent = siteContentSchema.parse(rawContent);
export function text(
  value: string,
  variables: Record<string, string | number> = {},
) {
  return interpolate(value, {
    name: profile.name,
    role: profile.role,
    institution: profile.institution,
    location: profile.location,
    siteTitle: profile.siteTitle,
    ...referenceVariables(),
    ...variables,
  });
}
export function plain(
  value: string,
  variables: Record<string, string | number> = {},
) {
  return plainCopy(text(value, variables));
}
