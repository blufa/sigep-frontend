import { Role } from "@/lib/types/auth";

export interface AppUser {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  active: boolean;
}

export interface CreateUserInput {
  username: string;
  fullName: string;
  password: string;
  role: Role;
}
