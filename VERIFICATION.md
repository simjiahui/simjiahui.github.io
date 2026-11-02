# Verification record

Verified in the managed Linux workspace on **2 November 2026 (Japan time)**, using Node 24.19.0, Astro 7.4.4, Playwright 1.64.1, and the installed system Chromium.

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
