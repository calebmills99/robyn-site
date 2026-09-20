# Watch page template (Google video indexing)

Spork purpose: one page whose **main job** is watching **one** video, so Search Console / Video features have a real watch page (not just hero B-roll).

## Drawer workflow

1. Drop the MP4 into `public/videos/...` (stable path, no expiring CDN).
2. Drop the poster into `public/images/...`.
3. Copy `watch-page.config.example.json` → `watch-page.config.json` and fill fields.
4. Copy `watch-page.template.astro` → `src/pages/<slug>.astro` and paste the config values (or have Film Site generate from JSON).
5. `npm run dev` then look before you push.
6. Deploy → IndexNow / Search Console URL Inspection.

## Google checklist (baked into the template)

- HTML `<video>` + `<source>` (not click-gated)
- Stable `poster` + `contentUrl`
- Unique title / description / H1 for **this** video
- `VideoObject` JSON-LD (`name`, `thumbnailUrl`, `uploadDate`, `contentUrl`, `description`, `duration`)
- No Watch-the-film CTA (screening stays on gwingz.com)

## Files

| File | Role |
|------|------|
| `watch-page.template.astro` | Astro page template (BaseLayout + player + VideoObject) |
| `watch-page.config.example.json` | Filled example (college clip) |
| `watch-page.config.schema.json` | JSON Schema for the config |

Official refs: [Video SEO](https://developers.google.com/search/docs/appearance/video), [VideoObject](https://developers.google.com/search/docs/appearance/structured-data/video).
