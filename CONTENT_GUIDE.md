# Keep your observatory up to date

You can maintain the website using GitHub in your browser. No terminal is needed for routine updates.

## The everyday workflow

1. Open this repository on GitHub. Find a file and click its pencil icon, or use **Add file → Create new file / Upload files**.
2. Make a small edit. For JSON, keep double quotes around strings, commas between entries, and no trailing comma or comments.
3. Choose **Commit changes → Create a new branch and start a pull request**. Describe your edit.
4. Wait for **Check & deploy Moonlit Tides** to pass. Its checks cover content, the PDF, links, and browser behavior. If it fails, open the failed step in **Actions** and inspect the message. Fix the file in the same branch.
5. Merge the pull request. The `main` branch builds and deploys automatically. Wait for the **deploy** job before checking the public page. A successful PR check does not itself deploy.

Content JSON and Markdown are validated for correctness without imposing a formatting style. You can use normal GitHub editing. Formatting checks apply to application source; changing those files is optional developer work, not part of routine content updates.

## 1. Add a publication once, update the site and CV

Open `src/data/academic.json`. The `publications` array holds journal papers, conference papers, preprints, posters, talks, and seminars. Replace the sample with verified information; duplicate its object to add another entry.

This template is **illustrative only**. Replace every placeholder before setting `placeholder` to `false`:

```json
{
  "id": "your-unique-short-id",
  "type": "journal",
  "title": "Replace with the actual publication title",
  "authors": ["Your exact profile name", "Other actual author"],
  "venue": "Actual venue",
  "date": "2026-01-01",
  "status": "Published",
  "placeholder": true,
  "featured": true,
  "themes": ["reservoir", "forecasting"],
  "doi": "",
  "arxiv": "",
  "pdf": "",
  "code": "",
  "slides": "",
  "bibtex": ""
}
```

- Use a unique lowercase `id` containing letters, numbers, and hyphens. It becomes a link anchor.
- Valid types: `journal`, `conference`, `preprint`, `poster`, `talk`, `seminar`.
- Use a real `YYYY-MM-DD` date. Do not guess missing dates or metadata.
- `placeholder: true` shows a sample label and **excludes the entry from the CV**. Change to `false` only after verifying the full record.
- `featured: true` selects it for the homepage.
- Theme IDs: `reservoir`, `dynamics`, `networks`, `forecasting`. Matching records appear on the Research page.
- Author highlighting uses an exact match with `name` in `profile.json`.
- DOI: identifier only, such as `10.1234/example` (illustrative, not an actual citation). arXiv: identifier only, without a URL.
- `pdf`, `code`, and `slides`: a full HTTP(S) URL or a local path such as `/papers/my-paper.pdf`. Keep missing links as `""`; do not create fake links.
- `bibtex`: paste a verified BibTeX entry, with JSON line breaks written as `\n` and internal quotes escaped as `\"`. Copy/download buttons appear only when nonempty and the record is real.

Commit this one file. The website and PDF both read it during the same build. Do not edit generated `cv.pdf` manually.

## 2. Add a talk or invited seminar

Add a record to the same `publications` array, using `type: "talk"` or `type: "seminar"`. Supply the actual speaker/author list, event in `venue`, verified date, status, and optional slides URL. The Publications page filters talks separately, and the CV groups them under **Talks & seminars**. Posters use `poster`.

## 3. Publish a journal post

Use **Add file → Create new file**. Name it `src/content/journal/your-short-title.md`. Paste:

```markdown
---
title: "Your article title"
description: "A short, accurate summary."
date: 2026-01-01
category: Research Notes
tags: [mathematics, notes]
cover: /images/waves.svg
coverAlt: "An illustrated moon over ocean waves"
sample: false
draft: true
---

Your writing begins here.

## A section

Inline mathematics: $x_{t+1}=f(x_t)$.

Display mathematics:

$$
L=D-A
$$
```

Use your real publication date. Choose exactly one category: **Research Notes**, **Conferences & Travel**, **Mathematics**, **Life & Other Things**. Tags are free-form. Use triple backticks followed by `python`, `typescript`, or another language for code highlighting.

- Keep `draft: true` while writing: drafts do not receive routes, appear in listings, or enter RSS/sitemap.
- Change it to `false` when ready. Future dates are not a scheduling system: a non-draft post is immediately visible after deployment.
- Mark fictional or demonstration posts with `sample: true`. The two included articles are explicitly labeled samples; delete them when no longer needed.
- `cover` and `coverAlt` can be omitted together. For images, upload small optimized WebP/JPEG files to `public/images/`. Paths omit `public`: `/images/my-cover.webp`.
- New posts are listed and added to RSS automatically. Rename a post file only if you also intend to change its URL and update old links.

## 4. Feature a GitHub project

Edit `src/data/projects.json`. Copy the sample object and replace its fields:

- `id`: unique short anchor.
- `title`, `description`: your own accurate, curated description.
- `image`: uploaded cover path, or keep an included illustration.
- `technologies`: a list of plain text labels.
- `repository`: a public repository URL of the form `https://github.com/owner/repository`, or `""`.
- `demo`: an actual public demo URL, or `""`.
- `publication`: a matching academic record `id`, or `""`.
- `themes`: relevant theme IDs, as above.
- `featured`: whether it also appears on the homepage.
- `placeholder`: keep `true` for sample work; use `false` for a verified real project.

Only these selected projects are shown. The build may fetch public star count/language metadata, cached for a day when a cache is present. Offline, rate-limited, or blocked API requests fall back to the cache or your local content. No API token is needed. Cache persistence between separate GitHub runners is optional; the site does not depend on it.

## 5. Upload photographs

Use **Add file → Upload files** in `public/images/`. Prefer WebP or compressed JPEG, about 1200 pixels on the long edge and a few hundred KB. Remove sensitive location metadata before uploading personal images; public repository files are public.

In `src/data/profile.json`:

- Set `portrait` to `/images/your-photo.webp` for both the homepage and About page.
- Fill each `gallery` item's `src`, descriptive `alt`, and `caption`. Add or remove whole gallery objects as needed. The layout adapts automatically. Empty `src` keeps a visible placeholder.
- Do not put a local computer path or the word `public` in a website path.

Journal covers support meaningful `coverAlt`; the data-driven gallery supports `alt`. Decorative research illustrations are included with the project.

## 6. Update the biography, education, and experience

Edit `src/data/profile.json` for your name, role, institution, location, biography, biography note, optional email, interests, photographs, and professional links. Set `nameIsPlaceholder: false` only after supplying your name. Leave unknown personal facts empty. Do not enter private information you do not want published.

Education and experience live in `academic.json`. Each entry in either array has:

```json
{
  "title": "Actual degree or position",
  "institution": "Actual institution",
  "start": "Actual starting year",
  "end": "Present or actual ending year",
  "description": "Optional factual details"
}
```

Replace those illustrative strings with verified information. Education appears on About and in the CV; experience appears on About and in the CV. Research theme copy and equations are in `src/data/themes.ts`; edit the text carefully without removing TypeScript punctuation.

## 7. Regenerate the CV

Every site build regenerates `public/cv.pdf` automatically from the shared profile and academic files. No paid tool or separate document editing is needed. The permanent published URL is `/cv.pdf`.

To rebuild without changing content, go to **Actions → Check & deploy Moonlit Tides → Run workflow**, select `main`, and run it. The repository must have GitHub Actions enabled. The workflow validates the PDF and local download link, and fails instead of publishing an incomplete PDF.

The default CV uses conventional Times fonts and supports Latin text. For Chinese or other scripts, upload a licensed TrueType/OpenType font covering all the characters to `public/fonts/cv.ttf`; the generator will embed that font automatically. You may also configure `CV_FONT_PATH` for local builds. Keep its license notice with the font. Mathematical website markup is not interpreted in the CV: use plain text in academic records.

## 8. Navigation, site metadata, and social previews

- `src/data/profile.json`: site title, description, navigation labels/paths, professional links, and email. Use full `https://` URLs for external links.
- `astro.config.mjs`: canonical production `site` URL. It is configured for `https://simjiahui.github.io` with root paths. A future project-subpath deployment needs deliberate base-path work; simply changing the repository name is insufficient.
- `public/favicon.svg`: moon-and-waves favicon.
- `public/images/og.png`: social preview. Replace it with a 1200×630 PNG if desired. `og.svg` is its editable artwork source; replacing the SVG alone does not regenerate the PNG.
- `src/layouts/Layout.astro`: shared SEO tags and footer if you need deeper layout changes.

## First deployment

1. Enable GitHub Actions for this repository if disabled.
2. Choose **Settings → Pages → Source → GitHub Actions**. GitHub may require repository administrator permission.
3. Merge the reviewed feature branch into `main`. Pull requests run validation but never deploy.
4. In **Actions**, wait for all checks and **deploy** to pass. Check the actual public site and the `/cv.pdf` download.

The pipeline uses only open-source tools and GitHub Pages. Ordinary public personal-site usage requires no recurring payment, paid API, custom domain, or analytics account.
