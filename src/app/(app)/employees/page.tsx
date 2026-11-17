"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { EmployeeDetailModal } from "@/components/employees/employee-detail-modal";
import { Pagination } from "@/components/ui/pagination";
import { downloadEmployeeReportPdf, listEmployees } from "@/lib/api/employees";
import { listPositions } from "@/lib/api/positions";
import { extractErrorMessage } from "@/lib/api/client";
import { Employee } from "@/lib/types/staff";

const GENRE_LABEL: Record<string, string> = { HOMME: "Homme", FEMME: "Femme" };

export default function EmployeesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["employees", page],
    queryFn: () => listEmployees(page, 20),
  });
  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: () => listPositions(0, 200),
  });

  const positionTitleById = new Map((positions?.items ?? []).map((p) => [p.id, p.title]));

  async function handleDownloadReport() {
    try {
      await downloadEmployeeReportPdf();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec de la génération du rapport"));
    }
  }

  return (
    <div>
      <PageHeader
        title="Employés"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadReport}>
              Télécharger le rapport PDF
            </Button>
            <Link href="/employees/new">
              <Button>Nouvel employé</Button>
            </Link>
          </div>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                {["Matricule", "Nom et prénom", "Genre", "Poste", "Téléphone", "Statut", ""].map((label) => (
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
                  <TableCell colSpan={7} className="px-5 py-4 text-sm text-gray-500">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : null}
              {data?.items.map((employee) => (
                <TableRow
                  key={employee.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                    {employee.matricule}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                    {employee.lastName} {employee.firstName}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {GENRE_LABEL[employee.genre]}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {employee.positionId ? positionTitleById.get(employee.positionId) ?? "—" : "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {employee.phone || "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <StatusBadge
                      label={employee.active ? "Actif" : "Inactif"}
                      tone={employee.active ? "success" : "neutral"}
                    />
                  </TableCell>
                  <TableCell className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <Link href={`/employees/${employee.id}`}>
                        <Button variant="outline" size="sm">
                          Modifier
                        </Button>
                      </Link>
                      <Link href={`/badges?employeeId=${employee.id}`}>
                        <Button variant="secondary" size="sm">
                          Badge
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-4 text-sm text-gray-500">
                    Aucun employé enregistré.
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

      <EmployeeDetailModal
        employee={selectedEmployee}
        positionTitle={selectedEmployee?.positionId ? positionTitleById.get(selectedEmployee.positionId) : undefined}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
}
