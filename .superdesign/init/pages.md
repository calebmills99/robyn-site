# Pages dependency trees

## home — `src/pages/index.astro`

- src/pages/index.astro
- src/layouts/BaseLayout.astro
- src/styles/global.css
- public/images/* (as referenced)

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";

const description =
  "Golden Wings — a vivid documentary following flight attendant Robyn Stewart’s 55-year legacy of resilience, family, and flight, told by her son Caleb.";
---

<BaseLayout title="Golden Wings" description={description}>
  <section class="hero full-bleed-home" aria-label="Golden Wings">
    <div class="hero__media" aria-hidden="true">
      <img
        src="/images/hero-sky.jpg"
        alt=""
        width="1920"
        height="1080"
        fetchpriority="high"
      />
    </div>
    <div class="hero__content">
      <p class="hero__brand-mark">
        <img
          src="/images/title-logo.png"
          alt="Golden Wings"
          width="900"
          height="360"
        />
      </p>
      <h1 class="hero__headline">A life in the air. A legacy on film.</h1>
      <p class="hero__lede">
        An award-winning documentary on Robyn Stewart’s 55-year career as an
        American Airlines flight attendant — told by her son, Los Angeles
        filmmaker Caleb Mills Stewart.
      </p>
      <div class="hero__ctas">
        <a class="btn btn--primary" href="https://gwingz.com" rel="noopener noreferrer"
          >Watch the film</a
        >
        <a class="btn btn--ghost" href="/about-the-film">About the film</a>
      </div>
    </div>
    <div class="hero__wing" aria-hidden="true"></div>
  </section>

  <section class="section" aria-labelledby="story-heading">
    <p class="section__label">The story</p>
    <h2 id="story-heading" class="section__title">Aviation history, family memory</h2>
    <div class="prose">
      <p>
        Golden Wings chronicles the evolution of commercial aviation through the
        life of Robyn Stewart — from the jet age to modern international routes —
        weaving archival footage, home video, and vérité moments into a portrait
        of professionalism, resilience, and the stubborn instinct to keep going.
      </p>
      <p>
        Shot as a micro-budget student project that grew into an award-winning
        short, the film has been recognized at festivals including the Swedish
        International Film Festival, Clown International, and Independent Shorts
        Awards.
      </p>
    </div>
    <div class="hero__ctas" style="margin-top: 2rem;">
      <a class="btn btn--primary" href="https://gwingz.com" rel="noopener noreferrer"
        >Watch on gwingz.com</a
      >
      <a class="btn btn--ghost" href="/indie-doc-journey">Indie Doc Journey</a>
    </div>
  </section>

  <section class="section" aria-labelledby="awards-heading">
    <p class="section__label">Recognition</p>
    <h2 id="awards-heading" class="section__title">Selected awards</h2>
    <ul class="prose">
      <li>Swedish International Film Festival (2025) — Best Documentary (Short)</li>
      <li>Clown International Film Festival — Best Documentary Short</li>
      <li>Independent Shorts Awards — Best Mobile Short</li>
      <li>Magic Silver Screen — Best First Time Director</li>
      <li>Silicon Beach Film Festival — Best Short Cinematography</li>
    </ul>
  </section>
</BaseLayout>

```

## about — `src/pages/about-the-film.astro`

- src/pages/about-the-film.astro
- src/layouts/BaseLayout.astro
- src/styles/global.css
- public/images/* (as referenced)

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { getEntry, render } from "astro:content";

const entry = await getEntry("pages", "about-the-film");
if (!entry) throw new Error("Missing content: pages/about-the-film");
const { Content } = await render(entry);
---

<BaseLayout
  title={entry.data.title}
  description={entry.data.description || "About Golden Wings, the documentary."}
>
  <article class="prose">
    <Content />
  </article>
  <div class="hero__ctas" style="margin-top: 2.5rem;">
    <a class="btn btn--primary" href="https://gwingz.com" rel="noopener noreferrer"
      >Watch the film</a
    >
    <a class="btn btn--ghost" href="/contact">Contact</a>
  </div>
</BaseLayout>

```

## film — `src/pages/film.astro`

- src/pages/film.astro
- src/layouts/BaseLayout.astro
- src/styles/global.css
- public/images/* (as referenced)

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout
  title="Film"
  description="Watch Golden Wings — the award-winning aviation documentary on Robyn Stewart’s 55-year career."
>
  <section class="hero" aria-label="Film">
    <p class="script" style="font-size: 1.75rem; margin: 0;">Golden Wings</p>
    <h1 class="hero__headline">The film</h1>
    <p class="hero__lede">
      A cinematic tribute to aviation history and generational legacy — five
      decades of flight through the life of American Airlines flight attendant
      Robyn Stewart, directed by Caleb Mills Stewart.
    </p>
    <div class="hero__ctas">
      <a class="btn btn--primary" href="https://gwingz.com" rel="noopener noreferrer"
        >Watch on gwingz.com</a
      >
      <a class="btn btn--ghost" href="/about-the-film">Full story</a>
    </div>
    <div class="hero__wing" aria-hidden="true"></div>
  </section>

  <section class="section">
    <p class="section__label">Synopsis</p>
    <h2 class="section__title">Keep going</h2>
    <div class="prose">
      <p>
        Robyn Stewart has been a flight attendant for 55 years — a living bridge
        between aviation’s past and present. She began flying before the Boeing
        747’s first commercial flight and stayed aloft through deregulation, the
        industry’s golden age and its hangover, and the trauma of September 11th.
      </p>
      <p>
        Her son Caleb grew up in airport terminals and hotel lobbies. What began
        as a nine-minute college film became Golden Wings: a deeply human
        chronicle of family, career, and the instinct to keep going — assembled
        from home video, rare archival footage, and candid interviews with
        aviation insiders.
      </p>
    </div>
  </section>
</BaseLayout>

```

## contact — `src/pages/contact.astro`

- src/pages/contact.astro
- src/layouts/BaseLayout.astro
- src/styles/global.css
- public/images/* (as referenced)

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout
  title="Contact"
  description="Contact Golden Wings — info@golden-wings-robyn.com"
>
  <section class="contact-panel">
    <p class="section__label">Get in touch</p>
    <h1 class="section__title">Contact</h1>
    <p>
      For press, festival, or general inquiries about Golden Wings, reach us at:
    </p>
    <p style="margin: 1.5rem 0;">
      <a class="mailto" href="mailto:info@golden-wings-robyn.com"
        >info@golden-wings-robyn.com</a
      >
    </p>
    <p style="color: var(--gw-smoke); font-size: 0.95rem;">
      Prefer a form? Use your mail client — this staging build uses mailto so
      nothing gets lost in a half-wired backend.
    </p>
    <div class="hero__ctas" style="margin-top: 2rem;">
      <a class="btn btn--primary" href="mailto:info@golden-wings-robyn.com"
        >Send email</a
      >
      <a class="btn btn--ghost" href="https://gwingz.com" rel="noopener noreferrer"
        >Watch the film</a
      >
    </div>
  </section>
</BaseLayout>

```

## layout — `src/layouts/BaseLayout.astro`

- src/layouts/BaseLayout.astro
- src/layouts/BaseLayout.astro
- src/styles/global.css
- public/images/* (as referenced)

```astro
---
import "../styles/global.css";

interface Props {
  title?: string;
  description?: string;
  canonical?: string;
}

const {
  title = "Golden Wings",
  description = "Golden Wings — an award-winning aviation documentary following Robyn Stewart’s 55-year career as a flight attendant, told by her son Caleb Mills Stewart.",
  canonical,
} = Astro.props;

const pageTitle =
  title === "Golden Wings" ? "Golden Wings" : `${title} · Golden Wings`;

const pathname = Astro.url.pathname.replace(/\/$/, "") || "/";

const nav = [
  { href: "/film", label: "Film" },
  { href: "/about-the-film", label: "About" },
  { href: "/indie-doc-journey", label: "Journey" },
  { href: "/contact", label: "Contact" },
];

function isCurrent(href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="generator" content={Astro.generator} />
    <meta name="description" content={description} />
    {canonical && <link rel="canonical" href={canonical} />}
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{pageTitle}</title>
  </head>
  <body>
    <a class="sr-only" href="#main">Skip to content</a>
    <header class="site-header">
      <div class="site-header__inner">
        <a class="brand" href="/">Golden Wings</a>
        <nav aria-label="Primary">
          <ul class="nav">
            {
              nav.map((item) => (
                <li>
                  <a
                    href={item.href}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              ))
            }
            <li>
              <a
                class="nav-cta"
                href="https://gwingz.com"
                rel="noopener noreferrer"
                >Watch</a
              >
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main id="main" class="site-main">
      <slot />
    </main>

    <footer class="site-footer">
      <div class="site-footer__inner">
        <p>© {new Date().getFullYear()} Golden Wings</p>
        <nav aria-label="Legal">
          <a href="/privacy-policy">Privacy</a>
          <a href="/terms-of-use">Terms</a>
          <a href="/optin">SMS Opt-In</a>
          <a href="mailto:info@golden-wings-robyn.com">info@golden-wings-robyn.com</a>
        </nav>
      </div>
    </footer>
  </body>
</html>

```
