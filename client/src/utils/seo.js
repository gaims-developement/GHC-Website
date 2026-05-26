const siteUrl = import.meta.env.VITE_SITE_URL || "https://ghc.gaims.org";

const setMeta = (name, content, attr = "name") => {
  let tag = document.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

export const setPageSeo = ({ title, description, path = "/", schema }) => {
  document.title = title ? `${title} | GHC 2026` : "Global Healthcare Conclave 2026";
  setMeta("description", description);
  setMeta("og:title", title || "Global Healthcare Conclave 2026", "property");
  setMeta("og:description", description, "property");
  setMeta("twitter:title", title || "Global Healthcare Conclave 2026");
  setMeta("twitter:description", description);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = `${siteUrl}${path}`;

  if (schema) {
    let script = document.querySelector("#dynamic-schema");
    if (!script) {
      script = document.createElement("script");
      script.id = "dynamic-schema";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }
};

export const trackEvent = (eventName, params = {}) => {
  window.gtag?.("event", eventName, params);
  window.dispatchEvent(new CustomEvent("ghc:event", { detail: { eventName, params } }));
};
