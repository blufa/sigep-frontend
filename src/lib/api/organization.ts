import { http } from "@/lib/api/client";
import { Organization } from "@/lib/types/organization";

export async function getOrganization(): Promise<Organization> {
  const { data } = await http.get<Organization>("/organization");
  return data;
}

export async function updateOrganization(
  ministryName: string,
  serviceName: string,
  workStartTime: string,
  workEndTime: string,
): Promise<Organization> {
  const { data } = await http.put<Organization>("/organization", {
    ministryName,
    serviceName,
    workStartTime: workStartTime || null,
    workEndTime: workEndTime || null,
  });
  return data;
}

export async function uploadOrganizationLogo(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  await http.post("/organization/logo", formData, { headers: { "Content-Type": "multipart/form-data" } });
}

export async function getOrganizationLogoUrl(): Promise<string> {
  const { data } = await http.get<Blob>("/organization/logo", { responseType: "blob" });
  return URL.createObjectURL(data);
}
