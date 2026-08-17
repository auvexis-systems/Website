# Auvexis Systems — Website

Static, multi-locale (DE/EN) marketing website for Auvexis Systems, built from
the master brief. This README documents what's here, why it's built this way,
and what's still open.

## Why not Next.js?

The brief's preferred stack was Next.js + TypeScript. This codebase was built
in a sandboxed environment with **no access to the npm registry** (an org-level
network policy), so `npm install` could not run for Next.js, React, Tailwind,
or any other package. Rather than block on that, the site was built as a
**zero-dependency static site** that mirrors a Next.js information
architecture as closely as possible, so migrating later is mostly mechanical:

| This project | Next.js equivalent |
|---|---|
| `content/de.json`, `content/en.json` | translation dictionaries (e.g. `next-intl` messages) |
| `templates/partials/*.html` | React components (`Header.tsx`, `Hero.tsx`, …) |
| `templates/layout.html` | `app/[locale]/layout.tsx` |
| `build/build.mjs` (orchestration) | `app/[locale]/page.tsx` (data → component tree) |
| `build/template-engine.mjs` | not needed — JSX replaces it directly |
| `src/scripts/main.ts` | client components (`"use client"`) for the same interactions |
| `src/styles/*.css` | can be dropped in almost as-is (plain CSS + custom properties), or ported to Tailwind tokens |

Content already lives entirely outside the templates (see `content/*.json`),
which was one of the brief's explicit requirements ("Content möglichst von
Layout trennen") — so the highest-effort part of a real migration (separating
copy from markup) is already done.

**V2 recommendation:** once this runs somewhere with normal npm access, redo
the build step in Next.js (App Router) using this same content/partial split.
Everything else — design tokens, copy, IA, accessibility behavior — carries
over directly.

## What's here

```
content/            DE + EN content dictionaries (single source of truth for copy)
templates/           HTML partials + layout, rendered by build/build.mjs
src/styles/           tokens.css (design tokens) + main.css (all component styles)
src/scripts/main.ts   client-side interactivity (nav toggle, scroll-reveal, contact form)
src/assets/            logo mark, precision-core hero visual, favicon (hand-authored SVG)
build/                 the static site generator (build.mjs) + its template engine
public/                 og-image.png (generated from build/og-card.svg via sharp)
dist/                   generated output — this is what you deploy
```

## Build & run

```bash
npm install          # only needed once you have npm registry access
npm run build         # compiles src/scripts/main.ts → runs the static site generator → dist/
npm run serve         # serves dist/ locally on http://localhost:4173
```

`dist/` in this delivery was already built and is ready to deploy as-is to
any static host (Netlify, Vercel static export, Cloudflare Pages, GitHub
Pages, S3+CloudFront, plain nginx, …) — just point it at the `dist/` folder,
or rebuild via `npm run build` first if you've changed anything.

## Content architecture (i18n)

- German is the default locale, served at the site root (`/`).
- English lives under `/en/`.
- All copy — nav labels, headings, card text, legal placeholder text, form
  labels, everything — lives in `content/de.json` / `content/en.json`. There
  is no hardcoded copy in the templates.
- Adding a third language later means: add `content/xx.json`, add an entry to
  the `locales` map in `build/build.mjs`, done — the template/partial layer
  doesn't change.

## Design tokens

`src/styles/tokens.css` is the single source of truth for color, type scale,
spacing, and motion timing, matching the brand board:
base `#080A0D`/`#0D1117`, surface `#141922`, border `#253246`, primary blue
`#2563EB` / highlight `#3B82F6`.

## Typography

Headings and body text use a system font stack (`-apple-system`, "Segoe UI",
Roboto, system-ui, sans-serif) — see `--font-heading`/`--font-body` in
`tokens.css`. Exo 2 / Inter are **not** loaded from Google Fonts in
production: the privacy policy states no third-party requests are made
beyond the page's own origin, so `templates/layout.html` deliberately does
not link `fonts.googleapis.com`. To bring back the exact brand typefaces,
self-host licensed woff2 files for Exo 2 and Inter under `src/assets/fonts/`,
add `@font-face` rules in `tokens.css`, and prepend the family names back
onto `--font-heading`/`--font-body` — everything else (weights, sizes) is
already tuned for them.

## Content honesty (per the brief's transparency requirement)

No invented customers, revenue, user counts, testimonials, or "X% done"
progress bars anywhere. Every solution area and pipeline item uses one of
four qualitative, real statuses: **In Entwicklung**, **Prototyp**, **Konzept**,
**Future Vision/Concept**. VYRO-B is explicitly and repeatedly labeled as a
future research vision, not a product.

## Contact form

There is no backend in a static deploy, so the form does the honest thing:
it validates client-side (required fields + email format, inline errors,
`aria-live` status region), then opens the visitor's email client via a
pre-filled `mailto:` link to `auvexissystems@gmail.com` — the same address
also shown as a direct, always-visible fallback next to the form.

**TODO for a real submission flow:** wire the form's `fetch`/submit handler
in `src/scripts/main.ts` to a real backend once one exists — a serverless
function, Formspree, Netlify Forms, etc. The validation and status-message
UI are already built to support swapping in a real request instead of the
mailto fallback with a small code change.

## Legal pages

`Impressum`, `Datenschutz`, and `Cookie-Einstellungen` (and their EN
equivalents `/en/imprint/`, `/en/privacy/`, `/en/cookie-settings/`) contain
real content, not placeholders. The German Impressum and Datenschutzerklärung
are the verbatim text generated by e-recht24.de from the site operator's own
submitted details (name, address, Strato hosting, no analytics/tracking/
newsletter/social plugins/maps/captcha) — see `content/de.json` → `legal`.
Each legal page's markup lives in one `bodyHtml` field (semantic
`h2`/`h3`/`h4`/`p`/`ul`/`a`, rendered raw via `{{{legalContent.bodyHtml}}}`
in `templates/partials/legal-page.html`) plus a `sourceNote` crediting
e-recht24.de.

The EN versions (`content/en.json` → `legal`) are non-binding translations of
the same German source, each carrying a visible `translationNotice` stating
the German original is legally binding. **German is authoritative** for all
legal content; if the underlying facts change (address, hosting provider,
added tooling), regenerate the German text at e-recht24.de first, update
`content/de.json`, then re-translate `content/en.json`.

Cookie-Einstellungen is hand-written (not eRecht24-generated) and describes
the site's actual state: no cookies are set at all — no analytics, no
marketing, no third-party embeds — so no consent banner is shown, on the
basis that a consent UI for cookies that don't exist would be misleading
rather than helpful. Update it if that ever changes.

## QA performed in this session (V1)

- Full build (`npm run build` equivalent) with zero template/render errors.
- TypeScript compiles clean under `strict` mode (`tsc --noEmit`).
- Automated link-check across all 8 pages (DE/EN home + 3 legal pages each) — no broken internal links.
- Headless-browser screenshot QA at desktop (1440px) and mobile (390px) for DE and EN homepages, plus the Impressum page.
- Interaction tests: mobile nav open/close, contact form empty-submit validation, knowledge accordion, language-switch link correctness, custom 404 page.
- Accessibility spot-checks: single `h1`, no un-alt'd images, landmark roles present, no heading-level skips, all form fields labeled, focus-visible states, WCAG AA contrast ratios verified numerically for all text/background pairs (lowest ratio 5.17:1, well above the 4.5:1 requirement).
- Fixed three real bugs found during this QA: a mobile hamburger icon that collapsed to 0×0 (inline `<span>` given `width`/`height`, which has no effect on inline elements), the mobile nav drawer not reaching the bottom of the screen (a `backdrop-filter` on an ancestor changes the containing block for `position: fixed` children in Chromium, so the drawer's `bottom: 0` resolved against the ~64px header instead of the viewport), and a duplicate "Projekt besprechen" button appearing twice in the desktop header.

## V2 / release-readiness pass — what changed

- **Nav-anchor bug fixed**: header/footer nav links from subpages (e.g.
  Impressum → "Contact") were resolving to a bare `#contact` instead of
  `/#contact`, because the template engine swaps render context inside
  `{{#each header.nav}}`, so `{{page.homeHref}}` inside the loop body
  couldn't see the outer `page` object. Fixed by precomputing each nav
  item's full href (`page.homeHref + href`) in `build.mjs` before the loop
  runs, rather than trying to resolve it inside the template.
- **Knowledge accordion grid fixed**: `.knowledge-grid` used CSS Grid's
  default `align-items: stretch`, so opening one `<details>` stretched its
  still-closed row-mate to match height, leaving visible empty space inside
  its border. Fixed with `align-items: start`.
- **Branding refreshed**: `logo-mark.svg`, `precision-core.svg` (hero), and
  `favicon.svg` were redrawn as more refined/premium versions of the same
  A-mark concept (richer multi-stop steel gradient, a machined bevel
  highlight edge, tighter controlled blue glow, corner registration marks on
  the hero graphic) — not a new logo, not a reversion to an older one. The
  header/footer brand lockup switched from a stacked two-line "AUVEXIS /
  SYSTEMS" to a single-line horizontal wordmark.
- **Impressum & Datenschutzerklärung**: real content from the operator's
  eRecht24 PDFs, replacing every TODO placeholder — see "Legal pages" above.
- **Google Fonts removed** from production (`templates/layout.html`) — see
  "Typography" above. Confirmed via full-project grep: no analytics,
  tracking, social, maps, captcha, or AI-service scripts anywhere.
- **Cookie-Einstellungen rewritten** to describe reality (no cookies at all)
  instead of a placeholder "TODO: add consent management" note.
- **Legal-page overflow bugs fixed**: two long, space-less German compound
  headings/titles (`Verbraucherstreitbeilegung/Universalschlichtungsstelle`,
  `Datenschutzerklärung` at the H1 size) caused horizontal viewport overflow
  on mobile, since the browser's default word-wrap only breaks at spaces.
  Fixed with `overflow-wrap: anywhere` on `.legal-body` and `.legal-page h1`.
- **Header overflow at ~1024px fixed**: the six-item desktop nav + language
  switch + CTA + logo didn't fit inline below ~1080px, overflowing the
  viewport at common tablet/small-laptop widths. The hamburger-drawer
  breakpoint moved from `max-width: 900px` to `max-width: 1080px` so the
  compact header takes over before that cramped zone.
- **Production domain verified**: `build/build.mjs` already used
  `SITE_URL = "https://auvexissystems.de"` with no base path, correct
  `robots.txt` (`Allow: /`), and no `noindex` meta — confirmed by grepping
  the whole project for `Website-Test`, `github.io`, `noindex`, and local
  filesystem paths (all zero matches outside the pre-existing `dist/`, which
  was then rebuilt clean).

## Assets/content still needed from the client

- A decision on contact-form backend (serverless function vs. a form service like Formspree) once ready to move off the mailto fallback.
- Optional: self-hosted Exo 2 / Inter font files, to restore the exact brand typefaces instead of the system font fallback (see "Typography" above).
- Optional: a professionally designed OG/social preview image to replace the programmatically generated placeholder in `public/og-image.png`.
- Optional: real favicon/app-icon set (multiple sizes, `.ico`/PNG) if broader browser/OS icon support is wanted beyond the current SVG favicon.

## V2 recommendations

- Migrate the build step to Next.js (App Router) once npm access is available, keeping `content/*.json` as-is.
- Add a real cookie-consent manager only once actual non-essential cookies are introduced (none are used today).
- Add automated accessibility testing (e.g. axe-core) and visual regression testing to CI once a CI environment with network access exists.
- Consider extracting the six Solution cards and four Pipeline items into individually routable detail pages (`/solutions/ai-systems-agents/`, etc.) — the data model already supports this since every item has a stable `id`.
- Add structured data (`Organization` JSON-LD) once the business has stable, real details to publish (address, etc.) — a hook (`page.jsonLd`) already exists in the layout template for this.
