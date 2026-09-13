# Golden Wings Robyn — Astro film site

Static multi-page site for **golden-wings-robyn.com** (Phase 2 migration). Staging Worker: `golden-wings-robyn` on `workers.dev`. No custom domain attached yet.

## Stack

- Astro 7 static build → `./dist`
- Cloudflare Worker `frontend-worker.js` → `env.ASSETS.fetch(request)`
- Content from `../migration/content` via `scripts/ingest-content.mjs`

## Commands

| Command | Action |
| --- | --- |
| `npm run ingest` | Copy/clean migration markdown into `src/content/` |
| `npm run dev` | Local Astro dev server |
| `npm run build` | Ingest + static build to `./dist` |
| `npm run deploy:staging` | Build + `wrangler deploy` (workers.dev) |
| `npm run preview` | Preview `./dist` locally |

## Staging deploy

```sh
npm run deploy:staging
```

Uses `wrangler.toml`:

- Worker name: `golden-wings-robyn`
- `workers_dev = true`
- `[assets] directory = "./dist"`, `not_found_handling = "404-page"`

Do **not** attach a custom domain or touch DNS from this repo. Screening funnel stays on `gwingz-worker` / gwingz.com.

## Brand

- Film title: **Golden Wings**
- Career: **55 years** in marketing copy
- Screening (gwingz.com only): https://gwingz.com - no Watch CTAs on this domain
- Contact: info@golden-wings-robyn.com

See `PHASE-2-NOTES.md` for parallel gwingz legal work already done.
