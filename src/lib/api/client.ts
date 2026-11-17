import axios from "axios";
import { clearAuth, getAccessToken } from "@/lib/auth/tokens";
import { getImpersonatedTenantId } from "@/lib/auth/impersonation";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8085"}/api`;

export const http = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // SUPER_ADMIN "opérant en tant que" un service : le backend lit cet en-tête pour résoudre le
  // tenant courant quand le JWT n'en porte pas (voir TenantContextFilter côté sigep).
  const impersonatedTenantId = getImpersonatedTenantId();
  if (impersonatedTenantId != null) {
    config.headers = config.headers ?? {};
    config.headers["X-Tenant-Id"] = String(impersonatedTenantId);
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearAuth();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiErrorBody {
  status: number;
  code: string;
  message: string;
  details?: string[];
}

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  return fallback;
}
