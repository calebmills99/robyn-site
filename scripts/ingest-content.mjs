/**
 * Ingest migration markdown into Astro content collections.
 * Source: ../migration/content/{pages,blog}
 * Dest:   src/content/{pages,blog}
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { cleanScrapedMarkdown } from "./rescue-indented-image-blocks.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MIGRATION = path.resolve(ROOT, "../migration/content");
const DEST_PAGES = path.join(ROOT, "src/content/pages");
const DEST_BLOG = path.join(ROOT, "src/content/blog");

/** Posts that shipped with zero body images; inject curated cover into the article body. */
const EMPTY_BODY_COVER_SLUGS = new Set([
  "golden-wings-takes-flight-celebrating-wins-at-clown-international-and-independent-shorts-awards",
  "making-a-no-budget-documentary",
  "janice-engel-mentor-documentary",
]);

const blogCoverBySlug = (() => {
  const mapPath = path.join(ROOT, "scripts/cover-restore-map.json");
  try {
    const entries = JSON.parse(fs.readFileSync(mapPath, "utf8"));
    return new Map(
      entries.map((e) => [e.slug, `/blog/${path.basename(e.local)}`]),
    );
  } catch (err) {
    if (err && err.code === "ENOENT") return new Map();
    throw err;
  }
})();

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
    let t = decodeEntities(String(raw).trim()).replace(/\s*\(Copy\)\s*$/i, "").trim();
    t = t.replace(/Golden Wings:\s*(Fifty|50)\s*Year\s*Flight\s*Path/gi, "Golden Wings");
    t = t.replace(/\b(Fifty|50)\s*Year\s*Flight\s*Path\b/gi, "Golden Wings");
    return t;
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
  out = out.replace(/\b(Fifty|50)\s*Year\s*Flight\s*Path\b/gi, "Golden Wings");

  // Career duration → 55
  out = out.replace(/\b53-year\b/gi, "55-year");
  out = out.replace(/\b53 years?\b/gi, "55 years");
  out = out.replace(/\bfifty-year\b/gi, "55-year");
  out = out.replace(/\b50-year\b/gi, "55-year");
  out = out.replace(/\bmore than fifty years\b/gi, "55 years");
  out = out.replace(/\bover five decades\b/gi, "over five decades"); // leave idiom
  out = out.replace(/\bflight attendant for more than fifty years\b/gi, "flight attendant for 55 years");
  out = out.replace(/\b(?:her|Robyn(?:'s)?|a)\s+50-year\s+career\b/gi, (m) =>
    m.replace(/50-year/i, "55-year"),
  );
  out = out.replace(/\b50 years\b/gi, "55 years");
  out = out.replace(/\bfifty years\b/gi, "55 years");
  out = out.replace(/\bflight attendant 50 years\b/gi, "flight attendant 55 years");

  return out;
}

function extractH1(body) {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function blogSlugFromFilename(name) {
  // indie-doc-journey__swedish-film-awards-winner.md → swedish-film-awards-winner
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
  // Drop empty H1 stubs and Squarespace "(Copy)" title leftovers
  body = body.replace(/^#\s*$/gm, "");
  body = body.replace(/^(#+\s+.+?)\s*\(Copy\)\s*$/gim, "$1");
  // Drop duplicate page H1 when body repeats the page title (template owns the H1).
  if (!isBlog && title) {
    body = body.replace(/^#\s+ABOUT THE FILM\s*$/gim, "");
    const esc = String(title).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    body = body.replace(new RegExp(`^#\\s+${esc}\\s*$`, "gim"), "");
  }
  body = cleanScrapedMarkdown(body);

  if (isBlog) {
    // One H1 per post: keep the first ATX H1, demote the rest to H2
    let seenH1 = false;
    body = body.replace(/^#\s+(.+)$/gm, (_m, text) => {
      if (!seenH1) {
        seenH1 = true;
        return `# ${text}`;
      }
      return `## ${text}`;
    });
    // Leave blog titles alone; still clean body career marketing + privacy typo
    body = rewriteCareerCopy(body, { isBlogTitle: false });
  } else {
    body = rewriteCareerCopy(body);
    title = rewriteCareerCopy(title);
  }

  let description = data.description ? String(data.description) : "";
  description = rewriteCareerCopy(description);
  // Scraped opt-in meta typo
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
    // Preserve curated Squarespace featured covers across ingest (see cover-restore-map.json).
    const cover = blogCoverBySlug.get(slug);
    if (cover) {
      frontmatter.cover = cover;
      const marker = `![Curated cover](${cover})`;
      if (EMPTY_BODY_COVER_SLUGS.has(slug) && !body.includes(`](${cover})`)) {
        body = `\n${marker}\n` + body.replace(/^\uFEFF/, "").replace(/^\n+/, "\n");
      }
    }
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
