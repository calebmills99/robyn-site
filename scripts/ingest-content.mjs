/**
 * Ingest migration markdown into Astro content collections.
 * Source: ../migration/content/{pages,blog}
 * Dest:   src/content/{pages,blog}
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MIGRATION = path.resolve(ROOT, "../migration/content");
const DEST_PAGES = path.join(ROOT, "src/content/pages");
const DEST_BLOG = path.join(ROOT, "src/content/blog");

const PAGE_TITLES = {
  home: "Golden Wings",
  "about-the-film": "About the Film",
  film: "Film",
  contact: "Contact",
  optin: "Sign Up",
  "privacy-policy": "Privacy Policy",
  "terms-of-use": "Terms of Use",
  "indie-doc-journey": "Indie Doc Journey",
  elevate: "Elevate",
  pride: "Pride",
  lgbt: "LGBT",
  sbiff: "SBIFF",
  pascua: "Pascua",
  poster: "Poster",
  prekick: "Prekick",
  1971: "1971",
  "stewardess-college-1968": "Stewardess College 1968",
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanTitle(raw, slug, isBlog) {
  if (isBlog && raw && !/^Legacies/i.test(raw) && !/&mdash;/i.test(raw)) {
    return decodeEntities(String(raw).trim()).replace(/\s*\(Copy\)\s*$/i, "").trim();
  }
  if (PAGE_TITLES[slug]) return PAGE_TITLES[slug];
  if (raw) {
    let t = decodeEntities(String(raw));
    t = t.replace(/^Legacies\s*[—–\-:]?\s*/i, "");
    t = t.replace(/Golden Wings:\s*(50|Fifty|5o)\s*Year\s*Flight\s*Path/gi, "Golden Wings");
    t = t.replace(/\s*[-–—]\s*Documentary\s*$/i, "");
    t = t.replace(/\s*\(Copy\)\s*$/i, "");
    t = t.replace(/\s+/g, " ").trim();
    if (t && t.toLowerCase() !== "documentary") return t;
  }
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function decodeEntities(s) {
  return s
    .replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Marketing voice career-year rewrites for page (and blog body) copy. */
function rewriteCareerCopy(text, { isBlogTitle = false } = {}) {
  if (isBlogTitle) return text;

  let out = text;

  // Privacy OCR typo + soft brand: drop "Year Flight Path" subtitle
  out = out.replace(/Golden Wings:\s*5o\s*Year\s*Flight\s*Path/gi, "Golden Wings");
  out = out.replace(/\[\s*Golden Wings:\s*5o\s*Year\s*Flight\s*Path\s*\]/gi, "Golden Wings");
  out = out.replace(/5o\s*Year\s*Flight\s*Path/gi, "Golden Wings");

  // Soft title: replace full film-subtitle branding with Golden Wings (pages)
  out = out.replace(/Golden Wings:\s*(Fifty|50)\s*Year\s*Flight\s*Path/gi, "Golden Wings");
  out = out.replace(/(Fifty|50)\s*Year\s*Flight\s*Path/gi, "Golden Wings");

  // Career duration → 55
  out = out.replace(/53-year/gi, "55-year");
  out = out.replace(/53 years?/gi, "55 years");
  out = out.replace(/fifty-year/gi, "55-year");
  out = out.replace(/50-year/gi, "55-year");
  out = out.replace(/more than fifty years/gi, "55 years");
  out = out.replace(/over five decades/gi, "over five decades");
  out = out.replace(/flight attendant for more than fifty years/gi, "flight attendant for 55 years");
  out = out.replace(/(?:her|Robyn(?:'s)?|a)\s+50-year\s+career/gi, (m) =>
    m.replace(/50-year/i, "55-year"),
  );
  out = out.replace(/50 years/gi, "55 years");
  out = out.replace(/fifty years/gi, "55 years");
  out = out.replace(/flight attendant 50 years/gi, "flight attendant 55 years");

  return out;
}

function extractH1(body) {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function blogSlugFromFilename(name) {
  const base = name.replace(/\.md$/i, "");
  if (base.startsWith("indie-doc-journey__")) {
    return base.slice("indie-doc-journey__".length);
  }
  return base;
}

function processMarkdown(filePath, { isBlog }) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const filename = path.basename(filePath);
  const slug = isBlog
    ? blogSlugFromFilename(filename)
    : filename.replace(/\.md$/i, "");

  const scrapedTitle = data.title;
  let title = cleanTitle(scrapedTitle, slug, isBlog);

  if (!isBlog) {
    const h1 = extractH1(content);
    if (h1 && PAGE_TITLES[slug] == null && /^Legacies/i.test(String(scrapedTitle || ""))) {
      title = cleanTitle(h1, slug, false);
    }
  }

  let body = content;
  body = body.replace(/^#\s*$/gm, "");
  body = body.replace(/^(#+\s+.+?)\s*\(Copy\)\s*$/gim, "$1");

  if (isBlog) {
    let seenH1 = false;
    body = body.replace(/^#\s+(.+)$/gm, (_m, text) => {
      if (!seenH1) {
        seenH1 = true;
        return `# ${text}`;
      }
      return `## ${text}`;
    });
    body = rewriteCareerCopy(body, { isBlogTitle: false });
  } else {
    body = rewriteCareerCopy(body);
    title = rewriteCareerCopy(title);
  }

  let description = data.description ? String(data.description) : "";
  description = rewriteCareerCopy(description);
  description = description.replace(
    /Sign up for the\.\s*App/gi,
    "Sign up for the Golden Wings App",
  );

  const frontmatter = {
    title,
    description: description.trim(),
    path: data.path || (isBlog ? `/indie-doc-journey/${slug}` : `/${slug === "home" ? "" : slug}`),
    sourceUrl: data.sourceUrl || "",
    canonical: data.canonical || "",
    scrapedAt: data.scrapedAt || "",
    reason: data.reason || "",
  };

  if (isBlog) {
    frontmatter.slug = slug;
  }

  const yaml = matter.stringify(body.replace(/^\uFEFF/, "").replace(/^\n+/, "\n"), frontmatter);
  return { slug, yaml, title };
}

function clearMd(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (err) {
    if (err && err.code === "ENOENT") return;
    throw err;
  }
  for (const f of entries) {
    if (f.endsWith(".md")) fs.unlinkSync(path.join(dir, f));
  }
}

function ingest() {
  const pagesDir = path.join(MIGRATION, "pages");
  const blogDir = path.join(MIGRATION, "blog");

  const migrationPresent = (dir) => {
    try {
      fs.readdirSync(dir);
      return true;
    } catch (err) {
      if (err && err.code === "ENOENT") return false;
      throw err;
    }
  };

  if (!migrationPresent(pagesDir) || !migrationPresent(blogDir)) {
    console.warn(
      `Migration content missing at ${MIGRATION}; keeping existing src/content/{pages,blog}.`,
    );
    return;
  }

  ensureDir(DEST_PAGES);
  ensureDir(DEST_BLOG);
  clearMd(DEST_PAGES);
  clearMd(DEST_BLOG);

  let pageCount = 0;
  let blogCount = 0;

  for (const f of fs.readdirSync(pagesDir).filter((x) => x.endsWith(".md"))) {
    const { slug, yaml } = processMarkdown(path.join(pagesDir, f), { isBlog: false });
    fs.writeFileSync(path.join(DEST_PAGES, `${slug}.md`), yaml, "utf8");
    pageCount++;
  }

  for (const f of fs.readdirSync(blogDir).filter((x) => x.endsWith(".md"))) {
    const { slug, yaml } = processMarkdown(path.join(blogDir, f), { isBlog: true });
    fs.writeFileSync(path.join(DEST_BLOG, `${slug}.md`), yaml, "utf8");
    blogCount++;
  }

  console.log(`Ingested ${pageCount} pages → src/content/pages`);
  console.log(`Ingested ${blogCount} posts → src/content/blog`);
}

ingest();
