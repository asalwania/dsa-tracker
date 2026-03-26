import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/** Base API URL from environment variables */
const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:5000/api';

/**
 * Pre-configured Axios instance for API requests.
 * Includes automatic token attachment and 401 refresh logic.
 */
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** In-memory access token (set by AuthContext) */
let accessToken: string | null = null;

/**
 * Sets the in-memory access token used by the request interceptor.
 * @param token - JWT access token or null to clear
 */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Returns the current in-memory access token.
 */
export function getAccessToken(): string | null {
  return accessToken;
}

// -- Request interceptor: attach Bearer token ---
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// -- Response interceptor: auto-refresh on 401 ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

/**
 * Processes the queue of requests that were waiting for a token refresh.
 */
function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh for 401 errors on non-auth endpoints
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token as string}`;
        }
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await api.post<{ data: { accessToken: string } }>('/auth/refresh');
      const newToken = response.data.data.accessToken;

      setAccessToken(newToken);
      processQueue(null, newToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      setAccessToken(null);

      // Force redirect to login on refresh failure
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
