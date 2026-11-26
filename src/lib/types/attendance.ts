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

export type DailyStatus = "PRESENT" | "ABSENT" | "RETARD";

/** Statut d'un employé actif pour un jour donné — couvre aussi les employés sans aucun pointage
 * ce jour-là (contrairement à AttendanceEntry, qui ne représente qu'un pointage réel). */
export interface DailyStatusEntry {
  employeeId: number;
  matricule: string;
  fullName: string;
  positionTitle: string | null;
  status: DailyStatus;
  firstEntree: string | null;
  lastSortie: string | null;
}

export interface AttendanceSummary {
  presentToday: number;
  totalActiveEmployees: number;
  onTimeToday: number;
  lateToday: number;
  absentToday: number;
  earlyDepartureToday: number;
}
