export type Role = "SUPER_ADMIN" | "ADMIN" | "AGENT";

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  tenantId: number | null;
  fullName: string;
  role: Role;
  /** Menus visibles, assignés par l'administrateur — null = aucune restriction. */
  allowedMenus: string[] | null;
}

export interface AuthUser {
  userId: number;
  tenantId: number | null;
  fullName: string;
  role: Role;
  allowedMenus: string[] | null;
}
