import { http } from "@/lib/api/client";
import { PageResponse } from "@/lib/types/pagination";
import { Meeting, MeetingInput } from "@/lib/types/meeting";

export async function listMeetings(page = 0, size = 20): Promise<PageResponse<Meeting>> {
  const { data } = await http.get<PageResponse<Meeting>>("/meetings", { params: { page, size } });
  return data;
}

export async function createMeeting(input: MeetingInput): Promise<Meeting> {
  const { data } = await http.post<Meeting>("/meetings", input);
  return data;
}

export async function cancelMeeting(id: number): Promise<void> {
  await http.delete(`/meetings/${id}`);
}
