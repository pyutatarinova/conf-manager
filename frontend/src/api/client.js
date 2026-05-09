const DEFAULT_BASE_URL = 'http://localhost:8000';

export const ACCESS_TOKEN_STORAGE_KEY = 'access_token';

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token) {
  try {
    if (!token) localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    else localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } catch {
    // ignore storage errors (private mode, disabled storage, etc.)
  }
}

export function clearAccessToken() {
  setAccessToken(null);
}

function resolveBaseUrl() {
  const envUrl = import.meta?.env?.VITE_API_URL;
  return envUrl ? String(envUrl).replace(/\/+$/, '') : DEFAULT_BASE_URL;
}

async function readErrorBody(response) {
  try {
    const data = await response.json();
    if (data && typeof data.detail === 'string') return data.detail;
    if (data && Array.isArray(data.detail)) {
      // FastAPI/Pydantic validation errors: { detail: [ { loc, msg, ... }, ... ] }
      const lines = data.detail
        .map((err) => {
          const loc = Array.isArray(err?.loc) ? err.loc.filter((x) => typeof x === 'string') : [];
          const field = loc.length ? loc[loc.length - 1] : '';
          const msg = typeof err?.msg === 'string' ? err.msg : 'Ошибка валидации';

          if (field === 'section_id') return 'Поле "Секция" заполнено неверно.';
          if (field === 'conference_id') return 'Поле "Конференция" заполнено неверно.';
          if (field === 'article_file_id') return 'Поле "Файл работы" заполнено неверно.';
          if (field === 'abstract_file_id') return 'Поле "Файл тезисов" заполнено неверно.';

          return field ? `Поле "${field}": ${msg}` : msg;
        })
        .filter(Boolean);

      if (lines.length) return lines.join('\n');
    }
    return JSON.stringify(data);
  } catch {
    try {
      return await response.text();
    } catch {
      return response.statusText || 'Request failed';
    }
  }
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    token = getAccessToken(),
    signal
  } = options;

  const baseUrl = resolveBaseUrl();
  const urlPath = String(path || '').startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${urlPath}`;

  const requestHeaders = {
    ...headers
  };

  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData && body !== undefined && body !== null) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body === undefined || body === null
      ? undefined
      : (isFormData ? body : JSON.stringify(body)),
    signal
  });

  if (!response.ok) {
    const message = await readErrorBody(response);
    const error = new Error(message || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

