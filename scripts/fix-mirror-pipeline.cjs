const fs = require('fs');
const path = require('path');
const presskit = 'E:/~GoldenWings/presskit';
const site = path.join(presskit, 'robyn-site');

// 1) Ensure package.json prebuild runs mirror after ingest
const pkgPath = path.join(site, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.scripts.prebuild = 'node scripts/ingest-content.mjs && node scripts/mirror-blog-cdn.cjs';
pkg.scripts['mirror:blog'] = 'node scripts/mirror-blog-cdn.cjs';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('prebuild =', pkg.scripts.prebuild);

// 2) Patch mirror script to also rewrite migration/content
const mirrorPath = path.join(site, 'scripts/mirror-blog-cdn.cjs');
let mirror = fs.readFileSync(mirrorPath, 'utf8');
if (!mirror.includes('migration/content')) {
  mirror = mirror.replace(
    "const pagesDir = path.join(presskit, 'robyn-site/src/content/pages');",
    "const pagesDir = path.join(presskit, 'robyn-site/src/content/pages');\nconst migBlog = path.join(presskit, 'migration/content/blog');\nconst migPages = path.join(presskit, 'migration/content/pages');"
  );
  mirror = mirror.replace(
    'for (const dir of [blogDir, pagesDir])',
    'for (const dir of [blogDir, pagesDir, migBlog, migPages].filter((d) => fs.existsSync(d)))'
  );
  fs.writeFileSync(mirrorPath, mirror);
  console.log('mirror script patched for migration/content');
} else {
  console.log('mirror script already covers migration/content');
}
