import { AuthUser, LoginResponse } from "@/lib/types/auth";

const STORAGE_KEY = "sigep.auth";

interface StoredAuth {
  accessToken: string;
  user: AuthUser;
}

export function storeAuth(response: LoginResponse): void {
  if (typeof window === "undefined") return;
  const stored: StoredAuth = {
    accessToken: response.accessToken,
    user: {
      userId: response.userId,
      tenantId: response.tenantId,
      fullName: response.fullName,
      role: response.role,
      allowedMenus: response.allowedMenus,
    },
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function readAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return readAuth()?.accessToken ?? null;
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
