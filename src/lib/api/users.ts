import { http } from "@/lib/api/client";
import { PageResponse } from "@/lib/types/pagination";
import { AppUser, CreateUserInput } from "@/lib/types/user";

export async function listUsers(page = 0, size = 50): Promise<PageResponse<AppUser>> {
  const { data } = await http.get<PageResponse<AppUser>>("/users", { params: { page, size } });
  return data;
}

export async function createUser(input: CreateUserInput): Promise<AppUser> {
  const { data } = await http.post<AppUser>("/users", input);
  return data;
}

export async function resetUserPassword(userId: number, newPassword: string): Promise<void> {
  await http.put(`/users/${userId}/password`, { newPassword });
}

/** `menuKeys: null` lève toute restriction pour cet utilisateur. */
export async function updateUserMenus(userId: number, menuKeys: string[] | null): Promise<AppUser> {
  const { data } = await http.put<AppUser>(`/users/${userId}/menus`, { menuKeys });
  return data;
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  await http.put("/users/me/password", { currentPassword, newPassword });
}
