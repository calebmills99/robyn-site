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
  if (path.startsWith("http")) return path;
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  // Preserve an explicit trailing slash (Special Dispatch live URLs, etc.).
  return `${SITE_URL}${withLeading}`;
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

export function movieJsonLd(description: string, image?: string) {
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : absoluteUrl(image)
    : DEFAULT_OG_IMAGE;
  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: FILM_NAME,
    alternateName: FILM_SHORT,
    url: absoluteUrl("/film"),
    description,
    image: imageUrl,
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
  image?: string;
}) {
  const image = opts.image
    ? opts.image.startsWith("http")
      ? opts.image
      : absoluteUrl(opts.image)
    : DEFAULT_OG_IMAGE;
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
    image,
  };
}

type WebPageType = "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";

/** Generic WebPage (and subtypes) for static/content pages. */
export function webPageJsonLd(opts: {
  type?: WebPageType;
  name: string;
  description: string;
  url: string;
  about?: Record<string, unknown> | Record<string, unknown>[];
  mainEntity?: Record<string, unknown>;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": opts.type ?? "WebPage",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.url),
    isPartOf: {
      "@type": "WebSite",
      name: FILM_SHORT,
      url: SITE_URL,
    },
  };
  if (opts.about) data.about = opts.about;
  if (opts.mainEntity) data.mainEntity = opts.mainEntity;
  return data;
}

export function aboutPageJsonLd(description: string) {
  return webPageJsonLd({
    type: "AboutPage",
    name: "About the Film",
    description,
    url: "/about-the-film",
    about: {
      "@type": "Movie",
      name: FILM_NAME,
      alternateName: FILM_SHORT,
      url: absoluteUrl("/film"),
      director: DIRECTOR,
    },
  });
}

export function contactPageJsonLd(description: string) {
  return webPageJsonLd({
    type: "ContactPage",
    name: "Contact",
    description,
    url: "/contact",
    mainEntity: {
      "@type": "Organization",
      name: FILM_SHORT,
      url: SITE_URL,
      email: "info@golden-wings-robyn.com",
      logo: DEFAULT_OG_IMAGE,
    },
  });
}

/** Hub pages (people, journey) with an ItemList of child entries. */
export function collectionPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  items: { name: string; url: string; description?: string }[];
}) {
  return webPageJsonLd({
    type: "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.items.length,
      itemListElement: opts.items.map((item, index) => {
        const entry: Record<string, unknown> = {
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: absoluteUrl(item.url),
        };
        if (item.description) entry.description = item.description;
        return entry;
      }),
    },
  });
}

/** FAQPage for how-to / survival articles. */
export function faqPageJsonLd(
  faqs: { question: string; answer: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
