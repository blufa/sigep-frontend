/** SUPER_ADMIN : service choisi pour "opérer en tant que" ce service (support/vérification). */
const KEY = "sigep_impersonatedTenantId";

export function getImpersonatedTenantId(): number | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(KEY);
  return value ? Number(value) : null;
}

export function setImpersonatedTenantId(id: number | null): void {
  if (typeof window === "undefined") return;
  if (id == null) {
    window.localStorage.removeItem(KEY);
  } else {
    window.localStorage.setItem(KEY, String(id));
  }
}
