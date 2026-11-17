export interface Tenant {
  id: number;
  name: string;
  code: string;
  active: boolean;
  ministryName: string | null;
  serviceName: string | null;
}

export interface CreateTenantInput {
  name: string;
  code: string;
  ministryName?: string;
  serviceName?: string;
}
