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
  solutions: readTemplate("partials/solutions.html"),
  pipeline: readTemplate("partials/pipeline.html"),
  knowledge: readTemplate("partials/knowledge.html"),
  transparency: readTemplate("partials/transparency.html"),
  vision: readTemplate("partials/vision.html"),
  about: readTemplate("partials/about.html"),
  contact: readTemplate("partials/contact.html"),
  footer: readTemplate("partials/footer.html"),
  legalPage: readTemplate("partials/legal-page.html"),
  notFound: readTemplate("partials/not-found.html"),
};
const layout = readTemplate("layout.html");

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

function assemblePage({ content, page, mainHtml }) {
  const ctx = { ...content, page };
  const headerHtml = render(partials.header, ctx);
  const footerHtml = render(partials.footer, ctx);
  const fullCtx = { ...ctx, headerHtml, mainHtml, footerHtml };
  return render(layout, fullCtx);
}

function buildHomepage(localeKey, content) {
  const solutionsWithIcons = content.solutions.items.map((item) => ({
    ...withStatusLabel(item, content.statusLabels),
    iconSvg: icons[item.icon] || "",
  }));
  const pipelineWithLabels = content.pipeline.items.map((item) => withStatusLabel(item, content.statusLabels));

  const homeCtx = {
    ...content,
    solutions: { ...content.solutions, items: solutionsWithIcons },
    pipeline: { ...content.pipeline, items: pipelineWithLabels },
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

  const sections = [
    partials.hero,
    partials.architecture,
    partials.solutions,
    partials.pipeline,
    partials.knowledge,
    partials.transparency,
    partials.vision,
    partials.about,
    partials.contact,
  ];
  const ctxWithPage = { ...homeCtx, page };
  const mainHtml = sections.map((tpl) => render(tpl, ctxWithPage)).join("\n");

  const html = assemblePage({ content: homeCtx, page, mainHtml });
  writeFile(path.join(localeKey === "de" ? "." : "en", "index.html"), html);
}

const LEGAL_PAGES = [
  { key: "impressum", contentKey: "impressum", deSlug: "impressum", enSlug: "imprint" },
  { key: "datenschutz", contentKey: "datenschutz", deSlug: "datenschutz", enSlug: "privacy" },
  { key: "cookies", contentKey: "cookies", deSlug: "cookie-einstellungen", enSlug: "cookie-settings" },
];

function buildLegalPages(localeKey, content) {
  for (const legal of LEGAL_PAGES) {
    const slug = localeKey === "de" ? legal.deSlug : legal.enSlug;
    const routePath = localeKey === "de" ? `/${slug}/` : `/en/${slug}/`;
    const otherSlug = localeKey === "de" ? legal.enSlug : legal.deSlug;
    const legalContent = content.legal[legal.contentKey];

    const page = buildPageContext(content, localeKey, routePath, {
      title: `${legalContent.title} — ${content.meta.siteName}`,
      description: legalContent.metaDescription,
      ogImagePath: "/og-image.png",
    });
    page.deHref = localeKey === "de" ? routePath : `/${legal.deSlug}/`;
    page.enHref = localeKey === "en" ? routePath : `/en/${legal.enSlug}/`;
    finalizePageHreflang(page);

    const ctx = { ...content, page, legalContent };
    const mainHtml = render(partials.legalPage, ctx);
    const html = assemblePage({ content, page, mainHtml });

    const outDir = localeKey === "de" ? slug : path.join("en", slug);
    writeFile(path.join(outDir, "index.html"), html);
  }
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

function buildSitemap() {
  const urls = ["/", "/impressum/", "/datenschutz/", "/cookie-einstellungen/", "/en/", "/en/imprint/", "/en/privacy/", "/en/cookie-settings/"];
  const body = urls
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

  for (const localeKey of Object.keys(locales)) {
    const content = readJson(locales[localeKey].contentFile);
    buildHomepage(localeKey, content);
    buildLegalPages(localeKey, content);
  }

  const deContent = readJson(locales.de.contentFile);
  build404(deContent);
  buildSitemap();
  buildRobots();
  copyAssets();

  console.log("Build complete →", path.relative(ROOT, DIST));
}

main();
