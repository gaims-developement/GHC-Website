import { apiUrl } from "../config/api";

const DEFAULT_SITE_URL = "https://ghc.gaims.org";

export const SITE_URL = (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
export const SITE_NAME = "Global Healthcare Conclave 2026";
export const DEFAULT_TITLE = "Global Healthcare Conclave 2026";
export const DEFAULT_DESCRIPTION =
  "Global Healthcare Conclave 2026 (GHC 2026) by GAIMS in New Delhi — healthcare leadership, research, hands-on workshops, world-class speakers and delegate registration. November 22–24, 2026.";
export const DEFAULT_IMAGE = `${SITE_URL}/assets/logos/ghclogo.jpeg`;

export const HOMEPAGE_SEO_KEYS = new Set(["home", "homepage", "default", "index"]);

const truncate = (text, max = 160) => {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
};

const buildTitle = (title, max = 65) => {
  const cleaned = String(title || DEFAULT_TITLE).trim();
  const lower = cleaned.toLowerCase();
  if (lower.includes("ghc 2026") || lower.includes("global healthcare conclave")) return truncate(cleaned, max);
  return truncate(`${cleaned} | GHC 2026`, max);
};

export const normalizePath = (path = "/") => {
  let value = String(path || "/").trim();
  if (!value.startsWith("/")) value = `/${value}`;
  if (value.length > 1) value = value.replace(/\/+$/, "");
  return value || "/";
};

export const resolveAssetUrl = (url) => {
  if (!url) return "";
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:") || url.startsWith("blob:")) return url.replace(/^\/\//, "https://");
  if (url.startsWith("/uploads")) return apiUrl(url);
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const setMetaTag = (name, content, attr = "name") => {
  let tag = document.head.querySelector(`meta[${attr}=${JSON.stringify(name)}]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", String(content ?? ""));
};

const setCanonical = (href) => {
  let tag = document.head.querySelector('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }
  tag.href = href;
};

const parseSchema = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "object") return [value];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : parsed ? [parsed] : null;
  } catch {
    return null;
  }
};

const upsertSchemaGraph = (graph) => {
  let script = document.head.querySelector(`script[data-purpose="seo-graph"]`);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.purpose = "seo-graph";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(graph);
};

const baseSchemas = () => [
  {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
  },
  {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "GAIMS",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: DEFAULT_IMAGE },
  },
];

export const buildEventSchema = ({ path = "/" } = {}) => ({
  "@type": "Event",
  "@id": `${SITE_URL}${normalizePath(path)}#event`,
  name: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  startDate: "2026-11-22",
  endDate: "2026-11-24",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  isAccessibleForFree: false,
  location: {
    "@type": "Place",
    name: "All India Institute of Medical Sciences (AIIMS), New Delhi",
    address: {
      "@type": "PostalAddress",
      addressLocality: "New Delhi",
      addressRegion: "Delhi",
      addressCountry: "IN",
    },
  },
  image: DEFAULT_IMAGE,
  organizer: { "@id": `${SITE_URL}/#organization` },
  url: `${SITE_URL}${normalizePath(path)}`,
});

const buildSchemaGraph = ({ schemas }) => {
  const graph = baseSchemas();
  (schemas || []).forEach((schema) => {
    const entries = parseSchema(schema);
    if (entries?.length) graph.push(...entries);
  });
  return { "@context": "https://schema.org", "@graph": graph };
};

export const setPageSeo = ({
  title,
  description,
  keywords,
  image,
  type = "website",
  path = "/",
  canonical,
  schema,
  schemas = [],
  robots = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  noindex = false,
}) => {
  const finalTitle = buildTitle(title);
  const finalDescription = truncate(description || DEFAULT_DESCRIPTION);
  const finalPath = normalizePath(path);
  const pageUrl = canonical || `${SITE_URL}${finalPath}`;
  const finalImage = resolveAssetUrl(image || DEFAULT_IMAGE);

  document.title = finalTitle;
  setMetaTag("description", finalDescription);
  setMetaTag("robots", noindex ? "noindex, nofollow" : robots);
  if (keywords) setMetaTag("keywords", truncate(keywords, 200));

  setMetaTag("og:site_name", SITE_NAME, "property");
  setMetaTag("og:type", type, "property");
  setMetaTag("og:locale", "en_IN", "property");
  setMetaTag("og:url", pageUrl, "property");
  setMetaTag("og:title", finalTitle, "property");
  setMetaTag("og:description", finalDescription, "property");
  setMetaTag("og:image", finalImage, "property");

  setMetaTag("twitter:card", "summary_large_image", "name");
  setMetaTag("twitter:title", finalTitle, "name");
  setMetaTag("twitter:description", finalDescription, "name");
  setMetaTag("twitter:image", finalImage, "name");

  setCanonical(pageUrl);

  const allSchemas = [];
  if (schema) allSchemas.push(schema);
  if (schemas?.length) allSchemas.push(...schemas);
  upsertSchemaGraph(buildSchemaGraph({ schemas: allSchemas }));
};

export const findSeoEntry = (seoItems, pageKey, synonyms = []) => {
  const keys = new Set([
    String(pageKey || "").trim().toLowerCase(),
    ...synonyms.map((value) => String(value || "").trim().toLowerCase()),
  ]);
  return (seoItems || []).find((item) => item?.page_key && keys.has(String(item.page_key).trim().toLowerCase())) || null;
};

export const mergeSeoEntry = (entry, fallback = {}) => {
  const entrySchema = parseSchema(entry?.schema_markup);
  return {
    title: entry?.seo_title || fallback.title || DEFAULT_TITLE,
    description: entry?.seo_description || fallback.description || DEFAULT_DESCRIPTION,
    keywords: entry?.seo_keywords || null,
    image: entry?.og_image || fallback.image || null,
    canonical: entry?.canonical_url || null,
    schema: entrySchema && entrySchema.length ? entrySchema : fallback.schema || null,
  };
};

export const trackEvent = (eventName, params = {}) => {
  window.gtag?.("event", eventName, params);
  window.dispatchEvent(new CustomEvent("ghc:event", { detail: { eventName, params } }));
};