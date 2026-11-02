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

For a normalized disc point `(x,y)`, take `z = sqrt(1-x²-y²)`. With lunar elongation `ψ`, the illustrative directional light is `(sin ψ, 0, -cos ψ)`. The positive dot product gives the visible lit surface. Procedural low-amplitude texture and a fixed crater field select glyphs from a luminosity ramp. This is not a lunar albedo map, photograph, libration model, or exact projected terminator ephemeris; the displayed numerical illumination comes from Astronomy Engine.

The sphere is corrected for the approximate width/height ratio of monospace character cells. Rendering uses actual Canvas `fillText`, not a tilde-line illustration. Blue and pink are restrained accents across the textured water and stars. The Canvas is decorative and hidden from assistive technologies; all factual readouts are real text outside it.

## Artistic ocean dynamics

The real lunar phase and the animated sea use separate clocks. For visual time `t` seconds, let `h = 2400t / 3600` accelerated solar hours. The conceptual water-level envelope is

```text
E(t,ψ) = 0.65 cos(2πh/12.4206 − 2ψ) + 0.30 cos(2πh/12).
```

Those are the approximate lunar semidiurnal M2 and solar semidiurnal S2 periods. Their epoch and coefficients are illustrative, not derived from the reference observer's local ocean. A spring–neap multiplier `(1 + cos(2ψ))/2` modulates wave strength. Their interference changes the drawn horizon by a small fraction of the scene height.

Three propagating sinusoidal layers add swell, crossing waves, and short ripples at different spatial and temporal frequencies. A Gaussian reflection corridor broadens with distance below the horizon and meanders with the waves; its brightness depends on lunar illumination. Fields are mapped to a varied ASCII glyph ramp and muted color/alpha values.

**No output is in metres, and no coastal tide is predicted.** Bathymetry, coastline shape, local harmonic constituents, weather, and ocean boundary conditions are absent. Even the reference moon coordinates do not make the sea local to Sendai. The colophon and hero notes state this distinction.

## Rendering, performance, and lifecycle

- Target: 30 FPS on capable devices, via `requestAnimationFrame` with a frame interval cap.
- Pixel ratio capped at 1.5. Character height starts at 14 px, or 17 px on narrow screens.
- Every 60 frames, average draw cost is checked; expensive scenes use fewer characters.
- ResizeObserver recomputes cell count and Canvas size.
- IntersectionObserver pauses animation outside the viewport; page visibility pauses it in background tabs.
- `prefers-reduced-motion` draws a still frame and starts/stops live motion when the preference changes.
- A pre-rendered detailed ASCII `<pre>` is the no-JavaScript/Canvas fallback.
- Event listeners, observers, timer, and animation frame are cleaned up before any future Astro page-swap integration. Current navigation is ordinary document navigation, whose teardown releases the page.
- Overlay gradients provide a quiet field behind text. Mobile composition reserves space above the name for the moon.

The initial hero client chunk is roughly 5 KB before gzip. Astronomy/calendar calculations are a separate lazy-loaded chunk; those libraries are intentionally more substantial than the renderer. Other pages do not load them. The static server generates all content and equations, leaving the browser little non-artistic work.

## CV generation

PDFKit (MIT) is the comparable open-source PDF solution, avoiding a Python/TeX toolchain. `scripts/generate-cv.ts` validates and reads the exact same profile and academic JSON as the site, groups publications and talks, paginates, and writes a conventional A4 academic CV. A temporary file is structurally checked and atomically renamed only after successful completion. A generation failure fails the build.

The default built-in Times fonts support Latin text. A user-provided licensed Unicode font at `public/fonts/cv.ttf` (or `CV_FONT_PATH`) supports other scripts without template changes. Website LaTeX/HTML should not be placed in plain-text academic records.

`npm run build` always generates `/cv.pdf` before Astro copies public assets. Local development can prepare it with `npm run cv`. Generated PDFs, builds, caches, screenshots, and node_modules are ignored in Git. The Pages artifact includes the generated PDF.

## Deployment and checks

`astro.config.mjs` sets the root user-site URL `https://simjiahui.github.io`. Root-relative links deliberately target a user-site repository, not a project-subpath deployment.

The workflow follows the official Astro Pages pattern using `withastro/action@v3` with Node 24, then `actions/deploy-pages@v4`. The official action installs from the committed npm lockfile, runs the project build, and uploads the static Pages artifact. Subsequent type, formatting, unit, and browser checks must all succeed before the dependent deployment job is eligible. PRs cannot deploy; the deploy job is limited to `main` outside pull-request events. Build permission is read-only; only the deploy job receives Pages write and OIDC token permissions. Enable GitHub Actions as the Pages source in repository settings.

The link checker crawls generated local href/src references and HTML fragments, including CV and assets. It does not crawl external academic links. Browser checks use Playwright Chromium and axe for WCAG A/AA rules, exercise filters and mobile navigation, check 320/390/768/1440 px layouts, verify motion/fallback behavior, and save screenshots. Automated accessibility tests are useful evidence, not a substitute for a full assistive-technology audit.

There is no recurring paid service requirement. No publication, merge, or live deployment is assumed from a successful local build. See `VERIFICATION.md` for actual observed results.
