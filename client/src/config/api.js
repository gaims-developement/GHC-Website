const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

const configuredApiUrl = normalizeBaseUrl(
  import.meta.env.DEV 
    ? "http://localhost:3000" 
    : import.meta.env.VITE_API_URL || ""
);

export const API_BASE_URL = configuredApiUrl.endsWith("/api")
  ? configuredApiUrl.slice(0, -4)
  : configuredApiUrl;

export const apiUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
