export interface MeetingAttendee {
  employeeId: number;
  matricule: string | null;
  fullName: string;
}

export interface Meeting {
  id: number;
  title: string;
  description: string | null;
  scheduledAt: string;
  location: string | null;
  attendees: MeetingAttendee[];
  /** Heure programmée d'envoi du SMS de convocation — null si envoyé immédiatement à la création. */
  notifyAt: string | null;
  notified: boolean;
  createdAt: string;
}

export interface MeetingInput {
  title: string;
  description?: string;
  scheduledAt: string;
  location?: string;
  attendeeEmployeeIds: number[];
  /** Si renseigné (dans le futur), le SMS de convocation est envoyé à cette heure plutôt
   * qu'immédiatement à la création. */
  notifyAt?: string;
}
