import { http } from "@/lib/api/client";
import { PageResponse } from "@/lib/types/pagination";
import { AttendanceEntry, AttendanceSummary, ScanResult } from "@/lib/types/attendance";

export async function scanBadge(qrToken: string, source = "QR", photoBase64?: string | null): Promise<ScanResult> {
  const { data } = await http.post<ScanResult>("/attendance/scan", { qrToken, source, photoBase64 });
  return data;
}

/** Pointage manuel par recherche d'employé (pas de jeton QR — voir la page Scanner un badge). */
export async function scanManual(employeeId: number): Promise<ScanResult> {
  const { data } = await http.post<ScanResult>("/attendance/scan-manual", { employeeId });
  return data;
}

/** Comme getEmployeePhotoUrl — l'endpoint exige une authentification, donc un <img src> direct ne
 * fonctionnerait pas (pas d'en-tête Authorization) ; on récupère le blob puis on crée une URL locale. */
export async function getAttendancePunchPhotoUrl(punchId: number): Promise<string | null> {
  try {
    const { data } = await http.get<Blob>(`/attendance/${punchId}/photo`, { responseType: "blob" });
    return URL.createObjectURL(data);
  } catch {
    return null;
  }
}

export async function getAttendanceSummary(): Promise<AttendanceSummary> {
  const { data } = await http.get<AttendanceSummary>("/attendance/summary");
  return data;
}

export async function downloadMonthlyAttendanceReportPdf(year: number, month: number): Promise<void> {
  const { data } = await http.get<Blob>("/attendance/report/monthly", {
    params: { year, month },
    responseType: "blob",
  });
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rapport-mensuel-presence-${year}-${String(month).padStart(2, "0")}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function getAttendanceHistory(params: {
  employeeId?: number;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<AttendanceEntry>> {
  const { data } = await http.get<PageResponse<AttendanceEntry>>("/attendance", {
    params: { page: 0, size: 50, ...params },
  });
  return data;
}
