# Phase 2 notes — golden-wings-robyn.com Astro migration

## gwingz parallel — ALREADY DONE

Privacy, terms, and SMS consent language for the screening funnel are already live in the Vue Cloudflare funnel:

- Source: `vue-cloudflare-funnel` → `legalPages.ts` + `OfferCaptureForm`
- Live: https://gwingz.com/privacy-policy
- Live: https://gwingz.com/terms-of-service

Do not re-implement or “fix” those pages as part of this Astro site work. This site’s `/privacy-policy`, `/terms-of-use`, and `/optin` are the film-site / Squarespace-migration copies for golden-wings-robyn.com.

## Soft brand rollout

- Public film title: **Golden Wings** (no hard announcement of title change)
- Career length in new marketing: **55 years**
- Avoid plastering “Fifty Year Flight Path” / “Stewardess to Sky Queen” on hero/nav

## Out of scope for this phase

- Custom domain / DNS for golden-wings-robyn.com
- Attaching this Worker to `gwingz-worker`
- Replacing Squarespace CDN image URLs with local assets (CDN URLs left intact until cutover; title logo copied locally for home hero)
