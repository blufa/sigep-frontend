import { http } from "@/lib/api/client";
import { LoginResponse } from "@/lib/types/auth";

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>("/auth/login", { username, password });
  return data;
}
