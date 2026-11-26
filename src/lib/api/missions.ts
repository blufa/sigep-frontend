import { http } from "@/lib/api/client";
import { PageResponse } from "@/lib/types/pagination";
import { Mission, MissionInput, MissionUpdateInput } from "@/lib/types/mission";

export async function listMissions(params: { employeeId?: number; page?: number; size?: number } = {}): Promise<
  PageResponse<Mission>
> {
  const { data } = await http.get<PageResponse<Mission>>("/missions", {
    params: { page: 0, size: 20, ...params },
  });
  return data;
}

export async function createMission(input: MissionInput): Promise<Mission> {
  const { data } = await http.post<Mission>("/missions", input);
  return data;
}

export async function updateMission(id: number, input: MissionUpdateInput): Promise<Mission> {
  const { data } = await http.put<Mission>(`/missions/${id}`, input);
  return data;
}

export async function cancelMission(id: number): Promise<void> {
  await http.delete(`/missions/${id}`);
}
