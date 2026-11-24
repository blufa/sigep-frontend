import { http } from "@/lib/api/client";
import { PageResponse } from "@/lib/types/pagination";
import { AppUser, CreateUserInput } from "@/lib/types/user";

export async function listUsers(page = 0, size = 50, q?: string): Promise<PageResponse<AppUser>> {
  const { data } = await http.get<PageResponse<AppUser>>("/users", {
    params: { page, size, q: q && q.trim() ? q.trim() : undefined },
  });
  return data;
}

export async function createUser(input: CreateUserInput): Promise<AppUser> {
  const { data } = await http.post<AppUser>("/users", input);
  return data;
}

export async function resetUserPassword(userId: number, newPassword: string): Promise<void> {
  await http.put(`/users/${userId}/password`, { newPassword });
}

/** Corrige l'identifiant d'un compte existant — ex. un numéro de téléphone enregistré avec des
 * espaces à la création rend la connexion impossible pour l'utilisateur concerné. */
export async function updateUsername(userId: number, username: string): Promise<AppUser> {
  const { data } = await http.put<AppUser>(`/users/${userId}/username`, { username });
  return data;
}

/** `menuKeys: null` lève toute restriction pour cet utilisateur. */
export async function updateUserMenus(userId: number, menuKeys: string[] | null): Promise<AppUser> {
  const { data } = await http.put<AppUser>(`/users/${userId}/menus`, { menuKeys });
  return data;
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  await http.put("/users/me/password", { currentPassword, newPassword });
}
