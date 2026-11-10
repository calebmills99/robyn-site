# robyn-site (Golden Wings)

Astro 7 + Cloudflare Worker site for [golden-wings-robyn.com](https://golden-wings-robyn.com). Screening stays on [gwingz.com](https://gwingz.com) — no Watch CTAs here.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Astro dev server (no admin UI) |
| `npm run parity` | Dev server **with Parity Studio** (local crawl side-by-side editor) |
| `npm run ingest` | Regenerate `src/content/{pages,blog}` from `../migration/content` |
| `npm run build` | Ingest + mirror assets + `astro build` → `./dist` |
| `npm run preview` | Serve `./dist` |
| `npm run deploy:staging` | Build + `wrangler deploy` (Worker `golden-wings-robyn`) |

Node `>= 22.12.0`.

## Parity Studio (visual migration editor)

Agents failed crawl→site parity. Use the local **Parity Studio** to recreate pages against the webcrawl:

1. Crawl on disk (not in git): `C:\RUNB2\crawls\collections\golden-wings-full`
2. `npm run parity`
3. Open http://127.0.0.1:4321/__parity — left = crawl HTML, right = matching Markdown under `src/content/`

Full setup, `CRAWL_ROOT` overrides, ingest caveats, and production locks: **[docs/PARITY-STUDIO.md](docs/PARITY-STUDIO.md)**.

The editor is **dev-only**. It does not ship in `dist`, and the Worker 404s `/__parity`.

## Content notes

- Edit lasting page/blog copy in `../migration/content` (or the ingest script). `prebuild` rewrites `src/content/pages` and `src/content/blog`.
- Hand-written bios live in `src/content/people/` (ingest never touches them).
- Fact sheet and voice docs: `../ABOUT_ME_READ_FIRST/` (see `AGENTS.md`).
