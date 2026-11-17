import { http } from "@/lib/api/client";
import { BadgeCardView } from "@/lib/types/badge";

export async function getBadgeCardView(employeeId: number): Promise<BadgeCardView> {
  const { data } = await http.get<BadgeCardView>(`/employees/${employeeId}/badge/card`);
  return data;
}

export async function getSheetCardViews(employeeIds: number[]): Promise<BadgeCardView[]> {
  const { data } = await http.post<BadgeCardView[]>("/badges/sheet/cards", { employeeIds });
  return data;
}

async function downloadPdf(url: string, method: "get" | "post", body?: unknown): Promise<void> {
  const response = await http.request<Blob>({ url, method, data: body, responseType: "blob" });
  const objectUrl = URL.createObjectURL(response.data);
  window.open(objectUrl, "_blank");
}

export function downloadBadgeCardPdf(employeeId: number): Promise<void> {
  return downloadPdf(`/employees/${employeeId}/badge`, "get");
}

export function downloadBadgeSheetPdf(employeeIds: number[]): Promise<void> {
  return downloadPdf("/badges/sheet", "post", { employeeIds });
}
