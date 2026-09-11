# Routes (Astro file-based)

| URL | File | Notes |
|-----|------|-------|
| `/` | `src/pages/index.astro` | Home / hero — uses `/images/hero-sky.jpg`, `/images/title-logo.png` |
| `/about-the-film` | `src/pages/about-the-film.astro` | About / story (content from `src/content/pages/about-the-film.md`) |
| `/film` | `src/pages/film.astro` | Film / watch |
| `/contact` | `src/pages/contact.astro` | Contact |
| `/indie-doc-journey` | `src/pages/indie-doc-journey/index.astro` | Journal index |
| `/indie-doc-journey/[...slug]` | `src/pages/indie-doc-journey/[...slug].astro` | Blog posts |
| `/optin` | `src/pages/optin.astro` | Opt-in |
| `/privacy-policy` | `src/pages/privacy-policy.astro` | Film-site privacy (gwingz funnel legal is separate) |
| `/terms-of-use` | `src/pages/terms-of-use.astro` | Terms |
| `/404` | `src/pages/404.astro` | Not found |

Content collections: `src/content/pages/*.md`, `src/content/blog/*.md` (ingested from Squarespace migration; still has CDN URLs + some slop — unslop against FACT_SHEET / anti-AI when rewriting).

Local assets (preferred over Squarespace CDN): `public/images/{hero-sky.jpg,title-logo.png,robyn-portrait.jpg,boeing747.png}`, `public/fonts/*`.
