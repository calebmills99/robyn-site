const fs = require('fs');
const path = require('path');
const presskit = 'E:/~GoldenWings/presskit';
const mapPath = path.join(presskit, 'migration/asset-map.json');
const blogDir = path.join(presskit, 'robyn-site/src/content/blog');
const pagesDir = path.join(presskit, 'robyn-site/src/content/pages');
const migBlog = path.join(presskit, 'migration/content/blog');
const migPages = path.join(presskit, 'migration/content/pages');
const outDir = path.join(presskit, 'robyn-site/public/blog');

if (!fs.existsSync(mapPath)) {
  console.warn(`mirror-blog-cdn: skip (missing ${mapPath})`);
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });

const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

function normalize(u) {
  try {
    let s = u.trim();
    if (s.startsWith('//')) s = 'https:' + s;
    const url = new URL(s);
    url.search = '';
    url.hash = '';
    let p = url.pathname;
    for (let i = 0; i < 3; i++) {
      try { const d = decodeURIComponent(p); if (d === p) break; p = d; } catch { break; }
    }
    url.pathname = p;
    return url.toString();
  } catch {
    return u;
  }
}

const byNorm = new Map();
const byFilename = new Map();
let mappedOk = 0, mappedErr = 0;
for (const [k, v] of Object.entries(map)) {
  if (!v || !v.file) { mappedErr++; continue; }
  mappedOk++;
  const abs = path.join(presskit, 'migration', v.file);
  const ext = path.extname(v.file) || '.bin';
  const localName = `${v.hash}${ext}`;
  const entry = { abs, localName, hash: v.hash, srcKey: k };
  byNorm.set(normalize(k), entry);
  byNorm.set(k, entry);
  try {
    const base = path.basename(decodeURIComponent(k.split('?')[0].split('/').pop() || ''));
    if (base) byFilename.set(base.toLowerCase(), entry);
  } catch {}
}
console.log(JSON.stringify({ mappedOk, mappedErr, lookup: byNorm.size }));

const urlRe = /https?:\/\/(?:images\.squarespace-cdn\.com|static1\.squarespace\.com)[^\s\)\"']+/gi;
const protocolRelRe = /\/\/images\.squarespace-cdn\.com[^\s\)\"']+/gi;

function resolve(url) {
  if (byNorm.has(url)) return byNorm.get(url);
  if (byNorm.has(normalize(url))) return byNorm.get(normalize(url));
  const noQ = url.split('?')[0];
  if (byNorm.has(noQ)) return byNorm.get(noQ);
  if (byNorm.has(normalize(noQ))) return byNorm.get(normalize(noQ));
  try {
    const base = path.basename(decodeURIComponent(noQ.split('/').pop()));
    if (byFilename.has(base.toLowerCase())) return byFilename.get(base.toLowerCase());
  } catch {}
  return null;
}

let copied = 0, reused = 0, missing = 0, filesTouched = 0;
const missingUrls = new Set();
const copiedNames = new Set();

function processFile(fp) {
  let text = fs.readFileSync(fp, 'utf8');
  const original = text;
  const replaceUrl = (raw) => {
    const url = raw.startsWith('//') ? 'https:' + raw : raw;
    const entry = resolve(url);
    if (!entry) { missing++; missingUrls.add(url); return raw; }
    if (!fs.existsSync(entry.abs)) {
      missing++; missingUrls.add(url + ' [missing file]'); return raw;
    }
    const dest = path.join(outDir, entry.localName);
    if (!copiedNames.has(entry.localName)) {
      fs.copyFileSync(entry.abs, dest);
      copiedNames.add(entry.localName);
      copied++;
    } else reused++;
    return `/blog/${entry.localName}`;
  };
  text = text.replace(urlRe, replaceUrl);
  text = text.replace(protocolRelRe, replaceUrl);
  if (text !== original) { fs.writeFileSync(fp, text); filesTouched++; return true; }
  return false;
}

for (const dir of [blogDir, pagesDir, migBlog, migPages].filter((d) => fs.existsSync(d))) {
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    processFile(path.join(dir, name));
  }
}

console.log(JSON.stringify({
  copied, reused, missing, filesTouched,
  publicBlogCount: fs.readdirSync(outDir).length,
  missingSample: [...missingUrls].slice(0, 20),
}, null, 2));
