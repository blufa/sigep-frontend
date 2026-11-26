/** Période où un employé est en mission officielle (déplacement professionnel) — pendant cette
 * période, l'employé n'est pas compté absent ni notifié par le cron d'absence (voir page Pointage,
 * statut "En mission"). */
export interface Mission {
  id: number;
  employeeId: number;
  matricule: string | null;
  employeeFullName: string | null;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
}

export interface MissionInput {
  employeeId: number;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface MissionUpdateInput {
  startDate: string;
  endDate: string;
  reason?: string;
}
