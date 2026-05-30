const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

const configuredApiUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);

export const API_BASE_URL = configuredApiUrl.endsWith("/api")
  ? configuredApiUrl.slice(0, -4)
  : configuredApiUrl;

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
