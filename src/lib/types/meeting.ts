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
  createdAt: string;
}

export interface MeetingInput {
  title: string;
  description?: string;
  scheduledAt: string;
  location?: string;
  attendeeEmployeeIds: number[];
}
