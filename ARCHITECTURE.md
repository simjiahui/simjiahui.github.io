# Architecture and mathematical assumptions

## A static website with a small interactive surface

Astro 7 emits static HTML for GitHub Pages. TypeScript is strict. There is no application backend, database, login, API key, client-side router, or framework hydration. The only browser code handles navigation, list filters/citation actions, and the homepage ASCII scene. Fonts, CSS, images, and scripts are self-hosted.

```text
src/
  pages/          Routes, RSS and robots endpoints, journal article generation
  layouts/        Shared accessible document, navigation, SEO and footer
  components/     Hero, headings, publication/project/article views
  data/           Profile, academic and project JSON; validated schemas; theme text
  content/        Markdown journal articles
  lib/
    astronomy.ts  Real lunar/sky/calendar state and festival registry
    tides.ts      Pure artistic dynamical model
    ascii.ts      Pure character-cell scene and static snapshot
    github.ts     Build-time public metadata with cache/fallback
  scripts/        Browser animation and publication filter/citation behavior
  styles/         Responsive editorial design and reduced-motion/print styles
scripts/          PDF generator, built-site link checker, browser verification
tests/            Known-date astronomy, calendar, wave, content and workflow tests
public/           Static illustrations, favicon, social image, user images, generated CV
.github/          GitHub Actions validation and Pages deployment
```

## Browser-editable page wording

`src/data/siteContent.json` centralizes page wording, shared labels/messages, biography, and research-theme text. `siteContent.ts` applies an explicit strict Zod schema, validates stable identities/placeholders, and exposes shared profile interpolation. `RichText.astro` emits only text nodes, `<br>`, and `<em>` from a tiny newline/single-asterisk syntax; it adds no wrapper and never parses user-authored HTML. Metadata uses a plain-text projection. Scientific formulas keep their existing build-time KaTeX path.

Filter counts, citation feedback, and dynamic lunar readouts receive their text templates through data attributes, so client updates retain edited wording without bundling the complete content catalog. Identity/links remain in `profile.json`; academic records, curated projects, and Markdown articles retain their single existing sources. Styles, routing, astronomical calculations, and renderer behavior are unchanged.

`npm run test:content-edit` temporarily changes only JSON to exercise the actual built site, including heading emphasis/line breaks, safe literal HTML, shared research labels, lunar updates, and filter messages. It restores the original bytes and rebuilds defaults in cleanup. `scripts/content-check.ts --record` / `scripts/content-check.ts` records/compares the default DOM and geometry across ten routes at desktop/mobile widths for this refactor; this optional baseline is not imposed on routine edits that intentionally change copy.

## One academic record

`src/data/index.ts` validates the JSON using Zod. Publications, talks, and posters use one schema. Types and years drive filters; exact author-name matching highlights the site owner. Invalid dates, unsafe link schemes, duplicate academic IDs, and missing related-publication IDs fail the build. Empty optional metadata stays empty. Placeholders carry an explicit flag and are excluded from the CV and real related-work lists.

`src/content.config.ts` uses Astro content collections and a filesystem loader. Markdown frontmatter validates at build time. Non-draft posts are sorted for listings and RSS. KaTeX renders formulas at build time, including MathML for assistive technologies; Shiki highlights code without a browser runtime.

`src/lib/github.ts` fetches only explicitly curated public repository metadata, with a 4-second timeout. It accepts only GitHub repository URLs, stores non-secret metadata under ignored `.cache/github`, and falls back on error. No private repository API, browser request, or token is required. The current sample intentionally has no repository URL.

## Astronomy and calendar: what is calculated

Astronomy Engine supplies:

- `MoonPhase(date)`: Sun–Moon ecliptic longitude difference, normalized to 0–360°.
- `Illumination(Body.Moon, date)`: physical illuminated fraction.
- `Equator` and `Horizon`: apparent topocentric horizontal coordinates for the reference observer, including normal atmospheric refraction.

The reference observer is **Sendai, Japan, 38.2682° N, 140.8694° E, elevation 0 m**. The phase label uses the whole phase angle, so waxing and waning cannot be confused by equal illumination fractions. Near the four principal phases, a ±5° naming window is used; the fraction remains continuous.

The real-time calculation uses UTC instants. Calendar presentation deliberately uses **UTC+8 (`Asia/Shanghai`)**, which is also Malaysia's civil offset. `Intl.DateTimeFormat` first selects the civil day in that zone, then `lunar-javascript` converts that day. Leap lunar months retain a negative month number. A small extensible `festivals` registry matches normal lunar month/day values; leap months are excluded. It currently recognizes Lunar New Year (1/1) and Mid-Autumn (8/15).

The static HTML carries a build-time snapshot. The client lazily imports the astronomy/calendar chunk after initial rendering, refreshes it after 500 ms, and updates every minute while visible. Reopening a hidden tab refreshes the real state. The snapshot remains a documented snapshot when JavaScript or module loading is unavailable.

## The moon is a phase model, not a sky map

The disc occupies a fixed compositional position; its altitude/azimuth do not determine its pixel position. Reference sky coordinates are displayed separately in observation notes. The phase orientation is north-up, rather than the visitor's local sky angle. No visitor geolocation is requested.

For a normalized disc point `(x,y)`, take `z = sqrt(1-x²-y²)`. The real illuminated fraction `f` sets a light vector with `Lz = 2f − 1` and `Lx = ±sqrt(1 − Lz²)`. The sign comes from the full elongation angle, preserving waxing/waning orientation. Positive dot products reproduce the illuminated projected disc area. A rough diffuse (Lommel–Seeliger-like) response, broad maria, four-octave terrain noise, 46 crater rims, and restrained ejecta rays produce luminosity-coded ASCII. The texture is illustrative, not a photographic albedo map or libration model.

The moon has a fixed compositional position, separately documented from its real reference sky coordinates. Reflection follows the bright side's approximate centroid and physical illuminated fraction; a new moon has no artificial full-moon reflection. No visitor geolocation is requested.

## Artistic ocean dynamics

The slow envelope now starts from actual topocentric **Sun and Moon declinations, hour angles, and distances** at the Sendai reference location. For each body, latitude `φ`, declination `δ`, and hour angle `H` give a vertical direction cosine and a quadrupolar equilibrium potential:

```text
q = sin φ sin δ + cos φ cos δ cos H
P₂(q) = (3q² − 1) / 2
E = 0.65 (rMoon,mean/rMoon)³ P₂(qMoon)
  + 0.30 (1 AU/rSun)³ P₂(qSun)
```

Real sidereal time and apparent equatorial coordinates initialize the hour angles. For visual evolution, those angles advance at approximate lunar-day (24.8412 h) and solar-day (24 h) rates, accelerated **720×**. The principal semidiurnal visual cycle is approximately a minute, rather than the earlier 18-second cycle. Geometry refreshes each minute without resetting the continuous visual clock. Declinations/distances are held between updates; this is not a rapidly advanced ephemeris. The numeric-angle helper used for deterministic static/test scenes is an equatorial reference configuration, not local sky geometry.

Six directional wave bands combine swell, crossing seas, wind waves, and fine ripples. Two slow domain distortions prevent a visibly repeating sinusoidal grid. A perspective mapping compresses distant wavelengths; slopes, crest contours, and capillary ripples modulate shading. The geometry is illustrative and the distorted slope approximation is used for light, not fluid integration. Narrow cream glints are broken by changing surface facets; blue crest lines and rare sakura-pink edge glints sit over dark troughs. Reflection width expands toward the foreground and its path wanders with the waves, rather than remaining a rigid bright stripe.

**No output is in metres, and no coastal tide is predicted.** Local bathymetry, coastline shape, measured harmonic constituents, weather, and ocean boundary conditions are absent. Actual celestial geometry does not turn this artistic sea into a local tide table or daylight sky simulation.

## Rendering, performance, and lifecycle

- A packed cell code selects a glyph and one of 24 intensity levels in four palettes. Numeric wave sampling reuses one scratch object instead of allocating per cell.
- A locally rasterized glyph atlas caches text shaping. The textured moon and stars are cached into a static sky layer and rebuilt only for size/quality/ephemeris changes.
- Animated water glyphs are composed into a reusable typed pixel buffer using cached sparse glyph masks, then uploaded/blitted as **one image per frame**. This avoids thousands of Canvas draw calls without replacing the animation with pre-recorded media.
- Target: 30 FPS. Desktop starts at 8.5 px cells with a 350-column ceiling; mobile starts at 9 px cells. Density adapts when measured drawing cost is too high and can recover gradually.
- Pixel ratio is capped at 1.5 desktop and 1.25 mobile. Buffers, masks, glyph shaping, sky, and Canvas dimensions are rebuilt only as required.
- ResizeObserver batches changes. IntersectionObserver and page visibility pause off-screen/background rendering. Reduced motion produces a detailed still frame; real calendar updates remain available.
- Responsive desktop/mobile pre-rendered ASCII snapshots provide a no-JavaScript/Canvas fallback. Their lunar state is the build-time snapshot.
- Timers, observers, queued resize work, and animation callbacks are released before a page swap/unload. Back-forward cache restoration resumes without resetting the visual clock.
- Hero-only gradients protect heading/navigation legibility and leave the right-hand sea open. No typography, navigation, or other page layout is changed by this refinement.

Astronomy/calendar calculations remain a separate lazy-loaded chunk. Other pages do not load the animation. The static server still generates all content and mathematical typesetting.

`scripts/animation-check.ts` captures actual desktop/tablet/phone frames, four deterministic lunar-phase fixtures, reduced motion, and the no-JavaScript fallback, and measures drawing time/FPS. Run after `npm run build` with `ASTRO_TELEMETRY_DISABLED=1 node --import tsx scripts/animation-check.ts`. Artifacts go to ignored `artifacts/lunar-refinement/`. Headless measurements are specific to the test host, not a guarantee for every device.

## CV generation

PDFKit (MIT) is the comparable open-source PDF solution, avoiding a Python/TeX toolchain. `scripts/generate-cv.ts` validates and reads the exact same profile and academic JSON as the site, groups publications and talks, paginates, and writes a conventional A4 academic CV. A temporary file is structurally checked and atomically renamed only after successful completion. A generation failure fails the build.

The default built-in Times fonts support Latin text. A user-provided licensed Unicode font at `public/fonts/cv.ttf` (or `CV_FONT_PATH`) supports other scripts without template changes. Website LaTeX/HTML should not be placed in plain-text academic records.

`npm run build` always generates `/cv.pdf` before Astro copies public assets. Local development can prepare it with `npm run cv`. Generated PDFs, builds, caches, screenshots, and node_modules are ignored in Git. The Pages artifact includes the generated PDF.

## Deployment and checks

`astro.config.mjs` sets the root user-site URL `https://simjiahui.github.io`. Root-relative links deliberately target a user-site repository, not a project-subpath deployment.

The workflow follows the official Astro Pages pattern using `withastro/action@v3` with Node 24, then `actions/deploy-pages@v4`. The official action installs from the committed npm lockfile, runs the project build, and uploads the static Pages artifact. Subsequent type, formatting, unit, and browser checks must all succeed before the dependent deployment job is eligible. PRs cannot deploy; the deploy job is limited to `main` outside pull-request events. Build permission is read-only; only the deploy job receives Pages write and OIDC token permissions. Enable GitHub Actions as the Pages source in repository settings.

The link checker crawls generated local href/src references and HTML fragments, including CV and assets. It does not crawl external academic links. Browser checks use Playwright Chromium and axe for WCAG A/AA rules, exercise filters and mobile navigation, check 320/390/768/1440 px layouts, verify motion/fallback behavior, and save screenshots. Automated accessibility tests are useful evidence, not a substitute for a full assistive-technology audit.

There is no recurring paid service requirement. No publication, merge, or live deployment is assumed from a successful local build. See `VERIFICATION.md` for actual observed results.
