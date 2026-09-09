import axios from 'axios';

let rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').trim();
if (rawBaseUrl.endsWith('/')) {
  rawBaseUrl = rawBaseUrl.slice(0, -1);
}
// Automatically ensure /api endpoint suffix is present
const BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enables browser to send and receive HttpOnly cookies
  timeout: 75000, // 75s allows Render free-tier cold starts to boot up without aborting
});

// Attach Bearer token if present (supports cross-domain deployments where 3rd-party cookies might be blocked)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ledger_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(true);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt token refresh if request was to login/register or already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/token/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshPayload: Record<string, string> = {};
        const localRefresh = localStorage.getItem('ledger_refresh_token');
        if (localRefresh) refreshPayload.refresh = localRefresh;

        const refreshRes = await axios.post(
          `${BASE_URL}/auth/token/refresh/`,
          refreshPayload,
          { withCredentials: true }
        );
        if (refreshRes.data?.access) {
          localStorage.setItem('ledger_access_token', refreshRes.data.access);
        }
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('ledger_access_token');
        localStorage.removeItem('ledger_refresh_token');
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
