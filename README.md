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
`#2563EB` / highlight `#3B82F6`. Headings use Exo 2, body text uses Inter
(both loaded from Google Fonts — see the note on that below).

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
equivalents `/en/imprint/`, `/en/privacy/`, `/en/cookie-settings/`) are built
and linked from the footer, but their body content is intentionally made of
clearly marked **TODO placeholders** — per the brief, no legal text was
invented. Each page also shows a visible on-page notice that it's a
placeholder. **These must be replaced with real, legally reviewed content
before the site goes live** — see `content/de.json` → `legal` / same in
`content/en.json`.

## Known environment limitation: Google Fonts

The site links Exo 2 / Inter from `fonts.googleapis.com` in `<head>` — this
loads fine in any normal visitor's browser. It could **not** be verified from
inside the build sandbox itself, since that sandbox's network is restricted
to a small domain allowlist that excludes Google Fonts (visible as one
harmless `ERR_TUNNEL_CONNECTION_FAILED` console message during automated
QA in this environment only). Text still renders correctly using the
system-font fallbacks defined in `tokens.css`.

## QA performed in this session

- Full build (`npm run build` equivalent) with zero template/render errors.
- TypeScript compiles clean under `strict` mode (`tsc --noEmit`).
- Automated link-check across all 8 pages (DE/EN home + 3 legal pages each) — no broken internal links.
- Headless-browser screenshot QA at desktop (1440px) and mobile (390px) for DE and EN homepages, plus the Impressum page.
- Interaction tests: mobile nav open/close, contact form empty-submit validation, knowledge accordion, language-switch link correctness, custom 404 page.
- Accessibility spot-checks: single `h1`, no un-alt'd images, landmark roles present, no heading-level skips, all form fields labeled, focus-visible states, WCAG AA contrast ratios verified numerically for all text/background pairs (lowest ratio 5.17:1, well above the 4.5:1 requirement).
- Fixed three real bugs found during this QA (see git history / diffs): a mobile hamburger icon that collapsed to 0×0 (inline `<span>` given `width`/`height`, which has no effect on inline elements), the mobile nav drawer not reaching the bottom of the screen (a `backdrop-filter` on an ancestor changes the containing block for `position: fixed` children in Chromium, so the drawer's `bottom: 0` resolved against the ~64px header instead of the viewport), and a duplicate "Projekt besprechen" button appearing twice in the desktop header.

## Assets/content still needed from the client

- Real Impressum details (legal name, address, authorized representative, phone, email, VAT ID if any).
- Real Datenschutz (privacy policy) content — controller details, actual data flows once any analytics/tooling is added, hosting provider details.
- A decision on contact-form backend (serverless function vs. a form service like Formspree) once ready to move off the mailto fallback.
- Optional: a professionally designed OG/social preview image to replace the programmatically generated placeholder in `public/og-image.png`.
- Optional: real favicon/app-icon set (multiple sizes, `.ico`/PNG) if broader browser/OS icon support is wanted beyond the current SVG favicon.

## V2 recommendations

- Migrate the build step to Next.js (App Router) once npm access is available, keeping `content/*.json` as-is.
- Add a real cookie-consent manager only once actual non-essential cookies are introduced (none are used today).
- Add automated accessibility testing (e.g. axe-core) and visual regression testing to CI once a CI environment with network access exists.
- Consider extracting the six Solution cards and four Pipeline items into individually routable detail pages (`/solutions/ai-systems-agents/`, etc.) — the data model already supports this since every item has a stable `id`.
- Add structured data (`Organization` JSON-LD) once the business has stable, real details to publish (address, etc.) — a hook (`page.jsonLd`) already exists in the layout template for this.
