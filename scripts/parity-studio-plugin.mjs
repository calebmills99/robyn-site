/**
 * Dev-only Vite middleware for Parity Studio.
 * Enabled only when PARITY_STUDIO=1 during `astro dev`.
 * Never registered during `astro build`, so nothing ships to dist.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const UI_PATH = path.join(__dirname, "parity-studio-ui.html");

const COLLECTIONS = {
  pages: {
    dir: path.join(ROOT, "src/content/pages"),
    note: "Wiped on every `npm run build` by ingest. Prefer editing ../migration/content/pages, or save here only for a temporary parity pass.",
  },
  blog: {
    dir: path.join(ROOT, "src/content/blog"),
    note: "Wiped on every `npm run build` by ingest. Prefer editing ../migration/content/blog for lasting changes.",
  },
  people: {
    dir: path.join(ROOT, "src/content/people"),
    note: "Hand-written bios. Ingest never touches this folder — edits stick.",
  },
};

function enabled() {
  return process.env.PARITY_STUDIO === "1";
}

function crawlRoot() {
  const raw = process.env.CRAWL_ROOT?.trim();
  if (!raw) return null;
  return path.resolve(raw);
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const id = f.replace(/\.md$/, "");
      const full = path.join(dir, f);
      let title = id;
      let contentPath = "";
      try {
        const { data } = matter(fs.readFileSync(full, "utf8"));
        if (data.title) title = String(data.title);
        else if (data.name) title = String(data.name);
        if (data.path) contentPath = String(data.path);
      } catch {
        /* ignore parse errors in list */
      }
      return { id, file: f, title, path: contentPath };
    });
}

function entryPath(collection, id) {
  const meta = COLLECTIONS[collection];
  if (!meta) return null;
  if (!id || id.includes("..") || id.includes("/") || id.includes("\\")) {
    return null;
  }
  const full = path.join(meta.dir, `${id}.md`);
  if (!full.startsWith(meta.dir + path.sep) && full !== meta.dir) return null;
  return full;
}

function walkHtml(dir, base = dir, out = [], depth = 0) {
  if (depth > 12 || out.length > 4000) return out;
  if (!fs.existsSync(dir)) return out;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (ent.name.startsWith(".")) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkHtml(full, base, out, depth + 1);
    } else if (/\.(html?|htm)$/i.test(ent.name)) {
      const rel = path.relative(base, full).split(path.sep).join("/");
      out.push(rel);
    }
  }
  return out;
}

function scoreCrawlMatch(rel, needle) {
  const n = needle.toLowerCase().replace(/^\/+|\/+$/g, "");
  const r = rel.toLowerCase().replace(/\\/g, "/");
  if (!n) return 0;
  if (r === `${n}.html` || r === `${n}/index.html`) return 100;
  if (r.endsWith(`/${n}.html`) || r.endsWith(`/${n}/index.html`)) return 90;
  if (r.includes(`/${n}/`) || r.includes(`/${n}.html`)) return 70;
  const slug = n.split("/").filter(Boolean).pop();
  if (slug && (r.endsWith(`/${slug}.html`) || r.endsWith(`/${slug}/index.html`))) {
    return 60;
  }
  if (slug && r.includes(slug)) return 20;
  return 0;
}

function findCrawlMatches(crawlFiles, entry) {
  const needles = [];
  if (entry.path) needles.push(entry.path);
  if (entry.sourceUrl) {
    try {
      needles.push(new URL(entry.sourceUrl).pathname);
    } catch {
      /* ignore */
    }
  }
  needles.push(entry.id);
  if (entry.collection === "blog") {
    needles.push(`indie-doc-journey/${entry.id}`);
  }
  if (entry.collection === "people") {
    needles.push(`people/${entry.id}`);
  }

  const scored = crawlFiles
    .map((rel) => {
      let best = 0;
      for (const needle of needles) {
        best = Math.max(best, scoreCrawlMatch(rel, needle));
      }
      return { rel, score: best };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel));

  return scored.slice(0, 12);
}

function safeCrawlFile(rel) {
  const root = crawlRoot();
  if (!root) return null;
  const decoded = decodeURIComponent(rel).replace(/^\/+/, "");
  if (!decoded || decoded.includes("\0")) return null;
  const full = path.resolve(root, decoded);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (full !== root && !full.startsWith(rootWithSep)) return null;
  return full;
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".mp4": "video/mp4",
  };
  return map[ext] || "application/octet-stream";
}

async function handleApi(req, res, url) {
  const root = crawlRoot();

  if (url.pathname === "/__parity/api/status") {
    const crawlExists = Boolean(root && fs.existsSync(root));
    const crawlFiles = crawlExists ? walkHtml(root) : [];
    return json(res, 200, {
      ok: true,
      crawlRoot: root,
      crawlExists,
      crawlHtmlCount: crawlFiles.length,
      defaultCrawlHint:
        process.platform === "win32"
          ? "C:\\RUNB2\\crawls\\collections\\golden-wings-full"
          : "/mnt/c/RUNB2/crawls/collections/golden-wings-full",
      collections: Object.fromEntries(
        Object.entries(COLLECTIONS).map(([key, meta]) => [
          key,
          {
            note: meta.note,
            count: listMarkdown(meta.dir).length,
          },
        ]),
      ),
    });
  }

  if (url.pathname === "/__parity/api/entries") {
    const collection = url.searchParams.get("collection") || "pages";
    if (!COLLECTIONS[collection]) {
      return json(res, 400, { error: "Unknown collection" });
    }
    return json(res, 200, {
      collection,
      entries: listMarkdown(COLLECTIONS[collection].dir),
      note: COLLECTIONS[collection].note,
    });
  }

  if (url.pathname === "/__parity/api/entry" && req.method === "GET") {
    const collection = url.searchParams.get("collection");
    const id = url.searchParams.get("id");
    const full = entryPath(collection, id);
    if (!full || !fs.existsSync(full)) {
      return json(res, 404, { error: "Entry not found" });
    }
    const raw = fs.readFileSync(full, "utf8");
    const parsed = matter(raw);
    const crawlFiles = root && fs.existsSync(root) ? walkHtml(root) : [];
    const matches = findCrawlMatches(crawlFiles, {
      id,
      collection,
      path: parsed.data.path,
      sourceUrl: parsed.data.sourceUrl,
    });
    return json(res, 200, {
      collection,
      id,
      file: path.relative(ROOT, full).split(path.sep).join("/"),
      note: COLLECTIONS[collection].note,
      data: parsed.data,
      body: parsed.content.replace(/^\r?\n/, ""),
      crawlMatches: matches,
    });
  }

  if (url.pathname === "/__parity/api/entry" && req.method === "PUT") {
    const payload = JSON.parse(await readBody(req));
    const { collection, id, data, body } = payload;
    const full = entryPath(collection, id);
    if (!full) return json(res, 400, { error: "Bad collection/id" });
    if (!fs.existsSync(path.dirname(full))) {
      return json(res, 400, { error: "Collection directory missing" });
    }
    const next = matter.stringify(body ?? "", data ?? {});
    fs.writeFileSync(full, next.endsWith("\n") ? next : `${next}\n`, "utf8");
    return json(res, 200, {
      ok: true,
      file: path.relative(ROOT, full).split(path.sep).join("/"),
      note: COLLECTIONS[collection]?.note,
    });
  }

  if (url.pathname === "/__parity/api/crawl/list") {
    if (!root || !fs.existsSync(root)) {
      return json(res, 200, { files: [], crawlRoot: root, crawlExists: false });
    }
    return json(res, 200, {
      crawlRoot: root,
      crawlExists: true,
      files: walkHtml(root),
    });
  }

  return json(res, 404, { error: "Unknown parity API route" });
}

function serveCrawlAsset(req, res, url) {
  const rel = url.pathname.slice("/__parity/crawl/".length);
  const full = safeCrawlFile(rel);
  if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    res.statusCode = 404;
    res.end("Crawl asset not found");
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", contentTypeFor(full));
  res.setHeader("Cache-Control", "no-store");
  fs.createReadStream(full).pipe(res);
}

function serveUi(res) {
  if (!fs.existsSync(UI_PATH)) {
    res.statusCode = 500;
    res.end("Parity Studio UI missing");
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  fs.createReadStream(UI_PATH).pipe(res);
}

export function parityStudioPlugin() {
  return {
    name: "parity-studio",
    configureServer(server) {
      if (!enabled()) return;

      server.middlewares.use(async (req, res, next) => {
        try {
          const host = req.headers.host || "localhost";
          const url = new URL(req.url || "/", `http://${host}`);

          if (url.pathname === "/__parity" || url.pathname === "/__parity/") {
            return serveUi(res);
          }
          if (url.pathname.startsWith("/__parity/api/")) {
            return await handleApi(req, res, url);
          }
          if (url.pathname.startsWith("/__parity/crawl/")) {
            return serveCrawlAsset(req, res, url);
          }
          return next();
        } catch (err) {
          console.error("[parity-studio]", err);
          return json(res, 500, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });

      const root = crawlRoot();
      console.log("\n  Parity Studio → http://localhost:4321/__parity");
      console.log(
        `  CRAWL_ROOT → ${root || "(unset — set CRAWL_ROOT to your crawl folder)"}\n`,
      );
    },
  };
}
