import { Role } from "@/lib/types/auth";

export interface AppUser {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  active: boolean;
  /** Menus visibles, assignés par l'administrateur — null = aucune restriction. */
  allowedMenus: string[] | null;
}

export interface CreateUserInput {
  username: string;
  fullName: string;
  password: string;
  role: Role;
  /** Employé à rattacher (ex. depuis la fiche employé) — son poste s'affichera à la connexion à la
   * place du rôle administratif attribué ici. */
  employeeId?: number;
}
