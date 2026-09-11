# AGENTS.md

A Cloudflare Worker serves this static Astro 7 site for golden-wings-robyn.com, home of the *Golden Wings* documentary. The site will replace the Squarespace build; for now it runs on workers.dev staging.

> `CLAUDE.md` is a symlink to this file on purpose. Edit `AGENTS.md`, and don't delete `CLAUDE.md` or replace it with a regular file.

## Commands

| Command | What it does |
| --- | --- |
| `npx astro dev --background` | Start the dev server in background mode; manage with `astro dev stop` / `status` / `logs` |
| `npm run ingest` | Regenerate `src/content/` from `../migration/content` |
| `npm run build` | `prebuild` runs ingest, then `astro build` → `./dist` |
| `npm run preview` | Serve `./dist` on localhost |
| `npm run deploy:staging` | Build + `wrangler deploy` (workers.dev, Worker `golden-wings-robyn`) |

Node >= 22.12.0. The repo has no tests or linter, so `npm run build` is your only check. It fails when content breaks the schema or when a `getEntry` page or `../migration/content` is missing.

## Architecture

### Content pipeline (read before editing any markdown)

- `scripts/ingest-content.mjs` generates `src/content/{pages,blog}/*.md`. On every `npm run build` (via `prebuild`), it deletes each `.md` in those folders and rewrites them from `../migration/content/{pages,blog}`, a sibling folder outside this repo. The script erases your hand edits in `src/content/`, so edit `../migration/content/` or the script itself.
- The script rewrites marketing copy: "Fifty/50 Year Flight Path" → "Golden Wings", and 50/53/fifty-year career → 55. It rewrites blog bodies and page titles but keeps scraped blog titles. For pages listed in `PAGE_TITLES`, it uses the map's title.
- The script strips the `indie-doc-journey__` prefix from migration blog filenames.
- `src/content.config.ts` defines the collections (`pages`, `blog`, `people`) with the `glob` loader.
- `src/content/people/*.md` holds the hand-written bios. Ingest never touches that folder, so edit those files directly. Bio photos live in `src/assets/people/`, and the schema fails the build if a bio sets `portrait` without `portraitAlt`. Check bio copy against `../ABOUT_ME_READ_FIRST/FACT_SHEET.md`; Millie Alford's page takes only claims from `../Research/Rose_Mildred_Alford_aka_Millie/verified_fact_sheet.md`.

### Routing

- `index`, `film`, `contact`, and `404` keep their copy in the `.astro` file.
- `about-the-film`, `optin`, `privacy-policy`, and `terms-of-use` each render one `pages` entry through `getEntry("pages", "<slug>")` and throw if the entry is missing.
- `/people` lists the `people` collection sorted by `order`, and `/people/[slug]` renders each bio with an optional portrait through `astro:assets`.
- `/indie-doc-journey` lists the `blog` collection, and `/indie-doc-journey/[...slug]` renders each post under its file name (`post.id`).
- The other ingested pages (`elevate`, `1971`, `pride`, `lgbt`, `sbiff`, …) have **no route yet**, and the redirect map sends them to `/about-the-film` with a 302. If you add a route for one, remove it from `KEEP_PENDING_ROUTES` in `../migration/build-redirects.mjs` and regenerate the redirects.

### Worker and redirects

- `frontend-worker.js` strips trailing slashes and looks the path up in `./redirects.json`. On a match it returns the rule's 301 or 302. For any other path, it calls `env.ASSETS.fetch(request)`, which serves `./dist` and falls back to the 404 page (`not_found_handling = "404-page"` in `wrangler.toml`).
- `../migration/build-redirects.mjs` writes both `redirects.json` (root; the Worker imports it) and `src/redirects.json` (nothing imports it). Rerun that script to change redirects instead of editing the JSON. Treat the map as a staging dry run until you apply the Phase 4 Bulk Redirects; `../migration/REDIRECTS-DRY-RUN.md` has the full table.

### UI

- `src/layouts/BaseLayout.astro` is the only layout. It sets the nav, footer, `<title> · Golden Wings` format, and optional `canonical` link. The repo has no components.
- `src/styles/global.css` holds every style: the `--gw-*` tokens and `@font-face` rules for `public/fonts`, plus the semantic classes (`.hero`, `.section`, `.section__label`, `.prose`, `.btn--primary` / `.btn--ghost`, `.post-list`). Build with those classes; don't add a component kit.
- Superdesign generated `.superdesign/init/*.md` as copies of the source. Trust the real files when the two differ.

## Copy source of truth: `../ABOUT_ME_READ_FIRST/`

`ABOUT_ME_READ_FIRST - Shortcut.lnk` in the repo root points to `E:\~GoldenWings\presskit\ABOUT_ME_READ_FIRST` (`../ABOUT_ME_READ_FIRST/` from here). You can't follow a `.lnk` file, so open the folder by its path. Read it before you write or rewrite site copy:

- `FACT_SHEET.md`: the canonical facts, from title and logline to awards, credits, runtime, and tenure wording. It overrides older notes in this repo such as `PHASE-2-NOTES.md`. If two docs conflict, follow the one with the newer date.
- `anti-ai-writing-style.md`: the style rules for published copy, including a banned-word list and a ban on em dashes.
- `Caleb_Voicce_Samples.md`: the voice target for anything you write in Caleb's name.
- `about-me.md`, `AUDIENCE_OF_ONE.md`, `filmmaker.context.md`, and `Golden Wings History.txt`: background on the director and the film.
- `Personal Brand/` has its own git repo.

The fact sheet accepts "55 years" in body copy, along with "since 1971" and "over five decades". Keep year counts out of titles and evergreen headers, because the number changes each year.

## Project constraints

- Leave DNS and custom domains alone, and don't bind this Worker to `gwingz-worker`. The screening funnel stays on gwingz.com.
- `vue-cloudflare-funnel` serves gwingz.com's legal pages and SMS consent; don't rebuild or "fix" them here. This site's `/privacy-policy`, `/terms-of-use`, and `/optin` hold the film-site versions.
- Title: **Golden Wings: Stewardess to Sky Queen** (short form *Golden Wings*), per `FACT_SHEET.md` (2026-08-11). The fact sheet overrides the soft-rollout rule in `PHASE-2-NOTES.md` that kept the subtitle out of the hero and nav. Caleb retired "Fifty Year Flight Path": keep it out of new copy, and leave old laurels and press that carry it alone. `BaseLayout.astro` and the home hero show the short title; changing them is a separate task.
- The Watch CTA links to https://gwingz.com. Contact is info@golden-wings-robyn.com.
- Leave Squarespace CDN image URLs in content alone until cutover, and use the local assets in `public/images` for new work.

## Astro docs

Check these before related work: [routing](https://docs.astro.build/en/guides/routing/) · [components](https://docs.astro.build/en/basics/astro-components/) · [content collections](https://docs.astro.build/en/guides/content-collections/) · [styling](https://docs.astro.build/en/guides/styling/). Full docs at https://docs.astro.build.
