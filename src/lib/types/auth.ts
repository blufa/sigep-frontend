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
  /** Poste de l'employé lié au compte (ex. "Directeur Général") — affiché à la place du rôle
   * administratif quand présent ; null si le compte n'est rattaché à aucun employé. */
  positionTitle: string | null;
}

export interface AuthUser {
  userId: number;
  tenantId: number | null;
  fullName: string;
  role: Role;
  allowedMenus: string[] | null;
  positionTitle: string | null;
}
