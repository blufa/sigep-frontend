"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Camera } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SelectSearch } from "@/components/ui/select-search";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { getAttendanceHistory, getAttendancePunchPhotoUrl } from "@/lib/api/attendance";
import { listEmployees } from "@/lib/api/employees";

export default function AttendanceHistoryPage() {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [page, setPage] = useState(0);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  const [viewingPhotoName, setViewingPhotoName] = useState<string | null>(null);

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => listEmployees(0, 200),
  });

  const from = date ? dayjs(date).startOf("day").toISOString() : undefined;
  const to = date ? dayjs(date).endOf("day").toISOString() : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["attendance-history", employeeId, date, page],
    queryFn: () =>
      getAttendanceHistory({
        employeeId: employeeId ? Number(employeeId) : undefined,
        from,
        to,
        page,
        size: 20,
      }),
  });

  function handleEmployeeChange(value: string) {
    setEmployeeId(value);
    setPage(0);
  }

  function handleDateChange(value: string) {
    setDate(value);
    setPage(0);
  }

  async function handleViewPhoto(punchId: number, fullName: string) {
    const url = await getAttendancePunchPhotoUrl(punchId);
    if (url) {
      setViewingPhotoUrl(url);
      setViewingPhotoName(fullName);
    }
  }

  return (
    <div>
      <PageHeader title="Pointage" />

      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="filter-employee">Employé</Label>
            <SelectSearch
              id="filter-employee"
              value={employeeId}
              onChange={handleEmployeeChange}
              placeholder="Rechercher un employé…"
              emptyLabel="Tous les employés"
              options={(employees?.items ?? []).map((employee) => ({
                value: String(employee.id),
                label: `${employee.lastName} ${employee.firstName}`,
              }))}
            />
          </div>
          <div>
            <Label htmlFor="filter-date">Date</Label>
            <Input id="filter-date" type="date" value={date} onChange={(e) => handleDateChange(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                {["Date et heure", "Matricule", "Employé", "Sens", "Source", "Preuve"].map((label) => (
                  <TableCell
                    key={label}
                    isHeader
                    className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-4 text-sm text-gray-500">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : null}
              {data?.items.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {dayjs(entry.scannedAt).format("DD/MM/YYYY HH:mm:ss")}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                    {entry.matricule ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                    {entry.fullName}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <StatusBadge
                      label={entry.direction === "ENTREE" ? "Entrée" : "Sortie"}
                      tone={entry.direction === "ENTREE" ? "success" : "accent"}
                    />
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {entry.source}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {entry.hasPhoto ? (
                      <button
                        type="button"
                        onClick={() => handleViewPhoto(entry.id, entry.fullName)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                      >
                        <Camera className="h-3.5 w-3.5" /> Voir
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-4 text-sm text-gray-500">
                    Aucun pointage pour ces critères.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
        {data ? (
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalItems} onPageChange={setPage} />
        ) : null}
      </Card>

      <Modal
        isOpen={viewingPhotoUrl !== null}
        onClose={() => {
          setViewingPhotoUrl(null);
          setViewingPhotoName(null);
        }}
        className="max-w-md p-6"
      >
        <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">
          Photo prise au pointage — {viewingPhotoName}
        </h2>
        {viewingPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={viewingPhotoUrl} alt={`Pointage de ${viewingPhotoName}`} className="w-full rounded-lg" />
        ) : null}
      </Modal>
    </div>
  );
}
