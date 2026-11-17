import { http } from "@/lib/api/client";
import { PageResponse } from "@/lib/types/pagination";
import { Position, PositionInput } from "@/lib/types/staff";

export async function listPositions(page = 0, size = 50): Promise<PageResponse<Position>> {
  const { data } = await http.get<PageResponse<Position>>("/positions", { params: { page, size } });
  return data;
}

export async function createPosition(input: PositionInput): Promise<Position> {
  const { data } = await http.post<Position>("/positions", input);
  return data;
}

export async function updatePosition(id: number, input: PositionInput): Promise<Position> {
  const { data } = await http.put<Position>(`/positions/${id}`, input);
  return data;
}
