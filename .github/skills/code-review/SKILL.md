---
name: robyn-site-code-review
description: Use when reviewing a pull request, cloud-agent diff, or pre-merge change set on calebmills99/robyn-site (Golden Wings Astro/Cloudflare film site), or when asked to code-review / audit a PR for this repo.
---

# Robyn-site code review

Read-only review of changes on **calebmills99/robyn-site** against this project's real constraints. Verdict over vibes. `AGENTS.md` is law when it conflicts with generic Astro advice.

## When to use

- Reviewing a GitHub PR or cloud-agent branch on this repo
- Pre-merge / "is this safe to ship" checks
- After a cloud agent claims a task is done

**Not for:** implementing the change (switch to build mode), reviewing gwingz.com / `vue-cloudflare-funnel`, or DNS/domain work.

## Setup (always)

```bash
git fetch origin main
BASE=$(git merge-base HEAD origin/main)
HEAD=$(git rev-parse HEAD)
git diff --stat $BASE..$HEAD
git diff $BASE..$HEAD
```

Read `AGENTS.md` once per review session. For copy changes, also open `../ABOUT_ME_READ_FIRST/FACT_SHEET.md` and `anti-ai-writing-style.md` when those paths exist on the machine.

Review is **read-only** on the working checkout: use `git show` / `git diff` / a separate worktree. Do not commit, push, or "fix forward" during the review pass.

## Hard fails (Critical)

Flag as **Critical** if the diff does any of these:

| Violation | Why |
| --- | --- |
| Watch / Watch the film CTA on this site | Screening lives only at https://gwingz.com |
| Hand-edits only in `src/content/pages` or `src/content/blog` presented as lasting | `prebuild` / ingest deletes and rewrites those from `../migration/content` |
| Dev/admin UI reachable in production (`dist`, Worker assets, ungated route) | Open admin on apex is forbidden; Parity Studio must stay behind `PARITY_STUDIO=1` + Worker 404 |
| Binds this Worker to `gwingz-worker`, touches custom domain/DNS, or "fixes" gwingz legal/SMS pages here | Wrong product surface |
| New copy reintroduces "Fifty Year Flight Path" as current branding | Title is *Golden Wings* / *Golden Wings: Stewardess to Sky Queen* per fact sheet |
| Year counts in evergreen titles/headers (e.g. "55 Years" as a permanent H1) | Tenure wording belongs in body copy only |
| Broken `getEntry("pages", …)` target or missing required people `portraitAlt` | Build fails; schema is the gate |
| Commits crawl tree or `C:\RUNB2\crawls\...` into git | Crawl stays local; document path only |

## Important (Should fix)

- Redirects edited by hand in `redirects.json` instead of regenerating via `../migration/build-redirects.mjs`
- New UI that invents a component kit instead of `BaseLayout` + `global.css` / `ds-2026.css` semantic classes
- Squarespace CDN URLs rewritten prematurely when local `public/images` was the ask (or the reverse: leaving broken local refs)
- Copy that ignores fact sheet / anti-AI style (em dashes, banned words, soft-rollout title rules superseded by fact sheet)
- Millie Alford claims not grounded in `../Research/Rose_Mildred_Alford_aka_Millie/verified_fact_sheet.md`
- `CLAUDE.md` replaced (must remain symlink to `AGENTS.md`)
- Scope creep: drive-by refactors unrelated to the PR intent
- Missing docs when adding a local-only tool (e.g. no README / `docs/` run instructions)

## Minor

- Naming/style nits that do not affect build or visitor UX
- Optional polish already covered by an open follow-up task in the PR body

## Stack checklist

Run through every touched area:

1. **Astro routes** — Hardcoded pages (`index`, `film`, `contact`, `404`) vs `getEntry` pages vs blog/people. Pending routes (`elevate`, `1971`, …) still redirect unless explicitly routed and removed from `KEEP_PENDING_ROUTES`.
2. **Content pipeline** — Lasting page/blog edits land in `../migration/content` or the ingest script; `people/` is hand-written and OK.
3. **Worker** — `frontend-worker.js` + `redirects.json`; trailing-slash strip; no accidental open admin paths.
4. **Build** — Repo has no test/lint suite. `npm run build` is the check. Note if cloud env lacks `../migration/content` (ingest should keep existing files).
5. **Brand/CTAs** — Contact `info@golden-wings-robyn.com`; no screening funnel bleed.
6. **Parity / dev tools** — Must not ship in `dist`; Worker must 404 `/__parity` (and similar).

## Output format

```markdown
### Strengths
- …

### Issues

#### Critical
1. **Title** — `path:lines` — what's wrong — why — fix

#### Important
1. …

#### Minor
1. …

### Recommendations
- …

### Assessment
**Ready to merge?** Yes | No | With fixes
**Reasoning:** 1–2 sentences
```

Be specific (`file:line`). Do not mark nits Critical. Do not rubber-stamp without reading the diff. If the *plan* is wrong and the code matches the plan, say that explicitly.

## Dispatch template (optional)

When spawning a reviewer subagent, give it: PR/goal summary, this skill path, `BASE`/`HEAD` SHAs, and "read-only; follow `.cursor/skills/robyn-site-code-review/SKILL.md`".
