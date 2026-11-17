import { getOrganizationLogoUrl } from "@/lib/api/organization";

export async function getOrganizationLogoUrlOrNull(): Promise<string | null> {
  try {
    return await getOrganizationLogoUrl();
  } catch {
    return null;
  }
}
