export type Direction = "ENTREE" | "SORTIE";

export interface ScanResult {
  employeeId: number;
  matricule: string;
  fullName: string;
  direction: Direction;
  scannedAt: string;
}

export interface AttendanceEntry {
  id: number;
  employeeId: number;
  matricule: string | null;
  fullName: string;
  direction: Direction;
  scannedAt: string;
  source: string;
  hasPhoto: boolean;
}

export interface AttendanceSummary {
  presentToday: number;
  totalActiveEmployees: number;
  onTimeToday: number;
  lateToday: number;
  absentToday: number;
  earlyDepartureToday: number;
}
