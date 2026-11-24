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

/** Marque un pointage comme suspect — déclenché par le vigile quand la photo caméra ne correspond
 * visiblement pas à la photo officielle (badge probablement laissé par un employé absent). */
export async function flagAttendancePunch(punchId: number, flagged = true): Promise<void> {
  await http.put(`/attendance/${punchId}/flag`, null, { params: { flagged } });
}

export async function getAttendanceSummary(): Promise<AttendanceSummary> {
  const { data } = await http.get<AttendanceSummary>("/attendance/summary");
  return data;
}

/** Récupère le PDF du rapport mensuel sans déclencher de téléchargement — l'appelant affiche ce blob
 * (ex. dans un <iframe>) pour une prévisualisation avant impression, et appelle lui-même
 * `URL.revokeObjectURL` une fois la prévisualisation fermée. */
export async function getMonthlyAttendanceReportPdfBlobUrl(year: number, month: number): Promise<string> {
  const { data } = await http.get<Blob>("/attendance/report/monthly", {
    params: { year, month },
    responseType: "blob",
  });
  return URL.createObjectURL(data);
}

/** Même rapport que getMonthlyAttendanceReportPdfBlobUrl, limité à un seul employé — accessible
 * depuis la liste des pointages filtrée sur cet employé. */
export async function getEmployeeMonthlyAttendanceReportPdfBlobUrl(
  employeeId: number,
  year: number,
  month: number,
): Promise<string> {
  const { data } = await http.get<Blob>(`/attendance/report/monthly/employee/${employeeId}`, {
    params: { year, month },
    responseType: "blob",
  });
  return URL.createObjectURL(data);
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
