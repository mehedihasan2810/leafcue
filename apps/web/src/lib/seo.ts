import { SITE } from "./site";

export const OG_IMAGE = `${SITE.url}/og.webp` as const;
export const OG_IMAGE_ALT =
  "LeafCue — quiet care for growing things. A calm, private plant care tracker, shown on two phones." as const;

export const OG_DEFAULTS = {
  image: OG_IMAGE,
  imageWidth: "1200",
  imageHeight: "630",
  imageType: "image/webp",
  imageAlt: OG_IMAGE_ALT,
  type: "website" as const,
  siteName: SITE.name,
  locale: "en_GB" as const,
} as const;

export const TWITTER_DEFAULTS = {
  card: "summary_large_image" as const,
} as const;

type PageHeadInput = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogType?: string;
  ogImageAlt?: string;
};

export function makePageMeta({
  title,
  description,
  path,
  ogImage = OG_DEFAULTS.image,
  ogType = OG_DEFAULTS.type,
  ogImageAlt = OG_DEFAULTS.imageAlt,
}: PageHeadInput) {
  const url = `${SITE.url}${path}`;

  return [
    { title },
    { name: "description", content: description },
    // Open Graph
    { property: "og:type", content: ogType },
    { property: "og:site_name", content: OG_DEFAULTS.siteName },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:locale", content: OG_DEFAULTS.locale },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: OG_DEFAULTS.imageWidth },
    { property: "og:image:height", content: OG_DEFAULTS.imageHeight },
    { property: "og:image:type", content: OG_DEFAULTS.imageType },
    { property: "og:image:alt", content: ogImageAlt },
    // Twitter
    { name: "twitter:card", content: TWITTER_DEFAULTS.card },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { name: "twitter:image:alt", content: ogImageAlt },
  ];
}

export function makeCanonicalLink(path: string) {
  return { rel: "canonical" as const, href: `${SITE.url}${path}` };
}

export function makeJsonLdScript(data: unknown) {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify(data),
  };
}

export const SCHEMA = {
  organization: () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/icon.png`,
    description: SITE.description,
    email: SITE.contactEmail,
    sameAs: [SITE.appStoreUrl, SITE.playStoreUrl],
  }),
  webSite: () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }),
  softwareApplication: () => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "LifestyleApplication" as const,
    operatingSystem: "iOS, Android",
    description: SITE.description,
    url: SITE.url,
    image: OG_IMAGE,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "100",
    },
    author: {
      "@type": "Organization",
      name: SITE.company,
      url: SITE.url,
    },
  }),
  webPage: ({
    title,
    description,
    path,
  }: {
    title: string;
    description: string;
    path: string;
  }) => ({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `${SITE.url}${path}`,
    isPartOf: {
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.company,
      url: SITE.url,
      logo: `${SITE.url}/icon.png`,
    },
  }),
} as const;
