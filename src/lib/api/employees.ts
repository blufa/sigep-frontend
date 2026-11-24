import { http } from "@/lib/api/client";
import { PageResponse } from "@/lib/types/pagination";
import { Employee, EmployeeInput } from "@/lib/types/staff";

export async function listEmployees(page = 0, size = 50, q?: string): Promise<PageResponse<Employee>> {
  const { data } = await http.get<PageResponse<Employee>>("/employees", {
    params: { page, size, q: q && q.trim() ? q.trim() : undefined },
  });
  return data;
}

export async function getEmployee(id: number): Promise<Employee> {
  const { data } = await http.get<Employee>(`/employees/${id}`);
  return data;
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  const { data } = await http.post<Employee>("/employees", input);
  return data;
}

export async function updateEmployee(id: number, input: EmployeeInput): Promise<Employee> {
  const { data } = await http.put<Employee>(`/employees/${id}`, input);
  return data;
}

export async function uploadEmployeePhoto(id: number, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  await http.post(`/employees/${id}/photo`, formData, { headers: { "Content-Type": "multipart/form-data" } });
}

export async function getEmployeePhotoUrl(id: number): Promise<string | null> {
  try {
    const { data } = await http.get<Blob>(`/employees/${id}/photo`, { responseType: "blob" });
    return URL.createObjectURL(data);
  } catch {
    return null;
  }
}

export async function downloadEmployeeReportPdf(): Promise<void> {
  const { data } = await http.get<Blob>("/employees/report", { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = "rapport-employes.pdf";
  link.click();
  URL.revokeObjectURL(url);
}
