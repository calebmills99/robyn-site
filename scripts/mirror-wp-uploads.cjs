const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const site = 'E:/~GoldenWings/presskit/robyn-site';
const blogDir = path.join(site, 'src/content/blog');
const outDir = path.join(site, 'public/blog');
const migBlog = 'E:/~GoldenWings/presskit/migration/content/blog';
fs.mkdirSync(outDir, { recursive: true });

function fetch(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'GoldenWingsMirror/1.0' }, timeout: 60000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode + ' ' + url)); res.resume(); return; }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });
}

function extFromUrl(url, buf) {
  const clean = url.split('?')[0];
  let ext = path.extname(clean).toLowerCase();
  if (['.png','.jpg','.jpeg','.webp','.gif','.avif'].includes(ext)) return ext;
  if (buf[0] === 0xff && buf[1] === 0xd8) return '.jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50) return '.png';
  if (buf[0] === 0x47 && buf[1] === 0x49) return '.gif';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF') return '.webp';
  return '.jpg';
}

async function mirrorUrl(url, cache) {
  if (cache.has(url)) return cache.get(url);
  const buf = await fetch(url);
  const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12);
  const localName = hash + extFromUrl(url, buf);
  const dest = path.join(outDir, localName);
  if (!fs.existsSync(dest)) fs.writeFileSync(dest, buf);
  const local = '/blog/' + localName;
  cache.set(url, local);
  console.log('mirrored', local, buf.length);
  return local;
}

// Any off-site Journey/WP media host
const hotlinkRe = /https?:\/\/(?:(?:indiedocjourney\.wordpress\.com|indiedocjourney\.com)\/wp-content\/uploads\/|i[0-9]\.wp\.com\/)[^\s\)\"']+/gi;

(async () => {
  const cache = new Map();
  let filesTouched = 0, replacements = 0;
  const dirs = [blogDir];
  if (fs.existsSync(migBlog)) dirs.push(migBlog);
  for (const dir of dirs) {
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.md')) continue;
      const fp = path.join(dir, name);
      let text = fs.readFileSync(fp, 'utf8');
      const orig = text;
      const urls = [...new Set((text.match(hotlinkRe) || []))];
      for (const url of urls) {
        try {
          const local = await mirrorUrl(url, cache);
          text = text.split(url).join(local);
          replacements++;
        } catch (e) {
          console.error('FAIL', url, e.message);
        }
      }
      text = text.replace(/^.*!\[[^\]]*\]\(\/blog\/[0-9a-f]+\.bin\)\s*$/gim, '');
      text = text.replace(/!\[[^\]]*\]\(\/blog\/[0-9a-f]+\.bin\)/g, '');
      if (text !== orig) { fs.writeFileSync(fp, text); filesTouched++; console.log('updated', name); }
    }
  }
  console.log(JSON.stringify({ filesTouched, replacements, mirrored: cache.size }, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
