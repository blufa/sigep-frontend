export type Direction = "ENTREE" | "SORTIE";

export interface ScanResult {
  id: number;
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
  /** Signalé par le vigile comme suspect (photo caméra ≠ photo officielle) — voir page Scanner. */
  flagged: boolean;
}

export interface AttendanceSummary {
  presentToday: number;
  totalActiveEmployees: number;
  onTimeToday: number;
  lateToday: number;
  absentToday: number;
  earlyDepartureToday: number;
}
