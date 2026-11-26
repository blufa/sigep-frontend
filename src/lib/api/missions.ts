import { http } from "@/lib/api/client";
import { PageResponse } from "@/lib/types/pagination";
import { Mission, MissionInput } from "@/lib/types/mission";

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

export async function cancelMission(id: number): Promise<void> {
  await http.delete(`/missions/${id}`);
}
