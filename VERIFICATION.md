# Verification record

Verified in the managed Linux workspace on **2 November 2026 (Japan time)**, using Node 24.19.0, Astro 7.4.4, Playwright 1.64.1, and the installed system Chromium.

The following baseline records the initial site build. The latest focused animation results are recorded in the final section.

## Passed

| Check                               | Observed result                                                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Clean `npm ci --no-audit --no-fund` | Installed the lockfile successfully                                                                                                    |
| `npm run check`                     | 38 files; 0 errors, 0 warnings, 0 hints                                                                                                |
| `npm run lint`                      | All matched application/test source files passed Prettier                                                                              |
| `npm test`                          | 13 tests passed; 0 failed/skipped                                                                                                      |
| `npm run build`                     | 11 static HTML pages, RSS, sitemap, robots, assets, and generated CV                                                                   |
| Generated internal links            | 233 local href/src references and applicable fragments passed                                                                          |
| `actionlint` 1.7.7                  | Workflow passed; official release SHA-256 verified before execution                                                                    |
| `npm run test:browser`              | Completed successfully against an isolated production preview                                                                          |
| axe WCAG 2.0/2.1 A/AA scan          | 11 routes; 0 detected violations                                                                                                       |
| Responsive layout                   | 8 key routes at 1440, 768, 390, and 320 px; no horizontal overflow                                                                     |
| Navigation and filters              | Mobile menu opens/closes; Escape restores focus; publication type/year and journal category filters show expected records/empty states |
| Citation controls                   | Test-only BibTeX copied to the clipboard and downloaded correctly on both Home and Publications                                        |
| Lunar renderer                      | Reduced-motion frame stays still; ordinary mode changes frames; leaving the viewport pauses rendering                                  |
| No-JavaScript fallback              | Static ASCII scene and navigation remain visible                                                                                       |
| Public build assets                 | CV returns a PDF, RSS includes labeled sample posts, sitemap returns successfully                                                      |
| PDF inspection                      | Text extraction showed one draft page and no sample publication citation                                                               |
| Development startup                 | `npm run dev` served the research page and rendered KaTeX on the configured port                                                       |
| Final `npm audit`                   | 0 known advisories across production and development dependencies                                                                      |

The unit suite tests known new/full/quarter moon instants, waxing/waning distinction, reference coordinate bounds, UTC+8 midnight conversion, Lunar New Year, Mid-Autumn Festival, a leap lunar month, bounded continuous tidal forcing, spring/neap strength, propagating waves, renderer detail/phase brightness, invalid content rejection, optional repository handling, and workflow deployment gating.

The browser suite uses Astro's programmatic preview API with an OS-assigned local port and stops its server in cleanup. It emits `artifacts/browser-report.json` plus desktop/tablet/phone screenshots. GitHub Actions saves those as the `browser-checks` artifact. Generated artifacts are ignored in source control.

## Visual review and fixes

Actual desktop, tablet, and mobile screenshots were opened and inspected. Browser checks found and helped correct a six-pixel overflow caused by long research terms at 320 px and insufficient code-comment contrast. Visual inspection also caught missing Unicode arrow glyphs; link arrows are now drawn with CSS. A separate mobile ASCII snapshot keeps the no-JavaScript moon in frame. Test-only citations verified the shared copy/download script on both Home and Publications. The code theme is `github-dark-high-contrast`.

The earlier unpatched Astro dependency stack was upgraded to Astro 7, Zod 4, and current KaTeX/PDFKit releases; the final audit is clean. The Astro 7 unified Markdown processor is configured explicitly to retain math and code rendering.

## Scope and remaining manual work

- No live deployment has been performed or verified. Local success does not establish GitHub Actions or GitHub Pages success.
- Enable **Settings → Pages → GitHub Actions**, review the feature branch, and merge it to `main` to deploy.
- Replace the name, photographs, biography details, email, and all academic/project sample entries with verified personal content. The current samples are deliberately visible and excluded from the CV.
- The default PDF fonts support Latin text. Supply a licensed Unicode font as described in `CONTENT_GUIDE.md` for other scripts.
- GitHub HTTPS repository reads succeeded. The GitHub API request to `https://api.github.com/repos/simjiahui/simjiahui.github.io` returned `Forbidden` in this environment; PR creation and API-based status inspection require that access. No new token was requested or assumed missing.
- Optional public project metadata falls back to local content when the API is unavailable. No real repository was configured in the sample gallery, so a live successful metadata fetch has not been claimed.
- Automated accessibility checks do not establish complete accessibility. Manual screen-reader testing, Safari/Firefox testing, physical-device frame-rate testing, and real-content review remain useful future checks.
- The ocean is a documented artistic simulation, not a calibrated tide model. Build-time static snapshots may age when JavaScript is disabled.

## Homepage animation refinement — 2 November 2026

The focused animation follow-up replaces the original renderer with a denser, cached ASCII moon and buffered multi-scale ocean. Application changes are limited to the hero renderer/model, its sky calculations, hero-only styling, and the corresponding colophon explanation. Academic content, navigation, journal, CV, project/publication functionality, dependencies, and deployment configuration are unchanged.

The final implementation passed:

- `npm run check`: 39 files, zero errors/warnings/hints.
- `npm test`: 17 tests passed, zero failed/skipped. Added coverage for physical projected lunar illumination, correct waxing/waning orientation, real solar/lunar forcing inputs and inverse-cube distance effects, dense mobile/desktop fallback composition, and absence of a full-moon reflection at new moon.
- `npm run lint`, `npm run build`, and all 233 local link/asset references.
- The complete existing `npm run test:browser` suite: all 11 axe scans clean, responsive routes at four widths, filters, keyboard navigation, actual citation copy/downloads, journal/RSS, sitemap, CV, motion preferences, off-screen pausing, and no-JavaScript fallback.
- `ASTRO_TELEMETRY_DISABLED=1 node --import tsx scripts/animation-check.ts`: real rendered captures at 320/390/768/1440 px, physical new/full/waxing/waning phase fixtures, reduced motion, and no-JavaScript views. Screenshots were opened and visually reviewed, not merely generated.

The first dense-rendering pass exposed a desktop per-glyph Canvas bottleneck (about 18.5 FPS and 52 ms average drawing time). The final sparse glyph-mask/pixel-buffer path measured:

| CSS viewport width | Character grid | Measured FPS | Average drawing time | Capped DPR |
| ------------------ | -------------- | ------------ | -------------------- | ---------- |
| 1440 px            | 293 × 108      | 30.0         | 8.26 ms              | 1.5        |
| 768 px             | 156 × 103      | 29.9         | 4.68 ms              | 1.5        |
| 390 px             | 75 × 98        | 30.1         | 2.12 ms              | 1.25       |
| 320 px             | 62 × 98        | 30.1         | 2.15 ms              | 1.25       |

These are short headless Chromium measurements on this test host, with a simulated device pixel ratio of 2 before the renderer's cap; physical-device performance will vary. Small FPS deviations above 30 reflect measurement boundaries. Desktop density is approximately 2.6 times the original 184 × 66 grid. Quality still adapts on slower devices.

Visual iteration strengthened blue crest contours and dark troughs, broke the reflection into wave-driven cream glints with rare pink edges, kept the heading area quiet, and gave static mobile snapshots a color-separated moon and sea. The new slow envelope uses actual Sendai Sun/Moon geometry with a 720× artistic clock; it remains explicitly uncalibrated for coastal tide prediction. No video, GIF, remote imagery, new dependency, or paid service was added.

Final animation screenshots and measured results are in `artifacts/lunar-refinement/`; the final full-suite screenshots/report remain in `artifacts/`. No live deployment is implied by these local checks.

## Centralized content editing — 2 November 2026

Page wording now lives in `src/data/siteContent.json`, with an explicit strict schema and safe newline/italic rendering. Existing identity, links, academic records, curated projects, and Markdown articles keep their existing data sources. The latest main-branch defaults (“SIM Jia Hui”, the PhD-student role, biography including causality, and “I love learning!”) were preserved. Biography/note/default description were moved, without rewording, from `profile.json` to the shared section of the content file.

Observed validation:

- `npm run check`: 45 files, zero errors/warnings/hints.
- `npm test`: 21 tests passed, zero failed/skipped, including safe copy parsing, placeholder interpolation, strict schema failures, and stable research/category identities.
- `npm run lint`, production build, and 225 local href/src/fragment references passed. The build still produces 11 HTML pages, RSS/sitemap, and the PDF CV.
- `actionlint` passed for the updated workflow, which now runs the JSON-only authoring check in CI.
- The default-content comparison passed on 20 route/viewport combinations: ten routes at 1440px and 390px. Normalized wording, element nesting, non-data attributes, and measured geometry matched the pre-refactor production baseline exactly. Astronomical readouts and decorative Canvas/ASCII snapshots were excluded because their real-time state legitimately changes. Added data attributes carry copy templates for client updates.
- `npm run test:content-edit` changed only JSON, built the real site, and verified new heading text, `<br>`/`<em>` formatting, shared research titles, live lunar display wording, category labels, and singular/plural filter messages. Renaming a publication/category display label did not alter filtering identity. HTML-looking input stayed escaped text and created no DOM element or executable handler. The test restored the original JSON bytes and rebuilt defaults in cleanup.
- The full `npm run test:browser` suite passed: all 11 axe scans clean, responsive checks at 320/390/768/1440px, mobile keyboard navigation, publication/journal filters, citation copy/downloads, reduced motion, off-screen pausing, no-JavaScript fallback, CV/RSS/sitemap requests, and no browser errors.
- Before/after homepage and About screenshots were generated, opened, and reviewed. The comparison caught and corrected tiny whitespace differences around inline arrows and heading punctuation.

No CSS, moon texture, wave/tide mathematics, ephemeris calculations, dependency versions, or publication/project/article records were changed. The lunar client script only reads its display strings from data attributes. The browser client does not load the complete content catalog. Results and screenshots are under ignored `artifacts/content-management/` and `artifacts/browser-report.json`.

The refactor is intended for pull-request review; no production deployment is part of this change.
