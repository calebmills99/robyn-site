/** Shared site constants + JSON-LD builders for BaseLayout. */
export const SITE_URL = "https://golden-wings-robyn.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/title-logo.png`;

export const FILM_NAME = "Golden Wings: Stewardess to Sky Queen";
export const FILM_SHORT = "Golden Wings";

export const DIRECTOR = {
  "@type": "Person" as const,
  name: "Caleb Mills Stewart",
  url: `${SITE_URL}/people/caleb-mills-stewart`,
  email: "caleb@golden-wings-robyn.com",
};

export function absoluteUrl(path: string): string {
  if (!path || path === "/") return `${SITE_URL}/`;
  const clean = path.replace(/\/$/, "");
  return clean.startsWith("http") ? clean : `${SITE_URL}${clean.startsWith("/") ? clean : `/${clean}`}`;
}

export function homeJsonLd(description: string) {
  const organization = {
    "@type": "Organization",
    name: FILM_SHORT,
    url: SITE_URL,
    email: "caleb@golden-wings-robyn.com",
    logo: DEFAULT_OG_IMAGE,
  };

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: FILM_SHORT,
      alternateName: FILM_NAME,
      url: SITE_URL,
      description,
      publisher: organization,
    },
    {
      "@context": "https://schema.org",
      ...DIRECTOR,
      jobTitle: "Director",
      description:
        "Documentary filmmaker and director of Golden Wings: Stewardess to Sky Queen.",
      worksFor: organization,
    },
  ];
}

export function movieJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: FILM_NAME,
    alternateName: FILM_SHORT,
    url: absoluteUrl("/film"),
    description,
    image: DEFAULT_OG_IMAGE,
    genre: ["Documentary", "Biography"],
    director: DIRECTOR,
  };
}

export function personJsonLd(opts: {
  name: string;
  description: string;
  jobTitle?: string;
  url: string;
  image?: string;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.url),
  };
  if (opts.jobTitle) data.jobTitle = opts.jobTitle;
  if (opts.image) data.image = opts.image.startsWith("http") ? opts.image : absoluteUrl(opts.image);
  return data;
}

export function blogPostingJsonLd(opts: {
  title: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.description,
    url: absoluteUrl(opts.url),
    mainEntityOfPage: absoluteUrl(opts.url),
    author: DIRECTOR,
    publisher: {
      "@type": "Organization",
      name: FILM_SHORT,
      url: SITE_URL,
      logo: DEFAULT_OG_IMAGE,
    },
    image: DEFAULT_OG_IMAGE,
  };
}
