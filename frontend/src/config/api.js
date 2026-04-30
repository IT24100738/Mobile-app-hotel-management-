import Constants from 'expo-constants';
import { getStoredToken } from '../auth/tokenStorage';

const PORT = Number(process.env.EXPO_PUBLIC_API_PORT || 5000);

const parseExtraHosts = () => {
  const raw = process.env.EXPO_PUBLIC_API_EXTRA_HOSTS;
  if (!raw) return [];
  return raw.split(',').map((h) => h.trim()).filter(Boolean);
};

const getConfiguredBaseUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');
  if (fromEnv) return fromEnv;
  const fromExpo = Constants.expoConfig?.extra?.apiBaseUrl?.trim().replace(/\/+$/, '');
  if (fromExpo) return fromExpo;
  return null;
};

const defaultHosts = ['localhost', '127.0.0.1', '10.0.2.2', ...parseExtraHosts()];

const buildBaseUrl = (host) => `http://${host}:${PORT}`;

const localBaseUrls = defaultHosts.map(buildBaseUrl);

let activeBaseUrl = getConfiguredBaseUrl() || localBaseUrls[0];

const normalizePath = (path) => (path.startsWith('/') ? path : `/${path}`);
const buildUrl = (baseUrl, path) => {
  const cleanBase = String(baseUrl || '').replace(/\/+$/, '');
  const cleanPath = normalizePath(path);

  // Guard against accidental duplication when env base already ends with /api.
  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
    return `${cleanBase}${cleanPath.slice(4)}`;
  }

  return `${cleanBase}${cleanPath}`;
};

const getCandidateBaseUrls = () => {
  const configured = getConfiguredBaseUrl();
  const ordered = [];
  if (configured) ordered.push(configured);
  ordered.push(activeBaseUrl);
  localBaseUrls.forEach((u) => {
    if (!ordered.includes(u)) ordered.push(u);
  });
  return [...new Set(ordered)];
};

/**
 * Calls the API, trying LAN / emulator hosts until one responds.
 * Sends Bearer token when present (unless skipAuth).
 */
export const requestWithFallback = async (path, options = {}) => {
  const { skipAuth = false, ...fetchOptions } = options;
  const headers = {
    Accept: 'application/json',
    ...fetchOptions.headers,
  };

  if (!skipAuth) {
    const token = await getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const method = fetchOptions.method || 'GET';
  const body = fetchOptions.body;

  const orderedBaseUrls = getCandidateBaseUrls();
  let lastError = null;

  for (const baseUrl of orderedBaseUrls) {
    const url = buildUrl(baseUrl, path);
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        method,
        headers,
        body,
      });

      if (__DEV__ && !response.ok) {
        console.warn(`[API] ${method} ${url} -> ${response.status}`);
      }

      activeBaseUrl = baseUrl;
      return response;
    } catch (error) {
      if (__DEV__) {
        console.warn(`[API] ${method} ${url} -> network error: ${error.message}`);
      }
      lastError = error;
    }
  }

  throw lastError || new Error('Network request failed');
};

/** Absolute URL for uploaded files (uses last successful API host). */
export const getUploadUrl = (path) => {
  if (!path) return null;
  const clean = String(path).trim().replace(/\\/g, '/');

  // Keep absolute URLs untouched (e.g. seeded Unsplash images).
  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }

  const relative = clean.replace(/^\/?/, '');
  return `${activeBaseUrl}/${relative}`;
};

export const getActiveApiBaseUrl = () => activeBaseUrl;
