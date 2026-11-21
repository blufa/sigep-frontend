"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as loginRequest } from "@/lib/api/auth";
import { clearAuth, readAuth, storeAuth } from "@/lib/auth/tokens";
import { getImpersonatedTenantId, setImpersonatedTenantId as storeImpersonatedTenantId } from "@/lib/auth/impersonation";
import { AuthUser } from "@/lib/types/auth";

interface AuthContextValue {
  /** Utilisateur effectif : pendant l'impersonation d'un service par un SUPER_ADMIN, tenantId et
   * role sont ceux du service choisi (accès ADMIN complet), pour que toutes les pages tenant-scoped
   * fonctionnent sans modification. */
  user: AuthUser | null;
  /** true si le compte connecté est réellement SUPER_ADMIN, qu'il soit ou non en train d'impersonner
   * un service — utile pour l'affichage du sélecteur de service, qui doit rester visible même
   * pendant l'impersonation (contrairement à `user.role`, relabellisé "ADMIN" à ce moment-là). */
  isSuperAdmin: boolean;
  impersonatedTenantId: number | null;
  setImpersonatedTenant: (id: number | null) => void;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [rawUser, setRawUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonatedTenantId, setImpersonatedTenantIdState] = useState<number | null>(null);

  useEffect(() => {
    // Lecture volontairement différée à après l'hydratation : readAuth()/getImpersonatedTenantId()
    // lisent localStorage, absent côté serveur. `isLoading` reste à `true` jusqu'ici pour que le
    // premier rendu client (hydratation) matche exactement le rendu serveur (ni l'un ni l'autre
    // n'affiche de contenu authentifié) — un initialiseur paresseux casserait cette garantie.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRawUser(readAuth()?.user ?? null);
    setImpersonatedTenantIdState(getImpersonatedTenantId());
    setIsLoading(false);
  }, []);

  const setImpersonatedTenant = useCallback((id: number | null) => {
    storeImpersonatedTenantId(id);
    setImpersonatedTenantIdState(id);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginRequest(username, password);
    storeAuth(response);
    storeImpersonatedTenantId(null);
    setImpersonatedTenantIdState(null);
    const loggedInUser: AuthUser = {
      userId: response.userId,
      tenantId: response.tenantId,
      fullName: response.fullName,
      role: response.role,
      allowedMenus: response.allowedMenus,
    };
    setRawUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    storeImpersonatedTenantId(null);
    setImpersonatedTenantIdState(null);
    setRawUser(null);
  }, []);

  const isSuperAdmin = rawUser?.role === "SUPER_ADMIN";

  const user = useMemo<AuthUser | null>(() => {
    if (!rawUser) return null;
    if (isSuperAdmin && impersonatedTenantId != null) {
      return { ...rawUser, tenantId: impersonatedTenantId, role: "ADMIN", allowedMenus: null };
    }
    return rawUser;
  }, [rawUser, isSuperAdmin, impersonatedTenantId]);

  return (
    <AuthContext.Provider
      value={{ user, isSuperAdmin, impersonatedTenantId, setImpersonatedTenant, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}
