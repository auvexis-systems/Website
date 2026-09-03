#!/usr/bin/env node
// Zero-dependency static site build for Auvexis Systems.
//
// Why a hand-rolled build instead of Next.js: this codebase was produced in a
// sandboxed environment without npm registry access, so no framework could be
// installed. The architecture below deliberately mirrors what a Next.js
// migration would look like — content lives in locale JSON dictionaries
// completely separate from markup (see /content), markup lives in small
// composable partials (see /templates/partials), and this script is the only
// thing that would be replaced by React/Next.js page + layout components.
// See README.md for the migration notes.

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "./template-engine.mjs";
import { icons } from "./icons.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const SITE_URL = "https://auvexissystems.de";

function readJson(relPath) {
  return JSON.parse(readFileSync(path.join(ROOT, relPath), "utf8"));
}

function readTemplate(relPath) {
  return readFileSync(path.join(ROOT, "templates", relPath), "utf8");
}

function writeFile(relDistPath, contents) {
  const full = path.join(DIST, relDistPath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, contents, "utf8");
}

const STATUS_KEYS = ["in-development", "prototyping", "concept", "future", "future-concept"];

function withStatusLabel(item, statusLabels) {
  return { ...item, statusLabel: statusLabels[item.status] || item.status };
}

// ---------------------------------------------------------------------------
// Locale configuration
// ---------------------------------------------------------------------------
const locales = {
  de: {
    contentFile: "content/de.json",
    homeHref: "/",
    ogLocale: "de_DE",
  },
  en: {
    contentFile: "content/en.json",
    homeHref: "/en/",
    ogLocale: "en_US",
  },
};

const partials = {
  header: readTemplate("partials/header.html"),
  hero: readTemplate("partials/hero.html"),
  architecture: readTemplate("partials/architecture.html"),
  ecosystem: readTemplate("partials/ecosystem.html"),
  platform: readTemplate("partials/platform.html"),
  pipeline: readTemplate("partials/pipeline.html"),
  knowledge: readTemplate("partials/knowledge.html"),
  transparency: readTemplate("partials/transparency.html"),
  products: readTemplate("partials/products.html"),
  roadmap: readTemplate("partials/roadmap.html"),
  about: readTemplate("partials/about.html"),
  contact: readTemplate("partials/contact.html"),
  footer: readTemplate("partials/footer.html"),
  legalPage: readTemplate("partials/legal-page.html"),
  notFound: readTemplate("partials/not-found.html"),
  kaHero: readTemplate("partials/ka-hero.html"),
  kaProblemSolution: readTemplate("partials/ka-problem-solution.html"),
  kaArchitecture: readTemplate("partials/ka-architecture.html"),
  kaLocalFirstAgents: readTemplate("partials/ka-local-first-agents.html"),
  kaHardware: readTemplate("partials/ka-hardware.html"),
  kaRoadmap: readTemplate("partials/ka-roadmap.html"),
};
const layout = readTemplate("layout.html");

// ---------------------------------------------------------------------------
// Generic route registry — adding a future product page means adding one
// entry here (kind: "content") plus its partials; no new hardcoded build
// logic is needed. "home" and "legal" are the only other kinds because they
// have genuinely different shapes (home assembles a fixed section list from
// top-level content keys; legal pages render one shared legal-page partial
// against content.legal[contentKey]).
// ---------------------------------------------------------------------------
const PAGES = [
  { id: "home", kind: "home" },
  {
    id: "knowledge-accelerator",
    kind: "content",
    deSlug: "knowledge-accelerator",
    enSlug: "knowledge-accelerator",
    contentKey: "knowledgeAccelerator",
    contentAlias: "ka",
    partials: ["kaHero", "kaProblemSolution", "kaArchitecture", "kaLocalFirstAgents", "kaHardware", "kaRoadmap"],
  },
  { id: "impressum", kind: "legal", contentKey: "impressum", deSlug: "impressum", enSlug: "imprint" },
  { id: "datenschutz", kind: "legal", contentKey: "datenschutz", deSlug: "datenschutz", enSlug: "privacy" },
  { id: "cookies", kind: "legal", contentKey: "cookies", deSlug: "cookie-einstellungen", enSlug: "cookie-settings" },
];

function buildPageContext(content, localeKey, routePath, { title, description, ogImagePath }) {
  const page = {
    homeHref: locales[localeKey].homeHref,
    deHref: localeKey === "de" ? routePath : "/", // callers override with the exact cross-locale equivalent
    enHref: localeKey === "en" ? routePath : "/en/",
    isDe: String(localeKey === "de"),
    isEn: String(localeKey === "en"),
    assetsPrefix: "/",
    title,
    description,
    canonical: SITE_URL + routePath,
    ogImageUrl: SITE_URL + ogImagePath,
    ogLocale: locales[localeKey].ogLocale,
    jsonLd: "",
  };
  // hreflang is finalized by finalizePageHreflang() after deHref/enHref are set
  return page;
}

function finalizePageHreflang(page) {
  page.hreflangDe = SITE_URL + page.deHref;
  page.hreflangEn = SITE_URL + page.enHref;
}

// Recursively precomputes each nav item's fully-qualified href, including
// nested `children` (the two-level Platform/Products dropdowns). This has to
// happen here, in JS, rather than inside the {{#each}} template loop: the
// template engine swaps render context to the loop item for the loop body,
// so a reference to {{page.homeHref}} inside {{#each header.nav}} (or a
// nested {{#each children}}) can never see the outer page object — it
// silently resolves to "" and leaves a bare "#anchor" href that only works
// while already on the homepage. See README "Known issues fixed".
// An href starting with "/" is already a full route (e.g. the Knowledge
// Accelerator's dedicated page) and is used as-is, not prefixed.
function withFullHref(items, homeHref) {
  return items.map((item) => {
    const fullHref = item.href.startsWith("/") ? item.href : homeHref + item.href;
    const next = { ...item, fullHref };
    if (item.children) next.children = withFullHref(item.children, homeHref);
    return next;
  });
}

function assemblePage({ content, page, mainHtml }) {
  const navWithFullHref = withFullHref(content.header.nav, page.homeHref);
  const ctx = { ...content, page, header: { ...content.header, nav: navWithFullHref } };
  const headerHtml = render(partials.header, ctx);
  const footerHtml = render(partials.footer, ctx);
  const fullCtx = { ...ctx, headerHtml, mainHtml, footerHtml };
  return render(layout, fullCtx);
}

function buildHomepage(localeKey, content) {
  const platformWithIcons = content.platform.items.map((item) => ({
    ...withStatusLabel(item, content.statusLabels),
    iconSvg: icons[item.icon] || "",
  }));
  const pipelineWithLabels = content.pipeline.items.map((item) => withStatusLabel(item, content.statusLabels));
  const roadmapWithLabels = content.roadmap.phases.map((phase) => withStatusLabel(phase, content.statusLabels));

  const homeCtx = {
    ...content,
    platform: { ...content.platform, items: platformWithIcons },
    pipeline: { ...content.pipeline, items: pipelineWithLabels },
    roadmap: { ...content.roadmap, phases: roadmapWithLabels },
  };

  const routePath = locales[localeKey].homeHref;
  const page = buildPageContext(content, localeKey, routePath, {
    title: content.meta.titleHome,
    description: content.meta.descriptionHome,
    ogImagePath: "/og-image.png",
  });
  page.deHref = "/";
  page.enHref = "/en/";
  finalizePageHreflang(page);

  // Page order: Hero → system principle → platform explainer (ecosystem) →
  // core modules (platform) → development transparency (pipeline) →
  // knowledge Q&A → downstream products → roadmap → why-Auvexis
  // (transparency + about) → contact CTA.
  const sections = [
    partials.hero,
    partials.architecture,
    partials.ecosystem,
    partials.platform,
    partials.pipeline,
    partials.knowledge,
    partials.products,
    partials.roadmap,
    partials.transparency,
    partials.about,
    partials.contact,
  ];
  const ctxWithPage = { ...homeCtx, page };
  const mainHtml = sections.map((tpl) => render(tpl, ctxWithPage)).join("\n");

  const html = assemblePage({ content: homeCtx, page, mainHtml });
  writeFile(path.join(localeKey === "de" ? "." : "en", "index.html"), html);
  return routePath;
}

function buildLegalPage(pageDef, localeKey, content) {
  const slug = localeKey === "de" ? pageDef.deSlug : pageDef.enSlug;
  const routePath = localeKey === "de" ? `/${slug}/` : `/en/${slug}/`;
  const legalContent = content.legal[pageDef.contentKey];

  const page = buildPageContext(content, localeKey, routePath, {
    title: `${legalContent.title} — ${content.meta.siteName}`,
    description: legalContent.metaDescription,
    ogImagePath: "/og-image.png",
  });
  page.deHref = `/${pageDef.deSlug}/`;
  page.enHref = `/en/${pageDef.enSlug}/`;
  finalizePageHreflang(page);

  const ctx = { ...content, page, legalContent };
  const mainHtml = render(partials.legalPage, ctx);
  const html = assemblePage({ content, page, mainHtml });

  const outDir = localeKey === "de" ? slug : path.join("en", slug);
  writeFile(path.join(outDir, "index.html"), html);
  return routePath;
}

// Generic builder for any future "content" page (a dedicated product page
// like the Knowledge Accelerator): a locale-aware route, its own meta title/
// description from content[contentKey].meta, and an ordered list of partials
// rendered against a context exposing that content under `contentAlias`.
// Adding a new product page later needs one new PAGES entry and its
// partials/content — no changes to this function.
function buildContentPage(pageDef, localeKey, content) {
  const slug = localeKey === "de" ? pageDef.deSlug : pageDef.enSlug;
  const routePath = localeKey === "de" ? `/${slug}/` : `/en/${slug}/`;
  const pageContent = content[pageDef.contentKey];

  const page = buildPageContext(content, localeKey, routePath, {
    title: pageContent.meta.title,
    description: pageContent.meta.description,
    ogImagePath: "/og-image.png",
  });
  page.deHref = `/${pageDef.deSlug}/`;
  page.enHref = `/en/${pageDef.enSlug}/`;
  finalizePageHreflang(page);

  const ctx = { ...content, page, [pageDef.contentAlias || pageDef.contentKey]: pageContent };
  const mainHtml = pageDef.partials.map((key) => render(partials[key], ctx)).join("\n");
  const html = assemblePage({ content, page, mainHtml });

  const outDir = localeKey === "de" ? slug : path.join("en", slug);
  writeFile(path.join(outDir, "index.html"), html);
  return routePath;
}

function build404(content) {
  const page = buildPageContext(content, "de", "/404.html", {
    title: `${content.notFound.title} — ${content.meta.siteName}`,
    description: content.notFound.body,
    ogImagePath: "/og-image.png",
  });
  page.deHref = "/";
  page.enHref = "/en/";
  finalizePageHreflang(page);
  const ctx = { ...content, page };
  const mainHtml = render(partials.notFound, ctx);
  const html = assemblePage({ content, page, mainHtml });
  writeFile("404.html", html);
}

// Generated from the routes actually built during this run (see main()),
// not a hand-maintained list — a new PAGES entry automatically appears here.
function buildSitemap(routes) {
  const body = routes
    .map((u) => `  <url>\n    <loc>${SITE_URL}${u}</loc>\n  </url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  writeFile("sitemap.xml", xml);
}

function buildRobots() {
  const txt = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  writeFile("robots.txt", txt);
}

function copyAssets() {
  cpSync(path.join(ROOT, "src", "styles"), path.join(DIST, "styles"), { recursive: true });
  cpSync(path.join(ROOT, "src", "assets"), path.join(DIST, "assets"), { recursive: true });
  mkdirSync(path.join(DIST, "scripts"), { recursive: true });
  const compiledJs = path.join(ROOT, "src", "scripts", "main.js");
  if (existsSync(compiledJs)) {
    cpSync(compiledJs, path.join(DIST, "scripts", "main.js"));
  }
  if (existsSync(path.join(ROOT, "public"))) {
    for (const f of readdirSync(path.join(ROOT, "public"))) {
      cpSync(path.join(ROOT, "public", f), path.join(DIST, f));
    }
  }
}

function main() {
  mkdirSync(DIST, { recursive: true });
  const builtRoutes = [];

  for (const localeKey of Object.keys(locales)) {
    const content = readJson(locales[localeKey].contentFile);
    for (const pageDef of PAGES) {
      if (pageDef.kind === "home") {
        builtRoutes.push(buildHomepage(localeKey, content));
      } else if (pageDef.kind === "legal") {
        builtRoutes.push(buildLegalPage(pageDef, localeKey, content));
      } else if (pageDef.kind === "content") {
        builtRoutes.push(buildContentPage(pageDef, localeKey, content));
      } else {
        throw new Error(`Unknown page kind "${pageDef.kind}" for page "${pageDef.id}"`);
      }
    }
  }

  const deContent = readJson(locales.de.contentFile);
  build404(deContent);
  buildSitemap(builtRoutes);
  buildRobots();
  copyAssets();

  console.log("Build complete →", path.relative(ROOT, DIST));
}

main();
