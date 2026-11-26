"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { EmployeeDetailModal } from "@/components/employees/employee-detail-modal";
import { Pagination } from "@/components/ui/pagination";
import { IdBadge } from "@/components/cards/id-badge";
import { BadgeSheet } from "@/components/cards/badge-sheet";
import { deleteEmployee, downloadEmployeeReportPdf, getEmployeePhotoUrl, listEmployees } from "@/lib/api/employees";
import { getSheetCardViews } from "@/lib/api/badges";
import { listPositions } from "@/lib/api/positions";
import { getOrganization } from "@/lib/api/organization";
import { getOrganizationLogoUrlOrNull } from "@/lib/api/organization-logo";
import { extractErrorMessage } from "@/lib/api/client";
import { Employee } from "@/lib/types/staff";
import { BadgeCardView } from "@/lib/types/badge";

const GENRE_LABEL: Record<string, string> = { HOMME: "Homme", FEMME: "Femme" };

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [badgeCards, setBadgeCards] = useState<BadgeCardView[] | null>(null);
  const [badgePhotoUrls, setBadgePhotoUrls] = useState<(string | null)[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);

  // Léger délai avant d'interroger l'API le temps que l'utilisateur finisse de taper, pour ne pas
  // déclencher une requête à chaque frappe.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ["employees", page, search],
    queryFn: () => listEmployees(page, 20, search),
  });
  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: () => listPositions(0, 200),
  });
  const { data: organization } = useQuery({
    queryKey: ["organization"],
    queryFn: getOrganization,
  });
  const { data: logoUrl } = useQuery({
    queryKey: ["organization-logo", organization?.hasLogo],
    queryFn: getOrganizationLogoUrlOrNull,
    enabled: Boolean(organization?.hasLogo),
  });

  const positionTitleById = new Map((positions?.items ?? []).map((p) => [p.id, p.title]));
  const pageIds = data?.items.map((e) => e.id) ?? [];
  const allOnPageChecked = pageIds.length > 0 && pageIds.every((id) => checkedIds.includes(id));

  function toggleOne(id: number) {
    setCheckedIds((current) => (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]));
  }

  function toggleAllOnPage() {
    setCheckedIds((current) =>
      allOnPageChecked ? current.filter((id) => !pageIds.includes(id)) : [...new Set([...current, ...pageIds])],
    );
  }

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      toast.success("Employé supprimé");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de la suppression")),
  });

  function handleDelete(employee: Employee) {
    if (window.confirm(`Supprimer définitivement ${employee.lastName} ${employee.firstName} ?`)) {
      deleteMutation.mutate(employee.id);
    }
  }

  async function handleDownloadReport() {
    try {
      await downloadEmployeeReportPdf();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec de la génération du rapport"));
    }
  }

  /** Génère et affiche directement les badges des employés choisis (planche si plusieurs) — comme
   * sur lacaeducation-ui, sans quitter la liste des employés : un bouton "Badges" suffit. */
  async function showBadges(employeeIds: number[]) {
    if (employeeIds.length === 0) return;
    setIsLoadingBadges(true);
    try {
      const cards = await getSheetCardViews(employeeIds);
      const photoUrls = await Promise.all(employeeIds.map((id) => getEmployeePhotoUrl(id)));
      setBadgeCards(cards);
      setBadgePhotoUrls(photoUrls);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de générer le badge"));
    } finally {
      setIsLoadingBadges(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Employés"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => showBadges(checkedIds)}
              disabled={checkedIds.length === 0 || isLoadingBadges}
            >
              <Printer className="mr-1.5 h-4 w-4" /> Badges{checkedIds.length > 0 ? ` (${checkedIds.length})` : ""}
            </Button>
            <Button variant="outline" onClick={handleDownloadReport}>
              Télécharger le rapport PDF
            </Button>
            <Link href="/employees/new">
              <Button>Nouvel employé</Button>
            </Link>
          </div>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher par nom, matricule ou téléphone…"
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={allOnPageChecked}
                    onChange={toggleAllOnPage}
                    aria-label="Tout sélectionner"
                  />
                </TableCell>
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
                  <TableCell colSpan={8} className="px-5 py-4 text-sm text-gray-500">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : null}
              {data?.items.map((employee) => (
                <TableRow key={employee.id} className="cursor-pointer">
                  <TableCell className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checkedIds.includes(employee.id)}
                      onChange={() => toggleOne(employee.id)}
                      aria-label={`Sélectionner ${employee.lastName} ${employee.firstName}`}
                    />
                  </TableCell>
                  <TableCell
                    className="px-5 py-4 text-sm text-gray-800 dark:text-white/90"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    {employee.matricule}
                  </TableCell>
                  <TableCell
                    className="px-5 py-4 text-sm text-gray-800 dark:text-white/90"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    {employee.lastName} {employee.firstName}
                  </TableCell>
                  <TableCell
                    className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    {GENRE_LABEL[employee.genre]}
                  </TableCell>
                  <TableCell
                    className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    {employee.positionId ? positionTitleById.get(employee.positionId) ?? "—" : "—"}
                  </TableCell>
                  <TableCell
                    className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    {employee.phone || "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4" onClick={() => setSelectedEmployee(employee)}>
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
                      <Button variant="secondary" size="sm" onClick={() => showBadges([employee.id])}>
                        Badge
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-error-600 hover:bg-error-50"
                        onClick={() => handleDelete(employee)}
                        disabled={deleteMutation.isPending}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-5 py-4 text-sm text-gray-500">
                    {search ? "Aucun employé ne correspond à cette recherche." : "Aucun employé enregistré."}
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

      <Modal isOpen={!!badgeCards} onClose={() => setBadgeCards(null)} className="max-w-4xl p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
          {badgeCards && badgeCards.length > 1 ? "Planche de badges" : "Badge"}
        </h2>
        {badgeCards && badgeCards.length === 1 ? (
          <IdBadge card={badgeCards[0]} logoUrl={logoUrl} photoUrl={badgePhotoUrls[0]} />
        ) : null}
        {badgeCards && badgeCards.length > 1 ? (
          <BadgeSheet cards={badgeCards} logoUrl={logoUrl} photoUrls={badgePhotoUrls} />
        ) : null}
      </Modal>
    </div>
  );
}
