import { http } from "@/lib/api/client";
import { CreateTenantInput, Tenant } from "@/lib/types/tenant";
import { AppUser, CreateUserInput } from "@/lib/types/user";

export async function listTenants(): Promise<Tenant[]> {
  const { data } = await http.get<Tenant[]>("/super-admin/tenants");
  return data;
}

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  const { data } = await http.post<Tenant>("/super-admin/tenants", input);
  return data;
}

export async function setTenantActive(tenantId: number, active: boolean): Promise<Tenant> {
  const { data } = await http.put<Tenant>(`/super-admin/tenants/${tenantId}/active`, { active });
  return data;
}

export async function createTenantAdmin(tenantId: number, input: CreateUserInput): Promise<AppUser> {
  const { data } = await http.post<AppUser>(`/super-admin/tenants/${tenantId}/users`, input);
  return data;
}
