# Ship-ready handoff for calebmills99/robyn-site

Drop-in files. Paths mirror the repo. Copy over, `npm run build`, deploy with Wrangler as usual.

## 1. Files → repo
- `src/layouts/BaseLayout.astro` — replaces yours. Image logo in header, Press Kit nav link, Contact as gold CTA, wink sign-off footer, Guild easter egg between Privacy and Terms.
- `src/styles/ds-2026.css` — NEW. Add `import "../styles/ds-2026.css";` right after the global.css import in BaseLayout (already done in the file above) — or paste its contents at the end of global.css.
- `src/pages/index.astro` — replaces yours. 2026 logo + subtitle plate, three-beat timeline, synth-media label, laurels under copy. Removes motto, headline, wing line, ken-burns.
- `src/pages/press-kit.astro` — NEW route /press-kit.
- `src/pages/indie-doc-journey/index.astro` — replaces yours. Card grid with thumbnails (first image in each post body).

## 2. Assets → public/
Copy from this design system:
- `assets/brand/title-logo-2026.png, logo-mark.png, logo-mark-wink.png, gwig-seal.png` → `public/images/brand/`
- `assets/imagery/robyn-wings-1971.jpg, robyn-graduation-hug-1971.jpg, graduation-1971.jpg, robyn-headshot.jpg, archive-01.jpg, archive-02.jpg` → `public/images/press/`
- `assets/posters/*` → `public/images/posters/`
- When the trimmed synth clip is ready, overwrite `public/videos/synth-media/747-synth-broll-reel.mp4`.

## 3. Optional
- `src/lib/seo.ts`: change `DEFAULT_OG_IMAGE` to `/images/brand/title-logo-2026.png`.
- Remove the now-unused motto assets (`find-your-wings-airstream.*`) if nothing else references them.
- The homage posters with Disney·Pixar / Universal / Lego marks are fine on the site's teaser gallery; keep them out of festival submissions.
