import axios from "axios";
import Cookies from "js-cookie";
import { refreshAccessToken } from "./auth";

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const isLocal = configured.includes("localhost") || configured.includes("127.0.0.1");
  if (typeof window !== "undefined" && isLocal) {
    try {
      const parsed = new URL(configured);
      const { protocol } = window.location;
      return `${protocol}//${window.location.hostname}:${parsed.port || "3001"}`;
    } catch {
      const { protocol, hostname } = window.location;
      return `${protocol}//${hostname}:3001`;
    }
  }
  return configured;
}

export const api = axios.create({
  baseURL: `${getApiBaseUrl()}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { access_token } = await refreshAccessToken();
        setNewToken(access_token);
        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearToken();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function setNewToken(token: string) {
  Cookies.set("access_token", token, { expires: 7, sameSite: "strict" });
}

function clearToken() {
  Cookies.remove("access_token");
}
