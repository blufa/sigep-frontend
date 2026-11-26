"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { Camera, FileText, Flag, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { SelectSearch } from "@/components/ui/select-search";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { PdfPreviewModal } from "@/components/ui/pdf-preview-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/page-header";
import {
  getAttendanceHistory,
  getAttendancePunchPhotoUrl,
  getDailyAttendanceStatus,
  getEmployeeMonthlyAttendanceReportPdfBlobUrl,
} from "@/lib/api/attendance";
import { listEmployees } from "@/lib/api/employees";
import { extractErrorMessage } from "@/lib/api/client";
import { AttendanceEntry, DailyStatus } from "@/lib/types/attendance";

const STATUS_LABEL: Record<DailyStatus, string> = {
  PRESENT: "Présent",
  ABSENT: "Absent",
  RETARD: "Retard",
  EN_MISSION: "En mission",
};
const STATUS_TONE: Record<DailyStatus, "success" | "danger" | "accent" | "neutral"> = {
  PRESENT: "success",
  ABSENT: "danger",
  RETARD: "accent",
  EN_MISSION: "neutral",
};

export default function AttendanceHistoryPage() {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"" | DailyStatus>("");
  const [statusDay, setStatusDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(0);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  const [viewingPhotoName, setViewingPhotoName] = useState<string | null>(null);
  const [printEntries, setPrintEntries] = useState<AttendanceEntry[] | null>(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const shouldPrintRef = useRef(false);
  const [reportMonth, setReportMonth] = useState(dayjs().format("YYYY-MM"));
  const [employeeReportPdfUrl, setEmployeeReportPdfUrl] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => listEmployees(0, 200),
  });

  const from = dateFrom ? dayjs(dateFrom).startOf("day").toISOString() : undefined;
  const to = dateTo ? dayjs(dateTo).endOf("day").toISOString() : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["attendance-history", employeeId, dateFrom, dateTo, page],
    queryFn: () =>
      getAttendanceHistory({
        employeeId: employeeId ? Number(employeeId) : undefined,
        from,
        to,
        page,
        size: 10,
      }),
    enabled: !statusFilter,
  });

  // Vue distincte de l'historique brut : un employé absent n'a aucun pointage à lister, donc le
  // filtre par statut (Présent/Absent/Retard) nécessite de couvrir TOUS les employés actifs pour un
  // jour précis plutôt que de filtrer des lignes de pointage qui n'existent pas pour les absents.
  const { data: statusData, isLoading: isStatusLoading } = useQuery({
    queryKey: ["attendance-daily-status", statusDay, statusFilter, page],
    queryFn: () => getDailyAttendanceStatus({ date: statusDay, status: statusFilter || undefined, page, size: 10 }),
    enabled: !!statusFilter,
  });

  function handleEmployeeChange(value: string) {
    setEmployeeId(value);
    setPage(0);
  }

  function handleDateFromChange(value: string) {
    setDateFrom(value);
    setPage(0);
  }

  function handleDateToChange(value: string) {
    setDateTo(value);
    setPage(0);
  }

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value as "" | DailyStatus);
    setPage(0);
  }

  function handleStatusDayChange(value: string) {
    setStatusDay(value);
    setPage(0);
  }

  const visibleEntries = flaggedOnly ? (data?.items ?? []).filter((entry) => entry.flagged) : (data?.items ?? []);
  const selectedEmployeeLabel = employees?.items.find((e) => String(e.id) === employeeId);

  // Déclenché une fois que `printEntries` (liste complète, non paginée, pour les critères actuels)
  // est en place — on ne peut pas appeler window.print() juste après setPrintEntries() dans
  // handlePrint, le rendu du bloc d'impression n'aurait pas encore eu lieu.
  useEffect(() => {
    if (shouldPrintRef.current && printEntries) {
      shouldPrintRef.current = false;
      window.print();
    }
  }, [printEntries]);

  async function handlePrint() {
    setIsPreparingPrint(true);
    try {
      const full = await getAttendanceHistory({
        employeeId: employeeId ? Number(employeeId) : undefined,
        from,
        to,
        page: 0,
        size: 10000,
      });
      shouldPrintRef.current = true;
      setPrintEntries(flaggedOnly ? full.items.filter((entry) => entry.flagged) : full.items);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec de la préparation de l'impression"));
    } finally {
      setIsPreparingPrint(false);
    }
  }

  async function handleGenerateEmployeeReport() {
    if (!employeeId) return;
    const [year, month] = reportMonth.split("-").map(Number);
    setIsGeneratingReport(true);
    try {
      const url = await getEmployeeMonthlyAttendanceReportPdfBlobUrl(Number(employeeId), year, month);
      setEmployeeReportPdfUrl(url);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec de la génération du rapport"));
    } finally {
      setIsGeneratingReport(false);
    }
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
      <div className="print:hidden">
        <PageHeader
          title="Pointage"
          actions={
            <Button variant="outline" onClick={handlePrint} disabled={isPreparingPrint}>
              <Printer className="h-4 w-4" /> {isPreparingPrint ? "Préparation…" : "Imprimer"}
            </Button>
          }
        />
      </div>

      <Card className="mb-6 print:hidden">
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <Label htmlFor="filter-date-from">Du</Label>
            <Input
              id="filter-date-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => handleDateFromChange(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="filter-date-to">Au</Label>
            <Input
              id="filter-date-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => handleDateToChange(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={flaggedOnly}
              onChange={(e) => setFlaggedOnly(e.target.checked)}
            />
            Pointages signalés uniquement
          </label>
          <div>
            <Label htmlFor="filter-status">Statut</Label>
            <Select id="filter-status" value={statusFilter} onChange={(e) => handleStatusFilterChange(e.target.value)}>
              <option value="">Tous (historique des pointages)</option>
              <option value="PRESENT">Présents</option>
              <option value="ABSENT">Absents</option>
              <option value="RETARD">En retard</option>
              <option value="EN_MISSION">En mission</option>
            </Select>
          </div>
          {statusFilter ? (
            <div>
              <Label htmlFor="filter-status-day">Jour</Label>
              <Input
                id="filter-status-day"
                type="date"
                value={statusDay}
                onChange={(e) => handleStatusDayChange(e.target.value)}
              />
            </div>
          ) : null}
        </div>
        {employeeId ? (
          <div className="flex flex-wrap items-end gap-3 border-t border-gray-100 p-4 dark:border-gray-800">
            <div>
              <Label htmlFor="report-month">Rapport de présence — mois</Label>
              <Input
                id="report-month"
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="w-44"
              />
            </div>
            <Button variant="outline" onClick={handleGenerateEmployeeReport} disabled={isGeneratingReport}>
              <FileText className="h-4 w-4" /> {isGeneratingReport ? "Génération…" : "Générer le rapport de l'employé"}
            </Button>
          </div>
        ) : null}
      </Card>

      {statusFilter ? (
        <Card className="print:hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  {["Employé", "Matricule", "Poste", "Statut", "Entrée", "Sortie"].map((label) => (
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
                {isStatusLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-4 text-sm text-gray-500">
                      Chargement…
                    </TableCell>
                  </TableRow>
                ) : null}
                {statusData?.items.map((entry) => (
                  <TableRow key={entry.employeeId}>
                    <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{entry.fullName}</TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{entry.matricule}</TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {entry.positionTitle ?? "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <StatusBadge label={STATUS_LABEL[entry.status]} tone={STATUS_TONE[entry.status]} />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {entry.firstEntree ? dayjs(entry.firstEntree).format("HH:mm:ss") : "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {entry.lastSortie ? dayjs(entry.lastSortie).format("HH:mm:ss") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {!isStatusLoading && statusData?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-4 text-sm text-gray-500">
                      Aucun employé ne correspond à ce statut pour ce jour.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          {statusData ? (
            <Pagination
              page={statusData.page}
              totalPages={statusData.totalPages}
              totalElements={statusData.totalItems}
              onPageChange={setPage}
            />
          ) : null}
        </Card>
      ) : (
        <Card className="print:hidden">
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
                {visibleEntries.map((entry) => (
                  <TableRow key={entry.id} className={entry.flagged ? "bg-error-50/40 dark:bg-error-500/5" : undefined}>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {dayjs(entry.scannedAt).format("DD/MM/YYYY HH:mm:ss")}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                      {entry.matricule ?? "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                      {entry.fullName}
                      {entry.flagged ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-error-600">
                          <Flag className="h-3 w-3" /> Signalé
                        </span>
                      ) : null}
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
                {!isLoading && visibleEntries.length === 0 ? (
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
      )}

      {/* Visible uniquement à l'impression — liste complète (non paginée) correspondant aux
          filtres actuels, voir handlePrint. */}
      {printEntries ? (
        <div className="hidden print:block">
          <div className="mb-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              République de Guinée — MENET-FP · SIGAP
            </p>
            <h1 className="mt-1 text-lg font-semibold text-gray-800">Historique des pointages</h1>
            <p className="mt-1 text-xs text-gray-500">
              {selectedEmployeeLabel ? `${selectedEmployeeLabel.lastName} ${selectedEmployeeLabel.firstName}` : "Tous les employés"}
              {dateFrom || dateTo
                ? ` — du ${dateFrom ? dayjs(dateFrom).format("DD/MM/YYYY") : "début"} au ${dateTo ? dayjs(dateTo).format("DD/MM/YYYY") : "aujourd'hui"}`
                : ""}
              {flaggedOnly ? " — signalés uniquement" : ""}
              {" · Édité le "}
              {dayjs().format("DD/MM/YYYY HH:mm")}
            </p>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-800">
                {["Date et heure", "Matricule", "Employé", "Sens", "Source"].map((label) => (
                  <th key={label} className="px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {printEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-200">
                  <td className="px-2 py-1.5">{dayjs(entry.scannedAt).format("DD/MM/YYYY HH:mm:ss")}</td>
                  <td className="px-2 py-1.5">{entry.matricule ?? "—"}</td>
                  <td className="px-2 py-1.5">
                    {entry.fullName}
                    {entry.flagged ? " (signalé)" : ""}
                  </td>
                  <td className="px-2 py-1.5">{entry.direction === "ENTREE" ? "Entrée" : "Sortie"}</td>
                  <td className="px-2 py-1.5">{entry.source}</td>
                </tr>
              ))}
              {printEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
                    Aucun pointage pour ces critères.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

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

      <PdfPreviewModal
        isOpen={employeeReportPdfUrl !== null}
        onClose={() => {
          if (employeeReportPdfUrl) URL.revokeObjectURL(employeeReportPdfUrl);
          setEmployeeReportPdfUrl(null);
        }}
        pdfUrl={employeeReportPdfUrl}
        title={`Rapport de présence — ${selectedEmployeeLabel ? `${selectedEmployeeLabel.lastName} ${selectedEmployeeLabel.firstName}` : ""}`}
        onDownload={() => {
          if (!employeeReportPdfUrl) return;
          const link = document.createElement("a");
          link.href = employeeReportPdfUrl;
          link.download = "rapport-presence-employe.pdf";
          link.click();
        }}
      />
    </div>
  );
}
