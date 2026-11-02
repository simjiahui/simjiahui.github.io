# Moonlit Tides

A free, static academic observatory for **simjiahui.github.io**, built with Astro, TypeScript, and modern CSS. Midnight blue, moonlight cream, and sakura pink; a real-time lunar phase above an artistic ASCII ocean.

The initial name, publication, project, photographs, and journal examples are explicitly labeled placeholders. Only the supplied PhD research context at Tohoku University is treated as factual. No achievements are inferred.

## Start here — no terminal needed for content

1. Open [CONTENT_GUIDE.md](CONTENT_GUIDE.md) for browser-only editing instructions.
2. Replace the name and biography in `src/data/profile.json`.
3. Add verified academic records to `src/data/academic.json`.
4. Under repository **Settings → Pages → Build and deployment**, select **GitHub Actions**.
5. Merge the feature branch into `main`. The workflow validates, builds the CV and site, tests the rendered pages, and deploys to **https://simjiahui.github.io** only if all checks pass.

No deployment is implied by the presence of a workflow. Check the actual GitHub Actions deployment result and live site after merging.

## Features

- Home, Research, Publications & Talks, Projects, Journal, About, CV, colophon, and 404 pages.
- Real lunar phase and reference sky calculations with Astronomy Engine; Chinese lunisolar calendar and UTC+8 dates with lunar-javascript.
- Canvas character-cell moon/ocean, detailed static fallback, adaptive quality, reduced motion, and off-screen/hidden-tab pausing.
- Data-driven publication filters, author highlighting, optional copy/download BibTeX, and curated project metadata with cache/fallback.
- Markdown journal with KaTeX, highlighted code, categories, tags, covers, RSS, sitemap, canonical and social metadata.
- Automatic conventional PDF CV from the same academic data; sample records excluded.
- Local open-source fonts, no required paid services, no tracking or cookies.

## Local development (optional)

Use Node **24** (see `.node-version`). From the repository root:

```sh
npm ci
npm run cv
npm run dev
```

`npm run cv` prepares the downloadable PDF for local development. `npm run build` always generates it automatically. Each cloud task is isolated; use this checkout without creating an extra worktree unless requested.

```sh
npm run check          # Astro + strict TypeScript + content schemas
npm test               # astronomy, calendar, tides, renderer, content, workflow contracts
npm run lint           # Prettier formatting, including Astro
npm run build          # validated CV + static site + internal links/fragments
npm run test:browser    # production preview + Playwright + axe + screenshots
```

For browser checks, either install Chromium using `npx playwright install --with-deps chromium`, use `/usr/bin/chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an installed browser. The test runner starts/stops its own local preview and writes screenshots and a report to ignored `artifacts/`.

`npm run format` formats source and documentation. Routine content edits can be made entirely through GitHub's editor. Use a pull request to check them before publication.

## Documentation

- [Content guide](CONTENT_GUIDE.md): browser-only maintenance.
- [Architecture](ARCHITECTURE.md): components, astronomy, artistic model, CV, and deployment.
- [Verification](VERIFICATION.md): checks actually run and their limits.
- [Third-party notices](THIRD_PARTY_NOTICES.md): licenses and attribution.

Hosting uses the ordinary free GitHub Pages and Actions allowances for a public personal-site repository. No custom domain, backend, API key, database, or subscription is required. External metadata is optional and never required for a successful build.
